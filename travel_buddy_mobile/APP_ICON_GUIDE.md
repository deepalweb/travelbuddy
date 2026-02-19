# App Icon Generation Guide

## Required Sizes
- 48x48, 72x72, 96x96, 144x144, 192x192, 512x512 pixels

## Method 1: Android Asset Studio (Easiest)

### Step 1: Go to Android Asset Studio
https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html

### Step 2: Upload Your Icon
- Click "Image" tab
- Upload your app icon (PNG, at least 512x512)
- Or use the existing icon from: `travel_buddy_mobile/assets/icon/app_icon.png`

### Step 3: Configure
- **Name:** ic_launcher
- **Shape:** Circle, Square, or Rounded Square
- **Background:** Choose color (#1976D2 recommended)
- **Foreground:** Your icon

### Step 4: Download
- Click "Download"
- Extract ZIP file
- Copy all sizes to your project

### Step 5: Copy to Project
```
res/mipmap-mdpi/ic_launcher.png (48x48)
res/mipmap-hdpi/ic_launcher.png (72x72)
res/mipmap-xhdpi/ic_launcher.png (96x96)
res/mipmap-xxhdpi/ic_launcher.png (144x144)
res/mipmap-xxxhdpi/ic_launcher.png (192x192)
```

## Method 2: Flutter Launcher Icons Package

### Step 1: Already Configured
Your `pubspec.yaml` already has:
```yaml
flutter_launcher_icons:
  android: true
  ios: true
  image_path: "assets/icon/app_icon.png"
  adaptive_icon_background: "#1E40AF"
```

### Step 2: Generate Icons
```bash
cd travel_buddy_mobile
flutter pub get
flutter pub run flutter_launcher_icons
```

This automatically generates all required sizes!

## Method 3: Manual Creation

### Using Photoshop/GIMP:
1. Open your icon (512x512 or larger)
2. Resize to each required size:
   - 48x48, 72x72, 96x96, 144x144, 192x192, 512x512
3. Save each as PNG
4. Name: ic_launcher_48.png, ic_launcher_72.png, etc.

### Using ImageMagick:
```bash
magick convert app_icon.png -resize 48x48 ic_launcher_48.png
magick convert app_icon.png -resize 72x72 ic_launcher_72.png
magick convert app_icon.png -resize 96x96 ic_launcher_96.png
magick convert app_icon.png -resize 144x144 ic_launcher_144.png
magick convert app_icon.png -resize 192x192 ic_launcher_192.png
magick convert app_icon.png -resize 512x512 ic_launcher_512.png
```

## Method 4: Online Tools

### Option A: App Icon Generator
https://appicon.co/
- Upload 1024x1024 icon
- Download all sizes

### Option B: MakeAppIcon
https://makeappicon.com/
- Upload icon
- Select Android
- Download ZIP

### Option C: Icon Kitchen
https://icon.kitchen/
- Upload icon
- Customize
- Download all sizes

## For Google Play Store

You need the **512x512** icon specifically for:
- Play Store listing
- High-resolution icon requirement

Make sure this one is:
- ✅ 512 x 512 pixels
- ✅ PNG format with transparency
- ✅ 32-bit PNG (with alpha channel)
- ✅ Under 1MB

## Icon Design Guidelines

### Do's:
✅ Simple and recognizable
✅ Works at small sizes
✅ Unique and memorable
✅ Represents your app
✅ High contrast
✅ Transparent background (for adaptive icons)

### Don'ts:
❌ Too much detail
❌ Text in icon (hard to read)
❌ Complex gradients
❌ Low contrast
❌ Pixelated or blurry

## Current Icon Location

Your app icon should be at:
```
travel_buddy_mobile/assets/icon/app_icon.png
```

If it doesn't exist, create one or use a placeholder.

## Quick Generation Command

**Recommended: Use Flutter Launcher Icons**
```bash
cd travel_buddy_mobile
flutter pub run flutter_launcher_icons
```

This generates all sizes automatically!

## Verification Checklist

- [ ] All 6 sizes generated (48, 72, 96, 144, 192, 512)
- [ ] PNG format with transparency
- [ ] High quality (no pixelation)
- [ ] Consistent design across sizes
- [ ] 512x512 under 1MB
- [ ] Icon looks good at small size (48x48)

## Save Location

For Play Store submission:
```
travel_buddy_mobile/store_assets/icons/
  ├── ic_launcher_48.png
  ├── ic_launcher_72.png
  ├── ic_launcher_96.png
  ├── ic_launcher_144.png
  ├── ic_launcher_192.png
  └── ic_launcher_512.png (HIGH RESOLUTION - Required!)
```

## Testing Your Icon

1. Build APK with new icon
2. Install on device
3. Check home screen
4. Verify it looks good at actual size
