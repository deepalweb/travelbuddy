import { configService } from '../services/configService'

let API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

class ApiService {
  private async getBaseUrl(): Promise<string> {
    try {
      const config = await configService.getConfig()
      return `${config.apiBaseUrl}/api`
    } catch {
      return `${API_BASE_URL}/api`
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

  // Enhanced Places Search API (Google Places First + AI Enhancement)
  async searchPlaces(query: string, filters?: any) {
    if (!query?.trim()) {
      throw new Error('Search query is required')
    }
    
    const params = new URLSearchParams({ q: query.trim() })
    if (filters?.category) params.append('category', filters.category)
    if (filters?.limit && filters.limit > 0) params.append('limit', filters.limit.toString())
    if (filters?.lat) params.append('lat', filters.lat.toString())
    if (filters?.lng) params.append('lng', filters.lng.toString())
    if (filters?.radius) params.append('radius', filters.radius.toString())
    
    try {
      // Try enhanced search first (Google Places + AI Enhancement)
      const response = await this.request<any>(`/enhanced-places/search?${params}`)
      
      // Handle enhanced response format
      if (response?.success && response.results) {
        return Array.isArray(response.results) ? response.results : []
      }
      
      // Fallback to hybrid search
      const hybridResponse = await this.request<any>(`/hybrid/search?${params}`)
      
      if (hybridResponse?.success && hybridResponse.results) {
        return Array.isArray(hybridResponse.results) ? hybridResponse.results : []
      }
      
      // Final fallback to regular search
      const fallbackResponse = await this.request<any>(`/search/places?${params}`)
      
      if (fallbackResponse?.success && fallbackResponse.data) {
        return Array.isArray(fallbackResponse.data.places) ? fallbackResponse.data.places : []
      }
      
      return Array.isArray(fallbackResponse) ? fallbackResponse : []
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
  async getPlaceDetails(placeId: string, name?: string, location?: string, category?: string) {
    try {
      const params = new URLSearchParams()
      if (name) params.append('name', name)
      if (location) params.append('location', location)
      if (category) params.append('category', category)
      
      const queryString = params.toString() ? `?${params}` : ''
      const response = await this.request<any>(`/place-details/${placeId}${queryString}`)
      return response.success ? response.place : null
    } catch (error) {
      console.error('Place details failed:', error)
      throw error
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health')
  }

  // Trip Planning API
  async getUserTrips() {
    const token = localStorage.getItem('auth_token')
    return this.request('/users/trip-plans', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
  }

  async createTrip(tripData: any) {
    const token = localStorage.getItem('auth_token')
    return this.request('/users/trip-plans', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(tripData)
    })
  }

  async updateTrip(tripId: string, tripData: any) {
    const token = localStorage.getItem('auth_token')
    return this.request(`/users/trip-plans/${tripId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(tripData)
    })
  }

  async deleteTrip(tripId: string) {
    const token = localStorage.getItem('auth_token')
    return this.request(`/users/trip-plans/${tripId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
  }

  async updateTripActivity(tripId: string, dayIndex: number, activityIndex: number, isVisited: boolean) {
    const token = localStorage.getItem('auth_token')
    return this.request(`/users/trip-plans/${tripId}/activities`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        dayIndex,
        activityIndex,
        isVisited,
        visitedDate: isVisited ? new Date().toISOString() : null
      })
    })
  }

  async generateAITrip(params: {
    destination: string
    duration: string
    interests: string
    pace?: string
    budget?: string
  }) {
    const token = localStorage.getItem('auth_token')
    return this.request('/ai/trip-generator', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(params)
    })
  }

  // User Favorites API
  async getUserFavoriteIds() {
    const token = localStorage.getItem('auth_token')
    return this.request('/users/favorites', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
  }

  async addToFavorites(placeId: string) {
    const token = localStorage.getItem('auth_token')
    return this.request('/users/favorites', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ placeId })
    })
  }

  async removeFromFavorites(placeId: string) {
    const token = localStorage.getItem('auth_token')
    return this.request(`/users/favorites/${placeId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
  }

  async togglePlaceFavorite(placeId: string) {
    const token = localStorage.getItem('auth_token')
    return this.request('/users/favorites/toggle', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ placeId })
    })
  }

  // User Preferences API
  async getTravelStyle() {
    const token = localStorage.getItem('auth_token')
    return this.request('/users/travel-style', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
  }

  async setTravelStyle(travelStyle: string) {
    const token = localStorage.getItem('auth_token')
    return this.request('/users/travel-style', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ travelStyle })
    })
  }

  async getPreferences() {
    const token = localStorage.getItem('auth_token')
    return this.request('/users/preferences', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
  }

  async updatePreferences(preferences: any) {
    const token = localStorage.getItem('auth_token')
    return this.request('/users/preferences', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(preferences)
    })
  }

  // Extended Profile API
  async getExtendedProfile() {
    const token = localStorage.getItem('auth_token')
    return this.request('/users/profile/extended', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
  }

  async updateExtendedProfile(profileData: any) {
    const token = localStorage.getItem('auth_token')
    return this.request('/users/profile/extended', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(profileData)
    })
  }

  async uploadAvatar(file: File) {
    const token = localStorage.getItem('auth_token')
    const formData = new FormData()
    formData.append('profilePicture', file)
    
    return fetch(`${await this.getBaseUrl()}/users/profile/picture`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    })
  }

  // AI Features API
  async generateTrip(params: any) {
    const token = localStorage.getItem('auth_token')
    return this.request('/ai/trip-generator', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(params)
    })
  }

  async getSmartRecommendations(params: any) {
    const token = localStorage.getItem('auth_token')
    return this.request('/ai/recommendations', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(params)
    })
  }

  async getPlaceAIContent(placeId: string) {
    return this.request(`/ai/place-content/${placeId}`)
  }

  async enhancedSearch(query: string, filters?: any) {
    const params = new URLSearchParams({ q: query })
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString())
      })
    }
    return this.request(`/enhanced-places/search?${params}`)
  }

  // Subscription Management API
  async getSubscriptionTiers() {
    return this.request('/subscriptions/tiers')
  }

  async getUserSubscription(userId: string) {
    const token = localStorage.getItem('auth_token')
    return this.request(`/subscriptions/${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
  }

  async getSubscriptionUsage(userId: string) {
    const token = localStorage.getItem('auth_token')
    return this.request(`/subscriptions/${userId}/usage`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
  }

  async startFreeTrial(userId: string, tier: string) {
    const token = localStorage.getItem('auth_token')
    return this.request('/subscriptions/trial', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ userId, tier, trialDays: 7 })
    })
  }

  async upgradeSubscription(userId: string, tier: string) {
    const token = localStorage.getItem('auth_token')
    return this.request('/subscriptions/upgrade', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ userId, tier })
    })
  }

  async cancelSubscription(userId: string, reason?: string) {
    const token = localStorage.getItem('auth_token')
    return this.request(`/subscriptions/${userId}/cancel`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ cancelAtPeriodEnd: true, reason: reason || 'user_requested' })
    })
  }

  async processPayment(userId: string, tier: string, amount: number, paymentMethod: string = 'paypal') {
    const token = localStorage.getItem('auth_token')
    return this.request('/subscriptions/payment', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ userId, tier, amount, paymentMethod })
    })
  }

  async getPaymentHistory(userId: string) {
    const token = localStorage.getItem('auth_token')
    return this.request(`/payments/${userId}/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
  }

  async checkTrialUsage(userId: string) {
    const response = await this.request(`/users/${userId}/trial-history`)
    return response?.hasUsedTrial === true
  }

  // Trip methods (aliases for compatibility)
  async getTrips() {
    return this.getUserTrips()
  }
}

export const apiService = new ApiService()

// Subscription helper functions
export const subscriptionHelpers = {
  canAccessFeature: (subscription: any, feature: string): boolean => {
    if (!subscription || subscription.status === 'expired' || subscription.status === 'cancelled') {
      const freeFeatures = ['basic_search', 'view_places', 'basic_trip_planning', 'community_view']
      return freeFeatures.includes(feature)
    }

    const tierFeatures: Record<string, string[]> = {
      free: ['basic_search', 'view_places', 'basic_trip_planning', 'community_view'],
      basic: ['basic_search', 'view_places', 'basic_trip_planning', 'community_view', 'extended_search', 'basic_ai', 'favorites'],
      premium: ['basic_search', 'view_places', 'basic_trip_planning', 'community_view', 'extended_search', 'basic_ai', 'favorites', 'advanced_ai', 'offline_maps', 'priority_support'],
      pro: ['basic_search', 'view_places', 'basic_trip_planning', 'community_view', 'extended_search', 'basic_ai', 'favorites', 'advanced_ai', 'offline_maps', 'priority_support', 'business_features', 'team_collaboration']
    }

    const features = tierFeatures[subscription.tier] || tierFeatures.free
    return features.includes(feature)
  },

  getTierLimits: (tier: string) => {
    const limits: Record<string, any> = {
      free: { placesPerDay: 10, aiQueriesPerMonth: 0, dealsPerDay: 3, favoritesMax: 10, tripsPerMonth: 1 },
      basic: { placesPerDay: 30, aiQueriesPerMonth: 5, dealsPerDay: 10, favoritesMax: 50, tripsPerMonth: 5 },
      premium: { placesPerDay: 100, aiQueriesPerMonth: 20, dealsPerDay: 25, favoritesMax: -1, tripsPerMonth: 15 },
      pro: { placesPerDay: -1, aiQueriesPerMonth: 100, dealsPerDay: -1, favoritesMax: -1, tripsPerMonth: -1 }
    }
    return limits[tier] || limits.free
  },

  isTrialExpired: (subscription: any): boolean => {
    if (!subscription || subscription.status !== 'trial') return false
    if (!subscription.trialEndDate) return false
    return new Date() > new Date(subscription.trialEndDate)
  },

  hasActiveSubscription: (subscription: any): boolean => {
    if (!subscription) return false
    if (subscription.status === 'active') return true
    if (subscription.status === 'trial' && !subscriptionHelpers.isTrialExpired(subscription)) return true
    return false
  }
}
