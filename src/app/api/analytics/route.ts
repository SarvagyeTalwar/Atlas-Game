// src/app/api/analytics/route.ts
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Total moves played
    const totalMovesRes = await sql`
      SELECT count(*) AS total_turns FROM game_analytics;
    `;

    // 2. Top 10 most played places by kids
    const topPlaces = await sql`
      SELECT place_name, count(*) AS times_played 
      FROM game_analytics 
      WHERE played_by = 'child'
      GROUP BY place_name 
      ORDER BY times_played DESC 
      LIMIT 10;
    `;

    // 3. Where users are playing from
    const topPlayerCountries = await sql`
      SELECT player_country, count(*) AS total_turns 
      FROM game_analytics 
      GROUP BY player_country 
      ORDER BY total_turns DESC 
      LIMIT 10;
    `;

    // 4. Most recent 10 moves
    const recentActivity = await sql`
      SELECT place_name, played_by, player_country, played_at 
      FROM game_analytics 
      ORDER BY played_at DESC 
      LIMIT 10;
    `;

    return NextResponse.json({
      summary: {
        total_turns_recorded: Number(totalMovesRes[0]?.total_turns || 0),
        status: "active",
      },
      top_places_by_kids: topPlaces,
      player_countries: topPlayerCountries,
      recent_activity: recentActivity,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch analytics: " + error.message },
      { status: 500 }
    );
  }
}
