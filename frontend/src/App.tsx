import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ConfigProvider, useConfig } from './contexts/ConfigContext'
import { AppProvider } from './contexts/AppContext'
import { AuthProvider } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { TripDetailPage } from './pages/TripDetailPage'
import PlaceDetailsPage from './pages/PlaceDetailsPage'
import { AgentRegistration } from './pages/AgentRegistration'

import { StoryDetailPage } from './pages/StoryDetailPage'
import { LoadingScreen } from './components/LoadingScreen'
import { RoleSelectionPage } from './pages/RoleSelectionPage'
import { TransportRegistration } from './pages/TransportRegistration'
import { TransportationPage } from './pages/TransportationPage'
import { TravelAgentRegistration } from './pages/TravelAgentRegistration'
import { TravelAgentsPage } from './pages/TravelAgentsPage'
import { SubscriptionPage } from './pages/SubscriptionPage'
import { EventOrganizerRegistration } from './pages/EventOrganizerRegistration'
import { CreateEventPage } from './pages/CreateEventPage'
import { checkFirebaseStatus } from './utils/firebaseStatus'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import TermsOfServicePage from './pages/TermsOfServicePage'
import { NotFoundPage } from './pages/NotFoundPage'
import ComprehensiveAdmin from './pages/ComprehensiveAdmin'

const AppContent: React.FC = () => {
  const { config, loading, error } = useConfig()

  // Check Firebase status on app load
  React.useEffect(() => {
    if (!loading && config) {
      checkFirebaseStatus()
    }
  }, [loading, config])

  if (loading) {
    return <LoadingScreen />
  }

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
    <AuthProvider>
      <AppProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms-of-service" element={<TermsOfServicePage />} />
            <Route path="/role-selection" element={<RoleSelectionPage />} />
            <Route path="/travel-agent-registration" element={<TravelAgentRegistration />} />
            <Route path="/travel-agent-registration/:id" element={<TravelAgentRegistration />} />
            <Route path="/travel-agents" element={<TravelAgentsPage />} />
            <Route path="/event-organizer-registration" element={<EventOrganizerRegistration />} />
            <Route path="/events/create" element={<CreateEventPage />} />
            <Route path="/transport-registration" element={<TransportRegistration />} />
            <Route path="/transportation" element={<TransportationPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/trips/:id" element={<TripDetailPage />} />
            <Route path="/places/:id" element={<PlaceDetailsPage />} />
            <Route path="/community/story/:id" element={<StoryDetailPage />} />
            <Route path="/admin" element={<ComprehensiveAdmin />} />

            <Route path="/*" element={<Layout />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </AppProvider>
    </AuthProvider>
  )
}

function App() {
  return (
    <ConfigProvider>
      <AppContent />
    </ConfigProvider>
  )
}

export default App
