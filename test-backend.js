// Test script to diagnose backend 500 errors
const API_BASE = 'http://localhost:3001';

async function testEndpoint(name, url, options = {}) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`📍 URL: ${url}`);
  
  try {
    const response = await fetch(url, options);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      console.log('✅ Response:', JSON.stringify(json, null, 2));
    } catch {
      console.log('📄 Response (text):', text);
    }
    
    return response.ok;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Backend Tests\n');
  console.log('=' .repeat(50));
  
  // Test 1: Health check
  await testEndpoint(
    'Health Check',
    `${API_BASE}/api/health`
  );
  
  // Test 2: Users test endpoint
  await testEndpoint(
    'Users Test Endpoint',
    `${API_BASE}/api/users/test`
  );
  
  // Test 3: User sync (will fail without auth, but shows error details)
  await testEndpoint(
    'User Sync (no auth)',
    `${API_BASE}/api/users/sync`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        username: 'testuser',
        firebaseUid: 'test-uid-123'
      })
    }
  );
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Tests complete!');
}

runTests().catch(console.error);
