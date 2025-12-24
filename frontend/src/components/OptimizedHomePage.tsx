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
  
  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
  
  .phone-tilt-container {
    perspective: 1000px;
  }
  
  .phone-tilt-container:hover > div {
    transform: rotateY(-5deg) rotateX(2deg) scale(1.02);
  }
`
import { Link } from 'react-router-dom'
import { Search, ArrowRight, MapPin, Star, Calendar, Plane, Hotel, DollarSign, Sparkles, Clock, Car, Heart, ChevronDown } from 'lucide-react'
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

// FAQ Accordion Component
const FAQAccordion = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  
  const faqs = [
    {
      icon: "🤖",
      question: "How does TravelBuddy create my itinerary?",
      answer: "Our AI analyzes your preferences, budget, travel dates, and interests to create personalized itineraries in under 2 minutes. We consider factors like weather, local events, opening hours, and travel distances to optimize your trip."
    },
    {
      icon: "💰",
      question: "Is the AI trip planner free?",
      answer: "Yes! Our basic AI trip planner is completely free forever. You can create unlimited itineraries, discover places, and plan trips without any cost. Premium features like offline access and advanced weather AI are available for $9.99/month."
    },
    {
      icon: "📱",
      question: "Can I use the app offline?",
      answer: "Premium users can download their complete itineraries, maps, and place details for offline access. This includes photos, descriptions, contact information, and navigation - perfect for international travel without roaming charges."
    },
    {
      icon: "✅",
      question: "Are deals verified?",
      answer: "All deals are verified in real-time through our partner network. We work directly with hotels, airlines, and activity providers to ensure accurate pricing and availability. Deals are updated every 15 minutes."
    },
    {
      icon: "🎯",
      question: "How accurate are the AI recommendations?",
      answer: "Our AI has a 94% satisfaction rate based on user feedback. It learns from 125,000+ successful trips and considers 200+ factors including weather, crowds, local events, and personal preferences to make recommendations."
    },
    {
      icon: "👥",
      question: "Can I share my itinerary with friends?",
      answer: "Yes! You can share itineraries via link, export to PDF, or collaborate in real-time. Friends can add suggestions, vote on activities, and make changes together - perfect for group travel planning."
    }
  ]
  
  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <div key={index} className="group">
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                  <span className="text-xl">{faq.icon}</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                    {faq.question}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Click to see answer</p>
                </div>
              </div>
              <div className={`w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center transition-all duration-300 ${
                openIndex === index ? 'rotate-180 bg-blue-600' : 'group-hover:bg-blue-200'
              }`}>
                <ChevronDown className={`w-4 h-4 transition-colors duration-300 ${
                  openIndex === index ? 'text-white' : 'text-blue-600'
                }`} />
              </div>
            </button>
            
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
              openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="px-6 pb-6">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border-l-4 border-blue-500">
                  <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Month-based dynamic destinations
const getMonthlyDestinations = () => {
  const currentMonth = new Date().getMonth()
  const monthlyDestinations = {
    0: [ // January
      { id: 1, name: 'Dubai', country: 'UAE', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop&auto=format&q=60', rating: 4.8, reason: 'Perfect weather', popular: true },
      { id: 2, name: 'Goa', country: 'India', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&h=300&fit=crop&auto=format&q=60', rating: 4.6, reason: 'Peak season' },
      { id: 3, name: 'Patagonia', country: 'Chile', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop&auto=format&q=60', rating: 4.9, reason: 'Summer season' },
      { id: 4, name: 'New Zealand', country: 'South Island', image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop&auto=format&q=60', rating: 4.7, reason: 'Summer adventures' },
      { id: 5, name: 'Thailand', country: 'Bangkok', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&auto=format&q=60', rating: 4.5, reason: 'Cool & dry' },
      { id: 6, name: 'Myanmar', country: 'Bagan', image: 'https://images.unsplash.com/photo-1570366583862-f91883984fde?w=400&h=300&fit=crop&auto=format&q=60', rating: 4.6, reason: 'Ideal climate' },
      { id: 7, name: 'Egypt', country: 'Cairo', image: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=400&h=300&fit=crop&auto=format&q=60', rating: 4.4, reason: 'Mild temperatures' },
      { id: 8, name: 'Argentina', country: 'Buenos Aires', image: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=400&h=300&fit=crop&auto=format&q=60', rating: 4.5, reason: 'Summer vibes' },
      { id: 9, name: 'Australia', country: 'Sydney', image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&h=300&fit=crop&auto=format&q=60', rating: 4.8, reason: 'Beach season', trending: true }
    ],
    10: [ // November
      { id: 1, name: 'Kyoto', country: 'Japan', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=300&fit=crop&auto=format&q=60', rating: 4.9, reason: 'Autumn foliage', popular: true },
      { id: 2, name: 'Dubai', country: 'UAE', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=300&fit=crop&auto=format&q=60', rating: 4.8, reason: 'Ideal weather' },
      { id: 3, name: 'Patagonia', country: 'Chile', image: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=300&fit=crop&auto=format&q=60', rating: 4.9, reason: 'Peak season' },
      { id: 4, name: 'India', country: 'Rajasthan', image: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=300&fit=crop&auto=format&q=60', rating: 4.7, reason: 'Pleasant weather' },
      { id: 5, name: 'Myanmar', country: 'Bagan', image: 'https://images.unsplash.com/photo-1570366583862-f91883984fde?w=400&h=300&fit=crop&auto=format&q=60', rating: 4.6, reason: 'Cool & dry', trending: true },
      { id: 6, name: 'Nepal', country: 'Kathmandu', image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=400&h=300&fit=crop&auto=format&q=60', rating: 4.5, reason: 'Clear mountain views' },
      { id: 7, name: 'Egypt', country: 'Luxor', image: 'https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=400&h=300&fit=crop&auto=format&q=60', rating: 4.4, reason: 'Comfortable temps' },
      { id: 8, name: 'Vietnam', country: 'Hanoi', image: 'https://images.unsplash.com/photo-1559592413-7cec4d0d2d8f?w=400&h=300&fit=crop&auto=format&q=60', rating: 4.6, reason: 'Perfect climate' },
      { id: 9, name: 'Cambodia', country: 'Siem Reap', image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop&auto=format&q=60', rating: 4.5, reason: 'Dry season starts' }
    ]
  }
  
  // Default to November if month not defined, or use January as fallback
  return monthlyDestinations[currentMonth] || monthlyDestinations[10] || monthlyDestinations[0]
}

const featuredDestinations = getMonthlyDestinations()

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
  const [currentSublineIndex, setCurrentSublineIndex] = useState(0)
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0)

  // Personalized rotating sublines for authenticated users
  const personalizedSublines = [
    "You have a trip draft in progress.",
    "There are 3 new deals near your location.",
    "Perfect weather in Ella this weekend!",
    "2 friends shared new travel photos.",
    "Your saved places have price drops."
  ]

  // Mobile app screens for animation with real images
  const appScreens = [
    {
      title: 'Places Discovery',
      content: (
        <div className="bg-gray-50 h-full relative overflow-hidden">
          <div className="bg-white p-3 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-bold text-gray-900">Explore Places</h4>
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <MapPin className="w-3 h-3 text-blue-600" />
              </div>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm" placeholder="Search places..." readOnly />
            </div>
            <div className="flex gap-2 mb-3">
              <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">All</div>
              <div className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">Food</div>
              <div className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">Culture</div>
            </div>
          </div>
          <div className="p-3 space-y-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="h-24 rounded-t-lg relative overflow-hidden">
                <img 
                  src="https://picsum.photos/300/200?random=1" 
                  alt="Eiffel Tower" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center">
                  <Heart className="w-3 h-3 text-red-500" />
                </div>
              </div>
              <div className="p-2">
                <h5 className="font-bold text-xs text-gray-900 mb-1">Eiffel Tower</h5>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-xs font-medium">4.8</span>
                  </div>
                  <span className="text-xs text-gray-500">Landmark</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="h-24 rounded-t-lg relative overflow-hidden">
                <img 
                  src="https://picsum.photos/300/200?random=2" 
                  alt="Notre Dame" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-2">
                <h5 className="font-bold text-xs text-gray-900 mb-1">Notre Dame</h5>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-xs font-medium">4.7</span>
                  </div>
                  <span className="text-xs text-gray-500">Cathedral</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Smart Search',
      content: (
        <div className="bg-gray-50 h-full relative overflow-hidden">
          <div className="bg-white p-3 border-b border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-3">AI Search</h4>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-blue-600" />
              <input className="w-full pl-9 pr-4 py-2 bg-blue-100 border-2 border-blue-300 rounded-lg text-sm font-medium" value="Romantic dinner Paris" readOnly />
            </div>
          </div>
          <div className="p-3 space-y-3">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-3 text-white">
              <div className="flex items-center mb-2">
                <Sparkles className="w-4 h-4 mr-2" />
                <h5 className="font-bold text-sm">AI Suggestion</h5>
              </div>
              <p className="text-xs opacity-90">Found 12 romantic restaurants near Eiffel Tower</p>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-lg overflow-hidden mr-3">
                  <img 
                    src="https://picsum.photos/100/100?random=3" 
                    alt="Restaurant" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h6 className="font-bold text-xs text-gray-900">Le Jules Verne</h6>
                  <p className="text-xs text-gray-600">Michelin starred • €€€€</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-xs font-medium">4.9</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Trip Planning',
      content: (
        <div className="bg-gray-50 h-full relative overflow-hidden">
          <div className="bg-white p-3 border-b border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-3">My Trip</h4>
            <div className="bg-gradient-to-r from-green-100 to-blue-100 px-3 py-2 rounded-lg mb-3 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-800 font-bold">Paris Weekend</p>
                  <p className="text-xs text-green-600">Nov 25-27 • 2 days</p>
                </div>
                <Calendar className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </div>
          <div className="p-3 space-y-3">
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-xs font-bold text-blue-600">1</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-900">Day 1: Iconic Paris</p>
                  <p className="text-xs text-gray-600">Eiffel Tower → Louvre Museum</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded overflow-hidden">
                  <img src="https://picsum.photos/50/50?random=4" alt="" className="w-full h-full object-cover" />
                </div>
                <div className="w-8 h-8 rounded overflow-hidden">
                  <img src="https://picsum.photos/50/50?random=5" alt="" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-xs font-bold text-purple-600">2</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-900">Day 2: Culture & Romance</p>
                  <p className="text-xs text-gray-600">Montmartre → Seine Cruise</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Map Navigation',
      content: (
        <div className="bg-gray-50 h-full relative overflow-hidden">
          <div className="bg-white p-3 border-b border-gray-200">
            <h4 className="text-lg font-bold text-gray-900 mb-3">Navigate</h4>
            <div className="bg-blue-100 px-3 py-2 rounded-lg mb-3 border border-blue-200">
              <div className="flex items-center">
                <MapPin className="w-4 h-4 text-blue-600 mr-2" />
                <p className="text-xs text-blue-700 font-medium">You are near Eiffel Tower</p>
              </div>
            </div>
          </div>
          <div className="p-3 bg-gradient-to-br from-green-100 via-blue-100 to-purple-100 h-full relative">
            {/* Map-like background */}
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full bg-gradient-to-br from-green-200 to-blue-200"></div>
            </div>
            <div className="relative space-y-2">
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded overflow-hidden mr-3">
                    <img src="https://picsum.photos/50/50?random=6" alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-900">Eiffel Tower</p>
                    <p className="text-xs text-green-600">5 min walk • Open now</p>
                  </div>
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">→</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-orange-600 text-xs">🍽️</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-900">Café de Flore</p>
                    <p className="text-xs text-orange-600">2 min walk • Popular</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ]

  // Rotate sublines every 3 seconds
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        setCurrentSublineIndex((prev) => (prev + 1) % personalizedSublines.length)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [user, personalizedSublines.length])

  // Rotate app screens every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentScreenIndex((prev) => (prev + 1) % appScreens.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [appScreens.length])

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
                {user ? `Welcome back, ${user.fullName?.split(' ')[0] || user.username?.split(' ')[0] || user.name || 'Explorer'}!` : 'Your Perfect Trip in'}
                <span className="block text-yellow-400">
                  {user ? 'Your next adventure is waiting.' : '2 Minutes'}
                </span>
              </h1>
              <h2 className="text-lg md:text-xl mb-6 text-white/90 max-w-2xl mx-auto">
                {user ? (
                  <span className="inline-block transition-all duration-500 ease-in-out transform">
                    {personalizedSublines[currentSublineIndex]}
                  </span>
                ) : (
                  'AI plans everything. You just pack and go.'
                )}
              </h2>
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

      {/* 2. Mobile App Showcase */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Phone Mockup with Animation */}
            <div className="relative flex justify-center lg:justify-start order-2 lg:order-1">
              {/* Feature Tags Around Phone */}
              <div className="absolute -top-8 -left-8 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-pulse">
                🗺️ Nearby Places
              </div>
              <div className="absolute top-32 -right-12 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-pulse" style={{animationDelay: '1s'}}>
                📴 Offline Mode
              </div>
              <div className="absolute bottom-32 -left-16 bg-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-pulse" style={{animationDelay: '2s'}}>
                🤖 AI Recommendations
              </div>
              <div className="absolute bottom-16 -right-8 bg-orange-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg animate-pulse" style={{animationDelay: '3s'}}>
                🧭 Live Navigation
              </div>
              
              {/* Gradient Glow Behind Phone */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
              
              {/* Phone Mockup */}
              <div className="relative phone-tilt-container z-10">
                <div className="relative w-72 h-[580px] bg-gradient-to-b from-gray-900 to-black rounded-[3rem] p-2 shadow-2xl">
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
                    
                    {/* Animated Screen Content */}
                    <div className="h-full transition-all duration-1000 ease-in-out">
                      {appScreens[currentScreenIndex].content}
                    </div>
                    
                    {/* Screen Indicator */}
                    <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex gap-2">
                      {appScreens.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index === currentScreenIndex ? 'bg-blue-500 w-6' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    
                    {/* Bottom Navigation */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-2">
                      <div className="flex justify-around">
                        <div className={`text-xs text-center transition-colors duration-300 ${
                          currentScreenIndex === 0 ? 'text-blue-500' : 'text-gray-400'
                        }`}>
                          <div className="w-5 h-5 mx-auto mb-1 bg-blue-100 rounded-full flex items-center justify-center">
                            <MapPin className="w-3 h-3" />
                          </div>
                          <span className="font-medium">Places</span>
                        </div>
                        <div className={`text-xs text-center transition-colors duration-300 ${
                          currentScreenIndex === 2 ? 'text-blue-500' : 'text-gray-400'
                        }`}>
                          <div className="w-5 h-5 mx-auto mb-1 bg-gray-100 rounded-full flex items-center justify-center">
                            <Calendar className="w-3 h-3" />
                          </div>
                          <span>Trips</span>
                        </div>
                        <div className={`text-xs text-center transition-colors duration-300 ${
                          currentScreenIndex === 3 ? 'text-blue-500' : 'text-gray-400'
                        }`}>
                          <div className="w-5 h-5 mx-auto mb-1 bg-gray-100 rounded-full flex items-center justify-center">
                            <Search className="w-3 h-3" />
                          </div>
                          <span>Navigate</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Phone Reflection */}
                  <div className="absolute -bottom-4 left-3 right-3 h-12 bg-gradient-to-b from-black/30 to-transparent rounded-[3rem] blur-2xl"></div>
                </div>
              </div>
            </div>
            
            {/* Right: Content */}
            <div className="space-y-6 order-1 lg:order-2">
              <div>
                <div className="inline-flex items-center bg-gradient-to-r from-blue-100 to-purple-100 rounded-full px-4 py-2 mb-4">
                  <span className="text-2xl mr-2">📱</span>
                  <span className="text-blue-800 font-semibold">Mobile App</span>
                </div>
                <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                  Your Travel Companion
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    In Your Pocket
                  </span>
                </h2>
                <p className="text-xl text-gray-600">
                  Unique mobile features that make travel planning effortless
                </p>
              </div>
              
              {/* Mobile-Specific Features */}
              <div className="space-y-4">
                <div className="flex items-start gap-4 bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 group">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Nearby Places Discovery</h3>
                    <p className="text-gray-600 text-sm">Find restaurants, attractions & hidden gems within walking distance using GPS</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 group">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Offline Access</h3>
                    <p className="text-gray-600 text-sm">Download maps, itineraries & place details - travel without internet or roaming</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 group">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Smart AI Recommendations</h3>
                    <p className="text-gray-600 text-sm">Get personalized suggestions based on time, weather, crowds & your preferences</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 group">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Live Navigation</h3>
                    <p className="text-gray-600 text-sm">Turn-by-turn directions to your next destination with real-time traffic updates</p>
                  </div>
                </div>
              </div>
              
              {/* CTA */}
              <div className="pt-4">
                <p className="text-gray-600 mb-4 font-semibold">Download the mobile app:</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <a href="https://drive.google.com/uc?export=download&id=1GcZIfFRBHKoyflPJIwgRnVKSCJKIUxVk" className="inline-flex items-center justify-center bg-black text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                    </svg>
                    Download APK
                  </a>
                </div>
                <p className="text-sm text-gray-500 mt-3">Android APK • iOS coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Featured Destinations */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Best Places to Visit This Month
            </h2>
            <p className="text-xl text-gray-600">
              AI-curated destinations perfect for {new Date().toLocaleString('default', { month: 'long' })}
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
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
                  <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                    {destination.reason}
                  </div>
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
                    <span className="text-sm text-blue-600 font-medium">{destination.reason}</span>
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

      {/* 4. How It Works */}
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
            <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 rounded-full"></div>
            
            {[
              {
                step: 1,
                icon: <Search className="w-10 h-10" />,
                title: 'Tell Us Your Travel Style',
                description: 'Share your interests and budget in just 30 seconds. No lengthy forms!',
                color: 'from-blue-500 to-blue-600',
                bgColor: 'from-blue-50 to-blue-100',
                time: '30 seconds'
              },
              {
                step: 2,
                icon: <Sparkles className="w-10 h-10" />,
                title: 'AI Creates Your Perfect Itinerary',
                description: 'Get personalized itineraries with hidden gems, hotels, transport & activities — all in 2 minutes.',
                color: 'from-purple-500 to-purple-600',
                bgColor: 'from-purple-50 to-purple-100',
                time: '2 minutes'
              },
              {
                step: 3,
                icon: <Plane className="w-10 h-10" />,
                title: 'Download, Share & Book Instantly',
                description: 'One-click booking and offline access. Take your trip anywhere, even without internet.',
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
                  <div className={`w-20 h-20 bg-gradient-to-r ${step.bgColor} rounded-2xl flex items-center justify-center mx-auto mb-6 mt-4 group-hover:scale-110 transition-transform duration-300 animate-float`}>
                    <div className={`text-transparent bg-gradient-to-r ${step.color} bg-clip-text`}>
                      {step.icon}
                    </div>
                  </div>
                  
                  {/* Time Badge */}
                  <div className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1 mb-4">
                    <Clock className="w-4 h-4 text-gray-500 mr-1" />
                    <span className="text-sm text-gray-600 font-medium">{step.time}</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 text-base leading-relaxed">{step.description}</p>
                  
                  {/* Hover Effect */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${step.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300`}></div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Enhanced CTA */}
          <div className="text-center mt-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Ready to Start Your Adventure?</h3>
            <p className="text-xl text-gray-600 mb-6">Join 50,000+ travelers who saved 3+ hours with AI planning</p>
            <Link to="/trips">
              <Button className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-10 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <Sparkles className="w-6 h-6 mr-3" />
                Start Planning Free
                <ArrowRight className="w-5 h-5 ml-3" />
              </Button>
            </Link>
            <p className="text-sm text-gray-500 mt-4">No credit card required • Free forever</p>
          </div>
        </div>
      </section>

      {/* 5. Trust Boosters & Social Proof */}
      <section className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="group">
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-yellow-100">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">🏆</span>
                  </div>
                  <div className="ml-4">
                    <div className="text-gray-900 font-bold text-lg leading-tight">2024 Award Winner</div>
                    <div className="text-gray-600 text-sm font-medium">Best Travel Companion</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Card 2 */}
            <div className="group">
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-blue-100">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">📱</span>
                  </div>
                  <div className="ml-4">
                    <div className="text-gray-900 font-bold text-lg leading-tight">#1 Trending App</div>
                    <div className="text-blue-600 text-sm font-medium">Featured on App Store</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Card 3 */}
            <div className="group">
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-green-100">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">⭐</span>
                  </div>
                  <div className="ml-4">
                    <div className="text-gray-900 font-bold text-lg leading-tight">4.8/5 Rating</div>
                    <div className="text-gray-600 text-sm font-medium">Based on 50k+ Reviews</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Card 4 */}
            <div className="group">
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-teal-100">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal-500 via-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">🛡️</span>
                  </div>
                  <div className="ml-4">
                    <div className="text-gray-900 font-bold text-lg leading-tight">Secure & Private</div>
                    <div className="text-gray-600 text-sm font-medium">Bank-grade encryption</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Card 5 */}
            <div className="group">
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-orange-100">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">⏳</span>
                  </div>
                  <div className="ml-4">
                    <div className="text-gray-900 font-bold text-lg leading-tight">Fresh Deals</div>
                    <div className="text-gray-600 text-sm font-medium">Updated every hour</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Card 6 */}
            <div className="group">
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-purple-100">
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="ml-4">
                    <div className="text-gray-900 font-bold text-lg leading-tight">Active Community</div>
                    <div className="text-gray-600 text-sm font-medium">67 travelers online now</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Pricing & Social Proof */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 mb-4">
              Start free, upgrade when you need more
            </p>
            <p className="text-lg text-blue-600 font-semibold">
              Used by travelers from 120+ countries
            </p>
          </div>

          {/* Social Proof Badges */}
          <div className="flex flex-wrap justify-center gap-6 mb-12">
            <div className="bg-white rounded-xl px-6 py-4 shadow-lg border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">50,000+</div>
              <div className="text-sm text-gray-600">Travelers</div>
            </div>
            <div className="bg-white rounded-xl px-6 py-4 shadow-lg border border-gray-200">
              <div className="text-2xl font-bold text-green-600">125,000+</div>
              <div className="text-sm text-gray-600">Trips Generated</div>
            </div>
            <div className="bg-white rounded-xl px-6 py-4 shadow-lg border border-gray-200">
              <div className="flex items-center gap-1 text-2xl font-bold text-yellow-500">
                ★★★★★
              </div>
              <div className="text-sm text-gray-600">Play Store Rating</div>
            </div>
          </div>
          
          {/* Comparison Table */}
          <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200 mb-12">
            <h3 className="text-2xl font-bold text-center mb-8">Choose Your Plan</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-4 px-6 font-semibold text-gray-900">Feature</th>
                    <th className="text-center py-4 px-6 font-semibold text-gray-900">Free</th>
                    <th className="text-center py-4 px-6 font-semibold text-blue-600 bg-blue-50 rounded-t-lg">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">AI Trip Planning</td>
                    <td className="text-center py-4 px-6"><span className="text-green-500 text-xl">✓</span></td>
                    <td className="text-center py-4 px-6 bg-blue-50"><span className="text-green-500 text-xl">✓</span></td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">Unlimited Favorites</td>
                    <td className="text-center py-4 px-6"><span className="text-gray-400 text-xl">–</span></td>
                    <td className="text-center py-4 px-6 bg-blue-50"><span className="text-green-500 text-xl">✓</span></td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-4 px-6 text-gray-700">Offline Access</td>
                    <td className="text-center py-4 px-6"><span className="text-gray-400 text-xl">–</span></td>
                    <td className="text-center py-4 px-6 bg-blue-50"><span className="text-green-500 text-xl">✓</span></td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 text-gray-700">Advanced Weather AI</td>
                    <td className="text-center py-4 px-6"><span className="text-gray-400 text-xl">–</span></td>
                    <td className="text-center py-4 px-6 bg-blue-50 rounded-b-lg"><span className="text-green-500 text-xl">✓</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link to={user ? '/trips' : '/register'}>
                <Button className="bg-gray-600 text-white hover:bg-gray-700 px-8 py-3 rounded-xl">
                  Start Free
                </Button>
              </Link>
              <Link to="/subscription">
                <Button className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-3 rounded-xl">
                  Upgrade to Premium - $9.99/month
                </Button>
              </Link>
            </div>
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

      {/* 7. Services Overview */}
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
                icon: <Hotel className="w-8 h-8" />,
                title: 'Hotels',
                description: 'Compare the best options in seconds',
                link: '/services',
                color: 'from-blue-500 to-blue-600',
                bgColor: 'from-blue-50 to-blue-100'
              },
              {
                icon: <Car className="w-8 h-8" />,
                title: 'Transport',
                description: 'Taxi, bus, tuk-tuk, train — all in one place',
                link: '/transport',
                color: 'from-green-500 to-green-600',
                bgColor: 'from-green-50 to-green-100'
              },
              {
                icon: <MapPin className="w-8 h-8" />,
                title: 'Activities',
                description: 'Local events, top attractions & hidden experiences',
                link: '/discovery',
                color: 'from-purple-500 to-purple-600',
                bgColor: 'from-purple-50 to-purple-100'
              },
              {
                icon: <Calendar className="w-8 h-8" />,
                title: 'Trip Planning',
                description: 'Your smart itinerary, always up to date',
                link: '/trips',
                color: 'from-orange-500 to-orange-600',
                bgColor: 'from-orange-50 to-orange-100'
              }
            ].map((service, index) => (
              <Link key={index} to={service.link}>
                <Card className="p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group">
                  <div className={`w-16 h-16 bg-gradient-to-r ${service.bgColor} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-all duration-300`}>
                    <div className={`text-transparent bg-gradient-to-r ${service.color} bg-clip-text group-hover:scale-110 transition-transform duration-300`}>
                      {service.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">{service.title}</h3>
                  <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">{service.description}</p>
                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ArrowRight className="w-5 h-5 text-blue-600 mx-auto" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 8. FAQ Section - Interactive Dropdown */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-blue-100 rounded-full px-6 py-2 mb-6">
              <span className="text-2xl mr-2">❓</span>
              <span className="text-blue-800 font-semibold">Got Questions?</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about TravelBuddy
            </p>
          </div>
          
          <FAQAccordion />
          
          <div className="text-center mt-16">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Still have questions?</h3>
              <p className="text-gray-600 mb-6">Our support team is here to help you 24/7</p>
              <Link to="/contact">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>


      
      {user && (
        <Suspense fallback={<SectionLoader />}>
          <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="max-w-7xl mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Welcome Back, {user.fullName?.split(' ')[0] || user.username || 'Explorer'}!
                </h2>
                <p className="text-xl text-gray-600">
                  Continue your journey or start planning your next adventure
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                <Link to="/trips">
                  <Card className="p-6 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Calendar className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">My Trips</h3>
                    <p className="text-gray-600">View and manage your travel plans</p>
                  </Card>
                </Link>
                <Link to="/places">
                  <Card className="p-6 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <MapPin className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors duration-300">Explore Places</h3>
                    <p className="text-gray-600">Discover new destinations nearby</p>
                  </Card>
                </Link>
                <Link to="/profile">
                  <Card className="p-6 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer group">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Heart className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors duration-300">My Favorites</h3>
                    <p className="text-gray-600">Access your saved places</p>
                  </Card>
                </Link>
              </div>
            </div>
          </section>
        </Suspense>
      )}
    </div>
  )
}
