import fetch from 'node-fetch'

export class EnhancedPlacesSearch {
  constructor(apiKey) {
    this.apiKey = apiKey
  }

  async searchPlacesComprehensive(lat, lng, query, radius = 20000) {
    try {
      let allResults = []
      let nextPageToken = null
      let pageCount = 0
      const maxPages = 6 // Get up to 120 results (20 per page)
      
      do {
        // Build URL with pagination
        let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=${radius}&key=${this.apiKey}`
        
        if (nextPageToken) {
          url += `&pagetoken=${nextPageToken}`
          // Google requires 2 second delay between paginated requests
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
        
        console.log(`🔍 Text Search (page ${pageCount + 1}): "${query}" near ${lat},${lng}`)
        
        const response = await fetch(url)
        const data = await response.json()
        
        if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
          const results = data.results || []
          allResults = allResults.concat(results)
          console.log(`✅ Page ${pageCount + 1}: ${results.length} results (total: ${allResults.length})`)
          
          nextPageToken = data.next_page_token
          pageCount++
          
          // Stop if no more pages or reached max
          if (!nextPageToken || pageCount >= maxPages) break
        } else {
          console.warn(`⚠️ Text Search status: ${data.status}`)
          break
        }
      } while (nextPageToken && pageCount < maxPages)
      
      console.log(`✅ Total results from ${pageCount} pages: ${allResults.length}`)
      return allResults
      
    } catch (error) {
      console.error('Enhanced places search error:', error)
      return []
    }
  }
}