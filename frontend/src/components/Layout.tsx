import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { MainHeader } from './MainHeader'
import { Footer } from './Footer'
import { NewHomePage } from './NewHomePage'
import { ProfilePage } from '../pages/ProfilePage'
import DiscoveryPage from '../pages/DiscoveryPage'
import PlaceDetailsPage from '../pages/PlaceDetailsPage'
import { TripPlanningPage } from '../pages/TripPlanningPage'
import { TripDetailPage } from '../pages/TripDetailPage'
import { TravelAgentsPage } from '../pages/TravelAgentsPage'
import { TransportationPage } from '../pages/TransportationPage'
import { TravelPreferencesPage } from '../pages/TravelPreferencesPage'
import { NotificationsPage } from '../pages/NotificationsPage'
import { SettingsPage } from '../pages/SettingsPage'
import { DealsPage } from '../pages/DealsPage'
import { CommunityPage } from '../pages/CommunityPage'
import { useApp } from '../contexts/AppContext'
import { useAuth } from '../contexts/AuthContext'

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600">Coming soon...</p>
    </div>
  </div>
)

export const Layout: React.FC = () => {
  const { currentPage } = useApp()
  const { user, isLoading, logout } = useAuth()
  const location = useLocation()
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }
  
  // Redirect authenticated users away from login/register to home
  if (user && (location.pathname === '/login' || location.pathname === '/register')) {
    return <Navigate to="/" replace />
  }
  
  const renderPage = () => {
    // Check if it's a place details route
    if (location.pathname.startsWith('/places/')) {
      return <PlaceDetailsPage />
    }
    
    // Check if it's a trip details route
    if (location.pathname.startsWith('/trips/') && location.pathname !== '/trips') {
      return <TripDetailPage />
    }
    
    // Use URL path instead of currentPage state
    switch (location.pathname) {
      case '/':
      case '/home':
        return <NewHomePage />
      case '/discovery':
        return <DiscoveryPage />
      case '/trips':
        return <TripPlanningPage />
      case '/services':
      case '/agents':
        return <TravelAgentsPage />
      case '/transport':
        return <TransportationPage />
      case '/deals':
        return <DealsPage />
      case '/community':
        return <CommunityPage />
      case '/profile':
        return <ProfilePage />
      case '/preferences':
        return <TravelPreferencesPage />
      case '/notifications':
        return <NotificationsPage />
      case '/settings':
        return <SettingsPage />
      default:
        return <DiscoveryPage /> // Default to discovery page
    }
  }
  
  // For place and trip details pages, use full layout without sidebar
  if (location.pathname.startsWith('/places/') || (location.pathname.startsWith('/trips/') && location.pathname !== '/trips')) {
    return (
      <div className="min-h-screen bg-gray-50">
        {renderPage()}
      </div>
    )
  }
  
  return (
    <div className="min-h-screen">
      <MainHeader />
      
      <main className="pt-16 lg:pt-20">
        {renderPage()}
      </main>
      
      <Footer />
    </div>
  )
}