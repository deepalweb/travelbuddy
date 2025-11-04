import express from 'express';
import OpenAI from 'openai';
import fetch from 'node-fetch';
import { generateEmbedding } from '../services/embeddingService.js';

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

// In-memory cache for search results (cleared for testing)
const searchCache = new Map();
const photoCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const PHOTO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Clear cache for testing
searchCache.clear();

// Get real place photos from Google Places API
const getPlacePhoto = (photoReference) => {
  if (!photoReference || !process.env.GOOGLE_PLACES_API_KEY) {
    return `https://source.unsplash.com/400x300/?travel,destination`;
  }
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
};

// Enhance AI results with real Google Places photos
const enhanceWithRealPhotos = async (aiPlaces) => {
  if (!process.env.GOOGLE_PLACES_API_KEY || !aiPlaces?.length) return aiPlaces;
  
  const enhanced = await Promise.all(aiPlaces.map(async (place) => {
    try {
      // Search Google Places for this specific place
      const query = `${place.name} ${place.location?.city || ''}`;
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results?.[0]?.photos?.[0]) {
        const photoRef = data.results[0].photos[0].photo_reference;
        return {
          ...place,
          image: getPlacePhoto(photoRef),
          realPhoto: true
        };
      }
    } catch (error) {
      console.warn(`Photo enhancement failed for ${place.name}:`, error.message);
    }
    return place;
  }));
  
  return enhanced;
};

// Google Places API fallback function
const searchWithGooglePlaces = async (query, limit = 8) => {
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    throw new Error('Google Places API key not configured');
  }

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status !== 'OK') {
    throw new Error(`Google Places API error: ${data.status}`);
  }

  const places = data.results.slice(0, limit).map((place, index) => ({
    id: place.place_id || `google_${index}`,
    name: place.name,
    description: `${place.name} is a popular destination${place.types ? ` known for ${place.types.slice(0, 2).join(' and ')}` : ''}.`,
    category: place.types?.[0] || 'attraction',
    rating: place.rating || 4.0,
    priceLevel: place.price_level ? '$'.repeat(place.price_level) : '$$',
    location: {
      address: place.formatted_address || 'Address not available',
      city: place.formatted_address?.split(',')[1]?.trim() || 'Unknown City',
      country: place.formatted_address?.split(',').pop()?.trim() || 'Unknown Country',
      coordinates: {
        lat: place.geometry?.location?.lat || 0,
        lng: place.geometry?.location?.lng || 0
      }
    },
    highlights: place.types?.slice(0, 3) || ['Popular destination'],
    image: getPlacePhoto(place.photos?.[0]?.photo_reference),
    contact: {
      phone: 'Not available',
      website: ''
    },
    openHours: place.opening_hours?.open_now ? 'Open now' : 'Hours vary',
    tags: ['google-places', 'verified']
  }));

  return {
    query: query.trim(),
    places,
    searchContext: `Found ${places.length} places using Google Places API`,
    totalFound: places.length,
    filters: { category: 'all' }
  };
};

