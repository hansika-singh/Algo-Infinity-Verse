/* ============================================
   INTERVIEW PREP — Data, Search & Filter
   ============================================ */

const interviewTools = [
  // ── Practice & Mock ──
  { name: "Mock Interview Simulator", path: "/pages/interview/mock-interview-simulator/mock-interview-simulator.html", category: "Practice & Mock", icon: "fa-microphone", desc: "Simulate real technical interviews with timed coding challenges and AI feedback." },
  { name: "Interview Panic Mode", path: "/pages/interview/interview-panic-mode/interview-panic-mode.html", category: "Practice & Mock", icon: "fa-bolt", desc: "Rapid-fire revision mode for last-minute interview cramming under pressure." },
  { name: "System Design Simulator", path: "/pages/interview/system-design-simulator/system-design-simulator.html", category: "Practice & Mock", icon: "fa-sitemap", desc: "Practice system design interviews with structured prompts and evaluation rubrics." },

  // ── Behavioral ──
  { name: "Behavioral Questions", path: "/pages/interview/behavioral-questions/behavioral-questions.html", category: "Behavioral", icon: "fa-comments", desc: "Practice behavioral interviews with STAR method guidance and sample answers." },
  { name: "Behavioral Interview Prep", path: "/pages/interview/behavioral-questions-new/behavioral-questions-new.html", category: "Behavioral", icon: "fa-address-card", desc: "Comprehensive behavioral interview preparation with AI-powered feedback." },

  // ── Collaborative Coding ──
  { name: "P2P Workspace", path: "/pages/interview/p2p-workspace/p2p-workspace.html", category: "Collaborative Coding", icon: "fa-users", desc: "Peer-to-peer collaborative coding workspace for pair programming practice." },
  { name: "Multiplayer Workspace", path: "/pages/interview/multiplayer-workspace/multiplayer-workspace.html", category: "Collaborative Coding", icon: "fa-user-group", desc: "Multiplayer coding environment with shared editor, whiteboard, and voice." },
  { name: "CRDT Whiteboard", path: "/pages/interview/CRDT-Whiteboard.js/CRDT-Whiteboard.html", category: "Collaborative Coding", icon: "fa-chalkboard", desc: "Conflict-free replicated data type whiteboard for real-time collaboration." },
  { name: "Voice Interview", path: "/pages/interview/voice-interview/voice-interview.html", category: "Collaborative Coding", icon: "fa-headset", desc: "AI-powered voice interview practice with natural language conversations." },

  // ── Tracking & Analytics ──
  { name: "Interview Experiences", path: "/pages/interview/interview-experience/interview-experience.html", category: "Tracking & Analytics", icon: "fa-book-open", desc: "Read and share real interview experiences from top tech companies." },
  { name: "Interview Heatmap", path: "/pages/interview/interview-heatmap/interview-heatmap.html", category: "Tracking & Analytics", icon: "fa-fire", desc: "Track your interview preparation activity and identify focus areas." },
  { name: "Interview Mistakes", path: "/pages/interview/interview-mistakes/interview-mistakes.html", category: "Tracking & Analytics", icon: "fa-exclamation-triangle", desc: "Learn from common coding interview mistakes with detailed explanations." },
  { name: "Company Questions", path: "/pages/interview/company-interview/company-interview.html", category: "Tracking & Analytics", icon: "fa-building", desc: "Browse company-specific interview questions from FAANG and top tech firms." },

  // ── Special Tools ──
  { name: "Reverse Interview Mode", path: "/pages/interview/reverse-interview/reverse-interview.html", category: "Special Tools", icon: "fa-rotate-left", desc: "Code first, then let AI generate interview questions based on your solution." },
  { name: "DSA Cheat Sheets", path: "/pages/resources/cheat-sheets/cheat-sheets.html", category: "Special Tools", icon: "fa-file-lines", desc: "Quick reference sheets covering all essential DSA concepts and patterns." },
  { name: "DSA Battle Mode", path: "/pages/Dsa-Battle/dsa-battle-mode.html", category: "Special Tools", icon: "fa-gamepad", desc: "Compete in real-time DSA coding battles against other learners." },
  { name: "Revision Sheet", path: "/pages/interview/revision-sheet.html", category: "Special Tools", icon: "fa-clipboard-list", desc: "Generate a personalized revision sheet based on your learning progress." },

  // ── Resume & Career ──
  { name: "Job Prep Hub", path: "/pages/career/job-preparation-hub/job-preparation-hub.html", category: "Resume & Career", icon: "fa-briefcase", desc: "Centralized hub for resume prep, aptitude practice, and career resources." },
  { name: "Coding Resume", path: "/pages/career/resume/resume.html", category: "Resume & Career", icon: "fa-file-alt", desc: "Visualize your progress, DSA mastery, and accomplishments in a resume layout." },
  { name: "Resume Tips", path: "/pages/career/resume-tips/resume-tips.html", category: "Resume & Career", icon: "fa-lightbulb", desc: "Learn resume structure, ATS-friendly formatting, and project presentation tips." },
];

/* ─── Categories ─── */
const categories = [
  "All", "Practice & Mock", "Behavioral", "Collaborative Coding",
  "Tracking & Analytics", "Special Tools", "Resume & Career"
];

/* ─── Category pastel icon colors ─── */
const categoryColors = {
  "practice-mock": "#bae1ff",
  "behavioral": "#ffd4ba",
  "collaborative-coding": "#baffc9",
  "tracking-analytics": "#d4baff",
  "special-tools": "#ffb3ba",
  "resume-career": "#baf2ff",
};

/* ─── DOM refs ─── */
const grid = document.getElementById('ivGrid');
const searchInput = document.getElementById('ivSearchInput');
const clearBtn = document.getElementById('ivClearBtn');
const filterContainer = document.getElementById('ivFilters');
const emptyState = document.getElementById('ivEmpty');
const countDisplay = document.getElementById('ivCountDisplay');

let activeCategory = new URLSearchParams(window.location.search).get('category')
  || localStorage.getItem('ivFilterCategory')
  || 'all';
let searchQuery = '';
const pageReferrer = document.referrer;

/* ─── Build filter chips ─── */
function buildFilters() {
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'iv-filter-chip' + (cat === 'All' ? ' active' : '');
    btn.dataset.category = cat === 'All' ? 'all' : cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', cat === 'All' ? 'true' : 'false');
    btn.textContent = cat + (cat !== 'All' ? ` (${interviewTools.filter(v => v.category === cat).length})` : '');
    btn.addEventListener('click', () => {
      filterContainer.querySelectorAll('.iv-filter-chip').forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeCategory = btn.dataset.category;
      localStorage.setItem('ivFilterCategory', activeCategory);
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
  const filtered = interviewTools.filter(v => {
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
    <a href="${v.path}" class="iv-card" role="listitem" data-category="${catKey}" style="animation-delay:${reducedMotion ? '0s' : Math.min(i * 0.025, 0.8)}s">
      <span class="iv-card-icon" style="color:${categoryColors[catKey] || 'var(--iv-primary)'}"><i class="fas ${v.icon}"></i></span>
      <span class="iv-card-title">${escHtml(v.name)}</span>
      <span class="iv-card-desc">${escHtml(v.desc)}</span>
      <div class="iv-card-footer">
        <span class="iv-card-category">${escHtml(v.category)}</span>
        <span class="iv-card-arrow"><i class="fas fa-arrow-right"></i></span>
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
  const card = e.target.closest('.iv-card');
  if (card && card.href) {
    sessionStorage.setItem('_ivSkipLoading', '1');
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
document.getElementById('ivBackBtn')?.addEventListener('click', () => {
  localStorage.removeItem('ivFilterCategory');
  if (pageReferrer && new URL(pageReferrer).origin === window.location.origin) {
    window.location.href = pageReferrer;
  } else if (window.history.length > 1) {
    history.back();
  } else {
    location.href = '/';
  }
});

/* ─── Letter Lift: three-state wave follows cursor ─── */
/* States: NORMAL (page load / after mouse leaves), DIM (far from cursor while hovering),
   BRIGHT (near cursor while hovering) */

function initTitleLetterAnimation() {
  const title = document.querySelector('.iv-hero-title');
  if (!title) return;
  const text = title.textContent.trim();
  title.innerHTML = text.split('').map((char) => {
    if (char === ' ') return `<span class="iv-title-space"> </span>`;
    return `<span class="iv-title-letter">${char}</span>`;
  }).join('');

  const letters = [...title.querySelectorAll('.iv-title-letter')];
  if (letters.length === 0) return;

  const THRESHOLD = 4;
  let rafId = null;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Three state helpers ── */

  /* BRIGHT — near cursor, lifted with glow */
  function brightLetter(letter, delay) {
    letter.style.setProperty('transition-delay', `${delay}ms`);
    letter.style.setProperty('transform', 'translateY(-10px)');
    letter.style.setProperty('text-shadow',
      '0 10px 20px rgba(255, 255, 255, 0.20), 0 0 40px rgba(6, 182, 212, 0.10)');
    letter.style.setProperty('color', '#ffffff');
  }

  /* DIM — far from cursor, faded back */
  function dimLetter(letter) {
    letter.style.removeProperty('transition-delay');
    letter.style.removeProperty('transform');
    letter.style.removeProperty('text-shadow');
    letter.style.setProperty('color', 'rgba(226, 232, 240, 0.25)');
  }

  /* NORMAL — resting state, readable but not bright */
  function normalLetter(letter) {
    letter.style.removeProperty('transition-delay');
    letter.style.removeProperty('transform');
    letter.style.removeProperty('text-shadow');
    letter.style.setProperty('color', '#e2e8f0');
  }

  /* Set initial state to NORMAL */
  letters.forEach(normalLetter);

  /* ── mousemove: brighten near cursor, dim far away ── */
  function onMove(e) {
    if (rafId || reducedMotion) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;

      const rect = title.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;

      let centerIdx = 0;
      let minDist = Infinity;
      letters.forEach((letter, i) => {
        const lRect = letter.getBoundingClientRect();
        const center = lRect.left - rect.left + lRect.width / 2;
        const d = Math.abs(mouseX - center);
        if (d < minDist) { minDist = d; centerIdx = i; }
      });

      letters.forEach((letter, i) => {
        const dist = Math.abs(i - centerIdx);
        if (dist <= THRESHOLD) {
          brightLetter(letter, dist * 30);
        } else {
          dimLetter(letter);
        }
      });
    });
  }

  /* ── mouseleave: return all to NORMAL ── */
  function onLeave() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    letters.forEach(normalLetter);
  }

  title.addEventListener('mousemove', onMove);
  title.addEventListener('mouseleave', onLeave);
}

/* ─── Init ─── */
buildFilters();
initTitleLetterAnimation();

/* Restore active chip from URL */
function syncChipFromURL() {
  filterContainer.querySelectorAll('.iv-filter-chip').forEach(c => {
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
    || localStorage.getItem('ivFilterCategory')
    || 'all';
  syncChipFromURL();
  render();
});
