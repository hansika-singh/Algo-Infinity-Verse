// pages/topic-quiz/topic-quiz.js
// Entry point for the full-page topic quiz experience.

import {
  formatQuizTime,
  getNextOptionIndex,
} from '../../modules/quiz-game.js';

import { XP_PER_CORRECT_ANSWER, shuffle } from '../../modules/quizScoring.js';

// ── State ────────────────────────────────────────────────────────────────────
let currentQuiz = null;
let quizStartTime = null;
let quizTimerInterval = null;
let lastQuizReview = null;
let lastQuizResultData = null;

// ── DOM references ────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const els = {};

function cacheEls() {
  els.backBtn = $('tqBackBtn');
  els.topicBadge = $('tqTopicBadge');
  els.difficultyBadge = $('tqDifficultyBadge');
  els.timer = $('tqTimer');
  els.timerDisplay = $('tqTimerDisplay');
  els.counter = $('tqCounter');
  els.counterCurrent = $('tqCounterCurrent');
  els.counterTotal = $('tqCounterTotal');
  els.progressFill = $('tqProgressFill');
  els.percent = $('tqPercent');
  els.questionArea = $('tqQuestionArea');
  els.options = $('tqOptions');
  els.result = $('tqResult');
  els.liveRegion = $('tqLiveRegion');
}

// ── Topic key helpers ─────────────────────────────────────────────────────────
function normalizeTopic(topic) {
  return String(topic).trim().toLowerCase().replace(/\s+/g, ' ');
}

const TOPIC_MAP = {
  arrays: 'arrays',
  strings: 'strings',
  'linked list': 'linkedlist',
  linkedlist: 'linkedlist',
  trees: 'trees',
  graphs: 'graphs',
  'dynamic programming': 'dp',
  dp: 'dp',
  heaps: 'heaps',
  matrix: 'matrix',
  stack: 'stack',
  queue: 'queue',
  'binary search': 'binarysearch',
  binarysearch: 'binarysearch',
  recursion: 'recursion',
  backtracking: 'backtracking',
  sorting: 'sorting',
  'bit manipulation': 'bitmanipulation',
  bitmanipulation: 'bitmanipulation',
  greedy: 'greedy',
  'two pointers': 'twopointers',
  twopointers: 'twopointers',
  'sliding window': 'slidingwindow',
  slidingwindow: 'slidingwindow',
  'trie': 'trie',
  'union find': 'unionfind',
  unionfind: 'unionfind',
};

function getTopicKey(topic) {
  const norm = normalizeTopic(typeof topic === 'string' ? topic : (topic?.name || ''));
  return TOPIC_MAP[norm] || null;
}

function getTopicName(topicKey) {
  const reverseMap = {
    arrays: 'Arrays',
    strings: 'Strings',
    linkedlist: 'Linked List',
    trees: 'Trees',
    graphs: 'Graphs',
    dp: 'Dynamic Programming',
    heaps: 'Heaps',
    matrix: 'Matrix',
    stack: 'Stack',
    queue: 'Queue',
    binarysearch: 'Binary Search',
    recursion: 'Recursion',
    backtracking: 'Backtracking',
    sorting: 'Sorting',
    bitmanipulation: 'Bit Manipulation',
    greedy: 'Greedy',
    twopointers: 'Two Pointers',
    slidingwindow: 'Sliding Window',
    trie: 'Trie',
    unionfind: 'Union Find',
  };
  return reverseMap[topicKey] || topicKey.charAt(0).toUpperCase() + topicKey.slice(1);
}

function getDifficulty(topicKey) {
  const topics = window.dsaTopics || [];
  const found = topics.find((t) => getTopicKey(t) === topicKey);
  return found?.difficulty || 'Medium';
}

// ── Shuffle (reused from quizScoring.js) ─────────────────────────────────────

// ── Timer ─────────────────────────────────────────────────────────────────────
function startTimer() {
  clearInterval(quizTimerInterval);
  quizStartTime = Date.now();
  updateTimerDisplay();
  quizTimerInterval = setInterval(updateTimerDisplay, 1000);
}

