# Google Places API Alternatives - Complete Guide

## 🎯 Best Alternatives (Ranked by Cost & Features)

### 1. **Foursquare Places API** ⭐ RECOMMENDED
**Pricing:** 
- Free: 50,000 calls/month
- Pro: $0.49 per 1,000 calls after free tier

**Pros:**
- ✅ 50K free calls (vs Google's ~$200/month equivalent)
- ✅ Rich venue data (ratings, tips, photos)
- ✅ Better for restaurants/nightlife
- ✅ User-generated tips and reviews
- ✅ Similar data quality to Google

**Cons:**
- ❌ Smaller coverage in rural areas
- ❌ Less accurate for some regions

**Implementation:**
```javascript
// Backend: routes/places.js
const axios = require('axios');

router.get('/foursquare/nearby', async (req, res) => {
  const { lat, lng, query, radius } = req.query;
  
  const response = await axios.get('https://api.foursquare.com/v3/places/search', {
    headers: {
      'Authorization': process.env.FOURSQUARE_API_KEY
    },
    params: {
      ll: `${lat},${lng}`,
      query: query,
      radius: radius,
      limit: 50
    }
  });
  
  res.json({ results: response.data.results });
});
```

**Cost Comparison:**
- Google: $17 per 1,000 calls
- Foursquare: $0.49 per 1,000 calls (after 50K free)
- **Savings: 97%** 💰

---

### 2. **Mapbox Places API** 🗺️
**Pricing:**
- Free: 100,000 requests/month
- $0.50 per 1,000 after free tier

**Pros:**
- ✅ 100K free requests/month
- ✅ Excellent geocoding
- ✅ Good for navigation/routing
- ✅ Beautiful maps included

**Cons:**
- ❌ Less detailed POI data than Google
- ❌ Fewer reviews/ratings

**Implementation:**
```javascript
router.get('/mapbox/nearby', async (req, res) => {
  const { lat, lng, query } = req.query;
  
  const response = await axios.get(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json`,
    {
      params: {
        proximity: `${lng},${lat}`,
        types: 'poi',
        limit: 50,
        access_token: process.env.MAPBOX_TOKEN
      }
    }
  );
  
  res.json({ results: response.data.features });
});
```

---

### 3. **HERE Places API** 🌍
**Pricing:**
- Free: 250,000 transactions/month
- $1 per 1,000 after free tier

**Pros:**
- ✅ 250K free transactions/month (HIGHEST)
- ✅ Excellent for automotive/navigation
- ✅ Good global coverage
- ✅ Offline maps support

**Cons:**
- ❌ Less social features (reviews, tips)
- ❌ UI not as polished

**Implementation:**
```javascript
router.get('/here/nearby', async (req, res) => {
  const { lat, lng, query, radius } = req.query;
  
  const response = await axios.get('https://discover.search.hereapi.com/v1/discover', {
    params: {
      at: `${lat},${lng}`,
      q: query,
      limit: 50,
      apiKey: process.env.HERE_API_KEY
    }
  });
  
  res.json({ results: response.data.items });
});
```

---

### 4. **OpenStreetMap (Overpass API)** 🆓 FREE
**Pricing:** 
- 100% FREE (community-driven)

**Pros:**
- ✅ Completely free
- ✅ Open data
- ✅ Good coverage worldwide
- ✅ No API limits (self-hosted)

**Cons:**
- ❌ No ratings/reviews
- ❌ Data quality varies by region
- ❌ Requires more data processing

**Implementation:**
```javascript
router.get('/osm/nearby', async (req, res) => {
  const { lat, lng, query, radius } = req.query;
  
  const overpassQuery = `
    [out:json];
    (
      node["amenity"="${query}"](around:${radius},${lat},${lng});
      way["amenity"="${query}"](around:${radius},${lat},${lng});
    );
    out body;
  `;
  
  const response = await axios.post('https://overpass-api.de/api/interpreter', 
    overpassQuery,
    { headers: { 'Content-Type': 'text/plain' } }
  );
  
  res.json({ results: response.data.elements });
});
```

---

### 5. **TomTom Places API** 🚗
**Pricing:**
- Free: 2,500 requests/day
- $0.50 per 1,000 after free tier

**Pros:**
- ✅ Good for automotive/navigation
- ✅ Real-time traffic data
- ✅ Decent POI coverage

**Cons:**
- ❌ Lower free tier than competitors
- ❌ Less social features

---

### 6. **Yelp Fusion API** 🍔 (Best for Restaurants)
**Pricing:**
- Free: 5,000 calls/day
- No paid tier (free only)

**Pros:**
- ✅ Best for restaurants/food
- ✅ Rich reviews and ratings
- ✅ User photos
- ✅ 5K free calls/day

**Cons:**
- ❌ Limited to businesses (no landmarks)
- ❌ US-focused (limited international)
- ❌ No paid tier for scaling

**Implementation:**
```javascript
router.get('/yelp/nearby', async (req, res) => {
  const { lat, lng, query, radius } = req.query;
  
  const response = await axios.get('https://api.yelp.com/v3/businesses/search', {
    headers: {
      'Authorization': `Bearer ${process.env.YELP_API_KEY}`
    },
    params: {
      latitude: lat,
      longitude: lng,
      term: query,
      radius: radius,
      limit: 50
    }
  });
  
  res.json({ results: response.data.businesses });
});
```

---

## 💡 Hybrid Strategy (BEST APPROACH)

### Use Multiple APIs Based on Category

```javascript
// Backend: Smart API Router
async function getPlaces(lat, lng, query, category) {
  switch(category) {
    case 'restaurants':
    case 'cafes':
    case 'bars':
      // Use Yelp (best for food, 5K free/day)
      return await getYelpPlaces(lat, lng, query);
      
    case 'landmarks':
    case 'attractions':
      // Use Foursquare (best for POIs, 50K free/month)
      return await getFoursquarePlaces(lat, lng, query);
      
    case 'hotels':
    case 'shopping':
      // Use HERE (250K free/month)
      return await getHEREPlaces(lat, lng, query);
      
    default:
      // Fallback to OpenStreetMap (free)
      return await getOSMPlaces(lat, lng, query);
  }
}
```

---

## 📊 Cost Comparison Table

| Provider | Free Tier | Cost After Free | Best For |
|----------|-----------|-----------------|----------|
| **Google Places** | ~$200 credit | $17/1K calls | Everything (expensive) |
| **Foursquare** | 50K/month | $0.49/1K | POIs, Nightlife ⭐ |
| **Mapbox** | 100K/month | $0.50/1K | Maps, Geocoding |
| **HERE** | 250K/month | $1/1K | Navigation, Global |
| **OpenStreetMap** | Unlimited | FREE | Budget projects |
| **Yelp** | 5K/day | N/A | Restaurants only |
| **TomTom** | 2.5K/day | $0.50/1K | Automotive |

---

## 🎯 Recommended Solution for Your App

### Option A: Foursquare Only (Simple)
```
Cost: FREE for 50K calls/month
Coverage: Good for urban areas
Implementation: 1 day
```

### Option B: Hybrid (Best Quality) ⭐ RECOMMENDED
```
- Yelp: Restaurants/Cafes (5K/day free)
- Foursquare: Attractions/Nightlife (50K/month free)
- HERE: Hotels/Shopping (250K/month free)
- OSM: Fallback (unlimited free)

