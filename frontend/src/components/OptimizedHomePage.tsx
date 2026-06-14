import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CloudSun,
  Compass,
  Footprints,
  Gauge,
  Globe2,
  Heart,
  Lightbulb,
  ListChecks,
  Map,
  MapPin,
  Minus,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  WandSparkles,
  X,
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
  { icon: Compass, title: 'Too many choices', text: "You want to travel, but don't know where to go." },
  { icon: WandSparkles, title: 'Generic AI plans', text: 'Nice-looking itineraries are not always realistic ones.' },
  { icon: AlertTriangle, title: 'Bad trip decisions', text: 'Wrong season, overloaded days, poor pacing, and budget surprises.' },
  { icon: ListChecks, title: 'Hard to know what to skip', text: 'Trying to do everything can make a good trip exhausting.' },
]

const productSteps = [
  {
    icon: Compass,
    number: '01',
    title: 'Discover',
    text: 'Find destinations based on your month, budget, travel style, and interests.',
    color: 'bg-sky-100 text-sky-700',
  },
  {
    icon: Gauge,
    number: '02',
    title: 'Decide',
    text: 'Compare trip fit, budget confidence, weather risk, and travel complexity.',
    color: 'bg-amber-100 text-amber-700',
  },
  {
    icon: Route,
    number: '03',
    title: 'Plan',
    text: 'Build a realistic itinerary with must-do, optional, and skip suggestions.',
    color: 'bg-emerald-100 text-emerald-700',
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
    image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&w=900&q=82',
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

const itinerary = [
  { day: 'Day 1', title: 'Arrival + Sacred City Sunset', energy: 'Easy', walking: 'Low', color: 'bg-emerald-100 text-emerald-700' },
  { day: 'Day 2', title: 'Ancient Kingdom Highlights', energy: 'Moderate', walking: 'Medium', color: 'bg-amber-100 text-amber-700' },
  { day: 'Day 3', title: 'Mihintale + Nature', energy: 'Balanced', walking: 'Medium', color: 'bg-sky-100 text-sky-700' },
  { day: 'Day 4', title: 'Slow Morning + Departure', energy: 'Easy', walking: 'Low', color: 'bg-emerald-100 text-emerald-700' },
]

const smartEdits = [
  { icon: CircleDollarSign, label: 'Make cheaper' },
  { icon: Footprints, label: 'Reduce walking' },
  { icon: Heart, label: 'Add romantic places' },
  { icon: Users, label: 'Avoid crowds' },
  { icon: MapPin, label: 'Add food stops' },
  { icon: Minus, label: 'Make Day 2 lighter' },
]

const trustSignals = [
  { icon: Banknote, label: 'Budget confidence' },
  { icon: CloudSun, label: 'Weather suitability' },
  { icon: Gauge, label: 'Pace comfort' },
  { icon: Lightbulb, label: 'Common regrets' },
  { icon: Route, label: 'Travel complexity' },
  { icon: ShieldCheck, label: 'Avoid preferences' },
]

const ScoreRing = ({ score, label, dark = false }: { score: number; label: string; dark?: boolean }) => (
  <div className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full bg-[conic-gradient(#22c55e_var(--score),rgba(148,163,184,0.2)_0)] p-2" style={{ '--score': `${score}%` } as React.CSSProperties}>
    <div className={`flex h-full w-full flex-col items-center justify-center rounded-full ${dark ? 'bg-[#101b2b]' : 'bg-white'}`}>
      <strong className={`font-heading text-3xl ${dark ? 'text-white' : 'text-slate-950'}`}>{score}%</strong>
      <span className={`mt-1 text-[10px] font-bold uppercase tracking-[0.16em] ${dark ? 'text-white/55' : 'text-slate-500'}`}>
        {label}
      </span>
    </div>
  </div>
)

export const OptimizedHomePage: React.FC = () => {
  const [heroDestination, setHeroDestination] = useState('')
  const [traveler, setTraveler] = useState('Couple')
  const [tripLength, setTripLength] = useState('4 days')
  const [activeEdit, setActiveEdit] = useState('Make Day 2 lighter')
  const heroDecisionHref = heroDestination.trim()
    ? `/trips?destination=${encodeURIComponent(heroDestination.trim())}&days=${tripLength.split(' ')[0]}&traveler=${traveler.toLowerCase()}&quick=true`
    : '/discovery'

  return (
    <div className="overflow-hidden bg-[#f7f7f3] text-slate-900">
      <SEOHead
        title="TravelBuddy | Find the Trip That Actually Fits You"
        description="Choose better trips, test realistic plans, and travel with confidence using destination match scores, reality checks, and practical itineraries."
        keywords="travel confidence, trip confidence score, destination match, realistic itinerary, trip reality checker, travel planning"
      />

      <section className="relative isolate min-h-[96vh] overflow-hidden bg-[#091321] text-white">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&w=2200&q=88"
            alt="Santorini cliffs and white architecture overlooking the Aegean Sea"
            className="h-full w-full object-cover"
            loading="eager"
          />
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
                <a href="#example-plan" className="inline-flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#ffad9c]">
                  See how certainty works
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            <div className="mx-auto mt-5 flex w-fit items-center gap-3 rounded-full border border-white/15 bg-slate-950/35 px-4 py-2 text-xs text-white/65 backdrop-blur-xl">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              <span><strong className="text-white">91% match</strong> example: Santorini for a 4-day couple escape</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40 sm:flex"
          >
            <span className="h-px w-10 bg-white/25" />
            Santorini, Greece
            <span className="h-px w-10 bg-white/25" />
          </motion.div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
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
                  <Card className="h-full border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,23,42,0.1)]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-heading mt-5 text-xl font-semibold">{problem.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-600">{problem.text}</p>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-20 lg:py-28">
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
                  <Card className="relative h-full overflow-hidden border-slate-200 p-7">
                    <span className="absolute right-6 top-4 font-heading text-6xl font-semibold text-slate-100">{step.number}</span>
                    <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl ${step.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="relative font-heading mt-7 text-3xl font-semibold">{step.title}</h3>
                    <p className="relative mt-3 text-base leading-8 text-slate-600">{step.text}</p>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="example-plan" className="relative overflow-hidden bg-[#0b1625] py-20 text-white lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(34,197,94,0.12),transparent_27%),radial-gradient(circle_at_90%_80%,rgba(249,115,22,0.14),transparent_25%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:px-8">
          <motion.div {...fadeUp}>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
              <BadgeCheck className="h-4 w-4" />
              Signature feature
            </span>
            <h2 className="font-heading mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">Know if your trip makes sense before you book.</h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/65">
              TravelBuddy checks pacing, budget fit, travel stress, weather concerns, and common mistakes.
            </p>
            <Link to="/trips" className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-orange-300">
              Test a trip
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <motion.div {...fadeUp} className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.25)] backdrop-blur sm:p-7">
            <div className="flex flex-col gap-7 sm:flex-row sm:items-center">
              <ScoreRing score={87} label="Confidence" dark />
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">Anuradhapura Couple Trip</p>
                <h3 className="font-heading mt-2 text-3xl font-semibold">Planning Confidence</h3>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    { icon: Check, label: 'Budget fit: Good', tone: 'text-emerald-300' },
                    { icon: Check, label: 'Pace: Relaxed', tone: 'text-emerald-300' },
                    { icon: Check, label: 'Logistics: Easy', tone: 'text-emerald-300' },
                    { icon: AlertTriangle, label: 'Heat risk: Medium', tone: 'text-amber-300' },
                    { icon: AlertTriangle, label: 'Day 2 may feel busy', tone: 'text-amber-300' },
                  ].map((signal) => {
                    const Icon = signal.icon
                    return (
                      <div key={signal.label} className="flex items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-3 text-sm text-white/78">
                        <Icon className={`h-4 w-4 ${signal.tone}`} />
                        {signal.label}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
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

      <section className="border-y border-slate-200 bg-white py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:items-center lg:px-8">
          <motion.div {...fadeUp}>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-600">Trip Reality Checker</p>
            <h2 className="font-heading mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">AI plans are easy. Realistic plans are harder.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              TravelBuddy checks if your itinerary is too packed, poorly timed, expensive, or stressful before you follow it.
            </p>
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

      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700">Smart itinerary</p>
            <h2 className="font-heading mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">A plan you can actually follow.</h2>
            <p className="mt-5 text-lg text-slate-600">Clear days, realistic energy, and no walls of AI-generated text.</p>
          </motion.div>
          <div className="relative mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <div className="absolute left-[12%] right-[12%] top-8 hidden h-px bg-slate-200 lg:block" />
            {itinerary.map((day, index) => (
              <motion.div key={day.day} {...fadeUp} transition={{ duration: 0.45, delay: index * 0.07 }} className="relative">
                <Card className="h-full border-slate-200 p-6">
                  <div className="flex items-center justify-between">
                    <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">{index + 1}</span>
                    <Clock3 className="h-5 w-5 text-slate-400" />
                  </div>
                  <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{day.day}</p>
                  <h3 className="font-heading mt-2 min-h-16 text-xl font-semibold leading-7">{day.title}</h3>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${day.color}`}>Energy: {day.energy}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">Walking: {day.walking}</span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#eef3ee] py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">Practical priorities</p>
            <h2 className="font-heading mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Know what matters, and what doesn&apos;t.</h2>
          </motion.div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {[
              { title: 'Must Do', tone: 'border-emerald-200 bg-white', icon: BadgeCheck, iconTone: 'bg-emerald-100 text-emerald-700', items: ['Ruwanwelisaya', 'Sri Maha Bodhi', 'Mihintale'] },
              { title: 'Optional', tone: 'border-sky-200 bg-white', icon: Sparkles, iconTone: 'bg-sky-100 text-sky-700', items: ['Twin Ponds', 'Archaeology Museum'] },
              { title: 'Skip if tired', tone: 'border-amber-200 bg-white', icon: X, iconTone: 'bg-amber-100 text-amber-700', items: ['Remote ruins far from your route'] },
            ].map((group, index) => {
              const Icon = group.icon
              return (
                <motion.div key={group.title} {...fadeUp} transition={{ duration: 0.45, delay: index * 0.07 }}>
                  <Card className={`h-full border-2 p-6 ${group.tone}`}>
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${group.iconTone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-heading mt-5 text-2xl font-semibold">{group.title}</h3>
                    <div className="mt-5 space-y-3">
                      {group.items.map((item) => (
                        <div key={item} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                          <Check className="h-4 w-4 text-slate-400" />
                          {item}
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-8">
          <motion.div {...fadeUp}>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-600">Smart edits</p>
            <h2 className="font-heading mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Change the plan without starting over.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">No need to regenerate the whole trip. Adjust only what you want.</p>
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

      <section className="border-t border-slate-200 bg-[#f7f7f3] py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">Built for honest decisions</p>
            <h2 className="font-heading mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">We don&apos;t pretend every trip is perfect.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              TravelBuddy shows tradeoffs, risks, and common mistakes so you can make better travel decisions.
            </p>
          </motion.div>
          <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trustSignals.map((signal, index) => {
              const Icon = signal.icon
              return (
                <motion.div key={signal.label} {...fadeUp} transition={{ duration: 0.4, delay: index * 0.05 }} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">{signal.label}</span>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0a1524] py-20 text-white lg:py-28">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80"
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
