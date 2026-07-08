// State Variables
let activeModule = 0;
let activeLesson = 0;
let activeTab = 'lesson';
let userProgress = JSON.parse(localStorage.getItem('firebaseHubProgress')) || { completedLessons: [], completedQuizzes: [] };

// Mock Firebase Backend State
const mockFirestore = {
    users: {
        "user123": { name: "Alice", email: "alice@example.com", role: "admin" },
        "user456": { name: "Bob", email: "bob@example.com", role: "user" }
    },
    posts: {
        "post1": { title: "Hello Firebase", authorId: "user123", published: true }
    }
};

let mockAuthState = {
    currentUser: null // null if not logged in, object if logged in
};

let selectedCollection = null;
let selectedDocument = null;

// Curriculum Data
const curriculum = [
    {
        id: 'mod-1',
        title: 'Firebase Authentication',
        lessons: [
            {
                id: 'm1-l1',
                title: 'Sign In (Email/Password)',
                content: `
                    <div class="lesson-prose">
                        <h2>Firebase Authentication</h2>
                        <p>Firebase makes it incredibly easy to authenticate users. In modern Firebase v9 (modular), you import specific functions instead of a global object.</p>
                        <h3>Signing In</h3>
                        <pre><code>import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const auth = getAuth();
signInWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    const user = userCredential.user;
  });</code></pre>
                        <p>Go to the <strong>Simulator</strong>, run the code to sign in a mock user, and watch the App UI update!</p>
                    </div>
                `,
                defaultCode: `// Mocking signInWithEmailAndPassword
const email = "test@example.com";
const password = "password123";

signInWithEmailAndPassword(email, password)
  .then((user) => {
    console.log("Logged in as:", user.email);
  })
  .catch((error) => {
    console.error(error);
  });`
            }
        ],
        quiz: [
            {
                id: 'q1',
                question: 'In Firebase v9, how do you sign in a user with email and password?',
                options: ['firebase.auth().signIn()', 'signInWithEmailAndPassword(auth, email, pwd)', 'auth.login(email, pwd)', 'Firebase.login()'],
                correct: 1
            }
        ]
    },
    {
        id: 'mod-2',
        title: 'Firestore Basics (CRUD)',
        lessons: [
            {
                id: 'm2-l1',
                title: 'Writing Data (setDoc)',
                content: `
                    <div class="lesson-prose">
                        <h2>Cloud Firestore</h2>
                        <p>Firestore is a flexible, scalable NoSQL cloud database. Data is stored in <strong>Documents</strong>, which are organized into <strong>Collections</strong>.</p>
                        <h3>setDoc()</h3>
                        <p>Use <code>setDoc()</code> to write a document with a specific ID.</p>
                        <pre><code>import { doc, setDoc } from "firebase/firestore"; 

await setDoc(doc(db, "users", "new-user-id"), {
  name: "Charlie",
  role: "guest"
});</code></pre>
                        <p>Try running the provided code in the simulator to add a new user document to Firestore!</p>
                    </div>
                `,
                defaultCode: `// Write data to Firestore
const userData = {
  name: "Charlie",
  email: "charlie@example.com",
  role: "guest",
  createdAt: new Date().toISOString()
};

// setDoc(collectionPath, documentId, data)
setDoc("users", "user789", userData);
console.log("Document successfully written!");`
            },
            {
                id: 'm2-l2',
                title: 'Adding Data (addDoc)',
                content: `
                    <div class="lesson-prose">
                        <h2>Auto-generated IDs (addDoc)</h2>
                        <p>Sometimes you don't want to specify a document ID. You can use <code>addDoc()</code> to let Firestore generate a random ID for you.</p>
                        <pre><code>import { collection, addDoc } from "firebase/firestore";

const docRef = await addDoc(collection(db, "posts"), {
  title: "My New Post",
  published: false
});</code></pre>
                        <p>Try adding a new post in the simulator!</p>
                    </div>
                `,
                defaultCode: `// Add a document with an auto-generated ID
const postData = {
  title: "Learning Firebase is fun!",
  authorId: "user789",
  published: true
};

addDoc("posts", postData);
console.log("Post added with auto-ID");`
            }
        ],
        quiz: [
            {
                id: 'q2',
                question: 'What is the difference between setDoc and addDoc in Firestore?',
                options: ['They are exactly the same', 'setDoc requires you to specify the Document ID, addDoc auto-generates it', 'addDoc is only for Arrays', 'setDoc merges data, addDoc replaces it'],
                correct: 1
            }
        ]
    },
    {
        id: 'mod-3',
        title: 'Realtime Database vs Firestore',
        lessons: [
            {
                id: 'm3-l1',
                title: 'Understanding the Differences',
                content: `
                    <div class="lesson-prose">
                        <h2>Which Database to Choose?</h2>
                        <p>Firebase offers two cloud-based, client-accessible databases:</p>
                        <ul>
                            <li><strong>Realtime Database:</strong> The original Firebase database. It's an efficient, low-latency solution for mobile apps that require synced states across clients in realtime. Stores data as one large JSON tree.</li>
                            <li><strong>Cloud Firestore:</strong> Firebase's newest database for mobile web development. It builds on the successes of the Realtime Database with a new, more intuitive data model (Collections and Documents).</li>
                        </ul>
                        <p>Generally, Firestore is recommended for new projects due to better querying and scalability.</p>
                    </div>
                `,
                defaultCode: `// Just a conceptual lesson.
console.log("Firestore uses Collections > Documents > Fields");
console.log("Realtime DB uses one large JSON tree.");`
            }
        ],
        quiz: [
            {
                id: 'q3',
                question: 'How does Firestore structure data?',
                options: ['As one giant JSON object', 'In Tables and Rows', 'In Collections and Documents', 'In a Graph format'],
                correct: 2
            }
        ]
    }
];

