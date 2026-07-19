// --- Angular Academy Curriculum Data ---
const curriculum = [
    {
        id: "basics",
        title: "Angular Basics & Components",
        lessons: [
            {
                id: "basics-1",
                title: "Introduction to Standalone Components",
                objectives: ["Understand what Angular is and why it's used", "Learn the standalone component architecture", "Create your first Angular component with @Component"],
                takeaways: ["Angular is a frontend framework by Google", "Standalone components don't need NgModules", "@Component decorator defines selector, template, and styles"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">What is Angular?</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Angular is a powerful, enterprise-grade frontend framework developed by Google. Modern Angular (v17+) is built on a <strong>standalone component architecture</strong>, eliminating the complex NgModules of the past.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">An Angular Component is defined by a class decorated with <code>@Component</code>. The decorator defines metadata like the HTML tag name (<code>selector</code>) and layout (<code>template</code>).</p>
                    <div class="bg-teal-50 border-l-4 border-teal-400 p-4 my-6 rounded-r-lg">
                        <p class="text-teal-800 font-medium"><i class="fa-solid fa-circle-info mr-2"></i>Switch to the <strong>Playground</strong> tab. Click "Run Code" to compile and see your component render in real-time!</p>
                    </div>
                `,
                defaultCode: `import { Component } from '@angular/core';\n\n@Component({\n  selector: 'app-root',\n  standalone: true,\n  template: \`\n    <div class="p-6 max-w-sm mx-auto bg-white rounded-xl shadow-lg flex flex-col items-center space-y-4 border border-teal-100">\n      <div class="p-3 bg-teal-100 rounded-full">\n        <i class="fa-brands fa-angular text-4xl text-rose-500"></i>\n      </div>\n      <h1 class="text-2xl font-bold text-slate-900">Angular Academy</h1>\n      <p class="text-slate-500 text-center text-sm">Master Angular fundamentals: signals, components, and dependency injection.</p>\n    </div>\n  \`\n})\nexport class AppComponent {\n  title = 'angular-academy';\n}`
            },
            {
                id: "basics-2",
                title: "Component Structure & Lifecycle",
                objectives: ["Understand component lifecycle hooks", "Learn when ngOnInit, ngOnDestroy fire", "Use lifecycle hooks for initialization and cleanup"],
                takeaways: ["ngOnInit runs once after component initialization", "ngOnDestroy cleans up subscriptions and timers", "Lifecycle hooks give you precise control over component behavior"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Component Lifecycle Hooks</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Angular components have a well-defined lifecycle. Angular calls <strong>lifecycle hook methods</strong> at specific moments, letting you tap into key events.</p>
                    
                    <div class="grid gap-4 my-6">
                        <div class="bg-sky-50 border border-sky-200 rounded-xl p-5">
                            <h4 class="font-bold text-sky-800 flex items-center gap-2"><i class="fa-solid fa-seedling text-sky-500"></i> ngOnInit</h4>
                            <p class="text-sky-700 text-sm mt-1">Called once after the component is initialized. Perfect for fetching initial data, setting up forms, or reading route params.</p>
                        </div>
                        <div class="bg-amber-50 border border-amber-200 rounded-xl p-5">
                            <h4 class="font-bold text-amber-800 flex items-center gap-2"><i class="fa-solid fa-arrows-rotate text-amber-500"></i> ngOnChanges</h4>
                            <p class="text-amber-700 text-sm mt-1">Called whenever an <code>@Input()</code> property changes. Receives a <code>SimpleChanges</code> object with previous and current values.</p>
                        </div>
                        <div class="bg-purple-50 border border-purple-200 rounded-xl p-5">
                            <h4 class="font-bold text-purple-800 flex items-center gap-2"><i class="fa-solid fa-trash-can text-purple-500"></i> ngOnDestroy</h4>
                            <p class="text-purple-700 text-sm mt-1">Called just before Angular destroys the component. Use it to unsubscribe from Observables, clear timers, and detach event listeners.</p>
                        </div>
                    </div>

                    <div class="bg-orange-50 border-l-4 border-orange-400 p-4 my-6 rounded-r-lg">
                        <p class="text-orange-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Tip:</strong> Always unsubscribe in <code>ngOnDestroy</code> to prevent memory leaks! Or use the <code>async</code> pipe which handles it automatically.</p>
                    </div>
                `,
                defaultCode: `import { Component, OnInit, OnDestroy } from '@angular/core';\n\n@Component({\n  selector: 'app-lifecycle',\n  standalone: true,\n  template: \`\n    <div class="p-6 bg-white border rounded-xl shadow-sm max-w-sm mx-auto">\n      <h3 class="font-bold text-lg text-gray-800 mb-2">Lifecycle Demo</h3>\n      <div class="bg-sky-50 p-4 rounded-lg text-sm text-sky-800">\n        <p><i class="fa-solid fa-circle-info mr-1"></i> Check the console log below!</p>\n        <p class="mt-2">Component has been alive for <strong>{{ seconds }}</strong> seconds.</p>\n      </div>\n    </div>\n  \`\n})\nexport class LifecycleComponent implements OnInit, OnDestroy {\n  seconds = 0;\n  private intervalId: any;\n\n  ngOnInit() {\n    console.log('Component initialized!');\n    this.intervalId = setInterval(() => {\n      this.seconds++;\n    }, 1000);\n  }\n\n  ngOnDestroy() {\n    console.log('Component destroyed! Cleaning up...');\n    clearInterval(this.intervalId);\n  }\n}`
            },
            {
                id: "basics-3",
                title: "Building Your First Component",
                objectives: ["Create a component manually using Angular CLI patterns", "Understand the three parts of a component", "Use inline templates and external templates"],
                takeaways: ["Components have three parts: class, template, styles", "Use selector as a custom HTML tag", "Components can be nested inside each other"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Your First Custom Component</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Every component needs three things: a <strong>TypeScript class</strong> (logic), an <strong>HTML template</strong> (layout), and optionally <strong>CSS styles</strong> (presentation).</p>
                    
                    <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-5 my-6">
                        <h4 class="font-bold text-indigo-800 mb-2">The Three Ingredients</h4>
                        <ol class="list-decimal pl-5 space-y-2 text-sm text-indigo-700">
                            <li><strong>Class:</strong> Holds data and methods. Uses <code>export class MyComponent {}</code></li>
                            <li><strong>Template:</strong> HTML that defines the UI. Can be inline with backticks or a separate file.</li>
                            <li><strong>Styles:</strong> Scoped CSS. Use <code>styles: [\`...\`]</code> or <code>styleUrls</code>.</li>
                        </ol>
                    </div>

                    <div class="bg-teal-50 border-l-4 border-teal-400 p-4 my-6 rounded-r-lg">
                        <p class="text-teal-800 font-medium"><i class="fa-solid fa-circle-info mr-2"></i>Switch to the <strong>Playground</strong> tab and try editing the component below!</p>
                    </div>
                `,
                defaultCode: `import { Component } from '@angular/core';\n\n@Component({\n  selector: 'app-greeting',\n  standalone: true,\n  template: \`\n    <div class="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 shadow-sm max-w-sm mx-auto text-center">\n      <div class="w-16 h-16 mx-auto bg-indigo-100 rounded-full flex items-center justify-center mb-3">\n        <i class="fa-solid fa-hand-wave text-2xl text-indigo-600"></i>\n      </div>\n      <h2 class="text-xl font-bold text-gray-800">Hello, I'm a Component!</h2>\n      <p class="text-gray-500 text-sm mt-1">I was built with @Component</p>\n      <div class="mt-4 bg-white rounded-lg p-3 text-xs text-gray-600">\n        Selector: <code class="text-indigo-600 font-mono">&lt;app-greeting&gt;</code>\n      </div>\n    </div>\n  \`\n})\nexport class GreetingComponent {}`
            },
            {
                id: "basics-4",
                title: "Component Communication (@Input/@Output)",
                objectives: ["Pass data from parent to child with @Input", "Emit events from child to parent with @Output", "Build a simple parent-child component pair"],
                takeaways: ["@Input passes data INTO a component", "@Output emits events OUT of a component", "Use proper naming: @Input() for data, @Output() for events"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Parent-Child Communication</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Components communicate through a well-defined interface: <code>@Input()</code> and <code>@Output()</code> decorators.</p>
                    
                    <div class="grid md:grid-cols-2 gap-4 my-6">
                        <div class="bg-teal-50 border border-teal-200 rounded-xl p-5">
                            <h4 class="font-bold text-teal-800 flex items-center gap-2"><i class="fa-solid fa-arrow-down text-teal-500"></i> @Input()</h4>
                            <p class="text-teal-700 text-sm mt-1">Marks a property as receiving data from a parent. The parent binds using <code>[property]="value"</code>.</p>
                        </div>
                        <div class="bg-amber-50 border border-amber-200 rounded-xl p-5">
                            <h4 class="font-bold text-amber-800 flex items-center gap-2"><i class="fa-solid fa-arrow-up text-amber-500"></i> @Output()</h4>
                            <p class="text-amber-700 text-sm mt-1">Marks an EventEmitter that sends events to a parent. The parent listens using <code>(event)="handler()"</code>.</p>
                        </div>
                    </div>

                    <div class="bg-orange-50 border-l-4 border-orange-400 p-4 my-6 rounded-r-lg">
                        <p class="text-orange-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Remember:</strong> Data flows DOWN (parent → child via @Input). Events flow UP (child → parent via @Output). Like a waterfall!</p>
                    </div>
                `,
                defaultCode: `import { Component, Input, Output, EventEmitter } from '@angular/core';\n\n@Component({\n  selector: 'app-child',\n  standalone: true,\n  template: \`\n    <div class="p-4 bg-amber-50 border border-amber-200 rounded-xl">\n      <p class="text-xs text-amber-700 font-semibold uppercase">Child Component</p>\n      <p class="text-gray-700 mt-1">Received: <strong class="text-teal-600">{{ itemName }}</strong></p>\n      <button (click)="onNotify()" class="mt-2 px-3 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded transition-colors">\n        Send Event to Parent\n      </button>\n    </div>\n  \`\n})\nexport class ChildComponent {\n  @Input() itemName = '';\n  @Output() notify = new EventEmitter<string>();\n  onNotify() {\n    this.notify.emit('Child says: Item received!');\n  }\n}`
            },
            {
                id: "basics-5",
                title: "Reusable Component Design",
                objectives: ["Design components that work in multiple contexts", "Use @Input with default values for flexibility", "Build a reusable card component"],
                takeaways: ["Good components are self-contained and configurable", "Use inputs for customization, not hardcoded values", "Reusable components save time and reduce bugs"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Designing for Reusability</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Great components are like <strong>LEGO bricks</strong> — they fit anywhere and can be combined in endless ways. Follow these principles:</p>
                    
                    <ul class="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                        <li><strong>Single Responsibility:</strong> One component, one job.</li>
                        <li><strong>Configurable via Inputs:</strong> Use @Input() with defaults so the component works out of the box.</li>
                        <li><strong>Content Projection:</strong> Use <code>&lt;ng-content&gt;</code> to inject custom content inside a component.</li>
                        <li><strong>No Direct API Calls:</strong> Components should receive data, not fetch it.</li>
                    </ul>

                    <div class="bg-orange-50 border-l-4 border-orange-400 p-4 my-6 rounded-r-lg">
                        <p class="text-orange-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Tip:</strong> A well-designed reusable component should work correctly even when its parent passes <strong>no</strong> @Input values!</p>
                    </div>
                `,
                defaultCode: `import { Component, Input } from '@angular/core';\n\n@Component({\n  selector: 'app-info-card',\n  standalone: true,\n  template: \`\n    <div class="p-5 border rounded-xl shadow-sm" [ngClass]="variant === 'info' ? 'bg-sky-50 border-sky-200' : 'bg-teal-50 border-teal-200'">\n      <div class="flex items-start gap-3">\n        <div class="p-2 rounded-full" [ngClass]="variant === 'info' ? 'bg-sky-100 text-sky-600' : 'bg-teal-100 text-teal-600'">\n          <i class="fa-solid" [ngClass]="icon"></i>\n        </div>\n        <div>\n          <h4 class="font-bold text-gray-800">{{ title }}</h4>\n          <p class="text-sm text-gray-600 mt-1">{{ description }}</p>\n        </div>\n      </div>\n    </div>\n  \`\n})\nexport class InfoCardComponent {\n  @Input() title = 'Card Title';\n  @Input() description = 'Card description goes here.';\n  @Input() icon = 'fa-circle-info';\n  @Input() variant: 'info' | 'success' = 'info';\n}`
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
            },
            {
                id: "q-basics-3",
                question: "What lifecycle hook is best for fetching initial data when a component loads?",
                options: ["ngOnChanges", "ngOnInit", "ngAfterViewInit", "ngOnDestroy"],
                correct: 1
            },
            {
                id: "q-basics-4",
                question: "Which decorator allows a parent component to pass data to a child component?",
                options: ["@Output()", "@Injectable()", "@Input()", "@ViewChild()"],
                correct: 2
            },
            {
                id: "q-basics-5",
                question: "In standalone components (v17+), what do you NOT need to include?",
                options: ["@Component decorator", "NgModules", "selector property", "template property"],
                correct: 1
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
                objectives: ["Master interpolation, property binding, and event binding", "Use @if and @for control flow blocks", "Understand two-way binding with ngModel"],
                takeaways: ["{{ }} interpolates class properties into the template", "[property] binds DOM attributes, (event) listens to events", "@if and @for replace *ngIf and *ngFor in Angular 17+"],
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
                    
                    <div class="bg-amber-50 border-l-4 border-amber-400 p-4 my-6 rounded-r-lg">
                        <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Remember:</strong> The <code>@for</code> block requires a <code>track</code> expression for performance. Use <code>track item.id</code> for best results!</p>
                    </div>
                `,
                defaultCode: `import { Component } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\n\n@Component({\n  selector: 'app-binding',\n  standalone: true,\n  imports: [FormsModule],\n  template: \`\n    <div class="space-y-4 font-sans p-6 bg-white border border-gray-200 rounded-xl shadow-sm">\n      <h3 class="text-lg font-bold text-gray-800">Interactive Greeting Card</h3>\n      \n      <div>\n        <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Enter your name</label>\n        <input [(ngModel)]="username" placeholder="Type a name..." class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-teal-400" />\n      </div>\n\n      <p class="text-sm font-medium">\n        Hello, <span class="text-teal-600 font-bold">{{ username || 'Guest' }}</span>!\n      </p>\n\n      @if (username) {\n        <button (click)="resetName()" class="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold rounded transition-colors shadow">\n          Clear Name\n        </button>\n      }\n    </div>\n  \`\n})\nexport class BindingComponent {\n  username = 'Angular Developer';\n  resetName() {\n    this.username = '';\n  }\n}`
            },
            {
                id: "bindings-2",
                title: "Property & Event Binding Deep Dive",
                objectives: ["Understand the difference between property and attribute binding", "Use event binding with $event object", "Build interactive UI with click, input, and keyboard events"],
                takeaways: ["Property binding uses [ ] and updates the DOM property", "Event binding uses ( ) and passes $event automatically", "Use $event.target.value to get input field values"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Binding Deep Dive</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed"><strong>Property binding</strong> sets an element's DOM property. Use it for dynamic attributes like <code>[src]</code>, <code>[href]</code>, <code>[disabled]</code>, and <code>[class.active]</code>.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed"><strong>Event binding</strong> attaches event handlers. The <code>$event</code> object contains event details — like which key was pressed or the mouse coordinates.</p>

                    <div class="bg-teal-50 border border-teal-200 rounded-xl p-5 my-6">
                        <h4 class="font-bold text-teal-800 mb-2">Common Event Bindings</h4>
                        <div class="grid md:grid-cols-2 gap-3 text-sm">
                            <span class="bg-white rounded px-3 py-2 text-teal-700"><code>(click)</code> — Mouse click</span>
                            <span class="bg-white rounded px-3 py-2 text-teal-700"><code>(dblclick)</code> — Double click</span>
                            <span class="bg-white rounded px-3 py-2 text-teal-700"><code>(input)</code> — Value changes</span>
                            <span class="bg-white rounded px-3 py-2 text-teal-700"><code>(keyup.enter)</code> — Enter key</span>
                            <span class="bg-white rounded px-3 py-2 text-teal-700"><code>(focus)</code> — Element focused</span>
                            <span class="bg-white rounded px-3 py-2 text-teal-700"><code>(blur)</code> — Element loses focus</span>
                        </div>
                    </div>
                `,
                defaultCode: `import { Component } from '@angular/core';\n\n@Component({\n  selector: 'app-event-demo',\n  standalone: true,\n  template: \`\n    <div class="p-6 bg-white border rounded-xl shadow-sm max-w-sm mx-auto space-y-4">\n      <h3 class="font-bold text-gray-800">Event Explorer</h3>\n      \n      <input \n        (input)="onInput($event)"\n        (keyup.enter)="onEnter()"\n        placeholder="Type and press Enter..."\n        class="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"\n      />\n      \n      <div class="p-3 bg-amber-50 rounded-lg text-sm text-amber-800">\n        Current input: <strong>{{ currentValue }}</strong>\n      </div>\n      \n      <button (click)="logMessage()" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded transition-colors">\n        Log to Console\n      </button>\n    </div>\n  \`\n})\nexport class EventDemoComponent {\n  currentValue = '';\n  onInput(event: any) {\n    this.currentValue = event.target.value;\n  }\n  onEnter() {\n    console.log('Enter pressed! Value:', this.currentValue);\n  }\n  logMessage() {\n    console.log('Button clicked!');\n  }\n}`
            },
            {
                id: "bindings-3",
                title: "Two-Way Binding with NgModel",
                objectives: ["Use [(ngModel)] for two-way data binding", "Import FormsModule for template-driven forms", "Build a live preview form"],
                takeaways: ["[(ngModel)] combines property and event binding", "Must import FormsModule in standalone component's imports", "Great for forms, search bars, and live previews"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Banana in a Box [(ngModel)]</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Two-way binding with <code>[(ngModel)]</code> keeps your component property and the input field in sync. It's called "banana in a box" because of the <code>[()]</code> syntax — parentheses (banana) inside square brackets (box).</p>
                    
                    <div class="bg-amber-50 border-l-4 border-amber-400 p-4 my-6 rounded-r-lg">
                        <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Important:</strong> To use <code>[(ngModel)]</code> in a standalone component, you must add <code>FormsModule</code> to the <code>imports</code> array of <code>@Component</code>!</p>
                    </div>

                    <p class="mb-4 text-gray-700 leading-relaxed">When the user types in the input, the component property updates automatically. When the code changes the property, the input updates to match. Both directions — automatic!</p>
                `,
                defaultCode: `import { Component } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\n\n@Component({\n  selector: 'app-live-preview',\n  standalone: true,\n  imports: [FormsModule],\n  template: \`\n    <div class="p-6 bg-white border rounded-xl shadow-sm max-w-md mx-auto space-y-4">\n      <h3 class="font-bold text-gray-800">Live Preview Demo</h3>\n      \n      <div class="space-y-2">\n        <label class="text-xs font-semibold text-gray-500 uppercase">Title</label>\n        <input [(ngModel)]="title" placeholder="Enter a title..." \n          class="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />\n      </div>\n      \n      <div class="space-y-2">\n        <label class="text-xs font-semibold text-gray-500 uppercase">Color</label>\n        <select [(ngModel)]="color" class="w-full p-2 border rounded text-sm">\n          <option value="purple">Purple</option>\n          <option value="teal">Teal</option>\n          <option value="amber">Amber</option>\n        </select>\n      </div>\n      \n      <div class="p-4 rounded-xl text-center" \n        [ngClass]="{'bg-purple-50 border border-purple-200': color === 'purple', 'bg-teal-50 border border-teal-200': color === 'teal', 'bg-amber-50 border border-amber-200': color === 'amber'}">\n        <h4 class="font-bold text-gray-800">{{ title || 'Your Title' }}</h4>\n        <p class="text-xs text-gray-500 mt-1">Preview card</p>\n      </div>\n    </div>\n  \`\n})\nexport class LivePreviewComponent {\n  title = 'Angular Rocks!';\n  color = 'purple';\n}`
            },
            {
                id: "bindings-4",
                title: "Pipes & Formatting Data",
                objectives: ["Use built-in pipes: date, currency, uppercase, lowercase", "Understand the async pipe for Observables", "Create parameterized pipes with arguments"],
                takeaways: ["Pipes transform data in templates using | syntax", "Chain pipes: {{ value | pipe1 | pipe2 }}", "Async pipe auto-subscribes and unsubscribes from Observables"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Transforming Data with Pipes</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Pipes transform displayed values without changing the underlying data. Use the pipe character <code>|</code> in templates.</p>
                    
                    <div class="grid md:grid-cols-2 gap-4 my-6">
                        <div class="bg-teal-50 border border-teal-200 rounded-xl p-4">
                            <h4 class="font-bold text-teal-800 text-sm flex items-center gap-2"><i class="fa-solid fa-calendar"></i> Date Pipe</h4>
                            <p class="text-teal-700 text-xs mt-1"><code>{{ today | date:'medium' }}</code></p>
                            <p class="text-teal-700 text-xs">Outputs: Jun 14, 2026, 3:45:00 PM</p>
                        </div>
                        <div class="bg-sky-50 border border-sky-200 rounded-xl p-4">
                            <h4 class="font-bold text-sky-800 text-sm flex items-center gap-2"><i class="fa-solid fa-dollar-sign"></i> Currency Pipe</h4>
                            <p class="text-sky-700 text-xs mt-1"><code>{{ price | currency:'USD' }}</code></p>
                            <p class="text-sky-700 text-xs">Outputs: $29.99</p>
                        </div>
                        <div class="bg-purple-50 border border-purple-200 rounded-xl p-4">
                            <h4 class="font-bold text-purple-800 text-sm flex items-center gap-2"><i class="fa-solid fa-font"></i> Text Pipes</h4>
                            <p class="text-purple-700 text-xs mt-1"><code>{{ text | uppercase }}</code></p>
                            <p class="text-purple-700 text-xs">Outputs: HELLO WORLD</p>
                        </div>
                        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <h4 class="font-bold text-amber-800 text-sm flex items-center gap-2"><i class="fa-solid fa-eye"></i> Async Pipe</h4>
                            <p class="text-amber-700 text-xs mt-1"><code>{{ stream$ | async }}</code></p>
                            <p class="text-amber-700 text-xs">Auto-subscribes to Observable!</p>
                        </div>
                    </div>
                `,
                defaultCode: `import { Component } from '@angular/core';\nimport { CommonModule } from '@angular/common';\n\n@Component({\n  selector: 'app-pipes-demo',\n  standalone: true,\n  imports: [CommonModule],\n  template: \`\n    <div class="p-6 bg-white border rounded-xl shadow-sm max-w-sm mx-auto space-y-4">\n      <h3 class="font-bold text-gray-800">Pipe Playground</h3>\n      \n      <div class="space-y-2">\n        <p class="text-xs text-gray-500 uppercase font-semibold">Today's Date</p>\n        <p class="text-lg font-mono text-teal-700">{{ today | date:'fullDate' }}</p>\n      </div>\n      \n      <div class="space-y-2">\n        <p class="text-xs text-gray-500 uppercase font-semibold">Price</p>\n        <p class="text-lg font-mono text-sky-700">{{ 29.99 | currency:'USD' }}</p>\n      </div>\n      \n      <div class="space-y-2">\n        <p class="text-xs text-gray-500 uppercase font-semibold">Uppercase</p>\n        <p class="text-lg font-mono text-purple-700">{{ 'angular academy' | uppercase }}</p>\n      </div>\n      \n      <div class="space-y-2">\n        <p class="text-xs text-gray-500 uppercase font-semibold">Percentage</p>\n        <p class="text-lg font-mono text-amber-700">{{ 0.856 | percent }}</p>\n      </div>\n    </div>\n  \`\n})\nexport class PipesDemoComponent {\n  today = new Date();\n}`
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
            },
            {
                id: "q-bindings-3",
                question: "What is the 'banana in a box' syntax used for?",
                options: ["Property binding", "Event binding", "Two-way binding [(ngModel)]", "Interpolation"],
                correct: 2
            },
            {
                id: "q-bindings-4",
                question: "Which pipe automatically subscribes and unsubscribes from an Observable?",
                options: ["date", "async", "subscribe", "stream"],
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
                objectives: ["Understand the concept of dependency injection", "Learn the @Injectable decorator", "Use constructor injection to consume services"],
                takeaways: ["DI eliminates manual instantiation with 'new'", "@Injectable({ providedIn: 'root' }) makes a service available app-wide", "Constructor parameters tell Angular what to inject"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Services & The DI Tree</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">In Angular, <strong>Services</strong> are classes dedicated to business logic and data sharing, marked by the <code>@Injectable</code> decorator.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Angular uses <strong>Dependency Injection (DI)</strong> to request services. Rather than instantiating them manually (<code>new MyService()</code>), you declare them as constructor parameters. Angular resolves and injects them automatically.</p>
                    
                    <div class="bg-teal-50 border-l-4 border-teal-400 p-4 my-6 rounded-r-lg">
                        <p class="text-teal-800 font-medium"><i class="fa-solid fa-circle-info mr-2"></i>The DI system is like a smart vending machine — you tell it what you want (in the constructor), and it hands you a ready-to-use instance!</p>
                    </div>
                `,
                defaultCode: `import { Injectable, Component } from '@angular/core';\n\n@Injectable({\n  providedIn: 'root'\n})\nexport class LoggerService {\n  log(msg: string) {\n    console.log('[LoggerService]: ' + msg);\n  }\n}\n\n@Component({\n  selector: 'app-service-demo',\n  standalone: true,\n  template: \`\n    <div class="p-6 bg-white shadow-sm border border-gray-100 rounded-lg text-center space-y-4">\n      <p class="text-gray-600 text-sm">Logging operations occur inside the services layer. Check the console log below after clicking!</p>\n      <button (click)="triggerLog()" class="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded text-xs font-bold transition-colors">\n        Trigger Service Logger\n      </button>\n    </div>\n  \`\n})\nexport class ServiceDemoComponent {\n  constructor(private logger: LoggerService) {}\n  triggerLog() {\n    this.logger.log('Action performed in Component, logged via DI Logger!');\n  }\n}`
            },
            {
                id: "services-2",
                title: "Creating & Providing Services",
                objectives: ["Create a service with multiple methods", "Provide services at different levels", "Use services for API calls and data operations"],
                takeaways: ["Services encapsulate reusable logic", "providedIn: 'root' creates a singleton", "Services can depend on other services"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Building a Data Service</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">A well-designed service handles data operations, API calls, and shared state. Components stay lean by delegating logic to services.</p>
                    
                    <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-5 my-6">
                        <h4 class="font-bold text-indigo-800 mb-3">Service Best Practices</h4>
                        <ul class="space-y-2 text-sm text-indigo-700">
                            <li>✅ <strong>Single Responsibility:</strong> One service handles one concern</li>
                            <li>✅ <strong>Stateless where possible:</strong> Accept inputs, return outputs</li>
                            <li>✅ <strong>Use Signals or Subjects</strong> for reactive state sharing</li>
                            <li>❌ Don't manipulate DOM directly (that's the component's job)</li>
                        </ul>
                    </div>

                    <div class="bg-amber-50 border-l-4 border-amber-400 p-4 my-6 rounded-r-lg">
                        <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Tip:</strong> Use Angular's <code>HttpClient</code> in services for API calls. It returns Observables that components subscribe to.</p>
                    </div>
                `,
                defaultCode: `import { Injectable, Component, signal } from '@angular/core';\n\n@Injectable({ providedIn: 'root' })\nexport class UserService {\n  private users = signal(['Alice', 'Bob', 'Charlie']);\n  \n  getUsers() {\n    return this.users();\n  }\n  \n  addUser(name: string) {\n    this.users.update(list => [...list, name]);\n  }\n  \n  removeUser(name: string) {\n    this.users.update(list => list.filter(u => u !== name));\n  }\n}\n\n@Component({\n  selector: 'app-user-list',\n  standalone: true,\n  template: \`\n    <div class="p-6 bg-white border rounded-xl shadow-sm max-w-sm mx-auto">\n      <h3 class="font-bold text-gray-800 mb-3">Users (via Service)</h3>\n      <ul class="space-y-2 mb-4">\n        @for (user of userService.getUsers(); track user) {\n          <li class="p-2 bg-indigo-50 rounded flex justify-between items-center">\n            <span class="text-sm text-indigo-800">{{ user }}</span>\n            <button (click)="userService.removeUser(user)" class="text-xs text-red-500 hover:text-red-700">✕</button>\n          </li>\n        }\n      </ul>\n      <button (click)="userService.addUser('New User')" class="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded transition-colors">\n        + Add User\n      </button>\n    </div>\n  \`\n})\nexport class UserListComponent {\n  constructor(public userService: UserService) {}\n}`
            },
            {
                id: "services-3",
                title: "Hierarchical Injectors",
                objectives: ["Understand Angular's hierarchical injection system", "Provide services at component level for scoped instances", "Choose the right provide level for different scenarios"],
                takeaways: ["Services can be provided at root, module, or component level", "Component-level providers create isolated instances", "The injector tree mirrors the component tree"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">The Injector Hierarchy</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Angular's DI system is hierarchical. Services can be provided at different levels, and Angular walks up the tree to find them.</p>
                    
                    <div class="grid md:grid-cols-3 gap-3 my-6">
                        <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                            <h4 class="font-bold text-emerald-800 text-sm"><i class="fa-solid fa-globe mr-1"></i> Root Level</h4>
                            <p class="text-emerald-700 text-xs mt-1"><code>providedIn: 'root'</code> — One instance for the entire app. Best for shared state, auth, logging.</p>
                        </div>
                        <div class="bg-sky-50 border border-sky-200 rounded-xl p-4">
                            <h4 class="font-bold text-sky-800 text-sm"><i class="fa-solid fa-layer-group mr-1"></i> Component Level</h4>
                            <p class="text-sky-700 text-xs mt-1"><code>providers: [MyService]</code> — New instance per component. Best for isolated state.</p>
                        </div>
                        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <h4 class="font-bold text-amber-800 text-sm"><i class="fa-solid fa-circle-nodes mr-1"></i> Lazy Module</h4>
                            <p class="text-amber-700 text-xs mt-1"><code>providedIn: 'lazyModule'</code> — Instance per lazy-loaded route. Not needed with standalone components.</p>
                        </div>
                    </div>

                    <div class="bg-amber-50 border-l-4 border-amber-400 p-4 my-6 rounded-r-lg">
                        <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Tip:</strong> Provide a service at the component level if each component instance needs its own copy of the state. Provide at root if all components should share the same state.</p>
                    </div>
                `,
                defaultCode: `import { Injectable, Component } from '@angular/core';\n\n@Injectable()\nexport class CounterService {\n  count = 0;\n  increment() { this.count++; }\n  getCount() { return this.count; }\n}\n\n@Component({\n  selector: 'app-counter',\n  standalone: true,\n  providers: [CounterService],  // Each CounterComponent gets its own CounterService\n  template: \`\n    <div class="p-4 bg-white border rounded-xl shadow-sm text-center">\n      <p class="text-xs text-gray-500 uppercase font-semibold">Isolated Counter</p>\n      <p class="text-3xl font-bold text-sky-600 my-2">{{ counter.getCount() }}</p>\n      <button (click)="counter.increment()" class="px-4 py-1 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded">\n        +1\n      </button>\n    </div>\n  \`\n})\nexport class CounterComponent {\n  constructor(public counter: CounterService) {}\n}`
            },
            {
                id: "services-4",
                title: "Using Services for Data Sharing",
                objectives: ["Share data between sibling components via services", "Use Signals in services for reactive updates", "Build a component pair that shares state"],
                takeaways: ["Services are the simplest way to share data between components", "Signals in services provide reactive updates without NgRx", "Sibling components can communicate through a shared service"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Cross-Component Data Sharing</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">When two components need to share data, a service is the simplest solution. Both components inject the same service and read/write shared state.</p>
                    
                    <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-5 my-6">
                        <h4 class="font-bold text-indigo-800 mb-2">Data Flow Pattern</h4>
                        <div class="flex items-center justify-center gap-4 text-sm text-indigo-700">
                            <span class="bg-white px-3 py-2 rounded-lg shadow-sm">Component A</span>
                            <i class="fa-solid fa-arrow-right text-indigo-400"></i>
                            <span class="bg-teal-100 px-3 py-2 rounded-lg font-semibold">Shared Service</span>
                            <i class="fa-solid fa-arrow-right text-indigo-400"></i>
                            <span class="bg-white px-3 py-2 rounded-lg shadow-sm">Component B</span>
                        </div>
                        <p class="text-xs text-indigo-600 mt-3 text-center">A writes → Service stores → B reads (and vice versa)</p>
                    </div>
                `,
                defaultCode: `import { Injectable, Component, signal, computed } from '@angular/core';\n\n@Injectable({ providedIn: 'root' })\nexport class SharedDataService {\n  private message = signal('Hello from Service!');\n  readonly message$ = computed(() => this.message());\n  \n  setMessage(msg: string) {\n    this.message.set(msg);\n  }\n}\n\n@Component({\n  selector: 'app-sender',\n  standalone: true,\n  template: \`\n    <div class="p-4 bg-teal-50 border border-teal-200 rounded-xl">\n      <h4 class="font-bold text-teal-800 text-sm">Sender</h4>\n      <input #msgInput placeholder="Type a message..." class="w-full p-2 mt-2 border rounded text-sm" />\n      <button (click)="shared.setMessage(msgInput.value)" class="mt-2 px-3 py-1 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold rounded">\n        Send\n      </button>\n    </div>\n  \`\n})\nexport class SenderComponent {\n  constructor(public shared: SharedDataService) {}\n}\n\n@Component({\n  selector: 'app-receiver',\n  standalone: true,\n  template: \`\n    <div class="p-4 bg-amber-50 border border-amber-200 rounded-xl mt-3">\n      <h4 class="font-bold text-amber-800 text-sm">Receiver</h4>\n      <p class="mt-2 text-lg text-amber-900 font-medium">{{ shared.message$() }}</p>\n    </div>\n  \`\n})\nexport class ReceiverComponent {\n  constructor(public shared: SharedDataService) {}\n}`
            }
        ],
        quiz: [
            {
                id: "q-services-1",
                question: "How do you declare that a service is available application-wide under Angular's root injector?",
                options: ["@Injectable({ providedIn: 'root' })", "providedIn: 'any'", "@Injectable({ global: true })", "By importing it in main.ts"],
                correct: 0
            },
            {
                id: "q-services-2",
                question: "How do you consume a service in a component?",
                options: ["new MyService()", "Using a factory function", "Declare it as a constructor parameter", "Import it directly"],
                correct: 2
            },
            {
                id: "q-services-3",
                question: "What happens when a service is provided at the component level via `providers: [MyService]`?",
                options: ["It becomes a singleton", "Each component instance gets its own service instance", "It's only available in tests", "It's shared with all child components"],
                correct: 1
            },
            {
                id: "q-services-4",
                question: "Which method is best for sharing reactive state between sibling components?",
                options: ["@Input and @Output", "A shared service with Signals", "Local storage", "Global variables"],
                correct: 1
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
                objectives: ["Understand the Observable pattern", "Create Observables using creation functions", "Subscribe and unsubscribe from streams"],
                takeaways: ["Observables emit values over time (streams)", "Use creation functions like interval, of, from", "Always unsubscribe to prevent memory leaks"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Reactive programming with RxJS</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Angular utilizes <strong>RxJS</strong> (Reactive Extensions for JavaScript) for managing asynchronous flows, events, and API streams via <strong>Observables</strong>.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Instead of single callback events or promises, Observables emit streams of values over time. You subscribe to listen, and modify streams using pipes and functional operators like <code>map</code>, <code>filter</code>, or <code>take</code>.</p>
                    
                    <div class="bg-teal-50 border-l-4 border-teal-400 p-4 my-6 rounded-r-lg">
                        <p class="text-teal-800 font-medium"><i class="fa-solid fa-circle-info mr-2"></i>Unlike Promises (which resolve once), Observables can emit <strong>multiple values over time</strong> — like a tap that keeps dripping!</p>
                    </div>
                `,
                defaultCode: `import { Component } from '@angular/core';\nimport { interval, map, take } from 'rxjs';\n\n@Component({\n  selector: 'app-rxjs-demo',\n  standalone: true,\n  template: \`\n    <div class="p-6 bg-violet-50 border border-violet-100 rounded-xl text-center space-y-4">\n      <h3 class="text-lg font-bold text-violet-900">RxJS Stream Tester</h3>\n      <p class="text-xs text-violet-700">Subscribes to interval(1000) mapped to multiples of 10.</p>\n      \n      <div class="text-4xl font-mono text-violet-800 font-extrabold py-2">\n        Value: {{ currentNumber }}\n      </div>\n\n      <button (click)="subscribeStream()" class="px-4 py-2 bg-violet-600 text-white rounded text-xs font-bold hover:bg-violet-700 shadow transition-colors">\n        Subscribe & Start Ticking\n      </button>\n    </div>\n  \`\n})\nexport class RxjsComponent {\n  currentNumber = 0;\n  subscribeStream() {\n    interval(1000).pipe(\n      take(5),\n      map(x => (x + 1) * 10)\n    ).subscribe(val => {\n      this.currentNumber = val;\n    });\n  }\n}`
            },
            {
                id: "rxjs-2",
                title: "Operators: map, filter, tap",
                objectives: ["Use pipe() to chain operators", "Transform data with map()", "Filter data with filter()", "Debug with tap()"],
                takeaways: ["Operators transform data inside pipe()", "map transforms each emitted value", "filter lets only matching values through", "tap is for side effects like logging"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Essential RxJS Operators</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Operators are functions that transform, filter, or combine Observable streams. They are used inside the <code>pipe()</code> method.</p>
                    
                    <div class="grid md:grid-cols-3 gap-4 my-6">
                        <div class="bg-sky-50 border border-sky-200 rounded-xl p-4">
                            <h4 class="font-bold text-sky-800 flex items-center gap-2"><i class="fa-solid fa-pen"></i> map</h4>
                            <p class="text-sky-700 text-xs mt-1">Transforms each emitted value. Like a factory machine that stamps every item with a new label.</p>
                        </div>
                        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <h4 class="font-bold text-amber-800 flex items-center gap-2"><i class="fa-solid fa-filter"></i> filter</h4>
                            <p class="text-amber-700 text-xs mt-1">Only lets values through that pass a condition. Like a bouncer checking IDs.</p>
                        </div>
                        <div class="bg-purple-50 border border-purple-200 rounded-xl p-4">
                            <h4 class="font-bold text-purple-800 flex items-center gap-2"><i class="fa-solid fa-eye"></i> tap</h4>
                            <p class="text-purple-700 text-xs mt-1">Peek at values without modifying them. Perfect for debugging and logging.</p>
                        </div>
                    </div>
                `,
                defaultCode: `import { Component } from '@angular/core';\nimport { of, pipe } from 'rxjs';\nimport { map, filter, tap } from 'rxjs/operators';\n\n@Component({\n  selector: 'app-operators',\n  standalone: true,\n  template: \`\n    <div class="p-6 bg-white border rounded-xl shadow-sm max-w-sm mx-auto space-y-4">\n      <h3 class="font-bold text-gray-800">Operator Pipeline</h3>\n      <p class="text-xs text-gray-500">Check the console for filtered results!</p>\n      <button (click)="runPipeline()" class="w-full py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded transition-colors">\n        Run Pipeline\n      </button>\n    </div>\n  \`\n})\nexport class OperatorsComponent {\n  runPipeline() {\n    of(1, 2, 3, 4, 5, 6).pipe(\n      tap(val => console.log('Original:', val)),\n      filter(val => val % 2 === 0),\n      map(val => val * 10),\n      tap(val => console.log('Transformed:', val))\n    ).subscribe(result => {\n      console.log('Final output:', result);\n    });\n  }\n}`
            },
            {
                id: "rxjs-3",
                title: "Higher-Order Mapping (switchMap, mergeMap)",
                objectives: ["Understand higher-order Observables", "Use switchMap for search-type scenarios", "Use mergeMap for parallel requests", "Choose the right mapping operator"],
                takeaways: ["switchMap cancels previous inner Observable", "mergeMap runs all inner Observables in parallel", "concatMap runs inner Observables one at a time"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Higher-Order Observable Mapping</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">When one Observable triggers another Observable, you need <strong>higher-order mapping operators</strong>. They flatten nested Observables into a single output stream.</p>
                    
                    <div class="grid md:grid-cols-3 gap-4 my-6">
                        <div class="bg-teal-50 border border-teal-200 rounded-xl p-4">
                            <h4 class="font-bold text-teal-800 text-sm"><i class="fa-solid fa-arrow-right-arrow-left"></i> switchMap</h4>
                            <p class="text-teal-700 text-xs mt-1">Cancels previous inner Observable when a new value arrives. Best for: <strong>search boxes, auto-complete</strong>.</p>
                        </div>
                        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <h4 class="font-bold text-amber-800 text-sm"><i class="fa-solid fa-code-branch"></i> mergeMap</h4>
                            <p class="text-amber-700 text-xs mt-1">All inner Observables run simultaneously. Results interleave. Best for: <strong>parallel API calls</strong>.</p>
                        </div>
                        <div class="bg-sky-50 border border-sky-200 rounded-xl p-4">
                            <h4 class="font-bold text-sky-800 text-sm"><i class="fa-solid fa-list-ol"></i> concatMap</h4>
                            <p class="text-sky-700 text-xs mt-1">Inner Observables run one after another. Best for: <strong>ordered API requests, upload queue</strong>.</p>
                        </div>
                    </div>
                `,
                defaultCode: `import { Component } from '@angular/core';\nimport { fromEvent, of } from 'rxjs';\nimport { switchMap, delay, map } from 'rxjs/operators';\n\n@Component({\n  selector: 'app-higher-order',\n  standalone: true,\n  template: \`\n    <div class="p-6 bg-white border rounded-xl shadow-sm max-w-sm mx-auto space-y-4">\n      <h3 class="font-bold text-gray-800">switchMap Example</h3>\n      <input #searchInput placeholder="Type to search..." \n        class="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />\n      <p class="text-xs text-gray-500">Opens the console to see switchMap in action!</p>\n      <button (click)="setupSearch(searchInput)" class="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold rounded transition-colors">\n        Setup Search Simulation\n      </button>\n    </div>\n  \`\n})\nexport class HigherOrderComponent {\n  setupSearch(input: HTMLInputElement) {\n    fromEvent(input, 'input').pipe(\n      map((e: any) => e.target.value),\n      switchMap(query => {\n        console.log('Searching for:', query);\n        return of(\`Results for \${query}\`).pipe(delay(500));\n      })\n    ).subscribe(result => {\n      console.log('Got:', result);\n    });\n  }\n}`
            },
            {
                id: "rxjs-4",
                title: "Error Handling & Completion",
                objectives: ["Handle errors in Observable chains", "Use catchError for graceful error recovery", "Use retry for transient failures", "Understand Observable completion"],
                takeaways: ["catchError catches errors and returns a fallback Observable", "retry resubscribes on error a specified number of times", "finalize runs on both success and error"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Graceful Error Handling</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Observables can error out. RxJS provides operators to handle errors gracefully and even retry failed operations.</p>
                    
                    <div class="grid md:grid-cols-3 gap-4 my-6">
                        <div class="bg-red-50 border border-red-200 rounded-xl p-4">
                            <h4 class="font-bold text-red-800 text-sm"><i class="fa-solid fa-shield"></i> catchError</h4>
                            <p class="text-red-700 text-xs mt-1">Catches the error and returns a fallback Observable or throws a custom error.</p>
                        </div>
                        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <h4 class="font-bold text-amber-800 text-sm"><i class="fa-solid fa-rotate"></i> retry</h4>
                            <p class="text-amber-700 text-xs mt-1">Re-subscribes to the source Observable N times on error. Great for flaky network connections.</p>
                        </div>
                        <div class="bg-sky-50 border border-sky-200 rounded-xl p-4">
                            <h4 class="font-bold text-sky-800 text-sm"><i class="fa-solid fa-flag-checkered"></i> finalize</h4>
                            <p class="text-sky-700 text-xs mt-1">Runs a callback when the Observable completes or errors. Like a finally block.</p>
                        </div>
                    </div>
                `,
                defaultCode: `import { Component } from '@angular/core';\nimport { of, throwError } from 'rxjs';\nimport { catchError, retry, finalize } from 'rxjs/operators';\n\n@Component({\n  selector: 'app-error-handling',\n  standalone: true,\n  template: \`\n    <div class="p-6 bg-white border rounded-xl shadow-sm max-w-sm mx-auto space-y-4">\n      <h3 class="font-bold text-gray-800">Error Handling Demo</h3>\n      <p class="text-xs text-gray-500">Check the console to see error handling in action!</p>\n      <div class="flex gap-2">\n        <button (click)="runSuccess()" class="flex-1 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold rounded transition-colors">\n          Success Path\n        </button>\n        <button (click)="runWithError()" class="flex-1 py-2 bg-red-400 hover:bg-red-500 text-white text-xs font-bold rounded transition-colors">\n          Error Path\n        </button>\n      </div>\n    </div>\n  \`\n})\nexport class ErrorHandlingComponent {\n  runSuccess() {\n    of('Data loaded!').pipe(\n      finalize(() => console.log('✅ Operation completed'))\n    ).subscribe(console.log);\n  }\n  runWithError() {\n    throwError(() => new Error('Network error!')).pipe(\n      retry(1),\n      catchError(err => of('Fallback data after error')),\n      finalize(() => console.log('✅ Operation completed (with fallback)'))\n    ).subscribe(console.log);\n  }\n}`
            }
        ],
        quiz: [
            {
                id: "q-rxjs-1",
                question: "Which Angular template pipe is used to subscribe directly to an Observable and clean up on destruction?",
                options: ["subscribe", "async", "stream", "resolve"],
                correct: 1
            },
            {
                id: "q-rxjs-2",
                question: "Which operator transforms each emitted value in an Observable stream?",
                options: ["filter", "map", "tap", "take"],
                correct: 1
            },
            {
                id: "q-rxjs-3",
                question: "Which higher-order mapping operator should you use for a search box that cancels old requests?",
                options: ["mergeMap", "concatMap", "switchMap", "exhaustMap"],
                correct: 2
            },
            {
                id: "q-rxjs-4",
                question: "Which operator provides a fallback Observable when an error occurs?",
                options: ["retry", "finalize", "catchError", "throwError"],
                correct: 2
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
                objectives: ["Set up the Angular Router", "Define routes with path and component", "Use router-outlet as a content placeholder", "Navigate with routerLink"],
                takeaways: ["Routes map URLs to components", "<router-outlet> is where routed components render", "routerLink enables SPA navigation without page reload"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Single Page Routing</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Angular has built-in routing modules allowing single-page app (SPA) transition. Components are swapped in and out inside the <code>&lt;router-outlet&gt;</code> element placeholder.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">To link pages without reloading the page, use the <code>routerLink</code> directive instead of standard <code>href</code> links.</p>
                    
                    <div class="bg-teal-50 border border-teal-200 rounded-xl p-4 my-6">
                        <h4 class="font-bold text-teal-800 text-sm">Route Configuration Example</h4>
                        <pre class="text-xs text-teal-700 mt-2 bg-white p-3 rounded overflow-x-auto"><code>const routes: Routes = [\n  { path: '', component: HomeComponent },\n  { path: 'about', component: AboutComponent },\n  { path: 'contact', component: ContactComponent }\n];</code></pre>
                    </div>
                `,
                defaultCode: `import { Component } from '@angular/core';\n\n@Component({\n  selector: 'app-routing-demo',\n  standalone: true,\n  template: \`\n    <div class="p-6 bg-white border border-gray-200 rounded-xl space-y-4 shadow-sm">\n      <h3 class="text-md font-bold text-slate-800">App Routing Simulation</h3>\n      \n      <nav class="flex space-x-3 bg-slate-50 p-2 rounded-lg border border-slate-100">\n        <a class="text-xs text-teal-600 font-bold hover:underline cursor-pointer">Dashboard</a>\n        <a class="text-xs text-slate-500 font-bold hover:underline cursor-pointer">User Profile</a>\n      </nav>\n\n      <div class="p-4 border border-dashed border-teal-300 rounded bg-teal-50/20 min-h-[60px] flex items-center justify-center">\n        <p class="text-xs text-teal-800">\n          &lt;router-outlet&gt; Active: Welcome to Dashboard Component!\n        </p>\n      </div>\n    </div>\n  \`\n})\nexport class RoutingDemoComponent {}`
            },
            {
                id: "routing-2",
                title: "Route Parameters & Navigation",
                objectives: ["Define routes with dynamic parameters", "Read route params using ActivatedRoute", "Navigate programmatically with Router", "Use query parameters"],
                takeaways: ["Use :param in route paths for dynamic segments", "ActivatedRoute gives access to params, queryParams, and data", "Router.navigate() for programmatic navigation"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Dynamic Routes and Navigation</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Routes can contain dynamic parameters. For example, <code>/products/:id</code> matches <code>/products/42</code> or <code>/products/abc</code>.</p>
                    
                    <div class="bg-amber-50 border border-amber-200 rounded-xl p-5 my-6">
                        <h4 class="font-bold text-amber-800 mb-2">Reading Route Params</h4>
                        <pre class="text-xs bg-white p-3 rounded overflow-x-auto"><code>// Option 1: Snapshot (for initial load)\nthis.route.snapshot.paramMap.get('id')\n\n// Option 2: Observable (for reactive updates)\nthis.route.paramMap.subscribe(params => {\n  const id = params.get('id');\n});\n\n// Programmatic navigation\nthis.router.navigate(['/products', 42]);\nthis.router.navigateByUrl('/products/42');</code></pre>
                    </div>

                    <div class="bg-amber-50 border-l-4 border-amber-400 p-4 my-6 rounded-r-lg">
                        <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Tip:</strong> Use the paramMap Observable (not snapshot) when the same component might be reused for different params — like navigating from product 42 to product 99.</p>
                    </div>
                `,
                defaultCode: `import { Component } from '@angular/core';\nimport { ActivatedRoute, Router } from '@angular/router';\n\n@Component({\n  selector: 'app-route-params',\n  standalone: true,\n  template: \`\n    <div class="p-6 bg-white border rounded-xl shadow-sm max-w-sm mx-auto space-y-4">\n      <h3 class="font-bold text-gray-800">Route Parameter Demo</h3>\n      <div class="p-3 bg-amber-50 rounded-lg text-sm">\n        Current Product ID: <strong class="text-amber-800">{{ productId || 'None' }}</strong>\n      </div>\n      <p class="text-xs text-gray-500">Switch to Routing tab and visit /products/42 to see params in action!</p>\n    </div>\n  \`\n})\nexport class RouteParamsComponent {\n  productId: string | null = null;\n  constructor(private route: ActivatedRoute, private router: Router) {\n    this.productId = this.route.snapshot.paramMap.get('id');\n  }\n  goToProduct(id: number) {\n    this.router.navigate(['/products', id]);\n  }\n}`
            },
            {
                id: "routing-3",
                title: "Lazy Loading & Route Guards",
                objectives: ["Implement lazy loading for better performance", "Create route guards with CanActivate", "Protect routes from unauthorized access", "Use CanDeactivate for unsaved changes"],
                takeaways: ["Lazy loading loads code only when the route is visited", "CanActivate guard checks access before entering a route", "CanDeactivate warns before leaving with unsaved changes"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Route Guards & Lazy Loading</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed"><strong>Lazy loading</strong> delays loading feature modules until the user visits that route. This reduces initial bundle size and improves startup time.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed"><strong>Route guards</strong> control access to routes. Use them for authentication, authorization, and preventing accidental navigation.</p>
                    
                    <div class="grid md:grid-cols-2 gap-4 my-6">
                        <div class="bg-teal-50 border border-teal-200 rounded-xl p-4">
                            <h4 class="font-bold text-teal-800 text-sm"><i class="fa-solid fa-lock"></i> CanActivate</h4>
                            <p class="text-teal-700 text-xs mt-1">Checks if a route can be activated. Returns true/false or an Observable/Promise of boolean.</p>
                        </div>
                        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <h4 class="font-bold text-amber-800 text-sm"><i class="fa-solid fa-triangle-exclamation"></i> CanDeactivate</h4>
                            <p class="text-amber-700 text-xs mt-1">Checks if the user can leave a route. Used for forms with unsaved changes.</p>
                        </div>
                    </div>
                `,
                defaultCode: `import { Injectable, Component } from '@angular/core';\nimport { CanActivate, Router } from '@angular/router';\n\n@Injectable({ providedIn: 'root' })\nexport class AuthGuard implements CanActivate {\n  constructor(private router: Router) {}\n  canActivate(): boolean {\n    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';\n    if (!isLoggedIn) {\n      this.router.navigate(['/login']);\n      return false;\n    }\n    return true;\n  }\n}\n\n@Component({\n  selector: 'app-guard-demo',\n  standalone: true,\n  template: \`\n    <div class="p-6 bg-white border rounded-xl shadow-sm max-w-sm mx-auto space-y-4">\n      <h3 class="font-bold text-gray-800">Auth Guard Demo</h3>\n      <div class="p-3 bg-teal-50 rounded-lg text-sm text-teal-800">\n        Check console. The AuthGuard protects this route!\n      </div>\n      <p class="text-xs text-gray-500">The guard checks localStorage for login status before allowing access.</p>\n    </div>\n  \`\n})\nexport class GuardDemoComponent {\n  constructor() {\n    console.log('GuardDemoComponent loaded — user is authenticated!');\n  }\n}`
            },
            {
                id: "routing-4",
                title: "Nested Routes & Child Routes",
                objectives: ["Create nested route configurations", "Use multiple router-outlet levels", "Build tabbed navigation with child routes", "Share data between parent and child routes"],
                takeaways: ["Child routes nest inside parent routes using children array", "Each level can have its own router-outlet", "ActivatedRoute.data helps share resolved data"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Nested Route Configurations</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Angular supports nested routing where a parent route renders child components inside its own <code>&lt;router-outlet&gt;</code>. This is perfect for layouts with tabs, sidebars, or multi-step wizards.</p>
                    
                    <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-5 my-6">
                        <h4 class="font-bold text-indigo-800 mb-2">Child Route Configuration</h4>
                        <pre class="text-xs bg-white p-3 rounded overflow-x-auto"><code>const routes: Routes = [{\n  path: 'dashboard',\n  component: DashboardComponent,\n  children: [\n    { path: 'profile', component: ProfileComponent },\n    { path: 'settings', component: SettingsComponent },\n    { path: '', redirectTo: 'profile', pathMatch: 'full' }\n  ]\n}];</code></pre>
                    </div>
                `,
                defaultCode: `import { Component } from '@angular/core';\n\n@Component({\n  selector: 'app-parent',\n  standalone: true,\n  template: \`\n    <div class="p-6 bg-white border rounded-xl shadow-sm max-w-md mx-auto">\n      <h3 class="font-bold text-gray-800 mb-3">Dashboard Layout</h3>\n      <nav class="flex gap-2 mb-4 border-b pb-2">\n        <a class="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full font-semibold">Profile</a>\n        <a class="text-xs px-3 py-1 text-gray-500 hover:bg-gray-100 rounded-full">Settings</a>\n      </nav>\n      <div class="p-4 bg-indigo-50 border border-dashed border-indigo-300 rounded-lg text-sm text-indigo-700">\n        <i class="fa-solid fa-arrows-left-right mr-1"></i>\n        Nested &lt;router-outlet&gt; renders child content here\n      </div>\n    </div>\n  \`\n})\nexport class ParentComponent {}`
            }
        ],
        quiz: [
            {
                id: "q-routing-1",
                question: "What element serves as a placeholder where components for active routes are rendered?",
                options: ["<router-view>", "<route-outlet>", "<router-outlet>", "<ng-route>"],
                correct: 2
            },
            {
                id: "q-routing-2",
                question: "Which directive is used for SPA navigation without page reload?",
                options: ["href", "routerLink", "routeLink", "appLink"],
                correct: 1
            },
            {
                id: "q-routing-3",
                question: "Which guard prevents unauthorized users from accessing a route?",
                options: ["CanDeactivate", "CanLoad", "CanActivate", "CanMatch"],
                correct: 2
            },
            {
                id: "q-routing-4",
                question: "How do you define a route with a dynamic parameter?",
                options: ["path: '/products/:id'", "path: '/products/{id}'", "path: '/products/<id>'", "path: '/products/[id]'"],
                correct: 0
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
                objectives: ["Understand Reactive vs Template-driven forms", "Create FormGroup and FormControl", "Add validators to form controls", "Display validation error messages"],
                takeaways: ["Reactive Forms use FormGroup and FormControl classes", "Validators are functions that return validation errors", "FormGroup wraps multiple controls for complex forms"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Structured Form Submissions</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Angular supplies two styles of forms: <strong>Template-Driven Forms</strong> (suited for simple binding) and <strong>Reactive Forms</strong> (recommended for complex logic, testability, and reactive validations).</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Reactive forms use model objects (<code>FormGroup</code> and <code>FormControl</code>) defined in component TS classes, linking them directly to input elements in the view template.</p>
                    
                    <div class="bg-teal-50 border-l-4 border-teal-400 p-4 my-6 rounded-r-lg">
                        <p class="text-teal-800 font-medium"><i class="fa-solid fa-circle-info mr-2"></i><strong>Pro Tip:</strong> Reactive forms are easier to test because the form model is plain TypeScript — no template required for unit testing!</p>
                    </div>
                `,
                defaultCode: `import { Component } from '@angular/core';\nimport { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';\n\n@Component({\n  selector: 'app-reactive-form',\n  standalone: true,\n  imports: [ReactiveFormsModule],\n  template: \`\n    <form [formGroup]="signupForm" (ngSubmit)="onSubmit()" class="p-6 bg-white border rounded-xl shadow-sm max-w-sm mx-auto space-y-4">\n      <h3 class="text-lg font-bold text-gray-800">Sign Up</h3>\n      \n      <div>\n        <label class="block text-xs font-semibold text-gray-500 mb-1">Name</label>\n        <input formControlName="name" class="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />\n        @if (signupForm.get('name')?.invalid && signupForm.get('name')?.touched) {\n          <p class="text-red-500 text-xs mt-1">Name is required</p>\n        }\n      </div>\n      \n      <div>\n        <label class="block text-xs font-semibold text-gray-500 mb-1">Email</label>\n        <input formControlName="email" class="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />\n      </div>\n\n      <button type="submit" [disabled]="signupForm.invalid" class="w-full py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 text-white text-xs font-bold rounded transition-colors">\n        Submit\n      </button>\n    </form>\n  \`\n})\nexport class ReactiveFormComponent {\n  signupForm = this.fb.group({\n    name: ['', Validators.required],\n    email: ['', [Validators.required, Validators.email]]\n  });\n  constructor(private fb: FormBuilder) {}\n  onSubmit() {\n    console.log('Form submitted:', this.signupForm.value);\n  }\n}`
            },
            {
                id: "forms-2",
                title: "Form Controls & Validators",
                objectives: ["Use built-in validators: required, minLength, email, pattern", "Create custom validators", "Show targeted error messages", "Handle form submission and reset"],
                takeaways: ["Validators are functions that return null (valid) or an error object", "Use Validators.compose for multiple validators", "Check control.touched before showing errors"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Validators in Depth</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Angular provides built-in validators: <code>required</code>, <code>minLength</code>, <code>maxLength</code>, <code>email</code>, <code>pattern</code>, <code>min</code>, and <code>max</code>.</p>
                    
                    <div class="bg-amber-50 border border-amber-200 rounded-xl p-5 my-6">
                        <h4 class="font-bold text-amber-800 mb-3">Validation Error Display Pattern</h4>
                        <pre class="text-xs bg-white p-3 rounded overflow-x-auto"><code>@if (control.invalid && control.touched) {\n  @if (control.errors?.['required']) {\n    <p>Field is required</p>\n  }\n  @if (control.errors?.['minlength']) {\n    <p>Min {{ control.errors?.['minlength'].requiredLength }} chars</p>\n  }\n}</code></pre>
                    </div>

                    <div class="bg-amber-50 border-l-4 border-amber-400 p-4 my-6 rounded-r-lg">
                        <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Tip:</strong> Always check <code>touched</code> before showing errors — otherwise errors appear immediately as the user starts typing, which is a poor UX!</p>
                    </div>
                `,
                defaultCode: `import { Component } from '@angular/core';\nimport { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';\n\n@Component({\n  selector: 'app-validation',\n  standalone: true,\n  imports: [ReactiveFormsModule],\n  template: \`\n    <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="p-6 bg-white border rounded-xl shadow-sm max-w-sm mx-auto space-y-3">\n      <h3 class="font-bold text-gray-800">Validation Demo</h3>\n      \n      <div>\n        <input formControlName="username" placeholder="Username (min 3 chars)" \n          class="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />\n        @if (userForm.get('username')?.invalid && userForm.get('username')?.touched) {\n          <p class="text-red-500 text-xs mt-1">\n            {{ userForm.get('username')?.errors?.['required'] ? 'Required' : 'Min 3 characters' }}\n          </p>\n        }\n      </div>\n\n      <div>\n        <input formControlName="email" placeholder="Email" type="email"\n          class="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />\n        @if (userForm.get('email')?.invalid && userForm.get('email')?.touched) {\n          <p class="text-red-500 text-xs mt-1">Valid email required</p>\n        }\n      </div>\n\n      <div class="flex gap-2">\n        <button type="submit" [disabled]="userForm.invalid" \n          class="flex-1 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white text-xs font-bold rounded transition-colors">\n          Submit\n        </button>\n        <button type="button" (click)="userForm.reset()" \n          class="px-3 py-2 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200">Reset</button>\n      </div>\n    </form>\n  \`\n})\nexport class ValidationComponent {\n  userForm = this.fb.group({\n    username: ['', [Validators.required, Validators.minLength(3)]],\n    email: ['', [Validators.required, Validators.email]]\n  });\n  constructor(private fb: FormBuilder) {}\n  onSubmit() {\n    if (this.userForm.valid) {\n      alert('Form submitted! Check console.');\n      console.log(this.userForm.value);\n    }\n  }\n}`
            },
            {
                id: "forms-3",
                title: "Template-Driven Forms",
                objectives: ["Build forms using ngModel in the template", "Use ngModelGroup for grouped controls", "Validate template-driven forms", "Choose between template-driven and reactive approaches"],
                takeaways: ["Template-driven forms define the model in HTML", "Use #myVar=\"ngModel\" for template references", "Best for simple forms with basic validation"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Template-Driven Approach</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Template-driven forms rely on directives in the HTML template. Angular creates the <code>FormGroup</code> and <code>FormControl</code> objects behind the scenes — no TypeScript model needed.</p>
                    
                    <div class="grid md:grid-cols-2 gap-4 my-6">
                        <div class="bg-teal-50 border border-teal-200 rounded-xl p-4">
                            <h4 class="font-bold text-teal-800 text-sm"><i class="fa-solid fa-paint-brush"></i> Template-Driven</h4>
                            <p class="text-teal-700 text-xs mt-1">Model defined in HTML via directives. Less code but less control. Good for: login, contact, subscribe forms.</p>
                        </div>
                        <div class="bg-sky-50 border border-sky-200 rounded-xl p-4">
                            <h4 class="font-bold text-sky-800 text-sm"><i class="fa-solid fa-code"></i> Reactive Forms</h4>
                            <p class="text-sky-700 text-xs mt-1">Model defined in TypeScript. More code but more control. Good for: complex, dynamic, or tested forms.</p>
                        </div>
                    </div>
                `,
                defaultCode: `import { Component } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\n\n@Component({\n  selector: 'app-template-form',\n  standalone: true,\n  imports: [FormsModule],\n  template: \`\n    <div class="p-6 bg-white border rounded-xl shadow-sm max-w-sm mx-auto">\n      <h3 class="font-bold text-gray-800 mb-4">Template-Driven Form</h3>\n      \n      <form #myForm="ngForm" (ngSubmit)="onSubmit(myForm)" class="space-y-3">\n        <div>\n          <label class="text-xs font-semibold text-gray-500">Name</label>\n          <input name="name" ngModel required #name="ngModel" \n            class="w-full p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />\n          @if (name.invalid && name.touched) {\n            <p class="text-red-500 text-xs mt-1">Required</p>\n          }\n        </div>\n        \n        <button type="submit" [disabled]="myForm.invalid" \n          class="w-full py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 text-white text-xs font-bold rounded transition-colors">\n          Submit\n        </button>\n      </form>\n    </div>\n  \`\n})\nexport class TemplateFormComponent {\n  onSubmit(form: any) {\n    console.log('Form submitted:', form.value);\n    alert('Submitted! Check console.');\n    form.reset();\n  }\n}`
            },
            {
                id: "forms-4",
                title: "Dynamic Form Arrays",
                objectives: ["Create dynamic forms with FormArray", "Add and remove form controls dynamically", "Build an editable list component", "Track form array changes"],
                takeaways: ["FormArray holds a dynamic list of FormControl or FormGroup", "Use push/removeAt to modify the array", "Perfect for multi-item forms like ingredients or tasks"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Dynamic Form Arrays</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed"><code>FormArray</code> manages a dynamic list of form controls. It's like <code>FormGroup</code> but for an array of controls rather than a fixed set.</p>
                    
                    <div class="bg-purple-50 border border-purple-200 rounded-xl p-5 my-6">
                        <h4 class="font-bold text-purple-800 mb-2">FormArray Methods</h4>
                        <ul class="space-y-1 text-sm text-purple-700">
                            <li><code>push(control)</code> — Add a new control</li>
                            <li><code>removeAt(index)</code> — Remove a control at index</li>
                            <li><code>at(index)</code> — Get control at index</li>
                            <li><code>length</code> — Number of controls</li>
                            <li><code>clear()</code> — Remove all controls</li>
                        </ul>
                    </div>
                `,
                defaultCode: `import { Component } from '@angular/core';\nimport { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';\n\n@Component({\n  selector: 'app-dynamic-form',\n  standalone: true,\n  imports: [ReactiveFormsModule],\n  template: \`\n    <div class="p-6 bg-white border rounded-xl shadow-sm max-w-sm mx-auto">\n      <h3 class="font-bold text-gray-800 mb-4">Shopping List</h3>\n      \n      <form [formGroup]="listForm">\n        <div formArrayName="items" class="space-y-2 mb-4">\n          @for (item of items.controls; track item; let i = $index) {\n            <div class="flex gap-2 items-center">\n              <input [formControlName]="i" placeholder="Item {{ i + 1 }}"\n                class="flex-1 p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />\n              <button type="button" (click)="removeItem(i)" \n                class="px-2 py-1 bg-red-100 text-red-600 text-xs rounded hover:bg-red-200">&times;</button>\n            </div>\n          }\n        </div>\n      </form>\n      \n      <button (click)="addItem()" class="w-full py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold rounded transition-colors">\n        + Add Item\n      </button>\n    </div>\n  \`\n})\nexport class DynamicFormComponent {\n  listForm = this.fb.group({\n    items: this.fb.array([this.fb.control('', Validators.required)])\n  });\n  get items() { return this.listForm.get('items') as any; }\n  constructor(private fb: FormBuilder) {}\n  addItem() { this.items.push(this.fb.control('', Validators.required)); }\n  removeItem(index: number) { this.items.removeAt(index); }\n}`
            }
        ],
        quiz: [
            {
                id: "q-forms-1",
                question: "Which class from Reactive Forms is used to define a collection of form controls?",
                options: ["FormControl", "FormBuilder", "FormGroup", "FormArray"],
                correct: 2
            },
            {
                id: "q-forms-2",
                question: "Which method should you check before showing validation errors to avoid premature messages?",
                options: ["dirty", "touched", "pristine", "valid"],
                correct: 1
            },
            {
                id: "q-forms-3",
                question: "FormArray is best used for what scenario?",
                options: ["A single checkbox", "A dynamic list of controls", "A fixed login form", "A static contact form"],
                correct: 1
            },
            {
                id: "q-forms-4",
                question: "What is the main advantage of Reactive Forms over Template-Driven Forms?",
                options: ["Less TypeScript code", "Better for complex validation and testing", "Works without FormsModule", "Automatic error messages"],
                correct: 1
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
                objectives: ["Understand what Signals are and why they exist", "Create writable signals with signal()", "Read and update signal values", "Use signals in templates with ()"],
                takeaways: ["signal() creates a reactive value container", "Signals enable fine-grained reactivity without Zone.js", "Use () to read signal values in templates"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Reactive Signals: fine-grained reactivity</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed"><strong>Signals</strong> are the biggest change in Angular's rendering engine. A Signal is a wrapper around a value that notifies interested consumers when that value changes.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Angular signals are highly performant because they enable <strong>fine-grained reactivity</strong>. Instead of traversing the entire component tree to check for changes, Angular knows exactly which DOM node depends on which signal and updates only that node.</p>
                    <ul class="list-disc pl-6 mb-4 space-y-2 text-gray-700">
                        <li><code>signal(initialValue)</code>: Declares a writeable signal.</li>
                        <li><code>computed(() => expression)</code>: Declares a read-only signal derived from other signals.</li>
                        <li><code>effect(() => operation)</code>: Performs side effects when dependent signals change.</li>
                    </ul>
                    
                    <div class="bg-amber-50 border-l-4 border-amber-400 p-4 my-6 rounded-r-lg">
                        <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Key insight:</strong> Signals are synchronous — calling <code>signal()</code> always returns the current value immediately. No subscriptions needed!</p>
                    </div>
                `,
                defaultCode: `import { Component, signal, computed } from '@angular/core';\n\n@Component({\n  selector: 'app-signals-demo',\n  standalone: true,\n  template: \`\n    <div class="p-6 bg-amber-50/50 border border-amber-200 rounded-xl text-center space-y-4 max-w-sm mx-auto shadow-sm">\n      <h3 class="text-lg font-black text-amber-900">Signals State Sandbox</h3>\n      \n      <div class="flex justify-center items-center gap-6 py-2">\n        <div class="text-center">\n          <span class="block text-[10px] uppercase font-bold text-gray-400">Count</span>\n          <span class="text-2xl font-bold text-gray-800">{{ count() }}</span>\n        </div>\n        <div class="text-center">\n          <span class="block text-[10px] uppercase font-bold text-gray-400">Double</span>\n          <span class="text-2xl font-bold text-amber-600">{{ doubleCount() }}</span>\n        </div>\n      </div>\n\n      <div class="flex gap-2 justify-center">\n        <button (click)="increment()" class="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded font-bold text-xs shadow-sm transition-colors">\n          Increment\n        </button>\n        <button (click)="decrement()" class="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded font-bold text-xs hover:bg-gray-50 shadow-sm transition-colors">\n          Decrement\n        </button>\n      </div>\n    </div>\n  \`\n})\nexport class SignalsDemoComponent {\n  count = signal(0);\n  doubleCount = computed(() => this.count() * 2);\n\n  increment() { this.count.update(c => c + 1); }\n  decrement() { this.count.update(c => c - 1); }\n}`
            },
            {
                id: "signals-2",
                title: "Computed Signals & Effects",
                objectives: ["Create derived state with computed()", "Run side effects with effect()", "Understand lazy evaluation of computed signals", "Use effect() for logging and synchronization"],
                takeaways: ["computed() lazily derives values from other signals", "effect() runs side effects when dependent signals change", "computed is read-only and automatically updates"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Derived State with Computed</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed"><code>computed()</code> creates a read-only signal whose value is derived from other signals. It <strong>lazily evaluates</strong> — it only recalculates when something reads its value AND its dependencies have changed.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed"><code>effect()</code> schedules a callback that runs whenever its signal dependencies change. Use it for logging, syncing to localStorage, or triggering imperative operations.</p>
                    
                    <div class="grid md:grid-cols-2 gap-4 my-6">
                        <div class="bg-sky-50 border border-sky-200 rounded-xl p-4">
                            <h4 class="font-bold text-sky-800 text-sm"><i class="fa-solid fa-calculator"></i> computed()</h4>
                            <p class="text-sky-700 text-xs mt-1">Derives a value automatically. Like a spreadsheet formula that updates when input cells change.</p>
                        </div>
                        <div class="bg-purple-50 border border-purple-200 rounded-xl p-4">
                            <h4 class="font-bold text-purple-800 text-sm"><i class="fa-solid fa-bolt"></i> effect()</h4>
                            <p class="text-purple-700 text-xs mt-1">Runs a callback on dependency changes. Like a webhook that fires when data updates.</p>
                        </div>
                    </div>
                `,
                defaultCode: `import { Component, signal, computed, effect } from '@angular/core';\n\n@Component({\n  selector: 'app-computed-effect',\n  standalone: true,\n  template: \`\n    <div class="p-6 bg-white border rounded-xl shadow-sm max-w-sm mx-auto space-y-4">\n      <h3 class="font-bold text-gray-800">Computed & Effect</h3>\n      \n      <div>\n        <label class="text-xs font-semibold text-gray-500">Temperature (°C)</label>\n        <div class="flex gap-2 mt-1">\n          <button (click)="adjust(-5)" class="px-3 py-1 bg-sky-100 text-sky-700 rounded text-sm font-bold">-5</button>\n          <span class="flex-1 text-center text-2xl font-bold text-sky-600 py-1">{{ temp() }}°C</span>\n          <button (click)="adjust(5)" class="px-3 py-1 bg-amber-100 text-amber-700 rounded text-sm font-bold">+5</button>\n        </div>\n      </div>\n      \n      <div class="p-3 bg-gray-50 rounded-lg text-sm text-center">\n        <p>In Fahrenheit: <strong class="text-purple-600">{{ fahrenheit() }}°F</strong></p>\n        <p class="text-xs text-gray-400 mt-1">Computed from temperature signal</p>\n      </div>\n    </div>\n  \`\n})\nexport class ComputedEffectComponent {\n  temp = signal(20);\n  fahrenheit = computed(() => Math.round(this.temp() * 9/5 + 32));\n  \n  constructor() {\n    effect(() => console.log('Temperature changed to:', this.temp()));\n  }\n  \n  adjust(amount: number) { this.temp.update(t => t + amount); }\n}`
            },
            {
                id: "signals-3",
                title: "Signal-based Inputs & Queries",
                objectives: ["Use input() instead of @Input()", "Use output() instead of @Output()", "Use viewChild() and contentChild() signals", "Understand the benefits of signal-based queries"],
                takeaways: ["input() creates a reactive input with signal semantics", "output() emits events without EventEmitter boilerplate", "viewChild() returns a signal that updates when the queried element changes"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Modern Inputs and Queries</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Angular 17.2+ introduces <strong>signal-based inputs and queries</strong>. These replace the decorator-based <code>@Input()</code>, <code>@Output()</code>, <code>@ViewChild()</code>, and <code>@ContentChild()</code> with cleaner function-based APIs.</p>
                    
                    <div class="grid md:grid-cols-2 gap-4 my-6">
                        <div class="bg-teal-50 border border-teal-200 rounded-xl p-4">
                            <h4 class="font-bold text-teal-800 text-sm"><i class="fa-solid fa-arrow-right-to-bracket"></i> input()</h4>
                            <p class="text-teal-700 text-xs mt-1"><code>name = input('default')</code> — Creates a reactive input signal. Read with <code>this.name()</code> in code or <code>{{ name() }}</code> in template.</p>
                        </div>
                        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <h4 class="font-bold text-amber-800 text-sm"><i class="fa-solid fa-arrow-right-from-bracket"></i> output()</h4>
                            <p class="text-amber-700 text-xs mt-1"><code>saved = output<string>()</code> — Emits typed events. Use <code>this.saved.emit(value)</code> to emit.</p>
                        </div>
                        <div class="bg-sky-50 border border-sky-200 rounded-xl p-4">
                            <h4 class="font-bold text-sky-800 text-sm"><i class="fa-solid fa-eye"></i> viewChild()</h4>
                            <p class="text-sky-700 text-xs mt-1"><code>el = viewChild<ElementRef>('myEl')</code> — Signal that holds the queried element reference.</p>
                        </div>
                        <div class="bg-purple-50 border border-purple-200 rounded-xl p-4">
                            <h4 class="font-bold text-purple-800 text-sm"><i class="fa-solid fa-cubes"></i> contentChild()</h4>
                            <p class="text-purple-700 text-xs mt-1"><code>child = contentChild(MyChild)</code> — Signal for content-projected child components.</p>
                        </div>
                    </div>
                `,
                defaultCode: `import { Component, input, output } from '@angular/core';\n\n@Component({\n  selector: 'app-counter-btn',\n  standalone: true,\n  template: \`\n    <div class="p-4 bg-sky-50 border border-sky-200 rounded-xl text-center">\n      <p class="text-xs text-sky-600 font-semibold">Counter Button</p>\n      <p class="text-2xl font-bold text-sky-800 my-1">{{ label() }}</p>\n      <button (click)="incremented.emit()" class="px-4 py-1 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded transition-colors">\n        Click Me\n      </button>\n    </div>\n  \`\n})\nexport class CounterBtnComponent {\n  label = input('Count: 0');\n  incremented = output();\n}`
            },
            {
                id: "signals-4",
                title: "Signals vs RxJS Interop",
                objectives: ["Understand when to use Signals vs RxJS", "Convert Observables to Signals with toSignal", "Convert Signals to Observables with toObservable", "Build a hybrid reactive pipeline"],
                takeaways: ["Signals = synchronous state; RxJS = async streams", "toSignal converts Observable to Signal for templates", "toObservable converts Signal to Observable for piped operations"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Signals + RxJS = Best of Both Worlds</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Signals and RxJS serve different purposes. <strong>Signals</strong> are for simple, synchronous state management (counter, toggle, user object). <strong>RxJS</strong> excels at async streams (HTTP responses, WebSockets, user input streams).</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">Angular provides interop helpers: <code>toSignal()</code> converts an Observable into a Signal (great for using async data in templates), and <code>toObservable()</code> converts a Signal into an Observable (great for composing with RxJS operators).</p>
                    
                    <div class="bg-amber-50 border-l-4 border-amber-400 p-4 my-6 rounded-r-lg">
                        <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Mantra:</strong> Use Signals for <strong>state</strong>, RxJS for <strong>events</strong>. Signals tell you what IS. RxJS tells you what HAPPENS.</p>
                    </div>
                `,
                defaultCode: `import { Component, signal } from '@angular/core';\nimport { toObservable, toSignal } from '@angular/core/rxjs-interop';\nimport { interval, map } from 'rxjs';\n\n@Component({\n  selector: 'app-interop',\n  standalone: true,\n  template: \`\n    <div class="p-6 bg-white border rounded-xl shadow-sm max-w-sm mx-auto space-y-4">\n      <h3 class="font-bold text-gray-800">Signals ↔ RxJS Interop</h3>\n      \n      <div class="p-3 bg-purple-50 rounded-lg text-center">\n        <p class="text-xs text-purple-600">Clock (Observable → Signal)</p>\n        <p class="text-xl font-bold text-purple-800 font-mono">{{ clock() }}</p>\n      </div>\n      \n      <div class="flex gap-2">\n        <button (click)="count.update(c => c + 1)" class="flex-1 py-2 bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold rounded transition-colors">\n          Increment Count: {{ count() }}\n        </button>\n      </div>\n      <p class="text-xs text-gray-400 text-center">Signal → Observable in console</p>\n    </div>\n  \`\n})\nexport class InteropComponent {\n  count = signal(0);\n  count$ = toObservable(this.count);\n  clock = toSignal(interval(1000).pipe(map(() => new Date().toLocaleTimeString())), { initialValue: '' });\n  \n  constructor() {\n    this.count$.subscribe(val => console.log('Count Observable:', val));\n  }\n}`
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
            },
            {
                id: "q-signals-3",
                question: "What is the main advantage of signal-based inputs (input()) over @Input()?",
                options: ["They're slower but safer", "They're reactive and don't trigger ngOnChanges unnecessarily", "They work without a component class", "They're backwards compatible with AngularJS"],
                correct: 1
            },
            {
                id: "q-signals-4",
                question: "Which function converts a Signal to an Observable?",
                options: ["toSignal()", "toObservable()", "fromSignal()", "signalToObs()"],
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
                objectives: ["Build a service that manages state with signals", "Expose read-only computed signals", "Encapsulate state mutations in service methods", "Consume the service in multiple components"],
                takeaways: ["Services + Signals = lightweight state management", "Expose computed signals for derived data", "Keep state mutations inside the service"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Signal-driven Stores</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">For application-level state management, you can create Angular services that contain writeable signals, exposing them as computed properties to components. This provides a lightweight alternative to external libraries like NgRx.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">The pattern is: <strong>Service owns the state</strong> (private signals), <strong>exposes derived signals</strong> (computed), and <strong>provides action methods</strong> (functions that update signals). Components only call actions and read derived signals.</p>
                    
                    <div class="bg-teal-50 border-l-4 border-teal-400 p-4 my-6 rounded-r-lg">
                        <p class="text-teal-800 font-medium"><i class="fa-solid fa-circle-info mr-2"></i><strong>Architecture:</strong> Component → calls Service action → Service updates Signal → Angular re-renders only the DOM nodes that depend on that Signal.</p>
                    </div>
                `,
                defaultCode: `import { Injectable, Component, signal, computed } from '@angular/core';\n\n@Injectable({ providedIn: 'root' })\nexport class CartService {\n  private cartItems = signal<string[]>([]);\n  readonly items = computed(() => this.cartItems());\n  readonly totalCount = computed(() => this.cartItems().length);\n\n  addToCart(item: string) {\n    this.cartItems.update(items => [...items, item]);\n  }\n  removeItem(index: number) {\n    this.cartItems.update(items => items.filter((_, i) => i !== index));\n  }\n  clearCart() {\n    this.cartItems.set([]);\n  }\n}\n\n@Component({\n  selector: 'app-cart',\n  standalone: true,\n  template: \`\n    <div class="p-6 bg-white border border-gray-200 rounded-xl space-y-3 max-w-sm mx-auto shadow-sm">\n      <div class="flex justify-between items-center">\n        <h3 class="font-bold text-gray-800">Cart</h3>\n        <span class="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full">{{ cart.totalCount() }} Items</span>\n      </div>\n      <div class="flex gap-2">\n        <button (click)="cart.addToCart('Angular Book')" class="flex-1 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded font-bold text-xs transition-colors">+ Book</button>\n        <button (click)="cart.addToCart('TypeScript Course')" class="flex-1 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded font-bold text-xs transition-colors">+ Course</button>\n        <button (click)="cart.clearCart()" class="px-3 py-1.5 bg-gray-100 text-gray-600 rounded font-semibold text-xs hover:bg-gray-200 border transition-colors">Clear</button>\n      </div>\n    </div>\n  \`\n})\nexport class CartComponent {\n  constructor(public cart: CartService) {}\n}`
            },
            {
                id: "state-2",
                title: "Service-based State Pattern",
                objectives: ["Organize state into focused services", "Use the service-as-store pattern", "Handle loading, error, and empty states", "Provide type safety without NgRx"],
                takeaways: ["Each domain gets its own service (UserService, ProductService)", "Services expose state via signals, actions via methods", "This pattern scales well without external libraries"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">The Service Store Pattern</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">For apps that don't need the complexity of NgRx or NgXs, the <strong>Service Store Pattern</strong> is the perfect middle ground. Each domain area gets its own service that holds state and exposes mutations.</p>
                    
                    <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-5 my-6">
                        <h4 class="font-bold text-indigo-800 mb-3">Service Store Template</h4>
                        <pre class="text-xs bg-white p-3 rounded overflow-x-auto"><code>@Injectable({ providedIn: 'root' })\nexport class TodoService {\n  // Private state (writeable)\n  private todos = signal<Todo[]>([]);\n  \n  // Public derived signals (read-only)\n  readonly todoList = computed(() => this.todos());\n  readonly incompleteCount = computed(() => this.todos().filter(t => !t.done).length);\n  \n  // Public actions\n  addTodo(title: string) { ... }\n  toggleTodo(id: number) { ... }\n  removeTodo(id: number) { ... }\n}</code></pre>
                    </div>
                `,
                defaultCode: `import { Injectable, Component, signal, computed } from '@angular/core';\n\ninterface Todo {\n  id: number;\n  title: string;\n  done: boolean;\n}\n\n@Injectable({ providedIn: 'root' })\nexport class TodoService {\n  private todos = signal<Todo[]>([]);\n  private nextId = 1;\n  \n  readonly todoList = computed(() => this.todos());\n  readonly incompleteCount = computed(() => this.todos().filter(t => !t.done).length);\n\n  addTodo(title: string) {\n    this.todos.update(todos => [...todos, { id: this.nextId++, title, done: false }]);\n  }\n  toggleTodo(id: number) {\n    this.todos.update(todos => todos.map(t => t.id === id ? { ...t, done: !t.done } : t));\n  }\n}\n\n@Component({\n  selector: 'app-todo',\n  standalone: true,\n  template: \`\n    <div class="p-6 bg-white border rounded-xl shadow-sm max-w-sm mx-auto space-y-3">\n      <h3 class="font-bold text-gray-800">Todo List ({{ todoService.incompleteCount() }} left)</h3>\n      <div class="flex gap-2">\n        <input #newTodo placeholder="Add todo..." class="flex-1 p-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />\n        <button (click)="todoService.addTodo(newTodo.value); newTodo.value = ''" \n          class="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded transition-colors">Add</button>\n      </div>\n    </div>\n  \`\n})\nexport class TodoComponent {\n  constructor(public todoService: TodoService) {}\n}`
            },
            {
                id: "state-3",
                title: "Signal Store Pattern",
                objectives: ["Understand the SignalStore concept", "Organize state, computed, and methods in a store", "Use the store in multiple components", "Compare SignalStore to NgRx"],
                takeaways: ["SignalStore is a community pattern for scalable state", "Each store focuses on one domain slice", "Stores are injectable and composable"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Structuring with Signal Stores</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">A <strong>Signal Store</strong> is a structured approach to state management. It organizes state, derived values, and actions into a single injectable class. Think of it as a lightweight NgRx store built with signals.</p>
                    
                    <div class="bg-purple-50 border border-purple-200 rounded-xl p-5 my-6">
                        <h4 class="font-bold text-purple-800 mb-3">Store Building Blocks</h4>
                        <ul class="space-y-2 text-sm text-purple-700">
                            <li><strong>State:</strong> Private signals holding the raw data</li>
                            <li><strong>Selectors:</strong> Computed signals that derive useful data</li>
                            <li><strong>Actions:</strong> Methods that update state</li>
                            <li><strong>Effects:</strong> Methods that handle async operations (API calls)</li>
                        </ul>
                    </div>
                `,
                defaultCode: `import { Injectable, Component, signal, computed } from '@angular/core';\n\ninterface Product {\n  id: number;\n  name: string;\n  price: number;\n}\n\n@Injectable({ providedIn: 'root' })\nexport class ProductStore {\n  // State\n  private products = signal<Product[]>([]);\n  private searchQuery = signal('');\n  \n  // Selectors\n  readonly productList = computed(() => this.products());\n  readonly filteredProducts = computed(() => {\n    const query = this.searchQuery().toLowerCase();\n    return this.products().filter(p => p.name.toLowerCase().includes(query));\n  });\n  readonly totalValue = computed(() => this.products().reduce((sum, p) => sum + p.price, 0));\n  \n  // Actions\n  setSearch(query: string) { this.searchQuery.set(query); }\n  addProduct(name: string, price: number) {\n    this.products.update(ps => [...ps, { id: Date.now(), name, price }]);\n  }\n}\n\n@Component({\n  selector: 'app-product-store',\n  standalone: true,\n  template: \`<div class="p-4 bg-purple-50 rounded-xl text-sm text-purple-800">\n    ProductStore ready! Check filteredProducts for reactive search.</div>\n  \`\n})\nexport class ProductStoreComponent {\n  constructor(public store: ProductStore) {}\n}`
            },
            {
                id: "state-4",
                title: "Global State & Caching",
                objectives: ["Implement a global cache service", "Use TTL-based cache expiration", "Cache API responses in services", "Invalidate cache on mutations"],
                takeaways: ["Cache API responses to avoid redundant network calls", "Use TTL to auto-expire stale data", "Invalidate cache entries when data is mutated"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Caching with Signals</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">A global cache service stores API responses in signals. Before making a network request, check if the data is already cached. This dramatically improves perceived performance.</p>
                    
                    <div class="grid md:grid-cols-2 gap-4 my-6">
                        <div class="bg-teal-50 border border-teal-200 rounded-xl p-4">
                            <h4 class="font-bold text-teal-800 text-sm"><i class="fa-solid fa-clock"></i> TTL Cache</h4>
                            <p class="text-teal-700 text-xs mt-1">Store data with a timestamp. If it's older than the TTL (e.g., 5 minutes), refetch from the API.</p>
                        </div>
                        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <h4 class="font-bold text-amber-800 text-sm"><i class="fa-solid fa-arrows-rotate"></i> Invalidation</h4>
                            <p class="text-amber-700 text-xs mt-1">When data is mutated (POST/PUT/DELETE), clear the relevant cache entries so they refetch fresh data.</p>
                        </div>
                    </div>
                `,
                defaultCode: `import { Injectable, Component, signal } from '@angular/core';\n\ninterface CacheEntry<T> {\n  data: T;\n  timestamp: number;\n}\n\n@Injectable({ providedIn: 'root' })\nexport class CacheService {\n  private cache = signal<Map<string, CacheEntry<any>>>(new Map());\n  private ttl = 300000; // 5 minutes\n  \n  get<T>(key: string): T | null {\n    const entry = this.cache().get(key);\n    if (!entry) return null;\n    if (Date.now() - entry.timestamp > this.ttl) {\n      this.cache.update(m => { m.delete(key); return new Map(m); });\n      return null;\n    }\n    return entry.data as T;\n  }\n  \n  set(key: string, data: any) {\n    this.cache.update(m => { m.set(key, { data, timestamp: Date.now() }); return new Map(m); });\n  }\n  \n  invalidate(key: string) {\n    this.cache.update(m => { m.delete(key); return new Map(m); });\n  }\n}\n\n@Component({\n  selector: 'app-cache-demo',\n  standalone: true,\n  template: \`<div class="p-4 bg-teal-50 rounded-xl text-sm text-teal-800">\n    Cache service ready! Data stored for 5 minutes TTL.</div>\n  \`\n})\nexport class CacheDemoComponent {\n  constructor(public cache: CacheService) {}\n}`
            }
        ],
        quiz: [
            {
                id: "q-state-1",
                question: "What is a main advantage of a service-based Signal store over traditional state managers?",
                options: ["It requires Zone.js", "It automatically handles REST calls", "It provides fine-grained reactive updates with virtually zero boilerplate", "It executes code on the server"],
                correct: 2
            },
            {
                id: "q-state-2",
                question: "In the service-based state pattern, where should state mutations live?",
                options: ["Inside components", "Inside the service", "Inside the template", "Inside utility functions"],
                correct: 1
            },
            {
                id: "q-state-3",
                question: "What is the purpose of computed() in a state management service?",
                options: ["To create writable state", "To derive read-only values from signals", "To call external APIs", "To modify DOM elements"],
                correct: 1
            },
            {
                id: "q-state-4",
                question: "What does TTL stand for in caching?",
                options: ["Total Time Loaded", "Time To Live", "Timed Transfer Layer", "Test Track Log"],
                correct: 1
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
                objectives: ["Combine components, bindings, and signals in a real app", "Build a weather dashboard with reactive state", "Use two-way binding for city search", "Use computed signals for derived data"],
                takeaways: ["Capstone projects consolidate all Angular skills", "Signals + bindings + control flow = complete feature", "Practice makes perfect — build as many capstones as you can!"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Capstone Widget Application</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Congratulations on reaching the final module of the Angular Academy! You will build a complete Weather Dashboard application here.</p>
                    <p class="mb-4 text-gray-700 leading-relaxed">This mini-project brings together Components, Two-Way bindings, Signals, Computed properties, and conditional control flows inside a single dashboard.</p>
                    
                    <div class="bg-teal-50 border-l-4 border-teal-400 p-4 my-6 rounded-r-lg">
                        <p class="text-teal-800 font-medium"><i class="fa-solid fa-circle-info mr-2"></i><strong>Challenge:</strong> Try adding a new feature — like a weather icon that changes based on the temperature! (Hot = ☀️, Cold = ❄️, Rainy = 🌧️)</p>
                    </div>
                `,
                defaultCode: `import { Component, signal, computed } from '@angular/core';\n\n@Component({\n  selector: 'app-weather-widget',\n  standalone: true,\n  template: \`\n    <div class="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 text-gray-800 border border-indigo-100 rounded-2xl shadow-md space-y-4 max-w-sm mx-auto">\n      <div class="flex justify-between items-center border-b border-indigo-100 pb-3">\n        <h3 class="font-bold text-sm">Weather Station</h3>\n        <span class="text-[10px] tracking-wider uppercase font-bold text-indigo-400">Live Simulator</span>\n      </div>\n\n      <div class="space-y-1">\n        <input [(ngModel)]="city" placeholder="Search City..." class="w-full p-2 bg-indigo-50/50 border border-indigo-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400" />\n      </div>\n\n      <div class="text-center py-4">\n        <h2 class="text-xl font-bold">{{ city || 'Select City' }}</h2>\n        <div class="text-5xl font-black text-rose-400 py-1">{{ temp() }}°C</div>\n        <p class="text-xs text-indigo-400">Conditions: {{ weatherCondition() }}</p>\n      </div>\n\n      <div class="flex gap-2">\n        <button (click)="heatUp()" class="flex-1 py-1.5 bg-rose-400 hover:bg-rose-500 text-white rounded text-xs font-bold transition-colors">Heat</button>\n        <button (click)="coolDown()" class="flex-1 py-1.5 bg-indigo-400 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-colors">Rain</button>\n      </div>\n    </div>\n  \`\n})\nexport class WeatherComponent {\n  city = 'Austin';\n  temp = signal(32);\n  weatherCondition = computed(() => this.temp() > 28 ? '☀️ Sunny' : '🌧️ Rainy');\n  heatUp() { this.temp.update(t => t + 2); }\n  coolDown() { this.temp.update(t => t - 2); }\n}`
            },
            {
                id: "capstone-2",
                title: "Task Management App",
                objectives: ["Build a full CRUD task manager", "Implement add, toggle, delete, and filter features", "Use service-based state management", "Apply Angular control flow and bindings"],
                takeaways: ["CRUD apps cover all essential Angular concepts", "Services encapsulate business logic cleanly", "@for with track ensures optimal re-rendering"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Task Manager Mini-App</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Build a task manager with features: add tasks, mark them as complete, delete tasks, and filter by status. This app touches every major Angular concept you've learned.</p>
                    
                    <div class="bg-amber-50 border border-amber-200 rounded-xl p-5 my-6">
                        <h4 class="font-bold text-amber-800 mb-2">Features to Build</h4>
                        <ul class="space-y-1 text-sm text-amber-700">
                            <li><strong>Add Task:</strong> Two-way binding + button</li>
                            <li><strong>Toggle Done:</strong> Click to mark as complete</li>
                            <li><strong>Delete:</strong> Remove a task</li>
                            <li><strong>Filter:</strong> All / Active / Completed</li>
                            <li><strong>Count:</strong> Show remaining tasks</li>
                        </ul>
                    </div>
                `,
                defaultCode: `import { Injectable, Component, signal, computed } from '@angular/core';\nimport { FormsModule } from '@angular/forms';\n\ninterface Task { id: number; title: string; done: boolean; }\n\n@Injectable({ providedIn: 'root' })\nexport class TaskService {\n  private tasks = signal<Task[]>([\n    { id: 1, title: 'Learn Angular Components', done: true },\n    { id: 2, title: 'Build a Task Manager', done: false },\n    { id: 3, title: 'Deploy to Production', done: false }\n  ]);\n  private nextId = 4;\n  filter = signal<'all' | 'active' | 'completed'>('all');\n  \n  readonly filteredTasks = computed(() => {\n    const f = this.filter();\n    if (f === 'active') return this.tasks().filter(t => !t.done);\n    if (f === 'completed') return this.tasks().filter(t => t.done);\n    return this.tasks();\n  });\n  readonly remainingCount = computed(() => this.tasks().filter(t => !t.done).length);\n\n  addTask(title: string) { this.tasks.update(t => [...t, { id: this.nextId++, title, done: false }]); }\n  toggleTask(id: number) { this.tasks.update(t => t.map(task => task.id === id ? { ...task, done: !task.done } : task)); }\n  deleteTask(id: number) { this.tasks.update(t => t.filter(task => task.id !== id)); }\n}\n\n@Component({\n  selector: 'app-task-manager',\n  standalone: true,\n  imports: [FormsModule],\n  template: \`\n    <div class="p-6 bg-white border rounded-xl shadow-sm max-w-sm mx-auto space-y-3">\n      <h3 class="font-bold text-gray-800">Task Manager</h3>\n      <div class="flex gap-2">\n        <input [(ngModel)]="newTask" (keyup.enter)="add()" placeholder="Add task..." class="flex-1 p-2 border rounded text-sm" />\n        <button (click)="add()" class="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded">Add</button>\n      </div>\n      <div class="flex gap-1">\n        @for (f of ['all', 'active', 'completed']; track f) {\n          <button (click)="service.filter.set(f)" class="px-2 py-1 text-xs rounded" [class.bg-emerald-100]="service.filter() === f" [class.text-emerald-700]="service.filter() === f">\n            {{ f | titlecase }}\n          </button>\n        }\n      </div>\n    </div>\n  \`\n})\nexport class TaskManagerComponent {\n  newTask = '';\n  constructor(public service: TaskService) {}\n  add() { if (this.newTask.trim()) { this.service.addTask(this.newTask.trim()); this.newTask = ''; } }\n}`
            },
            {
                id: "capstone-3",
                title: "Profile Settings Panel",
                objectives: ["Build a multi-tab settings page with navigation", "Use reactive forms with validation", "Implement nested layouts with routing", "Persist settings using a service"],
                takeaways: ["Settings panels combine routing, forms, and state management", "Use reactive forms for complex validation", "Services can persist state across navigation"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">Profile Settings Panel</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">Build a settings panel with multiple sections: Profile (edit name/bio), Security (change password), and Preferences (theme toggle).</p>
                    
                    <div class="bg-purple-50 border border-purple-200 rounded-xl p-5 my-6">
                        <h4 class="font-bold text-purple-800 mb-2">Project Structure</h4>
                        <ul class="space-y-1 text-sm text-purple-700">
                            <li><strong>Nested routes:</strong> /settings/profile, /settings/security, /settings/preferences</li>
                            <li><strong>Reactive forms:</strong> Profile form with validation</li>
                            <li><strong>Service state:</strong> Settings saved in a SettingsService</li>
                            <li><strong>Child router-outlet:</strong> Each section renders in the same layout</li>
                        </ul>
                    </div>
                `,
                defaultCode: `import { Injectable, Component, signal } from '@angular/core';\nimport { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';\n\ninterface UserProfile {\n  name: string;\n  email: string;\n  bio: string;\n}\n\n@Injectable({ providedIn: 'root' })\nexport class ProfileService {\n  private profile = signal<UserProfile>({ name: 'Angular Dev', email: 'dev@example.com', bio: 'Learning Angular' });\n  readonly currentProfile = () => this.profile();\n  \n  updateProfile(data: Partial<UserProfile>) {\n    this.profile.update(p => ({ ...p, ...data }));\n  }\n}\n\n@Component({\n  selector: 'app-profile-settings',\n  standalone: true,\n  imports: [ReactiveFormsModule],\n  template: \`\n    <div class="p-6 bg-white border rounded-xl shadow-sm max-w-md mx-auto">\n      <h3 class="font-bold text-gray-800 mb-4">Profile Settings</h3>\n      <form [formGroup]="profileForm" (ngSubmit)="save()" class="space-y-3">\n        <input formControlName="name" placeholder="Name" class="w-full p-2 border rounded text-sm" />\n        <input formControlName="email" placeholder="Email" class="w-full p-2 border rounded text-sm" />\n        <textarea formControlName="bio" placeholder="Bio" rows="3" class="w-full p-2 border rounded text-sm"></textarea>\n        <button type="submit" [disabled]="profileForm.invalid" class="w-full py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white text-xs font-bold rounded">\n          Save Changes\n        </button>\n      </form>\n    </div>\n  \`\n})\nexport class ProfileSettingsComponent {\n  profileForm = this.fb.group({\n    name: ['', Validators.required],\n    email: ['', [Validators.required, Validators.email]],\n    bio: ['']\n  });\n  constructor(private fb: FormBuilder, private profileService: ProfileService) {\n    this.profileForm.patchValue(this.profileService.currentProfile());\n  }\n  save() { if (this.profileForm.valid) this.profileService.updateProfile(this.profileForm.value); }\n}`
            },
            {
                id: "capstone-4",
                title: "Final Integration & Deployment",
                objectives: ["Combine all mini-projects into a single app", "Use routing to navigate between projects", "Implement a shared layout with navigation", "Prepare the app for deployment"],
                takeaways: ["Integrating multiple features into one app = real-world Angular", "Shared layouts and services connect isolated features", "You've built a complete Angular application!"],
                content: `
                    <h3 class="text-2xl font-bold mb-4 text-gray-900">🎓 Graduation Project: The Complete App</h3>
                    <p class="mb-4 text-gray-700 leading-relaxed">For your final project, combine all the mini-apps (Weather Dashboard, Task Manager, Profile Settings) into a single application with navigation, shared layout, and global state.</p>
                    
                    <div class="bg-gradient-to-r from-teal-50 via-sky-50 to-purple-50 border border-teal-200 rounded-xl p-6 my-6">
                        <h4 class="font-bold text-gray-800 mb-3">What You've Built</h4>
                        <div class="grid grid-cols-2 gap-3 text-sm">
                            <div class="bg-white rounded-lg p-3 shadow-sm">
                                <span class="text-teal-600 font-bold">✓</span> Components & Templates
                            </div>
                            <div class="bg-white rounded-lg p-3 shadow-sm">
                                <span class="text-teal-600 font-bold">✓</span> Services & DI
                            </div>
                            <div class="bg-white rounded-lg p-3 shadow-sm">
                                <span class="text-teal-600 font-bold">✓</span> RxJS & Signals
                            </div>
                            <div class="bg-white rounded-lg p-3 shadow-sm">
                                <span class="text-teal-600 font-bold">✓</span> Routing & Forms
                            </div>
                            <div class="bg-white rounded-lg p-3 shadow-sm">
                                <span class="text-teal-600 font-bold">✓</span> State Management
                            </div>
                            <div class="bg-white rounded-lg p-3 shadow-sm">
                                <span class="text-teal-600 font-bold">✓</span> Capstone Projects
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-amber-50 border-l-4 border-amber-400 p-4 my-6 rounded-r-lg">
                        <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Next Steps:</strong> Deploy your app to Vercel, Firebase Hosting, or Netlify. Share it with the world! 🌍</p>
                    </div>
                `,
                defaultCode: `import { Component } from '@angular/core';\n\n@Component({\n  selector: 'app-graduation',\n  standalone: true,\n  template: \`\n    <div class="p-8 bg-gradient-to-br from-teal-50 via-sky-50 to-purple-50 rounded-2xl border border-teal-200 shadow-md max-w-lg mx-auto text-center">\n      <div class="w-20 h-20 mx-auto bg-teal-100 rounded-full flex items-center justify-center mb-4">\n        <i class="fa-solid fa-graduation-cap text-4xl text-teal-600"></i>\n      </div>\n      <h2 class="text-2xl font-bold text-gray-800">🎉 Congratulations!</h2>\n      <p class="text-gray-600 mt-2">You've completed the Angular Academy!</p>\n      <p class="text-sm text-gray-500 mt-4">You now have the skills to build enterprise-grade Angular applications with confidence.</p>\n      <div class="mt-6 flex justify-center gap-2">\n        <span class="px-3 py-1 bg-teal-100 text-teal-700 text-xs rounded-full font-semibold">Angular</span>\n        <span class="px-3 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-semibold">Signals</span>\n        <span class="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">RxJS</span>\n      </div>\n    </div>\n  \`\n})\nexport class GraduationComponent {}`
            }
        ],
        quiz: [
            {
                id: "q-capstone-1",
                question: "Which decorator is used to expose classes for Dependency Injection in Angular?",
                options: ["@Component", "@Injectable", "@Inject", "@Directive"],
                correct: 1
            },
            {
                id: "q-capstone-2",
                question: "What is the primary way to share data between sibling components?",
                options: ["@Input and @Output through the parent", "A shared service", "Local storage", "Global variables"],
                correct: 1
            },
            {
                id: "q-capstone-3",
                question: "Which Angular feature provides the most performant change detection?",
                options: ["Zone.js", "ngDoCheck", "Signals", "ChangeDetectorRef.detectChanges()"],
                correct: 2
            },
            {
                id: "q-capstone-4",
                question: "Which built-in control flow block should you use to iterate over a list in Angular 17+?",
                options: ["*ngFor", "@for", "ng-repeat", "for-of"],
                correct: 1
            },
            {
                id: "q-capstone-5",
                question: "What is the recommended way to handle unsaved form changes when navigating away?",
                options: ["CanActivate guard", "CanDeactivate guard", "ngOnDestroy", "Prevent default navigation"],
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
        if (currentPreviewBlobUrl) {
            URL.revokeObjectURL(currentPreviewBlobUrl);
            currentPreviewBlobUrl = null;
        }
        DOM.previewFrame.src = '';

        renderSidebar();
        renderActiveState();
        if(window.innerWidth < 1024) { // Close sidebar on mobile
            DOM.sidebar.classList.add('-translate-x-full');
            DOM.sidebarOverlay.classList.add('hidden');
        }
    }
}

// --- Lesson Navigation ---
function changeLesson(lessonId) {
    const mod = getActiveModule();
    const lesson = mod.lessons.find(l => l.id === lessonId);
    if (lesson) {
        state.activeLessonId = lessonId;
        renderActiveState();
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
        btn.className = `w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${isActive ? 'bg-teal-50 text-teal-800 font-semibold border-l-4 border-teal-500' : 'hover:bg-gray-100 text-gray-700 border-l-4 border-transparent'}`;
        btn.onclick = () => changeModule(mod.id);

        const textSpan = document.createElement('span');
        textSpan.className = 'truncate block';
        textSpan.innerText = mod.title;

        btn.appendChild(textSpan);

        if (isModuleComplete) {
            const checkIcon = document.createElement('i');
            checkIcon.className = 'fa-solid fa-check-circle text-teal-500';
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
    const mod = getActiveModule();
    const lessonIndex = mod.lessons.findIndex(l => l.id === lesson.id);
    const hasPrev = lessonIndex > 0;
    const hasNext = lessonIndex < mod.lessons.length - 1;

    /* ── ELI5: wrap content in data-technical / data-simple ── */
    const eli5 = window.eli5Toggle;
    const simpleContent = window.eli5AngularData && lesson.id ? (window.eli5AngularData[lesson.id] || '') : '';
    const bodyHtml = eli5 ? eli5.wrapContent(lesson.content, simpleContent) : lesson.content;

    /* Build objectives & takeaways HTML */
    const objectivesHtml = lesson.objectives ? `
        <div class="bg-sky-50 border border-sky-200 rounded-xl p-5 mb-6">
            <h4 class="font-bold text-sky-800 text-sm flex items-center gap-2 mb-3"><i class="fa-solid fa-bullseye text-sky-500"></i> Learning Objectives</h4>
            <ul class="space-y-2">
                ${lesson.objectives.map(obj => `<li class="flex items-start gap-2 text-sm text-sky-700"><i class="fa-solid fa-check-circle text-sky-400 mt-0.5"></i> <span>${obj}</span></li>`).join('')}
            </ul>
        </div>
    ` : '';

    const takeawaysHtml = lesson.takeaways ? `
        <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-6">
            <h4 class="font-bold text-emerald-800 text-sm flex items-center gap-2 mb-3"><i class="fa-solid fa-key text-emerald-500"></i> Key Takeaways</h4>
            <ul class="space-y-2">
                ${lesson.takeaways.map(t => `<li class="flex items-start gap-2 text-sm text-emerald-700"><i class="fa-solid fa-star text-emerald-400 mt-0.5"></i> <span>${t}</span></li>`).join('')}
            </ul>
        </div>
    ` : '';

    DOM.tabLesson.innerHTML = `
        <div class="max-w-3xl mx-auto animate-fade-in eli5-container eli5-lesson-container" data-mode="technical">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-3xl font-bold text-gray-900">${lesson.title}</h2>
                <span class="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Lesson ${lessonIndex + 1} of ${mod.lessons.length}</span>
            </div>

            ${objectivesHtml}

            <div class="prose max-w-none text-gray-800">
                ${bodyHtml}
            </div>

            ${takeawaysHtml}

            <div class="mt-12 pt-6 border-t border-gray-200 flex items-center justify-between">
                <div class="flex gap-2">
                    ${hasPrev ? `<button id="prev-lesson" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"><i class="fa-solid fa-arrow-left"></i> Previous</button>` : ''}
                    ${hasNext ? `<button id="next-lesson" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1">Next <i class="fa-solid fa-arrow-right"></i></button>` : ''}
                </div>
                <button id="mark-lesson-complete" class="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${isCompleted ? 'bg-gray-200 text-gray-700 cursor-default' : 'bg-teal-500 hover:bg-teal-600 text-white shadow-md'}" ${isCompleted ? 'disabled' : ''}>
                    ${isCompleted ? '<i class="fa-solid fa-check"></i> Completed' : 'Mark as Complete & Continue'}
                </button>
            </div>
        </div>
    `;

    /* ── Initialize ELI5 toggle inside the lesson container ── */
    const lessonContainer = DOM.tabLesson.querySelector('.eli5-lesson-container');
    if (eli5 && lessonContainer) {
        const oldToggle = lessonContainer.querySelector('.eli5-toggle');
        if (oldToggle) oldToggle.remove();
        eli5.initToggle('angular', lessonContainer);
    }

    /* Navigation + complete buttons */
    if (hasPrev) {
        document.getElementById('prev-lesson').addEventListener('click', () => {
            changeLesson(mod.lessons[lessonIndex - 1].id);
        });
    }
    if (hasNext) {
        document.getElementById('next-lesson').addEventListener('click', () => {
            changeLesson(mod.lessons[lessonIndex + 1].id);
        });
    }

    const btn = document.getElementById('mark-lesson-complete');
    if (!isCompleted) {
        btn.addEventListener('click', () => {
            markItemComplete(lesson.id);
            renderLesson(lesson); // Re-render complete status

            // Auto-navigate to next lesson if available
            if (hasNext) {
                changeLesson(mod.lessons[lessonIndex + 1].id);
            } else {
                switchTab('playground'); // Switch to editor
            }
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
                <p class="text-sm text-gray-500 mt-1">${mod.quiz.length} questions — answer all to pass</p>
                ${isCompleted ? '<span class="inline-block mt-3 bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-sm font-semibold"><i class="fa-solid fa-check mr-1"></i> Passed</span>' : ''}
            </div>
            <div id="quiz-questions-container" class="space-y-8">
    `;

    mod.quiz.forEach((q, index) => {
        html += `
            <div class="bg-white border rounded-xl p-6 shadow-sm">
                <h4 class="font-semibold text-lg text-gray-800 mb-4"><span class="text-teal-500 mr-2">${index + 1}.</span>${q.question}</h4>
                <div class="space-y-3">
        `;

        q.options.forEach((opt, optIdx) => {
            const isSelected = state.quizAnswers[q.id] === optIdx;

            html += `
                <label class="flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-teal-50 border-teal-300' : 'hover:bg-gray-50 border-gray-200'}">
                    <input type="radio" name="quiz-${q.id}" value="${optIdx}" class="form-radio text-teal-500 h-5 w-5" ${isSelected ? 'checked' : ''} onchange="handleQuizSelection('${q.id}', ${optIdx})">
                    <span class="ml-3 text-gray-700">${opt}</span>
                </label>
            `;
        });

        html += `</div></div>`;
    });

    html += `
            </div>
            <div class="mt-8 flex flex-col items-center border-t pt-8">
                <button id="submit-quiz-btn" class="px-8 py-3 rounded-lg font-bold text-lg text-white bg-teal-500 hover:bg-teal-600 shadow-md transition-all">Submit Answers</button>
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
            feedback.innerHTML = '<i class="fa-solid fa-check"></i> Perfect! You passed all questions.';
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

// Track blob URL for proper cleanup
let currentPreviewBlobUrl = null;

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
            <script src="https://cdn.jsdelivr.net/npm/rxjs@7/bundles/rxjs.umd.min.js"></script>
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
                        let cleanCode = code.replace(/\\r/g, '');

                        // Extract and register @Injectable services for DI
                        const serviceRegistry = {};
                        function extractBraced(code, startPos) {
                            let depth = 1, i = startPos, inStr = false, strChar = null;
                            while (i < code.length && depth > 0) {
                                const ch = code[i];
                                if (inStr) { if (ch === strChar && code[i-1] !== '\\\\') inStr = false; }
                                else {
                                    if (ch === '{') depth++;
                                    else if (ch === '}') depth--;
                                    else if (ch === "'" || ch === '"' || ch === '\`') { inStr = true; strChar = ch; }
                                }
                                i++;
                            }
                            return code.substring(startPos, i - 1);
                        }
                        const injClassRegex = /@Injectable\\s*\\([^)]*\\)\\s*\\n?\\s*export\\s+class\\s+(\\w+)/g;
                        let injMatch;
                        while ((injMatch = injClassRegex.exec(cleanCode)) !== null) {
                            const svcName = injMatch[1];
                            const openIdx = cleanCode.indexOf('{', injMatch.index);
                            const svcBody = extractBraced(cleanCode, openIdx + 1);
                            const svcInst = {};
                            const svcMethodRx = /(\\w+)\\s*\\([^)]*\\)\\s*{([\\s\\S]*?)}/g;
                            let svcM;
                            while ((svcM = svcMethodRx.exec(svcBody)) !== null) {
                                const mn = svcM[1];
                                const mb = svcM[2];
                                svcInst[mn] = function(...args) {
                                    try { const fn = new Function('svcInst', 'args', mb.replace(/this\\./g, 'svcInst.')); return fn(svcInst, args); } catch(e) { console.log(mn + ' called'); }
                                };
                            }
                            let key = svcName[0].toLowerCase() + svcName.slice(1);
                            serviceRegistry[key] = svcInst;
                            if (key.endsWith('service')) serviceRegistry[key.slice(0, -7)] = svcInst;
                            cleanCode = cleanCode.replace(injMatch[0] + '{' + svcBody + '}', '');
                            injClassRegex.lastIndex = 0;
                        }

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
                        const classBody = classMatch[2].replace(/@(Input|Output)\\s*\\([^)]*\\)\\s*/g, '');

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

                        // Parse computed values with parenthesis tracking
                        const computedRegex2 = /(\\w+)\\s*=\\s*computed\\(/g;
                        let compMatch2;
                        while ((compMatch2 = computedRegex2.exec(classBody)) !== null) {
                            const name = compMatch2[1];
                            const startPos = compMatch2.index + compMatch2[0].length;
                            let depth = 1, i = startPos, inStr = false, strChar = null;
                            while (i < classBody.length && depth > 0) {
                                const ch = classBody[i];
                                if (inStr) { if (ch === strChar && classBody[i-1] !== '\\\\') inStr = false; }
                                else {
                                    if (ch === '(') depth++;
                                    else if (ch === ')') depth--;
                                    else if (ch === "'" || ch === '"' || ch === '\`') { inStr = true; strChar = ch; }
                                }
                                i++;
                            }
                            const bodyExpr = classBody.substring(startPos, i - 1).trim().replace(/^\\(\\)\\s*=>\\s*/, '');
                            instance[name] = function() {
                                let processedExpr = bodyExpr;
                                Object.keys(signals).forEach(sigName => {
                                    processedExpr = processedExpr.replace(new RegExp('this\\.' + sigName + '\\\\s*\\\\(\\\\)', 'g'), \`instance.\${sigName}()\`);
                                });
                                try {
                                    return eval(processedExpr);
                                } catch(e) {
                                    return 'Error: ' + e.message;
                                }
                            };
                            instance[name].isSignal = true;
                        }

                        // Parse standard class fields/properties
                        const propMatches = [...classBody.matchAll(/(?<!let\\s|const\\s|var\\s)(\\w+)\\s*=\\s*(.*?);?(?=\\n|$)/g)];
                        propMatches.forEach(m => {
                            const name = m[1];
                            let valExpr = m[2].trim();
                            if (name === 'template' || name === 'selector' || name === 'standalone') return;
                            if (instance[name] !== undefined) return;

                            if (valExpr.startsWith('new EventEmitter')) {
                                instance[name] = { emit: function(val) { console.log('[EventEmitter]', val); }, subscribe: function() {} };
                                return;
                            }

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
                                    let argName = parts[0].split(' ').pop();
                                    argName = argName.replace(/^private\\s*|^public\\s*|^protected\\s*|^readonly\\s*/g, '').trim();
                                    // Check service registry first
                                    if (serviceRegistry[argName]) {
                                        instance[argName] = serviceRegistry[argName];
                                        return;
                                    }
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
                                        function extractFnArgs(s, fn) {
                                            let p = s.indexOf(fn);
                                            if (p === -1) return '';
                                            p = s.indexOf('(', p) + 1;
                                            let dp = 1, k = p, ins = false, sc = null;
                                            while (k < s.length && dp > 0) {
                                                const c = s[k];
                                                if (ins) { if (c === sc && s[k-1] !== '\\\\') ins = false; }
                                                else {
                                                    if (c === '(') dp++;
                                                    else if (c === ')') dp--;
                                                    else if (c === "'" || c === '"' || c === '\`') { ins = true; sc = c; }
                                                }
                                                k++;
                                            }
                                            return s.substring(p, k - 1);
                                        }
                                        if (statement.includes('.update(')) {
                                            const sigName = statement.split('.')[0];
                                            const action = extractFnArgs(statement, '.update(');
                                            if (instance[sigName] && instance[sigName].update) {
                                                if (action.includes('+ 2')) instance[sigName].update(c => c + 2);
                                                else if (action.includes('- 2')) instance[sigName].update(c => c - 2);
                                                else if (action.includes('+ 1')) instance[sigName].update(c => c + 1);
                                                else if (action.includes('- 1')) instance[sigName].update(c => c - 1);
                                                else if (action.includes('[...')) {
                                                    const itemMatch = action.match(/\\[\\.\\.\\.\\w+,\\s*([^\\]]*)\\]/);
                                                    const itemVal = itemMatch ? itemMatch[1].replace(/['"\`]/g, '') : 'Angular Book';
                                                    instance[sigName].update(items => [...items, itemVal]);
                                                }
                                            }
                                        } else if (statement.includes('.set(')) {
                                            const sigName = statement.split('.')[0];
                                            const valStr = extractFnArgs(statement, '.set(');
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
                                            const logMsg = extractFnArgs(statement, '.log(');
                                            if (instance.logger) instance.logger.log(eval(logMsg));
                                            else console.log(eval(logMsg));
                                        } else if (statement.startsWith('alert(')) {
                                            const msg = extractFnArgs(statement, 'alert(');
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
                                        const methodName = value.replace(/\\(\\)/g, '').trim();
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
                        // Test signal update mechanism
                        if (instance.count) {
                            console.log('Signal count initial:', instance.count());
                            instance.count.set(42);
                            console.log('Signal count after set(42):', instance.count());
                        }
                        console.log('Methods:', Object.keys(instance).filter(k => typeof instance[k] === 'function').join(', '));
                        if (typeof instance.ngOnInit === 'function') {
                            try { instance.ngOnInit(); } catch(e) { console.error('ngOnInit error:', e); }
                        }
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

    // Use blob URL instead of srcdoc to avoid CSP inline-script restrictions
    if (currentPreviewBlobUrl) {
        URL.revokeObjectURL(currentPreviewBlobUrl);
    }
    const blob = new Blob([iframeContent], { type: 'text/html' });
    currentPreviewBlobUrl = URL.createObjectURL(blob);
    DOM.previewFrame.src = currentPreviewBlobUrl;
}

// Start application
init();
