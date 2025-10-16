import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  ChartBar,
  TrendUp,
  CurrencyDollar,
  Users,
  Globe,
  Clock,
  Warning
} from '@phosphor-icons/react'
import apiService from '@/services/apiService'

interface AnalyticsData {
  usage: {
    totals: {
      openai: { count: number; success: number; error: number }
      maps: { count: number; success: number; error: number }
      places: { count: number; success: number; error: number }
    }
    events: any[]
  }
  subscriptions: {
    totalUsers: number
    tierDistribution: Record<string, number>
    statusDistribution: Record<string, number>
    conversionRate: number
  }
  costs: {
    totals: Record<string, any>
    projections: {
      dailyUSD: number
      monthlyUSD: number
    }
  }
  health: {
    mongo: {
      connected: boolean
    }
  }
}

export default function AnalyticsHub() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    usage: { totals: { openai: { count: 0, success: 0, error: 0 }, maps: { count: 0, success: 0, error: 0 }, places: { count: 0, success: 0, error: 0 } }, events: [] },
    subscriptions: { totalUsers: 0, tierDistribution: {}, statusDistribution: {}, conversionRate: 0 },
    costs: { totals: {}, projections: { dailyUSD: 0, monthlyUSD: 0 } },
    health: { mongo: { connected: false } }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
    const interval = setInterval(fetchAnalytics, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const [usage, subscriptions, costs, health] = await Promise.all([
        apiService.getUsageStats().catch(() => ({ totals: { openai: { count: 0, success: 0, error: 0 }, maps: { count: 0, success: 0, error: 0 }, places: { count: 0, success: 0, error: 0 } }, events: [] })),
        apiService.getSubscriptionAnalytics().catch(() => ({ totalUsers: 0, tierDistribution: {}, statusDistribution: {}, conversionRate: 0 })),
        apiService.getApiCosts().catch(() => ({ totals: {}, projections: { dailyUSD: 0, monthlyUSD: 0 } })),
        apiService.getSystemHealth().catch(() => ({ mongo: { connected: false } }))
      ])
      
      setAnalytics({ 
        usage: usage || { totals: { openai: { count: 0, success: 0, error: 0 }, maps: { count: 0, success: 0, error: 0 }, places: { count: 0, success: 0, error: 0 } }, events: [] },
        subscriptions: subscriptions || { totalUsers: 0, tierDistribution: {}, statusDistribution: {}, conversionRate: 0 },
        costs: costs || { totals: {}, projections: { dailyUSD: 0, monthlyUSD: 0 } },
        health: health || { mongo: { connected: false } }
      })
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTotalApiCalls = () => {
    const { openai, maps, places } = analytics.usage?.totals || { openai: { count: 0 }, maps: { count: 0 }, places: { count: 0 } }
    return (openai?.count || 0) + (maps?.count || 0) + (places?.count || 0)
  }

  const getSuccessRate = () => {
    const { openai, maps, places } = analytics.usage?.totals || { openai: { success: 0 }, maps: { success: 0 }, places: { success: 0 } }
    const totalCalls = getTotalApiCalls()
    const totalSuccess = (openai?.success || 0) + (maps?.success || 0) + (places?.success || 0)
    return totalCalls > 0 ? Math.round((totalSuccess / totalCalls) * 100) : 0
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Hub</h2>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Analytics Hub</h2>
          <p className="text-muted-foreground">
            Real-time insights and performance metrics
          </p>
        </div>
        <Badge variant={analytics.health?.mongo?.connected ? "default" : "destructive"}>
          {analytics.health?.mongo?.connected ? 'Database Connected' : 'Database Offline'}
        </Badge>
      </div>

      {/* API Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
            <ChartBar size={16} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalApiCalls().toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Success rate: {getSuccessRate()}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OpenAI Calls</CardTitle>
            <Globe size={16} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analytics.usage?.totals?.openai?.count || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.usage?.totals?.openai?.success || 0} success, {analytics.usage?.totals?.openai?.error || 0} errors
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maps API Calls</CardTitle>
            <Globe size={16} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analytics.usage?.totals?.maps?.count || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.usage?.totals?.maps?.success || 0} success, {analytics.usage?.totals?.maps?.error || 0} errors
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Places API Calls</CardTitle>
            <Globe size={16} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(analytics.usage?.totals?.places?.count || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.usage?.totals?.places?.success || 0} success, {analytics.usage?.totals?.places?.error || 0} errors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CurrencyDollar size={20} />
              API Cost Projections
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Daily Projected Cost</span>
              <span className="font-semibold">${(analytics.costs?.projections?.dailyUSD || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Monthly Projected Cost</span>
              <span className="font-semibold">${(analytics.costs?.projections?.monthlyUSD || 0).toFixed(2)}</span>
            </div>
            <div className="pt-4">
              <div className="text-sm text-muted-foreground mb-2">Cost Breakdown by API</div>
              {Object.entries(analytics.costs?.totals || {}).map(([api, data]: [string, any]) => (
                <div key={api} className="flex justify-between items-center py-1">
                  <span className="text-sm capitalize">{api}</span>
                  <span className="text-sm font-medium">${data.costUSD?.toFixed(4) || '0.0000'}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={20} />
              Subscription Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Users</span>
              <span className="font-semibold">{analytics.subscriptions?.totalUsers || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Conversion Rate</span>
              <span className="font-semibold">{analytics.subscriptions?.conversionRate || 0}%</span>
            </div>
            
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">Subscription Tiers</div>
              {Object.entries(analytics.subscriptions?.tierDistribution || {}).map(([tier, count]) => {
                const percentage = (analytics.subscriptions?.totalUsers || 0) > 0 
                  ? (count / (analytics.subscriptions?.totalUsers || 1) * 100) 
                  : 0
                return (
                  <div key={tier} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm capitalize">{tier}</span>
                      <span className="text-sm font-medium">{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent API Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={20} />
            Recent API Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(analytics.usage?.events || []).slice(0, 10).map((event, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    event.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <div className="font-medium capitalize">{event.api} API</div>
                    <div className="text-sm text-muted-foreground">
                      {event.action || 'API call'} • {event.durationMs}ms
                    </div>
                  </div>
                </div>
                <Badge variant={event.status === 'success' ? 'default' : 'destructive'}>
                  {event.status}
                </Badge>
              </div>
            ))}
            
            {(analytics.usage?.events || []).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No recent API activity
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warning size={20} />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">
                {analytics.health?.mongo?.connected ? '✅' : '❌'}
              </div>
              <div className="text-sm font-medium">Database</div>
              <div className="text-xs text-muted-foreground">
                {analytics.health?.mongo?.connected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold mb-2 text-green-600">
                {getSuccessRate()}%
              </div>
              <div className="text-sm font-medium">API Success Rate</div>
              <div className="text-xs text-muted-foreground">
                Last 24 hours
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold mb-2 text-blue-600">
                {(analytics.usage?.events || []).length}
              </div>
              <div className="text-sm font-medium">Recent Events</div>
              <div className="text-xs text-muted-foreground">
                In memory
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}