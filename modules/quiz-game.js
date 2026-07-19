import { shuffle, calculatePercentage, calculateXp, updateQuizRecord } from './quizScoring.js';

let currentQuiz = null;
let lastQuizReview = null;
let lastQuizResultData = null;
let quizStartTime = null;
let quizTimerInterval = null;

function shuffleArray(array) {
  return shuffle(array);
}

function getQuizTopicKey(topic) {
  const normalize = s => String(s).trim().toLowerCase().replace(/\s+/g, " ");
  const map = { arrays: "arrays", strings: "strings", "linked list": "linkedlist", linkedlist: "linkedlist", trees: "trees", graphs: "graphs", "dynamic programming": "dp", dp: "dp", heaps: "heaps" };
  if (typeof topic === "string") return map[normalize(topic)] || null;
  const name = normalize(topic.name);
  return map[name] || null;
}

function initQuizSection() {
  const dsaTopics = window.dsaTopics || [];
  const quizGrid = document.querySelector('.quiz-grid');
  if (!quizGrid) {
    void 0;
    return;
  }
  quizGrid.innerHTML = '';
  dsaTopics.forEach((topic, index) => {
    const topicKey = getQuizTopicKey(topic);
    if (!topicKey) return;
    const card = document.createElement('div');
    card.className = 'quiz-card animate-in';
    card.style.animationDelay = `${index * 0.1}s`;
    card.innerHTML = `<div class="quiz-card-icon">${topic.icon}</div><h3 class="quiz-card-title">${topic.name}</h3><p class="quiz-card-desc">Test your knowledge with 10 unique questions</p><div class="quiz-card-meta"><span class="quiz-count">10 Questions</span><span class="quiz-difficulty ${getDifficultyClass(topic.difficulty)}">${topic.difficulty}</span></div><div class="quiz-progress-bar"><div class="quiz-progress-fill" id="progress-${topicKey}"></div></div><div class="quiz-stats"><span>Best: <strong id="best-${topicKey}">--</strong></span><span>Attempts: <strong id="attempts-${topicKey}">0</strong></span></div><button class="btn btn-primary start-quiz-btn" data-topic="${topicKey}"><i class="fas fa-play"></i> Start Quiz</button>`;
    quizGrid.appendChild(card);
    card.addEventListener('click', () => startQuiz(topicKey));
    const startBtn = card.querySelector('.start-quiz-btn');
    if (startBtn)
      startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        startQuiz(topicKey);
      });
    updateQuizProgressDisplay(topic);
  });
}

function getDifficultyClass(difficulty) {
  const d = difficulty.toLowerCase();
  if (d.includes('easy')) return 'easy';
  if (d.includes('medium')) return 'medium';
  if (d.includes('hard')) return 'hard';
  return 'medium';
}

function updateQuizProgressDisplay(topic) {
  const userProgress = window.userProgress || {};
  const topicKey = getQuizTopicKey(topic);
  const progressFill = document.getElementById(`progress-${topicKey}`);
  const bestScoreEl = document.getElementById(`best-${topicKey}`);
  const attemptsEl = document.getElementById(`attempts-${topicKey}`);
  if (!progressFill || !bestScoreEl || !attemptsEl) return;
  const quizData = userProgress.quizScores?.[topicKey] || { bestScore: 0, attempts: 0, totalXP: 0 };
  progressFill.style.width = `${quizData.attempts > 0 ? 100 : 0}%`;
  bestScoreEl.textContent = `${quizData.bestScore}%`;
  attemptsEl.textContent = quizData.attempts;
}

/**
 * Start a topic quiz. On the main index page this navigates to the
 * dedicated full-page quiz experience. On the quiz page itself the
 * modal-equivalent flow is handled by pages/topic-quiz/topic-quiz.js.
 */
function startQuiz(topic) {
  const quizQuestions = window.quizQuestions || {};
  const topicKey = getQuizTopicKey(topic);
  const questions = quizQuestions[topicKey];
  if (!questions || questions.length === 0) {
    if (typeof showNotification === 'function')
      showNotification('No quiz questions available!', 'error');
    return;
  }

  // Store topic for the full-page quiz and navigate
  try {
    sessionStorage.setItem('topicQuizTopic', topicKey);
  } catch (e) { /* ignore */ }

  // Navigate to the dedicated full-page quiz
  window.location.href = '/pages/topic-quiz/topic-quiz.html?topic=' + encodeURIComponent(topicKey);
}

