import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useSession } from "@/contexts/SessionContext";
import { Card } from "@/components/ui/card";
import { LineButton } from "@/components/ui/line-button";
import MenuCard from "@/components/MenuCard";
import { MenuItem } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function MenuPage() {
  const [, navigate] = useLocation();
  const { cart, addToCart, placeOrder, activeSession } = useSession();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch menu items
  const { data: menuItems, isLoading } = useQuery<MenuItem[]>({
    queryKey: ['/api/menu'],
  });

  // Group items by category
  const categories = menuItems 
    ? ['all', ...new Set(menuItems.map(item => item.category))]
    : ['all'];

  const filteredItems = menuItems
    ? selectedCategory === 'all'
      ? menuItems
      : menuItems.filter(item => item.category === selectedCategory)
    : [];

  // Group filtered items by category for display
  const itemsByCategory: Record<string, MenuItem[]> = {};
  
  if (filteredItems.length > 0) {
    filteredItems.forEach(item => {
      if (!itemsByCategory[item.category]) {
        itemsByCategory[item.category] = [];
      }
      itemsByCategory[item.category].push(item);
    });
  }

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty cart",
        description: "Please add items to your order first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // First check if we have an active session before trying to place an order
      if (!activeSession) {
        toast({
          title: "No active session",
          description: "You must check in before placing an order",
          variant: "destructive",
        });
        navigate("/check-in");
        return;
      }
      
      // Don't allow orders on completed sessions
      if (activeSession.checkOutTime) {
        toast({
          title: "Session ended",
          description: "You cannot place orders on a completed session",
          variant: "destructive",
        });
        navigate("/");
        return;
      }
      
      await placeOrder();
      toast({
        title: "Order placed",
        description: "Your order has been placed successfully",
        variant: "success",
      });
      navigate("/active-session");
    } catch (error) {
      console.error("Failed to place order:", error);
      toast({
        title: "Order failed",
        description: error instanceof Error ? error.message : "Failed to place your order",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isItemInCart = (item: MenuItem) => {
    return cart.some(cartItem => cartItem.menuItem.id === item.id);
  };

  const getCartQuantity = (item: MenuItem) => {
    const cartItem = cart.find(cartItem => cartItem.menuItem.id === item.id);
    return cartItem ? cartItem.quantity : 0;
  };

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center px-5 py-4 border-b border-gray-200">
        <button 
          className="text-gray-900"
          onClick={() => {
            if (activeSession) {
              navigate("/active-session");
            } else {
              navigate("/");
            }
          }}
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
        <h1 className="text-xl font-bold mx-auto">Menu</h1>
        <div className="relative">
          <button 
            className="text-gray-900"
            onClick={handlePlaceOrder}
            disabled={cart.length === 0 || isSubmitting}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#06C755] rounded-full flex items-center justify-center text-[10px] text-white font-bold">
              {totalItems}
            </span>
          )}
        </div>
      </div>
      
      <div className="bg-white sticky top-0 z-10 border-b border-gray-200">
        <div className="flex px-2 overflow-x-auto py-2 hide-scrollbar">
          {categories.map(category => (
            <button
              key={category}
              className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap mr-2 ${
                selectedCategory === category 
                  ? 'bg-[#06C755] text-white' 
                  : 'text-gray-600'
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? 'All Items' : category}
            </button>
          ))}
        </div>
      </div>
      
      <div className="p-5 mb-20">
        {/* Session Status Warning Banner */}
        {activeSession?.status === "completed" && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Warning:</strong> Your session has ended. You cannot place orders.
                </p>
                <p className="mt-1 text-xs text-yellow-700">
                  Please check in again to start a new session if you want to order food.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {!activeSession && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  You need to check in before placing an order.
                </p>
                <LineButton
                  variant="primary"
                  className="mt-2 text-xs py-1 px-2"
                  onClick={() => navigate("/check-in")}
                >
                  Check in now
                </LineButton>
              </div>
            </div>
          </div>
        )}
      
        {isLoading ? (
          <div className="text-center py-10">
            <div className="animate-spin w-8 h-8 border-4 border-[#06C755] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading menu items...</p>
          </div>
        ) : (
          <>
            {Object.keys(itemsByCategory).length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-600">No menu items found</p>
              </div>
            ) : (
              <>
                {Object.entries(itemsByCategory).map(([category, items]) => (
                  <div key={category} className="mb-6">
                    <h2 className="font-bold text-lg mb-3">{category}</h2>
                    <div className="space-y-4">
                      {items.map(item => (
                        <MenuCard
                          key={item.id}
                          item={item}
                          onAddToOrder={addToCart}
                          isInCart={isItemInCart(item)}
                          cartQuantity={getCartQuantity(item)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {cart.length > 0 && (
          <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-gray-200 flex justify-between items-center max-w-md mx-auto">
            <div>
              <p className="text-sm text-gray-600">Order Total</p>
              <p className="font-bold">
                ¥{cart.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0)}
              </p>
            </div>
            <LineButton
              variant="primary"
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : `Place Order (${totalItems})`}
            </LineButton>
          </div>
        )}
      </div>
    </div>
  );
}
