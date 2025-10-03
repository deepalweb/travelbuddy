import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import '../providers/app_provider.dart';
import '../models/travel_style.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _bioController = TextEditingController();
  final _websiteController = TextEditingController();
  final _locationController = TextEditingController();
  bool _isLoading = false;
  bool _isPickingImage = false;
  File? _selectedImage;
  String? _currentAvatarUrl;
  DateTime? _selectedBirthday;
  final ImagePicker _picker = ImagePicker();
  bool _showBirthdayToOthers = true;
  bool _showLocationToOthers = true;

  @override
  void initState() {
    super.initState();
    _loadCurrentData();
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _bioController.dispose();
    _websiteController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  void _loadCurrentData() {
    final user = context.read<AppProvider>().currentUser;
    if (user != null) {
      _usernameController.text = user.username ?? '';
      _bioController.text = user.bio ?? 'Travel Enthusiast • 🌍 Explorer';
      _websiteController.text = user.website ?? '';
      _locationController.text = user.location ?? '';
      _selectedBirthday = user.birthday != null ? DateTime.tryParse(user.birthday!) : null;
      _currentAvatarUrl = user.profilePicture;
      _showBirthdayToOthers = user.showBirthdayToOthers;
      _showLocationToOthers = user.showLocationToOthers;
      _selectedLanguages = Set<String>.from(user.languages ?? []);
      _selectedInterests = Set<String>.from(user.interests ?? []);
      _selectedBudgets = Set<String>.from(user.budgetPreferences ?? []);
      print('📸 [EDIT] Current avatar: $_currentAvatarUrl');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 1,
        title: const Text('Edit Profile'),
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _saveProfile,
            child: _isLoading
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text(
                    'Save',
                    style: TextStyle(
                      color: Color(0xFF3797EF),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Profile Picture Section
            Center(
              child: Column(
                children: [
                  Stack(
                    children: [
                      CircleAvatar(
                        radius: 50,
                        backgroundColor: Colors.grey[300],
                        backgroundImage: _getProfileImage(),
                        child: _getProfileImage() == null 
                            ? const Icon(Icons.person, size: 50, color: Colors.grey)
                            : null,
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: GestureDetector(
                          onTap: _changeProfilePicture,
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: const BoxDecoration(
                              color: Color(0xFF3797EF),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.camera_alt,
                              color: Colors.white,
                              size: 16,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: _changeProfilePicture,
                    child: const Text(
                      'Change Profile Photo',
                      style: TextStyle(
                        color: Color(0xFF3797EF),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            
            // Username Field
            TextFormField(
              controller: _usernameController,
              decoration: InputDecoration(
                labelText: 'Username',
                prefixIcon: const Icon(Icons.person),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Username is required';
                }
                if (value.length < 3) {
                  return 'Username must be at least 3 characters';
                }
                if (!RegExp(r'^[a-zA-Z0-9_]+$').hasMatch(value)) {
                  return 'Username can only contain letters, numbers, and underscores';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            
            // Bio Field
            TextFormField(
              controller: _bioController,
              maxLines: 3,
              maxLength: 150,
              decoration: InputDecoration(
                labelText: 'Bio',
                prefixIcon: const Icon(Icons.edit),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                hintText: 'Tell us about yourself...',
              ),
            ),
            const SizedBox(height: 16),
            
            // Website Field
            TextFormField(
              controller: _websiteController,
              decoration: InputDecoration(
                labelText: 'Website',
                prefixIcon: const Icon(Icons.link),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                hintText: 'https://yourwebsite.com',
              ),
              validator: (value) {
                if (value != null && value.isNotEmpty) {
                  if (Uri.tryParse(value)?.hasAbsolutePath != true) {
                    return 'Please enter a valid URL';
                  }
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            
            // Location Field
            TextFormField(
              controller: _locationController,
              decoration: InputDecoration(
                labelText: 'Location',
                prefixIcon: const Icon(Icons.location_on),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                hintText: 'City, Country',
              ),
            ),
            const SizedBox(height: 16),
            
            // Birthday Field
            InkWell(
              onTap: _selectBirthday,
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.cake, color: Colors.grey),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Birthday',
                            style: TextStyle(fontSize: 12, color: Colors.grey),
                          ),
                          Text(
                            _selectedBirthday != null
                                ? '${_selectedBirthday!.day}/${_selectedBirthday!.month}/${_selectedBirthday!.year}'
                                : 'Select your birthday',
                            style: TextStyle(
                              fontSize: 16,
                              color: _selectedBirthday != null ? Colors.black : Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right, color: Colors.grey),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 32),
            
            // Privacy Settings
            _buildSectionHeader('Privacy Settings'),
            _buildPrivacyOption(
              'Show birthday to others',
              'Let other users see your birthday',
              _showBirthdayToOthers,
              (value) {
                setState(() {
                  _showBirthdayToOthers = value;
                });
              },
            ),
            _buildPrivacyOption(
              'Show location to others',
              'Display your location on your profile',
              _showLocationToOthers,
              (value) {
                setState(() {
                  _showLocationToOthers = value;
                });
              },
            ),
            const SizedBox(height: 24),
            
            // Travel Preferences
            _buildSectionHeader('Travel Preferences'),
            _buildOptionTile(
              icon: Icons.explore,
              title: 'Travel Style',
              subtitle: context.watch<AppProvider>().currentUser?.travelStyle?.displayName ?? 'Choose your travel style',
              onTap: _selectTravelStyle,
            ),
            _buildOptionTile(
              icon: Icons.language,
              title: 'Languages',
              subtitle: _selectedLanguages.isEmpty 
                  ? 'Languages you speak'
                  : _selectedLanguages.join(', '),
              onTap: _selectLanguages,
            ),
            _buildOptionTile(
              icon: Icons.explore,
              title: 'Travel Interests',
              subtitle: _selectedInterests.isEmpty 
                  ? 'What you love about traveling'
                  : _selectedInterests.join(', '),
              onTap: _selectInterests,
            ),
            _buildOptionTile(
              icon: Icons.attach_money,
              title: 'Budget Preferences',
              subtitle: _selectedBudgets.isEmpty 
                  ? 'Your typical travel budgets'
                  : _selectedBudgets.join(', '),
              onTap: _selectBudget,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOptionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(icon, color: const Color(0xFF3797EF)),
        title: Text(title),
        subtitle: Text(
          subtitle,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }

  ImageProvider? _getProfileImage() {
    if (_selectedImage != null) {
      return FileImage(_selectedImage!);
    } else if (_currentAvatarUrl != null && _currentAvatarUrl!.isNotEmpty && !_currentAvatarUrl!.contains('unsplash')) {
      return NetworkImage(_currentAvatarUrl!);
    }
    return null;
  }

  void _changeProfilePicture() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Take Photo'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Choose from Gallery'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.gallery);
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete),
              title: const Text('Remove Photo'),
              onTap: () {
                Navigator.pop(context);
                _removePhoto();
              },
            ),
          ],
        ),
      ),
    );
  }
  
  Future<void> _pickImage(ImageSource source) async {
    if (_isPickingImage) {
      print('⚠️ [EDIT] Image picker already active, ignoring request');
      return;
    }
    
    setState(() => _isPickingImage = true);
    
    try {
      print('📸 [EDIT] Picking image from ${source.name}');
      final XFile? image = await _picker.pickImage(
        source: source,
        maxWidth: 512,
        maxHeight: 512,
        imageQuality: 80,
      );
      
      if (image != null) {
        setState(() {
          _selectedImage = File(image.path);
        });
        print('✅ [EDIT] Image selected: ${image.path}');
      } else {
        print('❌ [EDIT] No image selected');
      }
    } catch (e) {
      print('❌ [EDIT] Error picking image: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error selecting image: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isPickingImage = false);
      }
    }
  }
  
  void _removePhoto() {
    setState(() {
      _selectedImage = null;
      _currentAvatarUrl = null;
    });
    print('🗑️ [EDIT] Photo removed');
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildPrivacyOption(
    String title,
    String subtitle,
    bool value,
    Function(bool) onChanged,
  ) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: SwitchListTile(
        title: Text(title),
        subtitle: Text(subtitle),
        value: value,
        onChanged: onChanged,
        activeColor: const Color(0xFF3797EF),
      ),
    );
  }

  Future<void> _selectBirthday() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedBirthday ?? DateTime(2000),
      firstDate: DateTime(1900),
      lastDate: DateTime.now(),
    );
    if (picked != null) {
      setState(() {
        _selectedBirthday = picked;
      });
    }
  }

  Set<String> _selectedLanguages = {};
  
  void _selectLanguages() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.9,
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
              const Text(
                'Languages',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      'English', 'Spanish', 'French', 'German', 'Italian',
                      'Portuguese', 'Japanese', 'Chinese', 'Korean', 'Arabic',
                      'Russian', 'Hindi', 'Dutch', 'Swedish', 'Norwegian'
                    ].map((lang) => FilterChip(
                      label: Text(lang),
                      selected: _selectedLanguages.contains(lang),
                      onSelected: (selected) {
                        setState(() {
                          if (selected) {
                            _selectedLanguages.add(lang);
                          } else {
                            _selectedLanguages.remove(lang);
                          }
                        });
                      },
                    )).toList(),
                  ),
                ),
              ),
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Done'),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Set<String> _selectedInterests = {};
  
  void _selectInterests() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.9,
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
              const Text(
                'Travel Interests',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      'Adventure', 'Culture', 'Food', 'Nature', 'History',
                      'Photography', 'Beach', 'Mountains', 'Cities', 'Wildlife',
                      'Art', 'Music', 'Sports', 'Nightlife', 'Shopping',
                      'Architecture', 'Museums', 'Festivals', 'Local Life'
                    ].map((interest) => FilterChip(
                      label: Text(interest),
                      selected: _selectedInterests.contains(interest),
                      onSelected: (selected) {
                        setState(() {
                          if (selected) {
                            _selectedInterests.add(interest);
                          } else {
                            _selectedInterests.remove(interest);
                          }
                        });
                      },
                    )).toList(),
                  ),
                ),
              ),
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Done'),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _selectTravelStyle() {
    showModalBottomSheet(
      context: context,
      useSafeArea: true,
      builder: (context) => Container(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
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
            const Text(
              'Travel Style',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ...TravelStyle.values.map((style) {
              final isSelected = context.watch<AppProvider>().currentUser?.travelStyle == style;
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: Text(style.emoji, style: const TextStyle(fontSize: 24)),
                  title: Text(style.displayName),
                  subtitle: Text(style.description),
                  trailing: isSelected ? const Icon(Icons.check, color: Colors.green) : null,
                  onTap: () async {
                    final appProvider = context.read<AppProvider>();
                    await appProvider.updateTravelStyle(style);
                    if (mounted) Navigator.pop(context);
                  },
                ),
              );
            }).toList(),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Set<String> _selectedBudgets = {};
  
  void _selectBudget() {
    showModalBottomSheet(
      context: context,
      useSafeArea: true,
      builder: (context) => Container(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
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
            const Text(
              'Budget Preferences',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                'Budget (Under \$50/day)',
                'Mid-range (\$50-150/day)',
                'Luxury (\$150+/day)',
                'Backpacking',
                'Business Travel',
                'Family Trips'
              ].map((budget) => FilterChip(
                label: Text(budget),
                selected: _selectedBudgets.contains(budget),
                onSelected: (selected) {
                  setState(() {
                    if (selected) {
                      _selectedBudgets.add(budget);
                    } else {
                      _selectedBudgets.remove(budget);
                    }
                  });
                },
              )).toList(),
            ),
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Done'),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      String? profilePictureData;
      
      // Convert selected image to base64 if available
      if (_selectedImage != null) {
        print('📸 [EDIT] Converting image to base64...');
        final bytes = await _selectedImage!.readAsBytes();
        profilePictureData = 'data:image/jpeg;base64,${base64Encode(bytes)}';
        print('✅ [EDIT] Image converted to base64 (${bytes.length} bytes)');
      }
      
      final appProvider = context.read<AppProvider>();
      final success = await appProvider.updateUserProfile(
        username: _usernameController.text.trim(),
        bio: _bioController.text.trim(),
        website: _websiteController.text.trim(),
        location: _locationController.text.trim(),
        birthday: _selectedBirthday?.toIso8601String(),
        profilePicture: profilePictureData,
        languages: _selectedLanguages.toList(),
        interests: _selectedInterests.toList(),
        budgetPreferences: _selectedBudgets.toList(),
        showBirthdayToOthers: _showBirthdayToOthers,
        showLocationToOthers: _showLocationToOthers,
      );

      if (success && mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Profile updated successfully!'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        throw Exception('Failed to update profile');
      }
    } catch (e) {
      print('❌ [EDIT] Error saving profile: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }
}