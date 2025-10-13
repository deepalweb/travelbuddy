import dotenv from 'dotenv';
import admin from 'firebase-admin';

// Load environment variables
dotenv.config();

console.log('🔥 Testing Firebase Admin Authentication...\n');

try {
  // Check if environment variable exists
  const credentialsJson = process.env.FIREBASE_ADMIN_CREDENTIALS_JSON;
  
  if (!credentialsJson) {
    console.error('❌ FIREBASE_ADMIN_CREDENTIALS_JSON not found in environment');
    console.log('Available env vars starting with FIREBASE:');
    Object.keys(process.env)
      .filter(key => key.includes('FIREBASE'))
      .forEach(key => console.log(`  ${key}: ${process.env[key] ? 'SET' : 'NOT SET'}`));
    process.exit(1);
  }

  console.log('✅ Firebase credentials found in environment');
  console.log('📏 Credentials length:', credentialsJson.length);

  // Parse and validate service account
  const serviceAccount = JSON.parse(credentialsJson);
  console.log('✅ Service account JSON parsed successfully');
  console.log('📋 Project ID:', serviceAccount.project_id);
  console.log('📧 Client Email:', serviceAccount.client_email);

  // Initialize Firebase Admin
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    console.log('✅ Firebase Admin initialized successfully');
  }

  // Test authentication
  const auth = admin.auth();
  
  // Test: Create custom token
  console.log('\n🎫 Testing custom token creation...');
  const testUid = 'test-user-' + Date.now();
  const customToken = await auth.createCustomToken(testUid, {
    role: 'test',
    timestamp: Date.now()
  });
  console.log('✅ Custom token created successfully');
  console.log('🔑 Token preview:', customToken.substring(0, 50) + '...');

  // Test: List users
  console.log('\n🔍 Testing user listing...');
  const listUsersResult = await auth.listUsers(3);
  console.log(`✅ Found ${listUsersResult.users.length} users in Firebase Auth`);

  console.log('\n🎉 Firebase Admin Authentication Test PASSED!');
  console.log('✅ All Firebase operations working correctly');

} catch (error) {
  console.error('❌ Firebase test failed:', error.message);
  
  if (error.code) {
    console.error('🔍 Firebase error code:', error.code);
  }
  
  if (error.message.includes('JSON')) {
    console.error('💡 Check your service account JSON format');
  }
  
  process.exit(1);
}

process.exit(0);