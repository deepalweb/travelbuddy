export type DiscoveryBudget = 'budget' | 'mid-range' | 'luxury'
export type DiscoveryTravelerType = 'solo' | 'couple' | 'family' | 'friends' | 'business-leisure'
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
  | 'wellness'
  | 'photography'
  | 'budget-friendly'

export interface DiscoveryFormState {
  departure: string
  month: string
  budget: DiscoveryBudget | ''
  duration: DiscoveryDuration | ''
  travelerType: DiscoveryTravelerType | ''
  interests: DiscoveryInterest[]
  avoid: string[]
  tripNotes: string
}

export interface DestinationRecommendation {
  id: string
  destination: string
  name: string
  parentDestination: string
  country: string
  region: string
  placeType: string
  image: string
  tagline: string
  matchScore: number
  score: number
  estimatedTripCost: string
  weatherLabel: string
  flightLabel: string
  visaLabel: string
  trendLabel: string
  budgetFit: string
  weatherFit: string
  flightFit: string
  crowdRisk: string
  bestFor: string[]
  supportPlaces: string[]
  whyFits: string[]
  whyItFits: string[]
  tripFeeling: string[]
  risks: string[]
  bestVersion: string
  caution?: string
  planningPrompt: string
}

type AreaProfile = {
  id: string
  name: string
  parentDestination: string
  country: string
  region: string
  placeType: 'coast' | 'beach town' | 'district' | 'town' | 'mountain base' | 'city quarter'
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
  keywordTags: string[]
  supportPlaces: string[]
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
  { id: 'wellness', label: 'Wellness' },
  { id: 'photography', label: 'Photography' },
  { id: 'budget-friendly', label: 'Budget-friendly' },
]

export const discoveryAvoidOptions = [
  'too much walking',
  'crowds',
  'expensive places',
  'long flights',
  'extreme heat',
  'rainy season',
  'tourist traps',
  'tight schedules',
]

const keywordInterestMap: Array<{ pattern: RegExp; interests: DiscoveryInterest[]; keywords: string[] }> = [
  {
    pattern: /(seafood|sea food|sushi|food|eat|dining|restaurant|cafe|local dishes|fine dining|street food)/,
    interests: ['food'],
    keywords: ['food', 'seafood', 'dining'],
  },
  {
    pattern: /(beach|island|coast|coastal|sea|ocean|sunset beach)/,
    interests: ['beach'],
    keywords: ['beach', 'coastal', 'island'],
  },
  {
    pattern: /(shopping|mall|markets|market|boutiques|design shops)/,
    interests: ['shopping'],
    keywords: ['shopping', 'markets'],
  },
  {
    pattern: /(romantic|honeymoon|couple|date|sunset dinner)/,
    interests: ['romantic'],
    keywords: ['romantic', 'sunset'],
  },
  {
    pattern: /(nature|green|mountains|lake|scenic|views|landscape|forest)/,
    interests: ['nature'],
    keywords: ['nature', 'scenic', 'landscape'],
  },
  {
    pattern: /(adventure|hiking|surf|diving|outdoors|safari|road trip|climb|trek)/,
    interests: ['adventure'],
    keywords: ['adventure', 'outdoors', 'surf', 'hiking'],
  },
  {
    pattern: /(culture|history|temples|museum|local life|heritage|old town)/,
    interests: ['culture'],
    keywords: ['culture', 'heritage', 'old town'],
  },
  {
    pattern: /(nightlife|bars|party|clubs|late night|beach club)/,
    interests: ['nightlife'],
    keywords: ['nightlife', 'party'],
  },
  {
    pattern: /(luxury|premium|five star|resort|villa|spa)/,
    interests: ['luxury'],
    keywords: ['luxury', 'resort', 'villa'],
  },
  {
    pattern: /(family|kids|child friendly|easy logistics)/,
    interests: ['family'],
    keywords: ['family', 'kid friendly'],
  },
]

type ParsedTripIntent = {
  inferredInterests: DiscoveryInterest[]
  matchedKeywords: string[]
}

