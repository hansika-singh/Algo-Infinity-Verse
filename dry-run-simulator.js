document.addEventListener("DOMContentLoaded", () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  initDarkMode();
  initDryRun();
});

function initLoadingScreen() {
  setTimeout(() => { const s = document.getElementById("loading-screen"); if (s) s.classList.add("hidden"); }, 1500);
}

function initScrollTop() {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;
  window.addEventListener("scroll", () => btn.classList.toggle("visible", window.scrollY > 400));
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function initDarkMode() {
  const toggle = document.getElementById("darkModeToggle");
  if (!toggle) return;
  const icon = toggle.querySelector("i");
  if (localStorage.getItem("darkMode") === "light") { document.body.classList.add("light-mode"); icon.classList.replace("fa-moon", "fa-sun"); }
  toggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    const isLight = document.body.classList.contains("light-mode");
    icon.classList.toggle("fa-moon", !isLight);
    icon.classList.toggle("fa-sun", isLight);
    localStorage.setItem("darkMode", isLight ? "light" : "dark");
  });
}

function initNavbar() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks   = document.getElementById("navLinks");
  if (!menuToggle || !navLinks) return;
  let overlay = document.querySelector(".nav-overlay");
  if (!overlay) { overlay = document.createElement("div"); overlay.className = "nav-overlay"; document.body.appendChild(overlay); }
  const toggleMenu = (open) => {
    const isOpen = open !== undefined ? open : !navLinks.classList.contains("active");
    navLinks.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", isOpen);
    overlay.classList.toggle("active", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
    const icon = menuToggle.querySelector("i");
    if (icon) { icon.classList.toggle("fa-bars", !isOpen); icon.classList.toggle("fa-times", isOpen); }
  };
  menuToggle.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(); });
  overlay.addEventListener("click", () => toggleMenu(false));
  navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => toggleMenu(false)));
  const isMobile = () => window.matchMedia("(max-width: 1024px)").matches;
  document.querySelectorAll(".dropdown-toggle").forEach((toggle) => {
    const parent = toggle.closest(".has-dropdown");
    const menu   = parent?.querySelector(".dropdown-menu");
    if (!parent || !menu) return;
    let t;
    parent.addEventListener("mouseenter", () => { if (!isMobile()) { clearTimeout(t); parent.classList.add("open"); toggle.setAttribute("aria-expanded", "true"); } });
    parent.addEventListener("mouseleave", () => { if (!isMobile()) { t = setTimeout(() => { parent.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }, 250); } });
    toggle.addEventListener("click", (e) => { if (isMobile()) { e.preventDefault(); e.stopPropagation(); const o = parent.classList.toggle("open"); toggle.setAttribute("aria-expanded", o); } });
  });
  window.addEventListener("scroll", () => {
    const nav = document.querySelector(".navbar");
    if (nav) nav.style.background = window.scrollY > 100 ? "rgba(10,10,26,0.95)" : "rgba(10,10,26,0.85)";
  });
}

/* ═══════════════════════════════════════════
   ALGORITHM STEP GENERATORS
   Each returns an array of step objects:
   { line, vars, visual, explanation }
   ═══════════════════════════════════════════ */

function genBinarySearchSteps() {
  const arr    = [2, 5, 8, 12, 16, 23, 38, 45, 67, 72];
  const target = 23;
  const steps  = [];

  let lo = 0, hi = arr.length - 1;

  steps.push({ line: 0, vars: { target, lo, hi, mid: "—" }, visual: { arr, lo, hi, mid: -1, found: -1 }, explanation: `Start: searching for ${target} in sorted array of ${arr.length} elements.` });

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    steps.push({ line: 2, vars: { target, lo, hi, mid }, visual: { arr, lo, hi, mid, found: -1 }, explanation: `Calculate mid = ⌊(${lo} + ${hi}) / 2⌋ = ${mid}. arr[${mid}] = ${arr[mid]}.` });

    if (arr[mid] === target) {
      steps.push({ line: 3, vars: { target, lo, hi, mid }, visual: { arr, lo, hi, mid, found: mid }, explanation: `✅ arr[${mid}] = ${arr[mid]} equals target ${target}. Found at index ${mid}!` });
      break;
    } else if (arr[mid] < target) {
      steps.push({ line: 5, vars: { target, lo: mid + 1, hi, mid }, visual: { arr, lo: mid + 1, hi, mid, found: -1 }, explanation: `arr[${mid}] = ${arr[mid]} < ${target}. Discard left half. lo = ${mid + 1}.` });
      lo = mid + 1;
    } else {
      steps.push({ line: 7, vars: { target, lo, hi: mid - 1, mid }, visual: { arr, lo, hi: mid - 1, mid, found: -1 }, explanation: `arr[${mid}] = ${arr[mid]} > ${target}. Discard right half. hi = ${mid - 1}.` });
      hi = mid - 1;
    }
  }

  return steps;
}

