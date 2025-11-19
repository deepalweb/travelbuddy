class FavoritesService {
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

  // Get user's favorite place IDs
  async getUserFavorites(): Promise<string[]> {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await this.request<string[]>('/users/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      return response
    } catch (error) {
      console.error('Error fetching favorites:', error)
      return []
    }
  }

  // Add place to favorites
  async addFavorite(placeId: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('auth_token')
      await this.request('/users/favorites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ placeId }),
      })
      return true
    } catch (error) {
      console.error('Error adding favorite:', error)
      return false
    }
  }

  // Remove place from favorites
  async removeFavorite(placeId: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('auth_token')
      await this.request(`/users/favorites/${placeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      return true
    } catch (error) {
      console.error('Error removing favorite:', error)
      return false
    }
  }

  // Toggle favorite status
  async toggleFavorite(placeId: string, currentlyFavorited: boolean): Promise<boolean> {
    if (currentlyFavorited) {
      return await this.removeFavorite(placeId)
    } else {
      return await this.addFavorite(placeId)
    }
  }

  // Get favorite places with full details
  async getFavoritePlaces(): Promise<any[]> {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await this.request<any[]>('/users/favorites/places', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      return response
    } catch (error) {
      console.error('Error fetching favorite places:', error)
      return []
    }
  }
}

export const favoritesService = new FavoritesService()