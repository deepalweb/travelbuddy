import express from 'express';
import fetch from 'node-fetch';
import OpenAI from 'openai';

const router = express.Router();

// Initialize Azure OpenAI
const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { 'api-version': '2024-02-15-preview' },
  defaultHeaders: {
    'api-key': process.env.AZURE_OPENAI_API_KEY,
  },
});

// Cache for geocoding and AI results
const cache = new Map();
const CACHE_TTL = 3600000; // 1 hour

// 1. Get location info using Google Geocoding
async function getLocationInfo(lat, lng) {
  const cacheKey = `geo_${lat}_${lng}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status !== 'OK' || !data.results[0]) {
    throw new Error('Geocoding failed');
  }

  const result = data.results[0];
  const components = result.address_components;
  
  const locationInfo = {
    formatted_address: result.formatted_address,
    city: components.find(c => c.types.includes('locality'))?.long_name || '',
    country: components.find(c => c.types.includes('country'))?.long_name || '',
    state: components.find(c => c.types.includes('administrative_area_level_1'))?.long_name || '',
    coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) }
  };

  cache.set(cacheKey, { data: locationInfo, timestamp: Date.now() });
  return locationInfo;
}

// 2. Generate AI prompt with location context using travel writer approach
function createPlacesPrompt(locationInfo, category = 'all', userPreferences = {}) {
  const { city, country, state, formatted_address, coordinates } = locationInfo;
  const { userType = 'Solo traveler', vibe = 'Cultural', language = 'English', radius = 5 } = userPreferences;
  
  return `You are a professional travel content writer and local guide. 
Your job is to create detailed, visually rich travel plans for tourists visiting a specific area. 
Each plan must include:
- Top attractions within the given radius, with names, addresses, and descriptions.
- Reasons to visit each spot ("Why visit").
- Tips for visitors (best times, what to bring, cultural etiquette).
- Estimated time needed.
- Optional: 2–3 high-quality image URLs per place (from reliable sources such as Wikimedia, TripAdvisor, Unsplash).
- A summarized half-day or 1-day itinerary table (time, activity, notes).

Keep the tone friendly, clear, and factual. Use Markdown formatting (###, **bold**, bullet lists, and tables). 
If the user provides coordinates, identify the corresponding city or region first and use that context for accuracy.
End the plan by asking if the user would like a Google Maps version.
Create a travel plan for tourists near the following location:

📍 Coordinates: ${coordinates.lat}, ${coordinates.lng}
📏 Radius: ${radius} km

Include:
- Top 5–7 attractions within that radius
- For each attraction: Name, Address, 2–3 images (URLs), "Why visit", "Tips", and "Time needed"
- One suggested half-day itinerary (with table format)
- Add source links (TripAdvisor, Wikipedia, etc.) at the end

Make it visually appealing in Markdown.

User type: ${userType}
Preferred vibe: ${vibe}
Language: ${language}
Output length: Medium (approx. 600–800 words)

IMPORTANT: Also provide a JSON summary at the end with this exact structure:
{
  "places": [
    {
      "place_id": "unique_id",
      "name": "Place Name",
      "formatted_address": "Complete Address",
      "types": ["tourist_attraction", "establishment"],
      "geometry": {
        "location": {
          "lat": ${coordinates.lat + (Math.random() - 0.5) * 0.01},
          "lng": ${coordinates.lng + (Math.random() - 0.5) * 0.01}
        }
      },
      "rating": 4.5,
      "user_ratings_total": 150,
      "price_level": 2,
      "business_status": "OPERATIONAL",
      "opening_hours": {
        "open_now": true,
        "weekday_text": ["Monday: 9:00 AM – 6:00 PM"]
      },
      "description": "Brief description",
      "whyVisit": "Reason to visit",
      "tips": "Visitor tips",
      "timeNeeded": "2-3 hours",
      "images": ["url1", "url2"],
      "category": "${category}"
    }
  ]
}`;
}

// 3. Get AI-generated places with rich travel content
async function getAIPlaces(locationInfo, category = 'all', userPreferences = {}) {
  const cacheKey = `places_${locationInfo.city}_${category}_${JSON.stringify(userPreferences)}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const prompt = createPlacesPrompt(locationInfo, category, userPreferences);
  
  const completion = await openai.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 4000
  });

  const responseText = completion.choices[0].message.content;
  
  // Extract JSON from response (look for the places array)
  const jsonMatch = responseText.match(/\{[\s\S]*"places"[\s\S]*\}/g);
  if (!jsonMatch) {
    throw new Error('Invalid AI response format - no JSON found');
  }

  const jsonData = JSON.parse(jsonMatch[jsonMatch.length - 1]);
  const places = jsonData.places || [];
  
  // Add generated IDs and ensure required fields
  const processedPlaces = places.map((place, index) => ({
    ...place,
    place_id: place.place_id || `ai_${Date.now()}_${index}`,
    photos: place.images ? place.images.map(url => ({ photo_reference: url, html_attributions: [] })) : [],
    distance_m: Math.round(Math.random() * 5000), // Estimated distance
    source: 'ai_generated',
    fullContent: responseText // Store full markdown content
  }));

  cache.set(cacheKey, { data: processedPlaces, timestamp: Date.now() });
  return processedPlaces;
}

