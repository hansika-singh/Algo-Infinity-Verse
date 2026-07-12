/* ============================================================
   BANKER'S ALGORITHM & DEADLOCK DETECTION — Resource Safety Engine
   Algo Infinity Verse · pages/visualizers/bankers

   Three pure, DOM-free generator functions drive the visuals:
     - safetyGenerator   : Banker's safety algorithm (avoidance)
     - detectionGenerator: multi-instance deadlock detection (reduction)
     - findCycle         : DFS cycle detection over the wait-for graph
   A separate driver consumes their yielded steps to animate the
   Resource Allocation Graph and the Banker's matrices.
   ============================================================ */

/* ------------------------------------------------------------
   1. BANKER'S SAFETY ALGORITHM (generator)
   ------------------------------------------------------------
   Given Need, Allocation, and Available, repeatedly finds a
   process whose Need <= Work, "grants" it, and folds its
   Allocation back into Work. Verified against the classic
   Silberschatz textbook example (Available=[3,3,2] -> safe,
   sequence starting with P1).
------------------------------------------------------------- */

function* safetyGenerator(need, allocation, available, n, m) {
  const work = available.slice();
  const finish = new Array(n).fill(false);
  const sequence = [];
  let progress = true;

  while (progress) {
    progress = false;
    for (let i = 0; i < n; i++) {
      if (finish[i]) continue;

      yield { type: "check", i, work: work.slice() };
      const canProceed = need[i].every((v, r) => v <= work[r]);
      yield { type: "check-result", i, canProceed };

      if (canProceed) {
        for (let r = 0; r < m; r++) work[r] += allocation[i][r];
        finish[i] = true;
        sequence.push(i);
        progress = true;
        yield { type: "grant", i, work: work.slice(), sequence: sequence.slice() };
        break;
      }
    }
  }

  const safe = finish.every((f) => f);
  yield { type: "done", safe, sequence: sequence.slice(), finish: finish.slice(), work: work.slice() };
}

/* ------------------------------------------------------------
   2. MULTI-INSTANCE DEADLOCK DETECTION (generator)
   ------------------------------------------------------------
   Same reduction idea as the safety algorithm, but works off the
   *current* pending Request matrix and Allocation (not Max), and
   processes holding nothing start pre-finished. Any process left
   unfinished at the end is genuinely deadlocked. Verified against
   both a resolvable "false alarm" case and a genuine circular-wait
   deadlock.
------------------------------------------------------------- */

function* detectionGenerator(request, allocation, available, n, m) {
  const work = available.slice();
  const finish = allocation.map((row) => row.every((v) => v === 0));
  const order = [];
  let progress = true;

  yield { type: "init", finish: finish.slice(), work: work.slice() };

  while (progress) {
    progress = false;
    for (let i = 0; i < n; i++) {
      if (finish[i]) continue;

      yield { type: "check", i, work: work.slice(), request: request[i] };
      const canProceed = request[i].every((v, r) => v <= work[r]);
      yield { type: "check-result", i, canProceed };

      if (canProceed) {
        for (let r = 0; r < m; r++) work[r] += allocation[i][r];
        finish[i] = true;
        order.push(i);
        progress = true;
        yield { type: "reduce", i, work: work.slice() };
        break;
      }
    }
  }

  const deadlocked = [];
  for (let i = 0; i < n; i++) if (!finish[i]) deadlocked.push(i);
  yield { type: "done", deadlocked, order: order.slice(), finish: finish.slice() };
}

/* ------------------------------------------------------------
   3. WAIT-FOR / RESOURCE-ALLOCATION GRAPH CYCLE DETECTION
   ------------------------------------------------------------
   Builds a directed graph: process --(request)--> resource type,
   resource type --(allocation)--> process. Standard DFS-with-
   recursion-stack cycle detection. A cycle here is a *necessary*
   condition for deadlock; it's only *sufficient* when every
   resource type on the cycle has exactly one instance.
------------------------------------------------------------- */

