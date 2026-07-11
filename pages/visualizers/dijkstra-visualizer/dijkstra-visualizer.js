// script.js handles: loading screen, navbar, dark mode, scroll top
// This file: Dijkstra Visualizer only

document.addEventListener('DOMContentLoaded', function () {
  djInit();
});

/* ─── Speed ─── */
let DJ_SPEED = { 1: 1500, 2: 1000, 3: 500, 4: 200, 5: 50 };
let DJ_SPEED_LABEL = { 1: 'Slowest', 2: 'Slow', 3: 'Normal', 4: 'Fast', 5: 'Blazing' };

/* ─── Graph Presets ─── */
let DJ_PRESETS = {
  basic: {
    nodes: [
      { id: 0, x: 100, y: 250 },
      { id: 1, x: 250, y: 100 },
      { id: 2, x: 250, y: 400 },
      { id: 3, x: 450, y: 250 },
      { id: 4, x: 600, y: 100 },
      { id: 5, x: 600, y: 400 },
      { id: 6, x: 750, y: 250 },
    ],
    edges: [
      { u: 0, v: 1, w: 4 },
      { u: 0, v: 2, w: 3 },
      { u: 1, v: 2, w: 1 },
      { u: 1, v: 3, w: 2 },
      { u: 1, v: 4, w: 5 },
      { u: 2, v: 3, w: 4 },
      { u: 2, v: 5, w: 6 },
      { u: 3, v: 4, w: 1 },
      { u: 3, v: 5, w: 2 },
      { u: 3, v: 6, w: 4 },
      { u: 4, v: 6, w: 2 },
      { u: 5, v: 6, w: 1 },
    ],
  },
  dense: {
    nodes: [
      { id: 0, x: 150, y: 150 },
      { id: 1, x: 400, y: 80 },
      { id: 2, x: 650, y: 150 },
      { id: 3, x: 200, y: 350 },
      { id: 4, x: 400, y: 250 },
      { id: 5, x: 600, y: 350 },
      { id: 6, x: 400, y: 450 },
    ],
    edges: [
      { u: 0, v: 1, w: 2 },
      { u: 0, v: 3, w: 6 },
      { u: 0, v: 4, w: 3 },
      { u: 1, v: 2, w: 5 },
      { u: 1, v: 4, w: 1 },
      { u: 1, v: 5, w: 8 },
      { u: 2, v: 4, w: 4 },
      { u: 2, v: 5, w: 2 },
      { u: 3, v: 4, w: 2 },
      { u: 3, v: 6, w: 3 },
      { u: 4, v: 5, w: 6 },
      { u: 4, v: 6, w: 2 },
      { u: 5, v: 6, w: 3 },
    ],
  },
  star: {
    nodes: [
      { id: 0, x: 400, y: 250 }, // Center
      { id: 1, x: 400, y: 50 },
      { id: 2, x: 600, y: 150 },
      { id: 3, x: 600, y: 350 },
      { id: 4, x: 400, y: 450 },
      { id: 5, x: 200, y: 350 },
      { id: 6, x: 200, y: 150 },
    ],
    edges: [
      { u: 0, v: 1, w: 1 },
      { u: 0, v: 2, w: 5 },
      { u: 0, v: 3, w: 2 },
      { u: 0, v: 4, w: 8 },
      { u: 0, v: 5, w: 3 },
      { u: 0, v: 6, w: 4 },
      { u: 1, v: 2, w: 6 },
      { u: 2, v: 3, w: 1 },
      { u: 3, v: 4, w: 4 },
      { u: 4, v: 5, w: 2 },
      { u: 5, v: 6, w: 5 },
      { u: 6, v: 1, w: 2 },
    ],
  },
};

/* ─── State ─── */
let djState = {
  preset: 'basic',
  nodes: [],
  edges: [],
  source: 0,
  steps: [],
  stepIdx: 0,
  playing: false,
  timer: null,
  canvasW: 800,
  canvasH: 500,
};

