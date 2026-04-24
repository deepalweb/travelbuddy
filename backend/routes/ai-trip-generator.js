import express from 'express';
import { requireSubscription } from '../middleware/subscriptionCheck.js';

const router = express.Router();
const AZURE_API_VERSION = '2024-02-15-preview';

function normalizeAzureEndpoint(endpoint) {
  if (!endpoint) {
    return '';
  }

  return endpoint
    .trim()
    .replace(/\/openai\/.*$/i, '')
    .replace(/\/+$/, '');
}

function getAzureConfig() {
  return {
    endpoint: normalizeAzureEndpoint(process.env.AZURE_OPENAI_ENDPOINT),
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
  };
}

function extractMessageText(message) {
  if (!message) {
    return '';
  }

  if (typeof message.content === 'string') {
    return message.content;
  }

  if (Array.isArray(message.content)) {
    return message.content
      .map((part) => {
        if (typeof part === 'string') {
          return part;
        }

        if (part?.type === 'text') {
          return part.text || '';
        }

        return '';
      })
      .join('');
  }

  return '';
}

async function callAzureChatCompletion(messages, options = {}) {
  const { endpoint, apiKey, deployment } = getAzureConfig();

  if (!endpoint || !apiKey || !deployment) {
    throw new Error('Azure Foundry trip generator is not fully configured');
  }

  const requestBody = {
    messages,
    max_completion_tokens: options.maxTokens || 4000,
  };

  if (options.responseFormat) {
    requestBody.response_format = options.responseFormat;
  }

  if (options.reasoningEffort) {
    requestBody.reasoning_effort = options.reasoningEffort;
  }

  if (options.temperature !== undefined && !options.reasoningEffort) {
    requestBody.temperature = options.temperature;
  }

  const response = await fetch(
    `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${AZURE_API_VERSION}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(requestBody)
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Azure Foundry API failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];

  return {
    text: extractMessageText(choice?.message),
    finishReason: choice?.finish_reason || null,
    refusal: choice?.message?.refusal || null,
    usage: data.usage || null,
    raw: data,
  };
}

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

function buildSeededImageUrl(...parts) {
  const seed = parts
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return `https://picsum.photos/seed/${seed || 'travelbuddy-trip'}/1200/800`;
}

async function generateWithAzureModel(prompt) {
  const result = await callAzureChatCompletion([
    {
      role: 'system',
      content: 'You are an expert travel planner. Respond with valid JSON only.'
    },
    {
      role: 'user',
      content: prompt
    }
  ], {
    maxTokens: 3000,
    reasoningEffort: 'low',
    responseFormat: { type: 'json_object' }
  });

  return {
    provider: 'azure-foundry',
    ...result
  };
}



// Check Azure OpenAI status
async function checkAzureOpenAIStatus() {
  const { endpoint, apiKey, deployment } = getAzureConfig();

  console.log('🔍 Checking Azure OpenAI status...');
  console.log('AZURE_OPENAI_API_KEY:', apiKey ? 'SET' : 'MISSING');
  console.log('AZURE_OPENAI_ENDPOINT:', endpoint || 'MISSING');
  console.log('AZURE_OPENAI_DEPLOYMENT_NAME:', deployment || 'MISSING');

  if (!apiKey || !endpoint || !deployment) {
    console.log('❌ Azure OpenAI credentials missing');
    return false;
  }

  try {
    console.log('🧪 Testing Azure OpenAI connection...');
    const testResult = await callAzureChatCompletion(
      [{ role: 'user', content: 'Reply with the single word: OK' }],
      { maxTokens: 5, temperature: 0 }
    );
    console.log('✅ Azure OpenAI is working:', testResult.text);
    return true;
  } catch (error) {
    console.log('❌ Azure OpenAI test failed:', error.message);
    return false;
  }
}

function buildTripGenerationPrompt({
  destination,
  duration,
  days,
  interests,
  pace,
  travelStyles,
  travelStyle,
  budget,
  travelers,
  startDate,
  endDate,
  currency,
  notes,
  mustSee,
  avoid
}) {
  const interestList = Array.isArray(interests)
    ? interests.filter(Boolean)
    : typeof interests === 'string'
      ? interests.split(',').map((item) => item.trim()).filter(Boolean)
      : [];

  const hasInterests = interestList.length > 0;
  const travelMode = travelStyles || travelStyle || 'balanced';

  return `Create a ${days} day travel itinerary for ${destination} and return JSON only.

Trip inputs:
- Travel style: ${travelMode}
- Pace: ${pace || 'moderate'}
- Budget: ${budget || 'medium'}
- Travelers: ${travelers || '1'}
- Start date: ${startDate || 'Flexible'}
- End date: ${endDate || 'Flexible'}
- Currency: ${currency || 'USD'}
- Interests: ${hasInterests ? interestList.join(', ') : 'General highlights'}
- Must-see priorities: ${mustSee?.length ? mustSee.join(', ') : 'None specified'}
- Avoid: ${avoid?.length ? avoid.join(', ') : 'None specified'}
- Notes: ${notes || 'None'}

Planning rules:
- Each day must have 3 to 5 activities.
- Prioritize iconic highlights and realistic travel flow.
- Keep advice specific and practical.
- Make costs and hotels realistic for the selected budget.
- Include food suggestions where appropriate.
- Respect the avoid list.

Return JSON only with these keys:
tripTitle, destination, duration, introduction, keyAttractions, hotels, transportSummary, estimatedTotalBudget, dailyItinerary, expenseBreakdown, preTripPreparation

For dailyItinerary, return an array of ${days} day objects with:
- day
- theme
- activities
- overnight

Each activity must include:
- timeSlot
- activityType
- activityTitle
- details
- cost
- notes

For expenseBreakdown, return:
accommodation, transport, tickets, dining, localTransport, total

For preTripPreparation, return:
booking, packing, weather, notes

Output must be compact valid JSON with no markdown or commentary.`;
}

function toCostString(value, fallback = 'Varies') {
  if (typeof value === 'string') {
    return value.trim() || fallback;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return `$${Math.round(value)}`;
  }

  if (value && typeof value === 'object') {
    if (typeof value.amount === 'number' && Number.isFinite(value.amount)) {
      const currency = typeof value.currency === 'string' ? value.currency.trim() : 'USD';
      const travelerSuffix =
        value.forTravelers !== undefined && value.forTravelers !== null
          ? ` for ${value.forTravelers} traveler${String(value.forTravelers) === '1' ? '' : 's'}`
          : '';

      return `${currency} ${Math.round(value.amount)}${travelerSuffix}`;
    }

    const stringParts = Object.values(value)
      .filter((item) => typeof item === 'string' && item.trim())
      .map((item) => item.trim());

    if (stringParts.length > 0) {
      return stringParts.join(' | ');
    }
  }

  return fallback;
}

function normalizeStringArray(value, fallback = []) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'string') {
          return item.trim();
        }

        if (item && typeof item === 'object') {
          const candidate = item.name || item.title || item.location || item.city || item.description;
          return typeof candidate === 'string' ? candidate.trim() : '';
        }

        return '';
      })
      .filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }

  return fallback;
}

