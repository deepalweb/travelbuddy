import { useState, useMemo } from 'react'
import type { SortOption } from '../components/SortControls'

interface Place {
  id: string
  name: string
  rating: number
  priceLevel: string
  location: {
    coordinates: {
      lat: number
      lng: number
    }
  }
  distance?: number
}

export const usePlaceSorting = (places: Place[], userLocation?: { lat: number; lng: number }) => {
  const [sortBy, setSortBy] = useState<SortOption>('relevance')

  const sortedPlaces = useMemo(() => {
    const placesToSort = [...places]

    switch (sortBy) {
      case 'rating':
        return placesToSort.sort((a, b) => b.rating - a.rating)

      case 'price-low':
        return placesToSort.sort((a, b) => a.priceLevel.length - b.priceLevel.length)

      case 'price-high':
        return placesToSort.sort((a, b) => b.priceLevel.length - a.priceLevel.length)

      case 'distance':
        if (!userLocation) return placesToSort
        return placesToSort.sort((a, b) => {
          const distA = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            a.location.coordinates.lat,
            a.location.coordinates.lng
          )
          const distB = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            b.location.coordinates.lat,
            b.location.coordinates.lng
          )
          return distA - distB
        })

      case 'relevance':
      default:
        return placesToSort
    }
  }, [places, sortBy, userLocation])

  return { sortedPlaces, sortBy, setSortBy }
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
