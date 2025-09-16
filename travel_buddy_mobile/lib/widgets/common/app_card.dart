import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

/// A custom card widget that provides consistent styling across the app.
class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final Color? backgroundColor;
  final VoidCallback? onTap;
  final double? elevation;
  final BorderRadius? borderRadius;
  final Color? shadowColor;
  final Border? border;

  const AppCard({
    super.key,
    required this.child,
    this.padding,
    this.backgroundColor,
    this.onTap,
    this.elevation,
    this.borderRadius,
    this.shadowColor,
    this.border,
  });

  @override
  Widget build(BuildContext context) {
    final card = Container(
      decoration: BoxDecoration(
        color: backgroundColor ?? AppTheme.surfaceColor,
        borderRadius: borderRadius ?? BorderRadius.circular(AppTheme.radiusM),
        boxShadow: elevation == 0
            ? null
            : [
                BoxShadow(
                  color: (shadowColor ?? Colors.black).withOpacity(0.1),
                  blurRadius: elevation ?? 4,
                  offset: const Offset(0, 2),
                ),
              ],
        border: border,
      ),
      child: Padding(
        padding: padding ?? AppTheme.paddingM,
        child: child,
      ),
    );

    if (onTap != null) {
      return Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: borderRadius ?? BorderRadius.circular(AppTheme.radiusM),
          child: card,
        ),
      );
    }

    return card;
  }
}