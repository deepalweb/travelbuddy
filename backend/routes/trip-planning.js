import express from 'express';
import fetch from 'node-fetch';
import { buildTripPlanPrompt } from '../lib/ai/buildTripPlanPrompt.js';

const router = express.Router();

const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const AZURE_API_VERSION = '2024-02-01';
const AI_GENERATION_TIMEOUT_MS = Math.max(
  60000,
  Number(process.env.TRIP_PLAN_AI_TIMEOUT_MS) || 120000
);
const AI_REPAIR_TIMEOUT_MS = Math.max(
  30000,
  Number(process.env.TRIP_PLAN_REPAIR_TIMEOUT_MS) || 60000
);
const AI_REQUEST_ATTEMPTS = 2;

function validateTripPlanInput(input = {}) {
  const errors = [];

  if (!input.destination || !String(input.destination).trim()) {
    errors.push('Destination is required.');
  }

  if (!input.durationDays || Number(input.durationDays) < 1) {
    errors.push('durationDays must be at least 1.');
  }

  if (!input.travelerType) {
    errors.push('travelerType is required.');
  }

  if (!input.budgetLevel) {
    errors.push('budgetLevel is required.');
  }

  if (!input.pace) {
    errors.push('pace is required.');
  }

  return errors;
}

function normalizeTripPlanInput(input = {}) {
  return {
    destination: String(input.destination || '').trim(),
    origin: input.origin ? String(input.origin).trim() : undefined,
    country: input.country ? String(input.country).trim() : undefined,
    startDate: input.startDate || undefined,
    endDate: input.endDate || undefined,
    month: input.month || undefined,
    durationDays: Number(input.durationDays) || 4,
    travelerType: input.travelerType || 'couple',
    budgetLevel: input.budgetLevel || 'mid_range',
    budgetAmount: input.budgetAmount ? Number(input.budgetAmount) : undefined,
    currency: input.currency || 'USD',
    pace: input.pace || 'balanced',
    interests: Array.isArray(input.interests) ? input.interests.filter(Boolean).map((item) => String(item).toLowerCase()) : [],
    avoid: Array.isArray(input.avoid) ? input.avoid.filter(Boolean).map((item) => String(item).toLowerCase()) : [],
    accommodationArea: input.accommodationArea || undefined,
    arrivalTime: input.arrivalTime || undefined,
    departureTime: input.departureTime || undefined,
    notes: input.notes || undefined,
  };
}

function safeParseAIJson(raw) {
  if (!raw) {
    throw new Error('Empty AI response');
  }

  const cleaned = String(raw)
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON object found in AI response');
  }

  const candidate = jsonMatch[0];

  try {
    return JSON.parse(candidate);
  } catch (error) {
    const repaired = candidate
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/\u00a0/g, ' ');

    try {
      return JSON.parse(repaired);
    } catch (repairError) {
      throw new Error(`Failed to parse AI JSON: ${repairError.message}`);
    }
  }
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
      .map((part) => (typeof part === 'string' ? part : part?.text || ''))
      .join('');
  }

  return '';
}

function isPlaceholderPlace(value = '') {
  return /(signature highlight|food stop|scenic moment|culture highlight|cultural core|local dining area|sunset viewpoint|secondary museum or viewpoint|local market detour|highlight$| stop$)/i.test(
    String(value).trim()
  );
}

function isGenericPlaceName(value = '') {
  return /(local dinner|local dining|dinner|lunch|breakfast|food experience|food tasting|nearby restaurant|restaurant nearby|city center|town center|old town|downtown|waterfront|neighbou?rhood|market area|shopping area|hotel area|scenic area|cultural area|local area)/i.test(
    String(value).trim()
  );
}

function toStringArray(value) {
  return Array.isArray(value) ? value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean) : [];
}

function canOpenExactPlace(activity = {}) {
  if (!activity.placeName || isPlaceholderPlace(activity.placeName) || isGenericPlaceName(activity.placeName)) {
    return false;
  }

  return ['attraction', 'food', 'nature', 'culture'].includes(String(activity.type || '').toLowerCase());
}

