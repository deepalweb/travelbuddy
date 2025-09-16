
export const getCurrentGeoLocation = (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve, reject) => {
    console.log('[Geo] Requesting geolocation...');
    if (!navigator.geolocation) {
      console.error('[Geo] Geolocation is not supported by your browser.');
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('[Geo] Geolocation success:', position.coords);
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.error('[Geo] Geolocation error:', error.code, error.message);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("User denied the request for Geolocation."));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error("Location information is unavailable."));
            break;
          case error.TIMEOUT:
            reject(new Error("The request to get user location timed out."));
            break;
          default:
            reject(new Error("An unknown error occurred while trying to get location."));
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 3000, // 3 seconds
        maximumAge: 0 // Force fresh location, no caching
      }
    );
  });
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
};
