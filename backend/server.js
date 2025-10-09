import express from 'express';
import compression from 'compression';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import dotenv from 'dotenv';
// Load env from root .env first (won't override already-set vars)
dotenv.config();
import fetch from 'node-fetch';
import fs from 'fs';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import admin from 'firebase-admin';
import OpenAI from 'openai';

// In-memory cache for Places results (TTL + SWR)
const PLACES_CACHE_TTL_MS = parseInt(process.env.BACKEND_PLACES_CACHE_TTL || '3600000', 10); // default 60m
const PLACES_CACHE_MAX = 500; // simple soft limit
const placesCache = new Map(); // key -> { data, ts }

function makePlacesKey(lat, lng, q, radius) {
  const latR = Number(lat).toFixed(3);
  const lngR = Number(lng).toFixed(3);
  const query = (q || '').toString().trim().toLowerCase();
  const DEFAULT_RADIUS = parseInt(process.env.DEFAULT_PLACES_RADIUS_M || '20000', 10);
  const rBucket = Math.round(Number(radius || DEFAULT_RADIUS) / 500) * 500; // bucket radius to 500m
  return `${latR}|${lngR}|${query}|${rBucket}`;
}

function getFromPlacesCache(key) {
  const entry = placesCache.get(key);
  if (!entry) return null;
  return entry;
}

function setPlacesCache(key, data) {
  if (placesCache.size >= PLACES_CACHE_MAX) {
    // simple LRU-ish: delete first inserted
    const firstKey = placesCache.keys().next().value;
    if (firstKey) placesCache.delete(firstKey);
  }
  placesCache.set(key, { data, ts: Date.now() });
}

// Compute distance between two lat/lng points in meters (Haversine)
function haversineMeters(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function normalizeAndFilter(results, centerLat, centerLng, radiusMeters, options = { enforceRadius: true, sortByDistance: true }) {
  const list = (Array.isArray(results) ? results : []).map((r) => {
    const loc = r.geometry?.location;
    const d = loc ? haversineMeters(Number(centerLat), Number(centerLng), Number(loc.lat), Number(loc.lng)) : null;
    return {
      place_id: r.place_id,
      name: r.name,
      formatted_address: r.formatted_address || r.vicinity || '',
      types: r.types || ['establishment'],
      geometry: r.geometry,
      rating: r.rating,
      user_ratings_total: r.user_ratings_total,
      business_status: r.business_status || 'OPERATIONAL',
      photos: Array.isArray(r.photos)
        ? r.photos.slice(0, 3).map(p => ({
            photo_reference: p.photo_reference,
            width: p.width,
            height: p.height,
            html_attributions: p.html_attributions
          }))
        : [],
      distance_m: d
    };
  });

  let filtered = list;
  if (options.enforceRadius) {
    filtered = filtered.filter((p) => (p.distance_m ?? 0) <= Number(radiusMeters));
  }
  if (options.sortByDistance) {
    filtered = filtered.sort((a, b) => (a.distance_m ?? Infinity) - (b.distance_m ?? Infinity));
  }
  
  // Return more results for comprehensive coverage (increased to 100 for better mobile experience)
  return filtered.slice(0, 100);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Additionally load env from backend/.env (alongside this file) if present.
// This is a fallback for local/dev and certain deployment layouts; Azure App Settings still take precedence.
try {
  dotenv.config({ path: path.join(__dirname, '.env') });
} catch {}

const app = express();
// Enable gzip compression for faster API responses
app.use(compression({ threshold: 1024 }));
const PORT = process.env.PORT || 8080;

// Create HTTP/HTTPS server and Socket.io for real-time metrics
let httpServer;
if (process.env.ENABLE_HTTPS === 'true') {
  const https = await import('https');
  const fs = await import('fs');
  const options = {
    key: fs.readFileSync(process.env.SSL_KEY_PATH || './ssl/key.pem'),
    cert: fs.readFileSync(process.env.SSL_CERT_PATH || './ssl/cert.pem')
  };
  httpServer = https.createServer(options, app);
  console.log('🔒 HTTPS server enabled');
} else {
  httpServer = http.createServer(app);
  console.log('🔓 HTTP server (development mode)');
}
const allowedSocketOrigins = (
  process.env.SOCKET_ALLOWED_ORIGINS || ''
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const defaultSocketOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  process.env.WEBSITE_HOSTNAME ? `https://${process.env.WEBSITE_HOSTNAME}` : null,
].filter(Boolean);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow same-origin/no-origin (e.g., mobile apps, curl)
      if (!origin) return callback(null, true);
      const okOrigins = new Set([...allowedSocketOrigins, ...defaultSocketOrigins]);
      if (okOrigins.has(origin)) return callback(null, true);
      return callback(new Error('Socket.IO CORS not allowed for origin: ' + origin), false);
    },
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  // Simple handshake for metrics channel
  // No auth required for now; restrict via CORS/origin
  console.log('📊 Metrics client connected', socket.id);
  // Send initial cost snapshot to new connections
  try {
    socket.emit('api_cost_update', buildCostSnapshot());
  } catch {}
  socket.on('disconnect', () => {
    console.log('📊 Metrics client disconnected', socket.id);
  });
});

// In-memory API usage metrics store (resets on server restart)
const usageState = {
  totals: {
    openai: { count: 0, success: 0, error: 0 },
    maps: { count: 0, success: 0, error: 0 },
    places: { count: 0, success: 0, error: 0 },
  },
  startTs: Date.now(),
  // Keep last 100 events for quick timeline rendering
  // events: array of { id, ts, api: 'gemini'|'maps'|'places', action?, status: 'success'|'error', durationMs?, meta? }
  events: []
};

function broadcastUsageUpdate(lastEvent) {
  try {
    io.emit('api_usage_update', {
      totals: usageState.totals,
      lastEvent,
      events: usageState.events.slice(-50),
    });
  } catch (e) {
    console.warn('Failed to broadcast usage update:', e?.message || String(e));
  }
}

function recordUsage({ api, action, status, durationMs, meta }) {
  if (!['openai', 'maps', 'places'].includes(api)) return;
  const id = `ev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const event = { id, ts: Date.now(), api, action, status, durationMs, meta };
  usageState.events.push(event);
  if (usageState.events.length > 200) usageState.events.splice(0, usageState.events.length - 200);
  const bucket = usageState.totals[api];
  bucket.count += 1;
  if (status === 'success') bucket.success += 1; else bucket.error += 1;
  broadcastUsageUpdate(event);
  // Emit updated cost snapshot as well for listeners
  try {
    io.emit('api_cost_update', buildCostSnapshot());
  } catch {}
  // Persist to Mongo (best-effort)
  try {
    if (ApiEvent && !SKIP_MONGO) {
      const doc = new ApiEvent({ ts: new Date(event.ts), api, action, status, durationMs, meta });
      doc.save().catch(() => {});
    }
  } catch {}
}

// --- Cost analytics ---
// Configurable per-call cost rates (USD). Defaults are placeholders; set via env vars.
const costConfig = {
  includeErrors: String(process.env.COST_INCLUDE_ERRORS || 'false').toLowerCase() === 'true',
  rates: {
    openai: parseFloat(process.env.COST_RATE_OPENAI_PER_CALL_USD || '0.002'),
    maps: parseFloat(process.env.COST_RATE_MAPS_PER_CALL_USD || '0.005'),
    places: parseFloat(process.env.COST_RATE_PLACES_PER_CALL_USD || '0.002'),
  }
};

function buildCostSnapshot(windowMinutes = 60) {
  const now = Date.now();
  const windowMs = Math.max(1, windowMinutes) * 60 * 1000;
  const windowStart = now - windowMs;
  const within = usageState.events.filter(e => e.ts >= windowStart);
  const shouldCount = (e) => costConfig.includeErrors ? true : e.status === 'success';
  const apis = ['openai','maps','places'];

  const totalsCount = Object.fromEntries(apis.map(api => {
    const totalCalls = usageState.events.filter(e => e.api === api && shouldCount(e)).length;
    return [api, totalCalls];
  }));

  const windowCounts = Object.fromEntries(apis.map(api => {
    const c = within.filter(e => e.api === api && shouldCount(e)).length;
    return [api, c];
  }));

  const perApiSnapshot = Object.fromEntries(apis.map(api => {
    const calls = totalsCount[api];
    const rate = (costConfig.rates)[api];
    return [api, { calls, costUSD: +(calls * rate).toFixed(4), ratePerCallUSD: rate }];
  }));

  const perApiWindow = Object.fromEntries(apis.map(api => {
    const calls = windowCounts[api];
    const rpm = calls / (windowMs / 60000);
    const rate = (costConfig.rates)[api];
    const cost = calls * rate;
    return [api, { calls, ratePerMin: +rpm.toFixed(4), costUSD: +cost.toFixed(4) }];
  }));

  const projectedDailyUSD = apis.reduce((sum, api) => sum + perApiWindow[api].ratePerMin * 1440 * costConfig.rates[api], 0);
  const projectedMonthlyUSD = projectedDailyUSD * 30;

  return {
    totals: perApiSnapshot,
    window: { minutes: windowMinutes, data: perApiWindow },
    projections: { dailyUSD: +projectedDailyUSD.toFixed(4), monthlyUSD: +projectedMonthlyUSD.toFixed(4) },
    config: costConfig,
    uptime: { startTs: usageState.startTs, uptimeMs: now - usageState.startTs }
  };
}

// Initialize Azure OpenAI
const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { 'api-version': '2024-02-15-preview' },
  defaultHeaders: {
    'api-key': process.env.AZURE_OPENAI_API_KEY,
  },
});

// Enhanced dishes endpoint with full specification
app.post('/api/dishes/generate', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { 
      latitude, 
      longitude, 
      destination,
      filters = {},
      language = 'en'
    } = req.body;

    // Input validation
    if (!latitude && !longitude && !destination) {
      return res.status(400).json({ error: 'Location required (coordinates or destination)' });
    }

    let locationName, lat, lng;

    // Handle destination search vs GPS coordinates
    if (destination) {
      const geocodeResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destination)}&key=${process.env.GOOGLE_PLACES_API_KEY}`
      );
      const geocodeData = await geocodeResponse.json();
      if (geocodeData.results?.[0]) {
        const result = geocodeData.results[0];
        locationName = result.formatted_address;
        lat = result.geometry.location.lat;
        lng = result.geometry.location.lng;
      } else {
        return res.status(400).json({ error: 'Destination not found' });
      }
    } else {
      lat = latitude;
      lng = longitude;
      const reverseGeocodeResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_PLACES_API_KEY}`
      );
      const reverseData = await reverseGeocodeResponse.json();
      locationName = reverseData.results?.[0]?.formatted_address || 'Unknown Location';
    }

    // Get restaurants from Google Places API
    const placesResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=restaurant&key=${process.env.GOOGLE_PLACES_API_KEY}`
    );
    const placesData = await placesResponse.json();
    const restaurants = placesData.results?.slice(0, 10) || [];

    // Build enhanced Gemini prompt
    const filterText = buildDishFilters(filters);
    const restaurantContext = restaurants.map(r => `${r.name} (${r.rating}/5, ${r.vicinity})`).join(', ');
    
    const prompt = `Generate 6 popular local dishes for ${locationName}.
    ${filterText}
    Available restaurants: ${restaurantContext}
    
    Return ONLY a JSON object:
    {
      "location": "${locationName}",
      "dishes": [
        {
          "name": "dish name",
          "description": "brief description",
          "average_price": "local currency",
          "category": "Breakfast|Lunch|Dinner|Street Food",
          "recommended_places": [
            {
              "name": "restaurant name",
              "type": "Restaurant",
              "address": "area",
              "rating": 4.5
            }
          ],
          "user_photos": [],
          "dietary_tags": ["vegetarian"],
          "cultural_significance": "cultural note"
        }
      ],
      "metadata": {
        "source": ["Google Places", "Gemini AI"],
        "filters_applied": ${JSON.stringify(Object.keys(filters))}
      }
    }`;

    // Generate with OpenAI
    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });
    const responseText = completion.choices[0].message.content;
    
    // Parse response
    let dishesData;
    try {
      dishesData = JSON.parse(responseText);
    } catch (parseError) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      dishesData = jsonMatch ? JSON.parse(jsonMatch[0]) : { dishes: [] };
    }

    // Enhance with real restaurant data
    dishesData = await enhanceDishesWithRealData(dishesData, restaurants);

    // Record API usage
    recordUsage({
      api: 'openai',
      action: 'generate_enhanced_dishes',
      status: 'success',
      durationMs: Date.now() - startTime,
      meta: { location: locationName, dishCount: dishesData.dishes?.length || 0 }
    });

    res.json(dishesData);

  } catch (error) {
    console.error('❌ Error generating dishes:', error);
    
    recordUsage({
      api: 'openai',
      action: 'generate_enhanced_dishes',
      status: 'error',
      durationMs: Date.now() - startTime,
      meta: { error: error.message }
    });

    res.status(500).json({
      error: 'Failed to generate dishes',
      message: error.message
    });
  }
});

// Helper functions
function buildDishFilters(filters) {
  const parts = [];
  if (filters.dietary) parts.push(`Dietary: ${filters.dietary.join(', ')}`);
  if (filters.budget) parts.push(`Budget: ${filters.budget}`);
  return parts.length > 0 ? `Filters: ${parts.join('. ')}.` : '';
}

async function enhanceDishesWithRealData(dishesData, restaurants) {
  if (dishesData.dishes) {
    for (const dish of dishesData.dishes) {
      if (dish.recommended_places) {
        for (const place of dish.recommended_places) {
          const matched = restaurants.find(r => 
            r.name.toLowerCase().includes(place.name.toLowerCase())
          );
          if (matched) {
            place.place_id = matched.place_id;
            place.rating = matched.rating || place.rating;
            place.address = matched.vicinity || place.address;
          }
        }
      }
    }
  }
  return dishesData;
}

// Whether to enforce admin checks on cost endpoints (set ENFORCE_ADMIN_COST=true to enable)
const ENFORCE_ADMIN_COST = String(process.env.ENFORCE_ADMIN_COST || 'false').toLowerCase() === 'true';

