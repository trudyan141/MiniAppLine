import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { setupVite } from './server/vite.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 8080;

// Tạo HTTP server
const server = createServer(app);

// Thiết lập Vite cho phát triển
async function startServer() {
  try {
    // Thiết lập middleware Vite cho chế độ phát triển
    await setupVite(app, server);
    
    // Khởi động server
    server.listen(port, () => {
      console.log(`Server đang chạy tại http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Lỗi khởi động server:', error);
  }
}

startServer(); 