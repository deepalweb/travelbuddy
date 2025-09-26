import express from 'express';
import mongoose from 'mongoose';

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

// Mock payment verification function
async function verifyWithProvider(paymentId, expectedAmount, provider) {
  // In production, make actual API calls to PayPal/Stripe
  // For now, simulate successful verification
  try {
    if (provider === 'paypal') {
      // Simulate PayPal verification
      return paymentId.startsWith('PAYID-') || paymentId.startsWith('PAY-');
    } else if (provider === 'stripe') {
      // Simulate Stripe verification
      return paymentId.startsWith('pi_') || paymentId.startsWith('ch_');
    }
    return false;
  } catch (error) {
    console.error('Payment verification error:', error);
    return false;
  }
}

export default router;