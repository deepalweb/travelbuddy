import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Filter, Search, Tag, TrendingUp, Clock, MapPin, Plus, Star, Zap, Target, Award } from 'lucide-react'
import { Button } from '../components/Button'
import { DealCard } from '../components/DealCard'
import { dealsService } from '../services/dealsService'
import { useUserLocation } from '../hooks/useUserLocation'

interface Deal {
  _id: string;
  title: string;
  description: string;
  discount: string;
  businessName: string;
  businessType: string;
  originalPrice: string;
  discountedPrice: string;
  location: {
    address: string;
  };
  images: string[];
  views: number;
  claims: number;
  isActive: boolean;
  validUntil?: Date;
  createdAt?: Date;
}

const businessTypes = [
  { value: 'all', label: 'All Categories', icon: Tag },
  { value: 'restaurant', label: 'Restaurants', icon: Tag },
  { value: 'hotel', label: 'Hotels', icon: Tag },
  { value: 'cafe', label: 'Cafes', icon: Tag },
  { value: 'attraction', label: 'Attractions', icon: Tag },
  { value: 'transport', label: 'Transport', icon: Tag }
]

const sortOptions = [
  { value: 'trending', label: 'Trending' },
  { value: 'discount', label: 'Best Discount' },
  { value: 'newest', label: 'Newest' },
  { value: 'expiring', label: 'Expiring Soon' }
]

