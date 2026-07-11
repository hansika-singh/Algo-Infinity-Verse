let currentFilter = 'all';
let currentSearch = '';
let currentNotesProblemId = null;
let virtualizedGrid = null;
let lastFilteredCacheKey = "";
let lastFilteredProblems = [];
import { VirtualizedGrid } from './virtualizedGrid.js';
import { initBookmarkCollections, renderCollectionChooser } from './bookmarkUI.js';
import { ensureBookmarkCollectionsState, addProblemToCollections, removeProblemFromCollections, getCollectionsForProblem } from './bookmarkCollections.js';

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
  
  // Try restoring state before attaching listeners
  const savedStateStr = sessionStorage.getItem("practiceGridState");
  let restoredScrollY = 0;
  if (savedStateStr) {
    try {
      const state = JSON.parse(savedStateStr);
      if (state.filter) currentFilter = state.filter;
      if (state.search) currentSearch = state.search;
      restoredScrollY = state.scrollY || 0;
    } catch (e) {}
  }

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
      renderProblems();
    });
    // Set active state on load if restored
    if (btn.dataset.filter === currentFilter) {
      filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    }
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
          filterButtons.forEach((b) => {
            if(b.dataset.filter === currentFilter) b.classList.add("active");
            else b.classList.remove("active");
          });
          renderProblems();
          void 0;
        } else { void 0; }
      } catch (err) { console.error("AI recommend error:", err); void 0; }
      finally { aiRecommendBtn.innerHTML = '<i class="fas fa-magic"></i> AI Recommend Next'; aiRecommendBtn.disabled = false; }
    });
  }

  const searchInput = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearSearchBtn");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearch = e.target.value.toLowerCase();
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
      renderProblems();
      searchInput.focus();
    });
    if (currentSearch) {
      searchInput.value = currentSearch;
      clearBtn.classList.add("visible");
    }
  }

  const paginationControls = document.getElementById('paginationControls');
  if (paginationControls) {
    paginationControls.style.display = 'none';
  }

  ensureBookmarkCollectionsState(userProgress);
  renderProblems();
  initBookmarkCollections();
  
  if (restoredScrollY > 0) {
    // Delay scroll slightly to ensure DOM is ready and grid layout updated
    setTimeout(() => {
      window.scrollTo({ top: restoredScrollY, behavior: 'instant' });
    }, 10);
  }

  // Save state on unload
  window.addEventListener("beforeunload", () => {
    sessionStorage.setItem("practiceGridState", JSON.stringify({
      filter: currentFilter,
      search: currentSearch,
      scrollY: window.scrollY
    }));
  });
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
  
  const visibleCountEl = document.getElementById('visible-count');
  const totalCountEl = document.getElementById('total-count');
  if (visibleCountEl) visibleCountEl.textContent = totalProblems; // Without pagination, visible count is all of them
  if (totalCountEl) totalCountEl.textContent = totalProblems;
  
  const problemsGrid = document.querySelector(".problems-grid");
  if (!problemsGrid) return;
  
  const emptyState = document.getElementById("emptyState");
  if (totalProblems === 0) {
    problemsGrid.style.display = 'none';
    if (emptyState) emptyState.classList.remove("hidden");
  } else {
    problemsGrid.style.display = 'grid';
    if (emptyState) emptyState.classList.add("hidden");
  }

  if (!virtualizedGrid) {
    virtualizedGrid = new VirtualizedGrid({
      container: problemsGrid,
      items: filtered,
      itemHeight: 250,
      renderItem: renderProblemCardHtml,
    });
    virtualizedGrid.onRendered = () => {
      if (!problemsGrid.dataset.listenersAttached) {
        attachProblemGridEventDelegation(problemsGrid);
        problemsGrid.dataset.listenersAttached = "true";
      }
    };
    virtualizedGrid.updateLayout();
  } else {
    virtualizedGrid.updateItems(filtered);
  }
}

function renderProblemCardHtml(problem) {
  const userProgress = window.userProgress || {};
  const cpType = userProgress.codingPersonality ? userProgress.codingPersonality.type : "brute-force first";

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
  const collectionChooser = renderCollectionChooser(problem.id);

  const displayTitle = problem.highlightedTitle || problem.title;
  const snippetHtml = problem.highlightedDescription ? `<div class="problem-snippet" style="font-size: 0.85em; color: var(--text-secondary); margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${problem.highlightedDescription}</div>` : "";

  return `<div class="problem-card animate-in" data-id="${problem.id}"><div class="problem-header"><h3 class="problem-title">${recBadge}${displayTitle}</h3><div class="problem-actions"><button class="favorite-btn ${isFavorite ? 'active' : ''}" data-id="${problem.id}" aria-label="Favorite problem"><i class="fas fa-heart"></i></button><button class="notes-btn ${hasNotes ? 'has-notes' : ''}" data-id="${problem.id}" aria-label="Problem notes"><i class="fas fa-sticky-note"></i></button><span class="difficulty-badge ${problem.difficulty}">${problem.difficulty}</span></div></div>${snippetHtml}<div class="problem-tags">${problem.tags.map(tag => `<span class="tag">${tag}</span>`).join("")}</div><div class="problem-meta"><span class="acceptance-rate"><i class="fas fa-users"></i> ${problem.acceptance} acceptance</span>${isCompleted ? '<span class="completed-badge"><i class="fas fa-check"></i> Completed</span>' : ''}</div>${collectionChooser}</div>`;
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

function toggleFavorite(problemId) {
  const userProgress = window.userProgress || {};
  const idx = userProgress.favoriteProblems.indexOf(problemId);
  if (idx > -1) {
    userProgress.favoriteProblems.splice(idx, 1);
    removeProblemFromCollections(userProgress, problemId, getCollectionsForProblem(userProgress, problemId));
    if (typeof showNotification === 'function') showNotification("Removed from favorites 💔", "info");
  } else {
    userProgress.favoriteProblems.push(problemId);
    addProblemToCollections(userProgress, problemId, []);
    if (typeof showNotification === 'function') showNotification("Added to favorites ❤️", "success");
  }
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
