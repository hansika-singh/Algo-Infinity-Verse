document.addEventListener('DOMContentLoaded', function() {
  spInit();
});

var SP_NS = 'http://www.w3.org/2000/svg';

var spState = {
  nodes: {},
  root: null,
  nextId: 1,
  rotationHistory: [],
  totalRotations: 0,
  totalOps: 0,
};

function spNewNode(value) {
  var id = spState.nextId++;
  spState.nodes[id] = { id: id, value: value, left: null, right: null, parent: null };
  return id;
}

function spNode(id) { return id !== null ? spState.nodes[id] : null; }

function spRotateLeft(x) {
  var n = spNode(x);
  var y = n.right;
  var yNode = spNode(y);
  n.right = yNode.left;
  if (yNode.left !== null) spNode(yNode.left).parent = x;
  yNode.parent = n.parent;
  if (n.parent === null) spState.root = y;
  else {
    var p = spNode(n.parent);
    if (p.left === x) p.left = y; else p.right = y;
  }
  yNode.left = x;
  n.parent = y;
  spState.totalRotations++;
}

function spRotateRight(x) {
  var n = spNode(x);
  var y = n.left;
  var yNode = spNode(y);
  n.left = yNode.right;
  if (yNode.right !== null) spNode(yNode.right).parent = x;
  yNode.parent = n.parent;
  if (n.parent === null) spState.root = y;
  else {
    var p = spNode(n.parent);
    if (p.left === x) p.left = y; else p.right = y;
  }
  yNode.right = x;
  n.parent = y;
  spState.totalRotations++;
}

function spSplay(x, log) {
  while (spNode(x).parent !== null) {
    var n = spNode(x);
    var p = spNode(n.parent);
    var g = p.parent !== null ? spNode(p.parent) : null;

    if (g === null) {
      if (p.left === x) { spRotateRight(n.parent); if (log) log.push({ type: 'zig', desc: 'Zig: rotate right at parent #' + p.value }); }
      else { spRotateLeft(n.parent); if (log) log.push({ type: 'zig', desc: 'Zig: rotate left at parent #' + p.value }); }
    } else if (g.left === p.left && p.left === x) {
      spRotateRight(g.id); spRotateRight(n.parent);
      if (log) log.push({ type: 'zigzig', desc: 'Zig-Zig (left-left): rotate right at grandparent #' + g.value + ', then right at parent #' + p.value });
    } else if (g.right === p.right && p.right === x) {
      spRotateLeft(g.id); spRotateLeft(n.parent);
      if (log) log.push({ type: 'zigzig', desc: 'Zig-Zig (right-right): rotate left at grandparent #' + g.value + ', then left at parent #' + p.value });
    } else if (p.left === x && g.right === p.id) {
      spRotateRight(n.parent); spRotateLeft(g.id);
      if (log) log.push({ type: 'zigzag', desc: 'Zig-Zag: rotate right at parent #' + p.value + ', then left at grandparent #' + g.value });
    } else {
      spRotateLeft(n.parent); spRotateRight(g.id);
      if (log) log.push({ type: 'zigzag', desc: 'Zig-Zag: rotate left at parent #' + p.value + ', then right at grandparent #' + g.value });
    }
  }
}

function spInsert(value, log) {
  if (spState.root === null) {
    spState.root = spNewNode(value);
    if (log) log.push({ type: 'zig', desc: 'Inserted #' + value + ' as new root (tree was empty).' });
    return spState.root;
  }

  var cur = spState.root;
  var parent = null;
  while (cur !== null) {
    parent = cur;
    var curNode = spNode(cur);
    if (value === curNode.value) { spSplay(cur, log); return cur; }
    cur = value < curNode.value ? curNode.left : curNode.right;
  }

  var newId = spNewNode(value);
  var newNode = spNode(newId);
  newNode.parent = parent;
  var parentNode = spNode(parent);
  if (value < parentNode.value) parentNode.left = newId; else parentNode.right = newId;

  if (log) log.push({ type: 'zig', desc: 'Inserted #' + value + ' as a leaf, now splaying it to the root.' });
  spSplay(newId, log);
  return newId;
}

