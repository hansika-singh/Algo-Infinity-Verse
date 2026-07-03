document.addEventListener('DOMContentLoaded', function() {
  pdInit();
});

var PD_NS = 'http://www.w3.org/2000/svg';
var pdNodePool = [];   
var pdVersions = [];   
var pdCurrentVer = 0;
var pdCompareA = null;
var pdCompareB = null;
var pdNaiveTotal = 0;  

/* ─── Create a new node ─── */
function pdNewNode(value, left, right) {
  var id = pdNodePool.length;
  pdNodePool.push({ id: id, value: value, left: left, right: right });
  return id;
}

/* ─── Count nodes reachable from root ─── */
function pdCountNodes(rootId) {
  if (rootId === null) return 0;
  var node = pdNodePool[rootId];
  return 1 + pdCountNodes(node.left) + pdCountNodes(node.right);
}

/* ─── Persistent BST insert — returns new root id ─── */
function pdInsert(rootId, value) {
  if (rootId === null) return pdNewNode(value, null, null);
  var node = pdNodePool[rootId];
  if (value === node.value) return rootId; // duplicate — no change, share same root
  if (value < node.value) {
    var newLeft = pdInsert(node.left, value);
    if (newLeft === node.left) return rootId; // nothing changed
    return pdNewNode(node.value, newLeft, node.right); // path copy
  } else {
    var newRight = pdInsert(node.right, value);
    if (newRight === node.right) return rootId;
    return pdNewNode(node.value, node.left, newRight); // path copy
  }
}

/* ─── Find in-order successor ─── */
function pdMinNode(rootId) {
  var node = pdNodePool[rootId];
  while (node.left !== null) node = pdNodePool[node.left];
  return node;
}

/* ─── Persistent BST delete — returns new root id ─── */
function pdDelete(rootId, value) {
  if (rootId === null) return null;
  var node = pdNodePool[rootId];
  if (value < node.value) {
    var newLeft = pdDelete(node.left, value);
    if (newLeft === node.left) return rootId;
    return pdNewNode(node.value, newLeft, node.right);
  } else if (value > node.value) {
    var newRight = pdDelete(node.right, value);
    if (newRight === node.right) return rootId;
    return pdNewNode(node.value, node.left, newRight);
  } else {
    // Found node to delete
    if (node.left === null) return node.right;
    if (node.right === null) return node.left;
    // Two children: replace with in-order successor
    var succ = pdMinNode(node.right);
    var newRight2 = pdDelete(node.right, succ.value);
    return pdNewNode(succ.value, node.left, newRight2);
  }
}

/* ─── Execute operation ─── */
function pdExecuteOp(opType, value) {
  var curRoot = pdVersions[pdCurrentVer].root;
  var newRoot;
  if (opType === 'insert') {
    newRoot = pdInsert(curRoot, value);
  } else {
    newRoot = pdDelete(curRoot, value);
  }

  if (newRoot === curRoot) {
    var reason = opType === 'delete'
      ? 'not found in v' + pdCurrentVer
      : 'already present in v' + pdCurrentVer;
    pdSetStatus('Value ' + value + ' ' + reason + ' — no new version created.', '');
    return;
  }

  var vIdx = pdVersions.length;
  var opLabel = (opType === 'insert' ? 'insert' : 'delete') + '(' + value + ')';
  pdVersions.push({ root: newRoot, label: 'v' + vIdx, op: opLabel });
  pdNaiveTotal += pdCountNodes(newRoot);
  pdCurrentVer = vIdx;

  pdUpdateVersionTimeline();
  pdUpdateCompareDropdowns();
  pdUpdateMemoryStats();
  pdRenderTree(pdCurrentVer, null, null);
  pdAddLog(opType, 'v' + vIdx + ' ← ' + opLabel);
  pdSetStatus('Created version v' + vIdx + ' via ' + opLabel + '. Only the path-to-node was copied.', 'insert');
}

/* ─── Collect all node IDs reachable from root ─── */
function pdCollectNodes(rootId, result) {
  if (rootId === null) return;
  result[rootId] = true;
  var node = pdNodePool[rootId];
  pdCollectNodes(node.left, result);
  pdCollectNodes(node.right, result);
}

