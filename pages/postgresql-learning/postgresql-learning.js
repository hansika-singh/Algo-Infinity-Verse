// State Variables
let activeModule = 0;
let activeLesson = 0;
let activeTab = 'lesson';
let userProgress = JSON.parse(localStorage.getItem('postgresHubProgress')) || { completedLessons: [], completedQuizzes: [] };

// Curriculum Data
const curriculum = [
    {
        id: 'module-1',
        title: 'SQL Fundamentals & CRUD',
        lessons: [
            {
                id: 'm1-l1',
                title: 'Introduction & SELECT',
                content: `
                    <div class="lesson-prose">
                        <h2>Welcome to PostgreSQL!</h2>
                        <p>PostgreSQL is a powerful, open-source object-relational database system. Let's start with the basics: retrieving data.</p>
                        <p>The <code>SELECT</code> statement is used to select data from a database. The data returned is stored in a result table, called the result-set.</p>
                        <h3>Syntax</h3>
                        <pre><code>SELECT column1, column2 FROM table_name;</code></pre>
                        <p>To select all columns, use the asterisk (*):</p>
                        <pre><code>SELECT * FROM users;</code></pre>
                        <p>Go to the <strong>SQL Simulator</strong> tab and try running the default query to see the users in our database!</p>
                    </div>
                `,
                defaultCode: 'SELECT * FROM users;',
                expectedKeyword: 'SELECT',
                expectedTable: 'users'
            },
            {
                id: 'm1-l2',
                title: 'INSERT Data',
                content: `
                    <div class="lesson-prose">
                        <h2>Inserting Data</h2>
                        <p>The <code>INSERT INTO</code> statement is used to insert new records in a table.</p>
                        <h3>Syntax</h3>
                        <pre><code>INSERT INTO table_name (column1, column2, column3, ...)
VALUES (value1, value2, value3, ...);</code></pre>
                        <p>Try adding a new user to the <code>users</code> table.</p>
                        <p>Example: <code>INSERT INTO users (id, name, email) VALUES (4, 'Alice Smith', 'alice@example.com');</code></p>
                    </div>
                `,
                defaultCode: "INSERT INTO users (id, name, email)\nVALUES (4, 'Alice Smith', 'alice@example.com');",
                expectedKeyword: 'INSERT',
                expectedTable: 'users'
            }
        ],
        quiz: [
            {
                id: 'q1',
                question: 'Which SQL statement is used to extract data from a database?',
                options: ['EXTRACT', 'GET', 'OPEN', 'SELECT'],
                correct: 3
            },
            {
                id: 'q2',
                question: 'Which SQL statement is used to insert new data in a database?',
                options: ['ADD NEW', 'INSERT INTO', 'INSERT NEW', 'ADD RECORD'],
                correct: 1
            }
        ]
    },
    {
        id: 'module-2',
        title: 'Relationships & JOINs',
        lessons: [
            {
                id: 'm2-l1',
                title: 'INNER JOIN',
                content: `
                    <div class="lesson-prose">
                        <h2>Working with Multiple Tables</h2>
                        <p>A <code>JOIN</code> clause is used to combine rows from two or more tables, based on a related column between them.</p>
                        <p>The <code>INNER JOIN</code> keyword selects records that have matching values in both tables.</p>
                        <h3>Syntax</h3>
                        <pre><code>SELECT columns
FROM table1
INNER JOIN table2
ON table1.column_name = table2.column_name;</code></pre>
                        <p>Try joining the <code>users</code> and <code>orders</code> tables!</p>
                    </div>
                `,
                defaultCode: 'SELECT users.name, orders.product, orders.amount\nFROM users\nINNER JOIN orders ON users.id = orders.user_id;',
                expectedKeyword: 'JOIN',
                expectedTable: 'orders'
            }
        ],
        quiz: [
            {
                id: 'q3',
                question: 'Which type of JOIN returns rows that have matching values in both tables?',
                options: ['OUTER JOIN', 'INNER JOIN', 'CROSS JOIN', 'LEFT JOIN'],
                correct: 1
            }
        ]
    },
    {
        id: 'module-3',
        title: 'Advanced: JSONB & Indexes',
        lessons: [
            {
                id: 'm3-l1',
                title: 'Querying JSONB',
                content: `
                    <div class="lesson-prose">
                        <h2>JSONB in PostgreSQL</h2>
                        <p>PostgreSQL has excellent support for JSON. The <code>jsonb</code> data type stores JSON data in a decomposed binary format, making it fast to process.</p>
                        <p>You can extract elements from a JSONB column using operators like <code>-></code> (returns JSON) and <code>->></code> (returns text).</p>
                        <h3>Example</h3>
                        <pre><code>SELECT data->>'city' AS city FROM user_profiles;</code></pre>
                        <p>Try extracting the 'role' from our user_profiles table!</p>
                    </div>
                `,
                defaultCode: "SELECT username, metadata->>'role' as role\nFROM user_metadata;",
                expectedKeyword: '->>',
                expectedTable: 'metadata'
            }
        ],
        quiz: [
            {
                id: 'q4',
                question: 'Which operator is used to extract a JSON object field as text in PostgreSQL?',
                options: ['->', '=>', '->>', '>>'],
                correct: 2
            }
        ]
    }
];

