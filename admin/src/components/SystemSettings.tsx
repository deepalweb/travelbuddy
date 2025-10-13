import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Gear,
  Key,
  Database,
  Bell,
  Shield,
  ClockCounterClockwise,
  Palette,
  Globe,
  Warning,
  CheckCircle,
  Eye,
  EyeSlash,
  Broadcast,
  Trash,
  Download,
  ArrowCounterClockwise,
  Users
} from '@phosphor-icons/react'
import { useKV } from '@github/spark/hooks'

interface AppConfig {
  theme: string
  defaultLanguage: string
  timezone: string
  maintenanceMode: boolean
  registrationEnabled: boolean
  emailVerificationRequired: boolean
}

interface APIKey {
  id: string
  name: string
  service: string
  masked: string
  lastUsed: string
  status: 'active' | 'inactive' | 'expired'
}

interface AuditLog {
  id: string
  user: string
  action: string
  resource: string
  timestamp: string
  details: string
  ipAddress: string
}

interface Permission {
  id: string
  role: string
  module: string
  permissions: string[]
}

interface UserRole {
  id: string
  name: string
  description: string
  permissions: string[]
  userCount: number
  color: string
}

export default function SystemSettings() {
  const [appConfig, setAppConfig] = useKV<AppConfig>('system-app-config', {
    theme: 'light',
    defaultLanguage: 'en',
    timezone: 'UTC',
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true
  })

  const [apiKeys, setApiKeys] = useKV<APIKey[]>('system-api-keys', [
    {
      id: '1',
      name: 'Google Maps API',
      service: 'maps',
      masked: '••••••••••••gh7k',
      lastUsed: '2024-01-15 14:30',
      status: 'active'
    },
    {
      id: '2',
      name: 'OpenWeather API',
      service: 'weather',
      masked: '••••••••••••m9p2',
      lastUsed: '2024-01-14 09:15',
      status: 'active'
    },
    {
      id: '3',
      name: 'OpenAI API',
      service: 'ai',
      masked: '••••••••••••x4n8',
      lastUsed: '2024-01-13 16:45',
      status: 'inactive'
    }
  ])

  const [auditLogs] = useKV<AuditLog[]>('system-audit-logs', [
    {
      id: '1',
      user: 'admin@travel.com',
      action: 'USER_SUSPENDED',
      resource: 'user:john.doe@email.com',
      timestamp: '2024-01-15 14:30:22',
      details: 'User suspended for policy violation',
      ipAddress: '192.168.1.100'
    },
    {
      id: '2',
      user: 'admin@travel.com',
      action: 'API_KEY_CREATED',
      resource: 'api-key:weather-service',
      timestamp: '2024-01-15 14:25:15',
      details: 'New API key generated for weather service',
      ipAddress: '192.168.1.100'
    },
    {
      id: '3',
      user: 'mod@travel.com',
      action: 'CONTENT_DELETED',
      resource: 'post:12345',
      timestamp: '2024-01-15 14:20:45',
      details: 'Inappropriate content removed',
      ipAddress: '192.168.1.101'
    }
  ])

  const [permissions, setPermissions] = useKV<Permission[]>('system-permissions', [
    {
      id: '1',
      role: 'Super Admin',
      module: 'All Modules',
      permissions: ['create', 'read', 'update', 'delete', 'manage']
    },
    {
      id: '2',
      role: 'Content Moderator',
      module: 'Content Management',
      permissions: ['read', 'update', 'delete']
    },
    {
      id: '3',
      role: 'Support Agent',
      module: 'User Management',
      permissions: ['read', 'update']
    }
  ])

  const [userRoles, setUserRoles] = useKV<UserRole[]>('system-user-roles', [
    {
      id: '1',
      name: 'Super Admin',
      description: 'Full access to all modules and settings',
      permissions: [
        'Manage all users and accounts',
        'Access all modules and settings',
        'Create and modify system configurations',
        'View and export all data',
        'Manage user roles and permissions'
      ],
      userCount: 2,
      color: 'bg-red-500'
    },
    {
      id: '2',
      name: 'Moderator',
      description: 'Manage users, community posts, and reported content',
      permissions: [
        'Manage user accounts (suspend, activate)',
        'Moderate community posts and reviews',
        'Handle reported content and disputes',
        'View user analytics and reports',
        'Send notifications to users'
      ],
      userCount: 8,
      color: 'bg-orange-500'
    },
    {
      id: '3',
      name: 'Content Manager',
      description: 'Manage places, deals, and trips',
      permissions: [
        'Create and edit travel destinations',
        'Manage deals and promotions',
        'Curate featured trips and experiences',
        'Upload and organize media content',
        'Manage business partnerships'
      ],
      userCount: 5,
      color: 'bg-blue-500'
    },
    {
      id: '4',
      name: 'Business Partner',
      description: 'Manage their own deals and analytics',
      permissions: [
        'Create and manage own business deals',
        'View analytics for own listings',
        'Update business profile and information',
        'Respond to customer reviews',
        'Access partner dashboard'
      ],
      userCount: 42,
      color: 'bg-green-500'
    },
    {
      id: '5',
      name: 'Support Agent',
      description: 'View users and assist with issues (no edit rights)',
      permissions: [
        'View user profiles and history',
        'Access support ticket system',
        'View transaction and booking details',
        'Send messages to users',
        'Escalate issues to moderators'
      ],
      userCount: 12,
      color: 'bg-purple-500'
    }
  ])

  const [showApiKey, setShowApiKey] = useState<string | null>(null)
  const [newApiKey, setNewApiKey] = useState({ name: '', service: '', key: '' })
  const [notificationMessage, setNotificationMessage] = useState('')
  const [cacheStatus, setCacheStatus] = useState({
    lastRefresh: '2024-01-15 14:30:00',
    size: '2.4 GB',
    entries: '45,672'
  })

  const handleAppConfigChange = (key: keyof AppConfig, value: any) => {
    setAppConfig(current => {
      if (!current) {
        return {
          theme: 'light',
          defaultLanguage: 'en',
          timezone: 'UTC',
          maintenanceMode: false,
          registrationEnabled: true,
          emailVerificationRequired: true,
          [key]: value
        }
      }
      return { ...current, [key]: value }
    })
  }

  const handleAddApiKey = () => {
    if (newApiKey.name && newApiKey.service && newApiKey.key) {
      const apiKey: APIKey = {
        id: Date.now().toString(),
        name: newApiKey.name,
        service: newApiKey.service,
        masked: '••••••••••••' + newApiKey.key.slice(-4),
        lastUsed: 'Never',
        status: 'active'
      }
      setApiKeys(current => current ? [...current, apiKey] : [apiKey])
      setNewApiKey({ name: '', service: '', key: '' })
    }
  }

  const handleDeleteApiKey = (id: string) => {
    setApiKeys(current => current ? current.filter(key => key.id !== id) : [])
  }

  const handleBroadcastNotification = () => {
    if (notificationMessage.trim()) {
      alert(`Broadcasting notification: ${notificationMessage}`)
      setNotificationMessage('')
    }
  }

  const handleCacheRefresh = () => {
    setCacheStatus({
      lastRefresh: new Date().toLocaleString(),
      size: '2.4 GB',
      entries: '45,672'
    })
    alert('Cache refreshed successfully!')
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
        <p className="text-muted-foreground">
          Configure platform settings and system parameters
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Gear size={16} />
            General
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Key size={16} />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="cache" className="flex items-center gap-2">
            <Database size={16} />
            Cache
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell size={16} />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield size={16} />
            User Roles
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <ClockCounterClockwise size={16} />
            Audit Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette size={20} />
                App Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="theme">Default Theme</Label>
                  <Select value={appConfig?.theme || 'light'} onValueChange={(value) => handleAppConfigChange('theme', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Default Language</Label>
                  <Select value={appConfig?.defaultLanguage || 'en'} onValueChange={(value) => handleAppConfigChange('defaultLanguage', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Default Timezone</Label>
                  <Select value={appConfig?.timezone || 'UTC'} onValueChange={(value) => handleAppConfigChange('timezone', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">Eastern Time</SelectItem>
                      <SelectItem value="PST">Pacific Time</SelectItem>
                      <SelectItem value="CET">Central European Time</SelectItem>
                      <SelectItem value="JST">Japan Standard Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">System Controls</h4>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h5 className="font-medium">Maintenance Mode</h5>
                    <p className="text-sm text-muted-foreground">
                      Temporarily disable the platform for maintenance
                    </p>
                  </div>
                  <Switch
                    checked={appConfig?.maintenanceMode || false}
                    onCheckedChange={(checked) => handleAppConfigChange('maintenanceMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h5 className="font-medium">User Registration</h5>
                    <p className="text-sm text-muted-foreground">
                      Allow new users to register accounts
                    </p>
                  </div>
                  <Switch
                    checked={appConfig?.registrationEnabled || false}
                    onCheckedChange={(checked) => handleAppConfigChange('registrationEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h5 className="font-medium">Email Verification Required</h5>
                    <p className="text-sm text-muted-foreground">
                      Require email verification for new accounts
                    </p>
                  </div>
                  <Switch
                    checked={appConfig?.emailVerificationRequired || false}
                    onCheckedChange={(checked) => handleAppConfigChange('emailVerificationRequired', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key size={20} />
                API Keys Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/50">
                <Input
                  placeholder="API Key Name"
                  value={newApiKey.name}
                  onChange={(e) => setNewApiKey(prev => ({ ...prev, name: e.target.value }))}
                />
                <Select value={newApiKey.service} onValueChange={(value) => setNewApiKey(prev => ({ ...prev, service: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maps">Maps</SelectItem>
                    <SelectItem value="weather">Weather</SelectItem>
                    <SelectItem value="ai">AI</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="API Key"
                  type="password"
                  value={newApiKey.key}
                  onChange={(e) => setNewApiKey(prev => ({ ...prev, key: e.target.value }))}
                />
                <Button onClick={handleAddApiKey} className="w-full">
                  Add Key
                </Button>
              </div>

              <div className="space-y-4">
                {(apiKeys || []).map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium">{key.name}</h4>
                        <Badge variant={key.status === 'active' ? 'default' : 'secondary'}>
                          {key.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Service: {key.service}</span>
                        <span>Last used: {key.lastUsed}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="px-2 py-1 bg-muted rounded text-sm">
                          {showApiKey === key.id ? key.masked.replace(/•/g, 'x') : key.masked}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowApiKey(showApiKey === key.id ? null : key.id)}
                        >
                          {showApiKey === key.id ? <EyeSlash size={16} /> : <Eye size={16} />}
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteApiKey(key.id)}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cache" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database size={20} />
                Content Cache Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <h4 className="text-2xl font-bold text-primary">{cacheStatus.size}</h4>
                  <p className="text-sm text-muted-foreground">Total Cache Size</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h4 className="text-2xl font-bold text-primary">{cacheStatus.entries}</h4>
                  <p className="text-sm text-muted-foreground">Cache Entries</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <h4 className="text-sm font-medium">{cacheStatus.lastRefresh}</h4>
                  <p className="text-sm text-muted-foreground">Last Refresh</p>
                </div>
              </div>

              <Alert>
                <Warning className="h-4 w-4" />
                <AlertTitle>Cache Refresh</AlertTitle>
                <AlertDescription>
                  Refreshing the cache will temporarily slow down the application while content is reloaded.
                </AlertDescription>
              </Alert>

              <div className="flex gap-4">
                <Button onClick={handleCacheRefresh} className="flex items-center gap-2">
                  <ArrowCounterClockwise size={16} />
                  Refresh All Cache
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Download size={16} />
                  Download Cache Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Broadcast size={20} />
                Notification Broadcast System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notification-message">Broadcast Message</Label>
                  <Textarea
                    id="notification-message"
                    placeholder="Enter your notification message..."
                    value={notificationMessage}
                    onChange={(e) => setNotificationMessage(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="flex gap-4">
                  <Button onClick={handleBroadcastNotification} className="flex items-center gap-2">
                    <Broadcast size={16} />
                    Send to All Users
                  </Button>
                  <Button variant="outline">
                    Schedule for Later
                  </Button>
                  <Button variant="outline">
                    Preview Message
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Recent Broadcasts</h4>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">System maintenance scheduled</span>
                      <span className="text-sm text-muted-foreground">2 hours ago</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sent to 15,234 users
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">New feature announcement</span>
                      <span className="text-sm text-muted-foreground">1 day ago</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sent to 15,234 users
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield size={20} />
                  User Roles & Permissions
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage user roles and their associated permissions across the platform
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  {(userRoles || []).map((role) => (
                    <div key={role.id} className="p-6 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${role.color}`}></div>
                          <div>
                            <h3 className="text-lg font-semibold">{role.name}</h3>
                            <p className="text-sm text-muted-foreground">{role.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Users size={12} />
                            {role.userCount} users
                          </Badge>
                          <Button variant="outline" size="sm">
                            Edit Role
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Permissions:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {role.permissions.map((permission, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                              <span>{permission}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button className="flex items-center gap-2">
                    <Shield size={16} />
                    Create New Role
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download size={16} />
                    Export Role Matrix
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key size={20} />
                  Permission Matrix
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Overview of module access permissions by role
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {(permissions || []).map((permission) => (
                    <div key={permission.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{permission.role}</h4>
                          <p className="text-sm text-muted-foreground">{permission.module}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Edit Permissions
                        </Button>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {permission.permissions.map((perm) => (
                          <Badge key={perm} variant="secondary">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <Button className="w-full" variant="outline">
                  Add New Permission Set
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClockCounterClockwise size={20} />
                Audit Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Input placeholder="Search logs..." className="flex-1" />
                  <Select defaultValue="all">
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="user">User Actions</SelectItem>
                      <SelectItem value="content">Content Actions</SelectItem>
                      <SelectItem value="system">System Actions</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">
                    Export Logs
                  </Button>
                </div>

                <div className="space-y-3">
                  {(auditLogs || []).map((log) => (
                    <div key={log.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{log.action}</Badge>
                          <span className="font-medium">{log.user}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{log.timestamp}</span>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>Resource:</strong> {log.resource}</p>
                        <p><strong>Details:</strong> {log.details}</p>
                        <p><strong>IP Address:</strong> {log.ipAddress}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}