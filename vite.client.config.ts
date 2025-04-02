import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
  ],
  // Chỉ định rõ ràng thư mục gốc là client
  root: path.resolve(__dirname, "client"),
  // Thiết lập alias để giúp import dễ dàng hơn
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@components": path.resolve(__dirname, "client/src/components"),
      "@styles": path.resolve(__dirname, "client/src/styles"),
      "@pages": path.resolve(__dirname, "client/src/pages"),
      "@lib": path.resolve(__dirname, "client/src/lib"),
      "@contexts": path.resolve(__dirname, "client/src/contexts"),
      "@utils": path.resolve(__dirname, "client/src/utils"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  // Cấu hình build
  build: {
    // Chỉ định rõ ràng thư mục đầu ra cho client
    outDir: path.resolve(__dirname, "client-dist"),
    // Xóa thư mục đầu ra trước khi build
    emptyOutDir: true,
    // Tạo sourcemap cho dễ debug (có thể set false cho production)
    sourcemap: true,
    // Các thiết lập tối ưu hóa
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: false
      }
    },
    // Cấu hình chunk
    rollupOptions: {
      output: {
        // Phân tách các module lớn
        manualChunks: {
          vendor: ['react', 'react-dom', '@tanstack/react-query'],
          ui: ['wouter']
        }
      }
    }
  },
  // Server phát triển (dev server)
  server: {
    port: 3000,
    strictPort: true,
    host: true,
    proxy: {
      // Chuyển hướng các yêu cầu API đến server API chạy trên cổng 9090
      '/api': {
        target: 'http://localhost:9090',
        changeOrigin: true,
        secure: false,
      }
    }
  },
}); 