const fetch = require('node-fetch');

// Test configuration
const API_BASE = 'http://localhost:3001'; // Adjust port if different
const TEST_TOKEN = 'test-firebase-token-123'; // Mock token for testing

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

  // Test 4: Check Firebase config
  console.log('\n4. Testing Firebase config:');
  try {
    const response = await fetch(`${API_BASE}/api/config/firebase`);
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Has API Key: ${!!data.apiKey}`);
    console.log(`   Project ID: ${data.projectId}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
}

// Run tests
testAuthAPI().catch(console.error);