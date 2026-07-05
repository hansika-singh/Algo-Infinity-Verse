document.addEventListener('DOMContentLoaded', function() {
  saeInit();
});

var SAE_SVG_NS = 'http://www.w3.org/2000/svg';

/* ─── State ─── */
var saeState = {
  string    : '',
  states    : [],      // [{ len, link, next:{}, isClone, id }]
  last      : 0,
  steps     : [],       // construction steps for replay
  stepIdx   : 0,
  positions : {},        // computed node x,y per state id
  showLinks : true,
};

/* ─── Build step generator (instrumented Blumer's algorithm) ─── */
function saeGenBuildSteps(s) {
  var states = [{ len: 0, link: -1, next: {}, isClone: false }];
  var last = 0;
  var steps = [];

  steps.push({ type: 'init', states: saeCloneStates(states), last: last, msg: 'Start with the root state (state 0): empty string, len=0.' });

  for (var i = 0; i < s.length; i++) {
    var c = s[i];
    var cur = states.length;
    states.push({ len: states[last].len + 1, link: -1, next: {}, isClone: false });

    steps.push({ type: 'new-state', states: saeCloneStates(states), last: last, newId: cur, char: c, charIdx: i,
      msg: 'Adding character "' + c + '" (position ' + i + '). Create new state #' + cur + ' with len=' + states[cur].len + '.' });

    var p = last;
    while (p !== -1 && !(c in states[p].next)) {
      states[p].next[c] = cur;
      steps.push({ type: 'add-transition', states: saeCloneStates(states), from: p, to: cur, char: c,
        msg: 'State #' + p + ' has no "' + c + '" transition — add edge #' + p + ' --' + c + '--> #' + cur + '.' });
      p = states[p].link;
    }

    if (p === -1) {
      states[cur].link = 0;
      steps.push({ type: 'set-link', states: saeCloneStates(states), nodeId: cur, link: 0,
        msg: 'Reached root without finding "' + c + '" transition. Set link[#' + cur + '] = root (state 0).' });
    } else {
      var q = states[p].next[c];
      steps.push({ type: 'found-q', states: saeCloneStates(states), p: p, q: q, char: c,
        msg: 'State #' + p + ' already has a "' + c + '" transition to #' + q + '. Checking if lengths align...' });

      if (states[p].len + 1 === states[q].len) {
        states[cur].link = q;
        steps.push({ type: 'set-link', states: saeCloneStates(states), nodeId: cur, link: q,
          msg: 'len[#' + p + ']+1 == len[#' + q + ']: lengths align perfectly. Set link[#' + cur + '] = #' + q + '. No clone needed.' });
      } else {
        var clone = states.length;
        states.push({ len: states[p].len + 1, link: states[q].link, next: Object.assign({}, states[q].next), isClone: true });

        steps.push({ type: 'clone-create', states: saeCloneStates(states), cloneId: clone, sourceId: q,
          msg: '⚠️ len[#' + p + ']+1 (' + (states[p].len+1) + ') ≠ len[#' + q + '] (' + states[q].len + '): CLONE state #' + q + ' into new state #' + clone + ' with len=' + states[clone].len + '. Copies all transitions from #' + q + '.' });

        var pp = p;
        while (pp !== -1 && states[pp].next[c] === q) {
          states[pp].next[c] = clone;
          steps.push({ type: 'redirect', states: saeCloneStates(states), from: pp, oldTo: q, newTo: clone, char: c,
            msg: 'Redirect transition #' + pp + ' --' + c + '--> now points to clone #' + clone + ' instead of #' + q + '.' });
          pp = states[pp].link;
        }

        states[q].link = clone;
        states[cur].link = clone;
        steps.push({ type: 'relink', states: saeCloneStates(states), qId: q, curId: cur, cloneId: clone,
          msg: 'link[#' + q + '] = #' + clone + ' and link[#' + cur + '] = #' + clone + '. Clone now sits between them in the suffix link tree.' });
      }
    }

    last = cur;
    steps.push({ type: 'char-done', states: saeCloneStates(states), last: last, charIdx: i,
      msg: 'Character "' + c + '" fully processed. last = #' + cur + '. Moving to next character.' });
  }

  steps.push({ type: 'done', states: saeCloneStates(states), msg: 'Construction complete! ' + states.length + ' total states for string of length ' + s.length + '.' });

  return steps;
}

