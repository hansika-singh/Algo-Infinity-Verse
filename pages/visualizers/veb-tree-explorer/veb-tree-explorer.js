document.addEventListener('DOMContentLoaded', function() {
  vbInit();
});

var VB_U = 16;

function vbLowSqrt(u) { return Math.pow(2, Math.ceil(Math.log2(u) / 2)); }
function vbHighSqrt(u) { return Math.pow(2, Math.floor(Math.log2(u) / 2)); }
function vbHigh(x, u) { return Math.floor(x / vbLowSqrt(u)); }
function vbLow(x, u) { return x % vbLowSqrt(u); }
function vbIndex(h, l, u) { return h * vbLowSqrt(u) + l; }

function vbCreateNode(u) {
  var node = { u: u, min: null, max: null };
  if (u > 2) {
    node.summary = vbCreateNode(vbHighSqrt(u));
    node.clusters = [];
    for (var i = 0; i < vbHighSqrt(u); i++) node.clusters.push(vbCreateNode(vbLowSqrt(u)));
  }
  return node;
}

function vbIsEmpty(node) { return node.min === null; }

function vbInsert(node, x, trace) {
  if (vbIsEmpty(node)) {
    node.min = x; node.max = x;
    if (trace) trace.push('u=' + node.u + ': was empty — set min=max=' + x);
    return;
  }
  if (x < node.min) { var tmp = x; x = node.min; node.min = tmp; if (trace) trace.push('u=' + node.u + ': ' + x + ' < old min, swap — new min=' + node.min); }
  if (node.u > 2) {
    var h = vbHigh(x, node.u); var l = vbLow(x, node.u);
    if (vbIsEmpty(node.clusters[h])) {
      if (trace) trace.push('u=' + node.u + ': cluster[' + h + '] empty — insert ' + h + ' into summary, set cluster min/max directly');
      vbInsert(node.summary, h, trace);
      node.clusters[h].min = l; node.clusters[h].max = l;
    } else {
      if (trace) trace.push('u=' + node.u + ': cluster[' + h + '] non-empty — recurse insert(' + l + ') into it');
      vbInsert(node.clusters[h], l, trace);
    }
  }
  if (x > node.max) node.max = x;
}

function vbMember(node, x) {
  if (node.min === null) return false;
  if (x === node.min || x === node.max) return true;
  if (node.u === 2) return false;
  return vbMember(node.clusters[vbHigh(x, node.u)], vbLow(x, node.u));
}

function vbSuccessor(node, x, trace) {
  if (node.u === 2) {
    if (x === 0 && node.max === 1) return 1;
    return null;
  }
  if (node.min !== null && x < node.min) { if (trace) trace.push('u=' + node.u + ': x < min → return min=' + node.min); return node.min; }

  var h = vbHigh(x, node.u); var l = vbLow(x, node.u);
  var clusterMax = node.clusters[h].max;

  if (clusterMax !== null && l < clusterMax) {
    if (trace) trace.push('u=' + node.u + ': cluster[' + h + '] has larger element — recurse within it');
    var offset = vbSuccessor(node.clusters[h], l, trace);
    return vbIndex(h, offset, node.u);
  } else {
    if (trace) trace.push('u=' + node.u + ': no successor in cluster[' + h + '] — ask summary for next non-empty cluster');
    var nextCluster = vbSuccessor(node.summary, h, trace);
    if (nextCluster === null) return null;
    var offsetMin = node.clusters[nextCluster].min;
    if (trace) trace.push('u=' + node.u + ': summary says cluster[' + nextCluster + '] — its min is ' + offsetMin);
    return vbIndex(nextCluster, offsetMin, node.u);
  }
}