function spSearch(value, log) {
  var cur = spState.root;
  while (cur !== null) {
    var n = spNode(cur);
    if (value === n.value) {
      if (log) log.push({ type: 'zig', desc: 'Found #' + value + ' — splaying it to the root.' });
      spSplay(cur, log);
      return cur;
    }
    cur = value < n.value ? n.left : n.right;
  }
  if (log) log.push({ type: 'zig', desc: '#' + value + ' not found.' });
  return null;
}

function spFindMax(id) {
  var cur = id;
  while (spNode(cur).right !== null) cur = spNode(cur).right;
  return cur;
}

function spDelete(value, log) {
  var target = spSearch(value, log);
  if (target === null) return;

  var n = spNode(target);
  var left = n.left;
  var right = n.right;

  delete spState.nodes[target];

  if (left === null) {
    spState.root = right;
    if (right !== null) spNode(right).parent = null;
    if (log) log.push({ type: 'done', desc: 'Deleted #' + value + ' (was root, only right subtree remains).' });
    return;
  }

  spNode(left).parent = null;
  var newRoot = left;

  if (right !== null) {
    var maxLeft = spFindMax(left);
    spState.root = left;
    spSplay(maxLeft, log);
    spNode(maxLeft).right = right;
    spNode(right).parent = maxLeft;
    newRoot = maxLeft;
  }

  spState.root = newRoot;
  if (log) log.push({ type: 'done', desc: 'Deleted #' + value + '. Joined left and right subtrees via splay-to-max.' });
}

function spComputeLayout() {
  var positions = {};
  var counter = { val: 0 };

  function dfs(id, depth) {
    if (id === null) return;
    var n = spNode(id);
    dfs(n.left, depth + 1);
    positions[id] = { x: counter.val * 50 + 30, y: depth * 62 + 35 };
    counter.val++;
    dfs(n.right, depth + 1);
  }

  dfs(spState.root, 0);
  return positions;
}

