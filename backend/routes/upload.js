import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { bypassAuth } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const userId = req.user?.uid || 'anonymous';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${userId}-${timestamp}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Upload profile picture
router.post('/profile-picture', bypassAuth, upload.single('profilePicture'), async (req, res) => {
  try {
    console.log('📸 Profile picture upload request:', {
      user: req.user?.uid,
      file: req.file ? { name: req.file.filename, size: req.file.size } : 'none'
    });

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const User = global.User;
    if (!User) {
      return res.status(500).json({ error: 'User model not available' });
    }

    const profilePictureUrl = `/uploads/profiles/${req.file.filename}`;
    
    // Update user profile with new picture URL
    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { profilePicture: profilePictureUrl },
      { new: true }
    );

    if (!user) {
      console.log('❌ User not found for uid:', req.user.uid);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ Profile picture updated successfully:', profilePictureUrl);

    res.json({
      success: true,
      profilePicture: profilePictureUrl,
      filename: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });
  } catch (error) {
    console.error('❌ Profile picture upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get uploaded file
router.get('/profiles/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete profile picture
router.delete('/profile-picture', bypassAuth, async (req, res) => {
  try {
    const User = global.User;
    if (!User) {
      return res.status(500).json({ error: 'User model not available' });
    }

    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete old file if it exists
    if (user.profilePicture && user.profilePicture.startsWith('/uploads/profiles/')) {
      const filename = path.basename(user.profilePicture);
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
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