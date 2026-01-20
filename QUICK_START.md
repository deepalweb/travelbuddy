# 🚀 Quick Start - Two-API-Key Implementation

## What's Been Done ✅

The code foundation is ready for the two-API-key strategy:

1. **✅ Frontend updated** - `frontend/index.html` now supports environment variables
2. **✅ Configuration template created** - `frontend/.env.example` shows what to configure
3. **✅ Implementation guide created** - `IMPLEMENTATION_STEPS.md` with complete steps
4. **✅ Code committed & pushed** - All changes in GitHub

## What You Need to Do 🎯

### Phase 1: Create New Frontend API Key (5-10 mins)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new API key named "TravelBuddy Web Maps (Frontend)"
3. Set **Application Restrictions** to **HTTP referrers**:
   - `https://travelbuddylk.com/*`
   - `http://localhost:3000/*`
   - `http://localhost:5173/*`
4. Set **API Restrictions** to:
   - Maps JavaScript API
   - Places API
5. Copy your new key

### Phase 2: Create Local Environment Files (2 mins)

Create `frontend/.env`:
```bash
VITE_GOOGLE_MAPS_API_KEY=<your_new_frontend_key_here>
VITE_REACT_APP_API_URL=http://localhost:5000
```

Create `frontend/.env.production`:
```bash
VITE_GOOGLE_MAPS_API_KEY=<your_new_frontend_key_here>
VITE_REACT_APP_API_URL=https://api.travelbuddylk.com
```

### Phase 3: Test Locally (5-10 mins)

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev

# Then:
# 1. Open http://localhost:5173
# 2. Go to Community → Review a Place
# 3. Map should load ✅
# 4. Try searching for places ✅
```

### Phase 4: Deploy to Production (10-15 mins)

1. Set environment variable in your hosting:
   ```
   VITE_GOOGLE_MAPS_API_KEY=<your_new_frontend_key>
   ```
2. Rebuild and deploy:
   ```bash
   npm run build
   ```
3. Test at `https://travelbuddylk.com/community`

## 📚 Full Details

See `IMPLEMENTATION_STEPS.md` for:
- Detailed step-by-step instructions
- Troubleshooting guide
- Complete verification checklist
- Security best practices
- Why two keys are needed

## 🆘 Need Help?

If you get errors:

- **RefererNotAllowedMapError**: Your new frontend key wasn't created with HTTP referrer restrictions
- **REQUEST_DENIED from backend**: Backend key should still be the old IP-restricted key (don't change backend .env)
- **Maps still not loading**: Clear cache, restart dev server, check browser console

---

**Start with Phase 1: Create the new frontend API key in Google Cloud Console** → [Google Cloud Console](https://console.cloud.google.com/)