export const DealsPage: React.FC = () => {
  const navigate = useNavigate()
  const { location } = useUserLocation()
  const [deals, setDeals] = useState<Deal[]>([])
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([])
  const [featuredDeal, setFeaturedDeal] = useState<Deal | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('trending')
  const [showNearbyOnly, setShowNearbyOnly] = useState(false)
  const [newDealsCount, setNewDealsCount] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    loadDeals()
  }, [selectedType])

  useEffect(() => {
    filterDeals()
  }, [deals, searchTerm, sortBy])

  const loadDeals = async (forceRefresh = false) => {
    try {
      setLoading(true)
      const userLocation = location?.latitude && location?.longitude 
        ? { lat: location.latitude, lng: location.longitude } 
        : undefined
      const { deals: data, newDealsCount: newCount } = await dealsService.getDeals(selectedType, sortBy, userLocation)
      setDeals(data)
      setNewDealsCount(newCount)
      if (data.length === 0) {
        console.warn('⚠️ No deals returned from API')
      }
    } catch (error) {
      console.error('❌ Error loading deals:', error)
      setDeals([])
      // Show user-friendly error message
      alert('Unable to load deals. Please check your internet connection and try again.')
    } finally {
      setLoading(false)
    }
  }



  const filterDeals = () => {
    let filtered = deals
    
    if (searchTerm) {
      filtered = filtered.filter(deal => 
        deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(deal => deal.userCategory === selectedCategory)
    }
    
    filtered = filtered.sort((a, b) => {
      if (sortBy === 'distance' && a.distance && b.distance) {
        return a.distance - b.distance
      }
      switch (sortBy) {
        case 'trending':
          return (b.views + b.claims * 2) - (a.views + a.claims * 2)
        case 'discount':
          const aDiscount = parseFloat(a.discount.replace('%', ''))
          const bDiscount = parseFloat(b.discount.replace('%', ''))
          return bDiscount - aDiscount
        case 'newest':
          const aCreated = new Date(a.createdAt || a._id).getTime()
          const bCreated = new Date(b.createdAt || b._id).getTime()
          return bCreated - aCreated
        case 'expiring':
          if (!a.validUntil && !b.validUntil) return 0
          if (!a.validUntil) return 1
          if (!b.validUntil) return -1
          return new Date(a.validUntil).getTime() - new Date(b.validUntil).getTime()
        default:
          return 0
      }
    })
    
    setFilteredDeals(filtered)
    
    if (filtered.length > 0 && !featuredDeal) {
      setFeaturedDeal(filtered[0])
    }
  }

  const handleViewDeal = async (dealId: string) => {
    try {
      await dealsService.viewDeal(dealId)
      setDeals(deals.map(deal => 
        deal._id === dealId ? { ...deal, views: deal.views + 1 } : deal
      ))
    } catch (error) {
      console.error('Failed to track view:', error)
    }
  }

  const handleClaimDeal = async (dealId: string) => {
    try {
      await dealsService.claimDeal(dealId)
      setDeals(deals.map(deal => 
        deal._id === dealId ? { ...deal, claims: deal.claims + 1 } : deal
      ))
    } catch (error) {
      console.error('Failed to claim deal:', error)
    }
  }

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return
    try {
      await dealsService.deleteDeal(dealId)
      setDeals(deals.filter(deal => deal._id !== dealId))
    } catch (error) {
      console.error('Failed to delete deal:', error)
      alert('Failed to delete deal')
    }
  }

  const totalSavings = filteredDeals.reduce((sum, deal) => {
    const original = parseFloat(deal.originalPrice) || 0
    const discounted = parseFloat(deal.discountedPrice) || 0
    return sum + (original - discounted)
  }, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-5xl font-bold mb-4">🎯 Dynamic Deal Radar</h1>
                <p className="text-xl text-blue-100 mb-6">AI-curated deals personalized for you!</p>
                {newDealsCount > 0 && (
                  <div className="inline-flex items-center bg-orange-500 text-white px-4 py-2 rounded-full animate-pulse">
                    <Zap className="w-4 h-4 mr-2" />
                    {newDealsCount} new deals added since your last visit!
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => loadDeals(true)}
                  className="bg-white/20 text-white hover:bg-white/30 font-semibold px-4 py-3"
                >
                  Refresh
                </Button>
                <Button
                  onClick={() => navigate('/deals/create')}
                  className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-6 py-3"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Deal
                </Button>
              </div>
            </div>
            
            {/* Enhanced Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="w-6 h-6 mr-2" />
                  <span className="text-2xl font-bold">{filteredDeals.length}</span>
                </div>
                <p className="text-blue-100 text-sm">Active Deals</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center justify-center mb-2">
                  <MapPin className="w-6 h-6 mr-2" />
                  <span className="text-2xl font-bold">{location?.city || 'Global'}</span>
                </div>
                <p className="text-blue-100 text-sm">Your Location</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center justify-center mb-2">
                  <Star className="w-6 h-6 mr-2" />
                  <span className="text-2xl font-bold">Up to 50%</span>
                </div>
                <p className="text-blue-100 text-sm">Max Savings</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="w-6 h-6 mr-2" />
                  <span className="text-2xl font-bold">{deals.filter(d => d.validUntil).length}</span>
                </div>
                <p className="text-blue-100 text-sm">Expiring Soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Enhanced Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search deals by name, business, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
                >
                  {businessTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                  <option value="distance">Nearest First</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* User Category Filter */}
          <div className="mt-4 flex gap-2">
            {['all', 'foodie', 'adventure', 'budget'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat === 'all' ? '🌟 All' : cat === 'foodie' ? '🍽️ Foodie' : cat === 'adventure' ? '🎢 Adventure' : '💰 Budget'}
              </button>
            ))}
          </div>
          
          {/* Filter Results Count */}
          {searchTerm && (
            <div className="mt-4 text-sm text-gray-600">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {filteredDeals.length} deals found for "{searchTerm}"
              </span>
            </div>
          )}
        </div>

        {/* Enhanced Stats Bar */}
        {filteredDeals.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Tag className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{filteredDeals.length}</div>
              <div className="text-gray-600 text-sm">Available Deals</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">${totalSavings.toFixed(0)}</div>
              <div className="text-gray-600 text-sm">Total Savings</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="text-2xl font-bold text-purple-600">{filteredDeals.reduce((sum, deal) => sum + deal.claims, 0)}</div>
              <div className="text-gray-600 text-sm">Deals Claimed</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-orange-600">{Math.round(filteredDeals.reduce((sum, deal) => sum + deal.views, 0) / filteredDeals.length)}</div>
              <div className="text-gray-600 text-sm">Avg Views</div>
            </div>
          </div>
        )}

        {/* Featured Deal Spotlight */}
        {featuredDeal && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Zap className="w-6 h-6" />
                  <h2 className="text-2xl font-bold">Deal of the Day</h2>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <span className="text-sm font-medium">🔥 Trending #1</span>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div>
                  <h3 className="text-xl font-bold mb-2">{featuredDeal.title}</h3>
                  <p className="text-orange-100 mb-4">{featuredDeal.description}</p>
                  <div className="flex items-center space-x-4 mb-4">
                    <span className="text-2xl font-bold">{featuredDeal.discount} OFF</span>
                    <span className="text-orange-100">at {featuredDeal.businessName}</span>
                  </div>
                  <Button 
                    onClick={() => handleClaimDeal(featuredDeal._id)}
                    className="bg-white text-orange-600 hover:bg-orange-50 font-semibold"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Claim Featured Deal
                  </Button>
                </div>
                <div className="text-center">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                    <div className="text-3xl font-bold mb-2">
                      ${featuredDeal.discountedPrice}
                    </div>
                    <div className="text-orange-100 line-through mb-2">
                      ${featuredDeal.originalPrice}
                    </div>
                    <div className="flex items-center justify-center space-x-4 text-sm">
                      <span>👀 {featuredDeal.views} views</span>
                      <span>🎯 {featuredDeal.claims} claimed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deals Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">No deals found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search or filter criteria.</p>
            <Button 
              onClick={() => {
                setSearchTerm('')
                setSelectedType('all')
                setSortBy('trending')
              }}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div>
            {/* Recommended Deals Section */}
            {filteredDeals.length > 3 && (
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Star className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Recommended for You</h2>
                  <div className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    AI Curated
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {filteredDeals.slice(0, 3).map(deal => (
                    <DealCard
                      key={`rec-${deal._id}`}
                      deal={deal}
                      onView={handleViewDeal}
                      onClaim={handleClaimDeal}
                      onDelete={handleDeleteDeal}
                      isRecommended={true}
                      showDelete={true}
                      distance={deal.distance ? `${deal.distance.toFixed(1)} km away` : undefined}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* All Deals Grid */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">All Deals ({filteredDeals.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDeals.map(deal => (
                  <DealCard
                    key={deal._id}
                    deal={deal}
                    onView={handleViewDeal}
                    onClaim={handleClaimDeal}
                    onDelete={handleDeleteDeal}
                    showDelete={true}
                    distance={deal.distance ? `${deal.distance.toFixed(1)} km away` : undefined}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
