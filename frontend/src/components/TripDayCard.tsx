import React, { useState } from 'react'
import {
  AlertTriangle,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  MapPin,
  Star,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  X
} from 'lucide-react'
import { Card, CardContent } from './Card'
import type { TripActivity, TripPlanDay } from '../types/tripPlan'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const placePhotoUrl = (photoReference: string) =>
  `${API_BASE_URL}/api/places/photo?ref=${encodeURIComponent(photoReference)}&w=160`

interface TripDayCardProps {
  day: TripPlanDay
  defaultExpanded?: boolean
  onAddStop?: (dayNumber: number, newActivity: TripActivity) => void
  onRemoveStop?: (dayNumber: number, activityIndex: number) => void
  onMoveStop?: (dayNumber: number, activityIndex: number, direction: 'up' | 'down') => void
}

const energyLabel: Record<TripPlanDay['energyLevel'], string> = {
  easy: 'Easy',
  moderate: 'Moderate',
  high: 'High energy',
}

const walkingLabel: Record<TripPlanDay['walkingLevel'], string> = {
  low: 'Low walking',
  medium: 'Moderate walking',
  high: 'High walking',
}

export const TripDayCard: React.FC<TripDayCardProps> = ({
  day,
  defaultExpanded = true,
  onAddStop,
  onRemoveStop,
  onMoveStop,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPlaceName, setNewPlaceName] = useState('')
  const [newTimeOfDay, setNewTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning')
  const [newDuration, setNewDuration] = useState('1 - 2 hours')
  const [newNotes, setNewNotes] = useState('')

  const panelId = `trip-day-${day.day}-details`

  const handleCreateStop = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlaceName.trim() || !onAddStop) return

    const newActivity: TripActivity = {
      stopId: `stop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timeOfDay: newTimeOfDay,
      title: `Visit ${newPlaceName.trim()}`,
      placeName: newPlaceName.trim(),
      description: newNotes.trim() || `Visit to ${newPlaceName.trim()}`,
      type: 'attraction',
      priority: 'recommended',
      estimatedDuration: newDuration,
      tips: [],
      groundingSource: 'ai_estimated'
    }

    onAddStop(day.day, newActivity)
    setNewPlaceName('')
    setNewNotes('')
    setShowAddForm(false)
  }

  return (
    <Card className="overflow-hidden border-slate-200 bg-white">
      <CardContent className="p-5 sm:p-6">
        <div className="flex w-full items-start justify-between gap-4">
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="flex flex-1 items-start gap-3 text-left"
            aria-expanded={expanded}
            aria-controls={panelId}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-white">
              D{day.day}
            </span>
            <div className="min-w-0">
              <h3 className="font-heading text-lg font-semibold text-slate-950">{day.title}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">{day.theme}</p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />Starts {day.bestTimeToStart}
                </span>
                <span>{energyLabel[day.energyLevel]}</span>
                <span>{walkingLabel[day.walkingLevel]}</span>
              </div>
            </div>
          </button>

          <div className="flex shrink-0 items-center gap-2">
            {onAddStop && (
              <button
                type="button"
                onClick={() => {
                  setExpanded(true)
                  setShowAddForm(true)
                }}
                className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add stop</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="p-1 text-slate-400 hover:text-slate-600"
              aria-label={expanded ? 'Collapse day' : 'Expand day'}
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {expanded && (
          <div id={panelId} className="mt-5 space-y-5 border-t border-slate-100 pt-5">
            {/* Add Stop Form */}
            {showAddForm && (
              <form onSubmit={handleCreateStop} className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Add new stop to Day {day.day}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700">Place or Activity Name:</label>
                    <input
                      type="text"
                      required
                      value={newPlaceName}
                      onChange={(e) => setNewPlaceName(e.target.value)}
                      placeholder="e.g. National Botanical Gardens, Joe's Diner"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Time of Day:</label>
                    <select
                      value={newTimeOfDay}
                      onChange={(e) => setNewTimeOfDay(e.target.value as any)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-emerald-600 focus:outline-none"
                    >
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="evening">Evening</option>
                      <option value="night">Night</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Estimated Duration:</label>
                    <input
                      type="text"
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                      placeholder="e.g. 1 - 2 hours"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-emerald-600 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700">Notes & Tips:</label>
                    <input
                      type="text"
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="e.g. Best time for photos, reserve terrace seating"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="rounded-lg px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-600 px-4 py-1 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    Add Stop
                  </button>
                </div>
              </form>
            )}

            {/* Activities List */}
            <div className="space-y-4">
              {day.activities.map((activity, index) => (
                <div
                  key={activity.stopId || `${activity.timeOfDay}-${activity.title}-${index}`}
                  className="group relative flex gap-3 rounded-xl border border-slate-100 p-3 pl-4 transition hover:border-slate-200"
                >
                  {/* Photo thumbnail */}
                  {activity.photoReference && (
                    <img
                      src={placePhotoUrl(activity.photoReference)}
                      alt={activity.placeName || activity.title}
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                      loading="lazy"
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-700">
                        {activity.timeOfDay}
                        {activity.timeWindow ? ` · ${activity.timeWindow}` : ''}
                      </span>
                      {activity.groundingSource === 'verified' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          <BadgeCheck className="h-3 w-3" />Verified place
                        </span>
                      )}
                      {typeof activity.rating === 'number' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
                          <Star className="h-3 w-3 fill-current" />{activity.rating.toFixed(1)}
                          {activity.userRatingsTotal ? ` (${activity.userRatingsTotal})` : ''}
                        </span>
                      )}
                    </div>

                    <h4 className="mt-1 text-base font-semibold text-slate-950">
                      {activity.placeName || activity.title}
                    </h4>

                    {activity.placeName && activity.title !== activity.placeName && (
                      <p className="mt-0.5 text-xs font-medium text-sky-700">{activity.title}</p>
                    )}
                    <p className="mt-1 text-xs leading-5 text-slate-600">{activity.description}</p>

                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                      <span>{activity.estimatedDuration}</span>
                      {activity.travelTimeFromPrevious && <span>Transfer: {activity.travelTimeFromPrevious}</span>}
                      {activity.reservationAdvice && activity.reservationAdvice !== 'unknown' && (
                        <span className="capitalize">{activity.reservationAdvice}</span>
                      )}
                    </div>

                    {activity.localTip && (
                      <p className="mt-1 text-xs leading-5 text-emerald-700">
                        <strong>Local tip:</strong> {activity.localTip}
                      </p>
                    )}

                    {(activity.googleMapsUrl || activity.nearbySearchUrl) && (
                      <a
                        href={activity.googleMapsUrl || activity.nearbySearchUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700"
                      >
                        {activity.googleMapsUrl ? <MapPin className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
                        {activity.googleMapsUrl ? 'Open in Maps' : 'Search nearby'}
                      </a>
                    )}
                  </div>

                  {/* Reorder and Delete Controls */}
                  <div className="flex shrink-0 flex-col items-center justify-between gap-1 pl-2">
                    <div className="flex flex-col gap-1">
                      {onMoveStop && index > 0 && (
                        <button
                          type="button"
                          onClick={() => onMoveStop(day.day, index, 'up')}
                          title="Move stop up"
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {onMoveStop && index < day.activities.length - 1 && (
                        <button
                          type="button"
                          onClick={() => onMoveStop(day.day, index, 'down')}
                          title="Move stop down"
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {onRemoveStop && day.activities.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onRemoveStop(day.day, index)}
                        title="Remove stop"
                        className="rounded p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {day.dayWarnings.length > 0 && (
              <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-4">
                {day.dayWarnings.map((warning) => (
                  <p key={warning} className="flex items-start gap-2 text-xs text-rose-800">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{warning}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
