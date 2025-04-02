import { 
  users, User, InsertUser, 
  sessions, Session, InsertSession,
  menuItems, MenuItem, InsertMenuItem,
  orders, Order, InsertOrder,
  orderItems, OrderItem, InsertOrderItem,
  payments, Payment, InsertPayment,
  coupons, Coupon, InsertCoupon
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gt } from "drizzle-orm";

const isDevelopmentWithoutDB = process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL;

// Bọc tất cả các hàm truy vấn database với chế độ development mà không cần database
// Thêm đoạn này trước export const storage
const wrapWithDevelopmentFallback = (fn) => {
  return async (...args) => {
    if (isDevelopmentWithoutDB) {
      console.log(`⚠️ Mock database call: ${fn.name} with args:`, args);
      // Trả về dữ liệu giả mẫu tùy thuộc vào tên hàm
      if (fn.name.startsWith('get')) {
        // Trả về đối tượng rỗng hoặc null cho các hàm getter
        return null;
      } else if (fn.name.startsWith('create')) {
        // Trả về đối tượng giả với id cho các hàm tạo
        return { id: 1, ...args[0] };
      } else if (fn.name.startsWith('update')) {
        // Trả về số lượng bản ghi đã cập nhật
        return 1;
      } else if (fn.name.startsWith('delete')) {
        // Trả về số lượng bản ghi đã xóa
        return 1;
      } else {
        // Trả về mảng rỗng cho các loại hàm khác
        return [];
      }
    }
    return fn(...args);
  };
};

