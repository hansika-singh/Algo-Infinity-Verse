// ────────────────────────────────────────────────────────────
//  React Mastery — Expanded Curriculum Data
// ────────────────────────────────────────────────────────────

const curriculum = [
  // ─── MODULE 1: JSX & COMPONENTS ─────────────────────────
  {
    id: 'jsx',
    title: 'JSX & Components',
    lessons: [
      // ── Lesson 1.1 ──
      {
        id: 'jsx-1',
        title: 'Introduction to JSX',
        objectives: [
          'Understand what JSX is and why React uses it',
          'Learn how to embed JavaScript expressions in JSX',
          'JSX is an Expression that compiles to React.createElement',
        ],
        takeaways: [
          'JSX is a syntax extension for JavaScript, not HTML',
          'Use { } to embed any JS expression inside JSX',
          'JSX compiles down to React.createElement() calls',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">What is JSX?</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">JSX is a syntax extension for JavaScript. It looks like HTML, but it's actually JavaScript under the hood. React uses JSX to describe what the UI should look like.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">JSX produces React "elements". You can put any valid JavaScript expression inside curly braces in JSX. The expressions inside <code>{ }</code> can be variables, function calls, or any JS expression.</p>

          <div class="bg-gradient-to-r from-sky-50 to-indigo-50 border-l-4 border-sky-400 p-4 my-6 rounded-r-lg">
            <p class="text-sky-800 font-medium"><i class="fa-solid fa-code mr-2"></i><strong>Try it:</strong> Head over to the <strong>Interactive Playground</strong> tab to experiment with JSX expressions!</p>
          </div>

          <div class="bg-amber-50 border border-amber-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-amber-800 mb-2">JSX Rules to Remember</h4>
            <ul class="space-y-2 text-sm text-amber-700">
              <li><i class="fa-solid fa-check-circle text-amber-500 mr-1"></i> Return a <strong>single root element</strong> — wrap siblings in a div or React Fragment <code>&lt;&gt;&lt;/&gt;</code></li>
              <li><i class="fa-solid fa-check-circle text-amber-500 mr-1"></i> Close <strong>all tags</strong> — even <code>&lt;br /&gt;</code> and <code>&lt;img /&gt;</code></li>
              <li><i class="fa-solid fa-check-circle text-amber-500 mr-1"></i> Use <strong>camelCase</strong> for attributes — <code>className</code>, <code>onClick</code>, <code>tabIndex</code></li>
              <li><i class="fa-solid fa-check-circle text-amber-500 mr-1"></i> Use <code>{ }</code> for dynamic values — <code>{"Hello"}</code> or <code>{variable}</code></li>
            </ul>
          </div>
        `,
        defaultCode: `function App() {\n  const name = "React Developer";\n  const today = new Date().toLocaleDateString();\n  return (\n    <div style={{ padding: '24px', fontFamily: 'sans-serif', maxWidth: 500, margin: '0 auto' }}>\n      <h1 style={{ color: '#6366f1', fontSize: '1.8rem' }}>Hello, {name}!</h1>\n      <p style={{ color: '#6b7280' }}>Today is {today}.</p>\n      <p style={{ color: '#6b7280' }}>2 + 2 = {2 + 2}</p>\n      <hr style={{ margin: '16px 0', borderColor: '#e5e7eb' }} />\n      <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>\n        Open the console to see what JSX compiles to!\n      </p>\n    </div>\n  );\n}\n\nconsole.log('JSX compiles to:', App.toString());\nReactDOM.render(<App />, document.getElementById('root'));`,
      },
      // ── Lesson 1.2 ──
      {
        id: 'jsx-2',
        title: 'Components Deep Dive',
        objectives: [
          'Understand what a React component is and how to create one',
          'Distinguish between function and class components',
          'Learn the convention of component naming',
        ],
        takeaways: [
          'Components are functions that return JSX',
          'Component names must start with a capital letter',
          'A component describes a reusable piece of UI',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Building with Components</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">A <strong>component</strong> is a reusable piece of UI. In React, components are just JavaScript functions that return JSX. They are the building blocks of every React app.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">Think of components like <strong>LEGO bricks</strong>. Each brick has a specific shape and purpose. You combine them to build complex structures.</p>

          <div class="grid md:grid-cols-2 gap-4 my-6">
            <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
              <h4 class="font-bold text-indigo-800 flex items-center gap-2"><i class="fa-solid fa-cube"></i> Function Component</h4>
              <pre class="text-xs text-indigo-700 mt-2 bg-white p-3 rounded-lg overflow-x-auto">function Welcome() {\n  return &lt;h1&gt;Hello!&lt;/h1&gt;;\n}</pre>
            </div>
            <div class="bg-purple-50 border border-purple-200 rounded-xl p-5">
              <h4 class="font-bold text-purple-800 flex items-center gap-2"><i class="fa-solid fa-cubes"></i> Arrow Function</h4>
              <pre class="text-xs text-purple-700 mt-2 bg-white p-3 rounded-lg overflow-x-auto">const Welcome = () => {\n  return &lt;h1&gt;Hello!&lt;/h1&gt;;\n};</pre>
            </div>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-400 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Important:</strong> React component names MUST start with a capital letter. Lowercase names like <code>&lt;div&gt;</code> are treated as HTML tags!</p>
          </div>
        `,
        defaultCode: `// A simple reusable component\nfunction Avatar() {\n  return (\n    <div style={{\n      width: 80, height: 80,\n      borderRadius: '50%',\n      background: 'linear-gradient(135deg, #6366f1, #a78bfa)',\n      display: 'flex',\n      alignItems: 'center',\n      justifyContent: 'center',\n      color: 'white',\n      fontSize: 28,\n      fontWeight: 'bold',\n      margin: '0 auto'\n    }}>\n      R\n    </div>\n  );\n}\n\nfunction ProfileCard() {\n  return (\n    <div style={{\n      padding: 24, fontFamily: 'sans-serif',\n      maxWidth: 280, margin: '0 auto',\n      border: '1px solid #e5e7eb',\n      borderRadius: 16, textAlign: 'center',\n      boxShadow: '0 4px 6px rgba(0,0,0,0.05)'\n    }}>\n      <Avatar />\n      <h2 style={{ marginTop: 12, marginBottom: 4, color: '#1f2937' }}>React Learner</h2>\n      <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>\n        Building apps one component at a time\n      </p>\n    </div>\n  );\n}\n\nReactDOM.render(<ProfileCard />, document.getElementById('root'));`,
      },
      // ── Lesson 1.3 ──
      {
        id: 'jsx-3',
        title: 'Props & Component Communication',
        objectives: [
          'Learn how to pass data to components via props',
          'Understand that props are read-only',
          'Build components that accept and use props',
        ],
        takeaways: [
          'Props are function arguments passed as JSX attributes',
          'Props are read-only — components cannot modify their props',
          'Default props and prop spreading provide flexibility',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Passing Data with Props</h3>
          <p class="mb-4 text-gray-700 leading-relaxed"><strong>Props</strong> (short for "properties") are how React components communicate with each other. Think of props like <strong>function arguments</strong> — you pass data into a component, and the component uses it to render.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">Props flow <strong>downward</strong> from parent to child. A component cannot change its own props (they are read-only), just like you cannot change the arguments passed to a function.</p>

          <div class="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-teal-800 mb-2">Prop Patterns</h4>
            <ul class="space-y-2 text-sm text-teal-700">
              <li><code>defaultProps</code> — set fallback values for optional props</li>
              <li><strong>Spread syntax</strong> — <code>&lt;Component {...obj} /&gt;</code> passes all object properties as props</li>
              <li><code>children</code> — a special prop for nested content inside component tags</li>
            </ul>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-400 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Remember:</strong> Props are the ingredients your component receives. The component is the recipe that turns ingredients into a dish!</p>
          </div>
        `,
        defaultCode: `function Greeting(props) {\n  return (\n    <div style={{\n      padding: 20, fontFamily: 'sans-serif',\n      maxWidth: 400, margin: '0 auto',\n      background: '#f0fdf4', borderRadius: 12,\n      border: '1px solid #bbf7d0', textAlign: 'center'\n    }}>\n      <h2 style={{ color: '#166534', margin: 0 }}>\n        Hello, {props.name || 'Guest'}!\n      </h2>\n      {props.subtitle && (\n        <p style={{ color: '#15803d', fontSize: 14 }}>{props.subtitle}</p>\n      )}\n    </div>\n  );\n}\n\nfunction App() {\n  return (\n    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 32 }}>\n      <Greeting name="Alice" subtitle="Frontend Developer" />\n      <Greeting name="Bob" subtitle="UI Designer" />\n      <Greeting />\n    </div>\n  );\n}\n\nReactDOM.render(<App />, document.getElementById('root'));`,
      },
      // ── Lesson 1.4 ──
      {
        id: 'jsx-4',
        title: 'Children & Composition',
        objectives: [
          'Use the children prop for component composition',
          'Build layout components that wrap content',
          'Understand React Fragments for grouping without extra DOM',
        ],
        takeaways: [
          'children is a special prop for nested content',
          'Composition lets you create flexible, reusable layouts',
          'React Fragments (<>...</>) avoid unnecessary wrapper divs',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Composing Components</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">The <code>children</code> prop is a <strong>special prop</strong> that lets you pass content between the opening and closing tags of a component. This enables powerful <strong>composition patterns</strong>.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">Fragments (<code>&lt;&gt;...&lt;/&gt;</code>) let you group multiple elements without adding an extra wrapper div to the DOM. This keeps your HTML clean and semantic.</p>

          <div class="grid md:grid-cols-2 gap-4 my-6">
            <div class="bg-sky-50 border border-sky-200 rounded-xl p-5">
              <h4 class="font-bold text-sky-800 flex items-center gap-2"><i class="fa-solid fa-layer-group"></i> Card Layout</h4>
              <p class="text-sky-700 text-xs mt-1">A wrapper that adds shadow, padding, and border. Content passes through <code>children</code>.</p>
            </div>
            <div class="bg-purple-50 border border-purple-200 rounded-xl p-5">
              <h4 class="font-bold text-purple-800 flex items-center gap-2"><i class="fa-solid fa-grid-2"></i> Split Pane</h4>
              <p class="text-purple-700 text-xs mt-1">Accepts <code>left</code> and <code>right</code> props (not children) for a two-column layout.</p>
            </div>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-400 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Tip:</strong> Use composition over inheritance. Build small, focused components and compose them together rather than creating large, monolithic components!</p>
          </div>
        `,
        defaultCode: `function Card({ title, children }) {\n  return (\n    <div style={{\n      padding: 20, fontFamily: 'sans-serif',\n      maxWidth: 400, margin: '0 auto 16px',\n      border: '1px solid #e5e7eb', borderRadius: 12,\n      boxShadow: '0 4px 6px rgba(0,0,0,0.05)'\n    }}>\n      {title && (\n        <h3 style={{ margin: '0 0 12px', color: '#1f2937', borderBottom: '1px solid #f3f4f6', paddingBottom: 8 }}>\n          {title}\n        </h3>\n      )}\n      <div>{children}</div>\n    </div>\n  );\n}\n\nfunction App() {\n  return (\n    <>\n      <Card title="Notifications">\n        <p style={{ color: '#6b7280', fontSize: 14 }}>You have 3 unread messages.</p>\n      </Card>\n      <Card title="Quick Stats">\n        <p style={{ color: '#6366f1', fontWeight: 'bold' }}>Projects: 12</p>\n        <p style={{ color: '#6366f1', fontWeight: 'bold' }}>Tasks: 48</p>\n      </Card>\n      <Card>\n        <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>A card without a title</p>\n      </Card>\n    </>\n  );\n}\n\nReactDOM.render(<App />, document.getElementById('root'));`,
      },
      // ── Lesson 1.5 ──
      {
        id: 'jsx-5',
        title: 'Conditional Rendering & Lists',
        objectives: [
          'Use ternary and && for inline conditionals',
          'Render lists with .map() and unique keys',
          'Understand the key prop importance',
        ],
        takeaways: [
          'Use && for "if true, show this" patterns',
          'Use ternary for if/else in JSX',
          'Keys help React identify which items changed',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Dynamic Content</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">React renders conditionally using regular JavaScript — no special template syntax needed. Use <code>if</code> statements, the ternary operator <code>? :</code>, or logical AND <code>&&</code>.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">For rendering lists, use <code>.map()</code> to transform an array into an array of JSX elements. Always provide a unique <code>key</code> prop to help React efficiently update the list.</p>

          <div class="grid md:grid-cols-2 gap-4 my-6">
            <div class="bg-teal-50 border border-teal-200 rounded-xl p-5">
              <h4 class="font-bold text-teal-800 text-sm">Logical AND (&&)</h4>
              <pre class="text-xs text-teal-700 mt-2 bg-white p-3 rounded-lg">{isOnline && <span>Online</span>}</pre>
              <p class="text-teal-700 text-xs mt-2">Shows "Online" only when isOnline is true.</p>
            </div>
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h4 class="font-bold text-amber-800 text-sm">Ternary (? :)</h4>
              <pre class="text-xs text-amber-700 mt-2 bg-white p-3 rounded-lg">{isLoggedIn ? <Logout /> : <Login />}</pre>
              <p class="text-amber-700 text-xs mt-2">Shows Logout or Login based on condition.</p>
            </div>
          </div>

          <div class="bg-orange-50 border-l-4 border-orange-400 p-4 my-6 rounded-r-lg">
            <p class="text-orange-800 font-medium"><i class="fa-solid fa-exclamation-triangle mr-2"></i><strong>Warning:</strong> Don't use <code>index</code> as a key if the list order changes! Use a stable ID like <code>item.id</code> for best performance and correctness.</p>
          </div>
        `,
        defaultCode: `const tasks = [\n  { id: 1, text: 'Learn JSX', done: true },\n  { id: 2, text: 'Master components', done: true },\n  { id: 3, text: 'Understand state', done: false },\n  { id: 4, text: 'Build an app', done: false },\n];\n\nfunction TaskItem({ task }) {\n  return (\n    <li style={{\n      padding: '10px 14px',\n      marginBottom: 6,\n      background: task.done ? '#f0fdf4' : '#fefce8',\n      border: '1px solid',\n      borderColor: task.done ? '#bbf7d0' : '#fde68a',\n      borderRadius: 8,\n      display: 'flex',\n      alignItems: 'center',\n      gap: 8,\n      fontFamily: 'sans-serif',\n      fontSize: 14\n    }}>\n      <span style={{ color: task.done ? '#16a34a' : '#d97706' }}>\n        {task.done ? '✓' : '○'}\n      </span>\n      <span style={{\n        textDecoration: task.done ? 'line-through' : 'none',\n        color: task.done ? '#6b7280' : '#1f2937'\n      }}>\n        {task.text}\n      </span>\n    </li>\n  );\n}\n\nfunction TaskList() {\n  const total = tasks.length;\n  const done = tasks.filter(t => t.done).length;\n  return (\n    <div style={{ maxWidth: 400, margin: '0 auto', padding: 20 }}>\n      <h2 style={{ fontFamily: 'sans-serif', color: '#1f2937' }}>\n        Tasks ({done}/{total} complete)\n      </h2>\n      <ul style={{ listStyle: 'none', padding: 0 }}>\n        {tasks.map(task => (\n          <TaskItem key={task.id} task={task} />\n        ))}\n      </ul>\n    </div>\n  );\n}\n\nReactDOM.render(<TaskList />, document.getElementById('root'));`,
      },
    ],
    quiz: [
      {
        id: 'q-jsx-1',
        question: 'What does JSX get compiled into?',
        options: ['HTML strings', 'React.createElement() calls', 'Machine Code', 'CSS styles'],
        correct: 1,
      },
      {
        id: 'q-jsx-2',
        question: 'How do you embed a JavaScript expression inside JSX?',
        options: ["Using quotes ''", 'Using parentheses ()', 'Using curly braces {}', 'Using square brackets []'],
        correct: 2,
      },
      {
        id: 'q-jsx-3',
        question: 'What is the special prop used to pass nested content between component tags?',
        options: ['props', 'content', 'children', 'slot'],
        correct: 2,
      },
      {
        id: 'q-jsx-4',
        question: 'Why must component names start with a capital letter?',
        options: [
          'To match JavaScript class naming conventions',
          'To distinguish them from HTML tags in JSX',
          'It is optional but recommended',
          'For CSS styling purposes',
        ],
        correct: 1,
      },
      {
        id: 'q-jsx-5',
        question: 'When rendering a list with .map(), what important prop should you include?',
        options: ['ref', 'id', 'key', 'index'],
        correct: 2,
      },
    ],
  },

  // ─── MODULE 2: PROPS & STATE ────────────────────────────
  {
    id: 'props-state',
    title: 'Props & State',
    lessons: [
      // ── Lesson 2.1 ──
      {
        id: 'ps-1',
        title: 'Understanding State',
        objectives: [
          'Understand the concept of state in React',
          'Learn what useState returns (value + setter)',
          'State changes trigger re-renders',
        ],
        takeaways: [
          'State is a component\'s memory — it persists between renders',
          'useState returns a value and a setter function in an array',
          'Calling the setter triggers a re-render with the new value',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">State in React</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">State allows React components to change their output over time in response to user actions, network responses, and anything else.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">While <strong>props</strong> are passed to a component (like function parameters), <strong>state</strong> is managed within the component (like variables declared within a function). Unlike regular variables though, changing state triggers a <strong>re-render</strong> to update the UI.</p>

          <div class="bg-gradient-to-r from-sky-50 to-indigo-50 border-l-4 border-sky-400 p-4 my-6 rounded-r-lg">
            <p class="text-sky-800 font-medium"><i class="fa-solid fa-circle-info mr-2"></i>Each call to the setter function triggers a re-render. React batches state updates for performance, so multiple <code>setState</code> calls in the same event handler are batched together.</p>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-400 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Tip:</strong> State updates are asynchronous. If you need the latest state, use the functional update form: <code>setCount(prev => prev + 1)</code>.</p>
          </div>
        `,
        defaultCode: `function Counter() {\n  const [count, setCount] = React.useState(0);\n\n  return (\n    <div style={{ padding: 24, textAlign: 'center', fontFamily: 'sans-serif', maxWidth: 320, margin: '0 auto' }}>\n      <h2 style={{ color: '#1f2937', fontSize: '1.5rem' }}>Counter</h2>\n      <div style={{\n        fontSize: '3rem', fontWeight: 'bold',\n        color: '#6366f1', margin: '16px 0'\n      }}>\n        {count}\n      </div>\n      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>\n        <button onClick={() => setCount(c => c - 1)}\n          style={{ padding: '10px 20px', background: '#e5e7eb', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>\n          - Decrement\n        </button>\n        <button onClick={() => setCount(0)}\n          style={{ padding: '10px 20px', background: '#fef3c7', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>\n          Reset\n        </button>\n        <button onClick={() => setCount(c => c + 1)}\n          style={{ padding: '10px 20px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>\n          + Increment\n        </button>\n      </div>\n    </div>\n  );\n}\n\nReactDOM.render(<Counter />, document.getElementById('root'));`,
      },
      // ── Lesson 2.2 ──
      {
        id: 'ps-2',
        title: 'useState Deep Dive',
        objectives: [
          'Use multiple useState calls in one component',
          'Understand state update batching',
          'Use functional updates for computed state',
        ],
        takeaways: [
          'Call useState multiple times for multiple state variables',
          'Use functional updates when new state depends on old state',
          'State is isolated per component instance',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Mastering useState</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">A component can have multiple state variables. Call <code>useState</code> multiple times for different concerns — separating them makes code clearer and easier to maintain.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">Each component instance has its own independent state. If you render the same component twice, each has its own counter, toggle, and form state.</p>

          <div class="grid md:grid-cols-2 gap-4 my-6">
            <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
              <h4 class="font-bold text-indigo-800 text-sm">Multiple State Variables</h4>
              <pre class="text-xs text-indigo-700 mt-2 bg-white p-3 rounded-lg">const [name, setName] = useState('')\nconst [age, setAge] = useState(0)\nconst [isActive, setIsActive] = useState(false)</pre>
            </div>
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h4 class="font-bold text-amber-800 text-sm">Functional Update</h4>
              <pre class="text-xs text-amber-700 mt-2 bg-white p-3 rounded-lg">setCount(prev => prev + 1)\n// Safe for multiple calls\n// inside same event handler</pre>
            </div>
          </div>

          <div class="bg-orange-50 border-l-4 border-orange-400 p-4 my-6 rounded-r-lg">
            <p class="text-orange-800 font-medium"><i class="fa-solid fa-exclamation-triangle mr-2"></i><strong>Gotcha:</strong> If you call <code>setCount(count + 1)</code> three times in a row, it still only increments once because <code>count</code> is stale. Use <code>setCount(c => c + 1)</code> to correctly increment three times!</p>
          </div>
        `,
        defaultCode: `function ProfileEditor() {\n  const [name, setName] = React.useState('');\n  const [age, setAge] = React.useState(18);\n  const [likesCoding, setLikesCoding] = React.useState(true);\n\n  return (\n    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 400, margin: '0 auto' }}>\n      <h2 style={{ color: '#1f2937', marginTop: 0 }}>Profile Editor</h2>\n      <div style={{ marginBottom: 16 }}>\n        <label style={{ display: 'block', fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>\n          Name\n        </label>\n        <input\n          value={name}\n          onChange={e => setName(e.target.value)}\n          placeholder=\"Enter your name\"\n          style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 6, width: '100%' }}\n        />\n      </div>\n      <div style={{ marginBottom: 16 }}>\n        <label style={{ display: 'block', fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>\n          Age: {age}\n        </label>\n        <input\n          type=\"range\"\n          min={0} max={120}\n          value={age}\n          onChange={e => setAge(Number(e.target.value))}\n          style={{ width: '100%' }}\n        />\n      </div>\n      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#374151' }}>\n        <input\n          type=\"checkbox\"\n          checked={likesCoding}\n          onChange={e => setLikesCoding(e.target.checked)}\n        />\n        I like coding\n      </label>\n      <div style={{\n        marginTop: 20, padding: 16,\n        background: 'linear-gradient(135deg, #f0fdf4, #fefce8)',\n        borderRadius: 12, fontSize: 14\n      }}>\n        <strong>Preview:</strong>\n        <p style={{ margin: '4px 0' }}>Name: {name || '—'}</p>\n        <p style={{ margin: '4px 0' }}>Age: {age}</p>\n        <p style={{ margin: '4px 0' }}>Likes coding: {likesCoding ? 'Yes! 🎉' : 'No 😢'}</p>\n      </div>\n    </div>\n  );\n}\n\nReactDOM.render(<ProfileEditor />, document.getElementById('root'));`,
      },
      // ── Lesson 2.3 ──
      {
        id: 'ps-3',
        title: 'Lifting State Up',
        objectives: [
          'Share state between sibling components',
          'Lift state to the closest common ancestor',
          'Pass callbacks down for child-to-parent communication',
        ],
        takeaways: [
          'Lift state to the closest common ancestor of components that need it',
          'Pass state down via props and change handlers via callbacks',
          'Lifting state keeps your data flow predictable',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Sharing State Between Components</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Often, two components need to reflect the same changing data. The React pattern is to <strong>lift the shared state up</strong> to their closest common ancestor.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">The parent component holds the state and passes it down to its children via props. When a child needs to change the state, the parent provides a callback function that the child can call.</p>

          <div class="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-indigo-800 mb-2">The Pattern</h4>
            <ol class="text-sm text-indigo-700 space-y-1">
              <li>1. Identify the components that need shared data</li>
              <li>2. Find their closest common ancestor</li>
              <li>3. Move the state into that ancestor</li>
              <li>4. Pass state down as props and changes up as callbacks</li>
            </ol>
          </div>
        `,
        defaultCode: `// Child: displays a temperature value\nfunction TemperatureDisplay({ value, scale }) {\n  return (\n    <p style={{ fontSize: 14, color: '#374151', margin: '4px 0' }}>\n      {scale === 'c' ? 'Celsius' : 'Fahrenheit'}: <strong>{value}°</strong>\n    </p>\n  );\n}\n\n// Child: allows changing the temperature\nfunction TemperatureInput({ value, scale, onChange }) {\n  return (\n    <div style={{ marginBottom: 12 }}>\n      <label style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>\n        {scale === 'c' ? 'Celsius' : 'Fahrenheit'}\n      </label>\n      <input\n        type=\"number\"\n        value={value}\n        onChange={e => onChange(Number(e.target.value))}\n        style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 6, width: 120 }}\n      />\n    </div>\n  );\n}\n\n// Parent: holds the shared state\nfunction TemperatureCalculator() {\n  const [celsius, setCelsius] = React.useState(0);\n  const fahrenheit = Math.round((celsius * 9/5) + 32);\n\n  return (\n    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 350, margin: '0 auto', background: '#f8fafc', borderRadius: 16 }}>\n      <h2 style={{ margin: '0 0 16px', color: '#1f2937', fontSize: '1.25rem' }}>Temperature Converter</h2>\n      <TemperatureInput scale=\"c\" value={celsius} onChange={setCelsius} />\n      <TemperatureInput scale=\"f\" value={fahrenheit} onChange={v => setCelsius(Math.round((v - 32) * 5/9))} />\n      <hr style={{ borderColor: '#e5e7eb', margin: '12px 0' }} />\n      <TemperatureDisplay scale=\"c\" value={celsius} />\n      <TemperatureDisplay scale=\"f\" value={fahrenheit} />\n    </div>\n  );\n}\n\nReactDOM.render(<TemperatureCalculator />, document.getElementById('root'));`,
      },
      // ── Lesson 2.4 ──
      {
        id: 'ps-4',
        title: 'Props vs State — When to Use What',
        objectives: [
          'Clearly distinguish between props and state',
          'Decide when data should be props vs state',
          'Avoid common anti-patterns',
        ],
        takeaways: [
          'Props are external and read-only; state is internal and mutable',
          'If data can change over time, it should usually be state',
          'If data is passed from a parent, it should be props',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Choosing the Right Data Container</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Knowing whether something should be props or state is a fundamental React skill. Here's a simple checklist:</p>

          <div class="grid md:grid-cols-2 gap-4 my-6">
            <div class="bg-sky-50 border border-sky-200 rounded-xl p-5">
              <h4 class="font-bold text-sky-800 flex items-center gap-2"><i class="fa-solid fa-arrow-down"></i> Props</h4>
              <ul class="text-xs text-sky-700 mt-2 space-y-1">
                <li>✅ Data comes from a parent component</li>
                <li>✅ It doesn't change over time (or parent changes it)</li>
                <li>✅ You want to reuse a component with different data</li>
                <li>❌ Component should NOT be able to change it</li>
              </ul>
            </div>
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h4 class="font-bold text-amber-800 flex items-center gap-2"><i class="fa-solid fa-memory"></i> State</h4>
              <ul class="text-xs text-amber-700 mt-2 space-y-1">
                <li>✅ Data is internal to the component</li>
                <li>✅ It changes over time (user input, timers, etc.)</li>
                <li>✅ You can't calculate it from props</li>
                <li>❌ You have a parent that should control it</li>
              </ul>
            </div>
          </div>

          <div class="bg-orange-50 border-l-4 border-orange-400 p-4 my-6 rounded-r-lg">
            <p class="text-orange-800 font-medium"><i class="fa-solid fa-exclamation-triangle mr-2"></i><strong>Avoid this anti-pattern:</strong> Don't copy a prop into state! If a parent passes <code>name</code> as a prop, don't do <code>const [name, setName] = useState(props.name)</code>. It creates two sources of truth. Use the prop directly instead!</p>
          </div>
        `,
        defaultCode: `function UserProfile({ user }) {\n  // This component only uses props — it's a "dumb" or presentational component\n  return (\n    <div style={{\n      padding: 20, fontFamily: 'sans-serif',\n      maxWidth: 300, margin: '0 auto',\n      background: 'white', borderRadius: 12,\n      border: '1px solid #e5e7eb',\n      textAlign: 'center'\n    }}>\n      <div style={{\n        width: 60, height: 60, borderRadius: '50%',\n        background: '#e0e7ff',\n        display: 'flex', alignItems: 'center',\n        justifyContent: 'center',\n        fontSize: 24, margin: '0 auto 12px'\n      }}>\n        {user.avatar}\n      </div>\n      <h3 style={{ margin: 0, color: '#1f2937' }}>{user.name}</h3>\n      <p style={{ margin: '4px 0', color: '#6b7280', fontSize: 14 }}>{user.role}</p>\n      <span style={{\n        display: 'inline-block', padding: '2px 10px',\n        borderRadius: 12, fontSize: 12,\n        background: user.active ? '#dcfce7' : '#fee2e2',\n        color: user.active ? '#16a34a' : '#dc2626'\n      }}>\n        {user.active ? 'Active' : 'Inactive'}\n      </span>\n    </div>\n  );\n}\n\nfunction App() {\n  // The App component holds the data as state and passes it as props\n  const users = [\n    { name: 'Alice', role: 'Developer', avatar: '👩‍💻', active: true },\n    { name: 'Bob', role: 'Designer', avatar: '👨‍🎨', active: true },\n    { name: 'Charlie', role: 'Manager', avatar: '👔', active: false },\n  ];\n\n  return (\n    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', padding: 32 }}>\n      {users.map((u, i) => (\n        <UserProfile key={i} user={u} />\n      ))}\n    </div>\n  );\n}\n\nReactDOM.render(<App />, document.getElementById('root'));`,
      },
      // ── Lesson 2.5 ──
      {
        id: 'ps-5',
        title: 'Derived State & Keys',
        objectives: [
          'Understand derived/computed state',
          'Avoid redundant state by computing values during render',
          'Use keys effectively for list reconciliation',
        ],
        takeaways: [
          'If a value can be computed from existing state/props, don\'t store it',
          'Derived state keeps your data in sync automatically',
          'Use stable, unique keys (prefer IDs over indices)',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Don't Duplicate State</h3>
          <p class="mb-4 text-gray-700 leading-relaxed"><strong>Derived state</strong> is a value you can calculate from existing state or props. Don't store it separately — compute it during rendering instead. This keeps a <strong>single source of truth</strong> and avoids synchronization bugs.</p>
          <p class="mb-4 text-gray-700 leading-relaxed"><strong>Keys</strong> help React identify which items in a list have changed, been added, or been removed. Using stable IDs as keys makes list updates efficient and correct.</p>

          <div class="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-teal-800 mb-2">Examples of Derived State</h4>
            <ul class="space-y-2 text-sm text-teal-700">
              <li><code>fullName = firstName + ' ' + lastName</code> — derived from two states</li>
              <li><code>isDisabled = age < 18</code> — derived condition</li>
              <li><code>totalPrice = items.reduce(...)</code> — derived calculation</li>
              <li><code>filteredList = list.filter(...)</code> — derived from original data + filter state</li>
            </ul>
          </div>
        `,
        defaultCode: `function ShoppingCart() {\n  const [items, setItems] = React.useState([\n    { id: 1, name: 'Book', price: 15 },\n    { id: 2, name: 'T-Shirt', price: 25 },\n    { id: 3, name: 'Mug', price: 10 },\n  ]);\n\n  // Derived state — computed from items, not stored separately\n  const totalPrice = items.reduce((sum, item) => sum + item.price, 0);\n  const itemCount = items.length;\n\n  const removeItem = (id) => {\n    setItems(items.filter(item => item.id !== id));\n  };\n\n  return (\n    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 400, margin: '0 auto' }}>\n      <h2 style={{ color: '#1f2937', marginTop: 0 }}>Shopping Cart ({itemCount} items)</h2>\n      {items.map(item => (\n        <div key={item.id} style={{\n          display: 'flex', justifyContent: 'space-between',\n          alignItems: 'center', padding: '10px 14px',\n          marginBottom: 8, background: '#f9fafb',\n          borderRadius: 8, border: '1px solid #e5e7eb'\n        }}>\n          <span style={{ color: '#374151' }}>{item.name}</span>\n          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>\n            <span style={{ fontWeight: 'bold', color: '#6366f1' }}>\${item.price}</span>\n            <button onClick={() => removeItem(item.id)}\n              style={{ padding: '4px 8px', background: '#fee2e2', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, color: '#dc2626' }}>\n              ✕\n            </button>\n          </div>\n        </div>\n      ))}\n      <div style={{\n        marginTop: 16, padding: 16,\n        background: '#f0fdf4', borderRadius: 12,\n        border: '1px solid #bbf7d0',\n        display: 'flex', justifyContent: 'space-between',\n        fontWeight: 'bold', fontSize: '1.1rem'\n      }}>\n        <span>Total</span>\n        <span style={{ color: '#16a34a' }}>\${totalPrice}</span>\n      </div>\n    </div>\n  );\n}\n\nReactDOM.render(<ShoppingCart />, document.getElementById('root'));`,
      },
    ],
    quiz: [
      {
        id: 'q-ps-1',
        question: 'Can props be modified by the receiving component?',
        options: ['Yes, freely', 'No, they are read-only', 'Only if it is an object', 'Only with a setter function'],
        correct: 1,
      },
      {
        id: 'q-ps-2',
        question: 'What does useState return?',
        options: ['An object with current value', 'An array with current value and a setter', 'A single value', 'A promise'],
        correct: 1,
      },
      {
        id: 'q-ps-3',
        question: 'When two sibling components need to share state, what pattern should you use?',
        options: ['Create duplicate state in both', 'Use global variables', 'Lift state up to their common ancestor', 'Use localStorage'],
        correct: 2,
      },
      {
        id: 'q-ps-4',
        question: 'What is derived state?',
        options: [
          'State that comes from an API call',
          'A value computed from existing state or props during render',
          'State stored in localStorage',
          'The initial value passed to useState',
        ],
        correct: 1,
      },
      {
        id: 'q-ps-5',
        question: 'Why use the functional update form: setCount(prev => prev + 1)?',
        options: [
          'It is faster',
          'It ensures you get the latest state value',
          'It prevents re-renders',
          'It is required by React',
        ],
        correct: 1,
      },
    ],
  },

  // ─── MODULE 3: HOOKS DEEP DIVE ──────────────────────────
  {
    id: 'hooks',
    title: 'Hooks Deep Dive',
    lessons: [
      // ── Lesson 3.1 ──
      {
        id: 'hooks-1',
        title: 'The useEffect Hook',
        objectives: [
          'Understand what side effects are',
          'Use useEffect for data fetching, subscriptions, timers',
          'Master the dependency array and cleanup functions',
        ],
        takeaways: [
          'useEffect runs after every render by default',
          'The dependency array controls when the effect re-runs',
          'Return a cleanup function to prevent memory leaks',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Side Effects with useEffect</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">The Effect Hook lets you perform <strong>side effects</strong> in function components. Data fetching, setting up a subscription, timers, and manually changing the DOM are all examples of side effects.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">The <strong>dependency array</strong> is the second argument to useEffect. It tells React to skip running the effect if certain values haven't changed between re-renders.</p>

          <div class="grid md:grid-cols-3 gap-4 my-6">
            <div class="bg-sky-50 border border-sky-200 rounded-xl p-4">
              <h4 class="font-bold text-sky-800 text-sm">[] — On Mount</h4>
              <p class="text-sky-700 text-xs mt-1">Runs once when component mounts. Perfect for initial data fetch.</p>
            </div>
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h4 class="font-bold text-amber-800 text-sm">[dep] — On Change</h4>
              <p class="text-amber-700 text-xs mt-1">Runs when <code>dep</code> changes. Great for syncing with props.</p>
            </div>
            <div class="bg-rose-50 border border-rose-200 rounded-xl p-4">
              <h4 class="font-bold text-rose-800 text-sm">None — Every Render</h4>
              <p class="text-rose-700 text-xs mt-1">Runs after every render. Use sparingly!</p>
            </div>
          </div>

          <div class="bg-orange-50 border-l-4 border-orange-400 p-4 my-6 rounded-r-lg">
            <p class="text-orange-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Always clean up!</strong> If you set up subscriptions, timers, or event listeners in an effect, return a cleanup function. Without it, you'll have memory leaks and duplicate subscriptions!</p>
          </div>
        `,
        defaultCode: `function TimerApp() {\n  const [seconds, setSeconds] = React.useState(0);\n  const [isRunning, setIsRunning] = React.useState(false);\n\n  React.useEffect(() => {\n    if (!isRunning) return;\n    const interval = setInterval(() => {\n      setSeconds(s => s + 1);\n    }, 1000);\n    return () => clearInterval(interval);\n  }, [isRunning]);\n\n  return (\n    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 350, margin: '0 auto', textAlign: 'center' }}>\n      <h2 style={{ color: '#1f2937' }}>Timer</h2>\n      <div style={{\n        fontSize: '3rem', fontWeight: 'bold',\n        fontFamily: 'monospace', color: '#6366f1',\n        margin: '16px 0', letterSpacing: 2\n      }}>\n        {String(Math.floor(seconds / 60)).padStart(2, '0')}:\n        {String(seconds % 60).padStart(2, '0')}\n      </div>\n      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>\n        <button onClick={() => setIsRunning(!isRunning)}\n          style={{ padding: '10px 24px', background: isRunning ? '#fef3c7' : '#6366f1', color: isRunning ? '#1f2937' : 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>\n          {isRunning ? 'Pause' : 'Start'}\n        </button>\n        <button onClick={() => { setSeconds(0); setIsRunning(false); }}\n          style={{ padding: '10px 24px', background: '#e5e7eb', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>\n          Reset\n        </button>\n      </div>\n      <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 12 }}>\n        useEffect with cleanup — check the console (no interval leaks!)\n      </p>\n    </div>\n  );\n}\n\nReactDOM.render(<TimerApp />, document.getElementById('root'));`,
      },
      // ── Lesson 3.2 ──
      {
        id: 'hooks-2',
        title: 'useRef & DOM Access',
        objectives: [
          'Understand the useRef hook and its mutable .current property',
          'Access DOM elements directly with refs',
          'Use refs for values that persist without causing re-renders',
        ],
        takeaways: [
          'useRef creates a mutable object that persists across re-renders',
          'Changing .current does NOT trigger a re-render',
          'Refs are commonly used for DOM access and storing interval IDs',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Mutable Values with useRef</h3>
          <p class="mb-4 text-gray-700 leading-relaxed"><code>useRef</code> is like a "box" that holds a mutable value. Unlike state, changing the value inside a ref does NOT cause a re-render. This makes refs perfect for values that need to persist across renders but shouldn't trigger UI updates.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">The most common use case is accessing DOM elements directly. You create a ref, attach it to an element via the <code>ref</code> attribute, and access the DOM node via <code>ref.current</code>.</p>

          <div class="grid md:grid-cols-2 gap-4 my-6">
            <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
              <h4 class="font-bold text-indigo-800 flex items-center gap-2"><i class="fa-solid fa-arrow-pointer"></i> DOM Access</h4>
              <p class="text-indigo-700 text-xs mt-2">Focus an input, measure element size, integrate with a third-party library.</p>
            </div>
            <div class="bg-teal-50 border border-teal-200 rounded-xl p-5">
              <h4 class="font-bold text-teal-800 flex items-center gap-2"><i class="fa-solid fa-floppy-disk"></i> Persisted Values</h4>
              <p class="text-teal-700 text-xs mt-2">Count renders without causing extra ones, store previous values.</p>
            </div>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-400 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Tip:</strong> useRef gives you <code>current</code> — NOT <code>.value</code> or <code>.val</code>. It's just <code>ref.current</code> to read and <code>ref.current = newValue</code> to write!</p>
          </div>
        `,
        defaultCode: `function AutoFocusForm() {\n  const inputRef = React.useRef(null);\n  const renderCount = React.useRef(0);\n  const [name, setName] = React.useState('');\n\n  // Track renders without causing re-renders\n  renderCount.current += 1;\n\n  // Auto-focus the input on mount\n  React.useEffect(() => {\n    inputRef.current.focus();\n  }, []);\n\n  return (\n    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 400, margin: '0 auto' }}>\n      <h2 style={{ margin: '0 0 16px', color: '#1f2937' }}>useRef Demo</h2>\n      <input\n        ref={inputRef}\n        value={name}\n        onChange={e => setName(e.target.value)}\n        placeholder=\"Type something (auto-focused!)\"\n        style={{ padding: 10, border: '1px solid #d1d5db', borderRadius: 8, width: '100%', fontSize: 14 }}\n      />\n      <p style={{ color: '#6b7280', fontSize: 14, marginTop: 12 }}>\n        Rendered <strong>{renderCount.current}</strong> times\n      </p>\n      <p style={{ color: '#6b7280', fontSize: 14 }}>\n        Current value: <strong>{name || '—'}</strong>\n      </p>\n    </div>\n  );\n}\n\nReactDOM.render(<AutoFocusForm />, document.getElementById('root'));`,
      },
      // ── Lesson 3.3 ──
      {
        id: 'hooks-3',
        title: 'useCallback & useMemo',
        objectives: [
          'Optimize performance with useMemo for expensive computations',
          'Stabilize function references with useCallback',
          'Understand when NOT to use these hooks',
        ],
        takeaways: [
          'useMemo caches a computed value between renders',
          'useCallback caches a function reference between renders',
          'Both have dependency arrays — only recompute/recreate when deps change',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Performance Optimization Hooks</h3>
          <p class="mb-4 text-gray-700 leading-relaxed"><strong>useMemo</strong> memoizes (caches) the result of a computation. If the dependencies haven't changed, React returns the cached value instead of recalculating.</p>
          <p class="mb-4 text-gray-700 leading-relaxed"><strong>useCallback</strong> memoizes a function. This is useful when passing callbacks to optimized child components that rely on reference equality to prevent unnecessary re-renders.</p>

          <div class="grid md:grid-cols-2 gap-4 my-6">
            <div class="bg-sky-50 border border-sky-200 rounded-xl p-5">
              <h4 class="font-bold text-sky-800 flex items-center gap-2"><i class="fa-solid fa-calculator"></i> useMemo</h4>
              <pre class="text-xs text-sky-700 mt-2 bg-white p-3 rounded-lg">const sorted = useMemo(\n  () => data.sort(),\n  [data]\n);</pre>
            </div>
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h4 class="font-bold text-amber-800 flex items-center gap-2"><i class="fa-solid fa-floppy-disk"></i> useCallback</h4>
              <pre class="text-xs text-amber-700 mt-2 bg-white p-3 rounded-lg">const onClick = useCallback(\n  () => handleClick(id),\n  [id]\n);</pre>
            </div>
          </div>

          <div class="bg-orange-50 border-l-4 border-orange-400 p-4 my-6 rounded-r-lg">
            <p class="text-orange-800 font-medium"><i class="fa-solid fa-exclamation-triangle mr-2"></i><strong>Don't over-optimize!</strong> useMemo and useCallback add overhead. Only use them when you notice performance issues. <strong>Profile first, optimize second!</strong></p>
          </div>
        `,
        defaultCode: `function ExpensiveDemo() {\n  const [count, setCount] = React.useState(0);\n  const [otherState, setOtherState] = React.useState(0);\n\n  // Simulate an expensive computation\n  const expensiveResult = React.useMemo(() => {\n    console.log('Running expensive calculation...');\n    let result = 0;\n    for (let i = 0; i < 1000000; i++) {\n      result += count * Math.random();\n    }\n    return Math.round(result);\n  }, [count]);\n\n  // Stable callback — same reference between renders\n  const incrementOther = React.useCallback(() => {\n    setOtherState(s => s + 1);\n  }, []);\n\n  return (\n    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>\n      <h2 style={{ color: '#1f2937' }}>Memoization Demo</h2>\n      <p style={{ color: '#6b7280', fontSize: 14 }}>\n        Expensive result: <strong style={{ color: '#6366f1' }}>{expensiveResult}</strong>\n      </p>\n      <p style={{ color: '#6b7280', fontSize: 14 }}>\n        Check the console — calculation only runs when count changes!\n      </p>\n      <button onClick={() => setCount(c => c + 1)}\n        style={{ padding: '8px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', margin: 4 }}>\n        Change Count ({count})\n      </button>\n      <button onClick={incrementOther}\n        style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: 6, cursor: 'pointer', margin: 4 }}>\n        Other State ({otherState} — no recalculation)\n      </button>\n    </div>\n  );\n}\n\nReactDOM.render(<ExpensiveDemo />, document.getElementById('root'));`,
      },
      // ── Lesson 3.4 ──
      {
        id: 'hooks-4',
        title: 'Custom Hooks',
        objectives: [
          'Extract reusable logic into custom hooks',
          'Build a useLocalStorage and useFetch hook',
          'Understand the naming convention (useXxx)',
        ],
        takeaways: [
          'Custom hooks let you reuse stateful logic across components',
          'A custom hook is a function that starts with "use" and may call other hooks',
          'Custom hooks can use other hooks internally',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Building Your Own Hooks</h3>
          <p class="mb-4 text-gray-700 leading-relaxed"><strong>Custom Hooks</strong> are the mechanism for reusing stateful logic in React. Unlike components, custom hooks don't render anything — they let you share logic across components.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">A custom hook is simply a JavaScript function whose name starts with <code>use</code> and that may call other hooks. It follows the same rules as any hook — it must be called at the top level of a component or another custom hook.</p>

          <div class="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-indigo-800 mb-2">Common Custom Hook Ideas</h4>
            <ul class="space-y-2 text-sm text-indigo-700">
              <li><code>useWindowSize</code> — track browser window dimensions</li>
              <li><code>useLocalStorage</code> — sync state with localStorage</li>
              <li><code>useDebounce</code> — debounce a rapidly changing value</li>
              <li><code>useFetch</code> — data fetching with loading/error states</li>
              <li><code>useOnlineStatus</code> — track navigator.onLine</li>
            </ul>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-400 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Tip:</strong> When you see the same logic repeated across components, it's time to extract it into a custom hook. Start small and refactor incrementally!</p>
          </div>
        `,
        defaultCode: `// Custom hook: syncs state with localStorage\nfunction useLocalStorage(key, initialValue) {\n  const [storedValue, setStoredValue] = React.useState(() => {\n    try {\n      const item = window.localStorage.getItem(key);\n      return item ? JSON.parse(item) : initialValue;\n    } catch {\n      return initialValue;\n    }\n  });\n\n  const setValue = (value) => {\n    const valueToStore = value instanceof Function ? value(storedValue) : value;\n    setStoredValue(valueToStore);\n    try {\n      window.localStorage.setItem(key, JSON.stringify(valueToStore));\n    } catch { /* quota exceeded */ }\n  };\n\n  return [storedValue, setValue];\n}\n\nfunction App() {\n  const [name, setName] = useLocalStorage('name', '');\n  const [theme, setTheme] = useLocalStorage('theme', 'light');\n\n  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');\n\n  const styles = {\n    container: {\n      padding: 24, fontFamily: 'sans-serif',\n      maxWidth: 400, margin: '0 auto',\n      background: theme === 'dark' ? '#1f2937' : 'white',\n      borderRadius: 16, color: theme === 'dark' ? '#f3f4f6' : '#1f2937',\n      transition: 'all 0.3s'\n    },\n    input: {\n      padding: 8, borderRadius: 6, border: '1px solid #d1d5db',\n      width: '100%', fontSize: 14, marginBottom: 12\n    },\n    button: {\n      padding: '8px 16px', borderRadius: 6, border: 'none',\n      cursor: 'pointer', fontWeight: 'bold',\n      background: theme === 'dark' ? '#6366f1' : '#818cf8',\n      color: 'white'\n    }\n  };\n\n  return (\n    <div style={styles.container}>\n      <h2 style={{ marginTop: 0 }}>useLocalStorage Demo</h2>\n      <input\n        value={name}\n        onChange={e => setName(e.target.value)}\n        placeholder=\"Enter name (saved to localStorage)\"\n        style={styles.input}\n      />\n      <p style={{ fontSize: 14 }}>Saved: <strong>{name || '—'}</strong></p>\n      <button onClick={toggleTheme} style={styles.button}>\n        Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode\n      </button>\n      <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>\n        Refresh the page — your data persists!\n      </p>\n    </div>\n  );\n}\n\nReactDOM.render(<App />, document.getElementById('root'));`,
      },
      // ── Lesson 3.5 ──
      {
        id: 'hooks-5',
        title: 'Rules of Hooks',
        objectives: [
          'Understand the two Rules of Hooks',
          'Learn why hooks rely on call order',
          'Use ESLint plugin to enforce rules automatically',
        ],
        takeaways: [
          'Only call hooks at the top level of your component',
          'Only call hooks from React functions (components or custom hooks)',
          'The eslint-plugin-react-hooks plugin catches violations',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">The Rules That Keep Hooks Working</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Hooks have two essential rules. These aren't suggestions — they are fundamental to how React tracks and manages hook state across renders.</p>

          <div class="grid md:grid-cols-2 gap-4 my-6">
            <div class="bg-rose-50 border border-rose-200 rounded-xl p-5">
              <h4 class="font-bold text-rose-800 flex items-center gap-2"><i class="fa-solid fa-arrow-up-wide-short"></i> Rule 1: Top Level Only</h4>
              <p class="text-rose-700 text-sm mt-1">Don't call Hooks inside loops, conditions, or nested functions. React relies on the order in which Hooks are called — breaking the order breaks state tracking.</p>
            </div>
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h4 class="font-bold text-blue-800 flex items-center gap-2"><i class="fa-solid fa-cube"></i> Rule 2: Only in React Functions</h4>
              <p class="text-blue-700 text-sm mt-1">Call Hooks from React function components or custom Hooks. Don't call them from regular JavaScript functions or class components.</p>
            </div>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-400 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Why the order matters:</strong> React uses a linked list internally, tracking hooks by their call position. If you put <code>useState</code> inside an <code>if</code> block, the list shifts and React thinks your state is now a ref or an effect!</p>
          </div>

          <div class="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-5">
            <h4 class="font-bold text-teal-800 mb-2">✅ Do This</h4>
            <pre class="text-xs text-teal-700 bg-white p-3 rounded-lg">function Good() {\n  const [a] = useState(1);  // Position 1\n  const [b] = useState(2);  // Position 2\n  useEffect(() => {}, []);   // Position 3\n  // ...\n}</pre>
            <h4 class="font-bold text-rose-800 mb-2 mt-3">❌ Don't Do This</h4>
            <pre class="text-xs text-rose-700 bg-white p-3 rounded-lg">function Bad() {\n  if (condition) {\n    const [a] = useState(1); // Shifts positions!\n  }\n  useEffect(() => {}, []);    // React gets confused\n}</pre>
          </div>
        `,
        defaultCode: `// This demonstrates the Rules of Hooks correctly\n// All hooks are at the top level, called in the same order every render\n\nfunction CounterWithWarning() {\n  const [count, setCount] = React.useState(0);   // Position 1\n  const [step, setStep] = React.useState(1);      // Position 2\n\n  React.useEffect(() => {                           // Position 3\n    document.title = \`Count: \${count}\`;\n  }, [count]);\n\n  // Notice: no hooks inside if/for/while!\n  const increment = () => setCount(c => c + step);\n  const decrement = () => setCount(c => c - step);\n\n  return (\n    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 350, margin: '0 auto', textAlign: 'center' }}>\n      <h2 style={{ color: '#1f2937' }}>Hook Rules Demo</h2>\n      <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#6366f1', margin: 16 }}>{count}</div>\n      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>\n        <button onClick={decrement} style={{ padding: '8px 16px', background: '#fee2e2', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', color: '#dc2626' }}>-</button>\n        <button onClick={increment} style={{ padding: '8px 16px', background: '#dcfce7', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', color: '#16a34a' }}>+</button>\n      </div>\n      <div style={{ fontSize: 14, color: '#6b7280' }}>\n        Step:\n        <select value={step} onChange={e => setStep(Number(e.target.value))} style={{ marginLeft: 8, padding: 4, borderRadius: 4 }}>\n          <option value={1}>1</option>\n          <option value={5}>5</option>\n          <option value={10}>10</option>\n        </select>\n      </div>\n      <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 12 }}>\n        ✓ All hooks at top level — no conditional hook calls!\n      </p>\n    </div>\n  );\n}\n\nReactDOM.render(<CounterWithWarning />, document.getElementById('root'));`,
      },
    ],
    quiz: [
      {
        id: 'q-hooks-1',
        question: 'Where must hooks be called?',
        options: ['Inside loops and conditions', 'At the top level of a React component', 'Inside regular JavaScript functions', 'Only in class components'],
        correct: 1,
      },
      {
        id: 'q-hooks-2',
        question: 'What does useEffect return when you need to clean up?',
        options: ['A boolean', 'A promise', 'A cleanup function', 'Nothing'],
        correct: 2,
      },
      {
        id: 'q-hooks-3',
        question: 'What happens when you change ref.current?',
        options: ['Component re-renders', 'Nothing — no re-render is triggered', 'React throws an error', 'The ref is reset'],
        correct: 1,
      },
      {
        id: 'q-hooks-4',
        question: 'What is the best use case for useMemo?',
        options: ['Every computed value', 'Expensive computations that should be cached', 'Caching API responses', 'Storing user input'],
        correct: 1,
      },
      {
        id: 'q-hooks-5',
        question: 'When should you NOT use useCallback?',
        options: ['When passing callbacks to optimized children', 'For every function in the component', 'When the function has stable dependencies', 'When you want to memoize a function'],
        correct: 1,
      },
    ],
  },

  // ─── MODULE 4: EVENTS & FORMS ───────────────────────────
  {
    id: 'events-forms',
    title: 'Events & Forms',
    lessons: [
      // ── Lesson 4.1 ──
      {
        id: 'events-1',
        title: 'Event Handling in React',
        objectives: [
          'Understand React\'s synthetic event system',
          'Handle common events: onClick, onChange, onSubmit',
          'Pass event handler functions vs calling them',
        ],
        takeaways: [
          'React events are named in camelCase (onClick, onChange)',
          'Pass a function reference, not a function call',
          'The event object is synthetic — optimized for cross-browser consistency',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Handling Events the React Way</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">React events are named using <strong>camelCase</strong> rather than lowercase. In HTML you write <code>onclick</code>, in React you write <code>onClick</code>. You pass a function reference, not a string.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">React's event system uses <strong>synthetic events</strong> — a cross-browser wrapper around the browser's native event. Synthetic events have the same interface as native events but work identically in all browsers.</p>

          <table class="w-full text-sm my-6 bg-white rounded-xl overflow-hidden shadow-sm">
            <thead><tr class="bg-gray-50 text-gray-600"><th class="p-3 text-left">Event</th><th class="p-3 text-left">Fires When...</th></tr></thead>
            <tbody class="divide-y divide-gray-100">
              <tr><td class="p-3 font-mono text-indigo-600">onClick</td><td class="p-3 text-gray-700">Element is clicked</td></tr>
              <tr><td class="p-3 font-mono text-indigo-600">onChange</td><td class="p-3 text-gray-700">Input value changes</td></tr>
              <tr><td class="p-3 font-mono text-indigo-600">onSubmit</td><td class="p-3 text-gray-700">Form is submitted</td></tr>
              <tr><td class="p-3 font-mono text-indigo-600">onFocus</td><td class="p-3 text-gray-700">Element receives focus</td></tr>
              <tr><td class="p-3 font-mono text-indigo-600">onKeyDown</td><td class="p-3 text-gray-700">A key is pressed</td></tr>
            </tbody>
          </table>

          <div class="bg-orange-50 border-l-4 border-orange-400 p-4 my-6 rounded-r-lg">
            <p class="text-orange-800 font-medium"><i class="fa-solid fa-exclamation-triangle mr-2"></i><strong>Gotcha:</strong> <code>onClick={handleClick()}</code> calls the function <strong>during render</strong>, not when clicked. Pass the function reference: <code>onClick={handleClick}</code>. Use <code>onClick={() => handleClick()}</code> if you need to pass arguments.</p>
          </div>
        `,
        defaultCode: `function EventDemo() {\n  const [lastEvent, setLastEvent] = React.useState('');\n  const [clickCount, setClickCount] = React.useState(0);\n  const [inputValue, setInputValue] = React.useState('');\n\n  const handleClick = (e) => {\n    setClickCount(c => c + 1);\n    setLastEvent('Button clicked!');\n    console.log('Event type:', e.type);\n    console.log('Target:', e.target);\n  };\n\n  const handleChange = (e) => {\n    setInputValue(e.target.value);\n    setLastEvent('Input changed');\n  };\n\n  const handleKeyDown = (e) => {\n    if (e.key === 'Enter') {\n      setLastEvent('Enter pressed!');\n    }\n  };\n\n  return (\n    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 400, margin: '0 auto' }}>\n      <h2 style={{ color: '#1f2937', marginTop: 0 }}>Event Explorer</h2>\n      <button onClick={handleClick}\n        style={{ padding: '10px 20px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', marginBottom: 12 }}>\n        Click Me ({clickCount})\n      </button>\n      <input\n        value={inputValue}\n        onChange={handleChange}\n        onKeyDown={handleKeyDown}\n        placeholder=\"Type and press Enter...\"\n        style={{ padding: 10, border: '1px solid #d1d5db', borderRadius: 8, width: '100%', fontSize: 14, marginBottom: 12 }}\n      />\n      <div style={{ padding: 12, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', fontSize: 14 }}>\n        <strong>Last Event:</strong> {lastEvent || '—'}\n      </div>\n    </div>\n  );\n}\n\nReactDOM.render(<EventDemo />, document.getElementById('root'));`,
      },
      // ── Lesson 4.2 ──
      {
        id: 'events-2',
        title: 'Controlled Components & Forms',
        objectives: [
          'Build controlled form components with state',
          'Handle form submission and prevent default behavior',
          'Manage multiple input types (text, select, checkbox, radio)',
        ],
        takeaways: [
          'Controlled components use state as the "single source of truth"',
          'useState + onChange + value = controlled component pattern',
          'Forms use onSubmit to handle submission predictably',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Controlled Forms</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">In HTML, form elements like <code>&lt;input&gt;</code>, <code>&lt;textarea&gt;</code>, and <code>&lt;select&gt;</code> maintain their own state. In React, you can put that state under React's control using <strong>controlled components</strong>.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">The pattern is simple: the component's <code>useState</code> provides the <code>value</code> for the input, and an <code>onChange</code> handler updates the state. React always has the source of truth, and the input always reflects React's state.</p>

          <div class="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-indigo-800 mb-2">Controlled Component Pattern</h4>
            <pre class="text-xs text-indigo-700 bg-white p-3 rounded-lg">const [value, setValue] = useState('');\n&lt;input value={value} onChange={e => setValue(e.target.value)} /&gt;</pre>
            <p class="text-xs text-indigo-600 mt-2">State → Input (value), Input → State (onChange). Round trip!</p>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-400 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Tip:</strong> For checkboxes and radios, use <code>checked</code> instead of <code>value</code>. For select dropdowns, set <code>value</code> on the <code>&lt;select&gt;</code> element, not individual <code>&lt;option&gt;</code> elements.</p>
          </div>
        `,
        defaultCode: `function RegistrationForm() {\n  const [form, setForm] = React.useState({\n    name: '',\n    email: '',\n    role: 'developer',\n    newsletter: true\n  });\n\n  const updateField = (field, value) => {\n    setForm(prev => ({ ...prev, [field]: value }));\n  };\n\n  const handleSubmit = (e) => {\n    e.preventDefault();\n    console.log('Form submitted:', form);\n    alert(JSON.stringify(form, null, 2));\n  };\n\n  const inputStyle = { padding: 8, border: '1px solid #d1d5db', borderRadius: 6, width: '100%', fontSize: 14 };\n  const labelStyle = { display: 'block', fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 };\n\n  return (\n    <form onSubmit={handleSubmit} style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 400, margin: '0 auto', background: '#f9fafb', borderRadius: 16 }}>\n      <h2 style={{ margin: '0 0 20px', color: '#1f2937' }}>Registration</h2>\n      \n      <div style={{ marginBottom: 16 }}>\n        <label style={labelStyle}>Name</label>\n        <input value={form.name} onChange={e => updateField('name', e.target.value)} style={inputStyle} />\n      </div>\n      \n      <div style={{ marginBottom: 16 }}>\n        <label style={labelStyle}>Email</label>\n        <input type=\"email\" value={form.email} onChange={e => updateField('email', e.target.value)} style={inputStyle} />\n      </div>\n      \n      <div style={{ marginBottom: 16 }}>\n        <label style={labelStyle}>Role</label>\n        <select value={form.role} onChange={e => updateField('role', e.target.value)} style={inputStyle}>\n          <option value=\"developer\">Developer</option>\n          <option value=\"designer\">Designer</option>\n          <option value=\"manager\">Manager</option>\n        </select>\n      </div>\n      \n      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, marginBottom: 20, color: '#374151' }}>\n        <input type=\"checkbox\" checked={form.newsletter} onChange={e => updateField('newsletter', e.target.checked)} />\n        Subscribe to newsletter\n      </label>\n      \n      <button type=\"submit\" style={{ padding: '10px 24px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>\n        Submit\n      </button>\n    </form>\n  );\n}\n\nReactDOM.render(<RegistrationForm />, document.getElementById('root'));`,
      },
      // ── Lesson 4.3 ──
      {
        id: 'events-3',
        title: 'Form Validation',
        objectives: [
          'Implement client-side form validation',
          'Display error messages for each field',
          'Use computed validation state for submit button',
        ],
        takeaways: [
          'Validate input on change or on blur for real-time feedback',
          'Derived state is perfect for validation — compute it during render',
          'Show error messages inline near the relevant field',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Validating Form Input</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Form validation is essential for good UX. React makes validation straightforward because your form state is always available in JavaScript. You can validate on every keystroke, on blur, or only when the form is submitted.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">The key insight is <strong>derived state</strong> — your validation errors and submit button state can all be computed from the form state during render. No need for separate error state variables!</p>

          <div class="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-amber-800 mb-2">Common Validation Patterns</h4>
            <ul class="space-y-2 text-sm text-amber-700">
              <li><strong>Required:</strong> <code>!value && 'This field is required'</code></li>
              <li><strong>Email format:</strong> <code>/^\\S+@\\S+$/</code></li>
              <li><strong>Min length:</strong> <code>value.length < 3</code></li>
              <li><strong>Match:</strong> <code>password !== confirmPassword</code></li>
            </ul>
          </div>
        `,
        defaultCode: `function ValidatedForm() {\n  const [form, setForm] = React.useState({ email: '', password: '', confirm: '' });\n  const [touched, setTouched] = React.useState({});\n\n  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));\n  const blur = (field) => setTouched(t => ({ ...t, [field]: true }));\n\n  // Derived validation state\n  const errors = {\n    email: !form.email ? 'Email is required' :\n           !/^\\S+@\\S+\\.\\S+$/.test(form.email) ? 'Invalid email format' : '',\n    password: form.password.length < 6 ? 'Password must be at least 6 characters' : '',\n    confirm: form.confirm !== form.password ? 'Passwords do not match' : '',\n  };\n\n  const isValid = Object.values(errors).every(e => !e);\n\n  const inputStyle = (field) => ({\n    padding: 8, border: '1px solid',\n    borderColor: touched[field] && errors[field] ? '#ef4444' : '#d1d5db',\n    borderRadius: 6, width: '100%', fontSize: 14, outline: 'none'\n  });\n\n  const labelStyle = { display: 'block', fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 };\n\n  return (\n    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 400, margin: '0 auto' }}>\n      <h2 style={{ margin: '0 0 20px', color: '#1f2937' }}>Validated Form</h2>\n      \n      <div style={{ marginBottom: 16 }}>\n        <label style={labelStyle}>Email</label>\n        <input value={form.email} onChange={e => update('email', e.target.value)} onBlur={() => blur('email')} style={inputStyle('email')} />\n        {touched.email && errors.email && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{errors.email}</p>}\n      </div>\n      \n      <div style={{ marginBottom: 16 }}>\n        <label style={labelStyle}>Password</label>\n        <input type=\"password\" value={form.password} onChange={e => update('password', e.target.value)} onBlur={() => blur('password')} style={inputStyle('password')} />\n        {touched.password && errors.password && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{errors.password}</p>}\n      </div>\n      \n      <div style={{ marginBottom: 20 }}>\n        <label style={labelStyle}>Confirm Password</label>\n        <input type=\"password\" value={form.confirm} onChange={e => update('confirm', e.target.value)} onBlur={() => blur('confirm')} style={inputStyle('confirm')} />\n        {touched.confirm && errors.confirm && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{errors.confirm}</p>}\n      </div>\n      \n      <button disabled={!isValid} style={{\n        padding: '10px 24px', width: '100%', border: 'none', borderRadius: 8,\n        cursor: isValid ? 'pointer' : 'not-allowed', fontWeight: 'bold',\n        background: isValid ? '#6366f1' : '#c7d2fe', color: isValid ? 'white' : '#a5b4fc'\n      }}>\n        {isValid ? 'Create Account' : 'Fix Errors'}\n      </button>\n    </div>\n  );\n}\n\nReactDOM.render(<ValidatedForm />, document.getElementById('root'));`,
      },
      // ── Lesson 4.4 ──
      {
        id: 'events-4',
        title: 'Uncontrolled Components & Refs',
        objectives: [
          'Understand when to use uncontrolled components',
          'Use refs to access form values on demand',
          'Compare controlled vs uncontrolled approaches',
        ],
        takeaways: [
          'Uncontrolled components store their own state in the DOM',
          'Use useRef to read values when needed (e.g., on submit)',
          'File inputs ALWAYS require uncontrolled components',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">When React Steps Back</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Sometimes you don't need React to control every keystroke. For simple forms where you only care about the final value, <strong>uncontrolled components</strong> are simpler. The DOM manages the input state, and you read it with a ref when needed.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">The <code>&lt;input type="file"&gt;</code> is always uncontrolled — for security reasons, you can't programmatically set its value. You always use a ref to read the selected file.</p>

          <div class="grid md:grid-cols-2 gap-4 my-6">
            <div class="bg-sky-50 border border-sky-200 rounded-xl p-5">
              <h4 class="font-bold text-sky-800 text-sm">Controlled</h4>
              <ul class="text-xs text-sky-700 mt-2 space-y-1">
                <li>✅ React controls the value</li>
                <li>✅ Instant validation per keystroke</li>
                <li>✅ Easier to reset form fields</li>
                <li>❌ More code for simple forms</li>
              </ul>
            </div>
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h4 class="font-bold text-amber-800 text-sm">Uncontrolled</h4>
              <ul class="text-xs text-amber-700 mt-2 space-y-1">
                <li>✅ DOM controls the value</li>
                <li>✅ Less code for simple forms</li>
                <li>✅ Easier to integrate with non-React code</li>
                <li>❌ Cannot read value until you manually access it</li>
              </ul>
            </div>
          </div>
        `,
        defaultCode: `function SimpleForm() {\n  const nameRef = React.useRef(null);\n  const emailRef = React.useRef(null);\n  const fileRef = React.useRef(null);\n  const [submitted, setSubmitted] = React.useState(null);\n\n  const handleSubmit = (e) => {\n    e.preventDefault();\n    setSubmitted({\n      name: nameRef.current.value,\n      email: emailRef.current.value,\n      file: fileRef.current.files[0]?.name || 'No file selected'\n    });\n  };\n\n  return (\n    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 400, margin: '0 auto' }}>\n      <h2 style={{ margin: '0 0 20px', color: '#1f2937' }}>Uncontrolled Form</h2>\n      <form onSubmit={handleSubmit}>\n        <div style={{ marginBottom: 16 }}>\n          <label style={{ display: 'block', fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>Name</label>\n          <input ref={nameRef} defaultValue=\"\" placeholder=\"Enter name\" style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 6, width: '100%', fontSize: 14 }} />\n        </div>\n        <div style={{ marginBottom: 16 }}>\n          <label style={{ display: 'block', fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>Email</label>\n          <input ref={emailRef} defaultValue=\"\" placeholder=\"Enter email\" style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 6, width: '100%', fontSize: 14 }} />\n        </div>\n        <div style={{ marginBottom: 20 }}>\n          <label style={{ display: 'block', fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>Avatar</label>\n          <input ref={fileRef} type=\"file\" style={{ fontSize: 14 }} />\n        </div>\n        <button type=\"submit\" style={{ padding: '10px 24px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>\n          Submit (Read from DOM)\n        </button>\n      </form>\n      {submitted && (\n        <div style={{ marginTop: 20, padding: 16, background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', fontSize: 14 }}>\n          <h4 style={{ margin: '0 0 8px', color: '#16a34a' }}>Submitted Data</h4>\n          <p style={{ margin: '2px 0' }}>Name: <strong>{submitted.name}</strong></p>\n          <p style={{ margin: '2px 0' }}>Email: <strong>{submitted.email}</strong></p>\n          <p style={{ margin: '2px 0' }}>File: <strong>{submitted.file}</strong></p>\n        </div>\n      )}\n    </div>\n  );\n}\n\nReactDOM.render(<SimpleForm />, document.getElementById('root'));`,
      },
    ],
    quiz: [
      {
        id: 'q-events-1',
        question: 'How do you pass an event handler in JSX?',
        options: ['onClick="handleClick()"', 'onClick={handleClick}', 'onclick={handleClick}', 'onClick={handleClick()}'],
        correct: 1,
      },
      {
        id: 'q-events-2',
        question: 'What does preventDefault() do on a form submit event?',
        options: ['Prevents the form from rendering', 'Prevents the browser from reloading the page', 'Prevents validation', 'Prevents state updates'],
        correct: 1,
      },
      {
        id: 'q-events-3',
        question: 'What pattern defines a controlled component?',
        options: ['useRef + defaultValue', 'useState + value + onChange', 'querySelector + addEventListener', 'useEffect to sync DOM'],
        correct: 1,
      },
      {
        id: 'q-events-4',
        question: 'Which input type always requires an uncontrolled component?',
        options: ['text', 'email', 'file', 'password'],
        correct: 2,
      },
    ],
  },

  // ─── MODULE 5: CONTEXT API & USEREDUCER ─────────────────
  {
    id: 'context-reducer',
    title: 'Context API & useReducer',
    lessons: [
      // ── Lesson 5.1 ──
      {
        id: 'context-1',
        title: 'Context API',
        objectives: [
          'Understand the Context API for avoiding prop drilling',
          'Create context with createContext and provide with Provider',
          'Consume context with useContext Hook',
        ],
        takeaways: [
          'Context provides a way to share values across the component tree',
          'createContext + Provider + useContext = the Context pattern',
          'Use context for "global" data like themes, auth, language settings',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Avoiding Prop Drilling</h3>
          <p class="mb-4 text-gray-700 leading-relaxed"><strong>Prop drilling</strong> is when you pass props through multiple levels of components just to get data to a deeply nested component. The intermediate components don't need the data — they just pass it down.</p>
          <p class="mb-4 text-gray-700 leading-relaxed"><strong>Context</strong> solves this. It lets a parent provide data to any component in its subtree, regardless of how deep, without passing props through every level.</p>

          <div class="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-indigo-800 mb-2">The Three Steps</h4>
            <ol class="space-y-2 text-sm text-indigo-700">
              <li><strong>Create</strong> — <code>const ThemeContext = createContext('light')</code></li>
              <li><strong>Provide</strong> — <code>&lt;ThemeContext.Provider value="dark"&gt;...&lt;/ThemeContext.Provider&gt;</code></li>
              <li><strong>Consume</strong> — <code>const theme = useContext(ThemeContext)</code></li>
            </ol>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-400 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Tip:</strong> Don't use context for everything! If you only need to pass data one or two levels down, regular props are simpler. Context shines for <strong>globally needed</strong> data like themes, auth, locale, and current user.</p>
          </div>
        `,
        defaultCode: `// Create context\nconst ThemeContext = React.createContext('light');\n\nfunction ThemedCard() {\n  const theme = React.useContext(ThemeContext);\n  const isDark = theme === 'dark';\n\n  return (\n    <div style={{\n      padding: 24, fontFamily: 'sans-serif',\n      maxWidth: 320, margin: '16px auto',\n      background: isDark ? '#1f2937' : 'white',\n      color: isDark ? '#f3f4f6' : '#1f2937',\n      borderRadius: 16,\n      border: '1px solid',\n      borderColor: isDark ? '#374151' : '#e5e7eb',\n      transition: 'all 0.3s',\n      textAlign: 'center'\n    }}>\n      <h3 style={{ margin: '0 0 8px' }}>Themed Card</h3>\n      <p style={{ fontSize: 14, opacity: 0.8 }}>\n        Current theme: <strong>{theme}</strong>\n      </p>\n      <p style={{ fontSize: 12, opacity: 0.6 }}>\n        I get my theme from context — no prop drilling needed!\n      </p>\n    </div>\n  );\n}\n\nfunction ThemeToggle() {\n  const theme = React.useContext(ThemeContext);\n  return (\n    <div style={{ maxWidth: 320, margin: '0 auto', textAlign: 'center' }}>\n      <p style={{ fontFamily: 'sans-serif', fontSize: 14, color: '#6b7280', marginBottom: 8 }}>\n        Theme is controlled by context. Click to toggle!\n      </p>\n    </div>\n  );\n}\n\nfunction App() {\n  const [theme, setTheme] = React.useState('light');\n  return (\n    <ThemeContext.Provider value={theme}>\n      <ThemeToggle />\n      <ThemedCard />\n      <div style={{ textAlign: 'center' }}>\n        <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}\n          style={{ padding: '10px 24px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', marginTop: 8 }}>\n          Toggle to {theme === 'light' ? 'Dark' : 'Light'}\n        </button>\n      </div>\n    </ThemeContext.Provider>\n  );\n}\n\nReactDOM.render(<App />, document.getElementById('root'));`,
      },
      // ── Lesson 5.2 ──
      {
        id: 'context-2',
        title: 'useReducer for Complex State',
        objectives: [
          'Understand the reducer pattern (state + action = newState)',
          'Use useReducer for complex state logic',
          'Compare useReducer vs useState',
        ],
        takeaways: [
          'useReducer is great for state with multiple sub-values or complex transitions',
          'A reducer is a pure function: (state, action) => newState',
          'useReducer returns [state, dispatch] — dispatch sends actions',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Reducers for Predictable State</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">When your state logic becomes complex — multiple sub-values, many ways to update, or dependencies between state changes — <code>useReducer</code> is a more structured alternative to <code>useState</code>.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">A <strong>reducer</strong> is a pure function that takes the current state and an action, and returns the next state. Actions are objects with a <code>type</code> property (and optionally a <code>payload</code>).</p>

          <div class="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-amber-800 mb-2">useState vs useReducer</h4>
            <table class="w-full text-xs text-amber-700 bg-white rounded-lg overflow-hidden">
              <thead><tr class="bg-amber-50"><th class="p-2 text-left">useState</th><th class="p-2 text-left">useReducer</th></tr></thead>
              <tbody>\n                <tr><td class="p-2">Simple state (number, string, boolean)</td><td class="p-2">Complex state (objects, arrays)</td></tr>\n                <tr><td class="p-2">1-2 related state variables</td><td class="p-2">Multiple related sub-values</td></tr>\n                <tr><td class="p-2">Direct updates via setter</td><td class="p-2">Action-based updates via dispatch</td></tr>\n              </tbody>
            </table>
          </div>
        `,
        defaultCode: `// Reducer function\nfunction counterReducer(state, action) {\n  switch (action.type) {\n    case 'INCREMENT':\n      return { ...state, count: state.count + state.step };\n    case 'DECREMENT':\n      return { ...state, count: state.count - state.step };\n    case 'SET_STEP':\n      return { ...state, step: action.payload };\n    case 'RESET':\n      return { count: 0, step: 1 };\n    default:\n      return state;\n  }\n}\n\nfunction CounterWithReducer() {\n  const [state, dispatch] = React.useReducer(counterReducer, { count: 0, step: 1 });\n\n  return (\n    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 350, margin: '0 auto', textAlign: 'center' }}>\n      <h2 style={{ color: '#1f2937' }}>useReducer Demo</h2>\n      <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#6366f1', margin: '16px 0' }}>\n        {state.count}\n      </div>\n      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>\n        <button onClick={() => dispatch({ type: 'DECREMENT' })}\n          style={{ padding: '10px 20px', background: '#fee2e2', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', color: '#dc2626' }}>\n          -{state.step}\n        </button>\n        <button onClick={() => dispatch({ type: 'RESET' })}\n          style={{ padding: '10px 20px', background: '#fef3c7', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>\n          Reset\n        </button>\n        <button onClick={() => dispatch({ type: 'INCREMENT' })}\n          style={{ padding: '10px 20px', background: '#dcfce7', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', color: '#16a34a' }}>\n          +{state.step}\n        </button>\n      </div>\n      <div>\n        <label style={{ fontSize: 14, color: '#6b7280' }}>\n          Step:\n          <input type=\"number\" value={state.step} min={1} max={10}\n            onChange={e => dispatch({ type: 'SET_STEP', payload: Number(e.target.value) })}\n            style={{ marginLeft: 8, padding: 4, borderRadius: 4, border: '1px solid #d1d5db', width: 60, textAlign: 'center' }}\n          />\n        </label>\n      </div>\n    </div>\n  );\n}\n\nReactDOM.render(<CounterWithReducer />, document.getElementById('root'));`,
      },
      // ── Lesson 5.3 ──
      {
        id: 'context-3',
        title: 'Combining Context & useReducer',
        objectives: [
          'Combine useReducer with Context for global state',
          'Build a simple state management pattern without external libraries',
          'Understand the Provider/dispatch pattern',
        ],
        takeaways: [
          'Context + useReducer = lightweight state management',
          'Provider passes state and dispatch via context',
          'Components read state and dispatch actions anywhere in the tree',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Mini Redux with Built-in Tools</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Combining <code>useReducer</code> (for state logic) with <code>Context</code> (for distribution) gives you a <strong>lightweight state management</strong> pattern that works for many apps without needing Redux or Zustand.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">A Provider component wraps your app, creates the reducer state + dispatch, and exposes them through two contexts (one for state, one for dispatch). Components consume what they need.</p>

          <div class="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-indigo-800 mb-2">Architecture</h4>
            <div class="flex items-center justify-center gap-4 text-sm text-indigo-700 bg-white p-4 rounded-lg">
              <span class="px-3 py-1 bg-indigo-100 rounded">🧩 Component A</span>
              <span class="text-indigo-300">→</span>
              <span class="px-3 py-1 bg-purple-100 rounded font-semibold">dispatch({'{type: "ADD"}'})</span>
              <span class="text-indigo-300">→</span>
              <span class="px-3 py-1 bg-indigo-100 rounded">⚙️ Reducer</span>
              <span class="text-indigo-300">→</span>
              <span class="px-3 py-1 bg-green-100 rounded font-semibold">📦 New State</span>
            </div>
          </div>
        `,
        defaultCode: `// --- Reducer ---\nfunction todoReducer(state, action) {\n  switch (action.type) {\n    case 'ADD':\n      return [...state, { id: Date.now(), text: action.payload, done: false }];\n    case 'TOGGLE':\n      return state.map(t => t.id === action.payload ? { ...t, done: !t.done } : t);\n    case 'REMOVE':\n      return state.filter(t => t.id !== action.payload);\n    default:\n      return state;\n  }\n}\n\n// --- Contexts ---\nconst TodoContext = React.createContext(null);\nconst TodoDispatchContext = React.createContext(null);\n\nfunction TodoProvider({ children }) {\n  const [todos, dispatch] = React.useReducer(todoReducer, []);\n  return (\n    <TodoContext.Provider value={todos}>\n      <TodoDispatchContext.Provider value={dispatch}>\n        {children}\n      </TodoDispatchContext.Provider>\n    </TodoContext.Provider>\n  );\n}\n\nfunction AddTodo() {\n  const [text, setText] = React.useState('');\n  const dispatch = React.useContext(TodoDispatchContext);\n\n  const add = () => {\n    if (!text.trim()) return;\n    dispatch({ type: 'ADD', payload: text });\n    setText('');\n  };\n\n  return (\n    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>\n      <input value={text} onChange={e => setText(e.target.value)}\n        onKeyDown={e => e.key === 'Enter' && add()}\n        placeholder=\"Add a todo...\"\n        style={{ flex: 1, padding: 8, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}\n      />\n      <button onClick={add}\n        style={{ padding: '8px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>\n        Add\n      </button>\n    </div>\n  );\n}\n\nfunction TodoList() {\n  const todos = React.useContext(TodoContext);\n  const dispatch = React.useContext(TodoDispatchContext);\n\n  return (\n    <div>\n      {todos.length === 0 && <p style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', padding: 20 }}>No todos yet. Add one above!</p>}\n      {todos.map(todo => (\n        <div key={todo.id} style={{\n          display: 'flex', alignItems: 'center', justifyContent: 'space-between',\n          padding: '10px 14px', marginBottom: 6,\n          background: todo.done ? '#f0fdf4' : '#f9fafb',\n          borderRadius: 8, border: '1px solid #e5e7eb'\n        }}>\n          <span onClick={() => dispatch({ type: 'TOGGLE', payload: todo.id })}\n            style={{\n              textDecoration: todo.done ? 'line-through' : 'none',\n              color: todo.done ? '#16a34a' : '#374151',\n              cursor: 'pointer', fontSize: 14\n            }}>\n            {todo.done ? '✅ ' : '◻️ '}{todo.text}\n          </span>\n          <button onClick={() => dispatch({ type: 'REMOVE', payload: todo.id })}\n            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 16 }}>\n            ✕\n          </button>\n        </div>\n      ))}\n    </div>\n  );\n}\n\nfunction App() {\n  return (\n    <TodoProvider>\n      <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 400, margin: '0 auto' }}>\n        <h2 style={{ margin: '0 0 16px', color: '#1f2937' }}>Todolist (Context + Reducer)</h2>\n        <AddTodo />\n        <TodoList />\n      </div>\n    </TodoProvider>\n  );\n}\n\nReactDOM.render(<App />, document.getElementById('root'));`,
      },
      // ── Lesson 5.4 ──
      {
        id: 'context-4',
        title: 'Context Best Practices',
        objectives: [
          'Avoid over-rendering with context splitting',
          'Use multiple contexts for separate concerns',
          'Memoize context values to prevent unnecessary re-renders',
        ],
        takeaways: [
          'Split contexts by domain (auth, theme, data) to minimize re-renders',
          'Memoize provider values with useMemo to prevent cascading updates',
          'Context is not a replacement for all prop passing — use judiciously',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Using Context Effectively</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Context is powerful, but it comes with a warning: <strong>every consumer re-renders when the context value changes</strong>. This can cause performance issues if you put too much data in a single context.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">Best practices include <strong>splitting contexts</strong> by logical domain (separate AuthContext, ThemeContext, DataContext) and <strong>memoizing the provider value</strong> with <code>useMemo</code> to prevent re-renders when nothing actually changed.</p>

          <div class="grid md:grid-cols-2 gap-4 my-6">
            <div class="bg-teal-50 border border-teal-200 rounded-xl p-5">
              <h4 class="font-bold text-teal-800 text-sm">✅ Do: Split Contexts</h4>
              <pre class="text-xs text-teal-700 mt-2 bg-white p-3 rounded-lg">const ThemeContext = ...\nconst AuthContext = ...\nconst CartContext = ...</pre>
            </div>
            <div class="bg-rose-50 border border-rose-200 rounded-xl p-5">
              <h4 class="font-bold text-rose-800 text-sm">❌ Don't: One Giant Context</h4>
              <pre class="text-xs text-rose-700 mt-2 bg-white p-3 rounded-lg">const AppContext = ... // theme + auth + cart + settings + ...</pre>
            </div>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-400 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Tip:</strong> When passing an object literal as the context value, wrap it in <code>useMemo</code>. Otherwise, every render of the Provider creates a new object reference, causing ALL consumers to re-render even if the data hasn't changed!</p>
          </div>
        `,
        defaultCode: `// Best practice: separate contexts for separate concerns\nconst ThemeCtx = React.createContext({ theme: 'light', toggleTheme: () => {} });\nconst UserCtx = React.createContext({ user: null, login: () => {}, logout: () => {} });\n\nfunction ThemedButton() {\n  const { theme, toggleTheme } = React.useContext(ThemeCtx);\n  return (\n    <button onClick={toggleTheme}\n      style={{\n        padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer',\n        fontWeight: 'bold', transition: 'all 0.3s',\n        background: theme === 'dark' ? '#374151' : '#6366f1',\n        color: theme === 'dark' ? '#f3f4f6' : 'white',\n        marginBottom: 8\n      }}>\n      Current: {theme} — Click to toggle\n    </button>\n  );\n}\n\nfunction UserStatus() {\n  const { user, login, logout } = React.useContext(UserCtx);\n  return (\n    <div>\n      {user ? (\n        <div style={{ textAlign: 'center' }}>\n          <p style={{ fontFamily: 'sans-serif', fontSize: 14, color: '#374151' }}>\n            Welcome, <strong>{user}</strong>!\n          </p>\n          <button onClick={logout}\n            style={{ padding: '8px 16px', background: '#fee2e2', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', color: '#dc2626' }}>\n            Logout\n          </button>\n        </div>\n      ) : (\n        <div style={{ textAlign: 'center' }}>\n          <p style={{ fontFamily: 'sans-serif', fontSize: 14, color: '#6b7280' }}>You are not logged in.</p>\n          <button onClick={() => login('Demo User')}\n            style={{ padding: '8px 16px', background: '#dcfce7', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', color: '#16a34a' }}>\n            Login as Demo User\n          </button>\n        </div>\n      )}\n    </div>\n  );\n}\n\nfunction App() {\n  const [theme, setTheme] = React.useState('light');\n  const [user, setUser] = React.useState(null);\n\n  const themeValue = React.useMemo(() => ({\n    theme,\n    toggleTheme: () => setTheme(t => t === 'light' ? 'dark' : 'light')\n  }), [theme]);\n\n  const userValue = React.useMemo(() => ({\n    user,\n    login: (name) => setUser(name),\n    logout: () => setUser(null)\n  }), [user]);\n\n  return (\n    <ThemeCtx.Provider value={themeValue}>\n      <UserCtx.Provider value={userValue}>\n        <div style={{\n          padding: 24, fontFamily: 'sans-serif',\n          maxWidth: 350, margin: '0 auto',\n          background: theme === 'dark' ? '#1f2937' : 'white',\n          borderRadius: 16, color: theme === 'dark' ? '#f3f4f6' : '#1f2937',\n          transition: 'all 0.3s'\n        }}>\n          <h2 style={{ margin: '0 0 20px', textAlign: 'center' }}>Context Best Practices</h2>\n          <ThemedButton />\n          <UserStatus />\n          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 16, textAlign: 'center' }}>\n            Theme and user are in <strong>separate contexts</strong>.<br />\n            Changing theme doesn't re-render UserStatus, and vice versa!\n          </p>\n        </div>\n      </UserCtx.Provider>\n    </ThemeCtx.Provider>\n  );\n}\n\nReactDOM.render(<App />, document.getElementById('root'));`,
      },
    ],
    quiz: [
      {
        id: 'q-context-1',
        question: 'What is the main problem that Context API solves?',
        options: ['State management', 'Prop drilling', 'Routing', 'Component styling'],
        correct: 1,
      },
      {
        id: 'q-context-2',
        question: 'Which hook is used to consume a context value?',
        options: ['useState', 'useEffect', 'useContext', 'useReducer'],
        correct: 2,
      },
      {
        id: 'q-context-3',
        question: 'In useReducer, what does the reducer function return?',
        options: ['An action object', 'The dispatch function', 'The new state', 'A boolean'],
        correct: 2,
      },
      {
        id: 'q-context-4',
        question: 'What happens when a context value changes?',
        options: ['Nothing', 'All consumers re-render', 'Only the provider re-renders', 'Only the first consumer re-renders'],
        correct: 1,
      },
      {
        id: 'q-context-5',
        question: 'How can you prevent unnecessary re-renders when passing an object as context value?',
        options: ['Use React.memo on consumers', 'Memoize the object with useMemo', 'Split into multiple providers', 'Both B and C'],
        correct: 3,
      },
    ],
  },

  // ─── MODULE 6: COMPONENT PATTERNS ────────────────────────
  {
    id: 'patterns',
    title: 'Component Patterns',
    lessons: [
      // ── Lesson 6.1 ──
      {
        id: 'patterns-1',
        title: 'Higher-Order Components (HOCs)',
        objectives: [
          'Understand the HOC pattern: function that returns a component',
          'Use HOCs for cross-cutting concerns (auth, logging, data fetching)',
          'Learn the naming convention: withXxx',
        ],
        takeaways: [
          'An HOC is a function that takes a component and returns an enhanced component',
          'HOCs add functionality without modifying the original component',
          'Common uses: authentication guards, data providers, logging wrappers',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Enhancing Components with HOCs</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">A <strong>Higher-Order Component (HOC)</strong> is a function that takes a component and returns a new component with additional features. It's a pattern derived from React's compositional nature.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">HOCs are great for <strong>cross-cutting concerns</strong> — functionality that needs to be applied to many components, like authentication checks, logging, or data fetching. They separate concerns cleanly: the HOC handles the logic, the wrapped component handles the UI.</p>

          <div class="grid md:grid-cols-2 gap-4 my-6">
            <div class="bg-sky-50 border border-sky-200 rounded-xl p-5">
              <h4 class="font-bold text-sky-800 flex items-center gap-2"><i class="fa-solid fa-lock"></i> withAuth</h4>
              <p class="text-sky-700 text-xs mt-1">Checks auth before rendering the component. Redirects to login if not authenticated.</p>
            </div>
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h4 class="font-bold text-amber-800 flex items-center gap-2"><i class="fa-solid fa-scroll"></i> withLogging</h4>
              <p class="text-amber-700 text-xs mt-1">Logs component lifecycle events (mount, update, unmount) for debugging.</p>
            </div>
          </div>
        `,
        defaultCode: `// HOC: adds a loading spinner while data "loads"\nfunction withLoading(Component) {\n  return function WrappedComponent({ isLoading, ...props }) {\n    if (isLoading) {\n      return (\n        <div style={{ textAlign: 'center', padding: 40, fontFamily: 'sans-serif' }}>\n          <div style={{\n            width: 40, height: 40,\n            border: '4px solid #e5e7eb',\n            borderTopColor: '#6366f1',\n            borderRadius: '50%',\n            animation: 'spin 0.8s linear infinite',\n            margin: '0 auto 12px'\n          }}>\n            <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>\n          </div>\n          <p style={{ color: '#6b7280', fontSize: 14 }}>Loading...</p>\n        </div>\n      );\n    }\n    return <Component {...props} />;\n  };\n}\n\nfunction UserData({ name, email }) {\n  return (\n    <div style={{ padding: 20, fontFamily: 'sans-serif', maxWidth: 300, margin: '0 auto', background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb', textAlign: 'center' }}>\n      <div style={{ fontSize: 40, marginBottom: 8 }}>👤</div>\n      <h3 style={{ margin: '0 0 4px', color: '#1f2937' }}>{name}</h3>\n      <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>{email}</p>\n    </div>\n  );\n}\n\nconst UserDataWithLoading = withLoading(UserData);\n\nfunction App() {\n  const [loading, setLoading] = React.useState(true);\n\n  React.useEffect(() => {\n    const timer = setTimeout(() => setLoading(false), 2000);\n    return () => clearTimeout(timer);\n  }, []);\n\n  return (\n    <div>\n      <h2 style={{ textAlign: 'center', fontFamily: 'sans-serif', color: '#1f2937' }}>HOC: withLoading</h2>\n      <UserDataWithLoading\n        isLoading={loading}\n        name=\"Alice React\"\n        email=\"alice@example.com\"\n      />\n      <p style={{ textAlign: 'center', fontFamily: 'sans-serif', fontSize: 12, color: '#9ca3af', marginTop: 12 }}>\n        The HOC adds a loading spinner for 2 seconds, then renders the user data.\n      </p>\n    </div>\n  );\n}\n\nReactDOM.render(<App />, document.getElementById('root'));`,
      },
      // ── Lesson 6.2 ──
      {
        id: 'patterns-2',
        title: 'Render Props',
        objectives: [
          'Understand the render props pattern',
          'Share code between components using a function prop',
          'Compare render props vs HOCs',
        ],
        takeaways: [
          'Render props is a pattern where a component takes a function that returns JSX',
          'The component manages state/logic, the render function controls the UI',
          'Both HOCs and render props achieve similar goals but with different patterns',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Sharing Logic with Render Props</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">The term <strong>"render prop"</strong> refers to a technique for sharing code between React components using a prop whose value is a function that returns JSX.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">A component with a render prop takes a function that knows how to render something. The component handles the state and logic, and calls the render function with the data it needs. This gives you maximum flexibility in how the UI is rendered.</p>

          <div class="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-indigo-800 mb-2">The Pattern</h4>
            <pre class="text-xs text-indigo-700 bg-white p-3 rounded-lg">function MouseTracker({ render }) {\n  const [pos, setPos] = useState({ x: 0, y: 0 });\n  // ... handle mouse events ...\n  return render(pos);  // Calls the render function with position data\n}</pre>
            <p class="text-xs text-indigo-600 mt-2">The component provides the logic. The consumer provides the UI.</p>
          </div>
        `,
        defaultCode: `// Render Props pattern: the component manages state, consumer renders UI\nfunction MouseTracker({ render }) {\n  const [position, setPosition] = React.useState({ x: 0, y: 0 });\n\n  const handleMouseMove = (e) => {\n    setPosition({ x: e.clientX, y: e.clientY });\n  };\n\n  return (\n    <div onMouseMove={handleMouseMove}\n      style={{\n        width: '100%', height: 200,\n        background: '#f0f0ff', borderRadius: 16,\n        border: '2px dashed #c7d2fe',\n        position: 'relative', overflow: 'hidden',\n        cursor: 'crosshair'\n      }}>\n      {render(position)}\n    </div>\n  );\n}\n\nfunction App() {\n  return (\n    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 500, margin: '0 auto' }}>\n      <h2 style={{ color: '#1f2937', textAlign: 'center' }}>Render Props: Mouse Tracker</h2>\n      <p style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', marginBottom: 12 }}>\n        Move your mouse over the box below!\n      </p>\n      <MouseTracker render={(pos) => (\n        <>\n          {/* Custom cursor */}\n          <div style={{\n            position: 'absolute',\n            left: pos.x - 10, top: pos.y - 10,\n            width: 20, height: 20,\n            background: '#6366f1',\n            borderRadius: '50%',\n            opacity: 0.7,\n            pointerEvents: 'none',\n            transform: 'scale(1)',\n            transition: 'transform 0.1s'\n          }} />\n          {/* Coordinates display */}\n          <div style={{\n            position: 'absolute',\n            top: 10, right: 10,\n            background: 'rgba(255,255,255,0.9)',\n            padding: '8px 12px',\n            borderRadius: 8,\n            fontSize: 14, fontWeight: 'bold',\n            color: '#6366f1',\n            fontFamily: 'monospace'\n          }}>\n            X: {pos.x}, Y: {pos.y}\n          </div>\n        </>\n      )} />\n      <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>\n        The MouseTracker component provides coordinates via render prop.\n        The App decides what to draw at those coordinates!\n      </p>\n    </div>\n  );\n}\n\nReactDOM.render(<App />, document.getElementById('root'));`,
      },
      // ── Lesson 6.3 ──
      {
        id: 'patterns-3',
        title: 'Compound Components',
        objectives: [
          'Understand the compound component pattern',
          'Build a Menu or Tabs component with implicit state sharing',
          'Use Context for internal state in compound components',
        ],
        takeaways: [
          'Compound components work together while managing their own shared state',
          'They use Context to share state between parent and children implicitly',
          'Native HTML examples: <select> + <option>, <table> + <tr> + <td>',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Components that Work Together</h3>
          <p class="mb-4 text-gray-700 leading-relaxed"><strong>Compound components</strong> are a pattern where two or more components work together to accomplish a common task, sharing implicit state through context. Think of HTML's <code>&lt;select&gt;</code> and <code>&lt;option&gt;</code> — they're separate elements but work together.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">The parent (e.g., <code>&lt;Tabs&gt;</code>) manages state like which tab is active. The children (e.g., <code>&lt;Tabs.Panel&gt;</code>) read that state through context and render accordingly. The consumer of your component doesn't need to manage this state — it's handled internally.</p>

          <div class="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-amber-800 mb-2">Real-World Examples</h4>
            <ul class="space-y-2 text-sm text-amber-700">
              <li><strong>Tabs</strong> — Tabs container + Tab.Panel children</li>
              <li><strong>Menu</strong> — Menu + Menu.Item + Menu.Divider</li>
              <li><strong>Accordion</strong> — Accordion + Accordion.Section</li>
              <li><strong>Form</strong> — Form + Form.Field + Form.Error</li>
            </ul>
          </div>
        `,
        defaultCode: `// Compound components using Context\nconst TabsContext = React.createContext(null);\n\nfunction Tabs({ defaultActive, children }) {\n  const [active, setActive] = React.useState(defaultActive || 0);\n  return (\n    <TabsContext.Provider value={{ active, setActive }}>\n      {children}\n    </TabsContext.Provider>\n  );\n}\n\nTabs.List = function TabList({ children }) {\n  return (\n    <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '2px solid #e5e7eb', paddingBottom: 0 }}>\n      {children}\n    </div>\n  );\n};\n\nTabs.Tab = function Tab({ index, children }) {\n  const { active, setActive } = React.useContext(TabsContext);\n  const isActive = active === index;\n  return (\n    <button onClick={() => setActive(index)}\n      style={{\n        padding: '10px 20px', border: 'none', cursor: 'pointer',\n        fontFamily: 'sans-serif', fontSize: 14, fontWeight: isActive ? 'bold' : 'normal',\n        background: 'transparent',\n        color: isActive ? '#6366f1' : '#6b7280',\n        borderBottom: isActive ? '3px solid #6366f1' : '3px solid transparent',\n        marginBottom: -2, transition: 'all 0.2s'\n      }}>\n      {children}\n    </button>\n  );\n};\n\nTabs.Panel = function Panel({ index, children }) {\n  const { active } = React.useContext(TabsContext);\n  if (active !== index) return null;\n  return (\n    <div style={{ padding: 20, background: '#f9fafb', borderRadius: 12, fontSize: 14, color: '#374151', lineHeight: 1.6 }}>\n      {children}\n    </div>\n  );\n};\n\nfunction App() {\n  return (\n    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 500, margin: '0 auto' }}>\n      <h2 style={{ color: '#1f2937' }}>Compound Component: Tabs</h2>\n      <Tabs defaultActive={0}>\n        <Tabs.List>\n          <Tabs.Tab index={0}>About</Tabs.Tab>\n          <Tabs.Tab index={1}>Features</Tabs.Tab>\n          <Tabs.Tab index={2}>Pricing</Tabs.Tab>\n        </Tabs.List>\n        <Tabs.Panel index={0}>\n          This is a compound components demo. Each part works together seamlessly!\n          The Tabs component manages state internally via Context.\n        </Tabs.Panel>\n        <Tabs.Panel index={1}>\n          <strong>Key Features:</strong>\n          <ul>\n            <li>Implicit state sharing via Context</li>\n            <li>Flexible API — consumers control styling</li>\n            <li>No prop drilling needed</li>\n          </ul>\n        </Tabs.Panel>\n        <Tabs.Panel index={2}>\n          This pattern is FREE — just built-in React tools!\n          No external libraries needed for this level of component composition.\n        </Tabs.Panel>\n      </Tabs>\n    </div>\n  );\n}\n\nReactDOM.render(<App />, document.getElementById('root'));`,
      },
      // ── Lesson 6.4 ──
      {
        id: 'patterns-4',
        title: 'Composition vs Inheritance',
        objectives: [
          'Understand React\'s preference for composition over inheritance',
          'Use composition patterns (containment, specialization)',
          'Avoid deep component inheritance hierarchies',
        ],
        takeaways: [
          'React recommends composition over inheritance for code reuse',
          'Props and children provide the necessary composition flexibility',
          'Inheritance creates tight coupling and is rarely needed in React',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Why Composition Wins</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">React has a powerful composition model. Instead of creating "base classes" and extending them (inheritance), React recommends composing small, focused components together.</p>
          <p class="mb-4 text-gray-700 leading-relaxed"><strong>Containment</strong> is when a component wraps unknown content using the <code>children</code> prop. <strong>Specialization</strong> is when a specialized component renders a more generic one and customizes it with props.</p>

          <div class="grid md:grid-cols-2 gap-4 my-6">
            <div class="bg-teal-50 border border-teal-200 rounded-xl p-5">
              <h4 class="font-bold text-teal-800 flex items-center gap-2"><i class="fa-solid fa-cubes"></i> Containment</h4>
              <p class="text-teal-700 text-xs mt-1">A generic container (Dialog, Card, Panel) wraps content passed via children.</p>
            </div>
            <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
              <h4 class="font-bold text-indigo-800 flex items-center gap-2"><i class="fa-solid fa-pen-ruler"></i> Specialization</h4>
              <p class="text-indigo-700 text-xs mt-1">A specific component (WelcomeDialog) renders a generic Dialog with specific props.</p>
            </div>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-400 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Remember:</strong> In React, you never need to extend a component class to reuse its functionality. Use props and composition instead. It's more flexible and easier to maintain!</p>
          </div>
        `,
        defaultCode: `// Generic Dialog (containment pattern)\nfunction Dialog({ title, message, children, variant }) {\n  const colors = {\n    info: { bg: '#eff6ff', border: '#bfdbfe', icon: '💡', titleColor: '#1d4ed8' },\n    success: { bg: '#f0fdf4', border: '#bbf7d0', icon: '✅', titleColor: '#16a34a' },\n    warning: { bg: '#fefce8', border: '#fde68a', icon: '⚠️', titleColor: '#d97706' }\n  };\n  const c = colors[variant] || colors.info;\n\n  return (\n    <div style={{\n      padding: 20, fontFamily: 'sans-serif',\n      maxWidth: 400, margin: '0 auto 16px',\n      background: c.bg, borderRadius: 12,\n      border: '1px solid', borderColor: c.border\n    }}>\n      <div style={{ fontSize: 24, marginBottom: 8 }}>{c.icon}</div>\n      <h3 style={{ margin: '0 0 4px', color: c.titleColor }}>{title}</h3>\n      <p style={{ margin: '0 0 12px', fontSize: 14, color: '#4b5563' }}>{message}</p>\n      {children}\n    </div>\n  );\n}\n\n// Specialization: specific dialog types that use the generic Dialog\nfunction WelcomeDialog() {\n  return (\n    <Dialog title=\"Welcome!\" message=\"Thanks for joining us.\" variant=\"success\">\n      <button style={{ padding: '8px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>\n        Get Started\n      </button>\n    </Dialog>\n  );\n}\n\nfunction ErrorDialog({ message, onRetry }) {\n  return (\n    <Dialog title=\"Something went wrong\" message={message} variant=\"warning\">\n      <button onClick={onRetry} style={{ padding: '8px 16px', background: '#d97706', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>\n        Retry\n      </button>\n    </Dialog>\n  );\n}\n\nfunction App() {\n  const [showError, setShowError] = React.useState(false);\n  return (\n    <div style={{ padding: 24 }}>\n      <WelcomeDialog />\n      {showError && <ErrorDialog message=\"Could not load data. Please try again.\" onRetry={() => setShowError(false)} />}\n      {!showError && <button onClick={() => setShowError(true)}\n        style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', display: 'block', margin: '0 auto' }}>\n        Show Error Demo\n      </button>}\n      <p style={{ fontFamily: 'sans-serif', fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 12 }}>\n        WelcomeDialog and ErrorDialog are specialized versions of Dialog — no inheritance, just composition!\n      </p>\n    </div>\n  );\n}\n\nReactDOM.render(<App />, document.getElementById('root'));`,
      },
    ],
    quiz: [
      {
        id: 'q-patterns-1',
        question: 'What does an HOC (Higher-Order Component) do?',
        options: [
          'Creates a new component class',
          'Takes a component and returns an enhanced component',
          'Replaces the component in the tree',
          'Modifies the component directly',
        ],
        correct: 1,
      },
      {
        id: 'q-patterns-2',
        question: 'In the render props pattern, what does the "render" prop contain?',
        options: ['A JSX element', 'A function that returns JSX', 'A string', 'A class definition'],
        correct: 1,
      },
      {
        id: 'q-patterns-3',
        question: 'What makes compound components "compound"?',
        options: ['They are complex', 'They share implicit state via context', 'They have many props', 'They use multiple hooks'],
        correct: 1,
      },
      {
        id: 'q-patterns-4',
        question: 'Which pattern does React recommend over inheritance?',
        options: ['Mixins', 'Composition', 'Factory pattern', 'Singleton pattern'],
        correct: 1,
      },
    ],
  },

  // ─── MODULE 7: REACT ROUTER ─────────────────────────────
  {
    id: 'router',
    title: 'React Router',
    lessons: [
      // ── Lesson 7.1 ──
      {
        id: 'router-1',
        title: 'Basic Routing & Navigation',
        objectives: [
          'Understand client-side routing in SPAs',
          'Set up BrowserRouter, Routes, and Route',
          'Use Link for navigation without page reload',
        ],
        takeaways: [
          'React Router enables navigation without full page reloads',
          'BrowserRouter wraps the app, Routes defines paths, Route maps paths to components',
          'Link component replaces <a href> for client-side navigation',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Client-Side Routing in React</h3>
          <p class="mb-4 text-gray-700 leading-relaxed"><strong>React Router</strong> is the standard library for routing in React apps. It enables navigation between views without the browser making a full page request to the server.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">Unlike traditional multi-page websites, React Router keeps the UI in sync with the URL while maintaining the app's state. Clicking a Link changes the URL and renders the appropriate component — all client-side.</p>

          <div class="bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-sky-800 mb-2">Key Components</h4>
            <ul class="space-y-2 text-sm text-sky-700">
              <li><strong>BrowserRouter</strong> — wraps the app and syncs UI with URL</li>
              <li><strong>Routes</strong> — container for all Route definitions</li>
              <li><strong>Route</strong> — maps a URL path to a React component</li>
              <li><strong>Link</strong> — navelink component for navigation</li>
              <li><strong>Navigate</strong> — declarative redirect</li>
            </ul>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-400 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Note:</strong> This playground uses a simple state-based router simulator since React Router requires URL access. In a real app, you'd use <code>react-router-dom</code> package exactly as shown.</p>
          </div>
        `,
        defaultCode: `// Simple state-based router to demonstrate routing concepts\nfunction Home() {\n  return <div style={{ padding: 20, background: '#eff6ff', borderRadius: 12, fontSize: 14, color: '#1d4ed8' }}>🏠 Welcome to the Home Page</div>;\n}\nfunction About() {\n  return <div style={{ padding: 20, background: '#f0fdf4', borderRadius: 12, fontSize: 14, color: '#16a34a' }}>ℹ️ About us — we love React!</div>;\n}\nfunction Contact() {\n  return <div style={{ padding: 20, background: '#fefce8', borderRadius: 12, fontSize: 14, color: '#d97706' }}>📧 Contact us at hello@react.com</div>;\n}\n\nfunction App() {\n  const [page, setPage] = React.useState('home');\n\n  const pages = { home: <Home />, about: <About />, contact: <Contact /> };\n  const navStyle = (p) => ({\n    padding: '8px 16px', border: 'none', borderRadius: 6, cursor: 'pointer',\n    fontWeight: page === p ? 'bold' : 'normal',\n    background: page === p ? '#6366f1' : '#e5e7eb',\n    color: page === p ? 'white' : '#374151',\n    transition: 'all 0.2s'\n  });\n\n  return (\n    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 500, margin: '0 auto' }}>\n      <h2 style={{ color: '#1f2937' }}>Router Demo</h2>\n      <nav style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #e5e7eb', paddingBottom: 12 }}>\n        <button style={navStyle('home')} onClick={() => setPage('home')}>Home</button>\n        <button style={navStyle('about')} onClick={() => setPage('about')}>About</button>\n        <button style={navStyle('contact')} onClick={() => setPage('contact')}>Contact</button>\n      </nav>\n      <div style={{ animation: 'fadeIn 0.3s' }}>\n        {pages[page]}\n      </div>\n    </div>\n  );\n}\n\nReactDOM.render(<App />, document.getElementById('root'));`,
      },
      // ── Lesson 7.2 ──
      {
        id: 'router-2',
        title: 'Route Parameters & Query Strings',
        objectives: [
          'Use route parameters for dynamic URLs',
          'Read URL params with useParams',
          'Read and update query strings with useSearchParams',
        ],
        takeaways: [
          'Route params are defined with :paramName syntax',
          'useParams returns an object of route parameters',
          'useSearchParams read/updates URL query string',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Dynamic Routes with Parameters</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Real apps need dynamic URLs — like <code>/users/42</code> or <code>/products/shoes</code>. Route parameters (defined with <code>:paramName</code>) capture the dynamic segment of the URL.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">React Router provides <code>useParams</code> to read route parameters and <code>useSearchParams</code> to read/update query strings (<code>?search=react&page=2</code>).</p>

          <div class="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-amber-800 mb-2">URL Anatomy</h4>
            <p class="text-sm text-amber-700 bg-white p-3 rounded-lg font-mono">/users/<strong style="color:#d97706">:userId</strong>?<strong style="color:#16a34a">tab</strong>=<strong style="color:#2563eb">profile</strong></p>
            <ul class="space-y-1 text-xs text-amber-700 mt-2">
              <li><strong style="color:#d97706">:userId</strong> = route param (useParams)</li>
              <li><strong style="color:#16a34a">tab=profile</strong> = query string (useSearchParams)</li>
            </ul>
          </div>
        `,
        defaultCode: `// Route params demo with state-based routing\nfunction UserProfile({ userId, tab }) {\n  const user = users.find(u => u.id === Number(userId)) || users[0];\n  return (\n    <div style={{ padding: 20, background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb' }}>\n      <div style={{ fontSize: 32, marginBottom: 8 }}>{user.avatar}</div>\n      <h3 style={{ margin: '0 0 4px', color: '#1f2937' }}>{user.name}</h3>\n      <p style={{ margin: '0 0 12px', color: '#6b7280', fontSize: 14 }}>{user.email}</p>\n      <div style={{ fontSize: 13, color: '#374151' }}>\n        Active tab: <strong>{tab}</strong>\n      </div>\n    </div>\n  );\n}\n\nconst users = [\n  { id: 1, name: 'Alice', email: 'alice@example.com', avatar: '👩‍💻' },\n  { id: 2, name: 'Bob', email: 'bob@example.com', avatar: '👨‍🎨' },\n  { id: 3, name: 'Charlie', email: 'charlie@example.com', avatar: '🧑‍🔬' },\n];\n\nfunction App() {\n  const [userId, setUserId] = React.useState(1);  // route param\n  const [tab, setTab] = React.useState('profile'); // query param\n\n  return (\n    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 500, margin: '0 auto' }}>\n      <h2 style={{ color: '#1f2937' }}>Route Params Demo</h2>\n      \n      {/* User selector (simulates /users/:userId) */}\n      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>\n        {users.map(u => (\n          <button key={u.id} onClick={() => setUserId(u.id)}\n            style={{\n              padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',\n              background: userId === u.id ? '#6366f1' : '#e5e7eb',\n              color: userId === u.id ? 'white' : '#374151',\n              fontWeight: userId === u.id ? 'bold' : 'normal'\n            }}>\n            {u.name}\n          </button>\n        ))}\n      </div>\n      \n      {/* Tab selector (simulates ?tab=) */}\n      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>\n        {['profile', 'settings', 'activity'].map(t => (\n          <button key={t} onClick={() => setTab(t)}\n            style={{\n              padding: '4px 12px', borderRadius: 12, border: '1px solid #d1d5db',\n              cursor: 'pointer', fontSize: 12,\n              background: tab === t ? '#e0e7ff' : 'white',\n              color: tab === t ? '#4338ca' : '#6b7280'\n            }}>\n            {t}\n          </button>\n        ))}\n      </div>\n      \n      {/* Route params display */}\n      <div style={{ marginBottom: 12, fontSize: 12, color: '#9ca3af', fontFamily: 'monospace' }}>\n        /users/{userId}?tab={tab}\n      </div>\n      \n      <UserProfile userId={userId} tab={tab} />\n    </div>\n  );\n}\n\nReactDOM.render(<App />, document.getElementById('root'));`,
      },
      // ── Lesson 7.3 ──
      {
        id: 'router-3',
        title: 'Nested Routes & Layouts',
        objectives: [
          'Create nested route structures',
          'Use Outlet for rendering nested route content',
          'Build shared layouts with nested routing',
        ],
        takeaways: [
          'Nested routes create layouts that persist across sub-pages',
          'Parent route elements use <Outlet /> for child content',
          'Use index routes for default child content in a nested layout',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Layouts with Nested Routes</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Nested routes let you create layouts that wrap multiple pages. A parent route renders a shell (header, sidebar, footer), and child routes render content inside an <code>&lt;Outlet /&gt;</code>.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">This is perfect for patterns like <code>/dashboard/settings</code>, <code>/dashboard/profile</code>, <code>/dashboard/stats</code> — the sidebar and header stay the same, only the content area changes.</p>

          <div class="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-indigo-800 mb-2">Nested Route Structure</h4>
            <pre class="text-xs text-indigo-700 bg-white p-3 rounded-lg">// Parent layout with Outlet\n&lt;Route path=\"dashboard\" element={&lt;DashboardLayout /&gt;}&gt;\n  &lt;Route index element={&lt;DashboardHome /&gt;} /&gt;\n  &lt;Route path=\"settings\" element={&lt;Settings /&gt;} /&gt;\n  &lt;Route path=\"profile\" element={&lt;Profile /&gt;} /&gt;\n&lt;/Route&gt;</pre>
            <p class="text-xs text-indigo-600 mt-2">DashboardLayout contains &lt;Outlet /&gt; for child content</p>
          </div>
        `,
        defaultCode: `// Nested routes demo using state-based router\nfunction DashboardLayout({ page, setPage, children }) {\n  const navItems = [\n    { id: 'overview', label: '📊 Overview' },\n    { id: 'analytics', label: '📈 Analytics' },\n    { id: 'settings', label: '⚙️ Settings' },\n  ];\n\n  return (\n    <div style={{ display: 'flex', gap: 20, fontFamily: 'sans-serif' }}>\n      {/* Sidebar */}\n      <div style={{ width: 180, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb' }}>\n        <div style={{ padding: '12px 16px', background: '#6366f1', color: 'white', fontWeight: 'bold', fontSize: 14 }}>\n          Dashboard\n        </div>\n        {navItems.map(item => (\n          <button key={item.id} onClick={() => setPage(item.id)}\n            style={{\n              width: '100%', padding: '10px 16px', border: 'none',\n              cursor: 'pointer', textAlign: 'left', fontSize: 13,\n              background: page === item.id ? '#eef2ff' : 'white',\n              color: page === item.id ? '#4338ca' : '#374151',\n              fontWeight: page === item.id ? 'bold' : 'normal',\n              borderLeft: page === item.id ? '3px solid #6366f1' : '3px solid transparent'\n            }}>\n            {item.label}\n          </button>\n        ))}\n      </div>\n      {/* Content area (Outlet equivalent) */}\n      <div style={{ flex: 1 }}>\n        {children}\n      </div>\n    </div>\n  );\n}\n\nfunction Overview() {\n  return <div style={{ padding: 20, background: '#f9fafb', borderRadius: 12 }}><h3 style={{ marginTop: 0 }}>Dashboard Overview</h3><p>Welcome back! Here's your activity summary.</p></div>;\n}\n\nfunction Analytics() {\n  return <div style={{ padding: 20, background: '#f9fafb', borderRadius: 12 }}><h3 style={{ marginTop: 0 }}>Analytics</h3><p>Your page views increased by 24% this week. 📈</p></div>;\n}\n\nfunction Settings() {\n  return <div style={{ padding: 20, background: '#f9fafb', borderRadius: 12 }}><h3 style={{ marginTop: 0 }}>Settings</h3><p>Manage your account settings and preferences.</p></div>;\n}\n\nconst pages = {\n  overview: <Overview />,\n  analytics: <Analytics />,\n  settings: <Settings />,\n};\n\nfunction App() {\n  const [page, setPage] = React.useState('overview');\n  return (\n    <div style={{ maxWidth: 700, margin: '24px auto', padding: '0 16px' }}>\n      <DashboardLayout page={page} setPage={setPage}>\n        {pages[page]}\n      </DashboardLayout>\n    </div>\n  );\n}\n\nReactDOM.render(<App />, document.getElementById('root'));`,
      },
      // ── Lesson 7.4 ──
      {
        id: 'router-4',
        title: 'Navigation, Redirects & Guards',
        objectives: [
          'Use programmatic navigation with useNavigate',
          'Implement protected routes with auth guards',
          'Handle 404s with catch-all routes',
        ],
        takeaways: [
          'useNavigate programmatically navigates to a route',
          'Protected routes redirect unauthenticated users to login',
          'A route with path="*" catches all undefined paths (404)',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Routing Logic Beyond Links</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Sometimes you need to navigate programmatically — after a form submission, after login, or when a condition is met. React Router's <code>useNavigate</code> hook provides this.</p>
          <p class="mb-4 text-gray-700 leading-relaxed"><strong>Protected routes</strong> are an essential pattern. You wrap a route (or group of routes) in a component that checks authentication status. If authenticated, render the content. If not, redirect to login.</p>

          <div class="grid md:grid-cols-2 gap-4 my-6">
            <div class="bg-sky-50 border border-sky-200 rounded-xl p-5">
              <h4 class="font-bold text-sky-800 text-sm">Protected Route Pattern</h4>
              <pre class="text-xs text-sky-700 mt-2 bg-white p-3 rounded-lg">function ProtectedRoute() {\n  const { user } = useAuth();\n  if (!user) return &lt;Navigate to=\"/login\" /&gt;;\n  return &lt;Outlet /&gt;;\n}</pre>
            </div>
            <div class="bg-rose-50 border border-rose-200 rounded-xl p-5">
              <h4 class="font-bold text-rose-800 text-sm">404 Catch-All</h4>
              <pre class="text-xs text-rose-700 mt-2 bg-white p-3 rounded-lg">&lt;Route path=\"*\" element={&lt;NotFound /&gt;} /&gt;</pre>
            </div>
          </div>
        `,
        defaultCode: `// Navigation, auth guards, and 404 handling demo\n\nfunction LoginForm({ onLogin }) {\n  const [email, setEmail] = React.useState('');\n  const [password, setPassword] = React.useState('');\n  return (\n    <div style={{ maxWidth: 320, margin: '0 auto', padding: 24 }}>\n      <h3 style={{ fontFamily: 'sans-serif', color: '#1f2937' }}>Login to Continue</h3>\n      <input value={email} onChange={e => setEmail(e.target.value)} placeholder=\"Email\" style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 6, width: '100%', fontSize: 14, marginBottom: 8 }} />\n      <input type=\"password\" value={password} onChange={e => setPassword(e.target.value)} placeholder=\"Password\" style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 6, width: '100%', fontSize: 14, marginBottom: 12 }} />\n      <button onClick={() => onLogin(email)} style={{ padding: '10px 24px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>\n        Login\n      </button>\n    </div>\n  );\n}\n\nfunction Dashboard({ onLogout }) {\n  return (\n    <div style={{ padding: 20, fontFamily: 'sans-serif', maxWidth: 400, margin: '0 auto' }}>\n      <h3 style={{ color: '#1f2937' }}>🔒 Protected Dashboard</h3>\n      <p style={{ fontSize: 14, color: '#6b7280' }}>You can only see this if you're logged in!</p>\n      <button onClick={onLogout} style={{ padding: '8px 16px', background: '#fee2e2', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', color: '#dc2626' }}>\n        Logout\n      </button>\n    </div>\n  );\n}\n\nfunction NotFound() {\n  return (\n    <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif', color: '#6b7280' }}>\n      <div style={{ fontSize: 48, marginBottom: 12 }}>404</div>\n      <h3 style={{ color: '#1f2937' }}>Page Not Found</h3>\n      <p style={{ fontSize: 14 }}>The page you're looking for doesn't exist.</p>\n    </div>\n  );\n}\n\nfunction App() {\n  const [user, setUser] = React.useState(null);\n  const [page, setPage] = React.useState('home');\n\n  const navigate = (p) => setPage(p);\n\n  const handleLogin = (email) => {\n    setUser({ email });\n    navigate('dashboard');\n  };\n\n  const handleLogout = () => {\n    setUser(null);\n    navigate('home');\n  };\n\n  // Protected route guard\n  const renderPage = () => {\n    if (page === 'dashboard') {\n      // Auth guard\n      if (!user) {\n        navigate('login');\n        return null;\n      }\n      return <Dashboard onLogout={handleLogout} />;\n    }\n    if (page === 'login') return <LoginForm onLogin={handleLogin} />;\n    if (page === 'home') return (\n      <div style={{ fontFamily: 'sans-serif', maxWidth: 400, margin: '0 auto', padding: 24, textAlign: 'center' }}>\n        <h3>🏠 Home Page</h3>\n        <p style={{ fontSize: 14, color: '#6b7280' }}>Click Dashboard (you'll be redirected to login if not authenticated)</p>\n      </div>\n    );\n    // 404 catch-all\n    return <NotFound />;\n  };\n\n  return (\n    <div style={{ fontFamily: 'sans-serif', maxWidth: 500, margin: '0 auto', padding: 24 }}>\n      <nav style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '1px solid #e5e7eb', paddingBottom: 12 }}>\n        <button onClick={() => navigate('home')} style={{ padding: '6px 14px', background: page === 'home' ? '#6366f1' : '#e5e7eb', color: page === 'home' ? 'white' : '#374151', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: page === 'home' ? 'bold' : 'normal', fontSize: 13 }}>Home</button>\n        <button onClick={() => navigate('dashboard')} style={{ padding: '6px 14px', background: page === 'dashboard' ? '#6366f1' : '#e5e7eb', color: page === 'dashboard' ? 'white' : '#374151', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: page === 'dashboard' ? 'bold' : 'normal', fontSize: 13 }}>Dashboard 🔒</button>\n        <button onClick={() => navigate('unknown')} style={{ padding: '6px 14px', background: page === 'unknown' ? '#6366f1' : '#e5e7eb', color: page === 'unknown' ? 'white' : '#374151', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: page === 'unknown' ? 'bold' : 'normal', fontSize: 13 }}>404 Test</button>\n      </nav>\n      {renderPage()}\n      {user && <p style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 12 }}>Logged in as: {user.email}</p>}\n    </div>\n  );\n}\n\nReactDOM.render(<App />, document.getElementById('root'));`,
      },
    ],
    quiz: [
      {
        id: 'q-router-1',
        question: 'What component is used for client-side navigation in React Router?',
        options: ['<a>', '<Link>', '<Nav>', '<Route>'],
        correct: 1,
      },
      {
        id: 'q-router-2',
        question: 'How do you read route parameters in React Router?',
        options: ['useState', 'useParams', 'useQuery', 'useRoute'],
        correct: 1,
      },
      {
        id: 'q-router-3',
        question: 'What component renders child route content in a nested route layout?',
        options: ['<Child>', '<Content>', '<Outlet>', '<Slot>'],
        correct: 2,
      },
      {
        id: 'q-router-4',
        question: 'What path matches all undefined routes for a 404 page?',
        options: ['/404', '/*', '/all', 'undefined'],
        correct: 1,
      },
    ],
  },

  // ─── MODULE 8: PERFORMANCE OPTIMIZATION ──────────────────
  {
    id: 'perf',
    title: 'Performance Optimization',
    lessons: [
      // ── Lesson 8.1 ──
      {
        id: 'perf-1',
        title: 'React.memo — Preventing Unnecessary Re-renders',
        objectives: [
          'Understand when and why re-renders happen',
          'Use React.memo to skip re-renders with unchanged props',
          'Compare props with custom comparison function',
        ],
        takeaways: [
          'React.memo is a higher-order function that memoizes a component',
          'It performs a shallow comparison of props to decide if re-render is needed',
          'Use React.memo for components that render often with the same props',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Skipping Unnecessary Re-renders</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">By default, when a parent component re-renders, ALL of its children re-render too. This is usually fine, but for expensive components or deeply nested trees, it can cause performance issues.</p>
          <p class="mb-4 text-gray-700 leading-relaxed"><code>React.memo</code> is a built-in solution. It wraps your component and checks if props have changed. If not, it reuses the last rendered output — skipping the re-render entirely.</p>

          <div class="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-teal-800 mb-2">When to Use React.memo</h4>
            <ul class="space-y-2 text-sm text-teal-700">
              <li>✅ Component renders often with the SAME props</li>
              <li>✅ Component is expensive to render (large lists, charts, complex DOM)</li>
              <li>✅ Component is a pure, presentational component</li>
              <li>❌ Component always receives different props each render</li>
              <li>❌ Component is cheap to render (simple text, a button)</li>
            </ul>
          </div>
        `,
        defaultCode: `// Compare renders with and without React.memo\nlet normalRenderCount = 0;\nlet memoRenderCount = 0;\n\nfunction NormalExpensiveComponent({ name }) {\n  normalRenderCount++;\n  // Simulate expensive rendering\n  const start = performance.now();\n  while (performance.now() - start < 2) { /* busy wait */ }\n  return (\n    <div style={{ padding: 12, background: '#fee2e2', borderRadius: 8, border: '1px solid #fecaca', fontSize: 14, marginBottom: 8 }}>\n      <strong>Normal:</strong> {name} — Rendered {normalRenderCount} times\n    </div>\n  );\n}\n\nconst MemoExpensiveComponent = React.memo(function MemoExpensive({ name }) {\n  memoRenderCount++;\n  const start = performance.now();\n  while (performance.now() - start < 2) { /* busy wait */ }\n  return (\n    <div style={{ padding: 12, background: '#dcfce7', borderRadius: 8, border: '1px solid #bbf7d0', fontSize: 14, marginBottom: 8 }}>\n      <strong>Memoized:</strong> {name} — Rendered {memoRenderCount} times\n    </div>\n  );\n});\n\nfunction App() {\n  const [count, setCount] = React.useState(0);\n  const [name, setName] = React.useState('Alice');\n\n  return (\n    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 450, margin: '0 auto' }}>\n      <h2 style={{ color: '#1f2937' }}>React.memo Demo</h2>\n      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>\n        Click "Increment" to re-render parent. The memoized component skips re-render when name hasn't changed!\n      </p>\n      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>\n        <button onClick={() => setCount(c => c + 1)}\n          style={{ padding: '8px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>\n          Increment ({count})\n        </button>\n        <button onClick={() => setName(n => n === 'Alice' ? 'Bob' : 'Alice')}\n          style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: 6, cursor: 'pointer' }}>\n          Change Name\n        </button>\n      </div>\n      <NormalExpensiveComponent name={name} />\n      <MemoExpensiveComponent name={name} />\n      <p style={{ fontSize: 12, color: '#9ca3af' }}>\n        Normal re-renders on every parent update. Memoized only re-renders when name changes!\n      </p>\n    </div>\n  );\n}\n\nReactDOM.render(<App />, document.getElementById('root'));`,
      },
      // ── Lesson 8.2 ──
      {
        id: 'perf-2',
        title: 'useMemo for Expensive Computations',
        objectives: [
          'Use useMemo to cache expensive calculations',
          'Understand when useMemo provides value',
          'Measure performance improvements with console timings',
        ],
        takeaways: [
          'useMemo caches the result of a computation between renders',
          'Only recomputes when dependencies in the array change',
          'Use it for genuinely expensive operations, not cheap calculations',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Memoizing Computed Values</h3>
          <p class="mb-4 text-gray-700 leading-relaxed"><code>useMemo</code> caches the result of an expensive computation. It only re-runs the computation when one of its dependencies has changed. This is different from <code>useEffect</code> — useMemo runs during the render phase, not after it.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">Good candidates for useMemo: sorting/filtering large arrays, complex mathematical calculations, formatting data deeply, or creating objects/arrays that are passed as props to memoized children.</p>

          <div class="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-indigo-800 mb-2">useMemo vs useEffect</h4>
            <table class="w-full text-xs text-indigo-700 bg-white rounded-lg overflow-hidden">
              <thead><tr class="bg-indigo-50"><th class="p-2 text-left"></th><th class="p-2 text-left">useMemo</th><th class="p-2 text-left">useEffect</th></tr></thead>
              <tbody>
                <tr><td class="p-2 font-medium">When</td><td class="p-2">During render (synchronous)</td><td class="p-2">After render (async)</td></tr>
                <tr><td class="p-2 font-medium">Returns</td><td class="p-2">A value (memoized)</td><td class="p-2">Cleanup function or nothing</td></tr>
                <tr><td class="p-2 font-medium">Purpose</td><td class="p-2">Avoid recalculating values</td><td class="p-2">Perform side effects</td></tr>
              </tbody>
            </table>
          </div>
        `,
        defaultCode: `function App() {\n  const [count, setCount] = React.useState(0);\n  const [search, setSearch] = React.useState('');\n\n  // Simulate a large dataset\n  const allItems = React.useMemo(() => {\n    const items = [];\n    for (let i = 0; i < 100; i++) {\n      items.push({ id: i, name: \`Item \${i}\`, category: \`Category \${Math.floor(i / 10)}\` });\n    }\n    return items;\n  }, []);\n\n  // Expensive filtered/search computation\n  const filteredItems = React.useMemo(() => {\n    console.log('Filtering items... (expensive computation)');\n    const start = performance.now();\n    // Simulate expensive filter\n    const result = allItems.filter(item =>\n      item.name.toLowerCase().includes(search.toLowerCase()) ||\n      item.category.toLowerCase().includes(search.toLowerCase())\n    );\n    const elapsed = Math.round(performance.now() - start);\n    console.log(\`Filtered \${result.length} items in \${elapsed}ms\`);\n    return result;\n  }, [allItems, search]);\n\n  return (\n    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 500, margin: '0 auto' }}>\n      <h2 style={{ color: '#1f2937' }}>useMemo: Efficient Filtering</h2>\n      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>\n        <input value={search} onChange={e => setSearch(e.target.value)}\n          placeholder=\"Search items...\"\n          style={{ flex: 1, padding: 8, border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}\n        />\n        <button onClick={() => setCount(c => c + 1)}\n          style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>\n          Re-render ({count})\n        </button>\n      </div>\n      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>\n        Check console — filtering only runs when search text changes, NOT on re-renders!\n      </div>\n      <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 12, padding: 8 }}>\n        {filteredItems.map(item => (\n          <div key={item.id} style={{\n            padding: '6px 10px', marginBottom: 4,\n            background: '#f9fafb', borderRadius: 6,\n            fontSize: 13, color: '#374151',\n            border: '1px solid #f3f4f6'\n          }}>\n            {item.name} — <span style={{ color: '#9ca3af' }}>{item.category}</span>\n          </div>\n        ))}\n      </div>\n    </div>\n  );\n}\n\nReactDOM.render(<App />, document.getElementById('root'));`,
      },
      // ── Lesson 8.3 ──
      {
        id: 'perf-3',
        title: 'useCallback for Stable Function References',
        objectives: [
          'Understand the problem of stale function references',
          'Use useCallback to stabilize callback references',
          'Combine useCallback with React.memo for maximum benefit',
        ],
        takeaways: [
          'useCallback returns a memoized version of a function',
          'It prevents unnecessary re-renders when passed to memoized children',
          'Always include all referenced variables in the dependency array',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Stable Function References</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Every time a React component re-renders, all functions defined inside it are re-created. This means the NEW function is a DIFFERENT reference than the OLD function. When passed to a <code>React.memo</code>-wrapped child, the child sees a new prop and re-renders — defeating the purpose of memo!</p>
          <p class="mb-4 text-gray-700 leading-relaxed"><code>useCallback</code> fixes this by returning the SAME function reference as long as its dependencies haven't changed.</p>

          <div class="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-amber-800 mb-2">The Chain</h4>
            <div class="text-xs text-amber-700 bg-white p-3 rounded-lg flex items-center gap-2 flex-wrap">
              <span>Parent re-renders</span>
              <span class="text-amber-400">→</span>
              <span>New callback created</span>
              <span class="text-amber-400">→</span>
              <span>React.memo child sees "new" props</span>
              <span class="text-amber-400">→</span>
              <span>Child re-renders (wasted!)</span>
            </div>
            <p class="text-xs text-amber-600 mt-2">useCallback breaks the chain by keeping the function reference stable.</p>
          </div>
        `,
        defaultCode: `let normalChildRenders = 0;\nlet memoChildRenders = 0;\n\nfunction NormalChild({ onClick }) {\n  normalChildRenders++;\n  return (\n    <div style={{ padding: 12, background: '#fee2e2', borderRadius: 8, fontSize: 14, marginBottom: 8 }}>\n      🔴 Normal Child — rendered <strong>{normalChildRenders}</strong> times\n    </div>\n  );\n}\n\nconst MemoChild = React.memo(function MemoChild({ onClick }) {\n  memoChildRenders++;\n  return (\n    <div style={{ padding: 12, background: '#dcfce7', borderRadius: 8, fontSize: 14, marginBottom: 8 }}>\n      🟢 Memo Child — rendered <strong>{memoChildRenders}</strong> times\n    </div>\n  );\n});\n\nfunction App() {\n  const [count, setCount] = React.useState(0);\n  const [other, setOther] = React.useState(0);\n\n  // Without useCallback — new function every render\n  const normalClick = () => setCount(c => c + 1);\n  // With useCallback — stable reference\n  const memoClick = React.useCallback(() => setCount(c => c + 1), []);\n\n  return (\n    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 450, margin: '0 auto' }}>\n      <h2 style={{ color: '#1f2937' }}>useCallback Demo</h2>\n      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>\n        Both children receive click handlers. Only the memoized child keeps a stable reference!\n      </p>\n      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>\n        <button onClick={() => setOther(c => c + 1)}\n          style={{ padding: '8px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>\n          Re-render Parent ({other})\n        </button>\n      </div>\n      <NormalChild onClick={normalClick} />\n      <MemoChild onClick={memoClick} />\n      <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>\n        Count value: {count}. Click counters above to compare render counts!\n      </p>\n    </div>\n  );\n}\n\nReactDOM.render(<App />, document.getElementById('root'));`,
      },
      // ── Lesson 8.4 ──
      {
        id: 'perf-4',
        title: 'Code Splitting & Lazy Loading',
        objectives: [
          'Understand code splitting for reducing initial bundle size',
          'Use React.lazy for dynamic imports',
          'Use Suspense for loading states during lazy loading',
        ],
        takeaways: [
          'React.lazy enables on-demand loading of components',
          'Suspense provides a fallback UI while the lazy component loads',
          'Route-based code splitting is the most common pattern',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Loading Code on Demand</h3>
          <p class="mb-4 text-gray-700 leading-relaxed"><strong>Code splitting</strong> is the practice of breaking your app's JavaScript bundle into smaller chunks that load on demand. Instead of loading ALL of your app's code upfront, you load only what's needed for the current page.</p>
          <p class="mb-4 text-gray-700 leading-relaxed"><code>React.lazy</code> makes code splitting easy. It takes a function that returns a dynamic <code>import()</code> call. The lazy component only loads when it's rendered. Wrap it in <code>Suspense</code> to show a loading fallback while it loads.</p>

          <div class="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-teal-800 mb-2">Common Splitting Points</h4>
            <ul class="space-y-2 text-sm text-teal-700">
              <li><strong>Route-based</strong> — each page loads as a separate chunk</li>
              <li><strong>Component-based</strong> — heavy components (charts, editors) load on demand</li>
              <li><strong>Library-based</strong> — large libraries load only when the feature is used</li>
            </ul>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-400 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Tip:</strong> React.lazy currently only works with default exports. Named exports require a re-export module. Also, lazy components must be rendered inside a <code>Suspense</code> boundary.</p>
          </div>
        `,
        defaultCode: `// Code splitting demo — simulates lazy loading with a delay\n\n// Simulated lazy load function\nfunction simulateLazyLoad(Component, delay = 1500) {\n  return function LazyWrapper(props) {\n    const [loaded, setLoaded] = React.useState(false);\n\n    React.useEffect(() => {\n      const timer = setTimeout(() => setLoaded(true), delay);\n      return () => clearTimeout(timer);\n    }, []);\n\n    if (!loaded) {\n      return (\n        <div style={{ padding: 24, textAlign: 'center', fontFamily: 'sans-serif' }}>\n          <div style={{\n            width: 32, height: 32,\n            border: '3px solid #e5e7eb',\n            borderTopColor: '#6366f1',\n            borderRadius: '50%',\n            animation: 'spin 0.8s linear infinite',\n            margin: '0 auto 12px'\n          }}>\n            <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>\n          </div>\n          <p style={{ fontSize: 14, color: '#6b7280' }}>Loading chunk...</p>\n        </div>\n      );\n    }\n\n    return <Component {...props} />;\n  };\n}\n\nfunction HeavyDashboard() {\n  return (\n    <div style={{ padding: 20, background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', fontSize: 14, color: '#166534' }}>\n      📊 Heavy Dashboard Component (loaded on demand!)\n      <p style={{ fontSize: 12, marginTop: 8 }}>This component simulates a large, lazily-loaded module.</p>\n    </div>\n  );\n}\n\nfunction HeavyReports() {\n  return (\n    <div style={{ padding: 20, background: '#fefce8', borderRadius: 12, border: '1px solid #fde68a', fontSize: 14, color: '#92400e' }}>\n      📈 Heavy Reports Component (loaded on demand!)\n      <p style={{ fontSize: 12, marginTop: 8 }}>This component simulates a large, lazily-loaded module.</p>\n    </div>\n  );\n}\n\n// Wrapped with simulated lazy loading + Suspense\nconst LazyDashboard = simulateLazyLoad(HeavyDashboard, 1500);\nconst LazyReports = simulateLazyLoad(HeavyReports, 2000);\n\nfunction App() {\n  const [active, setActive] = React.useState(null);\n\n  return (\n    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 500, margin: '0 auto' }}>\n      <h2 style={{ color: '#1f2937' }}>Code Splitting Demo</h2>\n      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>\n        Click a button below to "lazy load" that component. Each has a simulated delay.\n      </p>\n      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>\n        <button onClick={() => setActive('dashboard')}\n          style={{ padding: '8px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}>\n          Load Dashboard\n        </button>\n        <button onClick={() => setActive('reports')}\n          style={{ padding: '8px 16px', background: '#d97706', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}>\n          Load Reports\n        </button>\n        <button onClick={() => setActive(null)}\n          style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>\n          Clear\n        </button>\n      </div>\n      {active === 'dashboard' && <LazyDashboard />}\n      {active === 'reports' && <LazyReports />}\n      <div style={{ marginTop: 12, fontSize: 12, color: '#9ca3af' }}>\n        In a real app: <code>const Dashboard = lazy(() => import('./Dashboard'))</code>\n      </div>\n    </div>\n  );\n}\n\nReactDOM.render(<App />, document.getElementById('root'));`,
      },
    ],
    quiz: [
      {
        id: 'q-perf-1',
        question: 'What does React.memo do?',
        options: [
          'Memoizes a value',
          'Memoizes a function',
          'Memoizes a component to skip re-renders with same props',
          'Creates a memory snapshot',
        ],
        correct: 2,
      },
      {
        id: 'q-perf-2',
        question: 'When should you use useMemo?',
        options: [
          'For every computed value in your component',
          'For expensive computations that should be cached',
          'Only for API calls',
          'useMemo is deprecated',
        ],
        correct: 1,
      },
      {
        id: 'q-perf-3',
        question: 'What problem does useCallback solve?',
        options: [
          'It prevents infinite loops',
          'It stabilizes function references across re-renders',
          'It makes functions run faster',
          'It replaces useEffect',
        ],
        correct: 1,
      },
      {
        id: 'q-perf-4',
        question: 'What is code splitting primarily used for?',
        options: [
          'Splitting CSS into separate files',
          'Splitting code into smaller bundles that load on demand',
          'Splitting the codebase into different folders',
          'Splitting a large component into smaller ones',
        ],
        correct: 1,
      },
      {
        id: 'q-perf-5',
        question: 'What component is needed to render a React.lazy() component?',
        options: ['<Loading>', '<ErrorBoundary>', '<Suspense>', '<Boundary>'],
        correct: 2,
      },
    ],
  },

  // ─── MODULE 9: TESTING & BEST PRACTICES ─────────────────
  {
    id: 'testing',
    title: 'Testing & Best Practices',
    lessons: [
      // ── Lesson 9.1 ──
      {
        id: 'testing-1',
        title: 'Introduction to Testing Components',
        objectives: [
          'Understand the testing pyramid (unit, integration, e2e)',
          'Set up React Testing Library',
          'Write your first component test',
        ],
        takeaways: [
          'React Testing Library tests components from a user perspective',
          'Render, find elements, interact, assert — the testing cycle',
          'Test behavior, NOT implementation details',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Testing in React</h3>
          <p class="mb-4 text-gray-700 leading-relaxed"><strong>Testing</strong> is how you ensure your components work correctly as your app grows. React Testing Library (RTL) is the most popular testing library for React — it encourages testing components the way a user would interact with them.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">The key philosophy: test <strong>what</strong> the component does, not <strong>how</strong> it does it. This means testing rendered output and user interactions rather than internal state or lifecycle methods.</p>

          <div class="grid md:grid-cols-3 gap-4 my-6">
            <div class="bg-sky-50 border border-sky-200 rounded-xl p-4">
              <h4 class="font-bold text-sky-800 text-sm">🔬 Unit Tests</h4>
              <p class="text-sky-700 text-xs mt-1">Test one component or function in isolation. Fast and focused.</p>
            </div>
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h4 class="font-bold text-amber-800 text-sm">🧩 Integration Tests</h4>
              <p class="text-amber-700 text-xs mt-1">Test how multiple components work together. More realistic.</p>
            </div>
            <div class="bg-rose-50 border border-rose-200 rounded-xl p-4">
              <h4 class="font-bold text-rose-800 text-sm">🌐 E2E Tests</h4>
              <p class="text-rose-700 text-xs mt-1">Test the full app in a browser (Cypress, Playwright). Slowest but most comprehensive.</p>
            </div>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-400 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Tip:</strong> RTL queries prioritize accessibility: <code>getByRole</code>, <code>getByLabelText</code>, <code>getByPlaceholderText</code>, <code>getByText</code>. Use <code>getByRole</code> first — it matches screen reader semantics!</p>
          </div>
        `,
        defaultCode: `// Testing concepts demo — simulate testing patterns in the browser\n\nfunction Greeting({ name, onReset }) {\n  return (\n    <div style={{ padding: 20, fontFamily: 'sans-serif', textAlign: 'center' }}>\n      <h1 style={{ color: '#1f2937' }}>Hello, {name || 'Guest'}!</h1>\n      {name && (\n        <button onClick={onReset}\n          style={{ padding: '8px 16px', background: '#e5e7eb', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>\n          Reset\n        </button>\n      )}\n    </div>\n  );\n}\n\nfunction TestSimulator() {\n  const [name, setName] = React.useState('Alice');\n  const [testsPassed, setTestsPassed] = React.useState({ greeting: false, button: false });\n\n  React.useEffect(() => {\n    // Simulate test 1: renders greeting with name\n    setTimeout(() => {\n      setTestsPassed(t => ({ ...t, greeting: true }));\n    }, 500);\n    // Simulate test 2: shows reset button\n    setTimeout(() => {\n      setTestsPassed(t => ({ ...t, button: true }));\n    }, 1000);\n  }, []);\n\n  return (\n    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 500, margin: '0 auto' }}>\n      <h2 style={{ color: '#1f2937' }}>Testing Simulator</h2>\n      \n      <Greeting name={name} onReset={() => setName('')} />\n      \n      <div style={{ marginTop: 24, padding: 16, background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb' }}>\n        <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#374151' }}>Test Results</h4>\n        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>\n          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>\n            <span style={{ color: testsPassed.greeting ? '#16a34a' : '#9ca3af' }}>\n              {testsPassed.greeting ? '✅' : '⏳'}\n            </span>\n            <code>expect(screen.getByText('Hello, Alice!')).toBeInTheDocument()</code>\n          </div>\n          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>\n            <span style={{ color: testsPassed.button ? '#16a34a' : '#9ca3af' }}>\n              {testsPassed.button ? '✅' : '⏳'}\n            </span>\n            <code>expect(screen.getByText('Reset')).toBeInTheDocument()</code>\n          </div>\n        </div>\n      </div>\n    </div>\n  );\n}\n\nReactDOM.render(<TestSimulator />, document.getElementById('root'));`,
      },
      // ── Lesson 9.2 ──
      {
        id: 'testing-2',
        title: 'Testing User Interactions & State',
        objectives: [
          'Test button clicks and input changes',
          'Use screen queries to find elements',
          'Assert on rendered output after interactions',
        ],
        takeaways: [
          'Use fireEvent or userEvent to simulate interactions',
          'Query elements with screen.getByText, getByRole, getByLabelText',
          'Assert on expected output after the interaction',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Testing Interactions</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">A component that handles user input needs tests that simulate what the user actually does: clicking buttons, typing into inputs, selecting options. React Testing Library's <code>fireEvent</code> (or the recommended <code>@testing-library/user-event</code>) simulates these interactions.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">The pattern: render → find element → interact → assert. Each test should focus on ONE behavior.</p>

          <div class="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-indigo-800 mb-2">Testing Cycle</h4>
            <div class="flex items-center gap-3 text-xs text-indigo-700 bg-white p-3 rounded-lg flex-wrap">
              <span class="px-2 py-1 bg-indigo-100 rounded">📦 render(&lt;Counter /&gt;)</span>
              <span class="text-indigo-300">→</span>
              <span class="px-2 py-1 bg-indigo-100 rounded">🔍 getByRole('button')</span>
              <span class="text-indigo-300">→</span>
              <span class="px-2 py-1 bg-indigo-100 rounded">🖱️ fireEvent.click(btn)</span>
              <span class="text-indigo-300">→</span>
              <span class="px-2 py-1 bg-green-100 rounded font-semibold">✅ expect(getByText('1'))</span>
            </div>
          </div>
        `,
        defaultCode: `// Interactive testing demo\nfunction Counter() {\n  const [count, setCount] = React.useState(0);\n  return (\n    <div style={{ padding: 20, fontFamily: 'sans-serif', textAlign: 'center', maxWidth: 300, margin: '0 auto' }}>\n      <h2 style={{ color: '#1f2937' }}>Counter</h2>\n      <div data-testid=\"count-value\" style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#6366f1', margin: 12 }}>\n        {count}\n      </div>\n      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>\n        <button onClick={() => setCount(c => c - 1)}\n          style={{ padding: '8px 16px', background: '#fee2e2', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>\n          Decrement\n        </button>\n        <button onClick={() => setCount(0)}\n          style={{ padding: '8px 16px', background: '#fef3c7', border: 'none', borderRadius: 6, cursor: 'pointer' }}>\n          Reset\n        </button>\n        <button onClick={() => setCount(c => c + 1)}\n          style={{ padding: '8px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>\n          Increment\n        </button>\n      </div>\n    </div>\n  );\n}\n\nfunction TestOutput() {\n  const [results, setResults] = React.useState([]);\n  const runTests = () => {\n    // Simulated test results\n    setResults([\n      { name: 'Renders initial count of 0', passed: true },\n      { name: 'Clicking Increment shows 1', passed: true },\n      { name: 'Clicking Decrement shows -1', passed: true },\n      { name: 'Clicking Reset goes back to 0', passed: true },\n    ]);\n  };\n\n  return (\n    <div style={{ fontFamily: 'sans-serif' }}>\n      <Counter />\n      <div style={{ textAlign: 'center', marginTop: 16 }}>\n        <button onClick={runTests}\n          style={{ padding: '8px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}>\n          Run Tests\n        </button>\n      </div>\n      {results.length > 0 && (\n        <div style={{ marginTop: 16, padding: 16, background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0' }}>\n          <h4 style={{ margin: '0 0 8px', color: '#16a34a', fontSize: 14 }}>Test Results: {results.filter(r => r.passed).length}/{results.length} passed</h4>\n          {results.map((r, i) => (\n            <p key={i} style={{ fontSize: 13, color: r.passed ? '#16a34a' : '#dc2626', margin: '2px 0' }}>\n              {r.passed ? '✅' : '❌'} {r.name}\n            </p>\n          ))}\n        </div>\n      )}\n    </div>\n  );\n}\n\nReactDOM.render(<TestOutput />, document.getElementById('root'));`,
      },
      // ── Lesson 9.3 ──
      {
        id: 'testing-3',
        title: 'Mocking API Calls & Side Effects',
        objectives: [
          'Mock fetch or axios calls in tests',
          'Simulate loading, success, and error states',
          'Test components that depend on side effects',
        ],
        takeaways: [
          'Mock external dependencies to make tests fast and reliable',
          'Test all states: loading, success, and error',
          'Use controlled mocks that return specific data for each test',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Testing Components that Fetch Data</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Components that fetch data are common in real apps. In tests, you don't want to make real API calls (slow, unreliable, side effects). Instead, you <strong>mock</strong> the fetch function to return controlled data.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">A good test covers all three states: <strong>loading</strong> (before data arrives), <strong>success</strong> (data displayed), and <strong>error</strong> (error message shown). Mock the fetch to return different things for each test case.</p>

          <div class="grid md:grid-cols-3 gap-4 my-6">
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h4 class="font-bold text-amber-800 text-sm">⏳ Loading State</h4>
              <p class="text-amber-700 text-xs mt-1">Shows a spinner or "Loading..." text. Assert that the spinner is visible.</p>
            </div>
            <div class="bg-green-50 border border-green-200 rounded-xl p-4">
              <h4 class="font-bold text-green-800 text-sm">✅ Success State</h4>
              <p class="text-green-700 text-xs mt-1">Displays the fetched data. Assert specific content is on screen.</p>
            </div>
            <div class="bg-rose-50 border border-rose-200 rounded-xl p-4">
              <h4 class="font-bold text-rose-800 text-sm">❌ Error State</h4>
              <p class="text-rose-700 text-xs mt-1">Shows an error message. Assert that the error text is visible.</p>
            </div>
          </div>
        `,
        defaultCode: `// Mock API data fetching demo\n\nfunction UserCard({ userId }) {\n  const [user, setUser] = React.useState(null);\n  const [loading, setLoading] = React.useState(true);\n  const [error, setError] = React.useState(null);\n\n  const fetchUser = React.useCallback(() => {\n    setLoading(true);\n    setError(null);\n    // Simulated API call\n    setTimeout(() => {\n      const mockUsers = {\n        1: { name: 'Alice', role: 'Developer' },\n        2: { name: 'Bob', role: 'Designer' },\n      };\n      const found = mockUsers[userId];\n      if (found) {\n        setUser(found);\n      } else {\n        setError('User not found');\n      }\n      setLoading(false);\n    }, 1000);\n  }, [userId]);\n\n  React.useEffect(() => {\n    fetchUser();\n  }, [fetchUser]);\n\n  if (loading) return <div style={{ padding: 20, textAlign: 'center', fontFamily: 'sans-serif', color: '#6b7280' }}>⏳ Loading user...</div>;\n  if (error) return <div style={{ padding: 20, textAlign: 'center', fontFamily: 'sans-serif', color: '#dc2626' }}>❌ Error: {error}</div>;\n\n  return (\n    <div style={{ padding: 20, background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb', fontFamily: 'sans-serif', textAlign: 'center' }}>\n      <div style={{ fontSize: 40, marginBottom: 8 }}>👤</div>\n      <h3 style={{ margin: '0 0 4px', color: '#1f2937' }}>{user.name}</h3>\n      <p style={{ margin: 0, color: '#6b7280', fontSize: 14 }}>{user.role}</p>\n    </div>\n  );\n}\n\nfunction App() {\n  const [userId, setUserId] = React.useState(1);\n  return (\n    <div style={{ padding: 24, maxWidth: 400, margin: '0 auto' }}>\n      <h2 style={{ fontFamily: 'sans-serif', color: '#1f2937' }}>Mock API Demo</h2>\n      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>\n        <button onClick={() => setUserId(1)} style={{ padding: '6px 14px', background: userId === 1 ? '#6366f1' : '#e5e7eb', color: userId === 1 ? 'white' : '#374151', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Load Alice</button>\n        <button onClick={() => setUserId(2)} style={{ padding: '6px 14px', background: userId === 2 ? '#6366f1' : '#e5e7eb', color: userId === 2 ? 'white' : '#374151', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Load Bob</button>\n        <button onClick={() => setUserId(99)} style={{ padding: '6px 14px', background: userId === 99 ? '#ef4444' : '#e5e7eb', color: userId === 99 ? 'white' : '#374151', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Trigger Error</button>\n      </div>\n      <UserCard key={userId} userId={userId} />\n    </div>\n  );\n}\n\nReactDOM.render(<App />, document.getElementById('root'));`,
      },
      // ── Lesson 9.4 ──
      {
        id: 'testing-4',
        title: 'Best Practices & Code Organization',
        objectives: [
          'Organize React projects for maintainability',
          'Follow file structure conventions',
          'Apply common React best practices',
        ],
        takeaways: [
          'Group files by feature or domain, not by type',
          'Keep components small with single responsibility',
          'Use custom hooks to extract complex logic from components',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Writing Maintainable React</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Beyond just knowing the APIs, writing great React code requires good organization and patterns. Here are battle-tested best practices from the React community.</p>

          <div class="grid md:grid-cols-2 gap-4 my-6">
            <div class="bg-teal-50 border border-teal-200 rounded-xl p-5">
              <h4 class="font-bold text-teal-800 text-sm">📁 Feature-based Structure</h4>
              <pre class="text-xs text-teal-700 mt-2 bg-white p-3 rounded-lg">users/\n  UserList.js\n  UserProfile.js\n  useUsers.js\n  UserList.test.js</pre>
              <p class="text-xs text-teal-600 mt-1">Group by feature, not by file type!</p>
            </div>
            <div class="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
              <h4 class="font-bold text-indigo-800 text-sm">⚡ Key Principles</h4>
              <ul class="text-xs text-indigo-700 mt-2 space-y-1">
                <li>Single Responsibility Per Component</li>
                <li>Custom Hooks for Reusable Logic</li>
                <li>Early Returns to Reduce Nesting</li>
                <li>Destructure Props for Clarity</li>
                <li>Name Event Handlers with "handle" Prefix</li>
              </ul>
            </div>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-400 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Remember:</strong> There's no single "right" way to organize React code. The best structure is the one your team understands and can navigate easily. Consistency matters more than the specific pattern!</p>
          </div>
        `,
        defaultCode: `// Best practices showcase: clean component organization\n\n// Custom hook (would be in a separate file)\nfunction useFormFields(initialValues) {\n  const [values, setValues] = React.useState(initialValues);\n\n  const handleChange = React.useCallback((e) => {\n    const { name, value, type, checked } = e.target;\n    setValues(prev => ({\n      ...prev,\n      [name]: type === 'checkbox' ? checked : value\n    }));\n  }, []);\n\n  const reset = React.useCallback(() => {\n    setValues(initialValues);\n  }, [initialValues]);\n\n  return [values, handleChange, reset];\n}\n\n// Small, focused component\nfunction FormField({ label, name, type = 'text', value, onChange, error }) {\n  return (\n    <div style={{ marginBottom: 16 }}>\n      <label htmlFor={name} style={{ display: 'block', fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>\n        {label}\n      </label>\n      {type === 'textarea' ? (\n        <textarea id={name} name={name} value={value} onChange={onChange}\n          style={{ padding: 8, border: error ? '1px solid #ef4444' : '1px solid #d1d5db', borderRadius: 6, width: '100%', fontSize: 14 }} />\n      ) : (\n        <input id={name} name={name} type={type} value={value} onChange={onChange}\n          style={{ padding: 8, border: error ? '1px solid #ef4444' : '1px solid #d1d5db', borderRadius: 6, width: '100%', fontSize: 14 }} />\n      )}\n      {error && <p style={{ color: '#ef4444', fontSize: 12, margin: '2px 0 0' }}>{error}</p>}\n    </div>\n  );\n}\n\nfunction App() {\n  const [values, handleChange, reset] = useFormFields({ name: '', email: '', bio: '' });\n  const [submitted, setSubmitted] = React.useState(false);\n\n  // Derived validation\n  const errors = {};\n  if (!values.name.trim()) errors.name = 'Name is required';\n  if (!values.email.includes('@')) errors.email = 'Invalid email';\n  const isValid = Object.keys(errors).length === 0;\n\n  const handleSubmit = (e) => {\n    e.preventDefault();\n    if (!isValid) return;\n    setSubmitted(true);\n    setTimeout(() => { reset(); setSubmitted(false); }, 2000);\n  };\n\n  return (\n    <div style={{ padding: 24, fontFamily: 'sans-serif', maxWidth: 450, margin: '0 auto', background: '#f9fafb', borderRadius: 16 }}>\n      <h2 style={{ margin: '0 0 20px', color: '#1f2937' }}>🎯 Best Practices Demo</h2>\n      <form onSubmit={handleSubmit}>\n        <FormField label=\"Name\" name=\"name\" value={values.name} onChange={handleChange} error={errors.name} />\n        <FormField label=\"Email\" name=\"email\" type=\"email\" value={values.email} onChange={handleChange} error={errors.email} />\n        <FormField label=\"Bio\" name=\"bio\" type=\"textarea\" value={values.bio} onChange={handleChange} />\n        \n        <div style={{ display: 'flex', gap: 8 }}>\n          <button type=\"submit\" disabled={!isValid || submitted}\n            style={{\n              flex: 1, padding: '10px 24px', border: 'none', borderRadius: 8,\n              cursor: (isValid && !submitted) ? 'pointer' : 'not-allowed', fontWeight: 'bold',\n              background: (isValid && !submitted) ? '#6366f1' : '#c7d2fe',\n              color: (isValid && !submitted) ? 'white' : '#a5b4fc'\n            }}>\n            {submitted ? '✅ Submitted!' : 'Submit'}\n          </button>\n          <button type=\"button\" onClick={reset}\n            style={{ padding: '10px 16px', background: '#e5e7eb', border: 'none', borderRadius: 8, cursor: 'pointer' }}>\n            Reset\n          </button>\n        </div>\n      </form>\n      <div style={{ marginTop: 16, fontSize: 12, color: '#9ca3af' }}>\n        ✓ Custom hook for form logic<br />\n        ✓ Reusable FormField component<br />\n        ✓ Derived validation state<br />\n        ✓ Clean separation of concerns\n      </div>\n    </div>\n  );\n}\n\nReactDOM.render(<App />, document.getElementById('root'));`,
      },
    ],
    quiz: [
      {
        id: 'q-testing-1',
        question: 'What is the key philosophy of React Testing Library?',
        options: [
          'Test implementation details',
          'Test component behavior from a user perspective',
          'Test only snapshot matches',
          'Test only class components',
        ],
        correct: 1,
      },
      {
        id: 'q-testing-2',
        question: 'Which query should you prefer first for finding elements?',
        options: ['getByText', 'getByTestId', 'getByRole', 'querySelector'],
        correct: 2,
      },
      {
        id: 'q-testing-3',
        question: 'What should you do instead of making real API calls in tests?',
        options: ['Skip testing data-fetching components', 'Mock the fetch function', 'Use a real test database', 'Only test the UI, not data'],
        correct: 1,
      },
      {
        id: 'q-testing-4',
        question: 'What is the recommended way to organize React project files?',
        options: ['By file type (components/, hooks/, tests/)', 'By feature or domain', 'Alphabetically', 'By component size'],
        correct: 1,
      },
      {
        id: 'q-testing-5',
        question: 'What pattern is recommended for extracting reusable stateful logic?',
        options: ['Mixins', 'Custom Hooks', 'Class inheritance', 'Render props'],
        correct: 1,
      },
    ],
  },
];

// ─── STATE & PROGRESS ──────────────────────────────────────

let state = {
  activeModuleId: curriculum[0].id,
  activeLessonId: curriculum[0].lessons[0].id,
  activeTab: 'lesson',
  completedItems: [],
  quizAnswers: {},
};

function loadProgress() {
  try {
    const saved = localStorage.getItem('reactMasteryProgress');
    if (saved) state.completedItems = JSON.parse(saved);
  } catch (e) {
    /* ignore */
  }
}

function saveProgress() {
  try {
    localStorage.setItem('reactMasteryProgress', JSON.stringify(state.completedItems));
  } catch (e) {
    /* ignore */
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
  const pct = Math.round((state.completedItems.length / totalItems) * 100);
  const bar = document.getElementById('progress-bar');
  const text = document.getElementById('progress-text');
  if (bar) bar.style.width = `${pct}%`;
  if (text) text.innerText = `${pct}%`;
}

// ─── DOM REFERENCES ────────────────────────────────────────

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
};

// ─── INITIALIZATION ────────────────────────────────────────

function init() {
  loadProgress();
  updateProgressBar();
  setupEventListeners();
  renderSidebar();
  renderActiveState();
}

function setupEventListeners() {
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

  DOM.tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
  });

  DOM.runCodeBtn.addEventListener('click', runCode);

  DOM.codeEditor.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = this.selectionStart;
      const end = this.selectionEnd;
      this.value = this.value.substring(0, start) + '  ' + this.value.substring(end);
      this.selectionStart = this.selectionEnd = start + 2;
    }
  });
}

function switchTab(tabId) {
  state.activeTab = tabId;
  DOM.tabBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  DOM.tabContents.forEach((content) => {
    content.classList.remove('active', 'flex', 'md:flex');
  });
  const active = document.getElementById(`tab-${tabId}`);
  if (tabId === 'playground') {
    active.classList.add('active', 'flex', 'md:flex-row');
    if (!DOM.previewFrame.srcdoc) runCode();
  } else {
    active.classList.add('active');
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
  if (!mod) return;
  state.activeModuleId = moduleId;
  state.activeLessonId = mod.lessons[0].id;
  renderSidebar();
  renderActiveState();
  if (window.innerWidth < 1024) {
    DOM.sidebar.classList.add('-translate-x-full');
    DOM.sidebarOverlay.classList.add('hidden');
  }
}

function changeLesson(lessonId) {
  state.activeLessonId = lessonId;
  renderActiveState();
  switchTab('lesson');
}

// ─── RENDERING ─────────────────────────────────────────────

function renderSidebar() {
  DOM.moduleList.innerHTML = '';
  curriculum.forEach((mod) => {
    const isActive = mod.id === state.activeModuleId;
    const allLessonsDone = mod.lessons.every((l) => state.completedItems.includes(l.id));
    const quizDone = mod.quiz && mod.quiz.length > 0
      ? state.completedItems.includes(`${mod.id}-quiz`)
      : true;
    const isModuleComplete = allLessonsDone && quizDone;

    const li = document.createElement('li');

    // Module button
    const btn = document.createElement('button');
    btn.className = `w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${
      isActive
        ? 'bg-indigo-100 text-indigo-800 font-semibold border-l-4 border-indigo-500'
        : 'hover:bg-gray-100 text-gray-700 border-l-4 border-transparent'
    }`;
    btn.onclick = () => changeModule(mod.id);
    const textSpan = document.createElement('span');
    textSpan.className = 'truncate block text-sm';
    textSpan.innerText = mod.title;
    btn.appendChild(textSpan);
    if (isModuleComplete) {
      const icon = document.createElement('i');
      icon.className = 'fa-solid fa-check-circle text-emerald-500';
      btn.appendChild(icon);
    }
    li.appendChild(btn);

    // Lesson list for active module
    if (isActive) {
      const lessonList = document.createElement('ul');
      lessonList.className = 'ml-4 mt-1 space-y-1';
      mod.lessons.forEach((lesson) => {
        const isLessonActive = lesson.id === state.activeLessonId;
        const isLessonDone = state.completedItems.includes(lesson.id);
        const lLi = document.createElement('li');
        const lBtn = document.createElement('button');
        lBtn.className = `w-full flex items-center gap-2 p-2 rounded text-left text-xs transition-colors ${
          isLessonActive
            ? 'bg-indigo-50 text-indigo-700 font-medium'
            : 'hover:bg-gray-50 text-gray-600'
        }`;
        lBtn.onclick = (e) => {
          e.stopPropagation();
          changeLesson(lesson.id);
        };
        const bullet = document.createElement('span');
        bullet.className = isLessonDone ? 'text-emerald-500' : 'text-gray-300';
        bullet.innerHTML = isLessonDone ? '✓' : '○';
        lBtn.appendChild(bullet);
        const lText = document.createElement('span');
        lText.className = 'truncate';
        lText.innerText = lesson.title;
        lBtn.appendChild(lText);
        lLi.appendChild(lBtn);
        lessonList.appendChild(lLi);
      });
      li.appendChild(lessonList);
    }

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

  // Look up ELI5 content for this lesson
  const eli5Data = (window.eli5ReactData || {})[lesson.id] || '';

  // Build objectives and takeaways HTML
  const objectivesHtml = lesson.objectives
    ? `<div class="mb-6 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-xl p-5">
        <h4 class="text-sm font-bold text-sky-800 mb-3 flex items-center gap-2"><i class="fa-solid fa-bullseye text-sky-500"></i> Learning Objectives</h4>
        <ul class="space-y-2">${lesson.objectives.map(o => `<li class="text-sm text-sky-700 flex items-start gap-2"><i class="fa-solid fa-check-circle text-sky-400 mt-0.5 text-xs"></i>${o}</li>`).join('')}</ul>
       </div>`
    : '';

  const takeawaysHtml = lesson.takeaways
    ? `<div class="mb-6 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl p-5">
        <h4 class="text-sm font-bold text-teal-800 mb-3 flex items-center gap-2"><i class="fa-solid fa-gem text-teal-500"></i> Key Takeaways</h4>
        <ul class="space-y-2">${lesson.takeaways.map(t => `<li class="text-sm text-teal-700 flex items-start gap-2"><i class="fa-solid fa-circle-check text-teal-400 mt-0.5 text-xs"></i>${t}</li>`).join('')}</ul>
       </div>`
    : '';

  // Lesson navigation
  const mod = getActiveModule();
  const lessonIndex = mod.lessons.findIndex(l => l.id === lesson.id);
  const prevLesson = lessonIndex > 0 ? mod.lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < mod.lessons.length - 1 ? mod.lessons[lessonIndex + 1] : null;

  DOM.tabLesson.innerHTML = `
    <div class="max-w-3xl mx-auto animate-fade-in">
      <h2 class="text-3xl font-bold text-gray-900 mb-6">${lesson.title}</h2>
      ${objectivesHtml}
      <div class="prose max-w-none text-gray-800 lesson-content">
        ${window.eli5Toggle ? window.eli5Toggle.wrapContent(lesson.content, eli5Data) : lesson.content}
      </div>
      ${takeawaysHtml}
      
      <div class="mt-12 pt-6 border-t border-gray-200 flex items-center justify-between">
        <div>
          ${prevLesson ? `<button id="prev-lesson-btn" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"><i class="fa-solid fa-arrow-left mr-1"></i> ${prevLesson.title}</button>` : ''}
        </div>
        <div class="flex items-center gap-3">
          ${nextLesson ? `<button id="next-lesson-btn" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">${nextLesson.title} <i class="fa-solid fa-arrow-right ml-1"></i></button>` : ''}
          <button id="mark-lesson-complete" class="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
            isCompleted
              ? 'bg-emerald-100 text-emerald-700 cursor-default'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
          }">
            ${isCompleted ? '<i class="fa-solid fa-check"></i> Completed' : 'Mark Complete & Try Playground'}
          </button>
        </div>
      </div>
    </div>
  `;

  // ELI5 toggle
  if (window.eli5Toggle) {
    window.eli5Toggle.initToggle('react', DOM.tabLesson);
  }

  // Wire up buttons
  const markBtn = document.getElementById('mark-lesson-complete');
  if (!isCompleted && markBtn) {
    markBtn.addEventListener('click', () => {
      markItemComplete(lesson.id);
      renderLesson(lesson);
      switchTab('playground');
    });
  }

  if (prevLesson) {
    document.getElementById('prev-lesson-btn')?.addEventListener('click', () => changeLesson(prevLesson.id));
  }
  if (nextLesson) {
    document.getElementById('next-lesson-btn')?.addEventListener('click', () => changeLesson(nextLesson.id));
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
      <div class="mb-8 border-b pb-4 flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-bold text-gray-900">Module Quiz</h2>
          <p class="text-sm text-gray-500 mt-1">${mod.quiz.length} questions</p>
        </div>
        ${isCompleted ? '<span class="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full text-sm font-semibold"><i class="fa-solid fa-check"></i> Passed</span>' : ''}
      </div>
      <div id="quiz-questions-container" class="space-y-6">
  `;

  mod.quiz.forEach((q, index) => {
    html += `
      <div class="bg-white border rounded-xl p-6 shadow-sm">
        <h4 class="font-semibold text-lg text-gray-800 mb-4">
          <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold mr-3">${index + 1}</span>
          ${q.question}
        </h4>
        <div class="space-y-3">
    `;
    q.options.forEach((opt, optIdx) => {
      const isSelected = state.quizAnswers[q.id] === optIdx;
      html += `
        <label class="flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50 border-indigo-400' : 'hover:bg-gray-50 border-gray-200'}">
          <input type="radio" name="quiz-${q.id}" value="${optIdx}" class="form-radio text-indigo-600 h-5 w-5 focus:ring-indigo-500" ${isSelected ? 'checked' : ''} onchange="window.handleQuizSelection('${q.id}', ${optIdx})">
          <span class="ml-3 text-gray-700 text-sm">${opt}</span>
        </label>
      `;
    });
    html += `</div></div>`;
  });

  html += `
      </div>
      <div class="mt-8 flex flex-col items-center border-t pt-8">
        <button id="submit-quiz-btn" class="px-8 py-3 rounded-lg font-bold text-lg text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all hover:shadow-lg active:scale-95">Submit Answers</button>
        <div id="quiz-feedback" class="mt-4 text-lg font-bold hidden"></div>
      </div>
    </div>
  `;

  DOM.tabQuiz.innerHTML = html;

  document.getElementById('submit-quiz-btn').addEventListener('click', () => {
    let score = 0;
    let allAnswered = true;
    mod.quiz.forEach((q) => {
      if (state.quizAnswers[q.id] === undefined) allAnswered = false;
      else if (state.quizAnswers[q.id] === q.correct) score++;
    });

    const fb = document.getElementById('quiz-feedback');
    fb.classList.remove('hidden', 'text-red-600', 'text-green-600');

    if (!allAnswered) {
      fb.innerText = 'Please answer all questions before submitting.';
      fb.classList.add('text-red-600');
      return;
    }

    if (score === mod.quiz.length) {
      fb.innerHTML = '<i class="fa-solid fa-trophy mr-1"></i> Perfect! You passed all questions.';
      fb.classList.add('text-green-600');
      markItemComplete(quizId);
      renderSidebar();
    } else {
      fb.innerText = `You scored ${score} out of ${mod.quiz.length}. Try again!`;
      fb.classList.add('text-red-600');
    }
  });
}

// Global quiz handler
window.handleQuizSelection = function (questionId, optionIndex) {
  state.quizAnswers[questionId] = optionIndex;
  renderQuiz(getActiveModule());
};

// ─── REACT PLAYGROUND ENGINE ───────────────────────────────

function runCode() {
  const userCode = DOM.codeEditor.value;
  const iframeContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { margin: 0; padding: 0; font-family: sans-serif; background: #ffffff; color: #333; }
        #error-boundary { color: #dc2626; background: #fee2e2; padding: 15px; border-radius: 5px; margin: 10px; font-family: monospace; white-space: pre-wrap; }
      </style>
      <script crossorigin src="https://cdn.jsdelivr.net/npm/react@17/umd/react.development.js"><\/script>
      <script crossorigin src="https://cdn.jsdelivr.net/npm/react-dom@17/umd/react-dom.development.js"><\/script>
      <script crossorigin src="https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js"><\/script>
    </head>
    <body>
      <div id="root"></div>
      <div id="error-container"></div>
      <script>
        window.onerror = function(msg) {
          document.getElementById('error-container').innerHTML = '<div id="error-boundary"><strong>Runtime Error:</strong><br/>' + msg + '</div>';
          return false;
        };
      <\/script>
      <script type="text/babel">
        try {
          ${userCode}
        } catch(e) {
          document.getElementById('error-container').innerHTML = '<div id="error-boundary"><strong>Compilation Error:</strong><br/>' + e.message + '</div>';
        }
      <\/script>
    </body>
    </html>
  `;
  DOM.previewFrame.srcdoc = iframeContent;
}

// Start the app
init();
