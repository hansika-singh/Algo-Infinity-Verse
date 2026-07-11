/**
 * Reverse Complexity Challenge Logic
 * Manages game state, randomized challenge generation, 
 * timer intervals, and score persistence.
 */

// Challenge Dataset (Integrated from challenge_dataset.js)
const reverseComplexityChallenges = [
  // ===== ARRAYS (8) =====
  {
    target: "O(n)",
    task: "Find the code snippet that matches the target complexity.",
    options: [
      "for(let i=0; i<n; i++) { console.log(i); }",
      "for(let i=0; i<n; i++) { for(let j=0; j<n; j++) { ... } }",
      "let i = n; while(i > 1) { i /= 2; }",
      "console.log(arr[i]);"
    ],
    correct: 0,
    explanation: "A single loop iterating n times results in O(n) linear time complexity.",
    topic: "Arrays",
    difficulty: "Easy"
  },
  {
    target: "O(log n)",
    task: "Identify the binary search pattern.",
    options: [
      "arr.forEach(x => x * 2);",
      "while(low <= high) { let mid = (low+high)/2; ... }",
      "for(let i=1; i<n; i*=2) { for(let j=0; j<i; j++) { ... } }",
      "arr.sort();"
    ],
    correct: 1,
    explanation: "Binary search repeatedly halves the search space, leading to O(log n) complexity.",
    topic: "Arrays",
    difficulty: "Medium"
  },
  {
    target: "O(n²)",
    task: "Select the nested loop implementation.",
    options: [
      "let sum = arr.reduce((a, b) => a + b, 0);",
      "for(let i=0; i<n; i++) { for(let j=i; j<n; j++) { ... } }",
      "while(n > 0) { n = Math.floor(n/10); }",
      "return [arr[0], arr[n-1]];"
    ],
    correct: 1,
    explanation: "Nested loops over the same input size n result in O(n²) quadratic time.",
    topic: "Arrays",
    difficulty: "Easy"
  },
  {
    target: "O(1)",
    task: "Which operation has constant time complexity?",
    options: [
      "arr.push(newElement); // Amortized",
      "arr.slice(0, n/2);",
      "arr.indexOf(target);",
      "arr.map(x => x.id);"
    ],
    correct: 0,
    explanation: "Appending to the end of a dynamic array is O(1) amortized constant time.",
    topic: "Arrays",
    difficulty: "Easy"
  },
  {
    target: "O(n log n)",
    task: "Identify the complexity of an efficient sorting pre-step.",
    options: [
      "arr.sort((a,b) => a-b);",
      "for(let i=0; i<n; i++) { ... }",
      "matrix[i][j] = 0;",
      "while(n > 1) { n = Math.sqrt(n); }"
    ],
    correct: 0,
    explanation: "Standard efficient sorting algorithms like Merge Sort or Quick Sort take O(n log n).",
    topic: "Arrays",
    difficulty: "Medium"
  },
  {
    target: "O(√n)",
    task: "Select the primality test complexity.",
    options: [
      "for(let i=2; i*i <= n; i++) { if(n % i === 0) return false; }",
      "for(let i=0; i<n; i++) { ... }",
      "while(n > 1) { n /= 2; }",
      "return n % 2 === 0;"
    ],
    correct: 0,
    explanation: "Checking factors up to the square root of n results in O(√n) complexity.",
    topic: "Arrays",
    difficulty: "Hard"
  },

  // ===== STRINGS (7) =====
  {
    target: "O(n)",
    task: "Check if a string is a palindrome.",
    options: [
      "let l=0, r=s.length-1; while(l<r) { if(s[l++]!==s[r--]) return false; }",
      "for(let i=0; i<s.length; i++) { for(let j=0; j<s.length; j++) { ... } }",
      "return s.split('').reverse().join('') === s;",
      "return s.charAt(0) === s.charAt(s.length-1);"
    ],
    correct: 0,
    explanation: "Single pass with two pointers is O(n) linear time.",
    topic: "Strings",
    difficulty: "Easy"
  },
  {
    target: "O(n²)",
    task: "Generate all substrings.",
    options: [
      "for(let i=0; i<n; i++) { for(let j=i; j<n; j++) { s.substring(i, j+1); } }",
      "s.split(' ').forEach(word => word.length);",
      "s.includes('pattern');",
      "s.toUpperCase();"
    ],
    correct: 0,
    explanation: "Nested loops to find all start and end points result in O(n²) substrings.",
    topic: "Strings",
    difficulty: "Medium"
  },

  // ===== LINKED LISTS (6) =====
  {
    target: "O(n)",
    task: "Traverse a singly linked list.",
    options: [
      "while(curr) { curr = curr.next; }",
      "head.next.next;",
      "for(let i=0; i<n; i++) head = head.next;",
      "if(head === null) return;"
    ],
    correct: 0,
    explanation: "Visiting every node once is O(n).",
    topic: "Linked Lists",
    difficulty: "Easy"
  },

  // ===== TREES (7) =====
  {
    target: "O(log n)",
    task: "Search in a balanced Binary Search Tree.",
    options: [
      "while(root) { if(target < root.val) root = root.left; ... }",
      "function traverse(node) { if(!node) return; traverse(left); traverse(right); }",
      "root.left.right;",
      "for(let i=0; i<n; i++) { ... }"
    ],
    correct: 0,
    explanation: "In a balanced BST, we discard half the tree at each step: O(log n).",
    topic: "Trees",
    difficulty: "Easy"
  },

  // ===== GRAPHS (6) =====
  {
    target: "O(V + E)",
    task: "Complexity of BFS using an adjacency list.",
    options: [
      "while(q.length) { for(let neighbor of adj[v]) { ... } }",
      "for(let i=0; i<V; i++) { for(let j=0; j<V; j++) { if(matrix[i][j]) ... } }",
      "Dijkstra(graph, start);",
      "Kruskal(graph);"
    ],
    correct: 0,
    explanation: "BFS visits every vertex and every edge once: O(V + E).",
    topic: "Graphs",
    difficulty: "Medium"
  },

  // ===== DYNAMIC PROGRAMMING (6) =====
  {
    target: "O(n)",
    task: "Iterative Fibonacci with tabulation.",
    options: [
      "for(let i=2; i<=n; i++) dp[i] = dp[i-1] + dp[i-2];",
      "function fib(n) { if(n<2) return n; return fib(n-1)+fib(n-2); }",
      "matrix exponentiation",
      "O(1)"
    ],
    correct: 0,
    explanation: "Iterating from 2 to n takes O(n) linear time.",
    topic: "Dynamic Programming",
    difficulty: "Easy"
  }
];

