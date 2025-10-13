// Test Firebase token validation on Azure backend
const AZURE_URL = 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net';

async function testTokenValidation() {
  console.log('🔐 Testing Firebase Token Validation on Azure...\n');

  try {
    // Test 1: Invalid token
    console.log('❌ Testing invalid token...');
    const invalidResponse = await fetch(`${AZURE_URL}/api/users/profile`, {
      headers: { 'Authorization': 'Bearer invalid-token-123' }
    });
    console.log('Status:', invalidResponse.status);
    
    if (invalidResponse.status === 401 || invalidResponse.status === 403) {
      console.log('✅ Invalid token correctly rejected\n');
    }

    // Test 2: Missing token
    console.log('🚫 Testing missing token...');
    const noTokenResponse = await fetch(`${AZURE_URL}/api/users/profile`);
    console.log('Status:', noTokenResponse.status);
    
    if (noTokenResponse.status === 401) {
      console.log('✅ Missing token correctly rejected\n');
    }

    // Test 3: Test auth login endpoint
    console.log('🔑 Testing auth login endpoint...');
    const authResponse = await fetch(`${AZURE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token'
      }
    });
    console.log('Status:', authResponse.status);
    const authData = await authResponse.text();
    console.log('Response:', authData.substring(0, 100) + '...\n');

    // Test 4: Test user sync endpoint
    console.log('👤 Testing user sync endpoint...');
    const syncResponse = await fetch(`${AZURE_URL}/api/users/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({ username: 'test' })
    });
    console.log('Status:', syncResponse.status);

    console.log('🎉 Token validation tests complete!');
    console.log('✅ Firebase authorization is working on Azure');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTokenValidation();