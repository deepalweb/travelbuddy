import 'dart:io';
import 'dart:typed_data';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;

class ImageOptimizationService {
  static final ImageOptimizationService _instance = ImageOptimizationService._internal();
  factory ImageOptimizationService() => _instance;
  ImageOptimizationService._internal();

  // Compress image for upload
  Future<File?> compressImage(
    File imageFile, {
    int maxWidth = 1920,
    int maxHeight = 1080,
    int quality = 85,
  }) async {
    try {
      final dir = await getTemporaryDirectory();
      final targetPath = path.join(
        dir.path,
        'compressed_${DateTime.now().millisecondsSinceEpoch}.jpg',
      );

      final result = await FlutterImageCompress.compressAndGetFile(
        imageFile.absolute.path,
        targetPath,
        quality: quality,
        minWidth: maxWidth,
        minHeight: maxHeight,
        format: CompressFormat.jpeg,
      );

      if (result == null) {
        print('❌ Image compression failed');
        return imageFile;
      }

      final originalSize = await imageFile.length();
      final compressedSize = await result.length();
      final savedPercent = ((originalSize - compressedSize) / originalSize * 100).toStringAsFixed(1);
      
      print('✅ Image compressed: ${_formatBytes(originalSize)} → ${_formatBytes(compressedSize)} (saved $savedPercent%)');
      
      return File(result.path);
    } catch (e) {
      print('❌ Error compressing image: $e');
      return imageFile;
    }
  }

  // Compress multiple images
  Future<List<File>> compressImages(List<File> images) async {
    final compressed = <File>[];
    for (final image in images) {
      final result = await compressImage(image);
      if (result != null) {
        compressed.add(result);
      }
    }
    return compressed;
  }

  // Compress image to specific size (for thumbnails)
  Future<File?> compressToThumbnail(File imageFile) async {
    return await compressImage(
      imageFile,
      maxWidth: 400,
      maxHeight: 400,
      quality: 70,
    );
  }

  // Get compressed image as bytes
  Future<Uint8List?> compressImageToBytes(
    File imageFile, {
    int quality = 85,
  }) async {
    try {
      final result = await FlutterImageCompress.compressWithFile(
        imageFile.absolute.path,
        quality: quality,
        format: CompressFormat.jpeg,
      );
      return result;
    } catch (e) {
      print('❌ Error compressing image to bytes: $e');
      return null;
    }
  }

  String _formatBytes(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  // Clean up temporary compressed files
  Future<void> cleanupTempFiles() async {
    try {
      final dir = await getTemporaryDirectory();
      final files = dir.listSync();
      for (final file in files) {
        if (file.path.contains('compressed_')) {
          await file.delete();
        }
      }
      print('✅ Cleaned up temporary compressed images');
    } catch (e) {
      print('❌ Error cleaning temp files: $e');
    }
  }
}
