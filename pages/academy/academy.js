/* ============================================
   TECHNOLOGY ACADEMIES — Data, Search & Filter
   ============================================ */

const academies = [
  // ── Frontend ──
  {
    id: 'nextjs',
    name: 'Next.js Academy',
    path: '/pages/nextjs-academy/nextjs-academy.html',
    category: 'Frontend',
    icon: 'fa-solid fa-n',
    difficulty: 'Intermediate',
    desc: 'Master Next.js with server components, SSR, static generation, and full-stack React frameworks.',
  },
  {
    id: 'angular',
    name: 'Angular Academy',
    path: '/pages/angular-academy/angular-academy.html',
    category: 'Frontend',
    icon: 'fa-brands fa-angular',
    difficulty: 'Intermediate',
    desc: "Build robust enterprise applications with Angular's component architecture and RxJS.",
  },
  {
    id: 'react-mastery',
    name: 'React Mastery',
    path: '/pages/react-mastery/react-mastery.html',
    category: 'Frontend',
    icon: 'fa-brands fa-react',
    difficulty: 'Intermediate',
    desc: 'Deep dive into React hooks, state management, rendering patterns, and ecosystem.',
  },
  {
    id: 'svelte',
    name: 'Svelte Learning Hub',
    path: '/pages/svelte-learning/svelte-learning.html',
    category: 'Frontend',
    icon: 'fa-solid fa-link',
    difficulty: 'Intermediate',
    desc: 'Explore the reactive compiler-based Svelte framework for building fast web apps.',
  },
  {
    id: 'vue',
    name: 'Vue.js Learning Hub',
    path: '/pages/vue-learning/vue-learning.html',
    category: 'Frontend',
    icon: 'fa-brands fa-vuejs',
    difficulty: 'Beginner',
    desc: 'Learn Vue.js from composition API to Pinia stores and Vite tooling.',
  },
  {
    id: 'tailwind',
    name: 'Tailwind CSS Academy',
    path: '/pages/tailwind-academy/tailwind-academy.html',
    category: 'Frontend',
    icon: 'tailwind',
    difficulty: 'Beginner',
    desc: 'Master utility-first CSS with Tailwind for rapid, customizable UI development.',
  },

  // ── Backend ──
  {
    id: 'express',
    name: 'Express.js Academy',
    path: '/pages/express-academy/express-academy.html',
    category: 'Backend',
    icon: 'fa-solid fa-server',
    difficulty: 'Intermediate',
    desc: 'Build RESTful APIs and backend services with Express.js and Node.js.',
  },
  {
    id: 'nestjs',
    name: 'NestJS Academy',
    path: '/pages/nestjs-academy/nestjs-academy.html',
    category: 'Backend',
    icon: 'nestjs',
    difficulty: 'Intermediate',
    desc: 'Enterprise-grade Node.js backend development with NestJS modular architecture.',
  },
  {
    id: 'firebase',
    name: 'Firebase Academy',
    path: '/pages/firebase-academy/firebase-academy.html',
    category: 'Backend',
    icon: 'fa-solid fa-fire',
    difficulty: 'Beginner',
    desc: 'Learn Firebase for auth, Firestore, cloud functions, and real-time data.',
  },
  {
    id: 'supabase',
    name: 'Supabase Academy',
    path: '/pages/supabase-academy/supabase-academy.html',
    category: 'Backend',
    icon: 'fa-solid fa-bolt',
    difficulty: 'Beginner',
    desc: 'Open-source Firebase alternative with PostgreSQL, real-time subscriptions, and auth.',
  },
  {
    id: 'kafka',
    name: 'Apache Kafka & EDA Hub',
    path: '/pages/kafka-academy/kafka-academy.html',
    category: 'Backend',
    icon: 'kafka',
    difficulty: 'Advanced',
    desc: 'Master event-driven architecture with Apache Kafka for scalable data pipelines.',
  },

  // ── Cloud & DevOps ──
  {
    id: 'aws',
    name: 'AWS Academy',
    path: '/pages/aws-academy/aws-academy.html',
    category: 'Cloud & DevOps',
    icon: 'fa-brands fa-aws',
    difficulty: 'Intermediate',
    desc: 'Explore AWS cloud services for compute, storage, databases, and serverless.',
  },
  {
    id: 'docker-k8s',
    name: 'Docker & K8s Academy',
    path: '/pages/docker-kubernetes-academy/docker-kubernetes-academy.html',
    category: 'Cloud & DevOps',
    icon: 'fa-brands fa-docker',
    difficulty: 'Intermediate',
    desc: 'Containerize apps with Docker and orchestrate at scale with Kubernetes.',
  },

  // ── Databases ──
  {
    id: 'mongodb',
    name: 'MongoDB Academy',
    path: '/pages/mongodb-academy/index.html',
    category: 'Databases',
    icon: 'fa-solid fa-leaf',
    difficulty: 'Beginner',
    desc: 'Learn MongoDB document databases, aggregation pipelines, and schema design.',
  },
  {
    id: 'elasticsearch',
    name: 'Elasticsearch Academy',
    path: '/pages/elasticsearch-academy/elasticsearch-academy.html',
    category: 'Databases',
    icon: 'elasticsearch',
    difficulty: 'Intermediate',
    desc: 'Master Elasticsearch for full-text search, analytics, and log analysis.',
  },
  {
    id: 'neo4j',
    name: 'Neo4j Academy',
    path: '/pages/neo4j-academy/neo4j-academy.html',
    category: 'Databases',
    icon: 'neo4j',
    difficulty: 'Intermediate',
    desc: 'Graph databases with Neo4j for connected data, relationships, and graph queries.',
  },
  {
    id: 'sqlite',
    name: 'SQLite Academy',
    path: '/pages/sqlite-academy/sqlite-academy.html',
    category: 'Databases',
    icon: 'fa-solid fa-feather',
    difficulty: 'Beginner',
    desc: 'Lightweight embedded SQL databases for mobile, edge, and local-first applications.',
  },

  // ── AI / Misc ──
  {
    id: 'fail-academy',
    name: 'Fail Academy',
    path: '/pages/ai-features/fail-academy/fail-academy.html',
    category: 'AI / Misc',
    icon: 'fa-solid fa-skull',
    difficulty: 'Beginner',
    desc: 'Learn from common coding mistakes, debugging strategies, and failure recovery patterns.',
  },
];

/* ─── Categories with counts ─── */
const categoryDefs = [
  { label: 'All', key: 'all', count: academies.length },
  { label: 'Frontend', key: 'frontend', count: 6 },
  { label: 'Backend', key: 'backend', count: 5 },
  { label: 'Cloud & DevOps', key: 'cloud-devops', count: 2 },
  { label: 'Databases', key: 'databases', count: 4 },
  { label: 'AI / Misc', key: 'ai-misc', count: 1 },
];

/* ─── Category pastel colors ─── */
const categoryColors = {
  frontend: '#bae6fd',
  backend: '#99f6e4',
  'cloud-devops': '#bfdbfe',
  databases: '#fed7aa',
  'ai-misc': '#fecaca',
};

/* ─── DOM refs ─── */
const grid = document.getElementById('acGrid');
const searchInput = document.getElementById('acSearchInput');
const clearBtn = document.getElementById('acClearBtn');
const filterContainer = document.getElementById('acFilters');
const emptyState = document.getElementById('acEmpty');
const countDisplay = document.getElementById('acCountDisplay');

let activeCategory =
  new URLSearchParams(window.location.search).get('category') ||
  localStorage.getItem('acFilterCategory') ||
  'all';
let searchQuery = '';
const pageReferrer = document.referrer;

/* ─── Build filter chips ─── */
function buildFilters() {
  categoryDefs.forEach((cat) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ac-filter-chip' + (cat.key === 'all' ? ' active' : '');
    btn.dataset.category = cat.key;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', cat.key === 'all' ? 'true' : 'false');
    btn.textContent = cat.label + (cat.key !== 'all' ? ` (${cat.count})` : ` (${cat.count})`);
    btn.addEventListener('click', () => {
      filterContainer.querySelectorAll('.ac-filter-chip').forEach((c) => {
        c.classList.remove('active');
        c.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeCategory = btn.dataset.category;
      localStorage.setItem('acFilterCategory', activeCategory);
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
  const filtered = academies.filter((v) => {
    const catKey = v.category
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/&-/g, '');
    const matchCategory = activeCategory === 'all' || catKey === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      v.name.toLowerCase().includes(q) ||
      v.category.toLowerCase().includes(q) ||
      v.desc.toLowerCase().includes(q) ||
      v.difficulty.toLowerCase().includes(q);
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
      const catKey = v.category
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/&-/g, '');
      const difficultyKey = v.difficulty.toLowerCase();
      return `
    <a href="${v.path}" class="ac-card" role="listitem" data-category="${catKey}" style="animation-delay:${reducedMotion ? '0s' : Math.min(i * 0.025, 0.8)}s">
      <div class="ac-card-circle" style="background:${categoryColors[catKey] || '#94a3b8'}"></div>
      <span class="ac-card-icon" style="color:${categoryColors[catKey] || 'var(--ac-primary)'}">${iconHtml(v.icon)}</span>
      <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;position:relative;z-index:1;">
        <span class="ac-card-title">${escHtml(v.name)}</span>
        <span class="ac-card-difficulty" data-level="${difficultyKey}">${escHtml(v.difficulty)}</span>
      </div>
      <span class="ac-card-desc">${escHtml(v.desc)}</span>
      <div class="ac-card-footer">
        <span class="ac-card-category">${escHtml(v.category)}</span>
        <span class="ac-card-arrow"><i class="fas fa-arrow-right"></i></span>
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

/* ─── Brand SVG icons (for brands without FA free tier icons) ─── */
const svgIcons = {
  tailwind:
    'M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.337 6.182 14.976 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C7.666 17.818 9.027 19.2 12.001 19.2c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.337 13.382 8.976 12 6.001 12z',
  kafka:
    'M20.94 17.585l-7.796-7.854 7.796-7.853-2.614-2.67-7.853 7.91-7.853-7.91-2.614 2.67 7.796 7.854-7.796 7.853 2.614 2.67 7.853-7.91 7.853 7.91z',
  supabase: 'M3.197 19.577L12 24l8.803-4.423-.88-6.162-4.422-5.31V0L3.197 4.423l2.654 11.045z',
  nestjs:
    'M17.267 3.328L12 0 6.733 3.328v17.344L12 24l5.267-3.328zM12 12.639l-3.333-2.202L12 8.235l3.333 2.202z',
  mongodb:
    'M10.871 0c-2.39 3.01-4.004 6.757-4.004 10.985 0 8.04 5.378 12.446 8.356 12.446C13.483 23.43 12 19.12 12 14.54 12 8.78 13.918 3.511 16.634 0z',
  firebase:
    'M22.58 13.78L12 24 1.42 13.78l1.64-2.73 9.4 6.25 9.4-6.25zm0-3.56L12 0 1.42 10.22l1.64 2.73 8.94-5.02 8.94 5.02z',
  elasticsearch:
    'M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm6.207 19.345l-3.324-1.922 1.66-2.875 3.323 1.92-1.66 2.877zm0-9.35l-3.324-1.919 1.662-2.878 3.324 1.921-1.662 2.876zm-8.414 4.675v.002L9.36 12l.006-.002-3.844-2.222 1.66-2.875 3.845 2.221-1.663 2.876zm-3.315 2.9l-1.661-2.877 3.324-1.92 1.662 2.878-3.325 1.919zm6.207-6.526l-3.325-1.92 1.662-2.877 3.325 1.92-1.662 2.877z',
  sqlite:
    'M10.875 0C4.872 0 0 4.872 0 10.875S4.872 21.75 10.875 21.75c5.305 0 9.715-3.793 10.706-8.813H15.06c-.843 2.23-3.033 3.812-5.594 3.812-3.303 0-5.986-2.684-5.986-5.987s2.683-5.987 5.986-5.987c2.56 0 4.752 1.581 5.594 3.812h6.521c-.991-5.02-5.4-8.813-10.706-8.813z',
  neo4j:
    'M21.56 12.06c.143-.374.568-.564.945-.423.376.14.567.564.426.944-1.39 3.738-4.99 6.323-9.1 6.323-5.385 0-9.75-4.364-9.75-9.75 0-5.27 4.195-9.563 9.43-9.742.4-.012.72.288.732.69.012.404-.29.72-.69.732-4.544.15-8.23 3.904-8.23 8.32 0 4.558 3.712 8.27 8.27 8.27 3.633 0 6.758-2.388 7.9-5.658zM14.5 9c0 1.38-1.12 2.5-2.5 2.5S9.5 10.38 9.5 9 10.62 6.5 12 6.5s2.5 1.12 2.5 2.5z',
  svelte:
    'M23.953 4.57a10 10 0 0 1-2.825.775a4.4 4.4 0 0 0-1.896-1.78a10.2 10.2 0 0 0-3.35-.851a11.1 11.1 0 0 0-3.66.082a9.6 9.6 0 0 0-3.415 1.488a8.9 8.9 0 0 0-2.6 2.656a8.5 8.5 0 0 0-1.076 3.031a9.3 9.3 0 0 0 .151 3.518a8.8 8.8 0 0 0 1.259 3.064a9.7 9.7 0 0 0 2.508 2.607a9.7 9.7 0 0 0 3.324 1.577a10.8 10.8 0 0 0 3.486.208a10.1 10.1 0 0 0 3.125-1.036V17.01l-4.48-2.613l-1.042.606a2.8 2.8 0 0 1-1.065.344a3.1 3.1 0 0 1-1.096-.065a2.6 2.6 0 0 1-1.007-.367a2.1 2.1 0 0 1-.723-1.424a2.7 2.7 0 0 1 .158-1.577a2.4 2.4 0 0 1 1.056-1.127l8.6-5.016Z',
};

function iconHtml(icon) {
  if (svgIcons[icon])
    return (
      '<svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em"><path d="' +
      svgIcons[icon] +
      '"/></svg>'
    );
  return '<i class="' + icon + '"></i>';
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
  const card = e.target.closest('.ac-card');
  if (card && card.href) {
    sessionStorage.setItem('_acSkipLoading', '1');
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
document.getElementById('acBackBtn')?.addEventListener('click', () => {
  localStorage.removeItem('acFilterCategory');
  if (pageReferrer && new URL(pageReferrer).origin === window.location.origin) {
    window.location.href = pageReferrer;
  } else if (window.history.length > 1) {
    history.back();
  } else {
    location.href = '/';
  }
});

/* ─── Flip Animation ─── */
function initFlipAnimation() {
  const flipItems = [
    { name: 'Next.js', cat: 'frontend' },
    { name: 'Angular', cat: 'frontend' },
    { name: 'React', cat: 'frontend' },
    { name: 'Svelte', cat: 'frontend' },
    { name: 'Vue.js', cat: 'frontend' },
    { name: 'Tailwind', cat: 'frontend' },
    { name: 'Express', cat: 'backend' },
    { name: 'NestJS', cat: 'backend' },
    { name: 'Firebase', cat: 'backend' },
    { name: 'Supabase', cat: 'backend' },
    { name: 'Kafka', cat: 'backend' },
    { name: 'AWS', cat: 'cloud-devops' },
    { name: 'Docker & K8s', cat: 'cloud-devops' },
    { name: 'MongoDB', cat: 'databases' },
    { name: 'Elasticsearch', cat: 'databases' },
    { name: 'Neo4j', cat: 'databases' },
    { name: 'SQLite', cat: 'databases' },
    { name: 'Fail', cat: 'ai-misc' },
  ];

  const inner = document.getElementById('acFlipInner');
  if (!inner) return;

  // Static box with sliding text inside
  inner.innerHTML =
    '<div class="ac-flip-box" id="acFlipBox"><span class="ac-flip-text" id="acFlipText">' +
    escHtml(flipItems[0].name) +
    '</span></div>';
  const box = document.getElementById('acFlipBox');
  const text = document.getElementById('acFlipText');
  box.style.background = categoryColors[flipItems[0].cat] || '#94a3b8';

  // Measure the longest text and lock the box width so it never resizes
  const longest = flipItems.reduce(function (max, item) {
    return item.name.length > max.name.length ? item : max;
  }, flipItems[0]);
  text.textContent = longest.name;
  var fixedWidth = box.offsetWidth;
  text.textContent = flipItems[0].name;
  box.style.width = fixedWidth + 'px';

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let current = 0;
  setInterval(function () {
    current = (current + 1) % flipItems.length;
    const item = flipItems[current];

    // 1. Slide current text up and out
    text.style.animation = 'acSlideOut 0.18s ease forwards';

    setTimeout(function () {
      // 2. Swap text while hidden
      text.textContent = item.name;

      // 3. Slide new text up from below into view
      text.style.animation = 'acSlideIn 0.28s ease';

      // 4. Transition background color
      box.style.background = categoryColors[item.cat] || '#94a3b8';
    }, 180);
  }, 1800);
}

/* ─── Init ─── */
buildFilters();
initFlipAnimation();

/* Restore active chip from URL */
function syncChipFromURL() {
  filterContainer.querySelectorAll('.ac-filter-chip').forEach((c) => {
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
    localStorage.getItem('acFilterCategory') ||
    'all';
  syncChipFromURL();
  render();
});
