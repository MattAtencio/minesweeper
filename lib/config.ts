import { Difficulty, DifficultyConfig } from "./types";

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  beginner: { label: "Beginner", rows: 9, cols: 9, mines: 10 },
  intermediate: { label: "Intermediate", rows: 16, cols: 16, mines: 40 },
  expert: { label: "Expert", rows: 16, cols: 30, mines: 99 },
};

export const NUMBER_COLORS: Record<number, string> = {
  1: "#3b82f6", // blue
  2: "#22c55e", // green
  3: "#ef4444", // red
  4: "#a855f7", // purple
  5: "#991b1b", // maroon
  6: "#14b8a6", // teal
  7: "#1a1a2e", // dark
  8: "#6b7280", // gray
};

export const STORAGE_KEY = "minesweeper-save";
export const BEST_TIMES_KEY = "minesweeper-best-times";
