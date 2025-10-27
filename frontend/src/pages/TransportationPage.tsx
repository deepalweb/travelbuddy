import React, { useState } from 'react'
import { 
  Search, MapPin, Star, Phone, MessageCircle, Car, Plane, 
  Bus, Bike, Filter, Grid, List, Map, Heart, Clock, 
  Shield, Users, DollarSign, ChevronDown, X, Eye
} from 'lucide-react'
import { Button } from '../components/Button'

interface TransportProvider {
  id: string
  name: string
  image: string
  location: string
  serviceTypes: string[]
  languages: string[]
  rating: number
  reviewCount: number
  priceRange: string
  verified: boolean
  availability: string
  description: string
  yearsInService: number
  fleetSize: number
  operatingHours: string
  specialties: string[]
  contactPhone: string
  contactEmail: string
  responseTime: string
}

const mockProviders: TransportProvider[] = [
  {
    id: '1',
    name: 'GoBali Transfers',
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400',
    location: 'Kuta, Bali',
    serviceTypes: ['Airport Transfer', 'Private Van', 'Car Rental'],
    languages: ['English', 'Bahasa Indonesia'],
    rating: 4.8,
    reviewCount: 324,
    priceRange: 'From $15 per ride',
    verified: true,
    availability: '24/7 Service',
    description: 'Professional airport transfers and private transportation across Bali with modern fleet.',
    yearsInService: 8,
    fleetSize: 25,
    operatingHours: '24/7',
    specialties: ['Airport Pickup', 'Hotel Transfers', 'Day Tours'],
    contactPhone: '+62 361 123456',
    contactEmail: 'info@gobalitransfers.com',
    responseTime: '&lt; 30 minutes'
  },
  {
    id: '2',
    name: 'BlueSky Vans',
    image: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400',
    location: 'Ubud, Bali',
    serviceTypes: ['Group Transport', 'Tour Bus', 'Private Van'],
    languages: ['English', 'Bahasa Indonesia', 'Japanese'],
    rating: 4.6,
    reviewCount: 189,
    priceRange: '$50-80 per day',
    verified: true,
    availability: 'Book in advance',
    description: 'Comfortable group transportation and tour services with experienced local drivers.',
    yearsInService: 5,
    fleetSize: 12,
    operatingHours: '6AM - 10PM',
    specialties: ['Group Tours', 'Cultural Sites', 'Nature Trips'],
    contactPhone: '+62 361 789012',
    contactEmail: 'bookings@blueskyvans.com',
    responseTime: '&lt; 1 hour'
  },
  {
    id: '3',
    name: 'EcoRide Bali',
    image: 'https://images.unsplash.com/photo-1593941707882-a5bac6861d75?w=400',
    location: 'Seminyak, Bali',
    serviceTypes: ['Electric Car', 'Bike Rental', 'Scooter'],
    languages: ['English', 'Bahasa Indonesia'],
    rating: 4.7,
    reviewCount: 156,
    priceRange: '$25-45 per day',
    verified: false,
    availability: 'Available today',
    description: 'Eco-friendly transportation options including electric vehicles and bike rentals.',
    yearsInService: 3,
    fleetSize: 18,
    operatingHours: '7AM - 9PM',
    specialties: ['Eco Transport', 'City Tours', 'Beach Access'],
    contactPhone: '+62 361 345678',
    contactEmail: 'hello@ecoridebali.com',
    responseTime: '&lt; 45 minutes'
  }
]

const serviceTypes = [
  { id: 'taxi', label: 'Taxi', icon: Car },
  { id: 'airport', label: 'Airport Transfer', icon: Plane },
  { id: 'rental', label: 'Car Rental', icon: Car },
  { id: 'van', label: 'Private Van', icon: Bus },
  { id: 'bus', label: 'Tour Bus', icon: Bus },
  { id: 'bike', label: 'Bike Rental', icon: Bike }
]