function findCycle(nodeIds, edges) {
  const adj = new Map();
  nodeIds.forEach((id) => adj.set(id, []));
  edges.forEach((e) => adj.get(e.from).push(e.to));

  const visited = new Set();
  const inStack = new Set();
  let cyclePath = null;

  function dfs(u, path) {
    visited.add(u);
    inStack.add(u);
    path.push(u);
    for (const v of adj.get(u) || []) {
      if (!visited.has(v)) {
        if (dfs(v, path)) return true;
      } else if (inStack.has(v)) {
        const idx = path.indexOf(v);
        cyclePath = path.slice(idx);
        return true;
      }
    }
    inStack.delete(u);
    path.pop();
    return false;
  }

  for (const id of nodeIds) {
    if (!visited.has(id) && dfs(id, [])) break;
  }
  return cyclePath; // array of node ids forming the cycle, or null
}

/* ------------------------------------------------------------
   4. STATE
------------------------------------------------------------- */

const el = (id) => document.getElementById(id);

const state = {
  n: 5,          // number of processes
  m: 3,          // number of resource types
  total: [],     // total instances per resource type
  allocation: [],
  max: [],
  request: [],   // pending (outstanding) requests, separate from Need
  speedMs: 550,

  activeTab: "graph",
  playing: false,
  accumMs: 0,
  lastFrameTime: performance.now(),
  iterator: null,
  mode: null,    // 'safety' | 'detection' | null
};

function need() {
  return state.allocation.map((row, i) => row.map((a, r) => state.max[i][r] - a));
}

function available() {
  const avail = state.total.slice();
  for (let p = 0; p < state.n; p++)
    for (let r = 0; r < state.m; r++) avail[r] -= state.allocation[p][r];
  return avail;
}

/* ------------------------------------------------------------
   5. SCENARIO GENERATION
------------------------------------------------------------- */

function loadClassicExample() {
  state.n = 5; state.m = 3;
  state.total = [10, 5, 7];
  state.allocation = [[0,1,0],[2,0,0],[3,0,2],[2,1,1],[0,0,2]];
  state.max = [[7,5,3],[3,2,2],[9,0,2],[2,2,2],[4,3,3]];
  state.request = state.allocation.map(() => new Array(state.m).fill(0));
  syncSteppers();
  rebuildEverything();
}

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomizeScenario() {
  const rand = mulberry32((Math.random() * 1e9) | 0);
  const n = state.n, m = state.m;
  const total = Array.from({ length: m }, () => 4 + Math.floor(rand() * 8));
  const allocation = Array.from({ length: n }, () => new Array(m).fill(0));
  const remaining = total.slice();

  // distribute some instances as allocations, leaving room for Max >= Allocation
  for (let r = 0; r < m; r++) {
    let toGive = Math.floor(remaining[r] * (0.3 + rand() * 0.4));
    while (toGive > 0) {
      const p = Math.floor(rand() * n);
      allocation[p][r]++;
      toGive--;
      remaining[r]--;
    }
  }

  const max = allocation.map((row) =>
    row.map((a, r) => a + Math.floor(rand() * (remaining[r] + 2)))
  );

  state.total = total;
  state.allocation = allocation;
  state.max = max;
  state.request = allocation.map(() => new Array(m).fill(0));
  rebuildEverything();
}

function syncSteppers() {
  el("procCount").value = state.n;
  el("resCount").value = state.m;
}

function loadDeadlockDemo() {
  // 3 processes, 3 single-instance resources, forming a genuine circular wait:
  // P0 -> R1 -> P1 -> R2 -> P2 -> R0 -> P0
  state.n = 3; state.m = 3;
  state.total = [1, 1, 1];
  state.allocation = [[1,0,0],[0,1,0],[0,0,1]];
  state.max = [[1,1,0],[0,1,1],[1,0,1]];
  state.request = [[0,1,0],[0,0,1],[1,0,0]];
  syncSteppers();
  rebuildEverything();
}

