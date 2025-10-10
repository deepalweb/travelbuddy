// Test Azure backend PayPal endpoint
// Usage: node debug_paypal.js

const backendUrl = 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net';

console.log('🔍 Testing Azure backend PayPal integration...');

// Test 1: Check if backend is responding
fetch(`${backendUrl}/health`)
  .then(res => res.json())
  .then(data => {
    console.log('✅ Backend health:', data.status);
    
    // Test 2: Try to create a test payment
    return fetch(`${backendUrl}/api/payments/test-paypal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 9.99,
        description: 'Test payment'
      })
    });
  })
  .then(res => {
    console.log('📊 Payment test status:', res.status);
    return res.text();
  })
  .then(data => {
    console.log('📝 Payment response:', data);
  })
  .catch(err => {
    console.log('❌ Error:', err.message);
    console.log('💡 Check if Azure environment variables are set');
  });