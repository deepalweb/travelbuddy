import React, { useState, useEffect } from 'react';
import { BarChart3, Zap, Clock, TrendingUp, AlertTriangle } from './Icons';
import { performanceOptimizationService } from '../services/performanceOptimizationService';

interface PerformanceMonitorWidgetProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

const PerformanceMonitorWidget: React.FC<PerformanceMonitorWidgetProps> = ({
  isVisible = false,
  onToggle
}) => {
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      const report = performanceOptimizationService.getPerformanceReport();
      setPerformanceData(report);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (!isVisible || !performanceData) return null;

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-500';
    if (value >= thresholds.warning) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getMemoryColor = (usage: string) => {
    const percent = parseFloat(usage);
    if (percent < 50) return 'text-green-500';
    if (percent < 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm">
      {/* Collapsed View */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <BarChart3 className="w-5 h-5 text-blue-500" />
          <span className="text-sm font-medium">Performance</span>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(performanceData.cacheStats.hitRate * 100, { good: 70, warning: 50 })}`}></div>
            <span className="text-xs text-gray-500">
              {(performanceData.cacheStats.hitRate * 100).toFixed(0)}%
            </span>
          </div>
        </button>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 w-80">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-sm">Performance Monitor</h3>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Cache Hit Rate */}
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium">Cache Hit</span>
              </div>
              <div className={`text-lg font-bold ${getStatusColor(performanceData.cacheStats.hitRate * 100, { good: 70, warning: 50 })}`}>
                {(performanceData.cacheStats.hitRate * 100).toFixed(1)}%
              </div>
            </div>

            {/* Memory Usage */}
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-medium">Memory</span>
              </div>
              <div className={`text-lg font-bold ${getMemoryColor(performanceData.cacheStats.memoryUsage)}`}>
                {performanceData.cacheStats.memoryUsage}
              </div>
            </div>

            {/* Cache Size */}
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium">Cache Size</span>
              </div>
              <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                {performanceData.cacheStats.size}
              </div>
            </div>

            {/* Load Time */}
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-medium">Load Time</span>
              </div>
              <div className={`text-lg font-bold ${getStatusColor(3000 - (performanceData.metrics.loadTime || 0), { good: 2000, warning: 1000 })}`}>
                {performanceData.metrics.loadTime ? `${Math.round(performanceData.metrics.loadTime)}ms` : 'N/A'}
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {performanceData.recommendations.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-medium">Recommendations</span>
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {performanceData.recommendations.slice(0, 3).map((rec: string, index: number) => (
                  <div key={index} className="text-xs text-gray-600 dark:text-gray-400 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-3 mt-3">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  // Clear cache
                  window.location.reload();
                }}
                className="flex-1 text-xs py-2 px-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Clear Cache
              </button>
              <button
                onClick={() => {
                  // Force garbage collection if available
                  if ('gc' in window) {
                    (window as any).gc();
                  }
                }}
                className="flex-1 text-xs py-2 px-3 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Optimize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitorWidget;