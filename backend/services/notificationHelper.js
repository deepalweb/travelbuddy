import mongoose from 'mongoose';

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

export async function createNotification({ userId, type, title, message, relatedId, relatedType }) {
  try {
    const notification = new Notification({ userId, type, title, message, relatedId, relatedType });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

export async function notifyLike(postOwnerId, likerUsername, postId) {
  return createNotification({
    userId: postOwnerId,
    type: 'like',
    title: 'New Like',
    message: `${likerUsername} liked your post`,
    relatedId: postId,
    relatedType: 'post'
  });
}

export async function notifyComment(postOwnerId, commenterUsername, postId) {
  return createNotification({
    userId: postOwnerId,
    type: 'comment',
    title: 'New Comment',
    message: `${commenterUsername} commented on your post`,
    relatedId: postId,
    relatedType: 'post'
  });
}

export async function notifyFollow(followedUserId, followerUsername, followerId) {
  return createNotification({
    userId: followedUserId,
    type: 'follow',
    title: 'New Follower',
    message: `${followerUsername} started following you`,
    relatedId: followerId,
    relatedType: 'user'
  });
}

export default Notification;
