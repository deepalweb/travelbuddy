import React, { useState, useEffect } from 'react'
import { MapPin, Navigation, Search, Loader } from 'lucide-react'
import { InteractiveMap } from './InteractiveMap'

interface LocationData {
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  city: string
  country: string
}

interface LocationPickerProps {
  value: LocationData
  onChange: (location: LocationData) => void
  required?: boolean
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ value, onChange, required = false }) => {
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])

  // Get current location using browser geolocation
  const getCurrentLocation = () => {
    setLoading(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude

          // Reverse geocode to get address
          try {
            const address = await reverseGeocode(lat, lng)
            onChange({
              address,
              coordinates: { lat, lng },
              city: extractCity(address),
              country: extractCountry(address)
            })
          } catch (error) {
            onChange({
              address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
              coordinates: { lat, lng },
              city: '',
              country: ''
            })
          }
          setLoading(false)
        },
        (error) => {
          alert('Unable to get your location. Please enter manually.')
          setLoading(false)
        }
      )
    } else {
      alert('Geolocation is not supported by your browser')
      setLoading(false)
    }
  }

  // Reverse geocode using Nominatim (OpenStreetMap)
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    )
    const data = await response.json()
    return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }

  // Search location using Nominatim
  const searchLocation = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      return
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      )
      const data = await response.json()
      setSuggestions(data)
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchLocation(searchQuery)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const selectSuggestion = (suggestion: any) => {
    onChange({
      address: suggestion.display_name,
      coordinates: {
        lat: parseFloat(suggestion.lat),
        lng: parseFloat(suggestion.lon)
      },
      city: suggestion.address?.city || suggestion.address?.town || suggestion.address?.village || '',
      country: suggestion.address?.country || ''
    })
    setSearchQuery('')
    setSuggestions([])
  }

  const extractCity = (address: string): string => {
    const parts = address.split(',')
    return parts[1]?.trim() || parts[0]?.trim() || ''
  }

  const extractCountry = (address: string): string => {
    const parts = address.split(',')
    return parts[parts.length - 1]?.trim() || ''
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Location {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for address, city, or place..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selectSuggestion(suggestion)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 text-blue-600 mt-1 mr-2 flex-shrink-0" />
                  <div className="text-sm text-gray-900">{suggestion.display_name}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Current Location Button */}
      <button
        type="button"
        onClick={getCurrentLocation}
        disabled={loading}
        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader className="h-5 w-5 animate-spin" />
            <span>Getting location...</span>
          </>
        ) : (
          <>
            <Navigation className="h-5 w-5" />
            <span>Use My Current Location</span>
          </>
        )}
      </button>

      {/* Manual Coordinates Input */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Latitude {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="number"
            step="any"
            value={value.coordinates.lat || ''}
            onChange={(e) => onChange({
              ...value,
              coordinates: { ...value.coordinates, lat: parseFloat(e.target.value) || 0 }
            })}
            placeholder="e.g., 6.9271"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required={required}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Longitude {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="number"
            step="any"
            value={value.coordinates.lng || ''}
            onChange={(e) => onChange({
              ...value,
              coordinates: { ...value.coordinates, lng: parseFloat(e.target.value) || 0 }
            })}
            placeholder="e.g., 79.8612"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required={required}
          />
        </div>
      </div>

      {/* Address Display */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Address {required && <span className="text-red-500">*</span>}
        </label>
        <textarea
          value={value.address}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          rows={2}
          placeholder="Enter or edit the full address"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required={required}
        />
      </div>

      {/* Interactive Map */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Click or Drag Marker on Map to Select Location
        </label>
        <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
          {typeof window !== 'undefined' && window.google ? (
            <InteractiveMap
              lat={value.coordinates.lat || 6.9271}
              lng={value.coordinates.lng || 79.8612}
              onLocationChange={async (lat, lng) => {
                const address = await reverseGeocode(lat, lng)
                onChange({
                  address,
                  coordinates: { lat, lng },
                  city: extractCity(address),
                  country: extractCountry(address)
                })
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Loading map...</p>
              </div>
            </div>
          )}
          <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <p className="text-xs text-gray-600">
              📍 Current: {value.coordinates.lat.toFixed(6)}, {value.coordinates.lng.toFixed(6)}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              👆 Click map or drag marker to change location
            </p>
          </div>
        </div>
      </div>

      {/* Map Preview Link */}
      {value.coordinates.lat !== 0 && value.coordinates.lng !== 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">Location Set Successfully</p>
              <p className="text-xs text-green-700 mt-1">
                Coordinates: {value.coordinates.lat.toFixed(6)}, {value.coordinates.lng.toFixed(6)}
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${value.coordinates.lat},${value.coordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 underline mt-2 inline-block"
              >
                Open in Google Maps →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          💡 <strong>Tip:</strong> Accurate GPS coordinates help travelers find you on the mobile app's "Near Me" feature.
        </p>
      </div>
    </div>
  )
}
