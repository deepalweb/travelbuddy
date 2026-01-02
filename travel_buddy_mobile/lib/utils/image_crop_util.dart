import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';

class ImageCropUtil {
  static Future<File?> pickAndCompressImage({
    required BuildContext context,
    required ImageSource source,
    int maxWidth = 512,
    int maxHeight = 512,
    int quality = 80,
  }) async {
    try {
      final picker = ImagePicker();
      final pickedFile = await picker.pickImage(source: source);
      
      if (pickedFile == null) return null;
      
      final compressedBytes = await FlutterImageCompress.compressWithFile(
        pickedFile.path,
        minWidth: maxWidth,
        minHeight: maxHeight,
        quality: quality,
      );
      
      if (compressedBytes == null) return File(pickedFile.path);
      
      final tempFile = File('${pickedFile.path}_compressed.jpg');
      await tempFile.writeAsBytes(compressedBytes);
      
      print('✅ Image processed: ${(compressedBytes.length / 1024).toStringAsFixed(1)}KB');
      
      return tempFile;
    } catch (e) {
      print('❌ Image processing error: $e');
      return null;
    }
  }
  
  static Future<Uint8List?> compressImageBytes(
    Uint8List bytes, {
    int maxWidth = 512,
    int maxHeight = 512,
    int quality = 80,
  }) async {
    try {
      return await FlutterImageCompress.compressWithList(
        bytes,
        minWidth: maxWidth,
        minHeight: maxHeight,
        quality: quality,
      );
    } catch (e) {
      print('❌ Compress error: $e');
      return null;
    }
  }
}
