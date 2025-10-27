import React, { useState, useEffect } from 'react'
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
}

const mockAgents: TravelAgent[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    agency: 'Adventure Lanka Tours',
    photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150&h=150&fit=crop&crop=face',
    location: 'Colombo, Sri Lanka',
    specializations: ['Adventure', 'Cultural', 'Wildlife'],
    rating: 4.8,
    reviewCount: 127,
    languages: ['English', 'Sinhala'],
    verified: true,
    experience: 8,
    description: 'Specialized in authentic Sri Lankan experiences with focus on adventure and cultural immersion.',
    phone: '+94 77 123 4567',
    email: 'sarah@adventurelanka.com',
    priceRange: '$50-150/day'
  },
  {
    id: '2',
    name: 'Rajesh Patel',
    agency: 'Island Paradise Travel',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    location: 'Kandy, Sri Lanka',
    specializations: ['Honeymoon', 'Luxury', 'Beach'],
    rating: 4.9,
    reviewCount: 89,
    languages: ['English', 'Hindi', 'Tamil'],
    verified: true,
    experience: 12,
    description: 'Luxury travel specialist creating unforgettable honeymoon and beach experiences.',
    phone: '+94 81 234 5678',
    email: 'rajesh@islandparadise.lk',
    priceRange: '$100-300/day'
  },
  {
    id: '3',
    name: 'Emma Thompson',
    agency: 'Family Adventures LK',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    location: 'Galle, Sri Lanka',
    specializations: ['Family', 'Educational', 'Wildlife'],
    rating: 4.7,
    reviewCount: 156,
    languages: ['English', 'German'],
    verified: true,
    experience: 6,
    description: 'Family travel expert specializing in educational and wildlife experiences for all ages.',
    phone: '+94 91 345 6789',
    email: 'emma@familyadventures.lk',
    priceRange: '$75-200/day'
  }
]

const specializations = ['Adventure', 'Cultural', 'Family', 'Honeymoon', 'Luxury', 'Wildlife', 'Beach', 'Educational', 'Solo', 'Business']
const locations = ['Colombo', 'Kandy', 'Galle', 'Negombo', 'Ella', 'Sigiriya', 'Anuradhapura']
const languages = ['English', 'Sinhala', 'Tamil', 'Hindi', 'German', 'French']

export const TravelAgentsPage: React.FC = () => {
  const [agents, setAgents] = useState<TravelAgent[]>(mockAgents)
  const [filteredAgents, setFilteredAgents] = useState<TravelAgent[]>(mockAgents)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([])
  const [minRating, setMinRating] = useState(0)
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<TravelAgent | null>(null)

  useEffect(() => {
    filterAgents()
  }, [searchTerm, selectedLocation, selectedSpecializations, minRating, selectedLanguages, verifiedOnly])

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
      <div className="bg-gradient-to-r from-teal-600 to-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">Find Travel Agents</h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Connect with verified local travel experts for personalized experiences
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4 bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/70" />
                <input
                  type="text"
                  placeholder="Search by name or agency..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-white/20 hover:bg-white/30 border border-white/30 text-white px-6 py-3 rounded-xl"
              >
                <Filter className="w-5 h-5 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters Panel */}
        {showFilters && (
          <Card className="mb-8 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">All Locations</option>
                    {locations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value={0}>Any Rating</option>
                    <option value={4}>4+ Stars</option>
                    <option value={4.5}>4.5+ Stars</option>
                  </select>
                </div>

                {/* Verified Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Verification</label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={verifiedOnly}
                      onChange={(e) => setVerifiedOnly(e.target.checked)}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Verified Only</span>
                  </label>
                </div>

                {/* View Mode Toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">View</label>
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`flex-1 px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-teal-600 text-white' : 'bg-white text-gray-700'}`}
                    >
                      <Grid className="w-4 h-4 mx-auto" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`flex-1 px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-teal-600 text-white' : 'bg-white text-gray-700'}`}
                    >
                      <List className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Specialization Tags */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Specializations</label>
                <div className="flex flex-wrap gap-2">
                  {specializations.map(spec => (
                    <button
                      key={spec}
                      onClick={() => toggleSpecialization(spec)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        selectedSpecializations.includes(spec)
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {spec}
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

        {/* Agents Grid/List */}
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {filteredAgents.map(agent => (
            <Card key={agent.id} className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="relative">
                    <img
                      src={agent.photo}
                      alt={agent.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    {agent.verified && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Award className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors">
                      {agent.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{agent.agency}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {agent.location}
                      </div>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-1 text-yellow-500 fill-current" />
                        {agent.rating} ({agent.reviewCount})
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {agent.specializations.slice(0, 3).map(spec => (
                        <span key={spec} className="px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded-full">
                          {spec}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Languages className="w-4 h-4" />
                        <span>{agent.languages.join(', ')}</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="text-xs">
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Contact
                        </Button>
                        <Button 
                          size="sm" 
                          className="text-xs bg-teal-600 hover:bg-teal-700"
                          onClick={() => setSelectedAgent(agent)}
                        >
                          View Profile
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-teal-50 to-blue-50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Are you a Travel Agent?</h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Join our network of verified travel professionals and connect with travelers looking for authentic experiences.
          </p>
          <Button className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl">
            Register as Agent
          </Button>
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