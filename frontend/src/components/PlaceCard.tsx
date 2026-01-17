import React from 'react'
import { MapPin, Star, Clock, Phone, Globe, Check, Plus, Sparkles } from 'lucide-react'
import { Card, CardContent } from './Card'
import { Badge } from './Badge'
import { Button } from './Button'

interface PlaceCardProps {
  place: {
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
  isSelected?: boolean
  onSelect?: (place: any) => void
  onSave?: (place: any) => void
  onDetails?: (place: any) => void
  getCategoryColor?: (category: string) => string
  getPriceLevelColor?: (priceLevel: string) => string
  onNavigate?: (path: string, state?: any) => void
}

const PlaceCard: React.FC<PlaceCardProps> = ({
  place,
  isSelected = false,
  onSelect,
  onSave,
  onDetails,
  getCategoryColor = (category: string) => 'bg-gray-100 text-gray-800',
  getPriceLevelColor = (priceLevel: string) => 'text-gray-600',
  onNavigate
}) => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement
    const loader = target.parentElement?.querySelector('.image-loader')
    if (loader) loader.classList.add('hidden')
    
    if (!target.src.includes('source.unsplash.com')) {
      target.src = `https://source.unsplash.com/800x600/?${encodeURIComponent(place.category)},${encodeURIComponent(place.location.country)},travel`
    } else if (!target.src.includes('picsum.photos')) {
      target.src = `https://picsum.photos/seed/${Math.abs(place.name.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0))}/800/600`
    } else {
      target.style.display = 'none'
      const placeholder = target.parentElement?.querySelector('.image-placeholder')
      if (placeholder) placeholder.classList.remove('hidden')
    }
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement
    target.style.opacity = '1'
    const loader = target.parentElement?.querySelector('.image-loader')
    if (loader) loader.classList.add('hidden')
  }

  const handleDetailsClick = () => {
    if (onNavigate) {
      onNavigate(`/places/${place.id}`, { state: { placeData: place } })
    } else if (onDetails) {
      onDetails(place)
    }
  }

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 group">
      <div className="relative">
        {/* Image Container */}
        <div className="relative w-full h-48 bg-gray-200 overflow-hidden">
          <img 
            src={place.image || `https://source.unsplash.com/800x600/?${encodeURIComponent(place.name)},${encodeURIComponent(place.category)},${encodeURIComponent(place.location.city)}`} 
            alt={place.name}
            className="w-full h-48 object-cover transition-all duration-300 hover:scale-105"
            loading="lazy"
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{ opacity: 0 }}
          />
          {/* Loading Skeleton */}
          <div className="image-loader absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-pulse flex items-center justify-center">
              <div className="w-8 h-8 bg-gray-300 rounded-full animate-bounce"></div>
            </div>
          </div>
          {/* Placeholder */}
          <div className="image-placeholder hidden absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">{place.category}</p>
              <p className="text-xs text-gray-400">{place.name}</p>
            </div>
          </div>
        </div>

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <Badge className={getCategoryColor(place.category)}>
            {place.category}
          </Badge>
        </div>

        {/* Rating Badge */}
        <div className="absolute top-3 right-3">
          <Badge className="bg-white text-gray-800">
            <Star className="h-3 w-3 mr-1 fill-current text-yellow-500" />
            {place.rating}
          </Badge>
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute bottom-3 right-3 bg-blue-600 text-white rounded-full p-2">
            <Check className="h-5 w-5" />
          </div>
        )}
      </div>
      
      {/* Content */}
      <CardContent className="p-4">
        {/* Title & Location */}
        <div className="mb-3">
          <h3 className="font-bold text-lg text-gray-900 mb-1 truncate">{place.name}</h3>
          <div className="flex items-center text-sm text-gray-600 mb-2 justify-between">
            <div className="flex items-center flex-1">
              <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="truncate">{place.location.city}, {place.location.country}</span>
            </div>
            <span className={`ml-2 font-semibold flex-shrink-0 ${getPriceLevelColor(place.priceLevel)}`}>
              {place.priceLevel}
            </span>
          </div>
        </div>

        {/* Description */}
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
            {place.highlights.length > 3 && (
              <Badge variant="outline" className="text-xs text-gray-500">
                +{place.highlights.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 text-xs text-gray-500 border-t border-gray-100 pt-3 mb-3">
          {place.openHours && (
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{place.openHours}</span>
            </div>
          )}
          {place.contact?.phone && place.contact.phone !== 'Not available' && (
            <div className="flex items-center">
              <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{place.contact.phone}</span>
            </div>
          )}
          {place.contact?.website && (
            <div className="flex items-center">
              <Globe className="h-3 w-3 mr-1 flex-shrink-0" />
              <a 
                href={place.contact.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline truncate"
              >
                Visit Website
              </a>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant={isSelected ? "default" : "outline"}
              className={`flex-1 ${isSelected 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
              }`}
              onClick={() => onSelect?.(place)}
            >
              {isSelected ? (
                <><Check className="h-3 w-3 mr-1" />Selected</>
              ) : (
                <><Plus className="h-3 w-3 mr-1" />Select</>
              )}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
              onClick={() => onSave?.(place)}
            >
              Save
            </Button>
          </div>
          <Button 
            size="sm" 
            className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white border-none"
            onClick={handleDetailsClick}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            More Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default PlaceCard
