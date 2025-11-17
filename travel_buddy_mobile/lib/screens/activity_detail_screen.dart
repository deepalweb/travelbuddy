import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../models/trip.dart';
import '../services/azure_openai_service.dart';

class ActivityDetailScreen extends StatefulWidget {
  final ActivityDetail activity;

  const ActivityDetailScreen({Key? key, required this.activity}) : super(key: key);

  @override
  State<ActivityDetailScreen> createState() => _ActivityDetailScreenState();
}

class _ActivityDetailScreenState extends State<ActivityDetailScreen> {
  String? _enhancedDescription;
  List<String> _images = [];
  bool _isLoadingContent = false;
  bool _isLoadingImages = false;

  @override
  void initState() {
    super.initState();
    _loadEnhancedContent();
    _loadImages();
  }

  Future<void> _loadEnhancedContent() async {
    setState(() => _isLoadingContent = true);
    
    try {
      final prompt = '''Generate detailed information about "${widget.activity.activityTitle}" located at "${widget.activity.location}".

Include:
- Rich description (2-3 paragraphs)
- Historical significance or background
- What visitors can expect
- Best times to visit
- Insider tips
- Cultural significance

Make it engaging and informative for travelers.''';

      final response = await AzureOpenAIService.generateContent(prompt);
      
      if (mounted) {
        setState(() {
          _enhancedDescription = response;
          _isLoadingContent = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingContent = false);
      }
    }
  }

  Future<void> _loadImages() async {
    setState(() => _isLoadingImages = true);
    
    try {
      // Use Unsplash API for high-quality images
      final query = widget.activity.activityTitle.replaceAll(' ', '+');
      final response = await http.get(
        Uri.parse('https://api.unsplash.com/search/photos?query=$query&per_page=5&client_id=YOUR_UNSPLASH_ACCESS_KEY'),
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final results = data['results'] as List;
        
        final imageUrls = results
            .map((photo) => photo['urls']['regular'] as String)
            .take(3)
            .toList();
        
        if (mounted) {
          setState(() {
            _images = imageUrls;
            _isLoadingImages = false;
          });
        }
      } else {
        // Fallback to mock images
        _setFallbackImages();
      }
    } catch (e) {
      _setFallbackImages();
    }
  }

  void _setFallbackImages() {
    // Use placeholder images as fallback
    final fallbackImages = [
      'https://picsum.photos/400/300?random=1',
      'https://picsum.photos/400/300?random=2',
      'https://picsum.photos/400/300?random=3',
    ];
    
    if (mounted) {
      setState(() {
        _images = fallbackImages;
        _isLoadingImages = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.activity.activityTitle),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Gallery
            _buildImageGallery(),
            
            // Activity Info
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title and Basic Info
                  Text(
                    widget.activity.activityTitle,
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  
                  // Location
                  if (widget.activity.fullAddress?.isNotEmpty == true)
                    Row(
                      children: [
                        const Icon(Icons.location_on, color: Colors.grey, size: 16),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            widget.activity.fullAddress!,
                            style: const TextStyle(color: Colors.grey),
                          ),
                        ),
                      ],
                    ),
                  
                  const SizedBox(height: 16),
                  
                  // Quick Info Row
                  Row(
                    children: [
                      if (widget.activity.rating != null) ...[
                        const Icon(Icons.star, color: Colors.orange, size: 20),
                        const SizedBox(width: 4),
                        Text(
                          '${widget.activity.rating}',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(width: 16),
                      ],
                      if (widget.activity.duration.isNotEmpty) ...[
                        const Icon(Icons.schedule, color: Colors.blue, size: 20),
                        const SizedBox(width: 4),
                        Text(widget.activity.duration),
                        const SizedBox(width: 16),
                      ],
                      if (widget.activity.estimatedCost.isNotEmpty && widget.activity.estimatedCost != '€0') ...[
                        const Icon(Icons.euro, color: Colors.green, size: 20),
                        const SizedBox(width: 4),
                        Text(
                          widget.activity.estimatedCost,
                          style: const TextStyle(
                            color: Colors.green,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ],
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Original Description
                  if (widget.activity.description.isNotEmpty) ...[
                    const Text(
                      'About',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      widget.activity.description,
                      style: const TextStyle(fontSize: 16, height: 1.5),
                    ),
                    const SizedBox(height: 24),
                  ],
                  
                  // Enhanced Description
                  _buildEnhancedDescription(),
                  
                  // Practical Tip
                  if (widget.activity.practicalTip?.isNotEmpty == true) ...[
                    const SizedBox(height: 24),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.orange[50],
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.orange[200]!),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.lightbulb, color: Colors.orange[700]),
                              const SizedBox(width: 8),
                              Text(
                                'Insider Tip',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.orange[700],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            widget.activity.practicalTip!,
                            style: const TextStyle(fontSize: 14),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImageGallery() {
    if (_isLoadingImages) {
      return Container(
        height: 250,
        color: Colors.grey[200],
        child: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

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
                      '${index + 1}/${_images.length}',
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

  Widget _buildEnhancedDescription() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.auto_awesome, color: Colors.purple),
            const SizedBox(width: 8),
            const Text(
              'Detailed Information',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const Spacer(),
            if (_isLoadingContent)
              const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
          ],
        ),
        const SizedBox(height: 12),
        if (_enhancedDescription != null)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.purple[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.purple[200]!),
            ),
            child: Text(
              _enhancedDescription!,
              style: const TextStyle(fontSize: 14, height: 1.6),
            ),
          )
        else if (!_isLoadingContent)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[200]!),
            ),
            child: const Text(
              'Enhanced details will be generated here using AI.',
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
}