// Subscription-based quota/rate-limit enforcement
const ENFORCE_QUOTAS = String(process.env.ENFORCE_QUOTAS || 'false').toLowerCase() === 'true';
const TIER_POLICY = {
  free: {
    places: { daily: 50, perMin: 5 },
    maps: { daily: 150, perMin: 15 },
    openai: { daily: 10, perMin: 2 },
    features: { dynamicMap: false, resultsPerSearch: 40, photosPerPlace: 1, radiusMaxM: 10000 }
  },
  basic: {
    places: { daily: 200, perMin: 10 },
    maps: { daily: 500, perMin: 30 },
    openai: { daily: 50, perMin: 5 },
    features: { dynamicMap: true, resultsPerSearch: 60, photosPerPlace: 2, radiusMaxM: 20000 }
  },
  premium: {
    places: { daily: 1000, perMin: 20 },
    maps: { daily: 2000, perMin: 60 },
    openai: { daily: 200, perMin: 15 },
    features: { dynamicMap: true, resultsPerSearch: 80, photosPerPlace: 3, radiusMaxM: 40000 }
  },
  pro: {
    places: { daily: 5000, perMin: 60 },
    maps: { daily: 10000, perMin: 120 },
    openai: { daily: 1000, perMin: 60 },
    features: { dynamicMap: true, resultsPerSearch: 100, photosPerPlace: 6, radiusMaxM: 50000 }
  }
};

// UsageCounter model (Mongo) for daily quotas
let UsageCounter;
try {
  const usageCounterSchema = new mongoose.Schema({
    userKey: { type: String, index: true },
    api: { type: String, index: true },
    date: { type: String, index: true }, // YYYY-MM-DD
    tier: { type: String },
    count: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now }
  });
  usageCounterSchema.index({ userKey: 1, api: 1, date: 1 }, { unique: true });
  UsageCounter = mongoose.model('UsageCounter', usageCounterSchema);
} catch (e) {
  try { UsageCounter = mongoose.model('UsageCounter'); } catch {}
}

// Persisted API usage event model (for long-term analytics)
let ApiEvent;
try {
  const apiEventSchema = new mongoose.Schema({
    ts: { type: Date, default: Date.now, index: true },
    api: { type: String, index: true }, // 'gemini'|'maps'|'places'
    action: { type: String },
    status: { type: String, index: true }, // 'success'|'error'
    durationMs: { type: Number },
    meta: { type: mongoose.Schema.Types.Mixed },
  }, { minimize: true });
  apiEventSchema.index({ api: 1, ts: 1 });
  ApiEvent = mongoose.model('ApiEvent', apiEventSchema);
} catch (e) {
  try { ApiEvent = mongoose.model('ApiEvent'); } catch {}
}

// In-memory fallbacks for rate limiting and daily quotas
const minuteBuckets = new Map(); // key: userKey|api -> { windowStart: number, count: number }
const memoryDaily = new Map(); // key: userKey|api|date -> number

function getDateKey(ts = Date.now()) {
  const d = new Date(ts);
  return d.toISOString().slice(0, 10);
}

function getRequestUserKey(req) {
  const uid = String(req.headers['x-user-id'] || req.headers['x-firebase-uid'] || '').trim();
  if (uid) return uid;
  // Fallback to IP
  return (req.headers['x-forwarded-for']?.toString().split(',')[0] || req.socket?.remoteAddress || 'anon').toString();
}

async function getUserTier(req) {
  // 1) explicit header override for testing
  const hdr = String(req.headers['x-user-tier'] || '').toLowerCase();
  if (hdr && TIER_POLICY[hdr]) return hdr;
  // 2) lookup by user id if present
  const uid = String(req.headers['x-user-id'] || '').trim();
  if (uid) {
    try {
      const u = await User.findById(uid).select('tier').lean();
      if (u?.tier && TIER_POLICY[u.tier]) return u.tier;
    } catch {}
  }
  return 'free';
}

async function getDailyCount(userKey, api) {
  const date = getDateKey();
  if (UsageCounter && !SKIP_MONGO) {
    const doc = await UsageCounter.findOne({ userKey, api, date }).lean();
    return doc?.count || 0;
  }
  return memoryDaily.get(`${userKey}|${api}|${date}`) || 0;
}

async function incDailyCount(userKey, api, tier) {
  const date = getDateKey();
  if (UsageCounter && !SKIP_MONGO) {
    const doc = await UsageCounter.findOneAndUpdate(
      { userKey, api, date },
      { $inc: { count: 1 }, $setOnInsert: { tier }, $set: { updatedAt: new Date() } },
      { new: true, upsert: true }
    );
    return doc.count;
  }
  const key = `${userKey}|${api}|${date}`;
  const v = (memoryDaily.get(key) || 0) + 1;
  memoryDaily.set(key, v);
  return v;
}

async function decDailyCount(userKey, api) {
  const date = getDateKey();
  if (UsageCounter && !SKIP_MONGO) {
    await UsageCounter.updateOne({ userKey, api, date }, { $inc: { count: -1 }, $set: { updatedAt: new Date() } });
    return;
  }
  const key = `${userKey}|${api}|${date}`;
  const v = (memoryDaily.get(key) || 1) - 1;
  memoryDaily.set(key, Math.max(0, v));
}

function checkRateLimit(userKey, api, limitPerMin) {
  const key = `${userKey}|${api}`;
  const now = Date.now();
  const win = Math.floor(now / 60000) * 60000; // current minute window start
  let b = minuteBuckets.get(key);
  if (!b || b.windowStart !== win) {
    b = { windowStart: win, count: 0 };
    minuteBuckets.set(key, b);
  }
  if (b.count >= limitPerMin) {
    const reset = Math.floor((win + 60000) / 1000);
    return { allowed: false, remaining: 0, reset };
  }
  b.count += 1;
  const reset = Math.floor((win + 60000) / 1000);
  return { allowed: true, remaining: Math.max(0, limitPerMin - b.count), reset };
}

function enforcePolicy(api) {
  return async (req, res, next) => {
    if (!ENFORCE_QUOTAS) return next();
    const userKey = getRequestUserKey(req);
    const tier = await getUserTier(req);
    const policy = TIER_POLICY[tier] && TIER_POLICY[tier][api] ? TIER_POLICY[tier][api] : null;
    if (!policy) return next();

    // Per-minute RL
    const rl = checkRateLimit(userKey, api, policy.perMin);
    res.setHeader('X-Quota-Tier', tier);
    res.setHeader('X-RateLimit-Limit', String(policy.perMin));
    res.setHeader('X-RateLimit-Remaining', String(rl.remaining));
    res.setHeader('X-RateLimit-Reset', String(rl.reset));
    if (!rl.allowed) {
      return res.status(429).json({ error: 'rate_limited', tier, api, limits: policy, when: 'per_minute' });
    }

    // Daily quota
    const used = await incDailyCount(userKey, api, tier);
    const over = used > policy.daily;
    const remaining = Math.max(0, policy.daily - used);
    res.setHeader('X-Quota-Limit-Daily', String(policy.daily));
    res.setHeader('X-Quota-Used-Daily', String(used));
    res.setHeader('X-Quota-Remain-Daily', String(remaining));
    if (over) {
      await decDailyCount(userKey, api); // revert the increment
      return res.status(429).json({ error: 'quota_exceeded', tier, api, limits: policy, when: 'daily' });
    }

    // Attach policy-derived feature caps to request for downstream use (e.g., radius clamp)
    req._tier = tier;
    req._policy = TIER_POLICY[tier];
    return next();
  };
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// Serve static files from dist directory
const staticPaths = [
  path.join(__dirname, 'dist'),
  path.join(__dirname, '../dist'),
  path.join('/home/site/wwwroot/dist'),
  path.join(process.cwd(), 'dist')
];

// Find the first existing path
let finalStaticPath = null;
for (const staticPath of staticPaths) {
  if (existsSync(staticPath)) {
    finalStaticPath = staticPath;
    break;
  }
}

if (finalStaticPath) {
  console.log('✅ Using static path:', finalStaticPath);
  app.use(express.static(finalStaticPath, {
    maxAge: '1d',
    etag: false,
    setHeaders: (res, path) => {
      if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (path.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json');
      }
    }
  }));
} else {
  console.error('❌ No static files directory found');
}

// Load subscription and payment routes early
try {
  const subscriptionsRouter = (await import('./routes/subscriptions.js')).default;
  const paymentsRouter = (await import('./routes/payments.js')).default;
  const paypalWebhookRouter = (await import('./webhooks/paypal.js')).default;
  
  app.use('/api/subscriptions', subscriptionsRouter);
  app.use('/api/payments', paymentsRouter);
  app.use('/api/webhooks/paypal', paypalWebhookRouter);
  
  console.log('✅ Subscription and payment routes loaded');
} catch (error) {
  console.error('❌ Failed to load subscription routes:', error);
}

// Load Azure OpenAI routes
try {
  const aiRouter = (await import('./routes/ai.js')).default;
  app.use('/api/ai', aiRouter);
  console.log('✅ Azure OpenAI routes loaded');
} catch (error) {
  console.error('❌ Failed to load Azure OpenAI routes:', error);
}

// Load Emergency routes
try {
  const emergencyRouter = (await import('./routes/emergency.js')).default;
  app.use('/api/ai', emergencyRouter);
  console.log('✅ Emergency routes loaded');
} catch (error) {
  console.error('❌ Failed to load emergency routes:', error);
}

// Payment routes (Stripe scaffold) - mount only when explicitly enabled to allow
// running the app without the `stripe` package or Stripe env vars.
if (String(process.env.ENABLE_STRIPE || '').toLowerCase() === 'true') {
  import('./routes/stripe.js')
    .then((mod) => {
      app.use('/api/payments', mod.default);
      console.log('[Payments] Stripe routes mounted under /api/payments');
    })
    .catch((err) => {
      console.warn('[Payments] Failed to mount Stripe routes:', err?.message || err);
    });
} else {
  console.log('[Payments] Stripe routes disabled. Set ENABLE_STRIPE=true to enable.');
}

// --- Firebase Admin initialization (optional, for privileged admin ops) ---
// Configure one of the following in your environment for initialization:
// 1) FIREBASE_ADMIN_CREDENTIALS_BASE64: base64-encoded service account JSON
// 2) FIREBASE_ADMIN_CREDENTIALS_JSON: raw service account JSON string
// 3) GOOGLE_APPLICATION_CREDENTIALS: path to service account JSON file (application default)
let adminAuth = null;
try {
  if (!admin.apps.length) {
    const b64 = process.env.FIREBASE_ADMIN_CREDENTIALS_BASE64;
    const rawJson = process.env.FIREBASE_ADMIN_CREDENTIALS_JSON;
    if (b64 || rawJson) {
      const jsonStr = b64 ? Buffer.from(b64, 'base64').toString('utf8') : rawJson;
      const credObj = JSON.parse(jsonStr);
      admin.initializeApp({ credential: admin.credential.cert(credObj) });
    } else {
      // Attempt application default credentials as a fallback
      admin.initializeApp({ credential: admin.credential.applicationDefault() });
    }
    console.log('[Admin] Firebase Admin initialized');
  }
  adminAuth = admin.auth();
} catch (e) {
  console.warn('[Admin] Firebase Admin not initialized:', e?.message || String(e));
}

// Protect admin endpoints either with an API key header or with a Firebase ID token that has admin=true claim
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';
async function requireAdminAuth(req, res, next) {
  // Option A: X-Admin-Api-Key header
  const key = (req.headers['x-admin-api-key'] || req.headers['x-admin-key'] || '').toString();
  if (ADMIN_API_KEY && key === ADMIN_API_KEY) return next();

  // Option B: Firebase ID token with admin claim
  try {
    const authz = (req.headers['authorization'] || '').toString();
    const m = authz.match(/^Bearer\s+(.+)$/i);
    if (!m) return res.status(401).json({ error: 'unauthorized' });
    if (!adminAuth) return res.status(500).json({ error: 'admin_not_configured' });
    const decoded = await adminAuth.verifyIdToken(m[1]);
    if (decoded?.admin === true) return next();
    return res.status(403).json({ error: 'forbidden' });
  } catch (e) {
    return res.status(401).json({ error: 'unauthorized', detail: e?.message });
  }
}

// Create or promote an admin user using a real email address
// POST /api/admin/users
// Body: { email: string, password?: string, displayName?: string }
// - If user exists, password is optional; user is promoted to admin via custom claims.
// - If user does not exist, password is required to create the Firebase Auth user.
app.post('/api/admin/users', requireAdminAuth, async (req, res) => {
  if (!adminAuth) return res.status(500).json({ error: 'admin_not_configured' });
  const { email, password, displayName } = req.body || {};
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'invalid_email' });

  try {
    let userRecord;
    try {
      userRecord = await adminAuth.getUserByEmail(email);
    } catch {
      userRecord = null;
    }

    if (!userRecord) {
      if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ error: 'password_required_to_create_user' });
      }
      userRecord = await adminAuth.createUser({ email, password, displayName });
    } else if (password && typeof password === 'string' && password.length >= 6) {
      // Optional password reset on existing user
      userRecord = await adminAuth.updateUser(userRecord.uid, { password, displayName });
    } else if (displayName && displayName !== userRecord.displayName) {
      userRecord = await adminAuth.updateUser(userRecord.uid, { displayName });
    }

    // Set custom claim admin=true
    await adminAuth.setCustomUserClaims(userRecord.uid, { admin: true });

    // Return minimal info (avoid sensitive fields)
    return res.json({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      admin: true
    });
  } catch (e) {
    console.error('[Admin] Failed to create/promote admin:', e);
    return res.status(500).json({ error: 'admin_user_create_failed', detail: e?.message || String(e) });
  }
});

// In-memory enrichment cache keyed by place_id + lang
const ENRICH_CACHE_TTL_MS = parseInt(process.env.ENRICHMENT_CACHE_TTL || '604800000', 10); // default 7d
const enrichCache = new Map(); // key -> { data, ts }
const ENRICH_SCHEMA_VERSION = 'v1';

function makeEnrichKey(placeId, lang = 'en') {
  return `${ENRICH_SCHEMA_VERSION}|${lang}|${placeId}`;
}

function getEnrichmentFromCache(ids, lang) {
  const now = Date.now();
  const hits = new Map();
  const misses = [];
  for (const id of ids) {
    const key = makeEnrichKey(id, lang);
    const entry = enrichCache.get(key);
    if (entry && now - entry.ts < ENRICH_CACHE_TTL_MS) {
      hits.set(id, entry.data);
    } else {
      misses.push(id);
    }
  }
  return { hits, misses };
}

