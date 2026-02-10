import express from 'express';
import OpenAI from 'openai';
import { requireSubscription } from '../middleware/subscriptionCheck.js';

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

// Geocode activity to get coordinates
async function geocodeActivity(activityName, destination) {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const query = `${activityName}, ${destination}`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const response = await fetch(url, { headers: { 'User-Agent': 'TravelBuddy' } });
    const data = await response.json();

    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
  } catch (error) {
    console.error(`Geocode error for ${activityName}:`, error.message);
  }
  return null;
}



// Check Azure OpenAI status
async function checkAzureOpenAIStatus() {
  console.log('🔍 Checking Azure OpenAI status...');
  console.log('AZURE_OPENAI_API_KEY:', process.env.AZURE_OPENAI_API_KEY ? 'SET' : 'MISSING');
  console.log('AZURE_OPENAI_ENDPOINT:', process.env.AZURE_OPENAI_ENDPOINT || 'MISSING');
  console.log('AZURE_OPENAI_DEPLOYMENT_NAME:', process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'MISSING');

  if (!process.env.AZURE_OPENAI_API_KEY || !process.env.AZURE_OPENAI_ENDPOINT) {
    console.log('❌ Azure OpenAI credentials missing');
    return false;
  }

  try {
    console.log('🧪 Testing Azure OpenAI connection...');
    const testCompletion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [{ role: "user", content: "Test" }],
      max_tokens: 5
    });
    console.log('✅ Azure OpenAI is working:', testCompletion.choices[0].message.content);
    return true;
  } catch (error) {
    console.log('❌ Azure OpenAI test failed:', error.message);
    return false;
  }
}

