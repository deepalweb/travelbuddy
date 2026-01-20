# Google Maps API Configuration Issue

## Problem
The map is not loading in post creation on `/community` page with error:
```
Google Maps JavaScript API error: RefererNotAllowedMapError
Your site URL to be authorized: https://travelbuddylk.com/community
```

## Root Cause
The Google Maps API key has HTTP referrer restrictions that don't include all necessary URLs for your domain.

## Solution

### Step 1: Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to **APIs & Services → Credentials**

### Step 2: Find Your API Key
Look for the key with ID: `AIzaSyDTV_5KiXOuYRtG2TEMIvrHPCsht3sSWEQ`

### Step 3: Update Application Restrictions
1. Click on the API key to edit it
2. Scroll to "Application restrictions"
3. Select **HTTP referrers (web sites)**

### Step 4: Add Authorized Referrers
In the "Website restrictions" field, add these referrer patterns:
```
https://travelbuddylk.com/*
http://localhost:3000/*
http://localhost:5173/*
```

**Important**: Use wildcard `/*` to allow all subpaths (pages) on your domain.

### Step 5: Save Changes
Click **Save** to apply the changes.

### Step 6: Test
- Wait 2-5 minutes for changes to propagate
- Clear browser cache (Ctrl+Shift+Delete)
- Visit `https://travelbuddylk.com/community`
- Click "Review a Place" button to open the create post modal
- The map should now load without errors

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

### Current Setup
- **API Services**: Maps JavaScript API, Places API, Geocoding API
- **Restriction Type**: HTTP referrers
- **Allowed Domains**: Should include `https://travelbuddylk.com/*`

### Recommended Best Practices
1. ✅ Always use HTTP referrer restrictions (not unrestricted keys)
2. ✅ Use wildcard patterns for subpaths (`domain.com/*`)
3. ✅ Include development URLs (`localhost:3000/*`, `localhost:5173/*`)
4. ✅ Avoid hardcoding API keys in source code
5. ✅ Use environment variables for sensitive keys

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
