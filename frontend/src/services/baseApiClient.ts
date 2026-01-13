import { configService } from '../services/configService'
import { logger } from '../utils/logger'

class BaseApiClient {
  protected async getBaseUrl(): Promise<string> {
    try {
      const config = await configService.getConfig()
      return `${config.apiBaseUrl}/api`
    } catch {
      return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api`
    }
  }

  protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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
      
      return await response.json()
    } catch (error) {
      logger.error(`API request failed [${endpoint}]`, error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network connection failed. Please check your internet connection.')
      }
      throw error
    }
  }

  protected getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token')
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }
}

export default BaseApiClient
