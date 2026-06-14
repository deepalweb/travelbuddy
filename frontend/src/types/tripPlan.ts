export type TripPlanInput = {
  destination: string
  origin?: string
  country?: string
  startDate?: string
  endDate?: string
  month?: string
  durationDays: number
  travelerType: 'solo' | 'couple' | 'family' | 'friends' | 'business_leisure'
  budgetLevel: 'budget' | 'mid_range' | 'luxury'
  budgetAmount?: number
  currency?: string
  pace: 'relaxed' | 'balanced' | 'packed'
  interests: string[]
  avoid?: string[]
  accommodationArea?: string
  arrivalTime?: string
  departureTime?: string
  notes?: string
}

export type TripActivity = {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  title: string
  placeName?: string
  fullAddress?: string
  googleMapsUrl?: string
  nearbySearchUrl?: string
  googlePlaceId?: string
  description: string
  type:
    | 'attraction'
    | 'food'
    | 'nature'
    | 'culture'
    | 'rest'
    | 'transport'
    | 'shopping'
    | 'experience'
  priority: 'must_do' | 'recommended' | 'optional'
  estimatedDuration: string
  travelTimeFromPrevious?: string
  localTip?: string
  reservationAdvice?: 'book ahead' | 'same-day booking' | 'walk-in' | 'not needed' | 'unknown'
  tips: string[]
}

export type TripPlanDay = {
  day: number
  title: string
  theme: string
  energyLevel: 'easy' | 'moderate' | 'high'
  walkingLevel: 'low' | 'medium' | 'high'
  estimatedCostRange: string
  bestTimeToStart: string
  whyThisDayWorks: string
  routeLogic?: string
  activities: TripActivity[]
  mealSuggestions?: {
    breakfast?: string
    lunch?: string
    dinner?: string
  }
  weatherBackup?: string
  dayWarnings: string[]
  editSuggestions: string[]
}

export type PriorityPlace = {
  name: string
  reason: string
  bestTime?: string
}

export type TripPlanResult = {
  tripTitle: string
  destination: string
  durationDays: number
  travelerType: string
  tripStyle: string[]
  planningConfidenceScore: number
  tripSummary: {
    shortDescription: string
    bestFor: string[]
    notIdealFor: string[]
  }
  tripHealth: {
    overall: 'excellent' | 'good' | 'average' | 'risky'
    budgetFit: 'excellent' | 'good' | 'tight' | 'poor'
    paceComfort: 'relaxed' | 'balanced' | 'busy' | 'too_busy'
    logistics: 'easy' | 'moderate' | 'complex'
    mainWarnings: string[]
  }
  realityCheck: {
    isRealistic: boolean
    summary: string
    warnings: string[]
    recommendations: string[]
  }
  days: TripPlanDay[]
  mustDo: PriorityPlace[]
  optional: PriorityPlace[]
  skipIfShortOnTime: PriorityPlace[]
  budget: {
    currency: string
    estimatedTotalRange: string
    confidence: 'high' | 'medium' | 'low'
    breakdown: Array<{
      category: 'accommodation' | 'food' | 'transport' | 'activities' | 'buffer' | string
      range: string
      notes: string
    }>
  }
  commonMistakes: Array<{
    mistake: string
    whyItMatters: string
    howToAvoid: string
  }>
  practicalInfo: {
    transportationAdvice: string[]
    culturalEtiquette: string[]
    packingTips: string[]
    sustainabilityTips: string[]
  }
  smartEditActions: Array<{
    label: string
    actionType:
      | 'make_cheaper'
      | 'reduce_walking'
      | 'add_food'
      | 'add_romantic'
      | 'avoid_crowds'
      | 'make_relaxed'
      | 'add_hidden_gems'
      | 'replace_activity'
    description: string
  }>
  finalAdvice: string
}
