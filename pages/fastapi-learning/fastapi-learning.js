/* global toggleSwaggerBlock, enableExecute, executeSwaggerRoute */
// --- Curriculum Data ---
const curriculum = [
  {
    id: 'fastapi-basics',
    title: 'FastAPI Basics & Routing',
    lessons: [
      {
        id: 'fa-1',
        title: 'First Steps',
        content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Modern, Fast Python Web Framework</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">FastAPI is a modern, fast (high-performance), web framework for building APIs with Python 3.7+ based on standard Python type hints.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">One of its best features is automatic interactive API documentation provided by Swagger UI. Let's create a simple GET route.</p>
                    <div class="bg-green-50 border-l-4 border-[#059669] p-4 my-6 rounded-r-lg">
                        <p class="text-green-800 font-medium">Go to the Simulator, click 'Refresh Docs', and test the generated Swagger UI!</p>
                    </div>
                `,
        defaultCode: `from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/items")
def read_items():
    return [
        {"id": 1, "name": "Portal Gun"},
        {"id": 2, "name": "Plumbus"}
    ]
`,
      },
    ],
    quiz: [
      {
        id: 'q-fa-1',
        question:
          'Which Python decorator is used in FastAPI to map a function to handle HTTP GET requests for the root URL?',
        options: ["@app.route('/')", "@app.get('/')", '@app.get_route()', "@fastapi.get('/')"],
        correct: 1,
      },
    ],
  },
  {
    id: 'parameters',
    title: 'Path & Query Parameters',
    lessons: [
      {
        id: 'param-1',
        title: 'Passing Data in the URL',
        content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Path Parameters</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">You can declare path "parameters" or "variables" with the same syntax used by Python format strings: <code>@app.get("/items/{item_id}")</code></p>
                    <p class="mb-4 text-gray-700 leading-relaxed">If you declare other function parameters that are not part of the path parameters, they are automatically interpreted as "query" parameters.</p>
                `,
        defaultCode: `from fastapi import FastAPI

app = FastAPI()

@app.get("/users/{user_id}")
def read_user(user_id: int, q: str = None):
    # user_id is a path parameter (forced to be an int)
    # q is an optional query parameter
    return {"user_id": user_id, "query_string": q}
`,
      },
    ],
    quiz: [
      {
        id: 'q-param-1',
        question:
          "If a parameter is defined in the path like '/items/{item_id}', what kind of parameter is it?",
        options: ['Body Parameter', 'Header Parameter', 'Query Parameter', 'Path Parameter'],
        correct: 3,
      },
    ],
  },
  {
    id: 'pydantic',
    title: 'Pydantic Models & Validation',
    lessons: [
      {
        id: 'pyd-1',
        title: 'Data Validation',
        content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Request Bodies</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">When you need to send data from a client (let's say, a browser) to your API, you send it as a request body.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">To declare a request body, you use Pydantic models with all their power and benefits (data validation, serialization, documentation).</p>
                `,
        defaultCode: `from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    name: str
    description: str = None
    price: float
    tax: float = None

@app.post("/items")
def create_item(item: Item):
    # 'item' will have all the validated data
    item_dict = item.dict()
    if item.tax:
        price_with_tax = item.price + item.tax
        item_dict.update({"price_with_tax": price_with_tax})
    return item_dict
`,
      },
    ],
    quiz: [
      {
        id: 'q-pyd-1',
        question:
          'Which library does FastAPI use under the hood for data validation and settings management using Python type hints?',
        options: ['Marshmallow', 'Cerberus', 'Pydantic', 'Django Forms'],
        correct: 2,
      },
    ],
  },
];

// --- State & Progress ---
let state = {
  activeModuleId: curriculum[0].id,
  activeLessonId: curriculum[0].lessons[0].id,
  activeTab: 'lesson',
  completedItems: [],
  quizAnswers: {},
};

// Load state from local storage
function loadProgress() {
  try {
    const saved = localStorage.getItem('fastapiHubProgress');
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
    localStorage.setItem('fastapiHubProgress', JSON.stringify(state.completedItems));
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
  tabSimulator: document.getElementById('tab-simulator'),
  tabQuiz: document.getElementById('tab-quiz'),

  codeEditor: document.getElementById('code-editor'),
  runServerBtn: document.getElementById('run-server-btn'),

  swaggerEndpoints: document.getElementById('swagger-endpoints'),
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
  DOM.tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // Simulator Controls
  DOM.runServerBtn.addEventListener('click', runSimulation);

  // Swagger UI delegation
  DOM.swaggerEndpoints.addEventListener('click', (e) => {
    const toggleHeader = e.target.closest('[data-action="toggle-swagger"]');
    if (toggleHeader) {
      toggleSwaggerBlock(toggleHeader.dataset.routeId);
      return;
    }

    const enableBtn = e.target.closest('[data-action="enable-execute"]');
    if (enableBtn) {
      enableExecute(enableBtn.dataset.routeId);
      return;
    }

    const execBtn = e.target.closest('[data-action="execute-swagger"]');
    if (execBtn) {
      executeSwaggerRoute(
        execBtn.dataset.routeMethod,
        execBtn.dataset.routePath,
        execBtn.dataset.routeId
      );
    }
  });

  // Editor formatting (Python uses 4 spaces)
  DOM.codeEditor.addEventListener('keydown', function (e) {
    if (e.key == 'Tab') {
      e.preventDefault();
      var start = this.selectionStart;
      var end = this.selectionEnd;
      this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
      this.selectionStart = this.selectionEnd = start + 4;
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
    content.classList.remove('active', 'flex', 'lg:flex');
  });

  const activeContent = document.getElementById(`tab-${tabId}`);
  if (tabId === 'simulator') {
    activeContent.classList.add('active', 'flex', 'lg:flex-row');
    // Auto-run if swagger is empty
    if (DOM.swaggerEndpoints.innerHTML.includes('Click "Refresh Docs"')) {
      runSimulation();
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
    state.activeLessonId = mod.lessons[0].id;

    renderSidebar();
    renderActiveState();
    if (window.innerWidth < 1024) {
      DOM.sidebar.classList.add('-translate-x-full');
      DOM.sidebarOverlay.classList.add('hidden');
    }

    // Reset Swagger UI prompt
    DOM.swaggerEndpoints.innerHTML = `
            <div class="text-center text-gray-500 mt-10">
                <i class="fa-solid fa-spinner fa-spin text-2xl mb-2"></i>
                <p>Click "Refresh Docs" to parse your Python code.</p>
            </div>
        `;
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
    btn.className = `w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${isActive ? 'bg-green-100 text-green-900 font-semibold border-l-4 border-[#059669]' : 'hover:bg-gray-100 text-gray-700 border-l-4 border-transparent'}`;
    btn.onclick = () => changeModule(mod.id);

    const textSpan = document.createElement('span');
    textSpan.className = 'truncate block';
    textSpan.innerText = mod.title;

    btn.appendChild(textSpan);

    if (isModuleComplete) {
      const checkIcon = document.createElement('i');
      checkIcon.className = 'fa-solid fa-check-circle text-[#059669]';
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
                <button id="mark-lesson-complete" class="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${isCompleted ? 'bg-green-100 text-green-800 cursor-default' : 'bg-[#059669] text-white hover:bg-green-700 shadow-md'}">
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
      switchTab('simulator');
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
                <h4 class="font-semibold text-lg text-gray-800 mb-4"><span class="text-[#059669] mr-2">${index + 1}.</span>${q.question}</h4>
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
                <button id="submit-quiz-btn" class="px-8 py-3 rounded-lg font-bold text-lg text-white bg-[#059669] hover:bg-green-700 shadow-md transition-all">Submit Answers</button>
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

// --- FastAPI Swagger Simulator Engine (CRITICAL) ---

// Hardcoded fake responses based on typical routes in the lessons
const fakeResponses = {
  'GET_/': { Hello: 'World' },
  'GET_/items': [
    { id: 1, name: 'Portal Gun' },
    { id: 2, name: 'Plumbus' },
  ],
  'GET_/users/{user_id}': { user_id: 42, query_string: 'test' },
  'POST_/items': {
    name: 'New Item',
    description: 'A very nice item',
    price: 10.5,
    tax: 1.5,
    price_with_tax: 12.0,
  },
};

function runSimulation() {
  const code = DOM.codeEditor.value;

  // Simple Regex to find FastAPI route decorators
  // Looks for @app.get("/path") or @app.post('/path')
  const regex = /@app\.(get|post|put|delete)\(['"]([^'"]+)['"]\)/g;

  let match;
  const routes = [];

  while ((match = regex.exec(code)) !== null) {
    routes.push({
      method: match[1].toLowerCase(),
      path: match[2],
      id: 'route-' + Math.random().toString(36).substr(2, 9),
    });
  }

  DOM.swaggerEndpoints.innerHTML = '';

  if (routes.length === 0) {
    DOM.swaggerEndpoints.innerHTML = `
            <div class="text-center text-red-500 mt-10 font-medium">
                No FastAPI routes found in the code. Ensure you have decorators like <code>@app.get("/")</code>.
            </div>
        `;
    return;
  }

  routes.forEach((route) => {
    const block = document.createElement('div');
    block.className = `swagger-block ${route.method}`;

    block.innerHTML = `
            <div class="swagger-header" data-route-id="${route.id}" data-action="toggle-swagger">
                <span class="swagger-method">${route.method.toUpperCase()}</span>
                <span class="swagger-path">${route.path}</span>
            </div>
            <div class="swagger-body" id="${route.id}-body">
                <button class="swagger-btn-try" data-route-id="${route.id}" data-action="enable-execute">Try it out</button>
                <div style="clear:both;"></div>
                
                <div id="${route.id}-execute-container" style="display:none;">
                    <button class="swagger-btn-execute" data-route-method="${route.method}" data-route-path="${route.path}" data-route-id="${route.id}" data-action="execute-swagger">Execute</button>
                </div>
                
                <div class="swagger-response-area" id="${route.id}-response">
                    <h4>Server response</h4>
                    <div class="swagger-json-box" id="${route.id}-json"></div>
                </div>
            </div>
        `;

    DOM.swaggerEndpoints.appendChild(block);
  });
}

// Global functions for inline HTML event handlers in the simulator
window.toggleSwaggerBlock = function (routeId) {
  const block = document.getElementById(`${routeId}-body`).parentElement;
  block.classList.toggle('open');
};

window.enableExecute = function (routeId) {
  const execContainer = document.getElementById(`${routeId}-execute-container`);
  execContainer.style.display = 'block';
};

window.executeSwaggerRoute = function (method, path, routeId) {
  const responseArea = document.getElementById(`${routeId}-response`);
  const jsonBox = document.getElementById(`${routeId}-json`);

  // Simulate network delay
  jsonBox.innerText = 'Loading...';
  responseArea.style.display = 'block';

  setTimeout(() => {
    // Try to find a hardcoded fake response
    const key = `${method.toUpperCase()}_${path}`;
    let responseData = fakeResponses[key];

    if (!responseData) {
      responseData = { message: 'Success! (Mock Response)' };
    }

    jsonBox.innerText = JSON.stringify(responseData, null, 2);
  }, 400);
};

// Start application
init();
