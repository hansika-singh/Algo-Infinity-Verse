document.addEventListener('DOMContentLoaded', function () {
  acInit();
});

var AC_NS = 'http://www.w3.org/2000/svg';

var acState = {
  patterns: [],
  trie: [],
  trieSteps: [],
  trieIdx: 0,
  failSteps: [],
  failIdx: 0,
  showFail: true,
  showFailTraversal: true,
  showSearchTraversal: true,
  searchText: '',
  searchSteps: [],
  searchIdx: 0,
  matchCount: 0,
  puzzlePatterns: [],
};

function acParsePatterns(raw) {
  return raw
    .split(',')
    .map(function (s) {
      return s.trim();
    })
    .filter(function (s) {
      return s.length > 0;
    });
}

function acCreateNode() {
  return { children: {}, fail: 0, output: [], depth: 0 };
}

function acGenTrieSteps(patterns) {
  var trie = [acCreateNode()];
  var steps = [];
  steps.push({ type: 'init', trie: acCloneTrie(trie), msg: 'Start with root node #0.' });

  patterns.forEach(function (pattern) {
    var cur = 0;
    for (var i = 0; i < pattern.length; i++) {
      var c = pattern[i];
      if (!(c in trie[cur].children)) {
        var newId = trie.length;
        trie.push(acCreateNode());
        trie[newId].depth = trie[cur].depth + 1;
        trie[cur].children[c] = newId;
        steps.push({
          type: 'add-node',
          trie: acCloneTrie(trie),
          from: cur,
          to: newId,
          char: c,
          pattern: pattern,
          msg:
            'Pattern "' + pattern + '": add node #' + newId + ' via "' + c + '" from #' + cur + '.',
        });
      } else {
        steps.push({
          type: 'reuse-node',
          trie: acCloneTrie(trie),
          from: cur,
          to: trie[cur].children[c],
          char: c,
          pattern: pattern,
          msg:
            'Pattern "' +
            pattern +
            '": node for "' +
            c +
            '" already exists (#' +
            trie[cur].children[c] +
            ') — reuse.',
        });
      }
      cur = trie[cur].children[c];
    }
    trie[cur].output.push(pattern);
    steps.push({
      type: 'mark-output',
      trie: acCloneTrie(trie),
      nodeId: cur,
      pattern: pattern,
      msg:
        'Pattern "' +
        pattern +
        '" complete — mark node #' +
        cur +
        ' as an output (accepting) node.',
    });
  });

  steps.push({
    type: 'done',
    trie: acCloneTrie(trie),
    msg: 'Trie complete: ' + trie.length + ' nodes for ' + patterns.length + ' pattern(s).',
  });
  return steps;
}

function acCloneTrie(trie) {
  return trie.map(function (n) {
    return {
      children: Object.assign({}, n.children),
      fail: n.fail,
      output: n.output.slice(),
      depth: n.depth,
    };
  });
}

function acBuildTrieOnly(patterns) {
  var trie = [acCreateNode()];
  patterns.forEach(function (pattern) {
    var cur = 0;
    for (var i = 0; i < pattern.length; i++) {
      var c = pattern[i];
      if (!(c in trie[cur].children)) {
        var newId = trie.length;
        trie.push(acCreateNode());
        trie[newId].depth = trie[cur].depth + 1;
        trie[cur].children[c] = newId;
      }
      cur = trie[cur].children[c];
    }
    trie[cur].output.push(pattern);
  });
  return trie;
}

