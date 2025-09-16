import 'package:flutter/material.dart';

/// App-wide theme constants and color schemes.
class AppTheme {
  static const double _smallRadius = 8.0;
  static const double _mediumRadius = 12.0;
  static const double _largeRadius = 16.0;

  static const double _smallSpacing = 8.0;
  static const double _mediumSpacing = 16.0;
  static const double _largeSpacing = 24.0;
  static const double _extraLargeSpacing = 32.0;

  // Primary Colors
  static const Color primaryColor = Color(0xFF1976D2); // Material Blue 700
  static const Color primaryLightColor = Color(0xFF42A5F5); // Material Blue 400
  static const Color primaryDarkColor = Color(0xFF1565C0); // Material Blue 800

  // Accent Colors
  static const Color accentColor = Color(0xFFFFA726); // Material Orange 400
  static const Color accentLightColor = Color(0xFFFFB74D); // Material Orange 300
  static const Color accentDarkColor = Color(0xFFF57C00); // Material Orange 700

  // Semantic Colors
  static const Color successColor = Color(0xFF43A047); // Material Green 600
  static const Color errorColor = Color(0xFFE53935); // Material Red 600
  static const Color warningColor = Color(0xFFFFB300); // Material Amber 600
  static const Color infoColor = Color(0xFF039BE5); // Material Light Blue 600

  // Neutral Colors
  static const Color surfaceColor = Colors.white;
  static const Color backgroundColor = Color(0xFFF5F5F5);
  static const Color dividerColor = Color(0xFFE0E0E0);

  // Text Colors
  static const Color primaryTextColor = Color(0xFF212121);
  static const Color secondaryTextColor = Color(0xFF757575);
  static const Color disabledTextColor = Color(0xFFBDBDBD);

  /// Returns the light theme data for the app.
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.light(
        primary: primaryColor,
        primaryContainer: primaryLightColor,
        secondary: accentColor,
        secondaryContainer: accentLightColor,
        surface: surfaceColor,
        error: errorColor,
      ),
      scaffoldBackgroundColor: backgroundColor,
      appBarTheme: const AppBarTheme(
        elevation: 0,
        centerTitle: true,
        backgroundColor: surfaceColor,
        foregroundColor: primaryTextColor,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          elevation: 0,
          padding: const EdgeInsets.symmetric(
            horizontal: _mediumSpacing * 2,
            vertical: _mediumSpacing,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(_mediumRadius),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(
            horizontal: _mediumSpacing * 2,
            vertical: _mediumSpacing,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(_mediumRadius),
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surfaceColor,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: _mediumSpacing,
          vertical: _mediumSpacing,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(_mediumRadius),
          borderSide: const BorderSide(color: dividerColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(_mediumRadius),
          borderSide: const BorderSide(color: dividerColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(_mediumRadius),
          borderSide: const BorderSide(color: primaryColor, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(_mediumRadius),
          borderSide: const BorderSide(color: errorColor),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(_mediumRadius),
          borderSide: const BorderSide(color: errorColor, width: 2),
        ),
      ),
      textTheme: const TextTheme(
        displayLarge: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: primaryTextColor,
        ),
        displayMedium: TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.bold,
          color: primaryTextColor,
        ),
        displaySmall: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.bold,
          color: primaryTextColor,
        ),
        bodyLarge: TextStyle(
          fontSize: 16,
          color: primaryTextColor,
        ),
        bodyMedium: TextStyle(
          fontSize: 14,
          color: primaryTextColor,
        ),
        labelLarge: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: primaryTextColor,
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: dividerColor,
        space: _mediumSpacing,
        thickness: 1,
      ),
    );
  }

  /// Spacing getters for consistent padding and margins
  static double get spacingXS => _smallSpacing / 2;
  static double get spacingS => _smallSpacing;
  static double get spacingM => _mediumSpacing;
  static double get spacingL => _largeSpacing;
  static double get spacingXL => _extraLargeSpacing;

  /// Border radius getters for consistent shape across the app
  static double get radiusS => _smallRadius;
  static double get radiusM => _mediumRadius;
  static double get radiusL => _largeRadius;

  /// Common text styles
  static TextStyle get titleLarge => const TextStyle(
        fontSize: 24,
        fontWeight: FontWeight.bold,
        color: primaryTextColor,
      );

  static TextStyle get titleMedium => const TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: primaryTextColor,
      );

  static TextStyle get titleSmall => const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: primaryTextColor,
      );

  static TextStyle get bodyLarge => const TextStyle(
        fontSize: 16,
        color: primaryTextColor,
      );

  static TextStyle get bodyMedium => const TextStyle(
        fontSize: 14,
        color: primaryTextColor,
      );

  static TextStyle get caption => const TextStyle(
        fontSize: 12,
        color: secondaryTextColor,
      );

  /// Common edge insets for consistent padding
  static EdgeInsets get paddingS => const EdgeInsets.all(_smallSpacing);
  static EdgeInsets get paddingM => const EdgeInsets.all(_mediumSpacing);
  static EdgeInsets get paddingL => const EdgeInsets.all(_largeSpacing);
  static EdgeInsets get paddingXL => const EdgeInsets.all(_extraLargeSpacing);

  /// Horizontal paddings
  static EdgeInsets get paddingHorizontalS =>
      const EdgeInsets.symmetric(horizontal: _smallSpacing);
  static EdgeInsets get paddingHorizontalM =>
      const EdgeInsets.symmetric(horizontal: _mediumSpacing);
  static EdgeInsets get paddingHorizontalL =>
      const EdgeInsets.symmetric(horizontal: _largeSpacing);

  /// Vertical paddings
  static EdgeInsets get paddingVerticalS =>
      const EdgeInsets.symmetric(vertical: _smallSpacing);
  static EdgeInsets get paddingVerticalM =>
      const EdgeInsets.symmetric(vertical: _mediumSpacing);
  static EdgeInsets get paddingVerticalL =>
      const EdgeInsets.symmetric(vertical: _largeSpacing);
}