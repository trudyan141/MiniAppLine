import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { useSession } from "@/contexts/SessionContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { LineButton } from "@/components/ui/line-button";
import SessionTimer from "@/components/SessionTimer";
import MenuCard from "@/components/MenuCard";
import { MenuItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function ActiveSessionPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { activeSession, checkOut, addToCart, cart, orders, totalOrderAmount } = useSession();
  const { toast } = useToast();
  const [currentTimeCost, setCurrentTimeCost] = useState(0);
  const [currentTimeSeconds, setCurrentTimeSeconds] = useState(0);
  
  // Log state for debugging
  useEffect(() => {
    console.log("Active session:", activeSession);
    console.log("Orders:", orders);
    console.log("Total order amount:", totalOrderAmount);
  }, [activeSession, orders, totalOrderAmount]);

  // Redirect if no active session or handle completed session
  useEffect(() => {
    if (!activeSession) {
      navigate("/");
    } else if (activeSession.status === "completed") {
      toast({
        title: "Session ended",
        description: "Your session has already ended. Please check in again to start a new session.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [activeSession, navigate, toast]);

  // Fetch popular menu items
  const { data: menuItems } = useQuery<MenuItem[]>({
    queryKey: ['/api/menu'],
    enabled: !!user,
  });

  const popularItems = menuItems?.slice(0, 2);

  const handleCheckOut = () => {
    // Navigate to checkout scan page instead of directly checking out
    navigate("/checkout-scan");
  };

  const handleTimeUpdate = (seconds: number, cost: number) => {
    setCurrentTimeSeconds(seconds);
    setCurrentTimeCost(cost);
  };

  const isItemInCart = (item: MenuItem) => {
    return cart.some(cartItem => cartItem.menuItem.id === item.id);
  };

  const getCartQuantity = (item: MenuItem) => {
    const cartItem = cart.find(cartItem => cartItem.menuItem.id === item.id);
    return cartItem ? cartItem.quantity : 0;
  };

  if (!activeSession) {
    return null;
  }

  return (
    <div className="min-h-screen">
      <div className="bg-[#06C755] px-5 pt-10 pb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-white text-xl font-bold">Time Cafe</h1>
            <p className="text-white/80 text-sm">Welcome back, {user?.fullName?.split(' ')[0]}</p>
          </div>
          <Link href="/profile">
            <div className="relative">
              <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 text-white" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>
          </Link>
        </div>
        
        {activeSession && (
          <SessionTimer 
            session={activeSession} 
            onTimeUpdate={handleTimeUpdate}
          />
        )}
      </div>
      
      <div className="p-5 -mt-3 bg-white rounded-t-3xl mb-20">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card 
            className="bg-gray-50 p-4 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => navigate("/menu")}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 text-[#06C755] mb-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="font-medium text-center">Order Now</p>
            <p className="text-xs text-gray-600 text-center">Food & drinks</p>
          </Card>
          
          <Card 
            className="bg-gray-50 p-4 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={handleCheckOut}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 text-red-500 mb-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <p className="font-medium text-center text-red-500">Check Out</p>
            <p className="text-xs text-gray-600 text-center">End your session</p>
          </Card>
        </div>
        
        <h2 className="font-bold text-lg mb-3">Popular Items</h2>
        
        <div className="space-y-4">
          {popularItems && popularItems.map(item => (
            <MenuCard
              key={item.id}
              item={item}
              onAddToOrder={addToCart}
              isInCart={isItemInCart(item)}
              cartQuantity={getCartQuantity(item)}
            />
          ))}
        </div>
        
        <LineButton
          variant="outline"
          fullWidth
          className="w-full mt-4 py-3 font-medium border-t border-gray-200"
          onClick={() => navigate("/menu")}
        >
          View Full Menu
        </LineButton>
      </div>
    </div>
  );
}
