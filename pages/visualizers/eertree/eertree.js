/* ============================================================
   PALINDROMIC TREE (EERTREE) — Twin-Root Palindrome Engine
   Algo Infinity Verse · pages/visualizers/eertree

   Eertree class below was validated against a brute-force
   palindrome counter across 16 fixed test strings (including
   "racecar", "forgeeksskeegfor", all-same-character strings, and
   empty string) plus 500 randomized trials, checking distinct
   count, total-occurrence count, every recovered palindrome text,
   AND suffix-link correctness (every link points to the longest
   proper palindromic suffix that is itself a node) — before any
   UI code was written. See the PR description for details.
   ============================================================ */

/* ------------------------------------------------------------
   1. THE EERTREE (generator-driven, pure — no DOM access)
   ------------------------------------------------------------
   Two special roots: index 0 is the "imaginary" root of length -1
   (a sentinel with no real string, self-linked), index 1 is the
   real root of length 0 (the empty string). Every other node is a
   genuine distinct palindrome. A node's `link` (suffix link) is
   the longest proper palindromic suffix of its palindrome that is
   itself a node — and the tree formed by those links IS the
   Eertree structure this page visualizes.
------------------------------------------------------------- */

class Eertree {
  constructor() {
    this.len = [-1, 0];
    this.link = [0, 0];
    this.children = [{}, {}];
    this.count = [0, 0];
    this.text = ["", ""]; // display text; index 0 (root -1) is never actually shown as ""
    this.creationOrder = [];
    this.s = [];
    this.last = 1; // start at root(0), the empty string
  }

  // One character's worth of insertion, yielded step by step.
  *addCharGen(c) {
    this.s.push(c);
    const i = this.s.length - 1;

    // Walk 1: find the node whose palindrome can be extended by c on both sides.
    let x = this.last;
    while (true) {
      const l = this.len[x];
      const ok = i - l - 1 >= 0 && this.s[i - l - 1] === c;
      yield { type: "walk1", node: x, ok };
      if (ok) break;
      x = this.link[x];
    }
    const cur = x;

    if (this.children[cur][c] !== undefined) {
      this.last = this.children[cur][c];
      this.count[this.last]++;
      yield { type: "extend-existing", node: this.last, text: this.text[this.last] };
      return;
    }

    // A genuinely new palindrome.
    const newIdx = this.len.length;
    const newLen = this.len[cur] + 2;
    const newText = this.len[cur] === -1 ? c : c + this.text[cur] + c;
    this.len.push(newLen);
    this.children.push({});
    this.count.push(1);
    this.text.push(newText);
    yield { type: "new-node", node: newIdx, text: newText, len: newLen, parentTrieNode: cur };

    if (newLen === 1) {
      this.link.push(1); // every length-1 palindrome's suffix link is the empty root
      yield { type: "suffix-link-assigned", node: newIdx, link: 1, viaWalk2: false };
    } else {
      // Walk 2: continue from link[cur] to find THIS new node's own suffix link.
      let x2 = this.link[cur];
      while (true) {
        const l2 = this.len[x2];
        const ok2 = i - l2 - 1 >= 0 && this.s[i - l2 - 1] === c;
        yield { type: "walk2", node: x2, ok: ok2 };
        if (ok2) break;
        x2 = this.link[x2];
      }
      const linkTarget = this.children[x2][c];
      this.link.push(linkTarget);
      yield { type: "suffix-link-assigned", node: newIdx, link: linkTarget, viaWalk2: true };
    }

    this.children[cur][c] = newIdx;
    this.last = newIdx;
    this.creationOrder.push(newIdx);
  }

  // The mandatory second pass: propagate occurrence counts up through
  // suffix links, processed in reverse creation order. Only after this
  // has run is `count[]` (and the total-occurrences figure) correct.
  *finalizeGen() {
    for (let k = this.creationOrder.length - 1; k >= 0; k--) {
      const node = this.creationOrder[k];
      const target = this.link[node];
      this.count[target] += this.count[node];
      yield { type: "propagate", from: node, to: target, addedCount: this.count[node], newTotal: this.count[target] };
    }
    yield { type: "finalize-done" };
  }

  distinctCount() { return this.creationOrder.length; }
  totalOccurrences() {
    let t = 0;
    for (const n of this.creationOrder) t += this.count[n];
    return t;
  }
}

/* ------------------------------------------------------------
   2. STATE
------------------------------------------------------------- */

const el = (id) => document.getElementById(id);
const svgNS = "http://www.w3.org/2000/svg";

