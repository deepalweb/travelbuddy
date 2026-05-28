export type DiscoveryBudget = 'budget' | 'mid-range' | 'luxury'
export type DiscoveryTravelerType = 'solo' | 'couple' | 'family' | 'friends'
export type DiscoveryDuration = 'weekend' | 'short' | 'medium' | 'long'
export type DiscoveryInterest =
  | 'beach'
  | 'adventure'
  | 'food'
  | 'nature'
  | 'culture'
  | 'nightlife'
  | 'luxury'
  | 'romantic'
  | 'family'
  | 'shopping'

export interface DiscoveryFormState {
  departure: string
  month: string
  budget: DiscoveryBudget | ''
  duration: DiscoveryDuration | ''
  travelerType: DiscoveryTravelerType | ''
  interests: DiscoveryInterest[]
}

export interface DestinationRecommendation {
  id: string
  name: string
  country: string
  region: string
  image: string
  tagline: string
  score: number
  estimatedTripCost: string
  weatherLabel: string
  flightLabel: string
  visaLabel: string
  trendLabel: string
  bestFor: string[]
  whyItFits: string[]
  caution?: string
  planningPrompt: string
}

type DestinationProfile = {
  id: string
  name: string
  country: string
  region: string
  tagline: string
  image: string
  bestMonths: string[]
  shoulderMonths: string[]
  avoidMonths: string[]
  budgetFit: DiscoveryBudget[]
  interests: DiscoveryInterest[]
  travelerTypes: DiscoveryTravelerType[]
  durations: DiscoveryDuration[]
  trendMonths: string[]
  specialMoments: Array<{
    months: string[]
    label: string
  }>
  costBands: Record<DiscoveryBudget, string>
  visaLabel: string
  flightTimes: {
    asia: string
    europe: string
    middleEast: string
    northAmerica: string
    other: string
  }
  caution?: string
}

const monthOrder = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export const discoveryMonths = monthOrder

export const discoveryInterests: Array<{ id: DiscoveryInterest; label: string }> = [
  { id: 'beach', label: 'Beach' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'food', label: 'Food' },
  { id: 'nature', label: 'Nature' },
  { id: 'culture', label: 'Culture' },
  { id: 'nightlife', label: 'Nightlife' },
  { id: 'luxury', label: 'Luxury' },
  { id: 'romantic', label: 'Romantic' },
  { id: 'family', label: 'Family' },
  { id: 'shopping', label: 'Shopping' },
]

