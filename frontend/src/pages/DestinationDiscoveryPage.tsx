import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronLeft,
  CloudSun,
  Compass,
  Footprints,
  Gauge,
  Heart,
  MapPin,
  Plane,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react'
import { Button } from '../components/Button'
import { Card, CardContent } from '../components/Card'
import { ImageWithFallback } from '../components/ImageWithFallback'
import { apiService } from '../lib/api'
import {
  buildDiscoveryRecommendations,
  discoveryAvoidOptions,
  discoveryInterests,
  discoveryMonths,
  type DestinationRecommendation,
  type DiscoveryBudget,
  type DiscoveryDuration,
  type DiscoveryFormState,
  type DiscoveryInterest,
  type DiscoveryTravelerType,
} from '../data/destinationDiscovery'

type WizardStep = 'origin' | 'month' | 'duration' | 'traveler' | 'vibes' | 'avoid'

const steps: Array<{ id: WizardStep; eyebrow: string; title: string }> = [
  { id: 'origin', eyebrow: 'Starting point', title: 'Where will you travel from?' },
  { id: 'month', eyebrow: 'Timing', title: 'When are you thinking of traveling?' },
  { id: 'duration', eyebrow: 'Trip shape', title: 'How many days do you have?' },
  { id: 'traveler', eyebrow: 'Travel party', title: 'Who is traveling?' },
  { id: 'vibes', eyebrow: 'Travel style', title: 'What should this trip feel like?' },
  { id: 'avoid', eyebrow: 'Your boundaries', title: 'What do you want to avoid?' },
]

const durationOptions: Array<{ value: DiscoveryDuration; label: string; detail: string; days: number }> = [
  { value: 'weekend', label: '2-3 days', detail: 'Quick escape', days: 3 },
  { value: 'short', label: '5-7 days', detail: 'Focused getaway', days: 7 },
  { value: 'medium', label: '8-14 days', detail: 'Fuller journey', days: 10 },
  { value: 'long', label: '15+ days', detail: 'Slow travel', days: 16 },
]

const budgetOptions: Array<{ value: DiscoveryBudget; label: string; detail: string }> = [
  { value: 'budget', label: 'Budget', detail: 'Value first' },
  { value: 'mid-range', label: 'Mid-range', detail: 'Comfort + flexibility' },
  { value: 'luxury', label: 'Luxury', detail: 'Premium experience' },
]

const travelerOptions: Array<{
  value: DiscoveryTravelerType
  label: string
  icon: React.ComponentType<{ className?: string }>
}> = [
  { value: 'solo', label: 'Solo', icon: Compass },
  { value: 'couple', label: 'Couple', icon: Heart },
  { value: 'family', label: 'Family', icon: Users },
  { value: 'friends', label: 'Friends', icon: Users },
  { value: 'business-leisure', label: 'Business + leisure', icon: BriefcaseBusiness },
]

const initialForm: DiscoveryFormState = {
  departure: '',
  month: '',
  budget: '',
  duration: '',
  travelerType: '',
  interests: [],
  avoid: [],
  tripNotes: '',
}

const dailyBudget: Record<DiscoveryBudget, number> = {
  budget: 140,
  'mid-range': 320,
  luxury: 650,
}

const labelize = (value: string) =>
  value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

const fitTone = (value: string) => {
  const normalized = value.toLowerCase()
  if (normalized.includes('strong') || normalized.includes('excellent') || normalized.includes('low')) {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-100'
  }
  if (normalized.includes('weak') || normalized.includes('stretch') || normalized.includes('high')) {
    return 'bg-amber-50 text-amber-700 ring-amber-100'
  }
  return 'bg-sky-50 text-sky-700 ring-sky-100'
}