// Áp dụng wrapper cho tất cả các hàm trong storage
const wrapStorageMethods = (storageObj) => {
  if (isDevelopmentWithoutDB) {
    const wrappedStorage = {};
    for (const key in storageObj) {
      if (typeof storageObj[key] === 'function') {
        wrappedStorage[key] = wrapWithDevelopmentFallback(storageObj[key]);
      } else {
        wrappedStorage[key] = storageObj[key];
      }
    }
    return wrappedStorage;
  }
  return storageObj;
};

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByLineId(lineUserId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User | undefined>;

  // Session operations
  getSession(id: number): Promise<Session | undefined>;
  getSessionsByUserId(userId: number): Promise<Session[]>;
  getActiveSessionByUserId(userId: number): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: number, data: Partial<Session>): Promise<Session | undefined>;
  checkoutSession(id: number, checkOutTime: Date, totalTime: number, totalCost: number): Promise<Session | undefined>;

  // Menu operations
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItemsByCategory(category: string): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;

  // Order operations
  getOrder(id: number): Promise<Order | undefined>;
  getOrdersBySessionId(sessionId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;

  // Order items operations
  getOrderItemsByOrderId(orderId: number): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;

  // Payment operations
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentsBySessionId(sessionId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(id: number, status: string, stripePaymentId?: string): Promise<Payment | undefined>;

  // Coupon operations
  getCouponsByUserId(userId: number): Promise<Coupon[]>;
  getActiveCouponsByUserId(userId: number): Promise<Coupon[]>;
  createCoupon(coupon: InsertCoupon): Promise<Coupon>;
  useCoupon(id: number): Promise<Coupon | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sessions: Map<number, Session>;
  private menuItems: Map<number, MenuItem>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private payments: Map<number, Payment>;
  private coupons: Map<number, Coupon>;
  
  private currentUserId: number;
  private currentSessionId: number;
  private currentMenuItemId: number;
  private currentOrderId: number;
  private currentOrderItemId: number;
  private currentPaymentId: number;
  private currentCouponId: number;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.menuItems = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.payments = new Map();
    this.coupons = new Map();
    
    this.currentUserId = 1;
    this.currentSessionId = 1;
    this.currentMenuItemId = 1;
    this.currentOrderId = 1;
    this.currentOrderItemId = 1;
    this.currentPaymentId = 1;
    this.currentCouponId = 1;
    
    // Initialize with sample menu items
    this.initializeMenuItems();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getUserByLineId(lineUserId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.lineUserId === lineUserId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id, stripeCustomerId: null, registeredAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User | undefined> {
    return this.updateUser(userId, { stripeCustomerId });
  }

  // Session operations
  async getSession(id: number): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async getSessionsByUserId(userId: number): Promise<Session[]> {
    return Array.from(this.sessions.values()).filter(
      (session) => session.userId === userId,
    );
  }

  async getActiveSessionByUserId(userId: number): Promise<Session | undefined> {
    return Array.from(this.sessions.values()).find(
      (session) => session.userId === userId && session.status === "active",
    );
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = this.currentSessionId++;
    const session: Session = { 
      ...insertSession,
      id,
      checkOutTime: null,
      totalTime: null,
      totalCost: null,
      status: "active",
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateSession(id: number, data: Partial<Session>): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...data };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async checkoutSession(id: number, checkOutTime: Date, totalTime: number, totalCost: number): Promise<Session | undefined> {
    return this.updateSession(id, {
      checkOutTime,
      totalTime,
      totalCost,
      status: "completed",
    });
  }

  // Menu operations
  private initializeMenuItems(): void {
    const items: InsertMenuItem[] = [
      {
        name: "Cafe Latte",
        category: "Drinks",
        description: "Rich espresso with steamed milk",
        price: 420,
        imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c",
      },
      {
        name: "Green Tea",
        category: "Drinks",
        description: "Traditional Japanese green tea",
        price: 320,
        imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574",
      },
      {
        name: "Avocado Sandwich",
        category: "Light Meals",
        description: "Avocado, tomato, and cheese on toast",
        price: 580,
        imageUrl: "https://images.unsplash.com/photo-1565958011703-44f9829ba187",
      },
      {
        name: "Caesar Salad",
        category: "Light Meals",
        description: "Fresh romaine with parmesan and croutons",
        price: 650,
        imageUrl: "https://images.unsplash.com/photo-1623855244183-52fd8d3ce2f7",
      },
    ];

    items.forEach(item => {
      const id = this.currentMenuItemId++;
      this.menuItems.set(id, { ...item, id });
    });
  }

  async getMenuItems(): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values());
  }

  async getMenuItemsByCategory(category: string): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values()).filter(
      (item) => item.category === category,
    );
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }

  async createMenuItem(insertItem: InsertMenuItem): Promise<MenuItem> {
    const id = this.currentMenuItemId++;
    const item: MenuItem = { ...insertItem, id };
    this.menuItems.set(id, item);
    return item;
  }

  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersBySessionId(sessionId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.sessionId === sessionId,
    );
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const order: Order = { 
      ...insertOrder,
      id,
      orderTime: new Date(),
      status: "pending",
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  // Order items operations
  async getOrderItemsByOrderId(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(
      (item) => item.orderId === orderId,
    );
  }

  async createOrderItem(insertItem: InsertOrderItem): Promise<OrderItem> {
    const id = this.currentOrderItemId++;
    const item: OrderItem = { ...insertItem, id };
    this.orderItems.set(id, item);
    return item;
  }

  // Payment operations
  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPaymentsBySessionId(sessionId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      (payment) => payment.sessionId === sessionId,
    );
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.currentPaymentId++;
    const payment: Payment = { 
      ...insertPayment,
      id,
      stripePaymentId: null,
      status: "pending",
      paymentTime: new Date(),
    };
    this.payments.set(id, payment);
    return payment;
  }

  async updatePaymentStatus(id: number, status: string, stripePaymentId?: string): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;
    
    const updatedPayment = { 
      ...payment, 
      status,
      ...(stripePaymentId && { stripePaymentId }),
    };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  // Coupon operations
  async getCouponsByUserId(userId: number): Promise<Coupon[]> {
    return Array.from(this.coupons.values()).filter(
      (coupon) => coupon.userId === userId,
    );
  }

  async getActiveCouponsByUserId(userId: number): Promise<Coupon[]> {
    const now = new Date();
    return Array.from(this.coupons.values()).filter(
      (coupon) => 
        coupon.userId === userId && 
        !coupon.isUsed && 
        new Date(coupon.expiryDate) > now,
    );
  }

  async createCoupon(insertCoupon: InsertCoupon): Promise<Coupon> {
    const id = this.currentCouponId++;
    const coupon: Coupon = { 
      ...insertCoupon,
      id,
      isUsed: false,
      createdAt: new Date(),
    };
    this.coupons.set(id, coupon);
    return coupon;
  }

  async useCoupon(id: number): Promise<Coupon | undefined> {
    const coupon = this.coupons.get(id);
    if (!coupon) return undefined;
    
    const updatedCoupon = { ...coupon, isUsed: true };
    this.coupons.set(id, updatedCoupon);
    return updatedCoupon;
  }
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }
  
  async getUserByLineId(lineUserId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.lineUserId, lineUserId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User | undefined> {
    return this.updateUser(userId, { stripeCustomerId });
  }

  // Session operations
  async getSession(id: number): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session || undefined;
  }

  async getSessionsByUserId(userId: number): Promise<Session[]> {
    return db.select().from(sessions).where(eq(sessions.userId, userId));
  }

  async getActiveSessionByUserId(userId: number): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.userId, userId), eq(sessions.status, "active")));
    return session || undefined;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db.insert(sessions).values(insertSession).returning();
    return session;
  }

  async updateSession(id: number, data: Partial<Session>): Promise<Session | undefined> {
    const [session] = await db
      .update(sessions)
      .set(data)
      .where(eq(sessions.id, id))
      .returning();
    return session || undefined;
  }

  async checkoutSession(id: number, checkOutTime: Date, totalTime: number, totalCost: number): Promise<Session | undefined> {
    return this.updateSession(id, {
      checkOutTime,
      totalTime,
      totalCost,
      status: "completed",
    });
  }

  // Menu operations
  async getMenuItems(): Promise<MenuItem[]> {
    return db.select().from(menuItems);
  }

  async getMenuItemsByCategory(category: string): Promise<MenuItem[]> {
    return db.select().from(menuItems).where(eq(menuItems.category, category));
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return item || undefined;
  }

  async createMenuItem(insertItem: InsertMenuItem): Promise<MenuItem> {
    const [item] = await db.insert(menuItems).values(insertItem).returning();
    return item;
  }

  // Order operations
  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrdersBySessionId(sessionId: number): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.sessionId, sessionId));
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  // Order items operations
  async getOrderItemsByOrderId(orderId: number): Promise<OrderItem[]> {
    return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(insertItem: InsertOrderItem): Promise<OrderItem> {
    const [item] = await db.insert(orderItems).values(insertItem).returning();
    return item;
  }

  // Payment operations
  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getPaymentsBySessionId(sessionId: number): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.sessionId, sessionId));
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(insertPayment).returning();
    return payment;
  }

  async updatePaymentStatus(id: number, status: string, stripePaymentId?: string): Promise<Payment | undefined> {
    const updateData: Partial<Payment> = { status };
    if (stripePaymentId) {
      updateData.stripePaymentId = stripePaymentId;
    }
    
    const [payment] = await db
      .update(payments)
      .set(updateData)
      .where(eq(payments.id, id))
      .returning();
    return payment || undefined;
  }

  // Coupon operations
  async getCouponsByUserId(userId: number): Promise<Coupon[]> {
    return db.select().from(coupons).where(eq(coupons.userId, userId));
  }

  async getActiveCouponsByUserId(userId: number): Promise<Coupon[]> {
    const now = new Date();
    return db
      .select()
      .from(coupons)
      .where(
        and(
          eq(coupons.userId, userId),
          eq(coupons.isUsed, false),
          gt(coupons.expiryDate, now)
        )
      );
  }

  async createCoupon(insertCoupon: InsertCoupon): Promise<Coupon> {
    const [coupon] = await db.insert(coupons).values(insertCoupon).returning();
    return coupon;
  }

  async useCoupon(id: number): Promise<Coupon | undefined> {
    const [coupon] = await db
      .update(coupons)
      .set({ isUsed: true })
      .where(eq(coupons.id, id))
      .returning();
    return coupon || undefined;
  }
}