function stopTimer() {
  clearInterval(quizTimerInterval);
  return Math.floor((Date.now() - quizStartTime) / 1000);
}

function updateTimerDisplay() {
  if (!quizStartTime) return;
  const elapsed = Math.floor((Date.now() - quizStartTime) / 1000);
  const display = formatQuizTime(elapsed);
  if (els.timerDisplay) els.timerDisplay.textContent = display;

  // Visual states
  if (els.timer) {
    els.timer.classList.remove('warning', 'critical');
    if (elapsed > 120) {
      els.timer.classList.add('critical');
    } else if (elapsed > 60) {
      els.timer.classList.add('warning');
    }
  }
}

// ── Live region ───────────────────────────────────────────────────────────────
function announce(message) {
  if (!els.liveRegion) return;
  els.liveRegion.textContent = '';
  void els.liveRegion.offsetWidth;
  els.liveRegion.textContent = message;
}

// ── Quiz start ────────────────────────────────────────────────────────────────
function startQuiz(topicKey) {
  const quizQuestions = window.quizQuestions || {};
  const questions = quizQuestions[topicKey];
  if (!questions || questions.length === 0) {
    renderEmpty(`No quiz questions available for <strong>${getTopicName(topicKey)}</strong>.`);
    return;
  }

  // Show loading, then render
  renderLoading();

  // Set badges
  if (els.topicBadge) els.topicBadge.textContent = getTopicName(topicKey);
  const difficulty = getDifficulty(topicKey);
  if (els.difficultyBadge) {
    els.difficultyBadge.textContent = difficulty;
    els.difficultyBadge.className = 'tq-difficulty-badge ' + difficulty.toLowerCase();
  }

  // Hides result area, shows question elements
  if (els.result) {
    els.result.classList.add('hidden');
    els.result.innerHTML = '';
  }

  currentQuiz = {
    topic: topicKey,
    questions: shuffle([...questions]),
    currentQuestionIndex: 0,
    score: 0,
    answers: [],
  };

  // Render first question immediately (spinner was already shown in renderLoading)
  startTimer();
  renderQuestion();
}

// ── Render states ─────────────────────────────────────────────────────────────
function renderLoading() {
  if (els.questionArea) {
    els.questionArea.innerHTML = `
      <div class="tq-loading">
        <div class="tq-spinner"></div>
        <span class="tq-loading-text">Preparing your quiz...</span>
      </div>
    `;
  }
  if (els.options) els.options.innerHTML = '';
}

function renderEmpty(message) {
  if (els.questionArea) {
    els.questionArea.innerHTML = `
      <div class="tq-empty">
        <i class="fas fa-question-circle tq-empty-icon"></i>
        <h2 class="tq-empty-title">Questions Not Found</h2>
        <p class="tq-empty-text">${message}</p>
        <button type="button" class="tq-btn tq-btn-secondary" onclick="window.history.back()">
          <i class="fas fa-arrow-left"></i> Back to Quizzes
        </button>
      </div>
    `;
  }
  if (els.options) els.options.innerHTML = '';
}

// ── Render question ───────────────────────────────────────────────────────────
function renderQuestion() {
  if (!currentQuiz) return;

  const idx = currentQuiz.currentQuestionIndex;
  const total = currentQuiz.questions.length;

  if (idx >= total) {
    finishQuiz();
    return;
  }

  const question = currentQuiz.questions[idx];
  const questionNum = idx + 1;

  // Update progress
  updateProgress(questionNum, total);

  // Render question text
  if (els.questionArea) {
    els.questionArea.innerHTML = `
      <span class="tq-question-label">Question ${questionNum} of ${total}</span>
      <p class="tq-question-text" id="tqQuestionText">${escapeHtml(question.question)}</p>
    `;
  }

  // Render options
  if (els.options) {
    els.options.innerHTML = question.options
      .map(
        (opt, oi) => `
          <button type="button"
            class="tq-option"
            data-index="${oi}"
            role="radio"
            aria-checked="false"
            tabindex="${oi === 0 ? '0' : '-1'}">
            <span class="option-letter">${String.fromCharCode(65 + oi)}</span>
            <span class="option-text">${escapeHtml(opt)}</span>
          </button>`
      )
      .join('');

    // Bind click + keyboard
    els.options.querySelectorAll('.tq-option').forEach((btn) => {
      btn.addEventListener('click', () => selectAnswer(parseInt(btn.dataset.index)));
      btn.addEventListener('keydown', (e) => handleOptionKeydown(e));
    });
  }

  announce(`Question ${questionNum} of ${total}: ${question.question}`);

  // First option has tabindex="0" so keyboard users can Tab to it naturally.
  // No programmatic focus to avoid unwanted focus ring on page load.
}

