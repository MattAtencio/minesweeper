"use client";

import { useEffect } from "react";
import { useGameStore } from "@/store/gameStore";
import Board from "@/components/Board";
import Header from "@/components/Header";
import DifficultyPicker from "@/components/DifficultyPicker";
import Link from "next/link";

export default function Home() {
  const loadSave = useGameStore((s) => s.loadSave);
  const status = useGameStore((s) => s.status);
  const isNewBest = useGameStore((s) => s.isNewBest);

  useEffect(() => {
    loadSave();
  }, [loadSave]);

  return (
    <main className="flex flex-col items-center gap-4 px-4 py-6 min-h-dvh safe-area-inset">
      {/* Title */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Minesweeper
        </h1>
        <Link
          href="/help"
          className="text-text-muted hover:text-accent-primary transition-colors text-sm"
        >
          How to Play
        </Link>
      </div>

      {/* Difficulty picker */}
      <DifficultyPicker />

      {/* Header with mine counter, face, timer */}
      <div className="relative">
        <Header />
      </div>

      {/* Game board */}
      <Board />

      {/* Win/Loss messages */}
      {status === "won" && (
        <div className="text-center animate-bounce">
          <p className="text-xl font-bold text-accent-success">
            {isNewBest ? "New Best Time!" : "You Win!"}
          </p>
        </div>
      )}
      {status === "lost" && (
        <div className="text-center">
          <p className="text-xl font-bold text-accent-error">Game Over</p>
        </div>
      )}

      {/* Footer hint */}
      <p className="text-xs text-text-muted text-center max-w-xs">
        Left click to reveal &middot; Right click to flag &middot; Long press to
        flag on mobile
      </p>
    </main>
  );
}
