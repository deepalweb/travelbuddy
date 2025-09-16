class EnhancedLocalDiscovery {
  final HiddenGemWithContext hiddenGem;
  final TasteAndTraditions tasteAndTraditions;
  final LocalVoices localVoices;
  final LocalPulse localPulse;
  final MiniChallenge miniChallenge;
  final LocalLanguageBite languageBite;
  final OnlyHerePick onlyHerePick;
  final List<TravelerSnapshot> travelerSnapshots;

  EnhancedLocalDiscovery({
    required this.hiddenGem,
    required this.tasteAndTraditions,
    required this.localVoices,
    required this.localPulse,
    required this.miniChallenge,
    required this.languageBite,
    required this.onlyHerePick,
    required this.travelerSnapshots,
  });
}

class HiddenGemWithContext {
  final String name;
  final String description;
  final String whyToday;
  final List<ContextBadge> badges;
  final String emoji;

  HiddenGemWithContext({
    required this.name,
    required this.description,
    required this.whyToday,
    required this.badges,
    required this.emoji,
  });
}

class ContextBadge {
  final String label;
  final String emoji;
  final BadgeType type;

  ContextBadge({
    required this.label,
    required this.emoji,
    required this.type,
  });
}

enum BadgeType { time, weather, crowd, special }

class TasteAndTraditions {
  final FoodPick dailyFoodPick;
  final CulturalSnippet culturalSnippet;
  final String pairedExperience;

  TasteAndTraditions({
    required this.dailyFoodPick,
    required this.culturalSnippet,
    required this.pairedExperience,
  });
}

class FoodPick {
  final String name;
  final String location;
  final String emoji;
  final String tip;

  FoodPick({
    required this.name,
    required this.location,
    required this.emoji,
    required this.tip,
  });
}

class CulturalSnippet {
  final String event;
  final String description;
  final String emoji;
  final bool isToday;

  CulturalSnippet({
    required this.event,
    required this.description,
    required this.emoji,
    required this.isToday,
  });
}

class LocalVoices {
  final LocalQuote localQuote;
  final TravelerHack travelerHack;

  LocalVoices({
    required this.localQuote,
    required this.travelerHack,
  });
}

class LocalQuote {
  final String quote;
  final String author;
  final String context;

  LocalQuote({
    required this.quote,
    required this.author,
    required this.context,
  });
}

class TravelerHack {
  final String tip;
  final String emoji;
  final String category;

  TravelerHack({
    required this.tip,
    required this.emoji,
    required this.category,
  });
}

class LocalPulse {
  final String activity;
  final String location;
  final String timeframe;
  final String emoji;

  LocalPulse({
    required this.activity,
    required this.location,
    required this.timeframe,
    required this.emoji,
  });
}

class MiniChallenge {
  final String title;
  final String description;
  final String reward;
  final String emoji;
  final ChallengeDifficulty difficulty;

  MiniChallenge({
    required this.title,
    required this.description,
    required this.reward,
    required this.emoji,
    required this.difficulty,
  });
}

enum ChallengeDifficulty { easy, medium, hard }

class LocalLanguageBite {
  final String phrase;
  final String meaning;
  final String usage;
  final String pronunciation;

  LocalLanguageBite({
    required this.phrase,
    required this.meaning,
    required this.usage,
    required this.pronunciation,
  });
}

class OnlyHerePick {
  final String title;
  final String description;
  final String uniqueness;
  final String emoji;

  OnlyHerePick({
    required this.title,
    required this.description,
    required this.uniqueness,
    required this.emoji,
  });
}

class TravelerSnapshot {
  final String imageUrl;
  final String caption;
  final String travelerName;
  final String timeAgo;

  TravelerSnapshot({
    required this.imageUrl,
    required this.caption,
    required this.travelerName,
    required this.timeAgo,
  });
}