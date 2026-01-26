import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { MapPin, Calendar, Clock, Trash2, Eye, Sparkles, DollarSign, Navigation, Star, Users, Plane, Map, List } from 'lucide-react'
import { tripService } from '../services/tripService'
import { AITripGenerator } from '../components/AITripGenerator'
import { TripForm } from '../components/TripForm'

import { DragDropItinerary } from '../components/DragDropItinerary'

interface Trip {
  _id: string
  tripTitle: string
  destination: string
  duration: string
  dailyPlans: any[]
  createdAt: string
  totalEstimatedCost?: string
  estimatedWalkingDistance?: string
}

export const TripPlanningPage: React.FC = () => {
  const { user } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [showTripForm, setShowTripForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedPlaces, setSelectedPlaces] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [generatedItinerary, setGeneratedItinerary] = useState<any>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchTrips()
    
    // Check for selected places from Explore page
    const storedPlaces = sessionStorage.getItem('selectedPlaces')
    if (storedPlaces) {
      const places = JSON.parse(storedPlaces)
      setSelectedPlaces(places)
      setShowAIGenerator(true)
      sessionStorage.removeItem('selectedPlaces') // Clear after use
    }
  }, [])

  const fetchTrips = async () => {
    try {
      setLoading(true)
      
      if (!user?.id) {
        console.log('No user ID available')
        setTrips([])
        return
      }
      
      const data = await tripService.getTrips(user.id)
      setTrips(Array.isArray(data) ? data : [])
      console.log(`✅ Loaded ${data.length} trips from backend`)
    } catch (error) {
      console.error('Failed to fetch trips:', error)
      setTrips([])
    } finally {
      setLoading(false)
    }
  }

  const deleteTrip = async (tripId: string) => {
    if (!confirm('Delete this trip?')) return
    
    try {
      const success = await tripService.deleteTrip(tripId)
      if (success) {
        await fetchTrips()
      } else {
        alert('Failed to delete trip')
      }
    } catch (error) {
      console.error('Failed to delete trip:', error)
      alert('Error deleting trip: ' + error.message)
    }
  }

  const getProgressPercentage = (trip: Trip) => {
    if (!trip.dailyPlans || trip.dailyPlans.length === 0) return 0
    const totalActivities = trip.dailyPlans.reduce((acc, day) => acc + (day.activities?.length || 0), 0)
    const completedActivities = trip.dailyPlans.reduce((acc, day) => 
      acc + (day.activities?.filter((activity: any) => activity.isVisited)?.length || 0), 0
    )
    return totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&h=1080&fit=crop)',
          }}
        />
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <Plane className="w-12 h-12" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Your Travel Adventures
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Create personalized itineraries with AI-powered trip planning. Drag & drop to organize, visualize on maps.
            </p>
            
            <div className="flex justify-center space-x-2 mb-8">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
                className="flex items-center bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
              >
                <List className="w-4 h-4 mr-2" />
                List View
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                onClick={() => setViewMode('map')}
                className="flex items-center bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
              >
                <Map className="w-4 h-4 mr-2" />
                Map View
              </Button>
            </div>
            <div className="flex justify-center">
              <Button 
                onClick={() => setShowAIGenerator(true)}
                className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Create Trip Plan
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{trips.length}</h3>
            <p className="text-gray-600">Total Trips</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">
              {Math.round(trips.reduce((acc, trip) => acc + getProgressPercentage(trip), 0) / (trips.length || 1))}%
            </h3>
            <p className="text-gray-600">Avg Progress</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">AI</h3>
            <p className="text-gray-600">Powered</p>
          </div>
        </div>
      </div>

      {/* AI Generator Modal */}
      {showAIGenerator && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <AITripGenerator
            selectedPlaces={selectedPlaces}
            onTripGenerated={async (trip) => {
              try {
                if (!user?.id) {
                  console.error('No user ID available')
                  alert('Please log in to save trips')
                  return
                }
                const savedTrip = await tripService.createTrip({ ...trip, userId: user.id })
                if (savedTrip) {
                  setShowAIGenerator(false)
                  setSelectedPlaces([])
                  fetchTrips()
                } else {
                  console.error('Failed to save trip - no response')
                  alert('Failed to save trip. Please try again.')
                }
              } catch (error) {
                console.error('Failed to save AI trip:', error)
                alert('Failed to save trip. Please try again.')
              }
            }}
            onClose={() => {
              setShowAIGenerator(false)
              setSelectedPlaces([])
            }}
          />
        </div>
      )}

      {/* Manual Trip Form Modal */}
      {showTripForm && (
        <TripForm
          onSubmit={async (tripData) => {
            try {
              await tripService.createTrip({ ...tripData, userId: user?.id })
              setShowTripForm(false)
              fetchTrips()
            } catch (error) {
              console.error('Failed to save trip:', error)
            }
          }}
          onClose={() => setShowTripForm(false)}
        />
      )}

      {/* Trips Grid */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : trips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {trips.map((trip) => {
              const progress = getProgressPercentage(trip)
              return (
                <Card key={trip._id} className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 bg-white rounded-2xl border-0 shadow-lg overflow-hidden">
                  <div className="relative">
                    <div className="absolute top-4 right-4 z-10">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteTrip(trip._id)
                        }}
                        className="bg-white/90 backdrop-blur-sm border-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full w-8 h-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32 flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {trip.tripTitle}
                    </h3>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-3 text-blue-500" />
                        <span className="font-medium">{trip.destination}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-3 text-green-500" />
                        <span>{trip.duration}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-3 text-purple-500" />
                        <span>{new Date(trip.createdAt).toLocaleDateString()}</span>
                      </div>
                      {trip.totalEstimatedCost && (
                        <div className="flex items-center text-gray-600">
                          <DollarSign className="w-4 h-4 mr-3 text-yellow-500" />
                          <span>{trip.totalEstimatedCost}</span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        <span className="text-sm text-gray-500">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <Button 
                      onClick={() => navigate(`/trips/${trip._id}`)}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl py-3 font-medium transition-all duration-300 transform hover:scale-105"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Trip Details
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <Plane className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready for Your Next Adventure?</h3>
            <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
              Let AI create the perfect itinerary tailored to your preferences and budget.
            </p>
            <div className="flex justify-center">
              <Button 
                onClick={() => setShowAIGenerator(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-full text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Create Trip Plan
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
