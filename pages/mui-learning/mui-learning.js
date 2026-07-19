// --- State & Progress ---
let state = {
  activeModuleId: curriculum[0].id,
  activeLessonId: curriculum[0].lessons[0].id,
  activeTab: 'lesson',
  completedItems: [],
  quizAnswers: {},
};

function loadProgress() {
  try {
    const saved = localStorage.getItem('muiHubProgress');
    if (saved) state.completedItems = JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load progress', e);
  }
}

function saveProgress() {
  try {
    localStorage.setItem('muiHubProgress', JSON.stringify(state.completedItems));
  } catch (e) {
    console.error('Failed to save progress', e);
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
  curriculum.forEach((mod) => {
    totalItems += mod.lessons.length;
    if (mod.quiz && mod.quiz.length > 0) totalItems += 1;
  });
  if (totalItems === 0) return;
  const pct = Math.round((state.completedItems.length / totalItems) * 100);
  document.getElementById('progress-bar').style.width = `${pct}%`;
  document.getElementById('progress-text').innerText = `${pct}%`;
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
  setupEventListeners();
  renderSidebar();
  renderActiveState();
}

function setupEventListeners() {
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

  DOM.tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
  });

  DOM.runCodeBtn.addEventListener('click', runCode);

  DOM.codeEditor.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') {
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
  DOM.tabBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  DOM.tabContents.forEach((content) => {
    content.classList.remove('active', 'flex', 'md:flex');
  });
  const activeContent = document.getElementById(`tab-${tabId}`);
  if (tabId === 'playground') {
    activeContent.classList.add('active', 'flex', 'md:flex-row');
    runCode();
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
    renderSidebar();
    renderActiveState();
    if (window.innerWidth < 1024) {
      DOM.sidebar.classList.add('-translate-x-full');
      DOM.sidebarOverlay.classList.add('hidden');
    }
  }
}

// --- Rendering ---

