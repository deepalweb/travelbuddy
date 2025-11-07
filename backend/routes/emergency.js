import express from 'express';
const router = express.Router();

// GET /api/emergency/numbers - Get emergency numbers using Azure OpenAI
router.get('/numbers', async (req, res) => {
  const { lat, lng } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude required' });
  }

  try {
    const { AzureOpenAI } = await import('openai');
    
    const client = new AzureOpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiVersion: '2024-02-15-preview',
    });
    
    const prompt = `Given coordinates ${lat}, ${lng}, provide official emergency numbers for this location. Return ONLY JSON:\n    {\n      "country": "Country Name",\n      "police": "number",\n      "ambulance": "number", \n      "fire": "number"\n    }`;
    
    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4',
      messages: [{
        role: 'user',
        content: prompt
      }],
      max_tokens: 200,
      temperature: 0.1,
    });
    
    const aiResponse = response.choices[0]?.message?.content?.trim();
    
    if (aiResponse) {
      try {
        const emergencyData = JSON.parse(aiResponse);
        if (emergencyData.country && emergencyData.police) {
          return res.json(emergencyData);
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
      }
    }
    
    // Fallback
    res.json({
      country: 'International',
      police: '112',
      ambulance: '112',
      fire: '112'
    });
    
  } catch (error) {
    console.error('Azure OpenAI error:', error);
    res.json({
      country: 'International', 
      police: '112',
      ambulance: '112',
      fire: '112'
    });
  }
});

// GET /api/emergency/services - Find nearby emergency services
router.get('/services', async (req, res) => {
  const { lat, lng, radius = 5000 } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude required' });
  }

  try {
    const services = [];
    
    // Search for hospitals with multiple terms
    const hospitalTerms = ['hospital', 'medical_center', 'clinic'];
    for (const term of hospitalTerms) {
      const results = await searchGooglePlaces(lat, lng, term, radius);
      services.push(...results);
      if (services.length >= 3) break;
    }
    
    // Search for police stations with multiple terms
    const policeTerms = ['police', 'police_station', 'government'];
    for (const term of policeTerms) {
      const results = await searchGooglePlaces(lat, lng, term, radius);
      services.push(...results);
      if (services.filter(s => s.type.includes('police')).length >= 2) break;
    }
    
    // Search for pharmacies
    const pharmacies = await searchGooglePlaces(lat, lng, 'pharmacy', radius);
    services.push(...pharmacies.slice(0, 2));
    
    // Remove duplicates and sort by distance
    const uniqueServices = services.filter((service, index, self) => 
      index === self.findIndex(s => s.name === service.name)
    );
    uniqueServices.sort((a, b) => a.distance - b.distance);
    
    // If no real services found, provide mock data
    if (uniqueServices.length === 0) {
      console.log('⚠️ No real emergency services found, using mock data');
      const mockServices = [
        {
          type: 'hospital',
          name: 'General Hospital',
          address: 'Main Street, Local Area',
          phone: '110',
          latitude: parseFloat(lat) + 0.001,
          longitude: parseFloat(lng) + 0.001,
          distance: 1.2,
          rating: 4.2,
          is24Hours: true,
          hasEnglishStaff: true,
          isVerifiedSafe: true
        },
        {
          type: 'police',
          name: 'Police Station',
          address: 'Central Road, Local Area', 
          phone: '119',
          latitude: parseFloat(lat) + 0.002,
          longitude: parseFloat(lng) - 0.001,
          distance: 0.8,
          rating: 4.0,
          is24Hours: true,
          hasEnglishStaff: true,
          isVerifiedSafe: true
        }
      ];
      return res.json(mockServices);
    }
    
    res.json(uniqueServices.slice(0, 10));
  } catch (error) {
    console.error('Emergency services API error:', error);
    res.status(500).json({ error: 'Failed to fetch emergency services' });
  }
});

