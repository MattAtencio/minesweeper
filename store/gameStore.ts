import { create } from "zustand";
import { GameState, Difficulty, BestTimes } from "@/lib/types";
import { dispatch, createInitialState } from "@/lib/engine";
import { saveGame, loadGame, clearSave, loadBestTimes, saveBestTime } from "@/lib/storage";

interface GameStore extends GameState {
  bestTimes: BestTimes;
  isNewBest: boolean;
  revealCell: (row: number, col: number) => void;
  toggleFlag: (row: number, col: number) => void;
  chordReveal: (row: number, col: number) => void;
  newGame: (difficulty: Difficulty) => void;
  tick: () => void;
  loadSave: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState("beginner"),
  bestTimes: { beginner: null, intermediate: null, expert: null },
  isNewBest: false,

  revealCell: (row, col) => {
    const state = get();
    const newState = dispatch(state, { type: "REVEAL", row, col });
    let isNewBest = false;
    if (newState.status === "won" && state.status !== "won") {
      isNewBest = saveBestTime(newState.difficulty, newState.elapsedTime);
      clearSave();
    } else if (newState.status === "lost") {
      clearSave();
    } else if (newState.status === "playing") {
      saveGame(newState);
    }
    set({
      ...newState,
      isNewBest,
      bestTimes: newState.status === "won" ? loadBestTimes() : get().bestTimes,
    });
  },

  toggleFlag: (row, col) => {
    const state = get();
    const newState = dispatch(state, { type: "TOGGLE_FLAG", row, col });
    if (newState.status === "playing") saveGame(newState);
    set(newState);
  },

  chordReveal: (row, col) => {
    const state = get();
    const newState = dispatch(state, { type: "CHORD", row, col });
    let isNewBest = false;
    if (newState.status === "won" && state.status !== "won") {
      isNewBest = saveBestTime(newState.difficulty, newState.elapsedTime);
      clearSave();
    } else if (newState.status === "lost") {
      clearSave();
    } else if (newState.status === "playing") {
      saveGame(newState);
    }
    set({
      ...newState,
      isNewBest,
      bestTimes: newState.status === "won" ? loadBestTimes() : get().bestTimes,
    });
  },

  newGame: (difficulty) => {
    clearSave();
    const newState = createInitialState(difficulty);
    set({ ...newState, isNewBest: false, bestTimes: loadBestTimes() });
  },

  tick: () => {
    const state = get();
    const newState = dispatch(state, { type: "TICK" });
    set({ elapsedTime: newState.elapsedTime });
  },

  loadSave: () => {
    const saved = loadGame();
    const bestTimes = loadBestTimes();
    if (saved) {
      set({ ...saved, bestTimes, isNewBest: false });
    } else {
      set({ bestTimes });
    }
  },
}));
