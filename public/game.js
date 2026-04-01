// ── Haptics ─────────────────────────────────────────
const Haptic = {
  light()   { navigator.vibrate?.([8]); },
  medium()  { navigator.vibrate?.([15]); },
  heavy()   { navigator.vibrate?.([30]); },
  flag()    { navigator.vibrate?.([10, 30, 15]); },
  unflag()  { navigator.vibrate?.([6, 20, 6]); },
  bomb()    { navigator.vibrate?.([40, 30, 60, 30, 100]); },
  chain(i)  { navigator.vibrate?.([5 + i * 2]); },
  win()     { navigator.vibrate?.([15, 40, 15, 40, 15, 40, 30, 60, 50]); },
  cascade() { navigator.vibrate?.([3]); },
};

// ── Particles (on fx-canvas) ────────────────────────
const FX = (() => {
  const canvas = document.getElementById('fx-canvas');
  const fxCtx = canvas.getContext('2d');
  let particles = [];
  let raf = null;

  function resize() {
    canvas.width = window.innerWidth * devicePixelRatio;
    canvas.height = window.innerHeight * devicePixelRatio;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    fxCtx.scale(devicePixelRatio, devicePixelRatio);
  }
  window.addEventListener('resize', resize);
  resize();

  function emit(x, y, count, colors, opts = {}) {
    const speed = opts.speed || 4;
    const life = opts.life || 60;
    const size = opts.size || 4;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const v = speed * (0.5 + Math.random() * 0.8);
      particles.push({
        x, y,
        vx: Math.cos(angle) * v,
        vy: Math.sin(angle) * v - (opts.gravity ? 2 : 0),
        life,
        maxLife: life,
        size: size * (0.5 + Math.random()),
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity: opts.gravity || 0,
      });
    }
    if (!raf) loop();
  }

  function loop() {
    fxCtx.clearRect(0, 0, canvas.width / devicePixelRatio, canvas.height / devicePixelRatio);
    particles = particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.life--;
      const alpha = p.life / p.maxLife;
      fxCtx.globalAlpha = alpha;
      fxCtx.fillStyle = p.color;
      fxCtx.beginPath();
      fxCtx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      fxCtx.fill();
      return p.life > 0;
    });
    fxCtx.globalAlpha = 1;
    if (particles.length > 0) {
      raf = requestAnimationFrame(loop);
    } else {
      raf = null;
    }
  }

  function explosionAt(x, y) {
    emit(x, y, 20, ['#ff4757', '#ff6b6b', '#ffa502', '#ff7f50'], { speed: 6, life: 40, size: 5 });
  }

  function confetti(x, y) {
    emit(x, y, 40, ['#6c5ce7', '#a55eea', '#2ed573', '#ffa502', '#5b9df5', '#ff6b6b'], {
      speed: 8, life: 80, size: 5, gravity: 0.12
    });
  }

  return { explosionAt, confetti, emit };
})();

// ── Game State ──────────────────────────────────────
const DIFFICULTIES = {
  easy:   { rows: 9,  cols: 9,  mines: 10 },
  medium: { rows: 16, cols: 16, mines: 40 },
  hard:   { rows: 16, cols: 30, mines: 99 },
};

let difficulty = 'easy';
let grid = [];
let rows, cols, totalMines;
let minesLeft, revealed, flagged;
let gameState; // 'idle' | 'playing' | 'won' | 'lost'
let timerInterval;
let seconds;
let longPressTimer = null;
let isLongPress = false;
let touchStartTile = null;

const gridEl = document.getElementById('grid');
const minesLeftEl = document.getElementById('mines-left');
const timerEl = document.getElementById('timer');
const faceEl = document.getElementById('face');
const overlayEl = document.getElementById('overlay');

// ── Init ────────────────────────────────────────────
function newGame() {
  const diff = DIFFICULTIES[difficulty];
  rows = diff.rows;
  cols = diff.cols;
  totalMines = diff.mines;
  minesLeft = totalMines;
  revealed = 0;
  flagged = 0;
  gameState = 'idle';
  seconds = 0;
  clearInterval(timerInterval);

  // Responsive tile sizing for mobile
  const maxWidth = window.innerWidth - 40;
  const maxHeight = window.innerHeight - 200;
  let tileSize = Math.floor(Math.min(maxWidth / cols - 3, maxHeight / rows - 3));
  tileSize = Math.max(28, Math.min(44, tileSize));
  document.documentElement.style.setProperty('--tile-size', tileSize + 'px');

  grid = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      grid[r][c] = { mine: false, num: 0, revealed: false, flagged: false };
    }
  }

  minesLeftEl.textContent = totalMines;
  timerEl.textContent = '000';
  faceEl.textContent = '😊';
  overlayEl.classList.add('hidden');

  renderGrid();
}

