import 'dart:convert';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:share_plus/share_plus.dart';
import '../models/place.dart';
import '../constants/app_constants.dart';
import '../providers/app_provider.dart';
import '../widgets/add_to_trip_dialog.dart';


class PlaceDetailsScreen extends StatefulWidget {
  final Place place;

  const PlaceDetailsScreen({super.key, required this.place});

  @override
  State<PlaceDetailsScreen> createState() => _PlaceDetailsScreenState();
}

class _PlaceDetailsScreenState extends State<PlaceDetailsScreen> with TickerProviderStateMixin {
  final TextEditingController _questionController = TextEditingController();
  bool _isAskingAI = false;
  String? _aiResponse;
  int _currentPhotoIndex = 0;
  PageController? _photoPageController;
  
  // Animation controllers
  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;
  
  // Place details state
  bool _isLoadingDetails = false;
  String? _detailsError;
  List<String> _photoGallery = [];
  List<String> _photoAttributions = [];
  Map<String, dynamic>? _placeDetails;
  
  // Enhanced description state
  String? _enhancedDescription;
  bool _isLoadingEnhancedDescription = false;
  
  // Local tip state
  String? _aiLocalTip;
  bool _isLoadingLocalTip = false;
  

  
  // Nearby places state
  List<Place> _nearbyPlaces = [];
  bool _isLoadingNearby = false;
  
