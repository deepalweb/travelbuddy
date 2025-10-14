import dotenv from 'dotenv';
import admin from './config/firebase.js';

// Load environment variables
dotenv.config();

console.log('🔥 Testing Firebase Admin Authentication...\n');

try {
  // Test Firebase Auth methods
  const auth = admin.auth();
  
  console.log('✅ Firebase Admin is initialized');
  console.log('📋 Project ID:', admin.app().options.projectId);

  // Test 1: List users (first 3)
  console.log('\n🔍 Testing user listing...');
  const listUsersResult = await auth.listUsers(3);
  console.log(`✅ Found ${listUsersResult.users.length} users in Firebase Auth`);
  
  if (listUsersResult.users.length > 0) {
    const user = listUsersResult.users[0];
    console.log('👤 Sample user:', {
      uid: user.uid,
      email: user.email || 'No email',
      displayName: user.displayName || 'No display name',
      emailVerified: user.emailVerified
    });
  }

  // Test 2: Create a custom token (for testing)
  console.log('\n🎫 Testing custom token creation...');
  const testUid = 'test-user-' + Date.now();
  const customToken = await auth.createCustomToken(testUid, {
    role: 'test',
    timestamp: Date.now()
  });
  console.log('✅ Custom token created successfully');
  console.log('🔑 Token length:', customToken.length);

  console.log('\n🎉 All Firebase Admin tests passed!');
  console.log('✅ Firebase authorization is working correctly');

} catch (error) {
  console.error('❌ Firebase Admin test failed:', error.message);
  
  if (error.code) {
    console.error('🔍 Error code:', error.code);
  }
  
  process.exit(1);
}

process.exit(0);