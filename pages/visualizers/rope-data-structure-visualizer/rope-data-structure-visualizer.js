document.addEventListener('DOMContentLoaded', function() {
  rpInit();
});

var RP_NS = 'http://www.w3.org/2000/svg';
var RP_LEAF_MAX = 6;

var rpState = { root: null, nextId: 1, ropeCost: 0, naiveCost: 0 };

function rpMakeLeaf(str) { return { id: rpState.nextId++, isLeaf: true, str: str, weight: str.length }; }
function rpMakeInternal(left, right) {
  return { id: rpState.nextId++, isLeaf: false, left: left, right: right, weight: rpLength(left) };
}

function rpLength(node) {
  if (node === null) return 0;
  return node.isLeaf ? node.str.length : node.weight + rpLength(node.right);
}

function rpToString(node) {
  if (node === null) return '';
  return node.isLeaf ? node.str : rpToString(node.left) + rpToString(node.right);
}

function rpBuild(str) {
  if (str.length <= RP_LEAF_MAX) return rpMakeLeaf(str);
  var mid = Math.floor(str.length / 2);
  return rpMakeInternal(rpBuild(str.slice(0, mid)), rpBuild(str.slice(mid)));
}

function rpIndex(node, i, path) {
  if (node.isLeaf) { if (path) path.push(node.id); return node.str[i]; }
  if (path) path.push(node.id);
  if (i < node.weight) return rpIndex(node.left, i, path);
  return rpIndex(node.right, i - node.weight, path);
}

function rpSplit(node, i) {
  if (node === null) return [null, null];
  if (node.isLeaf) return [rpMakeLeaf(node.str.slice(0, i)), rpMakeLeaf(node.str.slice(i))];

  if (i < node.weight) {
    var parts = rpSplit(node.left, i);
    return [parts[0], rpConcat(parts[1], node.right)];
  } else if (i > node.weight) {
    var parts2 = rpSplit(node.right, i - node.weight);
    return [rpConcat(node.left, parts2[0]), parts2[1]];
  } else {
    return [node.left, node.right];
  }
}

function rpConcat(left, right) {
  if (left === null) return right;
  if (right === null) return left;
  return rpMakeInternal(left, right);
}

function rpInsertAt(root, pos, text) {
  var parts = rpSplit(root, pos);
  var middle = rpBuild(text);
  return rpConcat(rpConcat(parts[0], middle), parts[1]);
}

function rpDeleteRange(root, start, end) {
  var partsA = rpSplit(root, start);
  var partsB = rpSplit(partsA[1], end - start);
  return rpConcat(partsA[0], partsB[1]);
}

function rpTreeDepth(node) {
  if (node === null) return 0;
  if (node.isLeaf) return 1;
  return 1 + Math.max(rpTreeDepth(node.left), rpTreeDepth(node.right));
}

function rpComputeLayout() {
  var positions = {};
  var counter = { val: 0 };

  function dfs(node, depth) {
    if (node === null) return;
    if (node.isLeaf) { positions[node.id] = { x: counter.val * 90 + 40, y: depth * 70 + 30, node: node }; counter.val++; return; }
    dfs(node.left, depth + 1);
    var leftX = node.left ? (positions[node.left.id] ? positions[node.left.id].x : counter.val * 90 + 40) : counter.val * 90 + 40;
    dfs(node.right, depth + 1);
    var rightX = node.right && positions[node.right.id] ? positions[node.right.id].x : leftX;
    positions[node.id] = { x: (leftX + rightX) / 2, y: depth * 70 + 30, node: node };
  }

  dfs(rpState.root, 0);
  return positions;
}

function rpRenderTree(highlightPath) {
  var svg = document.getElementById('rpTreeSvg');
  if (!svg) return;

  if (rpState.root === null) {
    svg.innerHTML = ''; svg.setAttribute('viewBox', '0 0 300 100');
    return;
  }

  var positions = rpComputeLayout();
  var maxX = 0, maxY = 0;
  Object.keys(positions).forEach(function(id) {
    if (positions[id].x > maxX) maxX = positions[id].x;
    if (positions[id].y > maxY) maxY = positions[id].y;
  });
  var W = Math.max(400, maxX + 80); var H = Math.max(300, maxY + 60);
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  svg.setAttribute('width', W); svg.setAttribute('height', H);
  svg.innerHTML = '';

  var highlightSet = {};
  (highlightPath || []).forEach(function(id) { highlightSet[id] = true; });

  function drawEdges(node) {
    if (node === null || node.isLeaf) return;
    var p = positions[node.id];
    [node.left, node.right].forEach(function(child) {
      if (!child || !positions[child.id]) return;
      var c = positions[child.id];
      var line = document.createElementNS(RP_NS, 'line');
      line.setAttribute('x1', p.x); line.setAttribute('y1', p.y + 16);
      line.setAttribute('x2', c.x); line.setAttribute('y2', c.y - 16);
      line.setAttribute('stroke', 'rgba(148,163,184,0.3)'); line.setAttribute('stroke-width', '1.4');
      svg.appendChild(line);
      drawEdges(child);
    });
  }
  drawEdges(rpState.root);

  Object.keys(positions).forEach(function(idStr) {
    var pos = positions[idStr];
    var node = pos.node;
    var isHighlighted = highlightSet[node.id];

    var g = document.createElementNS(RP_NS, 'g');

    if (node.isLeaf) {
      var w = Math.max(36, node.str.length * 8 + 12);
      var rect = document.createElementNS(RP_NS, 'rect');
      rect.setAttribute('x', pos.x - w / 2); rect.setAttribute('y', pos.y - 14);
      rect.setAttribute('width', w); rect.setAttribute('height', 28); rect.setAttribute('rx', 6);
      rect.setAttribute('fill', isHighlighted ? 'rgba(245,158,11,0.3)' : 'rgba(6,182,212,0.18)');
      rect.setAttribute('stroke', isHighlighted ? '#f59e0b' : '#06b6d4');
      rect.setAttribute('stroke-width', isHighlighted ? '2.2' : '1.4');
      g.appendChild(rect);

      var label = document.createElementNS(RP_NS, 'text');
      label.setAttribute('x', pos.x); label.setAttribute('y', pos.y + 4);
      label.setAttribute('text-anchor', 'middle'); label.setAttribute('fill', isHighlighted ? '#f59e0b' : '#06b6d4');
      label.setAttribute('font-family', 'Fira Code, monospace'); label.setAttribute('font-size', '9');
      label.textContent = '"' + node.str + '"';
      g.appendChild(label);
    } else {
      var circle = document.createElementNS(RP_NS, 'circle');
      circle.setAttribute('cx', pos.x); circle.setAttribute('cy', pos.y); circle.setAttribute('r', '16');
      circle.setAttribute('fill', isHighlighted ? 'rgba(245,158,11,0.3)' : 'rgba(168,85,247,0.18)');
      circle.setAttribute('stroke', isHighlighted ? '#f59e0b' : '#a855f7');
      circle.setAttribute('stroke-width', isHighlighted ? '2.2' : '1.4');
      g.appendChild(circle);

      var label = document.createElementNS(RP_NS, 'text');
      label.setAttribute('x', pos.x); label.setAttribute('y', pos.y + 3);
      label.setAttribute('text-anchor', 'middle'); label.setAttribute('fill', isHighlighted ? '#f59e0b' : '#a855f7');
      label.setAttribute('font-family', 'Fira Code, monospace'); label.setAttribute('font-size', '9'); label.setAttribute('font-weight', '700');
      label.textContent = 'w=' + node.weight;
      g.appendChild(label);
    }

    svg.appendChild(g);
  });
}