function updateProgress(current, total) {
  const pct = Math.round((current / total) * 100);

  if (els.counterCurrent) els.counterCurrent.textContent = current;
  if (els.counterTotal) els.counterTotal.textContent = total;
  if (els.progressFill) {
    els.progressFill.style.width = `${pct}%`;
    els.progressFill.setAttribute('aria-valuenow', pct);
  }
  if (els.percent) els.percent.textContent = `${pct}%`;
}

// ── Select answer ─────────────────────────────────────────────────────────────
function selectAnswer(selectedIndex) {
  if (!currentQuiz) return;

  const question = currentQuiz.questions[currentQuiz.currentQuestionIndex];
  const isCorrect = selectedIndex === question.correct;

  // Track answer
  currentQuiz.answers.push({
    questionId: question.id,
    selected: selectedIndex,
    correct: question.correct,
    isCorrect,
  });

  if (isCorrect) currentQuiz.score++;

  // Spaced repetition integration
  if (window.spacedRepetition) {
    window.spacedRepetition.scheduleReview(
      question.id,
      currentQuiz.topic || 'Quiz',
      'Medium',
      isCorrect,
      30
    );
  }

  // Visual feedback on options
  const allOptions = els.options?.querySelectorAll('.tq-option');
  if (allOptions) {
    allOptions.forEach((opt, oi) => {
      opt.classList.add('disabled');
      opt.setAttribute('tabindex', '-1');
      opt.setAttribute('aria-checked', oi === selectedIndex ? 'true' : 'false');

      if (oi === question.correct) {
        opt.classList.add('correct');
      } else if (oi === selectedIndex && !isCorrect) {
        opt.classList.add('incorrect');
      } else if (oi === selectedIndex) {
        opt.classList.add('selected');
      }
    });
  }

  announce(isCorrect ? 'Correct!' : `Incorrect. The correct answer is ${escapeHtml(question.options[question.correct])}.`);

  // Advance to next question after a brief pause
  setTimeout(() => {
    currentQuiz.currentQuestionIndex++;
    renderQuestion();
  }, 1000);
}

// ── Keyboard navigation ───────────────────────────────────────────────────────
function handleOptionKeydown(e) {
  const options = els.options?.querySelectorAll('.tq-option');
  if (!options) return;
  const currentIndex = Array.from(options).indexOf(e.currentTarget);
  if (currentIndex === -1) return;

  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    selectAnswer(parseInt(e.currentTarget.dataset.index));
    return;
  }

  const nextIndex = getNextOptionIndex(e.key, currentIndex, options.length);
  if (nextIndex !== null) {
    e.preventDefault();
    const target = options[nextIndex];
    if (target) target.focus();
  }
}

// ── Finish quiz ───────────────────────────────────────────────────────────────
function finishQuiz() {
  if (!currentQuiz) return;

  const topicKey = currentQuiz.topic;
  const score = currentQuiz.score;
  const total = currentQuiz.questions.length;
  const percentage = Math.round((score / total) * 100);
  const completionTime = stopTimer();
  const xpEarned = score * XP_PER_CORRECT_ANSWER;

  // Save progress
  saveProgress(topicKey, score, total, percentage, xpEarned, completionTime);

  // Store review data
  lastQuizReview = JSON.parse(JSON.stringify(currentQuiz));
  lastQuizResultData = { score, total, percentage, xpEarned, completionTime };

  // Update dashboard if function exists
  if (typeof updateDashboard === 'function') updateDashboard();
  if (typeof updateGamification === 'function') updateGamification();

  // Show results UI
  showResults(score, total, percentage, xpEarned, completionTime);
}

