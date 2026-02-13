# Image Upload 404 Error - Fix Guide

## Problem
Mobile app community post image upload failing with 404 error:
```
I/flutter ( 6431): ✅ Image compressed: 340.1 KB → 346.3 KB (saved -1.8%)
I/flutter ( 6431): ❌ Upload failed: 404
```

## Root Cause
The endpoint `/api/images/upload-multiple` exists in the backend but is returning 404. This could be due to:
1. Azure Storage not properly configured
2. Route registration order issue
3. Network/CORS issue

## Solution

### 1. Verify Azure Storage Configuration

Check backend `.env` file has:
```env
AZURE_STORAGE_CONNECTION_STRING=your_connection_string_here
AZURE_STORAGE_CONTAINER_NAME=travelbuddy-images
```

### 2. Test the Endpoint

Run this curl command to test:
```bash
curl -X POST https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api/images/upload-multiple \
  -F "images=@test.jpg"
```

### 3. Check Backend Logs

Look for these log messages in Azure:
- `✅ Image upload routes loaded`
- `📤 Upload request received`
- `✅ Blob uploaded with SAS token`

### 4. Mobile App Enhanced Logging

The ImageService has been updated with detailed logging. Check for:
- `📤 Uploading to: [URL]`
- `📦 Sending X files`
- `📡 Response status: XXX`
- `📥 Response data: [data]`

### 5. Alternative: Use Local Storage Fallback

If Azure Storage is not configured, the app should fall back to local file storage.

## Testing Steps

1. **Test Backend Endpoint**:
   ```bash
   # From your terminal
   curl -X OPTIONS https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api/images/upload-multiple
   ```

2. **Check Mobile Logs**:
   - Run the app with `flutter run`
   - Try uploading an image
   - Check the console for detailed upload logs

3. **Verify Azure Storage**:
   - Go to Azure Portal
   - Check if the storage account exists
   - Verify the container `travelbuddy-images` exists
   - Check if the connection string is correct

## Quick Fix Options

### Option A: Use Base64 Encoding (Temporary)
Instead of multipart upload, encode images as base64 and send in JSON body.

### Option B: Use Firebase Storage
Switch to Firebase Storage for image uploads (already configured).

### Option C: Fix Azure Storage
Ensure Azure Storage is properly configured and accessible.

## Files Modified
- `travel_buddy_mobile/lib/services/image_service.dart` - Added detailed logging