function saeCloneStates(states) {
  return states.map(function(st) {
    return { len: st.len, link: st.link, next: Object.assign({}, st.next), isClone: st.isClone };
  });
}

/* ─── Compute distinct substring count ─── */
function saeCountDistinct(states) {
  var total = 0;
  for (var i = 1; i < states.length; i++) {
    var link = states[i].link;
    var linkLen = link >= 0 ? states[link].len : 0;
    total += states[i].len - linkLen;
  }
  return total;
}

/* ─── Layout: simple level-based layout using BFS depth from root ─── */
function saeComputeLayout(states) {
  var positions = {};
  var depths = {};
  var visited = {};
  var queue = [{ id: 0, depth: 0 }];
  visited[0] = true; depths[0] = 0;

  while (queue.length) {
    var cur = queue.shift();
    Object.keys(states[cur.id].next).forEach(function(c) {
      var nb = states[cur.id].next[c];
      if (!visited[nb]) { visited[nb] = true; depths[nb] = cur.depth + 1; queue.push({ id: nb, depth: cur.depth + 1 }); }
    });
  }

  // Any unvisited (shouldn't happen but safety) get max depth + 1
  states.forEach(function(st, id) { if (!visited[id]) depths[id] = (Math.max.apply(null, Object.values(depths)) || 0) + 1; });

  // Group by depth
  var byDepth = {};
  states.forEach(function(st, id) {
    var d = depths[id];
    if (!byDepth[d]) byDepth[d] = [];
    byDepth[d].push(id);
  });

  var maxDepth = Math.max.apply(null, Object.keys(byDepth).map(Number));
  var colWidth = 110;
  var rowHeight = 70;

  Object.keys(byDepth).forEach(function(d) {
    var ids = byDepth[d];
    var x = 60 + Number(d) * colWidth;
    ids.forEach(function(id, idx) {
      var y = 50 + idx * rowHeight + (ids.length === 1 ? 0 : 0);
      positions[id] = { x: x, y: y };
    });
  });

  return positions;
}

/* ─── Render SVG graph ─── */
function saeRenderGraph(svgId, states, opts) {
  opts = opts || {};
  var svg = document.getElementById(svgId);
  if (!svg) return;

  var positions = saeComputeLayout(states);

  // Determine svg size
  var maxX = 0, maxY = 0;
  Object.keys(positions).forEach(function(id) {
    if (positions[id].x > maxX) maxX = positions[id].x;
    if (positions[id].y > maxY) maxY = positions[id].y;
  });
  var W = Math.max(500, maxX + 150);
  var H = Math.max(380, maxY + 100);
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);

  while (svg.firstChild) svg.removeChild(svg.firstChild);

  // Defs (arrow markers)
  var defs = document.createElementNS(SAE_SVG_NS, 'defs');
  [['saeTransArrow','rgba(148,163,184,0.6)'], ['saeLinkArrow','rgba(168,85,247,0.5)']].forEach(function(pair) {
    var marker = document.createElementNS(SAE_SVG_NS, 'marker');
    marker.setAttribute('id', pair[0]);
    marker.setAttribute('viewBox', '0 0 8 8'); marker.setAttribute('refX', '7'); marker.setAttribute('refY', '4');
    marker.setAttribute('markerWidth', '5'); marker.setAttribute('markerHeight', '5'); marker.setAttribute('orient', 'auto');
    var path = document.createElementNS(SAE_SVG_NS, 'path');
    path.setAttribute('d', 'M0,0 L8,4 L0,8 z');
    path.setAttribute('fill', pair[1]);
    marker.appendChild(path);
    defs.appendChild(marker);
  });
  svg.appendChild(defs);

  // Suffix links (dashed, drawn first/under)
  if (opts.showLinks !== false) {
    states.forEach(function(st, id) {
      if (st.link < 0 || !positions[id] || !positions[st.link]) return;
      var from = positions[id]; var to = positions[st.link];
      var line = document.createElementNS(SAE_SVG_NS, 'path');
      var mx = (from.x + to.x) / 2; var my = Math.max(from.y, to.y) + 28;
      var d = 'M ' + from.x + ' ' + (from.y+16) + ' Q ' + mx + ' ' + my + ' ' + to.x + ' ' + (to.y+16);
      line.setAttribute('d', d);
      line.setAttribute('fill', 'none');
      line.setAttribute('stroke', 'rgba(168,85,247,0.45)');
      line.setAttribute('stroke-width', '1.3');
      line.setAttribute('stroke-dasharray', '4 3');
      line.setAttribute('marker-end', 'url(#saeLinkArrow)');
      svg.appendChild(line);
    });
  }

  // Transitions (solid)
  states.forEach(function(st, id) {
    Object.keys(st.next).forEach(function(c) {
      var to = st.next[c];
      if (!positions[id] || !positions[to]) return;
      var from = positions[id]; var toP = positions[to];

      var isHighlighted = opts.highlightEdge && opts.highlightEdge.from === id && opts.highlightEdge.char === c;

      var line = document.createElementNS(SAE_SVG_NS, 'line');
      line.setAttribute('x1', from.x + 16); line.setAttribute('y1', from.y);
      line.setAttribute('x2', toP.x - 16);  line.setAttribute('y2', toP.y);
      line.setAttribute('stroke', isHighlighted ? '#22c55e' : 'rgba(148,163,184,0.55)');
      line.setAttribute('stroke-width', isHighlighted ? '2.5' : '1.4');
      line.setAttribute('marker-end', 'url(#saeTransArrow)');
      svg.appendChild(line);

      var label = document.createElementNS(SAE_SVG_NS, 'text');
      label.setAttribute('class', 'sae-trans-text');
      label.setAttribute('x', (from.x + toP.x) / 2);
      label.setAttribute('y', (from.y + toP.y) / 2 - 6);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('fill', isHighlighted ? '#22c55e' : 'rgba(203,213,225,0.85)');
      label.textContent = c;
      svg.appendChild(label);
    });
  });

  // Nodes
  states.forEach(function(st, id) {
    var pos = positions[id];
    if (!pos) return;

    var isActive = opts.activeIds && opts.activeIds.indexOf(id) !== -1;
    var isClone  = st.isClone;

    var g = document.createElementNS(SAE_SVG_NS, 'g');

    var circle = document.createElementNS(SAE_SVG_NS, 'circle');
    circle.setAttribute('class', 'sae-node-circle');
    circle.setAttribute('cx', pos.x); circle.setAttribute('cy', pos.y); circle.setAttribute('r', '16');

    var fillColor, strokeColor;
    if (isActive)      { fillColor = 'rgba(34,197,94,0.3)';  strokeColor = '#22c55e'; }
    else if (isClone)  { fillColor = 'rgba(245,158,11,0.22)'; strokeColor = '#f59e0b'; }
    else               { fillColor = 'rgba(6,182,212,0.18)'; strokeColor = '#06b6d4'; }
    if (id === 0)      { strokeColor = '#a855f7'; fillColor = 'rgba(168,85,247,0.2)'; }

    circle.setAttribute('fill', fillColor);
    circle.setAttribute('stroke', strokeColor);
    circle.setAttribute('stroke-width', isActive ? '2.5' : '1.5');
    g.appendChild(circle);

    var label = document.createElementNS(SAE_SVG_NS, 'text');
    label.setAttribute('class', 'sae-node-label');
    label.setAttribute('x', pos.x); label.setAttribute('y', pos.y + 3);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', strokeColor);
    label.textContent = id;
    g.appendChild(label);

    var lenLabel = document.createElementNS(SAE_SVG_NS, 'text');
    lenLabel.setAttribute('class', 'sae-node-len');
    lenLabel.setAttribute('x', pos.x); lenLabel.setAttribute('y', pos.y + 26);
    lenLabel.setAttribute('text-anchor', 'middle');
    lenLabel.setAttribute('fill', 'rgba(148,163,184,0.6)');
    lenLabel.textContent = 'len=' + st.len;
    g.appendChild(lenLabel);

    svg.appendChild(g);
  });
}

