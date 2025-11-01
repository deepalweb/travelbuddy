import React, { useState } from 'react'
import { Badge } from '../Badge'

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
  const [applications, setApplications] = useState<TransportApplication[]>([
    {
      id: '1',
      companyName: 'City Express Transport',
      ownerName: 'John Smith',
      email: 'john@cityexpress.com',
      phone: '+1-555-0123',
      vehicleType: 'Bus',
      licenseNumber: 'DL123456789',
      registrationNumber: 'ABC-1234',
      submittedDate: '2024-01-15',
      status: 'pending',
      documents: ['license.pdf', 'registration.pdf', 'insurance.pdf']
    },
    {
      id: '2',
      companyName: 'Metro Taxi Service',
      ownerName: 'Sarah Johnson',
      email: 'sarah@metrotaxi.com',
      phone: '+1-555-0456',
      vehicleType: 'Taxi',
      licenseNumber: 'DL987654321',
      registrationNumber: 'XYZ-5678',
      submittedDate: '2024-01-14',
      status: 'pending',
      documents: ['license.pdf', 'registration.pdf']
    },
    {
      id: '3',
      companyName: 'Green Shuttle Co',
      ownerName: 'Mike Wilson',
      email: 'mike@greenshuttle.com',
      phone: '+1-555-0789',
      vehicleType: 'Van',
      licenseNumber: 'DL456789123',
      registrationNumber: 'GRN-9012',
      submittedDate: '2024-01-13',
      status: 'approved',
      documents: ['license.pdf', 'registration.pdf', 'insurance.pdf', 'inspection.pdf']
    }
  ])

  const handleApprove = (id: string) => {
    setApplications(prev => 
      prev.map(app => 
        app.id === id ? { ...app, status: 'approved' as const } : app
      )
    )
  }

  const handleReject = (id: string) => {
    setApplications(prev => 
      prev.map(app => 
        app.id === id ? { ...app, status: 'rejected' as const } : app
      )
    )
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
                      {app.documents.map((doc, index) => (
                        <div key={index} className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
                          📄 {doc}
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
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => handleReject(app.id)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md transition-colors"
                        >
                          ❌ Reject
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
    </div>
  )
}