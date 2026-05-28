import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Compass,
  MapPin,
  PlaneTakeoff,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { Button } from '../components/Button'
import { Card, CardContent } from '../components/Card'
import {
  buildDiscoveryRecommendations,
  discoveryInterests,
  discoveryMonths,
  type DestinationRecommendation,
  type DiscoveryBudget,
  type DiscoveryDuration,
  type DiscoveryFormState,
  type DiscoveryTravelerType,
} from '../data/destinationDiscovery'

const durationOptions: Array<{ value: DiscoveryDuration; label: string; hint: string }> = [
  { value: 'weekend', label: 'Weekend', hint: '2-3 days' },
  { value: 'short', label: '5-7 days', hint: 'One focused getaway' },
  { value: 'medium', label: '1-2 weeks', hint: 'A fuller trip' },
  { value: 'long', label: '2+ weeks', hint: 'Slow travel' },
]

const budgetOptions: Array<{ value: DiscoveryBudget; label: string; hint: string }> = [
  { value: 'budget', label: 'Budget', hint: 'Value first' },
  { value: 'mid-range', label: 'Mid-range', hint: 'Comfort + flexibility' },
  { value: 'luxury', label: 'Luxury', hint: 'Premium stays and moments' },
]

const travelerOptions: Array<{ value: DiscoveryTravelerType; label: string; hint: string }> = [
  { value: 'solo', label: 'Solo', hint: 'Independent and flexible' },
  { value: 'couple', label: 'Couple', hint: 'Romance and shared pace' },
  { value: 'family', label: 'Family', hint: 'Comfort and easy logistics' },
  { value: 'friends', label: 'Friends', hint: 'Energy and variety' },
]

const stepTitles = [
  'Where are you leaving from?',
  'When do you want to travel?',
  'What budget feels right?',
  'How long is the trip?',
  'Who is traveling?',
  'What are you into?',
]

const initialForm: DiscoveryFormState = {
  departure: '',
  month: '',
  budget: '',
  duration: '',
  travelerType: '',
  interests: [],
}

const scoreTone = (index: number) => {
  if (index === 0) return 'bg-emerald-100 text-emerald-800'
  if (index === 1) return 'bg-sky-100 text-sky-800'
  return 'bg-amber-100 text-amber-800'
}

