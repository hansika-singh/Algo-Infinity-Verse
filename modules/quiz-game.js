let currentQuiz = null;
let lastQuizReview = null;
let lastQuizResultData = null;
let quizStartTime = null;
let quizTimerInterval = null;

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [array[i], array[j]] = [array[j], array[i]]; }
  return array;
}

function getQuizTopicKey(topic) {
  const normalize = s => String(s).trim().toLowerCase().replace(/\s+/g, " ");
  const map = { arrays: "arrays", strings: "strings", "linked list": "linkedlist", linkedlist: "linkedlist", trees: "trees", graphs: "graphs", "dynamic programming": "dp", dp: "dp" };
  if (typeof topic === "string") return map[normalize(topic)] || null;
  const name = normalize(topic.name);
  return map[name] || null;
}

function initQuizSection() {
  const dsaTopics = window.dsaTopics || [];
  const quizGrid = document.querySelector(".quiz-grid");
  if (!quizGrid) { console.warn("Quiz grid element not found"); return; }
  quizGrid.innerHTML = "";
  dsaTopics.forEach((topic, index) => {
    const topicKey = getQuizTopicKey(topic);
    if (!topicKey) return;
    const card = document.createElement("div");
    card.className = "quiz-card animate-in";
    card.style.animationDelay = `${index * 0.1}s`;
    card.innerHTML = `<div class="quiz-card-icon">${topic.icon}</div><h3 class="quiz-card-title">${topic.name}</h3><p class="quiz-card-desc">Test your knowledge with 10 unique questions</p><div class="quiz-card-meta"><span class="quiz-count">10 Questions</span><span class="quiz-difficulty ${getDifficultyClass(topic.difficulty)}">${topic.difficulty}</span></div><div class="quiz-progress-bar"><div class="quiz-progress-fill" id="progress-${topicKey}"></div></div><div class="quiz-stats"><span>Best: <strong id="best-${topicKey}">--</strong></span><span>Attempts: <strong id="attempts-${topicKey}">0</strong></span></div><button class="btn btn-primary start-quiz-btn" data-topic="${topicKey}"><i class="fas fa-play"></i> Start Quiz</button>`;
    quizGrid.appendChild(card);
    card.addEventListener("click", () => startQuiz(topicKey));
    const startBtn = card.querySelector(".start-quiz-btn");
    if (startBtn) startBtn.addEventListener("click", (e) => { e.stopPropagation(); startQuiz(topicKey); });
    updateQuizProgressDisplay(topic);
  });
}

function getDifficultyClass(difficulty) {
  const d = difficulty.toLowerCase();
  if (d.includes("easy")) return "easy";
  if (d.includes("medium")) return "medium";
  if (d.includes("hard")) return "hard";
  return "medium";
}

function updateQuizProgressDisplay(topic) {
  const userProgress = window.userProgress || {};
  const topicKey = getQuizTopicKey(topic);
  const progressFill = document.getElementById(`progress-${topicKey}`);
  const bestScoreEl = document.getElementById(`best-${topicKey}`);
  const attemptsEl = document.getElementById(`attempts-${topicKey}`);
  if (!progressFill || !bestScoreEl || !attemptsEl) return;
  const quizData = userProgress.quizScores[topicKey] || { bestScore: 0, attempts: 0, totalXP: 0 };
  progressFill.style.width = `${quizData.attempts > 0 ? 100 : 0}%`;
  bestScoreEl.textContent = `${quizData.bestScore}%`;
  attemptsEl.textContent = quizData.attempts;
}

function startQuiz(topic) {
  const quizQuestions = window.quizQuestions || {};
  const userProgress = window.userProgress || {};
  const topicKey = getQuizTopicKey(topic);
  const questions = quizQuestions[topicKey];
  if (!questions || questions.length === 0) { if (typeof showNotification === 'function') showNotification('No quiz questions available!', 'error'); return; }
  const resultEl = document.getElementById("topicQuizResult");
  if (resultEl) { resultEl.classList.add("hidden"); resultEl.innerHTML = ""; }
  const qText = document.getElementById("topicQuizQuestionText");
  if (qText) qText.style.display = "block";
  const qOpts = document.getElementById("topicQuizOptions");
  if (qOpts) qOpts.style.display = "block";
  const qProg = document.getElementById("topicQuizProgress");
  if (qProg) qProg.style.display = "block";
  const qCount = document.getElementById("topicQuizCounter");
  if (qCount) qCount.style.display = "block";
  currentQuiz = { topic: topicKey, questions: shuffleArray([...questions]), currentQuestionIndex: 0, score: 0, answers: [] };
  openQuizModal();
  startQuizTimer(topicKey);
  renderQuizQuestion();
}

