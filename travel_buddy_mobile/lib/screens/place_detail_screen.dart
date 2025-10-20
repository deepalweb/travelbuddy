import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../services/azure_openai_service.dart';

class PlaceDetailScreen extends StatefulWidget {
  final String placeName;
  final String placeAddress;
  final String? googlePlaceId;

  const PlaceDetailScreen({
    Key? key,
    required this.placeName,
    required this.placeAddress,
    this.googlePlaceId,
  }) : super(key: key);

  @override
  State<PlaceDetailScreen> createState() => _PlaceDetailScreenState();
}

class _PlaceDetailScreenState extends State<PlaceDetailScreen> {
  Map<String, dynamic>? _placeDetails;
  String? _aiDescription;
  List<String> _images = [];
  bool _isLoadingPlace = false;
  bool _isLoadingAI = false;
  bool _isLoadingImages = false;
  int _activeImageIndex = 0;

  @override
  void initState() {
    super.initState();
    _loadPlaceDetails();
    _loadAIDescription();
    _loadImages();
  }

  Future<void> _loadPlaceDetails() async {
    if (widget.googlePlaceId == null) return;
    
    setState(() => _isLoadingPlace = true);
    
    try {
      final response = await http.get(
        Uri.parse('http://localhost:3001/api/places/details?place_id=${widget.googlePlaceId}'),
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          _placeDetails = data;
          _isLoadingPlace = false;
        });
        
        // Load Google Places photos
        if (data['photos'] != null) {
          final googlePhotos = (data['photos'] as List)
              .take(3)
              .map((photo) => 'http://localhost:3001/api/places/photo?ref=${photo['photo_reference']}&w=800')
              .toList();
          setState(() {
            _images.insertAll(0, googlePhotos);
          });
        }
      }
    } catch (e) {
      setState(() => _isLoadingPlace = false);
    }
  }

  Future<void> _loadAIDescription() async {
    setState(() => _isLoadingAI = true);
    
    try {
      final prompt = '''Generate comprehensive information about "${widget.placeName}" located at "${widget.placeAddress}".

Include:
- Detailed description (2-3 paragraphs)
- Historical background and significance
- What visitors can expect to see and do
- Best times to visit and duration recommendations
- Insider tips and local knowledge
- Cultural significance and interesting facts
- Practical information for tourists

Make it engaging and informative like a travel guide.''';

      final response = await AzureOpenAIService.generateContent(prompt);
      
      if (mounted) {
        setState(() {
          _aiDescription = response;
          _isLoadingAI = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingAI = false);
      }
    }
  }

  Future<void> _loadImages() async {
    setState(() => _isLoadingImages = true);
    
    try {
      // Generate deterministic images based on place name
      final placeHash = widget.placeName.hashCode.abs();
      final fallbackImages = [
        'https://picsum.photos/800/600?random=${placeHash % 1000}',
        'https://picsum.photos/800/600?random=${(placeHash + 1) % 1000}',
        'https://picsum.photos/800/600?random=${(placeHash + 2) % 1000}',
      ];
      
      setState(() {
        _images.addAll(fallbackImages);
        _isLoadingImages = false;
      });
    } catch (e) {
      setState(() => _isLoadingImages = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.placeName),
        backgroundColor: Colors.green[600],
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Gallery
            _buildImageGallery(),
            
            // Place Information
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title and Address
                  Text(
                    widget.placeName,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  
                  Row(
                    children: [
                      const Icon(Icons.location_on, color: Colors.grey, size: 16),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          widget.placeAddress,
                          style: const TextStyle(color: Colors.grey),
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Google Places Details
                  if (_placeDetails != null) _buildGooglePlaceDetails(),
                  
                  const SizedBox(height: 24),
                  
                  // AI-Generated Description
                  _buildAIDescription(),
                  
                  const SizedBox(height: 24),
                  
                  // Action Buttons
                  _buildActionButtons(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImageGallery() {
    if (_images.isEmpty) {
      return Container(
        height: 250,
        color: Colors.grey[300],
        child: const Center(
          child: Icon(Icons.image, size: 64, color: Colors.grey),
        ),
      );
    }

    return SizedBox(
      height: 250,
      child: PageView.builder(
        itemCount: _images.length,
        onPageChanged: (index) => setState(() => _activeImageIndex = index),
        itemBuilder: (context, index) {
          return Stack(
            children: [
              Image.network(
                _images[index],
                width: double.infinity,
                height: 250,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    color: Colors.grey[300],
                    child: const Center(
                      child: Icon(Icons.image, size: 64, color: Colors.grey),
                    ),
                  );
                },
              ),
              if (_images.length > 1)
                Positioned(
                  bottom: 16,
                  right: 16,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.6),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${_activeImageIndex + 1}/${_images.length}',
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildGooglePlaceDetails() {
    return Card(
      color: Colors.blue[50],
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.info, color: Colors.blue),
                const SizedBox(width: 8),
                const Text(
                  'Place Information',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                if (_isLoadingPlace)
                  const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            
            // Rating
            if (_placeDetails?['rating'] != null)
              Row(
                children: [
                  const Icon(Icons.star, color: Colors.orange, size: 20),
                  const SizedBox(width: 4),
                  Text(
                    '${_placeDetails!['rating']}',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '(${_placeDetails!['user_ratings_total'] ?? 0} reviews)',
                    style: const TextStyle(color: Colors.grey),
                  ),
                ],
              ),
            
            const SizedBox(height: 8),
            
            // Opening Hours
            if (_placeDetails?['opening_hours'] != null)
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.schedule, color: Colors.green, size: 16),
                      const SizedBox(width: 4),
                      Text(
                        _placeDetails!['opening_hours']['open_now'] == true ? 'Open now' : 'Closed',
                        style: TextStyle(
                          color: _placeDetails!['opening_hours']['open_now'] == true ? Colors.green : Colors.red,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  if (_placeDetails!['opening_hours']['weekday_text'] != null)
                    ...(_placeDetails!['opening_hours']['weekday_text'] as List)
                        .take(3)
                        .map((day) => Padding(
                              padding: const EdgeInsets.only(left: 20, top: 2),
                              child: Text(
                                day,
                                style: const TextStyle(fontSize: 12, color: Colors.grey),
                              ),
                            )),
                ],
              ),
            
            // Phone and Website
            if (_placeDetails?['formatted_phone_number'] != null)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Row(
                  children: [
                    const Icon(Icons.phone, color: Colors.blue, size: 16),
                    const SizedBox(width: 4),
                    Text(_placeDetails!['formatted_phone_number']),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildAIDescription() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.auto_awesome, color: Colors.purple),
            const SizedBox(width: 8),
            const Text(
              'About This Place',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const Spacer(),
            if (_isLoadingAI)
              const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
          ],
        ),
        const SizedBox(height: 12),
        if (_aiDescription != null)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.purple[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.purple[200]!),
            ),
            child: Text(
              _aiDescription!,
              style: const TextStyle(fontSize: 14, height: 1.6),
            ),
          )
        else if (!_isLoadingAI)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[200]!),
            ),
            child: const Text(
              'Detailed information will be generated here using AI.',
              style: TextStyle(
                fontSize: 14,
                fontStyle: FontStyle.italic,
                color: Colors.grey,
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildActionButtons() {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: () {
              // Open in Google Maps
              final query = Uri.encodeComponent(widget.placeAddress.isNotEmpty ? widget.placeAddress : widget.placeName);
              final url = 'https://www.google.com/maps/search/?api=1&query=$query';
              // Launch URL logic here
            },
            icon: const Icon(Icons.map),
            label: const Text('Open in Google Maps'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: () {
              // Share place
              final shareText = '${widget.placeName}\n${widget.placeAddress}';
              // Share logic here
            },
            icon: const Icon(Icons.share),
            label: const Text('Share Place'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.blue,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ),
      ],
    );
  }
}