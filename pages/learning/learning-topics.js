/* ============================================
   LEARNING TOPICS — Data, Search & Filter
   ============================================ */

const learningTopics = [
  // ── Data Structures ──
  {
    name: 'Arrays',
    path: '/pages/learning/array-learning/array-learning.html',
    category: 'Data Structures',
    icon: 'fa-layer-group',
    desc: "Contiguous memory, indexing, traversal, two-pointer techniques, and Kadane's algorithm.",
  },
  {
    name: 'Linked Lists',
    path: '/pages/learning/linkedlist-learning/linkedlist-learning.html',
    category: 'Data Structures',
    icon: 'fa-link',
    desc: 'Singly, doubly, and circular linked lists with pointer manipulation and cycle detection.',
  },
  {
    name: 'Stacks',
    path: '/pages/learning/stack-learning/stack-learning.html',
    category: 'Data Structures',
    icon: 'fa-book',
    desc: 'LIFO data structure for expression evaluation, parentheses matching, and undo operations.',
  },
  {
    name: 'Trees',
    path: '/pages/learning/trees-learning/trees-learning.html',
    category: 'Data Structures',
    icon: 'fa-tree',
    desc: 'Binary trees, BSTs, traversals, recursion patterns, and tree-based problem solving.',
  },
  {
    name: 'Graphs',
    path: '/pages/learning/graph-learning/graph-learning.html',
    category: 'Data Structures',
    icon: 'fa-project-diagram',
    desc: 'Adjacency lists, BFS/DFS traversals, connectivity, and shortest path fundamentals.',
  },
  {
    name: 'Matrix',
    path: '/pages/learning/matrix-learning/matrix-learning.html',
    category: 'Data Structures',
    icon: 'fa-border-all',
    desc: '2D array traversal, rotations, spiral order, and flood-fill algorithms.',
  },
  {
    name: 'Heaps',
    path: '/pages/learning/heaps-learning/heaps-learning.html',
    category: 'Data Structures',
    icon: 'fa-chart-simple',
    desc: 'Heap property, heapify, priority queues, and heap sort.',
  },
  {
    name: 'Segment Tree',
    path: '/pages/learning/segment-tree-learning/segment-tree-learning.html',
    category: 'Data Structures',
    icon: 'fa-code-branch',
    desc: 'Range queries and updates with segment trees — sum, min, max, and lazy propagation.',
  },
  {
    name: 'Fenwick Tree',
    path: '/pages/learning/fenwick-tree-learning/fenwick-tree-learning.html',
    category: 'Data Structures',
    icon: 'fa-chart-line',
    desc: 'Binary Indexed Tree for efficient prefix sums and point updates.',
  },
  {
    name: 'Sparse Table',
    path: '/pages/learning/sparse-table-learning/sparse-table-learning.html',
    category: 'Data Structures',
    icon: 'fa-table',
    desc: 'Range minimum query with O(1) lookups using sparse table precomputation.',
  },
  {
    name: 'Trie & Strings',
    path: '/pages/learning/trie-string-learning/trie-string-learning.html',
    category: 'Data Structures',
    icon: 'fa-language',
    desc: 'Prefix trees for autocomplete, spell check, and pattern matching.',
  },

  // ── Core Algorithms ──
  {
    name: 'Binary Search',
    path: '/pages/learning/binary-search/binary-search.html',
    category: 'Core Algorithms',
    icon: 'fa-crosshairs',
    desc: 'Divide and conquer search on sorted arrays with O(log n) complexity.',
  },
  {
    name: 'Two Pointers',
    path: '/pages/learning/two-pointers-learning/two-pointers-learning.html',
    category: 'Core Algorithms',
    icon: 'fa-arrows-left-right',
    desc: 'Linear scanning with two pointers for pair sums, partitioning, and merging.',
  },
  {
    name: 'Sliding Window',
    path: '/pages/learning/sliding-window-learning/sliding-window-learning.html',
    category: 'Core Algorithms',
    icon: 'fa-window-maximize',
    desc: 'Efficient subarray/substring processing with a dynamically sized window.',
  },
  {
    name: 'Prefix Sum',
    path: '/pages/learning/prefix-sum-learning/prefix-sum-learning.html',
    category: 'Core Algorithms',
    icon: 'fa-calculator',
    desc: 'Range sum queries using cumulative prefix arrays and difference arrays.',
  },
  {
    name: 'Recursion',
    path: '/pages/learning/recursion-learning/recursion-learning.html',
    category: 'Core Algorithms',
    icon: 'fa-rotate',
    desc: 'Base cases, call stacks, and recursive problem-solving patterns.',
  },
  {
    name: 'Backtracking',
    path: '/pages/learning/backtracking-learning/backtracking-learning.html',
    category: 'Core Algorithms',
    icon: 'fa-undo',
    desc: 'Systematic trial-and-error for constraint satisfaction and combinatorial search.',
  },
  {
    name: 'Divide & Conquer',
    path: '/pages/learning/divide-and-conquer-learning/divide-and-conquer-learning.html',
    category: 'Core Algorithms',
    icon: 'fa-sitemap',
    desc: 'Breaking problems into subproblems — merge sort, quick sort, and beyond.',
  },
  {
    name: 'Greedy',
    path: '/pages/learning/greedy-algorithms-learning/greedy-algorithms.html',
    category: 'Core Algorithms',
    icon: 'fa-bolt',
    desc: 'Locally optimal choices that lead to globally optimal solutions.',
  },
  {
    name: 'Bit Manipulation',
    path: '/pages/learning/bit-manipulation-learning/bit-manipulation-learning.html',
    category: 'Core Algorithms',
    icon: 'fa-microchip',
    desc: 'Bitwise operations, masks, XOR tricks, and space-efficient techniques.',
  },

  // ── Advanced Algorithms ──
  {
    name: 'Dynamic Programming',
    path: '/pages/learning/dp-learning/dp-learning.html',
    category: 'Advanced Algorithms',
    icon: 'fa-bullseye',
    desc: 'Memoization, tabulation, optimal substructure, and classic DP patterns.',
  },
  {
    name: 'Bitmask DP',
    path: '/pages/learning/bitmask-dp-learning/bitmask-dp-learning.html',
    category: 'Advanced Algorithms',
    icon: 'fa-mask',
    desc: 'State representation with bitmasks for traveling salesman and subset problems.',
  },
  {
    name: 'Shortest Path',
    path: '/pages/learning/shortest-path-learning/shortest-path-learning.html',
    category: 'Advanced Algorithms',
    icon: 'fa-route',
    desc: 'Dijkstra, Bellman-Ford, Floyd-Warshall, and shortest path in weighted graphs.',
  },
  {
    name: 'MST',
    path: '/pages/learning/mst-learning/mst-learning.html',
    category: 'Advanced Algorithms',
    icon: 'fa-tree',
    desc: "Minimum Spanning Tree with Kruskal's and Prim's algorithms.",
  },
  {
    name: 'Number Theory',
    path: '/pages/learning/number-theory-learning/number-theory-learning.html',
    category: 'Advanced Algorithms',
    icon: 'fa-sigma',
    desc: "GCD, modular arithmetic, prime sieves, combinatorics, and Euler's theorem.",
  },
  {
    name: 'CP Patterns',
    path: '/pages/learning/cp-patterns-learning/cp-patterns-learning.html',
    category: 'Advanced Algorithms',
    icon: 'fa-trophy',
    desc: 'Competitive programming patterns and optimization techniques for contests.',
  },

  // ── Special ──
  {
    name: 'Algorithm Universe',
    path: '/pages/learning/algorithm-universe/algorithm-universe.html',
    category: 'Special',
    icon: 'fa-globe',
    desc: 'Explore the full landscape of algorithms from sorting to quantum computing.',
  },
  {
    name: 'Algorithm Genetics Lab',
    path: '/pages/learning/algorithm-genetics-lab/algorithm-genetics-lab.html',
    category: 'Special',
    icon: 'fa-dna',
    desc: 'Evolve algorithms using genetic programming and crossover techniques.',
  },
  {
    name: 'DSA Adventure',
    path: '/pages/learning/dsa-adventure/dsa-adventure.html',
    category: 'Special',
    icon: 'fa-compass',
    desc: 'Learn DSA through an interactive story-driven journey with quests and challenges.',
  },
  {
    name: 'Learning Mirror',
    path: '/pages/learning/Learning%20Mirror/learning-mirror.html',
    category: 'Special',
    icon: 'fa-arrows-rotate',
    desc: 'Personalized learning reflection tool to identify gaps and reinforce concepts.',
  },
  {
    name: 'Real World DSA',
    path: '/pages/learning/real-world-dsa/real-world-dsa.html',
    category: 'Special',
    icon: 'fa-building',
    desc: 'See how data structures and algorithms apply to real-world systems and products.',
  },
  {
    name: 'DSA Glossary',
    path: '/pages/dsa-glossary/dsa-glossary.html',
    category: 'Special',
    icon: 'fa-book',
    desc: 'Comprehensive glossary of DSA terminology, definitions, and quick references.',
  },
  {
    name: 'Algorithm Cemetery',
    path: '/pages/learning/algorithm-cemetery/algorithm-cemetery.html',
    category: 'Special',
    icon: 'fa-skull',
    desc: "Explore obsolete, retired, and historically significant algorithms from computing's past.",
  },
];

