import React, { useMemo, useState } from 'react'
import { Banknote, Calendar, Compass, LoaderCircle, MapPin, Sparkles, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './Card'
import { Button } from './Button'
import { useConfig } from '../contexts/ConfigContext'
import { useAuth } from '../contexts/AuthContext'

interface AITripGeneratorProps {
  onTripGenerated: (trip: any, workflowDraft?: any) => void
  onClose?: () => void
  selectedPlaces?: any[]
  mode?: 'modal' | 'page'
  initialValues?: Partial<{
    destination: string
    duration: string
    travelers: string
    budget: string
    travelStyle: string
    startingLocation: string
    notes: string
    mustSee: string
  }>
}

const generationSteps = [
  'Understanding your trip brief',
  'Building the itinerary structure',
  'Refining daily pacing and budget',
  'Preparing the saved trip draft',
]

export const AITripGenerator: React.FC<AITripGeneratorProps> = ({
  onTripGenerated,
  onClose,
  selectedPlaces = [],
  mode = 'modal',
  initialValues,
}) => {
  const { config } = useConfig()
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    destination: initialValues?.destination || (selectedPlaces.length > 0
      ? `${selectedPlaces[0].location.city}, ${selectedPlaces[0].location.country}`
      : ''),
    duration: initialValues?.duration || '3 days',
    travelers: initialValues?.travelers || '1',
    budget: initialValues?.budget || 'medium',
    travelStyle: initialValues?.travelStyle || 'balanced',
    startingLocation: initialValues?.startingLocation || '',
    transportPreference: 'balanced',
    stayPreference: 'comfortable',
    currency: 'USD',
    startDate: '',
    endDate: '',
    notes: initialValues?.notes || '',
    mustSee: initialValues?.mustSee || '',
    avoid: '',
  })
  const [generating, setGenerating] = useState(false)
  const [generationStepIndex, setGenerationStepIndex] = useState(0)

  const canGenerate = useMemo(
    () => Boolean(formData.destination.trim() && formData.duration),
    [formData.destination, formData.duration]
  )

  const generateTrip = async () => {
    if (!canGenerate) {
      return
    }

    setGenerating(true)
    setGenerationStepIndex(0)

    const stepInterval = window.setInterval(() => {
      setGenerationStepIndex((prev) => Math.min(prev + 1, generationSteps.length - 1))
    }, 1400)

    try {
      const apiUrl = config?.apiBaseUrl || 'http://localhost:3000'
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      const demoToken = localStorage.getItem('demo_token')
      if (demoToken) {
        headers.Authorization = `Bearer ${demoToken}`
      }
      if (user?.id) {
        headers['x-user-id'] = user.id
      }

      const response = await fetch(`${apiUrl}/api/ai-trips/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          destination: formData.destination,
          duration: formData.duration,
          travelers: formData.travelers,
          budget: formData.budget,
          travelStyle: formData.travelStyle,
          startingLocation: formData.startingLocation,
          transportPreference: formData.transportPreference,
          stayPreference: formData.stayPreference,
          interests: [],
          currency: formData.currency,
          startDate: formData.startDate,
          endDate: formData.endDate,
          notes: formData.notes,
          mustSee: formData.mustSee
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          avoid: formData.avoid
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          selectedPlaces,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`)
      }

      const tripData = await response.json()
      const workflowDraft = {
        destination: formData.destination,
        duration: formData.duration,
        travelers: formData.travelers,
        budget: formData.budget,
        travelStyle: formData.travelStyle,
        startingLocation: formData.startingLocation,
        transportPreference: formData.transportPreference,
        stayPreference: formData.stayPreference,
        currency: formData.currency,
        startDate: formData.startDate,
        endDate: formData.endDate,
        notes: formData.notes,
        mustSee: formData.mustSee
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        avoid: formData.avoid
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        selectedPlaces,
        generatedAt: new Date().toISOString(),
      }

      sessionStorage.setItem(
        'tripPlannerWorkflowDraft',
        JSON.stringify({
          brief: workflowDraft,
          trip: tripData,
        })
      )

      onTripGenerated(tripData, workflowDraft)
    } catch (error) {
      console.error('Failed to generate trip:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate trip'
      alert(`Failed to generate trip: ${errorMessage}`)
    } finally {
      window.clearInterval(stepInterval)
      setGenerating(false)
      setGenerationStepIndex(0)
    }
  }

  const containerClassName =
    mode === 'page'
      ? 'overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/70'
      : 'mx-auto w-full max-w-6xl overflow-hidden rounded-[2rem] border-0 bg-white shadow-2xl'

  return (
    <Card className={containerClassName}>
      <CardHeader className="bg-[linear-gradient(135deg,#07111f_0%,#14396d_55%,#4f46e5_100%)] text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              Trip Planner Brief
            </div>
            <CardTitle className="mt-4 flex items-center text-3xl font-semibold text-white">
              <Sparkles className="mr-3 h-6 w-6" />
              Build your trip draft from one focused form
            </CardTitle>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/75">
              Start with the details that matter most for a trip plan: where you are going, how long you
              are going for, your budget, your dates, and the trip style you want.
            </p>
          </div>
          {mode === 'modal' && onClose && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl border-white/20 bg-white/10 px-4 py-2 text-white hover:bg-white/20"
            >
              Close
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="grid gap-8 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
        <div className="space-y-6">
          {selectedPlaces.length > 0 && (
            <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50 p-5">
              <p className="text-sm font-semibold text-sky-900">Imported from Discovery</p>
              <p className="mt-1 text-sm text-sky-700">These places will influence the itinerary and help the AI anchor the route.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedPlaces.map((place, index) => (
                  <span key={index} className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800">
                    {place.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Trip to</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  placeholder="Bali, Indonesia"
                  className="w-full rounded-2xl border border-slate-300 px-11 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Duration</label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {['2 days', '3 days', '4 days', '5 days', '7 days', '10 days', '14 days'].map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Budget</label>
              <div className="relative">
                <Banknote className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full rounded-2xl border border-slate-300 px-11 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="low">Budget</option>
                  <option value="medium">Mid-range</option>
                  <option value="high">Premium</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Travelers</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={formData.travelers}
                  onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
                  className="w-full rounded-2xl border border-slate-300 px-11 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="1">Solo</option>
                  <option value="2">Couple</option>
                  <option value="3-4">Small group</option>
                  <option value="5+">Large group</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Start date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full rounded-2xl border border-slate-300 px-11 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">End date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full rounded-2xl border border-slate-300 px-11 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Trip style</label>
              <select
                value={formData.travelStyle}
                onChange={(e) => setFormData({ ...formData, travelStyle: e.target.value })}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="relaxed">Relaxed</option>
                <option value="balanced">Balanced</option>
                <option value="packed">Action-packed</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Stay style</label>
              <select
                value={formData.stayPreference}
                onChange={(e) => setFormData({ ...formData, stayPreference: e.target.value })}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="budget">Budget stays</option>
                <option value="comfortable">Comfortable mid-range</option>
                <option value="boutique">Boutique and design-led</option>
                <option value="luxury">Luxury stays</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Transport preference</label>
              <select
                value={formData.transportPreference}
                onChange={(e) => setFormData({ ...formData, transportPreference: e.target.value })}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="balanced">Balanced options</option>
                <option value="public">Mostly public transport</option>
                <option value="private">Private transfers</option>
                <option value="walkable">Walkable and local</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Starting from</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={formData.startingLocation}
                  onChange={(e) => setFormData({ ...formData, startingLocation: e.target.value })}
                  placeholder="Optional: Colombo, Sri Lanka"
                  className="w-full rounded-2xl border border-slate-300 px-11 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Must-do highlights</label>
              <textarea
                rows={4}
                value={formData.mustSee}
                onChange={(e) => setFormData({ ...formData, mustSee: e.target.value })}
                placeholder="Examples: beach day, temple visit, shopping street, family dinner"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Trip constraints</label>
              <textarea
                rows={4}
                value={formData.avoid}
                onChange={(e) => setFormData({ ...formData, avoid: e.target.value })}
                placeholder="Examples: low walking, avoid nightlife, kid-friendly only, no early mornings"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Extra trip notes</label>
            <textarea
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Anything the planner should know: birthday trip, elderly travelers, meal priorities, hotel area preference, etc."
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Compass className="h-4 w-4 text-indigo-500" />
              Trip brief checklist
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>Use trip destination, duration, and budget as the core brief</li>
              <li>Add dates when you already know them so the plan feels more concrete</li>
              <li>Use must-do items and constraints to avoid generic itinerary filler</li>
              <li>Transport and stay style help Compare give better alternatives later</li>
            </ul>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Generation status</p>
            {generating ? (
              <div className="mt-4 space-y-3">
                {generationSteps.map((step, index) => (
                  <div key={step} className={`rounded-2xl border px-4 py-3 text-sm ${index <= generationStepIndex ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-400'}`}>
                    <div className="flex items-center gap-2">
                      {index === generationStepIndex ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      <span>{step}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-slate-600">
                The generated trip draft will include a structured itinerary, budget direction, and details you can save or compare next.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={generateTrip}
              disabled={generating || !canGenerate}
              className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 py-3 text-white hover:from-sky-700 hover:to-indigo-700 disabled:opacity-50"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              {generating ? 'Generating trip...' : 'Generate AI Trip'}
            </Button>
            {onClose && (
              <Button type="button" onClick={onClose} variant="outline" className="rounded-xl py-3">
                Close
              </Button>
            )}
          </div>
        </aside>
      </CardContent>
    </Card>
  )
}
