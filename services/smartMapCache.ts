interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number;
}

interface MapBounds {
  northeast: { lat: number; lng: number };
  southwest: { lat: number; lng: number };
}

export class SmartMapCache {
  private static instance: SmartMapCache;
  private googlePlacesCache = new Map<string, CacheEntry<any[]>>();
  private aiPlacesCache = new Map<string, CacheEntry<any[]>>();
  private routeCache = new Map<string, CacheEntry<any>>();
  private geocodeCache = new Map<string, CacheEntry<any[]>>();
  private maxCacheEntries = 100;
  private defaultExpiryMs = 30 * 60 * 1000; // 30 minutes

  static getInstance(): SmartMapCache {
    if (!SmartMapCache.instance) {
      SmartMapCache.instance = new SmartMapCache();
    }
    return SmartMapCache.instance;
  }

  // Generate cache key from location and parameters
  private generateCacheKey(
    location: { lat: number; lng: number },
    radius?: number,
    type?: string,
    query?: string
  ): string {
    const lat = Math.round(location.lat * 10000) / 10000; // 4 decimal precision
    const lng = Math.round(location.lng * 10000) / 10000;
    return `${lat},${lng}:${radius || 5000}:${type || 'all'}:${query || ''}`;
  }

  // Cache Google Places results
  cacheGooglePlaces(
    location: { lat: number; lng: number },
    places: any[],
    radius?: number,
    type?: string
  ): void {
    const key = this.generateCacheKey(location, radius, type);
    const entry: CacheEntry<any[]> = {
      data: places,
      timestamp: Date.now(),
      expires: Date.now() + this.defaultExpiryMs
    };
    
    this.googlePlacesCache.set(key, entry);
    this.cleanupCache(this.googlePlacesCache);
  }

  // Get cached Google Places results
  getCachedGooglePlaces(
    location: { lat: number; lng: number },
    radius?: number,
    type?: string
  ): any[] | null {
    const key = this.generateCacheKey(location, radius, type);
    const entry = this.googlePlacesCache.get(key);
    
    if (entry && entry.expires > Date.now()) {
      console.log(`[MapCache] Google Places cache hit for ${key}`);
      return entry.data;
    }
    
    if (entry) {
      this.googlePlacesCache.delete(key);
    }
    return null;
  }

  // Cache AI Places results
  cacheAIPlaces(
    location: { lat: number; lng: number },
    places: any[],
    type?: string,
    query?: string
  ): void {
    const key = this.generateCacheKey(location, undefined, type, query);
    const entry: CacheEntry<any[]> = {
      data: places,
      timestamp: Date.now(),
      expires: Date.now() + this.defaultExpiryMs
    };
    
    this.aiPlacesCache.set(key, entry);
    this.cleanupCache(this.aiPlacesCache);
  }

  // Get cached AI Places results
  getCachedAIPlaces(
    location: { lat: number; lng: number },
    type?: string,
    query?: string
  ): any[] | null {
    const key = this.generateCacheKey(location, undefined, type, query);
    const entry = this.aiPlacesCache.get(key);
    
    if (entry && entry.expires > Date.now()) {
      console.log(`[MapCache] AI Places cache hit for ${key}`);
      return entry.data;
    }
    
    if (entry) {
      this.aiPlacesCache.delete(key);
    }
    return null;
  }

