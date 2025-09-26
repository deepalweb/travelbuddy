// Quick test script for backend role system
const testEndpoints = async () => {
  const baseUrl = 'http://localhost:3001';
  
  console.log('🧪 Testing Backend Role System...\n');
  
  // Test 1: Health check
  try {
    const health = await fetch(`${baseUrl}/health`);
    const healthData = await health.json();
    console.log('✅ Health Check:', healthData.status);
  } catch (error) {
    console.log('❌ Health Check Failed:', error.message);
    return;
  }
  
  // Test 2: Role endpoints
  try {
    const roleMe = await fetch(`${baseUrl}/api/roles/me`);
    const roleMeData = await roleMe.json();
    console.log('✅ Role Me Endpoint:', roleMeData);
  } catch (error) {
    console.log('❌ Role Me Failed:', error.message);
  }
  
  // Test 3: Service profile endpoint
  try {
    const serviceProfile = await fetch(`${baseUrl}/api/services/profile/test-user-id`);
    const serviceData = await serviceProfile.json();
    console.log('✅ Service Profile Endpoint:', serviceData);
  } catch (error) {
    console.log('❌ Service Profile Failed:', error.message);
  }
  
  console.log('\n🎯 Backend Role System Test Complete!');
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testEndpoints();
}

export { testEndpoints };