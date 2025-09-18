import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Generate text endpoint for trip planning
router.post('/generate-text', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('🤖 Gemini API request:', prompt.substring(0, 100) + '...');

    // Get Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini response:', text.substring(0, 200) + '...');

    // Try to extract JSON from response
    let jsonData = null;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonData = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('⚠️ JSON parsing failed:', e.message);
    }

    res.json({
      text: text,
      itinerary: jsonData,
      model: 'gemini-pro',
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    console.error('❌ Gemini AI error:', error);
    
    res.status(500).json({
      error: 'Failed to generate text',
      message: error.message,
      text: _getFallbackResponse()
    });
  }
});

function _getFallbackResponse() {
  return `{
  "activities": [
    {
      "name": "City Center Exploration",
      "type": "landmark",
      "startTime": "09:00",
      "endTime": "11:00",
      "description": "Explore the main attractions and historic sites in the city center.",
      "cost": "Free",
      "tips": ["Start early to avoid crowds", "Bring comfortable walking shoes"]
    },
    {
      "name": "Local Restaurant",
      "type": "restaurant", 
      "startTime": "12:30",
      "endTime": "14:00",
      "description": "Experience authentic local cuisine at a popular restaurant.",
      "cost": "$20-30",
      "tips": ["Try the local specialties", "Make a reservation"]
    },
    {
      "name": "Cultural Museum",
      "type": "museum",
      "startTime": "15:30", 
      "endTime": "17:00",
      "description": "Learn about local history and culture at the main museum.",
      "cost": "$12",
      "tips": ["Audio guide recommended", "Check for student discounts"]
    }
  ]
}`;
}

export default router;