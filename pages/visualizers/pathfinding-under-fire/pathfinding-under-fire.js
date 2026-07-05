// script.js handles: loading screen, navbar, dark mode, scroll top
// This file: Pathfinding Under Fire only
// All globals prefixed puf_ or PUF_ to avoid conflicts

document.addEventListener('DOMContentLoaded', function() {
  pufInit();
});

/* ─── Constants ─── */
var PUF_ROWS = 25;
var PUF_COLS = 25;
var PUF_SPEED_MS = { 1: 120, 2: 60, 3: 28, 4: 12, 5: 4 };
var PUF_SPEED_LABEL = { 1:'Slowest', 2:'Slow', 3:'Normal', 4:'Fast', 5:'Blazing' };
var PUF_ALGO_COLOR = { astar:'#00d4ff', bfs:'#22c55e', dijkstra:'#f59e0b', dfs:'#a855f7' };

/* ─── Grid state ─── */
// Each cell: { row, col, wall, source, target }
var pufGrid = [];          // flat array of PUF_ROWS × PUF_COLS booleans (walls)
var pufSource = { row:12, col:2  };
var pufTarget = { row:12, col:22 };

/* ─── Heatmap ─── */
var pufHeatMap = [];       // flat array: visit counts per cell

/* ─── Per-algorithm runner state ─── */
var PUF_ALGOS = ['astar','bfs','dijkstra','dfs'];

var pufRunners = {};       // keyed by algo id

/* ─── UI state ─── */
var pufMode       = 'wall';
var pufActiveAlgo = 'astar';
var pufPlaying    = false;
var pufTimer      = null;
var pufMouseDown  = false;
var pufObstaclesFired = 0;
var pufGlobalReplans  = 0;
var pufGlobalSteps    = 0;
var pufShowHeatmap    = false;
var pufDiagonal       = false;

/* ─── Init grid data ─── */
function pufInitGrid() {
  pufGrid    = new Array(PUF_ROWS * PUF_COLS).fill(false);
  pufHeatMap = new Array(PUF_ROWS * PUF_COLS).fill(0);
}

function pufIdx(row, col) { return row * PUF_COLS + col; }
function pufIsWall(row, col) { return pufGrid[pufIdx(row, col)]; }
function pufIsSource(row, col) { return row === pufSource.row && col === pufSource.col; }
function pufIsTarget(row, col) { return row === pufTarget.row && col === pufTarget.col; }
function pufInBounds(row, col) { return row >= 0 && row < PUF_ROWS && col >= 0 && col < PUF_COLS; }

/* ─── Neighbors ─── */
function pufNeighbors(row, col) {
  var dirs = [[0,1],[0,-1],[1,0],[-1,0]];
  if (pufDiagonal) dirs = dirs.concat([[1,1],[1,-1],[-1,1],[-1,-1]]);
  var result = [];
  dirs.forEach(function(d) {
    var r = row + d[0]; var c = col + d[1];
    if (pufInBounds(r, c) && !pufIsWall(r, c)) result.push({ row:r, col:c });
  });
  return result;
}

/* ─── Heuristic (Manhattan) ─── */
function pufH(row, col) {
  var dr = Math.abs(row - pufTarget.row);
  var dc = Math.abs(col - pufTarget.col);
  // Diagonal steps cost 1, so admissible heuristic is Chebyshev distance.
  return pufDiagonal ? Math.max(dr, dc) : dr + dc;
}

/* ─── Runner factory ─── */
function pufMakeRunner(algo) {
  var src = pufSource;
  var runner = {
    algo       : algo,
    visited    : {},        // key='r,c' → true
    parent     : {},        // key='r,c' → {row,col}
    frontier   : [],        // varies by algo
    dist       : {},        // key='r,c' → number (Dijkstra/A*)
    path       : [],        // [{row,col}] final path
    done       : false,
    found      : false,
    replans    : 0,
    steps      : 0,
    visitedCount: 0,
    blocked    : false,     // path was blocked mid-run

    // step() returns 'running'|'found'|'no-path'
    step       : null,
  };

  var key = function(r,c) { return r + ',' + c; };
  var srcKey = key(src.row, src.col);

  if (algo === 'bfs') {
    runner.frontier = [{ row: src.row, col: src.col }];
    runner.visited[srcKey] = true;
    runner.step = function() {
      if (runner.frontier.length === 0) return 'no-path';
      var cur = runner.frontier.shift();
      runner.steps++;
      runner.visitedCount++;
      pufHeatMap[pufIdx(cur.row, cur.col)]++;

      if (pufIsTarget(cur.row, cur.col)) {
        runner.path = pufTracePath(runner, cur);
        runner.found = true;
        return 'found';
      }
      pufNeighbors(cur.row, cur.col).forEach(function(nb) {
        var k = key(nb.row, nb.col);
        if (!runner.visited[k]) {
          runner.visited[k] = true;
          runner.parent[k] = cur;
          runner.frontier.push(nb);
        }
      });
      return 'running';
    };

  } else if (algo === 'dfs') {
    runner.frontier = [{ row: src.row, col: src.col }];
    runner.step = function() {
      if (runner.frontier.length === 0) return 'no-path';
      var cur = runner.frontier.pop();
      var k   = key(cur.row, cur.col);
      if (runner.visited[k]) return 'running';
      runner.visited[k] = true;
      runner.steps++;
      runner.visitedCount++;
      pufHeatMap[pufIdx(cur.row, cur.col)]++;

      if (pufIsTarget(cur.row, cur.col)) {
        runner.path = pufTracePath(runner, cur);
        runner.found = true;
        return 'found';
      }
      pufNeighbors(cur.row, cur.col).forEach(function(nb) {
        var nk = key(nb.row, nb.col);
        if (!runner.visited[nk]) {
          runner.parent[nk] = cur;
          runner.frontier.push(nb);
        }
      });
      return 'running';
    };

  } else if (algo === 'dijkstra') {
    runner.dist[srcKey] = 0;
    runner.frontier = [{ row: src.row, col: src.col, d: 0 }];
    runner.step = function() {
      if (runner.frontier.length === 0) return 'no-path';
      runner.frontier.sort(function(a,b){return a.d-b.d;});
      var cur = runner.frontier.shift();
      var k   = key(cur.row, cur.col);
      if (runner.visited[k]) return 'running';
      runner.visited[k] = true;
      runner.steps++;
      runner.visitedCount++;
      pufHeatMap[pufIdx(cur.row, cur.col)]++;

      if (pufIsTarget(cur.row, cur.col)) {
        runner.path = pufTracePath(runner, cur);
        runner.found = true;
        return 'found';
      }
      pufNeighbors(cur.row, cur.col).forEach(function(nb) {
        var nk = key(nb.row, nb.col);
        var nd = cur.d + 1;
        if (!runner.visited[nk] && (runner.dist[nk] === undefined || nd < runner.dist[nk])) {
          runner.dist[nk] = nd;
          runner.parent[nk] = cur;
          runner.frontier.push({ row: nb.row, col: nb.col, d: nd });
        }
      });
      return 'running';
    };

  } else { // astar
    runner.dist[srcKey] = 0;
    runner.frontier = [{ row: src.row, col: src.col, f: pufH(src.row, src.col), g: 0 }];
    runner.step = function() {
      if (runner.frontier.length === 0) return 'no-path';
      runner.frontier.sort(function(a,b){return a.f-b.f;});
      var cur = runner.frontier.shift();
      var k   = key(cur.row, cur.col);
      if (runner.visited[k]) return 'running';
      runner.visited[k] = true;
      runner.steps++;
      runner.visitedCount++;
      pufHeatMap[pufIdx(cur.row, cur.col)]++;

      if (pufIsTarget(cur.row, cur.col)) {
        runner.path = pufTracePath(runner, cur);
        runner.found = true;
        return 'found';
      }
      pufNeighbors(cur.row, cur.col).forEach(function(nb) {
        var nk = key(nb.row, nb.col);
        var ng = cur.g + 1;
        if (!runner.visited[nk] && (runner.dist[nk] === undefined || ng < runner.dist[nk])) {
          runner.dist[nk] = ng;
          runner.parent[nk] = cur;
          runner.frontier.push({ row: nb.row, col: nb.col, g: ng, f: ng + pufH(nb.row, nb.col) });
        }
      });
      return 'running';
    };
  }

  return runner;
}

/* ─── Trace path ─── */
function pufTracePath(runner, cur) {
  var key = function(r,c) { return r + ',' + c; };
  var path = [];
  var node = cur;
  var maxIter = PUF_ROWS * PUF_COLS + 10;
  while (node && maxIter-- > 0) {
    path.unshift({ row: node.row, col: node.col });
    var k = key(node.row, node.col);
    if (pufIsSource(node.row, node.col)) break;
    node = runner.parent[k];
  }
  return path;
}

/* ─── Replan: restart runner from current position or from source ─── */
function pufReplan(algo) {
  var old = pufRunners[algo];
  if (!old) return;

  old.replans++;
  pufGlobalReplans++;

  // Flash cells on old path
  if (old.path && old.path.length) {
    old.path.forEach(function(cell) {
      var el = pufGetCellEl(cell.row, cell.col);
      if (el) { el.classList.add('puf-replan-flash'); setTimeout(function(){ el.classList.remove('puf-replan-flash'); }, 400); }
    });
  }

  // Build fresh runner
  var fresh = pufMakeRunner(algo);
  fresh.replans    = old.replans;
  fresh.visitedCount = old.visitedCount;
  fresh.steps      = old.steps;
  pufRunners[algo] = fresh;

  pufSetBadge(algo, 'replanning');
  pufSetStatus('🔄 ' + algo.toUpperCase() + ' is replanning around the new obstacle!', '🔥');
}

/* ─── Fire obstacle: place wall on a path cell ─── */
function pufFireObstacle(row, col) {
  if (pufIsSource(row, col) || pufIsTarget(row, col)) return;
  if (pufGrid[pufIdx(row, col)]) return; // already a wall

  pufGrid[pufIdx(row, col)] = true;
  pufObstaclesFired++;
  pufUpdateGlobalStats();

  // Animate wall
  var el = pufGetCellEl(row, col);
  if (el) { el.classList.add('puf-wall-new'); setTimeout(function(){ el.classList.remove('puf-wall-new'); }, 300); }

  // Trigger replan for any running algo whose path passes through this cell
  PUF_ALGOS.forEach(function(algo) {
    var runner = pufRunners[algo];
    if (!runner || runner.done) return;

    // Check if this cell is on the current frontier or path
    var onPath = runner.path && runner.path.some(function(p){ return p.row === row && p.col === col; });
    var inFrontier = runner.frontier && runner.frontier.some(function(f){ return f.row === row && f.col === col; });

    if (onPath || inFrontier) {
      pufReplan(algo);
    } else {
      // Remove from frontier just in case
      if (runner.frontier) {
        runner.frontier = runner.frontier.filter(function(f){ return !(f.row === row && f.col === col); });
      }
    }
  });

  pufRenderGrid();
}

/* ─── DOM: get cell element ─── */
function pufGetCellEl(row, col) {
  var grid = document.getElementById('pufGrid');
  if (!grid) return null;
  return grid.querySelector('[data-row="' + row + '"][data-col="' + col + '"]');
}

/* ─── Build DOM grid ─── */
function pufBuildGrid() {
  var gridEl = document.getElementById('pufGrid');
  if (!gridEl) return;
  gridEl.innerHTML = '';

  for (var r = 0; r < PUF_ROWS; r++) {
    for (var c = 0; c < PUF_COLS; c++) {
      var cell = document.createElement('div');
      cell.className  = 'puf-cell';
      cell.setAttribute('data-row', r);
      cell.setAttribute('data-col', c);
      gridEl.appendChild(cell);
    }
  }

  // Mouse events for drawing
  gridEl.addEventListener('mousedown', function(e) {
    pufMouseDown = true;
    pufHandleCellEvent(e);
  });

  gridEl.addEventListener('mousemove', function(e) {
    if (pufMouseDown) pufHandleCellEvent(e);
  });

  document.addEventListener('mouseup', function() { pufMouseDown = false; });

  // Touch support
  gridEl.addEventListener('touchstart', function(e) {
    e.preventDefault();
    pufMouseDown = true;
    pufHandleTouchEvent(e);
  }, { passive: false });

  gridEl.addEventListener('touchmove', function(e) {
    e.preventDefault();
    pufHandleTouchEvent(e);
  }, { passive: false });

  gridEl.addEventListener('touchend', function() { pufMouseDown = false; });
}

function pufHandleCellEvent(e) {
  var target = e.target;
  if (!target.classList.contains('puf-cell')) target = target.closest('.puf-cell');
  if (!target) return;
  var row = parseInt(target.getAttribute('data-row'));
  var col = parseInt(target.getAttribute('data-col'));
  if (isNaN(row) || isNaN(col)) return;
  pufHandleCell(row, col);
}

function pufHandleTouchEvent(e) {
  var touch  = e.touches[0];
  var target = document.elementFromPoint(touch.clientX, touch.clientY);
  if (!target) return;
  if (!target.classList.contains('puf-cell')) target = target.closest('.puf-cell');
  if (!target) return;
  var row = parseInt(target.getAttribute('data-row'));
  var col = parseInt(target.getAttribute('data-col'));
  if (isNaN(row) || isNaN(col)) return;
  pufHandleCell(row, col);
}

function pufHandleCell(row, col) {
  if (pufMode === 'wall') {
    if (pufIsSource(row,col) || pufIsTarget(row,col)) return;
    if (!pufIsWall(row,col)) { pufGrid[pufIdx(row,col)] = true; pufRenderGrid(); }
  } else if (pufMode === 'erase') {
    if (pufIsWall(row,col)) { pufGrid[pufIdx(row,col)] = false; pufRenderGrid(); }
  } else if (pufMode === 'source') {
    if (pufIsWall(row,col) || pufIsTarget(row,col)) return;
    pufSource = { row:row, col:col }; pufRenderGrid();
  } else if (pufMode === 'target') {
    if (pufIsWall(row,col) || pufIsSource(row,col)) return;
    pufTarget = { row:row, col:col }; pufRenderGrid();
  } else if (pufMode === 'fire') {
    if (pufPlaying) {
      pufFireObstacle(row, col);
    } else {
      // Not running — just draw a wall
      if (!pufIsSource(row,col) && !pufIsTarget(row,col)) {
        pufGrid[pufIdx(row,col)] = true;
        pufRenderGrid();
        pufSetStatus('💡 Start the algorithm first, then use Fire! to place obstacles mid-path.', '💥');
      }
    }
  }
}

/* ─── Render grid ─── */
function pufRenderGrid() {
  var gridEl = document.getElementById('pufGrid');
  if (!gridEl) return;

  // Collect all path/visited/frontier sets across running algos
  var visitedSets  = {};
  var frontierSets = {};
  var pathSets     = {};

  PUF_ALGOS.forEach(function(algo) {
    visitedSets[algo]  = {};
    frontierSets[algo] = {};
    pathSets[algo]     = {};
    var runner = pufRunners[algo];
    if (!runner) return;
    Object.keys(runner.visited).forEach(function(k){ visitedSets[algo][k] = true; });
    (runner.frontier || []).forEach(function(f){ frontierSets[algo][f.row + ',' + f.col] = true; });
    (runner.path || []).forEach(function(p){ pathSets[algo][p.row + ',' + p.col] = true; });
  });

  // Max heat for normalization
  var maxHeat = 1;
  if (pufShowHeatmap) {
    for (var i = 0; i < pufHeatMap.length; i++) if (pufHeatMap[i] > maxHeat) maxHeat = pufHeatMap[i];
  }

  gridEl.querySelectorAll('.puf-cell').forEach(function(cell) {
    var row = parseInt(cell.getAttribute('data-row'));
    var col = parseInt(cell.getAttribute('data-col'));
    var k   = row + ',' + col;

    // Reset classes
    cell.className = 'puf-cell';
    var staleHeat = cell.querySelector('.puf-cell-heat');
    if (staleHeat) staleHeat.remove();

    if (pufIsSource(row, col)) { cell.classList.add('puf-source'); return; }
    if (pufIsTarget(row, col)) { cell.classList.add('puf-target'); return; }
    if (pufIsWall(row, col))   { cell.classList.add('puf-wall');   return; }

    // Show path first (priority), then frontier, then visited
    // Priority: astar > bfs > dijkstra > dfs
    var shown = false;
    PUF_ALGOS.forEach(function(algo) {
      if (shown) return;
      if (pathSets[algo][k]) { cell.classList.add('puf-path-' + algo); shown = true; }
    });
    if (!shown) {
      PUF_ALGOS.forEach(function(algo) {
        if (shown) return;
        if (frontierSets[algo][k]) { cell.classList.add('puf-frontier-' + algo); shown = true; }
      });
    }
    if (!shown) {
      PUF_ALGOS.forEach(function(algo) {
        if (shown) return;
        if (visitedSets[algo][k]) { cell.classList.add('puf-visited-' + algo); shown = true; }
      });
    }

    // Heatmap overlay
    if (pufShowHeatmap && pufHeatMap[pufIdx(row, col)] > 0) {
      var heatRatio = pufHeatMap[pufIdx(row, col)] / maxHeat;
      var r = Math.round(34  + (239-34)  * heatRatio);
      var g = Math.round(197 + (68-197)  * heatRatio);
      var b = Math.round(94  + (68-94)   * heatRatio);
      // Remove existing heat overlay
      var existing = cell.querySelector('.puf-cell-heat');
      if (existing) existing.remove();
      var heat = document.createElement('div');
      heat.className = 'puf-cell-heat';
      heat.style.background = 'rgba(' + r + ',' + g + ',' + b + ',' + (heatRatio * 0.55) + ')';
      cell.appendChild(heat);
    }
  });
}

/* ─── Update metrics panel ─── */
function pufUpdateMetrics() {
  var totalVisited = 0;

  PUF_ALGOS.forEach(function(algo) {
    var runner = pufRunners[algo];
    var visited = runner ? runner.visitedCount : 0;
    var path    = runner && runner.found ? runner.path.length : null;
    var steps   = runner ? runner.steps : 0;
    var replans = runner ? runner.replans : 0;

    totalVisited += visited;

    var vEl = document.getElementById('pufVisited' + pufCapFirst(algo));
    var pEl = document.getElementById('pufPath'    + pufCapFirst(algo));
    var sEl = document.getElementById('pufSteps'   + pufCapFirst(algo));
    var rEl = document.getElementById('pufReplan'  + pufCapFirst(algo));
    var bEl = document.getElementById('pufBar'     + pufCapFirst(algo));

    if (vEl) vEl.textContent = visited;
    if (pEl) pEl.textContent = path !== null ? path : '—';
    if (sEl) sEl.textContent = steps;
    if (rEl) rEl.textContent = replans;

    // Progress bar: visited as fraction of grid
    var pct = Math.min(100, Math.round(visited / (PUF_ROWS * PUF_COLS) * 100));
    if (bEl) bEl.style.width = pct + '%';
  });

  pufGlobalSteps = PUF_ALGOS.reduce(function(acc, algo) {
    return acc + (pufRunners[algo] ? pufRunners[algo].steps : 0);
  }, 0);

  pufUpdateGlobalStats();
}

function pufCapFirst(s) { return s[0].toUpperCase() + s.slice(1); }

function pufUpdateGlobalStats() {
  var rEl = document.getElementById('pufTotalReplans');
  var sEl = document.getElementById('pufTotalSteps');
  var oEl = document.getElementById('pufObstaclesFired');
  if (rEl) rEl.textContent = pufGlobalReplans;
  if (sEl) sEl.textContent = pufGlobalSteps;
  if (oEl) oEl.textContent = pufObstaclesFired;
}

function pufSetBadge(algo, state) {
  var el = document.getElementById('pufBadge' + pufCapFirst(algo));
  if (!el) return;
  el.className = 'puf-metric-badge ' + state;
  var labels = { ready:'Ready', running:'Running', found:'Found!', replanning:'Replanning…', failed:'No Path' };
  el.textContent = labels[state] || state;
}

/* ─── Status ─── */
function pufSetStatus(msg, icon) {
  var msgEl  = document.getElementById('pufStatusMsg');
  var iconEl = document.getElementById('pufStatusIcon');
  if (msgEl)  msgEl.textContent  = msg;
  if (iconEl) iconEl.textContent = icon || '▶';
}

/* ─── Playback ─── */
function pufGetDelay() {
  var el = document.getElementById('pufSpeed');
  return PUF_SPEED_MS[el ? el.value : 3] || 28;
}

function pufRun() {
  // Stop any existing run
  pufStopTimer();

  // Check algo selector - only run selected algo
  pufRunners = {};
  var activeAlgo = pufActiveAlgo;

  pufRunners[activeAlgo] = pufMakeRunner(activeAlgo);
  pufSetBadge(activeAlgo, 'running');

  // Reset other algo badges
  PUF_ALGOS.forEach(function(algo) {
    if (algo !== activeAlgo) pufSetBadge(algo, 'ready');
  });

  pufGlobalReplans  = 0;
  pufGlobalSteps    = 0;
  pufObstaclesFired = 0;
  pufHeatMap        = new Array(PUF_ROWS * PUF_COLS).fill(0);
  pufPlaying        = true;

  var stepBtn  = document.getElementById('pufStepBtn');
  var pauseBtn = document.getElementById('pufPauseBtn');
  if (stepBtn)  stepBtn.disabled  = false;
  if (pauseBtn) pauseBtn.disabled = false;

  pufSetStatus('Running ' + activeAlgo.toUpperCase() + '… Use Fire! mode to place obstacles mid-path.', '▶');
  pufTick();
}

function pufTick() {
  if (!pufPlaying) return;

  var runner = pufRunners[pufActiveAlgo];
  if (!runner) { pufStopTimer(); return; }

  if (!runner.done) {
    var result = runner.step();
    if (result === 'found') {
      runner.done = true;
      pufSetBadge(pufActiveAlgo, 'found');
      pufSetStatus('✅ ' + pufActiveAlgo.toUpperCase() + ' found the path! Length: ' + runner.path.length + ' cells. Visited: ' + runner.visitedCount + '. Replans: ' + runner.replans, '✅');
      pufPlaying = false;
      var pauseBtn = document.getElementById('pufPauseBtn');
      var stepBtn  = document.getElementById('pufStepBtn');
      if (pauseBtn) pauseBtn.disabled = true;
      if (stepBtn)  stepBtn.disabled  = true;
    } else if (result === 'no-path') {
      runner.done = true;
      pufSetBadge(pufActiveAlgo, 'failed');
      pufSetStatus('❌ No path found from source to target. Draw a different wall layout.', '❌');
      pufPlaying = false;
    }
  }

  pufRenderGrid();
  pufUpdateMetrics();

  if (pufPlaying) {
    pufTimer = setTimeout(pufTick, pufGetDelay());
  }
}

function pufStep() {
  if (pufPlaying) { pufPause(); return; }
  var runner = pufRunners[pufActiveAlgo];
  if (!runner || runner.done) return;

  var result = runner.step();
  if (result === 'found') {
    runner.done = true;
    pufSetBadge(pufActiveAlgo, 'found');
    pufSetStatus('✅ Path found! Length: ' + runner.path.length + '. Replans: ' + runner.replans, '✅');
    var stepBtn  = document.getElementById('pufStepBtn');
    var pauseBtn = document.getElementById('pufPauseBtn');
    if (stepBtn)  stepBtn.disabled  = true;
    if (pauseBtn) pauseBtn.disabled = true;
  } else if (result === 'no-path') {
    runner.done = true;
    pufSetBadge(pufActiveAlgo, 'failed');
    pufSetStatus('❌ No path found.', '❌');
  }

  pufRenderGrid();
  pufUpdateMetrics();
}

function pufPause() {
  pufPlaying = false;
  pufStopTimer();
  var pauseBtn = document.getElementById('pufPauseBtn');
  if (pauseBtn) pauseBtn.disabled = true;
  pufSetStatus('⏸ Paused. Use Fire! to place obstacles, then Resume.', '⏸');
}

function pufStopTimer() {
  if (pufTimer) { clearTimeout(pufTimer); pufTimer = null; }
}

function pufReset() {
  pufStopTimer();
  pufPlaying    = false;
  pufRunners    = {};
  pufGlobalReplans  = 0;
  pufGlobalSteps    = 0;
  pufObstaclesFired = 0;
  pufHeatMap    = new Array(PUF_ROWS * PUF_COLS).fill(0);
  pufInitGrid();
  pufSource     = { row:12, col:2  };
  pufTarget     = { row:12, col:22 };

  PUF_ALGOS.forEach(function(algo) { pufSetBadge(algo, 'ready'); });

  var stepBtn  = document.getElementById('pufStepBtn');
  var pauseBtn = document.getElementById('pufPauseBtn');
  if (stepBtn)  stepBtn.disabled  = true;
  if (pauseBtn) pauseBtn.disabled = true;

  pufRenderGrid();
  pufUpdateMetrics();
  pufSetStatus('Reset. Draw walls, then click Run.', '⏸');
}

/* ─── Presets ─── */
function pufApplyPreset(name) {
  pufReset();

  if (name === 'maze') {
    // Vertical walls with gaps
    for (var c = 4; c < PUF_COLS - 2; c += 4) {
      for (var r = 0; r < PUF_ROWS; r++) {
        if (c % 8 === 4) {
          if (r !== PUF_ROWS - 2 && r !== PUF_ROWS - 3) pufGrid[pufIdx(r, c)] = true;
        } else {
          if (r !== 0 && r !== 1) pufGrid[pufIdx(r, c)] = true;
        }
      }
    }
  } else if (name === 'spiral') {
    // Spiral walls
    var walls = [];
    // Outer ring gaps
    for (var i = 2; i < 23; i++) { walls.push([2,i],[22,i],[i,2],[i,22]); }
    for (var i = 4; i < 21; i++) { walls.push([4,i],[20,i]); }
    for (var i = 5; i < 20; i++) { walls.push([i,4],[i,20]); }
    for (var i = 6; i < 19; i++) { walls.push([6,i]); }
    walls.forEach(function(w) {
      if (w[0] !== pufSource.row || w[1] !== pufSource.col)
        if (w[0] !== pufTarget.row || w[1] !== pufTarget.col)
          pufGrid[pufIdx(w[0], w[1])] = true;
    });
  } else if (name === 'rooms') {
    // 4 rooms with doorways
    var hWall1 = 8; var hWall2 = 16;
    var vWall  = 12;
    for (var c = 0; c < PUF_COLS; c++) {
      if (c !== 4 && c !== 20) { pufGrid[pufIdx(hWall1, c)] = true; pufGrid[pufIdx(hWall2, c)] = true; }
    }
    for (var r = 0; r < PUF_ROWS; r++) {
      if (r !== 4 && r !== 12 && r !== 20) pufGrid[pufIdx(r, vWall)] = true;
    }
  }
  // 'clear' does nothing (grid already reset)

  pufRenderGrid();
  pufSetStatus('Preset applied. Click Run to start.', '⏸');
}

/* ─── Mode indicator text ─── */
var PUF_MODE_TEXT = {
  wall:   '<i class="fas fa-square"></i> Wall mode — click/drag to draw walls',
  erase:  '<i class="fas fa-eraser"></i> Erase mode — click/drag to remove walls',
  source: '<i class="fas fa-play"></i> Source mode — click to move the start node',
  target: '<i class="fas fa-flag"></i> Target mode — click to move the end node',
  fire:   '<i class="fas fa-fire"></i> Fire! mode — click path cells to block them mid-run',
};

/* ─── Init ─── */
function pufInit() {
  pufInitGrid();
  pufBuildGrid();
  pufRenderGrid();
  pufUpdateMetrics();

  // Algorithm buttons
  document.querySelectorAll('.puf-algo-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.puf-algo-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      pufActiveAlgo = btn.getAttribute('data-algo');
    });
  });

  // Mode buttons
  document.querySelectorAll('.puf-mode-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.puf-mode-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      pufMode = btn.getAttribute('data-mode');
      var indicator = document.getElementById('pufModeIndicator');
      if (indicator) indicator.innerHTML = PUF_MODE_TEXT[pufMode] || pufMode;
    });
  });

  // Playback buttons
  var runBtn   = document.getElementById('pufRunBtn');
  var stepBtn  = document.getElementById('pufStepBtn');
  var pauseBtn = document.getElementById('pufPauseBtn');
  var resetBtn = document.getElementById('pufResetBtn');

  if (runBtn)   runBtn.addEventListener('click',   pufRun);
  if (stepBtn)  stepBtn.addEventListener('click',  pufStep);
  if (pauseBtn) pauseBtn.addEventListener('click', pufPause);
  if (resetBtn) resetBtn.addEventListener('click', pufReset);

  // Speed slider
  var speedSl = document.getElementById('pufSpeed');
  if (speedSl) {
    speedSl.addEventListener('input', function() {
      var lbl = document.getElementById('pufSpeedVal');
      if (lbl) lbl.textContent = PUF_SPEED_LABEL[speedSl.value] || 'Normal';
    });
  }

  // Heatmap checkbox
  var heatCheck = document.getElementById('pufHeatmap');
  if (heatCheck) {
    heatCheck.addEventListener('change', function() {
      pufShowHeatmap = heatCheck.checked;
      var info = document.getElementById('pufHeatmapInfo');
      if (info) info.classList.toggle('visible', pufShowHeatmap);
      // Clear heat overlays if turning off
      if (!pufShowHeatmap) {
        document.querySelectorAll('.puf-cell-heat').forEach(function(el) { el.remove(); });
      }
      pufRenderGrid();
    });
  }

  // Diagonal checkbox
  var diagCheck = document.getElementById('pufDiagonal');
  if (diagCheck) {
    diagCheck.addEventListener('change', function() {
      pufDiagonal = diagCheck.checked;
    });
  }

  // Preset buttons
  document.querySelectorAll('.puf-preset-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      pufApplyPreset(btn.getAttribute('data-preset'));
    });
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'r' || e.key === 'R') { if (!e.ctrlKey) pufRun(); }
    if (e.key === 'p' || e.key === 'P') { pufPause(); }
    if (e.key === 'Escape') { pufPause(); }
    if (e.key === ' ')   { e.preventDefault(); if (pufPlaying) pufPause(); else pufStep(); }
    if (e.key === 'w' || e.key === 'W') { document.querySelector('[data-mode="wall"]').click(); }
    if (e.key === 'e' || e.key === 'E') { document.querySelector('[data-mode="erase"]').click(); }
    if (e.key === 'f' || e.key === 'F') { document.querySelector('[data-mode="fire"]').click(); }
  });

  // Resize: rerender grid
  window.addEventListener('resize', function() { pufRenderGrid(); });
}