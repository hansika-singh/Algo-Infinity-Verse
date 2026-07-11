// ==========================================================================
// CONCEPT BRIDGE TRAINER INTERACTIVITY
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Common Utilities
  initNavbar();
  initScrollTop();
  initFooterCurrentDate();
  
  // Core Bridges Engine
  initBridgeMap();
  initCodeEvolver();
  initRecursionTree();
  initTreeGraphSandbox();
  initDivideConquerVisualizer();
  initQuizEngine();
});

function initScrollTop() {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;
  window.addEventListener("scroll", () => btn.classList.toggle("visible", window.scrollY > 400));
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function initNavbar() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");
  if (!menuToggle || !navLinks) return;
  let overlay = document.querySelector(".nav-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "nav-overlay";
    document.body.appendChild(overlay);
  }
  const toggleMenu = (open) => {
    const isOpen = open !== undefined ? open : !navLinks.classList.contains("active");
    navLinks.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", isOpen);
    overlay.classList.toggle("active", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
    const icon = menuToggle.querySelector("i");
    if (icon) {
      icon.classList.toggle("fa-bars", !isOpen);
      icon.classList.toggle("fa-times", isOpen);
    }
  };
  menuToggle.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(); });
  overlay.addEventListener("click", () => toggleMenu(false));
  navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => toggleMenu(false)));
  
  const isMobile = () => window.matchMedia("(max-width: 1024px)").matches;
  document.querySelectorAll(".dropdown-toggle").forEach((toggle) => {
    const parent = toggle.closest(".has-dropdown");
    const menu = parent?.querySelector(".dropdown-menu");
    if (!parent || !menu) return;
    let t;
    parent.addEventListener("mouseenter", () => { if (!isMobile()) { clearTimeout(t); parent.classList.add("open"); toggle.setAttribute("aria-expanded", "true"); } });
    parent.addEventListener("mouseleave", () => { if (!isMobile()) { t = setTimeout(() => { parent.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }, 250); } });
    toggle.addEventListener("click", (e) => { if (isMobile()) { e.preventDefault(); e.stopPropagation(); const o = parent.classList.toggle("open"); toggle.setAttribute("aria-expanded", o); } });
  });
}

function initFooterCurrentDate() {
  const yearEl = document.getElementById("footer-current-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const dateEl = document.getElementById("footer-current-date");
  if (dateEl) {
    dateEl.textContent = `Today: ${new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })}`;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 🕸️ MIND MAP CONTROLLER
// ──────────────────────────────────────────────────────────────────────────
function initBridgeMap() {
  const bridges = document.querySelectorAll(".map-bridge, .bridge-tag-bg");
  const views = document.querySelectorAll(".bridge-view");
  const placeholder = document.getElementById("bridge-placeholder");

  bridges.forEach(bridge => {
    bridge.addEventListener("click", () => {
      const targetId = bridge.getAttribute("data-bridge");
      
      // Deactivate all bridges
      document.querySelectorAll(".map-bridge, .bridge-tag-bg").forEach(b => {
        if (b.getAttribute("data-bridge") === targetId) {
          b.classList.add("active");
        } else {
          b.classList.remove("active");
        }
      });

      // Show selected panel view
      views.forEach(view => {
        if (view.id === `bridge-${targetId}`) {
          view.classList.add("active");
        } else {
          view.classList.remove("active");
        }
      });
      if (placeholder) placeholder.classList.remove("active");

      // Scroll smoothly to panel
      document.getElementById("bridge-display-section").scrollIntoView({ behavior: "smooth" });
    });
  });
}

// ──────────────────────────────────────────────────────────────────────────
// 💡 BRIDGE 1: CODE EVOLVER
// ──────────────────────────────────────────────────────────────────────────
const EVOLVER_DATA = {
  recursion: {
    filename: "fibonacci_recursive.py",
    time: "O(2^N)",
    space: "O(N)",
    code: `# 1. Pure Recursive Fibonacci
def fib(n):
    if n <= 1:
        return n
    # Calculates subproblems from scratch every time
    return fib(n-1) + fib(n-2)`
  },
  memo: {
    filename: "fibonacci_memoized.py",
    time: "O(N)",
    space: "O(N)",
    code: `# 2. Memoized Fibonacci (Top-Down DP)
memo = {}

def fib(n):
    if n in memo:
        return memo[n]  # O(1) Cache fetch
    if n <= 1:
        return n
    # Cache results to avoid redundant calculations
    memo[n] = fib(n-1) + fib(n-2)
    return memo[n]`
  },
  tab: {
    filename: "fibonacci_tabulated.py",
    time: "O(N)",
    space: "O(N)",
    code: `# 3. Tabulated Fibonacci (Bottom-Up DP)
def fib(n):
    if n <= 1:
        return n
    # Build solution iteratively from smallest subproblem
    dp = [0] * (n + 1)
    dp[1] = 1
    for i in range(2, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
    return dp[n]`
  }
};

function initCodeEvolver() {
  const tabs = document.querySelectorAll(".evolver-tab");
  const filename = document.getElementById("evolverFilename");
  const codeBlock = document.getElementById("evolverCodeBlock");
  const timeComp = document.getElementById("evolveTime");
  const spaceComp = document.getElementById("evolveSpace");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      const key = tab.getAttribute("data-evolve");
      const data = EVOLVER_DATA[key];

      if (data) {
        filename.textContent = data.filename;
        codeBlock.textContent = data.code;
        timeComp.textContent = data.time;
        spaceComp.textContent = data.space;
      }
    });
  });
}