function buildGoogleMapsUrl(placeName, destination) {
  if (!placeName || isPlaceholderPlace(placeName) || isGenericPlaceName(placeName)) {
    return undefined;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${String(placeName).trim()}, ${destination}`
  )}`;
}

function buildNearbySearchUrl(activity, destination) {
  const type = String(activity?.type || '').toLowerCase();
  if (!['food', 'shopping', 'experience'].includes(type)) {
    return undefined;
  }

  const query = type === 'food' ? `restaurants near ${destination}` : `${type} near ${destination}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function normalizeRange(value) {
  const text = String(value || '').trim();
  const match = text.match(/(\d[\d,]*(?:\.\d+)?)\s*[-–—]\s*(?:[A-Z]{3}\s*|[$€£]\s*)?(\d[\d,]*(?:\.\d+)?)/);
  if (!match) {
    return text;
  }

  const first = Number(match[1].replace(/,/g, ''));
  const second = Number(match[2].replace(/,/g, ''));
  if (!Number.isFinite(first) || !Number.isFinite(second) || first <= second) {
    return text;
  }

  return `${text.slice(0, match.index)}${match[2]}-${match[1]}${text.slice(
    Number(match.index) + match[0].length
  )}`;
}

function normalizePlaceList(value) {
  const seen = new Set();
  return (Array.isArray(value) ? value : []).filter((place) => {
    const key = String(place?.name || '').trim().toLowerCase();
    if (!key || isPlaceholderPlace(key) || isGenericPlaceName(key) || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function normalizeActivityTitle(activity, placeName) {
  const title = String(activity?.title || '').trim();
  if (title && !isPlaceholderPlace(title)) {
    return title;
  }

  if (placeName) {
    return `Visit ${placeName}`;
  }

  const titlesByType = {
    food: 'Meal break',
    rest: 'Rest and recharge',
    transport: 'Travel and check-in',
    shopping: 'Browse local shops',
    experience: 'Local experience',
    nature: 'Outdoor time',
    culture: 'Cultural visit',
    attraction: 'Sightseeing visit',
  };

  return titlesByType[String(activity?.type || '').toLowerCase()] || 'Flexible trip time';
}

function normalizeTripPlanResult(result, input) {
  const source = result && typeof result === 'object' ? result : {};
  const sourceDays = Array.isArray(source.days) ? source.days : [];
  const sourceHasWeakDays = sourceDays.some((day) => !Array.isArray(day?.activities) || day.activities.length < 2);
  if (sourceDays.length !== input.durationDays) {
    throw new Error(`AI trip plan must include exactly ${input.durationDays} day objects.`);
  }

  if (sourceHasWeakDays) {
    throw new Error('AI trip plan must include at least two activities for every day.');
  }

  const normalizedDays = sourceDays
    .sort((left, right) => Number(left?.day) - Number(right?.day))
    .map((day, index) => ({
      ...day,
      day: index + 1,
      estimatedCostRange: normalizeRange(day.estimatedCostRange),
      dayWarnings: toStringArray(day.dayWarnings),
      editSuggestions: toStringArray(day.editSuggestions),
      activities: day.activities.map((activity) => {
        const placeName =
          activity.placeName &&
          !isPlaceholderPlace(activity.placeName) &&
          !isGenericPlaceName(activity.placeName)
            ? String(activity.placeName).trim()
            : undefined;
        const exactPlace = canOpenExactPlace({ ...activity, placeName });

        return {
          ...activity,
          title: normalizeActivityTitle(activity, placeName),
          placeName,
          googleMapsUrl: exactPlace
            ? buildGoogleMapsUrl(placeName, input.destination)
            : undefined,
          nearbySearchUrl: !exactPlace
            ? buildNearbySearchUrl(activity, input.destination)
            : undefined,
          tips: toStringArray(activity.tips),
        };
      }),
    }));

  const mustDo = normalizePlaceList(source.mustDo);
  const mustDoNames = new Set(mustDo.map((place) => place.name.toLowerCase()));
  const optional = normalizePlaceList(source.optional).filter(
    (place) => !mustDoNames.has(place.name.toLowerCase())
  );
  const reservedNames = new Set([
    ...mustDoNames,
    ...optional.map((place) => place.name.toLowerCase()),
  ]);
  const skipIfShortOnTime = normalizePlaceList(source.skipIfShortOnTime).filter(
    (place) => !reservedNames.has(place.name.toLowerCase())
  );
  const sourceBudget = source.budget && typeof source.budget === 'object' ? source.budget : {};

  return {
    ...source,
    destination: source.destination || input.destination,
    durationDays: Number(source.durationDays) || input.durationDays,
    planningConfidenceScore: Math.max(
      0,
      Math.min(100, Number(source.planningConfidenceScore) || 0)
    ),
    tripStyle: Array.isArray(source.tripStyle) ? source.tripStyle : [],
    days: normalizedDays,
    mustDo,
    optional,
    skipIfShortOnTime,
    budget: {
      ...sourceBudget,
      estimatedTotalRange: normalizeRange(sourceBudget.estimatedTotalRange),
      breakdown: Array.isArray(sourceBudget.breakdown)
        ? sourceBudget.breakdown.map((item) => ({
            ...item,
            range: normalizeRange(item.range),
          }))
        : [],
    },
    commonMistakes: Array.isArray(source.commonMistakes) ? source.commonMistakes : [],
    smartEditActions: Array.isArray(source.smartEditActions) ? source.smartEditActions : [],
    practicalInfo: {
      transportationAdvice: toStringArray(source.practicalInfo?.transportationAdvice),
      culturalEtiquette: toStringArray(source.practicalInfo?.culturalEtiquette),
      packingTips: toStringArray(source.practicalInfo?.packingTips),
      sustainabilityTips: toStringArray(source.practicalInfo?.sustainabilityTips),
    },
  };
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function callTripPlanningAI(prompt, options = {}) {
  const requestBody = {
    messages: [
      {
        role: 'system',
        content: "You are TravelBuddy's trip planning engine. Return only valid JSON.",
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_completion_tokens: options.maxTokens || 6500,
    response_format: {
      type: 'json_object',
    },
  };

  const maxAttempts = options.maxAttempts || AI_REQUEST_ATTEMPTS;
  const timeoutMs = options.timeoutMs || AI_GENERATION_TIMEOUT_MS;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(
        `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=${AZURE_API_VERSION}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': AZURE_OPENAI_API_KEY,
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        }
      );

      if (response.ok) {
        const data = await response.json();
        const choice = data?.choices?.[0];
        return {
          text: extractMessageText(choice?.message),
          finishReason: choice?.finish_reason || null,
        };
      }

      const errorText = await response.text();
      const retryable = [408, 429, 500, 502, 503, 504].includes(response.status);
      if (!retryable || attempt === maxAttempts) {
        throw new Error(`AI request failed with status ${response.status}: ${errorText}`);
      }
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new Error(`Trip planning AI request timed out after ${Math.round(timeoutMs / 1000)} seconds.`);
      }

      if (attempt === maxAttempts) {
        throw error;
      }
    } finally {
      clearTimeout(timeout);
    }

    const backoff = 750 * 2 ** (attempt - 1) + Math.floor(Math.random() * 250);
    await wait(backoff);
  }

  throw new Error('Trip planning AI request failed.');
}

