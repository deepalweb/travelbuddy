import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { MapPin, Clock, Euro, CheckCircle, Circle, Star, Navigation, Save, Calendar, Users, DollarSign, ArrowLeft, Download, Share2, Filter, RotateCcw, List, Map, FileText, BarChart3, Cloud, Edit3 } from 'lucide-react'
import { tripService } from '../services/tripService'

interface Trip {
  _id: string
  tripTitle: string
  destination: string
  duration: string
  introduction: string
  dailyPlans: DailyPlan[]
  conclusion: string
  totalEstimatedCost: string
  estimatedWalkingDistance: string
  createdAt: string
}

interface DailyPlan {
  day: number
  title: string
  activities: Activity[]
}

interface Activity {
  timeOfDay: string
  activityTitle: string
  description: string
  duration: string
  estimatedCost: string
  isVisited: boolean
  rating?: number
}

export const TripDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [showNotes, setShowNotes] = useState(false)
  const [tripNotes, setTripNotes] = useState('')
  const [showAnalytics, setShowAnalytics] = useState(false)

  useEffect(() => {
    if (id) {
      fetchTrip(id)
      // Load notes from localStorage
      const savedNotes = localStorage.getItem(`trip-notes-${id}`)
      if (savedNotes) setTripNotes(savedNotes)
    }
  }, [id])

  const fetchTrip = async (tripId: string) => {
    try {
      const trip = await tripService.getTripById(tripId)
      setTrip(trip as Trip)
    } catch (error) {
      console.error('Failed to fetch trip:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleActivityStatus = async (dayIndex: number, activityIndex: number) => {
    if (!trip || !id) return
    
    try {
      const currentStatus = trip.dailyPlans[dayIndex].activities[activityIndex].isVisited
      await tripService.updateActivityStatus(id, dayIndex, activityIndex, !currentStatus)
      
      // Update local state
      const updatedTrip = { ...trip }
      updatedTrip.dailyPlans[dayIndex].activities[activityIndex].isVisited = !currentStatus
      setTrip(updatedTrip)
    } catch (error) {
      console.error('Failed to update activity status:', error)
    }
  }

  const calculateStats = () => {
    if (!trip) return { total: 0, visited: 0, pending: 0 }
    
    let total = 0
    let visited = 0
    
    trip.dailyPlans.forEach(day => {
      day.activities.forEach(activity => {
        total++
        if (activity.isVisited) visited++
      })
    })
    
    return { total, visited, pending: total - visited }
  }

  const openInGoogleMaps = () => {
    if (!trip) return
    
    const locations = trip.dailyPlans
      .flatMap(day => day.activities)
      .map(activity => activity.activityTitle)
      .join('|')
    
    const url = `https://www.google.com/maps/dir/?api=1&waypoints=${encodeURIComponent(locations)}`
    window.open(url, '_blank')
  }

  const saveTrip = async () => {
    if (!trip || !id) return
    
    try {
      await tripService.updateTrip(id, trip)
      // Save notes
      localStorage.setItem(`trip-notes-${id}`, tripNotes)
      alert('Trip saved successfully!')
    } catch (error) {
      console.error('Failed to save trip:', error)
      alert('Failed to save trip')
    }
  }

  const calculateAnalytics = () => {
    if (!trip) return null
    
    const totalActivities = trip.dailyPlans.reduce((acc, day) => acc + day.activities.length, 0)
    const completedActivities = trip.dailyPlans.reduce((acc, day) => 
      acc + day.activities.filter(activity => activity.isVisited).length, 0
    )
    const totalCost = trip.dailyPlans.reduce((acc, day) => 
      acc + day.activities.reduce((dayAcc, activity) => 
        dayAcc + (parseFloat(activity.estimatedCost.replace(/[^0-9.]/g, '')) || 0), 0
      ), 0
    )
    const totalDuration = trip.dailyPlans.reduce((acc, day) => 
      acc + day.activities.reduce((dayAcc, activity) => 
        dayAcc + (parseFloat(activity.duration.replace(/[^0-9.]/g, '')) || 0), 0
      ), 0
    )
    
    return {
      totalActivities,
      completedActivities,
      completionRate: Math.round((completedActivities / totalActivities) * 100),
      totalCost: totalCost.toFixed(2),
      totalDuration: totalDuration.toFixed(1),
      daysCompleted: trip.dailyPlans.filter(day => 
        day.activities.every(activity => activity.isVisited)
      ).length
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip Not Found</h2>
          <Button onClick={() => navigate('/trips')}>Back to Trips</Button>
        </div>
      </div>
    )
  }

  const stats = calculateStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Tier 1: Trip Summary Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 to-blue-700 text-white">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=1920&h=600&fit=crop)`,
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 py-12">
          <Button 
            variant="outline" 
            onClick={() => navigate('/trips')} 
            className="mb-6 bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Trips
          </Button>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">{trip.tripTitle}</h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center bg-white/20 rounded-lg px-3 py-2">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{trip.destination}</span>
                </div>
                <div className="flex items-center bg-white/20 rounded-lg px-3 py-2">
                  <Clock className="w-4 h-4 mr-2" />
                  <span>{trip.duration}</span>
                </div>
                <div className="flex items-center bg-white/20 rounded-lg px-3 py-2">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <span>{trip.totalEstimatedCost}</span>
                </div>
                <div className="flex items-center bg-white/20 rounded-lg px-3 py-2">
                  <Navigation className="w-4 h-4 mr-2" />
                  <span>{trip.estimatedWalkingDistance}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Trip Progress</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>{stats.total} Activities</span>
                  <span>{stats.visited} Completed</span>
                </div>
                <div className="w-full bg-white/30 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${stats.total > 0 ? (stats.visited / stats.total) * 100 : 0}%` }}
                  />
                </div>
                <div className="text-xs opacity-90">
                  {Math.round(stats.total > 0 ? (stats.visited / stats.total) * 100 : 0)}% Complete
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Tier 2: Trip Overview Card */}
        <Card className="mb-8 bg-gradient-to-r from-teal-50 to-blue-50 border-0 shadow-lg">
          <CardContent className="p-8">
            <div className="flex items-start space-x-6">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <MapPin className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  🌍 Welcome to {trip.destination}!
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center text-gray-700">
                    <span className="text-lg mr-2">🏃</span>
                    <div>
                      <div className="font-medium">Your Pace</div>
                      <div className="text-sm text-gray-600">Balanced Adventure</div>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <span className="text-lg mr-2">💰</span>
                    <div>
                      <div className="font-medium">Budget</div>
                      <div className="text-sm text-gray-600">Medium range</div>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <span className="text-lg mr-2">👥</span>
                    <div>
                      <div className="font-medium">Group</div>
                      <div className="text-sm text-gray-600">Solo traveler</div>
                    </div>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <span className="text-lg mr-2">🎯</span>
                    <div>
                      <div className="font-medium">Focus</div>
                      <div className="text-sm text-gray-600">Exploration</div>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {trip.introduction}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Action Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex flex-wrap gap-3">
              <Button onClick={saveTrip} variant="outline" className="flex items-center">
                <Save className="w-4 h-4 mr-2" />
                Save Trip
              </Button>
              <Button onClick={openInGoogleMaps} className="flex items-center">
                <Navigation className="w-4 h-4 mr-2" />
                Open in Google Maps
              </Button>
              <Button 
                onClick={() => setShowNotes(!showNotes)} 
                variant={showNotes ? 'default' : 'outline'} 
                className="flex items-center"
              >
                <FileText className="w-4 h-4 mr-2" />
                Trip Notes
              </Button>
              <Button 
                onClick={() => setShowAnalytics(!showAnalytics)} 
                variant={showAnalytics ? 'default' : 'outline'} 
                className="flex items-center"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </div>
            
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex items-center"
              >
                <List className="w-4 h-4 mr-1" />
                List
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('map')}
                className="flex items-center"
              >
                <Map className="w-4 h-4 mr-1" />
                Map
              </Button>
            </div>
          </div>
        </div>

        {/* Trip Notes Section */}
        {showNotes && (
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Edit3 className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Trip Journal & Notes</h3>
              </div>
              <textarea
                value={tripNotes}
                onChange={(e) => setTripNotes(e.target.value)}
                placeholder="Write your travel thoughts, experiences, reminders, or tips here..."
                className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-sm text-gray-500 mt-2">💡 Your notes are automatically saved when you save the trip</p>
            </CardContent>
          </Card>
        )}

        {/* Trip Analytics */}
        {showAnalytics && (() => {
          const analytics = calculateAnalytics()
          return analytics ? (
            <Card className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center mb-6">
                  <BarChart3 className="w-5 h-5 text-purple-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Trip Analytics</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{analytics.completionRate}%</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">${analytics.totalCost}</div>
                    <div className="text-sm text-gray-600">Est. Budget</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">{analytics.totalDuration}h</div>
                    <div className="text-sm text-gray-600">Total Time</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{analytics.daysCompleted}</div>
                    <div className="text-sm text-gray-600">Days Done</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null
        })()}

        {/* Map View */}
        {viewMode === 'map' && (
          <Card className="mb-8 bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Map className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Interactive Route Map</h3>
              </div>
              <div className="bg-white rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
                <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-700 mb-2">Interactive Map Coming Soon</h4>
                <p className="text-gray-500 mb-4">Color-coded markers by day, route optimization, and distance calculations</p>
                <Button onClick={openInGoogleMaps} className="flex items-center mx-auto">
                  <Navigation className="w-4 h-4 mr-2" />
                  Open in Google Maps
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Daily Itinerary Timeline */}
        <div className={`space-y-8 ${viewMode === 'map' ? 'hidden' : ''}`}>
          {trip.dailyPlans.map((day, dayIndex) => (
            <div key={day.day} className="relative">
              {/* Enhanced Day Header */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                      {day.day}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">Day {day.day}</h3>
                      <p className="text-gray-600">{day.title}</p>
                    </div>
                  </div>
                  
                  {/* Weather Widget */}
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-50 rounded-lg p-3 flex items-center space-x-2">
                      <Cloud className="w-5 h-5 text-blue-600" />
                      <div className="text-sm">
                        <div className="font-semibold text-gray-900">24°C</div>
                        <div className="text-gray-500">Sunny</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Timeline */}
              <div className="relative ml-6">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-400 to-blue-500"></div>
                
                <div className="space-y-6">
                  {day.activities.map((activity, activityIndex) => (
                    <div key={activityIndex} className="relative">
                      {/* Timeline dot */}
                      <div className={`absolute -left-2 w-4 h-4 rounded-full border-2 border-white ${
                        activity.isVisited ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                      
                      {/* Activity Card */}
                      <Card className={`ml-8 transition-all duration-300 hover:shadow-lg ${
                        activity.isVisited ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                      }`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm font-medium">
                                  {activity.timeOfDay}
                                </span>
                                {activity.rating && (
                                  <div className="flex items-center bg-yellow-100 px-2 py-1 rounded-full">
                                    <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                                    <span className="text-sm font-medium text-yellow-700">{activity.rating}</span>
                                  </div>
                                )}
                              </div>
                              
                              <h4 className="text-xl font-bold text-gray-900 mb-2">{activity.activityTitle}</h4>
                              <p className="text-gray-700 mb-4 leading-relaxed">{activity.description}</p>
                              
                              <div className="flex flex-wrap gap-4 text-sm">
                                <div className="flex items-center text-gray-600">
                                  <Clock className="w-4 h-4 mr-1" />
                                  <span>{activity.duration}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <DollarSign className="w-4 h-4 mr-1" />
                                  <span>{activity.estimatedCost}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="ml-6 flex flex-col space-y-2">
                              <Button
                                variant={activity.isVisited ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleActivityStatus(dayIndex, activityIndex)}
                                className={activity.isVisited ? 'bg-green-600 hover:bg-green-700' : ''}
                              >
                                {activity.isVisited ? (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Visited
                                  </>
                                ) : (
                                  <>
                                    <Circle className="w-4 h-4 mr-2" />
                                    Mark Visited
                                  </>
                                )}
                              </Button>
                              <Button variant="ghost" size="sm" className="text-xs">
                                <Navigation className="w-3 h-3 mr-1" />
                                Map
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tier 4: Trip Highlights Recap */}
        <Card className="mt-12 bg-gradient-to-r from-purple-50 to-pink-50 border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                🎉 Trip Highlights Recap
              </h2>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                {trip.conclusion || `Your ${trip.destination} adventure offers the perfect blend of culture and exploration. From iconic landmarks to hidden local gems, this itinerary ensures you experience the best of what ${trip.destination} has to offer.`}
              </p>
              
              <div className="bg-white/60 rounded-2xl p-6 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Final Tips</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-teal-500 rounded-full mr-2"></span>
                    Download offline maps and translation apps
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    Keep copies of important documents
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    Stay flexible - embrace spontaneous moments!
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => navigate('/trips')} 
                className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                Create My Trip Like This →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}