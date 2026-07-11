// script.js handles: loading screen, navbar, dark mode, scroll top
// This file: Floyd-Warshall Visualizer only
// All globals prefixed fw_ or FW_ to avoid conflicts

document.addEventListener('DOMContentLoaded', function () {
  fwInit();
});

/* ─── Speed ─── */
let FW_SPEED = { 1: 1200, 2: 700, 3: 400, 4: 180, 5: 60 };
let FW_SPEED_LABEL = { 1: 'Slowest', 2: 'Slow', 3: 'Normal', 4: 'Fast', 5: 'Blazing' };

/* ─── Graph presets ─── */
let FW_PRESETS = {
  basic: {
    nodes: [
      { id: 0, x: 80, y: 140 },
      { id: 1, x: 200, y: 60 },
      { id: 2, x: 320, y: 140 },
      { id: 3, x: 200, y: 220 },
    ],
    edges: [
      { u: 0, v: 1, w: 3 },
      { u: 0, v: 3, w: 7 },
      { u: 1, v: 0, w: 8 },
      { u: 1, v: 2, w: 2 },
      { u: 2, v: 0, w: 5 },
      { u: 2, v: 3, w: 1 },
      { u: 3, v: 0, w: 2 },
    ],
  },
  negative: {
    nodes: [
      { id: 0, x: 100, y: 140 },
      { id: 1, x: 250, y: 60 },
      { id: 2, x: 400, y: 140 },
      { id: 3, x: 250, y: 220 },
    ],
    edges: [
      { u: 0, v: 1, w: 5 },
      { u: 1, v: 2, w: 3 },
      { u: 2, v: 3, w: 1 },
      { u: 3, v: 0, w: 2 },
      { u: 0, v: 2, w: 9 },
      { u: 3, v: 1, w: -4 },
    ],
  },
  negcycle: {
    nodes: [
      { id: 0, x: 100, y: 140 },
      { id: 1, x: 250, y: 60 },
      { id: 2, x: 400, y: 140 },
      { id: 3, x: 250, y: 220 },
    ],
    edges: [
      { u: 0, v: 1, w: 1 },
      { u: 1, v: 2, w: 2 },
      { u: 2, v: 3, w: -6 },
      { u: 3, v: 1, w: 2 },
      { u: 0, v: 3, w: 4 },
    ],
  },
  complex: {
    nodes: [
      { id: 0, x: 50, y: 140 },
      { id: 1, x: 150, y: 60 },
      { id: 2, x: 250, y: 220 },
      { id: 3, x: 350, y: 60 },
      { id: 4, x: 450, y: 140 },
    ],
    edges: [
      { u: 0, v: 1, w: 2 },
      { u: 0, v: 2, w: 6 },
      { u: 1, v: 3, w: 1 },
      { u: 2, v: 1, w: -2 },
      { u: 3, v: 2, w: 3 },
      { u: 3, v: 4, w: 4 },
      { u: 4, v: 0, w: 7 },
      { u: 4, v: 2, w: -1 },
    ],
  },
};

/* ─── State ─── */
let fwState = {
  preset: 'basic',
  graph: null,
  steps: [],
  stepIdx: 0,
  playing: false,
  timer: null,
};

/* ─── Step generator ─── */
function fwGenSteps(graph) {
  let nodes = graph.nodes;
  let edges = graph.edges;
  let V = nodes.length;
  let INF = Infinity;
  let dist = [];
  let steps = [];

  // Init dist matrix
  for (let i = 0; i < V; i++) {
    dist[i] = [];
    for (let j = 0; j < V; j++) {
      dist[i][j] = i === j ? 0 : INF;
    }
  }

  edges.forEach(function (e) {
    dist[e.u][e.v] = e.w;
  });

  steps.push({
    type: 'init',
    dist: fwCloneDist(dist),
    k: -1,
    i: -1,
    j: -1,
    passStr: 'Initial state',
    msg: 'Initialize distance matrix with edge weights. Diagonals are 0.',
  });

  for (let k = 0; k < V; k++) {
    steps.push({
      type: 'k-start',
      dist: fwCloneDist(dist),
      k: k,
      i: -1,
      j: -1,
      passStr: 'k = ' + k,
      msg: 'Phase k=' + k + ': Considering node ' + k + ' as an intermediate vertex.',
    });

    for (let i = 0; i < V; i++) {
      for (let j = 0; j < V; j++) {
        if (dist[i][k] !== INF && dist[k][j] !== INF) {
          let nd = dist[i][k] + dist[k][j];

          steps.push({
            type: 'relaxing',
            dist: fwCloneDist(dist),
            k: k,
            i: i,
            j: j,
            passStr: 'k = ' + k,
            msg:
              'Checking path ' +
              i +
              '→' +
              k +
              '→' +
              j +
              ': min(' +
              (dist[i][j] === INF ? '∞' : dist[i][j]) +
              ', ' +
              dist[i][k] +
              ' + ' +
              dist[k][j] +
              ' = ' +
              nd +
              ')',
          });

          if (nd < dist[i][j]) {
            dist[i][j] = nd;
            steps.push({
              type: 'updated',
              dist: fwCloneDist(dist),
              k: k,
              i: i,
              j: j,
              passStr: 'k = ' + k,
              msg: '✅ dist[' + i + '][' + j + '] updated to ' + nd + ' via ' + k,
            });
          }
        }
      }
    }
  }

  // Check negative cycle
  let negCycleNodes = [];
  let hasNegCycle = false;
  for (let i = 0; i < V; i++) {
    if (dist[i][i] < 0) {
      hasNegCycle = true;
      negCycleNodes.push(i);
    }
  }

  if (hasNegCycle) {
    steps.push({
      type: 'neg-cycle',
      dist: fwCloneDist(dist),
      k: -1,
      i: -1,
      j: -1,
      passStr: 'Done',
      negCycle: true,
      negCycleNodes: negCycleNodes.slice(),
      msg: '⚠️ Negative cycle detected! Diagonal element dist[i][i] < 0.',
    });
  }

  steps.push({
    type: 'done',
    dist: fwCloneDist(dist),
    k: -1,
    i: -1,
    j: -1,
    passStr: 'Done',
    negCycle: hasNegCycle,
    negCycleNodes: negCycleNodes.slice(),
    msg: hasNegCycle
      ? '⚠️ Finished, but negative cycles exist.'
      : '✅ Floyd-Warshall complete. All pairs shortest paths found.',
  });

  return steps;
}

function fwCloneDist(d) {
  let c = [];
  for (let i = 0; i < d.length; i++) {
    c[i] = d[i].slice();
  }
  return c;
}

/* ─── Canvas drawing ─── */
let FW_NODE_R = 18;

function fwDraw(step) {
  let canvas = document.getElementById('fwCanvas');
  if (!canvas || !fwState.graph) return;
  let ctx = canvas.getContext('2d');
  let graph = fwState.graph;
  let negCycleNodes = step.negCycleNodes || [];

  let k = step.k;
  let i = step.i;
  let j = step.j;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw edges
  graph.edges.forEach(function (e) {
    let na = graph.nodes[e.u];
    let nb = graph.nodes[e.v];
    if (!na || !nb) return;

    let isPath1 = e.u === i && e.v === k;
    let isPath2 = e.u === k && e.v === j;
    let isDirect = e.u === i && e.v === j;
    let isNeg = e.w < 0;

    let strokeColor = 'rgba(100,116,139,0.35)';
    let lineWidth = 1.5;

    if (isPath1 || isPath2) {
      strokeColor = '#a855f7'; // purple for path through k
      lineWidth = 2.5;
    } else if (isDirect) {
      strokeColor = '#3b82f6'; // blue for direct path
      lineWidth = 2.5;
    } else if (isNeg) {
      strokeColor = '#ef4444';
      lineWidth = 2;
    }

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    if (isNeg && !isPath1 && !isPath2 && !isDirect) {
      ctx.setLineDash([5, 3]);
    }

    // Draw directed arrow
    let dx = nb.x - na.x;
    let dy = nb.y - na.y;
    let len = Math.sqrt(dx * dx + dy * dy);
    let ux = dx / len;
    let uy = dy / len;

    // Curved edges for reciprocal connections
    let hasReverse = graph.edges.some(function (re) {
      return re.u === e.v && re.v === e.u;
    });
    let curveOffset = hasReverse ? 15 : 0;

    let startX = na.x + ux * FW_NODE_R - uy * curveOffset;
    let startY = na.y + uy * FW_NODE_R + ux * curveOffset;
    let endX = nb.x - ux * FW_NODE_R - uy * curveOffset;
    let endY = nb.y - uy * FW_NODE_R + ux * curveOffset;

    let cx = (startX + endX) / 2 - uy * curveOffset * 1.5;
    let cy = (startY + endY) / 2 + ux * curveOffset * 1.5;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    if (hasReverse) {
      ctx.quadraticCurveTo(cx, cy, endX, endY);
    } else {
      ctx.lineTo(endX, endY);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrow head
    let arrowAngle = hasReverse ? Math.atan2(endY - cy, endX - cx) : Math.atan2(dy, dx);
    let ax = endX - Math.cos(arrowAngle - Math.PI / 6) * 10;
    let ay = endY - Math.sin(arrowAngle - Math.PI / 6) * 10;
    let bx = endX - Math.cos(arrowAngle + Math.PI / 6) * 10;
    let by = endY - Math.sin(arrowAngle + Math.PI / 6) * 10;

    ctx.fillStyle = strokeColor;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.closePath();
    ctx.fill();

    // Weight label
    let mx = hasReverse ? cx + uy * 5 : (na.x + nb.x) / 2 + uy * 12;
    let my = hasReverse ? cy - ux * 5 : (na.y + nb.y) / 2 - ux * 12;
    ctx.fillStyle =
      isPath1 || isPath2
        ? '#a855f7'
        : isDirect
          ? '#3b82f6'
          : isNeg
            ? '#ef4444'
            : 'rgba(148,163,184,0.7)';
    ctx.font = 'bold 10px Fira Code,monospace';
    ctx.textAlign = 'center';
    ctx.fillText(e.w, mx, my);
  });

  // Draw nodes
  graph.nodes.forEach(function (node) {
    let isK = node.id === k;
    let isI = node.id === i;
    let isJ = node.id === j;
    let isNegCycle = negCycleNodes.indexOf(node.id) !== -1;

    let fillColor = 'rgba(255,255,255,0.04)';
    let strokeColor = 'rgba(100,116,139,0.4)';
    let textColor = 'rgba(148,163,184,0.8)';
    let lineWidth = 1.5;

    if (isNegCycle) {
      fillColor = 'rgba(239,68,68,0.3)';
      strokeColor = '#ef4444';
      textColor = '#fca5a5';
      lineWidth = 3;
    } else if (isI) {
      fillColor = 'rgba(59,130,246,0.3)';
      strokeColor = '#3b82f6';
      textColor = '#93c5fd';
      lineWidth = 3;
    } else if (isJ) {
      fillColor = 'rgba(236,72,153,0.3)';
      strokeColor = '#ec4899';
      textColor = '#f9a8d4';
      lineWidth = 3;
    } else if (isK) {
      fillColor = 'rgba(168,85,247,0.3)';
      strokeColor = '#a855f7';
      textColor = '#d8b4fe';
      lineWidth = 3;
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, FW_NODE_R, 0, Math.PI * 2);
    ctx.fillStyle = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();

    // Node ID
    ctx.fillStyle = textColor;
    ctx.font = 'bold 11px Fira Code,monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.id, node.x, node.y);
  });
}

/* ─── Update matrix ─── */
function fwUpdateMatrixTable(step) {
  let wrap = document.getElementById('fwMatrixWrap');
  if (!wrap || !fwState.graph) return;
  let dist = step.dist || [];
  let V = fwState.graph.nodes.length;
  let negCycleNodes = step.negCycleNodes || [];

  let html = '<table class="fw-matrix-table">';

  // Header row
  html += '<tr><th></th>';
  for (let c = 0; c < V; c++) {
    html += '<th>' + c + '</th>';
  }
  html += '</tr>';

  // Rows
  for (let r = 0; r < V; r++) {
    html += '<tr><th>' + r + '</th>';
    for (let c = 0; c < V; c++) {
      let d = dist[r][c];
      let dStr = d === Infinity ? '∞' : d;
      let cellCls = '';

      if (negCycleNodes.indexOf(r) !== -1 && r === c) {
        cellCls = 'fw-cell-negcycle';
      } else if (step.type === 'updated' && step.i === r && step.j === c) {
        cellCls = 'fw-cell-updated';
      } else if (step.type === 'relaxing' && step.i === r && step.j === c) {
        cellCls = 'fw-cell-relax';
      } else if (step.i === r && step.k === c) {
        cellCls = 'fw-cell-i'; // actually it's i->k path, but we mark it to show it's used
      } else if (step.k === r && step.j === c) {
        cellCls = 'fw-cell-j'; // k->j path
      } else if (step.k === r || step.k === c) {
        cellCls = 'fw-cell-k';
      }

      html += '<td class="' + cellCls + '">' + dStr + '</td>';
    }
    html += '</tr>';
  }
  html += '</table>';
  wrap.innerHTML = html;
}

/* ─── Update pass label ─── */
function fwUpdatePassLabel(step) {
  let el = document.getElementById('fwPassLabel');
  if (!el) return;
  el.textContent = 'Phase: ' + (step.passStr || '—');
}

/* ─── Add to relaxation log ─── */
function fwAddRelaxLog(step) {
  let log = document.getElementById('fwRelaxLog');
  if (!log) return;
  let empty = log.querySelector('.fw-relax-empty');
  if (empty) empty.remove();

  let cls = 'fw-relax-entry ';
  if (step.type === 'k-start') cls += 'pass';
  else if (step.type === 'updated') cls += 'updated';
  else if (step.type === 'relaxing') cls += 'relaxing';
  else if (step.type === 'neg-cycle') cls += 'negcycle';
  else return;

  let entry = document.createElement('div');
  entry.className = cls;
  entry.textContent = step.msg;
  log.insertBefore(entry, log.firstChild);

  // Keep max 40 entries
  while (log.children.length > 40) log.removeChild(log.lastChild);
}

/* ─── Apply step ─── */
function fwApplyStep(step) {
  // Status
  let statusEl = document.getElementById('fwStatus');
  if (statusEl && step.msg) {
    statusEl.textContent = step.msg;
    let cls = 'fw-status ';
    if (step.type === 'updated') cls += 'updated';
    else if (step.type === 'relaxing') cls += 'relax';
    else if (step.type === 'neg-cycle') cls += 'negcycle';
    else if (step.type === 'done' && !step.negCycle) cls += 'done';
    else if (step.type === 'k-start') cls += 'k-start';
    statusEl.className = cls.trim();
  }

  // Negative cycle banner
  let banner = document.getElementById('fwNegCycleBanner');
  if (banner) {
    banner.classList.toggle('hidden', !step.negCycle);
  }

  fwDraw(step);
  fwUpdateMatrixTable(step);
  fwUpdatePassLabel(step);
  fwAddRelaxLog(step);
  fwUpdateStepCounter();
}

/* ─── Playback ─── */
function fwGetDelay() {
  let el = document.getElementById('fwSpeed');
  return FW_SPEED[el ? el.value : 3] || 400;
}

function fwPlay() {
  if (fwState.playing) return;
  if (fwState.stepIdx >= fwState.steps.length) fwState.stepIdx = 0;
  fwState.playing = true;
  fwUpdatePBBtns();
  fwPlayNext();
}

function fwPlayNext() {
  if (!fwState.playing) return;
  if (fwState.stepIdx >= fwState.steps.length) {
    fwState.playing = false;
    fwUpdatePBBtns();
    return;
  }
  fwApplyStep(fwState.steps[fwState.stepIdx]);
  fwState.stepIdx++;
  fwState.timer = setTimeout(fwPlayNext, fwGetDelay());
}

function fwPause() {
  fwState.playing = false;
  if (fwState.timer) {
    clearTimeout(fwState.timer);
    fwState.timer = null;
  }
  fwUpdatePBBtns();
}

function fwStep() {
  if (fwState.playing) fwPause();
  if (fwState.stepIdx >= fwState.steps.length) return;
  fwApplyStep(fwState.steps[fwState.stepIdx]);
  fwState.stepIdx++;
  fwUpdatePBBtns();
}

function fwUpdatePBBtns() {
  let stepBtn = document.getElementById('fwStepBtn');
  let pauseBtn = document.getElementById('fwPauseBtn');
  let has = fwState.steps.length > 0;
  if (stepBtn) stepBtn.disabled = !has || fwState.stepIdx >= fwState.steps.length;
  if (pauseBtn) pauseBtn.disabled = !fwState.playing;
}

function fwUpdateStepCounter() {
  let n = document.getElementById('fwStepNum');
  let t = document.getElementById('fwStepTotal');
  if (n) n.textContent = fwState.stepIdx;
  if (t) t.textContent = fwState.steps.length;
}

/* ─── Run ─── */
function fwRun() {
  fwPause();

  let graph = FW_PRESETS[fwState.preset];

  fwState.graph = { nodes: graph.nodes.slice(), edges: graph.edges.slice() };
  fwState.stepIdx = 0;
  fwState.playing = false;

  // Scale node positions to canvas
  let canvas = document.getElementById('fwCanvas');
  let wrap = canvas && canvas.parentElement;
  if (canvas && wrap) {
    canvas.width = wrap.clientWidth;
    canvas.height = Math.min(320, Math.max(240, Math.floor(canvas.width * 0.55)));
  }

  let cw = canvas ? canvas.width : 500;
  let ch = canvas ? canvas.height : 280;
  let minX = Infinity,
    maxX = 0,
    minY = Infinity,
    maxY = 0;
  fwState.graph.nodes.forEach(function (n) {
    if (n.x < minX) minX = n.x;
    if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.y > maxY) maxY = n.y;
  });
  let scaleX = (cw - 80) / Math.max(maxX - minX, 1);
  let scaleY = (ch - 80) / Math.max(maxY - minY, 1);
  let scale = Math.min(scaleX, scaleY);
  fwState.graph.nodes = fwState.graph.nodes.map(function (n) {
    return {
      id: n.id,
      x: Math.round(40 + (n.x - minX) * scale),
      y: Math.round(40 + (n.y - minY) * scale),
    };
  });

  // Generate steps
  fwState.steps = fwGenSteps(fwState.graph);

  // Clear log
  let log = document.getElementById('fwRelaxLog');
  if (log) log.innerHTML = '<div class="fw-relax-empty">No relaxations yet.</div>';

  // Hide neg cycle banner
  let banner = document.getElementById('fwNegCycleBanner');
  if (banner) banner.classList.add('hidden');

  fwUpdateStepCounter();
  fwUpdatePBBtns();

  let statusEl = document.getElementById('fwStatus');
  if (statusEl) {
    statusEl.textContent = 'Ready. Press Step or watch auto-play.';
    statusEl.className = 'fw-status';
  }

  fwPlay();
}

/* ─── Reset ─── */
function fwReset() {
  fwPause();
  fwState.steps = [];
  fwState.stepIdx = 0;
  fwState.graph = null;

  let canvas = document.getElementById('fwCanvas');
  if (canvas) {
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  let log = document.getElementById('fwRelaxLog');
  if (log) log.innerHTML = '<div class="fw-relax-empty">No relaxations yet.</div>';

  let wrap = document.getElementById('fwMatrixWrap');
  if (wrap) wrap.innerHTML = '';

  let banner = document.getElementById('fwNegCycleBanner');
  if (banner) banner.classList.add('hidden');

  let passEl = document.getElementById('fwPassLabel');
  if (passEl) passEl.textContent = 'Phase: —';

  fwUpdateStepCounter();
  fwUpdatePBBtns();

  let statusEl = document.getElementById('fwStatus');
  if (statusEl) {
    statusEl.textContent = 'Select a preset and click Run to begin.';
    statusEl.className = 'fw-status';
  }
}

/* ─── Init ─── */
function fwInit() {
  // Preset buttons
  document.querySelectorAll('.fw-preset-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.fw-preset-btn').forEach(function (b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');
      fwState.preset = btn.getAttribute('data-preset');
      fwReset();
    });
  });

  // Playback
  let runBtn = document.getElementById('fwRunBtn');
  let stepBtn = document.getElementById('fwStepBtn');
  let pauseBtn = document.getElementById('fwPauseBtn');
  let resetBtn = document.getElementById('fwResetBtn');
  let speedSl = document.getElementById('fwSpeed');

  if (runBtn) runBtn.addEventListener('click', fwRun);
  if (stepBtn) stepBtn.addEventListener('click', fwStep);
  if (pauseBtn) pauseBtn.addEventListener('click', fwPause);
  if (resetBtn) resetBtn.addEventListener('click', fwReset);

  if (speedSl) {
    speedSl.addEventListener('input', function () {
      let lbl = document.getElementById('fwSpeedVal');
      if (lbl) lbl.textContent = FW_SPEED_LABEL[speedSl.value] || 'Normal';
      if (fwState.playing) {
        fwPause();
        fwPlay();
      }
    });
  }

  window.addEventListener('resize', function () {
    if (!fwState.graph || fwState.steps.length === 0) return;
    let canvas = document.getElementById('fwCanvas');
    let wrap = canvas && canvas.parentElement;
    if (canvas && wrap) {
      canvas.width = wrap.clientWidth;
      canvas.height = Math.min(320, Math.max(240, Math.floor(canvas.width * 0.55)));
    }
    if (fwState.stepIdx > 0) fwApplyStep(fwState.steps[fwState.stepIdx - 1]);
  });
}
