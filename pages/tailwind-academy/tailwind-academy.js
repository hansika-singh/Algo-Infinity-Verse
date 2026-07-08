// --- Tailwind CSS Academy Curriculum Data ---
const curriculum = [
    {
        id: "utility-first",
        title: "1. Utility-First CSS Basics",
        lessons: [
            {
                id: "utility-1",
                title: "Introduction to Utilities",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Utility-First Workflow</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Tailwind is a <strong>utility-first CSS framework</strong>. Instead of writing custom class selectors like <code>.btn-blue</code>, you style elements directly by composing low-level utility classes like <code>bg-blue-500 text-white font-bold py-2 px-4 rounded</code>.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">This prevents bloated CSS stylesheets, speeds up visual styling, and keeps styles local to your HTML elements.</p>
                    <div class="bg-sky-50 border-l-4 border-sky-500 p-4 my-6 rounded-r-lg">
                        <p class="text-sky-800 font-medium"><i class="fa-solid fa-circle-info mr-2"></i>Go to the <strong>Playground & Code</strong> tab, click "Run Code" to compile, and check the preview browser!</p>
                    </div>
                `,
                defaultCode: `<div class="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-lg flex items-center space-x-4 border border-sky-100">
  <div class="shrink-0 bg-sky-100 p-3 rounded-full">
    <svg class="h-10 w-10 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  </div>
  <div>
    <div class="text-xl font-medium text-black">Tailwind CSS</div>
    <p class="text-slate-500 text-sm">Building components fast without leaving your HTML code.</p>
  </div>
</div>`
            }
        ],
        quiz: [
            {
                id: "q-utility-1",
                question: "What does 'utility-first' mean in Tailwind CSS?",
                options: [
                    "You write helper functions in JavaScript",
                    "You compose styles using predefined, single-purpose classes directly in HTML",
                    "You write custom CSS variables in a global stylesheet",
                    "You write class selectors like .card and .button"
                ],
                correct: 1
            },
            {
                id: "q-utility-2",
                question: "Which class adds 1rem (16px) of padding inside all sides of an element?",
                options: ["padding-4", "pad-1", "p-4", "p-16"],
                correct: 2
            }
        ]
    },
    {
        id: "flexbox",
        title: "2. Flexbox Layouts",
        lessons: [
            {
                id: "flexbox-1",
                title: "Flex Containers and Alignment",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Flexible Grid Structures</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Tailwind makes Flexbox simple by providing direct classes to declare containers and align child nodes:</p>
                    <ul class="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                        <li><code>flex</code>: Sets the element wrapper to <code>display: flex</code>.</li>
                        <li><code>flex-col</code>: Changes flex direction to columns.</li>
                        <li><code>justify-between</code>: Distributes items evenly (main axis space-between).</li>
                        <li><code>items-center</code>: Centers items vertically (cross axis alignment).</li>
                        <li><code>space-x-4</code>: Adds horizontal margins between sibling elements.</li>
                    </ul>
                `,
                defaultCode: `<div class="p-4 bg-gray-50 rounded-xl space-y-4">
  <h4 class="font-bold text-gray-800 text-sm">Flex Row: Space Between</h4>
  
  <div class="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
    <span class="font-semibold text-slate-700">User Dashboard</span>
    <div class="flex space-x-2">
      <button class="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1 text-xs font-bold rounded">Cancel</button>
      <button class="bg-sky-500 hover:bg-sky-600 text-white px-3 py-1 text-xs font-bold rounded shadow-sm">Save Profiles</button>
    </div>
  </div>
</div>`
            }
        ],
        quiz: [
            {
                id: "q-flex-1",
                question: "Which class enables display: flex on an element?",
                options: ["display-flex", "layout-flex", "flex", "flexbox"],
                correct: 2
            }
        ]
    },
    {
        id: "grid",
        title: "3. CSS Grid System",
        lessons: [
            {
                id: "grid-1",
                title: "Grid Columns and Gaps",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Multi-Column Layout grids</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">CSS Grid excels at layout structures. Use the following classes to define dynamic responsive layouts:</p>
                    <ul class="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                        <li><code>grid</code>: Sets the display to grid.</li>
                        <li><code>grid-cols-3</code>: Creates a grid with 3 equal columns.</li>
                        <li><code>gap-4</code>: Adds 1rem space gaps between rows and columns.</li>
                        <li><code>col-span-2</code>: Causes a child item to span across 2 grid columns.</li>
                    </ul>
                `,
                defaultCode: `<div class="p-6 bg-slate-50 min-h-screen">
  <h3 class="text-lg font-extrabold text-slate-800 mb-4">Grid Dashboard Items</h3>
  
  <div class="grid grid-cols-3 gap-4">
    <div class="col-span-2 bg-blue-500 text-white p-6 rounded-lg shadow font-bold">
      Primary Feature Block (col-span-2)
    </div>
    <div class="bg-white text-slate-700 p-6 rounded-lg shadow border font-bold">
      Stat Card 1
    </div>
    <div class="bg-white text-slate-700 p-6 rounded-lg shadow border font-bold">
      Stat Card 2
    </div>
    <div class="bg-white text-slate-700 p-6 rounded-lg shadow border font-bold">
      Stat Card 3
    </div>
    <div class="bg-white text-slate-700 p-6 rounded-lg shadow border font-bold">
      Stat Card 4
    </div>
  </div>
</div>`
            }
        ],
        quiz: [
            {
                id: "q-grid-1",
                question: "Which class configures a grid container to have 4 columns?",
                options: ["cols-4", "grid-cols-4", "columns-4", "grid-4"],
                correct: 1
            }
        ]
    },
    {
        id: "typography",
        title: "4. Typography & Borders",
        lessons: [
            {
                id: "typography-1",
                title: "Customizing Text and Visual Accents",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Styling Content</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Tailwind has exhaustive typography and border configurations:</p>
                    <ul class="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                        <li><code>text-lg</code>, <code>text-4xl</code>: Handles font sizing.</li>
                        <li><code>font-bold</code>, <code>font-light</code>: Handles font weight.</li>
                        <li><code>tracking-wider</code>: Handles letter-spacing.</li>
                        <li><code>border border-slate-300</code>: Adds solid border outlines.</li>
                        <li><code>rounded-xl</code>, <code>rounded-full</code>: Defines border radius curves.</li>
                        <li><code>shadow-md</code>, <code>shadow-inner</code>: Renders drop shadows.</li>
                    </ul>
                `,
                defaultCode: `<div class="p-6 bg-white max-w-sm mx-auto rounded-2xl shadow-xl border border-gray-100 text-center space-y-4">
  <h2 class="text-2xl font-black text-slate-900 tracking-tight">Premium Membership</h2>
  <p class="text-gray-500 font-medium text-sm">Access core DSA challenges and interactive learning pages.</p>
  
  <div class="py-3 border-t border-b border-gray-100 font-mono text-3xl font-extrabold text-indigo-600">
    $9.99/mo
  </div>
  
  <button class="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-sm shadow-md transition-colors">
    Subscribe Now
  </button>
</div>`
            }
        ],
        quiz: [
            {
                id: "q-typo-1",
                question: "Which class makes an element completely circular by setting border-radius?",
                options: ["rounded-full", "rounded-circle", "rounded-xl", "circle"],
                correct: 0
            }
        ]
    },
    {
        id: "responsive",
        title: "5. Responsive Breakpoints",
        lessons: [
            {
                id: "responsive-1",
                title: "Mobile-First prefix modifiers",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Breakpoints System</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Tailwind uses a **mobile-first** responsive design system. Styles without prefixes apply to mobile. Prefixed classes apply at larger viewports:</p>
                    <ul class="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                        <li><code>sm:</code>: Matches small screens (640px+).</li>
                        <li><code>md:</code>: Matches tablets (768px+).</li>
                        <li><code>lg:</code>: Matches desktop screens (1024px+).</li>
                        <li><code>xl:</code>: Matches large screens (1280px+).</li>
                    </ul>
                    <div class="bg-sky-50 border-l-4 border-sky-500 p-4 my-6 rounded-r-lg">
                        <p class="text-sky-800 font-medium"><i class="fa-solid fa-circle-info mr-2"></i>Use the viewport size toggles (<strong>Mobile, Tablet, Desktop</strong>) above the iframe preview to test how the layouts adjust!</p>
                    </div>
                `,
                defaultCode: `<div class="p-6 bg-slate-100 min-h-screen flex items-center justify-center">
  <!-- Layout changes direction from vertical (mobile) to horizontal (tablet/desktop) -->
  <div class="w-full max-w-md md:max-w-2xl bg-white rounded-xl shadow-md overflow-hidden flex flex-col md:flex-row">
    <div class="md:shrink-0 bg-indigo-500 h-48 md:h-full md:w-48 flex items-center justify-center text-white font-bold">
      Preview Cover
    </div>
    <div class="p-8">
      <div class="uppercase tracking-wide text-xs text-indigo-500 font-bold">Responsive Layout</div>
      <h2 class="block mt-1 text-lg font-bold text-black hover:underline leading-tight">Composing Flex Directions</h2>
      <p class="mt-2 text-slate-500 text-sm">Resize this preview to see the layout stack vertically on mobile screens.</p>
    </div>
  </div>
</div>`
            }
        ],
        quiz: [
            {
                id: "q-resp-1",
                question: "Which class direction is implemented by default in Tailwind before prefixes are applied?",
                options: ["Desktop-First styling", "Mobile-First styling", "Server-Side styling", "Grid-Only styling"],
                correct: 1
            }
        ]
    },
    {
        id: "dark-mode",
        title: "6. Dark Mode Support",
        lessons: [
            {
                id: "dark-1",
                title: "The dark: prefix modifier",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Dark Themes</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Tailwind has built-in support for theme switching. Prepend any utility class with the <code>dark:</code> prefix to apply it only when dark mode is enabled on the HTML container.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">For class-based toggling, add <code>class="dark"</code> to the <code>&lt;html&gt;</code> tag.</p>
                `,
                defaultCode: `<div class="p-6 max-w-sm mx-auto rounded-xl shadow-lg border space-y-4 bg-white text-slate-900 border-gray-100 dark:bg-slate-900 dark:text-white dark:border-slate-800">
  <div class="flex justify-between items-center">
    <span class="text-xs text-gray-400 font-bold uppercase">Settings Widget</span>
    <span class="bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300 text-[10px] font-bold px-2 py-0.5 rounded">Enabled</span>
  </div>
  
  <h4 class="text-md font-bold">Theme Adaptive Component</h4>
  <p class="text-xs text-slate-500 dark:text-slate-400">This card changes colors under dark mode. (Enable dark class on wrapper node).</p>
</div>`
            }
        ],
        quiz: [
            {
                id: "q-dark-1",
                question: "Which prefix enables styling elements under dark mode themes?",
                options: ["theme-dark:", "dark-mode:", "dark:", "black:"],
                correct: 2
            }
        ]
    },
    {
        id: "pseudo",
        title: "7. Hover, Active & Focus States",
        lessons: [
            {
                id: "pseudo-1",
                title: "Interactive State Modifiers",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Visual Interactions</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Tailwind helps you customize buttons and link responses using state prefixes:</p>
                    <ul class="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                        <li><code>hover:bg-sky-600</code>: Modifies background color on mouse hover.</li>
                        <li><code>active:scale-95</code>: Shrinks component slightly on click activation.</li>
                        <li><code>focus:ring-2 focus:ring-sky-500</code>: Adds blue outlines when tabbed.</li>
                    </ul>
                `,
                defaultCode: `<div class="p-6 bg-white border rounded-xl shadow-sm space-y-4 max-w-sm mx-auto">
  <h4 class="font-bold text-slate-800">Interactive Sign In</h4>
  
  <input 
    type="text" 
    placeholder="Enter Username" 
    class="w-full p-2.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
  />

  <button class="w-full py-2.5 bg-sky-500 text-white rounded-lg font-bold text-xs hover:bg-sky-600 active:scale-[0.98] transition-all shadow-sm">
    Submit Session
  </button>
</div>`
            }
        ],
        quiz: [
            {
                id: "q-pseudo-1",
                question: "Which state modifier changes class behaviors when a user clicks/holds down an element?",
                options: ["hover:", "focus:", "active:", "click:"],
                correct: 2
            }
        ]
    },
    {
        id: "animations",
        title: "8. Transitions & Animations",
        lessons: [
            {
                id: "animations-1",
                title: "Smooth Layout Changes and Keyframes",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Motions and Transitions</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Apply transitions by adding classes like <code>transition-all</code> and setting durations (<code>duration-300</code>). Tailwind has 4 built-in infinite keyframe animations:</p>
                    <ul class="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                        <li><code>animate-spin</code>: Rotates elements (loading spinners).</li>
                        <li><code>animate-ping</code>: Creates scaling radar circles.</li>
                        <li><code>animate-pulse</code>: Gently fades opacity in and out.</li>
                        <li><code>animate-bounce</code>: Moves components up and down.</li>
                    </ul>
                `,
                defaultCode: `<div class="p-6 bg-white border rounded-xl shadow-sm text-center space-y-6 max-w-sm mx-auto">
  <h4 class="font-bold text-slate-800">Visual Load States</h4>
  
  <div class="flex justify-center items-center gap-4">
    <!-- Spinner -->
    <div class="w-8 h-8 border-4 border-slate-200 border-t-sky-500 rounded-full animate-spin"></div>
    
    <!-- Bounce -->
    <div class="w-4 h-4 bg-sky-500 rounded-full animate-bounce"></div>
    
    <!-- Ping -->
    <span class="relative flex h-3 w-3">
      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
      <span class="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
    </span>
  </div>
</div>`
            }
        ],
        quiz: [
            {
                id: "q-anim-1",
                question: "Which animation class is ideal for showing infinite rotation load circles?",
                options: ["animate-bounce", "animate-pulse", "animate-ping", "animate-spin"],
                correct: 3
            }
        ]
    },
    {
        id: "capstone",
        title: "9. Capstone Project",
        lessons: [
            {
                id: "capstone-1",
                title: "Mini Profile Dashboard",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Portfolio Profile Card</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Let's compile everything you have mastered inside a single Profile Dashboard widget. This project tests grids, responsive breakpoint scaling, shadow accents, layouts, and button states.</p>
                `,
                defaultCode: `<div class="p-6 bg-slate-50 min-h-screen flex items-center justify-center font-sans">
  <div class="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden border border-gray-100">
    <div class="bg-gradient-to-r from-sky-400 to-indigo-500 h-28"></div>
    <div class="px-6 pb-6 relative">
      <!-- Profile image offset -->
      <div class="w-20 h-20 bg-sky-100 rounded-full border-4 border-white absolute -top-10 left-6 flex items-center justify-center font-bold text-sky-600 shadow-md">
        TW
      </div>
      
      <div class="pt-12">
        <h3 class="text-xl font-bold text-slate-800">Tailwind developer</h3>
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Frontend Specialist</p>
      </div>

      <p class="mt-4 text-slate-600 text-sm">Passionate about responsive utility structures, clean grid flex alignments, and premium interface designs.</p>

      <div class="mt-6 flex justify-between pt-4 border-t text-center">
        <div>
          <span class="block text-xs font-bold text-gray-400">Projects</span>
          <span class="font-extrabold text-slate-800">14</span>
        </div>
        <div>
          <span class="block text-xs font-bold text-gray-400">Score</span>
          <span class="font-extrabold text-slate-800">98%</span>
        </div>
        <div>
          <span class="block text-xs font-bold text-gray-400">Rank</span>
          <span class="font-extrabold text-slate-800">Gold</span>
        </div>
      </div>
    </div>
  </div>
</div>`
            }
        ],
        quiz: [
            {
                id: "q-caps-1",
                question: "Which class creates horizontal layouts on screens larger than 768px wide, remaining vertical on smaller screens?",
                options: ["flex flex-row md:flex-col", "flex flex-col md:flex-row", "grid grid-cols-2", "row-layout"],
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
    quizAnswers: {} // format: { 'q-utility-1': 1 }
};

// Load state from local storage
function loadProgress() {
    try {
        const saved = localStorage.getItem('tailwindAcademyProgress');
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
        localStorage.setItem('tailwindAcademyProgress', JSON.stringify(state.completedItems));
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
    previewFrame: document.getElementById('preview-frame'),
    previewFrameWrapper: document.getElementById('preview-frame-wrapper'),
    viewportBtns: document.querySelectorAll('.viewport-btn')
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

    // Sizing viewport listeners
    DOM.viewportBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const size = btn.getAttribute('data-size');
            changeViewportSize(size);
        });
    });
    
    // Allow basic tab indentation in textarea
    DOM.codeEditor.addEventListener('keydown', function(e) {
        if (e.key == 'Tab') {
            e.preventDefault();
            var start = this.selectionStart;
            var end = this.selectionEnd;
            this.value = this.value.substring(0, start) + "    " + this.value.substring(end);
            this.selectionStart = this.selectionEnd = start + 4;
        }
    });
}

function changeViewportSize(size) {
    DOM.previewFrameWrapper.className = "preview-container-wrapper flex-1 bg-white flex flex-col"; // reset base
    
    // Reset buttons
    DOM.viewportBtns.forEach(btn => {
        btn.classList.remove('bg-sky-100', 'text-sky-700', 'border-sky-300');
    });

    // Add active sizes
    if (size === 'mobile') {
        DOM.previewFrameWrapper.classList.add('preview-mobile');
        document.getElementById('btn-view-mobile').classList.add('bg-sky-100', 'text-sky-700', 'border-sky-300');
    } else if (size === 'tablet') {
        DOM.previewFrameWrapper.classList.add('preview-tablet');
        document.getElementById('btn-view-tablet').classList.add('bg-sky-100', 'text-sky-700', 'border-sky-300');
    } else {
        DOM.previewFrameWrapper.classList.add('preview-desktop');
        document.getElementById('btn-view-desktop').classList.add('bg-sky-100', 'text-sky-700', 'border-sky-300');
    }
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
        btn.className = `w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${isActive ? 'bg-sky-50 text-sky-800 font-semibold border-l-4 border-sky-600' : 'hover:bg-gray-100 text-gray-700 border-l-4 border-transparent'}`;
        btn.onclick = () => changeModule(mod.id);
        
        const textSpan = document.createElement('span');
        textSpan.className = 'truncate block text-sm';
        textSpan.innerText = mod.title;
        
        btn.appendChild(textSpan);
        
        if (isModuleComplete) {
            const checkIcon = document.createElement('i');
            checkIcon.className = 'fa-solid fa-check-circle text-sky-600';
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
                <button id="mark-lesson-complete" class="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${isCompleted ? 'bg-gray-200 text-gray-700 cursor-default' : 'bg-sky-600 text-white hover:bg-sky-700 shadow-md'}">
                    ${isCompleted ? '<i class="fa-solid fa-check"></i> Completed' : 'Mark as Complete & Continue'}
                </button>
            </div>
        </div>
    `;

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
                ${isCompleted ? '<span class="inline-block mt-3 bg-sky-100 text-sky-800 px-3 py-1 rounded-full text-sm font-semibold"><i class="fa-solid fa-check mr-1"></i> Passed</span>' : ''}
            </div>
            <div id="quiz-questions-container" class="space-y-8">
    `;

    mod.quiz.forEach((q, index) => {
        html += `
            <div class="bg-white border rounded-xl p-6 shadow-sm">
                <h4 class="font-semibold text-lg text-gray-800 mb-4"><span class="text-sky-600 mr-2">${index + 1}.</span>${q.question}</h4>
                <div class="space-y-3">
        `;
        
        q.options.forEach((opt, optIdx) => {
            const isSelected = state.quizAnswers[q.id] === optIdx;
            
            html += `
                <label class="flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-sky-50 border-sky-300' : 'hover:bg-gray-50 border-gray-200'}">
                    <input type="radio" name="quiz-${q.id}" value="${optIdx}" class="form-radio text-sky-600 h-5 w-5" ${isSelected ? 'checked' : ''} onchange="handleQuizSelection('${q.id}', ${optIdx})">
                    <span class="ml-3 text-gray-700 text-sm">${opt}</span>
                </label>
            `;
        });
        
        html += `</div></div>`;
    });

    html += `
            </div>
            <div class="mt-8 flex flex-col items-center border-t pt-8">
                <button id="submit-quiz-btn" class="px-8 py-3 rounded-lg font-bold text-lg text-white bg-sky-600 hover:bg-sky-700 shadow-md transition-all">Submit Answers</button>
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

// --- Tailwind HTML Renderer Live Preview Sandbox ---

function runCode() {
    const userCode = DOM.codeEditor.value;
    
    // Inject Tailwind CSS via CDN and Font Awesome inside iframe sandbox
    const iframeContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <script src="https://cdn.tailwindcss.com"></script>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <style>
                body { margin: 0; padding: 20px; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; background-color: transparent; }
                /* Custom dark mode utility helpers inside iframe container */
                html.dark { background-color: #0f172a; color: #f8fafc; }
            </style>
            <script>
                // Intercept console messages
                const oldLog = console.log;
                console.log = function(...args) {
                    oldLog(...args);
                };
            </script>
        </head>
        <body class="transition-colors duration-300">
            ${userCode}
        </body>
        </html>
    `;

    DOM.previewFrame.srcdoc = iframeContent;
}

// Start application
init();
