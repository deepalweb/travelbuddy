import { Place } from '../types.ts';
import { optimizedPlacesService } from './optimizedPlacesService.ts';
import { fetchFactualPlaces } from './realPlacesService.ts';
import { enrichMultiplePlaceDetailsPrompt, generateContentWithRetry, processResponse } from './geminiService.ts';
import { GEMINI_MODEL_TEXT, DEFAULT_PLACES_RADIUS_M } from '../constants.ts';

// Optimized places search with caching
export const searchNearbyPlaces = async (
  latitude: number,
  longitude: number,
  keywords: string[],
  category?: string
): Promise<Partial<Place>[]> => {
  const keyword = keywords.join(' ').trim();
  const searchTerm = category ? `${keyword} ${category}` : keyword;
  
  try {
    const places = await optimizedPlacesService.searchPlaces(latitude, longitude, searchTerm);
    return places.map(place => ({
      place_id: place.id,
      name: place.name,
      formatted_address: place.address,
      types: [place.type?.toLowerCase().replace(/\s+/g, '_') || 'establishment'],
      geometry: place.geometry,
      rating: place.rating,
      user_ratings_total: Math.floor(Math.random() * 200) + 50,
      business_status: 'OPERATIONAL'
    }));
  } catch (error) {
    console.error('Optimized places search failed:', error);
    return [];
  }
};

// Quick category search
export const searchPlacesByCategory = async (
  latitude: number,
  longitude: number,
  category: 'restaurants' | 'attractions' | 'hotels' | 'shopping'
): Promise<Place[]> => {
  return optimizedPlacesService.searchByCategory(latitude, longitude, category);
};

// Get cache statistics
export const getPlaceCacheStats = () => {
  return optimizedPlacesService.getCacheStats();
};

// Clear places cache
export const clearPlacesCache = () => {
  optimizedPlacesService.clearCache();
};

// New: Complete pipeline using Real Places API -> Gemini enrichment (batched) -> Images
export const fetchPlacesPipeline = async (
  latitude: number,
  longitude: number,
  keywords: string[],
  radius: number = DEFAULT_PLACES_RADIUS_M,
  options?: { signal?: AbortSignal; topN?: number; lang?: string }
) => {
  // Expand common category names into more specific Google-friendly terms
  const expandKeywords = (ks: string[]): string[] => {
    const out: string[] = [];
    const add = (...terms: string[]) => terms.forEach(t => out.push(t));
    ks.forEach(k => {
      const token = (k || '').toLowerCase().trim();
      switch (token) {
        case 'hotels':
        case 'lodging':
        case 'hotel':
          add('hotel', 'hostel', 'guest house');
          break;
        case 'restaurants':
        case 'restaurant':
        case 'food':
          add('restaurant', 'cafe', 'coffee shop', 'eatery');
          break;
        case 'cafes':
        case 'cafe':
          add('cafe', 'coffee shop');
          break;
        case 'shops':
        case 'shopping':
        case 'shop':
          add('shop', 'shopping mall', 'market');
          break;
        case 'entertainment':
          add('bar', 'nightlife', 'cinema', 'theatre', 'theater');
          break;
        case 'landmarks':
          add('landmark', 'attraction', 'sightseeing');
          break;
        case 'nature':
          add('park', 'garden', 'nature reserve');
          break;
        case 'culture':
          add('museum', 'temple', 'church', 'historic site');
          break;
        default:
          if (token) add(token);
      }
    });
    // dedupe while preserving order
    const seen = new Set<string>();
    return out.filter(t => {
      const key = t.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const expanded = expandKeywords(keywords);
  const query = (expanded.join(' ') || keywords.join(' ')).trim() || 'points of interest';
  // 1) Factual places via backend proxy
  let factual: Partial<Place>[] | null = null;
  try {
    if (options?.signal?.aborted) return [] as any;
    factual = await fetchFactualPlaces(latitude, longitude, query, radius);
  } catch (e) {
    console.warn('[fetchPlacesPipeline] Factual places fetch failed, falling back to optimizedPlacesService:', e);
    // Fallback: Use existing optimizedPlacesService flow and attach images
    const fallback = await optimizedPlacesService.searchPlaces(latitude, longitude, query);
    // No external image provider: rely on UI placeholder
    return fallback.map(p => ({ ...p, photoUrl: undefined as any, heroImage: undefined as any }));
  }
  if (!factual || factual.length === 0) return [];

  const lang = options?.lang || 'en';
  const topN = Math.max(0, options?.topN ?? 6);

  // Check backend enrichment cache
  const enrichResp = await fetch('/api/enrichment/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: factual, lang })
  }).then(r => r.json()).catch(() => ({ cached: {}, missing: factual.map(f => f.place_id) }));

  const cachedMap: Map<string, any> = new Map(Object.entries(enrichResp.cached || {}));
  const missingIds: string[] = (enrichResp.missing || []).filter(Boolean);


  // Enrich only topN visible + anything cached is already filled
  const candidatesToEnrich = factual
    .filter(f => missingIds.includes(f.place_id as string))
    .slice(0, topN);

  // 2) Batched enrichment with Gemini
  let byId = new Map<string, any>();
  if (candidatesToEnrich.length > 0) {
    const prompt = enrichMultiplePlaceDetailsPrompt(candidatesToEnrich as any);
  const started = Date.now();
  const response = await generateContentWithRetry({
      model: GEMINI_MODEL_TEXT,
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
  try { (await import('./usageAnalyticsService')).usageAnalytics.postUsage({ api: 'gemini', action: 'enrich_places_batch', status: 'success', durationMs: Date.now() - started }); } catch {}
    const creative = processResponse<Array<Partial<Place> & { id: string }>>(
      response,
      'enrichFactualPlacesTopN'
    ) || [];
    byId = new Map(creative.map(c => [c.id, c]));

    // POST back newly enriched to backend cache for future hits
    if (creative.length > 0) {
      fetch('/api/enrichment/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: creative, lang })
      }).catch(() => {});
    }
  }

  // 3) Attach image via Google Place Photo proxy when available
  const combined = await Promise.all(factual.map(async (f) => {
    const id = f.place_id as string;
    if (!id) return null;
    const c = byId.get(id) || cachedMap.get(id) || {};
    const firstRef = (Array.isArray((f as any).photos) && (f as any).photos[0]?.photo_reference) ? (f as any).photos[0].photo_reference : undefined;
    const hero = firstRef ? `/api/places/photo?ref=${encodeURIComponent(firstRef)}&w=800` : undefined;
    return {
      ...f,
      ...c,
      id,
      name: f.name,
      address: f.formatted_address,
      type: (c as any).type || f.types?.[0]?.replace(/_/g, ' ').replace(/\b\w/g, (m: string) => m.toUpperCase()) || 'Point Of Interest',
      description: (c as any).description || `Visit ${f.name}`,
      localTip: (c as any).localTip || 'Check opening hours before visiting.',
      handyPhrase: (c as any).handyPhrase || 'Hello, how are you?',
      photoUrl: hero,
      heroImage: hero
    } as any;
  }));

  return combined.filter(Boolean);
};
