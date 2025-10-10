// Quick Azure PayPal Test
// Usage: node test_azure_paypal.js YOUR_CLIENT_ID YOUR_SECRET

const [,, clientId, secret] = process.argv;

if (!clientId || !secret) {
  console.log('❌ Usage: node test_azure_paypal.js YOUR_CLIENT_ID YOUR_SECRET');
  process.exit(1);
}

console.log('🧪 Testing PayPal sandbox with Azure backend...');
console.log(`📋 Client ID: ${clientId.substring(0, 10)}...`);

fetch('https://api.sandbox.paypal.com/v1/oauth2/token', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: 'grant_type=client_credentials',
})
.then(res => res.json())
.then(data => {
  if (data.access_token) {
    console.log('✅ PayPal sandbox connection successful!');
    console.log('🚀 Ready to test in mobile app');
  } else {
    console.log('❌ PayPal connection failed:', data);
  }
})
.catch(err => console.log('❌ Error:', err.message));