/* global checkAnswer */

// State Variables
let activeModule = 0;
let activeLesson = 0;
let userProgress = JSON.parse(localStorage.getItem('mongoHubProgress')) || {
  completedLessons: [],
  completedQuizzes: [],
};

// Mock MongoDB Database
const mockDB = {
  users: [
    { _id: '5f8a3d12b5a9c2a1d8f7e6a1', name: 'Alice Johnson', status: 'A', age: 28, role: 'admin' },
    { _id: '5f8a3d12b5a9c2a1d8f7e6a2', name: 'Bob Smith', status: 'A', age: 34, role: 'user' },
    { _id: '5f8a3d12b5a9c2a1d8f7e6a3', name: 'Charlie Brown', status: 'D', age: 41, role: 'user' },
    { _id: '5f8a3d12b5a9c2a1d8f7e6a4', name: 'Diana Prince', status: 'A', age: 29, role: 'admin' },
  ],
  products: [
    { _id: 'p1', name: 'Laptop', price: 1200, category: 'Electronics' },
    { _id: 'p2', name: 'Coffee Mug', price: 15, category: 'Kitchen' },
    { _id: 'p3', name: 'Desk Chair', price: 250, category: 'Furniture' },
  ],
};

// Curriculum Data
const curriculum = [
  {
    id: 'mod-1',
    title: 'NoSQL & Document Modeling',
    lessons: [
      {
        id: 'm1-l1',
        title: 'What is MongoDB?',
        content: `
                    <div class="lesson-prose">
                        <h2>Introduction to MongoDB</h2>
                        <p>MongoDB is a document database designed for ease of development and scaling. Unlike relational databases (like SQL), MongoDB stores data in flexible, JSON-like documents.</p>
                        <p>This means fields can vary from document to document and data structure can be changed over time.</p>
                        <h3>Basic Commands</h3>
                        <p>To view all documents in a collection (similar to a table in SQL), you use the <code>find()</code> method.</p>
                        <pre><code>db.collection_name.find()</code></pre>
                        <p>Head to the <strong>Mongo Shell Simulator</strong> tab to run <code>db.users.find()</code> and see our user documents!</p>
                    </div>
                `,
        defaultCode: 'db.users.find()',
      },
    ],
    quiz: [
      {
        id: 'q1',
        question: 'How does MongoDB store data?',
        options: [
          'In tables with rows and columns',
          'In JSON-like documents',
          'In a simple text file',
          'In a graph structure',
        ],
        correct: 1,
      },
    ],
  },
  {
    id: 'mod-2',
    title: 'CRUD Operations',
    lessons: [
      {
        id: 'm2-l1',
        title: 'Finding Documents',
        content: `
                    <div class="lesson-prose">
                        <h2>Reading Data (find)</h2>
                        <p>The <code>find()</code> method accepts a query filter document to specify which documents to return.</p>
                        <h3>Syntax</h3>
                        <pre><code>db.collection.find({ field: "value" })</code></pre>
                        <p>For example, to find all users with a status of "A":</p>
                        <pre><code>db.users.find({ status: "A" })</code></pre>
                        <p>Try it out in the simulator!</p>
                    </div>
                `,
        defaultCode: 'db.users.find({ status: "A" })',
      },
      {
        id: 'm2-l2',
        title: 'Inserting Documents',
        content: `
                    <div class="lesson-prose">
                        <h2>Creating Data (insert)</h2>
                        <p>To insert a new document into a collection, use <code>insertOne()</code> or <code>insertMany()</code>.</p>
                        <h3>Syntax</h3>
                        <pre><code>db.collection.insertOne({ key1: "value1", key2: "value2" })</code></pre>
                        <p>Try inserting a new product into the <code>products</code> collection in the simulator!</p>
                        <p>Example: <code>db.products.insertOne({ name: "Monitor", price: 300, category: "Electronics" })</code></p>
                    </div>
                `,
        defaultCode:
          'db.products.insertOne({\n  name: "Monitor",\n  price: 300,\n  category: "Electronics"\n})',
      },
    ],
    quiz: [
      {
        id: 'q2',
        question: 'Which command finds all users with age exactly 28?',
        options: [
          'db.users.find("age": 28)',
          'db.users.find({ age: 28 })',
          'db.users.select({ age: 28 })',
          'db.users.get(age=28)',
        ],
        correct: 1,
      },
    ],
  },
  {
    id: 'mod-3',
    title: 'The Aggregation Pipeline',
    lessons: [
      {
        id: 'm3-l1',
        title: 'Basic Aggregation',
        content: `
                    <div class="lesson-prose">
                        <h2>Aggregation</h2>
                        <p>Aggregation operations process data records and return computed results. The most common way to perform aggregation is using the aggregation pipeline.</p>
                        <p>You pass an array of stages to the <code>aggregate()</code> method.</p>
                        <h3>Syntax</h3>
                        <pre><code>db.collection.aggregate([ { stage1 }, { stage2 } ])</code></pre>
                        <p>Try running the basic match stage in the simulator: <code>db.users.aggregate([{ $match: { role: "admin" } }])</code></p>
                    </div>
                `,
        defaultCode: 'db.users.aggregate([\n  { $match: { role: "admin" } }\n])',
      },
    ],
    quiz: [
      {
        id: 'q3',
        question: 'Which method is used for running an aggregation pipeline?',
        options: [
          'db.collection.pipeline()',
          'db.collection.find()',
          'db.collection.aggregate()',
          'db.collection.group()',
        ],
        correct: 2,
      },
    ],
  },
];