// DOM Elements
const elements = {
    sidebarContent: document.getElementById('sidebar-content'),
    lessonContent: document.getElementById('lesson-content'),
    quizContent: document.getElementById('quiz-content'),
    firebaseEditor: document.getElementById('firebase-editor'),
    runCodeBtn: document.getElementById('run-code-btn'),
    editorConsole: document.getElementById('editor-console'),
    appUiState: document.getElementById('app-ui-state'),
    fsCollections: document.getElementById('fs-collections'),
    fsDocuments: document.getElementById('fs-documents'),
    fsFields: document.getElementById('fs-fields'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabPanes: document.querySelectorAll('.tab-pane'),
    progressBar: document.getElementById('progress-bar'),
    progressText: document.getElementById('progress-text'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebar-overlay')
};

// Initialization
function init() {
    renderSidebar();
    loadLesson(activeModule, activeLesson);
    updateProgress();
    renderFirestoreConsole();
    renderAppUI();
    setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.closest('button').dataset.tab);
        });
    });

    elements.runCodeBtn.addEventListener('click', runSimulation);

    // Mobile sidebar toggle
    elements.mobileMenuBtn.addEventListener('click', toggleSidebar);
    elements.sidebarOverlay.addEventListener('click', toggleSidebar);
}

function toggleSidebar() {
    const isClosed = elements.sidebar.classList.contains('-translate-x-full');
    if (isClosed) {
        elements.sidebar.classList.remove('-translate-x-full');
        elements.sidebarOverlay.classList.remove('hidden');
    } else {
        elements.sidebar.classList.add('-translate-x-full');
        elements.sidebarOverlay.classList.add('hidden');
    }
}

