/**
 * ELI5 (Explain Like I'm 5) content for Vue Academy lessons.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

const eli5VueData = {
  // ─── Module 1: Vue Basics & Reactivity ───
  'basics-1': `
    <p>Vue is like a <strong>smart helper</strong> that builds web pages for you. Instead of writing a ton of complicated code, you tell Vue what you want the page to look like, and it figures out how to make it work!</p>
    <p>Think of it like giving instructions to a LEGO builder. You say "I want a red house with a blue roof," and the builder puts all the pieces together for you without you having to find each piece yourself.</p>
    <p>Vue uses something called the <strong>Composition API</strong> (new in Vue 3) — it's like having a recipe book that tells Vue exactly how your page should behave. When something changes (like a number going up when you click a button), Vue automatically updates the page. You don't need to tell it to update — it just happens!</p>
  `,
  'basics-2': `
    <p><strong>ref()</strong> is like a <strong>magic box</strong> that holds a number or word. When you change what's inside the box, every place on your page that shows that number or word automatically updates too!</p>
    <p>Imagine you have a scoreboard at a baseball game. The scoreboard shows "Home: 0, Away: 0". When someone scores, you change the numbers, and the scoreboard updates instantly. That's exactly what <code>ref()</code> does!</p>
    <p>To get the value out of the box, you use <code>.value</code> — like opening the box to look inside. <code>count.value</code> gives you the number, and <code>count.value = 5</code> puts a new number in.</p>
    <p>But here's the cool part: in your HTML template, you don't need <code>.value</code> — Vue is smart enough to peek inside the box for you automatically!</p>
  `,
  'basics-3': `
    <p><strong>reactive()</strong> is like a <strong>whiteboard</strong> with many different things written on it — a name, an age, a list of hobbies. You can erase and rewrite anything on the whiteboard, and everyone looking at it sees the changes instantly!</p>
    <p>While <code>ref()</code> is a single-item box, <code>reactive()</code> is for objects — things with multiple properties. Like a profile card with name, email, and avatar — you want to track all of them together.</p>
    <p>With <code>reactive()</code>, you don't need <code>.value</code>. You just use it like a regular object: <code>user.name = 'Alice'</code> — and Vue watches every change automatically!</p>
    <p>The rule of thumb: use <code>ref()</code> for numbers, words, true/false values. Use <code>reactive()</code> for objects with multiple properties. Simple!</p>
  `,
  'basics-4': `
    <p><strong>Computed properties</strong> are like a <strong>vending machine</strong>. You put something in (ingredients/state), and it gives you something else out (a snack/computed value).</p>
    <p>If you have a first name "John" and a last name "Doe", a computed property can combine them into "John Doe" automatically. You don't need to store "John Doe" separately — the vending machine makes it whenever you need it!</p>
    <p>Computed properties are <strong>smart</strong>: they remember their last result. If the ingredients haven't changed, they just give you the same snack without re-making it. This makes your app fast!</p>
    <p>Think of it like a calculator — you enter numbers (state), press a button (computed), and it shows the result. If the numbers don't change, the result stays the same. If you change a number, the calculator re-computes!</p>
  `,
  'basics-5': `
    <p><strong>Watchers</strong> are like a <strong>baby monitor</strong>. You set it up to watch something specific (like a baby sleeping), and it alerts you when something changes (the baby wakes up).</p>
    <p>You use <code>watch()</code> when you want to <strong>react to changes</strong> — save data to the server when a form changes, show a message when a value hits a limit, or start an animation when something happens.</p>
    <p>Difference between computed and watch:</p>
    <ul>
      <li><strong>Computed</strong> = vending machine. Input in → output out. Always produces a value.</li>
      <li><strong>Watch</strong> = baby monitor. Watches for changes → runs code. Does side effects (like saving data).</li>
    </ul>
    <p>Use <code>watchEffect</code> when you want to watch MULTIPLE things at once without specifying exactly what — like a security guard who watches everything in a room, not just one specific door!</p>
  `,

  // ─── Module 2: Template Directives ───
  'directives-1': `
    <p><strong>v-if</strong> and <strong>v-for</strong> are like <strong>magic instructions</strong> you put in your HTML to make pages smart.</p>
    <p><strong>v-if</strong> is like a light switch — flip it on, the element appears. Flip it off, it disappears. <code>v-if="isLoggedIn"</code> means "only show this if the user is logged in!"</p>
    <p><strong>v-for</strong> is like a copy machine — give it a list of items, and it stamps out HTML for each one. "I have 3 fruits: apple, banana, cherry" → it creates 3 list items, one for each fruit!</p>
    <p>Together they're super powerful. You can say: "Show a list of my tasks, and if there are no tasks, show a friendly message instead." The page takes care of itself — you just provide the data!</p>
  `,
  'directives-2': `
    <p><strong>v-bind</strong> is like a <strong>remote control</strong> for HTML attributes. You can change what a button looks like, whether it's disabled, or where a link goes — all from your JavaScript!</p>
    <p>Normally in HTML, you hard-code attributes: <code>&lt;img src="cat.jpg"&gt;</code>. But with <code>v-bind</code> (or just <code>:</code> for short), you make them DYNAMIC: <code>:src="imageUrl"</code>. When <code>imageUrl</code> changes, the image changes!</p>
    <p>This is super useful for:</p>
    <ul>
      <li><strong>Classes</strong> — <code>:class="{ active: isActive }"</code> adds a CSS class when isActive is true.</li>
      <li><strong>Styles</strong> — <code>:style="{ color: textColor }"</code> changes text color dynamically.</li>
      <li><strong>Disabled</strong> — <code>:disabled="!isFormValid"</code> disables a button when the form isn't ready.</li>
    </ul>
    <p>Think of it like having a puppet master (your JS code) who controls everything on stage (the HTML) with strings!</p>
  `,
  'directives-3': `
    <p><strong>v-model</strong> is like a <strong>two-way walkie-talkie</strong> between your data and an input field. When you type something in a text box, your data updates. When your data changes, the text box updates. Both ways!</p>
    <p>Imagine a name tag that you can write on. You write "Alice" on the tag. Now the tag shows "Alice" AND your computer knows the name is "Alice". If you cross out "Alice" and write "Bob", both the tag and the computer agree on "Bob".</p>
    <p><code>&lt;input v-model="name"&gt;</code> does THREE things at once:</p>
    <ol>
      <li>Shows whatever <code>name</code> currently is in the input box.</li>
      <li>Listens for when you type and updates <code>name</code> automatically.</li>
      <li>Works with different input types — text boxes, checkboxes, dropdown menus!</li>
    </ol>
    <p>It's the easiest way to handle forms in Vue. One line = two-way binding!</p>
  `,
  'directives-4': `
    <p><strong>v-on</strong> (or <code>@</code> for short) is like <strong>wiring a doorbell</strong>. Press the button → the bell rings. Click an element → your function runs!</p>
    <p>Your page has buttons, links, and interactive elements. <code>v-on:click="doSomething"</code> (or <code>@click="doSomething"</code>) says: "When someone clicks this, run the <code>doSomething</code> function!"</p>
    <p>Vue gives you <strong>event modifiers</strong> that are like special filters:</p>
    <ul>
      <li><code>@click.stop</code> — stop the click from bubbling up (like catching a ball and not passing it).</li>
      <li><code>@submit.prevent</code> — prevent the form from refreshing the page (the default behavior).</li>
      <li><code>@keydown.enter</code> — only trigger when the Enter key is pressed (not any key).</li>
    </ul>
    <p>Think of v-on as the nervous system of your page — it carries signals from the user's actions to your code, making the page come alive!</p>
  `,
  'directives-5': `
    <p><strong>v-show</strong> is like <strong>hiding something under a blanket</strong>. The thing is still there on your bed, but you can't see it. When you lift the blanket, there it is!</p>
    <p>The difference between <code>v-if</code> and <code>v-show</code>:</p>
    <ul>
      <li><code>v-if</code> = taking something off the shelf. It's either there or it's NOT. If you hide it, it's completely gone.</li>
      <li><code>v-show</code> = putting a blanket over it. It's still there (in the HTML), just hidden with CSS (<code>display: none</code>).</li>
    </ul>
    <p>When to use which? If something shows/hides a LOT (like a tooltip that appears when you hover), use <code>v-show</code> — it's faster because the element is always there. If something shows once and stays (like a login form), use <code>v-if</code> — it keeps the page lighter!</p>
  `,

  // ─── Module 3: Lifecycle Hooks ───
  'lifecycle-1': `
    <p><strong>onMounted</strong> is like the <strong>housewarming party</strong> for your component. You've just moved in (the component was created and added to the page), and now you can finally set everything up — hang pictures, connect the Wi-Fi, invite friends over!</p>
    <p>In coding terms, <code>onMounted</code> runs after your component has been added to the webpage. It's the perfect time to:</p>
    <ul>
      <li>Fetch data from a server (like loading your profile info).</li>
      <li>Set up timers or intervals.</li>
      <li>Connect to a chat service.</li>
      <li>Start animations.</li>
    </ul>
    <p><strong>onUnmounted</strong> is the moving-out day. Your component is leaving the page. Before it goes, you need to clean up — turn off timers, disconnect from chats, cancel network requests. Goodbye, component!</p>
    <p>Think of it like a hotel room: <code>onMounted</code> is checking in (unpack your bags, set up), <code>onUnmounted</code> is checking out (pack up, leave the keys). Always clean up after yourself!</p>
  `,
  'lifecycle-2': `
    <p><strong>Lifecycle flow</strong> is like the <strong>stages of baking a cake</strong>. Each step happens in order, and you can do something at each step!</p>
    <ol>
      <li><strong>setup()</strong> — Gather all your ingredients. You're in the kitchen, but nothing is in the oven yet!</li>
      <li><strong>onBeforeMount</strong> — You've mixed the batter and poured it into the pan. The cake isn't in the oven yet, but it's ready to go.</li>
      <li><strong>onMounted</strong> — The cake is in the oven! You can see it through the glass door. The timer is ticking!</li>
    </ol>
    <p>The order of hooks in a Vue component:</p>
    <ol>
      <li><code>setup()</code> — everything is created here</li>
      <li><code>onBeforeMount()</code> — the template has been compiled, but NOT yet on the page</li>
      <li><code>onMounted()</code> — the component IS on the page. DOM is ready!</li>
      <li><code>onBeforeUpdate()</code> — data changed, about to re-render</li>
      <li><code>onUpdated()</code> — re-rendered! DOM is fresh again.</li>
      <li><code>onBeforeUnmount()</code> — about to be removed from page</li>
      <li><code>onUnmounted()</code> — removed! Clean up time.</li>
    </ol>
    <p>Each hook gives you a chance to do something at a specific time. Like baking — you prep ingredients before mixing, and you wait for the cake to cool before frosting!</p>
  `,
  'lifecycle-3': `
    <p><strong>onUpdated</strong> is like <strong>re-decorating your room</strong>. When you change the posters on your wall, the room looks different. The wall is "updated" with the new posters!</p>
    <p>In Vue, when your data changes, the component re-renders — like redecorating. <code>onUpdated</code> runs AFTER the re-decorating is done. The new HTML is on the page, and you can see the fresh results.</p>
    <p><strong>onBeforeUpdate</strong> runs just BEFORE the re-decorating. The old posters are still on the wall, but you've already chosen the new ones. It's like that moment of pause before you make a change.</p>
    <p>When might you need these?</p>
    <ul>
      <li>After update: log that something changed, or access the new DOM.</li>
      <li>Before update: save scroll position before the list changes, or validate changes.</li>
    </ul>
    <p>Important: Don't change state inside <code>onUpdated</code> — that's like changing the posters while the decorator is already done. You'll cause an endless loop of redecorating!</p>
  `,
  'lifecycle-4': `
    <p><strong>KeepAlive</strong> is like a <strong>parked car</strong> instead of a rental car.</p>
    <p>Normally, when you switch between tabs or pages, Vue destroys the old component and creates a new one. Like returning a rental car — all your stuff is gone, and you start fresh with a new car.</p>
    <p>With <code>&lt;KeepAlive&gt;</code>, Vue <strong>keeps the component alive in memory</strong>. Like parking your own car in the garage — when you come back, everything is exactly how you left it! The radio is still on your station, the seat is adjusted to your position.</p>
    <p><strong>onActivated</strong> runs when the "parked" component comes back. Like opening the car door — "Ah, good to be back!"</p>
    <p><strong>onDeactivated</strong> runs when the component gets "parked". Like turning off the engine — "See you later!"</p>
    <p>Use KeepAlive for: tab panels, list-detail views, wizards — anywhere you want to preserve state without re-creating everything!</p>
  `,
  'lifecycle-5': `
    <p><strong>onErrorCaptured</strong> is like having a <strong>safety net at the circus</strong>.</p>
    <p>A trapeze artist might slip and fall. But the safety net catches them! The show can go on, and nobody gets hurt.</p>
    <p>In Vue, a child component might have an error — maybe it tries to load data from a server that's down, or it has a bug in the code. Normally, this would crash the whole app. But with <code>onErrorCaptured</code>, you can:</p>
    <ol>
      <li><strong>Catch the error</strong> — like a safety net catching the trapeze artist.</li>
      <li><strong>Show a friendly message</strong> — "Oops, something went wrong. Please try again!"</li>
      <li><strong>Log the error</strong> — send it to your error tracking service so you can fix it later.</li>
      <li><strong>Prevent the crash</strong> — the rest of your app keeps working normally!</li>
    </ol>
    <p>You can even have MULTIPLE safety nets — if one component doesn't catch the error, it bubbles up to the parent's safety net, and so on up to the top. Like a stack of crash mats!</p>
  `,
};

/* Expose globally so the academy page can access it */
window.eli5VueData = eli5VueData;
