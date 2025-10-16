import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, ArrowRight } from 'lucide-react';

interface Place {
  id: string;
  name: string;
  type: string;
  rating: number;
  image: string;
  travelStyle: string;
}

interface NearbyPlacesProps {
  places: Place[];
}

const NearbyPlaces: React.FC<NearbyPlacesProps> = ({ places }) => {
  const getTravelStyleEmoji = (style: string) => {
    const styles: { [key: string]: string } = {
      'beach': '🏖️',
      'adventure': '🏔️',
      'urban': '🏙️',
      'cultural': '🏛️',
      'nature': '🌲',
      'food': '🍽️'
    };
    return styles[style.toLowerCase()] || '📍';
  };

  if (places.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 text-center">
        <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No nearby places found</p>
        <p className="text-gray-400 text-sm mt-1">Enable location for recommendations</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold text-gray-900">Places for You</h2>
          <div className="bg-blue-100 px-2 py-1 rounded-full">
            <span className="text-xs font-medium text-blue-600">
              {getTravelStyleEmoji('beach')} Beach Lover
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {places.slice(0, 6).map((place, index) => (
          <motion.div
            key={place.id}
            className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
          >
            <div className="relative h-24 bg-gray-200">
              {place.image ? (
                <img
                  src={place.image}
                  alt={place.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="absolute top-2 right-2 bg-white/90 px-1.5 py-0.5 rounded-full">
                <span className="text-xs">{getTravelStyleEmoji(place.travelStyle)}</span>
              </div>
            </div>
            
            <div className="p-3">
              <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-1">
                {place.name}
              </h3>
              <div className="flex items-center space-x-1 mb-1">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <span className="text-xs text-gray-600">{place.rating.toFixed(1)}</span>
              </div>
              <p className="text-xs text-gray-500 capitalize">{place.type}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.button
        className="w-full bg-blue-50 text-blue-600 py-3 rounded-xl font-medium flex items-center justify-center space-x-2 border border-blue-100"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span>Explore More Places</span>
        <ArrowRight className="w-4 h-4" />
      </motion.button>
    </div>
  );
};

export default NearbyPlaces;