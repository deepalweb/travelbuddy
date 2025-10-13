import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  TrendUp, 
  TrendDown, 
  Users, 
  Eye,
  Heart,
  MapPin,
  Airplane,
  CurrencyDollar,
  Download,
  Calendar,
  Activity,
  Target,
  Globe,
  Clock,
  Star
} from '@phosphor-icons/react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const userGrowthData = [
  { month: 'Jan', users: 1200, activeUsers: 980 },
  { month: 'Feb', users: 1890, activeUsers: 1520 },
  { month: 'Mar', users: 2380, activeUsers: 1980 },
  { month: 'Apr', users: 3908, activeUsers: 3200 },
  { month: 'May', users: 4800, activeUsers: 4100 },
  { month: 'Jun', users: 5800, activeUsers: 4950 },
  { month: 'Jul', users: 7200, activeUsers: 6100 },
  { month: 'Aug', users: 8900, activeUsers: 7500 },
]

const engagementData = [
  { feature: 'Trip Planning', usage: 4500, satisfaction: 4.8 },
  { feature: 'Deal Discovery', usage: 3200, satisfaction: 4.6 },
  { feature: 'Community Posts', usage: 2800, satisfaction: 4.4 },
  { feature: 'Reviews', usage: 2100, satisfaction: 4.7 },
  { feature: 'Bookings', usage: 1900, satisfaction: 4.5 },
]

const retentionData = [
  { week: 'Week 1', retention: 85, churn: 15 },
  { week: 'Week 2', retention: 72, churn: 28 },
  { week: 'Week 4', retention: 58, churn: 42 },
  { week: 'Week 8', retention: 45, churn: 55 },
  { week: 'Week 12', retention: 38, churn: 62 },
  { week: 'Week 24', retention: 32, churn: 68 },
]

const topDestinations = [
  { name: 'Paris', visits: 2400, bookings: 1800, revenue: 125000 },
  { name: 'Tokyo', visits: 2100, bookings: 1600, revenue: 98000 },
  { name: 'New York', visits: 1900, bookings: 1400, revenue: 110000 },
  { name: 'London', visits: 1700, bookings: 1200, revenue: 85000 },
  { name: 'Bali', visits: 1500, bookings: 1100, revenue: 70000 },
]

const realtimeMetrics = [
  { metric: 'Active Users', value: '1,247', change: '+5.2%', trend: 'up' },
  { metric: 'Page Views', value: '8,420', change: '+12.1%', trend: 'up' },
  { metric: 'Bookings Today', value: '89', change: '-2.4%', trend: 'down' },
  { metric: 'Revenue (24h)', value: '$12,450', change: '+8.7%', trend: 'up' },
]

const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444']

