import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { createServer, Server } from "http";
import session from "express-session";
import { registerRoutes } from "./routes";
import { setupDatabase } from "./db";
import { seedMenuItems } from "./seed";
import Vite from "vite";
import { testSQLiteDateHandling } from "./debug";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add middleware to log every request
app.use((req, res, next) => {
  console.log(`[TimeCafe] ${req.method} ${req.url}`);
  console.log('[TimeCafe] Request headers:', req.headers);
  console.log('[TimeCafe] Cookie:', req.headers.cookie);
  console.log('[TimeCafe] Session ID:', req.headers.cookie?.match(/connect\.sid=([^;]+)/)?.[1]);
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  // Kiểm tra cách xử lý ngày tháng ngay khi khởi động server
  try {
    console.log("===== Testing SQLite Date Handling =====");
    const result = await testSQLiteDateHandling();
    console.log("Test result:", result);
    console.log("========================================");
  } catch (error) {
    console.error("Error during SQLite date test:", error);
  }
})();
