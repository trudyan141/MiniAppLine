import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import ws from "ws";
import * as schema from "@shared/schema";
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

neonConfig.webSocketConstructor = ws;

// Hàm tiện ích để đảm bảo tạo chuỗi ISO an toàn
export function formatISODate(date: Date | string | number | null | undefined): string | null {
  try {
    if (date === null || date === undefined) {
      return null;
    }
    
    // Nếu là Date object hợp lệ, sử dụng toISOString() để đảm bảo format đúng chuẩn
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toISOString();
    }
    
    // Nếu là chuỗi, kiểm tra xem có đúng format ISO không
    if (typeof date === 'string') {
      // Nếu đã là định dạng ISO chuẩn, trả về nguyên vẹn
      if (date.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/)) {
        return date;
      }
      
      // Nếu không, thử chuyển đổi thành Date và format lại
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toISOString();
      }
    }
    
    // Nếu là số, tạo Date mới và gọi toISOString()
    if (typeof date === 'number') {
      const dateObj = new Date(date);
      if (!isNaN(dateObj.getTime())) {
        return dateObj.toISOString();
      }
    }
    
    // Log lỗi và trả về null nếu không thể chuyển đổi
    console.warn("Invalid date provided to formatISODate:", date);
    return null;
  } catch (error) {
    console.error("Error in formatISODate:", error);
    return null;
  }
}

// Hàm tiện ích cũ để tương thích với code hiện tại
export function toISOString(date: Date | string | null | undefined): string | null {
  return formatISODate(date);
}

// For development, allow running without a database
let dbPool;
let dbClient;

const createMockClient = () => {
  const mockSelect = () => {
    return {
      from: (table: any) => {
        return {
          where: () => {
            return [];
          },
          orderBy: () => {
            return {
              desc: () => [],
              asc: () => []
            };
          }
        };
      }
    };
  };

  const mockInsert = (table: any) => {
    return {
      values: () => {
        return {
          returning: () => []
        };
      }
    };
  };

  const mockUpdate = () => {
    return {
      set: () => {
        return {
          where: () => {
            return {
              returning: () => []
            };
          }
        };
      }
    };
  };

  const mockDelete = () => {
    return {
      where: () => {
        return {
          returning: () => []
        };
      }
    };
  };

  return {
    query: async () => [],
    execute: async () => {},
    select: mockSelect,
    insert: mockInsert,
    delete: mockDelete,
    update: mockUpdate
  };
};

