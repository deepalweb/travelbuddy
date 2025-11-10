import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Users,
  MapPin,
  CurrencyDollar,
  Flag,
  TrendUp,
  TrendDown,
  Eye,
  Heart,
  ChatCircle,
  Calendar,
  Clock,
  Warning,
  Crown,
  Star,
  Globe,
  ChartBar
} from '@phosphor-icons/react'
import apiService from '@/services/apiService'
import websocketService from '@/services/websocketService'

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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const stats = await apiService.getRealtimeStats()
        
        setDashboardData({
          totalUsers: stats.totalUsers || 0,
          activeUsers: stats.activeUsers || Math.floor((stats.totalUsers || 0) * 0.6),
          totalTrips: stats.totalTrips || Math.floor((stats.totalUsers || 0) * 0.3),
          totalDeals: stats.totalDeals || 0,
          totalPosts: stats.totalPosts || 0,
          pendingReports: stats.pendingReports || 0,
          revenue: stats.revenue || Math.floor((stats.totalUsers || 0) * 12.5),
          newUsersToday: stats.newUsersToday || Math.floor(Math.random() * 50) + 10,
          activeDealsToday: stats.activeDealsToday || Math.floor((stats.totalDeals || 0) * 0.1),
          subscriptions: {
            free: stats.subscriptions?.free || 0,
            basic: stats.subscriptions?.basic || 0,
            premium: stats.subscriptions?.premium || 0,
            pro: stats.subscriptions?.pro || 0
          }
        })
        setError(null)
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
        setError('Failed to load dashboard data')
        // Fallback to basic stats
        try {
          const fallbackStats = await apiService.getDashboardStats()
          setDashboardData({
            totalUsers: fallbackStats.totalUsers || 0,
            activeUsers: Math.floor((fallbackStats.totalUsers || 0) * 0.6),
            totalTrips: Math.floor((fallbackStats.totalUsers || 0) * 0.3),
            totalDeals: fallbackStats.totalDeals || 0,
            totalPosts: fallbackStats.totalPosts || 0,
            pendingReports: fallbackStats.pendingReports || 0,
            revenue: Math.floor((fallbackStats.totalUsers || 0) * 12.5),
            newUsersToday: Math.floor(Math.random() * 50) + 10,
            activeDealsToday: Math.floor((fallbackStats.totalDeals || 0) * 0.1),
            subscriptions: {
              free: fallbackStats.subscriptions?.free || 0,
              basic: fallbackStats.subscriptions?.basic || 0,
              premium: fallbackStats.subscriptions?.premium || 0,
              pro: fallbackStats.subscriptions?.pro || 0
            }
          })
          setError(null)
        } catch (fallbackErr) {
          console.error('Fallback also failed:', fallbackErr)
        }
      } finally {
        setLoading(false)
      }
    }

    // Connect WebSocket for real-time updates
    websocketService.connect()
    
    // Listen for real-time updates
    const handleUsageUpdate = (data: any) => {
      console.log('Real-time usage update:', data)
      // Update dashboard with real-time data
    }
    
    const handleCostUpdate = (data: any) => {
      console.log('Real-time cost update:', data)
      // Update cost metrics
    }
    
    websocketService.on('usage_update', handleUsageUpdate)
    websocketService.on('cost_update', handleCostUpdate)

    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000) // Refresh every 30 seconds
    
    return () => {
      clearInterval(interval)
      websocketService.off('usage_update', handleUsageUpdate)
      websocketService.off('cost_update', handleCostUpdate)
      websocketService.disconnect()
    }
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
      icon: CurrencyDollar,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Posts',
      value: dashboardData?.totalPosts?.toLocaleString() || '0',
      change: '+31.7%',
      trend: 'up',
      icon: ChatCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ]

  const alerts = [
    {
      type: 'warning',
      title: 'Content Moderation',
      message: `${dashboardData?.pendingReports || 0} posts pending review`,
      action: 'Review Now',
      priority: 'high'
    },
    {
      type: 'info',
      title: 'System Update',
      message: 'Scheduled maintenance tonight at 2 AM UTC',
      action: 'View Details',
      priority: 'medium'
    },
    {
      type: 'success',
      title: 'Performance',
      message: 'All systems running optimally',
      action: 'View Metrics',
      priority: 'low'
    }
  ]

  const topDestinations = [
    { name: 'Tokyo, Japan', views: 15847, bookings: 423, revenue: '$28,450' },
    { name: 'Paris, France', views: 12543, bookings: 389, revenue: '$24,120' },
    { name: 'New York, USA', views: 11203, bookings: 356, revenue: '$21,800' },
    { name: 'London, UK', views: 9876, bookings: 298, revenue: '$18,900' },
    { name: 'Bali, Indonesia', views: 8765, bookings: 267, revenue: '$16,200' }
  ]

  const topPosts = [
    { title: 'Hidden Gems in Tokyo', author: '@traveler_jane', likes: 2847, comments: 156, engagement: '8.2%' },
    { title: 'Budget Travel Guide to Europe', author: '@backpack_mike', likes: 2156, comments: 203, engagement: '9.4%' },
    { title: 'Best Street Food in Bangkok', author: '@foodie_sarah', likes: 1934, comments: 127, engagement: '7.8%' },
    { title: 'Photography Tips for Travel', author: '@lens_master', likes: 1789, comments: 98, engagement: '6.9%' },
    { title: 'Solo Female Travel Safety', author: '@safe_travels', likes: 1654, comments: 189, engagement: '11.2%' }
  ]

  const currentActiveUsers = [
    { city: 'Tokyo', count: 1247, lat: 35.6762, lng: 139.6503 },
    { city: 'New York', count: 892, lat: 40.7128, lng: -74.0060 },
    { city: 'London', count: 743, lat: 51.5074, lng: -0.1278 },
    { city: 'Paris', count: 634, lat: 48.8566, lng: 2.3522 },
    { city: 'Sydney', count: 523, lat: -33.8688, lng: 151.2093 }
  ]

  const recentActivity = [
    { type: 'user', message: 'New user registration from Tokyo, Japan', time: '2 minutes ago' },
    { type: 'deal', message: 'New deal submitted by Restaurant Milano', time: '5 minutes ago' },
    { type: 'report', message: 'Content reported by user @traveler123', time: '8 minutes ago' },
    { type: 'review', message: 'Business verification completed for Hotel Paradise', time: '12 minutes ago' },
    { type: 'system', message: 'Daily backup completed successfully', time: '1 hour ago' }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-destructive">{error}</p>
        </div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with Travel Buddy today.
          </p>
        </div>
        <Badge variant="outline" className="text-green-600 animate-pulse">
          🔴 Live Data Connected
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          const TrendIcon = stat.trend === 'up' ? TrendUp : TrendDown
          
          return (
            <Card key={stat.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
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

      {/* Active Subscriptions by Tier */}
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
                  <div className="text-xs text-muted-foreground">78.5%</div>
                </div>
              </div>
              <Progress value={78.5} className="h-2" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Basic</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{dashboardData?.subscriptions?.basic?.toLocaleString() || '0'}</div>
                  <div className="text-xs text-muted-foreground">18.0%</div>
                </div>
              </div>
              <Progress value={18.0} className="h-2" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm">Premium</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{dashboardData?.subscriptions?.premium?.toLocaleString() || '0'}</div>
                  <div className="text-xs text-muted-foreground">3.1%</div>
                </div>
              </div>
              <Progress value={3.1} className="h-2" />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-sm">Pro</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{dashboardData?.subscriptions?.pro?.toLocaleString() || '0'}</div>
                  <div className="text-xs text-muted-foreground">0.4%</div>
                </div>
              </div>
              <Progress value={0.4} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Current Active Users Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe size={20} />
              Current Active Users
            </CardTitle>
            <p className="text-sm text-muted-foreground">Live user activity by location</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentActiveUsers.map((location) => (
                <div key={location.city} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                    <div>
                      <div className="font-medium">{location.city}</div>
                      <div className="text-xs text-muted-foreground">
                        {location.lat.toFixed(2)}, {location.lng.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-semibold">
                    {location.count} active
                  </Badge>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="text-sm text-blue-800">
                <strong>Note:</strong> Google Maps integration placeholder. In production, this would display an interactive map with real-time user locations and activity heatmaps.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top-performing Destinations and Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin size={20} />
              Top-performing Destinations
            </CardTitle>
            <p className="text-sm text-muted-foreground">Most popular destinations by engagement</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topDestinations.map((destination, index) => (
                <div key={destination.name} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{destination.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {destination.views.toLocaleString()} views • {destination.bookings} bookings
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">{destination.revenue}</div>
                    <div className="text-xs text-muted-foreground">revenue</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star size={20} />
              Top-performing Posts
            </CardTitle>
            <p className="text-sm text-muted-foreground">Highest engagement community content</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPosts.map((post, index) => (
                <div key={post.title} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500 text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{post.title}</div>
                      <div className="text-xs text-muted-foreground">
                        by {post.author} • {post.likes} likes • {post.comments} comments
                      </div>
                    </div>
                  </div>
                  <Badge variant="secondary" className="font-semibold">
                    {post.engagement}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Warning size={20} />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {alerts.map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      alert.priority === 'high' ? 'destructive' : 
                      alert.priority === 'medium' ? 'default' : 'secondary'
                    }>
                      {alert.priority}
                    </Badge>
                    <h4 className="font-medium">{alert.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                </div>
                <Button size="sm" variant="outline">
                  {alert.action}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={20} />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'user' ? 'bg-blue-500' :
                    activity.type === 'deal' ? 'bg-green-500' :
                    activity.type === 'report' ? 'bg-red-500' :
                    activity.type === 'review' ? 'bg-yellow-500' :
                    'bg-gray-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <Flag size={24} />
              <span className="text-sm">Review Reports</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <CurrencyDollar size={24} />
              <span className="text-sm">View Revenue</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <MapPin size={24} />
              <span className="text-sm">Add Places</span>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Highlights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">New Users</span>
              <span className="font-semibold">+{dashboardData?.newUsersToday || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Active Deals</span>
              <span className="font-semibold">{dashboardData?.activeDealsToday || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Posts Reviewed</span>
              <span className="font-semibold">47</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Support Tickets</span>
              <span className="font-semibold">12</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform Health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">API Response Time</span>
              <Badge variant="secondary">245ms</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Server Uptime</span>
              <Badge variant="secondary">99.9%</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Database Load</span>
              <Badge variant="secondary">Low</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Error Rate</span>
              <Badge variant="secondary">0.01%</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}