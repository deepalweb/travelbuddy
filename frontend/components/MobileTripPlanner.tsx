import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Calendar, Users, Sparkles, Save, Share2 } from 'lucide-react';

interface TripPlan {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: number;
  style: string;
  activities: Activity[];
  createdAt: string;
}

interface Activity {
  id: string;
  name: string;
  type: string;
  duration: number;
  cost: number;
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  timeSlot: string;
  day: number;
}

export const MobileTripPlanner: React.FC = () => {
  const [step, setStep] = useState(1);
  const [tripData, setTripData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
    travelers: 1,
    budget: 500,
    style: 'balanced',
    interests: [] as string[]
  });
  const [generatedPlan, setGeneratedPlan] = useState<TripPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const travelStyles = [
    { id: 'budget', name: 'Budget Explorer', icon: '💰', description: 'Affordable adventures' },
    { id: 'balanced', name: 'Balanced Traveler', icon: '⚖️', description: 'Mix of comfort and value' },
    { id: 'luxury', name: 'Luxury Seeker', icon: '✨', description: 'Premium experiences' },
    { id: 'adventure', name: 'Adventure Seeker', icon: '🏔️', description: 'Thrilling activities' },
    { id: 'cultural', name: 'Culture Enthusiast', icon: '🏛️', description: 'Museums and heritage' },
    { id: 'foodie', name: 'Food Explorer', icon: '🍜', description: 'Culinary experiences' }
  ];

  const interests = [
    'Museums', 'Nature', 'Food', 'Shopping', 'Nightlife', 'Architecture',
    'History', 'Art', 'Sports', 'Music', 'Photography', 'Local Culture'
  ];

  const generateTrip = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/generate-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripData)
      });
      
      if (response.ok) {
        const plan = await response.json();
        setGeneratedPlan(plan);
        setStep(4);
      }
    } catch (error) {
      console.error('Trip generation error:', error);
      // Fallback mock plan
      setGeneratedPlan({
        id: Date.now().toString(),
        title: `${tripData.destination} Adventure`,
        destination: tripData.destination,
        startDate: tripData.startDate,
        endDate: tripData.endDate,
        travelers: tripData.travelers,
        budget: tripData.budget,
        style: tripData.style,
        activities: [
          {
            id: '1',
            name: 'City Walking Tour',
            type: 'sightseeing',
            duration: 180,
            cost: 25,
            description: 'Explore the historic downtown area',
            location: { lat: 0, lng: 0, address: 'Downtown Area' },
            timeSlot: '09:00',
            day: 1
          }
        ],
        createdAt: new Date().toISOString()
      });
      setStep(4);
    }
    setLoading(false);
  };

  const saveTripPlan = async () => {
    if (!generatedPlan) return;
    
    try {
      await fetch('/api/trip-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generatedPlan)
      });
      alert('Trip plan saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const shareTrip = () => {
    if (navigator.share && generatedPlan) {
      navigator.share({
        title: generatedPlan.title,
        text: `Check out my trip plan for ${generatedPlan.destination}!`,
        url: window.location.href
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((num) => (
          <div key={num} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              {num}
            </div>
            {num < 4 && <div className={`w-16 h-1 mx-2 ${step > num ? 'bg-blue-600' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Destination & Dates */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Where are you going?</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={tripData.destination}
                  onChange={(e) => setTripData({...tripData, destination: e.target.value})}
                  placeholder="Enter city or country"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={tripData.startDate}
                  onChange={(e) => setTripData({...tripData, startDate: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={tripData.endDate}
                  onChange={(e) => setTripData({...tripData, endDate: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Travelers</label>
              <div className="relative">
                <Users className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <select
                  value={tripData.travelers}
                  onChange={(e) => setTripData({...tripData, travelers: parseInt(e.target.value)})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {[1,2,3,4,5,6,7,8].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'Person' : 'People'}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!tripData.destination || !tripData.startDate || !tripData.endDate}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Budget & Style */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">What's your travel style?</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">Budget per person</label>
            <div className="space-y-2">
              <input
                type="range"
                min="100"
                max="5000"
                step="50"
                value={tripData.budget}
                onChange={(e) => setTripData({...tripData, budget: parseInt(e.target.value)})}
                className="w-full"
              />
              <div className="text-center text-lg font-semibold text-blue-600">
                ${tripData.budget}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">Travel Style</label>
            <div className="grid grid-cols-2 gap-3">
              {travelStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setTripData({...tripData, style: style.id})}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    tripData.style === style.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{style.icon}</div>
                  <div className="font-medium text-gray-900">{style.name}</div>
                  <div className="text-sm text-gray-600">{style.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Interests */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">What interests you?</h2>
          <p className="text-gray-600">Select all that apply to personalize your trip</p>
          
          <div className="grid grid-cols-2 gap-3">
            {interests.map((interest) => (
              <button
                key={interest}
                onClick={() => {
                  const newInterests = tripData.interests.includes(interest)
                    ? tripData.interests.filter(i => i !== interest)
                    : [...tripData.interests, interest];
                  setTripData({...tripData, interests: newInterests});
                }}
                className={`p-3 border-2 rounded-lg text-sm font-medium transition-colors ${
                  tripData.interests.includes(interest)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300"
            >
              Back
            </button>
            <button
              onClick={generateTrip}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  <span>Generate Trip</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Generated Plan */}
      {step === 4 && generatedPlan && (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{generatedPlan.title}</h2>
            <p className="text-gray-600">Your personalized itinerary is ready!</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span>{generatedPlan.destination}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span>{new Date(generatedPlan.startDate).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span>{generatedPlan.travelers} travelers</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-blue-600">💰</span>
                <span>${generatedPlan.budget} budget</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Activities</h3>
            {generatedPlan.activities.map((activity, index) => (
              <div key={activity.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">{activity.name}</h4>
                  <span className="text-sm text-gray-500">${activity.cost}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{activity.duration} min</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{activity.location.address}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={saveTripPlan}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center space-x-2"
            >
              <Save className="h-5 w-5" />
              <span>Save Plan</span>
            </button>
            <button
              onClick={shareTrip}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center space-x-2"
            >
              <Share2 className="h-5 w-5" />
              <span>Share</span>
            </button>
          </div>

          <button
            onClick={() => {
              setStep(1);
              setGeneratedPlan(null);
              setTripData({
                destination: '',
                startDate: '',
                endDate: '',
                travelers: 1,
                budget: 500,
                style: 'balanced',
                interests: []
              });
            }}
            className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300"
          >
            Plan Another Trip
          </button>
        </div>
      )}
    </div>
  );
};