// Game State Management
let gameState = {
    challenges: [],
    currentIndex: 0,
    score: 0,
    streak: 0,
    totalChallenges: 10,
    timer: null,
    timeLeft: 30,
    isProcessing: false
};

// Initialize Game
function initGame() {
    // Randomly select 10 challenges from the dataset
    gameState.challenges = [...reverseComplexityChallenges]
        .sort(() => Math.random() - 0.5)
        .slice(0, gameState.totalChallenges);
    
    gameState.currentIndex = 0;
    gameState.score = 0;
    gameState.streak = 0;
    
    updateUI();
    loadChallenge();
}

// Load current challenge into UI
function loadChallenge() {
    if (gameState.currentIndex >= gameState.totalChallenges) {
        endGame();
        return;
    }

    const challenge = gameState.challenges[gameState.currentIndex];
    gameState.isProcessing = false;
    gameState.timeLeft = 30;

    // Update Meta
    document.getElementById('topic-badge').textContent = challenge.topic;
    document.getElementById('difficulty-badge').textContent = challenge.difficulty;
    document.getElementById('target-complexity').textContent = challenge.target;
    
    // Update Progress
    const progressPercent = (gameState.currentIndex / gameState.totalChallenges) * 100;
    document.getElementById('challenge-progress').style.width = `${progressPercent}%`;
    document.getElementById('progress-text').textContent = `Challenge ${gameState.currentIndex + 1} of ${gameState.totalChallenges}`;

    // Render Options
    const optionsGrid = document.getElementById('options-grid');
    optionsGrid.innerHTML = '';
    
    challenge.options.forEach((option, index) => {
        const card = document.createElement('div');
        card.className = 'option-card card-glass';
        card.innerHTML = `<pre class="code-snippet"><code>${escapeHTML(option)}</code></pre>`;
        card.onclick = () => selectOption(index);
        optionsGrid.appendChild(card);
    });

    startTimer();
}

