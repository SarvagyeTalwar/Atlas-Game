// src/components/ScorePanel.tsx
"use client";

interface ScorePanelProps {
  placesCount: number;
  countriesCount: number;
  onFinishClick: () => void;
  canFinish: boolean;
}

export default function ScorePanel({
  placesCount,
  countriesCount,
  onFinishClick,
  canFinish,
}: ScorePanelProps) {
  return (
    <header className="flex h-16 w-full items-center justify-between border-b-2 border-stone-200 bg-[#fcfaf7] px-6 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-amber-400 font-bold shadow-xs">
          🧭
        </div>
        <div>
          <h1 className="text-base font-extrabold text-stone-900 tracking-tight leading-none">
            Atlas Kids
          </h1>
          <span className="text-[11px] font-semibold tracking-wide text-stone-500 uppercase font-mono">
            Geographic Expedition
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Supportive Counters */}
        <div className="hidden sm:flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 border border-stone-200 shadow-2xs text-xs font-semibold text-stone-700">
          <span className="text-teal-700 font-bold">{placesCount}</span>
          <span className="text-stone-400">•</span>
          <span>{placesCount === 1 ? "Place Logged" : "Places Logged"}</span>
          {countriesCount > 0 && (
            <>
              <span className="text-stone-300">|</span>
              <span className="text-indigo-700 font-bold">{countriesCount}</span>
              <span>{countriesCount === 1 ? "Country" : "Countries"}</span>
            </>
          )}
        </div>

        {canFinish && (
          <button
            onClick={onFinishClick}
            className="rounded-xl border-2 border-amber-600/40 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-900 transition-all hover:bg-amber-100 hover:border-amber-600 active:scale-95 shadow-2xs"
          >
            Finish & See Recap 📜
          </button>
        )}
      </div>
    </header>
  );
}
