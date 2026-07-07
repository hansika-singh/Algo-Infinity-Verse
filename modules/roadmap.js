let roadmapTabsInitialized = false;
let roadmapStagesInitialized = false;
let currentQuizAnswers = {};
let currentRoadmapSearch = '';

function getDifficultyClass(difficulty) {
  const d = difficulty.toLowerCase();
  if (d.includes("easy")) return "easy";
  if (d.includes("medium")) return "medium";
  if (d.includes("hard")) return "hard";
  return "medium";
}

function isRoadmapStepCompleted(step) {
  const userProgress = window.userProgress || {};
  if (step.type === "quiz") return userProgress.completedRoadmapSteps.includes(step.id);
  if (!step.problems) return false;
  return (step.problems || []).some(pid => userProgress.completedProblems.includes(pid));
}

function initRoadmap() {
  const roadmapSteps = window.roadmapSteps || [];
  const advancedRoadmapSteps = window.advancedRoadmapSteps || [];
  const userProgress = window.userProgress || {};
  const practiceProblems = window.practiceProblems || [];

  if (!roadmapTabsInitialized) {
    const basicTab = document.getElementById("roadmapBasicTab");
    const overviewTab = document.getElementById("roadmapOverviewTab");
    if (basicTab && overviewTab) {
      basicTab.addEventListener("click", () => { basicTab.classList.add("active"); overviewTab.classList.remove("active"); const basicContainer = document.getElementById("basicRoadmapContainer"); if (basicContainer) basicContainer.classList.add("active"); const overviewContainer = document.getElementById("overviewRoadmapContainer"); if (overviewContainer) overviewContainer.classList.remove("active"); });
      overviewTab.addEventListener("click", () => { overviewTab.classList.add("active"); basicTab.classList.remove("active"); const overviewContainer2 = document.getElementById("overviewRoadmapContainer"); if (overviewContainer2) overviewContainer2.classList.add("active"); const basicContainer2 = document.getElementById("basicRoadmapContainer"); if (basicContainer2) basicContainer2.classList.remove("active"); });
    }
    const closeBtn = document.getElementById("roadmapStepModalClose");
    const closeBtn2 = document.getElementById("roadmapStepModalCloseBtn");
    const modal = document.getElementById("roadmapStepModal");
    if (closeBtn && modal) closeBtn.addEventListener("click", () => modal.classList.remove("active"));
    if (closeBtn2 && modal) closeBtn2.addEventListener("click", () => modal.classList.remove("active"));
    if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("active"); });

    const roadmapSearchInput = document.getElementById("roadmapSearchInput");
    const clearRoadmapSearchBtn = document.getElementById("clearRoadmapSearchBtn");
    if (roadmapSearchInput) {
      roadmapSearchInput.addEventListener("input", (e) => {
        currentRoadmapSearch = e.target.value;
        if (currentRoadmapSearch.length > 0) clearRoadmapSearchBtn.classList.add("visible");
        else clearRoadmapSearchBtn.classList.remove("visible");
        renderBasicRoadmap();
        renderAdvancedRoadmap();
      });
    }
    if (clearRoadmapSearchBtn) {
      clearRoadmapSearchBtn.addEventListener("click", () => {
        if (roadmapSearchInput) roadmapSearchInput.value = "";
        currentRoadmapSearch = "";
        clearRoadmapSearchBtn.classList.remove("visible");
        renderBasicRoadmap();
        renderAdvancedRoadmap();
        if (roadmapSearchInput) roadmapSearchInput.focus();
      });
    }
    roadmapTabsInitialized = true;
  }
  renderBasicRoadmap();
  const progressBar = document.getElementById("roadmapProgress");
  const stages = document.querySelectorAll(".stage");
  if (!roadmapStagesInitialized) {
    stages.forEach((stage) => {
      stage.style.cursor = "pointer";
      stage.addEventListener("click", () => {
        const level = stage.dataset.level;
        if (level === "beginner") { document.getElementById("roadmapBasicTab")?.click(); }
        else if (level === "intermediate") { document.getElementById("roadmapOverviewTab")?.click(); }
        else if (level === "advanced") { document.querySelector(".roadmap-container")?.scrollIntoView({ behavior: "smooth" }); }
      });
    });
    roadmapStagesInitialized = true;
  }
  if (progressBar && stages.length >= 3) {
    const progress = Math.min((userProgress.completedProblems.length / practiceProblems.length) * 100, 100);
    setTimeout(() => {
      progressBar.style.width = `${progress}%`;
      if (progress >= 25) stages[0].classList.add("active");
      if (progress >= 70) stages[1].classList.add("active");
      if (progress === 100) stages[2].classList.add("active");
    }, 500);
  }
}

function renderBasicRoadmap() {
  const roadmapSteps = window.roadmapSteps || [];
  const userProgress = window.userProgress || {};
  const practiceProblems = window.practiceProblems || [];
  const timeline = document.getElementById("basicRoadmapTimeline");
  if (!timeline) return;

  const searchLower = currentRoadmapSearch.toLowerCase().trim();
  const filteredSteps = roadmapSteps.filter(step => {
    return step.title.toLowerCase().includes(searchLower) || step.desc.toLowerCase().includes(searchLower) || step.theory.toLowerCase().includes(searchLower);
  });

  if (filteredSteps.length === 0) {
    timeline.innerHTML = `<div class="empty-state" style="text-align:center; padding:3rem; color:var(--text-secondary);"><p>No roadmap steps found matching "${currentRoadmapSearch}".</p></div>`;
    return;
  }

  let html = "";
  filteredSteps.forEach((step) => {
    const index = roadmapSteps.indexOf(step);
    const isCompleted = isRoadmapStepCompleted(step);
    let isUnlocked = index === 0 || isRoadmapStepCompleted(roadmapSteps[index - 1]);
    let statusClass = "locked", statusText = "Locked", statusTagClass = "locked-tag";
    if (isCompleted) { statusClass = "completed"; statusText = "Completed"; statusTagClass = "completed-tag"; }
    else if (isUnlocked) { statusClass = "active"; statusText = "Active"; statusTagClass = "active-tag"; }
    let progressPercent = 0, progressText = "";
    if (step.type === "quiz") { progressPercent = isCompleted ? 100 : 0; progressText = isCompleted ? "Passed" : "Not Started"; }
    else { const problemIds = step.problems || []; const solved = problemIds.filter(pid => userProgress.completedProblems.includes(pid)).length; progressPercent = problemIds.length ? Math.round((solved / problemIds.length) * 100) : 0; progressText = problemIds.length ? `${solved}/${problemIds.length} Solved` : 'N/A'; }
    let stepIcon = `<i class="fa-solid ${step.icon}"></i>`;
    if (isCompleted) stepIcon = `<i class="fa-solid fa-check"></i>`;
    else if (statusClass === "locked") stepIcon = `<i class="fa-solid fa-lock"></i>`;
    html += `<div class="roadmap-step ${statusClass}" data-step="${step.id}"><div class="step-marker-dot">${stepIcon}</div><div class="roadmap-step-card"><div class="step-card-header"><span class="step-number">Step ${step.id}</span><span class="step-status-tag ${statusTagClass}">${statusText}</span></div><h3 class="step-title">${step.title}</h3><p class="step-desc">${step.desc}</p><div class="step-card-footer"><div class="step-progress"><div class="step-progress-label">Progress: ${progressText} (${progressPercent}%)</div><div class="step-progress-bar-container"><div class="step-progress-bar-fill" style="width: ${progressPercent}%;"></div></div></div>${isUnlocked ? `<button class="btn btn-primary btn-sm" onclick="openRoadmapStepModal(${index}, 'basic')">${isCompleted ? 'Review Step' : 'Start Step'}</button>` : `<button class="btn btn-secondary btn-sm" disabled><i class="fa-solid fa-lock"></i> Locked</button>`}</div></div></div>`;
  });
  timeline.innerHTML = html;
}

