# Play Store Production Checklist

## ✅ Security Fixes Complete
- HTTPS-only (cleartext disabled)
- ProGuard obfuscation enabled
- Code shrinking enabled
- Target SDK 35
- **Background location permission removed**
- **Foreground service permissions removed**
- **Privacy policy created**

## 🚨 Critical Actions Required

### 1. ~~Remove Background Location Permission~~ ✅ DONE
**Status:** Removed from AndroidManifest.xml

### 2. Restrict Google Maps API Key
```bash
# Get SHA-1 fingerprint
cd android && ./gradlew signingReport

# Then in Google Cloud Console:
# APIs & Services → Credentials → Your API Key
# Application restrictions: Android apps
# Package: com.travelbuddylk.app
# SHA-1: [paste from signingReport]
```

### 3. ~~Create Privacy Policy~~ ✅ DONE
**Status:** Created in `PRIVACY_POLICY.md`
**Next:** Host on GitHub Pages, website, or Google Sites
**URL needed for Play Console**

### 4. Complete Data Safety Form (Play Console)
**Data collected:**
- Location (precise/coarse) → App functionality
- Personal info (name, email, phone) → Account creation
- Photos → Profile pictures, place reviews
- Device ID → Analytics

**Data shared with:**
- Firebase (authentication, analytics)
- Google Maps (location services)
- Azure (backend API)

**Security:**
- ✓ Encrypted in transit (HTTPS)
- ✓ Users can request deletion
- ✓ No sale of data

### 5. Verify App Signing
**Check file exists:** `android/key.properties`
```properties
storePassword=YOUR_PASSWORD
keyPassword=YOUR_PASSWORD
keyAlias=YOUR_ALIAS
storeFile=../path/to/keystore.jks
```
**⚠️ Backup keystore file securely (cannot recover if lost)**

## 📋 Pre-Launch Checklist

### Code
- [x] Remove background location permission
- [x] Remove foreground service permissions
- [x] Create privacy policy document
- [ ] Host privacy policy online
- [ ] Get SHA-1 fingerprint (run: `cd android && ./gradlew signingReport`)
- [ ] Test release build on real device
- [ ] Verify Google Sign-In works
- [ ] Test location permissions flow
- [ ] Test camera/photo upload

### Play Console
- [ ] Privacy policy URL added
- [ ] Data safety form completed
- [ ] Content rating questionnaire (expect: Everyone)
- [ ] Target audience: 13+
- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Screenshots (2-8 images)
- [ ] Short description (80 chars max)
- [ ] Full description
- [ ] Contact email

### Security
- [ ] Google Maps API key restricted
- [ ] Firebase security rules reviewed
- [ ] Backend API rate limiting enabled
- [ ] No hardcoded secrets in code

## 🚀 Build Production Release

```bash
# Build AAB (required for Play Store)
cd android
./gradlew bundleRelease

# Output location:
# android/app/build/outputs/bundle/release/app-release.aab

# Test locally first:
./gradlew assembleRelease
# Install: android/app/build/outputs/apk/release/app-release.apk
```

## 📤 Upload to Play Console

1. **Internal Testing** (recommended first)
   - Upload AAB to Internal testing track
   - Add test users
   - Verify everything works
   - Review time: ~1 hour

2. **Production Release**
   - Upload AAB to Production track
   - Complete all forms
   - Submit for review
   - Review time: 3-7 days (first submission)

## ⚠️ Common Rejection Reasons

1. Missing privacy policy
2. Background location not justified
3. Data safety form incomplete
4. Unrestricted API keys
5. Permissions not explained in-app

## 🔗 Quick Links

- [Play Console](https://play.google.com/console)
- [Google Cloud Console](https://console.cloud.google.com)
- [Firebase Console](https://console.firebase.google.com)
- [Data Safety Guide](https://support.google.com/googleplay/android-developer/answer/10787469)
