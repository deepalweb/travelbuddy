import 'package:flutter/material.dart';

/// A widget that shows a loading overlay with a customizable spinner and message.
class LoadingOverlay extends StatelessWidget {
  final bool isLoading;
  final Widget child;
  final String? message;
  final Color? barrierColor;
  final Color? spinnerColor;
  final double opacity;

  const LoadingOverlay({
    super.key,
    required this.isLoading,
    required this.child,
    this.message,
    this.barrierColor,
    this.spinnerColor,
    this.opacity = 0.5,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        child,
        if (isLoading)
          Container(
            color: (barrierColor ?? Colors.black).withOpacity(opacity),
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(
                    color: spinnerColor ?? Theme.of(context).primaryColor,
                  ),
                  if (message != null) ...[
                    const SizedBox(height: 16),
                    Text(
                      message!,
                      style: TextStyle(
                        color: spinnerColor ?? Theme.of(context).primaryColor,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
      ],
    );
  }
}

/// A simpler loading indicator widget for buttons and small areas.
class LoadingSpinner extends StatelessWidget {
  final double size;
  final Color? color;
  final double strokeWidth;

  const LoadingSpinner({
    super.key,
    this.size = 24.0,
    this.color,
    this.strokeWidth = 2.0,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: size,
      width: size,
      child: CircularProgressIndicator(
        strokeWidth: strokeWidth,
        color: color ?? Theme.of(context).primaryColor,
      ),
    );
  }
}