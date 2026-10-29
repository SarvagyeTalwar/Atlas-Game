// src/components/ForfeitDialog.tsx
"use client";

interface ForfeitDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  placesExplored: number;
}

export default function ForfeitDialog({
  isOpen,
  onConfirm,
  onCancel,
  placesExplored,
}: ForfeitDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4">
      <div
        className="w-full max-w-sm rounded-3xl border-2 border-stone-200 bg-[#fdfbf7] p-6 shadow-2xl text-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="forfeit-title"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-2xl mb-4">
          📜
        </div>

        <h2 id="forfeit-title" className="text-xl font-extrabold text-stone-900">
          Finish this Expedition?
        </h2>

        <p className="mt-2 text-xs font-medium text-stone-600 leading-relaxed">
          You and Atlas have chartered <b>{placesExplored} {placesExplored === 1 ? "place" : "places"}</b> so far. Finishing will conclude the round and prepare your journey replay!
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={onConfirm}
            className="w-full rounded-xl bg-amber-600 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-amber-700 active:scale-95"
          >
            Yes, View Expedition Summary 🗺️
          </button>

          <button
            onClick={onCancel}
            className="w-full rounded-xl border border-stone-300 bg-white py-2.5 text-xs font-bold text-stone-700 transition-all hover:bg-stone-50 active:scale-95"
          >
            Keep Exploring ➔
          </button>
        </div>
      </div>
    </div>
  );
}
