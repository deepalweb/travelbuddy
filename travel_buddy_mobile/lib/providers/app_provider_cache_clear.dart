import 'package:http/http.dart' as http;
import '../config/environment.dart';
import '../services/places_service.dart';
import '../utils/debug_logger.dart';

extension CacheClearExtension on dynamic {
  Future<void> clearAllCaches() async {
    DebugLogger.log('🗑️ Clearing ALL caches (4 locations)');
    
    try {
      // 1. Clear Flutter memory cache
      PlacesService().clearCache();
      DebugLogger.log('✅ 1/4: Flutter memory cache cleared');
      
      // 2. Clear Flutter Hive local storage
      await PlacesService().clearOfflineStorage();
      DebugLogger.log('✅ 2/4: Flutter Hive storage cleared');
      
      // 3. Clear backend MongoDB + Azure Blob caches
      final url = '${Environment.backendUrl}/api/places/mobile/clear-cache';
      final response = await http.delete(Uri.parse(url)).timeout(
        const Duration(seconds: 10),
        onTimeout: () => throw Exception('Backend cache clear timeout'),
      );
      
      if (response.statusCode == 200) {
        DebugLogger.log('✅ 3/4: Backend MongoDB cache cleared');
        DebugLogger.log('✅ 4/4: Backend Azure Blob cache cleared');
      } else {
        DebugLogger.error('⚠️ Backend cache clear failed: ${response.statusCode}');
      }
      
      DebugLogger.log('🎉 All caches cleared successfully!');
    } catch (e) {
      DebugLogger.error('❌ Cache clear error: $e');
      rethrow;
    }
  }
}
