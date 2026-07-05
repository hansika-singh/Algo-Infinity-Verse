// script.js handles: loading screen, navbar, dark mode, scroll top
// This file: Union-Find visualizer logic only
// All globals prefixed uf_ or UF_ to avoid conflicts

document.addEventListener('DOMContentLoaded', function() {
  ufInitControls();
});

/* ─── Speed map ─── */
var UF_SPEED_MAP   = { 1: 1200, 2: 700, 3: 400, 4: 180, 5: 60 };
var UF_SPEED_LABEL = { 1: 'Slowest', 2: 'Slow', 3: 'Normal', 4: 'Fast', 5: 'Blazing' };

/* ─── Colors ─── */
var UF_COL = {
  ROOT      : { fill: 'rgba(245,158,11,0.3)',  stroke: '#f59e0b', text: '#fde68a' },
  DEFAULT   : { fill: 'rgba(100,116,139,0.2)', stroke: '#64748b', text: '#94a3b8' },
  ACTIVE    : { fill: 'rgba(168,85,247,0.3)',  stroke: '#a855f7', text: '#e9d5ff' },
  PATH      : { fill: 'rgba(6,182,212,0.3)',   stroke: '#06b6d4', text: '#a5f3fc' },
  UNION     : { fill: 'rgba(239,68,68,0.25)',  stroke: '#ef4444', text: '#fca5a5' },
  CONNECTED : { fill: 'rgba(34,197,94,0.3)',   stroke: '#22c55e', text: '#bbf7d0' },
};

/* ─── DSU Data structure ─── */
var ufDsu = {
  parent : [],
  rank   : [],
  n      : 0,
};

/* ─── State ─── */
var ufState = {
  built       : false,
  nodeColor   : [],   // color key per node
  steps       : [],
  stepIdx     : 0,
  playing     : false,
  timer       : null,
  logEntries  : [],
};

/* ─── DSU operations (pure — no side effects) ─── */
function ufFindRoot(parent, x) {
  while (parent[x] !== x) x = parent[x];
  return x;
}

/* ─── Step generators ─── */
function ufGenUnionSteps(a, b, useRank, usePathComp) {
  var parent = ufDsu.parent.slice();
  var rank   = ufDsu.rank.slice();
  var steps  = [];
  var n      = ufDsu.n;

  function findWithSteps(x) {
    var path = [];
    var cur  = x;
    while (parent[cur] !== cur) {
      path.push(cur);
      steps.push({
        type: 'find-traverse',
        node: cur,
        color: 'ACTIVE',
        msg: 'Find(' + x + '): visiting node ' + cur + ', parent=' + parent[cur]
      });
      cur = parent[cur];
    }
    steps.push({
      type: 'find-root',
      node: cur,
      color: 'ROOT',
      msg: 'Find(' + x + '): root found = ' + cur
    });

    if (usePathComp && path.length > 0) {
      path.forEach(function(p) {
        parent[p] = cur;
        steps.push({
          type: 'path-compress',
          node: p,
          root: cur,
          parent: parent.slice(),
          color: 'PATH',
          msg: 'Path compression: ' + p + ' → parent set to root ' + cur
        });
      });
    }
    return cur;
  }

  steps.push({ type: 'start', node: -1, color: null, msg: 'Union(' + a + ', ' + b + '): finding roots of both elements.' });

  var ra = findWithSteps(a);
  var rb = findWithSteps(b);

  if (ra === rb) {
    steps.push({ type: 'already-union', node: -1, color: null, parent: parent.slice(), rank: rank.slice(), msg: 'Union(' + a + ', ' + b + '): already in the same component (root=' + ra + '). No action needed.' });
    return steps;
  }

  if (useRank) {
    if (rank[ra] < rank[rb]) { var tmp = ra; ra = rb; rb = tmp; }
    parent[rb] = ra;
    if (rank[ra] === rank[rb]) rank[ra]++;
    steps.push({
      type: 'union-done',
      node: rb,
      root: ra,
      parent: parent.slice(),
      rank: rank.slice(),
      color: 'UNION',
      msg: 'Union by rank: attach ' + rb + ' under ' + ra + ' (rank[' + ra + ']=' + rank[ra] + ')'
    });
  } else {
    parent[rb] = ra;
    steps.push({
      type: 'union-done',
      node: rb,
      root: ra,
      parent: parent.slice(),
      rank: rank.slice(),
      color: 'UNION',
      msg: 'Union: attach ' + rb + ' under ' + ra
    });
  }

  steps.push({ type: 'complete', node: -1, color: null, parent: parent.slice(), rank: rank.slice(), msg: 'Union(' + a + ', ' + b + ') complete. Components: ' + ufCountComponents(parent, n) });
  return steps;
}

