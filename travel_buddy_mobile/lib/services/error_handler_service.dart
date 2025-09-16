import 'package:flutter/foundation.dart';

class ErrorHandlerService {
  static void handleError(String context, dynamic error, StackTrace? stackTrace) {
    if (kDebugMode) {
      print('🚨 ERROR in $context: $error');
      if (stackTrace != null) {
        print('📍 Stack trace: $stackTrace');
      }
    }
  }

  static List<T> safeListCast<T>(dynamic data, String context) {
    try {
      if (data == null) {
        if (kDebugMode) print('⚠️ Null data in $context, returning empty list');
        return <T>[];
      }
      
      if (data is List) {
        return List<T>.from(data);
      }
      
      if (kDebugMode) print('⚠️ Expected List but got ${data.runtimeType} in $context');
      return <T>[];
    } catch (e) {
      if (kDebugMode) print('🚨 Error casting to List<$T> in $context: $e');
      return <T>[];
    }
  }

  static Map<String, dynamic> safeMapCast(dynamic data, String context) {
    try {
      if (data == null) {
        if (kDebugMode) print('⚠️ Null data in $context, returning empty map');
        return <String, dynamic>{};
      }
      
      if (data is Map) {
        return Map<String, dynamic>.from(data);
      }
      
      if (kDebugMode) print('⚠️ Expected Map but got ${data.runtimeType} in $context');
      return <String, dynamic>{};
    } catch (e) {
      if (kDebugMode) print('🚨 Error casting to Map in $context: $e');
      return <String, dynamic>{};
    }
  }
}