// ──────────────────────────────────────────────────────────────────────────
// 💡 BRIDGE 1: FIBONACCI RECURRENCE TREE VISUALIZER
// ──────────────────────────────────────────────────────────────────────────
const TREE_NODES = [
  { id: "n0", label: "fib(4)", x: 250, y: 30, parent: null, isRedundant: false },
  
  { id: "n1", label: "fib(3)", x: 150, y: 90, parent: "n0", isRedundant: false },
  { id: "n2", label: "fib(2)", x: 350, y: 90, parent: "n0", isRedundant: true },
  
  { id: "n3", label: "fib(2)", x: 90, y: 150, parent: "n1", isRedundant: false },
  { id: "n4", label: "fib(1)", x: 210, y: 150, parent: "n1", isRedundant: false },
  
  { id: "n5", label: "fib(1)", x: 310, y: 150, parent: "n2", isRedundant: true },
  { id: "n6", label: "fib(0)", x: 390, y: 150, parent: "n2", isRedundant: true },
  
  { id: "n7", label: "fib(1)", x: 50, y: 210, parent: "n3", isRedundant: false },
  { id: "n8", label: "fib(0)", x: 130, y: 210, parent: "n3", isRedundant: false }
];

function initRecursionTree() {
  const toggleBtn = document.getElementById("toggleMemoBtn");
  const opCounter = document.getElementById("opCounter");
  const explanation = document.getElementById("recursionExplanation");
  let memoEnabled = false;

  function renderTree() {
    const svg = document.getElementById("fibTreeSvg");
    if (!svg) return;
    svg.innerHTML = "";

    // Render Edges first so nodes overlay them
    TREE_NODES.forEach(node => {
      if (node.parent) {
        const parentNode = TREE_NODES.find(n => n.id === node.parent);
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", parentNode.x);
        line.setAttribute("y1", parentNode.y);
        line.setAttribute("x2", node.x);
        line.setAttribute("y2", node.y);
        line.setAttribute("class", "tree-edge");
        if (memoEnabled && node.isRedundant) {
          line.classList.add("pruned");
        }
        svg.appendChild(line);
      }
    });

    // Render Nodes
    TREE_NODES.forEach(node => {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "tree-node");
      g.setAttribute("transform", `translate(${node.x}, ${node.y})`);

      if (memoEnabled && node.isRedundant) {
        g.classList.add("pruned");
      }

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("r", "18");

      // Custom coloring for cache hit
      if (memoEnabled && node.id === "n2") {
        circle.style.stroke = "var(--success)";
        circle.style.fill = "rgba(16, 185, 129, 0.1)";
      }

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("y", "4");
      text.setAttribute("text-anchor", "middle");
      text.textContent = (memoEnabled && node.id === "n2") ? "Cache Hit" : node.label;
      if (memoEnabled && node.id === "n2") {
        text.style.fontSize = "8px";
      }

      g.appendChild(circle);
      g.appendChild(text);
      svg.appendChild(g);
    });
  }

  toggleBtn.addEventListener("click", () => {
    memoEnabled = !memoEnabled;
    if (memoEnabled) {
      toggleBtn.innerHTML = `<i class="fas fa-eye-slash"></i> Disable Memoization`;
      opCounter.textContent = "5";
      explanation.innerHTML = `
        <strong>Memoization Enabled!</strong> The second call to <code>fib(2)</code> is a cache hit. All redundant subproblem calls (<code>fib(1)</code> and <code>fib(0)</code>) below it are pruned. Complexities decrease from <strong>15 operations</strong> to <strong>5 operations</strong>!
      `;
    } else {
      toggleBtn.innerHTML = `<i class="fas fa-brain"></i> Enable Memoization`;
      opCounter.textContent = "15";
      explanation.innerHTML = `
        Without memory, <code>fib(3)</code>, <code>fib(2)</code> etc. are calculated repeatedly. Notice the duplicate branches in the tree. This results in exponential operations!
      `;
    }
    renderTree();
  });

  renderTree();
}

