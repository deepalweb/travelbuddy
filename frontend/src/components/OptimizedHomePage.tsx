import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Compass,
  MessageSquareText,
  Sparkles,
  Tag,
  Users,
  Route,
  CalendarClock,
  ShieldCheck,
  PlaneTakeoff,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './Button'
import { Card, CardContent } from './Card'
import { SEOHead } from './SEOHead'
import { ImageWithFallback } from './ImageWithFallback'
import { getCommunityStories, getMonthlyDestinations } from './home/homeData'

const primaryModules = [
  {
    icon: Sparkles,
    title: 'Trip Planner',
    description: 'Create AI trip plans, build itineraries, and organize travel details from one planning workspace.',
    path: '/trips',
    accent: 'from-sky-500 to-cyan-400',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Explore travel stories, local tips, and traveler insights that help you plan with more confidence.',
    path: '/community',
    accent: 'from-amber-400 to-orange-400',
  },
  {
    icon: Tag,
    title: 'Deals',
    description: 'Find travel deals, offers, and savings that support your trip budget and booking decisions.',
    path: '/deals',
    accent: 'from-rose-400 to-fuchsia-500',
  },
]

const plannerBenefits = [
  {
    icon: Compass,
    title: 'Start with a real trip brief',
    text: 'Plan around destination, duration, dates, and budget instead of guessing what matters first.',
  },
  {
    icon: Route,
    title: 'Get a stronger itinerary draft',
    text: 'Use AI to shape route logic, pacing, and daily flow before you spend time editing details.',
  },
  {
    icon: CalendarClock,
    title: 'Make faster travel decisions',
    text: 'Keep itinerary planning, travel context, and trip tradeoffs connected in one workflow.',
  },
  {
    icon: ShieldCheck,
    title: 'Use context that actually helps',
    text: 'Bring in traveler insight and useful deals only where they improve the plan, budget, or route.',
  },
]

const destinations = getMonthlyDestinations().slice(0, 4)
const communityStories = getCommunityStories().slice(0, 3)

