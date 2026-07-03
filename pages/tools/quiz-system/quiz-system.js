/**
 * quiz-system.js
 * Solves Issue #102: Implements a centralized, scalable MVC-style Quiz Architecture.
 * - Separates Data, State, and UI Logic.
 * - Resolves state duplication and scaling issues.
 *
 * Feature: "Explain My Mistake"
 * - Extends quiz question objects with wrongOptionRemediation[].
 * - After a wrong answer, maps selected option → remediation panel.
 * - Side panel shows: Mistake Type → Quick Fix → Retry Plan.
 * - Persists "mistake tags" per user via localStorage for future recommendations.
 */

// ==========================================
// 1. DATA LAYER (The Model)
// ==========================================
const QuizData = {
    categories: [
        {
            id: 'arrays',
            title: 'Arrays & Hashing',
            icon: 'fa-layer-group',
            desc: 'Test your knowledge on static arrays, dynamic arrays, and hash maps.',
            questions: [
                {
                    q: "What is the average time complexity for searching an element in a Hash Map?",
                    options: ["O(N)", "O(log N)", "O(1)", "O(N log N)"],
                    correct: 2,
                    explanation: "Hash maps use hashing to compute an index, providing O(1) average lookup time.",
                    wrongOptionRemediation: {
                        0: {
                            misconception: "Confusing Hash Map with Linear Search",
                            hint: "O(N) is for an unsorted list scan. A hash map doesn't scan — it computes where to look directly via a hash function.",
                            tag: "hash-basics",
                            retryTopic: "Hash Maps & Hashing",
                            retryLink: "array-learning.html#hashing"
                        },
                        1: {
                            misconception: "Confusing Hash Map with Binary Search Tree",
                            hint: "O(log N) is the complexity for BST operations. A hash map computes an index in O(1) — no tree traversal needed.",
                            tag: "hash-vs-bst",
                            retryTopic: "Hash Map vs. BST Trade-offs",
                            retryLink: "array-learning.html#hashing"
                        },
                        3: {
                            misconception: "Thinking Hash Map needs sorting",
                            hint: "O(N log N) is for sorting algorithms. Hash map lookups are direct — no sorting involved.",
                            tag: "sorting-complexity",
                            retryTopic: "Sorting vs. Hashing",
                            retryLink: "array-learning.html#hashing"
                        }
                    }
                },
                {
                    q: "Which operation is generally slowest in a standard contiguous Array?",
                    options: ["Accessing by index", "Inserting at the end", "Inserting at the beginning", "Updating an element"],
                    correct: 2,
                    explanation: "Inserting at the beginning requires shifting all existing elements, taking O(N) time.",
                    wrongOptionRemediation: {
                        0: {
                            misconception: "Thinking random access is slow",
                            hint: "Arrays store elements in contiguous memory, so index access is O(1) — just pointer arithmetic. This is actually their superpower.",
                            tag: "array-access-complexity",
                            retryTopic: "Array Memory Layout",
                            retryLink: "array-learning.html#basics"
                        },
                        1: {
                            misconception: "Confusing append with insert",
                            hint: "Inserting at the end of an array (append) is O(1) amortized — no shifting needed. Only insertions that displace existing elements are expensive.",
                            tag: "array-insert-end",
                            retryTopic: "Amortized Array Append",
                            retryLink: "array-learning.html#dynamic-arrays"
                        },
                        3: {
                            misconception: "Thinking in-place update involves shifting",
                            hint: "Updating an element is just array[i] = value — O(1). No elements are moved. Only insertions and deletions cause shifts.",
                            tag: "array-update-op",
                            retryTopic: "Array CRUD Operations",
                            retryLink: "array-learning.html#basics"
                        }
                    }
                }
            ]
        },
        {
            id: 'dp',
            title: 'Dynamic Programming',
            icon: 'fa-brain',
            desc: 'Evaluate your understanding of memoization and tabulation.',
            questions: [
                {
                    q: "What are the two required properties for a problem to be solved with Dynamic Programming?",
                    options: ["Recursion and Trees", "Overlapping Subproblems and Optimal Substructure", "Greedy Choice and Sorting", "Divide and Conquer"],
                    correct: 1,
                    explanation: "DP requires Overlapping Subproblems (to cache) and Optimal Substructure (to build solutions).",
                    wrongOptionRemediation: {
                        0: {
                            misconception: "Thinking DP is the same as general recursion",
                            hint: "Recursion alone is not DP. DP specifically caches repeated subproblem results. Without overlapping subproblems to cache, you're just doing plain recursion.",
                            tag: "dp-vs-recursion",
                            retryTopic: "When to Use DP vs. Recursion",
                            retryLink: "dp-learning.html#introduction"
                        },
                        2: {
                            misconception: "Confusing DP with Greedy algorithms",
                            hint: "Greedy makes the locally optimal choice at each step without revisiting decisions. DP explores all subproblems and caches results — it's exhaustive, not locally optimal.",
                            tag: "dp-vs-greedy",
                            retryTopic: "DP vs. Greedy Trade-offs",
                            retryLink: "dp-learning.html#vs-greedy"
                        },
                        3: {
                            misconception: "Confusing DP with Divide and Conquer",
                            hint: "Divide & Conquer splits into non-overlapping subproblems (like merge sort). DP requires overlapping subproblems to be worth caching.",
                            tag: "dp-vs-divide-conquer",
                            retryTopic: "DP vs. Divide & Conquer",
                            retryLink: "dp-learning.html#introduction"
                        }
                    }
                },
                {
                    q: "Which DP approach generally avoids recursion stack overflow?",
                    options: ["Memoization (Top-Down)", "Tabulation (Bottom-Up)", "Backtracking", "Divide and Conquer"],
                    correct: 1,
                    explanation: "Tabulation iteratively builds an array from the base cases up, requiring no call stack.",
                    wrongOptionRemediation: {
                        0: {
                            misconception: "Thinking memoization avoids the call stack",
                            hint: "Memoization is Top-Down — it still uses recursion and builds a call stack. For very deep inputs, this CAN cause stack overflow. Tabulation (Bottom-Up) eliminates this entirely.",
                            tag: "memoization-stack",
                            retryTopic: "Memoization Limitations",
                            retryLink: "dp-learning.html#memoization"
                        },
                        2: {
                            misconception: "Mixing up backtracking with DP approaches",
                            hint: "Backtracking is a brute-force exploration strategy (trying all possibilities). It's not a DP variant — it heavily uses the call stack and doesn't cache subproblem results.",
                            tag: "backtracking-vs-dp",
                            retryTopic: "Backtracking vs. DP",
                            retryLink: "dp-learning.html#introduction"
                        },
                        3: {
                            misconception: "Thinking Divide & Conquer is a DP approach",
                            hint: "Divide & Conquer (like merge sort) is not a DP strategy. DP approaches are specifically Memoization (top-down) and Tabulation (bottom-up).",
                            tag: "dp-approaches",
                            retryTopic: "DP Approaches Overview",
                            retryLink: "dp-learning.html#tabulation"
                        }
                    }
                }
            ]
        },
        {
            id: 'graphs',
            title: 'Graphs & Traversal',
            icon: 'fa-project-diagram',
            desc: 'Test your grasp of BFS, DFS, shortest paths, and graph representations.',
            questions: [
                {
                    q: "Which algorithm is guaranteed to find the shortest path in an unweighted graph?",
                    options: ["DFS (Depth-First Search)", "BFS (Breadth-First Search)", "Dijkstra's Algorithm", "Bellman-Ford"],
                    correct: 1,
                    explanation: "BFS explores nodes level by level, guaranteeing the first time a node is reached is via the shortest path in an unweighted graph.",
                    wrongOptionRemediation: {
                        0: {
                            misconception: "Thinking DFS finds shortest paths",
                            hint: "DFS dives deep before backtracking — it may find A path but not necessarily the shortest one. BFS explores level-by-level, which naturally guarantees shortest distance in unweighted graphs.",
                            tag: "dfs-shortest-path",
                            retryTopic: "BFS vs. DFS for Shortest Path",
                            retryLink: "graph-learning.html#bfs"
                        },
                        2: {
                            misconception: "Applying Dijkstra's to unweighted graphs",
                            hint: "Dijkstra's is designed for weighted graphs. While it works on unweighted ones (treating all weights as 1), BFS is simpler and more efficient for unweighted shortest paths.",
                            tag: "dijkstra-unweighted",
                            retryTopic: "When to Use BFS vs. Dijkstra",
                            retryLink: "graph-learning.html#shortest-path"
                        },
                        3: {
                            misconception: "Using Bellman-Ford for unweighted graphs",
                            hint: "Bellman-Ford handles negative weights and is O(VE) — overkill and slower for unweighted graphs. BFS is O(V+E) and is the right tool here.",
                            tag: "bellman-ford-unweighted",
                            retryTopic: "Graph Algorithm Selection Guide",
                            retryLink: "graph-learning.html#algorithms"
                        }
                    }
                },
                {
                    q: "What data structure does BFS (Breadth-First Search) use internally?",
                    options: ["Stack", "Queue", "Heap (Priority Queue)", "Hash Map"],
                    correct: 1,
                    explanation: "BFS uses a Queue (FIFO) to process nodes level by level — ensuring nodes are visited in the order they're discovered.",
                    wrongOptionRemediation: {
                        0: {
                            misconception: "Confusing BFS with DFS",
                            hint: "A Stack is used in DFS — it processes the most recently discovered node first (LIFO). BFS uses a Queue to process the earliest discovered node first (FIFO), giving level-order traversal.",
                            tag: "bfs-dfs-data-structure",
                            retryTopic: "BFS vs. DFS Internal Mechanics",
                            retryLink: "graph-learning.html#bfs"
                        },
                        2: {
                            misconception: "Confusing BFS with Dijkstra's algorithm",
                            hint: "Dijkstra's uses a Min-Heap (priority queue) to always process the lowest-cost node next. BFS doesn't need cost prioritization — it just uses a plain Queue.",
                            tag: "bfs-vs-dijkstra-structure",
                            retryTopic: "BFS vs. Dijkstra Data Structures",
                            retryLink: "graph-learning.html#algorithms"
                        },
                        3: {
                            misconception: "Thinking BFS needs a Hash Map",
                            hint: "Hash Maps are used to track *visited* nodes in BFS, but they're not the core traversal structure. The Queue is what drives the level-by-level expansion.",
                            tag: "bfs-visited-set",
                            retryTopic: "BFS Implementation Details",
                            retryLink: "graph-learning.html#bfs"
                        }
                    }
                }
            ]
        },
        {
            id: 'sliding-window',
            title: 'Sliding Window',
            icon: 'fa-window-maximize',
            desc: 'Validate your understanding of fixed and variable sliding window patterns.',
            questions: [
                {
                    q: "The Sliding Window technique is most useful for problems involving what?",
                    options: ["Finding all permutations of an array", "Contiguous subarrays or substrings", "Sorting elements in-place", "Tree path sums"],
                    correct: 1,
                    explanation: "Sliding window maintains a window (range of indices) that shrinks/expands over contiguous elements, making it ideal for subarray/substring problems.",
                    wrongOptionRemediation: {
                        0: {
                            misconception: "Thinking sliding window solves permutations",
                            hint: "Permutations require trying all orderings — that's a backtracking problem. Sliding window applies when you're looking at a linear range of elements, not rearrangements.",
                            tag: "sliding-window-scope",
                            retryTopic: "When to Use Sliding Window",
                            retryLink: "sliding-window-learning.html#introduction"
                        },
                        2: {
                            misconception: "Confusing sliding window with in-place sorting",
                            hint: "Sorting algorithms (quicksort, bubble sort) are about comparing and swapping elements. Sliding window never reorders — it tracks a movable range of elements.",
                            tag: "sliding-window-vs-sorting",
                            retryTopic: "Sliding Window Use Cases",
                            retryLink: "sliding-window-learning.html#patterns"
                        },
                        3: {
                            misconception: "Applying sliding window to tree structures",
                            hint: "Sliding window works on linear data structures (arrays, strings) with contiguous index ranges. Tree paths aren't contiguous in memory — use DFS/BFS for tree problems.",
                            tag: "sliding-window-linear-only",
                            retryTopic: "Sliding Window vs. Tree Traversal",
                            retryLink: "sliding-window-learning.html#introduction"
                        }
                    }
                }
            ]
        }
    ]
};

// ==========================================
// 2. STATE MANAGEMENT (Centralized State)
// ==========================================
const MISTAKE_STORAGE_KEY = 'aiv_mistake_tags';

class QuizState {
    constructor() {
        this.reset();
    }

    reset() {
        this.activeCategoryId = null;
        this.questions = [];
        this.currentIndex = 0;
        this.score = 0;
        this.hasAnsweredCurrent = false;
        this.sessionMistakeTags = []; // Tags collected this session
    }

    startQuiz(categoryId) {
        this.reset();
        this.activeCategoryId = categoryId;
        const category = QuizData.categories.find(c => c.id === categoryId);
        this.questions = category ? category.questions : [];
    }

    getCurrentQuestion() {
        return this.questions[this.currentIndex];
    }

    getProgress() {
        return {
            current: this.currentIndex + 1,
            total: this.questions.length,
            percentage: ((this.currentIndex) / this.questions.length) * 100
        };
    }

    submitAnswer(selectedIndex) {
        this.hasAnsweredCurrent = true;
        const isCorrect = selectedIndex === this.getCurrentQuestion().correct;
        if (isCorrect) this.score++;
        return isCorrect;
    }

    /**
     * Returns the remediation object for the selected wrong option, or null if correct.
     * @param {number} selectedIndex - The index of the option the user chose
     * @returns {Object|null}
     */
    getRemediationForAnswer(selectedIndex) {
        const q = this.getCurrentQuestion();
        if (selectedIndex === q.correct) return null;
        return (q.wrongOptionRemediation && q.wrongOptionRemediation[selectedIndex]) || null;
    }

