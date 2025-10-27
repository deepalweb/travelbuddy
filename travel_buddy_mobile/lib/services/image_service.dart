import 'package:image_picker/image_picker.dart';

class ImageService {
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
    
    for (final image in images) {
      try {
        // For demo purposes, return a placeholder URL
        // In production, upload to your image storage service
        final hash = image.path.hashCode.abs();
        final url = 'https://picsum.photos/seed/$hash/800/600';
        imageUrls.add(url);
      } catch (e) {
        print('Error uploading image: $e');
      }
    }
    
    return imageUrls;
  }
}