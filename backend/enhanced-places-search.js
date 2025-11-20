import fetch from 'node-fetch'

export class EnhancedPlacesSearch {
  constructor(apiKey) {
    this.apiKey = apiKey
  }

  async searchPlacesComprehensive(lat, lng, query, radius = 20000) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=${radius}&key=${this.apiKey}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.status === 'OK') {
        return data.results || []
      }
      
      return []
    } catch (error) {
      console.error('Enhanced places search error:', error)
      return []
    }
  }
}