/* ============================================
   PRACTICE PROBLEMS — Data, Search, Filter & Display
   ============================================ */

/* ─── Category mapping (display → data key) ─── */

/* global getDifficultyIcon */

/* ─── Category mapping (display → data key) ─── */

const categoryDisplayToKey = {
  All: 'all',
  Arrays: 'arrays',
  Strings: 'strings',
  'Linked List': 'linkedlist',
  Trees: 'trees',
  Graphs: 'graphs',
  DP: 'dp',
};

const difficulties = ['All', 'Easy', 'Medium', 'Hard'];
const categories = Object.keys(categoryDisplayToKey);

/* ─── DOM refs ─── */
const grid = document.getElementById('ppGrid');
const searchInput = document.getElementById('ppSearchInput');
const clearBtn = document.getElementById('ppClearBtn');
const diffContainer = document.getElementById('ppDifficultyFilters');
const catContainer = document.getElementById('ppCategoryFilters');
const emptyState = document.getElementById('ppEmpty');
const countDisplay = document.getElementById('ppCountDisplay');
const totalDisplay = document.getElementById('ppTotalDisplay');
const resetEmptyBtn = document.getElementById('ppEmptyResetBtn');

/* ─── State ─── */
let activeDifficulty = 'all';
let activeCategory = 'all';
let searchQuery = '';
let surpriseProblemId = null;
const pageReferrer = document.referrer;

/* ─── Build filter chips ─── */
function buildFilters() {
  // Difficulty chips
  difficulties.forEach((d) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pp-filter-chip' + (d === 'All' ? ' active' : '');
    btn.dataset.difficulty = d === 'All' ? 'all' : d.toLowerCase();
    btn.textContent = d;
    btn.addEventListener('click', () => {
      diffContainer
        .querySelectorAll('.pp-filter-chip')
        .forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
      activeDifficulty = btn.dataset.difficulty;
      render();
    });
    diffContainer.appendChild(btn);
  });

  // Category chips
  categories.forEach((c) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pp-filter-chip' + (c === 'All' ? ' active' : '');
    btn.dataset.category = categoryDisplayToKey[c] || c.toLowerCase().replace(/\s+/g, '');
    btn.textContent = c;
    btn.addEventListener('click', () => {
      catContainer.querySelectorAll('.pp-filter-chip').forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.category;
      render();
    });
    catContainer.appendChild(btn);
  });
}

/* ─── Get problems data ─── */
function getProblems() {
  // Try window.practiceProblems first (from /data/practice-problems.js)
  if (Array.isArray(window.practiceProblems) && window.practiceProblems.length > 0) {
    return window.practiceProblems;
  }
  // Fallback: try the global variable from script.js
  if (typeof window.practiceProblems !== 'undefined' && Array.isArray(window.practiceProblems)) {
    return window.practiceProblems;
  }
  return [];
}

/* ─── Filter problems ─── */
function getFiltered() {
  const problems = getProblems();
  const q = searchQuery.toLowerCase().trim();

  return problems.filter((p) => {
    // Surprise Me isolation: only show the selected problem
    if (surpriseProblemId !== null) {
      return p.id === surpriseProblemId;
    }

    const matchDiff = activeDifficulty === 'all' || p.difficulty === activeDifficulty;
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    const matchSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      (p.tags || []).some((t) => t.toLowerCase().includes(q)) ||
      (p.description || '').toLowerCase().includes(q);

    return matchDiff && matchCat && matchSearch;
  });
}

