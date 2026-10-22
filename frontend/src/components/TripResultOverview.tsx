import React from 'react'
import { Heart, MapPin } from 'lucide-react'
import { Card, CardContent } from './Card'
import type { TripPlanResult } from '../types/tripPlan'

interface TripResultOverviewProps {
  plan: TripPlanResult
}

export const TripResultOverview: React.FC<TripResultOverviewProps> = ({ plan }) => (
  <Card className="border-slate-200 bg-white">
    <CardContent className="p-6 sm:p-8">
      <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#e96855]">
        Your personalized trip
      </p>
      <h1 className="font-heading mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
        {plan.tripTitle}
      </h1>
      <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
        {plan.tripSummary.shortDescription}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {plan.tripSummary.bestFor.slice(0, 3).map((preference) => (
          <span key={preference} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <Heart className="h-3.5 w-3.5" />{preference}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700">
          <MapPin className="h-3.5 w-3.5" />{plan.destination}
        </span>
      </div>
    </CardContent>
  </Card>
)
