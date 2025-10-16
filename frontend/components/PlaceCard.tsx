import React, { useState, useEffect } from 'react';
import { Place } from '../types.ts';
import LockIcon from './LockIcon.tsx';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { Heart, Star, MapPin, Clock, Share, Navigation } from './Icons.tsx';
import { placeEnhancementService, PlaceEnhancement } from '../services/placeEnhancementService';

interface PlaceCardProps {
  place: Place;
  onSelectPlaceDetail: (place: Place) => void;
  style?: React.CSSProperties;
  isSelectedForItinerary: boolean;
  onToggleSelectForItinerary: (placeId: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (placeId: string) => void;
  hasAccessToBasic: boolean;
  className?: string; 
}

const PlaceCard: React.FC<PlaceCardProps> = ({ 
  place, 
  onSelectPlaceDetail, 
  style,
  isSelectedForItinerary,
  onToggleSelectForItinerary,
  isFavorite,
  onToggleFavorite,
  hasAccessToBasic,
  className = ''
}) => {
  const { t } = useLanguage();
  const [enhancement, setEnhancement] = useState<PlaceEnhancement | null>(null);
  const [isLoadingEnhancement, setIsLoadingEnhancement] = useState(false);

  useEffect(() => {
    const loadEnhancement = async () => {
      setIsLoadingEnhancement(true);
      try {
        const enhanced = await placeEnhancementService.enhancePlace(place);
        setEnhancement(enhanced);
      } catch (error) {
        console.error('Failed to enhance place:', error);
      } finally {
        setIsLoadingEnhancement(false);
      }
    };
    loadEnhancement();
  }, [place.id]);
  
  const cardBorderStyle: React.CSSProperties = {
     border: `1px solid ${isSelectedForItinerary && hasAccessToBasic ? 'var(--color-primary)' : 'var(--color-glass-border)'}`,
     boxShadow: isSelectedForItinerary && hasAccessToBasic ? `0 0 12px var(--color-primary-light), var(--shadow-md)`: 'var(--shadow-md)',
  }

  // Use proxied Google Place Photo if available, otherwise placeholder
  let imageUrl = place.image || place.photoUrl || '/images/placeholder.svg';
  if (!place.image && place.photos && place.photos.length > 0 && (place.photos[0] as any).photo_reference) {
    const ref = (place.photos[0] as any).photo_reference;
    imageUrl = `/api/places/photo?ref=${encodeURIComponent(ref)}&w=400`;
  }

  return (
    <div 
      className={`card-base rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group flex flex-col ${className}`}
      style={{...cardBorderStyle, ...style}}
      aria-labelledby={`place-name-${place.id}`}
    >
      {/* Hero Image */}
      <div className="relative h-32 overflow-hidden">
        <img
          src={imageUrl}
          alt={place.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }}
        />
        
        {/* Favorite Button */}
        <button
          onClick={() => onToggleFavorite(place.id)}
          className="absolute top-3 right-3 rounded-full p-2 backdrop-blur-sm transition-colors"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
          aria-pressed={isFavorite}
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} />
        </button>

        {/* Badges */}
        {enhancement?.badges && enhancement.badges.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {enhancement.badges.slice(0, 2).map(badge => (
              <span 
                key={badge} 
                className={`px-2 py-1 text-xs font-medium rounded-full ${placeEnhancementService.getBadgeColor(badge)}`}
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        {/* Open Status */}
        {place.opening_hours && (
          <div className="absolute bottom-3 left-3">
            <span className={`px-2 py-1 text-xs font-medium rounded-full backdrop-blur-sm ${
              place.opening_hours.open_now 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {place.opening_hours.open_now ? '🟢 Open' : '🔴 Closed'}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col h-full">
        {/* Header */}
        <div className="mb-2">
          <h2 id={`place-name-${place.id}`} className="font-bold text-lg mb-1" style={{ color: 'var(--color-text-primary)' }}>
            {place.name}
          </h2>
          
          {/* Highlights Row */}
          <div className="flex items-center gap-3 text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{place.rating?.toFixed(1) || 'N/A'}</span>
              {place.user_ratings_total && (
                <span className="text-xs">({place.user_ratings_total})</span>
              )}
            </div>
            
            {enhancement?.budgetLevel && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                enhancement.budgetLevel === 'Budget' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                enhancement.budgetLevel === 'Expensive' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              }`}>
                {enhancement.budgetLevel}
              </span>
            )}
            
            {place.types && (
              <span className="text-xs">{place.types[0]?.replace(/_/g, ' ')}</span>
            )}
          </div>
        </div>

        {/* AI Summary */}
        {enhancement?.aiSummary && (
          <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
            {enhancement.aiSummary}
          </p>
        )}

        {/* Location */}
        <div className="flex items-center gap-1 text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          <MapPin className="w-3 h-3" />
          <span>{place.vicinity || place.formatted_address}</span>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-auto">
          <button 
            onClick={() => onSelectPlaceDetail(place)}
            className="flex-1 py-1.5 px-2 rounded-lg text-white font-medium text-xs transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            View Details
          </button>
          
          <button
            onClick={() => onToggleSelectForItinerary(place.id)}
            disabled={!hasAccessToBasic}
            className={`flex-1 py-1.5 px-2 rounded-lg font-medium text-xs transition-colors border relative ${
              isSelectedForItinerary 
                ? 'bg-green-50 border-green-500 text-green-700 dark:bg-green-900 dark:text-green-200' 
                : ''
            }`}
            style={{ 
              color: isSelectedForItinerary ? undefined : 'var(--color-text-primary)',
              borderColor: isSelectedForItinerary ? undefined : 'var(--color-border)'
            }}
          >
            {!hasAccessToBasic && <LockIcon className="w-3 h-3 mr-1 inline" />}
            {isSelectedForItinerary ? '✓ Added' : 'Add to Trip'}
          </button>
          
          <button 
            className="p-1.5 rounded-lg border transition-colors"
            style={{ 
              borderColor: 'var(--color-border)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-hover-bg)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Share className="w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaceCard;