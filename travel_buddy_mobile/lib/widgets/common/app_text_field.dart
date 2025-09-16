import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

/// A custom text field widget that provides consistent styling across the app.
class AppTextField extends StatelessWidget {
  final String label;
  final String? hint;
  final TextEditingController? controller;
  final String? Function(String?)? validator;
  final bool obscureText;
  final TextInputType? keyboardType;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final int? maxLines;
  final int? maxLength;
  final VoidCallback? onTap;
  final void Function(String)? onChanged;
  final bool readOnly;
  final String? initialValue;
  final bool autofocus;
  final TextCapitalization textCapitalization;
  final bool enabled;

  const AppTextField({
    super.key,
    required this.label,
    this.hint,
    this.controller,
    this.validator,
    this.obscureText = false,
    this.keyboardType,
    this.prefixIcon,
    this.suffixIcon,
    this.maxLines = 1,
    this.maxLength,
    this.onTap,
    this.onChanged,
    this.readOnly = false,
    this.initialValue,
    this.autofocus = false,
    this.textCapitalization = TextCapitalization.none,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      initialValue: controller == null ? initialValue : null,
      validator: validator,
      obscureText: obscureText,
      keyboardType: keyboardType,
      maxLines: maxLines,
      maxLength: maxLength,
      onTap: onTap,
      onChanged: onChanged,
      readOnly: readOnly,
      autofocus: autofocus,
      enabled: enabled,
      textCapitalization: textCapitalization,
      style: AppTheme.bodyMedium,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: prefixIcon,
        suffixIcon: suffixIcon,
        filled: true,
        fillColor: enabled ? Colors.white : Colors.grey[100],
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppTheme.radiusM),
        ),
        contentPadding: AppTheme.paddingM,
      ),
    );
  }
}