// Mock Database for Simulator
const mockDb = {
    users: [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
        { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
    ],
    orders: [
        { id: 101, user_id: 1, product: 'Laptop', amount: 999.99 },
        { id: 102, user_id: 2, product: 'Mouse', amount: 24.50 },
        { id: 103, user_id: 1, product: 'Keyboard', amount: 75.00 }
    ],
    user_metadata: [
        { username: 'johndoe', metadata: '{"role": "admin", "theme": "dark"}' },
        { username: 'janesmith', metadata: '{"role": "user", "theme": "light"}' }
    ]
};

// DOM Elements
const elements = {
    sidebarContent: document.getElementById('sidebar-content'),
    lessonContent: document.getElementById('lesson-content'),
    quizContent: document.getElementById('quiz-content'),
    sqlEditor: document.getElementById('sql-editor'),
    resultsPane: document.getElementById('results-pane'),
    runQueryBtn: document.getElementById('run-query-btn'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    progressBar: document.getElementById('progress-bar'),
    progressText: document.getElementById('progress-text'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebar-overlay')
};

// Initialization
function init() {
    renderSidebar();
    loadLesson(activeModule, activeLesson);
    updateProgress();
    setupEventListeners();
}

// Setup Event Listeners
function setupEventListeners() {
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.closest('button').dataset.tab);
        });
    });

    elements.runQueryBtn.addEventListener('click', runQuery);

    // Mobile sidebar toggle
    elements.mobileMenuBtn.addEventListener('click', toggleSidebar);
    elements.sidebarOverlay.addEventListener('click', toggleSidebar);
}

function toggleSidebar() {
    const isClosed = elements.sidebar.classList.contains('-translate-x-full');
    if (isClosed) {
        elements.sidebar.classList.remove('-translate-x-full');
        elements.sidebarOverlay.classList.remove('hidden');
    } else {
        elements.sidebar.classList.add('-translate-x-full');
        elements.sidebarOverlay.classList.add('hidden');
    }
}

