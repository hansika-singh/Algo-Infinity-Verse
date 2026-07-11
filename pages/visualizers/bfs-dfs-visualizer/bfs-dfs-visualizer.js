// script.js handles: loading screen, navbar, dark mode, scroll top
// This file: BFS vs DFS Visualizer only

document.addEventListener('DOMContentLoaded', function () {
  bdInit();
});

/* ─── Speed ─── */
let BD_SPEED = { 1: 1200, 2: 700, 3: 400, 4: 180, 5: 60 };
let BD_SPEED_LABEL = { 1: 'Slowest', 2: 'Slow', 3: 'Normal', 4: 'Fast', 5: 'Blazing' };

/* ─── Graph presets ─── */
let BD_PRESETS = {
  tree: {
    nodes: [
      { id: 0, x: 250, y: 60 },
      { id: 1, x: 130, y: 140 },
      { id: 2, x: 370, y: 140 },
      { id: 3, x: 70, y: 220 },
      { id: 4, x: 190, y: 220 },
      { id: 5, x: 310, y: 220 },
      { id: 6, x: 430, y: 220 },
    ],
    edges: [
      { u: 0, v: 1 },
      { u: 0, v: 2 },
      { u: 1, v: 3 },
      { u: 1, v: 4 },
      { u: 2, v: 5 },
      { u: 2, v: 6 },
    ],
    defaultSource: 0,
  },
  cyclic: {
    nodes: [
      { id: 0, x: 100, y: 80 },
      { id: 1, x: 250, y: 50 },
      { id: 2, x: 400, y: 80 },
      { id: 3, x: 100, y: 200 },
      { id: 4, x: 250, y: 230 },
      { id: 5, x: 400, y: 200 },
    ],
    edges: [
      { u: 0, v: 1 },
      { u: 1, v: 2 },
      { u: 0, v: 3 },
      { u: 1, v: 4 },
      { u: 2, v: 5 },
      { u: 3, v: 4 },
      { u: 4, v: 5 },
      { u: 0, v: 4 },
      { u: 2, v: 4 },
    ],
    defaultSource: 0,
  },
  maze: {
    nodes: [
      { id: 0, x: 80, y: 60 },
      { id: 1, x: 180, y: 60 },
      { id: 2, x: 280, y: 60 },
      { id: 3, x: 380, y: 60 },
      { id: 4, x: 80, y: 140 },
      { id: 5, x: 180, y: 140 },
      { id: 6, x: 280, y: 140 },
      { id: 7, x: 380, y: 140 },
      { id: 8, x: 80, y: 220 },
      { id: 9, x: 180, y: 220 },
      { id: 10, x: 280, y: 220 },
      { id: 11, x: 380, y: 220 },
    ],
    edges: [
      { u: 0, v: 1 },
      { u: 1, v: 2 },
      { u: 0, v: 4 },
      { u: 2, v: 6 },
      { u: 3, v: 7 },
      { u: 4, v: 5 },
      { u: 5, v: 6 },
      { u: 6, v: 7 },
      { u: 4, v: 8 },
      { u: 5, v: 9 },
      { u: 7, v: 11 },
      { u: 8, v: 9 },
      { u: 9, v: 10 },
      { u: 10, v: 11 },
    ],
    defaultSource: 0,
  },
};

/* ─── State ─── */
let bdState = {
  algo: 'bfs',
  preset: 'tree',
  graph: null,
  source: 0,
  steps: [],
  stepIdx: 0,
  playing: false,
  timer: null,
};

/* ─── Step generators ─── */
function buildAdjList(graph) {
  let adj = {};
  graph.nodes.forEach(function (n) {
    adj[n.id] = [];
  });
  // Add undirected edges, sort numerically for consistent traversal
  graph.edges.forEach(function (e) {
    if (adj[e.u].indexOf(e.v) === -1) adj[e.u].push(e.v);
    if (adj[e.v].indexOf(e.u) === -1) adj[e.v].push(e.u);
  });
  Object.keys(adj).forEach(function (k) {
    adj[k].sort(function (a, b) {
      return a - b;
    });
  });
  return adj;
}

