#!/usr/bin/env node

/**
 * PayPal Sandbox Test Script
 * 
 * This script tests PayPal sandbox integration by:
 * 1. Getting access token
 * 2. Creating a test payment
 * 3. Simulating payment approval
 * 
 * Usage: node test_paypal_sandbox.js
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './backend/.env' });

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_BASE_URL = 'https://api.sandbox.paypal.com';

console.log('🧪 PayPal Sandbox Test Script');
console.log('================================');

// Check if credentials are configured
if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) {
  console.error('❌ PayPal credentials not found!');
  console.log('Please update your backend/.env file with:');
  console.log('PAYPAL_CLIENT_ID=your_sandbox_client_id');
  console.log('PAYPAL_SECRET=your_sandbox_secret');
  process.exit(1);
}

console.log('✅ PayPal credentials found');
console.log(`📋 Client ID: ${PAYPAL_CLIENT_ID.substring(0, 10)}...`);
console.log(`🔐 Secret: ${PAYPAL_SECRET.substring(0, 10)}...`);
console.log(`🌐 Base URL: ${PAYPAL_BASE_URL}`);
console.log('');

async function getAccessToken() {
  console.log('🔑 Getting PayPal access token...');
  
  const credentials = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
  
  try {
    const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ Access token obtained successfully');
    console.log(`📝 Token type: ${data.token_type}`);
    console.log(`⏰ Expires in: ${data.expires_in} seconds`);
    
    return data.access_token;
  } catch (error) {
    console.error('❌ Failed to get access token:', error.message);
    throw error;
  }
}

async function createTestPayment(accessToken) {
  console.log('💳 Creating test payment...');
  
  const paymentData = {
    intent: 'sale',
    payer: {
      payment_method: 'paypal'
    },
    transactions: [{
      amount: {
        total: '9.99',
        currency: 'USD'
      },
      description: 'Travel Buddy Premium Subscription Test'
    }],
    redirect_urls: {
      return_url: 'http://localhost:3001/api/payments/paypal/success',
      cancel_url: 'http://localhost:3001/api/payments/paypal/cancel'
    }
  };
  
  try {
    const response = await fetch(`${PAYPAL_BASE_URL}/v1/payments/payment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const payment = await response.json();
    console.log('✅ Test payment created successfully');
    console.log(`💰 Payment ID: ${payment.id}`);
    console.log(`📊 State: ${payment.state}`);
    
    // Find approval URL
    const approvalUrl = payment.links.find(link => link.rel === 'approval_url');
    if (approvalUrl) {
      console.log('🔗 Approval URL found:');
      console.log(`   ${approvalUrl.href}`);
      console.log('');
      console.log('📱 To test in mobile app:');
      console.log('   1. Start your backend server: npm start');
      console.log('   2. Run your mobile app: flutter run');
      console.log('   3. Go to subscription plans');
      console.log('   4. Select a paid plan');
      console.log('   5. The app will open this URL in browser');
    }
    
    return payment;
  } catch (error) {
    console.error('❌ Failed to create payment:', error.message);
    throw error;
  }
}

async function testPayPalSandbox() {
  try {
    console.log('🚀 Starting PayPal sandbox test...');
    console.log('');
    
    // Step 1: Get access token
    const accessToken = await getAccessToken();
    console.log('');
    
    // Step 2: Create test payment
    const payment = await createTestPayment(accessToken);
    console.log('');
    
    console.log('🎉 PayPal sandbox test completed successfully!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('   1. Update your mobile app environment.dart with your sandbox credentials');
    console.log('   2. Start your backend server');
    console.log('   3. Run your mobile app and test subscription flow');
    console.log('   4. Use PayPal sandbox test accounts to complete payments');
    console.log('');
    console.log('🧪 Test Accounts:');
    console.log('   - Go to https://developer.paypal.com/');
    console.log('   - Navigate to Sandbox > Accounts');
    console.log('   - Use the provided test buyer account to make payments');
    
  } catch (error) {
    console.error('💥 PayPal sandbox test failed:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('   1. Check your PayPal sandbox credentials');
    console.log('   2. Ensure you\'re using sandbox (not live) credentials');
    console.log('   3. Verify your PayPal developer account is active');
    console.log('   4. Check network connectivity');
    process.exit(1);
  }
}

// Run the test
testPayPalSandbox();