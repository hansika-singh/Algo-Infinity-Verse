document.addEventListener('DOMContentLoaded', function () {
  ivtInit();
});

/* ── State ── */
var ivtRoot        = null;
var ivtIntervals   = [];
var ivtQueryState  = null;  // { lo, hi, visited, pruned, found }
var ivtNodePositions = {};  // id -> {x, y}
var ivtNodeIdCounter = 0;

var IVT_NODE_R  = 28;
var IVT_H_GAP   = 56;
var IVT_V_GAP   = 72;

/* ── BST Node ── */
function ivtCreateNode(lo, hi, label) {
  ivtNodeIdCounter++;
  return {
    id:    ivtNodeIdCounter,
    lo:    lo,
    hi:    hi,
    max:   hi,
    label: label || '',
    left:  null,
    right: null,
    state: '' // '', 'visited', 'overlap', 'pruned'
  };
}

/* ── Insert ── */
function ivtInsert(root, lo, hi, label) {
  if (!root) return ivtCreateNode(lo, hi, label);
  if (lo < root.lo) {
    root.left  = ivtInsert(root.left,  lo, hi, label);
  } else {
    root.right = ivtInsert(root.right, lo, hi, label);
  }
  root.max = ivtComputeMax(root);
  return root;
}

function ivtComputeMax(node) {
  if (!node) return -Infinity;
  var m = node.hi;
  if (node.left  && node.left.max  > m) m = node.left.max;
  if (node.right && node.right.max > m) m = node.right.max;
  return m;
}

/* ── Count nodes ── */
function ivtCountNodes(node) {
  if (!node) return 0;
  return 1 + ivtCountNodes(node.left) + ivtCountNodes(node.right);
}

/* ── Overlap check ── */
function ivtOverlaps(aLo, aHi, bLo, bHi) {
  return aLo <= bHi && bLo <= aHi;
}

/* ── Query — collect visited/pruned/found info ── */
function ivtQuery(node, qLo, qHi, visited, pruned, found) {
  if (!node) return;

  visited.push(node.id);
  node.state = 'visited';

  if (ivtOverlaps(node.lo, node.hi, qLo, qHi)) {
    node.state = 'overlap';
    found.push({ lo: node.lo, hi: node.hi, label: node.label, id: node.id });
  }

  if (node.left) {
    if (node.left.max >= qLo) {
      ivtQuery(node.left, qLo, qHi, visited, pruned, found);
    } else {
      ivtMarkPruned(node.left, pruned);
    }
  }

  if (node.right) {
    if (node.right.lo <= qHi) {
      ivtQuery(node.right, qLo, qHi, visited, pruned, found);
    } else {
      ivtMarkPruned(node.right, pruned);
    }
  }
}

function ivtMarkPruned(node, pruned) {
  if (!node) return;
  node.state = 'pruned';
  pruned.push(node.id);
  ivtMarkPruned(node.left, pruned);
  ivtMarkPruned(node.right, pruned);
}

/* ── Clear query state from all nodes ── */
function ivtClearStates(node) {
  if (!node) return;
  node.state = '';
  ivtClearStates(node.left);
  ivtClearStates(node.right);
}

/* ── Layout: assign x/y positions ── */
function ivtLayout(node, depth, leftBound, rightBound, positions) {
  if (!node) return;
  var x = (leftBound + rightBound) / 2;
  var y = 40 + depth * IVT_V_GAP;
  positions[node.id] = { x: x, y: y };
  ivtLayout(node.left,  depth + 1, leftBound, x, positions);
  ivtLayout(node.right, depth + 1, x, rightBound, positions);
}

function ivtTreeWidth(node) {
  if (!node) return 0;
  var leaves = ivtCountLeaves(node);
  return Math.max(leaves * (IVT_NODE_R * 2 + IVT_H_GAP), 300);
}

function ivtCountLeaves(node) {
  if (!node) return 1;
  return ivtCountLeaves(node.left) + ivtCountLeaves(node.right);
}