function renderAdvancedRoadmap() {
  const advancedRoadmapSteps = window.advancedRoadmapSteps || [];
  const userProgress = window.userProgress || {};
  const practiceProblems = window.practiceProblems || [];
  const timeline = document.getElementById("advancedRoadmapTimeline");
  if (!timeline) return;

  const searchLower = currentRoadmapSearch.toLowerCase().trim();
  const filteredSteps = advancedRoadmapSteps.filter(step => {
    return step.title.toLowerCase().includes(searchLower) || step.desc.toLowerCase().includes(searchLower) || step.theory.toLowerCase().includes(searchLower);
  });

  if (filteredSteps.length === 0) {
    timeline.innerHTML = `<div class="empty-state" style="text-align:center; padding:3rem; color:var(--text-secondary);"><p>No roadmap steps found matching "${currentRoadmapSearch}".</p></div>`;
    return;
  }

  let html = "";
  filteredSteps.forEach((step) => {
    const index = advancedRoadmapSteps.indexOf(step);
    const isCompleted = isRoadmapStepCompleted(step);
    let isUnlocked = index === 0 || isRoadmapStepCompleted(advancedRoadmapSteps[index - 1]);
    let statusClass = "locked", statusText = "Locked", statusTagClass = "locked-tag";
    if (isCompleted) { statusClass = "completed"; statusText = "Completed"; statusTagClass = "completed-tag"; }
    else if (isUnlocked) { statusClass = "active"; statusText = "Active"; statusTagClass = "active-tag"; }
    let progressPercent = 0, progressText = "";
    if (step.type === "quiz") { progressPercent = isCompleted ? 100 : 0; progressText = isCompleted ? "Passed" : "Not Started"; }
    else { const problemIds = step.problems || []; const solved = problemIds.filter(pid => userProgress.completedProblems.includes(pid)).length; progressPercent = problemIds.length ? Math.round((solved / problemIds.length) * 100) : 0; progressText = problemIds.length ? `${solved}/${problemIds.length} Solved` : 'N/A'; }
    let stepIcon = `<i class="fa-solid ${step.icon}"></i>`;
    if (isCompleted) stepIcon = `<i class="fa-solid fa-check"></i>`;
    else if (statusClass === "locked") stepIcon = `<i class="fa-solid fa-lock"></i>`;
    html += `<div class="roadmap-step ${statusClass}" data-step="${step.id}"><div class="step-marker-dot">${stepIcon}</div><div class="roadmap-step-card"><div class="step-card-header"><span class="step-number">Step ${step.id}</span><span class="step-status-tag ${statusTagClass}">${statusText}</span></div><h3 class="step-title">${step.title}</h3><p class="step-desc">${step.desc}</p><div class="step-card-footer"><div class="step-progress"><div class="step-progress-label">Progress: ${progressText} (${progressPercent}%)</div><div class="step-progress-bar-container"><div class="step-progress-bar-fill" style="width: ${progressPercent}%;"></div></div></div>${isUnlocked ? `<button class="btn btn-primary btn-sm" onclick="openRoadmapStepModal(${index}, 'advanced')">${isCompleted ? 'Review Step' : 'Start Step'}</button>` : `<button class="btn btn-secondary btn-sm" disabled><i class="fa-solid fa-lock"></i> Locked</button>`}</div></div></div>`;
  });
  timeline.innerHTML = html;
}

