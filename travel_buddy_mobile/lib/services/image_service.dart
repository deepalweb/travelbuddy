import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import 'dart:convert';
import '../config/environment.dart';

class ImageService {
  static final ImageService _instance = ImageService._internal();
  factory ImageService() => _instance;
  ImageService._internal();

  final ImagePicker _picker = ImagePicker();
  Dio? _dio;
  bool _isPickingImage = false;

  void initialize() {
    _dio ??= Dio(BaseOptions(
      baseUrl: Environment.backendUrl,
      connectTimeout: const Duration(seconds: 60),
      receiveTimeout: const Duration(seconds: 60),
    ));
  }

  Future<List<XFile>> pickImages({int maxImages = 5}) async {
    try {
      final images = await _picker.pickMultiImage(
        maxWidth: 1920,
        maxHeight: 1080,
        imageQuality: 85,
      );
      
      if (images.length > maxImages) {
        return images.take(maxImages).toList();
      }
      
      return images;
    } catch (e) {
      print('Error picking images: $e');
      return [];
    }
  }

  Future<XFile?> pickSingleImage({ImageSource source = ImageSource.gallery}) async {
    if (_isPickingImage) {
      print('⚠️ Image picker already active, skipping');
      return null;
    }
    
    _isPickingImage = true;
    try {
      final image = await _picker.pickImage(
        source: source,
        maxWidth: 1920,
        maxHeight: 1080,
        imageQuality: 85,
        requestFullMetadata: false,
      );
      
      if (image != null) {
        print('✅ Image picked successfully: ${image.path}');
        final bytes = await image.readAsBytes();
        print('📊 Image size: ${bytes.length} bytes');
      }
      
      return image;
    } catch (e) {
      print('❌ Error picking image: $e');
      return null;
    } finally {
      _isPickingImage = false;
    }
  }

  Future<List<String>> uploadImages(List<XFile> images) async {
    final uploadedUrls = <String>[];
    
    for (final image in images) {
      // Convert image to base64 for database storage
      final bytes = await image.readAsBytes();
      final base64String = 'data:image/jpeg;base64,${base64Encode(bytes)}';
      
      uploadedUrls.add(base64String);
      print('✅ Image converted to base64 for database storage');
    }
    
    return uploadedUrls;
  }
  


  Future<String?> uploadSingleImage(XFile image) async {
    final urls = await uploadImages([image]);
    return urls.isNotEmpty ? urls.first : null;
  }
}