function loadFalseAlarmDemo() {
  // 3 processes sharing ONE multi-instance resource (3 total units).
  // P0 both holds and requests it -> a trivial cycle exists at the
  // type-level graph, but P1 and P2 hold no outstanding requests and
  // will freely finish, releasing enough instances for P0 to proceed.
  // Cycle present, but NOT sufficient for deadlock.
  state.n = 3; state.m = 1;
  state.total = [3];
  state.allocation = [[1], [1], [1]];
  state.max = [[2], [1], [1]];
  state.request = [[1], [0], [0]];
  syncSteppers();
  rebuildEverything();
}

/* ------------------------------------------------------------
   6. MATRIX VIEW
------------------------------------------------------------- */

function processLabel(i) { return "P" + i; }
function resourceLabel(r) { return String.fromCharCode(65 + r); } // A, B, C...

function renderAvailable() {
  const avail = available();
  const row = el("availRow");
  row.innerHTML = avail.map((v, r) => `<span class="avail-pill">${resourceLabel(r)}: ${v} / ${state.total[r]}</span>`).join("");
}

function buildMatrixTable(tableEl, data, { editable, onEdit, needData }) {
  tableEl.innerHTML = "";
  const thead = document.createElement("tr");
  thead.innerHTML = "<th></th>" + Array.from({ length: state.m }, (_, r) => `<th>${resourceLabel(r)}</th>`).join("");
  tableEl.appendChild(thead);

  for (let i = 0; i < state.n; i++) {
    const tr = document.createElement("tr");
    tr.id = tableEl.id + "-row-" + i;
    let cells = `<td class="rowhead">${processLabel(i)}</td>`;
    for (let r = 0; r < state.m; r++) {
      if (editable) {
        cells += `<td><input type="number" min="0" class="cell-input" data-p="${i}" data-r="${r}" value="${data[i][r]}"></td>`;
      } else {
        cells += `<td class="need-cell">${data[i][r]}</td>`;
      }
    }
    tr.innerHTML = cells;
    tableEl.appendChild(tr);
  }

  if (editable) {
    tableEl.querySelectorAll(".cell-input").forEach((input) => {
      input.addEventListener("change", (e) => {
        const p = parseInt(e.target.dataset.p, 10);
        const r = parseInt(e.target.dataset.r, 10);
        let v = Math.max(0, parseInt(e.target.value, 10) || 0);
        e.target.value = v;
        onEdit(p, r, v);
      });
    });
  }
}

function renderMatrices() {
  renderAvailable();
  buildMatrixTable(el("allocTable"), state.allocation, {
    editable: true,
    onEdit: (p, r, v) => { state.allocation[p][r] = v; renderMatrices(); },
  });
  buildMatrixTable(el("maxTable"), state.max, {
    editable: true,
    onEdit: (p, r, v) => { state.max[p][r] = Math.max(v, state.allocation[p][r]); renderMatrices(); },
  });
  buildMatrixTable(el("needTable"), need(), { editable: false });
  buildMatrixTable(el("requestTable"), state.request, {
    editable: true,
    onEdit: (p, r, v) => {
      state.request[p][r] = v;
      renderGraph();
      markCycleOnGraph(null);
    },
  });
  el("seqStrip").innerHTML = "";
  updateChips();
}

/* ------------------------------------------------------------
   7. GRAPH VIEW
------------------------------------------------------------- */

function buildGraphLayout() {
  const cx = 360, cy = 230;
  const procRadius = 175, resRadius = 90;
  const positions = { processes: [], resources: [] };

  for (let i = 0; i < state.n; i++) {
    const angle = (i / state.n) * Math.PI * 2 - Math.PI / 2;
    positions.processes.push({ x: cx + Math.cos(angle) * procRadius, y: cy + Math.sin(angle) * procRadius });
  }
  for (let r = 0; r < state.m; r++) {
    const angle = (r / state.m) * Math.PI * 2 - Math.PI / 2 + Math.PI / state.m;
    positions.resources.push({ x: cx + Math.cos(angle) * resRadius, y: cy + Math.sin(angle) * resRadius });
  }
  return positions;
}

