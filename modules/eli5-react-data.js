/**
 * ELI5 (Explain Like I'm 5) content for React Mastery lessons.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

const eli5ReactData = {
  // ─── Module 1: JSX & Components ───
  'jsx-1': `
    <p>JSX is like <strong>writing HTML inside JavaScript</strong>. It's like being able to draw a picture (HTML) inside a math book (JavaScript).</p>
    <p>Normally, JavaScript and HTML live in separate files. But React says: "Why not put them together?" With JSX, you write <strong>what the UI should look like</strong> right next to the logic that controls it.</p>
    <p>When you write <code>&lt;h1&gt;Hello&lt;/h1&gt;</code> in JSX, your computer actually turns it into <code>React.createElement('h1', null, 'Hello')</code> behind the scenes. The curly braces <code>{ }</code> are like <strong>secret passages</strong> that let you escape from HTML-land back into JavaScript-land to put variables or run code!</p>
  `,
  'jsx-2': `
    <p>A <strong>Component</strong> is like a <strong>rubber stamp</strong>. You design it once, then stamp it everywhere.</p>
    <p>Think of a profile card on a website — it shows a photo, name, and bio. Instead of writing the HTML 100 times for 100 users, you create ONE component and use it over and over with different data.</p>
    <p>Components are just JavaScript functions that return JSX. They're like <strong>tiny factories</strong> that take in inputs (props) and spit out UI (JSX).</p>
    <p>The magic? If you change the design of your component, EVERY place that uses it updates automatically. It's like changing the rubber stamp once and having all stamped copies change instantly!</p>
  `,
  'jsx-3': `
    <p><strong>Props</strong> (short for "properties") are like <strong>lunchbox notes</strong> that parents pass to their kids.</p>
    <p>A parent component writes a note: "Here's your lunch, have a great day!" The child component reads the note and knows what to do.</p>
    <p>In React, you pass props like HTML attributes: <code>&lt;Greeting name="Alice" /&gt;</code>. The Greeting component receives <code>props.name</code> and says "Hello, Alice!"</p>
    <p>Props are <strong>read-only</strong> — a child can read its lunchbox note, but it can't change what the parent wrote. If the parent wants to change the message, it writes a new note and the child gets it automatically!</p>
  `,
  'jsx-4': `
    <p><strong>Children &amp; Composition</strong> is like <strong>nesting dolls</strong> — you put one doll inside another, inside another.</p>
    <p>The special <code>children</code> prop is like a <strong>magic slot</strong> in a component. Whatever you put between the opening and closing tags of a component gets placed into that slot!</p>
    <p>Example: <code>&lt;Card&gt;&lt;p&gt;Hello!&lt;/p&gt;&lt;/Card&gt;</code> — the card component wraps whatever you put inside it with its own styling.</p>
    <p>This lets you build <strong>layout components</strong> (like a card, a modal, or a sidebar) that wrap around content. You build the frame once, and fill it with different content each time!</p>
  `,
  'jsx-5': `
    <p><strong>Conditional rendering</strong> is like a <strong>choose-your-own-adventure book</strong>.</p>
    <p>Depending on what you decide, the story goes different ways. "If you go left, turn to page 42. If you go right, turn to page 67."</p>
    <p>In React, you use regular JavaScript <code>if</code>, <code>&amp;&amp;</code>, or <code>? :</code> (ternary) inside JSX to show or hide things:</p>
    <ul>
      <li><code>{isLoggedIn && &lt;Dashboard /&gt;}</code> — show Dashboard only if logged in</li>
      <li><code>{isLoading ? &lt;Spinner /&gt; : &lt;Content /&gt;}</code> — show spinner while loading, then show content</li>
    </ul>
    <p>It's just JavaScript with an <strong>if-else</strong> decision! Nothing special — which is what makes it so powerful.</p>
  `,

  // ─── Module 2: Props & State ───
  'ps-1': `
    <p><strong>State</strong> is a component's <strong>memory</strong>. It's like a sticky note the component keeps for itself.</p>
    <p>Props are like instructions from a parent (read-only). But <strong>state</strong> is like a personal notebook — the component writes in it, reads from it, and changes it whenever it wants.</p>
    <p>React's <code>useState</code> gives you two things: the current value (like reading your notebook) and a setter function (like a pencil to change what's written).</p>
    <p>When state changes, React <strong>re-renders</strong> the component — like taking a fresh photo whenever something changes. The old photo is thrown away, and the new one shows the updated info!</p>
  `,
  'ps-2': `
    <p>useState is like a <strong>scoreboard at a basketball game</strong>.</p>
    <p>The scoreboard shows a number. When a team scores, you press a button to update it. The scoreboard instantly shows the new number!</p>
    <p><code>const [score, setScore] = useState(0)</code> — sets up the scoreboard starting at 0.</p>
    <p><code>setScore(score + 1)</code> — press the "+1" button. The scoreboard updates.</p>
    <p>Each component gets its OWN scoreboard. If you have two counter components on the page, they each have their own independent score, like two different basketball games happening at the same time!</p>
    <p><strong>Important:</strong> State updates are like taking a photo — you don't see the new value until the next "photo" (re-render). That's why <code>console.log(score)</code> right after <code>setScore</code> still shows the old number!</p>
  `,
  'ps-3': `
    <p><strong>Lifting state up</strong> is like <strong>asking mom to settle an argument</strong>.</p>
    <p>Two siblings argue about what TV show to watch. They can't agree. So they go to Mom, who decides for both.</p>
    <p>In React, when two sibling components need to share the same state, you "lift" that state up to their closest common parent. The <strong>parent</strong> holds the state and passes it down to both children via props.</p>
    <p>The parent also passes <strong>callback functions</strong> so children can request changes. It's like Mom saying: "If you want to change the channel, tell me and I'll decide."</p>
    <p>State lives higher. Data flows down. Changes bubble up. That's the React way!</p>
  `,
  'ps-4': `
    <p><strong>Props vs State</strong> — think of a <strong>library book</strong>.</p>
    <p><strong>Props</strong> are like the book you borrow from the library. You can read it, but you can't change what's written in it. You must return it the same way you got it.</p>
    <p><strong>State</strong> is like your personal notebook. You write in it, erase things, add pages, fold corners — it's YOURS to change!</p>
    <p>Key differences:</p>
    <ul>
      <li>Props come from outside (like a book from the library). State is internal (like your notebook).</li>
      <li>Props are read-only. State can be changed.</li>
      <li>Props are passed down. State lives in the component.</li>
    </ul>
    <p>If a component needs data that comes from somewhere else → use props. If a component has its own changing data → use state!</p>
  `,
  'ps-5': `
    <p><strong>Derived state</strong> is like <strong>calculating the tip at a restaurant</strong>.</p>
    <p>You know the bill amount ($50). You know the tip percentage (15%). But you don't need to store the tip amount separately — you CALCULATE it: $50 × 15% = $7.50.</p>
    <p>In React, if you need a value that can be CALCULATED from existing state or props, DON'T store it in a separate state. Just compute it during render:</p>
    <p><code>const totalPrice = items.reduce((sum, item) => sum + item.price, 0)</code></p>
    <p>This keeps your state minimal and avoids bugs where the derived value gets out of sync with its source. One source of truth, everything else is computed!</p>
  `,

  // ─── Module 3: Hooks Deep Dive ───
  'hooks-1': `
    <p><strong>useEffect</strong> is like setting a <strong>timer on your phone</strong> to do laundry.</p>
    <p>You're cooking dinner. You remember the laundry is in the washer. You set a timer: "In 30 minutes, remind me to move clothes to the dryer!"</p>
    <p>The timer runs in the background while you keep cooking. When it goes off, you switch tasks, do the laundry transfer, then go back to cooking.</p>
    <p><code>useEffect</code> runs code <strong>after</strong> the component renders. It's for things that shouldn't block the UI — like fetching data, setting up subscriptions, or updating the page title.</p>
    <p>The <strong>dependency array</strong> <code>[]</code> is like saying "only set this timer once, when I first start cooking." Without it, you'd set a new timer every time you stir the pot!</p>
  `,
  'hooks-2': `
    <p><strong>useRef</strong> is like a <strong>secret hiding spot</strong> that nobody else can see.</p>
    <p>Imagine you have a treasure chest in your room. You can put things in it and take them out. But unlike state, when you change what's in the chest, you DON'T redecorate your whole room — no one even knows you changed it!</p>
    <p><code>useRef</code> gives you a <strong>mutable box</strong> (with a <code>.current</code> property) that survives re-renders but doesn't cause them.</p>
    <p>Perfect for: counting how many times a component rendered (without causing infinite loops!), storing interval IDs, or directly accessing a DOM element like an input field to focus it.</p>
  `,
  'hooks-3': `
    <p><strong>useCallback and useMemo</strong> are like <strong>reusable shopping bags</strong> — you pack them once and reuse them instead of making new bags every trip.</p>
    <p><strong>useMemo</strong> remembers a COMPUTED VALUE. Like calculating the total of your groceries once and writing it down, instead of adding up prices every time you look at the receipt.</p>
    <p><strong>useCallback</strong> remembers a FUNCTION. Like having a favorite recipe card — instead of rewriting the recipe every time you cook, you just grab the card from the drawer.</p>
    <p>Both use dependency arrays: <code>useMemo(() => expensiveCalc(a, b), [a, b])</code> — "Only recalculate if a or b changes."</p>
    <p>Don't use them everywhere! Only use them for <strong>performance optimization</strong> when you notice lag. Premature optimization is like bringing 50 shopping bags for just one apple!</p>
  `,
  'hooks-4': `
    <p><strong>Custom Hooks</strong> are like <strong>your own kitchen gadgets</strong> — you invent them for tasks you do all the time.</p>
    <p>Sure, you can chop vegetables with a knife. But if you chop vegetables every day, you might invent a <strong>mandoline slicer</strong> that chops faster and safer.</p>
    <p>A custom hook is just a JavaScript function that starts with <code>use</code> and uses other hooks inside it. It bundles reusable logic!</p>
    <p>Examples:</p>
    <ul>
      <li><code>useWindowSize()</code> — gives you the browser window size and updates it when the window resizes.</li>
      <li><code>useLocalStorage(key, default)</code> — syncs state with localStorage.</li>
      <li><code>useFetch(url)</code> — fetches data and gives you { data, loading, error }.</li>
    </ul>
    <p>Custom hooks let you <strong>invent your own tools</strong> and share them across components. Just like kitchen gadgets, once you invent a good one, you'll use it everywhere!</p>
  `,
  'hooks-5': `
    <p><strong>Rules of Hooks</strong> are like <strong>traffic rules</strong> — they keep everyone safe and prevent crashes!</p>
    <p>Two simple rules:</p>
    <ol>
      <li><strong>Only call hooks at the top level.</strong> Don't put them inside loops, if statements, or nested functions. It's like traffic lights — they must be at specific positions to work correctly.</li>
      <li><strong>Only call hooks from React functions</strong> — either a React component or a custom hook. Not from regular JavaScript functions.</li>
    </ol>
    <p>Why? React relies on the <strong>order</strong> in which hooks are called. If you put a hook inside an <code>if</code> statement, the order might change between renders, and React gets confused — like expecting the third traffic light to be at a certain intersection but finding the second one there instead!</p>
  `,

  // ─── Module 4: Events & Forms ───
  'events-1': `
    <p><strong>Event handling</strong> in React is like <strong>doorbells</strong> — you connect a button to an action.</p>
    <p>You install a doorbell (add an <code>onClick</code>). Someone presses it (the event fires). The bell rings (your function runs).</p>
    <p>React events are named like <code>onClick</code>, <code>onChange</code>, <code>onSubmit</code> — notice the <strong>camelCase</strong>! (Regular HTML uses lowercase <code>onclick</code>.)</p>
    <p>You pass a <strong>function</strong>, not a string: <code>&lt;button onClick={handleClick}&gt;</code> — not <code>onClick="handleClick()"</code> like in HTML.</p>
    <p>The event object (often called <code>e</code>) gives you info: what was clicked, mouse coordinates, which key was pressed. Like a doorbell camera showing you who's at the door!</p>
  `,
  'events-2': `
    <p><strong>Controlled components</strong> are like a <strong>two-way walkie-talkie</strong> between your code and the input field.</p>
    <p>In React, form inputs shouldn't manage their own value. Instead, React controls the value via state. You type → React updates state → React puts the new value back in the input. Round trip!</p>
    <p>Step by step:</p>
    <ol>
      <li><code>const [name, setName] = useState('')</code> — create state for the input.</li>
      <li><code>&lt;input value={name} onChange={(e) => setName(e.target.value)} /&gt;</code> — bind state to input.</li>
      <li>When user types → <code>onChange</code> fires → <code>setName</code> updates state → input shows new value.</li>
    </ol>
    <p>React is always "in control" — hence "controlled component." The input can't change without React knowing about it!</p>
  `,
  'events-3': `
    <p><strong>Form validation</strong> is like a <strong>video game tutorial</strong> that tells you when you're doing something wrong.</p>
    <p>In a game, if you press the wrong button, a message might pop up: "Press SPACE to jump!" It gently guides you.</p>
    <p>In React forms, validation works the same way:</p>
    <ul>
      <li><strong>Required field</strong> — "Hey, you forgot to enter your name!"</li>
      <li><strong>Email format</strong> — "That doesn't look like an email — you need an @ symbol."</li>
      <li><strong>Password match</strong> — "Those two passwords don't match. Try again!"</li>
    </ul>
    <p>You validate on every keystroke (instant feedback) or on submit. Show errors right below the input field so the user knows exactly what to fix. Like a patient game coach!</p>
  `,
  'events-4': `
    <p><strong>Uncontrolled components</strong> are like a <strong>sticky note</strong> — the input remembers its own value without React's help.</p>
    <p>Instead of <code>useState</code> and <code>onChange</code> (controlled), you use a <strong>ref</strong> to grab the value when you need it. "Hey input, what's your value right now?"</p>
    <p>Use <code>useRef</code> to create a reference to the input, and read <code>ref.current.value</code> when you submit the form.</p>
    <p>When to use uncontrolled:</p>
    <ul>
      <li>Simple forms where you only need the value on submit.</li>
      <li>Third-party libraries that manage their own state.</li>
      <li>File inputs (you can't control those anyway!).</li>
    </ul>
    <p>Think of it like a tax form — you don't need to watch every single keystroke. You just read the final answers when the user clicks "Submit"!</p>
  `,

  // ─── Module 5: Context API & useReducer ───
  'context-1': `
    <p><strong>Context API</strong> is like a <strong>school announcement system</strong> (PA system).</p>
    <p>Instead of the principal (parent) walking to every classroom (child) to deliver the same message, they just speak into the PA system, and ALL classrooms hear it at once!</p>
    <p>In React, "prop drilling" is like walking to every classroom individually. Context is the PA system — you create a context (the PA system), provide a value (the announcement), and any component anywhere can consume it (hear it).</p>
    <p>Three steps:</p>
    <ol>
      <li><code>createContext()</code> — install the PA system.</li>
      <li><code>&lt;Context.Provider value={data}&gt;</code> — the principal speaks into the mic.</li>
      <li><code>useContext(Context)</code> — a teacher in any room hears the announcement.</li>
    </ol>
    <p>Great for: themes, user authentication, language preferences — things many components need!</p>
  `,
  'context-2': `
    <p><strong>useReducer</strong> is like a <strong>vending machine</strong> with clear instructions.</p>
    <p>A vending machine works like this: You put in money and press a button (dispatch an action). The machine checks the instructions (the reducer): "If button A1 is pressed and enough money inserted, give out chips." It then updates its inventory (state).</p>
    <p><code>useReducer</code> is for complex state logic. Instead of multiple <code>useState</code> calls, you have ONE state object and ONE function (the reducer) that handles all changes based on "actions."</p>
    <ul>
      <li><strong>State:</strong> { count: 0, step: 1 } — the vending machine's current state.</li>
      <li><strong>Action:</strong> { type: 'increment' } — what button you pressed.</li>
      <li><strong>Reducer:</strong> (state, action) => newState — the machine's internal logic.</li>
    </ul>
    <p>Best for: shopping carts, form wizards, games — anything with complex state transitions!</p>
  `,
  'context-3': `
    <p><strong>Context + useReducer</strong> together is like a <strong>smart home system</strong>.</p>
    <p>Your house has a central hub (context) that holds all the state: lights on/off, temperature, door locked/unlocked. And it has specific commands (actions dispatched to a reducer): "Turn off all lights," "Set temperature to 72°F," "Lock the front door."</p>
    <p>The pattern:</p>
    <ol>
      <li>A <code>Provider</code> component wraps your app and creates the state + dispatch with useReducer.</li>
      <li>The provider passes { state, dispatch } through context.</li>
      <li>Any component can read state via context and dispatch actions to update it.</li>
    </ol>
    <p>This is like Redux but built into React! It's great for medium-sized apps that don't need a full state management library but have more complexity than simple useState can handle.</p>
  `,
  'context-4': `
    <p><strong>Context best practices</strong> are like <strong>house rules for a shared kitchen</strong>.</p>
    <p>Everyone uses the kitchen, but if everyone keeps moving things around, nobody can find anything! So you set rules:</p>
    <ul>
      <li><strong>Keep context focused</strong> — Don't put EVERYTHING in one context. Like having separate cabinets for plates, cups, and spices instead of one giant messy drawer.</li>
      <li><strong>Split contexts by domain</strong> — AuthContext for user data, ThemeContext for colors, CartContext for shopping cart. Separate concerns!</li>
      <li><strong>Avoid over-rendering</strong> — When context changes, ALL consumers re-render. Memoize or split contexts to avoid unnecessary updates.</li>
      <li><strong>Don't use context for everything</strong> — Sometimes prop passing is simpler! Context is for "global" data, not component-specific state.</li>
    </ul>
    <p>Think of context like the fridge in the shared kitchen — put things there that EVERYONE needs (milk, eggs). Keep personal snacks in your own cabinet (local state)!</p>
  `,

  // ─── Module 6: Component Patterns ───
  'patterns-1': `
    <p><strong>Higher-Order Components (HOCs)</strong> are like <strong>phone cases</strong>.</p>
    <p>You have a phone (a component). You put a case on it (the HOC). The case adds protection or features (like a kickstand or card holder), but the phone inside still works the same way.</p>
    <p>An HOC is a function that takes a component and returns a NEW component with extra features. The original component doesn't change — it's just wrapped!</p>
    <p><code>const EnhancedComponent = withExtraFeature(WrappedComponent)</code></p>
    <p>Common uses: adding authentication checks, providing data from an API, adding loading states. Like putting on a case that adds a pop socket — you get new functionality for free!</p>
  `,
  'patterns-2': `
    <p><strong>Render Props</strong> are like a <strong>food truck with a customizable menu</strong>.</p>
    <p>The food truck (component) has the kitchen, ingredients, and cooking equipment. But instead of selling fixed meals, it lets YOU decide what sandwich to make. You tell the chef: "I want turkey on rye with Swiss cheese."</p>
    <p>A render prop component shares its internal state by calling a function prop (the render prop) that returns JSX. The component handles the logic, and YOU decide how to display it.</p>
    <p><code>&lt;MouseTracker render={(position) => &lt;Dot x={position.x} y={position.y} /&gt;} /&gt;</code></p>
    <p>The MouseTracker handles all the mouse event logic, but YOU decide what to draw at the mouse position. The logic is shared, but the UI is customizable!</p>
  `,
  'patterns-3': `
    <p><strong>Compound components</strong> are like a <strong>burger meal deal</strong> at a restaurant.</p>
    <p>You order a "Burger Meal" and you get: a burger, fries, and a drink. They're separate items, but they work together as ONE meal. You can customize each part (sesame bun? curly fries? Coke?) but they're always served together.</p>
    <p>In React, compound components are a group of related components that share implicit state through context:</p>
    <ul>
      <li><code>&lt;Menu&gt;</code> — the overall container (the meal deal)</li>
      <li><code>&lt;Menu.Item&gt;</code> — individual items in the list (fries, burger, drink)</li>
      <li><code>&lt;Menu.Divider&gt;</code> — a separator</li>
    </ul>
    <p>The parent component (<code>Tabs</code>, <code>Menu</code>, <code>Select</code>) provides shared state to its children via context. Children just render themselves — they don't need to manage the shared behavior!</p>
  `,
  'patterns-4': `
    <p><strong>Composition vs Inheritance</strong> — it's like <strong>LEGO bricks vs. pre-built models</strong>.</p>
    <p><strong>Composition (LEGO bricks)</strong>: You have small, simple building blocks. You combine them any way you want to create complex structures. Each block has a clear purpose and can be reused in different builds.</p>
    <p><strong>Inheritance (pre-built models)</strong>: You buy a spaceship model. To make a different spaceship, you buy a "Super Spaceship" version that has everything the basic one has, plus extras.</p>
    <p>React's philosophy is <strong>composition over inheritance</strong>. Use small, focused components and combine them. Don't create a "BaseButton" class and extend it. Instead, make a <code>Button</code> component and compose it with icons, text, and styles via props!</p>
  `,

  // ─── Module 7: React Router ───
  'router-1': `
    <p><strong>React Router</strong> is like a <strong>TV remote control</strong> for your single-page app.</p>
    <p>On a TV, pressing different buttons changes what you see on the screen. But the TV itself stays on — you don't turn it off and on again each time you change channels.</p>
    <p>React Router does the same thing. Different URLs show different components, but the page never fully reloads. It's fast because only the content area changes!</p>
    <ul>
      <li><code>&lt;BrowserRouter&gt;</code> — the TV itself. Wraps your whole app.</li>
      <li><code>&lt;Routes&gt;</code> — the channel guide. Lists all available channels (routes).</li>
      <li><code>&lt;Route path="/about" element={&lt;About /&gt;} /&gt;</code> — a channel entry.</li>
      <li><code>&lt;Link to="/about"&gt;</code> — the remote control button. Changes the channel.</li>
    </ul>
  `,
  'router-2': `
    <p><strong>Route parameters</strong> are like <strong>library book call numbers</strong>.</p>
    <p>You go to the library and look for book "FIC/SMI/1984". The library system (router) reads that call number and directs you to the exact shelf where that book is. Each call number is unique.</p>
    <p>In URLs: <code>/users/42</code> or <code>/products/shoes</code> — the dynamic parts are route parameters.</p>
    <p>You define: <code>&lt;Route path="/users/:userId" ... /&gt;</code> — the <code>:userId</code> is a placeholder.</p>
    <p>You read it: <code>useParams().userId</code> — "What user ID is in the URL?"</p>
    <p>You can also read <strong>query parameters</strong> (<code>?search=react&amp;page=2</code>) using <code>useSearchParams()</code> — like asking "What search terms and page number are in the URL?"</p>
  `,
  'router-3': `
    <p><strong>Nested routes</strong> are like <strong>subdirectories on your computer</strong>.</p>
    <p>You have a folder called <code>/dashboard</code>. Inside it, you have subfolders: <code>/dashboard/settings</code>, <code>/dashboard/profile</code>, <code>/dashboard/stats</code>. Each subfolder has its own files.</p>
    <p>In React Router, you nest <code>&lt;Route&gt;</code> components inside each other:</p>
    <pre>&lt;Route path="dashboard" element={&lt;DashboardLayout /&gt;}&gt;
  &lt;Route path="profile" element={&lt;Profile /&gt;} /&gt;
  &lt;Route path="settings" element={&lt;Settings /&gt;} /&gt;
&lt;/Route&gt;</pre>
    <p>The <code>DashboardLayout</code> has a <code>&lt;Outlet /&gt;</code> component — like a placeholder that says "child routes render HERE." The sidebar and header stay visible while the content changes in the outlet!</p>
  `,
  'router-4': `
    <p><strong>Navigation &amp; Guards</strong> are like <strong>security badges at an office building</strong>.</p>
    <p>To enter different rooms, you need different access levels:</p>
    <ul>
      <li>Lobby (home page) — open to everyone.</li>
      <li>Coworking space (public pages) — also open.</li>
      <li>Server room (admin page) — requires special access!</li>
    </ul>
    <p><strong>Programmatic navigation</strong> (<code>useNavigate</code>) is like being told "Go to the conference room on the 3rd floor" — you don't click a link, you're sent there automatically after logging in.</p>
    <p><strong>Protected routes</strong> are like the security guard checking your badge before letting you into the server room. You create a wrapper component:</p>
    <p><code>{isLoggedIn ? &lt;Outlet /&gt; : &lt;Navigate to="/login" /&gt;}</code></p>
    <p>If you have the badge, you pass. If not, you're redirected to the login page!</p>
  `,

  // ─── Module 8: Performance Optimization ───
  'perf-1': `
    <p><strong>React.memo</strong> is like a <strong>sticky note on your fridge</strong> that says "Same as before — no need to re-cook!"</p>
    <p>Imagine every time someone walks into the kitchen, you cook a new dinner. Even if nothing changed! That's wasteful.</p>
    <p>React.memo remembers the last "meal" (component output) and checks: "Did any ingredients (props) change? No? Then just serve the same meal again!"</p>
    <p>Use it when:</p>
    <ul>
      <li>A component renders often with the SAME props.</li>
      <li>The component is slow to render (big list, complex calculations).</li>
      <li>The parent re-renders frequently.</li>
    </ul>
    <p>Don't wrap EVERYTHING with React.memo. The sticky note itself takes effort to write! Only use it when you notice performance issues.</p>
  `,
  'perf-2': `
    <p><strong>useMemo</strong> is like a <strong>slow-cooker recipe that you make in bulk</strong> and freeze portions.</p>
    <p>Making the recipe from scratch takes 2 hours (expensive calculation). But you often need it for dinner. So you make a BIG batch once, freeze the extra portions, and just reheat them as needed.</p>
    <p>useMemo "freezes" a computed value and only recalculates when its dependencies change. The dependencies are the "ingredients" — if they haven't changed, just reheat the frozen value!</p>
    <p><code>const sortedList = useMemo(() => {</code></p>
    <p><code>  return bigList.sort((a, b) => a.name.localeCompare(b.name))</code></p>
    <p><code>}, [bigList])</code></p>
    <p>Without useMemo, you'd re-sort the entire list on EVERY render. With useMemo, you only sort when <code>bigList</code> actually changes!</p>
  `,
  'perf-3': `
    <p><strong>useCallback</strong> is like having a <strong>favorite coffee order</strong> saved on your phone.</p>
    <p>Instead of telling the barista your order from scratch every time ("Medium latte with oat milk, extra hot, one pump vanilla..."), you just say "My usual!"</p>
    <p>useCallback saves a function so it stays the SAME between renders (as long as dependencies don't change):</p>
    <p><code>const handleClick = useCallback(() => {</code></p>
    <p><code>  doSomething(a, b);</code></p>
    <p><code>}, [a, b])</code></p>
    <p>Without it, React creates a brand new function every render. With useCallback, it's the same function — which matters when you pass it to a React.memo'd child. The child sees "same props as before" and skips re-rendering!</p>
  `,
  'perf-4': `
    <p><strong>Code splitting &amp; lazy loading</strong> is like <strong>packing for a trip</strong> — you only take what you NEED right now.</p>
    <p>You don't pack your entire wardrobe for a weekend trip. You pack 3 outfits for 3 days.</p>
    <p>React's <code>lazy()</code> and <code>Suspense</code> let you split your app into smaller bundles. A huge app doesn't need to load ALL its code at once:</p>
    <p><code>const Dashboard = lazy(() => import('./Dashboard'))</code></p>
    <p>This is like saying: "Don't pack the Dashboard clothes yet. I'll only need them when I click on the Dashboard tab."</p>
    <p>The user loads only the code for the initial page. When they navigate somewhere else, the new code loads in the background. Faster first load, smoother experience!</p>
  `,

  // ─── Module 9: Testing & Best Practices ───
  'testing-1': `
    <p><strong>Testing</strong> is like <strong>tasting your food while cooking</strong>.</p>
    <p>You don't wait until the whole meal is done to discover you added too much salt. You taste as you go: "Is this soup seasoned well? Does this cake taste sweet enough?"</p>
    <p>Similarly, you test components as you build them:</p>
    <ul>
      <li><strong>Unit test</strong> — Test ONE component in isolation. Like tasting just the soup.</li>
      <li><strong>Integration test</strong> — Test how several components work together. Like tasting the whole meal.</li>
    </ul>
    <p>React Testing Library helps you test components the way a USER would — clicking buttons, reading text, filling inputs. It's like having a robot taste-tester that follows your recipe and reports back!</p>
  `,
  'testing-2': `
    <p><strong>Testing state &amp; events</strong> is like <strong>testing a video game controller</strong>.</p>
    <p>You press the A button. Does Mario jump? You press Start. Does the game pause? You test each button to make sure it does what it's supposed to.</p>
    <p>In React testing:</p>
    <ul>
      <li><strong>Render</strong> the component — load the game level.</li>
      <li><strong>Find</strong> the button — find the A button on the controller.</li>
      <li><strong>Click</strong> it — press the button.</li>
      <li><strong>Check</strong> the result — did Mario jump?</li>
    </ul>
    <p><code>fireEvent.click(screen.getByText('Submit'))</code> — press Submit. <code>expect(screen.getByText('Thanks!')).toBeInTheDocument()</code> — did the "Thanks!" message appear?</p>
  `,
  'testing-3': `
    <p><strong>Mocking API calls</strong> in tests is like <strong>using a flight simulator</strong> instead of a real plane.</p>
    <p>When training a pilot, you don't give them a real 747 and say "Go!" You use a simulator that acts like a real plane but in a safe, controlled environment.</p>
    <p>In tests, you don't want to call real APIs (slow, unreliable, might send unwanted data). Instead, you <strong>mock</strong> the API:</p>
    <p><code>jest.mock('./api')</code> — replace the real API with a simulator.</p>
    <p>The mock returns fake data instantly. The component behaves as if it received real data, but the test is fast and doesn't depend on any server. Like a flight simulator at home — no airport needed!</p>
  `,
  'testing-4': `
    <p><strong>Testing hooks</strong> is like <strong>testing a kitchen appliance</strong> without cooking a full meal.</p>
    <p>You want to test your blender. Do you need to make a full smoothie with fruit, yogurt, and ice? No! You can just blend water and see if the motor works.</p>
    <p>For custom hooks, you can test them in isolation:</p>
    <ul>
      <li><code>renderHook(() => useCounter(0))</code> — like plugging in the blender.</li>
      <li><code>act(() => result.current.increment())</code> — turning it on.</li>
      <li><code>expect(result.current.count).toBe(1)</code> — checking it worked.</li>
    </ul>
    <p>You don't need a full component to test a hook. Just render the hook and assert its behavior. Like testing your blender with a drop of water — fast, clean, and effective!</p>
  `,
};

/* Expose globally for script-tag usage */
window.eli5ReactData = eli5ReactData;
