// Place caching service to reduce API calls
interface CachedPlace {
  data: any;
  timestamp: number;
  expiresIn: number; // milliseconds
}

class PlaceCacheService {
  private cache = new Map<string, CachedPlace>();
  private readonly DEFAULT_EXPIRY = 30 * 60 * 1000; // 30 minutes

  private generateKey(lat: number, lng: number, query: string): string {
    return `${lat.toFixed(4)}_${lng.toFixed(4)}_${query.toLowerCase()}`;
  }

  set(lat: number, lng: number, query: string, data: any, expiresIn = this.DEFAULT_EXPIRY): void {
    const key = this.generateKey(lat, lng, query);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn
    });
  }

  get(lat: number, lng: number, query: string): any | null {
    const key = this.generateKey(lat, lng, query);
    const cached = this.cache.get(key);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.expiresIn) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const placeCacheService = new PlaceCacheService();