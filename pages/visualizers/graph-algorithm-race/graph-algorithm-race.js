// script.js handles: loading screen, navbar, dark mode, scroll top
// This file: Graph Algorithm Race only
// All globals prefixed gar_ or GAR_ to avoid conflicts

document.addEventListener('DOMContentLoaded', function() {
  garInit();
});

/* ─── Speed ─── */
var GAR_SPEED = { 1: 800, 2: 450, 3: 250, 4: 100, 5: 30 };
var GAR_SPEED_LABEL = { 1: 'Slowest', 2: 'Slow', 3: 'Normal', 4: 'Fast', 5: 'Blazing' };

/* ─── Algorithm colors ─── */
var GAR_ALGO_DEF = {
  bfs:      { label: 'BFS',      color: '#22c55e', visited: 'rgba(34,197,94,0.25)',   path: 'rgba(34,197,94,0.6)',   frontier: 'rgba(34,197,94,0.5)'  },
  dfs:      { label: 'DFS',      color: '#a855f7', visited: 'rgba(168,85,247,0.25)',  path: 'rgba(168,85,247,0.6)',  frontier: 'rgba(168,85,247,0.5)' },
  dijkstra: { label: "Dijkstra", color: '#f59e0b', visited: 'rgba(245,158,11,0.25)',  path: 'rgba(245,158,11,0.6)',  frontier: 'rgba(245,158,11,0.5)' },
  astar:    { label: 'A*',       color: '#06b6d4', visited: 'rgba(6,182,212,0.25)',   path: 'rgba(6,182,212,0.6)',   frontier: 'rgba(6,182,212,0.5)'  },
};

/* ─── Graph presets ─── */
function garBuildGrid() {
  // 4x4 grid graph, nodes 0-15
  var nodes = [];
  var edges = [];
  var cols = 4;
  for (var i = 0; i < 16; i++) {
    nodes.push({ id: i, x: (i % cols) * 90 + 45, y: Math.floor(i / cols) * 80 + 40 });
  }
  for (var r = 0; r < 4; r++) {
    for (var c = 0; c < 4; c++) {
      var id = r * 4 + c;
      if (c < 3) edges.push({ u: id, v: id + 1, w: 1 });
      if (r < 3) edges.push({ u: id, v: id + 4, w: 1 });
    }
  }
  return { nodes: nodes, edges: edges, defaultSource: 0, defaultTarget: 15 };
}

function garBuildWeighted() {
  var nodes = [
    { id:0, x:40,  y:60  }, { id:1, x:140, y:30  }, { id:2, x:240, y:60  },
    { id:3, x:140, y:120 }, { id:4, x:80,  y:180 }, { id:5, x:200, y:180 },
    { id:6, x:300, y:120 }, { id:7, x:300, y:200 }, { id:8, x:160, y:230 },
  ];
  var edges = [
    { u:0, v:1, w:4 }, { u:0, v:4, w:2 }, { u:1, v:2, w:1 }, { u:1, v:3, w:5 },
    { u:2, v:6, w:3 }, { u:3, v:4, w:2 }, { u:3, v:5, w:6 }, { u:4, v:8, w:7 },
    { u:5, v:6, w:1 }, { u:5, v:8, w:3 }, { u:6, v:7, w:2 }, { u:7, v:8, w:4 },
  ];
  return { nodes: nodes, edges: edges, defaultSource: 0, defaultTarget: 7 };
}

