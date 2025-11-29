import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '../components/Card'
import { Button } from '../components/Button'
import { configService } from '../services/configService'
import { 
  Search, MapPin, Filter, Star, Clock, 
  Car, Bus, Plane, Ship, Calendar, Users,
  Wifi, Zap, Coffee, Shield, Phone, Mail,
  ChevronDown, Grid, List, X, Map, Bot,
  CheckCircle, TrendingUp, MessageSquare,
  Navigation, Bookmark, GitCompare
} from 'lucide-react'

interface TransportService {
  id: string
  providerId: string
  companyName: string
  vehicleType: string
  route: string
  fromLocation: string
  toLocation: string
  price: number
  duration: string
  departure: string
  arrival: string
  availableSeats: number
  totalSeats: number
  amenities: string[]
  rating: number
  reviewCount: number
  image: string
  description: string
  phone: string
  email: string
  isVerified?: boolean
  isLive?: boolean
  aiRecommended?: boolean
  popularRoute?: boolean
  passengerCapacity?: number
  luggageCapacity?: string
  instantBooking?: boolean
  refundable?: boolean
  ecoFriendly?: boolean
  driverLanguages?: string[]
  insuranceIncluded?: boolean
  lastUpdated?: string
  coordinates?: { lat: number; lng: number }[]
}

const mockServices: TransportService[] = [
  {
    id: '1',
    providerId: 'tp1',
    companyName: 'Lanka Express Transport',
    vehicleType: 'Bus',
    route: 'Colombo - Kandy',
    fromLocation: 'Colombo',
    toLocation: 'Kandy',
    price: 500,
    duration: '3 hours',
    departure: '08:00 AM',
    arrival: '11:00 AM',
    availableSeats: 25,
    totalSeats: 45,
    amenities: ['AC', 'WiFi', 'Charging Ports', 'Refreshments'],
    rating: 4.5,
    reviewCount: 89,
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=250&fit=crop',
    description: 'Comfortable air-conditioned bus service with modern amenities',
    phone: '+94 11 234 5678',
    email: 'info@lankaexpress.lk',
    isVerified: true,
    isLive: true,
    aiRecommended: true,
    popularRoute: true,
    passengerCapacity: 45,
    luggageCapacity: 'Large',
    instantBooking: true,
    refundable: true,
    ecoFriendly: false,
    driverLanguages: ['English', 'Sinhala'],
    insuranceIncluded: true,
    lastUpdated: '2 minutes ago',
    coordinates: [{ lat: 6.9271, lng: 79.8612 }, { lat: 7.2906, lng: 80.6337 }]
  },
  {
    id: '2',
    providerId: 'tp2',
    companyName: 'Island Taxi Service',
    vehicleType: 'Car',
    route: 'Airport - Colombo City',
    fromLocation: 'Bandaranaike Airport',
    toLocation: 'Colombo City',
    price: 2500,
    duration: '45 minutes',
    departure: 'On Demand',
    arrival: 'On Demand',
    availableSeats: 3,
    totalSeats: 4,
    amenities: ['AC', 'English Speaking Driver', 'Child Seats Available'],
    rating: 4.8,
    reviewCount: 156,
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=250&fit=crop',
    description: 'Professional airport transfer service with experienced drivers',
    phone: '+94 77 987 6543',
    email: 'bookings@islandtaxi.lk'
  },
  {
    id: '3',
    providerId: 'tp3',
    companyName: 'Coastal Ferry Services',
    vehicleType: 'Ferry',
    route: 'Colombo - Galle',
    fromLocation: 'Colombo Port',
    toLocation: 'Galle Harbor',
    price: 1200,
    duration: '2.5 hours',
    departure: '09:30 AM',
    arrival: '12:00 PM',
    availableSeats: 80,
    totalSeats: 120,
    amenities: ['Sea Views', 'Onboard Cafe', 'Deck Access', 'Life Jackets'],
    rating: 4.3,
    reviewCount: 67,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=250&fit=crop',
    description: 'Scenic coastal ferry with beautiful ocean views',
    phone: '+94 91 456 7890',
    email: 'ferry@coastal.lk'
  }
]

