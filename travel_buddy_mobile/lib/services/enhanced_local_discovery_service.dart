import '../models/enhanced_local_discovery.dart';

class EnhancedLocalDiscoveryService {
  static final EnhancedLocalDiscoveryService _instance = EnhancedLocalDiscoveryService._internal();
  factory EnhancedLocalDiscoveryService() => _instance;
  EnhancedLocalDiscoveryService._internal();

  Future<EnhancedLocalDiscovery> getEnhancedLocalDiscovery() async {
    await Future.delayed(const Duration(milliseconds: 400));
    
    final hour = DateTime.now().hour;
    final isEvening = hour >= 17 && hour <= 21;
    final isMorning = hour >= 6 && hour <= 10;
    
    return EnhancedLocalDiscovery(
      hiddenGem: _getContextualHiddenGem(isEvening, isMorning),
      tasteAndTraditions: _getTasteAndTraditions(),
      localVoices: _getLocalVoices(),
      localPulse: _getLocalPulse(hour),
      miniChallenge: _getMiniChallenge(),
      languageBite: _getLanguageBite(),
      onlyHerePick: _getOnlyHerePick(),
      travelerSnapshots: _getTravelerSnapshots(),
    );
  }

  HiddenGemWithContext _getContextualHiddenGem(bool isEvening, bool isMorning) {
    if (isEvening) {
      return HiddenGemWithContext(
        name: 'Moon Bastion Rooftop',
        description: 'Secret rooftop with panoramic views of Galle Fort',
        whyToday: 'Perfect tonight - clear skies & low crowds',
        emoji: '🌙',
        badges: [
          ContextBadge(label: 'Best Tonight', emoji: '🌟', type: BadgeType.time),
          ContextBadge(label: 'Clear Skies', emoji: '☀️', type: BadgeType.weather),
          ContextBadge(label: 'Low Crowd', emoji: '👥', type: BadgeType.crowd),
        ],
      );
    } else if (isMorning) {
      return HiddenGemWithContext(
        name: 'Sunrise Point Lighthouse',
        description: 'Hidden path behind the lighthouse for sunrise views',
        whyToday: 'Golden hour magic - perfect morning light',
        emoji: '🌅',
        badges: [
          ContextBadge(label: 'Golden Hour', emoji: '✨', type: BadgeType.time),
          ContextBadge(label: 'Photo Perfect', emoji: '📸', type: BadgeType.special),
        ],
      );
    } else {
      return HiddenGemWithContext(
        name: 'Secret Garden Café',
        description: 'Hidden courtyard café behind the Dutch Church',
        whyToday: 'Great for lunch - shaded & peaceful',
        emoji: '🌿',
        badges: [
          ContextBadge(label: 'Great for Lunch', emoji: '🍽️', type: BadgeType.time),
          ContextBadge(label: 'Rain-Proof', emoji: '☔', type: BadgeType.weather),
        ],
      );
    }
  }

  TasteAndTraditions _getTasteAndTraditions() {
    return TasteAndTraditions(
      dailyFoodPick: FoodPick(
        name: 'Isso Wade',
        location: 'by the lighthouse',
        emoji: '🍢',
        tip: 'Best when crispy hot - ask for extra spice!',
      ),
      culturalSnippet: CulturalSnippet(
        event: 'Poya Day',
        description: 'Full moon day - expect special temple events & ceremonies',
        emoji: '🪘',
        isToday: DateTime.now().day % 15 == 0, // Mock Poya day
      ),
      pairedExperience: 'Drink king coconut while exploring the ramparts 🥥',
    );
  }

  LocalVoices _getLocalVoices() {
    return LocalVoices(
      localQuote: LocalQuote(
        quote: 'Best time to see stilt fishermen is sunrise',
        author: 'Kumara, local fisherman',
        context: '🌅',
      ),
      travelerHack: TravelerHack(
        tip: 'Carry cash - many stalls don\'t accept cards',
        emoji: '💳',
        category: 'Payment',
      ),
    );
  }

