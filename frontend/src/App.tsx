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
import { AdminLayout } from './components/AdminLayout'
import { AdminDashboard } from './pages/AdminDashboard'
import { AgentRegistration } from './pages/AgentRegistration'
import { TravelAgents } from './pages/TravelAgents'
import { StoryDetailPage } from './pages/StoryDetailPage'
import { LoadingScreen } from './components/LoadingScreen'

const AppContent: React.FC = () => {
  const { config, loading, error } = useConfig()

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
            <Route path="/travel-agents" element={<TravelAgents />} />
            <Route path="/agent-registration" element={<AgentRegistration />} />
            <Route path="/trips/:id" element={<TripDetailPage />} />
            <Route path="/places/:id" element={<PlaceDetailsPage />} />
            <Route path="/community/story/:id" element={<StoryDetailPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/*" element={<AdminLayout />} />
            <Route path="/*" element={<Layout />} />
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