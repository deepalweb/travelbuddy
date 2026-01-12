# Azure Blob Storage Setup for Places Cache

## 🎯 Purpose
Cache fetched places data and photos in Azure Blob Storage for:
- Cross-device synchronization
- Reduced API calls
- Faster load times
- Offline data backup

## 📋 Setup Steps

### 1. Create Azure Storage Account
```bash
# In Azure Portal or CLI
az storage account create \
  --name travelbuddystorage \
  --resource-group travelbuddy-rg \
  --location eastus2 \
  --sku Standard_LRS
```

### 2. Create Blob Container
```bash
az storage container create \
  --name places-cache \
  --account-name travelbuddystorage \
  --public-access off
```

### 3. Generate SAS Token
In Azure Portal:
1. Go to Storage Account → Shared access signature
2. Select permissions: Read, Write, Create
3. Set expiry date (e.g., 1 year)
4. Generate SAS token

Or via CLI:
```bash
az storage container generate-sas \
  --account-name travelbuddystorage \
  --name places-cache \
  --permissions rwc \
  --expiry 2025-12-31 \
  --https-only
```

### 4. Update Configuration
In `lib/services/azure_blob_service.dart`:
```dart
static const String _storageAccount = 'travelbuddystorage';
static const String _containerName = 'places-cache';
static const String _sasToken = 'YOUR_SAS_TOKEN_HERE';
```

**Security Note:** Store SAS token in environment variables for production:
```dart
static final String _sasToken = const String.fromEnvironment('AZURE_BLOB_SAS_TOKEN');
```

## 🔧 Usage

### Automatic Caching
Places are automatically saved to Azure Blob when fetched:
```dart
// Happens automatically in PlacesService
final places = await placesService.fetchPlacesPipeline(...);
// ✅ Saved to: Memory → Local Storage → Azure Blob
```

### Manual Photo Upload
```dart
final azureBlobService = AzureBlobService();
final photoUrl = await azureBlobService.savePhotoToBlob(photoFile, placeId);
```

### Cache Photo from URL
```dart
final cachedUrl = await azureBlobService.cachePhotoToBlob(originalUrl, placeId);
```

## 📊 Data Structure

### Places JSON Format
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "places": [
    {
      "id": "ChIJ...",
      "name": "Eiffel Tower",
      "type": "tourist_attraction",
      "rating": 4.7,
      "address": "Paris, France",
      "photoUrl": "https://...",
      "description": "...",
      "latitude": 48.8584,
      "longitude": 2.2945
    }
  ]
}
```

### Blob Naming Convention
- Places data: `{lat}_{lng}_{query}.json`
- Photos: `photos/{placeId}-{timestamp}.jpg`
- Cached photos: `photos/{placeId}-cached.jpg`

## 💰 Cost Estimation

**Storage Costs (Standard LRS):**
- First 50 TB: $0.0184/GB/month
- 1000 places (~5MB): $0.09/month
- 1000 photos (~500MB): $9.20/month

**Transaction Costs:**
- Write: $0.05 per 10,000 operations
- Read: $0.004 per 10,000 operations

**Estimated Monthly Cost:** ~$10-15 for moderate usage

## 🔒 Security Best Practices

1. **Use SAS tokens** (not account keys)
2. **Set expiration dates** on SAS tokens
3. **Limit permissions** (only Read/Write/Create)
4. **Enable HTTPS only**
5. **Use Azure Key Vault** for production tokens
6. **Enable blob versioning** for data recovery

## 🚀 Benefits

✅ **Cross-device sync** - Same cache across all user devices
✅ **Reduced API costs** - Fewer Google Places API calls
✅ **Faster loading** - CDN-backed blob storage
✅ **Offline support** - Data available even without internet
✅ **Scalable** - Handles millions of places
✅ **Reliable** - 99.9% uptime SLA

## 📈 Monitoring

View usage in Azure Portal:
- Storage Account → Metrics
- Monitor: Transactions, Ingress, Egress
- Set alerts for high usage

## 🔄 Cache Invalidation

Places cache expires after 1 hour (configurable):
```dart
static const Duration _cacheExpiry = Duration(hours: 1);
```

Manual cache clear:
```dart
await placesService.clearCache();
await placesService.clearOfflineStorage();
// Azure Blob cache persists for cross-device sync
```
