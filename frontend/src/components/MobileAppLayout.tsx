import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MobileAuthScreen from './MobileAuthScreen';
import EnhancedProfileView from './EnhancedProfileView';
import MobileBottomNavigation, { defaultNavigationItems } from './MobileBottomNavigation';

interface MobileAppLayoutProps {
  children?: React.ReactNode;
}

const MobileAppLayout: React.FC<MobileAppLayoutProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [showAuthScreen, setShowAuthScreen] = useState(false);

  useEffect(() => {
    // Show auth screen if user is not authenticated
    if (!loading && !user) {
      setShowAuthScreen(true);
    } else if (user) {
      setShowAuthScreen(false);
    }
  }, [user, loading]);

  const handleAuthSuccess = () => {
    setShowAuthScreen(false);
    setActiveTab('home');
  };

  const renderActiveView = () => {
    if (children) {
      return children;
    }

    switch (activeTab) {
      case 'home':
        return (
          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">For You</h2>
            <p className="text-gray-600 dark:text-gray-400">Personalized travel recommendations</p>
          </div>
        );
      case 'places':
        return (
          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Places</h2>
            <p className="text-gray-600 dark:text-gray-400">Discover amazing destinations</p>
          </div>
        );
      case 'deals':
        return (
          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Deals</h2>
            <p className="text-gray-600 dark:text-gray-400">Special offers and discounts</p>
          </div>
        );
      case 'planner':
        return (
          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Trip Planner</h2>
            <p className="text-gray-600 dark:text-gray-400">Plan your perfect journey</p>
          </div>
        );
      case 'community':
        return (
          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Community</h2>
            <p className="text-gray-600 dark:text-gray-400">Connect with fellow travelers</p>
          </div>
        );
      case 'profile':
        return <EnhancedProfileView />;
      default:
        return (
          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">For You</h2>
            <p className="text-gray-600 dark:text-gray-400">Personalized travel recommendations</p>
          </div>
        );
    }
  };

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading Travel Buddy...</p>
        </div>
      </div>
    );
  }

  // Show auth screen if not authenticated
  if (showAuthScreen || !user) {
    return <MobileAuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 safe-area-pt">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Travel Buddy
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-7a3 3 0 00-3-3H4a3 3 0 00-3 3v7z" />
              </svg>
            </button>

            {/* Search */}
            <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pb-20">
        {renderActiveView()}
      </div>

      {/* Bottom Navigation */}
      <MobileBottomNavigation
        items={defaultNavigationItems}
        activeItem={activeTab}
        onItemSelect={setActiveTab}
      />

      {/* Safe Area Styles */}
      <style jsx global>{`
        .safe-area-pt {
          padding-top: env(safe-area-inset-top);
        }
        .safe-area-pb {
          padding-bottom: env(safe-area-inset-bottom);
        }
        
        /* Hide scrollbar for mobile */
        @media (max-width: 768px) {
          ::-webkit-scrollbar {
            display: none;
          }
          * {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        }
        
        /* Mobile-specific optimizations */
        @media (max-width: 768px) {
          body {
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: none;
          }
          
          /* Prevent zoom on input focus */
          input, select, textarea {
            font-size: 16px !important;
          }
          
          /* Smooth scrolling */
          html {
            scroll-behavior: smooth;
          }
        }
        
        /* Touch-friendly tap targets */
        button, a, [role="button"] {
          min-height: 44px;
          min-width: 44px;
        }
        
        /* Prevent text selection on UI elements */
        .no-select {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        
        /* Loading animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.3s ease-out;
        }
        
        /* Pull to refresh indicator */
        .pull-to-refresh {
          transform: translateY(-100%);
          transition: transform 0.3s ease;
        }
        
        .pull-to-refresh.active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default MobileAppLayout;