import express from 'express';
import OpenAI from 'openai';
import fetch from 'node-fetch';

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

// In-memory cache for search results
const searchCache = new Map();
const photoCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const PHOTO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Google Places API helper
const getPlacePhoto = async (placeName, city) => {
  const cacheKey = `${placeName}_${city}`.toLowerCase()
  
  // Check photo cache first
  const cached = photoCache.get(cacheKey)
  if (cached && (Date.now() - cached.timestamp) < PHOTO_CACHE_TTL) {
    return cached.photoUrl
  }
  
  try {
    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return `https://images.unsplash.com/search/photos?query=${encodeURIComponent(placeName + ' ' + city)}&w=400&h=300&fit=crop`
    }
    
    // Step 1: Find place
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(placeName + ' ' + city)}&inputtype=textquery&fields=place_id,photos&key=${process.env.GOOGLE_PLACES_API_KEY}`
    
    const searchResponse = await fetch(searchUrl)
    const searchData = await searchResponse.json()
    
    if (searchData.candidates && searchData.candidates[0] && searchData.candidates[0].photos) {
      const photoReference = searchData.candidates[0].photos[0].photo_reference
      
      // Step 2: Get photo URL with higher quality
      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${process.env.GOOGLE_PLACES_API_KEY}`
      
      // Cache the result
      photoCache.set(cacheKey, {
        photoUrl,
        timestamp: Date.now()
      })
      
      return photoUrl
    }
  } catch (error) {
    console.error('Google Places API error:', error)
  }
  
  // Enhanced fallback with multiple sources
  const fallbackSources = [
    `https://source.unsplash.com/800x600/?${encodeURIComponent(placeName)},${encodeURIComponent(city)},landmark`,
    `https://source.unsplash.com/800x600/?${encodeURIComponent(placeName)},travel,destination`,
    `https://picsum.photos/seed/${encodeURIComponent(placeName + city)}/800/600`
  ]
  
  return fallbackSources[0] // Return first fallback, frontend will handle others
}

