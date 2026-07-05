// script.js handles: loading screen, navbar, dark mode, scroll top
// This file: Bellman-Ford & SPFA Visualizer only
// All globals prefixed bf_ or BF_ to avoid conflicts

document.addEventListener('DOMContentLoaded', function() {
  bfInit();
});

/* ─── Speed ─── */
var BF_SPEED = { 1: 1200, 2: 700, 3: 400, 4: 180, 5: 60 };
var BF_SPEED_LABEL = { 1: 'Slowest', 2: 'Slow', 3: 'Normal', 4: 'Fast', 5: 'Blazing' };

/* ─── Graph presets ─── */
var BF_PRESETS = {
  basic: {
    nodes: [
      { id:0, x:60,  y:140 },
      { id:1, x:180, y:60  },
      { id:2, x:180, y:220 },
      { id:3, x:300, y:60  },
      { id:4, x:300, y:220 },
      { id:5, x:420, y:140 },
    ],
    edges: [
      { u:0, v:1, w:4 },
      { u:0, v:2, w:2 },
      { u:1, v:3, w:5 },
      { u:1, v:2, w:1 },
      { u:2, v:4, w:8 },
      { u:3, v:5, w:2 },
      { u:4, v:3, w:3 },
      { u:4, v:5, w:6 },
    ],
    defaultSource: 0,
  },
  negative: {
    nodes: [
      { id:0, x:60,  y:140 },
      { id:1, x:180, y:60  },
      { id:2, x:180, y:220 },
      { id:3, x:320, y:60  },
      { id:4, x:320, y:220 },
      { id:5, x:440, y:140 },
    ],
    edges: [
      { u:0, v:1, w:6  },
      { u:0, v:2, w:7  },
      { u:1, v:3, w:5  },
      { u:1, v:4, w:8  },
      { u:1, v:2, w:-4 },
      { u:2, v:4, w:9  },
      { u:3, v:5, w:-2 },
      { u:4, v:3, w:7  },
      { u:4, v:5, w:-3 },
    ],
    defaultSource: 0,
  },
  negcycle: {
    nodes: [
      { id:0, x:80,  y:160 },
      { id:1, x:220, y:60  },
      { id:2, x:360, y:60  },
      { id:3, x:360, y:230 },
      { id:4, x:220, y:230 },
    ],
    edges: [
      { u:0, v:1, w:1  },
      { u:1, v:2, w:2  },
      { u:2, v:3, w:-6 },
      { u:3, v:4, w:1  },
      { u:4, v:1, w:2  },
      { u:0, v:4, w:5  },
    ],
    defaultSource: 0,
  },
  complex: {
    nodes: [
      { id:0, x:50,  y:180 },
      { id:1, x:150, y:80  },
      { id:2, x:150, y:280 },
      { id:3, x:270, y:130 },
      { id:4, x:270, y:230 },
      { id:5, x:390, y:80  },
      { id:6, x:390, y:280 },
      { id:7, x:480, y:180 },
    ],
    edges: [
      { u:0, v:1, w:3  },
      { u:0, v:2, w:5  },
      { u:1, v:3, w:6  },
      { u:1, v:2, w:-2 },
      { u:2, v:4, w:4  },
      { u:3, v:5, w:2  },
      { u:3, v:4, w:-1 },
      { u:4, v:6, w:3  },
      { u:5, v:7, w:1  },
      { u:6, v:5, w:-3 },
      { u:6, v:7, w:5  },
    ],
    defaultSource: 0,
  },
};

/* ─── State ─── */
var bfState = {
  algo    : 'bf',
  preset  : 'basic',
  graph   : null,
  source  : 0,
  steps   : [],
  stepIdx : 0,
  playing : false,
  timer   : null,
};

/* ─── Step generators ─── */

