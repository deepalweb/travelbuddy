import React, { useState, useEffect, useCallback } from 'react';
import { Place, ExchangeRates } from '../types.ts';
import { Colors } from '../constants.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { useToast } from '../contexts/ToastContext.tsx';
import { Heart, Star, Clock, MapPin, DollarSign, Users, Wifi, Accessibility } from './Icons.tsx';

interface PlaceComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  places: Place[];
  onSelectPlace: (place: Place) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  exchangeRates?: ExchangeRates | null;
  homeCurrency?: string;
}

export const PlaceComparisonModal: React.FC<PlaceComparisonModalProps> = ({
  isOpen,
  onClose,
  places,
  onSelectPlace,
  userLocation,
  exchangeRates,
  homeCurrency = 'USD'
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useLanguage();
  const { addToast } = useToast();

  const handleCloseWithAnimation = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleCloseWithAnimation();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, handleCloseWithAnimation]);

  const calculateDistance = (place: Place) => {
    if (!userLocation || !place.geometry?.location) return null;
    const R = 6371; // Earth's radius in km
    const dLat = (place.geometry.location.lat - userLocation.latitude) * Math.PI / 180;
    const dLon = (place.geometry.location.lng - userLocation.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLocation.latitude * Math.PI / 180) * Math.cos(place.geometry.location.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getFeatureScore = (place: Place) => {
    let score = 0;
    if (place.rating && place.rating >= 4.5) score += 2;
    else if (place.rating && place.rating >= 4.0) score += 1;
    if (place.user_ratings_total && place.user_ratings_total > 100) score += 1;
    if (place.opening_hours?.open_now) score += 1;
    if (place.examplePrice && place.examplePrice.amount <= 20) score += 1;
    return score;
  };

  const getBestChoice = () => {
    if (places.length === 0) return null;
    return places.reduce((best, current) => {
      const bestScore = getFeatureScore(best);
      const currentScore = getFeatureScore(current);
      return currentScore > bestScore ? current : best;
    });
  };

  if (!isOpen && !isVisible) return null;

  const bestChoice = getBestChoice();

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-out
                  ${isVisible && isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={handleCloseWithAnimation}
      role="dialog"
      aria-modal="true"
      aria-labelledby="comparison-modal-title"
    >
      <div
        className={`w-full max-w-6xl max-h-[90vh] flex flex-col relative rounded-xl shadow-xl overflow-hidden
                    transform transition-all duration-300 ease-out
                    ${isVisible && isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        style={{ backgroundColor: Colors.cardBackground, border: `1px solid ${Colors.cardBorder}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: Colors.cardBorder }}>
          <h2 id="comparison-modal-title" className="text-2xl font-bold" style={{ color: Colors.text }}>
            {t('placeComparison.title')} ({places.length})
          </h2>
          <button
            onClick={handleCloseWithAnimation}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label={t('close')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {places.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg" style={{ color: Colors.text_secondary }}>
                {t('placeComparison.noPlaces')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {places.map((place) => {
                const distance = calculateDistance(place);
                const isTopChoice = place.id === bestChoice?.id;
                
                return (
                  <div
                    key={place.id}
                    className={`relative rounded-xl p-6 border-2 transition-all duration-300 hover:shadow-lg ${
                      isTopChoice ? 'border-green-500 bg-green-50' : ''
                    }`}
                    style={{ 
                      backgroundColor: isTopChoice ? 'rgba(34, 197, 94, 0.05)' : Colors.inputBackground,
                      borderColor: isTopChoice ? '#22c55e' : Colors.cardBorder 
                    }}
                  >
                    {isTopChoice && (
                      <div className="absolute -top-3 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {t('placeComparison.recommended')}
                      </div>
                    )}

                    {/* Place Image */}
                    <div className="relative mb-4">
                      <img
                        src={place.image || place.photoUrl || '/images/placeholder.svg'}
                        alt={place.name}
                        className="w-full h-32 object-cover rounded-lg"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }}
                      />
                      <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                        <Heart className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>

                    {/* Place Info */}
                    <h3 className="font-bold text-lg mb-2 line-clamp-1" style={{ color: Colors.text }}>
                      {place.name}
                    </h3>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="font-medium" style={{ color: Colors.text }}>
                          {place.rating?.toFixed(1) || 'N/A'}
                        </span>
                      </div>
                      {place.user_ratings_total && (
                        <span className="text-sm" style={{ color: Colors.text_secondary }}>
                          ({place.user_ratings_total} reviews)
                        </span>
                      )}
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      {/* Distance */}
                      {distance && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-blue-500" />
                          <span style={{ color: Colors.text_secondary }}>
                            {distance.toFixed(1)}km
                          </span>
                        </div>
                      )}

                      {/* Status */}
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-green-500" />
                        <span 
                          className={place.opening_hours?.open_now ? 'text-green-600' : 'text-red-600'}
                          style={{ fontSize: '12px', fontWeight: '500' }}
                        >
                          {place.opening_hours?.open_now ? 'Open' : 'Closed'}
                        </span>
                      </div>

                      {/* Price */}
                      {place.examplePrice && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span style={{ color: Colors.text_secondary }}>
                            {place.examplePrice.amount} {place.examplePrice.currencyCode}
                          </span>
                        </div>
                      )}

                      {/* Type */}
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-purple-500" />
                        <span style={{ color: Colors.text_secondary, fontSize: '12px' }}>
                          {place.type}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm mb-4 line-clamp-2" style={{ color: Colors.text_secondary }}>
                      {place.description}
                    </p>

                    {/* Local Tip */}
                    {place.localTip && (
                      <div className="bg-blue-50 rounded-lg p-3 mb-4">
                        <p className="text-sm font-medium text-blue-800">💡 Local Tip:</p>
                        <p className="text-sm text-blue-700">{place.localTip}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          onSelectPlace(place);
                          handleCloseWithAnimation();
                        }}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        {t('placeComparison.viewDetails')}
                      </button>
                      <button
                        onClick={() => {
                          if (place.geometry?.location) {
                            const url = `https://www.google.com/maps/dir/?api=1&destination=${place.geometry.location.lat},${place.geometry.location.lng}`;
                            window.open(url, '_blank');
                          }
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                        style={{ color: Colors.text }}
                      >
                        {t('placeComparison.directions')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50" style={{ borderColor: Colors.cardBorder }}>
          <div className="flex justify-between items-center">
            <div className="text-sm" style={{ color: Colors.text_secondary }}>
              {t('placeComparison.helpText')}
            </div>
            <button
              onClick={handleCloseWithAnimation}
              className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              style={{ color: Colors.text }}
            >
              {t('close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceComparisonModal;
