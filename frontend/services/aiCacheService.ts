interface CacheEntry {
  data: any;
  timestamp: number;
  expiresIn: number;
}

class AICacheService {
  private cache = new Map<string, CacheEntry>();
  
  // Cache durations (in milliseconds)
  private readonly CACHE_DURATIONS = {
    places: 24 * 60 * 60 * 1000,      // 24 hours
    itinerary: 12 * 60 * 60 * 1000,   // 12 hours
    emergency: 7 * 24 * 60 * 60 * 1000, // 7 days
    weather: 3 * 60 * 60 * 1000,      // 3 hours
  };

  generateKey(type: string, params: any): string {
    return `${type}_${JSON.stringify(params)}`;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.timestamp + entry.expiresIn) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  set(key: string, data: any, type: keyof typeof this.CACHE_DURATIONS): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: this.CACHE_DURATIONS[type]
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const aiCache = new AICacheService();