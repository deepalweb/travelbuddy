import React, { Suspense, lazy, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Brain,
  Compass,
  Heart,
  MapPinned,
  MessageSquareText,
  Route,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './Button'
import { Card, CardContent } from './Card'
import { SEOHead } from './SEOHead'
import { ImageWithFallback } from './ImageWithFallback'
import { HeroSection, getCommunityStories, homePageAnimationStyles } from './home'

const DestinationVibes = lazy(() =>
  import('./home/DestinationVibes').then((module) => ({ default: module.DestinationVibes }))
)
const MobileAppShowcase = lazy(() =>
  import('./home/MobileAppShowcase').then((module) => ({ default: module.MobileAppShowcase }))
)
const FAQAccordion = lazy(() =>
  import('./home/FAQAccordion').then((module) => ({ default: module.FAQAccordion }))
)
const AIAssistantBubble = lazy(() =>
  import('./home/AIAssistantBubble').then((module) => ({ default: module.AIAssistantBubble }))
)

const planningSteps = [
  {
    icon: Compass,
    title: 'Start with a destination or a vibe',
    description:
      'Begin with a city, a beach mood, a quick weekend, or a wishlist of places you want to fit into one trip.',
  },
  {
    icon: Brain,
    title: 'Shape it with AI and your preferences',
    description:
      'Adjust pace, budget, trip length, and priorities so the plan feels like yours instead of a generic list.',
  },
  {
    icon: Route,
    title: 'Turn ideas into a usable itinerary',
    description:
      'Save favorites, compare options, and keep your next steps in one place while the trip comes together.',
  },
]

const platformHighlights = [
  {
    icon: MapPinned,
    title: 'Discovery that leads somewhere',
    description:
      'Browse destinations, nearby places, and categories without losing track of what you actually want to do next.',
  },
  {
    icon: MessageSquareText,
    title: 'AI help when you are stuck',
    description:
      'Use the assistant for ideas, timing questions, and rough trip structure when planning momentum drops.',
  },
  {
    icon: Heart,
    title: 'Save the places worth revisiting',
    description:
      'Keep favorites handy so a good find does not disappear the moment you move to the next tab.',
  },
  {
    icon: ShieldCheck,
    title: 'Clearer expectations',
    description:
      'We focus the page on what the product can help with today instead of burying the useful parts under hype.',
  },
]

const travelerModes = [
  {
    title: 'Weekend planners',
    description: 'Build a short, realistic itinerary without overplanning every hour.',
  },
  {
    title: 'Flexible explorers',
    description: 'Collect options first, then narrow them down as your trip becomes clearer.',
  },
  {
    title: 'Group coordinators',
    description: 'Keep one shared direction when friends have different budgets, energy levels, and interests.',
  },
]

const planCards = [
  {
    title: 'Explorer',
    price: 'Free',
    summary: 'A lightweight way to discover places and start building trips.',
    cta: 'Start Free',
    link: '/register',
    accent: 'from-slate-700 to-slate-900',
  },
  {
    title: 'Globetrotter',
    price: '$9.99/mo',
    summary: 'More AI planning depth, community participation, and travel tools for frequent planning.',
    cta: 'See Plans',
    link: '/subscription',
    accent: 'from-sky-500 to-blue-700',
  },
  {
    title: 'WanderPro+',
    price: '$19.99/mo',
    summary: 'For travelers who want advanced AI help, exports, and richer offline support.',
    cta: 'Compare Features',
    link: '/subscription',
    accent: 'from-fuchsia-500 to-violet-700',
  },
]

const SectionShell: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`mx-auto w-full max-w-7xl animate-pulse px-4 ${className}`}>
    <div className="h-6 w-32 rounded-full bg-slate-200/80" />
    <div className="mt-5 h-10 max-w-xl rounded-2xl bg-slate-200/80" />
    <div className="mt-3 h-5 max-w-2xl rounded-xl bg-slate-100/90" />
    <div className="mt-8 grid gap-4 md:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-48 rounded-[1.75rem] bg-white shadow-sm ring-1 ring-slate-200/60" />
      ))}
    </div>
  </div>
)

