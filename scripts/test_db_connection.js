// scripts/test_db_connection.js
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is missing in .env.local!");
    process.exit(1);
  }

  console.log("[*] Connecting to Neon Postgres...");
  const sql = neon(dbUrl);

  try {
    const result = await sql`SELECT version(), current_database(), current_user;`;
    console.log("[✓] Successfully connected to Neon!");
    console.log("    Database:", result[0].current_database);
    console.log("    User:", result[0].current_user);
    console.log("    Version:", result[0].version);

    // Test pg_trgm extension
    console.log("[*] Enabling and verifying pg_trgm extension for fuzzy typo search...");
    await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm;`;
    const ext = await sql`SELECT extname FROM pg_extension WHERE extname = 'pg_trgm';`;
    console.log("[✓] Extension status:", ext[0]?.extname === 'pg_trgm' ? "pg_trgm is ENABLED!" : "Not found");
  } catch (err) {
    console.error("[!] Database error:", err);
    process.exit(1);
  }
}

main();
