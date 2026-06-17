import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';

import '../config/environment.dart';
import '../models/place.dart';
import '../models/trip.dart';
import '../providers/app_provider.dart';
import '../providers/language_provider.dart';
import '../services/offline_geocoding_service.dart';
import 'language_assistant_screen.dart';
import 'place_details_screen.dart';
import 'safety_hub_screen.dart';
import 'transport_hub_screen.dart';
import 'trip_plan_detail_screen.dart';

const _primary = Color(0xFF007AFF);
const _navy = Color(0xFF1C1C1E);
const _surface = Color(0xFFF5F5F7);
const _border = Color(0xFFE5E5EA);
const _secondaryText = Color(0xFF6E6E73);

class PlaceSearchDelegate extends SearchDelegate<String> {
  @override
  String get searchFieldLabel => 'Ask TravelBuddy anything...';

  @override
  List<Widget> buildActions(BuildContext context) {
    return [
      if (query.isNotEmpty)
        IconButton(
          icon: const Icon(Icons.clear),
          onPressed: () => query = '',
        ),
    ];
  }

  @override
  Widget buildLeading(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.arrow_back),
      onPressed: () => close(context, ''),
    );
  }

  @override
  Widget buildResults(BuildContext context) {
    return _buildPlaceResults(context, query);
  }

  @override
  Widget buildSuggestions(BuildContext context) {
    return _buildPlaceResults(context, query);
  }

  Widget _buildPlaceResults(BuildContext context, String searchQuery) {
    final appProvider = context.watch<AppProvider>();
    final normalizedQuery = searchQuery.trim().toLowerCase();
    final results = normalizedQuery.isEmpty
        ? appProvider.places.take(8).toList()
        : appProvider.places
            .where((place) {
              return place.name.toLowerCase().contains(normalizedQuery) ||
                  place.type.toLowerCase().contains(normalizedQuery) ||
                  place.description.toLowerCase().contains(normalizedQuery);
            })
            .take(12)
            .toList();

    if (results.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.travel_explore, size: 54, color: _primary),
              const SizedBox(height: 16),
              Text(
                searchQuery.isEmpty
                    ? 'Start with a destination, food, or experience.'
                    : 'No nearby results for "$searchQuery".',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 16, color: Colors.black54),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () {
                  close(context, '');
                  appProvider.setCurrentTabIndex(1);
                },
                child: const Text('Open Discover'),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: results.length,
      separatorBuilder: (_, __) => const Divider(height: 1),
      itemBuilder: (context, index) {
        final place = results[index];
        return ListTile(
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
          leading: _PlaceThumbnail(place: place, size: 52),
          title: Text(
            place.name,
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          subtitle: Text(place.type),
          trailing: place.rating > 0
              ? Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.star_rounded,
                        size: 17, color: Color(0xFFF5A623)),
                    Text(place.rating.toStringAsFixed(1)),
                  ],
                )
              : const Icon(Icons.chevron_right),
          onTap: () {
            close(context, place.name);
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => PlaceDetailsScreen(place: place),
              ),
            );
          },
        );
      },
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final Map<String, String> _locationCache = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadData());
  }

  Future<void> _loadData() async {
    final appProvider = context.read<AppProvider>();
    try {
      await appProvider.getCurrentLocation();
      await appProvider.loadHomeData();
      await appProvider.loadNearbyPlaces();
      await appProvider.loadTripPlans();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content:
              const Text('Could not refresh everything. Showing saved data.'),
          action: SnackBarAction(label: 'Retry', onPressed: _loadData),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, appProvider, _) {
        return Scaffold(
          backgroundColor: _surface,
          body: SafeArea(
            bottom: false,
            child: RefreshIndicator(
              onRefresh: _loadData,
              color: _primary,
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverToBoxAdapter(child: _buildHeader(appProvider)),
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(18, 8, 18, 40),
                    sliver: SliverList(
                      delegate: SliverChildListDelegate([
                        _buildSmartSearch(),
                        const SizedBox(height: 24),
                        if (appProvider.isHomeLoading &&
                            appProvider.places.isEmpty &&
                            appProvider.tripPlans.isEmpty)
                          _buildHomeSkeleton()
                        else ...[
                          _buildDiscoveryHero(appProvider),
                          const SizedBox(height: 22),
                          _buildSmartPlanCard(appProvider),
                          const SizedBox(height: 34),
                          _buildContinuePlanning(appProvider),
                          const SizedBox(height: 34),
                          _buildQuickTools(appProvider),
                          const SizedBox(height: 34),
                          _buildNearYouNow(appProvider),
                        ],
                      ]),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildHeader(AppProvider appProvider) {
    final userName = _firstName(appProvider.currentUser?.username);
    final weather = appProvider.weatherInfo;

    return Padding(
      padding: const EdgeInsets.fromLTRB(22, 16, 16, 20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${_greeting()}, $userName',
                  style: const TextStyle(
                    color: _navy,
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.4,
                  ),
                ),
                const SizedBox(height: 4),
                FutureBuilder<String>(
                  future: _locationLabel(appProvider),
                  builder: (context, snapshot) {
                    final location = snapshot.data ?? 'Finding your location';
                    final temperature = weather == null
                        ? ''
                        : ' • ${weather.temperature.round()}°';
                    return Text(
                      '$location$temperature',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: _secondaryText,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    );
                  },
                ),
              ],
            ),
          ),
          _headerButton(
            icon: Icons.notifications_none_rounded,
            onTap: () => _showNotifications(appProvider),
          ),
          Consumer<LanguageProvider>(
            builder: (context, languageProvider, _) {
              return _headerButton(
                icon: Icons.translate_rounded,
                badge: languageProvider.showLocationSuggestion,
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => const LanguageAssistantScreen(),
                  ),
                ),
              );
            },
          ),
          GestureDetector(
            onTap: () => appProvider.setCurrentTabIndex(4),
            child: _profileAvatar(appProvider),
          ),
        ],
      ),
    );
  }

  Widget _headerButton({
    required IconData icon,
    required VoidCallback onTap,
    bool badge = false,
  }) {
    return Padding(
      padding: const EdgeInsets.only(left: 2),
      child: IconButton(
        onPressed: onTap,
        iconSize: 24,
        icon: Stack(
          clipBehavior: Clip.none,
          children: [
            Icon(icon, color: _navy),
            if (badge)
              const Positioned(
                right: -2,
                top: -2,
                child:
                    CircleAvatar(radius: 4, backgroundColor: Color(0xFFFF6B35)),
              ),
          ],
        ),
      ),
    );
  }

  Widget _profileAvatar(AppProvider appProvider) {
    final picture = appProvider.currentUser?.profilePicture;
    return Container(
      width: 38,
      height: 38,
      margin: const EdgeInsets.only(left: 2, right: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFEAF3FF),
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white, width: 2),
      ),
      clipBehavior: Clip.antiAlias,
      child: picture == null || picture.isEmpty
          ? const Icon(Icons.person_rounded, color: _primary)
          : _profileImage(picture),
    );
  }

  Widget _profileImage(String source) {
    if (source.startsWith('data:image') || source.length > 500) {
      try {
        final encoded = source.contains(',') ? source.split(',').last : source;
        final Uint8List bytes = base64Decode(encoded);
        return Image.memory(bytes, fit: BoxFit.cover);
      } catch (_) {
        return const Icon(Icons.person_rounded, color: _primary);
      }
    }

    final imageUrl = source.startsWith('http')
        ? source
        : '${Environment.backendUrl}${source.startsWith('/') ? '' : '/'}$source';
    return Image.network(
      imageUrl,
      fit: BoxFit.cover,
      errorBuilder: (_, __, ___) =>
          const Icon(Icons.person_rounded, color: _primary),
    );
  }

  Widget _buildSmartSearch() {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: () => showSearch(
          context: context,
          delegate: PlaceSearchDelegate(),
        ),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: _border),
            boxShadow: const [
              BoxShadow(
                color: Color(0x0A000000),
                blurRadius: 18,
                offset: Offset(0, 6),
              ),
            ],
          ),
          child: const Row(
            children: [
              Icon(Icons.auto_awesome_rounded, color: _primary, size: 21),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Ask TravelBuddy anything...',
                  style: TextStyle(color: _secondaryText, fontSize: 15),
                ),
              ),
              Icon(Icons.search_rounded, color: _navy),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDiscoveryHero(AppProvider appProvider) {
    return Container(
      height: 314,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(28),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1A000000),
            blurRadius: 28,
            offset: Offset(0, 14),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        fit: StackFit.expand,
        children: [
          Image.network(
            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200',
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => Container(color: _primary),
          ),
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Colors.black.withValues(alpha: 0.58),
                  Colors.black.withValues(alpha: 0.38),
                  Colors.black.withValues(alpha: 0.70),
                ],
                stops: const [0, 0.48, 1],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                const Text(
                  'Where should you\ntravel next?',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 30,
                    height: 1.05,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.6,
                  ),
                ),
                const SizedBox(height: 9),
                const Text(
                  'Get destination ideas for your budget, month, and travel style.',
                  style: TextStyle(
                    color: Color(0xFFE8F0EE),
                    fontSize: 14,
                    height: 1.35,
                  ),
                ),
                const SizedBox(height: 13),
                const Wrap(
                  spacing: 7,
                  children: [
                    _HeroChip(label: 'Beach'),
                    _HeroChip(label: 'Food'),
                    _HeroChip(label: 'Romantic'),
                    _HeroChip(label: 'Budget'),
                  ],
                ),
                const SizedBox(height: 18),
                SizedBox(
                  height: 52,
                  child: ElevatedButton(
                    onPressed: () => appProvider.setCurrentTabIndex(1),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: _navy,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(17),
                      ),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Start Discovery',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        SizedBox(width: 8),
                        Icon(Icons.arrow_forward_rounded, size: 19),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSmartPlanCard(AppProvider appProvider) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Colors.white, Color(0xFFF7FAFF)],
        ),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: _border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 18,
            offset: Offset(0, 7),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _iconTile(
                Icons.route_rounded,
                const Color(0xFFEAF3FF),
                _primary,
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Text(
                  'Already picked a place?',
                  style: TextStyle(
                    color: _navy,
                    fontSize: 19,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Text(
            'Build a realistic plan with confidence score and reality checks.',
            style: TextStyle(
              color: _secondaryText,
              fontSize: 14,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 14),
          const Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _FeaturePill(
                icon: Icons.verified_outlined,
                label: 'Confidence score',
              ),
              _FeaturePill(
                icon: Icons.route_outlined,
                label: 'Route logic',
              ),
              _FeaturePill(
                icon: Icons.warning_amber_rounded,
                label: 'Common mistakes',
              ),
            ],
          ),
          const SizedBox(height: 18),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: () => appProvider.setCurrentTabIndex(2),
              style: FilledButton.styleFrom(
                backgroundColor: _primary,
                padding: const EdgeInsets.symmetric(vertical: 15),
                shape: const StadiumBorder(),
              ),
              child: const Text(
                'Build Smart Plan',
                style: TextStyle(fontWeight: FontWeight.w800),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContinuePlanning(AppProvider appProvider) {
    final trips = appProvider.tripPlans;
    if (trips.isEmpty) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeader('Continue planning'),
          const SizedBox(height: 12),
          _outlinedCard(
            child: Row(
              children: [
                _iconTile(
                  Icons.bookmark_outline_rounded,
                  const Color(0xFFEAF3FF),
                  _primary,
                ),
                const SizedBox(width: 14),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'No saved trips yet',
                        style: TextStyle(
                          color: _navy,
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Start by discovering your next trip.',
                        style: TextStyle(color: Colors.black54, fontSize: 13),
                      ),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: () => appProvider.setCurrentTabIndex(1),
                  child: const Text('Discover'),
                ),
              ],
            ),
          ),
        ],
      );
    }

    final trip = _bestTripToContinue(trips);
    final progress = _tripProgress(trip);
    final confidence = _confidenceScore(trip);
    final interests = _tripInterests(trip);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHeader(
          'Continue planning',
          action: 'See all',
          onAction: () => appProvider.setCurrentTabIndex(3),
        ),
        const SizedBox(height: 12),
        Material(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          child: InkWell(
            borderRadius: BorderRadius.circular(24),
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => TripPlanDetailScreen(tripPlan: trip),
              ),
            ),
            child: Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: _border),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x0A000000),
                    blurRadius: 18,
                    offset: Offset(0, 7),
                  ),
                ],
              ),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(18),
                    child: SizedBox(
                      width: 86,
                      height: 106,
                      child: Image.network(
                        _tripImageUrl(trip),
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          color: const Color(0xFFEAF3FF),
                          child: const Icon(
                            Icons.map_rounded,
                            color: _primary,
                            size: 30,
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          trip.tripTitle.isEmpty
                              ? trip.destination
                              : trip.tripTitle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: _navy,
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${trip.durationDays} day${trip.durationDays == 1 ? '' : 's'}'
                          '${confidence == null ? '' : ' • $confidence% confidence'}',
                          style: const TextStyle(
                            color: Colors.black54,
                            fontSize: 12,
                          ),
                        ),
                        if (interests.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 6,
                            children: interests
                                .map(
                                  (interest) => Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF2F2F7),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Text(
                                      interest,
                                      style: const TextStyle(
                                        color: _secondaryText,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                )
                                .toList(),
                          ),
                        ],
                        const SizedBox(height: 10),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(5),
                          child: LinearProgressIndicator(
                            minHeight: 6,
                            value: progress,
                            backgroundColor: const Color(0xFFE5E5EA),
                            valueColor:
                                const AlwaysStoppedAnimation<Color>(_primary),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    width: 38,
                    height: 38,
                    decoration: const BoxDecoration(
                      color: _primary,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.arrow_forward_rounded,
                      color: Colors.white,
                      size: 19,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildQuickTools(AppProvider appProvider) {
    final tools = [
      _ToolData(
        'Safety',
        Icons.health_and_safety_outlined,
        const Color(0xFFFFECE8),
        const Color(0xFFD94B35),
        () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const SafetyHubScreen()),
        ),
      ),
      _ToolData(
        'Translate',
        Icons.translate_rounded,
        const Color(0xFFEAF3FF),
        _primary,
        () => Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => const LanguageAssistantScreen(),
          ),
        ),
      ),
      _ToolData(
        'Transport',
        Icons.directions_bus_outlined,
        const Color(0xFFF2F2F7),
        const Color(0xFF5856D6),
        () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const TransportHubScreen()),
        ),
      ),
      _ToolData(
        'Nearby',
        Icons.near_me_outlined,
        const Color(0xFFEAF3FF),
        _primary,
        () => _openNearbySearch('places nearby'),
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHeader('Quick travel tools'),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: tools.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 2.35,
          ),
          itemBuilder: (context, index) {
            final tool = tools[index];
            return Material(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              child: InkWell(
                onTap: tool.onTap,
                borderRadius: BorderRadius.circular(20),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: _border),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x08000000),
                        blurRadius: 14,
                        offset: Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      _iconTile(tool.icon, tool.background, tool.foreground,
                          size: 40, iconSize: 21),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          tool.label,
                          style: const TextStyle(
                            color: _navy,
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildNearYouNow(AppProvider appProvider) {
    final actions = [
      (
        'Food nearby',
        'Restaurants and local favorites',
        Icons.restaurant_outlined,
        const Color(0xFFFFF2E8),
        const Color(0xFFFF9500),
        'food nearby',
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600'
      ),
      (
        'Culture',
        'Museums and local heritage',
        Icons.museum_outlined,
        const Color(0xFFF2EDFF),
        const Color(0xFF5856D6),
        'cultural places nearby',
        'https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=600'
      ),
      (
        'Sunset',
        'Scenic spots for this evening',
        Icons.wb_twilight_outlined,
        const Color(0xFFFFECE8),
        const Color(0xFFFF6B4A),
        'sunset viewpoints nearby',
        'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600'
      ),
      (
        'Open now',
        'Useful places available now',
        Icons.schedule_rounded,
        const Color(0xFFEAF8EF),
        const Color(0xFF34C759),
        'places open now',
        'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600'
      ),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionHeader(
          'Near you now',
          action: appProvider.places.isEmpty ? null : 'View places',
          onAction: () => _openNearbySearch('places nearby'),
        ),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: actions.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 0.96,
          ),
          itemBuilder: (context, index) {
            final action = actions[index];
            return Material(
              color: Colors.white,
              borderRadius: BorderRadius.circular(22),
              child: InkWell(
                onTap: () => _openNearbySearch(action.$6),
                borderRadius: BorderRadius.circular(22),
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(22),
                    border: Border.all(color: _border),
                    boxShadow: const [
                      BoxShadow(
                        color: Color(0x08000000),
                        blurRadius: 16,
                        offset: Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(15),
                        child: SizedBox(
                          width: double.infinity,
                          height: 88,
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              Image.network(
                                action.$7,
                                fit: BoxFit.cover,
                                errorBuilder: (_, __, ___) =>
                                    Container(color: action.$4),
                              ),
                              Positioned(
                                left: 9,
                                bottom: 9,
                                child: _iconTile(
                                  action.$3,
                                  Colors.white.withValues(alpha: 0.92),
                                  action.$5,
                                  size: 36,
                                  iconSize: 19,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        action.$1,
                        style: const TextStyle(
                          color: _navy,
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        action.$2,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: _secondaryText,
                          fontSize: 11,
                          height: 1.25,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  void _openNearbySearch(String query) {
    final delegate = PlaceSearchDelegate()..query = query;
    showSearch(context: context, delegate: delegate);
  }

  Widget _sectionHeader(
    String title, {
    String? action,
    VoidCallback? onAction,
  }) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: const TextStyle(
              color: _navy,
              fontSize: 20,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.25,
            ),
          ),
        ),
        if (action != null)
          TextButton(
            onPressed: onAction,
            child: Text(action),
          ),
      ],
    );
  }

  Widget _outlinedCard({
    required Widget child,
    EdgeInsetsGeometry padding = const EdgeInsets.all(20),
  }) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: _border),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 18,
            offset: Offset(0, 7),
          ),
        ],
      ),
      child: child,
    );
  }

  Widget _iconTile(
    IconData icon,
    Color background,
    Color foreground, {
    double size = 48,
    double iconSize = 24,
  }) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(13),
      ),
      child: Icon(icon, color: foreground, size: iconSize),
    );
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  String _firstName(String? username) {
    final value = username?.trim();
    if (value == null || value.isEmpty) return 'Traveler';
    return value.split(RegExp(r'\s+')).first;
  }

  Future<String> _locationLabel(AppProvider appProvider) async {
    final location = appProvider.currentLocation;
    if (location == null) {
      final savedLocation = appProvider.currentUser?.location?.trim();
      return savedLocation == null || savedLocation.isEmpty
          ? 'Location unavailable'
          : savedLocation;
    }

    final key =
        '${location.latitude.toStringAsFixed(3)},${location.longitude.toStringAsFixed(3)}';
    if (_locationCache.containsKey(key)) return _locationCache[key]!;

    final offline = OfflineGeocodingService()
        .getLocationName(location.latitude, location.longitude);
    if (offline != 'Current Location') {
      _locationCache[key] = offline;
      return offline;
    }

    try {
      final uri = Uri.parse(
        'https://api.bigdatacloud.net/data/reverse-geocode-client'
        '?latitude=${location.latitude}&longitude=${location.longitude}'
        '&localityLanguage=en',
      );
      final response = await http.get(uri).timeout(const Duration(seconds: 3));
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        final city = (data['city'] ?? data['locality'] ?? '').toString();
        final country = (data['countryName'] ?? '').toString();
        final label =
            [city, country].where((value) => value.isNotEmpty).join(', ');
        if (label.isNotEmpty) {
          _locationCache[key] = label;
          return label;
        }
      }
    } catch (_) {
      // The saved/offline location remains a useful fallback.
    }

    return 'Current location';
  }

  TripPlan _bestTripToContinue(List<TripPlan> trips) {
    for (final trip in trips) {
      final progress = _tripProgress(trip);
      if (progress > 0 && progress < 1) return trip;
    }
    return trips.first;
  }

  double _tripProgress(TripPlan trip) {
    final activities = trip.dailyPlans.expand((day) => day.activities).toList();
    if (activities.isEmpty) return 0;
    final visited = activities.where((activity) => activity.isVisited).length;
    return visited / activities.length;
  }

  int? _confidenceScore(TripPlan trip) {
    final metadata = trip.metadata;
    if (metadata == null) return null;
    final generatedPlan = metadata['generatedPlan'];
    if (generatedPlan is Map) {
      final score = generatedPlan['planningConfidenceScore'];
      if (score is num) return score.round().clamp(0, 100);
    }
    final score = metadata['planningConfidenceScore'];
    return score is num ? score.round().clamp(0, 100) : null;
  }

  List<String> _tripInterests(TripPlan trip) {
    final interests = trip.metadata?['interests'];
    if (interests is! List) return const [];
    return interests
        .map((item) => item.toString())
        .where((item) => item.isNotEmpty)
        .take(2)
        .toList();
  }

  String _tripImageUrl(TripPlan trip) {
    for (final day in trip.dailyPlans) {
      final dayPhoto = day.photoUrl?.trim();
      if (dayPhoto != null && dayPhoto.isNotEmpty) return dayPhoto;

      for (final activity in day.activities) {
        final image = activity.imageURL?.trim();
        if (image != null && image.isNotEmpty) return image;
        final thumbnail = activity.photoThumbnail?.trim();
        if (thumbnail != null && thumbnail.isNotEmpty) return thumbnail;
      }
    }

    return 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=700';
  }

  Widget _buildHomeSkeleton() {
    return Column(
      children: [
        _skeletonBlock(height: 300, radius: 28),
        const SizedBox(height: 16),
        _skeletonBlock(height: 170, radius: 24),
        const SizedBox(height: 30),
        Align(
          alignment: Alignment.centerLeft,
          child: _skeletonBlock(height: 24, width: 180, radius: 8),
        ),
        const SizedBox(height: 12),
        _skeletonBlock(height: 108, radius: 24),
        const SizedBox(height: 30),
        Row(
          children: [
            Expanded(child: _skeletonBlock(height: 76, radius: 20)),
            const SizedBox(width: 10),
            Expanded(child: _skeletonBlock(height: 76, radius: 20)),
          ],
        ),
      ],
    );
  }

  Widget _skeletonBlock({
    required double height,
    double? width,
    required double radius,
  }) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.45, end: 0.9),
      duration: const Duration(milliseconds: 900),
      curve: Curves.easeInOut,
      builder: (context, opacity, _) {
        return Container(
          width: width ?? double.infinity,
          height: height,
          decoration: BoxDecoration(
            color: const Color(0xFFE5E5EA).withValues(alpha: opacity),
            borderRadius: BorderRadius.circular(radius),
          ),
        );
      },
    );
  }

  void _showNotifications(AppProvider appProvider) {
    showModalBottomSheet(
      context: context,
      showDragHandle: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        final hasTrips = appProvider.tripPlans.isNotEmpty;
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Travel updates',
                  style: TextStyle(
                    color: _navy,
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 14),
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: _iconTile(
                    hasTrips ? Icons.map_outlined : Icons.explore_outlined,
                    const Color(0xFFE2F2EE),
                    _primary,
                  ),
                  title: Text(
                    hasTrips
                        ? 'Your saved plans are ready'
                        : 'Find a trip that fits you',
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  subtitle: Text(
                    hasTrips
                        ? 'Continue where you left off.'
                        : 'Discover destinations by budget and travel style.',
                  ),
                  onTap: () {
                    Navigator.pop(context);
                    appProvider.setCurrentTabIndex(hasTrips ? 3 : 1);
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _FeaturePill extends StatelessWidget {
  final IconData icon;
  final String label;

  const _FeaturePill({
    required this.icon,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: const Color(0xFFEAF3FF),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFFD8E9FF)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: _primary, size: 15),
          const SizedBox(width: 5),
          Text(
            label,
            style: const TextStyle(
              color: _navy,
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroChip extends StatelessWidget {
  final String label;

  const _HeroChip({required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.28)),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _PlaceThumbnail extends StatelessWidget {
  final Place place;
  final double size;

  const _PlaceThumbnail({required this.place, required this.size});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: size,
        height: size,
        color: const Color(0xFFE2F2EE),
        child: place.photoUrl.isEmpty
            ? const Icon(Icons.place_outlined, color: _primary)
            : Image.network(
                place.photoUrl,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) =>
                    const Icon(Icons.place_outlined, color: _primary),
              ),
      ),
    );
  }
}

class _ToolData {
  final String label;
  final IconData icon;
  final Color background;
  final Color foreground;
  final VoidCallback onTap;

  const _ToolData(
    this.label,
    this.icon,
    this.background,
    this.foreground,
    this.onTap,
  );
}