/* Bellman-Ford */
function bfGenBFSteps(graph, src) {
  var nodes = graph.nodes;
  var edges = graph.edges;
  var V     = nodes.length;
  var INF   = Infinity;
  var dist  = {};
  var prev  = {};
  var steps = [];

  nodes.forEach(function(n) { dist[n.id] = INF; prev[n.id] = -1; });
  dist[src] = 0;

  steps.push({
    type: 'init', dist: bfCloneDist(dist), prev: bfCloneDist(prev),
    active: -1, relaxingEdge: null, pass: 0,
    msg: 'Initialize: dist[' + src + '] = 0, all others = ∞'
  });

  for (var pass = 1; pass <= V - 1; pass++) {
    var anyUpdate = false;

    steps.push({
      type: 'pass-start', dist: bfCloneDist(dist), prev: bfCloneDist(prev),
      active: -1, relaxingEdge: null, pass: pass,
      msg: 'Pass ' + pass + ' of ' + (V-1) + ': relaxing all ' + edges.length + ' edges'
    });

    for (var ei = 0; ei < edges.length; ei++) {
      var e  = edges[ei];
      var nd = dist[e.u] + e.w;

      steps.push({
        type: 'relaxing', dist: bfCloneDist(dist), prev: bfCloneDist(prev),
        active: e.u, relaxingEdge: e, pass: pass,
        msg: 'Relax edge ' + e.u + '→' + e.v + ' (w=' + e.w + '): ' +
             (dist[e.u] === INF ? '∞' : dist[e.u]) + ' + ' + e.w + ' = ' +
             (dist[e.u] === INF ? '∞' : nd) +
             (dist[e.u] !== INF && nd < dist[e.v] ? ' < ' + (dist[e.v] === INF ? '∞' : dist[e.v]) + ' → update!' : ' ≥ ' + (dist[e.v] === INF ? '∞' : dist[e.v]))
      });

      if (dist[e.u] !== INF && nd < dist[e.v]) {
        dist[e.v] = nd;
        prev[e.v] = e.u;
        anyUpdate = true;
        steps.push({
          type: 'updated', dist: bfCloneDist(dist), prev: bfCloneDist(prev),
          active: e.v, relaxingEdge: e, pass: pass,
          msg: '✅ dist[' + e.v + '] updated to ' + nd + ' via node ' + e.u
        });
      }
    }

    if (!anyUpdate) {
      steps.push({
        type: 'early-stop', dist: bfCloneDist(dist), prev: bfCloneDist(prev),
        active: -1, relaxingEdge: null, pass: pass,
        msg: 'No updates in pass ' + pass + ' — early termination! Already optimal.'
      });
      break;
    }
  }

  // Negative cycle check: pass V
  var negCycleNodes = [];
  steps.push({
    type: 'neg-check-start', dist: bfCloneDist(dist), prev: bfCloneDist(prev),
    active: -1, relaxingEdge: null, pass: V,
    msg: 'Pass ' + V + ' (negative cycle check): if any distance still decreases, negative cycle exists.'
  });

  for (var ei = 0; ei < edges.length; ei++) {
    var e  = edges[ei];
    if (dist[e.u] !== INF && dist[e.u] + e.w < dist[e.v]) {
      negCycleNodes.push(e.u, e.v);
      steps.push({
        type: 'neg-cycle', dist: bfCloneDist(dist), prev: bfCloneDist(prev),
        active: e.v, relaxingEdge: e, negCycle: true,
        negCycleNodes: negCycleNodes.slice(), pass: V,
        msg: '⚠️ NEGATIVE CYCLE: dist[' + e.v + '] still decreases via edge ' + e.u + '→' + e.v + '! Cycle detected.'
      });
    }
  }

  var hasCycle = negCycleNodes.length > 0;
  steps.push({
    type: 'done', dist: bfCloneDist(dist), prev: bfCloneDist(prev),
    active: -1, relaxingEdge: null, negCycle: hasCycle,
    negCycleNodes: negCycleNodes.slice(), pass: V,
    msg: hasCycle
      ? '⚠️ Negative cycle detected. Shortest paths undefined for affected nodes.'
      : '✅ Bellman-Ford complete. All shortest paths from node ' + src + ' found.'
  });

  return steps;
}

