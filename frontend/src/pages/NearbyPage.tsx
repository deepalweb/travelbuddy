import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin,
  Navigation,
  Search,
  Filter,
  RefreshCw,
  Compass,
  Star,
  Clock,
  ExternalLink,
  PlusCircle,
  Bookmark,
  BookmarkCheck,
  AlertCircle,
  AlertTriangle,
  Info,
  Check,
  Layers,
  ChevronRight,
  X
} from 'lucide-react'
import { Button } from '../components/Button'
import { Card, CardContent } from '../components/Card'
import { placesApiService } from '../services/placesApiService'
import { tripService, type TripPlan } from '../services/tripService'
import { useAuth } from '../contexts/AuthContext'

export interface NearbyPlace {
  placeId: string
  name: string
  category: string
  address: string
  location?: { lat: number; lng: number } | null
  distanceMeters?: number | null
  distance_m?: number | null
  rating?: number | null
  userRatingsTotal?: number | null
  user_ratings_total?: number | null
  openNow?: boolean | null
  business_status?: string
  photoReference?: string | null
  photoUrl?: string | null
  photos?: Array<{ photo_reference: string }>
  googleMapsUrl?: string | null
}

const CATEGORIES = [
  { id: 'all', label: 'All places', query: 'points of interest' },
  { id: 'restaurants', label: 'Restaurants & Cafes', query: 'restaurants cafes food' },
  { id: 'attractions', label: 'Attractions', query: 'tourist attractions landmarks' },
  { id: 'parks', label: 'Parks & Nature', query: 'parks nature gardens' },
  { id: 'culture', label: 'Cultural Sites', query: 'museums temples historic sites' },
  { id: 'accommodation', label: 'Accommodation', query: 'hotels lodging stays' }
]

const RADII = [
  { label: '1 km', value: 1000 },
  { label: '5 km', value: 5000 },
  { label: '10 km', value: 10000 },
  { label: '25 km', value: 25000 }
]

