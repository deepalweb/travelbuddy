import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Compass, FolderHeart, GitCompareArrows } from 'lucide-react'

const plannerItems = [
  { label: 'Plan', path: '/trips', icon: Compass },
  { label: 'Compare', path: '/trips/compare', icon: GitCompareArrows },
  { label: 'Saved Plans', path: '/trips/saved', icon: FolderHeart },
]

export const PlannerWorkspaceNav: React.FC = () => {
  const location = useLocation()

  const isItemActive = (path: string) => {
    if (path === '/trips') {
      return location.pathname === '/trips'
    }

    return location.pathname === path
  }

  return (
    <div className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
        {plannerItems.map((item) => {
          const Icon = item.icon
          const isActive = isItemActive(item.path)

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
