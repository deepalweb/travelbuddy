import React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  Layout,
  Users,
  Flag,
  Buildings,
  ChartBar,
  Gear,
  SignOut
} from '@phosphor-icons/react'

interface AdminSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Layout },
  { id: 'users', label: 'User Management', icon: Users },
  { id: 'content', label: 'Content Moderation', icon: Flag },
  { id: 'business', label: 'Business & Deals', icon: Buildings },
  { id: 'analytics', label: 'Analytics', icon: ChartBar },
  { id: 'settings', label: 'System Settings', icon: Gear },
]

export default function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-50">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
            TB
          </div>
          <div>
            <h2 className="font-bold text-lg">Travel Buddy</h2>
            <p className="text-sm text-muted-foreground">Admin Portal</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant={activeSection === item.id ? 'default' : 'ghost'}
              className={cn(
                'w-full justify-start gap-3 h-11',
                activeSection === item.id && 'bg-primary text-primary-foreground'
              )}
              onClick={() => onSectionChange(item.id)}
            >
              <Icon size={20} />
              {item.label}
            </Button>
          )
        })}
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <Button variant="outline" className="w-full gap-3 justify-start">
          <SignOut size={20} />
          Sign Out
        </Button>
      </div>
    </aside>
  )
}