function garBuildDense() {
  var nodes = [];
  var edges = [];
  var n = 10;
  for (var i = 0; i < n; i++) {
    var angle = (2 * Math.PI * i) / n;
    nodes.push({ id: i, x: Math.round(160 + 120 * Math.cos(angle)), y: Math.round(130 + 100 * Math.sin(angle)) });
  }
  for (var i = 0; i < n; i++) {
    for (var j = i + 1; j < n; j++) {
      if (Math.random() < 0.55) {
        var w = Math.floor(Math.random() * 9) + 1;
        edges.push({ u: i, v: j, w: w });
      }
    }
  }
  // Ensure connectivity
  for (var i = 0; i < n - 1; i++) {
    var exists = edges.some(function(e) { return (e.u === i && e.v === i+1) || (e.u === i+1 && e.v === i); });
    if (!exists) edges.push({ u: i, v: i+1, w: Math.floor(Math.random()*5)+1 });
  }
  return { nodes: nodes, edges: edges, defaultSource: 0, defaultTarget: 5 };
}

function garBuildSparse() {
  var nodes = [
    { id:0, x:40,  y:100 }, { id:1, x:120, y:40  }, { id:2, x:200, y:100 },
    { id:3, x:120, y:160 }, { id:4, x:280, y:60  }, { id:5, x:280, y:160 },
    { id:6, x:360, y:100 },
  ];
  var edges = [
    { u:0, v:1, w:3 }, { u:1, v:2, w:5 }, { u:0, v:3, w:2 },
    { u:3, v:2, w:8 }, { u:2, v:4, w:1 }, { u:2, v:5, w:6 },
    { u:4, v:6, w:4 }, { u:5, v:6, w:2 },
  ];
  return { nodes: nodes, edges: edges, defaultSource: 0, defaultTarget: 6 };
}

var GAR_PRESETS = { grid: garBuildGrid, weighted: garBuildWeighted, dense: garBuildDense, sparse: garBuildSparse };

/* ─── State ─── */
var garState = {
  preset    : 'grid',
  graph     : null,
  algos     : { bfs: true, dfs: true, dijkstra: true, astar: true },
  source    : 0,
  target    : 15,
  runners   : {},
  playing   : false,
  timer     : null,
  done      : false,
  winner    : null,
};

/* ─── Build adjacency list ─── */
function garBuildAdj(graph) {
  var adj = {};
  graph.nodes.forEach(function(n) { adj[n.id] = []; });
  graph.edges.forEach(function(e) {
    adj[e.u].push({ to: e.v, w: e.w });
    adj[e.v].push({ to: e.u, w: e.w });
  });
  return adj;
}

/* ─── A* heuristic (Euclidean) ─── */
function garHeuristic(nodes, a, b) {
  var na = nodes[a]; var nb = nodes[b];
  if (!na || !nb) return 0;
  var dx = na.x - nb.x; var dy = na.y - nb.y;
  return Math.sqrt(dx*dx + dy*dy) / 60;
}

