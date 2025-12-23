# Push Notifications Setup Guide

## Mobile App (✅ Complete)

### Features Implemented:
- ✅ FCM token generation
- ✅ Permission requests
- ✅ Foreground message handling
- ✅ Background message handling
- ✅ Notification tap handling
- ✅ Topic subscriptions
- ✅ Analytics tracking
- ✅ Token refresh handling

### Usage:
```dart
// Subscribe to topics
NotificationService.subscribeToTopic('deals');
NotificationService.subscribeToTopic('community');

// Get FCM token
String? token = await NotificationService.getToken();
```

## Backend Setup (⚠️ Required)

### 1. Add fcmToken to User Schema
```javascript
// In backend/routes/users.js or models/User.js
const userSchema = new mongoose.Schema({
  // ... existing fields
  fcmToken: { type: String },
  fcmTokens: [{ type: String }], // Support multiple devices
  notificationPreferences: {
    deals: { type: Boolean, default: true },
    community: { type: Boolean, default: true },
    trips: { type: Boolean, default: true },
  }
});
```

### 2. Update User Endpoint
```javascript
// PUT /api/users/:id
router.put('/:id', async (req, res) => {
  const { fcmToken, ...otherFields } = req.body;
  
  if (fcmToken) {
    // Add to fcmTokens array (support multiple devices)
    await User.findByIdAndUpdate(req.params.id, {
      $addToSet: { fcmTokens: fcmToken },
      fcmToken: fcmToken, // Keep latest token
      ...otherFields
    });
  }
});
```

### 3. Install Firebase Admin SDK
```bash
cd backend
npm install firebase-admin
```

### 4. Create Notification Service
```javascript
// backend/services/notificationService.js
const admin = require('firebase-admin');

// Initialize with service account
admin.initializeApp({
  credential: admin.credential.cert(require('../firebase-service-account.json'))
});

async function sendNotification(fcmToken, title, body, data = {}) {
  const message = {
    notification: { title, body },
    data,
    token: fcmToken
  };
  
  try {
    await admin.messaging().send(message);
    console.log('✅ Notification sent');
  } catch (error) {
    console.error('❌ Notification failed:', error);
  }
}

async function sendToTopic(topic, title, body, data = {}) {
  const message = {
    notification: { title, body },
    data,
    topic
  };
  
  await admin.messaging().send(message);
}

module.exports = { sendNotification, sendToTopic };
```

### 5. Send Notifications on Events
```javascript
// When new deal is created
const { sendToTopic } = require('./services/notificationService');

router.post('/deals', async (req, res) => {
  const deal = await Deal.create(req.body);
  
  // Notify all users subscribed to deals
  await sendToTopic('deals', 
    'New Deal Available!', 
    `${deal.discount} off at ${deal.businessName}`,
    { type: 'deal', dealId: deal._id }
  );
});

// When someone likes your post
await sendNotification(
  postAuthor.fcmToken,
  'New Like!',
  `${user.username} liked your post`,
  { type: 'post', postId: post._id }
);
```

## Firebase Console Setup

### 1. Enable Cloud Messaging
- Go to Firebase Console → Project Settings
- Cloud Messaging tab
- Note the Server Key

### 2. Download Service Account
- Project Settings → Service Accounts
- Generate New Private Key
- Save as `firebase-service-account.json` in backend root
- Add to `.gitignore`

### 3. Configure Android
- Download `google-services.json`
- Place in `android/app/`

### 4. Configure iOS
- Download `GoogleService-Info.plist`
- Place in `ios/Runner/`

## Testing

### Send Test Notification:
```bash
# Get FCM token from app logs
# Then send via Firebase Console or:

curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "FCM_TOKEN_HERE",
    "notification": {
      "title": "Test",
      "body": "Hello from backend!"
    }
  }'
```

## Notification Types

### Deal Notifications
```javascript
{
  type: 'deal',
  dealId: '123',
  title: 'New Deal!',
  body: '50% off at Restaurant'
}
```

### Community Notifications
```javascript
{
  type: 'post',
  postId: '456',
  title: 'New Like',
  body: 'John liked your post'
}
```

### Trip Notifications
```javascript
{
  type: 'trip',
  tripId: '789',
  title: 'Trip Reminder',
  body: 'Your trip starts tomorrow!'
}
```
