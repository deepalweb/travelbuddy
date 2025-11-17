const axios = require('axios');
const API_CONFIG = require('./api-config');

async function testConnectivity() {
  console.log('🧪 Testing API Connectivity...\n');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${API_CONFIG.BASE_URL.replace('/v1', '')}/health`);
    console.log('✅ Health check:', healthResponse.data);
    
    // Test connectivity endpoint
    console.log('\n2. Testing connectivity endpoint...');
    const connectResponse = await axios.get(`${API_CONFIG.BASE_URL.replace('/v1', '')}/connectivity`, {
      headers: { 'X-Platform': 'web' }
    });
    console.log('✅ Connectivity test:', connectResponse.data);
    
    // Test unified endpoints
    console.log('\n3. Testing unified endpoints...');
    
    // Test places
    const placesResponse = await axios.get(`${API_CONFIG.BASE_URL}/places/search`, {
      params: { lat: 40.7128, lng: -74.0060, query: 'test' },
      headers: { 'X-Platform': 'web' }
    });
    console.log('✅ Places endpoint working');
    
    // Test deals
    const dealsResponse = await axios.get(`${API_CONFIG.BASE_URL}/deals`, {
      headers: { 'X-Platform': 'web' }
    });
    console.log('✅ Deals endpoint working');
    
    console.log('\n🎉 All tests passed! Web and mobile apps can connect to the same API.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.status, error.response.data);
    }
  }
}

testConnectivity();