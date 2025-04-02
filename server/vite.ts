import path from "path";
import fs from "fs";
import { createServer } from "http";
import { createLogger } from "vite";
import express from "express";
import type { Express } from "express";
import type { Server } from "http";
import { fileURLToPath } from 'url';
import cors from "cors";
import { execSync } from "child_process";
import { join } from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const viteLogger = createLogger();

// Dùng màu trong bảng điều khiển
const colors = {
  red: (str: string) => `\u001b[31m${str}\u001b[39m`,
  blue: (str: string) => `\u001b[34m${str}\u001b[39m`,
  green: (str: string) => `\u001b[32m${str}\u001b[39m`,
  yellow: (str: string) => `\u001b[33m${str}\u001b[39m`,
  gray: (str: string) => `\u001b[90m${str}\u001b[39m`,
}

export function log(msg: string, color = colors.blue) {
  console.log(color(`[TimeCafe] ${msg}`));
}

export async function setupVite(app: Express, server: Server) {
  // Thêm middleware CORS cho development
  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:9090'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  try {
    const vite = await import("vite");
    const viteDevMiddleware = await vite.createServer({
      appType: 'custom',
      server: {
        middlewareMode: true,
        hmr: {
          server
        }
      }
    });
    
    app.use(viteDevMiddleware.middlewares);
    log('Vite development server started successfully', colors.green);
  } catch (error) {
    log(`Failed to start Vite server: ${error}`, colors.red);
  }

  log('Starting development server with Vite middleware...', colors.green);
  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      log(`Port already in use. Please kill the process and restart the server.`, colors.red);
      process.exit(1);
    } else {
      throw err;
    }
  });
}

export function serveStatic(app: Express) {
  const clientDistPath = join(process.cwd(), 'client-dist');
  // Kiểm tra xem thư mục client-dist có tồn tại không
  if (!fs.existsSync(clientDistPath)) {
    try {
      log('Client build not found. Building client...', colors.yellow);
      execSync('npm run build:client', { stdio: 'inherit' });
    } catch (error) {
      log('Failed to build client. Please run `npm run build:client` manually.', colors.red);
      process.exit(1);
    }
  }

  // Thêm middleware CORS cho production
  app.use(cors({
    origin: process.env.CORS_ORIGIN || true,
    credentials: true
  }));
  
  // Phục vụ các tệp tĩnh từ thư mục client-dist
  app.use(express.static(clientDistPath));
  
  // Send index.html for all other routes (for SPA routing)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(clientDistPath, 'index.html'));
    }
  });
  
  log('Static file serving configured for production', colors.green);
}
