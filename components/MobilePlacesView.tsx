import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Clock, DollarSign, Navigation, Heart, Camera } from 'lucide-react';

interface Place {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: Array<{
    photo_reference: string;
    width: number;
    height: number;
  }>;
  distance_m?: number;
}

const MobilePlacesView: React.FC = () => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState({ lat: 40.7128, lng: -74.0060 }); // Default NYC
  const [selectedCategory, setSelectedCategory] = useState('points of interest');

  const categories = [
    { id: 'points of interest', label: '🏛️ Attractions', icon: MapPin },
    { id: 'restaurant', label: '🍽️ Restaurants', icon: DollarSign },
    { id: 'museum', label: '🏛️ Museums', icon: Camera },
    { id: 'park', label: '🌳 Parks', icon: Navigation },
    { id: 'shopping_mall', label: '🛍️ Shopping', icon: Heart },
  ];

  const searchPlaces = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const query = searchQuery || selectedCategory;
      const response = await fetch(
        `/api/places/nearby?lat=${location.lat}&lng=${location.lng}&q=${encodeURIComponent(query)}&radius=5000`
      );
      const data = await response.json();
      setPlaces(data);
    } catch (error) {
      console.error('Error searching places:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (location.lat && location.lng) {
      searchPlaces();
    }
  }, [location, selectedCategory]);

  const getPlaceImage = (place: Place): string => {
    if (place.photos && place.photos.length > 0) {
      return `/api/places/photo?ref=${place.photos[0].photo_reference}&w=400`;
    }
    return 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400';
  };

  const formatDistance = (distanceM?: number): string => {
    if (!distanceM) return '';
    if (distanceM < 1000) return `${Math.round(distanceM)}m`;
    return `${(distanceM / 1000).toFixed(1)}km`;
  };

  const getTypeIcon = (types: string[]): string => {
    if (types.includes('restaurant') || types.includes('food')) return '🍽️';
    if (types.includes('museum')) return '🏛️';
    if (types.includes('park')) return '🌳';
    if (types.includes('shopping_mall')) return '🛍️';
    if (types.includes('tourist_attraction')) return '📸';
    return '📍';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <MapPin className="w-8 h-8 text-green-500" />
          <h1 className="text-3xl font-bold text-gray-900">Explore Places</h1>
        </div>
        <p className="text-gray-600">Discover amazing places near you</p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && searchPlaces()}
          placeholder="Search for places, restaurants, attractions..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={searchPlaces}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white px-4 py-1.5 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Search
        </button>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <category.icon className="w-4 h-4" />
            {category.label}
          </button>
        ))}
      </div>

      {/* Location Button */}
      <div className="flex justify-center">
        <button
          onClick={getCurrentLocation}
          className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
        >
          <Navigation className="w-4 h-4" />
          Use My Location
        </button>
      </div>

      {/* Places Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {places.map((place) => (
            <div key={place.place_id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Place Image */}
              <div className="relative h-48">
                <img
                  src={getPlaceImage(place)}
                  alt={place.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-white bg-opacity-90 px-2 py-1 rounded-full text-sm font-medium">
                  {getTypeIcon(place.types)}
                </div>
                {place.distance_m && (
                  <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs">
                    {formatDistance(place.distance_m)}
                  </div>
                )}
              </div>

              {/* Place Info */}
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-gray-900 line-clamp-1">{place.name}</h3>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="line-clamp-1">{place.formatted_address}</span>
                </div>

                {place.rating && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{place.rating.toFixed(1)}</span>
                    </div>
                    {place.user_ratings_total && (
                      <span className="text-sm text-gray-500">
                        ({place.user_ratings_total} reviews)
                      </span>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => window.open(`https://maps.google.com/?q=${place.name}`, '_blank')}
                    className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                  >
                    <Navigation className="w-4 h-4" />
                    Directions
                  </button>
                  <button className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition-colors">
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {places.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No places found</h3>
          <p className="text-gray-500 mb-4">Try searching for a different location or category</p>
          <button
            onClick={searchPlaces}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Search Again
          </button>
        </div>
      )}
    </div>
  );
};

export default MobilePlacesView;