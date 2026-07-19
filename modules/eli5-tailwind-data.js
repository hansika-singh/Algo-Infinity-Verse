/**
 * ELI5 (Explain Like I'm 5) content for Tailwind CSS Academy lessons.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

const eli5TailwindData = {
  // ─── Module 1: Utility-First CSS Basics ───
  'utility-1': `
    <p><strong>Utility-First</strong> CSS is like having a <strong>box of LEGO bricks</strong> instead of pre-built toy cars.</p>
    <p>Normally, you write CSS like this: you build a "car" class, a "house" class, a "tree" class. Each one is a finished toy. If you want a blue car instead of red, you have to build a whole new "blue-car" class!</p>
    <p>With Tailwind, you get a box of <strong>tiny LEGO bricks</strong> instead. Each brick does ONE thing:</p>
    <ul>
      <li><code>bg-blue-500</code> = "a blue LEGO brick" (background color)</li>
      <li><code>text-white</code> = "a white LEGO brick" (text color)</li>
      <li><code>font-bold</code> = "a thick LEGO brick" (bold text)</li>
      <li><code>p-4</code> = "a spacer LEGO brick" (padding)</li>
      <li><code>rounded</code> = "a round-edged LEGO brick" (rounded corners)</li>
    </ul>
    <p>You snap these tiny bricks together <strong>directly in your HTML</strong> — no need to invent class names like <code>.btn-blue</code> or switch between HTML and CSS files constantly.</p>
    <p>The best part? You never write CSS that says "I want a blue button with white text and padding." Instead, you just put the bricks together in HTML: <code>class="bg-blue-500 text-white font-bold py-2 px-4 rounded"</code>. BAM — instant button, no custom CSS needed!</p>
    <p>Think of it like describing what you want directly instead of giving assembly instructions to someone else. Faster, simpler, and everything stays right where you can see it!</p>
  `,

  // ─── Module 2: Flexbox Layouts ───
  'flexbox-1': `
    <p><strong>Flexbox</strong> is like a <strong>magic lunch tray</strong> that arranges your food perfectly.</p>
    <p>Imagine you're carrying a lunch tray. You put a sandwich on the left, chips in the middle, and a drink on the right. The tray (flex container) automatically keeps them all in a row and spaced nicely.</p>
    <p>Tailwind makes flexbox easy with simple class names:</p>
    <ul>
      <li><code>flex</code> — turns ANY element into a magic lunch tray. Everything inside becomes an item on the tray.</li>
      <li><code>flex-col</code> — instead of a row (left to right), stack items top-to-bottom — like a stack of pancakes instead of a line of food.</li>
      <li><code>justify-between</code> — pushes items to the far ends, like putting ketchup at one end of the tray and mustard at the other, with fries in the middle!</li>
      <li><code>items-center</code> — centers everything vertically. Like making sure all your food is perfectly aligned in the middle of the tray.</li>
      <li><code>space-x-4</code> — adds breathing room between siblings. Like leaving a finger-width gap between your sandwich and chips so they don't touch.</li>
    </ul>
    <p>Real-world example: a navigation bar with a logo on the left and buttons on the right. You'd use <code>flex justify-between items-center</code>. The logo stays left, buttons stay right, and everything stays vertically centered — all with ONE line of classes!</p>
  `,

  // ─── Module 3: CSS Grid System ───
  'grid-1': `
    <p><strong>CSS Grid</strong> is like a <strong>board game grid</strong> where you place your pieces in exact squares.</p>
    <p>Think of a chessboard. It has 8 rows and 8 columns — that's a grid! You can place a knight on square E4, a pawn on A2, a rook on H1. Each piece knows exactly where it belongs.</p>
    <p>Tailwind grid classes let you create these boards easily:</p>
    <ul>
      <li><code>grid</code> — announces "THIS IS A GRID!" Like unrolling a checkerboard on the table.</li>
      <li><code>grid-cols-3</code> — "I want 3 columns" — like dividing your cake into 3 equal slices.</li>
      <li><code>gap-4</code> — adds space BETWEEN grid cells. Like leaving a little gap between each slice of cake so they don't squish together.</li>
      <li><code>col-span-2</code> — makes one item SPAN across 2 columns. Like a tall person sitting across two seats on the bus!</li>
    </ul>
    <p>Grid is great for <strong>dashboard layouts</strong> — like a news website with a big main story, a sidebar, and a row of smaller stories at the bottom. The main story uses <code>col-span-2</code> to take up more space, while smaller stories fit neatly in single columns.</p>
    <p>The difference between Flexbox and Grid: Flexbox is like a lunch tray (one row or one column of items). Grid is like a chessboard (rows AND columns at the same time). Use Flexbox for simple lines of things, Grid for full page layouts!</p>
  `,

  // ─── Module 4: Typography & Borders ───
  'typography-1': `
    <p><strong>Typography</strong> is about making text <strong>look good</strong>. Borders and shadows are like <strong>picture frames</strong> — they make your content stand out on the wall.</p>
    <p>Tailwind gives you simple knobs to twist for all text and border settings:</p>
    <ul>
      <li><code>text-lg</code>, <code>text-4xl</code> — controls text size. Like a volume knob: <code>text-xs</code> is a whisper, <code>text-6xl</code> is a shout!</li>
      <li><code>font-bold</code>, <code>font-light</code> — controls text thickness. Like a pen: <code>font-thin</code> is a fine-tip marker, <code>font-black</code> is a chunky permanent marker.</li>
      <li><code>tracking-wider</code> — controls space BETWEEN letters (letter-spacing). Like pushing letters apart or squishing them together.</li>
      <li><code>border</code> — adds a border around an element. Like drawing a box around something with a pencil.</li>
      <li><code>rounded-xl</code>, <code>rounded-full</code> — rounds the corners. <code>rounded-sm</code> is slightly soft corners, <code>rounded-full</code> turns a square into a circle (pill shape)!</li>
      <li><code>shadow-md</code>, <code>shadow-xl</code> — adds a drop shadow. Like lifting a card slightly off the table so it casts a shadow.</li>
    </ul>
    <p>Want to make a card that looks professional? Layer a few of these: white background, rounded corners, a soft shadow, and nicely sized text. It's like dressing up your content in a nice outfit — people take it more seriously!</p>
  `,

  // ─── Module 5: Responsive Breakpoints ───
  'responsive-1': `
    <p><strong>Responsive design</strong> is like having a <strong>shape-shifting chair</strong> that changes size depending on who sits in it.</p>
    <p>The chair is tiny for a child (mobile phone), medium for a teenager (tablet), and big for an adult (desktop computer). <strong>Same chair, different sizes!</strong></p>
    <p>Tailwind is <strong>mobile-first</strong>. That means you start by designing for the tiniest screen first (phone), then add classes to make things look better on bigger screens:</p>
    <ul>
      <li><code>sm:</code> — for small screens (640px+). Like a kids' chair.</li>
      <li><code>md:</code> — for medium screens (768px+). Like a teen's chair.</li>
      <li><code>lg:</code> — for large screens (1024px+). Like an adult's chair.</li>
      <li><code>xl:</code> — for extra-large (1280px+). Like a big armchair.</li>
    </ul>
    <p>Here's the cool part: you write <code>class="flex flex-col md:flex-row"</code> — that means "stack items vertically on phones, but switch to horizontal row on tablets and up." The layout <strong>automatically adjusts</strong> based on screen size!</p>
    <p>Think of it like giving instructions to a smart furniture store: "Deliver the small layout for phones. But when the screen is bigger (md:), deliver the two-column layout instead." No separate mobile and desktop websites — just one page that shapeshifts!</p>
  `,

  // ─── Module 6: Dark Mode Support ───
  'dark-1': `
    <p><strong>Dark mode</strong> is like having a <strong>night light setting</strong> for your room. During the day, you have bright curtains and light colors. At night, you switch to dim, cozy lighting.</p>
    <p>Tailwind uses the <code>dark:</code> prefix — it's like a light switch that flips colors between day and night mode:</p>
    <ul>
      <li>Day mode: <code>bg-white text-gray-900</code> — white paper with dark ink.</li>
      <li>Night mode: <code>dark:bg-gray-900 dark:text-white</code> — dark paper with white ink. Easier on the eyes!</li>
    </ul>
    <p>You just add <code>class="dark"</code> to the <code>&lt;html&gt;</code> tag, and Tailwind instantly flips all <code>dark:</code> prefixed classes on:</p>
    <p><code>&lt;div class="bg-white dark:bg-slate-800 text-black dark:text-white"&gt;</code></p>
    <p>This means: "In day mode, this is a white box with black text. In night mode, it's a dark box with white text." The element knows what time it is and dresses accordingly!</p>
    <p>You can let users toggle dark mode with a button, or have it follow their system preference automatically. It's like your website wearing a different outfit depending on the time of day!</p>
  `,

  // ─── Module 7: Hover, Active & Focus States ───
  'pseudo-1': `
    <p><strong>Interactive states</strong> are like <strong>how a cat reacts to different touches</strong>.</p>
    <ul>
      <li><strong>Hover</strong> — your hand hovers NEAR the cat but doesn't touch. The cat's ear twitches. That's <code>hover:</code> — the element changes when your mouse is near but hasn't clicked.</li>
      <li><strong>Active</strong> — you actually PET the cat. It purrs and leans into your hand. That's <code>active:</code> — the element changes WHILE you're clicking or tapping.</li>
      <li><strong>Focus</strong> — you look DIRECTLY at the cat, making eye contact. The cat knows you're paying attention. That's <code>focus:</code> — like when you tab onto an input field, it lights up to say "I'm ready for you to type here!"</li>
    </ul>
    <p>Tailwind makes these super easy:</p>
    <ul>
      <li><code>hover:bg-sky-600</code> — "when the mouse hovers over this button, turn its background a darker blue." Like a button lighting up to say "click me!"</li>
      <li><code>active:scale-95</code> — "when clicked, make the button slightly smaller." Like a real button being pressed down.</li>
      <li><code>focus:ring-2 focus:ring-sky-500</code> — "when tabbed to, add a glowing blue ring around this input." Like putting a spotlight on the active field.</li>
    </ul>
    <p>These small animations make your website feel ALIVE — like the difference between a cardboard cutout of a cat and a real one that responds to your touch!</p>
  `,

  // ─── Module 8: Transitions & Animations ───
  'animations-1': `
    <p><strong>Transitions and animations</strong> are like <strong>magic tricks on your website</strong>.</p>
    <p>Instead of things instantly popping in and out (BORING!), they smoothly move, fade, and bounce (FUN!).</p>
    <p><strong>Transitions</strong> are like a sliding door. You push it gently, and it glides open smoothly instead of snapping open instantly.</p>
    <ul>
      <li><code>transition-all</code> — "slide all changes." Any property that changes will animate smoothly.</li>
      <li><code>duration-300</code> — "the slide takes 300 milliseconds." Like saying how long the door takes to open.</li>
      <li><code>hover:bg-sky-600</code> + <code>transition-colors</code> — the color smoothly fades instead of jumping!</li>
    </ul>
    <p><strong>Animations</strong> are pre-made magic tricks that keep going:</p>
    <ul>
      <li><code>animate-spin</code> — endless rotation. Like a loading spinner that says "please wait..."</li>
      <li><code>animate-ping</code> — a radar ping effect. Like sonar waves expanding outward — great for notification dots!</li>
      <li><code>animate-pulse</code> — gentle fading in and out. Like a slow, calm heartbeat on a loading skeleton.</li>
      <li><code>animate-bounce</code> — up-and-down bouncing. Like a ball that keeps hopping, great for a "scroll down" arrow!</li>
    </ul>
    <p>Think of transitions as polite interactions (smooth handshake) and animations as party tricks (spinning plates). Use transitions for buttons and menus, animations for loading states and attention-grabbing effects!</p>
  `,

  // ─── Module 9: Capstone Project ───
  'capstone-1': `
    <p>The <strong>Capstone Project</strong> is like a <strong>final exam where you build something real</strong> — like cooking a full meal instead of just practicing chopping onions!</p>
    <p>Throughout the academy, you've learned individual skills:</p>
    <ul>
      <li>How to use utility classes (LEGO bricks)</li>
      <li>How to arrange things with Flexbox (lunch tray)</li>
      <li>How to create layouts with Grid (chessboard)</li>
      <li>How to style text and add borders (dressing up content)</li>
      <li>How to make things responsive (shape-shifting layouts)</li>
      <li>How to support dark mode (day/night outfits)</li>
      <li>How to add hover and click effects (interactive cat)</li>
      <li>How to animate things (magic tricks)</li>
    </ul>
    <p>Now you put ALL of them together into one big project — like using every kitchen tool you've learned to cook a full banquet meal!</p>
    <p>This Profile Dashboard card uses:</p>
    <ul>
      <li>A <strong>gradient header</strong> (<code>bg-gradient-to-r from-sky-400 to-indigo-500</code>) — like a sunset sky in your card</li>
      <li>A <strong>profile image that overlaps</strong> the header and content — like putting a photo that hangs over the frame</li>
      <li><strong>Flexbox</strong> for the stats row at the bottom —"Projects: 14, Score: 98%, Rank: Gold" evenly spaced</li>
      <li><strong>Borders and shadows</strong> (<code>rounded-2xl shadow-xl border</code>) — soft, premium feel</li>
      <li><strong>Responsive sizing</strong> (<code>max-w-md w-full</code>) — looks great on phone and desktop</li>
    </ul>
    <p>The magic is that EVERY class name is a small, reusable utility. You're not writing custom CSS — you're composing utilities like a master builder with millions of LEGO pieces. And now you know ALL of them!</p>
  `,
};

/* Expose globally for script-tag usage */
window.eli5TailwindData = eli5TailwindData;
