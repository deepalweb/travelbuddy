import express from 'express';
import fetch from 'node-fetch';
import { resolveFreePlaceImage } from '../services/freePlaceImageService.js';

const router = express.Router();

// Azure OpenAI Configuration
const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY;
const AZURE_OPENAI_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const AZURE_API_VERSION = '2024-02-01';

const discoveryDestinations = [
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
    costBands: { budget: '$1,100-$1,500', 'mid-range': '$1,700-$2,500', luxury: '$3,200+' },
    visaLabel: 'Usually easy for many travelers',
    flightTimes: { asia: '4-8h', europe: '16-18h', middleEast: '9-10h', northAmerica: '20h+', other: '8-14h' },
    keywordTags: ['beach', 'surf', 'cliffs', 'sunset', 'villas', 'romantic'],
    supportPlaces: ['Padang Padang Beach', 'Uluwatu Temple cliffs', 'Bingin Beach', 'Single Fin sunset area'],
    specialMoments: [{ months: ['July', 'August'], label: 'Dry-season surf and sunset sweet spot' }],
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
    costBands: { budget: '$950-$1,300', 'mid-range': '$1,500-$2,200', luxury: '$3,000+' },
    visaLabel: 'Usually easy for many travelers',
    flightTimes: { asia: '4-8h', europe: '16-18h', middleEast: '9-10h', northAmerica: '20h+', other: '8-14h' },
    keywordTags: ['seafood', 'beach dinners', 'sunset', 'resorts', 'couples'],
    supportPlaces: ['Jimbaran Beach', 'seafood dinner strip', 'AYANA sunset bars', 'Kedonganan fish market'],
    specialMoments: [{ months: ['June', 'July'], label: 'Prime beach-dinner season' }],
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
    costBands: { budget: '$850-$1,200', 'mid-range': '$1,400-$2,000', luxury: '$2,900+' },
    visaLabel: 'Usually easy for many travelers',
    flightTimes: { asia: '4-8h', europe: '16-18h', middleEast: '9-10h', northAmerica: '20h+', other: '8-14h' },
    keywordTags: ['rice terraces', 'spa', 'cafes', 'temples', 'nature', 'romantic'],
    supportPlaces: ['Tegallalang', 'Campuhan Ridge Walk', 'Monkey Forest area', 'Ubud Market'],
    specialMoments: [{ months: ['July', 'August'], label: 'Peak wellness and jungle-retreat season' }],
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
    costBands: { budget: '$700-$1,050', 'mid-range': '$1,100-$1,800', luxury: '$2,500+' },
    visaLabel: 'Easy for many markets',
    flightTimes: { asia: '2-6h', europe: '13-15h', middleEast: '8-9h', northAmerica: '19h+', other: '8-14h' },
    keywordTags: ['beach', 'snorkeling', 'family', 'sunset', 'seafood'],
    supportPlaces: ['Kata Beach', 'Karon Beach', 'Promthep lookout trips', 'Phi Phi boat departures'],
    specialMoments: [{ months: ['January', 'February'], label: 'Clear-water island-hopping season' }],
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
    costBands: { budget: '$650-$950', 'mid-range': '$1,000-$1,600', luxury: '$2,300+' },
    visaLabel: 'Easy for many markets',
    flightTimes: { asia: '2-6h', europe: '13-15h', middleEast: '8-9h', northAmerica: '19h+', other: '8-14h' },
    keywordTags: ['nightlife', 'shopping', 'beach', 'party', 'seafood'],
    supportPlaces: ['Patong Beach', 'Bangla Road', 'Jungceylon area', 'nearby island tour piers'],
    caution: 'Best if you want energy. It can feel noisy for a quiet couple escape.',
    specialMoments: [{ months: ['December', 'January'], label: 'Peak social beach season' }],
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
    costBands: { budget: '$550-$850', 'mid-range': '$900-$1,500', luxury: '$2,100+' },
    visaLabel: 'ETA-style visa is generally straightforward',
    flightTimes: { asia: '1-6h', europe: '11-13h', middleEast: '4-5h', northAmerica: '20h+', other: '8-13h' },
    keywordTags: ['surf', 'beach cafes', 'whale watching', 'seafood', 'couples'],
    supportPlaces: ['Coconut Tree Hill', 'Weligama surf bay', 'Mirissa beach cafés', 'Parrot Rock'],
    specialMoments: [{ months: ['January', 'February'], label: 'Best south-coast surf-and-café window' }],
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
    costBands: { budget: '$700-$950', 'mid-range': '$1,100-$1,700', luxury: '$2,500+' },
    visaLabel: 'ETA-style visa is generally straightforward',
    flightTimes: { asia: '1-6h', europe: '11-13h', middleEast: '4-5h', northAmerica: '20h+', other: '8-13h' },
    keywordTags: ['quiet beach', 'boutique stays', 'romantic', 'sea turtles', 'nature'],
    supportPlaces: ['Silent Beach', 'Goyambokka', 'Rekawa turtle coast', 'Tangalle lagoon'],
    specialMoments: [{ months: ['January', 'February'], label: 'Calmer south-coast luxury season' }],
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
    costBands: { budget: '$1,300-$1,800', 'mid-range': '$2,000-$2,900', luxury: '$3,600+' },
    visaLabel: 'Usually simple for short stays from many countries',
    flightTimes: { asia: '2-7h', europe: '14-16h', middleEast: '10-11h', northAmerica: '11-14h', other: '8-15h' },
    keywordTags: ['bamboo', 'scenic', 'temples', 'romantic', 'nature'],
    supportPlaces: ['Bamboo Grove', 'Togetsukyo Bridge', 'river walks', 'Tenryu-ji'],
    caution: 'Can feel expensive during peak foliage weeks.',
    specialMoments: [{ months: ['November'], label: 'Autumn foliage district highlight' }],
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
    costBands: { budget: '$1,300-$1,800', 'mid-range': '$2,000-$3,000', luxury: '$3,800+' },
    visaLabel: 'Usually simple for short stays from many countries',
    flightTimes: { asia: '2-7h', europe: '14-16h', middleEast: '10-11h', northAmerica: '11-14h', other: '8-15h' },
    keywordTags: ['temples', 'old streets', 'tea houses', 'romantic', 'shopping'],
    supportPlaces: ['Kiyomizu-dera area', 'Ninenzaka', 'Gion edge', 'tea-house streets'],
    caution: 'Very popular at midday. Best early or late.',
    specialMoments: [{ months: ['March', 'April'], label: 'Cherry-blossom old-street season' }],
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
    interests: ['culture', 'food', 'shopping', 'nightlife', 'romantic'],
    travelerTypes: ['couple', 'friends', 'solo'],
    durations: ['weekend', 'short', 'medium'],
    trendMonths: ['April', 'May', 'September'],
    costBands: { budget: '$800-$1,150', 'mid-range': '$1,250-$1,900', luxury: '$2,800+' },
    visaLabel: 'Varies by passport but often manageable online',
    flightTimes: { asia: '7-10h', europe: '3-4h', middleEast: '4-5h', northAmerica: '10-12h', other: '7-12h' },
    keywordTags: ['cafes', 'shopping', 'rooftops', 'nightlife', 'culture'],
    supportPlaces: ['Galata Tower area', 'Karakoy cafés', 'ferry piers', 'Istiklal side streets'],
    specialMoments: [{ months: ['September', 'October'], label: 'Best weather for ferry-and-rooftop days' }],
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
    costBands: { budget: '$780-$1,100', 'mid-range': '$1,200-$1,850', luxury: '$2,700+' },
    visaLabel: 'Varies by passport but often manageable online',
    flightTimes: { asia: '7-10h', europe: '3-4h', middleEast: '4-5h', northAmerica: '10-12h', other: '7-12h' },
    keywordTags: ['history', 'mosques', 'heritage', 'hammam', 'culture'],
    supportPlaces: ['Blue Mosque area', 'Hagia Sophia', 'Basilica Cistern', 'old tram corridor'],
    specialMoments: [{ months: ['April', 'May'], label: 'Classic spring heritage season' }],
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
    costBands: { budget: '$1,250-$1,700', 'mid-range': '$1,850-$2,700', luxury: '$3,800+' },
    visaLabel: 'Depends on origin; planning ahead helps',
    flightTimes: { asia: '12-15h', europe: '11-12h', middleEast: '9-10h', northAmerica: '20h+', other: '9-16h' },
    keywordTags: ['coast', 'sunset', 'hiking', 'nature', 'seafood', 'luxury'],
    supportPlaces: ['Camps Bay promenade', 'Lion’s Head access', 'Clifton beaches', 'Table Mountain edge'],
    specialMoments: [{ months: ['January', 'February'], label: 'Peak Cape coast and sunset season' }],
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
    costBands: { budget: '$1,200-$1,650', 'mid-range': '$1,800-$2,500', luxury: '$3,700+' },
    visaLabel: 'Depends on origin; planning ahead helps',
    flightTimes: { asia: '12-15h', europe: '11-12h', middleEast: '9-10h', northAmerica: '20h+', other: '9-16h' },
    keywordTags: ['wine', 'food', 'romantic', 'mountains', 'luxury'],
    supportPlaces: ['wine tram routes', 'estate lunches', 'mountain lookouts', 'boutique stays'],
    specialMoments: [{ months: ['January', 'February'], label: 'Peak summer wine-country season' }],
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
    costBands: { budget: '$1,000-$1,450', 'mid-range': '$1,550-$2,300', luxury: '$3,200+' },
    visaLabel: 'Schengen rules apply',
    flightTimes: { asia: '14-17h', europe: '2-4h', middleEast: '7-8h', northAmerica: '7-9h', other: '8-15h' },
    keywordTags: ['seafood', 'nightlife', 'culture', 'viewpoints', 'shopping'],
    supportPlaces: ['Alfama walks', 'Time Out Market area', 'Bairro Alto edge', 'Miradouros'],
    specialMoments: [{ months: ['June'], label: 'Festival energy and long-light evenings' }],
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
    costBands: { budget: '$1,100-$1,500', 'mid-range': '$1,650-$2,400', luxury: '$3,500+' },
    visaLabel: 'Schengen rules apply',
    flightTimes: { asia: '14-17h', europe: '2-4h', middleEast: '7-8h', northAmerica: '7-9h', other: '8-15h' },
    keywordTags: ['beach', 'seafood', 'coast', 'romantic', 'surf'],
    supportPlaces: ['Cascais old town', 'Guincho Beach', 'Boca do Inferno', 'coastal seafood spots'],
    specialMoments: [{ months: ['July', 'August'], label: 'Best Atlantic coast escape window' }],
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
    costBands: { budget: '$1,200-$1,700', 'mid-range': '$1,800-$2,800', luxury: '$4,200+' },
    visaLabel: 'Often easy, but passport-specific',
    flightTimes: { asia: '4-8h', europe: '6-7h', middleEast: '1-3h', northAmerica: '13-15h', other: '6-14h' },
    keywordTags: ['shopping', 'beach', 'luxury', 'nightlife', 'food'],
    supportPlaces: ['JBR Walk', 'Marina promenade', 'Bluewaters', 'beach clubs'],
    specialMoments: [{ months: ['January', 'February'], label: 'Peak winter escape with beach weather' }],
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
    costBands: { budget: '$650-$950', 'mid-range': '$1,050-$1,650', luxury: '$2,200+' },
    visaLabel: 'Often simple online, but passport rules vary',
    flightTimes: { asia: '2-6h', europe: '14-16h', middleEast: '8-10h', northAmerica: '18h+', other: '8-14h' },
    keywordTags: ['food', 'heritage', 'lanterns', 'romantic', 'beach nearby'],
    supportPlaces: ['Ancient Town lanes', 'An Bang Beach trips', 'night market', 'local cooking stops'],
    specialMoments: [{ months: ['March', 'April'], label: 'Strong weather-value window for heritage and food' }],
  },
  {
    id: 'my-khe-da-nang',
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
    costBands: { budget: '$620-$900', 'mid-range': '$1,000-$1,550', luxury: '$2,100+' },
    visaLabel: 'Often simple online, but passport rules vary',
    flightTimes: { asia: '2-6h', europe: '14-16h', middleEast: '8-10h', northAmerica: '18h+', other: '8-14h' },
    keywordTags: ['beach', 'seafood', 'scenic drives', 'nature', 'family'],
    supportPlaces: ['My Khe Beach', 'Son Tra roads', 'seafood streets', 'Marble Mountains access'],
    specialMoments: [{ months: ['June'], label: 'Best beach-city balance before wet months' }],
  },
];

