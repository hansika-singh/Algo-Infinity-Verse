// script.js handles: loading screen, navbar, dark mode, scroll top
// This file: Sudoku Solver Visualizer only

document.addEventListener('DOMContentLoaded', function () {
  suInit();
});

/* ─── Speed ─── */
let SU_SPEED = { 1: 800, 2: 400, 3: 150, 4: 50, 5: 10 };
let SU_SPEED_LABEL = { 1: 'Slowest', 2: 'Slow', 3: 'Normal', 4: 'Fast', 5: 'Blazing' };

/* ─── Presets ─── */
// 0 denotes empty cell
let SU_PRESETS = {
  empty: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
  easy: [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ],
  hard: [
    [0, 0, 0, 0, 0, 0, 0, 1, 2],
    [0, 0, 0, 0, 3, 5, 0, 0, 0],
    [0, 0, 0, 6, 0, 0, 0, 7, 0],
    [7, 0, 0, 0, 0, 0, 3, 0, 0],
    [0, 0, 0, 4, 0, 0, 8, 0, 0],
    [1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 2, 0, 0, 0, 0],
    [0, 8, 0, 0, 0, 0, 0, 4, 0],
    [0, 5, 0, 0, 0, 0, 6, 0, 0],
  ],
  unsolvable: [
    [5, 1, 6, 8, 4, 9, 7, 3, 2],
    [3, 0, 7, 6, 0, 5, 0, 0, 0],
    [8, 0, 9, 7, 0, 0, 0, 6, 5],
    [1, 3, 5, 0, 6, 0, 9, 0, 7],
    [4, 7, 2, 5, 9, 1, 0, 0, 6],
    [9, 6, 8, 3, 7, 0, 0, 5, 0],
    [2, 5, 3, 1, 8, 6, 0, 7, 4],
    [6, 8, 4, 2, 0, 7, 5, 0, 0],
    [7, 9, 1, 0, 5, 0, 6, 0, 0], // Contains conflict or dead end
  ],
};

/* ─── State ─── */
let suState = {
  preset: 'easy',
  board: null, // Initial user-defined/preset board (9x9)
  grid: null, // Current solving grid (9x9)
  steps: [],
  stepIdx: 0,
  playing: false,
  timer: null,
  maxSteps: 8000, // Prevent browser freeze on crazy hard boards
};

/* ─── Grid UI Management ─── */
function suCreateGrid() {
  let wrap = document.getElementById('suBoard');
  if (!wrap) return;
  wrap.innerHTML = '';

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      let input = document.createElement('input');
      input.type = 'text'; // using text to prevent up/down arrows natively and limit to 1 char easily
      input.maxLength = 1;
      input.className = 'su-cell';
      input.id = 'cell-' + r + '-' + c;
      input.dataset.r = r;
      input.dataset.c = c;

      input.addEventListener('input', function (e) {
        let val = e.target.value;
        if (!/^[1-9]$/.test(val)) {
          e.target.value = '';
        }
      });
      wrap.appendChild(input);
    }
  }
}

function suLoadPreset(presetName) {
  let matrix = SU_PRESETS[presetName] || SU_PRESETS['empty'];
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      let el = document.getElementById('cell-' + r + '-' + c);
      if (!el) continue;
      let v = matrix[r][c];
      el.value = v === 0 ? '' : v;
      el.className = 'su-cell';
      el.readOnly = false;
    }
  }
}

function suReadGrid() {
  let matrix = [];
  for (let r = 0; r < 9; r++) {
    let row = [];
    for (let c = 0; c < 9; c++) {
      let el = document.getElementById('cell-' + r + '-' + c);
      let v = el ? parseInt(el.value, 10) : 0;
      row.push(isNaN(v) ? 0 : v);
    }
    matrix.push(row);
  }
  return matrix;
}

/* ─── Step Generator (Backtracking Logic) ─── */
function isValid(board, row, col, num) {
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) return false;
    if (board[x][col] === num) return false;
  }
  let startRow = row - (row % 3);
  let startCol = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i + startRow][j + startCol] === num) return false;
    }
  }
  return true;
}

