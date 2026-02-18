# App Icon Generation Guide

## Required Sizes
- 48x48 (mdpi)
- 72x72 (hdpi)
- 96x96 (xhdpi)
- 144x144 (xxhdpi)
- 192x192 (xxxhdpi)
- 512x512 (Google Play Store)

## Automated Generation Tools

### Option 1: Android Asset Studio (Recommended)
1. Go to: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
2. Upload your 512x512 icon
3. Adjust padding, shape, background
4. Download ZIP with all sizes
5. Extract to `android/app/src/main/res/`

### Option 2: Flutter Launcher Icons Package
```bash
# Add to pubspec.yaml
dev_dependencies:
  flutter_launcher_icons: ^0.13.1

flutter_launcher_icons:
  android: true
  ios: false
  image_path: "assets/icon/icon.png"
  adaptive_icon_background: "#1976D2"
  adaptive_icon_foreground: "assets/icon/icon_foreground.png"

# Generate icons
flutter pub get
flutter pub run flutter_launcher_icons
```

### Option 3: Online Icon Generator
- https://icon.kitchen/
- https://appicon.co/
- https://makeappicon.com/

## Design Guidelines

### Icon Design Tips
- Simple, recognizable design
- Works at small sizes (48x48)
- No text (hard to read at small sizes)
- Use brand colors
- Transparent or solid background
- High contrast

### Travel Buddy Icon Ideas
1. **Compass + Map Pin**: Combine compass and location pin
2. **Globe + Plane**: World travel theme
3. **Backpack**: Simple travel symbol
4. **Map Marker**: Location-based service
5. **Letter T + B**: Stylized initials

## Current Icon Location
```
android/app/src/main/res/
├── mipmap-mdpi/ic_launcher.png (48x48)
├── mipmap-hdpi/ic_launcher.png (72x72)
├── mipmap-xhdpi/ic_launcher.png (96x96)
├── mipmap-xxhdpi/ic_launcher.png (144x144)
└── mipmap-xxxhdpi/ic_launcher.png (192x192)
```

## Quick Steps

### If you have a 512x512 icon:
1. Go to https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
2. Upload your icon
3. Select "Adaptive and Legacy"
4. Choose shape: Circle or Rounded Square
5. Set padding: 10-20%
6. Download ZIP
7. Extract to `android/app/src/main/res/`
8. Replace existing mipmap folders

### If you need to create an icon:
1. Design 512x512 icon in Canva/Figma
2. Use simple, bold design
3. Export as PNG with transparent background
4. Follow steps above to generate all sizes

## Validation
```bash
# Check if icons exist
ls android/app/src/main/res/mipmap-*/ic_launcher.png

# Rebuild app with new icons
flutter clean
flutter build apk
```

## Testing
1. Install app on device
2. Check home screen icon
3. Verify icon appears correctly in app drawer
4. Test on different Android versions
