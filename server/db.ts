import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

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

if (process.env.NODE_ENV === 'development' && !process.env.DATABASE_URL) {
  console.warn("⚠️ Running in development mode without a database. Some features will not work.");
  
  // Mock the database for development
  dbPool = null;
  dbClient = createMockClient();
} else {
  // Normal database connection
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Running in memory-only mode.");
    // Setup a mock database client instead of throwing an error
    dbPool = null;
    dbClient = createMockClient();
  } else {
    dbPool = new Pool({ connectionString: process.env.DATABASE_URL });
    dbClient = drizzle({ client: dbPool, schema });
  }
}

export const pool = dbPool;
export const db = dbClient;