export const OptimizedHomePage: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="overflow-hidden bg-[linear-gradient(180deg,#f7f6f2_0%,#ffffff_28%,#f4f7fb_100%)] text-slate-900">
      <SEOHead
        title="TravelBuddy | AI Trip Planner, Travel Itineraries, Community Tips, and Deals"
        description="TravelBuddy is an AI trip planner for building travel itineraries, exploring community travel tips, and finding useful travel deals for Sri Lanka and beyond."
        keywords="AI trip planner, travel itinerary planner, trip planner Sri Lanka, travel community, travel deals, itinerary generator, Sri Lanka travel planner"
      />

      <section className="relative isolate overflow-hidden border-b border-slate-200/70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(251,146,60,0.12),transparent_24%),linear-gradient(180deg,rgba(8,17,29,0.82),rgba(8,17,29,0.62))]" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&auto=format&fit=crop&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-32 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:pb-20 lg:pt-36">
          <div>
            <span className="inline-flex items-center rounded-full border border-white/14 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/72">
              AI Trip Planner
            </span>
            <h1 className="font-heading mt-6 max-w-3xl text-5xl font-semibold leading-[1.04] tracking-tight text-white sm:text-6xl">
              AI trip planner for better travel itineraries and smarter trip decisions.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/74">
              Build a trip itinerary from one clear brief, improve it with community travel insight, and keep
              travel deals close while planning Sri Lanka trips and other journeys.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/trips">
                <Button className="rounded-full bg-[linear-gradient(135deg,#f97316,#fb7185)] px-6 py-3 text-white shadow-[0_16px_40px_rgba(249,115,22,0.28)]">
                  Start Planning
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/community">
                <Button variant="outline" className="rounded-full border-white/24 bg-white/8 px-6 py-3 text-white hover:bg-white/12">
                  Explore Community
                </Button>
              </Link>
            </div>
          </div>

          <div>
            <Card className="border-white/12 bg-[rgba(255,255,255,0.92)] shadow-[0_24px_60px_rgba(8,15,34,0.22)]">
              <CardContent className="p-6 lg:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">How it works</p>
                <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-slate-950">
                  Plan a trip itinerary in one focused flow.
                </h2>
                <div className="mt-6 space-y-4">
                  <div className="rounded-[1.3rem] bg-[linear-gradient(180deg,#f8fafc_0%,#eef4fb_100%)] p-4">
                    <p className="text-sm font-semibold text-slate-900">1. Start with destination and trip details</p>
                    <p className="mt-1 text-sm leading-7 text-slate-600">
                      Add destination, duration, travel dates, and budget.
                    </p>
                  </div>
                  <div className="rounded-[1.3rem] bg-[linear-gradient(180deg,#f8fafc_0%,#eef4fb_100%)] p-4">
                    <p className="text-sm font-semibold text-slate-900">2. Generate an AI trip plan</p>
                    <p className="mt-1 text-sm leading-7 text-slate-600">
                      Get an itinerary draft with route logic, pacing, and daily structure.
                    </p>
                  </div>
                  <div className="rounded-[1.3rem] bg-slate-950 px-4 py-4 text-white">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/52">Core travel tools</p>
                    <p className="mt-2 text-lg font-semibold">Trip Planner, travel community, and deals</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <span className="inline-flex rounded-full bg-sky-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              Why TravelBuddy
            </span>
            <h2 className="font-heading mt-5 max-w-xl text-4xl font-semibold tracking-tight text-slate-950">
              Travel planning feels easier when the right things stay connected.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-8 text-slate-600">
              TravelBuddy connects AI trip planning, itinerary building, traveler insight, and travel deals in one
              cleaner workflow so users can move from idea to plan with less friction.
            </p>

            <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 shadow-[0_18px_38px_rgba(15,23,42,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">What users actually need</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-2xl font-semibold text-slate-950">Fewer tabs</p>
                  <p className="mt-1 text-sm leading-7 text-slate-600">One place to plan, compare, and keep the trip moving.</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-slate-950">Better output</p>
                  <p className="mt-1 text-sm leading-7 text-slate-600">Trip drafts that feel structured, not random.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {plannerBenefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.42, delay: index * 0.06 }}
                >
                  <Card className="h-full border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#e2f3ff,#f8fafc)] text-slate-900">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          Benefit {index + 1}
                        </span>
                      </div>
                      <h3 className="mt-5 font-heading text-2xl font-semibold leading-tight text-slate-950">{benefit.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{benefit.text}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#fffdf8] py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div>
            <span className="inline-flex rounded-full bg-amber-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-800">
              Core travel features
            </span>
            <h2 className="font-heading mt-5 text-4xl font-semibold tracking-tight text-slate-950">
              Trip planning, travel community, and deals in one web app.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
              Use the AI trip planner to create itineraries, check community travel stories for context, and find
              travel deals that support better booking and budget decisions.
            </p>

            <div className="mt-8 space-y-4">
              {primaryModules.map((module, index) => {
                const Icon = module.icon
                return (
                  <div key={module.title} className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)] transition-transform duration-300 hover:-translate-y-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${module.accent} text-slate-950`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-heading text-xl font-semibold text-slate-950">{module.title}</h3>
                          <p className="mt-2 text-sm leading-7 text-slate-600">{module.description}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        0{index + 1}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="grid gap-5">
            <Card className="overflow-hidden border-slate-200 bg-white shadow-[0_24px_50px_rgba(15,23,42,0.08)]">
              <CardContent className="p-0">
                <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-6 lg:border-b-0 lg:border-r">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Feature workflow</p>
                    <h3 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-slate-950">
                      One product, three jobs, one clearer experience.
                    </h3>
                    <div className="mt-6 space-y-4">
                      <div className="rounded-[1.3rem] bg-slate-950 px-4 py-4 text-white">
                        <p className="text-xs uppercase tracking-[0.18em] text-white/52">Trip Planner</p>
                        <p className="mt-2 text-base font-semibold">Generate itinerary drafts from your trip brief.</p>
                      </div>
                      <div className="rounded-[1.3rem] bg-slate-50 px-4 py-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Community</p>
                        <p className="mt-2 text-sm leading-7 text-slate-700">
                          Use traveler stories and local context to pressure-test the trip.
                        </p>
                      </div>
                      <div className="rounded-[1.3rem] bg-slate-50 px-4 py-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Deals</p>
                        <p className="mt-2 text-sm leading-7 text-slate-700">
                          Keep savings and booking opportunities connected to the plan.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-0 sm:grid-cols-2">
                    {destinations.map((destination) => (
                      <div key={destination.id} className="relative min-h-[210px] overflow-hidden">
                        <ImageWithFallback
                          src={destination.image}
                          alt={destination.name}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                          <p className="text-xs uppercase tracking-[0.18em] text-white/68">{destination.country}</p>
                          <h3 className="mt-1 font-heading text-2xl font-semibold">{destination.name}</h3>
                          <p className="mt-1 text-sm text-white/76">{destination.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Plan</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">Start fast</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">Generate a trip structure without overthinking the first step.</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Context</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">Choose better</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">Use stories, tips, and travel context before locking the trip in.</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Budget</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">Save smarter</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">Use deals when they improve the plan instead of distracting from it.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
              Travel community
            </span>
            <h2 className="font-heading mt-5 text-4xl font-semibold tracking-tight text-slate-950">
              Real travel stories help people build better itineraries.
            </h2>
          </div>
          <Link to="/community" className="text-sm font-semibold text-slate-900 transition-colors hover:text-sky-700">
            Visit Community
          </Link>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {communityStories.map((story) => (
            <Card key={story.id} className="overflow-hidden border-slate-200 bg-white shadow-[0_18px_42px_rgba(15,23,42,0.06)]">
              <div className="relative h-60">
                <ImageWithFallback src={story.image} alt={story.location} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/65">{story.type}</p>
                  <h3 className="mt-2 font-heading text-2xl font-semibold">{story.location}</h3>
                  <p className="mt-2 text-sm text-white/80">{story.text}</p>
                </div>
              </div>
              <CardContent className="flex items-center justify-between p-5 text-sm text-slate-500">
                <span>{story.name}</span>
                <span>{story.time}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#08111d] py-16 text-white lg:py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_26%),radial-gradient(circle_at_bottom_left,rgba(251,146,60,0.18),transparent_24%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <span className="inline-flex rounded-full border border-white/14 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/68">
                What we are rebuilding
              </span>
              <h2 className="font-heading mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                A better shell. A better homepage. A much clearer next step.
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/72">
                This redesign resets the foundation so the rest of the web app can follow one consistent visual
                system and one more trustworthy product narrative.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/8 p-6 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 text-sky-300">
                    <PlaneTakeoff className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Next implementation phase</p>
                    <p className="mt-1 text-sm leading-7 text-white/68">
                      Bring the same UI language into Trip Planner, Community, Deals, and Services.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 text-amber-300">
                    <MessageSquareText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Product simplification</p>
                    <p className="mt-1 text-sm leading-7 text-white/68">
                      Remove route clutter and keep guest browsing open where it helps product understanding.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to={user ? '/trips' : '/register'}>
                  <Button className="w-full rounded-full bg-[linear-gradient(135deg,#f97316,#fb7185)] px-6 text-white shadow-[0_16px_40px_rgba(249,115,22,0.28)] sm:w-auto">
                    {user ? 'Open Trip Planner' : 'Create Free Account'}
                  </Button>
                </Link>
                <Link to="/deals">
                  <Button variant="outline" className="w-full rounded-full border-white/20 bg-white/8 px-6 text-white hover:bg-white/12 sm:w-auto">
                    Browse Deals
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
