// @ts-nocheck
const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || 'J4khiSIy9hN7kZabjiTdQR-SG_FgxNX25icqGuleqhs';
const UNSPLASH_API_URL = 'https://api.unsplash.com';

interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string;
  description: string;
}

class UnsplashService {
  private async request(endpoint: string): Promise<any> {
    const response = await fetch(`${UNSPLASH_API_URL}${endpoint}`, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    return response.json();
  }

  async searchPhotos(query: string, count: number = 4): Promise<UnsplashImage[]> {
    try {
      const data = await this.request(`/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`);
      return data.results || [];
    } catch (error) {
      console.error('Error fetching Unsplash photos:', error);
      return [];
    }
  }

  async getDestinationImages(): Promise<UnsplashImage[]> {
    return this.searchPhotos('travel destinations scenic landscape', 4);
  }

  async getCityImage(cityName: string): Promise<UnsplashImage | null> {
    try {
      const results = await this.searchPhotos(`${cityName} travel destination`, 1);
      return results[0] || null;
    } catch (error) {
      console.error(`Error fetching image for ${cityName}:`, error);
      return null;
    }
  }
}

export const unsplashService = new UnsplashService();
export default unsplashService;
export type { UnsplashImage };
