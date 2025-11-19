export interface UserPreferences {
  travelStyle?: string
  interests?: string[]
  budgetPreferences?: string[]
  languages?: string[]
  homeCurrency?: string
  showBirthdayToOthers?: boolean
  showLocationToOthers?: boolean
}

class PreferencesService {
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

  // Get user travel style
  async getUserTravelStyle(): Promise<string | null> {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await this.request<{ travelStyle: string }>('/users/travel-style', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response.travelStyle
    } catch (error) {
      console.error('Error fetching travel style:', error)
      return null
    }
  }

  // Update user travel style
  async updateTravelStyle(travelStyle: string): Promise<boolean> {
    try {
      const token = localStorage.getItem('auth_token')
      await this.request('/users/travel-style', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ travelStyle })
      })
      return true
    } catch (error) {
      console.error('Error updating travel style:', error)
      return false
    }
  }

  // Get all user preferences
  async getUserPreferences(): Promise<UserPreferences | null> {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await this.request<UserPreferences>('/users/preferences', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      return response
    } catch (error) {
      console.error('Error fetching preferences:', error)
      return null
    }
  }

  // Update user preferences
  async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<boolean> {
    try {
      const token = localStorage.getItem('auth_token')
      await this.request('/users/preferences', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(preferences)
      })
      return true
    } catch (error) {
      console.error('Error updating preferences:', error)
      return false
    }
  }
}

export const preferencesService = new PreferencesService()