/* SPFA */
function bfGenSPFASteps(graph, src) {
  var nodes = graph.nodes;
  var edges = graph.edges;
  var V     = nodes.length;
  var INF   = Infinity;
  var dist  = {};
  var prev  = {};
  var inQueue = {};
  var visitCount = {};
  var steps = [];

  nodes.forEach(function(n) {
    dist[n.id] = INF;
    prev[n.id] = -1;
    inQueue[n.id] = false;
    visitCount[n.id] = 0;
  });
  dist[src] = 0;

  // Build adjacency list
  var adj = {};
  nodes.forEach(function(n) { adj[n.id] = []; });
  edges.forEach(function(e) { adj[e.u].push({ to: e.v, w: e.w, edge: e }); });

  var queue = [src];
  inQueue[src] = true;
  visitCount[src]++;

  steps.push({
    type: 'init', dist: bfCloneDist(dist), prev: bfCloneDist(prev),
    queue: queue.slice(), active: src, relaxingEdge: null,
    msg: 'SPFA Initialize: dist[' + src + '] = 0. Enqueue source node ' + src + '.'
  });

  var negCycleNodes = [];
  var hasCycle = false;
  var iter = 0;

  while (queue.length > 0 && !hasCycle && iter < V * edges.length + 10) {
    iter++;
    var u = queue.shift();
    inQueue[u] = false;

    steps.push({
      type: 'dequeue', dist: bfCloneDist(dist), prev: bfCloneDist(prev),
      queue: queue.slice(), active: u, relaxingEdge: null,
      msg: 'Dequeue node ' + u + '. Relaxing its ' + (adj[u] || []).length + ' outgoing edges.'
    });

    var nbrs = adj[u] || [];
    for (var ni = 0; ni < nbrs.length; ni++) {
      var nb  = nbrs[ni];
      var nd  = dist[u] + nb.w;

      steps.push({
        type: 'relaxing', dist: bfCloneDist(dist), prev: bfCloneDist(prev),
        queue: queue.slice(), active: u, relaxingEdge: nb.edge,
        msg: 'Relax ' + u + '→' + nb.to + ' (w=' + nb.w + '): ' +
             (dist[u] === INF ? '∞' : dist[u]) + ' + ' + nb.w + ' = ' + nd +
             (nd < dist[nb.to] ? ' < ' + (dist[nb.to] === INF ? '∞' : dist[nb.to]) + ' → update!' : ' no improvement')
      });

      if (nd < dist[nb.to]) {
        dist[nb.to] = nd;
        prev[nb.to] = u;

        steps.push({
          type: 'updated', dist: bfCloneDist(dist), prev: bfCloneDist(prev),
          queue: queue.slice(), active: nb.to, relaxingEdge: nb.edge,
          msg: '✅ dist[' + nb.to + '] = ' + nd + ' via ' + u
        });

        if (!inQueue[nb.to]) {
          queue.push(nb.to);
          inQueue[nb.to] = true;
          visitCount[nb.to]++;

          steps.push({
            type: 'enqueue', dist: bfCloneDist(dist), prev: bfCloneDist(prev),
            queue: queue.slice(), active: nb.to, relaxingEdge: null,
            msg: 'Enqueue node ' + nb.to + ' (visit count: ' + visitCount[nb.to] + ')'
          });

          if (visitCount[nb.to] >= V) {
            hasCycle = true;
            negCycleNodes.push(nb.to);
            steps.push({
              type: 'neg-cycle', dist: bfCloneDist(dist), prev: bfCloneDist(prev),
              queue: queue.slice(), active: nb.to, relaxingEdge: nb.edge,
              negCycle: true, negCycleNodes: negCycleNodes.slice(),
              msg: '⚠️ Node ' + nb.to + ' enqueued ≥ V times — NEGATIVE CYCLE detected!'
            });
            break;
          }
        }
      }
    }
    if (hasCycle) break;
  }

  steps.push({
    type: 'done', dist: bfCloneDist(dist), prev: bfCloneDist(prev),
    queue: [], active: -1, relaxingEdge: null,
    negCycle: hasCycle, negCycleNodes: negCycleNodes.slice(),
    msg: hasCycle
      ? '⚠️ SPFA detected a negative cycle.'
      : '✅ SPFA complete. ' + iter + ' dequeue operations performed.'
  });

  return steps;
}

function bfCloneDist(d) {
  var c = {};
  Object.keys(d).forEach(function(k) { c[k] = d[k]; });
  return c;
}

