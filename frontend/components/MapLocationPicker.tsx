import React, { useState, useEffect, useRef } from 'react';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface MapLocationPickerProps {
  onLocationSelect: (location: Location) => void;
  onClose: () => void;
  initialLocation?: Location;
}

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({ 
  onLocationSelect, 
  onClose, 
  initialLocation 
}) => {
  const [selectedLocation, setSelectedLocation] = useState<Location>(
    initialLocation || { lat: 40.7128, lng: -74.0060, address: '' }
  );
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  useEffect(() => {
    loadGoogleMaps();
  }, []);

  const loadGoogleMaps = async () => {
    // Check if already loaded
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    try {
      // Get API key from backend
      const response = await fetch('/api/config/maps-key');
      if (response.ok) {
        const { apiKey } = await response.json();
        await loadGoogleMapsScript(apiKey);
        initializeMap();
        return;
      }
    } catch (error) {
      console.error('Failed to load Google Maps API key from backend:', error);
    }
  };

  const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Maps'));
      document.head.appendChild(script);
    });
  };

  const initializeMap = () => {
    if (!mapRef.current || !window.google || !window.google.maps) {
      console.warn('Google Maps not loaded yet');
      return;
    }

    try {

    const map = new google.maps.Map(mapRef.current, {
      center: { lat: selectedLocation.lat, lng: selectedLocation.lng },
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    const marker = new google.maps.Marker({
      position: { lat: selectedLocation.lat, lng: selectedLocation.lng },
      map: map,
      draggable: true,
    });

    // Handle map clicks
    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        updateLocation(lat, lng);
        marker.setPosition({ lat, lng });
      }
    });

    // Handle marker drag
    marker.addListener('dragend', () => {
      const pos = marker.getPosition();
      if (pos) {
        updateLocation(pos.lat(), pos.lng());
      }
    });

    googleMapRef.current = map;
    markerRef.current = marker;
    } catch (error) {
      console.error('Failed to initialize Google Maps:', error);
    }
  };

  const updateLocation = async (lat: number, lng: number) => {
    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ location: { lat, lng } });
      const address = result.results?.[0]?.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setSelectedLocation({ lat, lng, address });
    } catch (error) {
      setSelectedLocation({ lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !window.google) return;
    
    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ address: searchQuery });
      
      if (result.results?.[0]) {
        const location = result.results[0].geometry.location;
        const lat = location.lat();
        const lng = location.lng();
        const address = result.results[0].formatted_address;
        
        setSelectedLocation({ lat, lng, address });
        
        // Update map and marker
        if (googleMapRef.current && markerRef.current) {
          googleMapRef.current.setCenter({ lat, lng });
          markerRef.current.setPosition({ lat, lng });
        }
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[95vh] overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Select Business Location</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
          </div>
          
          {/* Search */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for address..."
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* Google Map */}
          <div className="relative">
            <div 
              ref={mapRef}
              className="w-full h-96 bg-gray-100 rounded-lg"
            />
            
            {/* Loading indicator */}
            {!window.google && (
              <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading Google Maps...</p>
                </div>
              </div>
            )}
          </div>

          {/* Selected Location Info */}
          {selectedLocation.address && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-800">Selected Location:</p>
              <p className="text-sm text-blue-600">{selectedLocation.address}</p>
              <p className="text-xs text-blue-500">
                {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onLocationSelect(selectedLocation)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              disabled={!selectedLocation.address}
            >
              Select Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapLocationPicker;