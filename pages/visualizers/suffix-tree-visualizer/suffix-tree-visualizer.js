document.addEventListener('DOMContentLoaded', function() {
  stInit();
});

var ST_NS = 'http://www.w3.org/2000/svg';
var stState = { tree: null, str: '' };

/* ─── Verified Ukkonen construction (node-tested before UI built) ─── */
function stBuildSuffixTree(input, log) {
  var s = input + '$';
  var n = s.length;
  var nodes = [{ start: -1, end: { val: -1 }, children: {}, link: 0, id: 0, isInternal: true }];

  var activeNode = 0, activeEdge = -1, activeLength = 0, remaining = 0;
  var globalEnd = { val: -1 };
  var lastNewNode = -1;
  var stepCount = 0;

  function edgeChar(id) { return s[nodes[id].start]; }
  function newNode(start, end, isInternal) {
    var id = nodes.length;
    nodes.push({ start: start, end: end, children: {}, link: 0, id: id, isInternal: !!isInternal });
    return id;
  }
  function edgeLength(node) {
    var endVal = node.end.val !== undefined ? node.end.val : node.end;
    return endVal - node.start + 1;
  }
  function apLabel() {
    return { node: activeNode, edge: activeEdge >= 0 ? s[activeEdge] : '—', length: activeLength, remaining: remaining };
  }

  for (var i = 0; i < n; i++) {
    globalEnd.val = i;
    remaining++;
    lastNewNode = -1;
    if (log) log.push({ type: 'phase', msg: 'Phase ' + i + ': extend with character "' + s[i] + '"', ap: apLabel() });

    while (remaining > 0) {
      stepCount++;
      if (activeLength === 0) activeEdge = i;
      var ec = s[activeEdge];

      if (!(ec in nodes[activeNode].children)) {
        var leaf = newNode(i, globalEnd, false);
        nodes[activeNode].children[ec] = leaf;
        if (lastNewNode !== -1) { nodes[lastNewNode].link = activeNode; lastNewNode = -1; }
        if (log) log.push({ type: 'rule2', msg: 'Rule 2: no "' + ec + '" edge from node #' + activeNode + ' — create new leaf edge.', ap: apLabel() });
      } else {
        var nextId = nodes[activeNode].children[ec];
        var nextNodeObj = nodes[nextId];
        var elen = edgeLength(nextNodeObj);

        if (activeLength >= elen) {
          activeEdge += elen;
          activeLength -= elen;
          activeNode = nextId;
          continue;
        }

        if (s[nextNodeObj.start + activeLength] === s[i]) {
          if (lastNewNode !== -1 && activeNode !== 0) { nodes[lastNewNode].link = activeNode; lastNewNode = -1; }
          activeLength++;
          if (log) log.push({ type: 'rule3', msg: 'Rule 3: "' + s[i] + '" already exists on this edge — advance active point, stop phase early.', ap: apLabel() });
          break;
        }

        var splitEnd = { val: nextNodeObj.start + activeLength - 1 };
        var split = newNode(nextNodeObj.start, splitEnd, true);
        nodes[activeNode].children[ec] = split;
        var leaf2 = newNode(i, globalEnd, false);
        nodes[split].children[s[i]] = leaf2;
        nextNodeObj.start += activeLength;
        nodes[split].children[s[nextNodeObj.start]] = nextId;
        if (lastNewNode !== -1) nodes[lastNewNode].link = split;
        lastNewNode = split;
        if (log) log.push({ type: 'rule2', msg: 'Rule 2: split edge at node #' + activeNode + ' into internal node #' + split + ', branch new leaf for "' + s[i] + '".', ap: apLabel() });
      }

      remaining--;
      if (activeNode === 0 && activeLength > 0) {
        activeLength--;
        activeEdge = i - remaining + 1;
      } else if (activeNode !== 0) {
        activeNode = nodes[activeNode].link;
      }
    }
  }

  return { nodes: nodes, s: s, extensionSteps: stepCount };
}

function stEdgeLabel(tree, node) {
  var endVal = node.end.val !== undefined ? node.end.val : node.end;
  return tree.s.slice(node.start, endVal + 1);
}

function stLongestRepeatedSubstring(tree) {
  var best = { depth: 0, label: '' };

  function dfs(id, depthLabel) {
    var node = tree.nodes[id];
    var childKeys = Object.keys(node.children);
    if (node.isInternal && id !== 0 && depthLabel.length > best.depth) {
      best = { depth: depthLabel.length, label: depthLabel };
    }
    childKeys.forEach(function(c) {
      var childId = node.children[c];
      var child = tree.nodes[childId];
      dfs(childId, depthLabel + stEdgeLabel(tree, child));
    });
  }
  dfs(0, '');
  return best.label;
}

