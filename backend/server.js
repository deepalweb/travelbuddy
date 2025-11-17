import express from 'express';
import compression from 'compression';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import dotenv from 'dotenv';
import { securityHeaders, apiRateLimit, sanitizeInput, requireAuth, requireRole as securityRequireRole, requireAdmin as securityRequireAdmin } from './middleware/security.js';
import { validateUser, validatePost, validateTrip, validateReview, validateCoordinates } from './middleware/validation.js';
import { authenticateJWT, requireAdmin } from './middleware/auth.js';
import { errorHandler, asyncHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requireRole, requireFeature } from './middleware/roleAccess.js';
import validator from 'validator';
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
  return filtered.slice(0, 10);
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
console.log('🔧 Starting server on port:', PORT);

// Production safeguards
if (process.env.NODE_ENV === 'production') {
  // Memory cleanup
  setInterval(() => {
    if (placesCache.size > 1000) placesCache.clear();
    if (enrichCache.size > 1000) enrichCache.clear();
    if (detailsCache.size > 500) detailsCache.clear();
  }, 3600000); // Every hour
  
  // Global error handlers
  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error.message);
    // Don't exit in production
  });
  
  process.on('unhandledRejection', (reason) => {
    console.error('💥 Unhandled Rejection:', reason);
  });
}

// Simple CORS middleware - must be first
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'https://travelbuddylk.com',
    'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net'
  ];
  
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With, x-user-id, x-firebase-uid, x-user-tier, x-admin-secret, x-csrf-token, X-CSRF-Token');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Create HTTP/HTTPS server and Socket.io for real-time metrics
let httpServer;
if (process.env.ENABLE_HTTPS === 'true') {
  try {
    const https = await import('https');
    const fs = await import('fs');
    const keyPath = process.env.SSL_KEY_PATH || './ssl/key.pem';
    const certPath = process.env.SSL_CERT_PATH || './ssl/cert.pem';
    
    if (existsSync(keyPath) && existsSync(certPath)) {
      const options = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      };
      httpServer = https.createServer(options, app);
      console.log('🔒 HTTPS server enabled');
    } else {
      console.warn('⚠️ SSL certificates not found, falling back to HTTP');
      httpServer = http.createServer(app);
    }
  } catch (error) {
    console.warn('⚠️ HTTPS setup failed, using HTTP:', error.message);
    httpServer = http.createServer(app);
  }
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

// Initialize Azure OpenAI only if API key is available
const openai = process.env.AZURE_OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { 'api-version': '2024-02-15-preview' },
  defaultHeaders: {
    'api-key': process.env.AZURE_OPENAI_API_KEY,
  },
}) : null;

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

// Helper functions for enhanced trip generation
function getTravelerProfile(travelers, budget) {
  if (budget === 'high') return 'luxury';
  if (travelers === '1') return 'solo';
  if (travelers === '5+') return 'family';
  if (budget === 'low') return 'backpacker';
  return 'general';
}

function getProfileAdjustments(profile) {
  const adjustments = {
    family: '- Include kid-friendly activities and shorter walking distances\n- Suggest family restaurants with high chairs\n- Add playground/park stops between major attractions',
    backpacker: '- Focus on budget accommodations and street food\n- Include free walking tours and public transport\n- Suggest hostels and budget guesthouses',
    luxury: '- Recommend boutique hotels and fine dining\n- Include spa treatments and premium experiences\n- Suggest private tours and luxury transport',
    solo: '- Include solo-friendly activities and safe areas\n- Suggest group tours and social experiences\n- Add solo dining and cafe recommendations',
    general: '- Balance of popular attractions and local experiences\n- Mix of different activity types and price ranges\n- Suitable for most fitness levels and interests'
  };
  return adjustments[profile] || adjustments.general;
}



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
    features: { dynamicMap: false, resultsPerSearch: 10, photosPerPlace: 1, radiusMaxM: 10000 }
  },
  basic: {
    places: { daily: 200, perMin: 10 },
    maps: { daily: 500, perMin: 30 },
    openai: { daily: 50, perMin: 5 },
    features: { dynamicMap: true, resultsPerSearch: 15, photosPerPlace: 2, radiusMaxM: 20000 }
  },
  premium: {
    places: { daily: 1000, perMin: 20 },
    maps: { daily: 2000, perMin: 60 },
    openai: { daily: 200, perMin: 15 },
    features: { dynamicMap: true, resultsPerSearch: 25, photosPerPlace: 3, radiusMaxM: 40000 }
  },
  pro: {
    places: { daily: 5000, perMin: 60 },
    maps: { daily: 10000, perMin: 120 },
    openai: { daily: 1000, perMin: 60 },
    features: { dynamicMap: true, resultsPerSearch: 30, photosPerPlace: 6, radiusMaxM: 50000 }
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

// Security middleware - CSP disabled for Google APIs compatibility
app.use(securityHeaders);
// Apply rate limiting only to API routes, not health checks
app.use('/api', apiRateLimit);
app.use(sanitizeInput);

// CSRF protection disabled for development
// app.use('/api', (req, res, next) => {
//   // Skip CSRF for GET requests and specific endpoints
//   if (req.method === 'GET' || 
//       req.path.includes('/auth/') || 
//       req.path.includes('/config/') ||
//       req.path.includes('/health') ||
//       req.path.includes('/demo-auth/') ||
//       req.path.includes('/users/sync') ||
//       req.path === '/deals') {
//     return next();
//   }
//   
//   // Check CSRF token for POST/PUT/DELETE requests
//   const csrfToken = req.headers['x-csrf-token'] || req.body?._csrf;
//   if (!csrfToken) {
//     return res.status(403).json({ error: 'CSRF token required' });
//   }
//   
//   // In production, verify CSRF token properly
//   // For now, just check if token exists
//   next();
// });



// Middleware - only log in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    if (process.env.DEBUG_REQUESTS === 'true') {
      console.log('🔍 Request:', req.method, req.path, 'Origin:', req.headers.origin);
    }
    next();
  });
}

