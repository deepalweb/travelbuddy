// Comprehensive Azure backend API test
const API_BASE = 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net';

async function testAzureAPIs() {
  console.log('🧪 Testing Azure Backend APIs...\n');

  // Test Places API
  console.log('1. Testing Places API:');
  try {
    const response = await fetch(`${API_BASE}/api/places/nearby?lat=40.7128&lng=-74.0060&q=restaurant`);
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Found ${Array.isArray(data) ? data.length : 0} places`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  // Test Weather API
  console.log('\n2. Testing Weather API:');
  try {
    const response = await fetch(`${API_BASE}/api/weather/google?lat=40.7128&lng=-74.0060`);
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Temperature: ${data.current?.temperature}°C`);
    console.log(`   Condition: ${data.current?.condition}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  // Test Emergency Services
  console.log('\n3. Testing Emergency Services:');
  try {
    const response = await fetch(`${API_BASE}/api/emergency/police?lat=40.7128&lng=-74.0060`);
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Found ${Array.isArray(data) ? data.length : 0} police stations`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  // Test AI Configuration
  console.log('\n4. Testing AI Configuration:');
  try {
    const response = await fetch(`${API_BASE}/api/ai/test-key`);
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Has OpenAI Key: ${data.hasOpenAIKey}`);
    console.log(`   Key Length: ${data.keyLength}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  // Test Database Check
  console.log('\n5. Testing Database:');
  try {
    const response = await fetch(`${API_BASE}/api/db-check`);
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Users: ${data.users}`);
    console.log(`   Posts: ${data.posts}`);
    console.log(`   Is Empty: ${data.isEmpty}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  // Test User Creation
  console.log('\n6. Testing User Creation:');
  try {
    const testUser = {
      username: `testuser_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      firebaseUid: `test_uid_${Date.now()}`
    };
    
    const response = await fetch(`${API_BASE}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    const data = await response.json();
    console.log(`   Status: ${response.status}`);
    console.log(`   Created User ID: ${data._id}`);
    console.log(`   Username: ${data.username}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }
}

testAzureAPIs().catch(console.error);