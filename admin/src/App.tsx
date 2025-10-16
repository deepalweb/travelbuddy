import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  MapPin, 
  CurrencyDollar, 
  Flag, 
  TrendUp, 
  Gear,
  Bell,
  MagnifyingGlass,
  Funnel,
  DotsThreeOutline,
  UserCheck,
  Warning,
  Eye,
  ChatCircle
} from '@phosphor-icons/react'
import AdminSidebar from '@/components/AdminSidebar'
import DashboardOverview from '@/components/DashboardOverview'
import UserManagement from '@/components/UserManagement'
import ContentModeration from '@/components/ContentModeration'
import BusinessManagement from '@/components/BusinessManagement'
import AnalyticsHub from '@/components/AnalyticsHub'
import SystemSettings from '@/components/SystemSettings'
import ErrorBoundary from '@/components/ErrorBoundary'

function App() {
  const [activeSection, setActiveSection] = useState('dashboard')

  const renderActiveSection = () => {
    const getComponent = () => {
      switch (activeSection) {
        case 'dashboard':
          return <DashboardOverview />
        case 'users':
          return <UserManagement />
        case 'content':
          return <ContentModeration />
        case 'business':
          return <BusinessManagement />
        case 'analytics':
          return <AnalyticsHub />
        case 'settings':
          return <SystemSettings />
        default:
          return <DashboardOverview />
      }
    }
    
    return (
      <ErrorBoundary>
        {getComponent()}
      </ErrorBoundary>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      
      <main className="flex-1 ml-64">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Travel Buddy Admin</h1>
              <p className="text-sm text-muted-foreground">
                Manage your travel platform with confidence
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" className="gap-2">
                <Bell size={16} />
                <Badge variant="destructive" className="h-5 w-5 p-0 text-xs">3</Badge>
              </Button>
              
              <div className="flex items-center gap-3 pl-4 border-l">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  A
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Admin User</p>
                  <p className="text-xs text-muted-foreground">Super Admin</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {renderActiveSection()}
        </div>
      </main>
    </div>
  )
}

export default App