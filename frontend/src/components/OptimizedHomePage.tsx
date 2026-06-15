import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Compass,
  Footprints,
  Gauge,
  Globe2,
  Heart,
  ListChecks,
  Map,
  MapPin,
  Minus,
  Pause,
  Play,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  WandSparkles,
} from 'lucide-react'
import { Button } from './Button'
import { Card, CardContent } from './Card'
import { SEOHead } from './SEOHead'
import { ImageWithFallback } from './ImageWithFallback'

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5 },
}

const problems = [
  {
    icon: Compass,
    title: 'Too many choices',
    text: "You want to travel, but don't know where to go.",
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=82',
    alt: 'Traveler looking across a wide mountain landscape full of possible routes',
    label: 'Where next?',
  },
  {
    icon: WandSparkles,
    title: 'Generic AI plans',
    text: 'Nice-looking itineraries are not always realistic ones.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=900&q=82',
    alt: 'Travel map and planning essentials arranged for building an itinerary',
    label: 'Plan vs reality',
  },
  {
    icon: AlertTriangle,
    title: 'Bad trip decisions',
    text: 'Wrong season, overloaded days, poor pacing, and budget surprises.',
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=900&q=82',
    alt: 'Traveler facing difficult terrain and changing mountain weather',
    label: 'Hidden tradeoffs',
  },
  {
    icon: ListChecks,
    title: 'Hard to know what to skip',
    text: 'Trying to do everything can make a good trip exhausting.',
    image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=900&q=82',
    alt: 'Travelers exploring a destination together during a busy sightseeing day',
    label: 'Too much to do',
  },
]

const productSteps = [
  {
    icon: Compass,
    number: '01',
    title: 'Discover',
    text: 'Find destinations based on your month, budget, travel style, and interests.',
    color: 'bg-sky-100 text-sky-700',
    image: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?auto=format&fit=crop&w=1200&q=82',
    alt: 'Traveler exploring a scenic destination with a backpack',
    imageLabel: 'Explore possibilities',
  },
  {
    icon: Gauge,
    number: '02',
    title: 'Decide',
    text: 'Compare trip fit, budget confidence, weather risk, and travel complexity.',
    color: 'bg-amber-100 text-amber-700',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=82',
    alt: 'Travelers comparing plans and making a decision together',
    imageLabel: 'Compare with confidence',
  },
  {
    icon: Route,
    number: '03',
    title: 'Plan',
    text: 'Build a realistic itinerary with must-do, optional, and skip suggestions.',
    color: 'bg-emerald-100 text-emerald-700',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=82',
    alt: 'Traveler reviewing an itinerary while waiting for a journey',
    imageLabel: 'Shape the journey',
  },
]

const recommendations = [
  {
    rank: 1,
    name: 'Bali',
    country: 'Indonesia',
    score: 94,
    fit: 'Romantic food, beaches, and relaxed pacing',
    month: 'Great in July',
    budget: 'Good value',
    risk: 'Popular areas get busy',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=82',
  },
  {
    rank: 2,
    name: 'Santorini',
    country: 'Greece',
    score: 88,
    fit: 'Beautiful sunsets and couple-friendly stays',
    month: 'Excellent weather',
    budget: 'Premium',
    risk: 'Crowds at sunset',
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=900&q=82',
  },
  {
    rank: 3,
    name: 'Maldives',
    country: 'Maldives',
    score: 84,
    fit: 'Private, peaceful, and strongly romantic',
    month: 'Mixed showers',
    budget: 'High',
    risk: 'Weather variability',
    image: 'https://images.unsplash.com/photo-1573843981267-be1999ff37cd?auto=format&fit=crop&w=900&q=82',
  },
]

