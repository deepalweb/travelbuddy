import 'dart:io';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as path;

class ImageCompressor {
  static Future<File?> compressImage(File file, {int quality = 70, int maxWidth = 1920}) async {
    try {
      final dir = await getTemporaryDirectory();
      final targetPath = path.join(dir.path, '${DateTime.now().millisecondsSinceEpoch}_compressed.jpg');
      
      final result = await FlutterImageCompress.compressAndGetFile(
        file.absolute.path,
        targetPath,
        quality: quality,
        minWidth: maxWidth,
        format: CompressFormat.jpeg,
      );
      
      if (result == null) return null;
      
      final originalSize = await file.length();
      final compressedSize = await result.length();
      
      print('📦 Image compressed: ${(originalSize / 1024).toStringAsFixed(1)}KB → ${(compressedSize / 1024).toStringAsFixed(1)}KB');
      
      return File(result.path);
    } catch (e) {
      print('❌ Compression failed: $e');
      return file;
    }
  }
  
  static Future<List<File>> compressMultiple(List<File> files) async {
    final compressed = <File>[];
    for (final file in files) {
      final result = await compressImage(file);
      if (result != null) compressed.add(result);
    }
    return compressed;
  }
}
