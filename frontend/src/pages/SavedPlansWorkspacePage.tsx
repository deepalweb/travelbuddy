import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, FolderHeart, Heart, Layers3, Sparkles, Tags } from 'lucide-react'
import { PlannerWorkspaceNav } from '../components/PlannerWorkspaceNav'
import { Card, CardContent } from '../components/Card'
import { Button } from '../components/Button'

const organizationThemes = [
  { title: 'Food', description: 'Group meal-driven ideas and tasting priorities.', icon: Tags },
  { title: 'Culture', description: 'Keep heritage and story-rich ideas together.', icon: Layers3 },
  { title: 'Nature', description: 'Separate slower scenic stops from city-heavy days.', icon: Sparkles },
  { title: 'Must-do vs optional', description: 'Distinguish anchors from flexible additions.', icon: Heart },
]

export const SavedPlansWorkspacePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff8fb_0%,#ffffff_40%,#f8fafc_100%)]">
      <PlannerWorkspaceNav />

      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <div className="inline-flex items-center rounded-full bg-rose-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-rose-800">
              Saved Plans
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Organize saved ideas into something you can actually use.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              This workspace is where AI can later group saved ideas into themes like food, culture, nature,
              quick stops, and must-do priorities. For now it keeps the route map real and points users toward saved planning material.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to="/favorites">
                <Button className="bg-slate-900 text-white hover:bg-slate-800">
                  Open Favorites
                </Button>
              </Link>
              <Link to="/trips">
                <Button variant="outline">
                  Open Planner Workflow
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                <FolderHeart className="h-4 w-4" />
                Future AI organization
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {organizationThemes.map((theme) => {
                  const Icon = theme.icon
                  return (
                    <div key={theme.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                        <Icon className="h-4 w-4" />
                      </div>
                      <h2 className="mt-3 text-lg font-semibold text-slate-900">{theme.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{theme.description}</p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-8 text-center">
            <FolderHeart className="mx-auto h-12 w-12 text-rose-500" />
            <h2 className="mt-5 text-2xl font-semibold text-slate-900">Saved planning items live here next.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              The long-term goal is AI-assisted organization of saved ideas, grouped by planning themes and trip usefulness.
              Your current saved places and favorites can still be accessed while we shape that workspace.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/favorites">
                <Button className="bg-rose-600 text-white hover:bg-rose-700">Open Favorites</Button>
              </Link>
              <Link to="/discovery">
                <Button variant="outline">
                  Start New Plan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