const discoveryKeywordInterestMap = [
  { pattern: /(seafood|sea food|sushi|food|eat|dining|restaurant|cafe|local dishes|fine dining|street food)/, interests: ['food'], keywords: ['food', 'seafood', 'dining'] },
  { pattern: /(beach|island|coast|coastal|sea|ocean|sunset beach)/, interests: ['beach'], keywords: ['beach', 'coastal', 'island'] },
  { pattern: /(shopping|mall|markets|market|boutiques|design shops)/, interests: ['shopping'], keywords: ['shopping', 'markets'] },
  { pattern: /(romantic|honeymoon|couple|date|sunset dinner)/, interests: ['romantic'], keywords: ['romantic', 'sunset'] },
  { pattern: /(nature|green|mountains|lake|scenic|views|landscape)/, interests: ['nature'], keywords: ['nature', 'scenic'] },
  { pattern: /(adventure|hiking|surf|diving|outdoors|safari|road trip)/, interests: ['adventure'], keywords: ['adventure', 'outdoors'] },
  { pattern: /(culture|history|temples|museum|local life|heritage)/, interests: ['culture'], keywords: ['culture', 'heritage'] },
  { pattern: /(nightlife|bars|party|clubs|late night)/, interests: ['nightlife'], keywords: ['nightlife'] },
  { pattern: /(luxury|premium|five star|resort|villa|spa)/, interests: ['luxury'], keywords: ['luxury', 'resort'] },
  { pattern: /(family|kids|child friendly|easy logistics)/, interests: ['family'], keywords: ['family'] },
];

// Geocode activity using Google Places API
async function geocodeActivity(activityName, destination) {
  const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  
  // Clean activity name
  let cleanName = activityName
    .replace(/&amp;/g, '&')
    .replace(/Train to |Walk |Explore |Visit |Sunset at |Hidden |Free |Climb |Stroll |Swim |Wander |Journey:/gi, '')
    .split(/[&,]/)[0]
    .trim();
  
  console.log(`🔍 Geocoding: "${activityName}" → "${cleanName}, ${destination}"`);
  
  // Try Google Places API first
  if (GOOGLE_API_KEY) {
    try {
      const query = `${cleanName}, ${destination}`;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      
      console.log(`📍 Google response for "${cleanName}": ${data.status}`);
      
      if (data.status === 'OK' && data.results[0]) {
        const location = data.results[0].geometry.location;
        console.log(`✅ Found: ${cleanName} at ${location.lat}, ${location.lng}`);
        return {
          lat: location.lat,
          lng: location.lng,
          placeId: data.results[0].place_id,
          address: data.results[0].formatted_address
        };
      } else {
        console.log(`❌ Google failed for "${cleanName}": ${data.status}`);
      }
    } catch (error) {
      console.error(`❌ Google geocode error for ${activityName}:`, error.message);
    }
  } else {
    console.log('⚠️ No Google API key configured');
  }
  
  // Fallback to Nominatim
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const query = `${cleanName}, ${destination}`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const response = await fetch(url, { headers: { 'User-Agent': 'TravelBuddy' } });
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
  } catch (error) {
    console.error(`Nominatim geocode error for ${activityName}:`, error.message);
  }
  
  return null;
}

// Test Azure OpenAI configuration
router.get('/test-config', (req, res) => {
  res.json({
    hasEndpoint: !!AZURE_OPENAI_ENDPOINT,
    hasApiKey: !!AZURE_OPENAI_API_KEY,
    hasDeploymentName: !!AZURE_OPENAI_DEPLOYMENT_NAME,
    endpointPreview: AZURE_OPENAI_ENDPOINT ? AZURE_OPENAI_ENDPOINT.substring(0, 30) + '...' : 'Not set',
    apiKeyLength: AZURE_OPENAI_API_KEY?.length || 0,
    deploymentName: AZURE_OPENAI_DEPLOYMENT_NAME || 'Not set',
    apiVersion: AZURE_API_VERSION
  });
});

