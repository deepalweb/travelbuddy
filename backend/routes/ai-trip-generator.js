import express from 'express';
import { requireSubscription } from '../middleware/subscriptionCheck.js';
import { resolveFreePlaceImage } from '../services/freePlaceImageService.js';

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
      const first = data[0];
      const addressParts = (first.display_name || '').split(',').map((part) => part.trim()).filter(Boolean);
      return {
        lat: parseFloat(first.lat),
        lng: parseFloat(first.lon),
        address: first.display_name || '',
        city: addressParts.length > 2 ? addressParts[addressParts.length - 4] || '' : '',
        country: addressParts.length > 0 ? addressParts[addressParts.length - 1] : '',
      };
    }
  } catch (error) {
    console.error(`Geocode error for ${activityName}:`, error.message);
  }
  return null;
}

async function geocodeDestination(destination) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`;
    const response = await fetch(url, { headers: { 'User-Agent': 'TravelBuddy' } });
    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      const first = data[0];
      return {
        lat: parseFloat(first.lat),
        lng: parseFloat(first.lon),
        address: first.display_name || destination,
      };
    }
  } catch (error) {
    console.error(`Destination geocode error for ${destination}:`, error.message);
  }

  return null;
}

function normalizeComparableText(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function dedupeCandidates(candidates = []) {
  const seen = new Set();
  const deduped = [];

  for (const candidate of candidates) {
    const key = normalizeComparableText(`${candidate.name}|${candidate.address || ''}`);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(candidate);
  }

  return deduped;
}

function scoreCandidate(candidate, destination, type) {
  let score = 0;
  const normalizedName = normalizeComparableText(candidate.name);
  const normalizedDestination = normalizeComparableText(destination);

  if (normalizedDestination && normalizedName.includes(normalizedDestination)) score += 2;
  if (type === 'mustSee') {
    if (candidate.tags?.historic) score += 6;
    if (candidate.tags?.tourism) score += 5;
    if (candidate.tags?.amenity === 'place_of_worship') score += 5;
    if (/museum|temple|stupa|fort|palace|monastery|buddha|dagoba|ruins|viewpoint/.test(normalizedName)) score += 4;
  }

  if (type === 'food') {
    if (candidate.tags?.amenity === 'restaurant') score += 6;
    if (candidate.tags?.amenity === 'cafe') score += 4;
    if (/hotel|guest house|lodging/.test(normalizedName)) score -= 3;
    if (/restaurant|cafe|coffee|kitchen|bistro|rest|eat|dining/.test(normalizedName)) score += 4;
  }

  return score;
}

async function fetchOverpassCandidates({ lat, lng, type, radius = 15000 }) {
  const queryByType = {
    mustSee: `
      (
        node["tourism"~"attraction|museum|viewpoint"]["name"](around:${radius},${lat},${lng});
        way["tourism"~"attraction|museum|viewpoint"]["name"](around:${radius},${lat},${lng});
        node["historic"]["name"](around:${radius},${lat},${lng});
        way["historic"]["name"](around:${radius},${lat},${lng});
        node["amenity"="place_of_worship"]["name"](around:${radius},${lat},${lng});
        way["amenity"="place_of_worship"]["name"](around:${radius},${lat},${lng});
        node["building"="temple"]["name"](around:${radius},${lat},${lng});
        way["building"="temple"]["name"](around:${radius},${lat},${lng});
      );
    `,
    food: `
      (
        node["amenity"~"restaurant|cafe|fast_food|food_court"]["name"](around:${radius},${lat},${lng});
        way["amenity"~"restaurant|cafe|fast_food|food_court"]["name"](around:${radius},${lat},${lng});
      );
    `,
  };

  const overpassQuery = `[out:json][timeout:25];${queryByType[type]}out center tags 80;`;
  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'User-Agent': 'TravelBuddy',
    },
    body: overpassQuery,
  });

  if (!response.ok) {
    throw new Error(`Overpass request failed with ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data?.elements) ? data.elements : [];
}