/* ─── Status helper ─── */
function saeSetStatus(elId, msg, cls) {
  var el = document.getElementById(elId);
  if (!el) return;
  el.textContent = msg;
  el.className = 'sae-status ' + (cls || '');
}

/* ─── Build & Explore: apply step ─── */
function saeApplyBuildStep(step) {
  var activeIds = [];
  if (step.newId !== undefined) activeIds.push(step.newId);
  if (step.cloneId !== undefined) activeIds.push(step.cloneId);
  if (step.nodeId !== undefined) activeIds.push(step.nodeId);

  saeRenderGraph('saeSvg', step.states, {
    showLinks: saeState.showLinks,
    activeIds: activeIds,
    highlightEdge: step.from !== undefined && step.char ? { from: step.from, char: step.char } : null,
  });

  var cls = step.type === 'clone-create' ? 'clone' : step.type === 'done' ? 'done' : '';
  saeSetStatus('saeStatus', step.msg, cls);

  // Log
  var logCls = step.type === 'clone-create' ? 'sae-log-clone' : step.type === 'set-link' || step.type === 'relink' ? 'sae-log-link' : 'sae-log-extend';
  if (['new-state','add-transition','set-link','clone-create','redirect','relink'].indexOf(step.type) !== -1) {
    saeAddLog(step.msg, logCls);
  }

  // Stats
  var states = step.states;
  var cloneCount = states.filter(function(s){return s.isClone;}).length;
  var distinct = saeCountDistinct(states);
  var n = saeState.string.length;

  var stateCountEl = document.getElementById('saeStateCount');
  var cloneCountEl = document.getElementById('saeCloneCount');
  var distinctEl   = document.getElementById('saeDistinctCount');
  var naiveEl      = document.getElementById('saeNaiveCount');
  var wowStateEl   = document.getElementById('saeWowStateCount');
  var wowDistinctEl= document.getElementById('saeWowDistinctCount');

  if (stateCountEl) stateCountEl.textContent = states.length;
  if (cloneCountEl) cloneCountEl.textContent = cloneCount;
  if (distinctEl)   distinctEl.textContent   = distinct;
  if (naiveEl)       naiveEl.textContent      = Math.round(n*(n+1)/2);
  if (wowStateEl)    wowStateEl.textContent   = states.length;
  if (wowDistinctEl) wowDistinctEl.textContent= distinct;
}

function saeAddLog(msg, cls) {
  var log = document.getElementById('saeLog');
  if (!log) return;
  var empty = log.querySelector('.sae-log-empty');
  if (empty) empty.remove();
  var entry = document.createElement('div');
  entry.className = 'sae-log-entry ' + cls;
  entry.textContent = msg;
  log.insertBefore(entry, log.firstChild);
  while (log.children.length > 50) log.removeChild(log.lastChild);
}

