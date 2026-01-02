import express from 'express';
import { upload, uploadToAzure } from '../services/azureStorage.js';

const router = express.Router();

// Upload single image
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const imageUrl = await uploadToAzure(req.file);
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
    
    const uploadPromises = req.files.map(file => uploadToAzure(file));
    const imageUrls = await Promise.all(uploadPromises);
    
    console.log('✅ Upload successful:', imageUrls);
    res.json({ urls: imageUrls });
  } catch (error) {
    console.error('❌ Multiple image upload error:', error.message);
    res.status(500).json({ error: 'Failed to upload images', details: error.message });
  }
});

export default router;
