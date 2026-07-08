import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, useConfig } from './contexts/ConfigContext'
import { AppProvider } from './contexts/AppContext'
import { AuthProvider } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import ErrorBoundary from './components/ErrorBoundaryNew'
import { RouteErrorBoundary } from './components/RouteErrorBoundary'
import { LoadingScreen } from './components/LoadingScreen'
import { checkFirebaseStatus } from './utils/firebaseStatus'

const lazyNamed = <T extends React.ComponentType<any>>(
  loader: () => Promise<Record<string, T>>,
  exportName: string,
) => lazy(async () => ({ default: (await loader())[exportName] }))

const OptimizedHomePage = lazyNamed(() => import('./components/OptimizedHomePage'), 'OptimizedHomePage')
const LoginPage = lazyNamed(() => import('./pages/LoginPage'), 'LoginPage')
const RegisterPage = lazyNamed(() => import('./pages/RegisterPage'), 'RegisterPage')
const RoleSelectionPage = lazyNamed(() => import('./pages/RoleSelectionPage'), 'RoleSelectionPage')
const ProfilePage = lazyNamed(() => import('./pages/ProfilePage'), 'ProfilePage')
const DiscoveryPage = lazy(() => import('./pages/DiscoveryPage'))
const DestinationDiscoveryPage = lazy(() => import('./pages/DestinationDiscoveryPage'))
const PlaceDetailsPage = lazy(() => import('./pages/PlaceDetailsPage'))
const TripPlanningResetPage = lazyNamed(() => import('./pages/TripPlanningResetPage'), 'TripPlanningResetPage')
const SavedTripPlanRoute = lazyNamed(() => import('./pages/SavedTripPlanRoute'), 'SavedTripPlanRoute')
const TravelAgentsPage = lazyNamed(() => import('./pages/TravelAgentsPage'), 'TravelAgentsPage')
const TravelAgentRegistration = lazyNamed(() => import('./pages/TravelAgentRegistration'), 'TravelAgentRegistration')
const TransportationPage = lazyNamed(() => import('./pages/TransportationPage'), 'TransportationPage')
const TransportRegistration = lazyNamed(() => import('./pages/TransportRegistration'), 'TransportRegistration')
const TravelPreferencesPage = lazyNamed(() => import('./pages/TravelPreferencesPage'), 'TravelPreferencesPage')
const NotificationsPage = lazyNamed(() => import('./pages/NotificationsPage'), 'NotificationsPage')
const FavoritesPage = lazyNamed(() => import('./pages/FavoritesPage'), 'FavoritesPage')
const SettingsPage = lazyNamed(() => import('./pages/SettingsPage'), 'SettingsPage')
const DealsPage = lazyNamed(() => import('./pages/DealsPage'), 'DealsPage')
const CreateDealPage = lazy(() => import('./pages/CreateDealPage'))
const CommunityPage = lazyNamed(() => import('./pages/CommunityPage'), 'CommunityPage')
const EventsPage = lazyNamed(() => import('./pages/EventsPage'), 'EventsPage')
const CreateEventPage = lazyNamed(() => import('./pages/CreateEventPage'), 'CreateEventPage')
const EventOrganizerRegistration = lazyNamed(() => import('./pages/EventOrganizerRegistration'), 'EventOrganizerRegistration')
const AboutPage = lazyNamed(() => import('./pages/AboutPage'), 'AboutPage')
const ContactPage = lazyNamed(() => import('./pages/ContactPage'), 'ContactPage')
const PrivacyPolicyPage = lazyNamed(() => import('./pages/PrivacyPolicyPage'), 'PrivacyPolicyPage')
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'))
const CookiePolicyPage = lazy(() => import('./pages/CookiePolicyPage'))
const StoryDetailPage = lazyNamed(() => import('./pages/StoryDetailPage'), 'StoryDetailPage')
const SubscriptionPage = lazyNamed(() => import('./pages/SubscriptionPage'), 'SubscriptionPage')
const AdminPanel = lazyNamed(() => import('./pages/AdminPanel'), 'AdminPanel')
const NotFoundPage = lazyNamed(() => import('./pages/NotFoundPage'), 'NotFoundPage')
const AgentRegistration = lazyNamed(() => import('./pages/AgentRegistration'), 'AgentRegistration')

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
              <Suspense fallback={<LoadingScreen />}>
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
              </Suspense>
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
