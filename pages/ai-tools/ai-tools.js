/* ============================================
   AI TOOLS — Data, Search & Filter
   ============================================ */

const aiTools = [
  // ── Learning Assistants ──
  { name: "AI Tutor", path: "/pages/ai-features/ai-tutor/ai-tutor.html", category: "Learning Assistants", icon: "fa-robot", desc: "Private AI tutor that runs entirely in your browser. Get code reviews, explanations, and help offline." },
  { name: "Concept Bridge Trainer", path: "/pages/ai-features/concept-bridge/concept-bridge.html", category: "Learning Assistants", icon: "fa-link", desc: "Master the links between key DSA paradigms: Recursion to DP, Trees to Graphs, and more." },
  { name: "DS Selection Assistant", path: "/pages/ai-features/ds-selection-assistant/ds-selection-assistant.html", category: "Learning Assistants", icon: "fa-cubes", desc: "Answer 3 quick questions and get a personalized data structure recommendation with complexity analysis." },
  { name: "AI Body Language Analyst", path: "/pages/ai-features/ai-analyst/ai-analyst.html", category: "Learning Assistants", icon: "fa-face-smile", desc: "Real-time facial tracking and body language analysis for interview prep using TensorFlow.js." },

  // ── Analysis & Profiling ──
  { name: "Space Complexity Profiler", path: "/pages/ai-features/space-complexity-profiler/space-complexity-profiler.html", category: "Analysis & Profiling", icon: "fa-memory", desc: "Dynamic memory profiling tool that estimates space complexity using AST parsing." },
  { name: "Flame Graph Profiler", path: "/pages/ai-features/flame-graph-profiler/flame-graph-profiler.html", category: "Analysis & Profiling", icon: "fa-fire", desc: "Profile recursive algorithms with D3 flame graphs showing execution time and call depth." },
  { name: "Reverse Complexity", path: "/pages/ai-features/reverse-complexity/reverse-complexity.html", category: "Analysis & Profiling", icon: "fa-arrow-right-arrow-left", desc: "Match the target complexity to the correct code snippet in this timed challenge." },
  { name: "Intent Detector", path: "/intent-detector.html", category: "Analysis & Profiling", icon: "fa-eye", desc: "AI-powered intent detection engine that analyzes coding patterns and learning behavior." },
  { name: "Complexity Analyzer", path: "/pages/tools/complexity-analyzer/complexity-analyzer.html", category: "Analysis & Profiling", icon: "fa-chart-line", desc: "Analyze time and space complexity of your algorithms with detailed breakdowns." },

  // ── Simulations ──
  { name: "Raft Consensus Simulator", path: "/pages/ai-features/raft-simulator/raft-simulator.html", category: "Simulations", icon: "fa-anchor", desc: "Interactive Raft consensus algorithm simulator with leader election and log replication." },
  { name: "Chaos Monkey Simulator", path: "/pages/ai-features/chaos-simulator/chaos-simulator.html", category: "Simulations", icon: "fa-skull", desc: "Unleash chaos on your system design — kill servers, spike traffic, and test resilience." },
  { name: "Failure Simulation Engine", path: "/pages/ai-features/failure-simulator/failure-simulator.html", category: "Simulations", icon: "fa-triangle-exclamation", desc: "Simulate real interview stressors: timer contractions, memory constraints, and AI interruptions." },
  { name: "Agile Sprint Simulator", path: "/pages/ai-features/agile-sprint-simulator/agile-sprint-simulator.html", category: "Simulations", icon: "fa-chart-area", desc: "Plan sprints, drag stories, track velocity, and visualize live burndown charts." },

  // ── Creative Tools ──
  { name: "Algorithm Dream Generator", path: "/pages/ai-features/algorithm-dream-generator/algorithm-dream-generator.html", category: "Creative Tools", icon: "fa-moon", desc: "Generate surreal story-based visual narratives that explain algorithms through characters and quests." },
  { name: "Algorithm Music Composer", path: "/pages/visualizers/algorithm-music-composer/algorithm-music-composer.html", category: "Creative Tools", icon: "fa-music", desc: "Hear algorithms — sorting, graphs, and trees composed into music through sonification." },
  { name: "DSA Mythbusters", path: "/pages/ai-features/dsa-mythbusters/dsa-mythbusters.html", category: "Creative Tools", icon: "fa-bomb", desc: "Debunk common DSA misconceptions with counterexamples, interactive demos, and quizzes." },

  // ── Future Self ──
  { name: "Future Self Simulator", path: "/pages/ai-features/future-self-simulator/future-self-simulator.html", category: "Future Self", icon: "fa-clock", desc: "Predict forgetting curves using spaced repetition. Log topics and get revision recommendations." },
  { name: "Future Self Code Reviewer", path: "/pages/ai-features/future-self-code-reviewer/future-self-code-reviewer.html", category: "Future Self", icon: "fa-glasses", desc: "Get code reviews from your future self at 3 career stages: 1-month, 1-year, and senior architect." },
  { name: "Future Knowledge Predictor", path: "/pages/ai-features/future-knowledge-predictor/future-knowledge-predictor.html", category: "Future Self", icon: "fa-lightbulb", desc: "Predict learning difficulties, forecast weaknesses, and get proactive study plans." },

  // ── Advanced Tech ──
  { name: "Quantum Circuit Simulator", path: "/pages/ai-features/quantum-simulator/quantum-simulator.html", category: "Advanced Tech", icon: "fa-atom", desc: "Build quantum circuits with drag-and-drop gates and visualize state vectors on 3D Bloch spheres." },
  { name: "Post-Quantum Kyber", path: "/pages/ai-features/pqc-kyber/pqc-kyber.html", category: "Advanced Tech", icon: "fa-shield-halved", desc: "Interactive CRYSTALS-Kyber lattice-based encryption simulator — ML-KEM key encapsulation." },
  { name: "HFT Matching Engine", path: "/pages/ai-features/hft-engine/hft-engine.html", category: "Advanced Tech", icon: "fa-chart-simple", desc: "High-frequency trading L2 order book matching engine with lock-free ring buffers." },
  { name: "WebGPU Neural Network", path: "/pages/ai-features/webgpu-neural-network/webgpu-neural-network.html", category: "Advanced Tech", icon: "fa-microchip", desc: "Build, compile, and train neural networks directly on your GPU via WebGPU compute shaders." },
  { name: "WebGPU Fluid Solver", path: "/pages/ai-features/fluid-solver/fluid-solver.html", category: "Advanced Tech", icon: "fa-water", desc: "Solve Navier-Stokes equations in real-time using WebGPU compute shaders." },

  // ── Systems & Compilers ──
  { name: "Compiler & Virtual Machine", path: "/pages/ai-features/compiler-vm/compiler-vm.html", category: "Systems & Compilers", icon: "fa-cogs", desc: "Custom stack-based virtual machine with bytecode viewer and AST visualization." },
  { name: "Autograd Engine", path: "/pages/ai-features/autograd-engine/autograd-engine.html", category: "Systems & Compilers", icon: "fa-calculator", desc: "Build computational graphs and visualize reverse-mode automatic differentiation in real-time." },
  { name: "Regex Automata Visualizer", path: "/pages/ai-features/regex-automata-visualizer/regex-automata-visualizer.html", category: "Systems & Compilers", icon: "fa-circle-nodes", desc: "Compile regular expressions into NFA state machines and visualize string matching." },
  { name: "HNSW Vector DB Visualizer", path: "/pages/ai-features/hnsw-visualizer/hnsw-visualizer.html", category: "Systems & Compilers", icon: "fa-sitemap", desc: "Visualize Hierarchical Navigable Small World graphs for approximate nearest neighbor search." },
  { name: "In-Memory Git Visualizer", path: "/pages/ai-features/git-visualizer/git-visualizer.html", category: "Systems & Compilers", icon: "fa-code-branch", desc: "Experiment with commits, branches, merge, and rollback — all in-browser with a visual DAG." },

  // ── Code Quality ──
  { name: "Big-O AST Linter", path: "/pages/ai-features/Big-O-AST-Linter/Big-O-AST-Linter.html", category: "Code Quality", icon: "fa-microscope", desc: "Parse JavaScript into an AST and mathematically deduce Big-O time and space complexity." },
  { name: "AST Refactoring Engine", path: "/pages/ai-features/ast-refactor-engine/ast-refactor-engine.html", category: "Code Quality", icon: "fa-wrench", desc: "Visualize AST transformations and witness animated code refactoring from O(2^N) to O(N)." },
  { name: "Property-Based Fuzz Tester", path: "/pages/ai-features/fuzz-engine/fuzz-engine.html", category: "Code Quality", icon: "fa-shield-alt", desc: "Stress test your algorithms with randomized property-based fuzzing and crash detection." },
  { name: "AI Bug Injector", path: "/pages/tools/ai-bug-injector/ai-bug-injector.html", category: "Code Quality", icon: "fa-bug", desc: "Inject realistic bugs into your code to practice debugging under pressure." },
  { name: "Time-Travel Debugger", path: "/pages/ai-features/time-travel/time-travel.html", category: "Code Quality", icon: "fa-history", desc: "Step backward and forward through code execution with memory heap snapshots." },

  // ── Crypto & Security ──
  { name: "Wasm Execution Engine", path: "/pages/ai-features/wasm-execution/wasm-execution.html", category: "Crypto & Security", icon: "fa-code", desc: "Client-side code execution using WebAssembly (Pyodide) — zero data sent to servers." },
  { name: "Emotion-Aware Workspace", path: "/pages/ai-features/emotion-engine/emotion-engine.html", category: "Crypto & Security", icon: "fa-heart", desc: "Coding environment that detects frustration and offers adaptive hints and difficulty adjustments." },
  { name: "Huffman Compression Engine", path: "/pages/ai-features/huffman-engine/huffman-engine.html", category: "Crypto & Security", icon: "fa-compress-arrows-alt", desc: "Visualize Huffman coding, build prefix trees, and compress data in real-time." },
  { name: "Algorithm Evolution Simulator", path: "/pages/ai-features/algorithm-evolution/algorithm-evolution.html", category: "Crypto & Security", icon: "fa-dna", desc: "Watch algorithms evolve across generations to achieve optimal time complexity." },

  // ── Data & Visualization ──
  { name: "Wasm SQL Query Visualizer", path: "/pages/ai-features/wasm-sql-visualizer/wasm-sql-visualizer.html", category: "Data & Visualization", icon: "fa-database", desc: "Execute real SQL in the browser via WebAssembly SQLite and visualize query execution plans." },
  { name: "WebGPU BVH Raytracer", path: "/pages/ai-features/bvh-raytracer/bvh-raytracer.html", category: "Data & Visualization", icon: "fa-camera", desc: "High-performance ray tracing using Bounding Volume Hierarchy acceleration in WebGPU." },
  { name: "Algorithm Racing", path: "/pages/ai-features/algorithm-racing/algorithm-racing.html", category: "Data & Visualization", icon: "fa-flag-checkered", desc: "Compete head-to-head in real-time P2P algorithm races against other learners." },
];