/* ─── Canvas drawing ─── */
var BF_NODE_R = 18;

function bfDraw(step) {
  var canvas = document.getElementById('bfCanvas');
  if (!canvas || !bfState.graph) return;
  var ctx    = canvas.getContext('2d');
  var graph  = bfState.graph;
  var src    = bfState.source;
  var dist   = step.dist || {};
  var negCycleNodes = step.negCycleNodes || [];
  var relaxingEdge  = step.relaxingEdge;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw edges
  graph.edges.forEach(function(e) {
    var na = graph.nodes[e.u]; var nb = graph.nodes[e.v];
    if (!na || !nb) return;

    var isRelaxing = relaxingEdge && relaxingEdge.u === e.u && relaxingEdge.v === e.v;
    var isNeg      = e.w < 0;

    ctx.strokeStyle = isRelaxing ? '#f59e0b' : isNeg ? '#ef4444' : 'rgba(100,116,139,0.35)';
    ctx.lineWidth   = isRelaxing ? 3 : isNeg ? 2 : 1.5;
    if (isNeg && !isRelaxing) { ctx.setLineDash([5, 3]); }

    // Draw directed arrow
    var dx = nb.x - na.x; var dy = nb.y - na.y;
    var len = Math.sqrt(dx*dx + dy*dy);
    var ux = dx/len; var uy = dy/len;

    var startX = na.x + ux * BF_NODE_R;
    var startY = na.y + uy * BF_NODE_R;
    var endX   = nb.x - ux * BF_NODE_R;
    var endY   = nb.y - uy * BF_NODE_R;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrow head
    var ax = endX - ux*10 - uy*5;
    var ay = endY - uy*10 + ux*5;
    var bx = endX - ux*10 + uy*5;
    var by = endY - uy*10 - ux*5;
    ctx.fillStyle = isRelaxing ? '#f59e0b' : isNeg ? '#ef4444' : 'rgba(100,116,139,0.5)';
    ctx.beginPath(); ctx.moveTo(endX, endY); ctx.lineTo(ax, ay); ctx.lineTo(bx, by); ctx.closePath(); ctx.fill();

    // Weight label
    var mx = (na.x + nb.x) / 2 + uy * 12;
    var my = (na.y + nb.y) / 2 - ux * 12;
    ctx.fillStyle = isRelaxing ? '#f59e0b' : isNeg ? '#ef4444' : 'rgba(148,163,184,0.7)';
    ctx.font = 'bold 10px Fira Code,monospace';
    ctx.textAlign = 'center';
    ctx.fillText(e.w, mx, my);
  });

  // Draw nodes
  graph.nodes.forEach(function(node) {
    var isSrc      = node.id === src;
    var isActive   = step.active === node.id;
    var isNegCycle = negCycleNodes.indexOf(node.id) !== -1;
    var d          = dist[node.id];
    var hasFinite  = d !== undefined && d !== Infinity;

    var fillColor   = 'rgba(255,255,255,0.04)';
    var strokeColor = 'rgba(100,116,139,0.4)';
    var textColor   = 'rgba(148,163,184,0.8)';
    var lineWidth   = 1.5;

    if (isNegCycle)    { fillColor = 'rgba(239,68,68,0.3)'; strokeColor = '#ef4444'; textColor = '#fca5a5'; lineWidth = 3; }
    else if (isActive) { fillColor = 'rgba(245,158,11,0.3)'; strokeColor = '#f59e0b'; textColor = '#fde68a'; lineWidth = 2.5; }
    else if (isSrc)    { fillColor = 'rgba(249,115,22,0.3)'; strokeColor = '#f97316'; textColor = '#fed7aa'; lineWidth = 3; }
    else if (hasFinite){ fillColor = 'rgba(6,182,212,0.2)';  strokeColor = '#06b6d4'; textColor = '#a5f3fc'; lineWidth = 2; }

    ctx.beginPath();
    ctx.arc(node.x, node.y, BF_NODE_R, 0, Math.PI * 2);
    ctx.fillStyle   = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth   = lineWidth;
    ctx.stroke();

    // Node ID
    ctx.fillStyle    = textColor;
    ctx.font         = 'bold 11px Fira Code,monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.id, node.x, node.y);

    // Distance label below node
    var dLabel = d === Infinity || d === undefined ? '∞' : d;
    ctx.fillStyle    = isNegCycle ? '#ef4444' : hasFinite ? '#06b6d4' : 'rgba(148,163,184,0.5)';
    ctx.font         = '9px Fira Code,monospace';
    ctx.textBaseline = 'top';
    ctx.fillText('d=' + dLabel, node.x, node.y + BF_NODE_R + 3);
  });
}

