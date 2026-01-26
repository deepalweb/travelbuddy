import { apiService } from './apiService'

export interface TripPlan {
  id: string
  tripTitle: string
  destination: string
  duration: string
  introduction: string
  dailyPlans: DailyTripPlan[]
  conclusion: string
  accommodationSuggestions?: string[]
  transportationTips?: string[]
  budgetConsiderations?: string[]
}

export interface DailyTripPlan {
  day: number
  title: string
  theme?: string
  activities: ActivityDetail[]
  photoUrl?: string
}

export interface ActivityDetail {
  timeOfDay: string
  activityTitle: string
  description: string
  estimatedDuration: string
  location: string
  notes?: string
  icon?: string
  category?: string
  startTime?: string
  endTime?: string
  duration?: string
  place?: any
  type?: string
  estimatedCost?: string
  costBreakdown?: any
  transportFromPrev?: any
  tips?: string[]
  weatherBackup?: string
  crowdLevel?: string
  imageURL?: string
  bookingLinks?: string[]
  googlePlaceId?: string
  highlight?: boolean
  socialProof?: string
  rating?: number
  userRatingsTotal?: number
  practicalTip?: string
  travelMode?: string
  travelTimeMin?: number
  estimatedVisitDurationMin?: number
  photoThumbnail?: string
  fullAddress?: string
  openingHours?: any
  isOpenNow?: boolean
  weatherNote?: string
  tags?: string[]
  bookingLink?: string
  isVisited?: boolean
  visitedDate?: string
}