function startQuizTimer(topicKey) {
  clearInterval(quizTimerInterval);
  quizStartTime = Date.now();
  updateQuizTimerDisplay(topicKey);
  quizTimerInterval = setInterval(() => updateQuizTimerDisplay(topicKey), 1000);
}

function stopQuizTimer() {
  clearInterval(quizTimerInterval);
  return Math.floor((Date.now() - quizStartTime) / 1000);
}

function updateQuizTimerDisplay(topicKey) {
  const userProgress = window.userProgress || {};
  const timerEl = document.getElementById('quizTimer');
  const bestTimeEl = document.getElementById('bestQuizTime');
  if (!timerEl || !bestTimeEl) return;
  const elapsed = Math.floor((Date.now() - quizStartTime) / 1000);
  timerEl.textContent = formatQuizTime(elapsed);
  const bestTime = userProgress.bestQuizTimes[topicKey];
  bestTimeEl.textContent = bestTime ? formatQuizTime(bestTime) : '--:--';
}

function formatQuizTime(seconds) {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function openQuizModal() {
  const modal = document.getElementById('quizModal');
  if (modal) modal.classList.add('active');
}

function closeQuizModal() {
  const modal = document.getElementById('quizModal');
  if (modal) modal.classList.remove('active');
  const resultEl = document.getElementById('topicQuizResult');
  if (resultEl) {
    resultEl.classList.add('hidden');
    resultEl.innerHTML = '';
  }
  clearInterval(quizTimerInterval);
  currentQuiz = null;
}

function getQuizLiveRegion() {
  let liveRegion = document.getElementById("topicQuizLiveRegion");
  if (!liveRegion) {
    liveRegion = document.createElement("div");
    liveRegion.id = "topicQuizLiveRegion";
    liveRegion.className = "sr-only";
    liveRegion.setAttribute("role", "status");
    liveRegion.setAttribute("aria-live", "polite");
    document.body.appendChild(liveRegion);
  }
  return liveRegion;
}

function announceQuizStatus(message) {
  const liveRegion = getQuizLiveRegion();
  liveRegion.textContent = "";
  // Force a reflow so repeated identical messages are still announced.
  void liveRegion.offsetWidth;
  liveRegion.textContent = message;
}

function focusQuizOption(optionsEl, index) {
  const options = optionsEl.querySelectorAll(".quiz-option");
  const target = options[index];
  if (target) target.focus();
}

/**
 * Pure helper: given a keyboard key, the currently focused option index,
 * and the total number of options, returns the index that should receive
 * focus next (or null when the key does not move focus).
 * Exported for unit testing.
 */
function getNextOptionIndex(key, currentIndex, total) {
  if (total <= 0) return null;
  switch (key) {
    case "ArrowDown":
    case "ArrowRight":
      return (currentIndex + 1) % total;
    case "ArrowUp":
    case "ArrowLeft":
      return (currentIndex - 1 + total) % total;
    case "Home":
      return 0;
    case "End":
      return total - 1;
    default:
      return null;
  }
}

function handleQuizOptionKeydown(e, optionsEl) {
  const options = Array.from(optionsEl.querySelectorAll(".quiz-option"));
  const currentIndex = options.indexOf(e.currentTarget);
  if (currentIndex === -1) return;

  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    selectQuizAnswer(parseInt(e.currentTarget.dataset.index));
    return;
  }

  const nextIndex = getNextOptionIndex(e.key, currentIndex, options.length);
  if (nextIndex !== null) {
    e.preventDefault();
    focusQuizOption(optionsEl, nextIndex);
  }
}

