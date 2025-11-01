import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Navigate, useNavigate } from 'react-router-dom'
import DashboardOverview from '../components/admin/DashboardOverview'
import UserManagement from '../components/admin/UserManagement'
import ContentModeration from '../components/admin/ContentModeration'
import AnalyticsHub from '../components/admin/AnalyticsHub'
import BusinessManagement from '../components/admin/BusinessManagement'
import SystemSettings from '../components/admin/SystemSettings'
import TransportApproval from '../components/admin/TransportApproval'
import AgentApproval from '../components/admin/AgentApproval'

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')

  // Allow access for demo purposes
  const isAdmin = user?.isAdmin || localStorage.getItem('mock_admin') || true

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', component: DashboardOverview },
    { id: 'users', label: 'Users', component: UserManagement },
    { id: 'transport', label: 'Transport Approval', component: TransportApproval },
    { id: 'agents', label: 'Agent Approval', component: AgentApproval },
    { id: 'content', label: 'Content', component: ContentModeration },
    { id: 'analytics', label: 'Analytics', component: AnalyticsHub },
    { id: 'business', label: 'Business', component: BusinessManagement },
    { id: 'settings', label: 'Settings', component: SystemSettings },
  ]

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || DashboardOverview

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                ← Back to App
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="text-sm text-gray-600">
              Welcome, {user?.username || 'Admin'}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <ActiveComponent />
      </div>
    </div>
  )
}