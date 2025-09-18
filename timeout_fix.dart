// Quick Timeout Fix for Dishes API

// 1. INCREASE TIMEOUT IN DIO CLIENT
class DishesApiService {
  late final Dio _dio;
  
  DishesApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: 'https://api.travelbuddy.com',
      connectTimeout: Duration(minutes: 2), // Increase to 2 minutes
      receiveTimeout: Duration(minutes: 2), // Increase to 2 minutes
      sendTimeout: Duration(minutes: 1),
    ));
  }
  
  Future<List<Dish>> getLocalDishes(double lat, double lng) async {
    try {
      final response = await _dio.post('/dishes/generate', data: {
        'latitude': lat,
        'longitude': lng,
      });
      
      return (response.data['dishes'] as List)
          .map((json) => Dish.fromJson(json))
          .toList();
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionTimeout) {
        throw Exception('Server is taking too long. Please try again.');
      }
      throw Exception('Failed to load dishes: ${e.message}');
    }
  }
}

// 2. ADD LOADING STATES WITH PROGRESS
class DishesProvider extends ChangeNotifier {
  List<Dish> _dishes = [];
  bool _isLoading = false;
  String? _error;
  String _loadingMessage = 'Loading...';
  
  String get loadingMessage => _loadingMessage;
  
  Future<void> loadDishes() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      // Show progress messages
      _loadingMessage = 'Getting your location...';
      notifyListeners();
      
      final position = await Geolocator.getCurrentPosition();
      
      _loadingMessage = 'AI is discovering local dishes...';
      notifyListeners();
      
      _dishes = await DishesApiService().getLocalDishes(
        position.latitude, 
        position.longitude
      );
      
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      _loadingMessage = 'Loading...';
      notifyListeners();
    }
  }
}

// 3. BETTER UI WITH PROGRESS INDICATOR
class GeminiDishesSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<DishesProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading) {
          return Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 12),
                  Text(provider.loadingMessage),
                  SizedBox(height: 8),
                  Text(
                    'This may take up to 2 minutes...',
                    style: TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ],
              ),
            ),
          );
        }
        
        if (provider.error != null) {
          return Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Column(
                children: [
                  Icon(Icons.error, color: Colors.red),
                  SizedBox(height: 8),
                  Text('Timeout Error'),
                  SizedBox(height: 4),
                  Text(
                    'Server took too long to respond',
                    style: TextStyle(fontSize: 12),
                  ),
                  SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      ElevatedButton(
                        onPressed: () => provider.loadDishes(),
                        child: Text('Retry'),
                      ),
                      TextButton(
                        onPressed: () => _showMockData(context),
                        child: Text('Show Sample'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        }
        
        // Rest of the UI...
        return _buildDishesContent(provider.dishes);
      },
    );
  }
  
  void _showMockData(BuildContext context) {
    // Show sample dishes while backend is being fixed
    final mockDishes = [
      Dish(
        name: 'Kottu Roti',
        description: 'Stir-fried chopped roti with vegetables',
        price: 'LKR 450',
        priceRange: 'budget',
        restaurant: 'Local Street Food',
        cuisine: 'Sri Lankan',
        rating: 4.5,
        dietaryTags: ['halal'],
        culturalNote: 'Popular late-night street food',
      ),
      // Add more mock dishes...
    ];
    
    // Update provider with mock data
    context.read<DishesProvider>().setMockData(mockDishes);
  }
}

// 4. BACKEND OPTIMIZATION (Node.js/Python)
/*
// Optimize backend response time
app.post('/dishes/generate', async (req, res) => {
  const { latitude, longitude } = req.body;
  
  try {
    // Set response timeout
    res.setTimeout(90000); // 90 seconds max
    
    // Quick location lookup (cache this)
    const locationName = await getLocationNameFast(latitude, longitude);
    
    // Shorter, more focused Gemini prompt
    const prompt = `Generate 6 local dishes for ${locationName}. 
    Return JSON array with: name, description, price, priceRange, restaurant, cuisine, rating, dietaryTags, culturalNote.
    Keep descriptions under 50 characters.`;
    
    // Use faster Gemini model if available
    const geminiResponse = await gemini.generateContent(prompt, {
      temperature: 0.7,
      maxOutputTokens: 1000, // Limit output for speed
    });
    
    const dishes = JSON.parse(geminiResponse.text());
    
    res.json({ 
      dishes,
      generatedAt: new Date().toISOString(),
      location: locationName 
    });
    
  } catch (error) {
    console.error('Dishes generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate dishes',
      message: error.message 
    });
  }
});

// Cache location lookups
const locationCache = new Map();
async function getLocationNameFast(lat, lng) {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  if (locationCache.has(key)) {
    return locationCache.get(key);
  }
  
  const location = await geocodeLocation(lat, lng);
  locationCache.set(key, location);
  return location;
}
*/

// 5. FALLBACK STRATEGY
class DishesProvider extends ChangeNotifier {
  // Add fallback method
  Future<void> loadDishesWithFallback() async {
    try {
      await loadDishes();
    } catch (e) {
      // If API fails, load cached or mock data
      _dishes = await _loadCachedDishes() ?? _getMockDishes();
      notifyListeners();
    }
  }
  
  List<Dish> _getMockDishes() {
    return [
      Dish(name: 'Local Dish 1', description: 'Sample dish', price: '\$10'),
      Dish(name: 'Local Dish 2', description: 'Another sample', price: '\$15'),
    ];
  }
}