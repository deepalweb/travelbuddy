import { Place } from '../types';

interface Location {
  lat: number;
  lng: number;
}

// Calculate distance between two points using Haversine formula
const calculateDistance = (point1: Location, point2: Location): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Simple nearest neighbor algorithm for route optimization
export const optimizeRoute = (places: Place[], startLocation?: Location): Place[] => {
  if (places.length <= 2) return places;

  const unvisited = [...places];
  const optimized: Place[] = [];
  
  // Start from user location or first place
  let currentLocation: Location = startLocation || {
    lat: places[0].geometry?.location?.lat || 0,
    lng: places[0].geometry?.location?.lng || 0
  };

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let shortestDistance = Infinity;

    // Find nearest unvisited place
    unvisited.forEach((place, index) => {
      const placeLocation = {
        lat: place.geometry?.location?.lat || 0,
        lng: place.geometry?.location?.lng || 0
      };
      const distance = calculateDistance(currentLocation, placeLocation);
      
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestIndex = index;
      }
    });

    // Add nearest place to optimized route
    const nearestPlace = unvisited.splice(nearestIndex, 1)[0];
    optimized.push(nearestPlace);
    
    // Update current location
    currentLocation = {
      lat: nearestPlace.geometry?.location?.lat || 0,
      lng: nearestPlace.geometry?.location?.lng || 0
    };
  }

  return optimized;
};

// Calculate total route distance and time
export const calculateRouteStats = (places: Place[]): {totalDistance: number, estimatedTime: number} => {
  if (places.length < 2) return {totalDistance: 0, estimatedTime: 0};

  let totalDistance = 0;
  for (let i = 0; i < places.length - 1; i++) {
    const current = {
      lat: places[i].geometry?.location?.lat || 0,
      lng: places[i].geometry?.location?.lng || 0
    };
    const next = {
      lat: places[i + 1].geometry?.location?.lat || 0,
      lng: places[i + 1].geometry?.location?.lng || 0
    };
    totalDistance += calculateDistance(current, next);
  }

  // Estimate time: 30 km/h average speed + 5 min per stop
  const estimatedTime = (totalDistance / 30) * 60 + (places.length * 5);
  
  return {totalDistance: Math.round(totalDistance * 10) / 10, estimatedTime: Math.round(estimatedTime)};
};