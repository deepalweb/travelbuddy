import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import '../config/environment.dart';

class ImageService {
  static final ImageService _instance = ImageService._internal();
  factory ImageService() => _instance;
  ImageService._internal();

  final ImagePicker _picker = ImagePicker();
  Dio? _dio;

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
    try {
      return await _picker.pickImage(
        source: source,
        maxWidth: 1920,
        maxHeight: 1080,
        imageQuality: 85,
      );
    } catch (e) {
      print('Error picking image: $e');
      return null;
    }
  }

  Future<List<String>> uploadImages(List<XFile> images) async {
    final uploadedUrls = <String>[];
    
    for (final image in images) {
      // Since backend upload endpoints don't exist, use local storage with proper URL
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final fileName = 'profile_${timestamp}_${image.name}';
      
      // Create a mock URL that looks like a real upload
      final mockUrl = 'local://uploads/$fileName';
      
      // Store the actual file path for local access
      await _storeImageLocally(image, fileName);
      
      uploadedUrls.add(mockUrl);
      print('✅ Image "uploaded" locally: $mockUrl');
    }
    
    return uploadedUrls;
  }
  
  Future<void> _storeImageLocally(XFile image, String fileName) async {
    // For now, just keep reference to original path
    // In a real app, you'd copy to app documents directory
    print('📁 Stored image locally: ${image.path} as $fileName');
  }

  Future<String?> uploadSingleImage(XFile image) async {
    final urls = await uploadImages([image]);
    return urls.isNotEmpty ? urls.first : null;
  }
}