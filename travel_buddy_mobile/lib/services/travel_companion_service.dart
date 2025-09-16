import '../models/travel_companion.dart';

class TravelCompanionService {
  static final TravelCompanionService _instance = TravelCompanionService._internal();
  factory TravelCompanionService() => _instance;
  TravelCompanionService._internal();

  Future<List<MoodSuggestion>> getMoodBasedSuggestions(TravelMood mood) async {
    await Future.delayed(const Duration(milliseconds: 300));
    
    switch (mood) {
      case TravelMood.relaxing:
        return [
          MoodSuggestion(id: 'r1', name: 'Zen Garden Café', type: 'Café', emoji: '🌿', rating: 4.8, distance: '0.3km', tags: ['Quiet', 'Nature'], whyRecommended: 'Perfect for unwinding'),
          MoodSuggestion(id: 'r2', name: 'Spa Retreat', type: 'Wellness', emoji: '🧘', rating: 4.9, distance: '0.8km', tags: ['Peaceful', 'Relaxing'], whyRecommended: 'Matches your chill vibe'),
        ];
      case TravelMood.adventure:
        return [
          MoodSuggestion(id: 'a1', name: 'Rock Climbing Wall', type: 'Adventure', emoji: '🧗', rating: 4.7, distance: '1.2km', tags: ['Thrilling', 'Active'], whyRecommended: 'Get your adrenaline pumping'),
          MoodSuggestion(id: 'a2', name: 'Jungle Trek', type: 'Nature', emoji: '🌲', rating: 4.6, distance: '2.1km', tags: ['Wild', 'Exciting'], whyRecommended: 'Perfect adventure challenge'),
        ];
      case TravelMood.foodie:
        return [
          MoodSuggestion(id: 'f1', name: 'Street Food Market', type: 'Food', emoji: '🍜', rating: 4.8, distance: '0.5km', tags: ['Authentic', 'Local'], whyRecommended: 'Satisfy your foodie soul'),
          MoodSuggestion(id: 'f2', name: 'Cooking Class', type: 'Experience', emoji: '👨‍🍳', rating: 4.9, distance: '0.7km', tags: ['Interactive', 'Cultural'], whyRecommended: 'Learn local flavors'),
        ];
      case TravelMood.social:
        return [
          MoodSuggestion(id: 's1', name: 'Rooftop Bar', type: 'Nightlife', emoji: '🍸', rating: 4.7, distance: '0.4km', tags: ['Vibrant', 'Social'], whyRecommended: 'Meet fellow travelers'),
          MoodSuggestion(id: 's2', name: 'Live Music Venue', type: 'Entertainment', emoji: '🎶', rating: 4.8, distance: '0.6km', tags: ['Lively', 'Fun'], whyRecommended: 'Great social atmosphere'),
        ];
      default:
        return [];
    }
  }

  Future<List<PairingCard>> getDynamicPairings() async {
    await Future.delayed(const Duration(milliseconds: 300));
    
    return [
      PairingCard(
        id: 'p1',
        title: 'Perfect Evening Combo',
        description: 'Sunset views + cocktails',
        duration: '3 hours',
        emoji: '🌅',
        items: [
          PairingItem(name: 'Flag Rock Bastion', type: 'Viewpoint', emoji: '🏰', time: '6:00 PM'),
          PairingItem(name: 'Sky Lounge', type: 'Bar', emoji: '🍹', time: '7:30 PM'),
        ],
      ),
      PairingCard(
        id: 'p2',
        title: 'Morning Explorer',
        description: 'Hike + local breakfast',
        duration: '4 hours',
        emoji: '🥾',
        items: [
          PairingItem(name: 'Mini World\'s End', type: 'Hiking', emoji: '🏞️', time: '6:30 AM'),
          PairingItem(name: 'Village Café', type: 'Breakfast', emoji: '☕', time: '9:00 AM'),
        ],
      ),
    ];
  }

