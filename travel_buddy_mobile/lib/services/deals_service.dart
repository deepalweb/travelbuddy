import 'package:dio/dio.dart';
import '../config/environment.dart';
import '../models/place.dart';
import 'dart:async';

class DealsService {
  static final Dio _dio = Dio(BaseOptions(
    baseUrl: Environment.backendUrl,
    connectTimeout: Duration(seconds: 30),
    receiveTimeout: Duration(seconds: 30),
  ));

  static Future<List<Deal>> getActiveDeals() async {
    try {
      print('🎯 Fetching deals from: ${Environment.backendUrl}/api/deals');
      
      final response = await _dio.get('/api/deals').timeout(Duration(seconds: 15));
      
      if (response.statusCode == 200 && response.data != null) {
        final List<dynamic> data = response.data;
        print('✅ Loaded ${data.length} deals from backend');
        print('🔍 First deal data: ${data.isNotEmpty ? data[0] : 'No deals'}');
        
        try {
          final deals = data.map((json) => Deal.fromJson(json)).toList();
          print('✅ Successfully parsed ${deals.length} deals');
          return deals;
        } catch (e) {
          print('❌ Error parsing deals: $e');
          print('🔍 Raw data: $data');
          return _getMockDeals();
        }
      }
      
      return _getMockDeals();
    } catch (e) {
      print('❌ Error fetching deals: $e');
      return _getMockDeals();
    }
  }
  
  static List<Deal> _getMockDeals() {
    print('🎭 Using mock deals for demo');
    return [
      Deal(
        id: 'mock_1',
        title: '50% Off Pizza',
        description: 'Get 50% off on all pizzas this weekend!',
        discount: '50% OFF',
        placeName: 'Mario\'s Pizza',
        businessType: 'restaurant',
        businessName: 'Mario\'s Pizza',
        images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b'],
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
        images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085'],
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
        images: ['https://images.unsplash.com/photo-1566073771259-6a8506099945'],
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
      final response = await _dio.post('/api/deals/$dealId/claim');
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