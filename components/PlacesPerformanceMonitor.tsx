import React, { useState, useEffect } from 'react';
import { getPlaceCacheStats, clearPlacesCache } from '../services/placesService.ts';
import { Colors } from '../constants.ts';

const PlacesPerformanceMonitor: React.FC = () => {
  const [stats, setStats] = useState({ size: 0, hitRate: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      setStats(getPlaceCacheStats());
    };
    
    updateStats();
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 w-12 h-12 rounded-full text-white text-xs font-bold z-50"
        style={{ backgroundColor: Colors.primary }}
        title="Places Performance"
      >
        📊
      </button>
    );
  }

  return (
    <div 
      className="fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 min-w-64"
      style={{ backgroundColor: Colors.cardBackground, border: `1px solid ${Colors.cardBorder}` }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold" style={{ color: Colors.text }}>Places Cache</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-xs px-2 py-1 rounded"
          style={{ color: Colors.text_secondary }}
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span style={{ color: Colors.text_secondary }}>Cached Items:</span>
          <span style={{ color: Colors.text }}>{stats.size}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: Colors.text_secondary }}>Hit Rate:</span>
          <span style={{ color: Colors.accentSuccess }}>{(stats.hitRate * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: Colors.text_secondary }}>Status:</span>
          <span style={{ color: stats.size > 0 ? Colors.accentSuccess : Colors.accentWarning }}>
            {stats.size > 0 ? 'Active' : 'Empty'}
          </span>
        </div>
      </div>
      
      <button
        onClick={() => {
          clearPlacesCache();
          setStats({ size: 0, hitRate: 0 });
        }}
        className="w-full mt-3 px-3 py-1 text-xs rounded"
        style={{ 
          backgroundColor: Colors.accentError + '20', 
          color: Colors.accentError,
          border: `1px solid ${Colors.accentError}40`
        }}
      >
        Clear Cache
      </button>
    </div>
  );
};

export default PlacesPerformanceMonitor;