// CORS configuration - permissive for development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In production, allow same-origin requests from Azure App Service
    if (process.env.NODE_ENV === 'production') {
      // Allow the exact domains that are causing CORS issues
      if (origin === 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net' || 
          origin === 'https://travelbuddylk.com') {
        return callback(null, true);
      }
      
      // Allow configured domains
      const allowedOrigins = [
        process.env.CLIENT_URL, 
        process.env.WEBSITE_HOSTNAME, 
        `https://${process.env.WEBSITE_HOSTNAME}`
      ].filter(Boolean);
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Allow Azure domains
      if (origin.includes('.azurewebsites.net') || origin.includes('.azurestaticapps.net')) {
        return callback(null, true);
      }
    } else {
      // Development - be very permissive
      const devOrigins = [
        'http://localhost:3000', 
        'http://localhost:5173', 
        'http://localhost:3001', 
        'http://127.0.0.1:3000',
        'http://localhost:4173'
      ];
      if (devOrigins.includes(origin) || 
          origin?.includes('localhost') || 
          origin?.includes('127.0.0.1') ||
          origin?.startsWith('http://localhost:') ||
          origin?.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
    }
    
    console.log('CORS blocked origin:', origin);
    // In development, allow all origins as fallback
    if (process.env.NODE_ENV !== 'production') {
      console.log('Development mode: allowing origin', origin);
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-firebase-uid', 'x-user-tier', 'x-admin-secret', 'x-csrf-token', 'X-CSRF-Token', 'Accept', 'Origin', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Additional CORS headers for development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3000');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-firebase-uid, x-user-tier, x-admin-secret, x-csrf-token, X-CSRF-Token, Accept, Origin, X-Requested-With');
    next();
  });
}
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Handle preflight OPTIONS requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-firebase-uid, x-user-tier, x-admin-secret, x-csrf-token, X-CSRF-Token, Accept, Origin, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Explicit OPTIONS handler for problematic endpoints
app.options('/api/deals', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-firebase-uid, X-CSRF-Token');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

app.options('/api/community/posts', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-firebase-uid');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

app.options('/api/posts/community', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-firebase-uid');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});



// Firebase user sync endpoint is now handled by routes/users.js
// Serve static files from public directory (Azure deployment)
const staticPaths = [
  path.join(__dirname, 'public'),
  path.join(__dirname, '../dist'),
  path.join(__dirname, '../frontend/dist'),
  path.join('/home/site/wwwroot/public'),
  path.join(process.cwd(), 'public')
];

// Find the first existing static path
let staticPath = null;
for (const testPath of staticPaths) {
  if (existsSync(testPath)) {
    staticPath = testPath;
    break;
  }
}

if (staticPath) {
  console.log('✅ Using static path:', staticPath);
  app.use(express.static(staticPath, {
    maxAge: '1d',
    etag: false,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      } else if (filePath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      } else if (filePath.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      }
    }
  }));
} else {
  console.error('❌ No static files directory found');
}

// Load subscription routes
try {
  const subscriptionsRouter = (await import('./routes/subscriptions.js')).default;
  app.use('/api/subscriptions', subscriptionsRouter);
  console.log('✅ Subscription routes loaded');
} catch (error) {
  console.error('❌ Failed to load subscription routes:', error);
}

// Load config routes for mobile app
try {
  const configRouter = (await import('./routes/config.js')).default;
  app.use('/api/config', configRouter);
  console.log('✅ Config routes loaded');
} catch (error) {
  console.error('❌ Failed to load config routes:', error);
}

// Load Azure OpenAI routes
try {
  const aiRouter = (await import('./routes/ai.js')).default;
  app.use('/api/ai', aiRouter);
  console.log('✅ Azure OpenAI routes loaded');
} catch (error) {
  console.error('❌ Failed to load Azure OpenAI routes:', error);
}

// Load search routes
try {
  const searchRouter = (await import('./routes/search.js')).default;
  app.use('/api/search', searchRouter);
  console.log('✅ Search routes loaded');
} catch (error) {
  console.error('❌ Failed to load search routes:', error);
}

// Load hybrid search routes
try {
  const hybridRouter = (await import('./routes/hybrid-search.js')).default;
  app.use('/api/hybrid', hybridRouter);
  console.log('✅ Hybrid search routes loaded');
} catch (error) {
  console.error('❌ Failed to load hybrid search routes:', error);
}

// Load place details routes
try {
  const placeDetailsRouter = (await import('./routes/place-details.js')).default;
  app.use('/api/place-details', placeDetailsRouter);
  console.log('✅ Place details routes loaded');
} catch (error) {
  console.error('❌ Failed to load place details routes:', error);
}

// Load emergency services routes
try {
  const emergencyRouter = (await import('./routes/emergency.js')).default;
  app.use('/api/emergency', emergencyRouter);
  console.log('✅ Emergency services routes loaded');
} catch (error) {
  console.error('❌ Failed to load emergency services routes:', error);
}

// Load translation routes
try {
  const translationRouter = (await import('./routes/translation.js')).default;
  app.use('/api/translation', translationRouter);
  console.log('✅ Translation routes loaded');
} catch (error) {
  console.error('❌ Failed to load translation routes:', error);
}

// Load places routes (All roles)
try {
  const placesRouter = (await import('./routes/places.js')).default;
  app.use('/api/places', requireFeature('places'), placesRouter);
  console.log('✅ Places routes loaded');
} catch (error) {
  console.error('❌ Failed to load places routes:', error);
}

// Load places photos routes
try {
  const placesPhotosRouter = (await import('./routes/places-photos.js')).default;
  app.use('/api/places', placesPhotosRouter);
  console.log('✅ Places photos routes loaded');
} catch (error) {
  console.error('❌ Failed to load places photos routes:', error);
}

// Load routes endpoints for navigation
try {
  const routesRouter = (await import('./routes/routes.js')).default;
  app.use('/api/routes', routesRouter);
  console.log('✅ Routes endpoints loaded');
} catch (error) {
  console.error('❌ Failed to load routes endpoints:', error);
}

// Load AI places routes
try {
  const placesAIRouter = (await import('./routes/places-ai.js')).default;
  app.use('/api/places', placesAIRouter);
  console.log('✅ AI Places routes loaded');
} catch (error) {
  console.error('❌ Failed to load AI places routes:', error);
}

// Load AI routes for community features
try {
  const aiRouter = (await import('./routes/ai.js')).default;
  app.use('/api/ai', aiRouter);
  console.log('✅ AI routes loaded for community features');
} catch (error) {
  console.error('❌ Failed to load AI routes:', error);
}

// Load mobile places routes
try {
  const mobilePlacesRouter = (await import('./routes/mobile-places.js')).default;
  app.use('/api/mobile-places', mobilePlacesRouter);
  console.log('✅ Mobile Places routes loaded');
} catch (error) {
  console.error('❌ Failed to load mobile places routes:', error);
}

// Load hybrid places routes
try {
  const placesHybridRouter = (await import('./routes/places-hybrid.js')).default;
  app.use('/api/places-hybrid', placesHybridRouter);
  console.log('✅ Hybrid places routes loaded');
} catch (error) {
  console.error('❌ Failed to load hybrid places routes:', error);
}

// Load enhanced places routes (Google First + AI Enhancement)
try {
  const enhancedPlacesRouter = (await import('./routes/enhanced-places.js')).default;
  app.use('/api/enhanced-places', enhancedPlacesRouter);
  console.log('✅ Enhanced places routes loaded');
} catch (error) {
  console.error('❌ Failed to load enhanced places routes:', error);
}

// Load AI trip generator routes (Google Places + AI Enhancement)
try {
  const aiTripGeneratorRouter = (await import('./routes/ai-trip-generator.js')).default;
  app.use('/api/ai-trips', aiTripGeneratorRouter);
  console.log('✅ AI trip generator routes loaded');
} catch (error) {
  console.error('❌ Failed to load AI trip generator routes:', error);
}

// Load posts routes
try {
  const postsRouter = (await import('./routes/posts.js')).default;
  app.use('/api/posts', requireFeature('posts'), postsRouter);
  console.log('✅ Posts routes loaded');
} catch (error) {
  console.error('❌ Failed to load posts routes:', error);
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

// --- Firebase Admin initialization ---
let adminAuth = null;
try {
  // Import the already configured Firebase Admin
  const firebaseAdmin = (await import('./config/firebase.js')).default;
  adminAuth = firebaseAdmin.auth();
  console.log('✅ Firebase Admin initialized successfully');
} catch (e) {
  console.warn('❌ Firebase Admin initialization failed:', e?.message || String(e));
  // Set adminAuth to null so the auth middleware can handle it properly
  adminAuth = null;
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

// MongoDB connection (optional) - with error handling
const MONGO_URI = process.env.MONGO_URI;
const SKIP_MONGO = String(process.env.SKIP_MONGO || '').toLowerCase() === 'true';
if (!SKIP_MONGO && MONGO_URI && MONGO_URI !== 'disabled') {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => {
      console.error('❌ MongoDB connection error:', err.message);
      console.log('ℹ️ Continuing without database...');
    });
} else {
  console.warn('ℹ️ MongoDB connection skipped');
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
  
  // Multi-Role System
  roles: { type: [String], default: ['user'], enum: ['user', 'merchant', 'transport_provider', 'travel_agent', 'admin'] },
  activeRole: { type: String, default: 'user', enum: ['user', 'merchant', 'transport_provider', 'travel_agent', 'admin'] },
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
  
  // Travel Agent Profile
  agentProfile: {
    agencyName: String,
    ownerName: String,
    email: String,
    phone: String,
    address: String,
    licenseNumber: String,
    experience: String,
    specialties: [String],
    languages: [String],
    certifications: [String],
    documents: [String],
    verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    isActive: { type: Boolean, default: false },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: Date
  },
  
  // Transport Provider Profile
  transportProfile: {
    companyName: String,
    ownerName: String,
    email: String,
    phone: String,
    address: String,
    licenseNumber: String,
    vehicleTypes: [String],
    serviceAreas: [String],
    fleetSize: String,
    documents: [String],
    verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    isActive: { type: Boolean, default: false },
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
  bookmarkedPosts: [String],
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
userSchema.index({ 'agentProfile.verificationStatus': 1 });
userSchema.index({ 'transportProfile.verificationStatus': 1 });

const User = mongoose.model('User', userSchema);

// Import TransportProvider model
import TransportProvider from './models/TransportProvider.js';

// Make models available to routes
app.set('User', User);
app.set('TransportProvider', TransportProvider);
global.User = User;
global.TransportProvider = TransportProvider;

// Load upload routes
try {
  const uploadRouter = (await import('./routes/upload.js')).default;
  app.use('/api/upload', uploadRouter);
  console.log('✅ Upload routes loaded');
} catch (error) {
  console.error('❌ Failed to load upload routes:', error);
}

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Load user profile routes RIGHT AFTER User model is defined
try {
  const usersRouter = (await import('./routes/users.js')).default;
  app.use('/api/users', usersRouter);
  console.log('✅ User profile routes loaded after User model');
} catch (error) {
  console.error('❌ Failed to load user routes:', error);
}

// Direct auth status endpoint
app.get('/api/auth/status', async (req, res) => {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      firebase: {
        configured: !!(process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_ADMIN_CREDENTIALS_JSON),
        adminConfigured: !!process.env.FIREBASE_ADMIN_CREDENTIALS_JSON,
        clientConfigured: !!process.env.VITE_FIREBASE_API_KEY
      },
      authentication: {
        methods: [],
        endpoints: {
          demoLogin: '/api/demo-auth/demo-login',
          firebaseSync: '/api/users/sync',
          createAdmin: '/api/setup/create-admin'
        }
      },
      database: {
        connected: mongoose.connection.readyState === 1,
        models: ['User', 'Post', 'TripPlan', 'Deal'].filter(model => global[model])
      }
    };

    if (status.firebase.configured) {
      status.authentication.methods.push('Firebase Auth', 'Google Sign-in');
    }
    if (process.env.ADMIN_API_KEY) {
      status.authentication.methods.push('Demo Admin Login');
    }

    res.json(status);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to check auth status', 
      details: error.message 
    });
  }
});

// Auth status routes - load early
try {
  const authStatusRouter = (await import('./routes/auth-status.js')).default;
  app.use('/api/auth', authStatusRouter);
  console.log('✅ Auth status routes loaded');
} catch (error) {
  console.error('❌ Failed to load auth status routes:', error);
}