function formatOverpassCandidates(elements, destination, type) {
  return dedupeCandidates(
    elements
      .map((element) => {
        const lat = element.lat ?? element.center?.lat;
        const lng = element.lon ?? element.center?.lon;
        const tags = element.tags || {};

        if (!tags.name || !lat || !lng) return null;

        return {
          name: tags.name,
          category:
            type === 'food'
              ? tags.amenity || 'restaurant'
              : tags.tourism || tags.historic || tags.amenity || 'attraction',
          address: [tags['addr:street'], tags['addr:city']].filter(Boolean).join(', '),
          city: tags['addr:city'] || destination,
          country: tags['addr:country'] || '',
          coordinates: { lat, lng },
          tags,
        };
      })
      .filter(Boolean)
  )
    .map((candidate) => ({
      ...candidate,
      score: scoreCandidate(candidate, destination, type),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, type === 'food' ? 10 : 12);
}

async function buildGroundingCandidates(destination) {
  const geocoded = await geocodeDestination(destination);
  if (!geocoded) {
    return {
      mustSee: [],
      food: [],
      location: null,
    };
  }

  try {
    const [mustSeeRaw, foodRaw] = await Promise.all([
      fetchOverpassCandidates({ lat: geocoded.lat, lng: geocoded.lng, type: 'mustSee' }),
      fetchOverpassCandidates({ lat: geocoded.lat, lng: geocoded.lng, type: 'food' }),
    ]);

    return {
      mustSee: formatOverpassCandidates(mustSeeRaw, destination, 'mustSee'),
      food: formatOverpassCandidates(foodRaw, destination, 'food'),
      location: geocoded,
    };
  } catch (error) {
    console.error(`Grounding candidate fetch failed for ${destination}:`, error.message);
    return {
      mustSee: [],
      food: [],
      location: geocoded,
    };
  }
}

function formatCandidateListForPrompt(candidates = [], emptyLabel) {
  if (!candidates.length) return emptyLabel;

  return candidates
    .map((candidate, index) => `${index + 1}. ${candidate.name} (${candidate.category}${candidate.address ? `, ${candidate.address}` : ''})`)
    .join('\n');
}

function isGenericMealActivity(activity) {
  const text = normalizeComparableText(`${activity.activityTitle} ${activity.placeName} ${activity.details}`);
  return /breakfast|lunch|dinner|meal/.test(text) && !activity.googlePlaceId && !activity.fullAddress;
}

function isGroupedSightseeingActivity(activity) {
  const text = normalizeComparableText(`${activity.activityTitle} ${activity.placeName}`);
  return /circuit|core circuit|highlights|essentials/.test(text) || (activity.activityTitle?.includes(':') && activity.activityTitle?.includes(','));
}

function isCoverWorthyActivity(activity) {
  const type = normalizeComparableText(activity?.activityType || '');
  const placeName = normalizeComparableText(activity?.placeName || '');
  if (!activity?.imageUrl || activity?.isRepresentativeImage) return false;
  if (/meal|breakfast|lunch|dinner|arrival|transfer|check in|hotel/.test(type)) return false;
  if (/new town|old town|town center|city center|hotel base|downtown/.test(placeName)) return false;
  return true;
}

function applyGroundingRepairs(tripPlan, groundedCandidates, destination) {
  if (!tripPlan?.dailyItinerary?.length) return tripPlan;

  const usedNames = new Set();
  const mustSeeQueue = [...(groundedCandidates.mustSee || [])];
  const foodQueue = [...(groundedCandidates.food || [])];

  const takeNextUnused = (queue) => {
    while (queue.length > 0) {
      const candidate = queue.shift();
      const key = normalizeComparableText(candidate.name);
      if (!usedNames.has(key)) {
        usedNames.add(key);
        return candidate;
      }
    }
    return null;
  };

  for (const day of tripPlan.dailyItinerary) {
    for (const activity of day.activities || []) {
      const existingPlaceKey = normalizeComparableText(activity.placeName || activity.activityTitle);
      if (existingPlaceKey) usedNames.add(existingPlaceKey);

      const isMeal = /breakfast|lunch|dinner|food|restaurant|cafe/.test(normalizeComparableText(activity.activityType || activity.activityTitle));
      if (isMeal && isGenericMealActivity(activity)) {
        const candidate = takeNextUnused(foodQueue);
        if (candidate) {
          activity.placeName = candidate.name;
          activity.activityTitle = `${activity.activityTitle?.split(':')[0] || 'Meal'} at ${candidate.name}`;
          activity.city = candidate.city || destination;
          activity.country = candidate.country || '';
          activity.fullAddress = candidate.address || '';
        }
      }

      if (!isMeal && isGroupedSightseeingActivity(activity)) {
        const candidate = takeNextUnused(mustSeeQueue);
        if (candidate) {
          activity.placeName = candidate.name;
          activity.activityTitle = `Visit ${candidate.name}`;
          activity.city = candidate.city || destination;
          activity.country = candidate.country || '';
          activity.fullAddress = candidate.address || '';
        }
      }
    }
  }

  if ((!tripPlan.tripOverview?.keyAttractions || tripPlan.tripOverview.keyAttractions.length < 4) && groundedCandidates.mustSee?.length) {
    tripPlan.tripOverview.keyAttractions = groundedCandidates.mustSee.slice(0, 8).map((candidate) => candidate.name);
  }

  return tripPlan;
}

function getActivitySearchText(activity) {
  return normalizeComparableText(
    [
      activity?.activityTitle,
      activity?.placeName,
      activity?.details,
      activity?.fullAddress,
      activity?.city,
      activity?.country,
    ].filter(Boolean).join(' ')
  );
}

function candidateMentionedInTrip(tripPlan, candidateName) {
  const normalizedCandidate = normalizeComparableText(candidateName);
  if (!normalizedCandidate) {
    return false;
  }

  for (const day of tripPlan?.dailyItinerary || []) {
    for (const activity of day.activities || []) {
      const text = getActivitySearchText(activity);
      if (text.includes(normalizedCandidate)) {
        return true;
      }
    }
  }

  return false;
}

function scoreTripPlanQuality(tripPlan, groundedCandidates) {
  const mustSeeCandidates = groundedCandidates?.mustSee || [];
  const foodCandidates = groundedCandidates?.food || [];
  const mustSeeCoverage = mustSeeCandidates.filter((candidate) => candidateMentionedInTrip(tripPlan, candidate.name));
  const foodCoverage = foodCandidates.filter((candidate) => candidateMentionedInTrip(tripPlan, candidate.name));
  const allActivities = tripPlan?.dailyItinerary?.flatMap((day) => day.activities || []) || [];
  const genericMealCount = allActivities.filter((activity) => {
    const text = normalizeComparableText(`${activity.activityType} ${activity.activityTitle}`);
    return /breakfast|lunch|dinner|meal|food|cafe|restaurant/.test(text) && isGenericMealActivity(activity);
  }).length;
  const groupedSightseeingCount = allActivities.filter((activity) => isGroupedSightseeingActivity(activity)).length;
  const weakPlaceCount = allActivities.filter((activity) => {
    const placeName = normalizeComparableText(activity.placeName || '');
    return !placeName || /new town|hotel base|local area/.test(placeName) || placeName === 'planned activity';
  }).length;

  let score = 100;
  if (mustSeeCandidates.length > 0) {
    score -= Math.max(0, mustSeeCandidates.length - mustSeeCoverage.length) * 8;
  }
  if (foodCandidates.length > 0) {
    score -= Math.max(0, Math.min(3, foodCandidates.length) - Math.min(3, foodCoverage.length)) * 6;
  }
  score -= genericMealCount * 10;
  score -= groupedSightseeingCount * 12;
  score -= weakPlaceCount * 6;

  return {
    score: Math.max(0, Math.min(100, score)),
    mustSeeCoverage,
    foodCoverage,
    genericMealCount,
    groupedSightseeingCount,
    weakPlaceCount,
    needsRepair:
      genericMealCount > 0 ||
      groupedSightseeingCount > 0 ||
      weakPlaceCount > 1 ||
      (mustSeeCandidates.length > 0 && mustSeeCoverage.length < Math.min(4, mustSeeCandidates.length)),
  };
}

function buildTripRepairPrompt({
  tripPlan,
  destination,
  days,
  currency,
  groundedCandidates,
  qualityReport,
}) {
  const mustSeeCandidates = formatCandidateListForPrompt(
    groundedCandidates?.mustSee?.slice(0, 10),
    'No verified must-see candidates were retrieved.'
  );
  const foodCandidates = formatCandidateListForPrompt(
    groundedCandidates?.food?.slice(0, 8),
    'No verified food candidates were retrieved.'
  );

  return `Repair this ${days}-day trip plan for ${destination}. Return JSON only with these keys: tripOverview, dailyItinerary.

Current quality issues:
- Overall quality score: ${qualityReport.score}
- Verified must-see places already covered: ${qualityReport.mustSeeCoverage.length}
- Verified food places already covered: ${qualityReport.foodCoverage.length}
- Generic meal activities: ${qualityReport.genericMealCount}
- Grouped sightseeing blocks: ${qualityReport.groupedSightseeingCount}
- Weak place naming issues: ${qualityReport.weakPlaceCount}

Verified must-see candidates:
${mustSeeCandidates}

Verified food candidates:
${foodCandidates}

Existing trip JSON:
${JSON.stringify({ tripOverview: tripPlan.tripOverview, dailyItinerary: tripPlan.dailyItinerary })}

Repair rules:
- Rewrite weak activities so each important sightseeing stop is a specific named place.
- Replace generic breakfast, lunch, dinner, or cafe stops with named places from the verified food list when possible.
- Do not use grouped labels like "core circuit", "highlights", "essentials", or "budget dinner near hotel".
- Cover at least 4 verified must-see places across the itinerary when available.
- Keep one real place per activity whenever possible.
- Keep the number of days exactly ${days}.
- Preserve the same currency style (${currency || 'USD'}) and overall budget tone.
- tripOverview.keyAttractions must be a list of real place names, not generic phrases.
- Keep the structure concise and realistic.`;
}

function inferTripMood({ interests, travelStyles, travelStyle, notes }) {
  const parts = [
    ...(Array.isArray(interests) ? interests : typeof interests === 'string' ? interests.split(',') : []),
    travelStyles,
    travelStyle,
    notes,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const moods = [];
  if (/romantic|couple|honeymoon/.test(parts)) moods.push('romantic');
  if (/culture|history|temple|heritage|museum/.test(parts)) moods.push('cultural');
  if (/relax|calm|slow|easy|gentle/.test(parts)) moods.push('relaxed');
  if (/food|dining|cafe/.test(parts)) moods.push('food-aware');
  if (/adventure|hike|wildlife|safari/.test(parts)) moods.push('adventurous');

  return moods.length > 0 ? moods.join(', ') : 'balanced and practical';
}

function buildPresentationPolishPrompt({ tripPlan, destination, days, mood }) {
  return `Polish this ${days}-day trip plan for ${destination}. Return JSON only with these keys: tripOverview, dailyItinerary.

Mood to express:
- ${mood}

Existing trip JSON:
${JSON.stringify({ tripOverview: tripPlan.tripOverview, dailyItinerary: tripPlan.dailyItinerary })}

Polish rules:
- Improve readability and make the wording feel warm, premium, and scannable.
- Do not invent new places or remove existing places.
- Keep every activity tied to the same placeName already present in the itinerary.
- Every activityTitle must include the real place name exactly or begin with a clear meal format like "Lunch at PLACE".
- Prefer direct titles like "Visit Jaya Sri Maha Bodhi" over vague titles like "Experience the city's holiest shrine".
- Keep details to one or two concise sentences.
- Keep day themes short and readable.
- Keep tripOverview.summaryHeadline compact and appealing.
- Preserve the existing structure, order, and budget tone.`;
}

function buildCompactTripGenerationPrompt(basePrompt) {
  return `${basePrompt}

Compression rules for this retry:
- Keep every string concise.
- Limit introduction to 2 short sentences.
- Limit each routeStrategy, whyThisTripFits, tradeoffs, bookingPriority, saveMoneyTips, and upgradeIdeas item to one short sentence.
- Keep each activity details field to one concise sentence.
- Keep notes and weather guidance brief but useful.
- Do not omit required keys.`;
}

async function generateWithAzureModel(prompt, options = {}) {
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
    maxTokens: options.maxTokens || 5200,
    reasoningEffort: 'low',
    responseFormat: { type: 'json_object' }
  });

  return {
    provider: 'azure-foundry',
    ...result
  };
}

function parseJsonFromModelText(text) {
  let jsonText = text.trim();

  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('AI response does not contain valid JSON');
  }

  return JSON.parse(jsonMatch[0]);
}

