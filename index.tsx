import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ToastProvider } from './contexts/ToastContext.tsx';
import { NotificationProvider } from './contexts/NotificationContext.tsx';
import { LanguageProvider } from './contexts/LanguageContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

console.log("Using Leaflet for maps. No API key needed for map tiles.");
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <NotificationProvider>
          <LanguageProvider>
            <ThemeProvider>
              <AuthProvider>
                <App />
              </AuthProvider>
            </ThemeProvider>
          </LanguageProvider>
        </NotificationProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);


// Register Service Worker (only in production)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

// In development, make sure no old service worker/caches hijack requests to the Vite dev server
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
  if ('caches' in window) {
    caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
  }
}