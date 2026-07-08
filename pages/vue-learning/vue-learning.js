// --- Vue.js Learning Hub Curriculum Data ---
const curriculum = [
  {
    id: 'basics',
    title: 'Vue Basics & Reactivity',
    lessons: [
      {
        id: 'basics-1',
        title: 'Introduction to Vue 3',
        content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">The Progressive Framework</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Vue is a JavaScript framework for building user interfaces. It builds on top of standard HTML, CSS, and JavaScript and provides a declarative and component-based programming model.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">With the <strong>Composition API</strong> (Vue 3), you can declare reactive state using the <code>ref()</code> function. The UI automatically updates when this reactive state changes.</p>
                    <div class="bg-emerald-50 border-l-4 border-emerald-500 p-4 my-6 rounded-r-lg">
                        <p class="text-emerald-800 font-medium"><i class="fa-solid fa-circle-info mr-2"></i>Head over to the <strong>Playground & Code</strong> tab and click "Run Code" to compile your first Vue component!</p>
                    </div>
                `,
        defaultCode: `<div id="app" class="p-6 text-center space-y-4 font-sans bg-white rounded-xl shadow-sm border border-emerald-100 max-w-sm mx-auto">
  <div class="p-3 bg-emerald-100 rounded-full inline-block">
    <i class="fa-brands fa-vuejs text-4xl text-emerald-600"></i>
  </div>
  <h1 class="text-2xl font-bold text-slate-800">Vue Reactivity</h1>
  <p class="text-gray-500 text-sm">Vue's reactivity system tracks dependencies automatically.</p>
  
  <div class="text-3xl font-extrabold text-emerald-600 font-mono py-2">
    Count: {{ count }}
  </div>

  <button @click="increment" class="px-5 py-2.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-bold shadow-sm text-sm">
    Increment Counter
  </button>
</div>

<script type="module">
  import { createApp, ref } from 'vue'

  createApp({
    setup() {
      const count = ref(0)
      
      function increment() {
        count.value++
      }

      return { count, increment }
    }
  }).mount('#app')
</script>`,
      },
    ],
    quiz: [
      {
        id: 'q-basics-1',
        question:
          'Which function is used to create reactive state for primitives in Vue 3 Composition API?',
        options: ['reactive()', 'useState()', 'ref()', 'let'],
        correct: 2,
      },
      {
        id: 'q-basics-2',
        question: 'How do you access the value of a ref() inside the setup() script?',
        options: ['myRef.current', 'myRef.value', 'myRef.get()', '$myRef'],
        correct: 1,
      },
    ],
  },
  {
    id: 'directives',
    title: 'Template Directives',
    lessons: [
      {
        id: 'directives-1',
        title: 'v-if and v-for',
        content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Declarative Rendering</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Vue uses HTML-based template syntax. Directives are special attributes with the <code>v-</code> prefix.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Use <code>v-if</code>, <code>v-else-if</code>, and <code>v-else</code> to conditionally render elements. Use <code>v-for</code> to render a list of items based on an array.</p>
                `,
        defaultCode: `<div id="app" class="p-6 bg-white border border-gray-200 rounded-xl shadow-sm space-y-4 max-w-sm mx-auto">
  <h3 class="font-bold text-gray-800">Todo List</h3>
  
  <ul class="space-y-2 mb-4">
    <li v-for="(task, index) in tasks" :key="index" class="p-2 bg-gray-50 border rounded text-sm text-gray-700">
      {{ index + 1 }}. {{ task }}
    </li>
  </ul>

  <div v-if="tasks.length === 0" class="p-3 text-emerald-600 bg-emerald-50 rounded text-sm">
    All caught up! No tasks left.
  </div>

  <button @click="clearTasks" class="w-full py-2 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700">
    Clear All Tasks
  </button>
</div>

<script type="module">
  import { createApp, ref } from 'vue'

  createApp({
    setup() {
      const tasks = ref(['Learn Vue Basics', 'Master Directives', 'Build an App'])
      
      const clearTasks = () => {
        tasks.value = []
      }

      return { tasks, clearTasks }
    }
  }).mount('#app')
</script>`,
      },
    ],
    quiz: [
      {
        id: 'q-directives-1',
        question:
          'Which directive is used to conditionally render a block based on a truthy value?',
        options: ['v-show', 'v-bind', 'v-if', 'v-model'],
        correct: 2,
      },
    ],
  },
  {
    id: 'lifecycle',
    title: 'Lifecycle Hooks',
    lessons: [
      {
        id: 'lifecycle-1',
        title: 'onMounted & onUnmounted',
        content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Component Lifecycle</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Each Vue component instance goes through a series of initialization steps when it's created. You can hook into these steps using lifecycle hooks.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">The most commonly used hook is <code>onMounted</code>, which runs after the component has finished the initial render and created the DOM nodes.</p>
                `,
        defaultCode: `<div id="app" class="p-6 bg-white border rounded-xl shadow-sm space-y-4 max-w-sm mx-auto text-center">
  <h3 class="font-bold text-gray-800">Lifecycle Demo</h3>
  
  <div class="text-xl font-mono py-4 text-emerald-600">
    {{ status }}
  </div>
</div>

<script type="module">
  import { createApp, ref, onMounted } from 'vue'

  createApp({
    setup() {
      const status = ref('Initializing...')
      
      onMounted(() => {
        // Simulate a network request or setup
        setTimeout(() => {
          status.value = 'Component Mounted Successfully!'
        }, 1500)
      })

      return { status }
    }
  }).mount('#app')
</script>`,
      },
    ],
    quiz: [
      {
        id: 'q-lifecycle-1',
        question: 'Which hook is called right after the component has been mounted to the DOM?',
        options: ['onCreated', 'onBeforeMount', 'onUpdated', 'onMounted'],
        correct: 3,
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
  quizAnswers: {}, // format: { 'q-reactivity-1': 1 }
};

// Load state from local storage
function loadProgress() {
  try {
    const saved = localStorage.getItem('vueLearningProgress');
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
    localStorage.setItem('vueLearningProgress', JSON.stringify(state.completedItems));
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
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
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
  if (tabId === 'playground') {
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
    DOM.previewFrame.srcdoc = '';
    renderSidebar();
    renderActiveState();
    if (window.innerWidth < 1024) {
      DOM.sidebar.classList.add('-translate-x-full');
      DOM.sidebarOverlay.classList.add('hidden');
    }
  }
}

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
    btn.className = `w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${isActive ? 'bg-emerald-50 text-emerald-800 font-semibold border-l-4 border-emerald-600' : 'hover:bg-gray-100 text-gray-700 border-l-4 border-transparent'}`;
    btn.onclick = () => changeModule(mod.id);

    const textSpan = document.createElement('span');
    textSpan.className = 'truncate block';
    textSpan.innerText = mod.title;
    btn.appendChild(textSpan);

    if (isModuleComplete) {
      const checkIcon = document.createElement('i');
      checkIcon.className = 'fa-solid fa-check-circle text-emerald-600';
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
                <button id="mark-lesson-complete" class="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${isCompleted ? 'bg-gray-200 text-gray-700 cursor-default' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'}">
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
      switchTab('playground');
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
                ${isCompleted ? '<span class="inline-block mt-3 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-semibold"><i class="fa-solid fa-check mr-1"></i> Passed</span>' : ''}
            </div>
            <div id="quiz-questions-container" class="space-y-8">
    `;

  mod.quiz.forEach((q, index) => {
    html += `
            <div class="bg-white border rounded-xl p-6 shadow-sm">
                <h4 class="font-semibold text-lg text-gray-800 mb-4"><span class="text-emerald-600 mr-2">${index + 1}.</span>${q.question}</h4>
                <div class="space-y-3">
        `;

    q.options.forEach((opt, optIdx) => {
      const isSelected = state.quizAnswers[q.id] === optIdx;
      html += `
                <label class="flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-emerald-50 border-emerald-300' : 'hover:bg-gray-50 border-gray-200'}">
                    <input type="radio" name="quiz-${q.id}" value="${optIdx}" class="form-radio text-emerald-600 h-5 w-5" ${isSelected ? 'checked' : ''} onchange="handleQuizSelection('${q.id}', ${optIdx})">
                    <span class="ml-3 text-gray-700">${opt}</span>
                </label>
            `;
    });
    html += `</div></div>`;
  });

  html += `
            </div>
            <div class="mt-8 flex flex-col items-center border-t pt-8">
                <button id="submit-quiz-btn" class="px-8 py-3 rounded-lg font-bold text-lg text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all">Submit Answers</button>
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
      feedback.innerHTML = '<i class="fa-solid fa-check"></i> Perfect! You passed.';
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

// --- Vue Code Interpreter Sandbox ---
function runCode() {
  const userCode = DOM.codeEditor.value;

  const iframeContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <script src="https://cdn.tailwindcss.com"></script>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <script type="importmap">
              {
                "imports": {
                  "vue": "https://unpkg.com/vue@3/dist/vue.esm-browser.js"
                }
              }
            </script>
            <style>
                body { margin: 0; padding: 20px; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; background-color: #ffffff; color: #1f2937; }
                #error-boundary { color: #dc2626; background: #fee2e2; padding: 15px; border-radius: 8px; margin: 10px; font-family: monospace; white-space: pre-wrap; border: 1px solid #fca5a5; }
            </style>
        </head>
        <body>
            <div id="error-container"></div>
            ${userCode}
            <script>
                window.onerror = function(msg, url, lineNo, columnNo, error) {
                    const errContainer = document.getElementById('error-container');
                    errContainer.innerHTML = '<div id="error-boundary"><strong>Runtime Error:</strong><br/>' + msg + '</div>';
                    return false;
                };
            </script>
        </body>
        </html>
    `;

  DOM.previewFrame.srcdoc = iframeContent;
}

// Start app
document.addEventListener('DOMContentLoaded', init);