/* ─── Graph Drawing ─── */
function djResizeCanvas() {
  let c = document.getElementById('djCanvas');
  let wrap = document.querySelector('.dj-canvas-wrap');
  if (!c || !wrap) return;
  djState.canvasW = wrap.clientWidth;
  djState.canvasH = wrap.clientHeight;
  c.width = djState.canvasW;
  c.height = djState.canvasH;
  // Simple scaling logic
  let baseW = 800,
    baseH = 500;
  let scaleX = djState.canvasW / baseW;
  let scaleY = djState.canvasH / baseH;
  let scale = Math.min(scaleX, scaleY) * 0.9;

  let ctx = c.getContext('2d');
  ctx.clearRect(0, 0, c.width, c.height);

  return {
    ctx,
    scale,
    offsetX: (djState.canvasW - baseW * scale) / 2,
    offsetY: (djState.canvasH - baseH * scale) / 2,
  };
}

function djDrawGraph(step) {
  let { ctx, scale, offsetX, offsetY } = djResizeCanvas();
  if (!ctx) return;

  let getXY = (node) => ({
    x: offsetX + node.x * scale,
    y: offsetY + node.y * scale,
  });

  // Default state from preset if no step provided
  let settled = step ? step.settled : new Set();
  let pqNodes = step ? step.pq.map((item) => item.u) : [];
  let evaluating = step ? step.evaluating : -1;
  let relaxingEdge = step ? step.relaxingEdge : null; // {u, v}
  let pathEdges = step ? step.pathEdges : []; // [{u, v}] edges that form the shortest path tree

  // Draw Edges
  djState.edges.forEach((e) => {
    let n1 = djState.nodes.find((n) => n.id === e.u);
    let n2 = djState.nodes.find((n) => n.id === e.v);
    let p1 = getXY(n1);
    let p2 = getXY(n2);

    let isTreeEdge = pathEdges.some(
      (pe) => (pe.u === e.u && pe.v === e.v) || (pe.u === e.v && pe.v === e.u)
    );
    let isRelaxing =
      relaxingEdge &&
      ((relaxingEdge.u === e.u && relaxingEdge.v === e.v) ||
        (relaxingEdge.u === e.v && relaxingEdge.v === e.u));

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);

    if (isRelaxing) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 4 * scale;
      ctx.setLineDash([8, 4]);
    } else if (isTreeEdge) {
      ctx.strokeStyle = '#22c55e'; // Green for shortest path tree
      ctx.lineWidth = 4 * scale;
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2 * scale;
      ctx.setLineDash([]);
    }
    ctx.stroke();

    // Draw Weight
    let mx = (p1.x + p2.x) / 2;
    let my = (p1.y + p2.y) / 2;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(mx, my, 12 * scale, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = isRelaxing ? '#93c5fd' : '#94a3b8';
    ctx.font = `bold ${12 * scale}px Fira Code`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.w, mx, my);
  });
  ctx.setLineDash([]);

  // Draw Nodes
  djState.nodes.forEach((n) => {
    let p = getXY(n);
    let isSrc = n.id === djState.source;
    let isEval = n.id === evaluating;
    let isSettled = settled.has(n.id);
    let isInPQ = pqNodes.includes(n.id) && !isSettled;

    ctx.beginPath();
    ctx.arc(p.x, p.y, 20 * scale, 0, 2 * Math.PI);

    if (isSrc && !step) {
      ctx.fillStyle = '#ec4899'; // start node color before running
    } else if (isEval) {
      ctx.fillStyle = '#f59e0b'; // evaluating
    } else if (isSettled) {
      ctx.fillStyle = '#22c55e'; // settled
    } else if (isInPQ) {
      ctx.fillStyle = '#3b82f6'; // in PQ
    } else {
      ctx.fillStyle = '#334155'; // default
    }

    ctx.fill();
    ctx.lineWidth = 3 * scale;
    ctx.strokeStyle = isSrc ? '#fff' : '#0f172a';
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = `bold ${16 * scale}px Orbitron`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(n.id, p.x, p.y);
  });
}