function vbDelete(node, x, trace) {
  if (node.min === node.max) { if (trace) trace.push('u=' + node.u + ': only element — clear to empty'); node.min = null; node.max = null; return; }
  if (node.u === 2) { node.min = (x === 0) ? 1 : 0; node.max = node.min; return; }

  if (x === node.min) {
    var firstCluster = node.summary.min;
    x = vbIndex(firstCluster, node.clusters[firstCluster].min, node.u);
    node.min = x;
    if (trace) trace.push('u=' + node.u + ': deleted old min — new min becomes ' + x + ' (from first non-empty cluster)');
  }

  var h = vbHigh(x, node.u); var l = vbLow(x, node.u);
  vbDelete(node.clusters[h], l, trace);

  if (vbIsEmpty(node.clusters[h])) {
    if (trace) trace.push('u=' + node.u + ': cluster[' + h + '] now empty — remove ' + h + ' from summary');
    vbDelete(node.summary, h, trace);
    if (x === node.max) {
      var summaryMax = node.summary.max;
      if (summaryMax === null) node.max = node.min;
      else node.max = vbIndex(summaryMax, node.clusters[summaryMax].max, node.u);
    }
  } else if (x === node.max) {
    node.max = vbIndex(h, node.clusters[h].max, node.u);
  }
}

var vbState = { root: null, opCounter: 0, comparisons: { veb: 0, bst: 0, hash: 0 } };

function vbAddTrace(msg, cls) {
  var log = document.getElementById('vbTraceLog');
  if (!log) return;
  var empty = log.querySelector('.vb-empty');
  if (empty) empty.remove();
  var entry = document.createElement('div');
  entry.className = 'vb-trace-entry ' + (cls || '');
  entry.textContent = msg;
  log.insertBefore(entry, log.firstChild);
  while (log.children.length > 60) log.removeChild(log.lastChild);
}

function vbSetStatus(msg, cls) {
  var el = document.getElementById('vbStatus');
  if (!el) return;
  el.textContent = msg; el.className = 'vb-status ' + (cls || '');
}

function vbRenderNode(node, depth) {
  var box = document.createElement('div');
  box.className = 'vb-node-box';

  var header = document.createElement('div');
  header.className = 'vb-node-header';
  header.innerHTML =
    '<span class="vb-node-u">u=' + node.u + '</span>' +
    '<span class="vb-node-minmax">min=' + (node.min === null ? '—' : node.min) + ', max=' + (node.max === null ? '—' : node.max) + '</span>' +
    (node.u > 2 ? '<span class="vb-node-toggle">▾ click to collapse</span>' : '');
  box.appendChild(header);

  if (node.u > 2) {
    header.addEventListener('click', function() {
      box.classList.toggle('vb-collapsed');
      var toggle = header.querySelector('.vb-node-toggle');
      if (toggle) toggle.textContent = box.classList.contains('vb-collapsed') ? '▸ click to expand' : '▾ click to collapse';
    });

    var row = document.createElement('div');
    row.className = 'vb-cluster-row';

    var summaryWrap = document.createElement('div');
    summaryWrap.className = 'vb-node-box vb-summary-box';
    var summaryLabel = document.createElement('div');
    summaryLabel.className = 'vb-summary-label';
    summaryLabel.textContent = 'Summary';
    summaryWrap.appendChild(summaryLabel);
    summaryWrap.appendChild(vbRenderNode(node.summary, depth + 1));
    row.appendChild(summaryWrap);

    node.clusters.forEach(function(cluster, idx) {
      var clusterWrap = document.createElement('div');
      clusterWrap.setAttribute('data-cluster-idx', idx);
      clusterWrap.appendChild(vbRenderNode(cluster, depth + 1));
      row.appendChild(clusterWrap);
    });

    box.appendChild(row);
  } else {
    var leaf = document.createElement('div');
    leaf.className = 'vb-leaf-box';
    leaf.innerHTML =
      '<div class="vb-bit' + (node.min === 0 || node.max === 0 ? ' set' : '') + '">0</div>' +
      '<div class="vb-bit' + (node.min === 1 || node.max === 1 ? ' set' : '') + '">1</div>';
    box.appendChild(leaf);
  }

  return box;
}

function vbRenderTree() {
  var canvas = document.getElementById('vbTreeCanvas');
  if (!canvas) return;
  canvas.innerHTML = '';
  canvas.appendChild(vbRenderNode(vbState.root, 0));
}

function vbDoInsert(x) {
  if (vbMember(vbState.root, x)) { vbSetStatus('Value ' + x + ' is already in the tree.', ''); return; }
  var trace = [];
  vbInsert(vbState.root, x, trace);
  trace.forEach(function(t) { vbAddTrace(t, ''); });
  vbAddTrace('✅ Inserted ' + x, 'found');
  vbRenderTree();
  vbSetStatus('Inserted ' + x + '. Tree now shows updated min/max at every level touched.', 'found');
}

