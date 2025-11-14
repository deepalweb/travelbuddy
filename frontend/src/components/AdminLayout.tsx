import React, { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import AdminDashboard from './admin/AdminDashboard'
import UserManagement from './admin/UserManagement'
import ContentModeration from './admin/ContentModeration'
import AgentApproval from './admin/AgentApproval'

export const AdminLayout: React.FC = () => {
  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState('dashboard')
  
  // Check if user has admin privileges
  const isAdmin = user?.role === 'admin' || user?.isAdmin
  
  if (!isAdmin) {
    return <Navigate to="/login" replace />
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboard />
      case 'users':
        return <UserManagement />
      case 'content':
        return <ContentModeration />
      case 'agents':
        return <AgentApproval />
      default:
        return <AdminDashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-white shadow-sm border-r">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
          <p className="text-sm text-gray-600">Travel Buddy</p>
        </div>
        
        <nav className="p-4 space-y-2">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'users', label: 'User Management' },
            { id: 'content', label: 'Content Moderation' },
            { id: 'agents', label: 'Agent Approvals' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                activeSection === item.id
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {renderActiveSection()}
      </main>
    </div>
  )
}