function renderGraph() {
  const svg = el("graphSvg");
  const nodeLayer = el("nodeLayer");
  const edgeLayer = el("edgeLayer");
  nodeLayer.innerHTML = "";
  edgeLayer.innerHTML = "";

  const pos = buildGraphLayout();
  const svgNS = "http://www.w3.org/2000/svg";

  // edges: allocation (resource -> process), request (process -> resource)
  for (let i = 0; i < state.n; i++) {
    for (let r = 0; r < state.m; r++) {
      if (state.allocation[i][r] > 0) {
        drawEdge(edgeLayer, pos.resources[r], pos.processes[i], "edge-alloc", `alloc-${i}-${r}`, state.allocation[i][r]);
      }
      if (state.request[i][r] > 0) {
        drawEdge(edgeLayer, pos.processes[i], pos.resources[r], "edge-request", `req-${i}-${r}`, state.request[i][r]);
      }
    }
  }

  // process nodes
  for (let i = 0; i < state.n; i++) {
    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("class", "node-process");
    g.setAttribute("id", "node-p-" + i);
    g.setAttribute("transform", `translate(${pos.processes[i].x}, ${pos.processes[i].y})`);
    g.innerHTML = `
      <circle r="24"></circle>
      <text class="node-label" dy="1">${processLabel(i)}</text>
    `;
    nodeLayer.appendChild(g);
  }

  // resource nodes with instance dots
  for (let r = 0; r < state.m; r++) {
    const g = document.createElementNS(svgNS, "g");
    g.setAttribute("class", "node-resource");
    g.setAttribute("id", "node-r-" + r);
    g.setAttribute("transform", `translate(${pos.resources[r].x}, ${pos.resources[r].y})`);
    const total = state.total[r];
    const allocated = state.allocation.reduce((s, row) => s + row[r], 0);
    const w = Math.max(46, total * 11 + 14);
    let dots = "";
    for (let k = 0; k < total; k++) {
      const dx = -w / 2 + 12 + k * 11;
      dots += `<circle class="instance-dot ${k < allocated ? "" : "free"}" cx="${dx}" cy="14" r="3.5"></circle>`;
    }
    g.innerHTML = `
      <rect x="${-w/2}" y="-16" width="${w}" height="42" rx="8"></rect>
      <text class="node-label" y="-2">${resourceLabel(r)}</text>
      <text class="node-sublabel" y="10">${allocated}/${total} used</text>
      ${dots}
    `;
    nodeLayer.appendChild(g);
  }
}

function drawEdge(layer, from, to, cls, id, count) {
  const svgNS = "http://www.w3.org/2000/svg";
  const dx = to.x - from.x, dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  const shrink = 30;
  const x1 = from.x + (dx / dist) * shrink, y1 = from.y + (dy / dist) * shrink;
  const x2 = to.x - (dx / dist) * shrink, y2 = to.y - (dy / dist) * shrink;
  const path = document.createElementNS(svgNS, "path");
  path.setAttribute("id", "edge-" + id);
  path.setAttribute("class", cls);
  path.setAttribute("d", `M ${x1} ${y1} L ${x2} ${y2}`);
  if (count > 1) path.setAttribute("data-count", count);
  layer.appendChild(path);
}

function markCycleOnGraph(cyclePath) {
  document.querySelectorAll(".edge-cycle").forEach((e) => e.classList.remove("edge-cycle"));
  document.querySelectorAll(".node-process.deadlocked, .node-resource.involved")
    .forEach((n) => n.classList.remove("deadlocked", "involved"));
  if (!cyclePath) return;

  for (let k = 0; k < cyclePath.length; k++) {
    const a = cyclePath[k];
    const b = cyclePath[(k + 1) % cyclePath.length];
    const edge = findEdgeElement(a, b);
    if (edge) edge.classList.add("edge-cycle");
    const node = document.getElementById(a.startsWith("P") ? "node-p-" + a.slice(1) : "node-r-" + a.slice(1));
    if (node) node.classList.add(a.startsWith("P") ? "deadlocked" : "involved");
  }
}

