import React from 'react'
import { X, Star, MapPin, Clock, Phone, Globe, DollarSign } from 'lucide-react'
import { Button } from './Button'
import { Badge } from './Badge'
import { usePlaceStore } from '../store/placeStore'

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
  }
  contact: {
    phone: string
    website: string
  }
  openHours: string
  highlights: string[]
}

const PlaceComparison: React.FC = () => {
  const { compareSelection, removeFromComparison, clearComparison } = usePlaceStore()

  if (compareSelection.length === 0) return null

  return (
    <div className="bg-white border-t border-gray-200 sticky bottom-0 shadow-lg z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Comparing {compareSelection.length} Place{compareSelection.length !== 1 ? 's' : ''}
            </h3>
            <p className="text-sm text-gray-600">
              Select up to 3 places for side-by-side comparison
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={clearComparison}
              className="text-gray-600 border-gray-300"
            >
              Clear All
            </Button>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {compareSelection.map((place) => (
            <div key={place.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 relative">
              {/* Close Button */}
              <button
                onClick={() => removeFromComparison(place.id)}
                className="absolute top-2 right-2 text-gray-500 hover:text-red-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Place Name */}
              <h4 className="font-bold text-gray-900 mb-2 pr-6">{place.name}</h4>

              {/* Rating */}
              <div className="flex items-center mb-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                <span className="font-semibold text-gray-900">{place.rating}</span>
              </div>

              {/* Category */}
              <Badge className="mb-2 bg-blue-100 text-blue-800">
                {place.category}
              </Badge>

              {/* Location */}
              <div className="flex items-start text-sm text-gray-600 mb-2">
                <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                <span>{place.location.address}</span>
              </div>

              {/* Price */}
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <DollarSign className="h-4 w-4 mr-1" />
                <span>{place.priceLevel}</span>
              </div>

              {/* Hours */}
              {place.openHours && (
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{place.openHours}</span>
                </div>
              )}

              {/* Contact Links */}
              <div className="space-y-1 text-xs">
                {place.contact?.phone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-3 w-3 mr-1" />
                    <span>{place.contact.phone}</span>
                  </div>
                )}
                {place.contact?.website && (
                  <div className="flex items-center">
                    <Globe className="h-3 w-3 mr-1" />
                    <a
                      href={place.contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Website
                    </a>
                  </div>
                )}
              </div>

              {/* Highlights */}
              {place.highlights && place.highlights.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Highlights:</p>
                  <div className="flex flex-wrap gap-1">
                    {place.highlights.slice(0, 2).map((highlight, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Comparison Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <p className="font-semibold mb-1">Quick Comparison:</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {compareSelection.map((place) => (
              <div key={place.id}>
                <p className="font-semibold">{place.name}</p>
                <p className="text-blue-700">★ {place.rating}</p>
                <p className="text-blue-700">{place.priceLevel}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlaceComparison
