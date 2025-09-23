import React, { useState, useEffect, useRef } from 'react';

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface OpenStreetMapPickerProps {
  onLocationSelect: (location: Location) => void;
  onClose: () => void;
  initialLocation?: Location;
}

const OpenStreetMapPicker: React.FC<OpenStreetMapPickerProps> = ({ 
  onLocationSelect, 
  onClose, 
  initialLocation 
}) => {
  const [selectedLocation, setSelectedLocation] = useState<Location>(
    initialLocation || { lat: 40.7128, lng: -74.0060, address: '' }
  );
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    loadLeafletMap();
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
      }
    };
  }, []);

  const loadLeafletMap = async () => {
    if (!mapRef.current) return;

    try {
      // Dynamically import Leaflet
      const L = (window as any).L;
      if (!L) {
        console.error('Leaflet not loaded');
        return;
      }

      const map = L.map(mapRef.current).setView([selectedLocation.lat, selectedLocation.lng], 13);

      // Add OpenStreetMap tiles (free, no API key needed)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add marker
      const marker = L.marker([selectedLocation.lat, selectedLocation.lng], {
        draggable: true
      }).addTo(map);

      // Handle map clicks
      map.on('click', async (e: any) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        await updateLocation(lat, lng);
        marker.setLatLng([lat, lng]);
      });

      // Handle marker drag
      marker.on('dragend', async () => {
        const pos = marker.getLatLng();
        await updateLocation(pos.lat, pos.lng);
      });

      leafletMapRef.current = map;
      markerRef.current = marker;
    } catch (error) {
      console.error('Failed to load map:', error);
    }
  };

  const updateLocation = async (lat: number, lng: number) => {
    try {
      // Use free Nominatim geocoding service
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      const address = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setSelectedLocation({ lat, lng, address });
    } catch (error) {
      setSelectedLocation({ lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      // Use free Nominatim search service
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      const data = await response.json();
      
      if (data[0]) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const address = data[0].display_name;
        
        setSelectedLocation({ lat, lng, address });
        
        // Update map and marker
        if (leafletMapRef.current && markerRef.current) {
          leafletMapRef.current.setView([lat, lng], 13);
          markerRef.current.setLatLng([lat, lng]);
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
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
          {/* OpenStreetMap */}
          <div 
            ref={mapRef}
            className="w-full h-96 bg-gray-100 rounded-lg"
          />

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

export default OpenStreetMapPicker;