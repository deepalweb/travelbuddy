import { isPlaceholderPlace, isGenericPlaceName } from './placeNameFilters.js';
import { toStringArray } from './textUtils.js';
import { normalizeSmartEditActions } from './smartEdit.js';
import { GROUNDABLE_TYPES } from '../googlePlaces/tripPlaceGrounding.js';

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

function buildGoogleMapsUrlFromPlaceId(placeId) {
  return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
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

function fallbackTimeWindow(timeOfDay = '', index = 0) {
  const windowsByTimeOfDay = {
    morning: ['09:00-11:00', '11:00-12:30'],
    afternoon: ['13:30-15:30', '15:30-17:00'],
    evening: ['17:30-19:00', '19:00-21:00'],
    night: ['20:00-22:00', '22:00-23:30'],
  };
  const windows = windowsByTimeOfDay[String(timeOfDay || '').toLowerCase()] || ['Flexible'];
  return windows[Math.min(index, windows.length - 1)];
}

function normalizeActivityAdvice(activity = {}, day = {}, activityIndex = 0) {
  const title = String(activity.title || '').trim() || 'this stop';
  const timeWindow = String(activity.timeWindow || '').trim() || fallbackTimeWindow(activity.timeOfDay, activityIndex);
  const costNote =
    String(activity.costNote || '').trim() ||
    (day.estimatedCostRange ? `Included in the day's ${day.estimatedCostRange} estimate.` : 'Cost depends on local choices.');
  const transportAdvice =
    String(activity.transportAdvice || '').trim() ||
    (activity.travelTimeFromPrevious
      ? `Allow ${activity.travelTimeFromPrevious} from the previous stop.`
      : `Use the most practical local transport option for ${title}.`);

  return {
    timeWindow,
    costNote,
    transportAdvice,
  };
}

// --- Grounding cross-check -------------------------------------------------

function buildCandidateIndex(grounding) {
  const index = new Map();
  for (const group of grounding?.candidatesByType || []) {
    for (const candidate of group.candidates || []) {
      const key = String(candidate.name || '').trim().toLowerCase();
      if (key && !index.has(key)) {
        index.set(key, candidate);
      }
    }
  }
  return index;
}

function matchGroundingCandidate(placeName, candidateIndex) {
  if (!placeName) return null;
  const key = String(placeName).trim().toLowerCase();
  return candidateIndex.get(key) || null;
}

function applyGroundingToActivity(activity, candidateIndex) {
  const type = String(activity?.type || '').toLowerCase();
  if (!GROUNDABLE_TYPES.includes(type) || !activity.placeName) {
    return activity;
  }

  const match = matchGroundingCandidate(activity.placeName, candidateIndex);
  if (!match) {
    return { ...activity, groundingSource: 'ai_estimated' };
  }

  return {
    ...activity,
    fullAddress: match.address || activity.fullAddress,
    googleMapsUrl: match.placeId ? buildGoogleMapsUrlFromPlaceId(match.placeId) : activity.googleMapsUrl,
    googlePlaceId: match.placeId || undefined,
    geometry: match.geometry || undefined,
    rating: match.rating ?? undefined,
    userRatingsTotal: match.userRatingsTotal ?? undefined,
    priceLevel: match.priceLevel ?? undefined,
    photoReference: match.photoReference || undefined,
    groundingSource: 'verified',
  };
}

function applyGroundingToPriorityPlace(place, candidateIndex, destination) {
  const match = matchGroundingCandidate(place.name, candidateIndex);
  if (!match) {
    return place;
  }

  return {
    ...place,
    googleMapsUrl: match.placeId ? buildGoogleMapsUrlFromPlaceId(match.placeId) : buildGoogleMapsUrl(place.name, destination),
    rating: match.rating ?? undefined,
    groundingSource: 'verified',
  };
}

export function normalizeTripPlanResult(result, input, grounding) {
  const source = result && typeof result === 'object' ? result : {};
  const sourceDays = Array.isArray(source.days) ? source.days : [];
  const sourceHasWeakDays = sourceDays.some((day) => !Array.isArray(day?.activities) || day.activities.length < 2);
  if (sourceDays.length !== input.durationDays) {
    throw new Error(`AI trip plan must include exactly ${input.durationDays} day objects.`);
  }

  if (sourceHasWeakDays) {
    throw new Error('AI trip plan must include at least two activities for every day.');
  }

  const candidateIndex = buildCandidateIndex(grounding);

  const normalizedDays = sourceDays
    .sort((left, right) => Number(left?.day) - Number(right?.day))
    .map((day, index) => ({
      ...day,
      day: index + 1,
      estimatedCostRange: normalizeRange(day.estimatedCostRange),
      dayWarnings: toStringArray(day.dayWarnings),
      editSuggestions: toStringArray(day.editSuggestions),
      activities: day.activities.map((activity, activityIndex) => {
        const placeName =
          activity.placeName &&
          !isPlaceholderPlace(activity.placeName) &&
          !isGenericPlaceName(activity.placeName)
            ? String(activity.placeName).trim()
            : undefined;
        const exactPlace = canOpenExactPlace({ ...activity, placeName });
        const advice = normalizeActivityAdvice(activity, day, activityIndex);

        const normalizedActivity = {
          ...activity,
          title: normalizeActivityTitle(activity, placeName),
          placeName,
          timeWindow: advice.timeWindow,
          costNote: advice.costNote,
          transportAdvice: advice.transportAdvice,
          googleMapsUrl: exactPlace
            ? buildGoogleMapsUrl(placeName, input.destination)
            : undefined,
          nearbySearchUrl: !exactPlace
            ? buildNearbySearchUrl(activity, input.destination)
            : undefined,
          tips: toStringArray(activity.tips),
        };

        return applyGroundingToActivity(normalizedActivity, candidateIndex);
      }),
    }));

  const mustDo = normalizePlaceList(source.mustDo).map((place) => applyGroundingToPriorityPlace(place, candidateIndex, input.destination));
  const mustDoNames = new Set(mustDo.map((place) => place.name.toLowerCase()));
  const optional = normalizePlaceList(source.optional)
    .filter((place) => !mustDoNames.has(place.name.toLowerCase()))
    .map((place) => applyGroundingToPriorityPlace(place, candidateIndex, input.destination));
  const reservedNames = new Set([
    ...mustDoNames,
    ...optional.map((place) => place.name.toLowerCase()),
  ]);
  const skipIfShortOnTime = normalizePlaceList(source.skipIfShortOnTime)
    .filter((place) => !reservedNames.has(place.name.toLowerCase()))
    .map((place) => applyGroundingToPriorityPlace(place, candidateIndex, input.destination));
  const sourceBudget = source.budget && typeof source.budget === 'object' ? source.budget : {};

  const groundableActivities = normalizedDays.flatMap((day) => day.activities)
    .filter((activity) => GROUNDABLE_TYPES.includes(String(activity.type || '').toLowerCase()) && activity.placeName);
  const groundedActivities = groundableActivities.filter((activity) => activity.groundingSource === 'verified');
  const groundedActivityRate = groundableActivities.length > 0
    ? groundedActivities.length / groundableActivities.length
    : 0;

  return {
    ...source,
    destination: source.destination || input.destination,
    durationDays: Number(source.durationDays) || input.durationDays,
    planningConfidenceScore: Math.max(
      0,
      Math.min(100, Number(source.planningConfidenceScore) || 0)
    ),
    scoreBreakdown: source.scoreBreakdown && typeof source.scoreBreakdown === 'object'
      ? source.scoreBreakdown
      : undefined,
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
    smartEditActions: normalizeSmartEditActions(source.smartEditActions),
    practicalInfo: {
      transportationAdvice: toStringArray(source.practicalInfo?.transportationAdvice),
      culturalEtiquette: toStringArray(source.practicalInfo?.culturalEtiquette),
      packingTips: toStringArray(source.practicalInfo?.packingTips),
      sustainabilityTips: toStringArray(source.practicalInfo?.sustainabilityTips),
    },
    groundingMeta: {
      quality: grounding?.groundingQuality || 'unavailable',
      candidatePoolSize: grounding?.candidatePoolSize || 0,
      groundedActivityRate,
    },
  };
}
