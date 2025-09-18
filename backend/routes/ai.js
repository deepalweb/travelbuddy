import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Generate structured itinerary endpoint
router.post('/generate-text', async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      prompt,
      maxTokens = 1500,
      temperature = 0.7,
      travelStyle = 'Relaxed',        // optional
      budgetTier = 'Premium',         // optional
      dietaryPreferences = [],        // e.g., ['Vegetarian', 'Gluten-Free']
      accessibility = false,          // optional
      location = null                 // optional fallback for AI context
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Get Gemini model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Construct enhanced prompt for structured JSON
    const enhancedPrompt = `
Generate a 1-day itinerary in JSON format for the following user request:
Prompt: "${prompt}"
Preferences: travelStyle="${travelStyle}", budgetTier="${budgetTier}", dietaryPreferences=${JSON.stringify(dietaryPreferences)}, accessibility=${accessibility}, location="${location}"

Each activity should include the following fields:
- name
- type (landmark, restaurant, museum, park, viewpoint, other)
- startTime, endTime
- description
- cost
- costCategory (Budget, Mid-range, Premium)
- crowdLevel (Low, Moderate, High)
- weatherNote
- coordinates { lat, lng }
- imageURL
- tips (array of strings)
- badgeEarned (optional, e.g., "Foodie", "Explorer")
Also include:
- totalCost
- estimatedWalkingDistance
- recommendationLevel
Return valid JSON only without extra text.
`;

    // Generate content
    const result = await model.generateContent({
      prompt: enhancedPrompt,
      maxOutputTokens: maxTokens,
      temperature
    });

    const response = await result.response;
    const text = response.text();

    // Parse JSON safely
    let itineraryJSON;
    try {
      itineraryJSON = JSON.parse(text);
    } catch (parseError) {
      console.warn('❌ Failed to parse AI JSON, using fallback', parseError);
      itineraryJSON = _getFallbackResponse(prompt, travelStyle, budgetTier, location);
    }

    res.json({
      itinerary: itineraryJSON,
      usage: {
        promptTokens: prompt.length,
        completionTokens: text.length,
        totalTokens: prompt.length + text.length
      },
      model: 'gemini-pro',
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    console.error('❌ Gemini AI error:', error);
    res.status(500).json({
      error: 'Failed to generate itinerary',
      message: error.message,
      fallback: _getFallbackResponse(req.body.prompt, req.body.travelStyle, req.body.budgetTier, req.body.location)
    });
  }
});

// Friendly fallback response
function _getFallbackResponse(prompt, travelStyle = 'Relaxed', budgetTier = 'Premium', location = 'your city') {
  return {
    message: "We're having trouble generating a personalized itinerary at the moment. Please try again in a few minutes or adjust your preferences.",
    suggestion: "Meanwhile, you can explore popular landmarks and restaurants manually or check out our sample itineraries.",
    exampleItinerary: [
      {
        name: 'City Center Walk',
        type: 'landmark',
        startTime: '09:00',
        endTime: '11:00',
        description: `Explore the main attractions in ${location}. Perfect for a ${travelStyle.toLowerCase()} start to the day.`,
        cost: 'Free',
        costCategory: 'Budget',
        crowdLevel: 'Low',
        weatherNote: 'Sunny weather recommended',
        coordinates: { lat: 0, lng: 0 },
        imageURL: 'https://via.placeholder.com/150',
        tips: ['Start early to avoid crowds'],
        badgeEarned: null
      },
      {
        name: 'Local Restaurant',
        type: 'restaurant',
        startTime: '12:30',
        endTime: '14:00',
        description: `Enjoy a typical ${location} meal. Options available for ${dietaryPreferences.join(', ') || 'all diets'}.`,
        cost: '$15-25',
        costCategory: 'Mid-range',
        crowdLevel: 'Moderate',
        weatherNote: 'Indoor dining available',
        coordinates: { lat: 0, lng: 0 },
        imageURL: 'https://via.placeholder.com/150',
        tips: ['Try local specialties'],
        badgeEarned: 'Foodie'
      },
      {
        name: 'Cultural Museum',
        type: 'museum',
        startTime: '15:30',
        endTime: '17:00',
        description: 'Learn about local history and culture.',
        cost: '$10',
        costCategory: 'Budget',
        crowdLevel: 'Low',
        weatherNote: 'Perfect indoor activity',
        coordinates: { lat: 0, lng: 0 },
        imageURL: 'https://via.placeholder.com/150',
        tips: ['Audio guide recommended'],
        badgeEarned: 'Explorer'
      }
    ]
  };
}

export default router;
