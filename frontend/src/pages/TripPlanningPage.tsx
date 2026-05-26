import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock3,
  Compass,
  Eye,
  ListChecks,
  MapPin,
  Sparkles,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from '../components/Button'
import { Card, CardContent } from '../components/Card'
import { AITripGenerator } from '../components/AITripGenerator'
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
  const [savingDraft, setSavingDraft] = useState(false)
  const [saveDraftError, setSaveDraftError] = useState<string | null>(null)
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [selectedPlaces, setSelectedPlaces] = useState<any[]>([])
  const [workflowDraft, setWorkflowDraft] = useState<any | null>(null)

  useEffect(() => {
    fetchTrips()

    const storedPlaces = sessionStorage.getItem('selectedPlaces')
    if (storedPlaces) {
      const places = JSON.parse(storedPlaces)
      setSelectedPlaces(places)
      setShowAIGenerator(true)
      sessionStorage.removeItem('selectedPlaces')
    }

    const storedWorkflowDraft = sessionStorage.getItem('tripPlannerWorkflowDraft')
    if (storedWorkflowDraft) {
      try {
        setWorkflowDraft(JSON.parse(storedWorkflowDraft))
      } catch (error) {
        console.error('Failed to parse planner workflow draft:', error)
      }
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

  const saveWorkflowDraft = async () => {
    if (!workflowDraft?.trip || savingDraft) {
      return
    }

    try {
      setSavingDraft(true)
      setSaveDraftError(null)
      const savedTrip = await tripService.createTrip({ ...workflowDraft.trip, userId: user?.id })
      if (savedTrip) {
        sessionStorage.removeItem('tripPlannerWorkflowDraft')
        setWorkflowDraft(null)
        await fetchTrips()
        navigate(`/trips/${savedTrip._id}`)
        return
      }

      setSaveDraftError('The draft could not be saved. Please try again.')
    } catch (error) {
      console.error('Failed to save workflow draft:', error)
      setSaveDraftError(error instanceof Error ? error.message : 'The draft could not be saved.')
    } finally {
      setSavingDraft(false)
    }
  }

  const dismissWorkflowDraft = () => {
    sessionStorage.removeItem('tripPlannerWorkflowDraft')
    setWorkflowDraft(null)
    setSaveDraftError(null)
  }

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
              AI Trip Plan Generator
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Generate a stronger trip plan from one focused brief.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/76 sm:text-lg sm:leading-8">
              We are keeping this simple: tell the planner where the trip goes, how long it is, your dates,
              budget, and a few practical preferences. AI then generates a trip plan you can save and refine.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={() => setShowAIGenerator(true)}
                className="rounded-xl bg-white px-6 py-3 text-slate-950 hover:bg-slate-100"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                New Plan
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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/70 px-4 py-8 backdrop-blur-sm sm:py-12">
          <AITripGenerator
            mode="modal"
            selectedPlaces={selectedPlaces}
            onTripGenerated={async (trip, brief) => {
              setSaveDraftError(null)
              setWorkflowDraft({ trip, brief })
              setShowAIGenerator(false)
              setSelectedPlaces([])
            }}
            onClose={() => {
              setShowAIGenerator(false)
              setSelectedPlaces([])
            }}
          />
        </div>
      )}

      {workflowDraft?.trip && (
        <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <Card className="overflow-hidden border-0 bg-white shadow-xl shadow-slate-200/70">
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
              <div>
                <div className="inline-flex items-center rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">
                  Fresh AI plan ready
                </div>
                <h2 className="mt-4 text-3xl font-semibold text-slate-900">
                  {workflowDraft.trip.tripTitle || workflowDraft.trip.destination}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  AI has generated a trip plan from your brief. Save it if it looks good, or open the trip brief again
                  to generate a different version with updated dates, budget, destination, or preferences.
                </p>
                <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
                  <span className="rounded-full bg-slate-100 px-3 py-1">{workflowDraft.trip.destination}</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1">{workflowDraft.trip.duration}</span>
                  {workflowDraft.brief?.travelStyle && (
                    <span className="rounded-full bg-slate-100 px-3 py-1">{workflowDraft.brief.travelStyle}</span>
                  )}
                  {workflowDraft.brief?.budget && (
                    <span className="rounded-full bg-slate-100 px-3 py-1">{workflowDraft.brief.budget} budget</span>
                  )}
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    onClick={saveWorkflowDraft}
                    disabled={savingDraft}
                    className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {savingDraft ? 'Saving draft...' : 'Save Draft'}
                  </Button>
                  <Button
                    onClick={() => setShowAIGenerator(true)}
                    variant="outline"
                    className="rounded-xl"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    New Plan
                  </Button>
                  <Button onClick={dismissWorkflowDraft} variant="ghost" className="rounded-xl text-slate-500 hover:text-slate-700">
                    Dismiss
                  </Button>
                </div>
                {saveDraftError && (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {saveDraftError}
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.5rem] bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Plan brief</p>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <p><span className="font-medium text-slate-900">Trip to:</span> {workflowDraft.brief?.destination || workflowDraft.trip.destination}</p>
                    <p><span className="font-medium text-slate-900">Dates:</span> {workflowDraft.brief?.startDate || 'Flexible start'} {workflowDraft.brief?.endDate ? `to ${workflowDraft.brief.endDate}` : ''}</p>
                    <p><span className="font-medium text-slate-900">Transport:</span> {workflowDraft.brief?.transportPreference || 'Balanced'}</p>
                    <p><span className="font-medium text-slate-900">Stay style:</span> {workflowDraft.brief?.stayPreference || 'Comfortable'}</p>
                  </div>
                </div>
                <div className="rounded-[1.5rem] bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">What to do next</p>
                  <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
                    <li>Save the draft when the plan structure feels right</li>
                    <li>Regenerate with different dates, budget, or stay style if needed</li>
                    <li>Open the saved trip to review itinerary details day by day</li>
                    <li>Use the trip detail page later for preparation and follow-up changes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <div className="mx-auto max-w-7xl px-4 py-10 sm:py-12">
        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-[360px] animate-pulse rounded-[1.75rem] bg-white shadow-sm ring-1 ring-slate-200/70" />
            ))}
          </div>
        ) : trips.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {trips.map((trip) => {
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
            <h3 className="mt-6 text-2xl font-semibold text-slate-900">No saved trip plans yet</h3>
            <p className="mx-auto mt-3 max-w-xl text-slate-600">
              Start with the trip brief above and let AI generate your first trip plan. Once you save one,
              it will appear here for quick access.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button onClick={() => setShowAIGenerator(true)} className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white">
                <Sparkles className="mr-2 h-4 w-4" />
                New Plan
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
