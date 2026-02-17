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
  
  const prompt = `You are a LOCAL EXPERT for ${locationInfo.city}, ${locationInfo.country}.

Location: ${locationInfo.coordinates.lat}, ${locationInfo.coordinates.lng}

Generate 60 REAL places that ACTUALLY EXIST in ${locationInfo.city}. Use your knowledge of real businesses, landmarks, and locations.

CRITICAL RULES:
1. ONLY use places that exist or are highly likely to exist
2. Use SPECIFIC names: "Gangaramaya Temple" NOT "Temple 1"
3. Use REAL addresses in ${locationInfo.city}
4. Include famous landmarks everyone knows
5. Include popular local businesses
6. Vary coordinates realistically within city bounds

JSON structure:
[
  {
    "place_id": "unique_id",
    "name": "REAL PLACE NAME (must exist in ${locationInfo.city})",
    "formatted_address": "Real street address",
    "geometry": {
      "location": {
        "lat": ${locationInfo.coordinates.lat + (Math.random() - 0.5) * 0.02},
        "lng": ${locationInfo.coordinates.lng + (Math.random() - 0.5) * 0.02}
      }
    },
    "rating": 4.2,
    "types": ["restaurant"],
    "category": "restaurants",
    "description": "Specific description",
    "localTip": "Practical tip",
    "opening_hours": { "open_now": true }
  }
]

Categories (10 each):
- restaurants: Famous restaurants in ${locationInfo.city}
- attractions: Well-known landmarks in ${locationInfo.city}
- shopping: Popular markets/malls in ${locationInfo.city}
- entertainment: Known bars/clubs in ${locationInfo.city}
- nature: Named parks/beaches in ${locationInfo.city}
- culture: Museums/galleries in ${locationInfo.city}

EXAMPLES for ${locationInfo.city}:
${locationInfo.city === 'Colombo' ? `
- Gangaramaya Temple (landmark)
- Ministry of Crab (restaurant)
- Galle Face Green (park)
- Dutch Hospital (shopping)
- Independence Square (attraction)
` : `
- Use famous places from ${locationInfo.city}
- Research real locations
- Include tourist hotspots
`}

Return ONLY valid JSON array. NO explanations.`;

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