function genBubbleSortSteps() {
  const arr   = [64, 34, 25, 12, 22, 11, 90];
  const steps = [];
  const a     = [...arr];
  const n     = a.length;

  steps.push({ line: 0, vars: { i: "—", j: "—", n }, visual: { arr: [...a], comparing: [], swapped: [], sorted: [] }, explanation: `Start Bubble Sort on array of ${n} elements. Largest elements bubble to end.` });

  const sorted = [];

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      steps.push({ line: 2, vars: { i, j, "arr[j]": a[j], "arr[j+1]": a[j + 1] }, visual: { arr: [...a], comparing: [j, j + 1], swapped: [], sorted: [...sorted] }, explanation: `i=${i}, j=${j}: Compare arr[${j}]=${a[j]} and arr[${j + 1}]=${a[j + 1]}.` });

      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        steps.push({ line: 3, vars: { i, j, "arr[j]": a[j], "arr[j+1]": a[j + 1] }, visual: { arr: [...a], comparing: [], swapped: [j, j + 1], sorted: [...sorted] }, explanation: `Swap! arr[${j}] and arr[${j + 1}] swapped. Array: [${a.join(", ")}]` });
      }
    }
    sorted.push(n - 1 - i);
  }
  sorted.push(0);
  steps.push({ line: 5, vars: { i: "done", j: "done", n }, visual: { arr: [...a], comparing: [], swapped: [], sorted: [...sorted] }, explanation: `✅ Bubble Sort complete. Sorted array: [${a.join(", ")}]` });

  return steps;
}

function genBFSSteps() {
  // Graph: adjacency list, nodes 0-6
  const graph = { 0: [1, 2], 1: [3, 4], 2: [5, 6], 3: [], 4: [], 5: [], 6: [] };
  const steps = [];
  const visited = new Set();
  const queue   = [0];
  visited.add(0);

  steps.push({ line: 0, vars: { queue: "[0]", visited: "{0}", current: "—" }, visual: { visited: [...visited], current: -1, queue: [...queue] }, explanation: `Start BFS from node 0. Initialize queue = [0], visited = {0}.` });

  while (queue.length > 0) {
    const node = queue.shift();
    steps.push({ line: 2, vars: { queue: `[${queue.join(",")}]`, visited: `{${[...visited].join(",")}}`, current: node }, visual: { visited: [...visited], current: node, queue: [...queue] }, explanation: `Dequeue node ${node}. Process it. Neighbors: [${graph[node].join(", ") || "none"}].` });

    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
        steps.push({ line: 4, vars: { queue: `[${queue.join(",")}]`, visited: `{${[...visited].join(",")}}`, current: node }, visual: { visited: [...visited], current: node, queue: [...queue] }, explanation: `Node ${neighbor} not visited. Add to queue and mark visited.` });
      }
    }
  }

  steps.push({ line: 6, vars: { queue: "[]", visited: `{${[...visited].join(",")}}`, current: "—" }, visual: { visited: [...visited], current: -1, queue: [] }, explanation: `✅ BFS complete. Visited order: ${[...visited].join(" → ")}.` });
  return steps;
}