function acGenFailSteps(trie) {
  trie = acCloneTrie(trie);
  var steps = [];
  var queue = [];

  // Initialize depth-1 nodes
  Object.keys(trie[0].children).forEach(function (c) {
    var childId = trie[0].children[c];
    trie[childId].fail = 0;
    queue.push(childId);
    steps.push({
      type: 'enqueue',
      trie: acCloneTrie(trie),
      queueSnapshot: queue.slice(),
      nodeId: childId,
      msg: 'Enqueue node #' + childId + ' for BFS.',
    });
    steps.push({
      type: 'set-fail',
      trie: acCloneTrie(trie),
      nodeId: childId,
      failId: 0,
      traversal: [0],
      msg: 'Depth-1 node #' + childId + ' ("' + c + '"): fail link → root (#0) by definition.',
    });
  });

  while (queue.length) {
    var uId = queue.shift();
    steps.push({
      type: 'dequeue',
      trie: acCloneTrie(trie),
      queueSnapshot: queue.slice(),
      nodeId: uId,
      msg: 'Dequeue node #' + uId + ' (process its outgoing goto edges).',
    });

    var u = trie[uId];

    Object.keys(u.children).forEach(function (c) {
      var vId = u.children[c];
      queue.push(vId);
      steps.push({
        type: 'enqueue',
        trie: acCloneTrie(trie),
        queueSnapshot: queue.slice(),
        nodeId: vId,
        msg: 'Enqueue node #' + vId + ' (child of #' + uId + ' via "' + c + '").',
      });

      // Compute failure for vId using traversal over fail links
      var f = u.fail;
      var traversal = [];
      traversal.push(f);

      while (f !== 0 && !(c in trie[f].children)) {
        f = trie[f].fail;
        traversal.push(f);
      }
      if (c in trie[f].children && trie[f].children[c] !== vId) {
        f = trie[f].children[c];
        traversal.push(f);
      } else if (!(c in trie[f].children)) {
        f = 0;
        if (traversal[traversal.length - 1] !== 0) traversal.push(0);
      }

      trie[vId].fail = f;
      trie[vId].output = trie[vId].output.concat(trie[f].output);

      steps.push({
        type: 'set-fail',
        trie: acCloneTrie(trie),
        nodeId: vId,
        failId: f,
        traversal: traversal,
        msg:
          'Node #' +
          vId +
          ' (via "' +
          c +
          '" from #' +
          uId +
          '): fail link → #' +
          f +
          (trie[f].output.length ? ' (inherits output: ' + trie[f].output.join(', ') + ')' : '') +
          '.',
      });
    });
  }

  steps.push({
    type: 'done',
    trie: acCloneTrie(trie),
    msg: 'All failure links computed via BFS. Automaton ready to search.',
  });
  return steps;
}

function acBuildFailOnly(trie) {
  trie = acCloneTrie(trie);
  var queue = [];
  Object.keys(trie[0].children).forEach(function (c) {
    var childId = trie[0].children[c];
    trie[childId].fail = 0;
    queue.push(childId);
  });
  while (queue.length) {
    var uId = queue.shift();
    var u = trie[uId];
    Object.keys(u.children).forEach(function (c) {
      var vId = u.children[c];
      queue.push(vId);
      var f = u.fail;
      while (f !== 0 && !(c in trie[f].children)) f = trie[f].fail;
      if (c in trie[f].children && trie[f].children[c] !== vId) f = trie[f].children[c];
      else if (!(c in trie[f].children)) f = 0;
      trie[vId].fail = f;
      trie[vId].output = trie[vId].output.concat(trie[f].output);
    });
  }
  return trie;
}

function acGenSearchSteps(trie, text) {
  var steps = [];
  var cur = 0;

  var failTraversals = 0;
  var successfulTransitions = 0;
  var totalSteps = 0;

  for (var i = 0; i < text.length; i++) {
    var c = text[i];
    var startCur = cur;

    var traversal = [];
    traversal.push(cur);

    while (cur !== 0 && !(c in trie[cur].children)) {
      cur = trie[cur].fail;
      traversal.push(cur);
      failTraversals++;
      totalSteps++;
    }

    if (c in trie[cur].children) {
      cur = trie[cur].children[c];
      traversal.push(cur);
      successfulTransitions++;
      totalSteps++;
    } else {
      cur = 0;
      traversal.push(0);
      totalSteps++;
    }

    var matches = trie[cur].output.slice();

    steps.push({
      type: 'char',
      charIdx: i,
      char: c,
      fromNode: startCur,
      toNode: cur,
      matches: matches,
      traversal: traversal,
      msg:
        'Position ' +
        i +
        ' ("' +
        c +
        '"): state #' +
        startCur +
        ' → #' +
        cur +
        (matches.length ? '. MATCH: ' + matches.join(', ') + ' ending here!' : '.'),
    });
  }

  steps.push({
    type: 'done',
    failTraversals: failTraversals,
    successfulTransitions: successfulTransitions,
    totalSteps: totalSteps,
    msg: 'Search complete.',
  });
  return steps;
}

