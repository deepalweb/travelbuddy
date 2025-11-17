const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net'

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
    if (!trip.tripTitle?.trim() || !trip.destination?.trim()) {
      throw new Error('Trip title and destination are required')
    }
    
    try {
      const newTrip: Trip = {
        ...trip,
        _id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        tripTitle: trip.tripTitle.trim(),
        destination: trip.destination.trim()
      }
      
      const existingTrips = JSON.parse(localStorage.getItem('trips') || '[]')
      if (!Array.isArray(existingTrips)) {
        throw new Error('Invalid trips data in storage')
      }
      
      existingTrips.push(newTrip)
      localStorage.setItem('trips', JSON.stringify(existingTrips))
      
      return newTrip
    } catch (error) {
      console.error('Error creating trip:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Failed to create trip: Unknown error')
    }
  },

  async getTrips(userId?: string): Promise<Trip[]> {
    try {
      const tripsData = localStorage.getItem('trips')
      if (!tripsData) return []
      
      const trips = JSON.parse(tripsData)
      if (!Array.isArray(trips)) {
        console.warn('Invalid trips data format, resetting storage')
        localStorage.setItem('trips', '[]')
        return []
      }
      
      return userId ? trips.filter((trip: Trip) => trip.userId === userId) : trips
    } catch (error) {
      console.error('Error fetching trips:', error)
      localStorage.setItem('trips', '[]') // Reset corrupted data
      return []
    }
  },

  async getUserTrips(userId: string): Promise<Trip[]> {
    if (!userId?.trim()) {
      throw new Error('User ID is required')
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(userId.trim())}/trip-plans`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Request failed' }))
        throw new Error(errorData.message || `Failed to fetch user trips: HTTP ${response.status}`)
      }
      
      const data = await response.json()
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching user trips:', error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network connection failed. Please check your internet connection.')
      }
      throw error
    }
  },

  async getTripById(tripId: string): Promise<Trip> {
    try {
      // Load trip from localStorage
      const trips = JSON.parse(localStorage.getItem('trips') || '[]')
      const trip = trips.find((t: Trip) => t._id === tripId)
      
      if (!trip) {
        throw new Error('Trip not found')
      }
      
      return trip
    } catch (error) {
      console.error('Error fetching trip:', error)
      throw new Error('Failed to fetch trip')
    }
  },

  async deleteTrip(tripId: string): Promise<void> {
    try {
      const trips = JSON.parse(localStorage.getItem('trips') || '[]')
      const filteredTrips = trips.filter((trip: Trip) => trip._id !== tripId)
      localStorage.setItem('trips', JSON.stringify(filteredTrips))
    } catch (error) {
      console.error('Error deleting trip:', error)
      throw new Error('Failed to delete trip')
    }
  },

  async updateTrip(tripId: string, updatedTrip: Partial<Trip>): Promise<Trip> {
    try {
      const trips = JSON.parse(localStorage.getItem('trips') || '[]')
      const tripIndex = trips.findIndex((trip: Trip) => trip._id === tripId)
      
      if (tripIndex === -1) {
        throw new Error('Trip not found')
      }
      
      trips[tripIndex] = { ...trips[tripIndex], ...updatedTrip }
      localStorage.setItem('trips', JSON.stringify(trips))
      
      return trips[tripIndex]
    } catch (error) {
      console.error('Error updating trip:', error)
      throw new Error('Failed to update trip')
    }
  },

  async updateActivityStatus(tripId: string, dayIndex: number, activityIndex: number, isVisited: boolean): Promise<void> {
    try {
      const trips = JSON.parse(localStorage.getItem('trips') || '[]')
      const tripIndex = trips.findIndex((trip: Trip) => trip._id === tripId)
      
      if (tripIndex !== -1) {
        trips[tripIndex].dailyPlans[dayIndex].activities[activityIndex].isVisited = isVisited
        localStorage.setItem('trips', JSON.stringify(trips))
      }
    } catch (error) {
      console.error('Error updating activity status:', error)
      throw new Error('Failed to update activity status')
    }
  }
}
