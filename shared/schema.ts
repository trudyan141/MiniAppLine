import { pgTable, text, serial, integer, boolean, timestamp, real, primaryKey } from "drizzle-orm/pg-core";
import { sqliteTable, text as sqliteText, integer as sqliteInt, real as sqliteReal } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Hàm tiện ích tạo chuỗi ISO an toàn
function safeISOString(date: Date): string {
  try {
    // Kiểm tra xem date có phải là date object hợp lệ không
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      console.error("Invalid date object:", date);
      return new Date().toISOString();
    }
    
    // Tạo chuỗi ISO chuẩn theo định dạng ISO 8601
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    const milliseconds = String(date.getUTCMilliseconds()).padStart(3, '0');
    
    const isoString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;
    console.log("Generated ISO string:", isoString, "from date:", date);
    
    // Kiểm tra điểm cuối cùng
    return isoString;
  } catch (error) {
    console.error("Error creating ISO string from date:", error, "Date:", date);
    // Fallback an toàn
    return new Date().toISOString();
  }
}

// Keep PostgreSQL schema for compatibility
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"), // Optional for LINE login
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phoneNumber: text("phone_number"),
  dateOfBirth: text("date_of_birth"),
  stripeCustomerId: text("stripe_customer_id"),
  registeredAt: timestamp("registered_at").$defaultFn(() => new Date()).notNull(),
  // LINE specific fields
  lineUserId: text("line_user_id").unique(),
  lineDisplayName: text("line_display_name"),
  linePictureUrl: text("line_picture_url"),
  lineStatusMessage: text("line_status_message"),
});

// SQLite schema
export const usersTable = sqliteTable("users", {
  id: sqliteInt("id").primaryKey({ autoIncrement: true }),
  username: sqliteText("username").notNull().unique(),
  password: sqliteText("password"), // Optional for LINE login
  fullName: sqliteText("full_name").notNull(),
  email: sqliteText("email").notNull().unique(),
  phoneNumber: sqliteText("phone_number"),
  dateOfBirth: sqliteText("date_of_birth"),
  stripeCustomerId: sqliteText("stripe_customer_id"),
  registeredAt: sqliteText("registered_at").notNull().$defaultFn(() => safeISOString(new Date())),
  // LINE specific fields
  lineUserId: sqliteText("line_user_id").unique(),
  lineDisplayName: sqliteText("line_display_name"),
  linePictureUrl: sqliteText("line_picture_url"),
  lineStatusMessage: sqliteText("line_status_message"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true,
  phoneNumber: true,
  dateOfBirth: true,
  lineUserId: true,
  lineDisplayName: true,
  linePictureUrl: true,
  lineStatusMessage: true,
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  tableNumber: text("table_number"),
  checkInTime: timestamp("check_in_time").notNull(),
  checkOutTime: timestamp("check_out_time"),
  totalTime: integer("total_time_seconds"),
  totalCost: real("total_cost"),
  status: text("status").notNull().default("active"), // active, completed, canceled
});

export const sessionsTable = sqliteTable("sessions", {
  id: sqliteInt("id").primaryKey({ autoIncrement: true }),
  userId: sqliteInt("user_id").notNull().references(() => usersTable.id),
  tableNumber: sqliteText("table_number"),
  checkInTime: sqliteText("check_in_time").notNull(),
  checkOutTime: sqliteText("check_out_time"),
  totalTime: sqliteInt("total_time_seconds"),
  totalCost: sqliteReal("total_cost"),
  status: sqliteText("status").notNull().default("active"), // active, completed, canceled
});

export const insertSessionSchema = z.object({
  userId: z.number(),
  checkInTime: z.string(),
  tableNumber: z.string().optional(),
});

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  imageUrl: text("image_url"),
  available: boolean("available").default(true),
});

export const menuItemsTable = sqliteTable("menu_items", {
  id: sqliteInt("id").primaryKey({ autoIncrement: true }),
  name: sqliteText("name").notNull(),
  category: sqliteText("category").notNull(),
  description: sqliteText("description").notNull(),
  price: sqliteReal("price").notNull(),
  imageUrl: sqliteText("image_url"),
  available: sqliteInt("available", { mode: "boolean" }).default(true),
});

