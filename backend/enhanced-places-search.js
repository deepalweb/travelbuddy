import fetch from 'node-fetch';

export class EnhancedPlacesSearch {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async searchPlacesComprehensive(lat, lng, query, radius = 25000) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(query)}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== 'OK') {
        console.error(`Places API error: ${data.status}`);
        return [];
      }
      
      return data.results || [];
    } catch (error) {
      console.error('Enhanced places search error:', error);
      return [];
    }
  }
}