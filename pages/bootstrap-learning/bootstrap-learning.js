// --- Curriculum Data ---
const curriculum = [
  {
    id: 'grid-system',
    title: 'Grid System',
    lessons: [
      {
        id: 'grid-1',
        title: 'Introduction to the Grid',
        content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Bootstrap Grid System</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Bootstrap's grid system uses a series of containers, rows, and columns to layout and align content. It's built with flexbox and is fully responsive.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">The grid is based on a 12-column layout. You can group columns together to create wider columns.</p>
                    <div class="bg-purple-50 border-l-4 border-purple-500 p-4 my-6 rounded-r-lg">
                        <p class="text-purple-800 font-medium">Head over to the Interactive Playground tab to experiment with rows and columns!</p>
                    </div>
                `,
        defaultCode: `<div class="container mt-4">\n  <div class="row">\n    <div class="col-sm-8 bg-primary text-white p-3 border">\n      col-sm-8\n    </div>\n    <div class="col-sm-4 bg-secondary text-white p-3 border">\n      col-sm-4\n    </div>\n  </div>\n  <div class="row mt-3">\n    <div class="col-sm bg-success text-white p-3 border">\n      col-sm (Auto-width)\n    </div>\n    <div class="col-sm bg-info text-white p-3 border">\n      col-sm (Auto-width)\n    </div>\n    <div class="col-sm bg-warning text-dark p-3 border">\n      col-sm (Auto-width)\n    </div>\n  </div>\n</div>`,
      },
    ],
    quiz: [
      {
        id: 'q-grid-1',
        question: 'How many columns does the Bootstrap grid system have by default?',
        options: ['6', '10', '12', '16'],
        correct: 2,
      },
      {
        id: 'q-grid-2',
        question: 'What CSS technology is the Bootstrap grid built with?',
        options: ['CSS Grid', 'Flexbox', 'Floats', 'Tables'],
        correct: 1,
      },
    ],
  },
  {
    id: 'components',
    title: 'Components (Cards & Buttons)',
    lessons: [
      {
        id: 'comp-1',
        title: 'Cards and Buttons',
        content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Styling with Components</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Bootstrap provides a variety of pre-styled components. Cards provide a flexible and extensible content container with multiple variants and options.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Buttons in Bootstrap are styled using the <code>.btn</code> class, followed by a contextual color class like <code>.btn-primary</code>.</p>
                `,
        defaultCode: `<div class="container mt-4">\n  <div class="card" style="width: 18rem;">\n    <img src="https://via.placeholder.com/286x180" class="card-img-top" alt="Placeholder">\n    <div class="card-body">\n      <h5 class="card-title">Card title</h5>\n      <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>\n      <a href="#" class="btn btn-primary">Go somewhere</a>\n      <button type="button" class="btn btn-outline-secondary mt-2">Secondary Action</button>\n    </div>\n  </div>\n</div>`,
      },
    ],
    quiz: [
      {
        id: 'q-comp-1',
        question: 'Which class is used to style a primary button in Bootstrap?',
        options: ['.button-primary', '.btn-primary', '.primary-btn', '.btn-blue'],
        correct: 1,
      },
    ],
  },
  {
    id: 'interactive',
    title: 'Interactive (Modals)',
    lessons: [
      {
        id: 'modals-1',
        title: 'Using Modals',
        content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Modals in Bootstrap</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Modals are built with HTML, CSS, and JavaScript. They're positioned over everything else in the document and remove scroll from the <code>&lt;body&gt;</code> so that modal content scrolls instead.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">You can trigger modals using data attributes like <code>data-bs-toggle="modal"</code> without writing custom JavaScript.</p>
                `,
        defaultCode: `<div class="container mt-4">\n  <!-- Button trigger modal -->\n  <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal">\n    Launch demo modal\n  </button>\n\n  <!-- Modal -->\n  <div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">\n    <div class="modal-dialog">\n      <div class="modal-content">\n        <div class="modal-header">\n          <h5 class="modal-title" id="exampleModalLabel">Modal title</h5>\n          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>\n        </div>\n        <div class="modal-body">\n          Woohoo, you're reading this text in a modal!\n        </div>\n        <div class="modal-footer">\n          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>\n          <button type="button" class="btn btn-primary">Save changes</button>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>`,
      },
    ],
    quiz: [
      {
        id: 'q-modals-1',
        question:
          'Which data attribute is used to trigger a modal without custom JavaScript in Bootstrap 5?',
        options: ['data-toggle', 'data-modal', 'data-bs-toggle', 'aria-expanded'],
        correct: 2,
      },
    ],
  },
];