function rpRenderText(highlightRange) {
  var el = document.getElementById('rpTextDisplay');
  if (!el) return;
  var str = rpToString(rpState.root);
  if (!highlightRange) { el.textContent = str || '(empty)'; return; }

  var before = str.slice(0, highlightRange[0]);
  var mid = str.slice(highlightRange[0], highlightRange[1]);
  var after = str.slice(highlightRange[1]);
  el.innerHTML = rpEsc(before) + '<span class="rp-char-highlight">' + rpEsc(mid) + '</span>' + rpEsc(after);
}

function rpEsc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

function rpAddLog(msg, cls) {
  var log = document.getElementById('rpLog');
  if (!log) return;
  var empty = log.querySelector('.rp-empty');
  if (empty) empty.remove();
  var entry = document.createElement('div');
  entry.className = 'rp-log-entry ' + (cls || '');
  entry.textContent = msg;
  log.insertBefore(entry, log.firstChild);
  while (log.children.length > 50) log.removeChild(log.lastChild);
}

function rpSetStatus(msg, cls) {
  var el = document.getElementById('rpStatus');
  if (!el) return;
  el.textContent = msg; el.className = 'rp-status ' + (cls || '');
}

function rpUpdateStats() {
  var str = rpToString(rpState.root);
  var lenEl = document.getElementById('rpDocLength');
  var depthEl = document.getElementById('rpTreeDepth');
  var ropeCostEl = document.getElementById('rpRopeCost');
  var naiveCostEl = document.getElementById('rpNaiveCost');

  if (lenEl) lenEl.textContent = str.length;
  if (depthEl) depthEl.textContent = rpTreeDepth(rpState.root);
  if (ropeCostEl) ropeCostEl.textContent = rpState.ropeCost;
  if (naiveCostEl) naiveCostEl.textContent = rpState.naiveCost;
}

function rpBuildHandler() {
  var input = document.getElementById('rpBuildInput');
  var str = input ? input.value : '';
  if (!str) { rpSetStatus('Enter a string to build from.', ''); return; }

  rpState.root = rpBuild(str);
  rpState.ropeCost = 0;
  rpState.naiveCost = 0;

  var log = document.getElementById('rpLog');
  if (log) log.innerHTML = '<div class="rp-empty">No operations yet.</div>';

  rpRenderTree(null);
  rpRenderText(null);
  rpUpdateStats();
  rpSetStatus('Rope built from ' + str.length + ' characters. Tree depth: ' + rpTreeDepth(rpState.root) + '.', 'good');
}

function rpInsertHandler() {
  if (!rpState.root) { rpSetStatus('Build a rope first.', ''); return; }
  var posInput = document.getElementById('rpPosInput');
  var textInput = document.getElementById('rpTextInput');
  var pos = parseInt(posInput ? posInput.value : NaN);
  var text = textInput ? textInput.value : '';

  var docLen = rpLength(rpState.root);
  if (isNaN(pos) || pos < 0 || pos > docLen || !text) { rpSetStatus('Enter a valid position and text.', ''); return; }

  rpState.root = rpInsertAt(rpState.root, pos, text);
  rpState.ropeCost += Math.ceil(Math.log2(docLen + 1)) * 2 + text.length;
  rpState.naiveCost += (docLen - pos) + text.length;

  rpAddLog('Insert "' + text + '" at position ' + pos + ' — split rope, built new leaf, concatenated back. O(log n) tree ops, no character shifting.', 'done');
  rpRenderTree(null);
  rpRenderText([pos, pos + text.length]);
  rpUpdateStats();
  rpSetStatus('Inserted "' + text + '" at position ' + pos + '.', 'good');
}