/* ─── Layout: compute x/y positions using in-order traversal ─── */
function pdLayout(rootId) {
  var positions = {};
  var counter = { val: 0 };
  var depths = {};

  function dfs(nodeId, depth) {
    if (nodeId === null) return;
    var node = pdNodePool[nodeId];
    dfs(node.left, depth + 1);
    positions[nodeId] = { x: counter.val * 52 + 30, y: depth * 70 + 40 };
    depths[nodeId] = depth;
    counter.val++;
    dfs(node.right, depth + 1);
  }

  dfs(rootId, 0);
  return positions;
}

/* ─── Render tree onto SVG ─── */
function pdRenderTree(versionIdx, compareAIdx, compareBIdx) {
  var svg = document.getElementById('pdSvg');
  if (!svg) return;
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  if (versionIdx === null || !pdVersions[versionIdx]) {
    pdSetCanvasTitle('—');
    return;
  }

  var ver = pdVersions[versionIdx];
  pdSetCanvasTitle(ver.label + (ver.op ? ' ← ' + ver.op : ' — root'));

  if (ver.root === null) {
    svg.setAttribute('viewBox', '0 0 300 100');
    svg.setAttribute('width', 300); svg.setAttribute('height', 100);
    var t = document.createElementNS(PD_NS, 'text');
    t.setAttribute('x', 150); t.setAttribute('y', 50); t.setAttribute('text-anchor', 'middle');
    t.setAttribute('fill', 'rgba(148,163,184,0.35)'); t.setAttribute('font-size', '14'); t.setAttribute('font-family', 'Poppins,sans-serif');
    t.textContent = 'Empty tree';
    svg.appendChild(t);
    return;
  }

  var positions = pdLayout(ver.root);

  // Determine node coloring
  var verANodes = {}; var verBNodes = {};
  if (compareAIdx !== null && pdVersions[compareAIdx]) pdCollectNodes(pdVersions[compareAIdx].root, verANodes);
  if (compareBIdx !== null && pdVersions[compareBIdx]) pdCollectNodes(pdVersions[compareBIdx].root, verBNodes);

  // Newly created nodes: node IDs that appear in this version but not in previous version
  var prevNodes = {};
  if (versionIdx > 0 && pdVersions[versionIdx - 1]) {
    pdCollectNodes(pdVersions[versionIdx - 1].root, prevNodes);
  }

  // Compute SVG size
  var xs = Object.values(positions).map(function(p){return p.x;});
  var ys = Object.values(positions).map(function(p){return p.y;});
  var W = Math.max.apply(null, xs.concat([0])) + 60;
  var H = Math.max.apply(null, ys.concat([0])) + 60;
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  svg.setAttribute('width', W); svg.setAttribute('height', H);

  // Arrow marker
  var defs = document.createElementNS(PD_NS, 'defs');
  var marker = document.createElementNS(PD_NS, 'marker');
  marker.setAttribute('id', 'pdArrow');
  marker.setAttribute('viewBox', '0 0 8 8'); marker.setAttribute('refX', '7'); marker.setAttribute('refY', '4');
  marker.setAttribute('markerWidth', '4'); marker.setAttribute('markerHeight', '4'); marker.setAttribute('orient', 'auto');
  var mp = document.createElementNS(PD_NS, 'path');
  mp.setAttribute('d', 'M0,0 L8,4 L0,8 z'); mp.setAttribute('fill', 'rgba(148,163,184,0.4)');
  marker.appendChild(mp); defs.appendChild(marker); svg.appendChild(defs);

  // Draw edges
  Object.keys(positions).forEach(function(nodeIdStr) {
    var nodeId = parseInt(nodeIdStr);
    var node = pdNodePool[nodeId];
    var pos = positions[nodeId];

    [node.left, node.right].forEach(function(childId) {
      if (childId === null || !positions[childId]) return;
      var cpos = positions[childId];
      var line = document.createElementNS(PD_NS, 'line');
      line.setAttribute('x1', pos.x); line.setAttribute('y1', pos.y + 15);
      line.setAttribute('x2', cpos.x); line.setAttribute('y2', cpos.y - 15);
      line.setAttribute('stroke', 'rgba(148,163,184,0.25)');
      line.setAttribute('stroke-width', '1.5');
      line.setAttribute('marker-end', 'url(#pdArrow)');
      svg.appendChild(line);
    });
  });

  // Draw nodes
  Object.keys(positions).forEach(function(nodeIdStr) {
    var nodeId = parseInt(nodeIdStr);
    var node = pdNodePool[nodeId];
    var pos = positions[nodeId];

    var isNew   = !prevNodes[nodeId] && versionIdx > 0;
    var inA     = verANodes[nodeId];
    var inB     = verBNodes[nodeId];
    var inBoth  = inA && inB;
    var comparing = compareAIdx !== null && compareBIdx !== null;

    var fillColor, strokeColor;
    if (comparing && inBoth)       { fillColor = 'rgba(239,68,68,0.3)';  strokeColor = '#ef4444'; }
    else if (comparing && inA)     { fillColor = 'rgba(168,85,247,0.3)'; strokeColor = '#a855f7'; }
    else if (comparing && inB)     { fillColor = 'rgba(245,158,11,0.3)'; strokeColor = '#f59e0b'; }
    else if (isNew)                { fillColor = 'rgba(34,197,94,0.3)';  strokeColor = '#22c55e'; }
    else                           { fillColor = 'rgba(6,182,212,0.18)'; strokeColor = '#06b6d4'; }

    var g = document.createElementNS(PD_NS, 'g');

    var circle = document.createElementNS(PD_NS, 'circle');
    circle.setAttribute('class', 'pd-node-circle');
    circle.setAttribute('cx', pos.x); circle.setAttribute('cy', pos.y); circle.setAttribute('r', '15');
    circle.setAttribute('fill', fillColor);
    circle.setAttribute('stroke', strokeColor);
    circle.setAttribute('stroke-width', isNew ? '2.5' : '1.5');
    circle.setAttribute('tabindex', '0');
    circle.setAttribute('role', 'button');
    circle.setAttribute('aria-label', 'Node ' + node.value + ' (#' + nodeId + ')');
    circle.addEventListener('click', function() { pdInspectNode(nodeId, versionIdx); });
    circle.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pdInspectNode(nodeId, versionIdx); }
    });
    g.appendChild(circle);

    var label = document.createElementNS(PD_NS, 'text');
    label.setAttribute('class', 'pd-node-label');
    label.setAttribute('x', pos.x); label.setAttribute('y', pos.y + 4);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', strokeColor);
    label.textContent = node.value;
    g.appendChild(label);

    // Node ID (small, below)
    var idLabel = document.createElementNS(PD_NS, 'text');
    idLabel.setAttribute('x', pos.x); idLabel.setAttribute('y', pos.y + 26);
    idLabel.setAttribute('text-anchor', 'middle');
    idLabel.setAttribute('font-size', '8'); idLabel.setAttribute('fill', 'rgba(148,163,184,0.35)');
    idLabel.setAttribute('font-family', 'Fira Code,monospace');
    idLabel.textContent = '#' + nodeId;
    g.appendChild(idLabel);

    svg.appendChild(g);
  });
}