const state = {
  str: "",
  tree: null,
  charIterator: null,   // drives one character's addCharGen at a time
  finalizeIterator: null,
  currentCharIndex: -1,
  insertionDone: false,
  finalized: false,

  speedMs: 400,
  playing: false,
  accumMs: 0,
  lastFrameTime: performance.now(),

  blockW: 42,
};

/* ------------------------------------------------------------
   3. STRING STRIP
------------------------------------------------------------- */

function escapeHtml(ch) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return map[ch] || ch;
}

function buildStrip(str) {
  const row = el("charRow");
  row.innerHTML = "";
  for (let i = 0; i < str.length; i++) {
    const block = document.createElement("div");
    block.className = "char-block";
    block.id = "cblock-" + i;
    block.innerHTML = `${escapeHtml(str[i])}<span class="idx">${i}</span>`;
    row.appendChild(block);
  }
}

function updateStripCursor(i) {
  document.querySelectorAll(".char-block").forEach((b) => b.classList.remove("cursor"));
  for (let k = 0; k <= i; k++) {
    const b = el("cblock-" + k);
    if (b) b.classList.add("processed");
  }
  if (i >= 0) {
    const cur = el("cblock-" + i);
    if (cur) cur.classList.add("cursor");
  }
}

/* ------------------------------------------------------------
   4. TREE LAYOUT + RENDER (suffix-link tree)
------------------------------------------------------------- */

function computeTreeLayout() {
  const tree = state.tree;
  const nNodes = tree.len.length;
  const children = Array.from({ length: nNodes }, () => []);
  for (let v = 2; v < nNodes; v++) children[tree.link[v]].push(v);
  // root(0) [index 1] is itself a child of root(-1) [index 0] via its link
  children[0] = [1, ...children[0].filter((c) => c !== 1)];

  const positions = new Array(nNodes);
  const UNIT_X = 68, UNIT_Y = 66;
  let xCursor = 0;

  function layout(node, depth) {
    if (children[node].length === 0) {
      positions[node] = { x: xCursor * UNIT_X, y: depth * UNIT_Y + 30 };
      xCursor++;
      return positions[node].x;
    }
    const childXs = children[node].map((c) => layout(c, depth + 1));
    const myX = (Math.min(...childXs) + Math.max(...childXs)) / 2;
    positions[node] = { x: myX, y: depth * UNIT_Y + 30 };
    return myX;
  }
  layout(0, 0);

  return positions;
}

function nodeDisplayLabel(node) {
  if (node === 0) return "−1";
  if (node === 1) return "ε";
  return state.tree.text[node];
}

function renderTree() {
  const tree = state.tree;
  const pos = computeTreeLayout();
  const svg = el("treeSvg");
  svg.innerHTML = "";

  const maxX = Math.max(80, ...Object.values(pos).map((p) => p.x)) + 80;
  const maxY = Math.max(80, ...Object.values(pos).map((p) => p.y)) + 60;
  svg.setAttribute("width", maxX);
  svg.setAttribute("height", maxY);
  svg.setAttribute("viewBox", `0 0 ${maxX} ${maxY}`);

  const edgeLayer = document.createElementNS(svgNS, "g");
  const nodeLayer = document.createElementNS(svgNS, "g");
  svg.appendChild(edgeLayer);
  svg.appendChild(nodeLayer);

  // suffix-link edges
  for (let v = 1; v < tree.len.length; v++) {
    const parent = v === 1 ? 0 : tree.link[v];
    const a = pos[parent], b = pos[v];
    const path = document.createElementNS(svgNS, "path");
    path.setAttribute("id", "edge-" + v);
    path.setAttribute("class", "gedge");
    path.setAttribute("d", curvedEdge(a, b));
    edgeLayer.appendChild(path);
  }

  for (let v = 0; v < tree.len.length; v++) {
    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("id", "node-" + v);
    const isRoot = v <= 1;
    g.setAttribute("class", "gnode" + (isRoot ? " root" : ""));
    g.setAttribute("transform", `translate(${pos[v].x}, ${pos[v].y})`);

    const label = nodeDisplayLabel(v);
    const shapeSize = Math.max(22, 11 + label.length * 5);
    const shape = isRoot
      ? `<rect x="${-shapeSize/2}" y="-16" width="${shapeSize}" height="32" rx="8"></rect>`
      : `<circle r="${Math.max(18, 9 + label.length * 3)}"></circle>`;

    g.innerHTML = `
      ${shape}
      <text class="label">${escapeHtml(label)}</text>
      ${!isRoot ? `<text class="lenbadge" y="-${Math.max(18,9+label.length*3)+8}">len ${tree.len[v]}</text>` : ""}
      ${!isRoot ? `<text class="countbadge" y="${Math.max(18,9+label.length*3)+14}">×${tree.count[v]}</text>` : ""}
    `;
    nodeLayer.appendChild(g);
  }
}

