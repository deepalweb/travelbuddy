import 'package:flutter/material.dart';

class AppTheme {
  // Colors
  static const primary = Color(0xFF2196F3);
  static const secondary = Color(0xFF03DAC6);
  static const error = Color(0xFFB00020);
  static const success = Color(0xFF4CAF50);
  static const warning = Color(0xFFFF9800);
  
  // Text Colors
  static const textPrimary = Color(0xFF212121);
  static const textSecondary = Color(0xFF757575);
  static const textHint = Color(0xFFBDBDBD);
  
  // Background Colors
  static const background = Color(0xFFFAFAFA);
  static const surface = Colors.white;
  
  // Spacing
  static const double spacingXs = 4.0;
  static const double spacingSm = 8.0;
  static const double spacingMd = 16.0;
  static const double spacingLg = 24.0;
  static const double spacingXl = 32.0;
  
  // Border Radius
  static const double radiusSm = 8.0;
  static const double radiusMd = 12.0;
  static const double radiusLg = 16.0;
  static const double radiusXl = 24.0;
  
  // Padding
  static const EdgeInsets paddingL = EdgeInsets.all(24.0);
  
  // Text Styles (static getters for compatibility)
  static const TextStyle titleLarge = TextStyle(fontSize: 32, fontWeight: FontWeight.bold);
  static const TextStyle bodyMedium = TextStyle(fontSize: 14);
  static const TextStyle bodySmall = TextStyle(fontSize: 12);
  
  // Colors (aliases for compatibility)
  static const Color primaryColor = primary;
  static const Color secondaryTextColor = textSecondary;
  
  // Theme Data
  static ThemeData get lightTheme {
    return ThemeData(
      primaryColor: primary,
      scaffoldBackgroundColor: background,
      colorScheme: const ColorScheme.light(
        primary: primary,
        secondary: secondary,
        error: error,
        surface: surface,
      ),
      textTheme: const TextTheme(
        displayLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: textPrimary),
        displayMedium: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: textPrimary),
        displaySmall: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: textPrimary),
        headlineMedium: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: textPrimary),
        titleLarge: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: textPrimary),
        titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: textPrimary),
        bodyLarge: TextStyle(fontSize: 16, color: textPrimary),
        bodyMedium: TextStyle(fontSize: 14, color: textPrimary),
        bodySmall: TextStyle(fontSize: 12, color: textSecondary),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusMd)),
          elevation: 2,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: primary,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusMd)),
          side: const BorderSide(color: primary),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: primary,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: BorderSide(color: Colors.grey[300]!),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: BorderSide(color: Colors.grey[300]!),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: primary, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
      cardTheme: CardThemeData(
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusMd)),
        margin: const EdgeInsets.all(spacingSm),
      ),
    );
  }
}
