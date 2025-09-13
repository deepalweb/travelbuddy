import React, { useEffect, useRef } from 'react';
import { Place } from '../types.ts';
import { Colors } from '../constants.ts';
import { loadGoogleMaps } from '../utils/loadGoogleMaps.ts';

interface GoogleMapViewProps {
  places: Place[];
  userLocation: { latitude: number; longitude: number } | null;
  onSelectPlaceDetail: (place: Place) => void;
  apiKey?: string; // If not provided, component renders fallback
}

const GoogleMapView: React.FC<GoogleMapViewProps> = ({ places, userLocation, onSelectPlaceDetail, apiKey }) => {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  // Allow falling back to env var when prop isn't provided
  const effectiveApiKey = apiKey || (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!effectiveApiKey) return; // no api key => don't init
    let cancelled = false;
    loadGoogleMaps(effectiveApiKey).then((google) => {
      if (cancelled) return;
      if (!ref.current) return;
      const center = userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : { lat: 37.7749, lng: -122.4194 };
      mapRef.current = new google.maps.Map(ref.current, {
        center,
        zoom: 13,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
      });
      // add markers initially
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];
      places.forEach(p => {
        if (p.geometry?.location) {
          const m = new google.maps.Marker({
            position: { lat: p.geometry.location.lat, lng: p.geometry.location.lng },
            map: mapRef.current,
            title: p.name,
          });
          m.addListener('click', () => onSelectPlaceDetail(p));
          markersRef.current.push(m);
        }
      });
    }).catch(() => {
      // ignore load error
    });
    return () => { cancelled = true };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveApiKey]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // refresh markers when places change
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    // compute bounds
    const google = (window as any).google;
    const bounds = new google.maps.LatLngBounds();
    if (userLocation) bounds.extend({ lat: userLocation.latitude, lng: userLocation.longitude });
    places.forEach(p => {
      if (p.geometry?.location) {
        const pos = { lat: p.geometry.location.lat, lng: p.geometry.location.lng };
        const m = new google.maps.Marker({ position: pos, map, title: p.name });
        m.addListener('click', () => onSelectPlaceDetail(p));
        markersRef.current.push(m);
        bounds.extend(pos);
      }
    });
    if (!bounds.isEmpty()) map.fitBounds(bounds);
  }, [places, userLocation, onSelectPlaceDetail]);

  if (!effectiveApiKey) {
    return (
      <div className="h-[60vh] md:h-[70vh] w-full mb-6 flex items-center justify-center rounded-xl" style={{ backgroundColor: Colors.inputBackground, border: `1px solid ${Colors.cardBorder}` }}>
        <p style={{ color: Colors.text_secondary }}>Google Maps API key not set.</p>
      </div>
    );
  }

  return <div ref={ref} className="h-[60vh] md:h-[70vh] w-full mb-6 rounded-xl" style={{ border: `1px solid ${Colors.cardBorder}` }} />;
};

export default GoogleMapView;
