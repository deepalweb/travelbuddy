import BaseApiClient from './baseApiClient'
import { logger } from '../utils/logger'

class PlacesApiService extends BaseApiClient {
  async getNearbyPlaces(lat: number, lng: number, query?: string, radius?: number) {
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      throw new Error('Valid latitude and longitude are required')
    }
    
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      throw new Error('Invalid coordinates')
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

  async searchPlaces(query: string, filters?: any) {
    if (!query?.trim()) throw new Error('Search query is required')
    
    const params = new URLSearchParams({ q: query.trim() })
    if (filters?.category) params.append('category', filters.category)
    if (filters?.limit && filters.limit > 0) params.append('limit', filters.limit.toString())
    if (filters?.lat) params.append('lat', filters.lat.toString())
    if (filters?.lng) params.append('lng', filters.lng.toString())
    if (filters?.radius) params.append('radius', filters.radius.toString())
    
    try {
      const response = await this.request<any>(`/enhanced-places/search?${params}`)
      if (response?.success && response.results) {
        return Array.isArray(response.results) ? response.results : []
      }
      return []
    } catch (error) {
      logger.error('Search places failed', error)
      return []
    }
  }

  async getSearchSuggestions(query: string) {
    if (!query || query.length < 2) return []
    
    try {
      const response = await this.request<{suggestions: string[]}>(`/search/suggestions?q=${encodeURIComponent(query)}`)
      return response.suggestions || []
    } catch (error) {
      logger.warn('Suggestions failed', error)
      return []
    }
  }

  async getPlaceDetails(placeId: string, name?: string, location?: string, category?: string) {
    const params = new URLSearchParams()
    if (name) params.append('name', name)
    if (location) params.append('location', location)
    if (category) params.append('category', category)
    
    const queryString = params.toString() ? `?${params}` : ''
    const response = await this.request<any>(`/place-details/${placeId}${queryString}`)
    return response.success ? response.place : null
  }

  async getWeather(lat: number, lng: number) {
    return this.request(`/weather/google?lat=${lat}&lng=${lng}`)
  }
}

export const placesApiService = new PlacesApiService()
