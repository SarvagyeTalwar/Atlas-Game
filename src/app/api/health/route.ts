// src/app/api/health/route.ts
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await sql`
      SELECT 
        version(), 
        current_database() AS database, 
        current_user AS user,
        (SELECT count(*) FROM pg_extension WHERE extname = 'pg_trgm') AS has_trgm;
    `;

    return NextResponse.json({
      status: "healthy",
      service: "neon-postgres",
      connected: true,
      database: result[0]?.database,
      user: result[0]?.user,
      pg_trgm_enabled: result[0]?.has_trgm > 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "unhealthy",
        service: "neon-postgres",
        connected: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