// ──────────────────────────────────────────────────────────────────────────
// 💡 BRIDGE 2: TREES -> GRAPHS SANDBOX
// ──────────────────────────────────────────────────────────────────────────
const SANDBOX_NODES = [
  { id: 0, x: 250, y: 35, label: "0 (Root)" },
  { id: 1, x: 150, y: 105, label: "1" },
  { id: 2, x: 350, y: 105, label: "2" },
  { id: 3, x: 90, y: 185, label: "3" },
  { id: 4, x: 210, y: 185, label: "4" },
  { id: 5, x: 350, y: 185, label: "5" }
];

const BASE_EDGES = [
  { from: 0, to: 1 },
  { from: 0, to: 2 },
  { from: 1, to: 3 },
  { from: 1, to: 4 },
  { from: 2, to: 5 }
];

function initTreeGraphSandbox() {
  const btnSetTree = document.getElementById("btnSetTree");
  const btnToggleCycle = document.getElementById("btnToggleCycle");
  const btnToggleMultiRoot = document.getElementById("btnToggleMultiRoot");
  
  const nodeCountEl = document.getElementById("nodeCount");
  const edgeCountEl = document.getElementById("edgeCount");
  const ruleV1El = document.getElementById("ruleV1");
  const resultEl = document.getElementById("structureResult");
  const detailsEl = document.getElementById("structureDetails");
  
  const chkConnected = document.getElementById("chk-connected");
  const chkAcyclic = document.getElementById("chk-acyclic");
  const chkSingleParent = document.getElementById("chk-single-parent");
  const card = document.getElementById("structureStatusCard");

  let cycleActive = false;
  let multiRootActive = false;

  function evaluateStructure() {
    let edgesCount = BASE_EDGES.length;
    if (cycleActive) edgesCount++;
    if (multiRootActive) edgesCount++;

    nodeCountEl.textContent = "6";
    edgeCountEl.textContent = edgesCount;

    let hasCycle = cycleActive;
    let hasMultiParent = multiRootActive;
    let isConnected = true; // Nodes are always connected in these preset toggles

    // V-1 rule check
    if (edgesCount === 5) {
      ruleV1El.textContent = "Passed (E = V-1)";
      ruleV1El.className = "metric-value text-success";
    } else {
      ruleV1El.textContent = `Failed (E = ${edgesCount})`;
      ruleV1El.className = "metric-value text-error";
    }

    // Invariant Checkmark classes
    chkConnected.innerHTML = `<i class="fas fa-circle-check text-success"></i> Fully Connected (Single Component)`;
    
    if (hasCycle) {
      chkAcyclic.innerHTML = `<i class="fas fa-circle-xmark text-error"></i> Acyclic (Cycle Detected!)`;
    } else {
      chkAcyclic.innerHTML = `<i class="fas fa-circle-check text-success"></i> Acyclic (No Cycles)`;
    }

    if (hasMultiParent) {
      chkSingleParent.innerHTML = `<i class="fas fa-circle-xmark text-error"></i> Single Parent (Multi-Path Detected!)`;
    } else {
      chkSingleParent.innerHTML = `<i class="fas fa-circle-check text-success"></i> Single Parent (Hierarchical Paths)`;
    }

    // Determine output
    if (!hasCycle && !hasMultiParent) {
      resultEl.textContent = "TREE";
      resultEl.className = "status-result text-success";
      card.className = "status-indicator-card status-tree";
      detailsEl.textContent = "A valid Tree contains a single root node, exactly V - 1 edges, is fully connected, and contains zero cycles.";
    } else {
      resultEl.textContent = "GRAPH";
      resultEl.className = "status-result text-error";
      card.className = "status-indicator-card status-graph";
      
      let reasons = [];
      if (hasCycle) reasons.push("a cycle between Node 4 and Node 1");
      if (hasMultiParent) reasons.push("multiple paths to Node 5 (parented by 1 and 2)");
      detailsEl.textContent = `Structural violations detected: The structure contains ${reasons.join(" and ")}. A general graph allows cycles, loops, and nodes with multiple parents.`;
    }
  }

  function renderSandbox() {
    const svg = document.getElementById("sandboxSvg");
    if (!svg) return;
    svg.innerHTML = "";

    // Base Edges
    BASE_EDGES.forEach(edge => {
      const fromNode = SANDBOX_NODES.find(n => n.id === edge.from);
      const toNode = SANDBOX_NODES.find(n => n.id === edge.to);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", fromNode.x);
      line.setAttribute("y1", fromNode.y);
      line.setAttribute("x2", toNode.x);
      line.setAttribute("y2", toNode.y);
      line.setAttribute("class", "sb-edge active");
      svg.appendChild(line);
    });

    // Cycle Edge (4 -> 1)
    if (cycleActive) {
      const fromNode = SANDBOX_NODES.find(n => n.id === 4);
      const toNode = SANDBOX_NODES.find(n => n.id === 1);
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      
      // Draw a curved arc for cycle visual clarity
      const dx = toNode.x - fromNode.x;
      const dy = toNode.y - fromNode.y;
      const dr = Math.sqrt(dx*dx + dy*dy) * 1.2;
      path.setAttribute("d", `M${fromNode.x},${fromNode.y} A${dr},${dr} 0 0,1 ${toNode.x},${toNode.y}`);
      path.setAttribute("class", "sb-edge cycle");
      svg.appendChild(path);
    }

    // Multi-Parent Edge (1 -> 5)
    if (multiRootActive) {
      const fromNode = SANDBOX_NODES.find(n => n.id === 1);
      const toNode = SANDBOX_NODES.find(n => n.id === 5);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", fromNode.x);
      line.setAttribute("y1", fromNode.y);
      line.setAttribute("x2", toNode.x);
      line.setAttribute("y2", toNode.y);
      line.setAttribute("class", "sb-edge multi-parent");
      svg.appendChild(line);
    }

    // Nodes
    SANDBOX_NODES.forEach(node => {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "sb-node");
      g.setAttribute("transform", `translate(${node.x}, ${node.y})`);

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("r", "16");

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("y", "4");
      text.setAttribute("text-anchor", "middle");
      text.textContent = node.id;

      g.appendChild(circle);
      g.appendChild(text);
      svg.appendChild(g);
    });
  }

  btnSetTree.addEventListener("click", () => {
    cycleActive = false;
    multiRootActive = false;
    btnToggleCycle.className = "btn btn-secondary btn-sm";
    btnToggleMultiRoot.className = "btn btn-secondary btn-sm";
    renderSandbox();
    evaluateStructure();
  });

  btnToggleCycle.addEventListener("click", () => {
    cycleActive = !cycleActive;
    btnToggleCycle.className = cycleActive ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm";
    renderSandbox();
    evaluateStructure();
  });

  btnToggleMultiRoot.addEventListener("click", () => {
    multiRootActive = !multiRootActive;
    btnToggleMultiRoot.className = multiRootActive ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm";
    renderSandbox();
    evaluateStructure();
  });

  renderSandbox();
  evaluateStructure();
}

