// src/app/api/game/turn/route.ts
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

function normalizeInput(text: string) {
  if (!text) return { alphaChars: [], normalized: "" };
  const decomposed = text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim();
  const alphaChars = decomposed.toUpperCase().split("").filter((c) => c >= "A" && c <= "Z");
  return {
    alphaChars,
    normalized: decomposed.toLowerCase(),
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { childInput, expectedLetter, usedPlaceIds = [] } = body;

    const { alphaChars, normalized } = normalizeInput(childInput);
    if (!normalized || alphaChars.length === 0) {
      return NextResponse.json(
        { success: false, error: "Please type a valid place name!" },
        { status: 400 }
      );
    }

    // Step 1: Resolve child's place (Exact match first, then pg_trgm fuzzy match)
    let childPlace: any = null;
    let typoNote: string | null = null;

    // 1. Exact match (lowest tier number wins: Country > Capital > State > City)
    const exactMatches = await sql`
      SELECT p.id, p.name, p.normalized_name, p.place_type, p.tier, 
             p.country_id, p.latitude, p.longitude, p.first_letter, p.last_letter,
             (SELECT c.name FROM places c WHERE c.id = p.country_id LIMIT 1) AS country_name
      FROM places p
      WHERE p.normalized_name = ${normalized}
      ORDER BY p.tier ASC
      LIMIT 1;
    `;

    if (exactMatches.length > 0) {
      childPlace = exactMatches[0];
    } else {
      // 2. Fuzzy match via pg_trgm
      const fuzzyMatches = await sql`
        SELECT p.id, p.name, p.normalized_name, p.place_type, p.tier, 
               p.country_id, p.latitude, p.longitude, p.first_letter, p.last_letter,
               (SELECT c.name FROM places c WHERE c.id = p.country_id LIMIT 1) AS country_name,
               similarity(p.normalized_name, ${normalized}) AS sim
        FROM places p
        WHERE p.normalized_name % ${normalized} AND similarity(p.normalized_name, ${normalized}) > 0.38
        ORDER BY sim DESC, p.tier ASC
        LIMIT 1;
      `;
      if (fuzzyMatches.length > 0) {
        childPlace = fuzzyMatches[0];
        typoNote = `Auto-corrected from '${childInput}' to '${childPlace.name}'`;
      }
    }

    if (!childPlace) {
      return NextResponse.json({
        success: false,
        error: `'${childInput}' isn't in our world atlas. Try another place!`,
      });
    }

    // Step 2: Validate starting letter (if round > 1)
    if (expectedLetter) {
      const required = expectedLetter.toUpperCase();
      if (childPlace.first_letter !== required) {
        return NextResponse.json({
          success: false,
          error: `'${childPlace.name}' starts with '${childPlace.first_letter}', but you need a place starting with '${required}'!`,
        });
      }
    }

    // Step 3: Validate not already played
    if (usedPlaceIds.includes(childPlace.id)) {
      return NextResponse.json({
        success: false,
        error: `'${childPlace.name}' has already been played in this expedition!`,
      });
    }

    const updatedUsedIds = [...usedPlaceIds, childPlace.id];
    const aiRequiredLetter = childPlace.last_letter;

    // Step 4: AI picks an answer using the 4-Tier educational priority
    let aiPlace: any = null;
    if (updatedUsedIds.length > 0) {
      const aiCandidates = await sql`
        SELECT p.id, p.name, p.place_type, p.tier, p.latitude, p.longitude, p.first_letter, p.last_letter,
               (SELECT c.name FROM places c WHERE c.id = p.country_id LIMIT 1) AS country_name
        FROM places p
        WHERE p.first_letter = ${aiRequiredLetter} 
          AND NOT (p.id = ANY(${updatedUsedIds}))
        ORDER BY p.tier ASC, RANDOM()
        LIMIT 1;
      `;
      aiPlace = aiCandidates[0] || null;
    } else {
      const aiCandidates = await sql`
        SELECT p.id, p.name, p.place_type, p.tier, p.latitude, p.longitude, p.first_letter, p.last_letter,
               (SELECT c.name FROM places c WHERE c.id = p.country_id LIMIT 1) AS country_name
        FROM places p
        WHERE p.first_letter = ${aiRequiredLetter}
        ORDER BY p.tier ASC, RANDOM()
        LIMIT 1;
      `;
      aiPlace = aiCandidates[0] || null;
    }

    // Safe background telemetry
    const playerCountry = req.headers.get("x-vercel-ip-country") || "LOCAL";
    sql`
      INSERT INTO game_analytics (place_id, place_name, played_by, player_country)
      VALUES 
        (${childPlace.id}, ${childPlace.name}, 'child', ${playerCountry}),
        (${aiPlace ? aiPlace.id : 'none'}, ${aiPlace ? aiPlace.name : 'none'}, 'ai', ${playerCountry});
    `.catch((err: any) => console.error("Analytics logging error:", err));

    if (!aiPlace) {
      return NextResponse.json({
        success: true,
        gameOver: true,
        winner: "child",
        message: `Incredible! I don't know any unused places starting with '${aiRequiredLetter}'. You conquered the world atlas!`,
        childMove: {
          id: childPlace.id,
          name: childPlace.name,
          type: getTierLabel(childPlace.tier),
          countryName: childPlace.country_name || childPlace.name,
          coordinates: [childPlace.latitude, childPlace.longitude],
          typoNote,
        },
      });
    }

    updatedUsedIds.push(aiPlace.id);
    const nextChildLetter = aiPlace.last_letter;

    return NextResponse.json({
      success: true,
      childMove: {
        id: childPlace.id,
        name: childPlace.name,
        type: getTierLabel(childPlace.tier),
        countryName: childPlace.country_name || childPlace.name,
        coordinates: [childPlace.latitude, childPlace.longitude],
        typoNote,
      },
      aiMove: {
        id: aiPlace.id,
        name: aiPlace.name,
        type: getTierLabel(aiPlace.tier),
        countryName: aiPlace.country_name || aiPlace.name,
        coordinates: [aiPlace.latitude, aiPlace.longitude],
      },
      nextRequiredLetter: nextChildLetter,
      usedPlaceIds: updatedUsedIds,
    });
  } catch (error: any) {
    console.error("Game API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}

function getTierLabel(tier: number) {
  switch (tier) {
    case 1:
      return "Country";
    case 2:
      return "National Capital";
    case 3:
      return "State / Territory";
    default:
      return "City / Town";
  }
}
