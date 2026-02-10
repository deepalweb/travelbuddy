import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let initialized = false;

export function initializeFirebase() {
  if (initialized) return;

  try {
    // Try to initialize with service account
    const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin initialized with service account');
    } else {
      throw new Error('Service account file not found');
    }
    initialized = true;
  } catch (error) {
    console.warn('⚠️ Firebase service account not found, using default credentials');
    try {
      admin.initializeApp();
      initialized = true;
    } catch (e) {
      console.error('❌ Firebase Admin initialization failed:', e.message);
    }
  }
}

export async function sendNotification(fcmToken, title, body, data = {}) {
  if (!initialized) initializeFirebase();
  if (!initialized) return false;

  const message = {
    notification: { title, body },
    data: Object.keys(data).reduce((acc, key) => {
      acc[key] = String(data[key]);
      return acc;
    }, {}),
    token: fcmToken
  };

  try {
    await admin.messaging().send(message);
    console.log(`✅ Notification sent to ${fcmToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    console.error('❌ Notification failed:', error.message);
    return false;
  }
}

export async function sendToTopic(topic, title, body, data = {}) {
  if (!initialized) initializeFirebase();
  if (!initialized) return false;

  const message = {
    notification: { title, body },
    data: Object.keys(data).reduce((acc, key) => {
      acc[key] = String(data[key]);
      return acc;
    }, {}),
    topic
  };

  try {
    await admin.messaging().send(message);
    console.log(`✅ Notification sent to topic: ${topic}`);
    return true;
  } catch (error) {
    console.error('❌ Topic notification failed:', error.message);
    return false;
  }
}

export async function sendToMultipleTokens(tokens, title, body, data = {}) {
  if (!initialized) initializeFirebase();
  if (!initialized || !tokens || tokens.length === 0) return;

  const message = {
    notification: { title, body },
    data: Object.keys(data).reduce((acc, key) => {
      acc[key] = String(data[key]);
      return acc;
    }, {}),
    tokens: tokens.slice(0, 500) // FCM limit
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    console.log(`✅ Sent to ${response.successCount}/${tokens.length} devices`);
    return response;
  } catch (error) {
    console.error('❌ Multicast notification failed:', error.message);
    return null;
  }
}

export default {
  initializeFirebase,
  sendNotification,
  sendToTopic,
  sendToMultipleTokens
};
