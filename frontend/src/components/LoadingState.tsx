import React from 'react'
import { PlaceCardSkeleton } from './SkeletonLoader'

interface LoadingStateProps {
  stage: string
  progress: number
  skeletonCount?: number
}

const LoadingState: React.FC<LoadingStateProps> = ({
  stage,
  progress,
  skeletonCount = 8
}) => {
  return (
    <>
      {/* Loading Header */}
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="inline-flex items-center mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-lg text-gray-700 font-medium">{stage}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500">{Math.round(progress)}% complete</p>
        </div>
      </div>

      {/* Skeleton Loaders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <PlaceCardSkeleton key={i} />
        ))}
      </div>
    </>
  )
}

export default LoadingState
