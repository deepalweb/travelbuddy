import React from 'react'
import { TrendingUp, Navigation, MapPin, Plane } from 'lucide-react'
import { Button } from './Button'

interface ResultsHeaderProps {
  searchContext: string
  placesCount: number
  filteredCount: number
  selectedCount: number
  filterCount: number
  showMap: boolean
  loading: boolean
  onToggleFilters: () => void
  onToggleMap: () => void
  onGenerateTrip: () => void
}

const ResultsHeader: React.FC<ResultsHeaderProps> = ({
  searchContext,
  placesCount,
  filteredCount,
  selectedCount,
  filterCount,
  showMap,
  loading,
  onToggleFilters,
  onToggleMap,
  onGenerateTrip
}) => {
  const displayCount = filteredCount < placesCount ? filteredCount : placesCount

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div className="flex items-center">
          <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold text-gray-900">Discovery Results</h2>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center space-x-3 flex-wrap gap-2">
          <Button
            onClick={onToggleFilters}
            variant="outline"
            size="sm"
            className="flex items-center"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Filters
            {filterCount > 0 && (
              <span className="ml-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {filterCount}
              </span>
            )}
          </Button>
          
          <Button
            onClick={onToggleMap}
            variant="outline"
            size="sm"
            className="flex items-center"
          >
            <MapPin className="h-4 w-4 mr-2" />
            {showMap ? 'Hide Map' : 'Show Map'}
          </Button>
          
          {selectedCount > 0 && (
            <Button
              onClick={onGenerateTrip}
              className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white flex items-center"
            >
              <Plane className="h-4 w-4 mr-2" />
              Generate Trip ({selectedCount})
            </Button>
          )}
        </div>
      </div>

      {/* Search Context & Stats */}
      <div>
        <p className="text-gray-600 font-medium">{searchContext}</p>
        <p className="text-sm text-gray-500 mt-1">
          Found <span className="font-semibold text-gray-700">{placesCount}</span> places
          {filteredCount < placesCount && ` • Showing ${displayCount} after filters`}
          {selectedCount > 0 && ` • ${selectedCount} selected for trip`}
        </p>
      </div>
    </div>
  )
}

export default ResultsHeader
