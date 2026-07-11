// boss-battle.js

// Mock Data (Could be fetched from Firebase or seed-problems.js in production)
const problems = [
    {
        title: "Two Sum",
        description: "Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.",
        difficulty: "Easy",
        examples: ["Input: nums = [2,7,11,15], target = 9  →  Output: [0,1]"],
        constraints: ["2 ≤ nums.length ≤ 10^4"],
        template: "function twoSum(nums, target) {\n    // Write your code here\n    \n}"
    },
    {
        title: "Valid Parentheses",
        description: "Given a string containing only (, ), {, }, [ and ], determine if the input is valid.",
        difficulty: "Easy",
        examples: ['Input: s = "()[]{}"  →  Output: true', 'Input: s = "(]"      →  Output: false'],
        constraints: ["1 ≤ s.length ≤ 10^4", "s consists of bracket characters only"],
        template: "function isValid(s) {\n    // Write your code here\n    \n}"
    },
    {
        title: "Binary Search",
        description: "Given a sorted array of distinct integers and a target value, return its index or -1 if not found. You must achieve O(log n) time complexity.",
        difficulty: "Medium",
        examples: ["Input: nums = [-1,0,3,5,9,12], target = 9  →  Output: 4"],
        constraints: ["1 ≤ nums.length ≤ 10^4", "All values are unique and sorted ascending"],
        template: "function search(nums, target) {\n    // Write your code here\n    \n}"
    }
];

// Game State
let playerHp = 100;
let bossHp = 100;
let score = 0;
let combo = 1;
let currentProblemIndex = 0;
let timeElapsed = 0;
let gameTimer = null;
let isPlaying = false;

// DOM Elements
const startModal = document.getElementById("start-modal");
const startBattleBtn = document.getElementById("startBattleBtn");
const battleModal = document.getElementById("battle-modal");
const restartBtn = document.getElementById("restartBtn");

const playerHpBar = document.getElementById("playerHpBar");
const playerHpText = document.getElementById("playerHpText");
const bossHpBar = document.getElementById("bossHpBar");
const bossHpText = document.getElementById("bossHpText");
const bossContainer = document.getElementById("bossContainer");

const timeRemaining = document.getElementById("timeRemaining");
const comboCounter = document.getElementById("comboCounter");
const totalScore = document.getElementById("totalScore");

const problemTitle = document.getElementById("problemTitle");
const problemDesc = document.getElementById("problemDesc");
const problemDifficulty = document.getElementById("problemDifficulty");
const problemExamples = document.getElementById("problemExamples");
const problemConstraints = document.getElementById("problemConstraints");

const codeEditorTextarea = document.getElementById("codeEditor");
const submitAttackBtn = document.getElementById("submitAttackBtn");
const feedbackMsg = document.getElementById("feedbackMsg");

let editor; // CodeMirror instance

// Initialization
function init() {
    // Hide loading screen if it exists
    const loadingScreen = document.getElementById("loading-screen");
    if (loadingScreen) {
        loadingScreen.style.display = "none";
    }
    
    // Initialize CodeMirror
    editor = CodeMirror.fromTextArea(codeEditorTextarea, {
        mode: "javascript",
        theme: "dracula",
        lineNumbers: true,
        matchBrackets: true,
        indentUnit: 4
    });
    
    // Fix sizing
    editor.setSize("100%", "100%");

    startBattleBtn.addEventListener("click", startGame);
    restartBtn.addEventListener("click", resetGame);
    submitAttackBtn.addEventListener("click", submitAttack);
}

function startGame() {
    startModal.classList.add("hidden");
    resetState();
    loadProblem();
    
    isPlaying = true;
    gameTimer = setInterval(gameTick, 1000);
}

function resetGame() {
    battleModal.classList.add("hidden");
    startGame();
}

function resetState() {
    playerHp = 100;
    bossHp = 100;
    score = 0;
    combo = 1;
    timeElapsed = 0;
    currentProblemIndex = 0;
    
    updateHealthUI();
    updateStatsUI();
}

function loadProblem() {
    if (currentProblemIndex >= problems.length) {
        // Cycle back or load harder problems
        currentProblemIndex = 0; 
    }
    
    const p = problems[currentProblemIndex];
    problemTitle.textContent = p.title;
    problemDesc.textContent = p.description;
    problemDifficulty.textContent = p.difficulty;
    
    // Style difficulty badge
    problemDifficulty.style.backgroundColor = p.difficulty === "Easy" ? "#2ecc71" : p.difficulty === "Medium" ? "#f39c12" : "#e74c3c";
    
    problemExamples.innerHTML = p.examples.map(ex => `<li>${ex}</li>`).join("");
    problemConstraints.innerHTML = p.constraints.map(c => `<li>${c}</li>`).join("");
    
    if (editor) {
        editor.setValue(p.template);
    } else {
        codeEditorTextarea.value = p.template;
    }
    feedbackMsg.textContent = "";
}

