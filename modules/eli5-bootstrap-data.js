/**
 * ELI5 (Explain Like I'm 5) content for Bootstrap Academy lessons.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

const eli5BootstrapData = {
  /* ── Grid System ── */
  'grid-1': `
    <p>Think of Bootstrap's grid like a <strong>row of 12 chairs</strong>. You can fill them any way you want — take up 6 chairs for one section, 4 for another, and 2 for the last. Together they always add up to 12!</p>
    <p>The <strong>container</strong> is the room that holds the chairs. The <strong>row</strong> is the line of chairs. <strong>Columns</strong> are the individual chairs. Put content <em>inside</em> a column and it sits nicely in its spot.</p>
    <p>On a phone screen, each chair might need a whole row to itself. On a big monitor, many chairs fit side-by-side. Bootstrap shifts things automatically so it always looks good.</p>
  `,
  'grid-breakpoints': `
    <p>Breakpoints are like <strong>different-sized tables</strong>. What fits on a big dinner table (desktop) won't fit on a tiny nightstand (phone). Bootstrap has preset table sizes:</p>
    <ul>
      <li><strong>sm</strong> (576px+) — like a small desk</li>
      <li><strong>md</strong> (768px+) — like a kitchen table</li>
      <li><strong>lg</strong> (992px+) — like a dining table</li>
      <li><strong>xl</strong> (1200px+) — like a conference table</li>
    </ul>
    <p>You write rules like "on medium tables and bigger, this section takes 6 chairs". On smaller tables, it automatically takes all 12 chairs. Just say <code>col-md-6</code> — Bootstrap handles the rest!</p>
  `,
  'grid-columns': `
    <p>Column sizing is like <strong>splitting a pizza</strong>. An extra-large pizza has 12 slices. You can give one person 6 slices, another 4, and another 2 — but everyone together gets the whole pizza.</p>
    <p><strong>Equal-width columns</strong> (<code>col</code>) are like cutting the pizza into equal slices. If you have 3 people, each gets 4 slices. But if you have 6 people, each automatically gets 2 slices.</p>
    <p><strong>Specific column sizes</strong> (<code>col-4</code>) let you decide exactly how many slices each person gets. Mix and match! A sidebar might be <code>col-3</code> (3 slices) and the main area <code>col-9</code> (9 slices).</p>
  `,
  'grid-gutters': `
    <p>Gutters are like the <strong>space between seats on a bench</strong>. Without any gap, people sit shoulder-to-shoulder — awkward! Gutters add breathing room between columns.</p>
    <p>Bootstrap gives you <strong>three gutter sizes</strong>: <code>g-0</code> (no gap, like a packed subway), <code>g-3</code> (normal gap), and <code>g-5</code> (wide gap, like a VIP lounge).</p>
    <p>Without gutters, text from one column might touch the edge of the image in the next column. Gutters keep everything looking tidy and professional — like margins in a notebook.</p>
  `,

  /* ── Cards & Buttons ── */
  'comp-1': `
    <p>A Bootstrap card is like an <strong>index card</strong> — a flexible container with a title, some text, and maybe a picture. You can put cards in a grid to make a gallery or product listing.</p>
    <p>Cards have parts: a <strong>header</strong> (top label), a <strong>body</strong> (main content), an <strong>image</strong> (optional picture), and a <strong>footer</strong> (bottom info). Just add the right classes and it looks polished instantly.</p>
    <p>Buttons use <code>.btn</code> plus a color like <code>.btn-primary</code> (blue) or <code>.btn-danger</code> (red). Think of it as putting a colored sticker on a button — pick the color that matches your intent.</p>
  `,
  'comp-button-variants': `
    <p>Button variants are like <strong>different colored highlighters</strong>. Each color has a meaning:</p>
    <ul>
      <li><strong>Primary</strong> (blue) = main action, like "Submit"</li>
      <li><strong>Secondary</strong> (gray) = backup action, like "Cancel"</li>
      <li><strong>Success</strong> (green) = positive action, like "Save"</li>
      <li><strong>Danger</strong> (red) = destructive action, like "Delete"</li>
      <li><strong>Warning</strong> (yellow) = careful action, like "Proceed with caution"</li>
    </ul>
    <p><strong>Outline buttons</strong> (<code>.btn-outline-primary</code>) are like a coloring book page — just the outline, no fill. They're great for secondary actions that shouldn't scream for attention.</p>
    <p><strong>Button sizes</strong> (<code>.btn-lg</code>, <code>.btn-sm</code>) are like small, medium, and large T-shirts. Pick the one that fits!</p>
  `,
  'comp-card-layout': `
    <p><strong>Card groups</strong> are like a row of business cards sitting side-by-side with no gap. If one card has more text, they all stretch to be the same height — like adjusting the height of all glasses to match the tallest one.</p>
    <p><strong>Card decks</strong> are like cards with a small gap between each. Perfect for a gallery of products, team member profiles, or a blog listing.</p>
    <p><strong>Card columns</strong> arrange cards like a Pinterest board — cards stack at different heights, like stone blocks in a wall. Each card finds its own spot.</p>
  `,
  'comp-card-horizontal': `
    <p>A <strong>horizontal card</strong> is like a magazine with the picture on one side and the article on the other. Instead of stacking image-on-top-of-text, you put them side-by-side.</p>
    <p>Use Bootstrap's grid to split the card in half: <code>col-md-4</code> for the image and <code>col-md-8</code> for the text. Inside a <code>.card-body</code>, put the row. It's that simple!</p>
    <p>On mobile, the horizontal layout automatically stacks (image on top, text below) so it still looks great on small screens.</p>
  `,

  /* ── Modals & Interactivity ── */
  'modals-1': `
    <p>A modal is like a <strong>pop-up notification</strong> that appears on top of everything else. You click a button, and a box slides down from the top of your screen asking for input or showing info.</p>
    <p>The great part? Bootstrap handles all the tricky JavaScript. Just write HTML with <code>data-bs-toggle="modal"</code> and <code>data-bs-target="#myModal"</code>. Click the button → modal opens. Click outside → modal closes. No code needed!</p>
    <p>Think of it like a garage door remote — press one button and the door opens, no wiring required.</p>
  `,
  'modals-sizes': `
    <p>Modal sizes are like <strong>different-sized pizza boxes</strong>. Sometimes you need a small box (just a slice), sometimes a large box (the whole party pizza).</p>
    <ul>
      <li><code>.modal-sm</code> = small box, good for a quick confirmation</li>
      <li>Default = medium box, for typical forms and info</li>
      <li><code>.modal-lg</code> = large box, for lots of content</li>
      <li><code>.modal-xl</code> = extra-large box, nearly full screen</li>
    </ul>
    <p><strong>Full-screen modals</strong> on mobile are like the box <em>becoming</em> the table — it takes up everything. Very useful for forms on phones.</p>
  `,
  'modals-forms': `
    <p>Putting a form inside a modal is like having <strong>a clipboard that pops up</strong> when you need to fill something out. Click "Add User" → a modal appears with name, email, and phone fields → fill it out and click "Save".</p>
    <p>This is great for quick data entry. Instead of navigating to a whole new page, a modal appears over your current work, you type what you need, and it disappears. No page reload, no lost context.</p>
    <p>Just put <code>&lt;form&gt;</code> HTML inside the modal body and add a save button in the modal footer. The close button in the top-right lets users bail out without saving.</p>
  `,
  'modals-tabs': `
    <p>Tabbed content is like a <strong>filing cabinet with labeled dividers</strong>. Each tab shows different content without loading a new page. Click "Settings" to see settings, click "Profile" to see profile — all in the same space.</p>
    <p>Bootstrap uses <code>nav-tabs</code> combined with tab panels. Each <code>data-bs-toggle="tab"</code> link connects to a <code>.tab-pane</code> by its <code>id</code>. Click a tab, and the matching panel appears.</p>
    <p>You can even put tabs inside a modal! That's like having a filing cabinet inside a pop-up — powerful and space-efficient.</p>
  `,

  /* ── Typography & Text ── */
  'typo-headings': `
    <p>Headings are like <strong>chapter titles in a book</strong>. <code>&lt;h1&gt;</code> is the book title (biggest), <code>&lt;h2&gt;</code> is a chapter title, <code>&lt;h3&gt;</code> is a section inside a chapter, and so on down to <code>&lt;h6&gt;</code>.</p>
    <p>Bootstrap makes headings look great by default — proper size, weight, and spacing. You can also use <code>.h1</code> through <code>.h6</code> classes on any element. Want a <code>&lt;p&gt;</code> to look like a heading? Add <code>class="h1"</code>!</p>
    <p>There's also <code>.text-muted</code> for lighter, secondary text (like a subtitle) that's less visually dominant.</p>
  `,
  'typo-display': `
    <p><strong>Display headings</strong> are like movie poster text — bigger and more dramatic than regular headings. Use them for hero sections, landing pages, or anywhere you need to grab attention.</p>
    <p>Bootstrap offers <code>.display-1</code> through <code>.display-6</code>, where <code>.display-1</code> is the biggest (like an IMAX movie title) and <code>.display-6</code> is the smallest (like a TV show title).</p>
    <p>Use display headings sparingly — like hot sauce. A little on a hero banner is great. Using them everywhere makes the page feel chaotic.</p>
  `,
  'typo-alignment': `
    <p>Text alignment is like <strong>arranging furniture in a room</strong>. You can push everything to the left wall, center it in the middle, or push it to the right wall.</p>
    <ul>
      <li><code>.text-start</code> = pushed to the left (like a bookshelf on the wall)</li>
      <li><code>.text-center</code> = centered (like a coffee table)</li>
      <li><code>.text-end</code> = pushed to the right (like a lamp in the corner)</li>
    </ul>
    <p>The <strong>best part</strong>: you can change alignment at different screen sizes. <code>.text-md-center</code> means "center this text on medium screens and up, but left-align it on phones". Perfect for responsive layouts!</p>
  `,

  /* ── Utilities & Spacing ── */
  'utils-spacing': `
    <p>Spacing utilities are like <strong>putting cushions between boxes</strong>. <strong>Margin</strong> (<code>m</code>) is space <em>outside</em> an element — like the gap between two photo frames on a wall. <strong>Padding</strong> (<code>p</code>) is space <em>inside</em> an element — like the mat border around a photo inside its frame.</p>
    <p>Sizes go from <code>0</code> (no space) to <code>5</code> (lots of space). <code>mt-3</code> adds medium margin on top. <code>p-2</code> adds small padding on all sides. <code>mx-auto</code> centers a block element horizontally.</p>
    <p>Think of it like this: padding is the bubble wrap <em>inside</em> the box, margin is the gap <em>between</em> boxes on a shelf.</p>
  `,
  'utils-borders': `
    <p>Borders are like <strong>outlines on a coloring book page</strong>. They define edges and separate things visually. Bootstrap lets you add, remove, color, and round borders easily.</p>
    <ul>
      <li><code>.border</code> = add a pencil outline on all sides</li>
      <li><code>.border-top</code> = outline just the top edge</li>
      <li><code>.border-0</code> = no outline (remove border)</li>
      <li><code>.border-primary</code> = blue outline</li>
      <li><code>.rounded</code> = slightly round the corners</li>
      <li><code>.rounded-circle</code> = make it a perfect circle</li>
    </ul>
    <p>Rounded corners make elements feel friendlier and more modern. Sharp corners feel more formal. Choose based on your vibe!</p>
  `,
  'utils-display': `
    <p>Display utilities are like <strong>light switches for HTML elements</strong>. You can show elements, hide them, or change how they behave in the page layout.</p>
    <ul>
      <li><code>.d-none</code> = light switch OFF (element invisible, takes no space)</li>
      <li><code>.d-block</code> = full-width block (like a paragraph that takes a whole line)</li>
      <li><code>.d-inline</code> = sits in line with text (like a <code>&lt;span&gt;</code>)</li>
      <li><code>.d-flex</code> = activates flexbox mode (for advanced layouts)</li>
    </ul>
    <p>You can also say <code>.d-md-none</code> = "hide this element on medium screens and up, but show it on phones". Perfect for showing/hiding mobile menus!</p>
  `,

  /* ── Navbar & Navigation ── */
  'nav-basic': `
    <p>A navbar is like the <strong>table of contents at the front of a book</strong>. It tells visitors what sections your site has and lets them jump around. Bootstrap's navbar is responsive — on desktop it shows horizontal links, on mobile it collapses into a hamburger menu.</p>
    <p>Use <code>.navbar-expand-lg</code> to say "show the full nav on large screens, collapse on smaller ones". Add <code>.navbar-brand</code> for your logo or site name, and <code>.navbar-nav</code> for the links.</p>
    <p>Stick the navbar at the top with <code>.fixed-top</code> so it follows visitors as they scroll down. It's like a sticky table of contents that's always visible.</p>
  `,
  'nav-dropdowns': `
    <p>A dropdown is like a <strong>nested folder on your computer</strong>. You click a menu item and it expands to show sub-options. Click "Products" &rarr; see dropdown with "Shoes", "Shirts", "Accessories".</p>
    <p>Bootstrap uses <code>.dropdown</code> wrapper, <code>.dropdown-toggle</code> for the clickable button, and <code>.dropdown-menu</code> for the hidden list. Add <code>.dropdown-item</code> to each option inside.</p>
    <p>Dropdowns are great for organizing lots of navigation links without overwhelming your visitors. Instead of 15 items in the navbar, show 5 with dropdowns for the rest.</p>
  `,
  'nav-responsive': `
    <p>A responsive navbar is like <strong>a Swiss Army knife</strong> — it transforms based on what you need. On a big screen, it's a full horizontal menu. On a phone, it collapses into a hamburger button that you tap to expand.</p>
    <p>The hamburger icon (<code>.navbar-toggler</code>) is the key. It triggers a collapsible <code>&lt;div&gt;</code> with <code>.collapse</code> class. Click the hamburger &rarr; the menu slides down. Click again &rarr; it disappears.</p>
    <p>You can also add a search bar, a brand logo, and buttons to the navbar. Everything collapses together on mobile — it's like the entire nav folds up into a neat little package.</p>
  `,

  /* ── Forms & Inputs ── */
  'forms-basic': `
    <p>Forms are like a <strong>waiter taking your order</strong>. You provide fields (name, email, message), the user fills them in, and your site processes the information.</p>
    <p>Bootstrap makes forms look consistent and clean by default. Wrap each field in <code>.mb-3</code> (margin-bottom), use <code>.form-label</code> for the question, <code>.form-control</code> for the input box, and <code>.form-text</code> for a hint below.</p>
    <p>A simple form: name field, email field, a textarea for the message, and a submit button. Each element gets the right Bootstrap class and the whole thing looks professionally designed.</p>
  `,
  'forms-validation': `
    <p>Form validation is like a <strong>spell-checker for forms</strong>. When a user forgets to fill in a required field or types an invalid email, validation catches the mistake and shows a helpful error message.</p>
    <p>Bootstrap handles this with <code>.was-validated</code> on the form and <code>.is-invalid</code> / <code>.is-valid</code> on individual fields. Add <code>.invalid-feedback</code> for the error message text.</p>
    <p>Think of it as having a friendly assistant check each answer as the user fills it in: "Hey, you forgot your email!" or "That phone number looks wrong — can you double check it?"</p>
  `,
  'forms-layout': `
    <p>Form layouts are like <strong>arranging a buffet table</strong>. You can stack everything in a single line (vertical layout), put labels next to inputs (horizontal layout), or arrange fields in a grid (inline layout).</p>
    <p><strong>Vertical</strong> (default) = label on top, input below — like a stack of plates. <strong>Horizontal</strong> = label on the left, input on the right — like labeled bins. <strong>Inline</strong> = everything in one row — like a snack tray.</p>
    <p>Horizontal forms use the <code>.row</code> grid: <code>.col-md-3</code> for the label, <code>.col-md-9</code> for the input. Add <code>.col-form-label</code> to align the label vertically with the input.</p>
  `,
  'forms-custom': `
    <p>Custom form controls are like <strong>upgrading from a paper map to GPS</strong>. Instead of plain checkboxes and select boxes, Bootstrap gives you polished, modern versions.</p>
    <ul>
      <li><code>.form-check</code> = nice checkboxes and radio buttons with proper spacing</li>
      <li><code>.form-switch</code> = a toggle switch (like iPhone's ON/OFF switch)</li>
      <li><code>.form-range</code> = a slider (like a volume control)</li>
      <li><code>.form-select</code> = a styled dropdown picker</li>
    </ul>
    <p>These controls make forms feel modern and interactive. A toggle switch is much more user-friendly than a checkbox for "Enable notifications", for example.</p>
  `,

  /* ── Alerts, Badges & Tooltips ── */
  'alerts-basic': `
    <p>Alerts are like <strong>signposts on a hiking trail</strong>. They tell users something important: "Your changes were saved!" (success), "Please check your email" (info), or "Something went wrong" (danger).</p>
    <p>Use <code>.alert</code> plus a color class: <code>.alert-success</code> (green), <code>.alert-info</code> (blue), <code>.alert-warning</code> (yellow), or <code>.alert-danger</code> (red). Add <code>.alert-dismissible</code> and a close button to let users dismiss the alert.</p>
    <p>Alerts are different from modals — they sit in the page flow rather than popping up on top. Think of them as road signs vs. pop-up ads.</p>
  `,
  'badges': `
    <p>Badges are like <strong>price tags or notification bubbles</strong>. They're small labels that add context: "New!", "Sale", "3 unread messages", or "Beta".</p>
    <p>Use <code>.badge</code> with a color class like <code>.bg-primary</code> or <code>.bg-danger</code>. Badges shrink themselves to fit inside buttons, headings, or links. Put a badge inside a button to show a count, like a shopping cart with "(3)".</p>
    <p><strong>Pill badges</strong> (<code>.rounded-pill</code>) have fully rounded ends — like a capsule — and look more modern. Use them for version numbers, labels, or status indicators.</p>
  `,
  'tooltips-popovers': `
    <p><strong>Tooltips</strong> are like sticky notes that appear when you hover over something. Hover over a question mark icon &rarr; a tiny card appears with an explanation. They're perfect for clarifying jargon or icons without cluttering the page.</p>
    <p><strong>Popovers</strong> are like bigger sticky notes — they can have a title and more content. Think of a tooltip as a single sentence and a popover as a paragraph with a heading.</p>
    <p>Both need Bootstrap's JavaScript to work. Initialize them with <code>new bootstrap.Tooltip(el)</code> or <code>data-bs-toggle="tooltip"</code>. Popovers use <code>data-bs-toggle="popover"</code>.</p>
  `,
  'toasts': `
    <p>Toasts are like <strong>phone notifications</strong> — they slide in, show a brief message, and disappear after a few seconds. Unlike alerts, they don't push content around or interrupt the user.</p>
    <p>Use <code>.toast</code> with <code>.toast-header</code> (title + close button) and <code>.toast-body</code> (message). Initialize with JavaScript: <code>new bootstrap.Toast(el).show()</code>.</p>
    <p>Toasts are perfect for "Your message was sent" or "File uploaded" — feedback that's nice to know but doesn't require immediate action. They're the polite version of alerts.</p>
  `,

  /* ── Responsive Helpers ── */
  'resp-display': `
    <p>Responsive display is like a <strong>shape-shifting sign</strong>. On a big screen, show a full sidebar. On a phone, hide that sidebar and show a menu button instead.</p>
    <p>Bootstrap lets you hide/show elements at different breakpoints. <code>.d-none .d-md-block</code> = "hidden on phones, visible on medium screens and up". <code>.d-lg-none</code> = "hidden on large screens, visible on smaller ones".</p>
    <p>This is the secret to mobile-friendly design. You don't build two different sites — you build one and use display utilities to show/hide elements as the screen shrinks.</p>
  `,
  'resp-order': `
    <p>Column reordering is like <strong>rearranging seats at a dinner table</strong>. On a big screen, the sidebar might be on the left. But on a phone, you might want it below the main content so users see the important stuff first.</p>
    <p>Use <code>.order-first</code>, <code>.order-last</code>, or <code>.order-1</code> through <code>.order-5</code> to rearrange columns. Combine with breakpoints: <code>.order-md-2</code> means "second position on medium screens".</p>
    <p>Also try <code>.order-md-first</code> and <code>.order-md-last</code> — these push items to the very beginning or end of the row on specific screen sizes.</p>
  `,
  'resp-offset': `
    <p>Column offsets are like <strong>skipping chairs at a table</strong>. If you want to push a column to the right without adding an empty column, use <code>.offset-md-3</code> — it shifts the column 3 spaces to the right.</p>
    <p>Think of it like this: you have 12 chairs. You want a content block starting at chair 4 and taking up 6 chairs. Use <code>.offset-3 .col-6</code> — skip the first 3 chairs, then use 6 chairs.</p>
    <p>Offsets are great for centering content: <code>.offset-3 .col-6</code> gives you a column that's 6 chairs wide with 3 empty chairs on each side — perfectly centered!</p>
  `,

  /* ── Cards & Content Blocks ── */
  'cards-groups': `
    <p>Card groups are like a <strong>row of connected storefronts</strong>. All cards in a group are the same height, stuck together with no gap. Great for displaying related items like "Our Services" where each service is a card.</p>
    <p>Use <code>.card-group</code> instead of <code>.row</code>. Each card goes directly inside. They automatically equalize in height — like a line of soldiers standing at attention.</p>
    <p>Use card groups when you want a seamless, connected look. The lack of gap between cards creates a modern, unified appearance.</p>
  `,
  'cards-deck': `
    <p>A card deck is like a <strong>set of magnet tiles</strong> — each tile is separate but they all line up neatly. Cards in a deck have equal height and even gaps between them. Unlike a group, they're clearly separated.</p>
    <p>Use <code>.card-deck</code> for product listings, team profiles, or blog previews. Each card independently scrolls to the same height as its tallest sibling — no awkward short cards!</p>
    <p>Note: card decks are available via Bootstrap's utility classes. Use <code>.row-cols-1 .row-cols-md-3</code> with <code>.mb-4</code> gutters for a modern alternative to card decks.</p>
  `,
  'cards-overlay': `
    <p>Card overlays are like a <strong>framed photo with text written on the glass</strong>. The image fills the entire card, and text sits on top of it. Dramatic and eye-catching!</p>
    <p>Use <code>.card-img-overlay</code> instead of <code>.card-body</code> as the text container. The image goes inside the card with <code>.card-img</code>. The overlay text appears on top with a subtle dark tint from Bootstrap.</p>
    <p>For better readability, add a background gradient or darken the image. A semi-transparent black overlay (<code>bg-dark bg-opacity-50</code>) makes white text pop beautifully.</p>
  `,

  /* ── Layout & Helpers ── */
  'layout-containers': `
    <p>Containers are like <strong>different-sized boxes for your content</strong>. Bootstrap has three types:</p>
    <ul>
      <li><code>.container</code> = a fixed-width box that centers itself. On a big screen it maxes out at ~1320px.</li>
      <li><code>.container-fluid</code> = a box that fills the entire screen width (edge to edge). Like an open floor plan.</li>
      <li><code>.container-{breakpoint}</code> = full width until a certain screen size, then fixed. Like an expandable table.</li>
    </ul>
    <p>Always start with <code>.container</code> or <code>.container-fluid</code> as the outermost wrapper. It provides consistent padding and centers your layout.</p>
  `,
  'layout-columns': `
    <p>Column layout is like a <strong>newspaper with multiple columns</strong>. Bootstrap's <code>.row-cols-*</code> classes let you say "I want 3 equal columns" instead of specifying 3 individual <code>.col-4</code> classes.</p>
    <p><code>.row-cols-3</code> = every column is 4 units wide (12/3). <code>.row-cols-md-2 .row-cols-lg-4</code> = 2 columns on medium screens, 4 on large screens. This is a huge time-saver!</p>
    <p>Combine with <code>.g-*</code> gutter classes for spacing. <code>.row-cols-1 .row-cols-md-3 .g-4</code> = 1 column on mobile, 3 on desktop, with large gaps — perfect for a product grid.</p>
  `,
  'layout-visibility': `
    <p>Visibility helpers are like <strong>stage curtains and spotlights</strong>. You can show content only to screen readers (<code>.visually-hidden</code>), hide content visually but keep it accessible, or completely remove content from the page.</p>
    <ul>
      <li><code>.visually-hidden</code> = hide visually but screen readers can still "see" it. Like a backstage note for accessible tools.</li>
      <li><code>.d-none</code> = completely hidden, no trace. Like a prop that's been removed from the stage.</li>
      <li><code>.invisible</code> = hidden but still takes up space. Like an invisible actor who still stands in the way.</li>
    </ul>
    <p>Use <code>.visually-hidden</code> for helpful labels that only screen readers need — like "Search" next to a search icon.</p>
  `,

  /* ── Capstone Project ── */
  'capstone-plan': `
    <p>Before building a website, create a <strong>blueprint</strong> — like drawing a floor plan before building a house. Decide what pages you need (Home, About, Services, Contact), what components go where, and how the layout changes on different devices.</p>
    <p>Start with a simple sketch. Draw boxes for: navbar at the top, a hero section with a big heading and button, a features grid with 3 cards, and a footer. Plan which Bootstrap components you'll use for each section.</p>
    <p>Think about the user's journey: What do they see first? Where do they click next? Good planning makes the building phase smooth and fast.</p>
  `,
  'capstone-build': `
    <p>Building a Bootstrap site is like <strong>assembling IKEA furniture</strong> — all the parts are pre-designed, you just put them together. Start with the HTML skeleton, then add Bootstrap components one by one.</p>
    <ol>
      <li>Add a responsive navbar with brand logo and nav links</li>
      <li>Create a hero section with a display heading and CTA button</li>
      <li>Build a feature grid using the row/col system</li>
      <li>Add a card section for team profiles or services</li>
      <li>Include a contact form with validation</li>
      <li>Finish with a footer</li>
    </ol>
    <p>Test every section at different screen sizes. Resize your browser — does the navbar collapse? Do cards stack properly? Bootstrap handles most of this, but always double-check!</p>
  `,
  'capstone-deploy': `
    <p>Deploying is like <strong>opening a lemonade stand</strong> — you've made the lemonade (built the site), now you need to put it where people can find it (the internet).</p>
    <p>For a Bootstrap site, you just need to upload your HTML, CSS, and JS files to a web host. No build tools, no server-side setup. Simple hosts like Netlify or Vercel let you drag-and-drop a folder to publish.</p>
    <p>Before deploying: check that CDN links work, test on a real phone (not just the browser's responsive mode), make sure all links work, and add a <code>&lt;meta viewport&gt;</code> tag. Your Bootstrap site is now live!</p>
  `,
};

/* Expose globally for script-tag usage */
window.eli5BootstrapData = eli5BootstrapData;
