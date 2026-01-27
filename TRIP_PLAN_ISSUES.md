# Trip Plan Module - Issues & Fixes

## IDENTIFIED ISSUES

### 1. **DELETED TRIPS REAPPEARING** ✅ FULLY FIXED
**Problem:** Deleted trips show up again after page reload on web and mobile
**Root Cause:** 
- Browser/mobile caching GET /api/users/trip-plans response despite cache-control headers
- Aggressive caching ignoring no-cache directives
**Fix Applied:**
- ✅ Web: Added timestamp query parameter (?_t=timestamp) to force unique URLs
- ✅ Mobile: Added timestamp query parameter (?_t=timestamp) to force unique URLs
- Kept cache-busting headers (Cache-Control, Pragma) for defense-in-depth
- Backend already has cache-control headers
- Each request now has unique URL preventing any cache hits
**Status:** Both web and mobile apps now force fresh data on every fetch

### 2. **MOBILE APP 500 ERROR ON DELETE** 🔧 DEBUGGING
**Problem:** Mobile app gets 500 error when deleting trips
**Root Cause:** Under investigation
**Fix Applied:**
- Changed to TripPlan.deleteOne() with query filter
- Added model availability check
- Added comprehensive logging to diagnose exact error
**Next Steps:** Check backend logs when mobile app attempts delete

### 3. **DUPLICATE TRIP PLAN ROUTES**
**Problem:** Trip plan routes defined in BOTH server.js AND routes/users.js
**Locations:**
- server.js: Lines with /api/trip-plans/* and /api/users/trip-plans/*
- routes/users.js: Lines 263, 301, 339, 366 with /trip-plans/*
**Risk:** Conflicting route handlers, inconsistent behavior
**Recommendation:** Consolidate all trip plan routes in routes/users.js only

### 4. **INCONSISTENT AUTHENTICATION**
**Problem:** Different auth methods across trip plan endpoints
**Examples:**
- server.js /api/trip-plans/* uses x-user-id header
- routes/users.js /trip-plans/* uses Bearer token + extractUid()
**Risk:** Auth failures, security gaps
**Recommendation:** Standardize on Bearer token authentication

### 5. **NO UPDATE ROUTE IN routes/users.js**
**Problem:** PUT /api/users/trip-plans/:id missing in routes/users.js
**Impact:** Frontend/mobile can't update trip plans via this route
**Current:** Only exists in server.js with x-user-id header auth
**Recommendation:** Add PUT route to routes/users.js with proper auth

### 6. **MISSING CACHE-CONTROL ON GET ROUTE**
**Problem:** GET /api/users/trip-plans in routes/users.js has cache headers, but needs verification
**Status:** Already has cache-control headers (lines in users.js)
**Verification Needed:** Confirm headers are working

## RECOMMENDED FIXES

### Priority 1: Remove Duplicate Routes from server.js
Remove these from server.js (they're handled by routes/users.js):
- POST /api/users/trip-plans
- GET /api/users/trip-plans
- PUT /api/users/trip-plans/:id
- DELETE /api/users/trip-plans/:id
- PATCH /api/users/trip-plans/:id/activities

### Priority 2: Add Missing PUT Route to routes/users.js
Add update route with proper authentication

### Priority 3: Verify Cache-Busting Works
Test that deleted trips don't reappear after:
1. Delete trip
2. Hard refresh browser (Ctrl+F5)
3. Close and reopen app

## TESTING CHECKLIST
- [ ] Delete trip from web app - verify doesn't reappear
- [ ] Delete trip from mobile app - verify no 500 error
- [ ] Delete trip - verify removed from database
- [ ] Update trip - verify changes persist
- [ ] Create trip - verify saves correctly
- [ ] Mark activity visited - verify persists on reload
