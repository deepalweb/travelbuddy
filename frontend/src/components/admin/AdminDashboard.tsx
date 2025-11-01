import React, { useState, useEffect } from 'react'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalTrips: number
  totalDeals: number
  totalPosts: number
  pendingReports: number
  revenue: number
  newUsersToday: number
}

export default function AdminDashboard() {
  const [stats] = useState<DashboardStats>({
    totalUsers: 1234,
    activeUsers: 856,
    totalTrips: 567,
    totalDeals: 89,
    totalPosts: 234,
    pendingReports: 12,
    revenue: 15678,
    newUsersToday: 23
  })
  const [loading] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back, Admin</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Trips</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.totalTrips}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Pending Reports</h3>
          <p className="text-2xl font-bold text-red-600">{stats.pendingReports}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">New users today</span>
              <span className="font-medium">{stats.newUsersToday}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total posts</span>
              <span className="font-medium">{stats.totalPosts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total deals</span>
              <span className="font-medium">{stats.totalDeals}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">System Health</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Database</span>
              <span className="text-green-600 font-medium">Connected</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">API Status</span>
              <span className="text-green-600 font-medium">Operational</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Last Updated</span>
              <span className="font-medium">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}