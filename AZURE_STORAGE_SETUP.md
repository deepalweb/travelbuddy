# Azure Blob Storage Setup Guide

## 🚀 Quick Setup

### 1. Create Azure Storage Account

1. Go to [Azure Portal](https://portal.azure.com)
2. Click "Create a resource" → "Storage account"
3. Fill in:
   - **Resource group**: Create new or use existing
   - **Storage account name**: `travelbuddystorage` (must be unique)
   - **Region**: Choose closest to your users
   - **Performance**: Standard
   - **Redundancy**: LRS (cheapest) or GRS (recommended)
4. Click "Review + Create" → "Create"

### 2. Get Connection String

1. Go to your Storage Account
2. Click "Access keys" in left menu
3. Click "Show keys"
4. Copy **Connection string** from key1 or key2

### 3. Configure Backend

Add to `backend/.env`:

```env
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=travelbuddystorage;AccountKey=YOUR_KEY_HERE;EndpointSuffix=core.windows.net
AZURE_STORAGE_CONTAINER_NAME=travelbuddy-images
```

### 4. Install Dependencies

```bash
cd backend
npm install
```

### 5. Test Upload

```bash
# Start backend
npm start

# Test with curl
curl -X POST http://localhost:8080/api/images/upload \
  -F "image=@test-image.jpg"
```

## 📦 What's Included

- ✅ Azure Blob Storage integration
- ✅ Multer for file handling
- ✅ Image validation (10MB max)
- ✅ UUID for unique filenames
- ✅ Public blob access
- ✅ Multiple image upload (max 2)
- ✅ Error handling

## 🔧 API Endpoints

### Upload Single Image
```
POST /api/images/upload
Content-Type: multipart/form-data
Body: image (file)

Response: { "url": "https://..." }
```

### Upload Multiple Images
```
POST /api/images/upload-multiple
Content-Type: multipart/form-data
Body: images[] (files, max 2)

Response: { "urls": ["https://...", "https://..."] }
```

## 💰 Pricing

**Azure Blob Storage (LRS)**:
- Storage: $0.018 per GB/month
- Operations: $0.004 per 10,000 writes
- Bandwidth: First 100GB free/month

**Example**: 1000 images (5MB each) = 5GB
- Storage: $0.09/month
- Uploads: $0.004 (one-time)
- **Total: ~$0.10/month**

## 🔒 Security

The container is set to **public blob access**:
- ✅ Images are publicly accessible via URL
- ✅ No authentication needed to view
- ❌ Cannot list all blobs
- ❌ Cannot upload without API

## 🎯 Next Steps

1. Set up Azure Storage Account
2. Add connection string to `.env`
3. Run `npm install` in backend
4. Test image upload
5. Deploy to production

## 🐛 Troubleshooting

**Error: "Azure Blob Storage not configured"**
- Check `AZURE_STORAGE_CONNECTION_STRING` in `.env`
- Verify connection string format

**Error: "Failed to upload image"**
- Check storage account exists
- Verify access keys are correct
- Check container permissions

**Images not showing**
- Verify blob access is set to "public"
- Check CORS settings in storage account
