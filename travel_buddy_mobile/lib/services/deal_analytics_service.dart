import '../services/api_service.dart';

class DealAnalyticsService {
  static final ApiService _apiService = ApiService();

  static Future<void> trackDealView(String dealId, String userId) async {
    try {
      await _apiService.trackUserAction(userId, {
        'action': 'deal_view',
        'category': 'deals',
        'dealId': dealId,
        'timestamp': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      print('Error tracking deal view: $e');
    }
  }

  static Future<void> trackDealClaim(String dealId, String userId) async {
    try {
      await _apiService.trackUserAction(userId, {
        'action': 'deal_claim',
        'category': 'deals',
        'dealId': dealId,
        'timestamp': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      print('Error tracking deal claim: $e');
    }
  }

  static Future<void> trackDealShare(String dealId, String userId) async {
    try {
      await _apiService.trackUserAction(userId, {
        'action': 'deal_share',
        'category': 'deals',
        'dealId': dealId,
        'timestamp': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      print('Error tracking deal share: $e');
    }
  }

  static Future<Map<String, dynamic>> getDealAnalytics(String dealId) async {
    try {
      // This would be a specific endpoint for deal analytics
      return await _apiService.getUserAnalytics(dealId);
    } catch (e) {
      print('Error fetching deal analytics: $e');
      return {};
    }
  }
}