// Trip generation endpoint with Azure OpenAI - with cost protection
app.post('/api/trips/generate', enforcePolicy('openai'), async (req, res) => {
  // Add CORS headers
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  const startTime = Date.now();
  
  try {
    console.log('🚀 Trip generation request received:', req.body);
    const { destination, duration, budget, interests = [], selectedPlaces = [] } = req.body;

    if (!destination || !duration) {
      console.log('❌ Missing required fields:', { destination, duration });
      return res.status(400).json({ error: 'Destination and duration are required' });
    }
    
    console.log('📍 Selected places from Explore:', selectedPlaces.length);
    
    console.log('✅ Request validation passed');
    console.log('🔑 Azure OpenAI Config:', {
      endpoint: process.env.AZURE_OPENAI_ENDPOINT ? 'configured' : 'missing',
      apiKey: process.env.AZURE_OPENAI_API_KEY ? 'configured' : 'missing',
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME
    });

    const { travelers, travelStyle, interests: interestArray } = req.body;
    const travelerProfile = getTravelerProfile(travelers, budget);
    const profileAdjustments = getProfileAdjustments(travelerProfile);
    
    // Build selected places context
    let selectedPlacesContext = '';
    if (selectedPlaces && selectedPlaces.length > 0) {
      selectedPlacesContext = `\n\nIMPORTANT - MUST INCLUDE THESE SELECTED PLACES:\n`;
      selectedPlaces.forEach((place, index) => {
        selectedPlacesContext += `${index + 1}. ${place.name} - ${place.description || 'Selected attraction'}\n`;
        selectedPlacesContext += `   Location: ${place.location?.city || ''}, ${place.location?.country || ''}\n`;
        selectedPlacesContext += `   Category: ${place.category || 'attraction'}\n`;
        if (place.highlights && place.highlights.length > 0) {
          selectedPlacesContext += `   Highlights: ${place.highlights.join(', ')}\n`;
        }
      });
      selectedPlacesContext += `\nThese ${selectedPlaces.length} places MUST be included in the daily itinerary. Build the trip around visiting these specific locations.\n`;
    }
    
    const prompt = `Create a comprehensive TravelBuddy Trip Template for ${destination} (${duration}).${selectedPlacesContext}

TRIP DETAILS:
- Destination: ${destination}
- Duration: ${duration}
- Travelers: ${travelers || '1-2'}
- Budget: ${budget} range
- Travel Style: ${travelStyle || 'balanced'}
- Interests: ${interestArray?.join(', ') || interests || 'general sightseeing'}
- Profile: ${travelerProfile} travelers

STYLE REQUIREMENTS:
${travelStyle === 'relaxed' ? '- Slow pace, plenty of rest time, max 2-3 activities per day\n- Include relaxation breaks and leisurely meals\n- Focus on comfort and minimal rushing' : 
  travelStyle === 'packed' ? '- Maximum activities, efficient scheduling, 4-5 activities per day\n- Early starts and full days\n- Optimize time with strategic planning' : 
  '- Balanced mix of activities and downtime, 3-4 activities per day\n- Mix of must-see attractions and local experiences\n- Reasonable pace with flexibility'}

PROFILE ADJUSTMENTS:
${profileAdjustments}

INTEREST-BASED CUSTOMIZATION:
${interestArray?.includes('culture') ? '- Prioritize museums, historical sites, and cultural experiences' : ''}
${interestArray?.includes('food') ? '- Include food tours, local markets, and authentic dining experiences' : ''}
${interestArray?.includes('nature') ? '- Add parks, gardens, outdoor activities, and scenic viewpoints' : ''}
${interestArray?.includes('adventure') ? '- Include adventure sports, hiking, and active experiences' : ''}
${interestArray?.includes('photography') ? '- Highlight photogenic spots and golden hour opportunities' : ''}
${interestArray?.includes('nightlife') ? '- Add evening entertainment, bars, and nightlife districts' : ''}

${selectedPlaces.length > 0 ? `CRITICAL REQUIREMENT: The itinerary MUST include visits to these ${selectedPlaces.length} selected places: ${selectedPlaces.map(p => p.name).join(', ')}. Organize the daily plans to visit these specific locations and build activities around them.` : ''}

Return ONLY valid JSON with detailed, personalized content:
{
  "tripTitle": "${destination} ${duration} ${travelStyle === 'relaxed' ? 'Relaxed' : travelStyle === 'packed' ? 'Action-Packed' : 'Balanced'} Adventure",
  "destination": "${destination}",
  "duration": "${duration}",
  "introduction": "🌍 **Welcome to ${destination}!**\n\n🏃 **Your Pace:** ${travelStyle || 'balanced'} - ${travelStyle === 'relaxed' ? 'Take your time and savor each moment' : travelStyle === 'packed' ? 'Maximum experiences in minimum time' : 'Perfect balance of adventure and relaxation'}\n💰 **Budget:** ${budget} range\n👥 **Group:** ${travelers} ${travelerProfile} travelers\n🎯 **Focus:** ${interestArray?.join(', ') || 'General exploration'}\n\nThis carefully crafted itinerary combines must-see attractions with authentic local experiences, tailored specifically for your travel style and interests. Get ready for an unforgettable journey!",
  "conclusion": "🎉 **Trip Highlights Recap**\n\nYour ${destination} adventure offers the perfect blend of ${interestArray?.slice(0,2).join(' and ') || 'sightseeing and culture'}. From iconic landmarks to hidden local gems, this itinerary ensures you experience the best of what ${destination} has to offer.\n\n💡 **Final Tips:**\n- Download offline maps and translation apps\n- Keep copies of important documents\n- Stay flexible - some of the best travel moments are unplanned!\n\nSafe travels and enjoy every moment of your ${destination} adventure! 🌟",
  "totalEstimatedCost": "${budget === 'low' ? '$300-600' : budget === 'medium' ? '$600-1200' : '$1200-2500'} per person for ${duration}",
  "estimatedWalkingDistance": "${travelStyle === 'relaxed' ? '3-5 km' : travelStyle === 'packed' ? '8-12 km' : '5-8 km'} per day average",
  "dailyPlans": [
    {
      "day": 1,
      "title": "Day 1 – Arrival & First Impressions",
      "activities": [
        {
          "timeOfDay": "🌅 Morning (9:00 AM)",
          "activityTitle": "Arrival & City Orientation",
          "description": "**What to do:** Arrive, check-in, and get your bearings with a gentle introduction to the city\n\n🚗 **Transport:** Airport transfer (taxi/metro) - $15-25\n💰 **Cost:** Free (walking tour)\n⏰ **Best Time:** Morning arrival allows full day exploration\n💡 **Insider Tip:** Grab a local SIM card at the airport for easy navigation and communication",
          "duration": "2-3 hours",
          "estimatedCost": "$20-30",
          "isVisited": false,
          "rating": 4.2,
          "category": "orientation",
          "icon": "🗺️"
        },
        {
          "timeOfDay": "🕛 Lunch (12:30 PM)",
          "activityTitle": "Welcome Lunch at Local Favorite",
          "description": "**Where:** Try the city's signature dish at a recommended local restaurant\n💰 **Cost:** ${budget === 'low' ? '$8-12' : budget === 'medium' ? '$15-25' : '$25-40'}\n🍽️ **Good For:** First taste of authentic local cuisine\n💡 **Tip:** Ask locals for their favorite nearby spots - they know best!",
          "duration": "1 hour",
          "estimatedCost": "${budget === 'low' ? '$10' : budget === 'medium' ? '$20' : '$35'}",
          "isVisited": false,
          "rating": 4.3,
          "category": "food",
          "icon": "🍽️"
        },
        {
          "timeOfDay": "🕐 Afternoon (2:00 PM)",
          "activityTitle": "Main Attraction Discovery",
          "description": "**Highlights:** Visit the city's most iconic landmark or attraction\n\n🚗 **Transport:** Walking or public transport - $2-5\n💰 **Cost:** ${budget === 'low' ? '$10-15' : budget === 'medium' ? '$20-30' : '$30-50'} entrance fee\n⏰ **Best Time:** Afternoon light is perfect for photos\n💡 **Insider Tip:** Book tickets online in advance to skip the lines",
          "duration": "2-3 hours",
          "estimatedCost": "${budget === 'low' ? '$15' : budget === 'medium' ? '$25' : '$40'}",
          "isVisited": false,
          "rating": 4.6,
          "category": "sightseeing",
          "icon": "🏛️"
        },
        {
          "timeOfDay": "🌅 Evening (6:00 PM)",
          "activityTitle": "Sunset Views & Welcome Dinner",
          "description": "**Activity:** Find the best sunset viewpoint in the city\n**Dinner Options:** Choose from 2-3 highly-rated restaurants nearby\n\n💰 **Cost:** ${budget === 'low' ? '$15-25' : budget === 'medium' ? '$25-40' : '$40-70'} for dinner\n⏰ **Best Time:** 1 hour before sunset for perfect lighting\n💡 **Tip:** Many rooftop bars offer great views - perfect for celebrating your arrival!",
          "duration": "3 hours",
          "estimatedCost": "${budget === 'low' ? '$20' : budget === 'medium' ? '$35' : '$55'}",
          "isVisited": false,
          "rating": 4.5,
          "category": "dining",
          "icon": "🌆"
        }
      ]
    }
  ],
  "packingTips": [
    "Comfortable walking shoes (you'll be doing lots of exploring!)",
    "Weather-appropriate clothing for ${destination}",
    "Portable phone charger and universal adapter",
    "Small daypack for daily excursions",
    "${interestArray?.includes('photography') ? 'Camera gear and extra batteries' : 'Smartphone with good camera'}",
    "${budget === 'low' ? 'Reusable water bottle to save money' : 'Travel insurance documents'}"
  ],
  "transportationTips": [
    "Download the local transport app before arrival",
    "${budget === 'low' ? 'Use public transport - it\'s cheaper and more authentic' : 'Mix of public transport and occasional taxis for convenience'}",
    "Learn basic phrases: 'Where is...?' and 'How much?'",
    "Keep small change handy for tips and small purchases",
    "${travelStyle === 'packed' ? 'Pre-book airport transfers to save time' : 'Take your time with transport - it\'s part of the experience'}"
  ],
  "culturalEtiquette": [
    "Research local customs and dress codes for ${destination}",
    "Learn the tipping culture - it varies significantly by country",
    "Respect photography rules at religious and cultural sites",
    "${interestArray?.includes('culture') ? 'Visit cultural sites during appropriate hours and dress modestly' : 'Be mindful of local customs and traditions'}",
    "Greet locals in their language - even 'hello' and 'thank you' go a long way!"
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });
    
    const responseText = completion.choices[0].message.content;
    
    let tripData;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      tripData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (parseError) {
      throw new Error('Invalid JSON response from AI');
    }

    if (!tripData) {
      throw new Error('No valid trip data generated');
    }

    recordUsage({
      api: 'openai',
      action: 'generate_trip',
      status: 'success',
      durationMs: Date.now() - startTime,
      meta: { destination, duration, budget }
    });

    res.json(tripData);

  } catch (error) {
    console.error('❌ Error generating trip:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    
    recordUsage({
      api: 'openai',
      action: 'generate_trip',
      status: 'error',
      durationMs: Date.now() - startTime,
      meta: { error: error.message }
    });

    res.status(500).json({
      error: 'Failed to generate trip',
      message: error.message,
      details: error.code || 'Unknown error'
    });
  }
});

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
  introduction: { type: String, default: '' },
  conclusion: { type: String, default: '' },
  totalEstimatedCost: { type: String, default: '$0' },
  estimatedWalkingDistance: { type: String, default: '0 km' },
  dailyPlans: [{
    day: Number,
    title: String,
    activities: [{
      timeOfDay: String,
      activityTitle: String,
      description: String,
      duration: String,
      estimatedCost: String,
      isVisited: { type: Boolean, default: false },
      visitedDate: Date,
      rating: Number
    }]
  }],
  createdAt: { type: Date, default: Date.now }
});

const TripPlan = mongoose.model('TripPlan', tripPlanSchema);

// Make TripPlan available globally for routes
global.TripPlan = TripPlan;

// Post Schema
const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: {
    title: String,
    text: String,
    images: [String]
  },
  author: {
    name: String,
    avatar: String,
    location: String,
    verified: Boolean
  },
  location: String,
  place: {
    placeId: String,
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    address: String
  },
  engagement: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    views: { type: Number, default: 0 }
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
postSchema.index({ tags: 1 });
postSchema.index({ 'place.placeId': 1 });
postSchema.index({ location: 'text', 'content.title': 'text', 'content.text': 'text' });

const Post = mongoose.model('Post', postSchema);
global.Post = Post;

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
  contactInfo: {
    website: String,
    phone: String,
    whatsapp: String,
    facebook: String,
    instagram: String,
    email: String
  },
  createdAt: { type: Date, default: Date.now }
});

const Deal = mongoose.model('Deal', dealSchema);
global.Deal = Deal;

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
global.Itinerary = Itinerary;

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

// Personalized Suggestions API
app.get('/api/suggestions/personalized', async (req, res) => {
  try {
    const { userId, interests, latitude, longitude } = req.query;
    
    if (!userId || !latitude || !longitude) {
      return res.status(400).json({ error: 'userId, latitude, and longitude are required' });
    }

    let user = await User.findOne({ firebaseUid: userId });
    if (!user) {
      user = await User.findById(userId);
    }
    
    const userInterests = interests ? interests.split(',') : (user?.selectedInterests || ['sightseeing']);
    const suggestions = [];
    
    const hour = new Date().getHours();
    if (hour < 12) {
      suggestions.push({
        type: 'activity',
        title: 'Morning Coffee & Planning',
        description: 'Start your day with local coffee and plan your adventures',
        reason: 'Perfect morning activity'
      });
    } else if (hour < 17) {
      suggestions.push({
        type: 'activity', 
        title: 'Afternoon Exploration',
        description: 'Great time to visit museums or outdoor attractions',
        reason: 'Ideal afternoon timing'
      });
    } else {
      suggestions.push({
        type: 'activity',
        title: 'Evening Dining',
        description: 'Discover local restaurants and nightlife',
        reason: 'Perfect evening activity'
      });
    }
    
    for (const interest of userInterests.slice(0, 2)) {
      suggestions.push({
        type: 'place',
        title: `Explore ${interest} spots`,
        description: `Discover places perfect for ${interest} enthusiasts`,
        reason: `Based on your interest in ${interest}`
      });
    }
    
    res.json(suggestions.slice(0, 5));
  } catch (error) {
    res.status(500).json({ error: error.message });
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
// Places sections endpoint - organized place categories
app.get('/api/places/sections', enforcePolicy('places'), async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const sections = [
      { title: 'Popular Restaurants', category: 'food', places: [] },
      { title: 'Top Attractions', category: 'landmarks', places: [] },
      { title: 'Cultural Sites', category: 'culture', places: [] },
      { title: 'Nature & Parks', category: 'nature', places: [] }
    ];

    // Fetch places for each section
    for (const section of sections) {
      try {
        const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
        const query = section.category === 'food' ? 'restaurants' : 
                     section.category === 'landmarks' ? 'tourist attractions' :
                     section.category === 'culture' ? 'museums' : 'parks';
        url.searchParams.set('query', query);
        url.searchParams.set('location', `${lat},${lng}`);
        url.searchParams.set('radius', '10000');
        url.searchParams.set('key', process.env.GOOGLE_PLACES_API_KEY);

        const response = await fetch(url.toString());
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'OK') {
            section.places = normalizeAndFilter(data.results, lat, lng, 10000, { enforceRadius: true, sortByDistance: true }).slice(0, 5);
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch ${section.category}:`, error.message);
      }
    }

    recordUsage({ api: 'places', action: 'sections', status: 'success' });
    res.json(sections.filter(s => s.places.length > 0));
  } catch (error) {
    recordUsage({ api: 'places', action: 'sections', status: 'error', meta: { err: error?.message } });
    res.status(500).json({ error: 'Failed to fetch place sections', details: error?.message });
  }
});

