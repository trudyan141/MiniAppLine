import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripe, createPaymentIntent, confirmPayment, setupCustomerPaymentMethod } from "@/lib/stripe";
import { Card, CardContent } from "@/components/ui/card";
import { LineButton } from "@/components/ui/line-button";
import { useSession } from "@/contexts/SessionContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

function formatTime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function CheckoutForm({ sessionId, totalAmount }: { sessionId: number, totalAmount: number }) {
  const [, navigate] = useLocation();
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<number | null>(null);

  useEffect(() => {
    const getPaymentIntent = async () => {
      try {
        // Đảm bảo đã setup payment method trước
        console.log("Setting up payment method...");
        await setupCustomerPaymentMethod();
        console.log("Payment method set up successfully");
        
        // Sau đó mới tạo payment intent
        console.log("Creating payment intent...");
        const { clientSecret, paymentId } = await createPaymentIntent(sessionId);
        setClientSecret(clientSecret);
        setPaymentId(paymentId);
      } catch (error) {
        console.error("Error creating payment intent:", error);
        toast({
          title: "Error",
          description: "Failed to initialize payment. Please try again.",
          variant: "error",
        });
      }
    };

    getPaymentIntent();
  }, [sessionId, toast]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret || paymentId === null) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (paymentIntent.status === "succeeded") {
        // Confirm payment on server
        await confirmPayment(paymentId, paymentIntent.id);
        
        toast({
          title: "Payment successful",
          description: "Thank you for your visit!",
          variant: "success",
        });
        
        navigate("/success");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="border border-gray-200 rounded-lg p-4 mb-5">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </Card>
      
      <LineButton
        type="submit"
        variant="primary"
        fullWidth
        className="py-3"
        disabled={!stripe || !elements || isProcessing || !clientSecret}
      >
       
        {isProcessing
          ? "Processing..."
          : `Confirm & Pay ¥${totalAmount}`
        }
      </LineButton>
    </form>
  );
}

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { checkOut, activeSession } = useSession();
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
  const [checkoutSessionData, setCheckoutSessionData] = useState<any>(null);
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(true);
  const [checkoutCompleted, setCheckoutCompleted] = useState(false);

  // Lấy dữ liệu checkout từ session storage khi trang được tải
  useEffect(() => {
    // Lấy thông tin session từ session storage
    const sessionDataStr = sessionStorage.getItem('checkoutSession');
    if (sessionDataStr) {
      try {
        const sessionData = JSON.parse(sessionDataStr);
        console.log("Found checkout data in session storage:", sessionData);
        setCheckoutSessionData(sessionData);
        
        // Thực hiện checkout ngay khi trang được load
        if (sessionData && sessionData.id) {
          completeCheckout();
        }
      } catch (err) {
        console.error("Error parsing checkout session data:", err);
      }
    }
    
    setIsLoadingCheckout(false);
  }, []);

  // Hoàn tất thanh toán và checkout session
  const completeCheckout = async () => {
    try {
      // Kiểm tra xem có dữ liệu session từ storage không, nếu không dùng activeSession
      const sessionToUse = checkoutSessionData || activeSession;
      
      if (!sessionToUse) {
        throw new Error("No session data found for checkout");
      }
      
      if (checkoutCompleted) {
        console.log("Checkout already completed, skipping");
        return true;
      }
      
      console.log("Completing checkout for session:", sessionToUse.id);
      
      // Nếu session đã có status completed hoặc có checkOutTime, báo là đã checkout xong
      if (sessionToUse.status === "completed" || sessionToUse.checkOutTime) {
        console.log("Session is already checked out");
        setCheckoutCompleted(true);
        return true;
      }
      
      // Kiểm tra xem activeSession có tồn tại không để gọi API checkout
      if (!activeSession) {
        console.log("No active session found, but using stored checkout data");
        setCheckoutCompleted(true);
        return true;
      }
      
      // Gọi API checkout thực sự
      await checkOut();
      console.log("Session checked out successfully");
      setCheckoutCompleted(true);
      return true;
    } catch (error) {
      console.error("Error completing checkout:", error);
      return false;
    }
  };

  // Sử dụng lại các query chỉ khi không có session data từ storage
  const { data: sessions } = useQuery<any[]>({
    queryKey: ['/api/sessions/history'],
    enabled: !!user && !checkoutSessionData,
  });

  // Get orders for this session
  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ['/api/orders/session', checkoutSessionData?.id],
    enabled: !!checkoutSessionData?.id,
  });

  useEffect(() => {
    setStripePromise(getStripe());
  }, []);

  // Use stored session data if available, otherwise fallback to query result
  const session = checkoutSessionData || sessions?.find(s => s.status === "active");

  if (isLoadingCheckout || !session) {
    return (
      <div className="min-h-screen bg-white p-5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#06C755] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout details...</p>
        </div>
      </div>
    );
  }

  // Calculate order total - prioritize stored value if available
  const orderTotal = checkoutSessionData?.orderTotal || 
                    orders.reduce((total: number, order: any) => total + order.totalCost, 0) || 0;
  console.log("Orders:", orders);
  console.log("Order total:", orderTotal);

  // Parse thời gian
  const checkInTime = new Date(session.checkInTime);
  // For checkout, we use current time as we haven't checked out yet
  const checkOutTime = checkoutSessionData?.checkOutTime ? new Date(checkoutSessionData.checkOutTime) : new Date();
  
  // Format theo định dạng giờ địa phương
  const formattedCheckInTime = checkInTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  
  const formattedCheckOutTime = checkOutTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  
  // Tính toán tổng thời gian dự kiến (chưa checkout)
  const expectedTimeDiffSeconds = Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / 1000);
  const expectedTimeFormatted = formatTime(Math.max(900, expectedTimeDiffSeconds)); // Tối thiểu 15 phút
  
  // Calculate time cost (500 yen cho 15 phút đầu tiên)
  const timeCost = 500;
  
  // Tổng chi phí dự kiến
  const expectedTotalCost = timeCost + orderTotal;

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center px-5 py-4 border-b border-gray-200">
        <button 
          className="text-gray-900"
          onClick={() => navigate("/")}
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
        <h1 className="text-xl font-bold mx-auto">Check Out</h1>
      </div>
      
      <div className="p-5 space-y-5 mb-20">
        <div className="bg-[#06C755]/10 p-4 rounded-lg">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#06C755]/20 flex items-center justify-center text-[#06C755]">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Time (Billing)</p>
              <h2 className="text-lg font-bold text-gray-900">
                {formatTime(session.totalTime)}
              </h2>
              {expectedTimeDiffSeconds < 60 && (
                <p className="text-xs text-gray-500">
                  Expected: {expectedTimeDiffSeconds}s (min. charge 15m)
                </p>
              )}
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Check-in</span>
              <span>{formattedCheckInTime}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Check-out</span>
              <span>{formattedCheckOutTime}</span>
            </div>
          </div>
        </div>
        
        {orders && orders.length > 0 && (
          <Card className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium mb-3">Order Summary</h3>
            
            <div className="space-y-3 mb-4">
              {orders.flatMap((order: any) => 
                order.items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex">
                      <span className="text-gray-600 mr-2">{item.quantity}x</span>
                      <span>{item.menuItem.name}</span>
                    </div>
                    <span>¥{item.price * item.quantity}</span>
                  </div>
                ))
              )}
            </div>
            
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>¥{orderTotal}</span>
              </div>
            </div>
          </Card>
        )}
        
        <Card className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium mb-3">Payment Summary</h3>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Time ({formatTime(session.totalTime)})</span>
              <span>¥{timeCost}</span>
            </div>
            
            {orderTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Food & Drinks</span>
                <span>¥{orderTotal}</span>
              </div>
            )}
          </div>
          
          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span className="text-[#06C755]">¥{expectedTotalCost}</span>
            </div>
          </div>
        </Card>
        
        <div className="bg-gray-50 p-4 rounded-lg flex items-start">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-[#4285F4] mr-3 mt-0.5" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <div>
            <div className="flex justify-between mb-1">
              <h3 className="font-medium">Payment Method</h3>
            </div>
            <div className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-4 w-4 mr-1 text-[#4285F4]" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <p className="text-sm text-gray-600">Enter payment details below</p>
            </div>
          </div>
        </div>
        
        {stripePromise && session && (
          <Elements stripe={stripePromise}>
            <CheckoutForm 
              sessionId={session.id} 
              totalAmount={expectedTotalCost} 
            />
          </Elements>
        )}
      </div>
    </div>
  );
}
