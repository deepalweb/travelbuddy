import React, { useEffect, useState } from 'react';
import { paypalService } from '../services/paypalService';

interface PayPalPaymentProps {
  amount: number;
  planName: string;
  tier: string;
  userId: string;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
}

const PayPalPayment: React.FC<PayPalPaymentProps> = ({
  amount,
  planName,
  tier,
  userId,
  onSuccess,
  onError
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializePayPal();
  }, []);

  const initializePayPal = async () => {
    try {
      await paypalService.initialize();
      setIsLoading(false);
      
      // Render PayPal button after initialization
      setTimeout(() => {
        renderPayPalButton();
      }, 100);
    } catch (error) {
      console.error('Failed to initialize PayPal:', error);
      setError('Failed to load PayPal. Please try again.');
      setIsLoading(false);
    }
  };

  const renderPayPalButton = () => {
    const paypal = (window as any).paypal;
    if (!paypal) {
      setError('PayPal SDK not loaded');
      return;
    }

    paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'paypal'
      },
      createOrder: (data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            amount: {
              currency_code: 'USD',
              value: amount.toFixed(2)
            },
            description: `${planName} - ${tier} subscription`
          }],
          intent: 'CAPTURE'
        });
      },
      onApprove: async (data: any, actions: any) => {
        try {
          const details = await actions.order.capture();
          
          // Verify payment with backend
          const verified = await paypalService.verifyPayment(details.id);
          if (!verified) {
            throw new Error('Payment verification failed');
          }

          // Record payment
          const recorded = await paypalService.recordPayment(
            userId,
            details.id,
            amount,
            planName,
            tier
          );

          if (!recorded) {
            throw new Error('Failed to record payment');
          }

          onSuccess(details);
        } catch (error) {
          console.error('Payment processing error:', error);
          onError(error);
        }
      },
      onError: (error: any) => {
        console.error('PayPal error:', error);
        onError(error);
      },
      onCancel: (data: any) => {
        console.log('Payment cancelled:', data);
        onError(new Error('Payment was cancelled'));
      }
    }).render('#paypal-button-container');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading PayPal...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Payment Error</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Plan:</span>
            <span className="font-medium">{planName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tier:</span>
            <span className="font-medium">{tier}</span>
          </div>
          <div className="flex justify-between border-t pt-2">
            <span className="text-gray-900 font-medium">Total:</span>
            <span className="text-lg font-bold text-gray-900">${amount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div id="paypal-button-container" className="min-h-[50px]"></div>

      <div className="text-xs text-gray-500 text-center">
        <p>Secure payment powered by PayPal</p>
        <p>Your payment information is encrypted and secure</p>
      </div>
    </div>
  );
};

export default PayPalPayment;