// Generate text endpoint for trip planning
router.post('/generate-text', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('🤖 Azure AI request:', prompt.substring(0, 100) + '...');

    // Call Azure OpenAI
    const response = await fetch(
      `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=${AZURE_API_VERSION}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_OPENAI_API_KEY,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a travel planning expert. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_completion_tokens: 2000,
          temperature: 0.7,
          top_p: 0.95,
          frequency_penalty: 0,
          presence_penalty: 0
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Azure AI API failed: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    
    console.log('✅ Azure AI response:', text.substring(0, 200) + '...');

    // Try to extract JSON from response
    let jsonData = null;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonData = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('⚠️ JSON parsing failed:', e.message);
    }

    res.json({
      text: text,
      itinerary: jsonData,
      model: 'azure-gpt-4.1',
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    console.error('❌ Azure AI error:', error);
    
    res.status(500).json({
      error: 'Failed to generate text',
      message: error.message,
      text: _getFallbackResponse()
    });
  }
});

async function _getFallbackTripPlan(destination, duration) {
  const plan = {
    id: `fallback_${Date.now()}`,
    tripTitle: `Essential ${duration} in ${destination}`,
    destination,
    duration,
    introduction: `Discover the must-see highlights of ${destination} with this essential itinerary`,
    dailyPlans: [{
      day: 1,
      title: 'Day 1: City Highlights',
      theme: 'Essential Sights & Local Culture',
      activities: [{
        timeOfDay: 'Morning (3-4 hours)',
        activityTitle: 'Historic City Center Exploration',
        description: `Start your ${destination} adventure by exploring the historic city center. Walk through the main squares, admire the architecture, and soak in the local atmosphere. 🚗 Transport: Walking or local transport 💰 Cost: Free-$10 ⏰ Best Time: 9:00 AM - 12:00 PM | Avoid: Midday heat in summer`,
        estimatedDuration: '3-4 hours',
        icon: '🏛️',
        category: 'Sightseeing',
        effortLevel: 'Easy'
      }]
    }],
    conclusion: `Enjoy your memorable time exploring ${destination}!`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Geocode fallback activities
  for (const day of plan.dailyPlans || []) {
    for (const activity of day.activities || []) {
      const result = await geocodeActivity(activity.activityTitle, destination);
      if (result) {
        activity.coordinates = { lat: result.lat, lng: result.lng };
        activity.location = `${result.lat},${result.lng}`;
        if (result.placeId) activity.googlePlaceId = result.placeId;
        if (result.address) activity.fullAddress = result.address;
      }
    }
  }
  
  return plan;
}

function _getFallbackResponse() {
  return `{
  "activities": [
    {
      "name": "City Center Exploration",
      "type": "landmark",
      "startTime": "09:00",
      "endTime": "11:00",
      "description": "Explore the main attractions and historic sites in the city center.",
      "cost": "Free",
      "tips": ["Start early to avoid crowds", "Bring comfortable walking shoes"]
    },
    {
      "name": "Local Restaurant",
      "type": "restaurant", 
      "startTime": "12:30",
      "endTime": "14:00",
      "description": "Experience authentic local cuisine at a popular restaurant.",
      "cost": "$20-30",
      "tips": ["Try the local specialties", "Make a reservation"]
    },
    {
      "name": "Cultural Museum",
      "type": "museum",
      "startTime": "15:30", 
      "endTime": "17:00",
      "description": "Learn about local history and culture at the main museum.",
      "cost": "$12",
      "tips": ["Audio guide recommended", "Check for student discounts"]
    }
  ]
}`;
}

// Generate enhanced trip overview endpoint
router.post('/enhance-trip-overview', async (req, res) => {
  try {
    const { destination, duration, introduction, tripTitle } = req.body;
    
    if (!destination || !introduction) {
      return res.status(400).json({ error: 'Destination and introduction are required' });
    }

    const prompt = `Enhance this trip overview for ${destination} (${duration}):

Original: "${introduction}"

Create an enhanced, engaging overview with:
- Rich cultural insights
- Local tips and customs
- Best time to visit highlights
- What makes this destination special
- Practical travel advice

Format with markdown-style formatting:
🌟 **${tripTitle}** 🌟

💡 **Cultural Highlights:**
• Key cultural points

💡 **Local Insights:**
• Insider tips

💡 **Travel Tips:**
• Practical advice

Keep it engaging and informative, around 200-300 words.`;

    console.log('✨ Enhancing trip overview for:', destination);

    const response = await fetch(
      `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=${AZURE_API_VERSION}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_OPENAI_API_KEY,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a travel expert who creates engaging, informative trip overviews with cultural insights and practical tips.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 800,
          temperature: 0.7
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Azure AI API failed: ${response.status}`);
    }

    const data = await response.json();
    const enhancedText = data.choices[0].message.content;
    
    console.log('✅ Enhanced trip overview generated');
    
    res.json({
      enhancedOverview: enhancedText,
      destination,
      duration,
      processingTime: Date.now() - Date.now()
    });

  } catch (error) {
    console.error('❌ Enhanced overview error:', error);
    
    res.json({
      enhancedOverview: _getFallbackEnhancedOverview(req.body.destination, req.body.duration, req.body.tripTitle),
      destination: req.body.destination,
      duration: req.body.duration
    });
  }
});

function _getFallbackEnhancedOverview(destination, duration, tripTitle) {
  return `🌟 **${tripTitle || `Amazing ${duration} in ${destination}`}** 🌟

${destination} offers an incredible blend of experiences that will create lasting memories. This carefully crafted ${duration} itinerary takes you through the heart of what makes this destination truly special.

💡 **Cultural Highlights:**
• Immerse yourself in the local culture and traditions
• Discover historical landmarks and architectural wonders
• Experience authentic local cuisine and flavors

💡 **Local Insights:**
• Best times to visit popular attractions to avoid crowds
• Hidden gems known only to locals
• Cultural etiquette and customs to enhance your experience

💡 **Travel Tips:**
• Comfortable walking shoes recommended for exploration
• Local currency and payment methods
• Weather considerations for your travel dates

Get ready for an unforgettable journey through ${destination}!`;
}

// Generate place content endpoint
router.post('/generate-place-content', async (req, res) => {
  try {
    const { placeName, placeType, address, description, rating } = req.body;
    
    if (!placeName) {
      return res.status(400).json({ error: 'Place name is required' });
    }

    const prompt = `Generate detailed content for this place: ${placeName}

Place Information:
- Type: ${placeType || 'Unknown'}
- Address: ${address || 'Unknown'}
- Description: ${description || 'No description available'}
- Rating: ${rating || 'N/A'}

Return JSON with this structure:
{
  "overview": "Comprehensive 3-4 sentence overview of the place, its significance, and what makes it special",
  "highlights": [
    "Key feature or attraction 1",
    "Key feature or attraction 2",
    "Key feature or attraction 3",
    "Key feature or attraction 4"
  ],
  "insiderTips": [
    "Local tip or secret about the place",
    "Best time to visit or avoid crowds",
    "Photography or experience tip",
    "Money-saving or practical tip"
  ],
  "bestTimeToVisit": "Detailed advice on optimal timing (season, day, hour)",
  "duration": "Recommended time to spend (e.g., '2-3 hours', 'Half day', 'Full day')",
  "cost": "Estimated cost range with currency (e.g., 'Free', '$10-15', '€20-30')"
}`;

    const response = await fetch(
      `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=${AZURE_API_VERSION}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_OPENAI_API_KEY,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a travel content expert. Always respond with valid JSON only. Provide detailed, accurate, and engaging information about places.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.8
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Azure AI API failed: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    
    let placeContent;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        placeContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (e) {
      console.warn('⚠️ JSON parsing failed, using fallback');
      placeContent = _getFallbackPlaceContent(placeName, placeType);
    }

    res.json(placeContent);

  } catch (error) {
    console.error('❌ Place content generation error:', error);
    res.json(_getFallbackPlaceContent(
      req.body.placeName || 'Unknown Place',
      req.body.placeType || 'attraction'
    ));
  }
});

function _getFallbackPlaceContent(placeName, placeType) {
  return {
    overview: `${placeName} is a notable ${placeType} that offers visitors a unique experience. This destination combines local culture with memorable attractions, making it a worthwhile stop for travelers. The location provides opportunities for exploration and discovery in a welcoming environment.`,
    highlights: [
      "Unique architectural or natural features",
      "Rich cultural and historical significance",
      "Great photo opportunities",
      "Authentic local atmosphere"
    ],
    insiderTips: [
      "Visit during off-peak hours for a more peaceful experience",
      "Bring a camera to capture the unique features",
      "Ask locals for their favorite spots nearby",
      "Check opening hours before visiting"
    ],
    bestTimeToVisit: "Early morning or late afternoon for the best experience and lighting",
    duration: "2-3 hours",
    cost: "Varies - check current pricing"
  };
}

