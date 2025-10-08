import 'package:dio/dio.dart';
import '../config/environment.dart';
import '../models/place.dart';
import 'dart:async';

class DealsService {
  static final Dio _dio = Dio(BaseOptions(
    baseUrl: Environment.backendUrl,
    connectTimeout: Duration(seconds: 30),
    receiveTimeout: Duration(seconds: 30),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  ));

  // Test API connectivity
  static Future<void> testApiConnection() async {
    try {
      print('🔍 Testing API connection to: ${Environment.backendUrl}');
      
      // Test basic connectivity
      final healthResponse = await _dio.get('/health').timeout(Duration(seconds: 10));
      print('✅ Health check: ${healthResponse.statusCode} - ${healthResponse.data}');
      
      // Test deals endpoint
      final dealsResponse = await _dio.get('/api/deals', queryParameters: {
        'isActive': 'true',
        'limit': '1'
      }).timeout(Duration(seconds: 10));
      
      print('✅ Deals endpoint: ${dealsResponse.statusCode}');
      print('📊 Response type: ${dealsResponse.data.runtimeType}');
      
      if (dealsResponse.data is List) {
        final List<dynamic> deals = dealsResponse.data;
        print('📊 Deals count: ${deals.length}');
        if (deals.isNotEmpty) {
          print('📊 First deal keys: ${deals[0].keys.toList()}');
        }
      }
      
    } catch (e) {
      print('❌ API connection test failed: $e');
    }
  }

  static Future<List<Deal>> getActiveDeals() async {
    try {
      print('🎯 Fetching deals from: ${Environment.backendUrl}/api/deals?isActive=true&limit=10');
      
      final response = await _dio.get('/api/deals', queryParameters: {
        'isActive': 'true',
        'limit': '10'
      }).timeout(Duration(seconds: 15));
      
      print('📡 Response status: ${response.statusCode}');
      print('📡 Response headers: ${response.headers}');
      
      if (response.statusCode == 200 && response.data != null) {
        final List<dynamic> data = response.data;
        print('✅ Loaded ${data.length} deals from backend');
        
        if (data.isNotEmpty) {
          print('🔍 First deal raw data: ${data[0]}');
          print('🔍 First deal _id: ${data[0]['_id']}');
          print('🔍 First deal title: ${data[0]['title']}');
        }
        
        try {
          final deals = <Deal>[];
          for (int i = 0; i < data.length; i++) {
            try {
              final deal = Deal.fromJson(data[i]);
              deals.add(deal);
              print('✅ Parsed deal ${i + 1}: ${deal.title}');
            } catch (e) {
              print('❌ Error parsing deal ${i + 1}: $e');
              print('🔍 Deal data: ${data[i]}');
            }
          }
          
          if (deals.isNotEmpty) {
            print('✅ Successfully parsed ${deals.length} deals');
            return deals;
          } else {
            print('⚠️ No deals could be parsed, using mock data');
            return _getMockDeals();
          }
        } catch (e) {
          print('❌ Error parsing deals: $e');
          print('🔍 Raw data sample: ${data.take(1).toList()}');
          return _getMockDeals();
        }
      } else {
        print('❌ Invalid response: ${response.statusCode}');
        print('❌ Response data: ${response.data}');
      }
      
      print('🎭 Using mock deals as fallback');
      return _getMockDeals();
    } catch (e) {
      print('❌ Error fetching deals: $e');
      print('🎭 Using mock deals due to error');
      return _getMockDeals();
    }
  }
  
  static List<Deal> _getMockDeals() {
    print('Hot Deals: MOCK data (3 deals)');
    print('! Skipping real deals API - endpoint not implemented');
    print('! Skipping fallback deals service - using places data instead');
    return [
      Deal(
        id: 'mock_1',
        title: '50% Off Pizza',
        description: 'Get 50% off on all pizzas this weekend!',
        discount: '50% OFF',
        placeName: 'Mario\'s Pizza',
        businessType: 'restaurant',
        businessName: 'Mario\'s Pizza',
        images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400'],
        validUntil: DateTime.now().add(Duration(days: 7)),
        views: 245,
        claims: 12,
        price: PriceInfo(amount: 15.99, currencyCode: 'USD'),
      ),
      Deal(
        id: 'mock_2',
        title: 'Free Coffee',
        description: 'Buy one coffee, get one free!',
        discount: 'Buy 1 Get 1',
        placeName: 'Coffee Corner',
        businessType: 'cafe',
        businessName: 'Coffee Corner',
        images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'],
        validUntil: DateTime.now().add(Duration(days: 3)),
        views: 189,
        claims: 8,
        price: PriceInfo(amount: 4.50, currencyCode: 'USD'),
      ),
      Deal(
        id: 'mock_3',
        title: '20% Off Hotel Stay',
        description: 'Special discount on weekend stays',
        discount: '20% OFF',
        placeName: 'Grand Hotel',
        businessType: 'hotel',
        businessName: 'Grand Hotel',
        images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'],
        validUntil: DateTime.now().add(Duration(days: 14)),
        views: 567,
        claims: 23,
        price: PriceInfo(amount: 120.00, currencyCode: 'USD'),
        isPremium: true,
      ),
    ];
  }

  static Future<bool> claimDeal(String dealId) async {
    try {
      print('🎯 Claiming deal: $dealId');
      final response = await _dio.post('/api/deals/$dealId/claim');
      print('✅ Deal claim response: ${response.statusCode}');
      return response.statusCode == 200;
    } catch (e) {
      print('❌ Error claiming deal: $e');
      return false;
    }
  }

  static Future<List<Deal>> getUserDeals(String userId) async {
    try {
      final response = await _dio.get('/api/users/$userId/deals');
      
      if (response.statusCode == 200 && response.data != null) {
        final List<dynamic> data = response.data;
        return data.map((json) => Deal.fromJson(json)).toList();
      }
      
      return [];
    } catch (e) {
      print('❌ Error fetching user deals: $e');
      return [];
    }
  }
}