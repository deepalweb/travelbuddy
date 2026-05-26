import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bot,
  CarFront,
  CheckCircle2,
  Coins,
  GitCompareArrows,
  Hotel,
  MapPinned,
  Route,
  Sparkles,
} from 'lucide-react'
import { Button } from '../components/Button'
import { Card, CardContent } from '../components/Card'
import { PlannerWorkspaceNav } from '../components/PlannerWorkspaceNav'
import { tripService } from '../services/tripService'
import { useAuth } from '../contexts/AuthContext'

const destinationAlternatives: Record<string, string[]> = {
  sri: ['Galle', 'Ella', 'Kandy', 'Mirissa'],
  colombo: ['Galle', 'Bentota', 'Kandy', 'Negombo'],
  kandy: ['Ella', 'Nuwara Eliya', 'Sigiriya', 'Dambulla'],
  galle: ['Mirissa', 'Unawatuna', 'Bentota', 'Tangalle'],
}

const getDestinationSuggestions = (destination?: string, startingLocation?: string) => {
  const seed = `${destination || ''} ${startingLocation || ''}`.toLowerCase()
  const key = Object.keys(destinationAlternatives).find((item) => seed.includes(item))
  return key ? destinationAlternatives[key] : ['Kandy', 'Galle', 'Ella', 'Mirissa']
}

const buildEstimatedBudgetLabel = (baseBudget: string | undefined, budgetMode: string) => {
  if (!baseBudget) {
    return budgetMode === 'value' ? 'Trimmed for better value' : budgetMode === 'premium' ? 'Elevated comfort budget' : 'Balanced planning budget'
  }

  if (budgetMode === 'value') {
    return `${baseBudget} with budget-first tradeoffs`
  }

  if (budgetMode === 'premium') {
    return `${baseBudget} with upgraded comfort`
  }

  return `${baseBudget} tuned for balanced value`
}