function vbDoDelete(x) {
  if (!vbMember(vbState.root, x)) { vbSetStatus('Value ' + x + ' is not in the tree.', 'notfound'); return; }
  var trace = [];
  vbDelete(vbState.root, x, trace);
  trace.forEach(function(t) { vbAddTrace(t, ''); });
  vbAddTrace('✅ Deleted ' + x, 'found');
  vbRenderTree();
  vbSetStatus('Deleted ' + x + '.', 'found');
}

function vbDoSuccessor(x) {
  var trace = [];
  var result = vbSuccessor(vbState.root, x, trace);
  trace.forEach(function(t) { vbAddTrace(t, ''); });
  if (result === null) {
    vbAddTrace('successor(' + x + ') = none (no larger element exists)', '');
    vbSetStatus('No successor found for ' + x + ' — it may be the maximum, or larger than all elements.', 'notfound');
  } else {
    vbAddTrace('successor(' + x + ') = ' + result, 'found');
    vbSetStatus('successor(' + x + ') = ' + result + '. Found in ' + trace.length + ' recursive step(s) — O(log log 16) = O(2).', 'found');
  }
}

function vbDoMember(x) {
  var isMember = vbMember(vbState.root, x);
  vbAddTrace('member(' + x + ') = ' + isMember, isMember ? 'found' : '');
  vbSetStatus(x + ' is ' + (isMember ? '' : 'NOT ') + 'a member of the tree.', isMember ? 'found' : 'notfound');
}

function vbLoadPreset(values) {
  vbState.root = vbCreateNode(VB_U);
  values.forEach(function(v) { vbInsert(vbState.root, v, null); });
  vbRenderTree();
  var log = document.getElementById('vbTraceLog');
  if (log) log.innerHTML = '<div class="vb-empty">No operations yet.</div>';
  vbSetStatus('Loaded values: ' + values.join(', ') + '.', '');
}

function vbSimulateComparison() {
  var vebOps = 0; var bstOps = 0; var hashOps = 0;
  var currentSize = 1;

  for (var i = 0; i < 20; i++) {
    vebOps += Math.ceil(Math.log2(Math.log2(VB_U) + 1)) + 2;
    bstOps += Math.max(1, Math.ceil(Math.log2(currentSize + 1)));
    hashOps += 1;
    currentSize++;
  }

  var vebEl  = document.getElementById('vbCompVeb');
  var bstEl  = document.getElementById('vbCompBst');
  var hashEl = document.getElementById('vbCompHash');
  if (vebEl)  vebEl.textContent  = vebOps + ' (~O(log log U) each)';
  if (bstEl)  bstEl.textContent  = bstOps + ' (~O(log n) each)';
  if (hashEl) hashEl.textContent = hashOps + ' (O(1) each, no ordering support)';

  vbAddTrace('Ran 20 simulated operations — vEB: ' + vebOps + ' steps, BST: ' + bstOps + ' steps, Hash: ' + hashOps + ' steps (hash cannot do successor queries)', '');
}

var vbChallengeAnswer = null;

function vbNewChallenge() {
  var values = [];
  vbCollectValues(vbState.root, 0, VB_U, values);
  values.sort(function(a, b) { return a - b; });
  if (values.length < 2) { vbLoadPreset([1,3,5,8,10,13]); vbCollectValues(vbState.root, 0, VB_U, values); values.sort(function(a,b){return a-b;}); }

  var idx = Math.floor(Math.random() * (values.length - 1));
  var query = values[idx];
  vbChallengeAnswer = values[idx + 1] !== undefined ? values[idx + 1] : null;

  var valEl = document.getElementById('vbChallengeVal');
  if (valEl) valEl.textContent = query;

  var resultEl = document.getElementById('vbChallengeResult');
  if (resultEl) resultEl.classList.add('hidden');
  var inputEl = document.getElementById('vbChallengeInput');
  if (inputEl) inputEl.value = '';

  vbState.challengeQuery = query;
}

