import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/user_profile_provider.dart';
import '../models/user_profile.dart';
import '../models/travel_enums.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

class EditProfileView extends StatefulWidget {
  final UserProfile profile;

  const EditProfileView({Key? key, required this.profile}) : super(key: key);

  @override
  State<EditProfileView> createState() => _EditProfileViewState();
}

class _EditProfileViewState extends State<EditProfileView> {
  late TextEditingController _bioController;
  late TextEditingController _locationController;
  late List<TravelInterest> _selectedInterests;
  late TravelerType _selectedTravelerType;
  File? _newProfileImage;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _bioController = TextEditingController(text: widget.profile.bio);
    _locationController = TextEditingController(text: widget.profile.currentLocation);
    _selectedInterests = List.from(widget.profile.travelInterests);
    _selectedTravelerType = widget.profile.travelerType;
  }

  @override
  void dispose() {
    _bioController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(source: ImageSource.gallery);
    
    if (image != null) {
      setState(() {
        _newProfileImage = File(image.path);
      });
    }
  }

  Future<void> _saveProfile() async {
    if (_isSaving) return;

    setState(() {
      _isSaving = true;
    });

    try {
      final provider = context.read<UserProfileProvider>();
      
      // TODO: Upload image if _newProfileImage is not null
      String? newProfileImageUrl;
      if (_newProfileImage != null) {
        // Implement image upload
      }

      await provider.updateProfile(
        bio: _bioController.text,
        profileImage: newProfileImageUrl,
        travelInterests: _selectedInterests,
        travelerType: _selectedTravelerType,
        currentLocation: _locationController.text,
      );

      if (mounted) {
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update profile: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Profile'),
        actions: [
          TextButton(
            onPressed: _isSaving ? null : _saveProfile,
            child: _isSaving
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Save'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildProfileImageSection(),
          const SizedBox(height: 24),
          _buildBioSection(),
          const SizedBox(height: 24),
          _buildLocationSection(),
          const SizedBox(height: 24),
          _buildTravelInterestsSection(),
          const SizedBox(height: 24),
          _buildTravelerTypeSection(),
        ],
      ),
    );
  }

  Widget _buildProfileImageSection() {
    return Center(
      child: Stack(
        children: [
          CircleAvatar(
            radius: 50,
            backgroundImage: _newProfileImage != null
                ? FileImage(_newProfileImage!)
                : (widget.profile.profileImage.isNotEmpty
                    ? NetworkImage(widget.profile.profileImage)
                    : null) as ImageProvider?,
            child: widget.profile.profileImage.isEmpty && _newProfileImage == null
                ? const Icon(Icons.person, size: 50)
                : null,
          ),
          Positioned(
            bottom: 0,
            right: 0,
            child: Container(
              decoration: BoxDecoration(
                color: Theme.of(context).primaryColor,
                shape: BoxShape.circle,
              ),
              child: IconButton(
                icon: const Icon(Icons.camera_alt, color: Colors.white),
                onPressed: _pickImage,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBioSection() {
    return TextField(
      controller: _bioController,
      maxLines: 3,
      decoration: const InputDecoration(
        labelText: 'Bio',
        hintText: 'Tell us about yourself...',
        border: OutlineInputBorder(),
      ),
    );
  }

  Widget _buildLocationSection() {
    return TextField(
      controller: _locationController,
      decoration: const InputDecoration(
        labelText: 'Current Location',
        hintText: 'Where are you now?',
        border: OutlineInputBorder(),
        prefixIcon: Icon(Icons.location_on),
      ),
    );
  }

  Widget _buildTravelInterestsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Travel Interests',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: TravelInterest.values.map((interest) {
            final isSelected = _selectedInterests.contains(interest);
            return FilterChip(
              label: Text(interest.toString().split('.').last),
              selected: isSelected,
              onSelected: (selected) {
                setState(() {
                  if (selected) {
                    _selectedInterests.add(interest);
                  } else {
                    _selectedInterests.remove(interest);
                  }
                });
              },
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildTravelerTypeSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Traveler Type',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        DropdownButtonFormField<TravelerType>(
          value: _selectedTravelerType,
          decoration: const InputDecoration(
            border: OutlineInputBorder(),
          ),
          items: TravelerType.values.map((type) {
            return DropdownMenuItem(
              value: type,
              child: Text(type.toString().split('.').last),
            );
          }).toList(),
          onChanged: (value) {
            if (value != null) {
              setState(() {
                _selectedTravelerType = value;
              });
            }
          },
        ),
      ],
    );
  }
}
