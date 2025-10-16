import React, { useState, useEffect } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface APIStatus {
  name: string;
  status: 'checking' | 'connected' | 'error' | 'missing-key';
  message: string;
  details?: string;
  responseTime?: number;
}

export const APIStatusChecker: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [apiStatuses, setApiStatuses] = useState<APIStatus[]>([
    { name: 'Gemini AI', status: 'checking', message: 'Testing connection...' },
    { name: 'Google Maps', status: 'checking', message: 'Testing connection...' },
    { name: 'Unsplash Images', status: 'checking', message: 'Testing connection...' }
  ]);

  const updateStatus = (apiName: string, updates: Partial<APIStatus>) => {
    setApiStatuses(prev => prev.map(api => 
      api.name === apiName ? { ...api, ...updates } : api
    ));
  };

  // Test Gemini AI API
  const testGeminiAPI = async () => {
    const startTime = Date.now();
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      updateStatus('Gemini AI', {
        status: 'missing-key',
        message: 'API key not configured',
        details: 'Add VITE_GEMINI_API_KEY to your .env file'
      });
      return;
    }

    try {
      // Test with a simple HTTP request to Gemini API
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: 'Hello, respond with just "API working" to test connection.'
            }]
          }]
        })
      });

      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
        
        updateStatus('Gemini AI', {
          status: 'connected',
          message: '✅ Successfully connected',
          details: `Response: "${generatedText.slice(0, 50)}..."`,
          responseTime
        });
      } else if (response.status === 403) {
        updateStatus('Gemini AI', {
          status: 'error',
          message: '❌ API key rejected',
          details: 'Check API key permissions and billing',
          responseTime
        });
      } else {
        updateStatus('Gemini AI', {
          status: 'error',
          message: `❌ HTTP ${response.status}`,
          details: `${response.statusText}`,
          responseTime
        });
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      updateStatus('Gemini AI', {
        status: 'error',
        message: '❌ Connection failed',
        details: error.message?.slice(0, 100) || 'Network error',
        responseTime
      });
    }
  };

  // Test Google Maps API
  const testGoogleMapsAPI = async () => {
    const startTime = Date.now();
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      updateStatus('Google Maps', {
        status: 'missing-key',
        message: 'API key not configured',
        details: 'Add VITE_GOOGLE_MAPS_API_KEY to your .env file'
      });
      return;
    }

    try {
      const loader = new Loader({
        apiKey,
        version: 'weekly',
        libraries: ['places', 'geometry']
      });

      await loader.load();
      const responseTime = Date.now() - startTime;

      // Test if we can access Google Maps objects
      if (typeof google !== 'undefined' && google.maps) {
        // Test a simple Places service operation
        const service = new google.maps.places.PlacesService(
          document.createElement('div')
        );

        // Test with a simple nearby search
        const testRequest = {
          location: new google.maps.LatLng(37.7749, -122.4194), // San Francisco
          radius: 1000,
          type: 'restaurant' as any
        };

        service.nearbySearch(testRequest, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            updateStatus('Google Maps', {
              status: 'connected',
              message: '✅ Successfully connected',
              details: `Found ${results?.length || 0} test places. Places API working.`,
              responseTime: Date.now() - startTime
            });
          } else if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
            updateStatus('Google Maps', {
              status: 'error',
              message: '❌ API key rejected',
              details: 'Places API access denied. Check API key permissions.',
              responseTime: Date.now() - startTime
            });
          } else {
            updateStatus('Google Maps', {
              status: 'error',
              message: '⚠️ Places API error',
              details: `Status: ${status}`,
              responseTime: Date.now() - startTime
            });
          }
        });
      } else {
        updateStatus('Google Maps', {
          status: 'error',
          message: '❌ Google Maps object not available',
          details: 'Maps JavaScript API loaded but google.maps is undefined',
          responseTime
        });
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      updateStatus('Google Maps', {
        status: 'error',
        message: '❌ Failed to load API',
        details: error.message?.slice(0, 100) || 'Unknown error',
        responseTime
      });
    }
  };

  // Test Unsplash API
  const testUnsplashAPI = async () => {
    const startTime = Date.now();
    const accessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

    if (!accessKey) {
      updateStatus('Unsplash Images', {
        status: 'missing-key',
        message: 'API key not configured',
        details: 'Add VITE_UNSPLASH_ACCESS_KEY to your .env file'
      });
      return;
    }

    try {
      const response = await fetch(
        `https://api.unsplash.com/photos/random?query=travel&client_id=${accessKey}`,
        { 
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        }
      );
      
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        updateStatus('Unsplash Images', {
          status: 'connected',
          message: '✅ Successfully connected',
          details: `Retrieved image: "${data.alt_description?.slice(0, 50) || 'Travel image'}"`,
          responseTime
        });
      } else if (response.status === 401) {
        updateStatus('Unsplash Images', {
          status: 'error',
          message: '❌ Unauthorized access',
          details: 'Invalid API key or insufficient permissions',
          responseTime
        });
      } else {
        updateStatus('Unsplash Images', {
          status: 'error',
          message: `❌ HTTP ${response.status}`,
          details: `${response.statusText}`,
          responseTime
        });
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      updateStatus('Unsplash Images', {
        status: 'error',
        message: '❌ Network error',
        details: error.message?.slice(0, 100) || 'Unknown error',
        responseTime
      });
    }
  };

  useEffect(() => {
    const runTests = async () => {
      // Run all API tests in parallel
      await Promise.allSettled([
        testGeminiAPI(),
        testGoogleMapsAPI(),
        testUnsplashAPI()
      ]);
    };

    runTests();
  }, []);

  const getStatusColor = (status: APIStatus['status']) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50 border-green-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'missing-key': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getStatusIcon = (status: APIStatus['status']) => {
    switch (status) {
      case 'connected': return '✅';
      case 'error': return '❌';
      case 'missing-key': return '⚠️';
      case 'checking': return '🔄';
      default: return '❓';
    }
  };

  const allConnected = apiStatuses.every(api => api.status === 'connected');
  const hasErrors = apiStatuses.some(api => api.status === 'error');
  const hasMissingKeys = apiStatuses.some(api => api.status === 'missing-key');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">🔍 API Status Check</h2>
            {onClose && (
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
                aria-label="Close"
              >
                ×
              </button>
            )}
          </div>

          {/* Overall Status Summary */}
          <div className={`mb-6 p-4 rounded-lg border-2 ${
            allConnected ? 'bg-green-50 border-green-200' :
            hasErrors ? 'bg-red-50 border-red-200' :
            hasMissingKeys ? 'bg-yellow-50 border-yellow-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <h3 className="font-semibold mb-2">
              {allConnected ? '🎉 All APIs Connected!' :
               hasErrors ? '⚠️ Some APIs Have Issues' :
               hasMissingKeys ? '🔑 API Keys Needed' :
               '⏳ Testing APIs...'}
            </h3>
            <p className="text-sm">
              {allConnected ? 'Your travel buddy app is fully operational with all services connected.' :
               hasErrors ? 'Some APIs are experiencing connection issues. Check the details below.' :
               hasMissingKeys ? 'Some API keys are missing. Add them to your .env file.' :
               'Please wait while we test your API connections...'}
            </p>
          </div>

          {/* Individual API Status */}
          <div className="space-y-4">
            {apiStatuses.map((api, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getStatusColor(api.status)}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getStatusIcon(api.status)}</span>
                    <h4 className="font-semibold">{api.name}</h4>
                  </div>
                  {api.responseTime && (
                    <span className="text-xs opacity-75">
                      {api.responseTime}ms
                    </span>
                  )}
                </div>
                
                <p className="text-sm mb-1">{api.message}</p>
                
                {api.details && (
                  <div className="text-xs opacity-75 bg-white bg-opacity-50 p-2 rounded mt-2">
                    <strong>Details:</strong> {api.details}
                  </div>
                )}

                {api.status === 'checking' && (
                  <div className="mt-2">
                    <div className="animate-pulse bg-gray-200 h-2 rounded"></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Configuration Help */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-2">🛠️ Configuration</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Environment File:</strong> .env (in root directory)</p>
              <p><strong>Required Keys:</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• VITE_GEMINI_API_KEY (Google AI Studio)</li>
                <li>• VITE_GOOGLE_MAPS_API_KEY (Google Cloud Console)</li>
                <li>• VITE_UNSPLASH_ACCESS_KEY (Unsplash Developers)</li>
              </ul>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
            >
              🔄 Retest APIs
            </button>
            <button
              onClick={() => console.log('API Statuses:', apiStatuses)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
            >
              📊 Log Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIStatusChecker;
