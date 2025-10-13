import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { 
  Plus, 
  PencilSimple, 
  Trash, 
  Eye,
  MapPin,
  Calendar,
  CurrencyDollar,
  TrendUp,
  TrendDown,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Receipt,
  Storefront,
  Percent,
  Star,
  MagnifyingGlass,
  Funnel,
  DotsThreeOutline
} from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'

interface Deal {
  id: string
  title: string
  description: string
  businessName: string
  businessId: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  originalPrice: number
  validFrom: string
  validUntil: string
  status: 'active' | 'expired' | 'upcoming' | 'pending'
  category: string
  location: string
  claimsCount: number
  redemptionsCount: number
  maxClaims?: number
  tags: string[]
  imageUrl?: string
  terms: string
  merchantSubmitted: boolean
  approved: boolean
  createdAt: string
}

interface Business {
  id: string
  name: string
  category: string
  location: string
  email: string
  phone: string
  status: 'active' | 'inactive' | 'pending'
  totalDeals: number
  totalRevenue: number
  commission: number
  rating: number
  joinDate: string
  contactPerson: string
  hasLimitedAccess: boolean
}

const mockDeals: Deal[] = [
  {
    id: '1',
    title: '50% Off Weekend Getaway Package',
    description: 'Luxury hotel stay with breakfast included for two nights',
    businessName: 'Grand Resort & Spa',
    businessId: 'bus-1',
    discountType: 'percentage',
    discountValue: 50,
    originalPrice: 400,
    validFrom: '2024-01-15',
    validUntil: '2024-03-15',
    status: 'active',
    category: 'Hotels',
    location: 'Bali, Indonesia',
    claimsCount: 245,
    redemptionsCount: 189,
    maxClaims: 500,
    tags: ['luxury', 'spa', 'weekend'],
    terms: 'Valid for weekends only. Advance booking required.',
    merchantSubmitted: false,
    approved: true,
    createdAt: '2024-01-10'
  },
  {
    id: '2',
    title: 'Adventure Tour Bundle - $100 Off',
    description: 'Complete adventure package including hiking, rafting, and camping',
    businessName: 'Mountain Adventures Co.',
    businessId: 'bus-2',
    discountType: 'fixed',
    discountValue: 100,
    originalPrice: 350,
    validFrom: '2024-02-01',
    validUntil: '2024-04-30',
    status: 'active',
    category: 'Activities',
    location: 'Colorado, USA',
    claimsCount: 89,
    redemptionsCount: 67,
    maxClaims: 200,
    tags: ['adventure', 'outdoor', 'group'],
    terms: 'Minimum 2 participants required. Weather dependent.',
    merchantSubmitted: true,
    approved: true,
    createdAt: '2024-01-25'
  },
  {
    id: '3',
    title: 'Early Bird Flight Special',
    description: '30% discount on international flights booked 60 days in advance',
    businessName: 'SkyWings Airlines',
    businessId: 'bus-3',
    discountType: 'percentage',
    discountValue: 30,
    originalPrice: 800,
    validFrom: '2024-03-01',
    validUntil: '2024-06-30',
    status: 'upcoming',
    category: 'Transportation',
    location: 'Global',
    claimsCount: 0,
    redemptionsCount: 0,
    maxClaims: 1000,
    tags: ['flights', 'international', 'early-bird'],
    terms: 'Must book 60 days in advance. Non-refundable.',
    merchantSubmitted: true,
    approved: false,
    createdAt: '2024-02-15'
  }
]

const mockBusinesses: Business[] = [
  {
    id: 'bus-1',
    name: 'Grand Resort & Spa',
    category: 'Hotels',
    location: 'Bali, Indonesia',
    email: 'contact@grandresort.com',
    phone: '+62-361-123456',
    status: 'active',
    totalDeals: 8,
    totalRevenue: 45600,
    commission: 15,
    rating: 4.8,
    joinDate: '2023-06-15',
    contactPerson: 'Sarah Chen',
    hasLimitedAccess: true
  },
  {
    id: 'bus-2',
    name: 'Mountain Adventures Co.',
    category: 'Activities',
    location: 'Colorado, USA',
    email: 'info@mountainadv.com',
    phone: '+1-555-0123',
    status: 'active',
    totalDeals: 12,
    totalRevenue: 28900,
    commission: 12,
    rating: 4.6,
    joinDate: '2023-08-22',
    contactPerson: 'Mike Rodriguez',
    hasLimitedAccess: true
  },
  {
    id: 'bus-3',
    name: 'SkyWings Airlines',
    category: 'Transportation',
    location: 'Global',
    email: 'partners@skywings.com',
    phone: '+1-800-SKYWING',
    status: 'pending',
    totalDeals: 3,
    totalRevenue: 0,
    commission: 8,
    rating: 0,
    joinDate: '2024-02-10',
    contactPerson: 'Jennifer Liu',
    hasLimitedAccess: false
  }
]

