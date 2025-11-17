import React from 'react'
import { cn } from '../lib/utils'

interface AvatarProps {
  src?: string
  alt?: string
  size?: 'sm' | 'md' | 'lg'
  online?: boolean
  className?: string
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  size = 'md',
  online = false,
  className
}) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }
  
  return (
    <div className={cn('relative', className)}>
      <img
        src={src}
        alt={alt}
        className={cn(
          'rounded-full object-cover border-2 border-white shadow-sm',
          sizes[size]
        )}
      />
      {online && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
      )}
    </div>
  )
}
