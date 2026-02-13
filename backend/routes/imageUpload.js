import express from 'express';
import { upload, uploadToAzure } from '../services/azureStorage.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Fallback: Save to local uploads folder if Azure is not configured
const saveToLocal = async (file) => {
  const uploadsDir = path.join(__dirname, '../uploads/posts');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  const filename = `${Date.now()}-${file.originalname}`;
  const filepath = path.join(uploadsDir, filename);
  
  fs.writeFileSync(filepath, file.buffer);
  
  // Return URL relative to server
  return `/uploads/posts/${filename}`;
};

// Upload single image
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    let imageUrl;
    try {
      imageUrl = await uploadToAzure(req.file);
    } catch (azureError) {
      console.warn('⚠️ Azure upload failed, using local storage:', azureError.message);
      imageUrl = await saveToLocal(req.file);
    }
    
    res.json({ url: imageUrl });
  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Upload multiple images (max 2)
router.post('/upload-multiple', upload.array('images', 2), async (req, res) => {
  try {
    console.log('📤 Upload request received:', { filesCount: req.files?.length });
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    console.log('📁 Files to upload:', req.files.map(f => ({ name: f.originalname, size: f.size })));
    
    const imageUrls = [];
    
    for (const file of req.files) {
      try {
        const url = await uploadToAzure(file);
        imageUrls.push(url);
      } catch (azureError) {
        console.warn('⚠️ Azure upload failed for file, using local storage:', azureError.message);
        const localUrl = await saveToLocal(file);
        imageUrls.push(localUrl);
      }
    }
    
    console.log('✅ Upload successful:', imageUrls);
    res.json({ urls: imageUrls });
  } catch (error) {
    console.error('❌ Multiple image upload error:', error.message);
    res.status(500).json({ error: 'Failed to upload images', details: error.message });
  }
});

export default router;
