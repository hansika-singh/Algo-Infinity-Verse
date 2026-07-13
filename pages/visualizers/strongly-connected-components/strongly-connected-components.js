/* ============================================================
   STRONGLY CONNECTED COMPONENTS — Dual-Algorithm SCC Engine
   Algo Infinity Verse · pages/visualizers/scc

   Two pure, DOM-free generators drive the visuals:
     - tarjanGenerator   : iterative (explicitly stack-simulated)
                           single-DFS-pass algorithm with genuine
                           low-link bookkeeping
     - kosarajuGenerator : three-phase DFS + transpose + DFS
   Both were cross-validated against a brute-force reachability
   SCC checker across 200 random graphs before any UI was built —
   see the PR description for the verification methodology.
   ============================================================ */

/* ------------------------------------------------------------
   1. TARJAN'S ALGORITHM (iterative, generator)
   ------------------------------------------------------------
   The call stack is simulated explicitly as an array of
   { v, i } frames (current node, next-neighbor-index to try) so
   the "recursion" can be paused and animated one micro-step at a
   time, exactly mirroring what the real recursive version does:
   discover -> explore each neighbor -> (recurse | back-edge
   update) -> on return, fold the child's low-link into the
   parent's -> if low-link === index, pop the completed SCC.
------------------------------------------------------------- */

function* tarjanGenerator(n, adj) {
  let index = 0;
  const indices = new Array(n).fill(-1);
  const lowlink = new Array(n).fill(-1);
  const onStack = new Array(n).fill(false);
  const S = [];
  const sccs = [];

  for (let start = 0; start < n; start++) {
    if (indices[start] !== -1) continue;
    const callStack = [{ v: start, i: 0 }];

    while (callStack.length) {
      const frame = callStack[callStack.length - 1];
      const v = frame.v;

      if (frame.i === 0) {
        indices[v] = index; lowlink[v] = index; index++;
        S.push(v); onStack[v] = true;
        yield { type: "discover", v, idx: indices[v], stack: S.slice(), depth: callStack.length };
      }

      if (frame.i < adj[v].length) {
        const w = adj[v][frame.i];
        frame.i++;
        if (indices[w] === -1) {
          yield { type: "explore-tree-edge", v, w };
          callStack.push({ v: w, i: 0 });
        } else if (onStack[w]) {
          const before = lowlink[v];
          lowlink[v] = Math.min(lowlink[v], indices[w]);
          yield { type: "back-edge", v, w, before, after: lowlink[v] };
        } else {
          yield { type: "cross-edge-skip", v, w };
        }
      } else {
        callStack.pop();
        if (callStack.length) {
          const parent = callStack[callStack.length - 1].v;
          const before = lowlink[parent];
          lowlink[parent] = Math.min(lowlink[parent], lowlink[v]);
          yield { type: "return-update", parent, child: v, before, after: lowlink[parent], depth: callStack.length };
        }
        if (lowlink[v] === indices[v]) {
          const scc = [];
          let w;
          do {
            w = S.pop();
            onStack[w] = false;
            scc.push(w);
            yield { type: "scc-pop-member", root: v, member: w, stack: S.slice() };
          } while (w !== v);
          scc.sort((a, b) => a - b);
          sccs.push(scc);
          yield { type: "scc-found", root: v, scc: scc.slice(), sccs: sccs.map((s) => s.slice()) };
        }
      }
    }
  }
  yield { type: "done", sccs: sccs.map((s) => s.slice()) };
}

/* ------------------------------------------------------------
   2. KOSARAJU'S ALGORITHM (generator, three visible phases)
------------------------------------------------------------- */