/* ── SVG Rendering ── */
function ivtRender() {
  var wrap = document.getElementById('ivtTreeWrap');
  var svg  = document.getElementById('ivtSvg');
  if (!svg || !wrap) return;

  if (!ivtRoot) {
    svg.setAttribute('width', 300);
    svg.setAttribute('height', 120);
    svg.innerHTML = '<text x="150" y="60" text-anchor="middle" fill="#64748b" font-size="13" font-family="Poppins,sans-serif">Insert intervals to build the tree.</text>';
    return;
  }

  var treeW = ivtTreeWidth(ivtRoot);
  var treeH = (ivtTreeDepth(ivtRoot) + 1) * IVT_V_GAP + 60;
  var W = Math.max(treeW, 300);
  var H = Math.max(treeH, 200);

  svg.setAttribute('width',  W);
  svg.setAttribute('height', H);

  var positions = {};
  ivtLayout(ivtRoot, 0, 0, W, positions);
  ivtNodePositions = positions;

  var html = '';

  html += ivtDrawEdges(ivtRoot, positions);
  html += ivtDrawNodes(ivtRoot, positions);

  svg.innerHTML = html;
}

function ivtTreeDepth(node) {
  if (!node) return 0;
  return 1 + Math.max(ivtTreeDepth(node.left), ivtTreeDepth(node.right));
}

function ivtDrawEdges(node, pos) {
  if (!node) return '';
  var html = '';
  var p = pos[node.id];

  if (node.left && pos[node.left.id]) {
    var c = pos[node.left.id];
    html += '<line x1="' + p.x + '" y1="' + p.y + '" x2="' + c.x + '" y2="' + c.y + '" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />';
    html += ivtDrawEdges(node.left, pos);
  }

  if (node.right && pos[node.right.id]) {
    var cr = pos[node.right.id];
    html += '<line x1="' + p.x + '" y1="' + p.y + '" x2="' + cr.x + '" y2="' + cr.y + '" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />';
    html += ivtDrawEdges(node.right, pos);
  }

  return html;
}

function ivtNodeFill(state) {
  if (state === 'overlap')  return '#22c55e';
  if (state === 'visited')  return '#a855f7';
  if (state === 'pruned')   return 'rgba(239,68,68,0.35)';
  return 'rgba(255,255,255,0.07)';
}

function ivtNodeStroke(state) {
  if (state === 'overlap')  return '#22c55e';
  if (state === 'visited')  return '#a855f7';
  if (state === 'pruned')   return '#ef4444';
  return 'rgba(255,255,255,0.18)';
}

function ivtDrawNodes(node, pos) {
  if (!node) return '';
  var p    = pos[node.id];
  var fill = ivtNodeFill(node.state);
  var stroke = ivtNodeStroke(node.state);
  var R = IVT_NODE_R;

  var html = '';

  html += '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + R + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="2" />';

  var loHi = '[' + node.lo + ',' + node.hi + ']';
  html += '<text x="' + p.x + '" y="' + (p.y - 5) + '" text-anchor="middle" font-size="9" font-family="Fira Code,monospace" font-weight="700" fill="#fff">' + loHi + '</text>';
  html += '<text x="' + p.x + '" y="' + (p.y + 8) + '" text-anchor="middle" font-size="8" font-family="Fira Code,monospace" fill="rgba(255,255,255,0.6)">max=' + node.max + '</text>';

  if (node.state === 'pruned') {
    html += '<text x="' + (p.x + R + 4) + '" y="' + (p.y + 3) + '" font-size="8" font-family="Poppins,sans-serif" fill="#ef4444">✂</text>';
  }

  html += ivtDrawNodes(node.left,  pos);
  html += ivtDrawNodes(node.right, pos);

  return html;
}

