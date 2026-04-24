import express from 'express';

const router = express.Router();
const AZURE_API_VERSION = '2024-02-15-preview';
const placeContentCache = new Map();

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
    throw new Error('Azure Foundry place content service is not fully configured');
  }

  const requestBody = {
    messages,
    max_completion_tokens: options.maxTokens || 1400,
    reasoning_effort: options.reasoningEffort || 'low',
    response_format: options.responseFormat || { type: 'json_object' }
  };

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
    usage: data.usage || null
  };
}

function buildPlaceContentPrompt({
  placeName,
  placeType,
  address,
  city,
  country,
  description,
  rating,
  tags
}) {
  const tagList = Array.isArray(tags) && tags.length > 0 ? tags.join(', ') : 'None';

  return `Create a destination brief for a travel app and return JSON only.

Place:
- Name: ${placeName}
- Type: ${placeType || 'Attraction'}
- Address: ${address || 'Unknown'}
- City: ${city || 'Unknown'}
- Country: ${country || 'Unknown'}
- Rating: ${rating || 'Unknown'}
- Existing description: ${description || 'None'}
- Tags: ${tagList}

Return JSON only with these keys:
description, localTip, handyPhrase, culturalInsight, vibe, bestTimeToVisit, idealVisitDuration, etiquette, photoTip, nearbyPairing, planningTips

Rules:
- Keep description to 2-3 sentences.
- localTip should feel practical and specific.
- handyPhrase should be short and useful for a traveler.
- culturalInsight should explain local context or behavior.
- vibe should be a short phrase.
- bestTimeToVisit and idealVisitDuration should be concise.
- etiquette should be one practical behavior note.
- photoTip should help a traveler capture better photos.
- nearbyPairing should suggest one complementary activity or stop.
- planningTips must be an array of 3 short practical tips.

Do not use markdown. Return valid JSON only.`;
}

function getFallbackPlaceContent(placeName, placeType, city) {
  return {
    description: `${placeName} is a notable ${placeType || 'destination'} in ${city || 'the area'} that rewards a slower, more intentional visit. Expect a mix of atmosphere, local character, and memorable details that make it worth adding to your day.`,
    localTip: 'Arrive a little earlier than peak hours to get calmer views and easier photos.',
    handyPhrase: 'What time is best to visit?',
    culturalInsight: 'Take a moment to observe how locals move through the space before jumping into photos or queues.',
    vibe: 'Laid-back local favorite',
    bestTimeToVisit: 'Early morning or late afternoon',
    idealVisitDuration: '1-2 hours',
    etiquette: 'Dress respectfully and keep noise low if the setting feels cultural or religious.',
    photoTip: 'Use side angles and natural light instead of shooting only from the busiest central spot.',
    nearbyPairing: 'Pair this stop with a nearby cafe or market for a fuller neighborhood experience.',
    planningTips: [
      'Carry small cash for tickets or snacks.',
      'Check local opening hours before heading out.',
      'Keep water and sun protection with you.'
    ]
  };
}

function normalizePlaceContent(rawContent, placeName, placeType, city) {
  const fallback = getFallbackPlaceContent(placeName, placeType, city);

  return {
    description: typeof rawContent?.description === 'string' ? rawContent.description.trim() || fallback.description : fallback.description,
    localTip: typeof rawContent?.localTip === 'string' ? rawContent.localTip.trim() || fallback.localTip : fallback.localTip,
    handyPhrase: typeof rawContent?.handyPhrase === 'string' ? rawContent.handyPhrase.trim() || fallback.handyPhrase : fallback.handyPhrase,
    culturalInsight: typeof rawContent?.culturalInsight === 'string' ? rawContent.culturalInsight.trim() || fallback.culturalInsight : fallback.culturalInsight,
    vibe: typeof rawContent?.vibe === 'string' ? rawContent.vibe.trim() || fallback.vibe : fallback.vibe,
    bestTimeToVisit: typeof rawContent?.bestTimeToVisit === 'string' ? rawContent.bestTimeToVisit.trim() || fallback.bestTimeToVisit : fallback.bestTimeToVisit,
    idealVisitDuration: typeof rawContent?.idealVisitDuration === 'string' ? rawContent.idealVisitDuration.trim() || fallback.idealVisitDuration : fallback.idealVisitDuration,
    etiquette: typeof rawContent?.etiquette === 'string' ? rawContent.etiquette.trim() || fallback.etiquette : fallback.etiquette,
    photoTip: typeof rawContent?.photoTip === 'string' ? rawContent.photoTip.trim() || fallback.photoTip : fallback.photoTip,
    nearbyPairing: typeof rawContent?.nearbyPairing === 'string' ? rawContent.nearbyPairing.trim() || fallback.nearbyPairing : fallback.nearbyPairing,
    planningTips: Array.isArray(rawContent?.planningTips) && rawContent.planningTips.length > 0
      ? rawContent.planningTips.map((tip) => String(tip).trim()).filter(Boolean).slice(0, 3)
      : fallback.planningTips
  };
}

router.get('/place-content/:placeId', async (req, res) => {
  const cached = placeContentCache.get(req.params.placeId);

  if (!cached) {
    return res.status(404).json({ error: 'Place content not found in cache' });
  }

  res.json(cached);
});

router.post('/place-content', async (req, res) => {
  try {
    const {
      placeId,
      placeName,
      placeType,
      address,
      city,
      country,
      description,
      rating,
      tags
    } = req.body;

    if (!placeName) {
      return res.status(400).json({ error: 'placeName is required' });
    }

    if (placeId && placeContentCache.has(placeId)) {
      return res.json(placeContentCache.get(placeId));
    }

    const prompt = buildPlaceContentPrompt({
      placeName,
      placeType,
      address,
      city,
      country,
      description,
      rating,
      tags
    });

    const generation = await callAzureChatCompletion([
      {
        role: 'system',
        content: 'You are a destination editor for a travel app. Respond with valid JSON only.'
      },
      {
        role: 'user',
        content: prompt
      }
    ]);

    if (!generation.text.trim()) {
      throw new Error(`Azure Foundry returned empty place content (finish_reason=${generation.finishReason || 'unknown'})`);
    }

    const parsed = JSON.parse(generation.text);
    const normalized = normalizePlaceContent(parsed, placeName, placeType, city);

    if (placeId) {
      placeContentCache.set(placeId, normalized);
    }

    res.json(normalized);
  } catch (error) {
    console.error('❌ Place content generation error:', error);
    res.json(
      getFallbackPlaceContent(
        req.body.placeName || 'This place',
        req.body.placeType || 'destination',
        req.body.city || req.body.country || 'the area'
      )
    );
  }
});

export default router;
