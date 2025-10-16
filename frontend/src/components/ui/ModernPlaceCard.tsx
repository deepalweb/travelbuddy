import React, { useState } from 'react';
import { Place } from '../../types';

interface ModernPlaceCardProps {
  place: Place;
  onSelect: (place: Place) => void;
  onFavorite: (placeId: string) => void;
  isFavorited?: boolean;
}

export const ModernPlaceCard: React.FC<ModernPlaceCardProps> = ({
  place,
  onSelect,
  onFavorite,
  isFavorited = false
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleImageLoad = () => setImageLoaded(true);

  return (
    <div
      className={`
        group relative overflow-hidden rounded-2xl cursor-pointer
        backdrop-blur-md bg-white/10 border border-white/20
        shadow-lg hover:shadow-2xl
        transform transition-all duration-300 ease-out
        ${isHovered ? 'scale-105 -translate-y-2' : 'scale-100'}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(place)}
    >
      {/* Image Container */}
      <div className="relative h-48 overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
        )}
        <img
          src={place.photos?.[0] || '/images/placeholder.svg'}
          alt={place.name}
          className={`
            w-full h-full object-cover transition-all duration-700
            ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}
            group-hover:scale-110
          `}
          onLoad={handleImageLoad}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavorite(place.id);
          }}
          className={`
            absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm
            transition-all duration-200 hover:scale-110
            ${isFavorited 
              ? 'bg-red-500/80 text-white' 
              : 'bg-white/20 text-white hover:bg-white/30'
            }
          `}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
          </svg>
        </button>

        {/* Deal Badge */}
        {place.deal && (
          <div className="absolute top-3 left-3 px-3 py-1 bg-green-500/90 backdrop-blur-sm rounded-full">
            <span className="text-white text-sm font-medium">{place.deal.discount}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight line-clamp-2">
            {place.name}
          </h3>
          {place.rating && (
            <div className="flex items-center space-x-1 ml-2">
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {place.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {place.formatted_address}
        </p>

        {/* Type Badge */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
            {place.type}
          </span>
          
          {place.opening_hours?.open_now !== undefined && (
            <span className={`text-xs font-medium ${
              place.opening_hours.open_now 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {place.opening_hours.open_now ? 'Open now' : 'Closed'}
            </span>
          )}
        </div>
      </div>

      {/* Hover Overlay */}
      <div className={`
        absolute inset-0 bg-gradient-to-t from-indigo-600/20 to-transparent
        opacity-0 group-hover:opacity-100 transition-opacity duration-300
        pointer-events-none
      `} />
    </div>
  );
};