import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const db = drizzle(pool, { schema });

// Test connection
pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

export async function testDatabaseConnection() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✓ Database connected successfully at", result.rows[0].now);
    return true;
  } catch (error) {
    console.error("✗ Database connection failed:", error);
    return false;
  }
}

export async function initializeDatabase() {
  try {
    // Run migrations (Drizzle will handle schema creation)
    await db.execute(
      `CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255),
        username VARCHAR(255) UNIQUE NOT NULL,
        mobile VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        "isVerified" BOOLEAN DEFAULT true,
        "isAdmin" BOOLEAN DEFAULT false,
        "totalDownloads" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT NOW()
      )`
    );

    await db.execute(
      `CREATE TABLE IF NOT EXISTS pdfs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255),
        category VARCHAR(100),
        description TEXT,
        tags TEXT[],
        filename VARCHAR(255) NOT NULL,
        "fileSize" INTEGER,
        "uploadedAt" TIMESTAMP DEFAULT NOW()
      )`
    );

    await db.execute(
      `CREATE TABLE IF NOT EXISTS "externalLinks" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        url VARCHAR(500) NOT NULL,
        description TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW()
      )`
    );

    await db.execute(
      `CREATE TABLE IF NOT EXISTS "downloadHistory" (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        "pdfId" UUID NOT NULL,
        "downloadedAt" TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY ("userId") REFERENCES users(id),
        FOREIGN KEY ("pdfId") REFERENCES pdfs(id)
      )`
    );

    await db.execute(
      `CREATE TABLE IF NOT EXISTS otps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID,
        email VARCHAR(255),
        mobile VARCHAR(20),
        code VARCHAR(6) NOT NULL,
        type VARCHAR(50) NOT NULL,
        "isUsed" BOOLEAN DEFAULT false,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY ("userId") REFERENCES users(id)
      )`
    );

    await db.execute(
      `CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" UUID NOT NULL,
        token TEXT NOT NULL UNIQUE,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY ("userId") REFERENCES users(id)
      )`
    );

    console.log("✓ Database tables created successfully");
    return true;
  } catch (error) {
    console.error("✗ Database initialization failed:", error);
    return false;
  }
}
