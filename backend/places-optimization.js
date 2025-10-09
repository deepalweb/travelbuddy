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
  
  // Filter out low-quality results with configurable options
  static filterQualityResults(places, options = {}) {
    const {
      minRating = 2.0,
      minReviews = 3,
      allowUnrated = true,
      excludeClosed = true
    } = options;
    
    return places.filter(place => {
      // Remove places without names
      if (!place.name || place.name.trim().length === 0) return false;
      
      // Remove places with very low ratings (unless no rating)
      if (place.rating) {
        if (place.rating < minRating) return false;
      } else if (!allowUnrated) {
        return false;
      }
      
      // Remove permanently closed places
      if (excludeClosed && place.business_status === 'CLOSED_PERMANENTLY') return false;
      
      // Keep places with good review counts or no reviews yet
      if (place.user_ratings_total && place.user_ratings_total < minReviews && place.rating && place.rating < (minRating + 1.5)) {
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
  
  // Ensure variety in results by diversifying place types
  static ensureVariety(places, maxResults = 50) {
    if (places.length <= maxResults) return places;
    
    const typeGroups = new Map();
    const diverseResults = [];
    const maxPerType = Math.max(3, Math.floor(maxResults / 8)); // Allow max 3-6 per type
    
    // Group places by primary type
    places.forEach(place => {
      const primaryType = this.getPrimaryType(place.types || []);
      if (!typeGroups.has(primaryType)) {
        typeGroups.set(primaryType, []);
      }
      typeGroups.get(primaryType).push(place);
    });
    
    // First pass: take top places from each type
    typeGroups.forEach((typePlaces, type) => {
      const topPlaces = typePlaces.slice(0, maxPerType);
      diverseResults.push(...topPlaces);
    });
    
    // Second pass: fill remaining slots with highest-scored places
    if (diverseResults.length < maxResults) {
      const remaining = places.filter(p => !diverseResults.includes(p));
      const needed = maxResults - diverseResults.length;
      diverseResults.push(...remaining.slice(0, needed));
    }
    
    // Sort final results by relevance score
    return diverseResults
      .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
      .slice(0, maxResults);
  }
  
  // Get primary type for categorization
  static getPrimaryType(types) {
    const priorityTypes = [
      'restaurant', 'food', 'meal_takeaway',
      'tourist_attraction', 'museum', 'park',
      'lodging', 'hotel',
      'shopping_mall', 'store',
      'hospital', 'pharmacy',
      'gas_station', 'bank', 'atm'
    ];
    
    for (const type of types) {
      if (priorityTypes.includes(type)) {
        return type;
      }
    }
    
    return types[0] || 'establishment';
  }
}