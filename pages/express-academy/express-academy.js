// --- Curriculum Data ---
const curriculum = [
    {
        id: "express-basics",
        title: "Express Basics & Routing",
        lessons: [
            {
                id: "eb-1",
                title: "Hello Express",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Fast, unopinionated, minimalist web framework</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Express is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Routing refers to determining how an application responds to a client request to a particular endpoint, which is a URI (or path) and a specific HTTP request method (GET, POST, and so on).</p>
                    <div class="bg-blue-50 border-l-4 border-blue-600 p-4 my-6 rounded-r-lg">
                        <p class="text-blue-800 font-medium">Head over to the API Simulator tab, start the server, and send a GET request to <code>/</code> or <code>/api/users</code>!</p>
                    </div>
                `,
                defaultCode: `const express = require('express');
const app = express();
const port = 3000;

// Basic GET route
app.get('/', (req, res) => {
  console.log("Received GET request at /");
  res.send('Hello World!');
});

// JSON API route
app.get('/api/users', (req, res) => {
  console.log("Fetching users from database...");
  res.json([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ]);
});

app.listen(port, () => {
  console.log(\`Example app listening on port \${port}\`);
});`
            }
        ],
        quiz: [
            {
                id: "q-eb-1",
                question: "Which Express application method is used to route HTTP GET requests to a specified path with a callback function?",
                options: ["app.post()", "app.request()", "app.get()", "app.route()"],
                correct: 2
            }
        ]
    },
    {
        id: "middleware",
        title: "Middleware Magic",
        lessons: [
            {
                id: "mw-1",
                title: "Understanding Middleware",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">The Middleware Chain</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Middleware functions are functions that have access to the request object (req), the response object (res), and the next middleware function in the application's request-response cycle.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">They can execute any code, make changes to the request and the response objects, end the request-response cycle, or call the next middleware function in the stack using <code>next()</code>.</p>
                `,
                defaultCode: `const express = require('express');
const app = express();

// Custom Logger Middleware
const loggerMiddleware = (req, res, next) => {
  console.log(\`[LOG]: \${req.method} request to \${req.url}\`);
  next(); // Pass control to the next handler
};

// Register middleware globally
app.use(loggerMiddleware);

app.get('/secret', (req, res) => {
  res.send('You found the secret page!');
});

app.listen(3000, () => console.log('Server started'));`
            }
        ],
        quiz: [
            {
                id: "q-mw-1",
                question: "If a middleware function does not end the request-response cycle, what MUST it call to pass control to the next middleware function?",
                options: ["continue()", "res.send()", "next()", "return"],
                correct: 2
            }
        ]
    },
    {
        id: "rest-crud",
        title: "Building REST APIs (CRUD)",
        lessons: [
            {
                id: "crud-1",
                title: "Handling POST Requests",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Creating Resources</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">To handle POST requests (Create), you typically need to parse the incoming request body. Express provides built-in middleware for this: <code>express.json()</code>.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Once parsed, the body data is available on the <code>req.body</code> property.</p>
                `,
                defaultCode: `const express = require('express');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

let items = [];

app.post('/api/items', (req, res) => {
  console.log("Received new item:", req.body);
  
  if (!req.body.name) {
    return res.status(400).json({ error: "Name is required" });
  }

  const newItem = { id: items.length + 1, name: req.body.name };
  items.push(newItem);
  
  res.status(201).json(newItem);
});

app.listen(3000, () => console.log('API Server running'));`
            }
        ],
        quiz: [
            {
                id: "q-crud-1",
                question: "Which built-in middleware parses incoming requests with JSON payloads and makes them available on req.body?",
                options: ["express.text()", "express.json()", "app.parseJSON()", "express.urlencoded()"],
                correct: 1
            }
        ]
    }
];

// --- State & Progress ---
let state = {
    activeModuleId: curriculum[0].id,
    activeLessonId: curriculum[0].lessons[0].id,
    activeTab: 'lesson',
    completedItems: [],
    quizAnswers: {}
};

// Load state from local storage
function loadProgress() {
    try {
        const saved = localStorage.getItem('expressHubProgress');
        if (saved) {
            state.completedItems = JSON.parse(saved);
        }
    } catch (e) {
        console.error("Failed to load progress", e);
    }
}

// Save state to local storage and update UI
function saveProgress() {
    try {
        localStorage.setItem('expressHubProgress', JSON.stringify(state.completedItems));
    } catch (e) {
        console.error("Failed to save progress", e);
    }
    updateProgressBar();
    renderSidebar(); 
}

function markItemComplete(id) {
    if (!state.completedItems.includes(id)) {
        state.completedItems.push(id);
        saveProgress();
    }
}

function updateProgressBar() {
    let totalItems = 0;
    curriculum.forEach(mod => {
        totalItems += mod.lessons.length;
        if (mod.quiz && mod.quiz.length > 0) totalItems += 1;
    });

    if (totalItems === 0) return;
    const progressPercent = Math.round((state.completedItems.length / totalItems) * 100);
    
    document.getElementById('progress-bar').style.width = \`\${progressPercent}%\`;
    document.getElementById('progress-text').innerText = \`\${progressPercent}%\`;
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
    tabSimulator: document.getElementById('tab-simulator'),
    tabQuiz: document.getElementById('tab-quiz'),
    
    codeEditor: document.getElementById('code-editor'),
    runServerBtn: document.getElementById('run-server-btn'),
    
    apiMethod: document.getElementById('api-method'),
    apiPath: document.getElementById('api-path'),
    sendRequestBtn: document.getElementById('send-request-btn'),
    reqBodyContainer: document.getElementById('request-body-container'),
    apiBody: document.getElementById('api-body'),
    apiResponse: document.getElementById('api-response'),
    responseStatus: document.getElementById('response-status'),
    serverOffOverlay: document.getElementById('server-off-overlay'),
    
    clearTerminalBtn: document.getElementById('clear-terminal-btn'),
    simulatedTerminal: document.getElementById('simulated-terminal')
};

// --- Initialization ---
function init() {
    loadProgress();
    updateProgressBar();
    
    setupEventListeners();
    
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
    DOM.tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetTab = btn.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    // API Client UI
    DOM.apiMethod.addEventListener('change', (e) => {
        if (e.target.value === 'POST') {
            DOM.reqBodyContainer.classList.remove('hidden');
        } else {
            DOM.reqBodyContainer.classList.add('hidden');
        }
    });

    // Simulator Controls
    DOM.runServerBtn.addEventListener('click', toggleServer);
    DOM.sendRequestBtn.addEventListener('click', sendMockRequest);
    DOM.clearTerminalBtn.addEventListener('click', () => {
        DOM.simulatedTerminal.innerHTML = '';
    });
    
    // Editor formatting
    DOM.codeEditor.addEventListener('keydown', function(e) {
        if (e.key == 'Tab') {
            e.preventDefault();
            var start = this.selectionStart;
            var end = this.selectionEnd;
            this.value = this.value.substring(0, start) + "  " + this.value.substring(end); 
            this.selectionStart = this.selectionEnd = start + 2;
        }
    });
}

function switchTab(tabId) {
    state.activeTab = tabId;
    
    DOM.tabBtns.forEach(btn => {
        if (btn.getAttribute('data-tab') === tabId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    DOM.tabContents.forEach(content => {
        content.classList.remove('active', 'flex', 'lg:flex');
    });

    const activeContent = document.getElementById(\`tab-\${tabId}\`);
    if (tabId === 'simulator') {
        activeContent.classList.add('active', 'flex', 'lg:flex-row');
    } else {
        activeContent.classList.add('active');
    }
}

function getActiveModule() {
    return curriculum.find(m => m.id === state.activeModuleId) || curriculum[0];
}

function getActiveLesson() {
    const mod = getActiveModule();
    return mod.lessons.find(l => l.id === state.activeLessonId) || mod.lessons[0];
}

function changeModule(moduleId) {
    const mod = curriculum.find(m => m.id === moduleId);
    if (mod) {
        state.activeModuleId = moduleId;
        state.activeLessonId = mod.lessons[0].id;
        
        // Stop server if running
        if (simState.isRunning) toggleServer();

        renderSidebar();
        renderActiveState();
        if(window.innerWidth < 1024) { 
            DOM.sidebar.classList.add('-translate-x-full');
            DOM.sidebarOverlay.classList.add('hidden');
        }
    }
}

// --- Rendering Functions ---

function renderSidebar() {
    DOM.moduleList.innerHTML = '';
    
    curriculum.forEach(mod => {
        const isActive = mod.id === state.activeModuleId;
        
        const allLessonsDone = mod.lessons.every(l => state.completedItems.includes(l.id));
        const quizDone = mod.quiz && mod.quiz.length > 0 ? state.completedItems.includes(\`\${mod.id}-quiz\`) : true;
        const isModuleComplete = allLessonsDone && quizDone;

        const li = document.createElement('li');
        
        const btn = document.createElement('button');
        btn.className = \`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left \${isActive ? 'bg-gray-200 text-gray-900 font-semibold border-l-4 border-gray-900' : 'hover:bg-gray-100 text-gray-700 border-l-4 border-transparent'}\`;
        btn.onclick = () => changeModule(mod.id);
        
        const textSpan = document.createElement('span');
        textSpan.className = 'truncate block';
        textSpan.innerText = mod.title;
        
        btn.appendChild(textSpan);
        
        if (isModuleComplete) {
            const checkIcon = document.createElement('i');
            checkIcon.className = 'fa-solid fa-check-circle text-gray-900';
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
    
    // Reset API Client UI
    DOM.apiResponse.innerText = '';
    DOM.responseStatus.innerText = 'Waiting...';
    DOM.responseStatus.className = 'text-gray-400 font-mono';
}

function renderLesson(lesson) {
    const isCompleted = state.completedItems.includes(lesson.id);
    
    DOM.tabLesson.innerHTML = \`
        <div class="max-w-3xl mx-auto animate-fade-in">
            <h2 class="text-3xl font-bold text-gray-900 mb-6">\${lesson.title}</h2>
            <div class="prose max-w-none text-gray-800">
                \${lesson.content}
            </div>
            
            <div class="mt-12 pt-6 border-t border-gray-200 flex justify-end">
                <button id="mark-lesson-complete" class="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 \${isCompleted ? 'bg-gray-200 text-gray-800 cursor-default' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'}">
                    \${isCompleted ? '<i class="fa-solid fa-check"></i> Completed' : 'Mark as Complete & Continue'}
                </button>
            </div>
        </div>
    \`;

    const btn = document.getElementById('mark-lesson-complete');
    if (!isCompleted) {
        btn.addEventListener('click', () => {
            markItemComplete(lesson.id);
            renderLesson(lesson); 
            switchTab('simulator'); 
        });
    }
}

function renderQuiz(mod) {
    const quizId = \`\${mod.id}-quiz\`;
    const isCompleted = state.completedItems.includes(quizId);
    
    if (!mod.quiz || mod.quiz.length === 0) {
        DOM.tabQuiz.innerHTML = '<div class="text-center text-gray-500 mt-10">No quiz available for this module.</div>';
        return;
    }

    let html = \`
        <div class="max-w-3xl mx-auto animate-fade-in pb-12">
            <div class="mb-8 border-b pb-4">
                <h2 class="text-3xl font-bold text-gray-900">Module Quiz</h2>
                \${isCompleted ? '<span class="inline-block mt-3 bg-gray-200 text-gray-900 px-3 py-1 rounded-full text-sm font-semibold"><i class="fa-solid fa-check mr-1"></i> Passed</span>' : ''}
            </div>
            <div id="quiz-questions-container" class="space-y-8">
    \`;

    mod.quiz.forEach((q, index) => {
        html += \`
            <div class="bg-white border rounded-xl p-6 shadow-sm">
                <h4 class="font-semibold text-lg text-gray-800 mb-4"><span class="text-blue-600 mr-2">\${index + 1}.</span>\${q.question}</h4>
                <div class="space-y-3">
        \`;
        
        q.options.forEach((opt, optIdx) => {
            const isSelected = state.quizAnswers[q.id] === optIdx;
            
            html += \`
                <label class="flex items-center p-4 border rounded-lg cursor-pointer transition-colors \${isSelected ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50 border-gray-200'}">
                    <input type="radio" name="quiz-\${q.id}" value="\${optIdx}" class="form-radio text-blue-600 h-5 w-5" \${isSelected ? 'checked' : ''} onchange="handleQuizSelection('\${q.id}', \${optIdx})">
                    <span class="ml-3 text-gray-700">\${opt}</span>
                </label>
            \`;
        });
        
        html += \`</div></div>\`;
    });

    html += \`
            </div>
            <div class="mt-8 flex flex-col items-center border-t pt-8">
                <button id="submit-quiz-btn" class="px-8 py-3 rounded-lg font-bold text-lg text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all">Submit Answers</button>
                <div id="quiz-feedback" class="mt-4 text-lg font-bold hidden"></div>
            </div>
        </div>
    \`;

    DOM.tabQuiz.innerHTML = html;

    document.getElementById('submit-quiz-btn').addEventListener('click', () => {
        let score = 0;
        let allAnswered = true;
        
        mod.quiz.forEach(q => {
            if (state.quizAnswers[q.id] === undefined) {
                allAnswered = false;
            } else if (state.quizAnswers[q.id] === q.correct) {
                score++;
            }
        });

        const feedback = document.getElementById('quiz-feedback');
        feedback.classList.remove('hidden', 'text-red-600', 'text-green-600');

        if (!allAnswered) {
            feedback.innerText = "Please answer all questions.";
            feedback.classList.add('text-red-600');
            return;
        }

        if (score === mod.quiz.length) {
            feedback.innerHTML = '<i class="fa-solid fa-party-horn"></i> Perfect! You passed.';
            feedback.classList.add('text-green-600');
            markItemComplete(quizId);
            renderSidebar(); 
        } else {
            feedback.innerText = \`You scored \${score} out of \${mod.quiz.length}. Try again!\`;
            feedback.classList.add('text-red-600');
        }
    });
}

window.handleQuizSelection = function(questionId, optionIndex) {
    state.quizAnswers[questionId] = optionIndex;
    renderQuiz(getActiveModule()); 
};

// --- Express API Simulator Engine (CRITICAL) ---

let simState = {
    isRunning: false,
    routes: [], // { method: 'GET', path: '/', handler: fn }
    middlewares: [], // { handler: fn, path?: '/' }
    originalConsole: {}
};

function printToTerminal(text, type = 'output') {
    const line = document.createElement('div');
    line.className = \`terminal-line\`;
    
    let colorClass = 'term-output';
    if (type === 'error') colorClass = 'term-error';
    if (type === 'warn') colorClass = 'term-warn';
    if (type === 'system') colorClass = 'term-system';
    if (type === 'req') colorClass = 'term-req';
    
    line.innerHTML = \`<span class="\${colorClass}">\${text}</span>\`;
    DOM.simulatedTerminal.appendChild(line);
    DOM.simulatedTerminal.scrollTop = DOM.simulatedTerminal.scrollHeight;
}

function formatOutput(args) {
    return Array.from(args).map(arg => {
        if (typeof arg === 'object') {
            try { return JSON.stringify(arg, null, 2); } 
            catch(e) { return '[Object]'; }
        }
        return String(arg);
    }).join(' ');
}

function toggleServer() {
    if (simState.isRunning) {
        // STOP SERVER
        simState.isRunning = false;
        
        // Restore console
        if (simState.originalConsole.log) {
            console.log = simState.originalConsole.log;
            console.error = simState.originalConsole.error;
            console.warn = simState.originalConsole.warn;
        }
        
        // Update UI
        DOM.runServerBtn.innerHTML = '<i class="fa-solid fa-play mr-1"></i> Start Server';
        DOM.runServerBtn.className = 'bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded shadow text-xs font-sans transition-colors font-semibold';
        DOM.serverOffOverlay.classList.remove('hidden');
        DOM.sendRequestBtn.disabled = true;
        printToTerminal('[SYSTEM]: Server stopped.', 'system');
        
    } else {
        // START SERVER
        const userCode = DOM.codeEditor.value;
        simState.routes = [];
        simState.middlewares = [];
        
        // Intercept console
        simState.originalConsole = { log: console.log, error: console.error, warn: console.warn };
        console.log = (...args) => printToTerminal(formatOutput(args), 'output');
        console.error = (...args) => printToTerminal(formatOutput(args), 'error');
        console.warn = (...args) => printToTerminal(formatOutput(args), 'warn');

        // Mock Express App
        const mockApp = {
            get: (path, handler) => simState.routes.push({ method: 'GET', path, handler }),
            post: (path, handler) => simState.routes.push({ method: 'POST', path, handler }),
            use: (pathOrMiddleware, middlewareObj) => {
                // Simplified use() for simulator
                if (typeof pathOrMiddleware === 'function') {
                    simState.middlewares.push({ handler: pathOrMiddleware, path: '*' });
                } else if (typeof middlewareObj === 'function') {
                    simState.middlewares.push({ handler: middlewareObj, path: pathOrMiddleware });
                } else if (pathOrMiddleware && pathOrMiddleware.isParser) {
                    // It's our fake express.json()
                    simState.middlewares.push({ handler: pathOrMiddleware, path: '*' });
                }
            },
            listen: (port, cb) => {
                if (cb) cb();
            }
        };

        // Mock Express Module
        const mockExpress = function() { return mockApp; };
        mockExpress.json = () => {
            const parser = (req, res, next) => next();
            parser.isParser = true; // flag to identify it
            return parser;
        };
        
        const mockRequire = function(moduleName) {
            if (moduleName === 'express') return mockExpress;
            return {};
        };

        // Execute User Code
        try {
            printToTerminal(\`> node app.js\`, 'term-prompt');
            const executeNode = new Function('require', 'console', userCode);
            executeNode(mockRequire, console);
            
            simState.isRunning = true;
            
            // Update UI
            DOM.runServerBtn.innerHTML = '<i class="fa-solid fa-stop mr-1"></i> Stop Server';
            DOM.runServerBtn.className = 'bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded shadow text-xs font-sans transition-colors font-semibold';
            DOM.serverOffOverlay.classList.add('hidden');
            DOM.sendRequestBtn.disabled = false;
            
        } catch (e) {
            console.error("Runtime Exception:", e.message);
            // Revert on error
            console.log = simState.originalConsole.log;
            console.error = simState.originalConsole.error;
            console.warn = simState.originalConsole.warn;
        }
    }
}

function sendMockRequest() {
    if (!simState.isRunning) return;
    
    const method = DOM.apiMethod.value;
    const path = DOM.apiPath.value;
    const bodyStr = DOM.apiBody.value || "{}";
    
    DOM.responseStatus.innerText = 'Pending...';
    DOM.responseStatus.className = 'text-yellow-500 font-mono font-bold';
    DOM.apiResponse.innerText = '';
    
    printToTerminal(\`\n[REQ]: Client sending \${method} request to \${path}\`, 'req');

    // Parse Body
    let parsedBody = {};
    if (method === 'POST') {
        try {
            parsedBody = JSON.parse(bodyStr);
        } catch (e) {
            DOM.responseStatus.innerText = '400 Bad Request (Invalid JSON)';
            DOM.responseStatus.className = 'text-red-500 font-mono font-bold';
            DOM.apiResponse.innerText = e.message;
            return;
        }
    }

    // Fake Request Object
    const req = {
        method: method,
        url: path,
        body: parsedBody,
        params: {} // Simplified for simulator
    };
    
    // Fake Response Object
    let isResponded = false;
    let statusCode = 200;
    
    const res = {
        status: function(code) {
            statusCode = code;
            return this;
        },
        json: function(data) {
            if(isResponded) return;
            isResponded = true;
            DOM.responseStatus.innerText = \`\${statusCode} OK\`;
            DOM.responseStatus.className = statusCode >= 400 ? 'text-red-500 font-mono font-bold' : 'text-green-500 font-mono font-bold';
            DOM.apiResponse.innerText = JSON.stringify(data, null, 2);
        },
        send: function(data) {
            if(isResponded) return;
            isResponded = true;
            DOM.responseStatus.innerText = \`\${statusCode} OK\`;
            DOM.responseStatus.className = statusCode >= 400 ? 'text-red-500 font-mono font-bold' : 'text-green-500 font-mono font-bold';
            DOM.apiResponse.innerText = String(data);
        }
    };

    // Execute Middleware Chain
    let middlewareIndex = 0;
    
    function next() {
        if (middlewareIndex < simState.middlewares.length) {
            const mw = simState.middlewares[middlewareIndex++];
            // Simplistic path matching for middleware
            if (mw.path === '*' || mw.path === req.url) {
                if (mw.handler.isParser) {
                    // built in json parser does nothing in mock since we already parsed body
                    next();
                } else {
                    try {
                        mw.handler(req, res, next);
                    } catch (e) {
                        console.error("Middleware Error:", e.message);
                        res.status(500).send("Internal Server Error");
                    }
                }
            } else {
                next();
            }
        } else {
            // After middlewares, find matching route
            const route = simState.routes.find(r => r.method === method && r.path === path);
            if (route) {
                try {
                    route.handler(req, res);
                } catch (e) {
                    console.error("Route Handler Error:", e.message);
                    if (!isResponded) res.status(500).send("Internal Server Error");
                }
            } else {
                if (!isResponded) res.status(404).send(\`Cannot \${method} \${path}\`);
            }
        }
    }
    
    // Start chain
    next();
}

// Start application
init();
