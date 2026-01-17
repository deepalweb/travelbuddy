import React from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from './Button'

interface ExploreMoreButtonProps {
  loading?: boolean
  placesCount?: number
  onClick?: () => void
}

const ExploreMoreButton: React.FC<ExploreMoreButtonProps> = ({
  loading = false,
  placesCount = 0,
  onClick
}) => {
  return (
    <div className="text-center mt-12 space-y-4">
      <Button 
        onClick={onClick}
        disabled={loading}
        className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Loading More...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Explore More Places
          </>
        )}
      </Button>
      <p className="text-sm text-gray-500 mt-2">
        {placesCount > 0 ? `Showing ${placesCount} places • Click to discover more` : 'Click to discover places'}
      </p>
    </div>
  )
}

export default ExploreMoreButton