function placeMines(safeR, safeC) {
  let placed = 0;
  while (placed < totalMines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    if (grid[r][c].mine) continue;
    // Keep safe zone (3x3 around first click)
    if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
    grid[r][c].mine = true;
    placed++;
  }
  // Compute numbers
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].mine) continue;
      let count = 0;
      forNeighbors(r, c, (nr, nc) => { if (grid[nr][nc].mine) count++; });
      grid[r][c].num = count;
    }
  }
}

function forNeighbors(r, c, fn) {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) fn(nr, nc);
    }
  }
}

// ── Rendering ───────────────────────────────────────
function renderGrid() {
  gridEl.style.gridTemplateColumns = `repeat(${cols}, var(--tile-size))`;
  gridEl.innerHTML = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const btn = document.createElement('button');
      btn.className = 'tile hidden-tile';
      btn.dataset.r = r;
      btn.dataset.c = c;
      gridEl.appendChild(btn);
    }
  }
}

function getTileEl(r, c) {
  return gridEl.children[r * cols + c];
}

function updateTileEl(r, c) {
  const cell = grid[r][c];
  const el = getTileEl(r, c);
  if (!el) return;

  el.className = 'tile';
  el.textContent = '';
  el.removeAttribute('data-num');

  if (cell.revealed) {
    if (cell.mine) {
      el.classList.add('mine');
    } else {
      el.classList.add('revealed');
      if (cell.num > 0) {
        el.textContent = cell.num;
        el.dataset.num = cell.num;
      }
    }
  } else if (cell.flagged) {
    el.classList.add('hidden-tile', 'flagged');
  } else {
    el.classList.add('hidden-tile');
  }
}

// ── Actions ─────────────────────────────────────────
function revealCell(r, c) {
  const cell = grid[r][c];
  if (cell.revealed || cell.flagged) return;

  if (gameState === 'idle') {
    placeMines(r, c);
    gameState = 'playing';
    startTimer();
  }

  if (cell.mine) {
    gameOver(r, c);
    return;
  }

  // Flood fill with cascade animation
  const toReveal = [];
  const visited = new Set();
  const queue = [[r, c]];
  visited.add(`${r},${c}`);

  while (queue.length > 0) {
    const [cr, cc] = queue.shift();
    toReveal.push([cr, cc]);
    if (grid[cr][cc].num === 0) {
      forNeighbors(cr, cc, (nr, nc) => {
        const key = `${nr},${nc}`;
        if (!visited.has(key) && !grid[nr][nc].revealed && !grid[nr][nc].flagged && !grid[nr][nc].mine) {
          visited.add(key);
          queue.push([nr, nc]);
        }
      });
    }
  }

  // Animate cascade
  const isSingle = toReveal.length === 1;
  toReveal.forEach(([cr, cc], i) => {
    setTimeout(() => {
      grid[cr][cc].revealed = true;
      revealed++;
      const el = getTileEl(cr, cc);
      updateTileEl(cr, cc);
      if (!isSingle) {
        el.classList.add('cascade');
        el.style.animationDelay = '0ms';
        Haptic.cascade();
        AudioFX.cascadeTick(i);
      } else {
        Haptic.light();
        AudioFX.reveal();
      }

      // Check win
      if (revealed === rows * cols - totalMines) {
        winGame();
      }
    }, isSingle ? 0 : i * 25);
  });

  if (isSingle) {
    AudioFX.reveal();
    Haptic.light();
  }
}

function toggleFlag(r, c) {
  const cell = grid[r][c];
  if (cell.revealed || gameState === 'won' || gameState === 'lost') return;

  if (gameState === 'idle') {
    placeMines(r, c);
    gameState = 'playing';
    startTimer();
  }

  cell.flagged = !cell.flagged;
  if (cell.flagged) {
    flagged++;
    minesLeft--;
    Haptic.flag();
    AudioFX.flag();
  } else {
    flagged--;
    minesLeft++;
    Haptic.unflag();
    AudioFX.unflag();
  }
  minesLeftEl.textContent = minesLeft;
  updateTileEl(r, c);
}

function gameOver(triggerR, triggerC) {
  gameState = 'lost';
  clearInterval(timerInterval);
  faceEl.textContent = '😵';

  // Haptic + audio bomb
  Haptic.bomb();
  AudioFX.explosion();

  // Screen shake
  document.getElementById('app').classList.add('shake');
  setTimeout(() => document.getElementById('app').classList.remove('shake'), 500);

  // Triggered mine
  grid[triggerR][triggerC].revealed = true;
  const trigEl = getTileEl(triggerR, triggerC);
  updateTileEl(triggerR, triggerC);
  trigEl.classList.add('triggered');

  // Particle explosion at trigger tile
  const rect = trigEl.getBoundingClientRect();
  FX.explosionAt(rect.left + rect.width / 2, rect.top + rect.height / 2);

  // Chain reveal other mines
  let delay = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === triggerR && c === triggerC) continue;
      const cell = grid[r][c];
      if (cell.mine && !cell.flagged) {
        delay += 40;
        setTimeout(() => {
          cell.revealed = true;
          updateTileEl(r, c);
          Haptic.chain(Math.min(delay / 40, 10));
          const el = getTileEl(r, c);
          const elRect = el.getBoundingClientRect();
          FX.explosionAt(elRect.left + elRect.width / 2, elRect.top + elRect.height / 2);
        }, delay);
      } else if (cell.flagged && !cell.mine) {
        delay += 40;
        setTimeout(() => {
          const el = getTileEl(r, c);
          el.className = 'tile wrong-flag';
        }, delay);
      }
    }
  }

  // Show overlay after chain
  setTimeout(() => {
    showOverlay('😵', 'BOOM', `${seconds}s — better luck next time`, false);
  }, delay + 400);
}

