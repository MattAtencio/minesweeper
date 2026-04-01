export type Difficulty = "beginner" | "intermediate" | "expert";

export interface DifficultyConfig {
  label: string;
  rows: number;
  cols: number;
  mines: number;
}

export interface Cell {
  row: number;
  col: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

export type GameStatus = "idle" | "playing" | "won" | "lost";

export interface GameState {
  board: Cell[][];
  rows: number;
  cols: number;
  totalMines: number;
  difficulty: Difficulty;
  status: GameStatus;
  flagCount: number;
  startTime: number | null;
  elapsedTime: number;
  minesPlaced: boolean;
}

export interface BestTimes {
  beginner: number | null;
  intermediate: number | null;
  expert: number | null;
}

export type GameAction =
  | { type: "REVEAL"; row: number; col: number }
  | { type: "TOGGLE_FLAG"; row: number; col: number }
  | { type: "CHORD"; row: number; col: number }
  | { type: "NEW_GAME"; difficulty: Difficulty }
  | { type: "TICK" };
