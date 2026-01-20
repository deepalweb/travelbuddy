# TravelBuddy Two-API-Key Implementation Guide

## ✅ Changes Already Made

### 1. **Updated `frontend/index.html`**
   - ✅ Modified Google Maps script loading to support environment variables
   - ✅ Added fallback to original key for backward compatibility
   - ✅ Ready to accept `VITE_GOOGLE_MAPS_API_KEY` from .env files

### 2. **Created `.env.example`**
   - ✅ Created `frontend/.env.example` with template for environment variables
   - ✅ Documented the purpose of each variable
   - ✅ Provides guidance for creating frontend-only API key

## 🚀 Implementation Steps

### **Step 1: Create New Frontend API Key in Google Cloud Console**

**Timeline:** 5-10 minutes

1. **Open Google Cloud Console:**
   - Go to: https://console.cloud.google.com/
   - Sign in with your Google account
   - Select the TravelBuddy project

2. **Create New API Key:**
   - Navigate to: APIs & Services → Credentials
   - Click: **Create Credentials** → **API Key**
   - Copy the new key (e.g., `AIzaSy...NewFrontendKey...`)

3. **Rename the Key:**
   - Click the edit icon next to the key
   - Rename to: `TravelBuddy Web Maps (Frontend)`
   - Click **Save**

4. **Set Application Restrictions (HTTP Referrers):**
   - Select the key from the credentials list
   - Scroll to "Application restrictions"
   - Select: **HTTP referrers (web sites)**
   - Add the following referrers:
     ```
     https://travelbuddylk.com/*
     http://localhost:3000/*
     http://localhost:5173/*
     ```
   - Click **Add URI** for each domain

5. **Set API Restrictions:**
   - Scroll to "API restrictions"
   - Select: **Restrict key**
   - Check: **Maps JavaScript API**
   - Check: **Places API**
   - Click **Save**

6. **Copy Your New Frontend API Key**
   - You'll need this for the next step

**Example of what you'll copy:**
```
AIzaSyDTV_5KiXOuYRtG2TEMIvrHPCsht3sSWEQ  (old key - KEEP for backend)
AIzaSyNewFrontendKeyValueHere9999999xyz   (new key - use for frontend)
```

---

### **Step 2: Create Local .env Files**

**Timeline:** 2 minutes

**For Development (frontend/.env):**

Create a new file: `frontend/.env`

```bash
# Google Maps API Key (Frontend - HTTP Referrer Restricted)
# This key is restricted to HTTP referrers for browser-based requests
VITE_GOOGLE_MAPS_API_KEY=AIzaSyNewFrontendKeyValueHere9999999xyz

# Development API URL
VITE_REACT_APP_API_URL=http://localhost:5000
```

**For Production (frontend/.env.production):**

Create a new file: `frontend/.env.production`

```bash
# Google Maps API Key (Frontend - HTTP Referrer Restricted)
# This is the frontend-only key restricted to travelbuddylk.com
VITE_GOOGLE_MAPS_API_KEY=AIzaSyNewFrontendKeyValueHere9999999xyz

# Production API URL
VITE_REACT_APP_API_URL=https://api.travelbuddylk.com
```

**⚠️ IMPORTANT:**
- `frontend/.env` and `frontend/.env.production` should **NEVER** be committed to git
- These files are already in `.gitignore` (verify with `git status`)
- Only `.env.example` is committed for reference

---

### **Step 3: Keep Backend Configuration**

**No Changes Needed** - Backend continues to use:

```bash
# backend/.env (unchanged)
GOOGLE_PLACES_API_KEY=AIzaSyDTV_5KiXOuYRtG2TEMIvrHPCsht3sSWEQ
```

This key has IP restrictions (Azure backend IPs) and works perfectly for backend server calls.

---

### **Step 4: Test Locally**

**Timeline:** 5-10 minutes

#### **Test 1: Frontend Maps Loading**

1. Open terminal in `frontend/` directory
2. Run: `npm run dev`
3. Open browser: `http://localhost:5173`
4. Navigate to: **Community** → **Review a Place** (or any place review)
5. **Expected Result:** Map should load without RefererNotAllowedMapError
6. **Success Criteria:** 
   - ✅ Map displays correctly
   - ✅ No console errors
   - ✅ Can interact with map

#### **Test 2: Backend Places Search**

1. Open terminal in `backend/` directory
2. Run: `npm start`
3. In another terminal (or Postman), call:
   ```bash
   curl http://localhost:5000/api/enhanced-places/search?query=Nuwara%20Eliya
   ```
4. **Expected Result:** Returns place results, no 500 error
5. **Success Criteria:**
   - ✅ Returns array of places
   - ✅ Each place has name, location, rating
   - ✅ No REQUEST_DENIED error

#### **Test 3: Integration Test (Full User Flow)**

1. Start both frontend (`npm run dev`) and backend (`npm start`)
2. Log in to the application
3. Try these actions:
   - **Create a story** with a place (should load maps)
   - **Review a place** from community (should load maps)
   - **Search for places** (should return results)
