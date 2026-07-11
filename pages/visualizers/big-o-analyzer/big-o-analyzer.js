/**
 * big-o-analyzer.js
 * Engine for the Gamified Big O Analyzer Quiz
 */

document.addEventListener("DOMContentLoaded", () => {
  initHeroTyping();
  initBigOAnalyzer();
});

function initHeroTyping() {
  const el = document.getElementById("typingTextBigO");
  if (!el) return;

  const words = [
    "O(1) - Constant Time",
    "O(log N) - Logarithmic",
    "O(N) - Linear Time",
    "O(N log N) - Linearithmic",
    "O(N²) - Quadratic",
    "O(2^N) - Exponential"
  ];

  let wordIdx = 0;
  let charIdx = 0;
  let isDeleting = false;

  function tick() {
    const current = words[wordIdx];

    if (isDeleting) {
      el.textContent = current.substring(0, charIdx - 1);
      charIdx--;
    } else {
      el.textContent = current.substring(0, charIdx + 1);
      charIdx++;
    }

    let speed = isDeleting ? 40 : 80;

    if (!isDeleting && charIdx === current.length) {
      speed = 2000;
      isDeleting = true;
    } else if (isDeleting && charIdx === 0) {
      isDeleting = false;
      wordIdx = (wordIdx + 1) % words.length;
      speed = 500;
    }

    requestAnimationFrame(() => setTimeout(tick, speed));
  }
  tick();
}

