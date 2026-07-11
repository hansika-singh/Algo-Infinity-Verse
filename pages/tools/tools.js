/* ============================================
   DSA PRACTICE TOOLS — Data, Search & Filter
   ============================================ */

const practiceTools = [
  // ── Analysis ──
  { name: "Complexity Analyzer", path: "/pages/tools/complexity-analyzer/complexity-analyzer.html", category: "Analysis", icon: "fa-chart-line", desc: "Analyze time and space complexity of your algorithms with detailed breakdowns and Big-O notation." },
  { name: "Complexity Calculator", path: "/pages/tools/complexity-calculator/complexity-calculator.html", category: "Analysis", icon: "fa-calculator", desc: "Calculate and visualize the computational complexity of your code snippets in real time." },
  { name: "Complexity Comparator", path: "/pages/tools/complexity-comparator/complexity-comparator.html", category: "Analysis", icon: "fa-scale-balanced", desc: "Compare the time and space complexity of multiple algorithms side by side." },
  { name: "Reverse Complexity", path: "/pages/tools/reverse-complexity/reverse-complexity.html", category: "Analysis", icon: "fa-arrow-right-arrow-left", desc: "Given a target complexity, reverse-engineer what kind of algorithm would achieve it." },
  { name: "Cognitive Load Analyzer", path: "/pages/tools/cognitive-load-analyzer/cognitive-load-analyzer.html", category: "Analysis", icon: "fa-brain", desc: "Analyze your coding patterns to measure cognitive load and identify areas for improvement." },

  // ── Practice Aids ──
  { name: "Problem Solving Framework", path: "/pages/tools/problem-solving-framework/problem-solving-framework.html", category: "Practice Aids", icon: "fa-sitemap", desc: "Structured framework to break down problems: understand, brute force, optimize, code, test." },
  { name: "Think-Aloud AI Judge", path: "/pages/tools/think-aloud-judge/think-aloud-judge.html", category: "Practice Aids", icon: "fa-ear-listen", desc: "Verbally explain your thought process while coding and get AI feedback on your reasoning." },
  { name: "Pattern Recognition Trainer", path: "/pages/tools/pattern-trainer/pattern-trainer.html", category: "Practice Aids", icon: "fa-puzzle-piece", desc: "Train your ability to recognize common DSA problem patterns with interactive challenges." },
  { name: "Edge Case Generator", path: "/pages/tools/edge-case-generator/edge-case-generator.html", category: "Practice Aids", icon: "fa-shield-halved", desc: "Generate tricky edge cases for your solutions to ensure robust problem coverage." },
  { name: "Algorithm Decision Tree", path: "/pages/tools/algorithm-decision-tree/algorithm-decision-tree.html", category: "Practice Aids", icon: "fa-diagram-project", desc: "Interactive decision tree to help you pick the right algorithm for any problem." },
  { name: "Algorithm Personality", path: "/pages/tools/algorithm-personality/algorithm-personality.html", category: "Practice Aids", icon: "fa-face-smile", desc: "Discover which algorithm matches your coding personality through a fun assessment quiz." },
  { name: "Problem Deconstructor", path: "/pages/tools/problem-deconstructor/problem-deconstructor.html", category: "Practice Aids", icon: "fa-cubes", desc: "Deconstruct complex problems into sub-problems and identify reusable solution templates." },

  // ── Learning Tools ──
  { name: "Spaced Repetition Queue", path: "/pages/tools/spaced-repetition/review-queue.html", category: "Learning Tools", icon: "fa-rotate", desc: "Optimized review queue using SM-2 spaced repetition to maximize long-term retention." },
  { name: "AI Memory Scanner", path: "/pages/tools/memory-scanner/memory-scanner.html", category: "Learning Tools", icon: "fa-magnifying-glass", desc: "Scan your memory gaps and get personalized recommendations for topics to revisit." },
  { name: "My Notes & Mnemonics", path: "/pages/tools/my-notes/my-notes.html", category: "Learning Tools", icon: "fa-note-sticky", desc: "Create, organize, and review personal notes and mnemonics for DSA concepts." },
  { name: "Wrong Turn Replay", path: "/pages/tools/wrong-turn-replay/wrong-turn-replay.html", category: "Learning Tools", icon: "fa-rotate-left", desc: "Replay your incorrect solution attempts to understand where you went wrong." },
  { name: "Algorithm Graveyard", path: "/pages/tools/algorithm-graveyard/algorithm-graveyard.html", category: "Learning Tools", icon: "fa-skull", desc: "Explore deprecated algorithms, their fatal flaws, and their modern replacements." },
  { name: "Algorithm Mythology", path: "/pages/tools/algorithm-mythology/algorithm-mythology.html", category: "Learning Tools", icon: "fa-book", desc: "Discover the stories, folklore, and historical context behind famous algorithms." },
  { name: "Cross Topic Trainer", path: "/pages/tools/cross-topic-trainer/cross-topic-trainer.html", category: "Learning Tools", icon: "fa-shuffle", desc: "Explore connections between different DSA topics to build a holistic understanding." },

  // ── Debugging ──
  { name: "Dry Run Simulator", path: "/pages/tools/dry-run-simulator/dry-run-simulator.html", category: "Debugging", icon: "fa-play", desc: "Step through your code execution line by line to trace variables and find bugs." },
  { name: "Solution Evolution", path: "/pages/tools/solution-evolution/solution-evolution.html", category: "Debugging", icon: "fa-code-branch", desc: "Visualize how brute-force solutions evolve into optimized ones through iterative refinement." },
  { name: "Algorithm Crime Lab", path: "/pages/tools/investigation-lab/investigation-lab.html", category: "Debugging", icon: "fa-flask", desc: "Investigate algorithmic failures and bugs in a forensic-style debugging environment." },
  { name: "DSA Detective Mode", path: "/pages/tools/dsa-detective/dsa-detective.html", category: "Debugging", icon: "fa-gun", desc: "Guess the correct algorithm from clues in a detective-style interactive challenge." },

  // ── Dashboards ──
  { name: "Personal Analytics Dashboard", path: "/pages/tools/personal-analytics-dashboard/personal-analytics-dashboard.html", category: "Dashboards", icon: "fa-chart-pie", desc: "Track your DSA practice metrics: problems solved, accuracy trends, and time spent." },
  { name: "Learning Insights Dashboard", path: "/pages/tools/learning-insights-dashboard/learning-insights-dashboard.html", category: "Dashboards", icon: "fa-lightbulb", desc: "Actionable insights on your learning patterns, strengths, and areas needing focus." },
  { name: "Weakness Dashboard", path: "/pages/tools/topic-weakness-dashboard/topic-weakness-dashboard.html", category: "Dashboards", icon: "fa-triangle-exclamation", desc: "Identify your weakest DSA topics with detailed performance breakdowns and recommendations." },
  { name: "Personalized Learning Path", path: "/pages/tools/personalized-learning-path/personalized-learning-path.html", category: "Dashboards", icon: "fa-route", desc: "Generate a custom learning path based on your current skill level and target goals." },

  // ── Simulators ──
  { name: "Algorithm Arena", path: "/pages/tools/algorithm-arena/algorithm-arena.html", category: "Simulators", icon: "fa-gamepad", desc: "Pit algorithms against each other in head-to-head performance battles." },
  { name: "Memory Leak Simulator", path: "/pages/tools/memory-leak-simulator/memory-leak-simulator.html", category: "Simulators", icon: "fa-memory", desc: "Simulate memory leaks to understand how improper management impacts performance." },
  { name: "Git Simulator", path: "/pages/tools/git-simulator/git-simulator.html", category: "Simulators", icon: "fa-code-fork", desc: "Interactive Git simulation to master branching, merging, and version control workflows." },
  { name: "AI Bug Injector", path: "/pages/tools/ai-bug-injector/ai-bug-injector.html", category: "Simulators", icon: "fa-bug", desc: "Inject realistic bugs into your code and practice debugging under pressure." },
  { name: "Contest Hub", path: "/pages/tools/contest/contest.html", category: "Simulators", icon: "fa-trophy", desc: "Join timed coding contests to compete, track rankings, and sharpen problem-solving speed." },
  { name: "Interview Panic Mode", path: "/pages/tools/interview-panic-mode/interview-panic-mode.html", category: "Simulators", icon: "fa-bolt", desc: "Rapid-fire revision mode simulating last-minute interview pressure and time constraints." },

  // ── Other ──
  { name: "Comparison Tool", path: "/pages/tools/compare/compare.html", category: "Other", icon: "fa-not-equal", desc: "Compare two code snippets or algorithms to highlight differences in approach and performance." },
  { name: "AST Code Formatter", path: "/pages/tools/ast-formatter/ast-formatter.html", category: "Other", icon: "fa-code", desc: "Format and transform code using AST-based analysis with customizable formatting rules." },
  { name: "Spatial Complexity Profiler", path: "/pages/tools/spatial-profiler/spatial-profiler.html", category: "Other", icon: "fa-cube", desc: "Profile the memory and spatial complexity of your data structures and algorithms." },
  { name: "Algorithms in Real Apps", path: "/pages/tools/everyday-apps/everyday-apps.html", category: "Other", icon: "fa-mobile-screen", desc: "See how DSA concepts power real-world applications like search, maps, and social media." },
  { name: "Compiler Explorer", path: "/pages/tools/compiler-explorer/compiler-explorer.html", category: "Other", icon: "fa-microchip", desc: "Explore how different compilers translate your code into assembly and machine instructions." },
  { name: "LeetCode Sync", path: "/pages/tools/leetcode/leetcode.html", category: "Other", icon: "fa-cloud-arrow-up", desc: "Sync your LeetCode submissions and track your progress across platforms." },
  { name: "Assessments", path: "/pages/tools/quiz-system/quiz-system.html", category: "Other", icon: "fa-clipboard-question", desc: "Take structured assessments to evaluate your DSA knowledge and track improvement over time." },
];

