import React, { useMemo, useState } from 'react'
import { Calendar, Compass, DollarSign, MapPin, NotebookPen, Sparkles, Users, X } from 'lucide-react'
import { Button } from './Button'
import { Card, CardContent, CardHeader, CardTitle } from './Card'

interface ActivityItem {
  activityTitle: string
}

interface DayPlanInput {
  day: number
  theme: string
  activities: ActivityItem[]
}

interface TripFormData {
  tripTitle: string
  destination: string
  duration: string
  startDate?: string
  endDate?: string
  travelers?: string
  budgetRange?: string
  travelStyle?: string
  notes?: string
  planningStatus?: 'draft' | 'ready' | 'booked'
  dailyItinerary: Array<{
    day: number
    date: string
    theme: string
    activities: Array<{
      timeSlot: string
      activityType: string
      activityTitle: string
      details: string
      cost: string
      notes: string
      isVisited: boolean
      imageUrl?: string
    }>
  }>
  dailyPlans: Array<{
    day: number
    title: string
    activities: string[]
  }>
}

interface TripFormProps {
  onSubmit: (tripData: TripFormData) => void
  onClose: () => void
}

const travelStyles = [
  { id: 'relaxed', label: 'Relaxed', desc: 'Fewer activities and more downtime' },
  { id: 'balanced', label: 'Balanced', desc: 'A mix of highlights and breathing room' },
  { id: 'packed', label: 'Action-packed', desc: 'Maximum experiences each day' },
] as const

const planningStatuses = [
  { id: 'draft', label: 'Draft', desc: 'Still shaping the trip' },
  { id: 'ready', label: 'Ready', desc: 'Mostly planned and reviewable' },
  { id: 'booked', label: 'Booked', desc: 'Bookings are underway or done' },
] as const

