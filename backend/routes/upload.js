import express from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { uploadToAzure, deleteFromAzure } from '../services/azureStorage.js';

const router = express.Router();

// Configure multer for memory storage (Azure upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Upload profile picture
router.post('/profile-picture', requireAuth, upload.single('profilePicture'), async (req, res) => {
  try {
    console.log('📸 Profile picture upload request:', {
      user: req.user?.uid,
      userId: req.headers['x-user-id'],
      file: req.file ? { name: req.file.originalname, size: req.file.size } : 'none'
    });

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const User = global.User;
    if (!User) {
      return res.status(500).json({ error: 'User model not available' });
    }

    // Upload to Azure Blob Storage
    const profilePictureUrl = await uploadToAzure(req.file.buffer, req.file.originalname, 'profiles');
    
    // Use authenticated user's Firebase UID
    const searchCriteria = { firebaseUid: req.user.uid };
    
    console.log('🔍 Searching for user with:', searchCriteria);
    
    // Get old profile picture URL for cleanup
    const existingUser = await User.findOne(searchCriteria);
    const oldProfilePicture = existingUser?.profilePicture;
    
    // Update user profile with new picture URL
    const user = await User.findOneAndUpdate(
      searchCriteria,
      { profilePicture: profilePictureUrl },
      { new: true }
    );

    if (!user) {
      console.log('❌ User not found for criteria:', searchCriteria);
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete old profile picture from Azure if it exists
    if (oldProfilePicture && oldProfilePicture.includes('blob.core.windows.net')) {
      try {
        await deleteFromAzure(oldProfilePicture);
        console.log('🗑️ Deleted old profile picture from Azure');
      } catch (err) {
        console.warn('⚠️ Failed to delete old profile picture:', err.message);
      }
    }

    console.log('✅ Profile picture updated successfully:', profilePictureUrl);

    res.json({
      success: true,
      profilePicture: profilePictureUrl,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });
  } catch (error) {
    console.error('❌ Profile picture upload error:', error);
    res.status(500).json({ error: error.message });
  }
});



// Delete profile picture
router.delete('/profile-picture', requireAuth, async (req, res) => {
  try {
    const User = global.User;
    if (!User) {
      return res.status(500).json({ error: 'User model not available' });
    }

    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete from Azure if it exists
    if (user.profilePicture && user.profilePicture.includes('blob.core.windows.net')) {
      try {
        await deleteFromAzure(user.profilePicture);
        console.log('🗑️ Deleted profile picture from Azure');
      } catch (err) {
        console.warn('⚠️ Failed to delete from Azure:', err.message);
      }
    }

    // Remove profile picture from user
    user.profilePicture = null;
    await user.save();

    res.json({ success: true, message: 'Profile picture deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;