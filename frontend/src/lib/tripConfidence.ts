import type { TripPlan } from '../services/tripService'

export type ConfidenceCategory = {
  key: 'fit' | 'budget' | 'realism' | 'comfort' | 'booking'
  label: string
  score: number
  tone: 'strong' | 'watch' | 'weak'
  summary: string
}

export type TripConfidenceResult = {
  overall: number
  tone: 'strong' | 'watch' | 'weak'
  summary: string
  strengths: string[]
  warnings: string[]
  categories: ConfidenceCategory[]
}

const clampScore = (value: number) => Math.max(0, Math.min(100, Math.round(value)))

const scoreTone = (score: number): 'strong' | 'watch' | 'weak' => {
  if (score >= 75) return 'strong'
  if (score >= 50) return 'watch'
  return 'weak'
}

const parseNumeric = (value?: string) => {
  if (!value) return 0
  const numeric = parseFloat(String(value).replace(/[^0-9.]/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

const looksMissing = (value?: string) => {
  const text = String(value || '').toLowerCase().trim()
  return !text || /not provided|estimate pending|to be confirmed|budget pending|n\/a/.test(text)
}

export function calculateTripConfidence(trip: TripPlan): TripConfidenceResult {
  const itinerary = trip.dailyItinerary || []
  const activities = itinerary.flatMap((day) => day.activities || [])
  const weatherBackupDays = itinerary.filter((day) => day.weatherBackup && day.weatherBackup.trim()).length
  const packedDays = itinerary.filter((day) => (day.activities?.length || 0) >= 6).length
  const bookingCount = trip.preTripPreparation?.booking?.length || 0
  const bookingPriorityCount = trip.tripOverview?.bookingPriority?.length || 0
  const routeStrategyCount = trip.tripOverview?.routeStrategy?.length || 0
  const keyAttractionCount = trip.tripOverview?.keyAttractions?.length || 0
  const estimatedBudget = trip.tripOverview?.estimatedTotalBudget || trip.expenseBreakdown?.total || trip.totalEstimatedCost
  const hasBudget = !looksMissing(estimatedBudget) && parseNumeric(estimatedBudget) > 0
  const costFields = [
    trip.expenseBreakdown?.fixed?.accommodation?.cost,
    trip.expenseBreakdown?.fixed?.transport?.cost,
    trip.expenseBreakdown?.fixed?.tickets?.cost,
    trip.expenseBreakdown?.variable?.dining?.cost,
    trip.expenseBreakdown?.variable?.localTransport?.cost,
  ]
  const knownCostFields = costFields.filter((value) => !looksMissing(value)).length
  const estimatedTravelFields = itinerary.filter((day) => !looksMissing(day.estimatedTravelTime)).length
  const comfortSignals =
    itinerary.filter((day) => !looksMissing(day.energyLevel)).length +
    itinerary.filter((day) => !looksMissing(day.optionalAddOn)).length

  let fitScore = 35
  if (trip.destination) fitScore += 15
  if (trip.duration) fitScore += 10
  if (itinerary.length > 0) fitScore += 15
  if (keyAttractionCount >= 4) fitScore += 15
  if (trip.travelStyle || trip.tripOverview?.tripStyle) fitScore += 10

  let budgetScore = 20
  if (hasBudget) budgetScore += 35
  budgetScore += Math.min(knownCostFields * 8, 30)
  if (!looksMissing(trip.tripOverview?.budgetPerDay)) budgetScore += 15

  let realismScore = 30
  realismScore += Math.min(routeStrategyCount * 12, 24)
  realismScore += Math.min(weatherBackupDays * 10, 20)
  realismScore += Math.min(estimatedTravelFields * 8, 16)
  realismScore -= packedDays * 8
  if (activities.length < itinerary.length * 2) realismScore -= 10

  let comfortScore = 30
  comfortScore += Math.min(comfortSignals * 7, 28)
  if (!looksMissing(trip.tripOverview?.paceScore)) comfortScore += 12
  if (!looksMissing(trip.tripOverview?.travelEfficiency)) comfortScore += 10
  if (packedDays > 0) comfortScore -= packedDays * 10

  let bookingScore = 20
  bookingScore += Math.min(bookingCount * 18, 45)
  bookingScore += Math.min(bookingPriorityCount * 10, 25)
  if (trip.startDate) bookingScore += 10
  if (trip.preTripPreparation?.packing?.length) bookingScore += 10

  const categories: ConfidenceCategory[] = [
    {
      key: 'fit',
      label: 'Trip fit',
      score: clampScore(fitScore),
      tone: scoreTone(clampScore(fitScore)),
      summary: keyAttractionCount >= 4 ? 'The trip has a clear identity and enough anchors.' : 'The trip still needs clearer anchors or stronger focus.',
    },
    {
      key: 'budget',
      label: 'Budget confidence',
      score: clampScore(budgetScore),
      tone: scoreTone(clampScore(budgetScore)),
      summary: hasBudget ? 'A usable cost frame exists for this draft.' : 'The budget still feels too vague to trust fully.',
    },
    {
      key: 'realism',
      label: 'Reality check',
      score: clampScore(realismScore),
      tone: scoreTone(clampScore(realismScore)),
      summary: packedDays === 0 ? 'The pacing looks workable from a first-pass review.' : 'Some days still look denser than they should be.',
    },
    {
      key: 'comfort',
      label: 'Comfort level',
      score: clampScore(comfortScore),
      tone: scoreTone(clampScore(comfortScore)),
      summary: packedDays === 0 ? 'The trip should feel manageable for most travelers.' : 'Heat, fatigue, or movement may still affect the trip.',
    },
    {
      key: 'booking',
      label: 'Booking readiness',
      score: clampScore(bookingScore),
      tone: scoreTone(clampScore(bookingScore)),
      summary: bookingCount > 0 || bookingPriorityCount > 0 ? 'The draft gives travelers useful next actions.' : 'Booking guidance still needs more structure.',
    },
  ]

  const overall = clampScore(
    categories.reduce((sum, category) => sum + category.score, 0) / categories.length
  )

  const strengths: string[] = []
  const warnings: string[] = []

  if (keyAttractionCount >= 4) strengths.push('The trip has enough named anchors to feel purposeful.')
  if (weatherBackupDays >= Math.max(1, itinerary.length - 1)) strengths.push('Most days include weather backup logic.')
  if (hasBudget) strengths.push('A usable budget estimate already exists for the traveler.')
  if (bookingCount > 0 || bookingPriorityCount > 0) strengths.push('Booking guidance is present, so the next steps are clearer.')

  if (!hasBudget) warnings.push('Budget numbers are still too uncertain for confident decisions.')
  if (packedDays > 0) warnings.push(`${packedDays} day(s) may still feel too packed for a relaxed traveler.`)
  if (weatherBackupDays < itinerary.length) warnings.push('At least one day is still missing a strong weather fallback.')
  if ((bookingCount + bookingPriorityCount) === 0) warnings.push('Booking urgency and pre-trip actions still need more detail.')

  const tone = scoreTone(overall)
  const summary =
    tone === 'strong'
      ? 'Strong trip confidence'
      : tone === 'watch'
        ? 'Good trip potential with a few watchouts'
        : 'Low confidence until the draft is refined'

  return {
    overall,
    tone,
    summary,
    strengths,
    warnings,
    categories,
  }
}