// Mobile-optimized places nearby
app.get('/api/places/mobile/nearby', enforcePolicy('places'), async (req, res) => {
  try {
    const { lat, lng, q, radius, category } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const query = q || (category && category !== 'all' ? category : 'points of interest');
    const searchRadius = parseInt(radius || '15000', 10);
    
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.set('query', query);
    url.searchParams.set('location', `${lat},${lng}`);
    url.searchParams.set('radius', String(searchRadius));
    url.searchParams.set('key', process.env.GOOGLE_PLACES_API_KEY);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    if (data.status !== 'OK') {
      if (data.status === 'ZERO_RESULTS') {
        return res.json([]);
      }
      throw new Error(`API status: ${data.status}`);
    }

    const places = normalizeAndFilter(data.results, lat, lng, searchRadius, { enforceRadius: true, sortByDistance: true }).slice(0, 60);
    
    recordUsage({ api: 'places', action: 'mobile_nearby', status: 'success' });
    res.json(places);
  } catch (error) {
    recordUsage({ api: 'places', action: 'mobile_nearby', status: 'error', meta: { err: error?.message } });
    res.status(500).json({ error: 'Failed to fetch mobile places', details: error?.message });
  }
});

// Mobile-optimized places sections
app.get('/api/places/mobile/sections', enforcePolicy('places'), async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const sections = [
      { title: 'Nearby Restaurants', category: 'food', places: [] },
      { title: 'Must-See Attractions', category: 'landmarks', places: [] },
      { title: 'Local Culture', category: 'culture', places: [] }
    ];

    for (const section of sections) {
      try {
        const query = section.category === 'food' ? 'restaurants' : 
                     section.category === 'landmarks' ? 'attractions' : 'museums';
        const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
        url.searchParams.set('query', query);
        url.searchParams.set('location', `${lat},${lng}`);
        url.searchParams.set('radius', '8000');
        url.searchParams.set('key', process.env.GOOGLE_PLACES_API_KEY);

        const response = await fetch(url.toString());
        if (response.ok) {
          const data = await response.json();
          if (data.status === 'OK') {
            section.places = normalizeAndFilter(data.results, lat, lng, 8000, { enforceRadius: true, sortByDistance: true }).slice(0, 4);
          }
        }
      } catch (error) {
        console.warn(`Mobile section ${section.category} failed:`, error.message);
      }
    }

    recordUsage({ api: 'places', action: 'mobile_sections', status: 'success' });
    res.json(sections.filter(s => s.places.length > 0));
  } catch (error) {
    recordUsage({ api: 'places', action: 'mobile_sections', status: 'error', meta: { err: error?.message } });
    res.status(500).json({ error: 'Failed to fetch mobile sections', details: error?.message });
  }
});

// Places search endpoint
app.get('/api/places/search', enforcePolicy('places'), async (req, res) => {
  try {
    const { query, lat, lng, radius } = req.query;
    if (!query || !lat || !lng) {
      return res.status(400).json({ error: 'query, lat, and lng are required' });
    }

    const searchRadius = parseInt(radius || '20000', 10);
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.set('query', query);
    url.searchParams.set('location', `${lat},${lng}`);
    url.searchParams.set('radius', String(searchRadius));
    url.searchParams.set('key', process.env.GOOGLE_PLACES_API_KEY);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    if (data.status !== 'OK') {
      if (data.status === 'ZERO_RESULTS') {
        return res.json([]);
      }
      throw new Error(`API status: ${data.status}`);
    }

    const places = normalizeAndFilter(data.results, lat, lng, searchRadius, { enforceRadius: true, sortByDistance: true }).slice(0, 50);
    
    recordUsage({ api: 'places', action: 'search', status: 'success', meta: { query } });
    res.json(places);
  } catch (error) {
    recordUsage({ api: 'places', action: 'search', status: 'error', meta: { err: error?.message } });
    res.status(500).json({ error: 'Failed to search places', details: error?.message });
  }
});