  @override
  void initState() {
    super.initState();
    
    // Initialize animations
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _fadeController, curve: Curves.easeInOut),
    );
    
    _fadeController.forward();
    _photoPageController = PageController(initialPage: _currentPhotoIndex);
    
    _loadPlaceDetails();
    _loadNearbyPlaces();
    _loadEnhancedDescription();
    _loadLocalTip();
  }
  
  @override
  void dispose() {
    _questionController.dispose();
    _fadeController.dispose();
    _photoPageController?.dispose();
    super.dispose();
  }
  
  Future<void> _loadPlaceDetails() async {
    // Always fetch fresh photo from Google API
    await _loadPlacePhoto();
    
    // Check cache for business details
    final cachedDetails = await _getCachedDetails();
    if (cachedDetails != null) {
      _placeDetails = cachedDetails;
      setState(() {});
      return;
    }
    
    setState(() {
      _isLoadingDetails = true;
      _detailsError = null;
    });
    
    try {
      // Generate AI business details instead of Google API
      final aiDetails = await _generateAIBusinessDetails();
      _placeDetails = aiDetails;
      
      // Cache for 24 hours
      await _cacheDetails(aiDetails);
    } catch (e) {
      _detailsError = 'Error loading details: $e';
    } finally {
      setState(() => _isLoadingDetails = false);
    }
  }
  
  Future<void> _loadPlacePhoto() async {
    if (widget.place.id.isEmpty) {
      _setFallbackPhoto();
      return;
    }
    
    try {
      // Fetch photo from Google Places API
      final response = await http.get(
        Uri.parse('${AppConstants.baseUrl}/api/places/details?place_id=${widget.place.id}&fields=photos'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 8));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['photos'] != null && (data['photos'] as List).isNotEmpty) {
          final photo = (data['photos'] as List).first;
          final photoUrl = '${AppConstants.baseUrl}/api/places/photo?ref=${Uri.encodeComponent(photo['photo_reference'])}&w=800';
          _photoGallery = [photoUrl];
          setState(() {});
          return;
        }
      }
    } catch (e) {
      print('Failed to load place photo: $e');
    }
    
    _setFallbackPhoto();
  }
  

  
  void _setFallbackPhoto() {
    if (_photoGallery.isEmpty) {
      if (widget.place.photoUrl.isNotEmpty) {
        _photoGallery = [widget.place.photoUrl];
      } else {
        _photoGallery = []; // No photo available
      }
    }
    setState(() {});
  }
  
  Future<Map<String, dynamic>?> _getCachedDetails() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cached = prefs.getString('place_details_${widget.place.id}');
      if (cached != null) {
        final data = json.decode(cached);
        final timestamp = data['_cached_at'] as int?;
        if (timestamp != null && DateTime.now().millisecondsSinceEpoch - timestamp < 86400000) { // 24 hour cache
          return data;
        }
      }
    } catch (e) {
      print('Cache read error: $e');
    }
    return null;
  }
  
  Future<void> _cacheDetails(Map<String, dynamic> data) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      data['_cached_at'] = DateTime.now().millisecondsSinceEpoch;
      await prefs.setString('place_details_${widget.place.id}', json.encode(data));
    } catch (e) {
      print('Cache write error: $e');
    }
  }
  
  Future<Map<String, dynamic>> _generateAIBusinessDetails() async {
    try {
      final contextualPrompt = _buildBusinessDetailsPrompt();
      
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/ai/ask'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'question': contextualPrompt,
          'temperature': 0.3, // Lower temperature for more consistent results
          'max_tokens': 800,
        }),
      ).timeout(const Duration(seconds: 15));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final aiResponse = data['answer'];
        
        // Extract JSON from AI response
        final jsonMatch = RegExp(r'\{[\s\S]*\}').firstMatch(aiResponse);
        if (jsonMatch != null) {
          try {
            final aiDetails = json.decode(jsonMatch.group(0)!);
            return _validateAndEnhanceAIDetails(aiDetails);
          } catch (e) {
            print('JSON parse error: $e');
          }
        }
      }
    } catch (e) {
      print('AI business details failed: $e');
    }
    
    return _generateFallbackDetails();
  }
  
  String _buildBusinessDetailsPrompt() {
    final placeType = widget.place.type.toLowerCase();
    final rating = widget.place.rating;
    final location = widget.place.address;
    
    return '''
Generate realistic business details for: ${widget.place.name}
Type: ${widget.place.type}
Location: $location
Rating: $rating/5

IMPORTANT: Return ONLY valid JSON with these exact fields:
{
  "business_status": "OPERATIONAL",
  "price_level": 1-4,
  "opening_hours": {
    "open_now": true/false,
    "weekday_text": ["Monday: 9:00 AM – 6:00 PM", ...]
  },
  "types": ["${placeType.replaceAll(' ', '_')}"],
  "editorial_summary": {
    "overview": "Brief description (50-80 words)"
  },
  "user_ratings_total": number,
  "vicinity": "$location",
  "formatted_phone_number": "+1 (XXX) XXX-XXXX",
  "website": "https://example.com",
  "url": "https://maps.google.com/?q=${Uri.encodeComponent(location)}"
}

Guidelines:
- Price level: ${_getPriceLevelGuidance(placeType, rating)}
- Hours: ${_getHoursGuidance(placeType)}
- Phone: Use realistic area code for location
- Website: Create believable domain name
- Overview: Highlight unique features and atmosphere
- Ratings total: ${(rating * 100).round()}-${(rating * 200).round()} reviews

Return ONLY the JSON, no other text.''';
  }
  
  String _getPriceLevelGuidance(String type, double rating) {
    if (type.contains('restaurant') || type.contains('cafe')) {
      return rating > 4.5 ? '3-4 (upscale dining)' : rating > 4.0 ? '2-3 (moderate)' : '1-2 (casual)';
    }
    if (type.contains('hotel') || type.contains('resort')) {
      return rating > 4.5 ? '4 (luxury)' : rating > 4.0 ? '3 (upscale)' : '2 (mid-range)';
    }
    if (type.contains('attraction') || type.contains('museum')) {
      return '1-2 (affordable entry)';
    }
    return '1-2 (budget-friendly)';
  }
  
  String _getHoursGuidance(String type) {
    if (type.contains('restaurant')) return 'Typical restaurant hours (11 AM - 10 PM)';
    if (type.contains('cafe')) return 'Cafe hours (7 AM - 6 PM)';
    if (type.contains('museum')) return 'Museum hours (9 AM - 5 PM, closed Mondays)';
    if (type.contains('shop')) return 'Retail hours (10 AM - 8 PM)';
    return 'Standard business hours (9 AM - 6 PM)';
  }
  
  Map<String, dynamic> _validateAndEnhanceAIDetails(Map<String, dynamic> aiDetails) {
    // Validate and fix common AI errors
    final enhanced = Map<String, dynamic>.from(aiDetails);
    
    // Ensure price_level is valid
    final priceLevel = enhanced['price_level'];
    if (priceLevel == null || priceLevel < 0 || priceLevel > 4) {
      enhanced['price_level'] = _estimatePriceLevel();
    }
    
    // Validate opening hours structure
    if (enhanced['opening_hours'] == null) {
      enhanced['opening_hours'] = {
        'open_now': _isCurrentlyOpen(),
        'weekday_text': _generateOpeningHours(),
      };
    }
    
    // Ensure user_ratings_total is reasonable
    final ratingsTotal = enhanced['user_ratings_total'];
    if (ratingsTotal == null || ratingsTotal < 10 || ratingsTotal > 10000) {
      enhanced['user_ratings_total'] = (widget.place.rating * 150).round();
    }
    
    // Validate phone number format
    final phone = enhanced['formatted_phone_number'];
    if (phone == null || !phone.toString().contains('(')) {
      enhanced['formatted_phone_number'] = _generateRealisticPhone();
    }
    
    return enhanced;
  }
  
  bool _isCurrentlyOpen() {
    final now = DateTime.now();
    final hour = now.hour;
    final day = now.weekday;
    
    // Sunday = 7, Saturday = 6
    if (day == 7) return hour >= 10 && hour <= 18; // Sunday hours
    return hour >= 8 && hour <= 20; // Weekday hours
  }
  
  String _generateRealisticPhone() {
    final areaCodes = ['212', '415', '312', '713', '404', '617', '206', '303'];
    final areaCode = areaCodes[DateTime.now().millisecond % areaCodes.length];
    final exchange = (200 + DateTime.now().second * 7) % 800;
    final number = (1000 + DateTime.now().millisecond * 9) % 10000;
    return '+1 ($areaCode) $exchange-${number.toString().padLeft(4, '0')}';
  }
  
  Map<String, dynamic> _generateFallbackDetails() {
    final now = DateTime.now();
    final isOpen = now.hour >= 8 && now.hour <= 20;
    
    return {
      'business_status': 'OPERATIONAL',
      'price_level': _estimatePriceLevel(),
      'opening_hours': {
        'open_now': isOpen,
        'weekday_text': _generateOpeningHours(),
      },
      'types': [widget.place.type.toLowerCase().replaceAll(' ', '_')],
      'editorial_summary': {
        'overview': 'A popular ${widget.place.type.toLowerCase()} in the area with good reviews.',
      },
      'user_ratings_total': (widget.place.rating * 50).round(),
      'vicinity': widget.place.address,
      'formatted_phone_number': '+1 (555) 123-4567',
      'website': 'https://example.com',
      'url': 'https://maps.google.com/?q=${Uri.encodeComponent(widget.place.address)}',
    };
  }
  
  int _estimatePriceLevel() {
    final type = widget.place.type.toLowerCase();
    final rating = widget.place.rating;
    
    if (type.contains('restaurant')) {
      if (rating >= 4.5) return 3; // Expensive
      if (rating >= 4.0) return 2; // Moderate  
      return 1; // Inexpensive
    }
    
    if (type.contains('cafe') || type.contains('bakery')) {
      return rating >= 4.3 ? 2 : 1;
    }
    
    if (type.contains('hotel') || type.contains('resort')) {
      if (rating >= 4.7) return 4; // Very expensive
      if (rating >= 4.3) return 3; // Expensive
      if (rating >= 3.8) return 2; // Moderate
      return 1; // Inexpensive
    }
    
    if (type.contains('attraction') || type.contains('museum')) {
      return rating >= 4.5 ? 2 : 1;
    }
    
    // Default for other types
    return rating >= 4.2 ? 2 : 1;
  }
  
  List<String> _generateOpeningHours() {
    final type = widget.place.type.toLowerCase();
    
    if (type.contains('restaurant')) {
      return [
        'Monday: 11:00 AM – 10:00 PM',
        'Tuesday: 11:00 AM – 10:00 PM',
        'Wednesday: 11:00 AM – 10:00 PM', 
        'Thursday: 11:00 AM – 10:00 PM',
        'Friday: 11:00 AM – 11:00 PM',
        'Saturday: 11:00 AM – 11:00 PM',
        'Sunday: 12:00 PM – 9:00 PM',
      ];
    }
    
    if (type.contains('cafe')) {
      return [
        'Monday: 7:00 AM – 6:00 PM',
        'Tuesday: 7:00 AM – 6:00 PM',
        'Wednesday: 7:00 AM – 6:00 PM',
        'Thursday: 7:00 AM – 6:00 PM', 
        'Friday: 7:00 AM – 7:00 PM',
        'Saturday: 8:00 AM – 7:00 PM',
        'Sunday: 8:00 AM – 5:00 PM',
      ];
    }
    
    if (type.contains('museum') || type.contains('attraction')) {
      return [
        'Monday: Closed',
        'Tuesday: 9:00 AM – 5:00 PM',
        'Wednesday: 9:00 AM – 5:00 PM',
        'Thursday: 9:00 AM – 5:00 PM',
        'Friday: 9:00 AM – 5:00 PM',
        'Saturday: 10:00 AM – 6:00 PM',
        'Sunday: 10:00 AM – 6:00 PM',
      ];
    }
    
    // Default business hours
    return [
      'Monday: 9:00 AM – 6:00 PM',
      'Tuesday: 9:00 AM – 6:00 PM',
      'Wednesday: 9:00 AM – 6:00 PM',
      'Thursday: 9:00 AM – 6:00 PM',
      'Friday: 9:00 AM – 6:00 PM',
      'Saturday: 10:00 AM – 5:00 PM',
      'Sunday: 12:00 PM – 4:00 PM',
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        final isFavorite = appProvider.favoriteIds.contains(widget.place.id);
        
        return Scaffold(
          body: CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 300,
                pinned: true,
                actions: [
                  Semantics(
                    label: isFavorite ? 'Remove from favorites' : 'Add to favorites',
                    button: true,
                    child: IconButton(
                      onPressed: () {
                        appProvider.toggleFavorite(widget.place.id);
                        HapticFeedback.lightImpact();
                      },
                      icon: Icon(
                        isFavorite ? Icons.favorite : Icons.favorite_border,
                        color: isFavorite ? Colors.red : Colors.white,
                      ),
                      tooltip: isFavorite ? 'Remove from favorites' : 'Add to favorites',
                    ),
                  ),
                ],
                flexibleSpace: FlexibleSpaceBar(
                  background: Stack(
                    fit: StackFit.expand,
                    children: [
                      _photoGallery.isNotEmpty
                          ? PageView.builder(
                              controller: _photoPageController,
                              onPageChanged: (index) => setState(() => _currentPhotoIndex = index),
                              itemCount: _photoGallery.length,
                              itemBuilder: (context, index) => Stack(
                                fit: StackFit.expand,
                                children: [
                                  Image.network(
                                    _photoGallery[index],
                                    fit: BoxFit.cover,
                                    errorBuilder: (context, error, stackTrace) => Container(
                                      color: Colors.grey[300],
                                      child: const Icon(Icons.image, size: 64, color: Colors.grey),
                                    ),
                                  ),
                                  Positioned(
                                    bottom: 16,
                                    right: 16,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: Colors.black54,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        '${index + 1}/${_photoGallery.length}',
                                        style: const TextStyle(color: Colors.white, fontSize: 12),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            )

                          : Container(
                              color: Colors.grey[300],
                              child: const Icon(Icons.image, size: 64, color: Colors.grey),
                            ),
                      Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Colors.transparent, Colors.black54],
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 16,
                        left: 16,
                        right: 16,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        widget.place.name,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 24,
                                          fontWeight: FontWeight.bold,
                                          shadows: [Shadow(blurRadius: 2, color: Colors.black)],
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        widget.place.address,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 14,
                                          shadows: [Shadow(blurRadius: 2, color: Colors.black)],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                if (_placeDetails?['opening_hours']?['open_now'] != null)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: _placeDetails!['opening_hours']['open_now'] == true 
                                          ? Colors.green : Colors.red,
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      _placeDetails!['opening_hours']['open_now'] == true ? 'OPEN' : 'CLOSED',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                ...List.generate(5, (index) => Icon(
                                  Icons.star,
                                  size: 16,
                                  color: index < widget.place.rating.round() ? Colors.amber : Colors.grey[400],
                                )),
                                const SizedBox(width: 8),
                                Text(
                                  widget.place.rating.toStringAsFixed(1),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    shadows: [Shadow(blurRadius: 2, color: Colors.black)],
                                  ),
                                ),
                                if (_placeDetails?['price_level'] != null) ...[
                                  const SizedBox(width: 16),
                                  Text(
                                    _getPriceLevelSymbol(_placeDetails!['price_level']),
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      shadows: [Shadow(blurRadius: 2, color: Colors.black)],
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Quick Info Cards
                      Row(
                        children: [
                          Expanded(
                            child: _buildQuickInfoCard(
                              Icons.star,
                              '${widget.place.rating}',
                              'Rating',
                              Colors.amber,
                            ),
                          ),
                          const SizedBox(width: 8),
                          if (_placeDetails?['price_level'] != null)
                            Expanded(
                              child: _buildQuickInfoCard(
                                Icons.attach_money,
                                _getPriceLevelSymbol(_placeDetails!['price_level']),
                                'Price',
                                Colors.green,
                              ),
                            ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _buildQuickInfoCard(
                              Icons.location_on,
                              _getDistanceText(),
                              'Distance',
                              Color(AppConstants.colors['primary']!),
                            ),
                          ),
                        ],
                      ),
                      
                      const SizedBox(height: 20),
                      
                      // About Section
                      if (widget.place.description.isNotEmpty) ..._buildSection(
                        'About',
                        Icons.info_outline,
                        _buildExpandableDescription(),
                      ),
                      
                      // Local Tip Section
                      ..._buildSection(
                        'Local Tip',
                        Icons.lightbulb_outline,
                        _buildLocalTipSection(),
                      ),
                      
                      // Action Buttons
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.grey[50],
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.grey[200]!),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Actions',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 12),
                            // Primary Actions
                            Row(
                              children: [
                                Expanded(
                                  child: _buildActionButton(
                                    Icons.directions,
                                    'Directions',
                                    Color(AppConstants.colors['primary']!),
                                    () => _getDirections(),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: _buildActionButton(
                                    Icons.map,
                                    'View On Map',
                                    Colors.blue,
                                    () => _viewOnMap(),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            // Secondary Actions
                            Row(
                              children: [
                                if (widget.place.phoneNumber != null || _placeDetails?['formatted_phone_number'] != null) ...[
                                  Expanded(
                                    child: _buildActionButton(
                                      Icons.phone,
                                      'Call',
                                      Colors.green,
                                      () => _launchUrl('tel:${widget.place.phoneNumber ?? _placeDetails!['formatted_phone_number']}'),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                ],
                                Expanded(
                                  child: _buildActionButton(
                                    Icons.share,
                                    'Share',
                                    Colors.orange,
                                    _sharePlace,
                                    outlined: true,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            // Trip & Website Actions
                            Row(
                              children: [
                                Expanded(
                                  child: _buildActionButton(
                                    Icons.add_location,
                                    'Add to Trip',
                                    Colors.purple,
                                    () => showDialog(
                                      context: context,
                                      builder: (context) => AddToTripDialog(place: widget.place),
                                    ),
                                    outlined: true,
                                  ),
                                ),
                                if (widget.place.website != null || _placeDetails?['website'] != null) ...[
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: _buildActionButton(
                                      Icons.web,
                                      'Visit Website',
                                      Colors.indigo,
                                      () => _launchUrl(widget.place.website ?? _placeDetails!['website']),
                                      outlined: true,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
                      
                      const SizedBox(height: 20),
                      
                      // AI Assistant Section
                      ..._buildSection(
                        'Ask AI Assistant',
                        Icons.psychology,
                        _buildAISection(),
                      ),
                      
                      // Business Details
                      if (_placeDetails != null) ..._buildSection(
                        'Business Details',
                        Icons.business,
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (_placeDetails!['business_status'] != null)
                              _buildDetailRow('Status', _placeDetails!['business_status']),
                            if (_placeDetails!['price_level'] != null)
                              _buildDetailRow('Price Level', _getPriceLevelText(_placeDetails!['price_level'])),
                            if (_placeDetails!['opening_hours'] != null) ...[
                              _buildDetailRow('Currently', 
                                _placeDetails!['opening_hours']['open_now'] == true ? '🟢 Open' : '🔴 Closed'),
                              if (_placeDetails!['opening_hours']['weekday_text'] != null) ...[
                                const SizedBox(height: 8),
                                const Text('Opening Hours:', style: TextStyle(fontWeight: FontWeight.bold)),
                                const SizedBox(height: 4),
                                ..._buildOpeningHours(_placeDetails!['opening_hours']['weekday_text']),
                              ],
                            ],
                            if (_placeDetails!['types'] != null) ...[
                              const SizedBox(height: 8),
                              const Text('Categories:', style: TextStyle(fontWeight: FontWeight.bold)),
                              const SizedBox(height: 4),
                              Wrap(
                                spacing: 4,
                                children: (_placeDetails!['types'] as List)
                                    .take(5)
                                    .map((type) => Chip(
                                      label: Text(
                                        type.toString().replaceAll('_', ' ').toUpperCase(),
                                        style: const TextStyle(fontSize: 10),
                                      ),
                                      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                    ))
                                    .toList(),
                              ),
                            ],
                          ],
                        ),
                      ),
                      
                      // Reviews Section
                      ..._buildSection(
                        'Reviews',
                        Icons.star_outline,
                        _buildReviewsSection(),
                      ),
                      
                      // Nearby Places Section
                      ..._buildSection(
                        'Nearby Places',
                        Icons.near_me,
                        _buildNearbyPlacesSection(),
                      ),
                      
                      // Contact & Location Info
                      if (widget.place.phoneNumber != null || _placeDetails?['formatted_phone_number'] != null || _placeDetails?['vicinity'] != null) ..._buildSection(
                        'Contact & Location',
                        Icons.contact_phone,
                        Column(
                          children: [
                            if (_placeDetails?['vicinity'] != null)
                              ListTile(
                                leading: const Icon(Icons.location_on),
                                title: Text(_placeDetails!['vicinity']),
                                subtitle: const Text('Vicinity'),
                                contentPadding: EdgeInsets.zero,
                              ),
                            if (widget.place.phoneNumber != null || _placeDetails?['formatted_phone_number'] != null)
                              ListTile(
                                leading: const Icon(Icons.phone),
                                title: Text(widget.place.phoneNumber ?? _placeDetails!['formatted_phone_number']),
                                contentPadding: EdgeInsets.zero,
                                onTap: () => _launchUrl('tel:${widget.place.phoneNumber ?? _placeDetails!['formatted_phone_number']}'),
                              ),
                          ],
                        ),
                      ),

                    ],
                  ),
                ),
              ),
              // Add safe area padding at the bottom
              SliverToBoxAdapter(
                child: SizedBox(
                  height: MediaQuery.of(context).padding.bottom + 20,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
  
  List<Widget> _buildSection(String title, IconData icon, Widget content) {
    return [
      Row(
        children: [
          Icon(icon, color: Color(AppConstants.colors['primary']!)),
          const SizedBox(width: 8),
          Text(
            title,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
        ],
      ),
      const SizedBox(height: 12),
      content,
      const SizedBox(height: 20),
    ];
  }
  
  Widget _buildAISection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.purple[50]!, Colors.blue[50]!],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.purple[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.purple.withOpacity(0.1),
            spreadRadius: 1,
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.purple[100],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(Icons.psychology, color: Colors.purple[700], size: 20),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'AI Assistant',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      'Get instant answers about this place',
                      style: TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Suggested Questions
          if (_aiResponse == null) ...[
            const Text(
              'Quick Questions:',
              style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: _getSuggestedQuestions().map((question) => 
                GestureDetector(
                  onTap: () {
                    _questionController.text = question;
                    _askAI();
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.purple[300]!),
                    ),
                    child: Text(
                      question,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.purple[700],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              ).toList(),
            ),
            const SizedBox(height: 16),
          ],
          
          // Question Input
          TextField(
            controller: _questionController,
            decoration: InputDecoration(
              hintText: 'Ask about hours, prices, recommendations...',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.purple[300]!),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.purple[300]!),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(color: Colors.purple[500]!, width: 2),
              ),
              filled: true,
              fillColor: Colors.white,
              isDense: true,
              suffixIcon: _questionController.text.isNotEmpty
                  ? IconButton(
                      onPressed: () {
                        _questionController.clear();
                        setState(() {});
                      },
                      icon: Icon(Icons.clear, color: Colors.grey[400]),
                    )
                  : null,
            ),
            maxLines: 2,
            onChanged: (value) => setState(() {}),
            onSubmitted: (value) => _askAI(),
          ),
          const SizedBox(height: 12),
          
          // Ask Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _isAskingAI || _questionController.text.trim().isEmpty ? null : _askAI,
              icon: _isAskingAI 
                  ? SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Icon(Icons.send, size: 18),
              label: Text(_isAskingAI ? 'Thinking...' : 'Ask AI Assistant'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.purple[600],
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 2,
              ),
            ),
          ),
          
          // AI Response
          if (_aiResponse != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.purple[200]!),
                boxShadow: [
                  BoxShadow(
                    color: Colors.purple.withOpacity(0.05),
                    spreadRadius: 1,
                    blurRadius: 3,
                    offset: const Offset(0, 1),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.auto_awesome, color: Colors.purple[600], size: 16),
                      const SizedBox(width: 6),
                      Text(
                        'AI Response',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.purple[700],
                          fontSize: 14,
                        ),
                      ),
                      const Spacer(),
                      IconButton(
                        onPressed: () => setState(() => _aiResponse = null),
                        icon: Icon(Icons.close, size: 16, color: Colors.grey[400]),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _aiResponse!,
                    style: const TextStyle(
                      fontSize: 14,
                      height: 1.5,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      TextButton.icon(
                        onPressed: () {
                          setState(() => _aiResponse = null);
                          _questionController.clear();
                        },
                        icon: const Icon(Icons.refresh, size: 16),
                        label: const Text('Ask Another'),
                        style: TextButton.styleFrom(
                          foregroundColor: Colors.purple[600],
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
  
  List<String> _getSuggestedQuestions() {
    final type = widget.place.type.toLowerCase();
    
    if (type.contains('restaurant') || type.contains('cafe')) {
      return [
        'What are the popular dishes?',
        'What are the opening hours?',
        'Do I need reservations?',
        'What\'s the price range?',
      ];
    }
    
    if (type.contains('museum') || type.contains('gallery')) {
      return [
        'What are the ticket prices?',
        'How long does a visit take?',
        'What are the main exhibits?',
        'Are there guided tours?',
      ];
    }
    
    if (type.contains('park') || type.contains('garden')) {
      return [
        'What activities are available?',
        'Is there an entrance fee?',
        'Best time to visit?',
        'Are pets allowed?',
      ];
    }
    
    if (type.contains('hotel') || type.contains('accommodation')) {
      return [
        'What amenities are included?',
        'Is parking available?',
        'What\'s the check-in time?',
        'Is breakfast included?',
      ];
    }
    
    // Default questions
    return [
      'What are the opening hours?',
      'How much does it cost?',
      'What should I expect?',
      'Any special requirements?',
    ];
  }
  
  Widget _buildReviewsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.blue[50],
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.blue[200]!),
          ),
          child: Column(
            children: [
              Row(
                children: [
                  Icon(Icons.reviews, color: Colors.blue[600], size: 24),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Customer Reviews',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'See what others are saying about this place',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _viewReviewsOnGoogleMaps,
                  icon: const Icon(Icons.open_in_new, size: 18),
                  label: const Text('View Reviews on Google Maps'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue[600],
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
  
  void _viewReviewsOnGoogleMaps() async {
    // Use Google Maps place details URL that opens directly to reviews
    String url;
    if (widget.place.id.isNotEmpty) {
      // Use place ID for direct place details page
      url = 'https://maps.google.com/maps/place/?q=place_id:${widget.place.id}';
    } else if (widget.place.latitude != null && widget.place.longitude != null) {
      // Use coordinates with place name for better matching
      url = 'https://maps.google.com/maps/search/${Uri.encodeComponent(widget.place.name)}/@${widget.place.latitude},${widget.place.longitude},17z';
    } else {
      // Fallback to name + address search
      url = 'https://maps.google.com/maps/search/${Uri.encodeComponent(widget.place.name + ' ' + widget.place.address)}';
    }
    await _launchUrl(url);
  }
  

  
  void _askAI() async {
    if (_questionController.text.trim().isEmpty) return;
    
    setState(() => _isAskingAI = true);
    
    try {
      final contextualPrompt = _buildAIAssistantPrompt(_questionController.text.trim());
      
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/ai/ask'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'question': contextualPrompt,
          'temperature': 0.4, // More focused responses
          'max_tokens': 300,
        }),
      ).timeout(const Duration(seconds: 10));
      
      String? aiResponse;
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        aiResponse = data['answer']?.toString().trim();
      }
      
      setState(() {
        if (aiResponse != null && aiResponse.length > 20) {
          _aiResponse = _cleanupAIResponse(aiResponse);
        } else {
          // Provide a helpful fallback based on the question
          _aiResponse = _generateFallbackAnswer(_questionController.text.trim());
        }
      });
    } catch (e) {
      setState(() {
        _aiResponse = 'Connection issue. Please check your internet and try again.';
      });
    } finally {
      setState(() => _isAskingAI = false);
    }
  }
  
  String _buildAIAssistantPrompt(String userQuestion) {
    final type = widget.place.type.toLowerCase();
    final rating = widget.place.rating;
    
    return '''You are a knowledgeable local assistant answering questions about ${widget.place.name}.

Place Details:
- Name: ${widget.place.name}
- Type: ${widget.place.type}
- Location: ${widget.place.address}
- Rating: ${widget.place.rating}/5 stars

User Question: "$userQuestion"

Provide a helpful, confident answer (80-150 words). Always give specific information even if you need to make reasonable assumptions based on the place type and rating.

For common questions, provide these types of answers:

${_getQuestionGuidance(userQuestion.toLowerCase(), type, rating)}

Write as if you have local knowledge. Be specific, helpful, and confident. Avoid saying "I don't know" or "I couldn't find information." Instead, provide reasonable expectations based on the place type and rating.

Answer:''';
  }
  
  String _getQuestionGuidance(String question, String type, double rating) {
    if (question.contains('pet') || question.contains('dog') || question.contains('animal')) {
      if (type.contains('park') || type.contains('outdoor')) {
        return 'PETS: Most parks welcome leashed pets. Mention specific pet policies, waste disposal, and any pet-friendly features.';
      } else if (type.contains('restaurant') || type.contains('cafe')) {
        return 'PETS: Most restaurants don\'t allow pets inside, but many have outdoor seating where well-behaved, leashed pets are welcome.';
      } else {
        return 'PETS: Indoor venues typically don\'t allow pets except service animals. Suggest alternatives or outdoor areas nearby.';
      }
    }
    
    if (question.contains('hour') || question.contains('open') || question.contains('time')) {
      return 'HOURS: Provide typical hours for this type of business. Mention peak times, seasonal variations, and best times to visit.';
    }
    
    if (question.contains('price') || question.contains('cost') || question.contains('fee')) {
      if (type.contains('restaurant')) {
        return 'PRICING: Based on the ${rating}-star rating, provide realistic price ranges for meals, drinks, and typical spending per person.';
      } else if (type.contains('museum') || type.contains('attraction')) {
        return 'PRICING: Provide typical admission fees, discounts available, and value for money based on the rating.';
      } else {
        return 'PRICING: Give realistic cost estimates based on place type and quality level indicated by the rating.';
      }
    }
    
    if (question.contains('food') || question.contains('menu') || question.contains('dish')) {
      return 'FOOD: Describe typical offerings for this type of place, highlight specialties, and mention quality expectations based on the rating.';
    }
    
    if (question.contains('parking') || question.contains('transport')) {
      return 'ACCESS: Provide practical information about parking availability, public transport options, and accessibility in the area.';
    }
    
    return 'GENERAL: Provide specific, helpful information based on the place type and rating. Include practical tips and realistic expectations.';
  }
  
  String _cleanupAIResponse(String response) {
    return response
        .replaceAll(RegExp(r'^(Answer:|Response:)\s*', caseSensitive: false), '')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
  }
  
  String _generateFallbackAnswer(String question) {
    final type = widget.place.type.toLowerCase();
    final rating = widget.place.rating;
    final q = question.toLowerCase();
    
    if (q.contains('pet') || q.contains('dog')) {
      if (type.contains('park')) {
        return 'Most parks welcome leashed pets! This park likely allows well-behaved dogs on leash. Remember to bring waste bags and keep your pet on designated paths. Check for any posted pet restrictions at the entrance.';
      } else if (type.contains('restaurant') || type.contains('cafe')) {
        return 'Indoor dining typically doesn\'t allow pets, but many restaurants with outdoor seating welcome well-behaved, leashed pets. Call ahead to confirm their pet policy for outdoor areas.';
      } else {
        return 'Most indoor venues only allow service animals. However, the surrounding area may have pet-friendly outdoor spaces. Check with staff about their specific pet policy.';
      }
    }
    
    if (q.contains('hour') || q.contains('open')) {
      if (type.contains('restaurant')) {
        return 'Most restaurants are typically open 11 AM - 10 PM on weekdays, with extended weekend hours. Peak dining times are 12-2 PM and 6-8 PM. Call ahead to confirm current hours and make reservations.';
      } else if (type.contains('museum')) {
        return 'Museums typically operate 9 AM - 5 PM, Tuesday through Sunday (often closed Mondays). Best times to visit are weekday mornings for smaller crowds. Check their website for current hours and special exhibitions.';
      } else {
        return 'Business hours vary, but most places operate during standard business hours (9 AM - 6 PM). Weekend hours may differ. I recommend calling ahead or checking their website for current operating hours.';
      }
    }
    
    if (q.contains('price') || q.contains('cost')) {
      if (rating >= 4.5) {
        return 'Given the excellent ${rating}-star rating, expect premium pricing. Budget accordingly for a high-quality experience. The investment is typically worth it for the exceptional service and offerings.';
      } else if (rating >= 4.0) {
        return 'With a solid ${rating}-star rating, expect moderate to good value pricing. The quality-to-price ratio should be reasonable for what you receive.';
      } else {
        return 'Pricing should be budget-friendly to moderate. The ${rating}-star rating suggests good value for money without premium costs.';
      }
    }
    
    return 'Based on the ${rating}-star rating and location, this ${widget.place.type.toLowerCase()} offers a quality experience. I recommend checking their website or calling directly for the most current information about your specific question.';
  }
  

  
  void _getDirections() async {
    String url;
    
    // Try Google Maps app first for directions
    if (widget.place.latitude != null && widget.place.longitude != null) {
      // Google Maps app directions URL
      url = 'google.navigation:q=${widget.place.latitude},${widget.place.longitude}';
    } else {
      // Fallback to address-based directions
      url = 'google.navigation:q=${Uri.encodeComponent(widget.place.address)}';
    }
    
    final navUri = Uri.parse(url);
    if (await canLaunchUrl(navUri)) {
      await launchUrl(navUri, mode: LaunchMode.externalApplication);
    } else {
      // Fallback to web directions
      final webUrl = 'https://www.google.com/maps/dir/?api=1&destination=${Uri.encodeComponent(widget.place.address)}';
      await _launchUrl(webUrl);
    }
  }
  
  void _viewOnMap() async {
    String url;
    
    // Try to open Google Maps app first
    if (widget.place.latitude != null && widget.place.longitude != null) {
      // Google Maps app URL with coordinates
      url = 'geo:${widget.place.latitude},${widget.place.longitude}?q=${widget.place.latitude},${widget.place.longitude}(${Uri.encodeComponent(widget.place.name)})';
    } else {
      // Fallback to place search
      url = 'geo:0,0?q=${Uri.encodeComponent(widget.place.name + ' ' + widget.place.address)}';
    }
    
    final geoUri = Uri.parse(url);
    if (await canLaunchUrl(geoUri)) {
      await launchUrl(geoUri, mode: LaunchMode.externalApplication);
    } else {
      // Fallback to web URL
      String webUrl;
      if (widget.place.latitude != null && widget.place.longitude != null) {
        webUrl = 'https://www.google.com/maps/search/?api=1&query=${widget.place.latitude},${widget.place.longitude}';
      } else {
        webUrl = 'https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(widget.place.name + ' ' + widget.place.address)}';
      }
      await _launchUrl(webUrl);
    }
  }
  
  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not open $url')),
        );
      }
    }
  }
  
  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(
            child: Text(value),
          ),
        ],
      ),
    );
  }
  
  List<Widget> _buildOpeningHours(List<dynamic> weekdayText) {
    return weekdayText.map((day) {
      final dayStr = day.toString();
      final isToday = _isToday(dayStr);
      return Container(
        padding: const EdgeInsets.symmetric(vertical: 2, horizontal: 8),
        margin: const EdgeInsets.only(bottom: 2),
        decoration: BoxDecoration(
          color: isToday ? Colors.blue[50] : null,
          borderRadius: BorderRadius.circular(4),
          border: isToday ? Border.all(color: Colors.blue[200]!) : null,
        ),
        child: Text(
          dayStr,
          style: TextStyle(
            fontSize: 12,
            color: isToday ? Colors.blue[800] : Colors.grey[700],
            fontWeight: isToday ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      );
    }).toList();
  }
  
  bool _isToday(String dayText) {
    final today = DateTime.now().weekday;
    final dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    final todayName = dayNames[today - 1];
    return dayText.toLowerCase().startsWith(todayName.toLowerCase());
  }
  
  String _getPriceLevelText(int? priceLevel) {
    if (priceLevel == null || priceLevel < 0 || priceLevel > 4) return 'N/A';
    switch (priceLevel) {
      case 0: return 'Free';
      case 1: return '\$ (Inexpensive)';
      case 2: return '\$\$ (Moderate)';
      case 3: return '\$\$\$ (Expensive)';
      case 4: return '\$\$\$\$ (Very Expensive)';
      default: return 'N/A';
    }
  }
  
  String _getPriceLevelSymbol(int? priceLevel) {
    if (priceLevel == null || priceLevel < 0 || priceLevel > 4) return '?';
    switch (priceLevel) {
      case 0: return 'FREE';
      case 1: return '\$';
      case 2: return '\$\$';
      case 3: return '\$\$\$';
      case 4: return '\$\$\$\$';
      default: return '?';
    }
  }
  
  Widget _buildQuickInfoCard(IconData icon, String value, String label, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          Text(
            label,
            style: TextStyle(
              color: color.withOpacity(0.7),
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildExpandableDescription() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Main description
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.grey[50]!, Colors.white],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[200]!),
            boxShadow: [
              BoxShadow(
                color: Colors.grey.withOpacity(0.1),
                spreadRadius: 1,
                blurRadius: 3,
                offset: const Offset(0, 1),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.description, color: Color(AppConstants.colors['primary']!), size: 20),
                  const SizedBox(width: 8),
                  const Text(
                    'About This Place',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              _isLoadingEnhancedDescription
                  ? Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  Color(AppConstants.colors['primary']!),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'Crafting detailed description...',
                              style: TextStyle(fontStyle: FontStyle.italic),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'AI is crafting a comprehensive description with historical context, visitor experiences, local insights, and detailed features to help you fully appreciate this ${widget.place.type}.',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                            height: 1.4,
                          ),
                        ),
                      ],
                    )
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: _buildDescriptionParagraphs(_getDisplayDescription()),
                    ),
              if (_enhancedDescription != null && _enhancedDescription != widget.place.description) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.purple[100],
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.auto_awesome, size: 12, color: Colors.purple[700]),
                          const SizedBox(width: 4),
                          Text(
                            'AI Enhanced Description',
                            style: TextStyle(
                              fontSize: 10,
                              color: Colors.purple[700],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Spacer(),
                    Text(
                      '${_enhancedDescription!.split(' ').length} words',
                      style: TextStyle(
                        fontSize: 10,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
        

        
        // Quick Facts Section
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.green[50],
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.green[200]!),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.lightbulb, color: Colors.green[600], size: 18),
                  const SizedBox(width: 6),
                  Text(
                    'Quick Facts',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.green[800],
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 4,
                children: [
                  _buildFactChip('⭐ ${widget.place.rating}/5 Rating'),
                  _buildFactChip('📍 ${widget.place.type}'),
                  if (_placeDetails?['price_level'] != null)
                    _buildFactChip('💰 ${_getPriceLevelText(_placeDetails!['price_level'])}'),
                  if (_placeDetails?['opening_hours']?['open_now'] != null)
                    _buildFactChip(_placeDetails!['opening_hours']['open_now'] == true ? '🟢 Open Now' : '🔴 Closed'),
                ],
              ),
            ],
          ),
        ),
        

      ],
    );
  }
  
  Widget _buildFactChip(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.green[300]!),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 11,
          color: Colors.green[700],
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
  
  void _generateAIInsights() async {
    final insights = await _getAIInsights();
    if (insights != null && mounted) {
      showModalBottomSheet(
        context: context,
        isScrollControlled: true,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        builder: (context) => Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.auto_awesome, color: Color(AppConstants.colors['accent']!)),
                  const SizedBox(width: 8),
                  const Text(
                    'AI Insights',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.purple[50],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.purple[200]!),
                ),
                child: Text(
                  insights,
                  style: const TextStyle(fontSize: 14, height: 1.5),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Close'),
                ),
              ),
            ],
          ),
        ),
      );
    }
  }
  
  Future<String?> _getAIInsights() async {
    try {
      final insightsPrompt = _buildAIInsightsPrompt();
      
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/ai/ask'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'question': insightsPrompt,
          'temperature': 0.7,
          'max_tokens': 800,
        }),
      ).timeout(const Duration(seconds: 18));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final insights = data['answer']?.toString().trim();
        return insights != null && insights.length > 50 ? _cleanupInsightsText(insights) : null;
      }
    } catch (e) {
      print('Failed to get AI insights: $e');
    }
    return null;
  }
  
  String _buildAIInsightsPrompt() {
    final type = widget.place.type.toLowerCase();
    
    return '''Generate insider insights for: ${widget.place.name}
Type: ${widget.place.type}
Location: ${widget.place.address}
Rating: ${widget.place.rating}/5

Provide 4-5 specific insights (200-250 words total):

1. **Hidden Gems**: Lesser-known features or experiences most visitors miss
2. **Optimal Timing**: Best times to visit (hour, day, season) and why
3. **Insider Secrets**: ${_getInsiderSecretsFocus(type)}
4. **Photo Opportunities**: Best spots and lighting for memorable photos
5. **Local Context**: How locals use/view this place differently than tourists

Style: Write as a knowledgeable local sharing exclusive knowledge
Tone: Enthusiastic but practical
Format: Use bullet points or short paragraphs for easy reading

Avoid: Generic advice, obvious information, promotional language

Generate insights:''';
  }
  
  String _getInsiderSecretsFocus(String type) {
    if (type.contains('restaurant')) return 'Menu hacks, chef recommendations, reservation strategies';
    if (type.contains('museum')) return 'Free admission times, curator favorites, interactive experiences';
    if (type.contains('park')) return 'Secret trails, wildlife spotting, seasonal highlights';
    if (type.contains('attraction')) return 'Skip-the-line tips, best viewing spots, crowd patterns';
    return 'Money-saving tips, exclusive experiences, local customs';
  }
  
  String _cleanupInsightsText(String insights) {
    return insights
        .replaceAll(RegExp(r'^(Insights?:|Here are some insights?:)\s*', caseSensitive: false), '')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
  }
  
  Widget _buildLocalTipSection() {
    final hasLocalTip = widget.place.localTip.isNotEmpty;
    final hasAITip = _aiLocalTip != null && _aiLocalTip!.isNotEmpty;
    
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.orange[50]!, Colors.amber[50]!],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.orange[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.tips_and_updates, color: Colors.orange[700], size: 20),
              const SizedBox(width: 8),
              Text(
                hasLocalTip ? 'Insider Tip' : 'Local Insights',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.orange[800],
                  fontSize: 14,
                ),
              ),
              const Spacer(),
              if (hasLocalTip)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.green[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'VERIFIED',
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      color: Colors.green[700],
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          if (_isLoadingLocalTip)
            const Row(
              children: [
                SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
                SizedBox(width: 8),
                Text('Getting local insights...', style: TextStyle(fontStyle: FontStyle.italic)),
              ],
            )
          else if (hasLocalTip)
            Text(
              widget.place.localTip,
              style: TextStyle(
                fontSize: 14,
                height: 1.5,
                color: Colors.orange[800],
              ),
            )
          else if (hasAITip)
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _aiLocalTip!,
                  style: TextStyle(
                    fontSize: 14,
                    height: 1.5,
                    color: Colors.orange[800],
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.purple[100],
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.auto_awesome, size: 10, color: Colors.purple[700]),
                      const SizedBox(width: 4),
                      Text(
                        'AI Generated',
                        style: TextStyle(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          color: Colors.purple[700],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            )
          else
            Column(
              children: [
                Text(
                  'No local tips available yet.',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.orange[600],
                    fontStyle: FontStyle.italic,
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: _generateLocalTip,
                    icon: const Icon(Icons.auto_awesome, size: 16),
                    label: const Text('Generate AI Tip'),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: Colors.orange[400]!),
                      foregroundColor: Colors.orange[700],
                    ),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
  
  Future<void> _loadLocalTip() async {
    if (widget.place.localTip.isNotEmpty) return;
    
    setState(() => _isLoadingLocalTip = true);
    
    try {
      final tipPrompt = _buildLocalTipPrompt();
      
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/ai/ask'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'question': tipPrompt,
          'temperature': 0.7, // Higher creativity for tips
          'max_tokens': 200,
        }),
      ).timeout(const Duration(seconds: 12));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final aiTip = data['answer']?.toString().trim();
        if (aiTip != null && aiTip.isNotEmpty && aiTip.length > 20) {
          setState(() => _aiLocalTip = _cleanupTipText(aiTip));
        }
      }
    } catch (e) {
      print('Failed to load local tip: $e');
    } finally {
      setState(() => _isLoadingLocalTip = false);
    }
  }
  
  String _buildLocalTipPrompt() {
    final type = widget.place.type.toLowerCase();
    final rating = widget.place.rating;
    
    return '''
Generate an insider local tip for: ${widget.place.name}
Type: ${widget.place.type}
Location: ${widget.place.address}
Rating: $rating/5

Create a practical, actionable tip (60-90 words) covering:
${_getTipFocusAreas(type)}

Style: Write as a knowledgeable local sharing insider knowledge
Tone: Friendly, helpful, specific
Avoid: Generic advice, obvious information

Example format: "Pro tip: Visit during [specific time] to [specific benefit]. The [specific feature] is worth checking out, and locals recommend [specific action]. [Money-saving or experience-enhancing detail]."

Generate tip:''';
  }
  
  String _getTipFocusAreas(String type) {
    if (type.contains('restaurant') || type.contains('cafe')) {
      return '- Best times to visit (avoid crowds)\n- Menu recommendations or hidden gems\n- Reservation tips or seating preferences\n- Local dining customs or etiquette';
    }
    if (type.contains('museum') || type.contains('attraction')) {
      return '- Optimal visiting hours for fewer crowds\n- Hidden exhibits or photo spots\n- Ticket discounts or free admission times\n- Best routes or must-see highlights';
    }
    if (type.contains('park') || type.contains('garden')) {
      return '- Best times for photos or activities\n- Hidden trails or scenic spots\n- Seasonal highlights or events\n- Parking tips or alternative access';
    }
    return '- Best visiting times\n- Money-saving opportunities\n- Hidden features or experiences\n- Local customs or etiquette';
  }
  
  String _cleanupTipText(String tip) {
    // Remove common AI prefixes and clean up text
    String cleaned = tip
        .replaceAll(RegExp(r'^(Pro tip:|Tip:|Local tip:|Here.s a tip:)\s*', caseSensitive: false), '')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
    
    // Ensure it starts with capital letter
    if (cleaned.isNotEmpty) {
      cleaned = cleaned[0].toUpperCase() + cleaned.substring(1);
    }
    
    // Ensure it ends with period
    if (cleaned.isNotEmpty && !cleaned.endsWith('.') && !cleaned.endsWith('!')) {
      cleaned += '.';
    }
    
    return cleaned;
  }
  
  void _generateLocalTip() async {
    setState(() => _isLoadingLocalTip = true);
    
    try {
      final tipPrompt = _buildLocalTipPrompt();
      
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/ai/ask'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'question': tipPrompt,
          'temperature': 0.8, // Higher creativity for manual generation
          'max_tokens': 200,
        }),
      ).timeout(const Duration(seconds: 12));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final aiTip = data['answer']?.toString().trim();
        if (aiTip != null && aiTip.isNotEmpty && aiTip.length > 20) {
          setState(() => _aiLocalTip = _cleanupTipText(aiTip));
        } else {
          throw Exception('Generated tip too short or empty');
        }
      } else {
        throw Exception('API returned ${response.statusCode}');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to generate tip. Please try again.')),
      );
    } finally {
      setState(() => _isLoadingLocalTip = false);
    }
  }
  
  Future<void> _loadEnhancedDescription() async {
    // Check cache first
    final cachedDescription = await _getCachedEnhancedDescription();
    if (cachedDescription != null) {
      setState(() {
        _enhancedDescription = cachedDescription;
      });
      return;
    }
    
    setState(() => _isLoadingEnhancedDescription = true);
    
    try {
      final enhancedPrompt = _buildEnhancedDescriptionPrompt();
      
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/ai/ask'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'question': enhancedPrompt,
          'temperature': 0.6,
          'max_tokens': 1200,
        }),
      ).timeout(const Duration(seconds: 25));
      
      String? aiDescription;
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        aiDescription = data['answer']?.toString().trim();
        print('AI Description Response: $aiDescription');
      } else {
        print('AI API Error: ${response.statusCode} - ${response.body}');
      }
      
      if (aiDescription != null && aiDescription.length >= 100) {
        final cleanedDescription = _cleanupDescriptionText(aiDescription);
        setState(() {
          _enhancedDescription = cleanedDescription;
        });
        await _cacheEnhancedDescription(cleanedDescription);
      } else {
        // Generate fallback description if AI fails
        final fallbackDescription = _generateFallbackDescription();
        setState(() {
          _enhancedDescription = fallbackDescription;
        });
      }
    } catch (e) {
      print('Failed to load enhanced description: $e');
      // Generate fallback description on error
      final fallbackDescription = _generateFallbackDescription();
      setState(() {
        _enhancedDescription = fallbackDescription;
      });
    } finally {
      setState(() => _isLoadingEnhancedDescription = false);
    }
  }
  

  
  String _generateFallbackDescription() {
    final type = widget.place.type.toLowerCase();
    final rating = widget.place.rating;
    
    String description = '';
    
    // Opening paragraph
    if (type.contains('restaurant')) {
      description += '${widget.place.name} stands out as a beloved dining destination in the heart of the local culinary scene. With its ${rating >= 4.5 ? 'exceptional' : rating >= 4.0 ? 'impressive' : 'solid'} ${rating}-star rating, this ${widget.place.type.toLowerCase()} has earned a reputation for delivering memorable dining experiences that keep both locals and visitors returning.\n\n';
      description += 'The menu showcases a carefully curated selection of dishes that blend traditional flavors with contemporary presentation. Guests can expect attentive service in a welcoming atmosphere that strikes the perfect balance between comfort and sophistication. The restaurant\'s commitment to quality ingredients and skilled preparation is evident in every dish that leaves the kitchen.\n\n';
    } else if (type.contains('museum') || type.contains('gallery')) {
      description += '${widget.place.name} offers visitors an enriching cultural experience that brings history and art to life. This distinguished ${widget.place.type.toLowerCase()} has become a cornerstone of the local cultural landscape, attracting curious minds and art enthusiasts from near and far.\n\n';
      description += 'The carefully curated exhibitions provide fascinating insights into diverse topics, featuring both permanent collections and rotating displays that ensure each visit offers something new. Interactive elements and knowledgeable staff enhance the experience, making complex subjects accessible and engaging for visitors of all ages.\n\n';
    } else if (type.contains('park') || type.contains('garden')) {
      description += '${widget.place.name} provides a tranquil escape from urban life, offering visitors a chance to reconnect with nature in beautifully maintained surroundings. This cherished green space serves as both a recreational haven and a vital community gathering place.\n\n';
      description += 'Well-designed pathways wind through diverse landscapes, from manicured gardens to natural areas that showcase local flora and fauna. Whether seeking active recreation or peaceful contemplation, visitors will find the perfect spot to unwind and appreciate the natural beauty that makes this location so special.\n\n';
    } else {
      description += '${widget.place.name} represents a standout destination that has captured the attention of visitors seeking authentic local experiences. With its strong ${rating}-star rating, this ${widget.place.type.toLowerCase()} has established itself as a must-visit location that consistently exceeds expectations.\n\n';
      description += 'What sets this place apart is its unique combination of quality offerings and genuine hospitality that creates lasting impressions. Visitors consistently praise the attention to detail and the authentic character that makes each experience feel both special and memorable.\n\n';
    }
    
    // Closing paragraph
    description += 'Located conveniently in the area, ${widget.place.name} offers easy access while maintaining its distinctive charm. Whether you\'re a first-time visitor or a returning guest, this exceptional ${widget.place.type.toLowerCase()} promises an experience that will leave you planning your next visit.';
    
    return description;
  }
  
  String _buildEnhancedDescriptionPrompt() {
    final contextualInfo = _buildContextualInfo();
    final type = widget.place.type.toLowerCase();
    
    return '''Write a compelling travel guide description for: ${widget.place.name}
Type: ${widget.place.type}
Location: ${widget.place.address}
Rating: ${widget.place.rating}/5

Target length: 280-350 words
Format: Use double line breaks (\n\n) between paragraphs

Structure (4-5 paragraphs):
1. **Opening Hook** (40-50 words): What makes this place special and memorable
2. **Experience & Features** (80-100 words): What visitors see, do, and feel - be specific about ${_getTypeSpecificFeatures(type)}
3. **Atmosphere & Context** (60-80 words): Ambiance, local significance, and neighborhood character
4. **Visitor Insights** (50-70 words): Best times to visit, insider tips, what to expect
5. **Compelling Close** (30-40 words): Why this is a must-visit destination

Writing style:
- Vivid, sensory language that paints a picture
- Specific details over generic descriptions
- Travel guide tone (informative yet engaging)
- Focus on unique selling points and authentic experiences

$contextualInfo

Write the description:''';
  }
  
  String _getTypeSpecificFeatures(String type) {
    if (type.contains('restaurant')) return 'menu highlights, signature dishes, dining atmosphere, service style';
    if (type.contains('museum')) return 'key exhibits, collections, interactive features, architectural highlights';
    if (type.contains('park')) return 'landscapes, activities, trails, seasonal features, wildlife';
    if (type.contains('hotel')) return 'amenities, room features, service quality, location advantages';
    if (type.contains('attraction')) return 'main features, activities, photo opportunities, unique experiences';
    return 'key features, services, unique offerings, visitor experiences';
  }
  
  String _cleanupDescriptionText(String description) {
    // Clean up common AI artifacts and improve formatting
    String cleaned = description
        .replaceAll(RegExp(r'^(Description:|Here.s a description:|About this place:)\s*', caseSensitive: false), '')
        .replaceAll(RegExp(r'\n{3,}'), '\n\n') // Normalize paragraph breaks
        .replaceAll(RegExp(r'\s+'), ' ') // Normalize whitespace
        .trim();
    
    // Ensure proper paragraph structure
    if (!cleaned.contains('\n\n') && cleaned.length > 200) {
      // Add paragraph breaks at sentence boundaries for long single paragraphs
      final sentences = cleaned.split('. ');
      if (sentences.length >= 6) {
        final mid = sentences.length ~/ 2;
        cleaned = sentences.take(mid).join('. ') + '.\n\n' + sentences.skip(mid).join('. ');
      }
    }
    
    return cleaned;
  }
  
  String _getDisplayDescription() {
    if (_enhancedDescription != null && _enhancedDescription!.isNotEmpty) {
      return _enhancedDescription!;
    }
    if (widget.place.description.isNotEmpty && widget.place.description.length > 50) {
      return widget.place.description;
    }
    // Always generate fallback if no good description exists
    return _generateFallbackDescription();
  }
  
  List<Widget> _buildDescriptionParagraphs(String description) {
    // Clean up the description
    String cleanText = description.trim();
    
    // Try different splitting methods in order of preference
    List<String> paragraphs = [];
    
    // 1. Split by double line breaks
    paragraphs = cleanText.split('\n\n').where((p) => p.trim().isNotEmpty).toList();
    
    // 2. If no double breaks, try single line breaks
    if (paragraphs.length <= 1) {
      paragraphs = cleanText.split('\n').where((p) => p.trim().isNotEmpty).toList();
    }
    
    // 3. If still one block, split by numbered sections (1., 2., etc.)
    if (paragraphs.length <= 1) {
      final numberedSections = cleanText.split(RegExp(r'(?=\d+\.)'));
      final filtered = numberedSections.where((s) => s.trim().isNotEmpty).toList();
      if (filtered.length > 1) {
        paragraphs = filtered;
      }
    }
    
    // 4. If still one block, split by sentence groups (every 3-4 sentences)
    if (paragraphs.length <= 1) {
      final sentences = cleanText.split(RegExp(r'\. (?=[A-Z])'));
      if (sentences.length > 3) {
        paragraphs = [];
        for (int i = 0; i < sentences.length; i += 3) {
          final end = (i + 3 < sentences.length) ? i + 3 : sentences.length;
          final paragraph = sentences.sublist(i, end).join('. ');
          paragraphs.add(paragraph.endsWith('.') ? paragraph : '$paragraph.');
        }
      }
    }
    
    // 5. If still one block, split by word count (every ~50 words)
    if (paragraphs.length <= 1 && cleanText.split(' ').length > 50) {
      final words = cleanText.split(' ');
      paragraphs = [];
      for (int i = 0; i < words.length; i += 50) {
        final end = (i + 50 < words.length) ? i + 50 : words.length;
        final chunk = words.sublist(i, end).join(' ');
        paragraphs.add(chunk);
      }
    }
    
    // Fallback: use original text as single paragraph
    if (paragraphs.isEmpty) {
      paragraphs = [cleanText];
    }
    
    return paragraphs.map((paragraph) => _buildParagraphWidget(paragraph.trim())).toList();
  }
  
  Widget _buildParagraphWidget(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        text.trim(),
        style: const TextStyle(
          fontSize: 15,
          height: 1.7,
          color: Colors.black87,
          letterSpacing: 0.2,
        ),
        textAlign: TextAlign.justify,
      ),
    );
  }
  
  String _buildContextualInfo() {
    final context = StringBuffer();
    
    context.write('\n\nContextual Information:');
    context.write('\n• Location: ${widget.place.address}');
    context.write('\n• Rating: ${widget.place.rating}/5 stars');
    
    if (_placeDetails != null) {
      if (_placeDetails!['price_level'] != null) {
        context.write('\n• Price range: ${_getPriceLevelText(_placeDetails!['price_level'])}');
      }
      
      if (_placeDetails!['opening_hours'] != null) {
        final status = _placeDetails!['opening_hours']['open_now'] ? 'Currently open' : 'Currently closed';
        context.write('\n• Status: $status');
      }
      
      if (_placeDetails!['user_ratings_total'] != null) {
        context.write('\n• Reviews: ${_placeDetails!['user_ratings_total']} total');
      }
    }
    
    // Add existing description as reference if available
    if (widget.place.description.isNotEmpty && widget.place.description.length > 50) {
      final maxLength = widget.place.description.length > 100 ? 100 : widget.place.description.length;
      context.write('\n• Current description: ${widget.place.description.substring(0, maxLength)}...');
    }
    
    context.write('\n\nCreate a comprehensive, engaging description that goes beyond basic information.');
    
    return context.toString();
  }
  
  Future<String?> _getCachedEnhancedDescription() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cached = prefs.getString('enhanced_desc_${widget.place.id}');
      if (cached != null) {
        final data = json.decode(cached);
        final timestamp = data['timestamp'] as int?;
        final description = data['description'] as String?;
        
        // Cache for 7 days (extended caching)
        if (timestamp != null && description != null && 
            DateTime.now().millisecondsSinceEpoch - timestamp < 604800000) {
          return description;
        }
      }
    } catch (e) {
      print('Cache read error for enhanced description: $e');
    }
    return null;
  }
  
  Future<void> _cacheEnhancedDescription(String description) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final data = {
        'description': description,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      };
      await prefs.setString('enhanced_desc_${widget.place.id}', json.encode(data));
    } catch (e) {
      print('Cache write error for enhanced description: $e');
    }
  }
  
  String _getDistanceText() {
    if (widget.place.latitude != null && widget.place.longitude != null) {
      final appProvider = Provider.of<AppProvider>(context, listen: false);
      if (appProvider.currentLocation != null) {
        final distance = _calculateDistance(
          appProvider.currentLocation!.latitude,
          appProvider.currentLocation!.longitude,
          widget.place.latitude!,
          widget.place.longitude!,
        );
        return distance < 1000 ? '${distance.round()}m' : '${(distance / 1000).toStringAsFixed(1)}km';
      }
    }
    return 'N/A';
  }
  
  double _calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    const double earthRadius = 6371000; // meters
    final double dLat = (lat2 - lat1) * (math.pi / 180);
    final double dLon = (lon2 - lon1) * (math.pi / 180);
    final double a = math.sin(dLat / 2) * math.sin(dLat / 2) +
        math.cos(lat1 * (math.pi / 180)) * math.cos(lat2 * (math.pi / 180)) *
        math.sin(dLon / 2) * math.sin(dLon / 2);
    final double c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
    return earthRadius * c;
  }
  
  void _showPhotoSlideView() {
    if (_photoGallery.isEmpty) return;
    
    showDialog(
      context: context,
      barrierColor: Colors.black,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) {
          int currentIndex = _currentPhotoIndex;
          final pageController = PageController(initialPage: currentIndex);
          
          return Dialog.fullscreen(
            backgroundColor: Colors.black,
            child: Stack(
              children: [
                PageView.builder(
                  controller: pageController,
                  onPageChanged: (index) {
                    setDialogState(() => currentIndex = index);
                    setState(() => _currentPhotoIndex = index);
                  },
                  itemCount: _photoGallery.length,
                  itemBuilder: (context, index) => InteractiveViewer(
                    panEnabled: true,
                    boundaryMargin: const EdgeInsets.all(20),
                    minScale: 0.5,
                    maxScale: 4.0,
                    child: Center(
                      child: Hero(
                        tag: 'photo_$index',
                        child: Image.network(
                          _photoGallery[index].replaceAll('&w=1200', '&w=1600'), // Higher res for fullscreen
                          fit: BoxFit.contain,
                          loadingBuilder: (context, child, loadingProgress) {
                            if (loadingProgress == null) return child;
                            return Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  CircularProgressIndicator(
                                    color: Colors.white,
                                    value: loadingProgress.expectedTotalBytes != null
                                        ? loadingProgress.cumulativeBytesLoaded / loadingProgress.expectedTotalBytes!
                                        : null,
                                  ),
                                  const SizedBox(height: 16),
                                  const Text(
                                    'Loading high-res image...',
                                    style: TextStyle(color: Colors.white70, fontSize: 14),
                                  ),
                                ],
                              ),
                            );
                          },
                          errorBuilder: (context, error, stackTrace) => Container(
                            color: Colors.grey[800],
                            child: const Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.image_not_supported, size: 64, color: Colors.grey),
                                SizedBox(height: 8),
                                Text(
                                  'Failed to load image',
                                  style: TextStyle(color: Colors.grey, fontSize: 14),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                // Navigation arrows
                if (_photoGallery.length > 1) ...[
                  Positioned(
                    left: 16,
                    top: 0,
                    bottom: 0,
                    child: Center(
                      child: IconButton(
                        onPressed: currentIndex > 0 ? () {
                          final newIndex = currentIndex - 1;
                          pageController.animateToPage(
                            newIndex,
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          );
                        } : null,
                        icon: Icon(
                          Icons.arrow_back_ios,
                          color: currentIndex > 0 ? Colors.white : Colors.grey,
                          size: 32,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    right: 16,
                    top: 0,
                    bottom: 0,
                    child: Center(
                      child: IconButton(
                        onPressed: currentIndex < _photoGallery.length - 1 ? () {
                          final newIndex = currentIndex + 1;
                          pageController.animateToPage(
                            newIndex,
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          );
                        } : null,
                        icon: Icon(
                          Icons.arrow_forward_ios,
                          color: currentIndex < _photoGallery.length - 1 ? Colors.white : Colors.grey,
                          size: 32,
                        ),
                      ),
                    ),
                  ),
                ],
                Positioned(
                  top: 50,
                  left: 16,
                  right: 16,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.black.withOpacity(0.6),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(
                          '${currentIndex + 1} of ${_photoGallery.length}',
                          style: const TextStyle(color: Colors.white, fontSize: 14),
                        ),
                      ),
                      Row(
                        children: [
                          IconButton(
                            onPressed: () => _sharePhoto(_photoGallery[currentIndex]),
                            icon: const Icon(Icons.share, color: Colors.white, size: 24),
                          ),
                          IconButton(
                            onPressed: () => Navigator.pop(context),
                            icon: const Icon(Icons.close, color: Colors.white, size: 28),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                // Photo thumbnails at bottom
                if (_photoGallery.length > 1)
                  Positioned(
                    bottom: 20,
                    left: 0,
                    right: 0,
                    child: Container(
                      height: 60,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        itemCount: _photoGallery.length,
                        itemBuilder: (context, index) => GestureDetector(
                          onTap: () {
                            pageController.animateToPage(
                              index,
                              duration: const Duration(milliseconds: 300),
                              curve: Curves.easeInOut,
                            );
                          },
                          child: Container(
                            width: 60,
                            height: 60,
                            margin: const EdgeInsets.only(right: 8),
                            decoration: BoxDecoration(
                              border: Border.all(
                                color: index == currentIndex ? Colors.white : Colors.transparent,
                                width: 2,
                              ),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: Image.network(
                                _photoGallery[index],
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) => Container(
                                  color: Colors.grey[800],
                                  child: const Icon(Icons.image, color: Colors.grey),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
  

  
  // Load nearby places using AI instead of Google API
  Future<void> _loadNearbyPlaces() async {
    setState(() => _isLoadingNearby = true);
    
    try {
      final aiNearby = await _generateAINearbyPlaces();
      _nearbyPlaces = aiNearby;
    } catch (e) {
      print('Failed to load nearby places: $e');
      _nearbyPlaces = [];
    } finally {
      setState(() => _isLoadingNearby = false);
    }
  }
  
  Future<List<Place>> _generateAINearbyPlaces() async {
    try {
      final nearbyPrompt = _buildNearbyPlacesPrompt();
      
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/ai/ask'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'question': nearbyPrompt,
          'temperature': 0.4,
          'max_tokens': 1000,
        }),
      ).timeout(const Duration(seconds: 15));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final aiResponse = data['answer'];
        
        // Extract JSON array from response
        final jsonMatch = RegExp(r'\[[\s\S]*\]').firstMatch(aiResponse);
        if (jsonMatch != null) {
          try {
            final List<dynamic> aiPlaces = json.decode(jsonMatch.group(0)!);
            return _processAINearbyPlaces(aiPlaces);
          } catch (e) {
            print('Nearby places JSON parse error: $e');
          }
        }
      }
    } catch (e) {
      print('AI nearby places failed: $e');
    }
    
    return _generateFallbackNearbyPlaces();
  }
  
  String _buildNearbyPlacesPrompt() {
    final currentType = widget.place.type.toLowerCase();
    final location = widget.place.address;
    
    return '''
Generate 5 realistic places near: ${widget.place.name}
Location: $location
Current place type: ${widget.place.type}

IMPORTANT: Return ONLY a JSON array with diverse, complementary places:
[
  {
    "name": "Specific business name",
    "address": "Street address near $location", 
    "rating": 3.8-4.6,
    "type": "Restaurant|Cafe|Shop|Attraction|Park|Museum",
    "description": "Detailed 30-40 word description",
    "distance": "0.2-1.8 km"
  }
]

Requirements:
- Mix of: 1 restaurant, 1 cafe/shop, 1 attraction, 1 service, 1 entertainment
- Avoid duplicating current type: $currentType
- Use realistic business names (not generic)
- Ratings between 3.8-4.6 for authenticity
- Descriptions highlight unique features
- Addresses should feel local to area

Return ONLY the JSON array, no other text.''';
  }
  
  List<Place> _processAINearbyPlaces(List<dynamic> aiPlaces) {
    return aiPlaces.asMap().entries.map((entry) {
      final place = entry.value;
      final index = entry.key;
      
      // Generate realistic coordinates within 2km
      final latOffset = (index - 2) * 0.005 + (DateTime.now().millisecond % 100) * 0.00001;
      final lngOffset = (index - 2) * 0.005 + (DateTime.now().second % 100) * 0.00001;
      
      return Place(
        id: 'ai_nearby_${DateTime.now().millisecondsSinceEpoch}_$index',
        name: place['name'] ?? 'Local Business',
        address: place['address'] ?? '${index + 1} blocks from ${widget.place.address}',
        latitude: (widget.place.latitude ?? 0.0) + latOffset,
        longitude: (widget.place.longitude ?? 0.0) + lngOffset,
        rating: _validateRating(place['rating']),
        type: place['type'] ?? 'Business',
        photoUrl: '',
        description: place['description'] ?? 'A popular local business in the area.',
        localTip: _generateContextualTip(place['type']),
        handyPhrase: 'Hello, thank you!',
      );
    }).toList();
  }
  
  double _validateRating(dynamic rating) {
    if (rating == null) return 4.0;
    final r = rating is String ? double.tryParse(rating) ?? 4.0 : rating.toDouble();
    return r.clamp(3.5, 4.8);
  }
  
  String _generateContextualTip(String? type) {
    switch (type?.toLowerCase()) {
      case 'restaurant': return 'Try their signature dish and make reservations for dinner.';
      case 'cafe': return 'Great for morning coffee and free WiFi for remote work.';
      case 'shop': return 'Check their social media for current sales and new arrivals.';
      case 'museum': case 'attraction': return 'Visit early morning to avoid crowds and get better photos.';
      case 'park': return 'Perfect for morning walks and evening relaxation.';
      default: return 'Check opening hours and reviews before visiting.';
    }
  }
  
  List<Place> _generateFallbackNearbyPlaces() {
    final nearbyPlaces = [
      {'type': 'Restaurant', 'name': 'Local Bistro', 'rating': 4.2},
      {'type': 'Cafe', 'name': 'Corner Coffee House', 'rating': 4.1},
      {'type': 'Shop', 'name': 'Artisan Boutique', 'rating': 4.0},
      {'type': 'Park', 'name': 'Neighborhood Park', 'rating': 4.3},
      {'type': 'Gallery', 'name': 'Local Art Gallery', 'rating': 4.1},
    ];
    
    return nearbyPlaces.asMap().entries.map((entry) {
      final place = entry.value;
      final index = entry.key;
      
      return Place(
        id: 'fallback_nearby_$index',
        name: place['name'] as String,
        address: '${(index + 1) * 100}m from ${widget.place.address}',
        latitude: (widget.place.latitude ?? 0.0) + (index * 0.002),
        longitude: (widget.place.longitude ?? 0.0) + (index * 0.002),
        rating: place['rating'] as double,
        type: place['type'] as String,
        photoUrl: '',
        description: 'A well-reviewed ${(place['type'] as String).toLowerCase()} popular with locals and visitors.',
        localTip: _generateContextualTip(place['type'] as String),
        handyPhrase: 'Hello, thank you!',
      );
    }).toList();
  }
  
  // Share place functionality
  void _sharePlace() async {
    final text = '${widget.place.name}\n${widget.place.address}\n\nRating: ${widget.place.rating}⭐\n\nShared via Travel Buddy';
    await Share.share(text, subject: 'Check out ${widget.place.name}');
  }
  
  // Share photo functionality
  void _sharePhoto(String photoUrl) async {
    try {
      await Share.share(
        'Check out this photo of ${widget.place.name}!\n$photoUrl\n\nShared via Travel Buddy',
        subject: 'Photo from ${widget.place.name}',
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to share photo')),
      );
    }
  }
  
  // Build review card
  Widget _buildReviewCard(Map<String, dynamic> review) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundColor: Color(AppConstants.colors['primary']!),
                child: Text(
                  (review['author_name'] as String? ?? 'A')[0].toUpperCase(),
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      review['author_name'] ?? 'Anonymous',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                    ),
                    Row(
                      children: List.generate(5, (index) => Icon(
                        Icons.star,
                        size: 12,
                        color: index < (review['rating'] ?? 0) ? Colors.amber : Colors.grey[300],
                      )),
                    ),
                  ],
                ),
              ),
              if (review['time'] != null)
                Text(
                  _formatReviewTime(review['time']),
                  style: TextStyle(fontSize: 10, color: Colors.grey[600]),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            review['text'] ?? '',
            style: const TextStyle(fontSize: 13),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
  
  // Build nearby places section
  Widget _buildNearbyPlacesSection() {
    if (_isLoadingNearby) {
      return const Center(child: CircularProgressIndicator());
    }
    
    if (_nearbyPlaces.isEmpty) {
      return const Text(
        'No nearby places found',
        style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic),
      );
    }
    
    return SizedBox(
      height: 120,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: _nearbyPlaces.length,
        itemBuilder: (context, index) {
          final place = _nearbyPlaces[index];
          return Container(
            width: 200,
            margin: const EdgeInsets.only(right: 12),
            child: Card(
              child: InkWell(
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => PlaceDetailsScreen(place: place),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.grey[300],
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                        ),
                        child: place.photoUrl.isNotEmpty
                            ? Image.network(
                                place.photoUrl,
                                width: double.infinity,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) => const Icon(Icons.image),
                              )
                            : const Icon(Icons.image),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(8),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            place.name,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Row(
                            children: [
                              const Icon(Icons.star, size: 12, color: Colors.amber),
                              const SizedBox(width: 2),
                              Text(
                                place.rating.toStringAsFixed(1),
                                style: const TextStyle(fontSize: 10),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
  

  
  // Format review time
  String _formatReviewTime(dynamic time) {
    try {
      final dateTime = DateTime.fromMillisecondsSinceEpoch(time * 1000);
      final now = DateTime.now();
      final difference = now.difference(dateTime).inDays;
      
      if (difference == 0) return 'Today';
      if (difference == 1) return 'Yesterday';
      if (difference < 7) return '${difference}d ago';
      if (difference < 30) return '${(difference / 7).round()}w ago';
      return '${(difference / 30).round()}m ago';
    } catch (e) {
      return '';
    }
  }
  
  Widget _buildActionButton(
    IconData icon,
    String label,
    Color color,
    VoidCallback onPressed, {
    bool outlined = false,
  }) {
    return outlined
        ? OutlinedButton.icon(
            onPressed: onPressed,
            icon: Icon(icon, size: 16),
            label: Text(label, style: const TextStyle(fontSize: 12)),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 10),
              side: BorderSide(color: color),
              foregroundColor: color,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          )
        : ElevatedButton.icon(
            onPressed: onPressed,
            icon: Icon(icon, size: 16),
            label: Text(label, style: const TextStyle(fontSize: 12)),
            style: ElevatedButton.styleFrom(
              backgroundColor: color,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 10),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          );
  }
  
  // Regenerate description
  void _regenerateDescription() async {
    setState(() {
      _enhancedDescription = null;
      _isLoadingEnhancedDescription = true;
    });
    
    // Clear cache
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('enhanced_desc_${widget.place.id}');
    } catch (e) {
      print('Error clearing cache: $e');
    }
    
    // Add slight delay to show loading state
    await Future.delayed(const Duration(milliseconds: 500));
    await _loadEnhancedDescription();
  }
}