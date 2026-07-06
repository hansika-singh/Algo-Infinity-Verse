document.addEventListener("DOMContentLoaded", async () => {
  // Sync spaced repetition data from cloud on load
  if (window.syncSpacedRepetitionDown) {
    await window.syncSpacedRepetitionDown();
  }

  // Initial render
  filterAndRender();

  // Bind filter tabs
  document.querySelectorAll(".queue-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".queue-tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      filterAndRender(btn.dataset.filter);
    });
  });

  // Global expose so rateRecallDifficulty can refresh list dynamically
  window.refreshReviewQueue = function() {
    const activeBtn = document.querySelector(".queue-tab-btn.active");
    const activeFilter = activeBtn ? activeBtn.dataset.filter : "all";
    filterAndRender(activeFilter);
  };
});

function getCardState(card) {
  const now = new Date();
  const nextDate = new Date(card.nextReviewDate);
  const isDue = nextDate <= now;
  const isLearned = card.repetitions >= 3 || card.interval > 7;
  return { isDue, isLearned };
}

function filterAndRender(filterType = "all") {
  const cards = userProgress.spacedRepetition || {};
  const allList = [];
  const dueList = [];
  const upcomingList = [];

  for (const pid in cards) {
    const card = cards[pid];
    if (!card) continue;

    let problemTitle = "Problem " + pid;
    let problemObj = null;
    if (typeof practiceProblems !== "undefined") {
      problemObj = practiceProblems.find(p => p.id === card.problemId);
      if (problemObj) problemTitle = problemObj.title;
    }

    const state = getCardState(card);
    const cardInfo = { ...card, problemTitle, problemObj, state };

    allList.push(cardInfo);
    if (state.isDue) {
      dueList.push(cardInfo);
    } else {
      upcomingList.push(cardInfo);
    }
  }

  // Update Stats Counters
  const streakCount = document.getElementById("reviewStreakCount");
  const dueBadge = document.getElementById("dueCountBadge");
  const countAll = document.getElementById("countAll");
  const countDue = document.getElementById("countDue");
  const countUpcoming = document.getElementById("countUpcoming");

  if (streakCount) streakCount.textContent = userProgress.reviewStreak || 0;
  if (dueBadge) dueBadge.textContent = dueList.length;
  if (countAll) countAll.textContent = allList.length;
  if (countDue) countDue.textContent = dueList.length;
  if (countUpcoming) countUpcoming.textContent = upcomingList.length;

  let targetList = allList;
  if (filterType === "due") targetList = dueList;
  else if (filterType === "upcoming") targetList = upcomingList;

  renderList(targetList);
}

function renderList(items) {
  const grid = document.getElementById("queueGrid");
  if (!grid) return;

  if (items.length === 0) {
    grid.innerHTML = `<div class="loading-placeholder">No review problems match this filter criterion. Maintain your daily problem completion to build up your retention card catalog!</div>`;
    return;
  }

  grid.innerHTML = "";
  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "review-card";
    if (item.state.isDue) card.classList.add("due");

    const nextReviewDateStr = new Date(item.nextReviewDate).toLocaleDateString();
    const lastReviewedStr = item.lastReviewed 
      ? new Date(item.lastReviewed).toLocaleDateString() 
      : "Never";

    // Read problem notes preview if user wrote notes for this problem
    let notesPreviewHtml = "";
    if (userProgress.problemNotes && userProgress.problemNotes[item.problemId]) {
      const saved = userProgress.problemNotes[item.problemId];
      const notesStr = typeof saved === "string" ? saved : (saved.notes || saved.mnemonics || "");
      if (notesStr) {
        notesPreviewHtml = `
          <div style="font-size:0.8rem; color:var(--accent); font-style:italic; margin-top:0.4rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${notesStr}">
            <i class="fas fa-sticky-note"></i> Note: "${notesStr}"
          </div>
        `;
      }
    }

    const badgeClass = item.state.isDue ? "due-now" : "";
    const badgeText = item.state.isDue ? "DUE NOW" : `Next: ${nextReviewDateStr}`;
    const difficulty = (item.problemObj?.difficulty || "Medium").toLowerCase();

    card.innerHTML = `
      <div class="review-card-header" style="width:100%; display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem; flex-wrap:wrap;">
        <div style="flex:1; min-width:180px;">
          <span class="badge ${difficulty}" style="text-transform:capitalize;">${item.problemObj?.difficulty || "Medium"}</span>
          <h3 class="review-card-title">${item.problemTitle}</h3>
          ${notesPreviewHtml}
        </div>
        <span class="badge ${badgeClass}">${badgeText}</span>
      </div>
      
      <div class="review-card-meta">
        <div class="meta-item">Ease: <strong>${item.easeFactor}</strong></div>
        <div class="meta-item">Interval: <strong>${item.interval}d</strong></div>
        <div class="meta-item" style="grid-column: span 2;">Last Reviewed: <strong>${lastReviewedStr}</strong></div>
      </div>
      
      <button class="btn btn-primary btn-review-action" style="width:100%; justify-content:center; display:flex; align-items:center; gap:0.5rem;" data-id="${item.problemId}">
        <i class="fas fa-rocket"></i> Review & Solve
      </button>
    `;
    grid.appendChild(card);
  });

  // Bind Review buttons
  grid.querySelectorAll(".btn-review-action").forEach(btn => {
    btn.addEventListener("click", () => {
      const pid = parseInt(btn.dataset.id);
      const item = items.find(i => i.problemId === pid);
      if (item && item.problemObj) {
        if (typeof openQuizEditor === "function") {
          openQuizEditor(item.problemObj);
        }
      }
    });
  });
}