/* ─── Build (full run) ─── */
function saeBuild() {
  var input = document.getElementById('saeInputString');
  var s = (input ? input.value : '').trim();
  if (!s) { saeSetStatus('saeStatus', 'Enter a non-empty string first.', 'notfound'); return; }
  if (s.length > 14) { saeSetStatus('saeStatus', 'Keep strings ≤14 characters for a readable graph.', 'notfound'); return; }

  saeState.string = s;
  saeState.steps = saeGenBuildSteps(s);
  saeState.stepIdx = 0;

  var charTotalEl = document.getElementById('saeCharTotal');
  if (charTotalEl) charTotalEl.textContent = s.length;

  var log = document.getElementById('saeLog');
  if (log) log.innerHTML = '<div class="sae-log-empty">No construction yet.</div>';

  var stepBtn = document.getElementById('saeStepBtn');
  if (stepBtn) stepBtn.disabled = false;

  saeAutoPlay();
}

function saeAutoPlay() {
  if (saeState.stepIdx >= saeState.steps.length) return;
  saeApplyBuildStep(saeState.steps[saeState.stepIdx]);
  saeUpdateCharCounter();
  saeState.stepIdx++;
  if (saeState.stepIdx < saeState.steps.length) {
    setTimeout(saeAutoPlay, 280);
  } else {
    var stepBtn = document.getElementById('saeStepBtn');
    if (stepBtn) stepBtn.disabled = true;
  }
}

function saeStep() {
  if (saeState.steps.length === 0) { saeSetStatus('saeStatus', 'Click Build Online first.', 'notfound'); return; }
  if (saeState.stepIdx >= saeState.steps.length) return;
  saeApplyBuildStep(saeState.steps[saeState.stepIdx]);
  saeUpdateCharCounter();
  saeState.stepIdx++;
  if (saeState.stepIdx >= saeState.steps.length) {
    var stepBtn = document.getElementById('saeStepBtn');
    if (stepBtn) stepBtn.disabled = true;
  }
}

function saeUpdateCharCounter() {
  var lastStep = saeState.steps[saeState.stepIdx];
  var n = document.getElementById('saeCharNum');
  if (n && lastStep && lastStep.charIdx !== undefined) n.textContent = lastStep.charIdx + 1;
}

function saeReset() {
  saeState.steps = [];
  saeState.stepIdx = 0;
  saeState.states = [];

  var svg = document.getElementById('saeSvg');
  if (svg) while (svg.firstChild) svg.removeChild(svg.firstChild);

  var log = document.getElementById('saeLog');
  if (log) log.innerHTML = '<div class="sae-log-empty">No construction yet.</div>';

  ['saeStateCount','saeCloneCount','saeDistinctCount','saeNaiveCount','saeWowStateCount','saeWowDistinctCount'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.textContent = id.indexOf('State') !== -1 && id.indexOf('Wow') === -1 ? '1' : '0';
  });

  var charNum = document.getElementById('saeCharNum');
  var charTotal = document.getElementById('saeCharTotal');
  if (charNum) charNum.textContent = '0';
  if (charTotal) charTotal.textContent = '0';

  var stepBtn = document.getElementById('saeStepBtn');
  if (stepBtn) stepBtn.disabled = true;

  saeSetStatus('saeStatus', 'Type a string and click Build Online to watch the automaton construct itself character by character.', '');
}

/* ─── Build automaton (non-instrumented, for query/lcs modes) ─── */
function saeBuildAutomaton(s) {
  var states = [{ len: 0, link: -1, next: {}, isClone: false }];
  var last = 0;

  for (var i = 0; i < s.length; i++) {
    var c = s[i];
    var cur = states.length;
    states.push({ len: states[last].len + 1, link: -1, next: {}, isClone: false });
    var p = last;
    while (p !== -1 && !(c in states[p].next)) { states[p].next[c] = cur; p = states[p].link; }
    if (p === -1) { states[cur].link = 0; }
    else {
      var q = states[p].next[c];
      if (states[p].len + 1 === states[q].len) { states[cur].link = q; }
      else {
        var clone = states.length;
        states.push({ len: states[p].len + 1, link: states[q].link, next: Object.assign({}, states[q].next), isClone: true });
        var pp = p;
        while (pp !== -1 && states[pp].next[c] === q) { states[pp].next[c] = clone; pp = states[pp].link; }
        states[q].link = clone;
        states[cur].link = clone;
      }
    }
    last = cur;
  }
  return states;
}