/* ─── Algorithm runners (step-based) ─── */
function garMakeRunner(algo, graph, adj, src, tgt) {
  var def   = GAR_ALGO_DEF[algo];
  var nodes = {};
  graph.nodes.forEach(function(n) { nodes[n.id] = n; });

  var runner = {
    algo      : algo,
    label     : def.label,
    color     : def.color,
    visited   : {},
    parent    : {},
    frontier  : [],
    path      : [],
    cost      : {},
    nodesVisited : 0,
    steps     : 0,
    pathCost  : Infinity,
    pathLen   : 0,
    status    : 'waiting',  // waiting | running | found | failed
    done      : false,
  };

  runner.cost[src] = 0;
  runner.parent[src] = -1;

  if (algo === 'bfs') {
    runner.frontier = [src];
    runner.step = function() {
      if (runner.frontier.length === 0) { runner.status = 'failed'; runner.done = true; return; }
      var cur = runner.frontier.shift();
      if (runner.visited[cur]) return;
      runner.visited[cur] = true;
      runner.nodesVisited++;
      runner.steps++;
      if (cur === tgt) { runner.status = 'found'; runner.done = true; garTracePath(runner, src, tgt); return; }
      (adj[cur] || []).forEach(function(nb) {
        if (!runner.visited[nb.to] && runner.frontier.indexOf(nb.to) === -1) {
          runner.frontier.push(nb.to);
          runner.parent[nb.to] = cur;
          runner.cost[nb.to] = (runner.cost[cur] || 0) + 1;
        }
      });
    };
  } else if (algo === 'dfs') {
    runner.frontier = [src];
    runner.step = function() {
      if (runner.frontier.length === 0) { runner.status = 'failed'; runner.done = true; return; }
      var cur = runner.frontier.pop();
      if (runner.visited[cur]) return;
      runner.visited[cur] = true;
      runner.nodesVisited++;
      runner.steps++;
      if (cur === tgt) { runner.status = 'found'; runner.done = true; garTracePath(runner, src, tgt); return; }
      var neighbors = (adj[cur] || []).slice().reverse();
      neighbors.forEach(function(nb) {
        if (!runner.visited[nb.to]) {
          runner.frontier.push(nb.to);
          if (runner.parent[nb.to] === undefined) {
            runner.parent[nb.to] = cur;
            runner.cost[nb.to] = (runner.cost[cur] || 0) + nb.w;
          }
        }
      });
    };
  } else if (algo === 'dijkstra') {
    // Simple priority queue as sorted array
    runner.frontier = [{ id: src, dist: 0 }];
    var dist = {}; dist[src] = 0;
    runner.step = function() {
      if (runner.frontier.length === 0) { runner.status = 'failed'; runner.done = true; return; }
      runner.frontier.sort(function(a, b) { return a.dist - b.dist; });
      var cur = runner.frontier.shift();
      if (runner.visited[cur.id]) return;
      runner.visited[cur.id] = true;
      runner.nodesVisited++;
      runner.steps++;
      if (cur.id === tgt) { runner.status = 'found'; runner.done = true; garTracePath(runner, src, tgt); return; }
      (adj[cur.id] || []).forEach(function(nb) {
        var newDist = cur.dist + nb.w;
        if (!runner.visited[nb.to] && (dist[nb.to] === undefined || newDist < dist[nb.to])) {
          dist[nb.to] = newDist;
          runner.parent[nb.to] = cur.id;
          runner.cost[nb.to] = newDist;
          runner.frontier.push({ id: nb.to, dist: newDist });
        }
      });
    };
  } else if (algo === 'astar') {
    var g = {}; g[src] = 0;
    runner.frontier = [{ id: src, f: garHeuristic(nodes, src, tgt) }];
    runner.step = function() {
      if (runner.frontier.length === 0) { runner.status = 'failed'; runner.done = true; return; }
      runner.frontier.sort(function(a, b) { return a.f - b.f; });
      var cur = runner.frontier.shift();
      if (runner.visited[cur.id]) return;
      runner.visited[cur.id] = true;
      runner.nodesVisited++;
      runner.steps++;
      if (cur.id === tgt) { runner.status = 'found'; runner.done = true; garTracePath(runner, src, tgt); return; }
      (adj[cur.id] || []).forEach(function(nb) {
        var tentG = (g[cur.id] || 0) + nb.w;
        if (!runner.visited[nb.to] && (g[nb.to] === undefined || tentG < g[nb.to])) {
          g[nb.to] = tentG;
          runner.parent[nb.to] = cur.id;
          runner.cost[nb.to] = tentG;
          var f = tentG + garHeuristic(nodes, nb.to, tgt);
          runner.frontier.push({ id: nb.to, f: f });
        }
      });
    };
  }

  return runner;
}

function garTracePath(runner, src, tgt) {
  var path = []; var cur = tgt;
  while (cur !== -1 && cur !== undefined) {
    path.unshift(cur);
    if (cur === src) break;
    cur = runner.parent[cur];
    if (path.length > 1000) break;
  }
  runner.path     = path;
  runner.pathLen  = path.length - 1;
  runner.pathCost = runner.cost[tgt] !== undefined ? runner.cost[tgt] : Infinity;
}

/* ─── Canvas drawing ─── */
var GAR_NODE_R = 16;