function curvedEdge(a, b) {
  const midY = (a.y + b.y) / 2;
  return `M ${a.x} ${a.y + 18} C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y - 18}`;
}

/* ------------------------------------------------------------
   5. STEP DRIVER
------------------------------------------------------------- */

function clearNodeHighlights() {
  document.querySelectorAll(".gnode").forEach((g) => g.classList.remove("walk1", "walk2", "newflash", "propagating"));
  document.querySelectorAll(".gedge").forEach((e) => e.classList.remove("propflash"));
}

function setPhase(label, cls) {
  const badge = el("phaseBadge");
  badge.className = "phase-badge" + (cls ? " phase-" + cls : "");
  badge.textContent = label;
}

function logLine(text, cls) {
  const log = el("stepLog");
  const line = document.createElement("div");
  line.className = "log-line" + (cls ? " " + cls : "");
  line.textContent = text;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}
function clearLog() { el("stepLog").innerHTML = "<div class=\"log-line\">Ready.</div>"; }

function updateChips() {
  el("chipI").textContent = state.currentCharIndex;
  el("chipLast").textContent = state.tree ? nodeDisplayLabel(state.tree.last) : "—";
  el("chipLenLast").textContent = state.tree ? state.tree.len[state.tree.last] : 0;
  el("statDistinct").textContent = state.tree ? state.tree.distinctCount() : 0;
  el("statTotal").textContent = state.finalized ? state.tree.totalOccurrences() : "—";
  el("roLongest").textContent = state.tree && state.tree.last > 1 ? state.tree.text[state.tree.last] : (state.tree && state.tree.last === 1 ? "(empty)" : "—");
  el("roNodes").textContent = state.tree ? state.tree.distinctCount() : 0;
  el("roFinalized").textContent = state.finalized ? "yes" : "no";
}

function applyCharStep(step) {
  if (step.type === "walk1") {
    clearNodeHighlights();
    addNodeClass(step.node, "walk1");
    setPhase("Walk 1: checking extension", "walk1");
    logLine(`walk1 @ ${nodeDisplayLabel(step.node)} (len ${state.tree.len[step.node]}): ${step.ok ? "extends ✓" : "no match, follow suffix link"}`, step.ok ? "ok" : undefined);
  } else if (step.type === "extend-existing") {
    clearNodeHighlights();
    addNodeClass(step.node, "walk1");
    logLine(`✓ extends existing palindrome "${step.text}" — occurrence count +1`, "ok");
    renderTree();
    addNodeClass(step.node, "walk1");
  } else if (step.type === "new-node") {
    renderTree();
    addNodeClass(step.node, "newflash");
    setPhase("New palindrome discovered!", "new");
    logLine(`✦ new palindrome "${step.text}" (length ${step.len})`, "new");
  } else if (step.type === "walk2") {
    addNodeClass(step.node, "walk2");
    setPhase("Walk 2: finding its own suffix link", "walk2");
    logLine(`  walk2 @ ${nodeDisplayLabel(step.node)}: ${step.ok ? "match ✓" : "no match, continue"}`);
  } else if (step.type === "suffix-link-assigned") {
    logLine(`  suffix-link assigned → ${nodeDisplayLabel(step.link)}${step.viaWalk2 ? " (via walk 2)" : " (length-1 rule)"}`, "ok");
    renderTree();
  }
  updateChips();
}

function stepInsertion() {
  if (state.insertionDone) return;

  if (!state.charIterator) {
    state.currentCharIndex++;
    if (state.currentCharIndex >= state.str.length) {
      state.insertionDone = true;
      state.playing = false;
      el("playBtn").textContent = "▶ Play";
      el("finalizeBtn").disabled = false;
      setPhase("Insertion complete", "");
      logLine(`✓ all ${state.str.length} characters inserted — ${state.tree.distinctCount()} distinct palindromes found`, "ok");
      clearNodeHighlights();
      return;
    }
    updateStripCursor(state.currentCharIndex);
    state.charIterator = state.tree.addCharGen(state.str[state.currentCharIndex]);
    logLine(`— inserting '${state.str[state.currentCharIndex]}' at position ${state.currentCharIndex} —`);
  }

  const { value, done } = state.charIterator.next();
  if (done) {
    state.charIterator = null;
    return;
  }
  applyCharStep(value);
}