// Tab Management
function switchTab(tabId) {
    activeTab = tabId;
    
    // Update buttons UI
    elements.tabBtns.forEach(btn => {
        if (btn.dataset.tab === tabId) {
            btn.classList.add('active', 'border-yellow-500', 'text-yellow-600');
            btn.classList.remove('text-gray-500', 'border-transparent');
        } else {
            btn.classList.remove('active', 'border-yellow-500', 'text-yellow-600');
            btn.classList.add('text-gray-500', 'border-transparent');
        }
    });

    // Update panes UI
    elements.tabPanes.forEach(pane => {
        if (pane.id === \`\${tabId}-tab\`) {
            pane.classList.remove('hidden');
            pane.classList.add('block');
            
            if (tabId === 'simulator') {
                pane.classList.remove('block');
                pane.classList.add('flex', 'flex-col');
            }
        } else {
            pane.classList.add('hidden');
            pane.classList.remove('block', 'flex', 'flex-col');
        }
    });
}

// Sidebar Rendering
function renderSidebar() {
    let html = '';
    curriculum.forEach((mod, mIndex) => {
        html += \`
            <div class="sidebar-module">
                <h3 class="sidebar-module-title">\${mod.title}</h3>
                <ul class="space-y-1">
        \`;
        
        mod.lessons.forEach((lesson, lIndex) => {
            const isCompleted = userProgress.completedLessons.includes(lesson.id);
            const isActive = mIndex === activeModule && lIndex === activeLesson;
            
            html += \`
                <li>
                    <button class="w-full text-left sidebar-lesson \${isActive ? 'active' : ''}" 
                            onclick="loadLesson(\${mIndex}, \${lIndex})">
                        <i class="\${isCompleted ? 'fas fa-check-circle text-green-500' : 'far fa-circle text-gray-400'} mr-2 w-4"></i>
                        \${lesson.title}
                    </button>
                </li>
            \`;
        });
        
        html += \`</ul></div>\`;
    });
    
    elements.sidebarContent.innerHTML = html;
}

// Load specific lesson
function loadLesson(mIndex, lIndex) {
    activeModule = mIndex;
    activeLesson = lIndex;
    const lesson = curriculum[mIndex].lessons[lIndex];
    
    if (!userProgress.completedLessons.includes(lesson.id)) {
         markLessonComplete(lesson.id);
    }
    
    elements.lessonContent.innerHTML = lesson.content;
    elements.firebaseEditor.value = lesson.defaultCode || '';
    
    // Clear editor console
    elements.editorConsole.innerHTML = '';
    elements.editorConsole.classList.add('hidden');
    
    renderQuiz(mIndex);
    renderSidebar();
    
    if(window.innerWidth < 768 && !elements.sidebar.classList.contains('-translate-x-full')) {
        toggleSidebar();
    }
}

// Quiz Rendering
function renderQuiz(mIndex) {
    const quiz = curriculum[mIndex].quiz;
    let html = \`<h2 class="text-2xl font-bold mb-6 text-gray-800">Module Knowledge Check</h2>\`;
    
    if(!quiz || quiz.length === 0) {
        elements.quizContent.innerHTML = html + '<p>No quiz for this module.</p>';
        return;
    }

    quiz.forEach((q, i) => {
        html += \`
            <div class="mb-8 p-6 bg-yellow-50 rounded-lg border border-yellow-100 quiz-question" id="q-container-\${q.id}">
                <p class="font-semibold text-lg text-gray-800 mb-4">\${i+1}. \${q.question}</p>
                <div class="space-y-2">
        \`;
        
        q.options.forEach((opt, oIndex) => {
            html += \`
                <label class="flex items-center p-3 bg-white border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="radio" name="quiz-\${q.id}" value="\${oIndex}" class="mr-3 w-4 h-4 text-yellow-600">
                    <span class="text-gray-700">\${opt}</span>
                </label>
            \`;
        });
        
        html += \`
                </div>
                <button onclick="checkAnswer('\${q.id}', \${mIndex}, \${i})" class="mt-4 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                    Submit Answer
                </button>
                <div id="q-feedback-\${q.id}" class="mt-3 hidden text-sm font-medium"></div>
            </div>
        \`;
    });
    
    elements.quizContent.innerHTML = html;
}

// Check Quiz Answer
window.checkAnswer = function(qId, mIndex, qIndex) {
    const selected = document.querySelector(\`input[name="quiz-\${qId}"]:checked\`);
    const feedback = document.getElementById(\`q-feedback-\${qId}\`);
    const container = document.getElementById(\`q-container-\${qId}\`);
    
    if (!selected) {
        feedback.innerHTML = '<i class="fas fa-exclamation-circle mr-1"></i> Please select an answer.';
        feedback.className = 'mt-3 text-sm font-medium text-amber-600 block';
        return;
    }
    
    const correctAns = curriculum[mIndex].quiz[qIndex].correct;
    
    if (parseInt(selected.value) === correctAns) {
        feedback.innerHTML = '<i class="fas fa-check-circle mr-1"></i> Correct! Great job.';
        feedback.className = 'mt-3 text-sm font-medium text-green-600 block';
        container.classList.replace('bg-yellow-50', 'bg-green-50');
        container.classList.replace('border-yellow-100', 'border-green-200');
        
        if (!userProgress.completedQuizzes.includes(qId)) {
            userProgress.completedQuizzes.push(qId);
            saveProgress();
        }
    } else {
        feedback.innerHTML = '<i class="fas fa-times-circle mr-1"></i> Incorrect. Try again.';
        feedback.className = 'mt-3 text-sm font-medium text-red-600 block';
    }
};

// Progress Tracking
function markLessonComplete(lessonId) {
    if (!userProgress.completedLessons.includes(lessonId)) {
        userProgress.completedLessons.push(lessonId);
        saveProgress();
    }
}

function saveProgress() {
    localStorage.setItem('firebaseHubProgress', JSON.stringify(userProgress));
    updateProgress();
}

function updateProgress() {
    let totalItems = 0;
    curriculum.forEach(m => {
        totalItems += m.lessons.length;
        if(m.quiz) totalItems += m.quiz.length;
    });
    
    const completedItems = userProgress.completedLessons.length + userProgress.completedQuizzes.length;
    const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
    
    elements.progressBar.style.width = \`\${percentage}%\`;
    elements.progressText.textContent = \`\${percentage}%\`;
}

// ----------------------------------------------------
// Firebase Simulator Engine
// ----------------------------------------------------

function runSimulation() {
    const code = elements.firebaseEditor.value;
    elements.editorConsole.innerHTML = '';
    elements.editorConsole.classList.add('hidden');
    
    // Create mock functions to inject into the user's execution scope
    const setDoc = (collectionPath, documentId, data) => {
        if (!mockFirestore[collectionPath]) {
            mockFirestore[collectionPath] = {};
        }
        mockFirestore[collectionPath][documentId] = data;
        
        // Auto-select to show the change
        selectedCollection = collectionPath;
        selectedDocument = documentId;
        
        // Trigger UI updates
        renderFirestoreConsole();
        flashElement(document.querySelector('.firestore-console'));
        logToConsole(\`Success: Document '\${documentId}' written to '\${collectionPath}'\`, 'success');
    };

    const addDoc = (collectionPath, data) => {
        if (!mockFirestore[collectionPath]) {
            mockFirestore[collectionPath] = {};
        }
        // Generate random ID
        const autoId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        mockFirestore[collectionPath][autoId] = data;
        
        selectedCollection = collectionPath;
        selectedDocument = autoId;
        
        renderFirestoreConsole();
        flashElement(document.querySelector('.firestore-console'));
        logToConsole(\`Success: Document added with auto-ID '\${autoId}'\`, 'success');
        return { id: autoId }; // mock docRef
    };

    const signInWithEmailAndPassword = (email, password) => {
        return new Promise((resolve, reject) => {
            if (email && password.length >= 6) {
                mockAuthState.currentUser = {
                    uid: "simulated_user_123",
                    email: email,
                    displayName: email.split('@')[0]
                };
                renderAppUI();
                flashElement(document.querySelector('.app-ui-container'));
                logToConsole(\`Auth Success: Logged in as \${email}\`, 'success');
                resolve(mockAuthState.currentUser);
            } else {
                reject(new Error("auth/weak-password or missing email"));
            }
        });
    };

    const logToConsole = (msg, type = 'log') => {
        elements.editorConsole.classList.remove('hidden');
        const colorClass = type === 'error' ? 'text-red-600' : (type === 'success' ? 'text-green-600' : 'text-gray-700');
        elements.editorConsole.innerHTML += \`<div class="\${colorClass} mb-1">> \${msg}</div>\`;
    };

    // Override console.log within execution scope
    const mockConsole = {
        log: (...args) => logToConsole(args.join(' ')),
        error: (...args) => logToConsole(args.join(' '), 'error'),
        warn: (...args) => logToConsole(args.join(' '), 'error')
    };

    try {
        // We use new Function to create an execution scope with our injected mocks
        // Note: We avoid 'import' syntax in the textarea by keeping the code simple in lessons,
        // or we strip them out via regex before execution.
        let executableCode = code.replace(/import .*;?\n/g, ''); // strip imports for the simulator
        
        const executionScope = new Function('setDoc', 'addDoc', 'signInWithEmailAndPassword', 'console', executableCode);
        executionScope(setDoc, addDoc, signInWithEmailAndPassword, mockConsole);
        
    } catch (err) {
        logToConsole(\`Execution Error: \${err.message}\`, 'error');
    }
}

// Visual feedback helper
function flashElement(el) {
    el.classList.remove('flash-update');
    void el.offsetWidth; // trigger reflow
    el.classList.add('flash-update');
}

// ----------------------------------------------------
// UI Rendering for Simulator
// ----------------------------------------------------

function renderAppUI() {
    if (mockAuthState.currentUser) {
        elements.appUiState.innerHTML = \`
            <div class="relative inline-block mb-4">
                <i class="fas fa-user-circle text-6xl text-blue-500"></i>
                <div class="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <h3 class="text-xl font-semibold text-gray-800">Welcome back,</h3>
            <h2 class="text-2xl font-bold text-blue-600 truncate max-w-[200px]">\${mockAuthState.currentUser.displayName}</h2>
            <p class="text-gray-500 mt-2 text-sm">\${mockAuthState.currentUser.email}</p>
            <button onclick="mockLogout()" class="mt-4 px-4 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors">Sign Out</button>
        \`;
    } else {
        elements.appUiState.innerHTML = \`
            <i class="fas fa-user-circle text-6xl text-gray-300 mb-4"></i>
            <h3 class="text-xl font-semibold text-gray-700">Not Logged In</h3>
            <p class="text-gray-500 mt-2 text-sm">Run Firebase Auth code to sign in.</p>
        \`;
    }
}

window.mockLogout = function() {
    mockAuthState.currentUser = null;
    renderAppUI();
    flashElement(document.querySelector('.app-ui-container'));
}

function renderFirestoreConsole() {
    // 1. Render Collections
    const collections = Object.keys(mockFirestore);
    let colHtml = '';
    collections.forEach(col => {
        const isSel = col === selectedCollection;
        colHtml += \`
            <div class="fs-item \${isSel ? 'selected' : ''}" onclick="selectCollection('\${col}')">
                <i class="fas fa-layer-group fs-icon"></i> \${col}
            </div>
        \`;
    });
    elements.fsCollections.innerHTML = colHtml || '<div class="text-gray-500 text-xs italic text-center mt-4">No collections</div>';

    // 2. Render Documents (if a collection is selected)
    if (selectedCollection && mockFirestore[selectedCollection]) {
        const docs = Object.keys(mockFirestore[selectedCollection]);
        let docHtml = '';
        docs.forEach(doc => {
            const isSel = doc === selectedDocument;
            docHtml += \`
                <div class="fs-item \${isSel ? 'selected' : ''}" onclick="selectDocument('\${doc}')">
                    <i class="far fa-file-alt fs-icon text-blue-400"></i> \${doc}
                </div>
            \`;
        });
        elements.fsDocuments.innerHTML = docHtml || '<div class="text-gray-500 text-xs italic text-center mt-4">No documents</div>';
    } else {
        elements.fsDocuments.innerHTML = '<div class="text-gray-500 text-xs italic text-center mt-4">Select a collection</div>';
    }

    // 3. Render Fields (if a document is selected)
    if (selectedCollection && selectedDocument && mockFirestore[selectedCollection][selectedDocument]) {
        const data = mockFirestore[selectedCollection][selectedDocument];
        let fieldsHtml = '';
        for (const [key, value] of Object.entries(data)) {
            let type = typeof value;
            let displayVal = value;
            let valClass = 'string';
            
            if (type === 'string') displayVal = \`"\${value}"\`;
            if (type === 'number') valClass = 'number';
            if (type === 'boolean') valClass = 'boolean';
            
            fieldsHtml += \`
                <div class="fs-field-row">
                    <span class="fs-field-key">\${key}</span>
                    <span class="fs-field-type">(\${type})</span>
                    <span class="fs-field-value \${valClass}">\${displayVal}</span>
                </div>
            \`;
        }
        elements.fsFields.innerHTML = fieldsHtml || '<div class="text-gray-500 text-xs italic text-center mt-4">Empty document</div>';
    } else {
        elements.fsFields.innerHTML = '<div class="text-gray-500 text-xs italic text-center mt-4">Select a document</div>';
    }
}

window.selectCollection = function(colName) {
    selectedCollection = colName;
    selectedDocument = null; // reset doc selection
    renderFirestoreConsole();
};

window.selectDocument = function(docId) {
    selectedDocument = docId;
    renderFirestoreConsole();
};

// Run init on load
document.addEventListener('DOMContentLoaded', init);