function winGame() {
  gameState = 'won';
  clearInterval(timerInterval);
  faceEl.textContent = '😎';
  Haptic.win();
  AudioFX.win();

  // Auto-flag remaining mines
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].mine && !grid[r][c].flagged) {
        grid[r][c].flagged = true;
        updateTileEl(r, c);
      }
    }
  }
  minesLeftEl.textContent = '0';

  // Confetti
  setTimeout(() => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    FX.confetti(cx, cy);
    FX.confetti(cx - 80, cy - 40);
    FX.confetti(cx + 80, cy - 40);
  }, 200);

  setTimeout(() => {
    showOverlay('🏆', 'YOU WIN!', `Cleared in ${seconds}s`, true);
  }, 800);
}

function showOverlay(emoji, title, subtitle, isWin) {
  document.getElementById('overlay-emoji').textContent = emoji;
  document.getElementById('overlay-title').textContent = title;
  document.getElementById('overlay-title').style.color = isWin ? 'var(--success)' : 'var(--danger)';
  document.getElementById('overlay-subtitle').textContent = subtitle;
  overlayEl.classList.remove('hidden');
}

// ── Timer ───────────────────────────────────────────
function startTimer() {
  clearInterval(timerInterval);
  seconds = 0;
  timerInterval = setInterval(() => {
    seconds++;
    timerEl.textContent = String(seconds).padStart(3, '0');
    if (seconds >= 999) clearInterval(timerInterval);
  }, 1000);
}

// ── Input Handling (touch + mouse, long-press = flag) ──
gridEl.addEventListener('pointerdown', (e) => {
  const tile = e.target.closest('.tile');
  if (!tile || gameState === 'won' || gameState === 'lost') return;
  e.preventDefault();

  touchStartTile = tile;
  isLongPress = false;

  // Small press animation immediately
  AudioFX.tap();

  longPressTimer = setTimeout(() => {
    isLongPress = true;
    const r = +tile.dataset.r, c = +tile.dataset.c;
    toggleFlag(r, c);
  }, 400);
});

gridEl.addEventListener('pointerup', (e) => {
  clearTimeout(longPressTimer);
  const tile = e.target.closest('.tile');
  if (!tile || gameState === 'won' || gameState === 'lost') return;
  if (tile !== touchStartTile) return;
  if (isLongPress) return;

  const r = +tile.dataset.r, c = +tile.dataset.c;
  const cell = grid[r][c];

  if (cell.flagged) return; // must long-press to unflag
  if (cell.revealed) {
    // Chord: if revealed number and correct flags around, reveal neighbors
    chordReveal(r, c);
    return;
  }

  revealCell(r, c);
});

gridEl.addEventListener('pointerleave', () => { clearTimeout(longPressTimer); });
gridEl.addEventListener('pointermove', (e) => {
  // Cancel long press if finger moves too far
  if (!touchStartTile) return;
  const tile = e.target.closest('.tile');
  if (tile !== touchStartTile) clearTimeout(longPressTimer);
});

// Prevent context menu on long press
gridEl.addEventListener('contextmenu', (e) => e.preventDefault());

// Chord reveal (tap on revealed number)
function chordReveal(r, c) {
  const cell = grid[r][c];
  if (!cell.revealed || cell.num === 0) return;
  let adjFlags = 0;
  forNeighbors(r, c, (nr, nc) => { if (grid[nr][nc].flagged) adjFlags++; });
  if (adjFlags !== cell.num) return;

  Haptic.medium();
  forNeighbors(r, c, (nr, nc) => {
    if (!grid[nr][nc].revealed && !grid[nr][nc].flagged) {
      revealCell(nr, nc);
    }
  });
}

// ── Difficulty buttons ──────────────────────────────
document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.diff-btn.active').classList.remove('active');
    btn.classList.add('active');
    difficulty = btn.dataset.diff;
    Haptic.light();
    AudioFX.tap();
    newGame();
  });
});

// Face button → new game
document.getElementById('face-btn').addEventListener('click', () => {
  Haptic.medium();
  newGame();
});

// Overlay play again
document.getElementById('overlay-btn').addEventListener('click', () => {
  Haptic.light();
  AudioFX.tap();
  newGame();
});

// ── Kick off ────────────────────────────────────────
newGame();

// ── PWA Service Worker ──────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