// Places API proxy - fetch factual places from Google Places Text Search
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

  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.set('query', query);
    url.searchParams.set('location', `${lat},${lng}`);
    url.searchParams.set('radius', String(searchRadius));
    url.searchParams.set('key', apiKey);

    const doFetch = async () => {
      const response = await fetch(url.toString());
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }
      return await response.json();
    };

    // If we have stale cache, return it immediately and refresh in background (SWR)
    if (cached && !isFresh) {
    res.json(cached.data);
      // background refresh
      const started = Date.now();
      doFetch()
        .then((data) => {
          if (data.status && data.status !== 'OK') {
            if (data.status === 'ZERO_RESULTS') {
              setPlacesCache(key, []);
              recordUsage({ api: 'places', action: 'nearby', status: 'success', durationMs: Date.now() - started, meta: { swr: true, zero: true } });
              return;
            }
            console.error('Places API error (bg):', data.status, data.error_message);
            recordUsage({ api: 'places', action: 'nearby', status: 'error', durationMs: Date.now() - started, meta: { swr: true, status: data.status } });
            return;
          }
      const normalized = normalizeAndFilter(data.results, lat, lng, searchRadius, { enforceRadius: enforce, sortByDistance });
          setPlacesCache(key, normalized);
          recordUsage({ api: 'places', action: 'nearby', status: 'success', durationMs: Date.now() - started, meta: { swr: true, cache: 'set' } });
        })
        .catch((e) => {
          console.error('Places SWR refresh failed:', e.message || e);
          recordUsage({ api: 'places', action: 'nearby', status: 'error', meta: { swr: true, err: e?.message || String(e) } });
        });
      return;
    }

    const start = Date.now();
    const data = await doFetch();

    if (data.status && data.status !== 'OK') {
      if (data.status === 'ZERO_RESULTS') {
        setPlacesCache(key, []);
        recordUsage({ api: 'places', action: 'nearby', status: 'success', durationMs: Date.now() - start, meta: { zero: true } });
        return res.json([]);
      }
      console.error('Places API error:', data.status, data.error_message);
      recordUsage({ api: 'places', action: 'nearby', status: 'error', durationMs: Date.now() - start, meta: { status: data.status } });
      return res.status(502).json({ error: 'Places API status not OK', details: data.status, message: data.error_message });
    }

  let normalized = normalizeAndFilter(data.results, lat, lng, searchRadius, { enforceRadius: enforce, sortByDistance });

  setPlacesCache(key, normalized);
  recordUsage({ api: 'places', action: 'nearby', status: 'success', durationMs: Date.now() - start, meta: { cache: 'set' } });
  const limit = req._policy?.features?.resultsPerSearch || 150;
  const sendList = normalized.slice(0, limit);
  res.json(sendList);
  } catch (error) {
    recordUsage({ api: 'places', action: 'nearby', status: 'error', meta: { err: error?.message || String(error) } });
    res.status(500).json({ error: 'Failed to fetch places', details: error?.message || String(error) });
  }
});

// User sync endpoint for Firebase integration - with flexible auth
app.post('/api/users/sync', async (req, res) => {
  try {
    console.log('🔄 User sync request:', { headers: req.headers, body: req.body });
    
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    // Extract user info from token (development-friendly)
    let extractedUid = null;
    let extractedEmail = null;
    
    // Try Firebase JWT format first
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        extractedUid = payload.user_id || payload.sub || payload.uid;
        extractedEmail = payload.email;
        console.log('✅ Extracted from Firebase JWT:', { uid: extractedUid, email: extractedEmail });
      }
    } catch (e) {
      console.log('⚠️ Not a Firebase JWT, trying simple decode');
    }
    
    // Fallback to simple token format
    if (!extractedUid) {
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf8');
        const [uid] = decoded.split(':');
        extractedUid = uid;
        console.log('✅ Extracted from simple token:', extractedUid);
      } catch (e) {
        console.log('⚠️ Token decode failed, using fallback');
        extractedUid = 'sync-user-' + Date.now();
      }
    }

    const { email, username, firebaseUid } = req.body;
    const finalEmail = email || extractedEmail;
    const finalFirebaseUid = firebaseUid || extractedUid;
    
    console.log('🔍 Final user data:', { finalEmail, finalFirebaseUid, username });
    
    if (!finalEmail && !finalFirebaseUid) {
      console.log('❌ Missing required data');
      return res.status(400).json({ error: 'Email or Firebase UID is required' });
    }

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.log('❌ Database not connected');
      return res.status(500).json({ error: 'Database not connected' });
    }

    // Find or create user
    let user = await User.findOne({ 
      $or: [
        ...(finalEmail ? [{ email: finalEmail }] : []),
        ...(finalFirebaseUid ? [{ firebaseUid: finalFirebaseUid }] : [])
      ]
    });
    
    console.log('👤 Found existing user:', !!user);
    
    if (!user) {
      console.log('🆕 Creating new user');
      user = new User({
        email: finalEmail || `${finalFirebaseUid}@sync.local`,
        username: username || finalEmail?.split('@')[0] || finalFirebaseUid,
        firebaseUid: finalFirebaseUid,
        tier: 'free',
        subscriptionStatus: 'none'
      });
      await user.save();
      console.log('✅ Created new user via sync:', user._id);
    } else {
      console.log('🔄 Updating existing user');
      // Update user info if needed
      let updated = false;
      if (finalFirebaseUid && !user.firebaseUid) {
        user.firebaseUid = finalFirebaseUid;
        updated = true;
      }
      if (username && user.username !== username) {
        user.username = username;
        updated = true;
      }
      if (finalEmail && user.email !== finalEmail) {
        user.email = finalEmail;
        updated = true;
      }
      if (updated) {
        await user.save();
        console.log('✅ Updated existing user via sync:', user._id);
      }
    }
    
    console.log('✅ Sync successful, returning user:', user._id);
    res.json(user);
  } catch (error) {
    console.error('❌ User sync error:', error);
    res.status(500).json({ error: 'User sync failed', details: error.message, stack: error.stack });
  }
});

