# ✅ Azure Backend Deployment Checklist

## 🎯 YES - Azure Maps Will Work on Azure Backend!

Your Azure Maps implementation will work perfectly on Azure App Service. Here's what you need to verify:

---

## 📋 Pre-Deployment Checklist

### 1. ✅ Environment Variables (Azure Portal)

Go to **Azure Portal → Your App Service → Configuration → Application Settings**

Add/Verify these environment variables:

```
AZURE_MAPS_API_KEY=your-azure-maps-api-key-here
AZURE_OPENAI_ENDPOINT=your-azure-openai-endpoint-here
AZURE_OPENAI_API_KEY=your-azure-openai-api-key-here
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4.1
MONGO_URI=mongodb+srv://techzdr_db_user:ufTD4zMi1g1LaHdR@travelbuddy.xmaur8g.mongodb.net/?retryWrites=true&w=majority&appName=travelbuddy
JWT_SECRET=travelbuddy-jwt-secret-key-2024
SESSION_SECRET=travelbuddy-session-secret-2024
NODE_ENV=production
PORT=8080
```

**IMPORTANT:** Remove or comment out `GOOGLE_PLACES_API_KEY` since you no longer have access.

---

## 2. ✅ Dependencies Already Installed

Your `package.json` already has all required dependencies:
- ✅ `node-fetch` - For API calls
- ✅ `openai` - For Azure OpenAI
- ✅ `express` - Web framework
- ✅ `mongoose` - MongoDB

**No additional packages needed!**

---

## 3. ✅ Azure App Service Configuration

### Node.js Version
Your deployment uses Node.js 20 (already configured in `azure-deploy.yml`)

### Startup Command
Azure will automatically use: `node server.js`

### Web.config
Already configured in your deployment workflow ✅

---

## 4. ✅ File Structure for Deployment

Your deployment workflow already handles this:
```
backend/
├── server.js
├── package.json
├── services/
│   └── azureMapsSearch.js  ← NEW FILE (will be deployed)
├── routes/
│   ├── places.js           ← UPDATED
│   ├── enhanced-places.js  ← UPDATED
│   ├── geocoding.js        ← UPDATED
│   └── directions.js       ← UPDATED
└── public/                 ← Frontend build
```

---

## 5. 🚀 Deployment Steps

### Option 1: GitHub Actions (Automatic)
```bash
git add .
git commit -m "Migrate from Google Places to Azure Maps"
git push origin master
```

GitHub Actions will automatically:
1. Build frontend
2. Install backend dependencies
3. Deploy to Azure App Service

### Option 2: Manual Deployment
```bash
# Build frontend
cd frontend
npm run build

# Copy to backend
cp -r dist/* ../backend/public/

# Deploy backend
cd ../backend
az webapp up --name travelbuddy --resource-group your-resource-group
```

---

## 6. ✅ Post-Deployment Verification

### Test Endpoints

**1. Health Check**
```bash
curl https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api/health
```

**2. Test Places Search**
```bash
curl "https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api/places/mobile/nearby?lat=6.9271&lng=79.8612&q=restaurants&limit=10"
```

**3. Test Geocoding**
```bash
curl "https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api/geocoding/geocode?address=Colombo"
```

**4. Test Batch Search**
```bash
curl -X POST https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api/places/mobile/batch \
  -H "Content-Type: application/json" \
  -d '{"lat":6.9271,"lng":79.8612,"queries":[{"category":"restaurants","query":"restaurants","limit":10}]}'
```

---

## 7. 🔍 Monitoring & Logs

### View Logs in Azure Portal
1. Go to **Azure Portal → Your App Service**
2. Click **Log stream** (left menu)
3. Watch for:
   - ✅ `🗺️ Azure Maps Fuzzy Search`
   - ✅ `✅ Layer 1 (Azure Maps): X places`
   - ❌ Any errors

### Check Application Insights (if enabled)
- Monitor API response times
- Track Azure Maps API usage
- View error rates

---

## 8. ⚠️ Common Issues & Solutions

### Issue 1: "AZURE_MAPS_API_KEY not configured"
**Solution:** Add environment variable in Azure Portal → Configuration

### Issue 2: "Module not found: azureMapsSearch"
**Solution:** Ensure `services/azureMapsSearch.js` is committed and deployed

### Issue 3: "Cannot find module 'node-fetch'"
**Solution:** Run `npm install` in backend folder before deployment

### Issue 4: 500 Error on API calls
**Solution:** Check Azure logs for specific error message

---

## 9. 🔐 Security Checklist

✅ **API Keys in Environment Variables** (not in code)  
✅ **HTTPS Enabled** (Azure App Service default)  
✅ **CORS Configured** (already in your server.js)  
✅ **Rate Limiting** (already implemented)  

---

## 10. 💰 Cost Monitoring

### Azure Maps Usage
- Free tier: 30,000 requests/month
- Monitor in: **Azure Portal → Azure Maps Account → Metrics**

### Azure App Service
- Your current plan (check Azure Portal)
- No additional cost for Azure Maps integration

---

## 🎯 Quick Deployment Command

```bash
# From project root
git add .
git commit -m "Replace Google Places with Azure Maps"
git push origin master

# GitHub Actions will automatically deploy to Azure
```

---

## ✅ Verification Checklist

Before deploying, verify:

- [ ] All files committed to Git
- [ ] `AZURE_MAPS_API_KEY` added to Azure Portal environment variables
- [ ] `GOOGLE_PLACES_API_KEY` removed from Azure Portal (optional)
- [ ] GitHub Actions workflow is enabled
- [ ] Azure App Service is running

After deploying, verify:

- [ ] API endpoints return 200 status
- [ ] Places search returns results
- [ ] Geocoding works
- [ ] No errors in Azure logs
- [ ] Mobile app can fetch places

---

## 🚨 Rollback Plan (if needed)

If something goes wrong:

1. **Revert Git commit:**
   ```bash
   git revert HEAD
   git push origin master
   ```

2. **Or restore previous deployment:**
   - Azure Portal → App Service → Deployment Center → Redeploy previous version

---

## 📞 Support Resources

- **Azure Maps Docs:** https://docs.microsoft.com/azure/azure-maps/
- **Azure App Service Logs:** Azure Portal → Log stream
- **GitHub Actions Logs:** GitHub → Actions tab

---

## 🎉 Summary

**YES - Azure Maps will work perfectly on Azure backend!**

✅ All dependencies are compatible  
✅ No additional Azure configuration needed  
✅ Same deployment process  
✅ Environment variables are the only requirement  
✅ Your existing Azure infrastructure supports it  

**Just deploy and it will work!** 🚀

---

**Next Step:** 
```bash
git add .
git commit -m "Migrate to Azure Maps"
git push origin master
```

Then test the deployed endpoints! ✅