/* ─── Inspect node ─── */
function pdInspectNode(nodeId, versionIdx) {
  var node = pdNodePool[nodeId];
  var inspector = document.getElementById('pdInspector');
  if (!inspector) return;

  // Count how many versions reference this node
  var refCount = pdVersions.filter(function(v) {
    var nodes = {};
    pdCollectNodes(v.root, nodes);
    return nodes[nodeId];
  }).length;

  inspector.innerHTML = [
    { k: 'Node ID',    v: '#' + nodeId },
    { k: 'Value',      v: node.value },
    { k: 'Left child', v: node.left !== null ? '#' + node.left + ' (' + pdNodePool[node.left].value + ')' : 'null' },
    { k: 'Right child',v: node.right !== null ? '#' + node.right + ' (' + pdNodePool[node.right].value + ')' : 'null' },
    { k: 'Referenced by', v: refCount + ' version(s)' },
    { k: 'Created in', v: 'v' + pdVersions.findIndex(function(v){ var n = {}; pdCollectNodes(v.root, n); return n[nodeId]; }) },
  ].map(function(r) {
    return '<div class="pd-insp-row"><span class="pd-insp-key">' + r.k + '</span><span class="pd-insp-val">' + r.v + '</span></div>';
  }).join('');
}

/* ─── Version timeline ─── */
function pdUpdateVersionTimeline() {
  var timeline = document.getElementById('pdTimeline');
  if (!timeline) return;
  timeline.innerHTML = pdVersions.map(function(ver, i) {
    return '<div class="pd-version-item' + (i === pdCurrentVer ? ' active' : '') + '" data-ver="' + i + '">' +
      '<span class="pd-ver-dot"></span>' +
      '<span class="pd-ver-label">' + ver.label + '</span>' +
      '<span class="pd-ver-op">' + (ver.op || 'root') + '</span>' +
    '</div>';
  }).join('');

  timeline.querySelectorAll('.pd-version-item').forEach(function(item) {
    item.addEventListener('click', function() {
      pdCurrentVer = parseInt(item.getAttribute('data-ver'));
      timeline.querySelectorAll('.pd-version-item').forEach(function(it) { it.classList.remove('active'); });
      item.classList.add('active');
      pdRenderTree(pdCurrentVer, pdCompareA, pdCompareB);
      pdSetStatus('Viewing version v' + pdCurrentVer + (pdVersions[pdCurrentVer].op ? ' — ' + pdVersions[pdCurrentVer].op : ''), '');
    });
  });
}

