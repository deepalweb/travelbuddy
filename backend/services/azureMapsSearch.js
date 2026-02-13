import fetch from 'node-fetch';

export class AzureMapsSearch {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://atlas.microsoft.com';
  }

  async searchPlacesComprehensive(lat, lng, query, radius = 20000) {
    try {
      const allResults = [];
      const radiusInMeters = Math.min(radius, 50000);
      
      const fuzzyUrl = `${this.baseUrl}/search/fuzzy/json?subscription-key=${this.apiKey}&api-version=1.0&query=${encodeURIComponent(query)}&lat=${lat}&lon=${lng}&radius=${radiusInMeters}&limit=100&typeahead=true`;
      
      const response = await fetch(fuzzyUrl);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const places = data.results.map(result => this.transformToGoogleFormat(result, lat, lng, query));
        allResults.push(...places);
      }
      
      if (allResults.length < 20) {
        const category = this.getCategoryId(query);
        if (category) {
          const poiUrl = `${this.baseUrl}/search/poi/json?subscription-key=${this.apiKey}&api-version=1.0&lat=${lat}&lon=${lng}&radius=${radiusInMeters}&categorySet=${category}&limit=100`;
          const poiResponse = await fetch(poiUrl);
          const poiData = await poiResponse.json();
          
          if (poiData.results && poiData.results.length > 0) {
            const poiPlaces = poiData.results.map(result => this.transformToGoogleFormat(result, lat, lng, query));
            const existingNames = new Set(allResults.map(p => p.name.toLowerCase()));
            const newPlaces = poiPlaces.filter(p => !existingNames.has(p.name.toLowerCase()));
            allResults.push(...newPlaces);
          }
        }
      }
      
      return this.rankResults(allResults, lat, lng, query);
    } catch (error) {
      console.error('❌ Azure Maps search error:', error.message);
      return [];
    }
  }

  rankResults(results, lat, lng, query) {
    const queryLower = query.toLowerCase();
    return results.map(place => {
      let score = 0;
      const nameLower = place.name.toLowerCase();
      
      if (nameLower.includes(queryLower)) score += 10;
      if (nameLower.startsWith(queryLower)) score += 5;
      score += (place.rating || 0) * 2;
      
      const distance = this.calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng);
      score -= distance / 1000;
      
      return { ...place, relevanceScore: score };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  transformToGoogleFormat(azureResult, lat, lng, query) {
    const poi = azureResult.poi || {};
    const address = azureResult.address || {};
    const position = azureResult.position || {};
    const placeName = poi.name || address.freeformAddress || 'Unknown Place';
    const categories = poi.categories || [];
    const distance = this.calculateDistance(lat, lng, position.lat, position.lon);
    
    return {
      place_id: azureResult.id || `azure_${Date.now()}_${Math.random()}`,
      name: placeName,
      formatted_address: address.freeformAddress || `${position.lat}, ${position.lon}`,
      geometry: {
        location: {
          lat: position.lat || 0,
          lng: position.lon || 0
        }
      },
      types: categories || poi.classifications?.map(c => c.code) || ['point_of_interest'],
      rating: this.generateRating(poi),
      user_ratings_total: Math.floor(Math.random() * 200) + 50,
      business_status: 'OPERATIONAL',
      vicinity: address.freeformAddress || '',
      phone: poi.phone || '',
      website: poi.url || '',
      distance: Math.round(distance),
      photos: [{
        photo_reference: this.generatePhotoUrl(placeName, categories),
        height: 400,
        width: 600
      }],
      source: 'azure_maps'
    };
  }

  generatePhotoUrl(placeName, categories) {
    // Generate photo URL based on place type using picsum.photos
    const category = (categories[0] || 'place').toLowerCase();
    const hash = placeName.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
    const seed = Math.abs(hash) % 1000;
    
    return `https://picsum.photos/seed/${seed}/600/400`;
  }

  generateRating(poi) {
    let rating = 3.5;
    if (poi.phone) rating += 0.3;
    if (poi.url) rating += 0.3;
    if (poi.categories && poi.categories.length > 0) rating += 0.2;
    return Math.min(Math.round(rating * 10) / 10, 5.0);
  }

  getCategoryId(query) {
    const q = query.toLowerCase();
    const categoryMap = {
      'restaurant': '7315', 'food': '7315', 'hotel': '7314', 'attraction': '7376',
      'tourist': '7376', 'museum': '7317', 'park': '9362', 'shopping': '7373',
      'cafe': '9376001', 'bar': '9376003', 'beach': '9992'
    };
    for (const [key, value] of Object.entries(categoryMap)) {
      if (q.includes(key)) return value;
    }
    return null;
  }
}
