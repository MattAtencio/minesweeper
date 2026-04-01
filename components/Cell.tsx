"use client";

import { memo, useCallback, useRef } from "react";
import { Cell as CellType } from "@/lib/types";
import { NUMBER_COLORS } from "@/lib/config";

interface CellProps {
  cell: CellType;
  gameOver: boolean;
  onReveal: (row: number, col: number) => void;
  onFlag: (row: number, col: number) => void;
  onChord: (row: number, col: number) => void;
}

function CellComponent({ cell, gameOver, onReveal, onFlag, onChord }: CellProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (didLongPress.current) {
        didLongPress.current = false;
        return;
      }
      if (cell.isRevealed && cell.adjacentMines > 0) {
        onChord(cell.row, cell.col);
      } else if (!cell.isFlagged) {
        onReveal(cell.row, cell.col);
      }
    },
    [cell, onReveal, onChord]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!cell.isRevealed) {
        onFlag(cell.row, cell.col);
      }
    },
    [cell, onFlag]
  );

  const handleTouchStart = useCallback(() => {
    didLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      didLongPress.current = true;
      if (!cell.isRevealed) {
        onFlag(cell.row, cell.col);
      }
    }, 400);
  }, [cell, onFlag]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  let content = "";
  let textColor = "";
  let bgClass = "";

  if (cell.isRevealed) {
    if (cell.isMine) {
      content = "\uD83D\uDCA3";
      bgClass = gameOver ? "bg-accent-error/30" : "";
    } else if (cell.adjacentMines > 0) {
      content = String(cell.adjacentMines);
      textColor = NUMBER_COLORS[cell.adjacentMines] || "#e8e8f0";
    }
    bgClass = bgClass || "bg-bg-secondary";
  } else if (cell.isFlagged) {
    content = "\uD83D\uDEA9";
    // Show wrong flags on game over
    if (gameOver && !cell.isMine) {
      bgClass = "bg-accent-error/20";
    } else {
      bgClass = "bg-surface-raised";
    }
  } else {
    bgClass = "bg-surface-raised hover:bg-surface-overlay";
  }

  return (
    <button
      className={`cell-button flex items-center justify-center w-8 h-8 min-w-[32px] min-h-[32px] text-sm font-bold border border-surface-overlay/50 rounded-sm transition-colors duration-75 ${bgClass} ${
        cell.isRevealed ? "cursor-default" : "cursor-pointer active:scale-95"
      }`}
      style={textColor ? { color: textColor } : undefined}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      disabled={gameOver && !cell.isRevealed}
      aria-label={
        cell.isRevealed
          ? cell.isMine
            ? "Mine"
            : cell.adjacentMines > 0
            ? `${cell.adjacentMines} adjacent mines`
            : "Empty"
          : cell.isFlagged
          ? "Flagged"
          : "Hidden cell"
      }
    >
      {content}
    </button>
  );
}

export default memo(CellComponent);