function acComputeLayout(trie) {
  var positions = {};
  var byDepth = {};
  trie.forEach(function (node, id) {
    if (!byDepth[node.depth]) byDepth[node.depth] = [];
    byDepth[node.depth].push(id);
  });

  var colW = 90;
  var rowH = 60;
  Object.keys(byDepth).forEach(function (depth) {
    var ids = byDepth[depth];
    ids.forEach(function (id, idx) {
      positions[id] = { x: 60 + Number(depth) * colW, y: 45 + idx * rowH };
    });
  });
  return positions;
}

function acRenderTrieSvg(svgId, trie, opts) {
  opts = opts || {};
  var svg = document.getElementById(svgId);
  if (!svg) return;

  var positions = acComputeLayout(trie);
  var maxX = 0,
    maxY = 0;
  Object.keys(positions).forEach(function (id) {
    if (positions[id].x > maxX) maxX = positions[id].x;
    if (positions[id].y > maxY) maxY = positions[id].y;
  });
  var W = Math.max(400, maxX + 120);
  var H = Math.max(320, maxY + 80);
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);

  while (svg.firstChild) svg.removeChild(svg.firstChild);

  var defs = document.createElementNS(AC_NS, 'defs');
  [
    ['acGotoArrow', 'rgba(148,163,184,0.6)'],
    ['acFailArrow', 'rgba(168,85,247,0.5)'],
  ].forEach(function (pair) {
    var marker = document.createElementNS(AC_NS, 'marker');
    marker.setAttribute('id', pair[0]);
    marker.setAttribute('viewBox', '0 0 8 8');
    marker.setAttribute('refX', '7');
    marker.setAttribute('refY', '4');
    marker.setAttribute('markerWidth', '5');
    marker.setAttribute('markerHeight', '5');
    marker.setAttribute('orient', 'auto');
    var path = document.createElementNS(AC_NS, 'path');
    path.setAttribute('d', 'M0,0 L8,4 L0,8 z');
    path.setAttribute('fill', pair[1]);
    marker.appendChild(path);
    defs.appendChild(marker);
  });
  svg.appendChild(defs);

  if (opts.showFail !== false) {
    trie.forEach(function (node, id) {
      if (id === 0 || node.fail === undefined || !positions[id] || !positions[node.fail]) return;
      var from = positions[id];
      var to = positions[node.fail];
      var mx = (from.x + to.x) / 2;
      var my = Math.max(from.y, to.y) + 26;
      var path = document.createElementNS(AC_NS, 'path');
      path.setAttribute(
        'd',
        'M ' + from.x + ' ' + (from.y + 14) + ' Q ' + mx + ' ' + my + ' ' + to.x + ' ' + (to.y + 14)
      );
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'rgba(168,85,247,0.4)');
      path.setAttribute('stroke-width', '1.3');
      path.setAttribute('stroke-dasharray', '4 3');
      path.setAttribute('marker-end', 'url(#acFailArrow)');
      svg.appendChild(path);
    });
  }

  trie.forEach(function (node, id) {
    Object.keys(node.children).forEach(function (c) {
      var to = node.children[c];
      if (!positions[id] || !positions[to]) return;
      var from = positions[id];
      var toP = positions[to];

      var isHighlighted =
        opts.highlightEdge && opts.highlightEdge.from === id && opts.highlightEdge.char === c;

      var line = document.createElementNS(AC_NS, 'line');
      line.setAttribute('x1', from.x + 14);
      line.setAttribute('y1', from.y);
      line.setAttribute('x2', toP.x - 14);
      line.setAttribute('y2', toP.y);
      line.setAttribute('stroke', isHighlighted ? '#22c55e' : 'rgba(148,163,184,0.5)');
      line.setAttribute('stroke-width', isHighlighted ? '2.5' : '1.4');
      line.setAttribute('marker-end', 'url(#acGotoArrow)');
      svg.appendChild(line);

      var label = document.createElementNS(AC_NS, 'text');
      label.setAttribute('class', 'ac-trans-text');
      label.setAttribute('x', (from.x + toP.x) / 2);
      label.setAttribute('y', (from.y + toP.y) / 2 - 6);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('fill', isHighlighted ? '#22c55e' : 'rgba(203,213,225,0.85)');
      label.textContent = c;
      svg.appendChild(label);
    });
  });

  trie.forEach(function (node, id) {
    var pos = positions[id];
    if (!pos) return;

    var isActive = opts.activeIds && opts.activeIds.indexOf(id) !== -1;
    var isOutput = node.output && node.output.length > 0;

    var g = document.createElementNS(AC_NS, 'g');
    var circle = document.createElementNS(AC_NS, 'circle');
    circle.setAttribute('class', 'ac-node-circle');
    circle.setAttribute('cx', pos.x);
    circle.setAttribute('cy', pos.y);
    circle.setAttribute('r', '14');

    var fillColor, strokeColor;
    if (isActive) {
      fillColor = 'rgba(34,197,94,0.35)';
      strokeColor = '#22c55e';
    } else if (isOutput) {
      fillColor = 'rgba(245,158,11,0.25)';
      strokeColor = '#f59e0b';
    } else {
      fillColor = 'rgba(6,182,212,0.15)';
      strokeColor = '#06b6d4';
    }
    if (id === 0) {
      strokeColor = '#a855f7';
      fillColor = 'rgba(168,85,247,0.2)';
    }

    circle.setAttribute('fill', fillColor);
    circle.setAttribute('stroke', strokeColor);
    circle.setAttribute('stroke-width', isActive ? '2.5' : '1.5');
    g.appendChild(circle);

    var label = document.createElementNS(AC_NS, 'text');
    label.setAttribute('class', 'ac-node-label');
    label.setAttribute('x', pos.x);
    label.setAttribute('y', pos.y + 3);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', strokeColor);
    label.textContent = id;
    g.appendChild(label);

    if (isOutput) {
      var outLabel = document.createElementNS(AC_NS, 'text');
      outLabel.setAttribute('x', pos.x);
      outLabel.setAttribute('y', pos.y + 24);
      outLabel.setAttribute('text-anchor', 'middle');
      outLabel.setAttribute('font-size', '7');
      outLabel.setAttribute('fill', '#f59e0b');
      outLabel.textContent = node.output.join(',');
      g.appendChild(outLabel);
    }

    svg.appendChild(g);
  });
}

function acSetStatus(elId, msg, cls) {
  var el = document.getElementById(elId);
  if (!el) return;
  el.textContent = msg;
  el.className = 'ac-status ' + (cls || '');
}

function acAddLog(logId, msg, cls) {
  var log = document.getElementById(logId);
  if (!log) return;
  var empty = log.querySelector('.ac-log-empty');
  if (empty) empty.remove();
  var entry = document.createElement('div');
  entry.className = 'ac-log-entry ' + (cls || '');
  entry.textContent = msg;
  log.insertBefore(entry, log.firstChild);
  while (log.children.length > 60) log.removeChild(log.lastChild);
}

function acBuildTrie() {
  var input = document.getElementById('acPatternsInput');
  var patterns = acParsePatterns(input ? input.value : '');
  if (patterns.length === 0) {
    acSetStatus('acTrieStatus', 'Enter at least one pattern.', '');
    return;
  }

  acState.patterns = patterns;
  acState.trieSteps = acGenTrieSteps(patterns);
  acState.trieIdx = 0;

  var log = document.getElementById('acTrieLog');
  if (log) log.innerHTML = '<div class="ac-log-empty">No construction yet.</div>';

  var totalEl = document.getElementById('acTrieCharTotal');
  if (totalEl)
    totalEl.textContent = patterns.reduce(function (a, p) {
      return a + p.length;
    }, 0);

  var stepBtn = document.getElementById('acTrieStepBtn');
  if (stepBtn) stepBtn.disabled = false;

  acAutoPlayTrie();
}

