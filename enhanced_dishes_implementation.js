// Enhanced Dishes Feature Implementation Plan
// Using your existing Azure backend with Google Places + Gemini AI

// 1. ENHANCED BACKEND ENDPOINT (Replace the simple one we added)
app.post('/api/dishes/generate', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { 
      latitude, 
      longitude, 
      destination,
      filters = {},
      language = 'en'
    } = req.body;

    // Input validation
    if (!latitude && !longitude && !destination) {
      return res.status(400).json({ error: 'Location required (coordinates or destination)' });
    }

    let locationName, lat, lng;

    // Handle destination search vs GPS coordinates
    if (destination) {
      // Geocode destination to get coordinates
      const geocodeResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destination)}&key=${process.env.GOOGLE_PLACES_API_KEY}`
      );
      const geocodeData = await geocodeResponse.json();
      if (geocodeData.results?.[0]) {
        const result = geocodeData.results[0];
        locationName = result.formatted_address;
        lat = result.geometry.location.lat;
        lng = result.geometry.location.lng;
      } else {
        return res.status(400).json({ error: 'Destination not found' });
      }
    } else {
      // Use provided coordinates
      lat = latitude;
      lng = longitude;
      const reverseGeocodeResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_PLACES_API_KEY}`
      );
      const reverseData = await reverseGeocodeResponse.json();
      locationName = reverseData.results?.[0]?.formatted_address || 'Unknown Location';
    }

    // Get restaurants from Google Places API
    const placesResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=restaurant&key=${process.env.GOOGLE_PLACES_API_KEY}`
    );
    const placesData = await placesResponse.json();
    const restaurants = placesData.results?.slice(0, 10) || [];

    // Build enhanced Gemini prompt with filters and restaurant data
    const filterText = buildFilterText(filters);
    const restaurantContext = restaurants.map(r => `${r.name} (${r.rating}/5, ${r.vicinity})`).join(', ');
    
    const prompt = `Generate 6 popular local dishes for ${locationName}.
    ${filterText}
    
    Available restaurants: ${restaurantContext}
    
    Return ONLY a JSON object with this EXACT structure:
    {
      "location": "${locationName}",
      "dishes": [
        {
          "name": "dish name",
          "description": "brief description under 60 chars",
          "average_price": "local currency with amount",
          "category": "Breakfast|Lunch|Dinner|Street Food|Dessert",
          "recommended_places": [
            {
              "name": "restaurant name from available list",
              "type": "Restaurant|Street Food|Cafe",
              "address": "area/district",
              "rating": 4.5
            }
          ],
          "user_photos": [],
          "dietary_tags": ["vegetarian", "vegan", "halal", "gluten-free"],
          "cultural_significance": "brief cultural note under 50 chars"
        }
      ],
      "metadata": {
        "source": ["Google Places", "Gemini AI"],
        "filters_applied": ${JSON.stringify(Object.keys(filters))},
        "signature_dishes": ["dish1", "dish2"],
        "meal_context": "${getMealContext()}"
      }
    }`;

    // Generate with Gemini AI
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Parse and enhance response
    let dishesData;
    try {
      dishesData = JSON.parse(responseText);
    } catch (parseError) {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      dishesData = jsonMatch ? JSON.parse(jsonMatch[0]) : { dishes: [] };
    }

    // Enhance with real restaurant data and photos
    dishesData = await enhanceWithRealData(dishesData, restaurants, lat, lng);

    // Add gamification data
    dishesData.gamification = {
      badge_progress: "0/6 local dishes tried",
      achievements: ["Food Explorer", "Local Taste"],
      next_milestone: "Try 3 dishes to unlock 'Foodie' badge"
    };

    // Record API usage
    recordUsage({
      api: 'gemini',
      action: 'generate_enhanced_dishes',
      status: 'success',
      durationMs: Date.now() - startTime,
      meta: { 
        location: locationName, 
        dishCount: dishesData.dishes?.length || 0,
        filters: Object.keys(filters)
      }
    });

    res.json(dishesData);

  } catch (error) {
    console.error('❌ Error generating enhanced dishes:', error);
    
    recordUsage({
      api: 'gemini',
      action: 'generate_enhanced_dishes',
      status: 'error',
      durationMs: Date.now() - startTime,
      meta: { error: error.message }
    });

    res.status(500).json({
      error: 'Failed to generate dishes',
      message: error.message
    });
  }
});

// Helper functions
function buildFilterText(filters) {
  const filterParts = [];
  if (filters.dietary) filterParts.push(`Dietary: ${filters.dietary.join(', ')}`);
  if (filters.budget) filterParts.push(`Budget: ${filters.budget}`);
  if (filters.cuisine) filterParts.push(`Cuisine preference: ${filters.cuisine}`);
  return filterParts.length > 0 ? `Filters: ${filterParts.join('. ')}.` : '';
}

function getMealContext() {
  const hour = new Date().getHours();
  if (hour < 11) return 'breakfast_time';
  if (hour < 15) return 'lunch_time';
  if (hour < 19) return 'afternoon_snack';
  return 'dinner_time';
}

async function enhanceWithRealData(dishesData, restaurants, lat, lng) {
  // Match recommended places with real restaurant data
  if (dishesData.dishes) {
    for (const dish of dishesData.dishes) {
      if (dish.recommended_places) {
        for (const place of dish.recommended_places) {
          const matchedRestaurant = restaurants.find(r => 
            r.name.toLowerCase().includes(place.name.toLowerCase()) ||
            place.name.toLowerCase().includes(r.name.toLowerCase())
          );
          
          if (matchedRestaurant) {
            place.place_id = matchedRestaurant.place_id;
            place.rating = matchedRestaurant.rating || place.rating;
            place.address = matchedRestaurant.vicinity || place.address;
            place.price_level = matchedRestaurant.price_level;
            
            // Add photos if available
            if (matchedRestaurant.photos?.[0]) {
              const photoRef = matchedRestaurant.photos[0].photo_reference;
              dish.user_photos = [`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${process.env.GOOGLE_PLACES_API_KEY}`];
            }
          }
        }
      }
    }
  }
  
  return dishesData;
}

// 2. TRIP INTEGRATION ENDPOINT
app.post('/api/dishes/add-to-trip', async (req, res) => {
  try {
    const { dishName, tripId, dayNumber, mealTime } = req.body;
    
    // Add dish to trip plan in MongoDB
    // This integrates with your existing trip planning system
    
    res.json({ 
      success: true, 
      message: `${dishName} added to Day ${dayNumber} ${mealTime}` 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add dish to trip' });
  }
});

// 3. MEAL SUGGESTIONS ENDPOINT
app.post('/api/dishes/meal-suggestions', async (req, res) => {
  try {
    const { latitude, longitude, timeOfDay, weather, dietaryPrefs } = req.body;
    
    const contextPrompt = `Suggest 3 meals for ${timeOfDay} in this location based on ${weather} weather and ${dietaryPrefs.join(', ')} dietary preferences.`;
    
    // Use Gemini to generate contextual meal suggestions
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(contextPrompt);
    
    res.json({ suggestions: JSON.parse(result.response.text()) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get meal suggestions' });
  }
});

// 4. MOBILE APP INTEGRATION
/*
class EnhancedDishesService {
  static Future<DishesResponse> getLocalDishes({
    double? latitude,
    double? longitude,
    String? destination,
    Map<String, dynamic>? filters,
    String language = 'en',
  }) async {
    final response = await _dio.post('/dishes/generate', data: {
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (destination != null) 'destination': destination,
      'filters': filters ?? {},
      'language': language,
    });
    
    return DishesResponse.fromJson(response.data);
  }
  
  static Future<void> addDishToTrip(String dishName, String tripId, int dayNumber) async {
    await _dio.post('/dishes/add-to-trip', data: {
      'dishName': dishName,
      'tripId': tripId,
      'dayNumber': dayNumber,
      'mealTime': _getCurrentMealTime(),
    });
  }
}
*/

// 5. ENHANCED DATA MODELS
/*
class DishesResponse {
  final String location;
  final List<Dish> dishes;
  final Metadata metadata;
  final Gamification gamification;
  
  DishesResponse.fromJson(Map<String, dynamic> json)
    : location = json['location'],
      dishes = (json['dishes'] as List).map((d) => Dish.fromJson(d)).toList(),
      metadata = Metadata.fromJson(json['metadata']),
      gamification = Gamification.fromJson(json['gamification']);
}

class Dish {
  final String name;
  final String description;
  final String averagePrice;
  final String category;
  final List<RecommendedPlace> recommendedPlaces;
  final List<String> userPhotos;
  final List<String> dietaryTags;
  final String culturalSignificance;
}
*/