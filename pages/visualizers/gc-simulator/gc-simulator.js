// script.js handles: loading screen, navbar, dark mode, scroll top
// This file: Garbage Collector Simulator only
// All globals prefixed gcs_ or GCS_ to avoid conflicts

document.addEventListener('DOMContentLoaded', function() {
  gcsInit();
});

let GCS_SVG_NS = 'http://www.w3.org/2000/svg';

/* ─── State ─── */
let gcsState = {
  algo        : 'marksweep',
  tool        : 'move',
  nodes       : [],     // {id, x, y, root, gen, refcount, marked, dead, age}
  edges       : [],     // {from, to}
  nextId      : 1,
  draggingId  : null,
  dragOffsetX : 0,
  dragOffsetY : 0,
  linkFrom    : null,
  gcSteps     : [],
  gcStepIdx   : 0,
  totalFreed  : 0,
  minorCount  : 0,
  promotedCount: 0,
  runType     : 'minor',
};

/* ─── Node helpers ─── */
function gcsGetNode(id) { return gcsState.nodes.find(function(n){ return n.id === id; }); }
function gcsOutgoingEdges(id) { return gcsState.edges.filter(function(e){ return e.from === id; }); }
function gcsIncomingEdges(id) { return gcsState.edges.filter(function(e){ return e.to === id; }); }

/* ─── Presets ─── */
function gcsApplyPreset(name) {
  gcsState.nodes = [];
  gcsState.edges = [];
  gcsState.nextId = 1;
  gcsResetGcOnly();

  function addNode(x, y, root) {
    let n = { id: gcsState.nextId++, x: x, y: y, root: !!root, gen: 'young', refcount: 0, marked: false, dead: false, age: 0 };
    gcsState.nodes.push(n);
    return n.id;
  }
  function addEdge(from, to) { gcsState.edges.push({ from: from, to: to }); }

  if (name === 'acyclic') {
    let root = addNode(90, 200, true);
    let a = addNode(230, 100);
    let b = addNode(230, 300);
    let c = addNode(380, 100);
    let orphan = addNode(380, 300);
    addEdge(root, a); addEdge(root, b); addEdge(a, c);
    // orphan has no incoming edges — garbage immediately

  } else if (name === 'cycle') {
    let root = addNode(80, 200, true);
    let a = addNode(220, 100);
    let b = addNode(360, 100);
    let c = addNode(220, 320);
    let d = addNode(360, 320);
    addEdge(root, a);
    // c <-> d form an isolated cycle, unreachable from root
    addEdge(c, d); addEdge(d, c);

  } else if (name === 'nested') {
    let root = addNode(60, 220, true);
    let a = addNode(190, 120);
    let b = addNode(190, 320);
    let c = addNode(320, 70);
    let d = addNode(320, 170);
    let e = addNode(320, 270);
    let f = addNode(320, 370);
    let g = addNode(450, 220);
    addEdge(root, a); addEdge(root, b);
    addEdge(a, c); addEdge(a, d);
    addEdge(b, e); addEdge(b, f);
    addEdge(d, g); addEdge(e, g);
  }

  gcsRecomputeRefcounts();
  gcsRender();
  gcsSetStatus('Preset loaded. Click Run GC to see ' + gcsAlgoLabel(gcsState.algo) + ' in action.', '🗑️', '');
}

function gcsAlgoLabel(algo) {
  return algo === 'marksweep' ? 'Mark & Sweep' : algo === 'refcount' ? 'Reference Counting' : 'Generational GC';
}

/* ─── Recompute reference counts from edges ─── */
function gcsRecomputeRefcounts() {
  gcsState.nodes.forEach(function(n) { n.refcount = gcsIncomingEdges(n.id).length + (n.root ? 1 : 0); });
}

