import { BlobServiceClient } from '@azure/storage-blob';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || 'travelbuddy-images';

let blobServiceClient;
let containerClient;

// Initialize Azure Blob Storage
if (connectionString) {
  try {
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Create container if it doesn't exist (private access, no public blob access)
    containerClient.createIfNotExists()
      .then(() => console.log('✅ Azure Blob Storage initialized'))
      .catch(err => console.error('❌ Failed to create container:', err.message));
  } catch (error) {
    console.error('❌ Azure Blob Storage initialization failed:', error.message);
  }
}

// Multer memory storage
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'));
    }
  }
});

// Upload to Azure Blob Storage
export async function uploadToAzure(file) {
  console.log('🔵 uploadToAzure called:', { hasContainer: !!containerClient, fileName: file.originalname });
  
  if (!containerClient) {
    console.error('❌ Azure Blob Storage not configured. Check AZURE_STORAGE_CONNECTION_STRING');
    throw new Error('Azure Blob Storage not configured');
  }

  const blobName = `${uuidv4()}-${file.originalname}`;
  console.log('💾 Uploading blob:', blobName);
  
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: { blobContentType: file.mimetype }
  });

  console.log('✅ Blob uploaded:', blockBlobClient.url);
  return blockBlobClient.url;
}

// Delete from Azure Blob Storage
export async function deleteFromAzure(imageUrl) {
  if (!containerClient) return;
  
  try {
    const blobName = imageUrl.split('/').pop();
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.deleteIfExists();
  } catch (error) {
    console.error('Failed to delete blob:', error.message);
  }
}