export const PlanningComparePage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [workflowDraft, setWorkflowDraft] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [compareState, setCompareState] = useState({
    destinationChoice: '',
    budgetMode: 'balanced',
    transportMode: 'balanced',
    routeStyle: 'balanced',
    hotelStyle: 'comfortable',
    notes: '',
  })

  useEffect(() => {
    const storedDraft = sessionStorage.getItem('tripPlannerWorkflowDraft')
    if (!storedDraft) {
      return
    }

    try {
      const parsedDraft = JSON.parse(storedDraft)
      setWorkflowDraft(parsedDraft)
      setCompareState((prev) => ({
        ...prev,
        destinationChoice: parsedDraft.trip?.destination || parsedDraft.brief?.destination || '',
        transportMode: parsedDraft.brief?.transportPreference || 'balanced',
        hotelStyle: parsedDraft.brief?.stayPreference || 'comfortable',
      }))
    } catch (error) {
      console.error('Failed to parse compare workflow draft:', error)
    }
  }, [])

  const destinationSuggestions = useMemo(
    () => getDestinationSuggestions(workflowDraft?.trip?.destination, workflowDraft?.brief?.startingLocation),
    [workflowDraft]
  )

  const optimizationSummary = useMemo(() => {
    if (!workflowDraft) {
      return []
    }

    return [
      `AI will compare ${compareState.destinationChoice || workflowDraft.trip?.destination} against the original direction using your ${workflowDraft.brief?.duration || workflowDraft.trip?.duration || 'selected'} timeframe.`,
      `Transport will shift toward ${compareState.transportMode.replace('-', ' ')} options, with the route tuned for a ${compareState.routeStyle.replace('-', ' ')} experience.`,
      `Stay recommendations will lean ${compareState.hotelStyle}, and budget guidance will be adjusted for a ${compareState.budgetMode} planning style.`,
    ]
  }, [compareState, workflowDraft])

  const saveFinalPlan = async () => {
    if (!workflowDraft?.trip || saving) {
      return
    }

    try {
      setSaving(true)

      const updatedTrip = {
        ...workflowDraft.trip,
        destination: compareState.destinationChoice || workflowDraft.trip.destination,
        tripTitle: `${compareState.destinationChoice || workflowDraft.trip.destination} ${workflowDraft.trip.duration} Trip`,
        budgetRange: compareState.budgetMode,
        travelStyle: workflowDraft.brief?.travelStyle || workflowDraft.trip.travelStyle,
        notes: [
          workflowDraft.trip.notes,
          workflowDraft.brief?.notes,
          compareState.notes,
          `Compared with ${compareState.transportMode} transport, ${compareState.hotelStyle} stays, and a ${compareState.routeStyle} route.`,
        ]
          .filter(Boolean)
          .join(' '),
        tripOverview: {
          ...workflowDraft.trip.tripOverview,
          estimatedTotalBudget: buildEstimatedBudgetLabel(
            workflowDraft.trip.tripOverview?.estimatedTotalBudget || workflowDraft.trip.totalEstimatedCost,
            compareState.budgetMode
          ),
          transportSummary: `AI-optimized around ${compareState.transportMode.replace('-', ' ')} travel.`,
          accommodationType: compareState.hotelStyle,
          tripStyle: workflowDraft.brief?.travelStyle || workflowDraft.trip.tripOverview?.tripStyle || 'Balanced',
          hotels: workflowDraft.trip.tripOverview?.hotels?.length
            ? workflowDraft.trip.tripOverview.hotels
            : [`${compareState.hotelStyle} stay suggestions will be generated here`],
        },
        preTripPreparation: {
          ...workflowDraft.trip.preTripPreparation,
          notes: [
            ...(workflowDraft.trip.preTripPreparation?.notes || []),
            `Compare refinements: ${compareState.routeStyle} route, ${compareState.transportMode} transport, ${compareState.hotelStyle} stays.`,
          ],
        },
      }

      const savedTrip = await tripService.createTrip({ ...updatedTrip, userId: user?.id })
      if (savedTrip) {
        sessionStorage.removeItem('tripPlannerWorkflowDraft')
        navigate(`/trips/${savedTrip._id}`)
      }
    } catch (error) {
      console.error('Failed to save final compared plan:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!workflowDraft?.trip) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_42%,#f8fafc_100%)]">
        <PlannerWorkspaceNav />
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-10 text-center">
              <GitCompareArrows className="mx-auto h-12 w-12 text-amber-500" />
              <h1 className="mt-5 text-3xl font-semibold text-slate-900">Compare starts after a plan draft exists</h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                Open `Plan` first, generate a trip from your brief, then use `Compare` to explore alternative places,
                pricing, transport, route balance, and hotel style before saving the final version.
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
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_40%,#f8fafc_100%)]">
      <PlannerWorkspaceNav />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center rounded-full bg-amber-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">
              Plan To Compare Workflow
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              AI is ready to improve the draft before you save the final trip.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              This is the second step in the workflow. Use it to compare alternate places from your starting point,
              rebalance price and transport, adjust route logic, and lock in the version that fits best.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Original draft</p>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-900">{workflowDraft.trip.tripTitle || workflowDraft.trip.destination}</h2>
                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <p><span className="font-medium text-slate-900">Start:</span> {workflowDraft.brief?.startingLocation || 'Flexible'}</p>
                    <p><span className="font-medium text-slate-900">Trip:</span> {workflowDraft.trip.destination} for {workflowDraft.trip.duration}</p>
                    <p><span className="font-medium text-slate-900">Budget:</span> {workflowDraft.brief?.budget || 'balanced'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-slate-950 text-white shadow-sm">
                <CardContent className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Next step helpers</p>
                  <div className="mt-4 space-y-3 text-sm text-white/75">
                    <p>Save only after the tradeoffs feel right.</p>
                    <p>Use Compare for destination swaps, cost control, transport, route logic, and stay style.</p>
                    <div className="flex gap-3 pt-2">
                      <Link to="/trips/assistant">
                        <Button className="border border-white/15 bg-white/10 text-white hover:bg-white/15">
                          <Bot className="mr-2 h-4 w-4" />
                          Assistant
                        </Button>
                      </Link>
                      <Link to="/trips/prepare">
                        <Button className="border border-white/15 bg-white/10 text-white hover:bg-white/15">
                          <MapPinned className="mr-2 h-4 w-4" />
                          Prepare Later
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border-slate-200 bg-white shadow-lg shadow-slate-200/60">
            <CardContent className="p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">AI customization controls</p>
              <div className="mt-5 grid gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Compare destination direction</label>
                  <select
                    value={compareState.destinationChoice}
                    onChange={(e) => setCompareState((prev) => ({ ...prev, destinationChoice: e.target.value }))}
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    {[workflowDraft.trip.destination, ...destinationSuggestions].filter((value, index, arr) => value && arr.indexOf(value) === index).map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Budget direction</label>
                    <select
                      value={compareState.budgetMode}
                      onChange={(e) => setCompareState((prev) => ({ ...prev, budgetMode: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="balanced">Balanced value</option>
                      <option value="value">Lower cost</option>
                      <option value="premium">Higher comfort</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Transport mode</label>
                    <select
                      value={compareState.transportMode}
                      onChange={(e) => setCompareState((prev) => ({ ...prev, transportMode: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="balanced">Balanced mix</option>
                      <option value="public">Public transport</option>
                      <option value="private">Private transfers</option>
                      <option value="walkable">Walkable and local</option>
                    </select>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Route style</label>
                    <select
                      value={compareState.routeStyle}
                      onChange={(e) => setCompareState((prev) => ({ ...prev, routeStyle: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="balanced">Balanced pacing</option>
                      <option value="comfort-first">Comfort first</option>
                      <option value="scenic">Scenic and slower</option>
                      <option value="efficient">Efficient and tight</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Hotel style</label>
                    <select
                      value={compareState.hotelStyle}
                      onChange={(e) => setCompareState((prev) => ({ ...prev, hotelStyle: e.target.value }))}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="budget">Budget</option>
                      <option value="comfortable">Comfortable</option>
                      <option value="boutique">Boutique</option>
                      <option value="luxury">Luxury</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Extra compare instructions</label>
                  <textarea
                    rows={4}
                    value={compareState.notes}
                    onChange={(e) => setCompareState((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Examples: prioritize shorter travel days, use beach-friendly stays, keep food experiences strong, reduce hotel cost."
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          <Card className="bg-gradient-to-br from-sky-50 to-white">
            <CardContent className="p-5">
              <Route className="h-6 w-6 text-sky-600" />
              <h3 className="mt-3 text-lg font-semibold text-slate-900">Route plan</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">AI can reduce fatigue, make the route more scenic, or optimize it for time.</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-rose-50 to-white">
            <CardContent className="p-5">
              <Hotel className="h-6 w-6 text-rose-600" />
              <h3 className="mt-3 text-lg font-semibold text-slate-900">Stays and comfort</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Shift between budget, comfortable, boutique, and luxury without rebuilding the whole trip.</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-50 to-white">
            <CardContent className="p-5">
              <CarFront className="h-6 w-6 text-emerald-600" />
              <h3 className="mt-3 text-lg font-semibold text-slate-900">Transport tradeoffs</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Let AI rebalance public transport, private transfers, and walkability for your travel style.</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-10 border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              <Sparkles className="h-4 w-4" />
              AI compare summary
            </div>
            <div className="mt-5 grid gap-3">
              {optimizationSummary.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button onClick={saveFinalPlan} disabled={saving} className="bg-slate-900 text-white hover:bg-slate-800">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {saving ? 'Saving final plan...' : 'Complete And Save Final Plan'}
              </Button>
              <Link to="/trips">
                <Button variant="outline">
                  Back To Plan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <MapPinned className="h-6 w-6 text-amber-600" />
              <h3 className="mt-3 text-lg font-semibold text-slate-900">Alternate places</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Suggestions are seeded from your draft destination and starting location instead of making you restart.</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <Coins className="h-6 w-6 text-emerald-600" />
              <h3 className="mt-3 text-lg font-semibold text-slate-900">Pricing control</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Budget mode adjusts the final plan summary so users understand whether the trip is being trimmed or upgraded.</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <GitCompareArrows className="h-6 w-6 text-sky-600" />
              <h3 className="mt-3 text-lg font-semibold text-slate-900">One continuous flow</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Users stay inside the planner workflow: generate, compare, save, then move into assistance and preparation later.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
