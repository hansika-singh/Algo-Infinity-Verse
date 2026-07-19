// ============================================
// SPACED REPETITION
// ============================================
// REVISION_INTERVALS is declared in data/revision-intervals.js
/* global REVISION_INTERVALS */

function scheduleNextRevision(topicId) {
  if (!userProgress.revisionSchedule || !userProgress.revisionSchedule[topicId]) {
    console.error(`Topic "${topicId}" not found.`);
    return;
  }
  const now = new Date();
  const schedule = userProgress.revisionSchedule[topicId];
  const intervals = window.revisionIntervals || [1, 3, 7, 14, 30];
  const maxIdx = intervals.length - 1;
  const safeStage = Math.min(Math.max(0, schedule.currentStage), maxIdx);
  const daysToAdd = intervals[safeStage] || 1;
  const nextDate = new Date();
  nextDate.setDate(now.getDate() + daysToAdd);
  schedule.nextReviewDate = nextDate.toISOString();
  schedule.history.push({ reviewedAt: now.toISOString(), stageCompleted: schedule.currentStage, daysCalculated: daysToAdd, nextReviewDueDate: nextDate.toISOString() });
  if (schedule.currentStage < intervals.length - 1) schedule.currentStage++;
  if (typeof saveUserData === "function") saveUserData();
  else localStorage.setItem("algoInfinityVerse", JSON.stringify(userProgress));
  void 0;
}

function handleQuizCompletionForRevision(topicId, scorePercentage) {
  if (scorePercentage >= 70) {
    scheduleNextRevision(topicId);
    injectRevisionSchedulerUI(topicId);
  }
}

function injectRevisionSchedulerUI(topicId) {
  if (!userProgress.revisionSchedule?.[topicId]) return;

  const targetHeader = document.querySelector(".arr-lesson-header") || document.querySelector("h3") || document.querySelector("h2");
  if (!targetHeader) { void 0; return; }
  const existing = document.getElementById("revision-scheduler-badge");
  if (existing) existing.remove();
  const schedule = userProgress.revisionSchedule[topicId];
  const now = new Date();
  let statusHTML = "";
  if (!schedule.nextReviewDate) {
    statusHTML = `<span class="rev-badge rev-new">🆕 Not Scheduled Yet</span>`;
  } else {
    const nextDate = new Date(schedule.nextReviewDate);
    if (now >= nextDate) statusHTML = `<span class="rev-badge rev-due">⚡ Review Due Now!</span>`;
    else statusHTML = `<span class="rev-badge rev-waiting">📅 Next Review: ${nextDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>`;
  }
  const container = document.createElement("div");
  container.id = "revision-scheduler-badge";
  container.className = "revision-scheduler-card";
  container.style.maxWidth = "600px";
  container.style.marginTop = "1rem";
  container.innerHTML = `<div class="rev-card-content"><div class="rev-info"><span class="rev-title">🔄 Spaced Repetition Scheduler</span><span class="rev-stage">Stage ${schedule.currentStage}/4</span></div>${statusHTML}</div><div class="rev-history-text">History Track: ${schedule.history.length} checkpoints</div>`;
  targetHeader.parentNode.insertBefore(container, targetHeader.nextSibling);
}

window.rateRecallDifficulty = async function(quality) {
  if (!currentProblem) return;
  const problemId = currentProblem.id;

  if (!userProgress.spacedRepetition) userProgress.spacedRepetition = {};
  const existing = userProgress.spacedRepetition[problemId] || { repetitions: 0, easeFactor: 2.5, interval: 0 };

  try {
    const res = await fetch(`/api/spaced-repetition/${problemId}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ existing, quality })
    });
    const data = await res.json();
    if (data.success && data.card) {
      userProgress.spacedRepetition[problemId] = data.card;
      if (quality >= 3) {
        userProgress.reviewStreak = (userProgress.reviewStreak || 0) + 1;
      }
      saveUserData();
      showNotification(`Scheduled! Next review in ${data.card.interval} days 📅`, "success");
    } else {
      showNotification("Could not schedule on cloud. Saved locally.", "info");
    }
  } catch (err) {
    void 0;

    // Client-side fallback computation
    const q = Math.max(0, Math.min(5, Number(quality)));
    let { repetitions = 0, easeFactor = 2.5, interval = 0 } = existing;
    if (q < 3) {
      repetitions = 0;
      interval = 1;
    } else {
      repetitions += 1;
      if (repetitions === 1) interval = 1;
      else if (repetitions === 2) interval = 6;
      else interval = Math.round(interval * easeFactor);
      userProgress.reviewStreak = (userProgress.reviewStreak || 0) + 1;
    }
    easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    userProgress.spacedRepetition[problemId] = {
      problemId,
      repetitions,
      easeFactor: Math.round(easeFactor * 100) / 100,
      interval,
      lastReviewed: new Date().toISOString(),
      nextReviewDate: nextReviewDate.toISOString(),
      lastQuality: q
    };
    saveUserData();
    showNotification(`Next review in ${interval} days 📅`, "success");
  }

  const submittedId = currentProblem.id;
  closeQuizEditor();
  clearEditorDraft(submittedId);
  if (typeof refreshReviewQueue === "function") {
    refreshReviewQueue();
  }
};
