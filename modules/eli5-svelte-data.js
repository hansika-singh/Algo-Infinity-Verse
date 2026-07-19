/**
 * ELI5 (Explain Like I'm 5) content for Svelte Academy lessons.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

const eli5SvelteData = {
  // ─── Module 1: Introduction & Reactivity ───
  'reactivity-1': `
    <p>Think of Svelte like a <strong>magic coloring book</strong>.</p>
    <p>When you color a page in a regular book, nothing changes elsewhere. But in Svelte's magic book, when you color one corner red, the whole book <em>automatically</em> updates to match — you don't have to tell it to!</p>
    <p>Here's how it works: you write <code>let count = 0</code> — that's like writing a number on a piece of paper. Then you put <code>{count}</code> on the page, and Svelte <strong>glues</strong> that number to the page. Every time you change the number, the page updates <em>by itself</em>.</p>
    <p>You don't need to write extra code to "tell" the page to update. Svelte is smart enough to figure it out — like a robot assistant that reads your mind and does the busywork for you!</p>
  `,

  // ─── Module 2: Reactive Declarations & Statements ───
  'declarations-1': `
    <p>Imagine you have a <strong>magic calculator</strong> on your desk.</p>
    <p>You write <code>$: double = count * 2</code> — that's like telling the calculator: "Hey, every time I change the number on my paper, <strong>automatically</strong> write the doubled version on a sticky note next to it."</p>
    <p>The <code>$:</code> sign is like a <strong>magic sticky note</strong>. Anything you write after it gets updated <em>automatically</em> whenever the things it depends on change.</p>
    <ul>
      <li><code>$: double = count * 2</code> = a sticky note that always shows double the count.</li>
      <li><code>$: console.log(count)</code> = a robot that whispers the count every time it changes.</li>
    </ul>
    <p>You don't have to remember to update the sticky note yourself — Svelte does it for you, like a helpful friend who always keeps your notes up to date!</p>
  `,

  // ─── Module 3: Components & Props ───
  'components-1': `
    <p>Think of a <strong>component</strong> like a <strong>lunchbox</strong>.</p>
    <p>You design the lunchbox once — it has compartments for a sandwich, fruit, and a drink. But you can fill it with <em>different</em> food every day!</p>
    <p>In Svelte, <code>export let username</code> is like a <strong>label on the lunchbox</strong> that says "Put a name here." When you use the component, you slide a name into that slot — like writing "Alex" on the label.</p>
    <p>So the parent component is like the <strong>chef</strong> who prepares the lunch, and the child component is the <strong>lunchbox</strong> that displays whatever the chef puts inside. Same box, different contents every time!</p>
  `,

  // ─── Module 4: State Management with Stores ───
  'stores-1': `
    <p>Imagine a <strong>shared bulletin board</strong> in your house.</p>
    <p>Every room has a copy of the board. When someone writes a new note on the original board, <em>every copy in every room updates at the same time</em>. You never have to run room-to-room to tell everyone the news!</p>
    <p>A Svelte <strong>store</strong> is like that bulletin board. You create it once with <code>writable('Light Mode')</code>, and any component can read from it or write to it.</p>
    <p>The magic <code>$</code> prefix (like <code>$theme</code>) is like an <strong>automatic subscription</strong> — it means "keep my copy of the board in sync." When the board changes, your component updates instantly, no extra work needed!</p>
  `,

  // ─── Module 5: Animations & Transitions ───
  'transitions-1': `
    <p>Think of transitions like <strong>stage magic tricks</strong>.</p>
    <p>When a magician makes something appear, it doesn't just <em>pop</em> into existence — it fades in, slides onto the stage, or scales up from tiny to full size. That's exactly what Svelte transitions do for your web elements!</p>
    <ul>
      <li><code>fade</code> = like a ghost slowly appearing or disappearing.</li>
      <li><code>slide</code> = like a curtain sliding open or closed.</li>
      <li><code>fly</code> = like a bird flying in from off-screen.</li>
      <li><code>scale</code> = like a balloon inflating or deflating.</li>
    </ul>
    <p>You just say <code>transition:fade</code> on any element, and Svelte handles all the animation math for you — like having a personal choreographer for your webpage!</p>
  `,

  // ─── Module 6: Routing & Layouts ───
  'routing-1': `
    <p>Imagine your website is a <strong>choose-your-own-adventure book</strong>.</p>
    <p>When you click a link, instead of flipping to a whole new page (which is slow), Svelte just <strong>swaps the story</strong> in the same page — like switching channels on a TV without turning the TV off and on.</p>
    <p>This is called <strong>client-side routing</strong>. The URL in the address bar changes (like the channel number), but the page never fully reloads. It's instant — like flipping a light switch instead of rebuilding the whole room!</p>
  `,

  // ─── Module 7: Introduction to SvelteKit ───
  'sveltekit-1': `
    <p>SvelteKit is like a <strong>house builder</strong> for Svelte apps.</p>
    <p>Instead of building every room from scratch, the builder gives you a <strong>floor plan</strong>. You just create files with the right names, and the house builds itself!</p>
    <ul>
      <li><code>+page.svelte</code> = a <strong>room</strong> (what the visitor sees).</li>
      <li><code>+layout.svelte</code> = the <strong>hallway</strong> that connects rooms (shared stuff like headers and footers).</li>
      <li><code>+page.js</code> = the <strong>furniture delivery</strong> — it fetches data before the room is ready.</li>
    </ul>
    <p>You just name your files, and SvelteKit wires everything together — like a GPS that automatically knows where every room is in your house!</p>
  `,

  // ─── Module 8: Mini Projects & Capstone ───
  'project-1': `
    <p>You've learned all the building blocks — now it's time to <strong>build a real toy</strong>!</p>
    <p>A Todo list is like a <strong>to-do sticky note on your fridge</strong>. You write things down, check them off, and throw away the ones you don't need.</p>
    <p>In this project you'll use everything you've learned:</p>
    <ul>
      <li><code>let todos = [...]</code> = your sticky note list.</li>
      <li><code>addTodo()</code> = writing a new item on the note.</li>
      <li><code>removeTodo()</code> = ripping off a finished item.</li>
      <li><code>{#each todos as todo}</code> = reading every item on the note out loud.</li>
    </ul>
    <p>It's like putting together a LEGO set — each piece you learned is a brick, and now you snap them all together to build something awesome!</p>
  `
};

window.eli5SvelteData = eli5SvelteData;
