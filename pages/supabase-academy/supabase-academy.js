// State Variables
let activeModule = 0;
let activeLesson = 0;
let activeTab = 'lesson';
let userProgress = JSON.parse(localStorage.getItem('supabaseHubProgress')) || { completedLessons: [], completedQuizzes: [] };

// Mock Database State for Simulator
const mockDatabase = {
    todos: [
        { id: 1, task: 'Learn Supabase', is_complete: true, inserted_at: new Date().toISOString() },
        { id: 2, task: 'Build an awesome app', is_complete: false, inserted_at: new Date().toISOString() }
    ],
    users: [
        { id: 'uuid-1', email: 'test@example.com', created_at: new Date().toISOString() }
    ]
};

let currentTable = 'todos';
let mockAuthState = { user: null };
let lastInsertedRowId = null;

// Curriculum Data
const curriculum = [
    {
        id: 'mod-1',
        title: 'Supabase Auth Basics',
        lessons: [
            {
                id: 'm1-l1',
                title: 'Sign Up',
                content: `
                    <div class="lesson-prose">
                        <h2>Supabase Authentication</h2>
                        <p>Supabase provides a complete authentication system out of the box, integrated perfectly with PostgreSQL's Row Level Security.</p>
                        <h3>Signing Up a User</h3>
                        <p>You can create a new user using the <code>supabase.auth.signUp()</code> method.</p>
                        <pre><code>const { data, error } = await supabase.auth.signUp({
  email: 'example@email.com',
  password: 'example-password',
})</code></pre>
                        <p>Go to the <strong>Simulator</strong>, run the code to sign up, and watch the Auth status update in the top right of the Studio!</p>
                    </div>
                `,
                defaultCode: `// Sign up a new user
const { data, error } = await supabase.auth.signUp({
  email: 'newuser@example.com',
  password: 'securepassword123'
});

if (error) {
  console.error(error);
} else {
  console.log("Signed up successfully:", data.user.email);
}`
            }
        ],
        quiz: [
            {
                id: 'q1',
                question: 'Which method is used to register a new user in Supabase?',
                options: ['supabase.register()', 'supabase.auth.signUp()', 'supabase.createUser()', 'supabase.users.insert()'],
                correct: 1
            }
        ]
    },
    {
        id: 'mod-2',
        title: 'PostgreSQL CRUD via JS Client',
        lessons: [
            {
                id: 'm2-l1',
                title: 'Inserting Data',
                content: `
                    <div class="lesson-prose">
                        <h2>Writing to the Database</h2>
                        <p>With Supabase, you can interact with your PostgreSQL database directly from the frontend using the JS Client.</p>
                        <h3>insert()</h3>
                        <p>To add a row to a table, specify the table with <code>from()</code> and use <code>insert()</code>.</p>
                        <pre><code>const { data, error } = await supabase
  .from('todos')
  .insert([
    { task: 'Buy groceries', is_complete: false }
  ])</code></pre>
                        <p>Try running the simulator code to insert a new todo, and watch it appear instantly in the Table Editor!</p>
                    </div>
                `,
                defaultCode: `// Insert a new row into the 'todos' table
const { data, error } = await supabase
  .from('todos')
  .insert([
    { task: 'Master Supabase CRUD', is_complete: false }
  ]);

console.log("Insert complete!");`
            },
            {
                id: 'm2-l2',
                title: 'Updating Data',
                content: `
                    <div class="lesson-prose">
                        <h2>Modifying Existing Data</h2>
                        <p>To update rows, use the <code>update()</code> method combined with a filter like <code>eq()</code> (equals).</p>
                        <pre><code>const { data, error } = await supabase
  .from('todos')
  .update({ is_complete: true })
  .eq('id', 1)</code></pre>
                        <p>Try updating the status of a todo in the simulator.</p>
                    </div>
                `,
                defaultCode: `// Update the first todo to be complete
const { data, error } = await supabase
  .from('todos')
  .update({ is_complete: true })
  .eq('id', 2);

console.log("Update complete!");`
            }
        ],
        quiz: [
            {
                id: 'q2',
                question: 'How do you specify which table to query in the Supabase JS client?',
                options: ['supabase.table("name")', 'supabase.query("name")', 'supabase.from("name")', 'supabase.select("name")'],
                correct: 2
            }
        ]
    },
    {
        id: 'mod-3',
        title: 'Row Level Security & Realtime',
        lessons: [
            {
                id: 'm3-l1',
                title: 'The Power of RLS',
                content: `
                    <div class="lesson-prose">
                        <h2>Row Level Security (RLS)</h2>
                        <p>Because Supabase lets you query the database from the client (browser), securing data is critical. Supabase uses PostgreSQL's native Row Level Security.</p>
                        <p>RLS policies act like a bouncer for your database rows. You can write SQL policies that dictate who can SELECT, INSERT, UPDATE, or DELETE specific rows based on their authentication status (e.g., <code>auth.uid() = user_id</code>).</p>
                        <p>Without RLS policies, all client access is denied by default!</p>
                    </div>
                `,
                defaultCode: `// Conceptual lesson
console.log("Always enable RLS on your tables!");
console.log("Create policies to link auth.uid() to row data.");`
            }
        ],
        quiz: [
            {
                id: 'q3',
                question: 'What happens if you try to query a table from the client that has RLS enabled, but no policies created?',
                options: ['You get all the data', 'You only get data you created', 'Access is denied (returns empty/error)', 'The database crashes'],
                correct: 2
            }
        ]
    }
];

