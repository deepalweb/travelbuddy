import React, { useState } from 'react';
import PayPalPayment from './PayPalPayment';

const PayPalTestPage: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [paymentDetails, setPaymentDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const plans = [
    {
      id: 'basic',
      name: 'Basic Plan',
      price: 9.99,
      tier: 'basic',
      features: ['Trip planning', 'Place recommendations', 'Basic support']
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: 19.99,
      tier: 'premium',
      features: ['All Basic features', 'AI assistant', 'Advanced planning', 'Priority support']
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: 39.99,
      tier: 'pro',
      features: ['All Premium features', 'Team collaboration', 'Custom integrations', 'Dedicated support']
    }
  ];

  const handlePaymentSuccess = (details: any) => {
    console.log('Payment successful:', details);
    setPaymentStatus('success');
    setPaymentDetails(details);
    setError(null);
  };

  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
    setPaymentStatus('error');
    setError(error.message || 'Payment failed');
    setPaymentDetails(null);
  };

  const resetPayment = () => {
    setSelectedPlan(null);
    setPaymentStatus('idle');
    setPaymentDetails(null);
    setError(null);
  };

  if (paymentStatus === 'success') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">Payment Successful!</h2>
          <p className="text-green-700 mb-4">
            Your payment has been processed successfully. You now have access to the {selectedPlan?.name}.
          </p>
          {paymentDetails && (
            <div className="bg-white rounded-lg p-4 mb-4">
              <h3 className="font-medium text-gray-900 mb-2">Payment Details</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Transaction ID:</strong> {paymentDetails.id}</p>
                <p><strong>Status:</strong> {paymentDetails.status}</p>
                <p><strong>Amount:</strong> ${paymentDetails.purchase_units[0].amount.value}</p>
              </div>
            </div>
          )}
          <button
            onClick={resetPayment}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Test Another Payment
          </button>
        </div>
      </div>
    );
  }

  if (selectedPlan) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={() => setSelectedPlan(null)}
            className="flex items-center text-blue-600 hover:text-blue-700"
          >
            <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Plans
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Payment</h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Payment Error</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <PayPalPayment
            amount={selectedPlan.price}
            planName={selectedPlan.name}
            tier={selectedPlan.tier}
            userId="test-user-123" // In real app, get from auth context
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PayPal Payment Test</h1>
        <p className="text-gray-600">Test PayPal integration with different subscription plans</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="text-3xl font-bold text-blue-600 mb-1">
                ${plan.price}
                <span className="text-sm font-normal text-gray-500">/month</span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm text-gray-600">
                  <svg className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => setSelectedPlan(plan)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Select Plan
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <svg className="h-5 w-5 text-yellow-400 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Test Mode</h3>
            <p className="mt-1 text-sm text-yellow-700">
              This is using PayPal Sandbox for testing. No real money will be charged.
              Use PayPal test accounts for testing payments.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayPalTestPage;