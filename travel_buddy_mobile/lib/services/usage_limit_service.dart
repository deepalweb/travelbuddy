import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/user.dart';
import '../services/subscription_service.dart';
import '../services/storage_service.dart';
import '../config/environment.dart';

class UsageLimitService {
  static final UsageLimitService _instance = UsageLimitService._internal();
  factory UsageLimitService() => _instance;
  UsageLimitService._internal();

  final StorageService _storage = StorageService();
  final SubscriptionService _subscriptionService = SubscriptionService();

  Future<Map<String, int>> getTodayUsage() async {
    final today = DateTime.now().toIso8601String().split('T')[0];
    
    // Try to get from database first
    final dbUsage = await _fetchUsageFromDatabase(today);
    if (dbUsage != null) {
      // Update local cache
      await _storage.saveUsageData(today, dbUsage);
      return dbUsage;
    }
    
    // Fallback to local storage
    final usage = await _storage.getUsageData(today);
    return {
      'places': usage['places'] ?? 0,
      'aiQueries': usage['aiQueries'] ?? 0,
      'deals': usage['deals'] ?? 0,
      'posts': usage['posts'] ?? 0,
    };
  }

  Future<Map<String, int>?> _fetchUsageFromDatabase(String date) async {
    try {
      final user = await _storage.getUser();
      if (user?.mongoId == null) return null;
      
      final response = await http.get(
        Uri.parse('${Environment.backendUrl}/api/users/${user!.mongoId}/usage/$date'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 5));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return Map<String, int>.from(data['usage'] ?? {});
      }
    } catch (e) {
      print('❌ Usage fetch error: $e');
    }
    return null;
  }

  Future<bool> canUseFeature(CurrentUser user, String feature) async {
    final limits = SubscriptionService.tierLimits[user.tier]!;
    final usage = await getTodayUsage();

    switch (feature) {
      case 'places':
        return limits.placesPerDay == -1 || usage['places']! < limits.placesPerDay;
      case 'aiQueries':
        return limits.aiQueriesPerDay == -1 || usage['aiQueries']! < limits.aiQueriesPerDay;
      case 'deals':
        return limits.dealsPerDay == -1 || usage['deals']! < limits.dealsPerDay;
      case 'posts':
        return limits.postsPerDay == -1 || usage['posts']! < limits.postsPerDay;
      default:
        return true;
    }
  }

  Future<void> incrementUsage(String feature) async {
    final today = DateTime.now().toIso8601String().split('T')[0];
    final usage = await getTodayUsage();
    usage[feature] = (usage[feature] ?? 0) + 1;
    
    // Save locally first (immediate)
    await _storage.saveUsageData(today, usage);
    
    // Sync to database (async)
    _syncUsageToDatabase(today, usage);
  }

  Future<void> _syncUsageToDatabase(String date, Map<String, int> usage) async {
    try {
      final user = await _storage.getUser();
      if (user?.mongoId == null) return;
      
      final response = await http.post(
        Uri.parse('${Environment.backendUrl}/api/users/${user!.mongoId}/usage'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'date': date,
          'usage': usage,
        }),
      ).timeout(const Duration(seconds: 5));
      
      if (response.statusCode != 200) {
        print('❌ Failed to sync usage: ${response.statusCode}');
      }
    } catch (e) {
      print('❌ Usage sync error: $e');
    }
  }

  Future<Map<String, dynamic>> getUsageStatus(CurrentUser user) async {
    final limits = SubscriptionService.tierLimits[user.tier]!;
    final usage = await getTodayUsage();

    return {
      'places': {
        'used': usage['places'],
        'limit': limits.placesPerDay,
        'percentage': limits.placesPerDay == -1 ? 0 : (usage['places']! / limits.placesPerDay * 100).round(),
      },
      'aiQueries': {
        'used': usage['aiQueries'],
        'limit': limits.aiQueriesPerDay,
        'percentage': limits.aiQueriesPerDay == -1 ? 0 : (usage['aiQueries']! / limits.aiQueriesPerDay * 100).round(),
      },
      'deals': {
        'used': usage['deals'],
        'limit': limits.dealsPerDay,
        'percentage': limits.dealsPerDay == -1 ? 0 : (usage['deals']! / limits.dealsPerDay * 100).round(),
      },
      'posts': {
        'used': usage['posts'],
        'limit': limits.postsPerDay,
        'percentage': limits.postsPerDay == -1 ? 0 : (usage['posts']! / limits.postsPerDay * 100).round(),
      },
    };
  }

  void showLimitReachedDialog(BuildContext context, String feature, CurrentUser user) {
    final tierName = user.tier.toString().split('.').last;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.warning, color: Colors.orange[600]),
            const SizedBox(width: 8),
            const Text('Daily Limit Reached'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('You\'ve reached your daily $feature limit for the $tierName plan.'),
            const SizedBox(height: 16),
            const Text('Upgrade to get higher limits and more features!'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _navigateToSubscription(context);
            },
            child: const Text('Upgrade Now'),
          ),
        ],
      ),
    );
  }

  void showLimitWarning(BuildContext context, String feature, int used, int limit) {
    if (limit == -1) return; // Unlimited
    
    final percentage = (used / limit * 100).round();
    if (percentage >= 80) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('⚠️ $feature limit: $used/$limit used (${percentage}%)'),
          backgroundColor: percentage >= 90 ? Colors.red : Colors.orange,
          action: SnackBarAction(
            label: 'Upgrade',
            onPressed: () => _navigateToSubscription(context),
          ),
        ),
      );
    }
  }

  void _navigateToSubscription(BuildContext context) {
    Navigator.pushNamed(context, '/subscription');
  }
}