function saveProgress(topicKey, score, total, percentage, xpEarned, completionTime) {
  const userProgress = window.userProgress || {};

  if (!userProgress.quizScores) userProgress.quizScores = {};
  if (!userProgress.quizScores[topicKey]) {
    userProgress.quizScores[topicKey] = { bestScore: 0, attempts: 0, totalXP: 0 };
  }

  if (!userProgress.bestQuizTimes) userProgress.bestQuizTimes = {};
  if (!userProgress.bestQuizTimes[topicKey] || completionTime < userProgress.bestQuizTimes[topicKey]) {
    userProgress.bestQuizTimes[topicKey] = completionTime;
  }

  const record = userProgress.quizScores[topicKey];
  record.bestScore = Math.max(record.bestScore, percentage);
  record.attempts++;
  record.totalXP += xpEarned;

  if (typeof addXP === 'function') addXP(xpEarned);
  if (typeof recordAnalyticsEvent === 'function') {
    recordAnalyticsEvent('quiz', { topicKey, score, total, percentage, xpEarned, completionTime });
  }
  if (typeof recordDailyActivity === 'function') recordDailyActivity(1);
  if (typeof handleQuizCompletionForRevision === 'function') {
    handleQuizCompletionForRevision(topicKey, percentage);
  }
  if (typeof saveUserData === 'function') saveUserData();
}

// ── Show results ──────────────────────────────────────────────────────────────
function showResults(score, total, percentage, xpEarned, completionTime) {
  // Hide question/options
  if (els.questionArea) els.questionArea.style.display = 'none';
  if (els.options) els.options.style.display = 'none';

  // Build result content
  let iconClass, message;
  if (percentage >= 90) { iconClass = 'fa-trophy'; message = 'Outstanding! Perfect mastery!'; }
  else if (percentage >= 70) { iconClass = 'fa-star'; message = 'Great job! Solid understanding!'; }
  else if (percentage >= 50) { iconClass = 'fa-thumbs-up'; message = 'Good effort! Keep practicing!'; }
  else { iconClass = 'fa-book'; message = 'Keep learning! Review the topic and try again!'; }

  if (els.result) {
    els.result.classList.remove('hidden');
    els.result.innerHTML = `
      <span class="tq-result-icon"><i class="fas ${iconClass}"></i></span>
      <h2 class="tq-result-title">${message}</h2>
      <div class="tq-result-score">
        ${percentage}%
        <span class="tq-result-score-text">${score}/${total} correct</span>
      </div>
      <p class="tq-result-details">
        You got <strong>${score}</strong> out of <strong>${total}</strong> questions correct
      </p>
      <div class="tq-result-xp">
        <i class="fas fa-star"></i> +${xpEarned} XP earned
      </div>
      <p class="tq-result-details" style="font-size:0.82rem; color:var(--tq-text-muted);">
        <i class="far fa-clock"></i> Completed in ${formatQuizTime(completionTime)}
      </p>
      <div class="tq-result-actions">
        <button type="button" class="tq-btn tq-btn-primary" id="tqReviewBtn">
          <i class="fas fa-search"></i> Review Answers
        </button>
        <button type="button" class="tq-btn tq-btn-secondary" id="tqRetakeBtn">
          <i class="fas fa-redo"></i> Retake Quiz
        </button>
        <button type="button" class="tq-btn tq-btn-secondary" onclick="window.history.back()">
          <i class="fas fa-arrow-left"></i> Back
        </button>
      </div>
    `;

    // Bind review button
    const reviewBtn = $('tqReviewBtn');
    if (reviewBtn) reviewBtn.addEventListener('click', showReview);

    // Bind retake button
    const retakeBtn = $('tqRetakeBtn');
    if (retakeBtn) retakeBtn.addEventListener('click', () => {
      // Reset UI and restart
      if (els.questionArea) els.questionArea.style.display = '';
      if (els.options) els.options.style.display = '';
      startQuiz(currentQuiz?.topic);
    });
  }

  const elapsed = Math.floor((Date.now() - quizStartTime) / 1000);
  announce(`Quiz complete! You scored ${score} out of ${total}. ${message}`);
}

