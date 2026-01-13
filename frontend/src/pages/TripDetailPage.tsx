import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../components/Card'
import { Button } from '../components/Button'
import { MapPin, Clock, CheckCircle, Circle, Star, Navigation, Save, DollarSign, ArrowLeft, FileText, Edit3, ArrowUp, ArrowDown, GripVertical, Trash2, Info, Utensils, AlertCircle, Car } from 'lucide-react'
import { tripService } from '../services/tripService'
import { useApp } from '../contexts/AppContext'

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
  transportation?: string
  transportCost?: string
  transportDuration?: string
  bestTimeToVisit?: string
  difficulty?: 'Easy' | 'Moderate' | 'Hard'
  tips?: string[]
  foodRecommendations?: string[]
}

interface DailyPlan {
  day: number
  title: string
  activities: Activity[]
}

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

export const TripDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toggleActivityStatus, getActivityStatus } = useApp()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNotes, setShowNotes] = useState(false)
  const [tripNotes, setTripNotes] = useState('')
  const [, forceUpdate] = useState({})
  const [stats, setStats] = useState<any>(null)
  const [isEditingLocation, setIsEditingLocation] = useState(false)
  const [newDestination, setNewDestination] = useState('')
  const [draggedItem, setDraggedItem] = useState<{dayIndex: number, activityIndex: number} | null>(null)
  const [expandedActivity, setExpandedActivity] = useState<{dayIndex: number, activityIndex: number} | null>(null)

  useEffect(() => {
    if (id) {
      fetchTrip(id)
      const savedNotes = localStorage.getItem(`trip-notes-${id}`)
      if (savedNotes) setTripNotes(savedNotes)
    }
  }, [id])

  useEffect(() => {
    if (trip && id) {
      loadPlaceImages()
      setStats(calculateAdvancedStats())
    }
  }, [trip, id, forceUpdate])

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

  const loadPlaceImages = () => {
    if (!trip) return
    
    const updatedTrip = { ...trip }
    
    for (const day of updatedTrip.dailyPlans) {
      for (const activity of day.activities) {
        if (!activity.imageUrl) {
          const title = activity.activityTitle.toLowerCase()
          let imageId = '1506905925346-21bda4d32df4'
          
          if (title.includes('temple') || title.includes('church')) {
            imageId = '1548013146-72479768c5bd'
            activity.category = 'Religious Site'
          } else if (title.includes('museum')) {
            imageId = '1554072675-66db59dba46f'
            activity.category = 'Museum'
          } else if (title.includes('market')) {
            imageId = '1555396273-e9f2df6178d7'
            activity.category = 'Market'
          } else if (title.includes('fort') || title.includes('palace')) {
            imageId = '1520637836862-4d197d17c93a'
            activity.category = 'Historical Site'
          } else if (title.includes('park') || title.includes('garden')) {
            imageId = '1441974231531-c6227db76b6e'
            activity.category = 'Park'
          } else if (title.includes('restaurant') || title.includes('food')) {
            imageId = '1414235077428-338989a2e8c0'
            activity.category = 'Restaurant'
          }
          
          activity.imageUrl = `https://images.unsplash.com/photo-${imageId}?w=400&h=300&fit=crop&q=80`
          activity.rating = Math.round((4.0 + Math.random() * 1.0) * 10) / 10
        }
      }
    }
    
    setTrip(updatedTrip)
  }

  const calculateAdvancedStats = () => {
    if (!trip || !id) return null
    
    let totalActivities = 0
    let visitedActivities = 0
    let totalCost = 0
    let pendingCost = 0
    
    trip.dailyPlans.forEach((day, dayIndex) => {
      day.activities.forEach((activity, activityIndex) => {
        totalActivities++
        const isVisited = getActivityStatus(id, dayIndex, activityIndex)
        if (isVisited) visitedActivities++
        
        const cost = parseFloat(activity.estimatedCost.replace(/[^0-9.]/g, '')) || 0
        totalCost += cost
        if (!isVisited) pendingCost += cost
      })
    })
    
    return {
      totalActivities,
      visitedActivities,
      pendingActivities: totalActivities - visitedActivities,
      completionRate: Math.round((visitedActivities / totalActivities) * 100),
      totalCost: totalCost.toFixed(0),
      pendingCost: pendingCost.toFixed(0)
    }
  }

  const saveTrip = async () => {
    if (!trip || !id) return
    try {
      await tripService.updateTrip(id, trip)
      localStorage.setItem(`trip-notes-${id}`, tripNotes)
      alert('Trip saved successfully!')
    } catch (error) {
      alert('Failed to save trip')
    }
  }

  const saveLocationChange = async () => {
    if (!trip || !id || !newDestination.trim()) return
    try {
      const updatedTrip = { ...trip, destination: newDestination.trim() }
      await tripService.updateTrip(id, updatedTrip)
      setTrip(updatedTrip)
      setIsEditingLocation(false)
      alert('Location updated!')
    } catch (error) {
      alert('Failed to update location')
    }
  }

  const moveActivity = async (dayIndex: number, activityIndex: number, direction: 'up' | 'down') => {
    if (!trip || !id) return
    const updatedTrip = { ...trip }
    const activities = updatedTrip.dailyPlans[dayIndex].activities
    const newIndex = direction === 'up' ? activityIndex - 1 : activityIndex + 1
    if (newIndex < 0 || newIndex >= activities.length) return
    
    [activities[activityIndex], activities[newIndex]] = [activities[newIndex], activities[activityIndex]]
    
    try {
      await tripService.updateTrip(id, updatedTrip)
      setTrip(updatedTrip)
    } catch (error) {
      alert('Failed to reorder')
    }
  }

  const handleDragStart = (dayIndex: number, activityIndex: number) => {
    setDraggedItem({ dayIndex, activityIndex })
  }

  const handleDrop = async (dayIndex: number, activityIndex: number) => {
    if (!draggedItem || !trip || !id || draggedItem.dayIndex !== dayIndex || draggedItem.activityIndex === activityIndex) return
    
    const updatedTrip = { ...trip }
    const activities = updatedTrip.dailyPlans[dayIndex].activities
    const [movedItem] = activities.splice(draggedItem.activityIndex, 1)
    activities.splice(activityIndex, 0, movedItem)
    
    try {
      await tripService.updateTrip(id, updatedTrip)
      setTrip(updatedTrip)
      setDraggedItem(null)
    } catch (error) {}
  }

  const deleteActivity = async (dayIndex: number, activityIndex: number) => {
    if (!trip || !id || !confirm('Remove this activity?')) return
    
    const updatedTrip = { ...trip }
    updatedTrip.dailyPlans[dayIndex].activities.splice(activityIndex, 1)
    
    try {
      await tripService.updateTrip(id, updatedTrip)
      setTrip(updatedTrip)
    } catch (error) {
      alert('Failed to delete')
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div></div>
  if (!trip) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><h2 className="text-2xl font-bold mb-2">Trip Not Found</h2><Button onClick={() => navigate(-1)}>Back</Button></div></div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 to-blue-700 text-white">
        <div className="relative max-w-6xl mx-auto px-4 py-12">
          <Button variant="outline" onClick={() => navigate(-1)} className="mb-6 bg-white/20 border-white/30 text-white hover:bg-white/30">
            <ArrowLeft className="w-4 h-4 mr-2" />Back
          </Button>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">{trip.tripTitle}</h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center bg-white/20 rounded-lg px-3 py-2 relative group">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>{trip.destination}</span>
                  <button onClick={() => { setNewDestination(trip.destination); setIsEditingLocation(true) }} className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center bg-white/20 rounded-lg px-3 py-2">
                  <Clock className="w-4 h-4 mr-2" /><span>{trip.duration}</span>
                </div>
                <div className="flex items-center bg-white/20 rounded-lg px-3 py-2">
                  <DollarSign className="w-4 h-4 mr-2" /><span>{trip.totalEstimatedCost}</span>
                </div>
                <div className="flex items-center bg-white/20 rounded-lg px-3 py-2">
                  <Navigation className="w-4 h-4 mr-2" /><span>{trip.estimatedWalkingDistance}</span>
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
                  <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-500" style={{ width: `${stats?.completionRate || 0}%` }} />
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
                <h3 className="text-lg font-semibold text-gray-900">Trip Overview</h3>
                <p className="text-xs text-purple-600 font-medium">AI Generated</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{trip.introduction}</p>
            </div>
          </CardContent>
        </Card>

        {stats && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">📊 Trip Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats.totalActivities}</div>
                  <div className="text-sm text-gray-600">Total</div>
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
            </CardContent>
          </Card>
        )}

        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex flex-wrap gap-3">
            <Button onClick={saveTrip} variant="outline"><Save className="w-4 h-4 mr-2" />Save</Button>
            <Button onClick={() => setShowNotes(!showNotes)} variant={showNotes ? 'default' : 'outline'}><FileText className="w-4 h-4 mr-2" />Notes</Button>
          </div>
        </div>

        {isEditingLocation && (
          <Card className="mb-8 bg-gradient-to-r from-teal-50 to-blue-50 border-teal-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-teal-600 mr-2" />
                  <h3 className="text-lg font-semibold">Edit Location</h3>
                </div>
                <button onClick={() => setIsEditingLocation(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <input type="text" value={newDestination} onChange={(e) => setNewDestination(e.target.value)} placeholder="Enter new destination" className="w-full p-3 border rounded-lg mb-4" />
              <div className="flex gap-3">
                <Button onClick={saveLocationChange} className="flex-1"><Save className="w-4 h-4 mr-2" />Save</Button>
                <Button onClick={() => setIsEditingLocation(false)} variant="outline" className="flex-1">Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {showNotes && (
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Edit3 className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold">Trip Notes</h3>
              </div>
              <textarea value={tripNotes} onChange={(e) => setTripNotes(e.target.value)} placeholder="Write your notes..." className="w-full h-32 p-4 border rounded-lg resize-none" />
            </CardContent>
          </Card>
        )}

        <div className="space-y-8">
          {trip.dailyPlans.map((day, dayIndex) => (
            <div key={day.day}>
              <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">{day.day}</div>
                  <div>
                    <h3 className="text-2xl font-bold">Day {day.day}</h3>
                    <p className="text-gray-600" dangerouslySetInnerHTML={{ __html: day.title }}></p>
                  </div>
                </div>
              </div>
              
              <div className="relative ml-6">
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-400 to-blue-500"></div>
                
                <div className="space-y-6">
                  {day.activities.map((activity, activityIndex) => (
                    <div key={activityIndex} className="relative" draggable onDragStart={() => handleDragStart(dayIndex, activityIndex)} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(dayIndex, activityIndex)}>
                      <div className={`absolute -left-2 w-4 h-4 rounded-full border-2 border-white ${getActivityStatus(id!, dayIndex, activityIndex) ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                      
                      <Card className={`ml-8 transition-all hover:shadow-lg cursor-move ${getActivityStatus(id!, dayIndex, activityIndex) ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'} ${draggedItem?.dayIndex === dayIndex && draggedItem?.activityIndex === activityIndex ? 'opacity-50' : ''}`}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center mr-4 cursor-grab active:cursor-grabbing">
                              <GripVertical className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="w-32 h-24 rounded-lg overflow-hidden mr-6 flex-shrink-0">
                              <img src={activity.imageUrl || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop'} alt={activity.activityTitle} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop' }} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm font-medium">{activity.timeOfDay}</span>
                                {activity.rating && (
                                  <div className="flex items-center bg-yellow-100 px-2 py-1 rounded-full">
                                    <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                                    <span className="text-sm font-medium text-yellow-700">{activity.rating}</span>
                                  </div>
                                )}
                                {activity.difficulty && (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${activity.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : activity.difficulty === 'Moderate' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{activity.difficulty}</span>
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
                                {activity.category && <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mb-2">{activity.category}</span>}
                                <p className="text-gray-700 leading-relaxed">{activity.description}</p>
                              </div>
                              
                              {(activity.transportation || activity.bestTimeToVisit || activity.tips || activity.foodRecommendations) && (
                                <button onClick={() => setExpandedActivity(expandedActivity?.dayIndex === dayIndex && expandedActivity?.activityIndex === activityIndex ? null : { dayIndex, activityIndex })} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center mt-2">
                                  <Info className="w-4 h-4 mr-1" />
                                  {expandedActivity?.dayIndex === dayIndex && expandedActivity?.activityIndex === activityIndex ? 'Hide Details' : 'Show Details'}
                                </button>
                              )}
                              
                              {expandedActivity?.dayIndex === dayIndex && expandedActivity?.activityIndex === activityIndex && (
                                <div className="mt-4 space-y-3 border-t pt-4">
                                  {activity.transportation && (
                                    <div className="bg-blue-50 rounded-lg p-3">
                                      <div className="flex items-start">
                                        <Car className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
                                        <div className="flex-1">
                                          <div className="text-sm font-semibold text-blue-900">Transportation</div>
                                          <div className="text-sm text-blue-700">{activity.transportation}</div>
                                          {activity.transportCost && <div className="text-xs text-blue-600 mt-1">Cost: {activity.transportCost} • Duration: {activity.transportDuration || 'N/A'}</div>}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {activity.bestTimeToVisit && (
                                    <div className="bg-orange-50 rounded-lg p-3">
                                      <div className="flex items-start">
                                        <Clock className="w-4 h-4 text-orange-600 mr-2 mt-0.5" />
                                        <div className="flex-1">
                                          <div className="text-sm font-semibold text-orange-900">Best Time</div>
                                          <div className="text-sm text-orange-700">{activity.bestTimeToVisit}</div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {activity.tips && activity.tips.length > 0 && (
                                    <div className="bg-purple-50 rounded-lg p-3">
                                      <div className="flex items-start">
                                        <AlertCircle className="w-4 h-4 text-purple-600 mr-2 mt-0.5" />
                                        <div className="flex-1">
                                          <div className="text-sm font-semibold text-purple-900 mb-1">Tips</div>
                                          <ul className="text-sm text-purple-700 space-y-1">
                                            {activity.tips.map((tip, idx) => <li key={idx}>• {tip}</li>)}
                                          </ul>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {activity.foodRecommendations && activity.foodRecommendations.length > 0 && (
                                    <div className="bg-green-50 rounded-lg p-3">
                                      <div className="flex items-start">
                                        <Utensils className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
                                        <div className="flex-1">
                                          <div className="text-sm font-semibold text-green-900 mb-1">Food</div>
                                          <ul className="text-sm text-green-700 space-y-1">
                                            {activity.foodRecommendations.map((food, idx) => <li key={idx}>• {food}</li>)}
                                          </ul>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div className="flex flex-wrap gap-4 text-sm mt-4">
                                <div className="flex items-center text-gray-600">
                                  <Clock className="w-4 h-4 mr-1" /><span>{activity.duration}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <DollarSign className="w-4 h-4 mr-1" /><span>{activity.estimatedCost}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="ml-6 flex flex-col gap-2">
                              <div className="flex gap-1">
                                <Button variant="outline" size="sm" onClick={() => moveActivity(dayIndex, activityIndex, 'up')} disabled={activityIndex === 0} className="p-1 h-8 w-8" title="Move up">
                                  <ArrowUp className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => moveActivity(dayIndex, activityIndex, 'down')} disabled={activityIndex === day.activities.length - 1} className="p-1 h-8 w-8" title="Move down">
                                  <ArrowDown className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => deleteActivity(dayIndex, activityIndex)} className="p-1 h-8 w-8 text-red-600 hover:bg-red-50" title="Remove">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <Button variant="default" size="sm" onClick={() => { if (id) { toggleActivityStatus(id, dayIndex, activityIndex); forceUpdate({}) } }} className={getActivityStatus(id!, dayIndex, activityIndex) ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}>
                                {getActivityStatus(id!, dayIndex, activityIndex) ? <><CheckCircle className="w-4 h-4 mr-2" />Visited</> : <><Circle className="w-4 h-4 mr-2" />Pending</>}
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
