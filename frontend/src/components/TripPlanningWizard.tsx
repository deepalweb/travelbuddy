import React, { useState } from 'react'
import { MapPin, Calendar, Users, DollarSign, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from './Button'
import { Card, CardContent } from './Card'

interface TripPlanningWizardProps {
  onComplete: (tripData: any) => void
  isOpen: boolean
  onClose: () => void
}

const sriLankanRegions = [
  { id: 'western', name: 'Western Province', cities: ['Colombo', 'Negombo', 'Kalutara'] },
  { id: 'central', name: 'Central Province', cities: ['Kandy', 'Nuwara Eliya', 'Matale'] },
  { id: 'southern', name: 'Southern Province', cities: ['Galle', 'Mirissa', 'Unawatuna'] },
  { id: 'uva', name: 'Uva Province', cities: ['Ella', 'Badulla', 'Bandarawela'] },
  { id: 'north-central', name: 'North Central', cities: ['Sigiriya', 'Anuradhapura', 'Polonnaruwa'] }
]

const travelStyles = [
  { id: 'cultural', name: 'Cultural Explorer', desc: 'Temples, heritage sites, local traditions' },
  { id: 'nature', name: 'Nature Lover', desc: 'National parks, waterfalls, wildlife' },
  { id: 'beach', name: 'Beach Relaxer', desc: 'Coastal towns, water sports, sunset views' },
  { id: 'adventure', name: 'Adventure Seeker', desc: 'Hiking, surfing, train rides' }
]

export const TripPlanningWizard: React.FC<TripPlanningWizardProps> = ({
  onComplete,
  isOpen,
  onClose
}) => {
  const [step, setStep] = useState(1)
  const [tripData, setTripData] = useState({
    destination: '',
    duration: '',
    travelers: '',
    budget: '',
    style: '',
    interests: []
  })

  if (!isOpen) return null

  const handleNext = () => {
    if (step < 4) setStep(step + 1)
    else {
      onComplete(tripData)
      onClose()
    }
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Plan Your Sri Lankan Adventure</h2>
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    i <= step ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step 1: Destination */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Where would you like to explore?</h3>
                <p className="text-gray-600">Choose your preferred region in Sri Lanka</p>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {sriLankanRegions.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => setTripData(prev => ({ ...prev, destination: region.name }))}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      tripData.destination === region.name
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{region.name}</div>
                    <div className="text-sm text-gray-500">{region.cities.join(', ')}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Duration & Travelers */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <Calendar className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Trip Details</h3>
                <p className="text-gray-600">How long and with how many people?</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['3-5 days', '1 week', '2 weeks', '1 month'].map((duration) => (
                      <button
                        key={duration}
                        onClick={() => setTripData(prev => ({ ...prev, duration }))}
                        className={`p-3 rounded-lg border text-sm transition-colors ${
                          tripData.duration === duration
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {duration}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Travelers</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Solo', '2 people', '3-5 people', '6+ people'].map((travelers) => (
                      <button
                        key={travelers}
                        onClick={() => setTripData(prev => ({ ...prev, travelers }))}
                        className={`p-3 rounded-lg border text-sm transition-colors ${
                          tripData.travelers === travelers
                            ? 'bg-blue-50 border-blue-200 text-blue-700'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {travelers}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Budget */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <DollarSign className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">What's your budget?</h3>
                <p className="text-gray-600">Per person for the entire trip</p>
              </div>
              
              <div className="space-y-3">
                {[
                  { id: 'budget', label: 'Budget', range: 'LKR 50,000 - 100,000', usd: '$150 - $300' },
                  { id: 'mid', label: 'Mid-range', range: 'LKR 100,000 - 200,000', usd: '$300 - $600' },
                  { id: 'luxury', label: 'Luxury', range: 'LKR 200,000+', usd: '$600+' }
                ].map((budget) => (
                  <button
                    key={budget.id}
                    onClick={() => setTripData(prev => ({ ...prev, budget: budget.id }))}
                    className={`w-full p-4 rounded-lg border text-left transition-colors ${
                      tripData.budget === budget.id
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{budget.label}</div>
                    <div className="text-sm text-gray-500">{budget.range} ({budget.usd})</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Travel Style */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <Users className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">What's your travel style?</h3>
                <p className="text-gray-600">Choose what interests you most</p>
              </div>
              
              <div className="space-y-3">
                {travelStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setTripData(prev => ({ ...prev, style: style.id }))}
                    className={`w-full p-4 rounded-lg border text-left transition-colors ${
                      tripData.style === style.id
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{style.name}</div>
                    <div className="text-sm text-gray-500">{style.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              onClick={step === 1 ? onClose : handleBack}
              variant="outline"
              className="flex items-center"
            >
              {step === 1 ? 'Cancel' : (
                <>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </>
              )}
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={
                (step === 1 && !tripData.destination) ||
                (step === 2 && (!tripData.duration || !tripData.travelers)) ||
                (step === 3 && !tripData.budget) ||
                (step === 4 && !tripData.style)
              }
              className="flex items-center"
            >
              {step === 4 ? 'Generate Trip' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}