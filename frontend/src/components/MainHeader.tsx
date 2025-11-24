import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Compass, Home, Globe, MapPin, Hotel, Car, Calendar, 
  Users, Bot, Search, Heart, User, ChevronDown, Menu, X,
  Bell, Settings, LogOut, BookOpen, Plane, Tag
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './Button'
import { DatabaseStatus } from './DatabaseStatus'

const navigationItems = [
  { id: 'home', label: 'Home', icon: Home, path: '/' },
  { id: 'discover', label: 'Explore', icon: Globe, path: '/places' },
  { id: 'planner', label: 'Plan Trip', icon: MapPin, path: '/trips' },
  { id: 'deals', label: 'Deals', icon: Tag, path: '/deals' },
  { id: 'community', label: 'Community', icon: Users, path: '/community' },
  { 
    id: 'transport', 
    label: 'Transport', 
    icon: Car, 
    path: '/transport'
  },
  { 
    id: 'services', 
    label: 'Travel Agent', 
    icon: Users, 
    path: '/services'
  },
  { 
    id: 'resources', 
    label: 'Help', 
    icon: BookOpen, 
    path: '/resources',
    dropdown: [
      { label: 'Blog', path: '/blog' },
      { label: 'Tips', path: '/tips' },
      { label: 'Support', path: '/help' }
    ]
  }
]

const languages = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'si', label: 'සිංහල', flag: '🇱🇰' },
  { code: 'ta', label: 'தமிழ்', flag: '🇱🇰' }
]

const mockSearchResults = [
  { type: 'destination', name: 'Paris, France', category: 'City' },
  { type: 'destination', name: 'Bali, Indonesia', category: 'Island' },
  { type: 'stay', name: 'Luxury Resort Paris', category: 'Hotel' },
  { type: 'event', name: 'Paris Fashion Week', category: 'Event' }
]

export const MainHeader: React.FC = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const [currentLanguage, setCurrentLanguage] = useState(languages[0])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])



  const handleLogout = () => {
    logout()
    setIsProfileOpen(false)
  }

  const handleLanguageChange = (lang: typeof languages[0]) => {
    setCurrentLanguage(lang)
    setIsLanguageOpen(false)
  }



  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-white/50' 
        : 'bg-black/30 backdrop-blur-sm'
    }`}>
      <div className="max-w-full mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16 lg:h-20">
          
          {/* Left: Brand Identity */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-3 group" title="TravelBuddy - Your Intelligent Travel Companion">
              <div className="relative w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-lg">
                <Compass className="w-7 h-7 text-white" />
                <div className="absolute inset-0 bg-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="hidden sm:block">
                <h1 className={`text-2xl font-bold transition-all duration-300 ${
                  isScrolled ? 'text-black' : 'text-white drop-shadow-lg'
                }`}>
                  TravelBuddy
                </h1>
                <p className={`text-xs font-medium transition-all duration-300 ${
                  isScrolled ? 'text-black/70' : 'text-white/90'
                }`}>
                  AI-Powered Travel Planner — Discover, Plan & Experience the World Effortlessly
                </p>
              </div>
            </Link>
          </div>

          {/* Center: Main Navigation (Desktop) */}
          <nav className="hidden lg:flex items-center space-x-4">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              const hasDropdown = item.dropdown && item.dropdown.length > 0
              
              return (
                <div key={item.id} className="relative">
                  {hasDropdown ? (
                    <button
                      onMouseEnter={() => setActiveDropdown(item.id)}
                      onMouseLeave={() => setActiveDropdown(null)}
                      className={`flex items-center space-x-2 px-5 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                        isActive
                          ? isScrolled 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-white/20 text-white'
                          : isScrolled
                            ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                            : 'text-white/90 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      <ChevronDown className="w-3 h-3" />
                      {isActive && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-current rounded-full"></div>
                      )}
                    </button>
                  ) : (
                    <Link
                      to={item.path}
                      className={`flex items-center space-x-2 px-5 py-3 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                        isActive
                          ? isScrolled 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-white/20 text-white'
                          : isScrolled
                            ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                            : 'text-white/90 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      {isActive && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-current rounded-full"></div>
                      )}
                    </Link>
                  )}
                  
                  {/* Dropdown Menu */}
                  {hasDropdown && activeDropdown === item.id && (
                    <div 
                      className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50"
                      onMouseEnter={() => setActiveDropdown(item.id)}
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      {item.dropdown?.map((dropItem) => (
                        <Link
                          key={dropItem.path}
                          to={dropItem.path}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          {dropItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Right: User Actions */}
          <div className="flex items-center space-x-5">

            


            {/* Notifications & Favorites */}
            {user && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`relative p-2 ${
                    isScrolled ? 'text-white hover:bg-white/10' : 'text-white hover:bg-white/10'
                  }`}
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`p-2 ${
                    isScrolled ? 'text-white hover:bg-white/10' : 'text-white hover:bg-white/10'
                  }`}
                  title="Saved Trips & Favorites"
                >
                  <Heart className="w-5 h-5" />
                </Button>
              </div>
            )}

            {/* Language Selector */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                className={`flex items-center space-x-2 px-3 py-2 text-sm ${
                  isScrolled ? 'text-white hover:bg-white/10' : 'text-white hover:bg-white/10'
                }`}
              >
                <span>{currentLanguage.flag}</span>
                <span>{currentLanguage.code.toUpperCase()}</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
              
              {isLanguageOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang)}
                      className={`flex items-center space-x-3 w-full px-4 py-2 text-sm text-left hover:bg-gray-100 transition-colors ${
                        currentLanguage.code === lang.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile / Login */}
            {user ? (
              <div className="relative">
                <Link
                  to="/profile"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-xl transition-all duration-200 ${
                    isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
                  }`}
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-500 rounded-full flex items-center justify-center ring-2 ring-white/20">
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium">
                      Hi, {user.username?.split(' ')[0] || user.email?.split('@')[0] || 'User'}!
                    </p>
                    <p className={`text-xs ${
                      isScrolled ? 'text-gray-500' : 'text-white/70'
                    }`}>
                      {user.tier || 'Free'} Plan
                    </p>
                  </div>
                </Link>


              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
                    }`}
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 px-6 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    Sign Up Free
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-2 ${
                isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
              }`}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Enhanced Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-white/95 backdrop-blur-md border-t border-gray-200 py-4">

            
            <nav className="space-y-1 px-4">
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
            
            {/* Mobile User Actions */}
            {!user && (
              <div className="px-4 pt-4 border-t border-gray-200 mt-4">
                <div className="flex space-x-3">
                  <Link to="/login" className="flex-1">
                    <Button variant="outline" className="w-full">
                      Login
                    </Button>
                  </Link>
                  <Link to="/register" className="flex-1">
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
