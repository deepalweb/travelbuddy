import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Sun, Cloud, CloudRain } from 'lucide-react';

interface WelcomeCardProps {
  user: any;
  weather: any;
  location: any;
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({ user, weather, location }) => {
  const [currentQuote, setCurrentQuote] = useState(0);

  const quotes = [
    "Adventure awaits just beyond your doorstep 🌍",
    "Perfect day to explore the hidden gems nearby!",
    "Every journey begins with a single step 🚶‍♂️",
    "The world is your playground today! 🎯"
  ];

  const getTimeBasedGradient = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) {
      return 'from-pink-400 via-purple-300 to-cyan-300'; // Morning
    } else if (hour >= 12 && hour < 18) {
      return 'from-purple-500 to-purple-700'; // Afternoon
    } else {
      return 'from-blue-900 to-indigo-900'; // Evening/Night
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case 'sunny':
      case 'clear':
        return <Sun className="w-5 h-5" />;
      case 'cloudy':
        return <Cloud className="w-5 h-5" />;
      case 'rainy':
        return <CloudRain className="w-5 h-5" />;
      default:
        return <Sun className="w-5 h-5" />;
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${getTimeBasedGradient()} p-6 text-white shadow-lg`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background Pattern */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12" />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30">
            {user?.profilePicture ? (
              <img 
                src={user.profilePicture} 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-white/30 rounded-full" />
            )}
          </div>
          <div>
            <p className="text-white/80 text-sm">{getGreeting()}</p>
            <h2 className="text-xl font-bold">{user?.username || 'Traveler'}</h2>
          </div>
        </div>

        {/* Weather */}
        {weather && (
          <div className="flex items-center space-x-2 bg-white/20 px-3 py-2 rounded-full">
            {getWeatherIcon(weather.condition)}
            <span className="font-semibold">{Math.round(weather.temperature)}°</span>
          </div>
        )}
      </div>

      {/* Location */}
      {location && (
        <div className="flex items-center space-x-2 bg-white/15 px-3 py-2 rounded-lg mb-4 w-fit">
          <MapPin className="w-4 h-4" />
          <span className="text-sm font-medium">
            {location.address || 'Current Location'}
          </span>
        </div>
      )}

      {/* Quote */}
      <motion.p
        key={currentQuote}
        className="text-white/90 text-sm italic"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.5 }}
      >
        {quotes[currentQuote]}
      </motion.p>
    </motion.div>
  );
};

export default WelcomeCard;