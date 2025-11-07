import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card, CardContent } from '../components/Card'
import { Badge } from '../components/Badge'
import { apiService } from '../lib/api'
import { 
  ArrowLeft, 
  Star, 
  MapPin, 
  Clock, 
  Phone, 
  Globe, 
  Share2,
  Heart,
  Calendar,
  Camera,
  Navigation,
  Users,
  DollarSign,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface PlaceDetails {
  id: string
  name: string
  description: {
    short: string
    full: string
    highlights: string[]
  }
  images: {
    hero: string
    gallery: string[]
    count: number
  }
  rating: {
    overall: number
    count: number
  }
  category: string
  priceLevel: string
  pricing: {
    currency: string
    tickets: Array<{
      type: string
      price: number
    }>
  }
  location: {
    address: string
    city: string
    country: string
    coordinates: {
      lat: number
      lng: number
    }
  }
  hours: {
    schedule: Record<string, string>
    isOpen: boolean
    nextClose: string
  }
  contact: {
    phone: string
    email: string
    website: string
  }
  tips: string[]
  tags: string[]
  similarPlaces: Array<{
    id: string
    name: string
    image: string
    rating: number
    category: string
  }>
}

const PlaceDetailsPage: React.FC = () => {
  const { placeId } = useParams<{ placeId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const existingPlace = location.state?.placeData
  const [place, setPlace] = useState<PlaceDetails | null>(null)
  const [loading, setLoading] = useState(!existingPlace)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showGallery, setShowGallery] = useState(false)

  useEffect(() => {
    if (existingPlace) {
      // Convert existing place data to PlaceDetails format
      const convertedPlace: PlaceDetails = {
        id: existingPlace.id,
        name: existingPlace.name,
        description: {
          short: existingPlace.description,
          full: existingPlace.description,
          highlights: existingPlace.highlights || []
        },
        images: {
          hero: existingPlace.image,
          gallery: [existingPlace.image],
          count: 1
        },
        rating: {
          overall: existingPlace.rating,
          count: 100
        },
        category: existingPlace.category,
        priceLevel: existingPlace.priceLevel,
        pricing: {
          currency: 'USD',
          tickets: []
        },
        location: existingPlace.location,
        hours: {
          schedule: {},
          isOpen: true,
          nextClose: existingPlace.openHours || 'Hours vary'
        },
        contact: existingPlace.contact,
        tips: [],
        tags: existingPlace.tags || [],
        similarPlaces: []
      }
      setPlace(convertedPlace)
      setLoading(false)
    } else if (placeId) {
      loadPlaceDetails(placeId)
    }
  }, [placeId, existingPlace])

  const loadPlaceDetails = async (id: string) => {
    setLoading(true)
    try {
      // Use existing place data if available for enhanced AI generation
      const name = existingPlace?.name
      const location = existingPlace?.location?.address || `${existingPlace?.location?.city}, ${existingPlace?.location?.country}`
      const category = existingPlace?.category
      
      const placeDetails = await apiService.getPlaceDetails(id, name, location, category)
      if (placeDetails) {
        setPlace(placeDetails)
      }
    } catch (error) {
      console.error('Failed to load place details:', error)
    } finally {
      setLoading(false)
    }
  }

  const nextImage = () => {
    if (place) {
      setCurrentImageIndex((prev) => (prev + 1) % place.images.gallery.length)
    }
  }

  const prevImage = () => {
    if (place) {
      setCurrentImageIndex((prev) => (prev - 1 + place.images.gallery.length) % place.images.gallery.length)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{existingPlace ? 'Loading enhanced details...' : 'Loading place details...'}</p>
        </div>
      </div>
    )
  }

  if (!place) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Place not found</h2>
          <p className="text-gray-600 mb-4">The place you're looking for doesn't exist.</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative h-96 overflow-hidden bg-gray-200">
        <img 
          src={place.images.hero} 
          alt={place.name}
          className="w-full h-full object-cover transition-all duration-500"
          loading="eager"
          onLoad={(e) => {
            const target = e.target as HTMLImageElement
            target.style.opacity = '1'
            const loader = target.parentElement?.querySelector('.hero-loader')
            if (loader) loader.classList.add('hidden')
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement
            const loader = target.parentElement?.querySelector('.hero-loader')
            if (loader) loader.classList.add('hidden')
            
            if (!target.src.includes('source.unsplash.com')) {
              target.src = `https://source.unsplash.com/1200x800/?${encodeURIComponent(place.name)},${encodeURIComponent(place.location.city)},landmark`
            } else if (!target.src.includes('picsum.photos')) {
              target.src = `https://picsum.photos/seed/${encodeURIComponent(place.id)}/1200/800`
            } else {
              target.style.display = 'none'
              const placeholder = target.parentElement?.querySelector('.hero-placeholder')
              if (placeholder) placeholder.classList.remove('hidden')
            }
          }}
          style={{ opacity: 0 }}
        />
        <div className="hero-loader absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-pulse w-16 h-16 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading image...</p>
          </div>
        </div>
        <div className="hero-placeholder hidden absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-200 to-purple-200">
          <div className="text-center">
            <MapPin className="h-24 w-24 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-600">{place.name}</h2>
            <p className="text-gray-500">{place.location.city}</p>
          </div>
        </div>
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        <div className="absolute bottom-4 right-4">
          <Button 
            onClick={() => setShowGallery(true)}
            className="bg-white text-gray-900 hover:bg-gray-100"
          >
            <Camera className="h-4 w-4 mr-2" />
            View Gallery ({place.images.count})
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Place Info */}
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{place.name}</h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 fill-current mr-1" />
                  <span className="font-semibold">{place.rating.overall}</span>
                  <span className="text-gray-600 ml-1">({place.rating.count.toLocaleString()} reviews)</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800">{place.category}</Badge>
                <span className="text-lg font-semibold text-green-600">{place.priceLevel}</span>
              </div>
              <div className="flex items-center text-gray-600 mb-6">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{place.location.address}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Navigation className="h-4 w-4 mr-2" />
                Get Directions
              </Button>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Plan Visit
              </Button>
              <Button variant="outline">
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
              <Button variant="outline">
                <Globe className="h-4 w-4 mr-2" />
                Website
              </Button>
            </div>

            {/* Photo Gallery Grid */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Photos</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {place.images.gallery.slice(0, 6).map((image, index) => (
                  <div 
                    key={index}
                    className="relative aspect-video rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-all duration-300 bg-gray-200"
                    onClick={() => {
                      setCurrentImageIndex(index)
                      setShowGallery(true)
                    }}
                  >
                    <img 
                      src={image} 
                      alt={`${place.name} photo ${index + 1}`}
                      className="w-full h-full object-cover transition-opacity duration-300"
                      loading="lazy"
                      onLoad={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.opacity = '1'
                        const loader = target.parentElement?.querySelector('.gallery-loader')
                        if (loader) loader.classList.add('hidden')
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        const loader = target.parentElement?.querySelector('.gallery-loader')
                        if (loader) loader.classList.add('hidden')
                        
                        if (!target.src.includes('source.unsplash.com')) {
                          target.src = `https://source.unsplash.com/600x400/?${encodeURIComponent(place.name)},travel,photo${index}`
                        } else {
                          target.src = `https://picsum.photos/seed/${encodeURIComponent(place.id + index)}/600/400`
                        }
                      }}
                      style={{ opacity: 0 }}
                    />
                    <div className="gallery-loader absolute inset-0 flex items-center justify-center bg-gray-100">
                      <div className="animate-pulse w-8 h-8 bg-gray-300 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowGallery(true)}
              >
                View All {place.images.count} Photos
              </Button>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">About</h3>
              <p className="text-gray-700 leading-relaxed">{place.description.full}</p>
            </div>

            {/* Highlights */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Highlights</h3>
              <ul className="space-y-2">
                {place.description.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-600 mr-2">•</span>
                    <span className="text-gray-700">{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tips */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Tips & Recommendations</h3>
              <div className="space-y-3">
                {place.tips.map((tip, index) => (
                  <div key={index} className="flex items-start bg-blue-50 p-3 rounded-lg">
                    <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">Quick Info</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-gray-600 mr-3" />
                    <div>
                      <div className="font-medium">
                        {place.hours.isOpen ? 'Open' : 'Closed'} • Closes {place.hours.nextClose}
                      </div>
                      <div className="text-sm text-gray-600">See all hours</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-gray-600 mr-3" />
                    <div>
                      <div className="font-medium">{place.priceLevel}</div>
                      <div className="text-sm text-gray-600">Price level</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-600 mr-3" />
                    <div>
                      <div className="font-medium">{place.rating.count.toLocaleString()} reviews</div>
                      <div className="text-sm text-gray-600">User reviews</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">Pricing</h3>
                <div className="space-y-3">
                  {place.pricing.tickets.map((ticket, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-700">{ticket.type}</span>
                      <span className="font-semibold">{place.pricing.currency} {ticket.price}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">Contact</h3>
                <div className="space-y-3">
                  {place.contact.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-600 mr-3" />
                      <a href={`tel:${place.contact.phone}`} className="text-blue-600 hover:underline">
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
                        className="text-blue-600 hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Map */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">Location</h3>
                <div className="aspect-video bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-gray-600">Interactive Map</span>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => {
                    const { lat, lng } = place.location.coordinates
                    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
                  }}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Get Directions
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Similar Places */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">You might also like</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {place.similarPlaces.map((similarPlace) => (
              <Card key={similarPlace.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer">
                <div className="relative h-48 bg-gray-200">
                  <img 
                    src={similarPlace.image} 
                    alt={similarPlace.name}
                    className="w-full h-48 object-cover transition-opacity duration-300"
                    loading="lazy"
                    onLoad={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.opacity = '1'
                      const loader = target.parentElement?.querySelector('.similar-loader')
                      if (loader) loader.classList.add('hidden')
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      const loader = target.parentElement?.querySelector('.similar-loader')
                      if (loader) loader.classList.add('hidden')
                      target.src = `https://source.unsplash.com/400x300/?${encodeURIComponent(similarPlace.name)},${encodeURIComponent(similarPlace.category)}`
                    }}
                    style={{ opacity: 0 }}
                  />
                  <div className="similar-loader absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="animate-pulse w-6 h-6 bg-gray-300 rounded-full"></div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{similarPlace.name}</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                      <span className="text-sm">{similarPlace.rating}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{similarPlace.category}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <button
              onClick={() => setShowGallery(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              ✕
            </button>
            
            <button
              onClick={prevImage}
              className="absolute left-4 text-white hover:text-gray-300 z-10"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            
            <div className="relative max-w-full max-h-full flex items-center justify-center">
              <img 
                src={place.images.gallery[currentImageIndex]} 
                alt={`${place.name} photo ${currentImageIndex + 1}`}
                className="max-w-full max-h-full object-contain transition-opacity duration-300"
                onLoad={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.opacity = '1'
                  const loader = target.parentElement?.querySelector('.modal-loader')
                  if (loader) loader.classList.add('hidden')
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  const loader = target.parentElement?.querySelector('.modal-loader')
                  if (loader) loader.classList.add('hidden')
                  
                  if (!target.src.includes('source.unsplash.com')) {
                    target.src = `https://source.unsplash.com/1200x800/?${encodeURIComponent(place.name)},travel,photo${currentImageIndex}`
                  } else {
                    target.src = `https://picsum.photos/seed/${encodeURIComponent(place.id + currentImageIndex)}/1200/800`
                  }
                }}
                style={{ opacity: 0 }}
              />
              <div className="modal-loader absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-white">Loading image...</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={nextImage}
              className="absolute right-4 text-white hover:text-gray-300 z-10"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white">
              {currentImageIndex + 1} of {place.images.gallery.length}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlaceDetailsPage