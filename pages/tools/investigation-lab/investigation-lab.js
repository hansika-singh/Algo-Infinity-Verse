
document.addEventListener("DOMContentLoaded", () => {
    initCrimeLab();
});

// The Case Database
const crimeCases = [
    {
        id: "21",
        title: "Duplicate Transaction Mystery",
        difficulty: "Easy",
        diffClass: "diff-easy",
        description: "A major bank reports that duplicate transactions are mysteriously appearing in customer accounts. The backend logs show millions of transactions streaming in real-time. We need to catch the duplicates immediately.",
        evidence: [
            "Transaction IDs are stored in an array/stream.",
            "Duplicates may appear multiple times unpredictably.",
            "Extremely fast (O(1)) lookup is required to not slow down the payment gateway."
        ],
        suspects: ["Binary Search", "Hashing", "DFS", "Heap"],
        correctIndex: 1, // Hashing
        hint: "We don't need the data sorted, and we don't care about the maximum/minimum value. We just need to ask: 'Have I seen this exact ID before?' as fast as possible.",
        explanation: "Hashing (specifically a Hash Set) is the correct suspect! It provides O(1) average time complexity for insertions and lookups, making it perfect for detecting exact duplicates in a massive, unsorted stream of data."
    },
    {
        id: "44",
        title: "The Stolen Network Packets",
        difficulty: "Medium",
        diffClass: "diff-medium",
        description: "A cyber-criminal is intercepting data packets across our server network. We need to route our security tracing algorithm from the Mainframe to the compromised server using the absolute fastest route possible.",
        evidence: [
            "The network is represented as servers (nodes) and connections (edges).",
            "Connections have varying latency (positive weights).",
            "We need the absolute shortest path from a single source to a destination."
        ],
        suspects: ["Breadth-First Search (BFS)", "Kruskal's Algorithm", "Dijkstra's Algorithm", "Floyd-Warshall"],
        correctIndex: 2, // Dijkstra
        hint: "BFS only works for unweighted graphs. Kruskal's builds a Minimum Spanning Tree. We need a single-source shortest path algorithm for positive weighted edges.",
        explanation: "Dijkstra's Algorithm is the culprit! It efficiently finds the shortest path from a starting node to all other nodes in a graph with non-negative edge weights using a Priority Queue."
    },
    {
        id: "89",
        title: "The Counterfeit String Forgery",
        difficulty: "Hard",
        diffClass: "diff-hard",
        description: "Forensic analysts found a massive 10GB text file dumped by a hacker. Hidden inside is a specific 50-character digital signature (a string pattern). We must find its exact location without taking hours to scan.",
        evidence: [
            "We are searching for a specific pattern `P` inside a massive text `T`.",
            "A naive O(N*M) character-by-character search takes too long.",
            "We need an algorithm that preprocesses the pattern to avoid backtracking in the text."
        ],
        suspects: ["Two Pointers", "Knuth-Morris-Pratt (KMP)", "Segment Tree", "Trie"],
        correctIndex: 1, // KMP
        hint: "A Trie is great for a dictionary of many words, but we are looking for ONE pattern in a long text. Which algorithm uses a Prefix/LPS array?",
        explanation: "Knuth-Morris-Pratt (KMP) is the master of this crime! By computing an LPS (Longest Prefix Suffix) array, KMP searches for a pattern in O(N+M) time without ever moving backward in the main text."
    }
];

// State
let solvedCases = new Set();
let currentCase = null;

// DOM Elements
const elements = {
    caseList: document.getElementById('caseList'),
    casesSolvedDisplay: document.getElementById('casesSolved'),
    detectiveRank: document.getElementById('detectiveRank'),
    
    // Active Case UI
    caseIdDisplay: document.getElementById('caseIdDisplay'),
    caseDifficultyDisplay: document.getElementById('caseDifficultyDisplay'),
    caseTitleDisplay: document.getElementById('caseTitleDisplay'),
    caseDescDisplay: document.getElementById('caseDescDisplay'),
    evidenceGrid: document.getElementById('evidenceGrid'),
    suspectsGrid: document.getElementById('suspectsGrid'),
    
    // Hints & Feedback
    btnHint: document.getElementById('btnHint'),
    hintDisplay: document.getElementById('hintDisplay'),
    feedbackPanel: document.getElementById('feedbackPanel'),
    feedbackIcon: document.getElementById('feedbackIcon'),
    feedbackTitle: document.getElementById('feedbackTitle'),
    feedbackText: document.getElementById('feedbackText'),
    btnNextCase: document.getElementById('btnNextCase'),

    // Badges
    badges: {
        Easy: document.getElementById('badge-easy'),
        Medium: document.getElementById('badge-medium'),
        Hard: document.getElementById('badge-hard')
    }
};

function initCrimeLab() {
    renderSidebar();
    
    // Hint button listener
    elements.btnHint.addEventListener('click', () => {
        if (!currentCase) return;
        elements.hintDisplay.textContent = currentCase.hint;
        elements.hintDisplay.classList.add('visible');
        elements.btnHint.style.display = 'none';
    });

    // Next case listener
    elements.btnNextCase.addEventListener('click', () => {
        // Find next unsolved case
        const nextCase = crimeCases.find(c => !solvedCases.has(c.id));
        if (nextCase) {
            loadCase(nextCase.id);
        } else {
            // All solved
            elements.caseTitleDisplay.textContent = "All Cases Closed.";
            elements.caseDescDisplay.textContent = "Excellent work, Detective. The data structures are safe once again.";
            elements.caseDifficultyDisplay.style.display = 'none';
            elements.caseIdDisplay.style.display = 'none';
            elements.evidenceGrid.innerHTML = '';
            elements.suspectsGrid.innerHTML = '';
            elements.feedbackPanel.classList.remove('visible');
            elements.btnHint.style.display = 'none';
        }
    });

    // Load first case by default
    if (crimeCases.length > 0) {
        loadCase(crimeCases[0].id);
    }
}

function renderSidebar() {
    elements.caseList.innerHTML = '';
    crimeCases.forEach(c => {
        const li = document.createElement('li');
        li.className = `case-item ${currentCase && currentCase.id === c.id ? 'active' : ''} ${solvedCases.has(c.id) ? 'solved' : ''}`;
        li.onclick = () => loadCase(c.id);
        
        li.innerHTML = `
            <span class="c-id">FILE #${c.id}</span>
            <span class="c-title">${c.title}</span>
            <span class="c-diff ${c.diffClass}">${c.difficulty}</span>
        `;
        elements.caseList.appendChild(li);
    });
}

function loadCase(id) {
    currentCase = crimeCases.find(c => c.id === id);
    if (!currentCase) return;

    // Reset UI state
    elements.feedbackPanel.classList.remove('visible', 'success', 'error');
    elements.btnNextCase.style.display = 'none';
    elements.hintDisplay.classList.remove('visible');
    elements.btnHint.style.display = 'flex';
    elements.caseIdDisplay.style.display = 'inline-block';
    elements.caseDifficultyDisplay.style.display = 'inline-block';

    // Populate Data
    elements.caseIdDisplay.textContent = `CASE #${currentCase.id}`;
    elements.caseDifficultyDisplay.textContent = currentCase.difficulty;
    elements.caseDifficultyDisplay.className = `case-difficulty ${currentCase.diffClass}`;
    elements.caseTitleDisplay.textContent = currentCase.title;
    elements.caseDescDisplay.textContent = currentCase.description;

    // Render Evidence
    elements.evidenceGrid.innerHTML = '';
    currentCase.evidence.forEach((ev, idx) => {
        const div = document.createElement('div');
        div.className = 'evidence-card';
        div.innerHTML = `
            <span class="ev-label">Evidence ${String.fromCharCode(65 + idx)}</span>
            <span class="ev-text">${ev}</span>
        `;
        elements.evidenceGrid.appendChild(div);
    });

    // Render Suspects (Options)
    elements.suspectsGrid.innerHTML = '';
    const isSolved = solvedCases.has(currentCase.id);
    
    currentCase.suspects.forEach((suspect, idx) => {
        const btn = document.createElement('button');
        btn.className = 'suspect-btn';
        btn.textContent = suspect;
        
        if (isSolved) {
            btn.disabled = true;
            if (idx === currentCase.correctIndex) btn.classList.add('correct');
        } else {
            btn.onclick = () => handleAccusation(idx, btn);
        }
        
        elements.suspectsGrid.appendChild(btn);
    });

    if (isSolved) {
        showFeedback(true);
        elements.btnHint.style.display = 'none';
    }

    renderSidebar(); // Update active state
}

function handleAccusation(selectedIndex, btnElement) {
    if (!currentCase || solvedCases.has(currentCase.id)) return;

    const isCorrect = selectedIndex === currentCase.correctIndex;
    
    // Disable all buttons
    const allBtns = elements.suspectsGrid.querySelectorAll('.suspect-btn');
    allBtns.forEach(b => {
        b.disabled = true;
        b.setAttribute('aria-disabled', 'true');
    });

    if (isCorrect) {
        btnElement.classList.add('correct');
        solvedCases.add(currentCase.id);
        updateDashboard();
        showFeedback(true);
    } else {
        btnElement.classList.add('incorrect');
        // Highlight correct one
        allBtns[currentCase.correctIndex].classList.add('correct');
        showFeedback(false);
    }
    
    renderSidebar();
}

function showFeedback(isCorrect) {
    elements.feedbackPanel.className = `feedback-panel visible ${isCorrect ? 'success' : 'error'}`;
    elements.feedbackIcon.innerHTML = isCorrect ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-times-circle"></i>';
    elements.feedbackTitle.textContent = isCorrect ? "Case Solved!" : "Wrong Suspect!";
    elements.feedbackText.textContent = currentCase.explanation;
    
    // Hide hint button if shown
    elements.btnHint.style.display = 'none';
    
    if (isCorrect) {
        elements.btnNextCase.style.display = 'flex';
    } else {
        elements.btnNextCase.style.display = 'none';
        // Allow retry by creating a "Reset Investigation" button dynamically
        const retryBtn = document.createElement('button');
        retryBtn.className = 'btn-next-case';
        retryBtn.innerHTML = '<i class="fas fa-redo"></i> Re-investigate';
        retryBtn.onclick = () => loadCase(currentCase.id);
        
        // Remove old retry button if exists
        const existing = elements.feedbackPanel.querySelector('.fa-redo');
        if (existing) existing.parentElement.remove();
        
        elements.feedbackPanel.appendChild(retryBtn);
    }
}

function updateDashboard() {
    elements.casesSolvedDisplay.textContent = solvedCases.size;
    
    // Update Rank
    if (solvedCases.size === 1) elements.detectiveRank.textContent = "Junior Detective";
    if (solvedCases.size === 2) elements.detectiveRank.textContent = "Senior Investigator";
    if (solvedCases.size === 3) elements.detectiveRank.textContent = "Chief of Algorithms";

    // Unlock Badges based on solved difficulty
    solvedCases.forEach(id => {
        const c = crimeCases.find(caseObj => caseObj.id === id);
        if (c && elements.badges[c.difficulty]) {
            elements.badges[c.difficulty].classList.add('unlocked');
        }
    });
}