/* ─── Categories ─── */
const categories = ['All', 'Data Structures', 'Core Algorithms', 'Advanced Algorithms', 'Special'];

/* ─── Category icon colors ─── */
const categoryColors = {
  'data-structures': '#6ee7b7',
  'core-algorithms': '#7dd3fc',
  'advanced-algorithms': '#c084fc',
  special: '#fbbf24',
};

/* ─── Category slug display names for cards ─── */
const categoryDisplayNames = {
  'data-structures': 'Data Structures',
  'core-algorithms': 'Core Algorithms',
  'advanced-algorithms': 'Advanced',
  special: 'Special',
};

/* ─── DOM refs ─── */
const grid = document.getElementById('ltGrid');
const searchInput = document.getElementById('ltSearchInput');
const clearBtn = document.getElementById('ltClearBtn');
const filterContainer = document.getElementById('ltFilters');
const emptyState = document.getElementById('ltEmpty');
const countDisplay = document.getElementById('ltCountDisplay');

let activeCategory =
  new URLSearchParams(window.location.search).get('category') ||
  localStorage.getItem('ltFilterCategory') ||
  'all';
let searchQuery = '';
const pageReferrer = document.referrer;

/* ─── Build filter chips ─── */
function buildFilters() {
  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lt-filter-chip' + (cat === 'All' ? ' active' : '');
    btn.dataset.category = cat === 'All' ? 'all' : cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', cat === 'All' ? 'true' : 'false');
    btn.textContent =
      cat + (cat !== 'All' ? ` (${learningTopics.filter((v) => v.category === cat).length})` : '');
    btn.addEventListener('click', () => {
      filterContainer.querySelectorAll('.lt-filter-chip').forEach((c) => {
        c.classList.remove('active');
        c.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeCategory = btn.dataset.category;
      localStorage.setItem('ltFilterCategory', activeCategory);
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
  const filtered = learningTopics.filter((v) => {
    const matchCategory =
      activeCategory === 'all' ||
      v.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
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
  grid.innerHTML = filtered
    .map((v, i) => {
      const catKey = v.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const displayCat = categoryDisplayNames[catKey] || v.category;
      return `
    <a href="${v.path}" class="lt-card" role="listitem" data-category="${catKey}" style="animation-delay:0s">
      <span class="lt-card-icon" style="color:${categoryColors[catKey] || 'var(--lt-primary)'}"><i class="fas ${v.icon}"></i></span>
      <span class="lt-card-title">${escHtml(v.name)}</span>
      <span class="lt-card-desc">${escHtml(v.desc)}</span>
      <div class="lt-card-footer">
        <span class="lt-card-category">${escHtml(displayCat)}</span>
        <span class="lt-card-arrow"><i class="fas fa-arrow-right"></i></span>
      </div>
    </a>`;
    })
    .join('');
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
  const card = e.target.closest('.lt-card');
  if (card && card.href) {
    sessionStorage.setItem('_ltSkipLoading', '1');
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
document.getElementById('ltBackBtn')?.addEventListener('click', () => {
  localStorage.removeItem('ltFilterCategory');
  if (pageReferrer && new URL(pageReferrer).origin === window.location.origin) {
    window.location.href = pageReferrer;
  } else if (window.history.length > 1) {
    history.back();
  } else {
    location.href = '/';
  }
});

/* ─── Heading Glitch Animation (Canvas-Based Pixelation) ─── */

function initTitleGlitch() {
  const title = document.querySelector('.lt-hero-title');
  if (!title) return;

  const text = title.textContent.trim();
  title.innerHTML = text
    .split('')
    .map((char) => {
      if (char === ' ') return `<span class="lt-title-space"> </span>`;
      return `<span class="lt-title-letter" data-char="${escHtml(char)}">${escHtml(char)}</span>`;
    })
    .join('');

  const letters = [...title.querySelectorAll('.lt-title-letter')];
  if (letters.length === 0) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  const pixelIntervals = new Map();

  /* ── Setup canvas overlay for a single letter ── */
  function setupLetterCanvas(letter) {
    if (letter._canvasReady) return;

    const rect = letter.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) {
      /* Try again on next frame */
      requestAnimationFrame(() => setupLetterCanvas(letter));
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const cssW = Math.ceil(rect.width);
    const cssH = Math.ceil(rect.height);
    const w = Math.ceil(cssW * dpr);
    const h = Math.ceil(cssH * dpr);

    const canvas = document.createElement('canvas');
    canvas.className = 'lt-letter-canvas';
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    /* Fill with parent background so canvas fully covers DOM text underneath */
    const bgColor =
      window.getComputedStyle(letter.parentElement).backgroundColor ||
      window.getComputedStyle(letter).backgroundColor ||
      '#080c14';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);

    /* Match the letter's exact font, scaling size by DPR for canvas coords */
    const style = window.getComputedStyle(letter);
    const fontSizeVal = parseFloat(style.fontSize);
    ctx.font = `${style.fontWeight} ${fontSizeVal * dpr}px ${style.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = style.color;

    /* Draw text at canvas internal coordinates (w×h) */
    ctx.fillText(letter.dataset.char, w / 2, h / 2);

    /* Store original pixels for re-pixelation */
    const origData = ctx.getImageData(0, 0, w, h);

    letter.appendChild(canvas);
    letter._canvas = canvas;
    letter._ctx = ctx;
    letter._origData = origData;
    letter._origColor = style.color;
    letter._dpr = dpr;
    letter._canvasReady = true;
  }

  /* ── White color for the pixelation glitch effect ── */
  const GLITCH_COLOR = '#ffffff';

  /* ── Redraw letter canvas in a given color & return ImageData ── */
  function redrawLetterInColor(letter, color) {
    const canvas = letter._canvas;
    const ctx = letter._ctx;
    const dpr = letter._dpr;
    if (!canvas || !ctx || !dpr) return null;

    const w = canvas.width;
    const h = canvas.height;

    /* Fill background to match the page */
    const bgColor =
      window.getComputedStyle(letter.parentElement).backgroundColor ||
      window.getComputedStyle(letter).backgroundColor ||
      '#080c14';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, w, h);

    /* Match letter font exactly */
    const style = window.getComputedStyle(letter);
    const fontSizeVal = parseFloat(style.fontSize);
    ctx.font = `${style.fontWeight} ${fontSizeVal * dpr}px ${style.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = color;
    ctx.fillText(letter.dataset.char, w / 2, h / 2);

    return ctx.getImageData(0, 0, w, h);
  }

  /* ── Genuine pixelation: average colors in blocks ── */
  function pixelateImageData(imageData, blockSize) {
    const { data, width, height } = imageData;
    const out = new ImageData(new Uint8ClampedArray(data), width, height);

    for (let y = 0; y < height; y += blockSize) {
      for (let x = 0; x < width; x += blockSize) {
        let r = 0,
          g = 0,
          b = 0,
          a = 0,
          count = 0;

        const maxY = Math.min(y + blockSize, height);
        const maxX = Math.min(x + blockSize, width);

        for (let dy = y; dy < maxY; dy++) {
          for (let dx = x; dx < maxX; dx++) {
            const idx = (dy * width + dx) * 4;
            r += data[idx];
            g += data[idx + 1];
            b += data[idx + 2];
            a += data[idx + 3];
            count++;
          }
        }

        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);
        a = Math.round(a / count);

        for (let dy = y; dy < maxY; dy++) {
          for (let dx = x; dx < maxX; dx++) {
            const idx = (dy * width + dx) * 4;
            out.data[idx] = r;
            out.data[idx + 1] = g;
            out.data[idx + 2] = b;
            out.data[idx + 3] = a;
          }
        }
      }
    }

    return out;
  }

  /* ── Start pixelating a letter on an interval ── */
  function startPixelate(letter) {
    if (pixelIntervals.has(letter)) return;

    /* Ensure canvas is ready */
    if (!letter._canvasReady) {
      setupLetterCanvas(letter);
      /* Wait and retry if not ready */
      if (!letter._canvasReady) {
        requestAnimationFrame(() => {
          if (!pixelIntervals.has(letter)) startPixelate(letter);
        });
        return;
      }
    }

    letter.classList.add('lt-glitching');

    /* ── Switch canvas to white for glitch effect ── */
    const limeData = redrawLetterInColor(letter, GLITCH_COLOR);
    const activeData = limeData || letter._origData;

    let glitchCount = 0;
    const interval = setInterval(() => {
      const canvas = letter._canvas;
      const ctx = letter._ctx;
      if (!canvas || !ctx) return;

      glitchCount++;

      /* Vary block size for organic feel: 4–14px in canvas pixels */
      const blockSize = 4 + Math.floor(Math.random() * 10);

      /* Sometimes add horizontal block tearing */
      if (glitchCount % 4 === 0) {
        /* Restore lime base first, then apply pixelation */
        const pixelated = pixelateImageData(activeData, blockSize);
        ctx.putImageData(pixelated, 0, 0);

        /* Shift a horizontal strip */
        const dpr = letter._dpr;
        const h = canvas.height;
        const w = canvas.width;
        const stripY = Math.floor(Math.random() * Math.max(1, h - 10 * dpr));
        const stripH = Math.ceil((8 + Math.random() * 10) * dpr);
        const shiftX = Math.floor((Math.random() * 8 - 4) * dpr);

        try {
          const stripData = ctx.getImageData(0, stripY, w, stripH);
          ctx.clearRect(0, stripY, w, stripH);
          ctx.putImageData(stripData, shiftX, stripY);
        } catch (e) {
          /* bounds check */
        }
      } else {
        /* Simple pixelation */
        const pixelated = pixelateImageData(activeData, blockSize);
        ctx.putImageData(pixelated, 0, 0);
      }
    }, 60);

    pixelIntervals.set(letter, interval);
  }

  /* ── Stop pixelating and restore ── */
  function stopPixelate(letter) {
    const interval = pixelIntervals.get(letter);
    if (interval) {
      clearInterval(interval);
      pixelIntervals.delete(letter);
    }

    letter.classList.remove('lt-glitching');

    /* Restore original color rendering */
    redrawLetterInColor(letter, letter._origColor);
  }

  /* ── Cursor-follow group glitch ── */
  const GLITCH_RADIUS = 2;
  let rafId = null;
  let lastCenterIdx = -1;

  function glitchCluster(centerIdx) {
    letters.forEach((letter, i) => {
      const dist = Math.abs(i - centerIdx);
      if (dist <= GLITCH_RADIUS) {
        startPixelate(letter);
      } else {
        stopPixelate(letter);
      }
    });
  }

  function clearAllGlitches() {
    letters.forEach((l) => stopPixelate(l));
    lastCenterIdx = -1;
  }

  title.addEventListener('mousemove', (e) => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;

      const rect = title.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;

      let minDist = Infinity;
      let centerIdx = 0;
      letters.forEach((letter, i) => {
        const lRect = letter.getBoundingClientRect();
        const center = lRect.left - rect.left + lRect.width / 2;
        const d = Math.abs(mouseX - center);
        if (d < minDist) {
          minDist = d;
          centerIdx = i;
        }
      });

      if (centerIdx !== lastCenterIdx) {
        lastCenterIdx = centerIdx;
        glitchCluster(centerIdx);
      }
    });
  });

  title.addEventListener('mouseleave', () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    clearAllGlitches();
  });

  /* ── Page-load welcome wave — 3 concurrent letters ── */
  let loadIdx = 0;
  const WAVE_DURATION = 240; /* ms each letter stays glitching */
  const WAVE_STAGGER = 48; /* ms between starts (= 5 concurrent: 240/5) */

  function waveGlitch() {
    if (loadIdx >= letters.length) return;

    const idx = loadIdx;
    startPixelate(letters[idx]);

    setTimeout(() => {
      stopPixelate(letters[idx]);
    }, WAVE_DURATION);

    loadIdx++;
    setTimeout(waveGlitch, WAVE_STAGGER);
  }

  /* Setup all canvases before starting wave */
  function setupAllAndWave() {
    letters.forEach((l) => setupLetterCanvas(l));
    /* Give canvases a frame to render then start wave */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(waveGlitch, 300);
      });
    });
  }

  setupAllAndWave();
}

/* ─── Init ─── */
buildFilters();
initTitleGlitch();

/* Restore active chip from URL */
function syncChipFromURL() {
  filterContainer.querySelectorAll('.lt-filter-chip').forEach((c) => {
    const isActive = c.dataset.category === activeCategory;
    c.classList.toggle('active', isActive);
    c.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}
syncChipFromURL();
render();

/* Handle browser back/forward */
window.addEventListener('popstate', () => {
  activeCategory =
    new URLSearchParams(window.location.search).get('category') ||
    localStorage.getItem('ltFilterCategory') ||
    'all';
  syncChipFromURL();
  render();
});