export default function BusinessManagement() {
  const [deals, setDeals] = useKV<Deal[]>('admin-deals', mockDeals)
  const [businesses, setBusinesses] = useKV<Business[]>('admin-businesses', mockBusinesses)
  const [activeTab, setActiveTab] = useState('deals')
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [showDealDialog, setShowDealDialog] = useState(false)
  const [showBusinessDialog, setShowBusinessDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredDeals = (deals || []).filter(deal => {
    const matchesSearch = deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deal.businessName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || deal.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredBusinesses = (businesses || []).filter(business => {
    const matchesSearch = business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         business.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || business.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleApproveDeal = (dealId: string, approved: boolean) => {
    setDeals((currentDeals = []) => 
      currentDeals.map(deal => 
        deal.id === dealId 
          ? { ...deal, approved, status: approved ? 'active' : 'pending' }
          : deal
      )
    )
  }

  const handleDeleteDeal = (dealId: string) => {
    setDeals((currentDeals = []) => currentDeals.filter(deal => deal.id !== dealId))
  }

  const handleBusinessStatusChange = (businessId: string, status: Business['status']) => {
    setBusinesses((currentBusinesses = []) =>
      currentBusinesses.map(business =>
        business.id === businessId ? { ...business, status } : business
      )
    )
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      pending: 'secondary',
      expired: 'destructive',
      upcoming: 'outline',
      inactive: 'destructive'
    } as const
    
    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>
  }

  const dealStats = {
    total: (deals || []).length,
    active: (deals || []).filter(d => d.status === 'active').length,
    pending: (deals || []).filter(d => d.status === 'pending').length,
    totalClaims: (deals || []).reduce((sum, d) => sum + d.claimsCount, 0),
    totalRedemptions: (deals || []).reduce((sum, d) => sum + d.redemptionsCount, 0)
  }

  const businessStats = {
    total: (businesses || []).length,
    active: (businesses || []).filter(b => b.status === 'active').length,
    pending: (businesses || []).filter(b => b.status === 'pending').length,
    totalRevenue: (businesses || []).reduce((sum, b) => sum + b.totalRevenue, 0)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Business & Deals</h2>
        <p className="text-muted-foreground">
          Manage business partnerships and promotional deals
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deals</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dealStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {dealStats.active} active, {dealStats.pending} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dealStats.totalClaims.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {dealStats.totalRedemptions.toLocaleString()} redemptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partner Businesses</CardTitle>
            <Storefront className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{businessStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {businessStats.active} active partners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CurrencyDollar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${businessStats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Commission earned
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="deals">Deals Management</TabsTrigger>
          <TabsTrigger value="businesses">Business Partners</TabsTrigger>
          <TabsTrigger value="analytics">Revenue Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="deals" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search deals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={showDealDialog} onOpenChange={setShowDealDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus size={16} />
                  Add New Deal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {selectedDeal ? 'Edit Deal' : 'Add New Deal'}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deal-title">Deal Title</Label>
                    <Input id="deal-title" placeholder="Enter deal title" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business-select">Business</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select business" />
                      </SelectTrigger>
                      <SelectContent>
                        {(businesses || []).map(business => (
                          <SelectItem key={business.id} value={business.id}>
                            {business.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="deal-description">Description</Label>
                    <Textarea id="deal-description" placeholder="Describe the deal" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount-type">Discount Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="discount-value">Discount Value</Label>
                    <Input id="discount-value" type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valid-from">Valid From</Label>
                    <Input id="valid-from" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valid-until">Valid Until</Label>
                    <Input id="valid-until" type="date" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="deal-terms">Terms & Conditions</Label>
                    <Textarea id="deal-terms" placeholder="Enter terms and conditions" />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowDealDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setShowDealDialog(false)}>
                    {selectedDeal ? 'Update Deal' : 'Create Deal'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Claims/Redemptions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{deal.title}</div>
                        <div className="text-sm text-muted-foreground">{deal.category}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{deal.businessName}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin size={12} />
                          {deal.location}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Percent size={14} />
                        {deal.discountType === 'percentage' 
                          ? `${deal.discountValue}%` 
                          : `$${deal.discountValue}`
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar size={12} />
                        {new Date(deal.validUntil).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{deal.claimsCount} claims</div>
                        <div className="text-muted-foreground">{deal.redemptionsCount} redeemed</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getStatusBadge(deal.status)}
                        {deal.merchantSubmitted && !deal.approved && (
                          <Badge variant="outline" className="text-xs">Pending Approval</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {deal.merchantSubmitted && !deal.approved && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproveDeal(deal.id, true)}
                              className="gap-1"
                            >
                              <CheckCircle size={14} />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleApproveDeal(deal.id, false)}
                              className="gap-1"
                            >
                              <XCircle size={14} />
                              Reject
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedDeal(deal)
                            setShowDealDialog(true)
                          }}
                        >
                          <PencilSimple size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteDeal(deal.id)}
                        >
                          <Trash size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="businesses" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search businesses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={showBusinessDialog} onOpenChange={setShowBusinessDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus size={16} />
                  Add Business Partner
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Business Partner</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="business-name">Business Name</Label>
                    <Input id="business-name" placeholder="Enter business name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hotels">Hotels</SelectItem>
                        <SelectItem value="activities">Activities</SelectItem>
                        <SelectItem value="transportation">Transportation</SelectItem>
                        <SelectItem value="restaurants">Restaurants</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-person">Contact Person</Label>
                    <Input id="contact-person" placeholder="Enter contact name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="contact@business.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" placeholder="+1-555-0123" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="commission">Commission (%)</Label>
                    <Input id="commission" type="number" placeholder="15" />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" placeholder="City, Country" />
                  </div>
                  <div className="col-span-2 flex items-center space-x-2">
                    <Switch id="limited-access" />
                    <Label htmlFor="limited-access">Grant limited access to merchant portal</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowBusinessDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setShowBusinessDialog(false)}>
                    Add Partner
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Deals</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBusinesses.map((business) => (
                  <TableRow key={business.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{business.name}</div>
                        <div className="text-sm text-muted-foreground">{business.category}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin size={12} />
                          {business.location}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{business.contactPerson}</div>
                        <div className="text-sm text-muted-foreground">{business.email}</div>
                        <div className="text-sm text-muted-foreground">{business.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{business.totalDeals}</div>
                        <div className="text-sm text-muted-foreground">total</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">${business.totalRevenue.toLocaleString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Percent size={14} />
                        {business.commission}%
                      </div>
                    </TableCell>
                    <TableCell>
                      {business.rating > 0 ? (
                        <div className="flex items-center gap-1">
                          <Star size={14} className="fill-yellow-400 text-yellow-400" />
                          {business.rating}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No rating</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {getStatusBadge(business.status)}
                        {business.hasLimitedAccess && (
                          <Badge variant="outline" className="text-xs">Portal Access</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {business.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBusinessStatusChange(business.id, 'active')}
                              className="gap-1"
                            >
                              <CheckCircle size={14} />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleBusinessStatusChange(business.id, 'inactive')}
                              className="gap-1"
                            >
                              <XCircle size={14} />
                              Reject
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedBusiness(business)
                            setShowBusinessDialog(true)
                          }}
                        >
                          <PencilSimple size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Business Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Hotels', 'Activities', 'Transportation', 'Restaurants'].map((category, index) => {
                    const revenue = [28500, 15400, 8700, 12300][index]
                    const percentage = Math.round((revenue / businessStats.totalRevenue) * 100)
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{category}</span>
                          <span className="font-medium">${revenue.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Deals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(deals || [])
                    .sort((a, b) => b.redemptionsCount - a.redemptionsCount)
                    .slice(0, 5)
                    .map((deal) => (
                      <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{deal.title}</div>
                          <div className="text-xs text-muted-foreground">{deal.businessName}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{deal.redemptionsCount}</div>
                          <div className="text-xs text-muted-foreground">redemptions</div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Commission Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">$12,450</div>
                      <div className="text-sm text-muted-foreground">This Month</div>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">$8,720</div>
                      <div className="text-sm text-muted-foreground">Last Month</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendUp className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">+42.8%</span>
                    <span className="text-muted-foreground">vs last month</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deal Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm">Conversion Rate</span>
                    <span className="font-medium">77.1%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm">Avg. Deal Value</span>
                    <span className="font-medium">$187</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="text-sm">Customer Satisfaction</span>
                    <div className="flex items-center gap-1">
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">4.6</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}