// Handle Option Selection
function selectOption(index) {
    if (gameState.isProcessing) return;
    gameState.isProcessing = true;
    clearInterval(gameState.timer);

    const challenge = gameState.challenges[gameState.currentIndex];
    const isCorrect = index >= 0 && index === challenge.correct;
    const cards = document.querySelectorAll('.option-card');

    if (isCorrect) {
        gameState.score += 15 + Math.floor(gameState.timeLeft / 2);
        gameState.streak++;
        if (gameState.streak % 3 === 0) gameState.score += 5; // Streak bonus
        cards[index].classList.add('correct');
        showFeedback(true, challenge.explanation);
    } else {
        gameState.streak = 0;
        if (index >= 0 && index < cards.length) {
            cards[index].classList.add('wrong');
        }
        cards[challenge.correct].classList.add('correct');
        showFeedback(false, challenge.explanation);
    }

    updateUI();
}

// Timer Logic
function startTimer() {
    clearInterval(gameState.timer);
    gameState.timer = setInterval(() => {
        gameState.timeLeft--;
        document.getElementById('timer').textContent = gameState.timeLeft;
        
        if (gameState.timeLeft <= 0) {
            clearInterval(gameState.timer);
            selectOption(-1); // Timeout acts as wrong answer
        }
    }, 1000);
}

// Show Feedback Modal
function showFeedback(isCorrect, explanation) {
    const modal = document.getElementById('feedback-modal');
    const title = document.getElementById('feedback-title');
    const icon = document.getElementById('feedback-icon');
    const expText = document.getElementById('feedback-explanation');

    title.textContent = isCorrect ? "🎉 Brilliant!" : "💥 Not quite!";
    icon.innerHTML = isCorrect ? '<i class="fas fa-check-circle" style="color: #10b981;"></i>' : '<i class="fas fa-times-circle" style="color: #ef4444;"></i>';
    expText.textContent = explanation;

    modal.classList.remove('hidden');
}

// Advance to next challenge
document.getElementById('next-btn').onclick = () => {
    document.getElementById('feedback-modal').classList.add('hidden');
    gameState.currentIndex++;
    loadChallenge();
};

// End Game & Persist Score
function endGame() {
    clearInterval(gameState.timer);
    
    // Global addXP check
    if (typeof addXP === 'function') {
        addXP(gameState.score);
        showNotification(`Challenge Complete! Earned ${gameState.score} XP.`, "success");
    }

    // Save to localStorage using project conventions
    try {
        const progress = JSON.parse(localStorage.getItem('algoInfinityVerse')) || {};
        if (!progress.stats) progress.stats = {};
        
        const bestScore = progress.stats.reverseComplexityBest || 0;
        if (gameState.score > bestScore) {
            progress.stats.reverseComplexityBest = gameState.score;
        }
        
        localStorage.setItem('algoInfinityVerse', JSON.stringify(progress));
    } catch (e) {
        console.error('Failed to save game progress:', e);
        // Game can still complete successfully without persisting the score
    }

    // Redirect to dashboard after a delay
    setTimeout(() => {
        window.location.href = 'index.html#dashboard';
    }, 3000);
}

// Helper: Escape HTML
function escapeHTML(str) {
    const p = document.createElement('p');
    p.textContent = str;
    return p.innerHTML;
}

// UI Sync
function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('streak').textContent = gameState.streak;
    document.getElementById('timer').textContent = gameState.timeLeft;
}

// Global Notification Helper (to be safe if script.js didn't load it)
function showNotification(msg, type = 'info') {
    if (window.showNotification) {
        window.showNotification(msg, type);
    } else {
        void 0;
    }
}

// Standard project page load handler
document.addEventListener('DOMContentLoaded', () => {
    initGame();
});
