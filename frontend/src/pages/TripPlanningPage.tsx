import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  Clock3,
  Compass,
  Eye,
  ListChecks,
  MapPin,
  Plus,
  Sparkles,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/Button'
import { Card, CardContent } from '../components/Card'
import { AITripGenerator } from '../components/AITripGenerator'
import { TripForm } from '../components/TripForm'
import { tripService, type TripPlan } from '../services/tripService'
import { ImageWithFallback } from '../components/ImageWithFallback'

type Trip = TripPlan

const statusMeta: Record<string, { label: string; tone: string }> = {
  draft: { label: 'Draft', tone: 'bg-slate-100 text-slate-700' },
  ready: { label: 'Ready', tone: 'bg-sky-100 text-sky-700' },
  booked: { label: 'Booked', tone: 'bg-violet-100 text-violet-700' },
  in_progress: { label: 'On trip', tone: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Completed', tone: 'bg-emerald-100 text-emerald-700' },
}

const parseBudgetValue = (value?: string) => {
  if (!value) return 0
  const numeric = parseFloat(value.replace(/[^0-9.]/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

const getCoverImage = (trip: Trip) =>
  trip.coverImageUrl ||
  trip.dailyItinerary?.flatMap((day) => day.activities || []).find((activity) => activity.imageUrl)?.imageUrl ||
  `https://picsum.photos/seed/${encodeURIComponent(`${trip.destination}-${trip._id}`)}/1200/800`

const getVisitProgress = (trip: Trip) => {
  const itinerary = trip.dailyItinerary || []
  const totalActivities = itinerary.reduce((sum, day) => sum + (day.activities?.length || 0), 0)
  const visitedActivities = itinerary.reduce(
    (sum, day) => sum + (day.activities?.filter((activity) => activity.isVisited)?.length || 0),
    0
  )

  return totalActivities > 0 ? Math.round((visitedActivities / totalActivities) * 100) : 0
}

const getPlanningReadiness = (trip: Trip) => {
  let score = 0
  if (trip.destination) score += 15
  if (trip.duration) score += 15
  if (trip.startDate) score += 10
  if (trip.travelStyle) score += 10
  if (trip.tripOverview?.keyAttractions?.length) score += 15
  if (trip.preTripPreparation?.booking?.length) score += 10
  if (trip.dailyItinerary?.length) score += 15
  if (trip.dailyItinerary?.every((day) => day.activities?.length)) score += 10
  return Math.min(score, 100)
}

export const TripPlanningPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [showTripForm, setShowTripForm] = useState(false)
  const [selectedPlaces, setSelectedPlaces] = useState<any[]>([])
  const [activeFilter, setActiveFilter] = useState<'all' | 'draft' | 'ready' | 'booked' | 'in_progress' | 'completed'>('all')

  useEffect(() => {
    fetchTrips()

    const storedPlaces = sessionStorage.getItem('selectedPlaces')
    if (storedPlaces) {
      const places = JSON.parse(storedPlaces)
      setSelectedPlaces(places)
      setShowAIGenerator(true)
      sessionStorage.removeItem('selectedPlaces')
    }
  }, [])

  const fetchTrips = async () => {
    try {
      setLoading(true)
      const data = await tripService.getTrips()
      setTrips(Array.isArray(data) ? data : [])
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
      }
    } catch (error) {
      console.error('Failed to delete trip:', error)
    }
  }

  const filteredTrips = useMemo(
    () => trips.filter((trip) => activeFilter === 'all' || (trip.planningStatus || 'draft') === activeFilter),
    [activeFilter, trips]
  )

  const tripMetrics = useMemo(() => {
    const totalTrips = trips.length
    const activeTrips = trips.filter((trip) => ['draft', 'ready', 'booked', 'in_progress'].includes(trip.planningStatus || 'draft')).length
    const averageVisitProgress = Math.round(
      trips.reduce((sum, trip) => sum + getVisitProgress(trip), 0) / (trips.length || 1)
    )
    const averagePlanningReadiness = Math.round(
      trips.reduce((sum, trip) => sum + getPlanningReadiness(trip), 0) / (trips.length || 1)
    )

    return {
      totalTrips,
      activeTrips,
      averageVisitProgress,
      averagePlanningReadiness,
    }
  }, [trips])

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_42%,#f7f9fc_100%)]">
      <section className="relative overflow-hidden bg-[#07111f] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1920&h=1080&fit=crop&auto=format&q=80)',
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.18),_transparent_26%),linear-gradient(180deg,rgba(3,7,18,0.4)_0%,rgba(3,7,18,0.72)_52%,rgba(3,7,18,0.9)_100%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              Trip Planner Workspace
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Plan, generate, and track trips from one clearer dashboard.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/76 sm:text-lg sm:leading-8">
              Use AI for a richer first draft, build trips manually when you need control, and keep both
              planning readiness and on-trip progress visible for every itinerary.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => setShowAIGenerator(true)}
                className="rounded-xl bg-white px-6 py-3 text-slate-950 hover:bg-slate-100"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate with AI
              </Button>
              <Button
                onClick={() => setShowTripForm(true)}
                className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-white hover:bg-white/15"
              >
                <Plus className="mr-2 h-4 w-4" />
                Build manually
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-white/10 bg-white/10 text-white backdrop-blur-md">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">Trips</p>
                    <p className="mt-2 text-3xl font-semibold">{tripMetrics.totalTrips}</p>
                  </div>
                  <Compass className="h-7 w-7 text-sky-200" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/10 text-white backdrop-blur-md">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">Active</p>
                    <p className="mt-2 text-3xl font-semibold">{tripMetrics.activeTrips}</p>
                  </div>
                  <TrendingUp className="h-7 w-7 text-emerald-200" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/10 text-white backdrop-blur-md">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">Planning readiness</p>
                    <p className="mt-2 text-3xl font-semibold">{tripMetrics.averagePlanningReadiness}%</p>
                  </div>
                  <ListChecks className="h-7 w-7 text-amber-200" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/10 text-white backdrop-blur-md">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">Visit progress</p>
                    <p className="mt-2 text-3xl font-semibold">{tripMetrics.averageVisitProgress}%</p>
                  </div>
                  <Clock3 className="h-7 w-7 text-violet-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {showAIGenerator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <AITripGenerator
            selectedPlaces={selectedPlaces}
            onTripGenerated={async (trip) => {
              try {
                const savedTrip = await tripService.createTrip({ ...trip, userId: user?.id })
                if (savedTrip) {
                  setShowAIGenerator(false)
                  setSelectedPlaces([])
                  await fetchTrips()
                }
              } catch (error) {
                console.error('Failed to save AI trip:', error)
              }
            }}
            onClose={() => {
              setShowAIGenerator(false)
              setSelectedPlaces([])
            }}
          />
        </div>
      )}

      {showTripForm && (
        <TripForm
          onSubmit={async (tripData) => {
            try {
              await tripService.createTrip({ ...tripData, userId: user?.id })
              setShowTripForm(false)
              await fetchTrips()
            } catch (error) {
              console.error('Failed to save trip:', error)
            }
          }}
          onClose={() => setShowTripForm(false)}
        />
      )}

      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-12">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {(['all', 'draft', 'ready', 'booked', 'in_progress', 'completed'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${activeFilter === filter ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}
            >
              {filter === 'all' ? 'All trips' : statusMeta[filter].label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-[360px] animate-pulse rounded-[1.75rem] bg-white shadow-sm ring-1 ring-slate-200/70" />
            ))}
          </div>
        ) : filteredTrips.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredTrips.map((trip) => {
              const visitProgress = getVisitProgress(trip)
              const planningReadiness = getPlanningReadiness(trip)
              const status = statusMeta[trip.planningStatus || 'draft']
              const estimatedBudget =
                trip.tripOverview?.estimatedTotalBudget ||
                trip.expenseBreakdown?.total ||
                trip.totalEstimatedCost ||
                'Budget pending'

              return (
                <Card
                  key={trip._id}
                  className="group overflow-hidden rounded-[1.75rem] border-0 bg-white shadow-lg shadow-slate-200/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div className="relative h-52 overflow-hidden">
                    <ImageWithFallback
                      src={getCoverImage(trip)}
                      alt={trip.destination}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute left-4 top-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.tone}`}>
                        {status.label}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteTrip(trip._id)
                      }}
                      className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-rose-600 shadow-sm transition hover:bg-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                      <h3 className="text-2xl font-semibold leading-tight">{trip.tripTitle}</h3>
                      <div className="mt-2 flex items-center gap-2 text-sm text-white/80">
                        <MapPin className="h-4 w-4" />
                        <span>{trip.destination}</span>
                      </div>
                    </div>
                  </div>

                  <CardContent className="space-y-5 p-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Planning</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{planningReadiness}%</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Visited</p>
                        <p className="mt-2 text-2xl font-semibold text-slate-900">{visitProgress}%</p>
                      </div>
                    </div>

                    <div className="space-y-3 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-sky-600" />
                        <span>{trip.startDate ? new Date(trip.startDate).toLocaleDateString() : 'Flexible dates'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-emerald-600" />
                        <span>{trip.duration}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-violet-600" />
                        <span>{trip.travelStyle || trip.tripOverview?.tripStyle || 'Balanced trip'}</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">Estimated budget</span>
                        <span className="font-semibold text-slate-900">{estimatedBudget}</span>
                      </div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">Days planned</span>
                        <span className="font-semibold text-slate-900">{trip.dailyItinerary?.length || trip.dailyPlans?.length || 0}</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => navigate(`/trips/${trip._id}`)}
                      className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 py-3 text-white hover:from-sky-700 hover:to-indigo-700"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Open planner
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sky-50 text-sky-600">
              <Compass className="h-10 w-10" />
            </div>
            <h3 className="mt-6 text-2xl font-semibold text-slate-900">No trips in this view yet</h3>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">
              Start with AI for a stronger first itinerary, or save a manual draft so you can build the trip
              progressively instead of trying to finish everything in one sitting.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button onClick={() => setShowAIGenerator(true)} className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white">
                <Sparkles className="mr-2 h-4 w-4" />
                Generate with AI
              </Button>
              <Button onClick={() => setShowTripForm(true)} variant="outline" className="rounded-xl">
                <Plus className="mr-2 h-4 w-4" />
                Build manually
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
