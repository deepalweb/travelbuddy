import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';

class ProfilePictureUploadScreen extends StatefulWidget {
  const ProfilePictureUploadScreen({super.key});

  @override
  State<ProfilePictureUploadScreen> createState() => _ProfilePictureUploadScreenState();
}

class _ProfilePictureUploadScreenState extends State<ProfilePictureUploadScreen> {
  bool _isUploading = false;
  double _uploadProgress = 0.0;
  String? _errorMessage;
  File? _selectedImage;

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final pickedFile = await picker.pickImage(
        source: source,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 85,
      );

      if (pickedFile != null) {
        setState(() {
          _selectedImage = File(pickedFile.path);
          _errorMessage = null;
        });
      }
    } catch (e) {
      setState(() => _errorMessage = 'Failed to pick image: $e');
    }
  }

  Future<void> _uploadImage() async {
    if (_selectedImage == null) return;

    setState(() {
      _isUploading = true;
      _uploadProgress = 0.0;
      _errorMessage = null;
    });

    try {
      final bytes = await _selectedImage!.readAsBytes();
      final base64Image = 'data:image/jpeg;base64,${base64Encode(bytes)}';

      setState(() => _uploadProgress = 0.5);

      final success = await context.read<AppProvider>().updateUserProfile(
        profilePicture: base64Image,
      );

      setState(() => _uploadProgress = 1.0);

      if (mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Profile picture updated!'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.pop(context);
        } else {
          setState(() {
            _errorMessage = 'Upload failed. Please try again.';
            _isUploading = false;
          });
        }
      }
    } catch (e) {
      print('❌ Upload error: $e');
      setState(() {
        _errorMessage = 'Upload failed: $e';
        _isUploading = false;
      });
    }
  }

  Future<void> _removeImage() async {
    try {
      await context.read<AppProvider>().updateUserProfile(profilePicture: '');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile picture removed')),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      setState(() => _errorMessage = 'Failed to remove: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AppProvider>().currentUser;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile Picture'),
        actions: [
          if (user?.profilePicture != null && user!.profilePicture!.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.delete),
              onPressed: _removeImage,
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Current/Selected Image
            Center(
              child: Stack(
                children: [
                  CircleAvatar(
                    radius: 80,
                    backgroundColor: Colors.grey[300],
                    backgroundImage: _selectedImage != null
                        ? FileImage(_selectedImage!)
                        : (user?.profilePicture != null && user!.profilePicture!.isNotEmpty
                            ? (user.profilePicture!.startsWith('data:image')
                                ? MemoryImage(base64Decode(user.profilePicture!.split(',')[1]))
                                : NetworkImage(user.profilePicture!) as ImageProvider)
                            : null),
                    child: (user?.profilePicture == null || user!.profilePicture!.isEmpty) && _selectedImage == null
                        ? const Icon(Icons.person, size: 80, color: Colors.white)
                        : null,
                  ),
                  if (_isUploading)
                    Positioned.fill(
                      child: CircularProgressIndicator(
                        value: _uploadProgress,
                        strokeWidth: 6,
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Error Message
            if (_errorMessage != null)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.red[50],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: Colors.red),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
                    ),
                  ],
                ),
              ),

            // Action Buttons
            if (!_isUploading) ...[
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => _pickImage(ImageSource.gallery),
                  icon: const Icon(Icons.photo_library),
                  label: const Text('Choose from Gallery'),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => _pickImage(ImageSource.camera),
                  icon: const Icon(Icons.camera_alt),
                  label: const Text('Take Photo'),
                ),
              ),
              if (_selectedImage != null) ...[
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _uploadImage,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue[600],
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Upload Picture'),
                  ),
                ),
              ],
            ],

            if (_isUploading) ...[
              const SizedBox(height: 16),
              Text('Uploading... ${(_uploadProgress * 100).toInt()}%'),
            ],
          ],
        ),
      ),
    );
  }
}
