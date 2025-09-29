import express from 'express';

const router = express.Router();

// Azure OpenAI Configuration
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const AZURE_API_VERSION = '2025-01-01-preview';

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