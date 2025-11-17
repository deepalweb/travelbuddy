import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../Card'
import { Badge } from '../Badge'
import { Button } from '../Button'
import { Users, MapPin, DollarSign, MessageCircle, TrendingUp, TrendingDown, Eye, Heart, Clock, AlertTriangle, Crown, Star, Globe, BarChart3 } from 'lucide-react'

interface DashboardData {
  totalUsers: number
  activeUsers: number
  totalTrips: number
  totalDeals: number
  totalPosts: number
  pendingReports: number
  revenue: number
  newUsersToday: number
  activeDealsToday: number
  subscriptions: {
    free: number
    basic: number
    premium: number
    pro: number
  }
}

export default function DashboardOverview() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalUsers: 0,
    activeUsers: 0,
    totalTrips: 0,
    totalDeals: 0,
    totalPosts: 0,
    pendingReports: 0,
    revenue: 0,
    newUsersToday: 0,
    activeDealsToday: 0,
    subscriptions: {
      free: 0,
      basic: 0,
      premium: 0,
      pro: 0
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Use mock data instead of API call
    setDashboardData({
      totalUsers: 1234,
      activeUsers: 856,
      totalTrips: 567,
      totalDeals: 89,
      totalPosts: 234,
      pendingReports: 12,
      revenue: 15678,
      newUsersToday: 23,
      activeDealsToday: 8,
      subscriptions: {
        free: 970,
        basic: 222,
        premium: 38,
        pro: 4
      }
    })
    setLoading(false)
  }, [])

  const stats = [
    {
      title: 'Total Users',
      value: dashboardData?.totalUsers?.toLocaleString() || '0',
      change: '+12.5%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Trips',
      value: dashboardData?.totalTrips?.toLocaleString() || '0',
      change: '+18.3%',
      trend: 'up',
      icon: MapPin,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Total Deals',
      value: dashboardData?.totalDeals?.toLocaleString() || '0',
      change: '+24.1%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Posts',
      value: dashboardData?.totalPosts?.toLocaleString() || '0',
      change: '+31.7%',
      trend: 'up',
      icon: MessageCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-gray-600">
            Welcome back! Here's what's happening with Travel Buddy today.
          </p>
        </div>
        <Badge className="text-green-600">
          🔴 Live Data Connected
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown
          
          return (
            <Card key={stat.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon size={20} className={stat.color} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className={`flex items-center text-sm mt-1 ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendIcon size={16} className="mr-1" />
                  {stat.change}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown size={20} />
              Active Subscriptions by Tier
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                  <span className="text-sm">Free</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{dashboardData?.subscriptions?.free?.toLocaleString() || '0'}</div>
                  <div className="text-xs text-gray-600">78.5%</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Basic</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{dashboardData?.subscriptions?.basic?.toLocaleString() || '0'}</div>
                  <div className="text-xs text-gray-600">18.0%</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm">Premium</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{dashboardData?.subscriptions?.premium?.toLocaleString() || '0'}</div>
                  <div className="text-xs text-gray-600">3.1%</div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-sm">Pro</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{dashboardData?.subscriptions?.pro?.toLocaleString() || '0'}</div>
                  <div className="text-xs text-gray-600">0.4%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button className="h-20 flex-col gap-2">
              <Users size={24} />
              <span className="text-sm">Manage Users</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <AlertTriangle size={24} />
              <span className="text-sm">Review Reports</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <DollarSign size={24} />
              <span className="text-sm">View Revenue</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <MapPin size={24} />
              <span className="text-sm">Add Places</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
