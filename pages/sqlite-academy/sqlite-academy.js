/* global initSqlJs, checkAnswer */

// State Variables
let activeModule = 0;
let activeLesson = 0;
let userProgress = JSON.parse(localStorage.getItem('sqliteHubProgress')) || {
  completedLessons: [],
  completedQuizzes: [],
};

// SQLite Database Instance
let db = null;

// Curriculum Data
const curriculum = [
  {
    id: 'mod-1',
    title: 'SQLite Basics (CREATE & INSERT)',
    lessons: [
      {
        id: 'm1-l1',
        title: 'Creating Tables',
        content: `
                    <div class="lesson-prose">
                        <h2>Relational Databases</h2>
                        <p>SQLite is a C-language library that implements a small, fast, self-contained, high-reliability, full-featured, SQL database engine.</p>
                        <h3>CREATE TABLE</h3>
                        <p>To store data, you first need a table. You define the table name and the columns it will contain, along with their data types.</p>
                        <pre><code>CREATE TABLE students (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  grade INTEGER
);</code></pre>
                        <p>Go to the <strong>SQLite Playground</strong> tab to run your first query. The database is already seeded with <code>employees</code> and <code>departments</code> tables. Try selecting from them!</p>
                    </div>
                `,
        defaultCode: `-- Select all employees
SELECT * FROM employees;`,
      },
      {
        id: 'm1-l2',
        title: 'Inserting Data',
        content: `
                    <div class="lesson-prose">
                        <h2>Adding Rows</h2>
                        <p>Use the <code>INSERT INTO</code> statement to add new rows of data to a table.</p>
                        <pre><code>INSERT INTO employees (name, role, dept_id) 
VALUES ('Sarah', 'Designer', 2);</code></pre>
                        <p>Try adding a new employee in the playground, and then run a <code>SELECT * FROM employees;</code> to verify!</p>
                    </div>
                `,
        defaultCode: `INSERT INTO employees (name, role, dept_id) 
VALUES ('New Hire', 'Intern', 1);

-- Verify the insertion
SELECT * FROM employees;`,
      },
    ],
    quiz: [
      {
        id: 'q1',
        question: 'Which SQL keyword is used to add new rows to a table?',
        options: ['ADD', 'UPDATE', 'INSERT', 'CREATE'],
        correct: 2,
      },
    ],
  },
  {
    id: 'mod-2',
    title: 'Querying & JOINs',
    lessons: [
      {
        id: 'm2-l1',
        title: 'Basic SELECT & WHERE',
        content: `
                    <div class="lesson-prose">
                        <h2>Filtering Data</h2>
                        <p>The <code>SELECT</code> statement retrieves data, and the <code>WHERE</code> clause filters it based on specific conditions.</p>
                        <pre><code>SELECT name, role 
FROM employees 
WHERE role = 'Developer';</code></pre>
                        <p>Try running this in the playground.</p>
                    </div>
                `,
        defaultCode: `SELECT name, role 
FROM employees 
WHERE role = 'Developer';`,
      },
      {
        id: 'm2-l2',
        title: 'INNER JOIN',
        content: `
                    <div class="lesson-prose">
                        <h2>Combining Tables</h2>
                        <p>A <code>JOIN</code> clause is used to combine rows from two or more tables, based on a related column between them.</p>
                        <pre><code>SELECT e.name, e.role, d.dept_name
FROM employees e
INNER JOIN departments d ON e.dept_id = d.id;</code></pre>
                        <p>This links the employee's department ID to the actual department name. Try it out!</p>
                    </div>
                `,
        defaultCode: `SELECT e.name, e.role, d.dept_name
FROM employees e
JOIN departments d ON e.dept_id = d.id;`,
      },
    ],
    quiz: [
      {
        id: 'q2',
        question: 'What does an INNER JOIN do?',
        options: [
          'Returns all rows from both tables',
          'Returns only rows that have matching values in both tables',
          'Returns all rows from the left table',
          'Deletes matching rows',
        ],
        correct: 1,
      },
    ],
  },
  {
    id: 'mod-3',
    title: 'Constraints & Indexes',
    lessons: [
      {
        id: 'm3-l1',
        title: 'Data Integrity',
        content: `
                    <div class="lesson-prose">
                        <h2>Constraints</h2>
                        <p>Constraints are rules applied to data columns to enforce data integrity.</p>
                        <ul>
                            <li><code>NOT NULL</code>: Ensures a column cannot have a NULL value.</li>
                            <li><code>UNIQUE</code>: Ensures all values in a column are different.</li>
                            <li><code>PRIMARY KEY</code>: Uniquely identifies each row (implies NOT NULL and UNIQUE).</li>
                        </ul>
                    </div>
                `,
        defaultCode: `-- Try creating a table with constraints
CREATE TABLE projects (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL UNIQUE,
  budget REAL
);

-- Then query sqlite_master to see it
SELECT name, sql FROM sqlite_master WHERE type='table';`,
      },
    ],
    quiz: [
      {
        id: 'q3',
        question: 'Which constraint uniquely identifies each record in a database table?',
        options: ['NOT NULL', 'UNIQUE', 'FOREIGN KEY', 'PRIMARY KEY'],
        correct: 3,
      },
    ],
  },
];

