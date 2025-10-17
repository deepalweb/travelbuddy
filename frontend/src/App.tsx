import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ToastProvider } from './contexts/ToastContext';
import MainLayout from './components/layout/MainLayout';
import { pwaManager, NotificationManager, deviceUtils } from '../utils/pwaUtils';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    initializePWA();
  }, []);

  const initializePWA = async () => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }

    // Check for install prompt
    setTimeout(() => {
      if (pwaManager.canInstall()) {
        setShowInstallPrompt(true);
      }
    }, 3000);

    // Request notification permission on mobile
    if (deviceUtils.isMobile() && NotificationManager.isSupported()) {
      await NotificationManager.requestPermission();
    }
  };

  const handleInstallApp = async () => {
    const installed = await pwaManager.install();
    if (installed) {
      setShowInstallPrompt(false);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <NotificationProvider>
              <ToastProvider>
                <MainLayout />
                
                {/* PWA Install Prompt */}
                {showInstallPrompt && (
                  <div className="fixed bottom-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 md:left-auto md:right-4 md:w-80">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Install Travel Buddy</h3>
                        <p className="text-sm opacity-90">Get the full app experience</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setShowInstallPrompt(false)}
                          className="px-3 py-1 text-sm bg-blue-500 rounded hover:bg-blue-400"
                        >
                          Later
                        </button>
                        <button
                          onClick={handleInstallApp}
                          className="px-3 py-1 text-sm bg-white text-blue-600 rounded hover:bg-gray-100"
                        >
                          Install
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </ToastProvider>
            </NotificationProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;