function vbCollectValues(node, base, u, out) {
  if (node.min === null) return;
  if (node.u === 2) {
    if (node.min !== null) out.push(base + node.min);
    if (node.max !== null && node.max !== node.min) out.push(base + node.max);
    return;
  }
  out.push(base + node.min);
  if (node.max !== node.min) out.push(base + node.max);
  node.clusters.forEach(function(cluster, idx) {
    var childBase = base + idx * vbLowSqrt(node.u);
    vbCollectValuesInner(cluster, childBase, out);
  });
}

function vbCollectValuesInner(node, base, out) {
  if (node.min === null) return;
  if (node.u === 2) {
    if (node.min !== null) out.push(base + node.min);
    if (node.max !== null && node.max !== node.min) out.push(base + node.max);
    return;
  }
  out.push(base + node.min);
  if (node.max !== node.min) out.push(base + node.max);
  node.clusters.forEach(function(cluster, idx) {
    var childBase = base + idx * vbLowSqrt(node.u);
    vbCollectValuesInner(cluster, childBase, out);
  });
}

function vbCheckChallenge() {
  var input = document.getElementById('vbChallengeInput');
  var guess = input ? parseInt(input.value) : NaN;
  var resultEl = document.getElementById('vbChallengeResult');
  if (!resultEl) return;

  resultEl.classList.remove('hidden');
  var correct = (vbChallengeAnswer === null && isNaN(guess)) || (guess === vbChallengeAnswer);

  resultEl.className = 'vb-challenge-result ' + (correct ? 'correct' : 'incorrect');
  resultEl.textContent = correct
    ? '✅ Correct! successor(' + vbState.challengeQuery + ') = ' + (vbChallengeAnswer === null ? 'none' : vbChallengeAnswer)
    : '❌ Not quite. The correct answer is ' + (vbChallengeAnswer === null ? 'none (no successor exists)' : vbChallengeAnswer) + '.';
}

function vbInit() {
  vbState.root = vbCreateNode(VB_U);
  var initial = [2, 3, 4, 5, 7, 14, 15];
  initial.forEach(function(v) { vbInsert(vbState.root, v, null); });
  vbRenderTree();

  var insertBtn = document.getElementById('vbInsertBtn');
  var deleteBtn = document.getElementById('vbDeleteBtn');
  var succBtn   = document.getElementById('vbSuccBtn');
  var memberBtn = document.getElementById('vbMemberBtn');
  var resetBtn  = document.getElementById('vbResetBtn');
  var valueInput = document.getElementById('vbValueInput');

  function getVal() {
    var v = parseInt(valueInput ? valueInput.value : NaN);
    if (isNaN(v) || v < 0 || v > 15) { vbSetStatus('Enter a value between 0 and 15.', 'notfound'); return null; }
    return v;
  }

  if (insertBtn) insertBtn.addEventListener('click', function() { var v = getVal(); if (v !== null) vbDoInsert(v); });
  if (deleteBtn) deleteBtn.addEventListener('click', function() { var v = getVal(); if (v !== null) vbDoDelete(v); });
  if (succBtn)   succBtn.addEventListener('click',   function() { var v = getVal(); if (v !== null) vbDoSuccessor(v); });
  if (memberBtn) memberBtn.addEventListener('click', function() { var v = getVal(); if (v !== null) vbDoMember(v); });
  if (resetBtn)  resetBtn.addEventListener('click',  function() { vbLoadPreset([]); });

  document.querySelectorAll('.vb-preset-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var values = btn.getAttribute('data-set').split(',').map(Number);
      vbLoadPreset(values);
    });
  });

  var runCompareBtn = document.getElementById('vbRunCompareBtn');
  if (runCompareBtn) runCompareBtn.addEventListener('click', vbSimulateComparison);

  var challengeCheckBtn = document.getElementById('vbChallengeCheckBtn');
  var challengeNewBtn   = document.getElementById('vbChallengeNewBtn');
  if (challengeCheckBtn) challengeCheckBtn.addEventListener('click', vbCheckChallenge);
  if (challengeNewBtn)   challengeNewBtn.addEventListener('click', vbNewChallenge);

  vbNewChallenge();
}