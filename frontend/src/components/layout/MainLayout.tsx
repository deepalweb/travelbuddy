import React, { useState, Suspense } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Header from './Header';
import Navigation from './Navigation';
import ToastContainer from '../ui/ToastContainer';
import { PageTransition } from './PageTransition';
import { HomePage, ExplorePage, TripsPage, CommunityPage, ProfilePage } from '../LazyPages';
import AuthModal from '../features/auth/AuthModal';
import MobileAppDemo from '../MobileAppDemo';
import MobileAuthIntegration from '../MobileAuthIntegration';
import { ActiveTab } from '../../types';

const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

const MainLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMobileDemo, setShowMobileDemo] = useState(false);
  const [showMobileAuth, setShowMobileAuth] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const handleTabChange = (tab: ActiveTab) => {
    if ((tab === 'trips' || tab === 'profile') && !user) {
      setShowAuthModal(true);
      return;
    }
    setActiveTab(tab);
  };

  // Show mobile demo if URL contains mobile-demo
  if (window.location.search.includes('mobile-demo')) {
    return <MobileAppDemo />;
  }

  const renderContent = () => {
    // Redirect admin to backend
    if (window.location.pathname === '/admin') {
      window.location.href = 'http://localhost:3001/admin/';
      return <div>Redirecting to admin...</div>;
    }
    
    // Check URL path for profile
    if (window.location.pathname === '/profile') {
      return <ProfilePage />;
    }
    
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'explore':
        return <ExplorePage />;
      case 'trips':
        return <TripsPage />;
      case 'community':
        return <CommunityPage />;
      case 'profile':
        return <ProfilePage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900">
      <Header />
      
      {/* Mobile Demo Button */}
      <div className="fixed top-20 right-4 z-40 flex flex-col gap-2">
        <button
          onClick={() => setShowMobileDemo(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          📱 Mobile Demo
        </button>
        <button
          onClick={() => setShowMobileAuth(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
          🔐 Mobile Auth
        </button>
      </div>
      
      <main className="pt-16 pb-20 md:pb-8">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <PageTransition transitionKey={activeTab}>
            <Suspense fallback={<LoadingSpinner />}>
              {renderContent()}
            </Suspense>
          </PageTransition>
        </div>
      </main>

      <Navigation 
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      <ToastContainer />

      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {showMobileDemo && (
        <div className="fixed inset-0 z-50">
          <MobileAppDemo />
          <button
            onClick={() => setShowMobileDemo(false)}
            className="fixed top-4 right-4 z-60 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {showMobileAuth && (
        <MobileAuthIntegration onClose={() => setShowMobileAuth(false)} />
      )}
    </div>
  );
};

export default MainLayout;