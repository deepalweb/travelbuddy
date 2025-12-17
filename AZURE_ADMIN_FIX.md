# Fix: Admin Panel 404 on Azure

## Problem
- Admin panel works on localhost: `http://localhost:3000/admin` ✅
- Admin panel fails on Azure: 404 error ❌
- Error: `admin:1 Failed to load resource: the server responded with a status of 404 (Not Found)`

## Root Cause
Azure IIS doesn't handle React Router client-side routing by default. When you navigate to `/admin`, IIS looks for a physical file called `admin` which doesn't exist.

## Solution

### Step 1: Verify web.config is in build output

After running `npm run build`, check that `dist/web.config` exists:

```bash
cd frontend
npm run build
dir dist\web.config  # Windows
# or
ls dist/web.config   # Linux/Mac
```

If `web.config` is missing, it means the file wasn't copied during build.

### Step 2: Rebuild and Deploy

```bash
cd frontend
npm run build
```

The `dist/` folder should now contain:
```
dist/
├── index.html
├── web.config          ← Must be present
├── assets/
│   ├── index-*.js
│   └── index-*.css
├── robots.txt
├── sitemap.xml
└── ...
```

### Step 3: Deploy to Azure

Upload the entire `dist/` folder to Azure App Service.

**Via Azure Portal:**
1. Go to Azure Portal → Your App Service
2. Development Tools → Advanced Tools (Kudu)
3. Click "Go"
4. Debug console → CMD
5. Navigate to `site/wwwroot`
6. Upload all files from `dist/` folder
7. Verify `web.config` is present in `wwwroot/`

**Via Git Deployment:**
```bash
git add .
git commit -m "fix: Add web.config for Azure SPA routing"
git push azure master
```

### Step 4: Verify on Azure

1. Open: `https://your-app.azurewebsites.net/admin`
2. Should load admin panel (not 404)
3. Check browser console for errors

## Alternative: Manual web.config Upload

If build doesn't copy web.config, manually upload it:

1. Go to Kudu: `https://your-app.scm.azurewebsites.net`
2. Debug Console → CMD
3. Navigate to `site/wwwroot`
4. Click "+" to upload file
5. Upload `frontend/public/web.config`
6. Restart app service

## Verification Checklist

- [ ] `web.config` exists in `frontend/public/`
- [ ] `npm run build` completes successfully
- [ ] `dist/web.config` exists after build
- [ ] `web.config` uploaded to Azure `wwwroot/`
- [ ] App service restarted
- [ ] `/admin` route works on Azure
- [ ] No 404 errors in browser console

## Testing

### Test Locally:
```bash
cd frontend
npm run build
npm run preview
# Open http://localhost:4173/admin
```

### Test on Azure:
```
https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/admin
```

Should see admin dashboard, not 404.

## Troubleshooting

### Issue: web.config not in dist/ after build
**Fix:** Vite config updated to include `publicDir: 'public'`

### Issue: Still getting 404 on Azure
**Fix:** 
1. Check IIS logs in Kudu
2. Verify web.config syntax is correct
3. Restart app service
4. Clear browser cache

### Issue: Admin loads but shows blank page
**Fix:** Check browser console for JavaScript errors

### Issue: API calls fail from admin
**Fix:** Check CORS settings in backend

## What web.config Does

```xml
<!-- Rewrites all non-file requests to index.html -->
<action type="Rewrite" url="/index.html" />
```

This tells IIS:
- If request is for `/admin` → serve `index.html`
- React Router handles the `/admin` route client-side
- Admin panel loads correctly

## Expected Behavior

**Before Fix:**
```
User visits: /admin
IIS looks for: /admin file
Result: 404 Not Found ❌
```

**After Fix:**
```
User visits: /admin
IIS serves: /index.html
React Router: Loads AdminDashboard component
Result: Admin panel displays ✅
```

## Additional Notes

- This fix also enables Google Sign-In on Azure (removes COOP headers)
- Works for all React Router routes: `/admin`, `/profile`, `/trips`, etc.
- No backend changes needed
- Compatible with Azure App Service + IIS

## Success Criteria

✅ Admin panel accessible at `/admin` on Azure  
✅ No 404 errors  
✅ All admin features working  
✅ Can navigate between admin tabs  
✅ Browser back/forward buttons work  

---

**If issue persists after following these steps, check:**
1. Azure App Service logs
2. Browser network tab for failed requests
3. IIS rewrite module is installed (should be by default)