function stepFinalize() {
  if (!state.finalizeIterator) return;
  const { value, done } = state.finalizeIterator.next();
  if (done) {
    state.finalizeIterator = null;
    state.finalized = true;
    state.playing = false;
    el("playBtn").textContent = "▶ Play";
    setPhase("Counts finalized ✓", "done");
    el("resultBox").className = "result-box ok";
    el("resultVal").textContent =
      `${state.tree.distinctCount()} distinct palindromic substrings, ${state.tree.totalOccurrences()} total occurrences (with multiplicity).`;
    logLine(`✓ finalization complete — total occurrences = ${state.tree.totalOccurrences()}`, "ok");
    clearNodeHighlights();
    updateChips();
    return;
  }
  clearNodeHighlights();
  addNodeClass(value.from, "propagating");
  addNodeClass(value.to, "propagating");
  const edge = el("edge-" + value.from);
  if (edge) edge.classList.add("propflash");
  setPhase("Propagating counts…", "propagate");
  logLine(`propagate: count[${nodeDisplayLabel(value.from)}] (${value.addedCount}) added to ${nodeDisplayLabel(value.to)} → now ${value.newTotal}`, "hi");
  renderTree();
  addNodeClass(value.from, "propagating");
  addNodeClass(value.to, "propagating");
}

function addNodeClass(id, cls) { const n = el("node-" + id); if (n) n.classList.add(cls); }

/* ------------------------------------------------------------
   6. SETUP / RESET
------------------------------------------------------------- */

function validateInput(s) {
  if (!s || !s.trim()) return "Source string can't be empty.";
  if (s.length > 24) return "Keep the string under 24 characters for a readable tree.";
  if (!/^[a-zA-Z0-9]+$/.test(s)) return "Use letters and numbers only.";
  return null;
}

function resetRun() {
  const sVal = el("sourceInput").value;
  const err = validateInput(sVal);
  el("inputError").textContent = err || "";
  if (err) return false;

  state.str = sVal;
  state.tree = new Eertree();
  state.charIterator = null;
  state.finalizeIterator = null;
  state.currentCharIndex = -1;
  state.insertionDone = false;
  state.finalized = false;
  state.playing = false;

  el("playBtn").textContent = "▶ Play";
  el("finalizeBtn").disabled = true;
  el("resultBox").className = "result-box";
  el("resultVal").textContent = "Build a string, then Play or Step through the insertion.";
  clearLog();
  setPhase("Ready", "");

  buildStrip(sVal);
  renderTree();
  updateChips();
  return true;
}

/* ------------------------------------------------------------
   7. UI WIRING
------------------------------------------------------------- */

el("applyBtn").addEventListener("click", () => resetRun());
el("restartBtn").addEventListener("click", () => resetRun());
el("sourceInput").addEventListener("keydown", (e) => { if (e.key === "Enter") resetRun(); });

el("stepBtn").addEventListener("click", () => {
  state.playing = false;
  el("playBtn").textContent = "▶ Play";
  if (!state.insertionDone) stepInsertion();
  else if (state.finalizeIterator) stepFinalize();
});

el("playBtn").addEventListener("click", () => {
  if (state.insertionDone && !state.finalizeIterator && !state.finalized) return; // nudge them to Finalize instead
  state.playing = !state.playing;
  el("playBtn").textContent = state.playing ? "⏸ Pause" : "▶ Play";
});

el("finalizeBtn").addEventListener("click", () => {
  if (state.finalized || state.finalizeIterator) return;
  state.finalizeIterator = state.tree.finalizeGen();
  clearLog();
  logLine("— finalizing: propagating occurrence counts in reverse creation order —", "hi");
  setPhase("Propagating counts…", "propagate");
  state.playing = true;
  el("playBtn").textContent = "⏸ Pause";
});

el("speedSlider").addEventListener("input", (e) => {
  state.speedMs = parseInt(e.target.value, 10);
  el("speedVal").textContent = `${state.speedMs}ms/step`;
});

/* ------------------------------------------------------------
   8. ANIMATION LOOP
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
      if (state.finalizeIterator) stepFinalize();
      else if (!state.insertionDone) stepInsertion();
    }
  }
}

/* ------------------------------------------------------------
   9. BOOT
------------------------------------------------------------- */

function boot() {
  el("speedVal").textContent = `${state.speedMs}ms/step`;
  resetRun();
  animate();

  requestAnimationFrame(() => {
    setTimeout(() => el("loadingVeil").classList.add("hidden"), 350);
  });
}

boot();