/* ─── Query mode ─── */
function saeRunQuery() {
  if (!saeState.string) {
    saeSetStatus('saeQueryStatus', 'Build a string in the "Build & Explore" tab first.', 'notfound');
    return;
  }

  var queryInput = document.getElementById('saeQueryInput');
  var q = (queryInput ? queryInput.value : '').trim();
  if (!q) { saeSetStatus('saeQueryStatus', 'Enter a substring to query.', 'notfound'); return; }

  var states = saeBuildAutomaton(saeState.string);
  var v = 0;
  var path = [0];
  var found = true;

  for (var i = 0; i < q.length; i++) {
    var c = q[i];
    if (c in states[v].next) { v = states[v].next[c]; path.push(v); }
    else { found = false; break; }
  }

  saeRenderGraph('saeQuerySvg', states, { showLinks: false, activeIds: path });

  var resultEl = document.getElementById('saeQueryResult');
  if (resultEl) {
    resultEl.classList.remove('hidden');
    resultEl.className = 'sae-query-result ' + (found ? 'found' : 'notfound');
    resultEl.innerHTML = found
      ? '✅ <strong>"' + q + '"</strong> IS a substring of <strong>"' + saeState.string + '"</strong>. Traversal reached state #' + v + ' in exactly ' + q.length + ' transitions — O(query length), regardless of how long the original string is.'
      : '❌ <strong>"' + q + '"</strong> is NOT a substring of <strong>"' + saeState.string + '"</strong>. Traversal failed at character ' + i + ' ("' + q[i] + '") — no transition exists from the current state.';
  }

  saeSetStatus('saeQueryStatus', found ? 'Match found! See the highlighted path above.' : 'No match — traversal broke at character ' + i + '.', found ? 'found' : 'notfound');
}

/* ─── LCS mode ─── */
function saeRunLcs() {
  var aInput = document.getElementById('saeLcsA');
  var bInput = document.getElementById('saeLcsB');
  var a = (aInput ? aInput.value : '').trim();
  var b = (bInput ? bInput.value : '').trim();

  if (!a || !b) { saeSetStatus('saeLcsStatus', 'Enter both strings.', 'notfound'); return; }
  if (a.length > 16 || b.length > 16) { saeSetStatus('saeLcsStatus', 'Keep strings ≤16 characters.', 'notfound'); return; }

  var states = saeBuildAutomaton(a);

  var v = 0, l = 0, best = 0, bestEnd = -1;
  var matchFlags = new Array(b.length).fill(false);

  for (var i = 0; i < b.length; i++) {
    var c = b[i];
    while (v !== -1 && v !== 0 && !(c in states[v].next)) {
      v = states[v].link;
      l = states[v].len;
    }
    if (c in states[v].next) {
      v = states[v].next[c];
      l++;
    } else {
      v = 0; l = 0;
    }
    if (l > best) { best = l; bestEnd = i; }
  }

  var lcsStr = best > 0 ? b.substring(bestEnd - best + 1, bestEnd + 1) : '';

  // Mark matched positions in B
  if (best > 0) {
    for (var k = bestEnd - best + 1; k <= bestEnd; k++) matchFlags[k] = true;
  }

  // Mark matched positions in A (first occurrence of lcsStr)
  var aMatchFlags = new Array(a.length).fill(false);
  if (lcsStr) {
    var idx = a.indexOf(lcsStr);
    if (idx !== -1) for (var k = idx; k < idx + lcsStr.length; k++) aMatchFlags[k] = true;
  }

  var aRow = document.getElementById('saeLcsARow');
  var bRow = document.getElementById('saeLcsBRow');
  if (aRow) aRow.innerHTML = a.split('').map(function(ch, i) {
    return '<div class="sae-lcs-char' + (aMatchFlags[i] ? ' sae-lcs-match' : '') + '">' + ch + '</div>';
  }).join('');
  if (bRow) bRow.innerHTML = b.split('').map(function(ch, i) {
    return '<div class="sae-lcs-char' + (matchFlags[i] ? ' sae-lcs-match' : '') + '">' + ch + '</div>';
  }).join('');

  var resultEl = document.getElementById('saeLcsResult');
  var answerEl = document.getElementById('saeLcsAnswer');
  if (resultEl) resultEl.classList.remove('hidden');
  if (answerEl) {
    answerEl.innerHTML = best > 0
      ? '✅ Longest Common Substring: <strong>"' + lcsStr + '"</strong> (length ' + best + '). Found by streaming "' + b + '" through the automaton built on "' + a + '" — total time O(' + a.length + '+' + b.length + ') = O(' + (a.length+b.length) + ') operations, never re-scanning "' + a + '".'
      : '❌ No common substring found between "' + a + '" and "' + b + '".';
  }

  saeSetStatus('saeLcsStatus', best > 0 ? 'LCS found: "' + lcsStr + '"' : 'No common substring.', best > 0 ? 'found' : 'notfound');
}

