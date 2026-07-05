function initGamification() { updateXPBar(); }

function initDailyChallenge() {
  const dailyChallenges = window.dailyChallenges || [];
  const userProgress = window.userProgress || {};
  const card = document.getElementById("dailyChallengeCard");
  const textEl = document.getElementById("dailyChallengeText");
  const btn = document.getElementById("completeChallengeBtn");
  if (!card || !textEl || !btn) return;
  const challenge = dailyChallenges[getDayOfYear() % dailyChallenges.length];
  const completedChallenges = userProgress.completedDailyChallenges || [];
  const alreadyCompleted = completedChallenges.includes(challenge.id);
  textEl.textContent = `${challenge.title}: ${challenge.description}`;
  btn.disabled = alreadyCompleted;
  btn.innerHTML = alreadyCompleted ? "Challenge Completed ✓" : `<i class="fas fa-bolt"></i> Complete Challenge (+${challenge.xpReward} XP)`;
  btn.addEventListener("click", () => {
    if (!userProgress.completedDailyChallenges) userProgress.completedDailyChallenges = [];
    if (!userProgress.completedDailyChallenges.includes(challenge.id)) { userProgress.completedDailyChallenges.push(challenge.id); if (typeof addXP === 'function') addXP(challenge.xpReward); if (typeof saveUserData === 'function') saveUserData(); if (typeof showNotification === 'function') showNotification(`Challenge completed! +${challenge.xpReward} XP earned! 🚀`, "success"); btn.disabled = true; btn.textContent = "Challenge Completed ✓"; }
  });
}

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now - start) / (1000 * 60 * 60 * 24));
}

function addXP(amount, source = "general", meta = {}) {
  const userProgress = window.userProgress || {};
  userProgress.xp += amount;
  if (typeof recordAnalyticsEvent === 'function') recordAnalyticsEvent("xp", { amount, source, ...meta });
  checkLevelUp();
  if (typeof saveUserData === 'function') saveUserData();
}

function checkLevelUp() {
  const userProgress = window.userProgress || {};
  const levels = [0, 1000, 2500, 5000, 10000, 20000, 50000, 100000];
  const levelNames = ["Beginner", "Novice", "Intermediate", "Advanced", "Expert", "Master", "Grandmaster", "Legend"];
  let newLevel = 1;
  for (let i = levels.length - 1; i >= 0; i--) { if (userProgress.xp >= levels[i]) { newLevel = i + 1; break; } }
  if (newLevel > userProgress.level) { if (typeof showNotification === 'function') showNotification(`🎉 Level Up! You're now Level ${newLevel} - ${levelNames[newLevel - 1]}`, "success"); }
  userProgress.level = newLevel;
  const levelBadge = document.getElementById("levelBadge");
  if (levelBadge) levelBadge.textContent = `Level ${newLevel} - ${levelNames[newLevel - 1]}`;
}

function updateGamification() { updateXPBar(); if (typeof updateBadges === 'function') updateBadges(); }