function findEdgeElement(fromId, toId) {
  // fromId/toId are like "P2" or "R1"; reconstruct which edge id this corresponds to
  if (fromId.startsWith("P") && toId.startsWith("R")) {
    return document.getElementById(`edge-req-${fromId.slice(1)}-${toId.slice(1)}`);
  }
  if (fromId.startsWith("R") && toId.startsWith("P")) {
    return document.getElementById(`edge-alloc-${toId.slice(1)}-${fromId.slice(1)}`);
  }
  return null;
}

function markDeadlockedProcesses(deadlockedIdxs) {
  document.querySelectorAll(".node-process").forEach((n) => n.classList.remove("deadlocked"));
  deadlockedIdxs.forEach((i) => {
    const node = document.getElementById("node-p-" + i);
    if (node) node.classList.add("deadlocked");
  });
}

/* ------------------------------------------------------------
   8. STEP LOG + PHASE BADGE
------------------------------------------------------------- */

function logLine(text, cls) {
  const log = el("stepLog");
  const line = document.createElement("div");
  line.className = "log-line" + (cls ? " " + cls : "");
  line.textContent = text;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

function clearLog() { el("stepLog").innerHTML = ""; }

function setPhase(label, cls) {
  const badge = el("phaseBadge");
  badge.className = "phase-badge" + (cls ? " phase-" + cls : "");
  badge.textContent = label;
}

function updateChips() {
  el("chipProcs").textContent = state.n;
  el("chipRes").textContent = state.m;
  el("chipMulti").textContent = state.total.every((t) => t === 1) ? "single" : "multi";
}

/* ------------------------------------------------------------
   9. SAFETY ALGORITHM DRIVER ("Find Safe Sequence")
------------------------------------------------------------- */

function runSafetyAlgorithm() {
  clearLog();
  el("seqStrip").innerHTML = "";
  document.querySelectorAll("#allocTable tr, #maxTable tr").forEach((tr) => tr.classList.remove("checking", "granted", "blocked"));

  const needData = need();
  const avail = available();
  logLine(`Starting Available = [${avail.join(", ")}]`);
  state.mode = "safety";
  state.iterator = safetyGenerator(needData, state.allocation, avail, state.n, state.m);
  state.playing = true;
  setPhase("Checking…", "checking");
  el("resultBox").className = "result-box";
  el("resultVal").textContent = "Running safety check…";
}

function applySafetyStep(step) {
  if (step.type === "check") {
    document.querySelectorAll("#allocTable tr, #maxTable tr").forEach((tr) => tr.classList.remove("checking"));
    const rowA = el("allocTable-row-" + step.i), rowM = el("maxTable-row-" + step.i);
    if (rowA) rowA.classList.add("checking");
    if (rowM) rowM.classList.add("checking");
    logLine(`Check P${step.i}: Need ≤ Work=[${step.work.join(", ")}]?`);
  } else if (step.type === "check-result") {
    logLine(step.canProceed ? `  → yes, P${step.i} can proceed` : `  → no, P${step.i} must wait`, step.canProceed ? "ok" : "bad");
  } else if (step.type === "grant") {
    const rowA = el("allocTable-row-" + step.i);
    if (rowA) { rowA.classList.remove("checking"); rowA.classList.add("granted"); }
    logLine(`  P${step.i} finishes, Work becomes [${step.work.join(", ")}]`, "ok");
    const chip = document.createElement("span");
    chip.className = "seq-chip";
    chip.textContent = "P" + step.i;
    el("seqStrip").appendChild(chip);
  } else if (step.type === "done") {
    state.playing = false;
    if (step.safe) {
      setPhase("Safe ✓", "safe");
      logLine(`All processes finished — SAFE. Sequence: ${step.sequence.map((i) => "P" + i).join(" → ")}`, "ok");
      el("resultBox").className = "result-box safe";
      el("resultVal").textContent = `Safe sequence found: ${step.sequence.map((i) => "P" + i).join(" → ")}`;
    } else {
      setPhase("Unsafe ✕", "unsafe");
      const stuck = state.allocation.map((_, i) => i).filter((i) => !step.finish[i]);
      logLine(`No process can proceed — UNSAFE. Stuck: ${stuck.map((i) => "P" + i).join(", ")}`, "bad");
      el("resultBox").className = "result-box unsafe";
      el("resultVal").textContent = `Unsafe state — no safe sequence exists. Stuck: ${stuck.map((i) => "P" + i).join(", ")}`;
      document.querySelectorAll("#allocTable tr").forEach((tr, idx) => {
        if (idx > 0 && stuck.includes(idx - 1)) tr.classList.add("blocked");
      });
    }
  }
}

/* ------------------------------------------------------------
   10. DETECTION DRIVER ("Run Detection")
   ------------------------------------------------------------
   Always computes the wait-for cycle first (fast, informative).
   If every resource on the cycle has exactly one instance, the
   cycle alone is authoritative. Otherwise, falls back to the full
   multi-instance reduction algorithm for the real verdict.
------------------------------------------------------------- */

function runDetection() {
  clearLog();
  renderGraph();
  el("tabGraphBtn").click();

  const nodeIds = [];
  const edges = [];
  for (let i = 0; i < state.n; i++) nodeIds.push("P" + i);
  for (let r = 0; r < state.m; r++) nodeIds.push("R" + r);
  for (let i = 0; i < state.n; i++) {
    for (let r = 0; r < state.m; r++) {
      if (state.allocation[i][r] > 0) edges.push({ from: "R" + r, to: "P" + i });
      if (state.request[i][r] > 0) edges.push({ from: "P" + i, to: "R" + r });
    }
  }

  const cycle = findCycle(nodeIds, edges);

  if (!cycle) {
    markCycleOnGraph(null);
    markDeadlockedProcesses([]);
    setPhase("No cycle", "safe");
    logLine("No cycle in the wait-for graph — a cycle-free graph can never deadlock.", "ok");
    el("resultBox").className = "result-box safe";
    el("resultVal").textContent = "No cycle found. The system cannot be deadlocked.";
    return;
  }

  const resourcesInCycle = cycle.filter((id) => id.startsWith("R")).map((id) => parseInt(id.slice(1), 10));
  const allSingleInstance = resourcesInCycle.every((r) => state.total[r] === 1);

  markCycleOnGraph(cycle);
  logLine(`Cycle found: ${cycle.join(" → ")} → ${cycle[0]}`, "bad");

  if (allSingleInstance) {
    markDeadlockedProcesses(cycle.filter((id) => id.startsWith("P")).map((id) => parseInt(id.slice(1), 10)));
    setPhase("Deadlock ✕", "unsafe");
    logLine("Every resource on this cycle has exactly 1 instance → cycle ⇒ deadlock (sufficient condition met).", "bad");
    el("resultBox").className = "result-box unsafe";
    el("resultVal").textContent = `Deadlock confirmed via cycle: ${cycle.join(" → ")}`;
    return;
  }

  logLine("Cycle involves a multi-instance resource — necessary but not sufficient. Running the full reduction algorithm…");
  const avail = available();
  state.mode = "detection";
  state.iterator = detectionGenerator(state.request, state.allocation, avail, state.n, state.m);
  state.playing = true;
  setPhase("Checking…", "checking");
}

function applyDetectionStep(step) {
  if (step.type === "init") {
    logLine(`Processes holding nothing start pre-finished. Work = Available = [${step.work.join(", ")}]`);
  } else if (step.type === "check") {
    logLine(`Check P${step.i}: Request ≤ Work=[${step.work.join(", ")}]?`);
  } else if (step.type === "check-result") {
    logLine(step.canProceed ? `  → yes, P${step.i} can be granted its request and finish` : `  → no, P${step.i} stays blocked`, step.canProceed ? "ok" : "bad");
  } else if (step.type === "reduce") {
    logLine(`  P${step.i} finishes, Work becomes [${step.work.join(", ")}]`, "ok");
  } else if (step.type === "done") {
    state.playing = false;
    if (step.deadlocked.length === 0) {
      setPhase("No deadlock", "safe");
      logLine(`All processes could eventually finish — NO deadlock. (The cycle was a false alarm.)`, "ok");
      el("resultBox").className = "result-box safe";
      el("resultVal").textContent = "The cycle existed, but with multiple resource instances the system can still fully resolve. No deadlock.";
      markDeadlockedProcesses([]);
    } else {
      setPhase("Deadlock ✕", "unsafe");
      logLine(`Processes stuck forever: ${step.deadlocked.map((i) => "P" + i).join(", ")} — DEADLOCK.`, "bad");
      el("resultBox").className = "result-box unsafe";
      el("resultVal").textContent = `Deadlock confirmed by reduction. Deadlocked: ${step.deadlocked.map((i) => "P" + i).join(", ")}`;
      markDeadlockedProcesses(step.deadlocked);
    }
  }
}

/* ------------------------------------------------------------
   11. WHAT-IF REQUEST SIMULATOR
------------------------------------------------------------- */

function renderWhatifForm() {
  const procSel = el("whatifProcess");
  procSel.innerHTML = Array.from({ length: state.n }, (_, i) => `<option value="${i}">${processLabel(i)}</option>`).join("");

  const grid = el("whatifGrid");
  grid.innerHTML = Array.from({ length: state.m }, (_, r) =>
    `<div><label>${resourceLabel(r)}</label><input type="number" min="0" class="text-input" id="whatif-r-${r}" value="0"></div>`
  ).join("");
}

function submitWhatifRequest() {
  const p = parseInt(el("whatifProcess").value, 10);
  const request = Array.from({ length: state.m }, (_, r) => Math.max(0, parseInt(el("whatif-r-" + r).value, 10) || 0));

  const needData = need();
  const avail = available();
  const verdictBox = el("verdictBox");
  verdictBox.classList.add("show");

  if (!request.every((v, r) => v <= needData[p][r])) {
    verdictBox.className = "verdict-box show denied";
    verdictBox.textContent = `Denied — P${p}'s request [${request.join(", ")}] exceeds its declared Need [${needData[p].join(", ")}]. A process can never validly ask for more than it originally claimed as its maximum.`;
    return;
  }
  if (!request.every((v, r) => v <= avail[r])) {
    verdictBox.className = "verdict-box show denied";
    verdictBox.textContent = `P${p} must wait — request [${request.join(", ")}] exceeds what's currently Available [${avail.join(", ")}]. Not enough free instances right now.`;
    return;
  }

  // tentatively grant, then re-run the full safety check
  const tentativeAlloc = state.allocation.map((row) => row.slice());
  const tentativeAvail = avail.slice();
  for (let r = 0; r < state.m; r++) { tentativeAlloc[p][r] += request[r]; tentativeAvail[r] -= request[r]; }
  const tentativeNeed = tentativeAlloc.map((row, i) => row.map((a, r) => state.max[i][r] - a));

  let result;
  for (const step of safetyGenerator(tentativeNeed, tentativeAlloc, tentativeAvail, state.n, state.m)) {
    if (step.type === "done") result = step;
  }

  if (result.safe) {
    state.allocation = tentativeAlloc;
    verdictBox.className = "verdict-box show granted";
    verdictBox.textContent = `Granted — resulting state is still safe. Sequence: ${result.sequence.map((i) => "P" + i).join(" → ")}. Allocation and Available updated.`;
    renderMatrices();
    renderGraph();
  } else {
    verdictBox.className = "verdict-box show denied";
    verdictBox.textContent = `Denied — granting this would leave the system in an UNSAFE state (no process could ever complete from there). Request rolled back; Allocation unchanged.`;
  }
}

/* ------------------------------------------------------------
   12. TABS + REBUILD
------------------------------------------------------------- */

function switchTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  el("graphView").classList.toggle("active", tab === "graph");
  el("matrixView").classList.toggle("active", tab === "matrix");
}