// ──────────────────────────────────────────────────────────────────────────
// 💡 BRIDGE 3: SORTING -> DIVIDE & CONQUER
// ──────────────────────────────────────────────────────────────────────────
const DC_PHASES = [
  {
    name: "1. Divide (Split Phase)",
    explanation: "Divide: Split the array recursively into halves. We break <code>[38, 27, 43, 3, 9, 82, 10, 8]</code> down into single elements.",
    rows: [
      [[38, 27, 43, 3, 9, 82, 10, 8]],
      [[38, 27, 43, 3], [9, 82, 10, 8]],
      [[38, 27], [43, 3], [9, 82], [10, 8]],
      [[38], [27], [43], [3], [9], [82], [10], [8]]
    ]
  },
  {
    name: "2. Conquer (Base Case Solve)",
    explanation: "Conquer: Base cases of size 1 are trivially sorted already! Each single-element subarray is technically a solved sorting problem.",
    rows: [
      [[38], [27], [43], [3], [9], [82], [10], [8]]
    ],
    solved: true
  },
  {
    name: "3. Combine (Merge Phase)",
    explanation: "Combine: Merge sorted subarrays back together. We merge <code>[38]</code> & <code>[27]</code> into <code>[27, 38]</code>, sorting as we combine, until the entire array is sorted.",
    rows: [
      [[38], [27], [43], [3], [9], [82], [10], [8]],
      [[27, 38], [3, 43], [9, 82], [8, 10]],
      [[3, 27, 38, 43], [8, 9, 10, 82]],
      [[3, 8, 9, 10, 27, 38, 43, 82]]
    ]
  }
];

