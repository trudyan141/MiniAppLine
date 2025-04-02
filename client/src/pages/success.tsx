import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { LineButton } from "@/components/ui/line-button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export default function SuccessPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [rating, setRating] = useState(0);

  // Get the last completed session
  const { data: sessions } = useQuery<any[]>({
    queryKey: ['/api/sessions/history'],
    enabled: !!user,
  });

  // Find the most recently completed session
  const lastSession = sessions 
    ? sessions
        .filter(s => s.status === "completed")
        .sort((a, b) => new Date(b.checkOutTime).getTime() - new Date(a.checkOutTime).getTime())[0]
    : null;

  // Get orders for this session
  const { data: orders } = useQuery({
    queryKey: ['/api/orders/session', lastSession?.id],
    enabled: !!lastSession,
  });

  const orderTotal = orders?.reduce((total: number, order: any) => total + order.totalCost, 0) || 0;

  if (!lastSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-5 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#06C755] border-t-transparent rounded-full mb-4"></div>
        <p className="text-gray-600">Loading session details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-5 text-center">
        <div className="w-20 h-20 rounded-full bg-[#06C755]/10 flex items-center justify-center text-[#06C755] mb-6">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-10 w-10" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Thank You!</h1>
        <p className="text-gray-600 mb-6">Your session has ended and payment was successful.</p>
        
        <Card className="bg-gray-50 w-full p-4 rounded-lg mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Total Time</span>
            <span>
              {Math.floor(lastSession.totalTime / 3600)}h {Math.floor((lastSession.totalTime % 3600) / 60)}m
            </span>
          </div>
          {orderTotal > 0 && (
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Food & Drinks</span>
              <span>¥{orderTotal}</span>
            </div>
          )}
          <div className="flex justify-between font-medium">
            <span>Total Paid</span>
            <span>¥{lastSession.totalCost}</span>
          </div>
        </Card>
        
        <div className="w-full space-y-3">
          <LineButton
            variant="primary"
            fullWidth
            className="py-3"
            onClick={() => navigate("/")}
          >
            Back to Home
          </LineButton>
          
          <LineButton
            variant="outline"
            fullWidth
            className="py-3"
            onClick={() => {
              // In a real application, this would show a receipt
              // For now, we'll just go back to the activity page
              navigate("/activity");
            }}
          >
            View Receipt
          </LineButton>
        </div>
      </div>
      
      <div className="p-5 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-600 mb-2">We hope you enjoyed your time!</p>
        <div className="flex justify-center space-x-3">
          {[1, 2, 3, 4, 5].map(star => (
            <button 
              key={star}
              className={`w-10 h-10 rounded-full ${
                star <= rating 
                  ? 'bg-[#06C755]/90 text-white' 
                  : 'bg-gray-100 text-gray-600'
              } flex items-center justify-center transition-colors`}
              onClick={() => setRating(star)}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                fill={star <= rating ? "currentColor" : "none"}
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