/* ─── Update distance table ─── */
function bfUpdateDistTable(step) {
  var tbody = document.getElementById('bfDistBody');
  if (!tbody || !bfState.graph) return;
  var dist  = step.dist || {};
  var prev  = step.prev || {};
  var negCycleNodes = step.negCycleNodes || [];
  var src   = bfState.source;

  tbody.innerHTML = bfState.graph.nodes.map(function(node) {
    var d       = dist[node.id];
    var dStr    = d === Infinity || d === undefined ? '∞' : d;
    var p       = prev[node.id];
    var pStr    = p === -1 || p === undefined ? '—' : p;
    var isActive   = step.active === node.id;
    var isNeg      = negCycleNodes.indexOf(node.id) !== -1;
    var isSrc      = node.id === src;
    var isUpdated  = step.type === 'updated' && step.active === node.id;
    var rowCls = isNeg ? 'bf-row-negcycle' : isUpdated ? 'bf-row-updated' : isActive && step.type === 'relaxing' ? 'bf-row-relaxing' : isSrc ? 'bf-row-source' : '';
    return '<tr class="' + rowCls + '">' +
      '<td>' + node.id + (isSrc ? ' (S)' : '') + '</td>' +
      '<td>' + dStr + '</td>' +
      '<td>' + pStr + '</td>' +
    '</tr>';
  }).join('');
}

/* ─── Update SPFA queue ─── */
function bfUpdateQueue(step) {
  var queueWrap = document.getElementById('bfQueueWrap');
  var queueRow  = document.getElementById('bfQueueRow');
  if (!queueWrap || !queueRow) return;

  if (bfState.algo === 'spfa') {
    queueWrap.classList.remove('hidden');
    var queue = step.queue || [];
    queueRow.innerHTML = queue.map(function(id) {
      return '<div class="bf-queue-node">' + id + '</div>';
    }).join('');
    if (queue.length === 0) queueRow.innerHTML = '<span style="font-size:0.7rem;color:var(--text-secondary);padding:0.2rem">empty</span>';
  } else {
    queueWrap.classList.add('hidden');
  }
}

/* ─── Update pass label ─── */
function bfUpdatePassLabel(step) {
  var el = document.getElementById('bfPassLabel');
  if (!el) return;
  if (bfState.algo === 'bf') {
    if (step.pass) el.textContent = 'Pass: ' + step.pass + (step.pass === bfState.graph.nodes.length ? ' (neg cycle check)' : '');
    else el.textContent = 'Pass: —';
  } else {
    el.textContent = 'Queue-based (no fixed passes)';
  }
}

/* ─── Add to relaxation log ─── */
function bfAddRelaxLog(step) {
  var log = document.getElementById('bfRelaxLog');
  if (!log) return;
  var empty = log.querySelector('.bf-relax-empty');
  if (empty) empty.remove();

  var cls = 'bf-relax-entry ';
  if (step.type === 'pass-start')  cls += 'pass';
  else if (step.type === 'updated') cls += 'updated';
  else if (step.type === 'relaxing' || step.type === 'relax') cls += 'relaxing';
  else if (step.type === 'neg-cycle') cls += 'negcycle';
  else return; // don't log init/done/early-stop here

  var entry = document.createElement('div');
  entry.className = cls;
  entry.textContent = step.msg;
  log.insertBefore(entry, log.firstChild);

  // Keep max 40 entries
  while (log.children.length > 40) log.removeChild(log.lastChild);
}