function acAutoPlayTrie() {
  if (acState.trieIdx >= acState.trieSteps.length) return;
  acApplyTrieStep(acState.trieSteps[acState.trieIdx]);
  acState.trieIdx++;
  if (acState.trieIdx < acState.trieSteps.length) setTimeout(acAutoPlayTrie, 260);
  else {
    var b = document.getElementById('acTrieStepBtn');
    if (b) b.disabled = true;
  }
}

function acStepTrie() {
  if (acState.trieSteps.length === 0) {
    acSetStatus('acTrieStatus', 'Click Build Trie first.', '');
    return;
  }
  if (acState.trieIdx >= acState.trieSteps.length) return;
  acApplyTrieStep(acState.trieSteps[acState.trieIdx]);
  acState.trieIdx++;
  if (acState.trieIdx >= acState.trieSteps.length) {
    var b = document.getElementById('acTrieStepBtn');
    if (b) b.disabled = true;
  }
}

function acApplyTrieStep(step) {
  var activeIds = [];
  if (step.to !== undefined) activeIds.push(step.to);
  if (step.nodeId !== undefined) activeIds.push(step.nodeId);

  acRenderTrieSvg('acTrieSvg', step.trie, {
    showFail: false,
    activeIds: activeIds,
    highlightEdge:
      step.from !== undefined && step.char ? { from: step.from, char: step.char } : null,
  });
  acSetStatus('acTrieStatus', step.msg, step.type === 'done' ? 'done' : '');

  if (['add-node', 'mark-output'].indexOf(step.type) !== -1)
    acAddLog('acTrieLog', step.msg, step.type === 'mark-output' ? 'match' : '');

  var charNum = document.getElementById('acTrieCharNum');
  if (charNum && step.type === 'add-node') charNum.textContent = parseInt(charNum.textContent) + 1;

  acState.trie = step.trie;
}

function acBuildFail() {
  if (acState.patterns.length === 0) {
    acSetStatus('acFailStatus', 'Build the trie in phase 1 first.', '');
    return;
  }

  var trie = acBuildTrieOnly(acState.patterns);
  acState.failSteps = acGenFailSteps(trie);
  acState.failIdx = 0;

  var log = document.getElementById('acFailLog');
  if (log) log.innerHTML = '<div class="ac-log-empty">No computation yet.</div>';

  var stepBtn = document.getElementById('acFailStepBtn');
  if (stepBtn) stepBtn.disabled = false;

  acAutoPlayFail();
}

function acAutoPlayFail() {
  if (acState.failIdx >= acState.failSteps.length) return;
  acApplyFailStep(acState.failSteps[acState.failIdx]);
  acState.failIdx++;
  if (acState.failIdx < acState.failSteps.length) setTimeout(acAutoPlayFail, 280);
  else {
    var b = document.getElementById('acFailStepBtn');
    if (b) b.disabled = true;
  }
}

function acStepFail() {
  if (acState.failSteps.length === 0) {
    acSetStatus('acFailStatus', 'Click Compute Failure Links first.', '');
    return;
  }
  if (acState.failIdx >= acState.failSteps.length) return;
  acApplyFailStep(acState.failSteps[acState.failIdx]);
  acState.failIdx++;
  if (acState.failIdx >= acState.failSteps.length) {
    var b = document.getElementById('acFailStepBtn');
    if (b) b.disabled = true;
  }
}