function djLoadPreset(p) {
  let data = DJ_PRESETS[p];
  if (!data) return;
  djState.nodes = JSON.parse(JSON.stringify(data.nodes));
  djState.edges = JSON.parse(JSON.stringify(data.edges));
  djDrawGraph();
}

/* ─── Algorithm (Step Generator) ─── */
function djGenSteps() {
  let steps = [];
  let N = djState.nodes.length;
  let adj = Array.from({ length: N }, () => []);
  djState.edges.forEach((e) => {
    adj[e.u].push({ v: e.v, w: e.w });
    adj[e.v].push({ v: e.u, w: e.w }); // Undirected
  });

  let dist = Array(N).fill(Infinity);
  let parent = Array(N).fill(null);
  let settled = new Set();

  // Custom simple priority queue for generation
  let pq = []; // {u, d}

  dist[djState.source] = 0;
  pq.push({ u: djState.source, d: 0 });

  let pathEdges = []; // Collect tree edges

  steps.push({
    type: 'init',
    evaluating: -1,
    relaxingEdge: null,
    pq: [...pq],
    dist: [...dist],
    settled: new Set(settled),
    pathEdges: [...pathEdges],
    msg: `Initialize distances. Start node ${djState.source} distance is 0, others Infinity. Push start to Priority Queue.`,
  });

  while (pq.length > 0) {
    // Sort and extract min
    pq.sort((a, b) => a.d - b.d);
    let curr = pq.shift();
    let u = curr.u;

    if (settled.has(u)) continue;

    steps.push({
      type: 'evaluating',
      evaluating: u,
      relaxingEdge: null,
      pq: [...pq],
      dist: [...dist],
      settled: new Set(settled),
      pathEdges: [...pathEdges],
      msg: `Extract minimum node ${u} from PQ. Tentative distance is ${curr.d}. Node is now settled.`,
    });

    settled.add(u);
    if (parent[u] !== null) {
      pathEdges.push({ u: parent[u], v: u });
    }

    for (let edge of adj[u]) {
      let v = edge.v;
      let w = edge.w;

      if (settled.has(v)) continue;

      steps.push({
        type: 'relaxing',
        evaluating: u,
        relaxingEdge: { u: u, v: v },
        pq: [...pq],
        dist: [...dist],
        settled: new Set(settled),
        pathEdges: [...pathEdges],
        msg: `Examine edge (${u}-${v}) with weight ${w}. Current known dist to ${v} is ${dist[v] === Infinity ? '∞' : dist[v]}.`,
      });

      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        parent[v] = u;

        // Update or insert into PQ
        let existingIdx = pq.findIndex((item) => item.u === v);
        if (existingIdx !== -1) {
          pq[existingIdx].d = dist[v];
        } else {
          pq.push({ u: v, d: dist[v] });
        }
        pq.sort((a, b) => a.d - b.d); // Keep it sorted visually

        steps.push({
          type: 'updated',
          evaluating: u,
          relaxingEdge: { u: u, v: v },
          pq: [...pq],
          dist: [...dist],
          settled: new Set(settled),
          pathEdges: [...pathEdges],
          updatedNode: v,
          msg: `Relax edge! New shorter path found to ${v}: ${dist[u]} + ${w} = ${dist[v]}. Added/Updated in PQ.`,
        });
      }
    }
  }

  steps.push({
    type: 'done',
    evaluating: -1,
    relaxingEdge: null,
    pq: [],
    dist: [...dist],
    settled: new Set(settled),
    pathEdges: [...pathEdges],
    msg: `✅ Dijkstra's Algorithm Complete. Shortest paths from Node ${djState.source} found.`,
  });

  return steps;
}

