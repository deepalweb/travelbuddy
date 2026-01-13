import BaseApiClient from './baseApiClient'

class TripsApiService extends BaseApiClient {
  async getUserTrips() {
    return this.request('/users/trip-plans', {
      headers: this.getAuthHeaders()
    })
  }

  async createTrip(tripData: any) {
    return this.request('/users/trip-plans', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(tripData)
    })
  }

  async updateTrip(tripId: string, tripData: any) {
    return this.request(`/users/trip-plans/${tripId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(tripData)
    })
  }

  async deleteTrip(tripId: string) {
    return this.request(`/users/trip-plans/${tripId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    })
  }

  async updateTripActivity(tripId: string, dayIndex: number, activityIndex: number, isVisited: boolean) {
    return this.request(`/users/trip-plans/${tripId}/activities`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
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
    return this.request('/ai/trip-generator', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params)
    })
  }
}

export const tripsApiService = new TripsApiService()
