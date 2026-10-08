// Thin, cost-tracked wrapper over the Google Places (Legacy) Text Search and Geocoding APIs.
import fetch from 'node-fetch';
import costTracker from '../costTracker.js';

const TEXT_SEARCH_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

function getApiKey() {
  return process.env.GOOGLE_PLACES_API_KEY || null;
}

export async function textSearch({ query, location, radius }) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY not configured');
  }

  const params = new URLSearchParams({ query, key: apiKey });
  if (location && typeof location.lat === 'number' && typeof location.lng === 'number') {
    params.set('location', `${location.lat},${location.lng}`);
    params.set('radius', String(radius || 30000));
  }

  const response = await fetch(`${TEXT_SEARCH_URL}?${params.toString()}`);
  const data = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Google Places Text Search error: ${data.status}${data.error_message ? ` (${data.error_message})` : ''}`);
  }

  costTracker.trackAPICall('textsearch');

  return (data.results || []).map((place) => ({
    placeId: place.place_id || null,
    name: place.name || '',
    address: place.formatted_address || '',
    rating: typeof place.rating === 'number' ? place.rating : null,
    userRatingsTotal: typeof place.user_ratings_total === 'number' ? place.user_ratings_total : 0,
    priceLevel: typeof place.price_level === 'number' ? place.price_level : null,
    types: place.types || [],
    geometry: place.geometry?.location
      ? { lat: place.geometry.location.lat, lng: place.geometry.location.lng }
      : null,
    photoReference: place.photos?.[0]?.photo_reference || null
  }));
}

export async function geocode(address) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY not configured');
  }

  const params = new URLSearchParams({ address, key: apiKey });
  const response = await fetch(`${GEOCODE_URL}?${params.toString()}`);
  const data = await response.json();

  if (data.status !== 'OK' || !data.results?.length) {
    return null;
  }

  costTracker.trackAPICall('geocode');

  const location = data.results[0].geometry?.location;
  if (!location) return null;

  return {
    lat: location.lat,
    lng: location.lng,
    formattedAddress: data.results[0].formatted_address || ''
  };
}
