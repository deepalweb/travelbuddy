import React from 'react'
import ErrorBoundary from './ErrorBoundaryNew'
import { logger } from '../utils/logger'

interface RouteErrorBoundaryProps {
  children: React.ReactNode
}

const RouteErrorFallback: React.FC<{ error?: Error }> = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="max-w-lg w-full text-center">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">Oops!</h1>
      <p className="text-xl text-gray-600 mb-8">
        We couldn't load this page. Please try again.
      </p>
      {import.meta.env.DEV && error && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg text-left">
          <p className="text-sm font-medium text-red-800 mb-2">Error:</p>
          <pre className="text-xs text-red-600 overflow-auto">{error.message}</pre>
        </div>
      )}
      <div className="flex gap-4 justify-center">
        <button
          onClick={() => window.history.back()}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Go Back
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  </div>
)

export const RouteErrorBoundary: React.FC<RouteErrorBoundaryProps> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={<RouteErrorFallback />}
      onError={(error, errorInfo) => {
        logger.error('Route error', { error, errorInfo })
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
