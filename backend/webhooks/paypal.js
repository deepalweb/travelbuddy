import express from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';

const router = express.Router();

// PayPal webhook verification
function verifyPayPalWebhook(payload, headers) {
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

    if (!signature || !certId || !timestamp || !authAlgo) {
      return false;
    }

    // In production, implement full PayPal webhook verification
    // This is a simplified version
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'base64'),
      Buffer.from(expectedSignature, 'base64')
    );
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