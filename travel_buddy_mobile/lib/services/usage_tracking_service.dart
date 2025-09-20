import 'package:hive/hive.dart';
import '../models/user_interaction.dart';
import '../models/place.dart';

class UsageTrackingService {
  static final UsageTrackingService _instance = UsageTrackingService._internal();
  factory UsageTrackingService() => _instance;
  UsageTrackingService._internal();

  static const String _boxName = 'user_interactions';
  Box<UserInteraction>? _box;

  Future<void> initialize() async {
    try {
      // Use regular box instead of typed box for now
      _box = await Hive.openBox(_boxName) as Box<UserInteraction>?;
      print('✅ Usage tracking service initialized');
    } catch (e) {
      print('❌ Failed to initialize usage tracking: $e');
    }
  }

  // Track place interactions
  Future<void> trackPlaceViewed(Place place) async {
    await _trackInteraction(UserInteraction.placeViewed(
      placeId: place.id,
      placeName: place.name,
      placeType: place.type,
    ));
  }

  Future<void> trackPlaceFavorited(Place place) async {
    await _trackInteraction(UserInteraction.placeFavorited(
      placeId: place.id,
      placeName: place.name,
      placeType: place.type,
    ));
  }

  Future<void> trackPlaceDetailsOpened(Place place) async {
    await _trackInteraction(UserInteraction(
      id: '${DateTime.now().millisecondsSinceEpoch}_place_details',
      type: InteractionType.placeDetailsOpened,
      placeId: place.id,
      placeName: place.name,
      placeType: place.type,
      timestamp: DateTime.now(),
    ));
  }

  Future<void> trackCategorySelected(String category) async {
    await _trackInteraction(UserInteraction.categorySelected(
      category: category,
    ));
  }

  Future<void> trackSearchPerformed(String query) async {
    await _trackInteraction(UserInteraction.searchPerformed(
      searchQuery: query,
    ));
  }

  // Store interaction
  Future<void> _trackInteraction(UserInteraction interaction) async {
    try {
      await _box?.put(interaction.id, interaction);
      print('📊 Tracked: ${interaction.type.name}');
    } catch (e) {
      print('❌ Failed to track interaction: $e');
    }
  }

  // Analytics methods
  Map<String, int> getCategoryPreferences() {
    final interactions = _box?.values.where((i) => 
      i.type == InteractionType.categorySelected).toList() ?? [];
    
    final preferences = <String, int>{};
    for (final interaction in interactions) {
      if (interaction.category != null) {
        preferences[interaction.category!] = (preferences[interaction.category!] ?? 0) + 1;
      }
    }
    return preferences;
  }

  Map<String, int> getPlaceTypePreferences() {
    final interactions = _box?.values.where((i) => 
      i.type == InteractionType.placeViewed || 
      i.type == InteractionType.placeFavorited).toList() ?? [];
    
    final preferences = <String, int>{};
    for (final interaction in interactions) {
      if (interaction.placeType != null) {
        final type = _normalizeType(interaction.placeType!);
        preferences[type] = (preferences[type] ?? 0) + 1;
      }
    }
    return preferences;
  }

  List<String> getTopSearchQueries(int limit) {
    final interactions = _box?.values.where((i) => 
      i.type == InteractionType.searchPerformed).toList() ?? [];
    
    final queries = <String, int>{};
    for (final interaction in interactions) {
      if (interaction.searchQuery != null) {
        queries[interaction.searchQuery!] = (queries[interaction.searchQuery!] ?? 0) + 1;
      }
    }
    
    final sortedQueries = queries.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    
    return sortedQueries.take(limit).map((e) => e.key).toList();
  }

  // Get user behavior insights
  Map<String, dynamic> getUserInsights() {
    final totalInteractions = _box?.length ?? 0;
    final categoryPrefs = getCategoryPreferences();
    final placeTypePrefs = getPlaceTypePreferences();
    
    return {
      'totalInteractions': totalInteractions,
      'topCategory': categoryPrefs.isNotEmpty 
          ? categoryPrefs.entries.reduce((a, b) => a.value > b.value ? a : b).key
          : null,
      'topPlaceType': placeTypePrefs.isNotEmpty
          ? placeTypePrefs.entries.reduce((a, b) => a.value > b.value ? a : b).key
          : null,
      'categoryPreferences': categoryPrefs,
      'placeTypePreferences': placeTypePrefs,
      'isActive': totalInteractions > 10,
    };
  }

  String _normalizeType(String type) {
    final normalized = type.toLowerCase();
    if (normalized.contains('restaurant') || normalized.contains('food')) return 'restaurants';
    if (normalized.contains('museum') || normalized.contains('gallery')) return 'culture';
    if (normalized.contains('park') || normalized.contains('nature')) return 'nature';
    if (normalized.contains('bar') || normalized.contains('nightlife')) return 'nightlife';
    if (normalized.contains('cafe') || normalized.contains('coffee')) return 'cafes';
    if (normalized.contains('shop') || normalized.contains('mall')) return 'shopping';
    return 'attractions';
  }

  // Clean old interactions (keep last 1000)
  Future<void> cleanOldInteractions() async {
    try {
      final interactions = _box?.values.toList() ?? [];
      if (interactions.length > 1000) {
        interactions.sort((a, b) => b.timestamp.compareTo(a.timestamp));
        final toKeep = interactions.take(1000).toList();
        
        await _box?.clear();
        for (final interaction in toKeep) {
          await _box?.put(interaction.id, interaction);
        }
        print('🧹 Cleaned old interactions, kept ${toKeep.length}');
      }
    } catch (e) {
      print('❌ Failed to clean interactions: $e');
    }
  }
}