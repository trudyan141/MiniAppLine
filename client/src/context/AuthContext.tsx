import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { API_BASE_URL, saveAuthToken, removeAuthToken, getAuthToken } from '../lib/queryClient';

// Định nghĩa kiểu dữ liệu cho user
interface User {
  id: number;
  username: string;
  fullName: string;
  email: string | null;
  phoneNumber?: string;
  dateOfBirth?: string;
  registeredAt: string;
}

// Định nghĩa kiểu dữ liệu cho context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (userData: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<User | null>;
}

// Định nghĩa kiểu dữ liệu cho thông tin đăng ký
interface RegisterData {
  username: string;
  password: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
}

// Tạo context với giá trị mặc định
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook để sử dụng Auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Props cho AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

// AuthProvider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Đăng nhập
  const login = async (username: string, password: string): Promise<User> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Đăng nhập thất bại');
      }

      const data = await response.json();
      
      // Lưu token vào localStorage
      if (data.token) {
        saveAuthToken(data.token);
      }
      
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Đăng ký
  const register = async (userData: RegisterData): Promise<User> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Đăng ký thất bại');
      }

      const data = await response.json();
      
      // Lưu token vào localStorage
      if (data.token) {
        saveAuthToken(data.token);
      }
      
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  // Đăng xuất
  const logout = async (): Promise<void> => {
    try {
      // Xóa token trong localStorage
      removeAuthToken();
      
      // Vẫn gọi API logout để xóa session phía server (nếu cần)
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Vẫn xóa user và token kể cả khi API lỗi
      removeAuthToken();
      setUser(null);
    }
  };

  // Lấy thông tin user hiện tại
  const fetchUser = async (): Promise<User | null> => {
    // Kiểm tra token
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return null;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token hết hạn hoặc không hợp lệ
          removeAuthToken();
          setUser(null);
          setLoading(false);
          return null;
        }
        throw new Error('Không thể lấy thông tin người dùng');
      }

      const userData = await response.json();
      setUser(userData);
      setLoading(false);
      return userData;
    } catch (error) {
      console.error('Error fetching user:', error);
      setLoading(false);
      return null;
    }
  };

  // Tự động lấy thông tin user khi component được mount
  useEffect(() => {
    fetchUser();
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    fetchUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 