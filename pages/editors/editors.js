/* ============================================
   CODE EDITORS — Data, Search & Filter
   ============================================ */

const editors = [
  // ── Mainstream Languages ──
  {
    name: "Python Editor",
    path: "/pages/editors/python-editor/python-editor.html",
    category: "Mainstream Languages",
    icon: "fa-python",
    desc: "Write Python code and see real-time execution output. Supports standard libraries, data structures, and algorithms."
  },
  {
    name: "Java Editor",
    path: "/pages/editors/java-editor/java-editor.html",
    category: "Mainstream Languages",
    icon: "fa-java",
    desc: "Compile and run Java code with syntax highlighting, examples, and output panels — all in your browser."
  },
  {
    name: "C++ Editor",
    path: "/pages/editors/cpp-editor/cpp-editor.html",
    category: "Mainstream Languages",
    icon: "fa-code-fork",
    desc: "Write C++ code and see real-time execution output. Supports standard libraries, OOP concepts, and more."
  },
  {
    name: "C Editor",
    path: "/pages/editors/c-editor/c-editor.html",
    category: "Mainstream Languages",
    icon: "fa-c",
    desc: "Write C code with real-time execution. Perfect for learning variables, loops, functions, and pointers."
  },
  {
    name: "JavaScript Sandbox",
    path: "/pages/editors/js-sandbox.html",
    category: "Mainstream Languages",
    icon: "fa-js",
    desc: "Run JavaScript in a sandboxed environment with sample tests, debug transcripts, and hidden test cases."
  },

  // ── Web Technologies ──
  {
    name: "HTML Editor",
    path: "/pages/editors/html-editor/html-editor.html",
    category: "Web Technologies",
    icon: "fa-html5",
    desc: "Write HTML and watch it render in real time — no server, no setup. Perfect for learning tags, forms, and layout."
  },
  {
    name: "CSS Editor",
    path: "/pages/editors/css-editor/css-editor.html",
    category: "Web Technologies",
    icon: "fa-css3-alt",
    desc: "Write CSS and watch a real HTML template restyle in real time — perfect for flexbox, grid, and animations."
  },
  {
    name: "React Playground",
    path: "/pages/editors/react-playground/react-playground.html",
    category: "Web Technologies",
    icon: "fa-react",
    desc: "Write React components with JSX, render them instantly in the preview panel. No setup, no installs."
  },

  // ── Scripting Languages ──
  {
    name: "Ruby Editor",
    path: "/pages/editors/ruby-editor/ruby-editor.html",
    category: "Scripting Languages",
    icon: "fa-gem",
    desc: "Write Ruby scripts and execute them via a real Ruby interpreter. Powered by the Piston sandboxed API."
  },
  {
    name: "PHP Editor",
    path: "/pages/editors/php-editor/php-editor.html",
    category: "Scripting Languages",
    icon: "fa-php",
    desc: "Write PHP scripts with syntax highlighting, multiple examples, and simulated console output."
  },
  {
    name: "Perl Editor",
    path: "/pages/editors/perl/perl.html",
    category: "Scripting Languages",
    icon: "fa-scroll",
    desc: "Write Perl scripts and see simulated output instantly. Supports variables, arrays, hashes, and subroutines."
  },

  // ── JVM & Functional ──
  {
    name: "Kotlin Editor",
    path: "/pages/editors/kotlin-editor/kotlin-editor.html",
    category: "JVM & Functional",
    icon: "fa-mobile-screen-button",
    desc: "Write Kotlin with a multi-file project explorer, syntax highlighting, and simulated output."
  },
  {
    name: "Scala Editor",
    path: "/pages/editors/scala-editor/scala-editor.html",
    category: "JVM & Functional",
    icon: "fa-cubes",
    desc: "Write Scala code with support for variables, functions, collections, classes, and pattern matching."
  },
  {
    name: "Haskell Editor",
    path: "/pages/editors/haskell-editor/haskell-editor.html",
    category: "JVM & Functional",
    icon: "fa-hashtag",
    desc: "Write Haskell with a file explorer, syntax highlighting, and support for recursion, modules, and ADTs."
  },

  // ── Systems & Special ──
  {
    name: "Go Editor",
    path: "/pages/editors/go-editor/go-editor.html",
    category: "Systems & Special",
    icon: "fa-golang",
    desc: "Learn Golang with a live simulated editor supporting variables, slices, functions, and more."
  },
  {
    name: "SQL Editor",
    path: "/pages/editors/sql-editor/sql-editor.html",
    category: "Systems & Special",
    icon: "fa-database",
    desc: "Write SQL queries, manage tables, and see results instantly. Supports SELECT, INSERT, UPDATE, and more."
  },
  {
    name: "Pseudo Code Editor",
    path: "/pages/editors/pseudo-code-editor/pseudo-code-editor.html",
    category: "Systems & Special",
    icon: "fa-pencil",
    desc: "Design algorithms with instant syntax highlighting, auto-indent, and real-time linting for pseudo-code."
  },
];