function suGenSteps(initialBoard) {
  let steps = [];
  let board = [];
  let tries = 0;
  let backtracks = 0;
  let aborted = false;

  for (let r = 0; r < 9; r++) board.push(initialBoard[r].slice());

  function solve(r, c) {
    if (steps.length > suState.maxSteps) {
      aborted = true;
      return true;
    } // Safety abort
    if (r === 9) return true;
    if (c === 9) return solve(r + 1, 0);
    if (board[r][c] !== 0) return solve(r, c + 1);

    for (let num = 1; num <= 9; num++) {
      tries++;
      steps.push({
        type: 'trying',
        r: r,
        c: c,
        num: num,
        tries: tries,
        backtracks: backtracks,
        msg: 'Try placing ' + num + ' at (' + r + ',' + c + ')',
      });

      if (isValid(board, r, c, num)) {
        board[r][c] = num;

        if (solve(r, c + 1)) return true;
        if (aborted) return true;

        board[r][c] = 0;
        backtracks++;
        steps.push({
          type: 'backtrack',
          r: r,
          c: c,
          num: 0,
          tries: tries,
          backtracks: backtracks,
          msg:
            'Constraint violated later. Backtrack: remove ' + num + ' from (' + r + ',' + c + ')',
        });
      } else {
        steps.push({
          type: 'invalid',
          r: r,
          c: c,
          num: num,
          tries: tries,
          backtracks: backtracks,
          msg: 'Invalid placement. ' + num + ' at (' + r + ',' + c + ') breaks rules.',
        });
      }
    }
    return false;
  }

  let success = solve(0, 0);

  if (aborted) {
    steps.push({
      type: 'unsolvable',
      r: -1,
      c: -1,
      tries: tries,
      backtracks: backtracks,
      msg: '⚠️ Maximum steps (' + suState.maxSteps + ') reached! Aborting visualization.',
    });
  } else if (success) {
    steps.push({
      type: 'done',
      r: -1,
      c: -1,
      board: board,
      tries: tries,
      backtracks: backtracks,
      msg: '✅ Sudoku Solved!',
    });
  } else {
    steps.push({
      type: 'unsolvable',
      r: -1,
      c: -1,
      tries: tries,
      backtracks: backtracks,
      msg: '❌ Unsolvable! No valid configuration exists for this grid.',
    });
  }

  return steps;
}

/* ─── Apply step to UI ─── */
function suUpdateCell(r, c, val, cls) {
  let el = document.getElementById('cell-' + r + '-' + c);
  if (!el) return;
  // Clear previous transient states
  el.classList.remove('su-trying', 'su-backtrack', 'su-solved');
  if (val !== undefined) el.value = val === 0 ? '' : val;
  if (cls) el.classList.add(cls);
}

function suUpdateStats(tries, bts) {
  let tEl = document.getElementById('suStatTries');
  let bEl = document.getElementById('suStatBacktracks');
  if (tEl) tEl.textContent = tries;
  if (bEl) bEl.textContent = bts;
}

function suAddLog(step) {
  let log = document.getElementById('suLogWrap');
  if (!log) return;
  let empty = log.querySelector('.su-log-empty');
  if (empty) empty.remove();

  if (step.type === 'invalid') return; // Skip logging invalids to prevent spam

  let cls = 'su-log-entry ';
  if (step.type === 'trying') cls += 'trying';
  else if (step.type === 'backtrack') cls += 'backtrack';
  else if (step.type === 'done') cls += 'done';
  else if (step.type === 'unsolvable') cls += 'backtrack';

  let entry = document.createElement('div');
  entry.className = cls;
  entry.textContent = step.msg;
  log.insertBefore(entry, log.firstChild);

  // Keep max 50 entries
  while (log.children.length > 50) log.removeChild(log.lastChild);
}

function suApplyStep(step) {
  // Status
  let statusEl = document.getElementById('suStatus');
  if (statusEl && step.msg && step.type !== 'invalid') {
    statusEl.textContent = step.msg;
    let cls = 'su-status ';
    if (step.type === 'trying') cls += 'trying';
    else if (step.type === 'backtrack') cls += 'backtrack';
    else if (step.type === 'unsolvable') cls += 'unsolvable';
    else if (step.type === 'done') cls += 'done';
    statusEl.className = cls.trim();
  }

  suUpdateStats(step.tries, step.backtracks);
  suAddLog(step);

  if (step.type === 'trying') {
    suUpdateCell(step.r, step.c, step.num, 'su-trying');
  } else if (step.type === 'invalid') {
    // transient, we don't really show it on grid long enough, but could blink red
    suUpdateCell(step.r, step.c, step.num, 'su-backtrack');
  } else if (step.type === 'backtrack') {
    suUpdateCell(step.r, step.c, 0, 'su-backtrack');
  } else if (step.type === 'done') {
    // Light up all non-fixed cells as solved
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        let el = document.getElementById('cell-' + r + '-' + c);
        if (el && !el.classList.contains('su-fixed')) {
          suUpdateCell(r, c, step.board[r][c], 'su-solved');
        }
      }
    }
  }

  suUpdateStepCounter();
}

/* ─── Playback ─── */
function suGetDelay() {
  let el = document.getElementById('suSpeed');
  return SU_SPEED[el ? el.value : 4] || 50;
}

function suPlay() {
  if (suState.playing) return;
  if (suState.stepIdx >= suState.steps.length) suState.stepIdx = 0;
  suState.playing = true;
  suUpdatePBBtns();
  suPlayNext();
}

function suPlayNext() {
  if (!suState.playing) return;
  if (suState.stepIdx >= suState.steps.length) {
    suState.playing = false;
    suUpdatePBBtns();
    return;
  }

  // Optimization: If playing at Blazing speed, skip 'invalid' steps visually
  let d = suGetDelay();
  let step = suState.steps[suState.stepIdx];
  if (d <= 10 && step.type === 'invalid') {
    suState.stepIdx++;
    suPlayNext(); // Skip waiting
    return;
  }

  suApplyStep(step);
  suState.stepIdx++;
  suState.timer = setTimeout(suPlayNext, d);
}

