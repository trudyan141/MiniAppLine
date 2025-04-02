import { defineConfig } from "drizzle-kit";
import * as dotenv from 'dotenv';

dotenv.config();

// PostgreSQL configuration (existing)
const postgresConfig = defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
});

// SQLite configuration
const sqliteConfig = defineConfig({
  out: "./migrations-sqlite",
  schema: "./shared/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: "file:./sqlite.db",
  },
});

// Use PostgreSQL config as default since the codebase was initially designed for PostgreSQL
export default process.env.DB_TYPE === 'sqlite' ? sqliteConfig : postgresConfig;
