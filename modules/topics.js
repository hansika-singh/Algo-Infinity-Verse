function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / (1000 * 60 * 60 * 24));
}

function getDailyTopic() {
  const dsaTopics = window.dsaTopics || [];
  return dsaTopics[getDayOfYear() % dsaTopics.length];
}

function getDifficultyClass(difficulty) {
  const d = difficulty.toLowerCase();
  if (d.includes("easy")) return "easy";
  if (d.includes("medium")) return "medium";
  if (d.includes("hard")) return "hard";
  return "medium";
}

function getTopicProgress(topicName) {
  const userProgress = window.userProgress || {};
  const practiceProblems = window.practiceProblems || [];
  const categoryMap = { Arrays: "arrays", Strings: "strings", "Linked List": "linkedlist", Trees: "trees", Graphs: "graphs", "Dynamic Programming": "dp" };
  const category = categoryMap[topicName];
  if (!category) return { completed: 0, total: 0, percentage: 0 };
  const topicProblems = practiceProblems.filter(p => p.category === category);
  const total = topicProblems.length;
  if (total === 0) return { completed: 0, total: 0, percentage: 0 };
  const completed = topicProblems.filter(p => userProgress.completedProblems.includes(p.id)).length;
  return { completed, total, percentage: Math.round((completed / total) * 100) };
}

function getQuizTopicKey(topic) {
  const normalize = s => String(s).trim().toLowerCase().replace(/\s+/g, " ");
  const map = { arrays: "arrays", strings: "strings", "linked list": "linkedlist", linkedlist: "linkedlist", trees: "trees", graphs: "graphs", "dynamic programming": "dp", dp: "dp" };
  if (typeof topic === "string") return map[normalize(topic)] || null;
  const name = normalize(topic.name);
  return map[name] || null;
}

function initTopicOfTheDay() {
  const dsaTopics = window.dsaTopics || [];
  const topic = getDailyTopic();
  if (!topic) return;
  const totdIcon = document.getElementById("totdIcon");
  if (!totdIcon) return;
  totdIcon.textContent = topic.icon;
  const totdTitle = document.getElementById("totdTitle");
  if (totdTitle) totdTitle.textContent = topic.name;
  const totdDesc = document.getElementById("totdDesc");
  if (totdDesc) totdDesc.textContent = topic.description;
  const diffEl = document.getElementById("totdDifficulty");
  if (diffEl) {
    diffEl.textContent = topic.difficulty;
    diffEl.className = `totd-difficulty difficulty-badge ${getDifficultyClass(topic.difficulty)}`;
  }
  const progress = getTopicProgress(topic.name);
  const totdProblems = document.getElementById("totdProblems");
  if (totdProblems) totdProblems.textContent = `${progress.completed}/${progress.total} solved`;
  const totdBtn = document.getElementById("totdBtn");
  if (totdBtn) totdBtn.addEventListener("click", () => openTopicModal(topic));
}

function initTopicsSection() {
  const dsaTopics = window.dsaTopics || [];
  const topicsGrid = document.querySelector(".topics-grid");
  if (!topicsGrid) return;
  topicsGrid.innerHTML = "";
  dsaTopics.forEach((topic, index) => {
    const card = document.createElement("div");
    card.className = "topic-card animate-in";
    card.style.animationDelay = `${index * 0.1}s`;
    const progress = getTopicProgress(topic.name);
    card.innerHTML = `<div class="topic-icon">${topic.icon}</div><h3 class="topic-name">${topic.name}</h3><p class="topic-desc">${topic.description}</p><div class="topic-meta"><span class="difficulty-badge ${getDifficultyClass(topic.difficulty)}">${topic.difficulty}</span><span class="topic-count">${progress.total} problems</span></div><div class="topic-mastery"><div class="mastery-header"><span class="mastery-label">Progress</span><span class="mastery-stats">${progress.completed}/${progress.total} solved</span></div><div class="mastery-bar"><div class="mastery-fill" style="width: ${progress.percentage}%"></div></div><span class="mastery-percentage">${progress.percentage}%</span></div>`;
    topicsGrid.appendChild(card);
    card.addEventListener("click", () => openTopicModal(topic));
  });
}