/* ── Timeline Canvas ── */
function ivtDrawTimeline() {
  var canvas = document.getElementById('ivtTimeline');
  if (!canvas) return;

  var parent = canvas.parentElement;
  var W = parent ? parent.clientWidth - 20 : 260;
  canvas.width  = Math.max(W, 200);
  canvas.height = Math.max(200, 18 + ivtIntervals.length * 20 + 50);

  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!ivtIntervals.length) {
    ctx.fillStyle = '`#64748b`';
    ctx.font = '12px Poppins,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No intervals inserted.', canvas.width / 2, canvas.height / 2);
    return;
  }

  var allLo  = ivtIntervals.map(function (iv) { return iv.lo; });
  var allHi  = ivtIntervals.map(function (iv) { return iv.hi; });
  var minVal = Math.min.apply(null, allLo);
  var maxVal = Math.max.apply(null, allHi);

  if (ivtQueryState) {
    minVal = Math.min(minVal, ivtQueryState.lo);
    maxVal = Math.max(maxVal, ivtQueryState.hi);
  }

  var range = maxVal - minVal || 1;
  var padX  = 30;
  var barH  = 14;
  var barGap = 6;
  var startY = 18;

  function toX(v) {
    return padX + ((v - minVal) / range) * (canvas.width - padX * 2);
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padX, canvas.height - 22);
  ctx.lineTo(canvas.width - padX, canvas.height - 22);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '10px Fira Code,monospace';
  ctx.textAlign = 'center';
  [minVal, Math.round((minVal + maxVal) / 2), maxVal].forEach(function (v) {
    ctx.fillText(v, toX(v), canvas.height - 8);
  });

  ivtIntervals.forEach(function (iv, idx) {
    var y    = startY + idx * (barH + barGap);
    var x1   = toX(iv.lo);
    var x2   = toX(iv.hi);
    var w    = Math.max(x2 - x1, 4);

    var found = ivtQueryState && ivtQueryState.found.some(function (f) { return f.lo === iv.lo && f.hi === iv.hi; });
    ctx.fillStyle = found ? 'rgba(34,197,94,0.7)' : 'rgba(168,85,247,0.45)';
    ctx.strokeStyle = found ? '`#22c55e`' : 'rgba(168,85,247,0.7)';
    ctx.lineWidth = 1.5;

    var rad = 4;
    ctx.beginPath();
    ctx.moveTo(x1 + rad, y);
    ctx.lineTo(x2 - rad, y);
    ctx.quadraticCurveTo(x2, y, x2, y + rad);
    ctx.lineTo(x2, y + barH - rad);
    ctx.quadraticCurveTo(x2, y + barH, x2 - rad, y + barH);
    ctx.lineTo(x1 + rad, y + barH);
    ctx.quadraticCurveTo(x1, y + barH, x1, y + barH - rad);
    ctx.lineTo(x1, y + rad);
    ctx.quadraticCurveTo(x1, y, x1 + rad, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '`#fff`';
    ctx.font = '9px Fira Code,monospace';
    ctx.textAlign = 'left';
    var lbl = '[' + iv.lo + ',' + iv.hi + ']' + (iv.label ? ' ' + iv.label : '');
    ctx.fillText(lbl.slice(0, 18), x1 + 3, y + barH - 3);
  });

  if (ivtQueryState) {
    var qx1 = toX(ivtQueryState.lo);
    var qx2 = toX(ivtQueryState.hi);
    var qw  = Math.max(qx2 - qx1, 4);
    var qy  = canvas.height - 42;

    ctx.fillStyle = 'rgba(245,158,11,0.2)';
    ctx.strokeStyle = '`#f59e0b`';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(qx1, qy, qw, barH);
    ctx.fillRect(qx1, qy, qw, barH);
    ctx.setLineDash([]);

    ctx.fillStyle = '`#f59e0b`';
    ctx.font = '9px Poppins,sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Query [' + ivtQueryState.lo + ',' + ivtQueryState.hi + ']', qx1, qy + barH - 3);
  }
}
/* ── Stats panel ── */
function ivtUpdateStats() {
  var total   = document.getElementById('ivtStatTotal');
  var visited = document.getElementById('ivtStatVisited');
  var pruned  = document.getElementById('ivtStatPruned');
  var found   = document.getElementById('ivtStatFound');

  var n = ivtCountNodes(ivtRoot);
  if (total) total.textContent = n;

  if (!ivtQueryState) {
    if (visited) visited.textContent = '—';
    if (pruned)  pruned.textContent  = '—';
    if (found)   found.textContent   = '—';
    return;
  }

  if (visited) visited.textContent = ivtQueryState.visited.length;
  if (pruned)  pruned.textContent  = ivtQueryState.pruned.length;
  if (found)   found.textContent   = ivtQueryState.found.length;
}

