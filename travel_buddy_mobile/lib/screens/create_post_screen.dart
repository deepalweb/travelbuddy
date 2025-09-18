import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../providers/community_provider.dart';
import '../services/image_service.dart';
import '../widgets/location_picker_map.dart';

class CreatePostScreen extends StatefulWidget {
  final String? initialPostType;
  
  const CreatePostScreen({super.key, this.initialPostType});

  @override
  State<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends State<CreatePostScreen> {
  final _contentController = TextEditingController();
  final _locationController = TextEditingController();
  String _selectedPostType = 'story';
  bool _isPosting = false;
  List<XFile> _selectedImages = [];
  final ImageService _imageService = ImageService();

  final List<Map<String, dynamic>> _postTypes = [
    {'value': 'story', 'label': 'Story', 'icon': Icons.auto_stories, 'color': Colors.blue},
    {'value': 'photo', 'label': 'Photo', 'icon': Icons.photo_camera, 'color': Colors.green},
    {'value': 'review', 'label': 'Review', 'icon': Icons.star, 'color': Colors.orange},
    {'value': 'tip', 'label': 'Tip', 'icon': Icons.lightbulb, 'color': Colors.purple},
    {'value': 'experience', 'label': 'Experience', 'icon': Icons.explore, 'color': Colors.teal},
    {'value': 'question', 'label': 'Question', 'icon': Icons.help_outline, 'color': Colors.indigo},
  ];
  
  final List<String> _hashtags = [];
  final TextEditingController _hashtagController = TextEditingController();
  bool _allowComments = true;
  String _visibility = 'public'; // public, friends, private

  @override
  void initState() {
    super.initState();
    _imageService.initialize();
    if (widget.initialPostType != null) {
      _selectedPostType = widget.initialPostType!;
    }
  }

  @override
  void dispose() {
    _contentController.dispose();
    _locationController.dispose();
    _hashtagController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Create Post'),
        backgroundColor: Colors.blue[600],
        foregroundColor: Colors.white,
        actions: [
          TextButton(
            onPressed: _isPosting ? null : _createPost,
            child: _isPosting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Text(
                    'POST',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildPostTypeSelector(),
            const SizedBox(height: 16),
            _buildLocationField(),
            const SizedBox(height: 16),
            _buildContentField(),
            const SizedBox(height: 16),
            _buildHashtagSection(),
            const SizedBox(height: 16),
            _buildImageSection(),
            const SizedBox(height: 16),
            _buildSettingsSection(),
          ],
        ),
      ),
    );
  }