// Initialize menu items
async function seedMenuItems() {
  const existingItems = await db.select().from(menuItems);
  
  if (!existingItems || !Array.isArray(existingItems) || existingItems.length === 0) {
    const initialMenuItems: InsertMenuItem[] = [
      {
        name: "Cafe Latte",
        category: "Drinks",
        description: "Rich espresso with steamed milk",
        price: 420,
        imageUrl: "https://images.unsplash.com/photo-1517701604599-bb29b565090c",
        available: true,
      },
      {
        name: "Green Tea",
        category: "Drinks",
        description: "Traditional Japanese green tea",
        price: 320,
        imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574",
        available: true,
      },
      {
        name: "Avocado Sandwich",
        category: "Light Meals",
        description: "Avocado, tomato, and cheese on toast",
        price: 580,
        imageUrl: "https://images.unsplash.com/photo-1565958011703-44f9829ba187",
        available: true,
      },
      {
        name: "Caesar Salad",
        category: "Light Meals",
        description: "Fresh romaine with parmesan and croutons",
        price: 650,
        imageUrl: "https://images.unsplash.com/photo-1623855244183-52fd8d3ce2f7",
        available: true,
      },
    ];
    
    await db.insert(menuItems).values(initialMenuItems);
    console.log("Initialized menu items");
  }
}

const originalStorage = new DatabaseStorage();

export const storage = wrapStorageMethods(originalStorage);

// Seed initial data
seedMenuItems().catch(console.error);