function garDrawCanvas(canvasId, runner, graph, src, tgt) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var def = GAR_ALGO_DEF[runner.algo];

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw edges
  graph.edges.forEach(function(e) {
    var na = graph.nodes[e.u]; var nb = graph.nodes[e.v];
    if (!na || !nb) return;
    // Check if edge is on path
    var onPath = false;
    if (runner.path.length > 1) {
      for (var i = 0; i < runner.path.length - 1; i++) {
        if ((runner.path[i] === e.u && runner.path[i+1] === e.v) ||
            (runner.path[i] === e.v && runner.path[i+1] === e.u)) { onPath = true; break; }
      }
    }
    ctx.strokeStyle = onPath ? def.color : 'rgba(100,116,139,0.3)';
    ctx.lineWidth   = onPath ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(na.x, na.y);
    ctx.lineTo(nb.x, nb.y);
    ctx.stroke();

    // Weight label
    if (e.w > 1) {
      var mx = (na.x + nb.x) / 2; var my = (na.y + nb.y) / 2;
      ctx.fillStyle = onPath ? def.color : 'rgba(148,163,184,0.6)';
      ctx.font = '9px Fira Code,monospace';
      ctx.textAlign = 'center';
      ctx.fillText(e.w, mx, my - 3);
    }
  });

  // Draw nodes
  graph.nodes.forEach(function(node) {
    var isVisited  = runner.visited[node.id];
    var isFrontier = runner.frontier.some(function(f) { return (typeof f === 'object' ? f.id : f) === node.id; });
    var isPath     = runner.path.indexOf(node.id) !== -1;
    var isSrc      = node.id === src;
    var isTgt      = node.id === tgt;

    var fillColor   = 'rgba(255,255,255,0.04)';
    var strokeColor = 'rgba(100,116,139,0.4)';
    var textColor   = 'rgba(148,163,184,0.8)';
    var lineWidth   = 1.5;

    if (isPath)     { fillColor = def.path;     strokeColor = def.color; textColor = '#fff'; lineWidth = 2.5; }
    else if (isVisited)  { fillColor = def.visited;  strokeColor = def.color; textColor = def.color; lineWidth = 2; }
    else if (isFrontier) { fillColor = def.frontier; strokeColor = def.color; textColor = def.color; lineWidth = 1.5; }

    if (isSrc) { strokeColor = '#f59e0b'; fillColor = 'rgba(245,158,11,0.3)'; textColor = '#f59e0b'; lineWidth = 3; }
    if (isTgt) { strokeColor = '#ef4444'; fillColor = 'rgba(239,68,68,0.3)';  textColor = '#ef4444'; lineWidth = 3; }

    ctx.beginPath();
    ctx.arc(node.x, node.y, GAR_NODE_R, 0, Math.PI * 2);
    ctx.fillStyle   = fillColor;
    ctx.fill();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth   = lineWidth;
    ctx.stroke();

    ctx.fillStyle    = textColor;
    ctx.font         = 'bold 10px Fira Code,monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.id, node.x, node.y);

    if (isSrc) { ctx.fillStyle='#f59e0b'; ctx.font='8px sans-serif'; ctx.fillText('S', node.x, node.y - GAR_NODE_R - 5); }
    if (isTgt) { ctx.fillStyle='#ef4444'; ctx.font='8px sans-serif'; ctx.fillText('T', node.x, node.y - GAR_NODE_R - 5); }
  });
}

