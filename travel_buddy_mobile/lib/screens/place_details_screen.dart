import 'dart:convert';
import 'dart:math';
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
import '../services/places_service.dart';

class PlaceDetailsScreen extends StatefulWidget {
  final Place place;

  const PlaceDetailsScreen({super.key, required this.place});

  @override
  State<PlaceDetailsScreen> createState() => _PlaceDetailsScreenState();
}

class _PlaceDetailsScreenState extends State<PlaceDetailsScreen> with TickerProviderStateMixin {
  final TextEditingController _questionController = TextEditingController();
  final TextEditingController _reviewController = TextEditingController();
  bool _isAskingAI = false;
  String? _aiResponse;
  bool _showReviewForm = false;
  int _selectedRating = 0;
  int _currentPhotoIndex = 0;
  
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
  
  // Reviews state
  List<Map<String, dynamic>> _reviews = [];
  bool _isLoadingReviews = false;
  
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
    
    _loadPlaceDetails();
    _loadNearbyPlaces();
    _loadEnhancedDescription();
    _loadLocalTip();
  }
  
  @override
  void dispose() {
    _questionController.dispose();
    _reviewController.dispose();
    _fadeController.dispose();
    super.dispose();
  }
  
  Future<void> _loadPlaceDetails() async {
    if (widget.place.id.isEmpty) {
      _photoGallery = widget.place.photoUrl.isNotEmpty ? [widget.place.photoUrl] : [];
      return;
    }
    
    // Check cache first
    final cachedDetails = await _getCachedDetails();
    if (cachedDetails != null) {
      _placeDetails = cachedDetails;
      _extractPhotoGallery(cachedDetails);
      setState(() {});
      _loadReviews(); // Load reviews after details
      return;
    }
    
    setState(() {
      _isLoadingDetails = true;
      _detailsError = null;
    });
    
    try {
      // Load with timeout
      final response = await http.get(
        Uri.parse('${AppConstants.baseUrl}/api/places/details?place_id=${widget.place.id}&lang=en'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        _placeDetails = data;
        
        // Cache the details
        await _cacheDetails(data);
        
        _extractPhotoGallery(data);
        _loadReviews(); // Load reviews after details
      } else {
        _detailsError = 'Failed to load place details';
        _setFallbackPhoto();
      }
    } catch (e) {
      _detailsError = 'Error loading details: $e';
      _setFallbackPhoto();
    } finally {
      setState(() => _isLoadingDetails = false);
    }
  }
  
  void _extractPhotoGallery(Map<String, dynamic> data) {
    if (data['photos'] != null) {
      final photos = data['photos'] as List;
      _photoGallery = photos
          .take(1) // Only 1 photo
          .map((photo) => '${AppConstants.baseUrl}/api/places/photo?ref=${Uri.encodeComponent(photo['photo_reference'])}&w=600')
          .toList();
      
      _photoAttributions = photos
          .take(1)
          .expand((photo) => (photo['html_attributions'] as List? ?? []))
          .map((attr) => attr.toString())
          .toSet()
          .toList();
    }
    
    _setFallbackPhoto();
  }
  
  void _setFallbackPhoto() {
    if (_photoGallery.isEmpty && widget.place.photoUrl.isNotEmpty) {
      _photoGallery = [widget.place.photoUrl];
    }
  }
  
  Future<Map<String, dynamic>?> _getCachedDetails() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cached = prefs.getString('place_details_${widget.place.id}');
      if (cached != null) {
        final data = json.decode(cached);
        final timestamp = data['_cached_at'] as int?;
        if (timestamp != null && DateTime.now().millisecondsSinceEpoch - timestamp < 3600000) { // 1 hour cache
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

  @override
  Widget build(BuildContext context) {
    return Consumer<AppProvider>(
      builder: (context, appProvider, child) {
        final isFavorite = appProvider.favoriteIds.contains(widget.place.id);
        
        return Scaffold(
          body: Stack(
            children: [
              CustomScrollView(
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
                          ? Stack(
                              children: [
                                GestureDetector(
                                  onTap: () => _showPhotoSlideView(),
                                  child: PageView.builder(
                                    controller: PageController(initialPage: _currentPhotoIndex),
                                    onPageChanged: (index) => setState(() => _currentPhotoIndex = index),
                                    itemCount: _photoGallery.length,
                                    itemBuilder: (context, index) => Image.network(
                                      _photoGallery[index],
                                      fit: BoxFit.cover,
                                      errorBuilder: (context, error, stackTrace) => Container(
                                        color: Colors.grey[300],
                                        child: const Icon(Icons.image, size: 64, color: Colors.grey),
                                      ),
                                    ),
                                  ),
                                ),
                                if (_photoGallery.length > 1) ...[
                                  Positioned(
                                    top: 16,
                                    right: 16,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: Colors.black.withOpacity(0.6),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Text(
                                        '${_currentPhotoIndex + 1}/${_photoGallery.length}',
                                        style: const TextStyle(color: Colors.white, fontSize: 12),
                                      ),
                                    ),
                                  ),
                                  Positioned(
                                    bottom: 8,
                                    left: 8,
                                    right: 8,
                                    child: Container(
                                      height: 60,
                                      padding: const EdgeInsets.all(4),
                                      decoration: BoxDecoration(
                                        color: Colors.black.withOpacity(0.3),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: ListView.builder(
                                        scrollDirection: Axis.horizontal,
                                        itemCount: _photoGallery.length,
                                        itemBuilder: (context, index) => GestureDetector(
                                          onTap: () => setState(() => _currentPhotoIndex = index),
                                          child: Container(
                                            width: 52,
                                            margin: const EdgeInsets.only(right: 4),
                                            decoration: BoxDecoration(
                                              border: Border.all(
                                                color: index == _currentPhotoIndex ? Colors.white : Colors.transparent,
                                                width: 2,
                                              ),
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: ClipRRect(
                                              borderRadius: BorderRadius.circular(4),
                                              child: Image.network(
                                                _photoGallery[index],
                                                fit: BoxFit.cover,
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ],
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
                      
                      // About Section (Always show)
                      ..._buildSection(
                        'About',
                        Icons.info_outline,
                        _buildExpandableDescription(),
                      ),
                      
                      // Business Details (Collapsible)
                      if (_placeDetails != null) ..._buildSection(
                        'Business Details',
                        Icons.business,
                        _buildCollapsibleBusinessDetails(),
                      ),
                      
                      // Reviews Section (Collapsible)
                      ..._buildSection(
                        'Reviews',
                        Icons.star_outline,
                        _buildCollapsibleReviews(),
                      ),
                      
                      // Nearby Places Section
                      ..._buildSection(
                        'Nearby Places',
                        Icons.near_me,
                        _buildNearbyPlacesSection(),
                      ),
                      
                      // Contact & Location Info
                      if (widget.place.phoneNumber != null || widget.place.website != null || _placeDetails?['formatted_phone_number'] != null || _placeDetails?['website'] != null || _placeDetails?['vicinity'] != null) ..._buildSection(
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
                            if (widget.place.website != null || _placeDetails?['website'] != null)
                              ListTile(
                                leading: const Icon(Icons.web),
                                title: Text(widget.place.website ?? _placeDetails!['website']),
                                contentPadding: EdgeInsets.zero,
                                onTap: () => _launchUrl(widget.place.website ?? _placeDetails!['website']),
                              ),
                            if (_placeDetails?['url'] != null)
                              ListTile(
                                leading: const Icon(Icons.map),
                                title: const Text('View on Google Maps'),
                                contentPadding: EdgeInsets.zero,
                                onTap: () => _launchUrl(_placeDetails!['url']),
                              ),
                          ],
                        ),
                      ),
                      
                      const SizedBox(height: 80), // Space for floating button
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
          // Floating Action Buttons
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 10,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              padding: EdgeInsets.fromLTRB(16, 12, 16, MediaQuery.of(context).padding.bottom + 12),
              child: Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => _getDirections(),
                      icon: const Icon(Icons.directions, size: 20),
                      label: const Text('Directions'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Color(AppConstants.colors['primary']!),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () => showDialog(
                        context: context,
                        builder: (context) => AddToTripDialog(place: widget.place),
                      ),
                      icon: const Icon(Icons.add, size: 20),
                      label: const Text('Add to Trip'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: _sharePlace,
                    icon: const Icon(Icons.share),
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.grey[200],
                      padding: const EdgeInsets.all(14),
                    ),
                  ),
                ],
              ),
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
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: _questionController,
            decoration: const InputDecoration(
              hintText: 'Ask anything about this place...',
              border: OutlineInputBorder(),
              isDense: true,
            ),
            maxLines: 2,
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _isAskingAI ? null : _askAI,
              icon: _isAskingAI 
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.psychology),
              label: Text(_isAskingAI ? 'Asking...' : 'Ask AI'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Color(AppConstants.colors['accent']!),
                foregroundColor: Colors.white,
              ),
            ),
          ),
          if (_aiResponse != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue[50],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'AI Response:',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(_aiResponse!),
                ],
              ),
            ),
          ]
        ],
      ),
    );
  }
  
  Widget _buildReviewsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Always show write review button
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: () => setState(() => _showReviewForm = !_showReviewForm),
            icon: Icon(_showReviewForm ? Icons.close : Icons.rate_review),
            label: Text(_showReviewForm ? 'Cancel' : 'Write a Review'),
          ),
        ),
        if (_showReviewForm) ...[
          const SizedBox(height: 12),
          _buildReviewForm(),
        ],
        const SizedBox(height: 12),
        if (_isLoadingReviews)
          const Center(child: CircularProgressIndicator())
        else if (_reviews.isEmpty)
          const Text(
            'No reviews yet. Be the first to review!',
            style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic),
          )
        else
          ..._reviews.take(3).map((review) => _buildReviewCard(review)),
        if (_reviews.length > 3)
          TextButton(
            onPressed: () => _showAllReviews(),
            child: Text('View all ${_reviews.length} reviews'),
          ),
      ],
    );
  }
  
  Widget _buildConsolidatedAISection() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => _showAIBottomSheet('insights'),
                icon: const Icon(Icons.lightbulb_outline, size: 18),
                label: const Text('Local Tips'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => _showAIBottomSheet('ask'),
                icon: const Icon(Icons.psychology, size: 18),
                label: const Text('Ask AI'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
  
  void _showAIBottomSheet(String type) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: Container(
          padding: const EdgeInsets.all(20),
          child: type == 'insights' ? _buildInsightsContent() : _buildAskAIContent(),
        ),
      ),
    );
  }
  
  Widget _buildInsightsContent() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.lightbulb, color: Colors.orange[700]),
            const SizedBox(width: 8),
            const Text('Local Tips & Insights', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 16),
        if (_isLoadingLocalTip)
          const Center(child: CircularProgressIndicator())
        else if (_aiLocalTip != null)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.orange[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.orange[200]!),
            ),
            child: Text(_aiLocalTip!, style: const TextStyle(height: 1.5)),
          )
        else
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(context);
              _generateLocalTip();
            },
            icon: const Icon(Icons.auto_awesome),
            label: const Text('Generate Tips'),
          ),
      ],
    );
  }
  
  Widget _buildAskAIContent() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          children: [
            Icon(Icons.psychology, color: Color(AppConstants.colors['accent']!)),
            const SizedBox(width: 8),
            const Text('Ask AI Assistant', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _questionController,
          decoration: const InputDecoration(
            hintText: 'Ask anything about this place...',
            border: OutlineInputBorder(),
          ),
          maxLines: 3,
          autofocus: true,
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _isAskingAI ? null : _askAI,
            icon: _isAskingAI 
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.send),
            label: Text(_isAskingAI ? 'Asking...' : 'Ask'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Color(AppConstants.colors['accent']!),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
        ),
        if (_aiResponse != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.blue[50],
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(_aiResponse!, style: const TextStyle(height: 1.5)),
          ),
        ],
      ],
    );
  }
  
  Widget _buildCollapsibleBusinessDetails() {
    bool isExpanded = false;
    return StatefulBuilder(
      builder: (context, setState) {
        return Column(
          children: [
            InkWell(
              onTap: () => setState(() => isExpanded = !isExpanded),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Text('Tap to view details', style: TextStyle(fontWeight: FontWeight.w500)),
                    const Spacer(),
                    Icon(isExpanded ? Icons.expand_less : Icons.expand_more),
                  ],
                ),
              ),
            ),
            if (isExpanded) ...[
              const SizedBox(height: 12),
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
          ],
        );
      },
    );
  }
  
  Widget _buildCollapsibleReviews() {
    bool isExpanded = false;
    return StatefulBuilder(
      builder: (context, setState) {
        return Column(
          children: [
            InkWell(
              onTap: () => setState(() => isExpanded = !isExpanded),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Text(
                      _reviews.isEmpty ? 'No reviews yet' : '${_reviews.length} reviews',
                      style: const TextStyle(fontWeight: FontWeight.w500),
                    ),
                    const Spacer(),
                    Icon(isExpanded ? Icons.expand_less : Icons.expand_more),
                  ],
                ),
              ),
            ),
            if (isExpanded) ...[
              const SizedBox(height: 12),
              _buildReviewsSection(),
            ],
          ],
        );
      },
    );
  }
  
  Widget _buildReviewForm() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Your Rating:', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Row(
            children: List.generate(5, (index) => 
              GestureDetector(
                onTap: () => setState(() => _selectedRating = index + 1),
                child: Icon(
                  Icons.star,
                  size: 32,
                  color: index < _selectedRating ? Colors.amber : Colors.grey[300],
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _reviewController,
            decoration: const InputDecoration(
              hintText: 'Share your experience...',
              border: OutlineInputBorder(),
            ),
            maxLines: 3,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => setState(() {
                    _showReviewForm = false;
                    _selectedRating = 0;
                    _reviewController.clear();
                  }),
                  child: const Text('Cancel'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: _submitReview,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Color(AppConstants.colors['primary']!),
                    foregroundColor: Colors.white,
                  ),
                  child: const Text('Submit'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
  
  void _askAI() async {
    if (_questionController.text.trim().isEmpty) return;
    
    setState(() => _isAskingAI = true);
    
    try {
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/ai/ask'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'question': _questionController.text.trim(),
          'place': {
            'name': widget.place.name,
            'type': widget.place.type,
            'address': widget.place.address,
            'description': widget.place.description,
          },
        }),
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          _aiResponse = data['answer'] ?? 'Sorry, I couldn\'t generate a response.';
        });
      } else {
        throw Exception('AI service unavailable');
      }
    } catch (e) {
      setState(() {
        _aiResponse = 'I\'m sorry, I\'m having trouble connecting to the AI service right now. Please try again later.';
      });
    } finally {
      setState(() => _isAskingAI = false);
    }
  }
  
  void _submitReview() async {
    if (_selectedRating == 0 || _reviewController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please provide a rating and review text')),
      );
      return;
    }
    
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/reviews'),
        headers: {
          'Content-Type': 'application/json',
          if (token != null) 'Authorization': 'Bearer $token',
        },
        body: json.encode({
          'place_id': widget.place.id,
          'rating': _selectedRating,
          'text': _reviewController.text.trim(),
          'author_name': 'Travel Buddy User',
        }),
      );
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Review submitted successfully!')),
        );
        setState(() {
          _showReviewForm = false;
          _selectedRating = 0;
          _reviewController.clear();
        });
        _loadReviews(); // Reload reviews
      } else {
        throw Exception('Failed to submit review: ${response.statusCode}');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to submit review: $e')),
      );
    }
  }
  
  void _getDirections() async {
    final url = 'https://www.google.com/maps/dir/?api=1&destination=${Uri.encodeComponent(widget.place.address)}';
    await _launchUrl(url);
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
                  ? const Row(
                      children: [
                        SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        SizedBox(width: 8),
                        Text('Generating rich description...', style: TextStyle(fontStyle: FontStyle.italic)),
                      ],
                    )
                  : Text(
                      _getDisplayDescription(),
                      style: const TextStyle(
                        fontSize: 16, 
                        height: 1.6,
                        color: Colors.black87,
                      ),
                    ),
              if (_enhancedDescription != null && _enhancedDescription != widget.place.description) ...[
                const SizedBox(height: 8),
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
                        'AI Enhanced',
                        style: TextStyle(
                          fontSize: 10,
                          color: Colors.purple[700],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
        
        // Place Summary Section (Always visible)
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.blue[50],
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.blue[200]!),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(Icons.info, color: Colors.blue[600], size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _placeDetails?['editorial_summary'] != null ? 'Google Summary' : 'Place Summary',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.blue[800],
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _placeDetails?['editorial_summary']?['overview'] ?? 
                      (_enhancedDescription != null && _enhancedDescription!.length > 100
                        ? _enhancedDescription!.substring(0, 150) + '...'
                        : widget.place.description.isNotEmpty 
                          ? widget.place.description
                          : 'A ${widget.place.type} located at ${widget.place.address}.'),
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.blue[700],
                        height: 1.4,
                      ),
                    ),
                  ],
                ),
              ),
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
        
        // AI-Generated Insights Button
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: _generateAIInsights,
            icon: const Icon(Icons.auto_awesome, size: 18),
            label: const Text('Get AI Insights'),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 12),
              side: BorderSide(color: Color(AppConstants.colors['accent']!)),
              foregroundColor: Color(AppConstants.colors['accent']!),
            ),
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
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/ai/ask'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'question': 'Provide interesting insights, hidden gems, best times to visit, and insider tips for this place. Make it engaging and informative.',
          'place': {
            'name': widget.place.name,
            'type': widget.place.type,
            'address': widget.place.address,
            'description': widget.place.description,
          },
        }),
      ).timeout(const Duration(seconds: 15));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['answer'];
      }
    } catch (e) {
      print('Failed to get AI insights: $e');
    }
    return null;
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
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/ai/ask'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'question': 'Provide a practical local tip for visiting this place. Include insider knowledge like best times to visit, how to avoid crowds, local customs, money-saving tips, or hidden features. Keep it concise (50-80 words) and actionable.',
          'place': {
            'name': widget.place.name,
            'type': widget.place.type,
            'address': widget.place.address,
            'description': widget.place.description,
          },
        }),
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final aiTip = data['answer'];
        if (aiTip != null && aiTip.isNotEmpty) {
          setState(() => _aiLocalTip = aiTip);
        }
      }
    } catch (e) {
      print('Failed to load local tip: $e');
    } finally {
      setState(() => _isLoadingLocalTip = false);
    }
  }
  
  void _generateLocalTip() async {
    setState(() => _isLoadingLocalTip = true);
    
    try {
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/ai/ask'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'question': 'Generate a helpful local tip for this place. Focus on practical advice like best visiting hours, local etiquette, cost-saving tips, or insider secrets. Make it specific and actionable (50-80 words).',
          'place': {
            'name': widget.place.name,
            'type': widget.place.type,
            'address': widget.place.address,
            'description': widget.place.description,
          },
        }),
      ).timeout(const Duration(seconds: 10));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final aiTip = data['answer'];
        if (aiTip != null && aiTip.isNotEmpty) {
          setState(() => _aiLocalTip = aiTip);
        }
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
    // Skip if description is already rich (more than 100 characters)
    if (widget.place.description.length > 100) {
      _enhancedDescription = widget.place.description;
      return;
    }
    
    setState(() => _isLoadingEnhancedDescription = true);
    
    try {
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/ai/ask'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'question': 'Create a rich, informative description (150-200 words) about this place. Include its significance, what makes it special, visitor experience, historical context if relevant, and what people can expect. Make it engaging and informative.',
          'place': {
            'name': widget.place.name,
            'type': widget.place.type,
            'address': widget.place.address,
            'description': widget.place.description,
          },
        }),
      ).timeout(const Duration(seconds: 15));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final aiDescription = data['answer'];
        if (aiDescription != null && aiDescription.length > widget.place.description.length) {
          setState(() {
            _enhancedDescription = aiDescription;
          });
        }
      }
    } catch (e) {
      print('Failed to load enhanced description: $e');
    } finally {
      setState(() => _isLoadingEnhancedDescription = false);
    }
  }
  
  String _getDisplayDescription() {
    if (_enhancedDescription != null && _enhancedDescription!.isNotEmpty) {
      return _enhancedDescription!;
    }
    return widget.place.description.isNotEmpty 
        ? widget.place.description 
        : 'A ${widget.place.type} located at ${widget.place.address}. Discover what makes this place special!';
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
    final double dLat = (lat2 - lat1) * (pi / 180);
    final double dLon = (lon2 - lon1) * (pi / 180);
    final double a = sin(dLat / 2) * sin(dLat / 2) +
        cos(lat1 * (pi / 180)) * cos(lat2 * (pi / 180)) *
        sin(dLon / 2) * sin(dLon / 2);
    final double c = 2 * atan2(sqrt(a), sqrt(1 - a));
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
                    child: Center(
                      child: Image.network(
                        _photoGallery[index],
                        fit: BoxFit.contain,
                        loadingBuilder: (context, child, loadingProgress) {
                          if (loadingProgress == null) return child;
                          return const Center(child: CircularProgressIndicator(color: Colors.white));
                        },
                        errorBuilder: (context, error, stackTrace) => Container(
                          color: Colors.grey[800],
                          child: const Icon(Icons.image, size: 64, color: Colors.grey),
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
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(Icons.close, color: Colors.white, size: 28),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
  
  // Load reviews from backend (Google reviews)
  Future<void> _loadReviews() async {
    setState(() => _isLoadingReviews = true);
    
    try {
      // First try to get Google reviews from place details
      if (_placeDetails != null && _placeDetails!['reviews'] != null) {
        _reviews = (_placeDetails!['reviews'] as List).cast<Map<String, dynamic>>();
      } else if (widget.place.id.isNotEmpty) {
        // Fetch place details to get reviews
        final response = await http.get(
          Uri.parse('${AppConstants.baseUrl}/api/places/details?place_id=${widget.place.id}&lang=en'),
          headers: {'Content-Type': 'application/json'},
        ).timeout(const Duration(seconds: 10));
        
        if (response.statusCode == 200) {
          final data = json.decode(response.body);
          if (data['reviews'] != null) {
            _reviews = (data['reviews'] as List).cast<Map<String, dynamic>>();
          }
        }
      }
    } catch (e) {
      print('Failed to load reviews: $e');
    } finally {
      setState(() => _isLoadingReviews = false);
    }
  }
  
  // Load nearby places
  Future<void> _loadNearbyPlaces() async {
    setState(() => _isLoadingNearby = true);
    
    try {
      final appProvider = Provider.of<AppProvider>(context, listen: false);
      final placesService = PlacesService();
      
      final places = await placesService.fetchPlacesPipeline(
        latitude: widget.place.latitude ?? 0.0,
        longitude: widget.place.longitude ?? 0.0,
        query: 'tourist attractions',
        radius: 2000, // 2km radius
        topN: 6,
      );
      
      _nearbyPlaces = places.where((p) => p.id != widget.place.id).take(5).toList();
    } catch (e) {
      print('Failed to load nearby places: $e');
    } finally {
      setState(() => _isLoadingNearby = false);
    }
  }
  
  // Share place functionality
  void _sharePlace() async {
    final text = '${widget.place.name}\n${widget.place.address}\n\nRating: ${widget.place.rating}⭐\n\nShared via Travel Buddy';
    await Share.share(text, subject: 'Check out ${widget.place.name}');
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
  
  // Show all reviews
  void _showAllReviews() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        expand: false,
        builder: (context, scrollController) => Container(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: Column(
            children: [
              Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Text(
                'All Reviews (${_reviews.length})',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: ListView.builder(
                  controller: scrollController,
                  itemCount: _reviews.length,
                  itemBuilder: (context, index) => _buildReviewCard(_reviews[index]),
                ),
              ),
              SafeArea(
                child: SizedBox(height: 16),
              ),
            ],
          ),
        ),
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
}