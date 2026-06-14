import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../components/Card'
import { Button } from '../components/Button'
import { MapPin, Clock, CheckCircle, Star, Save, DollarSign, ArrowLeft, AlertCircle, Calendar, Route, Utensils, Plane, Castle, Compass, Bed } from 'lucide-react'
import { tripService } from '../services/tripService'
import type { TripPlan } from '../services/tripService'
import { useApp } from '../contexts/AppContext'
import { ImageWithFallback } from '../components/ImageWithFallback'
import { calculateTripConfidence } from '../lib/tripConfidence'

// Type alias for compatibility
type Trip = TripPlan

const buildTripCoverPlaceholder = (destination: string) =>
  `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900" viewBox="0 0 1400 900">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#07111f" />
          <stop offset="100%" stop-color="#1e3a5f" />
        </linearGradient>
      </defs>
      <rect width="1400" height="900" fill="url(#bg)" />
      <circle cx="250" cy="180" r="140" fill="#7dd3fc" opacity="0.1" />
      <circle cx="1180" cy="720" r="180" fill="#f8fafc" opacity="0.08" />
      <text x="700" y="410" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" fill="#cbd5e1" letter-spacing="6">TRIP COVER</text>
      <text x="700" y="500" text-anchor="middle" font-family="Arial, sans-serif" font-size="64" fill="#f8fafc" font-weight="700">${destination.replace(/&/g, '&amp;')}</text>
      <text x="700" y="570" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="#cbd5e1">No verified cover image was available for this trip.</text>
    </svg>
  `)}`

const getCoverImage = (trip: Trip) =>
  trip.coverImageUrl ||
  trip.dailyItinerary?.flatMap((day) => day.activities || []).find((activity) => activity.imageUrl)?.imageUrl ||
  buildTripCoverPlaceholder(trip.destination)


export const TripDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toggleActivityStatus, getActivityStatus } = useApp()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [, forceUpdate] = useState({})

  useEffect(() => {
    if (id) {
      fetchTrip(id)
    }
  }, [id])

  // Helper to normalize trip data for backward compatibility
  const normalizeTripData = (tripData: any): Trip => {
    // If it already has the new structure, return it
    if (tripData.dailyItinerary && tripData.dailyItinerary.length > 0) {
      return tripData as Trip
    }

    // Map old dailyPlans to new dailyItinerary
    const dailyItinerary = tripData.dailyPlans?.map((day: any) => ({
      day: day.day,
      date: `Day ${day.day}`,
      theme: day.title || `Day ${day.day} Itinerary`,
      activities: day.activities?.map((act: any) => ({
        timeSlot: act.timeOfDay || `${act.start_time}-${act.end_time}`,
        activityType: act.category || 'Activity',
        activityTitle: act.activityTitle || act.placeName,
        details: act.description || act.details || '',
        cost: act.estimatedCost || 'N/A',
        notes: act.tips || '',
        imageUrl: act.imageUrl,
        isVisited: act.isVisited || false,
        rating: act.rating
      })) || []
    })) || []

    // Create default expense breakdown if missing
    const expenseBreakdown = tripData.expenseBreakdown || {
      fixed: {
        accommodation: { desc: 'Accommodation', cost: 'Not provided' },
        transport: { desc: 'Transport', cost: 'Not provided' },
        tickets: { desc: 'Tickets', cost: 'Not provided' }
      },
      variable: {
        dining: { desc: 'Dining', cost: 'Not provided' },
        localTransport: { desc: 'Local transport', cost: 'Not provided' }
      },
      total: tripData.totalEstimatedCost || 'N/A'
    }

    // Create default preparation if missing
    const preTripPreparation = tripData.preTripPreparation || {
      booking: [],
      packing: [],
      weather: 'Forecast details were not provided.',
      notes: tripData.travelTips || []
    }

    // Create default overview if missing
    const tripOverview = tripData.tripOverview || {
      totalTravelDays: tripData.duration || 'N/A',
      keyAttractions: [],
      transportSummary: 'Transport details were not provided.',
      hotels: [],
      estimatedTotalBudget: tripData.totalEstimatedCost || 'N/A'
    }

    return {
      ...tripData,
      dailyItinerary,
      expenseBreakdown,
      preTripPreparation,
      tripOverview
    } as Trip
  }

  const fetchTrip = async (tripId: string) => {
    try {
      const tripData = await tripService.getTripById(tripId)
      const normalizedTrip = normalizeTripData(tripData)
      setTrip(normalizedTrip)
    } catch (error) {
      console.error('Failed to fetch trip:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveTrip = async () => {
    if (!trip || !id) return
    try {
      await tripService.updateTrip(id, trip)
      alert('Trip saved successfully!')
    } catch (error) {
      alert('Failed to save trip')
    }
  }

  const generateDailyDirectionsUrl = (day: any, destination: string, prevOvernight?: string) => {
    if (!day.activities || day.activities.length === 0) return null;

    // Helper to sanitize activity titles (remove emojis, special chars) for better Google Maps search
    const sanitize = (name: string) => {
      return name
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F30B}-\u{1F320}\u{1F400}-\u{1F4FF}\u{1F900}-\u{1F9FF}\u{1F3FB}-\u{1F3FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '') // Remove emojis
        .replace(/['"“”‘’]/g, '') // Remove quotes
        .replace(/\s+/g, '+') // Encode spaces as +
        .trim();
    };

    // Origin: Use previous day's hotel if available, otherwise first activity
    const originName = prevOvernight || day.activities[0].activityTitle;
    const origin = encodeURIComponent(`${sanitize(originName)}, ${destination}`);

    // Destination: Overnight stay of the current day
    const finalDestName = day.overnight?.name || day.activities[day.activities.length - 1].activityTitle;
    const finalDest = encodeURIComponent(`${sanitize(finalDestName)}, ${destination}`);

    // Waypoints: 
    // If we start from prevOvernight, we include ALL activities in waypoints
    // If we start from activities[0], we include activities[1] to [N-1]
    let waypointsToInclude = [];
    if (prevOvernight) {
      waypointsToInclude = day.activities;
    } else {
      waypointsToInclude = day.activities.slice(1);
    }

    // Remove the final destination from waypoints if it's already the overnight stay
    if (day.overnight?.name) {
      // Keep all activities
    } else {
      // Last activity is already the destination
      waypointsToInclude = waypointsToInclude.slice(0, -1);
    }

    let waypointsStr = '';
    const waypoints = waypointsToInclude
      .map((a: any) => encodeURIComponent(`${sanitize(a.activityTitle)}, ${destination}`));

    if (waypoints.length > 0) {
      waypointsStr = `&waypoints=${waypoints.join('|')}`;
    }

    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${finalDest}${waypointsStr}&travelmode=driving`;
  }

  const getVisitProgress = (tripData: Trip) => {
    const itinerary = tripData.dailyItinerary || []
    const totalActivities = itinerary.reduce((sum, day) => sum + (day.activities?.length || 0), 0)
    const visitedActivities = itinerary.reduce(
      (sum, day) => sum + (day.activities?.filter((activity) => activity.isVisited)?.length || 0),
      0
    )

    return totalActivities > 0 ? Math.round((visitedActivities / totalActivities) * 100) : 0
  }

  const getPlanningReadiness = (tripData: Trip) => {
    let score = 0
    if (tripData.destination) score += 15
    if (tripData.duration) score += 15
    if (tripData.startDate) score += 10
    if (tripData.tripOverview?.keyAttractions?.length) score += 15
    if (tripData.dailyItinerary?.length) score += 20
    if (tripData.dailyItinerary?.every((day) => day.activities?.length)) score += 15
    if (tripData.preTripPreparation?.booking?.length) score += 10
    return Math.min(score, 100)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div></div>
  if (!trip) return <div className="min-h-screen flex items-center justify-center"><div className="text-center"><h2 className="text-2xl font-bold mb-2">Trip Not Found</h2><Button onClick={() => navigate(-1)}>Back</Button></div></div>

  const visitProgress = getVisitProgress(trip)
  const planningReadiness = getPlanningReadiness(trip)
  const confidence = calculateTripConfidence(trip)

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <div className="relative overflow-hidden text-white shadow-xl">
        <ImageWithFallback
          src={getCoverImage(trip)}
          alt={trip.destination}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,18,0.38)_0%,rgba(3,7,18,0.76)_50%,rgba(3,7,18,0.92)_100%)]" />
        <div className="relative max-w-7xl mx-auto px-4 py-12 sm:py-16">
          <Button variant="outline" onClick={() => navigate(-1)} className="mb-6 bg-white/10 border-white/20 text-white hover:bg-white/20">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Trips
          </Button>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">{trip.tripTitle || trip.destination}</h1>
          <div className="flex flex-wrap gap-6 text-sm font-medium opacity-90">
            <div className="flex items-center"><MapPin className="w-5 h-5 mr-2" /> {trip.destination}</div>
            <div className="flex items-center"><Clock className="w-5 h-5 mr-2" /> {trip.duration}</div>
            <div className="flex items-center"><DollarSign className="w-5 h-5 mr-2" /> {trip.tripOverview?.estimatedTotalBudget || trip.totalEstimatedCost}</div>
            {trip.tripOverview?.tripStyle && (
              <div className="flex items-center bg-white/20 px-3 py-1 rounded-full"><Star className="w-4 h-4 mr-2" /> {trip.tripOverview.tripStyle}</div>
            )}
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-white/60">Planning readiness</p>
              <p className="mt-2 text-3xl font-semibold">{planningReadiness}%</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-white/60">Trip confidence</p>
              <p className="mt-2 text-3xl font-semibold">{confidence.overall}%</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-white/60">Planning stage</p>
              <p className="mt-2 text-3xl font-semibold">{trip.planningStatus ? trip.planningStatus.replace('_', ' ') : 'draft'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        <section>
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="bg-white shadow-sm border-t-4 border-sky-500">
              <CardContent className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Confidence Summary</p>
                <h2 className="mt-3 text-3xl font-semibold text-slate-900">{confidence.summary}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  This score helps answer the traveler’s real question: “Can I trust this plan to feel good in real life, not just on paper?”
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${
                        confidence.tone === 'strong'
                          ? 'bg-emerald-500'
                          : confidence.tone === 'watch'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                      }`}
                      style={{ width: `${confidence.overall}%` }}
                    />
                  </div>
                  <span className="text-lg font-semibold text-slate-900">{confidence.overall}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-t-4 border-violet-500">
              <CardContent className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">What Drives The Score</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {confidence.categories.map((category) => (
                    <div key={category.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">{category.label}</p>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          category.tone === 'strong'
                            ? 'bg-emerald-100 text-emerald-800'
                            : category.tone === 'watch'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                        }`}>
                          {category.score}%
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{category.summary}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Card className="bg-white shadow-sm border-t-4 border-emerald-500">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-900">What looks strong</h3>
                <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-slate-600">
                  {confidence.strengths.length > 0 ? confidence.strengths.map((item, index) => (
                    <li key={index}>{item}</li>
                  )) : <li>No major strengths were detected yet.</li>}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-sm border-t-4 border-amber-500">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-900">What still needs attention</h3>
                <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-slate-600">
                  {confidence.warnings.length > 0 ? confidence.warnings.map((item, index) => (
                    <li key={index}>{item}</li>
                  )) : <li>No major warnings were detected from the current draft.</li>}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Trip Overview Section */}
        {trip.tripOverview && (
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center text-indigo-900"><Star className="w-6 h-6 mr-3 text-yellow-500" />Trip Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white shadow-md border-t-4 border-indigo-500">
                <CardContent className="p-6">
                  {trip.tripOverview.summaryHeadline && (
                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-indigo-500">{trip.tripOverview.summaryHeadline}</p>
                  )}
                  <p className="text-gray-700 mb-6 italic text-lg leading-relaxed">"{trip.introduction}"</p>
                  <div className="space-y-3">
                    <div className="flex items-start"><span className="font-semibold w-32 text-indigo-700">Key Highlights:</span> <span className="flex-1">{trip.tripOverview.keyAttractions.join(', ')}</span></div>
                    <div className="flex items-start"><span className="font-semibold w-32 text-indigo-700">Transport:</span> <span className="flex-1">{trip.tripOverview.transportSummary}</span></div>
                    <div className="flex items-start"><span className="font-semibold w-32 text-indigo-700">Hotels:</span> <span className="flex-1">{trip.tripOverview.hotels.join(', ')}</span></div>
                    {trip.tripOverview.budgetPerDay && (
                      <div className="flex items-start"><span className="font-semibold w-32 text-indigo-700">Per Day:</span> <span className="flex-1">{trip.tripOverview.budgetPerDay}</span></div>
                    )}
                    {trip.tripOverview.accommodationType && (
                      <div className="flex items-start"><span className="font-semibold w-32 text-indigo-700">Accommodation:</span> <span className="flex-1">{trip.tripOverview.accommodationType}</span></div>
                    )}
                    {trip.tripOverview.bestFor && (
                      <div className="flex items-start"><span className="font-semibold w-32 text-indigo-700">🌿 Best For:</span> <span className="flex-1">{trip.tripOverview.bestFor.join(', ')}</span></div>
                    )}
                    {trip.tripOverview.paceScore && (
                      <div className="flex items-start"><span className="font-semibold w-32 text-indigo-700">Pace Score:</span> <span className="flex-1">{trip.tripOverview.paceScore}</span></div>
                    )}
                    {trip.tripOverview.travelEfficiency && (
                      <div className="flex items-start"><span className="font-semibold w-32 text-indigo-700">Efficiency:</span> <span className="flex-1">{trip.tripOverview.travelEfficiency}</span></div>
                    )}
                  </div>
                </CardContent>
              </Card>
              {trip.expenseBreakdown && (
                <Card className="bg-white shadow-md border-t-4 border-green-500">
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-4 text-green-800">💰 Expense Breakdown</h3>
                    <div className="space-y-4 text-sm">
                      <div className="border-b pb-2">
                        <p className="font-semibold text-gray-500 mb-1 uppercase text-xs">Fixed Expenses</p>
                        <div className="flex justify-between py-1"><span>Accommodation</span><span className="font-medium">{trip.expenseBreakdown.fixed.accommodation.cost}</span></div>
                        <div className="flex justify-between py-1"><span>Transport</span><span className="font-medium">{trip.expenseBreakdown.fixed.transport.cost}</span></div>
                        <div className="flex justify-between py-1"><span>Tickets</span><span className="font-medium">{trip.expenseBreakdown.fixed.tickets.cost}</span></div>
                      </div>
                      <div className="border-b pb-2">
                        <p className="font-semibold text-gray-500 mb-1 uppercase text-xs">Variable Expenses</p>
                        <div className="flex justify-between py-1"><span>Dining</span><span className="font-medium">{trip.expenseBreakdown.variable.dining.cost}</span></div>
                        <div className="flex justify-between py-1"><span>Local Transport</span><span className="font-medium">{trip.expenseBreakdown.variable.localTransport.cost}</span></div>
                      </div>
                      <div className="flex justify-between pt-2 text-xl font-bold text-green-700">
                        <span>Total Estimated</span>
                        <span>{trip.expenseBreakdown.total}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2 text-center">*Estimates based on current rates.</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {trip.tripOverview.whyThisTripFits && trip.tripOverview.whyThisTripFits.length > 0 && (
                <Card className="bg-white shadow-sm border-t-4 border-sky-500">
                  <CardContent className="p-6">
                    <h3 className="mb-4 text-lg font-bold text-slate-900">Why This Trip Fits</h3>
                    <ul className="list-inside list-disc space-y-2 text-sm text-slate-600">
                      {trip.tripOverview.whyThisTripFits.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                  </CardContent>
                </Card>
              )}
              {trip.tripOverview.routeStrategy && trip.tripOverview.routeStrategy.length > 0 && (
                <Card className="bg-white shadow-sm border-t-4 border-violet-500">
                  <CardContent className="p-6">
                    <h3 className="mb-4 text-lg font-bold text-slate-900">Route Strategy</h3>
                    <ul className="list-inside list-disc space-y-2 text-sm text-slate-600">
                      {trip.tripOverview.routeStrategy.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                  </CardContent>
                </Card>
              )}
              {trip.tripOverview.tradeoffs && trip.tripOverview.tradeoffs.length > 0 && (
                <Card className="bg-white shadow-sm border-t-4 border-amber-500">
                  <CardContent className="p-6">
                    <h3 className="mb-4 text-lg font-bold text-slate-900">Trip Tradeoffs</h3>
                    <ul className="list-inside list-disc space-y-2 text-sm text-slate-600">
                      {trip.tripOverview.tradeoffs.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                  </CardContent>
                </Card>
              )}
              {trip.tripOverview.bookingPriority && trip.tripOverview.bookingPriority.length > 0 && (
                <Card className="bg-white shadow-sm border-t-4 border-emerald-500">
                  <CardContent className="p-6">
                    <h3 className="mb-4 text-lg font-bold text-slate-900">Book These First</h3>
                    <ul className="list-inside list-disc space-y-2 text-sm text-slate-600">
                      {trip.tripOverview.bookingPriority.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        )}

        {/* Detailed Itinerary Table */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center text-indigo-900"><Calendar className="w-6 h-6 mr-3 text-indigo-600" />Detailed Daily Itinerary</h2>

          <div className="space-y-10">
            {trip.dailyItinerary?.map((day, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex flex-col md:flex-row md:items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-indigo-900">Day {day.day}: {day.theme}</h3>
                    <p className="text-sm text-indigo-600 font-medium">{day.date}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-indigo-700">
                      {day.dayGoal && <span className="rounded-full border border-indigo-100 bg-white px-3 py-1">Goal: {day.dayGoal}</span>}
                      {day.energyLevel && <span className="rounded-full border border-indigo-100 bg-white px-3 py-1">Energy: {day.energyLevel}</span>}
                      {day.estimatedTravelTime && <span className="rounded-full border border-indigo-100 bg-white px-3 py-1">Travel: {day.estimatedTravelTime}</span>}
                      {day.estimatedDayCost && <span className="rounded-full border border-indigo-100 bg-white px-3 py-1">Day Cost: {day.estimatedDayCost}</span>}
                    </div>
                  </div>
                  <div className="mt-2 md:mt-0 flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = generateDailyDirectionsUrl(day, trip.destination, index > 0 ? trip.dailyItinerary[index - 1].overnight?.name : undefined);
                        if (url) window.open(url, '_blank');
                      }}
                      className="bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-sm font-semibold"
                    >
                      <Route className="w-4 h-4 mr-2" /> View Daily Route
                    </Button>
                    <div className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-indigo-500 border border-indigo-100 shadow-sm uppercase tracking-wide">
                      {day.activities.length} Activities
                    </div>
                  </div>
                </div>

                {(day.mustDo || day.optionalAddOn || day.weatherBackup) && (
                  <div className="grid gap-3 border-b border-indigo-100 bg-white px-6 py-4 md:grid-cols-3">
                    {day.mustDo && (
                      <div className="rounded-xl bg-emerald-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Must-Do</p>
                        <p className="mt-2 text-sm text-emerald-950">{day.mustDo}</p>
                      </div>
                    )}
                    {day.optionalAddOn && (
                      <div className="rounded-xl bg-sky-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-sky-700">Optional Add-On</p>
                        <p className="mt-2 text-sm text-sky-950">{day.optionalAddOn}</p>
                      </div>
                    )}
                    {day.weatherBackup && (
                      <div className="rounded-xl bg-amber-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Weather Backup</p>
                        <p className="mt-2 text-sm text-amber-950">{day.weatherBackup}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b">
                        <th className="p-4 w-32 font-semibold">Time Slot</th>
                        <th className="p-4 w-40 font-semibold">Type</th>
                        <th className="p-4 font-semibold">Activity Details</th>
                        <th className="p-4 w-24 font-semibold">Cost</th>
                        <th className="p-4 w-48 font-semibold">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {day.activities.map((activity, actIndex) => {
                        // Helper to get activity icons
                        const getActivityIcon = (type: string, title: string) => {
                          const t = (type || '').toLowerCase();
                          const titleLower = (title || '').toLowerCase();
                          if (t.includes('dining') || t.includes('restaurant') || titleLower.includes('lunch') || titleLower.includes('dinner')) return <Utensils className="w-3.5 h-3.5 mr-1" />;
                          if (t.includes('travel') || t.includes('transport') || titleLower.includes('airport') || titleLower.includes('flight')) return <Plane className="w-3.5 h-3.5 mr-1" />;
                          if (t.includes('sightseeing') || t.includes('visit') || t.includes('museum')) return <Castle className="w-3.5 h-3.5 mr-1" />;
                          return <Compass className="w-3.5 h-3.5 mr-1" />;
                        };

                        return (
                          <tr key={actIndex} className="hover:bg-blue-50/50 transition-colors">
                            <td className="p-4 text-sm font-medium text-gray-900 whitespace-nowrap align-top border-l-4 border-indigo-400">
                              {activity.timeSlot}
                            </td>
                            <td className="p-4 text-sm text-indigo-600 font-medium align-top">
                              <span className="inline-flex items-center px-2 py-1 bg-indigo-50 rounded-md text-[10px] uppercase tracking-wider">
                                {getActivityIcon(activity.activityType, activity.activityTitle)}
                                {activity.activityType}
                              </span>
                            </td>
                            <td className="p-4 align-top">
                              <div className="flex flex-col mb-1">
                                <div className="font-bold text-gray-800 text-base mb-1">{activity.activityTitle}</div>
                                <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line mb-3">
                                  {activity.details}
                                </div>
                                {(activity.estimatedDuration || activity.priority || activity.travelNote) && (
                                  <div className="mb-3 flex flex-wrap gap-2 text-xs text-slate-600">
                                    {activity.estimatedDuration && <span className="rounded-full bg-slate-100 px-2.5 py-1">Duration: {activity.estimatedDuration}</span>}
                                    {activity.priority && <span className="rounded-full bg-slate-100 px-2.5 py-1">Priority: {activity.priority}</span>}
                                    {activity.travelNote && <span className="rounded-full bg-slate-100 px-2.5 py-1">{activity.travelNote}</span>}
                                  </div>
                                )}

                                <div className="flex flex-wrap items-center gap-3">
                                  {activity.googleMapsUrl && (
                                    <a
                                      href={activity.googleMapsUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 transition-all hover:shadow-sm"
                                    >
                                      <MapPin className="w-3 h-3 mr-1.5" /> Tap to navigate
                                    </a>
                                  )}
                                </div>
                              </div>
                              {activity.imageUrl && (
                                <div className="mt-3 max-w-sm">
                                  <ImageWithFallback
                                    src={activity.imageUrl}
                                    alt={activity.activityTitle}
                                    className="h-48 w-full rounded-lg object-cover shadow-sm"
                                  />
                                  {(activity.imageSource || activity.isRepresentativeImage) && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                        activity.isRepresentativeImage
                                          ? 'bg-amber-100 text-amber-900'
                                          : 'bg-emerald-100 text-emerald-900'
                                      }`}>
                                        {activity.isRepresentativeImage ? 'Representative image' : `Image source: ${activity.imageSource}`}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-sm font-semibold text-green-700 align-top">
                              {activity.cost}
                            </td>
                            <td className="p-4 text-sm text-gray-500 italic align-top bg-yellow-50/5">
                              <div className="flex items-start">
                                <AlertCircle className="w-3 h-3 mr-2 mt-1 flex-shrink-0 text-amber-500" />
                                <span className="text-xs">{activity.notes}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Day Conclusion: Overnight Stay */}
                      {day.overnight && (
                        <tr className="bg-indigo-50/30">
                          <td colSpan={5} className="p-4">
                            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-4 text-indigo-600">
                                  <Bed className="w-6 h-6" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-indigo-500 uppercase tracking-tighter">Recommended Overnight</p>
                                  <h4 className="font-bold text-gray-800">{day.overnight.name}</h4>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-indigo-700">{day.overnight.price}</p>
                                <p className="text-xs text-gray-500">{day.overnight.note}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {day.overnight && (
                  <div className="bg-indigo-50/50 p-4 border-t border-indigo-100">
                    <div className="flex items-center gap-2 text-indigo-900">
                      <span className="font-bold text-sm uppercase tracking-wider">🏠 Overnight:</span>
                      <span className="font-semibold">{day.overnight.name}</span>
                      <span className="text-sm font-medium text-indigo-600 px-2 py-0.5 bg-white rounded-md border border-indigo-100">{day.overnight.price}</span>
                      <span className="text-sm text-indigo-700 italic">• {day.overnight.note}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Pre-Trip Preparation */}
        {trip.preTripPreparation && (
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center text-indigo-900"><CheckCircle className="w-6 h-6 mr-3 text-teal-600" />Pre-Trip Preparation</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover:shadow-lg transition-all border-t-4 border-blue-500">
                <CardContent className="p-5">
                  <h3 className="font-bold mb-3 flex items-center text-gray-800"><Calendar className="w-4 h-4 mr-2 text-blue-500" />Bookings</h3>
                  <ul className="text-sm space-y-2 text-gray-600 list-disc list-inside">
                    {trip.preTripPreparation.booking.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-all border-t-4 border-orange-500">
                <CardContent className="p-5">
                  <h3 className="font-bold mb-3 flex items-center text-gray-800"><Briefcase className="w-4 h-4 mr-2 text-orange-500" />Packing</h3>
                  <ul className="text-sm space-y-2 text-gray-600 list-disc list-inside">
                    {trip.preTripPreparation.packing.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-all border-t-4 border-yellow-500">
                <CardContent className="p-5">
                  <h3 className="font-bold mb-3 flex items-center text-gray-800"><Sun className="w-4 h-4 mr-2 text-yellow-500" />Weather</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{trip.preTripPreparation.weather}</p>
                </CardContent>
              </Card>
              <Card className="hover:shadow-lg transition-all border-t-4 border-purple-500">
                <CardContent className="p-5">
                  <h3 className="font-bold mb-3 flex items-center text-gray-800"><AlertCircle className="w-4 h-4 mr-2 text-purple-500" />Know Before You Go</h3>
                  <ul className="text-sm space-y-2 text-gray-600 list-disc list-inside">
                    {trip.preTripPreparation.notes.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        <div className="flex justify-end gap-4 mt-8">
          <Button variant="outline" onClick={saveTrip} className="px-8"><Save className="w-4 h-4 mr-2" /> Save Itinerary</Button>
          <Button className="px-8 bg-indigo-600 hover:bg-indigo-700 text-white">Share Trip</Button>
        </div>

      </div>
    </div>
  )
}

// Icons needed for preparation section
import { Briefcase, Sun } from 'lucide-react'

