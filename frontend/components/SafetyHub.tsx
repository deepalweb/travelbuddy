import React, { useState, useEffect } from 'react';
import { Shield, Phone, MapPin, AlertTriangle, Navigation } from 'lucide-react';

interface EmergencyService {
  type: string;
  name: string;
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
  distance: number;
  rating: number;
  is24Hours: boolean;
}

interface SafetyInfo {
  safetyLevel: 'low' | 'medium' | 'high';
  alerts: string[];
  emergencyNumbers: {
    police: string;
    medical: string;
    fire: string;
  };
}

export const SafetyHub: React.FC = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [safetyInfo, setSafetyInfo] = useState<SafetyInfo | null>(null);
  const [emergencyServices, setEmergencyServices] = useState<EmergencyService[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(coords);
          fetchSafetyInfo(coords);
          fetchEmergencyServices(coords);
        },
        (error) => console.error('Location error:', error)
      );
    }
  };

  const fetchSafetyInfo = async (coords: { lat: number; lng: number }) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/safety/info?lat=${coords.lat}&lng=${coords.lng}`);
      if (response.ok) {
        const data = await response.json();
        setSafetyInfo(data);
      }
    } catch (error) {
      console.error('Safety info error:', error);
      // Fallback safety info
      setSafetyInfo({
        safetyLevel: 'medium',
        alerts: ['Stay aware of your surroundings'],
        emergencyNumbers: {
          police: '911',
          medical: '911',
          fire: '911'
        }
      });
    }
    setLoading(false);
  };

  const fetchEmergencyServices = async (coords: { lat: number; lng: number }) => {
    try {
      const response = await fetch(`/api/emergency/services?lat=${coords.lat}&lng=${coords.lng}`);
      if (response.ok) {
        const data = await response.json();
        setEmergencyServices(data);
      }
    } catch (error) {
      console.error('Emergency services error:', error);
    }
  };

  const handleEmergencyCall = (number: string) => {
    window.open(`tel:${number}`, '_self');
  };

  const getSafetyColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Shield className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-900">Safety Hub</h1>
      </div>

      {/* Safety Status */}
      {safetyInfo && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Current Safety Status</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSafetyColor(safetyInfo.safetyLevel)}`}>
              {safetyInfo.safetyLevel.toUpperCase()} RISK
            </span>
          </div>
          
          {safetyInfo.alerts.length > 0 && (
            <div className="space-y-2">
              {safetyInfo.alerts.map((alert, index) => (
                <div key={index} className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <span className="text-sm text-yellow-800">{alert}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Emergency Numbers */}
      {safetyInfo && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Emergency Numbers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleEmergencyCall(safetyInfo.emergencyNumbers.police)}
              className="flex items-center space-x-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Phone className="h-6 w-6 text-blue-600" />
              <div className="text-left">
                <div className="font-medium text-blue-900">Police</div>
                <div className="text-sm text-blue-700">{safetyInfo.emergencyNumbers.police}</div>
              </div>
            </button>
            
            <button
              onClick={() => handleEmergencyCall(safetyInfo.emergencyNumbers.medical)}
              className="flex items-center space-x-3 p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <Phone className="h-6 w-6 text-red-600" />
              <div className="text-left">
                <div className="font-medium text-red-900">Medical</div>
                <div className="text-sm text-red-700">{safetyInfo.emergencyNumbers.medical}</div>
              </div>
            </button>
            
            <button
              onClick={() => handleEmergencyCall(safetyInfo.emergencyNumbers.fire)}
              className="flex items-center space-x-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <Phone className="h-6 w-6 text-orange-600" />
              <div className="text-left">
                <div className="font-medium text-orange-900">Fire</div>
                <div className="text-sm text-orange-700">{safetyInfo.emergencyNumbers.fire}</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Nearby Emergency Services */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Nearby Emergency Services</h2>
        {emergencyServices.length > 0 ? (
          <div className="space-y-4">
            {emergencyServices.slice(0, 6).map((service, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium text-gray-900">{service.name}</div>
                    <div className="text-sm text-gray-600">{service.address}</div>
                    <div className="text-xs text-gray-500">
                      {service.distance.toFixed(1)} km • {service.type}
                      {service.is24Hours && ' • 24/7'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {service.phone && (
                    <button
                      onClick={() => handleEmergencyCall(service.phone)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      Call
                    </button>
                  )}
                  <button
                    onClick={() => window.open(`https://maps.google.com?q=${service.latitude},${service.longitude}`, '_blank')}
                    className="px-3 py-1 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
                  >
                    <Navigation className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {loading ? 'Loading emergency services...' : 'No emergency services found nearby'}
          </div>
        )}
      </div>

      {/* SOS Button */}
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Emergency SOS</h3>
        <p className="text-sm text-red-700 mb-4">
          In case of immediate emergency, press the button below to call emergency services
        </p>
        <button
          onClick={() => handleEmergencyCall('911')}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
        >
          🚨 EMERGENCY SOS
        </button>
      </div>
    </div>
  );
};