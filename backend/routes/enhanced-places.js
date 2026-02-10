import express from 'express';
import fetch from 'node-fetch';
import OpenAI from 'openai';
import { AzureMapsSearch } from '../services/azureMapsSearch.js';

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

// Step 1: Get real places from Azure Maps
async function fetchAzurePlaces(lat, lng, query, radius = 5000) {
  const apiKey = process.env.AZURE_MAPS_API_KEY;
  if (!apiKey) throw new Error('Azure Maps API key required');

  const azureMapsSearch = new AzureMapsSearch(apiKey);
  const results = await azureMapsSearch.searchPlacesComprehensive(lat, lng, query, radius);
  
  return {
    results: results || [],
    nextPageToken: null // Azure Maps doesn't use pagination tokens
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

// Step 3: Format for frontend with Unsplash photos
function formatPlaceForFrontend(azurePlace, aiEnhancement) {
  const photoUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(azurePlace.name)},travel`;

  return {
    id: azurePlace.place_id,
    name: azurePlace.name,
    description: aiEnhancement.description,
    category: azurePlace.types?.[0]?.replace(/_/g, ' ') || 'place',
    rating: azurePlace.rating || 4.0,
    priceLevel: aiEnhancement.priceLevel,
    location: {
      address: azurePlace.formatted_address,
      coordinates: {
        lat: azurePlace.geometry.location.lat,
        lng: azurePlace.geometry.location.lng
      }
    },
    image: photoUrl,
    highlights: aiEnhancement.highlights,
    bestTime: aiEnhancement.bestTime,
    insiderTip: aiEnhancement.insiderTip,
    estimatedDuration: aiEnhancement.estimatedDuration,
    openHours: "Check hours",
    contact: {
      phone: azurePlace.phone || "Available on details",
      website: azurePlace.website || "Available on details"
    },
    tags: azurePlace.types?.slice(0, 3) || [],
    source: 'azure_ai_enhanced'
  };
}

// Main enhanced search endpoint
router.get('/search', async (req, res) => {
  try {
    const { lat, lng, q: query, radius = 5000, limit = 10 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng parameters required' });
    }

    console.log(`🔍 Enhanced search: "${query}" near ${lat}, ${lng}`);

    // Step 1: Get real places from Azure Maps
    const azureData = await fetchAzurePlaces(lat, lng, query, radius);
    console.log(`📍 Azure Maps found ${azureData.results.length} places`);

    // Step 2: Enhance each place with AI (parallel processing)
    const enhancedPlaces = await Promise.all(
      azureData.results.slice(0, limit).map(async (place) => {
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
      nextPageToken: null,
      hasMore: false,
      source: 'azure_maps_ai_enhanced'
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