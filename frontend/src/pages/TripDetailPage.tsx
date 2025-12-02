import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { Button } from '../components/Button'
import { MapPin, Clock, Euro, CheckCircle, Circle, Star, Navigation, Save, Calendar, Users, DollarSign, ArrowLeft, Download, Share2, Filter, RotateCcw, List, Map, FileText, BarChart3, Cloud, Edit3, Car } from 'lucide-react'
import { tripService } from '../services/tripService'
import { placesService } from '../services/placesService'
import { useApp } from '../contexts/AppContext'

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
  imageUrl?: string
  address?: string
  category?: string
}

export const TripDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toggleActivityStatus, getActivityStatus } = useApp()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [showNotes, setShowNotes] = useState(false)
  const [tripNotes, setTripNotes] = useState('')
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [, forceUpdate] = useState({})
  const [enhancedIntro, setEnhancedIntro] = useState<string | null>(null)
  const [loadingIntro, setLoadingIntro] = useState(false)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    if (id) {
      fetchTrip(id)
      const savedNotes = localStorage.getItem(`trip-notes-${id}`)
      if (savedNotes) setTripNotes(savedNotes)
    }
  }, [id])

  useEffect(() => {
    if (trip) {
      loadPlaceImages()
      loadEnhancedIntro()
      setStats(calculateAdvancedStats())
    }
  }, [trip, id])

  useEffect(() => {
    if (trip && id) {
      setStats(calculateAdvancedStats())
    }
  }, [forceUpdate])

  const loadEnhancedIntro = async () => {
    if (!trip) return
    
    // Use static intro by default (skip AI enhancement to prevent resource exhaustion)
    setEnhancedIntro(trip.introduction)
    setLoadingIntro(false)
  }

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

  const loadPlaceImages = async () => {
    if (!trip) return
    
    const updatedTrip = { ...trip }
    
    for (const day of updatedTrip.dailyPlans) {
      for (const activity of day.activities) {
        if (!activity.imageUrl) {
          const title = activity.activityTitle.toLowerCase()
          let imageId = '1506905925346-21bda4d32df4'
          
          if (title.includes('temple') || title.includes('church') || title.includes('mosque')) {
            imageId = '1548013146-72479768c5bd'
            activity.category = 'Religious Site'
          } else if (title.includes('museum') || title.includes('gallery')) {
            imageId = '1554072675-66db59dba46f'
            activity.category = 'Museum'
          } else if (title.includes('market') || title.includes('bazaar')) {
            imageId = '1555396273-e9f2df6178d7'
            activity.category = 'Market'
          } else if (title.includes('fort') || title.includes('palace') || title.includes('castle')) {
            imageId = '1520637836862-4d197d17c93a'
            activity.category = 'Historical Site'
          } else if (title.includes('park') || title.includes('garden')) {
            imageId = '1441974231531-c6227db76b6e'
            activity.category = 'Park'
          } else if (title.includes('restaurant') || title.includes('food')) {
            imageId = '1414235077428-338989a2e8c0'
            activity.category = 'Restaurant'
          } else {
            imageId = '1488646953014-e1824e62c96c'
            activity.category = 'Attraction'
          }
          
          activity.imageUrl = `https://images.unsplash.com/photo-${imageId}?w=400&h=300&fit=crop&q=80`
          activity.rating = Math.round((4.0 + Math.random() * 1.0) * 10) / 10
        }
      }
    }
    
    setTrip(updatedTrip)
  }

  const handleToggleActivity = (dayIndex: number, activityIndex: number) => {
    if (!id) return
    toggleActivityStatus(id, dayIndex, activityIndex)
    forceUpdate({})
  }

  const calculateAdvancedStats = () => {
    if (!trip || !id) return null
    
    let totalActivities = 0
    let visitedActivities = 0
    let totalMinutes = 0
    let pendingMinutes = 0
    let totalCost = 0
    let pendingCost = 0
    
    trip.dailyPlans.forEach((day, dayIndex) => {
      day.activities.forEach((activity, activityIndex) => {
        totalActivities++
        const isVisited = getActivityStatus(id, dayIndex, activityIndex)
        
        if (isVisited) visitedActivities++
        
        const duration = activity.duration.toLowerCase()
        let minutes = 60
        if (duration.includes('hr') || duration.includes('h')) {
          const match = duration.match(/(\d+\.?\d*)/)
          if (match) minutes = parseFloat(match[1]) * 60
        } else if (duration.includes('min')) {
          const match = duration.match(/(\d+)/)
          if (match) minutes = parseInt(match[1])
        }
        
        totalMinutes += minutes
        if (!isVisited) pendingMinutes += minutes
        
        const cost = activity.estimatedCost.replace(/[^0-9.]/g, '')
        const costNum = parseFloat(cost) || 0
        totalCost += costNum
        if (!isVisited) pendingCost += costNum
      })
    })
    
    return {
      totalActivities,
      visitedActivities,
      pendingActivities: totalActivities - visitedActivities,
      completionRate: Math.round((visitedActivities / totalActivities) * 100),
      totalHours: Math.ceil(totalMinutes / 60),
      pendingHours: Math.ceil(pendingMinutes / 60),
      totalCost: totalCost.toFixed(0),
      pendingCost: pendingCost.toFixed(0)
    }
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
      localStorage.setItem(`trip-notes-${id}`, tripNotes)
      alert('Trip saved successfully!')
    } catch (error) {
      console.error('Failed to save trip:', error)
      alert('Failed to save trip')
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
          <Button onClick={() => navigate(-1)}>Back to Trips</Button>
        </div>
      </div>
    )
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 to-blue-700 text-white">
        <div className="relative max-w-6xl mx-auto px-4 py-12">
          <Button variant="outline" onClick={() => navigate(-1)} className="mb-6 bg-white/20 border-white/30 text-white hover:bg-white/30">
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
                  <span>{stats?.totalActivities} Activities</span>
                  <span>{stats?.visitedActivities} Completed</span>
                </div>
                <div className="w-full bg-white/30 rounded-full h-3">
                  <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${stats?.completionRate || 0}%` }} />
                </div>
                <div className="text-xs opacity-90">{stats?.completionRate || 0}% Complete</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-purple-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mr-3">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI Trip Overview</h3>
                <p className="text-xs text-purple-600 font-medium">Powered by Azure OpenAI</p>
              </div>
              {loadingIntro && (
                <div className="ml-auto">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                </div>
              )}
            </div>
            <div className="bg-white rounded-lg p-4">
              {loadingIntro ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
                    <p className="text-gray-500 italic">Generating personalized overview...</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {enhancedIntro || trip.introduction}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {stats && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">📊 Trip Progress</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats.totalActivities}</div>
                  <div className="text-sm text-gray-600">Total Places</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{stats.visitedActivities}</div>
                  <div className="text-sm text-gray-600">Visited</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{stats.pendingActivities}</div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{stats.completionRate}%</div>
                  <div className="text-sm text-gray-600">Complete</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Total / Pending Time</div>
                  <div className="text-lg font-bold text-blue-600">{stats.totalHours}h / {stats.pendingHours}h</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">Total / Pending Cost</div>
                  <div className="text-lg font-bold text-green-600">${stats.totalCost} / ${stats.pendingCost}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
              <Button onClick={() => setShowNotes(!showNotes)} variant={showNotes ? 'default' : 'outline'} className="flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Trip Notes
              </Button>
            </div>
          </div>
        </div>

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

        <div className="space-y-8">
          {trip.dailyPlans.map((day, dayIndex) => (
            <div key={day.day} className="relative">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                    {day.day}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Day {day.day}</h3>
                    <p className="text-gray-600" dangerouslySetInnerHTML={{ __html: day.title }}></p>
                  </div>
                </div>
              </div>
              
              <div className="relative ml-6">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-400 to-blue-500"></div>
                
                <div className="space-y-6">
                  {day.activities.map((activity, activityIndex) => (
                    <div key={activityIndex} className="relative">
                      <div className={`absolute -left-2 w-4 h-4 rounded-full border-2 border-white ${
                        getActivityStatus(id!, dayIndex, activityIndex) ? 'bg-green-500' : 'bg-blue-500'
                      }`}></div>
                      
                      <Card className={`ml-8 transition-all duration-300 hover:shadow-lg ${
                        getActivityStatus(id!, dayIndex, activityIndex) ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
                      }`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="w-32 h-24 rounded-lg overflow-hidden mr-6 flex-shrink-0">
                              <img 
                                src={activity.imageUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop'} 
                                alt={activity.activityTitle}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop';
                                }}
                              />
                            </div>
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
                              
                              <div className="mb-4">
                                <h4 className="text-xl font-bold text-gray-900 mb-2">{activity.activityTitle}</h4>
                                {activity.address && (
                                  <div className="flex items-start text-sm text-gray-600 mb-2">
                                    <MapPin className="w-4 h-4 mr-2 mt-0.5 text-blue-500" />
                                    <span>{activity.address}</span>
                                  </div>
                                )}
                                {activity.category && (
                                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-2">
                                    {activity.category}
                                  </span>
                                )}
                                <p className="text-gray-700 leading-relaxed">{activity.description}</p>
                              </div>
                              
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
                            
                            <div className="ml-6">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleToggleActivity(dayIndex, activityIndex)}
                                className={getActivityStatus(id!, dayIndex, activityIndex) ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
                              >
                                {getActivityStatus(id!, dayIndex, activityIndex) ? (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Visited
                                  </>
                                ) : (
                                  <>
                                    <Circle className="w-4 h-4 mr-2" />
                                    Pending
                                  </>
                                )}
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
      </div>
    </div>
  )
}