/* ─── Setup canvases ─── */
function garSetupCanvases() {
  var wrap = document.getElementById('garCanvases');
  if (!wrap) return;

  var activeAlgos = Object.keys(garState.algos).filter(function(a) { return garState.algos[a]; });
  var cols = activeAlgos.length <= 2 ? activeAlgos.length : 2;
  wrap.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';

  wrap.innerHTML = activeAlgos.map(function(algo) {
    var def = GAR_ALGO_DEF[algo];
    return '<div class="gar-canvas-wrap" id="garWrap_' + algo + '">' +
      '<div class="gar-canvas-header">' +
        '<span class="gar-canvas-algo-name" style="color:' + def.color + '">' + def.label + '</span>' +
        '<span class="gar-canvas-badge" id="garBadge_' + algo + '">Ready</span>' +
      '</div>' +
      '<canvas class="gar-canvas" id="garCanvas_' + algo + '" width="400" height="280"></canvas>' +
    '</div>';
  }).join('');

  // Resize canvases to fit
  setTimeout(function() {
    activeAlgos.forEach(function(algo) {
      var canvas = document.getElementById('garCanvas_' + algo);
      var cWrap  = document.getElementById('garWrap_' + algo);
      if (canvas && cWrap) {
        canvas.width = cWrap.clientWidth;
        canvas.height = Math.min(280, canvas.width * 0.65);
      }
    });
  }, 50);
}

/* ─── Setup runners ─── */
function garSetupRunners() {
  var graph = garState.graph;
  var adj   = garBuildAdj(graph);
  var src   = garState.source;
  var tgt   = garState.target;

  garState.runners = {};
  Object.keys(garState.algos).forEach(function(algo) {
    if (!garState.algos[algo]) return;
    var runner = garMakeRunner(algo, graph, adj, src, tgt);
    runner.status = 'running';
    garState.runners[algo] = runner;
  });
}

/* ─── Update metrics ─── */
function garUpdateMetrics() {
  var tbody = document.getElementById('garMetricsBody');
  if (!tbody) return;

  tbody.innerHTML = Object.keys(garState.runners).map(function(algo) {
    var r   = garState.runners[algo];
    var def = GAR_ALGO_DEF[algo];
    var statusStr = r.status === 'found' ? '✅ Found' : r.status === 'failed' ? '❌ Not Found' : '🔄 Running';
    var costStr   = r.pathCost === Infinity ? '—' : r.pathCost.toFixed(1);
    var isWinner  = garState.winner === algo;
    return '<tr class="' + (isWinner ? 'gar-winner-row' : '') + '">' +
      '<td style="color:' + def.color + '">' + def.label + (isWinner ? ' 🏆' : '') + '</td>' +
      '<td>' + r.nodesVisited + '</td>' +
      '<td>' + r.steps + '</td>' +
      '<td>' + costStr + '</td>' +
      '<td>' + (r.pathLen || 0) + '</td>' +
      '<td>' + statusStr + '</td>' +
    '</tr>';
  }).join('');
}

/* ─── Update badges ─── */
function garUpdateBadges() {
  Object.keys(garState.runners).forEach(function(algo) {
    var r   = garState.runners[algo];
    var el  = document.getElementById('garBadge_' + algo);
    var wrap = document.getElementById('garWrap_' + algo);
    if (!el) return;
    if (r.status === 'found') {
      el.textContent = 'Found!'; el.className = 'gar-canvas-badge found';
      if (wrap) wrap.classList.add('finished');
    } else if (r.status === 'failed') {
      el.textContent = 'Not Found'; el.className = 'gar-canvas-badge failed';
      if (wrap) wrap.classList.add('finished');
    } else {
      el.textContent = 'Visited: ' + r.nodesVisited; el.className = 'gar-canvas-badge running';
    }
  });
}

/* ─── Draw all ─── */
function garDrawAll() {
  var graph = garState.graph;
  Object.keys(garState.runners).forEach(function(algo) {
    garDrawCanvas('garCanvas_' + algo, garState.runners[algo], graph, garState.source, garState.target);
  });
}

