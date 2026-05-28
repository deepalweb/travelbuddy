import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, CircleOff, Flag, HeartHandshake, ListFilter, MapPin, Sparkles, TimerReset } from 'lucide-react'
import { PlannerWorkspaceNav } from '../components/PlannerWorkspaceNav'
import { Card, CardContent } from '../components/Card'
import { Button } from '../components/Button'

type WorkflowDraft = {
  brief?: any
  trip?: any
}

const priorityWeight = (activity: any, index: number) => {
  let score = 0
  const priority = String(activity?.priority || '').toLowerCase()
  const type = String(activity?.activityType || '').toLowerCase()
  const title = String(activity?.activityTitle || '').toLowerCase()

  if (priority.includes('highest')) score += 10
  else if (priority.includes('high')) score += 7
  else if (priority.includes('medium')) score += 4

  if (/sightseeing|temple|stupa|museum|pilgrimage|monastery|site|ruins/.test(type)) score += 4
  if (/lunch|dinner|breakfast|meal|cafe|restaurant/.test(type)) score -= 2
  if (/sunset|viewpoint|must/.test(title)) score += 2
  score += Math.max(0, 3 - index)

  return score
}

export const TripPrioritiesPage: React.FC = () => {
  const [workflowDraft, setWorkflowDraft] = useState<WorkflowDraft | null>(null)

  useEffect(() => {
    const storedDraft = sessionStorage.getItem('tripPlannerWorkflowDraft')
    if (!storedDraft) return

    try {
      setWorkflowDraft(JSON.parse(storedDraft))
    } catch (error) {
      console.error('Failed to parse trip priority workflow draft:', error)
    }
  }, [])

  const trip = workflowDraft?.trip
  const dailyItinerary = trip?.dailyItinerary || []

  const analysis = useMemo(() => {
    if (!trip?.dailyItinerary?.length) {
      return null
    }

    const allActivities = trip.dailyItinerary.flatMap((day: any) => day.activities || [])
    const sorted = allActivities
      .map((activity: any, index: number) => ({
        ...activity,
        score: priorityWeight(activity, index),
      }))
      .sort((left: any, right: any) => right.score - left.score)

    return {
      anchors: sorted.slice(0, 5),
      optional: sorted.slice(-4).reverse(),
      mealStops: sorted.filter((activity: any) => /meal|restaurant|cafe|lunch|dinner|breakfast/.test(String(activity.activityType || '').toLowerCase())).slice(0, 4),
    }
  }, [trip])

  if (!trip) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_44%,#f8fafc_100%)]">
        <PlannerWorkspaceNav />
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-10 text-center">
              <Flag className="mx-auto h-12 w-12 text-sky-600" />
              <h1 className="mt-5 text-3xl font-semibold text-slate-900">Priorities work best after a draft exists</h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Generate a trip first, then use `Prioritize` to see what absolutely deserves your time, what can
                be optional, and which stops mainly support pacing rather than define the trip.
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
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_42%,#f8fafc_100%)]">
      <PlannerWorkspaceNav />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr]">
          <div>
            <div className="inline-flex items-center rounded-full bg-sky-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-800">
              Must-Do / Skip Analyzer
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              See what the traveler should protect first if time gets tight.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              This page turns a saved draft into clearer decisions: what the trip is really about, what mainly
              supports pacing, and what can be dropped without damaging the experience.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Core anchors</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{analysis?.anchors.length || 0}</p>
                </CardContent>
              </Card>
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Flexible stops</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{analysis?.optional.length || 0}</p>
                </CardContent>
              </Card>
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Food stops</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">{analysis?.mealStops.length || 0}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border-slate-200 bg-slate-950 text-white shadow-lg shadow-slate-200/50">
            <CardContent className="p-7">
              <div className="flex items-center gap-3">
                <HeartHandshake className="h-6 w-6 text-rose-300" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Traveler-first lens</p>
                  <h2 className="mt-1 text-2xl font-semibold">If one day breaks, what matters most?</h2>
                </div>
              </div>
              <ul className="mt-6 space-y-3 text-sm leading-7 text-white/75">
                <li>Protect the anchors before protecting convenience stops.</li>
                <li>Meals can move; iconic landmarks usually define memory and satisfaction.</li>
                <li>Optional stops are valuable when energy, weather, and timing stay on your side.</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Protect these first
              </div>
              <div className="mt-5 space-y-4">
                {analysis?.anchors.map((activity: any, index: number) => (
                  <div key={`${activity.placeName}-${index}`} className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{activity.placeName || activity.activityTitle}</h3>
                        <p className="mt-1 text-sm text-slate-600">{activity.activityTitle}</p>
                        {activity.notes && <p className="mt-2 text-sm leading-6 text-slate-600">{activity.notes}</p>}
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">Anchor</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                <CircleOff className="h-4 w-4 text-amber-600" />
                Cut first if needed
              </div>
              <div className="mt-5 space-y-4">
                {analysis?.optional.map((activity: any, index: number) => (
                  <div key={`${activity.placeName}-${index}`} className="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{activity.placeName || activity.activityTitle}</h3>
                        <p className="mt-1 text-sm text-slate-600">{activity.activityTitle}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          More flexible for weather, fatigue, or time compression than the main anchors.
                        </p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Optional</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            {
              title: 'Must-do vs support',
              description: 'Separate memory-making stops from the stops that mainly make pacing smoother.',
              icon: Flag,
            },
            {
              title: 'Short-trip cuts',
              description: 'Protect the best parts first if the traveler loses half a day or arrives tired.',
              icon: TimerReset,
            },
            {
              title: 'Mood alignment',
              description: 'Check whether the anchors really match the vibe the traveler wanted.',
              icon: Sparkles,
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

        <Card className="mt-10 border-slate-200 bg-white shadow-sm">
          <CardContent className="grid gap-6 p-6 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                <ListFilter className="h-4 w-4 text-sky-600" />
                Smart food role
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">Meal stops should support the trip, not quietly replace the reason for it.</h2>
            </div>
            <div className="space-y-3 text-sm leading-7 text-slate-600">
              {analysis?.mealStops.map((activity: any, index: number) => (
                <div key={`${activity.placeName}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-slate-900">{activity.activityTitle}</p>
                  <p className="text-slate-600">{activity.placeName || 'Meal stop'}</p>
                </div>
              ))}
              {!analysis?.mealStops.length && (
                <p>No explicit food stops were found in this draft yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
