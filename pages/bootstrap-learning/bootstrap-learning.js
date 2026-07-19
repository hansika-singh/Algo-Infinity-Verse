// Curriculum is loaded from bootstrap-bootCurriculum.js as window.bootstrapCurriculum
const bootCurriculum = window.bootstrapCurriculum || [];

// --- State & Progress ---
let state = {
  activeModuleId: bootCurriculum[0].id,
  activeLessonId: bootCurriculum[0].lessons[0].id,
  activeTab: 'lesson',
  completedItems: [],
  quizAnswers: {},
};

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

function saveProgress() {
  try {
    localStorage.setItem('bootstrapHubProgress', JSON.stringify(state.completedItems));
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
  bootCurriculum.forEach((mod) => {
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
  tabPlayground: document.getElementById('tab-playground'),
  tabQuiz: document.getElementById('tab-quiz'),
  codeEditor: document.getElementById('code-editor'),
  runCodeBtn: document.getElementById('run-code-btn'),
  previewFrame: document.getElementById('preview-frame'),
};

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
    btn.addEventListener('click', () => {
      switchTab(btn.getAttribute('data-tab'));
    });
  });
  DOM.runCodeBtn.addEventListener('click', runCode);
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
  DOM.tabBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  DOM.tabContents.forEach((content) => {
    content.classList.remove('active', 'flex', 'md:flex');
  });
  const activeContent = document.getElementById(`tab-${tabId}`);
  if (tabId === 'playground') {
    activeContent.classList.add('active', 'flex', 'md:flex-row');
    if (!DOM.previewFrame.srcdoc) {
      runCode();
    }
  } else {
    activeContent.classList.add('active');
  }
}

function getActiveModule() {
  return bootCurriculum.find((m) => m.id === state.activeModuleId) || bootCurriculum[0];
}

function getActiveLesson() {
  const mod = getActiveModule();
  return mod.lessons.find((l) => l.id === state.activeLessonId) || mod.lessons[0];
}

function changeModule(moduleId) {
  const mod = bootCurriculum.find((m) => m.id === moduleId);
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

// --- Rendering Functions ---

function renderSidebar() {
  DOM.moduleList.innerHTML = '';
  bootCurriculum.forEach((mod) => {
    const isActive = mod.id === state.activeModuleId;
    const allLessonsDone = mod.lessons.every((l) => state.completedItems.includes(l.id));
    const quizDone = mod.quiz && mod.quiz.length > 0 ? state.completedItems.includes(`${mod.id}-quiz`) : true;
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

function getLessonIndex(mod, lessonId) {
  return mod.lessons.findIndex(l => l.id === lessonId);
}

function navigateToLesson(moduleId, lessonId) {
  state.activeModuleId = moduleId;
  state.activeLessonId = lessonId;
  renderSidebar();
  renderActiveState();
}

function renderLesson(lesson) {
  const isCompleted = state.completedItems.includes(lesson.id);
  const eli5 = window.eli5Toggle;
  const mod = getActiveModule();
  const lessonIdx = getLessonIndex(mod, lesson.id);
  const totalLessons = mod.lessons.length;
  const hasNext = lessonIdx < totalLessons - 1;
  const hasPrev = lessonIdx > 0;
  const simpleContent = window.eli5BootstrapData && lesson.id ? (window.eli5BootstrapData[lesson.id] || '') : '';

  const lessonNavHTML = totalLessons > 1 ? `<div class="flex items-center gap-2 mb-6 flex-wrap">
    ${mod.lessons.map((l, i) => `
      <button class="lesson-dot px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${l.id === lesson.id ? 'bg-purple-600 text-white shadow-sm' : state.completedItems.includes(l.id) ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}" onclick="navigateToLesson('${mod.id}', '${l.id}')">
        ${i + 1}. ${l.title}
      </button>
    `).join('')}
  </div>` : '';

  const objectivesHTML = lesson.learningObjectives && lesson.learningObjectives.length > 0
    ? `<div class="bg-indigo-50 rounded-xl p-5 mb-8 border border-indigo-100">
        <h3 class="font-semibold text-indigo-800 mb-3 flex items-center gap-2">
          <i class="fa-solid fa-bullseye text-indigo-500"></i> Learning Objectives
        </h3>
        <ul class="space-y-2">
          ${lesson.learningObjectives.map(obj => `<li class="flex items-start gap-2 text-indigo-700"><i class="fa-solid fa-check-circle text-green-500 mt-1"></i><span>${obj}</span></li>`).join('')}
        </ul>
      </div>`
    : '';

  const takeawaysHTML = lesson.summaryTakeaways && lesson.summaryTakeaways.length > 0
    ? `<div class="bg-green-50 rounded-xl p-5 mt-8 border border-green-100">
        <h3 class="font-semibold text-green-800 mb-3 flex items-center gap-2">
          <i class="fa-solid fa-star text-green-500"></i> Summary Takeaways
        </h3>
        <ul class="space-y-2">
          ${lesson.summaryTakeaways.map(t => `<li class="flex items-start gap-2 text-green-700"><i class="fa-solid fa-arrow-right text-green-400 mt-1"></i><span>${t}</span></li>`).join('')}
        </ul>
      </div>`
    : '';

  DOM.tabLesson.innerHTML = `
    <div class="max-w-3xl mx-auto animate-fade-in">
      <h2 class="text-3xl font-bold text-gray-900 mb-2">${lesson.title}</h2>
      <p class="text-sm text-gray-500 mb-4">Lesson ${lessonIdx + 1} of ${totalLessons}</p>
      ${lessonNavHTML}
      ${objectivesHTML}
      <div class="prose max-w-none text-gray-800">
        ${eli5 ? eli5.wrapContent(lesson.content, simpleContent) : lesson.content}
      </div>
      ${takeawaysHTML}
      <div class="mt-12 pt-6 border-t border-gray-200 flex items-center justify-between">
        <div>
          ${hasPrev ? `<button id="prev-lesson-btn" class="px-4 py-2 rounded-lg font-medium text-gray-600 hover:text-purple-700 hover:bg-purple-50 transition-all flex items-center gap-1"><i class="fa-solid fa-arrow-left"></i> Previous</button>` : ''}
        </div>
        <div class="flex items-center gap-3">
          ${isCompleted ? `<span class="text-green-600 font-medium flex items-center gap-1"><i class="fa-solid fa-check-circle"></i> Completed</span>` : ''}
          ${hasNext
            ? `<button id="next-lesson-btn" class="px-6 py-3 rounded-lg font-medium bg-purple-600 text-white hover:bg-purple-700 shadow-md transition-all flex items-center gap-2">Next Lesson <i class="fa-solid fa-arrow-right"></i></button>`
            : `<button id="mark-lesson-complete" class="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${isCompleted ? 'bg-green-100 text-green-700 cursor-default' : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md'}">
                ${isCompleted ? '<i class="fa-solid fa-check"></i> Completed' : 'Mark as Complete'}
              </button>`
          }
        </div>
      </div>
    </div>
  `;

  if (eli5) {
    window.eli5Toggle.setPreference('bootstrap', false);
    window.eli5Toggle.initToggle('bootstrap', DOM.tabLesson);
  }

  const nextBtn = document.getElementById('next-lesson-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      markItemComplete(lesson.id);
      const nextLesson = mod.lessons[lessonIdx + 1];
      if (nextLesson) navigateToLesson(mod.id, nextLesson.id);
    });
  }

  const completeBtn = document.getElementById('mark-lesson-complete');
  if (completeBtn && !isCompleted) {
    completeBtn.addEventListener('click', () => {
      markItemComplete(lesson.id);
      renderLesson(lesson);
      switchTab('playground');
    });
  }

  const prevBtn = document.getElementById('prev-lesson-btn');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const prevLesson = mod.lessons[lessonIdx - 1];
      if (prevLesson) navigateToLesson(mod.id, prevLesson.id);
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

// --- Bootstrap Playground Engine ---

function runCode() {
  const userCode = DOM.codeEditor.value;
  const iframeContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Bootstrap Preview</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
      <style>body { background-color: #ffffff; padding: 15px; }</style>
    </head>
    <body>
      ${userCode}
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmxc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"><\/script>
    </body>
    </html>
  `;
  DOM.previewFrame.srcdoc = iframeContent;
}

// Start application
init();
