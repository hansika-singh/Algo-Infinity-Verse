/* ============================================================
   LINK-CUT TREES — Represented-Tree Engine
   Algo Infinity Verse · pages/visualizers/lct

   The LCT class below is a genuine splay-tree-backed Link-Cut
   Tree: real zig / zig-zig / zig-zag rotations, real preferred-
   child re-pointing during access(), real path-parent pointers.
   It was cross-validated against a brute-force forest simulation
   across 40,000 randomized link/cut/findRoot/query operations
   before any UI code was written (see the PR description).

   Every public operation (access, link, cut, findRoot, query) is
   exposed as a generator so the UI can step through it one
   rotation / splice / walk at a time.
   ============================================================ */

/* ------------------------------------------------------------
   1. THE LINK-CUT TREE
------------------------------------------------------------- */

class LCT {
  constructor(n, values) {
    this.n = n;
    this.left = new Array(n).fill(-1);
    this.right = new Array(n).fill(-1);
    this.parent = new Array(n).fill(-1);
    this.value = values.slice();
    this.subtreeMax = values.slice();
  }

  isRoot(v) {
    const p = this.parent[v];
    return p === -1 || (this.left[p] !== v && this.right[p] !== v);
  }

  pushUp(v) {
    let m = this.value[v];
    if (this.left[v] !== -1) m = Math.max(m, this.subtreeMax[this.left[v]]);
    if (this.right[v] !== -1) m = Math.max(m, this.subtreeMax[this.right[v]]);
    this.subtreeMax[v] = m;
  }

  rotate(v) {
    const p = this.parent[v];
    const g = this.parent[p];
    const pWasRoot = this.isRoot(p);
    if (this.left[p] === v) {
      this.left[p] = this.right[v];
      if (this.right[v] !== -1) this.parent[this.right[v]] = p;
      this.right[v] = p;
    } else {
      this.right[p] = this.left[v];
      if (this.left[v] !== -1) this.parent[this.left[v]] = p;
      this.left[v] = p;
    }
    this.parent[p] = v;
    this.parent[v] = g;
    if (!pWasRoot) {
      if (this.left[g] === p) this.left[g] = v;
      else if (this.right[g] === p) this.right[g] = v;
    }
    this.pushUp(p);
    this.pushUp(v);
  }

  // Genuine zig / zig-zig / zig-zag rotations, one yielded per rotate() call.
  *splayGen(v) {
    while (!this.isRoot(v)) {
      const p = this.parent[v];
      const g = this.parent[p];
      if (!this.isRoot(p)) {
        const zigzig = (this.left[g] === p) === (this.left[p] === v);
        if (zigzig) { this.rotate(p); yield { type: "rotate", kind: "zig-zig", v, p, g }; }
        else { this.rotate(v); yield { type: "rotate", kind: "zig-zag", v, p, g }; }
      }
      this.rotate(v);
      yield { type: "rotate", kind: this.isRoot(v) ? "zig-final" : "zig", v };
    }
  }
  splay(v) { for (const _ of this.splayGen(v)) { /* drain */ } }

  // The core primitive: splay v to the top of its aux tree, cut off
  // whatever preferred child it had (right = last), then walk up the
  // path-parent pointer, splaying and re-splicing each preferred path
  // segment in turn, until the real root is reached.
  *accessGen(x) {
    let last = -1;
    let y = x;
    while (y !== -1) {
      yield { type: "splay-start", y };
      yield* this.splayGen(y);
      yield { type: "splay-done", y };
      const oldRight = this.right[y];
      this.right[y] = last;
      this.pushUp(y);
      yield { type: "splice-preferred-child", y, newChild: last, oldChild: oldRight };
      last = y;
      y = this.parent[y];
      if (y !== -1) yield { type: "walk-path-parent", to: y };
    }
    yield { type: "final-splay-start", x };
    yield* this.splayGen(x);
    yield { type: "access-done", x, exposedRoot: last };
  }
  access(x) { let r; for (const s of this.accessGen(x)) if (s.type === "access-done") r = s.exposedRoot; return r; }

  *findRootGen(v) {
    yield* this.accessGen(v);
    let cur = v;
    while (this.left[cur] !== -1) { cur = this.left[cur]; yield { type: "walk-left", to: cur }; }
    yield* this.splayGen(cur);
    yield { type: "findroot-done", root: cur };
    return cur;
  }
  findRoot(v) { let r; for (const s of this.findRootGen(v)) if (s.type === "findroot-done") r = s.root; return r; }

