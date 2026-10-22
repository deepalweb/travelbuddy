import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Check,
  CircleDollarSign,
  Compass,
  ExternalLink,
  FolderHeart,
  Footprints,
  Gauge,
  Heart,
  Lightbulb,
  MapPin,
  RefreshCw,
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
import { TripDayCard } from '../components/TripDayCard'
import { TripResultOverview } from '../components/TripResultOverview'
import { TripPlanWizard } from '../components/tripPlanning/TripPlanWizard'
import { apiService } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import { tripService, type TripPlan } from '../services/tripService'
import type { SmartEditAction, TripActivity, TripPlanInput, TripPlanResult } from '../types/tripPlan'

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

const splitListText = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

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
  const [origin, setOrigin] = useState(savedInput?.origin || params.get('origin') || routeState.discoveryBrief?.departure || '')
  const [groupSize, setGroupSize] = useState(savedInput?.groupSize || 2)
  const [budgetAmount, setBudgetAmount] = useState(savedInput?.budgetAmount ? String(savedInput.budgetAmount) : '')
  const [interestsText, setInterestsText] = useState(initialInterests.join(', '))
  const [avoidText, setAvoidText] = useState(initialAvoid.join(', '))
  const [accommodationArea, setAccommodationArea] = useState(savedInput?.accommodationArea || '')
  const [arrivalTime, setArrivalTime] = useState(savedInput?.arrivalTime || '')
  const [departureTime, setDepartureTime] = useState(savedInput?.departureTime || '')
  const [plannerNotes, setPlannerNotes] = useState(savedInput?.notes || '')
  const [plan, setPlan] = useState<TripPlanResult | null>(savedPlan || null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [editNotice, setEditNotice] = useState<string | null>(null)
  const [editingActionType, setEditingActionType] = useState<string | null>(null)
  const [visitedPlaces, setVisitedPlaces] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedTripId, setSavedTripId] = useState<string | null>(savedTrip?._id || null)
  const [tripVersion, setTripVersion] = useState<number>(savedTrip?.version || 1)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false)
  const interests = useMemo(() => splitListText(interestsText), [interestsText])
  const avoid = useMemo(() => splitListText(avoidText), [avoidText])

  // Handle incoming draft stop from Nearby discovery
  useEffect(() => {
    const draftStop = (location.state as any)?.draftStop
    if (!draftStop) return

    if (!destination && draftStop.name) {
      setDestination(draftStop.name)
    }

    // Seed draft itinerary if no plan exists yet
    setPlan((prevPlan) => {
      const newStop: TripActivity = {
        stopId: `stop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: `Visit ${draftStop.name}`,
        type: 'attraction',
        placeName: draftStop.name,
        timeOfDay: 'morning',
        estimatedDuration: '1 - 2 hours',
        description: draftStop.address ? `Discovered nearby: ${draftStop.address}` : `Explore ${draftStop.name}`,
        tips: ['Added from Nearby discovery'],
        groundingSource: 'verified',
        googleMapsUrl: draftStop.mapsUrl,
        fullAddress: draftStop.address,
        googlePlaceId: draftStop.placeId,
        geometry: draftStop.coordinates,
      }

      if (!prevPlan) {
        return {
          tripTitle: `Trip to ${draftStop.name}`,
          destination: draftStop.name,
          durationDays: 1,
          travelerType: 'solo',
          tripStyle: ['Discovery'],
          finalAdvice: 'Draft itinerary created from Nearby discovery. Add more stops or use Smart Plan to complete.',
          realityCheck: {
            summary: 'Custom draft itinerary created from Nearby places.',
            warnings: [],
            weatherWatch: 'Check local weather conditions before traveling.',
          },
          tripSummary: {
            headline: `Custom itinerary for ${draftStop.name}`,
            shortDescription: `Custom itinerary featuring places discovered nearby.`,
            bestFor: ['Nearby discovery', 'Flexible exploration'],
          },
          budget: {
            confidence: 'moderate',
            estimatedTotalRange: 'Estimated on booking',
            breakdown: [],
          },
          tripHealth: {
            paceComfort: 'Comfortable',
            logistics: 'Efficient',
          },
          practicalInfo: {
            bestTimeToBook: 'Standard',
            transportationAdvice: ['Check local transit or walking directions.'],
            packingTips: ['Comfortable walking shoes'],
            culturalEtiquette: [],
            sustainabilityTips: [],
          },
          smartEditActions: [],
          mustDo: [{ name: draftStop.name, bestTime: 'Morning', reason: 'Discovered nearby' }],
          optional: [],
          skipIfShortOnTime: [],
          days: [
            {
              day: 1,
              title: 'Day 1: Local Discovery',
              theme: 'Local Highlights',
              energyLevel: 'moderate',
              walkingLevel: 'medium',
              whyThisDayWorks: 'Focused start with discovered nearby places.',
              estimatedCostRange: 'Free - Moderate',
              editSuggestions: [],
              activities: [newStop],
            },
          ],
        }
      }

      // Add to Day 1 of existing plan
      const updatedDays = [...prevPlan.days]
      if (updatedDays.length > 0) {
        updatedDays[0] = {
          ...updatedDays[0],
          activities: [...updatedDays[0].activities, newStop],
        }
      }
      return {
        ...prevPlan,
        days: updatedDays,
      }
    })
    setHasUnsavedChanges(true)
  }, [location.state])

  const handleAddStop = (dayNumber: number, newStop: TripActivity) => {
    setPlan((prevPlan) => {
      if (!prevPlan) return prevPlan
      const updatedDays = prevPlan.days.map((day) => {
        if (day.day === dayNumber) {
          const stopWithId: TripActivity = {
            ...newStop,
            stopId: newStop.stopId || `stop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          }
          return {
            ...day,
            activities: [...day.activities, stopWithId],
          }
        }
        return day
      })
      return { ...prevPlan, days: updatedDays }
    })
    setHasUnsavedChanges(true)
  }

  const handleRemoveStop = (dayNumber: number, activityIndex: number) => {
    setPlan((prevPlan) => {
      if (!prevPlan) return prevPlan
      const updatedDays = prevPlan.days.map((day) => {
        if (day.day === dayNumber) {
          const newActivities = day.activities.filter((_, idx) => idx !== activityIndex)
          return { ...day, activities: newActivities }
        }
        return day
      })
      return { ...prevPlan, days: updatedDays }
    })
    setHasUnsavedChanges(true)
  }

  const handleMoveStop = (dayNumber: number, activityIndex: number, direction: 'up' | 'down') => {
    setPlan((prevPlan) => {
      if (!prevPlan) return prevPlan
      const updatedDays = prevPlan.days.map((day) => {
        if (day.day === dayNumber) {
          const targetIndex = direction === 'up' ? activityIndex - 1 : activityIndex + 1
          if (targetIndex < 0 || targetIndex >= day.activities.length) return day
          const newActivities = [...day.activities]
          const [moved] = newActivities.splice(activityIndex, 1)
          newActivities.splice(targetIndex, 0, moved)
          return { ...day, activities: newActivities }
        }
        return day
      })
      return { ...prevPlan, days: updatedDays }
    })
    setHasUnsavedChanges(true)
  }

  const resetGeneratedPlan = () => {
    if (hasUnsavedChanges && !window.confirm('You have unsaved changes to your itinerary. Discard changes?')) {
      return
    }
    setPlan(null)
    setSavedTripId(null)
    setGenerationError(null)
    setEditNotice(null)
    setSaveError(null)
    setHasUnsavedChanges(false)
  }

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
      groupSize,
      budgetLevel:
        budgetLevel === 'mid-range' ? 'mid_range' : (budgetLevel as TripPlanInput['budgetLevel']),
      pace,
      interests: interests.length ? interests : ['culture', 'food'],
      avoid,
      origin: origin || undefined,
      currency: user?.homeCurrency || 'USD',
      budgetAmount: budgetAmount ? Number(budgetAmount) : undefined,
      accommodationArea: accommodationArea || undefined,
      arrivalTime: arrivalTime || undefined,
      departureTime: departureTime || undefined,
      notes: [
        plannerNotes,
        routeState.discoveryRecommendation?.supportPlaces?.length
          ? `Discovery suggested these real places for consideration: ${routeState.discoveryRecommendation.supportPlaces.join(', ')}`
          : '',
      ].filter(Boolean).join('\n') || undefined,
    }),
    [
      budgetLevel,
      budgetAmount,
      destination,
      durationDays,
      avoid,
      interests,
      origin,
      groupSize,
      accommodationArea,
      arrivalTime,
      departureTime,
      pace,
      plannerNotes,
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
    resetGeneratedPlan()
  }

  const changeStartDate = (value: string) => {
    setStartDate(value)
    setEndDate(value ? addDays(value, durationDays - 1) : '')
    resetGeneratedPlan()
  }

  const changeEndDate = (value: string) => {
    setEndDate(value)
    if (startDate && value) {
      const days = inclusiveDays(startDate, value)
      if (days >= 1 && days <= 14) {
        setDurationDays(days)
      }
    }
    resetGeneratedPlan()
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
      avoid,
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
        budgetPerDay: generatedPlan.days.map((day) => `Day ${day.day}: ${day.estimatedCostRange}`).join(' | '),
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
          cost: activity.costNote || day.estimatedCostRange,
          notes: [activity.localTip, activity.transportAdvice, ...activity.tips].filter(Boolean).join(' '),
          estimatedDuration: activity.estimatedDuration,
          priority: activity.priority,
          travelNote: activity.travelTimeFromPrevious,
          googleMapsUrl: activity.googleMapsUrl,
          fullAddress: activity.fullAddress,
          googlePlaceId: activity.googlePlaceId,
          coordinates: activity.geometry,
          rating: activity.rating,
          userRatingsTotal: activity.userRatingsTotal,
          priceLevel: activity.priceLevel,
          photoReference: activity.photoReference,
          groundingSource: activity.groundingSource,
          isVisited: false,
        })),
      })),
      groundingMeta: generatedPlan.groundingMeta,
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
      const tripData = buildSavedTrip(plan)
      if (savedTripId) {
        // Update existing trip with concurrency check
        const success = await tripService.updateTrip(savedTripId, {
          ...tripData,
          version: tripVersion,
        })
        if (!success) {
          throw new Error('Failed to update trip. Another update may have occurred. Please reload and try again.')
        }
        setTripVersion((prev) => prev + 1)
        setHasUnsavedChanges(false)
      } else {
        // Create new trip
        const saved = await tripService.createTrip(tripData)
        if (!saved?._id) {
          throw new Error('The trip was not saved.')
        }
        setSavedTripId(saved._id)
        setTripVersion(saved.version || 1)
        setHasUnsavedChanges(false)
      }
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
                {(interests.length ? interests : ['culture', 'food']).map((interest) => (
                  <span key={interest} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/75">
                    {titleCase(interest)}
                  </span>
                ))}
              </div>
              {avoid.length > 0 && (
                <p className="mt-4 text-sm text-white/60">
                  Avoiding: <span className="font-semibold text-white/80">{avoid.map(titleCase).join(' · ')}</span>
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
        <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <TripPlanWizard
            destination={destination}
            onDestinationChange={(value) => { setDestination(value); resetGeneratedPlan() }}
            origin={origin}
            onOriginChange={(value) => { setOrigin(value); resetGeneratedPlan() }}
            durationDays={durationDays}
            onDurationChange={changeDuration}
            startDate={startDate}
            onStartDateChange={changeStartDate}
            endDate={endDate}
            onEndDateChange={changeEndDate}
            travelerType={travelerType}
            onTravelerTypeChange={(value) => { setTravelerType(value); resetGeneratedPlan() }}
            groupSize={groupSize}
            onGroupSizeChange={(value) => { setGroupSize(value); resetGeneratedPlan() }}
            budgetLevel={budgetLevel}
            onBudgetLevelChange={(value) => { setBudgetLevel(value); resetGeneratedPlan() }}
            budgetAmount={budgetAmount}
            onBudgetAmountChange={(value) => { setBudgetAmount(value); resetGeneratedPlan() }}
            pace={pace}
            onPaceChange={(value) => { setPace(value); resetGeneratedPlan() }}
            interestsText={interestsText}
            onInterestsChange={(value) => { setInterestsText(value); resetGeneratedPlan() }}
            avoidText={avoidText}
            onAvoidChange={(value) => { setAvoidText(value); resetGeneratedPlan() }}
            accommodationArea={accommodationArea}
            onAccommodationAreaChange={(value) => { setAccommodationArea(value); resetGeneratedPlan() }}
            arrivalTime={arrivalTime}
            onArrivalTimeChange={(value) => { setArrivalTime(value); resetGeneratedPlan() }}
            departureTime={departureTime}
            onDepartureTimeChange={(value) => { setDepartureTime(value); resetGeneratedPlan() }}
            plannerNotes={plannerNotes}
            onPlannerNotesChange={(value) => { setPlannerNotes(value); resetGeneratedPlan() }}
            onGenerate={generatePlan}
            isGenerating={isGenerating}
            generationError={generationError}
          />
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
              <div className="flex items-center gap-2">
                <p className="font-bold text-slate-950">
                  {savedTripId ? (hasUnsavedChanges ? 'Trip plan has unsaved edits' : 'Trip plan saved') : 'Keep this plan in your account'}
                </p>
                {hasUnsavedChanges && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                    <AlertTriangle className="h-3 w-3" />Unsaved changes
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {savedTripId
                  ? (hasUnsavedChanges ? 'Click "Update Trip Plan" to save your reordered stops and edits.' : 'Your itinerary is synchronized with your account.')
                  : 'Save these recommended places and your day-by-day plan.'}
              </p>
              {saveError && <p className="mt-2 text-sm font-semibold text-rose-600">{saveError}</p>}
            </div>
            <div className="flex flex-wrap gap-3">
              {hasUnsavedChanges ? (
                <Button onClick={savePlan} loading={isSaving} className="rounded-xl bg-orange-600 text-white hover:bg-orange-700">
                  {!isSaving && <Save className="mr-2 h-4 w-4" />}
                  {savedTripId ? 'Update Trip Plan' : 'Save Trip Plan'}
                </Button>
              ) : savedTripId ? (
                <>
                  <Button onClick={() => navigate(`/trips/${savedTripId}`)} className="rounded-xl bg-emerald-600 text-white">
                    Open Saved Trip<ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button onClick={() => navigate('/trips?view=saved')} variant="outline" className="rounded-xl">
                    View All Saved Trips
                  </Button>
                </>
              ) : (
                <Button onClick={savePlan} loading={isSaving} className="rounded-xl bg-slate-950 text-white">
                  {!isSaving && <Save className="mr-2 h-4 w-4" />}Save Trip Plan
                </Button>
              )}
            </div>
          </section>
          <TripResultOverview plan={plan} />

          <details className="rounded-2xl border border-slate-200 bg-white">
            <summary className="cursor-pointer px-6 py-4 font-semibold text-slate-800">Want to adjust the suggested places?</summary>
            <CardContent className="border-t border-slate-100 p-6 sm:p-8">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#e96855]">Smart edits</p>
              <h2 className="font-heading mt-2 text-3xl font-semibold">Change one thing without starting over</h2>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {plan.smartEditActions.map((action) => {
                  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
                    make_cheaper: WalletCards, reduce_walking: Footprints, add_food: Utensils,
                    add_romantic: Heart, avoid_crowds: Users, make_relaxed: Gauge,
                    add_hidden_gems: Compass, replace_activity: RefreshCw,
                  }
                  const Icon = iconMap[action.actionType] || Sparkles
                  return (
                    <button key={action.actionType} type="button" onClick={() => handleSmartEdit(action)} disabled={Boolean(editingActionType)} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-orange-300 disabled:cursor-not-allowed disabled:opacity-60">
                      <Icon className="h-5 w-5 text-[#e96855]" />
                      <p className="mt-3 text-sm font-bold">{editingActionType === action.actionType ? 'Applying...' : action.label}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{action.description}</p>
                    </button>
                  )
                })}
              </div>
              {editNotice && <div className="mt-5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">{editNotice}</div>}
            </CardContent>
          </details>

          <section>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#e96855]">Your preference-matched plan</p>
                <h2 className="font-heading mt-2 text-3xl font-semibold">Places to visit, organized by day</h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-500">{plan.finalAdvice}</p>
            </div>
            <div className="mt-6 space-y-4">
              {plan.days.map((day) => (
                <TripDayCard
                  key={day.day}
                  day={day}
                  defaultExpanded
                  onAddStop={handleAddStop}
                  onRemoveStop={handleRemoveStop}
                  onMoveStop={handleMoveStop}
                />
              ))}
            </div>
          </section>

          <section className="hidden" aria-hidden="true">
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
                          <p className="mt-1 text-xs text-slate-500">{place.priority}</p>
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

          <details className="hidden rounded-2xl border border-slate-200 bg-white p-5">
            <summary className="cursor-pointer font-semibold text-slate-800">Show budget, alternatives, and travel advice</summary>
          <section className="mt-6 grid gap-5 lg:grid-cols-3">
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
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-slate-900">{item.name}</p>
                            {typeof item.rating === 'number' && (
                              <span className="text-xs font-bold text-amber-600">★ {item.rating.toFixed(1)}</span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-slate-600">{item.reason}</p>
                          {item.googleMapsUrl && (
                            <a href={item.googleMapsUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold text-sky-700">
                              Open in Maps
                            </a>
                          )}
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
          </details>
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
