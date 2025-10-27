import React, { useState } from 'react'
import { Button } from './Button'
import { Card, CardContent } from './Card'
import { Badge } from './Badge'
import { 
  X, 
  Star, 
  MapPin, 
  Clock, 
  Phone, 
  Globe, 
  Navigation,
  Camera,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Users
} from 'lucide-react'

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

interface PlaceDetailsModalProps {
  place: Place | null
  isOpen: boolean
  onClose: () => void
}

const PlaceDetailsModal: React.FC<PlaceDetailsModalProps> = ({ place, isOpen, onClose }) => {
  const [showGallery, setShowGallery] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (!isOpen || !place) return null

  const images = [place.image, place.image, place.image] // Mock gallery

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">{place.name}</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {/* Left Column - Images & Info */}
              <div className="space-y-4">
                {/* Hero Image */}
                <div className="relative">
                  <img 
                    src={place.image} 
                    alt={place.name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button 
                    onClick={() => setShowGallery(true)}
                    className="absolute bottom-3 right-3 bg-white text-gray-900 px-3 py-1 rounded-lg text-sm hover:bg-gray-100"
                  >
                    <Camera className="h-4 w-4 inline mr-1" />
                    View Photos
                  </button>
                </div>

                {/* Rating & Category */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                    <span className="font-semibold">{place.rating}</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">{place.category}</Badge>
                  <span className="font-semibold text-green-600">{place.priceLevel}</span>
                </div>

                {/* Location */}
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{place.location.address}</span>
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">{place.description}</p>
                </div>

                {/* Highlights */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Highlights</h3>
                  <div className="flex flex-wrap gap-2">
                    {place.highlights.map((highlight, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Details & Actions */}
              <div className="space-y-4">
                {/* Quick Info Card */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Quick Info</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium">Open</div>
                          <div className="text-xs text-gray-600">{place.openHours}</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-gray-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium">{place.priceLevel}</div>
                          <div className="text-xs text-gray-600">Price level</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-gray-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium">Popular</div>
                          <div className="text-xs text-gray-600">Highly rated</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Card */}
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Contact</h3>
                    <div className="space-y-2">
                      {place.contact.phone && place.contact.phone !== 'Not available' && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 text-gray-600 mr-3" />
                          <a href={`tel:${place.contact.phone}`} className="text-blue-600 hover:underline text-sm">
                            {place.contact.phone}
                          </a>
                        </div>
                      )}
                      {place.contact.website && (
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 text-gray-600 mr-3" />
                          <a 
                            href={place.contact.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Visit Website
                          </a>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    onClick={() => {
                      const { lat, lng } = place.location.coordinates
                      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
                    }}
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Get Directions
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                    <Button variant="outline" size="sm">
                      <Globe className="h-4 w-4 mr-1" />
                      Website
                    </Button>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-1">
                    {place.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-60 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <button
              onClick={() => setShowGallery(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="h-8 w-8" />
            </button>
            
            <button
              onClick={() => setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
              className="absolute left-4 text-white hover:text-gray-300 z-10"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            
            <img 
              src={images[currentImageIndex]} 
              alt={`${place.name} photo ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            
            <button
              onClick={() => setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
              className="absolute right-4 text-white hover:text-gray-300 z-10"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white">
              {currentImageIndex + 1} of {images.length}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default PlaceDetailsModal