// DOM Elements
const elements = {
  sidebarContent: document.getElementById('sidebar-content'),
  lessonContent: document.getElementById('lesson-content'),
  quizContent: document.getElementById('quiz-content'),
  sqlEditor: document.getElementById('sql-editor'),
  runQueryBtn: document.getElementById('run-query-btn'),
  resultsPane: document.getElementById('results-pane'),
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  progressBar: document.getElementById('progress-bar'),
  progressText: document.getElementById('progress-text'),
  mobileMenuBtn: document.getElementById('mobile-menu-btn'),
  sidebar: document.getElementById('sidebar'),
  sidebarOverlay: document.getElementById('sidebar-overlay'),
};

// Initialization
async function init() {
  renderSidebar();
  loadLesson(activeModule, activeLesson);
  updateProgress();
  setupEventListeners();
  await initDatabase();
}

// SQLite Initialization
async function initDatabase() {
  try {
    const SQL = await initSqlJs({
      // Required to load the wasm binary asynchronously. Of course, you can host it wherever you want
      locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`,
    });

    // Create a database
    db = new SQL.Database();

    // Seed database
    const initScript = `
            CREATE TABLE departments (
                id INTEGER PRIMARY KEY,
                dept_name TEXT NOT NULL
            );
            
            INSERT INTO departments (id, dept_name) VALUES 
                (1, 'Engineering'),
                (2, 'Marketing'),
                (3, 'HR');
                
            CREATE TABLE employees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                role TEXT NOT NULL,
                dept_id INTEGER,
                FOREIGN KEY (dept_id) REFERENCES departments(id)
            );
            
            INSERT INTO employees (name, role, dept_id) VALUES 
                ('Alice', 'Developer', 1),
                ('Bob', 'Manager', 1),
                ('Charlie', 'Designer', 2),
                ('Diana', 'Recruiter', 3);
        `;

    db.run(initScript);

    // Enable button
    elements.runQueryBtn.disabled = false;
    elements.runQueryBtn.innerHTML = '<i class="fas fa-play mr-2"></i>Run Query';
  } catch (err) {
    console.error('Failed to initialize SQLite', err);
    elements.runQueryBtn.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i>Engine Error';
  }
}

// Setup Event Listeners
function setupEventListeners() {
  elements.tabBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      switchTab(e.target.closest('button').dataset.tab);
    });
  });

  elements.runQueryBtn.addEventListener('click', runQuery);

  elements.mobileMenuBtn.addEventListener('click', toggleSidebar);
  elements.sidebarOverlay.addEventListener('click', toggleSidebar);

  elements.sidebarContent.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-module]');
    if (btn) {
      loadLesson(parseInt(btn.dataset.module), parseInt(btn.dataset.lesson));
    }
  });

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-quiz-id]');
    if (btn) {
      checkAnswer(btn.dataset.quizId, parseInt(btn.dataset.module), parseInt(btn.dataset.option));
    }
  });
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
  elements.tabBtns.forEach((btn) => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add('active', 'border-blue-600', 'text-blue-600');
      btn.classList.remove('text-gray-500', 'border-transparent');
    } else {
      btn.classList.remove('active', 'border-blue-600', 'text-blue-600');
      btn.classList.add('text-gray-500', 'border-transparent');
    }
  });

  elements.tabPanes.forEach((pane) => {
    if (pane.id === `${tabId}-tab`) {
      pane.classList.remove('hidden');
      pane.classList.add('block');
    } else {
      pane.classList.add('hidden');
      pane.classList.remove('block');
    }
  });
}

// Sidebar Rendering
function renderSidebar() {
  let html = '';
  curriculum.forEach((mod, mIndex) => {
    html += `
            <div class="sidebar-module">
                <h3 class="sidebar-module-title">${mod.title}</h3>
                <ul class="space-y-1">
        `;

    mod.lessons.forEach((lesson, lIndex) => {
      const isCompleted = userProgress.completedLessons.includes(lesson.id);
      const isActive = mIndex === activeModule && lIndex === activeLesson;

      html += `
                <li>
                    <button class="w-full text-left sidebar-lesson ${isActive ? 'active' : ''}" 
                            data-module="${mIndex}" data-lesson="${lIndex}">
                        <i class="${isCompleted ? 'fas fa-check-circle text-blue-500' : 'far fa-circle text-gray-400'} mr-2 w-4"></i>
                        ${lesson.title}
                    </button>
                </li>
            `;
    });

    html += `</ul></div>`;
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
  elements.sqlEditor.value = lesson.defaultCode || '';

  renderQuiz(mIndex);
  renderSidebar();

  if (window.innerWidth < 768 && !elements.sidebar.classList.contains('-translate-x-full')) {
    toggleSidebar();
  }
}

// Quiz Rendering
function renderQuiz(mIndex) {
  const quiz = curriculum[mIndex].quiz;
  let html = `<h2 class="text-2xl font-bold mb-6 text-gray-800">Module Knowledge Check</h2>`;

  if (!quiz || quiz.length === 0) {
    elements.quizContent.innerHTML = html + '<p>No quiz for this module.</p>';
    return;
  }

  quiz.forEach((q, i) => {
    html += `
            <div class="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-100 quiz-question" id="q-container-${q.id}">
                <p class="font-semibold text-lg text-gray-800 mb-4">${i + 1}. ${q.question}</p>
                <div class="space-y-2">
        `;

    q.options.forEach((opt, oIndex) => {
      html += `
                <label class="flex items-center p-3 bg-white border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="radio" name="quiz-${q.id}" value="${oIndex}" class="mr-3 w-4 h-4 text-blue-600">
                    <span class="text-gray-700">${opt}</span>
                </label>
            `;
    });

    html += `
                </div>
                <button data-quiz-id="${q.id}" data-module="${mIndex}" data-option="${i}" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                    Submit Answer
                </button>
                <div id="q-feedback-${q.id}" class="mt-3 hidden text-sm font-medium"></div>
            </div>
        `;
  });

  elements.quizContent.innerHTML = html;
}

// Check Quiz Answer
window.checkAnswer = function (qId, mIndex, qIndex) {
  const selected = document.querySelector(`input[name="quiz-${qId}"]:checked`);
  const feedback = document.getElementById(`q-feedback-${qId}`);
  const container = document.getElementById(`q-container-${qId}`);

  if (!selected) {
    feedback.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i> Please select an answer.';
    feedback.className = 'mt-3 text-sm font-medium text-amber-600 block';
    return;
  }

  const correctAns = curriculum[mIndex].quiz[qIndex].correct;

  if (parseInt(selected.value) === correctAns) {
    feedback.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Correct! Great job.';
    feedback.className = 'mt-3 text-sm font-medium text-blue-600 block';
    container.classList.replace('bg-blue-50', 'bg-green-50');
    container.classList.replace('border-blue-100', 'border-green-200');

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
  localStorage.setItem('sqliteHubProgress', JSON.stringify(userProgress));
  updateProgress();
}

function updateProgress() {
  let totalItems = 0;
  curriculum.forEach((m) => {
    totalItems += m.lessons.length;
    if (m.quiz) totalItems += m.quiz.length;
  });

  const completedItems =
    userProgress.completedLessons.length + userProgress.completedQuizzes.length;
  const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  elements.progressBar.style.width = `${percentage}%`;
  elements.progressText.textContent = `${percentage}%`;
}

// ----------------------------------------------------
// Real SQLite Engine Execution
// ----------------------------------------------------

function runQuery() {
  if (!db) {
    elements.resultsPane.innerHTML =
      '<div class="error-msg">Database not initialized yet. Please wait.</div>';
    return;
  }

  const query = elements.sqlEditor.value.trim();
  if (!query) {
    elements.resultsPane.innerHTML =
      '<div class="absolute inset-0 flex items-center justify-center text-gray-400 italic">Please enter a SQL query.</div>';
    return;
  }

  try {
    // Execute the query using sql.js
    const results = db.exec(query);

    if (results.length === 0) {
      // For operations that don't return data (like INSERT, UPDATE, CREATE)
      elements.resultsPane.innerHTML =
        '<div class="p-4 text-green-600 font-medium"><i class="fas fa-check-circle mr-2"></i>Query executed successfully (no results to display).</div>';
      return;
    }

    // Build HTML Table for the first result set
    const data = results[0];
    let tableHtml = '<div class="data-grid-wrapper"><table class="data-grid"><thead><tr>';

    // Headers
    data.columns.forEach((col) => {
      tableHtml += `<th>${col}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';

    // Rows
    data.values.forEach((row) => {
      tableHtml += '<tr>';
      row.forEach((val) => {
        let displayVal = val === null ? '<span class="text-gray-400 italic">NULL</span>' : val;
        tableHtml += `<td>${displayVal}</td>`;
      });
      tableHtml += '</tr>';
    });

    tableHtml += '</tbody></table></div>';
    elements.resultsPane.innerHTML = tableHtml;
  } catch (err) {
    // Catch SQLite syntax errors and display them
    elements.resultsPane.innerHTML = `<div class="error-msg"><i class="fas fa-exclamation-triangle mr-2"></i>SQL Error: ${err.message}</div>`;
  }
}

// Run init on load
document.addEventListener('DOMContentLoaded', init);
