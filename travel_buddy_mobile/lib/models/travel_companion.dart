enum TravelMood { relaxing, adventure, foodie, social, cultural, romantic }

enum TripPhase { preTrip, earlyTrip, midTrip, endTrip }

class MoodSuggestion {
  final String id;
  final String name;
  final String type;
  final String emoji;
  final double rating;
  final String distance;
  final List<String> tags;
  final String whyRecommended;

  MoodSuggestion({
    required this.id,
    required this.name,
    required this.type,
    required this.emoji,
    required this.rating,
    required this.distance,
    required this.tags,
    required this.whyRecommended,
  });
}

class PairingCard {
  final String id;
  final String title;
  final String description;
  final List<PairingItem> items;
  final String duration;
  final String emoji;

  PairingCard({
    required this.id,
    required this.title,
    required this.description,
    required this.items,
    required this.duration,
    required this.emoji,
  });
}

class PairingItem {
  final String name;
  final String type;
  final String emoji;
  final String time;

  PairingItem({
    required this.name,
    required this.type,
    required this.emoji,
    required this.time,
  });
}

class GapFillerSuggestion {
  final String id;
  final String name;
  final String type;
  final String emoji;
  final String timeWindow;
  final String reason;
  final String distance;

  GapFillerSuggestion({
    required this.id,
    required this.name,
    required this.type,
    required this.emoji,
    required this.timeWindow,
    required this.reason,
    required this.distance,
  });
}

class CommunityPick {
  final String id;
  final String name;
  final String type;
  final String emoji;
  final String socialProof;
  final int recentVisitors;
  final String photoUrl;

  CommunityPick({
    required this.id,
    required this.name,
    required this.type,
    required this.emoji,
    required this.socialProof,
    required this.recentVisitors,
    required this.photoUrl,
  });
}

class LocalInsiderHighlight {
  final String id;
  final String name;
  final String type;
  final String emoji;
  final String insiderTip;
  final String happening;

  LocalInsiderHighlight({
    required this.id,
    required this.name,
    required this.type,
    required this.emoji,
    required this.insiderTip,
    required this.happening,
  });
}

class DiscoveryBadge {
  final String id;
  final String name;
  final String emoji;
  final int progress;
  final int total;
  final bool unlocked;

  DiscoveryBadge({
    required this.id,
    required this.name,
    required this.emoji,
    required this.progress,
    required this.total,
    required this.unlocked,
  });
}