import 'dart:async';
import 'dart:developer' as developer;

class MemoryProfiler {
  static final MemoryProfiler _instance = MemoryProfiler._internal();
  factory MemoryProfiler() => _instance;
  MemoryProfiler._internal();

  Timer? _monitorTimer;
  final List<MemorySnapshot> _snapshots = [];
  static const int _maxSnapshots = 20;

  // Start memory monitoring
  void startMonitoring({Duration interval = const Duration(seconds: 30)}) {
    print('🔍 Starting memory monitoring');
    
    _monitorTimer = Timer.periodic(interval, (timer) {
      _takeSnapshot();
    });
  }

  void _takeSnapshot() {
    try {
      // Get memory info from VM
      developer.Timeline.startSync('MemorySnapshot');
      
      final snapshot = MemorySnapshot(
        timestamp: DateTime.now(),
        // Note: Actual memory values would come from platform channels
        // This is a simplified version
      );
      
      _snapshots.add(snapshot);
      
      // Keep only recent snapshots
      if (_snapshots.length > _maxSnapshots) {
        _snapshots.removeAt(0);
      }
      
      // Check for memory leaks
      _checkForLeaks();
      
      developer.Timeline.finishSync();
    } catch (e) {
      print('❌ Error taking memory snapshot: $e');
    }
  }

  void _checkForLeaks() {
    if (_snapshots.length < 5) return;

    // Check if memory is consistently increasing
    final recent = _snapshots.skip(_snapshots.length - 5).toList();
    bool isIncreasing = true;
    
    for (int i = 1; i < recent.length; i++) {
      if (recent[i].estimatedUsageMB <= recent[i - 1].estimatedUsageMB) {
        isIncreasing = false;
        break;
      }
    }

    if (isIncreasing) {
      final increase = recent.last.estimatedUsageMB - recent.first.estimatedUsageMB;
      if (increase > 50) { // More than 50MB increase
        print('⚠️ Potential memory leak detected! Memory increased by ${increase.toStringAsFixed(1)}MB');
        _logMemoryWarning();
      }
    }
  }

  void _logMemoryWarning() {
    print('📊 Memory Usage Report:');
    print('   Current: ${_snapshots.last.estimatedUsageMB.toStringAsFixed(1)}MB');
    print('   Peak: ${_getPeakMemory().toStringAsFixed(1)}MB');
    print('   Average: ${_getAverageMemory().toStringAsFixed(1)}MB');
    print('   Recommendation: Clear caches or restart app');
  }

  double _getPeakMemory() {
    if (_snapshots.isEmpty) return 0;
    return _snapshots.map((s) => s.estimatedUsageMB).reduce((a, b) => a > b ? a : b);
  }

  double _getAverageMemory() {
    if (_snapshots.isEmpty) return 0;
    final sum = _snapshots.fold<double>(0, (sum, s) => sum + s.estimatedUsageMB);
    return sum / _snapshots.length;
  }

  // Get memory stats
  Map<String, dynamic> getMemoryStats() {
    return {
      'current': _snapshots.isNotEmpty ? _snapshots.last.estimatedUsageMB : 0,
      'peak': _getPeakMemory(),
      'average': _getAverageMemory(),
      'snapshots': _snapshots.length,
    };
  }

  // Force garbage collection hint
  void suggestGarbageCollection() {
    print('🗑️ Suggesting garbage collection');
    // Note: Dart doesn't allow forcing GC, but we can hint
    developer.Timeline.startSync('GarbageCollection');
    developer.Timeline.finishSync();
  }

  void stopMonitoring() {
    _monitorTimer?.cancel();
    _monitorTimer = null;
    print('🔍 Stopped memory monitoring');
  }

  void dispose() {
    stopMonitoring();
    _snapshots.clear();
  }
}

class MemorySnapshot {
  final DateTime timestamp;
  final double estimatedUsageMB;

  MemorySnapshot({
    required this.timestamp,
    this.estimatedUsageMB = 0,
  });
}
