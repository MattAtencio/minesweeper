"use client";

import { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";

export default function Header() {
  const totalMines = useGameStore((s) => s.totalMines);
  const flagCount = useGameStore((s) => s.flagCount);
  const status = useGameStore((s) => s.status);
  const elapsedTime = useGameStore((s) => s.elapsedTime);
  const difficulty = useGameStore((s) => s.difficulty);
  const newGame = useGameStore((s) => s.newGame);
  const tick = useGameStore((s) => s.tick);
  const isNewBest = useGameStore((s) => s.isNewBest);

  useEffect(() => {
    if (status !== "playing") return;
    const interval = setInterval(() => tick(), 1000);
    return () => clearInterval(interval);
  }, [status, tick]);

  const minesLeft = totalMines - flagCount;

  const face =
    status === "won" ? "\uD83D\uDE0E" : status === "lost" ? "\uD83D\uDC80" : "\uD83D\uDE0A";

  const formatTime = (seconds: number) => {
    return String(Math.min(seconds, 999)).padStart(3, "0");
  };

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 bg-surface-default rounded-lg border border-surface-overlay/30 min-w-0">
      {/* Mine counter */}
      <div className="font-mono text-xl font-bold text-accent-error tabular-nums min-w-[3ch]">
        {String(Math.max(minesLeft, 0)).padStart(3, "0")}
      </div>

      {/* Status / New Game button */}
      <button
        onClick={() => newGame(difficulty)}
        className="text-2xl hover:scale-110 active:scale-95 transition-transform px-2 py-1 rounded-lg bg-surface-raised hover:bg-surface-overlay"
        aria-label="New game"
        title="New game"
      >
        {face}
      </button>

      {/* Timer */}
      <div className="font-mono text-xl font-bold text-accent-primary tabular-nums min-w-[3ch]">
        {formatTime(elapsedTime)}
      </div>

      {/* New best indicator */}
      {isNewBest && status === "won" && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-xs text-accent-success font-semibold animate-pulse">
          New Best Time!
        </div>
      )}
    </div>
  );
}
