# Fix: Admin Panel 404 on Azure - Manual Solution

## Problem
`/admin` returns 404 on Azure because `web.config` is missing from deployment.

## Quick Fix (5 minutes)

### Step 1: Access Kudu Console
1. Go to: https://travelbuddy-b2c6hgbbgeh4esdh.scm.azurewebsites.net
2. Click: **Debug console** → **CMD**
3. Navigate to: `site/wwwroot/public`

### Step 2: Check if web.config Exists
```bash
dir web.config
```

**If missing:** Continue to Step 3  
**If exists:** Check if it has correct content (see Step 4)

### Step 3: Create web.config in Kudu
Click the **+** icon → **New file** → Name it `web.config`

Paste this content:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <clientCache cacheControlMode="UseMaxAge" cacheControlMaxAge="7.00:00:00" />
    </staticContent>
    <httpProtocol>
      <customHeaders>
        <remove name="Cross-Origin-Opener-Policy" />
        <remove name="Cross-Origin-Embedder-Policy" />
      </customHeaders>
    </httpProtocol>
  </system.webServer>
</configuration>
```

Click **Save**

### Step 4: Restart App Service
1. Go to Azure Portal → Your App Service
2. Click **Restart**
3. Wait 30 seconds

### Step 5: Test
Visit: https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/admin

Should work now! ✅

---

## Alternative: Upload via FTP

### Step 1: Get FTP Credentials
1. Azure Portal → App Service → Deployment Center
2. Click **FTPS credentials**
3. Copy: Hostname, Username, Password

### Step 2: Connect with FileZilla
1. Open FileZilla
2. Host: `ftps://your-hostname`
3. Username: `your-username`
4. Password: `your-password`
5. Connect

### Step 3: Upload web.config
1. Navigate to: `/site/wwwroot/public/`
2. Upload `frontend/public/web.config` from your local machine
3. Restart app service

---

## Permanent Fix: Update Deployment

The deployment workflow should copy web.config, but it's not working. Here's why:

### Issue: web.config in Wrong Location

The workflow creates `backend/web.config` but needs `backend/public/web.config`

### Fix: Rebuild and Redeploy

```bash
cd frontend
npm run build

# Verify web.config is in dist/
ls dist/web.config

# If missing, copy manually
cp public/web.config dist/web.config

# Now deploy
```

---

## Verification Checklist

After manual fix:

- [ ] web.config exists in `/site/wwwroot/public/`
- [ ] App service restarted
- [ ] `/admin` loads without 404
- [ ] Can navigate between admin tabs
- [ ] Browser back button works

---

## If Still Not Working

### Check IIS Logs
1. Kudu → **Debug console** → **CMD**
2. Navigate to: `LogFiles`
3. Check `http` folder for errors

### Check web.config Syntax
1. Kudu → Navigate to `site/wwwroot/public`
2. Click on `web.config` to view
3. Verify XML is valid (no syntax errors)

### Force Restart
1. Azure Portal → App Service
2. Click **Stop**
3. Wait 10 seconds
4. Click **Start**

---

## Root Cause

The deployment workflow creates two web.config files:
1. `backend/web.config` (for Node.js/IIS)
2. `backend/public/web.config` (for frontend SPA routing)

The second one is missing, causing 404 on `/admin`.

---

## Success Criteria

✅ `/admin` loads admin dashboard  
✅ No 404 errors  
✅ Can navigate admin tabs  
✅ Refresh page works  

---

**This manual fix will work immediately. For permanent fix, we need to update the deployment workflow.**