    /**
     * Increments the mistake count for a given tag in localStorage.
     * @param {string} tag
     */
    recordMistake(tag) {
        if (!tag) return;
        this.sessionMistakeTags.push(tag);
        try {
            const raw = JSON.parse(localStorage.getItem(MISTAKE_STORAGE_KEY)) || {};
            raw[tag] = (raw[tag] || 0) + 1;
            localStorage.setItem(MISTAKE_STORAGE_KEY, JSON.stringify(raw));
        } catch (e) {
            console.warn('Could not persist mistake tag:', e);
        }
    }

    /**
     * Returns a sorted array of { tag, count } from localStorage for this user.
     * @returns {Array<{tag: string, count: number}>}
     */
    getMistakePersistence() {
        try {
            const raw = JSON.parse(localStorage.getItem(MISTAKE_STORAGE_KEY)) || {};
            return Object.entries(raw)
                .map(([tag, count]) => ({ tag, count }))
                .sort((a, b) => b.count - a.count);
        } catch {
            return [];
        }
    }

    nextQuestion() {
        this.currentIndex++;
        this.hasAnsweredCurrent = false;
        return this.currentIndex < this.questions.length;
    }

    getFinalScore() {
        return {
            score: this.score,
            total: this.questions.length,
            percentage: Math.round((this.score / this.questions.length) * 100),
            sessionMistakeTags: this.sessionMistakeTags
        };
    }
}

