/**
 * ELI5 (Explain Like I'm 5) content for Angular Academy lessons.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

const eli5AngularData = {
  // ─── Module 1: Basics & Components ───
  'basics-1': `
    <p>Think of Angular like a <strong>toy building set</strong> (like LEGO bricks).</p>
    <p>Each <strong>Component</strong> is one brick. You snap bricks together to build a whole app — like building a castle or a spaceship.</p>
    <p>The <code>@Component</code> decorator is like the <strong>instruction sticker</strong> on the brick that says what color it is and where it goes. The <code>selector</code> tells Angular what HTML tag name to use for your brick (like <code>&lt;app-root&gt;</code>), and the <code>template</code> is what the brick looks like once it's placed.</p>
    <p><strong>Standalone components</strong> (the modern way) are like bricks that work by themselves — you don't need a big baseplate (NgModules) to attach them to. Just grab a brick and use it!</p>
  `,
  'basics-2': `
    <p>A component is like a <strong>living plant</strong>. It has a life cycle!</p>
    <ul>
      <li><strong>ngOnInit</strong> = when you first water the plant (it comes to life!). Great for loading data.</li>
      <li><strong>ngOnChanges</strong> = when you move the plant to a sunnier window (it reacts to changes).</li>
      <li><strong>ngOnDestroy</strong> = when the plant dies and you throw it away (clean up resources).</li>
    </ul>
    <p>Angular calls these <strong>lifecycle hooks</strong> automatically — like a smart plant pot that knows when to water your plant. You just decide what <strong>you</strong> want to do at each stage!</p>
  `,
  'basics-3': `
    <p>Building your first component is like <strong>baking a cake for the first time</strong>.</p>
    <p>You need three ingredients:</p>
    <ul>
      <li><strong>Class</strong> (the recipe) — TypeScript code that holds data and logic.</li>
      <li><strong>Template</strong> (the cake pan shape) — HTML that decides how the cake looks.</li>
      <li><strong>Styles</strong> (the frosting) — CSS that makes it pretty.</li>
    </ul>
    <p>The <code>@Component</code> decorator is like the <strong>recipe card</strong> that tells you: "Use this pan (template), these decorations (styles), and give it this name (selector)."</p>
    <p>Once baked, you can put your component anywhere in your app by writing its tag, like <code>&lt;app-user-card&gt;</code>!</p>
  `,
  'basics-4': `
    <p><strong>Component communication</strong> is like walkie-talkies.</p>
    <ul>
      <li><code>@Input()</code> is a <strong>receiver</strong> — a component listens for data coming in from its parent.</li>
      <li><code>@Output()</code> is a <strong>transmitter</strong> — a component sends a message (event) up to its parent.</li>
    </ul>
    <p>Imagine a parent component (Mom) and a child component (Kid). Mom uses <code>@Input()</code> to hand the kid a lunchbox. The kid uses <code>@Output()</code> to say "Thanks, Mom!" back.</p>
    <p>In code: <code>[childInput]="parentValue"</code> sends data down. <code>(childEvent)="parentHandler()"</code> sends events up. It's like passing notes in class, but way more organized!</p>
  `,
  'basics-5': `
    <p>A <strong>reusable component</strong> is like a <strong>stamp</strong>. You design it once, then stamp it everywhere.</p>
    <p>Think of a "User Card" component. It shows a person's picture, name, and email. Instead of writing the same HTML 100 times for 100 users, you make ONE component and pass different data each time.</p>
    <p>The component uses <code>@Input()</code> like a <strong>mail slot</strong> — you slide different info (name, photo, email) into the same slot, and the card layout stays the same.</p>
    <p>Good component design = a stamp that works on any paper, with any ink color, without smudging!</p>
  `,

  // ─── Module 2: Templates & Data Binding ───
  'bindings-1': `
    <p><strong>Data binding</strong> is like a <strong>puppet with strings</strong>.</p>
    <p>The puppeteer (your TypeScript code) pulls strings, and the puppet's body (the HTML template) moves!</p>
    <ul>
      <li><strong>Interpolation</strong> <code>{{ name }}</code> = a string that says the puppet's name out loud.</li>
      <li><strong>Property binding</strong> <code>[disabled]</code> = a string that makes the puppet's arm go up or down.</li>
      <li><strong>Event binding</strong> <code>(click)</code> = the puppet taps you on the shoulder and you react.</li>
      <li><strong>Two-way binding</strong> <code>[(ngModel)]</code> = you pull a string AND the puppet pulls back!</li>
    </ul>
    <p>The <code>@if</code> and <code>@for</code> blocks are like smart stage curtains that show or hide props automatically. No more clumsy *ngIf clunky syntax!</p>
  `,
  'bindings-2': `
    <p>Think of <strong>property binding</strong> as <strong>setting a microwave timer</strong>.</p>
    <p>When you write <code>[disabled]="isFormValid"</code>, it's like saying "Microwave, your 'cook' button should be disabled when the timer is NOT set." The microwave button watches the timer setting and grays itself out when there's no time entered.</p>
    <p><strong>Event binding</strong> is like a <strong>doorbell</strong>. You write <code>(click)="openDoor()"</code> — when someone presses the bell (click event), Angular calls your <code>openDoor()</code> function. The door opens!</p>
    <p>Together, property + event binding is how you make your HTML elements <strong>react</strong> to data and <strong>report</strong> user actions back to your code.</p>
  `,
  'bindings-3': `
    <p><strong>Two-way binding</strong> with <code>[(ngModel)]</code> is like a <strong>two-way walkie-talkie</strong>.</p>
    <p>You speak into it ("Hello!"), and the person on the other end hears you. They speak back ("Hi!"), and you hear them. Both sides talk AND listen.</p>
    <p>In Angular: <code>[(ngModel)]="username"</code> means:</p>
    <ul>
      <li>When you type in the input field → <code>username</code> updates (view → model).</li>
      <li>When <code>username</code> changes in code → the input field updates (model → view).</li>
    </ul>
    <p>It's called "banana-in-a-box" syntax <code>[()]</code> because the parentheses look like a banana inside the square box! 🍌📦</p>
  `,
  'bindings-4': `
    <p><strong>Pipes</strong> are like <strong>kitchen gadgets</strong> that transform your data before serving it.</p>
    <ul>
      <li><code>date</code> pipe = an egg timer that formats dates. <code>{{ today | date:'short' }}</code> turns a timestamp into "6/14/2026".</li>
      <li><code>uppercase</code> pipe = a letter stamp that makes text BIG.</li>
      <li><code>currency</code> pipe = a cash register that adds dollar signs.</li>
      <li><code>async</code> pipe = a <strong>self-opening mail</strong> — it subscribes to an Observable automatically and shows the value when it arrives!</li>
    </ul>
    <p>You chain pipes like kitchen appliances: <code>{{ value | pipe1 | pipe2 }}</code> = slice bread → toast it → butter it. Yum!</p>
  `,

  // ─── Module 3: Services & DI ───
  'services-1': `
    <p><strong>Dependency Injection</strong> sounds fancy, but it's just like <strong>ordering pizza delivery</strong>.</p>
    <p>Instead of growing your own wheat, making your own cheese, and baking your own pizza (manually creating everything), you just <strong>call for delivery</strong> (declare a constructor parameter) and the pizza arrives at your door!</p>
    <p>Angular's DI system is the <strong>delivery driver</strong>. You say "I need a LoggerService" in your constructor, and Angular says "Here you go!" and hands you a ready-to-use instance.</p>
    <p>The <code>@Injectable({ providedIn: 'root' })</code> decorator is like registering your restaurant with the delivery app — the driver knows where to pick up the pizza.</p>
  `,
  'services-2': `
    <p>Creating a <strong>service</strong> is like setting up a <strong>tool shed</strong> in your backyard.</p>
    <p>You put tools (functions and data) in the shed instead of cluttering your kitchen (component). Your kitchen stays clean, and anyone can visit the shed to borrow a tool.</p>
    <p>To create a service, you:</p>
    <ol>
      <li>Write a plain class with <code>@Injectable()</code> decorator.</li>
      <li>Add methods (tools) like <code>getUsers()</code> or <code>saveData()</code>.</li>
      <li>Provide it via <strong>root</strong> (one shed for everyone) or at <strong>component level</strong> (one shed per family).</li>
    </ol>
    <p>Services keep your code <strong>organized, testable, and reusable</strong> — like a well-organized toolbox!</p>
  `,
  'services-3': `
    <p><strong>Hierarchical injectors</strong> are like <strong>nested lunch boxes</strong>.</p>
    <p>Imagine a big lunch box (root injector) with a smaller lunch box inside (component injector), and an even smaller one inside that (child component injector).</p>
    <p>When Angular needs a service, it checks: "Is there a cookie in the littlest box?" → If not, checks the medium box → If not, checks the big box → If not found anywhere, it throws an error (like having no lunch at all!).</p>
    <p>This means you can provide the SAME service at different levels and get DIFFERENT instances. Like each kid getting their own cookie instead of sharing one!</p>
  `,
  'services-4': `
    <p>Using services for <strong>data sharing</strong> is like having a <strong>family whiteboard</strong> in the kitchen.</p>
    <p>Instead of family members shouting across rooms to share information, everyone writes on the whiteboard and reads from it.</p>
    <p>In Angular: Create a service with a Signal or BehaviorSubject. Component A writes data. Component B reads it. Both use the same service instance.</p>
    <ul>
      <li><strong>Write:</strong> <code>dataService.updateMessage('Dinner at 7pm')</code></li>
      <li><strong>Read:</strong> <code>const msg = dataService.message()</code></li>
    </ul>
    <p>No more passing data through a long chain of parent-to-child-to-grandchild. The whiteboard (service) is always there for anyone to use!</p>
  `,

  // ─── Module 4: RxJS ───
  'rxjs-1': `
    <p>An <strong>Observable</strong> is like a <strong>water hose</strong>. Water (data) flows through it continuously.</p>
    <p>You can:</p>
    <ul>
      <li><strong>Subscribe</strong> = turn on the hose and collect water.</li>
      <li><strong>Unsubscribe</strong> = turn off the hose.</li>
      <li><strong>Pipe</strong> = attach a nozzle that changes the flow (filter, transform).</li>
    </ul>
    <p>Unlike a Promise (a single water balloon that splashes once and is gone), an Observable is a <strong>stream</strong> that can keep flowing — one drop at a time, for hours!</p>
    <p>Angular uses Observables everywhere: HTTP requests, form value changes, route events. It's like the plumbing of your Angular app!</p>
  `,
  'rxjs-2': `
    <p><strong>RxJS operators</strong> are like <strong>factory machines</strong> on an assembly line.</p>
    <ul>
      <li><code>map</code> = a <strong>label maker</strong>. Takes each item coming through and changes its label. Input: 1, 2, 3 → Output: "Item 1", "Item 2", "Item 3".</li>
      <li><code>filter</code> = a <strong>quality checker</strong>. Only lets certain items pass. Input: 1, 2, 3, 4, 5 → Output (filter > 2): 3, 4, 5.</li>
      <li><code>tap</code> = a <strong>window</strong> on the assembly line. Lets you peek at items without changing them. Great for logging!</li>
    </ul>
    <p>You chain operators inside <code>pipe()</code> like conveyor belts. Data goes in one end and comes out the other end, transformed!</p>
  `,
  'rxjs-3': `
    <p><strong>Higher-order mapping</strong> sounds scary, but think of it as <strong>switching TV channels</strong>.</p>
    <ul>
      <li><code>switchMap</code> = You're watching Channel 5. You change to Channel 7. Channel 5 stops playing (gets cancelled). Only one channel plays at a time. Perfect for search boxes!</li>
      <li><code>mergeMap</code> = You have 3 TVs all playing different channels at the same time. No channel gets cancelled. Good for parallel API calls.</li>
      <li><code>concatMap</code> = You can only watch one show at a time. You finish Episode 1, then start Episode 2. No overlapping.</li>
    </ul>
    <p>These operators help you manage <strong>one Observable triggering another Observable</strong> — like clicking a button (first stream) that kicks off an API call (second stream).</p>
  `,
  'rxjs-4': `
    <p><strong>Error handling</strong> in RxJS is like having a <strong>safety net</strong> under a tightrope walker.</p>
    <p>Observables can emit three things:</p>
    <ul>
      <li><strong>next</strong> — the tightrope walker takes a step (normal data).</li>
      <li><strong>error</strong> — the walker falls! The show stops and you catch them with the net.</li>
      <li><strong>complete</strong> — the walker reaches the other side. The show ends gracefully.</li>
    </ul>
    <p>Use <code>catchError</code> to catch the falling walker and provide a safe landing. Use <code>retry</code> to say "Try the tightrope walk one more time!"</p>
    <p>The <code>finalize</code> operator is like cleaning up the circus tent after the show — it runs whether the show succeeded OR failed!</p>
  `,

  // ─── Module 5: Routing ───
  'routing-1': `
    <p>Angular <strong>routing</strong> is like a <strong>TV remote control</strong>.</p>
    <p>Each button on the remote changes the channel (component) on the TV <code>&lt;router-outlet&gt;</code>. Press "Dashboard" → you see the Dashboard channel. Press "Profile" → you see the Profile channel.</p>
    <p>The <code>&lt;router-outlet&gt;</code> is the TV screen — it's where different channels show their content. You never change the physical TV (the page doesn't reload), just the content displayed on it!</p>
    <p>The <code>routerLink</code> directive is the remote control button. Unlike a regular <code>&lt;a href&gt;</code> link (which reloads the whole page like turning the TV off and on), <code>routerLink</code> smoothly switches channels without reloading.</p>
  `,
  'routing-2': `
    <p><strong>Route parameters</strong> are like <strong>library book IDs</strong>.</p>
    <p>You go to the library and ask: "I want book #42." The librarian (router) looks up book 42 and brings it to you.</p>
    <p>In URLs: <code>/books/42</code> — the <code>42</code> is the route parameter. The route definition is <code>/books/:id</code>.</p>
    <p>Reading the param: <code>this.route.snapshot.paramMap.get('id')</code> — like asking the librarian "What book number did they ask for?"</p>
    <p>The <code>Router</code> service lets you <strong>navigate</strong> programmatically: <code>this.router.navigate(['/books', 42])</code> is like telling the librarian "Please take me to aisle 42."</p>
  `,
  'routing-3': `
    <p><strong>Route guards</strong> are like <strong>bouncers at a club</strong>.</p>
    <ul>
      <li><code>CanActivate</code> = the bouncer checks your ID at the door. "Are you logged in? Cool, come in!"</li>
      <li><code>CanDeactivate</code> = the bouncer stops you from leaving if you forgot your coat. "You have unsaved changes — are you sure you want to leave?"</li>
      <li><code>CanLoad</code> = the bouncer decides whether to unlock a secret room (lazy-loaded module) at all.</li>
    </ul>
    <p><strong>Lazy loading</strong> is like renting a movie — you only download it (load the code) when you decide to watch it! The app starts faster because it doesn't load ALL movie files at once.</p>
  `,
  'routing-4': `
    <p><strong>Nested routes</strong> are like <strong>Russian nesting dolls</strong> (matryoshka).</p>
    <p>Each doll has a smaller doll inside. Each route has a child route inside.</p>
    <p>Example: <code>/dashboard/settings/profile</code></p>
    <ul>
      <li><code>/dashboard</code> — Big doll (shell layout with sidebar)</li>
      <li><code>/dashboard/settings</code> — Medium doll (settings page with tabs)</li>
      <li><code>/dashboard/settings/profile</code> — Small doll (profile form)</li>
    </ul>
    <p>Each level has its own <code>&lt;router-outlet&gt;</code> so you can nest layouts. The navigation bar stays visible while the inner content changes. Like keeping the big doll's painted face visible while swapping the smaller dolls inside!</p>
  `,

  // ─── Module 6: Forms ───
  'forms-1': `
    <p>Angular has two ways to handle forms, like <strong>two ways to order food</strong>:</p>
    <ul>
      <li><strong>Template-Driven Forms:</strong> Like ordering at a buffet. You point at what you want (bind directly in HTML). Simple and quick!</li>
      <li><strong>Reactive Forms:</strong> Like a pre-printed order form. You create the form structure in TypeScript code. More powerful for complex orders!</li>
    </ul>
    <p>Reactive forms use <code>FormGroup</code> (the whole order form) and <code>FormControl</code> (each field on the form). You define validations like "name is required" or "email must have @" in code, and Angular automatically shows error messages.</p>
  `,
  'forms-2': `
    <p><strong>Form controls</strong> are like <strong>individual input fields on a job application</strong>.</p>
    <p>Each field has rules:</p>
    <ul>
      <li><strong>Validators:</strong> "Name" must be filled in. "Email" must contain @. "Age" must be a number.</li>
      <li><code>Validators.required</code> = you can't leave this blank!</li>
      <li><code>Validators.minLength(3)</code> = this field needs at least 3 characters.</li>
      <li><code>Validators.pattern(/[a-z]/)</code> = this field must match a pattern (like a password rule).</li>
    </ul>
    <p>Check if a field is valid: <code>myForm.get('email').invalid</code> — like asking "Is the email field filled in correctly?"</p>
    <p>Angular gives each control a <strong>status</strong>: valid, invalid, pending, or disabled. It's like traffic lights for your form fields!</p>
  `,
  'forms-3': `
    <p><strong>Template-driven forms</strong> are like <strong>sticky notes on a document</strong>.</p>
    <p>You write directly in the HTML template with <code>#myVar="ngModel"</code> — like sticking a post-it that says "Watch this field!".</p>
    <p>You don't need to write <code>FormGroup</code> or <code>FormControl</code> in your code. Angular creates them automatically behind the scenes.</p>
    <p>Pros: Less code, great for simple forms (login, contact). Cons: Harder to test for complex forms.</p>
    <p>Think of it like a <strong>pop-up toaster</strong> — you drop the bread in (write HTML), push the lever (add <code>ngModel</code>), and toast pops out automatically (Angular manages the form state).</p>
  `,
  'forms-4': `
    <p><strong>FormArray</strong> is like a <strong>shopping list that grows and shrinks</strong>.</p>
    <p>Start with 3 items on your list: Milk, Eggs, Bread. Need to add Cheese? Just click "Add Item" and a new row appears. Finished with Milk? Click "Remove" next to it.</p>
    <p>In Angular, a <code>FormArray</code> holds a dynamic list of form controls or groups:</p>
    <ul>
      <li><code>push()</code> = add a new item to the list.</li>
      <li><code>removeAt()</code> = remove an item.</li>
      <li><code>length</code> = how many items are in the list right now.</li>
    </ul>
    <p>Perfect for: guest lists, to-do items, phone numbers, ingredients — any form where the user needs to add or remove entries!</p>
  `,

  // ─── Module 7: Signals ───
  'signals-1': `
    <p>A <strong>Signal</strong> is like a <strong>smart noticeboard</strong> in a school hallway.</p>
    <p>You write a value on the noticeboard: "Today's lunch: Pizza 🍕". Anyone who looks at the board (reads the signal) sees "Pizza".</p>
    <p>When the principal changes it to "Pasta 🍝", the board <strong>automatically notifies</strong> everyone who's looking — without them having to keep checking the board!</p>
    <p><code>signal(0)</code> = put "0" on a new noticeboard.</p>
    <p><code>signal()</code> = look at the board and read the current value.</p>
    <p><code>signal.set(5)</code> = erase the board and write "5".</p>
    <p><code>signal.update(n => n + 1)</code> = read the current number, add 1, and write the new number.</p>
    <p>No more Zone.js overhead! Angular only updates the parts of the screen that actually changed!</p>
  `,
  'signals-2': `
    <p><strong>Computed</strong> signals are like a <strong>paint mixer</strong> at a hardware store.</p>
    <p>You put in blue paint (signal A) + yellow paint (signal B). The mixer automatically produces green paint (computed signal). When you change blue to red, the mixer instantly adjusts to make orange!</p>
    <p><code>computed(() => count() * 2)</code> = "Whatever count is, I want double that!"</p>
    <p><strong>Effects</strong> are like a <strong>doorbell</strong> that rings when someone rings the bell. They <strong>react</strong> to signal changes:</p>
    <p><code>effect(() => console.log('Count is now:', count()))</code> = "Every time count changes, log it!"</p>
    <p>Effects are for <strong>side effects</strong> (logging, saving to localStorage, syncing with a server) — not for computing values!</p>
  `,
  'signals-3': `
    <p><strong>Signal-based inputs</strong> are like <strong>mail slots with notifications</strong>.</p>
    <p>Old way (<code>@Input()</code>): Someone puts mail in your slot. You don't know it's there until you check.</p>
    <p>New way (<code>input()</code>): Someone puts mail in your slot. A chime rings! You instantly know new mail arrived!</p>
    <p><code>myInput = input('default value')</code> creates a signal that updates when the parent passes new data.</p>
    <p><strong>Signal queries</strong> (<code>viewChild()</code>, <code>contentChild()</code>) are like having a <strong>radar</strong> that tells you when a specific element appears in your template. No more <code>@ViewChild</code> with <code>ngAfterViewInit</code> timing issues!</p>
  `,
  'signals-4': `
    <p><strong>Signals vs RxJS</strong> — think of them as <strong>walkie-talkie vs. radio station</strong>.</p>
    <p><strong>Signals (walkie-talkie):</strong> Push-to-talk. One person speaks at a time. Great for simple state (counter, username, toggle). Synchronous — you always know the current value immediately.</p>
    <p><strong>RxJS (radio station):</strong> Continuous broadcast. Many listeners. Great for streams (mouse movements, WebSocket data, type-ahead search). Handles async, cancellations, retries.</p>
    <p>You can use BOTH together! The <code>toObservable()</code> function turns a signal into an Observable. The <code>toSignal()</code> function turns an Observable into a signal.</p>
    <p>Think of it as: <strong>Signals for state</strong> + <strong>RxJS for events/streams</strong> = Angular superpowers!</p>
  `,

  // ─── Module 8: State Management ───
  'state-1': `
    <p><strong>Signal-based state management</strong> is like having a <strong>refrigerator with a smart display</strong>.</p>
    <p>The fridge knows what's inside (state), and the smart display on the door shows you the contents. When you take out milk, the display updates instantly!</p>
    <p>A <code>CartService</code> with signals is like that smart fridge:</p>
    <ul>
      <li><code>cartItems</code> = the contents of the fridge (a signal of items).</li>
      <li><code>addToCart()</code> = putting something new in the fridge.</li>
      <li><code>clearCart()</code> = emptying the fridge completely.</li>
      <li><code>totalCount()</code> = the smart display showing "You have 3 items."</li>
    </ul>
    <p>No external library needed — just a class + signals + dependency injection!</p>
  `,
  'state-2': `
    <p>The <strong>service-based state pattern</strong> is like having a <strong>neighborhood mailbox</strong>.</p>
    <p>Everyone in the neighborhood (different components) can:</p>
    <ul>
      <li><strong>Check</strong> if mail has arrived (read state).</li>
      <li><strong>Add</strong> a letter to the box (update state).</li>
      <li>Get notified when new mail arrives (react to changes).</li>
    </ul>
    <p>The pattern: A service holds signals. Components inject the service and read/write signals. The service exposes <code>computed</code> values for derived data.</p>
    <p>Key rule: <strong>Components read state, services own state.</strong> Like how you read mail but don't own the mailbox — the post office (service) does.</p>
  `,
  'state-3': `
    <p>A <strong>Signal Store pattern</strong> is like organizing your closet with <strong>labeled bins</strong>.</p>
    <p>Instead of throwing all your clothes in one pile, you have bins:</p>
    <ul>
      <li>"Socks bin" (user state)</li>
      <li>"Shirts bin" (UI state)</li>
      <li>"Pants bin" (API data)</li>
    </ul>
    <p>A store is a service that groups related signals together:</p>
    <p><code>UserStore</code> holds: <code>currentUser</code>, <code>isLoggedIn</code>, <code>permissions</code>.</p>
    <p>Each store has clear responsibilities. Components pick the store they need, like picking the right bin for the clothes they want.</p>
    <p>With the new <code>signalStore()</code> from Angular's community packages, setting up a store feels as easy as labeling a bin!</p>
  `,
  'state-4': `
    <p><strong>Global state & caching</strong> is like a <strong>library card catalog</strong>.</p>
    <p>When you want a book (data), you first check the card catalog (cache). If the book is there, great — read it instantly! If not, you go to the shelf (API) to get it, and then add a card to the catalog so it's faster next time.</p>
    <p>Strategy:</p>
    <ol>
      <li><strong>Check cache</strong> — is the data already loaded in a signal?</li>
      <li><strong>Serve from cache</strong> — instant, no network request needed.</li>
      <li><strong>Fetch if missing</strong> — call the API and store the result in a signal.</li>
      <li><strong>Invalidate</strong> — clear the cache when data gets stale.</li>
    </ol>
    <p>This makes your app feel lightning fast — like a library where the most popular books are already on the reading table when you walk in!</p>
  `,

  // ─── Module 9: Capstone ───
  'capstone-1': `
    <p>Your <strong>Weather Dashboard</strong> is like a <strong>digital weather station toy</strong>.</p>
    <p>You built a screen that shows a city name, temperature, and weather conditions — like a real weather app but way simpler!</p>
    <p>It uses:</p>
    <ul>
      <li><strong>Two-way binding</strong> — type a city name and it appears on screen.</li>
      <li><strong>Signals</strong> — the temperature is a signal you can increase (heat) or decrease (rain).</li>
      <li><strong>Control flow</strong> — <code>@if</code> shows/hides elements based on conditions.</li>
    </ul>
    <p>You've used almost every Angular concept in one mini-app. That's like building a model car that actually rolls — all the parts work together!</p>
  `,
  'capstone-2': `
    <p>A <strong>Task Management App</strong> is like a <strong>to-do list on your fridge</strong>.</p>
    <p>You write tasks on a piece of paper, stick it to the fridge, and cross them off when done. But this app is a digital, smarter version!</p>
    <p>Features you'll build:</p>
    <ul>
      <li><strong>Add tasks</strong> — write a new to-do item.</li>
      <li><strong>Mark as done</strong> — click a checkbox.</li>
      <li><strong>Filter</strong> — show "All", "Active", or "Completed" tasks.</li>
      <li><strong>Delete</strong> — remove tasks you don't need.</li>
    </ul>
    <p>This project combines Forms (add tasks), Services (manage tasks list), Signals (reactive updates), and Templates (display filtered list). It's the complete Angular package!</p>
  `,
  'capstone-3': `
    <p>A <strong>Profile Settings Panel</strong> is like the <strong>settings screen on your phone</strong>.</p>
    <p>Think of when you change your phone's wallpaper — you go to Settings → Display → Wallpaper → Choose image. Each step is a different view, but you stay in the same "Settings" section.</p>
    <p>Features you'll build:</p>
    <ul>
      <li><strong>Edit Profile</strong> — change name, email, bio (reactive form!).</li>
      <li><strong>Change Password</strong> — old password, new password, confirm.</li>
      <li><strong>Preferences</strong> — toggle notifications, choose theme.</li>
    </ul>
    <p>This project uses <strong>nested routing</strong> (settings/profile, settings/security, settings/preferences) and <strong>reactive forms</strong> with validation. Like navigating through your phone settings!</p>
  `,
  'capstone-4': `
    <p><strong>Final Integration</strong> is like <strong>putting on a school science fair</strong>.</p>
    <p>You've built several cool projects separately — a weather dashboard, a task manager, a profile settings panel. Now it's time to combine them into ONE app with navigation!</p>
    <p>You'll use:</p>
    <ul>
      <li><strong>Routing</strong> — a sidebar menu to switch between projects.</li>
      <li><strong>Shared layout</strong> — same header, sidebar, and footer for all pages.</li>
      <li><strong>Global state</strong> — a service that remembers your preferences across pages.</li>
    </ul>
    <p>This final project turns you from someone who builds <strong>individual LEGO models</strong> (standalone apps) into someone who builds a <strong>whole LEGO city</strong> (a full Angular application). You've graduated from the Angular Academy! 🎓</p>
  `,
};

/* Expose globally for script-tag usage */
window.eli5AngularData = eli5AngularData;