function stComputeLayout(tree) {
  var positions = {};
  var counter = { val: 0 };

  function dfs(id, depth) {
    var node = tree.nodes[id];
    var childKeys = Object.keys(node.children).sort();
    if (childKeys.length === 0) { positions[id] = { x: counter.val * 65 + 40, y: depth * 65 + 30 }; counter.val++; return; }
    childKeys.forEach(function(c) { dfs(node.children[c], depth + 1); });
    var xs = childKeys.map(function(c) { return positions[node.children[c]].x; });
    positions[id] = { x: (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2, y: depth * 65 + 30 };
  }
  dfs(0, 0);
  return positions;
}

function stRenderTree() {
  var svg = document.getElementById('stTreeSvg');
  if (!svg || !stState.tree) return;
  var tree = stState.tree;
  var positions = stComputeLayout(tree);

  var maxX = 0, maxY = 0;
  Object.keys(positions).forEach(function(id) { if (positions[id].x > maxX) maxX = positions[id].x; if (positions[id].y > maxY) maxY = positions[id].y; });
  var W = Math.max(400, maxX + 60); var H = Math.max(300, maxY + 60);
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  svg.setAttribute('width', W); svg.setAttribute('height', H);
  svg.innerHTML = '';

  tree.nodes.forEach(function(node) {
    Object.keys(node.children).forEach(function(c) {
      var childId = node.children[c];
      var child = tree.nodes[childId];
      var p = positions[node.id]; var cp = positions[childId];
      if (!p || !cp) return;
      var line = document.createElementNS(ST_NS, 'line');
      line.setAttribute('x1', p.x); line.setAttribute('y1', p.y + 12);
      line.setAttribute('x2', cp.x); line.setAttribute('y2', cp.y - 12);
      line.setAttribute('stroke', 'rgba(148,163,184,0.35)'); line.setAttribute('stroke-width', '1.3');
      svg.appendChild(line);

      var label = document.createElementNS(ST_NS, 'text');
      label.setAttribute('x', (p.x + cp.x) / 2); label.setAttribute('y', (p.y + cp.y) / 2 - 4);
      label.setAttribute('text-anchor', 'middle'); label.setAttribute('fill', 'rgba(203,213,225,0.8)');
      label.setAttribute('font-family', 'Fira Code, monospace'); label.setAttribute('font-size', '9');
      label.textContent = stEdgeLabel(tree, child);
      svg.appendChild(label);
    });
  });

  tree.nodes.forEach(function(node) {
    var pos = positions[node.id];
    if (!pos) return;
    var isLeaf = Object.keys(node.children).length === 0;
    var fillColor = isLeaf ? 'rgba(6,182,212,0.18)' : (node.id === 0 ? 'rgba(245,158,11,0.2)' : 'rgba(168,85,247,0.18)');
    var strokeColor = isLeaf ? '#06b6d4' : (node.id === 0 ? '#f59e0b' : '#a855f7');

    var circle = document.createElementNS(ST_NS, 'circle');
    circle.setAttribute('cx', pos.x); circle.setAttribute('cy', pos.y); circle.setAttribute('r', '11');
    circle.setAttribute('fill', fillColor); circle.setAttribute('stroke', strokeColor); circle.setAttribute('stroke-width', '1.5');
    svg.appendChild(circle);

    var text = document.createElementNS(ST_NS, 'text');
    text.setAttribute('x', pos.x); text.setAttribute('y', pos.y + 3);
    text.setAttribute('text-anchor', 'middle'); text.setAttribute('fill', strokeColor);
    text.setAttribute('font-family', 'Fira Code, monospace'); text.setAttribute('font-size', '8');
    text.textContent = node.id === 0 ? 'R' : '#' + node.id;
    svg.appendChild(text);
  });
}

function stUpdateActivePoint(ap) {
  var nodeEl = document.getElementById('stApNode');
  var edgeEl = document.getElementById('stApEdge');
  var lengthEl = document.getElementById('stApLength');
  var remEl = document.getElementById('stApRemaining');
  if (nodeEl) nodeEl.textContent = ap.node === 0 ? 'root' : '#' + ap.node;
  if (edgeEl) edgeEl.textContent = ap.edge;
  if (lengthEl) lengthEl.textContent = ap.length;
  if (remEl) remEl.textContent = ap.remaining;
}

function stAddLog(entry) {
  var log = document.getElementById('stLog');
  if (!log) return;
  var empty = log.querySelector('.st-empty');
  if (empty) empty.remove();
  var div = document.createElement('div');
  div.className = 'st-log-entry ' + entry.type;
  div.textContent = entry.msg;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}

function stSetStatus(msg, cls) {
  var el = document.getElementById('stStatus');
  if (!el) return;
  el.textContent = msg; el.className = 'st-status ' + (cls || '');
}

function stBuildHandler() {
  var input = document.getElementById('stInput');
  var str = (input ? input.value : '').trim();
  if (!str) { stSetStatus('Enter a string first.', ''); return; }
  if (str.length > 12) { stSetStatus('Keep strings to 12 characters or fewer for a readable tree.', ''); return; }

  var log = document.getElementById('stLog');
  if (log) log.innerHTML = '';

  var stepLog = [];
  var tree = stBuildSuffixTree(str, stepLog);
  stState.tree = tree;
  stState.str = str;

  stepLog.forEach(function(entry) { stAddLog(entry); });
  var lastAp = stepLog.length > 0 ? stepLog[stepLog.length - 1].ap : { node: 0, edge: '—', length: 0, remaining: 0 };
  stUpdateActivePoint(lastAp);

  stRenderTree();

  var strLenEl = document.getElementById('stStrLen');
  var ukkonenEl = document.getElementById('stUkkonenSteps');
  var naiveEl = document.getElementById('stNaiveSteps');
  var n = str.length + 1;
  if (strLenEl) strLenEl.textContent = n;
  if (ukkonenEl) ukkonenEl.textContent = tree.extensionSteps;
  if (naiveEl) naiveEl.textContent = Math.round(n * n / 2);

  var lrs = stLongestRepeatedSubstring(tree);
  var lrsEl = document.getElementById('stLrsResult');
  if (lrsEl) lrsEl.textContent = lrs ? '"' + lrs + '" (length ' + lrs.length + ')' : 'No repeated substring exists in "' + str + '".';

  stSetStatus('Suffix tree built for "' + str + '$" — ' + (tree.nodes.length - 1) + ' node(s) created via ' + tree.extensionSteps + ' extension step(s).', 'good');
}

function stLcsHandler() {
  var aInput = document.getElementById('stLcsA');
  var bInput = document.getElementById('stLcsB');
  var a = (aInput ? aInput.value : '').trim();
  var b = (bInput ? bInput.value : '').trim();
  if (!a || !b) { return; }
  if (a.length + b.length > 28) { document.getElementById('stLcsResult').textContent = 'Combined length too long — keep under 28 characters total.'; return; }

  var combined = a + '#' + b;
  var tree = stBuildSuffixTree(combined, null);
  var boundary = a.length;

  var best = { depth: 0, label: '' };

  function collectLeafStarts(id, out) {
    var node = tree.nodes[id];
    var childKeys = Object.keys(node.children);
    if (childKeys.length === 0) { out.push(node.start - (tree.s.length - (node.end.val !== undefined ? node.end.val : node.end) - 1)); return; }
    childKeys.forEach(function(c) { collectLeafStarts(node.children[c], out); });
  }

  function suffixStartIndex(leafId) {
    var node = tree.nodes[leafId];
    var endVal = node.end.val !== undefined ? node.end.val : node.end;
    var label = stEdgeLabel(tree, node);
    return endVal - label.length + 1 - (label.length - 1);
  }

  function dfs(id, depthLabel) {
    var node = tree.nodes[id];
    var childKeys = Object.keys(node.children);

    if (childKeys.length === 0) return { hasA: false, hasB: false };

    var hasA = false, hasB = false;
    childKeys.forEach(function(c) {
      var childId = node.children[c];
      var child = tree.nodes[childId];
      var childLabel = depthLabel + stEdgeLabel(tree, child);

      if (Object.keys(child.children).length === 0) {
        var leafSuffixStart = tree.s.length - (child.end.val !== undefined ? child.end.val : child.end) - 1;
        var startPos = tree.s.length - leafSuffixStart - (childLabel.length + depthLabel.length - depthLabel.length);
        var suffixLen = tree.s.length - (child.start - (childLabel.length - stEdgeLabel(tree, child).length));
        var trueStart = child.start - (childLabel.length - stEdgeLabel(tree, child).length);
        if (trueStart < boundary) hasA = true; else hasB = true;
      } else {
        var res = dfs(childId, childLabel);
        if (res.hasA) hasA = true;
        if (res.hasB) hasB = true;
      }
    });

    if (hasA && hasB && depthLabel.length > best.depth && depthLabel.indexOf('#') === -1) {
      best = { depth: depthLabel.length, label: depthLabel };
    }

    return { hasA: hasA, hasB: hasB };
  }

  dfs(0, '');

  var lcsEl = document.getElementById('stLcsResult');
  if (lcsEl) lcsEl.textContent = best.label ? '"' + best.label + '" (length ' + best.label.length + ')' : 'No common substring found.';
}

function stInit() {
  var buildBtn = document.getElementById('stBuildBtn');
  if (buildBtn) buildBtn.addEventListener('click', stBuildHandler);

  document.querySelectorAll('.st-preset-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var input = document.getElementById('stInput');
      if (input) input.value = btn.getAttribute('data-str');
      stBuildHandler();
    });
  });

  var lcsBtn = document.getElementById('stLcsBtn');
  if (lcsBtn) lcsBtn.addEventListener('click', stLcsHandler);

  var input = document.getElementById('stInput');
  if (input) input.addEventListener('keydown', function(e) { if (e.key === 'Enter') stBuildHandler(); });

  stBuildHandler();
  window.addEventListener('resize', stRenderTree);
}