function startQuizTimer(topicKey) {
  const userProgress = window.userProgress || {};
  clearInterval(quizTimerInterval);
  quizStartTime = Date.now();
  updateQuizTimerDisplay(topicKey);
  quizTimerInterval = setInterval(() => updateQuizTimerDisplay(topicKey), 1000);
}

function stopQuizTimer() { clearInterval(quizTimerInterval); return Math.floor((Date.now() - quizStartTime) / 1000); }

function updateQuizTimerDisplay(topicKey) {
  const userProgress = window.userProgress || {};
  const timerEl = document.getElementById("quizTimer");
  const bestTimeEl = document.getElementById("bestQuizTime");
  if (!timerEl || !bestTimeEl) return;
  const elapsed = Math.floor((Date.now() - quizStartTime) / 1000);
  timerEl.textContent = formatQuizTime(elapsed);
  const bestTime = userProgress.bestQuizTimes[topicKey];
  bestTimeEl.textContent = bestTime ? formatQuizTime(bestTime) : "--:--";
}

function formatQuizTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function openQuizModal() {
  const modal = document.getElementById("quizModal");
  if (modal) modal.classList.add("active");
}

function closeQuizModal() {
  const modal = document.getElementById("quizModal");
  if (modal) modal.classList.remove("active");
  const resultEl = document.getElementById("topicQuizResult");
  if (resultEl) { resultEl.classList.add("hidden"); resultEl.innerHTML = ""; }
  clearInterval(quizTimerInterval);
  currentQuiz = null;
}

function renderQuizQuestion() {
  if (!currentQuiz || currentQuiz.currentQuestionIndex >= currentQuiz.questions.length) { finishQuiz(); return; }
  const question = currentQuiz.questions[currentQuiz.currentQuestionIndex];
  const questionEl = document.getElementById("topicQuizQuestionText");
  const optionsEl = document.getElementById("topicQuizOptions");
  const progressEl = document.getElementById("topicQuizProgress");
  const counterEl = document.getElementById("topicQuizCounter");
  if (questionEl) questionEl.textContent = `Q${currentQuiz.currentQuestionIndex + 1}: ${question.question}`;
  if (counterEl) counterEl.textContent = `${currentQuiz.currentQuestionIndex + 1} / ${currentQuiz.questions.length}`;
  if (progressEl) progressEl.style.width = `${((currentQuiz.currentQuestionIndex + 1) / currentQuiz.questions.length) * 100}%`;
  if (optionsEl) {
    optionsEl.innerHTML = question.options.map((option, idx) => `<div class="quiz-option" data-index="${idx}"><span class="option-letter">${String.fromCharCode(65 + idx)}</span><span class="option-text">${option}</span></div>`).join("");
    optionsEl.querySelectorAll(".quiz-option").forEach(opt => opt.addEventListener("click", () => selectQuizAnswer(parseInt(opt.dataset.index))));
  }
}

function selectQuizAnswer(selectedIndex) {
  clearInterval(quizTimerInterval);
  const question = currentQuiz.questions[currentQuiz.currentQuestionIndex];
  const isCorrect = selectedIndex === question.correct;
  currentQuiz.answers.push({ questionId: question.id, selected: selectedIndex, correct: question.correct, isCorrect: isCorrect });
  if (isCorrect) currentQuiz.score++;
  const optionsEl = document.getElementById("topicQuizOptions");
  if (!optionsEl) return;
  optionsEl.querySelectorAll(".quiz-option").forEach((opt, idx) => {
    opt.classList.add("selected");
    if (idx === question.correct) opt.classList.add("correct");
    else if (idx === selectedIndex && !isCorrect) opt.classList.add("incorrect");
    opt.style.pointerEvents = "none";
  });
  setTimeout(() => { currentQuiz.currentQuestionIndex++; renderQuizQuestion(); }, 1200);
}