const heroDestinations = [
  {
    category: 'Beach Escape',
    name: 'Maldives',
    country: 'Indian Ocean',
    description: 'Clear lagoons, soft sand, and slow days beside the water.',
    match: 94,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2200&q=88',
    alt: 'White sand tropical beach beside clear turquoise water',
  },
  {
    category: 'Mountain Journey',
    name: 'Swiss Alps',
    country: 'Switzerland',
    description: 'High peaks, alpine villages, and unforgettable scenic routes.',
    match: 93,
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2200&q=88',
    alt: 'Dramatic mountain peaks and alpine landscape in Switzerland',
  },
  {
    category: 'Luxury Stay',
    name: 'Private Island Resort',
    country: 'Maldives',
    description: 'Overwater suites, private pools, and polished island comfort.',
    match: 91,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2200&q=88',
    alt: 'Luxury tropical resort hotel with a pool and palm trees',
  },
  {
    category: 'Street Food',
    name: 'Bangkok',
    country: 'Thailand',
    description: 'Night markets, sizzling local dishes, and streets full of flavor.',
    match: 90,
    image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&w=2200&q=88',
    alt: 'Colorful Asian street food served at a busy local market',
  },
  {
    category: 'Iconic Destination',
    name: 'Santorini',
    country: 'Greece',
    description: 'Clifftop villages, Aegean views, and golden-hour escapes.',
    match: 92,
    image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&w=2200&q=88',
    alt: 'Santorini cliffs and white architecture overlooking the Aegean Sea',
  },
  {
    category: 'City Discovery',
    name: 'Paris',
    country: 'France',
    description: 'Neighborhood cafés, timeless landmarks, and unhurried evenings.',
    match: 89,
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=2200&q=88',
    alt: 'The Eiffel Tower and Paris skyline in warm evening light',
  },
  {
    category: 'Nature Adventure',
    name: 'Patagonia',
    country: 'Chile',
    description: 'Glacier trails, wild landscapes, and journeys beyond the ordinary.',
    match: 95,
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=2200&q=88',
    alt: 'Hiker exploring a dramatic mountain landscape in Patagonia',
  },
]

const itinerary = [
  {
    day: 'Day 1',
    title: 'Arrival + Sacred City Sunset',
    energy: 'Easy',
    walking: 'Low',
    color: 'bg-emerald-100 text-emerald-700',
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=82',
    alt: 'Warm sunset across a peaceful travel landscape',
  },
  {
    day: 'Day 2',
    title: 'Ancient Kingdom Highlights',
    energy: 'Moderate',
    walking: 'Medium',
    color: 'bg-amber-100 text-amber-700',
    image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=900&q=82',
    alt: 'Historic temple architecture visited during a cultural journey',
  },
  {
    day: 'Day 3',
    title: 'Mihintale + Nature',
    energy: 'Balanced',
    walking: 'Medium',
    color: 'bg-sky-100 text-sky-700',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=82',
    alt: 'Sunlight passing through a lush green forest during a nature excursion',
  },
  {
    day: 'Day 4',
    title: 'Slow Morning + Departure',
    energy: 'Easy',
    walking: 'Low',
    color: 'bg-emerald-100 text-emerald-700',
    image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=82',
    alt: 'Calm lakeside mountain view for a relaxed final travel morning',
  },
]

const smartEdits = [
  { icon: CircleDollarSign, label: 'Make cheaper' },
  { icon: Footprints, label: 'Reduce walking' },
  { icon: Heart, label: 'Add romantic places' },
  { icon: Users, label: 'Avoid crowds' },
  { icon: MapPin, label: 'Add food stops' },
  { icon: Minus, label: 'Make Day 2 lighter' },
]

