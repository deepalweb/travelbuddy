import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card, CardContent } from '../components/Card'
import { Badge } from '../components/Badge'
import { apiService } from '../lib/api'
import { aiService, type PlaceAIContent } from '../services/aiService'
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
  Sparkles,
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
  const [aiContent, setAiContent] = useState<PlaceAIContent | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    if (existingPlace) {
      // Convert existing place data to PlaceDetails format
      const galleryImages = [
        existingPlace.image,
        `https://source.unsplash.com/1200x800/?${encodeURIComponent(existingPlace.name)},interior`,
        `https://source.unsplash.com/1200x800/?${encodeURIComponent(existingPlace.name)},exterior`,
        `https://source.unsplash.com/1200x800/?${encodeURIComponent(existingPlace.category)},${encodeURIComponent(existingPlace.location.city)}`,
        `https://source.unsplash.com/1200x800/?${encodeURIComponent(existingPlace.name)},architecture`,
        `https://source.unsplash.com/1200x800/?${encodeURIComponent(existingPlace.category)},travel`
      ]
      
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
          gallery: galleryImages,
          count: galleryImages.length
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

  useEffect(() => {
    if (place) {
      loadAIContent(place)
    }
  }, [place?.id])

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

  const loadAIContent = async (placeData: PlaceDetails) => {
    setAiLoading(true)

    try {
      const content = await aiService.generatePlaceContent({
        placeId: placeData.id,
        placeName: placeData.name,
        placeType: placeData.category,
        address: placeData.location.address,
        city: placeData.location.city,
        country: placeData.location.country,
        description: placeData.description.full,
        rating: placeData.rating.overall,
        tags: placeData.tags
      })

      setAiContent(content)
    } catch (error) {
      console.error('Failed to load AI destination brief:', error)
      setAiContent(null)
    } finally {
      setAiLoading(false)
    }
  }

  const handlePlanVisit = () => {
    if (!place) return

    const placeForPlanner = existingPlace || {
      id: place.id,
      name: place.name,
      description: aiContent?.description || place.description.short || place.description.full,
      image: place.images.hero,
      rating: place.rating.overall,
      category: place.category,
      priceLevel: place.priceLevel,
      location: {
        address: place.location.address,
        city: place.location.city,
        country: place.location.country,
        coordinates: place.location.coordinates
      },
      contact: place.contact,
      tags: place.tags,
      highlights: place.description.highlights
    }

    sessionStorage.setItem('selectedPlaces', JSON.stringify([placeForPlanner]))
    navigate('/trips')
  }

  const handleShare = async () => {
    if (!place) return

    const shareData = {
      title: place.name,
      text: `Check out ${place.name} in ${place.location.city}`,
      url: window.location.href
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copied to clipboard')
      }
    } catch (error) {
      console.error('Share failed:', error)
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

  const planningTips = [
    ...place.tips,
    ...(aiContent?.planningTips || [])
  ].filter((tip, index, arr) => tip && arr.indexOf(tip) === index)

  const primaryDescription = aiContent?.description || place.description.full
  const aiInsightCards = [
    { label: 'Vibe', value: aiContent?.vibe },
    { label: 'Best Time', value: aiContent?.bestTimeToVisit },
    { label: 'Ideal Visit', value: aiContent?.idealVisitDuration },
    { label: 'Nearby Pairing', value: aiContent?.nearbyPairing }
  ].filter((item) => item.value)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe_0%,#f8fafc_30%,#f8fafc_100%)]">
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
              <Button variant="outline" size="sm" onClick={handleShare}>
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
          src={place.images.hero || `https://source.unsplash.com/1200x800/?${encodeURIComponent(place.name)},${encodeURIComponent(place.location.city)}`} 
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
              target.src = `https://source.unsplash.com/1200x800/?${encodeURIComponent(place.name)},travel,landmark`
            } else if (!target.src.includes('picsum.photos')) {
              target.src = `https://picsum.photos/seed/${Math.abs(place.name.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0))}/1200/800`
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
              <Button
                className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600"
                onClick={() => {
                  const { lat, lng } = place.location.coordinates
                  window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
                }}
              >
                <Navigation className="h-4 w-4 mr-2" />
                Get Directions
              </Button>
              <Button variant="outline" onClick={handlePlanVisit}>
                <Calendar className="h-4 w-4 mr-2" />
                Plan Visit
              </Button>
              <Button
                variant="outline"
                onClick={() => place.contact.phone && window.open(`tel:${place.contact.phone}`, '_self')}
                disabled={!place.contact.phone}
              >
                <Phone className="h-4 w-4 mr-2" />
                Call
              </Button>
              <Button
                variant="outline"
                onClick={() => place.contact.website && window.open(place.contact.website, '_blank', 'noopener,noreferrer')}
                disabled={!place.contact.website}
              >
                <Globe className="h-4 w-4 mr-2" />
                Website
              </Button>
            </div>

            <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_45%,#0ea5e9_100%)] text-white shadow-2xl">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                      <Sparkles className="mr-2 h-3.5 w-3.5" />
                      AI Destination Brief
                    </div>
                    <h3 className="mt-4 text-2xl font-semibold">A stronger read on this stop</h3>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-white/80">
                      {aiLoading ? 'Building a local-style brief with Azure Foundry...' : primaryDescription}
                    </p>
                  </div>
                  <Badge className="border border-white/20 bg-white/10 text-white">Azure Foundry</Badge>
                </div>

                {aiInsightCards.length > 0 && (
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {aiInsightCards.map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/60">{item.label}</p>
                        <p className="mt-2 text-sm font-medium leading-6 text-white">{item.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {(aiLoading || aiContent?.localTip || aiContent?.culturalInsight || aiContent?.handyPhrase || aiContent?.etiquette || aiContent?.photoTip) && (
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {aiLoading && (
                      <>
                        <div className="h-28 animate-pulse rounded-2xl bg-white/10" />
                        <div className="h-28 animate-pulse rounded-2xl bg-white/10" />
                      </>
                    )}
                    {!aiLoading && aiContent?.localTip && (
                      <div className="rounded-2xl bg-white p-4 text-slate-900">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Local Tip</p>
                        <p className="mt-2 text-sm leading-6">{aiContent.localTip}</p>
                      </div>
                    )}
                    {!aiLoading && aiContent?.culturalInsight && (
                      <div className="rounded-2xl bg-white p-4 text-slate-900">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Cultural Insight</p>
                        <p className="mt-2 text-sm leading-6">{aiContent.culturalInsight}</p>
                      </div>
                    )}
                    {!aiLoading && aiContent?.handyPhrase && (
                      <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Useful Phrase</p>
                        <p className="mt-2 text-sm font-medium italic text-white">"{aiContent.handyPhrase}"</p>
                      </div>
                    )}
                    {!aiLoading && aiContent?.photoTip && (
                      <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Photo Tip</p>
                        <p className="mt-2 text-sm leading-6 text-white">{aiContent.photoTip}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

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
              <p className="text-gray-700 leading-relaxed">{primaryDescription}</p>
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
                {planningTips.map((tip, index) => (
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
                  {aiContent?.etiquette && (
                    <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                      <span className="font-semibold">Etiquette:</span> {aiContent.etiquette}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4">Pricing</h3>
                {place.pricing.tickets.length > 0 ? (
                  <div className="space-y-3">
                    {place.pricing.tickets.map((ticket, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-700">{ticket.type}</span>
                        <span className="font-semibold">{place.pricing.currency} {ticket.price}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">Pricing often varies by season, package, or walk-in availability.</p>
                )}
              </CardContent>
            </Card>

            {(aiLoading || aiContent) && (
              <Card className="border-sky-100 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-sky-600" />
                    <h3 className="font-bold text-lg">Visit Strategy</h3>
                  </div>
                  {aiLoading ? (
                    <div className="mt-4 space-y-3">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                      <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                      <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
                    </div>
                  ) : (
                    <div className="mt-4 space-y-4 text-sm text-gray-700">
                      {aiContent?.bestTimeToVisit && (
                        <div>
                          <p className="font-semibold text-gray-900">Best Time To Visit</p>
                          <p>{aiContent.bestTimeToVisit}</p>
                        </div>
                      )}
                      {aiContent?.idealVisitDuration && (
                        <div>
                          <p className="font-semibold text-gray-900">Ideal Visit Duration</p>
                          <p>{aiContent.idealVisitDuration}</p>
                        </div>
                      )}
                      {aiContent?.nearbyPairing && (
                        <div>
                          <p className="font-semibold text-gray-900">Pair It With</p>
                          <p>{aiContent.nearbyPairing}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

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
                <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden relative border border-gray-200">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0, display: 'block' }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${place.location.coordinates.lat},${place.location.coordinates.lng}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    title="Google Maps Location"
                    onLoad={(e) => {
                      console.log('Map iframe loaded successfully')
                      const loader = (e.target as HTMLIFrameElement).parentElement?.querySelector('.map-loader')
                      if (loader) loader.classList.add('hidden')
                    }}
                  />
                  <div className="map-loader absolute inset-0 flex items-center justify-center pointer-events-none bg-gray-50">
                    <div className="text-center text-gray-400">
                      <MapPin className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Loading map...</p>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-3">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  {place.location.address}
                </div>
                <Button 
                  className="w-full"
                  onClick={() => {
                    const { lat, lng } = place.location.coordinates
                    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank')
                  }}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Open in Google Maps
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
