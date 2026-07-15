document.addEventListener('DOMContentLoaded', function() {
  grInit();
});

var GR_COLORS = ['#06b6d4', '#a855f7', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];

var grState = {
  vertices: [],
  edges: [],
  nextId: 0,
  tool: 'vertex',
  pendingEdgeFrom: null,
  vertexColors: {},
};

function grAdjacency() {
  var adj = {};
  grState.vertices.forEach(function(v) { adj[v.id] = []; });
  grState.edges.forEach(function(e) { adj[e.a].push(e.b); adj[e.b].push(e.a); });
  return adj;
}

function grAddVertex(x, y, label) {
  var id = grState.nextId++;
  grState.vertices.push({ id: id, x: x, y: y, label: label !== undefined ? label : String.fromCharCode(65 + (id % 26)) });
  return id;
}

function grAddEdge(a, b) {
  if (a === b) return;
  var exists = grState.edges.some(function(e) { return (e.a === a && e.b === b) || (e.a === b && e.b === a); });
  if (exists) return;
  grState.edges.push({ a: a, b: b });
}

function grDeleteVertex(id) {
  grState.vertices = grState.vertices.filter(function(v) { return v.id !== id; });
  grState.edges = grState.edges.filter(function(e) { return e.a !== id && e.b !== id; });
  delete grState.vertexColors[id];
}

function grClear() {
  grState.vertices = [];
  grState.edges = [];
  grState.nextId = 0;
  grState.pendingEdgeFrom = null;
  grState.vertexColors = {};
}

function grGreedyColor(order) {
  var adj = grAdjacency();
  var colors = {};
  var steps = [];

  order.forEach(function(vId) {
    var usedByNeighbors = {};
    adj[vId].forEach(function(n) { if (colors[n] !== undefined) usedByNeighbors[colors[n]] = true; });

    var c = 0;
    while (usedByNeighbors[c]) c++;
    colors[vId] = c;
    steps.push({ v: vId, c: c });
  });

  var maxColor = Math.max.apply(null, Object.values(colors).concat([-1]));
  return { colors: colors, colorCount: maxColor + 1, steps: steps };
}

function grOrderVertices(strategy) {
  var vertices = grState.vertices.slice();
  if (strategy === 'input') return vertices.map(function(v) { return v.id; });
  if (strategy === 'degree') {
    var adj = grAdjacency();
    return vertices.map(function(v) { return v.id; }).sort(function(a, b) { return adj[b].length - adj[a].length; });
  }
  if (strategy === 'random') {
    var ids = vertices.map(function(v) { return v.id; });
    for (var i = ids.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = ids[i]; ids[i] = ids[j]; ids[j] = tmp;
    }
    return ids;
  }
  return vertices.map(function(v) { return v.id; });
}

function grBacktrackColoring(k) {
  var adj = grAdjacency();
  var vertexIds = grState.vertices.map(function(v) { return v.id; });
  var n = vertexIds.length;
  var colors = {};
  var backtrackCount = 0;
  var log = [];

  function isSafe(vId, c) {
    return !adj[vId].some(function(n2) { return colors[n2] === c; });
  }

  function solve(idx) {
    if (idx === n) return true;
    var vId = vertexIds[idx];

    for (var c = 0; c < k; c++) {
      if (isSafe(vId, c)) {
        colors[vId] = c;
        log.push({ type: 'assign', v: vId, c: c });
        if (solve(idx + 1)) return true;
        log.push({ type: 'backtrack', v: vId, c: c });
        backtrackCount++;
        delete colors[vId];
      }
    }
    return false;
  }

  var success = solve(0);
  return { success: success, colors: success ? colors : null, backtrackCount: backtrackCount, log: log };
}

function grFindChromaticNumber() {
  var n = grState.vertices.length;
  if (n === 0) return { chromatic: 0, colors: {}, backtrackCount: 0, log: [] };

  for (var k = 1; k <= n; k++) {
    var result = grBacktrackColoring(k);
    if (result.success) return { chromatic: k, colors: result.colors, backtrackCount: result.backtrackCount, log: result.log };
  }
  return { chromatic: n, colors: {}, backtrackCount: 0, log: [] };
}