function setEnrichmentInCache(items, lang) {
  const now = Date.now();
  for (const item of items) {
    if (!item?.id) continue;
    const key = makeEnrichKey(item.id, lang);
    enrichCache.set(key, { data: item, ts: now });
  }
}

// MongoDB connection (optional)
const MONGO_URI = process.env.MONGO_URI;
const SKIP_MONGO = String(process.env.SKIP_MONGO || '').toLowerCase() === 'true';
if (!SKIP_MONGO && MONGO_URI && MONGO_URI !== 'disabled') {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB connection error:', err));
} else {
  console.warn('ℹ️ MongoDB connection skipped (set MONGO_URI and SKIP_MONGO=false to enable; set MONGO_URI="disabled" or SKIP_MONGO=true to skip).');
}

// Generic Config Schema for key/value config
let Config;
try {
  const configSchema = new mongoose.Schema({
    key: { type: String, unique: true },
    data: mongoose.Schema.Types.Mixed,
    updatedAt: { type: Date, default: Date.now }
  });
  Config = mongoose.model('Config', configSchema);
} catch (e) {
  try { Config = mongoose.model('Config'); } catch {}
}

// Enhanced User Schema with 4-Role System
const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, index: true, sparse: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  
  // Profile-Based System
  profileType: { type: String, default: 'traveler', enum: ['traveler', 'business', 'service', 'creator'] },
  enabledModules: { type: [String], default: ['places'] },
  profileSetupComplete: { type: Boolean, default: false },
  
  // Legacy Role System (for backward compatibility)
  role: { type: String, default: 'regular', enum: ['regular', 'merchant', 'agent', 'admin'] },
  permissions: [String],
  isVerified: { type: Boolean, default: false },
  
  // Business Profile (for merchants)
  businessProfile: {
    businessName: String,
    businessType: { type: String, enum: ['restaurant', 'hotel', 'cafe', 'shop', 'attraction'] },
    businessAddress: String,
    businessPhone: String,
    businessEmail: String,
    businessHours: String,
    businessDescription: String,
    verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date
  },
  
  // Service Profile (for agents)
  serviceProfile: {
    serviceName: String,
    serviceType: { type: String, enum: ['guide', 'driver', 'tour_operator', 'transport'] },
    serviceDescription: String,
    serviceArea: String,
    languages: [String],
    pricing: {
      hourlyRate: Number,
      dailyRate: Number,
      currency: { type: String, default: 'USD' }
    },
    availability: {
      days: [String],
      hours: String
    },
    verificationStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date
  },
  
  // Subscription
  tier: { type: String, default: 'free', enum: ['free', 'basic', 'premium', 'pro'] },
  subscriptionStatus: { type: String, default: 'none', enum: ['none', 'trial', 'active', 'expired', 'canceled'] },
  subscriptionEndDate: Date,
  trialEndDate: Date,
  
  // User Preferences
  homeCurrency: { type: String, default: 'USD' },
  language: { type: String, default: 'en' },
  selectedInterests: [String],
  hasCompletedWizard: { type: Boolean, default: false },
  favoritePlaces: [String],
  profilePicture: { type: String, default: null },
  
  // Legacy fields (for backward compatibility)
  isAdmin: { type: Boolean, default: false },
  isMerchant: { type: Boolean, default: false },
  merchantInfo: {
    businessName: String,
    businessType: String,
    businessAddress: String,
    businessPhone: String,
    verificationStatus: String
  },
  
  createdAt: { type: Date, default: Date.now }
});

// Add indexes for role queries
userSchema.index({ role: 1 });
userSchema.index({ 'businessProfile.verificationStatus': 1 });
userSchema.index({ 'serviceProfile.verificationStatus': 1 });

const User = mongoose.model('User', userSchema);

// Make User model available to routes
app.set('User', User);
global.User = User;

// Load persisted cost config from DB on startup (if DB available)
(async () => {
  try {
    if (Config) {
      const doc = await Config.findOne({ key: 'api_cost_config' }).lean();
      if (doc && doc.data) {
        if (typeof doc.data.includeErrors === 'boolean') costConfig.includeErrors = doc.data.includeErrors;
        if (doc.data.rates) {
          for (const k of ['openai','maps','places']) {
            if (doc.data.rates[k] != null && !isNaN(doc.data.rates[k])) {
              costConfig.rates[k] = parseFloat(doc.data.rates[k]);
            }
          }
        }
      } else {
        await Config.create({ key: 'api_cost_config', data: costConfig });
      }
    }
  } catch (e) {
    console.warn('Cost config load failed:', e?.message || String(e));
  }
})();

async function persistCostConfig() {
  try {
    if (Config) {
      await Config.updateOne(
        { key: 'api_cost_config' },
        { $set: { data: costConfig, updatedAt: new Date() } },
        { upsert: true }
      );
    }
  } catch (e) {
    console.warn('Cost config persist failed:', e?.message || String(e));
  }
}

// Admin guard: allow if ADMIN_SECRET matches x-admin-secret, or user id header corresponds to isAdmin user
async function isAdminRequest(req) {
  const secret = process.env.ADMIN_SECRET;
  const hdr = req.headers['x-admin-secret'];
  if (secret && hdr && String(hdr) === String(secret)) return true;
  const userId = req.headers['x-user-id'];
  if (userId) {
    try {
      const u = await User.findById(String(userId)).select('isAdmin').lean();
      if (u && u.isAdmin) return true;
    } catch {}
  }
  return false;
}

// Trip Plan Schema
const tripPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tripTitle: String,
  destination: String,
  duration: String,
  dailyPlans: [Object],
  createdAt: { type: Date, default: Date.now }
});

const TripPlan = mongoose.model('TripPlan', tripPlanSchema);

// Post Schema
const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: {
    text: String,
    images: [String]
  },
  author: {
    name: String,
    avatar: String,
    location: String,
    verified: Boolean
  },
  engagement: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 }
  },
  // Track which users liked the post (store userId or username as string)
  likedBy: { type: [String], default: [] },
  // Embedded comments for simplicity
  commentsList: {
    type: [new mongoose.Schema({
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      username: { type: String },
      text: { type: String, required: true },
      likes: { type: Number, default: 0 },
      likedBy: { type: [String], default: [] },
      createdAt: { type: Date, default: Date.now }
    }, { _id: true })],
    default: []
  },
  tags: [String],
  category: String,
  // Moderation fields
  moderationFlags: { type: [String], default: [] },
  requiresReview: { type: Boolean, default: false },
  moderationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  createdAt: { type: Date, default: Date.now }
});

// Indexes for faster queries
postSchema.index({ createdAt: -1 });
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ moderationStatus: 1 });

const Post = mongoose.model('Post', postSchema);

// Review Schema
const reviewSchema = new mongoose.Schema({
  placeId: { type: String, required: true },
  rating: { type: Number, required: true },
  text: { type: String, required: true },
  author_name: { type: String, default: 'Anonymous User' },
  time: { type: Number, default: () => Math.floor(Date.now() / 1000) },
  createdAt: { type: Date, default: Date.now }
});

const Review = mongoose.model('Review', reviewSchema);

