// script.js handles: loading screen, navbar, dark mode, scroll top
// This file: N-Queens Visualizer only

document.addEventListener('DOMContentLoaded', function () {
  nqInit();
});

/* ─── Speed ─── */
let NQ_SPEED = { 1: 1200, 2: 700, 3: 350, 4: 100, 5: 20 };
let NQ_SPEED_LABEL = { 1: 'Slowest', 2: 'Slow', 3: 'Normal', 4: 'Fast', 5: 'Blazing' };

/* ─── State ─── */
let nqState = {
  n: 8,
  board: [], // NxN array of booleans
  steps: [],
  stepIdx: 0,
  playing: false,
  timer: null,
  solutions: 0,
};

/* ─── Grid UI Management ─── */
function nqCreateGrid(n) {
  let wrap = document.getElementById('nqBoard');
  if (!wrap) return;
  wrap.innerHTML = '';

  wrap.style.gridTemplateColumns = 'repeat(' + n + ', 1fr)';

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      let cell = document.createElement('div');
      let isDark = (r + c) % 2 !== 0;
      cell.className = 'nq-cell ' + (isDark ? 'nq-cell-dark' : 'nq-cell-light');
      cell.id = 'nq-cell-' + r + '-' + c;
      wrap.appendChild(cell);
    }
  }
}

/* ─── Step Generator (Backtracking Logic) ─── */
function nqGenSteps(n) {
  let steps = [];
  let board = [];
  for (let r = 0; r < n; r++) {
    let row = [];
    for (let c = 0; c < n; c++) row.push(0);
    board.push(row);
  }

  let solutionsFound = 0;

  function isSafe(r, c) {
    let conflicts = [];
    // Check column
    for (let i = 0; i < r; i++) {
      if (board[i][c] === 1) conflicts.push({ r: i, c: c });
    }
    // Check upper diagonal
    for (let i = r, j = c; i >= 0 && j >= 0; i--, j--) {
      if (board[i][j] === 1) conflicts.push({ r: i, c: j });
    }
    // Check lower diagonal
    for (let i = r, j = c; i >= 0 && j < n; i--, j++) {
      if (board[i][j] === 1) conflicts.push({ r: i, c: j });
    }
    return conflicts;
  }

  function cloneBoard() {
    let copy = [];
    for (let i = 0; i < n; i++) copy.push(board[i].slice());
    return copy;
  }

  function solve(row) {
    // Arbitrary ceiling to prevent browser hang if someone hacks N
    if (steps.length > 50000) return true;

    if (row === n) {
      solutionsFound++;
      steps.push({
        type: 'solution',
        board: cloneBoard(),
        solutions: solutionsFound,
        msg: '🎉 Found Valid Configuration #' + solutionsFound + '!',
      });
      return false; // return false to continue finding MORE solutions
    }

    for (let col = 0; col < n; col++) {
      steps.push({
        type: 'trying',
        r: row,
        c: col,
        board: cloneBoard(),
        msg: 'Try placing Queen at Row ' + row + ', Column ' + col,
      });

      let conflicts = isSafe(row, col);

      if (conflicts.length === 0) {
        board[row][col] = 1;

        let abort = solve(row + 1);
        if (abort) return true;

        board[row][col] = 0; // Backtrack
        steps.push({
          type: 'backtrack',
          r: row,
          c: col,
          board: cloneBoard(),
          msg: 'Backtrack: Remove Queen from Row ' + row + ', Column ' + col,
        });
      } else {
        steps.push({
          type: 'invalid',
          r: row,
          c: col,
          board: cloneBoard(),
          conflicts: conflicts,
          msg: 'Conflict! Queen at (' + row + ',' + col + ') is attacked.',
        });
      }
    }
    return false;
  }

  solve(0);

  steps.push({
    type: 'done',
    board: cloneBoard(),
    solutions: solutionsFound,
    msg: '✅ Search Complete. Total Solutions: ' + solutionsFound,
  });

  return steps;
}

/* ─── Apply step to UI ─── */
function nqClearTransientStates() {
  let cells = document.querySelectorAll('.nq-cell');
  cells.forEach(function (c) {
    c.classList.remove('nq-trying', 'nq-invalid', 'nq-conflict', 'nq-solution');
    c.innerHTML = '';
  });
}

