import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Eye, 
  Check, 
  X, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Car,
  Users,
  Calendar,
  Star,
  Building
} from 'lucide-react'

interface PartnerApplication {
  applicationId: string
  businessName: string
  contactName: string
  email: string
  phone: string
  location: string
  serviceTypes: string[]
  fleetSize: string
  yearsInBusiness: string
  description: string
  languages: string[]
  operatingHours: string
  specialties: string[]
  priceRange: string
  responseTime: string
  images: string[]
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
  adminNotes?: string
  reviewedAt?: string
}

export default function PartnerManagement() {
  const [applications, setApplications] = useState<PartnerApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<PartnerApplication | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [activeTab, setActiveTab] = useState('pending')

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/partners/admin/applications')
      const data = await response.json()
      setApplications(data)
    } catch (error) {
      console.error('Failed to fetch applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (applicationId: string, status: 'approved' | 'rejected', notes: string) => {
    try {
      const response = await fetch(`/api/partners/admin/applications/${applicationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          adminNotes: notes
        })
      })

      if (response.ok) {
        await fetchApplications()
        setSelectedApplication(null)
        setAdminNotes('')
      }
    } catch (error) {
      console.error('Failed to update application:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const filteredApplications = applications.filter(app => {
    if (activeTab === 'all') return true
    return app.status === activeTab
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Partner Management</h1>
          <p className="text-muted-foreground">Review and manage transportation partner applications</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({applications.filter(a => a.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({applications.filter(a => a.status === 'approved').length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({applications.filter(a => a.status === 'rejected').length})</TabsTrigger>
          <TabsTrigger value="all">All ({applications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">No applications found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredApplications.map((application) => (
                <Card key={application.applicationId} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{application.businessName}</h3>
                          {getStatusBadge(application.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="w-4 h-4" />
                            {application.contactName}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            {application.location}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Car className="w-4 h-4" />
                            {application.fleetSize} vehicles
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {new Date(application.submittedAt).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {application.serviceTypes.slice(0, 3).map((service, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                          {application.serviceTypes.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{application.serviceTypes.length - 3} more
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {application.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedApplication(application)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-3">
                                {application.businessName}
                                {getStatusBadge(application.status)}
                              </DialogTitle>
                            </DialogHeader>
                            
                            {selectedApplication && (
                              <div className="space-y-6">
                                {/* Basic Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                    <h4 className="font-semibold text-lg">Contact Information</h4>
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-muted-foreground" />
                                        <span>{selectedApplication.contactName}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-muted-foreground" />
                                        <span>{selectedApplication.email}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-muted-foreground" />
                                        <span>{selectedApplication.phone}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                        <span>{selectedApplication.location}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    <h4 className="font-semibold text-lg">Business Details</h4>
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Car className="w-4 h-4 text-muted-foreground" />
                                        <span>Fleet Size: {selectedApplication.fleetSize}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Building className="w-4 h-4 text-muted-foreground" />
                                        <span>Years in Business: {selectedApplication.yearsInBusiness}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-muted-foreground" />
                                        <span>Operating Hours: {selectedApplication.operatingHours}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Star className="w-4 h-4 text-muted-foreground" />
                                        <span>Response Time: {selectedApplication.responseTime}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Services and Specialties */}
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-lg">Services & Specialties</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <h5 className="font-medium mb-2">Service Types</h5>
                                      <div className="flex flex-wrap gap-2">
                                        {selectedApplication.serviceTypes.map((service, index) => (
                                          <Badge key={index} variant="outline">{service}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <h5 className="font-medium mb-2">Specialties</h5>
                                      <div className="flex flex-wrap gap-2">
                                        {selectedApplication.specialties.map((specialty, index) => (
                                          <Badge key={index} variant="secondary">{specialty}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Languages and Pricing */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                    <h5 className="font-medium mb-2">Languages</h5>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedApplication.languages.join(', ')}
                                    </p>
                                  </div>
                                  <div>
                                    <h5 className="font-medium mb-2">Price Range</h5>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedApplication.priceRange}
                                    </p>
                                  </div>
                                </div>

                                {/* Description */}
                                <div>
                                  <h4 className="font-semibold text-lg mb-2">Business Description</h4>
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {selectedApplication.description}
                                  </p>
                                </div>

                                {/* Images */}
                                {selectedApplication.images.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold text-lg mb-2">Vehicle Photos</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                      {selectedApplication.images.map((image, index) => (
                                        <img
                                          key={index}
                                          src={`/uploads/partners/${image}`}
                                          alt={`Vehicle ${index + 1}`}
                                          className="w-full h-32 object-cover rounded-lg border"
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Admin Notes */}
                                {selectedApplication.adminNotes && (
                                  <div>
                                    <h4 className="font-semibold text-lg mb-2">Admin Notes</h4>
                                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                                      {selectedApplication.adminNotes}
                                    </p>
                                  </div>
                                )}

                                {/* Action Buttons */}
                                {selectedApplication.status === 'pending' && (
                                  <div className="space-y-4 pt-4 border-t">
                                    <div>
                                      <label className="block text-sm font-medium mb-2">Admin Notes</label>
                                      <Textarea
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                        placeholder="Add notes about your decision..."
                                        rows={3}
                                      />
                                    </div>
                                    <div className="flex gap-3">
                                      <Button
                                        onClick={() => handleStatusUpdate(selectedApplication.applicationId, 'approved', adminNotes)}
                                        className="bg-green-600 hover:bg-green-700"
                                      >
                                        <Check className="w-4 h-4 mr-2" />
                                        Approve Application
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        onClick={() => handleStatusUpdate(selectedApplication.applicationId, 'rejected', adminNotes)}
                                      >
                                        <X className="w-4 h-4 mr-2" />
                                        Reject Application
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {application.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(application.applicationId, 'approved', '')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleStatusUpdate(application.applicationId, 'rejected', '')}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}