/* ── Results panel ── */
function ivtUpdateResults() {
  var card = document.getElementById('ivtResultCard');
  var list = document.getElementById('ivtResultList');
  if (!card || !list) return;

  if (!ivtQueryState || !ivtQueryState.found.length) {
    card.style.display = 'none';
    return;
  }

  card.style.display = 'block';
  list.innerHTML = ivtQueryState.found.map(function (f) {
    return (
      '<div class="ivt-result-item">' +
        '<span class="ivt-result-range">[' + f.lo + ', ' + f.hi + ']</span>' +
        '<span class="ivt-result-label">' + ivtEscape(f.label || '') + '</span>' +
      '</div>'
    );
  }).join('');
}

/* ── Inserted intervals panel ── */
function ivtUpdateInsertedList() {
  var el = document.getElementById('ivtInsertedList');
  if (!el) return;

  if (!ivtIntervals.length) {
    el.innerHTML = '<span class="ivt-empty-text">No intervals yet.</span>';
    return;
  }

  el.innerHTML = ivtIntervals.map(function (iv) {
    return (
      '<div class="ivt-inserted-item">' +
        '<span class="ivt-ins-range">[' + iv.lo + ', ' + iv.hi + ']</span>' +
        '<span class="ivt-ins-label">' + ivtEscape(iv.label || '') + '</span>' +
      '</div>'
    );
  }).join('');
}

/* ── Master render ── */
function ivtRenderAll() {
  ivtRender();
  ivtDrawTimeline();
  ivtUpdateStats();
  ivtUpdateResults();
  ivtUpdateInsertedList();
}

/* ── Actions ── */
function ivtDoInsert() {
  var loEl    = document.getElementById('ivtInsertLo');
  var hiEl    = document.getElementById('ivtInsertHi');
  var labelEl = document.getElementById('ivtInsertLabel');

  var lo    = parseInt(loEl ? loEl.value : 0, 10);
  var hi    = parseInt(hiEl ? hiEl.value : 0, 10);
  var label = labelEl ? labelEl.value.trim() : '';

  if (isNaN(lo) || isNaN(hi)) {
    ivtSetStatus('Please enter valid numbers for the interval.', 'err');
    return;
  }

  if (lo > hi) {
    var tmp = lo; lo = hi; hi = tmp;
  }

  ivtClearStates(ivtRoot);
  ivtQueryState = null;
  ivtRoot = ivtInsert(ivtRoot, lo, hi, label);
  ivtIntervals.push({ lo: lo, hi: hi, label: label });

  if (labelEl) labelEl.value = '';

  ivtSetStatus(
    'Inserted [' + lo + ', ' + hi + ']. ' +
    'Ancestors updated with new max values up to root (max=' + ivtRoot.max + ').',
    'ok'
  );
  ivtRenderAll();
}

function ivtDoQuery() {
  if (!ivtRoot) {
    ivtSetStatus('Insert some intervals first.', 'warn');
    return;
  }

  var loEl = document.getElementById('ivtQueryLo');
  var hiEl = document.getElementById('ivtQueryHi');
  var lo   = parseInt(loEl ? loEl.value : 0, 10);
  var hi   = parseInt(hiEl ? hiEl.value : 0, 10);

  if (isNaN(lo) || isNaN(hi)) {
    ivtSetStatus('Please enter valid query range.', 'err');
    return;
  }

  if (lo > hi) {
    var tmp = lo; lo = hi; hi = tmp;
  }

  ivtClearStates(ivtRoot);

  var visited = [];
  var pruned  = [];
  var found   = [];

  ivtQuery(ivtRoot, lo, hi, visited, pruned, found);

  ivtQueryState = { lo: lo, hi: hi, visited: visited, pruned: pruned, found: found };

  var total = ivtCountNodes(ivtRoot);
  var pct   = total > 0 ? Math.round((pruned.length / total) * 100) : 0;

  if (found.length) {
    ivtSetStatus(
      'Query [' + lo + ', ' + hi + ']: found ' + found.length + ' overlap(s). ' +
      'Visited ' + visited.length + '/' + total + ' nodes, pruned ' + pruned.length + ' (' + pct + '%) via max augmentation.',
      'ok'
    );
  } else {
    ivtSetStatus(
      'Query [' + lo + ', ' + hi + ']: no overlaps found. ' +
      'Visited ' + visited.length + '/' + total + ' nodes, pruned ' + pruned.length + ' (' + pct + '%) via max augmentation.',
      'warn'
    );
  }

  ivtRenderAll();
}

