const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface PlacePhoto {
  place_id: string;
  name: string;
  address: string;
  photo_reference: string | null;
  photo_url: string | null;
  rating?: number;
  types: string[];
}

class PlacesService {
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private minInterval = 200; // 200ms between requests

  private async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.minInterval) {
        await new Promise(resolve => setTimeout(resolve, this.minInterval - timeSinceLastRequest));
      }
      
      const request = this.requestQueue.shift();
      if (request) {
        this.lastRequestTime = Date.now();
        await request();
      }
    }
    
    this.isProcessing = false;
  }

  private async makeRequest(url: string, retries = 2): Promise<Response> {
    return new Promise((resolve, reject) => {
      const request = async () => {
        try {
          const response = await fetch(url);
          if (response.status === 429 && retries > 0) {
            setTimeout(() => {
              this.requestQueue.unshift(() => this.makeRequest(url, retries - 1).then(resolve).catch(reject));
              this.processQueue();
            }, 1000 * (3 - retries));
            return;
          }
          resolve(response);
        } catch (error) {
          reject(error);
        }
      };
      
      this.requestQueue.push(request);
      this.processQueue();
    });
  }

  async getPlaceWithPhoto(placeName: string, destination?: string): Promise<PlacePhoto | null> {
    try {
      const searchQuery = destination ? `${placeName}, ${destination}` : placeName;
      const response = await this.makeRequest(`${API_BASE_URL}/api/places-photos/search-with-photos/${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch place photo:', error);
      return null;
    }
  }

  getPhotoUrl(photoReference: string, maxwidth: number = 400): string {
    return `${API_BASE_URL}/api/places-photos/photo?photo_reference=${photoReference}&maxwidth=${maxwidth}`;
  }
}

export const placesService = new PlacesService();
export default placesService;