import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Briefcase, ClipboardList, CloudRain, ShieldCheck, Ticket, Utensils } from 'lucide-react'
import { Button } from '../components/Button'
import { Card, CardContent } from '../components/Card'
import { PlannerWorkspaceNav } from '../components/PlannerWorkspaceNav'

const prepCards = [
  {
    title: 'Packing lists',
    description: 'Generate packing guidance based on trip style, pace, climate, and traveler type.',
    icon: Briefcase,
  },
  {
    title: 'Booking checklist',
    description: 'See what to book first, what can wait, and which decisions affect the rest of the itinerary.',
    icon: Ticket,
  },
  {
    title: 'Rainy-day backups',
    description: 'Get lower-risk swaps and indoor alternatives when weather or energy levels change.',
    icon: CloudRain,
  },
  {
    title: 'Culture and etiquette',
    description: 'Use AI summaries for local etiquette, respectful behavior, and practical social cues.',
    icon: ShieldCheck,
  },
  {
    title: 'Food priorities',
    description: 'Highlight cuisine goals and eating windows so meals support the trip instead of disrupting it.',
    icon: Utensils,
  },
  {
    title: 'Trip readiness',
    description: 'Turn a draft into a pre-departure checklist with clearer next actions and fewer missed tasks.',
    icon: ClipboardList,
  },
]

export const PlanningPreparePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffdf7_0%,#ffffff_42%,#f8fafc_100%)]">
      <PlannerWorkspaceNav />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">
            After You Save
          </div>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Use AI to prepare a saved trip for departure.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Preparation comes after the workflow is complete. Once a plan is saved, this space helps with packing,
            booking order, etiquette notes, and backup logic rather than treating preparation as a separate starting tool.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link to="/trips">
              <Button className="bg-slate-900 text-white hover:bg-slate-800">
                Open Trip Builder
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/trips/assistant">
              <Button variant="outline">Ask The Planning Assistant</Button>
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {prepCards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.title} className="border-slate-200 bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="mt-4 text-xl font-semibold text-slate-900">{card.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{card.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