function gameTick() {
    if (!isPlaying) return;
    
    timeElapsed++;
    
    // Format Time
    const m = Math.floor(timeElapsed / 60).toString().padStart(2, '0');
    const s = (timeElapsed % 60).toString().padStart(2, '0');
    timeRemaining.textContent = `${m}:${s}`;
    
    // Player takes damage over time (e.g. 1 HP per second)
    playerHp = Math.max(0, playerHp - 1);
    updateHealthUI();
    
    if (playerHp <= 0) {
        endGame(false);
    }
}

function updateHealthUI() {
    playerHpBar.style.width = `${playerHp}%`;
    playerHpText.textContent = `${playerHp}/100`;
    
    bossHpBar.style.width = `${bossHp}%`;
    bossHpText.textContent = `${bossHp}/100`;
}

function updateStatsUI() {
    totalScore.textContent = `Score: ${score}`;
    if (combo > 1) {
        comboCounter.textContent = `x${combo} COMBO!`;
        comboCounter.classList.remove("hidden");
    } else {
        comboCounter.classList.add("hidden");
    }
}

function submitAttack() {
    if (!isPlaying) return;
    
    const code = editor.getValue().trim();
    if (code.length < 15) {
        feedbackMsg.textContent = "Your spell fizzled! (Code too short)";
        feedbackMsg.className = "feedback-msg feedback-error";
        combo = 1; // Reset combo
        updateStatsUI();
        return;
    }
    
    // --- Mock Evaluation ---
    // In a real scenario, this sends the code to the execution sandbox and awaits test results.
    // Here we simulate a successful test pass if code contains standard logic patterns.
    
    submitAttackBtn.disabled = true;
    feedbackMsg.textContent = "Casting...";
    feedbackMsg.className = "feedback-msg";
    
    setTimeout(() => {
        submitAttackBtn.disabled = false;
        
        // Mock 80% success rate for non-empty code
        const isSuccess = Math.random() > 0.2; 
        
        if (isSuccess) {
            handleSuccess();
        } else {
            handleFailure();
        }
    }, 800);
}

function handleSuccess() {
    feedbackMsg.textContent = "Tests Passed! CRITICAL HIT!";
    feedbackMsg.className = "feedback-msg feedback-success";
    
    // Boss Animation
    bossContainer.classList.add("shake");
    setTimeout(() => bossContainer.classList.remove("shake"), 500);
    
    // Apply Damage
    const baseDamage = 20;
    const totalDamage = baseDamage * (1 + (combo - 1) * 0.5); // Combo scaling
    bossHp = Math.max(0, bossHp - totalDamage);
    
    // Update Score
    score += Math.floor(100 * combo);
    combo++;
    
    updateHealthUI();
    updateStatsUI();
    
    if (bossHp <= 0) {
        endGame(true);
    } else {
        // Load next problem after a short delay
        setTimeout(() => {
            currentProblemIndex++;
            loadProblem();
        }, 1500);
    }
}

function handleFailure() {
    feedbackMsg.textContent = "Tests Failed. The Boss blocked your attack!";
    feedbackMsg.className = "feedback-msg feedback-error";
    
    // Reset combo
    combo = 1;
    
    // Counter attack penalty
    playerHp = Math.max(0, playerHp - 5);
    
    updateHealthUI();
    updateStatsUI();
    
    // Player shake animation
    const playerContainer = document.querySelector(".player-hud .avatar-container");
    playerContainer.classList.add("shake");
    setTimeout(() => playerContainer.classList.remove("shake"), 500);
    
    if (playerHp <= 0) {
        endGame(false);
    }
}

function endGame(isVictory) {
    isPlaying = false;
    clearInterval(gameTimer);
    
    battleModal.classList.remove("hidden");
    const title = document.getElementById("modal-title");
    const desc = document.getElementById("modal-desc");
    
    document.getElementById("modal-score").textContent = score;
    document.getElementById("modal-combo").textContent = combo;
    
    if (isVictory) {
        title.textContent = "VICTORY";
        title.style.color = "#2ecc71";
        desc.textContent = "You successfully defeated the Algorithm Overlord!";
    } else {
        title.textContent = "DEFEAT";
        title.style.color = "#e74c3c";
        desc.textContent = "You ran out of health. The Overlord remains undefeated.";
    }
}

// Run init
init();
