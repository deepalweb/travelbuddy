import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '../components/Card'
import { 
  Users, Store, Car, MapPin, TrendingUp, 
  DollarSign, CheckCircle, Clock 
} from 'lucide-react'

export const EcosystemDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEcosystemData()
  }, [])

  const fetchEcosystemData = async () => {
    try {
      // Mock data for ecosystem overview
      setAnalytics({
        ecosystem: {
          totalUsers: 1247,
          roleDistribution: {
            traveler: 892,
            merchant: 156,
            transport_provider: 89,
            travel_agent: 67,
            admin: 3
          }
        },
        revenue: {
          totalCommissions: 15420,
          monthlyGrowth: 23.5,
          activeDeals: 89,
          completedBookings: 234
        }
      })
    } catch (error) {
      console.error('Failed to fetch ecosystem data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading ecosystem data...</div>
  }

  const { ecosystem, revenue } = analytics

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">TravelBuddy Ecosystem</h1>
          <p className="text-gray-600">Multi-sided platform analytics and insights</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{ecosystem.totalUsers.toLocaleString()}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Platform Revenue</p>
                  <p className="text-2xl font-bold">${revenue.totalCommissions.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Monthly Growth</p>
                  <p className="text-2xl font-bold">+{revenue.monthlyGrowth}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Deals</p>
                  <p className="text-2xl font-bold">{revenue.activeDeals}</p>
                </div>
                <Store className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Role Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">User Role Distribution</h3>
              <div className="space-y-4">
                {Object.entries(ecosystem.roleDistribution).map(([role, count]) => {
                  const percentage = ((count as number) / ecosystem.totalUsers * 100).toFixed(1)
                  const roleConfig = {
                    traveler: { label: 'Travelers', icon: <Users className="w-5 h-5" />, color: 'bg-blue-500' },
                    merchant: { label: 'Merchants', icon: <Store className="w-5 h-5" />, color: 'bg-green-500' },
                    transport_provider: { label: 'Transport Providers', icon: <Car className="w-5 h-5" />, color: 'bg-orange-500' },
                    travel_agent: { label: 'Travel Agents', icon: <MapPin className="w-5 h-5" />, color: 'bg-purple-500' },
                    admin: { label: 'Administrators', icon: <CheckCircle className="w-5 h-5" />, color: 'bg-gray-500' }
                  }

                  const config = roleConfig[role] || { label: role, icon: <Users className="w-5 h-5" />, color: 'bg-gray-400' }

                  return (
                    <div key={role} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${config.color} text-white`}>
                          {config.icon}
                        </div>
                        <div>
                          <p className="font-medium">{config.label}</p>
                          <p className="text-sm text-gray-600">{count} users ({percentage}%)</p>
                        </div>
                      </div>
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${config.color}`}
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
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Platform Activity</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="font-medium">Completed Bookings</p>
                      <p className="text-sm text-gray-600">This month</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{revenue.completedBookings}</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Store className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-medium">Active Deals</p>
                      <p className="text-sm text-gray-600">Currently live</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{revenue.activeDeals}</p>
                </div>

                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-6 h-6 text-purple-600" />
                    <div>
                      <p className="font-medium">Pending Verifications</p>
                      <p className="text-sm text-gray-600">Awaiting approval</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