function nqDrawBoard(boardData) {
  let n = boardData.length;
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      let el = document.getElementById('nq-cell-' + r + '-' + c);
      if (el && boardData[r][c] === 1) {
        el.innerHTML = '<span class="nq-queen">♛</span>';
      }
    }
  }
}

function nqUpdateStats(sols) {
  let el = document.getElementById('nqStatSolutions');
  if (el && sols !== undefined) el.textContent = sols;
}

function nqAddLog(step) {
  let log = document.getElementById('nqLogWrap');
  if (!log) return;
  let empty = log.querySelector('.nq-log-empty');
  if (empty) empty.remove();

  // Skip invalids for speed 5 (handled below if needed), but always log for others
  let cls = 'nq-log-entry ';
  if (step.type === 'trying') cls += 'trying';
  else if (step.type === 'backtrack') cls += 'backtrack';
  else if (step.type === 'invalid') cls += 'backtrack';
  else if (step.type === 'solution') cls += 'solution';
  else if (step.type === 'done') cls += 'done';

  let entry = document.createElement('div');
  entry.className = cls;
  entry.textContent = step.msg;
  log.insertBefore(entry, log.firstChild);

  while (log.children.length > 50) log.removeChild(log.lastChild);
}

function nqApplyStep(step) {
  // Status
  let statusEl = document.getElementById('nqStatus');
  if (statusEl && step.msg) {
    statusEl.textContent = step.msg;
    let cls = 'nq-status ';
    if (step.type === 'trying') cls += 'trying';
    else if (step.type === 'backtrack' || step.type === 'invalid') cls += 'backtrack';
    else if (step.type === 'solution') cls += 'solution';
    else if (step.type === 'done') cls += 'done';
    statusEl.className = cls.trim();
  }

  nqAddLog(step);
  nqClearTransientStates();
  nqDrawBoard(step.board);

  if (step.type === 'trying') {
    let el = document.getElementById('nq-cell-' + step.r + '-' + step.c);
    if (el) {
      el.classList.add('nq-trying');
      el.innerHTML = '<span class="nq-queen" style="opacity:0.5">♛</span>';
    }
  } else if (step.type === 'invalid') {
    let el = document.getElementById('nq-cell-' + step.r + '-' + step.c);
    if (el) el.classList.add('nq-invalid');
    if (step.conflicts) {
      step.conflicts.forEach(function (cf) {
        let cel = document.getElementById('nq-cell-' + cf.r + '-' + cf.c);
        if (cel) cel.classList.add('nq-conflict');
      });
    }
  } else if (step.type === 'solution') {
    let cells = document.querySelectorAll('.nq-cell');
    cells.forEach(function (c) {
      c.classList.add('nq-solution');
    });
    nqUpdateStats(step.solutions);
  } else if (step.type === 'done') {
    nqUpdateStats(step.solutions);
  }

  nqUpdateStepCounter();
}

/* ─── Playback ─── */
function nqGetDelay() {
  let el = document.getElementById('nqSpeed');
  return NQ_SPEED[el ? el.value : 4] || 100;
}

function nqPlay() {
  if (nqState.playing) return;
  if (nqState.stepIdx >= nqState.steps.length) nqState.stepIdx = 0;
  nqState.playing = true;
  nqUpdatePBBtns();
  nqPlayNext();
}

function nqPlayNext() {
  if (!nqState.playing) return;
  if (nqState.stepIdx >= nqState.steps.length) {
    nqState.playing = false;
    nqUpdatePBBtns();
    return;
  }

  let d = nqGetDelay();
  let step = nqState.steps[nqState.stepIdx];

  // Optimization: Skip invalid/trying rendering on Blazing fast to jump between solutions
  if (d <= 20 && (step.type === 'trying' || step.type === 'invalid' || step.type === 'backtrack')) {
    // Only apply solution and done steps on blazing, to prevent DOM lockup on 8x8
    if (
      nqState.steps[nqState.stepIdx + 1] &&
      (nqState.steps[nqState.stepIdx + 1].type === 'solution' ||
        nqState.steps[nqState.stepIdx + 1].type === 'done')
    ) {
      // next is interesting
    } else {
      nqState.stepIdx++;
      nqPlayNext();
      return;
    }
  }

  nqApplyStep(step);
  nqState.stepIdx++;

  // Pause automatically on a solution so the user can see it!
  if (step.type === 'solution') {
    nqPause();
  } else {
    nqState.timer = setTimeout(nqPlayNext, d);
  }
}

