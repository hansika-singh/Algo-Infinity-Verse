let currentPage = 1;
let currentFilter = 'all';
let currentSearch = '';
let paginationInitialized = false;
const PROBLEMS_PER_PAGE = 6;
let currentNotesProblemId = null;
let lastFilteredCacheKey = "";
let lastFilteredProblems = [];

function loadUserData() {
  if (typeof window.loadUserData === 'function') window.loadUserData();
}

function initPracticeSection() {
  const userProgress = window.userProgress || {};
  const practiceProblems = window.practiceProblems || [];
  if (window.__practiceInitialized) return;
  window.__practiceInitialized = true;
  const problemsGrid = document.querySelector(".problems-grid");
  if (!problemsGrid) return;

  const notesCloseBtn = document.getElementById("notesModalClose");
  const notesSaveBtn = document.getElementById("notesSaveBtn");
  const notesModal = document.getElementById("notesModal");
  if (notesCloseBtn) notesCloseBtn.addEventListener("click", closeNotesModal);
  if (notesSaveBtn) notesSaveBtn.addEventListener("click", saveProblemNotes);
  if (notesModal) notesModal.addEventListener("click", (e) => { if (e.target === notesModal) closeNotesModal(); });

  const filterButtons = document.querySelectorAll(".filter-btn");
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      currentPage = 1;
      renderProblems();
    });
  });

  const aiRecommendBtn = document.getElementById("ai-recommend-btn");
  if (aiRecommendBtn) {
    aiRecommendBtn.addEventListener("click", async () => {
      try {
        aiRecommendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Finding...';
        aiRecommendBtn.disabled = true;
        const res = await fetch("/api/recommendations/next", { credentials: "include" });
        if (res.status === 401) return;
        const data = await res.json();
        if (data.success && data.recommendation) {
          const rec = data.recommendation;
          currentFilter = rec.topic.toLowerCase();
          currentPage = 1;
          filterButtons.forEach((b) => {
            if(b.dataset.filter === currentFilter) b.classList.add("active");
            else b.classList.remove("active");
          });
          renderProblems();
          console.warn("Alert:", "AI Recommendation: " + rec.reason + "\n\n" + (rec.aiTip || ""));
        } else { console.warn("Alert:", "Could not get recommendation."); }
      } catch (err) { console.error("AI recommend error:", err); console.warn("Alert:", "Failed to fetch recommendation."); }
      finally { aiRecommendBtn.innerHTML = '<i class="fas fa-magic"></i> AI Recommend Next'; aiRecommendBtn.disabled = false; }
    });
  }

  const searchInput = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearSearchBtn");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearch = e.target.value.toLowerCase();
      currentPage = 1;
      renderProblems();
      if (currentSearch.length > 0) clearBtn.classList.add("visible");
      else clearBtn.classList.remove("visible");
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      currentSearch = "";
      clearBtn.classList.remove("visible");
      currentPage = 1;
      renderProblems();
      searchInput.focus();
    });
  }

  initPaginationEvents();
  renderProblems();
}

function getFilteredProblems() {
  const practiceProblems = window.practiceProblems || [];
  const userProgress = window.userProgress || {};
  if (!window.dsaSearchEngine && typeof DSASearchEngine !== 'undefined') {
    window.dsaSearchEngine = new DSASearchEngine(practiceProblems);
  }

  let filtered = practiceProblems;
  if (currentSearch && window.dsaSearchEngine) {
    filtered = window.dsaSearchEngine.search(currentSearch);
  } else if (currentSearch) {
    const searchLower = currentSearch.toLowerCase();
    filtered = filtered.filter(p => p.title.toLowerCase().includes(searchLower) || p.tags.some(tag => tag.toLowerCase().includes(searchLower)));
  }
  if (currentFilter !== 'all') {
    if (currentFilter === 'favorites') filtered = filtered.filter(p => userProgress.favoriteProblems.includes(p.id));
    else filtered = filtered.filter(p => p.difficulty === currentFilter);
  }
  return filtered;
}