function openRoadmapStepModal(stepIndex, type = 'basic') {
  const roadmapSteps = window.roadmapSteps || [];
  const advancedRoadmapSteps = window.advancedRoadmapSteps || [];
  const userProgress = window.userProgress || {};
  const practiceProblems = window.practiceProblems || [];
  const steps = type === 'basic' ? roadmapSteps : advancedRoadmapSteps;
  const step = steps[stepIndex];
  if (!step) return;
  const modal = document.getElementById("roadmapStepModal");
  if (!modal) return;
  currentQuizAnswers = {};
  const badgeEl = document.getElementById("roadmapStepBadge");
  if (badgeEl) badgeEl.textContent = `Step ${step.id}`;
  const titleEl = document.getElementById("roadmapStepModalTitle");
  if (titleEl) titleEl.textContent = step.title;
  const theoryEl = document.getElementById("roadmapStepTheoryContent");
  if (theoryEl) theoryEl.innerHTML = step.theory;
  const complexitySection = document.getElementById("roadmapStepComplexitySection");
  if (step.complexity && step.complexity.length > 0 && complexitySection) {
    complexitySection.classList.remove("hidden");
    const body = document.getElementById("roadmapStepComplexityBody");
    if (body) body.innerHTML = step.complexity.map(item => `<tr><td>${item.op}</td><td>${item.time}</td><td>${item.space}</td></tr>`).join("");
  } else if (complexitySection) complexitySection.classList.add("hidden");
  const quizSection = document.getElementById("roadmapStepQuizSection");
  const problemsSection = document.getElementById("roadmapStepProblemsSection");
  if (step.type === "quiz" && quizSection && problemsSection) {
    quizSection.classList.remove("hidden");
    problemsSection.classList.add("hidden");
    const quizContent = document.getElementById("roadmapStepQuizContent");
    const isCompleted = userProgress.completedRoadmapSteps.includes(step.id);
    if (quizContent) quizContent.innerHTML = step.quiz.map((q, qIndex) => `<div class="quiz-question-container" data-qindex="${qIndex}"><div class="quiz-question-text">${qIndex + 1}. ${q.question}</div><ul class="quiz-options-list">${q.options.map((opt, oIndex) => `<li class="quiz-option-item" ${isCompleted && oIndex === q.correct ? 'class="quiz-option-item correct"' : ''} ${isCompleted ? 'style="pointer-events:none; cursor:default;"' : ''} data-oindex="${oIndex}" onclick="${isCompleted ? '' : `selectQuizOption(${step.id}, ${qIndex}, ${oIndex}, this)`}">${opt}</li>`).join("")}</ul><div class="quiz-feedback ${isCompleted ? 'correct' : 'hidden'}">${isCompleted ? `Correct! ${q.explanation}` : ''}</div></div>`).join("");
    const submitBtn = document.getElementById("roadmapStepSubmitQuizBtn");
    if (submitBtn) {
      if (isCompleted) submitBtn.style.display = "none";
      else { submitBtn.style.display = "block"; submitBtn.onclick = () => submitRoadmapQuiz(stepIndex, type); }
    }
  } else if (quizSection && problemsSection) {
    quizSection.classList.add("hidden");
    problemsSection.classList.remove("hidden");
    const problemsList = document.getElementById("roadmapStepProblemsList");
    problemsList.innerHTML = (step.problems || []).map(pid => {
      const prob = practiceProblems.find(p => p.id === pid);
      if (!prob) return "";
      const isSolved = userProgress.completedProblems.includes(pid);
      return `<li class="roadmap-problem-item"><div class="roadmap-problem-info"><span class="roadmap-problem-title">${prob.title}</span><div class="roadmap-problem-meta"><span class="difficulty-badge ${getDifficultyClass(prob.difficulty)}">${prob.difficulty}</span><span>Acceptance: ${prob.acceptance}</span></div></div><div class="roadmap-problem-action">${isSolved ? `<span class="roadmap-problem-status completed"><i class="fas fa-check-circle"></i> Solved</span>` : `<button class="btn btn-outline btn-sm" onclick="openCodingProblem(${pid})"><i class="fas fa-play"></i> Solve</button>`}</div></li>`;
    }).join("");
  }
  modal.classList.add("active");
}

function selectQuizOption(stepId, qIndex, oIndex, element) {
  const container = element.closest(".quiz-question-container");
  container.querySelectorAll(".quiz-option-item").forEach(el => el.classList.remove("selected"));
  element.classList.add("selected");
  currentQuizAnswers[qIndex] = oIndex;
}