/* ─── Categories ─── */
const categories = [
  "All", "Learning Assistants", "Analysis & Profiling", "Simulations",
  "Creative Tools", "Future Self", "Advanced Tech", "Systems & Compilers",
  "Code Quality", "Crypto & Security", "Data & Visualization"
];

/* ─── Category pastel colors (distinct subtle palette) ─── */
const categoryColors = {
  "learning-assistants": "#d4c4e8",
  "analysis-profiling": "#e8d4b8",
  "simulations": "#b8d8e8",
  "creative-tools": "#f5d0d8",
  "future-self": "#a8d4b8",
  "advanced-tech": "#e8c4b0",
  "systems-compilers": "#88bcd8",
  "code-quality": "#d8b0bc",
  "crypto-security": "#c4c4dc",
  "data-visualization": "#a8d8c0",
};

/* ─── DOM refs ─── */
const grid = document.getElementById('aiGrid');
const searchInput = document.getElementById('aiSearchInput');
const clearBtn = document.getElementById('aiClearBtn');
const filterContainer = document.getElementById('aiFilters');
const emptyState = document.getElementById('aiEmpty');
const countDisplay = document.getElementById('aiCountDisplay');

let activeCategory = new URLSearchParams(window.location.search).get('category')
  || localStorage.getItem('aiFilterCategory')
  || 'all';
