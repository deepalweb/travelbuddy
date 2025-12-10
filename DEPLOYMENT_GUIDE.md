# Frontend Deployment Guide

## ✅ Deployment Complete

**Date**: January 2025  
**Status**: Frontend built and deployed to Azure

---

## 📍 Live URLs

- **Website**: https://travelbuddylk.com
- **Privacy Policy**: https://travelbuddylk.com/privacy-policy
- **Terms of Service**: https://travelbuddylk.com/terms-of-service

---

## 🚀 Deployment Process

### 1. Build Frontend
```bash
cd frontend
npm run build
```

### 2. Copy to Backend Public Folder
```bash
xcopy /E /I /Y frontend\dist backend\public
```

### 3. Push to Azure
```bash
git add .
git commit -m "Deploy frontend with privacy policy and terms"
git push azure main
```

---

## 📦 What Was Deployed

### New Pages
- ✅ Privacy Policy (`/privacy-policy`)
- ✅ Terms of Service (`/terms-of-service`)

### Build Output
- `index.html` - Main HTML file
- `assets/` - CSS and JavaScript bundles
- `images/` - Optimized images
- Total size: ~1.2 MB (gzipped: ~256 KB)

---

## 🔄 Future Deployments

### Quick Deploy Script
Create `deploy.bat`:
```batch
@echo off
echo Building frontend...
cd frontend
call npm run build
cd ..

echo Copying to backend...
xcopy /E /I /Y frontend\dist backend\public

echo Pushing to Azure...
git add .
git commit -m "Deploy frontend update"
git push azure main

echo Deployment complete!
```

### Or use npm script
Add to `package.json`:
```json
"scripts": {
  "deploy": "npm run build && xcopy /E /I /Y dist ../backend/public"
}
```

---

## ✅ Verification

After deployment, verify:
1. Visit https://travelbuddylk.com/privacy-policy
2. Visit https://travelbuddylk.com/terms-of-service
3. Check mobile responsiveness
4. Verify all links work

---

## 📱 Use in App Stores

### Google Play Console
1. Go to Store presence → Privacy policy
2. Enter: `https://travelbuddylk.com/privacy-policy`

### App Store Connect
1. Go to App Information → Privacy Policy URL
2. Enter: `https://travelbuddylk.com/privacy-policy`

### Terms of Service
Both stores may ask for Terms URL:
- Enter: `https://travelbuddylk.com/terms-of-service`

---

## 🔧 Troubleshooting

### If pages don't load:
1. Check `web.config` has SPA routing rules
2. Verify files copied to `backend/public/`
3. Check Azure deployment logs
4. Clear browser cache

### If styles are broken:
1. Check `assets/` folder copied correctly
2. Verify base path in `vite.config.ts`
3. Check MIME types in `web.config`

---

**Last Updated**: January 2025
