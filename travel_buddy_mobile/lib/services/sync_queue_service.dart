import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:http/http.dart' as http;
import '../config/environment.dart';

class SyncQueueService {
  static final SyncQueueService _instance = SyncQueueService._internal();
  factory SyncQueueService() => _instance;
  SyncQueueService._internal();

  static const String _queueKey = 'sync_queue';
  
  Future<void> addToQueue(Map<String, dynamic> request) async {
    final prefs = await SharedPreferences.getInstance();
    final queue = await _getQueue();
    
    request['timestamp'] = DateTime.now().toIso8601String();
    request['id'] = DateTime.now().millisecondsSinceEpoch.toString();
    
    queue.add(request);
    await prefs.setString(_queueKey, json.encode(queue));
    print('📥 Added to sync queue: ${request['type']}');
  }

  Future<void> processQueue() async {
    final queue = await _getQueue();
    if (queue.isEmpty) return;

    print('🔄 Processing ${queue.length} queued requests...');
    final prefs = await SharedPreferences.getInstance();
    final processed = <Map<String, dynamic>>[];

    for (final request in queue) {
      try {
        final success = await _executeRequest(request);
        if (success) {
          processed.add(request);
          print('✅ Synced: ${request['type']}');
        }
      } catch (e) {
        print('❌ Sync failed: ${request['type']} - $e');
      }
    }

    // Remove processed items
    queue.removeWhere((item) => processed.contains(item));
    await prefs.setString(_queueKey, json.encode(queue));
    
    if (processed.isNotEmpty) {
      print('✅ Synced ${processed.length} items');
    }
  }

  Future<bool> _executeRequest(Map<String, dynamic> request) async {
    final type = request['type'];
    final data = request['data'];

    switch (type) {
      case 'save_trip':
        return await _syncTripPlan(data);
      case 'toggle_favorite':
        return await _syncFavorite(data);
      case 'update_visit_status':
        return await _syncVisitStatus(data);
      case 'claim_deal':
        return await _syncClaimDeal(data);
      default:
        return false;
    }
  }

  Future<bool> _syncTripPlan(Map<String, dynamic> data) async {
    try {
      final response = await http.post(
        Uri.parse('${Environment.backendUrl}/api/users/trip-plans'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(data),
      ).timeout(const Duration(seconds: 10));
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      return false;
    }
  }

  Future<bool> _syncFavorite(Map<String, dynamic> data) async {
    try {
      final response = await http.post(
        Uri.parse('${Environment.backendUrl}/api/users/${data['userId']}/favorites'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'placeId': data['placeId'], 'action': data['action']}),
      ).timeout(const Duration(seconds: 10));
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  Future<bool> _syncVisitStatus(Map<String, dynamic> data) async {
    try {
      final response = await http.patch(
        Uri.parse('${Environment.backendUrl}/api/trips/${data['tripId']}/activities/${data['activityId']}'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'isVisited': data['isVisited']}),
      ).timeout(const Duration(seconds: 10));
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  Future<bool> _syncClaimDeal(Map<String, dynamic> data) async {
    try {
      final response = await http.post(
        Uri.parse('${Environment.backendUrl}/api/deals/${data['dealId']}/claim'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'userId': data['userId']}),
      ).timeout(const Duration(seconds: 10));
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  Future<List<Map<String, dynamic>>> _getQueue() async {
    final prefs = await SharedPreferences.getInstance();
    final queueJson = prefs.getString(_queueKey);
    if (queueJson == null) return [];
    
    try {
      final List<dynamic> decoded = json.decode(queueJson);
      return decoded.cast<Map<String, dynamic>>();
    } catch (e) {
      return [];
    }
  }

  Future<int> getQueueCount() async {
    final queue = await _getQueue();
    return queue.length;
  }

  Future<void> clearQueue() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_queueKey);
  }
}