function renderProblems() {
  const filtered = getFilteredProblems();
  const totalProblems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalProblems / PROBLEMS_PER_PAGE));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * PROBLEMS_PER_PAGE;
  const end = Math.min(start + PROBLEMS_PER_PAGE, totalProblems);
  const pageProblems = filtered.slice(start, end);
  const visibleCountEl = document.getElementById('visible-count');
  const totalCountEl = document.getElementById('total-count');
  if (visibleCountEl) visibleCountEl.textContent = pageProblems.length;
  if (totalCountEl) totalCountEl.textContent = totalProblems;
  renderProblemCards(pageProblems);
  updatePaginationControls(currentPage, totalPages);
}

function renderProblemCards(problems) {
  const userProgress = window.userProgress || {};
  const problemsGrid = document.querySelector(".problems-grid");
  if (!problemsGrid) return;

  const cpType = userProgress.codingPersonality ? userProgress.codingPersonality.type : "brute-force first";

  const html = problems.map(problem => {
    let isRec = false, recLabel = "";
    if (cpType === "brute-force first") {
      if (problem.difficulty === "easy" || problem.tags.includes("Arrays")) { isRec = true; recLabel = "Plan First!"; }
    } else if (cpType === "over-optimizer") {
      if (problem.difficulty === "hard" || problem.tags.includes("Dynamic Programming") || problem.tags.includes("Hash Table")) { isRec = true; recLabel = "Optimize Metrics"; }
    } else if (cpType === "slow but accurate") {
      if (problem.difficulty === "medium") { isRec = true; recLabel = "Speed Practice"; }
    } else if (cpType === "greedy thinker") {
      if (problem.tags.includes("Greedy") || problem.tags.includes("Divide and Conquer") || problem.tags.includes("Recursion")) { isRec = true; recLabel = "Heuristic Check"; }
    }
    const recBadge = isRec ? `<span class="rec-personality-badge"><i class="fas fa-brain"></i> ${recLabel}</span>` : "";
    const isCompleted = userProgress.completedProblems.includes(problem.id);
    const isFavorite = userProgress.favoriteProblems.includes(problem.id);
    const hasNotes = userProgress.problemNotes && userProgress.problemNotes[problem.id];

    const displayTitle = problem.highlightedTitle || problem.title;
    const snippetHtml = problem.highlightedDescription ? `<div class="problem-snippet" style="font-size: 0.85em; color: var(--text-secondary); margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${problem.highlightedDescription}</div>` : "";

    return `<div class="problem-card animate-in" data-id="${problem.id}"><div class="problem-header"><h3 class="problem-title">${recBadge}${displayTitle}</h3><div class="problem-actions"><button class="favorite-btn ${isFavorite ? 'active' : ''}" data-id="${problem.id}" aria-label="Favorite problem"><i class="fas fa-heart"></i></button><button class="notes-btn ${hasNotes ? 'has-notes' : ''}" data-id="${problem.id}" aria-label="Problem notes"><i class="fas fa-sticky-note"></i></button><span class="difficulty-badge ${problem.difficulty}">${problem.difficulty}</span></div></div>${snippetHtml}<div class="problem-tags">${problem.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}</div><div class="problem-meta"><span class="acceptance-rate"><i class="fas fa-users"></i> ${problem.acceptance} acceptance</span>${isCompleted ? '<span class="completed-badge"><i class="fas fa-check"></i> Completed</span>' : ''}</div></div>`;
  }).join("");

  problemsGrid.innerHTML = html;

  if (!problemsGrid.dataset.listenersAttached) {
    attachProblemGridEventDelegation(problemsGrid);
    problemsGrid.dataset.listenersAttached = "true";
  }
}

function attachProblemGridEventDelegation(grid) {
  if (!grid) return;
  grid.addEventListener("click", (e) => {
    const favoriteBtn = e.target.closest(".favorite-btn");
    if (favoriteBtn && grid.contains(favoriteBtn)) {
      e.stopPropagation();
      e.preventDefault();
      const problemId = parseInt(favoriteBtn.dataset.id);
      toggleFavorite(problemId);
      renderProblems();
      return;
    }
    const notesBtn = e.target.closest(".notes-btn");
    if (notesBtn && grid.contains(notesBtn)) {
      e.stopPropagation();
      e.preventDefault();
      const problemId = parseInt(notesBtn.dataset.id);
      currentNotesProblemId = problemId;
      openNotesModal(problemId);
      return;
    }
    const card = e.target.closest(".problem-card");
    if (card && grid.contains(card)) {
      const problemId = parseInt(card.dataset.id);
      handleProblemClick(problemId);
    }
  });
}

