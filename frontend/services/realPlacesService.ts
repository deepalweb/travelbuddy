// Real Places Service - Fetches actual places from Google Places API
export async function fetchFactualPlaces(
  lat: number,
  lng: number,
  category: string,
  radius: number = 5000
): Promise<any[]> {
  try {
    // Direct Google Places API call (since we're in backend context)
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.warn('Google Places API key not configured');
      return [];
    }

    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(category)}&location=${lat},${lng}&radius=${radius}&key=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Places API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status !== 'OK') {
      console.warn(`Places API status: ${data.status}`);
      return [];
    }
    
    const places = data.results || [];
    
    // Filter and enhance the places data
    return places
      .filter((place: any) => place.name && place.place_id)
      .filter((place: any) => (place.rating || 0) >= 3.0)
      .slice(0, 10) // Limit results
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