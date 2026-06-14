import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  FolderHeart,
  MapPin,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { Button } from '../components/Button'
import { Card, CardContent } from '../components/Card'
import { useAuth } from '../contexts/AuthContext'
import { tripService, type TripPlan } from '../services/tripService'

const formatDate = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const SavedTripPlansPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [trips, setTrips] = useState<TripPlan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadTrips = async () => {
    if (!user) {
      setTrips([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      setTrips(await tripService.getUserTripPlans())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Saved trips could not be loaded.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadTrips()
  }, [user])

  const deleteTrip = async (tripId: string) => {
    if (!window.confirm('Delete this saved trip plan?')) return

    setDeletingId(tripId)
    setError(null)
    const deleted = await tripService.deleteTrip(tripId)
    if (deleted) {
      setTrips((current) => current.filter((trip) => trip._id !== tripId))
    } else {
      setError('The trip could not be deleted. Please try again.')
    }
    setDeletingId(null)
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6f7f4_0%,#ffffff_38%,#eef4f7_100%)]">
      <section className="bg-[#091523] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/70">
                <FolderHeart className="h-4 w-4 text-emerald-300" />
                Saved Trips
              </span>
              <h1 className="font-heading mt-5 text-4xl font-semibold sm:text-5xl">Your trip plans</h1>
              <p className="mt-3 max-w-2xl text-white/60">Open plans you saved from the smart trip dashboard.</p>
            </div>
            <div className="flex gap-3">
              <Button onClick={loadTrips} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <RefreshCw className="mr-2 h-4 w-4" />Refresh
              </Button>
              <Button onClick={() => navigate('/trips')} className="bg-[linear-gradient(135deg,#f47f6b,#fb923c)] text-white">
                <Plus className="mr-2 h-4 w-4" />New Plan
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {error && <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>}

        {isLoading ? (
          <div className="py-24 text-center">
            <RefreshCw className="mx-auto h-9 w-9 animate-spin text-[#e96855]" />
            <p className="mt-4 font-semibold text-slate-600">Loading saved trips...</p>
          </div>
        ) : trips.length === 0 ? (
          <Card className="border-slate-200 bg-white">
            <CardContent className="p-10 text-center sm:p-16">
              <FolderHeart className="mx-auto h-12 w-12 text-slate-300" />
              <h2 className="font-heading mt-5 text-3xl font-semibold text-slate-950">No saved trips yet</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-600">
                Generate a smart plan, then choose Save Trip Plan to keep it here.
              </p>
              <Link to="/trips">
                <Button className="mt-6 bg-slate-950 text-white">Create a Trip Plan<ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {trips.map((trip) => (
              <Card key={trip._id} className="overflow-hidden border-slate-200 bg-white">
                {trip.coverImageUrl && <img src={trip.coverImageUrl} alt="" className="h-40 w-full object-cover" />}
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                        {trip.planningStatus || 'draft'}
                      </span>
                      <h2 className="font-heading mt-3 text-2xl font-semibold text-slate-950">{trip.tripTitle}</h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteTrip(trip._id)}
                      disabled={deletingId === trip._id}
                      aria-label={`Delete ${trip.tripTitle}`}
                      className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-5 space-y-2 text-sm text-slate-600">
                    <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#e96855]" />{trip.destination}</p>
                    <p className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-sky-600" />{trip.duration}</p>
                    {trip.startDate && (
                      <p className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-emerald-600" />
                        {formatDate(trip.startDate)}{trip.endDate ? ` - ${formatDate(trip.endDate)}` : ''}
                      </p>
                    )}
                  </div>

                  {trip.budgetRange && <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">{trip.budgetRange}</p>}

                  <Button onClick={() => navigate(`/trips/${trip._id}`)} className="mt-6 w-full bg-slate-950 text-white">
                    Open Trip<ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
