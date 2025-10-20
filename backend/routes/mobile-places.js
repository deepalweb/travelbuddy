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

// Generate AI places based on location
async function generateAIPlaces(locationInfo, userPreferences) {
  const { userType = 'Explorer', vibe = 'Cultural', interests = [] } = userPreferences;
  
  const prompt = `You are a local travel expert AI. Generate 60 diverse, realistic places near ${locationInfo.city}, ${locationInfo.country} (coordinates: ${locationInfo.coordinates.lat}, ${locationInfo.coordinates.lng}).

User Profile:
- Type: ${userType}
- Vibe: ${vibe}
- Interests: ${interests.join(', ') || 'General exploration'}

Generate a JSON array of exactly 60 places with this structure:
[
  {
    "place_id": "ai_generated_unique_id",
    "name": "Place Name",
    "formatted_address": "Complete realistic address in ${locationInfo.city}",
    "geometry": {
      "location": {
        "lat": ${locationInfo.coordinates.lat + (Math.random() - 0.5) * 0.02},
        "lng": ${locationInfo.coordinates.lng + (Math.random() - 0.5) * 0.02}
      }
    },
    "rating": 4.2,
    "user_ratings_total": 150,
    "price_level": 2,
    "types": ["restaurant", "establishment"],
    "category": "restaurants",
    "business_status": "OPERATIONAL",
    "description": "Engaging 2-3 sentence description",
    "localTip": "Practical local tip",
    "handyPhrase": "Useful phrase",
    "opening_hours": {
      "open_now": true
    }
  }
]

Categories to include (10 places each):
- restaurants (cafes, fine dining, local cuisine)
- attractions (landmarks, museums, viewpoints)
- shopping (markets, malls, local shops)
- entertainment (bars, clubs, theaters)
- nature (parks, gardens, outdoor spaces)
- culture (galleries, historic sites, cultural centers)

Requirements:
- Vary coordinates within 2km radius
- Realistic ratings (3.5-4.8)
- Mix of price levels (1-4)
- Authentic local names and addresses
- Each place must have a "category" field
- Diverse types within each category

Return ONLY the JSON array, no other text.`;

  const completion = await openai.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 4000
  });

  const responseText = completion.choices[0].message.content;
  
  try {
    const places = JSON.parse(responseText);
    return places.map((place, index) => ({
      ...place,
      place_id: place.place_id || `ai_${Date.now()}_${index}`,
      source: 'ai_generated'
    }));
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