// Generate trip plan endpoint
const handleGenerateTripPlan = async (req, res) => {
  const startTime = Date.now();

  try {
    const { destination, duration, interests, pace, travelStyles, budget, daySettings } = req.body;

    if (!destination || !duration) {
      return res.status(400).json({ error: 'Destination and duration are required' });
    }

    const days = parseInt(duration.match(/(\d+)/)?.[1] || '3');

    // User-customizable day settings with defaults
    const dayConfig = {
      startTime: daySettings?.startTime || '08:00',
      endTime: daySettings?.endTime || '21:00',
      maxActiveHours: daySettings?.maxActiveHours || 10
    };

    // Check Azure OpenAI status first
    const azureWorking = openai && await checkAzureOpenAIStatus();

    if (!azureWorking) {
      console.error('❌ Azure OpenAI unavailable - cannot generate trip');
      return res.status(503).json({
        error: 'AI trip generation service is temporarily unavailable',
        message: 'Azure OpenAI is not properly configured or unavailable. Please try again later or contact support.',
        code: 'AZURE_OPENAI_UNAVAILABLE'
      });
    }

    const interestsPrompt = interests
      ? `\nCORE MISSION: Create a plan that balances the iconic, must-see highlights of ${destination} with the following User Interests: ${interests}.
- Strategy: Start by identifying the TOP 3-5 absolute most important landmarks/sites in ${destination}. These MUST be included. Then, tailor the remaining activities, dining suggestions, and pace (${pace || 'Moderate'}) to align with the specified interests.`
      : `\nCORE MISSION: Create the definitive "Top Highlights" itinerary for ${destination}.
- Strategy: Focus exclusively on showcasing the most iconic landmarks, essential cultural experiences, and top-rated attractions that define ${destination} for a first-time visitor.`;

    const prompt = `Create a highly professional and user-friendly travel itinerary for ${destination}.
    
    User Preferences:
    - Duration: ${duration}
    - Travel Style: ${travelStyles}
    - Budget: ${budget}
    - Interests: ${interests ? interests.join(', ') : 'General'}
    - Travelers: ${req.body.travelers || '1'}
    
    ${interestsPrompt}
    
    GUIDELINES for "notes" and "details":
    - Provide SPECIFIC, USEFUL advice a local would give.
    - Mention best times to visit (e.g., 'Go at 7 AM to avoid heat').
    - Suggest what to order (e.g., 'Try pepper crab at Ministry of Crab').
    - Detail dress codes (e.g., 'Shoulders/knees covered; sarongs available for rent').
    - Mention booking tips (e.g., 'Reserve balcony table via WhatsApp').

    GUIDELINES for "expenseBreakdown":
    - Ensure total dining cost = sum of all meal costs across days. Be realistic.
    - Total trip cost should be the sum of all fixed and variable costs.

    CRITICAL: You MUST respond with ONLY valid JSON. No markdown, no code blocks, no explanations.
    
    Return ONLY this exact JSON structure (no extra text):
    
    {
      "tripTitle": "${destination} Trip Plan",
      "destination": "${destination}",
      "duration": "${days} days",
      "introduction": "Engaging summary of the trip essence (2-3 sentences).",
      "tripOverview": {
        "totalTravelDays": "${days} days",
        "keyAttractions": ["List top 3-5 attractions"],
        "transportSummary": "e.g., Trains + local taxis",
        "hotels": ["List recommended hotels"],
        "estimatedTotalBudget": "$X,XXX per person",
        "tripStyle": "e.g., Budget Adventure, Luxury Relaxation",
        "bestFor": ["e.g., Solo travelers, photography enthusiasts"],
        "accommodationType": "e.g., Boutique hotels, guesthouses"
      },
      "dailyItinerary": [
        {
          "day": 1,
          "date": "Day 1",
          "theme": "Theme (e.g., Cultural Welcome)",
          "activities": [
            {
              "timeSlot": "09:00–11:00",
              "activityType": "Sightseeing",
              "activityTitle": "Activity name",
              "details": "Details based on user interests",
              "cost": "$XX",
              "notes": "Practical tips (e.g., dress code, tickets)",
              "googleMapsUrl": "https://www.google.com/maps/search/?api=1&query=Activity+Name+Location"
            }
          ],
          "overnight": {
            "name": "Recommended Hotel Name",
            "price": "$XX/night",
            "note": "e.g., Central location, rooftop views"
          }
        }
      ],
      "expenseBreakdown": {
        "fixed": {
          "accommodation": { "desc": "Total nights", "cost": "$XXX" },
          "transport": { "desc": "Internal transport", "cost": "$XXX" },
          "tickets": { "desc": "Entry fees", "cost": "$XX" }
        },
        "variable": {
          "dining": { "desc": "3 meals/day", "cost": "$XXX" },
          "localTransport": { "desc": "Taxis/Misc", "cost": "$XX" }
        },
        "total": "$X,XXX"
      },
      "preTripPreparation": {
        "booking": ["Book flight", "e-visa", "Train tickets"],
        "packing": ["Item 1", "Item 2", "Item 3"],
        "weather": "Brief seasonal description",
        "notes": ["Currency tip", "Etiquette", "Safety"]
      }
    }
    
    Create ${days} days of detailed activities. Each day should have 3-5 activities with realistic timing.
    RESPOND WITH ONLY THE JSON OBJECT. NO OTHER TEXT.`;

    console.log('🗺️ Generating trip plan for:', destination, duration);

    const response = await fetch(
      `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=2024-02-15-preview`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.AZURE_OPENAI_API_KEY,
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
      // Extract JSON from response (AI might wrap it in markdown code blocks or add extra text)
      let jsonText = text.trim();

      // Remove markdown code blocks if present
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Try to find JSON object
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ No JSON object found in AI response');
        console.error('Response preview:', text.substring(0, 500));
        throw new Error('AI response does not contain valid JSON');
      }

      // Parse the JSON
      tripPlan = JSON.parse(jsonMatch[0]);

      // Add metadata
      tripPlan.id = `plan_${Date.now()}`;
      tripPlan.createdAt = new Date().toISOString();
      tripPlan.updatedAt = new Date().toISOString();

      console.log('✅ Successfully parsed AI response');
    } catch (e) {
      console.error('⚠️ JSON parsing failed:', e.message);
      console.error('Response length:', text.length);
      console.error('Response preview:', text.substring(0, 500));
      console.error('Response end:', text.substring(text.length - 500));
      throw new Error(`Failed to parse AI response: ${e.message}. The AI may have generated invalid JSON.`);
    }

    // Geocode activities to add real coordinates
    console.log('📍 Geocoding and processing activities...');
    if (tripPlan.dailyItinerary) {
      // 1. Budget Realism Validation
      let calculatedDiningTotal = 0;

      for (const day of tripPlan.dailyItinerary || []) {
        for (const activity of day.activities || []) {
          // Geocoding
          if (!activity.coordinates) {
            const result = await geocodeActivity(activity.activityTitle, destination);
            if (result) {
              activity.coordinates = { lat: result.lat, lng: result.lng };
              activity.location = `${result.lat},${result.lng}`;
              if (result.placeId) activity.googlePlaceId = result.placeId;
              if (result.address) activity.fullAddress = result.address;
            }
          }

          // Accumulate dining costs for validation
          if (activity.activityType?.toLowerCase().includes('dining') || activity.activityTitle?.toLowerCase().includes('lunch') || activity.activityTitle?.toLowerCase().includes('dinner')) {
            const costStr = activity.cost || '$0';
            const costValue = parseFloat(costStr.replace(/[^0-9.]/g, '')) || 0;
            calculatedDiningTotal += costValue;
          }

          // 2. Individual Google Maps URL Sanitization
          if (activity.activityTitle) {
            const cleanTitle = activity.activityTitle
              .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F30B}-\u{1F320}\u{1F400}-\u{1F4FF}\u{1F900}-\u{1F9FF}\u{1F3FB}-\u{1F3FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
              .replace(/['"“”‘’]/g, '')
              .trim();

            const encodedQuery = encodeURIComponent(`${cleanTitle}, ${destination}`).replace(/%20/g, '+');
            activity.googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
          }
        }
      }

      // Adjust variable dining cost if significantly off (using a threshold)
      if (tripPlan.expenseBreakdown?.variable?.dining && calculatedDiningTotal > 0) {
        const currentDiningCost = parseFloat(tripPlan.expenseBreakdown.variable.dining.cost.replace(/[^0-9.]/g, '')) || 0;
        if (Math.abs(calculatedDiningTotal - currentDiningCost) > (calculatedDiningTotal * 0.2)) {
          console.log(`💰 Adjusting dining total from $${currentDiningCost} to $${Math.round(calculatedDiningTotal)} (Budget Realism)`);
          tripPlan.expenseBreakdown.variable.dining.cost = `$${Math.round(calculatedDiningTotal)}`;

          // Recalculate total if possible
          const fixedTotal = Object.values(tripPlan.expenseBreakdown.fixed).reduce((sum, item) => sum + (parseFloat(item.cost.replace(/[^0-9.]/g, '')) || 0), 0);
          const variableTotal = Object.values(tripPlan.expenseBreakdown.variable).reduce((sum, item) => sum + (parseFloat(item.cost.replace(/[^0-9.]/g, '')) || 0), 0);
          tripPlan.expenseBreakdown.total = `$${Math.round(fixedTotal + variableTotal)}`;
        }
      }
    }

    console.log('✅ Trip plan generated:', tripPlan.tripTitle);
    console.log('📊 Daily itinerary days:', tripPlan.dailyItinerary?.length || 0);
    console.log('📊 First day activities:', tripPlan.dailyItinerary?.[0]?.activities?.length || 0);
    res.json(tripPlan);

  } catch (error) {
    console.error('❌ Trip plan generation error:', error);
    res.status(500).json({
      error: 'Failed to generate trip plan',
      message: error.message || 'An error occurred while generating your trip. Please try again.',
      code: 'TRIP_GENERATION_FAILED'
    });
  }
};





// POST /api/ai-trips/generate - Main trip generation endpoint
router.post('/generate', handleGenerateTripPlan);

// Generate enhanced trip introduction
router.post('/enhance-introduction', async (req, res) => {
  try {
    const { tripPlan } = req.body;

    if (!tripPlan) {
      return res.status(400).json({ error: 'Trip plan required' });
    }

    // Always return fallback if no OpenAI configured
    if (!openai) {
      return res.json({
        enhanced: tripPlan.introduction || `Welcome to ${tripPlan.destination || 'your destination'}!`,
        cached: true
      });
    }

    const azureWorking = await checkAzureOpenAIStatus();

    if (!azureWorking) {
      return res.json({
        enhanced: tripPlan.introduction || `Welcome to ${tripPlan.destination || 'your destination'}!`,
        cached: true
      });
    }

    const prompt = `Create a rich, engaging trip overview for this itinerary:

Destination: ${tripPlan.destination}
Duration: ${tripPlan.duration}
Activities: ${tripPlan.dailyPlans?.length || 0} days planned

Generate a personalized introduction with:
- Welcome message with emojis
- Key highlights (3-4 points)
- Cultural insights
- Travel tips
- Budget expectations

Format with emojis and make it exciting! Keep it under 300 words.`;

    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
      max_tokens: 500
    });

    const enhanced = completion.choices[0].message.content.trim();

    res.json({
      enhanced,
      cached: false
    });

  } catch (error) {
    console.error('AI enhancement failed:', error);
    // Always return 200 with fallback, never 500
    res.json({
      enhanced: req.body.tripPlan?.introduction || `Welcome to ${req.body.tripPlan?.destination || 'your destination'}!`,
      cached: true,
      error: error.message
    });
  }
});

export default router;