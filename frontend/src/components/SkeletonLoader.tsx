import React from 'react'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  variant = 'rectangular',
  width,
  height 
}) => {
  const baseClasses = 'animate-pulse bg-gray-200'
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  }
  
  const style = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1rem' : '100%')
  }
  
  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  )
}

export const PlaceCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
    <Skeleton className="w-full h-48" />
    <div className="p-4 space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-20" />
      </div>
      <Skeleton className="h-10 w-full" />
    </div>
  </div>
)

export const DestinationCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
    <Skeleton className="w-full h-72" />
    <div className="absolute bottom-0 left-0 right-0 p-6">
      <Skeleton className="h-8 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
)
