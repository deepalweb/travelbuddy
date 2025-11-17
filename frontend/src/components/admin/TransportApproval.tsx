import React, { useState, useEffect } from 'react'
import { Badge } from '../Badge'
import TransportProviderDetails from './TransportProviderDetails'

interface TransportApplication {
  id: string
  companyName: string
  ownerName: string
  email: string
  phone: string
  vehicleType: string
  licenseNumber: string
  registrationNumber: string
  submittedDate: string
  status: 'pending' | 'approved' | 'rejected'
  documents: string[]
}

export default function TransportApproval() {
  const [applications, setApplications] = useState<TransportApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await fetch('https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api/transport-providers/admin/applications')
      const data = await response.json()
      
      console.log('API Response:', response.status, response.ok)
      console.log('Raw API data:', data)
      console.log('Applications array:', data.applications)
      console.log('First application:', data.applications?.[0])
      
      if (response.ok && data.applications) {
        // Transform API data to match component interface
        const transformedData = data.applications.map((app: any) => ({
          id: app._id || app.providerId || app.id,
          companyName: app.companyName,
          ownerName: app.ownerName,
          email: app.email,
          phone: app.phone,
          vehicleType: Array.isArray(app.vehicleTypes) ? app.vehicleTypes.join(', ') : app.vehicleTypes,
          licenseNumber: app.licenseNumber,
          registrationNumber: app.licenseNumber,
          submittedDate: app.registrationDate || app.submittedDate,
          status: app.verificationStatus || app.status,
          documents: app.documents || []
        }))
        
        console.log('Transformed applications:', transformedData)
        setApplications(transformedData)
      } else {
        throw new Error('Failed to fetch applications')
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error)
      setApplications([])
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api/transport-providers/admin/approve/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', notes: 'Application approved by admin' })
      })
      
      if (response.ok) {
        setApplications(prev => 
          prev.map(app => 
            app.id === id ? { ...app, status: 'approved' as const } : app
          )
        )
      }
    } catch (error) {
      console.error('Approval failed:', error)
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('Reason for rejection:')
    if (!reason) return
    
    try {
      const response = await fetch(`https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api/transport-providers/admin/approve/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', notes: reason })
      })
      
      if (response.ok) {
        setApplications(prev => 
          prev.map(app => 
            app.id === id ? { ...app, status: 'rejected' as const } : app
          )
        )
      }
    } catch (error) {
      console.error('Rejection failed:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300">Pending</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const pendingCount = applications.filter(app => app.status === 'pending').length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading transport applications...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transport Registration Approval</h2>
          <p className="text-gray-600">Review and approve transport service applications</p>
        </div>
        <Badge className="bg-blue-100 text-blue-800">
          {pendingCount} Pending Applications
        </Badge>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{app.companyName}</div>
                      <div className="text-sm text-gray-500">{app.ownerName}</div>
                      <div className="text-sm text-gray-500">{app.email}</div>
                      <div className="text-sm text-gray-500">{app.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{app.vehicleType}</div>
                      <div className="text-sm text-gray-500">License: {app.licenseNumber}</div>
                      <div className="text-sm text-gray-500">Reg: {app.registrationNumber}</div>
                      <div className="text-sm text-gray-500">Applied: {app.submittedDate}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {(app.documents || []).map((doc, index) => (
                        <div key={index} className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                             onClick={() => window.open(`/api/documents/${doc}`, '_blank')}>
                          📄 {String(doc)}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(app.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {app.status === 'pending' && (
                      <div className="space-x-2">
                        <button
                          onClick={() => handleApprove(app.id)}
                          className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md transition-colors"
                          title="Approve application and activate provider account"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => handleReject(app.id)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors"
                          title="Reject application with reason"
                        >
                          ❌ Reject
                        </button>
                        <button
                          onClick={() => setSelectedProviderId(app.id)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors"
                          title="View full application details"
                        >
                          👁️ Details
                        </button>
                      </div>
                    )}
                    {app.status === 'approved' && (
                      <span className="text-green-600 font-medium">✅ Approved</span>
                    )}
                    {app.status === 'rejected' && (
                      <span className="text-red-600 font-medium">❌ Rejected</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Application Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {applications.filter(app => app.status === 'pending').length}
            </div>
            <div className="text-sm text-yellow-700">Pending Review</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {applications.filter(app => app.status === 'approved').length}
            </div>
            <div className="text-sm text-green-700">Approved</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">
              {applications.filter(app => app.status === 'rejected').length}
            </div>
            <div className="text-sm text-red-700">Rejected</div>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedProviderId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Provider Details</h2>
              <button
                onClick={() => setSelectedProviderId(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <TransportProviderDetails providerId={selectedProviderId} onClose={() => setSelectedProviderId(null)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