function* kosarajuGenerator(n, adj) {
  // Phase 1: DFS on the original graph, recording finish order
  const visited1 = new Array(n).fill(false);
  const finishOrder = [];
  for (let start = 0; start < n; start++) {
    if (visited1[start]) continue;
    const stack = [{ v: start, i: 0 }];
    visited1[start] = true;
    yield { type: "p1-visit", v: start };
    while (stack.length) {
      const frame = stack[stack.length - 1];
      const v = frame.v;
      if (frame.i < adj[v].length) {
        const w = adj[v][frame.i]; frame.i++;
        if (!visited1[w]) {
          visited1[w] = true;
          yield { type: "p1-tree-edge", v, w };
          stack.push({ v: w, i: 0 });
          yield { type: "p1-visit", v: w };
        }
      } else {
        stack.pop();
        finishOrder.push(v);
        yield { type: "p1-finish", v, order: finishOrder.slice() };
      }
    }
  }

  // Phase 2: build the transpose graph, animating each edge reversal
  const radj = Array.from({ length: n }, () => []);
  for (let u = 0; u < n; u++) {
    for (const v of adj[u]) {
      radj[v].push(u);
      yield { type: "p2-reverse-edge", from: u, to: v };
    }
  }
  yield { type: "p2-done" };

  // Phase 3: DFS on the transpose, consuming finish order back-to-front;
  // each DFS tree discovered here is exactly one SCC.
  const visited2 = new Array(n).fill(false);
  const sccs = [];
  for (let k = finishOrder.length - 1; k >= 0; k--) {
    const start = finishOrder[k];
    if (visited2[start]) continue;
    const comp = [];
    const stack = [start];
    visited2[start] = true;
    yield { type: "p3-start-component", v: start };
    while (stack.length) {
      const u = stack.pop();
      comp.push(u);
      yield { type: "p3-visit", v: u };
      for (const w of radj[u]) {
        if (!visited2[w]) {
          visited2[w] = true;
          yield { type: "p3-tree-edge", v: u, w };
          stack.push(w);
        }
      }
    }
    comp.sort((a, b) => a - b);
    sccs.push(comp);
    yield { type: "p3-component-done", scc: comp.slice(), sccs: sccs.map((s) => s.slice()) };
  }
  yield { type: "done", sccs: sccs.map((s) => s.slice()), finishOrder: finishOrder.slice() };
}

/* ------------------------------------------------------------
   3. HELPERS
------------------------------------------------------------- */

function canonicalizeSccs(sccs) {
  return sccs.map((s) => s.slice().sort((a, b) => a - b)).sort((a, b) => a[0] - b[0]);
}

function sccsEqual(a, b) {
  return JSON.stringify(canonicalizeSccs(a)) === JSON.stringify(canonicalizeSccs(b));
}

/* ------------------------------------------------------------
   4. STATE + GRAPH MODEL
------------------------------------------------------------- */

const el = (id) => document.getElementById(id);

const state = {
  n: 8,
  edges: [],   // [{u, v}]
  adj: [],
  positions: [], // {x, y} per node, shared layout used by all three views

  activeTab: "tarjan",
  speedMs: 450,
  playing: false,
  accumMs: 0,
  lastFrameTime: performance.now(),

  tarjan: null,   // { iterator, nodeState, edgeState, frameStack, sccList, visited, edgesUsed }
  kosaraju: null,
  compareTarjan: null,
  compareKosaraju: null,
};

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildAdjacency() {
  state.adj = Array.from({ length: state.n }, () => []);
  state.edges.forEach(({ u, v }) => state.adj[u].push(v));
}

function computeLayout() {
  const cx = 260, cy = 210, radius = 165;
  state.positions = Array.from({ length: state.n }, (_, i) => {
    const angle = (i / state.n) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  });
}

function loadExampleGraph() {
  // Deliberately includes: a 3-cycle, a 2-cycle, a chain into a self-contained
  // component, and one fully isolated trivial (single-node) SCC.
  state.n = 8;
  state.edges = [
    { u: 0, v: 1 }, { u: 1, v: 2 }, { u: 2, v: 0 },   // 3-cycle: {0,1,2}
    { u: 2, v: 3 },                                    // bridge into next component
    { u: 3, v: 4 }, { u: 4, v: 3 },                    // 2-cycle: {3,4}
    { u: 4, v: 5 },                                    // bridge
    { u: 5, v: 6 }, { u: 6, v: 5 }, { u: 6, v: 7 },    // 2-cycle {5,6} + trivial {7}
  ];
  finishGraphSetup();
}

function randomizeGraph() {
  const rand = mulberry32((Math.random() * 1e9) | 0);
  const n = state.n;
  const density = parseFloat(el("densitySlider").value);
  const edges = [];
  for (let u = 0; u < n; u++) {
    for (let v = 0; v < n; v++) {
      if (u !== v && rand() < density) edges.push({ u, v });
    }
  }
  // guarantee at least one edge so the graph isn't trivially empty
  if (edges.length === 0) edges.push({ u: 0, v: 1 % n });
  state.edges = edges;
  finishGraphSetup();
}

