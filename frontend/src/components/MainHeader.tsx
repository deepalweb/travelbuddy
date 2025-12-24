import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Compass, Home, Globe, MapPin, Hotel, Car, Calendar, 
  Users, Bot, Search, Heart, User, ChevronDown, Menu, X,
  Bell, Settings, LogOut, BookOpen, Plane, Tag, Mail
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './Button'
import { DatabaseStatus } from './DatabaseStatus'

const navigationItems = [
  { id: 'home', label: 'Home', icon: Home, path: '/' },
  { id: 'discover', label: 'Destinations', icon: Globe, path: '/places' },
  { id: 'planner', label: 'Trip Planner', icon: MapPin, path: '/trips' },
  { id: 'deals', label: 'Deals', icon: Tag, path: '/deals' },
  { id: 'news', label: 'News', icon: BookOpen, path: '/news' },
  { id: 'community', label: 'Community', icon: Users, path: '/community' },
  { 
    id: 'more', 
    label: 'More', 
    icon: ChevronDown, 
    path: '#',
    dropdown: [
      { label: 'Events', path: '/events', icon: Calendar },
      { label: 'Transport Hub', path: '/transport', icon: Car },
      { label: 'Find an Agent', path: '/services', icon: Users },
      { label: 'About Us', path: '/about', icon: BookOpen },
      { label: 'Contact Us', path: '/contact', icon: Mail },
      { label: 'Help Center', path: '/help', icon: BookOpen }
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
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState(languages[0])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.dropdown-container')) {
        setActiveDropdown(null)
        setShowProfileMenu(false)
        setIsLanguageOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
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
                <div className="flex items-center space-x-2">
                  <h1 className={`text-2xl font-bold transition-all duration-300 ${
                    isScrolled ? 'text-black' : 'text-white drop-shadow-lg'
                  }`}>
                    TravelBuddy
                  </h1>
                  <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded-full">Beta</span>
                </div>
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
                <div key={item.id} className="relative dropdown-container">
                  {hasDropdown ? (
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 relative ${
                        isActive
                          ? isScrolled 
                            ? 'text-blue-600 font-semibold' 
                            : 'text-white font-semibold'
                          : isScrolled
                            ? 'text-gray-700 hover:text-gray-900'
                            : 'text-white/90 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      {isActive && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                      )}
                    </button>
                  ) : (
                    <Link
                      to={item.path}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 relative ${
                        isActive
                          ? isScrolled 
                            ? 'text-blue-600 font-semibold' 
                            : 'text-white font-semibold'
                          : isScrolled
                            ? 'text-gray-700 hover:text-gray-900'
                            : 'text-white/90 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      {isActive && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                      )}
                    </Link>
                  )}
                  
                  {/* Dropdown Menu */}
                  {hasDropdown && activeDropdown === item.id && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                      {item.dropdown?.map((dropItem) => {
                        const DropIcon = dropItem.icon
                        return (
                          <Link
                            key={dropItem.path}
                            to={dropItem.path}
                            onClick={() => setActiveDropdown(null)}
                            className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            {DropIcon && <DropIcon className="w-4 h-4 text-gray-500" />}
                            <span>{dropItem.label}</span>
                          </Link>
                        )
                      })}
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
                    isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
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
                    isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
                  }`}
                  title="Saved Trips & Favorites"
                >
                  <Heart className="w-5 h-5" />
                </Button>
              </div>
            )}

            {/* Language Selector */}
            <div className="relative hidden md:block dropdown-container">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium ${
                  isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
                }`}
              >
                <span>{currentLanguage.flag}</span>
                <span>{currentLanguage.code.toUpperCase()}</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
              
              {isLanguageOpen && (
                <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
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
              <div className="relative dropdown-container">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className={`flex items-center space-x-2 px-2 py-2 rounded-full transition-all duration-200 ${
                    isScrolled ? 'hover:bg-gray-100' : 'hover:bg-white/10'
                  }`}
                >
                  <div className="relative w-9 h-9 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" title="Online" />
                  </div>
                  <span className={`hidden lg:block text-sm font-medium ${
                    isScrolled ? 'text-gray-700' : 'text-white'
                  }`}>
                    {(user as any).fullName?.split(' ')[0] || user.email?.split('@')[0] || 'User'}
                  </span>
                </button>

                {/* Profile Quick Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                    <Link 
                      to="/profile" 
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">My Profile</span>
                    </Link>
                    <Link 
                      to="/trips" 
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">My Trips</span>
                    </Link>
                    <Link 
                      to="/community" 
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <Heart className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Saved Places</span>
                    </Link>
                    <Link 
                      to="/profile" 
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Settings</span>
                    </Link>
                    <div className="border-t border-gray-200 my-2" />
                    <button onClick={handleLogout} className="flex items-center space-x-3 px-4 py-3 hover:bg-red-50 transition-colors w-full text-left">
                      <LogOut className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600">Logout</span>
                    </button>
                  </div>
                )}
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
            
            {/* Mobile Quick Actions */}
            {user && (
              <div className="px-4 pb-4 mb-4 border-b border-gray-200">
                <div className="grid grid-cols-2 gap-3">
                  <Link to="/trips" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-50 rounded-xl text-blue-700 font-medium text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>Plan Trip</span>
                  </Link>
                  <Link to="/community" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-50 rounded-xl text-purple-700 font-medium text-sm">
                    <Heart className="w-4 h-4" />
                    <span>Saved</span>
                  </Link>
                </div>
              </div>
            )}
            
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
