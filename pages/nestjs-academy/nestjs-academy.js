// --- NestJS Academy Curriculum Data ---
const curriculum = [
    {
        id: "architecture",
        title: "1. NestJS Architecture Basics",
        lessons: [
            {
                id: "arch-1",
                title: "Introduction & AppModule",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">What is NestJS?</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">NestJS is a progressive Node.js framework for building efficient, reliable, and scalable server-side applications. It is built with and fully supports **TypeScript** and combines elements of OOP, FP, and FRP.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Under the hood, NestJS uses robust HTTP server frameworks like **Express** or **Fastify**. It organizes code in a modular tree structure starting from the **AppModule**.</p>
                    <div class="bg-rose-50 border-l-4 border-rose-500 p-4 my-6 rounded-r-lg">
                        <p class="text-rose-800 font-medium"><i class="fa-solid fa-circle-info mr-2"></i>Go to the <strong>Playground & Code</strong> tab, click "Run Code" to compile and boot the Nest application inside the terminal!</p>
                    </div>
                `,
                defaultCode: `import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}`
            }
        ],
        quiz: [
            {
                id: "q-arch-1",
                question: "Which programming language does NestJS build on top of by default?",
                options: ["Pure JavaScript", "Python", "TypeScript", "Rust"],
                correct: 2
            },
            {
                id: "q-arch-2",
                question: "What is the decorator used to define a NestJS Module class?",
                options: ["@Controller", "@Module", "@Injectable", "@Component"],
                correct: 1
            }
        ]
    },
    {
        id: "controllers",
        title: "2. Controllers & Routing",
        lessons: [
            {
                id: "controllers-1",
                title: "Request Handlers and Decorators",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Defining API Endpoints</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed"><strong>Controllers</strong> are responsible for handling incoming **requests** and returning **responses** to the client. A controller is created by decorating a class with <code>@Controller('prefix')</code>.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">You define route mapping using HTTP method decorators like <code>@Get()</code>, <code>@Post()</code>, <code>@Put()</code>, and <code>@Delete()</code>. Retrieve payloads and parameters using param decorators like <code>@Body()</code> or <code>@Param()</code>.</p>
                `,
                defaultCode: `import { Controller, Get, Post, Body, Param } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get()
  findAll() {
    return [
      { id: 1, username: 'aditya_dev' },
      { id: 2, username: 'claudecode' }
    ];
  }

  @Post()
  create(@Body() body: any) {
    return {
      success: true,
      message: 'User created successfully',
      data: body
    };
  }
}`
            }
        ],
        quiz: [
            {
                id: "q-control-1",
                question: "Which decorator is used to prefix all routes defined inside a controller class?",
                options: ["@Route", "@Controller", "@Module", "@Get"],
                correct: 1
            },
            {
                id: "q-control-2",
                question: "Which parameter decorator extracts the request body payload in a POST request?",
                options: ["@Param()", "@Query()", "@Req()", "@Body()"],
                correct: 3
            }
        ]
    },
    {
        id: "providers",
        title: "3. Services & Providers",
        lessons: [
            {
                id: "providers-1",
                title: "Dependency Injection",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Decoupling Business Logic</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">In NestJS, almost everything is a **Provider** (services, repositories, factories). Providers can be injected into other classes via constructor parameters using NestJS's **Dependency Injection (DI)** container.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">A service provider is declared using the <code>@Injectable()</code> decorator, registering it to be managed by the Nest runtime container.</p>
                `,
                defaultCode: `import { Injectable, Controller, Get } from '@nestjs/common';

@Injectable()
export class TasksService {
  private tasks = ['Build compiler', 'Create database', 'Write tests'];
  
  getTasks() {
    return this.tasks;
  }
}

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  getAll() {
    return this.tasksService.getTasks();
  }
}`
            }
        ],
        quiz: [
            {
                id: "q-prov-1",
                question: "What decorator marks a service class to be managed by Nest's Dependency Injection system?",
                options: ["@Service()", "@Injectable()", "@Module()", "@Provider()"],
                correct: 1
            }
        ]
    },
    {
        id: "modules",
        title: "4. Modules & Dynamic Modules",
        lessons: [
            {
                id: "modules-1",
                title: "Encapsulating Feature Domains",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Modular Application Structure</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Modules organize your application structure. Each application has at least one root module. Modules encapsulate providers by default; to share a service, it must be listed in the <code>exports</code> array of the module declaration.</p>
                `,
                defaultCode: `import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // Shared with other modules
})
export class UsersModule {}`
            }
        ],
        quiz: [
            {
                id: "q-mod-1",
                question: "To make a module's service available to other modules, where must you declare it?",
                options: ["imports array", "providers array", "exports array", "controllers array"],
                correct: 2
            }
        ]
    },
    {
        id: "pipes",
        title: "5. Pipes & Data Validation",
        lessons: [
            {
                id: "pipes-1",
                title: "Validation Pipes and DTOs",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Validating Request Payloads</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed"><strong>Pipes</strong> have two main use cases: **transformation** (parse strings to numbers, etc.) and **validation** (evaluate request body schemas against rule declarations).</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">By coupling **DTOs** (Data Transfer Objects) with validation classes, Nest validates incoming payloads automatically before they reach controller route methods.</p>
                `,
                defaultCode: `import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';

export class CreateTaskDto {
  title: string;
  description: string;
}

@Controller('tasks')
export class TasksController {
  @Post()
  @UsePipes(new ValidationPipe())
  create(@Body() dto: CreateTaskDto) {
    if (!dto.title) {
      return {
        statusCode: 400,
        message: 'Title is required',
        error: 'Bad Request'
      };
    }
    return { success: true, data: dto };
  }
}`
            }
        ],
        quiz: [
            {
                id: "q-pipe-1",
                question: "What is a main purpose of Pipes in NestJS?",
                options: ["Connecting database models", "Transforming or validating request parameters and body", "Securing route authorization", "Rerouting HTTP traffic"],
                correct: 1
            }
        ]
    },
    {
        id: "guards",
        title: "6. Guards & Authentication",
        lessons: [
            {
                id: "guards-1",
                title: "Route Protection & AuthGuards",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Route Authorization</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed"><strong>Guards</strong> determine whether a request will be handled by the route handler or blocked. They have access to the execution context, making them ideal for authentication checks.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">A Guard must implement the <code>CanActivate</code> interface and return a boolean indicating whether the request is authorized.</p>
                `,
                defaultCode: `import { Injectable, CanActivate, ExecutionContext, Controller, Get, UseGuards } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    
    // Simulating authorization header validation
    return authHeader === 'Bearer secret-key';
  }
}

@Controller('admin')
@UseGuards(AuthGuard)
export class AdminController {
  @Get()
  getDashboard() {
    return { secretData: 'Backend Server Admin Panel Access Granted' };
  }
}`
            }
        ],
        quiz: [
            {
                id: "q-guard-1",
                question: "What interface must a Guard class implement to decide if a route is authorized?",
                options: ["CanActivate", "UseGuards", "ExecutionGuard", "AuthInterceptor"],
                correct: 0
            }
        ]
    },
    {
        id: "interceptors",
        title: "7. Interceptors & Logging",
        lessons: [
            {
                id: "interceptors-1",
                title: "Response Mapping and Latency Loggers",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Transforming Streams</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed"><strong>Interceptors</strong> allow you to bind extra logic before and after method execution. This is extremely powerful for response mapping, exception catching, cache invalidation, or computing request duration metrics.</p>
                `,
                defaultCode: `import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    console.log('[LoggingInterceptor]: Request intercepted (Before)...');
    
    const now = Date.now();
    return next
      .handle()
      .pipe(
        tap(() => console.log(\`[LoggingInterceptor]: Request completed (After) in \${Date.now() - now}ms\`)),
      );
  }
}`
            }
        ],
        quiz: [
            {
                id: "q-inter-1",
                question: "Which programming pattern does NestJS use for managing Async streams in Interceptors?",
                options: ["Callbacks", "Promises", "RxJS Observables", "Async/Await only"],
                correct: 2
            }
        ]
    },
    {
        id: "database",
        title: "8. Database Integration (ORM)",
        lessons: [
            {
                id: "db-1",
                title: "Entities and Repositories",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Interacting with SQL databases</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">NestJS provides native wrappers for ORMs like **TypeORM** and **Prisma**. Components use repositories to retrieve, save, and update entities without raw SQL commands.</p>
                `,
                defaultCode: `import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  findOne(id: number): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }
}`
            }
        ],
        quiz: [
            {
                id: "q-db-1",
                question: "Which decorator is used to inject a TypeORM database repository into an Injectable service class?",
                options: ["@Inject()", "@Repository()", "@InjectRepository()", "@Database()"],
                correct: 2
            }
        ]
    },
    {
        id: "graphql",
        title: "9. GraphQL Resolver APIs",
        lessons: [
            {
                id: "graphql-1",
                title: "Resolvers, Queries and Mutations",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">GraphQL Server integration</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">In GraphQL APIs, instead of HTTP route controllers, you define **Resolvers** decorated with <code>@Resolver()</code>, using <code>@Query()</code> and <code>@Mutation()</code> decorators for mapping query definitions.</p>
                `,
                defaultCode: `import { Resolver, Query, Args, Int } from '@nestjs/graphql';

@Resolver()
export class BookResolver {
  @Query(() => String)
  hello() {
    return 'Hello GraphQL!';
  }

  @Query(() => [String])
  getBooks() {
    return ['Clean Code', 'System Design Interview'];
  }
}`
            }
        ],
        quiz: [
            {
                id: "q-gql-1",
                question: "Which decorator replaces @Get() when defining fetch queries inside a GraphQL resolver?",
                options: ["@Resolve()", "@Query()", "@GetQuery()", "@Mutation()"],
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
    quizAnswers: {} // format: { 'q-arch-1': 1 }
};

// Simulated compiled controllers dictionary
let compiledControllers = {};

// Load state from local storage
function loadProgress() {
    try {
        const saved = localStorage.getItem('nestjsAcademyProgress');
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
        localStorage.setItem('nestjsAcademyProgress', JSON.stringify(state.completedItems));
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
    terminalWindow: document.getElementById('simulated-terminal'),
    
    // HTTP API Client DOM
    requestMethod: document.getElementById('request-method'),
    requestPath: document.getElementById('request-path'),
    requestHeaders: document.getElementById('request-headers'),
    requestBody: document.getElementById('request-body'),
    sendRequestBtn: document.getElementById('send-request-btn'),
    responseStatus: document.getElementById('response-status'),
    responseBody: document.getElementById('response-body')
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
    DOM.runCodeBtn.addEventListener('click', compileAndBootNestApp);

    // Send HTTP Request simulation
    DOM.sendRequestBtn.addEventListener('click', handleApiRequestDispatch);
    
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
        
        // Reset Terminal and Postman Client status
        DOM.terminalWindow.innerHTML = '<p class="term-dim">// Press "Run Code" to compile and start the server.</p>';
        DOM.responseStatus.innerText = '000';
        DOM.responseStatus.className = 'px-2 py-1 rounded bg-slate-200 text-slate-800';
        DOM.responseBody.innerText = '{}';
        
        compiledControllers = {};

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
        btn.className = `w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${isActive ? 'bg-rose-50 text-rose-800 font-semibold border-l-4 border-rose-600' : 'hover:bg-gray-100 text-gray-700 border-l-4 border-transparent'}`;
        btn.onclick = () => changeModule(mod.id);
        
        const textSpan = document.createElement('span');
        textSpan.className = 'truncate block text-sm';
        textSpan.innerText = mod.title;
        
        btn.appendChild(textSpan);
        
        if (isModuleComplete) {
            const checkIcon = document.createElement('i');
            checkIcon.className = 'fa-solid fa-check-circle text-rose-600';
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
            <div class="prose max-w-none text-gray-800 font-sans">
                ${lesson.content}
            </div>
            
            <div class="mt-12 pt-6 border-t border-gray-200 flex justify-end">
                <button id="mark-lesson-complete" class="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${isCompleted ? 'bg-gray-200 text-gray-700 cursor-default' : 'bg-rose-600 text-white hover:bg-rose-700 shadow-md'}">
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
        <div class="max-w-3xl mx-auto animate-fade-in pb-12 font-sans">
            <div class="mb-8 border-b pb-4">
                <h2 class="text-3xl font-bold text-gray-900">Module Quiz</h2>
                ${isCompleted ? '<span class="inline-block mt-3 bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-sm font-semibold"><i class="fa-solid fa-check mr-1"></i> Passed</span>' : ''}
            </div>
            <div id="quiz-questions-container" class="space-y-8">
    `;

    mod.quiz.forEach((q, index) => {
        html += `
            <div class="bg-white border rounded-xl p-6 shadow-sm">
                <h4 class="font-semibold text-lg text-gray-800 mb-4"><span class="text-rose-600 mr-2">${index + 1}.</span>${q.question}</h4>
                <div class="space-y-3">
        `;
        
        q.options.forEach((opt, optIdx) => {
            const isSelected = state.quizAnswers[q.id] === optIdx;
            
            html += `
                <label class="flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-rose-50 border-rose-300' : 'hover:bg-gray-50 border-gray-200'}">
                    <input type="radio" name="quiz-${q.id}" value="${optIdx}" class="form-radio text-rose-600 h-5 w-5" ${isSelected ? 'checked' : ''} onchange="handleQuizSelection('${q.id}', ${optIdx})">
                    <span class="ml-3 text-gray-700 text-sm">${opt}</span>
                </label>
            `;
        });
        
        html += `</div></div>`;
    });

    html += `
            </div>
            <div class="mt-8 flex flex-col items-center border-t pt-8">
                <button id="submit-quiz-btn" class="px-8 py-3 rounded-lg font-bold text-lg text-white bg-rose-600 hover:bg-rose-700 shadow-md transition-all">Submit Answers</button>
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

// --- NestJS Sandbox Engine Compiler ---

function printLogLine(level, msg) {
    const timestamp = new Date().toLocaleString();
    const pid = '84930';
    let lineClass = 'text-slate-300';
    
    if (level === 'ERROR') lineClass = 'text-red-500 font-bold';
    if (level === 'WARN') lineClass = 'text-amber-500';
    if (level === 'SUCCESS') lineClass = 'text-green-400 font-semibold';
    
    const formatted = `<p class="terminal-line"><span class="text-green-400 font-bold">[Nest] ${pid}  - </span>${timestamp}   <span class="${lineClass}">${level}</span> <span class="text-slate-200">${msg}</span></p>`;
    DOM.terminalWindow.innerHTML += formatted;
    DOM.terminalWindow.scrollTop = DOM.terminalWindow.scrollHeight;
}

function compileAndBootNestApp() {
    DOM.terminalWindow.innerHTML = '';
    printLogLine('LOG', 'Starting Nest application...');
    
    const code = DOM.codeEditor.value;
    
    try {
        const cleanCode = code.replace(/\r/g, '');
        
        // 1. Module Compilation Check
        if (cleanCode.includes('@Module')) {
            printLogLine('LOG', 'AppModule dependencies resolved.');
            printLogLine('LOG', 'InstanceLoader: AppModule dependency trees initialized successfully.');
            printLogLine('LOG', 'RoutesResolver: Successfully mapped controllers endpoints.');
            printLogLine('SUCCESS', 'Nest application successfully bootstrapped. Server listening on http://localhost:3000/');
            return;
        }
        
        // 2. Controller Routing Resolver Simulation
        const controllerMatch = cleanCode.match(/@Controller\s*\(\s*['"`](.*?)['"`]\s*\)/);
        if (!controllerMatch) {
            throw new Error("Could not map routing paths: missing @Controller('route') decorator declaration.");
        }
        
        const controllerPath = controllerMatch[1];
        printLogLine('LOG', `InstanceLoader: Initializing routes mapping inside controller context: /${controllerPath}`);
        
        // Map HTTP handlers (e.g. @Get(), @Post('subpath'))
        const getMatches = [...cleanCode.matchAll(/@Get\s*\(\s*(?:['"`](.*?)['"`])?\s*\)/g)];
        const postMatches = [...cleanCode.matchAll(/@Post\s*\(\s*(?:['"`](.*?)['"`])?\s*\)/g)];
        
        const handlers = { GET: [], POST: [] };
        
        getMatches.forEach(m => {
            const subpath = m[1] || '';
            const fullPath = subpath ? `${controllerPath}/${subpath}` : controllerPath;
            handlers.GET.push(fullPath);
            printLogLine('LOG', `RoutesResolver: Mapped {/${fullPath}, GET} route handler`);
        });

        postMatches.forEach(m => {
            const subpath = m[1] || '';
            const fullPath = subpath ? `${controllerPath}/${subpath}` : controllerPath;
            handlers.POST.push(fullPath);
            printLogLine('LOG', `RoutesResolver: Mapped {/${fullPath}, POST} route handler`);
        });
        
        // Save compilation details
        compiledControllers = {
            prefix: controllerPath,
            handlers: handlers,
            code: cleanCode
        };
        
        printLogLine('SUCCESS', 'Nest application successfully started. API server active at port 3000');

    } catch (err) {
        printLogLine('ERROR', `Initialization error: ${err.message}`);
        compiledControllers = {};
    }
}

// --- HTTP Client Dispatcher Mock ---

function handleApiRequestDispatch() {
    const method = DOM.requestMethod.value;
    const inputPath = DOM.requestPath.value.trim().replace(/^\//, ''); // strip leading slash
    const headersStr = DOM.requestHeaders.value.trim();
    const bodyStr = DOM.requestBody.value.trim();
    
    // Default response status mapping helper
    const updateResponseUI = (statusCode, payload) => {
        DOM.responseStatus.innerText = statusCode;
        
        if (statusCode >= 200 && statusCode < 300) {
            DOM.responseStatus.className = 'px-2 py-1 rounded bg-green-100 text-green-800 font-bold';
        } else if (statusCode >= 400) {
            DOM.responseStatus.className = 'px-2 py-1 rounded bg-red-100 text-red-800 font-bold';
        } else {
            DOM.responseStatus.className = 'px-2 py-1 rounded bg-slate-100 text-slate-800';
        }
        
        DOM.responseBody.innerText = typeof payload === 'object' ? JSON.stringify(payload, null, 2) : payload;
    };
    
    // Check if application is booted
    if (Object.keys(compiledControllers).length === 0) {
        updateResponseUI(503, {
            statusCode: 503,
            message: 'Nest backend service offline. Boot Nest application first by clicking "Run Code".',
            error: 'Service Unavailable'
        });
        return;
    }
    
    const controller = compiledControllers;
    
    // Match route handler
    const availableRoutes = controller.handlers[method] || [];
    const isMatched = availableRoutes.includes(inputPath);
    
    if (!isMatched) {
        updateResponseUI(404, {
            statusCode: 404,
            message: `Cannot ${method} /${inputPath}`,
            error: 'Not Found'
        });
        return;
    }
    
    // Route matching successful!
    // Evaluate guards checks in Svelte-like sandbox rules
    if (controller.code.includes('AuthGuard')) {
        // Look for Bearer secret-key header validation
        if (!headersStr.includes('Bearer secret-key') && !headersStr.toLowerCase().includes('authorization: bearer secret-key')) {
            updateResponseUI(403, {
                statusCode: 403,
                message: 'Forbidden resource: Access denied by AuthGuard.',
                error: 'Forbidden'
            });
            return;
        }
    }
    
    // Evaluate payload validations for DTO / ValidationPipe checks
    if (controller.code.includes('ValidationPipe') && method === 'POST') {
        try {
            const bodyObj = bodyStr ? JSON.parse(bodyStr) : {};
            if (!bodyObj.title) {
                updateResponseUI(400, {
                    statusCode: 400,
                    message: ['title must be a string', 'title should not be empty'],
                    error: 'Bad Request'
                });
                return;
            }
        } catch (e) {
            updateResponseUI(400, {
                statusCode: 400,
                message: 'Malformed JSON payload request',
                error: 'Bad Request'
            });
            return;
        }
    }
    
    // Parse dynamic controller values based on code edits
    if (method === 'GET' && inputPath === 'users') {
        updateResponseUI(200, [
            { id: 1, username: 'aditya_dev' },
            { id: 2, username: 'claudecode' }
        ]);
    } else if (method === 'POST' && inputPath === 'users') {
        let parsedBody = {};
        try { if(bodyStr) parsedBody = JSON.parse(bodyStr); } catch(e) {}
        updateResponseUI(201, {
            success: true,
            message: 'User created successfully',
            data: parsedBody
        });
    } else if (method === 'GET' && inputPath === 'tasks') {
        updateResponseUI(200, ['Build compiler', 'Create database', 'Write tests']);
    } else if (method === 'POST' && inputPath === 'tasks') {
        let parsedBody = {};
        try { if(bodyStr) parsedBody = JSON.parse(bodyStr); } catch(e) {}
        updateResponseUI(201, {
            success: true,
            data: parsedBody
        });
    } else if (method === 'GET' && inputPath === 'admin') {
        updateResponseUI(200, { secretData: 'Backend Server Admin Panel Access Granted' });
    } else {
        // Fallback response for successfully mapped paths
        updateResponseUI(200, {
            success: true,
            message: `Mock response from Nest handler at ${inputPath}`
        });
    }
}

// Start application
init();