const destinationProfiles: DestinationProfile[] = [
  {
    id: 'bali',
    name: 'Bali',
    country: 'Indonesia',
    region: 'Southeast Asia',
    tagline: 'Dry-season beaches, cafes, villas, and easy mixed-style travel.',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['May', 'June', 'July', 'August', 'September'],
    shoulderMonths: ['April', 'October'],
    avoidMonths: ['December', 'January', 'February'],
    budgetFit: ['budget', 'mid-range', 'luxury'],
    interests: ['beach', 'food', 'nature', 'romantic', 'luxury', 'shopping'],
    travelerTypes: ['solo', 'couple', 'friends', 'family'],
    durations: ['short', 'medium', 'long'],
    trendMonths: ['June', 'July', 'August'],
    specialMoments: [{ months: ['July', 'August'], label: 'Peak dry season with strong social buzz' }],
    costBands: {
      budget: '$900-$1,300',
      'mid-range': '$1,400-$2,200',
      luxury: '$2,800+',
    },
    visaLabel: 'Usually easy for many travelers',
    flightTimes: {
      asia: '4-8h',
      europe: '16-18h',
      middleEast: '9-10h',
      northAmerica: '20h+',
      other: '8-14h',
    },
  },
  {
    id: 'phuket',
    name: 'Phuket',
    country: 'Thailand',
    region: 'Southeast Asia',
    tagline: 'Beach energy, island hopping, nightlife, and value for money.',
    image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['November', 'December', 'January', 'February', 'March'],
    shoulderMonths: ['April', 'October'],
    avoidMonths: ['May', 'June', 'July', 'August', 'September'],
    budgetFit: ['budget', 'mid-range'],
    interests: ['beach', 'nightlife', 'food', 'adventure', 'family'],
    travelerTypes: ['solo', 'couple', 'friends', 'family'],
    durations: ['weekend', 'short', 'medium'],
    trendMonths: ['December', 'January', 'February'],
    specialMoments: [{ months: ['January', 'February'], label: 'High-season island hopping window' }],
    costBands: {
      budget: '$700-$1,100',
      'mid-range': '$1,200-$1,900',
      luxury: '$2,400+',
    },
    visaLabel: 'Easy for many markets',
    flightTimes: {
      asia: '2-6h',
      europe: '13-15h',
      middleEast: '8-9h',
      northAmerica: '19h+',
      other: '8-14h',
    },
  },
  {
    id: 'sri-lanka-south',
    name: 'Sri Lanka South Coast',
    country: 'Sri Lanka',
    region: 'South Asia',
    tagline: 'Surf towns, safaris, beach cafés, and culture in one trip.',
    image: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['December', 'January', 'February', 'March', 'April'],
    shoulderMonths: ['November', 'July', 'August'],
    avoidMonths: ['May', 'June', 'October'],
    budgetFit: ['budget', 'mid-range'],
    interests: ['beach', 'adventure', 'nature', 'food', 'culture', 'romantic'],
    travelerTypes: ['solo', 'couple', 'friends', 'family'],
    durations: ['short', 'medium', 'long'],
    trendMonths: ['December', 'January'],
    specialMoments: [{ months: ['January', 'February'], label: 'Best south-coast beach season' }],
    costBands: {
      budget: '$600-$900',
      'mid-range': '$1,000-$1,600',
      luxury: '$2,200+',
    },
    visaLabel: 'ETA-style visa is generally straightforward',
    flightTimes: {
      asia: '1-6h',
      europe: '11-13h',
      middleEast: '4-5h',
      northAmerica: '20h+',
      other: '8-13h',
    },
  },
  {
    id: 'kyoto',
    name: 'Kyoto',
    country: 'Japan',
    region: 'East Asia',
    tagline: 'Temples, design-led stays, food rituals, and seasonal beauty.',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['March', 'April', 'October', 'November'],
    shoulderMonths: ['May', 'September'],
    avoidMonths: ['June', 'July', 'August'],
    budgetFit: ['mid-range', 'luxury'],
    interests: ['culture', 'food', 'shopping', 'romantic', 'luxury'],
    travelerTypes: ['solo', 'couple', 'family'],
    durations: ['short', 'medium'],
    trendMonths: ['March', 'April', 'November'],
    specialMoments: [
      { months: ['March', 'April'], label: 'Cherry blossom demand spike' },
      { months: ['November'], label: 'Autumn foliage season' },
    ],
    costBands: {
      budget: '$1,400-$1,900',
      'mid-range': '$2,000-$3,000',
      luxury: '$3,800+',
    },
    visaLabel: 'Usually simple for short stays from many countries',
    flightTimes: {
      asia: '2-7h',
      europe: '14-16h',
      middleEast: '10-11h',
      northAmerica: '11-14h',
      other: '8-15h',
    },
    caution: 'Can feel expensive during cherry blossom and foliage peaks.',
  },
  {
    id: 'istanbul',
    name: 'Istanbul',
    country: 'Turkey',
    region: 'Europe / Middle East',
    tagline: 'City break with bazaars, rooftop dining, and cross-continental culture.',
    image: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['April', 'May', 'September', 'October'],
    shoulderMonths: ['March', 'June', 'November'],
    avoidMonths: ['July', 'August'],
    budgetFit: ['budget', 'mid-range'],
    interests: ['culture', 'food', 'shopping', 'nightlife', 'romantic'],
    travelerTypes: ['solo', 'couple', 'friends', 'family'],
    durations: ['weekend', 'short', 'medium'],
    trendMonths: ['April', 'May', 'September'],
    specialMoments: [{ months: ['April', 'May'], label: 'Spring city-break season' }],
    costBands: {
      budget: '$800-$1,200',
      'mid-range': '$1,300-$2,000',
      luxury: '$2,900+',
    },
    visaLabel: 'Varies by passport but often manageable online',
    flightTimes: {
      asia: '7-10h',
      europe: '3-4h',
      middleEast: '4-5h',
      northAmerica: '10-12h',
      other: '7-12h',
    },
  },
  {
    id: 'cape-town',
    name: 'Cape Town',
    country: 'South Africa',
    region: 'Africa',
    tagline: 'A dramatic mix of coast, wine, hikes, and design-forward stays.',
    image: 'https://images.unsplash.com/photo-1576485290814-1c72aa4bbb8e?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['November', 'December', 'January', 'February', 'March'],
    shoulderMonths: ['October', 'April'],
    avoidMonths: ['June', 'July', 'August'],
    budgetFit: ['mid-range', 'luxury'],
    interests: ['nature', 'food', 'adventure', 'romantic', 'luxury'],
    travelerTypes: ['solo', 'couple', 'friends'],
    durations: ['short', 'medium', 'long'],
    trendMonths: ['December', 'January', 'February'],
    specialMoments: [{ months: ['January', 'February'], label: 'Summer season with strong coastal demand' }],
    costBands: {
      budget: '$1,200-$1,700',
      'mid-range': '$1,800-$2,600',
      luxury: '$3,600+',
    },
    visaLabel: 'Depends on origin; planning ahead helps',
    flightTimes: {
      asia: '12-15h',
      europe: '11-12h',
      middleEast: '9-10h',
      northAmerica: '20h+',
      other: '9-16h',
    },
  },
  {
    id: 'lisbon',
    name: 'Lisbon',
    country: 'Portugal',
    region: 'Europe',
    tagline: 'Warm city energy, coastal day trips, pastries, and easy pacing.',
    image: 'https://images.unsplash.com/photo-1513735492246-483525079686?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['April', 'May', 'June', 'September', 'October'],
    shoulderMonths: ['March', 'July', 'August'],
    avoidMonths: ['December', 'January'],
    budgetFit: ['mid-range'],
    interests: ['food', 'culture', 'nightlife', 'romantic', 'shopping'],
    travelerTypes: ['solo', 'couple', 'friends'],
    durations: ['weekend', 'short', 'medium'],
    trendMonths: ['May', 'June', 'September'],
    specialMoments: [{ months: ['June'], label: 'Festival energy and long daylight' }],
    costBands: {
      budget: '$1,000-$1,500',
      'mid-range': '$1,600-$2,400',
      luxury: '$3,300+',
    },
    visaLabel: 'Schengen rules apply',
    flightTimes: {
      asia: '14-17h',
      europe: '2-4h',
      middleEast: '7-8h',
      northAmerica: '7-9h',
      other: '8-15h',
    },
  },
  {
    id: 'queenstown',
    name: 'Queenstown',
    country: 'New Zealand',
    region: 'Oceania',
    tagline: 'Premium nature-and-adventure base with unforgettable scenery.',
    image: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['December', 'January', 'February', 'March'],
    shoulderMonths: ['April', 'November'],
    avoidMonths: ['June', 'July'],
    budgetFit: ['mid-range', 'luxury'],
    interests: ['adventure', 'nature', 'romantic', 'luxury'],
    travelerTypes: ['solo', 'couple', 'friends'],
    durations: ['medium', 'long'],
    trendMonths: ['December', 'January'],
    specialMoments: [{ months: ['January', 'February'], label: 'Peak summer outdoors season' }],
    costBands: {
      budget: '$1,800-$2,400',
      'mid-range': '$2,500-$3,600',
      luxury: '$4,800+',
    },
    visaLabel: 'Usually digital and straightforward for many origins',
    flightTimes: {
      asia: '10-12h',
      europe: '23h+',
      middleEast: '18-20h',
      northAmerica: '15-18h',
      other: '12-18h',
    },
  },
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'United Arab Emirates',
    region: 'Middle East',
    tagline: 'Luxury, shopping, short breaks, and easy premium convenience.',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['November', 'December', 'January', 'February', 'March'],
    shoulderMonths: ['April', 'October'],
    avoidMonths: ['June', 'July', 'August'],
    budgetFit: ['mid-range', 'luxury'],
    interests: ['luxury', 'shopping', 'family', 'food', 'nightlife'],
    travelerTypes: ['couple', 'friends', 'family'],
    durations: ['weekend', 'short'],
    trendMonths: ['December', 'January', 'February'],
    specialMoments: [{ months: ['January', 'February'], label: 'Peak winter-escape season' }],
    costBands: {
      budget: '$1,100-$1,600',
      'mid-range': '$1,700-$2,700',
      luxury: '$4,000+',
    },
    visaLabel: 'Often easy, but passport-specific',
    flightTimes: {
      asia: '4-8h',
      europe: '6-7h',
      middleEast: '1-3h',
      northAmerica: '13-15h',
      other: '6-14h',
    },
  },
  {
    id: 'vietnam-central',
    name: 'Da Nang & Hoi An',
    country: 'Vietnam',
    region: 'Southeast Asia',
    tagline: 'Beach plus heritage plus food with very strong value.',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['February', 'March', 'April', 'May', 'June'],
    shoulderMonths: ['January', 'July'],
    avoidMonths: ['October', 'November'],
    budgetFit: ['budget', 'mid-range'],
    interests: ['beach', 'food', 'culture', 'family', 'romantic'],
    travelerTypes: ['solo', 'couple', 'friends', 'family'],
    durations: ['short', 'medium'],
    trendMonths: ['March', 'April', 'June'],
    specialMoments: [{ months: ['March', 'April'], label: 'Sweet spot for weather and value' }],
    costBands: {
      budget: '$650-$1,000',
      'mid-range': '$1,100-$1,700',
      luxury: '$2,300+',
    },
    visaLabel: 'Often simple online, but passport rules vary',
    flightTimes: {
      asia: '2-6h',
      europe: '14-16h',
      middleEast: '8-10h',
      northAmerica: '18h+',
      other: '8-14h',
    },
  },
]

