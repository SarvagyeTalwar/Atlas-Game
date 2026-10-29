// src/components/CorrectionCard.tsx
"use client";

interface CorrectionCardProps {
  typoNote: string | null;
  errorMessage: string | null;
}

export default function CorrectionCard({ typoNote, errorMessage }: CorrectionCardProps) {
  if (!typoNote && !errorMessage) return null;

  return (
    <div className="space-y-2">
      {typoNote && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50/90 px-3.5 py-2.5 text-xs font-semibold text-amber-900 shadow-2xs">
          <span className="text-sm">💡</span>
          <span>{typoNote}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50/95 px-3.5 py-2.5 text-xs font-bold text-rose-800 shadow-2xs">
          <span className="text-sm">⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