/* ─── Categories ─── */
const categories = [
  "All", "Mainstream Languages", "Web Technologies", "Scripting Languages",
  "JVM & Functional", "Systems & Special"
];

/* ─── Category pastel colors (distinct, visible) — keys match catKey slugs ─── */
const categoryColors = {
  "mainstream-languages": "#7bb3d4",
  "web-technologies": "#e8b890",
  "scripting-languages": "#7bc9a0",
  "jvm-functional": "#b898e0",
  "systems-special": "#d898a8",
};

/* ─── DOM refs ─── */
const grid = document.getElementById('edGrid');
const searchInput = document.getElementById('edSearchInput');
const clearBtn = document.getElementById('edClearBtn');
const filterContainer = document.getElementById('edFilters');
const emptyState = document.getElementById('edEmpty');
const countDisplay = document.getElementById('edCountDisplay');

let activeCategory = new URLSearchParams(window.location.search).get('category')
  || localStorage.getItem('edFilterCategory')
  || 'all';
let searchQuery = '';
const pageReferrer = document.referrer;

/* ─── Build filter chips ─── */
function buildFilters() {
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ed-filter-chip' + (cat === 'All' ? ' active' : '');
    btn.dataset.category = cat === 'All' ? 'all' : cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', cat === 'All' ? 'true' : 'false');
    btn.textContent = cat + (cat !== 'All' ? ` (${editors.filter(v => v.category === cat).length})` : '');
    btn.addEventListener('click', () => {
      filterContainer.querySelectorAll('.ed-filter-chip').forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeCategory = btn.dataset.category;
      localStorage.setItem('edFilterCategory', activeCategory);
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
  const filtered = editors.filter(v => {
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
    const brandIcons = new Set(['fa-python','fa-java','fa-js','fa-html5','fa-css3-alt','fa-react','fa-php','fa-golang']);
    const iconClass = brandIcons.has(v.icon) ? `fab ${v.icon}` : `fas ${v.icon}`;
    return `
    <a href="${v.path}" class="ed-card" role="listitem" data-category="${catKey}" style="animation-delay:${reducedMotion ? '0s' : Math.min(i * 0.025, 0.8)}s">
      <span class="ed-card-icon" style="color:${categoryColors[catKey] || 'var(--ed-accent)'}"><i class="${iconClass}"></i></span>
      <span class="ed-card-title">${escHtml(v.name)}</span>
      <span class="ed-card-desc">${escHtml(v.desc)}</span>
      <div class="ed-card-footer">
        <span class="ed-card-category">${escHtml(v.category)}</span>
        <span class="ed-card-arrow"><i class="fas fa-arrow-right"></i></span>
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
  const card = e.target.closest('.ed-card');
  if (card && card.href) {
    sessionStorage.setItem('_edSkipLoading', '1');
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
document.getElementById('edBackBtn')?.addEventListener('click', () => {
  localStorage.removeItem('edFilterCategory');
  if (pageReferrer && new URL(pageReferrer).origin === window.location.origin) {
    window.location.href = pageReferrer;
  } else if (window.history.length > 1) {
    history.back();
  } else {
    location.href = '/';
  }
});

/* ═══════════════════════════════════════════
   3D EXTRUDED TITLE LETTERS
   
   Each letter acts as a physical 3D object:
   - rotateX / rotateY for perspective tilt
   - Multi-layer text-shadow extruding in the
     direction OPPOSITE the cursor (simulating
     the dark 'side walls' of a 3D extrusion)
   - Color brightens near cursor (light source)
   ═══════════════════════════════════════════ */

function initTitleLetterAnimation() {
  const title = document.querySelector('.ed-hero-title');
  if (!title) return;

  const text = title.textContent.trim();
  title.innerHTML = text.split('').map((char) => {
    if (char === ' ') return `<span class="ed-title-space"> </span>`;
    return `<span class="ed-title-letter">${char}</span>`;
  }).join('');

  const letters = [...title.querySelectorAll('.ed-title-letter')];
  if (letters.length === 0) return;

  let rafId = null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prefersDark = true; // our theme is always dark bg

  /* ── Compute 3D extrusion shadows ──
     Shadows extend in the direction OPPOSITE the cursor,
     simulating the 'side walls' of a 3D extruded object.
     The cursor acts as the light source. */
  function buildExtrusionShadow(dx, dy, dist, proximity, maxDepth) {
    if (proximity < 0.01) return '';

    // Normalise direction from letter to cursor
    const angle = Math.atan2(dy, dx);
    // Extrusion shadows push AWAY from the light source (cursor)
    const shadowDirX = -Math.cos(angle);
    const shadowDirY = -Math.sin(angle);

    const depth = proximity * maxDepth;
    const layers = [];

    // 4 shadow layers: each layer steps further in the extrusion direction
    // with increasing blur and decreasing opacity
    for (let i = 1; i <= 4; i++) {
      const step = i / 4;
      const offsetX = shadowDirX * depth * step;
      const offsetY = shadowDirY * depth * step;
      const blur = step * step * 8;
      const opacity = (1 - step * 0.6) * 0.65 * proximity;
      layers.push(
        `${offsetX.toFixed(1)}px ${offsetY.toFixed(1)}px ${blur.toFixed(1)}px rgba(0, 0, 0, ${opacity.toFixed(3)})`
      );
    }

    // Add a subtle light-glow shadow on the cursor-facing side (the "lit" edge)
    const glowStrength = proximity * 0.4;
    const glowOffsetX = -shadowDirX * depth * 0.2;
    const glowOffsetY = -shadowDirY * depth * 0.2;
    layers.unshift(
      `${glowOffsetX.toFixed(1)}px ${glowOffsetY.toFixed(1)}px ${(proximity * 6).toFixed(1)}px rgba(252, 200, 208, ${(glowStrength * 0.25).toFixed(3)})`
    );

    return layers.join(', ');
  }

  /* ── Reset all to normal ──
     We use requestAnimationFrame to split two critical operations:
     1. Set the new transition inline (so browser registers it)
     2. Remove the transform/color/text-shadow (so browser animates)
     The raf boundary ensures the browser sees the transition BEFORE
     seeing the property removal — otherwise it batches both steps
     and the transition never fires. */
  function resetLetters() {
    letters.forEach((letter) => {
      letter.style.setProperty(
        'transition',
        'transform 0.06s ease-out, color 0.05s ease-out, text-shadow 0.07s ease-out'
      );
      letter.style.setProperty('transition-delay', '0ms');
    });
    /* ── Next frame: remove animated properties ── */
    requestAnimationFrame(() => {
      letters.forEach((letter) => {
        letter.style.removeProperty('transform');
        letter.style.removeProperty('color');
        letter.style.removeProperty('text-shadow');
      });
    });
  }

  letters.forEach((l) => l.style.removeProperty('color'));

  /* ── mousemove: 3D tilt + extrusion shadows ── */
  function onMove(e) {
    if (rafId || reducedMotion) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;

      const rect = title.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Overall title-plane tilt
      const overallTiltY = ((mouseX - centerX) / centerX) * 18;
      const overallTiltX = -((mouseY - centerY) / centerY) * 12;

      // Influence radius: how far the cursor affects letters
      const influenceRadius = Math.max(rect.width, rect.height) * 0.55;

      letters.forEach((letter) => {
        const lRect = letter.getBoundingClientRect();
        const letterX = lRect.left - rect.left + lRect.width / 2;
        const letterY = lRect.top - rect.top + lRect.height / 2;

        const dx = mouseX - letterX;
        const dy = mouseY - letterY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Smoothstep proximity
        const rawProx = Math.max(0, 1 - dist / influenceRadius);
        const proximity = rawProx * rawProx * (3 - 2 * rawProx);

        // Per-letter tilt (more dramatic than overall tilt)
        const letterTiltY = Math.max(-40, Math.min(40, dx * 0.25));
        const letterTiltX = Math.max(-22, Math.min(22, -dy * 0.18));

        // Blend overall tilt + per-letter tilt
        const tiltBlend = 0.35; // how much overall tilt contributes
        const rotateY = letterTiltY * (1 - tiltBlend) + overallTiltY * tiltBlend;
        const rotateX = letterTiltX * (1 - tiltBlend) + overallTiltX * tiltBlend;

        // Scale wave
        const scale = 0.82 + proximity * 0.46;

        // Color: dark slate → bright pink accent
        const baseR = 71, baseG = 85, baseB = 105;
        const accentR = 255, accentG = 215, accentB = 225;
        const r = Math.round(baseR + (accentR - baseR) * proximity);
        const g = Math.round(baseG + (accentG - baseG) * proximity);
        const b = Math.round(baseB + (accentB - baseB) * proximity);

        // 3D Extrusion shadows
        const maxExtrusionDepth = 14;
        const shadow = buildExtrusionShadow(dx, dy, dist, proximity, maxExtrusionDepth);

        // Snappy transition — delay increases with distance
        const delay = Math.min(dist * 0.12, 18);
        letter.style.setProperty(
          'transition',
          'transform 0.08s ease-out, color 0.06s ease-out, text-shadow 0.12s ease-out'
        );
        letter.style.setProperty('transition-delay', `${delay}ms`);
        letter.style.setProperty(
          'transform',
          `rotateX(${rotateX.toFixed(1)}deg) rotateY(${rotateY.toFixed(1)}deg) scale(${scale.toFixed(3)})`
        );
        letter.style.setProperty('color', `rgb(${r}, ${g}, ${b})`);
        if (shadow) {
          letter.style.setProperty('text-shadow', shadow);
        } else {
          letter.style.removeProperty('text-shadow');
        }
      });
    });
  }

  function onLeave() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    resetLetters();
  }

  title.addEventListener('mousemove', onMove);
  title.addEventListener('mouseleave', onLeave);
}

/* ═══════════════════════════════════════════
   CODE SCROLL BACKGROUND
   
   A gentle, slow-moving vertical scroll of
   syntax-highlighted code snippets from
   various languages, creating an authentic
   coding atmosphere behind the hero.
   ═══════════════════════════════════════════ */

function initCodeScrollBackground() {
  const container = document.querySelector('.ed-code-scroll');
  if (!container) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const codeSnippets = [
    { t: 'import asyncio', c: 'ed-cs-comment' },
    { t: 'import aiohttp', c: 'ed-cs-comment' },
    { t: '', c: '' },
    { t: 'class WebScraper:', c: 'ed-cs-keyword' },
    { t: '    def __init__(self, base_url: str, concurrency: int = 10):', c: 'ed-cs-keyword' },
    { t: '        self.base_url = base_url.rstrip("/")', c: '' },
    { t: '        self.semaphore = asyncio.Semaphore(concurrency)', c: '' },
    { t: '        self.session = None', c: '' },
    { t: '', c: '' },
    { t: '    async def fetch(self, path: str) -> dict:', c: 'ed-cs-keyword' },
    { t: '        async with self.semaphore:', c: 'ed-cs-keyword' },
    { t: '            async with self.session.get(url) as resp:', c: 'ed-cs-keyword' },
    { t: '                return await resp.json()', c: '' },
    { t: '', c: '' },
    { t: '    async def run(self, endpoints: list) -> list:', c: 'ed-cs-keyword' },
    { t: '        self.session = aiohttp.ClientSession()', c: '' },
    { t: '        tasks = [self.fetch(ep) for ep in endpoints]', c: '' },
    { t: '        results = await asyncio.gather(*tasks)', c: '' },
    { t: '        await self.session.close()', c: '' },
    { t: '        return results', c: '' },
    { t: '', c: '' },
    { t: 'function createStore(reducer, initialState) {', c: 'ed-cs-keyword' },
    { t: '    let state = initialState;', c: '' },
    { t: '    const listeners = new Set();', c: '' },
    { t: '', c: '' },
    { t: '    return {', c: '' },
    { t: '        getState() { return state; },', c: 'ed-cs-keyword' },
    { t: '        dispatch(action) {', c: 'ed-cs-keyword' },
    { t: '            state = reducer(state, action);', c: '' },
    { t: '            listeners.forEach(fn => fn());', c: '' },
    { t: '        },', c: '' },
    { t: '        subscribe(fn) {', c: 'ed-cs-keyword' },
    { t: '            listeners.add(fn);', c: '' },
    { t: '            return () => listeners.delete(fn);', c: '' },
    { t: '        },', c: '' },
    { t: '    };', c: '' },
    { t: '}', c: '' },
  ];

  function renderLines() {
    return codeSnippets.map((line) => {
      const cls = line.c ? `ed-code-scroll-line ${line.c}` : 'ed-code-scroll-line';
      return `<span class="${cls}">${escHtml(line.t) || '&nbsp;'}</span>`;
    }).join('');
  }

  const inner = document.createElement('div');
  inner.className = 'ed-code-scroll-inner';
  inner.innerHTML = renderLines() + renderLines();
  container.appendChild(inner);

  let pos = 0;
  const speed = 0.3;
  let lastTime = performance.now();
  let rafId = null;
  let copyHeight = 0;
  const linesPerCopy = codeSnippets.length;

  function animate(now) {
    const dt = now - lastTime;
    lastTime = now;

    if (copyHeight === 0) {
      copyHeight = inner.scrollHeight / 2;
    }

    pos += (speed * dt) / 16.67;

    if (pos >= copyHeight) {
      const top = Array.from(inner.children).slice(0, linesPerCopy);
      for (const el of top) inner.removeChild(el);
      inner.insertAdjacentHTML('beforeend', renderLines());
      pos -= copyHeight;
    }

    inner.style.transform = `translateY(${-pos}px)`;
    rafId = requestAnimationFrame(animate);
  }

  rafId = requestAnimationFrame(animate);

  window.addEventListener('beforeunload', () => {
    if (rafId) cancelAnimationFrame(rafId);
  });
}

/* ═══════════════════════════════════════════
   END NEW FUNCTIONS
   ═══════════════════════════════════════════ */

/* ─── Init ─── */
buildFilters();
initTitleLetterAnimation();
initCodeScrollBackground();

/* Restore active chip from URL */
function syncChipFromURL() {
  filterContainer.querySelectorAll('.ed-filter-chip').forEach(c => {
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
    || localStorage.getItem('edFilterCategory')
    || 'all';
  syncChipFromURL();
  render();
});
