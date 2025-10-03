// Real Places Service - Fetches actual places from Google Places API
export async function fetchFactualPlaces(
  lat: number,
  lng: number,
  category: string,
  radius: number = 5000
): Promise<any[]> {
  try {
    // Use the backend API endpoint that has the Google Places API key
    const response = await fetch(`/api/places/nearby?lat=${lat}&lng=${lng}&q=${encodeURIComponent(category)}&radius=${radius}`);
    
    if (!response.ok) {
      throw new Error(`Places API error: ${response.status}`);
    }
    
    const places = await response.json();
    
    // Filter and enhance the places data
    return places
      .filter((place: any) => place.name && place.place_id)
      .filter((place: any) => (place.rating || 0) >= 3.0)
      .map((place: any) => ({
        place_id: place.place_id,
        name: place.name,
        formatted_address: place.formatted_address || place.vicinity || '',
        rating: place.rating || 0,
        user_ratings_total: place.user_ratings_total || 0,
        types: place.types || ['establishment'],
        geometry: {
          location: {
            lat: place.geometry?.location?.lat || lat,
            lng: place.geometry?.location?.lng || lng
          }
        },
        photos: place.photos || [],
        opening_hours: place.opening_hours,
        price_level: place.price_level
      }));
  } catch (error) {
    console.error('Failed to fetch factual places:', error);
    // Return empty array instead of throwing to allow graceful fallback
    return [];
  }
}