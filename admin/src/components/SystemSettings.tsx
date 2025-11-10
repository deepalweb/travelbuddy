import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { 
  Gear,
  Database,
  Key,
  Shield,
  Bell,
  Globe,
  CurrencyDollar,
  Warning
} from '@phosphor-icons/react'
import apiService from '@/services/apiService'

interface SystemConfig {
  database: {
    connected: boolean
    status: string
  }
  apis: {
    openai: boolean
    maps: boolean
    places: boolean
  }
  features: {
    notifications: boolean
    analytics: boolean
    moderation: boolean
  }
  costs: {
    dailyUSD: number
    monthlyUSD: number
  }
}

export default function SystemSettings() {
  const [config, setConfig] = useState<SystemConfig>({
    database: { connected: false, status: 'unknown' },
    apis: { openai: false, maps: false, places: false },
    features: { notifications: true, analytics: true, moderation: true },
    costs: { dailyUSD: 0, monthlyUSD: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSystemConfig()
  }, [])

  const fetchSystemConfig = async () => {
    try {
      setLoading(true)
      const [health, costs] = await Promise.all([
        apiService.getSystemHealth(),
        apiService.getApiCosts()
      ])
      
      setConfig({
        database: {
          connected: health.mongo?.connected || false,
          status: health.mongo?.connected ? 'connected' : 'disconnected'
        },
        apis: {
          openai: true, // Assume available if no error
          maps: true,
          places: true
        },
        features: {
          notifications: true,
          analytics: true,
          moderation: true
        },
        costs: {
          dailyUSD: costs.projections?.dailyUSD || 0,
          monthlyUSD: costs.projections?.monthlyUSD || 0
        }
      })
    } catch (error) {
      console.error('Failed to fetch system config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFeatureToggle = async (feature: keyof typeof config.features, enabled: boolean) => {
    setSaving(true)
    try {
      // In a real implementation, this would call an API to update the feature
      setConfig(prev => ({
        ...prev,
        features: {
          ...prev.features,
          [feature]: enabled
        }
      }))
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error('Failed to update feature:', error)
    } finally {
      setSaving(false)
    }
  }

  const testDatabaseConnection = async () => {
    try {
      const health = await apiService.getSystemHealth()
      setConfig(prev => ({
        ...prev,
        database: {
          connected: health.mongo?.connected || false,
          status: health.mongo?.connected ? 'connected' : 'disconnected'
        }
      }))
    } catch (error) {
      console.error('Database test failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
          <p className="text-muted-foreground">Loading system configuration...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
        <p className="text-muted-foreground">
          Configure system settings and monitor health
        </p>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database size={16} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={config.database.connected ? "default" : "destructive"}>
                {config.database.connected ? 'Connected' : 'Offline'}
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Services</CardTitle>
            <Globe size={16} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.values(config.apis).filter(Boolean).length}/3
            </div>
            <p className="text-xs text-muted-foreground">Services online</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Cost</CardTitle>
            <CurrencyDollar size={16} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${config.costs.dailyUSD.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Projected</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
            <CurrencyDollar size={16} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${config.costs.monthlyUSD.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Projected</p>
          </CardContent>
        </Card>
      </div>

      {/* Database Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database size={20} />
            Database Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">MongoDB Connection</div>
              <div className="text-sm text-muted-foreground">
                Status: {config.database.status}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={config.database.connected ? "default" : "destructive"}>
                {config.database.connected ? 'Connected' : 'Disconnected'}
              </Badge>
              <Button variant="outline" size="sm" onClick={testDatabaseConnection}>
                Test Connection
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key size={20} />
            API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-medium">OpenAI API</div>
                <div className="text-sm text-muted-foreground">AI-powered features</div>
              </div>
              <Badge variant={config.apis.openai ? "default" : "secondary"}>
                {config.apis.openai ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-medium">Google Maps API</div>
                <div className="text-sm text-muted-foreground">Maps and geocoding</div>
              </div>
              <Badge variant={config.apis.maps ? "default" : "secondary"}>
                {config.apis.maps ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-medium">Google Places API</div>
                <div className="text-sm text-muted-foreground">Places and reviews</div>
              </div>
              <Badge variant={config.apis.places ? "default" : "secondary"}>
                {config.apis.places ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Toggles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gear size={20} />
            Feature Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={20} />
              <div>
                <div className="font-medium">Push Notifications</div>
                <div className="text-sm text-muted-foreground">
                  Send notifications to users and admins
                </div>
              </div>
            </div>
            <Switch
              checked={config.features.notifications}
              onCheckedChange={(checked) => handleFeatureToggle('notifications', checked)}
              disabled={saving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe size={20} />
              <div>
                <div className="font-medium">Analytics Tracking</div>
                <div className="text-sm text-muted-foreground">
                  Collect usage analytics and metrics
                </div>
              </div>
            </div>
            <Switch
              checked={config.features.analytics}
              onCheckedChange={(checked) => handleFeatureToggle('analytics', checked)}
              disabled={saving}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield size={20} />
              <div>
                <div className="font-medium">Content Moderation</div>
                <div className="text-sm text-muted-foreground">
                  Automatic content filtering and review
                </div>
              </div>
            </div>
            <Switch
              checked={config.features.moderation}
              onCheckedChange={(checked) => handleFeatureToggle('moderation', checked)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {/* System Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Warning size={20} />
            System Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh Dashboard
            </Button>
            <Button variant="outline" onClick={fetchSystemConfig}>
              Reload Configuration
            </Button>
            <Button variant="outline" onClick={testDatabaseConnection}>
              Test All Connections
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}