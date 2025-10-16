interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
}

class PaymentService {
  private stripe: any = null;

  async initialize() {
    if (typeof window === 'undefined') return;

    try {
      // Load Stripe.js
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      document.head.appendChild(script);

      await new Promise((resolve) => {
        script.onload = resolve;
      });

      // Initialize Stripe (use test key for now)
      this.stripe = (window as any).Stripe('pk_test_51234567890abcdef');
      console.log('Stripe initialized');
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
    }
  }

  async createPaymentIntent(amount: number, currency: string = 'usd'): Promise<PaymentIntent | null> {
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, currency }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating payment intent:', error);
      return null;
    }
  }

  async processPayment(paymentIntentId: string, paymentMethodId: string): Promise<boolean> {
    if (!this.stripe) {
      console.error('Stripe not initialized');
      return false;
    }

    try {
      const { error } = await this.stripe.confirmCardPayment(paymentIntentId, {
        payment_method: paymentMethodId
      });

      if (error) {
        console.error('Payment failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error processing payment:', error);
      return false;
    }
  }

  async createSubscription(planId: string, paymentMethodId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId, paymentMethodId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const subscription = await response.json();
      return subscription.status === 'active';
    } catch (error) {
      console.error('Error creating subscription:', error);
      return false;
    }
  }

  getSubscriptionPlans(): SubscriptionPlan[] {
    return [
      {
        id: 'basic',
        name: 'Basic',
        price: 9.99,
        currency: 'usd',
        interval: 'month',
        features: [
          'Trip planning',
          'Place recommendations',
          'Basic support'
        ]
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 19.99,
        currency: 'usd',
        interval: 'month',
        features: [
          'All Basic features',
          'AI assistant',
          'Advanced planning',
          'Priority support'
        ]
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 39.99,
        currency: 'usd',
        interval: 'month',
        features: [
          'All Premium features',
          'Team collaboration',
          'Custom integrations',
          'Dedicated support'
        ]
      }
    ];
  }

  // Mock payment for development
  async mockPayment(amount: number): Promise<boolean> {
    console.log(`Mock payment of $${amount} processed`);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
    return Math.random() > 0.1; // 90% success rate
  }
}

export const paymentService = new PaymentService();