/* ─── Categories ─── */
const categories = [
  "All", "Analysis", "Practice Aids", "Learning Tools",
  "Debugging", "Dashboards", "Simulators", "Other"
];

/* ─── Category pastel colors ─── */
const categoryColors = {
  "analysis": "#bae6fd",
  "practice-aids": "#fed7aa",
  "learning-tools": "#a7f3d0",
  "debugging": "#fecaca",
  "dashboards": "#fecdd3",
  "simulators": "#fde68a",
  "other": "#bfdbfe",
};

/* ─── DOM refs ─── */
const grid = document.getElementById('tlGrid');
const searchInput = document.getElementById('tlSearchInput');
const clearBtn = document.getElementById('tlClearBtn');
const filterContainer = document.getElementById('tlFilters');
const emptyState = document.getElementById('tlEmpty');
const countDisplay = document.getElementById('tlCountDisplay');

let activeCategory = new URLSearchParams(window.location.search).get('category')
  || localStorage.getItem('tlFilterCategory')
  || 'all';
let searchQuery = '';
const pageReferrer = document.referrer;

/* ─── Build filter chips ─── */
function buildFilters() {
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tl-filter-chip' + (cat === 'All' ? ' active' : '');
    btn.dataset.category = cat === 'All' ? 'all' : cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', cat === 'All' ? 'true' : 'false');
    btn.textContent = cat + (cat !== 'All' ? ` (${practiceTools.filter(v => v.category === cat).length})` : '');
    btn.addEventListener('click', () => {
      filterContainer.querySelectorAll('.tl-filter-chip').forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeCategory = btn.dataset.category;
      localStorage.setItem('tlFilterCategory', activeCategory);
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
  const filtered = practiceTools.filter(v => {
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
    <a href="${v.path}" class="tl-card" role="listitem" data-category="${catKey}" style="animation-delay:${reducedMotion ? '0s' : Math.min(i * 0.025, 0.8)}s">
      <span class="tl-card-icon" style="color:${categoryColors[catKey] || 'var(--tl-primary)'}"><i class="fas ${v.icon}"></i></span>
      <span class="tl-card-title">${escHtml(v.name)}</span>
      <span class="tl-card-desc">${escHtml(v.desc)}</span>
      <div class="tl-card-footer">
        <span class="tl-card-category">${escHtml(v.category)}</span>
        <span class="tl-card-arrow"><i class="fas fa-arrow-right"></i></span>
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

/* ─── Card click: set skip-loading flag before navigating ─── */
grid.addEventListener('click', (e) => {
  const card = e.target.closest('.tl-card');
  if (card && card.href) {
    sessionStorage.setItem('_tlSkipLoading', '1');
  }
});

/* ─── Keyboard shortcut: ⌘K / Ctrl+K ─── */
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
document.getElementById('tlBackBtn')?.addEventListener('click', () => {
  localStorage.removeItem('tlFilterCategory');
  if (pageReferrer && new URL(pageReferrer).origin === window.location.origin) {
    window.location.href = pageReferrer;
  } else if (window.history.length > 1) {
    history.back();
  } else {
    location.href = '/';
  }
});

/* ─── Sorting Reveal: bubble-sort the scrambled title letters ─── */

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* Derangement for {char, origIdx} items — ensure no item stays at its original index */
function derangeItems(arr) {
  let attempts = 0;
  do {
    shuffleArray(arr);
    attempts++;
  } while (arr.some((item, i) => item.origIdx === i) && attempts < 100);
  return arr;
}

function initSortingReveal() {
  const title = document.querySelector('.tl-hero-title');
  if (!title) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const text = title.textContent.trim();
  const chars = text.split('');

  /* Split into letter spans */
  title.innerHTML = chars.map((char) => {
    if (char === ' ') return `<span class="tl-title-space"> </span>`;
    return `<span class="tl-title-letter">${char}</span>`;
  }).join('');

  const letterSpans = [...title.querySelectorAll('.tl-title-letter')];
  const n = letterSpans.length;
  if (n < 2) return;

  if (reducedMotion) return;

  /* ── Build position-tracked items ──
     Each item knows its character AND its original index.
     The sort compares by originalIndex, so the phrase reassembles.
  */
  const items = letterSpans.map((span, idx) => ({
    char: span.textContent,
    origIdx: idx
  }));

  /* Scramble the items (avoid any landing in original position) */
  let scrambled = derangeItems([...items]);

  /* Apply scrambled chars to the spans */
  scrambled.forEach((item, i) => { letterSpans[i].textContent = item.char; });

  /* ─── Kick off the async sort animation ─── */
  (async () => {
    await sleep(100);

    /* Bubble sort by original index — phrase reassembles */
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n - 1 - i; j++) {
        const a = letterSpans[j];
        const b = letterSpans[j + 1];

        /* Lift & warm glow on compared pair */
        a.style.transition = 'transform 0.08s ease, color 0.08s ease, text-shadow 0.08s ease';
        b.style.transition = 'transform 0.08s ease, color 0.08s ease, text-shadow 0.08s ease';
        a.style.transform = 'translateY(-10px)';
        b.style.transform = 'translateY(-10px)';
        a.style.color = '#fde68a';
        b.style.color = '#fde68a';


        await sleep(15);

        if (scrambled[j].origIdx > scrambled[j + 1].origIdx) {
          /* Swap items in array */
          [scrambled[j], scrambled[j + 1]] = [scrambled[j + 1], scrambled[j]];

          /* Swap flash */
          a.style.color = '#fca5a5';
          b.style.color = '#fca5a5';
          a.style.transform = 'translateY(-10px) translateX(12px)';
          b.style.transform = 'translateY(-10px) translateX(-12px)';

          await sleep(10);

          /* Swap text content */
          a.textContent = scrambled[j].char;
          b.textContent = scrambled[j + 1].char;

          /* Reset to compare glow */
          a.style.color = '#fde68a';
          b.style.color = '#fde68a';
          a.style.transform = 'translateY(-10px)';
          b.style.transform = 'translateY(-10px)';

          await sleep(8);
        }

        /* Drop back */
        a.style.transform = '';
        b.style.transform = '';
        a.style.color = '';
        b.style.color = '';

        a.style.transition = '';
        b.style.transition = '';
      }

      /* Mark the letter that just bubbled into its correct position */
      const done = n - 1 - i;
      if (done >= 0) {
        const span = letterSpans[done];
        span.style.transition = 'color 0.25s ease, text-shadow 0.25s ease, transform 0.2s ease';
        span.style.color = '#a7f3d0';

        span.style.transform = 'translateY(-5px)';
        await sleep(20);
        span.style.transform = '';
        span.style.transition = '';
      }

      await sleep(5);
    }

    /* Ensure first element is marked */
    if (n > 0 && letterSpans[0]) {
      letterSpans[0].style.color = '#a7f3d0';
      letterSpans[0].style.transition = '';
    }

    /* ─── Celebration: quick flash ─── */
    await sleep(50);
    letterSpans.forEach((span, i) => {
      setTimeout(() => {
        span.style.transition = 'color 0.06s ease, text-shadow 0.06s ease, transform 0.08s ease';
        span.style.color = '#ffffff';

        span.style.transform = 'translateY(-3px)';
        setTimeout(() => {
          span.style.transition = 'color 0.15s ease, text-shadow 0.15s ease, transform 0.15s ease';
          span.style.color = '';

          span.style.transform = '';
        }, 60);
      }, i * 8);
    });

    /* Done — no hover animation after this */
  })();
}

/* ─── Init ─── */
buildFilters();
initSortingReveal();

/* Restore active chip from URL */
function syncChipFromURL() {
  filterContainer.querySelectorAll('.tl-filter-chip').forEach(c => {
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
    || localStorage.getItem('tlFilterCategory')
    || 'all';
  syncChipFromURL();
  render();
});
