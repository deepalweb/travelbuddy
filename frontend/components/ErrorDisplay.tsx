import React from 'react';
import { Colors } from '../constants';

interface ErrorDisplayProps {
  error: string | Error | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetry?: boolean;
  className?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  onRetry, 
  onDismiss, 
  showRetry = true,
  className = '' 
}) => {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.message;
  
  // Check if this is a rate limiting error
  const isRateLimitError = errorMessage.toLowerCase().includes('rate limit') || 
                          errorMessage.toLowerCase().includes('quota') ||
                          errorMessage.toLowerCase().includes('429') ||
                          errorMessage.toLowerCase().includes('resource_exhausted');

  // Check if this is a daily quota exceeded error
  const isDailyQuotaExceeded = errorMessage.toLowerCase().includes('daily api quota exceeded') ||
                               errorMessage.toLowerCase().includes('exceeded your current quota') ||
                               errorMessage.toLowerCase().includes('quota_value') ||
                               errorMessage.toLowerCase().includes('free_tier');

  const isTemporaryError = isRateLimitError || 
                          errorMessage.toLowerCase().includes('temporarily unavailable') ||
                          errorMessage.toLowerCase().includes('try again');

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg 
            className="h-5 w-5 text-red-400" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {isDailyQuotaExceeded ? 'Daily Quota Exceeded' : 
             isRateLimitError ? 'Service Temporarily Unavailable' : 'Error Occurred'}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            {isDailyQuotaExceeded ? (
              <div>
                <p>You've reached the daily limit of 250 requests for the free tier of the Gemini API.</p>
                <p className="mt-1 text-red-600">
                  <strong>What you can do:</strong>
                </p>
                <ul className="mt-1 ml-4 list-disc text-red-600">
                  <li>Wait until tomorrow when the quota resets</li>
                  <li>Upgrade to a paid plan for higher limits</li>
                  <li>Use cached data and offline features</li>
                  <li>Contact support for quota increase</li>
                </ul>
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-blue-800 text-xs">
                    <strong>Note:</strong> The free tier quota resets daily at midnight UTC. 
                    You can continue using the app with cached data and offline features.
                  </p>
                </div>
              </div>
            ) : isRateLimitError ? (
              <div>
                <p>The AI service is currently experiencing high demand. This is normal during peak usage times.</p>
                <p className="mt-1 text-red-600">
                  <strong>What you can do:</strong>
                </p>
                <ul className="mt-1 ml-4 list-disc text-red-600">
                  <li>Wait a few minutes and try again</li>
                  <li>Try a different feature or search</li>
                  <li>Check back in 5-10 minutes</li>
                </ul>
              </div>
            ) : (
              <p>{errorMessage}</p>
            )}
          </div>
          <div className="mt-4 flex space-x-3">
            {showRetry && onRetry && !isDailyQuotaExceeded && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                {isTemporaryError ? 'Try Again' : 'Retry'}
              </button>
            )}
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Dismiss
              </button>
            )}
            {isDailyQuotaExceeded && (
              <button
                type="button"
                onClick={() => window.open('https://ai.google.dev/gemini-api/docs/rate-limits', '_blank')}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Learn More
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;