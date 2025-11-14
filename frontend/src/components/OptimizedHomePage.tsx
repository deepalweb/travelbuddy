import React, { useState, useEffect, lazy, Suspense } from 'react'

// Enhanced custom CSS for animations
const customStyles = `
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slide-in-left {
    from {
      opacity: 0;
      transform: translateX(-80px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes slide-in-right {
    from {
      opacity: 0;
      transform: translateX(80px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes message-in {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  @keyframes nav-in {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes feature-in {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes buttons-in {
    from {
      opacity: 0;
      transform: translateY(40px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes pulse-glow {
    0%, 100% {
      opacity: 0.3;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(1.1);
    }
  }
  
  @keyframes pulse-slow {
    0%, 100% {
      opacity: 0.3;
    }
    50% {
      opacity: 0.5;
    }
  }
  
  .animate-fade-in-up {
    animation: fade-in-up 0.8s ease-out both;
  }
  
  .animate-slide-in-left {
    animation: slide-in-left 1s ease-out both;
  }
  
  .animate-slide-in-right {
    animation: slide-in-right 1s ease-out both;
  }
  
  .animate-message-in {
    animation: message-in 0.6s ease-out both;
  }
  
  .animate-nav-in {
    animation: nav-in 0.8s ease-out both;
  }
  
  .animate-feature-in {
    animation: feature-in 0.6s ease-out both;
  }
  
  .animate-buttons-in {
    animation: buttons-in 0.8s ease-out both;
  }
  
  .animate-pulse-glow {
    animation: pulse-glow 4s ease-in-out infinite;
  }
  
  .animate-pulse-slow {
    animation: pulse-slow 6s ease-in-out infinite;
  }
  
  .phone-tilt-container {
    perspective: 1000px;
  }
  
  .phone-tilt-container:hover > div {
    transform: rotateY(-5deg) rotateX(2deg) scale(1.02);
  }
`
import { Link } from 'react-router-dom'
import { Search, ArrowRight, MapPin, Star, Calendar, Plane, Hotel, DollarSign, Sparkles, Clock } from 'lucide-react'
import { Button } from './Button'
import { Card, CardContent } from './Card'
import { ImageWithFallback } from './ImageWithFallback'
import { useUserLocation } from '../hooks/useUserLocation'
import { SEOHead } from './SEOHead'
import { useAuth } from '../contexts/AuthContext'

// Lazy load heavy components
const LazyDestinationGrid = lazy(() => import('./LazyDestinationGrid'))
const LazyDealsSection = lazy(() => import('./LazyDealsSection'))

// Loading component
const SectionLoader = () => (
  <div className="flex justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
)

// Worldwide unique destinations data
const featuredDestinations = [
  {
    id: 1,
    name: 'Torres del Paine',
    country: 'Chile',
    image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop&auto=format&q=60',
    rating: 4.9,
    price: 'Free to start',
    popular: true,
    type: 'hiking'
  },
  {
    id: 2,
    name: 'Whitehaven Beach',
    country: 'Australia', 
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop&auto=format&q=60',
    rating: 4.8,
    price: 'Free to start',
    popular: true,
    type: 'beach'
  },
  {
    id: 3,
    name: 'Hallstatt',
    country: 'Austria',
    image: 'https://images.unsplash.com/photo-1527838832700-5059252407fa?w=400&h=300&fit=crop&auto=format&q=60',
    rating: 4.7,
    price: 'Free to start',
    trending: true,
    type: 'town'
  }
]

const quickDeals = [
  {
    id: 1,
    title: 'AI Trip Planning',
    discount: 'FREE',
    description: 'Create unlimited personalized itineraries',
    urgent: true
  },
  {
    id: 2,
    title: 'Premium Features',
    discount: '$9.99/month', 
    description: 'Advanced AI insights & offline maps',
    urgent: false
  }
]

// User testimonials and social proof
const socialProof = {
  totalUsers: '50,000+',
  tripsPlanned: '125,000+',
  testimonials: [
    {
      name: 'Sarah Chen',
      location: 'Singapore',
      text: 'TravelBuddy helped me discover amazing local cafes in Tokyo I would never have found!',
      rating: 5
    },
    {
      name: 'Michael Rodriguez',
      location: 'Barcelona',
      text: 'The AI recommendations were spot-on. Saved me hours of research for my Thailand trip.',
      rating: 5
    }
  ]
}