  Future<List<GapFillerSuggestion>> getGapFillers() async {
    await Future.delayed(const Duration(milliseconds: 300));
    
    return [
      GapFillerSuggestion(
        id: 'g1',
        name: 'Maritime Museum',
        type: 'Culture',
        emoji: '⚓',
        timeWindow: '2 hours free',
        reason: 'Perfect before dinner',
        distance: '0.3km',
      ),
      GapFillerSuggestion(
        id: 'g2',
        name: 'Local Art Gallery',
        type: 'Art',
        emoji: '🎨',
        timeWindow: '1 hour free',
        reason: 'Quick cultural fix',
        distance: '0.5km',
      ),
    ];
  }

  Future<List<CommunityPick>> getCommunityPicks() async {
    await Future.delayed(const Duration(milliseconds: 300));
    
    return [
      CommunityPick(
        id: 'c1',
        name: 'Hidden Beach Café',
        type: 'Café',
        emoji: '🏖️',
        socialProof: '12 travelers from Colombo loved this',
        recentVisitors: 23,
        photoUrl: '',
      ),
      CommunityPick(
        id: 'c2',
        name: 'Secret Viewpoint',
        type: 'Nature',
        emoji: '📸',
        socialProof: 'New photo shared 2 hours ago',
        recentVisitors: 8,
        photoUrl: '',
      ),
    ];
  }

  Future<List<LocalInsiderHighlight>> getLocalInsiderHighlights() async {
    await Future.delayed(const Duration(milliseconds: 300));
    
    return [
      LocalInsiderHighlight(
        id: 'l1',
        name: 'Corner Tea Shop',
        type: 'Local Spot',
        emoji: '🍵',
        insiderTip: 'Where locals get their morning tea',
        happening: 'Busy with locals right now',
      ),
      LocalInsiderHighlight(
        id: 'l2',
        name: 'Night Market',
        type: 'Market',
        emoji: '🌃',
        insiderTip: 'Best street food after 8 PM',
        happening: 'Setting up for tonight',
      ),
    ];
  }

  Future<String> getSpinTheGlobeSuggestion() async {
    await Future.delayed(const Duration(milliseconds: 500));
    
    final surprises = [
      '🎭 Traditional puppet show at Cultural Center',
      '🦋 Butterfly garden with rare species',
      '🏺 Ancient pottery workshop experience',
      '🌺 Flower market with local blooms',
      '🎪 Street performer gathering spot',
    ];
    
    return surprises[DateTime.now().millisecond % surprises.length];
  }

  Future<List<DiscoveryBadge>> getDiscoveryBadges() async {
    await Future.delayed(const Duration(milliseconds: 300));
    
    return [
      DiscoveryBadge(id: 'b1', name: 'Foodie Explorer', emoji: '🍽️', progress: 3, total: 5, unlocked: false),
      DiscoveryBadge(id: 'b2', name: 'Culture Seeker', emoji: '🏛️', progress: 2, total: 3, unlocked: false),
      DiscoveryBadge(id: 'b3', name: 'Nature Lover', emoji: '🌿', progress: 4, total: 4, unlocked: true),
    ];
  }

  String getMoodEmoji(TravelMood mood) {
    switch (mood) {
      case TravelMood.relaxing: return '🌿';
      case TravelMood.adventure: return '⛰️';
      case TravelMood.foodie: return '🍲';
      case TravelMood.social: return '🎶';
      case TravelMood.cultural: return '🏛️';
      case TravelMood.romantic: return '💕';
    }
  }

  String getMoodLabel(TravelMood mood) {
    switch (mood) {
      case TravelMood.relaxing: return 'Relaxing';
      case TravelMood.adventure: return 'Adventure';
      case TravelMood.foodie: return 'Foodie';
      case TravelMood.social: return 'Social';
      case TravelMood.cultural: return 'Cultural';
      case TravelMood.romantic: return 'Romantic';
    }
  }
}