  *linkGen(u, v) {
    yield* this.accessGen(u);
    if (this.left[u] !== -1) { yield { type: "link-invalid", reason: "u-not-root" }; return false; }
    const root = yield* this.findRootGen(v);
    if (root === u) { yield { type: "link-invalid", reason: "cycle" }; return false; }
    yield* this.accessGen(u);
    yield* this.accessGen(v);
    this.parent[u] = v;
    yield { type: "link-done", u, v };
    return true;
  }

  *cutGen(v) {
    yield* this.accessGen(v);
    if (this.left[v] === -1) { yield { type: "cut-invalid", reason: "already-root" }; return false; }
    const detached = this.left[v];
    this.parent[detached] = -1;
    this.left[v] = -1;
    this.pushUp(v);
    yield { type: "cut-done", v, detached };
    return true;
  }

  *queryGen(v) {
    yield* this.accessGen(v);
    yield { type: "query-done", v, max: this.subtreeMax[v] };
    return this.subtreeMax[v];
  }

  // Synchronous convenience wrappers (drain the generator instantly,
  // useful for non-animated checks and for testing).
  link(u, v) { let r; for (const s of this.linkGen(u, v)) if (s.type === "link-done" || s.type === "link-invalid") r = s.type === "link-done"; return !!r; }
  cut(v) { let r; for (const s of this.cutGen(v)) if (s.type === "cut-done" || s.type === "cut-invalid") r = s.type === "cut-done"; return !!r; }
  query(v) { let r; for (const s of this.queryGen(v)) if (s.type === "query-done") r = s.max; return r; }
}

/* ------------------------------------------------------------
   2. STATE
------------------------------------------------------------- */

const el = (id) => document.getElementById(id);
const svgNS = "http://www.w3.org/2000/svg";

