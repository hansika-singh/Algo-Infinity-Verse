// --- Vue.js Learning Hub Curriculum Data ---
const curriculum = [
  // ─── Module 1: Vue Basics & Reactivity (5 lessons) ───
  {
    id: 'basics',
    title: 'Vue Basics & Reactivity',
    lessons: [
      {
        id: 'basics-1',
        title: 'Introduction to Vue 3',
        objectives: [
          'Understand what Vue.js is and why it\'s called a "progressive framework"',
          'Learn how Vue enhances HTML with declarative rendering',
          'Write a basic Vue 3 component using the Composition API',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">The Progressive Framework</h3>

          <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6 rounded-r-lg">
            <p class="text-indigo-800 font-medium"><i class="fa-solid fa-bullseye mr-2"></i><strong>Learning Objectives:</strong></p>
            <ul class="text-indigo-700 text-sm mt-1 space-y-1 ml-6 list-disc">
              <li>Understand what Vue.js is and why it's called a "progressive framework"</li>
              <li>Learn how Vue enhances HTML with declarative rendering</li>
              <li>Write a basic Vue 3 component using the Composition API</li>
            </ul>
          </div>

          <p class="mb-4 text-gray-700 leading-relaxed">Vue (pronounced "view") is a JavaScript framework for building user interfaces. What makes it special is that it's <strong>progressive</strong> — you can use a little bit of Vue in an existing project, or use it to build an entire app from scratch. It grows with your needs!</p>

          <p class="mb-4 text-gray-700 leading-relaxed">Vue builds on top of standard HTML, CSS, and JavaScript and provides a <strong>declarative</strong> and <strong>component-based</strong> programming model. Instead of telling Vue HOW to do something step by step, you tell it WHAT you want, and it figures out the rest.</p>

          <div class="bg-emerald-50 border-l-4 border-emerald-500 p-4 my-6 rounded-r-lg">
            <p class="text-emerald-800 font-medium"><i class="fa-solid fa-circle-info mr-2"></i><strong>Key Insight:</strong> Declarative vs Imperative</p>
            <p class="text-emerald-700 text-sm mt-1">Imperative (vanilla JS): "Get that element, create a new text node, set its value, append it as a child..." <br>Declarative (Vue): "This text should always show the current count." Vue handles the rest!</p>
          </div>

          <p class="mb-4 text-gray-700 leading-relaxed">With the <strong>Composition API</strong> (Vue 3), you declare reactive state using <code>ref()</code> or <code>reactive()</code>. The UI automatically updates when this state changes — no manual DOM manipulation needed!</p>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>Your First Vue Component</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>&lt;script setup&gt;
import { ref } from 'vue'

const count = ref(0)
const message = ref('Hello Vue!')
&lt;/script&gt;

&lt;template&gt;
  &lt;div class="welcome"&gt;
    &lt;h1&gt;{{ message }}&lt;/h1&gt;
    &lt;p&gt;Count: {{ count }}&lt;/p&gt;
    &lt;button @click="count++"&gt;+1&lt;/button&gt;
  &lt;/div&gt;
&lt;/template&gt;</code></pre>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-500 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Pro Tip:</strong></p>
            <p class="text-amber-700 text-sm mt-1">The double curly braces <code>{{ }}</code> are Vue's "mustache" syntax. Anything inside them is evaluated as JavaScript. You can put expressions like <code>{{ count + 1 }}</code> or <code>{{ message.toUpperCase() }}</code>!</p>
          </div>

          <div class="bg-emerald-50 border-l-4 border-emerald-500 p-4 my-6 rounded-r-lg">
            <p class="text-emerald-800 font-medium"><i class="fa-solid fa-circle-info mr-2"></i>Head over to the <strong>Playground & Code</strong> tab and click "Run Code" to compile your first Vue component!</p>
          </div>

          <div class="mt-8 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
            <h4 class="font-bold text-emerald-800 mb-2"><i class="fa-solid fa-check-circle mr-2"></i>Summary Takeaways</h4>
            <ul class="text-emerald-700 text-sm space-y-1 ml-6 list-disc">
              <li>Vue is a progressive framework — use as much or as little as you need</li>
              <li>Declarative rendering means you describe the UI, Vue handles the DOM</li>
              <li>The Composition API (setup()) is the modern way to write Vue 3 components</li>
              <li>ref() creates reactive values that trigger UI updates automatically</li>
              <li>Mustache syntax {{ }} lets you embed JS expressions in templates</li>
            </ul>
          </div>
        `,
        defaultCode: `<div id="app" class="p-6 text-center space-y-4 font-sans bg-white rounded-xl shadow-sm border border-emerald-100 max-w-sm mx-auto">
  <div class="p-3 bg-emerald-100 rounded-full inline-block">
    <i class="fa-brands fa-vuejs text-4xl text-emerald-600"></i>
  </div>
  <h1 class="text-2xl font-bold text-slate-800">Vue Reactivity</h1>
  <p class="text-gray-500 text-sm">Vue's reactivity system tracks dependencies automatically.</p>

  <div class="text-3xl font-extrabold text-emerald-600 font-mono py-2">
    Count: {{ count }}
  </div>

  <button @click="increment" class="px-5 py-2.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors font-bold shadow-sm text-sm">
    Increment Counter
  </button>
</div>

<script type="module">
  import { createApp, ref } from 'vue'

  createApp({
    setup() {
      const count = ref(0)

      function increment() {
        count.value++
      }

      return { count, increment }
    }
  }).mount('#app')
</script>`,
      },
      {
        id: 'basics-2',
        title: 'Reactive State with ref()',
        objectives: [
          'Understand how ref() wraps primitives in reactive objects',
          'Learn to read and update ref values using .value',
          'See how Vue tracks dependencies and auto-renders',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Deep Dive into ref()</h3>

          <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6 rounded-r-lg">
            <p class="text-indigo-800 font-medium"><i class="fa-solid fa-bullseye mr-2"></i><strong>Learning Objectives:</strong></p>
            <ul class="text-indigo-700 text-sm mt-1 space-y-1 ml-6 list-disc">
              <li>Understand how ref() wraps primitives in reactive objects</li>
              <li>Learn to read and update ref values using .value</li>
              <li>See how Vue tracks dependencies and auto-renders</li>
            </ul>
          </div>

          <p class="mb-4 text-gray-700 leading-relaxed">In Vue 3, <code>ref()</code> is the primary way to create reactive state. It takes any value (number, string, boolean, array, object) and wraps it in a reactive object with a <code>.value</code> property.</p>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>ref() in Action</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>import { ref } from 'vue'

const count = ref(0)        // { value: 0 }
const name = ref('Alice')   // { value: 'Alice' }
const isReady = ref(false)  // { value: false }

// Reading
console.log(count.value)    // 0

// Updating
count.value = 5
name.value = 'Bob'

// Auto-reactivity — the UI updates!</code></pre>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-500 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>How It Works:</strong></p>
            <p class="text-amber-700 text-sm mt-1">Vue uses JavaScript's <code>Proxy</code> to intercept reads and writes. When your template reads <code>count</code>, Vue notes "this component depends on count." When count changes, Vue knows exactly which components to re-render — like a smart to-do list that only updates the items that changed!</p>
          </div>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>Common Patterns</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>// Toggle boolean
const isOpen = ref(false)
function toggle() { isOpen.value = !isOpen.value }

// Array manipulation
const items = ref(['a', 'b', 'c'])
items.value.push('d')       // reactivity works!
items.value = []            // full reset

// Object inside ref
const user = ref({ name: 'Alice', age: 30 })
user.value.age = 31         // reactive!
user.value = { name: 'Bob', age: 25 }  // full replace</code></pre>
          </div>

          <div class="bg-emerald-50 border-l-4 border-emerald-500 p-4 my-6 rounded-r-lg">
            <p class="text-emerald-800 font-medium"><i class="fa-solid fa-circle-info mr-2"></i><strong>Pro Tip:</strong> In templates, Vue automatically unwraps refs — you write <code>{{ count }}</code> not <code>{{ count.value }}</code>. But in <code>setup()</code> or script, you ALWAYS need <code>.value</code>!</p>
          </div>

          <div class="mt-8 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
            <h4 class="font-bold text-emerald-800 mb-2"><i class="fa-solid fa-check-circle mr-2"></i>Summary Takeaways</h4>
            <ul class="text-emerald-700 text-sm space-y-1 ml-6 list-disc">
              <li>ref() wraps any value in a reactive object with a .value property</li>
              <li>Always use .value in JavaScript; templates auto-unwrap</li>
              <li>Vue's Proxy-based reactivity tracks dependencies precisely</li>
              <li>Arrays and objects inside ref() are fully reactive</li>
              <li>Direct mutations (push, splice, property assignment) are detected!</li>
            </ul>
          </div>
        `,
        defaultCode: `<div id="app" class="p-6 bg-white border border-gray-200 rounded-xl shadow-sm max-w-sm mx-auto space-y-4">
  <h2 class="text-xl font-bold text-gray-800 text-center">ref() Demo</h2>

  <div class="text-center space-y-2">
    <p class="text-gray-600 text-sm">Count: <strong class="text-emerald-600 text-2xl font-mono">{{ count }}</strong></p>
    <div class="flex justify-center gap-2">
      <button @click="count--" class="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 font-bold">-</button>
      <button @click="reset" class="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-bold">Reset</button>
      <button @click="count++" class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-bold">+</button>
    </div>
  </div>

  <div class="border-t pt-4">
    <p class="text-gray-600 text-sm mb-2">Your Name:</p>
    <input v-model="name" class="w-full p-2 border rounded-lg text-sm" placeholder="Enter your name" />
    <p class="mt-2 text-sm text-gray-600">Hello, <strong class="text-emerald-600">{{ name }}</strong>!</p>
  </div>
</div>

<script type="module">
  import { createApp, ref } from 'vue'

  createApp({
    setup() {
      const count = ref(0)
      const name = ref('Vue Learner')

      function reset() { count.value = 0 }

      return { count, name, reset }
    }
  }).mount('#app')
</script>`,
      },
      {
        id: 'basics-3',
        title: 'Reactive Objects with reactive()',
        objectives: [
          'Learn how reactive() creates deeply reactive objects',
          'Understand when to use reactive() vs ref()',
          'Work with nested reactive objects and arrays',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Deep Dive into reactive()</h3>

          <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6 rounded-r-lg">
            <p class="text-indigo-800 font-medium"><i class="fa-solid fa-bullseye mr-2"></i><strong>Learning Objectives:</strong></p>
            <ul class="text-indigo-700 text-sm mt-1 space-y-1 ml-6 list-disc">
              <li>Learn how reactive() creates deeply reactive objects</li>
              <li>Understand when to use reactive() vs ref()</li>
              <li>Work with nested reactive objects and arrays</li>
            </ul>
          </div>

          <p class="mb-4 text-gray-700 leading-relaxed">While <code>ref()</code> is great for primitives, <code>reactive()</code> is designed for objects. It takes a plain JavaScript object and returns a deeply reactive proxy — no <code>.value</code> needed!</p>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>reactive() vs ref()</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>import { reactive, ref } from 'vue'

// reactive() — for objects
const state = reactive({
  count: 0,
  name: 'Vue',
  todos: ['Learn Vue', 'Build app']
})
state.count++  // no .value needed!
state.todos.push('Deploy')  // deeply reactive

// ref() — for primitives
const count = ref(0)    // number
const name = ref('Vue')  // string

// ref() can also hold objects
const obj = ref({ count: 0 })
obj.value.count++  // need .value for ref</code></pre>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-500 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>When to Use Which:</strong></p>
            <ul class="text-amber-700 text-sm mt-1 ml-6 list-disc">
              <li><strong>ref()</strong> — numbers, strings, booleans, or when you need to reassign the whole value</li>
              <li><strong>reactive()</strong> — objects with multiple properties, nested data, or forms</li>
              <li><strong>ref() + object</strong> — when you need to replace the entire object (reassign)</li>
              <li><strong>reactive()</strong> — cannot be reassigned (you modify properties, not the variable)</li>
            </ul>
          </div>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>Practical: User Profile</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>const user = reactive({
  profile: {
    name: 'Alice',
    email: 'alice@example.com',
    avatar: null
  },
  settings: {
    theme: 'dark',
    notifications: true
  },
  posts: []
})

// Deep reactivity — nested changes are tracked!
user.profile.name = 'Bob'        // triggers re-render
user.posts.push({ title: 'Hi' }) // triggers re-render
user.settings.theme = 'light'    // triggers re-render</code></pre>
          </div>

          <div class="bg-emerald-50 border-l-4 border-emerald-500 p-4 my-6 rounded-r-lg">
            <p class="text-emerald-800 font-medium"><i class="fa-solid fa-circle-info mr-2"></i><strong>Limitation:</strong> You cannot "replace" a reactive() object entirely (e.g., <code>state = newObj</code>). For that, use <code>ref()</code> around an object or use <code>Object.assign()</code>.</p>
          </div>

          <div class="mt-8 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
            <h4 class="font-bold text-emerald-800 mb-2"><i class="fa-solid fa-check-circle mr-2"></i>Summary Takeaways</h4>
            <ul class="text-emerald-700 text-sm space-y-1 ml-6 list-disc">
              <li>reactive() creates deeply reactive objects without .value</li>
              <li>Use reactive() for objects with multiple properties (forms, configs, user data)</li>
              <li>Use ref() for primitives (numbers, booleans, strings)</li>
              <li>reactive() cannot be reassigned; modify properties directly</li>
              <li>Both ref() and reactive() provide deep reactivity</li>
            </ul>
          </div>
        `,
        defaultCode: `<div id="app" class="p-6 bg-white border border-gray-200 rounded-xl shadow-sm max-w-md mx-auto space-y-4">
  <h2 class="text-xl font-bold text-gray-800 text-center">User Profile (reactive)</h2>

  <div class="text-center">
    <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
      <i class="fa-solid fa-user text-2xl text-emerald-600"></i>
    </div>
    <h3 class="font-bold text-gray-800 mt-2">{{ user.name }}</h3>
    <p class="text-gray-500 text-sm">{{ user.email }}</p>
    <span class="inline-block mt-1 px-2 py-0.5 text-xs rounded-full" :class="user.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
      {{ user.active ? 'Active' : 'Inactive' }}
    </span>
  </div>

  <div class="border-t pt-4 space-y-3">
    <div>
      <label class="text-xs font-bold text-gray-500 uppercase">Name</label>
      <input v-model="user.name" class="w-full p-2 border rounded-lg text-sm mt-1" />
    </div>
    <div>
      <label class="text-xs font-bold text-gray-500 uppercase">Email</label>
      <input v-model="user.email" class="w-full p-2 border rounded-lg text-sm mt-1" />
    </div>
    <label class="flex items-center gap-2 text-sm">
      <input type="checkbox" v-model="user.active" class="form-checkbox text-emerald-600" />
      Active
    </label>
  </div>
</div>

<script type="module">
  import { createApp, reactive } from 'vue'

  createApp({
    setup() {
      const user = reactive({
        name: 'Vue Learner',
        email: 'learner@vue.com',
        active: true
      })

      return { user }
    }
  }).mount('#app')
</script>`,
      },
      {
        id: 'basics-4',
        title: 'Computed Properties',
        objectives: [
          'Understand how computed() derives values from reactive state',
          'Learn the caching behavior of computed properties',
          'Build a practical example with derived data',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Derived State with computed()</h3>

          <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6 rounded-r-lg">
            <p class="text-indigo-800 font-medium"><i class="fa-solid fa-bullseye mr-2"></i><strong>Learning Objectives:</strong></p>
            <ul class="text-indigo-700 text-sm mt-1 space-y-1 ml-6 list-disc">
              <li>Understand how computed() derives values from reactive state</li>
              <li>Learn the caching behavior of computed properties</li>
              <li>Build a practical example with derived data</li>
            </ul>
          </div>

          <p class="mb-4 text-gray-700 leading-relaxed">Sometimes you need a value that's <strong>derived</strong> from other state — like a full name from first + last, or a filtered list from a full list. <code>computed()</code> is the answer!</p>

          <p class="mb-4 text-gray-700 leading-relaxed">Computed properties are <strong>lazy caches</strong>: they only re-evaluate when their dependencies change. If no dependency changed, Vue returns the cached result — super efficient!</p>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>Computed in Practice</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>import { ref, computed } from 'vue'

const firstName = ref('John')
const lastName = ref('Doe')

// Computed — like a vending machine
const fullName = computed(() => {
  return firstName.value + ' ' + lastName.value
})

const items = ref([
  { name: 'Apple', price: 1.5 },
  { name: 'Banana', price: 0.75 },
  { name: 'Cherry', price: 2.0 }
])

const totalPrice = computed(() => {
  return items.value.reduce((sum, item) => sum + item.price, 0)
})

const expensiveItems = computed(() => {
  return items.value.filter(item => item.price > 1)
})</code></pre>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-500 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Why Not Just Use a Function?</strong></p>
            <p class="text-amber-700 text-sm mt-1">A regular function re-runs EVERY time the template re-renders. A computed property only re-runs when its DEPENDENCIES change. If you have 10 components using the same computed value, it's calculated once — a function would calculate it 10 times!</p>
          </div>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>Shopping Cart Example</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>const cart = reactive({
  items: [
    { id: 1, name: 'T-shirt', price: 20, qty: 2 },
    { id: 2, name: 'Jeans', price: 50, qty: 1 },
  ]
})

const subtotal = computed(() =>
  cart.items.reduce((sum, i) => sum + i.price * i.qty, 0)
)
const tax = computed(() => subtotal.value * 0.08)
const total = computed(() => subtotal.value + tax.value)</code></pre>
          </div>

          <div class="mt-8 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
            <h4 class="font-bold text-emerald-800 mb-2"><i class="fa-solid fa-check-circle mr-2"></i>Summary Takeaways</h4>
            <ul class="text-emerald-700 text-sm space-y-1 ml-6 list-disc">
              <li>computed() derives values from existing state with caching</li>
              <li>Only re-evaluates when dependencies change — super efficient</li>
              <li>Use computed for filter/sort/map operations on reactive data</li>
              <li>Computed properties are read-only by default (don't try to assign to them!)</li>
              <li>Prefer computed over method calls for values used in templates</li>
            </ul>
          </div>
        `,
        defaultCode: `<div id="app" class="p-6 bg-white border border-gray-200 rounded-xl shadow-sm max-w-sm mx-auto space-y-4">
  <h2 class="text-xl font-bold text-gray-800 text-center">Shopping Cart</h2>

  <div class="space-y-2">
    <div v-for="(item, i) in cart" :key="i" class="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
      <span class="text-sm text-gray-700">{{ item.name }}</span>
      <div class="flex items-center gap-2">
        <button @click="item.qty--" class="w-6 h-6 bg-gray-200 rounded flex items-center justify-center text-sm font-bold hover:bg-gray-300">-</button>
        <span class="text-sm font-mono w-6 text-center">{{ item.qty }}</span>
        <button @click="item.qty++" class="w-6 h-6 bg-emerald-200 text-emerald-700 rounded flex items-center justify-center text-sm font-bold hover:bg-emerald-300">+</button>
      </div>
      <span class="text-sm font-mono">\${{ (item.price * item.qty).toFixed(2) }}</span>
    </div>
  </div>

  <div class="border-t pt-3 space-y-1 text-sm">
    <div class="flex justify-between"><span class="text-gray-500">Subtotal</span><span class="font-mono">\${{ subtotal.toFixed(2) }}</span></div>
    <div class="flex justify-between"><span class="text-gray-500">Tax (8%)</span><span class="font-mono">\${{ tax.toFixed(2) }}</span></div>
    <div class="flex justify-between font-bold text-emerald-700"><span>Total</span><span class="font-mono">\${{ total.toFixed(2) }}</span></div>
  </div>
</div>

<script type="module">
  import { createApp, reactive, computed } from 'vue'

  createApp({
    setup() {
      const cart = reactive([
        { name: 'Vue T-Shirt', price: 24.99, qty: 1 },
        { name: 'Sticker Pack', price: 5.99, qty: 2 },
        { name: 'Coffee Mug', price: 14.99, qty: 1 },
      ])

      const subtotal = computed(() => cart.reduce((s, i) => s + i.price * i.qty, 0))
      const tax = computed(() => subtotal.value * 0.08)
      const total = computed(() => subtotal.value + tax.value)

      return { cart, subtotal, tax, total }
    }
  }).mount('#app')
</script>`,
      },
      {
        id: 'basics-5',
        title: 'Watchers',
        objectives: [
          'Use watch() to perform side effects on state changes',
          'Understand the difference between watch and watchEffect',
          'Handle deep watching and immediate execution',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Reacting to Changes with watch()</h3>

          <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6 rounded-r-lg">
            <p class="text-indigo-800 font-medium"><i class="fa-solid fa-bullseye mr-2"></i><strong>Learning Objectives:</strong></p>
            <ul class="text-indigo-700 text-sm mt-1 space-y-1 ml-6 list-disc">
              <li>Use watch() to perform side effects on state changes</li>
              <li>Understand the difference between watch and watchEffect</li>
              <li>Handle deep watching and immediate execution</li>
            </ul>
          </div>

          <p class="mb-4 text-gray-700 leading-relaxed">While <code>computed()</code> produces a value, <code>watch()</code> performs <strong>side effects</strong> — like saving to localStorage, making API calls, or logging. Think of it as "do this when something changes."</p>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>Basic Watch</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>import { ref, watch } from 'vue'

const searchQuery = ref('')

// Watch a single ref
watch(searchQuery, (newVal, oldVal) => {
  console.log('Search changed from', oldVal, 'to', newVal)
  // Fetch search results from API
  fetchResults(newVal)
})

// Watch multiple sources
watch([firstName, lastName], ([newFirst, newLast], [oldFirst, oldLast]) => {
  console.log('Name changed:', oldFirst, '→', newFirst)
})</code></pre>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-500 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>watch vs watchEffect:</strong></p>
            <ul class="text-amber-700 text-sm mt-1 ml-6 list-disc">
              <li><strong>watch()</strong> — explicitly specify what to watch; get old + new values</li>
              <li><strong>watchEffect()</strong> — auto-track whatever reactive data is used inside; runs immediately</li>
              <li>Use watch() when you need the old value or lazy watching</li>
              <li>Use watchEffect() for simple side effects that auto-detect dependencies</li>
            </ul>
          </div>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>Watch Options</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>// Deep watch — detects nested changes
watch(user, (newUser) => {
  saveToLocalStorage(newUser)
}, { deep: true })

// Immediate — run the watch function immediately on setup
watch(searchQuery, (val) => {
  fetchResults(val)
}, { immediate: true })

// Practical: save to localStorage
watch(todos, (val) => {
  localStorage.setItem('todos', JSON.stringify(val))
}, { deep: true })</code></pre>
          </div>

          <div class="bg-emerald-50 border-l-4 border-emerald-500 p-4 my-6 rounded-r-lg">
            <p class="text-emerald-800 font-medium"><i class="fa-solid fa-circle-info mr-2"></i><strong>Cleanup:</strong> watch() returns a stop function — call it to stop watching: <code>const stop = watch(...); stop()</code>. This is useful for conditional watching!</p>
          </div>

          <div class="mt-8 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
            <h4 class="font-bold text-emerald-800 mb-2"><i class="fa-solid fa-check-circle mr-2"></i>Summary Takeaways</h4>
            <ul class="text-emerald-700 text-sm space-y-1 ml-6 list-disc">
              <li>watch() performs side effects when reactive state changes</li>
              <li>Access both old and new values in the callback</li>
              <li>Use { deep: true } for nested object changes</li>
              <li>Use { immediate: true } to run on initialization</li>
              <li>watchEffect() auto-tracks dependencies; watch() is explicit</li>
            </ul>
          </div>
        `,
        defaultCode: `<div id="app" class="p-6 bg-white border border-gray-200 rounded-xl shadow-sm max-w-sm mx-auto space-y-4">
  <h2 class="text-xl font-bold text-gray-800 text-center">Watch Demo</h2>

  <div>
    <label class="text-xs font-bold text-gray-500 uppercase block mb-1">Search</label>
    <input v-model="searchQuery" class="w-full p-2 border rounded-lg text-sm" placeholder="Type to search..." />
    <p class="text-xs text-gray-400 mt-1">Characters: {{ searchQuery.length }}</p>
  </div>

  <div class="p-3 bg-gray-50 rounded-lg text-sm">
    <p class="font-bold text-gray-600 mb-1">Change Log:</p>
    <p class="text-emerald-600">{{ log }}</p>
  </div>

  <div class="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
    <span class="text-sm text-gray-700">Counter:</span>
    <div class="flex items-center gap-2">
      <button @click="counter--" class="w-8 h-8 bg-gray-200 rounded flex items-center justify-center font-bold hover:bg-gray-300">-</button>
      <span class="font-mono w-8 text-center font-bold">{{ counter }}</span>
      <button @click="counter++" class="w-8 h-8 bg-emerald-200 rounded flex items-center justify-center font-bold hover:bg-emerald-300">+</button>
    </div>
  </div>

  <div class="text-sm text-gray-500" v-if="counter > 10">
    <i class="fa-solid fa-bell mr-1 text-amber-500"></i>
    Counter is high! Consider resetting.
  </div>
</div>

<script type="module">
  import { createApp, ref, watch } from 'vue'

  createApp({
    setup() {
      const searchQuery = ref('')
      const counter = ref(0)
      const log = ref('Waiting for changes...')

      watch(searchQuery, (val) => {
        log.value = 'Search changed to: "' + val + '"'
      })

      watch(counter, (val, oldVal) => {
        log.value = 'Counter: ' + oldVal + ' → ' + val
      })

      return { searchQuery, counter, log }
    }
  }).mount('#app')
</script>`,
      },
    ],
    quiz: [
      {
        id: 'q-basics-1',
        question: 'Which function is used to create reactive state for primitives in Vue 3 Composition API?',
        options: ['reactive()', 'useState()', 'ref()', 'createState()'],
        correct: 2,
        explanation: 'ref() wraps a primitive value in a reactive object with a .value property.',
      },
      {
        id: 'q-basics-2',
        question: 'How do you access the value of a ref() inside the setup() function?',
        options: ['myRef.current', 'myRef.value', 'myRef.get()', '$myRef'],
        correct: 1,
        explanation: 'In JavaScript, ref values are accessed via .value. In templates, Vue auto-unwraps them.',
      },
      {
        id: 'q-basics-3',
        question: 'What is the key difference between ref() and reactive()?',
        options: [
          'ref() is slower than reactive()',
          'ref() uses .value to access the value; reactive() does not',
          'reactive() only works with numbers',
          'ref() cannot be used in templates',
        ],
        correct: 1,
        explanation: 'ref() requires .value in JavaScript code, while reactive() properties are accessed directly.',
      },
      {
        id: 'q-basics-4',
        question: 'When does a computed() property re-evaluate?',
        options: [
          'Every time the component re-renders',
          'Only when its reactive dependencies change',
          'Every millisecond automatically',
          'Only when explicitly called as a function',
        ],
        correct: 1,
        explanation: 'computed() caches its result and only re-evaluates when its tracked dependencies change.',
      },
      {
        id: 'q-basics-5',
        question: 'What does the { deep: true } option do in watch()?',
        options: [
          'Makes the watcher run deeper in the call stack',
          'Detects nested property changes inside objects',
          'Runs the watch callback immediately',
          'Prevents the watch from being stopped',
        ],
        correct: 1,
        explanation: 'deep: true enables detection of changes inside nested objects and arrays.',
      },
    ],
  },

  // ─── Module 2: Template Directives (5 lessons) ───
  {
    id: 'directives',
    title: 'Template Directives',
    lessons: [
      {
        id: 'directives-1',
        title: 'Conditionals with v-if and v-for Lists',
        objectives: [
          'Use v-if, v-else-if, and v-else for conditional rendering',
          'Render lists dynamically with v-for',
          'Combine v-if and v-for correctly',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Declarative Rendering with Directives</h3>

          <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6 rounded-r-lg">
            <p class="text-indigo-800 font-medium"><i class="fa-solid fa-bullseye mr-2"></i><strong>Learning Objectives:</strong></p>
            <ul class="text-indigo-700 text-sm mt-1 space-y-1 ml-6 list-disc">
              <li>Use v-if, v-else-if, and v-else for conditional rendering</li>
              <li>Render lists dynamically with v-for</li>
              <li>Combine v-if and v-for correctly</li>
            </ul>
          </div>

          <p class="mb-4 text-gray-700 leading-relaxed">Vue uses HTML-based template syntax. Directives are special attributes with the <code>v-</code> prefix that tell Vue to do something special with that DOM element.</p>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>v-if Conditional Chains</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>&lt;div v-if="score >= 90" class="grade-a"&gt;A - Excellent!&lt;/div&gt;
&lt;div v-else-if="score >= 80" class="grade-b"&gt;B - Good job!&lt;/div&gt;
&lt;div v-else-if="score >= 70" class="grade-c"&gt;C - Keep trying!&lt;/div&gt;
&lt;div v-else class="grade-f"&gt;Need improvement&lt;/div&gt;

&lt;!-- v-for with :key --&gt;
&lt;ul&gt;
  &lt;li v-for="(item, index) in items" :key="item.id"&gt;
    {{ index + 1 }}. {{ item.name }}
  &lt;/li&gt;
&lt;/ul&gt;

&lt;!-- v-for over an object --&gt;
&lt;div v-for="(value, key) in user" :key="key"&gt;
  {{ key }}: {{ value }}
&lt;/div&gt;</code></pre>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-500 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Key is Important!</strong></p>
            <p class="text-amber-700 text-sm mt-1">Always use <code>:key</code> with <code>v-for</code>. It helps Vue identify which items changed, were added, or removed — like name tags at a party. Without keys, Vue might mix up your items!</p>
          </div>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>v-if + v-for — The Right Way</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>&lt;!-- BAD: v-if and v-for on same element --&gt;
&lt;li v-for="item in items" v-if="item.active" :key="item.id"&gt;
  {{ item.name }}
&lt;/li&gt;

&lt;!-- GOOD: Use a computed to filter first --&gt;
&lt;li v-for="item in activeItems" :key="item.id"&gt;
  {{ item.name }}
&lt;/li&gt;

&lt;!-- Or wrap with template --&gt;
&lt;template v-for="item in items" :key="item.id"&gt;
  &lt;li v-if="item.active"&gt;{{ item.name }}&lt;/li&gt;
&lt;/template&gt;</code></pre>
          </div>

          <div class="mt-8 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
            <h4 class="font-bold text-emerald-800 mb-2"><i class="fa-solid fa-check-circle mr-2"></i>Summary Takeaways</h4>
            <ul class="text-emerald-700 text-sm space-y-1 ml-6 list-disc">
              <li>v-if / v-else-if / v-else creates conditional chains</li>
              <li>v-for iterates over arrays (item, index) and objects (value, key)</li>
              <li>Always use :key with v-for for proper tracking</li>
              <li>Don't use v-if and v-for on the same element — use computed or template wrapper</li>
              <li>v-if removes elements from DOM; v-show just hides them</li>
            </ul>
          </div>
        `,
        defaultCode: `<div id="app" class="p-6 bg-white border border-gray-200 rounded-xl shadow-sm max-w-sm mx-auto space-y-4">
  <h2 class="text-xl font-bold text-gray-800">Todo List</h2>

  <div class="flex gap-2">
    <input v-model="newTask" @keydown.enter="addTask" class="flex-1 p-2 border rounded-lg text-sm" placeholder="Add a task..." />
    <button @click="addTask" class="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700">Add</button>
  </div>

  <ul class="space-y-2">
    <li v-for="(task, i) in tasks" :key="task.id" class="flex items-center justify-between p-3 rounded-lg" :class="task.done ? 'bg-green-50 line-through text-gray-400' : 'bg-gray-50'">
      <span class="text-sm" @click="toggleTask(task)">{{ task.text }}</span>
      <button @click="removeTask(i)" class="text-red-400 hover:text-red-600 text-sm"><i class="fa-solid fa-xmark"></i></button>
    </li>
  </ul>

  <div v-if="tasks.length === 0" class="p-4 text-center text-gray-400 text-sm">
    <i class="fa-solid fa-check-circle text-emerald-500 text-2xl block mb-2"></i>
    All done! Add a new task above.
  </div>

  <div v-if="remaining > 0" class="text-xs text-gray-400">
    {{ remaining }} task{{ remaining > 1 ? 's' : '' }} remaining
  </div>
</div>

<script type="module">
  import { createApp, ref, computed } from 'vue'

  createApp({
    setup() {
      const tasks = ref([
        { id: 1, text: 'Learn Vue Directives', done: false },
        { id: 2, text: 'Build a Todo App', done: true },
        { id: 3, text: 'Master Composition API', done: false },
      ])
      const newTask = ref('')
      let nextId = 4

      const remaining = computed(() => tasks.value.filter(t => !t.done).length)

      function addTask() {
        if (newTask.value.trim()) {
          tasks.value.push({ id: nextId++, text: newTask.value.trim(), done: false })
          newTask.value = ''
        }
      }

      function toggleTask(task) { task.done = !task.done }
      function removeTask(i) { tasks.value.splice(i, 1) }

      return { tasks, newTask, remaining, addTask, toggleTask, removeTask }
    }
  }).mount('#app')
</script>`,
      },
      {
        id: 'directives-2',
        title: 'v-bind & Dynamic Attributes',
        objectives: [
          'Bind HTML attributes dynamically with v-bind',
          'Apply dynamic CSS classes and inline styles',
          'Use the shorthand : syntax for cleaner templates',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Dynamic Attributes with v-bind</h3>

          <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6 rounded-r-lg">
            <p class="text-indigo-800 font-medium"><i class="fa-solid fa-bullseye mr-2"></i><strong>Learning Objectives:</strong></p>
            <ul class="text-indigo-700 text-sm mt-1 space-y-1 ml-6 list-disc">
              <li>Bind HTML attributes dynamically with v-bind</li>
              <li>Apply dynamic CSS classes and inline styles</li>
              <li>Use the shorthand : syntax for cleaner templates</li>
            </ul>
          </div>

          <p class="mb-4 text-gray-700 leading-relaxed"><code>v-bind</code> is your tool for making HTML attributes dynamic. Need an image URL that changes? A button that disables when a form is invalid? A link whose destination comes from data? That's v-bind!</p>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>Bind Syntax</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>&lt;!-- Full syntax --&gt;
&lt;img v-bind:src="imageUrl" v-bind:alt="imageAlt"&gt;

&lt;!-- Shorthand (preferred) --&gt;
&lt;img :src="imageUrl" :alt="imageAlt"&gt;

&lt;!-- Dynamic attribute name --&gt;
&lt;button :[attributeName]="value"&gt;Dynamic&lt;/button&gt;

&lt;!-- Binding an entire object --&gt;
&lt;div v-bind="{ id: divId, 'data-user': userId }"&gt;&lt;/div&gt;</code></pre>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-500 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Class & Style Binding:</strong></p>
            <pre class="bg-gray-900 text-gray-100 p-3 mt-2 rounded-lg text-xs overflow-x-auto"><code>&lt;!-- Object syntax for classes --&gt;
&lt;div :class="{ active: isActive, 'text-danger': hasError }"&gt;

&lt;!-- Array syntax for classes --&gt;
&lt;div :class="[baseClass, isActive ? activeClass : '']"&gt;

&lt;!-- Object syntax for styles --&gt;
&lt;div :style="{ color: textColor, fontSize: size + 'px' }"&gt;</code></pre>
          </div>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>Practical Examples</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>// Button that disables during form submission
&lt;button :disabled="isSubmitting" :class="btnClass"&gt;
  {{ isSubmitting ? 'Saving...' : 'Save' }}
&lt;/button&gt;

// Progress bar with dynamic width
&lt;div class="progress-bar"&gt;
  &lt;div class="progress-fill" :style="{ width: progress + '%' }"&gt;&lt;/div&gt;
&lt;/div&gt;

// Dynamic image gallery
&lt;img v-for="img in gallery" :key="img.id"
     :src="img.thumbnail"
     :data-full="img.fullSize"
     :alt="img.caption"&gt;</code></pre>
          </div>

          <div class="mt-8 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
            <h4 class="font-bold text-emerald-800 mb-2"><i class="fa-solid fa-check-circle mr-2"></i>Summary Takeaways</h4>
            <ul class="text-emerald-700 text-sm space-y-1 ml-6 list-disc">
              <li>v-bind makes any HTML attribute dynamic — use : shorthand</li>
              <li>Bind classes with object { active: bool } or array syntax</li>
              <li>Bind inline styles with object { property: value } syntax</li>
              <li>Use dynamic attribute names with :[attrName] (Vue 3+)</li>
              <li>Bind entire objects with v-bind="{ key: val }"</li>
            </ul>
          </div>
        `,
        defaultCode: `<div id="app" class="p-6 bg-white border border-gray-200 rounded-xl shadow-sm max-w-sm mx-auto space-y-4">
  <h2 class="text-xl font-bold text-gray-800 text-center">Dynamic Binding</h2>

  <div class="flex justify-center gap-2">
    <button v-for="c in colors" :key="c"
      @click="selectedColor = c"
      :class="[
        'px-4 py-2 rounded-lg text-sm font-bold transition-all',
        selectedColor === c ? 'ring-2 ring-offset-2 ring-emerald-500 scale-105' : ''
      ]"
      :style="{ backgroundColor: c, color: c === 'white' || c === 'yellow' ? 'black' : 'white' }">
      {{ c }}
    </button>
  </div>

  <div class="border rounded-xl p-6 text-center transition-all duration-300"
    :style="{
      backgroundColor: selectedColor,
      color: selectedColor === 'white' || selectedColor === 'yellow' ? '#333' : 'white'
    }">
    <p class="text-lg font-bold">Selected Color</p>
    <p class="text-sm opacity-80">{{ selectedColor }}</p>
  </div>

  <div class="space-y-2">
    <label class="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" v-model="rounded" class="form-checkbox text-emerald-600" />
      Rounded corners
    </label>
    <label class="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" v-model="shadow" class="form-checkbox text-emerald-600" />
      Shadow
    </label>
  </div>

  <div class="p-4 text-center text-sm font-bold transition-all"
    :class="{
      'rounded-lg': rounded,
      'rounded-full': !rounded,
      'shadow-lg': shadow,
      'bg-gray-100 text-gray-700': true
    }">
    Look at me change!
  </div>
</div>

<script type="module">
  import { createApp, ref } from 'vue'

  createApp({
    setup() {
      const colors = ['red', 'blue', 'green', 'yellow', 'purple']
      const selectedColor = ref('blue')
      const rounded = ref(false)
      const shadow = ref(false)

      return { colors, selectedColor, rounded, shadow }
    }
  }).mount('#app')
</script>`,
      },
      {
        id: 'directives-3',
        title: 'v-model & Two-way Binding',
        objectives: [
          'Implement two-way data binding with v-model',
          'Handle different input types (text, checkbox, select, textarea)',
          'Use v-model modifiers like .trim, .number, and .lazy',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Form Inputs with v-model</h3>

          <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6 rounded-r-lg">
            <p class="text-indigo-800 font-medium"><i class="fa-solid fa-bullseye mr-2"></i><strong>Learning Objectives:</strong></p>
            <ul class="text-indigo-700 text-sm mt-1 space-y-1 ml-6 list-disc">
              <li>Implement two-way data binding with v-model</li>
              <li>Handle different input types (text, checkbox, select, textarea)</li>
              <li>Use v-model modifiers like .trim, .number, and .lazy</li>
            </ul>
          </div>

          <p class="mb-4 text-gray-700 leading-relaxed"><code>v-model</code> is Vue's two-way binding directive. It's like a bridge between your JavaScript state and your HTML form elements — changes in one automatically reflect in the other!</p>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>v-model with Different Inputs</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>&lt;!-- Text input --&gt;
&lt;input v-model="name" placeholder="Your name"&gt;

&lt;!-- Textarea --&gt;
&lt;textarea v-model="bio"&gt;&lt;/textarea&gt;

&lt;!-- Checkbox (boolean) --&gt;
&lt;input type="checkbox" v-model="agree"&gt;

&lt;!-- Checkbox (array of selected values) --&gt;
&lt;input type="checkbox" v-model="selectedTopics" value="vue"&gt;
&lt;input type="checkbox" v-model="selectedTopics" value="react"&gt;

&lt;!-- Select dropdown --&gt;
&lt;select v-model="country"&gt;
  &lt;option disabled value=""&gt;Pick one&lt;/option&gt;
  &lt;option&gt;USA&lt;/option&gt;
  &lt;option&gt;Canada&lt;/option&gt;
&lt;/select&gt;</code></pre>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-500 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Modifiers:</strong></p>
            <ul class="text-amber-700 text-sm mt-1 ml-6 list-disc">
              <li><code>v-model.trim="name"</code> — auto-trim whitespace</li>
              <li><code>v-model.number="age"</code> — cast to number</li>
              <li><code>v-model.lazy="search"</code> — sync on change event instead of input (less frequent)</li>
            </ul>
          </div>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>Registration Form</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>const form = reactive({
  name: '',
  email: '',
  password: '',
  country: '',
  newsletter: true,
  interests: []
})

function submitForm() {
  console.log('Form data:', form)
  // POST to API...
}</code></pre>
          </div>

          <div class="mt-8 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
            <h4 class="font-bold text-emerald-800 mb-2"><i class="fa-solid fa-check-circle mr-2"></i>Summary Takeaways</h4>
            <ul class="text-emerald-700 text-sm space-y-1 ml-6 list-disc">
              <li>v-model provides two-way binding between state and form inputs</li>
              <li>Works with text, checkbox (boolean/array), radio, select, textarea</li>
              <li>Use .trim, .number, .lazy modifiers for common transformations</li>
              <li>Combine v-model with reactive() for complex forms</li>
              <li>v-model on components creates a custom two-way binding</li>
            </ul>
          </div>
        `,
        defaultCode: `<div id="app" class="p-6 bg-white border border-gray-200 rounded-xl shadow-sm max-w-sm mx-auto space-y-5">
  <h2 class="text-xl font-bold text-gray-800 text-center">Registration Form</h2>

  <div class="space-y-4">
    <div>
      <label class="text-xs font-bold text-gray-500 uppercase block mb-1">Name</label>
      <input v-model.trim="form.name" class="w-full p-2 border rounded-lg text-sm" placeholder="Your name" />
    </div>

    <div>
      <label class="text-xs font-bold text-gray-500 uppercase block mb-1">Email</label>
      <input v-model="form.email" type="email" class="w-full p-2 border rounded-lg text-sm" placeholder="you@example.com" />
    </div>

    <div>
      <label class="text-xs font-bold text-gray-500 uppercase block mb-1">Age</label>
      <input v-model.number="form.age" type="number" class="w-full p-2 border rounded-lg text-sm" />
    </div>

    <div>
      <label class="text-xs font-bold text-gray-500 uppercase block mb-1">Country</label>
      <select v-model="form.country" class="w-full p-2 border rounded-lg text-sm">
        <option value="">Select a country</option>
        <option>USA</option>
        <option>Canada</option>
        <option>UK</option>
        <option>Other</option>
      </select>
    </div>

    <label class="flex items-center gap-2 text-sm cursor-pointer">
      <input type="checkbox" v-model="form.newsletter" class="form-checkbox text-emerald-600" />
      Subscribe to newsletter
    </label>

    <button @click="submitForm" class="w-full py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700">
      Submit
    </button>
  </div>

  <div class="border-t pt-3 text-xs text-gray-400">
    <p class="font-bold mb-1">Form Data Preview:</p>
    <pre class="bg-gray-50 p-2 rounded">{{ JSON.stringify(form, null, 2) }}</pre>
  </div>
</div>

<script type="module">
  import { createApp, reactive } from 'vue'

  createApp({
    setup() {
      const form = reactive({
        name: '',
        email: '',
        age: null,
        country: '',
        newsletter: true
      })

      function submitForm() {
        alert('Form submitted! Check the console for data.')
        console.log('Form data:', JSON.stringify(form, null, 2))
      }

      return { form, submitForm }
    }
  }).mount('#app')
</script>`,
      },
      {
        id: 'directives-4',
        title: 'v-on & Event Handling',
        objectives: [
          'Handle DOM events with v-on (or @ shorthand)',
          'Use event modifiers like .stop, .prevent, .once',
          'Pass custom arguments and the native event object',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Event Handling with v-on</h3>

          <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6 rounded-r-lg">
            <p class="text-indigo-800 font-medium"><i class="fa-solid fa-bullseye mr-2"></i><strong>Learning Objectives:</strong></p>
            <ul class="text-indigo-700 text-sm mt-1 space-y-1 ml-6 list-disc">
              <li>Handle DOM events with v-on (or @ shorthand)</li>
              <li>Use event modifiers like .stop, .prevent, .once</li>
              <li>Pass custom arguments and the native event object</li>
            </ul>
          </div>

          <p class="mb-4 text-gray-700 leading-relaxed"><code>v-on</code> (shorthand <code>@</code>) is how you listen to DOM events in Vue. Whether it's a click, submit, keypress, or custom event — <code>@</code> is your connection to user interactions!</p>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>Event Syntax</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>&lt;!-- Basic click --&gt;
&lt;button @click="handleClick"&gt;Click&lt;/button&gt;

&lt;!-- With expression --&gt;
&lt;button @click="count++"&gt;+1&lt;/button&gt;

&lt;!-- With argument --&gt;
&lt;button @click="deleteItem(item.id)"&gt;Delete&lt;/button&gt;

&lt;!-- Event object + argument --&gt;
&lt;button @click="handleClick($event, 'extra')"&gt;Click&lt;/button&gt;

&lt;!-- Multiple handlers --&gt;
&lt;button @click="handler1(); handler2()"&gt;Click&lt;/button&gt;</code></pre>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-500 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Event Modifiers:</strong></p>
            <pre class="bg-gray-900 text-gray-100 p-3 mt-2 rounded-lg text-xs overflow-x-auto"><code>&lt;!-- Stop propagation --&gt;
&lt;div @click.stop="handleClick"&gt;Click won't bubble&lt;/div&gt;

&lt;!-- Prevent default --&gt;
&lt;form @submit.prevent="handleSubmit"&gt;Won't refresh page&lt;/form&gt;

&lt;!-- Only trigger once --&gt;
&lt;button @click.once="handleClick"&gt;Only fires once&lt;/button&gt;

&lt;!-- Key modifiers --&gt;
&lt;input @keydown.enter="submit"&gt;
&lt;input @keydown.esc="cancel"&gt;
&lt;input @keydown.ctrl.enter="submitWithCtrl"&gt;</code></pre>
          </div>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>Mouse & Keyboard Events</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>&lt;!-- Mouse modifiers --&gt;
&lt;div @click.left="leftClick"&gt;Left click&lt;/div&gt;
&lt;div @click.right.prevent="rightClick"&gt;Right click&lt;/div&gt;
&lt;div @click.middle="middleClick"&gt;Middle click&lt;/div&gt;

&lt;!-- System modifiers --&gt;
&lt;div @click.ctrl="ctrlClick"&gt;Ctrl + Click&lt;/div&gt;
&lt;div @click.shift="shiftClick"&gt;Shift + Click&lt;/div&gt;
&lt;div @click.exact="exactClick"&gt;Only this key, no modifiers&lt;/div&gt;</code></pre>
          </div>

          <div class="mt-8 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
            <h4 class="font-bold text-emerald-800 mb-2"><i class="fa-solid fa-check-circle mr-2"></i>Summary Takeaways</h4>
            <ul class="text-emerald-700 text-sm space-y-1 ml-6 list-disc">
              <li>Use @click, @submit, @keydown for event handling (shorthand for v-on)</li>
              <li>Event modifiers like .stop, .prevent, .once keep code clean</li>
              <li>Pass arguments with @click="fn(arg)" and $event for the native event</li>
              <li>Key modifiers: .enter, .esc, .ctrl, .shift, .exact</li>
              <li>Mouse modifiers: .left, .right, .middle</li>
            </ul>
          </div>
        `,
        defaultCode: `<div id="app" class="p-6 bg-white border border-gray-200 rounded-xl shadow-sm max-w-sm mx-auto space-y-4">
  <h2 class="text-xl font-bold text-gray-800 text-center">Event Playground</h2>

  <!-- Click counter -->
  <div class="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
    <span class="text-sm text-gray-700">Click Counter</span>
    <div class="flex items-center gap-3">
      <span class="font-mono font-bold text-lg text-emerald-600">{{ clickCount }}</span>
      <button @click="clickCount++" class="px-3 py-1 bg-emerald-600 text-white rounded text-sm font-bold hover:bg-emerald-700">
        +1
      </button>
    </div>
  </div>

  <!-- Event with argument -->
  <div class="flex gap-2">
    <button v-for="n in 3" :key="n"
      @click="setPriority(n)"
      class="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
      :class="priority === n ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'">
      Priority {{ n }}
    </button>
  </div>

  <!-- Keyboard -->
  <div>
    <label class="text-xs font-bold text-gray-500 uppercase block mb-1">Type and press Enter</label>
    <input v-model="textInput" @keydown.enter="addMessage" class="w-full p-2 border rounded-lg text-sm" placeholder="Type here..." />
    <p class="text-xs text-gray-400 mt-1">Last key: <span class="font-mono">{{ lastKey }}</span></p>
  </div>

  <div class="border rounded-lg bg-gray-50 p-3 max-h-24 overflow-y-auto text-sm space-y-1">
    <div v-for="(msg, i) in messages" :key="i" class="text-gray-600">
      <span class="text-emerald-600 font-bold">></span> {{ msg }}
    </div>
    <div v-if="messages.length === 0" class="text-gray-400 italic">No messages yet</div>
  </div>

  <!-- Submit with prevent -->
  <form @submit.prevent="handleSubmit">
    <div class="flex gap-2">
      <input v-model="formInput" class="flex-1 p-2 border rounded-lg text-sm" placeholder="Type and submit" />
      <button type="submit" class="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700">Submit</button>
    </div>
  </form>
</div>

<script type="module">
  import { createApp, ref } from 'vue'

  createApp({
    setup() {
      const clickCount = ref(0)
      const priority = ref(1)
      const textInput = ref('')
      const formInput = ref('')
      const lastKey = ref('')
      const messages = ref([])

      function setPriority(n) { priority.value = n }
      function addMessage() {
        if (textInput.value.trim()) {
          messages.value.push('Enter: ' + textInput.value.trim())
          textInput.value = ''
        }
      }
      function handleSubmit() {
        if (formInput.value.trim()) {
          messages.value.push('Submitted: ' + formInput.value.trim())
          formInput.value = ''
        }
      }

      return { clickCount, priority, textInput, formInput, lastKey, messages, setPriority, addMessage, handleSubmit }
    }
  }).mount('#app')
</script>`,
      },
      {
        id: 'directives-5',
        title: 'v-show & Conditional Display',
        objectives: [
          'Understand the difference between v-show and v-if',
          'Learn when to use v-show for performance',
          'Use template tags for conditional groups',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">v-show vs v-if</h3>

          <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6 rounded-r-lg">
            <p class="text-indigo-800 font-medium"><i class="fa-solid fa-bullseye mr-2"></i><strong>Learning Objectives:</strong></p>
            <ul class="text-indigo-700 text-sm mt-1 space-y-1 ml-6 list-disc">
              <li>Understand the difference between v-show and v-if</li>
              <li>Learn when to use v-show for performance</li>
              <li>Use template tags for conditional groups</li>
            </ul>
          </div>

          <p class="mb-4 text-gray-700 leading-relaxed">Vue gives you two ways to conditionally show elements: <code>v-if</code> and <code>v-show</code>. They seem similar, but work very differently under the hood!</p>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>v-if vs v-show</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>&lt;!-- v-if: Element is destroyed/recreated --&gt;
&lt;div v-if="isVisible"&gt;I exist or I don't&lt;/div&gt;

&lt;!-- v-show: Element always exists, just hidden with CSS --&gt;
&lt;div v-show="isVisible"&gt;I'm always in the DOM, just hidden&lt;/div&gt;

&lt;!-- CSS equivalent of v-show --&gt;
&lt;div :style="{ display: isVisible ? 'block' : 'none' }"&gt;
  Same as v-show
&lt;/div&gt;</code></pre>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-500 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>When to Use Each:</strong></p>
            <ul class="text-amber-700 text-sm mt-1 ml-6 list-disc">
              <li><strong>v-if</strong> — initial render is expensive or toggled rarely (login/logout, feature flags)</li>
              <li><strong>v-show</strong> — toggled very frequently (accordion panels, tabs, tooltips, dropdowns)</li>
              <li><strong>v-if</strong> — works with v-else-if and v-else chains</li>
              <li><strong>v-show</strong> — cannot use with v-else, no template support</li>
            </ul>
          </div>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>template for Group Conditionals</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>&lt;!-- Group multiple elements without extra wrapper --&gt;
&lt;template v-if="isLoggedIn"&gt;
  &lt;h2&gt;Welcome back!&lt;/h2&gt;
  &lt;p&gt;You have {{ notifications }} notifications.&lt;/p&gt;
  &lt;button @click="logout"&gt;Logout&lt;/button&gt;
&lt;/template&gt;

&lt;template v-else&gt;
  &lt;h2&gt;Hello, Guest!&lt;/h2&gt;
  &lt;button @click="login"&gt;Login&lt;/button&gt;
&lt;/template&gt;</code></pre>
          </div>

          <div class="bg-emerald-50 border-l-4 border-emerald-500 p-4 my-6 rounded-r-lg">
            <p class="text-emerald-800 font-medium"><i class="fa-solid fa-circle-info mr-2"></i><strong>Performance Tip:</strong> If you have a frequently toggled element (like a tooltip on hover), use <code>v-show</code>. The element stays in the DOM and just toggles CSS <code>display</code>. Much faster than creating/destroying elements!</p>
          </div>

          <div class="mt-8 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
            <h4 class="font-bold text-emerald-800 mb-2"><i class="fa-solid fa-check-circle mr-2"></i>Summary Takeaways</h4>
            <ul class="text-emerald-700 text-sm space-y-1 ml-6 list-disc">
              <li>v-if destroys/creates elements; v-show just toggles CSS display</li>
              <li>Use v-if for rare toggling, conditional chains (v-else), or when template is complex</li>
              <li>Use v-show for frequent toggling (dropdowns, tabs, tooltips)</li>
              <li>Use &lt;template&gt; for grouping multiple elements with v-if</li>
              <li>v-if has a higher toggle cost; v-show has a higher initial render cost</li>
            </ul>
          </div>
        `,
        defaultCode: `<div id="app" class="p-6 bg-white border border-gray-200 rounded-xl shadow-sm max-w-sm mx-auto space-y-4">
  <h2 class="text-xl font-bold text-gray-800 text-center">Show / Hide Demo</h2>

  <!-- Tab buttons -->
  <div class="flex bg-gray-100 rounded-lg p-1">
    <button v-for="tab in tabs" :key="tab"
      @click="activeTab = tab"
      class="flex-1 py-2 rounded-md text-sm font-bold transition-all"
      :class="activeTab === tab ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700'">
      {{ tab }}
    </button>
  </div>

  <!-- Tab content with v-show (frequent toggle) -->
  <div class="p-4 bg-gray-50 rounded-lg min-h-[120px] transition-opacity">
    <div v-show="activeTab === 'Preview'">
      <h3 class="font-bold text-gray-800 mb-2">Preview</h3>
      <p class="text-sm text-gray-600">This is what your page looks like. Everything renders instantly because v-show keeps it in the DOM.</p>
      <div class="mt-3 p-2 bg-white border rounded text-sm">📄 Sample content preview...</div>
    </div>
    <div v-show="activeTab === 'Code'">
      <h3 class="font-bold text-gray-800 mb-2">Code</h3>
      <pre class="text-sm bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">&lt;div&gt;Hello Vue!&lt;/div&gt;</pre>
    </div>
    <div v-show="activeTab === 'Settings'">
      <h3 class="font-bold text-gray-800 mb-2">Settings</h3>
      <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" v-model="darkMode" class="form-checkbox text-emerald-600" />
        Dark Mode
      </label>
    </div>
  </div>

  <!-- Toggle card using v-if (rare toggle) -->
  <div class="border-t pt-3">
    <button @click="showDetails = !showDetails" class="text-sm text-emerald-600 font-bold hover:text-emerald-700">
      {{ showDetails ? 'Hide' : 'Show' }} Details
    </button>
    <div v-if="showDetails" class="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
      <p><i class="fa-solid fa-triangle-exclamation mr-1"></i> This detail panel uses v-if because it's toggled rarely. When hidden, it's completely removed from the DOM!</p>
    </div>
  </div>
</div>

<script type="module">
  import { createApp, ref } from 'vue'

  createApp({
    setup() {
      const tabs = ['Preview', 'Code', 'Settings']
      const activeTab = ref('Preview')
      const showDetails = ref(false)
      const darkMode = ref(false)

      return { tabs, activeTab, showDetails, darkMode }
    }
  }).mount('#app')
</script>`,
      },
    ],
    quiz: [
      {
        id: 'q-directives-1',
        question: 'Which directive is used to conditionally render a block based on a truthy value?',
        options: ['v-show', 'v-bind', 'v-if', 'v-model'],
        correct: 2,
        explanation: 'v-if conditionally renders elements. v-show just hides them with CSS display:none.',
      },
      {
        id: 'q-directives-2',
        question: 'What is the shorthand syntax for v-bind?',
        options: ['@', '#', ':', '$'],
        correct: 2,
        explanation: ': is the shorthand for v-bind. @ is the shorthand for v-on.',
      },
      {
        id: 'q-directives-3',
        question: 'How do you prevent a form from refreshing the page on submit?',
        options: [
          '@click.prevent',
          '@submit.stop',
          '@submit.prevent',
          'v-model.prevent',
        ],
        correct: 2,
        explanation: '@submit.prevent calls event.preventDefault() to stop the page refresh.',
      },
      {
        id: 'q-directives-4',
        question: 'What does v-model.trim do?',
        options: [
          'Truncates the input to 10 characters',
          'Automatically removes whitespace from both ends of the input',
          'Makes the input field smaller',
          'Removes HTML tags from the input',
        ],
        correct: 1,
        explanation: '.trim modifier automatically removes leading and trailing whitespace from the input value.',
      },
      {
        id: 'q-directives-5',
        question: 'When should you prefer v-show over v-if?',
        options: [
          'When the element is toggled very frequently',
          'When you need v-else chains',
          'When using the template tag for groups',
          'When the element is shown once and never hidden',
        ],
        correct: 0,
        explanation: 'v-show is better for frequent toggling because the element stays in the DOM and only CSS display changes.',
      },
    ],
  },

  // ─── Module 3: Lifecycle Hooks (5 lessons) ───
  {
    id: 'lifecycle',
    title: 'Lifecycle Hooks',
    lessons: [
      {
        id: 'lifecycle-1',
        title: 'onMounted & onUnmounted',
        objectives: [
          'Run initialization code after component mounts with onMounted',
          'Clean up resources on unmount with onUnmounted',
          'Fetch data from APIs when a component loads',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Component Lifecycle: Birth & Death</h3>

          <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6 rounded-r-lg">
            <p class="text-indigo-800 font-medium"><i class="fa-solid fa-bullseye mr-2"></i><strong>Learning Objectives:</strong></p>
            <ul class="text-indigo-700 text-sm mt-1 space-y-1 ml-6 list-disc">
              <li>Run initialization code after component mounts with onMounted</li>
              <li>Clean up resources on unmount with onUnmounted</li>
              <li>Fetch data from APIs when a component loads</li>
            </ul>
          </div>

          <p class="mb-4 text-gray-700 leading-relaxed">Each Vue component instance goes through a series of initialization steps when it's created. <code>onMounted</code> is called after the component has been added to the DOM — it's the perfect time to fetch data, set up timers, or interact with third-party libraries that need a DOM element.</p>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>Common Mounted Patterns</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>import { ref, onMounted, onUnmounted } from 'vue'

const data = ref(null)
const loading = ref(true)
const intervalId = ref(null)

// Fetch data when component loads
onMounted(async () => {
  try {
    const res = await fetch('/api/users')
    data.value = await res.json()
  } catch (err) {
    console.error('Failed to load:', err)
  } finally {
    loading.value = false
  }

  // Set up a timer
  intervalId.value = setInterval(() => {
    console.log('Still alive!')
  }, 5000)
})

// Clean up when component is removed
onUnmounted(() => {
  if (intervalId.value) {
    clearInterval(intervalId.value)
  }
})</code></pre>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-500 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Cleanup is Crucial!</strong></p>
            <p class="text-amber-700 text-sm mt-1">Always clean up timers, event listeners, and subscriptions in <code>onUnmounted</code>. Otherwise, your app will have "zombie" processes that keep running even after the component is gone — causing memory leaks and bugs!</p>
          </div>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>Tracking Mouse Position</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>const x = ref(0)
const y = ref(0)

function onMouseMove(e) {
  x.value = e.clientX
  y.value = e.clientY
}

onMounted(() => {
  window.addEventListener('mousemove', onMouseMove)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', onMouseMove)
})</code></pre>
          </div>

          <div class="mt-8 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
            <h4 class="font-bold text-emerald-800 mb-2"><i class="fa-solid fa-check-circle mr-2"></i>Summary Takeaways</h4>
            <ul class="text-emerald-700 text-sm space-y-1 ml-6 list-disc">
              <li>onMounted runs once after the component is added to the DOM</li>
              <li>Use onMounted for API calls, timers, and DOM-dependent setup</li>
              <li>onUnmounted runs when the component is removed</li>
              <li>Always clean up (timers, listeners, subscriptions) in onUnmounted</li>
              <li>Multiple lifecycle hooks can be registered — they run in order</li>
            </ul>
          </div>
        `,
        defaultCode: `<div id="app" class="p-6 bg-white border border-gray-200 rounded-xl shadow-sm max-w-sm mx-auto space-y-4">
  <h2 class="text-xl font-bold text-gray-800 text-center">Lifecycle Demo</h2>

  <div class="text-center p-4 bg-gray-50 rounded-lg">
    <p class="text-sm text-gray-500 mb-1">Mouse Position (updated in onMounted)</p>
    <p class="font-mono text-emerald-600 font-bold">
      X: {{ mouseX }} | Y: {{ mouseY }}
    </p>
  </div>

  <div class="p-4 bg-gray-50 rounded-lg text-center">
    <p class="text-sm text-gray-500 mb-1">Timer (setInterval in onMounted)</p>
    <p class="font-mono text-2xl font-bold text-emerald-600">{{ seconds }}s</p>
  </div>

  <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
    <i class="fa-solid fa-circle-info mr-1"></i>
    Move your mouse and watch the coordinates update! The timer was started in <code>onMounted</code> and would be cleaned up in <code>onUnmounted</code>.
  </div>
</div>

<script type="module">
  import { createApp, ref, onMounted, onUnmounted } from 'vue'

  createApp({
    setup() {
      const mouseX = ref(0)
      const mouseY = ref(0)
      const seconds = ref(0)
      let timer = null

      function updateMouse(e) {
        mouseX.value = e.clientX
        mouseY.value = e.clientY
      }

      onMounted(() => {
        window.addEventListener('mousemove', updateMouse)
        timer = setInterval(() => {
          seconds.value++
        }, 1000)
      })

      onUnmounted(() => {
        window.removeEventListener('mousemove', updateMouse)
        if (timer) clearInterval(timer)
      })

      return { mouseX, mouseY, seconds }
    }
  }).mount('#app')
</script>`,
      },
      {
        id: 'lifecycle-2',
        title: 'onBeforeMount & Lifecycle Flow',
        objectives: [
          'Understand the complete Vue component lifecycle order',
          'Use onBeforeMount for pre-render setup',
          'Visualize when each hook fires during component creation',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">The Complete Lifecycle Flow</h3>

          <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6 rounded-r-lg">
            <p class="text-indigo-800 font-medium"><i class="fa-solid fa-bullseye mr-2"></i><strong>Learning Objectives:</strong></p>
            <ul class="text-indigo-700 text-sm mt-1 space-y-1 ml-6 list-disc">
              <li>Understand the complete Vue component lifecycle order</li>
              <li>Use onBeforeMount for pre-render setup</li>
              <li>Visualize when each hook fires during component creation</li>
            </ul>
          </div>

          <p class="mb-4 text-gray-700 leading-relaxed">A Vue component goes through a well-defined sequence of lifecycle stages. Understanding this order is key to knowing WHERE to put your code!</p>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>Lifecycle Order Diagram</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>1. setup()
   ↓
2. onBeforeMount()  ← Template compiled, NO DOM yet
   ↓
3. onMounted()      ← DOM created, element is on the page
   ↓
   [Data changes]
   ↓
4. onBeforeUpdate() ← About to re-render (old DOM still visible)
   ↓
5. onUpdated()      ← Re-rendered (new DOM is live)
   ↓
   [Component removed]
   ↓
6. onBeforeUnmount()← About to be removed
   ↓
7. onUnmounted()    ← Removed. Cleanup time!</code></pre>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-500 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>onBeforeMount Use Cases:</strong></p>
            <ul class="text-amber-700 text-sm mt-1 ml-6 list-disc">
              <li>Access template refs (but they're not rendered yet!)</li>
              <li>Set initial state based on props before render</li>
              <li>Start async operations that don't need the DOM</li>
              <li>Rarely used — onMounted covers most cases</li>
            </ul>
          </div>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>Lifecycle Logger</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>import { onBeforeMount, onMounted, onBeforeUpdate,
         onUpdated, onBeforeUnmount, onUnmounted } from 'vue'

const logs = ref([])

function log(hook) {
  logs.value.push(hook)
}

onBeforeMount(() => log('1. onBeforeMount'))
onMounted(() => log('2. onMounted'))
onBeforeUpdate(() => log('3. onBeforeUpdate'))
onUpdated(() => log('4. onUpdated'))
onBeforeUnmount(() => log('5. onBeforeUnmount'))
onUnmounted(() => log('6. onUnmounted'))</code></pre>
          </div>

          <div class="mt-8 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
            <h4 class="font-bold text-emerald-800 mb-2"><i class="fa-solid fa-check-circle mr-2"></i>Summary Takeaways</h4>
            <ul class="text-emerald-700 text-sm space-y-1 ml-6 list-disc">
              <li>Lifecycle hooks run in a strict order: setup → mount → update → unmount</li>
              <li>onBeforeMount runs after template compiles but before DOM insertion</li>
              <li>onMounted is when DOM is available — most common place for setup</li>
              <li>onBeforeUpdate/onUpdated fire on every state change that triggers re-render</li>
              <li>onBeforeUnmount/onUnmounted fire when the component is destroyed</li>
            </ul>
          </div>
        `,
        defaultCode: `<div id="app" class="p-6 bg-white border border-gray-200 rounded-xl shadow-sm max-w-sm mx-auto space-y-4">
  <h2 class="text-xl font-bold text-gray-800 text-center">Lifecycle Flow</h2>

  <div class="text-center">
    <p class="text-sm text-gray-500 mb-2">Click the button to trigger an update cycle</p>
    <button @click="count++" class="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700">
      Update ({{ count }})
    </button>
  </div>

  <div class="bg-gray-900 text-green-400 rounded-xl p-4 font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
    <div v-for="(log, i) in logs" :key="i" class="animate-fade-in">
      <span class="text-gray-500">[{{ i + 1 }}]</span> {{ log }}
    </div>
    <div v-if="logs.length === 0" class="text-gray-500 italic">
      Lifecycle logs will appear here...
    </div>
  </div>

  <div class="text-xs text-gray-400 text-center">
    All 6 lifecycle hooks are registered. Watch them fire in order!
  </div>
</div>

<script type="module">
  import { createApp, ref, onBeforeMount, onMounted, onBeforeUpdate, onUpdated, onBeforeUnmount, onUnmounted } from 'vue'

  createApp({
    setup() {
      const count = ref(0)
      const logs = ref([])

      function log(msg) { logs.value.push(msg) }

      onBeforeMount(() => log('🔥 onBeforeMount — Template ready, no DOM yet'))
      onMounted(() => log('✅ onMounted — Component is in the DOM!'))
      onBeforeUpdate(() => log('🔄 onBeforeUpdate — Data changed, about to re-render (count=' + count.value + ')'))
      onUpdated(() => log('📋 onUpdated — Re-render complete!'))
      onBeforeUnmount(() => log('👋 onBeforeUnmount — Component about to leave'))
      onUnmounted(() => log('💀 onUnmounted — Component removed. Goodbye!'))

      return { count, logs }
    }
  }).mount('#app')
</script>`,
      },
      {
        id: 'lifecycle-3',
        title: 'onUpdated & onBeforeUpdate',
        objectives: [
          'React to state changes with onUpdated and onBeforeUpdate',
          'Access the DOM before and after re-render',
          'Avoid infinite update loops in lifecycle hooks',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Reacting to Updates</h3>

          <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6 rounded-r-lg">
            <p class="text-indigo-800 font-medium"><i class="fa-solid fa-bullseye mr-2"></i><strong>Learning Objectives:</strong></p>
            <ul class="text-indigo-700 text-sm mt-1 space-y-1 ml-6 list-disc">
              <li>React to state changes with onUpdated and onBeforeUpdate</li>
              <li>Access the DOM before and after re-render</li>
              <li>Avoid infinite update loops in lifecycle hooks</li>
            </ul>
          </div>

          <p class="mb-4 text-gray-700 leading-relaxed">Every time reactive state changes, Vue re-renders the component. <code>onBeforeUpdate</code> runs right before the DOM updates (the old DOM is still visible). <code>onUpdated</code> runs after the DOM has been updated.</p>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>Update Hooks in Action</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>import { ref, onBeforeUpdate, onUpdated } from 'vue'

const items = ref(['A', 'B', 'C'])

onBeforeUpdate(() => {
  // Old DOM is still here — can read scroll positions, etc.
  const list = document.querySelector('.item-list')
  console.log('Old height:', list?.scrollHeight)
})

onUpdated(() => {
  // New DOM is here — can scroll to bottom, focus elements, etc.
  const list = document.querySelector('.item-list')
  console.log('New height:', list?.scrollHeight)
  list?.lastElementChild?.scrollIntoView()
})</code></pre>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-500 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>⚠️ WARNING: Infinite Loop!</strong></p>
            <p class="text-amber-700 text-sm mt-1">NEVER mutate reactive state inside <code>onUpdated</code>. If you update state in onUpdated, it triggers another re-render, which triggers onUpdated again... infinite loop! Use <code>watch()</code> instead if you need to react to state changes.</p>
          </div>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>Scrolling Chat Example</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>const messages = ref([])
const chatContainer = ref(null)

function addMessage() {
  messages.value.push({ text: 'New message!', time: Date.now() })
}

// Auto-scroll to bottom when new messages arrive
onUpdated(() => {
  // Check if we should scroll (e.g., user was near bottom)
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
})</code></pre>
          </div>

          <div class="mt-8 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
            <h4 class="font-bold text-emerald-800 mb-2"><i class="fa-solid fa-check-circle mr-2"></i>Summary Takeaways</h4>
            <ul class="text-emerald-700 text-sm space-y-1 ml-6 list-disc">
              <li>onBeforeUpdate: DOM hasn't changed yet — save state like scroll position</li>
              <li>onUpdated: DOM has changed — access new elements, update libraries</li>
              <li>Never mutate state inside onUpdated — it causes infinite loops</li>
              <li>Use watch() instead of onUpdated for reacting to specific state changes</li>
              <li>onUpdated fires for ANY reactive change, watch() fires for specific ones</li>
            </ul>
          </div>
        `,
        defaultCode: `<div id="app" class="p-6 bg-white border border-gray-200 rounded-xl shadow-sm max-w-sm mx-auto space-y-4">
  <h2 class="text-xl font-bold text-gray-800 text-center">Update Hooks</h2>

  <div class="flex gap-2">
    <button @click="addItem" class="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700">
      + Add Item
    </button>
    <button @click="removeLast" class="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600">
      - Remove Last
    </button>
  </div>

  <ul class="space-y-1 max-h-40 overflow-y-auto border rounded-lg p-2">
    <li v-for="(item, i) in items" :key="i"
      class="p-2 bg-gray-50 rounded text-sm text-gray-700 flex items-center gap-2 animate-fade-in">
      <span class="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">{{ i + 1 }}</span>
      {{ item }}
    </li>
    <li v-if="items.length === 0" class="p-4 text-center text-gray-400 text-sm">List is empty</li>
  </ul>

  <div class="bg-gray-900 text-green-400 rounded-lg p-3 font-mono text-xs">
    <span class="text-gray-500">Last event:</span> {{ lastEvent }}
  </div>
</div>

<script type="module">
  import { createApp, ref, onBeforeUpdate, onUpdated } from 'vue'

  createApp({
    setup() {
      const items = ref(['Learn Vue', 'Build an app', 'Master reactivity'])
      const lastEvent = ref('Waiting for updates...')
      let nextId = 4

      function addItem() {
        items.value.push('Item ' + nextId++)
      }
      function removeLast() {
        items.value.pop()
      }

      onBeforeUpdate(() => {
        lastEvent.value = '[BeforeUpdate] Items count: ' + items.value.length + ' (old DOM still visible)'
      })

      onUpdated(() => {
        lastEvent.value = '[Updated] DOM refreshed! Items count: ' + items.value.length
      })

      return { items, lastEvent, addItem, removeLast }
    }
  }).mount('#app')
</script>`,
      },
      {
        id: 'lifecycle-4',
        title: 'KeepAlive & onActivated',
        objectives: [
          'Cache components with KeepAlive to preserve state',
          'Use onActivated and onDeactivated hooks',
          'Understand when cached components mount vs activate',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Component Caching with KeepAlive</h3>

          <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6 rounded-r-lg">
            <p class="text-indigo-800 font-medium"><i class="fa-solid fa-bullseye mr-2"></i><strong>Learning Objectives:</strong></p>
            <ul class="text-indigo-700 text-sm mt-1 space-y-1 ml-6 list-disc">
              <li>Cache components with KeepAlive to preserve state</li>
              <li>Use onActivated and onDeactivated hooks</li>
              <li>Understand when cached components mount vs activate</li>
            </ul>
          </div>

          <p class="mb-4 text-gray-700 leading-relaxed">Normally, when you toggle between components or views, Vue destroys the old component and creates the new one. But what if you want to keep the old component alive — preserving its state, scroll position, and data?</p>

          <p class="mb-4 text-gray-700 leading-relaxed">That's what <code>&lt;KeepAlive&gt;</code> does! It's a built-in component that caches the wrapped component's instance instead of destroying it.</p>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>KeepAlive in Action</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>&lt;!-- Without KeepAlive — state lost on switch --&gt;
&lt;component :is="currentTab" /&gt;

&lt;!-- With KeepAlive — state preserved --&gt;
&lt;KeepAlive&gt;
  &lt;component :is="currentTab" /&gt;
&lt;/KeepAlive&gt;

&lt;!-- Include/exclude specific components --&gt;
&lt;KeepAlive :include="['TabA', 'TabB']"&gt;
  &lt;component :is="currentTab" /&gt;
&lt;/KeepAlive&gt;

&lt;!-- Max cached instances --&gt;
&lt;KeepAlive :max="10"&gt;
  &lt;component :is="currentTab" /&gt;
&lt;/KeepAlive&gt;</code></pre>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-500 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Special Hooks:</strong></p>
            <ul class="text-amber-700 text-sm mt-1 ml-6 list-disc">
              <li><strong>onActivated</strong> — called when a cached component becomes active again</li>
              <li><strong>onDeactivated</strong> — called when a cached component is <em>deactivated</em> (cached)</li>
              <li>These run INSTEAD of onMounted/onUnmounted when wrapped in KeepAlive</li>
              <li>onMounted only runs the FIRST time; onActivated runs every time it's shown</li>
            </ul>
          </div>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>Tab System with KeepAlive</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>// Each tab remembers its state!
const activeTab = ref('Profile')
const tabs = ['Profile', 'Settings', 'Dashboard']

// Tab A: User fills out a form
// Tab B: User has scrolled to a position
// Switching back → everything preserved!

onActivated(() => {
  console.log('Tab is visible again!')
  // Refresh data, resume animations, etc.
})

onDeactivated(() => {
  console.log('Tab was cached')
  // Pause videos, save draft, etc.
})</code></pre>
          </div>

          <div class="mt-8 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
            <h4 class="font-bold text-emerald-800 mb-2"><i class="fa-solid fa-check-circle mr-2"></i>Summary Takeaways</h4>
            <ul class="text-emerald-700 text-sm space-y-1 ml-6 list-disc">
              <li>KeepAlive caches component instances instead of destroying them</li>
              <li>onActivated fires each time a cached component is shown again</li>
              <li>onDeactivated fires when a component is cached (not destroyed)</li>
              <li>Use :include and :exclude to control which components are cached</li>
              <li>:max limits the number of cached instances (LRU eviction)</li>
            </ul>
          </div>
        `,
        defaultCode: `<div id="app" class="p-6 bg-white border border-gray-200 rounded-xl shadow-sm max-w-sm mx-auto space-y-4">
  <h2 class="text-xl font-bold text-gray-800 text-center">KeepAlive Tabs</h2>

  <!-- Tab buttons -->
  <div class="flex bg-gray-100 rounded-lg p-1">
    <button v-for="tab in tabs" :key="tab"
      @click="currentTab = tab"
      class="flex-1 py-2 rounded-md text-sm font-bold transition-all"
      :class="currentTab === tab ? 'bg-white shadow-sm text-emerald-600' : 'text-gray-500 hover:text-gray-700'">
      {{ tab }}
    </button>
  </div>

  <!-- Tab content - each tab preserves its state! -->
  <TabA v-if="currentTab === 'Tab A'" />
  <TabB v-else-if="currentTab === 'Tab B'" />
  <TabC v-else />

  <div class="text-xs text-gray-400 text-center border-t pt-3">
    Each tab remembers its state. Try filling inputs, then switch tabs and come back!
  </div>
</div>

<script type="module">
  import { createApp, ref, onActivated, onDeactivated } from 'vue'

  // Tab A - Counter keeps its value
  const TabA = {
    template: \`
      <div class="p-4 bg-blue-50 rounded-lg space-y-2">
        <h3 class="font-bold text-blue-800">Tab A: Counter</h3>
        <p class="text-sm text-blue-700">Count: {{ count }}</p>
        <button @click="count++" class="px-3 py-1 bg-blue-600 text-white rounded text-sm">+1</button>
      </div>
    \`,
    setup() {
      const count = ref(0)
      onActivated(() => console.log('Tab A activated'))
      onDeactivated(() => console.log('Tab A deactivated'))
      return { count }
    }
  }

  // Tab B - Text input keeps its value
  const TabB = {
    template: \`
      <div class="p-4 bg-emerald-50 rounded-lg space-y-2">
        <h3 class="font-bold text-emerald-800">Tab B: Input</h3>
        <input v-model="text" class="w-full p-2 border rounded text-sm" placeholder="Type something..." />
        <p class="text-sm text-emerald-700">You typed: "{{ text }}"</p>
      </div>
    \`,
    setup() {
      const text = ref('')
      onActivated(() => console.log('Tab B activated'))
      onDeactivated(() => console.log('Tab B deactivated'))
      return { text }
    }
  }

  // Tab C - Checkbox keeps its state
  const TabC = {
    template: \`
      <div class="p-4 bg-amber-50 rounded-lg space-y-2">
        <h3 class="font-bold text-amber-800">Tab C: Settings</h3>
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="settingA" /> Enable notifications</label>
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" v-model="settingB" /> Dark mode</label>
        <p class="text-xs text-amber-700">A: {{ settingA }}, B: {{ settingB }}</p>
      </div>
    \`,
    setup() {
      const settingA = ref(false)
      const settingB = ref(true)
      onActivated(() => console.log('Tab C activated'))
      onDeactivated(() => console.log('Tab C deactivated'))
      return { settingA, settingB }
    }
  }

  createApp({
    setup() {
      const tabs = ['Tab A', 'Tab B', 'Tab C']
      const currentTab = ref('Tab A')
      return { tabs, currentTab, TabA, TabB, TabC }
    },
    components: { TabA, TabB, TabC }
  }).mount('#app')
</script>`,
      },
      {
        id: 'lifecycle-5',
        title: 'onErrorCaptured & Error Boundaries',
        objectives: [
          'Catch and handle errors in child components',
          'Create error boundaries to prevent app crashes',
          'Log errors and show user-friendly fallback UI',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Error Handling with onErrorCaptured</h3>

          <div class="bg-indigo-50 border-l-4 border-indigo-500 p-4 mb-6 rounded-r-lg">
            <p class="text-indigo-800 font-medium"><i class="fa-solid fa-bullseye mr-2"></i><strong>Learning Objectives:</strong></p>
            <ul class="text-indigo-700 text-sm mt-1 space-y-1 ml-6 list-disc">
              <li>Catch and handle errors in child components</li>
              <li>Create error boundaries to prevent app crashes</li>
              <li>Log errors and show user-friendly fallback UI</li>
            </ul>
          </div>

          <p class="mb-4 text-gray-700 leading-relaxed">In any real-world application, things go wrong — network requests fail, data is malformed, or a bug slips through. <code>onErrorCaptured</code> is your safety net that catches errors from child components and prevents them from crashing your entire app.</p>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>Error Captured Hook</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>import { ref, onErrorCaptured } from 'vue'

const error = ref(null)

onErrorCaptured((err, instance, info) => {
  // Log to error tracking service
  console.error('Captured error:', err)
  console.log('Component:', instance)
  console.log('Info:', info)  // e.g., 'render function' or 'setup function'

  // Store error to show fallback UI
  error.value = err.message

  // Return false to PREVENT the error from propagating
  return false
})</code></pre>
          </div>

          <div class="bg-amber-50 border-l-4 border-amber-500 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800 font-medium"><i class="fa-solid fa-lightbulb mr-2"></i><strong>Error Propagation:</strong></p>
            <ul class="text-amber-700 text-sm mt-1 ml-6 list-disc">
              <li>If onErrorCaptured returns <code>false</code>, the error stops here</li>
              <li>If it returns <code>undefined</code> or doesn't return, error bubbles up to parent</li>
              <li>If no component catches it, Vue emits an app-level <code>errorHandler</code> event</li>
              <li>Use <code>app.config.errorHandler</code> for global error catching</li>
            </ul>
          </div>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-5 my-6">
            <h4 class="font-bold text-gray-800 mb-3"><i class="fa-solid fa-code mr-2 text-emerald-600"></i>Error Boundary Component Pattern</h4>
            <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto"><code>// ErrorBoundary.vue (component wrapping children)
const hasError = ref(null)

onErrorCaptured((err, instance, info) => {
  hasError.value = err.message
  return false  // Stop propagation
})

// In template:
// If error → show fallback UI
// If no error → render children normally</code></pre>
          </div>

          <div class="bg-emerald-50 border-l-4 border-emerald-500 p-4 my-6 rounded-r-lg">
            <p class="text-emerald-800 font-medium"><i class="fa-solid fa-circle-info mr-2"></i><strong>Best Practice:</strong> Wrap each major section of your app with an error boundary. That way, if a sidebar crashes, the main content still works. Never let a single component's error take down your entire app!</p>
          </div>

          <div class="mt-8 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
            <h4 class="font-bold text-emerald-800 mb-2"><i class="fa-solid fa-check-circle mr-2"></i>Summary Takeaways</h4>
            <ul class="text-emerald-700 text-sm space-y-1 ml-6 list-disc">
              <li>onErrorCaptured catches errors from child components</li>
              <li>Return false to stop error propagation; omit to bubble up</li>
              <li>Use for: logging, showing fallback UI, preventing app crashes</li>
              <li>Set up app.config.errorHandler for global error tracking</li>
              <li>Create isolated error boundaries for different app sections</li>
            </ul>
          </div>
        `,
        defaultCode: `<div id="app" class="p-6 bg-white border border-gray-200 rounded-xl shadow-sm max-w-sm mx-auto space-y-4">
  <h2 class="text-xl font-bold text-gray-800 text-center">Error Boundaries</h2>

  <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
    <i class="fa-solid fa-shield-halved text-3xl text-red-400 mb-2 block"></i>
    <h3 class="font-bold text-red-800 mb-1">Error Caught!</h3>
    <p class="text-sm text-red-600">{{ error }}</p>
    <button @click="error = null; resetChild()" class="mt-3 px-4 py-1 bg-red-600 text-white rounded text-sm font-bold hover:bg-red-700">
      Retry
    </button>
  </div>

  <div v-else class="space-y-4">
    <div class="p-4 bg-gray-50 rounded-lg text-center">
      <p class="text-sm text-gray-600">Click below to simulate an error</p>
    </div>

    <!-- Simulated child component that can error -->
    <ChildComponent :should-error="triggerError" />
  </div>

  <div class="text-xs text-gray-400 text-center border-t pt-3">
    onErrorCaptured catches the error and shows a friendly message instead of crashing the app.
  </div>
</div>

<script type="module">
  import { createApp, ref, onErrorCaptured } from 'vue'

  // Simulated child component that errors
  const ChildComponent = {
    props: ['shouldError'],
    template: \`
      <div class="p-4 bg-emerald-50 rounded-lg text-center space-y-3">
        <p class="text-sm text-emerald-700">This is a child component that might crash...</p>
        <button @click="crash" class="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600">
          💥 Trigger Error
        </button>
        <p v-if="!shouldError" class="text-xs text-emerald-600">Everything is fine so far!</p>
      </div>
    \`,
    setup(props) {
      function crash() {
        throw new Error('Something went wrong in the child component!')
      }
      return { crash }
    }
  }

  createApp({
    setup() {
      const error = ref(null)
      const triggerError = ref(false)

      onErrorCaptured((err) => {
        error.value = err.message
        return false
      })

      function resetChild() {
        triggerError.value = false
      }

      return { error, triggerError, resetChild, ChildComponent }
    },
    components: { ChildComponent }
  }).mount('#app')
</script>`,
      },
    ],
    quiz: [
      {
        id: 'q-lifecycle-1',
        question: 'Which hook is called right after the component has been mounted to the DOM?',
        options: ['onCreated', 'onBeforeMount', 'onUpdated', 'onMounted'],
        correct: 3,
        explanation: 'onMounted runs after the component is inserted into the DOM. It is the most commonly used lifecycle hook.',
      },
      {
        id: 'q-lifecycle-2',
        question: 'What should you do in onUnmounted to prevent memory leaks?',
        options: [
          'Set all refs to null',
          'Clean up timers, event listeners, and subscriptions',
          'Destroy the root app instance',
          'Nothing — Vue handles it automatically',
        ],
        correct: 1,
        explanation: 'Always clean up timers, event listeners, and subscriptions in onUnmounted to prevent memory leaks.',
      },
      {
        id: 'q-lifecycle-3',
        question: 'What is the correct order of lifecycle hooks during component creation?',
        options: [
          'setup → onMounted → onBeforeMount',
          'onBeforeMount → setup → onMounted',
          'setup → onBeforeMount → onMounted',
          'onMounted → setup → onBeforeMount',
        ],
        correct: 2,
        explanation: 'The order is: setup() → onBeforeMount() → onMounted(). Setup runs first, then before the DOM is created, then after mount.',
      },
      {
        id: 'q-lifecycle-4',
        question: 'When does onActivated fire for a component wrapped in KeepAlive?',
        options: [
          'Only the first time the component mounts',
          'Every time the cached component is shown again',
          'When the component is first created in setup()',
          'When the component is destroyed',
        ],
        correct: 1,
        explanation: 'onActivated fires every time a KeepAlive-cached component becomes active again, unlike onMounted which only fires once.',
      },
      {
        id: 'q-lifecycle-5',
        question: 'What happens if onErrorCaptured does NOT return false?',
        options: [
          'The error is automatically fixed',
          'The error propagates to the parent component',
          'The component is destroyed immediately',
          'Vue throws a warning in the console',
        ],
        correct: 1,
        explanation: 'If onErrorCaptured doesn\'t return false, the error bubbles up to the parent component\'s onErrorCaptured, or to the global error handler.',
      },
    ],
  },
];

// --- State & Progress ---
let state = {
  activeModuleId: curriculum[0].id,
  activeLessonId: curriculum[0].lessons[0].id,
  activeTab: 'lesson',
  completedItems: [],
  quizAnswers: {},
};

// Load state from local storage
function loadProgress() {
  try {
    const saved = localStorage.getItem('vueLearningProgress');
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
    localStorage.setItem('vueLearningProgress', JSON.stringify(state.completedItems));
  } catch (e) {
    console.error('Failed to save progress', e);
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
  lessonNavPrev: document.getElementById('lesson-nav-prev'),
  lessonNavNext: document.getElementById('lesson-nav-next'),
  lessonNavInfo: document.getElementById('lesson-nav-info'),
};

// --- Initialization ---
function init() {
  if (window.eli5Toggle) {
    window.eli5Toggle.setPreference('vue', false);
  }
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
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  DOM.runCodeBtn.addEventListener('click', runCode);

  DOM.codeEditor.addEventListener('keydown', function (e) {
    if (e.key == 'Tab') {
      e.preventDefault();
      var start = this.selectionStart;
      var end = this.selectionEnd;
      this.value = this.value.substring(0, start) + '  ' + this.value.substring(end);
      this.selectionStart = this.selectionEnd = start + 2;
    }
  });

  if (DOM.lessonNavPrev) {
    DOM.lessonNavPrev.addEventListener('click', navigateLessonPrev);
  }
  if (DOM.lessonNavNext) {
    DOM.lessonNavNext.addEventListener('click', navigateLessonNext);
  }
}

function switchTab(tabId) {
  state.activeTab = tabId;

  DOM.tabBtns.forEach((btn) => {
    if (btn.getAttribute('data-tab') === tabId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  DOM.tabContents.forEach((content) => {
    content.classList.remove('active', 'flex', 'md:flex');
  });

  const activeContent = document.getElementById(`tab-${tabId}`);
  if (tabId === 'playground') {
    activeContent.classList.add('active', 'flex', 'md:flex-row');
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

function getLessonIndex() {
  const mod = getActiveModule();
  return mod.lessons.findIndex((l) => l.id === state.activeLessonId);
}

function navigateLessonPrev() {
  const mod = getActiveModule();
  const idx = getLessonIndex();
  if (idx > 0) {
    state.activeLessonId = mod.lessons[idx - 1].id;
    DOM.previewFrame.srcdoc = '';
    renderActiveState();
  }
}

function navigateLessonNext() {
  const mod = getActiveModule();
  const idx = getLessonIndex();
  if (idx < mod.lessons.length - 1) {
    state.activeLessonId = mod.lessons[idx + 1].id;
    DOM.previewFrame.srcdoc = '';
    renderActiveState();
  }
}

function changeModule(moduleId) {
  const mod = curriculum.find((m) => m.id === moduleId);
  if (mod) {
    state.activeModuleId = moduleId;
    state.activeLessonId = mod.lessons[0].id;
    state.quizAnswers = {};
    DOM.previewFrame.srcdoc = '';
    renderSidebar();
    renderActiveState();
    if (window.innerWidth < 1024) {
      DOM.sidebar.classList.add('-translate-x-full');
      DOM.sidebarOverlay.classList.add('hidden');
    }
  }
}

function renderSidebar() {
  DOM.moduleList.innerHTML = '';

  curriculum.forEach((mod) => {
    const isActive = mod.id === state.activeModuleId;
    const allLessonsDone = mod.lessons.every((l) => state.completedItems.includes(l.id));
    const quizDone =
      mod.quiz && mod.quiz.length > 0 ? state.completedItems.includes(`${mod.id}-quiz`) : true;
    const isModuleComplete = allLessonsDone && quizDone;

    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = `w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left ${isActive ? 'bg-emerald-50 text-emerald-800 font-semibold border-l-4 border-emerald-600' : 'hover:bg-gray-100 text-gray-700 border-l-4 border-transparent'}`;
    btn.onclick = () => changeModule(mod.id);

    // Module title with lesson count
    const textSpan = document.createElement('span');
    textSpan.className = 'truncate block text-sm';
    textSpan.innerText = mod.title;

    // Subtitle showing lesson completion
    const subSpan = document.createElement('span');
    const completedLessons = mod.lessons.filter((l) => state.completedItems.includes(l.id)).length;
    subSpan.className = 'text-xs text-gray-400 block mt-0.5';
    subSpan.innerText = `${completedLessons}/${mod.lessons.length} lessons`;

    const textWrapper = document.createElement('div');
    textWrapper.appendChild(textSpan);
    textWrapper.appendChild(subSpan);
    btn.appendChild(textWrapper);

    if (isModuleComplete) {
      const checkIcon = document.createElement('i');
      checkIcon.className = 'fa-solid fa-check-circle text-emerald-600';
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

  // Set code editor with lesson's default code
  if (DOM.codeEditor) {
    DOM.codeEditor.value = lesson.defaultCode;
  }

  // Update lesson navigation
  renderLessonNav();
}

function renderLessonNav() {
  const mod = getActiveModule();
  const idx = getLessonIndex();
  const total = mod.lessons.length;

  if (DOM.lessonNavInfo) {
    DOM.lessonNavInfo.textContent = `${idx + 1} / ${total}`;
  }
  if (DOM.lessonNavPrev) {
    DOM.lessonNavPrev.disabled = idx === 0;
    DOM.lessonNavPrev.className = `px-3 py-1.5 rounded text-xs font-bold transition-colors ${
      idx === 0
        ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
    }`;
  }
  if (DOM.lessonNavNext) {
    DOM.lessonNavNext.disabled = idx === total - 1;
    DOM.lessonNavNext.className = `px-3 py-1.5 rounded text-xs font-bold transition-colors ${
      idx === total - 1
        ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
    }`;
  }
}

function renderLesson(lesson) {
  const isCompleted = state.completedItems.includes(lesson.id);

  // Look up ELI5 content for this lesson
  const eli5Data = (window.eli5VueData || {})[lesson.id] || '';

  DOM.tabLesson.innerHTML = `
    <div class="max-w-3xl mx-auto animate-fade-in eli5-container eli5-lesson-container" data-mode="technical">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-3xl font-bold text-gray-900">${lesson.title}</h2>
      </div>
      <div class="prose max-w-none text-gray-800">
        ${(window.eli5Toggle ? window.eli5Toggle.wrapContent(lesson.content, eli5Data) : lesson.content)}
      </div>

      <!-- Lesson Navigation -->
      <div class="mt-12 pt-6 border-t border-gray-200 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <button id="lesson-nav-prev" class="px-3 py-1.5 rounded text-xs font-bold bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors">
            <i class="fa-solid fa-chevron-left mr-1"></i> Previous
          </button>
          <span id="lesson-nav-info" class="text-xs text-gray-400 font-mono"></span>
          <button id="lesson-nav-next" class="px-3 py-1.5 rounded text-xs font-bold bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors">
            Next <i class="fa-solid fa-chevron-right ml-1"></i>
          </button>
        </div>
        <button id="mark-lesson-complete" class="px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
          isCompleted
            ? 'bg-gray-200 text-gray-700 cursor-default'
            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'
        }">
          ${isCompleted ? '<i class="fa-solid fa-check"></i> Completed' : 'Mark as Complete & Continue'}
        </button>
      </div>
    </div>
  `;

  /* ELI5 toggle */
  if (window.eli5Toggle) {
    const lessonContainer = DOM.tabLesson.querySelector('.eli5-lesson-container');
    if (lessonContainer) {
      const oldToggle = lessonContainer.querySelector('.eli5-toggle');
      if (oldToggle) oldToggle.remove();
      window.eli5Toggle.initToggle('vue', lessonContainer);
    }
  }

  /* Re-bind lesson nav buttons since innerHTML replaced them */
  const prevBtn = document.getElementById('lesson-nav-prev');
  const nextBtn = document.getElementById('lesson-nav-next');
  const infoSpan = document.getElementById('lesson-nav-info');

  DOM.lessonNavPrev = prevBtn;
  DOM.lessonNavNext = nextBtn;
  DOM.lessonNavInfo = infoSpan;

  if (prevBtn) prevBtn.addEventListener('click', navigateLessonPrev);
  if (nextBtn) nextBtn.addEventListener('click', navigateLessonNext);

  renderLessonNav();

  /* Mark complete button */
  if (!isCompleted) {
    const btn = document.getElementById('mark-lesson-complete');
    if (btn) {
      btn.addEventListener('click', () => {
        markItemComplete(lesson.id);
        renderLesson(lesson);
        switchTab('playground');
      });
    }
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
        <p class="text-gray-500 text-sm mt-1">${mod.quiz.length} questions — test your knowledge!</p>
        ${isCompleted ? '<span class="inline-block mt-3 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-semibold"><i class="fa-solid fa-check mr-1"></i> Passed</span>' : ''}
      </div>
      <div id="quiz-questions-container" class="space-y-8">
  `;

  mod.quiz.forEach((q, index) => {
    html += `
      <div class="bg-white border rounded-xl p-6 shadow-sm">
        <h4 class="font-semibold text-lg text-gray-800 mb-4">
          <span class="text-emerald-600 mr-2">${index + 1}.</span>${q.question}
        </h4>
        <div class="space-y-3">
    `;

    q.options.forEach((opt, optIdx) => {
      const isSelected = state.quizAnswers[q.id] === optIdx;
      html += `
        <label class="flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
          isSelected ? 'bg-emerald-50 border-emerald-300' : 'hover:bg-gray-50 border-gray-200'
        }">
          <input type="radio" name="quiz-${q.id}" value="${optIdx}" class="form-radio text-emerald-600 h-5 w-5" ${
        isSelected ? 'checked' : ''
      } onchange="handleQuizSelection('${q.id}', ${optIdx})">
          <span class="ml-3 text-gray-700">${opt}</span>
        </label>
      `;
    });
    html += `</div></div>`;
  });

  html += `
      </div>
      <div class="mt-8 flex flex-col items-center border-t pt-8">
        <button id="submit-quiz-btn" class="px-8 py-3 rounded-lg font-bold text-lg text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all">
          Submit Answers
        </button>
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
      feedback.innerText = 'Please answer all questions before submitting.';
      feedback.classList.add('text-red-600');
      return;
    }

    if (score === mod.quiz.length) {
      feedback.innerHTML = '<i class="fa-solid fa-check"></i> Perfect! You passed all questions.';
      feedback.classList.add('text-green-600');
      markItemComplete(quizId);
      renderSidebar();

      // Show explanations for all questions
      mod.quiz.forEach((q, i) => {
        const container = document.querySelectorAll('.bg-white.border.rounded-xl.p-6.shadow-sm');
        if (container[i]) {
          const existing = container[i].querySelector('.quiz-explanation');
          if (!existing) {
            const explanation = document.createElement('div');
            explanation.className = 'quiz-explanation mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800';
            explanation.innerHTML = `<i class="fa-solid fa-check-circle mr-1"></i> ${q.explanation || ''}`;
            container[i].appendChild(explanation);
          }
        }
      });
    } else {
      feedback.innerText = `You scored ${score} out of ${mod.quiz.length}. Try again!`;
      feedback.classList.add('text-red-600');

      // Highlight wrong answers
      mod.quiz.forEach((q, i) => {
        const inputs = document.querySelectorAll(`input[name="quiz-${q.id}"]`);
        inputs.forEach((input, idx) => {
          const label = input.closest('label');
          if (state.quizAnswers[q.id] === idx && idx !== q.correct) {
            label.classList.add('border-red-300', 'bg-red-50');
          }
          if (idx === q.correct) {
            label.classList.add('border-green-300', 'bg-green-50');
          }
        });
      });
    }
  });
}

window.handleQuizSelection = function (questionId, optionIndex) {
  state.quizAnswers[questionId] = optionIndex;
  renderQuiz(getActiveModule());
};

// --- Vue Code Interpreter Sandbox ---
function runCode() {
  let userCode = DOM.codeEditor.value;

  userCode = userCode.replace(
    /import\s*\{[^}]*\}\s*from\s*['"][^'"]*['"];?\s*/g,
    ''
  );

  const vueGlobals = [
    'createApp', 'ref', 'reactive', 'computed', 'watch', 'watchEffect',
    'onMounted', 'onUnmounted', 'onBeforeMount', 'onBeforeUnmount',
    'onUpdated', 'onBeforeUpdate', 'nextTick', 'toRef', 'toRefs',
    'provide', 'inject', 'defineComponent', 'h',
  ];

  const iframeContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <script src="https://cdn.tailwindcss.com"><\/script>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
      <script src="https://unpkg.com/vue@3/dist/vue.global.prod.js"><\/script>
      <style>
        body { margin: 0; padding: 20px; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; background-color: #ffffff; color: #1f2937; }
        #error-boundary { color: #dc2626; background: #fee2e2; padding: 15px; border-radius: 8px; margin: 10px; font-family: monospace; white-space: pre-wrap; border: 1px solid #fca5a5; }
      </style>
    </head>
    <body>
      <div id="error-container"></div>
      <script>
        var { ${vueGlobals.join(', ')} } = Vue;
      <\/script>
      ${userCode}
      <script>
        window.onerror = function(msg, url, lineNo, columnNo, error) {
          var errContainer = document.getElementById('error-container');
          errContainer.innerHTML = '<div id="error-boundary"><strong>Runtime Error:</strong><br/>' + msg + '</div>';
          return false;
        };
      <\/script>
    </body>
    </html>
  `;

  DOM.previewFrame.srcdoc = iframeContent;
}

// Start app
document.addEventListener('DOMContentLoaded', init);