function rpDeleteHandler() {
  if (!rpState.root) { rpSetStatus('Build a rope first.', ''); return; }
  var startInput = document.getElementById('rpDelStart');
  var endInput = document.getElementById('rpDelEnd');
  var start = parseInt(startInput ? startInput.value : NaN);
  var end = parseInt(endInput ? endInput.value : NaN);

  var docLen = rpLength(rpState.root);
  if (isNaN(start) || isNaN(end) || start < 0 || end > docLen || start >= end) { rpSetStatus('Enter a valid range (start < end, within document length).', ''); return; }

  rpState.root = rpDeleteRange(rpState.root, start, end);
  rpState.ropeCost += Math.ceil(Math.log2(docLen + 1)) * 3;
  rpState.naiveCost += (docLen - end) + (end - start);

  rpAddLog('Delete range [' + start + ', ' + end + ') — two splits isolate the range, then discard and concat. O(log n) tree ops.', 'done');
  rpRenderTree(null);
  rpRenderText(null);
  rpUpdateStats();
  rpSetStatus('Deleted characters ' + start + ' to ' + end + '.', 'good');
}

function rpIndexHandler() {
  if (!rpState.root) { rpSetStatus('Build a rope first.', ''); return; }
  var posInput = document.getElementById('rpPosInput');
  var pos = parseInt(posInput ? posInput.value : NaN);
  var docLen = rpLength(rpState.root);

  if (isNaN(pos) || pos < 0 || pos >= docLen) { rpSetStatus('Enter a valid position within the document.', ''); return; }

  var path = [];
  var ch = rpIndex(rpState.root, pos, path);

  rpAddLog('index(' + pos + ') = "' + ch + '" — descended ' + path.length + ' node(s) using weight comparisons, O(log n).', 'done');
  rpRenderTree(path);
  rpRenderText([pos, pos + 1]);
  rpSetStatus('Character at position ' + pos + ' is "' + ch + '" — found via weight-guided descent, ' + path.length + ' node(s) visited.', 'good');
}

function rpRebalanceHandler() {
  if (!rpState.root) { rpSetStatus('Build a rope first.', ''); return; }
  var str = rpToString(rpState.root);
  var depthBefore = rpTreeDepth(rpState.root);

  rpState.root = rpBuild(str);
  var depthAfter = rpTreeDepth(rpState.root);

  rpAddLog('Rebalanced: flattened to string, rebuilt as balanced tree. Depth ' + depthBefore + ' → ' + depthAfter + '.', 'done');
  rpRenderTree(null);
  rpRenderText(null);
  rpUpdateStats();
  rpSetStatus('Rebalanced. Tree depth restored to ' + depthAfter + ' for a document of length ' + str.length + '.', 'good');
}

function rpReset() {
  rpState.root = null;
  rpState.ropeCost = 0;
  rpState.naiveCost = 0;

  var log = document.getElementById('rpLog');
  if (log) log.innerHTML = '<div class="rp-empty">No operations yet.</div>';

  rpRenderTree(null);
  rpRenderText(null);
  rpUpdateStats();
  rpSetStatus('Reset. Build a rope from a string to begin.', '');
}

function rpInit() {
  var buildBtn = document.getElementById('rpBuildBtn');
  var insertBtn = document.getElementById('rpInsertBtn');
  var deleteBtn = document.getElementById('rpDeleteBtn');
  var indexBtn = document.getElementById('rpIndexBtn');
  var rebalanceBtn = document.getElementById('rpRebalanceBtn');
  var resetBtn = document.getElementById('rpResetBtn');

  if (buildBtn) buildBtn.addEventListener('click', rpBuildHandler);
  if (insertBtn) insertBtn.addEventListener('click', rpInsertHandler);
  if (deleteBtn) deleteBtn.addEventListener('click', rpDeleteHandler);
  if (indexBtn) indexBtn.addEventListener('click', rpIndexHandler);
  if (rebalanceBtn) rebalanceBtn.addEventListener('click', rpRebalanceHandler);
  if (resetBtn) resetBtn.addEventListener('click', rpReset);

  rpBuildHandler();

  window.addEventListener('resize', function() { rpRenderTree(null); });
}