function initDivideConquerVisualizer() {
  const btnPlay = document.getElementById("btnDcPlay");
  const btnNext = document.getElementById("btnDcNext");
  const btnReset = document.getElementById("btnDcReset");
  const phaseName = document.getElementById("dcPhaseName");
  const phaseExplanation = document.getElementById("dcPhaseExplanation");
  const container = document.getElementById("dcVisualContainer");

  let phaseIndex = 0;
  let playInterval = null;
  let playing = false;

  function renderPhase() {
    container.innerHTML = "";
    const phase = DC_PHASES[phaseIndex];
    phaseName.textContent = phase.name;
    phaseExplanation.innerHTML = phase.explanation;

    phase.rows.forEach((row, rowIndex) => {
      const rowDiv = document.createElement("div");
      rowDiv.className = "dc-row";

      row.forEach(arr => {
        const block = document.createElement("div");
        block.className = "dc-array-block";
        if (phase.solved) {
          block.classList.add("solved");
        }
        if (rowIndex === phase.rows.length - 1) {
          block.classList.add("active");
        }

        arr.forEach(val => {
          const cell = document.createElement("div");
          cell.className = "dc-cell";
          cell.textContent = val;
          block.appendChild(cell);
        });

        rowDiv.appendChild(block);
      });

      container.appendChild(rowDiv);
    });
  }

  function nextPhase() {
    phaseIndex = (phaseIndex + 1) % DC_PHASES.length;
    renderPhase();
  }

  function startPlay() {
    playing = true;
    btnPlay.innerHTML = `<i class="fas fa-pause"></i> Pause`;
    playInterval = setInterval(() => {
      nextPhase();
    }, 2500);
  }

  function stopPlay() {
    playing = false;
    btnPlay.innerHTML = `<i class="fas fa-play"></i> Play`;
    clearInterval(playInterval);
  }

  btnPlay.addEventListener("click", () => {
    if (playing) stopPlay();
    else startPlay();
  });

  btnNext.addEventListener("click", () => {
    stopPlay();
    nextPhase();
  });

  btnReset.addEventListener("click", () => {
    stopPlay();
    phaseIndex = 0;
    renderPhase();
  });

  renderPhase();
}