export const OptimizedHomePage: React.FC = () => {
  const { user } = useAuth()
  const [currentSublineIndex, setCurrentSublineIndex] = useState(0)
  const communityStories = getCommunityStories().slice(0, 3)

  const personalizedSublines = user
    ? [
        'Pick up where you left off and turn saved ideas into a real plan.',
        'Compare destinations, shortlist favorites, and shape the trip around your pace.',
        'Use TravelBuddy as a calmer planning workspace instead of juggling tabs.',
      ]
    : []

  useEffect(() => {
    if (!user || personalizedSublines.length < 2) {
      return undefined
    }

    const interval = window.setInterval(() => {
      setCurrentSublineIndex((prev) => (prev + 1) % personalizedSublines.length)
    }, 3800)

    return () => window.clearInterval(interval)
  }, [personalizedSublines.length, user])

  return (
    <div className="bg-white text-gray-900">
      <SEOHead
        title="TravelBuddy | Plan Trips, Discover Places, and Build Smarter Itineraries"
        description="TravelBuddy helps you discover destinations, shape itineraries, save favorites, and use AI assistance to plan trips with less friction."
        keywords="travel planning app, itinerary planner, destination discovery, trip organizer, AI travel assistant"
      />
      <style>{homePageAnimationStyles}</style>

      <HeroSection
        personalizedSublines={personalizedSublines}
        currentSublineIndex={currentSublineIndex}
      />

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_38%),linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 max-w-3xl sm:mb-10 lg:mb-12">
            <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-semibold text-sky-700 sm:px-4 sm:text-sm">
              Plan your trip with clarity
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
              Travel planning should feel directional, not chaotic.
            </h2>
            <p className="mt-3 text-base leading-7 text-gray-600 sm:mt-4 sm:text-lg sm:leading-8">
              We focuses on the moments where travelers usually get stuck: deciding where
              to go, narrowing options, and turning inspiration into a plan you can actually use.
            </p>
          </div>

          <div className="grid gap-4 sm:gap-5 md:grid-cols-3 md:gap-6">
            {planningSteps.map((step, index) => {
              const Icon = step.icon

              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                >
                  <Card className="h-full border-sky-100 bg-white/90 shadow-lg shadow-sky-100/60">
                    <CardContent className="p-5 sm:p-6 lg:p-7">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 text-white shadow-lg sm:mb-5 sm:h-14 sm:w-14">
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 sm:text-xl">{step.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-gray-600">{step.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
          <div>
            <span className="inline-flex items-center rounded-full bg-amber-100 px-3.5 py-2 text-xs font-semibold text-amber-800 sm:px-4 sm:text-sm">
              Built for real travel decisions
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
              This isn’t just about browsing—it’s about moving forward.
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600 sm:mt-4 sm:text-lg sm:leading-8">
              We explain the product quickly, reduce decision fatigue, and guide
              people toward the next meaningful action. This version does that with clearer sections,
              tighter copy, and stronger calls to action.
            </p>

            <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5">
              {platformHighlights.map((item) => {
                const Icon = item.icon

                return (
                  <Card key={item.title} className="h-full border-gray-100 bg-gradient-to-br from-white to-slate-50">
                    <CardContent className="p-5 sm:p-6">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-gray-600">{item.description}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-sky-200/40 via-transparent to-cyan-100/60 blur-3xl" />
            <Card className="relative overflow-hidden border-sky-100 bg-slate-950 text-white shadow-2xl shadow-sky-200/40">
              <div className="border-b border-white/10 px-5 py-5 sm:px-6 lg:px-8 lg:py-6">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Why This Works
                </span>
              </div>
              <div className="space-y-5 px-5 py-6 sm:px-6 sm:py-7 lg:space-y-6 lg:px-8 lg:py-8">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-sky-200">travel sites</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    Endless lists of destinations with no clear direction
                    Inspiration that doesn’t turn into a real plan
                    Multiple tabs, tools, and apps to organize one trip
                    Generic recommendations that don’t adapt to you
                  </p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-emerald-200">DealFinder (TravelBuddy)</p>
                  <p className="mt-2 text-sm leading-7 text-slate-200">
                    Clear flow: discover → refine → plan → act
                    AI turns ideas into structured itineraries
                    Everything in one place
                    Plans that adapt to your pace and style
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5">
                  <p className="text-sm font-semibold text-white">Next best actions</p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <Link to={user ? '/trips' : '/register'} className="flex-1">
                      <Button className="w-full bg-white text-slate-950 hover:bg-slate-100">
                        {user ? 'Continue Planning' : 'Create Free Account'}
                      </Button>
                    </Link>
                    <Link to="/discovery" className="flex-1">
                      <Button className="w-full border border-white/20 bg-transparent text-white hover:bg-white/10">
                        Explore Destinations
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <Suspense fallback={<section className="bg-gray-50 py-14 sm:py-16 lg:py-20"><SectionShell /></section>}>
        <DestinationVibes />
      </Suspense>

      <section className="bg-gradient-to-b from-white to-rose-50/40 py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 flex flex-col gap-4 sm:mb-10 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center rounded-full bg-rose-100 px-3.5 py-2 text-xs font-semibold text-rose-700 sm:px-4 sm:text-sm">
                Inspiration without the clutter
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                See the kind of trip you could build.
              </h2>
              <p className="mt-3 text-base leading-7 text-gray-600 sm:mt-4 sm:text-lg sm:leading-8">
                Use destination inspiration to find your direction, then turn it into an itinerary instead of
                leaving it as a saved post you never revisit.
              </p>
            </div>
            <Link to="/community" className="self-start md:self-auto">
              <Button className="bg-rose-600 text-white hover:bg-rose-700">
                Visit Community
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            {communityStories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <Card className="h-full overflow-hidden border-rose-100 shadow-lg shadow-rose-100/60">
                  <div className="relative h-48 overflow-hidden sm:h-52 lg:h-56">
                    <ImageWithFallback
                      src={story.image}
                      fallbackSrc={`https://picsum.photos/800/500?random=${story.id}`}
                      alt={story.location}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-10 text-white sm:px-5 sm:pb-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-100">{story.type}</p>
                      <p className="mt-1 text-lg font-semibold">{story.location}</p>
                    </div>
                  </div>
                  <CardContent className="p-5 sm:p-6">
                    <div className="mb-3 flex items-center gap-3 sm:mb-4">
                      <img
                        src={story.avatar}
                        alt={story.name}
                        className="h-10 w-10 rounded-full border border-gray-200 object-cover"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{story.name}</p>
                        <p className="text-xs text-gray-500">{story.time}</p>
                      </div>
                    </div>
                    <p className="text-sm leading-7 text-gray-600">{story.text}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Suspense fallback={<section className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-14 sm:py-16 lg:py-20"><SectionShell className="" /></section>}>
        <MobileAppShowcase />
      </Suspense>

      <section className="bg-slate-950 py-14 text-white sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:gap-10">
            <div>
              <span className="inline-flex items-center rounded-full bg-white/10 px-3.5 py-2 text-xs font-semibold text-sky-100 sm:px-4 sm:text-sm">
                Fits different travel styles
              </span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                TravelBuddy should help whether your trip is fixed or still fuzzy.
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300 sm:mt-4 sm:text-lg sm:leading-8">
                Some travelers arrive with flights and dates already set. Others are still deciding between
                three destinations and a rough budget. The product needs to support both states well.
              </p>

              <div className="mt-6 grid gap-3 sm:mt-8 sm:gap-4">
                {travelerModes.map((mode) => (
                  <div key={mode.title} className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-200">
                        <Users className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{mode.title}</h3>
                        <p className="mt-2 text-sm leading-7 text-slate-300">{mode.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3 md:gap-5">
              {planCards.map((plan) => (
                <Card key={plan.title} className="h-full overflow-hidden border-white/10 bg-white text-slate-900">
                  <div className={`bg-gradient-to-r ${plan.accent} px-5 py-4 text-white sm:px-6 sm:py-5`}>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em]">{plan.title}</p>
                    <p className="mt-2 text-3xl font-bold">{plan.price}</p>
                  </div>
                  <CardContent className="flex h-[calc(100%-88px)] flex-col p-5 sm:h-[calc(100%-96px)] sm:p-6">
                    <p className="text-sm leading-7 text-slate-600">{plan.summary}</p>
                    <div className="mt-auto pt-6">
                      <Link to={plan.link}>
                        <Button className="w-full bg-slate-900 text-white hover:bg-slate-800">
                          {plan.cta}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-slate-50 to-white py-14 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center">
            <span className="inline-flex items-center rounded-full bg-violet-100 px-3.5 py-2 text-xs font-semibold text-violet-700 sm:px-4 sm:text-sm">
              Helpful answers
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl">
              Questions travelers ask before they commit
            </h2>
            <p className="mt-3 text-base leading-7 text-gray-600 sm:mt-4 sm:text-lg sm:leading-8">
              We tightened the FAQ so it explains the product more honestly and gives people a clearer sense
              of what to expect.
            </p>
          </div>

          <div className="mt-8 sm:mt-10 lg:mt-12">
            <Suspense fallback={<div className="grid gap-4">{[0, 1, 2].map((item) => <div key={item} className="h-24 animate-pulse rounded-[1.5rem] bg-white shadow-sm ring-1 ring-slate-200/60" />)}</div>}>
              <FAQAccordion />
            </Suspense>
          </div>

          <Card className="mt-12 border-violet-100 bg-gradient-to-br from-white to-violet-50">
            <CardContent className="p-6 text-center sm:p-8">
              <h3 className="text-xl font-semibold text-gray-900 sm:text-2xl">Ready to start planning with less friction?</h3>
              <p className="mx-auto mt-3 max-w-2xl text-gray-600">
                Move from browsing to building. You can explore destinations first or jump straight into a
                trip plan if you already know where you want to go.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
                <Link to={user ? '/trips' : '/register'}>
                  <Button className="bg-violet-600 text-white hover:bg-violet-700">
                    {user ? 'Open My Trips' : 'Start Free'}
                  </Button>
                </Link>
                <Link to="/discovery">
                  <Button className="bg-white text-violet-700 ring-1 ring-violet-200 hover:bg-violet-50">
                    Browse Destinations
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Suspense fallback={null}>
        <AIAssistantBubble />
      </Suspense>
    </div>
  )
}
