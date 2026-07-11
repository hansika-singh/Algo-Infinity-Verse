/* global checkAnswer, vis */

// State Variables
let activeModule = 0;
let activeLesson = 0;
let userProgress = JSON.parse(localStorage.getItem('neo4jHubProgress')) || {
  completedLessons: [],
  completedQuizzes: [],
};

// Mock Graph Database State
const mockGraphData = {
  nodes: [
    { id: 1, label: 'Person', name: 'Alice', age: 30, color: '#93c5fd' },
    { id: 2, label: 'Movie', title: 'The Matrix', released: 1999, color: '#fca5a5' },
    { id: 3, label: 'Person', name: 'Bob', age: 45, color: '#93c5fd' },
    { id: 4, label: 'Person', name: 'Charlie', age: 28, color: '#93c5fd' },
    { id: 5, label: 'Movie', title: 'Inception', released: 2010, color: '#fca5a5' },
  ],
  edges: [
    { id: 'e1', from: 1, to: 2, label: 'ACTED_IN', arrows: 'to' },
    { id: 'e2', from: 3, to: 2, label: 'DIRECTED', arrows: 'to' },
    { id: 'e3', from: 4, to: 5, label: 'ACTED_IN', arrows: 'to' },
    { id: 'e4', from: 1, to: 4, label: 'KNOWS', arrows: 'to' },
  ],
};

// vis.js Network Variables
let network = null;
let nodesDataset = null;
let edgesDataset = null;

