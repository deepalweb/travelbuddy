import React, { useEffect, useRef, useState } from 'react';
import { Trip } from '../services/tripService';

interface TripMapProps {
  trip: Trip;
  selectedDay?: number;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export const TripMap: React.FC<TripMapProps> = ({ trip, selectedDay }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google) {
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

    const initMap = () => {
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: 12,
        center: { lat: 27.7172, lng: 85.3240 }, // Default to Kathmandu
        mapTypeId: 'roadmap',
      });

      setMap(mapInstance);
      addMarkersToMap(mapInstance);
    };

    initMap();
  }, [isLoaded, trip, selectedDay]);

  const addMarkersToMap = (mapInstance: any) => {
    const bounds = new window.google.maps.LatLngBounds();
    const activities = selectedDay 
      ? trip.dailyPlans.find(day => day.day === selectedDay)?.activities || []
      : trip.dailyPlans.flatMap(day => day.activities);

    activities.forEach((activity, index) => {
      // Use geocoding to get coordinates from activity title/location
      const geocoder = new window.google.maps.Geocoder();
      const address = `${activity.activityTitle}, ${trip.destination}`;
      
      geocoder.geocode({ address }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          const position = results[0].geometry.location;
          
          const marker = new window.google.maps.Marker({
            position,
            map: mapInstance,
            title: activity.activityTitle,
            label: (index + 1).toString(),
          });

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="max-width: 300px;">
                <h3>${activity.activityTitle}</h3>
                <p><strong>Time:</strong> ${activity.timeOfDay}</p>
                <p><strong>Duration:</strong> ${activity.duration}</p>
                <p><strong>Cost:</strong> ${activity.estimatedCost}</p>
                <p>${activity.description.substring(0, 100)}...</p>
              </div>
            `,
          });

          marker.addListener('click', () => {
            infoWindow.open(mapInstance, marker);
          });

          bounds.extend(position);
        }
      });
    });

    // Fit map to show all markers
    setTimeout(() => {
      mapInstance.fitBounds(bounds);
    }, 1000);
  };

  const openInGoogleMaps = () => {
    const activities = trip.dailyPlans.flatMap(day => day.activities);
    const waypoints = activities.map(activity => 
      encodeURIComponent(`${activity.activityTitle}, ${trip.destination}`)
    ).join('/');
    
    const url = `https://www.google.com/maps/dir/${waypoints}`;
    window.open(url, '_blank');
  };

  return (
    <div className="w-full h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          {selectedDay ? `Day ${selectedDay} Map` : 'Trip Overview Map'}
        </h3>
        <button
          onClick={openInGoogleMaps}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Open in Google Maps
        </button>
      </div>
      
      <div 
        ref={mapRef} 
        className="w-full h-96 rounded-lg border"
        style={{ minHeight: '400px' }}
      />
      
      {!isLoaded && (
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-500">Loading map...</div>
        </div>
      )}
    </div>
  );
};