// DOM Elements
const elements = {
    sidebarContent: document.getElementById('sidebar-content'),
    lessonContent: document.getElementById('lesson-content'),
    quizContent: document.getElementById('quiz-content'),
    supabaseEditor: document.getElementById('supabase-editor'),
    runCodeBtn: document.getElementById('run-code-btn'),
    editorConsole: document.getElementById('editor-console'),
    tableSelector: document.getElementById('table-selector'),
    authStatus: document.getElementById('auth-status'),
    gridHeader: document.getElementById('grid-header'),
    gridBody: document.getElementById('grid-body'),
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
    renderStudioUI();
    setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.closest('button').dataset.tab);
        });
    });

    elements.runCodeBtn.addEventListener('click', runSimulation);

    elements.tableSelector.addEventListener('change', (e) => {
        currentTable = e.target.value;
        renderStudioGrid();
    });

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

// Tab Management
function switchTab(tabId) {
    activeTab = tabId;
    
    elements.tabBtns.forEach(btn => {
        if (btn.dataset.tab === tabId) {
            btn.classList.add('active', 'border-emerald-500', 'text-emerald-600');
            btn.classList.remove('text-gray-500', 'border-transparent');
        } else {
            btn.classList.remove('active', 'border-emerald-500', 'text-emerald-600');
            btn.classList.add('text-gray-500', 'border-transparent');
        }
    });

    elements.tabPanes.forEach(pane => {
        if (pane.id === \`\${tabId}-tab\`) {
            pane.classList.remove('hidden');
            pane.classList.add('block');
            
            if (tabId === 'simulator') {
                pane.classList.remove('block');
                pane.classList.add('flex', 'flex-col');
            }
        } else {
            pane.classList.add('hidden');
            pane.classList.remove('block', 'flex', 'flex-col');
        }
    });
}

// Sidebar Rendering
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
                        <i class="\${isCompleted ? 'fas fa-check-circle text-emerald-500' : 'far fa-circle text-gray-400'} mr-2 w-4"></i>
                        \${lesson.title}
                    </button>
                </li>
            \`;
        });
        
        html += \`</ul></div>\`;
    });
    
    elements.sidebarContent.innerHTML = html;
}

// Load specific lesson
function loadLesson(mIndex, lIndex) {
    activeModule = mIndex;
    activeLesson = lIndex;
    const lesson = curriculum[mIndex].lessons[lIndex];
    
    if (!userProgress.completedLessons.includes(lesson.id)) {
         markLessonComplete(lesson.id);
    }
    
    elements.lessonContent.innerHTML = lesson.content;
    elements.supabaseEditor.value = lesson.defaultCode || '';
    
    elements.editorConsole.innerHTML = '';
    elements.editorConsole.classList.add('hidden');
    
    renderQuiz(mIndex);
    renderSidebar();
    
    if(window.innerWidth < 768 && !elements.sidebar.classList.contains('-translate-x-full')) {
        toggleSidebar();
    }
}

// Quiz Rendering
function renderQuiz(mIndex) {
    const quiz = curriculum[mIndex].quiz;
    let html = \`<h2 class="text-2xl font-bold mb-6 text-gray-800">Module Knowledge Check</h2>\`;
    
    if(!quiz || quiz.length === 0) {
        elements.quizContent.innerHTML = html + '<p>No quiz for this module.</p>';
        return;
    }

    quiz.forEach((q, i) => {
        html += \`
            <div class="mb-8 p-6 bg-emerald-50 rounded-lg border border-emerald-100 quiz-question" id="q-container-\${q.id}">
                <p class="font-semibold text-lg text-gray-800 mb-4">\${i+1}. \${q.question}</p>
                <div class="space-y-2">
        \`;
        
        q.options.forEach((opt, oIndex) => {
            html += \`
                <label class="flex items-center p-3 bg-white border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="radio" name="quiz-\${q.id}" value="\${oIndex}" class="mr-3 w-4 h-4 text-emerald-600">
                    <span class="text-gray-700">\${opt}</span>
                </label>
            \`;
        });
        
        html += \`
                </div>
                <button onclick="checkAnswer('\${q.id}', \${mIndex}, \${i})" class="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
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
        feedback.className = 'mt-3 text-sm font-medium text-emerald-600 block';
        container.classList.replace('bg-emerald-50', 'bg-green-50');
        container.classList.replace('border-emerald-100', 'border-green-200');
        
        if (!userProgress.completedQuizzes.includes(qId)) {
            userProgress.completedQuizzes.push(qId);
            saveProgress();
        }
    } else {
        feedback.innerHTML = '<i class="fas fa-times-circle mr-1"></i> Incorrect. Try again.';
        feedback.className = 'mt-3 text-sm font-medium text-red-600 block';
    }
};

// Progress Tracking
function markLessonComplete(lessonId) {
    if (!userProgress.completedLessons.includes(lessonId)) {
        userProgress.completedLessons.push(lessonId);
        saveProgress();
    }
}

function saveProgress() {
    localStorage.setItem('supabaseHubProgress', JSON.stringify(userProgress));
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

// ----------------------------------------------------
// Supabase Studio Simulator Engine
// ----------------------------------------------------

async function runSimulation() {
    const code = elements.supabaseEditor.value;
    elements.editorConsole.innerHTML = '';
    elements.editorConsole.classList.add('hidden');
    lastInsertedRowId = null; // reset flash tracker
    
    const logToConsole = (msg, type = 'log') => {
        elements.editorConsole.classList.remove('hidden');
        const colorClass = type === 'error' ? 'text-red-400' : 'text-emerald-400';
        elements.editorConsole.innerHTML += \`<div class="\${colorClass} mb-1">> \${msg}</div>\`;
        elements.editorConsole.scrollTop = elements.editorConsole.scrollHeight;
    };

    const mockConsole = {
        log: (...args) => logToConsole(args.join(' ')),
        error: (...args) => logToConsole(args.join(' '), 'error')
    };

    // The Mock Supabase Client
    const supabase = {
        auth: {
            signUp: async ({ email, password }) => {
                if (email && password) {
                    const newUser = { id: \`uuid-\${Math.floor(Math.random()*1000)}\`, email, created_at: new Date().toISOString() };
                    mockDatabase.users.push(newUser);
                    mockAuthState.user = newUser;
                    
                    // Switch to users table to show it
                    elements.tableSelector.value = 'users';
                    currentTable = 'users';
                    lastInsertedRowId = newUser.id;
                    
                    renderStudioUI();
                    return { data: { user: newUser }, error: null };
                }
                return { data: null, error: { message: "Invalid email or password" } };
            }
        },
        from: (tableName) => {
            return {
                select: async (query = '*') => {
                    return { data: mockDatabase[tableName] || [], error: null };
                },
                insert: async (dataArr) => {
                    if (!mockDatabase[tableName]) mockDatabase[tableName] = [];
                    // Handle single object or array
                    const items = Array.isArray(dataArr) ? dataArr : [dataArr];
                    
                    let newId = mockDatabase[tableName].length > 0 ? Math.max(...mockDatabase[tableName].map(r => typeof r.id === 'number' ? r.id : 0)) + 1 : 1;
                    
                    const newRows = items.map(item => {
                        const row = { id: newId++, ...item, inserted_at: new Date().toISOString() };
                        mockDatabase[tableName].push(row);
                        lastInsertedRowId = row.id;
                        return row;
                    });
                    
                    elements.tableSelector.value = tableName;
                    currentTable = tableName;
                    renderStudioUI();
                    
                    return { data: newRows, error: null };
                },
                update: (dataObj) => {
                    // Update builder pattern simulation
                    return {
                        eq: async (column, value) => {
                            if (mockDatabase[tableName]) {
                                mockDatabase[tableName].forEach(row => {
                                    if (row[column] === value) {
                                        Object.assign(row, dataObj);
                                        lastInsertedRowId = row.id; // Flash the updated row
                                    }
                                });
                                elements.tableSelector.value = tableName;
                                currentTable = tableName;
                                renderStudioUI();
                                return { data: mockDatabase[tableName].filter(r => r[column] === value), error: null };
                            }
                            return { data: null, error: { message: "Table not found" } };
                        }
                    };
                }
            };
        }
    };

    try {
        // We use an async wrapper so they can use 'await supabase...'
        let executableCode = code.replace(/import .*;?\n/g, ''); 
        
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const executionScope = new AsyncFunction('supabase', 'console', executableCode);
        
        await executionScope(supabase, mockConsole);
        
    } catch (err) {
        logToConsole(\`Execution Error: \${err.message}\`, 'error');
    }
}

// Visual feedback helper for rows
function flashRow(rowIdStr) {
    const rowEl = document.getElementById(\`row-\${rowIdStr}\`);
    if(rowEl) {
        rowEl.classList.remove('flash-row');
        void rowEl.offsetWidth; // trigger reflow
        rowEl.classList.add('flash-row');
    }
}

// ----------------------------------------------------
// UI Rendering for Supabase Studio Simulator
// ----------------------------------------------------

function renderStudioUI() {
    renderAuthStatus();
    renderStudioGrid();
}

function renderAuthStatus() {
    const dot = elements.authStatus.querySelector('.status-dot');
    const text = elements.authStatus.querySelector('.status-text');
    
    if (mockAuthState.user) {
        dot.classList.replace('bg-gray-500', 'bg-emerald-500');
        text.textContent = mockAuthState.user.email;
    } else {
        dot.classList.replace('bg-emerald-500', 'bg-gray-500');
        text.textContent = 'Anonymous';
    }
}

function renderStudioGrid() {
    const data = mockDatabase[currentTable] || [];
    
    // Get headers based on first object or default
    let headers = [];
    if (data.length > 0) {
        headers = Object.keys(data[0]);
    } else if (currentTable === 'todos') {
        headers = ['id', 'task', 'is_complete', 'inserted_at'];
    } else if (currentTable === 'users') {
        headers = ['id', 'email', 'created_at'];
    }

    // Render Headers
    let headerHtml = '';
    headers.forEach(h => {
        let icon = 'fa-font';
        if(h === 'id') icon = 'fa-key';
        else if(h.includes('is_')) icon = 'fa-check-square';
        else if(h.includes('at')) icon = 'fa-clock';
        
        headerHtml += \`
            <div class="grid-header-cell" style="width: 150px; min-width: 150px;">
                <i class="fas \${icon} type-icon"></i>
                <span>\${h}</span>
            </div>
        \`;
    });
    // Add empty space filler
    headerHtml += \`<div class="flex-1 min-w-[50px] border-b border-gray-700"></div>\`;
    elements.gridHeader.innerHTML = headerHtml;

    // Render Body
    let bodyHtml = '';
    data.forEach(row => {
        bodyHtml += \`<div class="grid-row" id="row-\${row.id}">\`;
        headers.forEach(h => {
            let val = row[h];
            let cellClass = 'cell-string';
            let displayVal = val;
            
            if (val === null || val === undefined) {
                cellClass = 'cell-null';
                displayVal = 'NULL';
            } else if (typeof val === 'number') {
                cellClass = 'cell-number';
            } else if (typeof val === 'boolean') {
                cellClass = 'cell-boolean';
                displayVal = val ? 'TRUE' : 'FALSE';
            }
            
            bodyHtml += \`
                <div class="grid-cell \${cellClass}" style="width: 150px; min-width: 150px;" title="\${displayVal}">
                    \${displayVal}
                </div>
            \`;
        });
        bodyHtml += \`<div class="flex-1 min-w-[50px] border-b border-[#333333]"></div>\`;
        bodyHtml += \`</div>\`;
    });
    
    if (data.length === 0) {
        bodyHtml = \`<div class="p-4 text-gray-500 italic text-sm text-center w-full">No rows found in '\${currentTable}'</div>\`;
    }
    
    elements.gridBody.innerHTML = bodyHtml;
    
    // Apply flash animation to new/updated row if exists
    if (lastInsertedRowId !== null) {
        setTimeout(() => flashRow(lastInsertedRowId), 50);
    }
}

// Run init on load
document.addEventListener('DOMContentLoaded', init);
