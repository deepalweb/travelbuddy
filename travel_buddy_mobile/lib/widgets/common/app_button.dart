import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

/// A custom button widget that provides consistent styling across the app.
class AppButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final ButtonStyle? style;
  final bool isOutlined;
  final Widget? icon;
  final Color? textColor;
  final Color? backgroundColor;

  const AppButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.style,
    this.isOutlined = false,
    this.icon,
    this.textColor,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    final buttonStyle = isOutlined
        ? OutlinedButton.styleFrom(
            foregroundColor: textColor ?? AppTheme.primaryColor,
            padding: AppTheme.paddingM,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppTheme.radiusM),
            ),
          ).merge(style)
        : ElevatedButton.styleFrom(
            backgroundColor: backgroundColor ?? AppTheme.primaryColor,
            foregroundColor: textColor ?? Colors.white,
            padding: AppTheme.paddingM,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppTheme.radiusM),
            ),
          ).merge(style);

    final child = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (icon != null) ...[
          icon!,
          SizedBox(width: AppTheme.spacingS),
        ],
        Text(text),
      ],
    );

    if (isOutlined) {
      return OutlinedButton(
        onPressed: isLoading ? null : onPressed,
        style: buttonStyle,
        child: isLoading
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(),
              )
            : child,
      );
    }

    return ElevatedButton(
      onPressed: isLoading ? null : onPressed,
      style: buttonStyle,
      child: isLoading
          ? const SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(),
            )
          : child,
    );
  }
}