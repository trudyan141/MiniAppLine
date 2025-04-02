import { loadStripe, Stripe } from '@stripe/stripe-js';
import { apiRequest, API_BASE_URL, AUTH_TOKEN_KEY } from '@/lib/queryClient';
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51PTK07Cu9AgLpE3WCw7Pum7R72lu0ozUCNu9Y2VdboMMtwyibXF87PaMil1l2pMkxYyL1UebeXcczVrM4ZwFIAsf00JLbpjpI9';
    console.log("🚀 ~ getStripe ~ stripePublicKey:", stripePublicKey)
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
    const response = await apiRequest('POST', '/api/payments/create-payment-intent', {
      sessionId,
    }, { credentials: 'include' });

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
    const response = await apiRequest('POST', `/api/payments/${paymentId}/confirm`, {
      stripePaymentId,
    }, { credentials: 'include' });
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
    console.log("Starting customer creation process...");
    
    // Log thông tin authentication token
    const authToken = localStorage.getItem('auth_token');
    console.log("Auth token present:", !!authToken);
    
    const customerResponse = await apiRequest('POST', '/api/stripe/create-customer', {}, { credentials: 'include' });
    
    console.log("Customer response status:", customerResponse.status);
    if (!customerResponse.ok) {
      const errorText = await customerResponse.text();
      console.error("Customer creation failed:", errorText);
      throw new Error(`Failed to create/get Stripe customer: ${errorText}`);
    }
    
    const customerData = await customerResponse.json();
    console.log("Customer created/retrieved:", customerData);

    // Step 2: Create setup intent
    console.log("Starting setup intent creation...");
    const setupResponse = await apiRequest('POST', '/api/stripe/setup-intent', {}, { credentials: 'include' });
    
    console.log("Setup intent response status:", setupResponse.status);
    if (!setupResponse.ok) {
      const errorText = await setupResponse.text();
      console.error("Setup intent creation failed:", errorText);
      throw new Error(`Failed to create setup intent: ${errorText}`);
    }

    return await setupResponse.json();
  } catch (error: any) {
    console.error('Error setting up payment method:', error);
    // Thêm thông báo chi tiết hơn cho người dùng
    alert(`Không thể thiết lập phương thức thanh toán: ${error.message}. Vui lòng kiểm tra console để biết thêm chi tiết.`);
    throw error;
  }
};
