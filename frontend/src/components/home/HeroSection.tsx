import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, Clock, MapPin, Sparkles, Star } from 'lucide-react'
import { Button } from '../Button'
import { ImageWithFallback } from '../ImageWithFallback'
import { motion } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'

interface HeroSectionProps {
  personalizedSublines?: string[]
  currentSublineIndex?: number
}

export const HeroSection: React.FC<HeroSectionProps> = ({ 
  personalizedSublines = [],
  currentSublineIndex = 0 
}) => {
  const { user } = useAuth()
  const [quickPlanDestination, setQuickPlanDestination] = useState('')
  const [quickPlanDays, setQuickPlanDays] = useState('3')
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)

  const defaultSublines = user ? [
    "You have a trip draft in progress.",
    "There are 3 new deals near your location.",
    "Perfect weather in Ella this weekend!",
    "2 friends shared new travel photos.",
    "Your saved places have price drops."
  ] : []

  const sublines = personalizedSublines.length > 0 ? personalizedSublines : defaultSublines
  const heroHighlights = [
    'AI-assisted trip structure',
    'Destination discovery',
    'Favorites and itinerary tools',
  ]

  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-[#07111f]">
      <div className="absolute inset-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&auto=format&q=80"
          fallbackSrc="https://picsum.photos/1920/1080?random=1"
          alt="Travel essentials - map, camera, passport and planning items"
          className="w-full h-full object-cover"
          loading="eager"
        />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_24%),radial-gradient(circle_at_80%_18%,_rgba(96,165,250,0.22),_transparent_26%),linear-gradient(180deg,rgba(4,9,18,0.32)_0%,rgba(4,9,18,0.74)_52%,rgba(4,9,18,0.92)_100%)]" />
      <div className="absolute -left-24 top-24 h-56 w-56 rounded-full bg-amber-300/12 blur-3xl sm:h-72 sm:w-72" />
      <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-sky-400/12 blur-3xl sm:h-80 sm:w-80" />

      <div className="relative z-10 flex min-h-[100svh] items-center px-4 py-20 sm:py-24 lg:py-28">
        <div className="mx-auto grid w-full max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          <div className="text-white">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80 backdrop-blur-md sm:text-xs"
            >
              Travel planning, made more intentional
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.08 }}
              className="mt-6 max-w-4xl text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl lg:text-7xl"
            >
              {user
                ? `Welcome back, ${user.fullName?.split(' ')[0] || user.username?.split(' ')[0] || 'Explorer'}.`
                : 'Plan trips with a calmer, more premium starting point.'}
              <span className="mt-2 block bg-gradient-to-r from-white via-sky-100 to-amber-200 bg-clip-text text-transparent">
                {user ? 'Your next adventure deserves a sharper plan.' : 'Discover, shortlist, and build with clarity.'}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.18 }}
              className="mt-5 max-w-2xl text-base leading-7 text-white/78 sm:text-lg sm:leading-8"
            >
              {user ? (
                <span className="inline-block transition-all duration-500 ease-in-out">
                  {sublines[currentSublineIndex] || 'Your next adventure is waiting.'}
                </span>
              ) : (
                'TravelBuddy helps you move from inspiration to itinerary without the clutter of scattered tabs, screenshots, and half-finished notes.'
              )}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.26 }}
              className="mt-6 flex flex-wrap gap-2.5 sm:gap-3"
            >
              {heroHighlights.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/14 bg-white/8 px-3.5 py-2 text-xs font-medium text-white/84 backdrop-blur-md sm:px-4 sm:text-sm"
                >
                  {item}
                </span>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.34 }}
              className="mt-8 grid gap-3 sm:grid-cols-3"
            >
              <div className="rounded-3xl border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-md">
                <div className="flex items-center gap-2 text-amber-300">
                  <Star className="h-4 w-4 fill-current" aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">Focused</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/85">Start with a place, a vibe, or a rough idea and shape it into something usable.</p>
              </div>
              <div className="rounded-3xl border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-md">
                <div className="flex items-center gap-2 text-sky-300">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">Fast</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/85">Use the quick planner to get moving in minutes instead of overthinking the first step.</p>
              </div>
              <div className="rounded-3xl border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-md">
                <div className="flex items-center gap-2 text-emerald-300">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">Flexible</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/85">Refine your plan as you browse destinations, save places, and compare options.</p>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.85, delay: 0.18 }}
            className="relative"
            role="region"
            aria-label="Quick trip planning"
          >
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-white/16 via-white/6 to-white/0 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.08)_100%)] p-4 shadow-[0_30px_80px_rgba(3,7,18,0.45)] backdrop-blur-2xl sm:p-5">
              <div className="rounded-[1.6rem] border border-white/12 bg-slate-950/45 p-4 sm:p-5">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-100/85">Quick plan</p>
                    <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                      Start with a destination and let the structure follow.
                    </h2>
                  </div>
                  <div className="hidden rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-right text-xs text-white/75 sm:block">
                    <div>Planning Mode</div>
                    <div className="mt-1 font-semibold text-white">Smart Draft</div>
                  </div>
                </div>

                <div className="flex flex-col gap-3.5">
                  <div className="relative">
                    <label htmlFor="destination" className="sr-only">Destination</label>
                    <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-300" aria-hidden="true" />
                    <input
                      id="destination"
                      type="text"
                      placeholder="Where to? Try Kyoto, Paris, Ella, or Bali"
                      className="w-full rounded-2xl border border-white/10 bg-white/10 py-4 pl-12 pr-4 text-sm font-medium text-white placeholder:text-white/46 focus:outline-none focus:ring-2 focus:ring-amber-300/50 sm:text-base"
                      value={quickPlanDestination}
                      onChange={(e) => setQuickPlanDestination(e.target.value)}
                      aria-label="Travel destination"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
                    <div className="relative">
                      <label htmlFor="days" className="sr-only">Number of days</label>
                      <Calendar className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-300" aria-hidden="true" />
                      <select
                        id="days"
                        className="w-full appearance-none rounded-2xl border border-white/10 bg-white/10 py-4 pl-12 pr-4 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-sky-300/50 sm:text-base"
                        value={quickPlanDays}
                        onChange={(e) => setQuickPlanDays(e.target.value)}
                        aria-label="Trip duration in days"
                      >
                        {[1, 2, 3, 4, 5, 7, 10, 14].map((d) => (
                          <option key={d} value={d} className="bg-gray-900 text-white">{d} Days</option>
                        ))}
                      </select>
                    </div>

                    <Button
                      onClick={() => {
                        if (!quickPlanDestination) return
                        setIsGeneratingPreview(true)
                        setTimeout(() => {
                          setIsGeneratingPreview(false)
                          window.location.href = `/trips?destination=${encodeURIComponent(quickPlanDestination)}&days=${quickPlanDays}&quick=true`
                        }, 1500)
                      }}
                      className="rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-orange-300 px-6 py-4 font-bold text-slate-950 shadow-lg shadow-amber-400/20 transition-all hover:brightness-105 active:scale-[0.99]"
                      aria-busy={isGeneratingPreview}
                    >
                      {isGeneratingPreview ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full border-2 border-slate-900/30 border-t-slate-900 animate-spin" />
                          <span>Building draft...</span>
                        </div>
                      ) : (
                        <>
                          <span>Plan My Trip</span>
                          <Sparkles className="ml-2 h-5 w-5" aria-hidden="true" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/7 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">What happens next</p>
                    <p className="mt-2 text-sm leading-6 text-white/82">
                      We open a trip draft with your destination and trip length so you can keep refining instead of starting from scratch.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/7 p-4">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-white/70">
                      <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" /> clear starting point</span>
                      <span className="h-1 w-1 rounded-full bg-white/20" />
                      <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-sky-300" aria-hidden="true" /> faster first draft</span>
                    </div>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      {user ? (
                        <>
                          <Link to="/trips" className="flex-1">
                            <Button className="w-full border border-white/15 bg-white/10 text-white hover:bg-white/15">
                              Open Trips
                            </Button>
                          </Link>
                          <Link to="/discovery" className="flex-1">
                            <Button className="w-full bg-white text-slate-950 hover:bg-slate-100">
                              Explore
                              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                            </Button>
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link to="/register" className="flex-1">
                            <Button className="w-full bg-white text-slate-950 hover:bg-slate-100">
                              Get Started Free
                              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                            </Button>
                          </Link>
                          <Link to="/login" className="flex-1">
                            <Button className="w-full border border-white/15 bg-white/10 text-white hover:bg-white/15">
                              Sign In
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