async function searchGooglePlaces(lat, lng, type, radius) {
  const fetch = (await import('node-fetch')).default;
  
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
  
  console.log(`🔍 Searching for ${type} near ${lat},${lng} within ${radius}m`);
  
  const response = await fetch(url);
  const data = await response.json();
  
  console.log(`📡 Google Places API response for ${type}:`, data.status, `Found: ${data.results?.length || 0} results`);
  
  if (data.status !== 'OK') {
    console.warn(`⚠️ Google Places API warning for ${type}:`, data.status, data.error_message);
    return [];
  }
  
  return data.results.map(place => {
    const location = place.geometry.location;
    const distance = calculateDistance(lat, lng, location.lat, location.lng);
    
    return {
      type: type,
      name: place.name,
      address: place.vicinity || '',
      phone: place.formatted_phone_number || '',
      latitude: location.lat,
      longitude: location.lng,
      distance: distance,
      rating: place.rating || 0,
      is24Hours: place.opening_hours?.open_now || false,
      hasEnglishStaff: true,
      isVerifiedSafe: (place.rating || 0) > 4.0
    };
  });
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// GET /api/emergency/alerts - Get safety alerts for location
router.get('/alerts', async (req, res) => {
  const { lat, lng, radius = 50000 } = req.query;
  
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Latitude and longitude required' });
  }

  try {
    // Mock safety alerts - in production, integrate with real alert APIs
    const mockAlerts = [
      {
        id: '1',
        title: 'Heavy Rain Warning',
        description: 'Monsoon rains expected in the area. Exercise caution while traveling.',
        type: 'weather',
        severity: 'medium',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        location: 'Regional Area',
        latitude: parseFloat(lat) + 0.01,
        longitude: parseFloat(lng) + 0.01,
        isActive: true
      },
      {
        id: '2',
        title: 'Road Construction',
        description: 'Major road construction causing traffic delays on main routes.',
        type: 'transport',
        severity: 'low',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        location: 'City Center',
        latitude: parseFloat(lat) - 0.005,
        longitude: parseFloat(lng) + 0.005,
        isActive: true
      }
    ];
    
    // Filter alerts by distance (mock implementation)
    const filteredAlerts = mockAlerts.filter(alert => {
      const distance = calculateDistance(lat, lng, alert.latitude, alert.longitude);
      return distance <= radius / 1000; // Convert to km
    });
    
    res.json(filteredAlerts);
  } catch (error) {
    console.error('Safety alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch safety alerts' });
  }
});

// GET /api/emergency/phrases - Get emergency phrases for country
router.get('/phrases', async (req, res) => {
  const { country } = req.query;
  
  try {
    // Mock emergency phrases - in production, load from database
    const phrases = {
      'LK': [ // Sri Lanka
        {
          english: 'Help me!',
          local: 'මට උදව් කරන්න!',
          pronunciation: 'mata udav karanna',
          category: 'emergency'
        },
        {
          english: 'Where is the hospital?',
          local: 'රෝහල කොහෙද?',
          pronunciation: 'rohala kohed',
          category: 'medical'
        },
        {
          english: 'Call the police',
          local: 'පොලිසියට කතා කරන්න',
          pronunciation: 'polisiyata kata karanna',
          category: 'emergency'
        },
        {
          english: 'I need a doctor',
          local: 'මට වෛද්යවරයෙක් ඕන',
          pronunciation: 'mata vaidyavarayak ona',
          category: 'medical'
        }
      ],
      'IN': [ // India
        {
          english: 'Help me!',
          local: 'मेरी मदद करो!',
          pronunciation: 'meri madad karo',
          category: 'emergency'
        },
        {
          english: 'Where is the hospital?',
          local: 'अस्पताल कहाँ है?',
          pronunciation: 'aspatal kahan hai',
          category: 'medical'
        }
      ],
      'default': [
        {
          english: 'Help!',
          local: 'Help!',
          pronunciation: 'help',
          category: 'emergency'
        },
        {
          english: 'Emergency',
          local: 'Emergency',
          pronunciation: 'emergency',
          category: 'emergency'
        }
      ]
    };
    
    const countryPhrases = phrases[country] || phrases['default'];
    res.json(countryPhrases);
  } catch (error) {
    console.error('Emergency phrases error:', error);
    res.status(500).json({ error: 'Failed to fetch emergency phrases' });
  }
});

// POST /api/emergency/translate - Translate emergency phrase
router.post('/translate', async (req, res) => {
  const { text, targetLanguage } = req.body;
  
  if (!text || !targetLanguage) {
    return res.status(400).json({ error: 'Text and target language required' });
  }

  try {
    // Mock translation - in production, integrate with translation API
    const translations = {
      'si': { // Sinhala
        'Help me!': 'මට උදව් කරන්න!',
        'Where is hospital?': 'රෝහල කොහෙද?',
        'Call police': 'පොලිසියට කතා කරන්න'
      },
      'hi': { // Hindi
        'Help me!': 'मेरी मदद करो!',
        'Where is hospital?': 'अस्पताल कहाँ है?',
        'Call police': 'पुलिस को बुलाओ'
      }
    };
    
    const translated = translations[targetLanguage]?.[text] || text;
    res.json({ translated });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Translation failed' });
  }
});

export default router;