import React, { useEffect, useRef, useState } from 'react';
import { Place } from '../types';

interface GoogleMapViewProps {
  places: Place[];
  userLocation?: { latitude: number; longitude: number };
  onPlaceSelect?: (place: Place) => void;
  height?: string;
}

const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  places,
  userLocation,
  onPlaceSelect,
  height = '400px'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadGoogleMaps = async () => {
      if (window.google?.maps) {
        setIsLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = () => setIsLoaded(true);
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const center = userLocation || { latitude: 37.7749, longitude: -122.4194 };
    
    const mapInstance = new google.maps.Map(mapRef.current, {
      center: { lat: center.latitude, lng: center.longitude },
      zoom: 13,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    setMap(mapInstance);

    // Add user location marker
    if (userLocation) {
      new google.maps.Marker({
        position: { lat: userLocation.latitude, lng: userLocation.longitude },
        map: mapInstance,
        title: 'Your Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="8" fill="#4285F4" stroke="white" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(24, 24)
        }
      });
    }
  }, [isLoaded, userLocation]);

  useEffect(() => {
    if (!map || !places.length) return;

    // Clear existing markers
    const markers: google.maps.Marker[] = [];

    places.forEach((place) => {
      const lat = place.geometry?.location?.lat || place.latitude;
      const lng = place.geometry?.location?.lng || place.longitude;
      
      if (!lat || !lng) return;

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map,
        title: place.name,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2C10.48 2 6 6.48 6 12C6 20 16 30 16 30S26 20 26 12C26 6.48 21.52 2 16 2Z" fill="#EA4335"/>
              <circle cx="16" cy="12" r="4" fill="white"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32)
        }
      });

      marker.addListener('click', () => {
        onPlaceSelect?.(place);
      });

      markers.push(marker);
    });

    return () => {
      markers.forEach(marker => marker.setMap(null));
    };
  }, [map, places, onPlaceSelect]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg" style={{ height }}>
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  return <div ref={mapRef} style={{ height }} className="w-full rounded-lg" />;
};

export default GoogleMapView;