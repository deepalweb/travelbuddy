import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Header from './Header';
import Navigation from './Navigation';
import ToastContainer from '../ui/ToastContainer';
import HomePage from '../features/home/HomePage';
import ExplorePage from '../features/explore/ExplorePage';
import TripsPage from '../features/trips/TripsPage';
import CommunityPage from '../features/community/CommunityPage';
import ProfilePage from '../features/profile/ProfilePage';
import AuthModal from '../features/auth/AuthModal';
import { ActiveTab } from '../../types';

const MainLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [showAuthModal, setShowAuthModal] = useState(false);

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

  const renderContent = () => {
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
      <Header 
        user={user}
        onAuthClick={() => setShowAuthModal(true)}
      />
      
      <main className="pt-16 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {renderContent()}
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
    </div>
  );
};

export default MainLayout;