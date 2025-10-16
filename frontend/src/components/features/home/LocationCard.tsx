import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, AlertTriangle } from 'lucide-react';

interface LocationCardProps {
  onEnableLocation: () => void;
}

const LocationCard: React.FC<LocationCardProps> = ({ onEnableLocation }) => {
  return (
    <motion.div
      className="bg-orange-50 border border-orange-200 rounded-xl p-4"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-orange-100 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-orange-900 mb-1">
            Location Access Needed
          </h3>
          <p className="text-orange-700 text-sm mb-3">
            Enable location access for personalized recommendations and nearby places.
          </p>
          <motion.button
            onClick={onEnableLocation}
            className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <MapPin className="w-4 h-4" />
            <span>Enable Location</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default LocationCard;