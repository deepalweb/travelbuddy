# App Store Assets Guide

## Required Screenshots

### Phone Screenshots (8 required)
1. **Home Screen** - Show explore page with places
2. **Trip Planning** - AI trip generation in action
3. **Community** - Posts and social features
4. **Profile** - New redesigned profile with tabs
5. **Deals** - Active deals and offers
6. **Map View** - Places on map
7. **Place Details** - Detailed place information
8. **Favorites** - Saved places

### Tablet Screenshot (1 required)
- Full app view on tablet layout

## Screenshot Specifications
- **Phone**: 1080 x 1920 pixels (9:16 ratio)
- **Tablet**: 1200 x 1920 pixels
- **Format**: PNG or JPEG
- **Max file size**: 8MB per image

## Feature Graphic
- **Size**: 1024 x 500 pixels
- **Format**: PNG or JPEG
- **Content**: App logo + tagline "AI-Powered Travel Companion"

## App Icon Sizes Needed
- 48x48, 72x72, 96x96, 144x144, 192x192, 512x512

## How to Generate Screenshots

### Option 1: Use Android Emulator
```bash
# Run app in emulator
flutter run

# Take screenshots using Android Studio
# Device Frame Screenshots > Capture Screenshot
```

### Option 2: Use Real Device
```bash
# Connect device via USB
adb devices

# Take screenshot
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png
```

### Option 3: Use Screenshot Tools
- **Figma**: Design mockups with device frames
- **Canva**: Create promotional screenshots
- **Shotbot**: Automated screenshot generation

## Quick Checklist
- [ ] 8 phone screenshots captured
- [ ] 1 tablet screenshot captured
- [ ] Feature graphic created (1024x500)
- [ ] App icons generated (all sizes)
- [ ] Privacy policy live at backend URL
- [ ] Terms of service live at backend URL
- [ ] Package name consistent everywhere
- [ ] Google Places API key added to Azure

## Next Steps
1. Generate screenshots using emulator/device
2. Create feature graphic in Canva/Figma
3. Generate app icons using Android Asset Studio
4. Upload all assets to Google Play Console
5. Fix Google Places API key in Azure
6. Test privacy/terms URLs are accessible