export const TripForm: React.FC<TripFormProps> = ({ onSubmit, onClose }) => {
  const [tripTitle, setTripTitle] = useState('')
  const [destination, setDestination] = useState('')
  const [days, setDays] = useState(3)
  const [startDate, setStartDate] = useState('')
  const [travelers, setTravelers] = useState('1')
  const [budgetRange, setBudgetRange] = useState('medium')
  const [travelStyle, setTravelStyle] = useState<'relaxed' | 'balanced' | 'packed'>('balanced')
  const [planningStatus, setPlanningStatus] = useState<'draft' | 'ready' | 'booked'>('draft')
  const [notes, setNotes] = useState('')
  const [dayPlans, setDayPlans] = useState<DayPlanInput[]>(
    Array.from({ length: 3 }, (_, index) => ({
      day: index + 1,
      theme: index === 0 ? 'Arrival and first highlights' : '',
      activities: [{ activityTitle: '' }, { activityTitle: '' }]
    }))
  )

  const syncDayPlans = (nextDays: number) => {
    setDayPlans((prev) => {
      const trimmed = prev.slice(0, nextDays)
      const padded = Array.from({ length: nextDays - trimmed.length }, (_, index) => ({
        day: trimmed.length + index + 1,
        theme: '',
        activities: [{ activityTitle: '' }, { activityTitle: '' }]
      }))

      return [...trimmed, ...padded].map((day, index) => ({
        ...day,
        day: index + 1
      }))
    })
  }

  const updateTheme = (dayIndex: number, value: string) => {
    setDayPlans((prev) =>
      prev.map((day, index) => (index === dayIndex ? { ...day, theme: value } : day))
    )
  }

  const updateActivity = (dayIndex: number, activityIndex: number, value: string) => {
    setDayPlans((prev) =>
      prev.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              activities: day.activities.map((activity, idx) =>
                idx === activityIndex ? { activityTitle: value } : activity
              )
            }
          : day
      )
    )
  }

  const addActivity = (dayIndex: number) => {
    setDayPlans((prev) =>
      prev.map((day, index) =>
        index === dayIndex
          ? { ...day, activities: [...day.activities, { activityTitle: '' }] }
          : day
      )
    )
  }

  const removeActivity = (dayIndex: number, activityIndex: number) => {
    setDayPlans((prev) =>
      prev.map((day, index) =>
        index === dayIndex
          ? {
              ...day,
              activities:
                day.activities.length > 1
                  ? day.activities.filter((_, idx) => idx !== activityIndex)
                  : day.activities
            }
          : day
      )
    )
  }

  const plannerCompletion = useMemo(() => {
    let score = 0
    if (tripTitle.trim()) score += 15
    if (destination.trim()) score += 15
    if (startDate) score += 15
    if (notes.trim()) score += 10
    if (dayPlans.some((day) => day.theme.trim())) score += 15
    if (dayPlans.every((day) => day.activities.some((activity) => activity.activityTitle.trim()))) score += 30
    return score
  }, [dayPlans, destination, notes, startDate, tripTitle])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!tripTitle.trim() || !destination.trim()) {
      return
    }

    const cleanedDays = dayPlans.map((day) => ({
      ...day,
      theme: day.theme.trim() || `Day ${day.day} plans`,
      activities: day.activities.filter((activity) => activity.activityTitle.trim())
    }))

    const durationLabel = `${days} ${days === 1 ? 'day' : 'days'}`
    const endDate =
      startDate && days > 0
        ? new Date(new Date(startDate).getTime() + (days - 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
        : undefined

    onSubmit({
      tripTitle: tripTitle.trim(),
      destination: destination.trim(),
      duration: durationLabel,
      startDate,
      endDate,
      travelers,
      budgetRange,
      travelStyle,
      notes: notes.trim(),
      planningStatus,
      dailyItinerary: cleanedDays.map((day) => ({
        day: day.day,
        date: startDate ? new Date(new Date(startDate).getTime() + (day.day - 1) * 24 * 60 * 60 * 1000).toDateString() : `Day ${day.day}`,
        theme: day.theme,
        activities: day.activities.map((activity, index) => ({
          timeSlot: index === 0 ? 'Morning' : index === 1 ? 'Afternoon' : 'Flexible',
          activityType: 'Plan',
          activityTitle: activity.activityTitle.trim(),
          details: '',
          cost: 'TBD',
          notes: '',
          isVisited: false,
        }))
      })),
      dailyPlans: cleanedDays.map((day) => ({
        day: day.day,
        title: day.theme,
        activities: day.activities.map((activity) => activity.activityTitle.trim())
      }))
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <Card className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border-0 bg-white shadow-2xl">
        <CardHeader className="border-b border-slate-100 bg-[linear-gradient(135deg,#07111f_0%,#163d7a_55%,#4f46e5_100%)] text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                Manual Trip Builder
              </div>
              <CardTitle className="mt-4 text-3xl font-semibold text-white">
                Build a trip draft you can actually continue with
              </CardTitle>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
                Start with the essentials, outline each day, and save a cleaner planning draft before
                you move into detailed itinerary work.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-10 w-10 rounded-full border-white/20 bg-white/10 p-0 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="grid gap-8 p-6 lg:grid-cols-[0.72fr_1.28fr] lg:p-8">
          <aside className="space-y-5">
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Planner health</p>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-3xl font-semibold text-slate-900">{plannerCompletion}%</p>
                  <p className="text-sm text-slate-600">Draft completeness</p>
                </div>
                <Sparkles className="h-8 w-8 text-indigo-500" />
              </div>
              <div className="mt-4 h-2 rounded-full bg-slate-200">
                <div className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-600" style={{ width: `${plannerCompletion}%` }} />
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">What this saves</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <li>Trip basics like destination, dates, group size, budget, and pace</li>
                <li>A day-by-day planning skeleton instead of one large unstructured note</li>
                <li>A planning stage so the dashboard can show whether this trip is still a draft or nearly ready</li>
              </ul>
            </div>
          </aside>

          <form onSubmit={handleSubmit} className="space-y-7">
            <section className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Trip title</label>
                <div className="relative">
                  <NotebookPen className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={tripTitle}
                    onChange={(e) => setTripTitle(e.target.value)}
                    placeholder="Tokyo food and neighborhoods"
                    className="w-full rounded-2xl border border-slate-300 px-11 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Destination</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Tokyo, Japan"
                    className="w-full rounded-2xl border border-slate-300 px-11 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    required
                  />
                </div>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Start date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-11 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Trip length</label>
                <select
                  value={days}
                  onChange={(e) => {
                    const nextDays = Number(e.target.value)
                    setDays(nextDays)
                    syncDayPlans(nextDays)
                  }}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  {[1, 2, 3, 4, 5, 7, 10, 14].map((value) => (
                    <option key={value} value={value}>{value} {value === 1 ? 'day' : 'days'}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Travelers</label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    value={travelers}
                    onChange={(e) => setTravelers(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-11 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="1">Solo</option>
                    <option value="2">Couple</option>
                    <option value="3-4">Small group</option>
                    <option value="5+">Large group</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Budget</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    value={budgetRange}
                    onChange={(e) => setBudgetRange(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 px-11 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="low">Budget</option>
                    <option value="medium">Mid-range</option>
                    <option value="high">Premium</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <div>
                <p className="mb-3 text-sm font-medium text-slate-700">Travel style</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {travelStyles.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setTravelStyle(style.id)}
                      className={`rounded-2xl border p-4 text-left transition-all ${travelStyle === style.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
                    >
                      <div className="font-semibold">{style.label}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-500">{style.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm font-medium text-slate-700">Planning stage</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {planningStatuses.map((status) => (
                    <button
                      key={status.id}
                      type="button"
                      onClick={() => setPlanningStatus(status.id)}
                      className={`rounded-2xl border p-4 text-left transition-all ${planningStatus === status.id ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
                    >
                      <div className="font-semibold">{status.label}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-500">{status.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center gap-2">
                <Compass className="h-4 w-4 text-indigo-500" />
                <h3 className="text-lg font-semibold text-slate-900">Day-by-day outline</h3>
              </div>
              <div className="space-y-4">
                {dayPlans.map((day, dayIndex) => (
                  <div key={day.day} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Day {day.day}</p>
                        <p className="text-xs text-slate-500">Add a theme and a few anchor activities</p>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={day.theme}
                      onChange={(e) => updateTheme(dayIndex, e.target.value)}
                      placeholder={`Day ${day.day} theme`}
                      className="mb-3 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                    <div className="space-y-2.5">
                      {day.activities.map((activity, activityIndex) => (
                        <div key={activityIndex} className="flex gap-2">
                          <input
                            type="text"
                            value={activity.activityTitle}
                            onChange={(e) => updateActivity(dayIndex, activityIndex, e.target.value)}
                            placeholder="Add an activity or place"
                            className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => removeActivity(dayIndex, activityIndex)}
                            className="rounded-2xl"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addActivity(dayIndex)}
                      className="mt-3 rounded-xl border-dashed"
                    >
                      Add activity
                    </Button>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <label className="mb-2 block text-sm font-medium text-slate-700">Planning notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Anything important for this trip: must-see ideas, pace concerns, booking reminders, accessibility notes..."
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </section>

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl py-3">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 py-3 text-white hover:from-sky-700 hover:to-indigo-700">
                Save Trip Draft
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
