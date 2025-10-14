import dotenv from 'dotenv';
import admin from 'firebase-admin';

// Load environment variables
dotenv.config({ path: './backend/.env' });

console.log('🔥 Testing Firebase Admin Authentication...\n');

try {
  // Initialize Firebase Admin if not already done
  if (!admin.apps.length) {
    const credentialsJson = process.env.FIREBASE_ADMIN_CREDENTIALS_JSON;
    
    if (!credentialsJson) {
      throw new Error('FIREBASE_ADMIN_CREDENTIALS_JSON not found');
    }

    const serviceAccount = JSON.parse(credentialsJson);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    
    console.log('✅ Firebase Admin initialized successfully');
    console.log('📋 Project ID:', serviceAccount.project_id);
    console.log('📧 Service Account:', serviceAccount.client_email);
  }

  // Test Firebase Auth methods
  const auth = admin.auth();
  
  // Test 1: List users (first 5)
  console.log('\n🔍 Testing user listing...');
  const listUsersResult = await auth.listUsers(5);
  console.log(`✅ Found ${listUsersResult.users.length} users in Firebase Auth`);
  
  if (listUsersResult.users.length > 0) {
    const user = listUsersResult.users[0];
    console.log('👤 Sample user:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
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

  // Test 3: Verify the custom token
  console.log('\n🔐 Testing token verification...');
  const decodedToken = await auth.verifyIdToken(customToken);
  console.log('✅ Token verified successfully');
  console.log('📋 Decoded claims:', {
    uid: decodedToken.uid,
    aud: decodedToken.aud,
    iss: decodedToken.iss
  });

  console.log('\n🎉 All Firebase Admin tests passed!');
  console.log('✅ Firebase authorization is working correctly');

} catch (error) {
  console.error('❌ Firebase Admin test failed:', error.message);
  
  if (error.code) {
    console.error('🔍 Error code:', error.code);
  }
  
  if (error.message.includes('project_id')) {
    console.error('💡 Check your FIREBASE_ADMIN_CREDENTIALS_JSON format');
  }
  
  process.exit(1);
}

process.exit(0);