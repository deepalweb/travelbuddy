import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, required: true, enum: ['like', 'comment', 'follow', 'deal', 'system'] },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedId: { type: mongoose.Schema.Types.ObjectId },
  relatedType: { type: String, enum: ['post', 'comment', 'user', 'deal'] },
  isRead: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now, index: true }
});

let Notification;
try {
  Notification = mongoose.model('Notification');
} catch {
  Notification = mongoose.model('Notification', notificationSchema);
}

// Get notifications
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.headers['x-firebase-uid'];
    if (!userId) return res.status(401).json({ error: 'User ID required' });

    const User = mongoose.model('User');
    let user = await User.findOne({ firebaseUid: userId });
    if (!user) user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const limit = Math.min(50, parseInt(req.query.limit || '20'));
    const notifications = await Notification.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread count
router.get('/count', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.headers['x-firebase-uid'];
    if (!userId) return res.status(401).json({ error: 'User ID required' });

    const User = mongoose.model('User');
    let user = await User.findOne({ firebaseUid: userId });
    if (!user) user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const count = await Notification.countDocuments({ userId: user._id, isRead: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark as read
router.put('/:id/read', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all as read
router.put('/read-all', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || req.headers['x-firebase-uid'];
    if (!userId) return res.status(401).json({ error: 'User ID required' });

    const User = mongoose.model('User');
    let user = await User.findOne({ firebaseUid: userId });
    if (!user) user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await Notification.updateMany({ userId: user._id, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