// Create SQLite tables if they don't exist
const createSqliteTables = (sqlite) => {
  // Create users table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone_number TEXT,
      date_of_birth TEXT,
      stripe_customer_id TEXT,
      registered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      line_user_id TEXT UNIQUE,
      line_display_name TEXT,
      line_picture_url TEXT,
      line_status_message TEXT
    );
  `);
  
  // Create sessions table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      table_number TEXT,
      check_in_time TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      check_out_time TEXT,
      total_time INTEGER,
      total_cost REAL,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);
  
  // Create menu_items table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      image_url TEXT,
      available INTEGER DEFAULT 1
    );
  `);
  
  // Create orders table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      order_time TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      total_cost REAL NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (session_id) REFERENCES sessions (id)
    );
  `);
  
  // Create order_items table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      menu_item_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      notes TEXT,
      FOREIGN KEY (order_id) REFERENCES orders (id),
      FOREIGN KEY (menu_item_id) REFERENCES menu_items (id)
    );
  `);
  
  // Create payments table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_time TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      payment_method TEXT NOT NULL DEFAULT 'card',
      stripe_payment_id TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (session_id) REFERENCES sessions (id)
    );
  `);
  
  // Create coupons table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      code TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      value REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expiry_date TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);
  
  console.log("✅ SQLite tables created successfully");
  
  // Seed menu items if menu_items table is empty
  const menuItemCount = sqlite.prepare("SELECT COUNT(*) as count FROM menu_items").get();
  
  if (menuItemCount.count === 0) {
    console.log("🌱 Seeding menu items...");
    
    const menuItems = [
      { name: 'Espresso', category: 'Coffee', description: 'Strong Italian coffee', price: 300, image_url: 'https://upload.wikimedia.org/wikipedia/commons/5/51/%28A_Donde_Vamos%2C_Quito%29_Chocolate_of_Ecuador_and_Espresso.JPG', available: 1 },
      { name: 'Latte', category: 'Coffee', description: 'Espresso with steamed milk', price: 350, image_url: 'https://nhanvipcoffee.com.vn/wp-content/uploads/2024/06/Partners-Latte-FT-BLOG0523-09569880de524fe487831d95184495cc-1024x683.jpeg.webp', available: 1 },
      { name: 'Chocolate Cake', category: 'Dessert', description: 'Rich chocolate cake', price: 400, image_url: 'https://i.ebayimg.com/images/g/LtgAAOSwKKxlEsrW/s-l1600.webp', available: 1 },
      { name: 'Green Tea', category: 'Tea', description: 'Japanese green tea', price: 250, image_url: 'https://i.ebayimg.com/images/g/AP8AAOSw6Btj9UCV/s-l1600.webp', available: 1 },
      { name: 'Sandwich', category: 'Food', description: 'Ham and cheese sandwich', price: 500, image_url: 'https://www.clubhouse.ca/-/media/project/oneweb/mccormick-us/frenchs/recipes/h/1376x774/ham_and_cheese_sandwich_with_creamy_yellow_mustard_1376x774.jpg?rev=609ac9507b2641d4bbffd8a53c8bd132&vd=20220426T153226Z&extension=webp&hash=CA4DA2460ED9D2F6183F2483EF4AE1CC', available: 1 },
    ];
    
    const insertStmt = sqlite.prepare(`
      INSERT INTO menu_items (name, category, description, price, image_url, available)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    menuItems.forEach(item => {
      insertStmt.run(item.name, item.category, item.description, item.price, item.image_url, item.available);
    });
    
    console.log(`✅ Seeded ${menuItems.length} menu items`);
  }

  // Check if we have any users, if not create a test user
  const userCount = sqlite.prepare("SELECT COUNT(*) as count FROM users").get();
  
  if (userCount.count === 0) {
    console.log("🌱 Creating test user...");
    
    const insertStmt = sqlite.prepare(`
      INSERT INTO users (username, password, full_name, email)
      VALUES (?, ?, ?, ?)
    `);
    
    insertStmt.run('test', 'password', 'Test User', 'test@example.com');
    
    console.log(`✅ Created test user with username: test, password: password`);
  }
};

// Create SQLite client
const createSqliteClient = () => {
  const dbPath = process.env.SQLITE_PATH || './sqlite.db';
  
  // Ensure directory exists
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  
  try {
    const sqlite = new Database(dbPath);
    
    // Create tables and seed data
    createSqliteTables(sqlite);
    
    return drizzleSqlite(sqlite, { schema });
  } catch (error) {
    console.error(`Error creating SQLite database: ${error}`);
    console.warn("⚠️ Falling back to mock database");
    return createMockClient();
  }
};

if (process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL) {
  console.log("⚠️ Running with SQLite database for development");
  
  // Use SQLite for development
  dbPool = null;
  dbClient = createSqliteClient();
} else {
  // Try PostgreSQL first, then SQLite, then mock
  if (process.env.DATABASE_URL) {
    try {
      dbPool = new Pool({ connectionString: process.env.DATABASE_URL });
      dbClient = drizzle({ client: dbPool, schema });
      console.log("✅ Connected to PostgreSQL database");
    } catch (error) {
      console.error(`Failed to connect to PostgreSQL: ${error}`);
      console.log("⚠️ Falling back to SQLite database");
      dbPool = null;
      dbClient = createSqliteClient();
    }
  } else {
    console.log("DATABASE_URL is not set. Using SQLite database.");
    dbPool = null;
    dbClient = createSqliteClient();
  }
}

export const pool = dbPool;
export const db = dbClient;
