import express from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import fetch from 'node-fetch';

const router = express.Router();

// Get PayPal access token
async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';
  const baseURL = isProduction ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com';

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  const response = await fetch(`${baseURL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token');
  }

  const data = await response.json();
  return data.access_token;
}

// PayPal webhook verification
async function verifyPayPalWebhook(payload, headers) {
  try {
    const webhookSecret = process.env.PAYPAL_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn('PayPal webhook secret not configured');
      return false;
    }

    const signature = headers['paypal-transmission-sig'];
    const certId = headers['paypal-cert-id'];
    const timestamp = headers['paypal-transmission-time'];
    const authAlgo = headers['paypal-auth-algo'];
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;

    if (!signature || !certId || !timestamp || !authAlgo || !webhookId) {
      console.warn('Missing PayPal webhook headers');
      return false;
    }

    // Use PayPal's webhook verification API
    const accessToken = await getPayPalAccessToken();
    const isProduction = process.env.NODE_ENV === 'production';
    const baseURL = isProduction ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com';

    const verificationData = {
      transmission_id: headers['paypal-transmission-id'],
      cert_id: certId,
      auth_algo: authAlgo,
      transmission_time: timestamp,
      transmission_sig: signature,
      webhook_id: webhookId,
      webhook_event: JSON.parse(payload)
    };

    const verifyResponse = await fetch(`${baseURL}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(verificationData)
    });

    if (!verifyResponse.ok) {
      console.error('PayPal webhook verification failed:', verifyResponse.status);
      return false;
    }

    const verifyResult = await verifyResponse.json();
    return verifyResult.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('PayPal webhook verification error:', error);
    return false;
  }
}

// PayPal webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const payload = req.body.toString();
    const headers = req.headers;

    // Verify webhook signature
    if (!verifyPayPalWebhook(payload, headers)) {
      console.warn('PayPal webhook verification failed');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = JSON.parse(payload);
    console.log('PayPal webhook event:', event.event_type);

    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCompleted(event);
        break;
      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentFailed(event);
        break;
      case 'BILLING.SUBSCRIPTION.CREATED':
        await handleSubscriptionCreated(event);
        break;
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(event);
        break;
      default:
        console.log('Unhandled PayPal webhook event:', event.event_type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handlePaymentCompleted(event) {
  try {
    const payment = event.resource;
    const paymentId = payment.id;
    const amount = parseFloat(payment.amount.value);

    // Update payment record
    const Payment = mongoose.model('Payment');
    await Payment.findOneAndUpdate(
      { paymentId },
      { 
        status: 'completed',
        providerResponse: payment
      }
    );

    console.log(`PayPal payment completed: ${paymentId}, amount: ${amount}`);
  } catch (error) {
    console.error('Error handling payment completed:', error);
  }
}

async function handlePaymentFailed(event) {
  try {
    const payment = event.resource;
    const paymentId = payment.id;

    // Update payment record
    const Payment = mongoose.model('Payment');
    await Payment.findOneAndUpdate(
      { paymentId },
      { 
        status: 'failed',
        providerResponse: payment
      }
    );

    console.log(`PayPal payment failed: ${paymentId}`);
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

async function handleSubscriptionCreated(event) {
  try {
    const subscription = event.resource;
    console.log('PayPal subscription created:', subscription.id);
    // Handle subscription creation logic
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionCancelled(event) {
  try {
    const subscription = event.resource;
    console.log('PayPal subscription cancelled:', subscription.id);
    // Handle subscription cancellation logic
  } catch (error) {
    console.error('Error handling subscription cancelled:', error);
  }
}

export default router;