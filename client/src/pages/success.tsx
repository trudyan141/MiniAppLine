import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { LineButton } from "@/components/ui/line-button";
import { useAuth } from "@/contexts/AuthContext";
import { useSession } from "@/contexts/SessionContext";
import { useEffect, useState } from "react";
import React from "react";
import { format, parseISO, differenceInMinutes } from 'date-fns';

export default function SuccessPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { setActiveSession, clearCart } = useSession();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const hasRunRef = React.useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>({});

  console.log("Rendering SuccessPage, user:", !!user);

  // Get the last completed session
  const { data: sessions, isLoading: isLoadingSessions, error: sessionsError } = useQuery<any[]>({
    queryKey: ['/api/sessions/history'],
    enabled: !!user,
    retry: 2,
    staleTime: 0,
    refetchOnMount: true,
  });


  // Kiểm tra dữ liệu session và tìm session gần nhất đã hoàn thành
  useEffect(() => {
    if (sessions) {
      const completedSessions = sessions.filter(s => s.status === "completed");
      console.log("Completed sessions:", completedSessions.length);
      
      // Nếu không có session nào được đánh dấu là completed, thử lấy cái mới nhất
      if (completedSessions.length === 0 && sessions.length > 0) {
        const newestSession = [...sessions].sort((a, b) => 
          new Date(b.updatedAt || b.checkOutTime || b.checkInTime).getTime() - 
          new Date(a.updatedAt || a.checkOutTime || a.checkInTime).getTime()
        )[0];
        
        console.log("No completed sessions found, using newest:", newestSession);
        setDebugInfo((prev: Record<string, unknown>) => ({ ...prev, newestSession }));
      }
    }
  }, [sessions]);

  // Find the most recently completed session
  const lastSession = sessions 
    ? sessions
        .filter(s => s.status === "completed" || s.checkOutTime)
        .sort((a, b) => new Date(b.checkOutTime || b.updatedAt).getTime() - new Date(a.checkOutTime || a.updatedAt).getTime())[0]
    : null;

  console.log("Last session found:", lastSession?.id);

  // Log thông tin chi tiết về lastSession
  if (lastSession) {
    console.log("[SUCCESS] Session checkInTime:", lastSession.checkInTime);
    console.log("[SUCCESS] Session checkOutTime:", lastSession.checkOutTime);
    
    // Parse thời gian theo múi giờ địa phương sử dụng date-fns
    try {
      const checkIn = parseISO(lastSession.checkInTime);
      const checkOut = lastSession.checkOutTime ? parseISO(lastSession.checkOutTime) : new Date();
      
      console.log("[SUCCESS] Parsed checkIn time:", checkIn);
      console.log("[SUCCESS] Parsed checkOut time:", checkOut);
      
      // Format thời gian sử dụng date-fns
      const formattedCheckIn = format(checkIn, 'HH:mm');
      const formattedCheckOut = format(checkOut, 'HH:mm');
      
      console.log("[SUCCESS] Formatted check-in:", formattedCheckIn);
      console.log("[SUCCESS] Formatted check-out:", formattedCheckOut);
      
      // Tính thời gian sử dụng phòng
      const durationMinutes = differenceInMinutes(checkOut, checkIn);
      console.log("[SUCCESS] Duration in minutes:", durationMinutes);
    } catch (error) {
      console.error("[SUCCESS] Error parsing dates:", error);
    }
  }

  // Get orders for this session
  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ['/api/orders/session', lastSession?.id],
    enabled: !!lastSession,
  });

  console.log("Orders for session:", orders.length);
  const orderTotal = orders.reduce((total: number, order: any) => total + order.totalCost, 0) || 0;
  const resetSession = () => { 
    // Đặt lại active session thành null
    setActiveSession(null);
    clearCart();
    
    // Đồng thời invalidate các query để đảm bảo dữ liệu được cập nhật
    queryClient.invalidateQueries({ queryKey: ['/api/sessions/active'] });
    queryClient.invalidateQueries({ queryKey: ['/api/sessions/history'] });
  };
  const backHome = () => {
    resetSession();
    navigate("/");
  };
  const backActivity = () => {
    resetSession();
    navigate("/activity");
  };

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
              {lastSession?.totalTime 
                ? `${Math.floor(lastSession.totalTime / 3600)}h ${Math.floor((lastSession.totalTime % 3600) / 60)}m`
                : "N/A"}
            </span>
          </div>
          
          {/* Debug log */}
          <div style={{display: 'none'}}>
            <pre>Orders: {JSON.stringify(orders, null, 2)}</pre>
            <pre>Order Total: {orderTotal}</pre>
            <pre>Session total cost: {lastSession?.totalCost}</pre>
            <pre>Time cost: {lastSession?.totalCost ? (lastSession.totalCost - orderTotal) : "N/A"}</pre>
          </div>
          
          {/* Hiển thị chi phí thời gian (Time cost) */}
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Time cost</span>
            <span>¥{lastSession?.totalCost ? (lastSession.totalCost - orderTotal) : "N/A"}</span>
          </div>
          
          {/* Hiển thị chi phí đồ ăn và đồ uống nếu có */}
          {orderTotal > 0 && (
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Food & Drinks</span>
              <span>¥{orderTotal}</span>
            </div>
          )}
          
          {/* Tổng cộng */}
          <div className="border-t border-gray-200 pt-3 mt-2">
            <div className="flex justify-between font-medium">
              <span>Total Paid</span>
              <span>¥{lastSession?.totalCost || "N/A"}</span>
            </div>
          </div>
        </Card>
        
        <div className="w-full space-y-3">
          <LineButton
            variant="primary"
            fullWidth
            className="py-3"
            onClick={() => backHome()}
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
               backActivity();
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
