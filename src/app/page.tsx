// src/app/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

import { PlaceView, UIPhase, GameStats } from "@/types/game";
import type { PlaceMarker } from "@/components/MapComponent";

import ScorePanel from "@/components/ScorePanel";
import TurnPrompt from "@/components/TurnPrompt";
import PlaceInput from "@/components/PlaceInput";
import TurnHistory from "@/components/TurnHistory";
import CorrectionCard from "@/components/CorrectionCard";
import ForfeitDialog from "@/components/ForfeitDialog";
import GameSummary from "@/components/GameSummary";

const MapComponent = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[350px] items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 text-stone-400 font-semibold text-sm">
      🗺️ Charting the world map...
    </div>
  ),
});

// Mobile tab type
type MobileView = "play" | "map";

export default function AtlasKidsApp() {
  // Game State
  const [inputVal, setInputVal] = useState("");
  const [expectedLetter, setExpectedLetter] = useState<string>("");
  const [usedPlaceIds, setUsedPlaceIds] = useState<string[]>([]);
  const [history, setHistory] = useState<PlaceView[]>([]);
  const [activeLocation, setActiveLocation] = useState<[number, number] | null>(null);
  const [roundNumber, setRoundNumber] = useState(1);

  // UI Phase
  const [phase, setPhase] = useState<UIPhase>("ready");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastTypoNote, setLastTypoNote] = useState<string | null>(null);

  // Journey Replay
  const [journeyStep, setJourneyStep] = useState(0);
  const [isJourneyPlaying, setIsJourneyPlaying] = useState(false);

  // Mobile View Tab
  const [mobileView, setMobileView] = useState<MobileView>("play");

  // Journey animation ticker
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    if (isJourneyPlaying && history.length > 0 && phase === "replay") {
      timer = setInterval(() => {
        setJourneyStep((prev) => {
          const next = prev + 1;
          if (next >= history.length) {
            setIsJourneyPlaying(false);
            return prev;
          }
          setActiveLocation(history[next].coordinates);
          return next;
        });
      }, 1500);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [isJourneyPlaying, history, phase]);

  // Compute stats
  const computeStats = useCallback((): GameStats => {
    const uniqueCountries = new Set(
      history
        .filter((h) => h.countryName)
        .map((h) => h.countryName)
    );
    const capitals = history.filter((h) => h.type === "National Capital");
    const longest = history.reduce(
      (a, b) => (b.name.length > a.length ? b.name : a),
      ""
    );

    return {
      turnsPlayed: roundNumber - 1,
      placesExplored: history.length,
      countriesVisited: uniqueCountries.size,
      capitalsDiscovered: capitals.length,
      longestPlaceName: longest,
    };
  }, [history, roundNumber]);

  // Handlers
  const handleFinishClick = () => setPhase("confirm_finish");
  const handleCancelFinish = () => setPhase("ready");

  const handleConfirmFinish = () => {
    setPhase("recap");
  };

  const handleReplayJourney = () => {
    if (history.length === 0) return;
    setPhase("replay");
    setMobileView("map");
    setJourneyStep(0);
    setActiveLocation(history[0].coordinates);
    setIsJourneyPlaying(true);
  };

  const handleNewGame = () => {
    setHistory([]);
    setUsedPlaceIds([]);
    setExpectedLetter("");
    setInputVal("");
    setActiveLocation(null);
    setRoundNumber(1);
    setPhase("ready");
    setErrorMessage(null);
    setLastTypoNote(null);
    setIsJourneyPlaying(false);
    setMobileView("play");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputVal.trim();
    if (!query || phase === "submitting" || phase === "pacing_kid_view" || phase === "pacing_ai_thinking") return;

    setErrorMessage(null);
    setLastTypoNote(null);
    setPhase("submitting");

    try {
      const res = await fetch("/api/game/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childInput: query,
          expectedLetter,
          usedPlaceIds,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorMessage(data.error || "That place couldn't be accepted.");
        setPhase("ready");
        return;
      }

      // Phase 1: Show child's move, fly to it
      const childMove: PlaceView = { ...data.childMove, playedBy: "child" };
      setHistory((prev) => [...prev, childMove]);
      setActiveLocation(childMove.coordinates);
      setInputVal("");
      setMobileView("map"); // Auto-switch to map on mobile

      if (childMove.typoNote) {
        setLastTypoNote(childMove.typoNote);
      }

      // If child won
      if (data.gameOver) {
        setPhase("recap");
        return;
      }

      // Phase 2: Brief pause so kid sees their pin on the map (1.5s)
      setPhase("pacing_kid_view");

      setTimeout(() => {
        // Phase 3: Show "Atlas is thinking..." (1.5s)
        setPhase("pacing_ai_thinking");

        setTimeout(() => {
          // Phase 4: AI move lands
          const aiMove: PlaceView = { ...data.aiMove, playedBy: "ai" };
          setHistory((prev) => [...prev, aiMove]);
          setActiveLocation(aiMove.coordinates);
          setUsedPlaceIds(data.usedPlaceIds);
          setExpectedLetter(data.nextRequiredLetter);
          setRoundNumber((r) => r + 1);
          setPhase("ready");

          // After a beat, switch mobile back to play view
          setTimeout(() => setMobileView("play"), 1200);
        }, 1500);
      }, 1500);
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error connecting to the atlas database. Try again!");
      setPhase("ready");
    }
  };

  // Convert history to map markers
  const mapMarkers: PlaceMarker[] = history.map((h) => ({
    id: h.id,
    name: h.name,
    type: h.type,
    countryName: h.countryName,
    coordinates: h.coordinates,
    playedBy: h.playedBy,
  }));

  const isInputDisabled = phase !== "ready";
  const isAiThinking = phase === "pacing_ai_thinking" || phase === "submitting";
  const childPlaceCount = history.filter((h) => h.playedBy === "child").length;
  const uniqueCountries = new Set(history.filter((h) => h.countryName).map((h) => h.countryName)).size;

  return (
    <div className="flex min-h-[100svh] w-full flex-col bg-[#faf8f4] md:h-[100dvh] md:min-h-0 md:overflow-hidden">
      {/* Top Bar */}
      <ScorePanel
        placesCount={childPlaceCount}
        countriesCount={uniqueCountries}
        onFinishClick={handleFinishClick}
        canFinish={history.length >= 2 && phase === "ready"}
      />

      {/* Mobile View Tabs (visible only on small screens) */}
      <div className="sticky top-0 z-20 flex shrink-0 md:hidden border-b-2 border-stone-200 bg-[#fcfaf7]">
        <button
          onClick={() => setMobileView("play")}
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
            mobileView === "play"
              ? "text-teal-800 border-b-[3px] border-teal-700 bg-white"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          📖 Play
        </button>
        <button
          onClick={() => setMobileView("map")}
          className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
            mobileView === "map"
              ? "text-indigo-800 border-b-[3px] border-indigo-700 bg-white"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          🗺️ Map
        </button>
      </div>

      {/* Main Content: Desktop = side-by-side, Mobile = tabbed */}
      <main className="flex min-h-[70svh] flex-1 flex-col overflow-visible md:min-h-0 md:flex-row md:overflow-hidden">
        {/* LEFT PANEL: Game Journal (40% on desktop, full on mobile play tab) */}
        <section
          className={`flex w-full flex-col border-r-2 border-stone-200 bg-[#fdfbf7] md:min-h-0 md:overflow-hidden ${
            mobileView === "play" ? "flex" : "hidden"
          } md:flex md:w-[40%]`}
        >
          <div className="flex min-h-[70svh] flex-1 flex-col gap-3 p-3 sm:p-4 md:min-h-0 md:overflow-hidden">
            {/* Turn Prompt */}
            <TurnPrompt
              expectedLetter={expectedLetter}
              phase={phase}
              roundNumber={roundNumber}
            />

            {/* Turn History (scrollable) */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col journal-scroll">
              <TurnHistory history={history} />
            </div>

            {/* Correction / Error Banners */}
            <CorrectionCard typoNote={lastTypoNote} errorMessage={errorMessage} />

            {/* Input */}
            <PlaceInput
              value={inputVal}
              onChange={setInputVal}
              onSubmit={handleSubmit}
              expectedLetter={expectedLetter}
              disabled={isInputDisabled}
              isAiThinking={isAiThinking}
            />
          </div>
        </section>

        {/* RIGHT PANEL: Map (60% on desktop, full on mobile map tab) */}
        <section
          className={`relative min-h-[70svh] flex-1 overflow-hidden p-2 sm:p-3 md:min-h-0 ${
            mobileView === "map" ? "flex" : "hidden"
          } md:flex flex-col`}
        >
          {/* Journey Controls Overlay */}
          {phase === "replay" && (
            <div className="absolute left-4 right-4 top-4 z-[1000] flex items-center justify-between rounded-2xl border-2 border-amber-300 bg-[#fefdfb]/95 px-5 py-3 shadow-xl backdrop-blur-sm">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-amber-700">
                  ✈️ Flight Path Replay
                </div>
                <div className="text-base font-extrabold text-stone-900">
                  Stop {journeyStep + 1}/{history.length}:{" "}
                  <span className="text-teal-800">{history[journeyStep]?.name}</span>{" "}
                  <span className="text-xs font-medium text-stone-500">
                    ({history[journeyStep]?.type})
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsJourneyPlaying(!isJourneyPlaying)}
                  className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-amber-700 active:scale-95"
                >
                  {isJourneyPlaying ? "Pause ⏸" : "Play ▶"}
                </button>
                <button
                  onClick={handleNewGame}
                  className="rounded-xl bg-stone-800 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-stone-900 active:scale-95"
                >
                  New Game
                </button>
              </div>
            </div>
          )}

          <MapComponent
            markers={mapMarkers}
            activeLocation={activeLocation}
            journeyActive={phase === "replay"}
            journeyStepIndex={journeyStep}
          />
        </section>
      </main>

      {/* Modals */}
      <ForfeitDialog
        isOpen={phase === "confirm_finish"}
        onConfirm={handleConfirmFinish}
        onCancel={handleCancelFinish}
        placesExplored={history.length}
      />

      <GameSummary
        isOpen={phase === "recap"}
        stats={computeStats()}
        onReplayJourney={handleReplayJourney}
        onNewGame={handleNewGame}
      />
    </div>
  );
}
