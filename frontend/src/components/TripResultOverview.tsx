import React from 'react'
import { AlertTriangle, Check, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Card, CardContent } from './Card'
import type { TripPlanResult } from '../types/tripPlan'

interface TripResultOverviewProps {
  plan: TripPlanResult
}

const healthTone: Record<TripPlanResult['tripHealth']['overall'], { label: string; className: string }> = {
  excellent: { label: 'Excellent fit', className: 'bg-emerald-50 text-emerald-700' },
  good: { label: 'Good fit', className: 'bg-sky-50 text-sky-700' },
  average: { label: 'Workable, with tradeoffs', className: 'bg-amber-50 text-amber-700' },
  risky: { label: 'Risky as planned', className: 'bg-rose-50 text-rose-700' },
}

const ScoreRing = ({ score }: { score: number }) => {
  const safeScore = Math.max(0, Math.min(100, Math.round(score)))
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const color = safeScore >= 75 ? '#059669' : safeScore >= 50 ? '#d97706' : '#e11d48'

  return (
    <svg className="h-[88px] w-[88px] shrink-0" viewBox="0 0 88 88" role="img" aria-label={`Planning confidence ${safeScore} percent`}>
      <circle cx="44" cy="44" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
      <circle cx="44" cy="44" r={radius} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - (safeScore / 100) * circumference} transform="rotate(-90 44 44)" />
      <text x="44" y="41" textAnchor="middle" fontSize="20" fontWeight="700" fill="#0f172a">{safeScore}</text>
      <text x="44" y="56" textAnchor="middle" fontSize="9" fill="#64748b">confidence</text>
    </svg>
  )
}

export const TripResultOverview: React.FC<TripResultOverviewProps> = ({ plan }) => {
  const health = healthTone[plan.tripHealth.overall]
  const scoreItems = plan.scoreBreakdown ? [
    { label: 'Budget fit', value: plan.scoreBreakdown.budgetFit },
    { label: 'Pace comfort', value: plan.scoreBreakdown.paceComfort },
    { label: 'Route logic', value: plan.scoreBreakdown.routeLogic },
    { label: 'Destination match', value: plan.scoreBreakdown.destinationMatch },
    { label: 'Content confidence', value: plan.scoreBreakdown.contentConfidence },
  ] : []

  return (
    <Card className="border-slate-200 bg-white">
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <ScoreRing score={plan.planningConfidenceScore} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-2xl font-semibold text-slate-950">{plan.tripTitle}</h2>
              <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${health.className}`}>{health.label}</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">{plan.tripSummary.shortDescription}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {plan.tripSummary.bestFor.length > 0 && (
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" />Best for</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{plan.tripSummary.bestFor.join(', ')}</p>
            </div>
          )}
          {plan.tripSummary.notIdealFor.length > 0 && (
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="flex items-center gap-2 text-xs font-semibold text-amber-700"><ShieldAlert className="h-4 w-4" />Not ideal for</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">{plan.tripSummary.notIdealFor.join(', ')}</p>
            </div>
          )}
        </div>

        {scoreItems.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {scoreItems.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500"><span>{item.label}</span><strong>{Math.round(item.value)}</strong></div>
                <div className="mt-1.5 h-1.5 rounded-full bg-slate-200"><div className="h-1.5 rounded-full bg-sky-700" style={{ width: `${Math.max(4, Math.min(100, item.value))}%` }} /></div>
              </div>
            ))}
          </div>
        )}

        {plan.scoreBreakdown?.scoreReasoning && (
          <p className="mt-5 border-l-2 border-sky-600 pl-4 text-xs leading-5 text-slate-600">{plan.scoreBreakdown.scoreReasoning}</p>
        )}

        {(plan.realityCheck.warnings.length > 0 || plan.realityCheck.recommendations.length > 0) && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {plan.realityCheck.warnings.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold text-amber-800"><AlertTriangle className="h-4 w-4" />Reality check</p>
                <p className="mt-2 text-xs leading-5 text-amber-950">{plan.realityCheck.summary}</p>
                {plan.realityCheck.warnings.map((warning) => <p key={warning} className="mt-2 text-xs leading-5 text-amber-900">{warning}</p>)}
              </div>
            )}
            {plan.realityCheck.recommendations.length > 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold text-emerald-800"><Check className="h-4 w-4" />Recommended adjustments</p>
                {plan.realityCheck.recommendations.map((item) => <p key={item} className="mt-2 text-xs leading-5 text-emerald-900">{item}</p>)}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
