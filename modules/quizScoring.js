// modules/quizScoring.js
//
// Pure, DOM-free quiz scoring and shuffle helpers.
// Extracted from quiz-game.js so the core logic can be unit tested
// independently of the browser/DOM.

/**
 * XP awarded per correct answer.
 */
export const XP_PER_CORRECT_ANSWER = 10;

/**
 * Fisher-Yates shuffle. Returns a NEW array; does not mutate the input.
 * @param {Array} array
 * @returns {Array} shuffled copy
 */
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Count correct answers given the questions and the selected option indices.
 * A question is correct when the selected index equals question.correct.
 * @param {Array<{correct:number}>} questions
 * @param {Array<number>} selectedIndices - selected option index per question (undefined/null = unanswered)
 * @returns {number} number of correct answers
 */
export function countCorrect(questions = [], selectedIndices = []) {
  return questions.reduce((total, question, index) => {
    return total + (selectedIndices[index] === question.correct ? 1 : 0);
  }, 0);
}

/**
 * Score percentage rounded to the nearest integer (0 when there are no questions).
 * @param {number} score - number of correct answers
 * @param {number} total - total number of questions
 * @returns {number} percentage 0-100
 */
export function calculatePercentage(score, total) {
  if (!total || total <= 0) return 0;
  return Math.round((score / total) * 100);
}

/**
 * XP earned for a quiz attempt: 10 XP per correct answer.
 * @param {number} score - number of correct answers
 * @returns {number} XP earned
 */
export function calculateXp(score) {
  return Math.round(Math.max(0, score) * XP_PER_CORRECT_ANSWER);
}

/**
 * Produce the updated per-topic quiz record for a completed attempt.
 * Best score only increases; attempts and totalXP accumulate.
 * Pure function: returns a new record and does not mutate the input.
 * @param {{bestScore?:number, attempts?:number, totalXP?:number}} record
 * @param {{percentage:number, xpEarned:number}} attempt
 * @returns {{bestScore:number, attempts:number, totalXP:number}}
 */
export function updateQuizRecord(record = {}, attempt = {}) {
  const prevBest = Number(record.bestScore) || 0;
  const prevAttempts = Number(record.attempts) || 0;
  const prevXp = Number(record.totalXP) || 0;
  const percentage = Number(attempt.percentage) || 0;
  const xpEarned = Number(attempt.xpEarned) || 0;

  return {
    bestScore: Math.max(prevBest, percentage),
    attempts: prevAttempts + 1,
    totalXP: prevXp + xpEarned,
  };
}