function nqPause() {
  nqState.playing = false;
  if (nqState.timer) {
    clearTimeout(nqState.timer);
    nqState.timer = null;
  }
  nqUpdatePBBtns();
}

function nqStep() {
  if (nqState.playing) nqPause();
  if (nqState.stepIdx >= nqState.steps.length) return;

  nqApplyStep(nqState.steps[nqState.stepIdx]);
  nqState.stepIdx++;
  nqUpdatePBBtns();
}

function nqUpdatePBBtns() {
  let stepBtn = document.getElementById('nqStepBtn');
  let pauseBtn = document.getElementById('nqPauseBtn');
  let has = nqState.steps.length > 0;
  if (stepBtn) stepBtn.disabled = !has || nqState.stepIdx >= nqState.steps.length;
  if (pauseBtn) pauseBtn.disabled = !nqState.playing;
}

function nqUpdateStepCounter() {
  let n = document.getElementById('nqStepNum');
  let t = document.getElementById('nqStepTotal');
  if (n) n.textContent = nqState.stepIdx;
  if (t) t.textContent = nqState.steps.length;
}

/* ─── Run ─── */
function nqRun() {
  nqPause();

  let sizeEl = document.getElementById('nqSize');
  let n = parseInt(sizeEl ? sizeEl.value : 8);
  if (isNaN(n) || n < 4) n = 4;
  if (n > 8) n = 8;

  nqState.n = n;
  nqCreateGrid(n);

  nqState.stepIdx = 0;
  nqState.playing = false;
  nqState.solutions = 0;

  // Generate steps
  nqState.steps = nqGenSteps(n);

  // Clear logs & stats
  let log = document.getElementById('nqLogWrap');
  if (log) log.innerHTML = '<div class="nq-log-empty">Started solving...</div>';
  nqUpdateStats(0);

  nqUpdateStepCounter();
  nqUpdatePBBtns();

  let statusEl = document.getElementById('nqStatus');
  if (statusEl) {
    statusEl.textContent = 'Running Backtracking algorithm...';
    statusEl.className = 'nq-status';
  }

  nqPlay();
}

/* ─── Reset ─── */
function nqReset() {
  nqPause();
  nqState.steps = [];
  nqState.stepIdx = 0;
  nqState.solutions = 0;

  let sizeEl = document.getElementById('nqSize');
  let n = parseInt(sizeEl ? sizeEl.value : 8);
  nqCreateGrid(n);

  let log = document.getElementById('nqLogWrap');
  if (log) log.innerHTML = '<div class="nq-log-empty">Waiting to start...</div>';
  nqUpdateStats(0);

  nqUpdateStepCounter();
  nqUpdatePBBtns();

  let statusEl = document.getElementById('nqStatus');
  if (statusEl) {
    statusEl.textContent = 'Select a board size and click Run.';
    statusEl.className = 'nq-status';
  }
}

/* ─── Init ─── */
function nqInit() {
  let sizeEl = document.getElementById('nqSize');
  if (sizeEl) {
    sizeEl.addEventListener('input', function () {
      let lbl = document.getElementById('nqSizeVal');
      if (lbl) lbl.textContent = sizeEl.value + 'x' + sizeEl.value;
      nqReset();
    });
    // init
    nqCreateGrid(parseInt(sizeEl.value));
  }

  // Playback
  let runBtn = document.getElementById('nqRunBtn');
  let stepBtn = document.getElementById('nqStepBtn');
  let pauseBtn = document.getElementById('nqPauseBtn');
  let resetBtn = document.getElementById('nqResetBtn');
  let speedSl = document.getElementById('nqSpeed');

  if (runBtn) runBtn.addEventListener('click', nqRun);
  if (stepBtn) stepBtn.addEventListener('click', nqStep);
  if (pauseBtn) pauseBtn.addEventListener('click', nqPause);
  if (resetBtn) resetBtn.addEventListener('click', nqReset);

  if (speedSl) {
    speedSl.addEventListener('input', function () {
      let lbl = document.getElementById('nqSpeedVal');
      if (lbl) lbl.textContent = NQ_SPEED_LABEL[speedSl.value] || 'Fast';
      if (nqState.playing) {
        nqPause();
        nqPlay();
      }
    });
  }
}
