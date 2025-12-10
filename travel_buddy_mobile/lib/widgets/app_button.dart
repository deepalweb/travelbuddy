import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

enum ButtonVariant { primary, secondary, outline, text }
enum ButtonSize { small, medium, large }

class AppButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final ButtonVariant variant;
  final ButtonSize size;
  final IconData? icon;
  final bool isLoading;
  final bool fullWidth;

  const AppButton({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = ButtonVariant.primary,
    this.size = ButtonSize.medium,
    this.icon,
    this.isLoading = false,
    this.fullWidth = false,
  });

  @override
  Widget build(BuildContext context) {
    final padding = _getPadding();
    final fontSize = _getFontSize();
    
    Widget button;
    
    if (variant == ButtonVariant.outline) {
      button = OutlinedButton(
        onPressed: isLoading ? null : onPressed,
        style: OutlinedButton.styleFrom(padding: padding),
        child: _buildContent(fontSize),
      );
    } else if (variant == ButtonVariant.text) {
      button = TextButton(
        onPressed: isLoading ? null : onPressed,
        style: TextButton.styleFrom(padding: padding),
        child: _buildContent(fontSize),
      );
    } else {
      button = ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          padding: padding,
          backgroundColor: variant == ButtonVariant.secondary ? AppTheme.secondary : null,
        ),
        child: _buildContent(fontSize),
      );
    }
    
    return fullWidth ? SizedBox(width: double.infinity, child: button) : button;
  }

  Widget _buildContent(double fontSize) {
    if (isLoading) {
      return SizedBox(
        height: fontSize + 4,
        width: fontSize + 4,
        child: const CircularProgressIndicator(strokeWidth: 2),
      );
    }
    
    if (icon != null) {
      return Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: fontSize + 2),
          SizedBox(width: AppTheme.spacingSm),
          Text(label, style: TextStyle(fontSize: fontSize)),
        ],
      );
    }
    
    return Text(label, style: TextStyle(fontSize: fontSize));
  }

  EdgeInsets _getPadding() {
    switch (size) {
      case ButtonSize.small:
        return const EdgeInsets.symmetric(horizontal: 16, vertical: 8);
      case ButtonSize.large:
        return const EdgeInsets.symmetric(horizontal: 32, vertical: 16);
      default:
        return const EdgeInsets.symmetric(horizontal: 24, vertical: 12);
    }
  }

  double _getFontSize() {
    switch (size) {
      case ButtonSize.small:
        return 12;
      case ButtonSize.large:
        return 16;
      default:
        return 14;
    }
  }
}
