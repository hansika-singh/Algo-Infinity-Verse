// --- Curriculum Data ---
const curriculum = [
    {
        id: "jsx",
        title: "JSX & Components",
        lessons: [
            {
                id: "jsx-1",
                title: "Introduction to JSX",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">What is JSX?</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">JSX is a syntax extension for JavaScript. It looks like HTML, but it's actually JavaScript under the hood. React uses JSX to describe what the UI should look like.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">JSX produces React "elements". You can put any valid JavaScript expression inside curly braces in JSX.</p>
                    <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
                        <p class="text-blue-800 font-medium">Head over to the Interactive Playground tab to try rendering a simple component!</p>
                    </div>
                `,
                defaultCode: `function App() {\n  const name = "React Developer";\n  return (\n    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>\n      <h1 style={{ color: '#2563eb' }}>Hello, {name}!</h1>\n      <p>Welcome to the Interactive Playground.</p>\n    </div>\n  );\n}\n\n// Mount the app to the DOM natively\nReactDOM.render(<App />, document.getElementById('root'));`
            }
        ],
        quiz: [
            {
                id: "q-jsx-1",
                question: "What does JSX get compiled into?",
                options: ["HTML strings", "React.createElement() calls", "Machine Code", "CSS styles"],
                correct: 1
            },
            {
                id: "q-jsx-2",
                question: "How do you embed a JavaScript expression inside JSX?",
                options: ["Using quotes ''", "Using parentheses ()", "Using curly braces {}", "Using square brackets []"],
                correct: 2
            }
        ]
    },
    {
        id: "props-state",
        title: "Props & State",
        lessons: [
            {
                id: "ps-1",
                title: "Understanding State",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">State in React</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">State allows React components to change their output over time in response to user actions, network responses, and anything else.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">While props are passed to a component (like function parameters), state is managed within the component (like variables declared within a function).</p>
                `,
                defaultCode: `function Counter() {\n  // React.useState returns the current state and a function to update it\n  const [count, setCount] = React.useState(0);\n\n  return (\n    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>\n      <h2>Count: {count}</h2>\n      <button \n        onClick={() => setCount(count + 1)}\n        style={{ \n          padding: '10px 20px', \n          background: '#2563eb', \n          color: 'white', \n          border: 'none', \n          borderRadius: '5px',\n          cursor: 'pointer'\n        }}\n      >\n        Increment\n      </button>\n    </div>\n  );\n}\n\nReactDOM.render(<Counter />, document.getElementById('root'));`
            }
        ],
        quiz: [
            {
                id: "q-ps-1",
                question: "Can props be modified by the receiving component?",
                options: ["Yes, freely", "No, they are read-only", "Only if it is an object"],
                correct: 1
            }
        ]
    },
    {
        id: "hooks",
        title: "Hooks",
        lessons: [
            {
                id: "hooks-1",
                title: "The useEffect Hook",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Side Effects</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">The Effect Hook lets you perform side effects in function components. Data fetching, setting up a subscription, and manually changing the DOM in React components are all examples of side effects.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">By default, React runs the effects after every render, including the first render.</p>
                `,
                defaultCode: `function Clock() {\n  const [time, setTime] = React.useState(new Date().toLocaleTimeString());\n\n  React.useEffect(() => {\n    // This sets up the timer when the component mounts\n    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);\n    \n    // This cleans up the timer when the component unmounts\n    return () => clearInterval(timer);\n  }, []); // Empty dependency array means this runs once on mount\n\n  return (\n    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'monospace' }}>\n      <h1 style={{ fontSize: '3rem', color: '#374151' }}>{time}</h1>\n    </div>\n  );\n}\n\nReactDOM.render(<Clock />, document.getElementById('root'));`
            }
        ],
        quiz: [
            {
                id: "q-hooks-1",
                question: "Where must hooks be called?",
                options: ["Inside loops and conditions", "At the top level of a React component", "Inside regular JavaScript functions"],
                correct: 1
            }
        ]
    }
];

// --- State & Progress ---
let state = {
    activeModuleId: curriculum[0].id,
    activeLessonId: curriculum[0].lessons[0].id,
    activeTab: 'lesson', // lesson, playground, quiz
    completedItems: [], // array of lesson/quiz IDs
    quizAnswers: {} // format: { 'q-jsx-1': 1 }
};

// Load state from local storage
function loadProgress() {
    try {
        const saved = localStorage.getItem('reactMasteryProgress');
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
        localStorage.setItem('reactMasteryProgress', JSON.stringify(state.completedItems));
    } catch (e) {
        console.error("Failed to save progress", e);
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
    curriculum.forEach(mod => {
        totalItems += mod.lessons.length;
        if (mod.quiz && mod.quiz.length > 0) totalItems += 1; // 1 quiz per module
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
    tabPlayground: document.getElementById('tab-playground'),
    tabQuiz: document.getElementById('tab-quiz'),
    codeEditor: document.getElementById('code-editor'),
    runCodeBtn: document.getElementById('run-code-btn'),
    previewFrame: document.getElementById('preview-frame')
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
    DOM.tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetTab = btn.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });

    // Run code
    DOM.runCodeBtn.addEventListener('click', runCode);
    
    // Allow basic tab indentation in textarea
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
    
    // Update button styling
    DOM.tabBtns.forEach(btn => {
        if (btn.getAttribute('data-tab') === tabId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update content visibility
    DOM.tabContents.forEach(content => {
        content.classList.remove('active', 'flex', 'md:flex');
    });

    const activeContent = document.getElementById(`tab-${tabId}`);
    if (tabId === 'playground') {
        activeContent.classList.add('active', 'flex', 'md:flex-row'); // specific display flex for split pane
        // Auto-run if iframe is empty
        if (!DOM.previewFrame.srcdoc) {
            runCode();
        }
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
        state.activeLessonId = mod.lessons[0].id; // Reset to first lesson
        renderSidebar();
        renderActiveState();
        if(window.innerWidth < 1024) { // Close sidebar on mobile after selection
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
        
        // Check completion status
        const allLessonsDone = mod.lessons.every(l => state.completedItems.includes(l.id));
        const quizDone = mod.quiz && mod.quiz.length > 0 ? state.completedItems.includes(`${mod.id}-quiz`) : true;
        const isModuleComplete = allLessonsDone && quizDone;

        const li = document.createElement('li');
        
        const btn = document.createElement('button');
        btn.className = \`w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left \${isActive ? 'bg-blue-100 text-blue-800 font-semibold border-l-4 border-blue-600' : 'hover:bg-gray-100 text-gray-700 border-l-4 border-transparent'}\`;
        btn.onclick = () => changeModule(mod.id);
        
        const textSpan = document.createElement('span');
        textSpan.className = 'truncate block';
        textSpan.innerText = mod.title;
        
        btn.appendChild(textSpan);
        
        if (isModuleComplete) {
            const checkIcon = document.createElement('i');
            checkIcon.className = 'fa-solid fa-check-circle text-green-500';
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
    
    // Set default code for playground if transitioning
    if (DOM.codeEditor.value === '' || true) { // Might want to save user's code, but for simplicity override on module switch
        DOM.codeEditor.value = lesson.defaultCode;
    }
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
                <button id="mark-lesson-complete" class="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 \${isCompleted ? 'bg-green-100 text-green-700 cursor-default' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'}">
                    \${isCompleted ? '<i class="fa-solid fa-check"></i> Completed' : 'Mark as Complete & Continue'}
                </button>
            </div>
        </div>
    \`;

    const btn = document.getElementById('mark-lesson-complete');
    if (!isCompleted) {
        btn.addEventListener('click', () => {
            markItemComplete(lesson.id);
            renderLesson(lesson); // Re-render to show completion state
            switchTab('playground'); // Auto-switch to next logical step
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
                \${isCompleted ? '<span class="inline-block mt-3 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold"><i class="fa-solid fa-check mr-1"></i> Passed</span>' : ''}
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
            renderSidebar(); // update checks
        } else {
            feedback.innerText = \`You scored \${score} out of \${mod.quiz.length}. Try again!\`;
            feedback.classList.add('text-red-600');
        }
    });
}

// Global exposure for inline event handlers in quiz HTML
window.handleQuizSelection = function(questionId, optionIndex) {
    state.quizAnswers[questionId] = optionIndex;
    renderQuiz(getActiveModule()); // Re-render to show selection styling
};

// --- React Playground Engine (CRITICAL) ---

function runCode() {
    const userCode = DOM.codeEditor.value;
    
    // Construct the HTML document to be injected into the iframe
    const iframeContent = \`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { margin: 0; padding: 0; font-family: sans-serif; background-color: #ffffff; color: #333;}
                #error-boundary { color: #dc2626; background: #fee2e2; padding: 15px; border-radius: 5px; margin: 10px; font-family: monospace; white-space: pre-wrap;}
            </style>
            
            <!-- CRITICAL: React CDN -->
            <script crossorigin src="https://unpkg.com/react@17/umd/react.development.js"><\/script>
            <script crossorigin src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"><\/script>
            
            <!-- CRITICAL: Babel standalone for in-browser JSX transformation -->
            <script crossorigin src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
        </head>
        <body>
            <div id="root"></div>
            <div id="error-container"></div>
            
            <script>
                // Intercept console errors to display them in the iframe
                window.onerror = function(msg, url, lineNo, columnNo, error) {
                    const errContainer = document.getElementById('error-container');
                    errContainer.innerHTML = '<div id="error-boundary"><strong>Runtime Error:</strong><br/>' + msg + '</div>';
                    return false;
                };
            <\/script>

            <!-- User injected code wrapped in Babel script -->
            <script type="text/babel">
                try {
                    \${userCode}
                } catch(e) {
                    document.getElementById('error-container').innerHTML = '<div id="error-boundary"><strong>Compilation Error:</strong><br/>' + e.message + '</div>';
                }
            <\/script>
        </body>
        </html>
    \`;

    // Inject via srcdoc
    DOM.previewFrame.srcdoc = iframeContent;
}

// Start application
init();
