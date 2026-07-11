// --- Curriculum Data ---
const curriculum = [
  {
    id: 'node-basics',
    title: 'Node.js Basics & Global Objects',
    lessons: [
      {
        id: 'nb-1',
        title: 'Introduction to Node.js',
        content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">JavaScript Outside the Browser</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine. It allows you to run JavaScript on the server, outside of a web browser.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Unlike the browser, Node doesn't have a <code>window</code> or <code>document</code> object. Instead, it provides global objects like <code>process</code>, <code>__dirname</code>, and <code>module</code>.</p>
                    <div class="bg-green-50 border-l-4 border-[#339933] p-4 my-6 rounded-r-lg">
                        <p class="text-green-800 font-medium">Head over to the Terminal Simulator tab to try logging global objects!</p>
                    </div>
                `,
        defaultCode: `// Log a simple message
console.log("Hello from Node.js!");

// Access the global process object (simulated)
console.log("Process Architecture:", process.arch);
console.log("Process Platform:", process.platform);

// Working with paths
console.log("Current Directory:", __dirname);
console.log("Current File:", __filename);`,
      },
    ],
    quiz: [
      {
        id: 'q-nb-1',
        question:
          'Which of the following objects is available in a standard browser environment but NOT in Node.js?',
        options: ['console', 'Math', 'window', 'Date'],
        correct: 2,
      },
      {
        id: 'q-nb-2',
        question:
          'Which global variable provides the absolute path of the directory containing the currently executing file?',
        options: ['__filename', 'process.cwd()', '__dirname', 'path.dir'],
        correct: 2,
      },
    ],
  },
  {
    id: 'file-system',
    title: 'The File System (fs)',
    lessons: [
      {
        id: 'fs-1',
        title: 'Working with Files',
        content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">The <code>fs</code> Module</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">The <code>fs</code> module provides an API for interacting with the file system. You can read, write, update, delete, and rename files.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">To use it, you must require it: <code>const fs = require('fs');</code></p>
                `,
        defaultCode: `// Require the built-in fs module
const fs = require('fs');

console.log("Reading file asynchronously...");

// Using our simulated fs module
fs.readFile('./hello.txt', 'utf8', (err, data) => {
    if (err) {
        console.error("Error reading file:", err);
        return;
    }
    console.log("File contents:", data);
});

console.log("This logs BEFORE the file is read because fs.readFile is non-blocking!");`,
      },
    ],
    quiz: [
      {
        id: 'q-fs-1',
        question: "How do you import a core module like 'fs' in a CommonJS Node environment?",
        options: ["import fs from 'fs'", "const fs = require('fs')", "load('fs')", "fetch('fs')"],
        correct: 1,
      },
    ],
  },
  {
    id: 'http-server',
    title: 'Building an HTTP Server',
    lessons: [
      {
        id: 'http-1',
        title: 'The HTTP Module',
        content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Creating a Web Server</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Node.js has a built-in <code>http</code> module that allows Node.js to transfer data over the Hyper Text Transfer Protocol (HTTP).</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">You use <code>http.createServer()</code> to create an HTTP server that listens to server ports and gives a response back to the client.</p>
                `,
        defaultCode: `const http = require('http');

const server = http.createServer((req, res) => {
    console.log(\`Received request for: \${req.url}\`);
    
    // Set response header
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    
    // Send response body
    res.end('Hello, World! This is my first Node Server.');
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(\`Server is running and listening on port \${PORT}\`);
});`,
      },
    ],
    quiz: [
      {
        id: 'q-http-1',
        question: 'Which method is used on the http module to instantiate a new web server?',
        options: ['http.startServer()', 'http.newServer()', 'http.createServer()', 'http.listen()'],
        correct: 2,
      },
    ],
  },
];

// --- State & Progress ---
let state = {
  activeModuleId: curriculum[0].id,
  activeLessonId: curriculum[0].lessons[0].id,
  activeTab: 'lesson', // lesson, terminal, quiz
  completedItems: [],
  quizAnswers: {},
};

// Load state from local storage
function loadProgress() {
  try {
    const saved = localStorage.getItem('nodeHubProgress');
    if (saved) {
      state.completedItems = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load progress', e);
  }
}

// Save state to local storage and update UI
function saveProgress() {
  try {
    localStorage.setItem('nodeHubProgress', JSON.stringify(state.completedItems));
  } catch (e) {
    console.error('Failed to save progress', e);
  }
  updateProgressBar();
  renderSidebar(); // re-render sidebar to show checkmarks
}

function markItemComplete(id) {
  if (!state.completedItems.includes(id)) {
    state.completedItems.push(id);
    saveProgress();
  }
}

function updateProgressBar() {
  let totalItems = 0;
  curriculum.forEach((mod) => {
    totalItems += mod.lessons.length;
    if (mod.quiz && mod.quiz.length > 0) totalItems += 1;
  });

  if (totalItems === 0) return;
  const progressPercent = Math.round((state.completedItems.length / totalItems) * 100);

  document.getElementById('progress-bar').style.width = `${progressPercent}%`;
  document.getElementById('progress-text').innerText = `${progressPercent}%`;
}

// --- DOM Elements ---
const DOM = {
  sidebarOverlay: document.getElementById('sidebar-overlay'),
  sidebar: document.getElementById('sidebar'),
  openSidebarBtn: document.getElementById('open-sidebar'),
  closeSidebarBtn: document.getElementById('close-sidebar'),
  moduleList: document.getElementById('module-list'),
  activeModuleTitle: document.getElementById('active-module-title'),
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),
  tabLesson: document.getElementById('tab-lesson'),
  tabTerminal: document.getElementById('tab-terminal'),
  tabQuiz: document.getElementById('tab-quiz'),
  codeEditor: document.getElementById('code-editor'),
  runCodeBtn: document.getElementById('run-code-btn'),
  clearTerminalBtn: document.getElementById('clear-terminal-btn'),
  simulatedTerminal: document.getElementById('simulated-terminal'),
};

// --- Initialization ---
function init() {
  loadProgress();
  updateProgressBar();

  // Set up event listeners
  setupEventListeners();

  // Initial Render
  renderSidebar();
  renderActiveState();
}

function setupEventListeners() {
  // Sidebar toggles
  DOM.openSidebarBtn.addEventListener('click', () => {
    DOM.sidebar.classList.remove('-translate-x-full');
    DOM.sidebarOverlay.classList.remove('hidden');
  });

  const closeSidebar = () => {
    DOM.sidebar.classList.add('-translate-x-full');
    DOM.sidebarOverlay.classList.add('hidden');
  };

  DOM.closeSidebarBtn.addEventListener('click', closeSidebar);
  DOM.sidebarOverlay.addEventListener('click', closeSidebar);

  // Tabs
  DOM.tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // Terminal Controls
  DOM.runCodeBtn.addEventListener('click', runSimulation);
  DOM.clearTerminalBtn.addEventListener('click', () => {
    DOM.simulatedTerminal.innerHTML = '';
  });

  // Allow basic tab indentation in textarea
  DOM.codeEditor.addEventListener('keydown', function (e) {
    if (e.key == 'Tab') {
      e.preventDefault();
      var start = this.selectionStart;
      var end = this.selectionEnd;
      this.value = this.value.substring(0, start) + '  ' + this.value.substring(end); // Node typically 2 spaces
      this.selectionStart = this.selectionEnd = start + 2;
    }
  });
}

function switchTab(tabId) {
  state.activeTab = tabId;

  DOM.tabBtns.forEach((btn) => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  DOM.tabContents.forEach((content) => {
    content.classList.remove('active', 'flex', 'md:flex');
  });

  const activeContent = document.getElementById(`tab-${tabId}`);
  if (tabId === 'terminal') {
    activeContent.classList.add('active', 'flex', 'md:flex-row');
  } else {
    activeContent.classList.add('active');
  }
}

function getActiveModule() {
  return curriculum.find((m) => m.id === state.activeModuleId) || curriculum[0];
}

function getActiveLesson() {
  const mod = getActiveModule();
  return mod.lessons.find((l) => l.id === state.activeLessonId) || mod.lessons[0];
}

function changeModule(moduleId) {
  const mod = curriculum.find((m) => m.id === moduleId);
  if (mod) {
    state.activeModuleId = moduleId;
    state.activeLessonId = mod.lessons[0].id;

    // Optional: clear terminal on module switch
    // DOM.simulatedTerminal.innerHTML = '<div class="text-gray-500 mb-2">Welcome to Node.js v18.16.0. Type commands or run index.js.</div>';

    renderSidebar();
    renderActiveState();
    if (window.innerWidth < 1024) {
      DOM.sidebar.classList.add('-translate-x-full');
      DOM.sidebarOverlay.classList.add('hidden');
    }
  }
}

// --- Rendering Functions ---

function renderSidebar() {
  DOM.moduleList.innerHTML = '';

  curriculum.forEach((mod) => {
    const isActive = mod.id === state.activeModuleId;

    const allLessonsDone = mod.lessons.every((l) => state.completedItems.includes(l.id));
    const quizDone =
      mod.quiz && mod.quiz.length > 0 ? state.completedItems.includes(`${mod.id}-quiz`) : true;
    const isModuleComplete = allLessonsDone && quizDone;

    const li = document.createElement('li');

    const btn = document.createElement('button');
    btn.className = `w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${isActive ? 'bg-green-100 text-green-900 font-semibold border-l-4 border-[#339933]' : 'hover:bg-gray-100 text-gray-700 border-l-4 border-transparent'}`;
    btn.onclick = () => changeModule(mod.id);

    const textSpan = document.createElement('span');
    textSpan.className = 'truncate block';
    textSpan.innerText = mod.title;

    btn.appendChild(textSpan);

    if (isModuleComplete) {
      const checkIcon = document.createElement('i');
      checkIcon.className = 'fa-solid fa-check-circle text-[#339933]';
      btn.appendChild(checkIcon);
    }

    li.appendChild(btn);
    DOM.moduleList.appendChild(li);
  });
}

function renderActiveState() {
  const mod = getActiveModule();
  const lesson = getActiveLesson();

  DOM.activeModuleTitle.innerText = mod.title;

  renderLesson(lesson);
  renderQuiz(mod);

  DOM.codeEditor.value = lesson.defaultCode;
}

function renderLesson(lesson) {
  const isCompleted = state.completedItems.includes(lesson.id);

  DOM.tabLesson.innerHTML = `
        <div class="max-w-3xl mx-auto animate-fade-in">
            <h2 class="text-3xl font-bold text-gray-900 mb-6">${lesson.title}</h2>
            <div class="prose max-w-none text-gray-800">
                ${lesson.content}
            </div>
            
            <div class="mt-12 pt-6 border-t border-gray-200 flex justify-end">
                <button id="mark-lesson-complete" class="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${isCompleted ? 'bg-green-100 text-green-800 cursor-default' : 'bg-[#339933] text-white hover:bg-[#2d882d] shadow-md'}">
                    ${isCompleted ? '<i class="fa-solid fa-check"></i> Completed' : 'Mark as Complete & Continue'}
                </button>
            </div>
        </div>
    `;

  const btn = document.getElementById('mark-lesson-complete');
  if (!isCompleted) {
    btn.addEventListener('click', () => {
      markItemComplete(lesson.id);
      renderLesson(lesson);
      switchTab('terminal');
    });
  }
}

function renderQuiz(mod) {
  const quizId = `${mod.id}-quiz`;
  const isCompleted = state.completedItems.includes(quizId);

  if (!mod.quiz || mod.quiz.length === 0) {
    DOM.tabQuiz.innerHTML =
      '<div class="text-center text-gray-500 mt-10">No quiz available for this module.</div>';
    return;
  }

  let html = `
        <div class="max-w-3xl mx-auto animate-fade-in pb-12">
            <div class="mb-8 border-b pb-4">
                <h2 class="text-3xl font-bold text-gray-900">Module Quiz</h2>
                ${isCompleted ? '<span class="inline-block mt-3 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold"><i class="fa-solid fa-check mr-1"></i> Passed</span>' : ''}
            </div>
            <div id="quiz-questions-container" class="space-y-8">
    `;

  mod.quiz.forEach((q, index) => {
    html += `
            <div class="bg-white border rounded-xl p-6 shadow-sm">
                <h4 class="font-semibold text-lg text-gray-800 mb-4"><span class="text-[#339933] mr-2">${index + 1}.</span>${q.question}</h4>
                <div class="space-y-3">
        `;

    q.options.forEach((opt, optIdx) => {
      const isSelected = state.quizAnswers[q.id] === optIdx;

      html += `
                <label class="flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-green-50 border-green-500' : 'hover:bg-gray-50 border-gray-200'}">
                    <input type="radio" name="quiz-${q.id}" value="${optIdx}" class="form-radio text-green-600 h-5 w-5" ${isSelected ? 'checked' : ''} onchange="handleQuizSelection('${q.id}', ${optIdx})">
                    <span class="ml-3 text-gray-700">${opt}</span>
                </label>
            `;
    });

    html += `</div></div>`;
  });

  html += `
            </div>
            <div class="mt-8 flex flex-col items-center border-t pt-8">
                <button id="submit-quiz-btn" class="px-8 py-3 rounded-lg font-bold text-lg text-white bg-[#339933] hover:bg-[#2d882d] shadow-md transition-all">Submit Answers</button>
                <div id="quiz-feedback" class="mt-4 text-lg font-bold hidden"></div>
            </div>
        </div>
    `;

  DOM.tabQuiz.innerHTML = html;

  document.getElementById('submit-quiz-btn').addEventListener('click', () => {
    let score = 0;
    let allAnswered = true;

    mod.quiz.forEach((q) => {
      if (state.quizAnswers[q.id] === undefined) {
        allAnswered = false;
      } else if (state.quizAnswers[q.id] === q.correct) {
        score++;
      }
    });

    const feedback = document.getElementById('quiz-feedback');
    feedback.classList.remove('hidden', 'text-red-600', 'text-green-600');

    if (!allAnswered) {
      feedback.innerText = 'Please answer all questions.';
      feedback.classList.add('text-red-600');
      return;
    }

    if (score === mod.quiz.length) {
      feedback.innerHTML = '<i class="fa-solid fa-party-horn"></i> Perfect! You passed.';
      feedback.classList.add('text-green-600');
      markItemComplete(quizId);
      renderSidebar();
    } else {
      feedback.innerText = `You scored ${score} out of ${mod.quiz.length}. Try again!`;
      feedback.classList.add('text-red-600');
    }
  });
}

window.handleQuizSelection = function (questionId, optionIndex) {
  state.quizAnswers[questionId] = optionIndex;
  renderQuiz(getActiveModule());
};

// --- Node.js Terminal Simulator Engine (CRITICAL) ---

function printToTerminal(text, type = 'output') {
  const line = document.createElement('div');
  line.className = `terminal-line`;

  // Add specific colors based on output type
  let colorClass = 'term-output';
  if (type === 'error') colorClass = 'term-error';
  if (type === 'warn') colorClass = 'term-warn';
  if (type === 'system') colorClass = 'term-system';

  line.innerHTML = `<span class="${colorClass}">${text}</span>`;
  DOM.simulatedTerminal.appendChild(line);

  // Scroll to bottom
  DOM.simulatedTerminal.scrollTop = DOM.simulatedTerminal.scrollHeight;
}

function printPrompt(command) {
  const line = document.createElement('div');
  line.className = 'terminal-line';
  line.innerHTML = `<span class="terminal-prompt">~/project $</span> <span class="term-output">${command}</span>`;
  DOM.simulatedTerminal.appendChild(line);
}

// Utility to stringify objects for console.log simulation
function formatOutput(args) {
  return Array.from(args)
    .map((arg) => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return '[Object]';
        }
      }
      return String(arg);
    })
    .join(' ');
}

function runSimulation() {
  const userCode = DOM.codeEditor.value;

  printPrompt('node index.js');

  // Simulate slight startup delay
  setTimeout(() => {
    // 1. Store original console functions
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    // Override console functions to push to UI
    console.log = function (...args) {
      printToTerminal(formatOutput(args), 'output');
    };
    console.error = function (...args) {
      printToTerminal(formatOutput(args), 'error');
    };
    console.warn = function (...args) {
      printToTerminal(formatOutput(args), 'warn');
    };

    // 2. Mock Global Objects usually found in Node.js
    const __dirname = '/usr/src/app/project';
    const __filename = '/usr/src/app/project/index.js';

    const process = {
      arch: 'x64',
      platform: 'linux',
      cwd: () => '/usr/src/app/project',
      env: { NODE_ENV: 'development' },
    };

    // Mock require() function
    const require = function (moduleName) {
      printToTerminal(`(Simulated require for '${moduleName}')`, 'system');

      // Return fake module objects
      if (moduleName === 'fs') {
        return {
          readFile: (path, encoding, cb) => {
            // Simulate async file read
            setTimeout(() => {
              cb(null, 'Hello from the simulated file system! Node is awesome.');
            }, 400);
          },
          readFileSync: () => 'Sync file content.',
        };
      }
      if (moduleName === 'http') {
        return {
          createServer: (cb) => {
            return {
              listen: (port, callback) => {
                setTimeout(callback, 200);
                // Simulate an incoming request shortly after starting
                setTimeout(() => {
                  const req = { url: '/' };
                  const res = {
                    writeHead: () => {},
                    end: (msg) =>
                      printToTerminal(`[Simulated HTTP Client received]: ${msg}`, 'system'),
                  };
                  cb(req, res);
                }, 800);
              },
            };
          },
        };
      }

      return {}; // Return empty object for unhandled modules
    };

    // 3. Execution using new Function()
    // We pass the mocks as arguments to the generated function so they act as local variables imitating globals
    try {
      const executeNode = new Function(
        'console',
        'require',
        'process',
        '__dirname',
        '__filename',
        userCode
      );
      executeNode(console, require, process, __dirname, __filename);
    } catch (e) {
      console.error('Runtime Exception:', e.message);
    }

    // Restore original console functions immediately after synchronous execution finishes
    // Note: Asynchronous logs (like those inside setTimeout or simulated fs.readFile)
    // will unfortunately use the restored console if they fire later.
    // For a perfectly robust simulator we'd keep the interceptor active, but this suffices for the demo.

    // Wait a brief moment to catch immediate async callbacks, then restore
    setTimeout(() => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    }, 1500);
  }, 200);
}

// Start application
init();
