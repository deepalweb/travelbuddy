// Additional optimizations for places search to match Google Maps

export class PlacesOptimizer {
  
  // Smart query expansion based on location context
  static expandQueryWithContext(query, locationData) {
    const expanded = [query];
    
    // Add location-specific terms
    if (locationData?.city) {
      expanded.push(`${query} in ${locationData.city}`);
      expanded.push(`${locationData.city} ${query}`);
    }
    
    // Add business type variations
    const businessTypes = {
      'food': ['restaurant', 'cafe', 'eatery', 'dining', 'kitchen'],
      'coffee': ['cafe', 'coffee shop', 'espresso', 'starbucks'],
      'gas': ['gas station', 'fuel', 'petrol', 'shell', 'bp'],
      'hotel': ['hotel', 'motel', 'inn', 'lodge', 'accommodation'],
      'shop': ['store', 'shop', 'retail', 'market', 'outlet']
    };
    
    Object.keys(businessTypes).forEach(key => {
      if (query.toLowerCase().includes(key)) {
        expanded.push(...businessTypes[key].map(type => 
          query.replace(new RegExp(key, 'gi'), type)
        ));
      }
    });
    
    return [...new Set(expanded)].slice(0, 8);
  }
  
  // Intelligent result ranking (like Google Maps)
  static rankResults(places, userLat, userLng, query) {
    return places.map(place => {
      let score = 0;
      
      // Distance factor (closer = better)
      const distance = place.distance_m || 0;
      score += Math.max(0, 1000 - distance / 10); // Max 1000 points for distance
      
      // Rating factor
      if (place.rating) {
        score += place.rating * 200; // Max 1000 points for 5-star rating
      }
      
      // Review count factor
      if (place.user_ratings_total) {
        score += Math.min(500, place.user_ratings_total * 2); // Max 500 points
      }
      
      // Name relevance to query
      if (place.name && query) {
        const nameMatch = this.calculateTextRelevance(place.name, query);
        score += nameMatch * 300; // Max 300 points
      }
      
      // Business status
      if (place.business_status === 'OPERATIONAL') {
        score += 100;
      }
      
      // Photo availability
      if (place.photos && place.photos.length > 0) {
        score += 50;
      }
      
      return { ...place, relevance_score: score };
    }).sort((a, b) => b.relevance_score - a.relevance_score);
  }
  
  // Calculate text relevance between place name and query
  static calculateTextRelevance(text, query) {
    if (!text || !query) return 0;
    
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    
    // Exact match
    if (textLower === queryLower) return 1.0;
    
    // Contains query
    if (textLower.includes(queryLower)) return 0.8;
    
    // Word overlap
    const textWords = textLower.split(/\s+/);
    const queryWords = queryLower.split(/\s+/);
    const overlap = queryWords.filter(word => 
      textWords.some(textWord => textWord.includes(word) || word.includes(textWord))
    ).length;
    
    return overlap / queryWords.length * 0.6;
  }
  
  // Filter out low-quality results
  static filterQualityResults(places) {
    return places.filter(place => {
      // Remove places without names
      if (!place.name || place.name.trim().length === 0) return false;
      
      // Remove places with very low ratings (unless no rating)
      if (place.rating && place.rating < 2.0) return false;
      
      // Remove permanently closed places
      if (place.business_status === 'CLOSED_PERMANENTLY') return false;
      
      // Keep places with good review counts or no reviews yet
      if (place.user_ratings_total && place.user_ratings_total < 3 && place.rating && place.rating < 3.5) {
        return false;
      }
      
      return true;
    });
  }
  
  // Add missing place types based on name analysis
  static enrichPlaceTypes(places) {
    return places.map(place => {
      const name = place.name?.toLowerCase() || '';
      const types = [...(place.types || [])];
      
      // Add inferred types based on name
      const typeInferences = {
        'restaurant': ['restaurant', 'cafe', 'kitchen', 'grill', 'bistro', 'diner'],
        'gas_station': ['gas', 'fuel', 'petrol', 'shell', 'bp', 'exxon', 'chevron'],
        'bank': ['bank', 'credit union', 'atm'],
        'pharmacy': ['pharmacy', 'drugstore', 'cvs', 'walgreens'],
        'hospital': ['hospital', 'medical', 'clinic', 'urgent care'],
        'school': ['school', 'university', 'college', 'academy'],
        'shopping_mall': ['mall', 'shopping center', 'plaza'],
        'gym': ['gym', 'fitness', 'workout', 'crossfit']
      };
      
      Object.keys(typeInferences).forEach(type => {
        if (!types.includes(type)) {
          const keywords = typeInferences[type];
          if (keywords.some(keyword => name.includes(keyword))) {
            types.push(type);
          }
        }
      });
      
      return { ...place, types };
    });
  }
}