/* ─── Single step — advance ALL runners one step ─── */
function garDoStep() {
  var allDone = true;
  var firstFound = null;

  Object.keys(garState.runners).forEach(function(algo) {
    var r = garState.runners[algo];
    if (!r.done) {
      r.step();
      if (r.status === 'found' && !garState.winner) {
        garState.winner = algo;
        firstFound = algo;
      }
      if (!r.done) allDone = false;
    }
  });

  garDrawAll();
  garUpdateBadges();
  garUpdateMetrics();

  // Update status
  var statusEl = document.getElementById('garStatus');
  if (firstFound && statusEl) {
    var def = GAR_ALGO_DEF[firstFound];
    statusEl.textContent = def.label + ' reached the target first! All algorithms continue until done.';
    statusEl.className = 'gar-status running';

    // Winner banner
    var banner = document.getElementById('garWinnerBanner');
    var bannerText = document.getElementById('garWinnerText');
    var wrap = document.getElementById('garWrap_' + firstFound);
    if (banner && bannerText) {
      bannerText.textContent = def.label + ' wins the race!';
      banner.classList.remove('hidden');
    }
    if (wrap) wrap.classList.add('winner');
  }

  if (allDone) {
    garState.playing = false;
    garState.done    = true;
    garUpdatePBBtns();
    if (statusEl) {
      statusEl.textContent = 'Race complete! ' + (garState.winner ? GAR_ALGO_DEF[garState.winner].label + ' found target first.' : 'No path found.');
      statusEl.className = 'gar-status done';
    }
  }
}

/* ─── Playback ─── */
function garGetDelay() {
  var el = document.getElementById('garSpeed');
  return GAR_SPEED[el ? el.value : 3] || 250;
}

function garPlay() {
  if (garState.playing || garState.done) return;
  garState.playing = true;
  garUpdatePBBtns();
  garPlayNext();
}

function garPlayNext() {
  if (!garState.playing) return;
  garDoStep();
  if (!garState.done) {
    garState.timer = setTimeout(garPlayNext, garGetDelay());
  }
}

function garPause() {
  garState.playing = false;
  if (garState.timer) { clearTimeout(garState.timer); garState.timer = null; }
  garUpdatePBBtns();
}

function garStep() {
  if (garState.playing) garPause();
  if (garState.done) return;
  garDoStep();
  garUpdatePBBtns();
}

function garUpdatePBBtns() {
  var stepBtn  = document.getElementById('garStepBtn');
  var pauseBtn = document.getElementById('garPauseBtn');
  if (stepBtn)  stepBtn.disabled  = garState.done;
  if (pauseBtn) pauseBtn.disabled = !garState.playing;
}

/* ─── Run ─── */
function garRun() {
  garPause();

  // Read inputs
  var src = parseInt((document.getElementById('garSource') || {}).value || 0);
  var tgt = parseInt((document.getElementById('garTarget') || {}).value || 0);
  var graph = GAR_PRESETS[garState.preset]();

  var maxId = graph.nodes.length - 1;
  if (isNaN(src) || src < 0 || src > maxId) src = 0;
  if (isNaN(tgt) || tgt < 0 || tgt > maxId) tgt = maxId;

  garState.source = src;
  garState.target = tgt;
  garState.graph  = graph;
  garState.winner = null;
  garState.done   = false;

  var activeAlgos = Object.keys(garState.algos).filter(function(a) { return garState.algos[a]; });
  if (activeAlgos.length === 0) {
    var el = document.getElementById('garStatus');
    if (el) el.textContent = 'Select at least one algorithm.';
    return;
  }

  // Reset winner banner
  var banner = document.getElementById('garWinnerBanner');
  if (banner) banner.classList.add('hidden');

  garSetupCanvases();
  garSetupRunners();

  // Delay draw to allow canvas resize
  setTimeout(function() {
    // Resize canvases again after DOM settles
    activeAlgos.forEach(function(algo) {
      var canvas = document.getElementById('garCanvas_' + algo);
      var cWrap  = document.getElementById('garWrap_' + algo);
      if (canvas && cWrap) {
        canvas.width  = cWrap.clientWidth;
        canvas.height = Math.min(280, Math.floor(canvas.width * 0.65));
      }
    });

    // Scale node positions to fit canvas
    var canvas0 = document.getElementById('garCanvas_' + activeAlgos[0]);
    if (canvas0 && garState.graph) {
      var cw = canvas0.width; var ch = canvas0.height;
      var minX = Infinity, maxX = 0, minY = Infinity, maxY = 0;
      garState.graph.nodes.forEach(function(n) {
        if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x;
        if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y;
      });
      var scaleX = (cw - 60) / Math.max(maxX - minX, 1);
      var scaleY = (ch - 60) / Math.max(maxY - minY, 1);
      var scale  = Math.min(scaleX, scaleY, 1.2);
      garState.graph.nodes.forEach(function(n) {
        n.x = Math.round(30 + (n.x - minX) * scale);
        n.y = Math.round(30 + (n.y - minY) * scale);
      });
    }

    garDrawAll();
    garUpdateMetrics();
    garUpdatePBBtns();

    var statusEl = document.getElementById('garStatus');
    if (statusEl) { statusEl.textContent = 'Race ready! Press Step or watch auto-play.'; statusEl.className = 'gar-status running'; }

    garPlay();
  }, 100);
}