const areaProfiles: AreaProfile[] = [
  {
    id: 'uluwatu-bali',
    name: 'Uluwatu',
    parentDestination: 'Bali',
    country: 'Indonesia',
    region: 'Bukit Peninsula',
    placeType: 'coast',
    tagline: 'Cliffside sunsets, surf beaches, stylish stays, and a slower couple-friendly feel.',
    image: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['May', 'June', 'July', 'August', 'September'],
    shoulderMonths: ['April', 'October'],
    avoidMonths: ['December', 'January', 'February'],
    budgetFit: ['mid-range', 'luxury'],
    interests: ['beach', 'romantic', 'adventure', 'luxury', 'nature'],
    travelerTypes: ['couple', 'friends', 'solo'],
    durations: ['short', 'medium', 'long'],
    trendMonths: ['June', 'July', 'August'],
    specialMoments: [{ months: ['July', 'August'], label: 'Dry-season surf and sunset sweet spot' }],
    costBands: { budget: '$1,100-$1,500', 'mid-range': '$1,700-$2,500', luxury: '$3,200+' },
    visaLabel: 'Usually easy for many travelers',
    keywordTags: ['beach', 'surf', 'cliffs', 'sunset', 'villas', 'romantic'],
    supportPlaces: ['Padang Padang Beach', 'Uluwatu Temple cliffs', 'Bingin Beach', 'Single Fin sunset area'],
    flightTimes: { asia: '4-8h', europe: '16-18h', middleEast: '9-10h', northAmerica: '20h+', other: '8-14h' },
  },
  {
    id: 'jimbaran-bali',
    name: 'Jimbaran',
    parentDestination: 'Bali',
    country: 'Indonesia',
    region: 'South Bali',
    placeType: 'beach town',
    tagline: 'Seafood dinners on the sand, calm water, and easy resort time for couples.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['May', 'June', 'July', 'August', 'September'],
    shoulderMonths: ['April', 'October'],
    avoidMonths: ['December', 'January', 'February'],
    budgetFit: ['mid-range', 'luxury'],
    interests: ['beach', 'food', 'romantic', 'luxury'],
    travelerTypes: ['couple', 'family'],
    durations: ['weekend', 'short', 'medium'],
    trendMonths: ['June', 'July', 'August'],
    specialMoments: [{ months: ['June', 'July'], label: 'Prime beach-dinner season' }],
    costBands: { budget: '$950-$1,300', 'mid-range': '$1,500-$2,200', luxury: '$3,000+' },
    visaLabel: 'Usually easy for many travelers',
    keywordTags: ['seafood', 'beach dinners', 'sunset', 'resorts', 'couples'],
    supportPlaces: ['Jimbaran Beach', 'seafood dinner strip', 'AYANA sunset bars', 'Kedonganan fish market'],
    flightTimes: { asia: '4-8h', europe: '16-18h', middleEast: '9-10h', northAmerica: '20h+', other: '8-14h' },
  },
  {
    id: 'ubud-bali',
    name: 'Ubud',
    parentDestination: 'Bali',
    country: 'Indonesia',
    region: 'Central Bali',
    placeType: 'town',
    tagline: 'Rice terraces, spa villas, temples, cafés, and a softer cultural-nature balance.',
    image: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['May', 'June', 'July', 'August', 'September'],
    shoulderMonths: ['April', 'October'],
    avoidMonths: ['December', 'January', 'February'],
    budgetFit: ['budget', 'mid-range', 'luxury'],
    interests: ['nature', 'culture', 'food', 'romantic', 'luxury'],
    travelerTypes: ['solo', 'couple', 'family'],
    durations: ['short', 'medium', 'long'],
    trendMonths: ['June', 'July', 'August'],
    specialMoments: [{ months: ['July', 'August'], label: 'Peak wellness and jungle-retreat season' }],
    costBands: { budget: '$850-$1,200', 'mid-range': '$1,400-$2,000', luxury: '$2,900+' },
    visaLabel: 'Usually easy for many travelers',
    keywordTags: ['rice terraces', 'spa', 'cafes', 'temples', 'nature', 'romantic'],
    supportPlaces: ['Tegallalang', 'Campuhan Ridge Walk', 'Monkey Forest area', 'Ubud Market'],
    flightTimes: { asia: '4-8h', europe: '16-18h', middleEast: '9-10h', northAmerica: '20h+', other: '8-14h' },
  },
  {
    id: 'seminyak-bali',
    name: 'Seminyak',
    parentDestination: 'Bali',
    country: 'Indonesia',
    region: 'Southwest Bali',
    placeType: 'beach town',
    tagline: 'Beach clubs, shopping, polished villas, and easy restaurant-hopping.',
    image: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['May', 'June', 'July', 'August', 'September'],
    shoulderMonths: ['April', 'October'],
    avoidMonths: ['December', 'January', 'February'],
    budgetFit: ['mid-range', 'luxury'],
    interests: ['beach', 'food', 'shopping', 'nightlife', 'luxury', 'romantic'],
    travelerTypes: ['couple', 'friends'],
    durations: ['weekend', 'short', 'medium'],
    trendMonths: ['June', 'July', 'August'],
    specialMoments: [{ months: ['July', 'August'], label: 'High-energy dry-season social scene' }],
    costBands: { budget: '$1,050-$1,400', 'mid-range': '$1,600-$2,300', luxury: '$3,300+' },
    visaLabel: 'Usually easy for many travelers',
    keywordTags: ['shopping', 'beach clubs', 'restaurants', 'nightlife', 'villas'],
    supportPlaces: ['Seminyak Beach', 'Petitenget dining strip', 'beach clubs', 'designer boutiques'],
    flightTimes: { asia: '4-8h', europe: '16-18h', middleEast: '9-10h', northAmerica: '20h+', other: '8-14h' },
  },
  {
    id: 'kata-karon-phuket',
    name: 'Kata & Karon',
    parentDestination: 'Phuket',
    country: 'Thailand',
    region: 'West Phuket',
    placeType: 'coast',
    tagline: 'Swimmable beaches, easy island-day energy, and a softer Phuket base than Patong.',
    image: 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['November', 'December', 'January', 'February', 'March'],
    shoulderMonths: ['April', 'October'],
    avoidMonths: ['May', 'June', 'July', 'August', 'September'],
    budgetFit: ['budget', 'mid-range'],
    interests: ['beach', 'family', 'food', 'romantic', 'adventure'],
    travelerTypes: ['couple', 'family', 'friends'],
    durations: ['weekend', 'short', 'medium'],
    trendMonths: ['December', 'January', 'February'],
    specialMoments: [{ months: ['January', 'February'], label: 'Clear-water island-hopping season' }],
    costBands: { budget: '$700-$1,050', 'mid-range': '$1,100-$1,800', luxury: '$2,500+' },
    visaLabel: 'Easy for many markets',
    keywordTags: ['beach', 'snorkeling', 'family', 'sunset', 'seafood'],
    supportPlaces: ['Kata Beach', 'Karon Beach', 'Promthep lookout trips', 'Phi Phi boat departures'],
    flightTimes: { asia: '2-6h', europe: '13-15h', middleEast: '8-9h', northAmerica: '19h+', other: '8-14h' },
  },
  {
    id: 'patong-phuket',
    name: 'Patong',
    parentDestination: 'Phuket',
    country: 'Thailand',
    region: 'West Phuket',
    placeType: 'beach town',
    tagline: 'Easy beach access with late-night energy, shopping, and quick island tours.',
    image: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['November', 'December', 'January', 'February', 'March'],
    shoulderMonths: ['April', 'October'],
    avoidMonths: ['May', 'June', 'July', 'August', 'September'],
    budgetFit: ['budget', 'mid-range'],
    interests: ['beach', 'nightlife', 'shopping', 'food', 'adventure'],
    travelerTypes: ['friends', 'couple', 'solo'],
    durations: ['weekend', 'short'],
    trendMonths: ['December', 'January', 'February'],
    specialMoments: [{ months: ['December', 'January'], label: 'Peak social beach season' }],
    costBands: { budget: '$650-$950', 'mid-range': '$1,000-$1,600', luxury: '$2,300+' },
    visaLabel: 'Easy for many markets',
    keywordTags: ['nightlife', 'shopping', 'beach', 'party', 'seafood'],
    supportPlaces: ['Patong Beach', 'Bangla Road', 'Jungceylon area', 'nearby island tour piers'],
    flightTimes: { asia: '2-6h', europe: '13-15h', middleEast: '8-9h', northAmerica: '19h+', other: '8-14h' },
    caution: 'Best if you want energy. It can feel noisy for a quiet couple escape.',
  },
  {
    id: 'mirissa-weligama',
    name: 'Mirissa & Weligama',
    parentDestination: 'Sri Lanka South Coast',
    country: 'Sri Lanka',
    region: 'Southern Coast',
    placeType: 'coast',
    tagline: 'Surf, beach cafés, whale-season energy, and easy couple-friendly movement between bays.',
    image: 'https://images.unsplash.com/photo-1589308078055-eb4f50f4cc0b?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['December', 'January', 'February', 'March', 'April'],
    shoulderMonths: ['November', 'July', 'August'],
    avoidMonths: ['May', 'June', 'October'],
    budgetFit: ['budget', 'mid-range'],
    interests: ['beach', 'adventure', 'food', 'nature', 'romantic'],
    travelerTypes: ['couple', 'friends', 'solo'],
    durations: ['weekend', 'short', 'medium'],
    trendMonths: ['December', 'January'],
    specialMoments: [{ months: ['January', 'February'], label: 'Best south-coast surf-and-café window' }],
    costBands: { budget: '$550-$850', 'mid-range': '$900-$1,500', luxury: '$2,100+' },
    visaLabel: 'ETA-style visa is generally straightforward',
    keywordTags: ['surf', 'beach cafes', 'whale watching', 'seafood', 'couples'],
    supportPlaces: ['Coconut Tree Hill', 'Weligama surf bay', 'Mirissa beach cafés', 'Parrot Rock'],
    flightTimes: { asia: '1-6h', europe: '11-13h', middleEast: '4-5h', northAmerica: '20h+', other: '8-13h' },
  },
  {
    id: 'tangalle-sri-lanka',
    name: 'Tangalle',
    parentDestination: 'Sri Lanka South Coast',
    country: 'Sri Lanka',
    region: 'Deep South Coast',
    placeType: 'coast',
    tagline: 'Quieter beaches, boutique stays, and a more secluded romantic south-coast base.',
    image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['December', 'January', 'February', 'March', 'April'],
    shoulderMonths: ['November', 'July', 'August'],
    avoidMonths: ['May', 'June', 'October'],
    budgetFit: ['mid-range', 'luxury'],
    interests: ['beach', 'romantic', 'nature', 'luxury'],
    travelerTypes: ['couple', 'family'],
    durations: ['short', 'medium', 'long'],
    trendMonths: ['December', 'January'],
    specialMoments: [{ months: ['January', 'February'], label: 'Calmer south-coast luxury season' }],
    costBands: { budget: '$700-$950', 'mid-range': '$1,100-$1,700', luxury: '$2,500+' },
    visaLabel: 'ETA-style visa is generally straightforward',
    keywordTags: ['quiet beach', 'boutique stays', 'romantic', 'sea turtles', 'nature'],
    supportPlaces: ['Silent Beach', 'Goyambokka', 'Rekawa turtle coast', 'Tangalle lagoon'],
    flightTimes: { asia: '1-6h', europe: '11-13h', middleEast: '4-5h', northAmerica: '20h+', other: '8-13h' },
  },
  {
    id: 'arashiyama-kyoto',
    name: 'Arashiyama',
    parentDestination: 'Kyoto',
    country: 'Japan',
    region: 'Western Kyoto',
    placeType: 'district',
    tagline: 'Bamboo groves, river scenery, and a softer Kyoto rhythm with strong seasonal beauty.',
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['March', 'April', 'October', 'November'],
    shoulderMonths: ['May', 'September'],
    avoidMonths: ['June', 'July', 'August'],
    budgetFit: ['mid-range', 'luxury'],
    interests: ['nature', 'culture', 'romantic', 'food'],
    travelerTypes: ['couple', 'solo', 'family'],
    durations: ['weekend', 'short', 'medium'],
    trendMonths: ['March', 'April', 'November'],
    specialMoments: [{ months: ['November'], label: 'Autumn foliage district highlight' }],
    costBands: { budget: '$1,300-$1,800', 'mid-range': '$2,000-$2,900', luxury: '$3,600+' },
    visaLabel: 'Usually simple for short stays from many countries',
    keywordTags: ['bamboo', 'scenic', 'temples', 'romantic', 'nature'],
    supportPlaces: ['Bamboo Grove', 'Togetsukyo Bridge', 'river walks', 'Tenryu-ji'],
    flightTimes: { asia: '2-7h', europe: '14-16h', middleEast: '10-11h', northAmerica: '11-14h', other: '8-15h' },
    caution: 'Can feel expensive during peak foliage weeks.',
  },
  {
    id: 'higashiyama-kyoto',
    name: 'Higashiyama',
    parentDestination: 'Kyoto',
    country: 'Japan',
    region: 'Eastern Kyoto',
    placeType: 'district',
    tagline: 'Iconic temple lanes, tea-house atmosphere, and classic Kyoto evenings.',
    image: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['March', 'April', 'October', 'November'],
    shoulderMonths: ['May', 'September'],
    avoidMonths: ['June', 'July', 'August'],
    budgetFit: ['mid-range', 'luxury'],
    interests: ['culture', 'food', 'romantic', 'shopping'],
    travelerTypes: ['couple', 'solo', 'family'],
    durations: ['weekend', 'short', 'medium'],
    trendMonths: ['March', 'April', 'November'],
    specialMoments: [{ months: ['March', 'April'], label: 'Cherry-blossom old-street season' }],
    costBands: { budget: '$1,300-$1,800', 'mid-range': '$2,000-$3,000', luxury: '$3,800+' },
    visaLabel: 'Usually simple for short stays from many countries',
    keywordTags: ['temples', 'old streets', 'tea houses', 'romantic', 'shopping'],
    supportPlaces: ['Kiyomizu-dera area', 'Ninenzaka', 'Gion edge', 'tea-house streets'],
    flightTimes: { asia: '2-7h', europe: '14-16h', middleEast: '10-11h', northAmerica: '11-14h', other: '8-15h' },
    caution: 'Very popular at midday. Best early or late.',
  },
  {
    id: 'galata-istanbul',
    name: 'Galata & Karakoy',
    parentDestination: 'Istanbul',
    country: 'Turkey',
    region: 'European Side',
    placeType: 'city quarter',
    tagline: 'Cafés, design shops, rooftops, and ferry-connected city energy with a younger feel.',
    image: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['April', 'May', 'September', 'October'],
    shoulderMonths: ['March', 'June', 'November'],
    avoidMonths: ['July', 'August'],
    budgetFit: ['budget', 'mid-range'],
    interests: ['food', 'shopping', 'nightlife', 'culture', 'romantic'],
    travelerTypes: ['couple', 'friends', 'solo'],
    durations: ['weekend', 'short', 'medium'],
    trendMonths: ['April', 'May', 'September'],
    specialMoments: [{ months: ['September', 'October'], label: 'Best weather for ferry-and-rooftop days' }],
    costBands: { budget: '$800-$1,150', 'mid-range': '$1,250-$1,900', luxury: '$2,800+' },
    visaLabel: 'Varies by passport but often manageable online',
    keywordTags: ['cafes', 'shopping', 'rooftops', 'nightlife', 'culture'],
    supportPlaces: ['Galata Tower area', 'Karakoy cafés', 'ferry piers', 'Istiklal side streets'],
    flightTimes: { asia: '7-10h', europe: '3-4h', middleEast: '4-5h', northAmerica: '10-12h', other: '7-12h' },
  },
  {
    id: 'sultanahmet-istanbul',
    name: 'Sultanahmet',
    parentDestination: 'Istanbul',
    country: 'Turkey',
    region: 'Historic Peninsula',
    placeType: 'district',
    tagline: 'Historic mosques, hammam culture, and a classic old-city stay for first-time visitors.',
    image: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['April', 'May', 'September', 'October'],
    shoulderMonths: ['March', 'June', 'November'],
    avoidMonths: ['July', 'August'],
    budgetFit: ['budget', 'mid-range'],
    interests: ['culture', 'food', 'romantic'],
    travelerTypes: ['couple', 'family', 'solo'],
    durations: ['weekend', 'short', 'medium'],
    trendMonths: ['April', 'May'],
    specialMoments: [{ months: ['April', 'May'], label: 'Classic spring heritage season' }],
    costBands: { budget: '$780-$1,100', 'mid-range': '$1,200-$1,850', luxury: '$2,700+' },
    visaLabel: 'Varies by passport but often manageable online',
    keywordTags: ['history', 'mosques', 'heritage', 'hammam', 'culture'],
    supportPlaces: ['Blue Mosque area', 'Hagia Sophia', 'Basilica Cistern', 'old tram corridor'],
    flightTimes: { asia: '7-10h', europe: '3-4h', middleEast: '4-5h', northAmerica: '10-12h', other: '7-12h' },
  },
  {
    id: 'lisbon-old-town',
    name: 'Lisbon Old Town & Cais do Sodre',
    parentDestination: 'Lisbon',
    country: 'Portugal',
    region: 'Central Lisbon',
    placeType: 'city quarter',
    tagline: 'Hillside viewpoints, seafood dinners, tram charm, and easy nightlife if you want it.',
    image: 'https://images.unsplash.com/photo-1513735492246-483525079686?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['April', 'May', 'June', 'September', 'October'],
    shoulderMonths: ['March', 'July', 'August'],
    avoidMonths: ['December', 'January'],
    budgetFit: ['mid-range'],
    interests: ['food', 'culture', 'nightlife', 'romantic', 'shopping'],
    travelerTypes: ['couple', 'friends', 'solo'],
    durations: ['weekend', 'short', 'medium'],
    trendMonths: ['May', 'June', 'September'],
    specialMoments: [{ months: ['June'], label: 'Festival energy and long-light evenings' }],
    costBands: { budget: '$1,000-$1,450', 'mid-range': '$1,550-$2,300', luxury: '$3,200+' },
    visaLabel: 'Schengen rules apply',
    keywordTags: ['seafood', 'nightlife', 'culture', 'viewpoints', 'shopping'],
    supportPlaces: ['Alfama walks', 'Time Out Market area', 'Bairro Alto edge', 'Miradouros'],
    flightTimes: { asia: '14-17h', europe: '2-4h', middleEast: '7-8h', northAmerica: '7-9h', other: '8-15h' },
  },
  {
    id: 'cascais-lisbon',
    name: 'Cascais & Guincho',
    parentDestination: 'Lisbon',
    country: 'Portugal',
    region: 'Lisbon Coast',
    placeType: 'coast',
    tagline: 'Atlantic beach air, seafood lunches, and an easier coastal short break than city-center Lisbon.',
    image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['May', 'June', 'July', 'August', 'September'],
    shoulderMonths: ['April', 'October'],
    avoidMonths: ['December', 'January'],
    budgetFit: ['mid-range', 'luxury'],
    interests: ['beach', 'food', 'romantic', 'nature'],
    travelerTypes: ['couple', 'family', 'solo'],
    durations: ['weekend', 'short'],
    trendMonths: ['June', 'July', 'August'],
    specialMoments: [{ months: ['July', 'August'], label: 'Best Atlantic coast escape window' }],
    costBands: { budget: '$1,100-$1,500', 'mid-range': '$1,650-$2,400', luxury: '$3,500+' },
    visaLabel: 'Schengen rules apply',
    keywordTags: ['beach', 'seafood', 'coast', 'romantic', 'surf'],
    supportPlaces: ['Cascais old town', 'Guincho Beach', 'Boca do Inferno', 'coastal seafood spots'],
    flightTimes: { asia: '14-17h', europe: '2-4h', middleEast: '7-8h', northAmerica: '7-9h', other: '8-15h' },
  },
  {
    id: 'camps-bay-cape-town',
    name: 'Camps Bay & Atlantic Seaboard',
    parentDestination: 'Cape Town',
    country: 'South Africa',
    region: 'Atlantic Coast',
    placeType: 'coast',
    tagline: 'Dramatic coast, sunset dining, and fast access to iconic hikes and viewpoints.',
    image: 'https://images.unsplash.com/photo-1576485290814-1c72aa4bbb8e?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['November', 'December', 'January', 'February', 'March'],
    shoulderMonths: ['October', 'April'],
    avoidMonths: ['June', 'July', 'August'],
    budgetFit: ['mid-range', 'luxury'],
    interests: ['nature', 'food', 'romantic', 'luxury', 'beach'],
    travelerTypes: ['couple', 'friends', 'solo'],
    durations: ['short', 'medium', 'long'],
    trendMonths: ['December', 'January', 'February'],
    specialMoments: [{ months: ['January', 'February'], label: 'Peak Cape coast and sunset season' }],
    costBands: { budget: '$1,250-$1,700', 'mid-range': '$1,850-$2,700', luxury: '$3,800+' },
    visaLabel: 'Depends on origin; planning ahead helps',
    keywordTags: ['coast', 'sunset', 'hiking', 'nature', 'seafood', 'luxury'],
    supportPlaces: ['Camps Bay promenade', 'Lion’s Head access', 'Clifton beaches', 'Table Mountain edge'],
    flightTimes: { asia: '12-15h', europe: '11-12h', middleEast: '9-10h', northAmerica: '20h+', other: '9-16h' },
  },
  {
    id: 'franschhoek-cape-town',
    name: 'Franschhoek & Winelands',
    parentDestination: 'Cape Town',
    country: 'South Africa',
    region: 'Cape Winelands',
    placeType: 'town',
    tagline: 'Wine tram days, mountain scenery, and a polished food-and-romance escape.',
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['November', 'December', 'January', 'February', 'March'],
    shoulderMonths: ['October', 'April'],
    avoidMonths: ['June', 'July', 'August'],
    budgetFit: ['mid-range', 'luxury'],
    interests: ['food', 'romantic', 'luxury', 'nature'],
    travelerTypes: ['couple', 'friends'],
    durations: ['weekend', 'short', 'medium'],
    trendMonths: ['December', 'January', 'February'],
    specialMoments: [{ months: ['January', 'February'], label: 'Peak summer wine-country season' }],
    costBands: { budget: '$1,200-$1,650', 'mid-range': '$1,800-$2,500', luxury: '$3,700+' },
    visaLabel: 'Depends on origin; planning ahead helps',
    keywordTags: ['wine', 'food', 'romantic', 'mountains', 'luxury'],
    supportPlaces: ['wine tram routes', 'estate lunches', 'mountain lookouts', 'boutique stays'],
    flightTimes: { asia: '12-15h', europe: '11-12h', middleEast: '9-10h', northAmerica: '20h+', other: '9-16h' },
  },
  {
    id: 'queenstown-lakeside',
    name: 'Queenstown Lakeside',
    parentDestination: 'Queenstown',
    country: 'New Zealand',
    region: 'Otago',
    placeType: 'mountain base',
    tagline: 'Lake views, easy adrenaline access, and a premium base for short outdoor-heavy escapes.',
    image: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['December', 'January', 'February', 'March'],
    shoulderMonths: ['April', 'November'],
    avoidMonths: ['June', 'July'],
    budgetFit: ['mid-range', 'luxury'],
    interests: ['nature', 'adventure', 'romantic', 'luxury'],
    travelerTypes: ['couple', 'friends', 'solo'],
    durations: ['short', 'medium', 'long'],
    trendMonths: ['December', 'January'],
    specialMoments: [{ months: ['January', 'February'], label: 'Peak summer lake-and-adventure season' }],
    costBands: { budget: '$1,900-$2,400', 'mid-range': '$2,500-$3,700', luxury: '$5,000+' },
    visaLabel: 'Usually digital and straightforward for many origins',
    keywordTags: ['adventure', 'lake', 'mountains', 'scenery', 'luxury'],
    supportPlaces: ['lakefront', 'Skyline access', 'shotover adventure hubs', 'nearby winery trips'],
    flightTimes: { asia: '10-12h', europe: '23h+', middleEast: '18-20h', northAmerica: '15-18h', other: '12-18h' },
  },
  {
    id: 'arrowtown-queenstown',
    name: 'Arrowtown & Queenstown Trails',
    parentDestination: 'Queenstown',
    country: 'New Zealand',
    region: 'Otago',
    placeType: 'town',
    tagline: 'Gold-rush charm, cycle trails, and a calmer outdoor base than central Queenstown.',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['December', 'January', 'February', 'March'],
    shoulderMonths: ['April', 'November'],
    avoidMonths: ['June', 'July'],
    budgetFit: ['mid-range', 'luxury'],
    interests: ['nature', 'adventure', 'romantic'],
    travelerTypes: ['couple', 'solo', 'friends'],
    durations: ['short', 'medium', 'long'],
    trendMonths: ['March', 'April'],
    specialMoments: [{ months: ['April'], label: 'Autumn-color trail season' }],
    costBands: { budget: '$1,800-$2,300', 'mid-range': '$2,400-$3,400', luxury: '$4,500+' },
    visaLabel: 'Usually digital and straightforward for many origins',
    keywordTags: ['cycling', 'nature', 'trails', 'romantic', 'scenic'],
    supportPlaces: ['Arrowtown lanes', 'Queenstown Trail sections', 'Gibbston rides', 'Autumn-color walks'],
    flightTimes: { asia: '10-12h', europe: '23h+', middleEast: '18-20h', northAmerica: '15-18h', other: '12-18h' },
  },
  {
    id: 'hoi-an-ancient-town',
    name: 'Hoi An Ancient Town',
    parentDestination: 'Da Nang & Hoi An',
    country: 'Vietnam',
    region: 'Central Vietnam',
    placeType: 'town',
    tagline: 'Lantern-lit evenings, heritage walks, beach access, and one of the region’s easiest food bases.',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['February', 'March', 'April', 'May', 'June'],
    shoulderMonths: ['January', 'July'],
    avoidMonths: ['October', 'November'],
    budgetFit: ['budget', 'mid-range'],
    interests: ['food', 'culture', 'romantic', 'beach'],
    travelerTypes: ['couple', 'family', 'solo', 'friends'],
    durations: ['weekend', 'short', 'medium'],
    trendMonths: ['March', 'April', 'June'],
    specialMoments: [{ months: ['March', 'April'], label: 'Strong weather-value window for heritage and food' }],
    costBands: { budget: '$650-$950', 'mid-range': '$1,050-$1,650', luxury: '$2,200+' },
    visaLabel: 'Often simple online, but passport rules vary',
    keywordTags: ['food', 'heritage', 'lanterns', 'romantic', 'beach nearby'],
    supportPlaces: ['Ancient Town lanes', 'An Bang Beach trips', 'night market', 'local cooking stops'],
    flightTimes: { asia: '2-6h', europe: '14-16h', middleEast: '8-10h', northAmerica: '18h+', other: '8-14h' },
  },
  {
    id: 'son-tra-da-nang',
    name: 'My Khe & Son Tra',
    parentDestination: 'Da Nang',
    country: 'Vietnam',
    region: 'Central Vietnam',
    placeType: 'coast',
    tagline: 'Beach mornings, seafood, and quick access to mountain roads and easy city comfort.',
    image: 'https://images.unsplash.com/photo-1520454974749-611b7248ffdb?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['February', 'March', 'April', 'May', 'June'],
    shoulderMonths: ['January', 'July'],
    avoidMonths: ['October', 'November'],
    budgetFit: ['budget', 'mid-range'],
    interests: ['beach', 'food', 'nature', 'adventure', 'family'],
    travelerTypes: ['couple', 'friends', 'family'],
    durations: ['weekend', 'short', 'medium'],
    trendMonths: ['March', 'April', 'June'],
    specialMoments: [{ months: ['June'], label: 'Best beach-city balance before wet months' }],
    costBands: { budget: '$620-$900', 'mid-range': '$1,000-$1,550', luxury: '$2,100+' },
    visaLabel: 'Often simple online, but passport rules vary',
    keywordTags: ['beach', 'seafood', 'scenic drives', 'nature', 'family'],
    supportPlaces: ['My Khe Beach', 'Son Tra roads', 'seafood streets', 'Marble Mountains access'],
    flightTimes: { asia: '2-6h', europe: '14-16h', middleEast: '8-10h', northAmerica: '18h+', other: '8-14h' },
  },
  {
    id: 'dubai-marina-jbr',
    name: 'Dubai Marina & JBR',
    parentDestination: 'Dubai',
    country: 'United Arab Emirates',
    region: 'Coastal Dubai',
    placeType: 'city quarter',
    tagline: 'Beach access, polished towers, nightlife, and easy convenience for a short premium break.',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['November', 'December', 'January', 'February', 'March'],
    shoulderMonths: ['April', 'October'],
    avoidMonths: ['June', 'July', 'August'],
    budgetFit: ['mid-range', 'luxury'],
    interests: ['luxury', 'shopping', 'nightlife', 'beach', 'food'],
    travelerTypes: ['couple', 'friends', 'family'],
    durations: ['weekend', 'short'],
    trendMonths: ['December', 'January', 'February'],
    specialMoments: [{ months: ['January', 'February'], label: 'Peak winter escape with beach weather' }],
    costBands: { budget: '$1,200-$1,700', 'mid-range': '$1,800-$2,800', luxury: '$4,200+' },
    visaLabel: 'Often easy, but passport-specific',
    keywordTags: ['shopping', 'beach', 'luxury', 'nightlife', 'food'],
    supportPlaces: ['JBR Walk', 'Marina promenade', 'Bluewaters', 'beach clubs'],
    flightTimes: { asia: '4-8h', europe: '6-7h', middleEast: '1-3h', northAmerica: '13-15h', other: '6-14h' },
  },
  {
    id: 'downtown-dubai',
    name: 'Downtown Dubai',
    parentDestination: 'Dubai',
    country: 'United Arab Emirates',
    region: 'Central Dubai',
    placeType: 'city quarter',
    tagline: 'Flagship shopping, polished hotels, and the easiest luxury-first short-break base.',
    image: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1200&auto=format&fit=crop&q=80',
    bestMonths: ['November', 'December', 'January', 'February', 'March'],
    shoulderMonths: ['April', 'October'],
    avoidMonths: ['June', 'July', 'August'],
    budgetFit: ['mid-range', 'luxury'],
    interests: ['luxury', 'shopping', 'food', 'family'],
    travelerTypes: ['family', 'couple', 'friends'],
    durations: ['weekend', 'short'],
    trendMonths: ['December', 'January', 'February'],
    specialMoments: [{ months: ['December'], label: 'Peak festive shopping and show season' }],
    costBands: { budget: '$1,150-$1,650', 'mid-range': '$1,750-$2,700', luxury: '$4,000+' },
    visaLabel: 'Often easy, but passport-specific',
    keywordTags: ['shopping', 'luxury', 'family', 'food', 'short break'],
    supportPlaces: ['Dubai Mall', 'Burj Khalifa district', 'fountain promenade', 'luxury dining'],
    flightTimes: { asia: '4-8h', europe: '6-7h', middleEast: '1-3h', northAmerica: '13-15h', other: '6-14h' },
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

const getWeatherLabel = (area: AreaProfile, month: string) => {
  if (area.bestMonths.includes(month)) return 'Excellent season'
  if (area.shoulderMonths.includes(month)) return 'Good shoulder season'
  if (area.avoidMonths.includes(month)) return 'Less ideal weather'
  return 'Mixed seasonal fit'
}

const getTrendLabel = (area: AreaProfile, month: string) => {
  const moment = area.specialMoments.find((entry) => entry.months.includes(month))
  if (moment) return moment.label
  if (area.trendMonths.includes(month)) return 'Trending strongly this month'
  return 'Solid year-round interest'
}

const parseTripIntent = (notes: string): ParsedTripIntent => {
  const value = notes.toLowerCase()
  const inferredInterests = new Set<DiscoveryInterest>()
  const matchedKeywords = new Set<string>()

  keywordInterestMap.forEach((entry) => {
    if (entry.pattern.test(value)) {
      entry.interests.forEach((interest) => inferredInterests.add(interest))
      entry.keywords.forEach((keyword) => matchedKeywords.add(keyword))
    }
  })

  return {
    inferredInterests: Array.from(inferredInterests),
    matchedKeywords: Array.from(matchedKeywords),
  }
}

const parseFlightEffort = (flightLabel: string) => {
  const numbers = Array.from(flightLabel.matchAll(/(\d+)/g)).map((match) => Number(match[1]))
  if (numbers.length === 0) return 10
  if (numbers.length === 1) return numbers[0]
  return (numbers[0] + numbers[numbers.length - 1]) / 2
}

const getRepresentativeDurationDays = (duration: DiscoveryDuration | '') => {
  if (duration === 'weekend') return 3
  if (duration === 'short') return 7
  if (duration === 'medium') return 10
  if (duration === 'long') return 16
  return 7
}

const parseAvoidPreferences = (avoid: string[]) => {
  const combined = avoid.map((item) => item.toLowerCase()).join(' | ')

  return {
    avoidLongFlights: /(long flight|long flights|too far|far away|flight time|layover|layovers)/.test(combined),
    avoidCrowds: /(crowd|crowded|busy|touristy|tourist heavy|queues|overrun)/.test(combined),
    avoidBadWeather: /(bad weather|rain|rainy|storm|stormy|humid|heat|too hot|monsoon)/.test(combined),
    avoidParty: /(party|nightlife|clubs|late night|drunk)/.test(combined),
  }
}

const getBudgetScore = (area: AreaProfile, budget: DiscoveryBudget) => {
  if (area.budgetFit.includes(budget)) return 24
  if (budget === 'luxury' && area.budgetFit.includes('mid-range')) return 14
  if (budget === 'mid-range' && area.budgetFit.includes('budget')) return 12
  return 4
}

const getMonthScore = (area: AreaProfile, month: string) => {
  if (area.bestMonths.includes(month)) return 28
  if (area.shoulderMonths.includes(month)) return 16
  if (area.avoidMonths.includes(month)) return -8
  return 8
}

const getInterestScore = (area: AreaProfile, interests: DiscoveryInterest[]) => {
  const expandedInterests = interests.flatMap((interest) => {
    if (interest === 'wellness') return ['nature', 'luxury'] as DiscoveryInterest[]
    if (interest === 'photography') return ['nature', 'culture'] as DiscoveryInterest[]
    if (interest === 'budget-friendly') return ['food', 'culture'] as DiscoveryInterest[]
    return [interest]
  })
  const matches = Array.from(new Set(expandedInterests)).filter((interest) => area.interests.includes(interest))
  if (interests.length === 0) return 0
  if (matches.length === 0) return -24
  if (matches.length === 1) return 10
  return matches.length * 14 + 6
}

const getDurationScore = (area: AreaProfile, duration: DiscoveryDuration) =>
  area.durations.includes(duration) ? 12 : 5

const getTravelerScore = (area: AreaProfile, travelerType: DiscoveryTravelerType) => {
  if (travelerType === 'business-leisure') {
    return area.interests.some((interest) => ['food', 'culture', 'shopping', 'luxury'].includes(interest)) ? 10 : 3
  }
  return area.travelerTypes.includes(travelerType) ? 10 : 3
}

const getTrendScore = (area: AreaProfile, month: string) => (area.trendMonths.includes(month) ? 8 : 3)

const getKeywordScore = (area: AreaProfile, matchedKeywords: string[]) => {
  const normalizedTags = area.keywordTags.map((tag) => tag.toLowerCase())
  const matches = matchedKeywords.filter((keyword) =>
    normalizedTags.some((tag) => tag.includes(keyword) || keyword.includes(tag))
  )
  return {
    score: matches.length * 8,
    matches,
  }
}

const getOriginEffortScore = (area: AreaProfile, originRegion: string, duration: DiscoveryDuration) => {
  const flightLabel = area.flightTimes[originRegion as keyof AreaProfile['flightTimes']] || area.flightTimes.other
  const effort = parseFlightEffort(flightLabel)

  if (duration === 'weekend') {
    if (effort <= 4) return 14
    if (effort <= 7) return 8
    if (effort <= 10) return 1
    return -8
  }

  if (duration === 'short') {
    if (effort <= 5) return 12
    if (effort <= 8) return 8
    if (effort <= 12) return 3
    return -4
  }

  if (duration === 'medium') {
    if (effort <= 8) return 9
    if (effort <= 12) return 6
    return 3
  }

  return 6
}

const getBudgetFit = (area: AreaProfile, budget: DiscoveryBudget) => {
  if (area.budgetFit.includes(budget)) return 'Strong'
  if ((budget === 'luxury' && area.budgetFit.includes('mid-range')) || (budget === 'mid-range' && area.budgetFit.includes('budget'))) {
    return 'Moderate'
  }
  return 'Stretch'
}

const getWeatherFit = (area: AreaProfile, month: string) => {
  if (area.bestMonths.includes(month)) return 'Strong'
  if (area.shoulderMonths.includes(month)) return 'Moderate'
  if (area.avoidMonths.includes(month)) return 'Weak'
  return 'Moderate'
}

const getFlightFit = (area: AreaProfile, originRegion: string, durationDays: number) => {
  const flightLabel = area.flightTimes[originRegion as keyof AreaProfile['flightTimes']] || area.flightTimes.other
  const effort = parseFlightEffort(flightLabel)

  if (durationDays <= 4) {
    if (effort <= 5) return 'Strong'
    if (effort <= 8) return 'Moderate'
    return 'Weak'
  }

  if (durationDays <= 8) {
    if (effort <= 6) return 'Strong'
    if (effort <= 10) return 'Moderate'
    return 'Weak'
  }

  if (effort <= 10) return 'Strong'
  if (effort <= 14) return 'Moderate'
  return 'Weak'
}

const getCrowdRisk = (area: AreaProfile, month: string) => {
  if (area.trendMonths.includes(month) && area.bestMonths.includes(month)) return 'High'
  if (area.trendMonths.includes(month) || area.bestMonths.includes(month)) return 'Medium'
  return 'Low'
}

const getAvoidancePenalty = (area: AreaProfile, form: DiscoveryFormState, originRegion: string) => {
  const preferences = parseAvoidPreferences(form.avoid)
  const flightLabel = area.flightTimes[originRegion as keyof AreaProfile['flightTimes']] || area.flightTimes.other
  const flightEffort = parseFlightEffort(flightLabel)
  const crowdRisk = getCrowdRisk(area, form.month)
  let penalty = 0

  if (preferences.avoidLongFlights) {
    if (flightEffort > 12) penalty -= 22
    else if (flightEffort > 8) penalty -= 12
    else if (flightEffort > 5) penalty -= 4
  }

  if (preferences.avoidCrowds) {
    if (crowdRisk === 'High') penalty -= 16
    else if (crowdRisk === 'Medium') penalty -= 8
  }

  if (preferences.avoidBadWeather) {
    if (area.avoidMonths.includes(form.month)) penalty -= 20
    else if (area.shoulderMonths.includes(form.month)) penalty -= 6
  }

  if (preferences.avoidParty && area.interests.includes('nightlife')) {
    penalty -= 12
  }

  const avoidText = form.avoid.join(' ').toLowerCase()
  if (/(expensive|high cost|pricey)/.test(avoidText) && !area.budgetFit.includes('budget')) {
    penalty -= 14
  }
  if (/(tourist trap|tight schedule|too much walking)/.test(avoidText)) {
    if (crowdRisk === 'High') penalty -= 8
    if (area.placeType === 'district' || area.placeType === 'city quarter') penalty -= 4
  }

  return penalty
}

const buildTripFeeling = (area: AreaProfile, matchingInterests: DiscoveryInterest[]) => {
  const feelings = new Set<string>()

  if (matchingInterests.includes('romantic')) feelings.add('romantic')
  if (matchingInterests.includes('beach')) feelings.add('relaxing')
  if (matchingInterests.includes('nature')) feelings.add('scenic')
  if (matchingInterests.includes('food')) feelings.add('flavorful')
  if (matchingInterests.includes('culture')) feelings.add('immersive')
  if (matchingInterests.includes('adventure')) feelings.add('active')
  if (matchingInterests.includes('wellness')) feelings.add('restorative')
  if (matchingInterests.includes('photography')) feelings.add('photogenic')
  if (matchingInterests.includes('budget-friendly')) feelings.add('good value')
  if (area.placeType === 'coast' || area.placeType === 'beach town') feelings.add('sunny')
  if (area.placeType === 'town') feelings.add('balanced')

  if (feelings.size < 3) {
    ;['scenic', 'balanced', 'easygoing'].forEach((value) => feelings.add(value))
  }

  return Array.from(feelings).slice(0, 3)
}

const buildRisks = (area: AreaProfile, form: DiscoveryFormState, originRegion: string, durationDays: number) => {
  const risks: string[] = []
  const flightFit = getFlightFit(area, originRegion, durationDays)
  const weatherFit = getWeatherFit(area, form.month)
  const crowdRisk = getCrowdRisk(area, form.month)
  const budgetFit = getBudgetFit(area, form.budget as DiscoveryBudget)

  if (flightFit === 'Weak') {
    risks.push(`Flight time from ${form.departure} may feel long for a ${durationDays}-day trip.`)
  }

  if (weatherFit === 'Weak') {
    risks.push(`${form.month} is a weaker weather fit here, so conditions may be less reliable.`)
  }

  if (crowdRisk === 'High') {
    risks.push('Popular areas are likely to feel crowded in your travel month.')
  } else if (crowdRisk === 'Medium') {
    risks.push('You may need to book key stays or meals earlier than usual.')
  }

  if (budgetFit === 'Stretch') {
    risks.push('Your budget could feel tight unless you stay selective on stays and activities.')
  }

  if (area.caution) {
    risks.push(area.caution)
  }

  return risks.slice(0, 3)
}

const buildBestVersion = (area: AreaProfile, form: DiscoveryFormState, durationDays: number) => {
  const anchors = area.supportPlaces.slice(0, 2)
  const intro = anchors.length > 0 ? `Base yourself around ${anchors.join(' and ')}.` : `Stay in ${area.name}.`

  if (form.travelerType === 'couple') {
    return `${intro} Plan a slower ${durationDays}-day couple trip with one standout meal and one scenic late-afternoon experience.`
  }

  if (form.travelerType === 'family') {
    return `${intro} Keep the itinerary light, choose one anchor activity per day, and stay close to the easiest main area.`
  }

  if (form.travelerType === 'friends') {
    return `${intro} Mix one active day with flexible evenings so the trip feels social without becoming rushed.`
  }

  if (form.travelerType === 'business-leisure') {
    return `${intro} Keep workday logistics simple, then use one focused leisure block for food, culture, or an easy scenic experience.`
  }

  return `${intro} Use it as a balanced base and keep the schedule light enough to enjoy the place, not just tick it off.`
}

const normalizeMatchScore = (score: number, topScore: number) => {
  if (!Number.isFinite(score) || !Number.isFinite(topScore) || topScore <= 0) return 50
  return Math.max(35, Math.min(97, Math.round(55 + (score / topScore) * 40)))
}

const formatInterestSummary = (area: AreaProfile, combinedInterests: DiscoveryInterest[], keywordMatches: string[]) => {
  if (keywordMatches.length > 0) {
    return `It strongly matches your focus on ${keywordMatches.slice(0, 3).join(', ')}.`
  }

  const matches = combinedInterests.filter((interest) => area.interests.includes(interest))
  if (matches.length > 0) {
    return `It matches your interests in ${matches.slice(0, 3).join(', ')}.`
  }

  return `It still gives you a balanced base inside ${area.parentDestination}.`
}

export const buildDiscoveryRecommendations = (form: DiscoveryFormState): DestinationRecommendation[] => {
  const originRegion = classifyOriginRegion(form.departure)
  const parsedIntent = parseTripIntent(form.tripNotes || '')
  const combinedInterests = Array.from(new Set([...form.interests, ...parsedIntent.inferredInterests]))
  const durationDays = getRepresentativeDurationDays(form.duration)

  const ranked = areaProfiles
    .map((area) => {
      const keywordMatch = getKeywordScore(area, parsedIntent.matchedKeywords)
      const flightEffortScore = getOriginEffortScore(area, originRegion, form.duration as DiscoveryDuration)
      const score =
        getMonthScore(area, form.month) +
        getBudgetScore(area, form.budget as DiscoveryBudget) +
        getInterestScore(area, combinedInterests) +
        getDurationScore(area, form.duration as DiscoveryDuration) +
        getTravelerScore(area, form.travelerType as DiscoveryTravelerType) +
        getTrendScore(area, form.month) +
        keywordMatch.score +
        flightEffortScore +
        getAvoidancePenalty(area, form, originRegion)

      const matchingInterests = combinedInterests.filter((interest) => area.interests.includes(interest))
      const whyItFits = [
        `${form.month} gives ${area.name} a ${getWeatherLabel(area, form.month).toLowerCase()}.`,
        `${area.name} fits your ${form.budget} budget range for ${area.parentDestination}.`,
        formatInterestSummary(area, combinedInterests, keywordMatch.matches),
        `${area.name} works well for a ${form.duration} ${form.travelerType} trip with ${area.placeType} energy.`,
      ]

      if ((form.duration as DiscoveryDuration) === 'weekend') {
        const flightLabel =
          area.flightTimes[originRegion as keyof AreaProfile['flightTimes']] || area.flightTimes.other
        if (flightEffortScore >= 8) {
          whyItFits.push(`${flightLabel} flights keep this more realistic for a quick trip.`)
        } else if (flightEffortScore < 0) {
          whyItFits.push(`Flight time may feel long for a quick break unless you already travel nearby.`)
        }
      }

      if (area.trendMonths.includes(form.month)) {
        whyItFits.push(`${area.name} is especially popular in ${form.month} right now.`)
      }

      const rankedBestFor = [
        ...matchingInterests,
        ...area.interests.filter((interest) => !matchingInterests.includes(interest)),
      ]

      return {
        id: area.id,
        destination: `${area.name}, ${area.parentDestination}`,
        name: area.name,
        parentDestination: area.parentDestination,
        country: area.country,
        region: area.region,
        placeType: area.placeType,
        image: area.image,
        tagline: area.tagline,
        matchScore: 0,
        score,
        estimatedTripCost: area.costBands[form.budget as DiscoveryBudget],
        weatherLabel: getWeatherLabel(area, form.month),
        flightLabel:
          area.flightTimes[originRegion as keyof AreaProfile['flightTimes']] || area.flightTimes.other,
        visaLabel: area.visaLabel,
        trendLabel: getTrendLabel(area, form.month),
        budgetFit: getBudgetFit(area, form.budget as DiscoveryBudget),
        weatherFit: getWeatherFit(area, form.month),
        flightFit: getFlightFit(area, originRegion, durationDays),
        crowdRisk: getCrowdRisk(area, form.month),
        bestFor: rankedBestFor.slice(0, 4),
        supportPlaces: area.supportPlaces.slice(0, 4),
        whyFits: whyItFits,
        whyItFits,
        tripFeeling: buildTripFeeling(area, matchingInterests),
        risks: buildRisks(area, form, originRegion, durationDays),
        bestVersion: buildBestVersion(area, form, durationDays),
        caution: area.avoidMonths.includes(form.month)
          ? area.caution || 'This month is less ideal there, so weather or pricing may work against you.'
          : area.caution,
        planningPrompt: `${area.name}, ${area.parentDestination}, ${area.country} for a ${form.duration} ${form.travelerType} trip focused on ${combinedInterests.join(', ') || 'balanced travel'}${form.tripNotes ? `. Notes: ${form.tripNotes}` : ''}`,
      }
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 10)

  const topScore = ranked[0]?.score || 100

  return ranked.map((item) => ({
    ...item,
    matchScore: normalizeMatchScore(item.score, topScore),
  }))
}