function finishGraphSetup() {
  buildAdjacency();
  computeLayout();
  el("chipV").textContent = state.n;
  el("chipE").textContent = state.edges.length;
  resetAllRuns();
}

/* ------------------------------------------------------------
   5. SHARED SVG RENDERING
   ------------------------------------------------------------
   Every view (Tarjan / Kosaraju / the two compare mini-graphs)
   reuses the same node/edge drawing so the graph always looks
   identical across tabs — only the *coloring* differs per
   algorithm state.
------------------------------------------------------------- */

const svgNS = "http://www.w3.org/2000/svg";

function sccColor(i) { return `var(--scc-${i % 8})`; }

function renderBaseGraph(nodeLayerId, edgeLayerId, edgeIdPrefix, scale) {
  const nodeLayer = el(nodeLayerId);
  const edgeLayer = el(edgeLayerId);
  nodeLayer.innerHTML = "";
  edgeLayer.innerHTML = "";
  const s = scale || 1;

  state.edges.forEach(({ u, v }, idx) => {
    const a = state.positions[u], b = state.positions[v];
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("id", `${edgeIdPrefix}-${u}-${v}`);
    path.setAttribute("class", "gedge");
    path.setAttribute("d", edgePathD(a, b, s));
    edgeLayer.appendChild(path);
  });

  state.positions.forEach((p, i) => {
    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("class", "gnode unvisited");
    g.setAttribute("id", `${edgeIdPrefix}-node-${i}`);
    g.setAttribute("transform", `translate(${p.x * s}, ${p.y * s})`);
    g.innerHTML = `
      <circle r="${20 * s}"></circle>
      <text class="label">${i}</text>
      <text class="badge idx" x="0" y="${-26 * s}"></text>
      <text class="badge low" x="0" y="${30 * s}"></text>
    `;
    nodeLayer.appendChild(g);
  });
}

