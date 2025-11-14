import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../Card'
import { Button } from '../Button'
import { Badge } from '../Badge'
import { Building2, DollarSign, Plus, Eye, Trash, TrendingUp, MapPin } from 'lucide-react'

interface Deal {
  _id: string
  title: string
  description: string
  businessName: string
  businessType: string
  discount: string
  originalPrice: string
  discountedPrice: string
  location: {
    address: string
  }
  views: number
  claims: number
  isActive: boolean
  validUntil: string
  createdAt: string
}

export default function BusinessManagement() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [newDeal, setNewDeal] = useState({
    title: '',
    description: '',
    businessName: '',
    businessType: 'restaurant',
    discount: '',
    originalPrice: '',
    discountedPrice: '',
    location: { address: '' },
    validUntil: ''
  })

  useEffect(() => {
    fetchDeals()
    // Auto-refresh every 5 seconds to show new deals
    const interval = setInterval(fetchDeals, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchDeals = async () => {
    try {
      const response = await fetch('/api/deals?isActive=true')
      if (response.ok) {
        const data = await response.json()
        setDeals(data)
      }
    } catch (error) {
      console.error('Failed to fetch deals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDeal = async () => {
    try {
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newDeal,
          isActive: true,
          views: 0,
          claims: 0
        })
      })
      
      if (response.ok) {
        const deal = await response.json()
        setDeals([deal, ...deals])
        setShowCreateModal(false)
        setNewDeal({
          title: '',
          description: '',
          businessName: '',
          businessType: 'restaurant',
          discount: '',
          originalPrice: '',
          discountedPrice: '',
          location: { address: '' },
          validUntil: ''
        })
      }
    } catch (error) {
      console.error('Failed to create deal:', error)
    }
  }

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return
    
    try {
      await fetch(`/api/deals/${dealId}`, { method: 'DELETE' })
      setDeals(deals.filter(d => d._id !== dealId))
    } catch (error) {
      console.error('Failed to delete deal:', error)
    }
  }

  const handleToggleDealStatus = async (dealId: string, isActive: boolean) => {
    try {
      await fetch(`/api/deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })
      setDeals(deals.map(d => d._id === dealId ? { ...d, isActive } : d))
    } catch (error) {
      console.error('Failed to update deal status:', error)
    }
  }

  const filteredDeals = deals.filter(deal => {
    if (filterType === 'all') return true
    return deal.businessType === filterType
  })

  const getBusinessTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'restaurant': return 'bg-orange-500'
      case 'hotel': return 'bg-blue-500'
      case 'attraction': return 'bg-green-500'
      case 'shop': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading deals...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Business & Deals Management</h2>
          <p className="text-gray-600">Manage business partnerships and promotional deals</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchDeals}>
            Refresh
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus size={16} className="mr-2" />
            Create Deal
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <Building2 size={16} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deals.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <TrendingUp size={16} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deals.filter(d => d.isActive).length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye size={16} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deals.reduce((sum, deal) => sum + (deal.views || 0), 0)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <DollarSign size={16} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deals.reduce((sum, deal) => sum + (deal.claims || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Deals</CardTitle>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="restaurant">Restaurant</option>
              <option value="hotel">Hotel</option>
              <option value="attraction">Attraction</option>
              <option value="shop">Shop</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Deal</th>
                  <th className="text-left py-3 px-4">Business</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Discount</th>
                  <th className="text-left py-3 px-4">Performance</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.map((deal) => (
                  <tr key={deal._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{deal.title}</div>
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin size={12} />
                          {deal.location?.address || 'No address'}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{deal.businessName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={`${getBusinessTypeBadgeColor(deal.businessType)} text-white`}>
                        {deal.businessType}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-green-600">{deal.discount}</div>
                        <div className="text-sm text-gray-600">
                          {deal.originalPrice} → {deal.discountedPrice}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <div>{deal.views || 0} views</div>
                        <div>{deal.claims || 0} claims</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={deal.isActive ? "default" : "secondary"}>
                        {deal.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye size={14} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleToggleDealStatus(deal._id, !deal.isActive)}
                        >
                          {deal.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteDeal(deal._id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Create New Deal</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Deal Title</label>
                  <input
                    value={newDeal.title}
                    onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                    placeholder="Enter deal title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Business Name</label>
                  <input
                    value={newDeal.businessName}
                    onChange={(e) => setNewDeal({ ...newDeal, businessName: e.target.value })}
                    placeholder="Enter business name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newDeal.description}
                  onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })}
                  placeholder="Enter deal description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Business Type</label>
                  <select 
                    value={newDeal.businessType} 
                    onChange={(e) => setNewDeal({ ...newDeal, businessType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="restaurant">Restaurant</option>
                    <option value="hotel">Hotel</option>
                    <option value="attraction">Attraction</option>
                    <option value="shop">Shop</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Original Price</label>
                  <input
                    value={newDeal.originalPrice}
                    onChange={(e) => setNewDeal({ ...newDeal, originalPrice: e.target.value })}
                    placeholder="$50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Discounted Price</label>
                  <input
                    value={newDeal.discountedPrice}
                    onChange={(e) => setNewDeal({ ...newDeal, discountedPrice: e.target.value })}
                    placeholder="$35"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Discount</label>
                  <input
                    value={newDeal.discount}
                    onChange={(e) => setNewDeal({ ...newDeal, discount: e.target.value })}
                    placeholder="30% OFF"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={newDeal.validUntil}
                    onChange={(e) => setNewDeal({ ...newDeal, validUntil: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <input
                  value={newDeal.location.address}
                  onChange={(e) => setNewDeal({ ...newDeal, location: { address: e.target.value } })}
                  placeholder="Enter business address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateDeal}>
                  Create Deal
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}