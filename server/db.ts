import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

let db: any = null;

export async function testDatabaseConnection() {
  try {
    // If no DATABASE_URL, use in-memory storage
    if (!process.env.DATABASE_URL) {
      console.log("✓ No DATABASE_URL provided - using in-memory storage");
      return true;
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    const result = await pool.query("SELECT NOW()");
    console.log("✓ Database connected successfully at", result.rows[0].now);
    
    // Store pool for later use
    (global as any).dbPool = pool;
    db = drizzle(pool, { schema });
    (global as any).db = db;
    
    return true;
  } catch (error) {
    console.log("⚠ Database connection failed, using in-memory storage");
    console.error("Database error:", error instanceof Error ? error.message : error);
    return false;
  }
}

export async function initializeDatabase() {
  try {
    // If no database pool, skip initialization
    if (!process.env.DATABASE_URL || !(global as any).dbPool) {
      console.log("✓ Skipping database initialization (in-memory storage)");
      return true;
    }

    const pool = (global as any).dbPool;

    // Create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255),
        username VARCHAR(255) UNIQUE NOT NULL,
        mobile VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        "isVerified" BOOLEAN DEFAULT true,
        "isAdmin" BOOLEAN DEFAULT false,
        "totalDownloads" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS pdfs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255),
        category VARCHAR(100),
        description TEXT,
        tags TEXT[],
        filename VARCHAR(255) NOT NULL,
        "fileSize" INTEGER,
        "uploadedAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "externalLinks" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        url VARCHAR(500) NOT NULL,
        description TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "downloadHistory" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        "pdfId" UUID NOT NULL,
        "downloadedAt" TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY ("pdfId") REFERENCES pdfs(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS otps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID,
        email VARCHAR(255),
        mobile VARCHAR(20),
        code VARCHAR(6) NOT NULL,
        type VARCHAR(50) NOT NULL,
        "isUsed" BOOLEAN DEFAULT false,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        token TEXT NOT NULL UNIQUE,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log("✓ Database tables created successfully");
    return true;
  } catch (error) {
    console.error("✗ Database initialization error:", error instanceof Error ? error.message : error);
    // Don't fail startup - fall back to in-memory
    return false;
  }
}

export function getDatabase() {
  return db;
}
