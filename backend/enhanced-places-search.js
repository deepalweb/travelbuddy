import fetch from 'node-fetch'

export class EnhancedPlacesSearch {
  constructor(apiKey) {
    this.apiKey = apiKey
  }

  async searchPlacesComprehensive(lat, lng, query, radius = 20000) {
    try {
      // Use location bias instead of strict radius for better results (like Google Maps)
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)} in ${lat},${lng}&location=${lat},${lng}&radius=${radius}&key=${this.apiKey}`
      
      console.log(`🔍 Text Search: "${query}" near ${lat},${lng} (radius: ${radius}m)`)
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.status === 'OK') {
        console.log(`✅ Text Search returned ${data.results?.length || 0} results`)
        return data.results || []
      } else {
        console.warn(`⚠️ Text Search status: ${data.status}`)
      }
      
      return []
    } catch (error) {
      console.error('Enhanced places search error:', error)
      return []
    }
  }
}