function renderSidebar() {
  DOM.moduleList.innerHTML = '';
  curriculum.forEach((mod) => {
    const isActive = mod.id === state.activeModuleId;
    const allLessonsDone = mod.lessons.every((l) => state.completedItems.includes(l.id));
    const quizDone = mod.quiz && mod.quiz.length > 0 ? state.completedItems.includes(`${mod.id}-quiz`) : true;
    const isModuleComplete = allLessonsDone && quizDone;

    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = `w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${isActive ? 'bg-blue-100 text-blue-800 font-semibold border-l-4 border-blue-600' : 'hover:bg-gray-100 text-gray-700 border-l-4 border-transparent'}`;
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
  if (state.activeTab === 'playground') runCode();
}

function renderLesson(lesson) {
  const isCompleted = state.completedItems.includes(lesson.id);

  // ELI5 content lookup
  const eli5Data = (window.eli5MuiData || {})[lesson.id] || '';

  // Learning objectives
  const objectivesHtml = lesson.objectives
    ? `<div class="mb-6 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-xl p-5">
        <h4 class="text-sm font-bold text-sky-800 mb-3 flex items-center gap-2"><i class="fa-solid fa-bullseye text-sky-500"></i> Learning Objectives</h4>
        <ul class="space-y-2">${lesson.objectives.map(o => `<li class="text-sm text-sky-700 flex items-start gap-2"><i class="fa-solid fa-check-circle text-sky-400 mt-0.5 text-xs"></i>${o}</li>`).join('')}</ul>
       </div>`
    : '';

  // Key takeaways
  const takeawaysHtml = lesson.takeaways
    ? `<div class="mt-8 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-5">
        <h4 class="text-sm font-bold text-teal-800 mb-3 flex items-center gap-2"><i class="fa-solid fa-gem text-teal-500"></i> Key Takeaways</h4>
        <ul class="space-y-2">${lesson.takeaways.map(t => `<li class="text-sm text-teal-700 flex items-start gap-2"><i class="fa-solid fa-lightbulb text-teal-400 mt-0.5 text-xs"></i>${t}</li>`).join('')}</ul>
       </div>`
    : '';

  DOM.tabLesson.innerHTML = `
    <div class="max-w-3xl mx-auto animate-fade-in">
      <h2 class="text-3xl font-bold text-gray-900 mb-6">${lesson.title}</h2>
      ${objectivesHtml}
      <div class="prose max-w-none text-gray-800">
        ${(window.eli5Toggle ? window.eli5Toggle.wrapContent(lesson.content, eli5Data) : lesson.content)}
      </div>
      ${takeawaysHtml}
      <div class="mt-12 pt-6 border-t border-gray-200 flex justify-end">
        <button id="mark-lesson-complete" class="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${isCompleted ? 'bg-green-100 text-green-700 cursor-default' : 'bg-[#007fff] text-white hover:bg-blue-600 shadow-md'}">
          ${isCompleted ? '<i class="fa-solid fa-check"></i> Completed' : 'Mark as Complete & Continue'}
        </button>
      </div>
    </div>
  `;

  if (window.eli5Toggle) {
    window.eli5Toggle.initToggle('mui', DOM.tabLesson);
  }

  const btn = document.getElementById('mark-lesson-complete');
  if (!isCompleted) {
    btn.addEventListener('click', () => {
      markItemComplete(lesson.id);
      renderLesson(lesson);
      switchTab('playground');
    });
  }
}

function renderQuiz(mod) {
  const quizId = `${mod.id}-quiz`;
  const isCompleted = state.completedItems.includes(quizId);

  if (!mod.quiz || mod.quiz.length === 0) {
    DOM.tabQuiz.innerHTML = '<div class="text-center text-gray-500 mt-10">No quiz available for this module.</div>';
    return;
  }

  let html = `
    <div class="max-w-3xl mx-auto animate-fade-in pb-12">
      <div class="mb-8 border-b pb-4">
        <h2 class="text-3xl font-bold text-gray-900">Module Quiz</h2>
        <p class="text-gray-500 mt-1">${mod.quiz.length} questions</p>
        ${isCompleted ? '<span class="inline-block mt-3 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold"><i class="fa-solid fa-check mr-1"></i> Passed</span>' : ''}
      </div>
      <div id="quiz-questions-container" class="space-y-8">
  `;

  mod.quiz.forEach((q, index) => {
    html += `
      <div class="bg-white border rounded-xl p-6 shadow-sm">
        <h4 class="font-semibold text-lg text-gray-800 mb-4"><span class="text-[#007fff] mr-2">${index + 1}.</span>${q.question}</h4>
        <div class="space-y-3">
    `;
    q.options.forEach((opt, optIdx) => {
      const isSelected = state.quizAnswers[q.id] === optIdx;
      html += `
        <label class="flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50 border-gray-200'}">
          <input type="radio" name="quiz-${q.id}" value="${optIdx}" class="form-radio text-blue-600 h-5 w-5" ${isSelected ? 'checked' : ''} onchange="handleQuizSelection('${q.id}', ${optIdx})">
          <span class="ml-3 text-gray-700">${opt}</span>
        </label>
      `;
    });
    html += `</div></div>`;
  });

  html += `
      </div>
      <div class="mt-8 flex flex-col items-center border-t pt-8">
        <button id="submit-quiz-btn" class="px-8 py-3 rounded-lg font-bold text-lg text-white bg-[#007fff] hover:bg-blue-600 shadow-md transition-all">Submit Answers</button>
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

// --- Playground Engine ---
function runCode() {
  const userCode = DOM.codeEditor.value;
  const iframeContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="initial-scale=1, width=device-width" />
      <title>MUI Preview</title>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
      <script crossorigin src="https://cdn.jsdelivr.net/npm/react@18/umd/react.development.js"></script>
      <script crossorigin src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.development.js"></script>
      <script crossorigin src="https://cdn.jsdelivr.net/npm/@mui/material@5/umd/material-ui.development.js"></script>
      <script crossorigin src="https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js"></script>
      <style>
        body { margin: 0; padding: 0; background-color: #ffffff; }
        #error-container { color: #d32f2f; background: #fde0dc; padding: 10px; margin: 10px; border-radius: 4px; font-family: monospace; white-space: pre-wrap; display: none; }
      </style>
    </head>
    <body>
      <div id="error-container"></div>
      <div id="root"></div>
      <script type="text/babel">
        try {
          const {
            Button, Card, CardActions, CardContent, Typography,
            Paper, Stack, Grid, Box, Container, AppBar, Toolbar,
            IconButton, Drawer, List, ListItem, ListItemButton,
            ListItemIcon, ListItemText, Divider, Avatar, Badge,
            Chip, Tooltip, TextField, FormControl, InputLabel,
            Select, MenuItem, Checkbox, FormControlLabel, Radio,
            RadioGroup, Switch, Autocomplete, Alert, Snackbar,
            Dialog, DialogTitle, DialogContent, DialogContentText,
            DialogActions, LinearProgress, CircularProgress,
            Breadcrumbs, Link, Menu, Fab, SpeedDial, SpeedDialAction,
            ThemeProvider, CssBaseline, createTheme, GlobalStyles,
            DataGrid
          } = MaterialUI;

          ${userCode}
        } catch(e) {
          const errDiv = document.getElementById('error-container');
          errDiv.style.display = 'block';
          errDiv.innerText = "Compilation Error:\\n" + e.message;
        }
      </script>
    </body>
    </html>
  `;
  DOM.previewFrame.srcdoc = iframeContent;
}

init();