// DOM Elements
const elements = {
  sidebarContent: document.getElementById('sidebar-content'),
  lessonContent: document.getElementById('lesson-content'),
  quizContent: document.getElementById('quiz-content'),
  mongoEditor: document.getElementById('mongo-editor'),
  resultsPane: document.getElementById('results-pane'),
  runQueryBtn: document.getElementById('run-query-btn'),
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  progressBar: document.getElementById('progress-bar'),
  progressText: document.getElementById('progress-text'),
  mobileMenuBtn: document.getElementById('mobile-menu-btn'),
  sidebar: document.getElementById('sidebar'),
  sidebarOverlay: document.getElementById('sidebar-overlay'),
};

// Initialization
function init() {
  renderSidebar();
  loadLesson(activeModule, activeLesson);
  updateProgress();
  setupEventListeners();
}

// Event Listeners Setup
function setupEventListeners() {
  elements.tabBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      switchTab(e.target.closest('button').dataset.tab);
    });
  });

  elements.runQueryBtn.addEventListener('click', runQuery);

  // Mobile sidebar toggle
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
  // Update buttons UI
  elements.tabBtns.forEach((btn) => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add('active', 'border-green-600', 'text-green-600');
      btn.classList.remove('text-gray-500', 'border-transparent');
    } else {
      btn.classList.remove('active', 'border-green-600', 'text-green-600');
      btn.classList.add('text-gray-500', 'border-transparent');
    }
  });

  // Update panes UI
  elements.tabPanes.forEach((pane) => {
    if (pane.id === `${tabId}-tab`) {
      pane.classList.remove('hidden');
      pane.classList.add('block');

      // Flex handling for simulator tab
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
                        <i class="${isCompleted ? 'fas fa-check-circle text-green-500' : 'far fa-circle text-gray-400'} mr-2 w-4"></i>
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

  // Automatically mark as complete for simplicity
  if (!userProgress.completedLessons.includes(lesson.id)) {
    markLessonComplete(lesson.id);
  }

  // Render lesson content
  elements.lessonContent.innerHTML = lesson.content;

  // Set simulator default code
  elements.mongoEditor.value = lesson.defaultCode || '';

  // Reset terminal
  elements.resultsPane.innerHTML = '';

  // Render Quiz
  renderQuiz(mIndex);

  // Update sidebar UI
  renderSidebar();

  // Close sidebar on mobile after clicking
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
            <div class="mb-8 p-6 bg-green-50 rounded-lg border border-green-100 quiz-question" id="q-container-${q.id}">
                <p class="font-semibold text-lg text-gray-800 mb-4">${i + 1}. ${q.question}</p>
                <div class="space-y-2">
        `;

    q.options.forEach((opt, oIndex) => {
      html += `
                <label class="flex items-center p-3 bg-white border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="radio" name="quiz-${q.id}" value="${oIndex}" class="mr-3 w-4 h-4 text-green-600">
                    <span class="text-gray-700">${opt}</span>
                </label>
            `;
    });

    html += `
                </div>
                <button data-quiz-id="${q.id}" data-module="${mIndex}" data-option="${i}" class="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
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
    feedback.className = 'mt-3 text-sm font-medium text-green-600 block';
    container.classList.replace('bg-green-50', 'bg-emerald-50');
    container.classList.replace('border-green-100', 'border-emerald-200');

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
  localStorage.setItem('mongoHubProgress', JSON.stringify(userProgress));
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
// MongoDB Simulator Engine
// ----------------------------------------------------
function runQuery() {
  const rawQuery = elements.mongoEditor.value.trim();

  if (!rawQuery) {
    appendTerminalOutput('> ', 'error-msg', 'SyntaxError: Unexpected end of input');
    return;
  }

  // Add command to terminal
  appendTerminalOutput('academy> ', 'query', rawQuery);

  // Parse the query: expected format e.g., db.users.find({status: "A"})
  // Use regex to extract parts
  const mongoRegex = /^db\.(\w+)\.(\w+)\(([\s\S]*)\)$/;
  const match = rawQuery.match(mongoRegex);

  if (!match) {
    appendTerminalOutput(
      '',
      'error-msg',
      'TypeError: db.' + rawQuery.split('.')[1] + ' is not a function or syntax is invalid.'
    );
    return;
  }

  const collectionName = match[1];
  const method = match[2];
  const argsStr = match[3].trim();

  if (!mockDB[collectionName]) {
    // In real mongo, creating collection on the fly is possible for inserts, but for now error or assume empty
    if (method !== 'insertOne' && method !== 'insertMany') {
      appendTerminalOutput('', 'result-json', '[]');
      return;
    } else {
      mockDB[collectionName] = [];
    }
  }

  try {
    let args = {};
    if (argsStr) {
      // Using a safe evaluator by wrapping in a function to evaluate JS object literals
      // This allows unquoted keys like { status: "A" }
      const parseArgs = new Function('return ' + (argsStr || '{}'));
      args = parseArgs();
    }

    executeMongoCommand(collectionName, method, args);
  } catch (e) {
    appendTerminalOutput(
      '',
      'error-msg',
      'SyntaxError: Invalid JSON or query arguments. ' + e.message
    );
  }
}

function executeMongoCommand(collectionName, method, args) {
  const collection = mockDB[collectionName];
  let result = null;
  let isError = false;

  switch (method) {
    case 'find':
      if (Object.keys(args).length === 0) {
        result = collection;
      } else {
        result = collection.filter((doc) => {
          // Simple exact match filtering for the simulator
          let isMatch = true;
          for (let key in args) {
            if (doc[key] !== args[key]) isMatch = false;
          }
          return isMatch;
        });
      }
      break;

    case 'insertOne': {
      // Generate a random mock ObjectId
      const newId = Math.floor(Math.random() * 10000000000).toString(16) + 'a1b2c3d4e5';
      const newDoc = { _id: newId, ...args };
      collection.push(newDoc);
      result = {
        acknowledged: true,
        insertedId: newId,
      };
      break;
    }

    case 'aggregate': {
      if (!Array.isArray(args)) {
        result = 'Error: aggregate() expects an array of pipeline stages';
        isError = true;
        break;
      }

      // Simple simulation of $match
      let currentData = [...collection];
      args.forEach((stage) => {
        if (stage.$match) {
          currentData = currentData.filter((doc) => {
            let isMatch = true;
            for (let key in stage.$match) {
              if (doc[key] !== stage.$match[key]) isMatch = false;
            }
            return isMatch;
          });
        }
      });
      result = currentData;
      break;
    }

    default:
      result = `TypeError: db.${collectionName}.${method} is not a valid simulator function`;
      isError = true;
  }

  if (isError) {
    appendTerminalOutput('', 'error-msg', result);
  } else {
    appendTerminalOutput('', 'result-json', JSON.stringify(result, null, 2));
  }
}

function appendTerminalOutput(promptText, className, message) {
  const div = document.createElement('div');
  div.className = 'mb-4';

  if (promptText) {
    const promptSpan = document.createElement('span');
    promptSpan.className = 'prompt';
    promptSpan.innerText = promptText;
    div.appendChild(promptSpan);
  }

  const msgSpan = document.createElement('span');
  msgSpan.className = className;
  msgSpan.innerText = message;

  div.appendChild(msgSpan);
  elements.resultsPane.appendChild(div);

  // Scroll to bottom
  const terminal = document.getElementById('terminal-content');
  terminal.scrollTop = terminal.scrollHeight;
}

// Run app
document.addEventListener('DOMContentLoaded', init);