// 4. Categorize places for UI
function categorizePlaces(places) {
  const categories = {
    restaurants: [],
    attractions: [],
    hotels: [],
    shopping: [],
    entertainment: [],
    nature: [],
    culture: [],
    other: []
  };

  places.forEach(place => {
    const types = place.types || [];
    const category = place.category || 'other';
    
    if (types.includes('restaurant') || types.includes('food') || category === 'restaurants') {
      categories.restaurants.push(place);
    } else if (types.includes('tourist_attraction') || types.includes('museum') || category === 'attractions') {
      categories.attractions.push(place);
    } else if (types.includes('lodging') || category === 'hotels') {
      categories.hotels.push(place);
    } else if (types.includes('store') || types.includes('shopping_mall') || category === 'shopping') {
      categories.shopping.push(place);
    } else if (types.includes('night_club') || types.includes('bar') || category === 'entertainment') {
      categories.entertainment.push(place);
    } else if (types.includes('park') || category === 'nature') {
      categories.nature.push(place);
    } else if (types.includes('museum') || types.includes('art_gallery') || category === 'culture') {
      categories.culture.push(place);
    } else {
      categories.other.push(place);
    }
  });

  return categories;
}

// Main endpoint: AI-powered places search
router.get('/ai/nearby', async (req, res) => {
  try {
    const { lat, lng, category = 'all', limit = 20, userType, vibe, language, radius } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const userPreferences = { userType, vibe, language, radius: radius || 5 };
    console.log(`🤖 AI Places search: ${lat}, ${lng}, category: ${category}, prefs:`, userPreferences);

    // Step 1: Get location info
    const locationInfo = await getLocationInfo(lat, lng);
    console.log(`📍 Location: ${locationInfo.city}, ${locationInfo.country}`);

    // Step 2: Get AI-generated places
    const places = await getAIPlaces(locationInfo, category, userPreferences);
    console.log(`🎯 Generated ${places.length} places`);

    // Step 3: Apply limit and return
    const limitedPlaces = places.slice(0, parseInt(limit));

    res.json({
      status: 'OK',
      results: limitedPlaces,
      location: locationInfo,
      source: 'ai_generated',
      total: limitedPlaces.length,
      userPreferences
    });

  } catch (error) {
    console.error('❌ AI Places error:', error);
    res.status(500).json({ 
      error: 'Failed to generate places', 
      details: error.message 
    });
  }
});