/* ─── Add object ─── */
function gcsAddObject() {
  let wrap = document.getElementById('gcsGraphWrap');
  let w = wrap ? wrap.clientWidth : 600;
  let h = wrap ? wrap.clientHeight : 420;
  let x = 60 + Math.random() * Math.max(60, w - 160);
  let y = 60 + Math.random() * Math.max(60, h - 120);
  let n = { id: gcsState.nextId++, x: x, y: y, root: false, gen: 'young', refcount: 0, marked: false, dead: false, age: 0 };
  gcsState.nodes.push(n);
  gcsRecomputeRefcounts();
  gcsRender();
  gcsSetStatus('Object #' + n.id + ' added (unreferenced — will be garbage until linked).', '➕', '');
}

/* ─── SVG rendering ─── */
function gcsRender() {
  let svg = document.getElementById('gcsSvg');
  if (!svg) return;
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  // Arrow marker
  let defs = document.createElementNS(GCS_SVG_NS, 'defs');
  let marker = document.createElementNS(GCS_SVG_NS, 'marker');
  marker.setAttribute('id', 'gcsArrow');
  marker.setAttribute('viewBox', '0 0 10 10');
  marker.setAttribute('refX', '9'); marker.setAttribute('refY', '5');
  marker.setAttribute('markerWidth', '7'); marker.setAttribute('markerHeight', '7');
  marker.setAttribute('orient', 'auto-start-reverse');
  let path = document.createElementNS(GCS_SVG_NS, 'path');
  path.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
  path.setAttribute('fill', 'rgba(148,163,184,0.6)');
  marker.appendChild(path);
  defs.appendChild(marker);
  svg.appendChild(defs);

  // Draw edges first (under nodes)
  gcsState.edges.forEach(function(edge, idx) {
    let from = gcsGetNode(edge.from); let to = gcsGetNode(edge.to);
    if (!from || !to) return;

    let dx = to.x - from.x; let dy = to.y - from.y;
    let dist = Math.sqrt(dx*dx + dy*dy) || 1;
    let ux = dx / dist; let uy = dy / dist;
    let r = 24;
    let x1 = from.x + ux * r; let y1 = from.y + uy * r;
    let x2 = to.x - ux * (r+8); let y2 = to.y - uy * (r+8);

    let isCycleEdge = gcsIsPartOfCycle(edge.from, edge.to);

    let line = document.createElementNS(GCS_SVG_NS, 'line');
    line.setAttribute('class', 'gcs-edge-line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke', isCycleEdge ? '#ef4444' : 'rgba(148,163,184,0.5)');
    line.setAttribute('stroke-width', isCycleEdge ? '2' : '1.5');
    if (isCycleEdge) line.setAttribute('stroke-dasharray', '4 3');
    line.setAttribute('marker-end', 'url(#gcsArrow)');
    line.setAttribute('data-edge-idx', idx);
    line.addEventListener('click', function(e) {
      e.stopPropagation();
      if (gcsState.tool === 'unlink') {
        gcsState.edges.splice(idx, 1);
        gcsRecomputeRefcounts();
        gcsRender();
        gcsSetStatus('Reference removed.', '✂️', '');
      }
    });
    svg.appendChild(line);
  });

  // Draw nodes
  gcsState.nodes.forEach(function(node) {
    let g = document.createElementNS(GCS_SVG_NS, 'g');
    g.setAttribute('transform', 'translate(' + node.x + ',' + node.y + ')');

    let circle = document.createElementNS(GCS_SVG_NS, 'circle');
    circle.setAttribute('class', 'gcs-node-circle');
    circle.setAttribute('r', '24');

    let fillColor, strokeColor;
    if (node.dead) { fillColor = 'rgba(239,68,68,0.25)'; strokeColor = '#ef4444'; }
    else if (gcsState.algo === 'generational') {
      fillColor   = node.gen === 'old' ? 'rgba(168,85,247,0.25)' : 'rgba(6,182,212,0.25)';
      strokeColor = node.gen === 'old' ? '#a855f7' : '#06b6d4';
    } else if (node.marked) { fillColor = 'rgba(34,197,94,0.25)'; strokeColor = '#22c55e'; }
    else { fillColor = 'rgba(255,255,255,0.05)'; strokeColor = 'rgba(148,163,184,0.4)'; }

    if (node.root) { strokeColor = '#f59e0b'; }

    circle.setAttribute('fill', fillColor);
    circle.setAttribute('stroke', strokeColor);
    circle.setAttribute('stroke-width', node.root ? '3' : '2');

    circle.addEventListener('mousedown', function(e) { gcsHandleNodeMouseDown(e, node); });
    circle.addEventListener('click', function(e) { e.stopPropagation(); gcsHandleNodeClick(node); });
    circle.addEventListener('touchstart', function(e) { e.preventDefault(); gcsHandleNodeTouchStart(e, node); }, { passive:false });

    g.appendChild(circle);

    // Root house icon
    if (node.root) {
      let rootIcon = document.createElementNS(GCS_SVG_NS, 'text');
      rootIcon.setAttribute('y', '-30');
      rootIcon.setAttribute('text-anchor', 'middle');
      rootIcon.setAttribute('font-size', '12');
      rootIcon.textContent = '🏠';
      g.appendChild(rootIcon);
    }

    // Label
    let label = document.createElementNS(GCS_SVG_NS, 'text');
    label.setAttribute('class', 'gcs-node-label');
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dy', '4');
    label.setAttribute('fill', strokeColor);
    label.textContent = '#' + node.id;
    g.appendChild(label);

    // Refcount badge (only show in refcount mode)
    if (gcsState.algo === 'refcount') {
      let rcBg = document.createElementNS(GCS_SVG_NS, 'circle');
      rcBg.setAttribute('cx', '18'); rcBg.setAttribute('cy', '-18'); rcBg.setAttribute('r', '9');
      rcBg.setAttribute('fill', node.refcount === 0 ? '#ef4444' : '#06b6d4');
      g.appendChild(rcBg);

      let rcText = document.createElementNS(GCS_SVG_NS, 'text');
      rcText.setAttribute('class', 'gcs-node-rc');
      rcText.setAttribute('x', '18'); rcText.setAttribute('y', '-14');
      rcText.setAttribute('text-anchor', 'middle');
      rcText.setAttribute('fill', '#fff');
      rcText.textContent = node.refcount;
      g.appendChild(rcText);
    }

    svg.appendChild(g);
  });

  gcsUpdateHeapStats();
  if (gcsState.algo === 'refcount') gcsRenderRefcountPanel();
  if (gcsState.algo === 'generational') gcsRenderGenerationalPanel();
}

/* ─── Cycle detection (for visual dashing) ─── */
function gcsIsPartOfCycle(fromId, toId) {
  // Simple: check if there's a path from `to` back to `from`
  let visited = {};
  function dfs(id, target) {
    if (id === target) return true;
    if (visited[id]) return false;
    visited[id] = true;
    let outs = gcsOutgoingEdges(id);
    for (let i = 0; i < outs.length; i++) { if (dfs(outs[i].to, target)) return true; }
    return false;
  }
  return dfs(toId, fromId);
}

/* ─── Node interactions ─── */
function gcsHandleNodeMouseDown(e, node) {
  e.stopPropagation();
  if (gcsState.tool === 'move') {
    gcsState.draggingId = node.id;
    let svg = document.getElementById('gcsSvg');
    let rect = svg.getBoundingClientRect();
    gcsState.dragOffsetX = e.clientX - rect.left - node.x;
    gcsState.dragOffsetY = e.clientY - rect.top - node.y;
  } else if (gcsState.tool === 'link') {
    gcsState.linkFrom = node.id;
  }
}

function gcsHandleNodeTouchStart(e, node) {
  if (gcsState.tool === 'move') {
    gcsState.draggingId = node.id;
    let svg = document.getElementById('gcsSvg');
    let rect = svg.getBoundingClientRect();
    let touch = e.touches[0];
    gcsState.dragOffsetX = touch.clientX - rect.left - node.x;
    gcsState.dragOffsetY = touch.clientY - rect.top - node.y;
  } else if (gcsState.tool === 'link') {
    gcsState.linkFrom = node.id;
  } else {
    gcsHandleNodeClick(node);
  }
}