export const OptimizedHomePage: React.FC = () => {
  const [heroDestination, setHeroDestination] = useState('')
  const [activeHeroSlide, setActiveHeroSlide] = useState(0)
  const [isHeroPaused, setIsHeroPaused] = useState(false)
  const [traveler, setTraveler] = useState('Couple')
  const [tripLength, setTripLength] = useState('4 days')
  const [activeEdit, setActiveEdit] = useState('Make Day 2 lighter')
  const currentHeroDestination = heroDestinations[activeHeroSlide]
  const heroDecisionHref = heroDestination.trim()
    ? `/trips?destination=${encodeURIComponent(heroDestination.trim())}&days=${tripLength.split(' ')[0]}&traveler=${traveler.toLowerCase()}&quick=true`
    : '/discovery'

  useEffect(() => {
    if (isHeroPaused) return

    const intervalId = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % heroDestinations.length)
    }, 3500)

    return () => window.clearInterval(intervalId)
  }, [isHeroPaused])

  const showPreviousHeroSlide = () => {
    setActiveHeroSlide((current) => (current - 1 + heroDestinations.length) % heroDestinations.length)
  }

  const showNextHeroSlide = () => {
    setActiveHeroSlide((current) => (current + 1) % heroDestinations.length)
  }

  return (
    <div className="overflow-hidden bg-[#f7f7f3] text-slate-900">
      <SEOHead
        title="TravelBuddy | Find the Trip That Actually Fits You"
        description="Choose better trips, test realistic plans, and travel with confidence using destination match scores, reality checks, and practical itineraries."
        keywords="travel confidence, trip confidence score, destination match, realistic itinerary, trip reality checker, travel planning"
      />

      <section
        className="relative isolate min-h-[96vh] overflow-hidden bg-[#091321] text-white"
        aria-roledescription="carousel"
        aria-label="Featured travel destinations"
      >
        <div className="absolute inset-0">
          <AnimatePresence mode="sync">
            <motion.div
              key={currentHeroDestination.name}
              initial={{ opacity: 0, scale: 1.035 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ opacity: { duration: 0.45 }, scale: { duration: 3.8, ease: 'linear' } }}
              className="absolute inset-0"
            >
              <ImageWithFallback
                src={currentHeroDestination.image}
                alt={currentHeroDestination.alt}
                className="h-full w-full object-cover"
                loading={activeHeroSlide === 0 ? 'eager' : 'lazy'}
              />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,12,24,0.48)_0%,rgba(4,13,27,0.57)_45%,rgba(4,13,27,0.9)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.1),transparent_30%),radial-gradient(circle_at_80%_15%,rgba(244,114,93,0.24),transparent_24%)]" />
        </div>

        <div className="relative mx-auto flex min-h-[96vh] max-w-7xl flex-col items-center justify-center px-4 pb-16 pt-32 text-center sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-5xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80 backdrop-blur-xl sm:text-xs">
              <Globe2 className="h-4 w-4 text-[#ff9a86]" />
              Global Decision Intelligence
            </span>
            <h1 className="font-luxury mt-7 text-6xl font-medium leading-[0.88] tracking-[-0.045em] text-white sm:text-7xl lg:text-[7.5rem]">
              The World,
              <span className="block italic text-[#ffad9c]">Decided.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-white/78 sm:text-lg">
              Move from endless possibilities to one confident decision. TravelBuddy tests destination fit, timing, budget, and pace before you commit.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.16 }}
            className="mt-10 w-full max-w-5xl"
          >
            <div className="rounded-[2rem] border border-white/20 bg-white/[0.12] p-3 shadow-[0_32px_90px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-4">
              <div className="grid gap-3 rounded-[1.45rem] border border-white/10 bg-slate-950/30 p-3 md:grid-cols-[1.65fr_0.7fr_0.7fr_auto]">
                <label className="relative flex min-h-16 items-center rounded-xl border border-white/10 bg-white/[0.11]">
                  <Search className="pointer-events-none absolute left-4 h-5 w-5 text-[#ffad9c]" />
                  <span className="sr-only">Destination or trip idea</span>
                  <input
                    type="text"
                    value={heroDestination}
                    onChange={(event) => setHeroDestination(event.target.value)}
                    placeholder="Where are you considering?"
                    className="h-full w-full bg-transparent py-3 pl-12 pr-4 text-sm font-semibold text-white outline-none placeholder:text-white/45"
                  />
                </label>
                <label className="flex min-h-16 flex-col justify-center rounded-xl border border-white/10 bg-white/[0.11] px-4 text-left">
                  <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">Traveling as</span>
                  <select
                    value={traveler}
                    onChange={(event) => setTraveler(event.target.value)}
                    className="mt-1 bg-transparent text-sm font-semibold text-white outline-none"
                  >
                    {['Solo', 'Couple', 'Family', 'Friends'].map((item) => (
                      <option key={item} value={item} className="bg-slate-900">{item}</option>
                    ))}
                  </select>
                </label>
                <label className="flex min-h-16 flex-col justify-center rounded-xl border border-white/10 bg-white/[0.11] px-4 text-left">
                  <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/40">Trip length</span>
                  <select
                    value={tripLength}
                    onChange={(event) => setTripLength(event.target.value)}
                    className="mt-1 bg-transparent text-sm font-semibold text-white outline-none"
                  >
                    {['3 days', '4 days', '7 days', '10 days'].map((item) => (
                      <option key={item} value={item} className="bg-slate-900">{item}</option>
                    ))}
                  </select>
                </label>
                <Link to={heroDecisionHref} className="flex">
                  <Button className="min-h-16 w-full rounded-xl bg-[linear-gradient(135deg,#f47f6b,#ff9b85)] px-6 text-white shadow-[0_16px_36px_rgba(244,127,107,0.32)] hover:brightness-105">
                    Decide My Trip
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="flex flex-col gap-4 px-3 pb-2 pt-5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-semibold text-white/62 sm:justify-start">
                  {['Destination fit', 'Budget confidence', 'Reality warnings'].map((item) => (
                    <span key={item} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-300" />
                      {item}
                    </span>
                  ))}
                </div>
                <a href="#reality-checker" className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#ffad9c]">
                  See how certainty works
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            <div className="mx-auto mt-5 flex w-fit items-center gap-3 rounded-full border border-white/15 bg-slate-950/35 px-4 py-2 text-xs text-white/65 backdrop-blur-xl">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              <span>
                <strong className="text-white">{currentHeroDestination.match}% match</strong>
                {' '}{currentHeroDestination.category.toLowerCase()} inspiration in {currentHeroDestination.name}
              </span>
            </div>
          </motion.div>

          <div className="absolute bottom-4 left-1/2 flex w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 items-center justify-between gap-3 rounded-2xl border border-white/15 bg-slate-950/35 px-3 py-2.5 backdrop-blur-xl sm:bottom-5 sm:px-4">
            <div className="min-w-0 text-left" aria-live="polite">
              <p className="truncate text-[9px] font-bold uppercase tracking-[0.2em] text-[#ffad9c] sm:text-[10px]">
                {currentHeroDestination.category}
              </p>
              <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-[0.2em] text-white/85 sm:text-xs">
                {currentHeroDestination.name}, {currentHeroDestination.country}
              </p>
              <p className="mt-0.5 hidden truncate text-xs text-white/50 sm:block">
                {currentHeroDestination.description}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={showPreviousHeroSlide}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Show previous destination"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="hidden items-center gap-1.5 md:flex" aria-label="Choose featured destination">
                {heroDestinations.map((destination, index) => (
                  <button
                    key={destination.name}
                    type="button"
                    onClick={() => setActiveHeroSlide(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === activeHeroSlide ? 'w-7 bg-[#ffad9c]' : 'w-2 bg-white/35 hover:bg-white/60'
                    }`}
                    aria-label={`Show ${destination.name}, ${destination.country}`}
                    aria-current={index === activeHeroSlide ? 'true' : undefined}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsHeroPaused((current) => !current)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                aria-label={isHeroPaused ? 'Resume destination slider' : 'Pause destination slider'}
              >
                {isHeroPaused ? <Play className="h-3.5 w-3.5 fill-current" /> : <Pause className="h-3.5 w-3.5 fill-current" />}
              </button>

              <button
                type="button"
                onClick={showNextHeroSlide}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Show next destination"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-600">The real problem</p>
            <h2 className="font-heading mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Travel planning is full of uncertainty.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">A beautiful itinerary is not useful if it is the wrong trip for you.</p>
          </motion.div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {problems.map((problem, index) => {
              const Icon = problem.icon
              return (
                <motion.div key={problem.title} {...fadeUp} transition={{ duration: 0.45, delay: index * 0.06 }}>
                  <Card className="group h-full overflow-hidden border-slate-200 bg-white transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_26px_60px_rgba(15,23,42,0.14)]">
                    <div className="relative h-44 overflow-hidden">
                      <ImageWithFallback
                        src={problem.image}
                        alt={problem.alt}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent" />
                      <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/25 bg-slate-950/35 text-white shadow-lg backdrop-blur-md">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="absolute bottom-4 left-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/75">
                        {problem.label}
                      </p>
                    </div>
                    <div className="p-6">
                      <h3 className="font-heading text-xl font-semibold">{problem.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{problem.text}</p>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700">How it works</p>
            <h2 className="font-heading mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Decide, plan, and travel smarter.</h2>
          </motion.div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {productSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <motion.div key={step.title} {...fadeUp} transition={{ duration: 0.45, delay: index * 0.08 }}>
                  <Card className="group relative h-full overflow-hidden border-slate-200 bg-white transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_26px_60px_rgba(15,23,42,0.14)]">
                    <div className="relative h-52 overflow-hidden">
                      <ImageWithFallback
                        src={step.image}
                        alt={step.alt}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                      <span className="absolute right-5 top-3 font-heading text-6xl font-semibold text-white/40">{step.number}</span>
                      <div className={`absolute bottom-4 left-4 flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg ${step.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="absolute bottom-5 left-20 text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
                        {step.imageLabel}
                      </p>
                    </div>
                    <div className="p-7">
                      <h3 className="font-heading text-3xl font-semibold">{step.title}</h3>
                      <p className="mt-3 text-base leading-8 text-slate-600">{step.text}</p>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-600">Destination discovery</p>
              <h2 className="font-heading mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Don&apos;t know where to go? Start here.</h2>
            </div>
            <Link to="/discovery" className="inline-flex items-center gap-2 text-sm font-bold text-slate-800">
              Open discovery
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <div className="mt-12 grid gap-7 lg:grid-cols-[0.72fr_1.28fr]">
            <motion.div {...fadeUp}>
              <Card className="h-full border-slate-200 bg-[#fffaf3] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">Your answers</p>
                    <h3 className="font-heading mt-2 text-2xl font-semibold">A few details. Better matches.</h3>
                  </div>
                  <span className="rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-500 shadow-sm">4 / 4</span>
                </div>
                <div className="mt-7 space-y-4">
                  {[
                    { question: 'When are you traveling?', answer: 'July', icon: CalendarDays },
                    { question: 'Who is traveling?', answer: 'Couple', icon: Users },
                    { question: 'What are you into?', answer: 'Beach, Food, Romantic', icon: Heart },
                    { question: 'What do you want to avoid?', answer: 'Crowds, Long travel days', icon: ShieldCheck },
                  ].map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.question} className="rounded-2xl border border-orange-100 bg-white p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500">{item.question}</p>
                            <p className="mt-1 text-sm font-bold text-slate-900">{item.answer}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </motion.div>

            <div className="grid gap-5 md:grid-cols-3">
              {recommendations.map((destination, index) => (
                <motion.div key={destination.name} {...fadeUp} transition={{ duration: 0.45, delay: index * 0.07 }}>
                  <Card className="group h-full overflow-hidden border-slate-200 bg-white">
                    <div className="relative h-52 overflow-hidden">
                      <ImageWithFallback src={destination.image} alt={destination.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-900 backdrop-blur">#{destination.rank}</span>
                      <span className="absolute right-4 top-4 rounded-full bg-emerald-400 px-3 py-1 text-sm font-extrabold text-emerald-950">{destination.score}% Match</span>
                      <div className="absolute bottom-4 left-4 text-white">
                        <h3 className="font-heading text-3xl font-semibold">{destination.name}</h3>
                        <p className="text-xs uppercase tracking-[0.16em] text-white/65">{destination.country}</p>
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <p className="min-h-12 text-sm font-semibold leading-6 text-slate-800">{destination.fit}</p>
                      <div className="mt-4 space-y-2 text-xs text-slate-600">
                        <p className="flex items-center gap-2"><Sun className="h-4 w-4 text-amber-500" />{destination.month}</p>
                        <p className="flex items-center gap-2"><Banknote className="h-4 w-4 text-emerald-600" />{destination.budget}</p>
                        <p className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-500" />{destination.risk}</p>
                      </div>
                      <Link to={`/trips?destination=${encodeURIComponent(destination.name)}&quick=true`} className="mt-5 flex items-center justify-between rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">
                        Plan this trip
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="reality-checker" className="scroll-mt-24 border-y border-slate-200 bg-white py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:px-8">
          <motion.div {...fadeUp}>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-600">Trip Reality Checker</p>
            <h2 className="font-heading mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">AI plans are easy. Realistic plans are harder.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              TravelBuddy checks if your itinerary is too packed, poorly timed, expensive, or stressful before you follow it.
            </p>
            <div className="group relative mt-8 overflow-hidden rounded-[2rem] shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&w=1400&q=84"
                alt="Traveler reviewing a route and checking trip details before continuing"
                className="h-64 w-full object-cover transition duration-700 group-hover:scale-105 sm:h-72"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300">Before you follow the route</p>
                  <p className="mt-1 max-w-sm text-sm font-semibold leading-6 text-white sm:text-base">
                    Check timing, travel effort, and what the day will actually feel like.
                  </p>
                </div>
                <div className="hidden shrink-0 items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-2 text-xs font-bold text-white backdrop-blur-md sm:flex">
                  <Check className="h-4 w-4 text-emerald-300" />
                  Reality checked
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div {...fadeUp} className="relative">
            <div className="absolute -inset-5 rounded-[2.5rem] bg-orange-100/70 blur-2xl" />
            <Card className="relative border-orange-100 bg-[#fffaf5] p-6 shadow-[0_26px_65px_rgba(15,23,42,0.1)] sm:p-8">
              <div className="flex items-center justify-between border-b border-orange-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">Reality check</p>
                    <h3 className="font-heading text-xl font-semibold">Day 2 needs attention</h3>
                  </div>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">2 warnings</span>
              </div>
              <div className="mt-6 grid gap-3">
                {[
                  { type: 'warning', text: 'Day 2 has too many temple visits' },
                  { type: 'warning', text: 'Avoid ruins between 12 PM - 3 PM' },
                  { type: 'better', text: 'Better: move one stop to Day 3' },
                  { type: 'better', text: 'Add rest time after lunch' },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3 rounded-2xl border border-white bg-white p-4 shadow-sm">
                    {item.type === 'warning' ? (
                      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                    ) : (
                      <Check className="h-5 w-5 shrink-0 text-emerald-600" />
                    )}
                    <p className="text-sm font-semibold text-slate-700">{item.text}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700">Smart itinerary</p>
            <h2 className="font-heading mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">A plan you can actually follow.</h2>
            <p className="mt-5 text-lg text-slate-600">Clear days, realistic energy, and no walls of AI-generated text.</p>
          </motion.div>
          <div className="relative mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {itinerary.map((day, index) => (
              <motion.div key={day.day} {...fadeUp} transition={{ duration: 0.45, delay: index * 0.07 }} className="relative">
                <Card className="group h-full overflow-hidden border-slate-200 bg-white transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_26px_60px_rgba(15,23,42,0.14)]">
                  <div className="relative h-44 overflow-hidden">
                    <ImageWithFallback
                      src={day.image}
                      alt={day.alt}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                    <span className="absolute left-4 top-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-slate-950/60 text-sm font-bold text-white backdrop-blur-md">
                      {index + 1}
                    </span>
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
                      <Clock3 className="h-4 w-4 text-sky-200" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em]">{day.day}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-heading min-h-16 text-xl font-semibold leading-7">{day.title}</h3>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${day.color}`}>Energy: {day.energy}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">Walking: {day.walking}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-8">
          <motion.div {...fadeUp}>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-600">Smart edits</p>
            <h2 className="font-heading mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Change the plan without starting over.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">No need to regenerate the whole trip. Adjust only what you want.</p>
            <div className="group relative mt-8 overflow-hidden rounded-[2rem] shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1300&q=84"
                alt="Travel map with route markers used to adjust an itinerary"
                className="h-64 w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-300">Refine, don&apos;t restart</p>
                <p className="mt-1 max-w-sm text-sm font-semibold leading-6 text-white">
                  Keep the route you like and change only the parts that need attention.
                </p>
              </div>
            </div>
          </motion.div>
          <motion.div {...fadeUp}>
            <Card className="border-slate-200 bg-slate-50 p-5 sm:p-7">
              <div className="grid gap-3 sm:grid-cols-2">
                {smartEdits.map((edit) => {
                  const Icon = edit.icon
                  const isActive = activeEdit === edit.label
                  return (
                    <button
                      key={edit.label}
                      type="button"
                      onClick={() => setActiveEdit(edit.label)}
                      className={`flex items-center justify-between rounded-2xl border p-4 text-left transition ${
                        isActive ? 'border-orange-300 bg-orange-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="flex items-center gap-3 text-sm font-bold text-slate-800">
                        <Icon className={`h-5 w-5 ${isActive ? 'text-orange-600' : 'text-slate-400'}`} />
                        {edit.label}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </button>
                  )
                })}
              </div>
              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-950 p-4 text-white">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-white/45">Preview change</p>
                  <p className="mt-1 text-sm font-semibold">{activeEdit}: your itinerary keeps the rest of the plan intact.</p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0a1524] py-16 text-white lg:py-20">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1800&q=80"
            alt=""
            className="h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.2),transparent_35%),linear-gradient(90deg,rgba(8,18,32,0.96),rgba(8,18,32,0.78))]" />
        </div>
        <motion.div {...fadeUp} className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Map className="mx-auto h-10 w-10 text-orange-300" />
          <h2 className="font-heading mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">Ready to find your next trip?</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/68">
            Answer a few simple questions and get destinations that actually fit you.
          </p>
          <Link to="/discovery" className="mt-9 inline-block">
            <Button size="lg" className="rounded-full bg-[linear-gradient(135deg,#f97316,#fb923c)] px-8 text-white shadow-[0_18px_44px_rgba(249,115,22,0.28)]">
              Find My Next Trip
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-white/38">Choose better trips. Avoid bad plans. Travel with confidence.</p>
        </motion.div>
      </section>
    </div>
  )
}