// Tab Switching
function switchTab(tabId) {
    activeTab = tabId;
    
    // Update buttons
    elements.tabBtns.forEach(btn => {
        if (btn.dataset.tab === tabId) {
            btn.classList.add('active', 'border-blue-600', 'text-blue-600');
            btn.classList.remove('text-gray-500', 'border-transparent');
        } else {
            btn.classList.remove('active', 'border-blue-600', 'text-blue-600');
            btn.classList.add('text-gray-500', 'border-transparent');
        }
    });

    // Update panes
    elements.tabPanes.forEach(pane => {
        if (pane.id === \`\${tabId}-tab\`) {
            pane.classList.remove('hidden');
            pane.classList.add('block');
        } else {
            pane.classList.add('hidden');
            pane.classList.remove('block');
        }
    });
}

// Render Sidebar
function renderSidebar() {
    let html = '';
    curriculum.forEach((mod, mIndex) => {
        html += \`
            <div class="sidebar-module">
                <h3 class="sidebar-module-title">\${mod.title}</h3>
                <ul class="space-y-1">
        \`;
        
        mod.lessons.forEach((lesson, lIndex) => {
            const isCompleted = userProgress.completedLessons.includes(lesson.id);
            const isActive = mIndex === activeModule && lIndex === activeLesson;
            
            html += \`
                <li>
                    <button class="w-full text-left sidebar-lesson \${isActive ? 'active' : ''}" 
                            onclick="loadLesson(\${mIndex}, \${lIndex})">
                        <i class="\${isCompleted ? 'fas fa-check-circle text-green-500' : 'far fa-circle text-gray-400'} mr-2 w-4"></i>
                        \${lesson.title}
                    </button>
                </li>
            \`;
        });
        
        html += \`</ul></div>\`;
    });
    
    elements.sidebarContent.innerHTML = html;
}

// Load Lesson
function loadLesson(mIndex, lIndex) {
    activeModule = mIndex;
    activeLesson = lIndex;
    
    const lesson = curriculum[mIndex].lessons[lIndex];
    
    // Mark previous lesson as complete if we are moving forward (simple logic)
    if (!userProgress.completedLessons.includes(lesson.id)) {
         // Mark complete on load for simplicity in this demo, usually on specific action
         markLessonComplete(lesson.id);
    }
    
    // Render content
    elements.lessonContent.innerHTML = lesson.content;
    
    // Set default code in simulator
    elements.sqlEditor.value = lesson.defaultCode;
    
    // Reset results pane
    elements.resultsPane.innerHTML = \`<div class="absolute inset-0 flex items-center justify-center text-gray-400">Run a query to see results</div>\`;
    
    // Render quiz for this module
    renderQuiz(mIndex);
    
    // Re-render sidebar to update active states
    renderSidebar();
    
    // Switch to lesson tab by default on new lesson
    if(window.innerWidth < 768) {
        toggleSidebar(); // hide sidebar on mobile after selection
    }
}

// Render Quiz
function renderQuiz(mIndex) {
    const quiz = curriculum[mIndex].quiz;
    let html = \`<h2 class="text-2xl font-bold mb-6 text-gray-800">Module Knowledge Check</h2>\`;
    
    if(!quiz || quiz.length === 0) {
        elements.quizContent.innerHTML = html + '<p>No quiz for this module.</p>';
        return;
    }

    quiz.forEach((q, i) => {
        html += \`
            <div class="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-100 quiz-question" id="q-container-\${q.id}">
                <p class="font-semibold text-lg text-gray-800 mb-4">\${i+1}. \${q.question}</p>
                <div class="space-y-2">
        \`;
        
        q.options.forEach((opt, oIndex) => {
            html += \`
                <label class="flex items-center p-3 bg-white border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="radio" name="quiz-\${q.id}" value="\${oIndex}" class="mr-3 w-4 h-4 text-blue-600">
                    <span class="text-gray-700">\${opt}</span>
                </label>
            \`;
        });
        
        html += \`
                </div>
                <button onclick="checkAnswer('\${q.id}', \${mIndex}, \${i})" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                    Submit Answer
                </button>
                <div id="q-feedback-\${q.id}" class="mt-3 hidden text-sm font-medium"></div>
            </div>
        \`;
    });
    
    elements.quizContent.innerHTML = html;
}

// Check Quiz Answer
window.checkAnswer = function(qId, mIndex, qIndex) {
    const selected = document.querySelector(\`input[name="quiz-\${qId}"]:checked\`);
    const feedback = document.getElementById(\`q-feedback-\${qId}\`);
    const container = document.getElementById(\`q-container-\${qId}\`);
    
    if (!selected) {
        feedback.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i> Please select an answer.';
        feedback.className = 'mt-3 text-sm font-medium text-amber-600 block';
        return;
    }
    
    const correctAns = curriculum[mIndex].quiz[qIndex].correct;
    
    if (parseInt(selected.value) === correctAns) {
        feedback.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Correct! Great job.';
        feedback.className = 'mt-3 text-sm font-medium text-green-600 block';
        container.classList.replace('bg-blue-50', 'bg-green-50');
        container.classList.replace('border-blue-100', 'border-green-200');
        
        // Save progress
        if (!userProgress.completedQuizzes.includes(qId)) {
            userProgress.completedQuizzes.push(qId);
            saveProgress();
        }
    } else {
        feedback.innerHTML = '<i class="fas fa-times-circle mr-1"></i> Incorrect. Try again.';
        feedback.className = 'mt-3 text-sm font-medium text-red-600 block';
    }
};

// SQL Simulator Engine
function runQuery() {
    const query = elements.sqlEditor.value.trim().toUpperCase();
    const queryLower = elements.sqlEditor.value.trim().toLowerCase();
    
    if (!query) {
        showConsoleError('ERROR: Query cannot be empty.');
        return;
    }
    
    const startTime = performance.now();
    let resultHTML = '';
    
    try {
        // Simple regex-based pseudo-SQL engine
        if (query.startsWith('SELECT')) {
            if (query.includes('JOIN')) {
                // Mock JOIN result
                resultHTML = generateHtmlTable([
                    { name: 'John Doe', product: 'Laptop', amount: 999.99 },
                    { name: 'John Doe', product: 'Keyboard', amount: 75.00 },
                    { name: 'Jane Smith', product: 'Mouse', amount: 24.50 }
                ]);
            } else if (query.includes('->>')) {
                // Mock JSONB result
                resultHTML = generateHtmlTable([
                    { username: 'johndoe', role: 'admin' },
                    { username: 'janesmith', role: 'user' }
                ]);
            } else if (queryLower.includes('from users')) {
                // SELECT from users
                if (query.includes('*')) {
                    resultHTML = generateHtmlTable(mockDb.users);
                } else {
                    // Just return names and emails as mock specific columns
                    const mapped = mockDb.users.map(u => ({ name: u.name, email: u.email }));
                    resultHTML = generateHtmlTable(mapped);
                }
            } else {
                // Generic SELECT
                resultHTML = generateHtmlTable([{ message: 'Query executed successfully', rows: 0 }]);
            }
        } else if (query.startsWith('INSERT')) {
            resultHTML = \`<pre class="terminal-console info">INSERT 0 1\nQuery returned successfully in \${Math.round(performance.now() - startTime)}ms.</pre>\`;
        } else if (query.startsWith('UPDATE')) {
            resultHTML = \`<pre class="terminal-console info">UPDATE 1\nQuery returned successfully in \${Math.round(performance.now() - startTime)}ms.</pre>\`;
        } else if (query.startsWith('DELETE')) {
            resultHTML = \`<pre class="terminal-console info">DELETE 1\nQuery returned successfully in \${Math.round(performance.now() - startTime)}ms.</pre>\`;
        } else {
            throw new Error('Syntax error at or near "' + query.split(' ')[0] + '"');
        }
        
        elements.resultsPane.innerHTML = resultHTML;
        
    } catch (err) {
        showConsoleError('ERROR: ' + err.message);
    }
}

function showConsoleError(msg) {
    elements.resultsPane.innerHTML = \`<pre class="terminal-console error">\${msg}</pre>\`;
}

function generateHtmlTable(dataArray) {
    if (!dataArray || dataArray.length === 0) return '<div class="p-4 text-gray-500">No rows returned.</div>';
    
    const headers = Object.keys(dataArray[0]);
    let html = \`<table class="sql-data-grid"><thead><tr>\`;
    
    headers.forEach(h => {
        html += \`<th>\${h}</th>\`;
    });
    
    html += \`</tr></thead><tbody>\`;
    
    dataArray.forEach(row => {
        html += \`<tr>\`;
        headers.forEach(h => {
            html += \`<td>\${row[h]}</td>\`;
        });
        html += \`</tr>\`;
    });
    
    html += \`</tbody></table>\`;
    return html;
}

// Progress Tracking
function markLessonComplete(lessonId) {
    if (!userProgress.completedLessons.includes(lessonId)) {
        userProgress.completedLessons.push(lessonId);
        saveProgress();
    }
}

function saveProgress() {
    localStorage.setItem('postgresHubProgress', JSON.stringify(userProgress));
    updateProgress();
}

function updateProgress() {
    let totalItems = 0;
    curriculum.forEach(m => {
        totalItems += m.lessons.length;
        if(m.quiz) totalItems += m.quiz.length;
    });
    
    const completedItems = userProgress.completedLessons.length + userProgress.completedQuizzes.length;
    const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    
    elements.progressBar.style.width = \`\${percentage}%\`;
    elements.progressText.textContent = \`\${percentage}%\`;
}

// Run app
document.addEventListener('DOMContentLoaded', init);
