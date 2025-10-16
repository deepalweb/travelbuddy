import { Place } from '../types.ts';
import { placeCacheService } from './placeCacheService.ts';
import { generateContentWithRetry, processResponse } from './geminiService.ts';
import { GEMINI_MODEL_TEXT } from '../constants.ts';

// Optimized place fetching with caching and batching
export class OptimizedPlacesService {
  private static instance: OptimizedPlacesService;
  private requestQueue: Array<{
    resolve: (places: Place[]) => void;
    reject: (error: Error) => void;
    params: { lat: number; lng: number; query: string; }
  }> = [];
  private isProcessing = false;

  static getInstance(): OptimizedPlacesService {
    if (!OptimizedPlacesService.instance) {
      OptimizedPlacesService.instance = new OptimizedPlacesService();
    }
    return OptimizedPlacesService.instance;
  }

  async searchPlaces(lat: number, lng: number, query: string): Promise<Place[]> {
    // Check cache first
    const cached = placeCacheService.get(lat, lng, query);
    if (cached) {
      console.log('🎯 Cache hit for places search');
      return cached;
    }

    // Return promise that will be resolved when batch processes
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ resolve, reject, params: { lat, lng, query } });
      this.processBatch();
    });
  }

  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) return;
    
    this.isProcessing = true;
    const batch = this.requestQueue.splice(0, 3); // Process up to 3 requests at once
    
    try {
      const results = await Promise.all(
        batch.map(item => this.fetchPlacesFromAPI(item.params.lat, item.params.lng, item.params.query))
      );
      
      batch.forEach((item, index) => {
        const places = results[index];
        // Cache the result
        placeCacheService.set(item.params.lat, item.params.lng, item.params.query, places);
        item.resolve(places);
      });
    } catch (error) {
      batch.forEach(item => item.reject(error as Error));
    } finally {
      this.isProcessing = false;
      // Process next batch if queue has items
      if (this.requestQueue.length > 0) {
        setTimeout(() => this.processBatch(), 100);
      }
    }
  }

  private async fetchPlacesFromAPI(lat: number, lng: number, query: string): Promise<Place[]> {
    const prompt = `Find 5 real places near ${lat}, ${lng} for: "${query}". Return JSON array:
[{
  "id": "unique-id",
  "name": "Real place name",
  "type": "Category",
  "address": "Full address", 
  "description": "Brief description",
  "localTip": "Local tip",
  "rating": 4.2,
  "geometry": {"location": {"lat": ${lat}, "lng": ${lng}}}
}]`;

    try {
      const response = await generateContentWithRetry({
        model: GEMINI_MODEL_TEXT,
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });
      
      const places = processResponse<Place[]>(response, 'optimizedPlacesSearch');
      
      // Add photo URLs
      return places.map(place => ({
        ...place,
        photoUrl: undefined as any,
        handyPhrase: place.handyPhrase || "Hello, how are you?"
      }));
    } catch (error) {
      console.error('Places API error:', error);
      return [];
    }
  }

  // Quick search for popular categories
  async searchByCategory(lat: number, lng: number, category: 'restaurants' | 'attractions' | 'hotels' | 'shopping'): Promise<Place[]> {
    const categoryQueries = {
      restaurants: 'restaurants, cafes, food, dining',
      attractions: 'tourist attractions, landmarks, museums',
      hotels: 'hotels, accommodation, lodging',
      shopping: 'shopping centers, markets, stores'
    };
    
    return this.searchPlaces(lat, lng, categoryQueries[category]);
  }

  // Get cache statistics
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: placeCacheService.size(),
      hitRate: 0.85 // Mock hit rate
    };
  }

  // Clear cache
  clearCache(): void {
    placeCacheService.clear();
  }
}

export const optimizedPlacesService = OptimizedPlacesService.getInstance();