export const OptimizedHomePage: React.FC = () => {
  const { location } = useUserLocation()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    setTimeout(() => {
      setIsSearching(false)
      window.location.href = `/places?q=${encodeURIComponent(searchQuery)}`
    }, 500)
  }

  return (
    <div className="min-h-screen">
      <SEOHead />
      <style>{customStyles}</style>
      {/* 1. SEO + App-Focused Hero Section */}
      <section className="relative h-screen bg-gradient-to-b from-blue-600 via-indigo-700 to-purple-800 overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&auto=format&q=80"
            fallbackSrc="https://picsum.photos/1920/1080?random=1"
            alt="Travel essentials - map, camera, passport and planning items"
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent"></div>
        
        <div className="relative z-10 h-screen flex items-center px-4 py-8">
          <div className="w-full max-w-7xl mx-auto">
            {/* Compact Header */}
            <div className="text-center text-white mb-8">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                {user ? `Welcome back, ${user.name || 'Explorer'}!` : 'Discover the World with Travel Buddy'}
                <span className="block text-yellow-400">
                  {user ? 'Ready for your next adventure?' : 'Your AI Travel Planner'}
                </span>
              </h1>
              <h2 className="text-lg md:text-xl mb-6 text-white/90 max-w-2xl mx-auto">
                {user ? 'Plan your next trip with AI-powered recommendations' : 'Join 50,000+ travelers who\'ve planned 125,000+ trips with AI.'}
              </h2>
            </div>
            
            {/* Mobile App Promotion - Compact Layout */}
            <div className="grid lg:grid-cols-2 gap-8 items-center">
                  
                  {/* Left: Compact Phone Mockup */}
                  <div className="relative flex justify-center lg:justify-end animate-slide-in-left">
                    {/* Gradient Glow Behind Phone */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-2xl animate-pulse-glow"></div>
                    
                    {/* Phone Mockup */}
                    <div className="relative phone-tilt-container">
                      <div className="relative w-64 h-[520px] bg-gradient-to-b from-gray-900 to-black rounded-[3rem] p-2 shadow-xl transform hover:scale-105 transition-all duration-500">
                        {/* Phone Frame */}
                        <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                          {/* Status Bar */}
                          <div className="bg-gray-900 h-8 flex items-center justify-between px-6 text-white text-xs">
                            <span className="font-medium">9:41</span>
                            <div className="flex gap-1">
                              <div className="w-4 h-2 bg-white rounded-sm"></div>
                              <div className="w-1 h-2 bg-white rounded-sm"></div>
                            </div>
                          </div>
                          
                          {/* Places Screen Interface */}
                          <div className="bg-gray-50 h-full relative overflow-hidden">
                            {/* Header */}
                            <div className="bg-white p-3 border-b border-gray-200">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-lg font-bold text-gray-900">Explore Places</h4>
                                <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                  </svg>
                                </div>
                              </div>
                              
                              {/* Personalized Greeting */}
                              <div className="mb-3">
                                <p className="text-sm font-medium text-gray-800">Good morning! 👋 Ready to explore?</p>
                                <div className="mt-2 bg-blue-50 px-3 py-2 rounded-full border border-blue-200 inline-block">
                                  <p className="text-xs text-blue-700 font-medium">AI suggests: Museums & Parks nearby 🎨</p>
                                </div>
                              </div>
                              
                              {/* Search Bar */}
                              <div className="relative mb-3">
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                                </div>
                                <input 
                                  className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm" 
                                  placeholder="Search places..."
                                  readOnly
                                />
                              </div>
                              
                              {/* Category Filters */}
                              <div className="flex gap-2 overflow-x-auto">
                                <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">All</div>
                                <div className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">Food</div>
                                <div className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">Culture</div>
                                <div className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">Nature</div>
                              </div>
                            </div>
                            
                            {/* Places Grid - Compact */}
                            <div className="flex-1 p-3 pb-14 overflow-y-auto">
                              <div className="space-y-3">
                                {/* Place Card 1 */}
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 animate-message-in" style={{animationDelay: '1s'}}>
                                  <div className="relative">
                                    <div className="h-20 rounded-t-lg relative overflow-hidden">
                                      <img 
                                        src="https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=300&h=200&fit=crop&auto=format&q=80" 
                                        alt="Eiffel Tower" 
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/10"></div>
                                      <div className="absolute top-2 right-2 flex flex-col gap-1">
                                        <div className="w-5 h-5 bg-white/90 rounded-full flex items-center justify-center">
                                          <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                          </svg>
                                        </div>
                                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                          <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="p-2">
                                      <h5 className="font-bold text-xs text-gray-900 mb-1">Eiffel Tower</h5>
                                      <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                          <svg className="w-2 h-2 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                          </svg>
                                          <span className="text-xs font-medium">4.8</span>
                                        </div>
                                        <span className="text-xs text-gray-500">Landmark</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Discover More Section */}
                                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-3 text-white animate-message-in" style={{animationDelay: '1.2s'}}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <h5 className="font-bold text-xs mb-1">Discover 50+ Places</h5>
                                      <p className="text-xs text-white/90">AI-powered recommendations</p>
                                    </div>
                                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Bottom Navigation */}
                            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2 animate-nav-in" style={{animationDelay: '2s'}}>
                              <div className="flex justify-around">
                                <div className="text-blue-500 text-xs text-center">
                                  <div className="w-5 h-5 mx-auto mb-1 bg-blue-100 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                                    </svg>
                                  </div>
                                  <span className="font-medium">Places</span>
                                </div>
                                <div className="text-gray-400 text-xs text-center">
                                  <div className="w-5 h-5 mx-auto mb-1 bg-gray-100 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M20 6L9 17l-5-5"/>
                                    </svg>
                                  </div>
                                  <span>Trips</span>
                                </div>
                                <div className="text-gray-400 text-xs text-center">
                                  <div className="w-5 h-5 mx-auto mb-1 bg-gray-100 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 2 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                    </svg>
                                  </div>
                                  <span>Profile</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Enhanced Phone Reflection */}
                        <div className="absolute -bottom-4 left-3 right-3 h-12 bg-gradient-to-b from-black/30 to-transparent rounded-[3rem] blur-2xl"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right: Compact Content */}
                  <div className="space-y-4 animate-slide-in-right">
                    {/* Main Headline */}
                    <div className="animate-fade-in-up" style={{animationDelay: '0.5s'}}>
                      <h3 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-2">
                        Get the
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                          TravelBuddy App
                        </span>
                      </h3>
                      <p className="text-lg text-white/90">
                        Your AI travel assistant in your pocket
                      </p>
                    </div>
                    
                    {/* Compact Features */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-white/90 hover:text-white transition-all duration-300 group/feature animate-feature-in" style={{animationDelay: '1s'}}>
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover/feature:scale-110 transition-all duration-300">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold">Smart AI Trip Planning</div>
                          <div className="text-sm text-white/70">Saves 3+ hours by analyzing your preferences instantly</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-white/90 hover:text-white transition-all duration-300 group/feature animate-feature-in" style={{animationDelay: '1.2s'}}>
                        <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover/feature:scale-110 transition-all duration-300">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold">Hidden Gem Discovery</div>
                          <div className="text-sm text-white/70">AI finds local spots 90% of tourists miss</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 text-white/90 hover:text-white transition-all duration-300 group/feature animate-feature-in" style={{animationDelay: '1.4s'}}>
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover/feature:scale-110 transition-all duration-300">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold">Real-time Budget Optimization</div>
                          <div className="text-sm text-white/70">Automatically finds deals saving average $200/trip</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Web App CTA */}
                    <div className="animate-buttons-in" style={{animationDelay: '1.8s'}}>
                      <p className="text-white/90 text-sm mb-3">Available as web app - no download needed!</p>
                      <Link to={user ? "/trips" : "/register"}>
                        <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105">
                          {user ? "Start Planning" : "Try It Free"}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
            
            {/* Secondary CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
              {user ? (
                <>
                  <Link to="/trips">
                    <Button className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white hover:text-gray-900 px-6 py-3 rounded-xl transition-all duration-300">
                      Start Trip Planning
                    </Button>
                  </Link>
                  <Link to="/places">
                    <Button className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-xl font-semibold transition-all duration-300">
                      Explore Destinations
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/register">
                    <Button className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-xl font-semibold transition-all duration-300">
                      Get Started Free
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white hover:text-gray-900 px-6 py-3 rounded-xl transition-all duration-300">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Destinations */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Discover Hidden Gems Worldwide
            </h2>
            <p className="text-xl text-gray-600">
              AI-curated unique destinations loved by 50,000+ travelers
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {featuredDestinations.map((destination) => (
              <Card key={destination.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="relative">
                  <ImageWithFallback
                    src={destination.image}
                    fallbackSrc={`https://picsum.photos/400/300?random=${destination.id}`}
                    alt={destination.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {destination.popular && (
                    <div className="absolute top-4 left-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  )}
                  {destination.trending && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Trending
                    </div>
                  )}
                </div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{destination.name}</h3>
                      <p className="text-gray-600">{destination.country}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">{destination.rating}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-blue-600">{destination.price}</span>
                    <Link to="/places">
                      <Button className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2">
                        Explore
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Single CTA */}
          <div className="text-center">
            <Link to="/places">
              <Button className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-4 text-lg rounded-xl">
                View All Destinations
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. How It Works */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-purple-100 rounded-full px-6 py-2 mb-6">
              <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
              <span className="text-blue-800 font-semibold">AI-Powered Planning</span>
            </div>
            <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Plan Your Dream Trip in 3 Simple Steps
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI transforms hours of research into minutes of smart planning
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Lines */}
            <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-300 via-purple-300 to-green-300"></div>
            
            {[
              {
                step: 1,
                icon: <Search className="w-10 h-10" />,
                title: 'Tell Us Your Dreams',
                description: 'Share your interests, budget, and travel style',
                color: 'from-blue-500 to-blue-600',
                bgColor: 'from-blue-50 to-blue-100',
                time: '30 seconds'
              },
              {
                step: 2,
                icon: <Sparkles className="w-10 h-10" />,
                title: 'AI Creates Magic',
                description: 'Get personalized itineraries with hidden gems',
                color: 'from-purple-500 to-purple-600',
                bgColor: 'from-purple-50 to-purple-100',
                time: '2 minutes'
              },
              {
                step: 3,
                icon: <Plane className="w-10 h-10" />,
                title: 'Book & Explore',
                description: 'One-click booking for flights, hotels & activities',
                color: 'from-green-500 to-green-600',
                bgColor: 'from-green-50 to-green-100',
                time: '5 minutes'
              }
            ].map((step, index) => (
              <div key={step.step} className="relative group">
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 border border-gray-100">
                  {/* Step Number Badge */}
                  <div className={`absolute -top-4 left-8 w-12 h-12 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center shadow-lg`}>
                    <span className="text-white font-bold text-lg">{step.step}</span>
                  </div>
                  
                  {/* Icon */}
                  <div className={`w-20 h-20 bg-gradient-to-r ${step.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-6 mt-4 group-hover:scale-110 transition-transform duration-300`}>
                    <div className={`text-transparent bg-gradient-to-r ${step.color} bg-clip-text`}>
                      {step.icon}
                    </div>
                  </div>
                  
                  {/* Time Badge */}
                  <div className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 mb-4">
                    <Clock className="w-4 h-4 text-gray-500 mr-1" />
                    <span className="text-sm text-gray-600 font-medium">{step.time}</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">{step.description}</p>
                  
                  {/* Hover Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${step.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Enhanced CTA */}
          <div className="text-center mt-16">
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Start Your Adventure?</h3>
              <p className="text-gray-600 mb-6">Join 50,000+ travelers who saved 3+ hours with AI planning</p>
              <Link to="/trips">
                <Button className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-10 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  <Sparkles className="w-6 h-6 mr-3" />
                  Start Planning Free
                  <ArrowRight className="w-5 h-5 ml-3" />
                </Button>
              </Link>
              <p className="text-sm text-gray-500 mt-3">No credit card required • Free forever</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Pricing & Social Proof */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free, upgrade when you need more
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {quickDeals.map((deal) => (
              <Card key={deal.id} className={`p-8 text-center ${deal.urgent ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white' : 'bg-white border-2 border-gray-200'} hover:shadow-xl transition-all duration-300`}>
                <div className="text-4xl font-bold mb-2">{deal.discount}</div>
                <h3 className="text-2xl font-bold mb-2">{deal.title}</h3>
                <p className={`mb-6 ${deal.urgent ? 'text-white/90' : 'text-gray-600'}`}>
                  {deal.description}
                </p>
                <Link to={deal.urgent ? (user ? '/trips' : '/register') : '/subscription'}>
                  <Button className={`${deal.urgent ? 'bg-white text-green-600 hover:bg-gray-100' : 'bg-blue-600 text-white hover:bg-blue-700'} px-6 py-3 rounded-xl`}>
                    {deal.urgent ? 'Start Free!' : 'Upgrade Now'}
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
          
          {/* User Testimonials */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-center mb-8">What Our Users Say</h3>
            <div className="grid md:grid-cols-2 gap-8">
              {socialProof.testimonials.map((testimonial, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600 text-sm">{testimonial.location}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Single CTA */}
          <div className="text-center mt-8">
            <Link to="/trips">
              <Button className="bg-green-600 text-white hover:bg-green-700 px-8 py-4 text-lg rounded-xl">
                Start Planning Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Services Overview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600">
              Complete travel services in one platform
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Plane className="w-8 h-8" />,
                title: 'Flights',
                description: 'Best prices worldwide',
                link: '/transport'
              },
              {
                icon: <Hotel className="w-8 h-8" />,
                title: 'Hotels',
                description: 'From luxury to budget',
                link: '/services'
              },
              {
                icon: <MapPin className="w-8 h-8" />,
                title: 'Activities',
                description: 'Local experiences',
                link: '/discovery'
              },
              {
                icon: <Calendar className="w-8 h-8" />,
                title: 'Trip Planning',
                description: 'AI-powered itineraries',
                link: '/trips'
              }
            ].map((service, index) => (
              <Link key={index} to={service.link}>
                <Card className="p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer">
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    {service.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{service.title}</h3>
                  <p className="text-gray-600">{service.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Lazy loaded sections */}
      <Suspense fallback={<SectionLoader />}>
        <LazyDestinationGrid />
      </Suspense>
      
      <Suspense fallback={<SectionLoader />}>
        <LazyDealsSection />
      </Suspense>
    </div>
  )
}