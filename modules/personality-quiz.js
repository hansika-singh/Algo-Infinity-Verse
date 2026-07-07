const QUIZ_QUESTIONS = [
  { q: "When starting a new coding problem, what do you do first?", options: [{ text: "Start typing the code immediately to see if it works.", type: "brute-force first" }, { text: "Analyze constraints, define edge cases, and write pseudocode.", type: "slow but accurate" }, { text: "Design a fast greedy heuristic to get a quick correct result.", type: "greedy thinker" }, { text: "Search for hash tables or auxiliary space shortcuts to minimize complexity.", type: "over-optimizer" }] },
  { q: "How do you evaluate time/space complexity?", options: [{ text: "I don't think about it until it gets a Time Limit Exceeded (TLE) error.", type: "brute-force first" }, { text: "I trace the iterations and count nested variables step-by-step.", type: "slow but accurate" }, { text: "I trust locally optimal choices to run fast enough.", type: "greedy thinker" }, { text: "I always structure for O(N) or O(1) space, even if it requires complex code.", type: "over-optimizer" }] },
  { q: "Your solution fails on an empty input. What is your reaction?", options: [{ text: "I patch it with a quick 'if empty return' condition.", type: "brute-force first" }, { text: "I dry-run the loop bounds on paper to understand why it cracked.", type: "slow but accurate" }, { text: "I use simple helper fallback returns.", type: "greedy thinker" }, { text: "I rewrite the index math to prevent empty pointer states altogether.", type: "over-optimizer" }] },
  { q: "What is your main goal when coding?", options: [{ text: "Get green checkmarks as fast as possible.", type: "brute-force first" }, { text: "Write bug-free, clean, and highly readable code.", type: "slow but accurate" }, { text: "Find the simplest, most intuitive logical shortcut.", type: "greedy thinker" }, { text: "Optimize space-time metrics to beat 100% of submissions.", type: "over-optimizer" }] }
];

let currentQuizIndex = 0;
let quizSelections = [];

function openPersonalityQuiz() {
  let modal = document.getElementById("personalityQuizModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "personalityQuizModal";
    modal.innerHTML = `<div class="modal-content personality-quiz-modal-content"><div class="modal-header"><h3>Coding Personality Profiler</h3><button class="modal-close" id="personalityQuizClose">&times;</button></div><div class="modal-body" id="personalityQuizBody"></div></div>`;
    document.body.appendChild(modal);
    const closeBtn = document.getElementById("personalityQuizClose");
    if (closeBtn) closeBtn.addEventListener("click", () => { if (modal) modal.classList.remove("active"); });
  }
  currentQuizIndex = 0;
  quizSelections = [];
  modal.classList.add("active");
  renderPersonalityQuizQuestion();
}

function renderPersonalityQuizQuestion() {
  const container = document.getElementById("personalityQuizBody");
  if (!container) return;
  if (currentQuizIndex >= QUIZ_QUESTIONS.length) { finishPersonalityQuiz(); return; }
  const quest = QUIZ_QUESTIONS[currentQuizIndex];
  container.innerHTML = `<div class="quiz-question-container"><div class="quiz-question-header"><span>Question ${currentQuizIndex + 1} of ${QUIZ_QUESTIONS.length}</span><span>Coding Style Quiz</span></div><p class="quiz-question-text">${quest.q}</p><div class="quiz-answer-options">${quest.options.map((opt, i) => `<div class="quiz-answer-option" data-type="${opt.type}"><div class="quiz-answer-letter">${String.fromCharCode(65 + i)}</div><div class="quiz-answer-text">${opt.text}</div></div>`).join("")}</div></div>`;
  container.querySelectorAll(".quiz-answer-option").forEach(item => {
    item.addEventListener("click", () => {
      item.classList.add("selected");
      quizSelections.push(item.dataset.type);
      setTimeout(() => { currentQuizIndex++; renderPersonalityQuizQuestion(); }, 300);
    });
  });
}

