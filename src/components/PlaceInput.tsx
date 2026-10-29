// src/components/PlaceInput.tsx
"use client";

import { useRef, useEffect } from "react";

interface PlaceInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  expectedLetter: string;
  disabled: boolean;
  isAiThinking: boolean;
}

export default function PlaceInput({
  value,
  onChange,
  onSubmit,
  expectedLetter,
  disabled,
  isAiThinking,
}: PlaceInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const wasDisabled = useRef(disabled);

  // Focus after a turn finishes, but don't pop the mobile keyboard on page load.
  useEffect(() => {
    if (wasDisabled.current && !disabled && inputRef.current) {
      inputRef.current.focus();
    }
    wasDisabled.current = disabled;
  }, [disabled]);

  const placeholderText = isAiThinking
    ? "Atlas is thinking..."
    : expectedLetter
    ? `Enter a place starting with '${expectedLetter}'...`
    : "Enter a country or city (e.g. India, Paris)...";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <label htmlFor="place-input" className="sr-only">
        Enter world place name
      </label>

      <div className="relative flex items-center">
        <input
          id="place-input"
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholderText}
          autoComplete="off"
          spellCheck="false"
          className="w-full rounded-2xl border-2 border-stone-300 bg-white px-5 py-4 text-base font-semibold text-stone-900 placeholder-stone-400 shadow-sm transition-all focus:border-teal-600 focus:bg-[#fefdfb] focus:outline-none focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
        />

        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="absolute right-2.5 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-teal-800 active:scale-95 disabled:pointer-events-none disabled:bg-stone-300 disabled:text-stone-500 flex items-center gap-1.5"
        >
          <span>Plot</span>
          <span className="font-mono text-xs">➔</span>
        </button>
      </div>
    </form>
  );
}