function suPause() {
  suState.playing = false;
  if (suState.timer) {
    clearTimeout(suState.timer);
    suState.timer = null;
  }
  suUpdatePBBtns();
}

function suStep() {
  if (suState.playing) suPause();
  if (suState.stepIdx >= suState.steps.length) return;

  // Skip invalids on manual step if desired, but let's show them for clarity
  suApplyStep(suState.steps[suState.stepIdx]);
  suState.stepIdx++;
  suUpdatePBBtns();
}

function suUpdatePBBtns() {
  let stepBtn = document.getElementById('suStepBtn');
  let pauseBtn = document.getElementById('suPauseBtn');
  let has = suState.steps.length > 0;
  if (stepBtn) stepBtn.disabled = !has || suState.stepIdx >= suState.steps.length;
  if (pauseBtn) pauseBtn.disabled = !suState.playing;
}

function suUpdateStepCounter() {
  let n = document.getElementById('suStepNum');
  let t = document.getElementById('suStepTotal');
  if (n) n.textContent = suState.stepIdx;
  if (t) t.textContent = suState.steps.length;
}

/* ─── Run ─── */
function suRun() {
  suPause();

  // Read current grid to lock in initial values
  suState.board = suReadGrid();

  // Validate initial board (e.g. user typed duplicate in row/col)
  // To keep it simple, we'll let the solver discover it's unsolvable immediately.

  // Mark fixed cells
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      let el = document.getElementById('cell-' + r + '-' + c);
      if (el) {
        el.classList.remove('su-trying', 'su-backtrack', 'su-solved');
        if (suState.board[r][c] !== 0) {
          el.classList.add('su-fixed');
          el.readOnly = true;
        } else {
          el.classList.remove('su-fixed');
          el.readOnly = true; // Lock empty cells during run
        }
      }
    }
  }

  suState.stepIdx = 0;
  suState.playing = false;

  // Generate steps
  suState.steps = suGenSteps(suState.board);

  // Clear logs & stats
  let log = document.getElementById('suLogWrap');
  if (log) log.innerHTML = '<div class="su-log-empty">Started solving...</div>';
  suUpdateStats(0, 0);

  suUpdateStepCounter();
  suUpdatePBBtns();

  let statusEl = document.getElementById('suStatus');
  if (statusEl) {
    statusEl.textContent = 'Running Backtracking algorithm...';
    statusEl.className = 'su-status';
  }

  suPlay();
}

/* ─── Reset ─── */
function suReset() {
  suPause();
  suState.steps = [];
  suState.stepIdx = 0;

  // Re-enable inputs and clear non-fixed ones
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      let el = document.getElementById('cell-' + r + '-' + c);
      if (el) {
        el.classList.remove('su-trying', 'su-backtrack', 'su-solved', 'su-fixed');
        el.readOnly = false;
        if (suState.board && suState.board[r][c] === 0) el.value = '';
      }
    }
  }

  let log = document.getElementById('suLogWrap');
  if (log) log.innerHTML = '<div class="su-log-empty">Waiting to start...</div>';
  suUpdateStats(0, 0);

  suUpdateStepCounter();
  suUpdatePBBtns();

  let statusEl = document.getElementById('suStatus');
  if (statusEl) {
    statusEl.textContent = 'Select a preset or edit the grid, then click Run.';
    statusEl.className = 'su-status';
  }
}

/* ─── Init ─── */
function suInit() {
  suCreateGrid();
  suLoadPreset('easy');

  // Preset buttons
  document.querySelectorAll('.su-preset-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.su-preset-btn').forEach(function (b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');
      suState.preset = btn.getAttribute('data-preset');
      suPause();
      suState.steps = [];
      suLoadPreset(suState.preset);
      suState.board = suReadGrid();

      let log = document.getElementById('suLogWrap');
      if (log) log.innerHTML = '<div class="su-log-empty">Waiting to start...</div>';
      suUpdateStats(0, 0);
      let statusEl = document.getElementById('suStatus');
      if (statusEl) {
        statusEl.textContent = 'Select a preset or edit the grid, then click Run.';
        statusEl.className = 'su-status';
      }
    });
  });

  // Playback
  let runBtn = document.getElementById('suRunBtn');
  let stepBtn = document.getElementById('suStepBtn');
  let pauseBtn = document.getElementById('suPauseBtn');
  let resetBtn = document.getElementById('suResetBtn');
  let speedSl = document.getElementById('suSpeed');

  if (runBtn) runBtn.addEventListener('click', suRun);
  if (stepBtn) stepBtn.addEventListener('click', suStep);
  if (pauseBtn) pauseBtn.addEventListener('click', suPause);
  if (resetBtn) resetBtn.addEventListener('click', suReset);

  if (speedSl) {
    speedSl.addEventListener('input', function () {
      let lbl = document.getElementById('suSpeedVal');
      if (lbl) lbl.textContent = SU_SPEED_LABEL[speedSl.value] || 'Fast';
      if (suState.playing) {
        suPause();
        suPlay();
      }
    });
  }
}