function finishQuiz() {
  const userProgress = window.userProgress || {};
  const topicKey = currentQuiz.topic;
  const score = currentQuiz.score;
  const total = currentQuiz.questions.length;
  const percentage = Math.round((score / total) * 100);
  const completionTime = stopQuizTimer();
  if (!userProgress.quizScores[topicKey]) userProgress.quizScores[topicKey] = { bestScore: 0, attempts: 0, totalXP: 0 };
  const record = userProgress.quizScores[topicKey];
  if (!userProgress.bestQuizTimes[topicKey] || completionTime < userProgress.bestQuizTimes[topicKey]) userProgress.bestQuizTimes[topicKey] = completionTime;
  record.attempts++;
  if (percentage > record.bestScore) record.bestScore = percentage;
  const xpEarned = Math.round(score * 10);
  if (typeof addXP === 'function') addXP(xpEarned);
  record.totalXP += xpEarned;
  if (typeof recordAnalyticsEvent === 'function') recordAnalyticsEvent("quiz", { topicKey, score, total, percentage, xpEarned, completionTime });
  if (typeof recordDailyActivity === 'function') recordDailyActivity(1);
  if (typeof handleQuizCompletionForRevision === 'function') handleQuizCompletionForRevision(topicKey, percentage);
  if (typeof saveUserData === 'function') saveUserData();
  const qText = document.getElementById("topicQuizQuestionText");
  if (qText) qText.style.display = "none";
  const qOpts = document.getElementById("topicQuizOptions");
  if (qOpts) qOpts.style.display = "none";
  lastQuizReview = JSON.parse(JSON.stringify(currentQuiz));
  lastQuizResultData = { score, total, percentage, xpEarned, completionTime };
  const resultEl = document.getElementById("topicQuizResult");
  if (resultEl) resultEl.classList.remove("hidden");
  showQuizResults(score, total, percentage, xpEarned, completionTime);
  const qProg = document.getElementById("topicQuizProgress");
  if (qProg) qProg.style.display = "none";
  const qCount = document.getElementById("topicQuizCounter");
  if (qCount) qCount.style.display = "none";
  updateQuizProgressDisplay(topicKey);
  if (typeof updateDashboard === 'function') updateDashboard();
  if (typeof updateGamification === 'function') updateGamification();
}

function showQuizResults(score, total, percentage, xpEarned, completionTime) {
  const resultEl = document.getElementById("topicQuizResult");
  if (!resultEl) return;
  resultEl.classList.remove("hidden");
  let icon = "", message = "";
  if (percentage >= 90) { icon = "🏆"; message = "Outstanding! Perfect mastery!"; }
  else if (percentage >= 70) { icon = "🌟"; message = "Great job! Solid understanding!"; }
  else if (percentage >= 50) { icon = "👍"; message = "Good effort! Keep practicing!"; }
  else { icon = "📚"; message = "Keep learning! Review the topic and try again!"; }
  resultEl.innerHTML = `<div class="quiz-result-content"><div class="quiz-result-icon">${icon}</div><h3>${message}</h3><div class="quiz-score-circle"><span class="score-number">${percentage}%</span></div><p>You got <strong>${score}</strong> out of <strong>${total}</strong> questions correct</p><p class="xp-gained">+${xpEarned} XP earned!</p><p class="completion-time">Completion Time: ${formatQuizTime(completionTime)}</p></div>`;
  resultEl.innerHTML += `<button class="btn btn-primary review-btn" onclick="showQuizReview()">📖 Review Answers</button>`;
}

function showQuizReview() {
  if (!lastQuizReview || !lastQuizReview.questions || !lastQuizReview.answers) { if (typeof showNotification === 'function') showNotification("No review data found", "error"); return; }
  const resultEl = document.getElementById("topicQuizResult");
  const escapeHtml = (value = "") =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&`#39`;");

  let html = `<div class="quiz-review"><h2>📖 Quiz Review</h2><div class="quiz-review-container"><div class="quiz-review-items">`;
  lastQuizReview.questions.forEach((q, index) => {
    const answer = lastQuizReview.answers[index] || {};
    const yourAnswerText = answer.selected !== undefined ? q.options[answer.selected] : "Not Answered";
    const correctnessIcon = answer.isCorrect ? "✅" : "❌";
    html += `<div class="review-item"><h4>Q${index + 1}. ${escapeHtml(q.question)}</h4><p><strong>Your Answer:</strong> ${escapeHtml(yourAnswerText)} ${correctnessIcon}</p><p class="correct-answer"><strong>Correct Answer:</strong> ${escapeHtml(q.options[q.correct])}</p><p><strong>Explanation:</strong> ${escapeHtml(q.explanation)}</p></div>`;
  });
  html += `</div></div><div class="quiz-actions" style="border-top:none; justify-content:space-between; padding-top:1.25rem; background:transparent;">
    <button class="btn btn-primary" onclick="restoreQuizResults()">Back</button>
    <button class="btn btn-secondary" onclick="closeQuizModal()">Close</button>
  </div></div>`;
  resultEl.innerHTML = html;
  const container = resultEl.querySelector('.quiz-review-container');
  if (container) container.scrollTop = 0;
}

function restoreQuizResults() {
  if (!lastQuizResultData) return;
  showQuizResults(lastQuizResultData.score, lastQuizResultData.total, lastQuizResultData.percentage, lastQuizResultData.xpEarned, lastQuizResultData.completionTime);
}

window.showQuizReview = showQuizReview;
window.restoreQuizResults = restoreQuizResults;
window.closeQuizModal = closeQuizModal;
window.startQuiz = startQuiz;

export { initQuizSection, closeQuizModal, startQuiz, shuffleArray, formatQuizTime };
