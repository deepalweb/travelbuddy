import React, { useState, useEffect } from 'react';
import { apiLimiter } from '../services/apiLimiter';
import { usageAnalytics, UsageTotals } from '../services/usageAnalyticsService';

interface APIStatus {
  remainingRequests: number;
  queueLength: number;
  circuitBreakerState: string;
  cacheSize: number;
}

const APIUsageMonitor: React.FC = () => {
  const [status, setStatus] = useState<{ [key: string]: APIStatus }>({});
  const [isVisible, setIsVisible] = useState(false);
  const [dailyQuotaExceeded, setDailyQuotaExceeded] = useState(false);
  const [serverTotals, setServerTotals] = useState<UsageTotals | null>(null);

  useEffect(() => {
    const updateStatus = () => {
      // Check if daily quota has reset
      apiLimiter.checkDailyQuotaReset();
      
      const newStatus = {
        gemini: apiLimiter.getStatus('gemini'),
        places: apiLimiter.getStatus('places')
      } as any;
      setStatus(newStatus);
      
      // Check if daily quota is exceeded by looking at recent errors
      const hasRecentQuotaError = localStorage.getItem('dailyQuotaExceeded') === 'true';
      setDailyQuotaExceeded(hasRecentQuotaError);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000); // Update every 5 seconds

    // Hook up real-time server totals
    usageAnalytics.connect();
    usageAnalytics.getSnapshot().then(({ totals }) => setServerTotals(totals)).catch(() => {});
    const onUpdate = (payload: { totals: UsageTotals }) => setServerTotals(payload.totals);
    usageAnalytics.onUpdate(onUpdate);

    return () => {
      clearInterval(interval);
      usageAnalytics.offUpdate(onUpdate);
    };
  }, []);

  const getStatusColor = (remaining: number, max: number) => {
    const percentage = (remaining / max) * 100;
    if (percentage > 70) return 'text-green-600';
    if (percentage > 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusText = (remaining: number, max: number) => {
    const percentage = (remaining / max) * 100;
    if (percentage > 70) return 'Good';
    if (percentage > 30) return 'Moderate';
    return 'Limited';
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600 transition-colors z-50"
        title="Show API Status"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        {dailyQuotaExceeded && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            !
          </div>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-900">API Status Monitor</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {dailyQuotaExceeded && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-red-800">Daily Quota Exceeded</span>
          </div>
          <p className="text-xs text-red-600 mt-1">
            You've reached the daily limit of 250 requests. Quota resets at midnight UTC.
          </p>
        </div>
      )}
      
      <div className="space-y-3">
        {serverTotals && (
          <div className="border border-gray-200 rounded p-2 text-xs">
            <div className="flex justify-between">
              <span className="font-semibold">Live totals</span>
              <span className="text-gray-500">(server)</span>
            </div>
            <div className="mt-1 grid grid-cols-3 gap-1 text-center">
              <div><div className="font-bold">{serverTotals.gemini.count}</div><div className="text-gray-500">Gemini</div></div>
              <div><div className="font-bold">{serverTotals.maps.count}</div><div className="text-gray-500">Maps</div></div>
              <div><div className="font-bold">{serverTotals.places.count}</div><div className="text-gray-500">Places</div></div>
            </div>
          </div>
        )}
        {Object.entries(status).map(([api, apiStatus]) => {
          const maxRequests = api === 'gemini' ? 10 : api === 'places' ? 30 : 20;
          const statusColor = getStatusColor(apiStatus.remainingRequests, maxRequests);
          const statusText = getStatusText(apiStatus.remainingRequests, maxRequests);
          
          return (
            <div key={api} className="border border-gray-200 rounded p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 capitalize">{api}</span>
                <span className={`text-xs font-semibold ${statusColor}`}>
                  {statusText}
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Remaining:</span>
                  <span className={statusColor}>
                    {apiStatus.remainingRequests}/{maxRequests}
                  </span>
                </div>
                
                {apiStatus.queueLength > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Queued:</span>
                    <span className="text-orange-600">{apiStatus.queueLength}</span>
                  </div>
                )}
                
                {apiStatus.circuitBreakerState !== 'CLOSED' && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Status:</span>
                    <span className="text-red-600 capitalize">
                      {apiStatus.circuitBreakerState.replace('_', ' ')}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Cached:</span>
                  <span className="text-blue-600">{apiStatus.cacheSize}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Last updated:</span>
          <span>{new Date().toLocaleTimeString()}</span>
        </div>
        {dailyQuotaExceeded && (
          <div className="mt-2 text-xs text-gray-500">
            <span>Daily quota: 250/250 (Exceeded)</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default APIUsageMonitor;