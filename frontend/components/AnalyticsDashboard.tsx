import React, { useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService.ts';

const AnalyticsDashboard: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateSummary = () => {
      setSummary(analyticsService.getSummary());
    };

    updateSummary();
    const interval = setInterval(updateSummary, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible || !summary) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 bg-gray-800 text-white p-2 rounded-full text-xs z-50 hover:bg-gray-700"
      >
        📊
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white border rounded-lg shadow-lg p-4 w-80 z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-sm">Analytics</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>

      <div className="space-y-3">
        <div className="text-xs">
          <div className="font-medium">Total Events: {summary.totalEvents}</div>
        </div>

        <div>
          <div className="font-medium text-xs mb-1">Top Categories:</div>
          <div className="space-y-1">
            {Object.entries(summary.categories)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .slice(0, 3)
              .map(([category, count]) => (
                <div key={category} className="flex justify-between text-xs">
                  <span className="capitalize">{category}</span>
                  <span className="text-gray-600">{count as number}</span>
                </div>
              ))}
          </div>
        </div>

        <div>
          <div className="font-medium text-xs mb-1">Recent Events:</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {summary.recentEvents.map((event: any, index: number) => (
              <div key={index} className="text-xs text-gray-600">
                <span className="font-medium">{event.action}</span>
                {event.label && <span> - {event.label}</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => analyticsService.clearEvents()}
            className="flex-1 bg-red-100 text-red-700 px-2 py-1 rounded text-xs hover:bg-red-200"
          >
            Clear
          </button>
          <button
            onClick={() => setSummary(analyticsService.getSummary())}
            className="flex-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs hover:bg-blue-200"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;