  Widget _buildPostTypeSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Post Type',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: _postTypes.map((type) {
            final isSelected = _selectedPostType == type['value'];
            return ChoiceChip(
              label: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    type['icon'],
                    size: 16,
                    color: isSelected ? Colors.white : type['color'],
                  ),
                  const SizedBox(width: 4),
                  Text(type['label']),
                ],
              ),
              selected: isSelected,
              onSelected: (selected) {
                if (selected) {
                  setState(() {
                    _selectedPostType = type['value'];
                  });
                }
              },
              selectedColor: type['color'],
              labelStyle: TextStyle(
                color: isSelected ? Colors.white : Colors.black87,
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildLocationField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextField(
          controller: _locationController,
          decoration: InputDecoration(
            labelText: 'Location',
            hintText: 'Where are you?',
            prefixIcon: const Icon(Icons.location_on),
            suffixIcon: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: const Icon(Icons.map),
                  onPressed: _openMapPicker,
                ),
                IconButton(
                  icon: const Icon(Icons.my_location),
                  onPressed: _getCurrentLocation,
                ),
              ],
            ),
            border: const OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 8),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: _getPopularLocations().map((location) => 
              Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ActionChip(
                  label: Text(location),
                  onPressed: () {
                    _locationController.text = location;
                  },
                ),
              ),
            ).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildContentField() {
    return Expanded(
      child: TextField(
        controller: _contentController,
        maxLines: null,
        expands: true,
        textAlignVertical: TextAlignVertical.top,
        decoration: InputDecoration(
          labelText: 'Share your experience',
          hintText: _getHintText(),
          border: const OutlineInputBorder(),
          alignLabelWithHint: true,
        ),
      ),
    );
  }

  Widget _buildImageSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Photos', style: TextStyle(fontWeight: FontWeight.bold)),
            TextButton.icon(
              onPressed: _pickImages,
              icon: const Icon(Icons.add_photo_alternate),
              label: const Text('Add Photos'),
            ),
          ],
        ),
        if (_selectedImages.isNotEmpty) ...[
          const SizedBox(height: 8),
          SizedBox(
            height: 100,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _selectedImages.length,
              itemBuilder: (context, index) {
                return Container(
                  margin: const EdgeInsets.only(right: 8),
                  child: Stack(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.file(
                          File(_selectedImages[index].path),
                          width: 100,
                          height: 100,
                          fit: BoxFit.cover,
                        ),
                      ),
                      Positioned(
                        top: 4,
                        right: 4,
                        child: GestureDetector(
                          onTap: () => _removeImage(index),
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: Colors.black54,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.close,
                              color: Colors.white,
                              size: 16,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ] else ...[
          Container(
            width: double.infinity,
            height: 80,
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey[300]!),
              borderRadius: BorderRadius.circular(8),
            ),
            child: InkWell(
              onTap: _pickImages,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.add_photo_alternate, color: Colors.grey[400]),
                  const SizedBox(height: 4),
                  Text('Tap to add photos', style: TextStyle(color: Colors.grey[600])),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildHashtagSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Hashtags',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _hashtagController,
          decoration: const InputDecoration(
            hintText: 'Add hashtags (e.g., #travel #adventure)',
            prefixIcon: Icon(Icons.tag),
            border: OutlineInputBorder(),
          ),
          onSubmitted: _addHashtag,
        ),
        if (_hashtags.isNotEmpty) ...[
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 4,
            children: _hashtags.map((tag) {
              return Chip(
                label: Text('#$tag'),
                deleteIcon: const Icon(Icons.close, size: 18),
                onDeleted: () {
                  setState(() {
                    _hashtags.remove(tag);
                  });
                },
                backgroundColor: Colors.blue[50],
                labelStyle: TextStyle(color: Colors.blue[700]),
              );
            }).toList(),
          ),
        ],
      ],
    );
  }

  Widget _buildSettingsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Post Settings',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                Row(
                  children: [
                    const Icon(Icons.visibility, color: Colors.grey),
                    const SizedBox(width: 12),
                    const Text('Visibility'),
                    const Spacer(),
                    DropdownButton<String>(
                      value: _visibility,
                      underline: const SizedBox(),
                      items: const [
                        DropdownMenuItem(value: 'public', child: Text('Public')),
                        DropdownMenuItem(value: 'friends', child: Text('Friends')),
                        DropdownMenuItem(value: 'private', child: Text('Private')),
                      ],
                      onChanged: (value) {
                        setState(() {
                          _visibility = value!;
                        });
                      },
                    ),
                  ],
                ),
                const Divider(),
                Row(
                  children: [
                    const Icon(Icons.comment, color: Colors.grey),
                    const SizedBox(width: 12),
                    const Text('Allow Comments'),
                    const Spacer(),
                    Switch(
                      value: _allowComments,
                      onChanged: (value) {
                        setState(() {
                          _allowComments = value;
                        });
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _addHashtag(String value) {
    final hashtag = value.trim().replaceAll('#', '');
    if (hashtag.isNotEmpty && !_hashtags.contains(hashtag)) {
      setState(() {
        _hashtags.add(hashtag);
        _hashtagController.clear();
      });
    }
  }

  List<String> _getPopularLocations() {
    return [
      'Paris, France',
      'Tokyo, Japan',
      'New York, USA',
      'London, UK',
      'Bali, Indonesia',
      'Rome, Italy',
    ];
  }

  void _getCurrentLocation() async {
    // Mock current location for demo
    final mockLocations = [
      'Current Location',
      'Nearby Restaurant',
      'Local Park',
      'City Center',
    ];
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Location'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: mockLocations.map((location) => 
            ListTile(
              leading: const Icon(Icons.location_on),
              title: Text(location),
              onTap: () {
                _locationController.text = location;
                Navigator.pop(context);
              },
            ),
          ).toList(),
        ),
      ),
    );
  }

  void _openMapPicker() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => LocationPickerMap(
          onLocationSelected: (location, lat, lng) {
            _locationController.text = location;
          },
        ),
      ),
    );
  }

  Future<void> _pickImages() async {
    final images = await _imageService.pickImages(maxImages: 5);
    setState(() {
      _selectedImages = images;
    });
  }

  void _removeImage(int index) {
    setState(() {
      _selectedImages.removeAt(index);
    });
  }

  String _getHintText() {
    switch (_selectedPostType) {
      case 'story':
        return 'Tell us about your travel adventure...';
      case 'photo':
        return 'Share the story behind this photo...';
      case 'review':
        return 'How was your experience at this place?';
      case 'tip':
        return 'Share a helpful travel tip...';
      default:
        return 'What\'s on your mind?';
    }
  }

  Future<void> _createPost() async {
    if (_contentController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please write something about your experience')),
      );
      return;
    }
    
    if (_locationController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add a location')),
      );
      return;
    }

    setState(() {
      _isPosting = true;
    });

    List<String> imageUrls = [];
    if (_selectedImages.isNotEmpty) {
      imageUrls = await _imageService.uploadImages(_selectedImages);
    }

    final success = await context.read<CommunityProvider>().createPost(
      content: _contentController.text.trim(),
      location: _locationController.text.trim(),
      postType: _selectedPostType,
      images: imageUrls,
      hashtags: _hashtags,
      allowComments: _allowComments,
      visibility: _visibility,
    );

    setState(() {
      _isPosting = false;
    });

    if (success) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Post created successfully!'),
          backgroundColor: Colors.green,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to create post. Please try again.'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}