function genDFSSteps() {
  const graph   = { 0: [1, 2], 1: [3, 4], 2: [5, 6], 3: [], 4: [], 5: [], 6: [] };
  const steps   = [];
  const visited = new Set();
  const order   = [];

  function dfs(node, depth) {
    visited.add(node);
    order.push(node);
    steps.push({ line: 1, vars: { node, depth, visited: `{${[...visited].join(",")}}`, order: `[${order.join(",")}]` }, visual: { visited: [...visited], current: node, stack: [...order] }, explanation: `Visit node ${node} (depth ${depth}). Mark visited. Order so far: [${order.join(" → ")}].` });

    for (const neighbor of graph[node]) {
      if (!visited.has(neighbor)) {
        steps.push({ line: 3, vars: { node, neighbor, visited: `{${[...visited].join(",")}}` }, visual: { visited: [...visited], current: node, stack: [...order] }, explanation: `From node ${node}: neighbor ${neighbor} not visited. Recurse into it.` });
        dfs(neighbor, depth + 1);
        steps.push({ line: 4, vars: { node, depth, visited: `{${[...visited].join(",")}}` }, visual: { visited: [...visited], current: node, stack: [...order] }, explanation: `Return to node ${node} after exploring subtree of ${neighbor}.` });
      }
    }
  }

  steps.push({ line: 0, vars: { node: 0, depth: 0, visited: "{}", order: "[]" }, visual: { visited: [], current: -1, stack: [] }, explanation: `Start DFS from node 0. Explore as deep as possible before backtracking.` });
  dfs(0, 0);
  steps.push({ line: 5, vars: { visited: `{${[...visited].join(",")}}`, order: `[${order.join(",")}]` }, visual: { visited: [...visited], current: -1, stack: [] }, explanation: `✅ DFS complete. Traversal order: ${order.join(" → ")}.` });

  return steps;
}

/* ═══════════════════════════════════════════
   ALGORITHM METADATA
   ═══════════════════════════════════════════ */
const ALGO_META = {
  binarySearch: {
    time: "O(log n)", space: "O(1)",
    desc: "Repeatedly halve the search space by comparing the middle element to the target.",
    code: [
      { text: `<span class="drs-kw">function</span> <span class="drs-fn">binarySearch</span>(arr, target) {` },
      { text: `  <span class="drs-kw">let</span> lo = 0, hi = arr.length - 1;` },
      { text: `  <span class="drs-kw">const</span> mid = Math.floor((lo + hi) / 2);` },
      { text: `  <span class="drs-kw">if</span> (arr[mid] === target) <span class="drs-kw">return</span> mid;` },
      { text: `  <span class="drs-kw">else if</span> (arr[mid] &lt; target)` },
      { text: `    lo = mid + <span class="drs-num">1</span>;` },
      { text: `  <span class="drs-kw">else</span>` },
      { text: `    hi = mid - <span class="drs-num">1</span>;` },
      { text: `}` },
    ]
  },
  bubbleSort: {
    time: "O(n²)", space: "O(1)",
    desc: "Compare adjacent elements and swap if out of order. Repeat until no swaps occur.",
    code: [
      { text: `<span class="drs-kw">function</span> <span class="drs-fn">bubbleSort</span>(arr) {` },
      { text: `  <span class="drs-kw">for</span> (i = 0; i &lt; n-1; i++) {` },
      { text: `    <span class="drs-kw">for</span> (j = 0; j &lt; n-i-1; j++) {` },
      { text: `      <span class="drs-kw">if</span> (arr[j] > arr[j+1]) swap(arr, j, j+1);` },
      { text: `    }` },
      { text: `  } <span class="drs-cmt">// sorted!</span>` },
      { text: `}` },
    ]
  },
  bfs: {
    time: "O(V + E)", space: "O(V)",
    desc: "Explore all neighbors level by level using a queue. Guarantees shortest path on unweighted graphs.",
    code: [
      { text: `<span class="drs-kw">function</span> <span class="drs-fn">bfs</span>(graph, start) {` },
      { text: `  <span class="drs-kw">const</span> visited = <span class="drs-kw">new</span> Set([start]);` },
      { text: `  <span class="drs-kw">const</span> node = queue.shift();` },
      { text: `  <span class="drs-kw">for</span> (neighbor <span class="drs-kw">of</span> graph[node]) {` },
      { text: `    <span class="drs-kw">if</span> (!visited.has(neighbor)) {` },
      { text: `      visited.add(neighbor); queue.push(neighbor);` },
      { text: `    }` },
      { text: `  }` },
      { text: `}` },
    ]
  },
  dfs: {
    time: "O(V + E)", space: "O(V)",
    desc: "Explore as deep as possible along each branch before backtracking. Uses implicit call stack.",
    code: [
      { text: `<span class="drs-kw">function</span> <span class="drs-fn">dfs</span>(node, visited) {` },
      { text: `  visited.add(node);` },
      { text: `  <span class="drs-cmt">// process node</span>` },
      { text: `  <span class="drs-kw">for</span> (neighbor <span class="drs-kw">of</span> graph[node]) {` },
      { text: `    <span class="drs-kw">if</span> (!visited.has(neighbor))` },
      { text: `      <span class="drs-fn">dfs</span>(neighbor, visited);` },
      { text: `  }` },
      { text: `}` },
    ]
  }
};

