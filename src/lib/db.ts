// src/lib/db.ts
import { neon, neonConfig } from "@neondatabase/serverless";

// Disable websocket caching for serverless edge/lambda if needed
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

export const sql = neon(process.env.DATABASE_URL);
