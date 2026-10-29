// src/components/GameSummary.tsx
"use client";

import { useState } from "react";
import { GameStats } from "@/types/game";

interface GameSummaryProps {
  isOpen: boolean;
  stats: GameStats;
  onReplayJourney: () => void;
  onNewGame: () => void;
}

export default function GameSummary({
  isOpen,
  stats,
  onReplayJourney,
  onNewGame,
}: GameSummaryProps) {
  const [copyNotification, setCopyNotification] = useState(false);

  if (!isOpen) return null;

  const handleShare = async () => {
    const text = `🌍 I just chartered ${stats.placesExplored} places across ${stats.countriesVisited} countries in Atlas Kids! Can you beat my expedition?`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Atlas Kids Expedition",
          text,
          url: window.location.href,
        });
        return;
      } catch (err) {
        // Fallback to clipboard if share canceled/unsupported
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopyNotification(true);
      setTimeout(() => setCopyNotification(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-stone-900/65 backdrop-blur-xs p-4">
      <div
        className="w-full max-w-md rounded-3xl border-2 border-stone-200 bg-[#fefdfb] p-7 shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl mb-3">
            🏆
          </div>

          <h2 className="text-2xl font-black text-stone-900 tracking-tight">
            Expedition Debrief
          </h2>
          <p className="mt-1 text-xs text-stone-500 font-medium">
            Here is your official geographical charter record!
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-3 text-center">
            <div className="text-2xl font-black text-teal-700">
              {stats.placesExplored}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mt-0.5">
              Places Explored
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-3 text-center">
            <div className="text-2xl font-black text-indigo-700">
              {stats.countriesVisited}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mt-0.5">
              Countries Visited
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-3 text-center">
            <div className="text-2xl font-black text-amber-600">
              {stats.capitalsDiscovered}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mt-0.5">
              Capitals Discovered
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-3 text-center">
            <div className="text-base font-black text-stone-800 truncate px-1">
              {stats.longestPlaceName || "—"}
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mt-0.5">
              Longest Place
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            onClick={onReplayJourney}
            className="w-full rounded-2xl bg-teal-700 py-3.5 text-sm font-extrabold text-white shadow-md transition-all hover:bg-teal-800 active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Replay Flight Journey</span>
            <span>✈️</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="flex-1 rounded-xl border-2 border-stone-200 bg-white py-2.5 text-xs font-bold text-stone-800 transition-all hover:bg-stone-50 active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>{copyNotification ? "Copied to Clipboard! ✓" : "Share Expedition 📋"}</span>
            </button>

            <button
              onClick={onNewGame}
              className="flex-1 rounded-xl bg-stone-900 py-2.5 text-xs font-bold text-white transition-all hover:bg-black active:scale-95"
            >
              New Journey 🔄
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
