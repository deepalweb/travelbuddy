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

  // Get user's trip plans
  async getUserTripPlans(): Promise<TripPlan[]> {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await this.request<TripPlan[]>('/users/trip-plans', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      return response
    } catch (error) {
      console.error('Error fetching trip plans:', error)
      return []
    }
  }

  // Save trip plan
  async saveTripPlan(tripPlan: Omit<TripPlan, 'id'>): Promise<TripPlan | null> {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await this.request<TripPlan>('/users/trip-plans', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
      const token = localStorage.getItem('auth_token')
      await this.request(`/users/trip-plans/${tripPlan.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(tripPlan),
      })
      return true
    } catch (error) {
      console.error('Error updating trip plan:', error)
      return false
    }
  }

  // Delete trip plan
  async deleteTripPlan(tripPlanId: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('auth_token')
      await this.request(`/users/trip-plans/${tripPlanId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      return true
    } catch (error) {
      console.error('Error deleting trip plan:', error)
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
      const token = localStorage.getItem('auth_token')
      const response = await this.request<TripPlan>('/ai/trip-generator', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
      const token = localStorage.getItem('auth_token')
      await this.request('/users/trip-plans/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ tripPlans: localPlans }),
      })
      return true
    } catch (error) {
      console.error('Error syncing local plans:', error)
      return false
    }
  }
}

export const tripService = new TripService()