const vehicleTypes = ['All', 'Car', 'Bus', 'Ferry', 'Train', 'Plane', 'Bike Rental', 'Helicopter']
const popularCountries = ['All Countries', 'Sri Lanka', 'Thailand', 'India', 'Japan', 'USA', 'UK', 'France', 'Spain', 'Italy', 'Greece']
const currencies = { 'Sri Lanka': 'LKR', 'Thailand': 'THB', 'India': 'INR', 'Japan': 'JPY', 'USA': 'USD', 'UK': 'GBP', 'France': 'EUR', 'Spain': 'EUR', 'Italy': 'EUR', 'Greece': 'EUR' }
const amenityIcons: { [key: string]: React.ReactNode } = {
  'AC': <Zap className="w-4 h-4" />,
  'WiFi': <Wifi className="w-4 h-4" />,
  'Charging Ports': <Zap className="w-4 h-4" />,
  'Refreshments': <Coffee className="w-4 h-4" />,
  'English Speaking Driver': <Users className="w-4 h-4" />,
  'Child Seats Available': <Shield className="w-4 h-4" />,
  'Sea Views': <MapPin className="w-4 h-4" />,
  'Onboard Cafe': <Coffee className="w-4 h-4" />,
  'Deck Access': <MapPin className="w-4 h-4" />,
  'Life Jackets': <Shield className="w-4 h-4" />
}

