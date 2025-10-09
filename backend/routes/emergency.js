const express = require('express');
const router = express.Router();

// Emergency numbers API endpoint using Azure OpenAI
router.post('/emergency-numbers', async (req, res) => {
  try {
    const { location, latitude, longitude } = req.body;
    
    if (!location && (!latitude || !longitude)) {
      return res.status(400).json({ error: 'Location or coordinates required' });
    }
    
    // Use Azure OpenAI to get emergency numbers
    const { AzureOpenAI } = require('openai');
    
    const client = new AzureOpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiVersion: '2024-02-15-preview',
    });
    
    const prompt = `Given the location "${location}" (coordinates: ${latitude}, ${longitude}), provide the official emergency service phone numbers for this country/region. 
    
    Return ONLY a JSON object with this exact format:
    {
      "country": "Country Name",
      "police": "emergency_number",
      "ambulance": "emergency_number", 
      "fire": "emergency_number"
    }
    
    Use the actual emergency numbers for that specific country. For example:
    - USA/Canada: 911 for all services
    - UK: 999 for all services  
    - EU: 112 for all services
    - Sri Lanka: Police 119, Ambulance 110, Fire 111
    - India: Police 100, Ambulance 102, Fire 101
    - Australia: 000 for all services
    
    If location is unclear, use the coordinates to determine the country.`;
    
    const response = await client.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an emergency services information assistant. Provide accurate emergency phone numbers for any given location. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.1,
    });
    
    const aiResponse = response.choices[0]?.message?.content?.trim();
    
    if (aiResponse) {
      try {
        const emergencyData = JSON.parse(aiResponse);
        
        // Validate the response structure
        if (emergencyData.country && emergencyData.police && emergencyData.ambulance && emergencyData.fire) {
          console.log(`✅ Emergency numbers for ${emergencyData.country}:`, emergencyData);
          return res.json(emergencyData);
        }
      } catch (parseError) {
        console.error('❌ Failed to parse AI response:', parseError);
      }
    }
    
    // Fallback based on coordinates
    const fallbackData = getFallbackEmergencyNumbers(latitude, longitude, location);
    console.log(`⚠️ Using fallback emergency numbers:`, fallbackData);
    res.json(fallbackData);
    
  } catch (error) {
    console.error('❌ Emergency numbers API error:', error);
    
    // Return default based on location or coordinates
    const fallbackData = getFallbackEmergencyNumbers(
      req.body.latitude, 
      req.body.longitude, 
      req.body.location
    );
    
    res.json(fallbackData);
  }
});

function getFallbackEmergencyNumbers(lat, lng, location) {
  const locationStr = (location || '').toLowerCase();
  
  // Sri Lanka
  if (locationStr.includes('sri lanka') || locationStr.includes('colombo') || locationStr.includes('kandy') ||
      (lat && lng && lat >= 5.9 && lat <= 9.9 && lng >= 79.5 && lng <= 81.9)) {
    return {
      country: 'Sri Lanka',
      police: '119',
      ambulance: '110',
      fire: '111'
    };
  }
  
  // India
  if (locationStr.includes('india') || locationStr.includes('mumbai') || locationStr.includes('delhi') ||
      (lat && lng && lat >= 8.0 && lat <= 37.0 && lng >= 68.0 && lng <= 97.0)) {
    return {
      country: 'India',
      police: '100',
      ambulance: '102',
      fire: '101'
    };
  }
  
  // USA/Canada
  if (locationStr.includes('usa') || locationStr.includes('united states') || locationStr.includes('canada') ||
      (lat && lng && lat >= 25.0 && lat <= 71.0 && lng >= -168.0 && lng <= -52.0)) {
    return {
      country: 'USA/Canada',
      police: '911',
      ambulance: '911',
      fire: '911'
    };
  }
  
  // UK
  if (locationStr.includes('uk') || locationStr.includes('united kingdom') || locationStr.includes('london') ||
      (lat && lng && lat >= 49.9 && lat <= 60.9 && lng >= -8.2 && lng <= 1.8)) {
    return {
      country: 'United Kingdom',
      police: '999',
      ambulance: '999',
      fire: '999'
    };
  }
  
  // EU (general)
  if (locationStr.includes('germany') || locationStr.includes('france') || locationStr.includes('spain') ||
      (lat && lng && lat >= 35.0 && lat <= 71.0 && lng >= -10.0 && lng <= 40.0)) {
    return {
      country: 'European Union',
      police: '112',
      ambulance: '112',
      fire: '112'
    };
  }
  
  // Australia
  if (locationStr.includes('australia') || locationStr.includes('sydney') || locationStr.includes('melbourne') ||
      (lat && lng && lat >= -44.0 && lat <= -10.0 && lng >= 113.0 && lng <= 154.0)) {
    return {
      country: 'Australia',
      police: '000',
      ambulance: '000',
      fire: '000'
    };
  }
  
  // Default fallback
  return {
    country: 'International',
    police: '112',
    ambulance: '112',
    fire: '112'
  };
}

module.exports = router;