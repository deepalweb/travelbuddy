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
        const errorData = await response.json().catch(() => ({ message: 'Network error' }))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error(`API request failed [${endpoint}]:`, error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network connection failed. Please check your internet connection.')
      }
      throw error
    }
  }

  // Weather API
  async getWeather(lat: number, lng: number) {
    return this.request(`/weather/google?lat=${lat}&lng=${lng}`)
  }

  // Places API
  async getNearbyPlaces(lat: number, lng: number, query?: string, radius?: number) {
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      throw new Error('Valid latitude and longitude are required')
    }
    
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      throw new Error('Invalid coordinates: latitude must be between -90 and 90, longitude between -180 and 180')
    }
    
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
    })
    
    if (query?.trim()) params.append('q', query.trim())
    if (radius && radius > 0) params.append('radius', radius.toString())
    
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
    if (!query?.trim()) {
      throw new Error('Search query is required')
    }
    
    const params = new URLSearchParams({ q: query.trim() })
    if (filters?.category) params.append('category', filters.category)
    if (filters?.limit && filters.limit > 0) params.append('limit', filters.limit.toString())
    
    try {
      const response = await this.request<any>(`/search/places?${params}`)
      
      // Handle new AI response format
      if (response?.success && response.data) {
        return Array.isArray(response.data.places) ? response.data.places : []
      }
      
      // Fallback for direct array response
      return Array.isArray(response) ? response : []
    } catch (error) {
      console.error('Search places failed:', error)
      return []
    }
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