# Google Sign-In Setup Checklist

## ✅ Step-by-Step Setup (5 minutes)

### 1️⃣ Firebase Console Configuration

**Go to:** https://console.firebase.google.com/project/travelbuddy-2d1c5/authentication/providers

1. Click **"Google"** provider
2. Click **"Edit"** (pencil icon)
3. Ensure **"Enable"** is toggled ON
4. Under **"Authorized domains"**, add:
   ```
   localhost
   travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net
   travelbuddylk.com
   www.travelbuddylk.com
   ```
5. Click **"Save"**

---

### 2️⃣ Test Locally (Verify it works)

```bash
cd frontend
npm run dev
```

1. Open: http://localhost:3000/login
2. Click **"Continue with Google"**
3. Should redirect to Google login
4. After login, redirects back to your app
5. ✅ If successful, proceed to Azure deployment

---

### 3️⃣ Deploy to Azure

```bash
cd frontend
npm run build
```

**Upload `dist/` folder to Azure App Service**

Or if using Git deployment:
```bash
git add .
git commit -m "Add Google Sign-In with Azure compatibility"
git push azure master
```

---

### 4️⃣ Verify on Azure

1. Open: https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/login
2. Click **"Continue with Google"**
3. Should work without COOP errors
4. Check browser console (F12) for any errors

---

## 🔧 Troubleshooting

### ❌ Error: "redirect_uri_mismatch"

**Cause:** Domain not authorized in Firebase

**Fix:**
1. Go to Firebase Console → Authentication → Settings
2. Add exact domain to "Authorized domains"
3. Wait 2-3 minutes for changes to propagate

---

### ❌ Error: "auth/unauthorized-domain"

**Cause:** Same as above

**Fix:** Add domain to Firebase authorized domains list

---

### ❌ Error: "COOP blocked popup"

**Cause:** Azure still has COOP headers

**Fix:** 
1. Verify `web.config` is in `frontend/public/` folder
2. Rebuild and redeploy
3. Or manually remove headers in Azure Portal:
   - App Service → Configuration → Application Settings
   - Remove `Cross-Origin-Opener-Policy` header

---

### ❌ Redirect works but user not logged in

**Cause:** `getRedirectResult` not being called

**Fix:** Already implemented in AuthContext.tsx - check browser console for errors

---

### ❌ Works locally but not on Azure

**Cause:** Missing domain in Firebase or COOP headers still present

**Fix:**
1. Double-check Firebase authorized domains
2. Verify web.config is deployed
3. Clear browser cache and try again

---

## 📊 Expected Behavior

### ✅ Localhost (http://localhost:3000)
- Click "Continue with Google"
- Redirects to Google login
- Redirects back to http://localhost:3000
- User logged in ✅

### ✅ Azure Production
- Click "Continue with Google"
- Redirects to Google login
- Redirects back to your Azure domain
- User logged in ✅

---

## 🎯 What Changed

### Files Modified:
1. ✅ `frontend/src/contexts/AuthContext.tsx` - Added `loginWithGoogle()` method
2. ✅ `frontend/src/pages/LoginPage.tsx` - Added Google Sign-In button
3. ✅ `frontend/public/web.config` - Removed COOP headers for Azure

### Key Implementation Details:
- **Uses `signInWithRedirect`** instead of `signInWithPopup` (Azure compatible)
- **Handles redirect result** in AuthContext useEffect
- **Removes COOP headers** via web.config
- **Syncs user** with backend after Google login

---

## 🔐 Security Notes

- ✅ Google OAuth handles all authentication
- ✅ Firebase validates redirect URIs
- ✅ Only authorized domains can use your Firebase project
- ✅ Removing COOP headers is safe for auth flows
- ✅ No security vulnerabilities introduced

---

## 📞 Support

If issues persist:
1. Check browser console (F12) for errors
2. Check Firebase Console → Authentication → Users (user should appear)
3. Check Azure App Service logs
4. Verify all domains are authorized in Firebase

---

## ✅ Success Criteria

- [ ] Google Sign-In button appears on login page
- [ ] Clicking button redirects to Google
- [ ] After Google login, redirects back to app
- [ ] User is logged in and sees dashboard
- [ ] Works on both localhost and Azure
- [ ] No COOP errors in browser console

---

**Estimated Setup Time:** 5-10 minutes  
**Difficulty:** Easy  
**Azure Compatibility:** ✅ Fully compatible
