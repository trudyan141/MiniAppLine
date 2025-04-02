import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Key để lưu token trong localStorage
export const AUTH_TOKEN_KEY = 'auth_token';

// API base URL có thể được thay đổi khi cần kết nối từ GitHub Pages đến Railway
// Địa chỉ API server trên Railway
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://miniappline-production.up.railway.app';
console.log("🚀 ~ API_BASE_URL:", API_BASE_URL)

// Lưu token trong localStorage
export function saveAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

// Lấy token từ localStorage
export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

// Xóa token khỏi localStorage khi đăng xuất
export function removeAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Nếu URL không có protocol (http:// hoặc https://), thêm API_BASE_URL
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  // Chuẩn bị request options
  const options: RequestInit = {
    method,
    headers: {},
  };
  
  // Thêm token vào header nếu đã đăng nhập
  const token = getAuthToken();
  if (token) {
    options.headers = { 
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
  }
  
  // Chỉ thêm headers và body nếu method không phải GET hoặc HEAD và có data
  if (method !== 'GET' && method !== 'HEAD' && data !== undefined) {
    options.headers = { 
      ...options.headers,
      "Content-Type": "application/json",
    };
    options.body = JSON.stringify(data);
  }
  
  console.log(`Gọi API: ${method} ${fullUrl}`);
  const res = await fetch(fullUrl, options);
  console.log(`Kết quả API: ${res.status}`);

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const path = queryKey[0] as string;
    // Nếu path không có protocol (http:// hoặc https://), thêm API_BASE_URL
    const fullUrl = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
    
    const options: RequestInit = {
      headers: {}
    };
    
    // Thêm token vào header nếu đã đăng nhập
    const token = getAuthToken();
    if (token) {
      options.headers = { 
        'Authorization': `Bearer ${token}`
      };
    }
    
    const res = await fetch(fullUrl, options);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
