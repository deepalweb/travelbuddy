import express from 'express';
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

// Mobile places discovery endpoint
router.post('/discover', async (req, res) => {
  try {
    const { latitude, longitude, userPreferences = {} } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Location coordinates required' });
    }

    console.log(`📍 Mobile places discovery for: ${latitude}, ${longitude}`);

    // Get location context
    const locationInfo = await getLocationContext(latitude, longitude);
    
    // Generate AI places
    const aiPlaces = await generateAIPlaces(locationInfo, userPreferences);
    
    // Categorize places
    const categorizedPlaces = categorizePlaces(aiPlaces);
    
    console.log(`✅ Generated ${aiPlaces.length} places in ${Object.keys(categorizedPlaces).length} categories`);
    
    res.json({
      status: 'success',
      location: locationInfo,
      totalPlaces: aiPlaces.length,
      categories: categorizedPlaces,
      allPlaces: aiPlaces
    });

  } catch (error) {
    console.error('❌ Mobile places discovery error:', error);
    res.status(500).json({ 
      error: 'Failed to discover places', 
      details: error.message 
    });
  }
});

// Get location context using coordinates
async function getLocationContext(lat, lng) {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results[0]) {
      const result = data.results[0];
      const components = result.address_components;
      
      return {
        coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
        address: result.formatted_address,
        city: components.find(c => c.types.includes('locality'))?.long_name || '',
        country: components.find(c => c.types.includes('country'))?.long_name || '',
        state: components.find(c => c.types.includes('administrative_area_level_1'))?.long_name || ''
      };
    }
  } catch (error) {
    console.error('Geocoding failed:', error);
  }
  
  return {
    coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
    address: `${lat}, ${lng}`,
    city: 'Unknown',
    country: 'Unknown',
    state: ''
  };
}

// Fetch photo reference from Google Places
async function fetchPlacePhoto(placeName, location) {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(placeName)}&location=${location.lat},${location.lng}&radius=2000&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results[0]?.photos?.[0]) {
      return data.results[0].photos[0].photo_reference;
    }
  } catch (error) {
    console.error(`Photo fetch failed for ${placeName}:`, error);
  }
  return null;
}

// Generate AI places based on location
async function generateAIPlaces(locationInfo, userPreferences) {
  const { userType = 'Explorer', vibe = 'Cultural', interests = [] } = userPreferences;
  
  const prompt = `You are a local travel expert for ${locationInfo.city}, ${locationInfo.country}. Generate 60 REAL, SPECIFIC places with ACTUAL NAMES (not generic like "Landmark" or "Tourist Spot").

Location: ${locationInfo.coordinates.lat}, ${locationInfo.coordinates.lng}
User: ${userType} | Vibe: ${vibe}

IMPORTANT: Use REAL place names like:
✅ "Gangaramaya Temple" NOT ❌ "Buddhist Temple"
✅ "Ministry of Crab" NOT ❌ "Seafood Restaurant"
✅ "Galle Face Green" NOT ❌ "Beachfront Park"

Generate JSON array with this structure:
[
  {
    "place_id": "unique_id_123",
    "name": "REAL PLACE NAME (e.g., Gangaramaya Temple, not Temple)",
    "formatted_address": "Actual street address in ${locationInfo.city}",
    "geometry": {
      "location": {
        "lat": ${locationInfo.coordinates.lat + (Math.random() - 0.5) * 0.02},
        "lng": ${locationInfo.coordinates.lng + (Math.random() - 0.5) * 0.02}
      }
    },
    "rating": 4.2,
    "user_ratings_total": 150,
    "price_level": 2,
    "types": ["restaurant"],
    "category": "restaurants",
    "business_status": "OPERATIONAL",
    "description": "Specific description about THIS place",
    "localTip": "Practical tip specific to THIS place",
    "handyPhrase": "Useful local phrase",
    "opening_hours": { "open_now": true }
  }
]

Categories (10 each):
- restaurants: Famous local restaurants with REAL names
- attractions: Well-known landmarks with ACTUAL names
- shopping: Specific markets/malls with REAL names
- entertainment: Named bars/clubs/theaters
- nature: Named parks/gardens/beaches
- culture: Specific museums/galleries with REAL names

Rules:
1. NEVER use generic names like "Landmark", "Tourist Spot", "Attraction"
2. Use REAL place names that exist or sound authentic
3. Include local language names where appropriate
4. Vary coordinates within 2km
5. Realistic ratings (3.5-4.8)
6. Each place MUST have unique, specific name

Return ONLY valid JSON array.`;

  const completion = await openai.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 4000
  });

  const responseText = completion.choices[0].message.content;
  
  try {
    const places = JSON.parse(responseText);
    
    // Fetch photos for places (limit concurrent requests)
    const placesWithPhotos = await Promise.all(
      places.map(async (place, index) => {
        const photoReference = await fetchPlacePhoto(
          place.name,
          place.geometry.location
        );
        
        return {
          ...place,
          place_id: place.place_id || `ai_${Date.now()}_${index}`,
          source: 'ai_generated',
          photos: photoReference ? [{ photo_reference: photoReference }] : [],
          photoUrl: photoReference 
            ? `https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api/places/photo?ref=${photoReference}&maxWidth=800`
            : ''
        };
      })
    );
    
    return placesWithPhotos;
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    return [];
  }
}

// Categorize places for mobile sections
function categorizePlaces(places) {
  const categories = {
    restaurants: [],
    attractions: [],
    shopping: [],
    entertainment: [],
    nature: [],
    culture: []
  };

  places.forEach(place => {
    const category = place.category || 'attractions';
    if (categories[category]) {
      categories[category].push(place);
    } else {
      categories.attractions.push(place);
    }
  });

  return categories;
}

export default router;