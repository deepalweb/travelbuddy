// Update your mobile app API service

class DishesApiService {
  // Use your Azure backend URL
  static const String baseUrl = 'https://your-azure-app.azurewebsites.net/api';
  
  static final Dio _dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: Duration(minutes: 2),
    receiveTimeout: Duration(minutes: 2),
    headers: {'Content-Type': 'application/json'},
  ));
  
  static Future<List<Dish>> getLocalDishes(double lat, double lng) async {
    try {
      final response = await _dio.post('/dishes/generate', data: {
        'latitude': lat,
        'longitude': lng,
      });
      
      return (response.data['dishes'] as List)
          .map((json) => Dish.fromJson(json))
          .toList();
    } catch (e) {
      throw Exception('Failed to load dishes: $e');
    }
  }
}