// Ask AI about specific places endpoint
router.post('/ask', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { question, place } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const prompt = `You are a travel expert. Answer this question about the place: "${question}"

Place Information:
- Name: ${place?.name || 'Unknown'}
- Type: ${place?.type || 'Unknown'}
- Address: ${place?.address || 'Unknown'}
- Description: ${place?.description || 'No description available'}

Provide a helpful, accurate response in 2-3 sentences.`;

    const response = await fetch(
      `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=${AZURE_API_VERSION}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_OPENAI_API_KEY,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful travel assistant. Provide concise, accurate information about places.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.7
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Azure AI API failed: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;
    
    res.json({ answer });

  } catch (error) {
    console.error('❌ AI ask error:', error);
    res.status(500).json({
      error: 'Failed to get AI response',
      answer: 'I\'m sorry, I\'m having trouble connecting right now. Please try again later.'
    });
  }
});

// Safety content generation endpoint
router.post('/safety-content', async (req, res) => {
  try {
    const { location, latitude, longitude, contentType = 'general' } = req.body;
    
    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }

    const prompt = `Generate comprehensive safety information for ${location} (${latitude}, ${longitude}).

Return JSON with this structure:
{
  "emergencyTips": [
    "Specific emergency tip with local context"
  ],
  "culturalTips": [
    "Cultural safety awareness tip"
  ],
  "transportSafety": [
    "Safe transportation advice"
  ],
  "medicalInfo": {
    "hospitals": "Info about nearby hospitals",
    "pharmacies": "Pharmacy locations and hours",
    "insurance": "Travel insurance advice"
  },
  "scamAwareness": [
    "Common scam and how to avoid it"
  ],
  "emergencyContacts": {
    "police": "Local police number",
    "ambulance": "Ambulance number",
    "fire": "Fire department number",
    "tourist_police": "Tourist police if available"
  }
}`;

    const response = await fetch(
      `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=${AZURE_API_VERSION}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_OPENAI_API_KEY,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a travel safety expert. Always respond with valid JSON only. Provide accurate, location-specific safety information.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.7
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Azure AI API failed: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    
    let safetyContent;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        safetyContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (e) {
      console.warn('⚠️ JSON parsing failed, using fallback');
      safetyContent = _getFallbackSafetyContent(location);
    }

    res.json(safetyContent);

  } catch (error) {
    console.error('❌ Safety content generation error:', error);
    res.json(_getFallbackSafetyContent(req.body.location || 'Unknown Location'));
  }
});

function _getFallbackSafetyContent(location) {
  return {
    emergencyTips: [
      "Keep emergency contacts saved in your phone",
      "Share your location with trusted contacts",
      "Keep copies of important documents"
    ],
    culturalTips: [
      "Research local customs and dress codes",
      "Learn basic phrases in the local language",
      "Respect religious and cultural sites"
    ],
    transportSafety: [
      "Use official taxi services or ride-sharing apps",
      "Avoid traveling alone at night",
      "Keep valuables secure while using public transport"
    ],
    medicalInfo: {
      hospitals: "Contact local emergency services for hospital information",
      pharmacies: "Look for pharmacy signs or ask at your hotel",
      insurance: "Ensure you have valid travel insurance coverage"
    },
    scamAwareness: [
      "Be cautious of overly friendly strangers",
      "Verify prices before purchasing",
      "Don't give personal information to unknown people"
    ],
    emergencyContacts: {
      police: "112",
      ambulance: "112",
      fire: "112",
      tourist_police: "Contact local tourist information"
    }
  };
}

// Translation endpoint using Azure OpenAI
router.post('/translate', async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage = 'en' } = req.body;
    
    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'Text and target language are required' });
    }

    const prompt = `Translate the following text from ${sourceLanguage} to ${targetLanguage}. Return only the translation, no explanations:

"${text}"`;

    const response = await fetch(
      `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=${AZURE_API_VERSION}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_OPENAI_API_KEY,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a professional translator. Provide accurate translations without explanations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.3
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Azure AI API failed: ${response.status}`);
    }

    const data = await response.json();
    const translation = data.choices[0].message.content.trim();
    
    res.json({ translation });

  } catch (error) {
    console.error('❌ Translation error:', error);
    res.status(500).json({
      error: 'Translation failed',
      translation: req.body.text // Return original text as fallback
    });
  }
});