function acApplyFailStep(step) {
  var activeIds = [];
  if (step.nodeId !== undefined) activeIds.push(step.nodeId);
  if (step.failId !== undefined) activeIds.push(step.failId);
  if (acState.showFailTraversal && step.traversal && step.traversal.length) {
    step.traversal.forEach(function (id) {
      if (activeIds.indexOf(id) === -1) activeIds.push(id);
    });
  }

  if (step.queueSnapshot && typeof step.queueSnapshot.length === 'number') {
    var qEl = document.getElementById('acBfsQueue');
    if (qEl) qEl.textContent = step.queueSnapshot.length ? step.queueSnapshot.join(', ') : '—';
  }

  acRenderTrieSvg('acFailSvg', step.trie, { showFail: acState.showFail, activeIds: activeIds });
  acSetStatus('acFailStatus', step.msg, step.type === 'done' ? 'done' : '');
  if (step.type === 'set-fail') acAddLog('acFailLog', step.msg, 'fail');
  acState.trieWithFail = step.trie;
}

function acRunSearch() {
  if (!acState.trieWithFail) {
    acSetStatus('acSearchStatus', 'Compute failure links in phase 2 first.', '');
    return;
  }

  var input = document.getElementById('acSearchInput');
  var text = input ? input.value : '';
  if (!text) {
    acSetStatus('acSearchStatus', 'Enter search text.', '');
    return;
  }

  acState.searchText = text;
  acState.searchSteps = acGenSearchSteps(acState.trieWithFail, text);
  acState.searchIdx = 0;
  acState.matchCount = 0;

  var traceEl = document.getElementById('acTextTrace');
  if (traceEl)
    traceEl.innerHTML = text
      .split('')
      .map(function (c, i) {
        return '<div class="ac-trace-char" id="acTraceChar' + i + '">' + c + '</div>';
      })
      .join('');

  var matchLog = document.getElementById('acMatchLog');
  if (matchLog) matchLog.innerHTML = '<div class="ac-log-empty">No matches yet.</div>';

  var stepBtn = document.getElementById('acSearchStepBtn');
  if (stepBtn) stepBtn.disabled = false;

  var naivePatterns = acState.patterns.length;
  var naiveOps = naivePatterns * text.length;
  var naiveEl = document.getElementById('acCompNaive');
  if (naiveEl) naiveEl.textContent = naiveOps;

  var elFail = document.getElementById('acCompFailTrav');
  if (elFail) elFail.textContent = 0;
  var elTrans = document.getElementById('acCompTrans');
  if (elTrans) elTrans.textContent = 0;
  var elTotal = document.getElementById('acCompTotal');
  if (elTotal) elTotal.textContent = 0;

  acAutoPlaySearch();
}

function acAutoPlaySearch() {
  if (acState.searchIdx >= acState.searchSteps.length) return;
  acApplySearchStep(acState.searchSteps[acState.searchIdx]);
  acState.searchIdx++;
  if (acState.searchIdx < acState.searchSteps.length) setTimeout(acAutoPlaySearch, 320);
  else {
    var b = document.getElementById('acSearchStepBtn');
    if (b) b.disabled = true;
  }
}

function acStepSearch() {
  if (acState.searchSteps.length === 0) {
    acSetStatus('acSearchStatus', 'Click Search first.', '');
    return;
  }
  if (acState.searchIdx >= acState.searchSteps.length) return;
  acApplySearchStep(acState.searchSteps[acState.searchIdx]);
  acState.searchIdx++;
  if (acState.searchIdx >= acState.searchSteps.length) {
    var b = document.getElementById('acSearchStepBtn');
    if (b) b.disabled = true;
  }
}

