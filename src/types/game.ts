// src/types/game.ts

export type UIPhase = 
  | "ready"
  | "submitting"
  | "pacing_kid_view"
  | "pacing_ai_thinking"
  | "confirm_finish"
  | "recap"
  | "replay";

export interface PlaceView {
  id: string;
  name: string;
  type: string;
  countryName?: string;
  coordinates: [number, number]; // [lat, lng]
  playedBy: "child" | "ai";
  typoNote?: string | null;
}

export interface GameStats {
  turnsPlayed: number;
  placesExplored: number;
  countriesVisited: number;
  capitalsDiscovered: number;
  longestPlaceName: string;
}
