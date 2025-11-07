import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '../components/Card'
import { Button } from '../components/Button'
import { 
  Search, MapPin, Filter, Star, Clock, 
  Car, Bus, Plane, Ship, Calendar, Users,
  Wifi, Zap, Coffee, Shield, Phone, Mail,
  ChevronDown, Grid, List, X
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
    email: 'info@lankaexpress.lk'
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

const vehicleTypes = ['All', 'Car', 'Bus', 'Ferry', 'Train', 'Plane']
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
  const [services, setServices] = useState<TransportService[]>(mockServices)
  const [filteredServices, setFilteredServices] = useState<TransportService[]>(mockServices)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVehicleType, setSelectedVehicleType] = useState('All')
  const [fromLocation, setFromLocation] = useState('')
  const [toLocation, setToLocation] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [maxPrice, setMaxPrice] = useState(5000)
  const [minRating, setMinRating] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedService, setSelectedService] = useState<TransportService | null>(null)

  useEffect(() => {
    filterServices()
  }, [searchTerm, selectedVehicleType, fromLocation, toLocation, maxPrice, minRating])

  const filterServices = () => {
    let filtered = services.filter(service => {
      const matchesSearch = service.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           service.route.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesVehicleType = selectedVehicleType === 'All' || service.vehicleType === selectedVehicleType
      const matchesFrom = !fromLocation || service.fromLocation.toLowerCase().includes(fromLocation.toLowerCase())
      const matchesTo = !toLocation || service.toLocation.toLowerCase().includes(toLocation.toLowerCase())
      const matchesPrice = service.price <= maxPrice
      const matchesRating = service.rating >= minRating

      return matchesSearch && matchesVehicleType && matchesFrom && matchesTo && matchesPrice && matchesRating
    })
    setFilteredServices(filtered)
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
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">Transportation Services</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Find reliable transportation for your Sri Lankan adventure
            </p>
          </div>

          {/* Search Form */}
          <div className="max-w-6xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70" />
                  <input
                    type="text"
                    placeholder="From location..."
                    value={fromLocation}
                    onChange={(e) => setFromLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70" />
                  <input
                    type="text"
                    placeholder="To location..."
                    value={toLocation}
                    onChange={(e) => setToLocation(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <Button className="bg-white text-blue-600 hover:bg-blue-50 py-3 rounded-xl font-semibold">
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {vehicleTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedVehicleType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedVehicleType === type
                        ? 'bg-white text-blue-600'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
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
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="mb-8 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              </div>
            </CardContent>
          </Card>
        )}

        {/* Services Grid/List */}
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {filteredServices.map(service => (
            <Card key={service.id} className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={service.image}
                    alt={service.companyName}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 flex items-center">
                    {getVehicleIcon(service.vehicleType)}
                    <span className="ml-2 text-sm font-medium">{service.vehicleType}</span>
                  </div>
                  <div className="absolute top-4 right-4 bg-green-500 text-white rounded-lg px-3 py-1">
                    <span className="text-sm font-bold">LKR {service.price}</span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {service.companyName}
                      </h3>
                      <p className="text-sm text-gray-600">{service.route}</p>
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                      <span className="text-sm font-medium">{service.rating}</span>
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
                      Book Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Are you a Transport Provider?</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Join our network of transport providers and connect with thousands of travelers looking for reliable transportation services.
          </p>
          <Link to="/transport-registration">
            <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-3 rounded-xl">
              Register as Transport Provider
            </Button>
          </Link>
        </div>

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
                            LKR {selectedService.price}
                          </div>
                          <div className="flex items-center justify-center">
                            <Star className="w-5 h-5 text-yellow-500 fill-current mr-1" />
                            <span className="font-medium">{selectedService.rating}</span>
                            <span className="text-gray-500 ml-1">({selectedService.reviewCount} reviews)</span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <Button className="w-full bg-blue-600 hover:bg-blue-700 py-3">
                            Book This Service
                          </Button>
                          <Button variant="outline" className="w-full py-3">
                            <Phone className="w-4 h-4 mr-2" />
                            Call Provider
                          </Button>
                          <Button variant="outline" className="w-full py-3">
                            <Mail className="w-4 h-4 mr-2" />
                            Send Message
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-gray-600">
                            <Phone className="w-4 h-4 mr-2" />
                            {selectedService.phone}
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Mail className="w-4 h-4 mr-2" />
                            {selectedService.email}
                          </div>
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