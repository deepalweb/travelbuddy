import React, { useState } from 'react';
import MobileAppLayout from './MobileAppLayout';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { LanguageProvider } from '../contexts/LanguageContext';

const MobileAppDemo: React.FC = () => {
  const [showDemo, setShowDemo] = useState(false);

  if (!showDemo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Travel Buddy Mobile Web App
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
              Experience the full mobile app functionality in your web browser. 
              Complete with authentication, profile management, and mobile-optimized UI.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">🔐 Authentication Features</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• Google Sign-In integration</li>
                  <li>• Email/Password authentication</li>
                  <li>• Mobile-optimized login flow</li>
                  <li>• Secure user session management</li>
                </ul>
              </div>
              
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">👤 Profile Management</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• Comprehensive user profiles</li>
                  <li>• Travel style preferences</li>
                  <li>• Statistics and insights</li>
                  <li>• Social features (followers/following)</li>
                </ul>
              </div>
              
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">📱 Mobile Experience</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• Touch-optimized interface</li>
                  <li>• Bottom navigation bar</li>
                  <li>• Swipe gestures support</li>
                  <li>• Progressive Web App features</li>
                </ul>
              </div>
              
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">⚙️ Settings & Preferences</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li>• Dark/Light theme toggle</li>
                  <li>• Multi-language support</li>
                  <li>• Notification preferences</li>
                  <li>• Privacy controls</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                🚀 What's New in This Implementation
              </h3>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                This web app now includes all the authentication and profile features from the mobile app, 
                providing a seamless cross-platform experience. Users can sign in with Google or email, 
                manage their profiles, view travel statistics, and customize their preferences.
              </p>
            </div>

            <button
              onClick={() => setShowDemo(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Launch Mobile Web App
            </button>
          </div>

          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Best experienced on mobile devices or with browser developer tools in mobile view
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <ToastProvider>
            <div className="relative">
              {/* Exit Demo Button */}
              <button
                onClick={() => setShowDemo(false)}
                className="fixed top-4 right-4 z-50 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
                title="Exit Demo"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <MobileAppLayout />
            </div>
          </ToastProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default MobileAppDemo;