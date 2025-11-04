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

// Hybrid search: AI semantic understanding + Real Google Places photos
router.get('/hybrid', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { q: query, limit = 2 } = req.query;
    
    if (!query?.trim()) {
      return res.status(400).json({ error: 'Query required' });
    }

    console.log('🔍 Hybrid Search:', query);

    // Step 1: Get AI semantic results
    let aiPlaces = [];
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
          messages: [{
            role: "user", 
            content: `Find ${limit} places for: "${query}". Return JSON: {"places":[{"id":"1","name":"Place Name","description":"Description","category":"restaurant","rating":4.5,"priceLevel":"$$","location":{"address":"Address","city":"City","country":"Country","coordinates":{"lat":0,"lng":0}},"highlights":["feature1"],"contact":{"phone":"","website":""},"openHours":"9 AM-6 PM","tags":["popular"]}]}`
          }],
          temperature: 0.7
        });
        
        const aiResponse = completion.choices[0].message.content;
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          aiPlaces = parsedData.places || [];
        }
      } catch (aiError) {
        console.error('AI failed:', aiError.message);
      }
    }

    // Step 2: Enhance with real Google Places photos
    const enhancedPlaces = await Promise.all(aiPlaces.map(async (place) => {
      try {
        const searchQuery = `${place.name} ${place.location?.city || ''}`;
        const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'OK' && data.results?.[0]?.photos?.[0]) {
          const photoRef = data.results[0].photos[0].photo_reference;
          const realPhotoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
          
          return {
            ...place,
            image: realPhotoUrl,
            realPhoto: true,
            googlePlaceId: data.results[0].place_id
          };
        }
      } catch (error) {
        console.warn(`Photo enhancement failed for ${place.name}`);
      }
      
      // Fallback to Unsplash
      return {
        ...place,
        image: `https://images.unsplash.com/search/photos?query=${encodeURIComponent(place.name)}&w=400&h=300&fit=crop`,
        realPhoto: false
      };
    }));

    const realPhotosCount = enhancedPlaces.filter(p => p.realPhoto).length;
    
    res.json({
      success: true,
      data: {
        query: query.trim(),
        places: enhancedPlaces,
        searchContext: `Hybrid AI + Real Photos (${realPhotosCount}/${enhancedPlaces.length} real photos)`,
        totalFound: enhancedPlaces.length,
        searchType: 'hybrid'
      },
      processingTime: `${Date.now() - startTime}ms`
    });
    
  } catch (error) {
    console.error('Hybrid search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;