// ──────────────────────────────────────────────────────────────────────────
// 🏆 GAMIFIED QUIZ ENGINE
// ──────────────────────────────────────────────────────────────────────────
const QUIZZES = {
  "recursion-dp": [
    {
      q: "What is the primary feature that distinguishes Dynamic Programming from pure recursion?",
      options: [
        "Dynamic Programming uses loops instead of function calls.",
        "Dynamic Programming uses a memoization/tabulation cache to store and reuse solved subproblem answers.",
        "Dynamic Programming is always written in Python.",
        "Dynamic Programming avoids memory usage."
      ],
      correct: 1,
      exp: "DP caches subproblem results. Recursion calculates subproblems from scratch repeatedly."
    },
    {
      q: "When we analyze a recurrence tree, what properties indicate that DP is applicable?",
      options: [
        "The tree must be completely balanced and binary.",
        "The tree must contain overlapping subproblems and optimal substructure.",
        "The tree must have a depth of at least 10 nodes.",
        "The tree must not contain base cases."
      ],
      correct: 1,
      exp: "Overlapping subproblems (redundant calls) and Optimal Substructure (larger solution built from sub-solutions) are the two pillars of DP."
    },
    {
      q: "Tabulation (Bottom-Up) DP typically constructs the solution in what manner?",
      options: [
        "Iteratively, from the base cases up to the target value N.",
        "Recursively, starting from N and drilling down to base cases.",
        "Using random index selection.",
        "Using stack-frame popping only."
      ],
      correct: 0,
      exp: "Tabulation fills an array iteratively starting from index 0/1 up to N. Memoization goes Top-Down recursively."
    }
  ],
  "trees-graphs": [
    {
      q: "Which edge addition violates theTree structural invariants in our sandbox?",
      options: [
        "Adding an edge from a parent to a child node.",
        "Adding a back-edge from a descendant node to an ancestor node, creating a cycle.",
        "Adding a sibling relationship connection.",
        "No edge can ever violate tree properties."
      ],
      correct: 1,
      exp: "A tree must be acyclic. Adding an edge that creates a loop/cycle instantly violates this, turning it into a general graph."
    },
    {
      q: "In a valid tree structure containing V vertices, what must the edge count E be?",
      options: [
        "E = V",
        "E = V - 1",
        "E = V + 1",
        "E = 2 * V"
      ],
      correct: 1,
      exp: "A connected acyclic tree of V vertices always contains exactly V - 1 edges."
    },
    {
      q: "What is another structural property of a tree that sets it apart from general graphs?",
      options: [
        "A tree is always unweighted.",
        "Every node (except the root) has exactly one unique incoming parent node.",
        "A tree must be directed from left to right.",
        "A tree cannot contain leaf nodes."
      ],
      correct: 1,
      exp: "In a tree, every child node has exactly one parent. General graphs allow nodes to have multiple incoming edges."
    }
  ],
  "sort-dc": [
    {
      q: "What are the three core steps of the Divide & Conquer design paradigm?",
      options: [
        "Sort, Search, Output",
        "Divide (Split), Conquer (Solve Base Cases), Combine (Merge)",
        "Iterate, Push, Pop",
        "Pivot, Partition, Swap"
      ],
      correct: 1,
      exp: "Divide (split input), Conquer (solve subproblems), Combine (merge solutions)."
    },
    {
      q: "At what point does the 'Conquer' step resolve a base case in Merge Sort?",
      options: [
        "When subarray size becomes 1.",
        "When the array is half-split.",
        "When elements are swapped.",
        "When the array size is equal to N."
      ],
      correct: 0,
      exp: "An array of size 1 is already sorted by definition (trivially solved base case)."
    },
    {
      q: "Which sorting algorithm does NOT use the typical Divide & Conquer approach?",
      options: [
        "Merge Sort",
        "Quick Sort",
        "Bubble Sort",
        "Heap Sort (using heap tree properties)"
      ],
      correct: 2,
      exp: "Bubble Sort is an iterative comparison sort. Merge Sort and Quick Sort are classic Divide & Conquer algorithms."
    }
  ]
};

