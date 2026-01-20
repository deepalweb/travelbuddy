# Google Maps API Configuration Issue

## Problem
The map is not loading in post creation on `/community` page with error:
```
Google Maps JavaScript API error: RefererNotAllowedMapError
Your site URL to be authorized: https://travelbuddylk.com/community
```

### Root Causes (Multiple Issues)
1. **HTTP Referrer Restrictions**: Domain not authorized in API key config
2. **IP Address Restrictions**: API key restricted to backend IPs only (127.0.0.1, 128.85.209.147, 172.175.18.112, 20.*.*.*, 4.*.*.*, 9.*.*.*)
3. **Client-Side API Call**: Frontend makes direct Google Maps API calls from user browsers (different IPs than your servers)

## Solution

### ⚠️ PRIMARY ISSUE: IP Address Restrictions
Your API key currently has **IP address restrictions** enabled that **block all client-side requests**.

**Current Restricted IPs:**
```
127.0.0.1/32                    (localhost)
128.85.209.147/32               (Azure backend)
172.175.18.112/32               (Azure backend)
20.119.155.0/32                 (Azure backend)
20.41.42.28/32                  (Azure backend)
4.153.128.98/32                 (Azure backend)
4.153.208.221/32                (Azure backend)
9.169.131.1/32                  (Azure backend)
```

**Why This Breaks Maps:**
- Users access `https://travelbuddylk.com/community` from their home/mobile IP
- Frontend JavaScript calls Google Maps API directly from their browser
- User's IP ≠ your server IPs → Request blocked → Map won't load

### Fix: Remove IP Restrictions for Client-Side Maps
Since Google Maps is called from the **frontend (browser)**, not backend:

**Step 1: Remove IP Address Restrictions**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services → Credentials**
3. Click on API key: `AIzaSyDTV_5KiXOuYRtG2TEMIvrHPCsht3sSWEQ`
4. Scroll to **Application restrictions**
5. Change from **IP addresses** to **HTTP referrers (web sites)**

**Step 2: Set HTTP Referrer Restrictions Only**
In the "Website restrictions" field, add:
```
https://travelbuddylk.com/*
http://localhost:3000/*
http://localhost:5173/*
```

**Step 3: Save & Test**
- Click **Save**
- Wait 2-5 minutes
- Clear browser cache (Ctrl+Shift+Delete)
- Visit `https://travelbuddylk.com/community` and create a post
- Map should now load ✓

### Alternative Approach (If Backend Calls Google Maps)
If you want to keep IP restrictions because your **backend** also calls Google Maps APIs:

1. **Backend Calls**: Use separate API key restricted to server IPs
2. **Frontend Maps**: Use unrestricted (HTTP referrer only) API key for client-side maps
3. Keep two API keys: one for backend, one for frontend

But currently, you have one key used for both, causing the conflict.

### Why IP + Frontend Maps Don't Mix
- ✅ IP restrictions work for: Server-to-server calls, backend services
- ❌ IP restrictions fail for: Browser-based JavaScript, client-side requests
- ✅ HTTP referrer restrictions work for: Browser-based JavaScript, frontend maps
- ❌ HTTP referrer restrictions fail for: Server-to-server calls

**Current Setup:** Browser-based maps with server IP restrictions = **blocks all users**

## How Google Maps Script is Loaded

In `frontend/index.html` (line 44):
```html
<script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDTV_5KiXOuYRtG2TEMIvrHPCsht3sSWEQ&libraries=places"></script>
```

This script loads the Google Maps library globally for use in:
- **LocationPicker.tsx** - Location selection in post creation
- **InteractiveMap.tsx** - Interactive map with draggable marker
- **StoryMap.tsx** - Map view in community feed
- **TripMap.tsx** - Map view in trip planning
- Other map-based components

## Map Components Using Google Maps

### 1. LocationPicker Component
- **Path**: `frontend/src/components/LocationPicker.tsx`
- **Use**: Select location for posting/reviewing places
- **Features**:
  - Search by address (Nominatim/OpenStreetMap)
  - Get current location (browser geolocation)
  - Manual coordinate entry
  - Address display

### 2. InteractiveMap Component
- **Path**: `frontend/src/components/InteractiveMap.tsx`
- **Use**: Embedded map for location selection
- **Features**:
  - Draggable marker
  - Click to set location
  - Automatic address reverse geocoding
  - Zoom and pan controls

### 3. Fallback: OpenStreetMap (Nominatim)
- Used for reverse geocoding addresses
- No API key required
- Alternative when Google Maps unavailable

## API Key Restrictions

### Current Setup ⚠️ BLOCKING MAPS
- **Restriction Type**: IP addresses (blocks client-side requests)
- **Allowed IPs**: Azure backend servers only
- **Problem**: Frontend maps called from user browsers → Different IPs → Blocked

### Recommended Configuration ✅
- **Restriction Type**: HTTP referrers only
- **Allowed Domains**: `https://travelbuddylk.com/*` and localhost
- **Benefit**: Allows user browsers to access maps
- **Security**: Still protected by domain-based restrictions

### Best Practices for Different Use Cases

**Use Case 1: Frontend Maps (Your Current Setup)**
```
Restriction: HTTP referrers only
Domains:
  - https://travelbuddylk.com/*
  - http://localhost:3000/*
  - http://localhost:5173/*
```

**Use Case 2: Backend API Calls**
```
Restriction: IP addresses
IPs: Your backend server IPs
(Keep IP restrictions for backend services)
```

**Use Case 3: Both Frontend + Backend (Recommended)**
```
Create TWO separate API keys:
1. Frontend Key: HTTP referrers only (user browsers)
2. Backend Key: IP restricted (server-to-server calls)

This provides better security and prevents conflicts.
```

### Why You're Getting RefererNotAllowedMapError
1. You have IP restrictions enabled
2. IP restrictions reject all requests not from those IPs
3. Browser requests from users fail before checking referrer
4. Error message mentions "referrer" but real issue is IP block

### Environment Variable Setup
Add to `.env` files:
```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSyDTV_5KiXOuYRtG2TEMIvrHPCsht3sSWEQ
```

Then update `index.html`:
```html
<script async defer src="https://maps.googleapis.com/maps/api/js?key=${VITE_GOOGLE_MAPS_API_KEY}&libraries=places"></script>
```

## Troubleshooting

### Issue: RefererNotAllowedMapError persists
- **Solution**: Clear browser cache completely
- **Solution**: Try incognito/private browsing
- **Solution**: Wait up to 5 minutes for API changes to propagate
- **Solution**: Verify the exact referrer URL in developer console

### Issue: Maps API shows blank
- **Check**: Browser console for errors (F12)
- **Check**: Network tab to see if API script loaded
- **Check**: API key hasn't been regenerated

### Issue: Can't authorize `https://travelbuddylk.com/community`
- **Reason**: You need the parent domain pattern `https://travelbuddylk.com/*`
- **Not needed**: Individual page URLs (community, community/*, etc.)
- **Wildcard**: The `/*` pattern covers all subpaths automatically

## Related Components Status
- ✅ LocationPicker: Fully functional
- ✅ InteractiveMap: Fully functional
- ✅ StoryMap: Awaiting referrer authorization
- ✅ Community posting: Blocked until referrers configured
- ⚠️ All map features: Require proper API key authorization
