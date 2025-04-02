import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { CardElement, Elements, useStripe, useElements } from "@stripe/react-stripe-js";
import { Stripe, loadStripe } from "@stripe/stripe-js";
import { setupCustomerPaymentMethod } from "@/lib/stripe";
import { useAuth } from "@/contexts/AuthContext";
import { LineButton } from "@/components/ui/line-button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

function PaymentForm() {
  const [, navigate] = useLocation();
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [cardholderName, setCardholderName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [setupIntent, setSetupIntent] = useState<any>(null);
  const [cardError, setCardError] = useState<string | null>(null);

  useEffect(() => {
    async function getSetupIntent() {
      try {
        const intent = await setupCustomerPaymentMethod();
        setSetupIntent(intent);
      } catch (error) {
        console.error("Error setting up payment method:", error);
        toast({
          title: "Error",
          description: "Failed to set up payment method. Please try again.",
          variant: "error",
        });
      }
    }

    getSetupIntent();
  }, [toast]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !setupIntent) {
      setCardError("Payment system is not fully loaded. Please try again.");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setCardError("Card element not found. Please refresh the page.");
      return;
    }

    setIsProcessing(true);

    try {
      const result = await stripe.confirmCardSetup(setupIntent.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: cardholderName,
          },
        },
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      toast({
        title: "Payment method added",
        description: "Your card has been registered successfully.",
        variant: "success",
      });

      // Navigate to home page after successful registration
      navigate("/");
    } catch (error) {
      console.error("Error confirming card setup:", error);
      setCardError(error instanceof Error ? error.message : "Failed to register payment method");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to register payment method",
        variant: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardChange = (event: any) => {
    if (event.error) {
      setCardError(event.error.message);
    } else {
      setCardError(null);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-5 mb-8">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-600">Card Information</label>
          <div className="border border-gray-300 rounded-lg p-4">
            <CardElement
              options={{
                hidePostalCode: true,
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    fontFamily: 'Arial, sans-serif',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                    iconColor: '#06C755',
                  },
                  invalid: {
                    color: '#9e2146',
                    iconColor: '#fa755a',
                  },
                },
              }}
              onChange={handleCardChange}
            />
          </div>
          {cardError && (
            <p className="text-red-500 text-sm mt-1">{cardError}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-600">Cardholder Name</label>
          <input
            type="text"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#06C755] focus:border-[#06C755]"
            placeholder="Name on card"
            required
          />
        </div>
      </div>
      
      <div className="mb-6 bg-gray-50 p-4 rounded-lg flex items-start">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 text-[#4285F4] mt-0.5 mr-2 flex-shrink-0" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-gray-600">
          Your card will only be charged after you check out from Time Cafe. We use Stripe for secure payment processing.
        </p>
      </div>
      
      <button
        type="submit"
        className={`w-full py-3 rounded-lg font-medium bg-[#06C755] text-white hover:bg-[#05a748] focus:outline-none focus:ring-2 focus:ring-[#06C755] focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed`}
        disabled={!stripe || !elements || isProcessing || !!cardError || !cardholderName}
      >
        {isProcessing ? "Processing..." : "Complete Registration"}
      </button>
    </form>
  );
}

export default function PaymentRegistrationPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [stripePromise, setStripePromise] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      navigate("/register");
      return;
    }
    
    // Initialize Stripe
    const initializeStripe = async () => {
      try {
        // Use loadStripe directly
        const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51PTK07Cu9AgLpE3WCw7Pum7R72lu0ozUCNu9Y2VdboMMtwyibXF87PaMil1l2pMkxYyL1UebeXcczVrM4ZwFIAsf00JLbpjpI9';
        console.log("🚀 ~ initializeStripe ~ stripeKey:", stripeKey)
        if (!stripeKey) {
          console.error("Missing Stripe public key");
          return;
        }
        
        const stripe = await loadStripe(stripeKey);
        setStripePromise(stripe);
      } catch (error) {
        console.error("Failed to load Stripe:", error);
      }
    };
    
    initializeStripe();
  }, [user, navigate]);
      

  return (
    <div className="min-h-screen bg-white p-5">
      <div className="flex items-center mb-6">
        <button 
          className="text-gray-900"
          onClick={() => navigate("/register")}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-xl font-bold mx-auto">Payment Method</h1>
      </div>
      
      <p className="text-gray-600 mb-6">
        Please register your credit card for automatic payments after your visits.
      </p>
      
      <Card className="border-none shadow-none">
        <CardContent className="p-0">
          {stripePromise ? (
            <Elements stripe={stripePromise}>
              <PaymentForm />
            </Elements>
          ) : (
            <div className="p-5 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-[#06C755] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading payment form...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