function gcsHandleNodeClick(node) {
  if (gcsState.tool === 'root') {
    node.root = !node.root;
    gcsRecomputeRefcounts();
    gcsRender();
    gcsSetStatus(node.root ? 'Object #' + node.id + ' is now a root (always reachable).' : 'Object #' + node.id + ' is no longer a root.', '🏠', '');
  } else if (gcsState.tool === 'link' && gcsState.linkFrom !== null && gcsState.linkFrom !== node.id) {
    let exists = gcsState.edges.some(function(e){ return e.from === gcsState.linkFrom && e.to === node.id; });
    if (!exists) {
      gcsState.edges.push({ from: gcsState.linkFrom, to: node.id });
      gcsRecomputeRefcounts();
      gcsSetStatus('Reference added: #' + gcsState.linkFrom + ' → #' + node.id, '🔗', '');
    }
    gcsState.linkFrom = null;
    gcsRender();
  }
}

/* ─── Mouse/touch move/up for dragging ─── */
function gcsInitDragHandlers() {
  let svg = document.getElementById('gcsSvg');
  if (!svg) return;

  document.addEventListener('mousemove', function(e) {
    if (gcsState.draggingId === null) return;
    let node = gcsGetNode(gcsState.draggingId);
    if (!node) return;
    let rect = svg.getBoundingClientRect();
    node.x = Math.max(28, Math.min(rect.width - 28, e.clientX - rect.left - gcsState.dragOffsetX));
    node.y = Math.max(28, Math.min(rect.height - 28, e.clientY - rect.top - gcsState.dragOffsetY));
    gcsRender();
  });

  document.addEventListener('mouseup', function() { gcsState.draggingId = null; });

  document.addEventListener('touchmove', function(e) {
    if (gcsState.draggingId === null) return;
    e.preventDefault();
    let touch = e.touches[0];
    let node = gcsGetNode(gcsState.draggingId);
    if (!node) return;
    let rect = svg.getBoundingClientRect();
    node.x = Math.max(28, Math.min(rect.width - 28, touch.clientX - rect.left - gcsState.dragOffsetX));
    node.y = Math.max(28, Math.min(rect.height - 28, touch.clientY - rect.top - gcsState.dragOffsetY));
    gcsRender();
  }, { passive: false });

  document.addEventListener('touchend', function() { gcsState.draggingId = null; });
}

/* ─── Status ─── */
function gcsSetStatus(msg, icon, cls) {
  let msgEl  = document.getElementById('gcsStatusMsg');
  let iconEl = document.getElementById('gcsStatusIcon');
  let wrap   = document.getElementById('gcsStatus');
  if (msgEl)  msgEl.textContent  = msg;
  if (iconEl) iconEl.textContent = icon || '🗑️';
  if (wrap)   wrap.className = 'gcs-status ' + (cls || '');
}

/* ─── Heap stats ─── */
function gcsUpdateHeapStats() {
  let total = gcsState.nodes.length;
  let dead  = gcsState.nodes.filter(function(n){ return n.dead; }).length;
  let live  = total - dead;

  let t = document.getElementById('gcsHeapTotal');
  let l = document.getElementById('gcsHeapLive');
  let d = document.getElementById('gcsHeapDead');
  let f = document.getElementById('gcsHeapFreed');
  if (t) t.textContent = total;
  if (l) l.textContent = live;
  if (d) d.textContent = dead;
  if (f) f.textContent = gcsState.totalFreed;
}

/* ─── Reference Counting panel ─── */
function gcsRenderRefcountPanel() {
  let list = document.getElementById('gcsRefcountList');
  let warning = document.getElementById('gcsCycleWarning');
  if (!list) return;

  let hasLeak = false;

  list.innerHTML = gcsState.nodes.map(function(n) {
    let reachable = gcsIsReachableFromRoot(n.id);
    let isLeak = !reachable && n.refcount > 0;
    if (isLeak) hasLeak = true;
    let cls = n.refcount === 0 ? 'gcs-rc-zero' : isLeak ? 'gcs-rc-leak' : '';
    return '<div class="gcs-rc-item ' + cls + '">' +
      '<span class="gcs-rc-name">Object #' + n.id + (n.root ? ' (root)' : '') + '</span>' +
      '<span class="gcs-rc-count">refcount: ' + n.refcount + '</span>' +
    '</div>';
  }).join('');

  if (warning) warning.classList.toggle('hidden', !hasLeak);
}

/* ─── Reachability check (used by refcount leak detection) ─── */
function gcsIsReachableFromRoot(targetId) {
  let roots = gcsState.nodes.filter(function(n){ return n.root; }).map(function(n){ return n.id; });
  let visited = {};
  let queue = roots.slice();
  while (queue.length) {
    let cur = queue.shift();
    if (cur === targetId) return true;
    if (visited[cur]) continue;
    visited[cur] = true;
    gcsOutgoingEdges(cur).forEach(function(e) { if (!visited[e.to]) queue.push(e.to); });
  }
  return false;
}

/* ─── Generational panel ─── */
function gcsRenderGenerationalPanel() {
  let young = gcsState.nodes.filter(function(n){ return n.gen === 'young' && !n.dead; }).length;
  let old   = gcsState.nodes.filter(function(n){ return n.gen === 'old' && !n.dead; }).length;
  let total = Math.max(1, young + old);

  let yc = document.getElementById('gcsYoungCount');
  let oc = document.getElementById('gcsOldCount');
  let yb = document.getElementById('gcsYoungBar');
  let ob = document.getElementById('gcsOldBar');
  let mc = document.getElementById('gcsMinorCount');
  let pc = document.getElementById('gcsPromotedCount');

  if (yc) yc.textContent = young;
  if (oc) oc.textContent = old;
  if (yb) yb.style.width = Math.round(young/total*100) + '%';
  if (ob) ob.style.width = Math.round(old/total*100) + '%';
  if (mc) mc.textContent = gcsState.minorCount;
  if (pc) pc.textContent = gcsState.promotedCount;
}

/* ─── GC Algorithms: step generators ─── */

function gcsGenMarkSweepSteps() {
  let steps = [];
  let roots = gcsState.nodes.filter(function(n){ return n.root; });

  steps.push({ phase:'mark', type:'start', msg:'Phase 1: MARK — starting traversal from ' + roots.length + ' root object(s).' });

  let visited = {};
  let queue = roots.map(function(n){ return n.id; });
  while (queue.length) {
    let cur = queue.shift();
    if (visited[cur]) continue;
    visited[cur] = true;
    steps.push({ phase:'mark', type:'mark-node', nodeId:cur, msg:'Mark object #' + cur + ' as reachable.' });
    gcsOutgoingEdges(cur).forEach(function(e) {
      if (!visited[e.to]) { queue.push(e.to); steps.push({ phase:'mark', type:'traverse', from:cur, to:e.to, msg:'Follow reference #' + cur + ' → #' + e.to }); }
    });
  }

  steps.push({ phase:'mark', type:'mark-done', markedIds: Object.keys(visited).map(Number), msg:'Mark phase complete. ' + Object.keys(visited).length + ' object(s) reachable.' });

  steps.push({ phase:'sweep', type:'start', msg:'Phase 2: SWEEP — scanning entire heap for unmarked objects.' });

  let sweptIds = [];
  gcsState.nodes.forEach(function(n) {
    if (!visited[n.id]) {
      sweptIds.push(n.id);
      steps.push({ phase:'sweep', type:'sweep-node', nodeId:n.id, msg:'Object #' + n.id + ' not marked — UNREACHABLE. Free it.' });
    } else {
      steps.push({ phase:'sweep', type:'keep-node', nodeId:n.id, msg:'Object #' + n.id + ' is marked — keep.' });
    }
  });

  steps.push({ phase:'sweep', type:'done', markedIds: Object.keys(visited).map(Number), sweptIds: sweptIds, msg:'Sweep complete. ' + sweptIds.length + ' object(s) freed. ' + Object.keys(visited).length + ' object(s) remain live.' });

  return steps;
}

function gcsGenRefcountSteps() {
  let steps = [];
  steps.push({ phase:'refcount', type:'start', msg:'Reference Counting: checking each object\'s refcount immediately.' });

  let freedIds = [];
  let leakIds  = [];

  gcsState.nodes.forEach(function(n) {
    let reachable = gcsIsReachableFromRoot(n.id);
    if (n.refcount === 0) {
      freedIds.push(n.id);
      steps.push({ phase:'refcount', type:'free', nodeId:n.id, msg:'Object #' + n.id + ' has refcount=0 → freed immediately.' });
    } else if (!reachable) {
      leakIds.push(n.id);
      steps.push({ phase:'refcount', type:'leak', nodeId:n.id, msg:'⚠️ Object #' + n.id + ' is unreachable from root but refcount=' + n.refcount + ' (cyclic reference). LEAKED — refcounting cannot free it.' });
    } else {
      steps.push({ phase:'refcount', type:'keep', nodeId:n.id, msg:'Object #' + n.id + ' has refcount=' + n.refcount + ' — alive.' });
    }
  });

  steps.push({ phase:'refcount', type:'done', freedIds: freedIds, leakIds: leakIds, msg: leakIds.length > 0
    ? '⚠️ Done. ' + freedIds.length + ' freed, but ' + leakIds.length + ' object(s) LEAKED due to cycles!'
    : '✅ Done. ' + freedIds.length + ' object(s) freed. No cycles — refcounting worked perfectly.' });

  return steps;
}

function gcsGenGenerationalSteps() {
  let steps = [];
  let scope = gcsState.runType === 'major' ? 'entire heap (young + old)' : 'young generation only';
  steps.push({ phase:'gen', type:'start', msg: (gcsState.runType === 'major' ? 'MAJOR' : 'MINOR') + ' GC: scanning ' + scope + '.' });

  let candidates = gcsState.runType === 'major' ? gcsState.nodes : gcsState.nodes.filter(function(n){ return n.gen === 'young'; });

  let roots = gcsState.nodes.filter(function(n){ return n.root; });
  let visited = {};
  let queue = roots.map(function(n){ return n.id; });
  while (queue.length) {
    let cur = queue.shift();
    if (visited[cur]) continue;
    visited[cur] = true;
    gcsOutgoingEdges(cur).forEach(function(e){ if (!visited[e.to]) queue.push(e.to); });
  }

  let freedIds = [];
  let promotedIds = [];

  candidates.forEach(function(n) {
    if (!visited[n.id]) {
      freedIds.push(n.id);
      steps.push({ phase:'gen', type:'free', nodeId:n.id, msg:'Object #' + n.id + ' unreachable — freed from ' + n.gen + ' gen.' });
    } else {
      n.age = (n.age || 0) + 1;
      if (n.gen === 'young' && n.age >= 2) {
        promotedIds.push(n.id);
        steps.push({ phase:'gen', type:'promote', nodeId:n.id, msg:'Object #' + n.id + ' survived ' + n.age + ' collection(s) — PROMOTED to old generation.' });
      } else {
        steps.push({ phase:'gen', type:'survive', nodeId:n.id, msg:'Object #' + n.id + ' survives (age=' + n.age + ').' });
      }
    }
  });

  steps.push({ phase:'gen', type:'done', freedIds: freedIds, promotedIds: promotedIds, msg: 'GC complete. ' + freedIds.length + ' freed, ' + promotedIds.length + ' promoted to old gen.' });

  return steps;
}

/* ─── Run GC ─── */
function gcsRunGc() {
  // Reset visual state but not graph structure
  gcsState.nodes.forEach(function(n) { n.marked = false; });

  if (gcsState.algo === 'marksweep') gcsState.gcSteps = gcsGenMarkSweepSteps();
  else if (gcsState.algo === 'refcount') gcsState.gcSteps = gcsGenRefcountSteps();
  else gcsState.gcSteps = gcsGenGenerationalSteps();

  gcsState.gcStepIdx = 0;

  let stepBtn = document.getElementById('gcsStepBtn');
  if (stepBtn) stepBtn.disabled = false;

  // Reset phase indicators
  let pm = document.getElementById('gcsPhaseMark');
  let ps = document.getElementById('gcsPhaseSweep');
  if (pm) pm.className = 'gcs-phase';
  if (ps) ps.className = 'gcs-phase';

  gcsAutoPlay();
}