export const NearbyPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Coordinates & Location State
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLabel, setLocationLabel] = useState<string>('')
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null)
  const [isLocating, setIsLocating] = useState<boolean>(false)
  const [showLocationExplainer, setShowLocationExplainer] = useState<boolean>(false)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Manual search input
  const [manualQuery, setManualQuery] = useState<string>('')
  const [isGeocoding, setIsGeocoding] = useState<boolean>(false)

  // Search parameters
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedRadius, setSelectedRadius] = useState<number>(5000)
  const [sortBy, setSortBy] = useState<'distance' | 'rating'>('distance')

  // Results & UI State
  const [places, setPlaces] = useState<NearbyPlace[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split')

  // Saved places & Add to Trip
  const [savedPlaceIds, setSavedPlaceIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('travelbuddy_saved_places')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch {
      return new Set()
    }
  })
  const [addToTripPlace, setAddToTripPlace] = useState<NearbyPlace | null>(null)
  const [userTrips, setUserTrips] = useState<TripPlan[]>([])
  const [selectedTripId, setSelectedTripId] = useState<string>('')
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(1)
  const [isAddingToTrip, setIsAddingToTrip] = useState<boolean>(false)
  const [addToTripSuccess, setAddToTripSuccess] = useState<string | null>(null)

  // Request user location with clear permission explanation
  const handleRequestLocation = () => {
    setShowLocationExplainer(false)
    setIsLocating(true)
    setLocationError(null)

    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation is not supported by your browser. Please search by city or address.')
      setIsLocating(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setCoords({ lat: latitude, lng: longitude })
        setLocationAccuracy(accuracy)
        setIsLocating(false)
        setLocationLabel(`Current Location (±${Math.round(accuracy)}m)`)

        // Attempt reverse geocode for a readable city/area label
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14`, {
          headers: { 'User-Agent': 'TravelBuddy-CoreMVP/1.0' }
        })
          .then((res) => res.json())
          .then((data) => {
            if (data?.display_name) {
              const parts = data.display_name.split(',')
              const readable = parts.slice(0, 3).join(',').trim()
              setLocationLabel(readable || `Lat ${latitude.toFixed(4)}, Lng ${longitude.toFixed(4)}`)
            }
          })
          .catch(() => {})
      },
      (error) => {
        setIsLocating(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission was denied. You can search by entering a city or address below.')
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is currently unavailable. Please verify device GPS or search manually.')
            break
          case error.TIMEOUT:
            setLocationError('Location request timed out. Please try again or search by address.')
            break
          default:
            setLocationError('An error occurred while obtaining your location. Please enter a city or address.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  // Geocode manual address search
  const handleManualSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!manualQuery.trim()) return

    setIsGeocoding(true)
    setLocationError(null)

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualQuery.trim())}&limit=1`,
        { headers: { 'User-Agent': 'TravelBuddy-CoreMVP/1.0' } }
      )
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)
        setCoords({ lat, lng })
        setLocationAccuracy(null)
        setLocationLabel(data[0].display_name.split(',').slice(0, 3).join(',').trim())
      } else {
        setLocationError(`No location found for "${manualQuery}". Try adding a city or country name.`)
      }
    } catch (err) {
      setLocationError('Could not connect to geocoding service. Please check your connection and try again.')
    } finally {
      setIsGeocoding(false)
    }
  }

  // Fetch nearby places when coords, category, radius, or sortBy change
  const fetchPlaces = async () => {
    if (!coords) return

    setIsLoading(true)
    setSearchError(null)

    try {
      const categoryObj = CATEGORIES.find((c) => c.id === selectedCategory)
      const q = categoryObj && categoryObj.id !== 'all' ? categoryObj.query : 'points of interest'
      const data = await placesApiService.getNearbyPlaces(coords.lat, coords.lng, q, selectedRadius)

      let results: NearbyPlace[] = []
      if (Array.isArray(data)) {
        results = data
      } else if (data && Array.isArray((data as any).results)) {
        results = (data as any).results
      }

      // Sort client-side if provider supplies ratings and rating sort chosen
      if (sortBy === 'rating') {
        results.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      } else {
        results.sort((a, b) => (a.distanceMeters ?? a.distance_m ?? Infinity) - (b.distanceMeters ?? b.distance_m ?? Infinity))
      }

      setPlaces(results)
    } catch (err: any) {
      console.warn('Nearby places error:', err)
      const msg = err?.message || 'Failed to fetch nearby places from provider.'
      setSearchError(msg)
      setPlaces([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (coords) {
      void fetchPlaces()
    }
  }, [coords, selectedCategory, selectedRadius, sortBy])

  // Toggle save place locally
  const toggleSavePlace = (place: NearbyPlace) => {
    const id = place.placeId || place.name
    setSavedPlaceIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      try {
        localStorage.setItem('travelbuddy_saved_places', JSON.stringify(Array.from(next)))
      } catch {}
      return next
    })
  }

  // Load user trips for "Add to Trip" dialog
  const openAddToTrip = async (place: NearbyPlace) => {
    setAddToTripPlace(place)
    setAddToTripSuccess(null)
    if (user) {
      try {
        const trips = await tripService.getUserTripPlans()
        setUserTrips(trips)
        if (trips.length > 0) {
          setSelectedTripId(trips[0]._id)
        }
      } catch {
        setUserTrips([])
      }
    }
  }

  // Execute add to trip
  const handleConfirmAddToTrip = async () => {
    if (!addToTripPlace) return

    if (!user) {
      // Create new draft in trip planner
      navigate('/trips', {
        state: {
          draftStop: {
            name: addToTripPlace.name,
            address: addToTripPlace.address,
            placeId: addToTripPlace.placeId,
            coordinates: addToTripPlace.location,
            mapsUrl: addToTripPlace.googleMapsUrl
          }
        }
      })
      return
    }

    if (!selectedTripId) {
      // Create new draft with this place
      navigate('/trips', {
        state: {
          draftStop: {
            name: addToTripPlace.name,
            address: addToTripPlace.address,
            placeId: addToTripPlace.placeId,
            coordinates: addToTripPlace.location,
            mapsUrl: addToTripPlace.googleMapsUrl
          }
        }
      })
      return
    }

    setIsAddingToTrip(true)
    try {
      const trip = await tripService.getTripById(selectedTripId)
      if (!trip) throw new Error('Selected trip not found.')

      const targetDayIndex = Math.max(0, selectedDayNumber - 1)
      const itinerary = [...(trip.dailyItinerary || [])]

      // Ensure target day exists
      while (itinerary.length <= targetDayIndex) {
        const newDayNum = itinerary.length + 1
        itinerary.push({
          day: newDayNum,
          date: '',
          theme: `Day ${newDayNum}`,
          activities: []
        })
      }

      const dayObj = { ...itinerary[targetDayIndex] }
      const newActivity = {
        stopId: `stop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timeSlot: 'Flexible',
        activityType: addToTripPlace.category || 'attraction',
        activityTitle: `Visit ${addToTripPlace.name}`,
        placeName: addToTripPlace.name,
        fullAddress: addToTripPlace.address,
        googlePlaceId: addToTripPlace.placeId,
        details: `Discovered nearby: ${addToTripPlace.address}`,
        cost: '$0',
        notes: 'Added from Nearby discovery',
        estimatedDuration: '1 - 2 hours',
        googleMapsUrl: addToTripPlace.googleMapsUrl || (addToTripPlace.location ? `https://www.google.com/maps/search/?api=1&query=${addToTripPlace.location.lat},${addToTripPlace.location.lng}` : undefined),
        coordinates: addToTripPlace.location ? { lat: addToTripPlace.location.lat, lng: addToTripPlace.location.lng } : undefined,
        rating: addToTripPlace.rating ?? undefined,
        userRatingsTotal: addToTripPlace.userRatingsTotal ?? undefined,
        photoReference: addToTripPlace.photoReference || undefined,
        groundingSource: 'verified' as const
      }

      dayObj.activities = [...(dayObj.activities || []), newActivity]
      itinerary[targetDayIndex] = dayObj

      await tripService.updateTrip(selectedTripId, {
        dailyItinerary: itinerary,
        version: trip.version
      })

      setAddToTripSuccess(`Added "${addToTripPlace.name}" to Day ${selectedDayNumber} of "${trip.tripTitle}"!`)
      setTimeout(() => {
        setAddToTripPlace(null)
        setAddToTripSuccess(null)
      }, 2000)
    } catch (err: any) {
      alert(`Could not add to trip: ${err?.message || 'Unknown error'}`)
    } finally {
      setIsAddingToTrip(false)
    }
  }

  // Format straight-line distance
  const formatDistance = (meters?: number | null) => {
    if (meters === undefined || meters === null) return 'Distance unknown'
    if (meters < 1000) return `${Math.round(meters)} m away (straight-line)`
    return `${(meters / 1000).toFixed(1)} km away (straight-line)`
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <Compass className="h-4 w-4" />
            <span>Real-world discovery</span>
          </div>
          <h1 className="font-heading mt-1 text-3xl font-bold text-slate-950 sm:text-4xl">
            Find Places Nearby
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Discover verified spots near your current location or chosen destination, with real provider facts.
          </p>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`hidden rounded-xl px-3 py-2 text-xs font-semibold lg:inline-flex ${
              viewMode === 'split' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Split view
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`rounded-xl px-3 py-2 text-xs font-semibold ${
              viewMode === 'list' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            List only
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`rounded-xl px-3 py-2 text-xs font-semibold ${
              viewMode === 'map' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Map only
          </button>
        </div>
      </div>

      {/* Location Bar & Controls */}
      <Card className="mb-6 border-slate-200 bg-white shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Geolocation Trigger */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => setShowLocationExplainer(true)}
                disabled={isLocating}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {isLocating ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Navigation className="mr-2 h-4 w-4" />
                )}
                Use my location
              </Button>

              {coords && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={fetchPlaces}
                  disabled={isLoading}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              )}
            </div>

            {/* Manual Address Search */}
            <form onSubmit={handleManualSearch} className="flex flex-1 items-center gap-2 lg:max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={manualQuery}
                  onChange={(e) => setManualQuery(e.target.value)}
                  placeholder="Or enter city, address, or landmark..."
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
              <Button
                type="submit"
                disabled={isGeocoding || !manualQuery.trim()}
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                {isGeocoding ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </form>
          </div>

          {/* Active Location Info & Alerts */}
          {coords ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-slate-900">Search Center:</span>
                <span>{locationLabel}</span>
                <span className="text-slate-400">
                  ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
                </span>
                {locationAccuracy && (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
                    Accuracy: ±{Math.round(locationAccuracy)}m
                  </span>
                )}
              </div>
              <span className="font-medium text-emerald-700">
                Area: {selectedRadius / 1000} km radius around center
              </span>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
              <Info className="h-4 w-4 text-slate-400" />
              <span>
                Click <strong>"Use my location"</strong> or enter an address above to discover nearby places.
              </span>
            </div>
          )}

          {locationError && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>{locationError}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters & Radius Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        {/* Category Chips */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                selectedCategory === cat.id
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Radius & Sort Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-medium">Radius:</span>
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-0.5">
              {RADII.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setSelectedRadius(r.value)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                    selectedRadius === r.value
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'distance' | 'rating')}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-emerald-600 focus:outline-none"
            >
              <option value="distance">By distance</option>
              <option value="rating">By provider rating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error state */}
      {searchError && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <div className="flex items-center gap-2 font-bold text-rose-800">
            <AlertCircle className="h-5 w-5" />
            <span>Provider Search Error</span>
          </div>
          <p className="mt-1 text-xs">{searchError}</p>
          <p className="mt-2 text-xs text-rose-700">
            No synthetic or fabricated places are substituted. You can retry with a different radius or location.
          </p>
        </div>
      )}

      {/* Content Area */}
      {!coords ? (
        <Card className="border-slate-200 bg-white py-16 text-center">
          <CardContent>
            <Compass className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="font-heading mt-4 text-2xl font-bold text-slate-900">
              Ready to explore your surroundings?
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              Enable foreground location access or type in any city to discover factual places, verified ratings, and direct routing.
            </p>
            <Button
              type="button"
              onClick={() => setShowLocationExplainer(true)}
              className="mt-6 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Navigation className="mr-2 h-4 w-4" />
              Use my location
            </Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="py-24 text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
          <p className="mt-3 font-semibold text-slate-700">Searching factual places within {selectedRadius / 1000} km...</p>
        </div>
      ) : places.length === 0 ? (
        <Card className="border-slate-200 bg-white py-16 text-center">
          <CardContent>
            <MapPin className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="font-heading mt-4 text-2xl font-bold text-slate-900">
              No verified places found in this area
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              Try increasing the search radius to 10 km or 25 km, or change the category filter.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => setSelectedRadius(25000)}
                className="border-slate-200 text-xs font-semibold"
              >
                Expand to 25 km
              </Button>
              <Button
                variant="outline"
                onClick={() => setSelectedCategory('all')}
                className="border-slate-200 text-xs font-semibold"
              >
                Reset to All places
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div
          className={`grid gap-6 ${
            viewMode === 'split'
              ? 'lg:grid-cols-12'
              : viewMode === 'list'
              ? 'grid-cols-1'
              : 'grid-cols-1'
          }`}
        >
          {/* Results List */}
          {(viewMode === 'split' || viewMode === 'list') && (
            <div className={`space-y-4 ${viewMode === 'split' ? 'lg:col-span-7' : 'w-full'}`}>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Found {places.length} factual places</span>
                <span>Sorted by {sortBy === 'rating' ? 'provider rating' : 'straight-line distance'}</span>
              </div>

              {places.map((place) => {
                const isSelected = selectedPlaceId === place.placeId
                const isSaved = savedPlaceIds.has(place.placeId || place.name)
                const distanceMeters = place.distanceMeters ?? place.distance_m
                const photoRef = place.photoReference || place.photos?.[0]?.photo_reference
                const photoSrc = photoRef
                  ? `${import.meta.env.VITE_API_BASE_URL || ''}/api/places/photo?ref=${encodeURIComponent(photoRef)}&w=240`
                  : null

                return (
                  <Card
                    key={place.placeId || place.name}
                    className={`cursor-pointer overflow-hidden border transition ${
                      isSelected
                        ? 'border-emerald-600 ring-2 ring-emerald-600/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => setSelectedPlaceId(place.placeId)}
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row">
                        {/* Place Photo (if provided by provider) */}
                        {photoSrc && (
                          <div className="h-32 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-28 sm:w-28">
                            <img
                              src={photoSrc}
                              alt={place.name}
                              className="h-full w-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none'
                              }}
                            />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700">
                              {place.category || 'Place'}
                            </span>
                            {typeof place.rating === 'number' && (
                              <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
                                <Star className="h-3.5 w-3.5 fill-current" />
                                {place.rating.toFixed(1)}
                                {place.userRatingsTotal ? (
                                  <span className="text-[10px] text-slate-500">
                                    ({place.userRatingsTotal})
                                  </span>
                                ) : null}
                              </span>
                            )}
                            {place.openNow !== null && place.openNow !== undefined ? (
                              <span
                                className={`text-[10px] font-bold ${
                                  place.openNow ? 'text-emerald-700' : 'text-slate-500'
                                }`}
                              >
                                {place.openNow ? '• Open now' : '• Closed now'}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">• Hours unknown</span>
                            )}
                          </div>

                          <h3 className="mt-1 text-base font-bold text-slate-950 sm:text-lg">
                            {place.name}
                          </h3>

                          {place.address && (
                            <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                              {place.address}
                            </p>
                          )}

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span className="font-semibold text-emerald-700">
                              {formatDistance(distanceMeters)}
                            </span>
                            {place.location && (
                              <span className="text-slate-400">
                                {place.location.lat.toFixed(4)}, {place.location.lng.toFixed(4)}
                              </span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                            {place.location && (
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${place.location.lat},${place.location.lng}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Get directions
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleSavePlace(place)
                              }}
                              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                                isSaved
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {isSaved ? (
                                <>
                                  <BookmarkCheck className="h-3.5 w-3.5 text-emerald-600" />
                                  Saved
                                </>
                              ) : (
                                <>
                                  <Bookmark className="h-3.5 w-3.5" />
                                  Save place
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                void openAddToTrip(place)
                              }}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                            >
                              <PlusCircle className="h-3.5 w-3.5 text-emerald-400" />
                              Add to trip
                            </button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Interactive Map & Search Area Visualization */}
          {(viewMode === 'split' || viewMode === 'map') && (
            <div className={`${viewMode === 'split' ? 'lg:col-span-5' : 'w-full'} sticky top-20`}>
              <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
                <CardContent className="p-0">
                  <div className="relative h-[550px] w-full bg-slate-100">
                    {/* SVG Map Canvas displaying search center, radius boundary, and placed spots */}
                    {coords && (
                      <svg className="h-full w-full bg-slate-50" viewBox="0 0 500 500">
                        {/* Grid lines */}
                        <defs>
                          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e2e8f0" strokeWidth="0.8" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />

                        {/* Search Radius Circle (centered at 250, 250) */}
                        <circle
                          cx="250"
                          cy="250"
                          r="180"
                          fill="#10b981"
                          fillOpacity="0.08"
                          stroke="#10b981"
                          strokeWidth="2"
                          strokeDasharray="4 4"
                        />
                        <text x="250" y="80" textAnchor="middle" fill="#047857" fontSize="11" fontWeight="600">
                          {selectedRadius / 1000} km Search Area
                        </text>

                        {/* Center Marker */}
                        <circle cx="250" cy="250" r="8" fill="#059669" stroke="#ffffff" strokeWidth="2.5" />
                        <circle cx="250" cy="250" r="16" fill="none" stroke="#059669" strokeWidth="1" strokeOpacity="0.5" />
                        <text x="250" y="275" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="700">
                          You / Center
                        </text>

                        {/* Place Markers plotted relatively by lat/lng delta */}
                        {places.map((place, idx) => {
                          if (!place.location) return null
                          // Map coordinates relative to center (scaled so radius = 180px)
                          const latDelta = (place.location.lat - coords.lat) * 111320
                          const lngDelta =
                            (place.location.lng - coords.lng) *
                            111320 *
                            Math.cos((coords.lat * Math.PI) / 180)
                          const scale = 180 / selectedRadius
                          const x = Math.max(25, Math.min(475, 250 + lngDelta * scale))
                          const y = Math.max(25, Math.min(475, 250 - latDelta * scale))
                          const isSelected = selectedPlaceId === place.placeId

                          return (
                            <g
                              key={place.placeId || idx}
                              onClick={() => setSelectedPlaceId(place.placeId)}
                              className="cursor-pointer transition"
                            >
                              <circle
                                cx={x}
                                cy={y}
                                r={isSelected ? 10 : 6}
                                fill={isSelected ? '#0ea5e9' : '#0f172a'}
                                stroke="#ffffff"
                                strokeWidth="2"
                              />
                              {isSelected && (
                                <circle cx={x} cy={y} r="15" fill="none" stroke="#0ea5e9" strokeWidth="1.5" />
                              )}
                              <text
                                x={x}
                                y={y - 12}
                                textAnchor="middle"
                                fill={isSelected ? '#0369a1' : '#334155'}
                                fontSize="9"
                                fontWeight={isSelected ? '700' : '500'}
                              >
                                {place.name.length > 18 ? `${place.name.slice(0, 16)}…` : place.name}
                              </text>
                            </g>
                          )
                        })}
                      </svg>
                    )}

                    {/* Map Overlay Badge */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-xl bg-white/95 p-3 text-xs shadow-md backdrop-blur">
                      <div>
                        <p className="font-bold text-slate-900">
                          {selectedPlaceId
                            ? places.find((p) => p.placeId === selectedPlaceId)?.name || 'Selected Place'
                            : 'Select a place from the list or map'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Straight-line projection within {selectedRadius / 1000} km
                        </p>
                      </div>
                      {coords && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
                        >
                          Open in Google Maps
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Location Permission Explainer Modal */}
      {showLocationExplainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md border-slate-200 bg-white shadow-2xl">
            <CardContent className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Navigation className="h-6 w-6" />
              </div>
              <h3 className="font-heading mt-4 text-xl font-bold text-slate-950">
                Use your current location
              </h3>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                TravelBuddy uses your foreground coordinates only to find real restaurants, cultural sites, and attractions within your chosen search radius.
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Foreground only: no background or ongoing tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Never stored as a location history trail</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>You can switch to manual address lookup anytime</span>
                </li>
              </ul>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowLocationExplainer(false)}
                  className="border-slate-200 text-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRequestLocation}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Allow location
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add to Trip Dialog Modal */}
      {addToTripPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md border-slate-200 bg-white shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Add Stop to Itinerary
                  </span>
                  <h3 className="font-heading mt-1 text-xl font-bold text-slate-950">
                    {addToTripPlace.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{addToTripPlace.address}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddToTripPlace(null)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {addToTripSuccess ? (
                <div className="my-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-xs font-bold text-emerald-800">
                  <Check className="mx-auto mb-1 h-6 w-6 text-emerald-600" />
                  {addToTripSuccess}
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {user ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700">Choose Trip:</label>
                        {userTrips.length > 0 ? (
                          <select
                            value={selectedTripId}
                            onChange={(e) => setSelectedTripId(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none"
                          >
                            {userTrips.map((t) => (
                              <option key={t._id} value={t._id}>
                                {t.tripTitle} ({t.destination})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="mt-1 text-xs text-slate-500">
                            No saved trips found. You can start a new trip draft with this stop.
                          </p>
                        )}
                      </div>

                      {userTrips.length > 0 && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700">
                            Choose Itinerary Day:
                          </label>
                          <div className="mt-1 flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setSelectedDayNumber(d)}
                                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                                  selectedDayNumber === d
                                    ? 'bg-slate-900 text-white'
                                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                Day {d}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                      Sign in to add this stop directly to an existing saved trip, or start a new trip draft now.
                    </div>
                  )}

                  <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setAddToTripPlace(null)}
                      className="border-slate-200 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConfirmAddToTrip}
                      disabled={isAddingToTrip}
                      className="bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      {isAddingToTrip ? (
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      {user && selectedTripId ? 'Add to selected trip' : 'Start new trip draft'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