/* Breadth-First Search */
function bdGenBFSSteps(graph, src) {
  let adj = buildAdjList(graph);
  let visited = {};
  let queue = [];
  let order = [];
  let steps = [];

  graph.nodes.forEach(function (n) {
    visited[n.id] = false;
  });

  queue.push(src);
  visited[src] = true;

  steps.push({
    type: 'queued',
    ds: queue.slice(),
    order: order.slice(),
    active: src,
    visited: Object.assign({}, visited),
    msg: 'Start BFS at node ' + src + '. Enqueue ' + src + ' and mark as visited.',
  });

  while (queue.length > 0) {
    let curr = queue.shift();
    order.push(curr);

    steps.push({
      type: 'visiting',
      ds: queue.slice(),
      order: order.slice(),
      active: curr,
      visited: Object.assign({}, visited),
      msg: 'Dequeue node ' + curr + '. Add to traversal order.',
    });

    let nbrs = adj[curr] || [];
    let enqueuedAny = false;
    for (let i = 0; i < nbrs.length; i++) {
      let nb = nbrs[i];
      if (!visited[nb]) {
        visited[nb] = true;
        queue.push(nb);
        enqueuedAny = true;
        steps.push({
          type: 'queued',
          ds: queue.slice(),
          order: order.slice(),
          active: nb,
          currentParent: curr,
          visited: Object.assign({}, visited),
          msg: 'Neighbor ' + nb + ' is unvisited. Enqueue ' + nb + ' and mark as visited.',
        });
      }
    }

    if (!enqueuedAny && nbrs.length > 0) {
      steps.push({
        type: 'visiting',
        ds: queue.slice(),
        order: order.slice(),
        active: curr,
        visited: Object.assign({}, visited),
        msg: 'All neighbors of ' + curr + ' are already visited.',
      });
    }
  }

  steps.push({
    type: 'done',
    ds: [],
    order: order.slice(),
    active: -1,
    visited: Object.assign({}, visited),
    msg: '✅ BFS traversal complete!',
  });

  return steps;
}

/* Depth-First Search */
function bdGenDFSSteps(graph, src) {
  let adj = buildAdjList(graph);
  let visited = {};
  let stack = [];
  let order = [];
  let steps = [];

  graph.nodes.forEach(function (n) {
    visited[n.id] = false;
  });

  stack.push(src);

  steps.push({
    type: 'queued',
    ds: stack.slice(),
    order: order.slice(),
    active: src,
    visited: Object.assign({}, visited),
    msg: 'Start DFS at node ' + src + '. Push ' + src + ' to Stack.',
  });

  while (stack.length > 0) {
    let curr = stack.pop();

    if (!visited[curr]) {
      visited[curr] = true;
      order.push(curr);

      steps.push({
        type: 'visiting',
        ds: stack.slice(),
        order: order.slice(),
        active: curr,
        visited: Object.assign({}, visited),
        msg: 'Pop node ' + curr + '. Mark as visited and add to traversal order.',
      });

      let nbrs = adj[curr] || [];
      // To visit in numerical order, we must push to stack in reverse numerical order
      let reversedNbrs = nbrs.slice().reverse();

      let pushedAny = false;
      for (let i = 0; i < reversedNbrs.length; i++) {
        let nb = reversedNbrs[i];
        if (!visited[nb]) {
          stack.push(nb);
          pushedAny = true;
          steps.push({
            type: 'queued',
            ds: stack.slice(),
            order: order.slice(),
            active: nb,
            currentParent: curr,
            visited: Object.assign({}, visited),
            msg: 'Neighbor ' + nb + ' is unvisited. Push ' + nb + ' to Stack.',
          });
        }
      }

      if (!pushedAny && nbrs.length > 0) {
        steps.push({
          type: 'visiting',
          ds: stack.slice(),
          order: order.slice(),
          active: curr,
          visited: Object.assign({}, visited),
          msg: 'All neighbors of ' + curr + ' are already visited or in Stack.',
        });
      }
    } else {
      steps.push({
        type: 'popped',
        ds: stack.slice(),
        order: order.slice(),
        active: curr,
        visited: Object.assign({}, visited),
        msg: 'Pop node ' + curr + '. Already visited, skip.',
      });
    }
  }

  steps.push({
    type: 'done',
    ds: [],
    order: order.slice(),
    active: -1,
    visited: Object.assign({}, visited),
    msg: '✅ DFS traversal complete!',
  });

  return steps;
}

/* ─── Canvas drawing ─── */
let BD_NODE_R = 18;

