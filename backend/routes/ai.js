import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Azure OpenAI Configuration
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const AZURE_API_VERSION = '2024-02-01';

// Test Azure OpenAI configuration
router.get('/test-config', (req, res) => {
  res.json({
    hasEndpoint: !!AZURE_OPENAI_ENDPOINT,
    hasApiKey: !!AZURE_OPENAI_API_KEY,
    hasDeploymentName: !!AZURE_OPENAI_DEPLOYMENT_NAME,
    endpointPreview: AZURE_OPENAI_ENDPOINT ? AZURE_OPENAI_ENDPOINT.substring(0, 30) + '...' : 'Not set',
    apiKeyLength: AZURE_OPENAI_API_KEY?.length || 0,
    deploymentName: AZURE_OPENAI_DEPLOYMENT_NAME || 'Not set',
    apiVersion: AZURE_API_VERSION
  });
});

// Generate trip plan endpoint
router.post('/generate-trip-plan', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { destination, duration, interests, pace, travelStyles, budget } = req.body;
    
    if (!destination || !duration) {
      return res.status(400).json({ error: 'Destination and duration are required' });
    }

    const prompt = `Create a detailed trip plan for ${destination} (${duration}) with rich local insights.

User preferences:
- Interests: ${interests || 'general sightseeing'}
- Pace: ${pace || 'Moderate'}
- Travel styles: ${Array.isArray(travelStyles) ? travelStyles.join(', ') : 'Cultural'}
- Budget: ${budget || 'Mid-Range'}

Return JSON with this structure:
{
  "tripTitle": "Creative title with theme: Duration in Destination",
  "destination": "${destination}",
  "duration": "${duration}",
  "introduction": "Engaging 2-3 sentence introduction",
  "dailyPlans": [
    {
      "day": 1,
      "title": "Day 1: Descriptive theme",
      "theme": "Daily theme like 'Historic Charm & Local Flavors'",
      "activities": [
        {
          "timeOfDay": "Morning (2-3 hours)",
          "activityTitle": "Specific activity with location",
          "description": "Rich description with practical tips, transport info, costs, timing advice. Include emojis for transport 🚗, costs 💰, timing ⏰. Format: Main description. 🚗 Transport: Details 💰 Cost: Amount 🏛️ Best Time: When | Avoid: When not to go.",
          "estimatedDuration": "2-3 hours",
          "icon": "🏛️",
          "category": "Sightseeing",
          "effortLevel": "Easy"
        }
      ]
    }
  ],
  "conclusion": "Warm closing message"
}`;

    console.log('🗺️ Generating trip plan for:', destination, duration);

    const response = await fetch(
      `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=${AZURE_API_VERSION}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_OPENAI_API_KEY,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are an expert travel planner. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.8
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Azure AI API failed: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    
    let tripPlan;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        tripPlan = JSON.parse(jsonMatch[0]);
        tripPlan.id = `plan_${Date.now()}`;
        tripPlan.createdAt = new Date().toISOString();
        tripPlan.updatedAt = new Date().toISOString();
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (e) {
      console.warn('⚠️ JSON parsing failed, using fallback');
      tripPlan = _getFallbackTripPlan(destination, duration);
    }

    console.log('✅ Trip plan generated:', tripPlan.tripTitle);
    res.json(tripPlan);

  } catch (error) {
    console.error('❌ Trip plan generation error:', error);
    
    res.json(_getFallbackTripPlan(
      req.body.destination || 'Your Destination',
      req.body.duration || '3 days'
    ));
  }
});

// Generate text endpoint for trip planning
router.post('/generate-text', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('🤖 Azure AI request:', prompt.substring(0, 100) + '...');

    // Call Azure OpenAI
    const response = await fetch(
      `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=${AZURE_API_VERSION}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_OPENAI_API_KEY,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a travel planning expert. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7,
          top_p: 0.95,
          frequency_penalty: 0,
          presence_penalty: 0
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Azure AI API failed: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    
    console.log('✅ Azure AI response:', text.substring(0, 200) + '...');

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
      model: 'azure-gpt-4.1',
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    console.error('❌ Azure AI error:', error);
    
    res.status(500).json({
      error: 'Failed to generate text',
      message: error.message,
      text: _getFallbackResponse()
    });
  }
});

function _getFallbackTripPlan(destination, duration) {
  return {
    id: `fallback_${Date.now()}`,
    tripTitle: `Essential ${duration} in ${destination}`,
    destination,
    duration,
    introduction: `Discover the must-see highlights of ${destination} with this essential itinerary`,
    dailyPlans: [{
      day: 1,
      title: 'Day 1: City Highlights',
      theme: 'Essential Sights & Local Culture',
      activities: [{
        timeOfDay: 'Morning (3-4 hours)',
        activityTitle: 'Historic City Center Exploration',
        description: `Start your ${destination} adventure by exploring the historic city center. Walk through the main squares, admire the architecture, and soak in the local atmosphere. 🚗 Transport: Walking or local transport 💰 Cost: Free-$10 ⏰ Best Time: 9:00 AM - 12:00 PM | Avoid: Midday heat in summer`,
        estimatedDuration: '3-4 hours',
        icon: '🏛️',
        category: 'Sightseeing',
        effortLevel: 'Easy'
      }]
    }],
    conclusion: `Enjoy your memorable time exploring ${destination}!`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

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