export const TransportationPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState([0, 200])
  const [minRating, setMinRating] = useState(0)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [sortBy, setSortBy] = useState('popularity')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<TransportProvider | null>(null)

  const filteredProviders = mockProviders.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         provider.serviceTypes.some(service => service.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesLocation = !selectedLocation || provider.location.includes(selectedLocation)
    const matchesServices = selectedServices.length === 0 || 
                           selectedServices.some(service => provider.serviceTypes.some(pService => 
                             pService.toLowerCase().includes(service.toLowerCase())))
    const matchesRating = provider.rating >= minRating
    const matchesVerified = !verifiedOnly || provider.verified

    return matchesSearch && matchesLocation && matchesServices && matchesRating && matchesVerified
  })

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(s => s !== serviceId)
        : [...prev, serviceId]
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Filters */}
      <div className="bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Find Reliable Transportation Services</h1>
            <p className="text-xl text-blue-100">Connect with trusted local transport providers for your journey</p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
              {/* Search Bar */}
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by provider name or vehicle type"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border-0 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Location Filter */}
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full pl-10 pr-8 py-3 rounded-lg border-0 text-gray-900 focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="">All Locations</option>
                  <option value="Kuta">Kuta, Bali</option>
                  <option value="Ubud">Ubud, Bali</option>
                  <option value="Seminyak">Seminyak, Bali</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>

              {/* Mobile Filter Toggle */}
              <Button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Filter className="w-5 h-5 mr-2" />
                Filters
              </Button>

              {/* View Mode Toggle - Desktop */}
              <div className="hidden lg:flex items-center justify-end space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="text-white border-white/30"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="text-white border-white/30"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-white/20">
                {/* Service Types */}
                <div>
                  <label className="block text-sm font-medium mb-2">Service Type</label>
                  <div className="space-y-2">
                    {serviceTypes.slice(0, 3).map(service => {
                      const Icon = service.icon
                      return (
                        <label key={service.id} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={selectedServices.includes(service.id)}
                            onChange={() => handleServiceToggle(service.id)}
                            className="rounded border-white/30 text-blue-600 focus:ring-blue-500"
                          />
                          <Icon className="w-4 h-4" />
                          <span>{service.label}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">Minimum Rating</label>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(Number(e.target.value))}
                    className="w-full py-2 px-3 rounded-lg border-0 text-gray-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>Any Rating</option>
                    <option value={3}>3+ Stars</option>
                    <option value={4}>4+ Stars</option>
                    <option value={4.5}>4.5+ Stars</option>
                  </select>
                </div>

                {/* Verified Only */}
                <div>
                  <label className="block text-sm font-medium mb-2">Provider Type</label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={verifiedOnly}
                      onChange={(e) => setVerifiedOnly(e.target.checked)}
                      className="rounded border-white/30 text-blue-600 focus:ring-blue-500"
                    />
                    <Shield className="w-4 h-4" />
                    <span>Verified Only</span>
                  </label>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full py-2 px-3 rounded-lg border-0 text-gray-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="popularity">Popularity</option>
                    <option value="rating">Highest Rating</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Transportation Providers</h2>
            <p className="text-gray-600">{filteredProviders.length} providers found</p>
          </div>
          
          {/* Desktop View Toggle */}
          <div className="hidden lg:flex items-center space-x-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4 mr-2" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4 mr-2" />
              List
            </Button>
          </div>
        </div>

        {/* Provider Cards */}
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {filteredProviders.map((provider) => (
            <div
              key={provider.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group"
            >
              {/* Provider Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={provider.image}
                  alt={provider.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {provider.verified && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                    <Shield className="w-3 h-3" />
                    <span>Verified</span>
                  </div>
                )}
                <button className="absolute top-3 left-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors">
                  <Heart className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Provider Info */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{provider.name}</h3>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {provider.location}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 mb-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="font-medium text-gray-900">{provider.rating}</span>
                      <span className="text-sm text-gray-500">({provider.reviewCount})</span>
                    </div>
                  </div>
                </div>

                {/* Service Types */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {provider.serviceTypes.slice(0, 3).map((service, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                    >
                      {service}
                    </span>
                  ))}
                  {provider.serviceTypes.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{provider.serviceTypes.length - 3} more
                    </span>
                  )}
                </div>

                {/* Languages */}
                <div className="flex items-center text-sm text-gray-600 mb-3">
                  <Users className="w-4 h-4 mr-2" />
                  <span>Languages: {provider.languages.join(', ')}</span>
                </div>

                {/* Price and Availability */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-sm">
                    <DollarSign className="w-4 h-4 text-green-600 mr-1" />
                    <span className="font-medium text-gray-900">{provider.priceRange}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{provider.availability}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setSelectedProvider(provider)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  <Button size="sm" className="flex-1">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white">
          <Car className="w-12 h-12 mx-auto mb-4 text-blue-200" />
          <h3 className="text-2xl font-bold mb-2">Are you a transportation provider?</h3>
          <p className="text-blue-100 mb-6">Join our network to reach thousands of travelers</p>
          <Button className="bg-white text-blue-600 hover:bg-blue-50">
            Register as Partner →
          </Button>
        </div>
      </div>

      {/* Provider Detail Modal */}
      {selectedProvider && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="relative">
              <img
                src={selectedProvider.image}
                alt={selectedProvider.name}
                className="w-full h-64 object-cover"
              />
              <button
                onClick={() => setSelectedProvider(null)}
                className="absolute top-4 right-4 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              {selectedProvider.verified && (
                <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                  <Shield className="w-4 h-4" />
                  <span>Verified Partner</span>
                </div>
              )}
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="lg:col-span-2">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedProvider.name}</h2>
                      <div className="flex items-center text-gray-600 mb-4">
                        <MapPin className="w-5 h-5 mr-2" />
                        {selectedProvider.location}
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Star className="w-5 h-5 text-yellow-400 fill-current mr-1" />
                          <span className="font-semibold">{selectedProvider.rating}</span>
                          <span className="text-gray-500 ml-1">({selectedProvider.reviewCount} reviews)</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Clock className="w-5 h-5 mr-1" />
                          <span>Response time: {selectedProvider.responseTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* About */}
                    <div>
                      <h3 className="text-xl font-semibold mb-3">About the Provider</h3>
                      <p className="text-gray-600 leading-relaxed">{selectedProvider.description}</p>
                    </div>

                    {/* Services */}
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Services Offered</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedProvider.serviceTypes.map((service, index) => (
                          <span
                            key={index}
                            className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium"
                          >
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Specialties */}
                    <div>
                      <h3 className="text-xl font-semibold mb-3">Specialties</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {selectedProvider.specialties.map((specialty, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-gray-700">{specialty}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Pricing */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Pricing</h3>
                    <div className="text-2xl font-bold text-green-600 mb-2">{selectedProvider.priceRange}</div>
                    <p className="text-sm text-gray-600">Competitive rates with transparent pricing</p>
                  </div>

                  {/* Quick Stats */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Years in Service</span>
                        <span className="font-medium">{selectedProvider.yearsInService} years</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fleet Size</span>
                        <span className="font-medium">{selectedProvider.fleetSize} vehicles</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Operating Hours</span>
                        <span className="font-medium">{selectedProvider.operatingHours}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Languages</span>
                        <span className="font-medium">{selectedProvider.languages.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="bg-blue-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-blue-600" />
                        <span className="text-gray-700">{selectedProvider.contactPhone}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <MessageCircle className="w-5 h-5 text-blue-600" />
                        <span className="text-gray-700">{selectedProvider.contactEmail}</span>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <Button className="w-full">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Send Message
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Phone className="w-4 h-4 mr-2" />
                        Call Now
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}