// ── Review ────────────────────────────────────────────────────────────────────
function showReview() {
  if (!lastQuizReview || !lastQuizReview.questions || !lastQuizReview.answers) {
    if (typeof showNotification === 'function') showNotification('No review data found', 'error');
    return;
  }

  const questions = lastQuizReview.questions;
  const answers = lastQuizReview.answers;

  let html = '<div class="tq-review"><h3><i class="fas fa-search"></i> Review Answers</h3>';

  questions.forEach((q, idx) => {
    const ans = answers[idx] || {};
    const yourAnsText = ans.selected !== undefined ? q.options[ans.selected] : 'Not Answered';
    const isCorrect = ans.isCorrect;
    const statusClass = isCorrect ? 'correct-txt' : 'incorrect-txt';
    const iconCorrect = '<i class="fas fa-check-circle" style="color:var(--tq-success);"></i>';
    const iconIncorrect = '<i class="fas fa-times-circle" style="color:var(--tq-error);"></i>';

    html += `
      <div class="tq-review-item">
        <div class="tq-review-question">Q${idx + 1}. ${escapeHtml(q.question)}</div>
        <div class="tq-review-answers">
          <span class="your-answer ${statusClass}">
            ${isCorrect ? iconCorrect : iconIncorrect} Your answer: ${escapeHtml(yourAnsText)}
          </span>
          ${!isCorrect ? `<br><span class="correct-answer-txt"><i class="fas fa-check" style="color:var(--tq-success);"></i> Correct answer: ${escapeHtml(q.options[q.correct])}</span>` : ''}
        </div>
        ${q.explanation ? `<div class="tq-review-explanation"><i class="fas fa-lightbulb" style="color:var(--tq-gold); margin-right:0.3rem;"></i>${escapeHtml(q.explanation)}</div>` : ''}
      </div>`;
  });

  html += `
    <div class="tq-result-actions" style="margin-top:1.5rem;">
      <button type="button" class="tq-btn tq-btn-primary" id="tqBackToResultsBtn">
        <i class="fas fa-arrow-left"></i> Back to Results
      </button>
    </div>
  </div>`;

  if (els.result) {
    els.result.innerHTML = html;
    els.result.scrollTop = 0;
  }

  const backBtn = $('tqBackToResultsBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (lastQuizResultData) {
        showResults(
          lastQuizResultData.score,
          lastQuizResultData.total,
          lastQuizResultData.percentage,
          lastQuizResultData.xpEarned,
          lastQuizResultData.completionTime
        );
      }
    });
  }
}

// ── Utility ───────────────────────────────────────────────────────────────────
function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// ── Page initialization ───────────────────────────────────────────────────────
function init() {
  cacheEls();

  // Back button
  if (els.backBtn) {
    els.backBtn.addEventListener('click', () => {
      if (currentQuiz && currentQuiz.score !== undefined) {
        // Quiz in progress — confirm?
        // Simple: just go back
      }
      if (els.result && !els.result.classList.contains('hidden') && currentQuiz) {
        // Quiz finished, just go back
      }
      window.history.back();
    });
  }

  // Get topic from URL params
  const params = new URLSearchParams(window.location.search);
  let topic = params.get('topic');

  // Fallback: if topic is in sessionStorage (set from main page)
  if (!topic) {
    topic = sessionStorage.getItem('topicQuizTopic');
  }

  if (topic) {
    const topicKey = getTopicKey(topic);
    if (topicKey) {
      startQuiz(topicKey);
    } else {
      renderEmpty(`Unknown topic: <strong>${escapeHtml(topic)}</strong>`);
    }
  } else {
    renderEmpty('No topic specified. Please select a quiz from the main page.');
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Expose for debugging
window.tqShowReview = showReview;
window.tqShowResults = showResults;
