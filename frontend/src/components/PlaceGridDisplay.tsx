import React from 'react'
import PlaceCard from './PlaceCard'

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

interface PlaceGridDisplayProps {
  places: Place[]
  selectedPlaceIds?: string[]
  onSelectPlace?: (place: Place) => void
  onSavePlace?: (place: Place) => void
  onViewDetails?: (path: string, state?: any) => void
  getCategoryColor?: (category: string) => string
  getPriceLevelColor?: (priceLevel: string) => string
  emptyMessage?: string
}

const PlaceGridDisplay: React.FC<PlaceGridDisplayProps> = ({
  places,
  selectedPlaceIds = [],
  onSelectPlace,
  onSavePlace,
  onViewDetails,
  getCategoryColor = (cat) => 'bg-gray-100 text-gray-800',
  getPriceLevelColor = (price) => 'text-gray-600',
  emptyMessage = 'No places found'
}) => {
  if (places.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {places.map((place) => (
        <PlaceCard
          key={place.id}
          place={place}
          isSelected={selectedPlaceIds.includes(place.id)}
          onSelect={onSelectPlace}
          onSave={onSavePlace}
          onNavigate={onViewDetails}
          getCategoryColor={getCategoryColor}
          getPriceLevelColor={getPriceLevelColor}
        />
      ))}
    </div>
  )
}

export default PlaceGridDisplay