function openCodingProblem(problemId) {
  const modal = document.getElementById("roadmapStepModal");
  if (modal) modal.classList.remove("active");
  if (typeof handleProblemClick === 'function') handleProblemClick(problemId);
}

function submitRoadmapQuiz(stepIndex, type = 'basic') {
  const roadmapSteps = window.roadmapSteps || [];
  const advancedRoadmapSteps = window.advancedRoadmapSteps || [];
  const userProgress = window.userProgress || {};
  const steps = type === 'basic' ? roadmapSteps : advancedRoadmapSteps;
  const step = steps[stepIndex];
  const container = document.getElementById("roadmapStepQuizContent");
  let allCorrect = true, allAnswered = true;
  step.quiz.forEach((q, qIndex) => { if (currentQuizAnswers[qIndex] === undefined) allAnswered = false; });
  if (!allAnswered) { if (typeof showNotification === 'function') showNotification("Please answer all questions before submitting!", "error"); return; }
  step.quiz.forEach((q, qIndex) => {
    const qContainer = container.querySelector(`[data-qindex="${qIndex}"]`);
    const feedbackEl = qContainer.querySelector(".quiz-feedback");
    const selected = currentQuizAnswers[qIndex];
    qContainer.querySelectorAll(".quiz-option-item").forEach((optEl, oIndex) => {
      optEl.classList.remove("selected", "correct", "incorrect");
      optEl.style.pointerEvents = "none";
      optEl.style.cursor = "default";
      if (oIndex === q.correct) optEl.classList.add("correct");
      else if (oIndex === selected) optEl.classList.add("incorrect");
    });
    feedbackEl.classList.remove("hidden", "correct", "incorrect");
    if (selected === q.correct) { feedbackEl.textContent = `Correct! ${q.explanation}`; feedbackEl.className = "quiz-feedback correct"; }
    else { allCorrect = false; feedbackEl.textContent = `Incorrect. ${q.explanation}`; feedbackEl.className = "quiz-feedback incorrect"; }
  });
  if (allCorrect) {
    if (!userProgress.completedRoadmapSteps.includes(step.id)) { userProgress.completedRoadmapSteps.push(step.id); if (typeof addXP === 'function') addXP(50); if (typeof saveUserData === 'function') saveUserData(); if (typeof showNotification === 'function') showNotification(`🎉 Quiz Passed! Step ${step.id} Completed. +50 XP!`, "success"); if (typeof updateDashboard === 'function') updateDashboard(); if (typeof updateGamification === 'function') updateGamification(); initRoadmap(); }
    const submitBtn = document.getElementById("roadmapStepSubmitQuizBtn");
    if (submitBtn) submitBtn.style.display = "none";
  } else {
    if (typeof showNotification === 'function') showNotification("Some answers were incorrect. Please review and try again!", "error");
    setTimeout(() => {
      step.quiz.forEach((q, qIndex) => {
        const qContainer = container.querySelector(`[data-qindex="${qIndex}"]`);
        const feedbackEl = qContainer.querySelector(".quiz-feedback");
        if (currentQuizAnswers[qIndex] !== q.correct) {
          qContainer.querySelectorAll(".quiz-option-item").forEach(optEl => { optEl.style.pointerEvents = "auto"; optEl.style.cursor = "pointer"; optEl.classList.remove("correct", "incorrect"); if (optEl.classList.contains("selected")) optEl.classList.remove("selected"); });
          feedbackEl.classList.add("hidden");
          delete currentQuizAnswers[qIndex];
        }
      });
    }, 3000);
  }
}

window.openRoadmapStepModal = openRoadmapStepModal;
window.selectQuizOption = selectQuizOption;
window.openCodingProblem = openCodingProblem;

export { initRoadmap, isRoadmapStepCompleted, renderBasicRoadmap, renderAdvancedRoadmap, openRoadmapStepModal, selectQuizOption, openCodingProblem, submitRoadmapQuiz };