// Travel phrases endpoint using Azure OpenAI
router.get('/travel-phrases/:language', async (req, res) => {
  try {
    const { language } = req.params;
    const { category } = req.query;
    
    const prompt = `Generate 10 essential travel phrases in ${language} for category: ${category || 'general'}.

Return JSON array with this structure:
[
  {
    "id": "unique_id",
    "category": "${category || 'general'}",
    "english": "English phrase",
    "translation": "Translation in ${language}",
    "pronunciation": "Phonetic pronunciation guide"
  }
]`;

    const response = await fetch(
      `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=${AZURE_API_VERSION}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_OPENAI_API_KEY,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a language expert. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.7
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Azure AI API failed: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    
    let phrases;
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        phrases = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found');
      }
    } catch (e) {
      phrases = _getFallbackPhrases(language, category);
    }
    
    res.json({ phrases });

  } catch (error) {
    console.error('❌ Travel phrases error:', error);
    res.json({ phrases: _getFallbackPhrases(req.params.language, req.query.category) });
  }
});

// Location language detection
router.get('/location-language', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    
    // Simple location-to-language mapping
    const locationLanguages = {
      'FR': 'fr', 'ES': 'es', 'DE': 'de', 'IT': 'it', 'PT': 'pt',
      'JP': 'ja', 'KR': 'ko', 'CN': 'zh', 'SA': 'ar', 'RU': 'ru'
    };
    
    // Mock location detection based on coordinates
    let detectedLanguage = 'en';
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      // Europe
      if (latitude > 35 && latitude < 70 && longitude > -10 && longitude < 40) {
        if (longitude > 2 && longitude < 8) detectedLanguage = 'fr'; // France
        else if (longitude > -10 && longitude < 2) detectedLanguage = 'es'; // Spain
        else if (longitude > 8 && longitude < 15) detectedLanguage = 'de'; // Germany
        else if (longitude > 6 && longitude < 18) detectedLanguage = 'it'; // Italy
      }
      // Asia
      else if (latitude > 20 && latitude < 50 && longitude > 100 && longitude < 150) {
        if (longitude > 128 && longitude < 146) detectedLanguage = 'ja'; // Japan
        else if (longitude > 124 && longitude < 132) detectedLanguage = 'ko'; // Korea
        else if (longitude > 100 && longitude < 125) detectedLanguage = 'zh'; // China
      }
    }
    
    res.json({
      primaryLanguage: detectedLanguage,
      country: 'Unknown',
      confidence: 0.8
    });

  } catch (error) {
    console.error('❌ Location language error:', error);
    res.json({ primaryLanguage: 'en', country: 'Unknown', confidence: 0.5 });
  }
});

function _getFallbackPhrases(language, category) {
  return [
    {
      id: `help_${language}`,
      category: category || 'emergency',
      english: 'Help!',
      translation: 'Help!',
      pronunciation: 'help'
    },
    {
      id: `thanks_${language}`,
      category: category || 'basic',
      english: 'Thank you',
      translation: 'Thank you',
      pronunciation: 'thank you'
    }
  ];
}

function normalizeDiscoveryMonth(month = '') {
  const value = String(month).trim().toLowerCase();
  const months = [
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
  ];

  const matched = months.find((item) => item.toLowerCase() === value);
  return matched || String(month).trim();
}

function mapDiscoveryDurationDaysToBand(durationDays) {
  const days = Number(durationDays);
  if (!Number.isFinite(days) || days <= 0) return '';
  if (days <= 3) return 'weekend';
  if (days <= 7) return 'short';
  if (days <= 14) return 'medium';
  return 'long';
}

function getDiscoveryRepresentativeDurationDays(duration) {
  if (duration === 'weekend') return 3;
  if (duration === 'short') return 7;
  if (duration === 'medium') return 10;
  if (duration === 'long') return 16;
  return 7;
}

function mapDiscoveryBudgetTotalToBand(budgetTotal, durationDays) {
  const total = Number(budgetTotal);
  if (!Number.isFinite(total) || total <= 0) return '';

  const days = Number(durationDays);
  const normalizedDays = Number.isFinite(days) && days > 0 ? days : 7;
  const perDay = total / normalizedDays;

  if (perDay <= 180) return 'budget';
  if (perDay <= 420) return 'mid-range';
  return 'luxury';
}

function getDiscoveryRepresentativeBudgetTotal(budget, durationDays) {
  const days = Number(durationDays);
  const normalizedDays = Number.isFinite(days) && days > 0 ? days : 7;

  if (budget === 'budget') return normalizedDays * 140;
  if (budget === 'mid-range') return normalizedDays * 320;
  if (budget === 'luxury') return normalizedDays * 650;
  return normalizedDays * 250;
}

function normalizeDiscoveryAvoidList(avoid) {
  if (!Array.isArray(avoid)) return [];
  return avoid
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function parseDiscoveryAvoidPreferences(avoid = []) {
  const normalized = normalizeDiscoveryAvoidList(avoid).map((item) => item.toLowerCase());
  const combined = normalized.join(' | ');

  return {
    items: normalized,
    avoidLongFlights: /(long flight|long flights|too far|far away|flight time|layover|layovers)/.test(combined),
    avoidCrowds: /(crowd|crowded|busy|touristy|tourist heavy|overrun|queues)/.test(combined),
    avoidBadWeather: /(bad weather|rain|rainy|storm|stormy|humid|heat|too hot|monsoon)/.test(combined),
    avoidParty: /(party|nightlife|clubs|late night|drunk)/.test(combined),
  };
}

function normalizeDiscoveryRequest(body = {}) {
  const departure = String(body.origin || body.departure || '').trim();
  const month = normalizeDiscoveryMonth(body.month || '');
  const durationBand = String(body.duration || '').trim();
  const durationDays = Number(body.durationDays) > 0
    ? Number(body.durationDays)
    : getDiscoveryRepresentativeDurationDays(durationBand);
  const normalizedDuration = durationBand || mapDiscoveryDurationDaysToBand(durationDays) || 'short';
  const budgetBand = String(body.budget || '').trim();
  const budgetTotal = Number(body.budgetTotal) > 0
    ? Number(body.budgetTotal)
    : getDiscoveryRepresentativeBudgetTotal(budgetBand, durationDays);
  const normalizedBudget = budgetBand || mapDiscoveryBudgetTotalToBand(budgetTotal, durationDays) || 'mid-range';
  const tripNotes = String(body.tripNotes || body.additionalPreferences || '').trim();
  const avoid = normalizeDiscoveryAvoidList(body.avoid);

  return {
    origin: departure,
    departure,
    month,
    durationDays,
    duration: normalizedDuration,
    travelerType: String(body.travelerType || '').trim(),
    budgetTotal,
    budget: normalizedBudget,
    interests: Array.isArray(body.interests) ? body.interests.map((item) => String(item).trim()).filter(Boolean) : [],
    avoid,
    tripNotes,
  };
}

function classifyDiscoveryOriginRegion(departure = '') {
  const value = String(departure).toLowerCase();

  if (/(london|paris|rome|berlin|amsterdam|madrid|lisbon|france|germany|uk|united kingdom|europe)/.test(value)) return 'europe';
  if (/(dubai|abu dhabi|doha|riyadh|jeddah|muscat|kuwait|qatar|uae|saudi|middle east)/.test(value)) return 'middleEast';
  if (/(new york|toronto|vancouver|los angeles|san francisco|chicago|usa|united states|canada|north america)/.test(value)) return 'northAmerica';
  if (/(colombo|delhi|mumbai|bangkok|singapore|tokyo|seoul|jakarta|manila|hong kong|asia|sri lanka|india)/.test(value)) return 'asia';
  return 'other';
}

function parseDiscoveryIntent(notes = '') {
  const value = String(notes).toLowerCase();
  const inferredInterests = new Set();
  const matchedKeywords = new Set();

  discoveryKeywordInterestMap.forEach((entry) => {
    if (entry.pattern.test(value)) {
      entry.interests.forEach((interest) => inferredInterests.add(interest));
      entry.keywords.forEach((keyword) => matchedKeywords.add(keyword));
    }
  });

  return {
    inferredInterests: Array.from(inferredInterests),
    matchedKeywords: Array.from(matchedKeywords),
  };
}

function getDiscoveryWeatherLabel(destination, month) {
  if (destination.bestMonths.includes(month)) return 'Excellent season';
  if (destination.shoulderMonths.includes(month)) return 'Good shoulder season';
  if (destination.avoidMonths.includes(month)) return 'Less ideal weather';
  return 'Mixed seasonal fit';
}

function getDiscoveryTrendLabel(destination, month) {
  const moment = destination.specialMoments.find((entry) => entry.months.includes(month));
  if (moment) return moment.label;
  if (destination.trendMonths.includes(month)) return 'Trending strongly this month';
  return 'Solid year-round interest';
}

function getDiscoveryBudgetScore(destination, budget) {
  if (destination.budgetFit.includes(budget)) return 24;
  if (budget === 'luxury' && destination.budgetFit.includes('mid-range')) return 14;
  if (budget === 'mid-range' && destination.budgetFit.includes('budget')) return 12;
  return 4;
}

function getDiscoveryMonthScore(destination, month) {
  if (destination.bestMonths.includes(month)) return 28;
  if (destination.shoulderMonths.includes(month)) return 16;
  if (destination.avoidMonths.includes(month)) return -8;
  return 8;
}

function getDiscoveryInterestScore(destination, interests) {
  const matches = interests.filter((interest) => destination.interests.includes(interest));
  if (interests.length === 0) return 0;
  if (matches.length === 0) return -24;
  if (matches.length === 1) return 10;
  return matches.length * 14 + 6;
}

function parseDiscoveryFlightEffort(flightLabel = '') {
  const matches = Array.from(String(flightLabel).matchAll(/(\d+)/g)).map((match) => Number(match[1]));
  if (matches.length === 0) return 10;
  if (matches.length === 1) return matches[0];
  return (matches[0] + matches[matches.length - 1]) / 2;
}

function getDiscoveryOriginEffortScore(destination, originRegion, duration) {
  const flightLabel = destination.flightTimes[originRegion] || destination.flightTimes.other;
  const effort = parseDiscoveryFlightEffort(flightLabel);

  if (duration === 'weekend') {
    if (effort <= 4) return 14;
    if (effort <= 7) return 8;
    if (effort <= 10) return 1;
    return -8;
  }

  if (duration === 'short') {
    if (effort <= 5) return 12;
    if (effort <= 8) return 8;
    if (effort <= 12) return 3;
    return -4;
  }

  if (duration === 'medium') {
    if (effort <= 8) return 9;
    if (effort <= 12) return 6;
    return 3;
  }

  return 6;
}

function getDiscoveryFlightFit(destination, originRegion, durationDays) {
  const flightTimes = destination?.flightTimes || {};
  const flightLabel = flightTimes[originRegion] || flightTimes.other || '';
  const effort = parseDiscoveryFlightEffort(flightLabel);
  const days = Number(durationDays);
  const normalizedDays = Number.isFinite(days) && days > 0 ? days : 7;

  if (normalizedDays <= 4) {
    if (effort <= 5) return 'Strong';
    if (effort <= 8) return 'Moderate';
    return 'Weak';
  }

  if (normalizedDays <= 8) {
    if (effort <= 6) return 'Strong';
    if (effort <= 10) return 'Moderate';
    return 'Weak';
  }

  if (effort <= 10) return 'Strong';
  if (effort <= 14) return 'Moderate';
  return 'Weak';
}

function getDiscoveryWeatherFit(destination, month) {
  const bestMonths = Array.isArray(destination?.bestMonths) ? destination.bestMonths : [];
  const shoulderMonths = Array.isArray(destination?.shoulderMonths) ? destination.shoulderMonths : [];
  const avoidMonths = Array.isArray(destination?.avoidMonths) ? destination.avoidMonths : [];

  if (bestMonths.includes(month)) return 'Strong';
  if (shoulderMonths.includes(month)) return 'Moderate';
  if (avoidMonths.includes(month)) return 'Weak';
  return 'Moderate';
}

function getDiscoveryBudgetFit(destination, budget) {
  const budgetFit = Array.isArray(destination?.budgetFit) ? destination.budgetFit : [];

  if (budgetFit.includes(budget)) return 'Strong';
  if ((budget === 'luxury' && budgetFit.includes('mid-range')) || (budget === 'mid-range' && budgetFit.includes('budget'))) {
    return 'Moderate';
  }
  return 'Stretch';
}

function getDiscoveryCrowdRisk(destination, month) {
  const trendMonths = Array.isArray(destination?.trendMonths) ? destination.trendMonths : [];
  const bestMonths = Array.isArray(destination?.bestMonths) ? destination.bestMonths : [];

  if (trendMonths.includes(month) && bestMonths.includes(month)) return 'High';
  if (trendMonths.includes(month) || bestMonths.includes(month)) return 'Medium';
  return 'Low';
}

function getDiscoveryAvoidancePenalty(destination, form, originRegion) {
  const avoidPreferences = parseDiscoveryAvoidPreferences(form.avoid);
  const flightLabel = destination.flightTimes[originRegion] || destination.flightTimes.other;
  const flightEffort = parseDiscoveryFlightEffort(flightLabel);
  const crowdRisk = getDiscoveryCrowdRisk(destination, form.month);
  let penalty = 0;

  if (avoidPreferences.avoidLongFlights) {
    if (flightEffort > 12) penalty -= 22;
    else if (flightEffort > 8) penalty -= 12;
    else if (flightEffort > 5) penalty -= 4;
  }

  if (avoidPreferences.avoidCrowds) {
    if (crowdRisk === 'High') penalty -= 16;
    else if (crowdRisk === 'Medium') penalty -= 8;
  }

  if (avoidPreferences.avoidBadWeather) {
    if (destination.avoidMonths.includes(form.month)) penalty -= 20;
    else if (destination.shoulderMonths.includes(form.month)) penalty -= 6;
  }

  if (avoidPreferences.avoidParty && destination.interests.includes('nightlife')) {
    penalty -= 12;
  }

  return penalty;
}

function buildDiscoveryTripFeeling(destination, matchingInterests = []) {
  const feelings = new Set();

  if (matchingInterests.includes('romantic')) feelings.add('romantic');
  if (matchingInterests.includes('beach')) feelings.add('relaxing');
  if (matchingInterests.includes('nature')) feelings.add('scenic');
  if (matchingInterests.includes('food')) feelings.add('flavorful');
  if (matchingInterests.includes('culture')) feelings.add('immersive');
  if (matchingInterests.includes('adventure')) feelings.add('active');
  if (destination.placeType === 'coast' || destination.placeType === 'beach town') feelings.add('sunny');
  if (destination.placeType === 'town') feelings.add('balanced');

  if (feelings.size < 3) {
    ['scenic', 'balanced', 'easygoing'].forEach((value) => feelings.add(value));
  }

  return Array.from(feelings).slice(0, 3);
}

function buildDiscoveryRisks(destination, form, originRegion) {
  const risks = [];
  const flightFit = getDiscoveryFlightFit(destination, originRegion, form.durationDays);
  const weatherFit = getDiscoveryWeatherFit(destination, form.month);
  const crowdRisk = getDiscoveryCrowdRisk(destination, form.month);
  const budgetFit = getDiscoveryBudgetFit(destination, form.budget);

  if (flightFit === 'Weak') {
    risks.push(`Flight time from ${form.origin || form.departure} may feel long for a ${form.durationDays}-day trip.`);
  }

  if (weatherFit === 'Weak') {
    risks.push(`${form.month} is a weaker weather fit here, so conditions may be less reliable.`);
  }

  if (crowdRisk === 'High') {
    risks.push('Popular areas are likely to feel crowded in your travel month.');
  } else if (crowdRisk === 'Medium') {
    risks.push('You may need to book key stays or restaurants earlier than usual.');
  }

  if (budgetFit === 'Stretch') {
    risks.push('Your budget could feel tight unless you keep stays and activities selective.');
  }

  if (destination.caution) {
    risks.push(destination.caution);
  }

  return risks.slice(0, 3);
}

function buildDiscoveryBestVersion(destination, form) {
  const places = Array.isArray(destination.supportPlaces) ? destination.supportPlaces.slice(0, 2) : [];
  const intro = places.length > 0 ? `Base yourself around ${places.join(' and ')}.` : `Stay in ${destination.name}.`;

  if (form.travelerType === 'couple') {
    return `${intro} Plan a slower ${form.durationDays}-day couple trip with room for one standout meal and one scenic late-afternoon experience.`;
  }

  if (form.travelerType === 'family') {
    return `${intro} Keep the itinerary light, choose one anchor activity per day, and stay close to the easiest beach or town center.`;
  }

  if (form.travelerType === 'friends') {
    return `${intro} Mix one active day with flexible evenings so the trip feels social without becoming rushed.`;
  }

  return `${intro} Use it as a balanced base and keep the schedule light enough to enjoy the place, not just tick it off.`;
}

function normalizeDiscoveryMatchScore(rawScore, topScore) {
  const raw = Number(rawScore);
  const top = Number(topScore);

  if (!Number.isFinite(raw)) return 50;
  if (!Number.isFinite(top) || top <= 0) return Math.max(35, Math.min(95, Math.round(raw)));

  const normalized = 55 + ((raw / top) * 40);
  return Math.max(35, Math.min(97, Math.round(normalized)));
}

function getDiscoveryKeywordScore(destination, matchedKeywords) {
  const normalizedTags = destination.keywordTags.map((tag) => tag.toLowerCase());
  const matches = matchedKeywords.filter((keyword) =>
    normalizedTags.some((tag) => tag.includes(keyword) || keyword.includes(tag))
  );

  return {
    score: matches.length * 8,
    matches,
  };
}

function rankDiscoveryDestinations(form) {
  const originRegion = classifyDiscoveryOriginRegion(form.departure);
  const parsedIntent = parseDiscoveryIntent(form.tripNotes || '');
  const combinedInterests = Array.from(new Set([...(form.interests || []), ...parsedIntent.inferredInterests]));

  return discoveryDestinations
    .map((destination) => {
      const keywordMatch = getDiscoveryKeywordScore(destination, parsedIntent.matchedKeywords);
      const flightEffortScore = getDiscoveryOriginEffortScore(destination, originRegion, form.duration);
      const matchingInterests = combinedInterests.filter((interest) => destination.interests.includes(interest));
      const score =
        getDiscoveryMonthScore(destination, form.month) +
        getDiscoveryBudgetScore(destination, form.budget) +
        getDiscoveryInterestScore(destination, combinedInterests) +
        (destination.durations.includes(form.duration) ? 12 : 5) +
        (destination.travelerTypes.includes(form.travelerType) ? 10 : 3) +
        (destination.trendMonths.includes(form.month) ? 8 : 3) +
        keywordMatch.score +
        flightEffortScore +
        getDiscoveryAvoidancePenalty(destination, form, originRegion);

      const whyItFits = [
        `${form.month} gives ${destination.name} a ${getDiscoveryWeatherLabel(destination, form.month).toLowerCase()}.`,
        `${destination.name} aligns with your ${form.budget} budget range.`,
        keywordMatch.matches.length > 0
          ? `It strongly matches your focus on ${keywordMatch.matches.slice(0, 3).join(', ')}.`
          : matchingInterests.length > 0
            ? `It matches your interests in ${matchingInterests.slice(0, 3).join(', ')}.`
            : 'It still offers a balanced mix of city, stay, and activity options.',
      ];

      if (form.duration === 'weekend') {
        const flightLabel = destination.flightTimes[originRegion] || destination.flightTimes.other;
        if (flightEffortScore >= 8) {
          whyItFits.push(`${flightLabel} flights keep this more realistic for a weekend trip.`);
        } else if (flightEffortScore < 0) {
          whyItFits.push('Flight time may feel long for a weekend unless you already travel nearby.');
        }
      }

      if (destination.trendMonths.includes(form.month)) {
        whyItFits.push(`${destination.name} is especially popular in ${form.month} right now.`);
      }

      return {
        ...destination,
        score,
        whyItFits,
        matchingInterests,
        keywordMatches: keywordMatch.matches,
        weatherLabel: getDiscoveryWeatherLabel(destination, form.month),
        trendLabel: getDiscoveryTrendLabel(destination, form.month),
        flightLabel: destination.flightTimes[originRegion] || destination.flightTimes.other,
        weatherFit: getDiscoveryWeatherFit(destination, form.month),
        budgetFit: getDiscoveryBudgetFit(destination, form.budget),
        flightFit: getDiscoveryFlightFit(destination, originRegion, form.durationDays),
        crowdRisk: getDiscoveryCrowdRisk(destination, form.month),
        tripFeeling: buildDiscoveryTripFeeling(destination, matchingInterests),
        risks: buildDiscoveryRisks(destination, form, originRegion),
        bestVersion: buildDiscoveryBestVersion(destination, form),
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 10);
}

function buildDiscoveryAiCandidatePool(form, ranked) {
  const parsedIntent = parseDiscoveryIntent(form.tripNotes || '');
  const selectedInterests = Array.from(new Set([...(form.interests || []), ...parsedIntent.inferredInterests]));

  if (selectedInterests.length === 0) {
    return ranked.slice(0, 14);
  }

  const filtered = ranked.filter((destination) => {
    const matchCount = selectedInterests.filter((interest) => destination.interests.includes(interest)).length;

    if (selectedInterests.length === 1) {
      return matchCount >= 1;
    }

    return matchCount >= Math.min(2, selectedInterests.length);
  });

  return (filtered.length >= 6 ? filtered : ranked).slice(0, 14);
}

function itemMatchesDiscoveryIntent(item, selectedInterests, candidateMap) {
  if (!Array.isArray(selectedInterests) || selectedInterests.length === 0) {
    return true;
  }

  const bestFor = Array.isArray(item.bestFor) ? item.bestFor.map((value) => String(value).toLowerCase()) : [];
  const candidateKey = `${String(item.name || '').toLowerCase()}|${String(item.parentDestination || '').toLowerCase()}|${String(item.country || '').toLowerCase()}`;
  const candidate = candidateMap.get(candidateKey);
  const candidateInterests = Array.isArray(candidate?.interests) ? candidate.interests : [];
  const matchingCount = selectedInterests.filter((interest) =>
    bestFor.includes(String(interest).toLowerCase()) || candidateInterests.includes(interest)
  ).length;

  if (selectedInterests.length === 1) {
    return matchingCount >= 1;
  }

  return matchingCount >= Math.min(2, selectedInterests.length);
}

// AI Auto-tagging for community stories
router.post('/generate-tags', async (req, res) => {
  try {
    const { title, content } = req.body
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content required' })
    }

    if (!AZURE_OPENAI_API_KEY) {
      console.warn('Azure OpenAI not configured, using fallback tags')
      return res.json({ tags: getFallbackTags(title, content) })
    }

    const prompt = `Analyze this travel story and suggest 2-4 relevant tags from these categories: Adventure, Food, Culture, Nature, Photography, Beach, Mountain, City, Nightlife, Shopping, History, Art, Wildlife, Festival, Local, Budget, Luxury, Solo, Family, Couple.

Title: ${title}
Content: ${content}

Return only a JSON array of tags: ["tag1", "tag2"]`

    const response = await fetch(
      `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=${AZURE_API_VERSION}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_OPENAI_API_KEY,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are a travel content expert. Always respond with valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 200,
          temperature: 0.3
        })
      }
    )
    
    if (!response.ok) {
      throw new Error(`Azure AI API failed: ${response.status}`)
    }

    const data = await response.json()
    const text = data.choices[0].message.content
    let tags = []
    
    try {
      const jsonMatch = text.match(/\[.*\]/)
      if (jsonMatch) {
        tags = JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      // Fallback: extract tags from text
      const availableTags = ['Adventure', 'Food', 'Culture', 'Nature', 'Photography', 'Beach', 'Mountain', 'City']
      tags = availableTags.filter(tag => 
        title.toLowerCase().includes(tag.toLowerCase()) || 
        content.toLowerCase().includes(tag.toLowerCase())
      ).slice(0, 3)
    }
    
    res.json({ tags: tags.slice(0, 4) })
  } catch (error) {
    console.error('AI tagging error:', error)
    res.json({ tags: getFallbackTags(req.body.title || '', req.body.content || '') })
  }
})