function looksLikeMealActivity(activity) {
  const text = normalizeComparableText(`${activity?.activityType || ''} ${activity?.activityTitle || ''}`);
  return /breakfast|lunch|dinner|meal|restaurant|cafe|food|brunch/.test(text);
}

function toTitleCase(value = '') {
  return String(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function buildDeterministicActivityTitle(activity) {
  const placeName = activity?.placeName || activity?.activityTitle || 'Planned stop';
  const type = normalizeComparableText(activity?.activityType || '');
  const title = normalizeComparableText(activity?.activityTitle || '');

  if (looksLikeMealActivity(activity)) {
    if (/breakfast/.test(title)) return `Breakfast at ${placeName}`;
    if (/brunch/.test(title)) return `Brunch at ${placeName}`;
    if (/dinner/.test(title)) return `Dinner at ${placeName}`;
    if (/cafe/.test(type)) return `Cafe stop at ${placeName}`;
    return `Lunch at ${placeName}`;
  }

  if (/sunset|lake|reservoir|wewa|promenade/.test(type) || /sunset/.test(title)) {
    return `Sunset stop at ${placeName}`;
  }

  if (/viewpoint|pilgrimage/.test(type)) {
    return `Visit ${placeName}`;
  }

  if (/temple|stupa|statue|monastery|archaeological|sacred|sightseeing|museum|site|ruins/.test(type)) {
    return `Visit ${placeName}`;
  }

  return activity?.activityTitle && normalizeComparableText(activity.activityTitle).includes(normalizeComparableText(placeName))
    ? activity.activityTitle
    : `Visit ${placeName}`;
}

function enforcePresentationConsistency(tripPlan) {
  if (!tripPlan?.dailyItinerary?.length) {
    return tripPlan;
  }

  for (const day of tripPlan.dailyItinerary) {
    if (day.theme) {
      day.theme = day.theme.trim();
    }

    for (const activity of day.activities || []) {
      activity.activityTitle = buildDeterministicActivityTitle(activity);

      if (typeof activity.details === 'string' && activity.details.trim()) {
        const trimmed = activity.details.trim();
        activity.details = trimmed.length > 240 ? `${trimmed.slice(0, 237).trim()}...` : trimmed;
      }
    }
  }

  if (tripPlan.tripOverview?.summaryHeadline) {
    tripPlan.tripOverview.summaryHeadline = tripPlan.tripOverview.summaryHeadline.trim();
  }

  return tripPlan;
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
  avoid,
  startingLocation,
  transportPreference,
  stayPreference,
  selectedPlaces,
  groundedCandidates
}) {
  const interestList = Array.isArray(interests)
    ? interests.filter(Boolean)
    : typeof interests === 'string'
      ? interests.split(',').map((item) => item.trim()).filter(Boolean)
      : [];

  const hasInterests = interestList.length > 0;
  const travelMode = travelStyles || travelStyle || 'balanced';
  const selectedPlaceNames = Array.isArray(selectedPlaces)
    ? selectedPlaces
      .map((place) => place?.name || place?.title || '')
      .filter(Boolean)
      .join(', ')
    : '';
  const mustSeeCandidates = formatCandidateListForPrompt(
    groundedCandidates?.mustSee,
    'No verified must-see candidates were retrieved.'
  );
  const foodCandidates = formatCandidateListForPrompt(
    groundedCandidates?.food,
    'No verified food candidates were retrieved.'
  );

  return `Create a premium-quality ${days} day trip plan for ${destination} and return JSON only.

Trip inputs:
- Starting location: ${startingLocation || 'Not specified'}
- Travel style: ${travelMode}
- Pace: ${pace || 'moderate'}
- Budget: ${budget || 'medium'}
- Travelers: ${travelers || '1'}
- Start date: ${startDate || 'Flexible'}
- End date: ${endDate || 'Flexible'}
- Currency: ${currency || 'USD'}
- Transport preference: ${transportPreference || 'balanced'}
- Stay preference: ${stayPreference || 'comfortable'}
- Interests: ${hasInterests ? interestList.join(', ') : 'General highlights'}
- Must-see priorities: ${mustSee?.length ? mustSee.join(', ') : 'None specified'}
- Avoid: ${avoid?.length ? avoid.join(', ') : 'None specified'}
- Imported planning anchors: ${selectedPlaceNames || 'None'}
- Notes: ${notes || 'None'}
- Verified must-see candidates:
${mustSeeCandidates}
- Verified food candidates:
${foodCandidates}

Planning rules:
- Each day must have 3 to 5 activities.
- Prioritize iconic highlights and realistic travel flow.
- Keep advice specific, practical, and personalized to the trip inputs.
- Make costs and hotels realistic for the selected budget and traveler count.
- Include food suggestions where appropriate.
- Respect the avoid list.
- Explain route logic and major tradeoffs.
- Avoid generic filler unless it supports pacing, food timing, transport flow, or rest.
- The total estimated budget must be internally consistent with the expense breakdown.
- Hotel recommendations should be areas or hotel-base suggestions, not just city names when possible.
- Use the verified must-see candidate list heavily for sightseeing when it is available.
- Use the verified food candidate list for breakfast, lunch, dinner, or cafe stops when it is available.
- Mention actual named places instead of unnamed meal stops.
- Prefer one real place per activity. Do not bundle 4 important attractions into one activity unless it is clearly a transfer block.
- Cover at least 2 named must-see places per full sightseeing day when possible.
- If verified food candidates exist, lunch and dinner should normally be real named venues.
- keyAttractions must contain real place names that appear inside the itinerary.

Return JSON only with these keys:
tripTitle, destination, duration, introduction, tripOverview, dailyItinerary, expenseBreakdown, preTripPreparation

For dailyItinerary, return an array of ${days} day objects with:
- day
- theme
- dayGoal
- energyLevel
- estimatedTravelTime
- estimatedDayCost
- mustDo
- optionalAddOn
- weatherBackup
- activities
- overnight

Each activity must include:
- timeSlot
- activityType
- activityTitle
- placeName
- city
- country
- details
- cost
- notes
- estimatedDuration
- priority
- travelNote

Critical place-quality rules:
- Use real, recognizable place names whenever possible.
- Prefer famous landmarks, real restaurants, real districts, real museums, real beaches, and real temples over generic labels.
- Do not use vague activity titles like "Explore local area" unless absolutely necessary.
- Avoid labels like "core circuit", "highlights", "essentials", "budget dinner near the hotel", or "local lunch" unless no real place is available.
- If the stop is a real place, set placeName to the real searchable place name.
- city and country must match the placeName when known.
- If you mention a market, shrine, fort, museum, or restaurant, prefer an actual named one.

For tripOverview, return:
- totalTravelDays
- summaryHeadline
- whyThisTripFits
- routeStrategy
- tradeoffs
- keyAttractions
- transportSummary
- hotels
- estimatedTotalBudget
- budgetPerDay
- tripStyle
- bestFor
- accommodationType
- bookingPriority
- saveMoneyTips
- upgradeIdeas
- paceScore
- travelEfficiency
- startingLocation
- transportPreference
- stayPreference

For expenseBreakdown, return:
- accommodation
- transport
- tickets
- dining
- localTransport
- total

For preTripPreparation, return:
booking, packing, weather, notes

Output must be compact valid JSON with no markdown or commentary.`;
}

function toCostString(value, fallback = 'Estimate pending') {
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

function normalizeStringField(value, fallback = '') {
  if (typeof value === 'string') {
    return value.trim() || fallback;
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((item) => {
        if (typeof item === 'string') {
          return item.trim();
        }

        if (item && typeof item === 'object') {
          const candidate = item.text || item.note || item.description || item.title;
          return typeof candidate === 'string' ? candidate.trim() : '';
        }

        return '';
      })
      .filter(Boolean);

    return parts.length > 0 ? parts.join(' ') : fallback;
  }

  if (value && typeof value === 'object') {
    const parts = Object.values(value)
      .filter((item) => typeof item === 'string' && item.trim())
      .map((item) => item.trim());

    if (parts.length > 0) {
      return parts.join(' ');
    }
  }

  return fallback;
}

function formatTransportSummary(value, fallback = 'Transport plan to be confirmed') {
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
      price: 'Rate to be confirmed',
      note: `Suggested overnight base for Day ${dayNumber}`
    };
  }

  if (overnight && typeof overnight === 'object') {
    return {
      name: overnight.name || overnight.hotel || overnight.city || fallbackDestination,
      price: overnight.price || overnight.estimatedNightlyCost || 'Rate to be confirmed',
      note: overnight.note || 'Suggested overnight stay'
    };
  }

  return {
    name: fallbackDestination,
    price: 'Rate to be confirmed',
    note: `Suggested overnight base for Day ${dayNumber}`
  };
}

