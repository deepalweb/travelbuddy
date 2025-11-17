import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './Card'
import { Button } from './Button'
import { useConfig } from '../contexts/ConfigContext'
import { useAuth } from '../contexts/AuthContext'
import { Sparkles, MapPin, Clock, X, Users, DollarSign, Heart, Camera, Utensils, Mountain, Building, Waves, TreePine, Calendar, Banknote } from 'lucide-react'

interface AITripGeneratorProps {
  onTripGenerated: (trip: any) => void
  onClose: () => void
  selectedPlaces?: any[]
}

export const AITripGenerator: React.FC<AITripGeneratorProps> = ({ onTripGenerated, onClose, selectedPlaces = [] }) => {
  const { config } = useConfig()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    destination: selectedPlaces.length > 0 ? selectedPlaces[0].location.city + ', ' + selectedPlaces[0].location.country : '',
    duration: '',
    travelers: '1',
    budget: 'medium',
    travelStyle: 'balanced',
    interests: [] as string[],
    currency: 'USD',
    startDate: '',
    endDate: ''
  })
  const [generating, setGenerating] = useState(false)

  const generateTrip = async () => {
    if (!formData.destination || !formData.duration) {
      alert('Please fill in destination and duration')
      return
    }

    setGenerating(true)
    try {
      const apiUrl = config?.apiBaseUrl || 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net'
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      // Add authentication headers
      const demoToken = localStorage.getItem('demo_token')
      if (demoToken) {
        headers['Authorization'] = `Bearer ${demoToken}`
      }
      if (user?.id) {
        headers['x-user-id'] = user.id
      }
      
      const response = await fetch(`${apiUrl}/api/ai-trips/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          destination: formData.destination,
          duration: formData.duration,
          travelers: formData.travelers,
          budget: formData.budget,
          travelStyle: formData.travelStyle,
          interests: formData.interests,
          currency: formData.currency,
          startDate: formData.startDate,
          selectedPlaces: selectedPlaces
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        
        if (response.status === 429 && errorData.upgradeRequired) {
          alert(`Upgrade required: ${errorData.error}. Please upgrade to ${errorData.nextTier} plan to continue.`)
          return
        }
        
        if (response.status === 401 && errorData.upgradeRequired) {
          alert('Please log in or upgrade your account to use AI trip generation.')
          return
        }
        
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const tripData = await response.json()
      onTripGenerated(tripData)
    } catch (error) {
      console.error('Failed to generate trip:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate trip'
      
      if (errorMessage.includes('not configured')) {
        alert('Service temporarily unavailable. Please try again later or contact support.')
      } else if (errorMessage.includes('Network')) {
        alert('Network error. Please check your connection and try again.')
      } else {
        alert(`Failed to generate trip: ${errorMessage}`)
      }
    } finally {
      setGenerating(false)
    }
  }

  const interestOptions = [
    { id: 'culture', label: 'Culture & Museums', icon: Building },
    { id: 'food', label: 'Food & Dining', icon: Utensils },
    { id: 'nature', label: 'Nature & Outdoors', icon: TreePine },
    { id: 'adventure', label: 'Adventure Sports', icon: Mountain },
    { id: 'photography', label: 'Photography', icon: Camera },
    { id: 'beaches', label: 'Beaches & Coast', icon: Waves },
    { id: 'nightlife', label: 'Nightlife & Entertainment', icon: Sparkles },
    { id: 'wellness', label: 'Wellness & Relaxation', icon: Heart }
  ]

  const toggleInterest = (interestId: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }))
  }

  return (
    <Card className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center text-2xl font-bold">
            <Sparkles className="w-6 h-6 mr-3" />
            AI Trip Generator
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="bg-white/20 border-white/30 text-white hover:bg-white/30 rounded-full w-8 h-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-blue-100 mt-2">Let AI create your perfect personalized itinerary</p>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        {selectedPlaces.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Selected Places from Explore</h3>
            <div className="flex flex-wrap gap-2">
              {selectedPlaces.map((place, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                  {place.name}
                </span>
              ))}
            </div>
            <p className="text-sm text-blue-700 mt-2">
              These places will be included in your trip itinerary
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Destination
            </label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              placeholder="e.g., Paris, Tokyo, New York"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Duration
            </label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">Select duration</option>
              <option value="1 day">1 Day</option>
              <option value="2 days">2 Days</option>
              <option value="3 days">3 Days</option>
              <option value="4 days">4 Days</option>
              <option value="5 days">5 Days</option>
              <option value="1 week">1 Week</option>
              <option value="10 days">10 Days</option>
              <option value="2 weeks">2 Weeks</option>
            </select>
          </div>
        </div>



        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Number of Travelers
            </label>
            <select
              value={formData.travelers}
              onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="1">Solo (1 person)</option>
              <option value="2">Couple (2 people)</option>
              <option value="3-4">Small Group (3-4 people)</option>
              <option value="5+">Large Group (5+ people)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Banknote className="w-4 h-4 inline mr-1" />
              Currency
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="AUD">AUD (A$)</option>
              <option value="CAD">CAD (C$)</option>
              <option value="CHF">CHF (Fr)</option>
              <option value="CNY">CNY (¥)</option>
              <option value="INR">INR (₹)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Budget Range
            </label>
            <select
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="low">Budget ($300-600)</option>
              <option value="medium">Medium ($600-1200)</option>
              <option value="high">Luxury ($1200+)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Travel Style
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { id: 'relaxed', label: 'Relaxed', desc: 'Slow pace, plenty of rest' },
              { id: 'balanced', label: 'Balanced', desc: 'Mix of activities and downtime' },
              { id: 'packed', label: 'Action-Packed', desc: 'Maximum activities and sights' }
            ].map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => setFormData({ ...formData, travelStyle: style.id })}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  formData.travelStyle === style.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="font-medium">{style.label}</div>
                <div className="text-sm text-gray-500 mt-1">{style.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Interests & Activities
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {interestOptions.map((interest) => {
              const IconComponent = interest.icon
              const isSelected = formData.interests.includes(interest.id)
              return (
                <button
                  key={interest.id}
                  type="button"
                  onClick={() => toggleInterest(interest.id)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <IconComponent className="w-5 h-5 mx-auto mb-2" />
                  <div className="text-xs font-medium">{interest.label}</div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <Button
            type="button"
            onClick={onClose}
            variant="outline"
            className="flex-1 py-3 rounded-xl border-2"
          >
            Cancel
          </Button>
          <Button 
            onClick={generateTrip} 
            disabled={generating || !formData.destination || !formData.duration}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {generating ? 'Creating Your Perfect Trip...' : 'Generate AI Trip'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
