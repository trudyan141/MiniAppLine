import { build } from 'vite';
import { fileURLToPath } from 'url';
import path from 'path';
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildClient() {
  try {
    console.log('🔨 Bắt đầu build ứng dụng client...');
    
    // Cấu hình cho việc build client
    await build({
      root: path.resolve(__dirname, 'client'),
      base: '/',
      plugins: [react()],
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "client", "src"),
          "@shared": path.resolve(__dirname, "shared"),
          "@assets": path.resolve(__dirname, "attached_assets"),
        },
      },
      build: {
        outDir: path.resolve(__dirname, 'client-dist'),
        emptyOutDir: true,
        sourcemap: false,
        minify: true,
      },
    });
    
    console.log('✅ Ứng dụng client đã được build thành công!');
    console.log(`📂 Output: ${path.resolve(__dirname, 'client-dist')}`);
  } catch (error) {
    console.error('❌ Lỗi khi build ứng dụng client:', error);
    process.exit(1);
  }
}

buildClient(); 