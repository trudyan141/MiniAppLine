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
  setActiveSession: React.Dispatch<React.SetStateAction<Session | null>>;
  isLoadingSession: boolean;
  cart: CartItem[];
  addToCart: (item: MenuItem, quantity: number) => void;
  removeFromCart: (itemId: number) => void;
  clearCart: () => void;
  checkIn: () => Promise<Session>;
  checkOut: () => Promise<Session | null>;
  startCheckout: () => Promise<Session | null>;
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
  } = useQuery<Session | null>({
    queryKey: ['/api/sessions/active'],
    enabled: !!user,
    refetchInterval: false,
  });

  // Update activeSession state when data changes
  useEffect(() => {
    if (activeSessionData) {
      setActiveSession(activeSessionData);
    }
  }, [activeSessionData]);

  // Fetch orders for active session
  const { 
    data: ordersData,
    refetch: refetchOrders
  } = useQuery({
    queryKey: ['/api/orders/session'],
    enabled: true, // Always enabled to handle session changes
    refetchInterval: 3000, // Refetch every 3 seconds while active
  });
  
  // Ép kiểu dữ liệu orders để đảm bảo type safety
  const orders = ordersData as Order[] | null;

  // Calculate total order amount
  const totalOrderAmount = orders?.reduce((total: number, order: Order) => total + order.totalCost, 0) || 0;

  // Check in function
  const checkIn = async () => {
    try {
      // Gọi API thật để tạo phiên
      const res = await apiRequest('POST', '/api/sessions/check-in', {
        tableId: 1, // Có thể làm động sau này
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to check in");
      }

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
    // Phải có phiên active mới cho phép thêm vào giỏ hàng
    if (!activeSession) {
      toast({
        title: "No active session",
        description: "You need to check in first before adding items to cart",
        variant: "error",
      });
      return;
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
      setActiveSession(null);
      clearCart();
      toast({
        title: "Checked out",
        description: "Your session has ended. Thank you for visiting Time Cafe!",
        variant: "success",
      });
    },
    onError: (error) => {
      toast({
        title: "Check-out failed",
        description: error instanceof Error ? error.message : "Failed to end your session",
        variant: "error",
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
        variant: "success",
      });
    },
    onError: (error) => {
      console.error("Error processing order:", error);
      toast({
        title: "Order failed",
        description: error instanceof Error ? error.message : "Failed to place your order",
        variant: "error",
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

  // Start checkout function - Lưu tạm session để hiển thị trang checkout mà không kết thúc session
  const startCheckout = async () => {
    if (!activeSession) return null;
    
    // Lưu session vào sessionStorage để có thể sử dụng ở trang checkout
    try {
      // Lấy tất cả orders hiện tại
      await refetchOrders();
      
      // Lưu session và orders vào sessionStorage
      const sessionData = {
        ...activeSession,
        orders: ordersData,
        orderTotal: totalOrderAmount
      };
      
      // Lưu vào session storage để dùng ở trang checkout
      sessionStorage.setItem('checkoutSession', JSON.stringify(sessionData));
      
      console.log("Saved session for checkout:", sessionData);
      
      return activeSession;
    } catch (error) {
      console.error("Error preparing for checkout:", error);
      toast({
        title: "Checkout preparation failed",
        description: "Failed to prepare checkout data",
        variant: "error",
      });
      return null;
    }
  };

  return (
    <SessionContext.Provider value={{
      activeSession,
      setActiveSession,
      isLoadingSession,
      cart,
      addToCart,
      removeFromCart,
      clearCart,
      checkIn,
      checkOut,
      startCheckout,
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
