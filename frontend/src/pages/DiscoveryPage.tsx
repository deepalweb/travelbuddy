import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchBar } from '../components/SearchBar'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { PlaceCardSkeleton } from '../components/SkeletonLoader'
import { ErrorState } from '../components/ErrorState'
import { EmptyState } from '../components/EmptyState'
import { SearchFilters } from '../components/SearchFilters'

import PlaceDetailsModal from '../components/PlaceDetailsModal'
import { apiService } from '../lib/api'
import { 
  MapPin, 
  Star, 
  Clock, 
  Phone, 
  Globe, 
  Navigation,
  Sparkles,
  TrendingUp,
  Check,
  Plus,
  Plane
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
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState(globalSearchState.query)
  const [searchContext, setSearchContext] = useState(globalSearchState.context)
  const [hasMore, setHasMore] = useState(globalSearchState.places.length > 0)
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState({ category: [], priceRange: [], rating: 0, location: '' })
  const [showMap, setShowMap] = useState(false)

  const handleSearch = async (query: string, isNewSearch = true) => {
    if (!query.trim()) return
    
    const cacheKey = query.toLowerCase().trim()
    
    if (isNewSearch) {
      setLoading(true)
      setSearchQuery(query)
      
      // Check cache first
      const cached = searchCache.get(cacheKey)
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        console.log('🎯 Using cached results for:', query)
        setPlaces(cached.data)
        setSearchContext(cached.context)
        setHasMore(true)
        setLoading(false)
        
        // Update global state
        globalSearchState = {
          places: cached.data,
          query: query,
          context: cached.context
        }
        return
      }
      
      setPlaces([])
    } else {
      setLoadingMore(true)
    }
    
    try {
      console.log('🔄 Fetching new results for:', query)
      const results = await apiService.searchPlaces(query, { limit: 8 })
      
      if (isNewSearch) {
        const newPlaces = results || []
        const context = `AI-powered results for "${query}"`
        
        setPlaces(newPlaces)
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
        setPlaces(prev => [...prev, ...(results || [])])
      }
      setHasMore(true)
    } catch (error) {
      console.error('Search failed:', error)
      if (isNewSearch) {
        setPlaces([])
        setSearchContext('Search failed. Please try again.')
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
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
    setSelectedPlaces(prev => {
      const isSelected = prev.some(p => p.id === place.id)
      if (isSelected) {
        return prev.filter(p => p.id !== place.id)
      } else {
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
      <div className="bg-white border-b border-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-4">
            {/* Country Dropdown */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Explore by Country:</span>
              <select 
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => e.target.value && handleSearch(`best places in ${e.target.value}`, true)}
                defaultValue=""
              >
                <option value="">Select a country</option>
                <option value="Japan">🇯🇵 Japan</option>
                <option value="France">🇫🇷 France</option>
                <option value="Italy">🇮🇹 Italy</option>
                <option value="Thailand">🇹🇭 Thailand</option>
                <option value="United States">🇺🇸 United States</option>
                <option value="United Kingdom">🇬🇧 United Kingdom</option>
                <option value="Spain">🇪🇸 Spain</option>
                <option value="Germany">🇩🇪 Germany</option>
                <option value="Australia">🇦🇺 Australia</option>
                <option value="Canada">🇨🇦 Canada</option>
                <option value="India">🇮🇳 India</option>
                <option value="China">🇨🇳 China</option>
                <option value="Brazil">🇧🇷 Brazil</option>
                <option value="Mexico">🇲🇽 Mexico</option>
                <option value="Sri Lanka">🇱🇰 Sri Lanka</option>
              </select>
            </div>
            
            {/* Region Chips */}
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { label: '🌍 Asia', query: 'attractions in Asia' },
                { label: '🇪🇺 Europe', query: 'attractions in Europe' },
                { label: '🇺🇸 Americas', query: 'attractions in Americas' },
                { label: '🌊 Islands', query: 'tropical islands destinations' },
                { label: '🏔️ Mountains', query: 'mountain destinations' },
                { label: '🏛️ Culture', query: 'cultural attractions museums' }
              ].map((region) => (
                <Button
                  key={region.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSearch(region.query, true)}
                  className="border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                >
                  {region.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading && (
          <>
            <div className="text-center py-8">
              <div className="inline-flex items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-lg text-gray-600">AI is discovering amazing places for you...</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <PlaceCardSkeleton key={i} />
              ))}
            </div>
          </>
        )}

        {searchContext && !loading && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">Discovery Results</h2>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => setShowFilters(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Filters
                  {(activeFilters.category.length > 0 || activeFilters.priceRange.length > 0) && (
                    <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {activeFilters.category.length + activeFilters.priceRange.length}
                    </span>
                  )}
                </Button>
                <Button
                  onClick={() => setShowMap(!showMap)}
                  variant="outline"
                  size="sm"
                  className="flex items-center"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  {showMap ? 'Hide Map' : 'Show Map'}
                </Button>
                {selectedPlaces.length > 0 && (
                  <Button
                    onClick={handleGenerateTrip}
                    className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white"
                  >
                    <Plane className="h-4 w-4 mr-2" />
                    Generate Trip ({selectedPlaces.length})
                  </Button>
                )}
              </div>
            </div>
            <p className="text-gray-600">{searchContext}</p>
            <p className="text-sm text-gray-500 mt-1">
              Found {places.length} places • Powered by Azure OpenAI
              {searchCache.has(searchQuery.toLowerCase().trim()) && ' • Cached'}
              {selectedPlaces.length > 0 && ` • ${selectedPlaces.length} selected for trip`}
            </p>
          </div>
        )}

        {places.length > 0 && !loading && (
          <>

            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {places.map((place) => (
                <Card key={place.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 group">
                  <div className="relative">
                    <div className="relative w-full h-48 bg-gray-200 overflow-hidden">
                      <img 
                        src={place.image} 
                        alt={place.name}
                        className="w-full h-48 object-cover transition-all duration-300 hover:scale-105"
                        loading="lazy"
                        onLoad={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.opacity = '1'
                          const loader = target.parentElement?.querySelector('.image-loader')
                          if (loader) loader.classList.add('hidden')
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          const loader = target.parentElement?.querySelector('.image-loader')
                          if (loader) loader.classList.add('hidden')
                          
                          if (!target.src.includes('source.unsplash.com')) {
                            target.src = `https://source.unsplash.com/800x600/?${encodeURIComponent(place.name)},${encodeURIComponent(place.location.city)},landmark`
                          } else if (!target.src.includes('picsum.photos')) {
                            target.src = `https://picsum.photos/seed/${encodeURIComponent(place.id)}/800/600`
                          } else {
                            target.style.display = 'none'
                            const placeholder = target.parentElement?.querySelector('.image-placeholder')
                            if (placeholder) placeholder.classList.remove('hidden')
                          }
                        }}
                        style={{ opacity: 0 }}
                      />
                      <div className="image-loader absolute inset-0 flex items-center justify-center bg-gray-100">
                        <div className="animate-pulse flex items-center justify-center">
                          <div className="w-8 h-8 bg-gray-300 rounded-full animate-bounce"></div>
                        </div>
                      </div>
                      <div className="image-placeholder hidden absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                        <div className="text-center">
                          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 font-medium">{place.category}</p>
                          <p className="text-xs text-gray-400">{place.name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-3 left-3">
                      <Badge className={getCategoryColor(place.category)}>
                        {place.category}
                      </Badge>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-white text-gray-800">
                        <Star className="h-3 w-3 mr-1 fill-current text-yellow-500" />
                        {place.rating}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{place.name}</h3>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{place.location.city}, {place.location.country}</span>
                        <span className={`ml-2 font-semibold ${getPriceLevelColor(place.priceLevel)}`}>
                          {place.priceLevel}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                      {place.description}
                    </p>

                    {/* Highlights */}
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {place.highlights.slice(0, 3).map((highlight, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {highlight}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 text-xs text-gray-500">
                      {place.openHours && (
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{place.openHours}</span>
                        </div>
                      )}
                      {place.contact.phone && place.contact.phone !== 'Not available' && (
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          <span>{place.contact.phone}</span>
                        </div>
                      )}
                      {place.contact.website && (
                        <div className="flex items-center">
                          <Globe className="h-3 w-3 mr-1" />
                          <a 
                            href={place.contact.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Visit Website
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 space-y-2">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant={isPlaceSelected(place) ? "default" : "outline"}
                          className={`flex-1 ${isPlaceSelected(place) 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                          }`}
                          onClick={() => togglePlaceSelection(place)}
                        >
                          {isPlaceSelected(place) ? (
                            <><Check className="h-3 w-3 mr-1" />Selected</>
                          ) : (
                            <><Plus className="h-3 w-3 mr-1" />Select</>
                          )}
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white">
                          Save
                        </Button>
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white border-none"
                        onClick={() => {
                          setSelectedPlace(place)
                          setShowModal(true)
                        }}
                      >
                        <Sparkles className="h-3 w-3 mr-1" />
                        More Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Action Buttons */}
            {places.length > 0 && (
              <div className="text-center mt-8 space-y-4">
                {selectedPlaces.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-blue-900">Selected Places for Trip</h3>
                        <p className="text-sm text-blue-700">
                          {selectedPlaces.length} place{selectedPlaces.length !== 1 ? 's' : ''} selected
                        </p>
                      </div>
                      <Button
                        onClick={handleGenerateTrip}
                        className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white"
                      >
                        <Plane className="h-4 w-4 mr-2" />
                        Generate Trip
                      </Button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedPlaces.map((place) => (
                        <Badge key={place.id} className="bg-blue-100 text-blue-800">
                          {place.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <Button 
                  onClick={handleExploreMore}
                  disabled={loadingMore}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-none"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Loading More...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Explore More Places
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  Showing {places.length} places • Click to discover more
                </p>
              </div>
            )}
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
        onClose={() => setShowFilters(false)}
        onFiltersChange={setActiveFilters}
      />

      {/* Place Details Modal */}
      <PlaceDetailsModal 
        place={selectedPlace}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedPlace(null)
        }}
      />
    </div>
  )
}

export default DiscoveryPage