function updateXPBar() {
  const userProgress = window.userProgress || {};
  const levels = [0, 1000, 2500, 5000, 10000, 20000, 50000, 100000];
  const currentLevel = userProgress.level;
  const currentLevelXP = levels[currentLevel - 1] || 0;
  const nextLevelXP = levels[currentLevel] || 100000;
  const xpProgress = ((userProgress.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  setTimeout(() => { 
    const xpBar = document.getElementById("xpBar");
    const xpText = document.getElementById("xpText");
    if (xpBar) xpBar.style.width = `${Math.min(xpProgress, 100)}%`; 
    if (xpText) xpText.textContent = `${userProgress.xp} / ${nextLevelXP} XP`; 
  }, 300);
}

window.addXP = addXP;

export { initGamification, initDailyChallenge, checkLevelUp, updateGamification, updateXPBar, addXP };

let currentGame = {
  type: null, topic: null, questions: [],
  currentIndex: 0, score: 0, correct: 0,
  total: 0, timer: null, timeLeft: 30, xpEarned: 0,
};

const complexityQuestions = [
  {
    question: "What is the time complexity?\n\nfor(let i=0; i<n; i++) {\n  for(let j=0; j<n; j++) {\n    console.log(i,j);\n  }\n}",
    options: ["O(n)", "O(n log n)", "O(n²)", "O(2^n)"],
    correct: 2,
    explanation: "Nested loops both running n times = O(n²)"
  },
  {
    question: "What is the time complexity?\n\nlet i = n;\nwhile(i > 1) {\n  i = Math.floor(i/2);\n}",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    correct: 1,
    explanation: "Halving n each time = O(log n)"
  },
  {
    question: "What is the space complexity?\n\nfunction sum(n) {\n  if(n <= 0) return 0;\n  return n + sum(n-1);\n}",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    correct: 2,
    explanation: "Recursive calls stack n frames = O(n) space"
  },
  {
    question: "What is the time complexity of binary search?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correct: 1,
    explanation: "Binary search halves search space each step = O(log n)"
  },
  {
    question: "What is the time complexity?\n\nconst map = {};\nfor(let i=0; i<n; i++) {\n  map[arr[i]] = i;\n}",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    correct: 2,
    explanation: "Single loop with O(1) hash operations = O(n)"
  },
  {
    question: "What is the time complexity of merge sort?",
    options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
    correct: 1,
    explanation: "Merge sort divides and merges = O(n log n)"
  },
  {
    question: "What is the space complexity of an array of size n?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    correct: 2,
    explanation: "Array stores n elements = O(n) space"
  },
  {
    question: "What is the time complexity of accessing a hash map?",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    correct: 0,
    explanation: "Hash map provides O(1) average access time"
  },
  {
    question: "What is the time complexity?\n\nfor(let i=1; i<n; i*=2) {\n  console.log(i);\n}",
    options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
    correct: 1,
    explanation: "Multiplying by 2 each time = O(log n)"
  }
];

function openGameModal() {
  const modal = document.getElementById("gameModal");
  if (!modal) return;
  const userProgress = window.userProgress || {};
  const level = userProgress.level || 1;
  const levelNames = ["Beginner","Novice","Intermediate","Advanced","Expert","Master","Grandmaster","Legend"];
  document.getElementById("gameModalTitle").textContent = 
    `🎮 Level ${level} - ${levelNames[level-1] || 'Level ' + level} Games`;
  showGameTypeSelector();
  modal.classList.add("active");
}

function closeGameModal() {
  const modal = document.getElementById("gameModal");
  if (modal) modal.classList.remove("active");
  clearInterval(currentGame.timer);
  resetGame();
}

function showGameTypeSelector() {
  document.getElementById("gameTypeSelector").style.display = "block";
  document.getElementById("gamePlayArea").style.display = "none";
  document.getElementById("gameResults").style.display = "none";
  clearInterval(currentGame.timer);
}

function getTopicForLevel() {
  const userProgress = window.userProgress || {};
  const level = userProgress.level || 1;
  const topics = ["arrays","strings","linkedlist","trees","graphs","dp","arrays","strings"];
  return topics[level - 1] || "arrays";
}

function startGame(type) {
  currentGame.type = type;
  currentGame.score = 0;
  currentGame.correct = 0;
  currentGame.xpEarned = 0;
  currentGame.currentIndex = 0;

  const topic = getTopicForLevel();

  if (type === "complexity") {
    currentGame.questions = [...complexityQuestions].sort(() => Math.random() - 0.5).slice(0, 10);
  } else {
    const topicQuestions = (window.quizQuestions && window.quizQuestions[topic]) || (window.quizQuestions && window.quizQuestions.arrays) || [];
    currentGame.questions = [...topicQuestions].sort(() => Math.random() - 0.5).slice(0, 10);
  }

  currentGame.total = currentGame.questions.length;

  document.getElementById("gameTypeSelector").style.display = "none";
  document.getElementById("gamePlayArea").style.display = "block";
  document.getElementById("gameResults").style.display = "none";

  loadGameQuestion();
}

function loadGameQuestion() {
  if (currentGame.currentIndex >= currentGame.total) {
    endGame();
    return;
  }

  const q = currentGame.questions[currentGame.currentIndex];
  document.getElementById("gameQuestion").textContent = currentGame.currentIndex + 1;
  document.getElementById("gameScore").textContent = currentGame.score;
  document.getElementById("gameQuestionText").textContent = q.question;
  document.getElementById("gameExplanation").style.display = "none";

  const optionsGrid = document.getElementById("gameOptionsGrid");
  optionsGrid.innerHTML = q.options.map((opt, i) =>
    `<button class="game-option" onclick="selectGameAnswer(${i})">${opt}</button>`
  ).join("");

  // Start timer
  clearInterval(currentGame.timer);
  currentGame.timeLeft = currentGame.type === "speed" ? 60 : 30;
  
  if (currentGame.type === "speed" && currentGame.currentIndex === 0) {
    currentGame.timeLeft = 60;
  }

  document.getElementById("gameTimer").textContent = currentGame.timeLeft;

  if (currentGame.type !== "speed" || currentGame.currentIndex === 0) {
    currentGame.timer = setInterval(() => {
      currentGame.timeLeft--;
      document.getElementById("gameTimer").textContent = currentGame.timeLeft;
      if (currentGame.timeLeft <= 0) {
        clearInterval(currentGame.timer);
        if (currentGame.type === "speed") {
          endGame();
        } else {
          // Time's up — move to next
          selectGameAnswer(-1);
        }
      }
    }, 1000);
  }
}

function selectGameAnswer(index) {
  clearInterval(currentGame.timer);
  const q = currentGame.questions[currentGame.currentIndex];
  const options = document.querySelectorAll(".game-option");
  const xpPerQ = currentGame.type === "quiz" ? 20 : currentGame.type === "speed" ? 10 : 15;

  options.forEach(opt => opt.style.pointerEvents = "none");

  if (index === q.correct) {
    if (options[index]) options[index].classList.add("correct");
    currentGame.score += 10;
    currentGame.correct++;
    currentGame.xpEarned += xpPerQ;
    document.getElementById("gameScore").textContent = currentGame.score;
  } else {
    if (options[index]) options[index].classList.add("wrong");
    if (options[q.correct]) options[q.correct].classList.add("correct");
  }

  // Show explanation
  const expEl = document.getElementById("gameExplanation");
  expEl.textContent = `💡 ${q.explanation}`;
  expEl.style.display = "block";

  currentGame.currentIndex++;

  setTimeout(() => {
    loadGameQuestion();
  }, currentGame.type === "speed" ? 800 : 1500);
}

function endGame() {
  clearInterval(currentGame.timer);

  // Award XP
  addXP(currentGame.xpEarned);
  updateGamification();

  const accuracy = currentGame.total > 0 ? Math.round((currentGame.correct / currentGame.total) * 100) : 0;

  document.getElementById("gamePlayArea").style.display = "none";
  document.getElementById("gameResults").style.display = "block";

  const titles = {
    quiz: "Quiz Complete! 🧩",
    speed: "Speed Round Over! ⚡",
    complexity: "Complexity Master! 🎯"
  };

  document.getElementById("gameResultsTitle").textContent = titles[currentGame.type];
  document.getElementById("resultScore").textContent = currentGame.score;
  document.getElementById("resultXP").textContent = `+${currentGame.xpEarned}`;
  document.getElementById("resultAccuracy").textContent = `${accuracy}%`;

  if (typeof window.showNotification === 'function') {
    window.showNotification(
      `🎮 Game Over! Score: ${currentGame.score} | +${currentGame.xpEarned} XP earned!`,
      "success"
    );
  }
}

function restartGame() {
  startGame(currentGame.type);
}

function resetGame() {
  currentGame = {
    type: null, topic: null, questions: [],
    currentIndex: 0, score: 0, correct: 0,
    total: 0, timer: null, timeLeft: 30, xpEarned: 0,
  };
}

window.openGameModal = openGameModal;
window.closeGameModal = closeGameModal;
window.startGame = startGame;
window.selectGameAnswer = selectGameAnswer;
window.restartGame = restartGame;
window.resetGame = resetGame;
