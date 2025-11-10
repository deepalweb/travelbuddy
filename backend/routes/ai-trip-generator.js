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

// Step 1: Get real places from Google Places API based on user interests
async function fetchPlacesFromGoogle(destination, interests, budget, duration) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error('Google Places API key required');

  // Build search queries based on interests
  const searchQueries = buildSearchQueries(destination, interests, budget);
  const allPlaces = [];

  for (const query of searchQueries) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results) {
        allPlaces.push(...data.results.slice(0, 5)); // Top 5 per category
      }
    } catch (error) {
      console.warn(`Failed to fetch places for query: ${query}`, error);
    }
  }

  // Remove duplicates and limit based on duration
  const uniquePlaces = removeDuplicates(allPlaces);
  const days = parseInt(duration.match(/(\d+)/)?.[1] || '3');
  return uniquePlaces.slice(0, days * 4); // 4 places per day max
}

// Step 2: Build search queries based on user interests
function buildSearchQueries(destination, interests, budget) {
  const baseQueries = [`tourist attractions in ${destination}`];
  
  const interestQueries = {
    culture: [`museums in ${destination}`, `temples in ${destination}`, `historical sites in ${destination}`],
    food: [`restaurants in ${destination}`, `local food in ${destination}`, `street food in ${destination}`],
    nature: [`parks in ${destination}`, `nature reserves in ${destination}`, `gardens in ${destination}`],
    adventure: [`adventure activities in ${destination}`, `outdoor sports in ${destination}`],
    photography: [`scenic viewpoints in ${destination}`, `photography spots in ${destination}`],
    beaches: [`beaches in ${destination}`, `coastal attractions in ${destination}`],
    nightlife: [`bars in ${destination}`, `nightlife in ${destination}`],
    wellness: [`spas in ${destination}`, `wellness centers in ${destination}`]
  };

  // Add interest-based queries
  interests.forEach(interest => {
    if (interestQueries[interest]) {
      baseQueries.push(...interestQueries[interest]);
    }
  });

  // Add budget-specific queries
  if (budget === 'low') {
    baseQueries.push(`free attractions in ${destination}`, `budget activities in ${destination}`);
  } else if (budget === 'high') {
    baseQueries.push(`luxury experiences in ${destination}`, `premium attractions in ${destination}`);
  }

  return baseQueries;
}