// ==========================================
// 3. UI CONTROLLER (Presentation Layer)
// ==========================================
class QuizUI {
    constructor(controller) {
        this.controller = controller;
        this.cacheDOM();
        this.bindEvents();
    }

    cacheDOM() {
        this.views = {
            categories: document.getElementById('view-categories'),
            quiz: document.getElementById('view-active-quiz'),
            results: document.getElementById('view-results')
        };

        // Category View Elements
        this.categoryGrid = document.getElementById('categoryGrid');

        // Active Quiz Elements
        this.quizTopicLabel = document.getElementById('quizTopicLabel');
        this.quizProgressLabel = document.getElementById('quizProgressLabel');
        this.quizProgressBar = document.getElementById('quizProgressBar');
        this.questionText = document.getElementById('questionText');
        this.optionsGrid = document.getElementById('optionsGrid');
        this.feedbackMsg = document.getElementById('feedbackMsg');
        this.btnNextQuestion = document.getElementById('btnNextQuestion');
        this.btnExitQuiz = document.getElementById('btnExitQuiz');

        // Mistake Panel Elements
        this.mistakePanel = document.getElementById('mistakePanel');
        this.mistakeBadge = document.getElementById('mistakeBadge');
        this.mistakeMisconception = document.getElementById('mistakeMisconception');
        this.mistakeHint = document.getElementById('mistakeHint');
        this.retryLink = document.getElementById('retryLink');
        this.retryLabel = document.getElementById('retryLabel');

        // Results View Elements
        this.finalScoreDisplay = document.getElementById('finalScoreDisplay');
        this.resultsMessage = document.getElementById('resultsMessage');
        this.weakAreasSection = document.getElementById('weakAreasSection');
        this.weakAreasList = document.getElementById('weakAreasList');
        this.btnRestartQuiz = document.getElementById('btnRestartQuiz');
        this.btnReturnHome = document.getElementById('btnReturnHome');
    }