router.post('/discovery-recommendations', async (req, res) => {
  try {
    const form = normalizeDiscoveryRequest(req.body || {});

    if (!form.departure || !form.month || !form.budget || !form.duration || !form.travelerType || !form.durationDays || !form.budgetTotal) {
      return res.status(400).json({
        error: 'Origin, month, budget or budgetTotal, duration or durationDays, and travelerType are required.',
      });
    }

    const ranked = rankDiscoveryDestinations(form);
    const aiCandidates = buildDiscoveryAiCandidatePool(form, ranked);
    const parsedIntent = parseDiscoveryIntent(form.tripNotes || '');
    const selectedInterests = Array.from(new Set([...(form.interests || []), ...parsedIntent.inferredInterests]));
    const candidateMap = new Map(
      aiCandidates.map((candidate) => [
        `${String(candidate.name || '').toLowerCase()}|${String(candidate.parentDestination || '').toLowerCase()}|${String(candidate.country || '').toLowerCase()}`,
        candidate,
      ])
    );
    let recommendations = [];
    let usedAiGeneration = false;

    if (AZURE_OPENAI_API_KEY && AZURE_OPENAI_ENDPOINT && AZURE_OPENAI_DEPLOYMENT_NAME) {
      const prompt = `# TravelBuddy Destination Discovery Expert

You are TravelBuddy's Travel Intelligence Engine.

Your purpose is NOT to generate generic travel recommendations.

Your purpose is to help travelers make confident travel decisions by understanding their preferences, identifying the best destination matches, explaining tradeoffs, highlighting risks, and helping them avoid common travel mistakes.

You act like an experienced traveler who has personally visited hundreds of destinations and understands how different trips feel in real life.

## Core Principles

Always optimize for:
1. Traveler satisfaction
2. Realistic expectations
3. Budget suitability
4. Seasonal suitability
5. Trip enjoyment
6. Reduced travel stress
7. Avoiding poor travel decisions

Never optimize for popularity alone.
Never recommend a destination simply because it is famous.
If a destination is not a good fit, clearly explain why.
Avoid marketing language.
Avoid exaggerated claims.
Avoid generic travel blog style writing.
Be practical, honest, and traveler-focused.

## Traveler Profile
${JSON.stringify({
  travelerType: form.travelerType,
  origin: form.origin,
  budgetBand: form.budget,
  budgetTotal: form.budgetTotal,
  month: form.month,
  durationDays: form.durationDays,
  durationBand: form.duration,
  interests: selectedInterests,
  avoid: form.avoid,
  additionalPreferences: form.tripNotes || '',
}, null, 2)}

## Destination Context
You must reason ONLY from the candidate destination metadata below.
Do not invent facts.
Do not hallucinate costs, weather, visa rules, safety, crowds, or travel times.
Choose ONLY from these candidates:
${JSON.stringify(
  aiCandidates.map((candidate) => ({
    name: candidate.name,
    parentDestination: candidate.parentDestination,
    country: candidate.country,
    region: candidate.region,
    placeType: candidate.placeType,
    tagline: candidate.tagline,
    weatherLabel: candidate.weatherLabel,
    estimatedTripCost: candidate.costBands?.[form.budget] || '',
    flightLabel: candidate.flightLabel,
    visaLabel: candidate.visaLabel,
    bestFor: candidate.interests,
    supportPlaces: candidate.supportPlaces,
    trendLabel: candidate.trendLabel,
    caution: candidate.caution || '',
  })),
  null,
  2
)}

## Evaluation Framework
Evaluate each candidate using:
- Preference fit
- Seasonal fit
- Budget fit
- Travel complexity
- Emotional fit

If the traveler selected only one interest, that interest must dominate the ranking.
Example: if the traveler selected only "food", do not rank beach-first places highly unless the food identity is clearly the main reason to go.

## Output Requirements
Return ONLY valid JSON in this shape:
{
  "results": [
    {
      "name": "Exact area or neighborhood name",
      "parentDestination": "Main destination or broader base",
      "country": "Country",
      "region": "Sub-region",
      "placeType": "coast | district | beach town | town | mountain base | city quarter",
      "matchScore": 0,
      "tagline": "Short one-line description",
      "estimatedTripCost": "$1,200-$1,800",
      "weatherLabel": "Excellent season",
      "flightLabel": "4-8h",
      "visaLabel": "Short visa summary",
      "trendLabel": "Why it is timely now",
      "bestFor": ["food", "culture", "romantic"],
      "supportPlaces": ["nearby place 1", "nearby place 2", "nearby place 3"],
      "whyItFits": ["reason 1", "reason 2", "reason 3", "reason 4"],
      "tripPersonality": ["Relaxing", "Scenic"],
      "tripFeeling": ["relaxing", "scenic", "romantic"],
      "tripFeel": "A short realistic description of how the trip will feel.",
      "strengths": ["strength 1", "strength 2"],
      "drawbacks": ["drawback 1", "drawback 2"],
      "commonTravelerRegrets": ["regret 1", "regret 2"],
      "travelRisks": {
        "weather": "Low | Medium | High",
        "crowds": "Low | Medium | High",
        "budget": "Low | Medium | High",
        "planning": "Low | Medium | High"
      },
      "bestVersionOfThisTrip": "Recommend the best way to do this trip and why.",
      "whyNotAlternatives": "Explain briefly why lower-ranked alternatives lost.",
      "caution": "optional caution"
    }
  ]
}

Critical rules:
- Return exactly 10 results when enough strong candidates exist. Otherwise return only genuinely relevant candidates.
- Prefer area-level recommendations, not only broad destinations.
- Exclude weak-fit candidates even if they are famous.
- Match scores must reflect real fit and should not all be high.
- Your goal is to help the traveler decide whether this place is genuinely right for them.`;

      try {
        const response = await fetch(
          `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=${AZURE_API_VERSION}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-key': AZURE_OPENAI_API_KEY,
            },
            body: JSON.stringify({
              messages: [
                { role: 'system', content: 'You are a travel recommendation expert. Return valid JSON only.' },
                { role: 'user', content: prompt },
              ],
              max_tokens: 2600,
              temperature: 0.8,
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text = data?.choices?.[0]?.message?.content || '';
          const jsonMatch = text.match(/\{[\s\S]*\}/);

          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const aiResults = Array.isArray(parsed?.results) ? parsed.results.slice(0, 10) : [];
            const filteredResults = aiResults.filter((item) =>
              itemMatchesDiscoveryIntent(item, selectedInterests, candidateMap)
            );

            const topCandidateScore = aiCandidates[0]?.score || ranked[0]?.score || 100;

            recommendations = await Promise.all(
              (filteredResults.length > 0 ? filteredResults : aiResults).map(async (item, index) => {
                const candidateKey = `${String(item.name || '').toLowerCase()}|${String(item.parentDestination || '').toLowerCase()}|${String(item.country || '').toLowerCase()}`;
                const candidate = candidateMap.get(candidateKey);
                const imageResult = await resolveFreePlaceImage({
                  name: item.name,
                  city: item.name,
                  country: item.country,
                  category: Array.isArray(item.bestFor) && item.bestFor.length > 0 ? item.bestFor[0] : 'destination',
                });

                return {
                  id: `${String(item.name || 'destination').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index + 1}`,
                  destination: item.parentDestination
                    ? `${item.name}, ${item.parentDestination}`
                    : item.name,
                  name: item.name,
                  parentDestination: item.parentDestination || candidate?.parentDestination || item.region || item.country,
                  country: item.country,
                  region: item.region || 'Global',
                  placeType: item.placeType || candidate?.placeType || 'area',
                  image: candidate?.image || imageResult.image,
                  tagline: item.tagline,
                  matchScore: Number.isFinite(Number(item.matchScore))
                    ? Number(item.matchScore)
                    : normalizeDiscoveryMatchScore(candidate?.score || 100 - index, topCandidateScore),
                  score: Number.isFinite(Number(item.matchScore))
                    ? Number(item.matchScore)
                    : normalizeDiscoveryMatchScore(candidate?.score || 100 - index, topCandidateScore),
                  estimatedTripCost: item.estimatedTripCost || candidate?.costBands?.[form.budget],
                  weatherLabel: item.weatherLabel || candidate?.weatherLabel,
                  flightLabel: item.flightLabel || candidate?.flightLabel,
                  visaLabel: item.visaLabel || candidate?.visaLabel,
                  trendLabel: item.trendLabel || candidate?.trendLabel,
                  budgetFit: item.budgetFit || candidate?.budgetFit || getDiscoveryBudgetFit(candidate || {}, form.budget),
                  weatherFit: item.weatherFit || candidate?.weatherFit || getDiscoveryWeatherFit(candidate || {}, form.month),
                  flightFit: item.flightFit || candidate?.flightFit || getDiscoveryFlightFit(candidate || {}, classifyDiscoveryOriginRegion(form.departure), form.durationDays),
                  crowdRisk: item.crowdRisk || candidate?.crowdRisk || getDiscoveryCrowdRisk(candidate || {}, form.month),
                  bestFor: Array.isArray(item.bestFor) ? item.bestFor.slice(0, 4) : [],
                  supportPlaces: Array.isArray(item.supportPlaces) && item.supportPlaces.length > 0
                    ? item.supportPlaces.slice(0, 4)
                    : Array.isArray(candidate?.supportPlaces)
                      ? candidate.supportPlaces.slice(0, 4)
                      : [],
                  whyFits: Array.isArray(item.whyItFits) && item.whyItFits.length > 0
                    ? item.whyItFits.slice(0, 4)
                    : Array.isArray(item.strengths)
                      ? item.strengths.slice(0, 4)
                      : [],
                  whyItFits: Array.isArray(item.whyItFits) && item.whyItFits.length > 0
                    ? item.whyItFits.slice(0, 4)
                    : Array.isArray(item.strengths)
                      ? item.strengths.slice(0, 4)
                      : [],
                  tripFeeling: Array.isArray(item.tripFeeling) && item.tripFeeling.length > 0
                    ? item.tripFeeling.slice(0, 3)
                    : Array.isArray(item.tripPersonality)
                      ? item.tripPersonality.slice(0, 3).map((value) => String(value).toLowerCase())
                      : Array.isArray(candidate?.tripFeeling)
                        ? candidate.tripFeeling.slice(0, 3)
                        : [],
                  risks: Array.isArray(item.drawbacks) && item.drawbacks.length > 0
                    ? item.drawbacks.slice(0, 2)
                    : Array.isArray(item.commonTravelerRegrets) && item.commonTravelerRegrets.length > 0
                      ? item.commonTravelerRegrets.slice(0, 2)
                      : Array.isArray(candidate?.risks)
                        ? candidate.risks.slice(0, 3)
                        : [],
                  travelRisks: item.travelRisks || undefined,
                  bestVersion: item.bestVersionOfThisTrip || candidate?.bestVersion || buildDiscoveryBestVersion(candidate || item, form),
                  caution: item.caution || item.whyNotAlternatives || undefined,
                  planningPrompt: `${item.name}, ${item.parentDestination || item.region || item.country}, ${item.country} for a ${form.durationDays}-day ${form.travelerType} trip focused on ${(form.interests || []).join(', ') || 'balanced travel'}${form.tripNotes ? `. Notes: ${form.tripNotes}` : ''}`,
                };
              })
            );
            usedAiGeneration = recommendations.length > 0;
          }
        }
      } catch (error) {
        console.warn('AI discovery generation fallback engaged:', error.message);
      }
    }

    if (recommendations.length === 0) {
      const topScore = ranked[0]?.score || 100;

      recommendations = ranked.map((destination) => {
        const bestFor = [
          ...(destination.matchingInterests || []),
          ...destination.interests.filter((interest) => !(destination.matchingInterests || []).includes(interest)),
        ].slice(0, 4);

        return {
          id: destination.id,
          destination: `${destination.name}, ${destination.parentDestination}`,
          name: destination.name,
          parentDestination: destination.parentDestination || destination.country,
          country: destination.country,
          region: destination.region,
          placeType: destination.placeType || 'area',
          image: destination.image,
          tagline: destination.tagline,
          matchScore: normalizeDiscoveryMatchScore(destination.score, topScore),
          score: destination.score,
          estimatedTripCost: destination.costBands[form.budget],
          weatherLabel: destination.weatherLabel,
          flightLabel: destination.flightLabel,
          visaLabel: destination.visaLabel,
          trendLabel: destination.trendLabel,
          budgetFit: destination.budgetFit,
          weatherFit: destination.weatherFit,
          flightFit: destination.flightFit,
          crowdRisk: destination.crowdRisk,
          bestFor,
          supportPlaces: Array.isArray(destination.supportPlaces) ? destination.supportPlaces.slice(0, 4) : [],
          whyFits: destination.whyItFits,
          whyItFits: destination.whyItFits,
          tripFeeling: destination.tripFeeling,
          risks: destination.risks,
          bestVersion: destination.bestVersion,
          caution: destination.avoidMonths.includes(form.month)
            ? destination.caution || 'This month is less ideal there, so prices or weather may work against you.'
            : destination.caution,
          planningPrompt: `${destination.name}, ${destination.parentDestination || destination.country}, ${destination.country} for a ${form.durationDays}-day ${form.travelerType} trip focused on ${(form.interests || []).join(', ') || 'balanced travel'}${form.tripNotes ? `. Notes: ${form.tripNotes}` : ''}`,
        };
      });
    }

    res.json({
      recommendations,
      meta: {
        source: usedAiGeneration ? 'azure_openai_generated' : 'heuristic_fallback',
        count: recommendations.length,
        normalizedRequest: form,
      },
    });
  } catch (error) {
    console.error('AI discovery recommendations error:', error);
    res.status(500).json({ error: 'Failed to generate discovery recommendations.' });
  }
});

function getFallbackTags(title, content) {
  const availableTags = ['Adventure', 'Food', 'Culture', 'Nature', 'Photography', 'Beach', 'Mountain', 'City', 'Nightlife', 'Shopping', 'History', 'Art', 'Wildlife', 'Festival', 'Local', 'Budget', 'Luxury', 'Solo', 'Family', 'Couple']
  const text = (title + ' ' + content).toLowerCase()
  
  const matchedTags = availableTags.filter(tag => 
    text.includes(tag.toLowerCase()) || 
    text.includes(tag.toLowerCase().slice(0, -1))
  )
  
  if (matchedTags.length === 0) {
    return ['Travel', 'Adventure', 'Culture']
  }
  
  return matchedTags.slice(0, 4)
}

export default router;