function renderQuizQuestion() {
  if (!currentQuiz || currentQuiz.currentQuestionIndex >= currentQuiz.questions.length) {
    finishQuiz();
    return;
  }
  const question = currentQuiz.questions[currentQuiz.currentQuestionIndex];
  const questionEl = document.getElementById("topicQuizQuestionText");
  const optionsEl = document.getElementById("topicQuizOptions");
  const progressEl = document.getElementById("topicQuizProgress");
  const counterEl = document.getElementById("topicQuizCounter");
  const questionNumber = currentQuiz.currentQuestionIndex + 1;
  const totalQuestions = currentQuiz.questions.length;
  if (questionEl) {
    questionEl.textContent = `Q${questionNumber}: ${question.question}`;
    questionEl.id = questionEl.id || "topicQuizQuestionText";
  }
  if (counterEl) counterEl.textContent = `${questionNumber} / ${totalQuestions}`;
  if (progressEl) {
    progressEl.style.width = `${(questionNumber / totalQuestions) * 100}%`;
    progressEl.setAttribute("role", "progressbar");
    progressEl.setAttribute("aria-valuemin", "0");
    progressEl.setAttribute("aria-valuemax", "100");
    progressEl.setAttribute("aria-valuenow", String(Math.round((questionNumber / totalQuestions) * 100)));
    progressEl.setAttribute("aria-label", `Question ${questionNumber} of ${totalQuestions}`);
  }
  if (optionsEl) {
    optionsEl.setAttribute("role", "radiogroup");
    if (questionEl) optionsEl.setAttribute("aria-labelledby", questionEl.id);
    optionsEl.innerHTML = question.options
      .map(
        (option, idx) =>
          `<div class="quiz-option" data-index="${idx}" role="radio" aria-checked="false" tabindex="${idx === 0 ? "0" : "-1"}"><span class="option-letter">${String.fromCharCode(65 + idx)}</span><span class="option-text">${option}</span></div>`
      )
      .join("");
    optionsEl.querySelectorAll(".quiz-option").forEach((opt) => {
      opt.addEventListener("click", () => selectQuizAnswer(parseInt(opt.dataset.index)));
      opt.addEventListener("keydown", (e) => handleQuizOptionKeydown(e, optionsEl));
    });
    announceQuizStatus(`Question ${questionNumber} of ${totalQuestions}: ${question.question}`);
  }
}

function selectQuizAnswer(selectedIndex) {
  clearInterval(quizTimerInterval);
  const question = currentQuiz.questions[currentQuiz.currentQuestionIndex];
  const isCorrect = selectedIndex === question.correct;

  if (window.spacedRepetition) {
    window.spacedRepetition.scheduleReview(
      question.id,
      currentQuiz.topic || 'Quiz',
      'Medium',
      isCorrect,
      30
    );
  }

  currentQuiz.answers.push({
    questionId: question.id,
    selected: selectedIndex,
    correct: question.correct,
    isCorrect: isCorrect,
  });
  if (isCorrect) currentQuiz.score++;
  const optionsEl = document.getElementById('topicQuizOptions');
  if (!optionsEl) return;
  optionsEl.querySelectorAll(".quiz-option").forEach((opt, idx) => {
    opt.classList.add("selected");
    opt.setAttribute("tabindex", "-1");
    opt.setAttribute("aria-checked", idx === selectedIndex ? "true" : "false");
    if (idx === question.correct) opt.classList.add("correct");
    else if (idx === selectedIndex && !isCorrect) opt.classList.add("incorrect");
    opt.style.pointerEvents = "none";
  });
  announceQuizStatus(isCorrect ? "Correct answer!" : `Incorrect. The correct answer is ${question.options[question.correct]}.`);
  setTimeout(() => { currentQuiz.currentQuestionIndex++; renderQuizQuestion(); }, 1200);
}