    bindEvents() {
        this.btnNextQuestion.addEventListener('click', () => this.controller.handleNextQuestion());
        this.btnExitQuiz.addEventListener('click', () => this.controller.handleExit());
        this.btnRestartQuiz.addEventListener('click', () => this.controller.handleRestart());
        this.btnReturnHome.addEventListener('click', () => this.controller.handleExit());
    }

    switchView(viewName) {
        Object.values(this.views).forEach(v => v.classList.replace('active', 'hidden'));
        this.views[viewName].classList.replace('hidden', 'active');
    }

    renderCategories(categories) {
        this.categoryGrid.innerHTML = '';
        categories.forEach(cat => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'cat-card';
            card.setAttribute('aria-label', `Start ${cat.title} module`);
            card.innerHTML = `
                <i class="fas ${cat.icon} cat-icon"></i>
                <h4 class="cat-title">${cat.title}</h4>
                <p class="cat-desc">${cat.desc}</p>
            `;
            card.addEventListener('click', () => this.controller.handleStartQuiz(cat.id));
            this.categoryGrid.appendChild(card);
        });
    }

    renderQuestion(questionData, progressData, categoryTitle) {
        // Update Headers
        this.quizTopicLabel.textContent = categoryTitle;
        this.quizProgressLabel.textContent = `Question ${progressData.current} of ${progressData.total}`;
        this.quizProgressBar.style.width = `${progressData.percentage}%`;

        // Reset state
        this.btnNextQuestion.disabled = true;
        this.feedbackMsg.textContent = '';
        this.feedbackMsg.className = 'feedback-msg';

        // Hide mistake panel for new question
        this.hideMistakePanel();

        // Render Question & Options
        this.questionText.textContent = questionData.q;
        this.optionsGrid.innerHTML = '';

        questionData.options.forEach((opt, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt;
            btn.addEventListener('click', () => this.controller.handleAnswer(index, btn));
            this.optionsGrid.appendChild(btn);
        });
    }

    showAnswerFeedback(selectedIndex, correctIndex, explanation, isCorrect, clickedBtn) {
        const allBtns = this.optionsGrid.querySelectorAll('.option-btn');
        allBtns.forEach(btn => btn.disabled = true);

        if (isCorrect) {
            clickedBtn.classList.add('correct');
            clickedBtn.innerHTML += ' <i class="fas fa-check-circle"></i>';
            this.feedbackMsg.textContent = "Correct! " + explanation;
            this.feedbackMsg.className = 'feedback-msg success';
        } else {
            clickedBtn.classList.add('wrong');
            clickedBtn.innerHTML += ' <i class="fas fa-times-circle"></i>';
            allBtns[correctIndex].classList.add('correct');

            this.feedbackMsg.textContent = "Incorrect. " + explanation;
            this.feedbackMsg.className = 'feedback-msg error';
        }

        this.btnNextQuestion.disabled = false;
    }

    /**
     * Displays the animated "Explain My Mistake" panel.
     * @param {Object} remediation - { misconception, hint, tag, retryTopic, retryLink }
     */
    showMistakePanel(remediation) {
        if (!remediation || !this.mistakePanel) return;

        // Populate content
        this.mistakeBadge.textContent = `⚡ ${this._formatTag(remediation.tag)}`;
        this.mistakeMisconception.textContent = remediation.misconception;
        this.mistakeHint.textContent = remediation.hint;
        this.retryLabel.textContent = remediation.retryTopic;
        this.retryLink.href = remediation.retryLink || '#';
        this.retryLink.target = '_blank'; // Preserve quiz state
        this.retryLink.rel = 'noopener noreferrer';

        // Animate in
        requestAnimationFrame(() => {
            this.mistakePanel.classList.add('visible');
        });
    }

    /**
     * Hides and resets the mistake panel.
     */
    hideMistakePanel() {
        if (!this.mistakePanel) return;
        this.mistakePanel.classList.remove('visible');
    }

    /**
     * Renders the results view including a "Weak Areas" section.
     * @param {Object} scoreData - { score, total, percentage, sessionMistakeTags }
     * @param {Array} allTimeMistakes - sorted [{ tag, count }] from localStorage
     */
    renderResults(scoreData, allTimeMistakes) {
        this.quizProgressBar.style.width = '100%';
        this.finalScoreDisplay.textContent = `${scoreData.percentage}%`;

        if (scoreData.percentage >= 80) {
            this.resultsMessage.textContent = "Outstanding! You have a solid grasp of this module.";
            this.finalScoreDisplay.style.color = 'var(--quiz-success)';
        } else if (scoreData.percentage >= 50) {
            this.resultsMessage.textContent = "Good job. A little more review and you'll master this.";
            this.finalScoreDisplay.style.color = 'var(--quiz-secondary)';
        } else {
            this.resultsMessage.textContent = "Keep practicing! Review the learning materials and try again.";
            this.finalScoreDisplay.style.color = 'var(--quiz-danger)';
        }

        // Render weak areas from this session
        const sessionTags = scoreData.sessionMistakeTags;
        if (sessionTags && sessionTags.length > 0) {
            // De-dupe and count session tags
            const tagCounts = sessionTags.reduce((acc, tag) => {
                acc[tag] = (acc[tag] || 0) + 1;
                return acc;
            }, {});

            this.weakAreasList.innerHTML = Object.entries(tagCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([tag, count]) => `
                    <li class="weak-area-item">
                        <span class="weak-tag">${this._formatTag(tag)}</span>
                        <span class="weak-count">${count} mistake${count > 1 ? 's' : ''}</span>
                    </li>
                `).join('');
            this.weakAreasSection.classList.remove('hidden');
        } else {
            this.weakAreasSection.classList.add('hidden');
        }
    }

    /**
     * Converts a kebab-case tag like "hash-basics" to "Hash Basics".
     */
    _formatTag(tag) {
        if (!tag) return '';
        return tag.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
}

// ==========================================
// 4. MAIN ORCHESTRATOR (The Controller)
// ==========================================
class QuizController {
    constructor() {
        this.state = new QuizState();
        this.ui = new QuizUI(this);
        this.init();
    }

    init() {
        this.ui.renderCategories(QuizData.categories);
        this.ui.switchView('categories');
    }

    handleStartQuiz(categoryId) {
        this.state.startQuiz(categoryId);
        const categoryTitle = QuizData.categories.find(c => c.id === categoryId).title;
        this.ui.switchView('quiz');
        this.ui.renderQuestion(this.state.getCurrentQuestion(), this.state.getProgress(), categoryTitle);
    }

    handleAnswer(selectedIndex, btnElement) {
        if (this.state.hasAnsweredCurrent) return;

        const isCorrect = this.state.submitAnswer(selectedIndex);
        const currentQ = this.state.getCurrentQuestion();

        // Show standard answer feedback (correct/wrong highlighting + explanation)
        this.ui.showAnswerFeedback(selectedIndex, currentQ.correct, currentQ.explanation, isCorrect, btnElement);

        if (!isCorrect) {
            // Get targeted remediation for the specific wrong option
            const remediation = this.state.getRemediationForAnswer(selectedIndex);
            if (remediation) {
                // Persist the mistake tag to localStorage
                this.state.recordMistake(remediation.tag);
                // Show the "Explain My Mistake" panel
                this.ui.showMistakePanel(remediation);
            }
        }
    }

