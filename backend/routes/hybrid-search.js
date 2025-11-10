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

// Step 1: Extract intent from natural language query
async function extractQueryIntent(query) {
  if (!openai) throw new Error('Azure OpenAI not configured');
  
  const prompt = `Extract travel search intent from: "${query}"
Return JSON only:
{
  "intent": "brief description of what user wants",
  "categories": ["restaurant", "attraction", "hotel", etc],
  "location": "detected location or null",
  "filters": {"price_level": "budget/mid/luxury", "atmosphere": "romantic/family/adventure"},
  "keywords": ["keyword1", "keyword2"]
}`;

  const completion = await openai.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 300
  });

  return JSON.parse(completion.choices[0].message.content);
}

// Step 2: Generate places with AI (primary method)
async function generatePlacesWithAI(query, intent) {
  if (!openai) throw new Error('Azure OpenAI not configured');
  
  const prompt = `Generate 10 authentic travel destinations for: "${query}"
Return JSON array with realistic places:
[{
  "name": "Place Name",
  "location": "City, Country", 
  "rating": 4.2,
  "category": "restaurant/attraction/hotel/etc",
  "description": "Brief description",
  "highlights": ["feature1", "feature2", "feature3"],
  "priceLevel": "$" or "$$" or "$$$",
  "bestTime": "Best time to visit",
  "insiderTip": "Local tip",
  "coordinates": {"lat": 0.0, "lng": 0.0}
}]`;

  const completion = await openai.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    max_tokens: 2000
  });

  const content = completion.choices[0].message.content;
  // Handle markdown code blocks
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\[[\s\S]*\]/);
  const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
  return JSON.parse(jsonStr);
}

// Step 3: Validate top places with Google (cost-optimized)
async function validateTopPlaces(aiPlaces) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return aiPlaces;

  // Only validate top 3 places to minimize API costs
  const topPlaces = aiPlaces.slice(0, 3);
  
  for (const place of topPlaces) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(place.name + ' ' + place.location)}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.results?.[0]) {
        const googlePlace = data.results[0];
        place.googleVerified = true;
        place.googleRating = googlePlace.rating;
        place.googleId = googlePlace.place_id;
        place.realAddress = googlePlace.formatted_address;
        
        // Add real Google Photos
        if (googlePlace.photos?.[0]) {
          place.realPhoto = `/api/places/photo?ref=${googlePlace.photos[0].photo_reference}&w=800`;
        }
      }
    } catch (error) {
      console.warn(`Google validation failed for ${place.name}`);
      place.googleVerified = false;
    }
  }
  
  return aiPlaces;
}

// Step 4: Format AI places for frontend
function formatAIPlaces(aiPlaces) {
  return aiPlaces.map((place, index) => ({
    id: place.googleId || `ai_${index}`,
    name: place.name,
    description: place.description,
    category: place.category,
    rating: place.googleRating || place.rating,
    priceLevel: place.priceLevel,
    location: {
      address: place.realAddress || place.location,
      city: place.location.split(',')[0]?.trim() || '',
      country: place.location.split(',')[1]?.trim() || '',
      coordinates: place.coordinates
    },
    image: place.realPhoto || `https://source.unsplash.com/800x600/?${encodeURIComponent(place.name)},${encodeURIComponent(place.category)}`,
    highlights: place.highlights,
    bestTime: place.bestTime,
    insiderTip: place.insiderTip,
    aiGenerated: !place.googleVerified,
    googleVerified: place.googleVerified || false
  }));
}

// Step 4: AI-powered ranking and enhancement
async function rankAndEnhanceResults(places, originalQuery, intent) {
  if (!openai) return places;

  const prompt = `You are a travel expert. Given the user query: "${originalQuery}"
And these places: ${JSON.stringify(places.map(p => ({name: p.name, category: p.category, rating: p.rating, location: p.location.city})))}

Rank them by relevance and add AI insights. Return JSON array:
[{
  "place_id": "original_id",
  "relevance_score": 0.95,
  "ai_summary": "Why this place fits the query",
  "best_time": "When to visit",
  "insider_tip": "Local insight"
}]`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1500
    });

    const aiEnhancements = JSON.parse(completion.choices[0].message.content);
    
    // Merge AI insights with place data
    return places.map(place => {
      const aiData = aiEnhancements.find(ai => ai.place_id === place.id) || {};
      return {
        ...place,
        relevanceScore: aiData.relevance_score || 0.5,
        aiSummary: aiData.ai_summary || '',
        bestTime: aiData.best_time || '',
        insiderTip: aiData.insider_tip || ''
      };
    }).sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

  } catch (error) {
    console.warn('AI enhancement failed:', error.message);
    return places;
  }
}

// Main hybrid search endpoint
router.get('/search', async (req, res) => {
  try {
    const { q: query, lat, lng, limit = 10 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter required' });
    }

    console.log(`🔍 Hybrid search: "${query}"`);

    // Step 1: Extract intent with Azure OpenAI
    const intent = await extractQueryIntent(query);
    console.log('🧠 Intent extracted:', intent);

    // Step 2: Generate places with AI (primary method)
    const aiPlaces = await generatePlacesWithAI(query, intent);
    console.log(`🤖 AI generated places: ${aiPlaces.length}`);

    // Step 3: Validate only top 3 places with Google (cost optimization)
    const validatedPlaces = await validateTopPlaces(aiPlaces);
    console.log(`✅ Google validation calls: 3 (cost optimized)`);

    // Step 4: Format for frontend
    const finalResults = formatAIPlaces(validatedPlaces);
    console.log(`🎯 Final results: ${finalResults.length}`);

    res.json({
      success: true,
      query: query,
      intent: intent,
      results: finalResults.slice(0, parseInt(limit)),
      total: finalResults.length,
      source: 'hybrid_ai_google'
    });

  } catch (error) {
    console.error('❌ Hybrid search error:', error);
    res.status(500).json({
      error: 'Hybrid search failed',
      message: error.message
    });
  }
});

export default router;