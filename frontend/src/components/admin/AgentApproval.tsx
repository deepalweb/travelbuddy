import React, { useState } from 'react'
import { Badge } from '../Badge'

interface AgentApplication {
  id: string
  agencyName: string
  ownerName: string
  email: string
  phone: string
  address: string
  licenseNumber: string
  experience: string
  specialties: string[]
  submittedDate: string
  status: 'pending' | 'approved' | 'rejected'
  documents: string[]
}

export default function AgentApproval() {
  const [applications, setApplications] = useState<AgentApplication[]>([
    {
      id: '1',
      agencyName: 'Paradise Travel Agency',
      ownerName: 'Emma Rodriguez',
      email: 'emma@paradisetravel.com',
      phone: '+1-555-0234',
      address: '123 Main St, Downtown',
      licenseNumber: 'TA-2024-001',
      experience: '8 years',
      specialties: ['Beach Resorts', 'Adventure Tours', 'Family Packages'],
      submittedDate: '2024-01-16',
      status: 'pending',
      documents: ['license.pdf', 'insurance.pdf', 'certification.pdf']
    },
    {
      id: '2',
      agencyName: 'Mountain Explorer Tours',
      ownerName: 'David Chen',
      email: 'david@mountainexplorer.com',
      phone: '+1-555-0567',
      address: '456 Hill Road, Uptown',
      licenseNumber: 'TA-2024-002',
      experience: '12 years',
      specialties: ['Mountain Trekking', 'Wildlife Safari', 'Cultural Tours'],
      submittedDate: '2024-01-15',
      status: 'pending',
      documents: ['license.pdf', 'insurance.pdf', 'references.pdf']
    },
    {
      id: '3',
      agencyName: 'City Break Specialists',
      ownerName: 'Lisa Thompson',
      email: 'lisa@citybreak.com',
      phone: '+1-555-0890',
      address: '789 Urban Ave, Central',
      licenseNumber: 'TA-2024-003',
      experience: '5 years',
      specialties: ['City Tours', 'Business Travel', 'Weekend Getaways'],
      submittedDate: '2024-01-14',
      status: 'approved',
      documents: ['license.pdf', 'insurance.pdf', 'certification.pdf', 'portfolio.pdf']
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
          <h2 className="text-2xl font-bold text-gray-900">Travel Agent Registration Approval</h2>
          <p className="text-gray-600">Review and approve local travel agent applications</p>
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
                  Agency Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Experience & Specialties
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
                      <div className="text-sm font-medium text-gray-900">{app.agencyName}</div>
                      <div className="text-sm text-gray-500">{app.ownerName}</div>
                      <div className="text-sm text-gray-500">{app.email}</div>
                      <div className="text-sm text-gray-500">{app.phone}</div>
                      <div className="text-sm text-gray-500">{app.address}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">License: {app.licenseNumber}</div>
                      <div className="text-sm text-gray-500">Experience: {app.experience}</div>
                      <div className="text-sm text-gray-500 mt-2">
                        <div className="font-medium">Specialties:</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {app.specialties.map((specialty, index) => (
                            <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">Applied: {app.submittedDate}</div>
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
        <h3 className="text-lg font-semibold mb-4">Agent Registration Statistics</h3>
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
            <div className="text-sm text-green-700">Approved Agents</div>
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