/* ─── Compare dropdowns ─── */
function pdUpdateCompareDropdowns() {
  ['pdCompareA', 'pdCompareB'].forEach(function(id) {
    var sel = document.getElementById(id);
    if (!sel) return;
    var curVal = sel.value;
    sel.innerHTML = '<option value="">—</option>' + pdVersions.map(function(ver, i) {
      return '<option value="' + i + '">' + ver.label + (ver.op ? ' (' + ver.op + ')' : '') + '</option>';
    }).join('');
    if (curVal !== '') sel.value = curVal;
  });
}

/* ─── Memory stats ─── */
function pdUpdateMemoryStats() {
  var unique = pdNodePool.length;
  var naive  = pdNaiveTotal;
  var saved  = Math.max(0, naive - unique);
  var pct    = naive > 0 ? Math.round((unique / naive) * 100) : 100;

  var uel = document.getElementById('pdUniqueNodes');
  var nel = document.getElementById('pdNaiveNodes');
  var sel = document.getElementById('pdSavedNodes');
  var bel = document.getElementById('pdMemBarFill');
  var pel = document.getElementById('pdMemPct');

  if (uel) uel.textContent = unique;
  if (nel) nel.textContent = naive;
  if (sel) sel.textContent = saved;
  if (bel) bel.style.width = pct + '%';
  if (pel) pel.textContent = 'Persistent uses ' + pct + '% of naive memory (' + saved + ' nodes saved)';
}

/* ─── Helpers ─── */
function pdSetStatus(msg, cls) {
  var el = document.getElementById('pdStatus');
  if (el) el.textContent = msg;
}

function pdSetCanvasTitle(title) {
  var el = document.getElementById('pdCanvasTitle');
  if (el) el.textContent = title;
}

function pdAddLog(type, msg) {
  var log = document.getElementById('pdOpLog');
  if (!log) return;
  var empty = log.querySelector('.pd-log-empty');
  if (empty) empty.remove();
  var entry = document.createElement('div');
  entry.className = 'pd-log-entry ' + type;
  entry.textContent = msg;
  log.insertBefore(entry, log.firstChild);
  while (log.children.length > 40) log.removeChild(log.lastChild);
}

