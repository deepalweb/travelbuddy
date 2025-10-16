import React, { useState, useEffect, useCallback } from 'react';
import { Place } from '../types.ts';
import { Colors } from '../constants.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { useToast } from '../contexts/ToastContext.tsx';
import { MapPin, Star, Clock, Camera, Share, Bookmark, Eye, TrendingUp } from './Icons.tsx';

interface PlaceInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  place: Place;
  userLocation?: { latitude: number; longitude: number } | null;
  onSharePlace: (place: Place) => void;
  onAddToFavorites: (placeId: string) => void;
  isFavorite: boolean;
}

interface PlaceInsights {
  bestTimeToVisit: {
    time: string;
    reason: string;
    crowdLevel: 'low' | 'medium' | 'high';
  };
  popularWith: string[];
  averageVisitDuration: string;
  peakHours: string[];
  seasonalTrends: {
    season: string;
    description: string;
    rating: number;
  }[];
  nearbyRecommendations: {
    id: string;
    name: string;
    type: string;
    distance: string;
    reason: string;
  }[];
  photogenicSpots: {
    location: string;
    description: string;
    bestTime: string;
  }[];
  localSecrets: {
    tip: string;
    category: 'insider' | 'practical' | 'cultural';
  }[];
  accessibility: {
    wheelchairAccessible: boolean;
    parkingAvailable: boolean;
    publicTransport: boolean;
    notes: string;
  };
  sustainabilityScore: {
    score: number; // 0-100
    factors: string[];
  };
}

