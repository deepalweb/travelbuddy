import express from 'express';
import mongoose from 'mongoose';
import fetch from 'node-fetch';

const router = express.Router();

// Payment Schema
const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  paymentId: { type: String, required: true, unique: true },
  provider: { type: String, required: true, enum: ['paypal', 'stripe'] },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  planName: String,
  tier: String,
  status: { type: String, required: true, enum: ['pending', 'completed', 'failed', 'refunded'] },
  providerResponse: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

const Payment = mongoose.model('Payment', paymentSchema);

// Verify payment
router.post('/verify', async (req, res) => {
  try {
    const { paymentId, expectedAmount, provider } = req.body;
    
    if (!paymentId || !expectedAmount || !provider) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // In production, verify with actual payment provider
    // For now, simulate verification
    const isValid = await verifyWithProvider(paymentId, expectedAmount, provider);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    res.json({ verified: true, paymentId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payment history for user
router.get('/:userId/history', async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const formattedPayments = payments.map(payment => ({
      id: payment._id,
      paymentId: payment.paymentId,
      amount: payment.amount,
      currency: payment.currency,
      planName: payment.planName,
      status: payment.status,
      provider: payment.provider,
      createdAt: payment.createdAt
    }));

    res.json({ payments: formattedPayments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record payment
router.post('/', async (req, res) => {
  try {
    const payment = new Payment(req.body);
    await payment.save();
    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

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

// Payment verification function
async function verifyWithProvider(paymentId, expectedAmount, provider) {
  try {
    if (provider === 'paypal') {
      return await verifyPayPalPayment(paymentId, expectedAmount);
    } else if (provider === 'stripe') {
      // Simulate Stripe verification for now
      return paymentId.startsWith('pi_') || paymentId.startsWith('ch_');
    }
    return false;
  } catch (error) {
    console.error('Payment verification error:', error);
    return false;
  }
}

// Verify PayPal payment
async function verifyPayPalPayment(paymentId, expectedAmount) {
  try {
    const accessToken = await getPayPalAccessToken();
    const isProduction = process.env.NODE_ENV === 'production';
    const baseURL = isProduction ? 'https://api.paypal.com' : 'https://api.sandbox.paypal.com';

    // Get payment details from PayPal
    const response = await fetch(`${baseURL}/v2/checkout/orders/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Failed to verify PayPal payment:', response.status);
      return false;
    }

    const paymentData = await response.json();
    
    // Check if payment is completed and amount matches
    if (paymentData.status !== 'COMPLETED') {
      console.error('PayPal payment not completed:', paymentData.status);
      return false;
    }

    const actualAmount = parseFloat(paymentData.purchase_units[0].amount.value);
    const expectedAmountFloat = parseFloat(expectedAmount);
    
    if (Math.abs(actualAmount - expectedAmountFloat) > 0.01) {
      console.error('PayPal payment amount mismatch:', actualAmount, 'vs', expectedAmountFloat);
      return false;
    }

    return true;
  } catch (error) {
    console.error('PayPal payment verification error:', error);
    return false;
  }
}

export default router;