// AI-powered places search
router.get('/places', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { q: query, category, limit = 8 } = req.query;
    
    // Validate input
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Search query is required' 
      });
    }

    if (!openai) {
      return res.status(500).json({ 
        success: false,
        error: 'Azure OpenAI service not configured' 
      });
    }

    // Check cache first
    const cacheKey = `${query.toLowerCase()}_${category || 'all'}_${limit}`;
    const cached = searchCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log('🎯 Returning cached results for:', query);
      return res.json({
        success: true,
        data: cached.data,
        cached: true,
        processingTime: `${Date.now() - startTime}ms`
      });
    }

    console.log('🤖 Processing AI search for:', query);

    // Construct intelligent prompt for Azure OpenAI
    const systemPrompt = `You are a travel expert AI that provides accurate, detailed information about places worldwide. 
Always return valid JSON format with real, helpful place recommendations.`;
    
    const userPrompt = `Find ${limit} real places for: "${query}"
${category ? `Focus on category: ${category}` : ''}

Return EXACTLY this JSON structure:
{
  "places": [
    {
      "id": "unique_place_id",
      "name": "Actual Place Name",
      "description": "Detailed 2-3 sentence description with key highlights",
      "category": "restaurant|attraction|hotel|shopping|cafe|museum|park",
      "rating": 4.5,
      "priceLevel": "$|$$|$$$|$$$$",
      "location": {
        "address": "Full address",
        "city": "City Name",
        "country": "Country Name",
        "coordinates": {
          "lat": 35.6762,
          "lng": 139.6503
        }
      },
      "highlights": ["feature1", "feature2", "feature3"],
      "image": "https://images.unsplash.com/photo-relevant?w=400&h=300&fit=crop",
      "contact": {
        "phone": "+country-area-number",
        "website": "https://website.com"
      },
      "openHours": "9:00 AM - 10:00 PM",
      "tags": ["popular", "authentic", "must-visit"]
    }
  ],
  "searchContext": "Brief context about the search area",
  "totalFound": ${limit}
}

IMPORTANT:
- Provide REAL places with accurate information
- Include diverse options (different areas, price ranges)
- Use actual coordinates for the locations
- Make descriptions engaging and informative
- Ensure all JSON is properly formatted`;

    // Call Azure OpenAI
    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000
    });
    
    const aiResponse = completion.choices[0].message.content;
    console.log('🔄 Raw AI Response length:', aiResponse.length);
    
    // Parse and validate AI response
    let parsedData;
    try {
      // Extract JSON from response (handle code blocks)
      let jsonText = aiResponse;
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonText = jsonMatch[1] || jsonMatch[0];
      }
      
      parsedData = JSON.parse(jsonText);
      
      // Validate structure
      if (!parsedData.places || !Array.isArray(parsedData.places)) {
        throw new Error('Invalid response structure');
      }
      
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError.message);
      console.error('Raw response:', aiResponse.substring(0, 500));
      
      return res.status(500).json({
        success: false,
        error: 'Failed to parse AI response',
        details: 'The AI returned invalid data format'
      });
    }

    // Enhance and validate places data with real photos
    const enhancedPlaces = await Promise.all(parsedData.places.map(async (place, index) => {
      const realPhoto = await getPlacePhoto(
        place.name || 'Unknown Place',
        place.location?.city || 'Unknown City'
      )
      
      return {
        id: place.id || `ai_place_${Date.now()}_${index}`,
        name: place.name || 'Unknown Place',
        description: place.description || 'No description available',
        category: place.category || 'general',
        rating: Math.min(5, Math.max(1, place.rating || 4.0)),
        priceLevel: place.priceLevel || '$$',
        location: {
          address: place.location?.address || 'Address not available',
          city: place.location?.city || 'Unknown City',
          country: place.location?.country || 'Unknown Country',
          coordinates: {
            lat: place.location?.coordinates?.lat || 0,
            lng: place.location?.coordinates?.lng || 0
          }
        },
        highlights: Array.isArray(place.highlights) ? place.highlights : ['Popular destination'],
        image: realPhoto,
        contact: {
          phone: place.contact?.phone || 'Not available',
          website: place.contact?.website || ''
        },
        openHours: place.openHours || 'Hours vary',
        tags: Array.isArray(place.tags) ? place.tags : ['recommended']
      }
    }));

    const finalResponse = {
      query: query.trim(),
      places: enhancedPlaces,
      searchContext: parsedData.searchContext || `Results for "${query}"`,
      totalFound: enhancedPlaces.length,
      filters: { category: category || 'all' }
    };

    // Cache the results
    searchCache.set(cacheKey, {
      data: finalResponse,
      timestamp: Date.now()
    });

    console.log(`✅ AI search completed: ${enhancedPlaces.length} places found`);
    
    res.json({
      success: true,
      data: finalResponse,
      cached: false,
      processingTime: `${Date.now() - startTime}ms`
    });
    
  } catch (error) {
    console.error('❌ Search error:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Search request failed',
      message: 'Unable to process your search. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      processingTime: `${Date.now() - startTime}ms`
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

// Search suggestions endpoint
router.get('/suggestions', async (req, res) => {
  try {
    const { q: query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({ suggestions: [] });
    }

    if (!openai) {
      return res.json({ suggestions: ['Tokyo', 'Paris', 'New York', 'London'] });
    }

    const prompt = `Suggest 5 travel destinations or place types for the query: "${query}"
Return only a simple JSON array: ["suggestion1", "suggestion2", "suggestion3", "suggestion4", "suggestion5"]`;

    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      max_tokens: 200
    });
    
    const response = completion.choices[0].message.content;
    const suggestions = JSON.parse(response.match(/\[.*\]/)[0]);
    
    res.json({ suggestions });
    
  } catch (error) {
    console.error('Suggestions error:', error);
    res.json({ suggestions: [] });
  }
});

export default router;