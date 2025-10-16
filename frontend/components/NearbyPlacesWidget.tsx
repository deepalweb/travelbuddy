import React, { useState, useEffect } from 'react';
import { Place } from '../types';

interface NearbyPlacesWidgetProps {
  userLocation?: { latitude: number; longitude: number };
  onSelectPlace?: (place: Place) => void;
}

const NearbyPlacesWidget: React.FC<NearbyPlacesWidgetProps> = ({
  userLocation,
  onSelectPlace
}) => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userLocation) {
      loadNearbyPlaces();
    }
  }, [userLocation]);

  const loadNearbyPlaces = async () => {
    if (!userLocation) return;
    
    setLoading(true);
    try {
      const { fetchNearbyPlaces } = await import('../services/geminiService.ts');
      const nearbyPlaces = await fetchNearbyPlaces(
        userLocation.latitude,
        userLocation.longitude,
        [],
        5000
      );
      setPlaces(nearbyPlaces.slice(0, 6));
    } catch (error) {
      console.error('Error loading nearby places:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlaceIcon = (type: string) => {
    if (type.includes('restaurant')) return '🍽️';
    if (type.includes('museum')) return '🏛️';
    if (type.includes('park')) return '🌳';
    if (type.includes('shopping')) return '🛍️';
    return '📍';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h3 className="text-lg font-bold mb-4">Nearby Places</h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Nearby Places</h3>
        <button
          onClick={loadNearbyPlaces}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Refresh
        </button>
      </div>
      
      {places.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📍</div>
          <p className="text-gray-500">No nearby places found</p>
          <button
            onClick={loadNearbyPlaces}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {places.map((place) => (
            <div
              key={place.id}
              onClick={() => onSelectPlace?.(place)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">{getPlaceIcon(place.type)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">{place.name}</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{place.type}</span>
                  {place.rating && (
                    <>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">⭐</span>
                        <span>{place.rating}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500">
                {place.distance ? `${place.distance}km` : 'Nearby'}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t">
        <button className="w-full text-center text-blue-600 hover:text-blue-700 font-medium text-sm">
          View All Places
        </button>
      </div>
    </div>
  );
};

export default NearbyPlacesWidget;