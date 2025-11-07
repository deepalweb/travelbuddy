import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Filter, Search, Tag, TrendingUp, Clock, MapPin, Plus } from 'lucide-react'
import { Button } from '../components/Button'
import { DealCard } from '../components/DealCard'
import { dealsService } from '../services/dealsService'

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
}

const businessTypes = [
  { value: 'all', label: 'All Categories', icon: Tag },
  { value: 'restaurant', label: 'Restaurants', icon: Tag },
  { value: 'hotel', label: 'Hotels', icon: Tag },
  { value: 'cafe', label: 'Cafes', icon: Tag },
  { value: 'attraction', label: 'Attractions', icon: Tag },
  { value: 'transport', label: 'Transport', icon: Tag }
]

export const DealsPage: React.FC = () => {
  const navigate = useNavigate()
  const [deals, setDeals] = useState<Deal[]>([])
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadDeals()
  }, [selectedType])

  useEffect(() => {
    filterDeals()
  }, [deals, searchTerm])

  const loadDeals = async () => {
    try {
      setLoading(true)
      const data = await dealsService.getDeals(selectedType)
      setDeals(data)
    } catch (error) {
      console.error('Failed to load deals:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterDeals = () => {
    let filtered = deals
    if (searchTerm) {
      filtered = deals.filter(deal => 
        deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        deal.businessName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    setFilteredDeals(filtered)
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

  const totalSavings = filteredDeals.reduce((sum, deal) => {
    const original = parseFloat(deal.originalPrice) || 0
    const discounted = parseFloat(deal.discountedPrice) || 0
    return sum + (original - discounted)
  }, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-4">Exclusive Travel Deals</h1>
                <p className="text-xl text-blue-100 mb-6">Save big on restaurants, hotels, attractions and more!</p>
              </div>
              <Button
                onClick={() => navigate('/deals/create')}
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Deal
              </Button>
            </div>
            <div className="flex justify-center items-center space-x-8 text-sm">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>{filteredDeals.length} Active Deals</span>
              </div>
              <div className="flex items-center space-x-2">
                <Tag className="w-5 h-5" />
                <span>Up to 30% Off</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Limited Time</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search deals by name or business..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
              >
                {businessTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        {filteredDeals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{filteredDeals.length}</div>
              <div className="text-gray-600">Available Deals</div>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="text-2xl font-bold text-green-600">${totalSavings.toFixed(0)}</div>
              <div className="text-gray-600">Total Savings</div>
            </div>
            <div className="bg-white rounded-lg p-6 text-center shadow-sm">
              <div className="text-2xl font-bold text-purple-600">{filteredDeals.reduce((sum, deal) => sum + deal.claims, 0)}</div>
              <div className="text-gray-600">Deals Claimed</div>
            </div>
          </div>
        )}

        {/* Deals Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No deals found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDeals.map(deal => (
              <DealCard
                key={deal._id}
                deal={deal}
                onView={handleViewDeal}
                onClaim={handleClaimDeal}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}