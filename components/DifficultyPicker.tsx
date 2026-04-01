"use client";

import { useGameStore } from "@/store/gameStore";
import { Difficulty } from "@/lib/types";
import { DIFFICULTY_CONFIGS } from "@/lib/config";

export default function DifficultyPicker() {
  const difficulty = useGameStore((s) => s.difficulty);
  const newGame = useGameStore((s) => s.newGame);
  const bestTimes = useGameStore((s) => s.bestTimes);

  const difficulties: Difficulty[] = ["beginner", "intermediate", "expert"];

  const formatBest = (time: number | null) => {
    if (time === null) return "--";
    return `${time}s`;
  };

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {difficulties.map((d) => {
        const config = DIFFICULTY_CONFIGS[d];
        const isActive = d === difficulty;
        return (
          <button
            key={d}
            onClick={() => newGame(d)}
            className={`flex flex-col items-center px-4 py-2 rounded-lg border transition-colors text-sm ${
              isActive
                ? "bg-accent-primary/20 border-accent-primary text-accent-primary"
                : "bg-surface-raised border-surface-overlay/50 text-text-secondary hover:bg-surface-overlay hover:text-text-primary"
            }`}
          >
            <span className="font-semibold">{config.label}</span>
            <span className="text-xs text-text-muted">
              {config.cols}x{config.rows} &middot; {config.mines} mines
            </span>
            <span className="text-xs mt-0.5 text-accent-success">
              Best: {formatBest(bestTimes[d])}
            </span>
          </button>
        );
      })}
    </div>
  );
}
