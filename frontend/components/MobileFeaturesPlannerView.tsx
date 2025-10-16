import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Users, Clock, Sparkles, Zap } from 'lucide-react';

interface Activity {
  time: string;
  activity: string;
  description: string;
}

interface PlannerFormData {
  destination: string;
  interests: string;
  pace: string;
  dietaryPreferences: string[];
  isAccessible: boolean;
  weather?: string;
}

const MobileFeaturesPlannerView: React.FC = () => {
  const [formData, setFormData] = useState<PlannerFormData>({
    destination: '',
    interests: '',
    pace: 'moderate',
    dietaryPreferences: [],
    isAccessible: false,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [weather, setWeather] = useState<any>(null);

  const generateItinerary = async () => {
    if (!formData.destination.trim()) return;
    
    setIsGenerating(true);
    try {
      const prompt = `Create a day itinerary for ${formData.destination} with these requirements:

Interests: ${formData.interests}
Pace: ${formData.pace}
Dietary: ${formData.dietaryPreferences.join(', ')}
Accessible: ${formData.isAccessible}
Weather: ${weather?.current?.condition || 'sunny'}

Return ONLY valid JSON:
{
  "activities": [
    {
      "time": "09:00",
      "activity": "Activity Name",
      "description": "Brief description"
    }
  ]
}`;

      const response = await fetch('/api/ai/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      
      if (data.itinerary?.activities) {
        setActivities(data.itinerary.activities);
      } else if (data.text) {
        // Try to parse JSON from text
        const jsonMatch = data.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setActivities(parsed.activities || []);
        }
      }
    } catch (error) {
      console.error('Error generating itinerary:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const fetchWeather = async () => {
    if (!formData.destination) return;
    
    try {
      // Simple geocoding for demo
      const response = await fetch(`/api/weather/google?lat=35.6762&lng=139.6503`);
      const weatherData = await response.json();
      setWeather(weatherData);
    } catch (error) {
      console.error('Weather fetch error:', error);
    }
  };

  useEffect(() => {
    if (formData.destination) {
      fetchWeather();
    }
  }, [formData.destination]);

  const paceOptions = [
    { value: 'relaxed', label: '🐌 Relaxed', desc: 'Take it easy' },
    { value: 'moderate', label: '🚶 Moderate', desc: 'Balanced pace' },
    { value: 'active', label: '🏃 Active', desc: 'Pack it in' },
  ];

  const interestOptions = [
    'Museums', 'Food', 'Nature', 'History', 'Shopping', 'Nightlife', 'Art', 'Architecture'
  ];

  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher', 'No Restrictions'
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-gray-900">AI Trip Planner</h1>
        </div>
        <p className="text-gray-600">Powered by Azure OpenAI GPT-4.1</p>
      </div>

      {/* Weather Card */}
      {weather && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Current Weather</h3>
              <p className="text-sm opacity-90">{formData.destination}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{weather.current?.temperature}°C</div>
              <div className="text-sm capitalize">{weather.current?.condition}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Planning Form */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              Plan Your Day
            </h2>

            {/* Destination */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination
              </label>
              <input
                type="text"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                placeholder="Where are you going?"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Interests */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interests
              </label>
              <div className="grid grid-cols-2 gap-2">
                {interestOptions.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => {
                      const current = formData.interests.split(', ').filter(Boolean);
                      const updated = current.includes(interest)
                        ? current.filter(i => i !== interest)
                        : [...current, interest];
                      setFormData({ ...formData, interests: updated.join(', ') });
                    }}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      formData.interests.includes(interest)
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* Pace */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Travel Pace
              </label>
              <div className="grid grid-cols-3 gap-2">
                {paceOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFormData({ ...formData, pace: option.value })}
                    className={`p-3 text-center rounded-lg border transition-colors ${
                      formData.pace === option.value
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs opacity-75">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Dietary Preferences */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dietary Preferences
              </label>
              <div className="grid grid-cols-2 gap-2">
                {dietaryOptions.map((diet) => (
                  <button
                    key={diet}
                    onClick={() => {
                      const updated = formData.dietaryPreferences.includes(diet)
                        ? formData.dietaryPreferences.filter(d => d !== diet)
                        : [...formData.dietaryPreferences, diet];
                      setFormData({ ...formData, dietaryPreferences: updated });
                    }}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      formData.dietaryPreferences.includes(diet)
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-green-300'
                    }`}
                  >
                    {diet}
                  </button>
                ))}
              </div>
            </div>

            {/* Accessibility */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="accessible"
                checked={formData.isAccessible}
                onChange={(e) => setFormData({ ...formData, isAccessible: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="accessible" className="text-sm font-medium text-gray-700">
                Accessibility requirements
              </label>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateItinerary}
              disabled={!formData.destination.trim() || isGenerating}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Generate AI Itinerary
                </>
              )}
            </button>
          </div>
        </div>

        {/* Generated Itinerary */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-500" />
            Your AI Itinerary
          </h2>

          {activities.length === 0 && !isGenerating && (
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Enter a destination and generate your AI-powered itinerary</p>
            </div>
          )}

          {activities.map((activity, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-blue-500">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {activity.time}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{activity.activity}</h3>
                  <p className="text-gray-600 text-sm">{activity.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobileFeaturesPlannerView;