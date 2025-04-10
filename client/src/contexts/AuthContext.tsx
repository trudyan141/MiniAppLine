import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@shared/schema';
import { apiRequest, API_BASE_URL, AUTH_TOKEN_KEY } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  loginWithLINE, 
  loginWithLINEAccount, 
  getLINEProfile, 
  registerWithLINE 
} from '@/lib/line';

// Sử dụng API_BASE_URL từ queryClient.ts để đảm bảo đồng nhất
console.log("🚀 ~ AuthContext using API_BASE_URL:", API_BASE_URL);

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: {
    username: string;
    password: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    dateOfBirth: string;
  }) => Promise<void>;
  loginWithLINE: (liff: any) => Promise<void>;
  registerWithLINE: (liff: any, userData: {
    email: string;
    phoneNumber?: string;
    dateOfBirth?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        
        // Kiểm tra token trong localStorage
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) {
          console.log("No token found in localStorage");
          setIsLoading(false);
          return;
        }
        
        console.log("Token found in localStorage, fetching user profile...");
        const response = await apiRequest('GET', '/api/auth/me');
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          console.log("User profile loaded from API");
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        // Xóa token nếu không hợp lệ
        localStorage.removeItem(AUTH_TOKEN_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const res = await apiRequest('POST', '/api/auth/login', { username, password });
      const data = await res.json();
      
      // Lưu token vào localStorage nếu có
      if (data.token) {
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        console.log("Token saved to localStorage:", data.token.substring(0, 20) + "...");
      } else {
        console.warn("No token received from login API");
      }
      
      // Lưu thông tin user
      setUser(data.user || data);
      
      toast({
        title: "Logged in successfully",
        description: `Welcome back, ${data.user?.fullName || data.fullName}!`,
        variant: "success",
      });
    } catch (error) {
      console.error('Failed to login:', error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "error",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    username: string;
    password: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    dateOfBirth: string;
  }) => {
    try {
      setIsLoading(true);
      const res = await apiRequest('POST', '/api/auth/register', userData);
      const data = await res.json();
      
      // Lưu token vào localStorage nếu có
      if (data.token) {
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        console.log("Token saved to localStorage from register");
      }
      
      // Lưu thông tin user
      setUser(data.user || data);
      
      toast({
        title: "Registration successful",
        description: `Welcome to Time Cafe, ${data.user?.fullName || data.fullName}!`,
        variant: "success",
      });
    } catch (error) {
      console.error('Failed to register:', error);
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Failed to create account",
        variant: "error",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await apiRequest('POST', '/api/auth/logout', {});
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
        variant: "success",
      });
    } catch (error) {
      console.error('Failed to logout:', error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out",
        variant: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // LINE login function
  const handleLoginWithLINE = async (liff: any) => {
    try {
      setIsLoading(true);
      
      // First ensure user is logged in with LINE
      await loginWithLINE(liff);
      
      try {
        // Try to login with existing LINE account
        const userData = await loginWithLINEAccount(liff);
        setUser(userData);
        toast({
          title: "Logged in with LINE",
          description: `Welcome back, ${userData.fullName}!`,
          variant: "success",
        });
      } catch (error: any) {
        // If error contains needsRegister, the user needs to register first
        if (error.message && error.message.includes("not registered")) {
          toast({
            title: "LINE Account Not Registered",
            description: "Please register your LINE account first",
            variant: "error",
          });
          throw new Error("LINE_NOT_REGISTERED");
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error("Failed to login with LINE:", error);
      if (error instanceof Error && error.message !== "LINE_NOT_REGISTERED") {
        toast({
          title: "LINE Login Failed",
          description: error.message || "Could not login with LINE",
          variant: "error",
        });
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // LINE registration function
  const handleRegisterWithLINE = async (liff: any, userData: {
    email: string;
    phoneNumber?: string;
    dateOfBirth?: string;
  }) => {
    try {
      setIsLoading(true);
      
      // First ensure user is logged in with LINE
      await loginWithLINE(liff);
      
      // Then register with our system
      const newUser = await registerWithLINE(liff, userData);
      setUser(newUser);
      
      toast({
        title: "Registration Successful",
        description: `Welcome to Time Cafe, ${newUser.fullName}!`,
        variant: "success",
      });
    } catch (error) {
      console.error("Failed to register with LINE:", error);
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Could not register with LINE",
        variant: "error",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      register, 
      loginWithLINE: handleLoginWithLINE,
      registerWithLINE: handleRegisterWithLINE,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
