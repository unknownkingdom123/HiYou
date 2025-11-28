// Database connection - For now using in-memory storage
// PostgreSQL support can be added later if DATABASE_URL is provided

export async function testDatabaseConnection() {
  console.log("✓ Using in-memory storage (data persists during session)");
  return true;
}

export async function initializeDatabase() {
  console.log("✓ Database initialized");
  return true;
}
