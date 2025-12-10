# App Icon Setup Guide

## 📱 How to Replace the App Icon

### Step 1: Prepare Your Icon Image
1. Create a **1024x1024 PNG** image with your TravelBuddy logo
2. Save it as `app_icon.png`
3. Place it in: `travel_buddy_mobile/assets/icon/app_icon.png`

### Step 2: (Optional) Create Adaptive Icon for Android
1. Create a **foreground layer** (1024x1024 PNG with transparent background)
2. Save it as `app_icon_foreground.png`
3. Place it in: `travel_buddy_mobile/assets/icon/app_icon_foreground.png`
4. Background color is set to `#1E40AF` (TravelBuddy blue)

### Step 3: Generate Icons
Run this command in the `travel_buddy_mobile` folder:
```bash
flutter pub get
flutter pub run flutter_launcher_icons
```

### Step 4: Verify
- **Android**: Check `android/app/src/main/res/mipmap-*/ic_launcher.png`
- **iOS**: Check `ios/Runner/Assets.xcassets/AppIcon.appiconset/`

---

## 🎨 Icon Design Tips

### Requirements
- **Size**: 1024x1024 pixels minimum
- **Format**: PNG with transparency
- **Safe Zone**: Keep important elements in center 80%
- **No Text**: Avoid small text (won't be readable at small sizes)

### TravelBuddy Icon Suggestions
- ✈️ Airplane + Globe combination
- 🗺️ Map pin with travel theme
- 🧳 Suitcase with location marker
- 🌍 Stylized globe with route lines

### Color Scheme (from app theme)
- **Primary Blue**: `#1E40AF`
- **Purple Accent**: `#7C3AED`
- **Gradient**: Blue → Purple (matches app branding)

---

## 🚀 Quick Start (If You Don't Have an Icon Yet)

### Option 1: Use Placeholder
1. Download a free travel icon from:
   - [Flaticon](https://www.flaticon.com/search?word=travel)
   - [Icons8](https://icons8.com/icons/set/travel)
   - [Noun Project](https://thenounproject.com/search/?q=travel)

2. Resize to 1024x1024 using:
   - [ResizeImage.net](https://resizeimage.net/)
   - Photoshop / GIMP / Figma

### Option 2: Generate with AI
Use AI tools to create a custom icon:
- **Prompt**: "Modern minimalist travel app icon, airplane and globe, blue and purple gradient, flat design, 1024x1024"
- **Tools**: DALL-E, Midjourney, Stable Diffusion

---

## 📋 Current Configuration

```yaml
flutter_launcher_icons:
  android: true
  ios: true
  image_path: "assets/icon/app_icon.png"
  adaptive_icon_background: "#1E40AF"
  adaptive_icon_foreground: "assets/icon/app_icon_foreground.png"
```

---

## ✅ Checklist

- [ ] Create 1024x1024 PNG icon
- [ ] Place in `assets/icon/app_icon.png`
- [ ] (Optional) Create foreground layer for Android
- [ ] Run `flutter pub get`
- [ ] Run `flutter pub run flutter_launcher_icons`
- [ ] Test on Android device/emulator
- [ ] Test on iOS device/simulator
- [ ] Commit icon files to git

---

**Note**: After generating icons, you may need to rebuild the app completely:
```bash
flutter clean
flutter pub get
flutter run
```
