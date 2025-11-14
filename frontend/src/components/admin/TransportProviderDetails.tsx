import React, { useState, useEffect } from 'react'
import { Badge } from '../Badge'

interface TransportProviderDetails {
  _id: string
  companyLogo?: string
  companyName: string
  ownerName: string
  email: string
  phone: string
  address: string
  description?: string
  businessRegNumber?: string
  licenseNumber: string
  businessRegDoc?: string
  insuranceCert?: string
  verificationPhotos?: string[]
  fleetSize: string
  vehicleTypes: string[]
  vehiclePhotos?: string[]
  amenities: string[]
  country: string
  serviceAreas: string[]
  islandWide: boolean
  airportTransfers: boolean
  airportPricing?: string
  pricingModel?: string
  basePrice?: string
  minBookingHours?: string
  availability: any
  driverCount?: string
  driverCertifications: string[]
  driverIds?: string[]
  documents?: string[]
  password?: string
  verificationStatus: string
  isActive?: boolean
  createdAt: string
  processedAt?: string
  adminNotes?: string
}

interface Props {
  providerId: string
  onClose: () => void
}

export default function TransportProviderDetails({ providerId, onClose }: Props) {
  const [provider, setProvider] = useState<TransportProviderDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (providerId) {
      fetchProviderDetails(providerId)
    }
  }, [providerId])

  const fetchProviderDetails = async (providerId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/transport-providers/admin/details/${providerId}`)
      if (response.ok) {
        const data = await response.json()
        setProvider(data)
      }
    } catch (error) {
      console.error('Failed to fetch provider details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!provider) return
    try {
      const response = await fetch(`http://localhost:3001/api/transport-providers/admin/approve/${provider._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', notes: 'Approved after detailed review' })
      })
      if (response.ok) {
        setProvider(prev => prev ? { ...prev, verificationStatus: 'approved' } : null)
      }
    } catch (error) {
      console.error('Approval failed:', error)
    }
  }

  const handleReject = async () => {
    if (!provider) return
    const reason = prompt('Reason for rejection:')
    if (!reason) return
    
    try {
      const response = await fetch(`http://localhost:3001/api/transport-providers/admin/approve/${provider._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', notes: reason })
      })
      if (response.ok) {
        setProvider(prev => prev ? { ...prev, verificationStatus: 'rejected' } : null)
      }
    } catch (error) {
      console.error('Rejection failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading provider details...</span>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Provider not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{provider.companyName}</h1>
          <p className="text-gray-600">Transport Provider Application Details</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className={
            provider.verificationStatus === 'approved' ? 'bg-green-100 text-green-800' :
            provider.verificationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }>
            {provider.verificationStatus.charAt(0).toUpperCase() + provider.verificationStatus.slice(1)}
          </Badge>

        </div>
      </div>

      {/* Company Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Company Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Company Name</label>
            <p className="text-gray-900">{provider.companyName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Owner Name</label>
            <p className="text-gray-900">{provider.ownerName}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-gray-900">{provider.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Phone</label>
            <p className="text-gray-900">{provider.phone}</p>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-500">Address</label>
            <p className="text-gray-900">{provider.address}</p>
          </div>
          {provider.description && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="text-gray-900">{provider.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Verification Documents */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Verification Documents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">License Number</label>
            <p className="text-gray-900">{provider.licenseNumber}</p>
          </div>
          {provider.businessRegNumber && (
            <div>
              <label className="text-sm font-medium text-gray-500">Business Registration</label>
              <p className="text-gray-900">{provider.businessRegNumber}</p>
            </div>
          )}
          {provider.businessRegDoc && (
            <div>
              <label className="text-sm font-medium text-gray-500">Business Registration Document</label>
              <p className="text-blue-600">📄 Document uploaded</p>
            </div>
          )}
          {provider.insuranceCert && (
            <div>
              <label className="text-sm font-medium text-gray-500">Insurance Certificate</label>
              <p className="text-blue-600">📄 Certificate uploaded</p>
            </div>
          )}
          {provider.verificationPhotos && provider.verificationPhotos.length > 0 && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500">Verification Photos</label>
              <p className="text-blue-600">📸 {provider.verificationPhotos.length} photos uploaded</p>
            </div>
          )}
        </div>
      </div>

      {/* Fleet Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Fleet Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Fleet Size</label>
            <p className="text-gray-900">{provider.fleetSize}</p>
          </div>
          {provider.vehiclePhotos && provider.vehiclePhotos.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-500">Vehicle Photos</label>
              <p className="text-blue-600">📸 {provider.vehiclePhotos.length} photos uploaded</p>
            </div>
          )}
        </div>
      </div>

      {/* Vehicle Types & Amenities */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Vehicle Types & Amenities</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Vehicle Types</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {provider.vehicleTypes.map((type, index) => (
                <Badge key={index} variant="outline">{type}</Badge>
              ))}
            </div>
          </div>
          {provider.amenities.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-500">Amenities</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {provider.amenities.map((amenity, index) => (
                  <Badge key={index} className="bg-blue-100 text-blue-800">{amenity}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Service Areas */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Service Coverage</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Country</label>
            <p className="text-gray-900">{provider.country}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Coverage Type</label>
            <p className="text-gray-900">{provider.islandWide ? 'Island-wide Service' : 'Specific Areas'}</p>
          </div>
          {!provider.islandWide && (
            <div>
              <label className="text-sm font-medium text-gray-500">Service Areas</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {provider.serviceAreas.map((area, index) => (
                  <Badge key={index} variant="outline">{area}</Badge>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-500">Airport Transfers</label>
            <p className="text-gray-900">{provider.airportTransfers ? 'Yes' : 'No'}</p>
          </div>
          {provider.airportPricing && (
            <div>
              <label className="text-sm font-medium text-gray-500">Airport Pricing</label>
              <p className="text-gray-900">{provider.airportPricing}</p>
            </div>
          )}
        </div>
      </div>

      {/* Pricing Information */}
      {(provider.pricingModel || provider.basePrice) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Pricing Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {provider.pricingModel && (
              <div>
                <label className="text-sm font-medium text-gray-500">Pricing Model</label>
                <p className="text-gray-900">{provider.pricingModel}</p>
              </div>
            )}
            {provider.basePrice && (
              <div>
                <label className="text-sm font-medium text-gray-500">Base Price</label>
                <p className="text-gray-900">{provider.basePrice}</p>
              </div>
            )}
            {provider.minBookingHours && (
              <div>
                <label className="text-sm font-medium text-gray-500">Minimum Booking</label>
                <p className="text-gray-900">{provider.minBookingHours} hours</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Availability Schedule */}
      {provider.availability && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Availability Schedule</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(provider.availability).map(([day, schedule]: [string, any]) => (
              <div key={day} className="flex justify-between items-center p-2 border rounded">
                <span className="font-medium capitalize">{day}</span>
                <span className={schedule.available ? 'text-green-600' : 'text-red-600'}>
                  {schedule.available ? schedule.hours || 'Available' : 'Closed'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Driver Information */}
      {(provider.driverCount || provider.driverCertifications.length > 0 || provider.driverIds) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Driver Information</h2>
          <div className="space-y-4">
            {provider.driverCount && (
              <div>
                <label className="text-sm font-medium text-gray-500">Number of Drivers</label>
                <p className="text-gray-900">{provider.driverCount}</p>
              </div>
            )}
            {provider.driverCertifications.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">Driver Certifications</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {provider.driverCertifications.map((cert, index) => (
                    <Badge key={index} className="bg-green-100 text-green-800">{cert}</Badge>
                  ))}
                </div>
              </div>
            )}
            {provider.driverIds && provider.driverIds.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">Driver ID Documents</label>
                <p className="text-blue-600">📄 {provider.driverIds.length} documents uploaded</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Documents */}
      {provider.documents && provider.documents.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Additional Documents</h2>
          <div>
            <label className="text-sm font-medium text-gray-500">Uploaded Documents</label>
            <p className="text-blue-600">📄 {provider.documents.length} documents uploaded</p>
          </div>
        </div>
      )}

      {/* Application Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Application Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Application ID</label>
            <p className="text-gray-900 font-mono text-sm">{provider._id}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Submitted Date</label>
            <p className="text-gray-900">{new Date(provider.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Status</label>
            <p className="text-gray-900">{provider.isActive ? 'Active' : 'Inactive'}</p>
          </div>
          {provider.processedAt && (
            <div>
              <label className="text-sm font-medium text-gray-500">Processed Date</label>
              <p className="text-gray-900">{new Date(provider.processedAt).toLocaleDateString()}</p>
            </div>
          )}
          {provider.adminNotes && (
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-gray-500">Admin Notes</label>
              <p className="text-gray-900">{provider.adminNotes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {provider.verificationStatus === 'pending' && (
        <div className="flex justify-center space-x-4 pt-6">
          <button
            onClick={handleApprove}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            ✅ Approve Application
          </button>
          <button
            onClick={handleReject}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            ❌ Reject Application
          </button>
        </div>
      )}
    </div>
  )
}