// AI-powered places search with Google Places fallback
router.get('/places', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { q: query, category, limit = 8 } = req.query;
    
    // Validate input
    if (!query?.trim() || query.trim().length < 2) {
      return res.status(400).json({ 
        success: false,
        error: 'Search query must be at least 2 characters' 
      });
    }

    const normalizedQuery = query.trim();
    const normalizedLimit = Math.min(20, Math.max(1, parseInt(limit)));
    
    // Check cache first
    const cacheKey = `${normalizedQuery.toLowerCase()}_${category || 'all'}_${normalizedLimit}`;
    const cached = searchCache.get(cacheKey);
    
    // Skip cache for testing photo enhancement
    console.log('🔄 Cache bypassed for photo enhancement testing');

    // Try semantic search first
    console.log('🔍 OpenAI status:', !!openai, 'API Key:', !!process.env.AZURE_OPENAI_API_KEY);
    if (openai) {
      console.log('🤖 Azure OpenAI configured, attempting semantic search');
      try {
        // Enhanced AI prompt with semantic understanding
        const completion = await openai.chat.completions.create({
          model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
          messages: [{
            role: "system",
            content: "You are a semantic travel search engine. Understand the intent behind queries and find relevant places that match the meaning, not just keywords."
          }, {
            role: "user", 
            content: `Semantic search for: "${normalizedQuery}"
            
Analyze the intent and find ${normalizedLimit} places that match the meaning. Consider:
            - Hidden meanings ("budget" = price level $, "luxury" = $$$$)
            - Context ("couples" = romantic, "family" = kid-friendly)
            - Season/time preferences
            - Activity types implied
            
Return JSON: {"places":[{"id":"1","name":"Place Name","description":"Description with why it matches the query","category":"attraction","rating":4.5,"priceLevel":"$$","location":{"address":"Address","city":"City","country":"Country","coordinates":{"lat":0,"lng":0}},"highlights":["feature1"],"image":"https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400","contact":{"phone":"","website":""},"openHours":"9 AM-6 PM","tags":["popular"],"matchReason":"Why this matches the query"}]}`
          }],
          temperature: 0.7
        });
        
        const aiResponse = completion.choices[0].message.content;
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          if (parsedData.places?.length) {
            // Enhance AI results with real photos
            console.log('🖼️ Enhancing AI results with real Google Places photos...');
            
            // Force enhancement for testing
            let enhancedPlaces;
            try {
              enhancedPlaces = await enhanceWithRealPhotos(parsedData.places);
              console.log('✅ Photo enhancement complete - enhanced', enhancedPlaces.length, 'places');
            } catch (enhanceError) {
              console.error('❌ Photo enhancement failed:', enhanceError);
              enhancedPlaces = parsedData.places;
            }
            
            const finalResponse = {
              query: normalizedQuery,
              places: enhancedPlaces.map(place => ({
                ...place,
                image: place.image || `https://images.unsplash.com/search/photos?query=${encodeURIComponent(place.name)}&w=400&h=300&fit=crop`,
                semanticScore: 0.95
              })),
              searchContext: `AI-powered results with real photos for "${normalizedQuery}"`,
              totalFound: enhancedPlaces.length,
              filters: { category: category || 'all' },
              searchType: 'hybrid'
            };
            
            // Cache the results
            searchCache.set(cacheKey, { data: finalResponse, timestamp: Date.now() });
            
            return res.json({
              success: true,
              data: finalResponse,
              source: 'semantic-ai',
              processingTime: `${Date.now() - startTime}ms`
            });
          }
        }
      } catch (aiError) {
        console.error('❌ Semantic search failed:', aiError.message);
        console.error('Full error:', aiError);
      }
    }
    
    // Fallback to Google Places
    try {
      const fallbackResults = await searchWithGooglePlaces(normalizedQuery, normalizedLimit);
      searchCache.set(cacheKey, { data: fallbackResults, timestamp: Date.now() });
      return res.json({
        success: true,
        data: fallbackResults,
        source: 'google-places',
        processingTime: `${Date.now() - startTime}ms`
      });
    } catch (error) {
      // Final fallback - return mock data
      const mockData = {
        query: normalizedQuery,
        places: [{
          id: 'mock_1',
          name: `Popular place in ${normalizedQuery}`,
          description: `A recommended destination for ${normalizedQuery}`,
          category: 'attraction',
          rating: 4.2,
          priceLevel: '$$',
          location: {
            address: 'Location available',
            city: 'City',
            country: 'Country',
            coordinates: { lat: 6.9271, lng: 79.8612 }
          },
          highlights: ['Popular destination'],
          image: `https://images.unsplash.com/search/photos?query=${encodeURIComponent(normalizedQuery)}&w=400&h=300&fit=crop`,
          contact: { phone: 'Not available', website: '' },
          openHours: 'Hours vary',
          tags: ['recommended']
        }],
        searchContext: `Results for "${normalizedQuery}"`,
        totalFound: 1,
        filters: { category: category || 'all' }
      };
      return res.json({
        success: true,
        data: mockData,
        source: 'fallback',
        processingTime: `${Date.now() - startTime}ms`
      });
    }
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Search failed',
      message: 'Unable to process your search'
    });
  }
});

