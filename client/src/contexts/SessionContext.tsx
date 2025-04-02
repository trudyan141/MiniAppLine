import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Session, MenuItem, Order } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

interface SessionContextType {
  activeSession: Session | null;
  isLoadingSession: boolean;
  cart: CartItem[];
  addToCart: (item: MenuItem, quantity: number) => void;
  removeFromCart: (itemId: number) => void;
  clearCart: () => void;
  checkIn: () => Promise<Session>;
  checkOut: () => Promise<Session | null>;
  placeOrder: () => Promise<Order | null>;
  orders: Order[] | null;
  totalOrderAmount: number;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeSession, setActiveSession] = useState<Session | null>(null);

  // Fetch active session
  const { 
    data: activeSessionData, 
    isLoading: isLoadingSession 
  } = useQuery({
    queryKey: ['/api/sessions/active'],
    enabled: !!user,
    refetchInterval: false,
  });

  // Fetch orders for active session
  const { 
    data: orders,
    refetch: refetchOrders
  } = useQuery({
    queryKey: ['/api/orders/session'],
    enabled: true, // Always enabled to handle session changes
    refetchInterval: 3000, // Refetch every 3 seconds while active
  });

  // Calculate total order amount
  const totalOrderAmount = orders?.reduce((total, order) => total + order.totalCost, 0) || 0;

  // Check in function
  const checkIn = async () => {
    try {
      // Dev mode: Tạo phiên giả lập
      if (process.env.NODE_ENV === 'development' && !activeSession) {
        console.log("Development mode: Creating mock session");
        const mockSession = {
          id: 1,
          userId: 1,
          tableId: 1,
          checkInTime: new Date().toISOString(),
          status: "active"
        };
        
        setActiveSession(mockSession as Session);
        
        toast({
          title: "Checked in (Dev Mode)",
          description: "Created mock session for development",
        });
        
        return mockSession;
      }
      
      // Production code
      const res = await apiRequest('POST', '/api/sessions', {
        tableId: 1, // You can make this dynamic later
      });

      const session = await res.json();
      setActiveSession(session);
      return session;
    } catch (error) {
      console.error('Check-in failed:', error);
      throw error;
    }
  };

  // Add to cart function
  const addToCart = (item: MenuItem, quantity: number) => {
    // In dev mode, always allow adding to cart
    if (process.env.NODE_ENV === 'development' && !activeSession) {
      console.log("Development mode: Auto-creating session for cart");
      checkIn().then(() => {
        console.log("Mock session created for adding to cart");
      });
    }
    
    setCart(prevCart => {
      const existingItemIndex = prevCart.findIndex(cartItem => cartItem.menuItem.id === item.id);
      
      if (existingItemIndex !== -1) {
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex].quantity += quantity;
        return updatedCart;
      }
      
      return [...prevCart, { menuItem: item, quantity }];
    });
  };

  // Remove item from cart
  const removeFromCart = (itemId: number) => {
    setCart(prevCart => prevCart.filter(item => item.menuItem.id !== itemId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  // Check out mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      if (!activeSession) return null;
      const res = await apiRequest('POST', `/api/sessions/check-out/${activeSession.id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions/active'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sessions/history'] });
      clearCart();
      toast({
        title: "Checked out",
        description: "Your session has ended. Thank you for visiting Time Cafe!",
      });
    },
    onError: (error) => {
      toast({
        title: "Check-out failed",
        description: error instanceof Error ? error.message : "Failed to end your session",
        variant: "destructive",
      });
    },
  });

  // Place order mutation
  const placeOrderMutation = useMutation({
    mutationFn: async () => {
      // Enhanced validation
      if (!activeSession) {
        throw new Error("No active session found. Please check in first.");
      }
      
      if (cart.length === 0) {
        throw new Error("Your cart is empty. Please add items to your order.");
      }
      
      // Check if session is still active (not checked out)
      if (activeSession.checkOutTime) {
        throw new Error("Your session has ended. You cannot place orders on a closed session.");
      }
      
      const orderItems = cart.map(item => ({
        menuItemId: item.menuItem.id,
        quantity: item.quantity,
      }));
      
      try {
        const res = await apiRequest('POST', '/api/orders', {
          sessionId: activeSession.id,
          items: orderItems,
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to place your order");
        }
        
        return res.json();
      } catch (error) {
        console.error("Failed to place order:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Force immediate refetch of orders to update the total
      refetchOrders();
      clearCart();
      toast({
        title: "Order placed",
        description: "Your order has been placed successfully.",
      });
    },
    onError: (error) => {
      console.error("Error processing order:", error);
      toast({
        title: "Order failed",
        description: error instanceof Error ? error.message : "Failed to place your order",
        variant: "destructive",
      });
    },
  });

  // Check out function
  const checkOut = async () => {
    return await checkOutMutation.mutateAsync();
  };

  // Place order function
  const placeOrder = async () => {
    return await placeOrderMutation.mutateAsync();
  };

  return (
    <SessionContext.Provider value={{
      activeSession,
      isLoadingSession,
      cart,
      addToCart,
      removeFromCart,
      clearCart,
      checkIn,
      checkOut,
      placeOrder,
      orders,
      totalOrderAmount,
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
