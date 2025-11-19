export interface TripGenerationParams {
  destination: string
  duration: string
  interests: string
  pace?: string
  budget?: string
  travelStyles?: string[]
}

export interface AIRecommendation {
  id: string
  title: string
  description: string
  category: string
  relevanceScore: number
  reasoning: string
}

export interface PlaceAIContent {
  description?: string
  localTip?: string
  handyPhrase?: string
  culturalInsight?: string
}

class AIService {
  private baseURL: string

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net'
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}/api${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(url, config)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Request failed' }))
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
    }
    
    return response.json()
  }

  // Generate AI trip plan
  async generateTripPlan(params: TripGenerationParams): Promise<any> {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await this.request('/ai/trip-generator', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(params)
      })
      return response
    } catch (error) {
      console.error('Error generating trip plan:', error)
      throw error
    }
  }

  // Get personalized recommendations
  async getPersonalizedRecommendations(params: {
    latitude: number
    longitude: number
    interests: string[]
    userType?: string
    travelStyle?: string
  }): Promise<AIRecommendation[]> {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await this.request<AIRecommendation[]>('/ai/recommendations', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(params)
      })
      return response
    } catch (error) {
      console.error('Error getting recommendations:', error)
      return []
    }
  }

  // Generate AI content for places
  async generatePlaceContent(placeId: string, placeName: string, placeType: string): Promise<PlaceAIContent> {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await this.request<PlaceAIContent>('/ai/place-content', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ placeId, placeName, placeType })
      })
      return response
    } catch (error) {
      console.error('Error generating place content:', error)
      return {}
    }
  }

  // Get cached AI content for place
  async getCachedPlaceContent(placeId: string): Promise<PlaceAIContent | null> {
    try {
      const response = await this.request<PlaceAIContent>(`/ai/place-content/${placeId}`)
      return response
    } catch (error) {
      return null
    }
  }

  // Enhanced places search with AI
  async enhancedPlacesSearch(params: {
    query: string
    latitude?: number
    longitude?: number
    category?: string
    limit?: number
    userType?: string
    vibe?: string
  }): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams()
      queryParams.append('q', params.query)
      if (params.latitude) queryParams.append('lat', params.latitude.toString())
      if (params.longitude) queryParams.append('lng', params.longitude.toString())
      if (params.category) queryParams.append('category', params.category)
      if (params.limit) queryParams.append('limit', params.limit.toString())
      if (params.userType) queryParams.append('userType', params.userType)
      if (params.vibe) queryParams.append('vibe', params.vibe)

      const response = await this.request<{ results: any[] }>(`/enhanced-places/search?${queryParams}`)
      return response.results || []
    } catch (error) {
      console.error('Error in enhanced places search:', error)
      return []
    }
  }

  // Generate contextual suggestions
  async getContextualSuggestions(params: {
    nearbyPlaces: any[]
    userStyle?: string
    weather?: string
    timeOfDay?: string
  }): Promise<string[]> {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await this.request<{ suggestions: string[] }>('/ai/contextual-suggestions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(params)
      })
      return response.suggestions || []
    } catch (error) {
      console.error('Error getting contextual suggestions:', error)
      return []
    }
  }
}

export const aiService = new AIService()