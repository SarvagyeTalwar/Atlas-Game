// src/components/TurnPrompt.tsx
"use client";

import { UIPhase } from "@/types/game";

interface TurnPromptProps {
  expectedLetter: string;
  phase: UIPhase;
  roundNumber: number;
}

export default function TurnPrompt({ expectedLetter, phase, roundNumber }: TurnPromptProps) {
  const isAiThinking = phase === "pacing_ai_thinking" || phase === "submitting";
  const isPacingKid = phase === "pacing_kid_view";

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-stone-300/80 bg-[#fdfbf7] p-5 shadow-sm">
      {/* Subtle field-journal stamp watermark */}
      <div className="pointer-events-none absolute -right-4 -top-6 text-7xl font-serif font-black text-stone-200/50 select-none">
        {expectedLetter || "A"}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-teal-600 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest text-stone-500 font-mono">
            Expedition Leg #{roundNumber}
          </span>
        </div>

        <span className="rounded-full bg-stone-200/70 px-2.5 py-0.5 text-[11px] font-semibold text-stone-700">
          Field Log
        </span>
      </div>

      <div className="mt-3 flex items-center gap-4">
        {/* Large Compass / Letter Badge */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md ring-4 ring-amber-100">
          <span className="text-2xl font-black font-serif">
            {expectedLetter || "★"}
          </span>
        </div>

        <div>
          {isPacingKid ? (
            <div>
              <div className="text-xs font-bold text-teal-700 uppercase tracking-wide">
                Location Pinpoint Verified ✓
              </div>
              <div className="text-base font-extrabold text-stone-900">
                Observing on world map...
              </div>
            </div>
          ) : isAiThinking ? (
            <div>
              <div className="text-xs font-bold text-indigo-700 uppercase tracking-wide flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
                Atlas is Consulting the Archives
              </div>
              <div className="text-base font-extrabold text-stone-900">
                Finding a place starting with &lsquo;{expectedLetter}&rsquo;...
              </div>
            </div>
          ) : expectedLetter ? (
            <div>
              <div className="text-xs font-bold text-stone-500 uppercase tracking-wide">
                Your Turn, Navigator
              </div>
              <div className="text-lg font-extrabold text-stone-900 leading-tight">
                Find a place starting with{" "}
                <span className="text-teal-700 underline decoration-amber-400 decoration-4 underline-offset-2">
                  {expectedLetter}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-xs font-bold text-teal-700 uppercase tracking-wide">
                New Expedition
              </div>
              <div className="text-lg font-extrabold text-stone-900 leading-tight">
                Name any world place to begin!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
