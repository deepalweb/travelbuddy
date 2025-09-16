import { Place } from '../types.ts';
import { DEFAULT_PLACES_RADIUS_M } from '../constants.ts';

// Fetch factual places from backend (Google Places proxy)
export const fetchFactualPlaces = async (
  latitude: number,
  longitude: number,
  query: string,
  radius: number = DEFAULT_PLACES_RADIUS_M
): Promise<Partial<Place>[]> => {
  const params = new URLSearchParams({
    lat: String(latitude),
    lng: String(longitude),
    q: query,
    radius: String(radius)
  });

  const started = Date.now();
  const resp = await fetch(`/api/places/nearby?${params.toString()}`);
  if (!resp.ok) {
    const text = await resp.text();
    try { (await import('./usageAnalyticsService')).usageAnalytics.postUsage({ api: 'places', action: 'nearby', status: 'error', meta: { http: resp.status, text } }); } catch {}
    throw new Error(`Factual places fetch failed: ${text}`);
  }
  const data = await resp.json();
  try { (await import('./usageAnalyticsService')).usageAnalytics.postUsage({ api: 'places', action: 'nearby', status: 'success', durationMs: Date.now() - started }); } catch {}
  return data as Partial<Place>[];
};
