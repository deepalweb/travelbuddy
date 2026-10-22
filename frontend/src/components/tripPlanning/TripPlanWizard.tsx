import React, { useMemo, useState } from 'react'
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  Check,
  ChevronLeft,
  Gauge,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  Users,
  UserRound,
  WandSparkles,
} from 'lucide-react'
import { Button } from '../Button'
import { Card, CardContent } from '../Card'
import type { TripPlanInput } from '../../types/tripPlan'

type WizardStepId = 'destination' | 'travelers' | 'budget' | 'pace' | 'avoid' | 'review'

const STEPS: Array<{ id: WizardStepId; eyebrow: string; title: string }> = [
  { id: 'destination', eyebrow: 'Step 1', title: 'Where and when' },
  { id: 'travelers', eyebrow: 'Step 2', title: "Who's traveling" },
  { id: 'budget', eyebrow: 'Step 3', title: 'Set the budget' },
  { id: 'pace', eyebrow: 'Step 4', title: 'Pace and interests' },
  { id: 'avoid', eyebrow: 'Step 5', title: 'Avoid and logistics' },
  { id: 'review', eyebrow: 'Step 6', title: 'Notes and review' },
]

const TRAVELER_TYPES: Array<{ value: string; label: string; icon: React.ComponentType<{ className?: string }>; defaultGroupSize: number }> = [
  { value: 'solo', label: 'Solo', icon: UserRound, defaultGroupSize: 1 },
  { value: 'couple', label: 'Couple', icon: Heart, defaultGroupSize: 2 },
  { value: 'family', label: 'Family', icon: Users, defaultGroupSize: 4 },
  { value: 'friends', label: 'Friends', icon: Users, defaultGroupSize: 4 },
  { value: 'business-leisure', label: 'Business + leisure', icon: Briefcase, defaultGroupSize: 1 },
]

const BUDGET_LEVELS: Array<{ value: string; label: string; detail: string }> = [
  { value: 'budget', label: 'Budget', detail: 'Hostels, street food, public transport' },
  { value: 'mid-range', label: 'Mid-range', detail: '3-star hotels, sit-down meals, some taxis' },
  { value: 'luxury', label: 'Luxury', detail: 'Premium stays, fine dining, private transport' },
]

const PACE_OPTIONS: Array<{ value: 'relaxed' | 'balanced' | 'packed'; label: string; detail: string }> = [
  { value: 'relaxed', label: 'Relaxed', detail: '2-3 activities a day, lots of downtime' },
  { value: 'balanced', label: 'Balanced', detail: '3 activities a day, some breathing room' },
  { value: 'packed', label: 'Packed', detail: 'Up to 4 activities a day, minimal downtime' },
]

const INTEREST_OPTIONS = [
  'culture', 'food', 'nature', 'history', 'art', 'adventure', 'relaxation', 'nightlife', 'shopping', 'hidden gems',
]

const AVOID_OPTIONS = [
  'crowds', 'heavy walking', 'long drives', 'early mornings', 'late nights', 'spicy food', 'tourist traps',
]

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
      <span className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${selected ? 'bg-white/10' : 'bg-slate-100'}`}>
        <Icon className="h-4.5 w-4.5" />
      </span>
    )}
    <p className="font-bold">{title}</p>
    {detail && <p className={`mt-1 text-xs ${selected ? 'text-white/70' : 'text-slate-500'}`}>{detail}</p>}
  </button>
)

const Chip = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full border px-4 py-2 text-sm font-semibold capitalize transition-all ${
      selected
        ? 'border-slate-950 bg-slate-950 text-white'
        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
    }`}
  >
    {label}
  </button>
)

const toIsoDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseIsoDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const addDays = (value: string, days: number) => {
  const date = parseIsoDate(value)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

const splitListText = (value: string) =>
  value.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean)

