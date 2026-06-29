import React, { useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  CloudSun,
  Compass,
  ExternalLink,
  FolderHeart,
  Footprints,
  Gauge,
  Heart,
  Lightbulb,
  MapPin,
  RefreshCw,
  Route,
  Save,
  ShieldCheck,
  Sparkles,
  SunMedium,
  Users,
  Utensils,
  WalletCards,
  WandSparkles,
  X,
} from 'lucide-react'
import { Button } from '../components/Button'
import { Card, CardContent } from '../components/Card'
import { SavedTripsPanel } from '../components/SavedTripsPanel'
import { apiService } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { tripService, type TripPlan } from '../services/tripService'
import type { SmartEditAction, TripPlanInput, TripPlanResult } from '../types/tripPlan'

type DiscoveryState = {
  discoveryBrief?: {
    departure?: string
    month?: string
    budget?: string
    travelerType?: string
    interests?: string[]
    avoid?: string[]
  }
  discoveryRecommendation?: {
    name?: string
    parentDestination?: string
    country?: string
    image?: string
    supportPlaces?: string[]
  }
}

const titleCase = (value: string) =>
  value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const splitParam = (value: string | null) =>
  value
    ? value.split(',').map((item) => item.trim()).filter(Boolean)
    : []

const toIsoDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseIsoDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const addDays = (value: string, days: number) => {
  const date = parseIsoDate(value)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

const inclusiveDays = (start: string, end: string) =>
  Math.round((parseIsoDate(end).getTime() - parseIsoDate(start).getTime()) / 86400000) + 1

const isPlaceholderPlace = (value = '') =>
  /(signature highlight|food stop|scenic moment|culture highlight|cultural core|local dining area|sunset viewpoint|secondary museum or viewpoint|local market detour|highlight$| stop$)/i.test(
    value.trim(),
  )

const validateGeneratedPlan = (plan: TripPlanResult) => {
  if (!plan || !Array.isArray(plan.days) || plan.days.length === 0) {
    throw new Error('The AI did not return a usable itinerary.')
  }

  if (plan.days.some((day) => !Array.isArray(day.activities) || day.activities.length < 2)) {
    throw new Error('The AI returned an incomplete itinerary. Every day needs at least two activities.')
  }

  const containsPlaceholders =
    plan.mustDo?.some((place) => isPlaceholderPlace(place.name)) ||
    plan.optional?.some((place) => isPlaceholderPlace(place.name)) ||
    plan.days.some((day) =>
      day.activities.some(
        (activity) => isPlaceholderPlace(activity.placeName || ''),
      ),
    )

  if (containsPlaceholders) {
    throw new Error('The AI returned placeholder place names. Please retry the plan.')
  }

  return plan
}

const toneClass = (tone: 'good' | 'watch' | 'risk') => {
  if (tone === 'good') return 'bg-emerald-50 text-emerald-700 ring-emerald-100'
  if (tone === 'risk') return 'bg-rose-50 text-rose-700 ring-rose-100'
  return 'bg-amber-50 text-amber-700 ring-amber-100'
}

const healthTone = (value: string): 'good' | 'watch' | 'risk' => {
  if (/excellent|good|relaxed|balanced|easy/i.test(value)) return 'good'
  if (/poor|too_busy|complex|risky/i.test(value)) return 'risk'
  return 'watch'
}

const ScoreRing = ({ score }: { score: number }) => (
  <div
    className="flex h-36 w-36 shrink-0 items-center justify-center rounded-full bg-[conic-gradient(#22c55e_var(--score),#e2e8f0_0)] p-2"
    style={{ '--score': `${score}%` } as React.CSSProperties}
  >
    <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white">
      <strong className="font-heading text-4xl text-slate-950">{score}%</strong>
      <span className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Trip Health</span>
    </div>
  </div>
)

type SavedPlanMetadata = {
  generatedPlan?: TripPlanResult
  input?: TripPlanInput
}

type ProfileTravelPreferences = {
  budgetRange?: string
  travelPace?: 'relaxed' | 'balanced' | 'packed'
  interests?: string[]
  defaultTravelerType?: string
  avoid?: string[]
}

type TripPlanningResetPageProps = {
  savedTrip?: TripPlan
}

export const TripPlanningResetPage: React.FC<TripPlanningResetPageProps> = ({ savedTrip }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const routeState = (location.state || {}) as DiscoveryState
  const params = useMemo(() => new URLSearchParams(location.search), [location.search])
  const workspaceView = params.get('view') === 'saved' && !savedTrip ? 'saved' : 'plan'
  const savedMetadata = (savedTrip?.metadata || {}) as SavedPlanMetadata
  const savedPlan = savedMetadata.generatedPlan
  const savedInput = savedMetadata.input
  const profilePreferences = (user?.travelPreferences || {}) as ProfileTravelPreferences

  const routeDestination =
    savedPlan?.destination ||
    params.get('destination') ||
    [
      routeState.discoveryRecommendation?.name,
      routeState.discoveryRecommendation?.parentDestination,
      routeState.discoveryRecommendation?.country,
    ].filter(Boolean).join(', ')

  const initialInterests = savedInput?.interests?.length
    ? savedInput.interests
    : splitParam(params.get('interests')).length
    ? splitParam(params.get('interests'))
    : routeState.discoveryBrief?.interests?.length
      ? routeState.discoveryBrief.interests
      : profilePreferences.interests?.length
        ? profilePreferences.interests
        : ['culture', 'food']
  const initialAvoid = savedInput?.avoid?.length
    ? savedInput.avoid
    : splitParam(params.get('avoid')).length
    ? splitParam(params.get('avoid'))
    : routeState.discoveryBrief?.avoid?.length
      ? routeState.discoveryBrief.avoid
      : profilePreferences.avoid || []

  const [destination, setDestination] = useState(routeDestination)
  const initialDurationDays = Math.min(
    14,
    Math.max(1, savedPlan?.durationDays || savedInput?.durationDays || Number(params.get('days')) || 4),
  )
  const [durationDays, setDurationDays] = useState(initialDurationDays)
  const [startDate, setStartDate] = useState(savedInput?.startDate || params.get('startDate') || '')
  const [endDate, setEndDate] = useState(
    savedInput?.endDate ||
    params.get('endDate') ||
      (savedInput?.startDate
        ? addDays(savedInput.startDate, initialDurationDays - 1)
        : params.get('startDate')
          ? addDays(params.get('startDate') as string, initialDurationDays - 1)
          : ''),
  )
  const [travelerType, setTravelerType] = useState(
    savedInput?.travelerType?.replace('_', '-') ||
      params.get('style') ||
      routeState.discoveryBrief?.travelerType ||
      profilePreferences.defaultTravelerType?.replace('_', '-') ||
      'couple',
  )
  const [budgetLevel, setBudgetLevel] = useState(
    savedInput?.budgetLevel?.replace('_', '-') ||
      params.get('budget') ||
      routeState.discoveryBrief?.budget ||
      (profilePreferences.budgetRange === 'economy'
        ? 'budget'
        : profilePreferences.budgetRange === 'luxury'
          ? 'luxury'
          : 'mid-range') ||
      'mid-range',
  )
  const [pace, setPace] = useState<'relaxed' | 'balanced' | 'packed'>(
    savedInput?.pace || profilePreferences.travelPace || 'balanced',
  )
  const [plan, setPlan] = useState<TripPlanResult | null>(savedPlan || null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [expandedDays, setExpandedDays] = useState<number[]>(
    savedPlan?.days.map((day) => day.day) || [1],
  )
  const [editNotice, setEditNotice] = useState<string | null>(null)
  const [editingActionType, setEditingActionType] = useState<string | null>(null)
  const [visitedPlaces, setVisitedPlaces] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedTripId, setSavedTripId] = useState<string | null>(savedTrip?._id || null)

  const input = useMemo<TripPlanInput>(
    () => ({
      destination,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      month: params.get('month') || routeState.discoveryBrief?.month,
      durationDays,
      travelerType:
        travelerType === 'business-leisure'
          ? 'business_leisure'
          : (travelerType as TripPlanInput['travelerType']),
      budgetLevel:
        budgetLevel === 'mid-range' ? 'mid_range' : (budgetLevel as TripPlanInput['budgetLevel']),
      pace,
      interests: initialInterests,
      avoid: initialAvoid,
      origin: params.get('origin') || routeState.discoveryBrief?.departure,
      currency: user?.homeCurrency || 'USD',
      notes: routeState.discoveryRecommendation?.supportPlaces?.length
        ? `Discovery suggested these real places for consideration: ${routeState.discoveryRecommendation.supportPlaces.join(', ')}`
        : undefined,
    }),
    [
      budgetLevel,
      destination,
      durationDays,
      initialAvoid,
      initialInterests,
      pace,
      params,
      routeState.discoveryBrief,
      routeState.discoveryRecommendation,
      startDate,
      endDate,
      travelerType,
      user?.homeCurrency,
    ],
  )

  const generatePlan = async () => {
    setIsGenerating(true)
    setGenerationError(null)
    setEditNotice(null)
    setSaveError(null)
    setSavedTripId(null)
    try {
      const response = await apiService.generateTripPlan(input)
      const generatedPlan = validateGeneratedPlan(response.tripPlan)
      setPlan(generatedPlan)
      setExpandedDays(generatedPlan.days.map((day) => day.day))
      setVisitedPlaces([])
      window.setTimeout(
        () => document.getElementById('trip-dashboard')?.scrollIntoView({ behavior: 'smooth' }),
        50,
      )
    } catch (error) {
      console.error('Smart trip plan generation failed:', error)
      setPlan(null)
      setGenerationError(
        error instanceof Error
          ? error.message
          : 'The smart plan could not be generated. Please verify the AI service and try again.',
      )
    } finally {
      setIsGenerating(false)
    }
  }

  const changeDuration = (days: number) => {
    setDurationDays(days)
    if (startDate) {
      setEndDate(addDays(startDate, days - 1))
    }
    setPlan(null)
    setSavedTripId(null)
  }

  const changeStartDate = (value: string) => {
    setStartDate(value)
    setEndDate(value ? addDays(value, durationDays - 1) : '')
    setPlan(null)
    setSavedTripId(null)
  }

  const changeEndDate = (value: string) => {
    setEndDate(value)
    if (startDate && value) {
      const days = inclusiveDays(startDate, value)
      if (days >= 1 && days <= 14) {
        setDurationDays(days)
      }
    }
    setPlan(null)
    setSavedTripId(null)
  }

  const buildSavedTrip = (generatedPlan: TripPlanResult): Omit<TripPlan, '_id' | 'createdAt'> => {
    const budgetByCategory = new Map(
      generatedPlan.budget.breakdown.map((item) => [item.category.toLowerCase(), item]),
    )
    const budgetItem = (category: string, fallback: string) => ({
      desc: budgetByCategory.get(category)?.notes || fallback,
      cost: budgetByCategory.get(category)?.range || 'Not estimated',
    })
    const bookingAdvice = generatedPlan.days
      .flatMap((day) => day.activities)
      .filter((activity) => activity.reservationAdvice && !['not needed', 'unknown'].includes(activity.reservationAdvice))
      .map((activity) => `${activity.title}: ${activity.reservationAdvice}`)

    return {
      tripTitle: generatedPlan.tripTitle,
      destination: generatedPlan.destination,
      duration: `${generatedPlan.durationDays} ${generatedPlan.durationDays === 1 ? 'day' : 'days'}`,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      travelers: titleCase(generatedPlan.travelerType),
      budgetRange: generatedPlan.budget.estimatedTotalRange,
      travelStyle: generatedPlan.tripStyle.join(', '),
      notes: generatedPlan.finalAdvice,
      mustSee: generatedPlan.mustDo.map((place) => place.name),
      avoid: initialAvoid,
      planningStatus: 'draft',
      coverImageUrl: routeState.discoveryRecommendation?.image,
      metadata: {
        generatedPlan,
        input,
      },
      introduction: generatedPlan.tripSummary.shortDescription,
      tripOverview: {
        totalTravelDays: `${generatedPlan.durationDays} days`,
        summaryHeadline: generatedPlan.realityCheck.summary,
        whyThisTripFits: generatedPlan.tripSummary.bestFor,
        routeStrategy: generatedPlan.days.map((day) => day.routeLogic).filter((item): item is string => Boolean(item)),
        tradeoffs: generatedPlan.realityCheck.warnings,
        keyAttractions: generatedPlan.mustDo.map((place) => place.name),
        transportSummary: generatedPlan.practicalInfo.transportationAdvice.join(' '),
        hotels: [],
        estimatedTotalBudget: generatedPlan.budget.estimatedTotalRange,
        tripStyle: generatedPlan.tripStyle.join(', '),
        bestFor: generatedPlan.tripSummary.bestFor,
        bookingPriority: bookingAdvice,
        paceScore: titleCase(generatedPlan.tripHealth.paceComfort),
        travelEfficiency: titleCase(generatedPlan.tripHealth.logistics),
        startingLocation: input.origin,
      },
      dailyItinerary: generatedPlan.days.map((day) => ({
        day: day.day,
        date: startDate ? addDays(startDate, day.day - 1) : `Day ${day.day}`,
        theme: day.title,
        dayGoal: day.whyThisDayWorks,
        energyLevel: titleCase(day.energyLevel),
        estimatedTravelTime: day.routeLogic || '',
        estimatedDayCost: day.estimatedCostRange,
        mustDo: day.activities.find((activity) => activity.priority === 'must_do')?.title,
        optionalAddOn: day.editSuggestions[0],
        weatherBackup: day.weatherBackup,
        activities: day.activities.map((activity) => ({
          timeSlot: titleCase(activity.timeOfDay),
          activityType: titleCase(activity.type),
          activityTitle: activity.title,
          placeName: activity.placeName,
          details: activity.description,
          cost: day.estimatedCostRange,
          notes: [activity.localTip, ...activity.tips].filter(Boolean).join(' '),
          estimatedDuration: activity.estimatedDuration,
          priority: activity.priority,
          travelNote: activity.travelTimeFromPrevious,
          googleMapsUrl: activity.googleMapsUrl,
          fullAddress: activity.fullAddress,
          isVisited: false,
        })),
      })),
      expenseBreakdown: {
        fixed: {
          accommodation: budgetItem('accommodation', 'Estimated accommodation range'),
          transport: budgetItem('transport', 'Estimated transport range'),
          tickets: budgetItem('activities', 'Estimated activity and ticket range'),
        },
        variable: {
          dining: budgetItem('food', 'Estimated food range'),
          localTransport: budgetItem('transport', 'Estimated local transport range'),
        },
        total: generatedPlan.budget.estimatedTotalRange,
      },
      preTripPreparation: {
        booking: bookingAdvice,
        packing: generatedPlan.practicalInfo.packingTips,
        weather: generatedPlan.realityCheck.warnings.join(' '),
        notes: [
          ...generatedPlan.practicalInfo.culturalEtiquette,
          ...generatedPlan.practicalInfo.sustainabilityTips,
        ],
      },
    }
  }

  const savePlan = async () => {
    if (!plan || isSaving) return
    if (!user) {
      setSaveError('Sign in to save this trip plan to your account.')
      return
    }

    setIsSaving(true)
    setSaveError(null)
    try {
      const saved = await tripService.createTrip(buildSavedTrip(plan))
      if (!saved?._id) {
        throw new Error('The trip was not saved.')
      }
      setSavedTripId(saved._id)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save this trip plan.')
    } finally {
      setIsSaving(false)
    }
  }

  const placesToVisit = useMemo(() => {
    if (!plan) return []
    const places = [
      ...plan.mustDo
        .filter((place) => {
          const matchingActivity = plan.days
            .flatMap((day) => day.activities)
            .find((activity) => activity.placeName?.toLowerCase() === place.name.toLowerCase())
          return place.name && !isPlaceholderPlace(place.name) && Boolean(matchingActivity?.googleMapsUrl)
        })
        .map((place) => ({
          name: place.name,
          day: undefined as number | undefined,
          time: place.bestTime,
          priority: 'Must do',
          googleMapsUrl: plan.days
            .flatMap((day) => day.activities)
            .find((activity) => activity.placeName?.toLowerCase() === place.name.toLowerCase())
            ?.googleMapsUrl,
        })),
      ...plan.days.flatMap((day) =>
        day.activities
          .filter((activity) => activity.placeName && activity.googleMapsUrl && !isPlaceholderPlace(activity.placeName))
          .map((activity) => ({
            name: activity.placeName as string,
            day: day.day,
            time: titleCase(activity.timeOfDay),
            priority:
              activity.priority === 'must_do'
                ? 'Must do'
                : activity.priority === 'optional'
                  ? 'Optional'
                  : 'Planned',
            googleMapsUrl: activity.googleMapsUrl,
          })),
      ),
    ]
    return Array.from(
      new Map(places.map((place) => [place.name.toLowerCase(), place])).values(),
    )
  }, [plan])

  const confidenceSignals = useMemo(() => {
    if (!plan) return []
    const scoreMap: Record<string, number> = {
      excellent: 94,
      good: 84,
      tight: 62,
      poor: 38,
      relaxed: 92,
      balanced: 84,
      busy: 64,
      too_busy: 38,
      easy: 92,
      moderate: 76,
      complex: 48,
    }
    const namedActivities = plan.days.flatMap((day) => day.activities).filter((activity) => activity.placeName)
    return [
      { label: 'Budget fit', score: scoreMap[plan.tripHealth.budgetFit] || 70 },
      { label: 'Pace comfort', score: scoreMap[plan.tripHealth.paceComfort] || 70 },
      { label: 'Route logic', score: scoreMap[plan.tripHealth.logistics] || 70 },
      { label: 'Destination match', score: Math.min(95, 74 + Math.min(initialInterests.length, 4) * 5) },
      { label: 'Content confidence', score: namedActivities.length >= 5 ? 92 : namedActivities.length >= 2 ? 78 : 58 },
    ]
  }, [initialInterests.length, plan])

  const toggleDay = (day: number) => {
    setExpandedDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    )
  }

  const toggleVisited = (placeName: string) => {
    setVisitedPlaces((current) =>
      current.includes(placeName)
        ? current.filter((item) => item !== placeName)
        : [...current, placeName],
    )
  }

  const handleSmartEdit = async (action: SmartEditAction) => {
    if (!plan || editingActionType) return

    setEditingActionType(action.actionType)
    setEditNotice(null)
    setGenerationError(null)
    setSaveError(null)

    try {
      const response = await apiService.editTripPlan({
        currentPlan: plan,
        input,
        actionType: action.actionType,
        actionLabel: action.label,
        instruction: action.description,
      })
      const editedPlan = validateGeneratedPlan(response.tripPlan)
      setPlan(editedPlan)
      setExpandedDays(editedPlan.days.map((day) => day.day))
      setVisitedPlaces([])
      setSavedTripId(null)
      setEditNotice(`${action.label} applied. Review the updated plan before saving.`)
      window.setTimeout(
        () => document.getElementById('trip-dashboard')?.scrollIntoView({ behavior: 'smooth' }),
        50,
      )
    } catch (error) {
      console.error('Smart trip edit failed:', error)
      setEditNotice(
        error instanceof Error
          ? error.message
          : 'Smart edit failed. Please try again.',
      )
    } finally {
      setEditingActionType(null)
    }
  }

  if (workspaceView === 'saved') {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f6f7f4_0%,#ffffff_38%,#eef4f7_100%)]">
        <section className="bg-[#091523] text-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/70">
                  <FolderHeart className="h-4 w-4 text-emerald-300" />
                  Trips Workspace
                </span>
                <h1 className="font-heading mt-5 text-4xl font-semibold sm:text-5xl">Plan and manage your trips</h1>
              </div>
              <div className="flex rounded-full border border-white/15 bg-white/10 p-1.5">
                <button type="button" onClick={() => navigate('/trips')} className="rounded-full px-5 py-2.5 text-sm font-semibold text-white/65 hover:text-white">
                  Plan a Trip
                </button>
                <button type="button" className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950">
                  Saved Trips
                </button>
              </div>
            </div>
          </div>
        </section>
        <SavedTripsPanel />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6f7f4_0%,#ffffff_34%,#eef4f7_100%)] pb-24 lg:pb-0">
      <section className="relative overflow-hidden bg-[#091523] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35"
          style={{
            backgroundImage: `url(${routeState.discoveryRecommendation?.image || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1900&q=82'})`,
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,14,28,0.97),rgba(5,14,28,0.66)),radial-gradient(circle_at_80%_15%,rgba(244,127,107,0.22),transparent_26%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white/75 backdrop-blur">
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
                Smart Trip Dashboard
              </span>
              <h1 className="font-heading mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
                {durationDays}-Day {titleCase(travelerType)} Trip to {destination || 'Your Destination'}
              </h1>
              <div className="mt-5 flex flex-wrap gap-2">
                {initialInterests.map((interest) => (
                  <span key={interest} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/75">
                    {titleCase(interest)}
                  </span>
                ))}
              </div>
              {initialAvoid.length > 0 && (
                <p className="mt-4 text-sm text-white/60">
                  Avoiding: <span className="font-semibold text-white/80">{initialAvoid.map(titleCase).join(' · ')}</span>
                </p>
              )}
            </div>
            <Button
              onClick={generatePlan}
              loading={isGenerating}
              disabled={!destination.trim()}
              size="lg"
              className="shrink-0 rounded-full bg-[linear-gradient(135deg,#f47f6b,#fb923c)] px-7 text-white"
            >
              {!isGenerating && <WandSparkles className="mr-2 h-5 w-5" />}
              {isGenerating ? 'Building Smart Plan...' : plan ? 'Refresh Smart Plan' : 'Generate Smart Plan'}
            </Button>
            {user && (
              <Button onClick={() => navigate('/trips?view=saved')} variant="outline" size="lg" className="shrink-0 rounded-full border-white/25 text-white hover:bg-white/10">
                <FolderHeart className="mr-2 h-5 w-5" />Saved Trips
              </Button>
            )}
          </div>
        </div>
      </section>

      {!plan && !isGenerating && (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          {generationError && (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                <div>
                  <p className="font-bold">Smart plan generation failed</p>
                  <p className="mt-1 text-sm leading-6">{generationError}</p>
                </div>
              </div>
            </div>
          )}
          <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
            <Card className="border-slate-200 bg-white">
              <CardContent className="p-6">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#e96855]">Trip inputs</p>
                <h2 className="font-heading mt-2 text-3xl font-semibold">Shape the first draft</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">Generation uses the configured AI service directly and validates the plan before displaying it.</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label className="sm:col-span-2">
                    <span className="mb-2 block text-xs font-bold text-slate-500">Destination</span>
                    <input
                      type="text"
                      value={destination}
                      onChange={(event) => setDestination(event.target.value)}
                      placeholder="Polonnaruwa, Sri Lanka"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-orange-300"
                    />
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-bold text-slate-500">Duration</span>
                    <select value={durationDays} onChange={(event) => changeDuration(Number(event.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none">
                      {Array.from({ length: 14 }, (_, index) => index + 1).map((days) => <option key={days} value={days}>{days} {days === 1 ? 'day' : 'days'}</option>)}
                    </select>
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-bold text-slate-500">Traveler type</span>
                    <select value={travelerType} onChange={(event) => setTravelerType(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none">
                      {['solo', 'couple', 'family', 'friends', 'business-leisure'].map((type) => <option key={type} value={type}>{titleCase(type)}</option>)}
                    </select>
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-bold text-slate-500">Budget</span>
                    <select value={budgetLevel} onChange={(event) => setBudgetLevel(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none">
                      <option value="budget">Budget</option>
                      <option value="mid-range">Mid-range</option>
                      <option value="luxury">Luxury</option>
                    </select>
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-bold text-slate-500">Pace</span>
                    <select value={pace} onChange={(event) => setPace(event.target.value as typeof pace)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none">
                      <option value="relaxed">Relaxed</option>
                      <option value="balanced">Balanced</option>
                      <option value="packed">Packed</option>
                    </select>
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-bold text-slate-500">From date</span>
                    <input type="date" value={startDate} min={toIsoDate(new Date())} onChange={(event) => changeStartDate(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-orange-300" />
                  </label>
                  <label>
                    <span className="mb-2 block text-xs font-bold text-slate-500">To date</span>
                    <input type="date" value={endDate} min={startDate || toIsoDate(new Date())} max={startDate ? addDays(startDate, 13) : undefined} disabled={!startDate} onChange={(event) => changeEndDate(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-orange-300 disabled:opacity-50" />
                  </label>
                </div>
                {startDate && endDate && (
                  <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-sky-700"><CalendarDays className="h-4 w-4" />{durationDays}-day trip · {startDate} to {endDate}</p>
                )}
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-slate-200 bg-[#0d1a2a] text-white">
              <CardContent className="p-6 sm:p-8">
                <Gauge className="h-10 w-10 text-emerald-300" />
                <h2 className="font-heading mt-5 text-3xl font-semibold">What the smart plan will test</h2>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {['Budget fit and ranges', 'Pace and walking', 'Route complexity', 'Weather comfort', 'Real named places', 'Common mistakes'].map((item) => (
                    <p key={item} className="flex items-start gap-2 rounded-xl bg-white/[0.06] p-3 text-sm text-white/72">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                      {item}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {isGenerating && (
        <section className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
          <RefreshCw className="mx-auto h-10 w-10 animate-spin text-[#e96855]" />
          <h2 className="font-heading mt-6 text-3xl font-semibold">Testing this trip before you trust it...</h2>
          <p className="mt-3 text-slate-600">Waiting for the configured trip-planning AI service.</p>
        </section>
      )}

      {plan && !isGenerating && (
        <main id="trip-dashboard" className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-slate-950">{savedTripId ? 'Trip plan saved' : 'Keep this plan in your account'}</p>
              <p className="mt-1 text-sm text-slate-500">{savedTripId ? 'Your generated itinerary is ready in saved trips.' : 'Save the itinerary, dates, budget, places, and reality checks.'}</p>
              {saveError && <p className="mt-2 text-sm font-semibold text-rose-600">{saveError}</p>}
            </div>
            {savedTripId ? (
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => navigate(`/trips/${savedTripId}`)} className="rounded-xl bg-emerald-600 text-white">
                  Open Saved Trip<ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button onClick={() => navigate('/trips?view=saved')} variant="outline" className="rounded-xl">
                  View All Saved Trips
                </Button>
              </div>
            ) : (
              <Button onClick={savePlan} loading={isSaving} className="rounded-xl bg-slate-950 text-white">
                {!isSaving && <Save className="mr-2 h-4 w-4" />}Save Trip Plan
              </Button>
            )}
          </section>
          <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Card className="border-slate-200 bg-white">
              <CardContent className="flex flex-col gap-7 p-6 sm:flex-row sm:items-center sm:p-8">
                <ScoreRing score={plan.planningConfidenceScore} />
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">AI Trip Health</p>
                  <h2 className="font-heading mt-2 text-3xl font-semibold">{plan.tripHealth.overall === 'excellent' ? 'Excellent trip' : 'Good trip with watchouts'}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{plan.tripSummary.shortDescription}</p>
                  <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {confidenceSignals.map((signal) => (
                      <div key={signal.label} className={`rounded-xl px-3 py-2 ring-1 ${toneClass(signal.score >= 80 ? 'good' : signal.score >= 60 ? 'watch' : 'risk')}`}>
                        <p className="text-[9px] font-bold uppercase tracking-wider opacity-65">{signal.label}</p>
                        <p className="mt-1 text-sm font-extrabold">{signal.score}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-white">
              <CardContent className="p-6 sm:p-8">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">What drives the score</p>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { icon: Banknote, label: 'Budget fit', value: plan.tripHealth.budgetFit },
                    { icon: Gauge, label: 'Pace comfort', value: plan.tripHealth.paceComfort },
                    { icon: Route, label: 'Logistics', value: plan.tripHealth.logistics },
                    { icon: CloudSun, label: 'Overall', value: plan.tripHealth.overall },
                  ].map((signal) => {
                    const Icon = signal.icon
                    return (
                      <div key={signal.label} className={`rounded-2xl p-4 text-center ring-1 ${toneClass(healthTone(signal.value))}`}>
                        <Icon className="mx-auto h-5 w-5" />
                        <p className="mt-2 text-[9px] font-bold uppercase tracking-wider opacity-65">{signal.label}</p>
                        <p className="mt-1 text-sm font-extrabold">{titleCase(signal.value)}</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </section>

          <Card className="overflow-hidden border-amber-200 bg-[linear-gradient(135deg,#fffaf0,#ffffff)]">
            <CardContent className="p-6 sm:p-8">
              <div className="grid gap-7 lg:grid-cols-[0.68fr_1.32fr]">
                <div>
                  <AlertTriangle className="h-10 w-10 text-amber-600" />
                  <h2 className="font-heading mt-4 text-3xl font-semibold">Reality Check</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{plan.realityCheck.summary}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {plan.realityCheck.warnings.map((warning) => (
                    <div key={warning} className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-white p-4 text-sm text-slate-700">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />{warning}
                    </div>
                  ))}
                  {plan.realityCheck.recommendations.map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-white p-4 text-sm text-slate-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{item}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <section>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-sky-700">Places to visit</p>
                <h2 className="font-heading mt-2 text-3xl font-semibold">Your visit checklist</h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">{visitedPlaces.length} of {placesToVisit.length} visited</span>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {placesToVisit.map((place) => {
                const visited = visitedPlaces.includes(place.name)
                return (
                  <Card key={place.name} className={visited ? 'border-emerald-200 bg-emerald-50/70' : 'border-slate-200 bg-white'}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <button type="button" onClick={() => toggleVisited(place.name)} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${visited ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 bg-slate-50 text-slate-400'}`}>
                          <Check className="h-4 w-4" />
                        </button>
                        <div>
                          <p className={`font-bold ${visited ? 'text-emerald-900 line-through' : 'text-slate-950'}`}>{place.name}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {place.day && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">Day {place.day}</span>}
                            {place.time && <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold text-sky-700">{place.time}</span>}
                          </div>
                        </div>
                      </div>
                      {place.googleMapsUrl && (
                        <a href={place.googleMapsUrl} target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-700">
                          <MapPin className="h-4 w-4" />Open in Google Maps<ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>

          <section>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#e96855]">Day-by-day itinerary</p>
            <h2 className="font-heading mt-2 text-3xl font-semibold">A plan you can scan and adjust</h2>
            <div className="mt-6 space-y-4">
              {plan.days.map((day) => {
                const expanded = expandedDays.includes(day.day)
                return (
                  <Card key={day.day} className="overflow-hidden border-slate-200 bg-white">
                    <button type="button" onClick={() => toggleDay(day.day)} className="flex w-full items-start gap-4 p-5 text-left sm:p-6">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 font-bold text-white">{day.day}</span>
                      <span className="flex-1">
                        <span className="font-heading block text-xl font-semibold text-slate-950 sm:text-2xl">{day.title}</span>
                        <span className="mt-1 block text-sm text-slate-500">{day.theme}</span>
                        <span className="mt-3 flex flex-wrap gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${toneClass(healthTone(day.energyLevel))}`}>Energy: {titleCase(day.energyLevel)}</span>
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${toneClass(healthTone(day.walkingLevel))}`}>Walking: {titleCase(day.walkingLevel)}</span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{day.estimatedCostRange}</span>
                          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">Start {day.bestTimeToStart}</span>
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2 text-xs font-bold text-slate-500">
                        {expanded ? 'Hide details' : `Show ${day.activities.length} activities`}
                        {expanded ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                      </span>
                    </button>
                    {expanded && (
                      <CardContent className="border-t border-slate-100 p-5 sm:p-6">
                        <div className="mb-5 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-sky-50 p-4 text-sm text-sky-950">
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-sky-700">Why this day works</p>
                            <p className="mt-2 leading-6">{day.whyThisDayWorks}</p>
                          </div>
                          {day.routeLogic && (
                            <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-950">
                              <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-700"><Route className="h-4 w-4" />Route logic</p>
                              <p className="mt-2 leading-6">{day.routeLogic}</p>
                            </div>
                          )}
                        </div>
                        <div className="grid gap-4 lg:grid-cols-3">
                          {day.activities.map((activity) => (
                            <div key={`${activity.timeOfDay}-${activity.title}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#e96855]">{activity.timeOfDay}</span>
                                <span className="text-[10px] font-bold text-slate-500">{activity.estimatedDuration}</span>
                              </div>
                              <h3 className="mt-3 font-semibold text-slate-950">{activity.title}</h3>
                              <p className="mt-2 text-sm leading-6 text-slate-600">{activity.description}</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {activity.travelTimeFromPrevious && (
                                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">
                                    Transfer: {activity.travelTimeFromPrevious}
                                  </span>
                                )}
                                {activity.reservationAdvice && activity.reservationAdvice !== 'unknown' && (
                                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                                    {activity.reservationAdvice === 'not needed'
                                      ? 'No advance booking needed'
                                      : titleCase(activity.reservationAdvice)}
                                  </span>
                                )}
                              </div>
                              {activity.localTip && <p className="mt-3 text-xs leading-5 text-emerald-700"><strong>Local tip:</strong> {activity.localTip}</p>}
                              {activity.tips?.length > 0 && <p className="mt-2 text-xs leading-5 text-slate-500">{activity.tips.join(' · ')}</p>}
                              {activity.googleMapsUrl && activity.placeName && (
                                <a href={activity.googleMapsUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-sky-700">
                                  View place<ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                              {!activity.googleMapsUrl && activity.nearbySearchUrl && (
                                <a href={activity.nearbySearchUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-sky-700">
                                  Search nearby<ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                        {(day.weatherBackup || Object.values(day.mealSuggestions || {}).some(Boolean)) && (
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {day.weatherBackup && (
                              <div className="rounded-2xl bg-sky-50 p-4 text-sm text-sky-900">
                                <p className="flex items-center gap-2 font-bold"><CloudSun className="h-4 w-4" />Weather backup</p>
                                <p className="mt-2 leading-6">{day.weatherBackup}</p>
                              </div>
                            )}
                            {Object.values(day.mealSuggestions || {}).some(Boolean) && (
                              <div className="rounded-2xl bg-orange-50 p-4 text-sm text-orange-950">
                                <p className="flex items-center gap-2 font-bold"><Utensils className="h-4 w-4" />Meal rhythm</p>
                                <div className="mt-2 space-y-1 leading-6">
                                  {Object.entries(day.mealSuggestions || {}).filter(([, value]) => value).map(([meal, value]) => (
                                    <p key={meal}><strong>{titleCase(meal)}:</strong> {value}</p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {day.dayWarnings.length > 0 && (
                          <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                            {day.dayWarnings.map((warning) => <p key={warning}>{warning}</p>)}
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-3">
            {[
              { title: 'Must Do', items: plan.mustDo, icon: Check, tone: 'border-emerald-200 bg-emerald-50/40 text-emerald-700' },
              { title: 'Optional', items: plan.optional, icon: Sparkles, tone: 'border-sky-200 bg-sky-50/40 text-sky-700' },
              { title: 'Skip If Tired', items: plan.skipIfShortOnTime, icon: X, tone: 'border-amber-200 bg-amber-50/40 text-amber-700' },
            ].map((group) => {
              const Icon = group.icon
              return (
                <Card key={group.title} className={`border-2 ${group.tone}`}>
                  <CardContent className="p-6">
                    <Icon className="h-6 w-6" />
                    <h2 className="font-heading mt-4 text-2xl font-semibold text-slate-950">{group.title}</h2>
                    <div className="mt-5 space-y-4">
                      {group.items.map((item) => (
                        <div key={item.name}>
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <p className="mt-1 text-sm text-slate-600">{item.reason}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
            <Card className="border-slate-200 bg-[#0d1a2a] text-white">
              <CardContent className="p-6 sm:p-8">
                <CircleDollarSign className="h-8 w-8 text-emerald-300" />
                <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-300">Budget estimate</p>
                <h2 className="font-heading mt-2 text-4xl font-semibold">{plan.budget.estimatedTotalRange}</h2>
                <p className="mt-2 text-sm text-white/55">Confidence: {titleCase(plan.budget.confidence)}</p>
                <div className="mt-7 space-y-3">
                  {plan.budget.breakdown.map((item) => (
                    <div key={item.category} className="flex justify-between border-b border-white/10 pb-3">
                      <span className="text-sm text-white/65">{titleCase(item.category)}</span>
                      <strong className="text-sm">{item.range}</strong>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="border-slate-200 bg-white">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-3"><Lightbulb className="h-6 w-6 text-amber-500" /><h2 className="font-heading text-3xl font-semibold">Common Mistakes</h2></div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {plan.commonMistakes.map((mistake) => (
                    <div key={mistake.mistake} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <p className="font-bold">{mistake.mistake}</p>
                      <p className="mt-2 text-sm text-slate-500">{mistake.whyItMatters}</p>
                      <p className="mt-3 text-sm font-semibold text-emerald-700">Better: {mistake.howToAvoid}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {plan.practicalInfo && Object.values(plan.practicalInfo).some((items) => items.length > 0) && (
            <Card className="border-slate-200 bg-white">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <SunMedium className="h-7 w-7 text-[#e96855]" />
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#e96855]">Practical guide</p>
                    <h2 className="font-heading mt-1 text-3xl font-semibold">Useful before you go</h2>
                  </div>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ['Getting around', plan.practicalInfo.transportationAdvice],
                    ['Local etiquette', plan.practicalInfo.culturalEtiquette],
                    ['Pack for this trip', plan.practicalInfo.packingTips],
                    ['Travel responsibly', plan.practicalInfo.sustainabilityTips],
                  ].map(([title, items]) => (
                    <div key={title as string} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <h3 className="font-bold text-slate-950">{title as string}</h3>
                      <div className="mt-3 space-y-2">
                        {(items as string[]).map((item) => (
                          <p key={item} className="flex gap-2 text-sm leading-6 text-slate-600"><Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />{item}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-200 bg-white">
            <CardContent className="p-6 sm:p-8">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#e96855]">Smart edits</p>
              <h2 className="font-heading mt-2 text-3xl font-semibold">Change one thing without starting over</h2>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {plan.smartEditActions.map((action) => {
                  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
                    make_cheaper: WalletCards,
                    reduce_walking: Footprints,
                    add_food: Utensils,
                    add_romantic: Heart,
                    avoid_crowds: Users,
                    make_relaxed: Gauge,
                    add_hidden_gems: Compass,
                    replace_activity: RefreshCw,
                  }
                  const Icon = iconMap[action.actionType] || Sparkles
                  return (
                    <button
                      key={action.actionType}
                      type="button"
                      onClick={() => handleSmartEdit(action)}
                      disabled={Boolean(editingActionType)}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Icon className="h-5 w-5 text-[#e96855]" />
                      <p className="mt-3 text-sm font-bold">
                        {editingActionType === action.actionType ? 'Applying...' : action.label}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{action.description}</p>
                    </button>
                  )
                })}
              </div>
              {editNotice && <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">{editNotice}</div>}
            </CardContent>
          </Card>
        </main>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-12px_35px_rgba(15,23,42,0.1)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg gap-3">
          <Link to="/discovery" className="flex-1"><Button variant="outline" className="w-full rounded-xl">Back to Discover</Button></Link>
          <Button onClick={generatePlan} loading={isGenerating} disabled={!destination.trim()} className="flex-1 rounded-xl bg-[linear-gradient(135deg,#f47f6b,#fb923c)] text-white">
            {plan ? 'Refresh Plan' : 'Generate Plan'}
          </Button>
          {plan && (
            <Button onClick={savedTripId ? () => navigate(`/trips/${savedTripId}`) : savePlan} loading={isSaving} className="flex-1 rounded-xl bg-slate-950 text-white">
              {savedTripId ? 'Open Saved' : 'Save Plan'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
