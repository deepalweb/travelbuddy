import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '../components/Card'
import { Button } from '../components/Button'
import { 
  Search, MapPin, Filter, Star, Users, Phone, Mail, 
  MessageCircle, Heart, Map, Grid, List, ChevronDown,
  Globe, Award, Clock, Languages, X, Calendar, DollarSign
} from 'lucide-react'

interface TravelAgent {
  id: string
  name: string
  agency: string
  photo: string
  location: string
  specializations: string[]
  rating: number
  reviewCount: number
  languages: string[]
  verified: boolean
  experience: number
  description: string
  phone: string
  email: string
  priceRange: string
  responseTime?: string
  totalTrips?: number
  trustBadges?: string[]
  profileCompletion?: number
}

const mockAgents: TravelAgent[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    agency: 'Adventure Lanka Tours',
    photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
    location: 'Colombo, Sri Lanka',
    specializations: ['Adventure & Hiking', 'Cultural Tours', 'Wildlife & Safari'],
    rating: 4.8,
    reviewCount: 127,
    languages: ['English', 'Sinhala'],
    verified: true,
    experience: 8,
    description: 'Specialized in authentic Sri Lankan experiences with focus on adventure and cultural immersion.',
    phone: '+94 77 123 4567',
    email: 'sarah@adventurelanka.com',
    priceRange: '$50-150/day',
    responseTime: '< 1 hour',
    totalTrips: 340,
    trustBadges: ['Top 1% Agent', 'Highly rated by couples'],
    profileCompletion: 95
  },
  {
    id: '2',
    name: 'Rajesh Patel',
    agency: 'Island Paradise Travel',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    location: 'Kandy, Sri Lanka',
    specializations: ['Honeymoon & Romance', 'Luxury & VIP', 'Beach & Coastal'],
    rating: 4.9,
    reviewCount: 89,
    languages: ['English', 'Hindi', 'Tamil'],
    verified: true,
    experience: 12,
    description: 'Luxury travel specialist creating unforgettable honeymoon and beach experiences.',
    phone: '+94 81 234 5678',
    email: 'rajesh@islandparadise.lk',
    priceRange: '$100-300/day',
    responseTime: '< 2 hours',
    totalTrips: 520,
    trustBadges: ['Award Winner', 'Great for luxury trips'],
    profileCompletion: 88
  },
  {
    id: '3',
    name: 'Emma Thompson',
    agency: 'Family Adventures LK',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    location: 'Galle, Sri Lanka',
    specializations: ['Family Travel', 'Educational Tours', 'Wildlife & Safari'],
    rating: 4.7,
    reviewCount: 156,
    languages: ['English', 'German'],
    verified: true,
    experience: 6,
    description: 'Family travel expert specializing in educational and wildlife experiences for all ages.',
    phone: '+94 91 345 6789',
    email: 'emma@familyadventures.lk',
    priceRange: '$75-200/day',
    responseTime: '< 3 hours',
    totalTrips: 280,
    trustBadges: ['Great for family trips', 'Popular this month'],
    profileCompletion: 92
  }
]

const specializations = [
  'Adventure & Hiking', 'Cultural Tours', 'Family Travel', 'Honeymoon & Romance', 
  'Luxury & VIP', 'Wildlife & Safari', 'Beach & Coastal', 'Photography Tours',
  'Budget Backpacking', 'Pilgrimage Tours', 'Eco-Tourism', 'Road Trip Specialists',
  'Digital Nomad Support', 'Educational Tours', 'Solo Travel', 'Business Travel'
]
const locations = ['Colombo', 'Kandy', 'Galle', 'Negombo', 'Ella', 'Sigiriya', 'Anuradhapura', 'Mirissa', 'Bentota', 'Nuwara Eliya']
const regions = ['Western Province', 'Central Province', 'Southern Province', 'Hill Country', 'Cultural Triangle']
const languages = ['English', 'Sinhala', 'Tamil', 'Hindi', 'German', 'French', 'Japanese', 'Chinese']
const experienceLevels = ['1-3 years', '3-7 years', '7-10 years', '10+ years']
const verificationTypes = ['TravelBuddy Verified', 'Government Licensed', 'Tour Guide License', 'Insurance Covered', 'Award Winner']