function acApplySearchStep(step) {
  if (step.type === 'done') {
    acSetStatus('acSearchStatus', step.msg, 'done');
    var elFail = document.getElementById('acCompFailTrav');
    if (elFail) elFail.textContent = step.failTraversals;
    var elTrans = document.getElementById('acCompTrans');
    if (elTrans) elTrans.textContent = step.successfulTransitions;
    var elTotal = document.getElementById('acCompTotal');
    if (elTotal) elTotal.textContent = step.totalSteps;
    return;
  }

  document.querySelectorAll('.ac-trace-char').forEach(function (el) {
    el.classList.remove('current');
  });
  var curEl = document.getElementById('acTraceChar' + step.charIdx);
  if (curEl) curEl.classList.add('current');

  var activeIds = [step.toNode];
  if (acState.showSearchTraversal && step.traversal && step.traversal.length) {
    activeIds = [];
    step.traversal.forEach(function (id) {
      if (activeIds.indexOf(id) === -1) activeIds.push(id);
    });
  }
  acRenderTrieSvg('acSearchSvg', acState.trieWithFail, { showFail: true, activeIds: activeIds });
  acSetStatus('acSearchStatus', step.msg, step.matches.length ? 'match' : '');

  if (step.matches.length) {
    step.matches.forEach(function (pattern) {
      acState.matchCount++;
      var endIdx = step.charIdx;
      var startIdx = endIdx - pattern.length + 1;
      for (var i = startIdx; i <= endIdx; i++) {
        var charEl = document.getElementById('acTraceChar' + i);
        if (charEl) charEl.classList.add('matched');
      }
      acAddLog(
        'acMatchLog',
        '"' +
          pattern +
          '" found ending at position ' +
          endIdx +
          ' (chars ' +
          startIdx +
          '-' +
          endIdx +
          ')',
        'match'
      );
    });
  }
}

function acNewPuzzle() {
  var puzzleSets = [
    { patterns: ['cat', 'art', 'car'], text: 'thecartisnearthearena' },
    { patterns: ['ice', 'nice', 'rice'], text: 'wehavenicericeandice' },
    { patterns: ['log', 'blog', 'dog'], text: 'thedogwroteablogandlog' },
    { patterns: ['sun', 'run', 'fun'], text: 'wehadfuninthesunwhilewerun' },
  ];
  var chosen = puzzleSets[Math.floor(Math.random() * puzzleSets.length)];
  acState.puzzlePatterns = chosen.patterns;

  var trie = acBuildFailOnly(acBuildTrieOnly(chosen.patterns));
  var cur = 0;
  var matchedPositions = new Array(chosen.text.length).fill(false);

  for (var i = 0; i < chosen.text.length; i++) {
    var c = chosen.text[i];
    while (cur !== 0 && !(c in trie[cur].children)) cur = trie[cur].fail;
    cur = c in trie[cur].children ? trie[cur].children[c] : 0;
    var matches = trie[cur].output;
    matches.forEach(function (pattern) {
      var end = i;
      var start = end - pattern.length + 1;
      for (var k = start; k <= end; k++) matchedPositions[k] = true;
    });
  }

  var mysteryEl = document.getElementById('acMysteryText');
  if (mysteryEl) {
    mysteryEl.innerHTML = chosen.text
      .split('')
      .map(function (ch, i) {
        return (
          '<span class="ac-mystery-char' +
          (matchedPositions[i] ? ' matched' : '') +
          '">' +
          ch +
          '</span>'
        );
      })
      .join('');
  }

  var resultEl = document.getElementById('acGuessResult');
  if (resultEl) resultEl.classList.add('hidden');
  var guessInput = document.getElementById('acGuessInput');
  if (guessInput) guessInput.value = '';
}