/* ─── UI Updates ─── */
function djUpdateDataStructures(step) {
  // Update PQ
  let pqWrap = document.getElementById('djQueueWrap');
  if (pqWrap) {
    if (step.pq.length === 0) {
      pqWrap.innerHTML = '<div class="dj-ds-empty">Queue is empty</div>';
    } else {
      pqWrap.innerHTML = step.pq
        .map(
          (item) =>
            `<div class="dj-pq-item"><span class="pq-node">Node ${item.u}</span><span class="pq-dist">${item.d}</span></div>`
        )
        .join('');
    }
  }

  // Update Distance Array
  let distWrap = document.getElementById('djDistWrap');
  if (distWrap && step.dist) {
    distWrap.innerHTML = step.dist
      .map((d, idx) => {
        let isSettled = step.settled.has(idx);
        let isUpdated = step.updatedNode === idx;
        let cls = 'dj-dist-item';
        if (isSettled) cls += ' settled';
        if (isUpdated) cls += ' updated';
        let val = d === Infinity ? '∞' : d;
        return `<div class="${cls}"><span class="d-node">${idx}</span><span class="d-val">${val}</span></div>`;
      })
      .join('');
  }
}

function djAddLog(step) {
  let log = document.getElementById('djLogWrap');
  if (!log) return;
  let empty = log.querySelector('.dj-log-empty');
  if (empty) empty.remove();

  let cls = 'dj-log-entry ';
  if (step.type === 'evaluating') cls += 'evaluating';
  else if (step.type === 'relaxing') cls += 'relaxing';
  else if (step.type === 'updated') cls += 'updated';
  else if (step.type === 'done') cls += 'done';

  let entry = document.createElement('div');
  entry.className = cls;
  entry.textContent = step.msg;
  log.insertBefore(entry, log.firstChild);

  while (log.children.length > 50) log.removeChild(log.lastChild);
}

function djApplyStep(step) {
  // Status
  let statusEl = document.getElementById('djStatus');
  if (statusEl && step.msg) {
    statusEl.textContent = step.msg;
    let cls = 'dj-status ';
    if (step.type === 'evaluating') cls += 'evaluating';
    else if (step.type === 'relaxing') cls += 'relaxing';
    else if (step.type === 'updated') cls += 'updated';
    else if (step.type === 'done') cls += 'done';
    statusEl.className = cls.trim();
  }

  djAddLog(step);
  djUpdateDataStructures(step);
  djDrawGraph(step);
  djUpdateStepCounter();
}

/* ─── Playback ─── */
function djGetDelay() {
  let el = document.getElementById('djSpeed');
  return DJ_SPEED[el ? el.value : 3] || 500;
}

function djPlay() {
  if (djState.playing) return;
  if (djState.stepIdx >= djState.steps.length) djState.stepIdx = 0;
  djState.playing = true;
  djUpdatePBBtns();
  djPlayNext();
}

function djPlayNext() {
  if (!djState.playing) return;
  if (djState.stepIdx >= djState.steps.length) {
    djState.playing = false;
    djUpdatePBBtns();
    return;
  }

  let d = djGetDelay();
  let step = djState.steps[djState.stepIdx];

  // Optimization: Skip rendering 'relaxing' intermediate steps if blazing fast
  if (d <= 50 && step.type === 'relaxing') {
    djState.stepIdx++;
    djPlayNext();
    return;
  }

  djApplyStep(step);
  djState.stepIdx++;
  djState.timer = setTimeout(djPlayNext, d);
}

function djPause() {
  djState.playing = false;
  if (djState.timer) {
    clearTimeout(djState.timer);
    djState.timer = null;
  }
  djUpdatePBBtns();
}

function djStep() {
  if (djState.playing) djPause();
  if (djState.stepIdx >= djState.steps.length) return;

  djApplyStep(djState.steps[djState.stepIdx]);
  djState.stepIdx++;
  djUpdatePBBtns();
}