function finishQuiz() {
  const userProgress = window.userProgress || {};
  const topicKey = currentQuiz.topic;
  const score = currentQuiz.score;
  const total = currentQuiz.questions.length;
  const percentage = calculatePercentage(score, total);
  const completionTime = stopQuizTimer();
  if (!userProgress.quizScores[topicKey]) userProgress.quizScores[topicKey] = { bestScore: 0, attempts: 0, totalXP: 0 };
  if (!userProgress.bestQuizTimes[topicKey] || completionTime < userProgress.bestQuizTimes[topicKey]) userProgress.bestQuizTimes[topicKey] = completionTime;
  const xpEarned = calculateXp(score);
  userProgress.quizScores[topicKey] = updateQuizRecord(userProgress.quizScores[topicKey], { percentage, xpEarned });
  const record = userProgress.quizScores[topicKey];
  if (typeof addXP === 'function') addXP(xpEarned);
  if (typeof recordAnalyticsEvent === 'function') recordAnalyticsEvent("quiz", { topicKey, score, total, percentage, xpEarned, completionTime });
  if (typeof recordDailyActivity === 'function') recordDailyActivity(1);
  if (typeof handleQuizCompletionForRevision === 'function')
    handleQuizCompletionForRevision(topicKey, percentage);
  if (typeof saveUserData === 'function') saveUserData();
  const qText = document.getElementById('topicQuizQuestionText');
  if (qText) qText.style.display = 'none';
  const qOpts = document.getElementById('topicQuizOptions');
  if (qOpts) qOpts.style.display = 'none';
  lastQuizReview = JSON.parse(JSON.stringify(currentQuiz));
  lastQuizResultData = { score, total, percentage, xpEarned, completionTime };
  const resultEl = document.getElementById('topicQuizResult');
  if (resultEl) resultEl.classList.remove('hidden');
  showQuizResults(score, total, percentage, xpEarned, completionTime);
  const qProg = document.getElementById('topicQuizProgress');
  if (qProg) qProg.style.display = 'none';
  const qCount = document.getElementById('topicQuizCounter');
  if (qCount) qCount.style.display = 'none';
  updateQuizProgressDisplay(topicKey);
  if (typeof updateDashboard === 'function') updateDashboard();
  if (typeof updateGamification === 'function') updateGamification();
}

function showQuizResults(score, total, percentage, xpEarned, completionTime) {
  const resultEl = document.getElementById('topicQuizResult');
  if (!resultEl) return;
  resultEl.classList.remove('hidden');
  let icon = '',
    message = '';
  if (percentage >= 90) {
    icon = '🏆';
    message = 'Outstanding! Perfect mastery!';
  } else if (percentage >= 70) {
    icon = '🌟';
    message = 'Great job! Solid understanding!';
  } else if (percentage >= 50) {
    icon = '👍';
    message = 'Good effort! Keep practicing!';
  } else {
    icon = '📚';
    message = 'Keep learning! Review the topic and try again!';
  }
  resultEl.innerHTML = `<div class="quiz-result-content"><div class="quiz-result-icon">${icon}</div><h3>${message}</h3><div class="quiz-score-circle"><span class="score-number">${percentage}%</span></div><p>You got <strong>${score}</strong> out of <strong>${total}</strong> questions correct</p><p class="xp-gained">+${xpEarned} XP earned!</p><p class="completion-time">Completion Time: ${formatQuizTime(completionTime)}</p></div>`;
  resultEl.innerHTML += `<button class="btn btn-primary review-btn" onclick="showQuizReview()">📖 Review Answers</button>`;
}

function showQuizReview() {
  if (!lastQuizReview || !lastQuizReview.questions || !lastQuizReview.answers) {
    if (typeof showNotification === 'function') showNotification('No review data found', 'error');
    return;
  }
  const resultEl = document.getElementById('topicQuizResult');
  const escapeHtml = (value = '') =>
    String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&`#39`;');

  let html = `<div class="quiz-review"><h2>📖 Quiz Review</h2><div class="quiz-review-container"><div class="quiz-review-items">`;
  lastQuizReview.questions.forEach((q, index) => {
    const answer = lastQuizReview.answers[index] || {};
    const yourAnswerText =
      answer.selected !== undefined ? q.options[answer.selected] : 'Not Answered';
    const correctnessIcon = answer.isCorrect ? '✅' : '❌';
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
  showQuizResults(
    lastQuizResultData.score,
    lastQuizResultData.total,
    lastQuizResultData.percentage,
    lastQuizResultData.xpEarned,
    lastQuizResultData.completionTime
  );
}

if (typeof window !== 'undefined') {
  window.showQuizReview = showQuizReview;
  window.restoreQuizResults = restoreQuizResults;
  window.closeQuizModal = closeQuizModal;
  window.startQuiz = startQuiz;
}

export { initQuizSection, closeQuizModal, startQuiz, shuffleArray, formatQuizTime, getNextOptionIndex, getQuizTopicKey };
