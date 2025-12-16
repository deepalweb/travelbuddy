import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// In-memory cache for cost optimization
const placesCache = new Map();
const CACHE_TTL = 3600000; // 1 hour
const DAILY_BUDGET = {
  google: 1000,    // Max Google API calls per day
  azure: 5000      // Max Azure Maps calls per day
};

let dailyUsage = {
  google: 0,
  azure: 0,
  date: new Date().toDateString()
};

// Reset daily counters
function resetDailyCounters() {
  const today = new Date().toDateString();
  if (dailyUsage.date !== today) {
    dailyUsage = { google: 0, azure: 0, date: today };
  }
}

// Cost-optimized search endpoint
router.get('/search', async (req, res) => {
  try {
    resetDailyCounters();
    
    const { q, lat, lng, radius = 20000 } = req.query;
    if (!q || !lat || !lng) {
      return res.status(400).json({ error: 'q, lat, and lng are required' });
    }

    const cacheKey = `${q}_${lat}_${lng}_${radius}`;
    
    // 1. Check cache first
    const cached = placesCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('✅ Cache hit for:', q);
      return res.json({ places: cached.data, source: 'cache' });
    }

    let places = [];
    let source = 'none';

    // 2. Try Azure Maps first (cheaper)
    if (dailyUsage.azure < DAILY_BUDGET.azure) {
      try {
        places = await searchWithAzureMaps(q, lat, lng, radius);
        if (places.length > 0) {
          dailyUsage.azure++;
          source = 'azure';
          console.log(`✅ Azure Maps: ${places.length} places found`);
        }
      } catch (error) {
        console.warn('Azure Maps failed:', error.message);
      }
    }

    // 3. Fallback to Google Places if needed
    if (places.length === 0 && dailyUsage.google < DAILY_BUDGET.google) {
      try {
        places = await searchWithGooglePlaces(q, lat, lng, radius);
        if (places.length > 0) {
          dailyUsage.google++;
          source = 'google';
          console.log(`✅ Google Places: ${places.length} places found`);
        }
      } catch (error) {
        console.warn('Google Places failed:', error.message);
      }
    }

    // 4. Cache results
    if (places.length > 0) {
      placesCache.set(cacheKey, {
        data: places,
        timestamp: Date.now()
      });
    }

    res.json({
      places,
      source,
      usage: dailyUsage,
      budget: DAILY_BUDGET
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

// Azure Maps search function
async function searchWithAzureMaps(query, lat, lng, radius) {
  const azureKey = process.env.AZURE_MAPS_API_KEY;
  if (!azureKey) {
    throw new Error('Azure Maps API key not configured');
  }

  const url = `https://atlas.microsoft.com/search/fuzzy/json?api-version=1.0&subscription-key=${azureKey}&query=${encodeURIComponent(query)}&lat=${lat}&lon=${lng}&radius=${radius}&limit=20`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Azure Maps API error: ${response.status}`);
  }

  const data = await response.json();
  return (data.results || []).map(result => ({
    place_id: result.id || `azure_${Math.random().toString(36).substr(2, 9)}`,
    name: result.poi?.name || 'Unknown',
    formatted_address: result.address?.freeformAddress || '',
    geometry: {
      location: {
        lat: result.position?.lat || 0,
        lng: result.position?.lon || 0
      }
    },
    rating: null, // Azure Maps doesn't provide ratings
    user_ratings_total: null,
    types: result.poi?.categories || ['establishment'],
    business_status: 'OPERATIONAL',
    source: 'azure'
  }));
}

// Google Places search function
async function searchWithGooglePlaces(query, lat, lng, radius) {
  const googleKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!googleKey) {
    throw new Error('Google Places API key not configured');
  }

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=${radius}&key=${googleKey}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status}`);
  }

  const data = await response.json();
  if (data.status !== 'OK') {
    throw new Error(`Google Places status: ${data.status}`);
  }

  return (data.results || []).map(result => ({
    ...result,
    source: 'google'
  }));
}

// Clear cache endpoint
router.post('/clear-cache', (req, res) => {
  const cacheSize = placesCache.size;
  placesCache.clear();
  console.log(`🗑️ Cache cleared: ${cacheSize} entries removed`);
  res.json({
    success: true,
    message: `Cache cleared successfully`,
    entriesRemoved: cacheSize
  });
});

// Get usage statistics
router.get('/usage', (req, res) => {
  resetDailyCounters();
  
  const googleUsagePercent = (dailyUsage.google / DAILY_BUDGET.google * 100).toFixed(1);
  const azureUsagePercent = (dailyUsage.azure / DAILY_BUDGET.azure * 100).toFixed(1);
  
  res.json({
    daily: dailyUsage,
    budget: DAILY_BUDGET,
    usage_percent: {
      google: googleUsagePercent,
      azure: azureUsagePercent
    },
    cache_size: placesCache.size,
    estimated_monthly_cost: {
      google: (dailyUsage.google * 30 * 0.017).toFixed(2), // $0.017 per request
      azure: (dailyUsage.azure * 30 * 0.0005).toFixed(2)   // $0.0005 per request
    }
  });
});

export default router;