/* ─── Init ─── */
function saeInit() {
  // Mode tabs
  document.querySelectorAll('.sae-mode-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.sae-mode-tab').forEach(function(t) { t.classList.remove('active'); });
      tab.classList.add('active');
      var mode = tab.getAttribute('data-mode');
      document.querySelectorAll('.sae-panel').forEach(function(p) { p.classList.remove('active'); });
      var panel = document.getElementById('saePanel' + mode[0].toUpperCase() + mode.slice(1));
      if (panel) panel.classList.add('active');

      // Update "built on" label when entering Query mode
      if (mode === 'query') {
        var builtOnEl = document.getElementById('saeQueryBuiltOn');
        if (builtOnEl) builtOnEl.textContent = saeState.string ? '"' + saeState.string + '"' : '— (build a string first in Build & Explore tab)';
      }
    });
  });

  // Preset buttons
  document.querySelectorAll('.sae-preset-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var input = document.getElementById('saeInputString');
      if (input) input.value = btn.getAttribute('data-str');
      saeBuild();
    });
  });

  // Build / Step / Reset
  var buildBtn = document.getElementById('saeBuildBtn');
  var stepBtn  = document.getElementById('saeStepBtn');
  var resetBtn = document.getElementById('saeResetBtn');
  if (buildBtn) buildBtn.addEventListener('click', saeBuild);
  if (stepBtn)  stepBtn.addEventListener('click', saeStep);
  if (resetBtn) resetBtn.addEventListener('click', saeReset);

  // Show links toggle
  var linksCheck = document.getElementById('saeShowLinks');
  if (linksCheck) {
    linksCheck.addEventListener('change', function() {
      saeState.showLinks = linksCheck.checked;
      if (saeState.stepIdx > 0 && saeState.steps[saeState.stepIdx - 1]) {
        saeApplyBuildStep(saeState.steps[saeState.stepIdx - 1]);
      }
    });
  }

  // Enter key on input
  var inputEl = document.getElementById('saeInputString');
  if (inputEl) inputEl.addEventListener('keydown', function(e) { if (e.key === 'Enter') saeBuild(); });

  // Query
  var queryBtn = document.getElementById('saeQueryRunBtn');
  if (queryBtn) queryBtn.addEventListener('click', saeRunQuery);
  var queryInput = document.getElementById('saeQueryInput');
  if (queryInput) queryInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') saeRunQuery(); });

  // LCS
  var lcsBtn = document.getElementById('saeLcsRunBtn');
  if (lcsBtn) lcsBtn.addEventListener('click', saeRunLcs);

  // Initial build
  saeBuild();
}