export const PlaceInsightsModal: React.FC<PlaceInsightsModalProps> = ({
  isOpen,
  onClose,
  place,
  userLocation,
  onSharePlace,
  onAddToFavorites,
  isFavorite
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [insights, setInsights] = useState<PlaceInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const { addToast } = useToast();

  const generateMockInsights = useCallback((place: Place): PlaceInsights => {
    // Generate realistic insights based on place type and data
    const placeType = place.type || place.types?.[0] || 'establishment';
    const rating = place.rating || 4.0;
    
    return {
      bestTimeToVisit: {
        time: placeType.includes('restaurant') ? '12:00 PM - 2:00 PM' : '10:00 AM - 12:00 PM',
        reason: placeType.includes('restaurant') ? 'Best selection available during lunch hours' : 'Less crowded in the morning with better lighting',
        crowdLevel: rating > 4.5 ? 'high' : rating > 4.0 ? 'medium' : 'low'
      },
      popularWith: [
        'Tourists',
        placeType.includes('museum') ? 'Art enthusiasts' : 'Locals',
        rating > 4.5 ? 'Instagram influencers' : 'Families'
      ],
      averageVisitDuration: placeType.includes('restaurant') ? '1-2 hours' : 
                           placeType.includes('museum') ? '2-3 hours' : '30-60 minutes',
      peakHours: placeType.includes('restaurant') ? ['12:00-14:00', '19:00-21:00'] : ['10:00-12:00', '14:00-16:00'],
      seasonalTrends: [
        { season: 'Spring', description: 'Perfect weather for visiting', rating: 5 },
        { season: 'Summer', description: 'Peak tourist season - expect crowds', rating: 3 },
        { season: 'Fall', description: 'Beautiful autumn colors', rating: 4 },
        { season: 'Winter', description: 'Quieter, but some areas may be closed', rating: 3 }
      ],
      nearbyRecommendations: [
        {
          id: 'nearby-1',
          name: placeType.includes('restaurant') ? 'Historic Walking Tour' : 'Local Cafe',
          type: placeType.includes('restaurant') ? 'Activity' : 'Restaurant',
          distance: '200m',
          reason: 'Perfect for after your visit'
        },
        {
          id: 'nearby-2',
          name: 'Artisan Market',
          type: 'Shopping',
          distance: '400m',
          reason: 'Local crafts and souvenirs'
        }
      ],
      photogenicSpots: [
        {
          location: 'Main entrance',
          description: 'Classic architecture shots',
          bestTime: 'Golden hour (1 hour before sunset)'
        },
        {
          location: place.name.includes('Park') ? 'Central fountain' : 'Interior courtyard',
          description: 'Great for portraits and detail shots',
          bestTime: 'Mid-morning for best lighting'
        }
      ],
      localSecrets: [
        {
          tip: place.localTip || 'Ask staff about daily specials not on the menu',
          category: 'insider'
        },
        {
          tip: 'Free WiFi password is usually the establishment name',
          category: 'practical'
        },
        {
          tip: 'Locals typically visit during off-peak hours for a better experience',
          category: 'cultural'
        }
      ],
      accessibility: {
        wheelchairAccessible: Math.random() > 0.3,
        parkingAvailable: !place.name.toLowerCase().includes('downtown'),
        publicTransport: true,
        notes: 'Contact venue directly to confirm current accessibility features'
      },
      sustainabilityScore: {
        score: Math.floor(Math.random() * 40) + 60, // 60-100
        factors: [
          'Uses renewable energy',
          'Supports local suppliers',
          'Waste reduction programs',
          'Public transport accessible'
        ]
      }
    };
  }, []);

  const handleCloseWithAnimation = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setLoading(true);
      
      // Simulate API call to generate insights
      setTimeout(() => {
        setInsights(generateMockInsights(place));
        setLoading(false);
      }, 1000);
    }
  }, [isOpen, place, generateMockInsights]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleCloseWithAnimation();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, handleCloseWithAnimation]);

  const handleShare = () => {
    onSharePlace(place);
    addToast({ message: t('placeInsights.shared'), type: 'success' });
  };

  const handleAddToFavorites = () => {
    onAddToFavorites(place.id);
    addToast({ 
      message: isFavorite ? t('placeInsights.removedFromFavorites') : t('placeInsights.addedToFavorites'), 
      type: 'success' 
    });
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-out
                  ${isVisible && isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={handleCloseWithAnimation}
      role="dialog"
      aria-modal="true"
      aria-labelledby="insights-modal-title"
    >
      <div
        className={`w-full max-w-4xl max-h-[90vh] flex flex-col relative rounded-xl shadow-xl overflow-hidden
                    transform transition-all duration-300 ease-out
                    ${isVisible && isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        style={{ backgroundColor: Colors.cardBackground, border: `1px solid ${Colors.cardBorder}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative">
          {/* Hero Image */}
          <div className="h-48 overflow-hidden">
            <img
              src={place.image || place.photoUrl || '/images/placeholder.svg'}
              alt={place.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          </div>
          
          {/* Overlay Content */}
          <div className="absolute inset-0 flex flex-col justify-between p-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 bg-white bg-opacity-90 rounded-full px-3 py-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="font-medium text-gray-800">
                  {place.rating?.toFixed(1) || 'N/A'}
                </span>
                {place.user_ratings_total && (
                  <span className="text-sm text-gray-600">
                    ({place.user_ratings_total})
                  </span>
                )}
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleAddToFavorites}
                  className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                >
                  <Bookmark className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-current' : 'text-gray-600'}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                >
                  <Share className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={handleCloseWithAnimation}
                  className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div>
              <h2 id="insights-modal-title" className="text-2xl font-bold text-white mb-2">
                {place.name}
              </h2>
              <div className="flex items-center gap-2 text-white">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">
                  {place.vicinity || place.formatted_address}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-lg" style={{ color: Colors.text }}>
                  {t('placeInsights.analyzing')}
                </p>
                <p className="text-sm" style={{ color: Colors.text_secondary }}>
                  {t('placeInsights.generatingInsights')}
                </p>
              </div>
            </div>
          ) : insights ? (
            <div className="space-y-8">
              {/* Best Time to Visit */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 text-blue-900 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  {t('placeInsights.bestTimeToVisit')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="font-medium text-blue-800">{insights.bestTimeToVisit.time}</p>
                    <p className="text-sm text-blue-700">{insights.bestTimeToVisit.reason}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 mb-1">Expected Crowd Level</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        insights.bestTimeToVisit.crowdLevel === 'low' ? 'bg-green-500' :
                        insights.bestTimeToVisit.crowdLevel === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-sm text-blue-800 capitalize">{insights.bestTimeToVisit.crowdLevel}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 mb-1">Average Visit</p>
                    <p className="text-sm text-blue-800">{insights.averageVisitDuration}</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Popular With */}
                <div className="bg-purple-50 rounded-xl p-6">
                  <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Popular With
                  </h4>
                  <div className="space-y-2">
                    {insights.popularWith.map((group, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-purple-800">{group}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Peak Hours */}
                <div className="bg-orange-50 rounded-xl p-6">
                  <h4 className="font-semibold text-orange-900 mb-3">Peak Hours</h4>
                  <div className="space-y-2">
                    {insights.peakHours.map((hour, index) => (
                      <div key={index} className="bg-orange-200 rounded-lg px-3 py-2">
                        <span className="text-sm font-medium text-orange-800">{hour}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sustainability Score */}
                <div className="bg-green-50 rounded-xl p-6">
                  <h4 className="font-semibold text-green-900 mb-3">Sustainability</h4>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-700 mb-2">
                      {insights.sustainabilityScore.score}
                    </div>
                    <div className="text-sm text-green-600">Eco Score</div>
                    <div className="w-full bg-green-200 rounded-full h-2 mt-3">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${insights.sustainabilityScore.score}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Photography Spots */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: Colors.text }}>
                  <Camera className="w-5 h-5" />
                  {t('placeInsights.photogenicSpots')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.photogenicSpots.map((spot, index) => (
                    <div key={index} className="border rounded-xl p-4" style={{ borderColor: Colors.cardBorder }}>
                      <h4 className="font-medium mb-2" style={{ color: Colors.text }}>{spot.location}</h4>
                      <p className="text-sm mb-2" style={{ color: Colors.text_secondary }}>{spot.description}</p>
                      <div className="flex items-center gap-2 text-xs" style={{ color: Colors.text_secondary }}>
                        <Clock className="w-3 h-3" />
                        <span>{spot.bestTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Local Secrets */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: Colors.text }}>
                  <Eye className="w-5 h-5" />
                  {t('placeInsights.localSecrets')}
                </h3>
                <div className="space-y-3">
                  {insights.localSecrets.map((secret, index) => (
                    <div 
                      key={index} 
                      className={`p-4 rounded-xl border-l-4 ${
                        secret.category === 'insider' ? 'bg-yellow-50 border-yellow-400' :
                        secret.category === 'practical' ? 'bg-blue-50 border-blue-400' :
                        'bg-green-50 border-green-400'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          secret.category === 'insider' ? 'bg-yellow-500' :
                          secret.category === 'practical' ? 'bg-blue-500' :
                          'bg-green-500'
                        }`}>
                          {secret.category === 'insider' ? '💡' : 
                           secret.category === 'practical' ? '🔧' : '🏛️'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-1 capitalize">
                            {secret.category} Tip
                          </p>
                          <p className="text-sm" style={{ color: Colors.text }}>{secret.tip}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accessibility Info */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: Colors.text }}>
                  {t('placeInsights.accessibility')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${insights.accessibility.wheelchairAccessible ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm">Wheelchair Accessible</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${insights.accessibility.parkingAvailable ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm">Parking Available</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${insights.accessibility.publicTransport ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-sm">Public Transport</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{insights.accessibility.notes}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PlaceInsightsModal;
