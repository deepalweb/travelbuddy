import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Globe, RotateCcw, MapPin } from 'lucide-react';

interface AppBarProps {
  onRefresh: () => void;
  refreshing: boolean;
}

const AppBar: React.FC<AppBarProps> = ({ onRefresh, refreshing }) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
      <div className="flex items-center justify-between px-4 h-16">
        {/* Logo */}
        <motion.div 
          className="flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="p-2 bg-white rounded-xl shadow-sm">
            <MapPin className="w-6 h-6 text-blue-600" />
          </div>
          <span className="text-lg font-bold text-gray-900">TravelBuddy</span>
        </motion.div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <motion.button
            className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Bell className="w-5 h-5 text-gray-600" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
          </motion.button>

          {/* Language */}
          <motion.button
            className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <div className="flex items-center space-x-1">
              <span className="text-sm">🇺🇸</span>
              <Globe className="w-4 h-4 text-gray-600" />
            </div>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          </motion.button>

          {/* Refresh */}
          <motion.button
            onClick={onRefresh}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            animate={{ rotate: refreshing ? 360 : 0 }}
            transition={{ duration: 1, repeat: refreshing ? Infinity : 0 }}
          >
            <RotateCcw className="w-5 h-5 text-gray-600" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default AppBar;