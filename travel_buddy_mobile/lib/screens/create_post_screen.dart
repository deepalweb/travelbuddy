import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
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
  bool _isLoadingLocation = false;
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
        elevation: 0,
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 8),
            child: ElevatedButton(
              onPressed: _isPosting ? null : _createPost,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Colors.blue[600],
                elevation: 0,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
              child: _isPosting
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text(
                      'POST',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            _buildPostTypeSelector(),
            _buildLocationField(),
            _buildContentField(),
            _buildImageSection(),
            _buildHashtagSection(),
            _buildSettingsSection(),
            const SizedBox(height: 100), // Bottom padding for FAB
          ],
        ),
      ),
    );
  }

  Widget _buildPostTypeSelector() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue[50],
        border: Border(
          bottom: BorderSide(color: Colors.grey[200]!),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'What do you want to share?',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 100,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _postTypes.length,
              itemBuilder: (context, index) {
                final type = _postTypes[index];
                final isSelected = _selectedPostType == type['value'];
                return Container(
                  width: 80,
                  margin: const EdgeInsets.only(right: 12),
                  child: GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedPostType = type['value'];
                      });
                    },
                    child: Container(
                      decoration: BoxDecoration(
                        color: isSelected ? type['color'] : Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSelected ? type['color'] : Colors.grey[300]!,
                          width: 2,
                        ),
                        boxShadow: isSelected ? [
                          BoxShadow(
                            color: type['color'].withOpacity(0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ] : null,
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            type['icon'],
                            size: 28,
                            color: isSelected ? Colors.white : type['color'],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            type['label'],
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: isSelected ? Colors.white : Colors.black87,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLocationField() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.location_on, color: Colors.red[400], size: 20),
              const SizedBox(width: 8),
              const Text(
                'Location',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: TextField(
              controller: _locationController,
              style: const TextStyle(fontSize: 16),
              decoration: InputDecoration(
                hintText: 'Where are you?',
                hintStyle: TextStyle(color: Colors.grey[500]),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.all(16),
                suffixIcon: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: _isLoadingLocation 
                          ? SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.blue[600]!),
                              ),
                            )
                          : Icon(Icons.my_location, color: Colors.blue[600]),
                      onPressed: _isLoadingLocation ? null : _getCurrentLocation,
                      tooltip: 'Current location',
                    ),
                    IconButton(
                      icon: Icon(Icons.map, color: Colors.green[600]),
                      onPressed: _openMapPicker,
                      tooltip: 'Pick from map',
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 40,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _getPopularLocations().length,
              itemBuilder: (context, index) {
                final location = _getPopularLocations()[index];
                return Container(
                  margin: const EdgeInsets.only(right: 8),
                  child: ActionChip(
                    label: Text(
                      location,
                      style: const TextStyle(fontSize: 12),
                    ),
                    onPressed: () {
                      _locationController.text = location;
                    },
                    backgroundColor: Colors.blue[50],
                    side: BorderSide(color: Colors.blue[200]!),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContentField() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.edit, color: Colors.orange[400], size: 20),
              const SizedBox(width: 8),
              const Text(
                'Your Story',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            width: double.infinity,
            constraints: const BoxConstraints(minHeight: 120),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: TextField(
              controller: _contentController,
              maxLines: null,
              minLines: 5,
              style: const TextStyle(fontSize: 16, height: 1.4),
              decoration: InputDecoration(
                hintText: _getHintText(),
                hintStyle: TextStyle(
                  color: Colors.grey[500],
                  fontSize: 16,
                ),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.all(16),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildImageSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.photo_camera, color: Colors.green[400], size: 20),
              const SizedBox(width: 8),
              const Text(
                'Photos',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
              const Spacer(),
              if (_selectedImages.length < 2)
                ElevatedButton.icon(
                  onPressed: _pickImages,
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Add'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green[50],
                    foregroundColor: Colors.green[700],
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          if (_selectedImages.isNotEmpty) ...[
            SizedBox(
              height: 120,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: _selectedImages.length + (_selectedImages.length < 2 ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == _selectedImages.length && _selectedImages.length < 2) {
                    return Container(
                      width: 120,
                      margin: const EdgeInsets.only(right: 8),
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey[300]!, width: 2, style: BorderStyle.solid),
                      ),
                      child: InkWell(
                        onTap: _pickImages,
                        borderRadius: BorderRadius.circular(12),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.add_photo_alternate, color: Colors.grey[400], size: 32),
                            const SizedBox(height: 4),
                            Text(
                              'Add Photo',
                              style: TextStyle(color: Colors.grey[600], fontSize: 12),
                            ),
                          ],
                        ),
                      ),
                    );
                  }
                  return Container(
                    width: 120,
                    margin: const EdgeInsets.only(right: 8),
                    child: Stack(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.file(
                            File(_selectedImages[index].path),
                            width: 120,
                            height: 120,
                            fit: BoxFit.cover,
                          ),
                        ),
                        Positioned(
                          top: 6,
                          right: 6,
                          child: GestureDetector(
                            onTap: () => _removeImage(index),
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: Colors.black.withOpacity(0.7),
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
              height: 100,
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey[300]!, width: 2, style: BorderStyle.solid),
              ),
              child: InkWell(
                onTap: _pickImages,
                borderRadius: BorderRadius.circular(12),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.add_photo_alternate, color: Colors.grey[400], size: 32),
                    const SizedBox(height: 8),
                    Text(
                      'Add photos to your post',
                      style: TextStyle(color: Colors.grey[600], fontSize: 14),
                    ),
                    Text(
                      'Up to 2 photos',
                      style: TextStyle(color: Colors.grey[500], fontSize: 12),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildHashtagSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.tag, color: Colors.purple[400], size: 20),
              const SizedBox(width: 8),
              const Text(
                'Hashtags',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: TextField(
              controller: _hashtagController,
              style: const TextStyle(fontSize: 16),
              decoration: InputDecoration(
                hintText: 'Add hashtags (e.g., #travel #adventure)',
                hintStyle: TextStyle(color: Colors.grey[500]),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.all(16),
                suffixIcon: IconButton(
                  icon: Icon(Icons.add, color: Colors.purple[600]),
                  onPressed: () => _addHashtag(_hashtagController.text),
                ),
              ),
              onSubmitted: _addHashtag,
            ),
          ),
          if (_hashtags.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _hashtags.map((tag) {
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.purple[50],
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.purple[200]!),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '#$tag',
                        style: TextStyle(
                          color: Colors.purple[700],
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(width: 6),
                      GestureDetector(
                        onTap: () {
                          setState(() {
                            _hashtags.remove(tag);
                          });
                        },
                        child: Icon(
                          Icons.close,
                          size: 16,
                          color: Colors.purple[600],
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildSettingsSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.settings, color: Colors.grey[600], size: 20),
              const SizedBox(width: 8),
              const Text(
                'Post Settings',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.blue[100],
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(Icons.visibility, color: Colors.blue[600], size: 20),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text(
                          'Who can see this?',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.grey[300]!),
                        ),
                        child: DropdownButton<String>(
                          value: _visibility,
                          underline: const SizedBox(),
                          isDense: true,
                          items: const [
                            DropdownMenuItem(value: 'public', child: Text('🌍 Public')),
                            DropdownMenuItem(value: 'friends', child: Text('👥 Friends')),
                            DropdownMenuItem(value: 'private', child: Text('🔒 Private')),
                          ],
                          onChanged: (value) {
                            setState(() {
                              _visibility = value!;
                            });
                          },
                        ),
                      ),
                    ],
                  ),
                ),
                Divider(color: Colors.grey[300], height: 1),
                Container(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.green[100],
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(Icons.comment, color: Colors.green[600], size: 20),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text(
                          'Allow Comments',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
                        ),
                      ),
                      Switch(
                        value: _allowComments,
                        onChanged: (value) {
                          setState(() {
                            _allowComments = value;
                          });
                        },
                        activeThumbColor: Colors.green[600],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
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
    // Get popular locations based on user's region or global popular spots
    return [
      'Current City Center',
      'Nearby Attractions',
      'Local Restaurant',
      'Coffee Shop',
      'Park or Beach',
      'Shopping Area',
    ];
  }

  void _getCurrentLocation() async {
    setState(() {
      _isLoadingLocation = true;
    });

    try {
      // Check location permissions
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          _showLocationError('Location permissions are denied');
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        _showLocationError('Location permissions are permanently denied');
        return;
      }

      // Check if location service is enabled
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        _showLocationError('Location services are disabled');
        return;
      }

      // Get current position
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 10),
      );

      // Convert coordinates to address
      List<Placemark> placemarks = await placemarkFromCoordinates(
        position.latitude,
        position.longitude,
      );

      if (placemarks.isNotEmpty) {
        Placemark place = placemarks[0];
        String address = _formatAddress(place);
        
        setState(() {
          _locationController.text = address;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Location found: $address'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 2),
          ),
        );
      } else {
        _showLocationError('Could not determine address');
      }
    } catch (e) {
      _showLocationError('Failed to get location: ${e.toString()}');
    } finally {
      setState(() {
        _isLoadingLocation = false;
      });
    }
  }

  String _formatAddress(Placemark place) {
    List<String> addressParts = [];
    
    if (place.name != null && place.name!.isNotEmpty) {
      addressParts.add(place.name!);
    }
    if (place.street != null && place.street!.isNotEmpty) {
      addressParts.add(place.street!);
    }
    if (place.locality != null && place.locality!.isNotEmpty) {
      addressParts.add(place.locality!);
    }
    if (place.country != null && place.country!.isNotEmpty) {
      addressParts.add(place.country!);
    }
    
    return addressParts.take(2).join(', ');
  }

  void _showLocationError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        action: SnackBarAction(
          label: 'Settings',
          textColor: Colors.white,
          onPressed: () {
            Geolocator.openAppSettings();
          },
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
    final images = await _imageService.pickImages(maxImages: 2);
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

    print('🚀 [CREATE] Starting post creation...');
    print('🚀 [CREATE] Content: ${_contentController.text.trim()}');
    print('🚀 [CREATE] Location: ${_locationController.text.trim()}');
    print('🚀 [CREATE] Images: ${imageUrls.length}');
    
    final success = await context.read<CommunityProvider>().createPost(
      content: _contentController.text.trim(),
      location: _locationController.text.trim(),
      postType: _selectedPostType,
      images: imageUrls,
      hashtags: _hashtags,
      allowComments: _allowComments,
      visibility: _visibility,
      context: context,
    );
    
    print('🚀 [CREATE] Post creation result: $success');

    setState(() {
      _isPosting = false;
    });

    print('🚀 [CREATE] Final success result: $success');
    
    if (success) {
      print('✅ [CREATE] Post created successfully - navigating back');
      Navigator.of(context).pop(true); // Return true to indicate success
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Post created successfully!'),
          backgroundColor: Colors.green,
        ),
      );
    } else {
      print('❌ [CREATE] Post creation failed - showing error');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Failed to create post. Please try again.'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}