import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, useConfig } from './contexts/ConfigContext'
import { AppProvider } from './contexts/AppContext'
import { AuthProvider } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import ErrorBoundary from './components/ErrorBoundaryNew'
import { RouteErrorBoundary } from './components/RouteErrorBoundary'
import { LoadingScreen } from './components/LoadingScreen'
import { checkFirebaseStatus } from './utils/firebaseStatus'

import { OptimizedHomePage } from './components/OptimizedHomePage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { RoleSelectionPage } from './pages/RoleSelectionPage'
import { ProfilePage } from './pages/ProfilePage'
import DiscoveryPage from './pages/DiscoveryPage'
import DestinationDiscoveryPage from './pages/DestinationDiscoveryPage'
import PlaceDetailsPage from './pages/PlaceDetailsPage'
import { TripPlanningResetPage } from './pages/TripPlanningResetPage'
import { SavedTripPlanRoute } from './pages/SavedTripPlanRoute'
import { TravelAgentsPage } from './pages/TravelAgentsPage'
import { TravelAgentRegistration } from './pages/TravelAgentRegistration'
import { TransportationPage } from './pages/TransportationPage'
import { TransportRegistration } from './pages/TransportRegistration'
import { TravelPreferencesPage } from './pages/TravelPreferencesPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { FavoritesPage } from './pages/FavoritesPage'
import { SettingsPage } from './pages/SettingsPage'
import { DealsPage } from './pages/DealsPage'
import CreateDealPage from './pages/CreateDealPage'
import { CommunityPage } from './pages/CommunityPage'
import { EventsPage } from './pages/EventsPage'
import { CreateEventPage } from './pages/CreateEventPage'
import { EventOrganizerRegistration } from './pages/EventOrganizerRegistration'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage'
import TermsOfServicePage from './pages/TermsOfServicePage'
import CookiePolicyPage from './pages/CookiePolicyPage'
import { StoryDetailPage } from './pages/StoryDetailPage'
import { SubscriptionPage } from './pages/SubscriptionPage'
import { AdminPanel } from './pages/AdminPanel'
import { NotFoundPage } from './pages/NotFoundPage'
import { AgentRegistration } from './pages/AgentRegistration'

const AppContent: React.FC = () => {
  const { config, loading, error } = useConfig()

  React.useEffect(() => {
    if (!loading && config) {
      checkFirebaseStatus()
    }
  }, [loading, config])

  if (loading) return <LoadingScreen />

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load configuration</p>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppProvider>
          <Router>
            <RouteErrorBoundary>
              <Routes>
                {/* Standalone pages — no shared layout */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/role-selection" element={<RoleSelectionPage />} />
                <Route path="/admin" element={<AdminPanel />} />

                {/* Pages with shared header/footer layout */}
                <Route element={<Layout />}>
                  <Route path="/" element={<OptimizedHomePage />} />
                  <Route path="/home" element={<OptimizedHomePage />} />
                  <Route path="/discovery" element={<DestinationDiscoveryPage />} />
                  <Route path="/trips" element={<TripPlanningResetPage />} />
                  <Route path="/trips/:id" element={<SavedTripPlanRoute />} />
                  <Route path="/places/:id" element={<PlaceDetailsPage />} />
                  <Route path="/deals" element={<DealsPage />} />
                  <Route path="/deals/create" element={<CreateDealPage />} />
                  <Route path="/community" element={<CommunityPage />} />
                  <Route path="/community/story/:id" element={<StoryDetailPage />} />
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/events/create" element={<CreateEventPage />} />
                  <Route path="/services" element={<TravelAgentsPage />} />
                  <Route path="/agents" element={<TravelAgentsPage />} />
                  <Route path="/travel-agents" element={<TravelAgentsPage />} />
                  <Route path="/travel-agent-registration" element={<TravelAgentRegistration />} />
                  <Route path="/travel-agent-registration/:id" element={<TravelAgentRegistration />} />
                  <Route path="/agent-registration" element={<AgentRegistration />} />
                  <Route path="/transport" element={<TransportationPage />} />
                  <Route path="/transportation" element={<TransportationPage />} />
                  <Route path="/transport-registration" element={<TransportRegistration />} />
                  <Route path="/event-organizer-registration" element={<EventOrganizerRegistration />} />
                  <Route path="/subscription" element={<SubscriptionPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/preferences" element={<TravelPreferencesPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/favorites" element={<FavoritesPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms-of-service" element={<TermsOfServicePage />} />
                  <Route path="/cookie-policy" element={<CookiePolicyPage />} />

                  {/* Legacy redirects */}
                  <Route path="/compare" element={<Navigate to="/trips" replace />} />
                  <Route path="/prepare" element={<Navigate to="/trips" replace />} />
                  <Route path="/places" element={<Navigate to="/trips" replace />} />
                  <Route path="/saved-plans" element={<Navigate to="/trips?view=saved" replace />} />
                  <Route path="/trips/saved" element={<Navigate to="/trips?view=saved" replace />} />

                  <Route path="*" element={<DiscoveryPage />} />
                </Route>

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </RouteErrorBoundary>
          </Router>
        </AppProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ConfigProvider>
        <AppContent />
      </ConfigProvider>
    </ErrorBoundary>
  )
}

export default App