function gcsAutoPlay() {
  if (gcsState.gcStepIdx >= gcsState.gcSteps.length) return;
  gcsApplyGcStep();
  gcsState.gcStepIdx++;
  if (gcsState.gcStepIdx < gcsState.gcSteps.length) {
    setTimeout(gcsAutoPlay, 450);
  }
}

function gcsGcStep() {
  if (gcsState.gcStepIdx >= gcsState.gcSteps.length) return;
  gcsApplyGcStep();
  gcsState.gcStepIdx++;
  if (gcsState.gcStepIdx >= gcsState.gcSteps.length) {
    let stepBtn = document.getElementById('gcsStepBtn');
    if (stepBtn) stepBtn.disabled = true;
  }
}

function gcsApplyGcStep() {
  let step = gcsState.gcSteps[gcsState.gcStepIdx];
  if (!step) return;

  // Update phase indicators (mark & sweep)
  if (gcsState.algo === 'marksweep') {
    let pm = document.getElementById('gcsPhaseMark');
    let ps = document.getElementById('gcsPhaseSweep');
    if (step.phase === 'mark') { if (pm) pm.className = 'gcs-phase active'; }
    if (step.phase === 'sweep') {
      if (pm) pm.className = 'gcs-phase done';
      if (ps) ps.className = 'gcs-phase active';
    }
  }

  // Apply node state changes
  if (step.type === 'mark-node') {
    let n = gcsGetNode(step.nodeId); if (n) n.marked = true;
  } else if (step.type === 'sweep-node' || step.type === 'free') {
    let n = gcsGetNode(step.nodeId);
    if (n && !n.dead) { n.dead = true; gcsState.totalFreed++; }
  } else if (step.type === 'promote') {
    let n = gcsGetNode(step.nodeId); if (n) { n.gen = 'old'; gcsState.promotedCount++; }
  } else if (step.type === 'done') {
    if (step.phase === 'gen') gcsState.minorCount = gcsState.runType === 'minor' ? gcsState.minorCount + 1 : gcsState.minorCount;
  }

  // Status + classes
  let cls = step.type === 'leak' ? 'leak' : step.phase === 'mark' ? 'marking' : step.phase === 'sweep' ? 'sweeping' : step.type === 'done' ? 'done' : '';
  let icon = step.type === 'leak' ? '⚠️' : step.phase === 'mark' ? '🔍' : step.phase === 'sweep' ? '🧹' : step.type === 'done' ? '✅' : '🗑️';
  gcsSetStatus(step.msg, icon, cls);

  // Update mark/sweep stats
  if (step.type === 'mark-done') {
    let el = document.getElementById('gcsMsMarked');
    if (el) el.textContent = step.markedIds.length;
  }
  if (step.type === 'done' && step.phase === 'sweep') {
    let sweptEl = document.getElementById('gcsMsSwept');
    let heapEl  = document.getElementById('gcsMsHeap');
    if (sweptEl) sweptEl.textContent = step.sweptIds.length;
    if (heapEl) heapEl.textContent = gcsState.nodes.length + ' / ' + (gcsState.nodes.length - step.sweptIds.length);
  }

  gcsRender();
}

