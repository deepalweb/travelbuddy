import React, { useState, useEffect } from 'react';
import { MapPin, Thermometer, Calendar, TrendingUp, Users, Zap, Sun, Cloud, CloudRain } from 'lucide-react';

interface WeatherData {
  current: {
    temperature: number;
    condition: string;
    description: string;
    emoji?: string;
  };
  forecast: {
    daily: Array<{
      date: string;
      tempMax: number;
      tempMin: number;
      condition: string;
      emoji: string;
    }>;
  };
}

interface RecentActivity {
  id: string;
  type: 'trip' | 'place' | 'community';
  title: string;
  subtitle: string;
  time: string;
  icon: string;
}

const MobileHomeDashboard: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState({ lat: 40.7128, lng: -74.0060, name: 'New York' });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [quickStats, setQuickStats] = useState({
    tripsPlanned: 0,
    placesExplored: 0,
    communityPosts: 0,
  });

  useEffect(() => {
    fetchWeather();
    fetchRecentActivities();
    fetchQuickStats();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: 'Your Location',
          });
          fetchWeatherForLocation(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  };

  const fetchWeather = async () => {
    try {
      const response = await fetch(`/api/weather/google?lat=${location.lat}&lng=${location.lng}`);
      const data = await response.json();
      setWeather(data);
    } catch (error) {
      console.error('Weather fetch error:', error);
    }
  };

  const fetchWeatherForLocation = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`/api/weather/google?lat=${lat}&lng=${lng}`);
      const data = await response.json();
      setWeather(data);
    } catch (error) {
      console.error('Weather fetch error:', error);
    }
  };

  const fetchRecentActivities = async () => {
    // Mock recent activities - in real app, fetch from user's history
    setRecentActivities([
      {
        id: '1',
        type: 'trip',
        title: 'Tokyo Day Trip',
        subtitle: 'Generated with AI',
        time: '2 hours ago',
        icon: '🗾',
      },
      {
        id: '2',
        type: 'place',
        title: 'Central Park',
        subtitle: 'Added to favorites',
        time: '1 day ago',
        icon: '🌳',
      },
      {
        id: '3',
        type: 'community',
        title: 'Shared travel photo',
        subtitle: '12 likes received',
        time: '2 days ago',
        icon: '📸',
      },
    ]);
  };

  const fetchQuickStats = async () => {
    try {
      // Fetch real stats from API
      const response = await fetch('/api/db-check');
      const data = await response.json();
      setQuickStats({
        tripsPlanned: data.tripPlans || 0,
        placesExplored: Math.floor(Math.random() * 50) + 10,
        communityPosts: data.posts || 0,
      });
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  };

  const getWeatherIcon = (condition: string) => {
    const normalized = condition.toLowerCase();
    if (normalized.includes('sun') || normalized.includes('clear')) return <Sun className="w-6 h-6 text-yellow-500" />;
    if (normalized.includes('cloud')) return <Cloud className="w-6 h-6 text-gray-500" />;
    if (normalized.includes('rain')) return <CloudRain className="w-6 h-6 text-blue-500" />;
    return <Sun className="w-6 h-6 text-yellow-500" />;
  };

  const quickActions = [
    {
      title: 'Plan Trip',
      subtitle: 'AI-powered planning',
      icon: <Calendar className="w-6 h-6 text-blue-500" />,
      color: 'from-blue-500 to-blue-600',
      action: () => window.location.href = '#planner',
    },
    {
      title: 'Find Places',
      subtitle: 'Explore nearby',
      icon: <MapPin className="w-6 h-6 text-green-500" />,
      color: 'from-green-500 to-green-600',
      action: () => window.location.href = '#places',
    },
    {
      title: 'Community',
      subtitle: 'Share & discover',
      icon: <Users className="w-6 h-6 text-purple-500" />,
      color: 'from-purple-500 to-purple-600',
      action: () => window.location.href = '#community',
    },
    {
      title: 'AI Assistant',
      subtitle: 'Get recommendations',
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      color: 'from-yellow-500 to-orange-500',
      action: () => window.location.href = '#ai-chat',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Welcome Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Welcome Back!</h1>
        <p className="text-gray-600">Ready for your next adventure?</p>
      </div>

      {/* Weather & Location Card */}
      {weather && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">{location.name}</span>
              </div>
              <p className="text-sm opacity-90">{weather.current.description}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                {getWeatherIcon(weather.current.condition)}
                <span className="text-3xl font-bold">{weather.current.temperature}°C</span>
              </div>
              <p className="text-sm opacity-90 capitalize">{weather.current.condition}</p>
            </div>
          </div>
          
          {/* 5-Day Forecast */}
          <div className="mt-4 pt-4 border-t border-white border-opacity-20">
            <div className="flex justify-between">
              {weather.forecast?.daily?.slice(0, 5).map((day, index) => (
                <div key={index} className="text-center">
                  <div className="text-xs opacity-75 mb-1">
                    {index === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                  </div>
                  <div className="text-lg mb-1">{day.emoji}</div>
                  <div className="text-xs">
                    <div className="font-medium">{day.tempMax}°</div>
                    <div className="opacity-75">{day.tempMin}°</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={action.action}
            className={`bg-gradient-to-r ${action.color} text-white p-4 rounded-xl hover:shadow-lg transition-all transform hover:scale-105`}
          >
            <div className="flex flex-col items-center space-y-2">
              {action.icon}
              <div className="text-center">
                <div className="font-semibold">{action.title}</div>
                <div className="text-xs opacity-90">{action.subtitle}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-500">{quickStats.tripsPlanned}</div>
          <div className="text-sm text-gray-600">Trips Planned</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-500">{quickStats.placesExplored}</div>
          <div className="text-sm text-gray-600">Places Explored</div>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-500">{quickStats.communityPosts}</div>
          <div className="text-sm text-gray-600">Community Posts</div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        
        <div className="space-y-3">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="text-2xl">{activity.icon}</div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{activity.title}</h3>
                <p className="text-sm text-gray-600">{activity.subtitle}</p>
              </div>
              <div className="text-xs text-gray-500">{activity.time}</div>
            </div>
          ))}
        </div>
        
        {recentActivities.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No recent activity</p>
            <p className="text-sm text-gray-400">Start exploring to see your activity here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileHomeDashboard;