/* ============================================
   PROGRAMMING LANGUAGES — Data, Search & Filter
   ============================================ */

const languages = [
  // ── General Purpose ──
  {
    name: 'Python',
    path: '/pages/learning/python-learning/python-learning.html',
    category: 'General Purpose',
    icon: 'fa-python',
    isBrandIcon: true,
    langKey: 'python',
    desc: 'Beginner-friendly, versatile, and powerful. Ideal for data science, web development, automation, and AI.',
  },
  {
    name: 'JavaScript',
    path: '/pages/learning/javascript-learning/javascript-learning.html',
    category: 'Web',
    icon: 'fa-js',
    isBrandIcon: true,
    langKey: 'javascript',
    desc: 'The universal language of the web. Run everywhere — frontend, backend, mobile, and desktop.',
  },

  // ── Enterprise ──
  {
    name: 'Java',
    path: '/pages/learning/java-learning/java-learning.html',
    category: 'Enterprise',
    icon: 'fa-java',
    isBrandIcon: true,
    langKey: 'java',
    desc: 'Object-oriented powerhouse for enterprise applications, Android development, and large-scale systems.',
  },

  // ── Systems ──
  {
    name: 'C++',
    path: '/pages/learning/cplusplus-learning/cplusplus-learning.html',
    category: 'Systems',
    icon: 'fa-code-fork',
    isBrandIcon: false,
    langKey: 'cplusplus',
    desc: 'High-performance systems programming with OOP, templates, and manual memory control.',
  },
  {
    name: 'C',
    path: '/pages/learning/c-learning/c-learning.html',
    category: 'Systems',
    icon: 'fa-c',
    isBrandIcon: true,
    langKey: 'c',
    desc: 'The foundation of modern computing. Efficient, portable, and the language that built operating systems.',
  },
  {
    name: 'Rust',
    path: '/rust-learning.html',
    category: 'Systems',
    icon: 'fa-cubes',
    isBrandIcon: false,
    langKey: 'rust',
    desc: 'Fearless concurrency, memory safety without a garbage collector, and blazingly fast performance.',
    svgIcon: `<svg viewBox="0 0 106 106" fill="currentColor" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em">
  <path d="M94 53c0-3.6-.3-7.1-.9-10.5l-10.2-.8c-1-3.4-2.4-6.6-4.1-9.5l5.5-8.5c-3.7-4.2-8-7.8-12.8-10.6l-7.9 6.4c-2.7-1.8-5.7-3.3-8.9-4.4L53 5.1c-4.5-.7-9.1-.7-13.6 0l-1.7 10.2c-3.2 1-6.1 2.5-8.8 4.2l-8-6.3c-4.8 2.8-9.2 6.4-12.9 10.6l5.7 8.6c-1.7 2.9-3 6-4 9.4L5.1 44c-.7 4.5-.7 9.1 0 13.6l9.9 1.6c.9 3.4 2.3 6.6 4 9.5l-5.6 8.6c3.7 4.2 8 7.8 12.8 10.6l8-6.4c2.7 1.8 5.7 3.3 8.9 4.4l1.7 10.1c4.5.7 9.1.7 13.6 0l1.7-10.1c3.2-1.1 6.1-2.6 8.8-4.4l8 6.4c4.8-2.8 9.1-6.4 12.8-10.6l-5.6-8.6c1.7-2.9 3.1-6.1 4-9.5l10-1.6c.6-4.5.9-9 .9-13.6z"/>
  <path d="M53 83.6c-16.9 0-30.6-13.7-30.6-30.6S36.1 22.4 53 22.4 83.6 36.1 83.6 53 69.9 83.6 53 83.6z" fill="none" stroke="currentColor" stroke-width="4"/>
  <path d="M39.8 68.5v-31h12.7c4.5 0 8 1 10.3 3.1 2.3 2.1 3.5 4.9 3.5 8.6 0 2.5-.7 4.7-2 6.5-1.3 1.8-3.2 3.1-5.6 3.9l9.3 8.9H62.5l-8.4-8.7h-5.9v8.7h-8.4zm8.4-16h3.5c2 0 3.6-.5 4.6-1.6s1.5-2.5 1.5-4.3-.5-3.2-1.5-4.2c-1-1-2.5-1.5-4.7-1.5h-3.4v11.6z"/>
</svg>`
  },

  // ── Web ──
  {
    name: 'PHP',
    path: '/pages/learning/php-learning/php-learning.html',
    category: 'Web',
    icon: 'fa-php',
    isBrandIcon: true,
    langKey: 'php',
    desc: 'Server-side scripting that powers over 75% of the web — from WordPress to Laravel.',
  },
];

/* ─── Categories ─── */
const categories = ['All', 'General Purpose', 'Systems', 'Web', 'Enterprise'];

/* ─── Language brand colors for icons ─── */
const langColors = {
  python: '#3572A5',
  javascript: '#f7df1e',
  java: '#b07219',
  cplusplus: '#f34b7d',
  c: '#888888',
  php: '#777BB4',
  rust: '#dea584',
};

/* ─── DOM refs ─── */
const grid = document.getElementById('langGrid');
const searchInput = document.getElementById('langSearchInput');
const clearBtn = document.getElementById('langClearBtn');
const filterContainer = document.getElementById('langFilters');
const emptyState = document.getElementById('langEmpty');
const countDisplay = document.getElementById('langCountDisplay');

let activeCategory = new URLSearchParams(window.location.search).get('category')
  || localStorage.getItem('langFilterCategory')
  || 'all';
let searchQuery = '';
const pageReferrer = document.referrer;

/* ─── Build filter chips ─── */
function buildFilters() {
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lang-filter-chip' + (cat === 'All' ? ' active' : '');
    btn.dataset.category = cat === 'All' ? 'all' : cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', cat === 'All' ? 'true' : 'false');
    btn.textContent = cat + (cat !== 'All' ? ` (${languages.filter(v => v.category === cat).length})` : '');
    btn.addEventListener('click', () => {
      filterContainer.querySelectorAll('.lang-filter-chip').forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeCategory = btn.dataset.category;
      localStorage.setItem('langFilterCategory', activeCategory);
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
  const filtered = languages.filter(v => {
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
    const iconColor = langColors[v.langKey] || 'var(--lang-primary)';
    let iconHtml;
    if (v.svgIcon) {
      iconHtml = v.svgIcon;
    } else {
      const iconClass = v.isBrandIcon ? `fab ${v.icon}` : `fas ${v.icon}`;
      iconHtml = `<i class="${iconClass}"></i>`;
    }
    return `
    <a href="${v.path}" class="lang-card" role="listitem" data-lang="${v.langKey}" style="--lang-card-accent:${iconColor}; animation-delay:${reducedMotion ? '0s' : Math.min(i * 0.035, 0.6)}s">
      <span class="lang-card-icon" style="color:${iconColor}">${iconHtml}</span>
      <span class="lang-card-title">${escHtml(v.name)}</span>
      <span class="lang-card-desc">${escHtml(v.desc)}</span>
      <div class="lang-card-footer">
        <span class="lang-card-category">${escHtml(v.category)}</span>
        <span class="lang-card-arrow"><i class="fas fa-arrow-right"></i></span>
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
  const card = e.target.closest('.lang-card');
  if (card && card.href) {
    sessionStorage.setItem('_langSkipLoading', '1');
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
document.getElementById('langBackBtn')?.addEventListener('click', () => {
  localStorage.removeItem('langFilterCategory');
  if (pageReferrer && new URL(pageReferrer).origin === window.location.origin) {
    window.location.href = pageReferrer;
  } else if (window.history.length > 1) {
    history.back();
  } else {
    location.href = '/';
  }
});

/* ═══════════════════════════════════════════
   TERMINAL TITLE: Typing Animation
   ═══════════════════════════════════════════ */

function initTitleTyping() {
  const textSpans = document.querySelectorAll('.lang-title-text');
  const cursor = document.querySelector('.lang-title-cursor');
  if (!textSpans.length || !cursor) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Hide cursor until typing finishes
  cursor.style.opacity = '0';

  // Get the target text from data-content attributes
  const texts = Array.from(textSpans).map(el => el.dataset.content || '');

  let currentSpan = 0;
  let charIndex = 0;

  function typeChar() {
    if (currentSpan >= textSpans.length) {
      // All done — reveal cursor
      cursor.style.opacity = '';
      return;
    }

    const span = textSpans[currentSpan];
    const text = texts[currentSpan];

    if (charIndex < text.length) {
      span.textContent += text[charIndex];
      charIndex++;
      const delay = text[charIndex - 1] === ' ' ? 40 : 25 + Math.random() * 30;
      setTimeout(typeChar, delay);
    } else {
      // Move to next line
      currentSpan++;
      charIndex = 0;
      const delay = currentSpan < textSpans.length ? 100 : 0;
      setTimeout(typeChar, delay);
    }
  }

  // Start typing after a short pause
  setTimeout(typeChar, 400);
}

/* ═══════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════ */

buildFilters();
initTitleTyping();

/* Restore active chip from URL */
function syncChipFromURL() {
  filterContainer.querySelectorAll('.lang-filter-chip').forEach(c => {
    const isActive = c.dataset.category === activeCategory;
    c.classList.toggle('active', isActive);
    c.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}
syncChipFromURL();
render();

/* Handle browser back/forward */
window.addEventListener('popstate', () => {
  activeCategory = new URLSearchParams(window.location.search).get('category') || 'all';
  syncChipFromURL();
  render();
});
