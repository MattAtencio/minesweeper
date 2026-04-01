"use client";

import { useCallback } from "react";
import { useGameStore } from "@/store/gameStore";
import CellComponent from "./Cell";

export default function Board() {
  const board = useGameStore((s) => s.board);
  const status = useGameStore((s) => s.status);
  const revealCell = useGameStore((s) => s.revealCell);
  const toggleFlag = useGameStore((s) => s.toggleFlag);
  const chordReveal = useGameStore((s) => s.chordReveal);

  const gameOver = status === "won" || status === "lost";

  const onReveal = useCallback(
    (row: number, col: number) => revealCell(row, col),
    [revealCell]
  );
  const onFlag = useCallback(
    (row: number, col: number) => toggleFlag(row, col),
    [toggleFlag]
  );
  const onChord = useCallback(
    (row: number, col: number) => chordReveal(row, col),
    [chordReveal]
  );

  return (
    <div className="overflow-auto max-w-full">
      <div
        className="inline-grid gap-0 p-1 bg-surface-default rounded-lg border border-surface-overlay/30"
        style={{
          gridTemplateColumns: `repeat(${board[0]?.length ?? 0}, 32px)`,
          gridTemplateRows: `repeat(${board.length}, 32px)`,
        }}
      >
        {board.map((row) =>
          row.map((cell) => (
            <CellComponent
              key={`${cell.row}-${cell.col}`}
              cell={cell}
              gameOver={gameOver}
              onReveal={onReveal}
              onFlag={onFlag}
              onChord={onChord}
            />
          ))
        )}
      </div>
    </div>
  );
}
