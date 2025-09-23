# Map Location Setup Guide

## 🗺️ Two Map Options Available

### Option 1: OpenStreetMap (Recommended - No API Key Needed)
- **✅ Free forever** - No API keys or accounts required
- **✅ No rate limits** - Unlimited usage
- **✅ Privacy-focused** - No tracking
- **✅ Works immediately** - Already integrated

### Option 2: Google Maps (Optional - Requires API Key)
- **Better geocoding** accuracy
- **More detailed maps** and satellite view
- **Requires Google Cloud account** and API key setup

## 🚀 Quick Start (No Setup Required)

1. Go to Profile → Merchant → Create Deal
2. Click **"🗺️ OSM"** button (OpenStreetMap)
3. Search for address or click on map
4. Select location and save

**That's it!** No API keys needed.

## 🔑 Google Maps Setup (Optional)

### Backend Environment Variable (Secure Method)
1. Add to your backend `.env` file:
```
GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

2. Restart backend server
3. Click **"📍 Google"** button in deal creation

## 🚀 Test the Map

1. Restart your development server: `npm run dev`
2. Go to Profile → Merchant → Create Deal
3. Click "📍 Map" button
4. You should see an interactive Google Map

## 🔧 Fallback Mode

If Google Maps fails to load, the component will show:
- Manual address input field
- "Google Maps not available" message
- Users can still enter addresses manually

## 💰 Pricing

Google Maps has a free tier:
- **28,000 map loads per month** (free)
- **40,000 geocoding requests per month** (free)

For production, monitor usage in Google Cloud Console.