// Place details endpoint
router.get('/place/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    
    if (!placeId) {
      return res.status(400).json({ error: 'Place ID is required' });
    }

    if (!openai) {
      return res.status(500).json({ error: 'Azure OpenAI not configured' });
    }

    const prompt = `Provide comprehensive details for place ID: "${placeId}"
    
Return detailed information in this JSON format:
{
  "id": "${placeId}",
  "name": "Place Name",
  "description": {
    "short": "Brief description",
    "full": "Detailed 3-4 paragraph description",
    "highlights": ["highlight1", "highlight2", "highlight3"]
  },
  "images": {
    "hero": "https://source.unsplash.com/1200x800/?${encodeURIComponent(placeName)},landmark,travel",
    "gallery": [
      "https://source.unsplash.com/1200x800/?${encodeURIComponent(placeName)},landmark,travel",
      "https://source.unsplash.com/1200x800/?${encodeURIComponent(placeName)},architecture,building",
      "https://source.unsplash.com/1200x800/?${encodeURIComponent(placeName)},interior,inside",
      "https://source.unsplash.com/1200x800/?${encodeURIComponent(placeName)},food,cuisine",
      "https://source.unsplash.com/1200x800/?${encodeURIComponent(placeName)},people,culture",
      "https://source.unsplash.com/1200x800/?${encodeURIComponent(placeName)},night,evening"
    ],
    "count": 6
  },
  "rating": {
    "overall": 4.7,
    "count": 2456
  },
  "category": "restaurant|attraction|hotel|museum",
  "priceLevel": "$|$$|$$$|$$$$",
  "pricing": {
    "currency": "USD",
    "tickets": [
      {"type": "Adult", "price": 25},
      {"type": "Child", "price": 15}
    ]
  },
  "location": {
    "address": "Full address",
    "city": "City",
    "country": "Country",
    "coordinates": {"lat": 0.0, "lng": 0.0}
  },
  "hours": {
    "schedule": {
      "monday": "9:00 AM - 6:00 PM",
      "tuesday": "9:00 AM - 6:00 PM"
    },
    "isOpen": true,
    "nextClose": "6:00 PM"
  },
  "contact": {
    "phone": "+1-xxx-xxx-xxxx",
    "email": "info@place.com",
    "website": "https://website.com"
  },
  "tips": ["tip1", "tip2", "tip3"],
  "tags": ["tag1", "tag2"],
  "similarPlaces": [
    {
      "id": "similar-1",
      "name": "Similar Place",
      "image": "url",
      "rating": 4.5,
      "category": "category"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    });
    
    const text = completion.choices[0].message.content;
    
    // Parse JSON response
    let placeDetails;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      placeDetails = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (parseError) {
      throw new Error('Invalid JSON response from AI');
    }

    if (!placeDetails) {
      return res.status(404).json({ error: 'Place details not found' });
    }

    res.json({
      success: true,
      data: placeDetails
    });
    
  } catch (error) {
    console.error('Place details error:', error);
    res.status(500).json({ error: 'Failed to fetch place details', details: error.message });
  }
});

// Smart semantic suggestions endpoint
router.get('/suggestions', async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({ 
        suggestions: [
          'Hidden mountain towns in Europe',
          'Budget-friendly beaches in Southeast Asia',
          'Family-friendly attractions in Japan',
          'Romantic restaurants in Paris',
          'Adventure activities in New Zealand'
        ]
      });
    }

    if (!openai) {
      return res.json({ suggestions: ['Tokyo attractions', 'Paris restaurants', 'New York hotels'] });
    }

    const prompt = `Generate 5 smart travel search suggestions based on: "${query}"
    
    Make suggestions more specific and intent-aware:
    - If they type "beach" → suggest "secluded beaches for couples", "family beaches with shallow water"
    - If they type "food" → suggest "street food tours in Bangkok", "michelin restaurants in Tokyo"
    - Add context like budget, season, group type, activity level
    
    Return JSON: ["suggestion1", "suggestion2", "suggestion3", "suggestion4", "suggestion5"]`;

    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 300
    });
    
    const response = completion.choices[0].message.content;
    const suggestions = JSON.parse(response.match(/\[.*\]/)[0]);
    
    res.json({ suggestions });
    
  } catch (error) {
    console.error('Smart suggestions error:', error);
    res.json({ suggestions: [
      `${query} for couples`,
      `budget ${query}`,
      `luxury ${query}`,
      `family-friendly ${query}`,
      `hidden ${query}`
    ] });
  }
});

// Inspire me endpoint - generates discovery prompts
router.get('/inspire', async (req, res) => {
  try {
    if (!openai) {
      return res.json({ 
        prompts: [
          'Discover hidden gems in your city',
          'Find the perfect weekend getaway',
          'Explore local food scenes'
        ]
      });
    }

    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [{
        role: "user",
        content: `Generate 6 inspiring travel discovery prompts that encourage exploration. Make them specific and actionable.
        
        Examples:
        - "Rooftop bars with sunset views in your city"
        - "Historic neighborhoods perfect for walking tours"
        - "Local markets where chefs shop for ingredients"
        
        Return JSON: ["prompt1", "prompt2", "prompt3", "prompt4", "prompt5", "prompt6"]`
      }],
      temperature: 0.8,
      max_tokens: 400
    });
    
    const response = completion.choices[0].message.content;
    const prompts = JSON.parse(response.match(/\[.*\]/)[0]);
    
    res.json({ prompts });
    
  } catch (error) {
    console.error('Inspire error:', error);
    res.json({ prompts: [
      'Hidden local favorites in your area',
      'Perfect spots for golden hour photos',
      'Authentic street food experiences',
      'Quiet places to work remotely',
      'Best viewpoints in the city',
      'Local artisan shops and galleries'
    ] });
  }
});

// Test endpoint for hybrid approach
router.get('/test-hybrid', async (req, res) => {
  try {
    const mockAiResult = [{
      id: '1',
      name: 'Sukiyabashi Jiro',
      location: { city: 'Tokyo' },
      image: 'https://images.unsplash.com/search/photos?query=sushi&w=400'
    }];
    
    console.log('🧪 Testing hybrid enhancement...');
    const enhanced = await enhanceWithRealPhotos(mockAiResult);
    
    res.json({
      success: true,
      original: mockAiResult[0],
      enhanced: enhanced[0],
      hasRealPhoto: enhanced[0].realPhoto || false
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;