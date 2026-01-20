import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchBar } from '../components/SearchBar'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { ErrorState } from '../components/ErrorState'
import { EmptyState } from '../components/EmptyState'
import { SearchFilters } from '../components/SearchFilters'
import PlaceCard from '../components/PlaceCard'
import ResultsHeader from '../components/ResultsHeader'
import SelectedPlacesSummary from '../components/SelectedPlacesSummary'
import QuickAccessButtons from '../components/QuickAccessButtons'
import LoadingState from '../components/LoadingState'
import PlaceGridDisplay from '../components/PlaceGridDisplay'
import ExploreMoreButton from '../components/ExploreMoreButton'
import SortControls from '../components/SortControls'
import PlaceComparison from '../components/PlaceComparison'

import { usePlaceSorting } from '../hooks/usePlaceSorting'

import { apiService } from '../lib/api'
import { 
  Sparkles
} from 'lucide-react'

// Global cache outside component to persist across navigation
const searchCache = new Map<string, { data: Place[], timestamp: number, context: string }>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

// Global state to persist current search
let globalSearchState = {
  places: [] as Place[],
  query: '',
  context: ''
}

interface Place {
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
  photos?: Array<{
    photo_reference: string
    height: number
    width: number
  }>
  contact: {
    phone: string
    website: string
  }
  openHours: string
  tags: string[]
}