function bdDraw(step) {
  let canvas = document.getElementById('bdCanvas');
  if (!canvas || !bdState.graph) return;
  let ctx = canvas.getContext('2d');
  let graph = bdState.graph;
  let src = bdState.source;

  let visited = step.visited || {};
  let dsMap = {};
  (step.ds || []).forEach(function (id) {
    dsMap[id] = true;
  });

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw edges
  graph.edges.forEach(function (e) {
    let na = graph.nodes.find(function (n) {
      return n.id === e.u;
    });
    let nb = graph.nodes.find(function (n) {
      return n.id === e.v;
    });
    if (!na || !nb) return;

    let isTreeEdge = false;
    // An edge is a tree edge if it was used to discover a node. We loosely visualize this
    // if both nodes are visited or one is visited and one is active.
    if ((visited[e.u] || step.active === e.u) && (visited[e.v] || step.active === e.v)) {
      isTreeEdge = true;
    }

    ctx.strokeStyle = isTreeEdge ? '#64748b' : 'rgba(100,116,139,0.2)';
    ctx.lineWidth = isTreeEdge ? 2 : 1.5;

    ctx.beginPath();
    ctx.moveTo(na.x, na.y);
    ctx.lineTo(nb.x, nb.y);
    ctx.stroke();
  });

  // Draw nodes
  graph.nodes.forEach(function (node) {
    let isSrc = node.id === src;
    let isActive = step.active === node.id;
    let isVisited = visited[node.id];
    let isQueued = dsMap[node.id] && !isVisited; // in queue/stack but not fully visited yet (relevant mostly for DFS or BFS queue visualization)

    let fillColor = 'rgba(255,255,255,0.04)';
    let strokeColor = 'rgba(100,116,139,0.4)';
    let textColor = 'rgba(148,163,184,0.8)';
    let lineWidth = 1.5;

    if (isActive) {
      fillColor = 'rgba(6,182,212,0.3)';
      strokeColor = '#06b6d4';
      textColor = '#a5f3fc';
      lineWidth = 3;
    } else if (isVisited) {
      fillColor = 'rgba(34,197,94,0.2)';
      strokeColor = '#22c55e';
      textColor = '#86efac';
      lineWidth = 2.5;
    } else if (isQueued) {
      fillColor = 'rgba(245,158,11,0.2)';
      strokeColor = '#f59e0b';
      textColor = '#fde68a';
      lineWidth = 2;
    } else if (isSrc) {
      fillColor = 'rgba(249,115,22,0.2)';
      strokeColor = '#f97316';
      textColor = '#fed7aa';
      lineWidth = 2;
    }

    ctx.beginPath();
    ctx.arc(node.x, node.y, BD_NODE_R, 0, Math.PI * 2);
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

/* ─── State Panels ─── */
function bdUpdateStatePanels(step) {
  let dsWrap = document.getElementById('bdDsWrap');
  let orderWrap = document.getElementById('bdOrderWrap');
  if (!dsWrap || !orderWrap) return;

  // Data structure (Queue or Stack)
  let ds = step.ds || [];
  if (ds.length === 0) {
    dsWrap.innerHTML = '<div class="bd-ds-empty">Empty</div>';
  } else {
    // If Stack, maybe display it reversed or logically. We will display it as an array (left to right)
    // where the "top" of the stack is the rightmost element.
    dsWrap.innerHTML = ds
      .map(function (id) {
        let isAct =
          id === step.active && step.type === 'queued' ? ' style="animation: bdIn 0.3s ease;"' : '';
        return '<div class="bd-ds-node"' + isAct + '>' + id + '</div>';
      })
      .join('');
  }

  // Traversal order
  let order = step.order || [];
  if (order.length === 0) {
    orderWrap.innerHTML = '';
  } else {
    orderWrap.innerHTML = order
      .map(function (id) {
        let isLast = id === order[order.length - 1] && step.type === 'visiting';
        let isAct = isLast ? ' style="animation: bdIn 0.3s ease;"' : '';
        return '<div class="bd-order-node"' + isAct + '>' + id + '</div>';
      })
      .join('');
  }
}

/* ─── Add to Action log ─── */
function bdAddLog(step) {
  let log = document.getElementById('bdLogWrap');
  if (!log) return;
  let empty = log.querySelector('.bd-log-empty');
  if (empty) empty.remove();

  if (step.type === 'init') return;

  let cls = 'bd-log-entry ';
  if (step.type === 'visiting') cls += 'visiting';
  else if (step.type === 'queued') cls += 'queued';
  else if (step.type === 'popped') cls += 'popped';
  else if (step.type === 'done') cls += 'done';

  let entry = document.createElement('div');
  entry.className = cls;
  entry.textContent = step.msg;
  log.insertBefore(entry, log.firstChild);

  // Keep max 40 entries
  while (log.children.length > 40) log.removeChild(log.lastChild);
}

/* ─── Apply step ─── */
function bdApplyStep(step) {
  // Status
  let statusEl = document.getElementById('bdStatus');
  if (statusEl && step.msg) {
    statusEl.textContent = step.msg;
    let cls = 'bd-status ';
    if (step.type === 'visiting') cls += 'visiting';
    else if (step.type === 'queued') cls += 'queued';
    else if (step.type === 'popped') cls += 'popped';
    else if (step.type === 'done') cls += 'done';
    statusEl.className = cls.trim();
  }

  bdDraw(step);
  bdUpdateStatePanels(step);
  bdAddLog(step);
  bdUpdateStepCounter();
}

/* ─── Playback ─── */
function bdGetDelay() {
  let el = document.getElementById('bdSpeed');
  return BD_SPEED[el ? el.value : 3] || 400;
}

function bdPlay() {
  if (bdState.playing) return;
  if (bdState.stepIdx >= bdState.steps.length) bdState.stepIdx = 0;
  bdState.playing = true;
  bdUpdatePBBtns();
  bdPlayNext();
}

function bdPlayNext() {
  if (!bdState.playing) return;
  if (bdState.stepIdx >= bdState.steps.length) {
    bdState.playing = false;
    bdUpdatePBBtns();
    return;
  }
  bdApplyStep(bdState.steps[bdState.stepIdx]);
  bdState.stepIdx++;
  bdState.timer = setTimeout(bdPlayNext, bdGetDelay());
}

function bdPause() {
  bdState.playing = false;
  if (bdState.timer) {
    clearTimeout(bdState.timer);
    bdState.timer = null;
  }
  bdUpdatePBBtns();
}

function bdStep() {
  if (bdState.playing) bdPause();
  if (bdState.stepIdx >= bdState.steps.length) return;
  bdApplyStep(bdState.steps[bdState.stepIdx]);
  bdState.stepIdx++;
  bdUpdatePBBtns();
}

function bdUpdatePBBtns() {
  let stepBtn = document.getElementById('bdStepBtn');
  let pauseBtn = document.getElementById('bdPauseBtn');
  let has = bdState.steps.length > 0;
  if (stepBtn) stepBtn.disabled = !has || bdState.stepIdx >= bdState.steps.length;
  if (pauseBtn) pauseBtn.disabled = !bdState.playing;
}

function bdUpdateStepCounter() {
  let n = document.getElementById('bdStepNum');
  let t = document.getElementById('bdStepTotal');
  if (n) n.textContent = bdState.stepIdx;
  if (t) t.textContent = bdState.steps.length;
}

/* ─── Run ─── */
function bdRun() {
  bdPause();

  let srcEl = document.getElementById('bdSource');
  let src = parseInt(srcEl ? srcEl.value : 0);
  let graph = BD_PRESETS[bdState.preset];
  let maxId = graph.nodes.length - 1;

  if (isNaN(src) || src < 0 || src > maxId) src = 0;

  bdState.source = src;
  bdState.graph = { nodes: graph.nodes.slice(), edges: graph.edges.slice() };
  bdState.stepIdx = 0;
  bdState.playing = false;

  // Scale node positions to canvas
  let canvas = document.getElementById('bdCanvas');
  let wrap = canvas && canvas.parentElement;
  if (canvas && wrap) {
    canvas.width = wrap.clientWidth;
    canvas.height = Math.min(380, Math.max(280, Math.floor(canvas.width * 0.6)));
  }

  let cw = canvas ? canvas.width : 500;
  let ch = canvas ? canvas.height : 300;
  let minX = Infinity,
    maxX = 0,
    minY = Infinity,
    maxY = 0;
  bdState.graph.nodes.forEach(function (n) {
    if (n.x < minX) minX = n.x;
    if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.y > maxY) maxY = n.y;
  });
  let scaleX = (cw - 80) / Math.max(maxX - minX, 1);
  let scaleY = (ch - 80) / Math.max(maxY - minY, 1);
  let scale = Math.min(scaleX, scaleY);
  bdState.graph.nodes = bdState.graph.nodes.map(function (n) {
    return {
      id: n.id,
      x: Math.round(40 + (n.x - minX) * scale),
      y: Math.round(40 + (n.y - minY) * scale),
    };
  });

  // Generate steps
  if (bdState.algo === 'bfs') {
    bdState.steps = bdGenBFSSteps(bdState.graph, src);
  } else {
    bdState.steps = bdGenDFSSteps(bdState.graph, src);
  }

  // Clear log & update title
  let log = document.getElementById('bdLogWrap');
  if (log) log.innerHTML = '<div class="bd-log-empty">Waiting to start...</div>';

  let dsTitle = document.getElementById('bdDsTitle');
  if (dsTitle)
    dsTitle.textContent =
      bdState.algo === 'bfs' ? 'Data Structure (Queue)' : 'Data Structure (Stack)';

  bdUpdateStepCounter();
  bdUpdatePBBtns();

  let statusEl = document.getElementById('bdStatus');
  if (statusEl) {
    statusEl.textContent = 'Ready. Press Step or watch auto-play.';
    statusEl.className = 'bd-status';
  }

  bdPlay();
}

/* ─── Reset ─── */
function bdReset() {
  bdPause();
  bdState.steps = [];
  bdState.stepIdx = 0;
  bdState.graph = null;

  let canvas = document.getElementById('bdCanvas');
  if (canvas) {
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  let log = document.getElementById('bdLogWrap');
  if (log) log.innerHTML = '<div class="bd-log-empty">Waiting to start...</div>';

  let dsWrap = document.getElementById('bdDsWrap');
  if (dsWrap) dsWrap.innerHTML = '<div class="bd-ds-empty">Empty</div>';

  let orderWrap = document.getElementById('bdOrderWrap');
  if (orderWrap) orderWrap.innerHTML = '';

  let dsTitle = document.getElementById('bdDsTitle');
  if (dsTitle)
    dsTitle.textContent =
      bdState.algo === 'bfs' ? 'Data Structure (Queue)' : 'Data Structure (Stack)';

  bdUpdateStepCounter();
  bdUpdatePBBtns();

  let statusEl = document.getElementById('bdStatus');
  if (statusEl) {
    statusEl.textContent = 'Select a preset and click Run to begin.';
    statusEl.className = 'bd-status';
  }
}

/* ─── Init ─── */
function bdInit() {
  // Algorithm buttons
  document.querySelectorAll('.bd-algo-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.bd-algo-btn').forEach(function (b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');
      bdState.algo = btn.getAttribute('data-algo');
      bdReset();
    });
  });

  // Preset buttons
  document.querySelectorAll('.bd-preset-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.bd-preset-btn').forEach(function (b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');
      bdState.preset = btn.getAttribute('data-preset');
      let p = BD_PRESETS[bdState.preset];
      let srcEl = document.getElementById('bdSource');
      if (srcEl) srcEl.value = p.defaultSource;
      bdReset();
    });
  });

  // Playback
  let runBtn = document.getElementById('bdRunBtn');
  let stepBtn = document.getElementById('bdStepBtn');
  let pauseBtn = document.getElementById('bdPauseBtn');
  let resetBtn = document.getElementById('bdResetBtn');
  let speedSl = document.getElementById('bdSpeed');

  if (runBtn) runBtn.addEventListener('click', bdRun);
  if (stepBtn) stepBtn.addEventListener('click', bdStep);
  if (pauseBtn) pauseBtn.addEventListener('click', bdPause);
  if (resetBtn) resetBtn.addEventListener('click', bdReset);

  if (speedSl) {
    speedSl.addEventListener('input', function () {
      let lbl = document.getElementById('bdSpeedVal');
      if (lbl) lbl.textContent = BD_SPEED_LABEL[speedSl.value] || 'Normal';
      if (bdState.playing) {
        bdPause();
        bdPlay();
      }
    });
  }

  window.addEventListener('resize', function () {
    if (!bdState.graph || bdState.steps.length === 0) return;
    let canvas = document.getElementById('bdCanvas');
    let wrap = canvas && canvas.parentElement;
    if (canvas && wrap) {
      canvas.width = wrap.clientWidth;
      canvas.height = Math.min(380, Math.max(280, Math.floor(canvas.width * 0.6)));
    }
    if (bdState.stepIdx > 0) bdApplyStep(bdState.steps[bdState.stepIdx - 1]);
  });
}