function addProblemCardEventListeners(grid) {
  grid.querySelectorAll(".favorite-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const problemId = parseInt(btn.dataset.id);
      toggleFavorite(problemId);
      renderProblems();
    });
  });
  grid.querySelectorAll(".notes-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const problemId = parseInt(btn.dataset.id);
      currentNotesProblemId = problemId;
      openNotesModal(problemId);
    });
  });
  grid.querySelectorAll(".problem-card").forEach((card) => {
    card.addEventListener("click", () => {
      const problemId = parseInt(card.dataset.id);
      handleProblemClick(problemId);
    });
  });
}

function updatePaginationControls(page, totalPages) {
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');
  const info = document.getElementById('paginationInfo');
  if (prevBtn) prevBtn.disabled = page <= 1;
  if (nextBtn) nextBtn.disabled = page >= totalPages;
  if (info) info.textContent = `Page ${page} of ${totalPages}`;
}

function changePage(delta) {
  const filtered = getFilteredProblems();
  const totalPages = Math.max(1, Math.ceil(filtered.length / PROBLEMS_PER_PAGE));
  const newPage = currentPage + delta;
  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;
    renderProblems();
    document.getElementById('practice')?.scrollIntoView({ behavior: 'smooth' });
  }
}

function initPaginationEvents() {
  if (paginationInitialized) return;
  paginationInitialized = true;
  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');
  if (prevBtn) prevBtn.addEventListener('click', () => changePage(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => changePage(1));
}

function toggleFavorite(problemId) {
  const userProgress = window.userProgress || {};
  const idx = userProgress.favoriteProblems.indexOf(problemId);
  if (idx > -1) { userProgress.favoriteProblems.splice(idx, 1); if (typeof showNotification === 'function') showNotification("Removed from favorites 💔", "info"); }
  else { userProgress.favoriteProblems.push(problemId); if (typeof showNotification === 'function') showNotification("Added to favorites ❤️", "success"); }
  if (typeof saveUserData === 'function') saveUserData();
}

function openNotesModal(problemId) {
  const userProgress = window.userProgress || {};
  currentNotesProblemId = problemId;
  const modal = document.getElementById("notesModal");
  const textarea = document.getElementById("problemNotesInput");
  if (!modal || !textarea) return;
  textarea.value = userProgress.problemNotes[problemId] || "";
  modal.classList.add("active");
}

function closeNotesModal() {
  const el = document.getElementById("notesModal");
  if (el) el.classList.remove("active");
}

function saveProblemNotes() {
  const userProgress = window.userProgress || {};
  const input = document.getElementById("problemNotesInput");
  if (!input) return;
  const note = input.value.trim();
  if (currentNotesProblemId !== null) {
    userProgress.problemNotes[currentNotesProblemId] = note;
    if (typeof saveUserData === 'function') saveUserData();
    if (typeof showNotification === 'function') showNotification("Notes saved successfully 📝", "success");
  }
  closeNotesModal();
}

function handleProblemClick(problemId) {
  const practiceProblems = window.practiceProblems || [];
  const problem = practiceProblems.find(p => p.id === problemId);
  if (problem) { if (typeof openQuizEditor === 'function') openQuizEditor(problem); addRecentProblem(problemId); }
}

function addRecentProblem(problemId) {
  const userProgress = window.userProgress || {};
  if (!userProgress.recentProblems) userProgress.recentProblems = [];
  userProgress.recentProblems = userProgress.recentProblems.filter(id => id !== problemId);
  userProgress.recentProblems.unshift(problemId);
  if (userProgress.recentProblems.length > 10) userProgress.recentProblems.pop();
  if (typeof saveUserData === 'function') saveUserData();
}

export { initPracticeSection };
