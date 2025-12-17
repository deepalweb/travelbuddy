# 🚨 URGENT: Security Fix Required

## Critical Issue: Exposed API Keys in GitHub

**Severity:** 🔴 HIGH  
**Status:** ⚠️ REQUIRES IMMEDIATE ACTION

---

## 🔍 What Was Exposed

The following credentials were hardcoded in `.github/workflows/azure-deploy.yml`:

1. **Firebase API Key:** `AIzaSyCuJr5N0ytr1h_Aq_5qQazNL0wQUnsZlAw`
2. **Google Maps API Key:** `AIzaSyAey-fuui7b3I-PkzJDVfsTFa9Kv_b_6ls`
3. **Unsplash Access Key:** `J4khiSIy9hN7kZabjiTdQR-SG_FgxNX25icqGuleqhs`
4. **Firebase Project Details:** Project ID, Storage Bucket, etc.

---

## ⚠️ Potential Impact

### 1. Google Maps API Key
- **Risk:** Unauthorized usage can rack up charges
- **Action:** Regenerate key immediately
- **Cost:** Could be $100s-$1000s if abused

### 2. Firebase API Key
- **Risk:** Access to your Firebase project
- **Action:** Rotate key and add restrictions
- **Impact:** Data breach, unauthorized access

### 3. Unsplash API Key
- **Risk:** API quota exhaustion
- **Action:** Regenerate key
- **Impact:** Service disruption

---

## ✅ IMMEDIATE ACTIONS (Do Now)

### Step 1: Regenerate All API Keys (15 minutes)

#### Google Maps API Key:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find key: `AIzaSyAey-fuui7b3I-PkzJDVfsTFa9Kv_b_6ls`
3. Click "Delete" or "Regenerate"
4. Create new key with restrictions:
   - **Application restrictions:** HTTP referrers
   - **Website restrictions:** 
     - `https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/*`
     - `https://travelbuddylk.com/*`
     - `http://localhost:3000/*` (for development)
   - **API restrictions:** Only enable Maps JavaScript API, Places API

#### Firebase (if needed):
1. Go to: https://console.firebase.google.com/project/travelbuddy-2d1c5/settings/general
2. Under "Your apps" → Web app
3. If compromised, create new web app
4. Update Firebase config in code

#### Unsplash API Key:
1. Go to: https://unsplash.com/oauth/applications
2. Find your application
3. Click "Regenerate Access Key"
4. Copy new key

---

### Step 2: Add Keys to GitHub Secrets (5 minutes)

1. Go to: https://github.com/deepalweb/travelbuddy/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret:

```
Name: VITE_FIREBASE_API_KEY
Value: [Your new Firebase API key]

Name: VITE_FIREBASE_AUTH_DOMAIN
Value: travelbuddy-2d1c5.firebaseapp.com

Name: VITE_FIREBASE_PROJECT_ID
Value: travelbuddy-2d1c5

Name: VITE_FIREBASE_STORAGE_BUCKET
Value: travelbuddy-2d1c5.firebasestorage.app

Name: VITE_FIREBASE_MESSAGING_SENDER_ID
Value: 45425409967

Name: VITE_FIREBASE_APP_ID
Value: [Your Firebase App ID]

Name: VITE_GOOGLE_MAPS_API_KEY
Value: [Your NEW Google Maps API key]

Name: VITE_UNSPLASH_ACCESS_KEY
Value: [Your NEW Unsplash key]
```

---

### Step 3: Update Azure App Service Settings (5 minutes)

1. Go to: Azure Portal → Your App Service
2. Settings → Configuration → Application settings
3. Add/Update same environment variables as above
4. Click "Save"
5. Restart app service

---

### Step 4: Update Local .env Files (2 minutes)

Update `frontend/.env` and `frontend/.env.local` with new keys:

```env
VITE_FIREBASE_API_KEY=your_new_firebase_key
VITE_GOOGLE_MAPS_API_KEY=your_new_google_maps_key
VITE_UNSPLASH_ACCESS_KEY=your_new_unsplash_key
```

**⚠️ NEVER commit .env files to Git!**

---

## ✅ What Was Fixed

The deployment workflow now uses GitHub Secrets instead of hardcoded values:

**Before (INSECURE):**
```yaml
VITE_FIREBASE_API_KEY="AIzaSyCuJr5N0ytr1h_Aq_5qQazNL0wQUnsZlAw"
```

**After (SECURE):**
```yaml
VITE_FIREBASE_API_KEY="${{ secrets.VITE_FIREBASE_API_KEY }}"
```

---

## 🔒 Security Best Practices Going Forward

### 1. Never Commit Secrets
- ✅ Use GitHub Secrets for CI/CD
- ✅ Use Azure App Settings for production
- ✅ Use .env files locally (add to .gitignore)
- ❌ Never hardcode API keys in code

### 2. Restrict API Keys
- Add HTTP referrer restrictions
- Add IP restrictions where possible
- Enable only required APIs
- Set usage quotas

### 3. Rotate Keys Regularly
- Rotate every 90 days
- Rotate immediately if exposed
- Keep old keys for 24h during rotation

### 4. Monitor Usage
- Set up billing alerts
- Monitor API usage dashboards
- Enable audit logs

---

## 📋 Verification Checklist

After completing all steps:

- [ ] Google Maps API key regenerated
- [ ] Unsplash API key regenerated
- [ ] All secrets added to GitHub Secrets
- [ ] Azure App Service settings updated
- [ ] Local .env files updated
- [ ] Deployment workflow updated (already done)
- [ ] Test deployment works with new keys
- [ ] Old keys deleted/disabled
- [ ] Billing alerts configured
- [ ] API restrictions applied

---

## 🧪 Testing

After fixing:

1. **Test locally:**
   ```bash
   cd frontend
   npm run dev
   # Verify maps and images load
   ```

2. **Test deployment:**
   ```bash
   git push origin master
   # Watch GitHub Actions
   # Verify deployment succeeds
   ```

3. **Test production:**
   - Visit: https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net
   - Check maps work
   - Check images load
   - Check Firebase auth works

---

## 📊 Cost Monitoring

### Set Up Billing Alerts:

**Google Cloud:**
1. Go to: https://console.cloud.google.com/billing
2. Budgets & alerts → Create budget
3. Set alert at $10, $50, $100

**Firebase:**
1. Go to: https://console.firebase.google.com/project/travelbuddy-2d1c5/usage
2. Set up usage alerts

---

## 🆘 If Keys Were Already Abused

### Check for unauthorized usage:

**Google Maps:**
1. Go to: https://console.cloud.google.com/apis/dashboard
2. Check "Metrics" for unusual spikes
3. Review "Quotas" for exceeded limits

**Firebase:**
1. Go to: https://console.firebase.google.com/project/travelbuddy-2d1c5/usage
2. Check for unusual authentication attempts
3. Review database access logs

### If you see abuse:
1. Delete compromised keys immediately
2. Contact support (Google Cloud, Firebase)
3. Dispute charges if applicable
4. File incident report

---

## 📞 Support Contacts

- **Google Cloud Support:** https://cloud.google.com/support
- **Firebase Support:** https://firebase.google.com/support
- **GitHub Security:** security@github.com

---

## ✅ Summary

**What happened:** API keys were exposed in public GitHub repository

**Risk level:** 🔴 HIGH (potential for abuse and charges)

**Time to fix:** ~30 minutes

**Status:** ✅ Workflow fixed, keys need regeneration

**Next steps:** 
1. Regenerate all API keys
2. Add to GitHub Secrets
3. Update Azure settings
4. Test deployment

---

**This fix has been pushed to GitHub. Now regenerate your API keys!** 🔐
