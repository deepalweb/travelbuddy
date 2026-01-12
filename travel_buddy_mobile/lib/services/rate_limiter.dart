import 'dart:collection';

class RateLimiter {
  static final RateLimiter _instance = RateLimiter._internal();
  factory RateLimiter() => _instance;
  RateLimiter._internal();

  final Map<String, Queue<DateTime>> _requestTimestamps = {};
  final Map<String, int> _dailyCounts = {};
  final Map<String, DateTime> _lastResetDates = {};

  // Check if request is allowed
  bool canMakeRequest(String endpoint, {int maxPerMinute = 10, int maxPerDay = 1000}) {
    final now = DateTime.now();
    
    // Reset daily counter if new day
    _resetDailyCountIfNeeded(endpoint, now);
    
    // Check daily limit
    final dailyCount = _dailyCounts[endpoint] ?? 0;
    if (dailyCount >= maxPerDay) {
      print('⚠️ Daily rate limit reached for $endpoint: $dailyCount/$maxPerDay');
      return false;
    }
    
    // Check per-minute limit
    final timestamps = _requestTimestamps[endpoint] ?? Queue<DateTime>();
    final oneMinuteAgo = now.subtract(Duration(minutes: 1));
    
    // Remove old timestamps
    while (timestamps.isNotEmpty && timestamps.first.isBefore(oneMinuteAgo)) {
      timestamps.removeFirst();
    }
    
    if (timestamps.length >= maxPerMinute) {
      print('⚠️ Rate limit reached for $endpoint: ${timestamps.length}/$maxPerMinute per minute');
      return false;
    }
    
    return true;
  }

  // Record a request
  void recordRequest(String endpoint) {
    final now = DateTime.now();
    
    // Add to per-minute tracker
    final timestamps = _requestTimestamps[endpoint] ?? Queue<DateTime>();
    timestamps.add(now);
    _requestTimestamps[endpoint] = timestamps;
    
    // Increment daily counter
    _dailyCounts[endpoint] = (_dailyCounts[endpoint] ?? 0) + 1;
  }

  void _resetDailyCountIfNeeded(String endpoint, DateTime now) {
    final lastReset = _lastResetDates[endpoint];
    if (lastReset == null || !_isSameDay(lastReset, now)) {
      _dailyCounts[endpoint] = 0;
      _lastResetDates[endpoint] = now;
    }
  }

  bool _isSameDay(DateTime date1, DateTime date2) {
    return date1.year == date2.year &&
           date1.month == date2.month &&
           date1.day == date2.day;
  }

  // Get current usage stats
  Map<String, dynamic> getUsageStats(String endpoint) {
    final now = DateTime.now();
    _resetDailyCountIfNeeded(endpoint, now);
    
    final timestamps = _requestTimestamps[endpoint] ?? Queue<DateTime>();
    final oneMinuteAgo = now.subtract(Duration(minutes: 1));
    final recentRequests = timestamps.where((t) => t.isAfter(oneMinuteAgo)).length;
    
    return {
      'dailyCount': _dailyCounts[endpoint] ?? 0,
      'recentRequests': recentRequests,
      'lastReset': _lastResetDates[endpoint]?.toIso8601String(),
    };
  }

  // Clear all rate limit data
  void reset() {
    _requestTimestamps.clear();
    _dailyCounts.clear();
    _lastResetDates.clear();
  }
}
