// --- Angular Academy Curriculum Data ---
const curriculum = [
    {
        id: "basics",
        title: "Angular Basics & Components",
        lessons: [
            {
                id: "basics-1",
                title: "Introduction to Standalone Components",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">What is Angular?</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Angular is a powerful, enterprise-grade frontend framework developed by Google. Modern Angular (v17+) is built on a <strong>standalone component architecture</strong>, eliminating the complex NgModules of the past.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">An Angular Component is defined by a class decorated with <code>@Component</code>. The decorator defines metadata like the HTML tag name (<code>selector</code>) and layout (<code>template</code>).</p>
                    <div class="bg-rose-50 border-l-4 border-rose-500 p-4 my-6 rounded-r-lg">
                        <p class="text-rose-800 font-medium"><i class="fa-solid fa-circle-info mr-2"></i>Switch to the <strong>Playground</strong> tab. Click "Run Code" to compile and see your component render in real-time!</p>
                    </div>
                `,
                defaultCode: `import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: \`
    <div class="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-lg flex flex-col items-center space-y-4 border border-rose-100">
      <div class="p-3 bg-rose-100 rounded-full">
        <i class="fa-brands fa-angular text-4xl text-rose-600"></i>
      </div>
      <h1 class="text-2xl font-bold text-slate-900">Angular Academy</h1>
      <p class="text-slate-500 text-center text-sm">Master Angular fundamentals: signals, components, and dependency injection.</p>
    </div>
  \`
})
export class AppComponent {
  title = 'angular-academy';
}`
            }
        ],
        quiz: [
            {
                id: "q-basics-1",
                question: "Which decorator is used to define an Angular component?",
                options: ["@Directive", "@Component", "@Module", "@Injectable"],
                correct: 1
            },
            {
                id: "q-basics-2",
                question: "Which metadata option specifies the custom HTML element tag selector for a component?",
                options: ["tag", "template", "selector", "imports"],
                correct: 2
            }
        ]
    },
    {
        id: "bindings",
        title: "Templates & Data Binding",
        lessons: [
            {
                id: "bindings-1",
                title: "Template Bindings & Control Flow",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Interpolation, Directives, and Event Binding</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Angular templates feature powerful data binding syntaxes:</p>
                    <ul class="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                        <li><strong>Interpolation:</strong> <code>{{ value }}</code> outputs a class property as text.</li>
                        <li><strong>Property Binding:</strong> <code>[disabled]="isDisabled"</code> binds DOM attributes.</li>
                        <li><strong>Event Binding:</strong> <code>(click)="handleClick()"</code> listens to browser events.</li>
                        <li><strong>Two-Way Binding:</strong> <code>[(ngModel)]="username"</code> synchronizes form controls with properties.</li>
                    </ul>
                    <p class="mb-4 text-gray-700 leading-relaxed">In Angular 17+, built-in control blocks like <code>@if (condition) {}</code> and <code>@for (item of items; track item) {}</code> handle conditional rendering and lists natively and performantly.</p>
                `,
                defaultCode: `import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-binding',
  standalone: true,
  imports: [FormsModule],
  template: \`
    <div class="space-y-4 font-sans p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
      <h3 class="text-lg font-bold text-gray-800">Interactive Greeting Card</h3>
      
      <div>
        <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Enter your name</label>
        <input [(ngModel)]="username" placeholder="Type a name..." class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-rose-500" />
      </div>

      <p class="text-sm font-medium">
        Hello, <span class="text-rose-600 font-bold">{{ username || 'Guest' }}</span>!
      </p>

      @if (username) {
        <button (click)="resetName()" class="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded hover:bg-rose-700 transition-colors shadow">
          Clear Name
        </button>
      }
    </div>
  \`
})
export class BindingComponent {
  username = 'Angular Developer';
  resetName() {
    this.username = '';
  }
}`
            }
        ],
        quiz: [
            {
                id: "q-bindings-1",
                question: "Which syntax is used for property binding in Angular?",
                options: ["(property)", "{{property}}", "[property]", "*property"],
                correct: 2
            },
            {
                id: "q-bindings-2",
                question: "What is the new built-in control flow statement for loops in Angular v17+?",
                options: ["*ngFor", "@for", "for-in", "ng-repeat"],
                correct: 1
            }
        ]
    },
    {
        id: "services",
        title: "Services & Dependency Injection",
        lessons: [
            {
                id: "services-1",
                title: "Understanding Dependency Injection",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Services & The DI Tree</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">In Angular, <strong>Services</strong> are classes dedicated to business logic and data sharing, marked by the <code>@Injectable</code> decorator.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Angular uses <strong>Dependency Injection (DI)</strong> to request services. Rather than instantiating them manually (<code>new MyService()</code>), you declare them as constructor parameters. Angular resolves and injects them automatically.</p>
                `,
                defaultCode: `import { Injectable, Component } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  log(msg: string) {
    console.log('[LoggerService]: ' + msg);
  }
}

@Component({
  selector: 'app-service-demo',
  standalone: true,
  template: \`
    <div class="p-6 bg-white shadow-sm border border-gray-100 rounded-lg text-center space-y-4">
      <p class="text-gray-600 text-sm">Logging operations occur inside the services layer. Check the console log below after clicking!</p>
      <button (click)="triggerLog()" class="px-4 py-2 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800">
        Trigger Service Logger
      </button>
    </div>
  \`
})
export class ServiceDemoComponent {
  constructor(private logger: LoggerService) {}
  triggerLog() {
    this.logger.log('Action performed in Component, logged via DI Logger!');
  }
}`
            }
        ],
        quiz: [
            {
                id: "q-services-1",
                question: "How do you declare that a service is available application-wide under Angular's root injector?",
                options: ["@Injectable({ providedIn: 'root' })", "providedIn: 'any'", "@Injectable({ global: true })", "By importing it in main.ts"],
                correct: 0
            }
        ]
    },
    {
        id: "rxjs",
        title: "RxJS & Reactive Programming",
        lessons: [
            {
                id: "rxjs-1",
                title: "Observables and Streams",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Reactive programming with RxJS</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Angular utilizes **RxJS** (Reactive Extensions for JavaScript) for managing asynchronous flows, events, and API streams via <strong>Observables</strong>.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Instead of single callback events or promises, Observables emit streams of values over time. You subscribe to listen, and modify streams using pipes and functional operators like <code>map</code>, <code>filter</code>, or <code>take</code>.</p>
                `,
                defaultCode: `import { Component } from '@angular/core';
import { interval, map, take } from 'rxjs';

@Component({
  selector: 'app-rxjs-demo',
  standalone: true,
  template: \`
    <div class="p-6 bg-violet-50 border border-violet-100 rounded-xl text-center space-y-4">
      <h3 class="text-lg font-bold text-violet-900">RxJS Stream Tester</h3>
      <p class="text-xs text-violet-700">Subscribes to interval(1000) mapped to multiples of 10.</p>
      
      <div class="text-4xl font-mono text-violet-800 font-extrabold py-2">
        Value: {{ currentNumber }}
      </div>

      <button (click)="subscribeStream()" class="px-4 py-2 bg-violet-600 text-white rounded text-xs font-bold hover:bg-violet-700 shadow">
        Subscribe & Start Ticking
      </button>
    </div>
  \`
})
export class RxjsComponent {
  currentNumber = 0;
  subscribeStream() {
    interval(1000).pipe(
      take(5),
      map(x => (x + 1) * 10)
    ).subscribe(val => {
      this.currentNumber = val;
    });
  }
}`
            }
        ],
        quiz: [
            {
                id: "q-rxjs-1",
                question: "Which Angular template pipe is used to subscribe directly to an Observable and clean up on destruction?",
                options: ["subscribe", "async", "stream", "resolve"],
                correct: 1
            }
        ]
    },
    {
        id: "routing",
        title: "Angular Routing",
        lessons: [
            {
                id: "routing-1",
                title: "Routes and Router Outlet",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Single Page Routing</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Angular has built-in routing modules allowing single-page app (SPA) transition. Components are swapped in and out inside the <code>&lt;router-outlet&gt;</code> element placeholder.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">To link pages without reloading the page, use the <code>routerLink</code> directive instead of standard <code>href</code> links.</p>
                `,
                defaultCode: `import { Component } from '@angular/core';

@Component({
  selector: 'app-routing-demo',
  standalone: true,
  template: \`
    <div class="p-6 bg-white border border-gray-200 rounded-xl space-y-4 shadow-sm">
      <h3 class="text-md font-bold text-slate-800">App Routing Simulation</h3>
      
      <nav class="flex space-x-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
        <a class="text-xs text-rose-600 font-bold hover:underline cursor-pointer">Dashboard</a>
        <a class="text-xs text-slate-500 font-bold hover:underline cursor-pointer">User Profile</a>
      </nav>

      <div class="p-4 border border-dashed border-rose-300 rounded bg-rose-50/20 min-h-[60px] flex items-center justify-center">
        <p class="text-xs text-rose-800">
          &lt;router-outlet&gt; Active: Welcome to Dashboard Component!
        </p>
      </div>
    </div>
  \`
})
export class RoutingDemoComponent {}`
            }
        ],
        quiz: [
            {
                id: "q-routing-1",
                question: "What element serves as a placeholder where components for active routes are rendered?",
                options: ["<router-view>", "<route-outlet>", "<router-outlet>", "<ng-route>"],
                correct: 2
            }
        ]
    },
    {
        id: "forms",
        title: "Forms (Template & Reactive)",
        lessons: [
            {
                id: "forms-1",
                title: "Model Validation with Reactive Forms",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Structured Form Submissions</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Angular supplies two styles of forms: <strong>Template-Driven Forms</strong> (suited for simple binding) and <strong>Reactive Forms</strong> (recommended for complex logic, testability, and reactive validations).</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Reactive forms use model objects (<code>FormGroup</code> and <code>FormControl</code>) defined in component TS classes, linking them directly to input elements in the view template.</p>
                `,
                defaultCode: `import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-forms-demo',
  standalone: true,
  template: \`
    <div class="p-6 bg-white border rounded-xl shadow-sm space-y-4 max-w-sm mx-auto">
      <h3 class="text-lg font-bold text-gray-800">Secure Account Signup</h3>
      
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-semibold text-gray-500 mb-1">Email</label>
          <input [(ngModel)]="email" placeholder="example@email.com" class="w-full p-2 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-emerald-500" />
        </div>

        <button 
          (click)="submitForm()" 
          [disabled]="!email.includes('@')" 
          class="w-full py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded disabled:opacity-50 transition-opacity"
        >
          Submit Application
        </button>
      </div>
    </div>
  \`
})
export class FormsComponent {
  email = '';
  submitForm() {
    alert('Submitted email: ' + this.email);
  }
}`
            }
        ],
        quiz: [
            {
                id: "q-forms-1",
                question: "Which class from Reactive Forms is used to define a collection of form controls?",
                options: ["FormControl", "FormBuilder", "FormGroup", "FormArray"],
                correct: 2
            }
        ]
    },
    {
        id: "signals",
        title: "Signals (Modern Angular)",
        lessons: [
            {
                id: "signals-1",
                title: "Reactive State with Signals",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Reactive Signals: fine-grained reactivity</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed"><strong>Signals</strong> are the biggest change in Angular's rendering engine. A Signal is a wrapper around a value that notifies interested consumers when that value changes.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Angular signals are highly performant because they enable <strong>fine-grained reactivity</strong>. Instead of traversing the entire component tree to check for changes, Angular knows exactly which DOM node depends on which signal and updates only that node.</p>
                    <ul class="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                        <li><code>signal(initialValue)</code>: Declares a writeable signal.</li>
                        <li><code>computed(() => expression)</code>: Declares a read-only signal derived from other signals.</li>
                        <li><code>effect(() => operation)</code>: Performs side effects when dependent signals change.</li>
                    </ul>
                `,
                defaultCode: `import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-signals-demo',
  standalone: true,
  template: \`
    <div class="p-6 bg-amber-50/50 border border-amber-200 rounded-xl text-center space-y-4 max-w-sm mx-auto shadow-sm">
      <h3 class="text-lg font-black text-amber-900">Signals State Sandbox</h3>
      
      <div class="flex justify-center items-center gap-6 py-2">
        <div class="text-center">
          <span class="block text-[10px] uppercase font-bold text-gray-400">Count</span>
          <span class="text-2xl font-bold text-gray-800">{{ count() }}</span>
        </div>
        <div class="text-center">
          <span class="block text-[10px] uppercase font-bold text-gray-400">Double</span>
          <span class="text-2xl font-bold text-amber-600">{{ doubleCount() }}</span>
        </div>
      </div>

      <div class="flex gap-2 justify-center">
        <button (click)="increment()" class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs shadow-sm">
          Increment
        </button>
        <button (click)="decrement()" class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded font-bold text-xs hover:bg-gray-50 shadow-sm">
          Decrement
        </button>
      </div>
    </div>
  \`
})
export class SignalsDemoComponent {
  count = signal(0);
  doubleCount = computed(() => this.count() * 2);

  increment() {
    this.count.update(c => c + 1);
  }
  decrement() {
    this.count.update(c => c - 1);
  }
}`
            }
        ],
        quiz: [
            {
                id: "q-signals-1",
                question: "How do you read the value of a Signal in an Angular component or template?",
                options: ["signal.value", "signal()", "signal.get()", "readSignal(signal)"],
                correct: 1
            },
            {
                id: "q-signals-2",
                question: "Which reactive block is used to declare a derived signal in Angular?",
                options: ["effect()", "computed()", "signal()", "derive()"],
                correct: 1
            }
        ]
    },
    {
        id: "state",
        title: "State Management",
        lessons: [
            {
                id: "state-1",
                title: "Signal-based Cart Services",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Signal-driven Stores</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">For application-level state management, you can create Angular services that contain writeable signals, exposing them as computed properties to components. This provides a lightweight alternative to external libraries like NgRx.</p>
                `,
                defaultCode: `import { Injectable, Component, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  cartItems = signal([]);
  
  items = computed(() => this.cartItems());
  totalCount = computed(() => this.cartItems().length);

  addToCart(item: string) {
    this.cartItems.update(items => [...items, item]);
  }
  clearCart() {
    this.cartItems.set([]);
  }
}

@Component({
  selector: 'app-cart-demo',
  standalone: true,
  template: \`
    <div class="p-6 bg-white border border-gray-200 rounded-xl space-y-4 max-w-sm mx-auto shadow-sm">
      <div class="flex justify-between items-center">
        <h3 class="font-bold text-gray-800">Stateful Shop Cart</h3>
        <span class="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full">
          {{ cart.totalCount() }} Items
        </span>
      </div>

      <div class="flex gap-2">
        <button (click)="addProduct()" class="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-xs shadow-sm">
          Add Angular Book
        </button>
        <button (click)="cart.clearCart()" class="px-3 py-2 bg-gray-100 text-gray-600 rounded font-semibold text-xs hover:bg-gray-200 border">
          Clear
        </button>
      </div>
    </div>
  \`
})
export class CartComponent {
  constructor(public cart: CartService) {}
  addProduct() {
    this.cart.addToCart('Angular Book');
  }
}`
            }
        ],
        quiz: [
            {
                id: "q-state-1",
                question: "What is a main advantage of a service-based Signal store over traditional state managers?",
                options: ["It requires Zone.js", "It automatically handles REST calls", "It provides fine-grained reactive updates with virtually zero boilerplate", "It executes code on the server"],
                correct: 2
            }
        ]
    },
    {
        id: "capstone",
        title: "Mini Projects & Capstone",
        lessons: [
            {
                id: "capstone-1",
                title: "Weather Dashboard Capstone",
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Capstone Widget Application</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Congratulations on reaching the final module of the Angular Academy! You will build a complete Weather Dashboard application here.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">This mini-project brings together Components, Two-Way bindings, Signals, Computed properties, and conditional control flows inside a single dashboard.</p>
                `,
                defaultCode: `import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-weather-widget',
  standalone: true,
  template: \`
    <div class="p-6 bg-gradient-to-br from-indigo-900 to-indigo-950 text-white border border-indigo-800 rounded-2xl shadow-xl space-y-4 max-w-sm mx-auto">
      <div class="flex justify-between items-center border-b border-indigo-800 pb-3">
        <h3 class="font-bold text-sm">Weather Station v2</h3>
        <span class="text-[10px] tracking-wider uppercase font-bold text-indigo-300">Live Simulator</span>
      </div>

      <div class="space-y-1">
        <input [(ngModel)]="city" placeholder="Search City (e.g. New York)..." class="w-full p-2 bg-indigo-900/50 border border-indigo-800 rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-400" />
      </div>

      <div class="text-center py-4">
        <h2 class="text-xl font-bold">{{ city || 'Select City' }}</h2>
        <div class="text-5xl font-black text-rose-400 py-1">{{ temp() }}°C</div>
        <p class="text-xs text-indigo-300">Conditions: Sunny with clearing clouds</p>
      </div>

      <div class="flex gap-2">
        <button (click)="heatUp()" class="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 rounded text-xs font-bold">Simulate Heat</button>
        <button (click)="coolDown()" class="flex-1 py-1.5 bg-indigo-700 hover:bg-indigo-600 rounded text-xs font-bold">Simulate Rain</button>
      </div>
    </div>
  \`
})
export class WeatherComponent {
  city = 'Austin';
  temp = signal(32);

  heatUp() {
    this.temp.update(t => t + 2);
  }
  coolDown() {
    this.temp.update(t => t - 2);
  }
}`
            }
        ],
        quiz: [
            {
                id: "q-capstone-1",
                question: "Which decorator is used to expose classes for Dependency Injection in Angular?",
                options: ["@Component", "@Injectable", "@Inject", "@Directive"],
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
    quizAnswers: {} // format: { 'q-basics-1': 1 }
};

// Load state from local storage
function loadProgress() {
    try {
        const saved = localStorage.getItem('angularAcademyProgress');
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
        localStorage.setItem('angularAcademyProgress', JSON.stringify(state.completedItems));
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
        activeContent.classList.add('active', 'flex', 'md:flex-row'); // split pane display
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
        btn.className = `w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${isActive ? 'bg-rose-50 text-rose-800 font-semibold border-l-4 border-rose-600' : 'hover:bg-gray-100 text-gray-700 border-l-4 border-transparent'}`;
        btn.onclick = () => changeModule(mod.id);
        
        const textSpan = document.createElement('span');
        textSpan.className = 'truncate block';
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
            <div class="prose max-w-none text-gray-800">
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
        <div class="max-w-3xl mx-auto animate-fade-in pb-12">
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
                    <span class="ml-3 text-gray-700">${opt}</span>
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

// --- Angular Code Interpreter Sandbox Engine (CRITICAL) ---

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
                <i class="fa-solid fa-circle-notch fa-spin text-xl mr-2"></i> Initializing angular application...
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
                // Mock forms module support helper
                const ngModelDirective = {
                    ngModel: ""
                };

                // Standalone Mini Compiler
                function runAngularApp(code) {
                    try {
                        const cleanCode = code.replace(/\\r/g, '');

                        // Extract @Component metadata
                        const componentMatch = cleanCode.match(/@Component\\s*\\(\\s*\\{([\\s\\S]*?)\\}\\s*\\)/);
                        if (!componentMatch) {
                            throw new Error("Could not find @Component decorator. Check that you have @Component({...}) defined.");
                        }

                        const decoratorBody = componentMatch[1];
                        
                        // Extract selector
                        const selectorMatch = decoratorBody.match(/selector\\s*:\\s*['"\`](.*?)['"\`]/);
                        const selector = selectorMatch ? selectorMatch[1] : 'app-root';

                        // Extract template
                        const templateMatch = decoratorBody.match(/template\\s*:\\s*\`([\\s\\S]*?)\`/);
                        if (!templateMatch) {
                            throw new Error("Could not find template inside @Component. Ensure you use backticks for template: \`...\`.");
                        }
                        let templateHtml = templateMatch[1];

                        // Extract class body
                        const classMatch = cleanCode.match(/export\\s+class\\s+(\\w+)[\\s\\S]*?{([\\s\\S]*)}/);
                        if (!classMatch) {
                            throw new Error("Could not find Component class. Ensure your component is exported as 'export class XComponent { ... }'.");
                        }
                        const className = classMatch[1];
                        const classBody = classMatch[2];

                        // Define component state instance
                        const instance = {};
                        const signals = {};

                        // Parse reactive signals
                        const signalMatches = [...classBody.matchAll(/(\\w+)\\s*=\\s*signal\\((.*?)\\);?/g)];
                        signalMatches.forEach(m => {
                            const name = m[1];
                            let valExpr = m[2].trim();
                            let defaultVal;
                            
                            if (valExpr.startsWith('[') && valExpr.endsWith(']')) {
                                defaultVal = [];
                            } else if (valExpr.startsWith('{') && valExpr.endsWith('}')) {
                                defaultVal = {};
                            } else if (valExpr.startsWith("'") || valExpr.startsWith('"') || valExpr.startsWith('\`')) {
                                defaultVal = valExpr.slice(1, -1);
                            } else if (valExpr === 'true') {
                                defaultVal = true;
                            } else if (valExpr === 'false') {
                                defaultVal = false;
                            } else if (!isNaN(Number(valExpr))) {
                                defaultVal = Number(valExpr);
                            } else {
                                defaultVal = valExpr;
                            }

                            let stateVal = defaultVal;
                            const signalFn = function(newVal) {
                                if (newVal !== undefined) {
                                    stateVal = newVal;
                                    return;
                                }
                                return stateVal;
                            };
                            signalFn.update = function(updateFn) {
                                stateVal = updateFn(stateVal);
                                render();
                            };
                            signalFn.set = function(v) {
                                stateVal = v;
                                render();
                            };
                            signalFn.isSignal = true;

                            instance[name] = signalFn;
                            signals[name] = signalFn;
                        });

                        // Parse computed values
                        const computedMatches = [...classBody.matchAll(/(\\w+)\\s*=\\s*computed\\(\\(\\)\\s*=>\\s*(.*?)\\);?/g)];
                        computedMatches.forEach(m => {
                            const name = m[1];
                            const bodyExpr = m[2].trim();
                            instance[name] = function() {
                                let processedExpr = bodyExpr;
                                Object.keys(signals).forEach(sigName => {
                                    processedExpr = processedExpr.replace(new RegExp('this.' + sigName + '\\\\s*\\\\(\\\\)', 'g'), \`instance.\${sigName}()\`);
                                });
                                try {
                                    return eval(processedExpr);
                                } catch(e) {
                                    return 'Error: ' + e.message;
                                }
                            };
                            instance[name].isSignal = true;
                        });

                        // Parse standard class fields/properties
                        const propMatches = [...classBody.matchAll(/(?<!let\\s|const\\s|var\\s)(\\w+)\\s*=\\s*(.*?);?(?=\\n|$)/g)];
                        propMatches.forEach(m => {
                            const name = m[1];
                            const valExpr = m[2].trim();
                            if (name === 'template' || name === 'selector' || name === 'standalone') return;
                            if (instance[name] !== undefined) return;

                            let val;
                            if (valExpr.startsWith("'") || valExpr.startsWith('"')) {
                                val = valExpr.slice(1, -1);
                            } else if (!isNaN(Number(valExpr))) {
                                val = Number(valExpr);
                            } else if (valExpr === 'true') {
                                val = true;
                            } else if (valExpr === 'false') {
                                val = false;
                            } else {
                                val = valExpr;
                            }
                            instance[name] = val;
                        });

                        // DI Services simulation injection
                        const constructorMatch = classBody.match(/constructor\\s*\\(([\\s\\S]*?)\\)/);
                        if (constructorMatch) {
                            const params = constructorMatch[1].split(',').map(p => p.trim());
                            params.forEach(param => {
                                const parts = param.split(':').map(pt => pt.trim());
                                if (parts.length > 0) {
                                    const argName = parts[0].split(' ').pop();
                                    if (argName === 'logger') {
                                        instance.logger = {
                                            log: function(msg) {
                                                console.log(msg);
                                            }
                                        };
                                    }
                                    if (argName === 'cart') {
                                        instance.cart = {
                                            totalCount: function() { return instance.cartItems ? instance.cartItems().length : 0; },
                                            addToCart: function(item) {
                                                if (instance.cartItems) instance.cartItems.update(items => [...items, item]);
                                                else console.log('Added to cart: ' + item);
                                            },
                                            clearCart: function() {
                                                if (instance.cartItems) instance.cartItems.set([]);
                                                else console.log('Cart cleared.');
                                            }
                                        };
                                    }
                                }
                            });
                        }

                        // Parse methods
                        const methodRegex = /(?<!constructor)(\\w+)\\s*\\(\\)\\s*{([\\s\\S]*?)}/g;
                        let mMatch;
                        while ((mMatch = methodRegex.exec(classBody)) !== null) {
                            const name = mMatch[1];
                            const body = mMatch[2].trim();
                            instance[name] = function() {
                                const lines = body.split(';');
                                lines.forEach(line => {
                                    line = line.trim();
                                    if (!line) return;
                                    
                                    if (line.startsWith('this.')) {
                                        const statement = line.slice(5);
                                        if (statement.includes('.update(')) {
                                            const sigName = statement.split('.')[0];
                                            const action = statement.match(/\\.update\\((.*?)\\)/)?.[1];
                                            if (instance[sigName] && instance[sigName].update) {
                                                if (action.includes('+ 2')) instance[sigName].update(c => c + 2);
                                                else if (action.includes('- 2')) instance[sigName].update(c => c - 2);
                                                else if (action.includes('+ 1')) instance[sigName].update(c => c + 1);
                                                else if (action.includes('- 1')) instance[sigName].update(c => c - 1);
                                                else if (action.includes('[...')) {
                                                    const itemMatch = action.match(/\\[\\.\\.\\.\\w+,\\s*(.*?)\\]/);
                                                    const itemVal = itemMatch ? itemMatch[1].replace(/['"\`]/g, '') : 'Angular Book';
                                                    instance[sigName].update(items => [...items, itemVal]);
                                                }
                                            }
                                        } else if (statement.includes('.set(')) {
                                            const sigName = statement.split('.')[0];
                                            const valStr = statement.match(/\\.set\\((.*?)\\)/)?.[1];
                                            if (instance[sigName] && instance[sigName].set) {
                                                if (valStr === '[]') instance[sigName].set([]);
                                                else instance[sigName].set(eval(valStr));
                                            }
                                        } else if (statement.includes('=')) {
                                            const eqIdx = statement.indexOf('=');
                                            const propName = statement.slice(0, eqIdx).trim();
                                            const rawVal = statement.slice(eqIdx + 1).trim();
                                            try {
                                                if (rawVal.startsWith('this.')) {
                                                    instance[propName] = instance[rawVal.slice(5)];
                                                } else {
                                                    instance[propName] = eval(rawVal);
                                                }
                                            } catch(e) {
                                                instance[propName] = rawVal.replace(/['"\`]/g, '');
                                            }
                                        } else if (statement.includes('.log(')) {
                                            const logMsg = statement.match(/\\.log\\((.*?)\\)/)?.[1];
                                            if (instance.logger) instance.logger.log(eval(logMsg));
                                            else console.log(eval(logMsg));
                                        } else if (statement.startsWith('alert(')) {
                                            const msg = statement.match(/alert\\((.*?)\\)/)?.[1];
                                            alert(eval(msg));
                                        }
                                    }
                                });
                                render();
                            };
                        }

                        // App Component compilation rendering logic
                        function render() {
                            const root = document.getElementById('root');
                            root.innerHTML = '';
                            
                            const appEl = document.createElement(selector);
                            appEl.innerHTML = templateHtml;
                            root.appendChild(appEl);

                            compileControlFlow(appEl);
                            compileBindings(appEl);
                        }

                        function compileControlFlow(parent) {
                            let html = parent.innerHTML;
                            
                            // Parse @if conditions
                            const ifRegex = /@if\\s*\\((.*?)\\)\\s*{([\\s\\S]*?)}/g;
                            html = html.replace(ifRegex, (match, condition, content) => {
                                const val = evaluateExpression(condition.trim());
                                return val ? content : '';
                            });

                            // Parse @for loop content
                            const forRegex = /@for\\s*\\((.*?)\\s+of\\s+(.*?)\\s*(?:;\\s*track\\s+.*?)?\\)\\s*{([\\s\\S]*?)}/g;
                            html = html.replace(forRegex, (match, itemVar, listExpr, content) => {
                                const list = evaluateExpression(listExpr.trim());
                                if (Array.isArray(list)) {
                                    return list.map((item, idx) => {
                                        let itemContent = content;
                                        itemContent = itemContent.replace(new RegExp('{{\\\\s*' + itemVar + '\\\\s*}}', 'g'), item);
                                        itemContent = itemContent.replace(new RegExp('{{\\\\s*index\\\\s*}}', 'g'), idx);
                                        return itemContent;
                                    }).join('');
                                }
                                return '';
                            });

                            parent.innerHTML = html;
                        }

                        function evaluateExpression(expr) {
                            if (expr.endsWith('()')) {
                                const sigName = expr.slice(0, -2);
                                if (instance[sigName] && typeof instance[sigName] === 'function') {
                                    return instance[sigName]();
                                }
                            }
                            if (instance[expr] !== undefined) {
                                return typeof instance[expr] === 'function' ? instance[expr]() : instance[expr];
                            }
                            try {
                                return (new Function('instance', \`with(instance) { return \${expr}; }\`))(instance);
                            } catch(e) {
                                return null;
                            }
                        }

                        function compileBindings(el) {
                            // Interpolation parser
                            const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
                            let textNode;
                            const interpolationRegex = /{{\\s*([\\s\\S]*?)\\s*}}/g;
                            const replacements = [];

                            while (textNode = walker.nextNode()) {
                                let text = textNode.nodeValue;
                                if (interpolationRegex.test(text)) {
                                    replacements.push({ node: textNode, original: text });
                                }
                                interpolationRegex.lastIndex = 0;
                            }

                            replacements.forEach(r => {
                                let text = r.original;
                                r.node.nodeValue = text.replace(interpolationRegex, (m, expr) => {
                                    const val = evaluateExpression(expr.trim());
                                    return val !== null && val !== undefined ? val : '';
                                });
                            });

                            // DOM nodes properties/events parser
                            const allElements = el.getElementsByTagName('*');
                            for (let element of allElements) {
                                const attrs = [...element.attributes];
                                attrs.forEach(attr => {
                                    const name = attr.name;
                                    const value = attr.value;

                                    if (name.startsWith('(') && name.endsWith(')')) {
                                        const eventName = name.slice(1, -1);
                                        const methodName = value.replace(/\\\\(\\\\)/g, '').trim();
                                        if (instance[methodName]) {
                                            element.addEventListener(eventName, (e) => {
                                                e.preventDefault();
                                                instance[methodName]();
                                            });
                                        }
                                    }

                                    if (name.startsWith('[') && name.endsWith(']')) {
                                        const propName = name.slice(1, -1);
                                        const val = evaluateExpression(value);
                                        if (propName === 'disabled') {
                                            element.disabled = !!val;
                                        } else {
                                            element[propName] = val;
                                        }
                                    }

                                    if (name === '[(ngModel)]') {
                                        const propName = value.trim();
                                        const isSignal = instance[propName] && instance[propName].isSignal;
                                        
                                        element.value = isSignal ? instance[propName]() : (instance[propName] || '');

                                        element.addEventListener('input', (e) => {
                                            if (isSignal) {
                                                instance[propName].set(e.target.value);
                                            } else {
                                                instance[propName] = e.target.value;
                                                render();
                                            }
                                        });
                                    }
                                });
                            }
                        }

                        render();
                        console.log("✔ Application compiled and initialized successfully.");

                    } catch (err) {
                        document.getElementById('error-container').innerHTML = '<div id="error-boundary"><strong>Compilation Error:</strong><br/>' + err.message + '</div>';
                        console.error(err);
                    }
                }

                // Run sandbox
                runAngularApp(\`${userCode.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`);
            <\/script>
        </body>
        </html>
    `;

    // Inject iframe content to boot the angular app sandbox
    DOM.previewFrame.srcdoc = iframeContent;
}

// Start application
init();
