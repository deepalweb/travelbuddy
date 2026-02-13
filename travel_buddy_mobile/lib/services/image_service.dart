import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'dart:io';
import 'dart:convert';
import 'image_optimization_service.dart';
import '../config/environment.dart';

class ImageService {
  final ImageOptimizationService _optimizer = ImageOptimizationService();
  
  static Future<List<String>> getPlaceImages(String placeName, String placeAddress) async {
    final images = <String>[];
    
    try {
      // Clean place name for search
      final cleanName = placeName.toLowerCase().replaceAll(RegExp(r'[^\w\s]'), '');
      final searchTerms = [cleanName, 'landmark', 'travel', 'architecture'];
      
      // Unsplash Source API (free, no key required)
      for (int i = 0; i < 3; i++) {
        final term = searchTerms[i % searchTerms.length];
        images.add('https://source.unsplash.com/800x600/?${Uri.encodeComponent(term)}');
      }
      
      // Picsum with deterministic seeds
      final placeHash = placeName.hashCode.abs();
      final addressHash = placeAddress.hashCode.abs();
      
      images.addAll([
        'https://picsum.photos/seed/$placeHash/800/600',
        'https://picsum.photos/seed/$addressHash/800/600',
        'https://picsum.photos/seed/${placeHash + 100}/800/600',
      ]);
      
      // Try Pexels API if available (requires API key)
      await _tryPexelsImages(cleanName, images);
      
    } catch (e) {
      print('Error loading images: $e');
    }
    
    return images;
  }
  
  static Future<void> _tryPexelsImages(String query, List<String> images) async {
    try {
      // This would require a Pexels API key
      // For now, we'll skip this to avoid API key requirements
      return;
    } catch (e) {
      // Silently fail - fallback images will be used
    }
  }
  
  static List<String> getFallbackImages(String placeName) {
    final hash = placeName.hashCode.abs();
    return [
      'https://picsum.photos/seed/$hash/800/600',
      'https://picsum.photos/seed/${hash + 1}/800/600',
      'https://picsum.photos/seed/${hash + 2}/800/600',
    ];
  }
  
  // Instance methods for compatibility
  final ImagePicker _picker = ImagePicker();
  
  void initialize() {
    // Initialize image service if needed
  }
  
  Future<List<XFile>> pickImages({int maxImages = 5}) async {
    try {
      final List<XFile> images = await _picker.pickMultiImage(
        maxWidth: 1920,
        maxHeight: 1080,
        imageQuality: 85,
      );
      
      return images.take(maxImages).toList();
    } catch (e) {
      print('Error picking images: $e');
      return [];
    }
  }
  
  Future<List<String>> uploadImages(List<XFile> images) async {
    final imageUrls = <String>[];
    
    try {
      final uri = Uri.parse('${Environment.backendUrl}/api/images/upload-multiple');
      print('📤 Uploading to: $uri');
      
      var request = http.MultipartRequest('POST', uri);
      
      for (final image in images) {
        final imageFile = File(image.path);
        final compressed = await _optimizer.compressImage(imageFile);
        
        if (compressed != null) {
          request.files.add(
            await http.MultipartFile.fromPath(
              'images',
              compressed.path,
              filename: 'post_${DateTime.now().millisecondsSinceEpoch}_${imageUrls.length}.jpg',
            ),
          );
        }
      }
      
      print('📦 Sending ${request.files.length} files');
      final response = await request.send();
      print('📡 Response status: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final responseData = await response.stream.bytesToString();
        print('📥 Response data: $responseData');
        final jsonData = json.decode(responseData);
        imageUrls.addAll(List<String>.from(jsonData['urls']));
        print('✅ Images uploaded: $imageUrls');
      } else {
        final errorData = await response.stream.bytesToString();
        print('❌ Upload failed: ${response.statusCode}');
        print('❌ Error response: $errorData');
      }
    } catch (e) {
      print('❌ Upload error: $e');
      print('❌ Stack trace: ${StackTrace.current}');
    }
    
    return imageUrls;
  }
}