import { configService } from '../services/configService'

let API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

class ApiService {
  private async getBaseUrl(): Promise<string> {
    try {
      const config = await configService.getConfig()
      return `${config.apiBaseUrl}/api`
    } catch {
      return API_BASE_URL
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const baseUrl = await this.getBaseUrl()
    const url = `${baseUrl}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Weather API
  async getWeather(lat: number, lng: number) {
    return this.request(`/weather/google?lat=${lat}&lng=${lng}`)
  }

  // Places API
  async getNearbyPlaces(lat: number, lng: number, query?: string, radius?: number) {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
    })
    
    if (query) params.append('q', query)
    if (radius) params.append('radius', radius.toString())
    
    return this.request(`/places/nearby?${params}`)
  }

  async getPlaceSections(lat: number, lng: number) {
    return this.request(`/places/sections?lat=${lat}&lng=${lng}`)
  }

  // Deals API
  async getDeals(businessType?: string, isActive = true) {
    const params = new URLSearchParams({
      isActive: isActive.toString(),
    })
    
    if (businessType && businessType !== 'all') {
      params.append('businessType', businessType)
    }
    
    return this.request(`/deals?${params}`)
  }

  // Posts API
  async getPosts(limit = 20, cursor?: string) {
    const params = new URLSearchParams({
      limit: limit.toString(),
    })
    
    if (cursor) params.append('cursor', cursor)
    
    return this.request(`/community/posts?${params}`)
  }

  async createPost(postData: any) {
    return this.request('/community/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    })
  }

  // Authentication API
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async register(username: string, email: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    })
  }

  async getProfile() {
    const token = localStorage.getItem('auth_token')
    return this.request('/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }

  async updateProfile(data: any) {
    const token = localStorage.getItem('auth_token')
    return this.request('/auth/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })
  }

  // AI-powered Search API
  async searchPlaces(query: string, filters?: any) {
    const params = new URLSearchParams({ q: query })
    if (filters?.category) params.append('category', filters.category)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    
    const response = await this.request<any>(`/search/places?${params}`)
    
    // Handle new AI response format
    if (response.success && response.data) {
      return response.data.places || []
    }
    
    // Fallback for direct array response
    return Array.isArray(response) ? response : []
  }

  // Search suggestions for autocomplete
  async getSearchSuggestions(query: string) {
    if (!query || query.length < 2) return []
    
    try {
      const response = await this.request<{suggestions: string[]}>(`/search/suggestions?q=${encodeURIComponent(query)}`)
      return response.suggestions || []
    } catch (error) {
      console.warn('Suggestions failed:', error)
      return []
    }
  }

  // Get detailed place information
  async getPlaceDetails(placeId: string) {
    try {
      const response = await this.request<any>(`/search/place/${placeId}`)
      return response.success ? response.data : null
    } catch (error) {
      console.error('Place details failed:', error)
      throw error
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health')
  }
}

export const apiService = new ApiService()