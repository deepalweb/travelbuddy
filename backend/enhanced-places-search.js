// Enhanced Places Search to match Google Maps results
import fetch from 'node-fetch';

export class EnhancedPlacesSearch {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  // Multi-API approach to get comprehensive results like Google Maps
  async searchPlacesComprehensive(lat, lng, query, radius = 20000) {
    const results = new Map(); // Use Map to avoid duplicates by place_id
    
    try {
      // 1. Text Search (current method)
      const textResults = await this.textSearch(lat, lng, query, radius);
      textResults.forEach(place => results.set(place.place_id, place));

      // 2. Nearby Search with multiple types
      const nearbyResults = await this.nearbySearchMultiType(lat, lng, query, radius);
      nearbyResults.forEach(place => results.set(place.place_id, place));

      // 3. Find Place for specific queries
      if (query.length > 3) {
        const findResults = await this.findPlaceSearch(query, lat, lng);
        findResults.forEach(place => results.set(place.place_id, place));
      }

      // 4. Category-based search
      const categoryResults = await this.categoryBasedSearch(lat, lng, query, radius);
      categoryResults.forEach(place => results.set(place.place_id, place));

      // Filter by distance to ensure only nearby places
      const filteredResults = Array.from(results.values()).filter(place => {
        if (!place.geometry?.location) return false;
        const distance = this.calculateDistance(lat, lng, place.geometry.location.lat, place.geometry.location.lng);
        return distance <= (radius / 1000); // Convert radius to km
      });
      
      return filteredResults.slice(0, 100); // Return up to 100 places for mobile
    } catch (error) {
      console.error('Enhanced search failed:', error);
      return [];
    }
  }

  // 1. Enhanced Text Search with better queries
  async textSearch(lat, lng, query, radius) {
    const enhancedQueries = this.generateSearchQueries(query);
    const allResults = [];

    for (const searchQuery of enhancedQueries) {
      try {
        const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
        url.searchParams.set('query', `${searchQuery} near ${lat},${lng}`);
        url.searchParams.set('location', `${lat},${lng}`);
        url.searchParams.set('radius', String(radius));
        url.searchParams.set('locationbias', `circle:${radius}@${lat},${lng}`);
        url.searchParams.set('key', this.apiKey);

        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.status === 'OK' && data.results) {
          allResults.push(...data.results);
        }
      } catch (error) {
        console.error(`Text search failed for query: ${searchQuery}`, error);
      }
    }

    return this.deduplicateResults(allResults);
  }

  // 2. Nearby Search with multiple place types
  async nearbySearchMultiType(lat, lng, query, radius) {
    const placeTypes = this.getRelevantPlaceTypes(query);
    const allResults = [];

    for (const type of placeTypes) {
      try {
        const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
        url.searchParams.set('location', `${lat},${lng}`);
        url.searchParams.set('radius', String(radius));
        url.searchParams.set('type', type);
        url.searchParams.set('key', this.apiKey);

        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.status === 'OK' && data.results) {
          allResults.push(...data.results);
        }
      } catch (error) {
        console.error(`Nearby search failed for type: ${type}`, error);
      }
    }

    return this.deduplicateResults(allResults);
  }

  // 3. Find Place for specific business names
  async findPlaceSearch(query, lat, lng) {
    try {
      const url = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json');
      url.searchParams.set('input', query);
      url.searchParams.set('inputtype', 'textquery');
      url.searchParams.set('locationbias', `circle:${Math.min(20000, 10000)}@${lat},${lng}`);
      url.searchParams.set('fields', 'place_id,name,geometry,rating,types,formatted_address,photos');
      url.searchParams.set('key', this.apiKey);

      const response = await fetch(url.toString());
      const data = await response.json();

      return data.status === 'OK' ? data.candidates : [];
    } catch (error) {
      console.error('Find place search failed:', error);
      return [];
    }
  }

  // 4. Category-based comprehensive search
  async categoryBasedSearch(lat, lng, query, radius) {
    const categories = this.getCategoryKeywords(query);
    const allResults = [];

    for (const category of categories) {
      try {
        // Search with category-specific keywords
        const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
        url.searchParams.set('query', `${category}`);
        url.searchParams.set('location', `${lat},${lng}`);
        url.searchParams.set('radius', String(radius));
        url.searchParams.set('locationbias', `circle:${radius}@${lat},${lng}`);
        url.searchParams.set('key', this.apiKey);

        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.status === 'OK' && data.results) {
          allResults.push(...data.results);
        }
      } catch (error) {
        console.error(`Category search failed for: ${category}`, error);
      }
    }

    return this.deduplicateResults(allResults);
  }

  // Generate multiple search queries for better coverage
  generateSearchQueries(originalQuery) {
    const queries = [originalQuery];
    
    // Add variations
    const variations = [
      `${originalQuery} restaurant`,
      `${originalQuery} shop`,
      `${originalQuery} store`,
      `${originalQuery} service`,
      `${originalQuery} place`,
      `best ${originalQuery}`,
      `popular ${originalQuery}`,
      `${originalQuery} near me`
    ];

    // Add location-specific terms
    const locationTerms = ['local', 'nearby', 'around here'];
    locationTerms.forEach(term => {
      queries.push(`${term} ${originalQuery}`);
    });

    return [...new Set([...queries, ...variations])].slice(0, 8); // Increased to 8 queries for better coverage
  }

  // Get relevant Google Places types based on query
  getRelevantPlaceTypes(query) {
    const queryLower = query.toLowerCase();
    const typeMap = {
      'restaurant': ['restaurant', 'meal_takeaway', 'food'],
      'food': ['restaurant', 'meal_takeaway', 'food', 'bakery', 'cafe'],
      'coffee': ['cafe', 'restaurant'],
      'hotel': ['lodging', 'hotel'],
      'shop': ['store', 'shopping_mall', 'clothing_store'],
      'gas': ['gas_station'],
      'bank': ['bank', 'atm'],
      'hospital': ['hospital', 'pharmacy'],
      'school': ['school', 'university'],
      'park': ['park'],
      'gym': ['gym'],
      'beauty': ['beauty_salon', 'hair_care'],
      'car': ['car_dealer', 'car_repair'],
      'church': ['church', 'place_of_worship']
    };

    let types = ['establishment']; // Default type

    Object.keys(typeMap).forEach(keyword => {
      if (queryLower.includes(keyword)) {
        types.push(...typeMap[keyword]);
      }
    });

    return [...new Set(types)].slice(0, 5); // Increased to 5 types for better coverage
  }

  // Get category-specific keywords for broader search
  getCategoryKeywords(query) {
    const queryLower = query.toLowerCase();
    const categories = [];

    if (queryLower.includes('food') || queryLower.includes('restaurant')) {
      categories.push('restaurants', 'cafes', 'fast food', 'dining', 'eateries');
    }
    if (queryLower.includes('shop') || queryLower.includes('store')) {
      categories.push('shops', 'stores', 'retail', 'shopping centers', 'markets');
    }
    if (queryLower.includes('hotel') || queryLower.includes('stay')) {
      categories.push('hotels', 'motels', 'accommodation', 'lodging');
    }
    if (queryLower.includes('gas') || queryLower.includes('fuel')) {
      categories.push('gas stations', 'fuel stations', 'petrol stations');
    }

    return categories.length > 0 ? categories : [query];
  }

  // Remove duplicate places by place_id
  deduplicateResults(results) {
    const seen = new Set();
    return results.filter(place => {
      if (seen.has(place.place_id)) return false;
      seen.add(place.place_id);
      return true;
    });
  }
  
  // Calculate distance between two points in kilometers
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}