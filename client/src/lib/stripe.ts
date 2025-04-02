import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';
    if (!stripePublicKey) {
      console.error('Missing Stripe public key');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(stripePublicKey);
  }
  return stripePromise;
};

export const createPaymentIntent = async (sessionId: number) => {
  try {
    const response = await fetch('/api/payments/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to create payment intent');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

export const confirmPayment = async (paymentId: number, stripePaymentId: string) => {
  try {
    const response = await fetch(`/api/payments/${paymentId}/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stripePaymentId }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to confirm payment');
    }

    return await response.json();
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }
};

export const setupCustomerPaymentMethod = async () => {
  try {
    // Step 1: Create or get Stripe customer
    const customerResponse = await fetch('/api/stripe/create-customer', {
      method: 'POST',
      credentials: 'include',
    });

    if (!customerResponse.ok) {
      throw new Error('Failed to create/get Stripe customer');
    }

    // Step 2: Create setup intent
    const setupResponse = await fetch('/api/stripe/setup-intent', {
      method: 'POST',
      credentials: 'include',
    });

    if (!setupResponse.ok) {
      throw new Error('Failed to create setup intent');
    }

    return await setupResponse.json();
  } catch (error) {
    console.error('Error setting up payment method:', error);
    throw error;
  }
};