function djUpdatePBBtns() {
  let stepBtn = document.getElementById('djStepBtn');
  let pauseBtn = document.getElementById('djPauseBtn');
  let has = djState.steps.length > 0;
  if (stepBtn) stepBtn.disabled = !has || djState.stepIdx >= djState.steps.length;
  if (pauseBtn) pauseBtn.disabled = !djState.playing;
}

function djUpdateStepCounter() {
  let n = document.getElementById('djStepNum');
  let t = document.getElementById('djStepTotal');
  if (n) n.textContent = djState.stepIdx;
  if (t) t.textContent = djState.steps.length;
}

/* ─── Run ─── */
function djRun() {
  djPause();

  let srcEl = document.getElementById('djSource');
  let s = parseInt(srcEl ? srcEl.value : 0);
  if (isNaN(s) || s < 0 || s >= djState.nodes.length) {
    s = 0;
    if (srcEl) srcEl.value = 0;
  }
  djState.source = s;

  djState.stepIdx = 0;
  djState.playing = false;

  // Generate steps
  djState.steps = djGenSteps();

  // Clear logs
  let log = document.getElementById('djLogWrap');
  if (log) log.innerHTML = '<div class="dj-log-empty">Started solving...</div>';

  djUpdateStepCounter();
  djUpdatePBBtns();

  let statusEl = document.getElementById('djStatus');
  if (statusEl) {
    statusEl.textContent = 'Running Dijkstra...';
    statusEl.className = 'dj-status';
  }

  djPlay();
}

/* ─── Reset ─── */
function djReset() {
  djPause();
  djState.steps = [];
  djState.stepIdx = 0;

  djLoadPreset(djState.preset);

  let log = document.getElementById('djLogWrap');
  if (log) log.innerHTML = '<div class="dj-log-empty">Waiting to start...</div>';

  let pqWrap = document.getElementById('djQueueWrap');
  if (pqWrap) pqWrap.innerHTML = '<div class="dj-ds-empty">Empty</div>';

  let distWrap = document.getElementById('djDistWrap');
  if (distWrap) distWrap.innerHTML = '';

  djUpdateStepCounter();
  djUpdatePBBtns();

  let statusEl = document.getElementById('djStatus');
  if (statusEl) {
    statusEl.textContent = 'Select a preset and click Run.';
    statusEl.className = 'dj-status';
  }
}

/* ─── Init ─── */
function djInit() {
  djLoadPreset('basic');
  window.addEventListener('resize', () => {
    let step = djState.steps[djState.stepIdx - 1];
    djDrawGraph(step);
  });

  // Presets
  document.querySelectorAll('.dj-preset-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.dj-preset-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      djState.preset = btn.getAttribute('data-preset');

      let srcEl = document.getElementById('djSource');
      if (srcEl) {
        srcEl.max = DJ_PRESETS[djState.preset].nodes.length - 1;
        srcEl.value = 0;
      }

      djReset();
    });
  });

  // Playback
  let runBtn = document.getElementById('djRunBtn');
  let stepBtn = document.getElementById('djStepBtn');
  let pauseBtn = document.getElementById('djPauseBtn');
  let resetBtn = document.getElementById('djResetBtn');
  let speedSl = document.getElementById('djSpeed');

  if (runBtn) runBtn.addEventListener('click', djRun);
  if (stepBtn) stepBtn.addEventListener('click', djStep);
  if (pauseBtn) pauseBtn.addEventListener('click', djPause);
  if (resetBtn) resetBtn.addEventListener('click', djReset);

  if (speedSl) {
    speedSl.addEventListener('input', function () {
      let lbl = document.getElementById('djSpeedVal');
      if (lbl) lbl.textContent = DJ_SPEED_LABEL[speedSl.value] || 'Normal';
      if (djState.playing) {
        djPause();
        djPlay();
      }
    });
  }
}
