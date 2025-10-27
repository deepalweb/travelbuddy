import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, Globe, MapPin, Hotel, Calendar, Plane, Train, Car,
  Star, Clock, DollarSign, Wifi, Coffee, Car as CarIcon,
  MessageCircle, ChevronLeft, ChevronRight, Play, ArrowRight,
  Sun, Cloud, Umbrella, Phone, AlertTriangle, Users, Bot, Compass,
  Smartphone, PlayCircle
} from 'lucide-react'
import { Button } from './Button'
import { Card, CardContent } from './Card'
import { ImageWithFallback } from './ImageWithFallback'
import { unsplashService } from '../services/unsplashService'
import type { UnsplashImage } from '../services/unsplashService'

const destinations = [
  {
    id: 1,
    name: 'Paris, France',
    tagline: 'Cultural Capital of Europe',
    image: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=600&h=400&fit=crop&crop=center&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/600/400?random=1',
    rating: 4.8,
    season: 'Spring',
    budget: '$80-150/day'
  },
  {
    id: 2,
    name: 'Kandy, Sri Lanka',
    tagline: 'Cultural Heart of Ceylon',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop&crop=center&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/600/400?random=2',
    rating: 4.6,
    season: 'Dec-Mar',
    budget: '$30-60/day'
  },
  {
    id: 3,
    name: 'Bali, Indonesia',
    tagline: 'Island of the Gods',
    image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=600&h=400&fit=crop&crop=center&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/600/400?random=3',
    rating: 4.7,
    season: 'Apr-Oct',
    budget: '$40-80/day'
  },
  {
    id: 4,
    name: 'Tokyo, Japan',
    tagline: 'Modern Metropolis',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&h=400&fit=crop&crop=center&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/600/400?random=4',
    rating: 4.9,
    season: 'Mar-May',
    budget: '$100-200/day'
  }
]

const accommodations = [
  {
    id: 1,
    name: 'Luxury Beach Resort',
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/400/300?random=10',
    rating: 4.8,
    price: '$120-180',
    amenities: ['wifi', 'pool', 'breakfast']
  },
  {
    id: 2,
    name: 'Boutique City Hotel',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/400/300?random=11',
    rating: 4.6,
    price: '$80-120',
    amenities: ['wifi', 'breakfast', 'gym']
  },
  {
    id: 3,
    name: 'Mountain Lodge',
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/400/300?random=12',
    rating: 4.7,
    price: '$60-100',
    amenities: ['wifi', 'restaurant', 'spa']
  }
]

const events = [
  {
    id: 1,
    name: 'Cherry Blossom Festival',
    date: '2024-04-15',
    location: 'Tokyo, Japan',
    image: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=250&fit=crop&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/400/250?random=20',
    daysLeft: 45
  },
  {
    id: 2,
    name: 'Kandy Perahera',
    date: '2024-08-20',
    location: 'Kandy, Sri Lanka',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop&auto=format&q=60',
    fallbackImage: 'https://picsum.photos/400/250?random=21',
    daysLeft: 180
  }
]

const guides = [
  {
    id: 1,
    name: 'Marie Dubois',
    specialty: 'Food Tours',
    language: 'French, English',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
  },
  {
    id: 2,
    name: 'Hiroshi Tanaka',
    specialty: 'Cultural Heritage',
    language: 'Japanese, English',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
  }
]

