import './trustedTypes'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Suppress non-critical IntersectionObserver errors from Link prefetch
const originalError = console.error
console.error = (...args: any[]) => {
  if (
    args[0]?.message?.includes("Failed to execute 'observe' on 'IntersectionObserver'") ||
    (typeof args[0] === 'string' && args[0].includes("parameter 1 is not of type 'Element'"))
  ) {
    // Silently ignore this non-critical error from React Router's prefetch feature
    return
  }
  originalError.call(console, ...args)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
// Deployment trigger