const RecommendationCard: React.FC<{
  recommendation: DestinationRecommendation
  index: number
  onPlanTrip: (recommendation: DestinationRecommendation) => void
}> = ({ recommendation, index, onPlanTrip }) => (
  <Card className="overflow-hidden border-slate-200 bg-white shadow-[0_24px_50px_rgba(15,23,42,0.08)]">
    <div className="relative h-56 overflow-hidden">
      <img src={recommendation.image} alt={recommendation.name} className="h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      <div className="absolute left-5 top-5">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${scoreTone(index)}`}>
          {index === 0 ? 'Best match' : index === 1 ? 'Strong option' : 'Worth comparing'}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <p className="text-xs uppercase tracking-[0.18em] text-white/70">{recommendation.country}</p>
        <h3 className="mt-2 font-heading text-3xl font-semibold">{recommendation.name}</h3>
        <p className="mt-2 max-w-2xl text-sm text-white/82">{recommendation.tagline}</p>
      </div>
    </div>

    <CardContent className="p-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <Sparkles className="h-4 w-4 text-sky-600" />
            Weather
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-900">{recommendation.weatherLabel}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <Wallet className="h-4 w-4 text-emerald-600" />
            Budget
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-900">{recommendation.estimatedTripCost}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <PlaneTakeoff className="h-4 w-4 text-violet-600" />
            Flight
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-900">{recommendation.flightLabel}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            <ShieldCheck className="h-4 w-4 text-amber-600" />
            Visa
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-900">{recommendation.visaLabel}</p>
        </div>
      </div>

      <div className="mt-5 rounded-[1.4rem] border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)] p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <TrendingUp className="h-4 w-4 text-rose-500" />
          Why this fits
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            {recommendation.whyItFits.map((reason) => (
              <div key={reason} className="flex items-start gap-3 text-sm leading-6 text-slate-600">
                <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{reason}</span>
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-slate-950 p-4 text-white">
            <p className="text-xs uppercase tracking-[0.18em] text-white/56">Trending signal</p>
            <p className="mt-2 text-sm font-semibold">{recommendation.trendLabel}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {recommendation.bestFor.map((item) => (
                <span key={item} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/78">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {recommendation.caution && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {recommendation.caution}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Use this pick as the starting point, then generate a trip plan around it.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-full">
            Save for later
          </Button>
          <Button onClick={() => onPlanTrip(recommendation)} className="rounded-full bg-[linear-gradient(135deg,#f97316,#fb7185)] px-5 text-white">
            Plan This Trip
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
)

const StepCard: React.FC<{
  selected: boolean
  onClick: () => void
  title: string
  hint: string
}> = ({ selected, onClick, title, hint }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-[1.4rem] border p-4 text-left transition-all ${
      selected
        ? 'border-slate-900 bg-slate-900 text-white shadow-[0_16px_36px_rgba(15,23,42,0.16)]'
        : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50'
    }`}
  >
    <p className="text-base font-semibold">{title}</p>
    <p className={`mt-1 text-sm ${selected ? 'text-white/70' : 'text-slate-500'}`}>{hint}</p>
  </button>
)

const canAdvance = (step: number, form: DiscoveryFormState) => {
  switch (step) {
    case 0:
      return Boolean(form.departure.trim())
    case 1:
      return Boolean(form.month)
    case 2:
      return Boolean(form.budget)
    case 3:
      return Boolean(form.duration)
    case 4:
      return Boolean(form.travelerType)
    case 5:
      return form.interests.length > 0
    default:
      return false
  }
}

const DestinationDiscoveryPage: React.FC = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<DiscoveryFormState>(initialForm)
  const [hasGenerated, setHasGenerated] = useState(false)

  const recommendations = useMemo(() => {
    if (!hasGenerated) return []
    return buildDiscoveryRecommendations(form)
  }, [form, hasGenerated])

  const goNext = () => {
    if (step === stepTitles.length - 1) {
      setHasGenerated(true)
      return
    }
    setStep((current) => current + 1)
  }

  const goBack = () => {
    if (step === 0) return
    setStep((current) => current - 1)
  }

  const resetFlow = () => {
    setForm(initialForm)
    setStep(0)
    setHasGenerated(false)
  }

  const handlePlanTrip = (recommendation: DestinationRecommendation) => {
    const params = new URLSearchParams({
      destination: `${recommendation.name}, ${recommendation.country}`,
      days:
        form.duration === 'weekend'
          ? '3'
          : form.duration === 'short'
            ? '5'
            : form.duration === 'medium'
              ? '10'
              : '14',
      budget: form.budget,
      style: form.travelerType,
      origin: form.departure,
      month: form.month,
      quick: 'true',
    })

    navigate(`/trips?${params.toString()}`, {
      state: {
        discoveryRecommendation: recommendation,
        discoveryBrief: form,
      },
    })
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f6f2_0%,#ffffff_36%,#edf4fb_100%)]">
      <section className="relative overflow-hidden bg-[#07111f] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(249,115,22,0.18),transparent_24%)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pb-20 lg:pt-36">
          <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-end">
            <div>
              <span className="inline-flex items-center rounded-full border border-white/14 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/74">
                Destination Discovery
              </span>
              <h1 className="font-heading mt-6 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-white sm:text-6xl">
                Find your next destination before you build the itinerary.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/74">
                Tell TravelBuddy your month, budget, trip length, and travel style. We will suggest the destinations
                that fit best, with seasonality, trend signals, and practical travel tradeoffs baked in.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-medium text-white/82">
                  Best month fit
                </span>
                <span className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-medium text-white/82">
                  Budget-aware picks
                </span>
                <span className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-medium text-white/82">
                  Trending destinations
                </span>
              </div>
            </div>

            <Card className="border-white/10 bg-white/10 text-white backdrop-blur-md">
              <CardContent className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Why this matters</p>
                <div className="mt-4 space-y-4">
                  <div className="rounded-2xl bg-white/8 p-4">
                    <p className="text-sm font-semibold">People often want to travel before they know where to go.</p>
                    <p className="mt-2 text-sm leading-6 text-white/70">
                      This flow solves the earlier decision first, then hands the user into trip planning.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/8 p-4">
                    <p className="text-sm font-semibold">The app feels guided, not like a blank chatbot.</p>
                    <p className="mt-2 text-sm leading-6 text-white/70">
                      That lowers friction and gives users faster confidence in their next adventure.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-slate-200 bg-white shadow-[0_20px_48px_rgba(15,23,42,0.06)]">
            <CardContent className="p-6 lg:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Guided wizard</p>
                  <h2 className="mt-2 font-heading text-3xl font-semibold text-slate-950">
                    {stepTitles[step]}
                  </h2>
                </div>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                  Step {step + 1} of {stepTitles.length}
                </span>
              </div>

              <div className="mt-6 flex gap-2">
                {stepTitles.map((title, index) => (
                  <div
                    key={title}
                    className={`h-2 flex-1 rounded-full ${index <= step ? 'bg-slate-900' : 'bg-slate-200'}`}
                  />
                ))}
              </div>

              <div className="mt-8">
                {step === 0 && (
                  <div>
                    <label className="mb-3 block text-sm font-medium text-slate-700">Departure city or country</label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-700" />
                      <input
                        type="text"
                        value={form.departure}
                        onChange={(event) => setForm((current) => ({ ...current, departure: event.target.value }))}
                        placeholder="Colombo, London, Dubai, New York..."
                        className="w-full rounded-[1.35rem] border border-slate-200 bg-white px-12 py-4 text-sm font-medium text-slate-900 outline-none transition focus:border-sky-300 focus:ring-4 focus:ring-sky-100"
                      />
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                      We use this to estimate travel friction and rough flight effort.
                    </p>
                  </div>
                )}

                {step === 1 && (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {discoveryMonths.map((month) => (
                      <StepCard
                        key={month}
                        selected={form.month === month}
                        onClick={() => setForm((current) => ({ ...current, month }))}
                        title={month}
                        hint="Seasonal timing matters"
                      />
                    ))}
                  </div>
                )}

                {step === 2 && (
                  <div className="grid gap-3 md:grid-cols-3">
                    {budgetOptions.map((option) => (
                      <StepCard
                        key={option.value}
                        selected={form.budget === option.value}
                        onClick={() => setForm((current) => ({ ...current, budget: option.value }))}
                        title={option.label}
                        hint={option.hint}
                      />
                    ))}
                  </div>
                )}

                {step === 3 && (
                  <div className="grid gap-3 md:grid-cols-2">
                    {durationOptions.map((option) => (
                      <StepCard
                        key={option.value}
                        selected={form.duration === option.value}
                        onClick={() => setForm((current) => ({ ...current, duration: option.value }))}
                        title={option.label}
                        hint={option.hint}
                      />
                    ))}
                  </div>
                )}

                {step === 4 && (
                  <div className="grid gap-3 md:grid-cols-2">
                    {travelerOptions.map((option) => (
                      <StepCard
                        key={option.value}
                        selected={form.travelerType === option.value}
                        onClick={() => setForm((current) => ({ ...current, travelerType: option.value }))}
                        title={option.label}
                        hint={option.hint}
                      />
                    ))}
                  </div>
                )}

                {step === 5 && (
                  <div>
                    <p className="mb-4 text-sm text-slate-500">Pick at least one. Multiple interests usually give better matches.</p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {discoveryInterests.map((interest) => {
                        const selected = form.interests.includes(interest.id)
                        return (
                          <button
                            key={interest.id}
                            type="button"
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                interests: selected
                                  ? current.interests.filter((item) => item !== interest.id)
                                  : [...current.interests, interest.id],
                              }))
                            }
                            className={`rounded-[1.3rem] border px-4 py-4 text-left transition-all ${
                              selected
                                ? 'border-slate-900 bg-slate-900 text-white shadow-[0_16px_36px_rgba(15,23,42,0.16)]'
                                : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <p className="text-base font-semibold">{interest.label}</p>
                            <p className={`mt-1 text-sm ${selected ? 'text-white/70' : 'text-slate-500'}`}>
                              Used to personalize the ranking
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Button onClick={step === 0 ? resetFlow : goBack} variant="outline" className="rounded-full">
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  {step === 0 ? 'Reset' : 'Back'}
                </Button>
                <Button
                  onClick={goNext}
                  disabled={!canAdvance(step, form)}
                  className="rounded-full bg-[linear-gradient(135deg,#f97316,#fb7185)] px-6 text-white"
                >
                  {step === stepTitles.length - 1 ? 'Show Destinations' : 'Next'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card className="border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <Compass className="h-4 w-4" />
                  Your brief
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">From</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{form.departure || 'Not set yet'}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Month</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{form.month || 'Not set yet'}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Budget</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{form.budget || 'Not set yet'}</p>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Trip length</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{form.duration || 'Not set yet'}</p>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-white">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/56">Interests</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {form.interests.length > 0 ? (
                      form.interests.map((interest) => (
                        <span key={interest} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
                          {interest}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-white/60">No interests selected yet</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white">
              <CardContent className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Phase 1 product value</p>
                <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
                  <p>This is the dream-to-decision step. It helps users who want to travel but do not know where to go yet.</p>
                  <p>Instead of dropping them into itinerary generation immediately, we guide them toward destinations that fit their timing and style.</p>
                  <p className="font-medium text-slate-800">After they choose a destination, the existing trip planner takes over.</p>
                </div>
                <div className="mt-5">
                  <Link to="/trips" className="text-sm font-semibold text-sky-700 transition-colors hover:text-sky-900">
                    Or skip ahead to the trip planner
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {hasGenerated && (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-sky-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                Recommended destinations
              </span>
              <h2 className="font-heading mt-5 text-4xl font-semibold tracking-tight text-slate-950">
                Where you should travel next
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-8 text-slate-600">
                Ranked for {form.month}, your {form.budget} budget, a {form.duration} trip, and your {form.travelerType} travel style.
              </p>
            </div>
            <Button onClick={() => setHasGenerated(false)} variant="outline" className="rounded-full">
              Adjust answers
            </Button>
          </div>

          <div className="space-y-6">
            {recommendations.map((recommendation, index) => (
              <RecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                index={index}
                onPlanTrip={handlePlanTrip}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default DestinationDiscoveryPage