// Step 3: Remove duplicate places
function removeDuplicates(places) {
  const seen = new Set();
  return places.filter(place => {
    const key = place.place_id || place.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Step 4: AI enhances Google Places data into complete itinerary
async function enhanceWithAI(googlePlaces, userPreferences) {
  if (!openai) throw new Error('AI service not available');

  const { destination, duration, travelStyle, budget, interests } = userPreferences;
  const days = parseInt(duration.match(/(\d+)/)?.[1] || '3');

  const placesData = googlePlaces.map(place => ({
    name: place.name,
    rating: place.rating,
    types: place.types,
    address: place.vicinity || place.formatted_address,
    priceLevel: place.price_level
  }));

  const prompt = `Create a ${days}-day optimized itinerary for ${destination} using these REAL places from Google:

${JSON.stringify(placesData, null, 2)}

User Preferences:
- Travel Style: ${travelStyle}
- Budget: ${budget}
- Interests: ${interests.join(', ')}
- Duration: ${duration}

Requirements:
1. Use ONLY the provided places
2. Organize by days with logical geographic grouping
3. Add timing, insider tips, and detailed descriptions
4. Include travel time between places
5. Suggest nearby restaurants and transport

Return JSON:
{
  "tripTitle": "${destination} ${duration} Adventure",
  "destination": "${destination}",
  "duration": "${duration}",
  "totalEstimatedCost": "Budget estimate",
  "dailyPlans": [
    {
      "day": 1,
      "title": "Day title",
      "activities": [
        {
          "timeOfDay": "09:00-11:00",
          "placeName": "Exact place name from list",
          "placeId": "Google place_id if available",
          "description": "Rich description with why visit",
          "insiderTip": "Local tip",
          "estimatedCost": "Cost estimate",
          "duration": "Time needed",
          "travelFromPrevious": "Travel time/method",
          "nearbyFood": "Restaurant suggestions",
          "bestTimeToVisit": "Optimal timing",
          "photoOpportunities": ["photo tip 1", "photo tip 2"]
        }
      ],
      "dayBudget": "Daily cost estimate",
      "totalWalkingTime": "Walking time",
      "dayHighlights": ["highlight 1", "highlight 2"]
    }
  ],
  "travelTips": ["tip 1", "tip 2", "tip 3"],
  "budgetBreakdown": {
    "accommodation": "Cost range",
    "food": "Cost range", 
    "activities": "Cost range",
    "transport": "Cost range"
  }
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 3000
    });

    const responseText = completion.choices[0].message.content;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const aiItinerary = JSON.parse(jsonMatch[0]);
      
      // Merge Google Places data with AI itinerary
      return mergeGoogleDataWithAI(googlePlaces, aiItinerary);
    } else {
      throw new Error('No valid JSON in AI response');
    }
  } catch (error) {
    console.error('AI enhancement failed:', error);
    throw error;
  }
}

// Step 5: Merge Google Places real data with AI itinerary
function mergeGoogleDataWithAI(googlePlaces, aiItinerary) {
  const placeMap = new Map();
  googlePlaces.forEach(place => {
    placeMap.set(place.name.toLowerCase(), place);
  });

  // Enhance AI itinerary with real Google data
  aiItinerary.dailyPlans.forEach(day => {
    day.activities.forEach(activity => {
      const googlePlace = placeMap.get(activity.placeName.toLowerCase());
      if (googlePlace) {
        activity.googleData = {
          placeId: googlePlace.place_id,
          rating: googlePlace.rating,
          userRatingsTotal: googlePlace.user_ratings_total,
          priceLevel: googlePlace.price_level,
          openingHours: googlePlace.opening_hours,
          photos: googlePlace.photos,
          geometry: googlePlace.geometry,
          types: googlePlace.types
        };
        
        // Add real photo URL
        if (googlePlace.photos && googlePlace.photos[0]) {
          activity.image = `/api/places/photo?ref=${googlePlace.photos[0].photo_reference}&w=800`;
        }
      }
    });
  });

  // Add metadata
  aiItinerary.id = `ai_trip_${Date.now()}`;
  aiItinerary.createdAt = new Date().toISOString();
  aiItinerary.source = 'google_places_ai_enhanced';
  
  return aiItinerary;
}

// Main endpoint: Generate AI trip using Google Places + AI
router.post('/generate', async (req, res) => {
  try {
    const { 
      destination, 
      duration, 
      travelers, 
      budget, 
      travelStyle, 
      interests, 
      selectedPlaces = [] 
    } = req.body;

    if (!destination || !duration) {
      return res.status(400).json({ error: 'Destination and duration are required' });
    }

    console.log(`🚀 Generating AI trip for ${destination}, ${duration}`);

    // Step 1: Get real places from Google Places API
    console.log('📍 Step 1: Fetching places from Google Places API...');
    let googlePlaces = [];
    
    if (selectedPlaces.length > 0) {
      // Use selected places from Discovery page
      googlePlaces = selectedPlaces;
      console.log(`✅ Using ${selectedPlaces.length} pre-selected places`);
    } else {
      // Fetch new places based on interests
      googlePlaces = await fetchPlacesFromGoogle(destination, interests, budget, duration);
      console.log(`✅ Found ${googlePlaces.length} places from Google`);
    }

    if (googlePlaces.length === 0) {
      return res.status(404).json({ error: 'No places found for this destination' });
    }

    // Step 2: AI enhances places into complete itinerary
    console.log('🤖 Step 2: AI enhancing places into itinerary...');
    const enhancedItinerary = await enhanceWithAI(googlePlaces, {
      destination,
      duration,
      travelStyle,
      budget,
      interests
    });

    console.log('✅ AI trip generation completed');

    res.json(enhancedItinerary);

  } catch (error) {
    console.error('❌ AI trip generation failed:', error);
    res.status(500).json({
      error: 'Failed to generate AI trip',
      message: error.message
    });
  }
});

export default router;