function grRenderGraph(colorMap) {
  var canvas = document.getElementById('grCanvas');
  if (!canvas) return;
  var wrap = document.getElementById('grCanvasWrap');
  canvas.width = wrap.clientWidth;
  canvas.height = 400;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  grState.edges.forEach(function(e) {
    var a = grState.vertices.find(function(v) { return v.id === e.a; });
    var b = grState.vertices.find(function(v) { return v.id === e.b; });
    if (!a || !b) return;
    ctx.strokeStyle = 'rgba(148,163,184,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  });

  grState.vertices.forEach(function(v) {
    var colorIdx = colorMap && colorMap[v.id] !== undefined ? colorMap[v.id] : null;
    var fillColor = colorIdx !== null ? GR_COLORS[colorIdx % GR_COLORS.length] : 'rgba(148,163,184,0.15)';
    var strokeColor = colorIdx !== null ? GR_COLORS[colorIdx % GR_COLORS.length] : 'rgba(148,163,184,0.5)';
    var isPendingEdge = grState.pendingEdgeFrom === v.id;

    ctx.beginPath();
    ctx.arc(v.x, v.y, 18, 0, Math.PI * 2);
    ctx.fillStyle = colorIdx !== null ? fillColor + '55' : fillColor;
    ctx.fill();
    ctx.strokeStyle = isPendingEdge ? '#f59e0b' : strokeColor;
    ctx.lineWidth = isPendingEdge ? 3 : 2;
    ctx.stroke();

    ctx.fillStyle = colorIdx !== null ? strokeColor : 'rgba(148,163,184,0.7)';
    ctx.font = 'bold 12px Fira Code, monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(v.label, v.x, v.y);
  });
}

function grAddLog(msg, cls) {
  var log = document.getElementById('grLog');
  if (!log) return;
  var empty = log.querySelector('.gr-empty');
  if (empty) empty.remove();
  var entry = document.createElement('div');
  entry.className = 'gr-log-entry ' + (cls || '');
  entry.textContent = msg;
  log.insertBefore(entry, log.firstChild);
  while (log.children.length > 80) log.removeChild(log.lastChild);
}

function grSetStatus(msg, cls) {
  var el = document.getElementById('grStatus');
  if (!el) return;
  el.textContent = msg; el.className = 'gr-status ' + (cls || '');
}

function grHandleCanvasClick(e) {
  var canvas = document.getElementById('grCanvas');
  var rect = canvas.getBoundingClientRect();
  var scaleX = canvas.width / rect.width;
  var scaleY = canvas.height / rect.height;
  var mx = (e.clientX - rect.left) * scaleX;
  var my = (e.clientY - rect.top) * scaleY;

  var clicked = grState.vertices.find(function(v) {
    var d = Math.sqrt((v.x - mx) * (v.x - mx) + (v.y - my) * (v.y - my));
    return d <= 20;
  });

  if (grState.tool === 'vertex') {
    if (clicked) return;
    grAddVertex(mx, my);
    grRenderGraph(null);
    grSetStatus('Vertex added. Click empty space to add more, or switch tools.', '');
  } else if (grState.tool === 'edge') {
    if (!clicked) return;
    if (grState.pendingEdgeFrom === null) {
      grState.pendingEdgeFrom = clicked.id;
      grSetStatus('Now click a second vertex to complete the edge.', '');
    } else if (grState.pendingEdgeFrom !== clicked.id) {
      grAddEdge(grState.pendingEdgeFrom, clicked.id);
      grState.pendingEdgeFrom = null;
      grSetStatus('Edge added.', '');
    } else {
      grState.pendingEdgeFrom = null;
      grSetStatus('Edge selection cancelled.', '');
    }
    grRenderGraph(null);
  } else if (grState.tool === 'delete') {
    if (!clicked) return;
    grDeleteVertex(clicked.id);
    grRenderGraph(null);
    grSetStatus('Vertex "' + clicked.label + '" and its edges deleted.', '');
  }
}

function grGreedyHandler() {
  if (grState.vertices.length === 0) { grSetStatus('Add vertices first.', ''); return; }
  var activeOrderBtn = document.querySelector('.gr-order-btn.active');
  var strategy = activeOrderBtn ? activeOrderBtn.getAttribute('data-order') : 'input';
  var order = grOrderVertices(strategy);

  var result = grGreedyColor(order);
  grRenderGraph(result.colors);

  var colorsEl = document.getElementById('grGreedyColors');
  if (colorsEl) colorsEl.textContent = result.colorCount;

  var orderLabels = order.map(function(id) { return grState.vertices.find(function(v) { return v.id === id; }).label; });
  grAddLog('Greedy (' + strategy + ' order: ' + orderLabels.join('→') + ') used ' + result.colorCount + ' color(s).', 'done');
  grSetStatus('Greedy coloring (' + strategy + ' order) used ' + result.colorCount + ' color(s).', 'good');
}

function grExactHandler() {
  if (grState.vertices.length === 0) { grSetStatus('Add vertices first.', ''); return; }
  if (grState.vertices.length > 12) { grSetStatus('Exact solver limited to 12 vertices for reasonable runtime.', ''); return; }

  var result = grFindChromaticNumber();
  grRenderGraph(result.colors);

  var chromaticEl = document.getElementById('grChromatic');
  var backtracksEl = document.getElementById('grBacktracks');
  if (chromaticEl) chromaticEl.textContent = result.chromatic;
  if (backtracksEl) backtracksEl.textContent = result.backtrackCount;

  result.log.forEach(function(entry) {
    var vLabel = grState.vertices.find(function(v) { return v.id === entry.v; }).label;
    if (entry.type === 'backtrack') grAddLog('Backtrack: vertex ' + vLabel + ' color ' + entry.c + ' failed, undoing.', 'backtrack');
  });

  grAddLog('Chromatic number χ(G) = ' + result.chromatic + ', found after ' + result.backtrackCount + ' backtrack event(s).', 'done');
  grSetStatus('True chromatic number found: χ(G) = ' + result.chromatic + '. ' + result.backtrackCount + ' backtrack(s) occurred during search.', result.backtrackCount > 0 ? 'backtrack' : 'good');
}

function grCompareHandler() {
  if (grState.vertices.length === 0) { grSetStatus('Add vertices first.', ''); return; }

  var strategies = ['input', 'degree', 'random'];
  var results = strategies.map(function(s) {
    var order = grOrderVertices(s);
    var r = grGreedyColor(order);
    return { strategy: s, colorCount: r.colorCount };
  });

  var resultEl = document.getElementById('grOcResult');
  if (resultEl) {
    resultEl.innerHTML = results.map(function(r) {
      var label = r.strategy === 'input' ? 'Input order' : r.strategy === 'degree' ? 'Degree-descending' : 'Random';
      return '<div class="gr-oc-row"><span>' + label + '</span><span>' + r.colorCount + ' color(s)</span></div>';
    }).join('');
  }

  var counts = results.map(function(r) { return r.colorCount; });
  var allSame = counts.every(function(c) { return c === counts[0]; });
  grSetStatus(allSame ? 'All 3 orderings used the same number of colors on this graph.' : 'Different orderings used different color counts — greedy is genuinely order-dependent.', '');
}

function grLoadPreset(name) {
  grClear();
  var wrap = document.getElementById('grCanvasWrap');
  var W = wrap ? wrap.clientWidth : 600;
  var cx = W / 2; var cy = 200;

  if (name === 'k4') {
    var positions = [[cx, cy - 100], [cx - 100, cy + 60], [cx + 100, cy + 60], [cx, cy + 160]];
    var ids = positions.map(function(p) { return grAddVertex(p[0], p[1]); });
    for (var i = 0; i < ids.length; i++) for (var j = i + 1; j < ids.length; j++) grAddEdge(ids[i], ids[j]);
    grSetStatus('K4 loaded — every vertex connects to every other. This graph provably needs exactly 4 colors.', '');
  } else if (name === 'exam') {
    var courses = ['DSA', 'DBMS', 'OS', 'CN', 'AI', 'ML'];
    var pos = [[cx-160,cy-100],[cx-50,cy-140],[cx+70,cy-100],[cx-160,cy+80],[cx+70,cy+80],[cx-50,cy+120]];
    var ids2 = courses.map(function(c, i) { return grAddVertex(pos[i][0], pos[i][1], c); });
    var conflicts = [[0,1],[0,3],[1,2],[1,4],[2,4],[3,5],[4,5],[0,4]];
    conflicts.forEach(function(c) { grAddEdge(ids2[c[0]], ids2[c[1]]); });
    grSetStatus('Exam scheduling loaded — an edge means two courses share students and cannot be scheduled at the same time. Colors = time slots.', '');
  } else if (name === 'register') {
    var vars = ['a','b','c','d','e'];
    var pos2 = [[cx-140,cy-80],[cx,cy-120],[cx+140,cy-80],[cx-70,cy+80],[cx+70,cy+80]];
    var ids3 = vars.map(function(v, i) { return grAddVertex(pos2[i][0], pos2[i][1], v); });
    var overlaps = [[0,1],[1,2],[0,3],[1,3],[1,4],[2,4],[3,4]];
    overlaps.forEach(function(o) { grAddEdge(ids3[o[0]], ids3[o[1]]); });
    grSetStatus('Register allocation loaded — an edge means two variables are simultaneously live and cannot share a CPU register. Colors = registers.', '');
  } else if (name === 'map') {
    var regions = ['N','S','E','W','C'];
    var pos3 = [[cx,cy-120],[cx,cy+120],[cx+120,cy],[cx-120,cy],[cx,cy]];
    var ids4 = regions.map(function(r, i) { return grAddVertex(pos3[i][0], pos3[i][1], r); });
    var adjacent = [[4,0],[4,1],[4,2],[4,3],[0,2],[2,1],[1,3],[3,0]];
    adjacent.forEach(function(a) { grAddEdge(ids4[a[0]], ids4[a[1]]); });
    grSetStatus('Map coloring loaded — an edge means two regions share a border and cannot be the same color. This is the classic 4-color map problem.', '');
  }

  var log = document.getElementById('grLog');
  if (log) log.innerHTML = '<div class="gr-empty">No operations yet.</div>';
  document.getElementById('grGreedyColors').textContent = '—';
  document.getElementById('grChromatic').textContent = '—';
  document.getElementById('grBacktracks').textContent = '—';
  document.getElementById('grOcResult').innerHTML = '';

  grRenderGraph(null);
}

function grInit() {
  grLoadPreset('k4');

  document.querySelectorAll('.gr-preset-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.gr-preset-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      grLoadPreset(btn.getAttribute('data-preset'));
    });
  });

  document.querySelectorAll('.gr-tool-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.gr-tool-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      grState.tool = btn.getAttribute('data-tool');
      grState.pendingEdgeFrom = null;
      grRenderGraph(null);
    });
  });

  document.querySelectorAll('.gr-order-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.gr-order-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
    });
  });

  var canvas = document.getElementById('grCanvas');
  if (canvas) canvas.addEventListener('click', grHandleCanvasClick);

  var resetBtn = document.getElementById('grResetBtn');
  if (resetBtn) resetBtn.addEventListener('click', function() {
    grClear();
    var log = document.getElementById('grLog');
    if (log) log.innerHTML = '<div class="gr-empty">No operations yet.</div>';
    document.getElementById('grGreedyColors').textContent = '—';
    document.getElementById('grChromatic').textContent = '—';
    document.getElementById('grBacktracks').textContent = '—';
    document.getElementById('grOcResult').innerHTML = '';
    grRenderGraph(null);
    grSetStatus('Graph cleared. Use editor tools to build your own, or load a preset.', '');
  });

  var greedyBtn = document.getElementById('grGreedyBtn');
  var exactBtn = document.getElementById('grExactBtn');
  var compareBtn = document.getElementById('grCompareBtn');
  if (greedyBtn) greedyBtn.addEventListener('click', grGreedyHandler);
  if (exactBtn) exactBtn.addEventListener('click', grExactHandler);
  if (compareBtn) compareBtn.addEventListener('click', grCompareHandler);

  window.addEventListener('resize', function() { grRenderGraph(null); });
}