export const NewHomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentDestination, setCurrentDestination] = useState(0)
  const [currentAccommodation, setCurrentAccommodation] = useState(0)
  const [showChatbot, setShowChatbot] = useState(false)
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hi! I\'m your AI Travel Assistant. How can I help you plan your next adventure?', sender: 'bot' }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [destinationImages, setDestinationImages] = useState<UnsplashImage[]>([])
  const [loadingImages, setLoadingImages] = useState(true)


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDestination((prev) => (prev + 1) % destinations.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchDestinationImages = async () => {
      try {
        const images = await unsplashService.getDestinationImages()
        setDestinationImages(images)
      } catch (error) {
        console.error('Failed to fetch destination images:', error)
      } finally {
        setLoadingImages(false)
      }
    }

    fetchDestinationImages()
  }, [])

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return
    
    const userMessage = { id: Date.now(), text: inputMessage, sender: 'user' }
    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    
    try {
      // TODO: Connect to OpenAI API endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputMessage })
      })
      
      const data = await response.json()
      const botMessage = { id: Date.now() + 1, text: data.response || 'Sorry, I\'m having trouble right now. Please try again.', sender: 'bot' }
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      const errorMessage = { id: Date.now() + 1, text: 'I\'m currently offline. Please try again later.', sender: 'bot' }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* 1. Hero Section */}
      <section className="relative h-screen w-full overflow-hidden">
        <div className="absolute inset-0">
          <img 
            alt="Travelers with backpacks exploring a scenic mountain landscape with winding paths and beautiful valleys"
            className="h-full w-full object-cover"
            src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1920&h=1080&fit=crop&crop=center&auto=format&q=80"
          />
        </div>
        <div className="absolute inset-0 bg-black/60"></div>
        
        <div className="relative z-10 flex h-full flex-col items-center justify-center p-4">
          <main className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-8 text-center text-white">
              <div className="flex flex-col items-center gap-4">
                <h1 
                  className="text-5xl md:text-7xl font-extrabold leading-tight tracking-tighter drop-shadow-xl"
                  style={{ textShadow: '0 4px 15px rgba(0,0,0,0.5)' }}
                >
                  Discover Your Next Adventure
                </h1>
                <p className="max-w-xl text-lg text-white/90 drop-shadow-lg">
                  Find places, hotels, and experiences worldwide.
                </p>
              </div>
              
              <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
                <a 
                  className="flex w-full sm:w-auto items-center justify-center gap-3 rounded-lg bg-black/50 px-6 py-3 text-white backdrop-blur-sm ring-1 ring-white/20 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-white/20 hover:ring-white/40 hover:shadow-xl"
                  href="#"
                >
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.1685 13.9936C19.2215 12.046 21.1345 11.0094 21.2145 10.962C21.1555 10.8263 20.1585 10.2336 19.3495 10.2036C18.4115 10.1664 17.6545 10.7447 17.2025 11.1967C16.5915 11.8349 16.1465 12.7224 16.2025 13.8216C16.2025 13.8359 16.2065 13.8503 16.2065 13.8647C16.2065 13.879 16.2025 13.8862 16.2025 13.9005C16.1885 15.1055 16.8915 16.1315 17.5815 16.7424C18.0635 17.2087 18.6675 17.6339 19.4125 17.6511C19.4695 17.6511 19.5195 17.6511 19.5735 17.6511C20.2525 17.6511 20.8495 17.2944 21.2685 16.8824C21.2825 16.8644 21.2965 16.8501 21.3105 16.8357C20.1985 16.2647 19.1315 14.8687 19.1685 13.9936Z"></path>
                    <path d="M17.848 9.77448C18.253 9.29848 18.571 8.65648 18.533 7.92548C17.772 7.98948 17.012 8.44548 16.593 8.92548C16.223 9.35448 15.864 10.0535 15.932 10.7445C16.735 10.6975 17.436 10.2505 17.848 9.77448Z"></path>
                  </svg>
                  <div className="text-left">
                    <p className="text-xs">Download on the</p>
                    <p className="text-base font-semibold">App Store</p>
                  </div>
                </a>
                
                <a 
                  className="flex w-full sm:w-auto items-center justify-center gap-3 rounded-lg bg-black/50 px-6 py-3 text-white backdrop-blur-sm ring-1 ring-white/20 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-white/20 hover:ring-white/40 hover:shadow-xl"
                  href="#"
                >
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.75781 1.00195L18.8228 12.002L2.75781 23.002L2.78081 1.02495L2.75781 1.00195Z" fill="#FBC02D"></path>
                    <path d="M2.78081 1.02495L12.5648 12.002L2.78081 22.979L2.78081 1.02495Z" fill="#F57C00"></path>
                    <path d="M21.1119 14.157L18.8229 12L12.5649 18.324L14.0779 19.837L21.1119 14.157Z" fill="#2196F3"></path>
                    <path d="M21.1119 9.84495L14.0779 4.16495L12.5649 5.67795L18.8229 12L21.1119 9.84495Z" fill="#4CAF50"></path>
                  </svg>
                  <div className="text-left">
                    <p className="text-xs">GET IT ON</p>
                    <p className="text-base font-semibold">Google Play</p>
                  </div>
                </a>
              </div>
              
              <div className="mt-8 max-w-4xl space-y-4 rounded-xl bg-black/30 p-6 backdrop-blur-md ring-1 ring-white/10">
                <p className="text-lg font-semibold text-white">Download our mobile app for more features:</p>
                <div className="grid grid-cols-1 gap-x-6 gap-y-4 text-left md:grid-cols-3">
                  <div className="flex items-start gap-3">
                    <svg className="mt-1 h-5 w-5 flex-shrink-0 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    <p className="text-sm text-white/80">Discover hidden local gems, authentic restaurants, and secret spots that only locals know.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="mt-1 h-5 w-5 flex-shrink-0 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    <p className="text-sm text-white/80">Get offline maps, so you're never lost, even without a connection.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <svg className="mt-1 h-5 w-5 flex-shrink-0 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    <p className="text-sm text-white/80">Real-time local recommendations and exclusive deals on the go.</p>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </section>

      {/* 2. Discover Destinations */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Globe className="w-4 h-4" />
              Popular Destinations
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Discover Amazing
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                Destinations
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From bustling cities to serene landscapes, explore handpicked destinations that offer unforgettable experiences
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {destinations.map((destination, index) => {
              const unsplashImage = destinationImages[index]
              const imageUrl = unsplashImage?.urls?.regular || destination.image
              const fallbackUrl = destination.fallbackImage
              
              return (
                <Card key={destination.id} className="group relative overflow-hidden bg-white border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 rounded-2xl">
                  <div className="relative overflow-hidden rounded-t-2xl">
                    {loadingImages ? (
                      <div className="w-full h-72 bg-gray-200 animate-pulse flex items-center justify-center">
                        <Globe className="w-8 h-8 text-gray-400" />
                      </div>
                    ) : (
                      <ImageWithFallback
                        src={imageUrl}
                        fallbackSrc={fallbackUrl}
                        alt={unsplashImage?.alt_description || destination.name}
                        className="w-full h-72 object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    
                    {/* Rating Badge */}
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-semibold text-gray-900">{destination.rating}</span>
                    </div>
                    
                    {/* Season Badge */}
                    <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Best: {destination.season}
                    </div>
                    
                    {/* Overlay Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <h3 className="text-2xl font-bold mb-2 drop-shadow-lg">{destination.name}</h3>
                      <p className="text-white/90 text-sm mb-4 drop-shadow">{destination.tagline}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                          <DollarSign className="w-4 h-4" />
                          <span className="text-sm font-medium">{destination.budget}</span>
                        </div>
                        
                        <Button 
                          className="bg-white/20 backdrop-blur-sm border border-white/30 text-white hover:bg-white hover:text-gray-900 transition-all duration-300 rounded-full px-6 py-2 text-sm font-medium opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
                        >
                          Explore Now
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Card Number */}
                  <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                    {index + 1}
                  </div>
                </Card>
              )
            })}
          </div>
          
          {/* View All Button */}
          <div className="text-center mt-16">
            <Button className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 text-lg rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
              View All Destinations
              <Compass className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* 3. Plan Your Trip */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Plan Your Perfect Trip</h2>
              <p className="text-xl text-gray-600 mb-8">
                Our intelligent trip planner helps you create detailed itineraries in minutes. 
                From destinations to daily activities, we've got you covered.
              </p>
              
              <div className="space-y-4 mb-8">
                {[
                  { step: 1, title: 'Choose Destination', desc: 'Pick where you want to go' },
                  { step: 2, title: 'Add Places & Activities', desc: 'Customize your itinerary' },
                  { step: 3, title: 'Save & Share Trip', desc: 'Keep it organized and accessible' }
                ].map((item) => (
                  <div key={item.step} className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      <p className="text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <Link to="/trips">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 text-lg rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
                  Start Planning
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8">
                <div className="space-y-4">
                  {['Day 1: Arrival & City Tour', 'Day 2: Cultural Sites', 'Day 3: Beach & Relaxation'].map((day, index) => (
                    <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <span className="font-medium text-gray-900">{day}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Stay Anywhere */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Stay Anywhere</h2>
            <p className="text-xl text-gray-600">Find the perfect accommodation for your journey</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {accommodations.map((stay) => (
              <Card key={stay.id} className="overflow-hidden hover:shadow-xl transition-all duration-300">
                <ImageWithFallback
                  src={stay.image}
                  fallbackSrc={stay.fallbackImage}
                  alt={stay.name}
                  className="w-full h-48 object-cover"
                />
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{stay.name}</h3>
                      <div className="flex items-center space-x-1 mt-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">{stay.rating}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">{stay.price}</p>
                      <p className="text-sm text-gray-500">per night</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 mb-4">
                    {stay.amenities.includes('wifi') && <Wifi className="w-4 h-4 text-gray-400" />}
                    {stay.amenities.includes('breakfast') && <Coffee className="w-4 h-4 text-gray-400" />}
                    {stay.amenities.includes('pool') && <span className="text-xs text-gray-400">🏊</span>}
                  </div>
                  
                  <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
                    Book Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Get Around */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Get Around</h2>
            <p className="text-xl text-gray-600">Easy transportation options for every journey</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12">
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Plane className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Flights & Long Distance</h3>
                  <p className="text-gray-600">International and domestic flights</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900">Colombo → Dubai</span>
                  <span className="text-blue-600 font-medium">4h 30m | $280</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900">Paris → London</span>
                  <span className="text-blue-600 font-medium">1h 15m | $120</span>
                </div>
              </div>
            </Card>
            
            <Card className="p-8 hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Train className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Local Transport</h3>
                  <p className="text-gray-600">Trains, buses, and local options</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900">Colombo → Ella</span>
                  <span className="text-green-600 font-medium">7h | $3</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900">City Bus Pass</span>
                  <span className="text-green-600 font-medium">Daily | $5</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 6. Local Essentials */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Local Essentials</h2>
            <p className="text-xl text-gray-600">Know before you go</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: '💬', title: 'Language', info: 'Sinhala, Tamil, English' },
              { icon: '💰', title: 'Currency', info: 'LKR (1 USD = 320 LKR)' },
              { icon: '☀️', title: 'Weather', info: '28°C, Sunny' },
              { icon: '⚠️', title: 'Emergency', info: '119 Police, 110 Fire' }
            ].map((item, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.info}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Events & Festivals */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Events & Festivals</h2>
            <p className="text-xl text-gray-600">Experience local culture and celebrations</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {events.map((event) => (
              <Card key={event.id} className="overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="relative">
                  <ImageWithFallback
                    src={event.image}
                    fallbackSrc={event.fallbackImage}
                    alt={event.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {event.daysLeft} days left
                  </div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{event.name}</h3>
                  <div className="flex items-center space-x-4 text-gray-600 mb-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                  </div>
                  <Button className="w-full bg-purple-600 text-white hover:bg-purple-700">
                    Get Tickets
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Local Guides */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Local Experts</h2>
            <p className="text-xl text-gray-600">Connect with experienced local guides</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {guides.map((guide) => (
              <Card key={guide.id} className="p-6 text-center hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <img 
                  src={guide.image} 
                  alt={guide.name}
                  className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                />
                <h3 className="text-lg font-bold text-gray-900 mb-2">{guide.name}</h3>
                <p className="text-blue-600 font-medium mb-2">{guide.specialty}</p>
                <p className="text-gray-600 text-sm mb-4">{guide.language}</p>
                <div className="flex items-center justify-center space-x-1 mb-4">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">{guide.rating}</span>
                </div>
                <Button className="w-full bg-green-600 text-white hover:bg-green-700">
                  Contact Guide
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>



      {/* Floating AI Assistant Button */}
      {!showChatbot && (
        <button
          onClick={() => setShowChatbot(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 z-50 flex items-center justify-center"
        >
          <Bot className="w-8 h-8" />
        </button>
      )}

      {/* Floating Chatbot */}
      {showChatbot && (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bot className="w-6 h-6" />
              <span className="font-medium">AI Travel Assistant</span>
            </div>
            <button onClick={() => setShowChatbot(false)} className="text-white hover:text-gray-200">
              ×
            </button>
          </div>
          <div className="flex flex-col h-80">
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-lg ${message.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                    {message.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask me about travel plans..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



    </div>
  )
}