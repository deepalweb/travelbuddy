// Test production Firebase authentication
const API_BASE = 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net';

async function testProductionAuth() {
  console.log('🔐 Testing Production Firebase Authentication...\n');

  // Test Firebase Admin initialization status
  console.log('1. Checking Firebase Admin status:');
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  // Test with mock Firebase token format
  console.log('\n2. Testing with Firebase-like token:');
  const mockFirebaseToken = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2NzAyNzk4In0.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vdHJhdmVsYnVkZHktMmQxYzUiLCJhdWQiOiJ0cmF2ZWxidWRkeS0yZDFjNSIsImF1dGhfdGltZSI6MTYzMDAwMDAwMCwidXNlcl9pZCI6InRlc3QtdWlkLTEyMyIsInN1YiI6InRlc3QtdWlkLTEyMyIsImlhdCI6MTYzMDAwMDAwMCwiZXhwIjoxNjMwMDAzNjAwLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiZmlyZWJhc2UiOnsiaWRlbnRpdGllcyI6eyJlbWFpbCI6WyJ0ZXN0QHRlc3QuY29tIl19LCJzaWduX2luX3Byb3ZpZGVyIjoicGFzc3dvcmQifX0.mock-signature';
  
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockFirebaseToken}`
      }
    });
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  // Test admin endpoint protection
  console.log('\n3. Testing admin endpoint protection:');
  try {
    const response = await fetch(`${API_BASE}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Api-Key': 'Ccs@kit12'
      },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'testpass123',
        displayName: 'Test Admin'
      })
    });
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  // Check environment status
  console.log('\n4. Checking production environment:');
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    console.log(`   Database: ${data.database}`);
    console.log(`   Version: ${data.version}`);
    console.log(`   Timestamp: ${data.timestamp}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
}

testProductionAuth().catch(console.error);