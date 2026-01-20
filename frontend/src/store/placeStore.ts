import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Place {
  id: string
  name: string
  description: string
  category: string
  rating: number
  priceLevel: string
  location: {
    address: string
    city: string
    country: string
    coordinates: {
      lat: number
      lng: number
    }
  }
  highlights: string[]
  image: string
  contact: {
    phone: string
    website: string
  }
  openHours: string
  tags: string[]
}

export interface SavedPlace extends Place {
  savedAt: number
  notes?: string
}

interface PlaceStore {
  savedPlaces: SavedPlace[]
  compareSelection: Place[]
  
  // Saved places actions
  addSavedPlace: (place: Place, notes?: string) => void
  removeSavedPlace: (placeId: string) => void
  getSavedPlace: (placeId: string) => SavedPlace | undefined
  isSaved: (placeId: string) => boolean
  updatePlaceNotes: (placeId: string, notes: string) => void
  
  // Comparison actions
  addToComparison: (place: Place) => boolean
  removeFromComparison: (placeId: string) => void
  clearComparison: () => void
  canAddToComparison: () => boolean
  
  // Batch operations
  clearAllData: () => void
}

const MAX_COMPARISON_PLACES = 3

export const usePlaceStore = create<PlaceStore>()(
  persist(
    (set, get) => ({
      savedPlaces: [],
      compareSelection: [],

      // Saved Places
      addSavedPlace: (place: Place, notes?: string) => {
        set((state) => {
          const existing = state.savedPlaces.find(p => p.id === place.id)
          if (existing) return state // Already saved
          
          const savedPlace: SavedPlace = {
            ...place,
            savedAt: Date.now(),
            notes
          }
          
          return {
            savedPlaces: [...state.savedPlaces, savedPlace]
          }
        })
      },

      removeSavedPlace: (placeId: string) => {
        set((state) => ({
          savedPlaces: state.savedPlaces.filter(p => p.id !== placeId)
        }))
      },

      getSavedPlace: (placeId: string) => {
        return get().savedPlaces.find(p => p.id === placeId)
      },

      isSaved: (placeId: string) => {
        return get().savedPlaces.some(p => p.id === placeId)
      },

      updatePlaceNotes: (placeId: string, notes: string) => {
        set((state) => ({
          savedPlaces: state.savedPlaces.map(p =>
            p.id === placeId ? { ...p, notes } : p
          )
        }))
      },

      // Comparison
      addToComparison: (place: Place) => {
        const state = get()
        if (state.compareSelection.length >= MAX_COMPARISON_PLACES) {
          return false // Can't add more
        }
        
        if (state.compareSelection.some(p => p.id === place.id)) {
          return false // Already in comparison
        }

        set((state) => ({
          compareSelection: [...state.compareSelection, place]
        }))
        return true
      },

      removeFromComparison: (placeId: string) => {
        set((state) => ({
          compareSelection: state.compareSelection.filter(p => p.id !== placeId)
        }))
      },

      clearComparison: () => {
        set({ compareSelection: [] })
      },

      canAddToComparison: () => {
        return get().compareSelection.length < MAX_COMPARISON_PLACES
      },

      clearAllData: () => {
        set({
          savedPlaces: [],
          compareSelection: []
        })
      }
    }),
    {
      name: 'place-store',
      partialize: (state) => ({
        savedPlaces: state.savedPlaces
        // Don't persist compareSelection (session-based)
      })
    }
  )
)