/* ─── Reset ─── */
function garReset() {
  garPause();
  garState.runners = {};
  garState.winner  = null;
  garState.done    = false;

  var wrap = document.getElementById('garCanvases');
  if (wrap) wrap.innerHTML = '';

  var banner = document.getElementById('garWinnerBanner');
  if (banner) banner.classList.add('hidden');

  var tbody = document.getElementById('garMetricsBody');
  if (tbody) tbody.innerHTML = '';

  var statusEl = document.getElementById('garStatus');
  if (statusEl) { statusEl.textContent = 'Select a graph preset, choose algorithms, then click Start Race.'; statusEl.className = 'gar-status'; }

  garUpdatePBBtns();
}

/* ─── Init ─── */
function garInit() {
  // Preset buttons
  document.querySelectorAll('.gar-preset-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.gar-preset-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      garState.preset = btn.getAttribute('data-preset');

      // Update default source/target
      var g = GAR_PRESETS[garState.preset]();
      var srcEl = document.getElementById('garSource');
      var tgtEl = document.getElementById('garTarget');
      if (srcEl) srcEl.value = g.defaultSource;
      if (tgtEl) tgtEl.value = g.defaultTarget;

      garReset();
    });
  });

  // Algorithm toggles
  document.querySelectorAll('.gar-algo-toggle').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var algo = btn.getAttribute('data-algo');
      garState.algos[algo] = !garState.algos[algo];
      btn.classList.toggle('active', garState.algos[algo]);
    });
  });

  // Playback
  var runBtn   = document.getElementById('garRunBtn');
  var stepBtn  = document.getElementById('garStepBtn');
  var pauseBtn = document.getElementById('garPauseBtn');
  var resetBtn = document.getElementById('garResetBtn');
  var speedSl  = document.getElementById('garSpeed');

  if (runBtn)   runBtn.addEventListener('click',   garRun);
  if (stepBtn)  stepBtn.addEventListener('click',  garStep);
  if (pauseBtn) pauseBtn.addEventListener('click', garPause);
  if (resetBtn) resetBtn.addEventListener('click', garReset);

  if (speedSl) {
    speedSl.addEventListener('input', function() {
      var lbl = document.getElementById('garSpeedVal');
      if (lbl) lbl.textContent = GAR_SPEED_LABEL[speedSl.value] || 'Normal';
      if (garState.playing) { garPause(); garPlay(); }
    });
  }

  window.addEventListener('resize', function() {
    if (Object.keys(garState.runners).length === 0) return;
    Object.keys(garState.runners).forEach(function(algo) {
      var canvas = document.getElementById('garCanvas_' + algo);
      var cWrap  = document.getElementById('garWrap_' + algo);
      if (canvas && cWrap) {
        canvas.width  = cWrap.clientWidth;
        canvas.height = Math.min(280, Math.floor(canvas.width * 0.65));
      }
    });
    garDrawAll();
  });
}