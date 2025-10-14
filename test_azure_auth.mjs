// Test Azure backend authentication API
const API_BASE = 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net';
const TEST_TOKEN = 'test-firebase-token-123';

async function testAzureAuthAPI() {
  console.log('🧪 Testing Azure Firebase Auth API...\n');
  console.log(`🌐 Base URL: ${API_BASE}\n`);

  // Test 1: Server health
  console.log('1. Testing server health:');
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  // Test 2: Missing token
  console.log('\n2. Testing auth with missing token:');
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  // Test 3: With Bearer token (will be dev mode)
  console.log('\n3. Testing auth with Bearer token:');
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  // Test 4: Test deployment endpoint
  console.log('\n4. Testing deployment status:');
  try {
    const response = await fetch(`${API_BASE}/api/test-deployment`);
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  // Test 5: Test API key status
  console.log('\n5. Testing API key configuration:');
  try {
    const response = await fetch(`${API_BASE}/api/places/test-key`);
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
}

testAzureAuthAPI().catch(console.error);