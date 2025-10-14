import fetch from 'node-fetch';

// Test configuration
const API_BASE = 'http://localhost:3001';
const TEST_TOKEN = 'test-firebase-token-123';

async function testAuthAPI() {
  console.log('🧪 Testing Firebase Auth API...\n');

  // Test 1: Missing token
  console.log('1. Testing missing token:');
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, data);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  console.log('\n2. Testing with Bearer token:');
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
    console.log(`   Response:`, data);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  // Test 3: Check server health
  console.log('\n3. Testing server health:');
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, data);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
}

testAuthAPI().catch(console.error);