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
    if (types.includes('restaurant') || types.includes('food')) return 'restaurant'
    if (types.includes('tourist_attraction')) return 'attraction'
    if (types.includes('lodging')) return 'hotel'
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
    
    if (place.rating) score += place.rating * 10
    if (place.user_ratings_total) score += Math.min(place.user_ratings_total / 10, 50)
    
    return score
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