4. **Success Criteria:** All operations work without errors

---

### **Step 5: Deploy to Production**

**Timeline:** 10-15 minutes

#### **5a. Update Environment Variables in Hosting**

**If using Azure App Service:**

1. Go to Azure Portal
2. Find your App Service (TravelBuddy frontend)
3. Settings → Configuration → Application settings
4. Add new setting:
   ```
   VITE_GOOGLE_MAPS_API_KEY = AIzaSyNewFrontendKeyValueHere9999999xyz
   ```
5. Click **Save** and wait for deployment

**If using Vercel/Netlify:**

1. Go to project settings
2. Environment variables section
3. Add:
   ```
   VITE_GOOGLE_MAPS_API_KEY = AIzaSyNewFrontendKeyValueHere9999999xyz
   ```
4. Redeploy project

#### **5b. Build and Deploy Frontend**

```bash
# From frontend directory
npm run build

# This will create dist/ folder with environment variables baked in
# Then deploy dist/ folder to your hosting
```

#### **5c. Verify Production**

1. Visit: `https://travelbuddylk.com/community`
2. Try to review a place
3. **Expected:** Map loads successfully
4. Search for places
5. **Expected:** Results return without errors

---

## 📊 Configuration Summary

| Component | Old Setup | New Setup |
|-----------|-----------|-----------|
| **Frontend Maps** | ❌ IP-restricted key → RefererNotAllowedMapError | ✅ HTTP referrer-restricted key → Works from browser |
| **Backend Places** | ✅ IP-restricted key → Works from server | ✅ Same IP-restricted key → Still works |
| **Frontend Key** | Single key for everything | ✅ Dedicated frontend key (HTTP referrers) |
| **Backend Key** | Single key for everything | ✅ Dedicated backend key (IP restrictions) |
| **Security** | Weaker (multiple restriction types) | ✅ Stronger (specific restriction per key) |
| **Flexibility** | Limited | ✅ Can update keys independently |

---

## 🔍 Troubleshooting

### **Problem: Still getting RefererNotAllowedMapError**

**Solution:**
1. Verify the new frontend key was created with HTTP referrer restrictions
2. Check that `frontend/.env` has the new key (not old key)
3. Stop dev server and restart: `npm run dev`
4. Clear browser cache (Ctrl+Shift+Delete)
5. Check browser console for the actual API key being used

### **Problem: Backend returning 500 REQUEST_DENIED**

**Solution:**
1. Verify backend still has old key in `.env`: `GOOGLE_PLACES_API_KEY=AIzaSyDTV_5KiXOuYRtG2TEMIvrHPCsht3sSWEQ`
2. Restart backend: `npm start` in backend directory
3. Don't apply HTTP referrer restrictions to the backend key
4. Check that your server's IP is in the API key's IP restrictions

### **Problem: Maps not loading in production**

**Solution:**
1. Verify production environment variable is set in hosting platform
2. Check that the referrer domain includes your actual domain
3. Rebuild and redeploy with: `npm run build && npm run preview`
4. Check browser DevTools → Network tab to see actual API key being used

### **Problem: Still can't find new API key**

**Solution:**
1. Go to Google Cloud Console
2. Ensure you're in the correct project (check top left)
3. Go to: APIs & Services → Credentials
4. Look in "API keys" section (not OAuth or service accounts)
5. The key should have a lock icon and be marked as an "API key"

---

## ✅ Verification Checklist

Before considering this complete, verify:

- [ ] **Frontend .env created** with new frontend key
- [ ] **Frontend .env.production created** with new frontend key
- [ ] **Both files are in .gitignore** (check with `git status`)
- [ ] **Backend .env unchanged** (still has IP-restricted key)
- [ ] **npm run dev succeeds** (no TypeScript errors)
- [ ] **Maps load locally** without RefererNotAllowedMapError
- [ ] **Backend search works locally** without 500 errors
- [ ] **npm run build succeeds** (production build passes)
- [ ] **Production env variable set** in hosting platform
- [ ] **Production maps work** at travelbuddylk.com
- [ ] **Production search works** without REQUEST_DENIED errors

---

## 📝 Additional Notes

1. **Why Two Keys?**
   - API restrictions in Google Cloud can't specify both "IP addresses" AND "HTTP referrers" for the same key
   - Frontend browser requests: Use HTTP referrers
   - Backend server requests: Use IP addresses
   - Solution: Two keys with different restriction types

2. **Backward Compatibility**
   - If a key is not configured, the code falls back to the original key
   - This ensures the application continues to work even if env vars aren't set
   - Gradual migration path for different environments

3. **Security Best Practices**
   - Never commit `.env` files to git
   - Never log API keys in console
   - Rotate keys regularly (generate new ones, update env vars, delete old ones)
   - Monitor API usage in Google Cloud Console

4. **Cost Implications**
   - Having two keys doesn't increase costs
   - You're still consuming the same amount of API quota
   - Costs depend on actual API calls, not number of keys

