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

// Generate enhanced trip overview endpoint
router.post('/enhance-trip-overview', async (req, res) => {
  try {
    const { destination, duration, introduction, tripTitle } = req.body;
    
    if (!destination || !introduction) {
      return res.status(400).json({ error: 'Destination and introduction are required' });
    }

    const prompt = `Enhance this trip overview for ${destination} (${duration}):

Original: "${introduction}"

Create an enhanced, engaging overview with:
- Rich cultural insights
- Local tips and customs
- Best time to visit highlights
- What makes this destination special
- Practical travel advice

Format with markdown-style formatting:
🌟 **${tripTitle}** 🌟

💡 **Cultural Highlights:**
• Key cultural points

💡 **Local Insights:**
• Insider tips

💡 **Travel Tips:**
• Practical advice

Keep it engaging and informative, around 200-300 words.`;

    console.log('✨ Enhancing trip overview for:', destination);

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
              content: 'You are a travel expert who creates engaging, informative trip overviews with cultural insights and practical tips.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 800,
          temperature: 0.7
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Azure AI API failed: ${response.status}`);
    }

    const data = await response.json();
    const enhancedText = data.choices[0].message.content;
    
    console.log('✅ Enhanced trip overview generated');
    
    res.json({
      enhancedOverview: enhancedText,
      destination,
      duration,
      processingTime: Date.now() - Date.now()
    });

  } catch (error) {
    console.error('❌ Enhanced overview error:', error);
    
    res.json({
      enhancedOverview: _getFallbackEnhancedOverview(req.body.destination, req.body.duration, req.body.tripTitle),
      destination: req.body.destination,
      duration: req.body.duration
    });
  }
});

function _getFallbackEnhancedOverview(destination, duration, tripTitle) {
  return `🌟 **${tripTitle || `Amazing ${duration} in ${destination}`}** 🌟

${destination} offers an incredible blend of experiences that will create lasting memories. This carefully crafted ${duration} itinerary takes you through the heart of what makes this destination truly special.

💡 **Cultural Highlights:**
• Immerse yourself in the local culture and traditions
• Discover historical landmarks and architectural wonders
• Experience authentic local cuisine and flavors

💡 **Local Insights:**
• Best times to visit popular attractions to avoid crowds
• Hidden gems known only to locals
• Cultural etiquette and customs to enhance your experience

💡 **Travel Tips:**
• Comfortable walking shoes recommended for exploration
• Local currency and payment methods
• Weather considerations for your travel dates

Get ready for an unforgettable journey through ${destination}!`;
}

// Generate place content endpoint
router.post('/generate-place-content', async (req, res) => {
  try {
    const { placeName, placeType, address, description, rating } = req.body;
    
    if (!placeName) {
      return res.status(400).json({ error: 'Place name is required' });
    }

    const prompt = `Generate detailed content for this place: ${placeName}

Place Information:
- Type: ${placeType || 'Unknown'}
- Address: ${address || 'Unknown'}
- Description: ${description || 'No description available'}
- Rating: ${rating || 'N/A'}

Return JSON with this structure:
{
  "overview": "Comprehensive 3-4 sentence overview of the place, its significance, and what makes it special",
  "highlights": [
    "Key feature or attraction 1",
    "Key feature or attraction 2",
    "Key feature or attraction 3",
    "Key feature or attraction 4"
  ],
  "insiderTips": [
    "Local tip or secret about the place",
    "Best time to visit or avoid crowds",
    "Photography or experience tip",
    "Money-saving or practical tip"
  ],
  "bestTimeToVisit": "Detailed advice on optimal timing (season, day, hour)",
  "duration": "Recommended time to spend (e.g., '2-3 hours', 'Half day', 'Full day')",
  "cost": "Estimated cost range with currency (e.g., 'Free', '$10-15', '€20-30')"
}`;

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
              content: 'You are a travel content expert. Always respond with valid JSON only. Provide detailed, accurate, and engaging information about places.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.8
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Azure AI API failed: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    
    let placeContent;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        placeContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (e) {
      console.warn('⚠️ JSON parsing failed, using fallback');
      placeContent = _getFallbackPlaceContent(placeName, placeType);
    }

    res.json(placeContent);

  } catch (error) {
    console.error('❌ Place content generation error:', error);
    res.json(_getFallbackPlaceContent(
      req.body.placeName || 'Unknown Place',
      req.body.placeType || 'attraction'
    ));
  }
});

function _getFallbackPlaceContent(placeName, placeType) {
  return {
    overview: `${placeName} is a notable ${placeType} that offers visitors a unique experience. This destination combines local culture with memorable attractions, making it a worthwhile stop for travelers. The location provides opportunities for exploration and discovery in a welcoming environment.`,
    highlights: [
      "Unique architectural or natural features",
      "Rich cultural and historical significance",
      "Great photo opportunities",
      "Authentic local atmosphere"
    ],
    insiderTips: [
      "Visit during off-peak hours for a more peaceful experience",
      "Bring a camera to capture the unique features",
      "Ask locals for their favorite spots nearby",
      "Check opening hours before visiting"
    ],
    bestTimeToVisit: "Early morning or late afternoon for the best experience and lighting",
    duration: "2-3 hours",
    cost: "Varies - check current pricing"
  };
}

// Ask AI about specific places endpoint
router.post('/ask', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { question, place } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const prompt = `You are a travel expert. Answer this question about the place: "${question}"

Place Information:
- Name: ${place?.name || 'Unknown'}
- Type: ${place?.type || 'Unknown'}
- Address: ${place?.address || 'Unknown'}
- Description: ${place?.description || 'No description available'}

Provide a helpful, accurate response in 2-3 sentences.`;

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
              content: 'You are a helpful travel assistant. Provide concise, accurate information about places.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.7
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Azure AI API failed: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;
    
    res.json({ answer });

  } catch (error) {
    console.error('❌ AI ask error:', error);
    res.status(500).json({
      error: 'Failed to get AI response',
      answer: 'I\'m sorry, I\'m having trouble connecting right now. Please try again later.'
    });
  }
});

// Safety content generation endpoint
router.post('/safety-content', async (req, res) => {
  try {
    const { location, latitude, longitude, contentType = 'general' } = req.body;
    
    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }

    const prompt = `Generate comprehensive safety information for ${location} (${latitude}, ${longitude}).

Return JSON with this structure:
{
  "emergencyTips": [
    "Specific emergency tip with local context"
  ],
  "culturalTips": [
    "Cultural safety awareness tip"
  ],
  "transportSafety": [
    "Safe transportation advice"
  ],
  "medicalInfo": {
    "hospitals": "Info about nearby hospitals",
    "pharmacies": "Pharmacy locations and hours",
    "insurance": "Travel insurance advice"
  },
  "scamAwareness": [
    "Common scam and how to avoid it"
  ],
  "emergencyContacts": {
    "police": "Local police number",
    "ambulance": "Ambulance number",
    "fire": "Fire department number",
    "tourist_police": "Tourist police if available"
  }
}`;

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
              content: 'You are a travel safety expert. Always respond with valid JSON only. Provide accurate, location-specific safety information.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Azure AI API failed: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    
    let safetyContent;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        safetyContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (e) {
      console.warn('⚠️ JSON parsing failed, using fallback');
      safetyContent = _getFallbackSafetyContent(location);
    }

    res.json(safetyContent);

  } catch (error) {
    console.error('❌ Safety content generation error:', error);
    res.json(_getFallbackSafetyContent(req.body.location || 'Unknown Location'));
  }
});

function _getFallbackSafetyContent(location) {
  return {
    emergencyTips: [
      "Keep emergency contacts saved in your phone",
      "Share your location with trusted contacts",
      "Keep copies of important documents"
    ],
    culturalTips: [
      "Research local customs and dress codes",
      "Learn basic phrases in the local language",
      "Respect religious and cultural sites"
    ],
    transportSafety: [
      "Use official taxi services or ride-sharing apps",
      "Avoid traveling alone at night",
      "Keep valuables secure while using public transport"
    ],
    medicalInfo: {
      hospitals: "Contact local emergency services for hospital information",
      pharmacies: "Look for pharmacy signs or ask at your hotel",
      insurance: "Ensure you have valid travel insurance coverage"
    },
    scamAwareness: [
      "Be cautious of overly friendly strangers",
      "Verify prices before purchasing",
      "Don't give personal information to unknown people"
    ],
    emergencyContacts: {
      police: "112",
      ambulance: "112",
      fire: "112",
      tourist_police: "Contact local tourist information"
    }
  };
}

// Translation endpoint using Azure OpenAI
router.post('/translate', async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage = 'en' } = req.body;
    
    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'Text and target language are required' });
    }

    const prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}. Return only the translation, no explanations:

"${text}"`;

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
              content: 'You are a professional translator. Provide accurate translations without explanations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.3
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Azure AI API failed: ${response.status}`);
    }

    const data = await response.json();
    const translation = data.choices[0].message.content.trim();
    
    res.json({ translation });

  } catch (error) {
    console.error('❌ Translation error:', error);
    res.status(500).json({
      error: 'Translation failed',
      translation: req.body.text // Return original text as fallback
    });
  }
});

// Travel phrases endpoint using Azure OpenAI
router.get('/travel-phrases/:language', async (req, res) => {
  try {
    const { language } = req.params;
    const { category } = req.query;
    
    const prompt = `Generate 10 essential travel phrases in ${language} for category: ${category || 'general'}.

Return JSON array with this structure:
[
  {
    "id": "unique_id",
    "category": "${category || 'general'}",
    "english": "English phrase",
    "translation": "Translation in ${language}",
    "pronunciation": "Phonetic pronunciation guide"
  }
]`;

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
              content: 'You are a language expert. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.7
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Azure AI API failed: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    
    let phrases;
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        phrases = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (e) {
      phrases = _getFallbackPhrases(language, category);
    }
    
    res.json({ phrases });

  } catch (error) {
    console.error('❌ Travel phrases error:', error);
    res.json({ phrases: _getFallbackPhrases(req.params.language, req.query.category) });
  }
});

// Location language detection
router.get('/location-language', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    // Simple location-to-language mapping
    const locationLanguages = {
      'FR': 'fr', 'ES': 'es', 'DE': 'de', 'IT': 'it', 'PT': 'pt',
      'JP': 'ja', 'KR': 'ko', 'CN': 'zh', 'SA': 'ar', 'RU': 'ru'
    };
    
    // Mock location detection based on coordinates
    let detectedLanguage = 'en';
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      // Europe
      if (latitude > 35 && latitude < 70 && longitude > -10 && longitude < 40) {
        if (longitude > 2 && longitude < 8) detectedLanguage = 'fr'; // France
        else if (longitude > -10 && longitude < 2) detectedLanguage = 'es'; // Spain
        else if (longitude > 8 && longitude < 15) detectedLanguage = 'de'; // Germany
        else if (longitude > 6 && longitude < 18) detectedLanguage = 'it'; // Italy
      }
      // Asia
      else if (latitude > 20 && latitude < 50 && longitude > 100 && longitude < 150) {
        if (longitude > 128 && longitude < 146) detectedLanguage = 'ja'; // Japan
        else if (longitude > 124 && longitude < 132) detectedLanguage = 'ko'; // Korea
        else if (longitude > 100 && longitude < 125) detectedLanguage = 'zh'; // China
      }
    }
    
    res.json({
      primaryLanguage: detectedLanguage,
      country: 'Unknown',
      confidence: 0.8
    });

  } catch (error) {
    console.error('❌ Location language error:', error);
    res.json({ primaryLanguage: 'en', country: 'Unknown', confidence: 0.5 });
  }
});

function _getFallbackPhrases(language, category) {
  return [
    {
      id: `help_${language}`,
      category: category || 'emergency',
      english: 'Help!',
      translation: 'Help!',
      pronunciation: 'help'
    },
    {
      id: `thanks_${language}`,
      category: category || 'basic',
      english: 'Thank you',
      translation: 'Thank you',
      pronunciation: 'thank you'
    }
  ];
}

export default router;