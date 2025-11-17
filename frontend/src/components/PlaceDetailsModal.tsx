import React, { useState, useEffect } from 'react'
import { X, Star, MapPin, Clock, Phone, Globe, Camera } from 'lucide-react'
import { apiService } from '../lib/api'

interface PlaceDetailsModalProps {
  place: any
  isOpen: boolean
  onClose: () => void
}

const PlaceDetailsModal: React.FC<PlaceDetailsModalProps> = ({ place, isOpen, onClose }) => {
  const [details, setDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && place) {
      loadDetails()
    }
  }, [isOpen, place])

  const loadDetails = async () => {
    setLoading(true)
    try {
      const enhanced = await apiService.getPlaceDetails(
        place.id || place.place_id,
        place.name,
        place.location?.address || `${place.location?.city}, ${place.location?.country}`,
        place.category
      )
      setDetails(enhanced)
    } catch (error) {
      console.error('Failed to load details:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const displayPlace = details || place

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">{displayPlace.name}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Hero Image */}
          <div className="relative h-64 bg-gray-200">
            <img 
              src={displayPlace.images?.hero || displayPlace.image || `https://images.unsplash.com/800x400/?${encodeURIComponent(displayPlace.name)}`}
              alt={displayPlace.name}
              className="w-full h-full object-cover"
            />
            {displayPlace.images?.count > 1 && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm">
                <Camera className="h-4 w-4 inline mr-1" />
                {displayPlace.images.count} photos
              </div>
            )}
          </div>

          <div className="p-6">
            {/* Basic Info */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center">
                <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                <span className="font-semibold">{displayPlace.rating?.overall || displayPlace.rating || 4.2}</span>
                <span className="text-gray-600 ml-1">({displayPlace.rating?.count?.toLocaleString() || '100'} reviews)</span>
              </div>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">{displayPlace.category}</span>
              <span className="text-green-600 font-semibold">{displayPlace.priceLevel || '$'}</span>
            </div>

            <div className="flex items-center text-gray-600 mb-6">
              <MapPin className="h-4 w-4 mr-2" />
              <span>{displayPlace.location?.address || displayPlace.description}</span>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-gray-600">Loading enhanced details...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Description */}
                  {displayPlace.description?.full && (
                    <div>
                      <h3 className="text-lg font-bold mb-2">About</h3>
                      <p className="text-gray-700">{displayPlace.description.full}</p>
                    </div>
                  )}

                  {/* Highlights */}
                  {displayPlace.description?.highlights?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold mb-2">Highlights</h3>
                      <ul className="space-y-1">
                        {displayPlace.description.highlights.map((highlight: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="text-green-600 mr-2">•</span>
                            <span className="text-gray-700">{highlight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Tips */}
                  {displayPlace.tips?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold mb-2">Tips</h3>
                      <div className="space-y-2">
                        {displayPlace.tips.map((tip: string, index: number) => (
                          <div key={index} className="bg-blue-50 p-3 rounded-lg text-gray-700 text-sm">
                            {tip}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  {/* Hours */}
                  {displayPlace.hours && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Hours
                      </h4>
                      <p className="text-sm text-gray-600">
                        {displayPlace.hours.isOpen ? 'Open' : 'Closed'} • {displayPlace.hours.nextClose}
                      </p>
                    </div>
                  )}

                  {/* Contact */}
                  {displayPlace.contact && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Contact</h4>
                      {displayPlace.contact.phone && (
                        <div className="flex items-center mb-2">
                          <Phone className="h-4 w-4 mr-2 text-gray-600" />
                          <span className="text-sm">{displayPlace.contact.phone}</span>
                        </div>
                      )}
                      {displayPlace.contact.website && (
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-gray-600" />
                          <a href={displayPlace.contact.website} target="_blank" rel="noopener noreferrer" 
                             className="text-sm text-blue-600 hover:underline">
                            Visit Website
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pricing */}
                  {displayPlace.pricing?.tickets?.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">Pricing</h4>
                      <div className="space-y-1">
                        {displayPlace.pricing.tickets.map((ticket: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{ticket.type}</span>
                            <span className="font-medium">{displayPlace.pricing.currency} {ticket.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlaceDetailsModal
