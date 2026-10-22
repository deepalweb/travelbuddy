// Gathers a pool of real, verifiable candidate places for a trip-plan input, used to
// ground AI-generated itineraries against actual Google Places data instead of invented names.
import { textSearch, geocode } from './googlePlacesClient.js';
import { getOrFetch } from './placesCacheHelper.js';

// Activity types the AI itinerary schema can assign that correspond to a physical, groundable venue.
// 'rest' and 'transport' describe logistics, not a specific place, so they're never grounded.
export const GROUNDABLE_TYPES = ['attraction', 'food', 'nature', 'culture', 'shopping', 'experience'];

const TYPE_QUERY_TEMPLATES = {
  attraction: (destination) => `top attractions and landmarks in ${destination}`,
  food: (destination) => `best local restaurants in ${destination}`,
  nature: (destination) => `parks and nature spots in ${destination}`,
  culture: (destination) => `museums temples and cultural sites in ${destination}`,
  shopping: (destination) => `markets and shopping areas in ${destination}`,
  experience: (destination) => `unique local experiences and activities in ${destination}`
};

// Maps a free-text interest onto one of the groundable types plus a more specific query.
const INTEREST_QUERY_MAP = {
  nightlife: { type: 'experience', query: (d) => `nightlife and bars in ${d}` },
  'hidden gems': { type: 'experience', query: (d) => `hidden gems and local favorites in ${d}` },
  adventure: { type: 'experience', query: (d) => `adventure activities in ${d}` },
  art: { type: 'culture', query: (d) => `art galleries and street art in ${d}` },
  history: { type: 'culture', query: (d) => `historical sites in ${d}` },
  relaxation: { type: 'nature', query: (d) => `relaxing spots and scenic viewpoints in ${d}` },
  food: { type: 'food', query: (d) => `must-try food and cafes in ${d}` },
  shopping: { type: 'shopping', query: (d) => `boutique shops and markets in ${d}` }
};

const MAX_DISTINCT_QUERIES = 8;
const MAX_CANDIDATES_PER_TYPE = 10;
const MIN_ACCEPTABLE_RATING = 3.3;

function slugify(text) {
  return String(text || '').trim().toLowerCase().replace(/\s+/g, '-');
}

function score(candidate) {
  const rating = candidate.rating ?? 0;
  return rating * Math.log((candidate.userRatingsTotal || 0) + 1);
}

function buildQueryPlan(destination, interests) {
  const queries = new Map(); // type -> Set of query strings

  for (const type of GROUNDABLE_TYPES) {
    queries.set(type, new Set([TYPE_QUERY_TEMPLATES[type](destination)]));
  }

  for (const interest of interests || []) {
    const mapping = INTEREST_QUERY_MAP[String(interest).toLowerCase().trim()];
    if (!mapping) continue;
    queries.get(mapping.type).add(mapping.query(destination));
  }

  const flat = [];
  for (const [type, querySet] of queries) {
    for (const query of querySet) {
      flat.push({ type, query });
    }
  }

  return flat.slice(0, MAX_DISTINCT_QUERIES);
}

async function fetchForQuery(destination, type, query, locationBias) {
  const cacheKey = `tripground:textsearch:${slugify(destination)}:${slugify(query)}`;
  const results = await getOrFetch(cacheKey, () => textSearch({ query, location: locationBias }));
  return results.map((r) => ({ ...r, sourceType: type }));
}

export async function gatherGroundingCandidates(input) {
  const destination = String(input?.destination || '').trim();
  const durationDays = Number(input?.durationDays) || 1;

  if (!destination) {
    return { candidatesByType: [], groundingQuality: 'unavailable', candidatePoolSize: 0 };
  }

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return { candidatesByType: [], groundingQuality: 'unavailable', candidatePoolSize: 0 };
  }

  let locationBias = null;
  try {
    const geoKey = `tripground:geocode:${slugify(destination)}`;
    const geoResult = await getOrFetch(geoKey, () => geocode(destination));
    // A country/region-scale geocode result has no comma in its formatted address
    // (e.g. "Japan" vs "Kyoto, Japan"); a fixed-radius bias would be meaningless there.
    if (geoResult && geoResult.formattedAddress && geoResult.formattedAddress.includes(',')) {
      locationBias = { lat: geoResult.lat, lng: geoResult.lng };
    }
  } catch (geoError) {
    console.warn(`⚠️ Trip grounding geocode failed for "${destination}":`, geoError.message);
  }

  const queryPlan = buildQueryPlan(destination, input?.interests);
  const byPlaceId = new Map();
  let anyQuerySucceeded = false;

  for (const { type, query } of queryPlan) {
    try {
      const results = await fetchForQuery(destination, type, query, locationBias);
      anyQuerySucceeded = true;
      for (const candidate of results) {
        if (!candidate.placeId || !candidate.name) continue;
        if (candidate.rating !== null && candidate.rating < MIN_ACCEPTABLE_RATING) continue;
        if (!byPlaceId.has(candidate.placeId)) {
          byPlaceId.set(candidate.placeId, candidate);
        }
      }
    } catch (queryError) {
      console.warn(`⚠️ Trip grounding query failed ("${query}"):`, queryError.message);
    }
  }

  if (!anyQuerySucceeded) {
    return { candidatesByType: [], groundingQuality: 'unavailable', candidatePoolSize: 0 };
  }

  let pool = Array.from(byPlaceId.values());

  if (pool.length < 2 * durationDays) {
    try {
      const topUpQuery = `top things to do in ${destination}`;
      const topUpResults = await fetchForQuery(destination, 'experience', topUpQuery, locationBias);
      for (const candidate of topUpResults) {
        if (!candidate.placeId || !candidate.name) continue;
        if (!byPlaceId.has(candidate.placeId)) {
          byPlaceId.set(candidate.placeId, candidate);
        }
      }
      pool = Array.from(byPlaceId.values());
    } catch (topUpError) {
      console.warn(`⚠️ Trip grounding top-up query failed:`, topUpError.message);
    }
  }

  const candidatesByType = GROUNDABLE_TYPES.map((type) => {
    const typeCandidates = pool
      .filter((c) => c.sourceType === type)
      .sort((a, b) => score(b) - score(a))
      .slice(0, MAX_CANDIDATES_PER_TYPE)
      .map(({ sourceType, ...rest }) => rest);
    return { type, candidates: typeCandidates };
  }).filter((group) => group.candidates.length > 0);

  const candidatePoolSize = pool.length;
  const groundingQuality = candidatePoolSize >= 2 * durationDays ? 'verified' : 'sparse';

  return { candidatesByType, groundingQuality, candidatePoolSize };
}

export async function gatherHiddenGemsTopUp(destination) {
  if (!destination || !process.env.GOOGLE_PLACES_API_KEY) return [];
  try {
    const query = `hidden gems and local favorites in ${destination}`;
    return await fetchForQuery(destination, 'experience', query, null);
  } catch (error) {
    console.warn(`⚠️ Hidden gems top-up failed for "${destination}":`, error.message);
    return [];
  }
}