function initQuizEngine() {
  // Populate Quizzes
  Object.entries(QUIZZES).forEach(([quizKey, questions]) => {
    const container = document.getElementById(`quiz-${quizKey}`);
    if (!container) return;

    container.innerHTML = "";
    questions.forEach((q, qIndex) => {
      const qDiv = document.createElement("div");
      qDiv.className = "quiz-question";

      const qText = document.createElement("div");
      qText.className = "q-text";
      qText.textContent = `${qIndex + 1}. ${q.q}`;
      qDiv.appendChild(qText);

      const optionsDiv = document.createElement("div");
      optionsDiv.className = "quiz-options";

      q.options.forEach((opt, optIndex) => {
        const label = document.createElement("label");
        label.className = "quiz-option-label";
        label.innerHTML = `
          <input type="radio" name="q-${quizKey}-${qIndex}" value="${optIndex}">
          <span>${opt}</span>
        `;
        optionsDiv.appendChild(label);

        // Add selection listener
        const radio = label.querySelector('input[type="radio"]');
        radio.addEventListener("change", () => {
          // Deselect other labels
          optionsDiv.querySelectorAll(".quiz-option-label").forEach(l => l.classList.remove("selected"));
          label.classList.add("selected");
        });
      });

      qDiv.appendChild(optionsDiv);
      container.appendChild(qDiv);
    });
  });

  // Attach submit listeners
  document.querySelectorAll(".submit-quiz-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const quizKey = btn.getAttribute("data-quiz");
      const questions = QUIZZES[quizKey];
      const feedback = document.getElementById(`feedback-${quizKey}`);
      let correctCount = 0;

      questions.forEach((q, qIndex) => {
        const selectedRadio = document.querySelector(`input[name="q-${quizKey}-${qIndex}"]:checked`);
        const qContainer = selectedRadio ? selectedRadio.closest(".quiz-options") : null;
        
        if (qContainer) {
          const selectedValue = parseInt(selectedRadio.value);
          
          qContainer.querySelectorAll(".quiz-option-label").forEach((lbl, idx) => {
            lbl.classList.remove("correct", "incorrect");
            if (idx === q.correct) {
              lbl.classList.add("correct"); // Highlight correct in green
            }
            if (idx === selectedValue && selectedValue !== q.correct) {
              lbl.classList.add("incorrect"); // Highlight user wrong in red
            }
          });

          if (selectedValue === q.correct) {
            correctCount++;
          }
        }
      });

      feedback.className = "quiz-feedback-box show";
      if (correctCount === questions.length) {
        feedback.classList.add("correct-ans");
        feedback.innerHTML = `
          <strong>🎉 3/3 Correct! Bridge Mastered!</strong><br>
          Excellent work! You have earned +50 XP and successfully bridged these two concepts. Keep it up!
        `;
        // Reward only once per quiz button instance
        if (btn.dataset.rewarded !== "true") {
          rewardXp(50);
          btn.dataset.rewarded = "true";
        }
      } else {
        feedback.classList.add("incorrect-ans");
        feedback.innerHTML = `
          <strong>❌ Score: ${correctCount}/${questions.length} Correct.</strong><br>
          Some answers were incorrect. Review the green (correct) options, correct your choices, and try again!
        `;
      }
    });
  });
}

function rewardXp(points) {
  // Reward visual stats update
  const xpEl = document.getElementById("profileTotalXP") || document.getElementById("totalXP");
  if (xpEl) {
    const current = parseInt(xpEl.textContent) || 0;
    xpEl.textContent = current + points;
  }
}
