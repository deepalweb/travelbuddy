import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { 
  Buildings,
  CurrencyDollar,
  Plus,
  Eye,
  Pencil,
  Trash,
  TrendUp,
  MapPin
} from '@phosphor-icons/react'
import apiService from '@/services/apiService'

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
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
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
  }, [])

  const fetchDeals = async () => {
    try {
      setLoading(true)
      const data = await apiService.getDeals({ isActive: 'true' })
      setDeals(data)
    } catch (error) {
      console.error('Failed to fetch deals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDeal = async () => {
    try {
      const deal = await apiService.createDeal({
        ...newDeal,
        isActive: true,
        views: 0,
        claims: 0
      })
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
    } catch (error) {
      console.error('Failed to create deal:', error)
    }
  }

  const handleDeleteDeal = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return
    
    try {
      await apiService.deleteDeal(dealId)
      setDeals(deals.filter(d => d._id !== dealId))
    } catch (error) {
      console.error('Failed to delete deal:', error)
    }
  }

  const handleToggleDealStatus = async (dealId: string, isActive: boolean) => {
    try {
      await apiService.updateDeal(dealId, { isActive })
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
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Business & Deals Management</h2>
          <p className="text-muted-foreground">Loading deals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Business & Deals Management</h2>
          <p className="text-muted-foreground">
            Manage business partnerships and promotional deals
          </p>
        </div>
        
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-2" />
              Create Deal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Deal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Deal Title</label>
                  <Input
                    value={newDeal.title}
                    onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                    placeholder="Enter deal title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Business Name</label>
                  <Input
                    value={newDeal.businessName}
                    onChange={(e) => setNewDeal({ ...newDeal, businessName: e.target.value })}
                    placeholder="Enter business name"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newDeal.description}
                  onChange={(e) => setNewDeal({ ...newDeal, description: e.target.value })}
                  placeholder="Enter deal description"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Business Type</label>
                  <Select 
                    value={newDeal.businessType} 
                    onValueChange={(value) => setNewDeal({ ...newDeal, businessType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="hotel">Hotel</SelectItem>
                      <SelectItem value="attraction">Attraction</SelectItem>
                      <SelectItem value="shop">Shop</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Original Price</label>
                  <Input
                    value={newDeal.originalPrice}
                    onChange={(e) => setNewDeal({ ...newDeal, originalPrice: e.target.value })}
                    placeholder="$50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Discounted Price</label>
                  <Input
                    value={newDeal.discountedPrice}
                    onChange={(e) => setNewDeal({ ...newDeal, discountedPrice: e.target.value })}
                    placeholder="$35"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Discount</label>
                  <Input
                    value={newDeal.discount}
                    onChange={(e) => setNewDeal({ ...newDeal, discount: e.target.value })}
                    placeholder="30% OFF"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Valid Until</label>
                  <Input
                    type="date"
                    value={newDeal.validUntil}
                    onChange={(e) => setNewDeal({ ...newDeal, validUntil: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Address</label>
                <Input
                  value={newDeal.location.address}
                  onChange={(e) => setNewDeal({ ...newDeal, location: { address: e.target.value } })}
                  placeholder="Enter business address"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateDeal}>
                  Create Deal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <Buildings size={16} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deals.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <TrendUp size={16} />
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
            <CurrencyDollar size={16} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deals.reduce((sum, deal) => sum + (deal.claims || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deals Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Deals</CardTitle>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="restaurant">Restaurant</SelectItem>
                <SelectItem value="hotel">Hotel</SelectItem>
                <SelectItem value="attraction">Attraction</SelectItem>
                <SelectItem value="shop">Shop</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeals.map((deal) => (
                <TableRow key={deal._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{deal.title}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin size={12} />
                        {deal.location?.address || 'No address'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{deal.businessName}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getBusinessTypeBadgeColor(deal.businessType)} text-white`}>
                      {deal.businessType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-green-600">{deal.discount}</div>
                      <div className="text-sm text-muted-foreground">
                        {deal.originalPrice} → {deal.discountedPrice}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{deal.views || 0} views</div>
                      <div>{deal.claims || 0} claims</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={deal.isActive ? "default" : "secondary"}>
                      {deal.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedDeal(deal)}
                      >
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}