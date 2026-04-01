import { Cell, GameState, GameAction, Difficulty, GameStatus } from "./types";
import { DIFFICULTY_CONFIGS } from "./config";

function createEmptyBoard(rows: number, cols: number): Cell[][] {
  const board: Cell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        row: r,
        col: c,
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0,
      });
    }
    board.push(row);
  }
  return board;
}

function getNeighbors(
  rows: number,
  cols: number,
  row: number,
  col: number
): [number, number][] {
  const neighbors: [number, number][] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        neighbors.push([nr, nc]);
      }
    }
  }
  return neighbors;
}

function placeMines(
  board: Cell[][],
  rows: number,
  cols: number,
  totalMines: number,
  safeRow: number,
  safeCol: number
): Cell[][] {
  const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
  const safeZone = new Set<string>();
  safeZone.add(`${safeRow},${safeCol}`);
  for (const [nr, nc] of getNeighbors(rows, cols, safeRow, safeCol)) {
    safeZone.add(`${nr},${nc}`);
  }

  let placed = 0;
  while (placed < totalMines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (!newBoard[r][c].isMine && !safeZone.has(`${r},${c}`)) {
      newBoard[r][c].isMine = true;
      placed++;
    }
  }

  // Calculate adjacent mine counts
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (newBoard[r][c].isMine) continue;
      let count = 0;
      for (const [nr, nc] of getNeighbors(rows, cols, r, c)) {
        if (newBoard[nr][nc].isMine) count++;
      }
      newBoard[r][c].adjacentMines = count;
    }
  }

  return newBoard;
}

function floodFill(board: Cell[][], rows: number, cols: number, row: number, col: number): Cell[][] {
  const newBoard = board.map((r) => r.map((c) => ({ ...c })));
  const stack: [number, number][] = [[row, col]];

  while (stack.length > 0) {
    const [r, c] = stack.pop()!;
    if (newBoard[r][c].isRevealed || newBoard[r][c].isFlagged) continue;
    newBoard[r][c].isRevealed = true;

    if (newBoard[r][c].adjacentMines === 0) {
      for (const [nr, nc] of getNeighbors(rows, cols, r, c)) {
        if (!newBoard[nr][nc].isRevealed && !newBoard[nr][nc].isFlagged) {
          stack.push([nr, nc]);
        }
      }
    }
  }

  return newBoard;
}

function checkWin(board: Cell[][]): boolean {
  for (const row of board) {
    for (const cell of row) {
      if (!cell.isMine && !cell.isRevealed) return false;
    }
  }
  return true;
}

function revealAllMines(board: Cell[][]): Cell[][] {
  return board.map((row) =>
    row.map((cell) => {
      if (cell.isMine) return { ...cell, isRevealed: true };
      // Mark wrong flags
      if (cell.isFlagged && !cell.isMine) return { ...cell, isRevealed: true };
      return { ...cell };
    })
  );
}

export function createInitialState(difficulty: Difficulty): GameState {
  const config = DIFFICULTY_CONFIGS[difficulty];
  return {
    board: createEmptyBoard(config.rows, config.cols),
    rows: config.rows,
    cols: config.cols,
    totalMines: config.mines,
    difficulty,
    status: "idle",
    flagCount: 0,
    startTime: null,
    elapsedTime: 0,
    minesPlaced: false,
  };
}

export function dispatch(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "NEW_GAME":
      return createInitialState(action.difficulty);

    case "TICK": {
      if (state.status !== "playing" || state.startTime === null) return state;
      return {
        ...state,
        elapsedTime: Math.floor((Date.now() - state.startTime) / 1000),
      };
    }

    case "REVEAL": {
      if (state.status === "won" || state.status === "lost") return state;
      const { row, col } = action;
      const cell = state.board[row][col];
      if (cell.isRevealed || cell.isFlagged) return state;

      let board = state.board;
      let minesPlaced = state.minesPlaced;
      let startTime = state.startTime;
      let status: GameStatus = state.status;

      // First click: place mines and start timer
      if (!minesPlaced) {
        board = placeMines(board, state.rows, state.cols, state.totalMines, row, col);
        minesPlaced = true;
        startTime = Date.now();
        status = "playing";
      }

      // Hit a mine
      if (board[row][col].isMine) {
        board = revealAllMines(board);
        // Mark the clicked mine specially (it's already revealed)
        return {
          ...state,
          board,
          status: "lost",
          minesPlaced,
          startTime,
          elapsedTime: startTime ? Math.floor((Date.now() - startTime) / 1000) : 0,
        };
      }

      // Reveal cell(s)
      board = floodFill(board, state.rows, state.cols, row, col);

      if (checkWin(board)) {
        status = "won";
      }

      return {
        ...state,
        board,
        status,
        minesPlaced,
        startTime,
        elapsedTime: startTime ? Math.floor((Date.now() - startTime) / 1000) : state.elapsedTime,
      };
    }

    case "TOGGLE_FLAG": {
      if (state.status !== "playing" && state.status !== "idle") return state;
      // Don't allow flagging before first click
      if (!state.minesPlaced) return state;
      const { row, col } = action;
      const cell = state.board[row][col];
      if (cell.isRevealed) return state;

      const newBoard = state.board.map((r) => r.map((c) => ({ ...c })));
      newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged;

      const flagDelta = newBoard[row][col].isFlagged ? 1 : -1;

      return {
        ...state,
        board: newBoard,
        flagCount: state.flagCount + flagDelta,
      };
    }

    case "CHORD": {
      if (state.status !== "playing") return state;
      const { row, col } = action;
      const cell = state.board[row][col];
      if (!cell.isRevealed || cell.adjacentMines === 0) return state;

      const neighbors = getNeighbors(state.rows, state.cols, row, col);
      const flaggedCount = neighbors.filter(
        ([nr, nc]) => state.board[nr][nc].isFlagged
      ).length;

      if (flaggedCount !== cell.adjacentMines) return state;

      // Check if any unflagged neighbor is a mine (wrong flag scenario)
      const hasWrongFlag = neighbors.some(
        ([nr, nc]) =>
          !state.board[nr][nc].isRevealed &&
          !state.board[nr][nc].isFlagged &&
          state.board[nr][nc].isMine
      );

      if (hasWrongFlag) {
        const board = revealAllMines(state.board);
        return {
          ...state,
          board,
          status: "lost",
          elapsedTime: state.startTime
            ? Math.floor((Date.now() - state.startTime) / 1000)
            : state.elapsedTime,
        };
      }

      let board = state.board;
      for (const [nr, nc] of neighbors) {
        if (!board[nr][nc].isRevealed && !board[nr][nc].isFlagged) {
          board = floodFill(board, state.rows, state.cols, nr, nc);
        }
      }

      const status: GameStatus = checkWin(board) ? "won" : "playing";

      return {
        ...state,
        board,
        status,
        elapsedTime: state.startTime
          ? Math.floor((Date.now() - state.startTime) / 1000)
          : state.elapsedTime,
      };
    }

    default:
      return state;
  }
}