export const insertMenuItemSchema = createInsertSchema(menuItems).pick({
  name: true,
  category: true,
  description: true,
  price: true,
  imageUrl: true,
  available: true,
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => sessions.id),
  userId: integer("user_id").notNull().references(() => users.id),
  orderTime: timestamp("order_time").$defaultFn(() => new Date()).notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, canceled
  totalCost: real("total_cost").notNull(),
});

export const ordersTable = sqliteTable("orders", {
  id: sqliteInt("id").primaryKey({ autoIncrement: true }),
  sessionId: sqliteInt("session_id").notNull().references(() => sessionsTable.id),
  userId: sqliteInt("user_id").notNull().references(() => usersTable.id),
  orderTime: sqliteText("order_time").notNull().$defaultFn(() => safeISOString(new Date())),
  status: sqliteText("status").notNull().default("pending"), // pending, completed, canceled
  totalCost: sqliteReal("total_cost").notNull(),
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  sessionId: true,
  userId: true,
  totalCost: true,
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  menuItemId: integer("menu_item_id").notNull().references(() => menuItems.id),
  quantity: integer("quantity").notNull(),
  price: real("price").notNull(),
  notes: text("notes"),
});

export const orderItemsTable = sqliteTable("order_items", {
  id: sqliteInt("id").primaryKey({ autoIncrement: true }),
  orderId: sqliteInt("order_id").notNull().references(() => ordersTable.id),
  menuItemId: sqliteInt("menu_item_id").notNull().references(() => menuItemsTable.id),
  quantity: sqliteInt("quantity").notNull(),
  price: sqliteReal("price").notNull(),
  notes: sqliteText("notes"),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  menuItemId: true,
  quantity: true,
  price: true,
  notes: true,
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  sessionId: integer("session_id").notNull().references(() => sessions.id),
  amount: real("amount").notNull(),
  stripePaymentId: text("stripe_payment_id"),
  status: text("status").notNull().default("pending"), // pending, completed, failed
  paymentMethod: text("payment_method").default("card"),
  paymentTime: timestamp("payment_time").$defaultFn(() => new Date()).notNull(),
});

export const paymentsTable = sqliteTable("payments", {
  id: sqliteInt("id").primaryKey({ autoIncrement: true }),
  userId: sqliteInt("user_id").notNull().references(() => usersTable.id),
  sessionId: sqliteInt("session_id").notNull().references(() => sessionsTable.id),
  amount: sqliteReal("amount").notNull(),
  stripePaymentId: sqliteText("stripe_payment_id"),
  status: sqliteText("status").notNull().default("pending"), // pending, completed, failed
  paymentMethod: sqliteText("payment_method").default("card"),
  paymentTime: sqliteText("payment_time").notNull().$defaultFn(() => safeISOString(new Date())),
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  userId: true,
  sessionId: true,
  amount: true,
  stripePaymentId: true,
  paymentMethod: true,
});

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // birthday, loyalty, etc.
  code: text("code").notNull(),
  value: real("value").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),
  isUsed: boolean("is_used").notNull().default(false),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
});

export const couponsTable = sqliteTable("coupons", {
  id: sqliteInt("id").primaryKey({ autoIncrement: true }),
  userId: sqliteInt("user_id").notNull().references(() => usersTable.id),
  type: sqliteText("type").notNull(), // birthday, loyalty, etc.
  code: sqliteText("code").notNull(),
  value: sqliteReal("value").notNull(),
  expiryDate: sqliteText("expiry_date").notNull(),
  isUsed: sqliteInt("is_used", { mode: "boolean" }).notNull().default(false),
  createdAt: sqliteText("created_at").notNull().$defaultFn(() => safeISOString(new Date())),
});

export const insertCouponSchema = createInsertSchema(coupons).pick({
  userId: true,
  type: true,
  code: true,
  value: true,
  expiryDate: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItems.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof coupons.$inferSelect;
