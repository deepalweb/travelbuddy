const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export interface Trip {
  _id?: string
  tripTitle: string
  destination: string
  duration: string
  introduction: string
  dailyPlans: DailyPlan[]
  conclusion: string
  totalEstimatedCost: string
  estimatedWalkingDistance: string
  userId?: string
  createdAt?: string
}

export interface DailyPlan {
  day: number
  title: string
  date: string
  theme?: string
  activities: Activity[]
  dayEstimatedCost: string
  dayWalkingDistance: string
}

export interface Activity {
  timeOfDay: string
  activityTitle: string
  description: string
  location?: string
  duration: string
  estimatedCost: string
  type: 'transport' | 'accommodation' | 'activity' | 'meal' | 'other'
  rating?: number
  googlePlaceId?: string
  isVisited: boolean
  visitedDate?: string
  practicalTip?: string
  category?: string
}

export const tripService = {
  async createTrip(trip: Omit<Trip, '_id' | 'createdAt'>): Promise<Trip> {
    const response = await fetch(`${API_BASE_URL}/api/users/${trip.userId}/trip-plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(trip)
    })
    
    if (!response.ok) {
      throw new Error('Failed to create trip')
    }
    
    return response.json()
  },

  async getTrips(userId?: string): Promise<Trip[]> {
    const endpoint = userId ? `/api/users/${userId}/trip-plans` : '/api/trip-plans'
    const response = await fetch(`${API_BASE_URL}${endpoint}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch trips')
    }
    
    return response.json()
  },

  async getUserTrips(userId: string): Promise<Trip[]> {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/trip-plans`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch user trips')
    }
    
    return response.json()
  },

  async getTripById(tripId: string): Promise<Trip> {
    console.log('🔍 Making API call to:', `${API_BASE_URL}/api/trip-plans/${tripId}`)
    const response = await fetch(`${API_BASE_URL}/api/trip-plans/${tripId}`)
    
    console.log('📊 Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API Error:', errorText)
      throw new Error(`Failed to fetch trip: ${response.status} ${errorText}`)
    }
    
    const data = await response.json()
    console.log('✅ Trip data received:', data)
    return data
  },

  async deleteTrip(tripId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/trip-plans/${tripId}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error('Failed to delete trip')
    }
  },

  async updateActivityStatus(tripId: string, dayIndex: number, activityIndex: number, isVisited: boolean): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/trip-plans/${tripId}/activity-status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ dayIndex, activityIndex, isVisited })
    })
    
    if (!response.ok) {
      throw new Error('Failed to update activity status')
    }
  }
}