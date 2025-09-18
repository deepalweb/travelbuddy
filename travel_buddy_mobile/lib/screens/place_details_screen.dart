import 'dart:convert';
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
    _loadReviews();
    _loadNearbyPlaces();
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
          .take(3) // Limit to 3 photos only
          .map((photo) => '${AppConstants.baseUrl}/api/places/photo?ref=${Uri.encodeComponent(photo['photo_reference'])}&w=600')
          .toList();
      
      _photoAttributions = photos
          .take(3)
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
                              Icons.category,
                              widget.place.type,
                              'Type',
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
                      if (widget.place.localTip.isNotEmpty) ..._buildSection(
                        'Local Tip',
                        Icons.lightbulb_outline,
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.blue[50],
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.blue[200]!),
                          ),
                          child: Text(
                            widget.place.localTip,
                            style: const TextStyle(fontSize: 14),
                          ),
                        ),
                      ),
                      
                      // Handy Phrase Section
                      if (widget.place.handyPhrase.isNotEmpty) ..._buildSection(
                        'Handy Phrase',
                        Icons.translate,
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.green[50],
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.green[200]!),
                          ),
                          child: Text(
                            '"${widget.place.handyPhrase}"',
                            style: const TextStyle(fontSize: 14, fontStyle: FontStyle.italic),
                          ),
                        ),
                      ),
                      
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
                      
                      const SizedBox(height: 20),
                      
                      // Enhanced Action Buttons
                      Column(
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: ElevatedButton.icon(
                                  onPressed: () => _getDirections(),
                                  icon: const Icon(Icons.directions),
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
                              if (widget.place.phoneNumber != null || _placeDetails?['formatted_phone_number'] != null)
                                Expanded(
                                  child: ElevatedButton.icon(
                                    onPressed: () => _launchUrl('tel:${widget.place.phoneNumber ?? _placeDetails!['formatted_phone_number']}'),
                                    icon: const Icon(Icons.phone),
                                    label: const Text('Call'),
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
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: _sharePlace,
                                  icon: const Icon(Icons.share),
                                  label: const Text('Share'),
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: OutlinedButton.icon(
                                  onPressed: () {
                                    showDialog(
                                      context: context,
                                      builder: (context) => AddToTripDialog(place: widget.place),
                                    );
                                  },
                                  icon: const Icon(Icons.add),
                                  label: const Text('Add Trip'),
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      
                      const SizedBox(height: 20),
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
        if (!_showReviewForm)
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => setState(() => _showReviewForm = true),
              icon: const Icon(Icons.rate_review),
              label: const Text('Write a Review'),
            ),
          )
        else
          _buildReviewForm(),
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
      final response = await http.post(
        Uri.parse('${AppConstants.baseUrl}/api/reviews'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'place_id': widget.place.id,
          'rating': _selectedRating,
          'text': _reviewController.text.trim(),
          'author_name': 'Anonymous User',
        }),
      );
      
      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Review submitted successfully!')),
        );
        _loadReviews(); // Reload reviews
      } else {
        throw Exception('Failed to submit review');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to submit review: $e')),
      );
    }
    
    setState(() {
      _showReviewForm = false;
      _selectedRating = 0;
      _reviewController.clear();
    });
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
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: Text(
            widget.place.description,
            style: const TextStyle(
              fontSize: 16, 
              height: 1.6,
              color: Colors.black87,
            ),
          ),
        ),
        if (_placeDetails != null && _placeDetails!['editorial_summary'] != null) ...[
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
                        'Google Summary',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.blue[800],
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _placeDetails!['editorial_summary']['overview'] ?? '',
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
        ],
      ],
    );
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
  
  // Load reviews from backend
  Future<void> _loadReviews() async {
    setState(() => _isLoadingReviews = true);
    
    try {
      final response = await http.get(
        Uri.parse('${AppConstants.baseUrl}/api/reviews?place_id=${widget.place.id}'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 5));
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body) as List;
        _reviews = data.cast<Map<String, dynamic>>();
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
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        builder: (context, scrollController) => Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
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