let searchQuery = '';
const pageReferrer = document.referrer;

/* ─── Build filter chips ─── */
function buildFilters() {
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ai-filter-chip' + (cat === 'All' ? ' active' : '');
    btn.dataset.category = cat === 'All' ? 'all' : cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', cat === 'All' ? 'true' : 'false');
    btn.textContent = cat + (cat !== 'All' ? ` (${aiTools.filter(v => v.category === cat).length})` : '');
    btn.addEventListener('click', () => {
      filterContainer.querySelectorAll('.ai-filter-chip').forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeCategory = btn.dataset.category;
      localStorage.setItem('aiFilterCategory', activeCategory);
      const url = new URL(window.location);
      if (activeCategory === 'all') {
        url.searchParams.delete('category');
      } else {
        url.searchParams.set('category', activeCategory);
      }
      history.pushState({}, '', url);
      render();
    });
    filterContainer.appendChild(btn);
  });
}

/* ─── Render cards ─── */
function render() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const filtered = aiTools.filter(v => {
    const matchCategory = activeCategory === 'all' ||
      v.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      v.name.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q) ||
      v.desc.toLowerCase().includes(q);
    return matchCategory && matchSearch;
  });

  countDisplay.textContent = filtered.length;

  if (filtered.length === 0) {
    grid.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  grid.innerHTML = filtered.map((v, i) => {
    const catKey = v.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `
    <a href="${v.path}" class="ai-card" role="listitem" data-category="${catKey}" style="animation-delay:${reducedMotion ? '0s' : Math.min(i * 0.025, 0.8)}s">
      <span class="ai-card-icon" style="color:${categoryColors[catKey] || 'var(--ai-primary)'}"><i class="fas ${v.icon}"></i></span>
      <span class="ai-card-title">${escHtml(v.name)}</span>
      <span class="ai-card-desc">${escHtml(v.desc)}</span>
      <div class="ai-card-footer">
        <span class="ai-card-category">${escHtml(v.category)}</span>
        <span class="ai-card-arrow"><i class="fas fa-arrow-right"></i></span>
      </div>
    </a>`;
  }).join('');
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/* ─── Search ─── */
searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value;
  clearBtn.classList.toggle('visible', searchQuery.length > 0);
  render();
});

clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  clearBtn.classList.remove('visible');
  render();
  searchInput.focus();
});

/* ─── Keyword shortcut: ⌘K / Ctrl+K ─── */
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    searchInput.focus();
  }
  if (e.key === 'Escape') {
    searchInput.blur();
  }
});

/* ─── Back button ─── */
document.getElementById('aiBackBtn')?.addEventListener('click', () => {
  localStorage.removeItem('aiFilterCategory');
  let sameOrigin = false;
  try {
    sameOrigin = pageReferrer && new URL(pageReferrer).origin === window.location.origin;
  } catch (e) {}
  if (sameOrigin) {
    window.location.href = pageReferrer;
  } else if (window.history.length > 1) {
    history.back();
  } else {
    location.href = '/';
  }
});



/* ─── Init ─── */
buildFilters();

/* Restore active chip from URL */
function syncChipFromURL() {
  filterContainer.querySelectorAll('.ai-filter-chip').forEach(c => {
    const isActive = c.dataset.category === activeCategory;
    c.classList.toggle('active', isActive);
    c.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}
syncChipFromURL();
render();

/* Handle browser back/forward */
window.addEventListener('popstate', () => {
  activeCategory = new URLSearchParams(window.location.search).get('category')
    || localStorage.getItem('aiFilterCategory')
    || 'all';
  syncChipFromURL();
  render();
});
