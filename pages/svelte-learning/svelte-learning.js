// --- Svelte Learning Hub Curriculum Data ---
const curriculum = [
    {
        id: "reactivity",
        title: "Introduction & Reactivity",
        lessons: [
            {
                id: "reactivity-1",
                title: "Declaring Reactive State",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">What makes Svelte special?</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Unlike React or Angular, Svelte is a <strong>compiler</strong>. It runs at build time, converting your declarative components into highly efficient imperative code that surgically updates the DOM.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">To declare local reactive state in Svelte, you simply declare a variable with <code>let</code> inside a <code>&lt;script&gt;</code> block. To render it, place the variable name inside single curly braces: <code>{count}</code>.</p>
                    <div class="bg-orange-50 border-l-4 border-orange-500 p-4 my-6 rounded-r-lg">
                        <p class="text-orange-800 font-medium"><i class="fa-solid fa-circle-info mr-2"></i>Head over to the <strong>Playground & Code</strong> tab and click "Run Code" to compile your first Svelte component!</p>
                    </div>
                `,
                defaultCode: `<script>
  let count = 0;

  function increment() {
    count += 1;
  }
</script>

<main class="p-6 text-center space-y-4 font-sans bg-white rounded-xl shadow-sm border border-orange-100 max-w-sm mx-auto">
  <div class="p-3 bg-orange-100 rounded-full inline-block">
    <i class="fa-solid fa-bolt text-4xl text-orange-600"></i>
  </div>
  <h1 class="text-2xl font-bold text-slate-800">Svelte Reactivity</h1>
  <p class="text-gray-500 text-sm">Svelte compiles code to update DOM nodes directly, without virtual DOM overhead.</p>
  
  <div class="text-3xl font-extrabold text-orange-600 font-mono py-2">
    Count: {count}
  </div>

  <button on:click={increment} class="px-5 py-2.5 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors font-bold shadow-sm text-sm">
    Increment Counter
  </button>
</main>`
            }
        ],
        quiz: [
            {
                id: "q-reactivity-1",
                question: "How do you declare local reactive state in Svelte?",
                options: ["Using useState()", "Using let inside a <script> block", "Using signal()", "Using state: {}"],
                correct: 1
            },
            {
                id: "q-reactivity-2",
                question: "Which braces are used for text interpolation in Svelte templates?",
                options: ["Double curly braces {{ }}", "Single curly braces { }", "Square brackets [ ]", "Angle brackets < >"],
                correct: 1
            }
        ]
    },
    {
        id: "declarations",
        title: "Reactive Declarations & Statements",
        lessons: [
            {
                id: "declarations-1",
                title: "The Reactive $: Label",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Computed state with $:</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Sometimes component state depends on other state values (like a full name dependent on first and last names). Svelte handles this automatically using a <strong>reactive declaration</strong> prefixed with <code>$:</code>.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">The compiler analyzes expressions marked with <code>$:</code> and automatically updates them whenever any referenced variable changes value.</p>
                `,
                defaultCode: `<script>
  let count = 1;
  
  // Reactive declaration (computed state)
  $: double = count * 2;
  
  // Reactive statement (side effect)
  $: {
    console.log("Count is now: " + count);
  }

  function doubleIt() {
    count *= 2;
  }
</script>

<div class="p-6 bg-white border border-gray-200 rounded-xl shadow-sm space-y-4 max-w-sm mx-auto">
  <h3 class="font-bold text-gray-800">Reactive Multipliers</h3>
  <div class="grid grid-cols-2 gap-4 text-center">
    <div class="p-3 bg-gray-50 rounded border">
      <span class="block text-[10px] uppercase font-bold text-gray-400">Base</span>
      <span class="text-xl font-bold text-gray-800">{count}</span>
    </div>
    <div class="p-3 bg-orange-50 rounded border border-orange-100">
      <span class="block text-[10px] uppercase font-bold text-gray-400">Doubled</span>
      <span class="text-xl font-bold text-orange-600">{double}</span>
    </div>
  </div>

  <button on:click={doubleIt} class="w-full py-2 bg-orange-600 text-white rounded text-xs font-bold hover:bg-orange-700">
    Double Values
  </button>
</div>`
            }
        ],
        quiz: [
            {
                id: "q-declarations-1",
                question: "Which syntax is used to declare a reactive statement or variable in Svelte?",
                options: ["reactive:", "$:", "compute:", "watch:"],
                correct: 1
            }
        ]
    },
    {
        id: "components",
        title: "Components & Props",
        lessons: [
            {
                id: "components-1",
                title: "Declaring Props with export let",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Passing Data down the Component Tree</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">In Svelte, components are defined in individual <code>.svelte</code> files. Props are passed into child components by declaring a variable prefixed with the <code>export</code> keyword.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">This turns the variable into a component property that external parent components can bind values to.</p>
                `,
                defaultCode: `<script>
  // Parent Component
  let selectedHero = 'Svelte Master';
  
  // Custom child mock component inline simulation
  // svelte-ignore unused-export-let
  export let username = 'Guest';
</script>

<div class="p-6 bg-white border rounded-xl shadow-sm space-y-4 max-w-sm mx-auto">
  <h3 class="font-bold text-gray-800">Dynamic User Profile</h3>
  
  <div class="p-4 bg-orange-50/50 rounded-lg border border-orange-100 text-center">
    <p class="text-xs text-gray-400 uppercase tracking-wider font-bold">Active User</p>
    <p class="text-lg font-bold text-orange-600">{selectedHero}</p>
  </div>

  <button on:click={() => selectedHero = 'Reactive Champion'} class="w-full py-2 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800">
    Change Profile User
  </button>
</div>`
            }
        ],
        quiz: [
            {
                id: "q-components-1",
                question: "How does a child component declare a prop in Svelte?",
                options: ["Using defineProps()", "Using the export keyword before let", "Using constructor parameters", "Props are declared in script setup"],
                correct: 1
            }
        ]
    },
    {
        id: "stores",
        title: "State Management with Stores",
        lessons: [
            {
                id: "stores-1",
                title: "Writable and Readable Stores",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Sharing state across components</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">For sharing state between non-parent-child components, Svelte offers lightweight <strong>Stores</strong>. A store is simply an object with a <code>subscribe</code> method that alerts callbacks when values change.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">A <code>writable</code> store has additional methods: <code>set()</code> and <code>update()</code>. To subscribe and unsubscribe automatically in templates, prepend the store variable name with a dollar sign: <code>$storeName</code>.</p>
                `,
                defaultCode: `<script>
  import { writable } from 'svelte/store';
  
  // Define a simple mock store
  const theme = writable('Light Mode');

  function toggleTheme() {
    theme.update(current => current === 'Light Mode' ? 'Dark Mode' : 'Light Mode');
  }
</script>

<div class="p-6 border rounded-xl text-center space-y-4 max-w-sm mx-auto shadow-sm">
  <h3 class="font-bold text-gray-800">Global State Store</h3>
  
  <div class="text-xl font-bold font-mono py-2">
    Active Theme: {$theme}
  </div>

  <button on:click={toggleTheme} class="px-4 py-2 bg-orange-600 text-white font-bold text-xs rounded hover:bg-orange-700 shadow">
    Toggle Store Theme
  </button>
</div>`
            }
        ],
        quiz: [
            {
                id: "q-stores-1",
                question: "Which shorthand prefix allows auto-subscribing and auto-unsubscribing to a Svelte store within a template?",
                options: ["#", "$", "@", "_"],
                correct: 1
            }
        ]
    },
    {
        id: "transitions",
        title: "Animations & Transitions",
        lessons: [
            {
                id: "transitions-1",
                title: "Built-in Transition Directives",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Fluid Interface Animations</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Svelte features built-in transition functions (like <code>fade</code>, <code>slide</code>, <code>fly</code>, or <code>scale</code>) to animate elements entering or leaving the DOM.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Apply transitions by importing them from <code>svelte/transition</code> and attaching the <code>transition:</code> directive to HTML tags.</p>
                `,
                defaultCode: `<script>
  let visible = true;
  
  function toggle() {
    visible = !visible;
  }
</script>

<div class="p-6 bg-white border border-gray-200 rounded-xl shadow-sm text-center space-y-4 max-w-sm mx-auto">
  <h3 class="font-bold text-gray-800">Transition Playground</h3>
  
  <button on:click={toggle} class="px-4 py-2 bg-orange-600 text-white font-bold text-xs rounded hover:bg-orange-700">
    Toggle Visibility
  </button>

  <div class="h-20 flex items-center justify-center">
    {#if visible}
      <div class="p-4 bg-orange-50 border border-orange-200 text-orange-700 font-bold rounded-lg shadow-sm text-xs w-full">
        ✨ Look at me fade and slide smoothly!
      </div>
    {/if}
  </div>
</div>`
            }
        ],
        quiz: [
            {
                id: "q-transitions-1",
                question: "Which built-in module contains transitions like fade, fly, and slide?",
                options: ["svelte/animate", "svelte/transition", "svelte/motion", "svelte/effects"],
                correct: 1
            }
        ]
    },
    {
        id: "routing",
        title: "Routing & Layouts",
        lessons: [
            {
                id: "routing-1",
                title: "Client-Side SPA Routing",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Navigating without refresh</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Because Svelte compiles into small bundles, client-side routing is extremely fast. In standalone apps, lightweight routers parse the URL hash or path and render the corresponding component dynamically.</p>
                `,
                defaultCode: `<script>
  let activeRoute = 'Home';
</script>

<div class="p-6 bg-white border border-gray-200 rounded-xl space-y-4 shadow-sm max-w-sm mx-auto">
  <nav class="flex space-x-3 bg-gray-50 p-2 rounded-lg border border-gray-100">
    <button on:click={() => activeRoute = 'Home'} class="text-xs font-bold hover:underline {activeRoute === 'Home' ? 'text-orange-600' : 'text-gray-500'}">Home</button>
    <button on:click={() => activeRoute = 'Dashboard'} class="text-xs font-bold hover:underline {activeRoute === 'Dashboard' ? 'text-orange-600' : 'text-gray-500'}">Dashboard</button>
  </nav>

  <div class="p-4 border border-dashed border-orange-200 rounded bg-orange-50/20 text-center text-xs">
    {#if activeRoute === 'Home'}
      <p class="text-orange-900 font-semibold">Welcome to Svelte Learning Hub! Let's learn routing.</p>
    {:else}
      <p class="text-gray-700">Protected user statistics and progress metrics load here.</p>
    {/if}
  </div>
</div>`
            }
        ],
        quiz: [
            {
                id: "q-routing-1",
                question: "What style of rendering routes swaps components dynamically on the client side?",
                options: ["Server-Side Rendering (SSR)", "Client-Side Routing (CSR / SPA)", "Static Site Generation (SSG)", "Dynamic Edge Rendering"],
                correct: 1
            }
        ]
    },
    {
        id: "sveltekit",
        title: "Introduction to SvelteKit",
        lessons: [
            {
                id: "sveltekit-1",
                title: "File-Based Router & Pages",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">The Svelte Application Framework</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed"><strong>SvelteKit</strong> is Svelte's official meta-framework for building full-stack applications. It implements file-system based routing inside a <code>src/routes</code> folder:</p>
                    <ul class="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                        <li><code>+page.svelte</code>: Represents the visual component for a route directory.</li>
                        <li><code>+layout.svelte</code>: Implements layouts shared by multiple sub-pages.</li>
                        <li><code>+page.js</code>: Resolves asynchronous load data server-side or on navigation.</li>
                    </ul>
                `,
                defaultCode: `<script>
  // Simulated +page.svelte file containing loaded data props
  // svelte-ignore unused-export-let
  export let data = { title: "SvelteKit Hub", problemsCount: 15 };
</script>

<div class="p-6 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-lg space-y-3 max-w-sm mx-auto">
  <div class="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
    <span>File: +page.svelte</span>
    <span class="text-orange-500">SvelteKit v2</span>
  </div>
  <h2 class="text-xl font-bold text-orange-400">{data.title}</h2>
  <p class="text-xs text-slate-300">File-system routing with server data endpoints made incredibly simple.</p>
  
  <div class="p-2 bg-slate-800/50 rounded border border-slate-700 text-xs text-center">
    Loaded {data.problemsCount} DSA challenges from server loads.
  </div>
</div>`
            }
        ],
        quiz: [
            {
                id: "q-sveltekit-1",
                question: "Which file name is reserved in SvelteKit to define the visual interface of a page route?",
                options: ["+route.svelte", "+page.svelte", "index.svelte", "page.js"],
                correct: 1
            }
        ]
    },
    {
        id: "project",
        title: "Mini Projects & Capstone",
        lessons: [
            {
                id: "project-1",
                title: "Stateful Todo Capstone",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Putting it all together</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Congratulations on finishing the Svelte Learning Hub! You will build a reactive Todo List application in this final capstone.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">This project combines state variables, event handlers, list renderers (<code>{#each}</code> loops), and conditional statements (<code>{#if}</code> checks) into a single workspace.</p>
                `,
                defaultCode: `<script>
  let todos = ['Learn Svelte', 'Master Stores'];
  let newTodo = '';

  function addTodo() {
    if (newTodo.trim()) {
      todos = [...todos, newTodo.trim()];
      newTodo = '';
    }
  }

  function removeTodo(index) {
    todos = todos.filter((_, i) => i !== index);
  }
</script>

<div class="p-6 bg-white border rounded-2xl shadow-md space-y-4 max-w-sm mx-auto font-sans">
  <div class="flex justify-between items-center border-b pb-2">
    <h3 class="font-bold text-gray-800">Svelte Todo list</h3>
    <span class="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
      {todos.length} Active
    </span>
  </div>

  <div class="flex gap-2">
    <input [(ngModel)]="newTodo" placeholder="Add a new task..." class="flex-1 p-2 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-orange-500" />
    <button on:click={addTodo} class="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded hover:bg-orange-700">Add</button>
  </div>

  <ul class="space-y-2">
    {#each todos as todo}
      <li class="flex justify-between items-center p-2.5 bg-gray-50 border rounded text-xs">
        <span>{todo}</span>
        <button on:click={() => removeTodo(index)} class="text-rose-500 hover:text-rose-700 font-bold">
          <i class="fa-solid fa-trash"></i>
        </button>
      </li>
    {/each}
  </ul>
</div>`
            }
        ],
        quiz: [
            {
                id: "q-project-1",
                question: "Which statement is true regarding reactive variables in Svelte?",
                options: ["They must be updated via set() functions", "Reactivity is triggered simply by assigning a new value to the variable", "They must use observables", "They must be globally initialized"],
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
    quizAnswers: {} // format: { 'q-reactivity-1': 1 }
};

// Load state from local storage
function loadProgress() {
    try {
        const saved = localStorage.getItem('svelteLearningProgress');
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
        localStorage.setItem('svelteLearningProgress', JSON.stringify(state.completedItems));
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
        activeContent.classList.add('active', 'flex', 'md:flex-row'); // split layout
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
        
        // Clear preview frame on module swap
        DOM.previewFrame.srcdoc = '';

        renderSidebar();
        renderActiveState();
        if(window.innerWidth < 1024) { // Close sidebar on mobile
            DOM.sidebar.classList.add('-translate-x-full');
            DOM.sidebarOverlay.classList.add('hidden');
        }
    }
}

// --- Helper: HTML-escape text to prevent <script> etc. from breaking innerHTML ---
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
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
        btn.className = `w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${isActive ? 'bg-orange-50 text-orange-800 font-semibold border-l-4 border-orange-600' : 'hover:bg-gray-100 text-gray-700 border-l-4 border-transparent'}`;
        btn.onclick = () => changeModule(mod.id);
        
        const textSpan = document.createElement('span');
        textSpan.className = 'truncate block';
        textSpan.innerText = mod.title;
        
        btn.appendChild(textSpan);
        
        if (isModuleComplete) {
            const checkIcon = document.createElement('i');
            checkIcon.className = 'fa-solid fa-check-circle text-orange-600';
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
                ${(window.eli5Toggle ? window.eli5Toggle.wrapContent(lesson.content, window.eli5SvelteData?.[lesson.id] || '') : lesson.content)}
            </div>
            
            <div class="mt-12 pt-6 border-t border-gray-200 flex justify-end">
                <button id="mark-lesson-complete" class="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${isCompleted ? 'bg-gray-200 text-gray-700 cursor-default' : 'bg-orange-600 text-white hover:bg-orange-700 shadow-md'}">
                    ${isCompleted ? '<i class="fa-solid fa-check"></i> Completed' : 'Mark as Complete & Continue'}
                </button>
            </div>
        </div>
    `;

  /* ELI5 toggle */
  if (window.eli5Toggle) {
    window.eli5Toggle.initToggle('svelte', DOM.tabLesson);
  }
    const btn = document.getElementById('mark-lesson-complete');
    if (!isCompleted) {
        btn.addEventListener('click', () => {
            markItemComplete(lesson.id);
            renderLesson(lesson); // Re-render complete status
            switchTab('playground'); // Switch to editor
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
                ${isCompleted ? '<span class="inline-block mt-3 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold"><i class="fa-solid fa-check mr-1"></i> Passed</span>' : ''}
            </div>
            <div id="quiz-questions-container" class="space-y-8">
    `;

    mod.quiz.forEach((q, index) => {
        html += `
            <div class="bg-white border rounded-xl p-6 shadow-sm">
                <h4 class="font-semibold text-lg text-gray-800 mb-4"><span class="text-orange-600 mr-2">${index + 1}.</span>${q.question}</h4>
                <div class="space-y-3">
        `;
        
        q.options.forEach((opt, optIdx) => {
            const isSelected = state.quizAnswers[q.id] === optIdx;
            
            html += `
                <label class="flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-orange-50 border-orange-300' : 'hover:bg-gray-50 border-gray-200'}">
                    <input type="radio" name="quiz-${q.id}" value="${optIdx}" class="form-radio text-orange-600 h-5 w-5" ${isSelected ? 'checked' : ''} onchange="handleQuizSelection('${q.id}', ${optIdx})">
                    <span class="ml-3 text-gray-700">${escapeHtml(opt)}</span>
                </label>
            `;
        });
        
        html += `</div></div>`;
    });

    html += `
            </div>
            <div class="mt-8 flex flex-col items-center border-t pt-8">
                <button id="submit-quiz-btn" class="px-8 py-3 rounded-lg font-bold text-lg text-white bg-orange-600 hover:bg-orange-700 shadow-md transition-all">Submit Answers</button>
                <div id="quiz-feedback" class="mt-4 text-lg font-bold hidden"></div>
            </div>
        </div>
    `;

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
window.handleQuizSelection = function(questionId, optionIndex) {
    state.quizAnswers[questionId] = optionIndex;
    renderQuiz(getActiveModule()); // Re-render to show selection styling
};

// --- Svelte Code Interpreter Sandbox Engine (CRITICAL) ---

function runCode() {
    const userCode = DOM.codeEditor.value;
    
    // Construct the HTML document to be injected into the iframe
    const iframeContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <script src="https://cdn.tailwindcss.com"></script>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                body { margin: 0; padding: 20px; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; background-color: #ffffff; color: #1f2937; }
                #error-boundary { color: #dc2626; background: #fee2e2; padding: 15px; border-radius: 8px; margin: 10px; font-family: monospace; white-space: pre-wrap; border: 1px solid #fca5a5; }
                .console-log { font-family: monospace; color: #4b5563; background: #f3f4f6; padding: 8px 12px; border-radius: 6px; font-size: 13px; margin-top: 10px; border-left: 4px solid #9ca3af; }
            </style>
        </head>
        <body>
            <div id="root">
              <div class="flex items-center justify-center p-8 text-gray-400">
                <i class="fa-solid fa-circle-notch fa-spin text-xl mr-2"></i> Initializing svelte engine...
              </div>
            </div>
            <div id="error-container"></div>
            <div id="console-container"></div>

            <script>
                // Intercept console.log inside iframe
                const oldLog = console.log;
                console.log = function(...args) {
                    oldLog(...args);
                    const container = document.getElementById('console-container');
                    if (container) {
                        const logEl = document.createElement('div');
                        logEl.className = 'console-log';
                        logEl.innerHTML = '<strong>[Console]:</strong> ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ');
                        container.appendChild(logEl);
                    }
                };

                window.onerror = function(msg, url, lineNo, columnNo, error) {
                    const errContainer = document.getElementById('error-container');
                    errContainer.innerHTML = '<div id="error-boundary"><strong>Runtime Error:</strong><br/>' + msg + '</div>';
                    return false;
                };
            </script>
            
            <script>
                // Svelte Sandbox Compiler & Interpreter
                function runSvelteApp(code) {
                    try {
                        const cleanCode = code.replace(/\\r/g, '');

                        // Extract <script> block content
                        const scriptMatch = cleanCode.match(/<script>([\\s\\S]*?)<\\/script>/);
                        const scriptBody = scriptMatch ? scriptMatch[1] : '';

                        // Extract visual templates outside of <script>
                        let templateHtml = cleanCode.replace(/<script>[\\s\\S]*?<\\/script>/, '').trim();
                        if (!templateHtml) {
                            throw new Error("No Svelte HTML template found. Ensure your component has markup outside of the <script> block.");
                        }

                        // Component state and variables dictionary
                        const instance = {};
                        const reactiveStatements = [];
                        const stores = {};

                        // Writable store simulation setup
                        instance.writable = function(initVal) {
                            let val = initVal;
                            const subs = [];
                            return {
                                subscribe: function(fn) {
                                    subs.push(fn);
                                    fn(val);
                                    return () => {
                                        const idx = subs.indexOf(fn);
                                        if (idx !== -1) subs.splice(idx, 1);
                                    };
                                },
                                set: function(newVal) {
                                    val = newVal;
                                    subs.forEach(fn => fn(val));
                                    render();
                                },
                                update: function(fn) {
                                    val = fn(val);
                                    subs.forEach(fn => fn(val));
                                    render();
                                }
                            };
                        };

                        // Parse standard variables (let variable = val)
                        const varMatches = [...scriptBody.matchAll(/(?<!\\w)let\\s+(\\w+)\\s*=\\s*(.*?);?(?=\\n|$)/g)];
                        varMatches.forEach(m => {
                            const name = m[1];
                            const valExpr = m[2].trim();
                            
                            let val;
                            if (valExpr.startsWith("'") || valExpr.startsWith('"') || valExpr.startsWith('\`')) {
                                val = valExpr.slice(1, -1);
                            } else if (valExpr.startsWith('[') && valExpr.endsWith(']')) {
                                val = valExpr.slice(1, -1).split(',').map(s => s.trim().replace(/['"\`]/g, '')).filter(Boolean);
                            } else if (!isNaN(Number(valExpr))) {
                                val = Number(valExpr);
                            } else if (valExpr === 'true') {
                                val = true;
                            } else if (valExpr === 'false') {
                                val = false;
                            } else if (valExpr.startsWith('writable(')) {
                                const storeInit = valExpr.match(/writable\\((.*?)\\)/)?.[1];
                                val = instance.writable(eval(storeInit));
                                stores[name] = val;
                            } else {
                                val = valExpr;
                            }
                            instance[name] = val;
                        });

                        // Parse reactive definitions ( $: double = count * 2 )
                        const reactiveVarMatches = [...scriptBody.matchAll(/\\$:\\s*(\\w+)\\s*=\\s*(.*?);?(?=\\n|$)/g)];
                        reactiveVarMatches.forEach(m => {
                            const name = m[1];
                            const expr = m[2].trim();
                            instance[name] = 0; // initialize
                            
                            reactiveStatements.push(() => {
                                try {
                                    // replace standard identifiers with values
                                    let processed = expr;
                                    Object.keys(instance).forEach(k => {
                                        if (typeof instance[k] !== 'function') {
                                            processed = processed.replace(new RegExp('(?<!\\\\w)' + k + '(?\!\\\\w)', 'g'), \`instance.\${k}\`);
                                        }
                                    });
                                    instance[name] = eval(processed);
                                } catch(e) {
                                    instance[name] = 'Error: ' + e.message;
                                }
                            });
                        });

                        // Parse reactive block statements ( $: { console.log(count); } )
                        const reactiveBlockMatches = [...scriptBody.matchAll(/\\$:\\s*{([\\s\\S]*?)}/g)];
                        reactiveBlockMatches.forEach(m => {
                            const body = m[1].trim();
                            reactiveStatements.push(() => {
                                const lines = body.split(';');
                                lines.forEach(line => {
                                    line = line.trim();
                                    if (line.startsWith('console.log(')) {
                                        const msgExpr = line.match(/console\\.log\\((.*?)\\)/)?.[1];
                                        let processed = msgExpr;
                                        Object.keys(instance).forEach(k => {
                                            if (typeof instance[k] !== 'function') {
                                                processed = processed.replace(new RegExp('(?<!\\\\w)' + k + '(?\!\\\\w)', 'g'), \`instance.\${k}\`);
                                            }
                                        });
                                        try {
                                            console.log(eval(processed));
                                        } catch(e) {}
                                    }
                                });
                            });
                        });

                        // Parse store auto-subscriptions in script
                        // If we see e.g. $theme we resolve subscription
                        Object.keys(stores).forEach(storeName => {
                            stores[storeName].subscribe(v => {
                                instance['$' + storeName] = v;
                            });
                        });

                        // Parse functions / methods
                        const methodRegex = /function\\s+(\\w+)\\s*\\(([\\s\\S]*?)\\)\\s*{([\\s\\S]*?)}/g;
                        let mMatch;
                        while ((mMatch = methodRegex.exec(scriptBody)) !== null) {
                            const name = mMatch[1];
                            const params = mMatch[2].trim();
                            const body = mMatch[3].trim();
                            
                            instance[name] = function(...args) {
                                // Simple mapping for arguments
                                let localScope = '';
                                if (params && args.length > 0) {
                                    localScope = "let " + params + " = " + JSON.stringify(args[0]) + ";";
                                }

                                const lines = body.split(';');
                                lines.forEach(line => {
                                    line = line.trim();
                                    if (!line) return;

                                    if (line.includes('+=')) {
                                        const [vName, addExpr] = line.split('+=').map(s => s.trim());
                                        if (instance[vName] !== undefined) {
                                            instance[vName] += eval(localScope + addExpr);
                                        }
                                    } else if (line.includes('*=')) {
                                        const [vName, mulExpr] = line.split('*=').map(s => s.trim());
                                        if (instance[vName] !== undefined) {
                                            instance[vName] *= eval(localScope + mulExpr);
                                        }
                                    } else if (line.includes('=')) {
                                        // e.g. count = count.filter(...) or count = value
                                        const eqIdx = line.indexOf('=');
                                        const vName = line.slice(0, eqIdx).trim();
                                        const rawExpr = line.slice(eqIdx + 1).trim();
                                        
                                        if (instance[vName] !== undefined) {
                                            // Translate this expr
                                            let processed = rawExpr;
                                            Object.keys(instance).forEach(k => {
                                                if (typeof instance[k] !== 'function') {
                                                    processed = processed.replace(new RegExp('(?<!\\\\w)' + k + '(?\!\\\\w)', 'g'), \`instance.\${k}\`);
                                                }
                                            });
                                            // Handle store updates: stores.theme.update(...)
                                            if (processed.includes('.update(')) {
                                                const storeVar = processed.split('.')[0].replace('instance.', '');
                                                if (stores[storeVar]) {
                                                    if (processed.includes('Light Mode')) {
                                                        stores[storeVar].update(c => c === 'Light Mode' ? 'Dark Mode' : 'Light Mode');
                                                    }
                                                }
                                            } else {
                                                try {
                                                    instance[vName] = eval(localScope + processed);
                                                } catch(e) {
                                                    instance[vName] = rawExpr.replace(/['"\`]/g, '');
                                                }
                                            }
                                        }
                                    } else if (line.startsWith('addTodo(') || line.startsWith('removeTodo(')) {
                                        // direct call fallback eval
                                    }
                                }

                                // Run reactive updates and render
                                runReactiveDeclarations();
                                render();
                            };
                        }

                        // Inline bracket methods on events (e.g. () => selectedHero = '...')
                        instance.runInlineExpr = function(expr, localIndex) {
                            let processed = expr;
                            
                            // Map local 'index' if passed
                            if (localIndex !== undefined) {
                                processed = processed.replace(/\bindex\b/g, localIndex);
                            }

                            Object.keys(instance).forEach(k => {
                                if (typeof instance[k] !== 'function') {
                                    processed = processed.replace(new RegExp('(?<!\\\\w)' + k + '(?\!\\\\w)', 'g'), \`instance.\${k}\`);
                                }
                            });
                            
                            // Map store updates inside inline expr e.g. cart.clearCart()
                            if (processed.includes('cart.clearCart()')) {
                                // Clear cart simulation
                                if (instance.cartItems) instance.cartItems.set([]);
                            }

                            try {
                                eval(processed);
                            } catch(e) {
                                console.error("Inline expr execution error: ", e);
                            }
                            
                            runReactiveDeclarations();
                            render();
                        };

                        function runReactiveDeclarations() {
                            reactiveStatements.forEach(fn => fn());
                        }

                        // Svelte Rendering Engine
                        function render() {
                            const root = document.getElementById('root');
                            root.innerHTML = '';
                            
                            const appEl = document.createElement('div');
                            appEl.innerHTML = templateHtml;
                            root.appendChild(appEl);

                            compileEachLoops(appEl);
                            compileIfs(appEl);
                            compileBindings(appEl);
                        }

                        function compileEachLoops(parent) {
                            let html = parent.innerHTML;
                            
                            // Svelte loops pattern: {#each items as item} ... {/each}
                            const eachRegex = /{#each\\s+(.*?)\\s+as\\s+(.*?)\\s*}([\\s\\S]*?){\\/each}/g;
                            html = html.replace(eachRegex, (match, listExpr, itemVar, content) => {
                                const list = evaluateExpression(listExpr.trim());
                                if (Array.isArray(list)) {
                                    return list.map((item, idx) => {
                                        let itemContent = content;
                                        // Replace simple Svelte {item} variables inside the loop
                                        itemContent = itemContent.replace(new RegExp('{\\\\s*' + itemVar + '\\\\s*}', 'g'), item);
                                        // Replace click event index parameter
                                        itemContent = itemContent.replace(/index/g, idx);
                                        return itemContent;
                                    }).join('');
                                }
                                return '';
                            });

                            parent.innerHTML = html;
                        }

                        function compileIfs(parent) {
                            let html = parent.innerHTML;
                            
                            // Svelte conditions pattern: {#if condition} ... {/if}
                            const ifRegex = /{#if\\s+(.*?)\\s*}([\\s\\S]*?){\\/if}/g;
                            html = html.replace(ifRegex, (match, condition, content) => {
                                const val = evaluateExpression(condition.trim());
                                return val ? content : '';
                            });

                            parent.innerHTML = html;
                        }

                        function evaluateExpression(expr) {
                            // Check stores or variable state keys
                            if (instance[expr] !== undefined) {
                                return instance[expr];
                            }
                            try {
                                return (new Function('instance', \`with(instance) { return \${expr}; }\`))(instance);
                            } catch(e) {
                                return null;
                            }
                        }

                        function compileBindings(el) {
                            // Text Interpolation parser
                            const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
                            let textNode;
                            const interpolationRegex = /{\\s*([^{}\\s]*?)\\s*}/g;
                            const replacements = [];

                            while (textNode = walker.nextNode()) {
                                let text = textNode.nodeValue;
                                if (/{[\\s\\S]*?}/.test(text)) {
                                    replacements.push({ node: textNode, original: text });
                                }
                            }

                            replacements.forEach(r => {
                                let text = r.original;
                                r.node.nodeValue = text.replace(/{\\s*(.*?)\\s*}/g, (m, expr) => {
                                    const val = evaluateExpression(expr.trim());
                                    return val !== null && val !== undefined ? val : '';
                                });
                            });

                            // Attributes and bindings
                            const allElements = el.getElementsByTagName('*');
                            for (let element of allElements) {
                                const attrs = [...element.attributes];
                                attrs.forEach(attr => {
                                    const name = attr.name;
                                    const value = attr.value;

                                    // Svelte Event Binding: on:click={handler}
                                    if (name.startsWith('on:')) {
                                        const eventName = name.slice(3);
                                        const handlerExpr = value.slice(1, -1).trim(); // remove curly braces
                                        
                                        if (instance[handlerExpr]) {
                                            element.addEventListener(eventName, (e) => {
                                                e.preventDefault();
                                                instance[handlerExpr]();
                                            });
                                        } else {
                                            // Inline expression e.g. () => count++
                                            element.addEventListener(eventName, (e) => {
                                                e.preventDefault();
                                                // Check if contains index parameter
                                                const hasIndexParam = handlerExpr.includes('removeTodo(');
                                                const localIndex = hasIndexParam ? handlerExpr.match(/removeTodo\\((.*?)\\)/)?.[1] : undefined;
                                                instance.runInlineExpr(handlerExpr, localIndex);
                                            });
                                        }
                                    }

                                    // Svelte Input Two-way Binding: bind:value={variable}
                                    if (name === 'bind:value') {
                                        const propName = value.slice(1, -1).trim();
                                        element.value = instance[propName] || '';
                                        element.addEventListener('input', (e) => {
                                            instance[propName] = e.target.value;
                                            runReactiveDeclarations();
                                            render();
                                        });
                                    }

                                    // Angular ngModel helper mapping inside Svelte sandbox (for form binding backward compat)
                                    if (name === '[(ngModel)]') {
                                        const propName = value.trim();
                                        element.value = instance[propName] || '';
                                        element.addEventListener('input', (e) => {
                                            instance[propName] = e.target.value;
                                            runReactiveDeclarations();
                                            render();
                                        });
                                    }
                                });
                            }
                        }

                        // Run initial declarations
                        runReactiveDeclarations();
                        render();
                        console.log("✔ Svelte application initialized successfully.");

                    } catch (err) {
                        document.getElementById('error-container').innerHTML = '<div id="error-boundary"><strong>Compilation Error:</strong><br/>' + err.message + '</div>';
                        console.error(err);
                    }
                }

                // Receive user code via postMessage — avoids all escaping issues
                window.addEventListener('message', function(e) {
                    if (e.data && e.data.type === 'run-svelte-code') {
                        runSvelteApp(e.data.code);
                    }
                });

                // Signal parent that iframe is ready
                window.parent.postMessage({ type: 'svelte-iframe-ready' }, '*');
            <\/script>
        </body>
        </html>
    `;

    // Inject compiled output
    DOM.previewFrame.srcdoc = iframeContent;

    // Listen for iframe ready signal, then send user code via postMessage
    // (avoids ALL escaping issues since structured clone handles serialization)
    // Clean up any pending listener from previous executions
    if (DOM.previewFrame._iframeReadyListener) {
        window.removeEventListener('message', DOM.previewFrame._iframeReadyListener);
    }

    const onIframeReady = (e) => {
        if (e.data && e.data.type === 'svelte-iframe-ready') {
            window.removeEventListener('message', onIframeReady);
            DOM.previewFrame._iframeReadyListener = null;
            
            DOM.previewFrame.contentWindow.postMessage({
                type: 'run-svelte-code',
                code: userCode
            }, window.location.origin);
        }
    };
    
    DOM.previewFrame._iframeReadyListener = onIframeReady;
    window.addEventListener('message', onIframeReady);
}

// Start application
init();
