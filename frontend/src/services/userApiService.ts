import BaseApiClient from './baseApiClient'

class UserApiService extends BaseApiClient {
  async getUserFavoriteIds() {
    return this.request('/users/favorites', {
      headers: this.getAuthHeaders()
    })
  }

  async addToFavorites(placeId: string) {
    return this.request('/users/favorites', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ placeId })
    })
  }

  async removeFromFavorites(placeId: string) {
    return this.request(`/users/favorites/${placeId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    })
  }

  async togglePlaceFavorite(placeId: string) {
    return this.request('/users/favorites/toggle', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ placeId })
    })
  }

  async getTravelStyle() {
    return this.request('/users/travel-style', {
      headers: this.getAuthHeaders()
    })
  }

  async setTravelStyle(travelStyle: string) {
    return this.request('/users/travel-style', {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ travelStyle })
    })
  }

  async getPreferences() {
    return this.request('/users/preferences', {
      headers: this.getAuthHeaders()
    })
  }

  async updatePreferences(preferences: any) {
    return this.request('/users/preferences', {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(preferences)
    })
  }

  async getExtendedProfile() {
    return this.request('/users/profile/extended', {
      headers: this.getAuthHeaders()
    })
  }

  async updateExtendedProfile(profileData: any) {
    return this.request('/users/profile/extended', {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(profileData)
    })
  }

  async uploadAvatar(file: File) {
    const formData = new FormData()
    formData.append('profilePicture', file)
    
    const baseUrl = await this.getBaseUrl()
    return fetch(`${baseUrl}/users/profile/picture`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: formData
    })
  }
}

export const userApiService = new UserApiService()