function openTopicModal(topic) {
  const modal = document.getElementById("topicModal");
  if (!modal) return;
  const modalTitle = document.getElementById("modalTitle");
  if (modalTitle) modalTitle.textContent = topic.name;
  const modalTheory = document.getElementById("modalTheory");
  if (modalTheory) modalTheory.innerHTML = topic.theory;
  const modalDifficulty = document.getElementById("modalDifficulty");
  if (modalDifficulty) modalDifficulty.innerHTML = `<span class="difficulty-badge ${getDifficultyClass(topic.difficulty)}">${topic.difficulty}</span>`;
  const problemsList = document.getElementById("modalProblems");
  if (problemsList) {
    problemsList.innerHTML = topic.problems
      .map(
        (p) => `
        <li style="list-style:none; margin:0.4rem 0;">
          <button
            type="button"
            class="sample-problem-item"
            data-problem-name="${p.replace(/"/g, "&quot;")}"
            style="width:100%; text-align:left; cursor:pointer; padding:0.6rem 1rem; border-radius:8px; border:1px solid var(--glass-border); transition:all 0.2s ease;"
          >${p}</button>
        </li>`
      )
      .join("");

    problemsList.querySelectorAll(".sample-problem-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectSampleProblem(btn, btn.dataset.problemName || "");
      });
    });
  }
  const startBtn = document.getElementById("startPracticeBtn");
  if (startBtn) {
    startBtn.textContent = "Start Practicing";
    startBtn.onclick = () => {
      const selected = document.querySelector(".selected-problem");
      const problemName = selected ? selected.textContent.trim() : null;
      closeTopicModal();
      const practice = document.getElementById("practice");
      if (practice) practice.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => {
        const practiceProblems = window.practiceProblems || [];
        const match = practiceProblems.find(p => p.title.toLowerCase() === (problemName || "").toLowerCase());
        if (match && typeof openQuizEditor === 'function') openQuizEditor(match);
      }, 600);
    };
  }
  modal.classList.add("active");
}

function selectSampleProblem(el, problemName) {
  document.querySelectorAll(".sample-problem-item").forEach(item => { item.classList.remove("selected-problem"); item.style.background = ""; item.style.color = ""; item.style.border = "1px solid var(--glass-border)"; });
  el.classList.add("selected-problem");
  el.style.background = "var(--primary)";
  el.style.color = "var(--dark-bg)";
  el.style.border = "1px solid var(--primary)";
  const practiceBtn = document.getElementById("startPracticeBtn");
  if (practiceBtn) practiceBtn.textContent = `Start Practicing: ${problemName}`;
}

function closeTopicModal() { const el = document.getElementById("topicModal"); if (el) el.classList.remove("active"); }

window.openTopicModal = openTopicModal;
window.closeTopicModal = closeTopicModal;
window.selectSampleProblem = selectSampleProblem;


function getUserProgress() {
  return window.userProgress || {};
}

function saveUserProgress() {
  if (typeof window.saveUserData === 'function') {
    window.saveUserData();
  }
}

function getCompletedTopics() {
  const dsaTopics = window.dsaTopics || [];
  const userProgress = getUserProgress();
  const categoryMap = { Arrays: "arrays", Strings: "strings", "Linked List": "linkedlist", Trees: "trees", Graphs: "graphs", "Dynamic Programming": "dp" };
  return dsaTopics.filter(topic => {
    const category = categoryMap[topic.name];
    return category && userProgress.completedTopics && userProgress.completedTopics.includes(category);
  });
}

// Export functions
export { 
  getTopicProgress, 
  getUserProgress,
  saveUserProgress,
  getCompletedTopics,
  initTopicOfTheDay,
  initTopicsSection,
  getDailyTopic,
  getDifficultyClass,
  getQuizTopicKey,
  openTopicModal,
  closeTopicModal,
  selectSampleProblem
};