  LocalPulse _getLocalPulse(int hour) {
    if (hour >= 17 && hour <= 20) {
      return LocalPulse(
        activity: 'Live music at Pedlar\'s Inn',
        location: 'Church Street',
        timeframe: 'Tonight 7-10 PM',
        emoji: '🎶',
      );
    } else if (hour >= 15 && hour <= 17) {
      return LocalPulse(
        activity: 'Street football match',
        location: 'near Galle Market',
        timeframe: 'Happening now',
        emoji: '⚽',
      );
    } else {
      return LocalPulse(
        activity: 'Morning yoga session',
        location: 'Galle Face Green',
        timeframe: 'Every morning 6-7 AM',
        emoji: '🧘',
      );
    }
  }

  MiniChallenge _getMiniChallenge() {
    final challenges = [
      MiniChallenge(
        title: 'Street Art Hunter',
        description: 'Find the secret alley with wall art → snap a pic',
        reward: 'Explorer badge',
        emoji: '🎨',
        difficulty: ChallengeDifficulty.easy,
      ),
      MiniChallenge(
        title: 'Local Taste Test',
        description: 'Try 3 local snacks under \$5 today',
        reward: 'Foodie badge',
        emoji: '🍽️',
        difficulty: ChallengeDifficulty.medium,
      ),
      MiniChallenge(
        title: 'Temple Bell Quest',
        description: 'Find and ring the ancient temple bell',
        reward: 'Culture Seeker badge',
        emoji: '🔔',
        difficulty: ChallengeDifficulty.hard,
      ),
    ];
    
    return challenges[DateTime.now().day % challenges.length];
  }

  LocalLanguageBite _getLanguageBite() {
    final phrases = [
      LocalLanguageBite(
        phrase: 'Machan',
        meaning: 'buddy/friend',
        usage: 'Use when greeting locals',
        pronunciation: 'MAH-chan',
      ),
      LocalLanguageBite(
        phrase: 'Ayubowan',
        meaning: 'may you live long (hello)',
        usage: 'Formal greeting',
        pronunciation: 'AH-yu-bo-wan',
      ),
      LocalLanguageBite(
        phrase: 'Bohoma sthuthi',
        meaning: 'thank you very much',
        usage: 'Show appreciation',
        pronunciation: 'bo-HO-ma STHU-thi',
      ),
    ];
    
    return phrases[DateTime.now().day % phrases.length];
  }

  OnlyHerePick _getOnlyHerePick() {
    final picks = [
      OnlyHerePick(
        title: 'Turtle Hatchery Experience',
        description: 'Sri Lanka\'s only beachside turtle conservation center',
        uniqueness: 'Only place to see 5 turtle species in one location',
        emoji: '🐢',
      ),
      OnlyHerePick(
        title: 'Cinnamon Tea Stalls',
        description: 'Traditional cinnamon-infused tea unique to Galle',
        uniqueness: 'Recipe passed down for 200+ years',
        emoji: '🍵',
      ),
      OnlyHerePick(
        title: 'Dutch Colonial Architecture',
        description: 'Best-preserved Dutch fort in Asia',
        uniqueness: 'UNESCO World Heritage site',
        emoji: '🏰',
      ),
    ];
    
    return picks[DateTime.now().day % picks.length];
  }

  List<TravelerSnapshot> _getTravelerSnapshots() {
    return [
      TravelerSnapshot(
        imageUrl: 'local://snapshots/sunset_fort.jpg',
        caption: 'Amazing sunset from the fort walls!',
        travelerName: 'Sarah M.',
        timeAgo: '2 hours ago',
      ),
      TravelerSnapshot(
        imageUrl: 'local://snapshots/street_food.jpg',
        caption: 'Best isso wade I\'ve ever had 🔥',
        travelerName: 'Mike K.',
        timeAgo: '4 hours ago',
      ),
    ];
  }
}