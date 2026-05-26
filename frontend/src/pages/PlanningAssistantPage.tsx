import React from 'react'
import { Bot, Compass, DollarSign, HeartHandshake, LoaderCircle, MoonStar, Sparkles, TimerReset } from 'lucide-react'
import { PlannerWorkspaceNav } from '../components/PlannerWorkspaceNav'
import { Card, CardContent } from '../components/Card'
import { Button } from '../components/Button'
import { Link } from 'react-router-dom'

const promptGroups = [
  'Where should I go for a 4-day food-focused trip on a medium budget?',
  'How can I make this itinerary less tiring for my parents?',
  'What should I cut from this plan if I only have 2 days?',
  'How do I make this trip feel more romantic without doubling the budget?',
  'What should I prioritize if rain affects one of my days?',
  'Which parts of this draft need advance booking first?',
]

const quickActions = [
  { title: 'Decision support', icon: Compass },
  { title: 'Budget balancing', icon: DollarSign },
  { title: 'Romantic refinement', icon: HeartHandshake },
  { title: 'Rainy-day swaps', icon: MoonStar },
  { title: 'Pacing fixes', icon: TimerReset },
  { title: 'Instant clarifications', icon: Sparkles },
]

export const PlanningAssistantPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_45%,#f8fafc_100%)]">
      <PlannerWorkspaceNav />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-slate-200 bg-slate-950 text-white shadow-2xl shadow-slate-200/40">
            <CardContent className="p-7">
              <div className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                After You Save
              </div>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight">Ask the planner what to do next.</h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/75">
                This surface supports a trip after the main workflow. Use it to refine a saved draft, resolve
                uncertainty, or ask for cheaper, lighter, more romantic, or more weather-safe alternatives.
              </p>

              <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-3">
                  <LoaderCircle className="h-5 w-5 animate-spin text-sky-300" />
                  <p className="text-sm font-medium text-white">Assistant UI can be wired next to your existing AI trip services.</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  For now, this route establishes the screen architecture and the kinds of questions the assistant should handle.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/trips">
                  <Button className="bg-white text-slate-950 hover:bg-slate-100">
                    Open Trips
                  </Button>
                </Link>
                <Link to="/trips">
                  <Button className="border border-white/15 bg-white/10 text-white hover:bg-white/15">
                    Back To Planner
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <Bot className="h-4 w-4" />
                  Example prompts
                </div>
                <div className="mt-5 grid gap-3">
                  {promptGroups.map((prompt) => (
                    <div key={prompt} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      {prompt}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {quickActions.map((item) => {
                const Icon = item.icon
                return (
                  <Card key={item.title} className="border-slate-200 bg-white shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h2 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h2>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
