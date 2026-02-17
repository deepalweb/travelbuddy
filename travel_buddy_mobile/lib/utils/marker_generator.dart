import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class MarkerGenerator {
  static Future<BitmapDescriptor> createNumberedMarker(
    int number, {
    Color backgroundColor = Colors.blue,
    Color textColor = Colors.white,
    bool isStart = false,
    bool isEnd = false,
  }) async {
    final pictureRecorder = ui.PictureRecorder();
    final canvas = Canvas(pictureRecorder);
    final size = 120.0;

    // Choose color based on type
    Color bgColor = backgroundColor;
    if (isStart) bgColor = Colors.green;
    if (isEnd) bgColor = Colors.red;

    // Draw circle
    final paint = Paint()..color = bgColor;
    canvas.drawCircle(Offset(size / 2, size / 2), size / 2, paint);

    // Draw white border
    final borderPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 8;
    canvas.drawCircle(Offset(size / 2, size / 2), size / 2 - 4, borderPaint);

    // Draw text
    final textPainter = TextPainter(
      textDirection: TextDirection.ltr,
      textAlign: TextAlign.center,
    );

    textPainter.text = TextSpan(
      text: isStart ? '📍' : (isEnd ? '🏁' : number.toString()),
      style: TextStyle(
        fontSize: isStart || isEnd ? 50 : 60,
        fontWeight: FontWeight.bold,
        color: textColor,
      ),
    );

    textPainter.layout();
    textPainter.paint(
      canvas,
      Offset(
        (size - textPainter.width) / 2,
        (size - textPainter.height) / 2,
      ),
    );

    // Convert to image
    final picture = pictureRecorder.endRecording();
    final image = await picture.toImage(size.toInt(), size.toInt());
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);

    return BitmapDescriptor.fromBytes(bytes!.buffer.asUint8List());
  }
}