function ufGenFindSteps(x, usePathComp) {
  var parent = ufDsu.parent.slice();
  var steps  = [];

  var path = [];
  var cur  = x;
  steps.push({ type: 'start', node: x, color: 'ACTIVE', msg: 'Find(' + x + '): starting traversal to root.' });

  while (parent[cur] !== cur) {
    path.push(cur);
    steps.push({ type: 'traverse', node: cur, color: 'ACTIVE', msg: 'Find(' + x + '): at node ' + cur + ', parent=' + parent[cur] });
    cur = parent[cur];
  }

  steps.push({ type: 'root', node: cur, color: 'ROOT', msg: 'Find(' + x + '): root = ' + cur });

  if (usePathComp && path.length > 0) {
    path.forEach(function(p) {
      parent[p] = cur;
      steps.push({
        type: 'compress',
        node: p,
        root: cur,
        parent: parent.slice(),
        color: 'PATH',
        msg: 'Path compression: node ' + p + ' → directly points to root ' + cur
      });
    });
    steps.push({ type: 'complete', node: -1, color: null, parent: parent.slice(), msg: 'Find complete. Path compressed. Root = ' + cur });
  } else {
    steps.push({ type: 'complete', node: -1, color: null, msg: 'Find complete. Root = ' + cur });
  }

  return steps;
}

function ufGenConnSteps(a, b) {
  var parent = ufDsu.parent.slice();
  var steps  = [];

  steps.push({ type: 'start', node: -1, color: null, msg: 'Connected?(' + a + ', ' + b + '): finding roots.' });

  var ra = ufFindRoot(parent, a);
  var rb = ufFindRoot(parent, b);

  steps.push({ type: 'root-a', node: ra, color: 'ACTIVE', msg: 'Root of ' + a + ' = ' + ra });
  steps.push({ type: 'root-b', node: rb, color: 'ACTIVE', msg: 'Root of ' + b + ' = ' + rb });

  if (ra === rb) {
    steps.push({ type: 'connected', node: -1, color: 'CONNECTED', msg: '✅ ' + a + ' and ' + b + ' ARE connected (same root: ' + ra + ')' });
  } else {
    steps.push({ type: 'not-connected', node: -1, color: null, msg: '❌ ' + a + ' and ' + b + ' are NOT connected (roots: ' + ra + ' ≠ ' + rb + ')' });
  }

  return steps;
}

/* ─── Count components ─── */
function ufCountComponents(parent, n) {
  var count = 0;
  for (var i = 0; i < n; i++) if (parent[i] === i) count++;
  return count;
}

/* ─── Canvas Layout ─── */
function ufLayout(canvas) {
  var parent = ufDsu.parent;
  var n      = ufDsu.n;
  var W      = canvas.width;
  var H      = canvas.height;
  var pos    = {};
  var R      = Math.min(24, Math.floor(W / (n * 2.5)));
  R = Math.max(16, R);

  // Build adjacency: children of each node (in current parent[] tree)
  var children = [];
  var roots    = [];
  for (var i = 0; i < n; i++) { children.push([]); }
  for (var i = 0; i < n; i++) {
    if (parent[i] !== i) children[parent[i]].push(i);
    else roots.push(i);
  }

  // BFS layout: roots spaced across top, children below
  var rootSpacing = W / (roots.length + 1);
  var levelH = Math.min(90, (H - 40) / 5);

  function place(node, x, y) {
    pos[node] = { x: x, y: y, r: R };
    var kids = children[node];
    if (kids.length === 0) return;
    var span = Math.max(kids.length * (R * 2.8), R * 3);
    var startX = x - span / 2 + span / (kids.length + 1);
    kids.forEach(function(kid, idx) {
      place(kid, startX + idx * (span / (kids.length + 1)), y + levelH);
    });
  }

  roots.forEach(function(root, idx) {
    place(root, rootSpacing * (idx + 1), 50);
  });

  // Dynamic canvas height
  var maxY = 50;
  Object.values(pos).forEach(function(p) { if (p.y > maxY) maxY = p.y; });
  canvas.height = maxY + R * 2 + 30;

  return pos;
}