function formatTransportSummary(value, fallback = 'Mixed local transport') {
  if (typeof value === 'string') {
    return value.trim() || fallback;
  }

  if (value && typeof value === 'object') {
    const parts = [];

    if (Array.isArray(value.route) && value.route.length > 0) {
      parts.push(`Route: ${value.route.join(' -> ')}`);
    }

    if (typeof value.recommendedTransport === 'string' && value.recommendedTransport.trim()) {
      parts.push(value.recommendedTransport.trim());
    }

    if (typeof value.estimatedIntercityTransportUSD === 'number' && Number.isFinite(value.estimatedIntercityTransportUSD)) {
      parts.push(`Estimated intercity transport: USD ${Math.round(value.estimatedIntercityTransportUSD)}`);
    }

    if (parts.length > 0) {
      return parts.join(' | ');
    }
  }

  return fallback;
}

function formatHotelEntry(hotel) {
  if (!hotel) {
    return null;
  }

  if (typeof hotel === 'string') {
    return hotel;
  }

  if (hotel.suggestedHotel && hotel.city) {
    return `${hotel.city}: ${hotel.suggestedHotel}`;
  }

  if (Array.isArray(hotel.suggestedOptions) && hotel.suggestedOptions.length > 0) {
    return hotel.city ? `${hotel.city}: ${hotel.suggestedOptions.join(', ')}` : hotel.suggestedOptions.join(', ');
  }

  return hotel.city || hotel.location || null;
}

