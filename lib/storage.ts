import { GameState, BestTimes, Difficulty } from "./types";
import { STORAGE_KEY, BEST_TIMES_KEY } from "./config";

export function saveGame(state: GameState): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable
  }
}

export function loadGame(): GameState | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as GameState;
    // If the game was in progress, keep the elapsed time but clear startTime
    // so the timer doesn't jump when resumed
    if (state.status === "playing" && state.startTime) {
      state.elapsedTime = Math.floor((Date.now() - state.startTime) / 1000);
      state.startTime = Date.now() - state.elapsedTime * 1000;
    }
    return state;
  } catch {
    return null;
  }
}

export function clearSave(): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore
  }
}

export function loadBestTimes(): BestTimes {
  try {
    if (typeof window === "undefined") return { beginner: null, intermediate: null, expert: null };
    const raw = localStorage.getItem(BEST_TIMES_KEY);
    if (!raw) return { beginner: null, intermediate: null, expert: null };
    return JSON.parse(raw) as BestTimes;
  } catch {
    return { beginner: null, intermediate: null, expert: null };
  }
}

export function saveBestTime(difficulty: Difficulty, time: number): boolean {
  try {
    if (typeof window === "undefined") return false;
    const best = loadBestTimes();
    const current = best[difficulty];
    if (current === null || time < current) {
      best[difficulty] = time;
      localStorage.setItem(BEST_TIMES_KEY, JSON.stringify(best));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
