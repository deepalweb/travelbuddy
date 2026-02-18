# Pre-Launch Checklist

## 🔴 CRITICAL (Must Complete Before Launch)

### 1. Google Places API Key
- [ ] Add `GOOGLE_PLACES_API_KEY` to Azure App Service
  - Portal: https://portal.azure.com
  - App Service: travelbuddy-b2c6hgbbgeh4esdh
  - Configuration → Application settings → + New
  - Restart app service after adding

### 2. Deploy Backend
```bash
cd backend
git add .
git commit -m "Add legal routes"
git push azure main
```
- [ ] Backend deployed successfully
- [ ] Privacy URL works: https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/privacy
- [ ] Terms URL works: https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/terms

### 3. App Store Assets
- [ ] 8 phone screenshots (1080x1920) - Use `capture_screenshots.bat`
- [ ] 1 tablet screenshot (1200x1920)
- [ ] Feature graphic (1024x500) - See `FEATURE_GRAPHIC_GUIDE.md`
- [ ] App icons (48-512px) - See `APP_ICON_GUIDE.md`

## 🟡 IMPORTANT (Should Complete)

### 4. App Configuration
- [ ] Package name: com.travelbuddylk.app ✅ (Already fixed)
- [ ] Version: 1.0.0+1 ✅ (Already set)
- [ ] Release keystore exists ✅ (Already created)
- [ ] Privacy policy URL in app_info.json ✅ (Already updated)
- [ ] Terms URL in app_info.json ✅ (Already updated)

### 5. Testing
- [ ] Test app on real device
- [ ] Test Google Places API integration
- [ ] Test privacy policy link opens
- [ ] Test terms of service link opens
- [ ] Test all main features work

## 🟢 OPTIONAL (Nice to Have)

### 6. Marketing Materials
- [ ] App description (short: 80 chars, full: 4000 chars)
- [ ] Promotional video (optional)
- [ ] Website/landing page

### 7. Post-Launch
- [ ] Monitor crash reports
- [ ] Monitor API usage
- [ ] Collect user feedback
- [ ] Plan first update

## Quick Commands

### Deploy Backend
```bash
cd c:\Users\DeepalRupasinghe\travelbuddy-2\backend
git add .
git commit -m "Add legal routes for privacy and terms"
git push azure main
```

### Capture Screenshots
```bash
cd c:\Users\DeepalRupasinghe\travelbuddy-2\travel_buddy_mobile
capture_screenshots.bat
```

### Build Release APK
```bash
cd c:\Users\DeepalRupasinghe\travelbuddy-2\travel_buddy_mobile
flutter clean
flutter build apk --release
```

### Test URLs
- Privacy: https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/privacy
- Terms: https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/terms
- Health: https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api/health

## Estimated Time to Complete
- Google API Key: 5 minutes
- Backend Deploy: 10 minutes
- Screenshots: 30 minutes
- Feature Graphic: 20 minutes
- App Icons: 15 minutes
- Testing: 30 minutes

**Total: ~2 hours**

## Support Resources
- Azure Portal: https://portal.azure.com
- Google Play Console: https://play.google.com/console
- Android Asset Studio: https://romannurik.github.io/AndroidAssetStudio/
- Canva: https://www.canva.com