const classifyOriginRegion = (departure: string) => {
  const value = departure.toLowerCase()

  if (/(london|paris|rome|berlin|amsterdam|madrid|lisbon|france|germany|uk|united kingdom|europe)/.test(value)) {
    return 'europe'
  }
  if (/(dubai|abu dhabi|doha|riyadh|jeddah|muscat|kuwait|qatar|uae|saudi|middle east)/.test(value)) {
    return 'middleEast'
  }
  if (/(new york|toronto|vancouver|los angeles|san francisco|chicago|usa|united states|canada|north america)/.test(value)) {
    return 'northAmerica'
  }
  if (/(colombo|delhi|mumbai|bangkok|singapore|tokyo|seoul|jakarta|manila|hong kong|asia|sri lanka|india)/.test(value)) {
    return 'asia'
  }

  return 'other'
}

const getWeatherLabel = (destination: DestinationProfile, month: string) => {
  if (destination.bestMonths.includes(month)) return 'Excellent season'
  if (destination.shoulderMonths.includes(month)) return 'Good shoulder season'
  if (destination.avoidMonths.includes(month)) return 'Less ideal weather'
  return 'Mixed seasonal fit'
}

const getTrendLabel = (destination: DestinationProfile, month: string) => {
  const moment = destination.specialMoments.find((entry) => entry.months.includes(month))
  if (moment) return moment.label
  if (destination.trendMonths.includes(month)) return 'Trending strongly this month'
  return 'Solid year-round interest'
}