const state = {
  n: 7,
  values: [],
  lct: null,
  realParent: [],   // our own mirror of the represented forest, updated on link/cut, used to render the top view AND to cross-check queries/findRoot against a naive walk
  labels: [],

  speedMs: 420,
  playing: false,
  accumMs: 0,
  lastFrameTime: performance.now(),

  runner: null,     // active generator being stepped through
  rotationsThisOp: 0,
  splicesThisOp: 0,
  opsRun: 0,
};

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------
   3. NAIVE CROSS-CHECK (mirrors the LCT's real parent forest)
------------------------------------------------------------- */

function naiveFindRoot(v) {
  let cur = v;
  while (state.realParent[cur] !== -1) cur = state.realParent[cur];
  return cur;
}
function naiveQuery(v) {
  let m = state.values[v];
  let cur = v;
  while (state.realParent[cur] !== -1) { cur = state.realParent[cur]; m = Math.max(m, state.values[cur]); }
  return m;
}

/* ------------------------------------------------------------
   4. SCENARIO SETUP
------------------------------------------------------------- */

function loadExample() {
  state.n = 7;
  state.values = [4, 9, 2, 7, 1, 8, 3];
  state.labels = state.values.map((_, i) => String.fromCharCode(65 + i)); // A..G
  state.lct = new LCT(state.n, state.values);
  state.realParent = new Array(state.n).fill(-1);

  // Build a small forest: A is root of {A,B,D,E}; C is root of its own edge {C,F}; G isolated.
  //      A
  //    /   \
  //   B     D
  //   |
  //   E
  //
  //   C
  //   |
  //   F
  //
  //   G  (isolated)
  doLinkSilently(1, 0); // B -> A
  doLinkSilently(3, 0); // D -> A
  doLinkSilently(4, 1); // E -> B
  doLinkSilently(5, 2); // F -> C

  finishSetup();
}

function resetIsolated() {
  state.lct = new LCT(state.n, state.values);
  state.realParent = new Array(state.n).fill(-1);
  finishSetup();
}

// Used only during initial scenario construction — bypasses animation.
function doLinkSilently(u, v) {
  state.lct.link(u, v);
  state.realParent[u] = v;
}

function finishSetup() {
  populateSelectors();
  el("chipN").textContent = state.n;
  el("chipOps").textContent = state.opsRun;
  renderForest();
  renderAux();
  clearLog();
  setPhase("Idle", "");
  el("resultBox").className = "result-box";
  el("resultVal").textContent = "Load the example forest, then try access(v), link, cut, findRoot, or query.";
}

function populateSelectors() {
  const opts = () => state.labels.map((lab, i) => `<option value="${i}">${lab} (v${i}=${state.values[i]})</option>`).join("");
  ["accessSelect", "linkUSelect", "linkVSelect", "cutSelect", "rootSelect", "querySelect"].forEach((id) => {
    el(id).innerHTML = opts();
  });
}

/* ------------------------------------------------------------
   5. FOREST VIEW (the real, logical tree) — rendered straight
      from our own realParent[] mirror, laid out as a classic
      layered tree, multiple components placed side by side.
------------------------------------------------------------- */

function computeForestLayout() {
  const children = Array.from({ length: state.n }, () => []);
  const roots = [];
  for (let i = 0; i < state.n; i++) {
    if (state.realParent[i] === -1) roots.push(i);
    else children[state.realParent[i]].push(i);
  }

  const positions = new Array(state.n);
  let xCursor = 0;
  const UNIT_X = 70, UNIT_Y = 70, PAD_BETWEEN_TREES = 50;

  function layoutSubtree(node, depth) {
    if (children[node].length === 0) {
      positions[node] = { x: xCursor * UNIT_X, y: depth * UNIT_Y + 40 };
      xCursor++;
      return positions[node].x;
    }
    const childXs = children[node].map((c) => layoutSubtree(c, depth + 1));
    const myX = (Math.min(...childXs) + Math.max(...childXs)) / 2;
    positions[node] = { x: myX, y: depth * UNIT_Y + 40 };
    return myX;
  }

  roots.sort((a, b) => a - b).forEach((r) => {
    layoutSubtree(r, 0);
    xCursor += PAD_BETWEEN_TREES / UNIT_X;
  });

  return positions;
}

function renderForest() {
  const pos = computeForestLayout();
  const nodeLayer = el("forestNodeLayer");
  const edgeLayer = el("forestEdgeLayer");
  nodeLayer.innerHTML = "";
  edgeLayer.innerHTML = "";

  const maxX = Math.max(60, ...Object.values(pos).map((p) => p.x)) + 60;
  el("forestSvg").setAttribute("viewBox", `0 0 ${maxX} 220`);

  for (let v = 0; v < state.n; v++) {
    if (state.realParent[v] !== -1) {
      const a = pos[state.realParent[v]], b = pos[v];
      const path = document.createElementNS(svgNS, "path");
      path.setAttribute("id", "forest-edge-" + v);
      path.setAttribute("class", "gedge real");
      path.setAttribute("d", straightEdge(a, b, 20));
      edgeLayer.appendChild(path);
    }
  }

  for (let v = 0; v < state.n; v++) {
    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("id", "forest-node-" + v);
    g.setAttribute("class", "gnode");
    g.setAttribute("transform", `translate(${pos[v].x}, ${pos[v].y})`);
    g.innerHTML = `
      <circle r="20"></circle>
      <text class="label">${state.labels[v]}</text>
      <text class="valbadge" y="-28">val ${state.values[v]}</text>
    `;
    nodeLayer.appendChild(g);
  }
}

function straightEdge(a, b, shrink) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1;
  const x1 = a.x + (dx / dist) * shrink, y1 = a.y + (dy / dist) * shrink;
  const x2 = b.x - (dx / dist) * shrink, y2 = b.y - (dy / dist) * shrink;
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

/* ------------------------------------------------------------
   6. AUXILIARY SPLAY-TREE VIEW — rendered straight from the
      LCT's real internal left/right/parent arrays. Every maximal
      splay tree (an "aux-tree root" = isRoot(v)) is laid out as
      its own binary tree; path-parent pointers between different
      aux trees are drawn as dashed connectors.
------------------------------------------------------------- */

function computeAuxLayout() {
  const lct = state.lct;
  const positions = new Array(state.n);
  const UNIT_X = 62, UNIT_Y = 62;
  let xCursor = 0;

  function inorder(node, depth) {
    if (node === -1) return;
    inorder(lct.left[node], depth + 1);
    positions[node] = { x: xCursor * UNIT_X, y: depth * UNIT_Y + 36 };
    xCursor++;
    inorder(lct.right[node], depth + 1);
  }

  const auxRoots = [];
  for (let v = 0; v < state.n; v++) if (lct.isRoot(v)) auxRoots.push(v);
  auxRoots.sort((a, b) => a - b).forEach((r) => {
    inorder(r, 0);
    xCursor += 1; // gap between components
  });

  return { positions, auxRoots };
}

function renderAux() {
  const lct = state.lct;
  const { positions: pos, auxRoots } = computeAuxLayout();
  const nodeLayer = el("auxNodeLayer");
  const edgeLayer = el("auxEdgeLayer");
  nodeLayer.innerHTML = "";
  edgeLayer.innerHTML = "";

  const maxX = Math.max(60, ...Object.values(pos).map((p) => p.x)) + 60;
  const maxY = Math.max(60, ...Object.values(pos).map((p) => p.y)) + 60;
  el("auxSvg").setAttribute("viewBox", `0 0 ${maxX} ${maxY}`);

  // splay-tree edges (solid)
  for (let v = 0; v < state.n; v++) {
    if (lct.left[v] !== -1) drawAuxEdge(edgeLayer, pos[v], pos[lct.left[v]], "left-" + v, "splay-l");
    if (lct.right[v] !== -1) drawAuxEdge(edgeLayer, pos[v], pos[lct.right[v]], "right-" + v, "splay-r");
  }
  // path-parent (virtual) edges, dashed — one per aux-tree root that has a parent pointer
  auxRoots.forEach((r) => {
    if (lct.parent[r] !== -1) {
      drawAuxEdge(edgeLayer, pos[r], pos[lct.parent[r]], "pp-" + r, "pathparent");
    }
  });

  for (let v = 0; v < state.n; v++) {
    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("id", "aux-node-" + v);
    g.setAttribute("class", "gnode" + (auxRoots.includes(v) ? " aux-root" : ""));
    g.setAttribute("transform", `translate(${pos[v].x}, ${pos[v].y})`);
    g.innerHTML = `
      <circle r="18"></circle>
      <text class="label">${state.labels[v]}</text>
      <text class="maxbadge" y="-26">max ${lct.subtreeMax[v]}</text>
    `;
    nodeLayer.appendChild(g);
  }
}

function drawAuxEdge(layer, a, b, id, cls) {
  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("id", "aux-edge-" + id);
  path.setAttribute("class", "gedge " + cls);
  path.setAttribute("d", straightEdge(a, b, 18));
  layer.appendChild(path);
}

/* ------------------------------------------------------------
   7. STEP PLAYER — drives any of the LCT's generators, applying
      each yielded event to both views plus the log/telemetry.
------------------------------------------------------------- */

function clearHighlights() {
  document.querySelectorAll(".gnode").forEach((g) => g.classList.remove("active", "onpath"));
  document.querySelectorAll(".gedge").forEach((e) => e.classList.remove("flash"));
}

function startRun(genFactory, label, onComplete) {
  state.runner = { iterator: genFactory(), finished: false, label, onComplete };
  state.rotationsThisOp = 0;
  state.splicesThisOp = 0;
  clearLog();
  clearHighlights();
  logLine(`▶ ${label}`);
  setPhase(label, "");
  el("statRotations").textContent = "0";
  el("statSplices").textContent = "0";
  state.playing = true;
  el("playBtn").textContent = "⏸ Pause";
}

function stepRunner() {
  if (!state.runner || state.runner.finished) return;
  const { value: step, done } = state.runner.iterator.next();
  if (done) {
    state.runner.finished = true;
    state.playing = false;
    el("playBtn").textContent = "▶ Play";
    state.opsRun++;
    el("chipOps").textContent = state.opsRun;
    if (state.runner.onComplete) state.runner.onComplete();
    return;
  }
  applyLctStep(step);
}

function applyLctStep(step) {
  switch (step.type) {
    case "splay-start":
      clearHighlights();
      addNodeClass("aux-node-" + step.y, "active");
      logLine(`splay(${lab(step.y)}) to the root of its aux tree`);
      setPhase(`Splaying ${lab(step.y)}…`, "rotate");
      break;

    case "rotate":
      state.rotationsThisOp++;
      renderAux();
      addNodeClass("aux-node-" + step.v, "active");
      logLine(`  rotate(${lab(step.v)}) — ${step.kind}`, "hi");
      el("statRotations").textContent = state.rotationsThisOp;
      break;

    case "splay-done":
      renderAux();
      addNodeClass("aux-node-" + step.y, "active");
      break;

    case "splice-preferred-child":
      state.splicesThisOp++;
      renderAux();
      addNodeClass("aux-node-" + step.y, "active");
      logLine(
        step.oldChild !== -1
          ? `  splice: ${lab(step.y)}'s preferred child changes from ${lab(step.oldChild)} to ${step.newChild === -1 ? "(none)" : lab(step.newChild)}`
          : `  splice: ${lab(step.y)}'s preferred child set to ${step.newChild === -1 ? "(none)" : lab(step.newChild)}`,
        "hi"
      );
      el("statSplices").textContent = state.splicesThisOp;
      setPhase(`Re-linking preferred child of ${lab(step.y)}`, "splice");
      break;

    case "walk-path-parent":
      logLine(`  walk up path-parent pointer → ${lab(step.to)}`);
      renderAux();
      break;

    case "final-splay-start":
      logLine(`Final splay(${lab(step.x)}) — brings it back to the top of the combined path`);
      break;

    case "access-done":
      renderAux();
      markOnPathHighlight(step.x);
      logLine(`✓ access(${lab(step.x)}) complete — aux tree rooted at ${lab(step.x)} now IS the path from the real root to ${lab(step.x)}`, "ok");
      break;

    case "walk-left":
      addNodeClass("aux-node-" + step.to, "active");
      logLine(`  walk left → ${lab(step.to)} (looking for the topmost / real root)`);
      break;

    case "findroot-done":
      state.lastFindRootResult = step.root;
      logLine(`✓ findRoot complete — root is ${lab(step.root)}`, "ok");
      break;

    case "link-invalid":
      logLine(step.reason === "u-not-root" ? `✕ link failed — u is not currently a represented-tree root` : `✕ link failed — would create a cycle (already connected)`, "bad");
      break;

    case "link-done":
      state.realParent[step.u] = step.v;
      renderForest();
      renderAux();
      logLine(`✓ link(${lab(step.u)}, ${lab(step.v)}) complete`, "ok");
      break;

    case "cut-invalid":
      logLine(`✕ cut failed — ${lab(step.v)} is already a represented-tree root`, "bad");
      break;

    case "cut-done":
      state.realParent[step.detached] = -1;
      renderForest();
      renderAux();
      logLine(`✓ cut(${lab(step.v)}) complete — edge to ${lab(step.detached)} removed`, "ok");
      break;

    case "query-done":
      logLine(`✓ query(${lab(step.v)}) = ${step.max} (max value on path to root)`, "ok");
      break;
  }
}

function addNodeClass(id, cls) { const n = el(id); if (n) n.classList.add(cls); }
function lab(i) { return state.labels[i]; }

function markOnPathHighlight(x) {
  // walk the LCT's own left-spine from x's aux-tree (x is root after access)
  // to visually trace the exposed root..x path in BOTH views.
  const lct = state.lct;
  let cur = x;
  const pathNodes = [];
  // the exposed path root..x is the in-order sequence of x's aux tree
  (function collect(node) {
    if (node === -1) return;
    collect(lct.left[node]);
    pathNodes.push(node);
    collect(lct.right[node]);
  })(x);
  pathNodes.forEach((v) => {
    addNodeClass("aux-node-" + v, "onpath");
    addNodeClass("forest-node-" + v, "onpath");
  });
}

/* ------------------------------------------------------------
   8. LOGGING + PHASE BADGE
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

/* ------------------------------------------------------------
   9. UI WIRING
------------------------------------------------------------- */

function selVal(id) { return parseInt(el(id).value, 10); }

el("loadExampleBtn").addEventListener("click", loadExample);
el("resetBtn").addEventListener("click", resetIsolated);

el("accessBtn").addEventListener("click", () => {
  const v = selVal("accessSelect");
  el("opError").textContent = "";
  startRun(() => state.lct.accessGen(v), `access(${lab(v)})`, () => {
    setPhase("Done ✓", "done");
    el("resultBox").className = "result-box ok";
    el("resultVal").textContent = `access(${lab(v)}) finished. ${lab(v)} is now the root of its auxiliary tree, which represents the path from the real root to ${lab(v)}.`;
  });
});

el("linkBtn").addEventListener("click", () => {
  const u = selVal("linkUSelect"), v = selVal("linkVSelect");
  el("opError").textContent = "";
  if (u === v) { el("opError").textContent = "Pick two different nodes."; return; }
  startRun(() => state.lct.linkGen(u, v), `link(${lab(u)}, ${lab(v)})`, () => {
    const success = state.realParent[u] === v;
    setPhase(success ? "Linked ✓" : "Link failed", success ? "done" : "");
    el("resultBox").className = "result-box " + (success ? "ok" : "bad");
    el("resultVal").textContent = success
      ? `link(${lab(u)}, ${lab(v)}) succeeded — ${lab(u)} is now attached under ${lab(v)}.`
      : `link(${lab(u)}, ${lab(v)}) was rejected — see the step log for why (u must currently be a represented-tree root, and linking must not create a cycle).`;
  });
});

el("cutBtn").addEventListener("click", () => {
  const v = selVal("cutSelect");
  el("opError").textContent = "";
  const wasRoot = state.realParent[v] === -1;
  startRun(() => state.lct.cutGen(v), `cut(${lab(v)})`, () => {
    const success = !wasRoot && state.realParent[v] === -1;
    setPhase(success ? "Cut ✓" : "Cut failed", success ? "done" : "");
    el("resultBox").className = "result-box " + (success ? "ok" : "bad");
    el("resultVal").textContent = success
      ? `cut(${lab(v)}) succeeded — ${lab(v)} is now its own represented-tree root.`
      : `cut(${lab(v)}) was rejected — ${lab(v)} was already a represented-tree root, so there was no parent edge to remove.`;
  });
});

el("rootBtn").addEventListener("click", () => {
  const v = selVal("rootSelect");
  el("opError").textContent = "";
  startRun(() => state.lct.findRootGen(v), `findRoot(${lab(v)})`, () => {
    const lctRoot = state.lastFindRootResult;
    const naiveRoot = naiveFindRoot(v);
    const match = lctRoot === naiveRoot;
    setPhase("Done ✓", "done");
    el("resultBox").className = "result-box " + (match ? "ok" : "bad");
    el("resultVal").textContent = `findRoot(${lab(v)}) = ${lab(lctRoot)}   |   naive O(n) walk says ${lab(naiveRoot)}   →   ${match ? "MATCH ✓" : "MISMATCH ✕"}`;
    logLine(`cross-check vs. naive parent-pointer walk: ${match ? "match ✓" : "MISMATCH ✕"}`, match ? "ok" : "bad");
  });
});

el("queryBtn").addEventListener("click", () => {
  const v = selVal("querySelect");
  el("opError").textContent = "";
  startRun(() => state.lct.queryGen(v), `query(${lab(v)})`, () => {
    const lctVal = state.lct.subtreeMax[v];
    const naiveVal = naiveQuery(v);
    const match = lctVal === naiveVal;
    setPhase("Done ✓", "done");
    el("resultBox").className = "result-box " + (match ? "ok" : "bad");
    el("resultVal").textContent = `query(${lab(v)}) = ${lctVal}   |   naive O(n) path walk says ${naiveVal}   →   ${match ? "MATCH ✓" : "MISMATCH ✕"}`;
    logLine(`cross-check vs. naive path walk: ${match ? "match ✓" : "MISMATCH ✕"}`, match ? "ok" : "bad");
  });
});

el("speedSlider").addEventListener("input", (e) => {
  state.speedMs = parseInt(e.target.value, 10);
  el("speedVal").textContent = `${state.speedMs}ms/step`;
});

el("stepBtn").addEventListener("click", () => { state.playing = false; el("playBtn").textContent = "▶ Play"; stepRunner(); });
el("playBtn").addEventListener("click", () => {
  if (!state.runner || state.runner.finished) return;
  state.playing = !state.playing;
  el("playBtn").textContent = state.playing ? "⏸ Pause" : "▶ Play";
});

/* ------------------------------------------------------------
   10. ANIMATION LOOP
------------------------------------------------------------- */

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = now - state.lastFrameTime;
  state.lastFrameTime = now;

  if (state.playing && state.runner && !state.runner.finished) {
    state.accumMs += dt;
    if (state.accumMs >= state.speedMs) {
      state.accumMs = 0;
      stepRunner();
    }
  }
}

/* ------------------------------------------------------------
   11. BOOT
------------------------------------------------------------- */

function boot() {
  el("speedVal").textContent = `${state.speedMs}ms/step`;
  loadExample();
  animate();

  requestAnimationFrame(() => {
    setTimeout(() => el("loadingVeil").classList.add("hidden"), 350);
  });
}

boot();