function acCheckGuess() {
  var input = document.getElementById('acGuessInput');
  var guesses = acParsePatterns(input ? input.value : '').map(function (s) {
    return s.toLowerCase();
  });
  var correct = acState.puzzlePatterns.slice().sort();
  var guessSorted = guesses.slice().sort();

  var isCorrect =
    correct.length === guessSorted.length &&
    correct.every(function (p, i) {
      return p === guessSorted[i];
    });

  var resultEl = document.getElementById('acGuessResult');
  if (resultEl) {
    resultEl.classList.remove('hidden');
    resultEl.className = 'ac-guess-result ' + (isCorrect ? 'correct' : 'incorrect');
    resultEl.textContent = isCorrect
      ? '✅ Correct! The hidden patterns were: ' + correct.join(', ')
      : '❌ Not quite. You guessed: ' +
        guesses.join(', ') +
        '. Try again or click New Puzzle to see the answer.';
  }
}

function acInit() {
  document.querySelectorAll('.ac-phase-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.ac-phase-btn').forEach(function (b) {
        b.classList.remove('active');
      });
      btn.classList.add('active');
      var phase = btn.getAttribute('data-phase');
      document.querySelectorAll('.ac-phase-panel').forEach(function (p) {
        p.classList.remove('active');
      });
      var panel = document.getElementById('acPhase' + phase);
      if (panel) panel.classList.add('active');
    });
  });

  document.querySelectorAll('.ac-preset-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = document.getElementById('acPatternsInput');
      if (input) input.value = btn.getAttribute('data-patterns');
      acBuildTrie();
    });
  });

  var buildTrieBtn = document.getElementById('acBuildTrieBtn');
  var trieStepBtn = document.getElementById('acTrieStepBtn');
  if (buildTrieBtn) buildTrieBtn.addEventListener('click', acBuildTrie);
  if (trieStepBtn) trieStepBtn.addEventListener('click', acStepTrie);

  var buildFailBtn = document.getElementById('acBuildFailBtn');
  var failStepBtn = document.getElementById('acFailStepBtn');
  if (buildFailBtn) buildFailBtn.addEventListener('click', acBuildFail);
  if (failStepBtn) failStepBtn.addEventListener('click', acStepFail);

  var showFailChk = document.getElementById('acShowFailLinks');
  if (showFailChk) {
    showFailChk.addEventListener('change', function () {
      acState.showFail = showFailChk.checked;
      if (acState.failIdx > 0) acApplyFailStep(acState.failSteps[acState.failIdx - 1]);
    });
  }

  var showFailTraversalChk = document.getElementById('acShowFailTraversal');
  if (showFailTraversalChk) {
    showFailTraversalChk.addEventListener('change', function () {
      acState.showFailTraversal = showFailTraversalChk.checked;
      if (acState.failIdx > 0) acApplyFailStep(acState.failSteps[acState.failIdx - 1]);
    });
  }

  var showSearchTraversalChk = document.getElementById('acShowSearchTraversal');
  if (showSearchTraversalChk) {
    showSearchTraversalChk.addEventListener('change', function () {
      acState.showSearchTraversal = showSearchTraversalChk.checked;
      // Re-render current search step if already started
      if (acState.searchIdx > 0 && acState.searchSteps.length) {
        var currentIdx = Math.min(acState.searchIdx - 1, acState.searchSteps.length - 1);
        acApplySearchStep(acState.searchSteps[currentIdx]);
      }
    });
  }

  var searchBtn = document.getElementById('acSearchBtn');
  var searchStepBtn = document.getElementById('acSearchStepBtn');
  if (searchBtn) searchBtn.addEventListener('click', acRunSearch);
  if (searchStepBtn) searchStepBtn.addEventListener('click', acStepSearch);

  var newPuzzleBtn = document.getElementById('acNewPuzzleBtn');
  var checkBtn = document.getElementById('acCheckGuessBtn');
  if (newPuzzleBtn) newPuzzleBtn.addEventListener('click', acNewPuzzle);
  if (checkBtn) checkBtn.addEventListener('click', acCheckGuess);

  var patternsInput = document.getElementById('acPatternsInput');
  if (patternsInput)
    patternsInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') acBuildTrie();
    });

  var searchInput = document.getElementById('acSearchInput');
  if (searchInput)
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') acRunSearch();
    });

  acBuildTrie();
  acNewPuzzle();
}
