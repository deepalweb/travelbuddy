import React from 'react'
import { Plane, X } from 'lucide-react'
import { Button } from './Button'
import { Badge } from './Badge'

interface SelectedPlacesSummaryProps {
  selectedPlaces: Array<{
    id: string
    name: string
  }>
  onGenerateTrip: () => void
  onRemovePlace?: (placeId: string) => void
}

const SelectedPlacesSummary: React.FC<SelectedPlacesSummaryProps> = ({
  selectedPlaces,
  onGenerateTrip,
  onRemovePlace
}) => {
  if (selectedPlaces.length === 0) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-blue-900 flex items-center">
            <Plane className="h-4 w-4 mr-2" />
            Selected Places for Trip
          </h3>
          <p className="text-sm text-blue-700">
            {selectedPlaces.length} place{selectedPlaces.length !== 1 ? 's' : ''} selected
          </p>
        </div>
        <Button
          onClick={onGenerateTrip}
          className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white"
        >
          <Plane className="h-4 w-4 mr-2" />
          Generate Trip
        </Button>
      </div>

      {/* Selected Places List */}
      <div className="flex flex-wrap gap-2">
        {selectedPlaces.map((place) => (
          <Badge 
            key={place.id} 
            className="bg-blue-100 text-blue-800 flex items-center gap-1 pr-1"
          >
            {place.name}
            {onRemovePlace && (
              <button
                onClick={() => onRemovePlace(place.id)}
                className="ml-1 hover:text-blue-600 transition-colors"
                aria-label={`Remove ${place.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>
    </div>
  )
}

export default SelectedPlacesSummary
