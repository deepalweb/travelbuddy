# Project Cleanup Plan

## Files to Remove

### Root Directory - Debug/Test Files
- [ ] `check-azure-openai.js` - Debug script
- [ ] `delete-deals.js` - Debug script  
- [ ] `health-check.js` - Duplicate (exists in backend/)
- [ ] `test-api.js` - Debug script
- [ ] `test-connectivity.js` - Debug script
- [ ] `test-cors-fix.html` - Debug file
- [ ] `test-cors.html` - Debug file
- [ ] `test-deals-api.js` - Debug script
- [ ] `test-deals-cors.html` - Debug file
- [ ] `verify-azure-status.js` - Debug script
- [ ] `start-server.js` - Duplicate functionality
- [ ] `api-config.js` - Unused config

### Root Directory - Documentation (Keep Essential Only)
- [ ] `DEBUG_INSTRUCTIONS.md` - Development only
- [ ] `PRODUCTION_FIXES.md` - Outdated
- [ ] `PRODUCTION_READY.md` - Outdated
- [ ] `PROFILE_UPLOAD_README.md` - Specific feature doc
- [ ] `SUBSCRIPTION_IMPLEMENTATION.md` - Implementation notes
- [ ] `MOBILE_TRANSPORT_AGENT_PLAN.md` - Planning doc
- [ ] `status-dashboard.html` - Debug dashboard

### Backend Directory - Debug/Test Files
- [ ] `backend/debug-deals.js` - Debug script
- [ ] `backend/delete-deals.js` - Debug script
- [ ] `backend/health-check.js` - Duplicate
- [ ] `backend/test-api.js` - Debug script
- [ ] `backend/test-azure-openai.js` - Debug script
- [ ] `backend/test-deals.js` - Debug script

### Backend Routes - Unused/Debug Routes
- [ ] `backend/routes/demo-auth.js` - Demo only
- [ ] `backend/routes/role-test.js` - Test only
- [ ] `backend/routes/test.js` - Test only
- [ ] `backend/routes/setup.js` - Setup only

### Mobile App - Debug Files
- [ ] `travel_buddy_mobile/lib/check_backend.dart` - Debug
- [ ] `travel_buddy_mobile/lib/debug_create_post.dart` - Debug
- [ ] `travel_buddy_mobile/lib/debug_network.dart` - Debug
- [ ] `travel_buddy_mobile/lib/debug_user_posts.dart` - Debug
- [ ] `travel_buddy_mobile/lib/main_complex.dart` - Alternative main
- [ ] `travel_buddy_mobile/debug_user_ownership.dart` - Debug
- [ ] `travel_buddy_mobile/DEBUG_CLEANUP.md` - Debug doc
- [ ] `travel_buddy_mobile/REMOVED_FILES.md` - Cleanup doc

### Mobile App - Build Artifacts (Can be regenerated)
- [ ] `travel_buddy_mobile/.dart_tool/` - Build cache
- [ ] `travel_buddy_mobile/android/.gradle/` - Build cache
- [ ] `travel_buddy_mobile/android/.kotlin/` - Build cache

### Environment Files (Keep templates only)
- [ ] `backend/.env` - Contains secrets (keep .env.template)
- [ ] `frontend/.env` - Contains secrets
- [ ] `travel_buddy_mobile/.env` - Contains secrets

## Files to Keep

### Essential Configuration
- ✅ `package.json` files
- ✅ `.gitignore` files
- ✅ `README.md` (main)
- ✅ `web.config`
- ✅ `.deployment`
- ✅ `.deployignore`

### Production Scripts
- ✅ `deploy.cmd`
- ✅ `deploy.sh`
- ✅ `restore-commit.cmd`
- ✅ `set-azure-env.ps1`

### Essential Documentation
- ✅ `AZURE_STATUS_CHECKLIST.md`
- ✅ `README.md`

### Backend Production Files
- ✅ `backend/server.js`
- ✅ All models, middleware, services
- ✅ Production routes (non-test/debug)

### Frontend Production Files
- ✅ All src/ files
- ✅ Build configuration files

### Mobile Production Files
- ✅ `lib/` (excluding debug files)
- ✅ `android/app/` (core files)
- ✅ `ios/` (core files)
- ✅ `pubspec.yaml`

## Cleanup Commands

```bash
# Remove root debug files
rm check-azure-openai.js delete-deals.js health-check.js test-*.js test-*.html verify-azure-status.js start-server.js api-config.js status-dashboard.html

# Remove documentation files
rm DEBUG_INSTRUCTIONS.md PRODUCTION_FIXES.md PRODUCTION_READY.md PROFILE_UPLOAD_README.md SUBSCRIPTION_IMPLEMENTATION.md MOBILE_TRANSPORT_AGENT_PLAN.md

# Remove backend debug files
rm backend/debug-deals.js backend/delete-deals.js backend/health-check.js backend/test-*.js

# Remove backend test routes
rm backend/routes/demo-auth.js backend/routes/role-test.js backend/routes/test.js backend/routes/setup.js

# Remove mobile debug files
rm travel_buddy_mobile/lib/check_backend.dart travel_buddy_mobile/lib/debug_*.dart travel_buddy_mobile/lib/main_complex.dart travel_buddy_mobile/debug_user_ownership.dart travel_buddy_mobile/DEBUG_CLEANUP.md travel_buddy_mobile/REMOVED_FILES.md

# Remove build caches (will be regenerated)
rm -rf travel_buddy_mobile/.dart_tool travel_buddy_mobile/android/.gradle travel_buddy_mobile/android/.kotlin
```

## Estimated Space Savings
- Debug/test files: ~500KB
- Documentation files: ~200KB  
- Build caches: ~50MB
- **Total: ~50MB+**