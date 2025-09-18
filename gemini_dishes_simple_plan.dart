// 🍴 Simple Gemini AI Dishes System
// Flow: Mobile App → User Location → Backend → Gemini AI → Generated Content → Mobile App

// 1. MOBILE APP - Location Detection & API Call
class DishesService {
  static const String baseUrl = 'https://api.travelbuddy.com';
  
  Future<List<Dish>> getLocalDishes() async {
    // Get user location
    final position = await Geolocator.getCurrentPosition();
    
    // Send to backend
    final response = await http.post(
      Uri.parse('$baseUrl/dishes/generate'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'latitude': position.latitude,
        'longitude': position.longitude,
      }),
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return (data['dishes'] as List)
          .map((json) => Dish.fromJson(json))
          .toList();
    }
    throw Exception('Failed to generate dishes');
  }
}

// 2. MOBILE APP - Simple Data Model
class Dish {
  final String name;
  final String description;
  final String price;
  final String priceRange;
  final String restaurant;
  final String cuisine;
  final double rating;
  final List<String> dietaryTags;
  final String culturalNote;
  
  Dish.fromJson(Map<String, dynamic> json)
    : name = json['name'],
      description = json['description'],
      price = json['price'],
      priceRange = json['priceRange'],
      restaurant = json['restaurant'],
      cuisine = json['cuisine'],
      rating = json['rating'].toDouble(),
      dietaryTags = List<String>.from(json['dietaryTags']),
      culturalNote = json['culturalNote'];
}

// 3. MOBILE APP - Simple Provider
class DishesProvider extends ChangeNotifier {
  List<Dish> _dishes = [];
  bool _isLoading = false;
  String? _error;
  
  List<Dish> get dishes => _dishes;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  Future<void> loadDishes() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      _dishes = await DishesService().getLocalDishes();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}

// 4. MOBILE APP - Simple UI Widget
class GeminiDishesSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<DishesProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading) {
          return Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Row(
                children: [
                  CircularProgressIndicator(),
                  SizedBox(width: 12),
                  Text('AI is discovering local dishes...'),
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
                  Text('Failed to load dishes'),
                  ElevatedButton(
                    onPressed: () => provider.loadDishes(),
                    child: Text('Retry'),
                  ),
                ],
              ),
            ),
          );
        }
        
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('AI Local Dishes 🤖🍴', 
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            SizedBox(height: 12),
            SizedBox(
              height: 200,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: provider.dishes.length,
                itemBuilder: (context, index) {
                  final dish = provider.dishes[index];
                  return Container(
                    width: 160,
                    margin: EdgeInsets.only(right: 12),
                    child: Card(
                      child: Padding(
                        padding: EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(dish.name, 
                              style: TextStyle(fontWeight: FontWeight.bold)),
                            SizedBox(height: 4),
                            Text(dish.price, 
                              style: TextStyle(color: Colors.green)),
                            SizedBox(height: 4),
                            Text(dish.restaurant, 
                              style: TextStyle(fontSize: 12, color: Colors.grey)),
                            SizedBox(height: 8),
                            Expanded(
                              child: Text(dish.description, 
                                style: TextStyle(fontSize: 11),
                                maxLines: 3,
                                overflow: TextOverflow.ellipsis),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        );
      },
    );
  }
}

// 5. BACKEND - Gemini AI Integration (Node.js/Python)
/*
// Backend API Endpoint
app.post('/dishes/generate', async (req, res) => {
  const { latitude, longitude } = req.body;
  
  try {
    // 1. Get location name from coordinates
    const locationName = await getLocationName(latitude, longitude);
    
    // 2. Generate dishes using Gemini AI
    const prompt = `
      Generate 8 popular local dishes for ${locationName}.
      For each dish, provide:
      - Name
      - Brief description (1 sentence)
      - Average price in local currency
      - Price range (budget/mid-range/fine-dining)
      - Popular restaurant name
      - Cuisine type
      - Rating (1-5)
      - Dietary tags (vegetarian, vegan, gluten-free, halal, etc.)
      - Cultural note (1 sentence)
      
      Return as JSON array.
    `;
    
    const geminiResponse = await gemini.generateContent(prompt);
    const dishes = JSON.parse(geminiResponse.text());
    
    res.json({ dishes });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate dishes' });
  }
});

// Helper function
async function getLocationName(lat, lng) {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`
  );
  const data = await response.json();
  return data.results[0].formatted_address;
}
*/

// 6. EXAMPLE GEMINI RESPONSE
/*
{
  "dishes": [
    {
      "name": "Kottu Roti",
      "description": "Stir-fried chopped roti with vegetables and meat",
      "price": "LKR 450",
      "priceRange": "budget",
      "restaurant": "Pilawoos",
      "cuisine": "Sri Lankan",
      "rating": 4.5,
      "dietaryTags": ["halal", "can-be-vegetarian"],
      "culturalNote": "Popular late-night street food in Sri Lanka"
    },
    {
      "name": "String Hoppers",
      "description": "Steamed rice noodle nests served with curry",
      "price": "LKR 250",
      "priceRange": "budget",
      "restaurant": "Upali's",
      "cuisine": "Sri Lankan",
      "rating": 4.2,
      "dietaryTags": ["vegetarian", "vegan", "gluten-free"],
      "culturalNote": "Traditional breakfast dish in Sri Lankan households"
    }
  ]
}
*/

// 7. USAGE IN APP
class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    // Load dishes when screen loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DishesProvider>().loadDishes();
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          children: [
            // Other sections...
            GeminiDishesSection(),
            // More sections...
          ],
        ),
      ),
    );
  }
}