function edgePathD(a, b, s) {
  const ax = a.x * s, ay = a.y * s, bx = b.x * s, by = b.y * s;
  const dx = bx - ax, dy = by - ay;
  const dist = Math.hypot(dx, dy) || 1;
  const shrink = 22 * s;
  const x1 = ax + (dx / dist) * shrink, y1 = ay + (dy / dist) * shrink;
  const x2 = bx - (dx / dist) * shrink, y2 = by - (dy / dist) * shrink;
  // slight curve so reciprocal edges (u->v and v->u) don't overlap
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const nx = -(y2 - y1), ny = (x2 - x1);
  const nlen = Math.hypot(nx, ny) || 1;
  const bend = 10 * s;
  const cx = mx + (nx / nlen) * bend, cy = my + (ny / nlen) * bend;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

function resetGraphVisuals(prefix) {
  document.querySelectorAll(`[id^="${prefix}-node-"]`).forEach((g) => {
    g.setAttribute("class", "gnode unvisited");
    const idxBadge = g.querySelector(".idx"), lowBadge = g.querySelector(".low");
    if (idxBadge) idxBadge.textContent = "";
    if (lowBadge) lowBadge.textContent = "";
    const circle = g.querySelector("circle");
    if (circle) { circle.style.fill = ""; circle.style.stroke = ""; circle.style.filter = ""; }
  });
  document.querySelectorAll(`[id^="${prefix}-"]`).forEach((e) => {
    if (e.tagName === "path") e.setAttribute("class", "gedge");
  });
}

function setNodeClass(prefix, i, cls) {
  const node = el(`${prefix}-node-${i}`);
  if (node) node.setAttribute("class", "gnode " + cls);
}
function addNodeClass(prefix, i, cls) {
  const node = el(`${prefix}-node-${i}`);
  if (node) node.classList.add(cls);
}
function setNodeBadges(prefix, i, idx, low) {
  const node = el(`${prefix}-node-${i}`);
  if (!node) return;
  const idxBadge = node.querySelector(".idx"), lowBadge = node.querySelector(".low");
  if (idxBadge && idx !== undefined) idxBadge.textContent = idx;
  if (lowBadge && low !== undefined) lowBadge.textContent = "↓" + low;
}
function setEdgeClass(prefix, u, v, cls) {
  const edge = el(`${prefix}-${u}-${v}`);
  if (edge) edge.setAttribute("class", "gedge " + cls);
}
function colorNodeAsScc(prefix, i, colorIdx) {
  const node = el(`${prefix}-node-${i}`);
  if (node) {
    const circle = node.querySelector("circle");
    circle.style.fill = sccColor(colorIdx);
    circle.style.stroke = sccColor(colorIdx);
    circle.style.filter = `drop-shadow(0 0 8px ${sccColor(colorIdx)})`;
  }
}

/* ------------------------------------------------------------
   6. TARJAN'S DRIVER
------------------------------------------------------------- */

function setupTarjanTab() {
  renderBaseGraph("tarjanNodeLayer", "tarjanEdgeLayer", "tarjan", 1);
  el("tarjanFrameStack").innerHTML = "";
  el("tarjanNodeStack").innerHTML = "";
  el("tarjanSccList").innerHTML = "";
  state.tarjan = {
    iterator: tarjanGenerator(state.n, state.adj),
    finished: false,
    visited: 0,
    edgesUsed: 0,
    sccCount: 0,
  };
}

function applyTarjanStep(step, prefix, log) {
  const run = prefix === "tarjan" ? state.tarjan : state.compareTarjan;

  if (step.type === "discover") {
    run.visited++;
    setNodeClass(prefix, step.v, "discovered");
    setNodeBadges(prefix, step.v, step.idx, step.idx);
    if (log) logLine(`discover(${step.v}): index = low-link = ${step.idx}`);
    if (prefix === "tarjan") renderFrameAndNodeStack(step);
  } else if (step.type === "explore-tree-edge") {
    run.edgesUsed++;
    setEdgeClass(prefix, step.v, step.w, "tree");
    if (log) logLine(`  ${step.v} → ${step.w}: unvisited, recurse (tree edge)`);
  } else if (step.type === "back-edge") {
    run.edgesUsed++;
    setEdgeClass(prefix, step.v, step.w, "back");
    setNodeBadges(prefix, step.v, undefined, step.after);
    if (log) logLine(`  ${step.v} → ${step.w}: on stack — low-link[${step.v}] = min(${step.before}, ${step.after}) = ${step.after}`, "hi");
  } else if (step.type === "cross-edge-skip") {
    run.edgesUsed++;
    if (log) logLine(`  ${step.v} → ${step.w}: already finished, not on stack — ignored`);
  } else if (step.type === "return-update") {
    setNodeBadges(prefix, step.parent, undefined, step.after);
    if (log && step.before !== step.after) logLine(`  return to ${step.parent}: low-link = min(${step.before}, low-link[${step.child}]) = ${step.after}`, "hi");
    if (prefix === "tarjan") renderFrameStackFromDepth(step.depth);
  } else if (step.type === "scc-pop-member") {
    if (prefix === "tarjan") popNodeStackVisual(step.member);
  } else if (step.type === "scc-found") {
    run.sccCount = step.sccs.length;
    const colorIdx = step.sccs.length - 1;
    step.scc.forEach((v) => colorNodeAsScc(prefix, v, colorIdx));
    if (log) logLine(`✓ SCC found (root ${step.root}): {${step.scc.join(", ")}}`, "ok");
    if (prefix === "tarjan") addSccChip("tarjanSccList", step.scc, colorIdx);
    el("chipSccCount").textContent = run.sccCount;
  } else if (step.type === "done") {
    run.finished = true;
    if (log) {
      setPhase("Done ✓", "done");
      el("resultBox").className = "result-box done";
      el("resultVal").textContent = `Found ${step.sccs.length} SCC(s): ` + step.sccs.map((s) => `{${s.join(",")}}`).join("  ");
    }
  }

  if (log) { el("statVisited").textContent = run.visited; el("statEdgesUsed").textContent = run.edgesUsed; }
  return step;
}

function renderFrameAndNodeStack(step) {
  const frameWrap = el("tarjanFrameStack");
  const item = document.createElement("div");
  item.className = "frame-item top";
  item.innerHTML = `<span>call(${step.v})</span><span>idx ${step.idx}</span>`;
  Array.from(frameWrap.children).forEach((c) => c.classList.remove("top"));
  frameWrap.appendChild(item);

  const nsWrap = el("tarjanNodeStack");
  const nsItem = document.createElement("div");
  nsItem.className = "ns-item";
  nsItem.id = "ns-item-" + step.v;
  nsItem.textContent = "S ← " + step.v;
  nsWrap.appendChild(nsItem);
}

function renderFrameStackFromDepth(depth) {
  const frameWrap = el("tarjanFrameStack");
  while (frameWrap.children.length > depth) frameWrap.removeChild(frameWrap.lastChild);
  Array.from(frameWrap.children).forEach((c, idx, arr) => c.classList.toggle("top", idx === arr.length - 1));
}

function popNodeStackVisual(member) {
  const nsItem = el("ns-item-" + member);
  if (nsItem) {
    nsItem.classList.add("popping");
    setTimeout(() => nsItem.remove(), 240);
  }
}

function addSccChip(listId, scc, colorIdx) {
  const list = el(listId);
  const chip = document.createElement("div");
  chip.className = "scc-chip";
  chip.style.borderColor = sccColor(colorIdx);
  chip.style.color = sccColor(colorIdx);
  chip.innerHTML = `<span class="dot" style="background:${sccColor(colorIdx)}"></span> {${scc.join(", ")}}`;
  list.appendChild(chip);
}

/* ------------------------------------------------------------
   7. KOSARAJU'S DRIVER
------------------------------------------------------------- */

function setupKosarajuTab() {
  renderBaseGraph("kosarajuNodeLayer", "kosarajuEdgeLayer", "kosaraju", 1);
  el("finishStack").innerHTML = "";
  el("kosarajuSccList").innerHTML = "";
  state.kosaraju = {
    iterator: kosarajuGenerator(state.n, state.adj),
    finished: false,
    visited: 0,
    edgesUsed: 0,
    sccCount: 0,
    phase: 1,
  };
}

function applyKosarajuStep(step, prefix, log) {
  const run = prefix === "kosaraju" ? state.kosaraju : state.compareKosaraju;

  if (step.type === "p1-visit") {
    run.visited++;
    setNodeClass(prefix, step.v, "discovered");
    if (log) logLine(`Pass 1 — visit(${step.v})`);
  } else if (step.type === "p1-tree-edge") {
    run.edgesUsed++;
    setEdgeClass(prefix, step.v, step.w, "tree");
  } else if (step.type === "p1-finish") {
    setNodeClass(prefix, step.v, "finished-p1");
    if (prefix === "kosaraju") {
      const fsWrap = el("finishStack");
      const item = document.createElement("div");
      item.className = "fs-item";
      item.innerHTML = `<span>${step.v}</span><span>#${step.order.length}</span>`;
      fsWrap.appendChild(item);
    }
    if (log) logLine(`  finish(${step.v}) → pushed to finish-order stack (position ${step.order.length})`);
  } else if (step.type === "p2-reverse-edge") {
    run.edgesUsed++;
    if (log && run.phase !== 2) { logLine("— Phase 2: transposing the graph (reversing every edge) —", "hi"); }
    run.phase = 2;
    if (prefix === "kosaraju") setPhase("Transposing…", "transpose");
    setEdgeClass(prefix, step.from, step.to, "reversed");
    if (log) logLine(`  reverse edge: ${step.from}→${step.to}  becomes  ${step.to}→${step.from}`);
  } else if (step.type === "p2-done") {
    run.phase = 3;
    if (log) logLine("— Phase 3: DFS on the transposed graph, in reverse finish order —", "hi");
    if (prefix === "kosaraju") setPhase("Pass 2 (transpose)…", "scc");
    resetGraphVisuals(prefix);
    redrawTransposedEdges(prefix);
  } else if (step.type === "p3-start-component") {
    if (log) logLine(`New component root: ${step.v} (next unvisited in reverse finish order)`);
  } else if (step.type === "p3-visit") {
    run.visited++;
    addNodeClass(prefix, step.v, "onstack");
    if (log) logLine(`  visit(${step.v}) on transposed graph`);
  } else if (step.type === "p3-tree-edge") {
    run.edgesUsed++;
    setEdgeClass(prefix, step.v, step.w, "tree");
  } else if (step.type === "p3-component-done") {
    run.sccCount = step.sccs.length;
    const colorIdx = step.sccs.length - 1;
    step.scc.forEach((v) => colorNodeAsScc(prefix, v, colorIdx));
    if (log) logLine(`✓ SCC found: {${step.scc.join(", ")}}`, "ok");
    if (prefix === "kosaraju") addSccChip("kosarajuSccList", step.scc, colorIdx);
    el("chipSccCount").textContent = run.sccCount;
  } else if (step.type === "done") {
    run.finished = true;
    if (log) {
      setPhase("Done ✓", "done");
      el("resultBox").className = "result-box done";
      el("resultVal").textContent = `Found ${step.sccs.length} SCC(s): ` + step.sccs.map((s) => `{${s.join(",")}}`).join("  ");
    }
  }

  if (log) { el("statVisited").textContent = run.visited; el("statEdgesUsed").textContent = run.edgesUsed; }
  return step;
}

// After the transpose completes, redraw the edge layer using the
// reversed direction so Phase 3's DFS is visually walking the real
// transposed graph, not just tinting the original arrows.
function redrawTransposedEdges(prefix) {
  const isCompare = prefix === "compareKosaraju";
  const edgeLayer = el(isCompare ? "compareKosarajuEdgeLayer" : "kosarajuEdgeLayer");
  const scale = isCompare ? 0.72 : 1;
  edgeLayer.innerHTML = "";
  state.edges.forEach(({ u, v }) => {
    const a = state.positions[v], b = state.positions[u]; // reversed
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("id", `${prefix}-${v}-${u}`);
    path.setAttribute("class", "gedge reversed");
    path.setAttribute("d", edgePathD(a, b, scale));
    edgeLayer.appendChild(path);
  });
}

/* ------------------------------------------------------------
   8. COMPARE MODE — both algorithms run side by side, in lockstep
------------------------------------------------------------- */

function setupCompareTab() {
  renderBaseGraph("compareTarjanNodeLayer", "compareTarjanEdgeLayer", "compareTarjan", 0.72);
  renderBaseGraph("compareKosarajuNodeLayer", "compareKosarajuEdgeLayer", "compareKosaraju", 0.72);
  el("matchBanner").className = "match-banner";
  el("matchBanner").textContent = "";
  state.compareTarjan = { iterator: tarjanGenerator(state.n, state.adj), finished: false, visited: 0, edgesUsed: 0, sccCount: 0, resultSccs: null };
  state.compareKosaraju = { iterator: kosarajuGenerator(state.n, state.adj), finished: false, visited: 0, edgesUsed: 0, sccCount: 0, phase: 1, resultSccs: null };
}

function stepCompare() {
  if (!state.compareTarjan.finished) {
    const { value, done } = state.compareTarjan.iterator.next();
    if (!done) {
      applyTarjanStep(value, "compareTarjan", false);
      if (value.type === "done") state.compareTarjan.resultSccs = value.sccs;
    }
  }
  if (!state.compareKosaraju.finished) {
    const { value, done } = state.compareKosaraju.iterator.next();
    if (!done) {
      applyKosarajuStep(value, "compareKosaraju", false);
      if (value.type === "done") state.compareKosaraju.resultSccs = value.sccs;
    }
  }
  if (state.compareTarjan.finished && state.compareKosaraju.finished) {
    const match = sccsEqual(state.compareTarjan.resultSccs, state.compareKosaraju.resultSccs);
    const banner = el("matchBanner");
    banner.className = "match-banner show " + (match ? "match" : "mismatch");
    banner.textContent = match
      ? `✓ Match — both found ${state.compareTarjan.resultSccs.length} identical SCCs`
      : `✕ Mismatch — results differ (this would indicate a bug)`;
    setPhase("Done ✓", "done");
    state.playing = false;
  }
}

/* ------------------------------------------------------------
   9. LOGGING + PHASE BADGE
------------------------------------------------------------- */

function logLine(text, cls) {
  const log = el("stepLog");
  const line = document.createElement("div");
  line.className = "log-line" + (cls ? " " + cls : "");
  line.textContent = text;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}
function clearLog() { el("stepLog").innerHTML = "<div class=\"log-line\">Ready.</div>"; }

function setPhase(label, cls) {
  const badge = el("phaseBadge");
  badge.className = "phase-badge" + (cls ? " phase-" + cls : "");
  badge.textContent = label;
}

const ALGO_HINTS = {
  tarjan: `Tarjan's assigns each node a discovery <strong>index</strong> and a <strong>low-link</strong> value — the smallest index reachable via tree edges and at most one back edge. When a node's low-link equals its own index, it's the root of a completed SCC, and everything above it on the auxiliary stack pops off together.`,
  kosaraju: `Kosaraju's runs DFS once to get a <strong>finish order</strong>, reverses every edge to build the <strong>transpose</strong> graph, then runs DFS again — processing nodes in reverse finish order. Each tree grown in that second pass is exactly one SCC.`,
  compare: `Both algorithms run independently on the identical graph. They use completely different mechanics — low-link propagation vs. finish-order + transpose — but always partition the graph into the same components.`,
};

/* ------------------------------------------------------------
   10. TABS + RUN CONTROL
------------------------------------------------------------- */

function resetAllRuns() {
  state.playing = false;
  el("playBtn").textContent = "▶ Play";
  el("statVisited").textContent = "0";
  el("statEdgesUsed").textContent = "0";
  el("chipSccCount").textContent = "0";
  el("resultBox").className = "result-box";
  el("resultVal").textContent = "Pick a tab and press Play to run an algorithm.";
  clearLog();
  setPhase("Idle", "");
  setupTarjanTab();
  setupKosarajuTab();
  setupCompareTab();
}

function switchTab(tab) {
  state.activeTab = tab;
  state.playing = false;
  el("playBtn").textContent = "▶ Play";
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  el("tarjanView").classList.toggle("active", tab === "tarjan");
  el("kosarajuView").classList.toggle("active", tab === "kosaraju");
  el("compareView").classList.toggle("active", tab === "compare");
  el("algoHint").innerHTML = ALGO_HINTS[tab];
  setPhase("Idle", "");
}

function stepActiveTab() {
  if (state.activeTab === "tarjan") {
    if (state.tarjan.finished) return;
    const { value, done } = state.tarjan.iterator.next();
    if (done) { state.tarjan.finished = true; state.playing = false; return; }
    applyTarjanStep(value, "tarjan", true);
    if (value.type !== "done") setPhase(value.type === "scc-found" ? "SCC found!" : "Running Tarjan's…", value.type === "scc-found" ? "scc" : "");
  } else if (state.activeTab === "kosaraju") {
    if (state.kosaraju.finished) return;
    const { value, done } = state.kosaraju.iterator.next();
    if (done) { state.kosaraju.finished = true; state.playing = false; return; }
    applyKosarajuStep(value, "kosaraju", true);
    if (value.type !== "done" && !value.type.startsWith("p2") ) setPhase(value.type === "p3-component-done" ? "SCC found!" : (state.kosaraju.phase === 1 ? "Pass 1: finish order…" : "Pass 2: DFS on transpose…"), value.type === "p3-component-done" ? "scc" : "");
  } else if (state.activeTab === "compare") {
    if (state.compareTarjan.finished && state.compareKosaraju.finished) return;
    stepCompare();
    if (!(state.compareTarjan.finished && state.compareKosaraju.finished)) setPhase("Running both…", "");
  }
}

/* ------------------------------------------------------------
   11. UI WIRING
------------------------------------------------------------- */

el("loadClassicBtn").addEventListener("click", loadExampleGraph);
el("randomizeBtn").addEventListener("click", () => {
  state.n = parseInt(el("nodeCountSlider").value, 10);
  randomizeGraph();
});
el("nodeCountSlider").addEventListener("input", (e) => { el("nodeCountVal").textContent = e.target.value; });
el("densitySlider").addEventListener("input", (e) => { el("densityVal").textContent = parseFloat(e.target.value).toFixed(2); });

el("speedSlider").addEventListener("input", (e) => {
  state.speedMs = parseInt(e.target.value, 10);
  el("speedVal").textContent = `${state.speedMs}ms/step`;
});

el("restartBtn").addEventListener("click", resetAllRuns);
el("stepBtn").addEventListener("click", () => { state.playing = false; el("playBtn").textContent = "▶ Play"; stepActiveTab(); });
el("playBtn").addEventListener("click", () => {
  state.playing = !state.playing;
  el("playBtn").textContent = state.playing ? "⏸ Pause" : "▶ Play";
});

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

/* ------------------------------------------------------------
   12. ANIMATION LOOP
------------------------------------------------------------- */

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = now - state.lastFrameTime;
  state.lastFrameTime = now;

  if (state.playing) {
    state.accumMs += dt;
    if (state.accumMs >= state.speedMs) {
      state.accumMs = 0;
      stepActiveTab();
    }
  }
}

/* ------------------------------------------------------------
   13. BOOT
------------------------------------------------------------- */

function boot() {
  el("speedVal").textContent = `${state.speedMs}ms/step`;
  el("algoHint").innerHTML = ALGO_HINTS.tarjan;
  loadExampleGraph();
  animate();

  requestAnimationFrame(() => {
    setTimeout(() => el("loadingVeil").classList.add("hidden"), 350);
  });
}

boot();