function initBigOAnalyzer() {
  // DOM Elements
  const startBtn = document.getElementById("startQuizBtn");
  const quizContainer = document.getElementById("quizContainer");
  const gameOverPanel = document.getElementById("gameOverPanel");
  
  const scoreDisplay = document.getElementById("scoreDisplay");
  const streakDisplay = document.getElementById("streakDisplay");
  const timerDisplay = document.getElementById("timerDisplay");
  const difficultySelect = document.getElementById("difficultySelect");
  
  const codeSnippet = document.getElementById("codeSnippet");
  const questionPrompt = document.getElementById("questionPrompt");
  const optionsGrid = document.getElementById("optionsGrid");
  const questionCounter = document.getElementById("questionCounter");
  
  const explanationCard = document.getElementById("explanationCard");
  const feedbackTitle = document.getElementById("feedbackTitle");
  const explanationText = document.getElementById("explanationText");
  const nextQuestionBtn = document.getElementById("nextQuestionBtn");
  
  const accuracyDisplay = document.getElementById("accuracyDisplay");
  const attemptedDisplay = document.getElementById("attemptedDisplay");
  const bestStreakDisplay = document.getElementById("bestStreakDisplay");
  
  const finalScore = document.getElementById("finalScore");
  const restartBtn = document.getElementById("restartBtn");
  const canvas = document.getElementById("complexityGraph");
  const ctx = canvas ? canvas.getContext("2d") : null;

  // Quiz State
  let score = 0;
  let streak = 0;
  let bestStreak = 0;
  let questionsAttempted = 0;
  let correctAnswers = 0;
  let timerId = null;
  let timeRemaining = 60;
  let currentQuestion = null;
  let questionIndex = 0;
  let questionPool = [];

  // Question Database
  const questions = {
    beginner: [
      {
        type: "Time",
        code: `function getFirstElement(arr) {
  return arr[0];
}`,
        answer: "O(1)",
        options: ["O(1)", "O(N)", "O(N²)", "O(log N)"],
        explanation: "Accessing an array by index takes constant time regardless of the array's size."
      },
      {
        type: "Time",
        code: `function printAll(arr) {
  for (let i = 0; i < arr.length; i++) {
    console.log(arr[i]);
  }
}`,
        answer: "O(N)",
        options: ["O(1)", "O(N)", "O(N²)", "O(log N)"],
        explanation: "The loop iterates through all N elements of the array exactly once."
      },
      {
        type: "Time",
        code: `function printPairs(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length; j++) {
      console.log(arr[i], arr[j]);
    }
  }
}`,
        answer: "O(N²)",
        options: ["O(N)", "O(N log N)", "O(N²)", "O(2^N)"],
        explanation: "There are nested loops, each iterating N times. Total iterations: N * N = N²."
      }
    ],
    intermediate: [
      {
        type: "Time",
        code: `function binarySearch(arr, target) {
  let left = 0, right = arr.length - 1;
  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
        answer: "O(log N)",
        options: ["O(N)", "O(1)", "O(log N)", "O(N log N)"],
        explanation: "Binary search cuts the search space in half each iteration, leading to logarithmic time."
      },
      {
        type: "Time",
        code: `function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  let mid = Math.floor(arr.length / 2);
  let left = mergeSort(arr.slice(0, mid));
  let right = mergeSort(arr.slice(mid));
  return merge(left, right);
}`,
        answer: "O(N log N)",
        options: ["O(N)", "O(N²)", "O(N log N)", "O(log N)"],
        explanation: "The array is divided in half log(N) times, and merging takes O(N) at each level."
      },
      {
        type: "Space",
        code: `function createMatrix(n) {
  let matrix = [];
  for (let i = 0; i < n; i++) {
    matrix[i] = new Array(n).fill(0);
  }
  return matrix;
}`,
        answer: "O(N²)",
        options: ["O(1)", "O(N)", "O(N²)", "O(N log N)"],
        explanation: "We are allocating an N x N 2D array, which takes N * N space."
      }
    ],
    advanced: [
      {
        type: "Time",
        code: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}`,
        answer: "O(2^N)",
        options: ["O(N)", "O(N²)", "O(2^N)", "O(N!)"],
        explanation: "The naive recursive Fibonacci creates a binary tree of calls, leading to exponential time complexity."
      },
      {
        type: "Time",
        code: `function permute(str, l, r) {
  if (l == r) console.log(str);
  else {
    for (let i = l; i <= r; i++) {
      str = swap(str, l, i);
      permute(str, l + 1, r);
      str = swap(str, l, i);
    }
  }
}`,
        answer: "O(N!)",
        options: ["O(2^N)", "O(N!)", "O(N^3)", "O(N log N)"],
        explanation: "Generating all permutations of a string of length N requires N! operations."
      },
      {
        type: "Space",
        code: `function dfs(node) {
  if (!node) return;
  dfs(node.left);
  dfs(node.right);
}`,
        answer: "O(N)",
        options: ["O(1)", "O(log N)", "O(N)", "O(N²)"],
        explanation: "The space complexity is determined by the maximum depth of the call stack. In the worst case (skewed tree), it's O(N)."
      }
    ]
  };

  // Setup Event Listeners
  if (startBtn) startBtn.addEventListener("click", startGame);
  if (nextQuestionBtn) nextQuestionBtn.addEventListener("click", loadNextQuestion);
  if (restartBtn) restartBtn.addEventListener("click", startGame);

  // Hide loading screen
  setTimeout(() => {
    const loader = document.getElementById("loading-screen");
    if (loader) loader.classList.add("hidden");
  }, 300);

  function startGame() {
    const diff = difficultySelect.value;
    // Get questions for difficulty and shuffle
    questionPool = [...questions[diff]].sort(() => Math.random() - 0.5);
    
    // Reset state
    score = 0;
    streak = 0;
    bestStreak = 0;
    questionsAttempted = 0;
    correctAnswers = 0;
    questionIndex = 0;
    timeRemaining = 90; // 90 seconds for a quiz round
    
    updateDashboard();
    
    startBtn.style.display = "none";
    gameOverPanel.classList.add("hidden");
    quizContainer.classList.remove("hidden");
    
    // Start timer
    if (timerId) clearInterval(timerId);
    timerId = setInterval(timerTick, 1000);
    
    loadNextQuestion();
  }

  function loadNextQuestion() {
    if (questionIndex >= questionPool.length || timeRemaining <= 0) {
      endGame();
      return;
    }

    currentQuestion = questionPool[questionIndex];
    questionCounter.textContent = `Q ${questionIndex + 1}/${questionPool.length}`;
    questionPrompt.textContent = `What is the ${currentQuestion.type} Complexity?`;
    
    // Inject code snippet
    codeSnippet.textContent = currentQuestion.code;
    if (window.Prism) Prism.highlightElement(codeSnippet);
    
    // Build options
    optionsGrid.innerHTML = "";
    const shuffledOptions = [...currentQuestion.options].sort(() => Math.random() - 0.5);
    
    shuffledOptions.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = opt;
      btn.addEventListener("click", () => handleAnswer(opt, btn));
      optionsGrid.appendChild(btn);
    });
    
    explanationCard.classList.add("hidden");
    drawGraph("Empty"); // Clear graph
  }

  function handleAnswer(selectedOpt, btnElement) {
    // Disable all options
    const btns = optionsGrid.querySelectorAll(".option-btn");
    btns.forEach(b => b.disabled = true);
    
    const isCorrect = selectedOpt === currentQuestion.answer;
    
    questionsAttempted++;
    
    if (isCorrect) {
      btnElement.classList.add("correct");
      score += 100 + (streak * 20); // Streak bonus
      streak++;
      bestStreak = Math.max(bestStreak, streak);
      correctAnswers++;
      
      feedbackTitle.innerHTML = '<i class="fas fa-check-circle"></i> Correct!';
      explanationCard.className = "glass-card explanation-card correct";
    } else {
      btnElement.classList.add("wrong");
      streak = 0;
      
      // Highlight correct answer
      btns.forEach(b => {
        if (b.textContent === currentQuestion.answer) b.classList.add("correct");
      });
      
      feedbackTitle.innerHTML = '<i class="fas fa-times-circle"></i> Incorrect';
      explanationCard.className = "glass-card explanation-card wrong";
    }
    
    explanationText.textContent = currentQuestion.explanation;
    explanationCard.classList.remove("hidden");
    
    updateDashboard();
    drawGraph(currentQuestion.answer); // Draw corresponding curve
    
    questionIndex++;
  }

  function timerTick() {
    timeRemaining--;
    timerDisplay.textContent = timeRemaining + "s";
    
    if (timeRemaining <= 10) {
      timerDisplay.style.color = "#ef4444";
    } else {
      timerDisplay.style.color = "var(--text-primary)";
    }
    
    if (timeRemaining <= 0) {
      clearInterval(timerId);
      endGame();
    }
  }

  function updateDashboard() {
    scoreDisplay.textContent = score;
    streakDisplay.textContent = streak;
    attemptedDisplay.textContent = questionsAttempted;
    bestStreakDisplay.textContent = bestStreak;
    
    const acc = questionsAttempted > 0 ? Math.round((correctAnswers / questionsAttempted) * 100) : 0;
    accuracyDisplay.textContent = acc + "%";
  }

  function endGame() {
    if (timerId) clearInterval(timerId);
    quizContainer.classList.add("hidden");
    gameOverPanel.classList.remove("hidden");
    finalScore.textContent = score;
    
    // Local Storage logic (Optional tracking)
    try {
      const highestScore = localStorage.getItem("bigo_highscore") || 0;
      if (score > highestScore) {
        localStorage.setItem("bigo_highscore", score);
      }
    } catch (e) {}
  }

  /* Canvas Graph Drawing Engine */
  function drawGraph(complexityStr) {
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const w = canvas.width;
    const h = canvas.height;
    const pad = 30;
    
    // Draw axes
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pad, pad);
    ctx.lineTo(pad, h - pad);
    ctx.lineTo(w - pad, h - pad);
    ctx.stroke();
    
    // Labels
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "12px sans-serif";
    ctx.fillText("Operations", pad - 25, pad - 10);
    ctx.fillText("Elements (N)", w - 70, h - pad + 20);

    if (complexityStr === "Empty") return;

    // Plotting Data Setup
    const maxN = 100;
    const plotWidth = w - pad * 2;
    const plotHeight = h - pad * 2;
    
    ctx.beginPath();
    ctx.lineWidth = 3;
    
    // Set color based on complexity scale
    let color = "#10b981"; // O(1), O(logN)
    if (complexityStr === "O(N)") color = "#3b82f6"; // Blue
    else if (complexityStr === "O(N log N)") color = "#facc15"; // Yellow
    else if (complexityStr === "O(N²)" || complexityStr === "O(2^N)" || complexityStr === "O(N!)") color = "#ef4444"; // Red
    
    ctx.strokeStyle = color;
    
    let started = false;
    
    for (let x = 1; x <= maxN; x++) {
      let yVal = 0;
      
      switch(complexityStr) {
        case "O(1)": yVal = 10; break;
        case "O(log N)": yVal = Math.log2(x) * 10; break;
        case "O(N)": yVal = x; break;
        case "O(N log N)": yVal = x * Math.log2(x) * 0.2; break; // Scaled down for visual
        case "O(N²)": yVal = Math.pow(x, 2) * 0.05; break;
        case "O(2^N)": yVal = Math.pow(2, x * 0.1); break;
        case "O(N!)": yVal = Math.pow(x, 4) * 0.01; break; // Approximation for visuals
        default: yVal = 0;
      }
      
      // Map to canvas coords
      const px = pad + (x / maxN) * plotWidth;
      
      // Clamp Y so it doesn't draw below the X axis or above the chart
      let py = (h - pad) - yVal;
      if (py < pad) py = pad; // Ceiling
      
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    
    ctx.stroke();
    
    // Graph title
    ctx.fillStyle = color;
    ctx.font = "bold 14px 'Orbitron'";
    ctx.fillText(complexityStr, w - 80, pad + 20);
  }
}
