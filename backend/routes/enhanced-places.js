import express from 'express';
import fetch from 'node-fetch';
import OpenAI from 'openai';

const router = express.Router();

// Initialize Azure OpenAI
const openai = process.env.AZURE_OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { 'api-version': '2024-02-15-preview' },
  defaultHeaders: {
    'api-key': process.env.AZURE_OPENAI_API_KEY,
  },
}) : null;

// Step 1: Get real places from Google Places API
async function fetchGooglePlaces(lat, lng, query, radius = 5000, pageToken = null) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error('Google Places API key required');

  let url;
  if (pageToken) {
    // Use next page token for pagination
    url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken=${pageToken}&key=${apiKey}`;
  } else if (lat && lng) {
    // Nearby search with coordinates
    url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(query)}&key=${apiKey}`;
  } else {
    // Text search for location-based queries - add travel keywords for better results
    const searchQuery = `tourist attractions landmarks museums parks beaches temples restaurants hotels things to do in ${query}`;
    url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${apiKey}`;
  }
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status !== 'OK') {
    throw new Error(`Google Places API error: ${data.status}`);
  }
  
  return {
    results: data.results || [],
    nextPageToken: data.next_page_token || null
  };
}

// Step 2: AI enhances each place with rich details
async function enhancePlaceWithAI(place) {
  if (!openai) return place;

  const prompt = `Enhance this place with rich travel details:
Name: ${place.name}
Type: ${place.types?.join(', ')}
Rating: ${place.rating}
Address: ${place.vicinity}

Generate JSON:
{
  "description": "Engaging 2-sentence description",
  "highlights": ["feature1", "feature2", "feature3"],
  "bestTime": "Best time to visit",
  "insiderTip": "Local insider tip",
  "priceLevel": "$" or "$$" or "$$$",
  "estimatedDuration": "How long to spend here"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 400
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.warn(`AI enhancement failed for ${place.name}`);
    return {
      description: `Popular ${place.types?.[0]?.replace(/_/g, ' ')} in the area`,
      highlights: ["Highly rated", "Local favorite", "Worth visiting"],
      bestTime: "Anytime",
      insiderTip: "Check opening hours before visiting",
      priceLevel: "$$",
      estimatedDuration: "1-2 hours"
    };
  }
}

// Step 3: Format for frontend with real Google photos
function formatPlaceForFrontend(googlePlace, aiEnhancement) {
  const photoUrl = googlePlace.photos?.[0] 
    ? `/api/places/photo?ref=${googlePlace.photos[0].photo_reference}&w=800`
    : `https://source.unsplash.com/800x600/?${encodeURIComponent(googlePlace.name)}`;

  return {
    id: googlePlace.place_id,
    name: googlePlace.name,
    description: aiEnhancement.description,
    category: googlePlace.types?.[0]?.replace(/_/g, ' ') || 'place',
    rating: googlePlace.rating || 4.0,
    priceLevel: aiEnhancement.priceLevel,
    location: {
      address: googlePlace.vicinity,
      coordinates: {
        lat: googlePlace.geometry.location.lat,
        lng: googlePlace.geometry.location.lng
      }
    },
    image: photoUrl,
    highlights: aiEnhancement.highlights,
    bestTime: aiEnhancement.bestTime,
    insiderTip: aiEnhancement.insiderTip,
    estimatedDuration: aiEnhancement.estimatedDuration,
    openHours: googlePlace.opening_hours?.open_now ? "Open now" : "Check hours",
    contact: {
      phone: "Available on details",
      website: "Available on details"
    },
    tags: googlePlace.types?.slice(0, 3) || [],
    source: 'google_ai_enhanced'
  };
}

// Main enhanced search endpoint
router.get('/search', async (req, res) => {
  try {
    const { lat, lng, q: query, radius = 5000, limit = 10, pageToken } = req.query;
    
    if (!query && !pageToken) {
      return res.status(400).json({ error: 'Query or pageToken parameter required' });
    }

    const searchType = lat && lng ? 'nearby' : 'location';
    console.log(`🔍 Enhanced ${searchType} search: "${query}"${lat && lng ? ` near ${lat}, ${lng}` : ''}${pageToken ? ' (next page)' : ''}`);

    // Step 1: Get real places from Google
    const googleData = await fetchGooglePlaces(lat, lng, query, radius, pageToken);
    console.log(`📍 Google found ${googleData.results.length} places`);

    // Step 2: Enhance each place with AI (parallel processing)
    const enhancedPlaces = await Promise.all(
      googleData.results.slice(0, limit).map(async (place) => {
        const aiEnhancement = await enhancePlaceWithAI(place);
        return formatPlaceForFrontend(place, aiEnhancement);
      })
    );

    console.log(`🤖 AI enhanced ${enhancedPlaces.length} places`);

    res.json({
      success: true,
      query: query,
      results: enhancedPlaces,
      total: enhancedPlaces.length,
      nextPageToken: googleData.nextPageToken,
      hasMore: !!googleData.nextPageToken,
      source: 'google_places_ai_enhanced'
    });

  } catch (error) {
    console.error('❌ Enhanced search error:', error);
    res.status(500).json({
      error: 'Enhanced search failed',
      message: error.message
    });
  }
});

export default router;