Total Free Tier: ~300K+ calls/month
Cost After: $0.49-$1 per 1K calls
Implementation: 2-3 days
```

### Option C: OpenStreetMap Only (Zero Cost)
```
Cost: FREE forever
Coverage: Good globally
Implementation: 2 days
Trade-off: No ratings/reviews (need to add your own)
```

---

## 🚀 Quick Migration Guide

### Step 1: Add New API Keys (.env)
```env
FOURSQUARE_API_KEY=your_key
MAPBOX_TOKEN=your_token
HERE_API_KEY=your_key
YELP_API_KEY=your_key
```

### Step 2: Create Unified Places Service
```javascript
// backend/services/placesAggregator.js
class PlacesAggregator {
  async getNearbyPlaces(lat, lng, query, category) {
    // Try primary API
    let places = await this.getPrimaryAPI(category, lat, lng, query);
    
    // Fallback to secondary
    if (places.length === 0) {
      places = await this.getSecondaryAPI(lat, lng, query);
    }
    
    // Normalize data format
    return this.normalizeResults(places);
  }
  
  normalizeResults(places) {
    // Convert all APIs to common format
    return places.map(p => ({
      id: p.id || p.fsq_id || p.place_id,
      name: p.name,
      rating: p.rating || p.score || 0,
      address: p.location?.address || p.address,
      latitude: p.geocodes?.main?.latitude || p.lat,
      longitude: p.geocodes?.main?.longitude || p.lng,
      photoUrl: p.photos?.[0] || p.image_url,
      type: p.categories?.[0]?.name || p.type
    }));
  }
}
```

### Step 3: Update Mobile App (No Changes Needed!)
Your mobile app continues to call the same backend endpoint. Backend handles the API switching.

---

## 💰 Cost Savings Example

### Current (Google Places)
```
15 calls/session × 100 users/day × 30 days = 45,000 calls/month
Cost: 45,000 × $0.017 = $765/month
```

### With Foursquare
```
45,000 calls/month
Cost: FREE (under 50K limit)
Savings: $765/month = $9,180/year 💰
```

### With Hybrid Strategy
```
45,000 calls/month across multiple free tiers
Cost: FREE (all under limits)
Savings: $765/month = $9,180/year 💰
```

---

## ⚡ Quick Start: Foursquare Implementation

### 1. Get API Key
Visit: https://foursquare.com/developers/signup

### 2. Add to Backend
```javascript
// backend/routes/places.js
router.get('/mobile/nearby', async (req, res) => {
  const { lat, lng, q, radius } = req.query;
  
  try {
    const response = await axios.get('https://api.foursquare.com/v3/places/search', {
      headers: {
        'Authorization': process.env.FOURSQUARE_API_KEY,
        'Accept': 'application/json'
      },
      params: {
        ll: `${lat},${lng}`,
        query: q,
        radius: radius || 5000,
        limit: 50,
        fields: 'fsq_id,name,location,categories,rating,photos'
      }
    });
    
    const places = response.data.results.map(place => ({
      id: place.fsq_id,
      name: place.name,
      address: place.location.formatted_address,
      latitude: place.geocodes.main.latitude,
      longitude: place.geocodes.main.longitude,
      rating: place.rating || 4.0,
      type: place.categories[0]?.name || 'place',
      photoUrl: place.photos?.[0]?.prefix + '300x300' + place.photos?.[0]?.suffix || ''
    }));
    
    res.json({ status: 'OK', results: places });
  } catch (error) {
    res.status(500).json({ status: 'ERROR', message: error.message });
  }
});
```

### 3. Test
```bash
curl "http://localhost:8080/api/places/mobile/nearby?lat=40.7128&lng=-74.0060&q=restaurants&radius=5000"
```

**No mobile app changes needed!** ✅

---

## 📝 Recommendation

**For Your Travel Buddy App:**

Use **Hybrid Strategy** with:
1. **Foursquare** (primary) - 50K free/month
2. **Yelp** (restaurants) - 5K free/day  
3. **OpenStreetMap** (fallback) - unlimited free

**Benefits:**
- ✅ Save $9,000+/year
- ✅ 300K+ free API calls/month
- ✅ Better data for restaurants (Yelp)
- ✅ No mobile app changes needed
- ✅ Gradual migration (test one API at a time)

**Implementation Time:** 2-3 days

Want me to implement the Foursquare integration?