  // Cache route results
  cacheRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    waypoints: Array<{ lat: number; lng: number }>,
    travelMode: string,
    routeData: any
  ): void {
    const waypointStr = waypoints.map(w => `${w.lat},${w.lng}`).join('|');
    const key = `route:${origin.lat},${origin.lng}:${destination.lat},${destination.lng}:${waypointStr}:${travelMode}`;
    
    const entry: CacheEntry<any> = {
      data: routeData,
      timestamp: Date.now(),
      expires: Date.now() + (15 * 60 * 1000) // 15 minutes for routes
    };
    
    this.routeCache.set(key, entry);
    this.cleanupCache(this.routeCache);
  }

  // Get cached route
  getCachedRoute(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    waypoints: Array<{ lat: number; lng: number }>,
    travelMode: string
  ): any | null {
    const waypointStr = waypoints.map(w => `${w.lat},${w.lng}`).join('|');
    const key = `route:${origin.lat},${origin.lng}:${destination.lat},${destination.lng}:${waypointStr}:${travelMode}`;
    
    const entry = this.routeCache.get(key);
    
    if (entry && entry.expires > Date.now()) {
      console.log(`[MapCache] Route cache hit for ${key}`);
      return entry.data;
    }
    
    if (entry) {
      this.routeCache.delete(key);
    }
    return null;
  }

  // Predictive caching based on map bounds
  async predictiveCacheForBounds(
    bounds: MapBounds,
    userLocation: { lat: number; lng: number },
    preferences: { categories?: string[]; travelMode?: string }
  ): Promise<void> {
    try {
      // Calculate strategic points within bounds to pre-cache
      const center = {
        lat: (bounds.northeast.lat + bounds.southwest.lat) / 2,
        lng: (bounds.northeast.lng + bounds.southwest.lng) / 2
      };

      const radius = this.calculateBoundsRadius(bounds);
      const categories = preferences.categories || ['restaurant', 'tourist_attraction', 'lodging'];

      // Pre-cache places for each category at strategic locations
      const strategicPoints = [
        center,
        userLocation,
        { lat: bounds.northeast.lat, lng: center.lng },
        { lat: bounds.southwest.lat, lng: center.lng },
        { lat: center.lat, lng: bounds.northeast.lng },
        { lat: center.lat, lng: bounds.southwest.lng }
      ];

      const cachePromises = strategicPoints.flatMap(point =>
        categories.map(async category => {
          // Check if already cached
          const cached = this.getCachedGooglePlaces(point, radius, category);
          if (!cached) {
            // Queue for background caching
            this.queueBackgroundCache(point, radius, category);
          }
        })
      );

      await Promise.allSettled(cachePromises);
    } catch (error) {
      console.error('Predictive caching failed:', error);
    }
  }

  private calculateBoundsRadius(bounds: MapBounds): number {
    // Calculate approximate radius from bounds
    const earthRadius = 6371000; // meters
    const lat1Rad = bounds.northeast.lat * Math.PI / 180;
    const lat2Rad = bounds.southwest.lat * Math.PI / 180;
    const deltaLat = (bounds.southwest.lat - bounds.northeast.lat) * Math.PI / 180;
    const deltaLng = (bounds.southwest.lng - bounds.northeast.lng) * Math.PI / 180;

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1Rad) * Math.cos(lat2Rad) *
      Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.min(earthRadius * c / 2, 10000); // Cap at 10km
  }

  private queueBackgroundCache(
    location: { lat: number; lng: number },
    _radius: number, // Prefixed with underscore to indicate intentional unused parameter
    category: string
  ): void {
    // Simple background caching queue - in a real app, you might use Web Workers
    setTimeout(async () => {
      try {
        console.log(`[MapCache] Background caching for ${category} at ${location.lat},${location.lng}`);
        // This would trigger actual API calls in the background
        // For now, we just log it
      } catch (error) {
        console.error('Background cache failed:', error);
      }
    }, Math.random() * 5000); // Random delay to spread load
  }

  // Cache geocoding results
  cacheGeocode(address: string, results: any[]): void {
    const entry: CacheEntry<any[]> = {
      data: results,
      timestamp: Date.now(),
      expires: Date.now() + (60 * 60 * 1000) // 1 hour for geocoding
    };
    
    this.geocodeCache.set(address.toLowerCase(), entry);
    this.cleanupCache(this.geocodeCache);
  }

  // Get cached geocoding results
  getCachedGeocode(address: string): any[] | null {
    const entry = this.geocodeCache.get(address.toLowerCase());
    
    if (entry && entry.expires > Date.now()) {
      console.log(`[MapCache] Geocode cache hit for ${address}`);
      return entry.data;
    }
    
    if (entry) {
      this.geocodeCache.delete(address.toLowerCase());
    }
    return null;
  }

  // Clean up expired entries and limit cache size
  private cleanupCache<T>(cache: Map<string, CacheEntry<T>>): void {
    if (cache.size <= this.maxCacheEntries) return;

    const entries = Array.from(cache.entries());
    const now = Date.now();

    // Remove expired entries first
    entries.forEach(([key, entry]) => {
      if (entry.expires <= now) {
        cache.delete(key);
      }
    });

    // If still too many, remove oldest entries
    if (cache.size > this.maxCacheEntries) {
      const sortedEntries = Array.from(cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);

      const toRemove = cache.size - this.maxCacheEntries;
      for (let i = 0; i < toRemove; i++) {
        cache.delete(sortedEntries[i][0]);
      }
    }
  }

  // Get cache statistics
  getStats(): {
    googlePlaces: number;
    aiPlaces: number;
    routes: number;
    geocoding: number;
    totalEntries: number;
  } {
    return {
      googlePlaces: this.googlePlacesCache.size,
      aiPlaces: this.aiPlacesCache.size,
      routes: this.routeCache.size,
      geocoding: this.geocodeCache.size,
      totalEntries: this.googlePlacesCache.size + this.aiPlacesCache.size + 
                    this.routeCache.size + this.geocodeCache.size
    };
  }

  // Clear all caches
  clearAllCaches(): void {
    this.googlePlacesCache.clear();
    this.aiPlacesCache.clear();
    this.routeCache.clear();
    this.geocodeCache.clear();
    console.log('[MapCache] All caches cleared');
  }

  // Clear specific cache type
  clearCache(type: 'google' | 'ai' | 'routes' | 'geocoding'): void {
    switch (type) {
      case 'google':
        this.googlePlacesCache.clear();
        break;
      case 'ai':
        this.aiPlacesCache.clear();
        break;
      case 'routes':
        this.routeCache.clear();
        break;
      case 'geocoding':
        this.geocodeCache.clear();
        break;
    }
    console.log(`[MapCache] ${type} cache cleared`);
  }
}

// Export singleton instance
export const smartMapCache = SmartMapCache.getInstance();
