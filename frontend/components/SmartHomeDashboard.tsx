import React, { useState, useEffect } from 'react';
import NearbyPlacesWidget from './NearbyPlacesWidget.tsx';

interface MoodOption {
  id: string;
  label: string;
  emoji: string;
  description: string;
}

interface LocalEvent {
  id: string;
  title: string;
  location: string;
  time: string;
  emoji: string;
  category: string;
}

interface WeatherInfo {
  temperature: number;
  condition: string;
  emoji: string;
  recommendation: string;
}

const SmartHomeDashboard: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<string>('adventurous');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather] = useState<WeatherInfo>({
    temperature: 22,
    condition: 'Sunny',
    emoji: '☀️',
    recommendation: 'Perfect for outdoor activities'
  });

  const moodOptions: MoodOption[] = [
    { id: 'adventurous', label: 'Adventurous', emoji: '🗺️', description: 'Ready to explore' },
    { id: 'relaxed', label: 'Relaxed', emoji: '😌', description: 'Take it easy' },
    { id: 'cultural', label: 'Cultural', emoji: '🎭', description: 'Learn and discover' },
    { id: 'foodie', label: 'Foodie', emoji: '🍽️', description: 'Taste local flavors' },
    { id: 'social', label: 'Social', emoji: '👥', description: 'Meet new people' }
  ];

  const localEvents: LocalEvent[] = [
    { id: '1', title: 'Street Art Festival', location: 'Downtown', time: 'Today 2-6 PM', emoji: '🎨', category: 'Culture' },
    { id: '2', title: 'Food Truck Rally', location: 'Central Park', time: 'Tonight 6-10 PM', emoji: '🚚', category: 'Food' },
    { id: '3', title: 'Live Jazz Music', location: 'Blue Note Café', time: 'Tonight 8 PM', emoji: '🎷', category: 'Music' }
  ];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getTimeBasedGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getMoodRecommendations = (mood: string) => {
    const recommendations = {
      adventurous: [
        { title: 'Hidden Waterfall Hike', time: '3h', cost: 'Free', emoji: '🏞️' },
        { title: 'Urban Exploration Tour', time: '2h', cost: '$25', emoji: '🏙️' },
        { title: 'Kayak Adventure', time: '4h', cost: '$45', emoji: '🚣' }
      ],
      relaxed: [
        { title: 'Botanical Garden Visit', time: '2h', cost: '$12', emoji: '🌺' },
        { title: 'Spa & Wellness Center', time: '3h', cost: '$80', emoji: '🧘' },
        { title: 'Sunset Beach Walk', time: '1h', cost: 'Free', emoji: '🌅' }
      ],
      cultural: [
        { title: 'Art Museum Tour', time: '3h', cost: '$18', emoji: '🖼️' },
        { title: 'Historical Walking Tour', time: '2.5h', cost: '$20', emoji: '🏛️' },
        { title: 'Local Theater Show', time: '2h', cost: '$35', emoji: '🎭' }
      ],
      foodie: [
        { title: 'Food Market Tour', time: '2h', cost: '$30', emoji: '🍜' },
        { title: 'Cooking Class', time: '3h', cost: '$65', emoji: '👨‍🍳' },
        { title: 'Wine Tasting', time: '2h', cost: '$40', emoji: '🍷' }
      ],
      social: [
        { title: 'Community Event', time: '3h', cost: 'Free', emoji: '🎪' },
        { title: 'Group City Tour', time: '4h', cost: '$28', emoji: '🚌' },
        { title: 'Social Dancing Class', time: '1.5h', cost: '$15', emoji: '💃' }
      ]
    };
    
    return recommendations[mood as keyof typeof recommendations] || recommendations.adventurous;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{getTimeBasedGreeting()}, Alex!</h1>
            <p className="text-lg opacity-90">Ready for your next adventure?</p>
          </div>
          <div className="text-right">
            <div className="text-2xl mb-1">{weather.emoji} {weather.temperature}°C</div>
            <div className="text-sm opacity-80">{weather.condition}</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600">📍</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">San Francisco</div>
              <div className="text-sm text-gray-600">Current Location</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600">💰</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">$150</div>
              <div className="text-sm text-gray-600">Daily Budget</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600">⏰</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
              <div className="text-sm text-gray-600">Local Time</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600">🎯</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">3</div>
              <div className="text-sm text-gray-600">Plans Today</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mood Selection */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <h2 className="text-xl font-bold text-gray-900 mb-4">How are you feeling today?</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {moodOptions.map((mood) => (
            <button
              key={mood.id}
              onClick={() => setSelectedMood(mood.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedMood === mood.id
                  ? 'border-indigo-500 bg-indigo-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl mb-2">{mood.emoji}</div>
              <div className="font-medium text-gray-900">{mood.label}</div>
              <div className="text-xs text-gray-600 mt-1">{mood.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Personalized Recommendations */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Perfect for your {moodOptions.find(m => m.id === selectedMood)?.label.toLowerCase()} mood
          </h2>
          <button className="text-indigo-600 hover:text-indigo-700 font-medium">View All</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {getMoodRecommendations(selectedMood).map((rec, index) => (
            <div key={index} className="border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{rec.emoji}</span>
                <div>
                  <h3 className="font-medium text-gray-900">{rec.title}</h3>
                  <div className="text-sm text-gray-600">{rec.time} • {rec.cost}</div>
                </div>
              </div>
              <button className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                Add to Plan
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Local Events */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border">
        <h2 className="text-xl font-bold text-gray-900 mb-4">What's Happening Locally</h2>
        <div className="space-y-3">
          {localEvents.map((event) => (
            <div key={event.id} className="flex items-center gap-4 p-4 border rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">{event.emoji}</span>
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{event.title}</h3>
                <div className="text-sm text-gray-600">{event.location} • {event.time}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {event.category}
                </span>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                  Interested
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nearby Places Section */}
      <div className="mb-8">
        <NearbyPlacesWidget 
          userLocation={{ latitude: 37.7749, longitude: -122.4194 }}
          onSelectPlace={(place) => console.log('Selected place:', place)}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-2xl hover:shadow-lg transition-all">
          <div className="text-2xl mb-2">🗺️</div>
          <div className="font-medium">Plan Day Trip</div>
        </button>
        
        <button className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-2xl hover:shadow-lg transition-all">
          <div className="text-2xl mb-2">🎯</div>
          <div className="font-medium">Find Nearby</div>
        </button>
        
        <button className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-2xl hover:shadow-lg transition-all">
          <div className="text-2xl mb-2">💡</div>
          <div className="font-medium">Get Inspired</div>
        </button>
        
        <button className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-2xl hover:shadow-lg transition-all">
          <div className="text-2xl mb-2">🚨</div>
          <div className="font-medium">Emergency</div>
        </button>
      </div>
    </div>
  );
};

export default SmartHomeDashboard;