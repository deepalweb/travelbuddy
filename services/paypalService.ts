interface PayPalOrder {
  id: string;
  status: string;
  amount: {
    currency_code: string;
    value: string;
  };
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

interface PayPalSubscription {
  id: string;
  status: string;
  plan_id: string;
}

class PayPalService {
  private paypal: any = null;
  private clientId: string = '';

  async initialize() {
    if (typeof window === 'undefined') return;

    try {
      // Get PayPal client ID from environment or use sandbox
      this.clientId = process.env.VITE_PAYPAL_CLIENT_ID || 'AeHaQB-LuLvXMXeGdKfL8bJmDgBc8E9F7qGhIjKlMnOpQrStUvWxYzVbCdEfGhIjKlMnOpQrSt';

      // Load PayPal SDK
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${this.clientId}&currency=USD&intent=capture`;
      script.async = true;
      document.head.appendChild(script);

      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
      });

      this.paypal = (window as any).paypal;
      console.log('PayPal SDK initialized');
    } catch (error) {
      console.error('Failed to initialize PayPal:', error);
    }
  }

  async createOrder(amount: number, currency: string = 'USD'): Promise<string | null> {
    if (!this.paypal) {
      console.error('PayPal not initialized');
      return null;
    }

    try {
      const orderData = {
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: amount.toFixed(2)
          }
        }],
        intent: 'CAPTURE'
      };

      const order = await this.paypal.orders.create(orderData);
      return order.id;
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      return null;
    }
  }

  async captureOrder(orderId: string): Promise<boolean> {
    if (!this.paypal) {
      console.error('PayPal not initialized');
      return false;
    }

    try {
      const capture = await this.paypal.orders.capture(orderId);
      return capture.status === 'COMPLETED';
    } catch (error) {
      console.error('Error capturing PayPal order:', error);
      return false;
    }
  }

  renderPayPalButton(containerId: string, amount: number, onSuccess: (details: any) => void, onError: (error: any) => void) {
    if (!this.paypal) {
      console.error('PayPal not initialized');
      return;
    }

    this.paypal.Buttons({
      createOrder: (data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              currency_code: 'USD',
              value: amount.toFixed(2)
            }
          }]
        });
      },
      onApprove: async (data: any, actions: any) => {
        try {
          const details = await actions.order.capture();
          onSuccess(details);
        } catch (error) {
          onError(error);
        }
      },
      onError: (error: any) => {
        onError(error);
      }
    }).render(`#${containerId}`);
  }

  async verifyPayment(paymentId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId,
          provider: 'paypal'
        }),
      });

      if (!response.ok) {
        throw new Error('Payment verification failed');
      }

      const result = await response.json();
      return result.verified;
    } catch (error) {
      console.error('Error verifying PayPal payment:', error);
      return false;
    }
  }

  async recordPayment(userId: string, paymentId: string, amount: number, planName: string, tier: string): Promise<boolean> {
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          paymentId,
          provider: 'paypal',
          amount,
          currency: 'USD',
          planName,
          tier,
          status: 'completed'
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error recording PayPal payment:', error);
      return false;
    }
  }

  getSubscriptionPlans() {
    return [
      {
        id: 'basic',
        name: 'Basic Plan',
        price: 9.99,
        currency: 'USD',
        interval: 'month',
        features: [
          'Trip planning',
          'Place recommendations',
          'Basic support'
        ]
      },
      {
        id: 'premium',
        name: 'Premium Plan',
        price: 19.99,
        currency: 'USD',
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
        name: 'Pro Plan',
        price: 39.99,
        currency: 'USD',
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
}

export const paypalService = new PayPalService();