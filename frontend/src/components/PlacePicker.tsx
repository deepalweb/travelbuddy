import React, { useState, useEffect } from 'react'
import { X, MapPin, Search } from 'lucide-react'

interface Place {
  placeId: string;
  name: string;
  coordinates: { lat: number; lng: number };
  address: string;
}

interface PlacePickerProps {
  onClose: () => void;
  onPlaceSelect: (place: Place) => void;
}

export const PlacePicker: React.FC<PlacePickerProps> = ({ onClose, onPlaceSelect }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)

  const searchPlaces = async (query: string) => {
    if (!query.trim()) {
      setPlaces([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/places/search?query=${encodeURIComponent(query)}&lat=6.9271&lng=79.8612&radius=50000`)
      if (response.ok) {
        const data = await response.json()
        const transformedPlaces = data.map((place: any) => ({
          placeId: place.place_id,
          name: place.name,
          coordinates: {
            lat: place.geometry?.location?.lat || 0,
            lng: place.geometry?.location?.lng || 0
          },
          address: place.formatted_address || place.vicinity || ''
        }))
        setPlaces(transformedPlaces)
      }
    } catch (error) {
      console.error('Place search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      searchPlaces(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Select Place</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search for a place..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              autoFocus
            />
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            ) : places.length > 0 ? (
              <div className="space-y-2">
                {places.map((place) => (
                  <button
                    key={place.placeId}
                    onClick={() => onPlaceSelect(place)}
                    className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">{place.name}</p>
                        <p className="text-sm text-gray-500">{place.address}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : searchQuery ? (
              <p className="text-gray-500 text-center py-4">No places found</p>
            ) : (
              <p className="text-gray-500 text-center py-4">Start typing to search places</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