// --- State & Progress ---
let state = {
  activeModuleId: curriculum[0].id,
  activeLessonId: curriculum[0].lessons[0].id,
  activeTab: 'lesson', // lesson, playground, quiz
  completedItems: [], // array of lesson/quiz IDs
  quizAnswers: {}, // format: { 'q-grid-1': 1 }
};

// Load state from local storage
function loadProgress() {
  try {
    const saved = localStorage.getItem('bootstrapHubProgress');
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
    localStorage.setItem('bootstrapHubProgress', JSON.stringify(state.completedItems));
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
  previewFrame: document.getElementById('preview-frame'),
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

  // Run code
  DOM.runCodeBtn.addEventListener('click', runCode);

  // Allow basic tab indentation in textarea
  DOM.codeEditor.addEventListener('keydown', function (e) {
    if (e.key == 'Tab') {
      e.preventDefault();
      var start = this.selectionStart;
      var end = this.selectionEnd;
      this.value = this.value.substring(0, start) + '  ' + this.value.substring(end);
      this.selectionStart = this.selectionEnd = start + 2;
    }
  });
}

function switchTab(tabId) {
  state.activeTab = tabId;

  // Update button styling
  DOM.tabBtns.forEach((btn) => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Update content visibility
  DOM.tabContents.forEach((content) => {
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
    state.activeLessonId = mod.lessons[0].id; // Reset to first lesson
    renderSidebar();
    renderActiveState();
    if (window.innerWidth < 1024) {
      // Close sidebar on mobile after selection
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

    // Check completion status
    const allLessonsDone = mod.lessons.every((l) => state.completedItems.includes(l.id));
    const quizDone =
      mod.quiz && mod.quiz.length > 0 ? state.completedItems.includes(`${mod.id}-quiz`) : true;
    const isModuleComplete = allLessonsDone && quizDone;

    const li = document.createElement('li');

    const btn = document.createElement('button');
    btn.className = `w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${isActive ? 'bg-purple-100 text-purple-800 font-semibold border-l-4 border-purple-600' : 'hover:bg-gray-100 text-gray-700 border-l-4 border-transparent'}`;
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
                <button id="mark-lesson-complete" class="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${isCompleted ? 'bg-green-100 text-green-700 cursor-default' : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md'}">
                    ${isCompleted ? '<i class="fa-solid fa-check"></i> Completed' : 'Mark as Complete & Continue'}
                </button>
            </div>
        </div>
    `;

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
                <h4 class="font-semibold text-lg text-gray-800 mb-4"><span class="text-purple-600 mr-2">${index + 1}.</span>${q.question}</h4>
                <div class="space-y-3">
        `;

    q.options.forEach((opt, optIdx) => {
      const isSelected = state.quizAnswers[q.id] === optIdx;

      html += `
                <label class="flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-purple-50 border-purple-500' : 'hover:bg-gray-50 border-gray-200'}">
                    <input type="radio" name="quiz-${q.id}" value="${optIdx}" class="form-radio text-purple-600 h-5 w-5" ${isSelected ? 'checked' : ''} onchange="handleQuizSelection('${q.id}', ${optIdx})">
                    <span class="ml-3 text-gray-700">${opt}</span>
                </label>
            `;
    });

    html += `</div></div>`;
  });

  html += `
            </div>
            <div class="mt-8 flex flex-col items-center border-t pt-8">
                <button id="submit-quiz-btn" class="px-8 py-3 rounded-lg font-bold text-lg text-white bg-purple-600 hover:bg-purple-700 shadow-md transition-all">Submit Answers</button>
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
      renderSidebar(); // update checks
    } else {
      feedback.innerText = `You scored ${score} out of ${mod.quiz.length}. Try again!`;
      feedback.classList.add('text-red-600');
    }
  });
}

// Global exposure for inline event handlers in quiz HTML
window.handleQuizSelection = function (questionId, optionIndex) {
  state.quizAnswers[questionId] = optionIndex;
  renderQuiz(getActiveModule()); // Re-render to show selection styling
};

// --- Bootstrap Playground Engine (CRITICAL) ---

function runCode() {
  const userCode = DOM.codeEditor.value;

  // Construct the HTML document to be injected into the iframe
  const iframeContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Bootstrap Preview</title>
            
            <!-- CRITICAL: Official Bootstrap 5 CSS CDN -->
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
            
            <style>
                /* Minor styling for the preview container itself */
                body { background-color: #ffffff; padding: 15px; }
            </style>
        </head>
        <body>
            <!-- Injected User Code -->
            ${userCode}
            
            <!-- CRITICAL: Official Bootstrap 5 JS Bundle CDN (includes Popper) -->
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmxc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
        </body>
        </html>
    `;

  // Inject via srcdoc
  DOM.previewFrame.srcdoc = iframeContent;
}

// Start application
init();
