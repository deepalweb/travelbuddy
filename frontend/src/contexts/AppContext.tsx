import React, { createContext, useContext, useState, ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface User {
  id: string
  name: string
  avatar: string
  location: string
  travelStyle: string
  email?: string
  tier?: string
}

interface AppContextType {
  user: User
  notifications: number
  currentPage: string
  setCurrentPage: (page: string) => void
  addNotification: () => void
  clearNotifications: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState('home')
  const [notifications, setNotifications] = useState(3)
  const { user: authUser } = useAuth()

  const user: User = {
    id: authUser?.id || '1',
    name: authUser?.username || 'Traveler',
    avatar: authUser?.profilePicture || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    location: 'Current Location',
    travelStyle: 'Explorer',
    email: authUser?.email,
    tier: authUser?.tier
  }

  const addNotification = () => setNotifications(prev => prev + 1)
  const clearNotifications = () => setNotifications(0)

  return (
    <AppContext.Provider value={{
      user,
      notifications,
      currentPage,
      setCurrentPage,
      addNotification,
      clearNotifications
    }}>
      {children}
    </AppContext.Provider>
  )
}
