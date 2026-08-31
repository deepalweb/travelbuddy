import React, { useState } from 'react'
import { AlertTriangle, ChevronDown, Clock, ExternalLink, MapPin } from 'lucide-react'
import { Card, CardContent } from './Card'
import type { TripActivity, TripPlanDay } from '../types/tripPlan'

interface TripDayCardProps {
  day: TripPlanDay
  defaultExpanded?: boolean
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

const ActivityBlock = ({ activity }: { activity: TripActivity }) => (
  <div className="border-l-2 border-slate-200 pl-4">
    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-700">
      {activity.timeOfDay}
      {activity.timeWindow ? ` · ${activity.timeWindow}` : ''}
    </span>
    <h4 className="mt-1 text-sm font-semibold text-slate-950">{activity.title}</h4>
    <p className="mt-1 text-xs leading-5 text-slate-600">{activity.description}</p>

    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
      <span>{activity.estimatedDuration}</span>
      {activity.travelTimeFromPrevious && <span>Transfer: {activity.travelTimeFromPrevious}</span>}
      {activity.costNote && <span>{activity.costNote}</span>}
      {activity.reservationAdvice && activity.reservationAdvice !== 'unknown' && (
        <span className="capitalize">{activity.reservationAdvice}</span>
      )}
    </div>

    {activity.transportAdvice && (
      <p className="mt-2 text-xs leading-5 text-slate-600">
        <strong className="text-slate-900">Getting there:</strong> {activity.transportAdvice}
      </p>
    )}
    {activity.localTip && (
      <p className="mt-1 text-xs leading-5 text-emerald-700">
        <strong>Local tip:</strong> {activity.localTip}
      </p>
    )}
    {activity.tips.length > 0 && <p className="mt-1 text-xs leading-5 text-slate-500">{activity.tips.join(' · ')}</p>}

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
)

export const TripDayCard: React.FC<TripDayCardProps> = ({ day, defaultExpanded = false }) => {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const panelId = `trip-day-${day.day}-details`

  return (
    <Card className="overflow-hidden border-slate-200 bg-white">
      <CardContent className="p-5 sm:p-6">
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="flex w-full items-start justify-between gap-4 text-left"
          aria-expanded={expanded}
          aria-controls={panelId}
        >
          <div className="flex min-w-0 gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold text-white">
              D{day.day}
            </span>
            <div className="min-w-0">
              <h3 className="font-heading text-lg font-semibold text-slate-950">{day.title}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">{day.theme}</p>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />Starts {day.bestTimeToStart}</span>
                <span>{energyLabel[day.energyLevel]}</span>
                <span>{walkingLabel[day.walkingLevel]}</span>
                <span>{day.estimatedCostRange}</span>
              </div>
            </div>
          </div>
          <span className="flex shrink-0 items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="hidden sm:inline">{expanded ? 'Hide details' : `${day.activities.length} activities`}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </span>
        </button>

        {expanded && (
          <div id={panelId} className="mt-5 space-y-5 border-t border-slate-100 pt-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold text-slate-500">Why this day works</p>
                <p className="mt-1 text-xs leading-5 text-slate-800">{day.whyThisDayWorks}</p>
              </div>
              {day.routeLogic && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-500">Route logic</p>
                  <p className="mt-1 text-xs leading-5 text-slate-800">{day.routeLogic}</p>
                </div>
              )}
            </div>

            <div className="space-y-5">
              {day.activities.map((activity, index) => (
                <ActivityBlock key={`${activity.timeOfDay}-${activity.title}-${index}`} activity={activity} />
              ))}
            </div>

            {(day.mealSuggestions || day.weatherBackup) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {day.mealSuggestions && Object.values(day.mealSuggestions).some(Boolean) && (
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[11px] font-semibold text-slate-500">Meal rhythm</p>
                    <div className="mt-2 space-y-1 text-xs text-slate-800">
                      {Object.entries(day.mealSuggestions).filter(([, value]) => value).map(([meal, value]) => (
                        <p key={meal}><strong className="capitalize">{meal}:</strong> {value}</p>
                      ))}
                    </div>
                  </div>
                )}
                {day.weatherBackup && (
                  <div className="rounded-xl bg-sky-50 p-4 text-xs leading-5 text-sky-950">
                    <strong>Weather backup:</strong> {day.weatherBackup}
                  </div>
                )}
              </div>
            )}

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
