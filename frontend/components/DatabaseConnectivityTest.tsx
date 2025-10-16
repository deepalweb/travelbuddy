import React, { useState, useEffect } from 'react';
import { withApiBase } from '../services/config';
import { Colors } from '../constants.ts';

interface ConnectivityStatus {
  backend: 'connected' | 'disconnected' | 'testing';
  database: 'connected' | 'disconnected' | 'testing';
  users: number;
  posts: number;
  lastChecked: string;
}

const DatabaseConnectivityTest: React.FC = () => {
  const [status, setStatus] = useState<ConnectivityStatus>({
    backend: 'testing',
    database: 'testing',
    users: 0,
    posts: 0,
    lastChecked: 'Never'
  });
  const [isVisible, setIsVisible] = useState(false);

  const testConnectivity = async () => {
    setStatus(prev => ({ ...prev, backend: 'testing', database: 'testing' }));
    
    try {
      // Test backend health
  const healthRes = await fetch(withApiBase('/health'));
      const healthData = await healthRes.json();
      
      if (healthRes.ok) {
        setStatus(prev => ({ ...prev, backend: 'connected' }));
        
        // Test database by fetching users
  const usersRes = await fetch(withApiBase('/api/users'));
  const postsRes = await fetch(withApiBase('/api/posts'));
        
        if (usersRes.ok && postsRes.ok) {
          const users = await usersRes.json();
          const posts = await postsRes.json();
          
          setStatus({
            backend: 'connected',
            database: 'connected',
            users: users.length,
            posts: posts.length,
            lastChecked: new Date().toLocaleTimeString()
          });
        } else {
          setStatus(prev => ({ 
            ...prev, 
            database: 'disconnected',
            lastChecked: new Date().toLocaleTimeString()
          }));
        }
      } else {
        setStatus(prev => ({ 
          ...prev, 
          backend: 'disconnected',
          database: 'disconnected',
          lastChecked: new Date().toLocaleTimeString()
        }));
      }
    } catch (error) {
      console.error('Connectivity test failed:', error);
      setStatus({
        backend: 'disconnected',
        database: 'disconnected',
        users: 0,
        posts: 0,
        lastChecked: new Date().toLocaleTimeString()
      });
    }
  };

  useEffect(() => {
    testConnectivity();
    const interval = setInterval(testConnectivity, 30000); // Test every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return Colors.accentSuccess;
      case 'disconnected': return Colors.accentError;
      case 'testing': return Colors.accentWarning;
      default: return Colors.text_secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return '✅';
      case 'disconnected': return '❌';
      case 'testing': return '🔄';
      default: return '❓';
    }
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-20 right-4 w-12 h-12 rounded-full text-white text-xs font-bold z-50"
        style={{ backgroundColor: getStatusColor(status.database) }}
        title="Database Connectivity"
      >
        🔗
      </button>
    );
  }

  return (
    <div 
      className="fixed bottom-20 right-4 p-4 rounded-lg shadow-lg z-50 min-w-72"
      style={{ backgroundColor: Colors.cardBackground, border: `1px solid ${Colors.cardBorder}` }}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-bold" style={{ color: Colors.text }}>Database Connectivity</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-xs px-2 py-1 rounded"
          style={{ color: Colors.text_secondary }}
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span style={{ color: Colors.text_secondary }}>Backend (Port 3001):</span>
          <div className="flex items-center gap-1">
            <span>{getStatusIcon(status.backend)}</span>
            <span style={{ color: getStatusColor(status.backend) }}>
              {status.backend}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span style={{ color: Colors.text_secondary }}>Database:</span>
          <div className="flex items-center gap-1">
            <span>{getStatusIcon(status.database)}</span>
            <span style={{ color: getStatusColor(status.database) }}>
              {status.database}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between">
          <span style={{ color: Colors.text_secondary }}>Users in DB:</span>
          <span style={{ color: Colors.text }}>{status.users}</span>
        </div>
        
        <div className="flex justify-between">
          <span style={{ color: Colors.text_secondary }}>Posts in DB:</span>
          <span style={{ color: Colors.text }}>{status.posts}</span>
        </div>
        
        <div className="flex justify-between">
          <span style={{ color: Colors.text_secondary }}>Last Checked:</span>
          <span style={{ color: Colors.text_secondary }}>{status.lastChecked}</span>
        </div>
      </div>
      
      <button
        onClick={testConnectivity}
        className="w-full mt-3 px-3 py-1 text-xs rounded"
        style={{ 
          backgroundColor: Colors.primary + '20', 
          color: Colors.primary,
          border: `1px solid ${Colors.primary}40`
        }}
      >
        Test Now
      </button>
    </div>
  );
};

export default DatabaseConnectivityTest;