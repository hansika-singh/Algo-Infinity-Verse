/* ============================================
   LEARN CORE CS LANDING PAGE — Interactivity
   ============================================ */

(function () {
  'use strict';

  // ─── Category pastel icon colors (matching interview page style) ───
  const categoryColors = {
    databases: '#ffd4ba',
    systems: '#baffc9',
    theory: '#c9baff',
    practical: '#ffb3ba'
  };

  // ─── Subject Data ───
  const subjects = [
    {
      id: 'dbms',
      title: 'DBMS',
      desc: 'Master relational databases, SQL, normalization, transactions, ACID properties, indexing, and concurrency control.',
      icon: 'fa-database',
      category: 'databases',
      difficulty: 'intermediate',
      topics: 10,
      exercises: 10,
      link: 'dbms-learning/dbms-learning.html'
    },
    {
      id: 'os',
      title: 'Operating Systems',
      desc: 'Understand process management, CPU scheduling, memory management, deadlocks, file systems, and I/O operations.',
      icon: 'fa-server',
      category: 'systems',
      difficulty: 'intermediate',
      topics: 11,
      exercises: 11,
      link: 'os-learning/os-learning.html'
    },
    {
      id: 'computer-architecture',
      title: 'Computer Architecture',
      desc: 'Explore processor design, memory hierarchy, pipelining, cache coherence, and the fundamental building blocks of computing.',
      icon: 'fa-microchip',
      category: 'systems',
      difficulty: 'advanced',
      topics: 8,
      exercises: 8,
      link: 'computer-architecture/computer-architecture.html'
    },
    {
      id: 'oop',
      title: 'OOP',
      desc: 'Learn classes, objects, encapsulation, inheritance, polymorphism, abstraction, interfaces, and composition patterns.',
      icon: 'fa-cubes',
      category: 'theory',
      difficulty: 'beginner',
      topics: 12,
      exercises: 12,
      link: 'oop-learning/oop-learning.html'
    },
    {
      id: 'sql',
      title: 'SQL',
      desc: 'Write powerful queries using SELECT, JOINs, GROUP BY, aggregate functions, subqueries, and window functions.',
      icon: 'fa-table',
      category: 'databases',
      difficulty: 'beginner',
      topics: 11,
      exercises: 11,
      link: 'sql-learning/sql-learning.html'
    },
    {
      id: 'powerbi',
      title: 'Power BI',
      desc: 'Transform raw data into compelling visualizations, build dashboards, use DAX formulas, and share business insights.',
      icon: 'fa-chart-bar',
      category: 'practical',
      difficulty: 'intermediate',
      topics: 9,
      exercises: 9,
      link: 'powerbi-learning/powerbi-learning.html'
    },
    {
      id: 'system-design',
      title: 'System Design',
      desc: 'Design scalable distributed systems — load balancing, caching, database sharding, microservices, and CAP theorem.',
      icon: 'fa-sitemap',
      category: 'theory',
      difficulty: 'advanced',
      topics: 14,
      exercises: 7,
      link: '../resources/system-design/system-design.html'
    },
    {
      id: 'api-design',
      title: 'API Design',
      desc: 'Build RESTful and GraphQL APIs, handle authentication, versioning, rate limiting, error handling, and documentation.',
      icon: 'fa-plug',
      category: 'practical',
      difficulty: 'intermediate',
      topics: 10,
      exercises: 10,
      link: 'api-design-learning/api-design-learning.html'
    },
    {
      id: 'cache',
      title: 'Cache Systems',
      desc: 'Master caching strategies — LRU, LFU, Redis, Memcached, cache invalidation patterns, and distributed caching.',
      icon: 'fa-bolt',
      category: 'systems',
      difficulty: 'advanced',
      topics: 8,
      exercises: 8,
      link: 'cache-learning/cache-learning.html'
    }
  ];

  // ─── State ───
  let currentFilter = 'all';
  let searchQuery = '';
  let currentDifficulty = 'all';

  // ─── DOM References ───
  const grid = document.getElementById('lcsGrid');
  const empty = document.getElementById('lcsEmpty');
  const searchInput = document.getElementById('lcsSearchInput');
  const clearBtn = document.getElementById('lcsClearBtn');
  const countDisplay = document.getElementById('lcsCountDisplay');
  const resultCount = document.getElementById('lcsResultCount');
  const categoryChips = document.getElementById('lcsCategoryChips');
  const difficultyChips = document.getElementById('lcsDifficultyChips');

  // ─── Render Cards ───
  // ─── Card Cursor Glow ───
  let glowRAF = null;

  function setupCursorGlow() {
    grid.addEventListener('mousemove', (e) => {
      if (glowRAF) cancelAnimationFrame(glowRAF);
      glowRAF = requestAnimationFrame(() => {
        const card = e.target.closest('.lcs-card');
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mouse-x', `${x}%`);
        card.style.setProperty('--mouse-y', `${y}%`);
      });
    });
  }

  function renderCards(cards) {
    grid.innerHTML = '';
    if (cards.length === 0) {
      empty.style.display = 'block';
      resultCount.style.display = 'none';
      return;
    }

    empty.style.display = 'none';
    resultCount.style.display = 'block';
    countDisplay.textContent = cards.length;

    const fragment = document.createDocumentFragment();
    cards.forEach((subject, index) => {
      const card = document.createElement('a');
      card.href = subject.link;
      card.className = 'lcs-card';
      card.setAttribute('data-category', subject.category);
      card.setAttribute('data-difficulty', subject.difficulty);
      card.setAttribute('aria-label', `Learn ${subject.title}: ${subject.desc}`);
      card.style.animationDelay = `${index * 0.05}s`;

      const iconColor = categoryColors[subject.category] || 'var(--lcs-primary)';

      card.innerHTML = `
        <span class="lcs-card-icon" style="color:${iconColor}"><i class="fas ${subject.icon}"></i></span>
        <span class="lcs-card-title">${escHtml(subject.title)}</span>
        <span class="lcs-card-desc">${escHtml(subject.desc)}</span>
        <div class="lcs-card-meta">
          <span class="lcs-card-difficulty ${subject.difficulty}">${subject.difficulty}</span>
          <div class="lcs-card-stats">
            <span class="lcs-card-stat">
              <i class="fas fa-book-open"></i> ${subject.topics} topics
            </span>
            <span class="lcs-card-stat">
              <i class="fas fa-dumbbell"></i> ${subject.exercises} exercises
            </span>
          </div>
        </div>
        <div class="lcs-card-footer">
          <span class="lcs-card-category">${subject.category}</span>
          <span class="lcs-card-arrow"><i class="fas fa-arrow-right"></i></span>
        </div>
      `;

      fragment.appendChild(card);
    });

    grid.appendChild(fragment);
  }

  function escHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ─── Filter Logic ───
  function getFilteredSubjects() {
    let filtered = subjects;

    if (currentFilter !== 'all') {
      filtered = filtered.filter(s => s.category === currentFilter);
    }

    if (currentDifficulty !== 'all') {
      filtered = filtered.filter(s => s.difficulty === currentDifficulty);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.desc.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.difficulty.toLowerCase().includes(q)
      );
    }

    return filtered;
  }

  function update() {
    const filtered = getFilteredSubjects();
    renderCards(filtered);
    clearBtn.classList.toggle('visible', searchQuery.trim().length > 0);
  }

  // ─── Filter Chips Setup ───
  function createChip(f, container) {
    const chip = document.createElement('button');
    chip.className = 'lcs-filter-chip';
    chip.textContent = f.label;
    chip.setAttribute('role', 'tab');
    chip.setAttribute('aria-selected', 'false');

    if (f.attr === 'data-difficulty') {
      chip.setAttribute('data-difficulty', f.value);
    } else {
      chip.setAttribute('data-filter', f.value);
    }

    // Default active state
    const isActive = f.attr === 'data-filter'
      ? f.value === currentFilter
      : f.value === currentDifficulty;
    if (isActive) {
      chip.classList.add('active');
      chip.setAttribute('aria-selected', 'true');
    }

    chip.addEventListener('click', () => {
      const allChips = container.querySelectorAll('.lcs-filter-chip');
      allChips.forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-selected', 'false');
      });
      chip.classList.add('active');
      chip.setAttribute('aria-selected', 'true');

      if (f.attr === 'data-difficulty') {
        currentDifficulty = f.value;
        // Refresh category chips: activate "All"
        if (currentFilter !== 'all') {
          categoryChips.querySelectorAll('[data-filter]').forEach(c => {
            if (c.getAttribute('data-filter') !== 'all') {
              c.classList.remove('active');
              c.setAttribute('aria-selected', 'false');
            }
          });
          const allChip = categoryChips.querySelector('[data-filter="all"]');
          if (allChip) {
            allChip.classList.add('active');
            allChip.setAttribute('aria-selected', 'true');
          }
          currentFilter = 'all';
        }
      } else {
        currentFilter = f.value;
        // Refresh difficulty chips: deactivate all
        if (currentDifficulty !== 'all') {
          difficultyChips.querySelectorAll('[data-difficulty]').forEach(c => {
            c.classList.remove('active');
            c.setAttribute('aria-selected', 'false');
          });
          currentDifficulty = 'all';
        }
      }

      update();
    });

    container.appendChild(chip);
  }

  function setupFilters() {
    const categoryFilters = [
      { label: 'All', value: 'all', attr: 'data-filter' },
      { label: 'Databases', value: 'databases', attr: 'data-filter' },
      { label: 'Systems', value: 'systems', attr: 'data-filter' },
      { label: 'Theory', value: 'theory', attr: 'data-filter' },
      { label: 'Practical', value: 'practical', attr: 'data-filter' }
    ];

    const difficultyFilters = [
      { label: 'Beginner', value: 'beginner', attr: 'data-difficulty' },
      { label: 'Intermediate', value: 'intermediate', attr: 'data-difficulty' },
      { label: 'Advanced', value: 'advanced', attr: 'data-difficulty' }
    ];

    categoryChips.innerHTML = '';
    difficultyChips.innerHTML = '';

    categoryFilters.forEach(f => createChip(f, categoryChips));
    difficultyFilters.forEach(f => createChip(f, difficultyChips));
  }

  // ─── Search ───
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value;
    update();
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    update();
    searchInput.focus();
  });

  // Keyboard shortcut: Ctrl+K or Cmd+K to focus search
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
    }
    // Escape to clear and blur
    if (e.key === 'Escape' && document.activeElement === searchInput) {
      searchInput.value = '';
      searchQuery = '';
      update();
      searchInput.blur();
    }
  });

  // ─── Reset Button ───
  document.getElementById('lcsResetBtn').addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    currentFilter = 'all';
    currentDifficulty = 'all';

    // Reset category chips
    categoryChips.querySelectorAll('.lcs-filter-chip').forEach(c => {
      c.classList.remove('active');
      c.setAttribute('aria-selected', 'false');
    });
    const allChip = categoryChips.querySelector('[data-filter="all"]');
    if (allChip) {
      allChip.classList.add('active');
      allChip.setAttribute('aria-selected', 'true');
    }

    // Reset difficulty chips
    difficultyChips.querySelectorAll('.lcs-filter-chip').forEach(c => {
      c.classList.remove('active');
      c.setAttribute('aria-selected', 'false');
    });

    update();
    searchInput.focus();
  });

  // ─── Gooey Blob Heading Effect (no SVG filter — uses overlapping text-shadow + transforms) ───
  function setupGooeyBlob() {
    const title = document.getElementById('lcsHeroTitle');
    if (!title) return;

    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const chars = title.querySelectorAll('.lcs-title-char');
    if (chars.length === 0) return;

    let rafId = null;

    function getCharCenter(el) {
      const rect = el.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    }

    function animateBlob(mx, my) {
      const distances = Array.from(chars).map((el) => {
        const c = getCharCenter(el);
        const dx = mx - c.x;
        const dy = my - c.y;
        return { el, dist: Math.sqrt(dx * dx + dy * dy), cx: c.x, cy: c.y };
      });

      distances.sort((a, b) => a.dist - b.dist);
      const nearest = distances.slice(0, 5);

      // Reset all chars
      chars.forEach((el) => {
        el.style.transform = '';
        el.style.zIndex = '';
        el.style.color = '';
      });

      // Animate nearest
      nearest.forEach((item, idx) => {
        const closeness = 1 - (idx / 5);
        const scale = (1 + closeness * 0.8).toFixed(2);
        const pullStrength = closeness * 0.25;
        const dx = mx - item.cx;
        const dy = my - item.cy;
        const pullX = (dx * pullStrength).toFixed(1);
        const pullY = (dy * pullStrength).toFixed(1);

        item.el.style.transform = `translate(${pullX}px, ${pullY}px) scale(${scale})`;
        item.el.style.zIndex = 10 + (5 - idx);
        item.el.style.color = '#ffffff';
      });
    }

    function onMove(e) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => animateBlob(e.clientX, e.clientY));
    }

    function onTouchMove(e) {
      const touch = e.touches[0];
      if (!touch) return;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => animateBlob(touch.clientX, touch.clientY));
    }

    function onLeave() {
      if (rafId) cancelAnimationFrame(rafId);
      chars.forEach((el) => {
        el.style.transform = '';
        el.style.zIndex = '';
        el.style.color = '';
      });
    }

    title.addEventListener('mousemove', onMove);
    title.addEventListener('touchmove', onTouchMove, { passive: true });
    title.addEventListener('mouseleave', onLeave);
    title.addEventListener('touchend', onLeave);
  }

  // ─── Splash animation on page load (left-to-right wave) ───
  function playSplashAnimation() {
    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const title = document.getElementById('lcsHeroTitle');
    if (!title) return;
    const chars = title.querySelectorAll('.lcs-title-char');
    if (chars.length === 0) return;

    // Disable hover during splash to avoid style conflicts
    title.style.pointerEvents = 'none';

    let idx = 0;
    const windowSize = 5;

    function step() {
      // Reset all
      for (const el of chars) {
        el.style.transform = '';
        el.style.zIndex = '';
        el.style.color = '';
      }

      // Light up window of chars starting at idx
      for (let i = 0; i < windowSize && idx + i < chars.length; i++) {
        const el = chars[idx + i];
        const closeness = 1 - (i / windowSize);
        const scale = (1 + closeness * 0.6).toFixed(2);
        el.style.transform = `scale(${scale})`;
        el.style.zIndex = 10 + (windowSize - i);
        el.style.color = '#ffffff';
      }

      idx++;
      if (idx <= chars.length) {
        setTimeout(step, 65);
      } else {
        // Splash done — re-enable hover
        title.style.pointerEvents = '';
      }
    }

    setTimeout(step, 150);
  }

  // ─── Init ───
  function init() {
    setupFilters();
    setupCursorGlow();
    setupGooeyBlob();
    update();
    // Fire splash immediately after first paint — no extra wait
    requestAnimationFrame(playSplashAnimation);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