export default function AnalyticsHub() {
  const [dateRange, setDateRange] = useState('7d')
  const [exportFormat, setExportFormat] = useState('pdf')

  const handleExport = () => {
    console.log(`Exporting analytics report as ${exportFormat}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics & Insights</h2>
          <p className="text-muted-foreground">
            Deep dive into platform metrics and user behavior
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleExport} className="gap-2">
            <Download size={16} />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="growth">User Growth</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="destinations">Destinations</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45,231</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-emerald-600 flex items-center gap-1">
                    <TrendUp size={12} />
                    +20.1% from last month
                  </span>
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12,450</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-emerald-600 flex items-center gap-1">
                    <TrendUp size={12} />
                    +15.3% from last month
                  </span>
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                <Airplane className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,350</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-red-600 flex items-center gap-1">
                    <TrendDown size={12} />
                    -5.2% from last month
                  </span>
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <CurrencyDollar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$573,420</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-emerald-600 flex items-center gap-1">
                    <TrendUp size={12} />
                    +12.5% from last month
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Growth Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="users" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="activeUsers" stackId="2" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feature Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="feature" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="usage" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="growth" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Growth Over Time</CardTitle>
                <p className="text-sm text-muted-foreground">Total and active user trends</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="users" stroke="#8B5CF6" strokeWidth={3} name="Total Users" />
                    <Line type="monotone" dataKey="activeUsers" stroke="#06B6D4" strokeWidth={3} name="Active Users" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Retention vs Churn Analysis</CardTitle>
                <p className="text-sm text-muted-foreground">User retention patterns over time</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={retentionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="retention" stackId="1" stroke="#10B981" fill="#10B981" name="Retention %" />
                    <Area type="monotone" dataKey="churn" stackId="1" stroke="#EF4444" fill="#EF4444" name="Churn %" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">New User Signups</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">+1,234</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">User Activation Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">78.5%</div>
                <p className="text-xs text-muted-foreground">Users completing first action</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">30-Day Retention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">42.3%</div>
                <p className="text-xs text-muted-foreground">Users returning after 30 days</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Feature Usage Distribution</CardTitle>
                <p className="text-sm text-muted-foreground">How users interact with different features</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={engagementData}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="usage"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {engagementData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Satisfaction by Feature</CardTitle>
                <p className="text-sm text-muted-foreground">Average ratings and usage correlation</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={engagementData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 5]} />
                    <YAxis dataKey="feature" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="satisfaction" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Daily Active Users</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">8,420</div>
                <Badge variant="secondary" className="text-xs">+12.5%</Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg. Session Duration</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">12m 34s</div>
                <Badge variant="secondary" className="text-xs">+2.1%</Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">23.4%</div>
                <Badge variant="destructive" className="text-xs">-1.8%</Badge>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">45.2K</div>
                <Badge variant="secondary" className="text-xs">+8.9%</Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="destinations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Destinations Performance</CardTitle>
              <p className="text-sm text-muted-foreground">Most popular destinations and their metrics</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topDestinations.map((destination, index) => (
                  <div key={destination.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          <MapPin size={16} />
                          {destination.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {destination.visits.toLocaleString()} visits • {destination.bookings.toLocaleString()} bookings
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-emerald-600">
                        ${destination.revenue.toLocaleString()}
                      </div>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Popular Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { activity: 'City Tours', bookings: 1420, rating: 4.8 },
                    { activity: 'Food Experiences', bookings: 1230, rating: 4.9 },
                    { activity: 'Adventure Sports', bookings: 980, rating: 4.6 },
                    { activity: 'Cultural Sites', bookings: 850, rating: 4.7 },
                    { activity: 'Beach Activities', bookings: 720, rating: 4.5 },
                  ].map((item) => (
                    <div key={item.activity} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{item.activity}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.bookings} bookings
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{item.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seasonal Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={[
                    { season: 'Spring', bookings: 3200, revenue: 245000 },
                    { season: 'Summer', bookings: 5800, revenue: 420000 },
                    { season: 'Fall', bookings: 4100, revenue: 315000 },
                    { season: 'Winter', bookings: 2900, revenue: 198000 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="season" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="bookings" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {realtimeMetrics.map((metric) => (
              <Card key={metric.metric}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{metric.metric}</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className={`flex items-center gap-1 ${metric.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {metric.trend === 'up' ? <TrendUp size={12} /> : <TrendDown size={12} />}
                      {metric.change} from yesterday
                    </span>
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Live Activity Feed</CardTitle>
                <Badge className="w-fit">Live</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {[
                    { action: 'New booking', user: 'John D.', destination: 'Paris', time: '2 min ago' },
                    { action: 'Review posted', user: 'Sarah M.', destination: 'Tokyo', time: '5 min ago' },
                    { action: 'User registered', user: 'Mike R.', destination: null, time: '8 min ago' },
                    { action: 'Deal viewed', user: 'Emma L.', destination: 'Bali', time: '12 min ago' },
                    { action: 'Trip shared', user: 'Alex K.', destination: 'London', time: '15 min ago' },
                    { action: 'New booking', user: 'Lisa P.', destination: 'New York', time: '18 min ago' },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{activity.action}</div>
                        <div className="text-sm text-muted-foreground">
                          {activity.user} {activity.destination && `• ${activity.destination}`}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">{activity.time}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <Badge variant="secondary">All Systems Operational</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { service: 'API Response Time', status: 'good', value: '145ms' },
                    { service: 'Database Performance', status: 'good', value: '99.9%' },
                    { service: 'Search Service', status: 'warning', value: '98.2%' },
                    { service: 'Payment Gateway', status: 'good', value: '100%' },
                    { service: 'CDN Availability', status: 'good', value: '99.8%' },
                  ].map((service) => (
                    <div key={service.service} className="flex items-center justify-between">
                      <div className="font-medium">{service.service}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{service.value}</span>
                        <div className={`w-2 h-2 rounded-full ${
                          service.status === 'good' ? 'bg-emerald-500' : 
                          service.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}