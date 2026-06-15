import React, { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowRight,
  Bell,
  ChevronDown,
  ClipboardList,
  Compass,
  Heart,
  LogOut,
  Menu,
  Settings,
  Tag,
  User,
  Users,
  Calendar,
  Car,
  Crown,
  Globe2,
  Map,
  MapPin,
  Sparkles,
  X,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './Button'

type NavigationItem = {
  id: string
  label: string
  path?: string
  icon?: React.ComponentType<{ className?: string }>
  highlight?: string
  dropdown?: Array<{
    label: string
    path: string
    icon?: React.ComponentType<{ className?: string }>
    description?: string
  }>
}

const navigationItems: NavigationItem[] = [
  { id: 'home', label: 'Home', path: '/', icon: Compass },
  { id: 'discover', label: 'Discover', path: '/discovery', icon: Globe2 },
  {
    id: 'trips',
    label: 'Trips',
    icon: ChevronDown,
    highlight: 'AI',
    dropdown: [
      {
        label: 'Create a Trip',
        path: '/trips',
        icon: Sparkles,
        description: 'Build a realistic itinerary around your destination and travel style.',
      },
      {
        label: 'Saved Trips',
        path: '/trips?view=saved',
        icon: ClipboardList,
        description: 'Continue planning or review trips you have already saved.',
      },
    ],
  },
  {
    id: 'explore',
    label: 'Explore',
    icon: ChevronDown,
    dropdown: [
      {
        label: 'Deals',
        path: '/deals',
        icon: Tag,
        description: 'Browse useful travel offers and limited-time savings.',
      },
      {
        label: 'Community',
        path: '/community',
        icon: Users,
        description: 'See real trips, stories, and ideas from other travelers.',
      },
      {
        label: 'Events',
        path: '/events',
        icon: Calendar,
        description: 'Find happenings worth planning around.',
      },
      {
        label: 'Transport Hub',
        path: '/transport',
        icon: Car,
        description: 'Compare practical ways to move through the trip.',
      },
      {
        label: 'Travel Agents',
        path: '/services',
        icon: Users,
        description: 'Get human help when you need it.',
      },
      {
        label: 'About TravelBuddy',
        path: '/about',
        icon: Compass,
        description: 'Learn how we help travelers make more confident decisions.',
      },
      {
        label: 'Help & Contact',
        path: '/contact',
        icon: Bell,
        description: 'Get support or speak with the TravelBuddy team.',
      },
    ],
  },
]

export const MainHeader: React.FC = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24)
    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.tb-dropdown')) {
        setActiveDropdown(null)
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  useEffect(() => {
    setActiveDropdown(null)
    setShowProfileMenu(false)
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const isNavItemActive = (path?: string) => {
    if (!path) return false
    const [pathname, queryString] = path.split('?')
    if (queryString && location.pathname === pathname) {
      return new URLSearchParams(location.search).toString() === new URLSearchParams(queryString).toString()
    }
    if (pathname === '/trips') {
      if (location.pathname.startsWith('/trips/')) return true
      return location.pathname === '/trips' && !new URLSearchParams(location.search).has('view')
    }
    return location.pathname === pathname
  }

  const activeDropdownIds = useMemo(
    () => new Set(
      navigationItems
        .filter((item) => item.dropdown?.some((entry) => isNavItemActive(entry.path)))
        .map((item) => item.id)
    ),
    [location.pathname]
  )

  const handleLogout = () => {
    logout()
    setShowProfileMenu(false)
    setIsMobileMenuOpen(false)
  }

  const isHomeRoute = location.pathname === '/' || location.pathname === '/home'
  const useLightHeader = isScrolled || !isHomeRoute
  const headerTone = useLightHeader
    ? 'border-white/70 bg-[rgba(249,249,246,0.88)] shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl'
    : 'border-white/20 bg-[rgba(9,16,29,0.52)] backdrop-blur-md'

  const navTone = useLightHeader ? 'text-slate-600 hover:bg-white hover:text-slate-950' : 'text-white/78 hover:bg-white/10 hover:text-white'
  const activeTone = useLightHeader ? 'bg-slate-950 text-white shadow-sm' : 'bg-white text-slate-950 shadow-sm'
  const accountName = (user as any)?.fullName?.split(' ')[0] || user?.username?.split(' ')[0] || user?.email?.split('@')[0] || 'Traveler'
  const accountRole = (user as any)?.activeRole || user?.role || 'Traveler'
  const accountTier = user?.tier || 'free'

  return (
    <header className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${headerTone}`}>
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,#0f172a,#155e75)] shadow-[0_10px_25px_rgba(8,15,34,0.28)]">
            <Compass className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className={`font-heading text-lg font-semibold tracking-tight ${useLightHeader ? 'text-slate-950' : 'text-white'}`}>
              TravelBuddy
            </p>
            <p className={`text-xs uppercase tracking-[0.24em] ${useLightHeader ? 'text-slate-500' : 'text-white/58'}`}>
              Decide. Plan. Go.
            </p>
          </div>
        </Link>

        <nav className={`hidden items-center gap-1 rounded-full border p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur lg:flex ${
          useLightHeader ? 'border-slate-200/80 bg-white/75' : 'border-white/12 bg-white/6'
        }`}>
          {navigationItems.map((item) => {
            const isActive = item.dropdown?.length ? activeDropdownIds.has(item.id) : isNavItemActive(item.path)

            if (item.dropdown?.length) {
              return (
                <div key={item.id} className="tb-dropdown relative">
                  <button
                    type="button"
                    onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                      isActive ? activeTone : navTone
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === item.id ? 'rotate-180' : ''}`} />
                  </button>

                  {activeDropdown === item.id && (
                    <div className="absolute right-0 top-full mt-3 w-[340px] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-[0_22px_60px_rgba(15,23,42,0.18)]">
                      {item.dropdown.map((entry) => {
                        const Icon = entry.icon
                        return (
                          <Link
                            key={entry.path}
                            to={entry.path}
                            onClick={() => setActiveDropdown(null)}
                            className="flex items-start gap-3 rounded-[1.1rem] px-4 py-3 transition-colors hover:bg-slate-50"
                          >
                            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                              {Icon && <Icon className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{entry.label}</p>
                              <p className="mt-1 text-sm leading-6 text-slate-500">{entry.description}</p>
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.id}
                to={item.path || '/'}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                  isActive ? activeTone : navTone
                }`}
              >
                {item.highlight && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                    isActive ? 'bg-black/10 text-current' : useLightHeader ? 'bg-slate-900/8 text-slate-500' : 'bg-white/10 text-white/70'
                  }`}>
                    {item.highlight}
                  </span>
                )}
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Link
                to="/notifications"
                className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all ${
                  useLightHeader
                    ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    : 'border-white/18 bg-white/8 text-white hover:bg-white/12'
                }`}
              >
                <Bell className="h-4 w-4" />
              </Link>
              <Link
                to="/favorites"
                className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all ${
                  useLightHeader
                    ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    : 'border-white/18 bg-white/8 text-white hover:bg-white/12'
                }`}
              >
                <Heart className="h-4 w-4" />
              </Link>
              <div className="tb-dropdown relative">
                <button
                  type="button"
                  onClick={() => setShowProfileMenu((value) => !value)}
                  className={`flex items-center gap-3 rounded-full border px-3 py-2 transition-all ${
                    useLightHeader
                      ? 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50'
                      : 'border-white/18 bg-white/8 text-white hover:bg-white/12'
                  }`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(145deg,#155e75,#0f172a)] text-white">
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt="Profile" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="max-w-24 truncate text-sm font-semibold">{accountName}</p>
                    <p className={`text-xs capitalize ${useLightHeader ? 'text-slate-500' : 'text-white/60'}`}>{accountRole.replace('_', ' ')}</p>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-3 w-[320px] overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-2 shadow-[0_26px_70px_rgba(15,23,42,0.2)]">
                    <div className="rounded-[1.35rem] bg-[linear-gradient(135deg,#0f172a,#164e63)] p-4 text-white">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/12">
                          {user.profilePicture ? (
                            <img src={user.profilePicture} alt={accountName} className="h-full w-full object-cover" />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{accountName}</p>
                          <p className="mt-0.5 truncate text-xs text-white/58">{user.email}</p>
                        </div>
                        <span className="rounded-full bg-amber-300 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-slate-950">
                          {accountTier}
                        </span>
                      </div>
                    </div>

                    <p className="px-3 pb-1 pt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Your travel</p>
                    <div className="grid grid-cols-2 gap-1">
                      <Link to="/trips?view=saved" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-2 rounded-[1rem] px-3 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                        <Map className="h-4 w-4 text-sky-600" />
                        Saved trips
                      </Link>
                      <Link to="/favorites" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-2 rounded-[1rem] px-3 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                        <Heart className="h-4 w-4 text-rose-500" />
                        Favorites
                      </Link>
                    </div>

                    <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Account</p>
                    <Link to="/profile" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 rounded-[1rem] px-3 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-50">
                      <User className="h-4 w-4" />
                      <span>View profile</span>
                    </Link>
                    <Link to="/preferences" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 rounded-[1rem] px-3 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-50">
                      <MapPin className="h-4 w-4" />
                      <span>Travel preferences</span>
                    </Link>
                    <Link to="/settings" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 rounded-[1rem] px-3 py-3 text-sm text-slate-700 transition-colors hover:bg-slate-50">
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                    <div className="my-2 border-t border-slate-100" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center justify-between rounded-[1rem] px-3 py-3 text-left text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                    >
                      <span className="flex items-center gap-3"><LogOut className="h-4 w-4" /> Sign out</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className={useLightHeader ? 'text-slate-700 hover:bg-slate-100' : 'text-white hover:bg-white/10'}>
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button className="rounded-full bg-[linear-gradient(135deg,#f97316,#fb7185)] px-5 text-white shadow-[0_16px_36px_rgba(249,115,22,0.28)] hover:opacity-95">
                  Find My Trip
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((value) => !value)}
          className={`flex h-11 w-11 items-center justify-center rounded-full border lg:hidden ${
            useLightHeader
              ? 'border-slate-200 bg-white text-slate-800'
              : 'border-white/18 bg-white/8 text-white'
          }`}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t border-white/10 bg-[rgba(247,246,242,0.96)] px-4 py-4 backdrop-blur-xl lg:hidden">
          <div className="mx-auto max-w-7xl space-y-3">
            {navigationItems.map((item) => {
              const isActive = item.dropdown?.length ? activeDropdownIds.has(item.id) : isNavItemActive(item.path)

              if (item.dropdown?.length) {
                return (
                  <div key={item.id} className="overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white">
                    <button
                      type="button"
                      onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                      className="flex w-full items-center justify-between px-4 py-3.5 text-sm font-semibold text-slate-800"
                    >
                      <span>{item.label}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === item.id ? 'rotate-180' : ''}`} />
                    </button>
                    {activeDropdown === item.id && (
                      <div className="space-y-1 px-2 pb-2">
                        {item.dropdown.map((entry) => {
                          const Icon = entry.icon
                          return (
                            <Link
                              key={entry.path}
                              to={entry.path}
                              onClick={() => {
                                setIsMobileMenuOpen(false)
                                setActiveDropdown(null)
                              }}
                              className={`flex items-center gap-3 rounded-[1rem] px-4 py-3 text-sm ${
                                isNavItemActive(entry.path) ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {Icon && <Icon className="h-4 w-4" />}
                              <span>{entry.label}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <Link
                  key={item.id}
                  to={item.path || '/'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block rounded-[1.4rem] border px-4 py-3.5 text-sm font-semibold ${
                    isActive
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-800'
                  }`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span>{item.label}</span>
                    {item.highlight && (
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                        isActive ? 'bg-white/12 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.highlight}
                      </span>
                    )}
                  </span>
                </Link>
              )
            })}

            <div className="pt-3">
              {user ? (
                <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-2">
                  <div className="flex items-center gap-3 rounded-[1.15rem] bg-slate-950 p-4 text-white">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/10">
                      {user.profilePicture ? (
                        <img src={user.profilePicture} alt={accountName} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{accountName}</p>
                      <p className="truncate text-xs text-white/55">{user.email}</p>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-amber-300 px-2 py-1 text-[9px] font-black uppercase text-slate-950">
                      <Crown className="h-3 w-3" />
                      {accountTier}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    {[
                      { label: 'Profile', path: '/profile', icon: User },
                      { label: 'Saved Trips', path: '/trips?view=saved', icon: Map },
                      { label: 'Favorites', path: '/favorites', icon: Heart },
                      { label: 'Settings', path: '/settings', icon: Settings },
                    ].map((entry) => {
                      const Icon = entry.icon
                      return (
                        <Link
                          key={entry.path}
                          to={entry.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-2 rounded-[1rem] px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Icon className="h-4 w-4" />
                          {entry.label}
                        </Link>
                      )
                    })}
                  </div>
                  <button type="button" onClick={handleLogout} className="mt-1 flex w-full items-center justify-center gap-2 rounded-[1rem] bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full border-slate-300 text-slate-800 hover:bg-slate-100">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full rounded-full bg-[linear-gradient(135deg,#f97316,#fb7185)] text-white shadow-[0_16px_36px_rgba(249,115,22,0.24)]">
                      Find My Trip
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