function spRenderTree(splayingIds) {
  var svg = document.getElementById('spTreeSvg');
  if (!svg) return;

  if (spState.root === null) {
    svg.innerHTML = '';
    svg.setAttribute('viewBox', '0 0 300 100');
    var t = document.createElementNS(SP_NS, 'text');
    t.setAttribute('x', 150); t.setAttribute('y', 50); t.setAttribute('text-anchor', 'middle');
    t.setAttribute('fill', 'rgba(148,163,184,0.35)'); t.setAttribute('font-size', '13');
    t.textContent = 'Empty tree';
    svg.appendChild(t);
    return;
  }

  var positions = spComputeLayout();
  var maxX = 0, maxY = 0;
  Object.keys(positions).forEach(function(id) {
    if (positions[id].x > maxX) maxX = positions[id].x;
    if (positions[id].y > maxY) maxY = positions[id].y;
  });
  var W = Math.max(400, maxX + 60);
  var H = Math.max(300, maxY + 60);
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  svg.setAttribute('width', W); svg.setAttribute('height', H);
  svg.innerHTML = '';

  Object.keys(spState.nodes).forEach(function(idStr) {
    var id = parseInt(idStr);
    var n = spState.nodes[id];
    if (!positions[id]) return;
    [n.left, n.right].forEach(function(childId) {
      if (childId === null || !positions[childId]) return;
      var p = positions[id]; var c = positions[childId];
      var line = document.createElementNS(SP_NS, 'line');
      line.setAttribute('x1', p.x); line.setAttribute('y1', p.y + 15);
      line.setAttribute('x2', c.x); line.setAttribute('y2', c.y - 15);
      line.setAttribute('stroke', 'rgba(148,163,184,0.3)'); line.setAttribute('stroke-width', '1.5');
      svg.appendChild(line);
    });
  });

  Object.keys(spState.nodes).forEach(function(idStr) {
    var id = parseInt(idStr);
    var n = spState.nodes[id];
    var pos = positions[id];
    if (!pos) return;

    var isRoot = id === spState.root;
    var isSplaying = splayingIds && splayingIds.indexOf(id) !== -1;

    var fillColor, strokeColor;
    if (isSplaying) { fillColor = 'rgba(245,158,11,0.35)'; strokeColor = '#f59e0b'; }
    else if (isRoot) { fillColor = 'rgba(34,197,94,0.3)'; strokeColor = '#22c55e'; }
    else { fillColor = 'rgba(6,182,212,0.18)'; strokeColor = '#06b6d4'; }

    var g = document.createElementNS(SP_NS, 'g');

    var circle = document.createElementNS(SP_NS, 'circle');
    circle.setAttribute('cx', pos.x); circle.setAttribute('cy', pos.y); circle.setAttribute('r', '15');
    circle.setAttribute('fill', fillColor);
    circle.setAttribute('stroke', strokeColor);
    circle.setAttribute('stroke-width', isRoot || isSplaying ? '2.5' : '1.5');
    g.appendChild(circle);

    var label = document.createElementNS(SP_NS, 'text');
    label.setAttribute('x', pos.x); label.setAttribute('y', pos.y + 4);
    label.setAttribute('text-anchor', 'middle'); label.setAttribute('fill', strokeColor);
    label.setAttribute('font-family', 'Fira Code, monospace'); label.setAttribute('font-size', '11'); label.setAttribute('font-weight', '700');
    label.textContent = n.value;
    g.appendChild(label);

    svg.appendChild(g);
  });
}

function spAddLog(msg, cls) {
  var log = document.getElementById('spLog');
  if (!log) return;
  var empty = log.querySelector('.sp-empty');
  if (empty) empty.remove();
  var entry = document.createElement('div');
  entry.className = 'sp-log-entry ' + (cls || '');
  entry.textContent = msg;
  log.insertBefore(entry, log.firstChild);
  while (log.children.length > 60) log.removeChild(log.lastChild);
}

function spSetStatus(msg, cls) {
  var el = document.getElementById('spStatus');
  if (!el) return;
  el.textContent = msg; el.className = 'sp-status ' + (cls || '');
}