/* ─── Load preset sequence ─── */
function pdLoadPreset(seq) {
  // Reset
  pdNodePool = [];
  pdVersions = [{ root: null, label: 'v0', op: '' }];
  pdCurrentVer = 0;
  pdCompareA = null; pdCompareB = null;
  pdNaiveTotal = 0;

  var log = document.getElementById('pdOpLog');
  if (log) log.innerHTML = '<div class="pd-log-empty">No operations yet.</div>';

  var inspector = document.getElementById('pdInspector');
  if (inspector) inspector.innerHTML = '<div class="pd-inspector-empty">Click any node to inspect it</div>';

  var timeline = document.getElementById('pdTimeline');
  if (timeline) timeline.innerHTML = '';

  seq.forEach(function(val) {
    var curRoot = pdVersions[pdCurrentVer].root;
    var newRoot = pdInsert(curRoot, val);
    if (newRoot !== curRoot) {
      var vIdx = pdVersions.length;
      pdVersions.push({ root: newRoot, label: 'v' + vIdx, op: 'insert(' + val + ')' });
      pdNaiveTotal += pdCountNodes(newRoot);
      pdCurrentVer = vIdx;
    }
  });

  pdUpdateVersionTimeline();
  pdUpdateCompareDropdowns();
  pdUpdateMemoryStats();
  pdRenderTree(pdCurrentVer, null, null);
  pdAddLog('preset', 'Loaded preset: [' + seq.join(',') + '] → v0 to v' + (pdVersions.length-1));
  pdSetStatus('Preset loaded. Click any version in the timeline to view it. Try compare mode to highlight shared nodes.', '');
}

/* ─── Init ─── */
function pdInit() {
  // Initial empty version
  pdVersions = [{ root: null, label: 'v0', op: '' }];
  pdNodePool = [];
  pdNaiveTotal = 0;

  pdUpdateVersionTimeline();
  pdUpdateCompareDropdowns();
  pdUpdateMemoryStats();
  pdRenderTree(0, null, null);

  // Operation button
  var opBtn = document.getElementById('pdOpBtn');
  if (opBtn) {
    opBtn.addEventListener('click', function() {
      var opType = document.getElementById('pdOpType').value;
      var val = parseInt(document.getElementById('pdOpValue').value);
      if (isNaN(val) || val < 1 || val > 99) { pdSetStatus('Enter a value between 1 and 99.', ''); return; }
      pdExecuteOp(opType, val);
    });
  }

  // Value input enter key
  var valInput = document.getElementById('pdOpValue');
  if (valInput) {
    valInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        var opType = document.getElementById('pdOpType').value;
        var val = parseInt(valInput.value);
        if (!isNaN(val) && val >= 1 && val <= 99) pdExecuteOp(opType, val);
      }
    });
  }

  // Presets
  document.querySelectorAll('.pd-preset-chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      var seq = JSON.parse(chip.getAttribute('data-seq'));
      pdLoadPreset(seq);
    });
  });

  // Compare button
  var compareBtn = document.getElementById('pdCompareBtn');
  if (compareBtn) {
    compareBtn.addEventListener('click', function() {
      var selA = document.getElementById('pdCompareA');
      var selB = document.getElementById('pdCompareB');
      if (!selA || !selB || selA.value === '' || selB.value === '' || selA.value === selB.value) {
        pdSetStatus('Select two different versions to compare.', '');
        return;
      }
      pdCompareA = parseInt(selA.value);
      pdCompareB = parseInt(selB.value);

      // Count shared nodes
      var nodesA = {}; var nodesB = {};
      pdCollectNodes(pdVersions[pdCompareA].root, nodesA);
      pdCollectNodes(pdVersions[pdCompareB].root, nodesB);
      var shared = Object.keys(nodesA).filter(function(k){ return nodesB[k]; }).length;

      pdRenderTree(pdCurrentVer, pdCompareA, pdCompareB);
      pdSetStatus(
        'Comparing ' + pdVersions[pdCompareA].label + ' and ' + pdVersions[pdCompareB].label + '. ' +
        'Shared nodes (red): ' + shared + '. ' +
        'Purple = only in v' + pdCompareA + '. Amber = only in v' + pdCompareB + '.',
        ''
      );
    });
  }

  // Clear compare
  var clearBtn = document.getElementById('pdCompareClearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      pdCompareA = null; pdCompareB = null;
      var selA = document.getElementById('pdCompareA');
      var selB = document.getElementById('pdCompareB');
      if (selA) selA.value = '';
      if (selB) selB.value = '';
      pdRenderTree(pdCurrentVer, null, null);
      pdSetStatus('Compare mode cleared.', '');
    });
  }

  // Resize
  window.addEventListener('resize', function() {
    pdRenderTree(pdCurrentVer, pdCompareA, pdCompareB);
  });

  // Load classic preset by default
  pdLoadPreset([30, 50, 20, 70, 40, 60, 10, 80]);
}