// Curriculum Data
const curriculum = [
  {
    id: 'mod-1',
    title: 'Nodes, Labels & Properties',
    lessons: [
      {
        id: 'm1-l1',
        title: 'Introduction to Graphs',
        content: `
                    <div class="lesson-prose">
                        <h2>Welcome to Neo4j</h2>
                        <p>Unlike relational databases that use tables, Neo4j is a Graph Database. Data is stored as <strong>Nodes</strong> (entities) and <strong>Relationships</strong> (how they connect).</p>
                        <h3>Nodes</h3>
                        <p>Nodes often have <strong>Labels</strong> to group them (e.g., <code>:Person</code>, <code>:Movie</code>) and <strong>Properties</strong> to store data (e.g., <code>name: 'Alice'</code>).</p>
                        <p>In Cypher (the query language for Neo4j), nodes are represented by parentheses: <code>()</code>.</p>
                        <pre><code>// Example: Find all nodes
MATCH (n) RETURN n</code></pre>
                        <p>Go to the <strong>Graph Simulator</strong> tab and try running the default query to see the nodes in our database!</p>
                    </div>
                `,
        defaultCode: 'MATCH (n)\nRETURN n\nLIMIT 10',
      },
      {
        id: 'm1-l2',
        title: 'Filtering by Label',
        content: `
                    <div class="lesson-prose">
                        <h2>Filtering Nodes</h2>
                        <p>You can filter nodes by specifying a Label inside the parentheses.</p>
                        <pre><code>MATCH (p:Person) RETURN p</code></pre>
                        <p>This query finds all nodes with the label <code>Person</code> and assigns them to the variable <code>p</code>, which is then returned.</p>
                        <p>Try finding all the movies in the simulator.</p>
                    </div>
                `,
        defaultCode: 'MATCH (m:Movie)\nRETURN m',
      },
    ],
    quiz: [
      {
        id: 'q1',
        question: 'In Cypher, what syntax is used to represent a Node?',
        options: ['[node]', '{node}', '(node)', '<node>'],
        correct: 2,
      },
    ],
  },
  {
    id: 'mod-2',
    title: 'Relationships & Directions',
    lessons: [
      {
        id: 'm2-l1',
        title: 'Traversing the Graph',
        content: `
                    <div class="lesson-prose">
                        <h2>Relationships</h2>
                        <p>Relationships connect nodes and provide context. They are represented by arrows in Cypher: <code>--></code> or <code><--</code> or <code>--</code> (undirected).</p>
                        <p>You can also specify the relationship type using square brackets.</p>
                        <pre><code>MATCH (p:Person)-[r:ACTED_IN]->(m:Movie)
RETURN p, m</code></pre>
                        <p>Try running the query above in the simulator to see who acted in what movie!</p>
                    </div>
                `,
        defaultCode: 'MATCH (p:Person)-[:ACTED_IN]->(m:Movie)\nRETURN p, m',
      },
    ],
    quiz: [
      {
        id: 'q2',
        question: 'What syntax represents a relationship type in Cypher?',
        options: ['(TYPE)', '{TYPE}', '<TYPE>', '[:TYPE]'],
        correct: 3,
      },
    ],
  },
  {
    id: 'mod-3',
    title: 'Querying with Cypher (MATCH & RETURN)',
    lessons: [
      {
        id: 'm3-l1',
        title: 'Advanced Filtering',
        content: `
                    <div class="lesson-prose">
                        <h2>Filtering by Properties</h2>
                        <p>You can filter nodes based on their properties using curly braces <code>{}</code> directly in the MATCH clause, or by using a <code>WHERE</code> clause.</p>
                        <pre><code>MATCH (p:Person {name: 'Alice'})
RETURN p</code></pre>
                        <p>Or using WHERE:</p>
                        <pre><code>MATCH (p:Person)
WHERE p.age > 30
RETURN p</code></pre>
                        <p>Try finding Alice in the simulator!</p>
                    </div>
                `,
        defaultCode: "MATCH (n:Person {name: 'Alice'})\nRETURN n",
      },
    ],
    quiz: [
      {
        id: 'q3',
        question: 'Which clause is used to retrieve data in Cypher?',
        options: ['SELECT', 'GET', 'RETURN', 'FETCH'],
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
  cypherEditor: document.getElementById('cypher-editor'),
  runQueryBtn: document.getElementById('run-query-btn'),
  jsonResults: document.getElementById('json-results'),
  graphNetwork: document.getElementById('graph-network'),
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
      btn.classList.add('active', 'border-indigo-600', 'text-indigo-600');
      btn.classList.remove('text-gray-500', 'border-transparent');
    } else {
      btn.classList.remove('active', 'border-indigo-600', 'text-indigo-600');
      btn.classList.add('text-gray-500', 'border-transparent');
    }
  });

  elements.tabPanes.forEach((pane) => {
    if (pane.id === `${tabId}-tab`) {
      pane.classList.remove('hidden');
      pane.classList.add('block');

      if (tabId === 'simulator') {
        pane.classList.remove('block');
        pane.classList.add('flex', 'flex-col');

        // Initialize graph if not already done, need visible container for vis.js
        if (!network) {
          setTimeout(initGraph, 100);
        } else {
          // Force redraw
          setTimeout(() => network.fit(), 100);
        }
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
                        <i class="${isCompleted ? 'fas fa-check-circle text-indigo-500' : 'far fa-circle text-gray-400'} mr-2 w-4"></i>
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
  elements.cypherEditor.value = lesson.defaultCode || '';
  elements.jsonResults.innerHTML =
    '<span class="text-gray-400 italic">Run a query to see results...</span>';

  if (network) {
    network.unselectAll();
  }

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
            <div class="mb-8 p-6 bg-indigo-50 rounded-lg border border-indigo-100 quiz-question" id="q-container-${q.id}">
                <p class="font-semibold text-lg text-gray-800 mb-4">${i + 1}. ${q.question}</p>
                <div class="space-y-2">
        `;

    q.options.forEach((opt, oIndex) => {
      html += `
                <label class="flex items-center p-3 bg-white border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="radio" name="quiz-${q.id}" value="${oIndex}" class="mr-3 w-4 h-4 text-indigo-600">
                    <span class="text-gray-700">${opt}</span>
                </label>
            `;
    });

    html += `
                </div>
                <button data-quiz-id="${q.id}" data-module="${mIndex}" data-option="${i}" class="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
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
    feedback.className = 'mt-3 text-sm font-medium text-indigo-600 block';
    container.classList.replace('bg-indigo-50', 'bg-green-50');
    container.classList.replace('border-indigo-100', 'border-green-200');

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
  localStorage.setItem('neo4jHubProgress', JSON.stringify(userProgress));
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
// Neo4j Simulator Engine (vis.js integration)
// ----------------------------------------------------

function initGraph() {
  if (!window.vis) {
    console.error('vis.js not loaded yet');
    return;
  }

  // Format nodes for vis.js (needs id and label)
  const formattedNodes = mockGraphData.nodes.map((n) => ({
    ...n,
    // use name or title for the display label on the node circle
    label: n.name || n.title || n.label,
    group: n.label,
    font: { color: '#1f2937' },
    shape: 'dot',
    size: 20,
  }));

  nodesDataset = new vis.DataSet(formattedNodes);
  edgesDataset = new vis.DataSet(mockGraphData.edges);

  const data = {
    nodes: nodesDataset,
    edges: edgesDataset,
  };

  const options = {
    nodes: {
      borderWidth: 2,
      shadow: true,
      color: {
        border: '#4b5563',
        highlight: {
          border: '#4f46e5',
          background: '#e0e7ff',
        },
      },
    },
    edges: {
      width: 2,
      color: '#9ca3af',
      font: { align: 'top' },
      smooth: { type: 'continuous' },
    },
    physics: {
      barnesHut: {
        gravitationalConstant: -2000,
        centralGravity: 0.3,
        springLength: 150,
      },
      stabilization: { iterations: 150 },
    },
    interaction: {
      hover: true,
      zoomView: true,
    },
  };

  network = new vis.Network(elements.graphNetwork, data, options);
}

function runSimulation() {
  if (!network) return;

  const query = elements.cypherEditor.value.trim();
  if (!query) return;

  let matchedNodes = [];
  let matchedEdges = [];

  // Very basic Regex Parsing to simulate a Cypher engine for learning purposes

  // 1. Check for Labels e.g., (n:Person)
  const labelMatch = query.match(/\(\w+:(\w+)\)/);
  // 2. Check for specific properties e.g., {name: 'Alice'}
  const propMatch = query.match(/\{(\w+):\s*'([^']+)'\}/);
  // 3. Check for relationship types e.g., -[:ACTED_IN]->
  const relMatch = query.match(/-\[:(\w+)\]->/);

  // Filter nodes
  matchedNodes = mockGraphData.nodes.filter((node) => {
    let isMatch = true;
    if (labelMatch && node.label !== labelMatch[1]) isMatch = false;
    if (propMatch && node[propMatch[1]] !== propMatch[2]) isMatch = false;
    return isMatch;
  });

  // Filter edges if explicitly queried
  if (relMatch) {
    matchedEdges = mockGraphData.edges.filter((edge) => edge.label === relMatch[1]);
    // Add nodes connected by this edge to matched nodes if not already there
    matchedEdges.forEach((edge) => {
      if (!matchedNodes.find((n) => n.id === edge.from))
        matchedNodes.push(mockGraphData.nodes.find((n) => n.id === edge.from));
      if (!matchedNodes.find((n) => n.id === edge.to))
        matchedNodes.push(mockGraphData.nodes.find((n) => n.id === edge.to));
    });
  }

  // If it's a generic MATCH (n) without filters, match everything
  if (!labelMatch && !propMatch && !relMatch && query.includes('MATCH')) {
    matchedNodes = [...mockGraphData.nodes];
    matchedEdges = [...mockGraphData.edges];
  }

  // --- Output to JSON ---
  const resultObj = {
    nodes: matchedNodes.length > 0 ? matchedNodes : 'No records found',
    relationships: matchedEdges.length > 0 ? matchedEdges : [],
  };
  elements.jsonResults.innerHTML = JSON.stringify(resultObj, null, 2).replace(
    /"([^"]+)":/g,
    '<span class="text-indigo-600">"$1"</span>:'
  );

  // --- Highlight in vis-network ---
  network.unselectAll();

  if (matchedNodes.length > 0 || matchedEdges.length > 0) {
    const nodeIds = matchedNodes.map((n) => n.id);
    const edgeIds = matchedEdges.map((e) => e.id);

    network.selectNodes(nodeIds);
    network.selectEdges(edgeIds);

    // Optional: zoom to fit matched nodes
    if (nodeIds.length > 0) {
      network.fit({ nodes: nodeIds, animation: true });
    }
  }
}

// Run init on load
document.addEventListener('DOMContentLoaded', init);