function ivtLoadCalendar() {
  ivtReset();
  var events = [
    { lo: 9,  hi: 10, label: 'Standup' },
    { lo: 10, hi: 11, label: 'Code review' },
    { lo: 11, hi: 13, label: 'Deep work' },
    { lo: 13, hi: 14, label: 'Lunch' },
    { lo: 14, hi: 15, label: '1:1 with manager' },
    { lo: 15, hi: 17, label: 'Sprint planning' },
    { lo: 12, hi: 14, label: 'Guest lecture' },
    { lo: 16, hi: 18, label: 'Demo prep' }
  ];

  events.forEach(function (ev) {
    ivtRoot = ivtInsert(ivtRoot, ev.lo, ev.hi, ev.label);
    ivtIntervals.push(ev);
  });

  var loEl = document.getElementById('ivtQueryLo');
  var hiEl = document.getElementById('ivtQueryHi');
  if (loEl) loEl.value = 12;
  if (hiEl) hiEl.value = 15;

  ivtSetStatus('Loaded 8 calendar events (hours 9–18). Query is pre-set to [12,15] — click "Find Overlaps" to see which meetings conflict.', 'info');
  ivtRenderAll();
}

function ivtLoadRandom() {
  ivtReset();
  var count = 10;
  for (var i = 0; i < count; i++) {
    var lo = Math.floor(Math.random() * 80);
    var hi = lo + Math.floor(Math.random() * 20) + 1;
    ivtRoot = ivtInsert(ivtRoot, lo, hi, '');
    ivtIntervals.push({ lo: lo, hi: hi, label: '' });
  }
  ivtSetStatus('Inserted ' + count + ' random intervals. Try querying any range to see pruning.', 'info');
  ivtRenderAll();
}

function ivtReset() {
  ivtRoot        = null;
  ivtIntervals   = [];
  ivtQueryState  = null;
  ivtNodeIdCounter = 0;
  ivtNodePositions = {};

  var resultCard = document.getElementById('ivtResultCard');
  if (resultCard) resultCard.style.display = 'none';

  ivtSetStatus('Reset. Insert intervals or load a preset.', 'info');
  ivtRenderAll();
}

function ivtSetStatus(msg, cls) {
  var el = document.getElementById('ivtStatus');
  if (!el) return;
  el.textContent = msg;
  el.className   = 'ivt-status ' + (cls || '');
}

function ivtEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* ── Init ── */
function ivtInit() {
  ivtRenderAll();

  var insertBtn  = document.getElementById('ivtInsertBtn');
  var queryBtn   = document.getElementById('ivtQueryBtn');
  var calBtn     = document.getElementById('ivtCalendarBtn');
  var randBtn    = document.getElementById('ivtRandomBtn');
  var resetBtn   = document.getElementById('ivtResetBtn');
  var loEl       = document.getElementById('ivtInsertLo');
  var hiEl       = document.getElementById('ivtInsertHi');
  var labelEl    = document.getElementById('ivtInsertLabel');
  var qLoEl      = document.getElementById('ivtQueryLo');
  var qHiEl      = document.getElementById('ivtQueryHi');

  if (insertBtn) insertBtn.addEventListener('click', ivtDoInsert);
  if (queryBtn)  queryBtn.addEventListener('click',  ivtDoQuery);
  if (calBtn)    calBtn.addEventListener('click',    ivtLoadCalendar);
  if (randBtn)   randBtn.addEventListener('click',   ivtLoadRandom);
  if (resetBtn)  resetBtn.addEventListener('click',  ivtReset);

  function onEnterInsert(e) { if (e.key === 'Enter') ivtDoInsert(); }
  if (loEl)    loEl.addEventListener('keydown',    onEnterInsert);
  if (hiEl)    hiEl.addEventListener('keydown',    onEnterInsert);
  if (labelEl) labelEl.addEventListener('keydown', onEnterInsert);
  function onEnterQuery(e) { if (e.key === 'Enter') ivtDoQuery(); }
  if (qLoEl) qLoEl.addEventListener('keydown', onEnterQuery);
  if (qHiEl) qHiEl.addEventListener('keydown', onEnterQuery);
  window.addEventListener('resize', function () {
    ivtDrawTimeline();
    ivtRender();
  });
}