function gcsResetGcOnly() {
  gcsState.nodes.forEach(function(n) { n.marked = false; n.dead = false; n.gen = 'young'; n.age = 0; });
  gcsState.gcSteps = [];
  gcsState.gcStepIdx = 0;
  gcsState.totalFreed = 0;
  gcsState.minorCount = 0;
  gcsState.promotedCount = 0;

  let stepBtn = document.getElementById('gcsStepBtn');
  if (stepBtn) stepBtn.disabled = true;

  let msMarked = document.getElementById('gcsMsMarked');
  let msSwept  = document.getElementById('gcsMsSwept');
  let msHeap   = document.getElementById('gcsMsHeap');
  if (msMarked) msMarked.textContent = '0';
  if (msSwept)  msSwept.textContent  = '0';
  if (msHeap)   msHeap.textContent   = '— / —';

  let pm = document.getElementById('gcsPhaseMark');
  let ps = document.getElementById('gcsPhaseSweep');
  if (pm) pm.className = 'gcs-phase';
  if (ps) ps.className = 'gcs-phase';

  gcsRender();
  gcsSetStatus('GC state reset. Graph unchanged. Click Run GC to collect again.', '🗑️', '');
}

/* ─── Switch algorithm panel ─── */
function gcsSwitchAlgoPanel(algo) {
  document.querySelectorAll('.gcs-algo-detail').forEach(function(p) { p.classList.remove('active'); });
  let panel = document.getElementById('gcsPanel' + gcsCapFirst(algo));
  if (panel) panel.classList.add('active');
}

function gcsCapFirst(s) { return s[0].toUpperCase() + s.slice(1); }

/* ─── Init ─── */
function gcsInit() {
  gcsApplyPreset('acyclic');
  gcsInitDragHandlers();

  // Algo buttons
  document.querySelectorAll('.gcs-algo-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.gcs-algo-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      gcsState.algo = btn.getAttribute('data-algo');
      gcsSwitchAlgoPanel(gcsState.algo);
      gcsResetGcOnly();
      gcsSetStatus('Switched to ' + gcsAlgoLabel(gcsState.algo) + '. Click Run GC to collect.', '🔄', '');
    });
  });

  // Graph tool buttons
  document.querySelectorAll('.gcs-graph-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.gcs-graph-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      gcsState.tool = btn.getAttribute('data-tool');
      gcsState.linkFrom = null;

      let hints = {
        move:   'Move mode — drag objects to reposition',
        link:   'Link mode — click one object then another to add a reference',
        unlink: 'Unlink mode — click a reference arrow to remove it',
        root:   'Root mode — click an object to toggle it as a GC root',
      };
      let hintEl = document.getElementById('gcsToolHint');
      if (hintEl) hintEl.textContent = hints[gcsState.tool] || '';
    });
  });

  // Add object
  let addBtn = document.getElementById('gcsAddObjBtn');
  if (addBtn) addBtn.addEventListener('click', gcsAddObject);

  // Presets
  document.querySelectorAll('.gcs-preset-btn').forEach(function(btn) {
    btn.addEventListener('click', function() { gcsApplyPreset(btn.getAttribute('data-preset')); });
  });

  // Run / Step / Reset
  let runBtn   = document.getElementById('gcsRunBtn');
  let stepBtn  = document.getElementById('gcsStepBtn');
  let resetBtn = document.getElementById('gcsResetGcBtn');
  if (runBtn)   runBtn.addEventListener('click', gcsRunGc);
  if (stepBtn)  stepBtn.addEventListener('click', gcsGcStep);
  if (resetBtn) resetBtn.addEventListener('click', gcsResetGcOnly);

  // Generational run-type toggle
  let minorBtn = document.getElementById('gcsMinorBtn');
  let majorBtn = document.getElementById('gcsMajorBtn');
  if (minorBtn) minorBtn.addEventListener('click', function() {
    gcsState.runType = 'minor';
    minorBtn.classList.add('active');
    if (majorBtn) majorBtn.classList.remove('active');
  });
  if (majorBtn) majorBtn.addEventListener('click', function() {
    gcsState.runType = 'major';
    majorBtn.classList.add('active');
    if (minorBtn) minorBtn.classList.remove('active');
  });

  // Click empty SVG cancels link-in-progress
  let svg = document.getElementById('gcsSvg');
  if (svg) {
    svg.addEventListener('click', function() {
      if (gcsState.tool === 'link') gcsState.linkFrom = null;
    });
  }

  window.addEventListener('resize', gcsRender);
}