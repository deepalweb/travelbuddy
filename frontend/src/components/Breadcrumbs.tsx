import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export const Breadcrumbs: React.FC = () => {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter(x => x)

  if (pathnames.length === 0) return null

  const formatName = (name: string) => {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 py-4 px-4 max-w-7xl mx-auto" aria-label="Breadcrumb">
      <Link to="/" className="hover:text-blue-600 flex items-center gap-1">
        <Home className="w-4 h-4" />
        <span>Home</span>
      </Link>
      {pathnames.map((name, index) => {
        const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`
        const isLast = index === pathnames.length - 1
        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="w-4 h-4" />
            {isLast ? (
              <span className="font-semibold text-gray-900">{formatName(name)}</span>
            ) : (
              <Link to={routeTo} className="hover:text-blue-600">
                {formatName(name)}
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