function normalizeActivity(activity, destination) {
  const activityTitle = activity?.activityTitle || activity?.title || activity?.name || 'Stop to be confirmed';
  const placeName = activity?.placeName || activity?.place || activity?.locationName || activityTitle;

  return {
    timeSlot: activity?.timeSlot || activity?.time || 'Flexible',
    activityType: activity?.activityType || activity?.type || 'Activity',
    activityTitle,
    placeName,
    city: activity?.city || '',
    country: activity?.country || '',
    details: activity?.details || activity?.description || '',
    cost: toCostString(activity?.cost, 'Estimate pending'),
    notes: activity?.notes || activity?.tip || '',
    estimatedDuration: activity?.estimatedDuration || activity?.duration || '',
    priority: activity?.priority || '',
    travelNote: activity?.travelNote || activity?.transferNote || '',
    imageUrl: activity?.imageUrl || '',
    imageSource: activity?.imageSource || '',
    isRepresentativeImage: activity?.isRepresentativeImage || false,
    googleMapsUrl: activity?.googleMapsUrl || '',
    fullAddress: activity?.fullAddress || '',
    googlePlaceId: activity?.googlePlaceId || ''
  };
}

function extractNumericCost(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const numeric = parseFloat(value.replace(/[^0-9.]/g, ''));
    return Number.isFinite(numeric) ? numeric : 0;
  }

  if (value && typeof value === 'object') {
    if (typeof value.amount === 'number' && Number.isFinite(value.amount)) {
      return value.amount;
    }

    for (const item of Object.values(value)) {
      const numeric = extractNumericCost(item);
      if (numeric > 0) {
        return numeric;
      }
    }
  }

  return 0;
}

