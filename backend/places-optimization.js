export class PlacesOptimizer {
  static filterQualityResults(places, options = {}) {
    const { minRating = 3.0 } = options;
    return places.filter(place => (place.rating || 0) >= minRating);
  }

  static enrichPlaceTypes(places) {
    return places.map(place => ({
      ...place,
      enriched: true,
      categoryScore: Math.random() * 10
    }));
  }

  static rankResults(places, lat, lng, query) {
    return places.sort((a, b) => {
      const ratingA = a.rating || 0;
      const ratingB = b.rating || 0;
      return ratingB - ratingA;
    });
  }

  static ensureVariety(places, maxResults) {
    const typesSeen = new Set();
    const diverseResults = [];
    
    for (const place of places) {
      if (diverseResults.length >= maxResults) break;
      
      const primaryType = place.types?.[0] || 'establishment';
      if (!typesSeen.has(primaryType) || diverseResults.length < maxResults / 2) {
        diverseResults.push(place);
        typesSeen.add(primaryType);
      }
    }
    
    return diverseResults;
  }
}