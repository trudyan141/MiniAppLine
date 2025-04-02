import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { z } from "zod";
import { insertUserSchema, insertSessionSchema, insertOrderSchema, insertOrderItemSchema, insertPaymentSchema, MenuItem } from "@shared/schema";
import session from "express-session";
import Stripe from "stripe";
import MemoryStore from "memorystore";
import cors from "cors";
import jwt from 'jsonwebtoken';

// Hàm tiện ích để đảm bảo tạo chuỗi ISO an toàn
function formatISODate(date: Date | string | number | null | undefined): string {
  try {
    // Nếu là Date object hợp lệ, sử dụng getUTC methods để đảm bảo format đúng 
    if (date instanceof Date && !isNaN(date.getTime())) {
      return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}T${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}:${String(date.getUTCSeconds()).padStart(2, '0')}.${String(date.getUTCMilliseconds()).padStart(3, '0')}Z`;
    }
    
    // Nếu là số hoặc chuỗi, tạo Date mới và thử lại
    if (date !== null && date !== undefined) {
      const newDate = new Date(date);
      if (!isNaN(newDate.getTime())) {
        return formatISODate(newDate);
      }
    }
    
    // Fallback: trả về thời gian hiện tại
    console.warn("Invalid date provided to formatISODate", date);
    return formatISODate(new Date());
  } catch (error) {
    console.error("Error in formatISODate:", error);
    // Fallback cuối cùng
    return new Date().toLocaleString();
  }
}

// Khóa bí mật cho JWT
const JWT_SECRET = process.env.JWT_SECRET || 'miniappline-jwt-secret';

// Hàm tạo JWT token
const generateToken = (userId: number): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1d' });
};

// Hàm xác thực JWT token
const verifyToken = (token: string): { userId: number } | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number };
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup sessions with MemoryStore for SQLite
  const MemoryStoreSession = MemoryStore(session);
  app.use(
    session({
      store: new MemoryStoreSession({
        checkPeriod: 86400000 // 24 hours
      }),
      secret: process.env.SESSION_SECRET || "time-cafe-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === 'production', // Sử dụng secure trong production (HTTPS)
        httpOnly: true,
        sameSite: 'none', // Bắt buộc phải là 'none' cho cross-origin
        maxAge: 24 * 60 * 60 * 1000,  // 1 day
        path: '/'  // Đảm bảo cookie được gửi cho tất cả các route
      }
    })
  );

  // Cấu hình CORS đơn giản hóa - cho phép tất cả các origin
  app.use(cors({
    origin: true, // Cho phép tất cả các origin
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Middleware xác thực JWT
  app.use((req, res, next) => {
    // Kiểm tra JWT token từ header Authorization
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      
      if (payload && payload.userId) {
        // Lưu userId vào session để tương thích với code hiện tại
        req.session.userId = payload.userId;
      }
    }
    
    // Log thông tin request
    console.log(`[API] ${req.method} ${req.url}`);
    console.log(`[API] User ID: ${req.session.userId || 'Not authenticated'}`);
    
    next();
  });

  // Setup Stripe
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "sk_test_51PTK07Cu9AgLpE3WqAxlBYnCDwIIT7ptcbMfZzqqlhrmvMC4l9QF4v385GoaMNNSkop5v86K1fSV5XEBsxR5zBTT00lGeY13KG";
  console.log("🚀 ~ registerRoutes ~ process.env.STRIPE_SECRET_KEY:", process.env.STRIPE_SECRET_KEY)
  let stripe: Stripe | null = null;
  
  try {
    // Try to initialize Stripe with the key
    stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16' as any, // Cast to any để tránh lỗi type
    });
    console.log("Stripe initialized successfully with key:", stripeSecretKey.substring(0, 8) + "...");
  } catch (error) {
    console.warn("Failed to initialize Stripe:", error);
    // We'll use mock API if initialization fails
  }

  // Test route for authentication
  app.get("/api/test-auth", (req, res) => {
    if (req.session.userId) {
      return res.json({ 
        message: "Authenticated", 
        userId: req.session.userId
      });
    } else {
      return res.status(401).json({ 
        message: "Not authenticated"
      });
    }
  });

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, fullName, email, phoneNumber, dateOfBirth } = req.body;
      
      console.log("Registration request:", req.body);
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }

      // Check if username exists by direct query
      try {
        const sqlite = (db as any).$client;
        
        // Check existing user
        const checkUserStmt = sqlite.prepare('SELECT * FROM users WHERE username = ?');
        const existingUser = checkUserStmt.get(username);
        
        if (existingUser) {
          return res.status(400).json({ message: 'Username already exists' });
        }
        
        // Dùng mật khẩu được hash sẵn (trong thực tế cần bcrypt)
        const hashedPassword = `hashed_${password}`;
        
        // Create user with direct SQL
        const stmt = sqlite.prepare(`
          INSERT INTO users (
            username, password, full_name, email, 
            phone_number, date_of_birth, registered_at
          ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
        `);
        
        const result = stmt.run([
          username,
          hashedPassword,
          fullName || username, // Use username as fullName if not provided
          email || null,
          phoneNumber || null,
          dateOfBirth || null
        ]);
        
        const userId = result.lastInsertRowid;
        
        // Query the newly created user
        const getUserStmt = sqlite.prepare('SELECT * FROM users WHERE id = ?');
        const user = getUserStmt.get(userId);
        
        if (!user) {
          throw new Error('Failed to retrieve created user');
        }
        
        // Convert to camelCase for response
        const userData = {
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          email: user.email,
          phoneNumber: user.phone_number,
          dateOfBirth: user.date_of_birth,
          registeredAt: user.registered_at
        };
        
        console.log("User created successfully:", userData);

        // Tạo JWT token
        const token = generateToken(user.id);
        
        // Set session sau khi đăng ký (vẫn giữ để tương thích)
        req.session.userId = user.id;
        
        res.status(201).json({ 
          user: userData,
          token
        });
      } catch (dbError: any) {
        console.error('Database error during user creation:', dbError);
        res.status(500).json({ message: `Database error: ${dbError.message}` });
      }
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      console.log("Login request:", { username });
      
      // Get user with direct SQL
      try {
        const sqlite = (db as any).$client;
        
        // Get user
        const getUserStmt = sqlite.prepare('SELECT * FROM users WHERE username = ?');
        const user = getUserStmt.get(username);
        
        if (!user) {
          return res.status(401).json({ message: "Invalid credentials" });
        }

        // Hash password the same way as registration
        const hashedPassword = `hashed_${password}`;
        if (user.password !== hashedPassword) {
          return res.status(401).json({ message: "Invalid credentials" });
        }
        
        // Tạo JWT token
        const token = generateToken(user.id);
        
        // Set session sau khi đăng nhập (vẫn giữ để tương thích)
        req.session.userId = user.id;
        
        // Return user without password
        const userData = {
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          email: user.email,
          phoneNumber: user.phone_number,
          dateOfBirth: user.date_of_birth,
          registeredAt: user.registered_at
        };
        
        res.json({
          user: userData,
          token
        });
      } catch (dbError: any) {
        console.error('Database error during login:', dbError);
        res.status(500).json({ message: `Database error: ${dbError.message}` });
      }
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // LINE login and registration routes
  app.post("/api/auth/register-with-line", async (req, res) => {
    try {
      const {
        username,
        fullName,
        email,
        phoneNumber,
        dateOfBirth,
        lineUserId,
        lineDisplayName,
        linePictureUrl,
        lineStatusMessage
      } = req.body;
      
      // Check if LINE user already exists
      const existingLineUser = await storage.getUserByLineId(lineUserId);
      if (existingLineUser) {
        return res.status(400).json({ message: "LINE account already registered" });
      }
      
      // Check if email exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Check if username exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Create user with LINE info
      const user = await storage.createUser({
        username,
        fullName,
        email,
        phoneNumber: phoneNumber || '',
        dateOfBirth: dateOfBirth || '',
        password: '', // No password for LINE users
        lineUserId,
        lineDisplayName,
        linePictureUrl: linePictureUrl || '',
        lineStatusMessage: lineStatusMessage || ''
      });
      
      // Set session
      req.session.userId = user.id;
      
      // Return user
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });
  
  app.post("/api/auth/login-with-line", async (req, res) => {
    try {
      const { lineUserId } = req.body;
      
      // Find user by LINE ID
      const user = await storage.getUserByLineId(lineUserId);
      if (!user) {
        return res.status(401).json({ 
          message: "LINE account not registered", 
          needsRegister: true 
        });
      }
      
      // Set session
      req.session.userId = user.id;
      
      // Return user
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Sử dụng truy vấn SQLite trực tiếp để đảm bảo có stripe_customer_id
      try {
        const sqlite = (db as any).$client;
        
        // Get user
        const getUserStmt = sqlite.prepare('SELECT * FROM users WHERE id = ?');
        const user = getUserStmt.get(userId);
        
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Ánh xạ từ snake_case sang camelCase
        const userData = {
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          email: user.email,
          phoneNumber: user.phone_number,
          dateOfBirth: user.date_of_birth,
          registeredAt: user.registered_at,
          // Ánh xạ stripe_customer_id sang stripeCustomerId
          stripeCustomerId: user.stripe_customer_id
        };
        
        // Trả về user data
        res.json(userData);
      } catch (dbError: any) {
        console.error('[API] Database error:', dbError);
        res.status(500).json({ message: `Database error: ${dbError.message}` });
      }
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // Customer routes
  app.post("/api/stripe/create-customer", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Direct database queries
      try {
        const sqlite = (db as any).$client;
        
        // Get user
        const getUserStmt = sqlite.prepare('SELECT * FROM users WHERE id = ?');
        const user = getUserStmt.get(userId);
        
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // If user already has a Stripe customer ID, return it
        if (user.stripe_customer_id) {
          return res.json({ customerId: user.stripe_customer_id });
        }
        
        // Check if Stripe is initialized
        if (!stripe) {
          return res.status(500).json({ 
            message: "Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable." 
          });
        }
        
        // Create Stripe customer
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.full_name,
        });
        
        // Update user with Stripe customer ID
        const updateStmt = sqlite.prepare(`
          UPDATE users SET stripe_customer_id = ? WHERE id = ?
        `);
        updateStmt.run(customer.id, userId);
        
        res.json({ customerId: customer.id });
      } catch (dbError: any) {
        console.error('[Stripe API] Database error:', dbError);
        res.status(500).json({ message: `Database error: ${dbError.message}` });
      }
    } catch (err: any) {
      console.error("[Stripe API] Error:", err);
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/stripe/setup-intent", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Direct database queries
      try {
        const sqlite = (db as any).$client;
        
        // Get user
        const getUserStmt = sqlite.prepare('SELECT * FROM users WHERE id = ?');
        const user = getUserStmt.get(userId);
        
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        if (!user.stripe_customer_id) {
          return res.status(400).json({ message: "Stripe customer not set up" });
        }
        
        // Check if Stripe is initialized
        if (!stripe) {
          return res.status(500).json({ 
            message: "Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable."
          });
        }
        
        const setupIntent = await stripe.setupIntents.create({
          customer: user.stripe_customer_id,
        });
        
        res.json({ clientSecret: setupIntent.client_secret });
      } catch (dbError: any) {
        console.error('[Stripe API] Database error:', dbError);
        res.status(500).json({ message: `Database error: ${dbError.message}` });
      }
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // Session routes
  app.post("/api/sessions/check-in", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Check if user already has an active session
      const activeSession = await storage.getActiveSessionByUserId(userId);
      console.log("🚀 ~ app.post ~ activeSession:", activeSession)
      if (activeSession) {
        return res.status(400).json({ message: "User already has an active session" });
      }
      
      // Sử dụng hàm tiện ích để tạo chuỗi ISO an toàn
      const now = new Date();
      console.log("Current date object:", now);
      
      const checkInTimeStr = formatISODate(now);
      console.log("ISO string using formatISODate:", checkInTimeStr);
      
      const sessionData = insertSessionSchema.parse({
        userId,
        checkInTime: checkInTimeStr,
      });
      
      const session = await storage.createSession(sessionData);
      res.status(201).json(session);
    } catch (err: any) {
      console.error("Check-in error:", err);
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/sessions/check-out/:id", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const sessionId = parseInt(req.params.id);
      const session = await storage.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      if (session.status !== "active") {
        return res.status(400).json({ message: "Session is not active" });
      }
      
      // Sử dụng hàm tiện ích để tạo chuỗi ISO an toàn
      const now = new Date();
      console.log("Checkout - Current date object:", now);
      
      const checkOutTimeStr = formatISODate(now);
      console.log("Checkout time ISO string:", checkOutTimeStr);
      
      // Parse checkInTime safely
      let checkInTime;
      try {
        // Chuyển đổi checkInTime thành Date object
        checkInTime = new Date(session.checkInTime);
        console.log("Parsed checkInTime:", checkInTime);
        
        if (isNaN(checkInTime.getTime())) {
          throw new Error("Invalid date");
        }
      } catch (error) {
        console.error("Error parsing checkInTime:", error, "Value:", session.checkInTime);
        return res.status(400).json({ message: "Invalid check-in time in session data" });
      }
      
      const totalTimeSeconds = Math.floor((now.getTime() - checkInTime.getTime()) / 1000);
      
      // Calculate total cost based on time
      // First hour: 500 yen
      // Additional time: 8 yen per minute
      // Max daily charge: 2000 yen
      let totalCost = 500;
      
      if (totalTimeSeconds > 3600) {
        const additionalMinutes = Math.ceil((totalTimeSeconds - 3600) / 60);
        totalCost += additionalMinutes * 8;
      }
      
      // Cap at max daily charge
      totalCost = Math.min(totalCost, 2000);
      
      // Add costs from orders
      const orders = await storage.getOrdersBySessionId(sessionId);
      const ordersCost = orders.reduce((sum: number, order: { totalCost: number }) => sum + order.totalCost, 0);
      
      // Log the order information for debugging
      console.log("Orders found:", orders.length);
      console.log("Total order cost:", ordersCost);
      
      totalCost += ordersCost;
      
      // First mark session as completed by directly updating the status
      await storage.updateSession(sessionId, { status: "completed" });
      
      // Then update all other fields
      const updatedSession = await storage.updateSession(
        sessionId,
        {
          checkOutTime: checkOutTimeStr,
          totalTime: totalTimeSeconds,
          totalCost,
        }
      );
      
      res.json(updatedSession);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/sessions/active", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const session = await storage.getActiveSessionByUserId(userId);
      if (!session) {
        return res.status(404).json({ message: "No active session found" });
      }
      
      res.json(session);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/sessions/history", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const sessions = await storage.getSessionsByUserId(userId);
      res.json(sessions);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // Menu routes
  app.get("/api/menu", async (req, res) => {
    try {
      const menuItems = await storage.getMenuItems();
      console.log("🚀 ~ app.get ~ menuItems:", menuItems);
      
      // Đảm bảo URL của ảnh được trả về đúng như trong database
      const processedMenuItems = menuItems.map((item: MenuItem) => {
        // Nếu imageUrl bắt đầu bằng "/images/" thì đây là relative URL
        // Cần chuyển đổi thành URL tuyệt đối để khớp với dữ liệu trong DB
        if (item.imageUrl && item.imageUrl.startsWith('/images/')) {
          console.log("⚠️ Chuyển đổi relative URL thành absolute URL:", item.imageUrl);
          item.imageUrl = `https://miniappline-production.up.railway.app${item.imageUrl}`;
        }
        
        return item;
      });
      
      res.json(processedMenuItems);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/menu/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const menuItems = await storage.getMenuItemsByCategory(category);
      res.json(menuItems);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // Order routes
  app.post("/api/orders", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { sessionId, items } = req.body;
      
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "No items provided in order" });
      }
      
      // Validate session
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      // Enhanced validation for session status
      if (session.checkOutTime) {
        return res.status(400).json({ 
          message: "Cannot place order on completed session. Your session has already ended."
        });
      }
      
      if (session.status !== "active") {
        return res.status(400).json({ message: "Session is not active" });
      }
      
      // Calculate total cost
      let totalCost = 0;
      for (const item of items) {
        const menuItem = await storage.getMenuItem(item.menuItemId);
        if (!menuItem) {
          return res.status(404).json({ message: `Menu item with ID ${item.menuItemId} not found` });
        }
        
        totalCost += menuItem.price * item.quantity;
      }
      
      // Create order
      const orderData = insertOrderSchema.parse({
        sessionId,
        userId,
        totalCost,
      });
      
      const order = await storage.createOrder(orderData);
      
      // Create order items
      for (const item of items) {
        const menuItem = await storage.getMenuItem(item.menuItemId);
        
        const orderItemData = insertOrderItemSchema.parse({
          orderId: order.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: menuItem!.price,
        });
        
        await storage.createOrderItem(orderItemData);
      }
      
      res.status(201).json(order);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/orders/session/:sessionId?", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      let sessionId: number;
      
      // If no sessionId provided, try to use active session
      if (!req.params.sessionId) {
        const activeSession = await storage.getActiveSessionByUserId(userId);
        if (!activeSession) {
          return res.json([]);
        }
        sessionId = activeSession.id;
      } else {
        sessionId = parseInt(req.params.sessionId);
      }
      
      // Validate session
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const orders = await storage.getOrdersBySessionId(sessionId);
      
      // For each order, get order items
      const ordersWithItems = await Promise.all(
        orders.map(async (order: { id: number }) => {
          const items = await storage.getOrderItemsByOrderId(order.id);
          
          // For each item, get menu item details
          const itemsWithDetails = await Promise.all(
            items.map(async (item: { menuItemId: number }) => {
              const menuItem = await storage.getMenuItem(item.menuItemId);
              return {
                ...item,
                menuItem,
              };
            })
          );
          
          return {
            ...order,
            items: itemsWithDetails,
          };
        })
      );
      
      // Calculate total order amount
      const totalAmount = ordersWithItems.reduce((sum, order) => sum + order.totalCost, 0);
      
      console.log("Get orders API - Total order amount:", totalAmount);
      console.log("Get orders API - Orders with items:", ordersWithItems.length);
      
      res.json(ordersWithItems);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // Payment routes
  app.post("/api/payments/create-payment-intent", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { sessionId } = req.body;
      
      // Validate session
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      if (session.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      if (session.status !== "completed") {
        return res.status(400).json({ message: "Session is not completed" });
      }
      
      // Truy vấn SQLite trực tiếp để lấy thông tin user và stripe_customer_id
      try {
        const sqlite = (db as any).$client;
        
        // Get user
        const getUserStmt = sqlite.prepare('SELECT * FROM users WHERE id = ?');
        const user = getUserStmt.get(userId);
        
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        
        if (!user.stripe_customer_id) {
          return res.status(400).json({ message: "User does not have a payment method set up" });
        }
        
        // Create payment in our database first
        const paymentData = insertPaymentSchema.parse({
          userId: userId,
          sessionId: sessionId,
          amount: session.totalCost!,
        });
        
        const payment = await storage.createPayment(paymentData);
        
        // Check if Stripe is initialized
        if (!stripe) {
          // Mock API for development when Stripe API key is not set
          console.log("[MOCK API] Creating fake payment intent for amount:", session.totalCost);
          
          return res.json({
            paymentId: payment.id,
            clientSecret: `mock_pi_secret_${payment.id}_${Date.now()}`,
            note: "This is a mock client secret. Set STRIPE_SECRET_KEY to use real Stripe integration."
          });
        }
        
        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(session.totalCost! * 100), // Convert to cents
          currency: "jpy",
          customer: user.stripe_customer_id,
        });
        
        res.json({
          paymentId: payment.id,
          clientSecret: paymentIntent.client_secret,
        });
      } catch (dbError: any) {
        console.error('[Payment API] Database error:', dbError);
        res.status(500).json({ message: `Database error: ${dbError.message}` });
      }
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/payments/:id/confirm", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const paymentId = parseInt(req.params.id);
      const { stripePaymentId } = req.body;
      
      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      if (payment.userId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const updatedPayment = await storage.updatePaymentStatus(
        paymentId,
        "completed",
        stripePaymentId
      );
      
      res.json(updatedPayment);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // Coupons route
  app.get("/api/coupons", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const coupons = await storage.getActiveCouponsByUserId(userId);
      res.json(coupons);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/coupons/:id/use", async (req, res) => {
    try {
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const couponId = parseInt(req.params.id);
      
      const coupon = await storage.useCoupon(couponId);
      if (!coupon) {
        return res.status(404).json({ message: "Coupon not found" });
      }
      
      res.json(coupon);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // Create webhook for LINE messaging API
  app.post("/api/line/webhook", async (req, res) => {
    try {
      // This would handle LINE webhook events in a production app
      // For now, we'll just acknowledge the request
      res.status(200).end();
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // Automatically create birthday coupons for users
  // In a real application, this would be a cron job
  app.post("/api/admin/create-birthday-coupons", async (req, res) => {
    try {
      // In a real implementation, we would query all users with today's birthday
      // For the demo, we'll create a dummy user array
      const users = [
        {
          id: 1,
          dateOfBirth: formatISODate(new Date()).split('T')[0] // Today
        }
      ];
      
      const today = new Date();
      const createdCoupons = [];
      
      for (const user of users) {
        // We don't need a type cast now as we defined the structure
        const typedUser = user;
        
        if (!typedUser.dateOfBirth) continue;
        
        const birthDate = new Date(typedUser.dateOfBirth);
        
        // Check if today is user's birthday
        if (birthDate.getDate() === today.getDate() && 
            birthDate.getMonth() === today.getMonth()) {
          
          // Create expiry date (7 days from now)
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 7);
          
          // Create coupon with a unique code
          const uniqueCode = `BDAY-${typedUser.id}-${Date.now()}`;
          const coupon = await storage.createCoupon({
            userId: typedUser.id,
            type: "birthday",
            code: uniqueCode,
            value: 2, // 2 hours free
            expiryDate,
          });
          
          createdCoupons.push(coupon);
          
          // In a real app, send LINE message to user
          // This would use the LINE Messaging API
        }
      }
      
      res.json({ createdCoupons });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // Reset menu items route (for development only)
  app.post('/api/admin/reset-menu', async (req, res) => {
    try {
      // Only allow this in development mode
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ success: false, message: "Not allowed in production" });
      }

      // Get SQLite client
      const sqlite = (db as any).$client;
      
      // Delete existing menu items
      sqlite.prepare('DELETE FROM menu_items').run();

      // Create new menu items
      const menuItems = [
        { name: 'Espresso', category: 'Coffee', description: 'Strong Italian coffee', price: 300, image_url: 'https://upload.wikimedia.org/wikipedia/commons/5/51/%28A_Donde_Vamos%2C_Quito%29_Chocolate_of_Ecuador_and_Espresso.JPG', available: 1 },
        { name: 'Latte', category: 'Coffee', description: 'Espresso with steamed milk', price: 350, image_url: 'https://driftaway.coffee/wp-content/uploads/2015/09/shutterstock_117176206.jpg', available: 1 },
        { name: 'Chocolate Cake', category: 'Dessert', description: 'Rich chocolate cake', price: 400, image_url: 'https://i.ebayimg.com/images/g/LtgAAOSwKKxlEsrW/s-l1600.webp', available: 1 },
        { name: 'Green Tea', category: 'Tea', description: 'Japanese green tea', price: 250, image_url: 'https://i.ebayimg.com/images/g/AP8AAOSw6Btj9UCV/s-l1600.webp', available: 1 },
        { name: 'Sandwich', category: 'Food', description: 'Ham and cheese sandwich', price: 500, image_url: 'https://www.clubhouse.ca/-/media/project/oneweb/mccormick-us/frenchs/recipes/h/1376x774/ham_and_cheese_sandwich_with_creamy_yellow_mustard_1376x774.jpg?rev=609ac9507b2641d4bbffd8a53c8bd132&vd=20220426T153226Z&extension=webp&hash=CA4DA2460ED9D2F6183F2483EF4AE1CC', available: 1 },
      ];

      // Prepare insert statement
      const insertStmt = sqlite.prepare(`
        INSERT INTO menu_items (name, category, description, price, image_url, available)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      // Insert each menu item
      menuItems.forEach(item => {
        insertStmt.run(
          item.name, 
          item.category, 
          item.description, 
          item.price, 
          item.image_url, 
          item.available
        );
      });

      // Force a restart of the server to refresh the menu items
      return res.json({ 
        success: true, 
        message: `Reset ${menuItems.length} menu items successfully. Please restart the server to see the updated menu items.` 
      });
    } catch (error: any) {
      console.error("Error resetting menu items:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Failed to reset menu items",
        error: error.message
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
