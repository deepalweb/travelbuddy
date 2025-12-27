export class PlacesOptimizer {
  static filterQualityResults(places, options = {}) {
    const { minRating = 3.0 } = options
    return places.filter(place => !place.rating || place.rating >= minRating)
  }

  static enrichPlaceTypes(places) {
    return places.map(place => ({
      ...place,
      category: this.categorizePlace(place.types || [])
    }))
  }

  static categorizePlace(types) {
    // Priority-based categorization
    if (types.includes('restaurant') || types.includes('cafe') || types.includes('food')) return 'food'
    if (types.includes('museum') || types.includes('art_gallery')) return 'culture'
    if (types.includes('park') || types.includes('natural_feature')) return 'nature'
    if (types.includes('shopping_mall') || types.includes('store')) return 'shopping'
    if (types.includes('tourist_attraction') || types.includes('point_of_interest')) return 'attraction'
    if (types.includes('church') || types.includes('hindu_temple') || types.includes('mosque')) return 'religious'
    if (types.includes('lodging') || types.includes('hotel')) return 'hotel'
    if (types.includes('night_club') || types.includes('bar')) return 'nightlife'
    return 'general'
  }

  static rankResults(places, lat, lng, query) {
    return places.sort((a, b) => {
      const aScore = this.calculateScore(a, lat, lng, query)
      const bScore = this.calculateScore(b, lat, lng, query)
      return bScore - aScore
    })
  }

  static calculateScore(place, lat, lng, query) {
    let score = 0
    
    // Rating weight (40%)
    if (place.rating) score += place.rating * 20
    
    // Popularity weight (30%)
    if (place.user_ratings_total) {
      const popularityScore = Math.min(place.user_ratings_total / 100, 30)
      score += popularityScore
    }
    
    // Distance weight (20%) - closer is better
    if (place.geometry?.location) {
      const distance = this.calculateDistance(
        lat, lng,
        place.geometry.location.lat, place.geometry.location.lng
      )
      const distanceScore = Math.max(20 - (distance / 1000), 0) // Max 20km
      score += distanceScore
    }
    
    // Query relevance (10%)
    const name = (place.name || '').toLowerCase()
    const types = (place.types || []).join(' ').toLowerCase()
    const queryLower = query.toLowerCase()
    if (name.includes(queryLower) || types.includes(queryLower)) {
      score += 10
    }
    
    return score
  }
  
  static calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000 // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  static ensureVariety(places, maxResults) {
    const categories = {}
    const result = []
    
    for (const place of places) {
      const category = place.category || 'general'
      categories[category] = (categories[category] || 0) + 1
      
      if (categories[category] <= 3 && result.length < maxResults) {
        result.push(place)
      }
    }
    
    return result
  }
}