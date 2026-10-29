// src/components/TurnHistory.tsx
"use client";

import { useEffect, useRef } from "react";
import { PlaceView } from "@/types/game";

interface TurnHistoryProps {
  history: PlaceView[];
}

export default function TurnHistory({ history }: TurnHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  if (history.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 p-8 text-center text-stone-400">
        <div className="mb-2 text-3xl">🧭</div>
        <div className="text-sm font-bold text-stone-600">Expedition Log Empty</div>
        <p className="mt-1 max-w-xs text-xs text-stone-400">
          Name any country, capital, or town to log the first coordinate in your journal.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 space-y-3 overflow-y-auto pr-1"
      tabIndex={0}
      aria-label="Turn history"
    >
      {history.map((item, idx) => {
        const isChild = item.playedBy === "child";

        return (
          <div
            key={item.id + idx}
            className={`flex flex-col rounded-xl border p-3.5 transition-all ${
              isChild
                ? "border-teal-200/90 bg-[#f4faf8] ml-3"
                : "border-indigo-100 bg-[#f8f9fd] mr-3"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    isChild ? "bg-teal-600" : "bg-indigo-600"
                  }`}
                />
                <span className={isChild ? "text-teal-900" : "text-indigo-900"}>
                  {isChild ? "Navigator (You)" : "Atlas Guide"}
                </span>
              </div>

              <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-stone-500 shadow-2xs border border-stone-100">
                Leg #{idx + 1}
              </span>
            </div>

            <div className="mt-1 flex items-baseline justify-between">
              <div className="text-base font-extrabold text-stone-900">
                {item.name}
              </div>

              <div className="text-xs font-medium text-stone-600">
                {item.type}
                {item.countryName && item.countryName !== item.name ? ` • ${item.countryName}` : ""}
              </div>
            </div>

            {item.typoNote && (
              <div className="mt-1.5 text-[11px] font-medium text-amber-800 bg-amber-100/60 rounded px-2 py-0.5 self-start">
                💡 {item.typoNote}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
