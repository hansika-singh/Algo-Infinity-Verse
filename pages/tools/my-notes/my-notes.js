document.addEventListener("DOMContentLoaded", async () => {
  // Sync notes from Firebase on load
  if (window.syncProblemNotesDown) {
    await window.syncProblemNotesDown();
  }

  // Selected tag for filtering
  let selectedTag = null;

  // Bind Search Filters
  const searchInput = document.getElementById("notesSearchInput");
  const categorySelect = document.getElementById("categoryFilterSelect");
  const btnClearFilters = document.getElementById("btnClearFilters");

  // Initial render
  filterAndRender();
  renderTagCloud();

  if (searchInput) searchInput.addEventListener("input", filterAndRender);
  if (categorySelect) categorySelect.addEventListener("change", filterAndRender);
  if (btnClearFilters) btnClearFilters.addEventListener("click", resetFilters);

  function filterAndRender() {
    const search = (searchInput?.value || "").trim().toLowerCase();
    const cat = categorySelect?.value || "";
    
    const notes = userProgress.problemNotes || {};
    const filtered = [];
    
    for (const pid in notes) {
      const item = notes[pid];
      if (!item) continue;

      // Gracefully normalize legacy notes that are just plain string
      const actualItem = typeof item === "string" 
        ? { notes: item, problemId: parseInt(pid), topicKey: "general", tags: [] } 
        : item;
      
      // Look up problem details
      let problemTitle = "Problem " + pid;
      if (typeof practiceProblems !== "undefined") {
        const pObj = practiceProblems.find(p => p.id === actualItem.problemId);
        if (pObj) problemTitle = pObj.title;
      }
      
      const titleMatch = problemTitle.toLowerCase().includes(search);
      const notesMatch = (actualItem.notes || "").toLowerCase().includes(search) ||
                         (actualItem.mnemonics || "").toLowerCase().includes(search) ||
                         (actualItem.pitfalls || "").toLowerCase().includes(search) ||
                         (actualItem.whenToUse || "").toLowerCase().includes(search);
      
      const matchesSearch = titleMatch || notesMatch;
      
      // Match category filter
      const matchesCat = !cat || actualItem.topicKey === cat;
      
      // Match tag selection
      const matchesTag = !selectedTag || (actualItem.tags || []).includes(selectedTag);
      
      if (matchesSearch && matchesCat && matchesTag) {
        filtered.push({ ...actualItem, problemTitle });
      }
    }
    
    renderNotesCards(filtered);
  }

  function renderNotesCards(items) {
    const grid = document.getElementById("notesCardsGrid");
    if (!grid) return;

    if (items.length === 0) {
      grid.innerHTML = `<div class="loading-placeholder" style="grid-column: 1 / -1;">No study notes match the active filter criteria. Add notes during problem practice sessions!</div>`;
      return;
    }
    
    grid.innerHTML = "";
    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "note-card";
      
      const tagsHtml = (item.tags || []).map(t => `<span class="badge-mini">${t}</span>`).join(" ");
      const previewText = item.notes || item.mnemonics || "No observations written yet.";
      
      card.innerHTML = `
        <div class="note-card-header">
          <span class="badge" style="font-size:0.7rem; padding:0.1rem 0.4rem; text-transform:uppercase;">${item.topicKey || "general"}</span>
          <h3 class="note-card-title">${item.problemTitle}</h3>
        </div>
        <p class="note-card-preview">${previewText}</p>
        <div>
          <div class="note-card-tags" style="display:flex; flex-wrap:wrap; gap:0.25rem; margin-bottom:1rem;">${tagsHtml}</div>
          <button class="btn btn-secondary btn-view-note" style="width:100%; font-size:0.8rem; padding:0.4rem;" data-id="${item.problemId}">View Full Guide</button>
        </div>
      `;
      grid.appendChild(card);
    });
    
    // Bind click handlers
    grid.querySelectorAll(".btn-view-note").forEach(btn => {
      btn.addEventListener("click", () => {
        const pid = parseInt(btn.dataset.id);
        openNotesDetail(pid);
      });
    });
  }

  function renderTagCloud() {
    const container = document.getElementById("tagCloudContainer");
    if (!container) return;

    const notes = userProgress.problemNotes || {};
    const tagSet = new Set();
    
    for (const pid in notes) {
      const item = notes[pid];
      if (item && typeof item === "object" && item.tags) {
        item.tags.forEach(t => tagSet.add(t));
      }
    }
    
    container.innerHTML = "";
    if (tagSet.size === 0) {
      container.innerHTML = `<span style="font-size:0.8rem; color:var(--text-secondary); font-style:italic;">No tags added yet.</span>`;
      return;
    }

    tagSet.forEach(tag => {
      const span = document.createElement("span");
      span.className = "tag-badge";
      if (tag === selectedTag) span.classList.add("active");
      span.textContent = tag;
      
      span.addEventListener("click", () => {
        if (selectedTag === tag) {
          selectedTag = null;
          span.classList.remove("active");
        } else {
          selectedTag = tag;
          container.querySelectorAll(".tag-badge").forEach(t => t.classList.remove("active"));
          span.classList.add("active");
        }
        filterAndRender();
      });
      container.appendChild(span);
    });
  }

  function resetFilters() {
    if (searchInput) searchInput.value = "";
    if (categorySelect) categorySelect.value = "";
    selectedTag = null;
    
    const container = document.getElementById("tagCloudContainer");
    if (container) {
      container.querySelectorAll(".tag-badge").forEach(t => t.classList.remove("active"));
    }
    
    filterAndRender();
  }

  // Detail Modal functions
  window.openNotesDetail = function(problemId) {
    const notes = userProgress.problemNotes || {};
    const item = notes[problemId];
    if (!item) return;
    
    const actualItem = typeof item === "string" 
      ? { notes: item, problemId, topicKey: "general", tags: [] } 
      : item;
    
    let problemTitle = "Problem " + problemId;
    let problemObj = null;
    if (typeof practiceProblems !== "undefined") {
      problemObj = practiceProblems.find(p => p.id === actualItem.problemId);
      if (problemObj) problemTitle = problemObj.title;
    }
    
    document.getElementById("modalProblemTitle").textContent = problemTitle;
    document.getElementById("modalProblemCategory").textContent = (actualItem.topicKey || "general").toUpperCase();
    
    const tagsContainer = document.getElementById("modalTagsContainer");
    tagsContainer.innerHTML = (actualItem.tags || []).map(t => `<span class="badge">${t}</span>`).join("");
    
    document.getElementById("modalNotesText").textContent = actualItem.notes || "--";
    document.getElementById("modalMnemonicText").textContent = actualItem.mnemonics || "--";
    document.getElementById("modalPitfallsText").textContent = actualItem.pitfalls || "--";
    document.getElementById("modalWhenToUseText").textContent = actualItem.whenToUse || "--";
    
    const btnPractice = document.getElementById("btnModalPractice");
    if (problemObj) {
      btnPractice.style.display = "block";
      btnPractice.onclick = () => {
        closeNotesDetailModal();
        if (typeof openQuizEditor === "function") {
          openQuizEditor(problemObj);
        }
      };
    } else {
      btnPractice.style.display = "none";
    }
    
    document.getElementById("notesDetailModal").classList.add("active");
  };

  window.closeNotesDetailModal = function() {
    const modal = document.getElementById("notesDetailModal");
    if (modal) modal.classList.remove("active");
  };
});