function rebuildEverything() {
  syncSteppers();
  renderMatrices();
  renderGraph();
  renderWhatifForm();
  updateChips();
  clearLog();
  setPhase("Idle", "");
  el("resultBox").className = "result-box";
  el("resultVal").textContent = "Run the safety check or detection algorithm to see a verdict here.";
  el("verdictBox").classList.remove("show");
  markCycleOnGraph(null);
}

/* ------------------------------------------------------------
   13. UI WIRING
------------------------------------------------------------- */

el("procMinus").addEventListener("click", () => {
  if (state.n <= 2) return;
  state.n--;
  state.allocation.pop(); state.max.pop(); state.request.pop();
  rebuildEverything();
});
el("procPlus").addEventListener("click", () => {
  if (state.n >= 8) return;
  state.n++;
  state.allocation.push(new Array(state.m).fill(0));
  state.max.push(new Array(state.m).fill(0));
  state.request.push(new Array(state.m).fill(0));
  rebuildEverything();
});
el("resMinus").addEventListener("click", () => {
  if (state.m <= 2) return;
  state.m--;
  state.total.pop();
  state.allocation.forEach((row) => row.pop());
  state.max.forEach((row) => row.pop());
  state.request.forEach((row) => row.pop());
  rebuildEverything();
});
el("resPlus").addEventListener("click", () => {
  if (state.m >= 5) return;
  state.m++;
  state.total.push(6);
  state.allocation.forEach((row) => row.push(0));
  state.max.forEach((row) => row.push(2));
  state.request.forEach((row) => row.push(0));
  rebuildEverything();
});

