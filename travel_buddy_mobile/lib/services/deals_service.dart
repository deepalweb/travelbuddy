import 'package:dio/dio.dart';
import '../config/environment.dart';
import '../models/place.dart';
import '../services/storage_service.dart';
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
      
      // Test deals endpoint with different limits
      print('\n📊 Testing deals endpoint with limit=1000...');
      final dealsResponse = await _dio.get('/api/deals', queryParameters: {
        'isActive': 'true',
        'limit': '1000'
      }).timeout(Duration(seconds: 10));
      
      print('✅ Deals endpoint: ${dealsResponse.statusCode}');
      print('📊 Response type: ${dealsResponse.data.runtimeType}');
      
      if (dealsResponse.data is Map) {
        final dealsData = dealsResponse.data;
        print('📊 Response keys: ${dealsData.keys.toList()}');
        if (dealsData['deals'] is List) {
          final List<dynamic> deals = dealsData['deals'];
          print('📊 Total deals returned: ${deals.length}');
          if (deals.isNotEmpty) {
            print('📊 First deal: ${deals[0]['title']}');
            print('📊 Last deal: ${deals[deals.length - 1]['title']}');
          }
        }
      } else if (dealsResponse.data is List) {
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
    return getDealsWithPagination(page: 1, limit: 1000);
  }
  
  static Future<List<Deal>> getDealsWithPagination({required int page, required int limit}) async {
    try {
      final offset = (page - 1) * limit;
      print('🎯 Fetching deals page $page (offset: $offset, limit: $limit)');
      
      final response = await _dio.get('/api/deals', 
        queryParameters: {
          'isActive': 'true',
          'limit': limit.toString(),
          'skip': offset.toString(),
          '_t': DateTime.now().millisecondsSinceEpoch.toString()
        },
        options: Options(
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        )
      ).timeout(Duration(seconds: 15));
      
      print('📡 Response status: ${response.statusCode}');
      print('📡 Response data type: ${response.data.runtimeType}');
      
      if (response.statusCode == 200 && response.data != null) {
        // Backend returns {deals: [...], newDealsCount: 0}
        final responseData = response.data;
        print('📊 Response structure: ${responseData is Map ? "Map" : "List"}');
        
        if (responseData is Map) {
          print('📊 Response keys: ${responseData.keys.toList()}');
          if (responseData['deals'] != null) {
            print('📊 Deals array length: ${(responseData['deals'] as List).length}');
          }
        }
        
        final List<dynamic> data = responseData is Map && responseData['deals'] != null 
            ? responseData['deals'] 
            : (responseData is List ? responseData : []);
        
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
            
            // Cache deals for offline use (only first page)
            if (page == 1) {
              try {
                final storageService = StorageService();
                await storageService.cacheDeals(deals);
                print('💾 Cached ${deals.length} deals for offline use');
              } catch (e) {
                print('⚠️ Failed to cache deals: $e');
              }
            }
            
            return deals;
          }
        } catch (e) {
          print('❌ Error parsing deals: $e');
        }
      }
      
      return [];
    } catch (e) {
      print('❌ Error fetching deals: $e');
      
      // Try to load from cache if offline (only for first page)
      if (page == 1) {
        try {
          final storageService = StorageService();
          final cachedDeals = await storageService.getCachedDeals();
          if (cachedDeals.isNotEmpty) {
            print('💾 Loaded ${cachedDeals.length} deals from cache (offline mode)');
            return cachedDeals;
          }
        } catch (cacheError) {
          print('❌ Cache error: $cacheError');
        }
      }
      
      return [];
    }
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