export const TravelAgentsPage: React.FC = () => {
  const [agents, setAgents] = useState<TravelAgent[]>([])
  const [filteredAgents, setFilteredAgents] = useState<TravelAgent[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([])
  const [minRating, setMinRating] = useState(0)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [selectedExperience, setSelectedExperience] = useState('')
  const [selectedVerifications, setSelectedVerifications] = useState<string[]>([])
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<TravelAgent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAgents()
  }, [])

  useEffect(() => {
    filterAgents()
  }, [agents, searchTerm, selectedLocation, selectedRegion, selectedSpecializations, minRating, selectedLanguages, selectedExperience, selectedVerifications, verifiedOnly])

  const fetchAgents = async () => {
    try {
      setLoading(true)
      const response = await fetch('https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api/travel-agents')
      if (response.ok) {
        const data = await response.json()
        setAgents(data)
      } else {
        setAgents(mockAgents)
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error)
      setAgents(mockAgents)
    } finally {
      setLoading(false)
    }
  }

  const filterAgents = () => {
    let filtered = agents.filter(agent => {
      const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           agent.agency.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesLocation = !selectedLocation || agent.location.includes(selectedLocation)
      const matchesSpecialization = selectedSpecializations.length === 0 ||
                                   selectedSpecializations.some(spec => agent.specializations.includes(spec))
      const matchesRating = agent.rating >= minRating
      const matchesLanguage = selectedLanguages.length === 0 ||
                             selectedLanguages.some(lang => agent.languages.includes(lang))
      const matchesVerified = !verifiedOnly || agent.verified

      return matchesSearch && matchesLocation && matchesSpecialization && 
             matchesRating && matchesLanguage && matchesVerified
    })
    setFilteredAgents(filtered)
  }

  const toggleSpecialization = (spec: string) => {
    setSelectedSpecializations(prev =>
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    )
  }

  const toggleLanguage = (lang: string) => {
    setSelectedLanguages(prev =>
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 pt-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800 text-white py-20 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white/20 rounded-full"></div>
          <div className="absolute top-32 right-20 w-24 h-24 border-2 border-white/20 rounded-full"></div>
          <div className="absolute bottom-20 left-1/4 w-16 h-16 border-2 border-white/20 rounded-full"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="text-center mb-8">
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Find Expert Travel Agents
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-6">
              Connect with 230+ verified local travel experts for personalized Sri Lankan experiences
            </p>
            
            {/* Stats */}
            <div className="flex justify-center space-x-8 mb-8">
              <div className="text-center">
                <div className="text-2xl font-bold">230+</div>
                <div className="text-sm text-blue-200">Verified Agents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">5,000+</div>
                <div className="text-sm text-blue-200">Successful Trips</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">4.8★</div>
                <div className="text-sm text-blue-200">Average Rating</div>
              </div>
            </div>
          </div>

          {/* Enhanced Search Bar */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70" />
                  <input
                    type="text"
                    placeholder="Try 'Honeymoon planners', 'Safari experts', or agent names..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 text-lg"
                  />
                  {/* Search Suggestions */}
                  {searchTerm && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl z-10 max-h-60 overflow-y-auto">
                      {['Honeymoon planners', 'Safari experts', 'Budget-friendly agents', 'Luxury travel specialists'].filter(s => 
                        s.toLowerCase().includes(searchTerm.toLowerCase())
                      ).map(suggestion => (
                        <div key={suggestion} className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-gray-700 border-b last:border-b-0"
                             onClick={() => setSearchTerm(suggestion)}>
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  className="bg-white/20 hover:bg-white/30 border border-white/30 text-white px-8 py-4 rounded-xl text-lg font-medium"
                >
                  <Filter className="w-5 h-5 mr-2" />
                  Smart Filters
                </Button>
              </div>
              
              {/* Popular Searches */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-white/70 text-sm mr-2">Popular:</span>
                {['Adventure specialists', 'Cultural tours', 'Family-friendly', 'Luxury experiences'].map(tag => (
                  <button key={tag} onClick={() => setSearchTerm(tag)}
                          className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-full text-sm text-white/90 transition-colors">
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters Panel */}
        {showFilters && (
          <Card className="mb-8 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">All Cities</option>
                    {locations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>

                {/* Region Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">All Regions</option>
                    {regions.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>

                {/* Experience Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                  <select
                    value={selectedExperience}
                    onChange={(e) => setSelectedExperience(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">Any Experience</option>
                    {experienceLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value={0}>Any Rating</option>
                    <option value={4}>4+ Stars</option>
                    <option value={4.5}>4.5+ Stars</option>
                    <option value={4.8}>Top Rated (4.8+)</option>
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">View</label>
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`flex-1 px-2 py-2 text-xs ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
                    >
                      <Grid className="w-4 h-4 mx-auto" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex-1 px-2 py-2 text-xs ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
                    >
                      <List className="w-4 h-4 mx-auto" />
                    </button>
                    <button
                      onClick={() => setViewMode('map')}
                      className={`flex-1 px-2 py-2 text-xs ${viewMode === 'map' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
                    >
                      <Map className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Recommendation Button */}
              <div className="mt-4 flex justify-center">
                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg">
                  🤖 Show AI-Recommended Agents
                </Button>
              </div>

              {/* Specialization Tags */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Specializations</label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                  {specializations.map(spec => (
                    <button
                      key={spec}
                      onClick={() => toggleSpecialization(spec)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors text-center ${
                        selectedSpecializations.includes(spec)
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {spec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Verification Types */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Verification & Credentials</label>
                <div className="flex flex-wrap gap-2">
                  {verificationTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedVerifications(prev =>
                          prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                        )
                      }}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedVerifications.includes(type)
                          ? 'bg-green-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {filteredAgents.length} Travel Agents Found
          </h2>
        </div>

        {/* Map View */}
        {viewMode === 'map' && (
          <div className="mb-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg p-8 text-center">
                  <Map className="w-16 h-16 mx-auto mb-4 text-indigo-600" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Interactive Map View</h3>
                  <p className="text-gray-600 mb-4">See agents on an interactive map with location pins</p>
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Coming Soon - Map Integration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Agents Grid/List */}
        {viewMode !== 'map' && (
          loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
          }>
            {filteredAgents.map(agent => (
              <Card key={agent.id} className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg overflow-hidden">
                <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header with photo and basic info */}
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <img
                        src={agent.photo}
                        alt={agent.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                      />
                      {agent.verified && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                          <Award className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {agent.profileCompletion && agent.profileCompletion > 90 && (
                        <div className="absolute -top-1 -left-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                          <span className="text-xs text-white font-bold">✓</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {agent.name}
                        </h3>
                        <span className="text-xs text-gray-500">{agent.experience} years exp</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{agent.agency}</p>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                        <div className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {agent.location.split(',')[0]}
                        </div>
                        <div className="flex items-center">
                          <Star className="w-3 h-3 mr-1 text-yellow-500 fill-current" />
                          {agent.rating} ({agent.reviewCount})
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {agent.responseTime}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {agent.totalTrips}+ trips
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trust badges */}
                  {agent.trustBadges && agent.trustBadges.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {agent.trustBadges.map(badge => (
                        <span key={badge} className="px-2 py-1 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 text-xs rounded-full font-medium">
                          ⭐ {badge}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Specializations */}
                  <div className="flex flex-wrap gap-1">
                    {agent.specializations.slice(0, 3).map(spec => (
                      <span key={spec} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-lg">
                        {spec}
                      </span>
                    ))}
                    {agent.specializations.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                        +{agent.specializations.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Languages and actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Languages className="w-3 h-3" />
                      <span>{agent.languages.slice(0, 2).join(', ')}</span>
                      {agent.languages.length > 2 && <span>+{agent.languages.length - 2}</span>}
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" className="text-xs px-3 py-1">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Chat
                      </Button>
                      <Button 
                        size="sm" 
                        className="text-xs px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                        onClick={() => setSelectedAgent(agent)}
                      >
                        View Profile
                      </Button>
                    </div>
                  </div>
                </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )
        )}

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 rounded-2xl p-12 border border-indigo-100">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Join Our Elite Agent Network</h3>
            <p className="text-lg text-gray-600 mb-8">
              Become part of Sri Lanka's premier travel agent community. Connect with 1000+ travelers monthly and grow your business with verified leads.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <Award className="w-5 h-5 mr-2 text-indigo-600" />
                Verified Professional Status
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Users className="w-5 h-5 mr-2 text-indigo-600" />
                Direct Customer Connections
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <DollarSign className="w-5 h-5 mr-2 text-indigo-600" />
                Increase Your Revenue
              </div>
            </div>
            <Link to="/travel-agent-registration">
              <Button className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-700 hover:via-purple-700 hover:to-blue-700 text-white px-10 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all">
                🚀 Register as Travel Agent
              </Button>
            </Link>
          </div>
        </div>

        {/* Agent Profile Modal */}
        {selectedAgent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="relative bg-gradient-to-r from-teal-600 to-blue-700 text-white p-6 rounded-t-2xl">
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="flex items-start space-x-6">
                  <div className="relative">
                    <img
                      src={selectedAgent.photo}
                      alt={selectedAgent.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white/20"
                    />
                    {selectedAgent.verified && (
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                        <Award className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold mb-2">{selectedAgent.name}</h2>
                    <p className="text-xl text-blue-100 mb-3">{selectedAgent.agency}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center bg-white/20 rounded-lg px-3 py-1">
                        <MapPin className="w-4 h-4 mr-2" />
                        {selectedAgent.location}
                      </div>
                      <div className="flex items-center bg-white/20 rounded-lg px-3 py-1">
                        <Star className="w-4 h-4 mr-2 text-yellow-300 fill-current" />
                        {selectedAgent.rating} ({selectedAgent.reviewCount} reviews)
                      </div>
                      <div className="flex items-center bg-white/20 rounded-lg px-3 py-1">
                        <Clock className="w-4 h-4 mr-2" />
                        {selectedAgent.experience} years experience
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Main Content */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* About */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">About</h3>
                      <p className="text-gray-700 leading-relaxed">{selectedAgent.description}</p>
                    </div>

                    {/* Specializations */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Specializations</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedAgent.specializations.map(spec => (
                          <span key={spec} className="px-3 py-2 bg-teal-100 text-teal-700 rounded-lg font-medium">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Languages */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Languages</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedAgent.languages.map(lang => (
                          <span key={lang} className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Sample Reviews */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Recent Reviews</h3>
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center mb-2">
                            <div className="flex text-yellow-500">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-current" />
                              ))}
                            </div>
                            <span className="ml-2 text-sm text-gray-600">John D. • 2 weeks ago</span>
                          </div>
                          <p className="text-gray-700">"Excellent service! {selectedAgent.name} planned our perfect Sri Lankan adventure. Highly recommended!"</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center mb-2">
                            <div className="flex text-yellow-500">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-current" />
                              ))}
                            </div>
                            <span className="ml-2 text-sm text-gray-600">Sarah M. • 1 month ago</span>
                          </div>
                          <p className="text-gray-700">"Professional and knowledgeable. Made our honeymoon unforgettable!"</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-6">
                    {/* Contact Info */}
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
                        <div className="space-y-3">
                          <div className="flex items-center text-gray-700">
                            <Phone className="w-5 h-5 mr-3 text-teal-600" />
                            <span>{selectedAgent.phone}</span>
                          </div>
                          <div className="flex items-center text-gray-700">
                            <Mail className="w-5 h-5 mr-3 text-teal-600" />
                            <span className="break-all">{selectedAgent.email}</span>
                          </div>
                          <div className="flex items-center text-gray-700">
                            <DollarSign className="w-5 h-5 mr-3 text-teal-600" />
                            <span>{selectedAgent.priceRange}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl">
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Send Message
                      </Button>
                      <Button variant="outline" className="w-full py-3 rounded-xl">
                        <Phone className="w-5 h-5 mr-2" />
                        Call Now
                      </Button>
                      <Button variant="outline" className="w-full py-3 rounded-xl">
                        <Calendar className="w-5 h-5 mr-2" />
                        Book Consultation
                      </Button>
                      <Button variant="outline" className="w-full py-3 rounded-xl">
                        <Heart className="w-5 h-5 mr-2" />
                        Save Agent
                      </Button>
                    </div>

                    {/* Quick Stats */}
                    <Card className="border-0 shadow-lg">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Response Time</span>
                            <span className="font-medium">&lt; 2 hours</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Trips Completed</span>
                            <span className="font-medium">150+</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Repeat Clients</span>
                            <span className="font-medium">85%</span>
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
