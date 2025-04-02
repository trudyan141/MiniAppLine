import { createServer } from 'vite';
import { fileURLToPath } from 'url';
import path from 'path';
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Khởi động máy chủ Vite
async function startDevServer() {
  try {
    const server = await createServer({
      // Cấu hình cho Vite
      root: path.join(__dirname, 'client'),
      server: {
        port: 8080,
        strictPort: true,
        host: true,
      },
      plugins: [react()],
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "client", "src"),
          "@shared": path.resolve(__dirname, "shared"),
          "@assets": path.resolve(__dirname, "attached_assets"),
        },
      },
    });

    await server.listen();
    console.log(`Dev server đang chạy tại http://localhost:8080`);
    console.log(`⚠️ Chú ý: Một số tính năng cần kết nối database sẽ không hoạt động.`);
  } catch (error) {
    console.error('Lỗi khởi động server:', error);
    process.exit(1);
  }
}

startDevServer(); 