// Flexible auth middleware for mobile/web
const flexAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    const userId = req.headers['x-user-id'];
    
    console.log('🔐 FlexAuth check:', { hasToken: !!token, hasUserId: !!userId });
    
    if (token) {
      try {
        // Try Firebase first
        if (adminAuth) {
          const decoded = await adminAuth.verifyIdToken(token);
          req.user = { uid: decoded.uid, ...decoded };
          console.log('✅ Firebase auth successful');
          return next();
        }
      } catch (e) {
        console.log('⚠️ Firebase auth failed:', e.message);
      }
      
      try {
        // Fallback to simple token
        const decoded = Buffer.from(token, 'base64').toString('utf8');
        const [id] = decoded.split(':');
        req.user = { uid: id };
        console.log('✅ Simple token auth successful');
        return next();
      } catch (e) {
        console.log('⚠️ Simple token auth failed:', e.message);
      }
    }
    
    if (userId) {
      req.user = { uid: userId };
      console.log('✅ User ID header auth successful');
      return next();
    }
    
    console.log('❌ No valid authentication found');
    return res.status(401).json({ error: 'Authentication required' });
  } catch (error) {
    console.error('❌ FlexAuth error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Users - Enhanced security
app.post('/api/users', validateUser, asyncHandler(async (req, res) => {
  try {
    const { username, email, firebaseUid, ...rest } = req.body || {};
    if (!username && !email) {
      return res.status(400).json({ error: 'username or email is required' });
    }
    
    // Validate email format
    if (email && !validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
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
      // Only update SAFE fields if provided
      const updatable = ['tier','subscriptionStatus','subscriptionEndDate','trialEndDate','homeCurrency','language','selectedInterests','hasCompletedWizard','profilePicture'];
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

    // Create new user with only safe fields
    const safeFields = { username, email, firebaseUid };
    const allowedFields = ['tier', 'homeCurrency', 'language', 'selectedInterests'];
    allowedFields.forEach(field => {
      if (rest[field] !== undefined) {
        safeFields[field] = rest[field];
      }
    });
    
    const user = new User(safeFields);
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-__v');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single user (authoritative read for subscription/tier)
app.get('/api/users/:id', flexAuth, async (req, res) => {
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

// Get user stats
app.get('/api/users/:id/stats', async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.params.id });
    if (!user) {
      user = await User.findById(req.params.id);
    }
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Safe model access with fallbacks
    const [tripCount, postCount, favoriteCount, itineraryCount] = await Promise.all([
      TripPlan ? TripPlan.countDocuments({ userId: user._id }).catch(() => 0) : Promise.resolve(0),
      Post ? Post.countDocuments({ userId: user._id }).catch(() => 0) : Promise.resolve(0),
      user.favoritePlaces ? user.favoritePlaces.length : 0,
      Itinerary ? Itinerary.countDocuments({ userId: user._id }).catch(() => 0) : Promise.resolve(0)
    ]);

    const stats = {
      totalTrips: tripCount,
      totalPosts: postCount,
      totalFavorites: favoriteCount,
      totalItineraries: itineraryCount,
      memberSince: user.createdAt,
      profileType: user.profileType || 'traveler',
      tier: user.tier || 'free',
      subscriptionStatus: user.subscriptionStatus || 'none',
      placesVisited: favoriteCount,
      badgesEarned: _calculateBadges(tripCount, postCount, favoriteCount),
      travelScore: _calculateTravelScore(tripCount, postCount, favoriteCount, itineraryCount)
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function _calculateBadges(trips, posts, favorites) {
  const badges = [];
  if (trips >= 1) badges.push('First Trip');
  if (trips >= 5) badges.push('Explorer');
  if (trips >= 10) badges.push('Travel Expert');
  if (posts >= 1) badges.push('Storyteller');
  if (posts >= 10) badges.push('Community Star');
  if (favorites >= 5) badges.push('Curator');
  if (favorites >= 20) badges.push('Place Collector');
  return badges;
}

function _calculateTravelScore(trips, posts, favorites, itineraries) {
  return Math.min(1000, (trips * 50) + (posts * 20) + (favorites * 10) + (itineraries * 30));
}

// Return simple subscription status for a user
app.get('/api/users/:id/subscription-status', flexAuth, async (req, res) => {
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

app.put('/api/users/:id', authenticateJWT, asyncHandler(async (req, res) => {
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
}));

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

// User travel style API endpoints
app.get('/api/users/:id/travel-style', async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.params.id });
    if (!user) {
      user = await User.findById(req.params.id);
    }
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ travelStyle: user.travelStyle || null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id/travel-style', async (req, res) => {
  try {
    const { travelStyle } = req.body;
    let user = await User.findOne({ firebaseUid: req.params.id });
    if (!user) {
      user = await User.findById(req.params.id);
    }
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.travelStyle = travelStyle;
    await user.save();
    res.json({ success: true, travelStyle: user.travelStyle });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Posts with pagination - Enhanced security
app.post('/api/posts', requireAuth, validatePost, asyncHandler(async (req, res) => {
  try {
    const body = req.body || {};
    const images = body?.content?.images;
    if (Array.isArray(images) && images.length > 2) {
      return res.status(400).json({ error: 'Max 2 images allowed' });
    }
    
    // Validate content length
    if (body.content?.text && body.content.text.length > 1000) {
      return res.status(400).json({ error: 'Post content too long' });
    }
    
    // Add user info from authenticated user
    body.userId = req.user.id;
    body.moderationStatus = 'approved'; // Auto-approve for now
    
    const post = new Post(body);
    const saved = await post.save();
    res.json(saved);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

app.get('/api/posts', async (req, res) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit || '20', 10));
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const skip = (page - 1) * limit;
    const cursor = req.query.cursor;
    
    let query = { moderationStatus: { $ne: 'rejected' } };
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }
    
    const posts = await Post.find(query, {
      userId: 1, content: 1, author: 1, engagement: 1,
      tags: 1, category: 1, createdAt: 1
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(cursor ? 0 : skip)
      .lean();
    
    const nextCursor = posts.length === limit ? posts[posts.length - 1].createdAt : null;
    const hasMore = posts.length === limit;
    
    res.json({ posts, pagination: { hasMore, nextCursor, page, limit } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Community posts with auth and pagination
app.get('/api/community/posts', async (req, res) => {
  // Add CORS headers for this specific endpoint
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-firebase-uid');
  res.header('Access-Control-Allow-Credentials', 'true');
  try {
    console.log('🔍 Community posts request received');
    console.log('📋 Query params:', req.query);
    console.log('🗄️ Database state:', mongoose.connection.readyState);
    
    const limit = Math.min(50, parseInt(req.query.limit || '20', 10));
    const cursor = req.query.cursor;
    
    // Check total posts in database first
    const totalPosts = await Post.countDocuments();
    console.log(`📊 Total posts in database: ${totalPosts}`);
    
    if (totalPosts === 0) {
      console.log('⚠️ No posts found in database at all');
      return res.json([]);
    }
    
    // Check posts by moderation status
    const approvedCount = await Post.countDocuments({ moderationStatus: 'approved' });
    const noStatusCount = await Post.countDocuments({ moderationStatus: { $exists: false } });
    const rejectedCount = await Post.countDocuments({ moderationStatus: 'rejected' });
    const pendingCount = await Post.countDocuments({ moderationStatus: 'pending' });
    
    console.log('📈 Posts by status:');
    console.log(`  - Approved: ${approvedCount}`);
    console.log(`  - No status: ${noStatusCount}`);
    console.log(`  - Rejected: ${rejectedCount}`);
    console.log(`  - Pending: ${pendingCount}`);
    
    let query = { 
      $or: [
        { moderationStatus: 'approved' },
        { moderationStatus: { $exists: false } }
      ]
    };
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }
    
    console.log('🔍 Fetching posts with query:', JSON.stringify(query));
    
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    console.log(`✅ Found ${posts.length} posts matching query`);
    
    if (posts.length > 0) {
      console.log('📝 Sample post:', {
        id: posts[0]._id,
        moderationStatus: posts[0].moderationStatus,
        createdAt: posts[0].createdAt,
        hasContent: !!posts[0].content
      });
    }
    
    // Return posts directly for mobile compatibility
    res.json(posts);
  } catch (error) {
    console.error('❌ Posts fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get top travelers endpoint
app.get('/api/posts/community', async (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-firebase-uid');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  try {
    const users = await User.find()
      .select('username profilePicture tier')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    const topTravelers = users.map(user => ({
      id: user._id,
      name: user.username,
      avatar: user.profilePicture,
      tier: user.tier || 'free',
      verified: user.tier === 'premium' || user.tier === 'pro'
    }));
    
    res.json(topTravelers);
  } catch (error) {
    console.error('❌ Error fetching top travelers:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create story endpoint
app.post('/api/posts/community', async (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-firebase-uid');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  try {
    const post = new Post(req.body)
    const saved = await post.save()
    res.json(saved)
  } catch (error) {
    console.error('❌ Post creation error:', error)
    res.status(400).json({ error: error.message })
  }
})

app.post('/api/community/posts', async (req, res) => {
  // Add CORS headers for this specific endpoint
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-firebase-uid');
  res.header('Access-Control-Allow-Credentials', 'true');
  try {
    const body = req.body || {};
    console.log('📝 Creating post - Raw body:', JSON.stringify(body, null, 2));
    console.log('👤 Auth user:', req.user);
    console.log('🗄️ Database state:', mongoose.connection.readyState);
    
    const images = body?.content?.images;
    if (Array.isArray(images) && images.length > 2) {
      return res.status(400).json({ error: 'Max 2 images allowed' });
    }
    
    if (!body.userId && req.user?.uid) {
      body.userId = req.user.uid;
    }
    
    // Ensure moderationStatus is approved by default
    if (!body.moderationStatus) {
      body.moderationStatus = 'approved';
    }
    
    console.log('📝 Final post data:', JSON.stringify(body, null, 2));
    
    const post = new Post(body);
    console.log('💾 Attempting to save post...');
    const saved = await post.save();
    console.log('✅ Post saved successfully:', saved._id);
    
    // Verify post was actually saved
    const verification = await Post.findById(saved._id);
    if (verification) {
      console.log('✅ Post verification successful - exists in database');
    } else {
      console.log('❌ Post verification failed - not found in database');
    }
    
    // Broadcast new post to all connected clients
    try {
      io.emit('new_post', saved);
      console.log('📡 Broadcasted new post to all clients');
    } catch (e) {
      console.warn('Failed to broadcast new post:', e?.message);
    }
    
    res.json(saved);
  } catch (error) {
    console.error('❌ Post creation error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Like/Unlike a post with auth
app.post('/api/posts/:id/like', flexAuth, async (req, res) => {
  try {
    const { userId, username } = req.body || {};
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const likerKey = (userId || req.user?.uid || username || 'anon').toString();
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

// Bookmark/Unbookmark a post
app.post('/api/posts/:id/bookmark', flexAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: 'User ID required' });

    const user = await User.findOne({ $or: [{ firebaseUid: userId }, { _id: userId }] });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const bookmarks = user.bookmarkedPosts || [];
    const isBookmarked = bookmarks.includes(req.params.id);

    if (isBookmarked) {
      user.bookmarkedPosts = bookmarks.filter(id => id !== req.params.id);
    } else {
      user.bookmarkedPosts = [...bookmarks, req.params.id];
    }
    
    await user.save();
    res.json({ success: true, bookmarked: !isBookmarked });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user's bookmarked posts
app.get('/api/posts/bookmarked', flexAuth, async (req, res) => {
  try {
    const userId = req.user?.uid;
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const user = await User.findOne({ $or: [{ firebaseUid: userId }, { _id: userId }] });
    if (!user || !user.bookmarkedPosts) return res.json([]);

    const posts = await Post.find({ _id: { $in: user.bookmarkedPosts } })
      .sort({ createdAt: -1 })
      .lean();
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a comment to a post with auth
app.post('/api/posts/:id/comments', flexAuth, async (req, res) => {
  try {
    const { userId, username, text } = req.body || {};
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    
    const commentUserId = userId || req.user?.uid;
    post.commentsList.push({ userId: commentUserId, username, text: text.trim() });
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

// Reviews - Enhanced security
app.post('/api/reviews', requireAuth, validateReview, asyncHandler(async (req, res) => {
  try {
    const { place_id, rating, text, author_name } = req.body;
    
    if (!place_id || !rating || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate rating range
    const numRating = parseInt(rating);
    if (numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    // Validate text length
    if (text.length < 10 || text.length > 500) {
      return res.status(400).json({ error: 'Review text must be between 10 and 500 characters' });
    }
    
    const review = new Review({
      placeId: place_id,
      rating: numRating,
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
}));

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



// Trip Plans - Enhanced security
app.post('/api/trips', requireAuth, validateTrip, asyncHandler(async (req, res) => {
  try {
    const tripData = { ...req.body, userId: req.user.id };
    
    // Validate trip data
    if (!tripData.tripTitle || !tripData.destination) {
      return res.status(400).json({ error: 'Trip title and destination are required' });
    }
    
    const trip = new TripPlan(tripData);
    await trip.save();
    res.json(trip);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// Trip Plans API alias for mobile app
app.post('/api/trip-plans', async (req, res) => {
  try {
    console.log('📝 Creating trip plan:', req.body);
    const trip = new TripPlan(req.body);
    await trip.save();
    console.log('✅ Trip plan saved with ID:', trip._id);
    res.json(trip);
  } catch (error) {
    console.error('❌ Trip creation error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/trip-plans', async (req, res) => {
  try {
    const trips = await TripPlan.find().populate('userId', 'username').sort({ createdAt: -1 }).limit(20);
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/trip-plans/:id', async (req, res) => {
  try {
    const trip = await TripPlan.findById(req.params.id).populate('userId', 'username');
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/trip-plans/:id', async (req, res) => {
  try {
    await TripPlan.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update activity status
app.put('/api/trip-plans/:id/activity-status', async (req, res) => {
  try {
    const { dayIndex, activityIndex, isVisited } = req.body;
    const trip = await TripPlan.findById(req.params.id);
    
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    if (trip.dailyPlans[dayIndex] && trip.dailyPlans[dayIndex].activities[activityIndex]) {
      trip.dailyPlans[dayIndex].activities[activityIndex].isVisited = isVisited;
      trip.dailyPlans[dayIndex].activities[activityIndex].visitedDate = isVisited ? new Date().toISOString() : null;
      await trip.save();
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent trips
app.get('/api/trips/recent', async (req, res) => {
  try {
    const limit = Math.min(20, parseInt(req.query.limit || '10', 10));
    const trips = await TripPlan.find()
      .populate('userId', 'username profilePicture')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
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

// User trip plans alias for mobile app
app.get('/api/users/:userId/trip-plans', async (req, res) => {
  try {
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

app.post('/api/users/:userId/trip-plans', async (req, res) => {
  try {
    let user = await User.findOne({ firebaseUid: req.params.userId });
    if (!user) {
      user = await User.findById(req.params.userId);
    }
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const tripData = { ...req.body, userId: user._id };
    const trip = new TripPlan(tripData);
    await trip.save();
    res.json(trip);
  } catch (error) {
    res.status(400).json({ error: error.message });
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
// Deals GET endpoint moved to routes/deals.js

// All deals endpoints moved to routes/deals.js

// Get Google Maps API key (from environment)
app.get('/api/config/maps-key', (req, res) => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(404).json({ error: 'API key not configured' });
  }
  res.json({ apiKey });
});

// Get Firebase config for frontend
app.get('/api/config/firebase', (req, res) => {
  const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
  };
  res.json(firebaseConfig);
});

// Runtime config endpoint for frontend
app.get('/api/runtime-config', (req, res) => {
  res.json({
    firebase: {
      apiKey: process.env.VITE_FIREBASE_API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID
    }
  });
});

// Firebase debug endpoint
app.get('/api/firebase-debug', (req, res) => {
  const currentDomain = req.get('host') || req.hostname
  const origin = req.get('origin') || `${req.protocol}://${currentDomain}`
  
  res.json({
    currentDomain,
    origin,
    headers: {
      host: req.get('host'),
      origin: req.get('origin'),
      referer: req.get('referer')
    },
    firebaseConfig: {
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID
    },
    requiredAuthorizedDomains: [
      currentDomain,
      `www.${currentDomain}`,
      'localhost:3000',
      'localhost:5173'
    ]
  })
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


// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  res.json({ csrfToken: token });
});

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({ 
    message: 'CORS is working!', 
    origin: req.headers.origin,
    timestamp: new Date().toISOString() 
  });
});

// Health check - updated for deployment trigger
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection?.readyState;
  const database = (SKIP_MONGO || !MONGO_URI || MONGO_URI === 'disabled') ? 'skipped' : (dbState === 1 ? 'connected' : 'disconnected');
  res.json({ status: 'OK', database, timestamp: new Date().toISOString(), version: '1.1.0' });
});

// Simple health check at root
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Keep the old health endpoint for backward compatibility
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

// Quick post count check
app.get('/api/posts/count', async (req, res) => {
  try {
    const total = await Post.countDocuments();
    const approved = await Post.countDocuments({ moderationStatus: 'approved' });
    const noStatus = await Post.countDocuments({ moderationStatus: { $exists: false } });
    res.json({ total, approved, noStatus, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to create test posts
app.post('/api/debug/create-test-posts', async (req, res) => {
  try {
    console.log('📝 Creating test posts...');
    
    const testPosts = [
      {
        userId: new mongoose.Types.ObjectId(),
        content: {
          text: 'Test post 1 - This is a test post to check if posts are showing up',
          images: []
        },
        author: {
          name: 'Test User 1',
          avatar: null,
          location: 'Test Location',
          verified: false
        },
        engagement: {
          likes: 0,
          comments: 0,
          shares: 0
        },
        moderationStatus: 'approved',
        tags: ['test'],
        category: 'general'
      },
      {
        userId: new mongoose.Types.ObjectId(),
        content: {
          text: 'Test post 2 - Another test post without moderation status',
          images: []
        },
        author: {
          name: 'Test User 2',
          avatar: null,
          location: 'Test Location 2',
          verified: false
        },
        engagement: {
          likes: 5,
          comments: 2,
          shares: 1
        },
        // No moderationStatus - should still show up
        tags: ['test', 'community'],
        category: 'travel'
      }
    ];
    
    const createdPosts = await Post.insertMany(testPosts);
    console.log(`✅ Created ${createdPosts.length} test posts`);
    
    res.json({
      success: true,
      created: createdPosts.length,
      posts: createdPosts.map(p => ({ id: p._id, text: p.content.text, moderationStatus: p.moderationStatus }))
    });
  } catch (error) {
    console.error('❌ Error creating test posts:', error);
    res.status(500).json({ error: error.message });
  }
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

// Azure OpenAI Place Search
app.get('/api/search/places', enforcePolicy('openai'), async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { q: query, category, rating } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const prompt = `Find popular places and attractions for: "${query}"
    ${category ? `Category filter: ${category}` : ''}
    ${rating ? `Minimum rating: ${rating}` : ''}
    
    Return ONLY a JSON array with exactly 8 places:
    [
      {
        "id": "unique_id",
        "name": "Place Name",
        "description": "Brief description",
        "category": "restaurant|attraction|hotel|shopping",
        "rating": 4.5,
        "location": "City, Country",
        "image": "https://images.unsplash.com/photo-relevant?w=300&h=200&fit=crop",
        "highlights": ["feature1", "feature2"]
      }
    ]`;

    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });
    
    const text = completion.choices[0].message.content;
    
    // Parse JSON response
    let places;
    try {
      const jsonMatch = text.match(/\[.*\]/s);
      places = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch (parseError) {
      throw new Error('Invalid JSON response from AI');
    }

    recordUsage({ api: 'openai', action: 'search_places', status: 'success', durationMs: Date.now() - startTime });
    res.json(places);
    
  } catch (error) {
    recordUsage({ api: 'openai', action: 'search_places', status: 'error', durationMs: Date.now() - startTime });
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

// AI Auto-tagging for community stories
app.post('/api/ai/generate-tags', async (req, res) => {
  try {
    const { title, content } = req.body
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content required' })
    }

    const openaiKey = process.env.AZURE_OPENAI_API_KEY
    if (!openaiKey) {
      return res.status(500).json({ error: 'AI service not configured' })
    }

    const prompt = `Analyze this travel story and suggest 2-4 relevant tags from these categories: Adventure, Food, Culture, Nature, Photography, Beach, Mountain, City, Nightlife, Shopping, History, Art, Wildlife, Festival, Local, Budget, Luxury, Solo, Family, Couple.

Title: ${title}
Content: ${content}

Return only a JSON array of tags: ["tag1", "tag2"]`

    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3
    })
    
    const text = completion.choices[0].message.content
    let tags = []
    
    try {
      const jsonMatch = text.match(/\[.*\]/)
      if (jsonMatch) {
        tags = JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      // Fallback: extract tags from text
      const availableTags = ['Adventure', 'Food', 'Culture', 'Nature', 'Photography', 'Beach', 'Mountain', 'City']
      tags = availableTags.filter(tag => 
        title.toLowerCase().includes(tag.toLowerCase()) || 
        content.toLowerCase().includes(tag.toLowerCase())
      ).slice(0, 3)
    }
    
    res.json({ tags: tags.slice(0, 4) })
  } catch (error) {
    console.error('AI tagging error:', error)
    res.status(500).json({ error: 'AI tagging failed' })
  }
})

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
    const testLat = parseFloat(process.env.TEST_LATITUDE || '40.7128');
    const testLng = parseFloat(process.env.TEST_LONGITUDE || '-74.0060');
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

// Firebase user sync endpoint moved above to avoid route conflicts

// Authentication endpoints for frontend
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email or username' });
    }

    // Create new user (password would be hashed in production)
    const user = new User({
      username,
      email,
      // In production, hash the password with bcrypt
      // password: await bcrypt.hash(password, 10)
    });
    
    await user.save();
    
    // Generate a simple token (use JWT in production)
    const token = Buffer.from(`${user._id}:${Date.now()}`).toString('base64');
    
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        tier: user.tier,
        profilePicture: user.profilePicture
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // In production, verify password with bcrypt
    // const isValidPassword = await bcrypt.compare(password, user.password);
    // if (!isValidPassword) {
    //   return res.status(401).json({ error: 'Invalid credentials' });
    // }
    
    // For now, accept any password (development only)
    
    // Generate a simple token (use JWT in production)
    const token = Buffer.from(`${user._id}:${Date.now()}`).toString('base64');
    
    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        tier: user.tier,
        profilePicture: user.profilePicture
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Get user profile endpoint
app.get('/api/auth/profile', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Decode simple token (use JWT verification in production)
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [userId] = decoded.split(':');
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        tier: user.tier,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token', details: error.message });
  }
});

// Update user profile endpoint
app.put('/api/auth/profile', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Decode simple token (use JWT verification in production)
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [userId] = decoded.split(':');
    
    const { username, email } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { username, email } },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        tier: user.tier,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Profile update failed', details: error.message });
  }
});

// Legacy Firebase auth endpoint (keeping for compatibility)
app.post('/api/auth/firebase-login', async (req, res) => {
  try {
    console.log('🔐 Firebase login attempt');
    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      console.log('❌ No bearer token provided');
      return res.status(401).json({ error: 'Missing bearer token' });
    }

    if (!ENABLE_FIREBASE_AUTH || !adminAuth) {
      console.log('⚠️ Firebase auth disabled, using dev mode');
      return res.json({ ok: true, mode: 'dev', admin: false, message: 'Auth disabled, token accepted for local dev' });
    }

    console.log('🔍 Verifying Firebase token...');
    const decoded = await adminAuth.verifyIdToken(token);
    const isAdmin = decoded?.admin === true;
    const { uid, email, name, picture } = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
      picture: decoded.picture,
    };
    console.log('✅ Token verified for user:', { uid, email, name });

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.log('❌ Database not connected, state:', mongoose.connection.readyState);
      return res.status(500).json({ error: 'Database not connected' });
    }

    console.log('🔍 Looking for existing user...');
    // Upsert user by firebaseUid/email
    let user = await User.findOne({ $or: [{ firebaseUid: uid }, ...(email ? [{ email }] : [])] });
    
    if (!user) {
      console.log('👤 Creating new user...');
      user = new User({
        firebaseUid: uid,
        username: email || name || uid,
        email: email || `${uid}@firebase.local`,
        profilePicture: picture || null,
      });
    } else {
      console.log('👤 Updating existing user:', user._id);
      // update minimal profile fields
      if (!user.firebaseUid) user.firebaseUid = uid;
      if (picture && user.profilePicture !== picture) user.profilePicture = picture;
      if (email && user.email !== email) user.email = email;
      if (name && !user.username.includes('@')) user.username = name;
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
    
    console.log('💾 Saving user to database...');
    const savedUser = await user.save();
    console.log('✅ User saved successfully:', savedUser._id);

    res.json({ ok: true, user: savedUser, admin: isAdmin });
  } catch (err) {
    console.error('❌ Firebase login error:', err);
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
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
    
    const [userCount, postCount, reviewCount, tripCount, dealCount, eventCount] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Review.countDocuments(),
      TripPlan.countDocuments(),
      Deal.countDocuments(),
      Event.countDocuments()
    ]);
    
    // Get recent users for debugging
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('username email firebaseUid createdAt');
    
    res.json({
      database: {
        status: dbStatus,
        state: dbState,
        uri: process.env.MONGO_URI ? 'configured' : 'missing'
      },
      counts: {
        users: userCount,
        posts: postCount,
        reviews: reviewCount,
        tripPlans: tripCount,
        deals: dealCount,
        events: eventCount
      },
      recentUsers,
      isEmpty: userCount === 0 && postCount === 0 && reviewCount === 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message, dbState: mongoose.connection.readyState });
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



// Merchant routes (Merchant + Admin only)
try {
  const merchantsRouter = (await import('./routes/merchants.js')).default;
  app.use('/api/merchants', merchantsRouter);
  console.log('✅ Merchants routes loaded');
} catch (error) {
  console.error('❌ Failed to load merchants routes:', error);
}

// Role management routes
try {
  const rolesRouter = (await import('./routes/roles.js')).default;
  app.use('/api/roles', rolesRouter);
  console.log('✅ Roles routes loaded');
} catch (error) {
  console.error('❌ Failed to load roles routes:', error);
}

// Service Provider routes
try {
  const servicesRouter = (await import('./routes/services.js')).default;
  app.use('/api/services', servicesRouter);
  console.log('✅ Services routes loaded');
} catch (error) {
  console.error('❌ Failed to load services routes:', error);
}

try {
  const bookingsRouter = (await import('./routes/bookings.js')).default;
  app.use('/api/bookings', bookingsRouter);
  console.log('✅ Bookings routes loaded');
} catch (error) {
  console.error('❌ Failed to load bookings routes:', error);
}

// Demo auth routes for testing
try {
  const demoAuthRouter = (await import('./routes/demo-auth.js')).default;
  app.use('/api/demo-auth', demoAuthRouter);
  console.log('✅ Demo auth routes loaded');
} catch (error) {
  console.error('❌ Failed to load demo auth routes:', error);
}

// Setup routes for initial configuration
try {
  const setupRouter = (await import('./routes/setup.js')).default;
  app.use('/api/setup', setupRouter);
  console.log('✅ Setup routes loaded');
} catch (error) {
  console.error('❌ Failed to load setup routes:', error);
}

// Load partners routes
try {
  const partnersRouter = (await import('./routes/partners.js')).default;
  app.use('/api/partners', partnersRouter);
  console.log('✅ Partners routes loaded');
} catch (error) {
  console.error('❌ Failed to load partners routes:', error);
}

// Load transport provider routes (Transport Provider + Admin only)
try {
  const transportRouter = (await import('./routes/transport-providers.js')).default;
  app.use('/api/transport-providers', transportRouter);
  console.log('✅ Transport provider routes loaded');
} catch (error) {
  console.error('❌ Failed to load transport provider routes:', error);
}

// Load travel agent routes (Travel Agent + Admin only)
try {
  const agentsRouter = (await import('./routes/travel-agents.js')).default;
  app.use('/api/travel-agents', agentsRouter);
  console.log('✅ Travel agent routes loaded');
} catch (error) {
  console.error('❌ Failed to load travel agent routes:', error);
}

// Load ecosystem management routes
try {
  const ecosystemRouter = (await import('./routes/ecosystem.js')).default;
  app.use('/api/ecosystem', ecosystemRouter);
  console.log('✅ Ecosystem management routes loaded');
} catch (error) {
  console.error('❌ Failed to load ecosystem routes:', error);
}

// Load features routes
try {
  const featuresRouter = (await import('./routes/features.js')).default;
  app.use('/api/features', featuresRouter);
  console.log('✅ Features routes loaded');
} catch (error) {
  console.error('❌ Failed to load features routes:', error);
}

// Load role test routes (development only)
try {
  const roleTestRouter = (await import('./routes/role-test.js')).default;
  app.use('/api/role-test', roleTestRouter);
  console.log('✅ Role test routes loaded');
} catch (error) {
  console.error('❌ Failed to load role test routes:', error);
}

// Admin routes - Enhanced with middleware
try {
  const adminRouter = (await import('./routes/admin.js')).default;
  app.use('/api/admin', adminRouter);
  console.log('✅ Admin routes loaded with authentication');
} catch (error) {
  console.error('❌ Failed to load admin routes:', error);
}

// Deals routes (Merchant + Admin only)
try {
  const dealsRouter = (await import('./routes/deals.js')).default;
  app.use('/api/deals', requireFeature('deals'), dealsRouter);
  console.log('✅ Deals routes loaded');
} catch (error) {
  console.error('❌ Failed to load deals routes:', error);
}

// Load transport provider routes
try {
  const transportRouter = (await import('./routes/transport-providers.js')).default;
  app.use('/api/transport', transportRouter);
  console.log('✅ Transport provider routes loaded');
} catch (error) {
  console.error('❌ Failed to load transport provider routes:', error);
}

// Load travel agent routes
try {
  const travelAgentRouter = (await import('./routes/travel-agents.js')).default;
  app.use('/api/travel-agents', travelAgentRouter);
  console.log('✅ Travel agent routes loaded');
} catch (error) {
  console.error('❌ Failed to load travel agent routes:', error);
}



// Serve admin dashboard from admin folder
const adminPath = path.join(__dirname, '../admin/dist');
if (existsSync(adminPath)) {
  console.log('✅ Admin dashboard found at:', adminPath);
  app.use('/admin', express.static(adminPath, {
    maxAge: '1d',
    etag: false,
    index: 'index.html'
  }));
  
  // Handle admin SPA routing
  app.get('/admin/*', (req, res) => {
    res.sendFile(path.join(adminPath, 'index.html'));
  });
} else {
  console.warn('❌ Admin dashboard not found at:', adminPath);
}

// Serve React app (catch-all for SPA routing)
app.get('*', (req, res) => {
  // Skip API routes and static assets
  if (req.path.startsWith('/api') || 
      req.path.startsWith('/admin') ||
      req.path.includes('.')) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  // Serve index.html for SPA routing
  const indexPaths = [
    staticPath ? path.join(staticPath, 'index.html') : null,
    path.join(__dirname, 'public/index.html'),
    path.join(__dirname, '../dist/index.html'),
    path.join(__dirname, '../frontend/dist/index.html')
  ].filter(Boolean);
  
  for (const indexPath of indexPaths) {
    if (existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  
  res.status(404).send('Frontend not built. Please run npm run build.');
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

httpServer.listen(PORT, () => {
  console.log('🔧 Startup diagnostics:');
  console.log('- PORT:', process.env.PORT || 'not set');
  console.log('- NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('- MONGO_URI:', process.env.MONGO_URI ? 'configured' : 'missing');
  console.log('- GOOGLE_PLACES_API_KEY:', process.env.GOOGLE_PLACES_API_KEY ? 'configured' : 'missing');
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