export const TransportationPage: React.FC = () => {
  const [apiBaseUrl, setApiBaseUrl] = useState('')
  const [services, setServices] = useState<TransportService[]>([])
  const [filteredServices, setFilteredServices] = useState<TransportService[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVehicleType, setSelectedVehicleType] = useState('All')
  const [fromLocation, setFromLocation] = useState('')
  const [toLocation, setToLocation] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [maxPrice, setMaxPrice] = useState(5000)
  const [minRating, setMinRating] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedService, setSelectedService] = useState<TransportService | null>(null)
  const [aiSearch, setAiSearch] = useState('')
  const [showAiSuggestions, setShowAiSuggestions] = useState(false)
  const [compareList, setCompareList] = useState<string[]>([])
  const [showComparison, setShowComparison] = useState(false)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [instantBookingOnly, setInstantBookingOnly] = useState(false)
  const [ecoFriendlyOnly, setEcoFriendlyOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchMode, setSearchMode] = useState<'ai' | 'manual'>('ai')
  const [selectedCountry, setSelectedCountry] = useState('All Countries')
  const [selectedCity, setSelectedCity] = useState('')

  useEffect(() => {
    configService.getConfig().then(config => {
      setApiBaseUrl(config.apiBaseUrl)
    })
  }, [])

  useEffect(() => {
    if (apiBaseUrl) fetchServices()
  }, [apiBaseUrl])

  useEffect(() => {
    filterServices()
  }, [services, searchTerm, selectedVehicleType, fromLocation, toLocation, maxPrice, minRating, verifiedOnly, instantBookingOnly, ecoFriendlyOnly])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${apiBaseUrl}/api/transport-providers/services`)
      if (response.ok) {
        const data = await response.json()
        console.log('API Response:', data)
        console.log('First service:', data[0])
        console.log('First service keys:', Object.keys(data[0] || {}))
        console.log('First service image:', data[0]?.image)
        setServices(data)
      } else {
        console.log('API failed, using mock data')
        setServices(mockServices)
      }
    } catch (error) {
      console.error('Failed to fetch services:', error)
      console.log('Using mock data due to error')
      setServices(mockServices)
    } finally {
      setLoading(false)
    }
  }

  const filterServices = () => {
    let filtered = services.filter(service => {
      const matchesSearch = service.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           service.route.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesVehicleType = selectedVehicleType === 'All' || service.vehicleType === selectedVehicleType
      const matchesFrom = !fromLocation || service.fromLocation.toLowerCase().includes(fromLocation.toLowerCase())
      const matchesTo = !toLocation || service.toLocation.toLowerCase().includes(toLocation.toLowerCase())
      const matchesPrice = service.price <= maxPrice
      const matchesRating = service.rating >= minRating
      const matchesVerified = !verifiedOnly || service.isVerified
      const matchesInstantBooking = !instantBookingOnly || service.instantBooking
      const matchesEcoFriendly = !ecoFriendlyOnly || service.ecoFriendly
      // Date filtering can be implemented when services have schedule data
      const matchesDate = !selectedDate // Placeholder for future date filtering

      return matchesSearch && matchesVehicleType && matchesFrom && matchesTo && matchesPrice && matchesRating && matchesVerified && matchesInstantBooking && matchesEcoFriendly && matchesDate
    })
    
    // Sort by AI recommendations first
    filtered.sort((a, b) => {
      if (a.aiRecommended && !b.aiRecommended) return -1
      if (!a.aiRecommended && b.aiRecommended) return 1
      if (a.popularRoute && !b.popularRoute) return -1
      if (!a.popularRoute && b.popularRoute) return 1
      return b.rating - a.rating
    })
    
    setFilteredServices(filtered)
  }

  const handleAiSearch = async () => {
    if (!aiSearch.trim()) return
    setShowAiSuggestions(true)
    // Simulate AI processing
    setTimeout(() => {
      // Parse natural language and set filters
      if (aiSearch.toLowerCase().includes('kandy')) setToLocation('Kandy')
      if (aiSearch.toLowerCase().includes('comfortable')) setMinRating(4)
      if (aiSearch.toLowerCase().includes('cheap')) setMaxPrice(1000)
      setShowAiSuggestions(false)
    }, 1500)
  }

  const toggleCompare = (serviceId: string) => {
    setCompareList(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : prev.length < 3 ? [...prev, serviceId] : prev
    )
  }

  const getVehicleIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'car': return <Car className="w-5 h-5" />
      case 'bus': return <Bus className="w-5 h-5" />
      case 'ferry': return <Ship className="w-5 h-5" />
      case 'plane': return <Plane className="w-5 h-5" />
      default: return <Car className="w-5 h-5" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 pt-20">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-green-600 text-white py-16 overflow-hidden">
        {/* Subtle Background Texture */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1920&h=400&fit=crop&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">Find Transport Anywhere in the World</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Discover reliable transportation for your next adventure - from local taxis to international trains
            </p>
          </div>

          {/* Tabbed Search Container */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl">
              {/* Tabs */}
              <div className="flex border-b border-white/20">
                <button
                  onClick={() => setSearchMode('ai')}
                  className={`flex-1 px-6 py-4 font-semibold transition-all duration-300 ${
                    searchMode === 'ai'
                      ? 'bg-white/20 text-white border-b-2 border-white'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <Bot className="w-5 h-5 mr-2" />
                    Ask AI Assistant
                  </div>
                </button>
                <button
                  onClick={() => setSearchMode('manual')}
                  className={`flex-1 px-6 py-4 font-semibold transition-all duration-300 ${
                    searchMode === 'manual'
                      ? 'bg-white/20 text-white border-b-2 border-white'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Manual Search
                  </div>
                </button>
              </div>

              {/* AI Search Content */}
              {searchMode === 'ai' && (
                <div className="p-6">
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Bot className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Try: 'Fast train from Tokyo to Osaka' or 'Ferry from Athens to Santorini' or 'Van for 7 to Kandy'"
                        value={aiSearch}
                        onChange={(e) => setAiSearch(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAiSearch()}
                        className="w-full pl-12 pr-4 py-4 bg-white border-2 border-transparent rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-400 shadow-lg"
                      />
                    </div>
                    <Button 
                      onClick={handleAiSearch}
                      className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 px-8 py-4 rounded-xl font-semibold shadow-lg border-2 border-white/30"
                      disabled={showAiSuggestions}
                    >
                      {showAiSuggestions ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : (
                        <>
                          <Bot className="w-5 h-5 mr-2" />
                          Search
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-white/80 text-sm mt-3 text-center">
                    💡 Works worldwide: Paris→London, Bangkok→Phuket, NYC→Boston, Colombo→Kandy
                  </p>
                </div>
              )}

              {/* Manual Search Content */}
              {searchMode === 'manual' && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="relative">
                      <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 0C6.14 0 3 3.14 3 7c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                      <select
                        value={selectedCountry}
                        onChange={(e) => setSelectedCountry(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border-2 border-transparent rounded-xl text-gray-900 focus:outline-none focus:border-blue-400 shadow-lg appearance-none cursor-pointer"
                      >
                        {popularCountries.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="City or region..."
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border-2 border-transparent rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 shadow-lg"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="From location..."
                        value={fromLocation}
                        onChange={(e) => setFromLocation(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border-2 border-transparent rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 shadow-lg"
                      />
                    </div>
                    <div className="relative">
                      <Navigation className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="To location..."
                        value={toLocation}
                        onChange={(e) => setToLocation(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border-2 border-transparent rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-400 shadow-lg"
                      />
                    </div>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border-2 border-transparent rounded-xl text-gray-900 focus:outline-none focus:border-blue-400 shadow-lg"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-white/90 text-sm mb-2 font-medium">🚗 Transport Type:</p>
                    <div className="flex flex-wrap gap-2">
                      {vehicleTypes.map(type => {
                        const icons: { [key: string]: string } = {
                          'All': '🌐',
                          'Car': '🚗',
                          'Bus': '🚌',
                          'Ferry': '⛴️',
                          'Train': '🚆',
                          'Plane': '✈️',
                          'Bike Rental': '🚴',
                          'Helicopter': '🚁'
                        }
                        return (
                          <button
                            key={type}
                            onClick={() => setSelectedVehicleType(type)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              selectedVehicleType === type
                                ? 'bg-white text-blue-600 shadow-lg scale-105'
                                : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                          >
                            <span className="mr-1">{icons[type]}</span>
                            {type}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={filterServices}
                    className="w-full bg-white text-blue-600 hover:bg-blue-50 py-4 rounded-xl font-semibold shadow-lg"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Search Transportation
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters & Results Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {filteredServices.length} Services Found
            </h2>
            <p className="text-gray-600">Choose from available transportation options</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {compareList.length > 0 && (
              <Button
                onClick={() => setShowComparison(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <GitCompare className="w-4 h-4 mr-2" />
                Compare ({compareList.length})
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-2 ${viewMode === 'map' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              >
                <Map className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="mb-8 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Price (LKR)</label>
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    step="100"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-600 mt-1">Up to LKR {maxPrice}</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>Any Rating</option>
                    <option value={3}>3+ Stars</option>
                    <option value={4}>4+ Stars</option>
                    <option value={4.5}>4.5+ Stars</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Services</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by company or route..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quick Filters</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="mr-2" 
                        checked={verifiedOnly}
                        onChange={(e) => setVerifiedOnly(e.target.checked)}
                      />
                      <span className="text-sm">Verified Only</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="mr-2" 
                        checked={instantBookingOnly}
                        onChange={(e) => setInstantBookingOnly(e.target.checked)}
                      />
                      <span className="text-sm">Instant Booking</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="mr-2" 
                        checked={ecoFriendlyOnly}
                        onChange={(e) => setEcoFriendlyOnly(e.target.checked)}
                      />
                      <span className="text-sm">Eco-Friendly</span>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Map View */}
        {viewMode === 'map' && (
          <Card className="mb-8 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
                <div className="text-center">
                  <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Interactive Map View</h3>
                  <p className="text-gray-500">Map integration with Google Maps API coming soon</p>
                  <p className="text-sm text-gray-400 mt-2">Will show routes, pickup points, and real-time locations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Services Grid/List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : viewMode === 'list' ? 'space-y-4' : 'hidden'
          }>
            {filteredServices.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Car className="w-16 h-16 mx-auto mb-4" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No services found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search criteria or filters</p>
                <Button 
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedVehicleType('All')
                    setFromLocation('')
                    setToLocation('')
                    setMaxPrice(5000)
                    setMinRating(0)
                    setVerifiedOnly(false)
                    setInstantBookingOnly(false)
                    setEcoFriendlyOnly(false)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Clear All Filters
                </Button>
              </div>
            ) : (
              filteredServices.map(service => (
            <Card key={service.id} className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={service.image?.replace(/&amp;/g, '&')}
                    alt={service.companyName}
                    className="w-full h-48 object-cover rounded-t-lg"
                    onError={(e) => {
                      console.log('Image failed to load:', service.image)
                      e.currentTarget.src = 'https://via.placeholder.com/400x250/3B82F6/FFFFFF?text=Transport+Service'
                    }}
                  />
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 flex items-center">
                      {getVehicleIcon(service.vehicleType)}
                      <span className="ml-2 text-sm font-medium">{service.vehicleType}</span>
                    </div>
                    {service.aiRecommended && (
                      <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg px-2 py-1 flex items-center">
                        <Bot className="w-3 h-3 mr-1" />
                        <span className="text-xs font-medium">AI Pick</span>
                      </div>
                    )}
                    {service.popularRoute && (
                      <div className="bg-orange-500 text-white rounded-lg px-2 py-1 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        <span className="text-xs font-medium">Popular</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <div className="bg-green-500 text-white rounded-lg px-3 py-1">
                      <span className="text-xs text-green-100">LKR</span>
                      <span className="text-sm font-bold ml-1">{service.price}</span>
                    </div>
                    {service.isLive && (
                      <div className="bg-red-500 text-white rounded-lg px-2 py-1 flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                        <span className="text-xs">Live</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute bottom-4 right-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleCompare(service.id)
                      }}
                      className={`p-2 rounded-full transition-colors ${
                        compareList.includes(service.id)
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/80 text-gray-700 hover:bg-white'
                      }`}
                    >
                      <GitCompare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {service.companyName}
                        </h3>
                        {service.isVerified && (
                          <CheckCircle className="w-4 h-4 text-blue-500" title="Verified Provider" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{service.route}</p>
                      {service.lastUpdated && (
                        <p className="text-xs text-green-600">Updated {service.lastUpdated}</p>
                      )}
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                      <span className="text-sm font-medium">{service.rating.toFixed(1)}</span>
                      <span className="text-xs text-gray-500 ml-1">({service.reviewCount})</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      {service.duration}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      {service.availableSeats} seats
                    </div>
                    <div className="text-gray-600">
                      Depart: {service.departure}
                    </div>
                    <div className="text-gray-600">
                      Arrive: {service.arrival}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {service.amenities.slice(0, 3).map(amenity => (
                      <span key={amenity} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {amenityIcons[amenity]}
                        <span className="ml-1">{amenity}</span>
                      </span>
                    ))}
                    {service.amenities.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        +{service.amenities.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedService(service)}
                    >
                      View Details
                    </Button>
                    <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                      {service.instantBooking ? 'Book Instantly' : 'Request Booking'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="px-3"
                    >
                      <Bookmark className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
              ))
            )}
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Are you a Transport Provider?</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Join our global network of transport providers from 50+ countries. Connect with travelers worldwide looking for reliable transportation.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/transport-registration">
              <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-3 rounded-xl">
                Register as Transport Provider
              </Button>
            </Link>
            <Button variant="outline" className="px-8 py-3 rounded-xl">
              <Navigation className="w-5 h-5 mr-2" />
              View Provider Dashboard
            </Button>
          </div>
        </div>

        {/* Comparison Modal */}
        {showComparison && compareList.length > 0 && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-900">Compare Services</h2>
                  <button
                    onClick={() => setShowComparison(false)}
                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {compareList.map(serviceId => {
                    const service = services.find(s => s.id === serviceId)
                    if (!service) return null
                    
                    return (
                      <Card key={service.id} className="border-2">
                        <CardContent className="p-4">
                          <img src={service.image} alt={service.companyName} className="w-full h-32 object-cover rounded-lg mb-4" />
                          <h3 className="font-bold text-lg mb-2">{service.companyName}</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Price:</span>
                              <span className="font-semibold text-green-600">
                                <span className="text-xs text-gray-500">LKR</span> {service.price}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Rating:</span>
                              <span className="flex items-center">
                                <Star className="w-3 h-3 text-yellow-500 fill-current mr-1" />
                                {service.rating.toFixed(1)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Duration:</span>
                              <span>{service.duration}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Seats:</span>
                              <span>{service.availableSeats} available</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Booking:</span>
                              <span>{service.instantBooking ? 'Instant' : 'Request'}</span>
                            </div>
                          </div>
                          <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                            Select This
                          </Button>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Service Detail Modal */}
        {selectedService && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="relative">
                <img
                  src={selectedService.image}
                  alt={selectedService.companyName}
                  className="w-full h-64 object-cover rounded-t-2xl"
                />
                <button
                  onClick={() => setSelectedService(null)}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedService.companyName}</h2>
                    <p className="text-xl text-gray-600 mb-4">{selectedService.route}</p>
                    <p className="text-gray-700 mb-6">{selectedService.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Schedule</h4>
                        <p className="text-sm text-gray-600">Departure: {selectedService.departure}</p>
                        <p className="text-sm text-gray-600">Arrival: {selectedService.arrival}</p>
                        <p className="text-sm text-gray-600">Duration: {selectedService.duration}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Capacity</h4>
                        <p className="text-sm text-gray-600">Available: {selectedService.availableSeats} seats</p>
                        <p className="text-sm text-gray-600">Total: {selectedService.totalSeats} seats</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Amenities</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedService.amenities.map(amenity => (
                          <div key={amenity} className="flex items-center text-sm text-gray-600">
                            {amenityIcons[amenity]}
                            <span className="ml-2">{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6">
                        <div className="text-center mb-4">
                          <div className="text-3xl font-bold text-green-600 mb-2">
                            <span className="text-lg text-gray-500">LKR</span> {selectedService.price}
                          </div>
                          <div className="flex items-center justify-center mb-2">
                            <Star className="w-5 h-5 text-yellow-500 fill-current mr-1" />
                            <span className="font-medium">{selectedService.rating.toFixed(1)}</span>
                            <span className="text-gray-500 ml-1">({selectedService.reviewCount} reviews)</span>
                          </div>
                          {selectedService.isVerified && (
                            <div className="flex items-center justify-center text-blue-600 text-sm">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Verified Provider
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          <Button className="w-full bg-blue-600 hover:bg-blue-700 py-3">
                            {selectedService.instantBooking ? 'Book Instantly' : 'Request Booking'}
                          </Button>
                          <Button variant="outline" className="w-full py-3">
                            <Bookmark className="w-4 h-4 mr-2" />
                            Add to Trip Plan
                          </Button>
                          <Button variant="outline" className="w-full py-3">
                            <Phone className="w-4 h-4 mr-2" />
                            Call Provider
                          </Button>
                          <Button variant="outline" className="w-full py-3">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Chat with Provider
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Provider Info</h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Phone className="w-4 h-4 mr-2" />
                            {selectedService.phone}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Mail className="w-4 h-4 mr-2" />
                            {selectedService.email}
                          </div>
                          {selectedService.lastUpdated && (
                            <div className="text-green-600">
                              Last updated: {selectedService.lastUpdated}
                            </div>
                          )}
                          {selectedService.insuranceIncluded && (
                            <div className="flex items-center text-blue-600">
                              <Shield className="w-4 h-4 mr-2" />
                              Insurance Included
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Community Insights</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p>• 45 travelers used this route last month</p>
                          <p>• Highly rated for punctuality</p>
                          <p>• Popular among solo travelers</p>
                          <Button variant="outline" size="sm" className="w-full mt-3">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            View Community Stories
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
