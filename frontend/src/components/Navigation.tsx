import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search, Bell, Home, Compass, Tag, Users, User, LogOut, Map } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'
import { Avatar } from './Avatar'
import { Badge } from './Badge'
import { cn } from '../lib/utils'

const navItems = [
  { id: 'home', label: 'Home', icon: Home, path: '/home' },
  { id: 'discover', label: 'Discover', icon: Compass, path: '/discovery' },
  { id: 'trips', label: 'Trip Planning', icon: Map, path: '/trips' },
  { id: 'deals', label: 'Deals', icon: Tag, path: '/deals' },
  { id: 'community', label: 'Community', icon: Users, path: '/community' },
  { id: 'profile', label: 'Profile', icon: User, path: '/profile' }
]

export const TopNavigation: React.FC = () => {
  const { notifications, clearNotifications } = useApp()
  const { user, logout } = useAuth()
  
  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">TB</span>
          </div>
          <span className="font-bold text-xl text-gray-900">TravelBuddy</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Search className="w-5 h-5 text-gray-600" />
          </button>
          
          <button 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
            onClick={clearNotifications}
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {notifications > 0 && (
              <Badge 
                variant="danger" 
                className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center text-xs"
              >
                {notifications}
              </Badge>
            )}
          </button>
          
          <div className="flex items-center space-x-2">
            <Avatar 
              src={user?.profilePicture} 
              alt={user?.username}
              online={true}
              className="cursor-pointer"
            />
            <button
              onClick={logout}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export const BottomNavigation: React.FC = () => {
  const location = useLocation()
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                'flex flex-col items-center space-y-1 py-2 px-3 rounded-lg transition-colors min-w-[60px]',
                isActive 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export const SideNavigation: React.FC = () => {
  const location = useLocation()
  
  return (
    <nav className="hidden md:flex fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 flex-col p-4 z-40">
      <div className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                'flex items-center space-x-3 w-full px-4 py-3 rounded-xl transition-colors text-left',
                isActive 
                  ? 'text-primary-600 bg-primary-50 font-medium' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}