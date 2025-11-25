import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/environment.dart';
import '../utils/debug_logger.dart';
import '../models/event_model.dart';

class EventService {
  static const String _endpoint = '/api/events';

  static Future<List<EventModel>> getEvents({
    String? category,
    String? location,
    DateTime? startDate,
  }) async {
    try {
      DebugLogger.info('🎉 Fetching events from API...');
      
      final queryParams = <String, String>{};
      if (category != null && category.isNotEmpty) queryParams['category'] = category;
      if (location != null && location.isNotEmpty) queryParams['location'] = location;
      if (startDate != null) queryParams['startDate'] = startDate.toIso8601String();
      
      final uri = Uri.parse('${Environment.backendUrl}$_endpoint')
          .replace(queryParameters: queryParams.isNotEmpty ? queryParams : null);
      
      print('📡 API URL: $uri');
      
      final response = await http.get(
        uri,
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 15));

      print('📥 API Response: ${response.statusCode}');

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> eventsList = data is List ? data : (data['events'] ?? []);
        
        if (eventsList.isEmpty) {
          print('⚠️ API returned empty list, using mock data');
          return _getMockEvents();
        }
        
        final events = eventsList.map((json) => EventModel.fromJson(json)).toList();
        print('✅ Using REAL API data: ${events.length} events');
        return events;
      } else {
        print('⚠️ API returned ${response.statusCode}, using mock data');
        return _getMockEvents();
      }
    } catch (e) {
      print('❌ API call failed: $e');
      print('🔄 Falling back to mock data');
      return _getMockEvents();
    }
  }

  static List<EventModel> _getMockEvents() {
    final now = DateTime.now();
    return [
      EventModel(
        id: '1',
        title: 'Kandy Esala Perahera',
        description: 'The most spectacular cultural pageant in Sri Lanka featuring traditional dancers, drummers, and decorated elephants.',
        category: 'Cultural',
        imageUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop',
        location: 'Kandy',
        startDate: now.add(const Duration(days: 15)),
        endDate: now.add(const Duration(days: 25)),
        venue: 'Temple of the Tooth, Kandy',
        ticketPrice: null,
        isFree: true,
        tags: ['Cultural', 'Traditional', 'Festival'],
        organizer: 'Temple of the Sacred Tooth Relic',
      ),
      EventModel(
        id: '2',
        title: 'Colombo Food Festival',
        description: 'Experience the best of Sri Lankan and international cuisine with over 50 food stalls and live cooking demonstrations.',
        category: 'Food',
        imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop',
        location: 'Colombo',
        startDate: now.add(const Duration(days: 5)),
        endDate: now.add(const Duration(days: 7)),
        venue: 'Galle Face Green',
        ticketPrice: 500,
        ticketUrl: 'https://example.com/tickets',
        isFree: false,
        tags: ['Food', 'Festival', 'Family'],
        organizer: 'Colombo Events Ltd',
      ),
      EventModel(
        id: '3',
        title: 'Galle Literary Festival',
        description: 'International writers, poets, and thinkers gather for discussions, readings, and workshops.',
        category: 'Arts',
        imageUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&auto=format&fit=crop',
        location: 'Galle',
        startDate: now.add(const Duration(days: 30)),
        endDate: now.add(const Duration(days: 33)),
        venue: 'Galle Fort',
        ticketPrice: 2000,
        ticketUrl: 'https://example.com/tickets',
        isFree: false,
        tags: ['Arts', 'Literature', 'Cultural'],
        organizer: 'Galle Literary Foundation',
      ),
      EventModel(
        id: '4',
        title: 'Colombo Music Festival',
        description: 'Three days of live music featuring local and international artists across multiple genres.',
        category: 'Music',
        imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&auto=format&fit=crop',
        location: 'Colombo',
        startDate: now.add(const Duration(days: 20)),
        endDate: now.add(const Duration(days: 22)),
        venue: 'Sugathadasa Stadium',
        ticketPrice: 3500,
        ticketUrl: 'https://example.com/tickets',
        isFree: false,
        tags: ['Music', 'Concert', 'Entertainment'],
        organizer: 'Live Events Sri Lanka',
      ),
      EventModel(
        id: '5',
        title: 'Vesak Festival',
        description: 'Celebrate the birth, enlightenment, and passing of Buddha with colorful lanterns and decorations across the island.',
        category: 'Religious',
        imageUrl: 'https://images.unsplash.com/photo-1604881991720-f91add269bed?w=800&auto=format&fit=crop',
        location: 'Island-wide',
        startDate: now.add(const Duration(days: 60)),
        endDate: now.add(const Duration(days: 62)),
        venue: 'Temples across Sri Lanka',
        ticketPrice: null,
        isFree: true,
        tags: ['Religious', 'Cultural', 'Festival'],
        organizer: 'Buddhist Temples',
      ),
    ];
  }
}
