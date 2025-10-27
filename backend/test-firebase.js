import admin from './config/firebase.js';

console.log('Testing Firebase Admin configuration...');
console.log('Firebase apps length:', admin.apps.length);

if (admin.apps.length > 0) {
  console.log('✅ Firebase Admin is initialized');
  console.log('Project ID:', admin.app().options.projectId);
} else {
  console.log('❌ Firebase Admin is not initialized');
}

// Test environment variable
const credentialsJson = process.env.FIREBASE_ADMIN_CREDENTIALS_JSON;
if (credentialsJson) {
  try {
    const parsed = JSON.parse(credentialsJson);
    console.log('✅ Firebase credentials JSON is valid');
    console.log('Project ID from env:', parsed.project_id);
  } catch (error) {
    console.log('❌ Firebase credentials JSON is invalid:', error.message);
  }
} else {
  console.log('❌ FIREBASE_ADMIN_CREDENTIALS_JSON not found in environment');
}