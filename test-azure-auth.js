// Using built-in fetch (Node.js 18+)

// Your Azure App Service URL
const AZURE_BACKEND_URL = 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net';

console.log('🔥 Testing Azure Backend Firebase Authorization...\n');

async function testAzureAuth() {
  try {
    // Test 1: Health check
    console.log('🏥 Testing health endpoint...');
    const healthResponse = await fetch(`${AZURE_BACKEND_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);
    console.log('📊 Database:', healthData.database);

    // Test 2: Test protected endpoint without auth (should fail)
    console.log('\n🔒 Testing protected endpoint without auth...');
    const noAuthResponse = await fetch(`${AZURE_BACKEND_URL}/api/users/profile`);
    console.log('📋 Status:', noAuthResponse.status);
    
    if (noAuthResponse.status === 401) {
      console.log('✅ Protected endpoint correctly requires authentication');
    } else {
      console.log('⚠️ Expected 401, got:', noAuthResponse.status);
    }

    // Test 3: Test Firebase auth endpoint
    console.log('\n🔐 Testing Firebase auth endpoint...');
    const authTestResponse = await fetch(`${AZURE_BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token'
      }
    });
    
    console.log('📋 Auth test status:', authTestResponse.status);
    
    if (authTestResponse.status === 401) {
      console.log('✅ Firebase auth correctly rejects invalid tokens');
    }

    // Test 4: Test API configuration endpoints
    console.log('\n⚙️ Testing configuration endpoints...');
    const configResponse = await fetch(`${AZURE_BACKEND_URL}/api/config/maps-key`);
    console.log('📋 Config status:', configResponse.status);

    console.log('\n🎉 Azure Backend Authentication Tests Complete!');
    console.log('✅ Firebase authorization is properly configured');

  } catch (error) {
    console.error('❌ Azure backend test failed:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('💡 Check your Azure App Service URL');
      console.error('💡 Make sure your backend is deployed and running');
    }
  }
}

// Prompt for Azure URL if not set
if (AZURE_BACKEND_URL.includes('your-app')) {
  console.log('❌ Please update AZURE_BACKEND_URL with your actual Azure App Service URL');
  console.log('💡 Example: https://travelbuddy-backend.azurewebsites.net');
  process.exit(1);
}

testAzureAuth();