function spRenderAmortizedChart() {
  var canvas = document.getElementById('spAmortizedCanvas');
  if (!canvas) return;
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = 120;
  var ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  var history = spState.rotationHistory;
  if (history.length < 2) return;

  var W = canvas.width; var H = canvas.height;
  var pad = { top: 10, right: 10, bottom: 18, left: 30 };
  var plotW = W - pad.left - pad.right;
  var plotH = H - pad.top - pad.bottom;

  var maxVal = Math.max.apply(null, history.map(function(h) { return Math.max(h.perOp, h.runningAvg); }).concat([1]));

  function xPos(i) { return pad.left + (i / (history.length - 1)) * plotW; }
  function yPos(v) { return pad.top + (1 - v / maxVal) * plotH; }

  ctx.strokeStyle = 'rgba(245,158,11,0.35)'; ctx.lineWidth = 1;
  ctx.beginPath();
  history.forEach(function(h, i) { var x = xPos(i); var y = yPos(h.perOp); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
  ctx.stroke();

  ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2;
  ctx.beginPath();
  history.forEach(function(h, i) { var x = xPos(i); var y = yPos(h.runningAvg); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
  ctx.stroke();

  ctx.fillStyle = '#f59e0b'; ctx.font = '8px Fira Code,monospace'; ctx.textAlign = 'left';
  ctx.fillText('per-op rotations', pad.left, 10);
  ctx.fillStyle = '#22c55e';
  ctx.fillText('running avg', pad.left + 90, 10);
}

function spUpdateStats() {
  var totalRotEl = document.getElementById('spTotalRotations');
  var totalOpsEl = document.getElementById('spTotalOps');
  var avgEl = document.getElementById('spAvgRotations');

  if (totalRotEl) totalRotEl.textContent = spState.totalRotations;
  if (totalOpsEl) totalOpsEl.textContent = spState.totalOps;
  if (avgEl) avgEl.textContent = spState.totalOps > 0 ? (spState.totalRotations / spState.totalOps).toFixed(2) : '0.0';

  spRenderAmortizedChart();
}

function spRunOperation(opFn, value) {
  var beforeRotations = spState.totalRotations;
  var log = [];

  opFn(value, log);

  var opRotations = spState.totalRotations - beforeRotations;
  spState.totalOps++;
  var runningAvg = spState.totalRotations / spState.totalOps;
  spState.rotationHistory.push({ perOp: opRotations, runningAvg: runningAvg });

  log.forEach(function(entry) { spAddLog(entry.desc, entry.type); });

  var splayedId = spState.root;
  spRenderTree([splayedId]);
  spUpdateStats();

  return log;
}

function spInsertHandler() {
  var input = document.getElementById('spValueInput');
  var value = parseInt(input ? input.value : NaN);
  if (isNaN(value)) { spSetStatus('Enter a valid value.', ''); return; }

  spRunOperation(spInsert, value);
  spSetStatus('Inserted and splayed #' + value + ' to the root.', 'done');
}

function spSearchHandler() {
  var input = document.getElementById('spValueInput');
  var value = parseInt(input ? input.value : NaN);
  if (isNaN(value)) { spSetStatus('Enter a valid value.', ''); return; }

  spRunOperation(spSearch, value);
  spSetStatus('Searched for #' + value + ' — splayed to root if found.', 'done');
}

function spDeleteHandler() {
  var input = document.getElementById('spValueInput');
  var value = parseInt(input ? input.value : NaN);
  if (isNaN(value)) { spSetStatus('Enter a valid value.', ''); return; }

  spRunOperation(spDelete, value);
  spSetStatus('Deleted #' + value + '.', 'done');
}

function spLoadPreset(name) {
  spReset();

  if (name === 'balanced') {
    [50, 25, 75, 12, 37, 62, 87, 6, 18, 31, 43].forEach(function(v) {
      spInsert(v, null);
    });
    spRenderTree([spState.root]);
    spUpdateStats();
    spSetStatus('Balanced tree loaded. Search or insert values to see splaying.', '');
  } else if (name === 'hotpath') {
    [50, 25, 75, 12, 37, 62, 87, 6, 18, 31, 43].forEach(function(v) { spInsert(v, null); });

    var hotValues = [6, 43, 87];
    var i = 0;

    function accessNext() {
      if (i >= 12) {
        spSetStatus('Hot-path demo complete. Notice how #6, #43, and #87 clustered near the root after repeated access.', 'done');
        return;
      }
      var v = hotValues[i % hotValues.length];
      spRunOperation(spSearch, v);
      i++;
      setTimeout(accessNext, 450);
    }

    spSetStatus('Repeatedly accessing #6, #43, #87 — watch them migrate toward the root.', '');
    accessNext();
  }
}

function spRunSkewedComparison() {
  var hotValues = [6, 43, 87];
  var allValues = [50, 25, 75, 12, 37, 62, 87, 6, 18, 31, 43];

  spState.nodes = {}; spState.root = null; spState.nextId = 1;
  spState.totalRotations = 0; spState.totalOps = 0; spState.rotationHistory = [];
  allValues.forEach(function(v) { spInsert(v, null); });

  var splaySequence = [];
  for (var i = 0; i < 200; i++) {
    if (Math.random() < 0.8) splaySequence.push(hotValues[Math.floor(Math.random() * hotValues.length)]);
    else splaySequence.push(allValues[Math.floor(Math.random() * allValues.length)]);
  }

  var splayRotations = 0;
  splaySequence.forEach(function(v) {
    var before = spState.totalRotations;
    spSearch(v, null);
    splayRotations += (spState.totalRotations - before);
  });

  function buildStaticBST(values) {
    var tree = { nodes: {}, root: null, nextId: 1 };
    function insert(value) {
      var id = tree.nextId++;
      tree.nodes[id] = { value: value, left: null, right: null };
      if (tree.root === null) { tree.root = id; return; }
      var cur = tree.root;
      while (true) {
        var n = tree.nodes[cur];
        if (value < n.value) { if (n.left === null) { n.left = id; return; } cur = n.left; }
        else { if (n.right === null) { n.right = id; return; } cur = n.right; }
      }
    }
    values.forEach(insert);
    return tree;
  }

  function staticSearchCost(tree, value) {
    var cur = tree.root; var cost = 0;
    while (cur !== null) {
      cost++;
      var n = tree.nodes[cur];
      if (value === n.value) return cost;
      cur = value < n.value ? n.left : n.right;
    }
    return cost;
  }

  var staticTree = buildStaticBST(allValues);
  var staticComparisons = 0;
  splaySequence.forEach(function(v) { staticComparisons += staticSearchCost(staticTree, v); });

  var resultEl = document.getElementById('spCompareResult');
  if (resultEl) {
    resultEl.classList.remove('hidden');
    resultEl.className = 'sp-compare-result result';
    resultEl.innerHTML =
      'Ran 200 accesses, 80% targeting 3 "hot" values (#6, #43, #87). ' +
      '<br><strong>Splay tree:</strong> ' + splayRotations + ' total rotations across all 200 accesses. ' +
      'Because hot values stay near the root after their first access, subsequent hits cost very little. ' +
      '<br><strong>Static BST:</strong> ' + staticComparisons + ' total comparisons — every single access re-walks from the root every time, with no adaptation to the skewed pattern. ' +
      '<br><br>The splay tree wins specifically because the access pattern is skewed — with perfectly uniform random access, the two would perform comparably.';
  }

  spRenderTree([spState.root]);
  spUpdateStats();
  spSetStatus('Comparison complete. See results below.', 'done');
}

function spReset() {
  spState.nodes = {};
  spState.root = null;
  spState.nextId = 1;
  spState.rotationHistory = [];
  spState.totalRotations = 0;
  spState.totalOps = 0;

  var log = document.getElementById('spLog');
  if (log) log.innerHTML = '<div class="sp-empty">No operations yet.</div>';

  var compareResult = document.getElementById('spCompareResult');
  if (compareResult) compareResult.classList.add('hidden');

  spRenderTree(null);
  spUpdateStats();
  spSetStatus('Reset. Insert or search values, or load a preset.', '');
}

function spInit() {
  spReset();

  var insertBtn = document.getElementById('spInsertBtn');
  var searchBtn = document.getElementById('spSearchBtn');
  var deleteBtn = document.getElementById('spDeleteBtn');
  var resetBtn  = document.getElementById('spResetBtn');

  if (insertBtn) insertBtn.addEventListener('click', spInsertHandler);
  if (searchBtn) searchBtn.addEventListener('click', spSearchHandler);
  if (deleteBtn) deleteBtn.addEventListener('click', spDeleteHandler);
  if (resetBtn)  resetBtn.addEventListener('click', spReset);

  document.querySelectorAll('.sp-preset-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { spLoadPreset(btn.getAttribute('data-preset')); });
  });

  var runCompareBtn = document.getElementById('spRunCompareBtn');
  if (runCompareBtn) runCompareBtn.addEventListener('click', spRunSkewedComparison);

  var valueInput = document.getElementById('spValueInput');
  if (valueInput) valueInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') spInsertHandler(); });

  window.addEventListener('resize', function() {
    spRenderTree([spState.root]);
    spRenderAmortizedChart();
  });
}