async function repairTripPlanJson(rawJson, parseError) {
  const repairPrompt = `Repair the malformed JSON below.

Rules:
- Return one valid JSON object only.
- Preserve all existing travel content and keys.
- Fix syntax only: missing commas, quotes, brackets, braces, or truncated endings.
- Do not add markdown or commentary.
- If the ending is truncated, close the current object and all open arrays/objects with the smallest valid completion.

Parser error:
${parseError.message}

Malformed JSON:
${rawJson}`;

  const repaired = await callTripPlanningAI(repairPrompt, {
    maxTokens: 4500,
    maxAttempts: 1,
    timeoutMs: AI_REPAIR_TIMEOUT_MS,
  });
  if (repaired.finishReason === 'length') {
    throw new Error('AI JSON repair was truncated.');
  }

  return safeParseAIJson(repaired.text);
}

router.post('/generate', async (req, res) => {
  try {
    const input = normalizeTripPlanInput(req.body || {});
    const validationErrors = validateTripPlanInput(input);

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: validationErrors.join(' '),
      });
    }

    if (!AZURE_OPENAI_ENDPOINT || !AZURE_OPENAI_API_KEY || !AZURE_OPENAI_DEPLOYMENT_NAME) {
      return res.status(503).json({
        success: false,
        error: 'Trip planning AI is not configured.',
      });
    }

    const prompt = buildTripPlanPrompt(input);
    let tripPlan;
    let validationError;

    for (let generationAttempt = 1; generationAttempt <= 2; generationAttempt += 1) {
      const correction =
        generationAttempt === 1
          ? ''
          : `\n\nYour previous response failed validation: ${validationError.message}. Return a complete corrected JSON object that follows every schema rule.`;

      try {
        const generation = await callTripPlanningAI(`${prompt}${correction}`, {
          maxTokens: 6500,
          timeoutMs: AI_GENERATION_TIMEOUT_MS,
        });
        if (generation.finishReason === 'length') {
          throw new Error('AI response was truncated before the trip plan was complete.');
        }

        let parsed;
        try {
          parsed = safeParseAIJson(generation.text);
        } catch (parseError) {
          parsed = await repairTripPlanJson(generation.text, parseError);
        }

        tripPlan = normalizeTripPlanResult(parsed, input);
        break;
      } catch (error) {
        if (error instanceof Error && /timed out/i.test(error.message)) {
          throw error;
        }
        validationError = error;
      }
    }

    if (!tripPlan) {
      throw validationError || new Error('Trip planning AI returned an invalid plan.');
    }

    return res.json({
      success: true,
      tripPlan,
      meta: {
        source: 'azure_openai',
      },
    });
  } catch (error) {
    console.error('Trip plan generation failed:', error);
    return res.status(500).json({
      success: false,
      error:
        error instanceof Error && /timed out|truncated|at least two activities|placeholder|JSON|day objects/i.test(error.message)
          ? error.message
          : 'Failed to generate trip plan.',
    });
  }
});

export default router;
