/* global checkAnswer */
// State Variables
let activeModule = 0;
let activeLesson = 0;
let userProgress = JSON.parse(localStorage.getItem('elasticHubProgress')) || {
  completedLessons: [],
  completedQuizzes: [],
};

// Mock Elasticsearch Database
const mockDb = {
  products: [
    {
      id: '1',
      name: 'Dell XPS 13 Laptop',
      category: 'electronics',
      price: 999.99,
      tags: ['laptop', 'computer', 'dell'],
    },
    {
      id: '2',
      name: 'Apple MacBook Pro',
      category: 'electronics',
      price: 1299.0,
      tags: ['laptop', 'apple', 'mac'],
    },
    {
      id: '3',
      name: 'Logitech MX Master 3',
      category: 'accessories',
      price: 99.99,
      tags: ['mouse', 'wireless'],
    },
    {
      id: '4',
      name: 'Sony WH-1000XM4 Headphones',
      category: 'audio',
      price: 348.0,
      tags: ['headphones', 'wireless', 'noise-canceling'],
    },
    {
      id: '5',
      name: 'LG 27 inch 4K Monitor',
      category: 'electronics',
      price: 399.0,
      tags: ['monitor', '4k', 'display'],
    },
  ],
};

// Curriculum Data
const curriculum = [
  {
    id: 'mod-1',
    title: 'Elasticsearch Basics & Indexing',
    lessons: [
      {
        id: 'm1-l1',
        title: 'What is Elasticsearch?',
        content: `
                    <div class="lesson-prose">
                        <h2>Welcome to Elasticsearch</h2>
                        <p>Elasticsearch is a distributed, RESTful search and analytics engine capable of addressing a growing number of use cases. It stores data as JSON documents.</p>
                        <h3>The Basics: Indices</h3>
                        <p>An <strong>Index</strong> in Elasticsearch is like a table in a relational database. It is a collection of documents that have somewhat similar characteristics.</p>
                        <p>To view all documents in an index, you can run a <code>match_all</code> query.</p>
                        <pre><code>GET /products/_search
{
  "query": {
    "match_all": {}
  }
}</code></pre>
                        <p>Go to the <strong>Simulator</strong> tab and run the default query to see all our mock products.</p>
                    </div>
                `,
        defaultCode: `GET /products/_search\n{\n  "query": {\n    "match_all": {}\n  }\n}`,
      },
    ],
    quiz: [
      {
        id: 'q1',
        question: 'In Elasticsearch, what is the rough equivalent of a relational database table?',
        options: ['A Cluster', 'A Node', 'A Document', 'An Index'],
        correct: 3,
      },
    ],
  },
  {
    id: 'mod-2',
    title: 'The Search API (Match & Term)',
    lessons: [
      {
        id: 'm2-l1',
        title: 'The Match Query',
        content: `
                    <div class="lesson-prose">
                        <h2>Full-Text Search</h2>
                        <p>The <code>match</code> query is the standard query for performing a full-text search, including options for fuzzy matching.</p>
                        <pre><code>GET /products/_search
{
  "query": {
    "match": {
      "name": "laptop"
    }
  }
}</code></pre>
                        <p>Try running the query above in the simulator to find laptops.</p>
                    </div>
                `,
        defaultCode: `GET /products/_search\n{\n  "query": {\n    "match": {\n      "name": "laptop"\n    }\n  }\n}`,
      },
      {
        id: 'm2-l2',
        title: 'The Term Query',
        content: `
                    <div class="lesson-prose">
                        <h2>Exact Values</h2>
                        <p>You can use the <code>term</code> query to find documents that contain an <em>exact</em> term in a provided field. This is useful for structured data like numbers, dates, or enums.</p>
                        <pre><code>GET /products/_search
{
  "query": {
    "term": {
      "category": "audio"
    }
  }
}</code></pre>
                        <p>Try finding audio products in the simulator.</p>
                    </div>
                `,
        defaultCode: `GET /products/_search\n{\n  "query": {\n    "term": {\n      "category": "audio"\n    }\n  }\n}`,
      },
    ],
    quiz: [
      {
        id: 'q2',
        question:
          'Which query type is best used for exact value matching (like IDs or categories)?',
        options: ['match_all', 'match', 'term', 'fuzzy'],
        correct: 2,
      },
    ],
  },
  {
    id: 'mod-3',
    title: 'Basic Aggregations',
    lessons: [
      {
        id: 'm3-l1',
        title: 'Introduction to Aggs',
        content: `
                    <div class="lesson-prose">
                        <h2>Aggregations</h2>
                        <p>Aggregations allow you to group and extract statistics from your data, similar to a SQL <code>GROUP BY</code>.</p>
                        <pre><code>GET /products/_search
{
  "size": 0,
  "aggs": {
    "categories": {
      "terms": {
        "field": "category"
      }
    }
  }
}</code></pre>
                        <p><em>(Note: Complex aggregations are not fully implemented in this lightweight simulator, but you can try basic match/term queries!)</em></p>
                    </div>
                `,
        defaultCode: `GET /products/_search\n{\n  "query": {\n    "match_all": {}\n  }\n}`,
      },
    ],
    quiz: [
      {
        id: 'q3',
        question: 'What is the purpose of setting "size": 0 in an aggregation request?',
        options: [
          'To delete the index',
          'To return 0 aggregations',
          'To skip returning the actual documents and only return the aggregation results',
          'To compress the response',
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
  esEditor: document.getElementById('es-editor'),
  runQueryBtn: document.getElementById('run-query-btn'),
  jsonResults: document.getElementById('json-results'),
  esStatus: document.getElementById('es-status'),
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

// Setup Event Listeners
function setupEventListeners() {
  elements.tabBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      switchTab(e.target.closest('button').dataset.tab);
    });
  });

  elements.runQueryBtn.addEventListener('click', runSimulation);

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
      btn.classList.add('active', 'border-teal-600', 'text-teal-600');
      btn.classList.remove('text-gray-500', 'border-transparent');
    } else {
      btn.classList.remove('active', 'border-teal-600', 'text-teal-600');
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
                        <i class="${isCompleted ? 'fas fa-check-circle text-teal-500' : 'far fa-circle text-gray-400'} mr-2 w-4"></i>
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
  elements.esEditor.value = lesson.defaultCode || '';
  elements.jsonResults.innerHTML =
    '<span class="text-gray-500 italic">Click Play to run the request...</span>';
  elements.esStatus.textContent = '';

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
            <div class="mb-8 p-6 bg-teal-50 rounded-lg border border-teal-100 quiz-question" id="q-container-${q.id}">
                <p class="font-semibold text-lg text-gray-800 mb-4">${i + 1}. ${q.question}</p>
                <div class="space-y-2">
        `;

    q.options.forEach((opt, oIndex) => {
      html += `
                <label class="flex items-center p-3 bg-white border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="radio" name="quiz-${q.id}" value="${oIndex}" class="mr-3 w-4 h-4 text-teal-600">
                    <span class="text-gray-700">${opt}</span>
                </label>
            `;
    });

    html += `
                </div>
                <button data-quiz-id="${q.id}" data-module="${mIndex}" data-option="${i}" class="mt-4 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
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
    feedback.className = 'mt-3 text-sm font-medium text-teal-600 block';
    container.classList.replace('bg-teal-50', 'bg-green-50');
    container.classList.replace('border-teal-100', 'border-green-200');

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
  localStorage.setItem('elasticHubProgress', JSON.stringify(userProgress));
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
// Kibana Dev Tools Simulator Engine
// ----------------------------------------------------

function runSimulation() {
  const rawInput = elements.esEditor.value.trim();
  if (!rawInput) return;

  elements.esStatus.textContent = 'Executing...';
  elements.esStatus.className = 'text-xs font-mono text-teal-400';

  setTimeout(() => {
    try {
      // Split endpoint and json payload
      const lines = rawInput.split('\\n');
      const endpointLine = lines[0].trim();
      const jsonStr = lines.slice(1).join('\\n').trim();

      let index = 'products';

      // Very basic parse of endpoint
      if (endpointLine) {
        const parts = endpointLine.split(' ');
        if (parts.length >= 2) {
          const pathParts = parts[1].split('/').filter((p) => p !== '');
          if (pathParts.length > 0 && pathParts[0] !== '_search') {
            index = pathParts[0];
          }
        }
      }

      // Parse payload if exists
      let payload = null;
      if (jsonStr && jsonStr.startsWith('{')) {
        payload = JSON.parse(jsonStr);
      }

      // Query Execution Logic
      let results = [];
      const indexData = mockDb[index] || [];

      if (!payload || !payload.query || payload.query.match_all) {
        results = indexData;
      } else if (payload.query.match) {
        const field = Object.keys(payload.query.match)[0];
        const value = payload.query.match[field].toString().toLowerCase();
        results = indexData.filter((item) => {
          if (item[field]) {
            return item[field].toString().toLowerCase().includes(value);
          }
          return false;
        });
      } else if (payload.query.term) {
        const field = Object.keys(payload.query.term)[0];
        const value = payload.query.term[field];
        results = indexData.filter((item) => item[field] === value);
      } else {
        results = indexData; // Fallback
      }

      // Construct ES style response
      const esResponse = {
        took: Math.floor(Math.random() * 5) + 1,
        timed_out: false,
        _shards: {
          total: 1,
          successful: 1,
          skipped: 0,
          failed: 0,
        },
        hits: {
          total: {
            value: results.length,
            relation: 'eq',
          },
          max_score: results.length > 0 ? 1.0 : null,
          hits: results.map((item) => ({
            _index: index,
            _id: item.id,
            _score: 1.0,
            _source: item,
          })),
        },
      };

      elements.jsonResults.innerHTML = syntaxHighlight(JSON.stringify(esResponse, null, 2));
      elements.esStatus.textContent = `200 OK - ${esResponse.took}ms`;
      elements.esStatus.className = 'text-xs font-mono text-green-400';
    } catch (e) {
      elements.jsonResults.innerHTML = `<span class="text-red-400">Error parsing request:\\n${e.message}\\n\\nEnsure your JSON payload is valid.</span>`;
      elements.esStatus.textContent = '400 Bad Request';
      elements.esStatus.className = 'text-xs font-mono text-red-400';
    }
  }, 300); // Artificial delay
}

// Kibana syntax highlighting for JSON
function syntaxHighlight(json) {
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(
    /("(\\\\u[a-zA-Z0-9]{4}|\\\\[^u]|[^\\\\"])*"(\\s*:)?|\\b(true|false|null)\\b|-?\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?)/g,
    function (match) {
      let cls = 'es-number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'es-key';
          // Remove quotes from key display in Kibana style if desired, keeping simple here
        } else {
          cls = 'es-string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'es-boolean';
      } else if (/null/.test(match)) {
        cls = 'es-null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    }
  );
}

// Run init on load
document.addEventListener('DOMContentLoaded', init);
