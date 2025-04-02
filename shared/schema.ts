import { pgTable, text, serial, integer, boolean, timestamp, real, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"), // Optional for LINE login
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phoneNumber: text("phone_number"),
  dateOfBirth: text("date_of_birth"),
  stripeCustomerId: text("stripe_customer_id"),
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
  // LINE specific fields
  lineUserId: text("line_user_id").unique(),
  lineDisplayName: text("line_display_name"),
  linePictureUrl: text("line_picture_url"),
  lineStatusMessage: text("line_status_message"),
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

export const insertSessionSchema = createInsertSchema(sessions).pick({
  userId: true,
  checkInTime: true,
  tableNumber: true,
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
  orderTime: timestamp("order_time").defaultNow().notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, canceled
  totalCost: real("total_cost").notNull(),
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
  quantity: integer("quantity").notNull().default(1),
  price: real("price").notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  menuItemId: true,
  quantity: true,
  price: true,
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  sessionId: integer("session_id").notNull().references(() => sessions.id),
  amount: real("amount").notNull(),
  stripePaymentId: text("stripe_payment_id"),
  status: text("status").notNull().default("pending"), // pending, completed, failed
  paymentMethod: text("payment_method").default("card"),
  paymentTime: timestamp("payment_time").defaultNow().notNull(),
});

export const insertPaymentSchema = createInsertSchema(payments).pick({
  userId: true,
  sessionId: true,
  amount: true,
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