// Get full travel content with rich markdown
router.get('/ai/travel-plan', async (req, res) => {
  try {
    const { lat, lng, userType, vibe, language, radius } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const userPreferences = { userType, vibe, language, radius: radius || 5 };
    console.log(`📝 AI Travel Plan: ${lat}, ${lng}, prefs:`, userPreferences);

    const locationInfo = await getLocationInfo(lat, lng);
    const places = await getAIPlaces(locationInfo, 'all', userPreferences);

    res.json({
      status: 'OK',
      location: locationInfo,
      places: places,
      fullContent: places[0]?.fullContent || '',
      userPreferences,
      source: 'ai_generated'
    });

  } catch (error) {
    console.error('❌ AI Travel Plan error:', error);
    res.status(500).json({ 
      error: 'Failed to generate travel plan', 
      details: error.message 
    });
  }
});

// Categorized places for mobile sections
router.get('/ai/sections', async (req, res) => {
  try {
    const { lat, lng, userType, vibe, language } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const userPreferences = { userType, vibe, language };
    console.log(`📱 AI Sections search: ${lat}, ${lng}`, userPreferences);

    // Get location info
    const locationInfo = await getLocationInfo(lat, lng);

    // Get places for all categories
    const allPlaces = await getAIPlaces(locationInfo, 'all', userPreferences);

    // Categorize places
    const categorized = categorizePlaces(allPlaces);

    // Format for mobile sections
    const sections = [
      {
        title: 'Popular Restaurants',
        category: 'restaurants',
        places: categorized.restaurants.slice(0, 6)
      },
      {
        title: 'Top Attractions',
        category: 'attractions', 
        places: categorized.attractions.slice(0, 6)
      },
      {
        title: 'Hotels & Lodging',
        category: 'hotels',
        places: categorized.hotels.slice(0, 4)
      },
      {
        title: 'Shopping & Markets',
        category: 'shopping',
        places: categorized.shopping.slice(0, 4)
      },
      {
        title: 'Entertainment',
        category: 'entertainment',
        places: categorized.entertainment.slice(0, 4)
      }
    ].filter(section => section.places.length > 0);

    res.json({
      status: 'OK',
      sections,
      location: locationInfo,
      userPreferences,
      source: 'ai_generated'
    });

  } catch (error) {
    console.error('❌ AI Sections error:', error);
    res.status(500).json({ 
      error: 'Failed to generate sections', 
      details: error.message 
    });
  }
});

// Batch places for multiple categories
router.post('/ai/batch', async (req, res) => {
  try {
    const { lat, lng, categories, userPreferences = {} } = req.body;
    
    if (!lat || !lng || !Array.isArray(categories)) {
      return res.status(400).json({ error: 'lat, lng, and categories array are required' });
    }

    console.log(`🔄 AI Batch search: ${categories.length} categories`, userPreferences);

    const locationInfo = await getLocationInfo(lat, lng);
    const results = {};

    // Process each category
    for (const category of categories) {
      try {
        const places = await getAIPlaces(locationInfo, category, userPreferences);
        results[category] = places.slice(0, 10);
        console.log(`✅ ${category}: ${results[category].length} places`);
      } catch (error) {
        console.error(`❌ Error for ${category}:`, error.message);
        results[category] = [];
      }
    }

    res.json({
      status: 'OK',
      results,
      location: locationInfo,
      userPreferences,
      source: 'ai_generated'
    });

  } catch (error) {
    console.error('❌ AI Batch error:', error);
    res.status(500).json({ 
      error: 'Failed to generate batch places', 
      details: error.message 
    });
  }
});

// Clear cache endpoint
router.delete('/ai/cache', (req, res) => {
  cache.clear();
  res.json({ success: true, message: 'Cache cleared' });
});

// Cache stats
router.get('/ai/cache/stats', (req, res) => {
  res.json({
    size: cache.size,
    ttl_ms: CACHE_TTL,
    keys: Array.from(cache.keys())
  });
});

export default router;