// Test Firebase Admin connection on Azure backend
const API_BASE = 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net';

async function testFirebaseConnection() {
  console.log('🔥 Testing Firebase Admin Connection on Azure...\n');

  // Test 1: Check if Firebase Admin is actually initialized
  console.log('1. Testing Firebase Admin initialization:');
  try {
    // Try to create an admin user (this will fail if Firebase Admin isn't connected)
    const response = await fetch(`${API_BASE}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Api-Key': 'Ccs@kit12'
      },
      body: JSON.stringify({
        email: 'test-firebase-connection@example.com',
        password: 'testpass123',
        displayName: 'Firebase Test User'
      })
    });
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
    
    if (response.status === 500 && data.error === 'admin_not_configured') {
      console.log('   ❌ Firebase Admin NOT connected');
    } else if (response.status === 200) {
      console.log('   ✅ Firebase Admin IS connected and working');
    } else {
      console.log('   ⚠️ Unexpected response - check logs');
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  // Test 2: Check auth endpoint behavior
  console.log('\n2. Testing auth endpoint behavior:');
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token-test'
      }
    });
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
    
    if (data.mode === 'dev') {
      console.log('   ⚠️ Running in DEV mode - Firebase not fully connected');
    } else if (response.status === 401 && data.error === 'Invalid token') {
      console.log('   ✅ Production mode - Firebase token verification active');
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  // Test 3: Check environment variables
  console.log('\n3. Checking Firebase configuration:');
  try {
    const response = await fetch(`${API_BASE}/api/config/firebase`);
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Project ID: ${data.projectId}`);
    console.log(`   Auth Domain: ${data.authDomain}`);
    console.log(`   Has API Key: ${!!data.apiKey}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
}

testFirebaseConnection().catch(console.error);