el("loadClassicBtn").addEventListener("click", loadClassicExample);
el("randomizeBtn").addEventListener("click", randomizeScenario);
el("demoDeadlockBtn").addEventListener("click", loadDeadlockDemo);
el("demoFalseAlarmBtn").addEventListener("click", loadFalseAlarmDemo);
el("clearRequestsBtn").addEventListener("click", () => {
  state.request = state.allocation.map(() => new Array(state.m).fill(0));
  renderGraph();
  markCycleOnGraph(null);
});

el("speedSlider").addEventListener("input", (e) => {
  state.speedMs = parseInt(e.target.value, 10);
  el("speedVal").textContent = `${state.speedMs}ms/step`;
});

el("findSafeBtn").addEventListener("click", runSafetyAlgorithm);
el("runDetectionBtn").addEventListener("click", runDetection);
el("submitRequestBtn").addEventListener("click", submitWhatifRequest);

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => switchTab(btn.dataset.tab));
});

/* ------------------------------------------------------------
   14. ANIMATION LOOP
------------------------------------------------------------- */

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = now - state.lastFrameTime;
  state.lastFrameTime = now;

  if (state.playing && state.iterator) {
    state.accumMs += dt;
    if (state.accumMs >= state.speedMs) {
      state.accumMs = 0;
      const { value, done } = state.iterator.next();
      if (done) { state.playing = false; }
      else if (state.mode === "safety") applySafetyStep(value);
      else if (state.mode === "detection") applyDetectionStep(value);
    }
  }
}

/* ------------------------------------------------------------
   15. BOOT
------------------------------------------------------------- */

function boot() {
  el("speedVal").textContent = `${state.speedMs}ms/step`;
  loadClassicExample();
  animate();

  requestAnimationFrame(() => {
    setTimeout(() => el("loadingVeil").classList.add("hidden"), 350);
  });
}

boot();