/* ─── Render cards ─── */
function render() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const problems = getProblems();
  const allFiltered = getFiltered();

  // Update counts
  countDisplay.textContent = allFiltered.length;
  totalDisplay.textContent = `of ${problems.length}`;

  // Data not loaded yet
  if (problems.length === 0) {
    grid.innerHTML = `
      <div class="pp-data-error">
        <i class="fas fa-database"></i>
        Problem data not loaded yet. Make sure <code>data/practice-problems.js</code> is accessible.
        <br><br>
        <a href="/index.html">Go to homepage</a>
      </div>
    `;
    emptyState.style.display = 'none';
    return;
  }

  // Empty state
  if (allFiltered.length === 0) {
    grid.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  // Render all filtered cards (no pagination)
  grid.innerHTML = allFiltered
    .map((p, i) => {
      const tags = (p.tags || []).slice(0, 3);
      const extraTags = (p.tags || []).length - 3;
      const diffClass = p.difficulty.toLowerCase();

      return `
      <div class="pp-card" role="listitem" tabindex="0"
           data-id="${p.id}"
           data-difficulty="${diffClass}"
           style="animation-delay:${reducedMotion ? '0s' : Math.min(i * 0.02, 0.4)}s">
        <div class="pp-card-header">
          <span class="pp-card-title">${escHtml(p.title)}</span>
          <span class="pp-card-difficulty ${diffClass}">${escHtml(p.difficulty)}</span>
        </div>
        <span class="pp-card-desc">${escHtml(p.description || '')}</span>
        <div class="pp-card-tags">
          ${tags.map((t) => `<span class="pp-card-tag" data-category="${escHtml(p.category)}">${escHtml(t)}</span>`).join('')}
          ${extraTags > 0 ? `<span class="pp-card-tag">+${extraTags}</span>` : ''}
        </div>
        <div class="pp-card-footer">
          <span class="pp-card-acceptance">
            <i class="fas fa-arrow-up"></i> ${escHtml(p.acceptance || 'N/A')}
          </span>
          <span class="pp-card-action">
            Solve <i class="fas fa-arrow-right"></i>
          </span>
        </div>
      </div>
    `;
    })
    .join('');
}

function escHtml(str) {
  if (!str) return '';
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

/* ─── Card click: open code editor ─── */
grid.addEventListener('click', (e) => {
  const card = e.target.closest('.pp-card');
  if (!card) return;
  const id = parseInt(card.dataset.id, 10);
  const problem = getProblems().find((p) => p.id === id);
  if (problem && typeof window.openQuizEditor === 'function') {
    sessionStorage.setItem('_ppSkipLoading', '1');
    window.openQuizEditor(problem);
    // Push history state so browser back closes the modal instead of navigating away
    const modal = document.getElementById('quizEditorModal');
    if (modal && modal.classList.contains('active')) {
      history.pushState({ quizModalOpen: true }, '');
    }
  } else if (problem) {
    // Fallback: navigate to the code playground with the problem ID
    // This is a safety net — the editor module should be loaded on this page
    window.location.href = '/code-playground.html?problem=' + problem.id;
  }
});

/* ─── History API: browser back closes modal instead of leaving page ─── */
window.addEventListener('popstate', () => {
  const modal = document.getElementById('quizEditorModal');
  if (modal && modal.classList.contains('active')) {
    // Back pressed while modal is open — close it and stay on this page
    if (typeof window.closeQuizEditor === 'function') {
      window.closeQuizEditor();
    }
    // Re-push so that one more back press navigates away normally
    history.pushState({ quizModalOpen: true }, '');
  }
});

// NOTE: closeQuizEditor override is in the module script in problems.html
// (problems.js runs before editor.js loads, so any override here would be overwritten)

/* Keyboard navigation: Enter on focused card */
grid.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const card = e.target.closest('.pp-card');
    if (card) card.click();
  }
});

/* ─── Empty state reset ─── */
resetEmptyBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  clearBtn.classList.remove('visible');
  activeDifficulty = 'all';
  activeCategory = 'all';

  diffContainer.querySelectorAll('.pp-filter-chip').forEach((c) => {
    c.classList.toggle('active', c.dataset.difficulty === 'all');
  });
  catContainer.querySelectorAll('.pp-filter-chip').forEach((c) => {
    c.classList.toggle('active', c.dataset.category === 'all');
  });

  render();
  searchInput.focus();
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

/* ─── Surprise Me — Random Unsolved Problem Picker ─── */
const surpriseBtn = document.getElementById('ppSurpriseBtn');
const surpriseStatus = document.getElementById('ppSurpriseStatus');

function getLevelAppropriateDifficulties(level) {
  if (level <= 2) return ['easy'];
  if (level <= 4) return ['easy', 'medium'];
  if (level <= 6) return ['medium', 'hard'];
  return ['easy', 'medium', 'hard'];
}

function surpriseMe() {
  const userProgress = window.userProgress || {};
  const problems = getProblems();

  if (!problems.length) return;

  // Get unsolved problems
  const unsolved = problems.filter(
    (p) => !userProgress.completedProblems?.includes(p.id)
  );

  if (unsolved.length === 0) return;

  // Filter by level-appropriate difficulty
  const level = userProgress.level || 1;
  const allowed = getLevelAppropriateDifficulties(level);
  let candidates = unsolved.filter((p) => allowed.includes(p.difficulty));

  // Fallback to any unsolved if nothing matches
  if (candidates.length === 0) candidates = unsolved;

  const selected = candidates[Math.floor(Math.random() * candidates.length)];

  // Trigger button animation
  if (surpriseBtn) {
    surpriseBtn.classList.add('pp-surprise-rolling');
    surpriseBtn.querySelector('.pp-surprise-icon')?.classList.add('pp-icon-spin');
  }

  setTimeout(() => {
    // Reset animation
    if (surpriseBtn) {
      surpriseBtn.classList.remove('pp-surprise-rolling');
      surpriseBtn.querySelector('.pp-surprise-icon')?.classList.remove('pp-icon-spin');
    }

    // Isolate the selected card in the grid
    surpriseProblemId = selected.id;

    render();

    // Announce to screen readers
    if (surpriseStatus) {
      surpriseStatus.textContent = `Selected problem: ${selected.title}`;
    }

    // Scroll to the card and highlight it
    const observer = new MutationObserver(() => {
      const card = grid.querySelector(`.pp-card[data-id="${selected.id}"]`);
      if (!card) return;
      observer.disconnect();

      card.scrollIntoView({ behavior: 'smooth', block: 'center' });

      document.querySelectorAll('.pp-card.pp-surprise-highlight').forEach((c) => {
        c.classList.remove('pp-surprise-highlight');
      });
      card.classList.add('pp-surprise-highlight');

      // After highlight fades, restore the full grid
      setTimeout(() => {
        card.classList.remove('pp-surprise-highlight');
        surpriseProblemId = null;
        render();
      }, 4000);
    });

    observer.observe(grid, { childList: true, subtree: true });
    setTimeout(() => {
      observer.disconnect();
      if (surpriseProblemId !== null) {
        surpriseProblemId = null;
        render();
      }
    }, 5000);
  }, 600);
}

if (surpriseBtn) {
  surpriseBtn.addEventListener('click', surpriseMe);
}

/* ─── Back button ─── */
document.getElementById('ppBackBtn')?.addEventListener('click', () => {
  try {
    if (pageReferrer && new URL(pageReferrer).origin === window.location.origin) {
      window.location.href = pageReferrer;
      return;
    }
  } catch (e) {
    /* invalid referrer URL, fall through */
  }

  if (window.history.length > 1) {
    history.back();
  } else {
    location.href = '/';
  }
});

/* ─── Init ─── */
buildFilters();

// Check for ?search= from URL params
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('search')) {
  searchInput.value = urlParams.get('search');
  searchQuery = searchInput.value;
  clearBtn.classList.toggle('visible', searchQuery.length > 0);
}

// Data scripts (data/practice-problems.js) load synchronously before this file,
// so window.practiceProblems is guaranteed to be populated.
render();