function normalizeOvernightStay(overnight, fallbackDestination, dayNumber) {
  if (typeof overnight === 'string') {
    return {
      name: overnight,
      price: 'Varies',
      note: `Recommended overnight base for Day ${dayNumber}`
    };
  }

  if (overnight && typeof overnight === 'object') {
    return {
      name: overnight.name || overnight.hotel || overnight.city || fallbackDestination,
      price: overnight.price || overnight.estimatedNightlyCost || 'Varies',
      note: overnight.note || 'Recommended overnight stay'
    };
  }

  return {
    name: fallbackDestination,
    price: 'Varies',
    note: `Recommended overnight base for Day ${dayNumber}`
  };
}

function normalizeActivity(activity, destination) {
  const activityTitle = activity?.activityTitle || activity?.title || activity?.name || 'Planned activity';

  return {
    timeSlot: activity?.timeSlot || activity?.time || 'Flexible',
    activityType: activity?.activityType || activity?.type || 'Activity',
    activityTitle,
    details: activity?.details || activity?.description || '',
    cost: toCostString(activity?.cost, 'Included'),
    notes: activity?.notes || activity?.tip || '',
    imageUrl: activity?.imageUrl || '',
    googleMapsUrl: activity?.googleMapsUrl || ''
  };
}

function normalizeGeneratedTripPlan(rawTripPlan, context) {
  const {
    destination,
    days,
    travelers,
    budget,
    travelStyles,
    travelStyle,
    startDate,
    endDate,
    notes,
    mustSee,
    avoid
  } = context;

  const dailyItinerary = (rawTripPlan.dailyItinerary || []).map((day, index) => ({
    day: day?.day || index + 1,
    date: day?.date || `Day ${day?.day || index + 1}`,
    theme: day?.theme || day?.title || day?.location || `Day ${day?.day || index + 1} Highlights`,
    activities: (day?.activities || []).map((activity) => normalizeActivity(activity, destination)),
    overnight: normalizeOvernightStay(day?.overnight, day?.location || destination, day?.day || index + 1)
  }));

  const fixedAccommodation = toCostString(rawTripPlan.expenseBreakdown?.accommodation, '$0');
  const fixedTransport = toCostString(rawTripPlan.expenseBreakdown?.transport, '$0');
  const fixedTickets = toCostString(rawTripPlan.expenseBreakdown?.tickets, '$0');
  const variableDining = toCostString(rawTripPlan.expenseBreakdown?.dining, '$0');
  const variableLocalTransport = toCostString(rawTripPlan.expenseBreakdown?.localTransport, '$0');
  const totalCost = toCostString(
    rawTripPlan.expenseBreakdown?.total || rawTripPlan.estimatedTotalBudget,
    '$0'
  );

  const hotelList = Array.isArray(rawTripPlan.hotels)
    ? rawTripPlan.hotels.map(formatHotelEntry).filter(Boolean)
    : [];

  return {
    tripTitle: rawTripPlan.tripTitle || `${destination} Trip Plan`,
    destination: rawTripPlan.destination || destination,
    duration: rawTripPlan.duration || `${days} days`,
    travelers: rawTripPlan.travelers || travelers || '1',
    budgetRange: rawTripPlan.budgetRange || budget || 'medium',
    travelStyle: rawTripPlan.travelStyle || travelStyles || travelStyle || 'balanced',
    planningStatus: rawTripPlan.planningStatus || 'draft',
    startDate: rawTripPlan.startDate || startDate || '',
    endDate: rawTripPlan.endDate || endDate || '',
    notes: rawTripPlan.notes || notes || '',
    mustSee: Array.isArray(rawTripPlan.mustSee) ? rawTripPlan.mustSee : (mustSee || []),
    avoid: Array.isArray(rawTripPlan.avoid) ? rawTripPlan.avoid : (avoid || []),
    coverImageUrl: rawTripPlan.coverImageUrl || buildSeededImageUrl(destination, 'cover'),
    introduction: rawTripPlan.introduction || `Explore the best of ${destination} with a well-paced itinerary.`,
    tripOverview: {
      totalTravelDays: rawTripPlan.tripOverview?.totalTravelDays || rawTripPlan.duration || `${days} days`,
      keyAttractions: normalizeStringArray(rawTripPlan.tripOverview?.keyAttractions || rawTripPlan.keyAttractions, []),
      transportSummary: formatTransportSummary(
        rawTripPlan.tripOverview?.transportSummary || rawTripPlan.transportSummary,
        'Mixed local transport'
      ),
      hotels: normalizeStringArray(rawTripPlan.tripOverview?.hotels, hotelList),
      estimatedTotalBudget: toCostString(
        rawTripPlan.tripOverview?.estimatedTotalBudget || rawTripPlan.estimatedTotalBudget || totalCost,
        totalCost
      ),
      tripStyle: rawTripPlan.tripOverview?.tripStyle || `${budget || 'medium'} ${travelStyles || travelStyle || 'balanced'} trip`,
      bestFor: normalizeStringArray(rawTripPlan.tripOverview?.bestFor, ['First-time visitors']),
      accommodationType: rawTripPlan.tripOverview?.accommodationType || 'Mid-range hotels and guesthouses'
    },
    dailyItinerary,
    expenseBreakdown: {
      fixed: {
        accommodation: { desc: 'Accommodation', cost: fixedAccommodation },
        transport: { desc: 'Intercity transport', cost: fixedTransport },
        tickets: { desc: 'Entry fees and tickets', cost: fixedTickets }
      },
      variable: {
        dining: { desc: 'Meals and snacks', cost: variableDining },
        localTransport: { desc: 'Taxis and local rides', cost: variableLocalTransport }
      },
      total: totalCost
    },
    preTripPreparation: {
      booking: rawTripPlan.preTripPreparation?.booking || ['Book flights', 'Reserve hotels'],
      packing: rawTripPlan.preTripPreparation?.packing || ['Comfortable clothes', 'Travel essentials'],
      weather: rawTripPlan.preTripPreparation?.weather || 'Check the local forecast before departure.',
      notes: rawTripPlan.preTripPreparation?.notes || ['Carry local cash and ID copies']
    }
  };
}