const getBudgetScore = (destination: DestinationProfile, budget: DiscoveryBudget) => {
  if (destination.budgetFit.includes(budget)) return 24
  if (budget === 'luxury' && destination.budgetFit.includes('mid-range')) return 14
  if (budget === 'mid-range' && destination.budgetFit.includes('budget')) return 12
  return 4
}

const getMonthScore = (destination: DestinationProfile, month: string) => {
  if (destination.bestMonths.includes(month)) return 28
  if (destination.shoulderMonths.includes(month)) return 16
  if (destination.avoidMonths.includes(month)) return -8
  return 8
}

const getInterestScore = (destination: DestinationProfile, interests: DiscoveryInterest[]) => {
  const matches = interests.filter((interest) => destination.interests.includes(interest))
  return matches.length * 7
}

const getDurationScore = (destination: DestinationProfile, duration: DiscoveryDuration) =>
  destination.durations.includes(duration) ? 12 : 5

const getTravelerScore = (destination: DestinationProfile, travelerType: DiscoveryTravelerType) =>
  destination.travelerTypes.includes(travelerType) ? 10 : 3

const getTrendScore = (destination: DestinationProfile, month: string) =>
  destination.trendMonths.includes(month) ? 8 : 3

export const buildDiscoveryRecommendations = (form: DiscoveryFormState): DestinationRecommendation[] => {
  const originRegion = classifyOriginRegion(form.departure)

  return destinationProfiles
    .map((destination) => {
      const score =
        getMonthScore(destination, form.month) +
        getBudgetScore(destination, form.budget as DiscoveryBudget) +
        getInterestScore(destination, form.interests) +
        getDurationScore(destination, form.duration as DiscoveryDuration) +
        getTravelerScore(destination, form.travelerType as DiscoveryTravelerType) +
        getTrendScore(destination, form.month)

      const matchingInterests = form.interests.filter((interest) => destination.interests.includes(interest))
      const whyItFits = [
        `${form.month} gives ${destination.name} a ${getWeatherLabel(destination, form.month).toLowerCase()}.`,
        `${destination.name} aligns with your ${form.budget} budget range.`,
        matchingInterests.length > 0
          ? `It matches your interests in ${matchingInterests.slice(0, 3).join(', ')}.`
          : `It still offers a balanced mix of city, stay, and activity options.`,
      ]

      if (destination.trendMonths.includes(form.month)) {
        whyItFits.push(`${destination.name} is especially popular in ${form.month} right now.`)
      }

      return {
        id: destination.id,
        name: destination.name,
        country: destination.country,
        region: destination.region,
        image: destination.image,
        tagline: destination.tagline,
        score,
        estimatedTripCost: destination.costBands[form.budget as DiscoveryBudget],
        weatherLabel: getWeatherLabel(destination, form.month),
        flightLabel: destination.flightTimes[originRegion as keyof DestinationProfile['flightTimes']] || destination.flightTimes.other,
        visaLabel: destination.visaLabel,
        trendLabel: getTrendLabel(destination, form.month),
        bestFor: destination.interests.slice(0, 4),
        whyItFits,
        caution: destination.avoidMonths.includes(form.month) ? destination.caution || `This month is less ideal there, so prices or weather may work against you.` : destination.caution,
        planningPrompt: `${destination.name}, ${destination.country} for a ${form.duration} ${form.travelerType} trip focused on ${form.interests.join(', ') || 'balanced travel'}`,
      }
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
}