const DiscoveryPage: React.FC = () => {
  const navigate = useNavigate()
  const [places, setPlaces] = useState<Place[]>(globalSearchState.places)

  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadingStage, setLoadingStage] = useState('')
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [searchQuery, setSearchQuery] = useState(globalSearchState.query)
  const [searchContext, setSearchContext] = useState(globalSearchState.context)
  const [hasMore, setHasMore] = useState(globalSearchState.places.length > 0)
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState({ category: [], priceRange: [], rating: 0, location: '', openNow: false, radius: 5000 })
  const [showMap, setShowMap] = useState(false)
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([])
  
  // Sorting hook
  const { sortedPlaces, sortBy, setSortBy } = usePlaceSorting(filteredPlaces || places, undefined)

  const applyFilters = (placesToFilter: Place[]) => {
    let filtered = [...placesToFilter]

    // Category filter
    if (activeFilters.category.length > 0) {
      filtered = filtered.filter(place => 
        activeFilters.category.includes(place.category.toLowerCase())
      )
    }

    // Price range filter
    if (activeFilters.priceRange.length > 0) {
      filtered = filtered.filter(place => 
        activeFilters.priceRange.includes(place.priceLevel)
      )
    }

    // Rating filter
    if (activeFilters.rating > 0) {
      filtered = filtered.filter(place => place.rating >= activeFilters.rating)
    }

    // Open now filter (simplified - would need real opening hours data)
    if (activeFilters.openNow) {
      filtered = filtered.filter(place => {
        const hour = new Date().getHours()
        return hour >= 9 && hour <= 22 // Assume most places open 9am-10pm
      })
    }

    return filtered
  }

  const handleSearch = async (query: string, isNewSearch = true) => {
    if (!query.trim()) return
    
    const cacheKey = query.toLowerCase().trim()
    
    if (isNewSearch) {
      setLoading(true)
      setLoadingProgress(0)
      setLoadingStage('Searching 50,000+ places...')
      setSearchQuery(query)
      
      // Check cache first
      const cached = searchCache.get(cacheKey)
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        console.log('🎯 Using cached results for:', query)
        setLoadingStage('Loading from cache...')
        setLoadingProgress(100)
        const allPlaces = cached.data
        setPlaces(allPlaces)
        setFilteredPlaces(applyFilters(allPlaces))
        setSearchContext(cached.context + ' (Cached)')
        setHasMore(true)
        setLoading(false)
        
        // Update global state
        globalSearchState = {
          places: allPlaces,
          query: query,
          context: cached.context
        }
        return
      }
      
      setPlaces([])
      setFilteredPlaces([])
    } else {
      setLoadingMore(true)
    }
    
    try {
      console.log('🔄 Fetching new results for:', query)
      
      // Progress simulation
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => Math.min(prev + 10, 90))
      }, 300)
      
      // Timeout warning
      const timeoutWarning = setTimeout(() => {
        setLoadingStage('Still searching... This is taking longer than usual')
      }, 5000)
      
      setLoadingStage('Analyzing your search...')
      const results = await apiService.searchPlaces(query, { limit: 8 })
      
      clearInterval(progressInterval)
      clearTimeout(timeoutWarning)
      setLoadingProgress(100)
      setLoadingStage(`Found ${results?.length || 0} amazing places!`)
      
      if (isNewSearch) {
        const newPlaces = results || []
        const context = `AI-powered results for "${query}"`
        
        setPlaces(newPlaces)
        setFilteredPlaces(applyFilters(newPlaces))
        setSearchContext(context)
        
        // Cache the results
        searchCache.set(cacheKey, {
          data: newPlaces,
          timestamp: Date.now(),
          context: context
        })
        
        // Update global state
        globalSearchState = {
          places: newPlaces,
          query: query,
          context: context
        }
      } else {
        const updatedPlaces = [...places, ...(results || [])]
        setPlaces(updatedPlaces)
        setFilteredPlaces(applyFilters(updatedPlaces))
      }
      setHasMore(true)
    } catch (error) {
      console.error('Search failed:', error)
      setLoadingStage('Search failed. Please try again.')
      if (isNewSearch) {
        setPlaces([])
        setFilteredPlaces([])
        setSearchContext('Search failed. Please try again.')
      }
    } finally {
      setTimeout(() => {
        setLoading(false)
        setLoadingMore(false)
        setLoadingProgress(0)
        setLoadingStage('')
      }, 500)
    }
  }

  const handleExploreMore = () => {
    if (searchQuery && !loadingMore) {
      handleSearch(searchQuery, false)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      restaurant: 'bg-orange-100 text-orange-800',
      hotel: 'bg-blue-100 text-blue-800',
      attraction: 'bg-purple-100 text-purple-800',
      museum: 'bg-green-100 text-green-800',
      cafe: 'bg-yellow-100 text-yellow-800',
      shopping: 'bg-pink-100 text-pink-800',
      park: 'bg-emerald-100 text-emerald-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getPriceLevelColor = (priceLevel: string) => {
    const colors = {
      '$': 'text-green-600',
      '$$': 'text-yellow-600', 
      '$$$': 'text-orange-600',
      '$$$$': 'text-red-600'
    }
    return colors[priceLevel as keyof typeof colors] || 'text-gray-600'
  }

  const togglePlaceSelection = (place: Place) => {
    console.log('🔄 Toggling place selection:', place.name)
    setSelectedPlaces(prev => {
      const isSelected = prev.some(p => p.id === place.id)
      console.log('📍 Current selection state:', isSelected ? 'selected' : 'not selected')
      if (isSelected) {
        console.log('➖ Removing from selection')
        return prev.filter(p => p.id !== place.id)
      } else {
        console.log('➕ Adding to selection')
        return [...prev, place]
      }
    })
  }

  const isPlaceSelected = (place: Place) => {
    return selectedPlaces.some(p => p.id === place.id)
  }

  const handleGenerateTrip = () => {
    if (selectedPlaces.length === 0) return
    
    // Store selected places in sessionStorage to pass to trip planning page
    sessionStorage.setItem('selectedPlaces', JSON.stringify(selectedPlaces))
    navigate('/trips')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 mr-3" />
              <h1 className="text-4xl md:text-5xl font-bold">
                Discover Your Next Adventure
              </h1>
            </div>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
              AI-powered travel discovery. Find amazing places, hidden gems, and perfect experiences tailored just for you.
            </p>
            
            {/* Search Section */}
            <div className="max-w-2xl mx-auto">
              <SearchBar onSearch={handleSearch} />
              <p className="text-sm text-blue-200 mt-2">
                Try: "restaurants in Tokyo", "museums in Paris", "hotels in New York"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Region Quick Access Shortcuts */}
      <QuickAccessButtons 
        onCountrySelect={(country) => handleSearch(`best places in ${country}`, true)}
        onRegionSelect={(query) => handleSearch(query, true)}
        loading={loading}
      />

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading && (
          <LoadingState 
            stage={loadingStage} 
            progress={loadingProgress}
            skeletonCount={8}
          />
        )}

        {searchContext && !loading && (
          <ResultsHeader
            searchContext={searchContext}
            placesCount={places.length}
            filteredCount={filteredPlaces.length}
            selectedCount={selectedPlaces.length}
            filterCount={
              activeFilters.category.length + 
              activeFilters.priceRange.length + 
              (activeFilters.rating > 0 ? 1 : 0) + 
              (activeFilters.openNow ? 1 : 0)
            }
            showMap={showMap}
            loading={loading}
            onToggleFilters={() => setShowFilters(true)}
            onToggleMap={() => setShowMap(!showMap)}
            onGenerateTrip={handleGenerateTrip}
          />
        )}

        {places.length > 0 && !loading && (
          <>
            {/* Sort Controls */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 bg-white border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Results
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Showing {sortedPlaces.length} places
                  </p>
                </div>
                <SortControls sortBy={sortBy} onSortChange={setSortBy} />
              </div>
            </div>

            <PlaceGridDisplay 
              places={sortedPlaces}
              selectedPlaceIds={selectedPlaces.map(p => p.id)}
              onSelectPlace={togglePlaceSelection}
              onSavePlace={(place) => {
                console.log('Save place:', place)
                // TODO: Implement save functionality
              }}
              onViewDetails={(path, state) => navigate(path, state)}
              getCategoryColor={getCategoryColor}
              getPriceLevelColor={getPriceLevelColor}
              emptyMessage="No places found"
            />

            {/* Selected Places Summary */}
            <SelectedPlacesSummary
              selectedPlaces={selectedPlaces}
              onGenerateTrip={handleGenerateTrip}
              onRemovePlace={(placeId) => {
                setSelectedPlaces(prev => prev.filter(p => p.id !== placeId))
              }}
            />

            {/* Explore More Button */}
            <ExploreMoreButton
              loading={loadingMore}
              placesCount={places.length}
              onClick={handleExploreMore}
            />
          </>
        )}

        {!loading && places.length === 0 && searchQuery && (
          <EmptyState
            title="No results found"
            message="Try a different search term or check your spelling"
            actionLabel="Try Popular Searches"
            onAction={() => handleSearch('restaurants in Tokyo', true)}
            icon={<Sparkles className="h-8 w-8 text-gray-400" />}
          />
        )}

        {!loading && places.length === 0 && !searchQuery && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              <Sparkles className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium mb-2">Ready to Discover?</h3>
              <p className="mb-6">Use the search bar above to find amazing places, then select them to generate a custom trip</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['restaurants in Colombo', 'temples in Kandy', 'hotels in Galle', 'beaches in Mirissa'].map((suggestion) => (
                  <Button 
                    key={suggestion}
                    variant="outline" 
                    size="sm"
                    onClick={() => handleSearch(suggestion, true)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search Filters */}
      <SearchFilters
        isOpen={showFilters}
        onClose={() => {
          setShowFilters(false)
          setFilteredPlaces(applyFilters(places))
        }}
        onFiltersChange={(newFilters) => {
          setActiveFilters(newFilters)
          setFilteredPlaces(applyFilters(places))
        }}
      />


    </div>
  )
}

export default DiscoveryPage