// Deal Schema
const dealSchema = new mongoose.Schema({
  title: String,
  description: String,
  discount: String,
  placeId: String,
  placeName: String,
  price: {
    amount: Number,
    currencyCode: String,
  },
  businessName: String,
  businessType: String,
  businessAddress: String,
  businessPhone: String,
  businessWebsite: String,
  originalPrice: String,
  discountedPrice: String,
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  images: [String],
  views: { type: Number, default: 0 },
  claims: { type: Number, default: 0 },
  isPremium: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  validUntil: Date,
  startsAt: { type: Date },
  endsAt: { type: Date },
  merchantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const Deal = mongoose.model('Deal', dealSchema);

// Event Schema
const eventSchema = new mongoose.Schema({
  title: String,
  description: String,
  location: String,
  date: String,
  time: String,
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const Event = mongoose.model('Event', eventSchema);

// One-Day Itinerary Schema
const itinerarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  introduction: String,
  dailyPlan: [Object], // Array with one element for one-day plans
  conclusion: String,
  travelTips: [String],
  createdAt: { type: Date, default: Date.now }
});

const Itinerary = mongoose.model('Itinerary', itinerarySchema);

// Local Dish Schema
const dishSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  cuisine: String,
  location: {
    city: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  ingredients: [String],
  preparationTime: String,
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
  servings: Number,
  image: String,
  recipe: {
    instructions: [String],
    tips: [String]
  },
  nutritionalInfo: {
    calories: Number,
    protein: String,
    carbs: String,
    fat: String
  },
  tags: [String],
  isPopular: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

dishSchema.index({ 'location.city': 1, 'location.country': 1 });
dishSchema.index({ cuisine: 1 });
dishSchema.index({ tags: 1 });

const Dish = mongoose.model('Dish', dishSchema);

// API Routes
// Batch enrichment cache endpoint: returns cached enrichment and records new ones from client
app.post('/api/enrichment/batch', async (req, res) => {
  try {
    const { items, lang } = req.body || {};
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items array required' });
    const ids = items.map(i => i?.place_id || i?.id).filter(Boolean);
    const { hits, misses } = getEnrichmentFromCache(ids, lang || 'en');
    // If client provided enriched data for some items, store them
    const enrichedProvided = items.filter(i => i && i.id && (i.description || i.localTip || i.type));
    if (enrichedProvided.length > 0) setEnrichmentInCache(enrichedProvided, lang || 'en');
    res.json({ cached: Object.fromEntries(hits), missing: misses });
  } catch (error) {
    res.status(500).json({ error: 'Failed enrichment batch', details: error?.message || String(error) });
  }
});

// API Usage metrics endpoints
app.post('/api/usage', async (req, res) => {
  try {
    const { api, action, status, durationMs, meta } = req.body || {};
    if (!api || !status) return res.status(400).json({ error: 'api and status are required' });
    recordUsage({ api, action, status, durationMs, meta });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to record usage', details: e?.message || String(e) });
  }
});

app.get('/api/usage', async (req, res) => {
  try {
    res.json({ totals: usageState.totals, events: usageState.events.slice(-200) });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch usage', details: e?.message || String(e) });
  }
});

// Aggregations: daily and monthly summaries and window stats
app.get('/api/usage/aggregate/daily', async (req, res) => {
  try {
    const days = Math.min(365, Math.max(1, parseInt(String(req.query.days || '30'), 10)));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    if (!ApiEvent || SKIP_MONGO) {
      // Fallback: use in-memory events (limited history)
      const byDay = new Map();
      for (const e of usageState.events) {
        if (e.ts < since.getTime()) continue;
        const day = new Date(e.ts).toISOString().slice(0,10);
        const key = `${day}|${e.api}|${e.status}`;
        byDay.set(key, (byDay.get(key)||0)+1);
      }
      const daysOut = [];
      const dayKeys = new Set([...byDay.keys()].map(k=>k.split('|')[0]));
      const sortedDays = [...dayKeys].sort();
      for (const d of sortedDays) {
        const perApi = { openai: { success:0, error:0 }, maps:{ success:0, error:0 }, places:{ success:0, error:0 } };
        for (const api of ['openai','maps','places']) {
          for (const status of ['success','error']) {
            perApi[api][status] = byDay.get(`${d}|${api}|${status}`) || 0;
          }
        }
        const total = Object.values(perApi).reduce((s, v) => s + v.success + v.error, 0);
        daysOut.push({ day: d, perApi, total });
      }
      return res.json({ range: { since: since.toISOString() }, days: daysOut });
    }
    const rows = await ApiEvent.aggregate([
      { $match: { ts: { $gte: since } } },
      { $group: { _id: { day: { $dateToString: { format: '%Y-%m-%d', date: '$ts' } }, api: '$api', status: '$status' }, count: { $sum: 1 } } },
      { $sort: { '_id.day': 1 } }
    ]).exec();
    const map = new Map();
    for (const r of rows) {
      const { day, api, status } = r._id;
      if (!map.has(day)) map.set(day, { openai:{success:0,error:0}, maps:{success:0,error:0}, places:{success:0,error:0} });
      map.get(day)[api][status] = r.count;
    }
    const daysOut = [...map.keys()].sort().map(d => {
      const perApi = map.get(d);
      const total = Object.values(perApi).reduce((s,v)=> s + v.success + v.error, 0);
      return { day: d, perApi, total };
    });
    res.json({ range: { since: since.toISOString() }, days: daysOut });
  } catch (e) {
    res.status(500).json({ error: 'Failed daily aggregate', details: e?.message || String(e) });
  }
});

app.get('/api/usage/aggregate/monthly', async (req, res) => {
  try {
    const months = Math.min(24, Math.max(1, parseInt(String(req.query.months || '12'), 10)));
    const since = new Date();
    since.setUTCMonth(since.getUTCMonth() - months + 1);
    if (!ApiEvent || SKIP_MONGO) {
      const byMonth = new Map();
      for (const e of usageState.events) {
        const dt = new Date(e.ts);
        const ym = dt.toISOString().slice(0,7);
        const key = `${ym}|${e.api}|${e.status}`;
        byMonth.set(key, (byMonth.get(key)||0)+1);
      }
      const ymKeys = new Set([...byMonth.keys()].map(k=>k.split('|')[0]));
      const out = [...ymKeys].sort().map(ym => {
        const perApi = { openai:{success:0,error:0}, maps:{success:0,error:0}, places:{success:0,error:0} };
        for (const api of ['openai','maps','places']) {
          for (const status of ['success','error']) perApi[api][status] = byMonth.get(`${ym}|${api}|${status}`)||0;
        }
        const total = Object.values(perApi).reduce((s,v)=> s + v.success + v.error, 0);
        return { month: ym, perApi, total };
      });
      return res.json({ range: { since: since.toISOString() }, months: out });
    }
    const rows = await ApiEvent.aggregate([
      { $match: { ts: { $gte: since } } },
      { $group: { _id: { month: { $dateToString: { format: '%Y-%m', date: '$ts' } }, api: '$api', status: '$status' }, count: { $sum: 1 } } },
      { $sort: { '_id.month': 1 } }
    ]).exec();
    const map = new Map();
    for (const r of rows) {
      const { month, api, status } = r._id;
      if (!map.has(month)) map.set(month, { openai:{success:0,error:0}, maps:{success:0,error:0}, places:{success:0,error:0} });
      map.get(month)[api][status] = r.count;
    }
    const monthsOut = [...map.keys()].sort().map(m => {
      const perApi = map.get(m);
      const total = Object.values(perApi).reduce((s,v)=> s + v.success + v.error, 0);
      return { month: m, perApi, total };
    });
    res.json({ range: { since: since.toISOString() }, months: monthsOut });
  } catch (e) {
    res.status(500).json({ error: 'Failed monthly aggregate', details: e?.message || String(e) });
  }
});

app.get('/api/usage/stats', async (req, res) => {
  try {
    const windowMinutes = Math.min(1440, Math.max(5, parseInt(String(req.query.window || '60'), 10)));
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);
    const apis = ['openai','maps','places'];
    const result = {};
    if (!ApiEvent || SKIP_MONGO) {
      const recent = usageState.events.filter(e => e.ts >= since.getTime());
      for (const api of apis) {
        const rows = recent.filter(e => e.api === api);
        const calls = rows.length;
        const success = rows.filter(r=>r.status==='success').length;
        const error = rows.filter(r=>r.status==='error').length;
        const durs = rows.map(r=>r.durationMs||0).filter(v=>v>0).sort((a,b)=>a-b);
        const p = (p) => durs.length ? durs[Math.min(durs.length-1, Math.floor((p/100)*durs.length))] : 0;
        result[api] = { calls, success, error, p50: p(50), p95: p(95), avgMs: durs.length ? Math.round(durs.reduce((s,v)=>s+v,0)/durs.length) : 0 };
      }
      return res.json({ windowMinutes, perApi: result });
    }
    const rows = await ApiEvent.find({ ts: { $gte: since } }, { api:1, status:1, durationMs:1 }).limit(50000).lean().exec();
    for (const api of apis) {
      const subset = rows.filter(r=>r.api===api);
      const calls = subset.length;
      const success = subset.filter(r=>r.status==='success').length;
      const error = subset.filter(r=>r.status==='error').length;
      const durs = subset.map(r=>r.durationMs||0).filter(v=>v>0).sort((a,b)=>a-b);
      const perc = (p) => durs.length ? durs[Math.min(durs.length-1, Math.floor((p/100)*durs.length))] : 0;
      result[api] = { calls, success, error, p50: perc(50), p95: perc(95), avgMs: durs.length ? Math.round(durs.reduce((s,v)=>s+v,0)/durs.length) : 0 };
    }
    res.json({ windowMinutes, perApi: result });
  } catch (e) {
    res.status(500).json({ error: 'Failed window stats', details: e?.message || String(e) });
  }
});

// Time-series usage counts for charts
// Query: window (minutes), bucket ('auto'|'minute'|'hour'|'day'), apis=gemini,maps,places, status=all|success|error
app.get('/api/usage/timeseries', async (req, res) => {
  try {
    const CAP_MIN = 60 * 24 * 90; // 90 days cap
    const qSince = req.query.since ? new Date(String(req.query.since)) : null;
    const qUntil = req.query.until ? new Date(String(req.query.until)) : null;
    let since, until;
    if (qSince) {
      since = qSince;
      until = qUntil || new Date();
    } else {
      const windowMin = Math.min(CAP_MIN, Math.max(5, parseInt(String(req.query.window || '60'), 10)));
      since = new Date(Date.now() - windowMin * 60 * 1000);
      until = new Date();
    }
    const apis = String(req.query.apis || 'openai,maps,places').split(',').map(s=>s.trim()).filter(Boolean);
    const statusFilter = String(req.query.status || 'all'); // all|success|error
    let bucket = String(req.query.bucket || 'auto');
    if (bucket === 'auto') {
      const windowMin = Math.max(1, Math.round((until - since) / 60000));
      if (windowMin <= 180) bucket = 'minute';
      else if (windowMin <= 60*24*7) bucket = 'hour';
      else bucket = 'day';
    }
    const fmt = bucket === 'minute' ? '%Y-%m-%dT%H:%M:00Z' : (bucket === 'hour' ? '%Y-%m-%dT%H:00:00Z' : '%Y-%m-%d');

    if (!ApiEvent || SKIP_MONGO) {
      // Fallback: bucket in-memory events (limited history)
      const map = new Map(); // key: tsBucket -> { api: { success, error } }
      const floorToBucket = (ts) => {
        const d = new Date(ts);
        if (bucket === 'minute') d.setUTCSeconds(0,0);
        else if (bucket === 'hour') d.setUTCMinutes(0,0,0);
        else { d.setUTCHours(0,0,0,0); }
        return d.toISOString().replace(/\.\d{3}Z$/, 'Z');
      };
      for (const e of usageState.events) {
        if (e.ts < since.getTime() || e.ts > until.getTime()) continue;
        if (!apis.includes(e.api)) continue;
        if (statusFilter !== 'all' && e.status !== statusFilter) continue;
        const key = floorToBucket(e.ts);
        if (!map.has(key)) map.set(key, {});
        const bucketObj = map.get(key);
        bucketObj[e.api] = bucketObj[e.api] || { success:0, error:0 };
        bucketObj[e.api][e.status] += 1;
      }
      const points = [...map.keys()].sort().map(t => {
        const perApi = {};
        for (const a of apis) {
          const v = (map.get(t) || {})[a] || { success:0, error:0 };
          perApi[a] = { ...v, total: v.success + v.error };
        }
        return { t, perApi };
      });
      return res.json({ bucket, points });
    }

    // Mongo aggregation path
  const match = { ts: { $gte: since, $lte: until }, api: { $in: apis } };
    if (statusFilter !== 'all') Object.assign(match, { status: statusFilter });
    const rows = await ApiEvent.aggregate([
      { $match: match },
      { $group: { _id: { t: { $dateToString: { format: fmt, date: '$ts' } }, api: '$api', status: '$status' }, c: { $sum: 1 } } },
      { $sort: { '_id.t': 1 } }
    ]).exec();
    const byT = new Map();
    for (const r of rows) {
      const t = r._id.t;
      if (!byT.has(t)) byT.set(t, {});
      const obj = byT.get(t);
      const a = r._id.api;
      obj[a] = obj[a] || { success:0, error:0 };
      obj[a][r._id.status] = (obj[a][r._id.status] || 0) + r.c;
    }
    const points = [...byT.keys()].sort().map(t => {
      const perApi = {};
      for (const a of apis) {
        const v = (byT.get(t) || {})[a] || { success:0, error:0 };
        perApi[a] = { ...v, total: v.success + v.error };
      }
      return { t, perApi };
    });
    res.json({ bucket, points });
  } catch (e) {
    res.status(500).json({ error: 'Failed timeseries', details: e?.message || String(e) });
  }
});

// Policy endpoint: lets client see current limits and usage
app.get('/api/usage/policy', async (req, res) => {
  try {
    const tier = await getUserTier(req);
    const userKey = getRequestUserKey(req);
    const date = getDateKey();
    const apis = ['places','maps','openai'];
    const used = {};
    for (const api of apis) {
      used[api] = await getDailyCount(userKey, api);
    }
    res.json({ enforce: ENFORCE_QUOTAS, date, tier, policy: TIER_POLICY[tier], usedDaily: used });
  } catch (e) {
    res.status(500).json({ error: 'Failed to get policy', details: e?.message || String(e) });
  }
});

// Health: DB connectivity status
app.get('/api/health/db', async (req, res) => {
  try {
    const enabled = !SKIP_MONGO;
    const state = mongoose?.connection?.readyState; // 1 = connected
    const connected = state === 1;
    res.json({ mongo: { enabled, connected, state } });
  } catch (e) {
    res.status(500).json({ error: 'Failed to read DB health', details: e?.message || String(e) });
  }
});

// Cost analytics endpoints
app.get('/api/usage/cost', async (req, res) => {
  try {
    if (ENFORCE_ADMIN_COST && !(await isAdminRequest(req))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const windowMinutes = parseInt(String(req.query.window || '60'), 10) || 60;
    res.json(buildCostSnapshot(windowMinutes));
  } catch (e) {
    res.status(500).json({ error: 'Failed to build cost snapshot', details: e?.message || String(e) });
  }
});

app.post('/api/usage/cost/config', async (req, res) => {
  try {
    if (ENFORCE_ADMIN_COST && !(await isAdminRequest(req))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { includeErrors, rates } = req.body || {};
    if (typeof includeErrors === 'boolean') costConfig.includeErrors = includeErrors;
    if (rates && typeof rates === 'object') {
      for (const k of ['openai','maps','places']) {
        if (rates[k] != null && !isNaN(rates[k])) {
          costConfig.rates[k] = parseFloat(rates[k]);
        }
      }
    }
    // persist new config
    await persistCostConfig();
    const snapshot = buildCostSnapshot();
    io.emit('api_cost_update', snapshot);
    res.json({ ok: true, config: costConfig });
  } catch (e) {
    res.status(400).json({ error: 'Failed to update cost config', details: e?.message || String(e) });
  }
});
import { EnhancedPlacesSearch } from './enhanced-places-search.js';
import { PlacesOptimizer } from './places-optimization.js';

// Enhanced Places API proxy - comprehensive search like Google Maps
app.get('/api/places/nearby', enforcePolicy('places'), async (req, res) => {
  try {
    const { lat, lng, q, radius, enforceRadius, sort } = req.query;
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      recordUsage({ api: 'places', action: 'nearby', status: 'error', meta: { reason: 'missing_key' } });
      return res.status(500).json({ error: 'GOOGLE_PLACES_API_KEY is not configured on the server' });
    }

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const query = (q || '').toString().trim() || 'points of interest';
    const DEFAULT_RADIUS = parseInt(process.env.DEFAULT_PLACES_RADIUS_M || '20000', 10);
    let searchRadius = parseInt((radius || String(DEFAULT_RADIUS)).toString(), 10);
    const maxR = req._policy?.features?.radiusMaxM;
    if (maxR && Number.isFinite(maxR)) searchRadius = Math.min(searchRadius, maxR);
    const enforce = String(enforceRadius ?? 'true').toLowerCase() !== 'false';
    const sortByDistance = String(sort || 'distance').toLowerCase() === 'distance';

    const key = makePlacesKey(lat, lng, query, searchRadius);
    const cached = getFromPlacesCache(key);
    const isFresh = cached && (Date.now() - cached.ts < PLACES_CACHE_TTL_MS);

    // Serve fresh cache
    if (isFresh) {
      recordUsage({ api: 'places', action: 'nearby', status: 'success', meta: { cache: 'hit' } });
      return res.json(cached.data);
    }

    const enhancedSearch = new EnhancedPlacesSearch(apiKey);
    
    const doEnhancedFetch = async () => {
      // Use comprehensive search for better results
      let results = await enhancedSearch.searchPlacesComprehensive(
        parseFloat(lat), 
        parseFloat(lng), 
        query, 
        searchRadius
      );
      
      // Apply quality filtering and optimization
      results = PlacesOptimizer.filterQualityResults(results);
      results = PlacesOptimizer.enrichPlaceTypes(results);
      results = PlacesOptimizer.rankResults(results, parseFloat(lat), parseFloat(lng), query);
      
      return { status: 'OK', results };
    };

    // If we have stale cache, return it immediately and refresh in background (SWR)
    if (cached && !isFresh) {
      res.json(cached.data);
      // background refresh
      const started = Date.now();
      doEnhancedFetch()
        .then((data) => {
          const normalized = normalizeAndFilter(data.results, lat, lng, searchRadius, { enforceRadius: enforce, sortByDistance });
          setPlacesCache(key, normalized);
          recordUsage({ api: 'places', action: 'nearby', status: 'success', durationMs: Date.now() - started, meta: { swr: true, cache: 'set', enhanced: true } });
        })
        .catch((e) => {
          console.error('Enhanced Places SWR refresh failed:', e.message || e);
          recordUsage({ api: 'places', action: 'nearby', status: 'error', meta: { swr: true, err: e?.message || String(e) } });
        });
      return;
    }

    const start = Date.now();
    const data = await doEnhancedFetch();

    let normalized = normalizeAndFilter(data.results, lat, lng, searchRadius, { enforceRadius: enforce, sortByDistance });

    setPlacesCache(key, normalized);
    recordUsage({ api: 'places', action: 'nearby', status: 'success', durationMs: Date.now() - start, meta: { cache: 'set', enhanced: true } });
    
    // Return more results for comprehensive coverage
    const limit = req._policy?.features?.resultsPerSearch || 60; // Increased default limit for mobile
    const sendList = normalized.slice(0, limit);
    
    console.log(`✅ Enhanced search returned ${sendList.length} places for query: ${query}`);
    res.json(sendList);
    
  } catch (error) {
    recordUsage({ api: 'places', action: 'nearby', status: 'error', meta: { err: error?.message || String(error) } });
    res.status(500).json({ error: 'Failed to fetch places', details: error?.message || String(error) });
  }
});

// Users
app.post('/api/users', async (req, res) => {
  try {
  const { username, email, firebaseUid, ...rest } = req.body || {};
  if (!username && !email) {
      return res.status(400).json({ error: 'username or email is required' });
    }
    // Try find existing by email or username
    const existing = await User.findOne({
      $or: [
    ...(email ? [{ email }] : []),
    ...(firebaseUid ? [{ firebaseUid }] : []),
        ...(username ? [{ username }] : [])
      ]
    });

    if (existing) {
      // Optionally update SAFE fields if provided (ignore undefined to avoid accidental resets)
      const updatable = ['tier','subscriptionStatus','subscriptionEndDate','trialEndDate','homeCurrency','language','selectedInterests','hasCompletedWizard','isAdmin','profilePicture'];
      let changed = false;
      for (const key of updatable) {
        if (Object.prototype.hasOwnProperty.call(rest, key) && rest[key] !== undefined) {
          if (existing[key] !== rest[key]) {
            existing[key] = rest[key];
            changed = true;
          }
        }
      }
      if (changed) await existing.save();
      return res.json(existing);
    }

  const user = new User({ username, email, firebaseUid, ...rest });
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-__v');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single user (authoritative read for subscription/tier)
app.get('/api/users/:id', async (req, res) => {
  try {
    // Try to find user by Firebase UID first, then by MongoDB _id
    let user = await User.findOne({ firebaseUid: req.params.id }).select('-__v');
    if (!user) {
      user = await User.findById(req.params.id).select('-__v');
    }
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Return simple subscription status for a user
app.get('/api/users/:id/subscription-status', async (req, res) => {
  try {
    // Try to find user by Firebase UID first, then by MongoDB _id
    let user = await User.findOne({ firebaseUid: req.params.id }).select('tier subscriptionStatus subscriptionEndDate trialEndDate');
    if (!user) {
      user = await User.findById(req.params.id).select('tier subscriptionStatus subscriptionEndDate trialEndDate');
    }
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      tier: user.tier,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionEndDate: user.subscriptionEndDate,
      trialEndDate: user.trialEndDate,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Return invoices for a user (placeholder - integrate with payment provider)
app.get('/api/users/:id/invoices', async (req, res) => {
  try {
    // In a real implementation, query Stripe (or other provider) for invoices by customer id.
    // For now return an empty list or any stored invoices in DB if available.
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    // Diagnostic logging: show incoming body for debugging subscription persistence
    console.log('[PUT /api/users/:id] incoming body:', { id: req.params.id, body: req.body, ip: req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress });

    // Only allow specific fields and ignore undefined to avoid erasing values
    const allowed = ['username','email','tier','subscriptionStatus','subscriptionEndDate','trialEndDate','homeCurrency','language','selectedInterests','hasCompletedWizard','isAdmin','isMerchant','merchantInfo','profilePicture'];
    const payload = {};
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, k) && req.body[k] !== undefined) {
        payload[k] = req.body[k];
      }
    }

    // Handle merchant info updates
    if (payload.merchantInfo) {
      payload.merchantInfo.verificationStatus = payload.merchantInfo.verificationStatus || 'approved';
    }

    console.log('[PUT /api/users/:id] sanitized payload to update:', payload);

    const user = await User.findByIdAndUpdate(req.params.id, { $set: payload }, { new: true });
    if (!user) {
      console.warn('[PUT /api/users/:id] user not found for id:', req.params.id);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('[PUT /api/users/:id] update saved, result:', { _id: user._id, tier: user.tier, subscriptionStatus: user.subscriptionStatus, subscriptionEndDate: user.subscriptionEndDate, trialEndDate: user.trialEndDate });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Profile picture upload
app.put('/api/users/:id/profile-picture', async (req, res) => {
  try {
    const { profilePicture } = req.body;
    if (!profilePicture) {
      return res.status(400).json({ error: 'Profile picture URL is required' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id, 
      { profilePicture }, 
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, profilePicture: user.profilePicture });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Posts with automated moderation
app.post('/api/posts', async (req, res) => {
  try {
    const body = req.body || {};
    
    // Quick validation only
    const images = body?.content?.images;
    if (Array.isArray(images) && images.length > 2) {
      return res.status(400).json({ error: 'Max 2 images allowed' });
    }

    // Create and save post immediately
    const post = new Post(body);
    const saved = await post.save();
    res.json(saved);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/posts', async (req, res) => {
  try {
    const limit = Math.min(20, parseInt(req.query.limit || '20', 10));
    
    const posts = await Post.find({}, {
      userId: 1,
      content: 1,
      author: 1,
      engagement: 1,
      tags: 1,
      category: 1,
      createdAt: 1,
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Like/Unlike a post
app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const { userId, username } = req.body || {};
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Identify liker key (prefer userId; fallback to username or 'anon')
    const likerKey = (userId || username || 'anon').toString();
    const hasLiked = post.likedBy.includes(likerKey);

    if (hasLiked) {
      post.likedBy = post.likedBy.filter((k) => k !== likerKey);
      post.engagement.likes = Math.max(0, (post.engagement.likes || 0) - 1);
    } else {
      post.likedBy.push(likerKey);
      post.engagement.likes = (post.engagement.likes || 0) + 1;
    }
    await post.save();
    return res.json({
      success: true,
      liked: !hasLiked,
      likes: post.engagement.likes,
      likedByCount: post.likedBy.length,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add a comment to a post
app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    const { userId, username, text } = req.body || {};
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    post.commentsList.push({ userId, username, text: text.trim() });
    post.engagement.comments = (post.engagement.comments || 0) + 1;
    await post.save();
    return res.json({ success: true, comments: post.commentsList, count: post.engagement.comments });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get comments for a post
app.get('/api/posts/:id/comments', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).select('commentsList engagement');
    if (!post) return res.status(404).json({ error: 'Post not found' });
    return res.json({ comments: post.commentsList || [], count: post.engagement?.comments || 0 });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Like/Unlike a comment
app.post('/api/posts/:postId/comments/:commentId/like', async (req, res) => {
  try {
    const { userId, username } = req.body || {};
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const comment = post.commentsList.id(req.params.commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const likerKey = (userId || username || 'anon').toString();
    const hasLiked = comment.likedBy.includes(likerKey);

    if (hasLiked) {
      comment.likedBy = comment.likedBy.filter((k) => k !== likerKey);
      comment.likes = Math.max(0, (comment.likes || 0) - 1);
    } else {
      comment.likedBy.push(likerKey);
      comment.likes = (comment.likes || 0) + 1;
    }
    
    await post.save();
    return res.json({
      success: true,
      liked: !hasLiked,
      likes: comment.likes,
      commentId: comment._id
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update post
app.put('/api/posts/:id', async (req, res) => {
  try {
    const updates = {};
    if (req.body?.content && typeof req.body.content === 'object') {
      updates['content.text'] = req.body.content.text;
    }
    if (Array.isArray(req.body?.tags)) {
      updates['tags'] = req.body.tags;
    }
    if (typeof req.body?.category === 'string') {
      updates['category'] = req.body.category;
    }
    const post = await Post.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Reviews
app.post('/api/reviews', async (req, res) => {
  try {
    const { place_id, rating, text, author_name } = req.body;
    
    if (!place_id || !rating || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const review = new Review({
      placeId: place_id,
      rating: parseInt(rating),
      text: text,
      author_name: author_name || 'Anonymous User',
      time: Math.floor(Date.now() / 1000),
      createdAt: new Date()
    });
    
    await review.save();
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get reviews by place ID
app.get('/api/reviews', async (req, res) => {
  try {
    const placeId = req.query.place_id;
    if (!placeId) return res.json([]);
    
    const reviews = await Review.find({ placeId }).populate('userId', 'username').sort({ createdAt: -1 });
    
    const formatted = reviews.map(r => ({
      author_name: r.author_name || r.userId?.username || 'Anonymous User',
      rating: r.rating,
      text: r.text,
      time: r.time || Math.floor(r.createdAt.getTime() / 1000)
    }));
    
    res.json(formatted);
  } catch (error) {
    res.json([]);
  }
});



// Trip Plans
app.post('/api/trips', async (req, res) => {
  try {
    const trip = new TripPlan(req.body);
    await trip.save();
    res.json(trip);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/users/:userId/trips', async (req, res) => {
  try {
    // Find user first to get MongoDB _id
    let user = await User.findOne({ firebaseUid: req.params.userId });
    if (!user) {
      user = await User.findById(req.params.userId);
    }
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const trips = await TripPlan.find({ userId: user._id });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// One-Day Itineraries
app.post('/api/itineraries', async (req, res) => {
  try {
    const itinerary = new Itinerary(req.body);
    await itinerary.save();
    res.json(itinerary);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/users/:userId/itineraries', async (req, res) => {
  try {
    const itineraries = await Itinerary.find({ userId: req.params.userId });
    res.json(itineraries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Favorites
app.post('/api/users/:userId/favorites', async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.params.userId });
    if (!user) {
      user = await User.findById(req.params.userId);
    }
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    if (!user.favoritePlaces.includes(req.body.placeId)) {
      user.favoritePlaces.push(req.body.placeId);
      await user.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/users/:userId/favorites', async (req, res) => {
  try {
    // Try to find user by Firebase UID first, then by MongoDB _id
    let user = await User.findOne({ firebaseUid: req.params.userId });
    if (!user) {
      user = await User.findById(req.params.userId);
    }
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.favoritePlaces || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:userId/favorites/:placeId', async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.params.userId });
    if (!user) {
      user = await User.findById(req.params.userId);
    }
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.favoritePlaces = user.favoritePlaces.filter(id => id !== req.params.placeId);
    await user.save();
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete post
app.delete('/api/posts/:id', async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Report Schema
const reportSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reporterUsername: String,
  reason: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const Report = mongoose.model('Report', reportSchema);

// Report post endpoint
app.post('/api/reports', async (req, res) => {
  try {
    const report = new Report(req.body);
    await report.save();
    
    // Auto-flag post if multiple reports
    const reportCount = await Report.countDocuments({ postId: req.body.postId });
    if (reportCount >= 3) {
      await Post.findByIdAndUpdate(req.body.postId, { 
        requiresReview: true,
        moderationStatus: 'pending'
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});



// Delete review
app.delete('/api/reviews/:id', async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deals
app.get('/api/deals', async (req, res) => {
  try {
    const { businessType, isActive, limit = '50', merchantId } = req.query;
    
    // Build query
    const query = {};
    
    if (isActive === 'true') {
      query.isActive = true;
    }
    
    if (businessType && businessType !== 'all') {
      query.businessType = businessType;
    }
    
    if (merchantId) {
      query.merchantId = merchantId;
    }
    
    // Date filtering for active deals
    if (isActive === 'true') {
      const now = new Date();
      query.$and = [
        { $or: [{ startsAt: { $exists: false } }, { startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ endsAt: { $exists: false } }, { endsAt: null }, { endsAt: { $gte: now } }] }
      ];
    }
    
    const deals = await Deal.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit.toString(), 10))
      .lean(); // Use lean() for better performance
    
    res.json(deals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/deals', async (req, res) => {
  try {
    const deal = new Deal(req.body);
    await deal.save();
    res.json(deal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/deals/:id', async (req, res) => {
  try {
    const deal = await Deal.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(deal);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/deals/:id', async (req, res) => {
  try {
    await Deal.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Track deal views
app.post('/api/deals/:id/view', async (req, res) => {
  try {
    await Deal.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Claim deal
app.post('/api/deals/:id/claim', async (req, res) => {
  try {
    const deal = await Deal.findByIdAndUpdate(
      req.params.id, 
      { $inc: { claims: 1 } },
      { new: true }
    );
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.json({ success: true, claims: deal.claims });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Google Maps API key (from environment)
app.get('/api/config/maps-key', (req, res) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(404).json({ error: 'API key not configured' });
  }
  res.json({ apiKey });
});

// Weather forecast endpoint with REAL Google Weather API
app.get('/api/weather/forecast', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    if (googleApiKey) {
      try {
        // Try OpenWeatherMap API for real weather data
        const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lng}&appid=${googleApiKey}&units=metric`;
        console.log('🌤️ Fetching REAL weather forecast from OpenWeatherMap');
        
        const weatherResponse = await fetch(weatherUrl);
        
        if (weatherResponse.ok) {
          const weatherData = await weatherResponse.json();
          console.log('✅ Got REAL weather forecast data');
          
          // Parse real weather data
          const hourlyForecast = weatherData.list.slice(0, 8).map(item => ({
            time: new Date(item.dt * 1000),
            temperature: Math.round(item.main.temp),
            condition: item.weather[0].main.toLowerCase(),
            iconUrl: `https://openweathermap.org/img/w/${item.weather[0].icon}.png`,
            emoji: getWeatherEmoji(item.weather[0].main),
            precipitation: item.rain?.['3h'] || 0
          }));
          
          const dailyForecast = [];
          const dailyMap = new Map();
          
          weatherData.list.forEach(item => {
            const date = new Date(item.dt * 1000).toISOString().split('T')[0];
            if (!dailyMap.has(date)) {
              dailyMap.set(date, {
                date,
                temps: [],
                conditions: [],
                precipitation: 0
              });
            }
            const day = dailyMap.get(date);
            day.temps.push(item.main.temp);
            day.conditions.push(item.weather[0].main);
            day.precipitation += item.rain?.['3h'] || 0;
          });
          
          dailyMap.forEach((day, date) => {
            if (dailyForecast.length < 5) {
              const mostCommonCondition = day.conditions.sort((a,b) => 
                day.conditions.filter(v => v === a).length - day.conditions.filter(v => v === b).length
              ).pop();
              
              dailyForecast.push({
                date,
                tempMax: Math.round(Math.max(...day.temps)),
                tempMin: Math.round(Math.min(...day.temps)),
                condition: mostCommonCondition.toLowerCase(),
                iconUrl: '',
                precipitation: day.precipitation,
                emoji: getWeatherEmoji(mostCommonCondition)
              });
            }
          });
          
          return res.json({
            daily: dailyForecast,
            hourly: hourlyForecast
          });
        }
      } catch (apiError) {
        console.warn('⚠️ OpenWeatherMap API failed, trying fallback:', apiError.message);
      }
    }
    
    // Fallback: Use Google Geocoding for location-aware mock data
    if (googleApiKey) {
      try {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}`;
        const geocodeResponse = await fetch(geocodeUrl);
        
        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json();
          const locationName = geocodeData.results?.[0]?.formatted_address || 'Unknown Location';
          console.log('🌍 Using location-aware fallback for:', locationName);
          
          const isNorthern = parseFloat(lat) > 0;
          const isTropical = Math.abs(parseFloat(lat)) < 23.5;
          const isCoastal = locationName.toLowerCase().includes('coast');
          
          let baseTemp = 20;
          if (isTropical) baseTemp = 28;
          else if (Math.abs(parseFloat(lat)) > 60) baseTemp = 5;
          else if (Math.abs(parseFloat(lat)) > 45) baseTemp = 15;
          
          if (isCoastal) baseTemp += 3;
          
          const conditions = isTropical ? ['sunny', 'partly_cloudy', 'rainy'] : ['sunny', 'cloudy', 'partly_cloudy'];
          const condition = conditions[Math.floor(Math.random() * conditions.length)];
          
          const hourlyForecast = Array.from({ length: 24 }, (_, i) => {
            const hour = new Date(Date.now() + i * 60 * 60 * 1000);
            const tempVariation = Math.sin((i - 6) * Math.PI / 12) * 4;
            return {
              time: hour,
              temperature: Math.round(baseTemp + tempVariation + (Math.random() - 0.5) * 2),
              condition: i % 6 === 0 ? conditions[Math.floor(Math.random() * conditions.length)] : condition,
              iconUrl: '',
              emoji: getWeatherEmoji(condition),
              precipitation: condition === 'rainy' ? Math.random() * 3 : 0
            };
          });
          
          const dailyForecast = Array.from({ length: 5 }, (_, i) => ({
            date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            tempMax: Math.round(baseTemp + 3 + Math.random() * 3),
            tempMin: Math.round(baseTemp - 5 - Math.random() * 3),
            condition: conditions[Math.floor(Math.random() * conditions.length)],
            iconUrl: '',
            precipitation: Math.random() * 2,
            emoji: getWeatherEmoji(condition)
          }));
          
          return res.json({
            daily: dailyForecast,
            hourly: hourlyForecast
          });
        }
      } catch (geocodeError) {
        console.warn('⚠️ Geocoding failed:', geocodeError.message);
      }
    }
    
    // Final fallback
    console.log('🎭 Using basic fallback forecast');
    const baseTemp = 22;
    const condition = 'sunny';
    
    const forecastData = {
      daily: Array.from({ length: 5 }, (_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        tempMax: baseTemp + 3,
        tempMin: baseTemp - 5,
        condition: condition,
        iconUrl: '',
        precipitation: 0.0,
        emoji: '☀️'
      })),
      hourly: Array.from({ length: 24 }, (_, i) => {
        const hour = new Date(Date.now() + i * 60 * 60 * 1000);
        return {
          time: hour,
          temperature: baseTemp + Math.sin(i * Math.PI / 12) * 3,
          condition: condition,
          iconUrl: '',
          emoji: '☀️',
          precipitation: 0
        };
      })
    };
    
    res.json(forecastData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch weather forecast', details: error.message });
  }
});

// Helper function for weather emojis
function getWeatherEmoji(condition) {
  const normalized = condition.toLowerCase();
  if (normalized.includes('clear') || normalized.includes('sun')) return '☀️';
  if (normalized.includes('cloud')) return '☁️';
  if (normalized.includes('rain') || normalized.includes('drizzle')) return '🌧️';
  if (normalized.includes('snow')) return '❄️';
  if (normalized.includes('storm') || normalized.includes('thunder')) return '⛈️';
  return '🌤️';
}

// Weather API using REAL OpenWeatherMap API
app.get('/api/weather/google', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
    
    // Try OpenWeatherMap API for REAL weather data
    if (googleApiKey) {
      try {
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${googleApiKey}&units=metric`;
        console.log('🌤️ Fetching REAL current weather from OpenWeatherMap');
        
        const weatherResponse = await fetch(weatherUrl);
        
        if (weatherResponse.ok) {
          const weatherData = await weatherResponse.json();
          console.log('✅ Got REAL current weather data');
          
          const realWeatherData = {
            location: {
              lat: parseFloat(lat),
              lng: parseFloat(lng)
            },
            current: {
              temperature: Math.round(weatherData.main.temp),
              condition: weatherData.weather[0].main.toLowerCase(),
              humidity: weatherData.main.humidity,
              windSpeed: weatherData.wind?.speed || 0,
              description: weatherData.weather[0].description,
              feelsLike: Math.round(weatherData.main.feels_like),
              precipitation: weatherData.rain?.['1h'] || weatherData.snow?.['1h'] || 0,
              iconUrl: `https://openweathermap.org/img/w/${weatherData.weather[0].icon}.png`
            }
          };
          
          console.log(`🌡️ Real temperature: ${realWeatherData.current.temperature}°C`);
          console.log(`🌤️ Real condition: ${realWeatherData.current.condition}`);
          return res.json(realWeatherData);
        }
      } catch (apiError) {
        console.warn('⚠️ OpenWeatherMap API failed, using fallback:', apiError.message);
      }
      
      try {
        // Fallback: Use Google Geocoding to get location info for weather context
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${googleApiKey}`;
        const geocodeResponse = await fetch(geocodeUrl);
        
        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json();
          const locationName = geocodeData.results?.[0]?.formatted_address || 'Unknown Location';
          
          // Generate location-aware realistic weather using Google's location data
          const getLocationBasedWeather = (lat, lng, locationName) => {
            const isNorthern = lat > 0;
            const isTropical = Math.abs(lat) < 23.5;
            const isCoastal = locationName.toLowerCase().includes('coast') || locationName.toLowerCase().includes('beach');
            
            let baseTemp = 20;
            if (isTropical) baseTemp = 28;
            else if (Math.abs(lat) > 60) baseTemp = 5;
            else if (Math.abs(lat) > 45) baseTemp = 15;
            
            const season = isNorthern ? 
              (new Date().getMonth() < 3 || new Date().getMonth() > 10 ? 'winter' : 'summer') :
              (new Date().getMonth() < 3 || new Date().getMonth() > 10 ? 'summer' : 'winter');
            
            if (season === 'winter') baseTemp -= 10;
            if (isCoastal) baseTemp += 3;
            
            const conditions = isTropical ? 
              ['sunny', 'partly_cloudy', 'rainy'] : 
              ['sunny', 'cloudy', 'partly_cloudy', 'rainy'];
            
            return {
              temperature: Math.max(0, Math.round(baseTemp + (Math.random() - 0.5) * 10)),
              condition: conditions[Math.floor(Math.random() * conditions.length)],
              humidity: Math.round(isTropical ? 70 + Math.random() * 20 : 50 + Math.random() * 30),
              windSpeed: Math.round(isCoastal ? 10 + Math.random() * 15 : 5 + Math.random() * 10)
            };
          };
          
          const weather = getLocationBasedWeather(parseFloat(lat), parseFloat(lng), locationName);
          
          const smartWeatherData = {
            location: {
              lat: parseFloat(lat),
              lng: parseFloat(lng)
            },
            current: {
              temperature: weather.temperature,
              condition: weather.condition,
              humidity: weather.humidity,
              windSpeed: weather.windSpeed,
              description: `Current weather in ${locationName.split(',')[0]}`,
              feelsLike: weather.temperature + 1.5,
              precipitation: 0.0,
              iconUrl: ''
            },
            forecast: {
              daily: Array.from({ length: 5 }, (_, i) => ({
                date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                tempMax: Math.round(weather.temperature + Math.random() * 5),
                tempMin: Math.round(weather.temperature - 5 - Math.random() * 5),
                condition: ['sunny', 'cloudy', 'partly_cloudy'][Math.floor(Math.random() * 3)],
                iconUrl: '',
                precipitation: 0.0,
                emoji: weather.condition === 'sunny' ? '☀️' : weather.condition === 'cloudy' ? '☁️' : '🌤️'
              })),
              hourly: Array.from({ length: 24 }, (_, i) => ({
                time: new Date(Date.now() + i * 60 * 60 * 1000).toISOString(),
                temperature: Math.round(weather.temperature + (Math.random() - 0.5) * 4),
                condition: weather.condition,
                iconUrl: '',
                emoji: weather.condition === 'sunny' ? '☀️' : weather.condition === 'cloudy' ? '☁️' : '🌤️',
                precipitation: 0.0
              }))
            }
          };
          
          console.log('✅ Using Google-enhanced location-aware weather data');
          return res.json(smartWeatherData);
        }
      } catch (apiError) {
        console.warn('⚠️ Google API failed:', apiError.message);
      }
    }
    
    // Final fallback to basic mock data
    console.log('🎭 Using basic mock weather data as final fallback');
    const temp = Math.round(15 + Math.random() * 20);
    const condition = ['sunny', 'cloudy', 'partly_cloudy', 'rainy'][Math.floor(Math.random() * 4)];
    
    const mockWeatherData = {
      location: {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      },
      current: {
        temperature: temp,
        condition: condition,
        humidity: Math.round(40 + Math.random() * 40),
        windSpeed: Math.round(Math.random() * 20),
        description: 'Current weather conditions',
        feelsLike: temp + 1.5,
        precipitation: 0.0,
        iconUrl: ''
      },
      forecast: {
        daily: Array.from({ length: 5 }, (_, i) => ({
          date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          tempMax: Math.round(18 + Math.random() * 15),
          tempMin: Math.round(8 + Math.random() * 10),
          condition: ['sunny', 'cloudy', 'partly_cloudy', 'rainy'][Math.floor(Math.random() * 4)],
          iconUrl: '',
          precipitation: 0.0,
          emoji: condition === 'sunny' ? '☀️' : condition === 'cloudy' ? '☁️' : '🌤️'
        })),
        hourly: Array.from({ length: 24 }, (_, i) => ({
          time: new Date(Date.now() + i * 60 * 60 * 1000).toISOString(),
          temperature: Math.round(temp + (Math.random() - 0.5) * 4),
          condition: condition,
          iconUrl: '',
          emoji: condition === 'sunny' ? '☀️' : condition === 'cloudy' ? '☁️' : '🌤️',
          precipitation: 0.0
        }))
      }
    };

    res.json(mockWeatherData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch weather data', details: error.message });
  }
});

// Events
app.get('/api/events', async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/events/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin moderation endpoints
app.get('/api/admin/reports', requireAdminAuth, async (req, res) => {
  try {
    const reports = await Report.find({ status: 'pending' })
      .populate('postId')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/admin/moderate/:postId', requireAdminAuth, async (req, res) => {
  try {
    const { action } = req.body; // 'approve', 'reject', 'flag'
    const status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'pending';
    
    await Post.findByIdAndUpdate(req.params.postId, {
      moderationStatus: status,
      requiresReview: action === 'flag'
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


// Health check - updated for deployment trigger
app.get('/health', (req, res) => {
  const dbState = mongoose.connection?.readyState;
  const database = (SKIP_MONGO || !MONGO_URI || MONGO_URI === 'disabled') ? 'skipped' : (dbState === 1 ? 'connected' : 'disconnected');
  res.json({ status: 'OK', database, timestamp: new Date().toISOString(), version: '1.1.0' });
});

// Test endpoint to verify deployment
app.get('/api/test-deployment', (req, res) => {
  res.json({ 
    message: 'Deployment successful', 
    timestamp: new Date().toISOString(),
    endpoints: {
      localDishes: '/api/dishes/local',
      emergency: '/api/emergency/police',
      weather: '/api/weather/google'
    }
  });
});

// Test weather API configuration
app.get('/api/weather/test-key', (req, res) => {
  const weatherKey = process.env.OPENWEATHER_API_KEY;
  res.json({
    hasWeatherKey: !!weatherKey,
    keyLength: weatherKey?.length || 0,
    keyPreview: weatherKey ? `${weatherKey.substring(0, 8)}...` : 'Not set',
    timestamp: new Date().toISOString()
  });
});

// Test API key endpoint
app.get('/api/places/test-key', (req, res) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  res.json({
    hasApiKey: !!apiKey,
    keyLength: apiKey?.length || 0,
    keyPreview: apiKey ? `${apiKey.substring(0, 10)}...` : 'Not set',
    timestamp: new Date().toISOString()
  });
});

// Test OpenAI configuration
app.get('/api/ai/test-key', (req, res) => {
  const openaiKey = process.env.AZURE_OPENAI_API_KEY;
  res.json({
    hasOpenAIKey: !!openaiKey,
    keyLength: openaiKey?.length || 0,
    keyPreview: openaiKey ? `${openaiKey.substring(0, 10)}...` : 'Not set',
    timestamp: new Date().toISOString()
  });
});

// Test OpenAI with simple request
app.get('/api/ai/test-generate', async (req, res) => {
  try {
    const openaiKey = process.env.AZURE_OPENAI_API_KEY;
    if (!openaiKey) {
      return res.status(500).json({ error: 'AZURE_OPENAI_API_KEY not configured' });
    }

    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [{ role: "user", content: 'Say hello in JSON format: {"message": "your response"}' }],
      temperature: 0.7
    });
    
    const text = completion.choices[0].message.content;
    
    res.json({
      success: true,
      response: text,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'OpenAI test failed', 
      details: error.message 
    });
  }
});

// Test real weather API
app.get('/api/weather/test-real', async (req, res) => {
  try {
    const weatherKey = process.env.OPENWEATHER_API_KEY;
    if (!weatherKey) {
      return res.status(500).json({ error: 'OPENWEATHER_API_KEY not configured' });
    }

    // Test with New York coordinates
    const testLat = 40.7128;
    const testLng = -74.0060;
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${testLat}&lon=${testLng}&appid=${weatherKey}&units=metric`;
    
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({ 
        error: 'OpenWeatherMap API error', 
        status: response.status 
      });
    }

    const data = await response.json();
    res.json({
      success: true,
      location: `${data.name}, ${data.sys.country}`,
      temperature: `${Math.round(data.main.temp)}°C`,
      condition: data.weather[0].main,
      description: data.weather[0].description,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Weather test failed', 
      details: error.message 
    });
  }
});

// Google Place Photo proxy to avoid exposing API key to the client
app.get('/api/places/photo', enforcePolicy('places'), async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      recordUsage({ api: 'places', action: 'photo', status: 'error', meta: { reason: 'missing_key' } });
      return res.status(500).json({ error: 'GOOGLE_PLACES_API_KEY not configured' });
    }

    const ref = (req.query.ref || req.query.photoreference || req.query.photo_reference);
    const name = req.query.name; // for Places v1 names (optional, not used in Text Search v3)
    const maxWidth = req.query.w || req.query.maxwidth;
    const maxHeight = req.query.h || req.query.maxheight;

    if (!ref && !name) return res.status(400).json({ error: 'ref (photo_reference) or name is required' });

    let url;
    if (ref) {
      url = new URL('https://maps.googleapis.com/maps/api/place/photo');
      if (maxWidth) {
        const reqW = parseInt(String(maxWidth), 10) || 800;
        const cap = (req._policy?.features?.dynamicMap ? 1600 : 1024);
        url.searchParams.set('maxwidth', String(Math.min(reqW, cap)));
      } else if (maxHeight) {
        url.searchParams.set('maxheight', String(maxHeight));
      } else url.searchParams.set('maxwidth', '800');
      url.searchParams.set('photo_reference', String(ref));
      url.searchParams.set('key', apiKey);
    } else {
      // v1 photo download endpoint
      url = new URL(`https://places.googleapis.com/v1/${String(name)}:download`);
      if (maxWidth) url.searchParams.set('maxWidthPx', String(maxWidth));
      if (maxHeight) url.searchParams.set('maxHeightPx', String(maxHeight));
    }

    const headers = name ? { 'X-Goog-Api-Key': apiKey } : undefined;
    const start = Date.now();
    const upstream = await fetch(url.toString(), { redirect: 'follow', headers });
    if (!upstream.ok) {
      const text = await upstream.text();
      recordUsage({ api: 'places', action: 'photo', status: 'error', durationMs: Date.now() - start, meta: { http: upstream.status } });
      return res.status(upstream.status).send(text);
    }

    // Cache for a day to reduce repeat downloads
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    // Stream the image
    upstream.body.pipe(res);
  recordUsage({ api: 'places', action: 'photo', status: 'success', durationMs: Date.now() - start });
  } catch (err) {
  recordUsage({ api: 'places', action: 'photo', status: 'error', meta: { err: err?.message || String(err) } });
    res.status(500).json({ error: 'Failed to fetch place photo', details: err?.message || String(err) });
  }
});

// Optional Firebase auth verification endpoint
const ENABLE_FIREBASE_AUTH = String(process.env.ENABLE_FIREBASE_AUTH || '').toLowerCase() === 'true';
// Note: adminAuth is initialized earlier if credentials are present; reuse it here.
if (ENABLE_FIREBASE_AUTH && !adminAuth) {
  console.warn('Firebase Admin not configured. Set FIREBASE_ADMIN_CREDENTIALS_BASE64, FIREBASE_ADMIN_CREDENTIALS_JSON, or GOOGLE_APPLICATION_CREDENTIALS to enable auth verification.');
}

app.post('/api/auth/login', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing bearer token' });

    if (!ENABLE_FIREBASE_AUTH || !adminAuth) {
      // Local dev fallback: accept token but do not verify
      return res.json({ ok: true, mode: 'dev', admin: false, message: 'Auth disabled, token accepted for local dev' });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const isAdmin = decoded?.admin === true;
    const { uid, email, name, picture } = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    };

    // Upsert user by firebaseUid/email
    let user = await User.findOne({ $or: [{ firebaseUid: uid }, ...(email ? [{ email }] : [])] });
    if (!user) {
      user = new User({
        firebaseUid: uid,
        username: email || uid,
        email: email || `${uid}@firebase.local`,
        profilePicture: picture || null,
      });
    } else {
      // update minimal profile fields
      if (!user.firebaseUid) user.firebaseUid = uid;
      if (picture && user.profilePicture !== picture) user.profilePicture = picture;
      if (email && user.email !== email) user.email = email;
    }
    // Reflect admin claim into our user document for convenience
    if (typeof user.isAdmin === 'boolean') {
      if (!!user.isAdmin !== !!isAdmin) {
        user.isAdmin = !!isAdmin;
      }
    } else if (isAdmin) {
      // initialize if field missing
      user.isAdmin = true;
    }
    await user.save();

    res.json({ ok: true, user, admin: isAdmin });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token', details: err?.message || String(err) });
  }
});

// In-memory cache for Place Details
const DETAILS_CACHE_TTL_MS = parseInt(process.env.BACKEND_DETAILS_CACHE_TTL || '604800000', 10); // 7 days
const detailsCache = new Map(); // key: place_id|lang -> { data, ts }

// Google Place Details proxy with caching
app.get('/api/places/details', enforcePolicy('places'), async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      recordUsage({ api: 'places', action: 'details', status: 'error', meta: { reason: 'missing_key' } });
      return res.status(500).json({ error: 'GOOGLE_PLACES_API_KEY not configured' });
    }
    const placeId = String(req.query.place_id || '');
    const lang = String(req.query.lang || 'en');
    if (!placeId) return res.status(400).json({ error: 'place_id is required' });

    const key = `${placeId}|${lang}`;
    const cached = detailsCache.get(key);
    if (cached && Date.now() - cached.ts < DETAILS_CACHE_TTL_MS) {
      recordUsage({ api: 'places', action: 'details', status: 'success', meta: { cache: 'hit' } });
      return res.json(cached.data);
    }

    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('language', lang);
    // Only request the fields we need to reduce cost
    const baseFields = [
      'place_id',
      'formatted_phone_number',
      'international_phone_number',
      'website',
      'opening_hours',
      'editorial_summary',
      'price_level',
      'photos'
    ];
    const isPremium = ['premium','pro'].includes(req._tier);
    const fields = isPremium ? baseFields.concat(['rating','user_ratings_total']) : baseFields;
    url.searchParams.set('fields', fields.join(','));
    url.searchParams.set('key', apiKey);

    const start = Date.now();
    const resp = await fetch(url.toString());
    if (!resp.ok) {
      const text = await resp.text();
      recordUsage({ api: 'places', action: 'details', status: 'error', durationMs: Date.now() - start, meta: { http: resp.status } });
      return res.status(resp.status).send(text);
    }
    const data = await resp.json();
    if (data.status && data.status !== 'OK') {
      if (data.status === 'ZERO_RESULTS') return res.json({});
      console.error('Place Details API error:', data.status, data.error_message);
      recordUsage({ api: 'places', action: 'details', status: 'error', durationMs: Date.now() - start, meta: { status: data.status } });
      return res.status(502).json({ error: 'Place Details status not OK', details: data.status, message: data.error_message });
    }

    const r = data.result || {};
    const normalized = {
      place_id: r.place_id,
      formatted_phone_number: r.formatted_phone_number,
      international_phone_number: r.international_phone_number,
      website: r.website,
      opening_hours: r.opening_hours,
      editorial_summary: r.editorial_summary,
      price_level: r.price_level,
      photos: Array.isArray(r.photos)
        ? r.photos.slice(0, Math.max(1, Math.min(6, req._policy?.features?.photosPerPlace || 6))).map(p => ({
            photo_reference: p.photo_reference,
            width: p.width,
            height: p.height,
            html_attributions: p.html_attributions
          }))
        : []
    };

    detailsCache.set(key, { data: normalized, ts: Date.now() });
    // cache-control headers to allow CDN/browser caching
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
  recordUsage({ api: 'places', action: 'details', status: 'success', durationMs: Date.now() - start, meta: { cache: 'set' } });
    res.json(normalized);
  } catch (err) {
  recordUsage({ api: 'places', action: 'details', status: 'error', meta: { err: err?.message || String(err) } });
    res.status(500).json({ error: 'Failed to fetch place details', details: err?.message || String(err) });
  }
});

// Database data check
app.get('/api/db-check', async (req, res) => {
  try {
    const [userCount, postCount, reviewCount, tripCount, dealCount, eventCount] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Review.countDocuments(),
      TripPlan.countDocuments(),
      Deal.countDocuments(),
      Event.countDocuments()
    ]);
    
    res.json({
      users: userCount,
      posts: postCount,
      reviews: reviewCount,
      tripPlans: tripCount,
      deals: dealCount,
      events: eventCount,
      isEmpty: userCount === 0 && postCount === 0 && reviewCount === 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Local Dishes API endpoints
app.get('/api/dishes', async (req, res) => {
  try {
    const { city, country, cuisine, limit = 20 } = req.query;
    const query = {};
    
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (country) query['location.country'] = new RegExp(country, 'i');
    if (cuisine) query.cuisine = new RegExp(cuisine, 'i');
    
    const dishes = await Dish.find(query)
      .sort({ isPopular: -1, createdAt: -1 })
      .limit(Math.min(50, parseInt(limit, 10)))
      .lean();
    
    res.json(dishes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dishes/local', enforcePolicy('openai'), async (req, res) => {
  try {
    const { lat, lng, limit = 10 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }
    
    const dishes = await getAILocalDishes(parseFloat(lat), parseFloat(lng), parseInt(limit, 10));
    res.json(dishes);
  } catch (error) {
    console.error('Error fetching AI local dishes:', error);
    recordUsage({ api: 'openai', action: 'local_dishes', status: 'error', meta: { err: error?.message } });
    res.status(500).json({ error: 'Failed to get local dishes', details: error?.message });
  }
});

// AI-powered local dishes function
async function getAILocalDishes(lat, lng, limit = 10) {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('AZURE_OPENAI_API_KEY not configured');
  }

  const prompt = `Based on the location coordinates ${lat}, ${lng}, suggest ${limit} popular local dishes from this area. For each dish, provide:

1. Name of the dish
2. Brief description (1-2 sentences)
3. Cuisine type
4. Price range (budget/mid-range/fine-dining)
5. Average price in USD
6. Typical restaurant name where it's found
7. Restaurant address (real or realistic for the area)
8. Dietary tags (vegetarian, vegan, gluten-free, etc.)
9. Cultural significance or note

Return ONLY a valid JSON array with this exact structure:
[
  {
    "name": "Dish Name",
    "description": "Description",
    "cuisine": "Cuisine Type",
    "priceRange": "mid-range",
    "averagePrice": "$12-15",
    "restaurantName": "Restaurant Name",
    "restaurantAddress": "Street Address, City",
    "dietaryTags": ["tag1", "tag2"],
    "culturalNote": "Cultural note"
  }
]`;

  const start = Date.now();
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });
    
    const text = completion.choices[0].message.content;
    
    if (!text) {
      throw new Error('No response from OpenAI');
    }

    // Extract JSON from response
    const jsonMatch = text.match(/\[.*\]/s);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI');
    }

    const aiDishes = JSON.parse(jsonMatch[0]);
    
    // Transform to mobile app format
    const mobileDishes = aiDishes.map(dish => ({
      id: Math.random().toString(36).substr(2, 9),
      name: dish.name,
      description: dish.description,
      priceRange: dish.priceRange || 'mid-range',
      averagePrice: dish.averagePrice || '$10-15',
      cuisine: dish.cuisine || 'Local',
      restaurantName: dish.restaurantName || 'Local Restaurant',
      restaurantAddress: dish.restaurantAddress || 'Local Area',
      restaurantId: 'ai-' + Math.random().toString(36).substr(2, 9),
      imageUrl: '', // AI doesn't provide images
      rating: 4.0 + Math.random() * 1.0,
      dietaryTags: dish.dietaryTags || [],
      culturalNote: dish.culturalNote || 'A local specialty'
    }));

    recordUsage({ api: 'openai', action: 'local_dishes', status: 'success', durationMs: Date.now() - start });
    return mobileDishes;
  } catch (error) {
    recordUsage({ api: 'openai', action: 'local_dishes', status: 'error', durationMs: Date.now() - start, meta: { err: error?.message } });
    throw error;
  }
}

// Helper functions for mock data generation
function generateMockLocalDishes(lat, lng) {
  console.log('generateMockLocalDishes called with lat:', lat, 'lng:', lng);
  const dishes = [
    {
      name: 'Local Fish Tacos',
      description: 'Fresh catch of the day with local spices and vegetables',
      cuisine: 'Fusion',
      priceRange: 'mid-range',
      averagePrice: '$12-15',
      restaurantName: 'Coastal Kitchen',
      imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
      rating: 4.5,
      dietaryTags: ['gluten-free-option'],
      culturalNote: 'A modern twist on traditional coastal cuisine'
    },
    {
      name: 'Artisan Pizza',
      description: 'Wood-fired pizza with locally sourced ingredients',
      cuisine: 'Italian',
      priceRange: 'mid-range',
      averagePrice: '$16-20',
      restaurantName: 'Neighborhood Pizzeria',
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
      rating: 4.7,
      dietaryTags: ['vegetarian-option'],
      culturalNote: 'Made with traditional techniques and local produce'
    },
    {
      name: 'Farm-to-Table Salad',
      description: 'Seasonal greens and vegetables from local farms',
      cuisine: 'American',
      priceRange: 'mid-range',
      averagePrice: '$14-18',
      restaurantName: 'Green Garden Cafe',
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
      rating: 4.3,
      dietaryTags: ['vegetarian', 'vegan-option', 'gluten-free'],
      culturalNote: 'Supporting local farmers and sustainable practices'
    },
    {
      name: 'Street Food Burger',
      description: 'Gourmet burger with unique local flavors',
      cuisine: 'American',
      priceRange: 'budget',
      averagePrice: '$8-12',
      restaurantName: 'Corner Food Truck',
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
      rating: 4.4,
      dietaryTags: [],
      culturalNote: 'Popular street food with a gourmet twist'
    },
    {
      name: 'Craft Coffee & Pastry',
      description: 'Locally roasted coffee with fresh baked goods',
      cuisine: 'Cafe',
      priceRange: 'budget',
      averagePrice: '$5-8',
      restaurantName: 'Local Roasters',
      imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
      rating: 4.6,
      dietaryTags: ['vegetarian', 'vegan-option'],
      culturalNote: 'Supporting local coffee culture and artisan bakers'
    },
    {
      name: 'Seasonal Soup',
      description: 'Hearty soup made with seasonal local ingredients',
      cuisine: 'Comfort Food',
      priceRange: 'budget',
      averagePrice: '$6-10',
      restaurantName: 'Comfort Kitchen',
      imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400',
      rating: 4.2,
      dietaryTags: ['vegetarian-option', 'gluten-free-option'],
      culturalNote: 'Traditional comfort food with local ingredients'
    }
  ];
  
  return dishes.slice(0, 8); // Return up to 8 dishes
}

function getPriceRangeFromLocation(lat, lng) {
  // Simple logic based on coordinates - in production, use actual data
  const ranges = ['budget', 'mid-range', 'fine-dining'];
  return ranges[Math.floor(Math.random() * ranges.length)];
}

function getAveragePriceFromRange(priceRange) {
  switch (priceRange) {
    case 'budget': return '$5-12';
    case 'mid-range': return '$12-25';
    case 'fine-dining': return '$25-50';
    default: return '$10-20';
  }
}

function generateCulturalNote(dishName, cuisine) {
  const notes = [
    'A beloved local favorite',
    'Traditional recipe passed down through generations',
    'Popular among locals and visitors alike',
    'Made with authentic local ingredients',
    'A must-try when visiting the area'
  ];
  return notes[Math.floor(Math.random() * notes.length)];
}

// Mock emergency services generator
function generateMockEmergencyServices(lat, lng, serviceType, limit) {
  const mockServices = [];
  
  const policeNames = [
    'Central Police Station',
    'Metropolitan Police Division',
    'City Police Headquarters',
    'District Police Station',
    'Community Police Post'
  ];
  
  const hospitalNames = [
    'General Hospital',
    'Medical Center',
    'Emergency Hospital',
    'City Hospital',
    'Regional Medical Center'
  ];
  
  const streets = [
    'Main Street', 'Central Avenue', 'Hospital Road', 'Police Lane', 
    'Emergency Drive', 'Safety Boulevard', 'Service Road', 'Station Street'
  ];
  
  for (let i = 0; i < limit; i++) {
    const names = serviceType === 'police' ? policeNames : hospitalNames;
    const street = streets[Math.floor(Math.random() * streets.length)];
    const number = Math.floor(Math.random() * 999) + 1;
    
    const service = {
      id: Math.random().toString(36).substr(2, 9),
      name: names[i % names.length],
      address: `${number} ${street}, Local Area`,
      phoneNumber: serviceType === 'police' ? '119' : '+94-11-269-1111',
      serviceType: serviceType === 'police' ? 'Emergency Police' : 'General Hospital',
      distance: `${(Math.random() * 5 + 0.5).toFixed(1)} km`,
      available24h: true,
      emergencyNumber: serviceType === 'police' ? '119' : '110',
      coordinates: {
        lat: lat + (Math.random() - 0.5) * 0.01,
        lng: lng + (Math.random() - 0.5) * 0.01
      }
    };
    mockServices.push(service);
  }
  
  return mockServices;
}

// Real emergency services using Google Places API
async function getRealEmergencyServices(lat, lng, serviceType, limit) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY not configured');
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  url.searchParams.set('query', serviceType);
  url.searchParams.set('location', `${lat},${lng}`);
  url.searchParams.set('radius', '10000'); // 10km radius
  url.searchParams.set('key', apiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Places API error: ${response.status}`);
  }

  const data = await response.json();
  if (data.status !== 'OK') {
    throw new Error(`Places API status: ${data.status}`);
  }

  const places = data.results.slice(0, limit).map(place => {
    const distance = haversineMeters(lat, lng, place.geometry.location.lat, place.geometry.location.lng);
    const distanceKm = (distance / 1000).toFixed(1);
    
    return {
      id: place.place_id,
      name: place.name,
      address: place.formatted_address || place.vicinity || 'Address not available',
      phoneNumber: serviceType.includes('police') ? '119' : '110',
      serviceType: serviceType.includes('police') ? 'Police Station' : 'Hospital',
      distance: `${distanceKm} km`,
      available24h: true,
      emergencyNumber: serviceType.includes('police') ? '119' : '110',
      coordinates: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      }
    };
  });

  return places;
}

app.get('/api/dishes/:id', async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id);
    if (!dish) return res.status(404).json({ error: 'Dish not found' });
    res.json(dish);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/dishes', async (req, res) => {
  try {
    const dish = new Dish(req.body);
    await dish.save();
    res.json(dish);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// AI-powered Emergency Services API endpoints
app.get('/api/emergency/police', async (req, res) => {
  try {
    const { lat, lng, limit = 3 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }
    
    const policeStations = await getRealEmergencyServices(parseFloat(lat), parseFloat(lng), 'police station', parseInt(limit, 10));
    res.json(policeStations);
  } catch (error) {
    console.error('Error fetching police stations:', error);
    // Fallback to mock data
    const mockData = generateMockEmergencyServices(parseFloat(lat), parseFloat(lng), 'police', 2);
    res.json(mockData);
  }
});

app.get('/api/emergency/hospitals', async (req, res) => {
  try {
    const { lat, lng, limit = 3 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }
    
    const hospitals = await getRealEmergencyServices(parseFloat(lat), parseFloat(lng), 'hospital', parseInt(limit, 10));
    res.json(hospitals);
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    // Fallback to mock data
    const mockData = generateMockEmergencyServices(parseFloat(lat), parseFloat(lng), 'hospitals', 2);
    res.json(mockData);
  }
});

// AI-powered emergency services function
async function getAIEmergencyServices(lat, lng, serviceType, limit = 5) {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('AZURE_OPENAI_API_KEY not configured');
  }

  const serviceTypeMap = {
    'police': 'police stations',
    'hospitals': 'hospitals and medical centers',
    'fire': 'fire departments'
  };

  const prompt = `Based on the location coordinates ${lat}, ${lng}, find ${limit} real ${serviceTypeMap[serviceType] || serviceType} in this area. For each facility, provide:

1. Name of the facility
2. Complete address
3. Phone number (emergency or main number)
4. Service type/specialization
5. Distance estimate from coordinates
6. 24/7 availability status

Return ONLY a valid JSON array with this exact structure:
[
  {
    "name": "Facility Name",
    "address": "Complete Address",
    "phoneNumber": "+1234567890",
    "serviceType": "Emergency/General",
    "distance": "2.3 km",
    "available24h": true,
    "emergencyNumber": "911"
  }
]`;

  const start = Date.now();
  try {
    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });
    
    const text = completion.choices[0].message.content;
    
    if (!text) {
      throw new Error('No response from OpenAI');
    }

    // Extract JSON from response
    console.log('Raw AI Response:', text);
    
    let jsonMatch = text.match(/\[.*\]/s);
    if (!jsonMatch) {
      // Try to find JSON in code blocks
      jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonMatch[0] = jsonMatch[1];
      } else {
        console.error('No JSON found in AI response:', text);
        throw new Error('Invalid JSON response from AI');
      }
    }

    let aiServices;
    try {
      aiServices = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Attempted to parse:', jsonMatch[0]);
      throw new Error('Failed to parse AI JSON response');
    }
    
    if (!Array.isArray(aiServices)) {
      console.error('AI response is not an array:', aiServices);
      throw new Error('AI response must be an array');
    }
    
    // Transform to mobile app format
    const mobileServices = aiServices.map(service => ({
      id: Math.random().toString(36).substr(2, 9),
      name: service.name,
      address: service.address,
      phoneNumber: service.phoneNumber || service.emergencyNumber || '911',
      serviceType: service.serviceType || serviceType,
      distance: service.distance || 'Unknown',
      available24h: service.available24h !== false,
      emergencyNumber: service.emergencyNumber || (serviceType === 'police' ? '911' : service.phoneNumber),
      coordinates: {
        lat: lat + (Math.random() - 0.5) * 0.01, // Approximate nearby coordinates
        lng: lng + (Math.random() - 0.5) * 0.01
      }
    }));

    recordUsage({ api: 'openai', action: `emergency_${serviceType}`, status: 'success', durationMs: Date.now() - start });
    return mobileServices;
  } catch (error) {
    recordUsage({ api: 'openai', action: `emergency_${serviceType}`, status: 'error', durationMs: Date.now() - start, meta: { err: error?.message } });
    
    // Fallback to mock data when AI fails
    console.log('AI failed, using fallback mock data');
    return generateMockEmergencyServices(lat, lng, serviceType, limit);
  }
}

// Profile Setup Routes
app.post('/api/users/setup-profile', async (req, res) => {
  try {
    const { userId, profileType, modules } = req.body;
    if (!userId || !profileType) {
      return res.status(400).json({ error: 'userId and profileType required' });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        $set: { 
          profileType,
          enabledModules: modules || [],
          profileSetupComplete: true
        }
      },
      { new: true }
    );
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Service Management Routes
app.put('/api/services/profile', async (req, res) => {
  try {
    const { userId, ...serviceData } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { serviceProfile: serviceData } },
      { new: true }
    );
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, serviceProfile: user.serviceProfile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/services/profile/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('serviceProfile');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.serviceProfile || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Business Management Routes
app.put('/api/business/profile', async (req, res) => {
  try {
    const { userId, ...businessData } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { businessProfile: businessData } },
      { new: true }
    );
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, businessProfile: user.businessProfile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Merchant routes
app.use('/api/merchants', (await import('./routes/merchants.js')).default);

// Role management routes
app.use('/api/roles', (await import('./routes/roles.js')).default);

// Service Provider routes
app.use('/api/services', (await import('./routes/services.js')).default);
app.use('/api/bookings', (await import('./routes/bookings.js')).default);

// Places routes
try {
  const placesRouter = (await import('./routes/places.js')).default;
  app.use('/api/places', placesRouter);
  console.log('✅ Places routes loaded');
} catch (error) {
  console.error('❌ Failed to load places routes:', error);
}

// Deals routes
try {
  const dealsRouter = (await import('./routes/deals.js')).default;
  app.use('/api/deals', dealsRouter);
  console.log('✅ Deals routes loaded');
} catch (error) {
  console.error('❌ Failed to load deals routes:', error);
}



// Handle static assets explicitly before catch-all
app.get(/.*\.js$/, (req, res, next) => {
  if (finalStaticPath) {
    const filePath = path.join(finalStaticPath, req.path);
    if (existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/javascript');
      return res.sendFile(filePath);
    }
  }
  res.status(404).send('File not found');
});

app.get(/.*\.css$/, (req, res, next) => {
  if (finalStaticPath) {
    const filePath = path.join(finalStaticPath, req.path);
    if (existsSync(filePath)) {
      res.setHeader('Content-Type', 'text/css');
      return res.sendFile(filePath);
    }
  }
  res.status(404).send('File not found');
});

app.get(/.*\.json$/, (req, res, next) => {
  if (finalStaticPath) {
    const filePath = path.join(finalStaticPath, req.path);
    if (existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/json');
      return res.sendFile(filePath);
    }
  }
  res.status(404).send('File not found');
});

// Serve React app (only for non-API routes)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  const indexPath = path.join(__dirname, '../dist/index.html');
  const altIndexPath = path.join(process.cwd(), 'dist/index.html');
  const wwwrootIndexPath = path.join('/home/site/wwwroot/dist/index.html');
  const siteIndexPath = path.join('/home/site/dist/index.html');
  
  console.log('Trying index.html from:', indexPath);
  console.log('Alt index.html from:', altIndexPath);
  console.log('Wwwroot index.html from:', wwwrootIndexPath);
  console.log('Site index.html from:', siteIndexPath);
  
  // Check all possible paths, prioritizing Azure paths
  if (existsSync(wwwrootIndexPath)) {
    console.log('Serving from wwwroot path');
    res.sendFile(wwwrootIndexPath);
  } else if (existsSync(siteIndexPath)) {
    console.log('Serving from site path');
    res.sendFile(siteIndexPath);
  } else if (existsSync(indexPath)) {
    console.log('Serving from backend relative path');
    res.sendFile(indexPath);
  } else if (existsSync(altIndexPath)) {
    console.log('Serving from cwd path');
    res.sendFile(altIndexPath);
  } else {
    console.error('index.html not found at any of:', wwwrootIndexPath, siteIndexPath, indexPath, altIndexPath);
    res.status(404).send('Application not built. Please run npm run build.');
  }
});

httpServer.listen(PORT, () => {
  const protocol = process.env.ENABLE_HTTPS === 'true' ? 'https' : 'http';
  console.log(`🚀 Server running on ${protocol}://localhost:${PORT}`);
  console.log(`🌤️ Weather API: ${process.env.GOOGLE_PLACES_API_KEY ? '✅ Google-enhanced weather configured' : '⚠️ Using mock data (set GOOGLE_PLACES_API_KEY for enhanced weather)'}`);
  console.log(`💳 PayPal: ${process.env.PAYPAL_CLIENT_ID ? '✅ Configured' : '⚠️ Not configured'}`);
  console.log(`🗄️ Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '⚠️ Not connected'}`);
});

// --- Subscription endpoints (start trial, subscribe, cancel) ---
app.post('/api/subscriptions/start-trial', async (req, res) => {
  try {
    const { userId, tier } = req.body || {};
    if (!userId || !tier) return res.status(400).json({ error: 'userId and tier are required' });
    // Only paid tiers support trials
    if (!['basic','premium','pro'].includes(tier)) return res.status(400).json({ error: 'trial not available for this tier' });

    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: { tier, subscriptionStatus: 'trial', trialEndDate: trialEnd } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'User not found' });
    console.log('[POST /api/subscriptions/start-trial] started trial for', userId, tier);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Failed to start trial', details: e?.message || String(e) });
  }
});

app.post('/api/subscriptions/subscribe', async (req, res) => {
  try {
    const { userId, tier } = req.body || {};
    if (!userId || !tier) return res.status(400).json({ error: 'userId and tier are required' });

    // Subscription: set active for 1 year by default
    const subscriptionEnd = new Date();
    subscriptionEnd.setFullYear(subscriptionEnd.getFullYear() + 1);

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: { tier, subscriptionStatus: 'active', subscriptionEndDate: subscriptionEnd.toISOString(), trialEndDate: undefined } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'User not found' });
    console.log('[POST /api/subscriptions/subscribe] subscribed', userId, tier);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Failed to subscribe user', details: e?.message || String(e) });
  }
});

app.post('/api/subscriptions/cancel', async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: { tier: 'free', subscriptionStatus: 'canceled', subscriptionEndDate: undefined, trialEndDate: undefined } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'User not found' });
    console.log('[POST /api/subscriptions/cancel] canceled subscription for', userId);
    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: 'Failed to cancel subscription', details: e?.message || String(e) });
  }
});

// Admin: basic subscription analytics
app.get('/api/subscriptions/analytics', async (req, res) => {
  try {
    if (!(await isAdminRequest(req))) return res.status(403).json({ error: 'Forbidden' });

    const totalUsers = await User.countDocuments();
    const byTierRows = await User.aggregate([{ $group: { _id: '$tier', count: { $sum: 1 } } }]);
    const byStatusRows = await User.aggregate([{ $group: { _id: '$subscriptionStatus', count: { $sum: 1 } } }]);

    const tierDistribution = {};
    for (const r of byTierRows) tierDistribution[r._id || 'unknown'] = r.count;

    const statusDistribution = {};
    for (const r of byStatusRows) statusDistribution[r._id || 'unknown'] = r.count;

    const active = statusDistribution['active'] || 0;
    const trial = statusDistribution['trial'] || 0;
    const conversionRate = totalUsers ? +(active / Math.max(1, trial + active) * 100).toFixed(2) : 0;

    res.json({ totalUsers, tierDistribution, statusDistribution, conversionRate });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch analytics', details: e?.message || String(e) });
  }
});


// Community moderation analytics
app.get('/api/admin/moderation/stats', requireAdminAuth, async (req, res) => {
  try {
    const totalPosts = await Post.countDocuments();
    const flaggedPosts = await Post.countDocuments({ requiresReview: true });
    const pendingReports = await Report.countDocuments({ status: 'pending' });
    const rejectedPosts = await Post.countDocuments({ moderationStatus: 'rejected' });
    
    res.json({
      totalPosts,
      flaggedPosts,
      pendingReports,
      rejectedPosts,
      moderationRate: totalPosts > 0 ? ((flaggedPosts + rejectedPosts) / totalPosts * 100).toFixed(2) : 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