/* ─── Apply step ─── */
function bfApplyStep(step) {
  // Status
  var statusEl = document.getElementById('bfStatus');
  if (statusEl && step.msg) {
    statusEl.textContent = step.msg;
    var cls = 'bf-status ';
    if (step.type === 'updated')                 cls += 'updated';
    else if (step.type === 'relaxing')           cls += 'relax';
    else if (step.type === 'neg-cycle')          cls += 'negcycle';
    else if (step.type === 'done' && !step.negCycle) cls += 'done';
    else if (step.type === 'pass-start')         cls += 'pass';
    statusEl.className = cls.trim();
  }

  // Negative cycle banner
  var banner = document.getElementById('bfNegCycleBanner');
  if (banner) {
    banner.classList.toggle('hidden', !step.negCycle);
  }

  bfDraw(step);
  bfUpdateDistTable(step);
  bfUpdateQueue(step);
  bfUpdatePassLabel(step);
  bfAddRelaxLog(step);
  bfUpdateStepCounter();
}

/* ─── Playback ─── */
function bfGetDelay() {
  var el = document.getElementById('bfSpeed');
  return BF_SPEED[el ? el.value : 3] || 400;
}

function bfPlay() {
  if (bfState.playing) return;
  if (bfState.stepIdx >= bfState.steps.length) bfState.stepIdx = 0;
  bfState.playing = true;
  bfUpdatePBBtns();
  bfPlayNext();
}

function bfPlayNext() {
  if (!bfState.playing) return;
  if (bfState.stepIdx >= bfState.steps.length) {
    bfState.playing = false;
    bfUpdatePBBtns();
    return;
  }
  bfApplyStep(bfState.steps[bfState.stepIdx]);
  bfState.stepIdx++;
  bfState.timer = setTimeout(bfPlayNext, bfGetDelay());
}

function bfPause() {
  bfState.playing = false;
  if (bfState.timer) { clearTimeout(bfState.timer); bfState.timer = null; }
  bfUpdatePBBtns();
}

function bfStep() {
  if (bfState.playing) bfPause();
  if (bfState.stepIdx >= bfState.steps.length) return;
  bfApplyStep(bfState.steps[bfState.stepIdx]);
  bfState.stepIdx++;
  bfUpdatePBBtns();
}

function bfUpdatePBBtns() {
  var stepBtn  = document.getElementById('bfStepBtn');
  var pauseBtn = document.getElementById('bfPauseBtn');
  var has = bfState.steps.length > 0;
  if (stepBtn)  stepBtn.disabled  = !has || bfState.stepIdx >= bfState.steps.length;
  if (pauseBtn) pauseBtn.disabled = !bfState.playing;
}

function bfUpdateStepCounter() {
  var n = document.getElementById('bfStepNum');
  var t = document.getElementById('bfStepTotal');
  if (n) n.textContent = bfState.stepIdx;
  if (t) t.textContent = bfState.steps.length;
}

/* ─── Run ─── */
function bfRun() {
  bfPause();

  var srcEl = document.getElementById('bfSource');
  var src   = parseInt(srcEl ? srcEl.value : 0);
  var graph = BF_PRESETS[bfState.preset];
  var maxId = graph.nodes.length - 1;

  if (isNaN(src) || src < 0 || src > maxId) src = 0;

  bfState.source  = src;
  bfState.graph   = { nodes: graph.nodes.slice(), edges: graph.edges.slice() };
  bfState.stepIdx = 0;
  bfState.playing = false;

  // Scale node positions to canvas
  var canvas = document.getElementById('bfCanvas');
  var wrap   = canvas && canvas.parentElement;
  if (canvas && wrap) {
    canvas.width  = wrap.clientWidth;
    canvas.height = Math.min(320, Math.max(240, Math.floor(canvas.width * 0.55)));
  }

  var cw = canvas ? canvas.width  : 500;
  var ch = canvas ? canvas.height : 280;
  var minX = Infinity, maxX = 0, minY = Infinity, maxY = 0;
  bfState.graph.nodes.forEach(function(n) {
    if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y;
  });
  var scaleX = (cw - 80) / Math.max(maxX - minX, 1);
  var scaleY = (ch - 80) / Math.max(maxY - minY, 1);
  var scale  = Math.min(scaleX, scaleY);
  bfState.graph.nodes = bfState.graph.nodes.map(function(n) {
    return { id: n.id, x: Math.round(40 + (n.x - minX) * scale), y: Math.round(40 + (n.y - minY) * scale) };
  });

  // Generate steps
  if (bfState.algo === 'bf') {
    bfState.steps = bfGenBFSteps(bfState.graph, src);
  } else {
    bfState.steps = bfGenSPFASteps(bfState.graph, src);
  }

  // Clear log
  var log = document.getElementById('bfRelaxLog');
  if (log) log.innerHTML = '<div class="bf-relax-empty">No relaxations yet.</div>';

  // Hide neg cycle banner
  var banner = document.getElementById('bfNegCycleBanner');
  if (banner) banner.classList.add('hidden');

  bfUpdateStepCounter();
  bfUpdatePBBtns();

  var statusEl = document.getElementById('bfStatus');
  if (statusEl) { statusEl.textContent = 'Ready. Press Step or watch auto-play.'; statusEl.className = 'bf-status'; }

  bfPlay();
}