class TripService {
  private baseURL: string

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net'
  }

  // Helper method to get authentication token
  private async getAuthToken(): Promise<string | null> {
    // Try demo token first (for demo login)
    const demoToken = localStorage.getItem('demo_token')
    if (demoToken) {
      console.log('🔐 Using demo token for authentication')
      return demoToken
    }
    
    // Try Firebase token
    try {
      const { auth } = await import('../lib/firebase')
      if (auth?.currentUser) {
        const token = await auth.currentUser.getIdToken()
        console.log('🔐 Using Firebase token for authentication')
        return token
      }
    } catch (firebaseError) {
      console.log('⚠️ Firebase not available:', firebaseError.message)
    }
    
    // Fallback to other stored tokens
    const authToken = localStorage.getItem('auth_token')
    if (authToken) {
      console.log('🔐 Using fallback auth token')
      return authToken
    }
    
    console.log('❌ No authentication token found')
    return null
  }

  // Helper method to get authenticated headers
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    const token = await this.getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    return headers
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}/api${endpoint}`
    
    // Get auth headers and merge with provided headers
    const authHeaders = await this.getAuthHeaders()
    
    const config: RequestInit = {
      headers: {
        ...authHeaders,
        ...options.headers,
      },
      ...options,
    }

    console.log(`🚀 Making request to: ${url}`)
    console.log(`🔑 Auth headers:`, Object.keys(authHeaders))
    
    const response = await fetch(url, config)
    
    console.log(`📊 Response status: ${response.status} ${response.statusText}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.log(`❌ Error response:`, errorText)
      
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText || 'Request failed' }
      }
      
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log(`✅ Success response:`, Array.isArray(data) ? `Array with ${data.length} items` : 'Object')
    return data
  }

  // Get user's trip plans
  async getUserTripPlans(): Promise<TripPlan[]> {
    try {
      const response = await this.request<TripPlan[]>('/users/trip-plans')
      return response
    } catch (error) {
      console.error('Error fetching trip plans:', error)
      return []
    }
  }

  // Save trip plan
  async saveTripPlan(tripPlan: Omit<TripPlan, 'id'>): Promise<TripPlan | null> {
    try {
      const response = await this.request<TripPlan>('/users/trip-plans', {
        method: 'POST',
        body: JSON.stringify(tripPlan),
      })
      return response
    } catch (error) {
      console.error('Error saving trip plan:', error)
      return null
    }
  }

  // Update trip plan
  async updateTripPlan(tripPlan: TripPlan): Promise<boolean> {
    try {
      await this.request(`/users/trip-plans/${tripPlan.id}`, {
        method: 'PUT',
        body: JSON.stringify(tripPlan),
      })
      return true
    } catch (error) {
      console.error('Error updating trip plan:', error)
      return false
    }
  }



  // Update activity visited status
  async updateActivityStatus(
    tripPlanId: string, 
    dayIndex: number, 
    activityIndex: number, 
    isVisited: boolean
  ): Promise<boolean> {
    try {
      const token = localStorage.getItem('auth_token')
      await this.request(`/users/trip-plans/${tripPlanId}/activities`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          dayIndex,
          activityIndex,
          isVisited,
          visitedDate: isVisited ? new Date().toISOString() : null,
        }),
      })
      return true
    } catch (error) {
      console.error('Error updating activity status:', error)
      return false
    }
  }

  // Share trip plan
  async shareTripPlan(tripPlanId: string): Promise<string | null> {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await this.request<{ shareUrl: string }>(`/users/trip-plans/${tripPlanId}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      return response.shareUrl
    } catch (error) {
      console.error('Error sharing trip plan:', error)
      return null
    }
  }

  // Get shared trip plan
  async getSharedTripPlan(shareId: string): Promise<TripPlan | null> {
    try {
      const response = await this.request<TripPlan>(`/shared/trip-plans/${shareId}`)
      return response
    } catch (error) {
      console.error('Error fetching shared trip plan:', error)
      return null
    }
  }

  // Generate AI trip plan
  async generateTripPlan(params: {
    destination: string
    duration: string
    interests: string
    pace?: string
    budget?: string
  }): Promise<TripPlan | null> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await this.request<TripPlan>('/ai/trip-generator', {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      })
      return response
    } catch (error) {
      console.error('Error generating trip plan:', error)
      return null
    }
  }

  // Sync local plans to backend
  async syncLocalPlans(localPlans: TripPlan[]): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders()
      await this.request('/users/trip-plans/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({ tripPlans: localPlans }),
      })
      return true
    } catch (error) {
      console.error('Error syncing local plans:', error)
      return false
    }
  }

  // Create trip plan
  async createTrip(tripPlan: Omit<TripPlan, 'id'> & { userId?: string }): Promise<TripPlan | null> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await this.request<TripPlan>('/users/trip-plans', {
        method: 'POST',
        headers,
        body: JSON.stringify(tripPlan),
      })
      return response
    } catch (error) {
      console.error('Error creating trip plan:', error)
      return null
    }
  }

  // Delete trip plan
  async deleteTrip(tripPlanId: string): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders()
      await this.request<{ success: boolean }>(`/users/trip-plans/${tripPlanId}`, {
        method: 'DELETE',
        headers,
      })
      
      const specificKeys = [
        `trip-notes-${tripPlanId}`,
        `trip-activities-${tripPlanId}`,
        `trip-cache-${tripPlanId}`
      ]
      
      specificKeys.forEach(key => localStorage.removeItem(key))
      
      return true
    } catch (error) {
      console.error('Error deleting trip plan:', error)
      return false
    }
  }

  // Test connection to backend
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.request('/users/test')
      console.log('✅ Backend connection test successful:', response)
      return true
    } catch (error) {
      console.error('❌ Backend connection test failed:', error)
      return false
    }
  }

  // Get trip by ID
  async getTripById(tripId: string): Promise<TripPlan | null> {
    try {
      const headers = await this.getAuthHeaders()
      const response = await this.request<TripPlan>(`/users/trip-plans/${tripId}`, {
        headers,
      })
      return response
    } catch (error) {
      console.error('Error fetching trip:', error)
      return null
    }
  }

  // Alias for getUserTripPlans (compatibility)
  async getTrips(userId?: string): Promise<TripPlan[]> {
    return this.getUserTripPlans()
  }
}

export const tripService = new TripService()