function formatCurrencyAmount(amount, currency = 'USD') {
  return `${currency} ${Math.round(amount || 0)}`;
}

function normalizeDayEntry(day, index, destination) {
  return {
    day: day?.day || index + 1,
    date: day?.date || `Day ${day?.day || index + 1}`,
    theme: day?.theme || day?.title || day?.location || `Day ${day?.day || index + 1} Highlights`,
    dayGoal: day?.dayGoal || '',
    energyLevel: day?.energyLevel || '',
    estimatedTravelTime: day?.estimatedTravelTime || '',
    estimatedDayCost: toCostString(day?.estimatedDayCost, ''),
    mustDo: day?.mustDo || '',
    optionalAddOn: day?.optionalAddOn || '',
    weatherBackup: day?.weatherBackup || '',
    activities: (day?.activities || []).map((activity) => normalizeActivity(activity, destination)),
    overnight: normalizeOvernightStay(day?.overnight, day?.location || destination, day?.day || index + 1)
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
    avoid,
    currency,
    startingLocation,
    transportPreference,
    stayPreference
  } = context;

  const dailyItinerary = (rawTripPlan.dailyItinerary || []).map((day, index) => normalizeDayEntry(day, index, destination));

  const fixedAccommodation = toCostString(rawTripPlan.expenseBreakdown?.accommodation, '$0');
  const fixedTransport = toCostString(rawTripPlan.expenseBreakdown?.transport, '$0');
  const fixedTickets = toCostString(rawTripPlan.expenseBreakdown?.tickets, '$0');
  const variableDining = toCostString(rawTripPlan.expenseBreakdown?.dining, '$0');
  const variableLocalTransport = toCostString(rawTripPlan.expenseBreakdown?.localTransport, '$0');
  const accommodationValue = extractNumericCost(rawTripPlan.expenseBreakdown?.accommodation);
  const transportValue = extractNumericCost(rawTripPlan.expenseBreakdown?.transport);
  const ticketsValue = extractNumericCost(rawTripPlan.expenseBreakdown?.tickets);
  const diningValue = extractNumericCost(rawTripPlan.expenseBreakdown?.dining);
  const localTransportValue = extractNumericCost(rawTripPlan.expenseBreakdown?.localTransport);
  const computedTotal = accommodationValue + transportValue + ticketsValue + diningValue + localTransportValue;
  const totalCost = computedTotal > 0
    ? formatCurrencyAmount(computedTotal, currency || 'USD')
    : toCostString(
      rawTripPlan.expenseBreakdown?.total || rawTripPlan.estimatedTotalBudget,
      '$0'
    );

  const hotelList = Array.isArray(rawTripPlan.hotels)
    ? rawTripPlan.hotels.map(formatHotelEntry).filter(Boolean)
    : [];
  const budgetPerDay = computedTotal > 0
    ? formatCurrencyAmount(computedTotal / Math.max(days, 1), currency || 'USD')
    : (rawTripPlan.tripOverview?.budgetPerDay || '');

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
    coverImageUrl: rawTripPlan.coverImageUrl || '',
    introduction: rawTripPlan.introduction || `Explore the best of ${destination} with a well-paced itinerary.`,
    tripOverview: {
      totalTravelDays: rawTripPlan.tripOverview?.totalTravelDays || rawTripPlan.duration || `${days} days`,
      summaryHeadline: rawTripPlan.tripOverview?.summaryHeadline || `${destination} highlights in ${days} days`,
      whyThisTripFits: normalizeStringArray(rawTripPlan.tripOverview?.whyThisTripFits, [
        `Built for ${travelers || '1'} traveler${String(travelers || '1') === '1' ? '' : 's'}`,
        `Balanced around a ${budget || 'medium'} budget`,
        `Matches a ${travelStyles || travelStyle || 'balanced'} trip style`
      ]),
      routeStrategy: normalizeStringArray(rawTripPlan.tripOverview?.routeStrategy, [
        'The route is organized to reduce backtracking',
        'Longer transfers are paired with lighter sightseeing windows',
        'Major highlights are spread across the trip to keep the pace realistic'
      ]),
      tradeoffs: normalizeStringArray(rawTripPlan.tripOverview?.tradeoffs, [
        'Short trips prioritize major highlights over deeper local exploration',
        'Comfort-focused transport may cost more but protects limited time'
      ]),
      keyAttractions: normalizeStringArray(rawTripPlan.tripOverview?.keyAttractions || rawTripPlan.keyAttractions, []),
      transportSummary: formatTransportSummary(
        rawTripPlan.tripOverview?.transportSummary || rawTripPlan.transportSummary,
        'Transport plan to be confirmed'
      ),
      hotels: normalizeStringArray(rawTripPlan.tripOverview?.hotels, hotelList),
      estimatedTotalBudget: toCostString(
        totalCost || rawTripPlan.tripOverview?.estimatedTotalBudget || rawTripPlan.estimatedTotalBudget,
        totalCost
      ),
      budgetPerDay,
      tripStyle: rawTripPlan.tripOverview?.tripStyle || `${budget || 'medium'} ${travelStyles || travelStyle || 'balanced'} trip`,
      bestFor: normalizeStringArray(rawTripPlan.tripOverview?.bestFor, ['First-time visitors']),
      accommodationType: rawTripPlan.tripOverview?.accommodationType || 'Stay style to be confirmed',
      bookingPriority: normalizeStringArray(rawTripPlan.tripOverview?.bookingPriority, [
        'Accommodation',
        'Primary transport',
        'Any timed tickets or tours'
      ]),
      saveMoneyTips: normalizeStringArray(rawTripPlan.tripOverview?.saveMoneyTips, [
        'Compare transport options before booking',
        'Balance higher-cost stops with simpler meals'
      ]),
      upgradeIdeas: normalizeStringArray(rawTripPlan.tripOverview?.upgradeIdeas, [
        'Upgrade one stay for a stronger finale',
        'Add a private transfer on the longest travel day'
      ]),
      paceScore: rawTripPlan.tripOverview?.paceScore || '',
      travelEfficiency: rawTripPlan.tripOverview?.travelEfficiency || '',
      startingLocation: rawTripPlan.tripOverview?.startingLocation || startingLocation || '',
      transportPreference: rawTripPlan.tripOverview?.transportPreference || transportPreference || '',
      stayPreference: rawTripPlan.tripOverview?.stayPreference || stayPreference || ''
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
      booking: normalizeStringArray(rawTripPlan.preTripPreparation?.booking, []),
      packing: normalizeStringArray(rawTripPlan.preTripPreparation?.packing, []),
      weather: normalizeStringField(
        rawTripPlan.preTripPreparation?.weather,
        'Forecast details were not generated.'
      ),
      notes: normalizeStringArray(rawTripPlan.preTripPreparation?.notes, [])
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
      travelStyle,
      startingLocation,
      transportPreference,
      stayPreference,
      selectedPlaces
    } = req.body;

    if (!destination || !duration) {
      return res.status(400).json({ error: 'Destination and duration are required' });
    }

    const days = parseInt(duration.match(/(\d+)/)?.[1] || '3');
    const groundedCandidates = await buildGroundingCandidates(destination);

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
      avoid,
      startingLocation,
      transportPreference,
      stayPreference,
      selectedPlaces,
      groundedCandidates
    });
    const tripMood = inferTripMood({
      interests,
      travelStyles,
      travelStyle,
      notes,
    });

    console.log('🗺️ Generating trip plan for:', destination, duration);

    let generation = await generateWithAzureModel(prompt, { maxTokens: 5200 });

    if (generation.finishReason === 'length') {
      console.warn('⚠️ Trip generation hit token limit, retrying with compact prompt');
      generation = await generateWithAzureModel(buildCompactTripGenerationPrompt(prompt), { maxTokens: 5200 });
    }

    const text = generation.text;

    if (!text.trim()) {
      console.error('❌ Azure Foundry returned empty content');
      console.error('Finish reason:', generation.finishReason);
      console.error('Usage:', generation.usage);
      throw new Error(`Azure Foundry returned empty content (finish_reason=${generation.finishReason || 'unknown'})`);
    }

    let tripPlan;
    try {
      // Parse and normalize the AI response into the richer app-specific shape
      tripPlan = normalizeGeneratedTripPlan(parseJsonFromModelText(text), {
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
        avoid,
        currency,
        startingLocation,
        transportPreference,
        stayPreference
      });
      tripPlan = applyGroundingRepairs(tripPlan, groundedCandidates, destination);

      const qualityReport = scoreTripPlanQuality(tripPlan, groundedCandidates);
      if (qualityReport.needsRepair) {
        console.log('🛠️ Running trip quality repair pass:', qualityReport);
        try {
          const repairGeneration = await generateWithAzureModel(
            buildTripRepairPrompt({
              tripPlan,
              destination,
              days,
              currency,
              groundedCandidates,
              qualityReport,
            }),
            { maxTokens: 3600 }
          );
          const repairedData = parseJsonFromModelText(repairGeneration.text);

          if (repairedData.tripOverview) {
            tripPlan.tripOverview = {
              ...tripPlan.tripOverview,
              ...repairedData.tripOverview,
              keyAttractions: normalizeStringArray(
                repairedData.tripOverview.keyAttractions,
                tripPlan.tripOverview.keyAttractions
              ),
            };
          }

          if (Array.isArray(repairedData.dailyItinerary) && repairedData.dailyItinerary.length > 0) {
            tripPlan.dailyItinerary = repairedData.dailyItinerary.map((day, index) =>
              normalizeDayEntry(day, index, destination)
            );
          }

          tripPlan = applyGroundingRepairs(tripPlan, groundedCandidates, destination);
        } catch (repairError) {
          console.warn('⚠️ Trip repair pass failed, keeping primary grounded draft:', repairError.message);
        }
      }

      try {
        const polishGeneration = await generateWithAzureModel(
          buildPresentationPolishPrompt({
            tripPlan,
            destination,
            days,
            mood: tripMood,
          }),
          { maxTokens: 2800 }
        );
        const polishedData = parseJsonFromModelText(polishGeneration.text);

        if (polishedData.tripOverview) {
          tripPlan.tripOverview = {
            ...tripPlan.tripOverview,
            ...polishedData.tripOverview,
            keyAttractions: normalizeStringArray(
              polishedData.tripOverview.keyAttractions,
              tripPlan.tripOverview.keyAttractions
            ),
          };
        }

        if (Array.isArray(polishedData.dailyItinerary) && polishedData.dailyItinerary.length > 0) {
          tripPlan.dailyItinerary = polishedData.dailyItinerary.map((day, index) =>
            normalizeDayEntry(day, index, destination)
          );
        }
      } catch (polishError) {
        console.warn('⚠️ Presentation polish pass failed, keeping grounded draft:', polishError.message);
      }

      tripPlan = enforcePresentationConsistency(tripPlan);

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
          const activityLookupName = activity.placeName || activity.activityTitle;

          if (!activity.coordinates) {
            const result = await geocodeActivity(activityLookupName, destination);
            if (result) {
              activity.coordinates = { lat: result.lat, lng: result.lng };
              activity.location = `${result.lat},${result.lng}`;
              if (result.placeId) activity.googlePlaceId = result.placeId;
              if (result.address) activity.fullAddress = result.address;
              if (result.city) activity.city = result.city;
              if (result.country) activity.country = result.country;
            }
          }

          // Accumulate dining costs for validation
          if (activity.activityType?.toLowerCase().includes('dining') || activity.activityTitle?.toLowerCase().includes('lunch') || activity.activityTitle?.toLowerCase().includes('dinner')) {
            const costStr = activity.cost || '$0';
            const costValue = parseFloat(costStr.replace(/[^0-9.]/g, '')) || 0;
            calculatedDiningTotal += costValue;
          }

          // 2. Individual Google Maps URL Sanitization
          if (activityLookupName) {
            const cleanTitle = activityLookupName
              .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F30B}-\u{1F320}\u{1F400}-\u{1F4FF}\u{1F900}-\u{1F9FF}\u{1F3FB}-\u{1F3FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
              .replace(/['"“”‘’]/g, '')
              .trim();

            const encodedQuery = encodeURIComponent(`${cleanTitle}, ${activity.city || destination}, ${activity.country || ''}`).replace(/%20/g, '+');
            activity.googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
            if (!activity.imageUrl) {
              const imageResult = await resolveFreePlaceImage({
                name: cleanTitle,
                category: activity.activityType || 'attraction',
                city: activity.city || destination,
                country: activity.country || '',
              });
              activity.imageUrl = imageResult.image;
              activity.imageSource = imageResult.imageSource;
              activity.isRepresentativeImage = imageResult.isRepresentative;
            }
          }
        }
      }

      if (!tripPlan.coverImageUrl) {
        const leadActivityImage = tripPlan.dailyItinerary
          ?.flatMap((day) => day.activities || [])
          .find((activity) => isCoverWorthyActivity(activity));

        if (leadActivityImage?.imageUrl) {
          tripPlan.coverImageUrl = leadActivityImage.imageUrl;
          tripPlan.coverImageSource = leadActivityImage.imageSource || 'activity-image';
          tripPlan.coverIsRepresentativeImage = false;
        } else {
          const coverImageResult = await resolveFreePlaceImage({
            name: destination,
            category: tripPlan.dailyItinerary?.[0]?.activities?.[0]?.activityType || 'attraction',
            city: destination,
            country: '',
          });
          tripPlan.coverImageUrl = coverImageResult.image;
          tripPlan.coverImageSource = coverImageResult.imageSource;
          tripPlan.coverIsRepresentativeImage = coverImageResult.isRepresentative;
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
