import express from 'express';
import { authenticateJWT, requireRole } from '../../middleware/auth.js';
import { validateUser } from '../../middleware/validation.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticateJWT);

// Get user profile
router.get('/profile', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
}));

// Update user profile
router.put('/profile', validateUser, asyncHandler(async (req, res) => {
  const updates = req.body;
  delete updates.password;
  
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-password');
  
  res.json(user);
}));

export default router;