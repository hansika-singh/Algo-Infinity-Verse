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
  {
    id: 'bootstrap',
    name: 'Bootstrap Academy',
    path: '/pages/bootstrap-learning/bootstrap-learning.html',
    category: 'Frontend',
    icon: 'fa-brands fa-bootstrap',
    difficulty: 'Beginner',
    desc: 'Build responsive, mobile-first sites quickly with Bootstrap\'s grid system and components.',
  },
  {
    id: 'mui',
    name: 'Material UI Academy',
    path: '/pages/mui-learning/mui-learning.html',
    category: 'Frontend',
    icon: 'mui',
    difficulty: 'Intermediate',
    desc: 'Create polished React apps with Material Design components, theming, and customization.',
  },

  // ── Backend ──
  {
    id: 'rust',
    name: 'Rust Academy',
    path: '/pages/rust-academy/rust-academy.html',
    category: 'Backend',
    icon: 'rust',
    difficulty: 'Intermediate',
    desc: 'Master systems programming with Rust — ownership, lifetimes, concurrency, and memory-safe performance.',
  },
  {
    id: 'go',
    name: 'Go Academy',
    path: '/pages/go-academy/go-academy.html',
    category: 'Backend',
    icon: 'go',
    difficulty: 'Intermediate',
    desc: 'Master Go (Golang) for building fast, concurrent backend services — goroutines, channels, interfaces, and idiomatic Go patterns.',
  },
  {
    id: 'typescript',
    name: 'TypeScript Academy',
    path: '/pages/typescript-academy/typescript-academy.html',
    category: 'Backend',
    icon: 'typescript',
    difficulty: 'Intermediate',
    desc: 'Learn TypeScript from basics to advanced — static typing, interfaces, generics, and modern patterns for building scalable apps.',
  },
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
  {
    id: 'fastapi',
    name: 'FastAPI Academy',
    path: '/pages/fastapi-learning/fastapi-learning.html',
    category: 'Backend',
    icon: 'fastapi',
    difficulty: 'Intermediate',
    desc: 'Build high-performance Python APIs with FastAPI, async support, and automatic docs.',
  },
  {
    id: 'nodejs',
    name: 'Node.js Academy',
    path: '/pages/nodejs-learning/nodejs-learning.html',
    category: 'Backend',
    icon: 'fa-brands fa-node-js',
    difficulty: 'Beginner',
    desc: 'Learn server-side JavaScript with Node.js, event-driven architecture, and npm ecosystem.',
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
  {
    id: 'postgresql',
    name: 'PostgreSQL Academy',
    path: '/pages/postgresql-learning/postgresql-learning.html',
    category: 'Databases',
    icon: 'postgresql',
    difficulty: 'Intermediate',
    desc: 'Master PostgreSQL for relational databases, advanced queries, indexing, and data integrity.',
  },
  {
    id: 'redis',
    name: 'Redis Academy',
    path: '/pages/redis-academy/redis-academy.html',
    category: 'Databases',
    icon: 'fa-solid fa-database',
    difficulty: 'Intermediate',
    desc: 'Master Redis for in-memory caching, pub/sub messaging, sorted sets, and high-performance data structures.',
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
  { label: 'Frontend', key: 'frontend', count: 8 },
  { label: 'Backend', key: 'backend', count: 10 },
  { label: 'Cloud & DevOps', key: 'cloud-devops', count: 2 },
  { label: 'Databases', key: 'databases', count: 6 },
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
  fastapi:
    'M12.023 0L2.93 4.394v8.789l9.093 4.394 9.093-4.394V4.394zm0 10.556L4.325 6.64v4.393l7.698 3.916 7.698-3.916V6.64zm0 7.832l-7.698-3.917v4.394l7.698 3.916 7.698-3.916v-4.394z',
  mui:
    'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  typescript:
    'M316.939 407.424v50.061c8.138 4.172 17.763 7.3 28.875 9.386s22.823 3.129 35.135 3.129c11.999 0 23.397-1.147 34.196-3.442 10.799-2.294 20.268-6.075 28.406-11.342 8.138-5.266 14.581-12.15 19.328-20.65s7.121-19.007 7.121-31.522c0-9.074-1.356-17.026-4.069-23.857s-6.625-12.906-11.738-18.225c-5.112-5.319-11.242-10.091-18.389-14.315s-15.207-8.213-24.18-11.967c-6.573-2.712-12.468-5.345-17.685-7.9-5.217-2.556-9.651-5.163-13.303-7.822-3.652-2.66-6.469-5.476-8.451-8.448-1.982-2.973-2.974-6.336-2.974-10.091 0-3.441.887-6.544 2.661-9.308s4.278-5.136 7.512-7.118c3.235-1.981 7.199-3.52 11.894-4.615 4.696-1.095 9.912-1.642 15.651-1.642 4.173 0 8.581.313 13.224.938 4.643.626 9.312 1.591 14.008 2.894 4.695 1.304 9.259 2.947 13.694 4.928 4.434 1.982 8.529 4.276 12.285 6.884v-46.776c-7.616-2.92-15.937-5.084-24.962-6.492s-19.381-2.112-31.066-2.112c-11.895 0-23.163 1.278-33.805 3.833s-20.006 6.544-28.093 11.967c-8.086 5.424-14.476 12.333-19.171 20.729-4.695 8.395-7.043 18.433-7.043 30.114 0 14.914 4.304 27.638 12.912 38.172 8.607 10.533 21.675 19.45 39.204 26.751 6.886 2.816 13.303 5.579 19.25 8.291s11.086 5.528 15.415 8.448c4.33 2.92 7.747 6.101 10.252 9.543 2.504 3.441 3.756 7.352 3.756 11.733 0 3.233-.783 6.231-2.348 8.995s-3.939 5.162-7.121 7.196-7.147 3.624-11.894 4.771c-4.748 1.148-10.303 1.721-16.668 1.721-10.851 0-21.597-1.903-32.24-5.71-10.642-3.806-20.502-9.516-29.579-17.13zM232.78 284.082h64.22v-41.082h-179v41.082h63.906v182.918h50.874z',
  postgresql:
    'M23.5594 14.7228a.5269.5269 0 0 0-.0563-.1191c-.139-.2632-.4768-.3418-1.0074-.2321-1.6533.3411-2.2935.1312-2.5256-.0191 1.342-2.0482 2.445-4.522 3.0411-6.8297.2714-1.0507.7982-3.5237.1222-4.7316a1.5641 1.5641 0 0 0-.1509-.235C21.6931.9086 19.8007.0248 17.5099.0005c-1.4947-.0158-2.7705.3461-3.1161.4794a9.449 9.449 0 0 0-.5159-.0816 8.044 8.044 0 0 0-1.3114-.1278c-1.1822-.0184-2.2038.2642-3.0498.8406-.8573-.3211-4.7888-1.645-7.2219.0788C.9359 2.1526.3086 3.8733.4302 6.3043c.0409.818.5069 3.334 1.2423 5.7436.4598 1.5065.9387 2.7019 1.4334 3.582.553.9942 1.1259 1.5933 1.7143 1.7895.4474.1491 1.1327.1441 1.8581-.7279.8012-.9635 1.5903-1.8258 1.9446-2.2069.4351.2355.9064.3625 1.39.3772a.0569.0569 0 0 0 .0004.0041 11.0312 11.0312 0 0 0-.2472.3054c-.3389.4302-.4094.5197-1.5002.7443-.3102.064-1.1344.2339-1.1464.8115-.0025.1224.0329.2309.0919.3268.2269.4231.9216.6097 1.015.6331 1.3345.3335 2.5044.092 3.3714-.6787-.017 2.231.0775 4.4174.3454 5.0874.2212.5529.7618 1.9045 2.4692 1.9043.2505 0 .5263-.0291.8296-.0941 1.7819-.3821 2.5557-1.1696 2.855-2.9059.1503-.8707.4016-2.8753.5388-4.1012.0169-.0703.0357-.1207.057-.1362.0007-.0005.0697-.0471.4272.0307a.3673.3673 0 0 0 .0443.0068l.2539.0223.0149.001c.8468.0384 1.9114-.1426 2.5312-.4308.6438-.2988 1.8057-1.0323 1.5951-1.6698z',
  rust:
    '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><text x="12" y="16" text-anchor="middle" font-size="14" font-weight="bold" fill="currentColor" font-family="system-ui, sans-serif">R</text>',
  go:
    '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><text x="12" y="16" text-anchor="middle" font-size="14" font-weight="bold" fill="currentColor" font-family="system-ui, sans-serif">Go</text>',
};

const iconViewBox = {
  typescript: '0 0 512 512',
  rust: '0 0 24 24',
  go: '0 0 24 24'
};

function iconHtml(icon) {
  if (svgIcons[icon]) {
    const vb = iconViewBox[icon] || '0 0 24 24';
    const content = svgIcons[icon];
    if (content.startsWith('<')) {
      return '<svg viewBox="' + vb + '" fill="currentColor" width="1em" height="1em">' + content + '</svg>';
    }
    return (
      '<svg viewBox="' + vb + '" fill="currentColor" width="1em" height="1em"><path d="' +
      content +
      '"/></svg>'
    );
  }
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
    { name: 'Bootstrap', cat: 'frontend' },
    { name: 'Material UI', cat: 'frontend' },
    { name: 'Next.js', cat: 'frontend' },
    { name: 'Angular', cat: 'frontend' },
    { name: 'React', cat: 'frontend' },
    { name: 'Svelte', cat: 'frontend' },
    { name: 'Vue.js', cat: 'frontend' },
    { name: 'Tailwind', cat: 'frontend' },
    { name: 'FastAPI', cat: 'backend' },
    { name: 'Node.js', cat: 'backend' },
    { name: 'TypeScript', cat: 'backend' },
    { name: 'Express', cat: 'backend' },
    { name: 'NestJS', cat: 'backend' },
    { name: 'Firebase', cat: 'backend' },
    { name: 'Supabase', cat: 'backend' },
    { name: 'Kafka', cat: 'backend' },
    { name: 'Rust', cat: 'backend' },
    { name: 'Go', cat: 'backend' },
    { name: 'AWS', cat: 'cloud-devops' },
    { name: 'Docker & K8s', cat: 'cloud-devops' },
    { name: 'PostgreSQL', cat: 'databases' },
    { name: 'MongoDB', cat: 'databases' },
    { name: 'Elasticsearch', cat: 'databases' },
    { name: 'Neo4j', cat: 'databases' },
    { name: 'SQLite', cat: 'databases' },
    { name: 'Redis', cat: 'databases' },
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