const SelectionCard = ({
  selected,
  title,
  detail,
  onClick,
  icon: Icon,
}: {
  selected: boolean
  title: string
  detail?: string
  onClick: () => void
  icon?: React.ComponentType<{ className?: string }>
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative rounded-2xl border p-4 text-left transition-all ${
      selected
        ? 'border-slate-950 bg-slate-950 text-white shadow-[0_16px_34px_rgba(15,23,42,0.16)]'
        : 'border-slate-200 bg-white text-slate-900 hover:-translate-y-0.5 hover:border-slate-300'
    }`}
  >
    {selected && (
      <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-emerald-950">
        <Check className="h-3.5 w-3.5" />
      </span>
    )}
    {Icon && (
      <span className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${selected ? 'bg-white/10' : 'bg-slate-100'}`}>
        <Icon className="h-5 w-5" />
      </span>
    )}
    <p className="pr-7 text-sm font-bold sm:text-base">{title}</p>
    {detail && <p className={`mt-1 text-xs ${selected ? 'text-white/60' : 'text-slate-500'}`}>{detail}</p>}
  </button>
)

const DestinationCard = ({
  recommendation,
  index,
  onPlan,
}: {
  recommendation: DestinationRecommendation
  index: number
  onPlan: (recommendation: DestinationRecommendation) => void
}) => {
  const reasons = (recommendation.whyFits.length ? recommendation.whyFits : recommendation.whyItFits).slice(0, 3)
  const warnings = recommendation.risks.slice(0, 2)

  return (
    <Card className="group overflow-hidden border-slate-200 bg-white shadow-[0_22px_55px_rgba(15,23,42,0.08)]">
      <div className="relative h-64 overflow-hidden bg-[linear-gradient(135deg,#0f766e,#0f172a)]">
        <ImageWithFallback
          src={recommendation.image}
          alt={`${recommendation.name}, ${recommendation.country}`}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-extrabold text-slate-900 backdrop-blur">
            #{index + 1}
          </span>
          {index === 0 && (
            <span className="rounded-full bg-emerald-400 px-3 py-1.5 text-xs font-extrabold text-emerald-950">Best match</span>
          )}
        </div>
        <div className="absolute right-4 top-4 rounded-2xl bg-slate-950/55 px-3 py-2 text-center text-white backdrop-blur">
          <strong className="text-2xl">{recommendation.matchScore}%</strong>
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/55">Match</p>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
            {recommendation.parentDestination} · {recommendation.country}
          </p>
          <h3 className="font-heading mt-1 text-3xl font-semibold">{recommendation.name}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {recommendation.bestFor.slice(0, 3).map((item) => (
              <span key={item} className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur">
                {labelize(item)}
              </span>
            ))}
          </div>
        </div>
      </div>

      <CardContent className="p-5 sm:p-6">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Wallet, label: 'Budget', value: recommendation.budgetFit },
            { icon: CloudSun, label: 'Weather', value: recommendation.weatherFit },
            { icon: Users, label: 'Crowds', value: recommendation.crowdRisk },
          ].map((signal) => {
            const Icon = signal.icon
            return (
              <div key={signal.label} className={`rounded-xl px-2 py-3 text-center ring-1 ${fitTone(signal.value)}`}>
                <Icon className="mx-auto h-4 w-4" />
                <p className="mt-1 text-[9px] font-bold uppercase tracking-wider opacity-65">{signal.label}</p>
                <p className="mt-0.5 text-xs font-extrabold">{signal.value}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-5">
          <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-slate-400">Why this fits</p>
          <div className="mt-3 space-y-2.5">
            {reasons.map((reason) => (
              <p key={reason} className="flex items-start gap-2 text-sm leading-6 text-slate-600">
                <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                {reason}
              </p>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {recommendation.tripFeeling.map((feeling) => (
            <span key={feeling} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
              {labelize(feeling)}
            </span>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
          <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-amber-700">
            <AlertTriangle className="h-4 w-4" />
            Watch out
          </p>
          <div className="mt-2 space-y-1 text-sm leading-6 text-slate-700">
            {warnings.length ? warnings.map((warning) => <p key={warning}>{warning}</p>) : <p>No major warning for this match.</p>}
          </div>
        </div>

        <Button
          onClick={() => onPlan(recommendation)}
          className="mt-5 w-full rounded-xl bg-[linear-gradient(135deg,#f47f6b,#fb923c)] py-3 text-white"
        >
          Plan This Trip
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

const DestinationDiscoveryPage: React.FC = () => {
  const navigate = useNavigate()
  const [started, setStarted] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [form, setForm] = useState<DiscoveryFormState>(initialForm)
  const [recommendations, setRecommendations] = useState<DestinationRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasResults, setHasResults] = useState(false)
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null)

  const currentStep = steps[stepIndex]
  const duration = durationOptions.find((option) => option.value === form.duration)
  const preferenceSummary = useMemo(() => {
    const traveler = form.travelerType ? labelize(form.travelerType) : ''
    const interests = form.interests.slice(0, 3).map(labelize).join(' + ')
    return [traveler, duration?.label, form.month, interests].filter(Boolean).join(' · ')
  }, [duration?.label, form.interests, form.month, form.travelerType])

  const canContinue = useMemo(() => {
    if (currentStep.id === 'origin') return form.departure.trim().length > 1
    if (currentStep.id === 'month') return Boolean(form.month)
    if (currentStep.id === 'duration') return Boolean(form.duration && form.budget)
    if (currentStep.id === 'traveler') return Boolean(form.travelerType)
    if (currentStep.id === 'vibes') return form.interests.length > 0
    return true
  }, [currentStep.id, form])

  const toggleInterest = (interest: DiscoveryInterest) => {
    setForm((current) => ({
      ...current,
      interests: current.interests.includes(interest)
        ? current.interests.filter((item) => item !== interest)
        : [...current.interests, interest],
    }))
  }

  const toggleAvoid = (avoid: string) => {
    setForm((current) => ({
      ...current,
      avoid: current.avoid.includes(avoid)
        ? current.avoid.filter((item) => item !== avoid)
        : [...current.avoid, avoid],
    }))
  }

  const findMatches = async () => {
    const durationDays = duration?.days || 7
    setIsLoading(true)
    setFallbackMessage(null)

    try {
      const [response] = await Promise.all([
        apiService.getDiscoveryRecommendations({
          ...form,
          origin: form.departure,
          durationDays,
          budgetTotal: dailyBudget[form.budget as DiscoveryBudget] * durationDays,
        }),
        new Promise((resolve) => window.setTimeout(resolve, 1100)),
      ])
      const apiRecommendations = Array.isArray(response?.recommendations) ? response.recommendations : []
      setRecommendations(
        apiRecommendations.length
          ? (apiRecommendations as DestinationRecommendation[])
          : buildDiscoveryRecommendations(form),
      )
    } catch (error) {
      console.error('Discovery recommendation generation failed:', error)
      setFallbackMessage('Live matching was unavailable, so these results use TravelBuddy’s local destination ranking.')
      setRecommendations(buildDiscoveryRecommendations(form))
    } finally {
      setIsLoading(false)
      setHasResults(true)
      window.setTimeout(() => document.getElementById('discovery-results')?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }

  const continueWizard = () => {
    if (stepIndex === steps.length - 1) {
      void findMatches()
      return
    }
    setStepIndex((current) => current + 1)
  }

  const reset = () => {
    setForm(initialForm)
    setStepIndex(0)
    setStarted(true)
    setHasResults(false)
    setRecommendations([])
    setFallbackMessage(null)
  }

  const planTrip = (recommendation: DestinationRecommendation) => {
    const params = new URLSearchParams({
      destination: `${recommendation.name}, ${recommendation.parentDestination}, ${recommendation.country}`,
      days: String(duration?.days || 7),
      budget: form.budget,
      style: form.travelerType,
      origin: form.departure,
      month: form.month,
      interests: form.interests.join(','),
      avoid: form.avoid.join(','),
      quick: 'true',
    })

    navigate(`/trips?${params.toString()}`, {
      state: { discoveryRecommendation: recommendation, discoveryBrief: form },
    })
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6f7f4_0%,#ffffff_38%,#eef4f7_100%)]">
      <section className="relative overflow-hidden bg-[#0a1625] text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-45"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1900&q=82)' }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,14,28,0.96),rgba(5,14,28,0.68)),radial-gradient(circle_at_80%_20%,rgba(244,127,107,0.2),transparent_28%)]" />
        <div
          className={`relative mx-auto max-w-7xl px-4 transition-all duration-500 sm:px-6 lg:px-8 ${
            started ? 'pb-10 pt-10 lg:pb-12 lg:pt-12' : 'pb-16 pt-16 lg:pb-24 lg:pt-24'
          }`}
        >
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white/75 backdrop-blur">
              <Compass className="h-4 w-4 text-[#ffad9c]" />
              Destination Discovery
            </span>
            <h1
              className={`font-heading mt-6 font-semibold leading-[0.98] tracking-tight transition-all duration-500 ${
                started ? 'text-4xl sm:text-5xl' : 'text-5xl sm:text-6xl'
              }`}
            >
              Not sure where to travel next?
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
              Answer a few simple questions and TravelBuddy will recommend destinations based on your budget, timing, travel style, and what you want to avoid.
            </p>
            {!started && (
              <Button
                onClick={() => {
                  setStarted(true)
                  window.setTimeout(() => document.getElementById('discovery-wizard')?.scrollIntoView({ behavior: 'smooth' }), 50)
                }}
                size="lg"
                className="mt-8 rounded-full bg-[linear-gradient(135deg,#f47f6b,#fb923c)] px-7 text-white"
              >
                Find My Next Adventure
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </section>

      {!started && (
        <section className="border-b border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)]">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#e96855]">
                  A decision, not a generic list
                </p>
                <h2 className="font-heading mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  Tell us what matters. We&apos;ll rank what fits.
                </h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                  TravelBuddy compares timing, trip length, budget, travel style, and your avoid preferences before recommending a destination.
                </p>

                <div className="mt-7 space-y-3">
                  {[
                    'Answer six quick questions',
                    'See clear match scores and warnings',
                    'Continue directly into trip planning',
                  ].map((item, index) => (
                    <div key={item} className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <Card className="overflow-hidden border-slate-200 bg-white shadow-[0_24px_55px_rgba(15,23,42,0.08)]">
                <div className="grid sm:grid-cols-[0.9fr_1.1fr]">
                  <div className="relative min-h-60 overflow-hidden bg-slate-900">
                    <ImageWithFallback
                      src="https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=82"
                      alt="Bali destination preview"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">Example match</p>
                      <h3 className="font-heading mt-1 text-3xl font-semibold">Bali</h3>
                      <p className="mt-1 text-sm text-white/70">Indonesia</p>
                    </div>
                    <span className="absolute right-4 top-4 rounded-full bg-emerald-400 px-3 py-1.5 text-sm font-extrabold text-emerald-950">
                      94% Match
                    </span>
                  </div>

                  <CardContent className="p-5 sm:p-6">
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">Why it fits</p>
                    <div className="mt-4 space-y-3">
                      {[
                        'Strong beach, food, and romantic fit',
                        'Good value for a seven-day trip',
                        'Dry-season weather works well',
                      ].map((item) => (
                        <p key={item} className="flex items-start gap-2 text-sm leading-6 text-slate-600">
                          <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                          {item}
                        </p>
                      ))}
                    </div>
                    <div className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      <span className="font-bold">Watch out:</span> Popular areas can feel crowded in July.
                    </div>
                    <Button
                      onClick={() => {
                        setStarted(true)
                        window.setTimeout(() => document.getElementById('discovery-wizard')?.scrollIntoView({ behavior: 'smooth' }), 50)
                      }}
                      className="mt-5 w-full rounded-xl bg-slate-950 py-3 text-white"
                    >
                      Find My Matches
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </div>
              </Card>
            </div>
          </div>
        </section>
      )}

      {started && !hasResults && !isLoading && (
        <section id="discovery-wizard" className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <Card className="border-slate-200 bg-white shadow-[0_25px_65px_rgba(15,23,42,0.09)]">
            <CardContent className="p-5 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#e96855]">{currentStep.eyebrow}</p>
                  <h2 className="font-heading mt-2 text-2xl font-semibold text-slate-950 sm:text-4xl">{currentStep.title}</h2>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500">
                  {stepIndex + 1} / {steps.length}
                </span>
              </div>

              <div className="mt-6 flex gap-2">
                {steps.map((step, index) => (
                  <div key={step.id} className={`h-1.5 flex-1 rounded-full ${index <= stepIndex ? 'bg-[#f47f6b]' : 'bg-slate-200'}`} />
                ))}
              </div>

              <div className="mt-8">
                {currentStep.id === 'origin' && (
                  <div className="mx-auto max-w-xl">
                    <label className="relative block">
                      <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#e96855]" />
                      <input
                        autoFocus
                        type="text"
                        value={form.departure}
                        onChange={(event) => setForm((current) => ({ ...current, departure: event.target.value }))}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' && canContinue) continueWizard()
                        }}
                        placeholder="Colombo, London, Dubai, New York..."
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-5 pl-12 pr-4 text-base font-semibold text-slate-950 outline-none transition focus:border-[#f47f6b] focus:bg-white focus:ring-4 focus:ring-orange-100"
                      />
                    </label>
                    <p className="mt-4 text-center text-sm text-slate-500">Your origin helps us judge flight effort and whether the trip length is realistic.</p>
                  </div>
                )}

                {currentStep.id === 'month' && (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {discoveryMonths.map((month) => (
                      <SelectionCard
                        key={month}
                        selected={form.month === month}
                        title={month}
                        onClick={() => setForm((current) => ({ ...current, month }))}
                      />
                    ))}
                  </div>
                )}

                {currentStep.id === 'duration' && (
                  <div className="space-y-8">
                    <div>
                      <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">Trip duration</p>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {durationOptions.map((option) => (
                          <SelectionCard
                            key={option.value}
                            selected={form.duration === option.value}
                            title={option.label}
                            detail={option.detail}
                            onClick={() => setForm((current) => ({ ...current, duration: option.value }))}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">Comfortable budget</p>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {budgetOptions.map((option) => (
                          <SelectionCard
                            key={option.value}
                            selected={form.budget === option.value}
                            title={option.label}
                            detail={option.detail}
                            icon={Wallet}
                            onClick={() => setForm((current) => ({ ...current, budget: option.value }))}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep.id === 'traveler' && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {travelerOptions.map((option) => (
                      <SelectionCard
                        key={option.value}
                        selected={form.travelerType === option.value}
                        title={option.label}
                        icon={option.icon}
                        onClick={() => setForm((current) => ({ ...current, travelerType: option.value }))}
                      />
                    ))}
                  </div>
                )}

                {currentStep.id === 'vibes' && (
                  <div>
                    <p className="mb-4 text-sm text-slate-500">Choose as many as you like. Your strongest interests shape the ranking.</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {discoveryInterests.map((interest) => (
                        <SelectionCard
                          key={interest.id}
                          selected={form.interests.includes(interest.id)}
                          title={interest.label}
                          icon={Sparkles}
                          onClick={() => toggleInterest(interest.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {currentStep.id === 'avoid' && (
                  <div>
                    <p className="mb-4 text-sm text-slate-500">Optional. We use these as negative ranking signals.</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {discoveryAvoidOptions.map((option) => (
                        <SelectionCard
                          key={option}
                          selected={form.avoid.includes(option)}
                          title={labelize(option)}
                          icon={ShieldCheck}
                          onClick={() => toggleAvoid(option)}
                        />
                      ))}
                    </div>
                    <div className="mt-7">
                      <label className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">
                        Anything else?
                      </label>
                      <textarea
                        value={form.tripNotes}
                        onChange={(event) => setForm((current) => ({ ...current, tripNotes: event.target.value }))}
                        rows={4}
                        placeholder="Example: quiet beaches, easy public transport, street food, no party areas..."
                        className="mt-3 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-950 outline-none transition focus:border-[#f47f6b] focus:bg-white focus:ring-4 focus:ring-orange-100"
                      />
                      <p className="mt-2 text-xs text-slate-500">
                        Notes help TravelBuddy catch preferences that do not fit neatly into a button.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
                <Button
                  variant="outline"
                  onClick={() => stepIndex === 0 ? setStarted(false) : setStepIndex((current) => current - 1)}
                  className="rounded-full"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  onClick={continueWizard}
                  disabled={!canContinue}
                  className="rounded-full bg-[linear-gradient(135deg,#f47f6b,#fb923c)] px-6 text-white"
                >
                  {stepIndex === steps.length - 1 ? 'Find My Matches' : 'Continue'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {isLoading && (
        <section className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6 lg:py-16">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-xl">
            <RefreshCw className="h-7 w-7 animate-spin" />
          </div>
          <h2 className="font-heading mt-7 text-3xl font-semibold text-slate-950">Finding trips that fit you...</h2>
          <div className="mx-auto mt-7 max-w-md space-y-3 text-left">
            {[
              'Checking travel style match',
              'Checking season and timing',
              'Checking budget fit',
              'Preparing best destination matches',
            ].map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
                <span className={`flex h-6 w-6 items-center justify-center rounded-full ${index < 3 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                  {index < 3 ? <Check className="h-3.5 w-3.5" /> : <Gauge className="h-3.5 w-3.5" />}
                </span>
                {item}
              </div>
            ))}
          </div>
        </section>
      )}

      {hasResults && !isLoading && (
        <section id="discovery-results" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#e96855]">TravelBuddy ranked</p>
              <h2 className="font-heading mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Your best destination matches</h2>
              <p className="mt-4 max-w-3xl text-base font-semibold text-slate-500">{preferenceSummary}</p>
            </div>
            <Button onClick={reset} variant="outline" className="rounded-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Adjust answers
            </Button>
          </div>

          {fallbackMessage && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{fallbackMessage}</div>
          )}

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {recommendations.slice(0, 6).map((recommendation, index) => (
              <DestinationCard key={recommendation.id} recommendation={recommendation} index={index} onPlan={planTrip} />
            ))}
          </div>

          {recommendations.length > 1 && (
            <div className="mt-16">
              <div className="mb-6">
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-sky-700">Decision view</p>
                <h2 className="font-heading mt-2 text-3xl font-semibold text-slate-950">Compare your top matches</h2>
              </div>
              <Card className="overflow-hidden border-slate-200 bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-slate-950 text-white">
                      <tr>
                        {['Destination', 'Match', 'Budget', 'Weather', 'Crowd', 'Best for'].map((heading) => (
                          <th key={heading} className="px-5 py-4 text-xs font-bold uppercase tracking-[0.14em] text-white/65">{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recommendations.slice(0, 3).map((item) => (
                        <tr key={item.id}>
                          <td className="px-5 py-5">
                            <p className="font-bold text-slate-950">{item.name}</p>
                            <p className="mt-1 text-xs text-slate-500">{item.parentDestination}, {item.country}</p>
                          </td>
                          <td className="px-5 py-5 font-extrabold text-emerald-700">{item.matchScore}%</td>
                          <td className="px-5 py-5 text-slate-600">{item.budgetFit}</td>
                          <td className="px-5 py-5 text-slate-600">{item.weatherFit}</td>
                          <td className="px-5 py-5 text-slate-600">{item.crowdRisk}</td>
                          <td className="px-5 py-5 text-slate-600">{item.bestFor.slice(0, 2).map(labelize).join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          <div className="mt-14 rounded-[2rem] bg-[#0b1727] p-7 text-white sm:flex sm:items-center sm:justify-between sm:p-9">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Still deciding?</p>
              <h3 className="font-heading mt-2 text-2xl font-semibold">Start with the strongest fit. You can refine the plan next.</h3>
            </div>
            <Button onClick={() => planTrip(recommendations[0])} className="mt-5 rounded-full bg-[linear-gradient(135deg,#f47f6b,#fb923c)] px-6 text-white sm:mt-0">
              Plan Top Match
              <Plane className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}

export default DestinationDiscoveryPage