/* ─── Reset ─── */
function bfReset() {
  bfPause();
  bfState.steps   = [];
  bfState.stepIdx = 0;
  bfState.graph   = null;

  var canvas = document.getElementById('bfCanvas');
  if (canvas) { var ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); }

  var log = document.getElementById('bfRelaxLog');
  if (log) log.innerHTML = '<div class="bf-relax-empty">No relaxations yet.</div>';

  var tbody = document.getElementById('bfDistBody');
  if (tbody) tbody.innerHTML = '';

  var banner = document.getElementById('bfNegCycleBanner');
  if (banner) banner.classList.add('hidden');

  var passEl = document.getElementById('bfPassLabel');
  if (passEl) passEl.textContent = 'Pass: —';

  var queueWrap = document.getElementById('bfQueueWrap');
  if (queueWrap) queueWrap.classList.add('hidden');

  bfUpdateStepCounter();
  bfUpdatePBBtns();

  var statusEl = document.getElementById('bfStatus');
  if (statusEl) { statusEl.textContent = 'Select a preset and click Run to begin.'; statusEl.className = 'bf-status'; }
}

/* ─── Init ─── */
function bfInit() {
  // Algorithm buttons
  document.querySelectorAll('.bf-algo-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.bf-algo-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      bfState.algo = btn.getAttribute('data-algo');
      bfReset();
    });
  });

  // Preset buttons
  document.querySelectorAll('.bf-preset-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.bf-preset-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      bfState.preset = btn.getAttribute('data-preset');
      var p = BF_PRESETS[bfState.preset];
      var srcEl = document.getElementById('bfSource');
      if (srcEl) srcEl.value = p.defaultSource;
      bfReset();
    });
  });

  // Playback
  var runBtn   = document.getElementById('bfRunBtn');
  var stepBtn  = document.getElementById('bfStepBtn');
  var pauseBtn = document.getElementById('bfPauseBtn');
  var resetBtn = document.getElementById('bfResetBtn');
  var speedSl  = document.getElementById('bfSpeed');

  if (runBtn)   runBtn.addEventListener('click',   bfRun);
  if (stepBtn)  stepBtn.addEventListener('click',  bfStep);
  if (pauseBtn) pauseBtn.addEventListener('click', bfPause);
  if (resetBtn) resetBtn.addEventListener('click', bfReset);

  if (speedSl) {
    speedSl.addEventListener('input', function() {
      var lbl = document.getElementById('bfSpeedVal');
      if (lbl) lbl.textContent = BF_SPEED_LABEL[speedSl.value] || 'Normal';
      if (bfState.playing) { bfPause(); bfPlay(); }
    });
  }

  window.addEventListener('resize', function() {
    if (!bfState.graph || bfState.steps.length === 0) return;
    var canvas = document.getElementById('bfCanvas');
    var wrap   = canvas && canvas.parentElement;
    if (canvas && wrap) {
      canvas.width  = wrap.clientWidth;
      canvas.height = Math.min(320, Math.max(240, Math.floor(canvas.width * 0.55)));
    }
    if (bfState.stepIdx > 0) bfApplyStep(bfState.steps[bfState.stepIdx - 1]);
  });
}