export type TripPlanWizardProps = {
  destination: string
  onDestinationChange: (value: string) => void
  origin: string
  onOriginChange: (value: string) => void
  durationDays: number
  onDurationChange: (days: number) => void
  startDate: string
  onStartDateChange: (value: string) => void
  endDate: string
  onEndDateChange: (value: string) => void
  travelerType: string
  onTravelerTypeChange: (value: string) => void
  groupSize: number
  onGroupSizeChange: (value: number) => void
  budgetLevel: string
  onBudgetLevelChange: (value: string) => void
  budgetAmount: string
  onBudgetAmountChange: (value: string) => void
  pace: TripPlanInput['pace']
  onPaceChange: (value: TripPlanInput['pace']) => void
  interestsText: string
  onInterestsChange: (value: string) => void
  avoidText: string
  onAvoidChange: (value: string) => void
  accommodationArea: string
  onAccommodationAreaChange: (value: string) => void
  arrivalTime: string
  onArrivalTimeChange: (value: string) => void
  departureTime: string
  onDepartureTimeChange: (value: string) => void
  plannerNotes: string
  onPlannerNotesChange: (value: string) => void
  onGenerate: () => void
  isGenerating: boolean
  generationError: string | null
}

export const TripPlanWizard: React.FC<TripPlanWizardProps> = ({
  destination,
  onDestinationChange,
  origin,
  onOriginChange,
  durationDays,
  onDurationChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  travelerType,
  onTravelerTypeChange,
  groupSize,
  onGroupSizeChange,
  budgetLevel,
  onBudgetLevelChange,
  budgetAmount,
  onBudgetAmountChange,
  pace,
  onPaceChange,
  interestsText,
  onInterestsChange,
  avoidText,
  onAvoidChange,
  accommodationArea,
  onAccommodationAreaChange,
  arrivalTime,
  onArrivalTimeChange,
  departureTime,
  onDepartureTimeChange,
  plannerNotes,
  onPlannerNotesChange,
  onGenerate,
  isGenerating,
  generationError,
}) => {
  const [stepIndex, setStepIndex] = useState(0)
  const currentStep = STEPS[stepIndex]

  const interests = useMemo(() => splitListText(interestsText), [interestsText])
  const avoid = useMemo(() => splitListText(avoidText), [avoidText])

  const toggleInterest = (id: string) => {
    const next = interests.includes(id) ? interests.filter((item) => item !== id) : [...interests, id]
    onInterestsChange(next.join(', '))
  }

  const toggleAvoid = (id: string) => {
    const next = avoid.includes(id) ? avoid.filter((item) => item !== id) : [...avoid, id]
    onAvoidChange(next.join(', '))
  }

  const canContinue = useMemo(() => {
    switch (currentStep.id) {
      case 'destination':
        return destination.trim().length > 0 && durationDays >= 1 && durationDays <= 14
      case 'travelers':
        return Boolean(travelerType) && groupSize >= 1
      case 'budget':
        return Boolean(budgetLevel)
      case 'pace':
        return Boolean(pace)
      default:
        return true
    }
  }, [currentStep.id, destination, durationDays, travelerType, groupSize, budgetLevel, pace])

  const continueWizard = () => {
    if (stepIndex === STEPS.length - 1) {
      onGenerate()
      return
    }
    setStepIndex((current) => current + 1)
  }

  return (
    <Card className="border-slate-200 bg-white shadow-[0_25px_65px_rgba(15,23,42,0.09)]">
      <CardContent className="p-5 sm:p-8">
        {generationError && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900">
            <p className="font-bold">Smart plan generation failed</p>
            <p className="mt-1 text-sm leading-6">{generationError}</p>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand-coralDark">{currentStep.eyebrow}</p>
            <h2 className="font-heading mt-2 text-2xl font-semibold text-slate-950 sm:text-4xl">{currentStep.title}</h2>
          </div>
          <span className="shrink-0 rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-500">
            {stepIndex + 1} / {STEPS.length}
          </span>
        </div>

        <div className="mt-6 flex gap-2">
          {STEPS.map((step, index) => (
            <div key={step.id} className={`h-1.5 flex-1 rounded-full ${index <= stepIndex ? 'bg-brand-coral' : 'bg-slate-200'}`} />
          ))}
        </div>

        <div className="mt-8">
          {currentStep.id === 'destination' && (
            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-xs font-bold text-slate-500">Destination</span>
                <input
                  autoFocus
                  type="text"
                  value={destination}
                  onChange={(event) => onDestinationChange(event.target.value)}
                  placeholder="Polonnaruwa, Sri Lanka"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-orange-300"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label>
                  <span className="mb-2 block text-xs font-bold text-slate-500">Starting from</span>
                  <input
                    type="text"
                    value={origin}
                    onChange={(event) => onOriginChange(event.target.value)}
                    placeholder="Colombo, airport, hotel area"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-orange-300"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-xs font-bold text-slate-500">Duration</span>
                  <select
                    value={durationDays}
                    onChange={(event) => onDurationChange(Number(event.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none"
                  >
                    {Array.from({ length: 14 }, (_, index) => index + 1).map((days) => (
                      <option key={days} value={days}>{days} {days === 1 ? 'day' : 'days'}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="mb-2 block text-xs font-bold text-slate-500">From date (optional)</span>
                  <input
                    type="date"
                    value={startDate}
                    min={toIsoDate(new Date())}
                    onChange={(event) => onStartDateChange(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-orange-300"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-xs font-bold text-slate-500">To date</span>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || toIsoDate(new Date())}
                    max={startDate ? addDays(startDate, 13) : undefined}
                    disabled={!startDate}
                    onChange={(event) => onEndDateChange(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-orange-300 disabled:opacity-50"
                  />
                </label>
              </div>
              {startDate && endDate && (
                <p className="flex items-center gap-2 text-xs font-semibold text-sky-700">
                  <CalendarDays className="h-4 w-4" />{durationDays}-day trip · {startDate} to {endDate}
                </p>
              )}
            </div>
          )}

          {currentStep.id === 'travelers' && (
            <div className="space-y-8">
              <div>
                <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">Who is this trip for</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {TRAVELER_TYPES.map((option) => (
                    <SelectionCard
                      key={option.value}
                      selected={travelerType === option.value}
                      title={option.label}
                      icon={option.icon}
                      onClick={() => {
                        onTravelerTypeChange(option.value)
                        onGroupSizeChange(option.defaultGroupSize)
                      }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">How many travelers</p>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => onGroupSizeChange(Math.max(1, groupSize - 1))}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:border-slate-300"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center text-2xl font-bold text-slate-950">{groupSize}</span>
                  <button
                    type="button"
                    onClick={() => onGroupSizeChange(Math.min(12, groupSize + 1))}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:border-slate-300"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <span className="text-sm text-slate-500">{groupSize === 1 ? 'traveler' : 'travelers'}</span>
                </div>
              </div>
            </div>
          )}

          {currentStep.id === 'budget' && (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-3">
                {BUDGET_LEVELS.map((option) => (
                  <SelectionCard
                    key={option.value}
                    selected={budgetLevel === option.value}
                    title={option.label}
                    detail={option.detail}
                    onClick={() => onBudgetLevelChange(option.value)}
                  />
                ))}
              </div>
              <label className="block max-w-xs">
                <span className="mb-2 block text-xs font-bold text-slate-500">Total budget amount (optional)</span>
                <input
                  type="number"
                  min="0"
                  value={budgetAmount}
                  onChange={(event) => onBudgetAmountChange(event.target.value)}
                  placeholder="e.g. 1200"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-orange-300"
                />
              </label>
            </div>
          )}

          {currentStep.id === 'pace' && (
            <div className="space-y-8">
              <div>
                <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">Daily pace</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {PACE_OPTIONS.map((option) => (
                    <SelectionCard
                      key={option.value}
                      selected={pace === option.value}
                      title={option.label}
                      detail={option.detail}
                      icon={Gauge}
                      onClick={() => onPaceChange(option.value)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((interest) => (
                    <Chip key={interest} label={interest} selected={interests.includes(interest)} onClick={() => toggleInterest(interest)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep.id === 'avoid' && (
            <div className="space-y-8">
              <div>
                <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">Anything to avoid</p>
                <div className="flex flex-wrap gap-2">
                  {AVOID_OPTIONS.map((option) => (
                    <Chip key={option} label={option} selected={avoid.includes(option)} onClick={() => toggleAvoid(option)} />
                  ))}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <label>
                  <span className="mb-2 block text-xs font-bold text-slate-500">Accommodation area</span>
                  <input
                    type="text"
                    value={accommodationArea}
                    onChange={(event) => onAccommodationAreaChange(event.target.value)}
                    placeholder="Old town, near the station"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-orange-300"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-xs font-bold text-slate-500">Arrival time</span>
                  <input
                    type="time"
                    value={arrivalTime}
                    onChange={(event) => onArrivalTimeChange(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-orange-300"
                  />
                </label>
                <label>
                  <span className="mb-2 block text-xs font-bold text-slate-500">Departure time</span>
                  <input
                    type="time"
                    value={departureTime}
                    onChange={(event) => onDepartureTimeChange(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-orange-300"
                  />
                </label>
              </div>
            </div>
          )}

          {currentStep.id === 'review' && (
            <div className="space-y-6">
              <label className="block">
                <span className="mb-2 block text-xs font-bold text-slate-500">Anything else the plan should know</span>
                <textarea
                  value={plannerNotes}
                  onChange={(event) => onPlannerNotesChange(event.target.value)}
                  rows={4}
                  placeholder="Must-see places, mobility needs, dietary preferences..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-orange-300"
                />
              </label>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-400">
                  <ShieldCheck className="h-4 w-4" />Quick recap
                </p>
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <div><dt className="text-slate-500">Destination</dt><dd className="font-semibold text-slate-900">{destination || 'Not set'}</dd></div>
                  <div><dt className="text-slate-500">Duration</dt><dd className="font-semibold text-slate-900">{durationDays} {durationDays === 1 ? 'day' : 'days'}</dd></div>
                  <div><dt className="text-slate-500">Travelers</dt><dd className="font-semibold text-slate-900">{groupSize} · {travelerType}</dd></div>
                  <div><dt className="text-slate-500">Budget</dt><dd className="font-semibold text-slate-900">{budgetLevel}{budgetAmount ? ` · ${budgetAmount}` : ''}</dd></div>
                  <div><dt className="text-slate-500">Pace</dt><dd className="font-semibold text-slate-900">{pace}</dd></div>
                  <div><dt className="text-slate-500">Interests</dt><dd className="font-semibold text-slate-900">{interests.join(', ') || 'None'}</dd></div>
                  {avoid.length > 0 && (
                    <div className="sm:col-span-2"><dt className="text-slate-500">Avoiding</dt><dd className="font-semibold text-slate-900">{avoid.join(', ')}</dd></div>
                  )}
                </dl>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
          <Button
            variant="outline"
            onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
            disabled={stepIndex === 0}
            className="rounded-full"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={continueWizard}
            disabled={!canContinue || (stepIndex === STEPS.length - 1 && isGenerating)}
            loading={stepIndex === STEPS.length - 1 && isGenerating}
            className="rounded-full bg-[linear-gradient(135deg,#f47f6b,#fb923c)] px-6 text-white"
          >
            {stepIndex === STEPS.length - 1 ? (
              <>{!isGenerating && <WandSparkles className="mr-2 h-4 w-4" />}{isGenerating ? 'Building Smart Plan...' : 'Generate Smart Plan'}</>
            ) : (
              <>Continue<ArrowRight className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