function finishPersonalityQuiz() {
  const userProgress = window.userProgress || {};
  const counts = { "brute-force first": 0, "over-optimizer": 0, "slow but accurate": 0, "greedy thinker": 0 };
  quizSelections.forEach(type => counts[type] = (counts[type] || 0) + 1);
  let dominantType = "brute-force first", maxCount = -1;
  for (const type in counts) { if (counts[type] > maxCount) { maxCount = counts[type]; dominantType = type; } }
  if (!userProgress.codingPersonality) userProgress.codingPersonality = {};
  userProgress.codingPersonality.type = dominantType;
  userProgress.codingPersonality.bruteForceCount = counts["brute-force first"] + 1;
  userProgress.codingPersonality.overOptimizerCount = counts["over-optimizer"] + 1;
  userProgress.codingPersonality.slowAccurateCount = counts["slow but accurate"] + 1;
  userProgress.codingPersonality.greedyCount = counts["greedy thinker"] + 1;
  if (typeof saveUserData === 'function') saveUserData();
  renderPersonalityCard();
  if (typeof renderProblems === 'function') { const filterActive = document.querySelector(".filter-btn.active"); renderProblems(); }
  const pModal = document.getElementById("personalityQuizModal");
  if (pModal) pModal.classList.remove("active");
  if (typeof showNotification === 'function') showNotification(`Quiz complete! Your coding personality is: ${dominantType.replace("-", " ").toUpperCase()} 🧠`, "success");
}

function renderPersonalityCard() {
  const userProgress = window.userProgress || {};
  const pCard = document.getElementById("personalityCard");
  if (!pCard) return;
  const cp = userProgress.codingPersonality || { type: "brute-force first", bruteForceCount: 1, slowAccurateCount: 0, greedyCount: 0, overOptimizerCount: 0 };
  const total = (cp.bruteForceCount || 0) + (cp.slowAccurateCount || 0) + (cp.greedyCount || 0) + (cp.overOptimizerCount || 0) || 1;
  const pctBrute = Math.round(((cp.bruteForceCount || 0) / total) * 100);
  const pctOpt = Math.round(((cp.overOptimizerCount || 0) / total) * 100);
  const pctSlow = Math.round(((cp.slowAccurateCount || 0) / total) * 100);
  const pctGreedy = Math.round(((cp.greedyCount || 0) / total) * 100);
  let icon = "🔎", desc = "", adaptation = "";
  if (cp.type === "brute-force first") { icon = "🔴"; desc = "You jump straight into writing code! You get solutions quickly, but can overlook edge cases."; adaptation = "Focus: Easy/Medium problems with boundary checks"; }
  else if (cp.type === "over-optimizer") { icon = "🟣"; desc = "You love optimal space/time tricks! You always reach for hashes and pointers."; adaptation = "Focus: Medium/Hard problems, clean code style"; }
  else if (cp.type === "slow but accurate") { icon = "🔵"; desc = "You take your time to design solutions. You have low error rates."; adaptation = "Focus: Medium problems, speed practice"; }
  else if (cp.type === "greedy thinker") { icon = "🟢"; desc = "You look for immediate local optimizations."; adaptation = "Focus: Greedy & Dynamic Programming concepts"; }
  pCard.innerHTML = `<h3>🧠 Coding Personality</h3><div class="personality-profile-content"><div class="personality-header-info"><div class="personality-badge-icon">${icon}</div><div class="personality-type-group"><h4 style="text-transform:capitalize;">${cp.type.replace("-", " ")}</h4><span class="adaptation-badge">${adaptation}</span></div></div><p class="personality-description">${desc}</p><div class="style-progress-bars"><div class="style-bar-group"><span class="style-label">Brute-Force First (${pctBrute}%)</span><div class="style-bar-track"><div class="style-bar-fill" id="barBrute" style="width:${pctBrute}%;"></div></div></div><div class="style-bar-group"><span class="style-label">Over-Optimizer (${pctOpt}%)</span><div class="style-bar-track"><div class="style-bar-fill" id="barOpt" style="width:${pctOpt}%;"></div></div></div><div class="style-bar-group"><span class="style-label">Slow but Accurate (${pctSlow}%)</span><div class="style-bar-track"><div class="style-bar-fill" id="barSlow" style="width:${pctSlow}%;"></div></div></div><div class="style-bar-group"><span class="style-label">Greedy Thinker (${pctGreedy}%)</span><div class="style-bar-track"><div class="style-bar-fill" id="barGreedy" style="width:${pctGreedy}%;"></div></div></div></div><div class="personality-actions"><button class="btn btn-secondary btn-mini" id="personalityQuizBtn"><i class="fas fa-redo"></i> Retake Profiler Quiz</button></div></div>`;
  const quizBtn = document.getElementById("personalityQuizBtn");
  if (quizBtn) quizBtn.addEventListener("click", openPersonalityQuiz);
}

window.renderPersonalityCard = renderPersonalityCard;
window.openPersonalityQuiz = openPersonalityQuiz;

export function initPersonalityQuiz() {
  const quizBtn = document.getElementById("personalityQuizBtn");
  if (quizBtn) quizBtn.addEventListener("click", openPersonalityQuiz);
}
// Legacy global exports
window.initPersonalityQuiz = initPersonalityQuiz;
