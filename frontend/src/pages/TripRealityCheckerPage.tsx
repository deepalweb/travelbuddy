import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, CloudRain, LoaderCircle, MapPinned, ShieldAlert, Sparkles } from 'lucide-react'
import { PlannerWorkspaceNav } from '../components/PlannerWorkspaceNav'
import { Card, CardContent } from '../components/Card'
import { Button } from '../components/Button'

type WorkflowDraft = {
  brief?: any
  trip?: any
}

const scoreDayRisk = (day: any) => {
  const activities = day?.activities || []
  const activityCount = activities.length
  const mealCount = activities.filter((activity: any) => /meal|restaurant|cafe|lunch|dinner|breakfast/.test(String(activity.activityType || '').toLowerCase())).length
  const hasWeatherBackup = Boolean(day?.weatherBackup)
  const travelText = String(day?.estimatedTravelTime || '').toLowerCase()
  const hasLongTravel = /2|3|4|5/.test(travelText) || /long/.test(travelText)

  let risk = 0
  if (activityCount >= 6) risk += 2
  if (mealCount >= 2 && activityCount >= 6) risk += 1
  if (hasLongTravel) risk += 2
  if (!hasWeatherBackup) risk += 1

  return risk
}

export const TripRealityCheckerPage: React.FC = () => {
  const [workflowDraft, setWorkflowDraft] = useState<WorkflowDraft | null>(null)

  useEffect(() => {
    const storedDraft = sessionStorage.getItem('tripPlannerWorkflowDraft')
    if (!storedDraft) return

    try {
      setWorkflowDraft(JSON.parse(storedDraft))
    } catch (error) {
      console.error('Failed to parse trip reality workflow draft:', error)
    }
  }, [])

  const trip = workflowDraft?.trip

  const reality = useMemo(() => {
    if (!trip?.dailyItinerary?.length) {
      return null
    }

    const dayChecks = trip.dailyItinerary.map((day: any) => {
      const risk = scoreDayRisk(day)
      return {
        day: day.day,
        theme: day.theme,
        risk,
        activityCount: (day.activities || []).length,
        weatherBackup: day.weatherBackup,
        travel: day.estimatedTravelTime || 'Not stated',
      }
    })

    const warnings: string[] = []
    const highRiskDays = dayChecks.filter((day: any) => day.risk >= 3)
    const mediumRiskDays = dayChecks.filter((day: any) => day.risk === 2)

    if (highRiskDays.length > 0) {
      warnings.push(`${highRiskDays.length} day(s) look packed enough to create fatigue or rushed sightseeing.`)
    }
    if (mediumRiskDays.length > 0) {
      warnings.push(`${mediumRiskDays.length} day(s) may still need timing cleanup or lighter transitions.`)
    }
    if (trip.dailyItinerary.some((day: any) => !day.weatherBackup)) {
      warnings.push('At least one day is missing a weather backup path.')
    }
    if (!warnings.length) {
      warnings.push('No major structural risks were detected from the current draft.')
    }

    return {
      dayChecks,
      warnings,
      readiness: Math.max(55, 100 - dayChecks.reduce((sum: number, day: any) => sum + (day.risk * 8), 0)),
    }
  }, [trip])

  if (!trip) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_44%,#f8fafc_100%)]">
        <PlannerWorkspaceNav />
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-10 text-center">
              <ShieldAlert className="mx-auto h-12 w-12 text-amber-600" />
              <h1 className="mt-5 text-3xl font-semibold text-slate-900">Reality checks start after a draft exists</h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Generate a trip first, then use `Reality` to flag overloaded days, weak weather backups,
                long-transfer risk, and practical issues that generic AI text often hides.
              </p>
              <Link to="/trips" className="mt-6 inline-flex">
                <Button className="bg-slate-900 text-white hover:bg-slate-800">
                  Start from Plan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffdf7_0%,#ffffff_42%,#f8fafc_100%)]">
      <PlannerWorkspaceNav />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr]">
          <div>
            <div className="inline-flex items-center rounded-full bg-amber-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">
              Trip Reality Checker
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Stress-test the draft before the traveler trusts it.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              This screen focuses on realism: packed days, weak backup plans, long transfer risk, and the hidden
              friction that turns a pretty itinerary into a tiring trip.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Reality score</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{reality?.readiness || 0}%</p>
                </CardContent>
              </Card>
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Trip days</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{trip.dailyItinerary?.length || 0}</p>
                </CardContent>
              </Card>
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Warnings</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{reality?.warnings.length || 0}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border-slate-200 bg-slate-950 text-white shadow-lg shadow-slate-200/50">
            <CardContent className="p-7">
              <div className="flex items-center gap-3">
                <LoaderCircle className="h-6 w-6 text-amber-300" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Why this matters</p>
                  <h2 className="mt-1 text-2xl font-semibold">A useful plan is not the same as a pretty plan.</h2>
                </div>
              </div>
              <ul className="mt-6 space-y-3 text-sm leading-7 text-white/75">
                <li>Travelers usually regret rushed pacing more than they regret skipping one stop.</li>
                <li>Backup logic matters when heat, rain, crowds, or low energy change the day.</li>
                <li>The goal is fewer bad surprises, not a longer itinerary.</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                What needs attention
              </div>
              <div className="mt-5 space-y-3">
                {reality?.warnings.map((warning, index) => (
                  <div key={index} className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-sm leading-7 text-slate-700">
                    {warning}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                <MapPinned className="h-4 w-4 text-sky-600" />
                Day-by-day stress check
              </div>
              <div className="mt-5 space-y-4">
                {reality?.dayChecks.map((day: any) => {
                  const tone =
                    day.risk >= 3
                      ? 'border-rose-200 bg-rose-50/70'
                      : day.risk === 2
                        ? 'border-amber-200 bg-amber-50/70'
                        : 'border-emerald-200 bg-emerald-50/70'
                  const badge =
                    day.risk >= 3 ? 'High risk' : day.risk === 2 ? 'Watch closely' : 'Looks workable'

                  return (
                    <div key={day.day} className={`rounded-2xl border p-4 ${tone}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">Day {day.day}: {day.theme}</h3>
                          <div className="mt-2 space-y-2 text-sm text-slate-600">
                            <p><span className="font-medium text-slate-900">Activities:</span> {day.activityCount}</p>
                            <p><span className="font-medium text-slate-900">Travel:</span> {day.travel}</p>
                            <p><span className="font-medium text-slate-900">Weather backup:</span> {day.weatherBackup || 'Missing'}</p>
                          </div>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">{badge}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            {
              title: 'Pacing risk',
              description: 'Flag days with too many stops or too much movement for a comfortable travel rhythm.',
              icon: Clock3,
            },
            {
              title: 'Weather resilience',
              description: 'Check whether the itinerary still works when heat or rain changes your timing.',
              icon: CloudRain,
            },
            {
              title: 'Confidence before booking',
              description: 'Treat this as a sanity check before travelers commit money or energy.',
              icon: CheckCircle2,
            },
          ].map((item) => {
            const Icon = item.icon
            return (
              <Card key={item.title} className="border-slate-200 bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-slate-900">{item.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
