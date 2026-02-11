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
      
      const fuzzyUrl = `${this.baseUrl}/search/fuzzy/json?subscription-key=${this.apiKey}&api-version=1.0&query=${encodeURIComponent(query)}&lat=${lat}&lon=${lng}&radius=${radiusInMeters}&limit=100`;
      
      console.log(`🗺️ Azure Maps Fuzzy Search: "${query}" near ${lat},${lng}`);
      console.log(`🔗 URL: ${fuzzyUrl.replace(this.apiKey, 'HIDDEN')}`);
      
      const response = await fetch(fuzzyUrl);
      const data = await response.json();
      
      console.log(`📊 Azure Maps Response Status: ${response.status}`);
      console.log(`📊 Azure Maps Results Count: ${data.results?.length || 0}`);
      if (data.error) {
        console.error(`❌ Azure Maps Error:`, data.error);
      }
      
      if (data.results && data.results.length > 0) {
        const places = data.results.map(result => this.transformToGoogleFormat(result));
        allResults.push(...places);
        console.log(`✅ Azure Maps: ${places.length} results`);
      }
      
      if (allResults.length < 20) {
        const category = this.getCategoryId(query);
        if (category) {
          const poiUrl = `${this.baseUrl}/search/poi/json?subscription-key=${this.apiKey}&api-version=1.0&lat=${lat}&lon=${lng}&radius=${radiusInMeters}&categorySet=${category}&limit=100`;
          
          const poiResponse = await fetch(poiUrl);
          const poiData = await poiResponse.json();
          
          if (poiData.results && poiData.results.length > 0) {
            const poiPlaces = poiData.results.map(result => this.transformToGoogleFormat(result));
            const existingNames = new Set(allResults.map(p => p.name.toLowerCase()));
            const newPlaces = poiPlaces.filter(p => !existingNames.has(p.name.toLowerCase()));
            allResults.push(...newPlaces);
          }
        }
      }
      
      return allResults;
    } catch (error) {
      console.error('❌ Azure Maps search error:', error.message);
      return [];
    }
  }

  transformToGoogleFormat(azureResult) {
    const poi = azureResult.poi || {};
    const address = azureResult.address || {};
    const position = azureResult.position || {};
    const placeName = poi.name || address.freeformAddress || 'Unknown Place';
    const categories = poi.categories || [];
    
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