/* ─── Draw ─── */
function ufDraw(pos) {
  var canvas = document.getElementById('ufCanvas');
  if (!canvas || !ufState.built) return;
  var ctx    = canvas.getContext('2d');
  var parent = ufDsu.parent;
  var n      = ufDsu.n;
  var colors = ufState.nodeColor;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Edges (parent pointers)
  for (var i = 0; i < n; i++) {
    if (parent[i] !== i) {
      var from = pos[i];
      var to   = pos[parent[i]];
      if (!from || !to) continue;

      ctx.strokeStyle = 'rgba(100,116,139,0.4)';
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y - from.r);
      ctx.lineTo(to.x,   to.y   + to.r);
      ctx.stroke();

      // Arrow head
      var dx  = to.x - from.x;
      var dy  = (to.y + to.r) - (from.y - from.r);
      var len = Math.sqrt(dx*dx + dy*dy);
      if (len > 0) {
        var ux = dx/len, uy = dy/len;
        var ax = to.x - uy * 5 - ux * 8;
        var ay = (to.y + to.r) + ux * 5 - uy * 8;
        var bx = to.x + uy * 5 - ux * 8;
        var by = (to.y + to.r) - ux * 5 - uy * 8;
        ctx.fillStyle = 'rgba(100,116,139,0.5)';
        ctx.beginPath();
        ctx.moveTo(to.x, to.y + to.r);
        ctx.lineTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // Nodes
  for (var i = 0; i < n; i++) {
    var p   = pos[i];
    if (!p) continue;
    var isRoot = parent[i] === i;
    var colKey = colors[i] || (isRoot ? 'ROOT' : 'DEFAULT');
    var col    = UF_COL[colKey] || UF_COL.DEFAULT;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle   = col.fill;
    ctx.fill();
    ctx.strokeStyle = col.stroke;
    ctx.lineWidth   = isRoot ? 2.5 : 1.5;
    ctx.stroke();

    // Crown for root
    if (isRoot) {
      ctx.fillStyle = '#f59e0b';
      ctx.font      = Math.min(10, p.r * 0.45) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('★', p.x, p.y - p.r - 4);
    }

    // Node label
    ctx.fillStyle    = col.text;
    ctx.font         = 'bold ' + Math.min(13, p.r * 0.7) + 'px "Fira Code", monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i), p.x, p.y);

    // Rank label (below node)
    ctx.fillStyle    = 'rgba(148,163,184,0.7)';
    ctx.font         = Math.min(9, p.r * 0.42) + 'px Poppins,sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText('r=' + ufDsu.rank[i], p.x, p.y + p.r + 3);
  }
}

/* ─── Update table ─── */
function ufUpdateTable(highlightActive, highlightPath) {
  var tbody = document.getElementById('ufTableBody');
  if (!tbody) return;
  var parent = ufDsu.parent;
  var rank   = ufDsu.rank;
  var n      = ufDsu.n;
  var colors = ufState.nodeColor;
  var html   = '';

  for (var i = 0; i < n; i++) {
    var isRoot  = parent[i] === i;
    var colKey  = colors[i] || (isRoot ? 'ROOT' : 'DEFAULT');
    var rowCls  = isRoot ? 'uf-row-root' : (colKey === 'ACTIVE' ? 'uf-row-active' : colKey === 'PATH' ? 'uf-row-path' : '');
    var root    = ufFindRoot(parent, i);
    html += '<tr class="' + rowCls + '">' +
      '<td>' + i + '</td>' +
      '<td>' + (isRoot ? '<span style="color:#f59e0b">self</span>' : parent[i]) + '</td>' +
      '<td>' + rank[i] + '</td>' +
      '<td>' + (isRoot ? '<span style="color:#f59e0b">' + i + '</span>' : root) + '</td>' +
    '</tr>';
  }
  tbody.innerHTML = html;
}

/* ─── Update components count ─── */
function ufUpdateComponents() {
  var el = document.getElementById('ufComponents');
  if (el) el.textContent = ufCountComponents(ufDsu.parent, ufDsu.n);
}

/* ─── Log ─── */
function ufAddLog(msg, type) {
  var log = document.getElementById('ufLog');
  if (!log) return;
  var empty = log.querySelector('.uf-log-empty');
  if (empty) empty.remove();
  var entry = document.createElement('div');
  entry.className = 'uf-log-entry ' + (type || '');
  entry.textContent = msg;
  log.insertBefore(entry, log.firstChild);
}

/* ─── Apply step ─── */
function ufApplyStep(step) {
  var statusEl = document.getElementById('ufStatus');

  if (step.msg && statusEl) {
    statusEl.textContent = step.msg;
    statusEl.className   = 'uf-status ' + (step.type && step.type.indexOf('union') !== -1 ? 'union' : step.type && step.type.indexOf('find') !== -1 ? 'find' : step.type === 'connected' ? 'conn' : step.type === 'complete' ? 'done' : '');
  }

  // Update DSU state from step if it carries parent/rank arrays
  if (step.parent) ufDsu.parent = step.parent.slice();
  if (step.rank)   ufDsu.rank   = step.rank.slice();

  // Update node color
  if (step.node !== undefined && step.node >= 0 && step.color) {
    ufState.nodeColor[step.node] = step.color;
  }

  if (step.type === 'path-compress' || step.type === 'compress') {
    ufState.nodeColor[step.node] = 'PATH';
  }

  if (step.type === 'connected') {
    ufDsu.parent.forEach(function(_, i) { ufState.nodeColor[i] = 'CONNECTED'; });
  }

  var canvas = document.getElementById('ufCanvas');
  if (canvas) {
    canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth : 600;
    var pos = ufLayout(canvas);
    ufDraw(pos);
  }

  ufUpdateTable();
  ufUpdateComponents();
  ufUpdateStepCounter();
}

/* ─── Playback ─── */
function ufGetDelay() {
  var el = document.getElementById('ufSpeed');
  return UF_SPEED_MAP[el ? el.value : 3] || 400;
}

function ufPlay() {
  if (ufState.playing) return;
  if (ufState.stepIdx >= ufState.steps.length) { ufState.stepIdx = 0; ufResetColors(); }
  ufState.playing = true;
  ufUpdatePlayBtns();
  ufPlayNext();
}

function ufPlayNext() {
  if (!ufState.playing) return;
  if (ufState.stepIdx >= ufState.steps.length) {
    ufState.playing = false;
    ufUpdatePlayBtns();
    return;
  }
  ufApplyStep(ufState.steps[ufState.stepIdx]);
  ufState.stepIdx++;
  ufState.timer = setTimeout(ufPlayNext, ufGetDelay());
}

function ufStopPlay() {
  ufState.playing = false;
  if (ufState.timer) { clearTimeout(ufState.timer); ufState.timer = null; }
  ufUpdatePlayBtns();
}

function ufStep() {
  if (ufState.playing) ufStopPlay();
  if (ufState.stepIdx >= ufState.steps.length) return;
  ufApplyStep(ufState.steps[ufState.stepIdx]);
  ufState.stepIdx++;
  ufUpdatePlayBtns();
}

function ufUpdatePlayBtns() {
  var stepBtn = document.getElementById('ufStepBtn');
  var playBtn = document.getElementById('ufPlayBtn');
  var hasSteps = ufState.steps.length > 0;
  if (stepBtn) stepBtn.disabled = !hasSteps || ufState.stepIdx >= ufState.steps.length;
  if (playBtn) playBtn.disabled = ufState.playing || !hasSteps || ufState.stepIdx >= ufState.steps.length;
}

function ufUpdateStepCounter() {
  var numEl = document.getElementById('ufStepNum');
  var totEl = document.getElementById('ufStepTotal');
  if (numEl) numEl.textContent = ufState.stepIdx;
  if (totEl) totEl.textContent = ufState.steps.length;
}

/* ─── Reset colors ─── */
function ufResetColors() {
  for (var i = 0; i < ufDsu.n; i++) {
    ufState.nodeColor[i] = ufDsu.parent[i] === i ? 'ROOT' : 'DEFAULT';
  }
}

/* ─── Validate input ─── */
function ufValidate(val, name) {
  var statusEl = document.getElementById('ufStatus');
  if (isNaN(val) || val < 0 || val >= ufDsu.n) {
    if (statusEl) { statusEl.textContent = name + ' must be between 0 and ' + (ufDsu.n - 1) + '.'; statusEl.className = 'uf-status'; }
    return false;
  }
  return true;
}

/* ─── Initialize ─── */
function ufDoInit() {
  ufStopPlay();
  var nEl = document.getElementById('ufNodeCount');
  var n   = parseInt(nEl ? nEl.value : 8);
  if (isNaN(n) || n < 2 || n > 12) {
    var statusEl = document.getElementById('ufStatus');
    if (statusEl) { statusEl.textContent = 'Enter a number between 2 and 12.'; }
    return;
  }

  ufDsu.n      = n;
  ufDsu.parent = [];
  ufDsu.rank   = [];
  for (var i = 0; i < n; i++) { ufDsu.parent.push(i); ufDsu.rank.push(0); }

  ufState.built     = true;
  ufState.steps     = [];
  ufState.stepIdx   = 0;
  ufState.nodeColor = [];
  ufState.logEntries = [];

  for (var i = 0; i < n; i++) ufState.nodeColor.push('ROOT');

  // Update input maxes
  ['ufUnionA','ufUnionB','ufFindX','ufConnA','ufConnB'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.max = n - 1;
  });

  var emptyEl = document.getElementById('ufCanvasEmpty');
  if (emptyEl) emptyEl.classList.add('hidden');

  var logEl = document.getElementById('ufLog');
  if (logEl) logEl.innerHTML = '<div class="uf-log-empty">No operations yet.</div>';

  var canvas = document.getElementById('ufCanvas');
  if (canvas) {
    canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth : 600;
    canvas.height = 280;
    var pos = ufLayout(canvas);
    ufDraw(pos);
  }

  ufUpdateTable();
  ufUpdateComponents();
  ufUpdateStepCounter();
  ufUpdatePlayBtns();

  var statusEl = document.getElementById('ufStatus');
  if (statusEl) { statusEl.textContent = 'Initialized ' + n + ' elements. Each is its own set. Run Union/Find operations below.'; statusEl.className = 'uf-status done'; }

  ufAddLog('Initialized DSU with ' + n + ' elements.', 'init');
}

/* ─── Operations ─── */
function ufDoUnion() {
  if (!ufState.built) { alert('Initialize the DSU first.'); return; }
  ufStopPlay();

  var aEl = document.getElementById('ufUnionA');
  var bEl = document.getElementById('ufUnionB');
  var a   = parseInt(aEl ? aEl.value : 0);
  var b   = parseInt(bEl ? bEl.value : 1);

  if (!ufValidate(a, 'A') || !ufValidate(b, 'B')) return;

  var useRank     = document.getElementById('ufUnionRank') ? document.getElementById('ufUnionRank').checked : true;
  var usePathComp = document.getElementById('ufPathComp')  ? document.getElementById('ufPathComp').checked  : true;

  ufResetColors();
  ufState.steps   = ufGenUnionSteps(a, b, useRank, usePathComp);
  ufState.stepIdx = 0;
  ufUpdateStepCounter();
  ufUpdatePlayBtns();

  var statusEl = document.getElementById('ufStatus');
  if (statusEl) { statusEl.textContent = 'Union(' + a + ', ' + b + ') ready. Press Step or Play to animate.'; statusEl.className = 'uf-status union'; }
  ufAddLog('Union(' + a + ', ' + b + ')', 'union');
}

function ufDoFind() {
  if (!ufState.built) { alert('Initialize the DSU first.'); return; }
  ufStopPlay();

  var xEl = document.getElementById('ufFindX');
  var x   = parseInt(xEl ? xEl.value : 0);
  if (!ufValidate(x, 'X')) return;

  var usePathComp = document.getElementById('ufPathComp') ? document.getElementById('ufPathComp').checked : true;

  ufResetColors();
  ufState.steps   = ufGenFindSteps(x, usePathComp);
  ufState.stepIdx = 0;
  ufUpdateStepCounter();
  ufUpdatePlayBtns();

  var statusEl = document.getElementById('ufStatus');
  if (statusEl) { statusEl.textContent = 'Find(' + x + ') ready. Press Step or Play to animate.'; statusEl.className = 'uf-status find'; }
  ufAddLog('Find(' + x + ')', 'find');
}

function ufDoConn() {
  if (!ufState.built) { alert('Initialize the DSU first.'); return; }
  ufStopPlay();

  var aEl = document.getElementById('ufConnA');
  var bEl = document.getElementById('ufConnB');
  var a   = parseInt(aEl ? aEl.value : 0);
  var b   = parseInt(bEl ? bEl.value : 1);

  if (!ufValidate(a, 'A') || !ufValidate(b, 'B')) return;

  ufResetColors();
  ufState.steps   = ufGenConnSteps(a, b);
  ufState.stepIdx = 0;
  ufUpdateStepCounter();
  ufUpdatePlayBtns();

  var statusEl = document.getElementById('ufStatus');
  if (statusEl) { statusEl.textContent = 'Connected?(' + a + ', ' + b + ') ready. Press Step or Play.'; statusEl.className = 'uf-status conn'; }
  ufAddLog('Connected?(' + a + ', ' + b + ')', 'conn');
}

function ufDoReset() {
  ufStopPlay();
  if (!ufState.built) return;
  ufResetColors();
  ufState.steps   = [];
  ufState.stepIdx = 0;
  ufUpdateStepCounter();
  ufUpdatePlayBtns();

  var canvas = document.getElementById('ufCanvas');
  if (canvas) {
    canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth : 600;
    var pos = ufLayout(canvas);
    ufDraw(pos);
  }

  ufUpdateTable();
  var statusEl = document.getElementById('ufStatus');
  if (statusEl) { statusEl.textContent = 'Animation reset. DSU state preserved.'; statusEl.className = 'uf-status'; }
}

/* ─── Init controls ─── */
function ufInitControls() {
  var initBtn  = document.getElementById('ufInitBtn');
  var unionBtn = document.getElementById('ufUnionBtn');
  var findBtn  = document.getElementById('ufFindBtn');
  var connBtn  = document.getElementById('ufConnBtn');
  var stepBtn  = document.getElementById('ufStepBtn');
  var playBtn  = document.getElementById('ufPlayBtn');
  var resetBtn = document.getElementById('ufResetBtn');
  var speedSl  = document.getElementById('ufSpeed');

  if (initBtn)  initBtn.addEventListener('click',  ufDoInit);
  if (unionBtn) unionBtn.addEventListener('click', ufDoUnion);
  if (findBtn)  findBtn.addEventListener('click',  ufDoFind);
  if (connBtn)  connBtn.addEventListener('click',  ufDoConn);
  if (stepBtn)  stepBtn.addEventListener('click',  ufStep);
  if (playBtn)  playBtn.addEventListener('click',  ufPlay);
  if (resetBtn) resetBtn.addEventListener('click', ufDoReset);

  if (speedSl) {
    speedSl.addEventListener('input', function() {
      var valEl = document.getElementById('ufSpeedVal');
      if (valEl) valEl.textContent = UF_SPEED_LABEL[speedSl.value] || 'Normal';
      if (ufState.playing) { ufStopPlay(); ufPlay(); }
    });
  }

  // Resize canvas on window resize
  window.addEventListener('resize', function() {
    if (!ufState.built) return;
    var canvas = document.getElementById('ufCanvas');
    if (!canvas) return;
    canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth : 600;
    var pos = ufLayout(canvas);
    ufDraw(pos);
  });

  // Auto-initialize on load
  ufDoInit();
}