    handleNextQuestion() {
        // Collapse mistake panel before advancing
        this.ui.hideMistakePanel();

        const hasMore = this.state.nextQuestion();
        if (hasMore) {
            const categoryTitle = QuizData.categories.find(c => c.id === this.state.activeCategoryId).title;
            this.ui.renderQuestion(this.state.getCurrentQuestion(), this.state.getProgress(), categoryTitle);
        } else {
            this.handleFinishQuiz();
        }
    }

    async handleFinishQuiz() {
        const scoreData = this.state.getFinalScore();
        const allTimeMistakes = this.state.getMistakePersistence();
        this.ui.renderResults(scoreData, allTimeMistakes);
        this.ui.switchView('results');

        // Save quiz result to Firestore if user is authenticated
        await this.saveQuizResult(scoreData);
        
        // Update results message after save attempt
        this.ui.renderResults(scoreData, false);
    }

    async saveQuizResult(scoreData) {
        try {
            // Check if user is authenticated via session
            const sessionResp = await fetch('/api/session', { credentials: 'include' });
            const sessionData = await sessionResp.json();

            if (!sessionData.authenticated || !sessionData.user) {
                // User not logged in — skip saving
                console.log('Quiz result not saved: user not authenticated.');
                return;
            }

            const category = QuizData.categories.find(c => c.id === this.state.activeCategoryId);
            if (!category) return;

            const payload = {
                quizId: category.id,
                quizTitle: category.title,
                score: scoreData.score,
                totalQuestions: scoreData.total,
                correctAnswers: scoreData.score,
                percentage: scoreData.percentage,
                topic: category.title,
            };

            const response = await fetch('/api/quiz-results', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                console.warn('Failed to save quiz result:', err.error || response.statusText);
            } else {
                console.log('Quiz result saved successfully.');
            }
        } catch (error) {
            // Network failure — log but don't block UI
            console.warn('Quiz result save failed (network):', error.message);
        }
    }

    handleRestart() {
        this.handleStartQuiz(this.state.activeCategoryId);
    }

    handleExit() {
        this.state.reset();
        this.ui.switchView('categories');
        window.scrollTo(0, 0);
    }
}

// Bootstrap Application
document.addEventListener("DOMContentLoaded", () => {
    new QuizController();
});
