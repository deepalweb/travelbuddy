import express from 'express';
import fetch from 'node-fetch';
import OpenAI from 'openai';

const router = express.Router();

// Initialize Azure OpenAI
const openai = process.env.AZURE_OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { 'api-version': '2024-02-15-preview' },
  defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY },
}) : null;

// Fetch places from Google Places API
async function fetchGooglePlaces(destination, interests) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error('Google Places API key required');

  const query = `tourist attractions museums temples historical sites in ${destination}`;
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status === 'OK') {
    return data.results.slice(0, 10); // Top 10 places
  }
  return [];
}

// Generate detailed trip plan using Google Places + AI
router.post('/generate-detailed', async (req, res) => {
  try {
    const { destination, duration, interests, pace, budget } = req.body;
    
    if (!destination || !duration) {
      return res.status(400).json({ error: 'Destination and duration are required' });
    }

    const days = parseInt(duration.match(/(\d+)/)?.[1] || '3');
    
    // Step 1: Get real places from Google Places API
    const googlePlaces = await fetchGooglePlaces(destination, interests);
    
    if (googlePlaces.length === 0) {
      return res.status(404).json({ error: 'No places found for this destination' });
    }

    // Step 2: AI enhances Google Places into detailed itinerary
    const placesData = googlePlaces.map(place => ({
      name: place.name,
      rating: place.rating,
      types: place.types,
      address: place.vicinity || place.formatted_address
    }));

    const prompt = `Create a detailed ${days}-day trip plan for ${destination}. Include these REAL places when possible:

${JSON.stringify(placesData, null, 2)}

Preferences:
- Interests: ${interests || 'general sightseeing'}
- Pace: ${pace || 'moderate'}
- Budget: ${budget || 'moderate'}

Return JSON with rich details:
{
  "tripTitle": "${destination} ${duration} Adventure",
  "destination": "${destination}",
  "duration": "${duration}",
  "introduction": "Rich introduction with emojis",
  "dailyPlans": [
    {
      "day": 1,
      "title": "Day title",
      "activities": [
        {
          "timeOfDay": "09:00-11:00",
          "activityTitle": "Activity name",
          "description": "Rich description with insider tips",
          "whyVisit": "Why this place is special",
          "bestTime": "Best time to visit",
          "duration": "Time needed",
          "cost": "Cost estimate",
          "insiderTip": "Local insider tip",
          "photoOps": ["photo opportunity 1", "photo opportunity 2"],
          "nearbyEats": ["restaurant 1", "restaurant 2"]
        }
      ]
    }
  ],
  "conclusion": "Inspiring conclusion"
}`;
    
    if (!openai) {
      throw new Error('AI service not available');
    }
    
    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 3000
    });
    
    const responseText = completion.choices[0].message.content;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    let tripPlan;
    if (jsonMatch) {
      tripPlan = JSON.parse(jsonMatch[0]);
      tripPlan.id = `detailed_${Date.now()}`;
      tripPlan.totalEstimatedCost = 'USD $45-65 per day';
      tripPlan.estimatedWalkingDistance = `${days * 3.2} km total`;
      tripPlan.createdAt = new Date().toISOString();
      tripPlan.updatedAt = new Date().toISOString();
      tripPlan.source = 'google_places_ai_enhanced';
      
      // Add images and coordinates to all activities
      let placeIndex = 0;
      tripPlan.dailyPlans.forEach((day, dayIndex) => {
        day.activities.forEach((activity, actIndex) => {
          // Always assign an image
          const imageQuery = encodeURIComponent(`${destination} travel tourism`);
          activity.image = `https://source.unsplash.com/800x600/?${imageQuery}&sig=${dayIndex}${actIndex}`;
          activity.rating = 4.5;
          
          // Try to match with Google Places for coordinates
          const googlePlace = googlePlaces[placeIndex % googlePlaces.length];
          if (googlePlace?.geometry?.location) {
            activity.coordinates = {
              lat: googlePlace.geometry.location.lat,
              lng: googlePlace.geometry.location.lng
            };
            activity.placeId = googlePlace.place_id;
          }
          placeIndex++;
        });
      });
    } else {
      throw new Error('No valid JSON in AI response');
    }

    res.json({ tripPlan });
  } catch (error) {
    console.error('Detailed trip generation error:', error);
    res.status(500).json({ error: 'Failed to generate detailed trip plan' });
  }
});

export default router;