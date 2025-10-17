import React, { useState } from 'react';
import MobileAuthScreen from './MobileAuthScreen';
import EnhancedProfileView from './EnhancedProfileView';
import { useAuth } from '../../contexts/AuthContext';

interface MobileAuthIntegrationProps {
  onClose?: () => void;
}

const MobileAuthIntegration: React.FC<MobileAuthIntegrationProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [view, setView] = useState<'auth' | 'profile'>('auth');

  const handleAuthSuccess = () => {
    setView('profile');
  };

  const handleBackToAuth = () => {
    setView('auth');
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {view === 'auth' ? 'Mobile Authentication' : 'Enhanced Profile'}
          </h2>
          <div className="flex items-center gap-2">
            {view === 'profile' && (
              <button
                onClick={handleBackToAuth}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                title="Back to Auth"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {view === 'auth' ? (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Mobile-Style Authentication
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Experience the same authentication flow as the mobile app, with Google Sign-In and email/password options.
                </p>
              </div>
              
              <MobileAuthScreen 
                onAuthSuccess={handleAuthSuccess}
                initialView="login"
              />
            </div>
          ) : (
            <div className="h-full">
              <EnhancedProfileView />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {view === 'auth' ? 'Mobile Auth Demo' : 'Enhanced Profile Demo'}
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-green-600 dark:text-green-400 text-xs">Live Demo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileAuthIntegration;