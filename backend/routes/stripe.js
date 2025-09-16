import express from 'express';

const router = express.Router();

// Helper to attempt lazy import of Stripe. Returns null if Stripe isn't installed.
async function getStripe() {
  try {
    const mod = await import('stripe');
    const Stripe = mod.default || mod;
    const stripeSecret = process.env.STRIPE_SECRET || '';
    return new Stripe(stripeSecret, { apiVersion: '2022-11-15' });
  } catch (err) {
    console.warn('[Stripe] stripe package not available or failed to import:', err?.message || err);
    return null;
  }
}

// Create a checkout session (lazy-load Stripe). Client should call this to redirect to Stripe Checkout.
router.post('/create-checkout-session', async (req, res) => {
  const { priceId, successUrl, cancelUrl, customerEmail } = req.body || {};
  if (!priceId) return res.status(400).json({ error: 'Missing priceId' });

  const stripe = await getStripe();
  if (!stripe) return res.status(501).json({ error: 'stripe_not_available' });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: customerEmail,
      success_url: successUrl || `${process.env.CLIENT_URL}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || process.env.CLIENT_URL,
    });
    res.json({ id: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe create-checkout-session error:', err?.message || err);
    res.status(500).json({ error: 'failed_to_create_session' });
  }
});

// Webhook endpoint to receive Stripe events (set STRIPE_WEBHOOK_SECRET)
// Note: ensure raw body is available for signature verification.
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const stripe = await getStripe();
  if (!stripe) return res.status(501).send('stripe_not_available');

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn('Stripe webhook secret not configured');
    return res.status(400).send('webhook-secret-not-configured');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err?.message || err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event (minimal handlers)
  switch (event.type) {
    case 'checkout.session.completed':
      // Payment succeeded, subscription created
      // TODO: lookup the user by customer_email or metadata and update DB
      console.log('Stripe checkout.session.completed', event.data.object.id);
      break;
    case 'invoice.payment_succeeded':
      console.log('invoice.payment_succeeded', event.data.object.id);
      break;
    case 'customer.subscription.deleted':
      console.log('customer.subscription.deleted', event.data.object.id);
      break;
    default:
      console.log(`Unhandled Stripe event type: ${event.type}`);
  }

  // Acknowledge receipt
  res.json({ received: true });
});

export default router;