// Generate trip plan endpoint
const handleGenerateTripPlan = async (req, res) => {
  const startTime = Date.now();

  try {
    const {
      destination,
      duration,
      interests,
      pace,
      travelStyles,
      budget,
      daySettings,
      travelers,
      startDate,
      endDate,
      currency,
      notes,
      mustSee,
      avoid,
      travelStyle
    } = req.body;

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

    const azureWorking = await checkAzureOpenAIStatus();

    if (!azureWorking) {
      console.error('❌ Azure Foundry is unavailable - cannot generate trip');
      return res.status(503).json({
        error: 'AI trip generation service is temporarily unavailable',
        message: 'Azure Foundry trip generation is not configured correctly or is currently unavailable.',
        code: 'AZURE_FOUNDRY_UNAVAILABLE'
      });
    }

    const prompt = buildTripGenerationPrompt({
      destination,
      duration,
      days,
      interests,
      pace,
      travelStyles,
      travelStyle,
      budget,
      travelers,
      startDate,
      endDate,
      currency,
      notes,
      mustSee,
      avoid
    });

    console.log('🗺️ Generating trip plan for:', destination, duration);

    const generation = await generateWithAzureModel(prompt);
    const text = generation.text;

    if (!text.trim()) {
      console.error('❌ Azure Foundry returned empty content');
      console.error('Finish reason:', generation.finishReason);
      console.error('Usage:', generation.usage);
      throw new Error(`Azure Foundry returned empty content (finish_reason=${generation.finishReason || 'unknown'})`);
    }

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

      // Parse and normalize the AI response into the richer app-specific shape
      tripPlan = normalizeGeneratedTripPlan(JSON.parse(jsonMatch[0]), {
        destination,
        days,
        travelers,
        budget,
        travelStyles,
        travelStyle,
        startDate,
        endDate,
        notes,
        mustSee,
        avoid
      });
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
            if (!activity.imageUrl) {
              activity.imageUrl = buildSeededImageUrl(destination, cleanTitle);
            }
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
    console.log('🤖 Generated with provider:', generation.provider);
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
Activities: ${tripPlan.dailyItinerary?.length || tripPlan.dailyPlans?.length || 0} days planned

Generate a personalized introduction with:
- Welcome message with emojis
- Key highlights (3-4 points)
- Cultural insights
- Travel tips
- Budget expectations

Format with emojis and make it exciting! Keep it under 300 words.`;

    const enhancementResult = await callAzureChatCompletion(
      [{ role: 'user', content: prompt }],
      { temperature: 0.8, maxTokens: 500 }
    );
    const enhanced = enhancementResult.text.trim();

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
