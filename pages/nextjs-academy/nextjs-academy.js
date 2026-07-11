// --- Curriculum Data ---
const curriculum = [
  {
    id: 'app-router',
    title: 'App Router & Layouts',
    lessons: [
      {
        id: 'ar-1',
        title: 'Introduction to App Router',
        content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Routing in Next.js</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">The Next.js App Router introduces a new paradigm for building React applications, using Server Components by default.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Routing is file-system based. A <code>page.tsx</code> file creates a UI for a route. A <code>layout.tsx</code> file creates a shared UI for multiple routes.</p>
                    <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
                        <p class="text-blue-800 font-medium">Switch to the Simulator & Code tab. Click "Run Build" to see how the code compiles!</p>
                    </div>
                `,
        defaultCode: `// app/page.tsx
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold">Welcome to Next.js Academy</h1>
        <p className="mt-4 text-xl">Get started by editing this file.</p>
      </div>
    </main>
  )
}`,
        simulatedBrowser: `
                    <div style="font-family: sans-serif; padding: 40px; display: flex; flex-direction: column; align-items: center; text-align: center;">
                        <h1 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 1rem;">Welcome to Next.js Academy</h1>
                        <p style="font-size: 1.25rem; color: #4b5563;">Get started by editing this file.</p>
                    </div>
                `,
        simulatedTerminal: `
<span class="term-dim">✓ Ready in 1250ms</span>
<span class="term-info">○ Compiling /page ...</span>
<span class="term-success">✓ Compiled /page in 452ms (341 modules)</span>
<span class="term-dim">GET / 200 in 614ms</span>
                `,
      },
    ],
    quiz: [
      {
        id: 'q-ar-1',
        question: 'Which file is used to define a unique UI for a route in the App Router?',
        options: ['route.tsx', 'page.tsx', 'index.tsx', 'layout.tsx'],
        correct: 1,
      },
    ],
  },
  {
    id: 'server-client',
    title: 'Server vs Client Components',
    lessons: [
      {
        id: 'sc-1',
        title: "Understanding 'use client'",
        content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Rethinking React Rendering</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">By default, components inside the <code>app</code> directory are React Server Components. This allows you to render components on the server, reducing the amount of JavaScript sent to the client.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">If you need client-side interactivity (like <code>useState</code>, <code>useEffect</code>, or event listeners like <code>onClick</code>), you must add the <code>"use client"</code> directive at the top of the file.</p>
                `,
        defaultCode: `"use client"

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2>Interactive Client Component</h2>
      <p>Count: {count}</p>
      <button 
        onClick={() => setCount(count + 1)}
        style={{ padding: '8px 16px', background: 'black', color: 'white', borderRadius: '4px' }}
      >
        Increment
      </button>
    </div>
  )
}`,
        simulatedBrowser: `
                    <div style="font-family: sans-serif; padding: 20px;">
                        <div style="padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                            <h2 style="margin-top: 0;">Interactive Client Component</h2>
                            <p>Count: 0</p>
                            <button style="padding: 8px 16px; background: black; color: white; border-radius: 4px; border: none; cursor: pointer;">Increment</button>
                        </div>
                    </div>
                `,
        simulatedTerminal: `
<span class="term-dim">✓ Ready in 842ms</span>
<span class="term-info">○ Compiling /page ...</span>
<span class="term-dim">⚠ Wait compiling...</span>
<span class="term-success">✓ Compiled /page in 312ms (342 modules)</span>
<span class="term-info">  ✓ Generating static pages (1/1)</span>
<span class="term-dim">GET / 200 in 241ms</span>
                `,
      },
    ],
    quiz: [
      {
        id: 'q-sc-1',
        question:
          'What directive must be used to opt-into client-side rendering in the App Router?',
        options: ["'use strict'", "'use server'", "'use client'", "'use react'"],
        correct: 2,
      },
    ],
  },
  {
    id: 'data-fetching',
    title: 'Data Fetching & Server Actions',
    lessons: [
      {
        id: 'df-1',
        title: 'Server Actions',
        content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Mutating Data</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Server Actions are asynchronous functions that are executed on the server. They can be used in Server and Client Components to handle form submissions and data mutations in Next.js applications.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">You define a Server Action with the <code>"use server"</code> directive.</p>
                `,
        defaultCode: `// app/actions.ts
"use server"
 
export async function createPost(formData: FormData) {
  const title = formData.get('title');
  // Simulate database mutation
  console.log(\`Saving post: \${title} to database...\`);
  return { message: 'Post created successfully!' };
}

// app/page.tsx (Imagine this is imported)
export default function Page() {
  return (
    <form action={createPost} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', margin: '20px' }}>
      <input type="text" name="title" placeholder="Post Title" style={{ padding: '8px', border: '1px solid #ccc' }} />
      <button type="submit" style={{ padding: '8px', background: 'black', color: 'white' }}>Submit</button>
    </form>
  )
}`,
        simulatedBrowser: `
                    <div style="font-family: sans-serif;">
                        <form style="display: flex; flex-direction: column; gap: 10px; max-width: 300px; margin: 20px;">
                            <input type="text" name="title" placeholder="Post Title" style="padding: 8px; border: 1px solid #ccc;" />
                            <button type="submit" style="padding: 8px; background: black; color: white; border: none;">Submit</button>
                        </form>
                    </div>
                `,
        simulatedTerminal: `
<span class="term-dim">✓ Ready in 950ms</span>
<span class="term-info">○ Compiling /page ...</span>
<span class="term-success">✓ Compiled /page in 521ms</span>
<span class="term-dim">POST / 200 in 120ms</span>
<span class="term-info">Saving post: Hello Next.js to database...</span>
                `,
      },
    ],
    quiz: [
      {
        id: 'q-df-1',
        question: 'What directive is used to mark a function as a Server Action?',
        options: ["'use server'", "'use mutation'", "'server-side'", "'use action'"],
        correct: 0,
      },
    ],
  },
];

// --- State & Progress ---
let state = {
  activeModuleId: curriculum[0].id,
  activeLessonId: curriculum[0].lessons[0].id,
  activeTab: 'lesson', // lesson, simulator, quiz
  completedItems: [], // array of lesson/quiz IDs
  quizAnswers: {}, // format: { 'q-ar-1': 1 }
};

// Load state from local storage
function loadProgress() {
  try {
    const saved = localStorage.getItem('nextjsHubProgress');
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
    localStorage.setItem('nextjsHubProgress', JSON.stringify(state.completedItems));
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
  tabSimulator: document.getElementById('tab-simulator'),
  tabQuiz: document.getElementById('tab-quiz'),
  codeEditor: document.getElementById('code-editor'),
  runCodeBtn: document.getElementById('run-code-btn'),
  simulatedBrowser: document.getElementById('simulated-browser'),
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

  // Run Code
  DOM.runCodeBtn.addEventListener('click', runSimulation);

  // Allow basic tab indentation in textarea
  DOM.codeEditor.addEventListener('keydown', function (e) {
    if (e.key == 'Tab') {
      e.preventDefault();
      var start = this.selectionStart;
      var end = this.selectionEnd;
      this.value = this.value.substring(0, start) + '  ' + this.value.substring(end); // Next.js typically 2 spaces
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
  if (tabId === 'simulator') {
    activeContent.classList.add('active', 'flex', 'md:flex-row'); // specific display flex for split pane
    // Reset simulator state if it hasn't been run yet for this lesson
    if (DOM.simulatedBrowser.innerHTML.includes('Run the build to view output')) {
      // Do nothing, wait for user to run
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

    // Reset Simulator UI
    DOM.simulatedBrowser.innerHTML =
      '<div class="absolute inset-0 flex items-center justify-center text-gray-400"><p>Run the build to view output</p></div>';
    DOM.simulatedTerminal.innerHTML = '<p class="text-gray-500">Waiting for commands...</p>';

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
    btn.className = `w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${isActive ? 'bg-gray-200 text-black font-semibold border-l-4 border-black' : 'hover:bg-gray-100 text-gray-700 border-l-4 border-transparent'}`;
    btn.onclick = () => changeModule(mod.id);

    const textSpan = document.createElement('span');
    textSpan.className = 'truncate block';
    textSpan.innerText = mod.title;

    btn.appendChild(textSpan);

    if (isModuleComplete) {
      const checkIcon = document.createElement('i');
      checkIcon.className = 'fa-solid fa-check-circle text-black';
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

  // Set default code for playground
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
                <button id="mark-lesson-complete" class="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${isCompleted ? 'bg-gray-200 text-gray-700 cursor-default' : 'bg-black text-white hover:bg-gray-800 shadow-md'}">
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
      switchTab('simulator'); // Auto-switch to next logical step
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
                ${isCompleted ? '<span class="inline-block mt-3 bg-gray-200 text-black px-3 py-1 rounded-full text-sm font-semibold"><i class="fa-solid fa-check mr-1"></i> Passed</span>' : ''}
            </div>
            <div id="quiz-questions-container" class="space-y-8">
    `;

  mod.quiz.forEach((q, index) => {
    html += `
            <div class="bg-white border rounded-xl p-6 shadow-sm">
                <h4 class="font-semibold text-lg text-gray-800 mb-4"><span class="text-black mr-2">${index + 1}.</span>${q.question}</h4>
                <div class="space-y-3">
        `;

    q.options.forEach((opt, optIdx) => {
      const isSelected = state.quizAnswers[q.id] === optIdx;

      html += `
                <label class="flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-gray-100 border-black' : 'hover:bg-gray-50 border-gray-200'}">
                    <input type="radio" name="quiz-${q.id}" value="${optIdx}" class="form-radio text-black h-5 w-5" ${isSelected ? 'checked' : ''} onchange="handleQuizSelection('${q.id}', ${optIdx})">
                    <span class="ml-3 text-gray-700">${opt}</span>
                </label>
            `;
    });

    html += `</div></div>`;
  });

  html += `
            </div>
            <div class="mt-8 flex flex-col items-center border-t pt-8">
                <button id="submit-quiz-btn" class="px-8 py-3 rounded-lg font-bold text-lg text-white bg-black hover:bg-gray-800 shadow-md transition-all">Submit Answers</button>
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

// --- Next.js Simulator Engine (CRITICAL) ---

function runSimulation() {
  const lesson = getActiveLesson();

  // 1. Clear terminal and show build starting
  DOM.simulatedTerminal.innerHTML =
    '<p class="term-info">▲ Next.js 14.1.0</p><p class="term-dim">- Local:        http://localhost:3000</p><p class="term-dim">- Environments: .env</p><p class="term-info">○ Compiling...</p>';
  DOM.simulatedBrowser.innerHTML =
    '<div class="absolute inset-0 flex items-center justify-center text-gray-400"><i class="fa-solid fa-circle-notch fa-spin text-2xl"></i></div>';

  // 2. Simulate delay for "compiling"
  setTimeout(() => {
    // Append actual terminal output
    DOM.simulatedTerminal.innerHTML += `<br/>${lesson.simulatedTerminal}`;

    // Auto-scroll terminal to bottom
    DOM.simulatedTerminal.scrollTop = DOM.simulatedTerminal.scrollHeight;

    // 3. Inject mock browser DOM
    DOM.simulatedBrowser.innerHTML = lesson.simulatedBrowser;
  }, 800); // 800ms fake compile time
}

// Start application
init();
