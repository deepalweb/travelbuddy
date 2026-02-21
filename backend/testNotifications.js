import mongoose from 'mongoose';

// Connect to MongoDB
const MONGODB_URI = process.env.MONGO_URI || 'mongodb+srv://deepalr:qn7q9Y64AOjrdLbe@cluster0.oybjzf7.mongodb.net/travelbuddy?retryWrites=true&w=majority&appName=Cluster0';

await mongoose.connect(MONGODB_URI);

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true, enum: ['like', 'comment', 'follow', 'deal', 'system'] },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedId: { type: mongoose.Schema.Types.ObjectId },
  relatedType: { type: String, enum: ['post', 'comment', 'user', 'deal'] },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

let Notification;
try {
  Notification = mongoose.model('Notification');
} catch {
  Notification = mongoose.model('Notification', notificationSchema);
}

// Get user by Firebase UID or email
const userIdentifier = process.argv[2];

if (!userIdentifier) {
  console.error('❌ Please provide Firebase UID or email: node testNotifications.js <uid_or_email>');
  process.exit(1);
}

const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
const user = await User.findOne({
  $or: [
    { firebaseUid: userIdentifier },
    { email: userIdentifier }
  ]
});

if (!user) {
  console.error(`❌ No user found with identifier: ${userIdentifier}`);
  console.error('Try: node testNotifications.js <your_email>');
  process.exit(1);
}

console.log(`✅ Sending test notifications to: ${user.email} (${user._id})`);

// Create test notifications
const testNotifications = [
  {
    userId: user._id,
    type: 'like',
    title: '❤️ New Like',
    message: 'Sarah liked your post about "Best Beaches in Bali"',
    isRead: false
  },
  {
    userId: user._id,
    type: 'comment',
    title: '💬 New Comment',
    message: 'John commented: "Great recommendations! I\'m planning to visit next month."',
    isRead: false
  },
  {
    userId: user._id,
    type: 'follow',
    title: '👤 New Follower',
    message: 'Emma started following you',
    isRead: false
  },
  {
    userId: user._id,
    type: 'deal',
    title: '🏷️ Special Deal Alert',
    message: '50% off on Paris hotels this weekend! Book now and save big.',
    isRead: false
  },
  {
    userId: user._id,
    type: 'system',
    title: '🔔 Welcome to TravelBuddy',
    message: 'Your account has been verified. Start planning your dream trip today!',
    isRead: true
  }
];

await Notification.insertMany(testNotifications);

console.log(`✅ Created ${testNotifications.length} test notifications`);
console.log('📱 Refresh your notifications page to see them!');

await mongoose.disconnect();