/* ═══════════════════════════════════════════
   GRAPH LAYOUT — fixed positions for 7 nodes
   ═══════════════════════════════════════════ */
const GRAPH_POS = [
  { x: 45, y: 20 },  // 0 root
  { x: 20, y: 55 },  // 1
  { x: 70, y: 55 },  // 2
  { x: 8,  y: 88 },  // 3
  { x: 33, y: 88 },  // 4
  { x: 57, y: 88 },  // 5
  { x: 83, y: 88 },  // 6
];
const GRAPH_EDGES = [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]];

/* ═══════════════════════════════════════════
   RENDER FUNCTIONS
   ═══════════════════════════════════════════ */
function renderArray(visual, algoKey) {
  const container = document.getElementById("drsVisual");

  if (algoKey === "binarySearch") {
    const { arr, lo, hi, mid, found } = visual;
    container.innerHTML = arr.map((val, i) => {
      let cls = "drs-cell";
      if (i === found)           cls += " found";
      else if (i === mid)        cls += " active";
      else if (i < lo || i > hi) cls += " eliminated";

      const pointers = [];
      if (i === lo)  pointers.push("lo");
      if (i === hi)  pointers.push("hi");
      if (i === mid) pointers.push("mid");

      return `<div style="position:relative; margin-bottom:24px;">
        <div class="drs-cell-index">${i}</div>
        <div class="${cls}">${val}${pointers.length ? `<div class="drs-pointer">${pointers.join("/")}</div>` : ""}</div>
      </div>`;
    }).join("");

  } else if (algoKey === "bubbleSort") {
    const { arr, comparing, swapped, sorted } = visual;
    container.innerHTML = arr.map((val, i) => {
      let cls = "drs-cell";
      if (swapped.includes(i))   cls += " swapping";
      else if (comparing.includes(i)) cls += " comparing";
      else if (sorted.includes(i))    cls += " sorted";
      return `<div style="position:relative; margin-bottom:24px;">
        <div class="drs-cell-index">${i}</div>
        <div class="${cls}">${val}</div>
      </div>`;
    }).join("");

  } else {
    // BFS / DFS — graph
    const { visited, current } = visual;
    let html = `<div class="drs-graph-wrap" id="drsGraphWrap">`;

    GRAPH_EDGES.forEach(([a, b]) => {
      const ax = GRAPH_POS[a].x, ay = GRAPH_POS[a].y;
      const bx = GRAPH_POS[b].x, by = GRAPH_POS[b].y;
      const dx = bx - ax, dy = by - ay;
      const len = Math.sqrt(dx*dx + dy*dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const isActive = visited.includes(a) && visited.includes(b);
      html += `<div class="drs-edge${isActive ? " active" : ""}" style="left:${ax}%;top:${ay}%;width:${len}%;transform:rotate(${angle}deg)"></div>`;
    });

    GRAPH_POS.forEach((pos, i) => {
      let cls = "drs-node";
      if (i === current)         cls += " current";
      else if (visited.includes(i)) cls += " visited";
      html += `<div class="${cls}" style="left:calc(${pos.x}% - 22px);top:calc(${pos.y}% - 22px)">${i}</div>`;
    });

    html += `</div>`;
    container.innerHTML = html;
  }
}

function renderCode(lines, activeLine) {
  const panel = document.getElementById("drsCode");
  panel.innerHTML = lines.map((l, i) => `
    <div class="drs-code-line${i === activeLine ? " highlight" : ""}">
      <span class="drs-line-num">${i + 1}</span>
      <span class="drs-line-code">${l.text}</span>
    </div>`).join("");
}

function renderVars(vars) {
  const prev = window._prevVars || {};
  const table = document.getElementById("drsVarTable");
  if (!vars || Object.keys(vars).length === 0) {
    table.innerHTML = `<p class="drs-var-empty">Variables will appear here during simulation.</p>`;
    return;
  }
  table.innerHTML = Object.entries(vars).map(([k, v]) => {
    const changed = String(v) !== String(prev[k]);
    return `<div class="drs-var-row${changed ? " changed" : ""}">
      <span class="drs-var-name">${k}</span>
      <span class="drs-var-val">${v}</span>
    </div>`;
  }).join("");
  window._prevVars = { ...vars };
}

function applyStep(step, algoKey, meta) {
  renderArray(step.visual, algoKey);
  renderCode(meta.code, step.line);
  renderVars(step.vars);
  document.getElementById("drsExplanation").textContent = step.explanation;
}

/* ═══════════════════════════════════════════
   MAIN INIT
   ═══════════════════════════════════════════ */
function initDryRun() {
  const playBtn   = document.getElementById("drsPlayBtn");
  const nextBtn   = document.getElementById("drsNextBtn");
  const prevBtn   = document.getElementById("drsPrevBtn");
  const resetBtn  = document.getElementById("drsResetBtn");
  const speedSlider = document.getElementById("drsSpeed");
  const speedLabel  = document.getElementById("speedLabel");
  const stepNumEl   = document.getElementById("drsStepNum");
  const totalEl     = document.getElementById("drsTotalSteps");

  if (!playBtn) return;

  const SPEED_LABELS = { 1: "Very Slow", 2: "Slow", 3: "Normal", 4: "Fast", 5: "Very Fast" };
  const SPEED_MS     = { 1: 1800, 2: 1200, 3: 700, 4: 350, 5: 150 };

  let currentAlgo  = "binarySearch";
  let steps        = [];
  let stepIndex    = 0;
  let playing      = false;
  let playInterval = null;

  function loadAlgo(key) {
    currentAlgo = key;
    const meta = ALGO_META[key];

    steps = {
      binarySearch: genBinarySearchSteps,
      bubbleSort:   genBubbleSortSteps,
      bfs:          genBFSSteps,
      dfs:          genDFSSteps,
    }[key]();

    stepIndex = 0;
    window._prevVars = {};

    document.getElementById("drsTimeComp").textContent  = meta.time;
    document.getElementById("drsSpaceComp").textContent = meta.space;
    document.getElementById("drsAlgoDesc").textContent  = meta.desc;

    totalEl.textContent = steps.length - 1;
    updateStepCounter();
    applyStep(steps[0], key, meta);
    stopPlay();
    updateBtns();
  }

  function updateStepCounter() {
    stepNumEl.textContent = stepIndex;
    totalEl.textContent   = steps.length - 1;
  }

  function updateBtns() {
    prevBtn.disabled = stepIndex === 0;
    nextBtn.disabled = stepIndex >= steps.length - 1;
  }

  function goToStep(i) {
    if (i < 0 || i >= steps.length) return;
    stepIndex = i;
    applyStep(steps[stepIndex], currentAlgo, ALGO_META[currentAlgo]);
    updateStepCounter();
    updateBtns();
  }

  function startPlay() {
    if (stepIndex >= steps.length - 1) { stepIndex = 0; }
    playing = true;
    playBtn.innerHTML = `<i class="fas fa-pause"></i>`;
    const ms = SPEED_MS[speedSlider.value] || 700;
    playInterval = setInterval(() => {
      if (stepIndex >= steps.length - 1) { stopPlay(); return; }
      goToStep(stepIndex + 1);
    }, ms);
  }

  function stopPlay() {
    playing = false;
    clearInterval(playInterval);
    playBtn.innerHTML = `<i class="fas fa-play"></i>`;
  }

  // Algorithm selector
  document.querySelectorAll(".drs-algo-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".drs-algo-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      stopPlay();
      loadAlgo(btn.dataset.algo);
    });
  });

  playBtn.addEventListener("click", () => { playing ? stopPlay() : startPlay(); });
  nextBtn.addEventListener("click", () => { stopPlay(); goToStep(stepIndex + 1); });
  prevBtn.addEventListener("click", () => { stopPlay(); goToStep(stepIndex - 1); });
  resetBtn.addEventListener("click", () => { stopPlay(); loadAlgo(currentAlgo); });

  speedSlider.addEventListener("input", () => {
    speedLabel.textContent = SPEED_LABELS[speedSlider.value];
    if (playing) { stopPlay(); startPlay(); }
  });

  // Init
  loadAlgo("binarySearch");
  nextBtn.disabled = false;
}