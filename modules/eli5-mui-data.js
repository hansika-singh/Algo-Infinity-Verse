/**
 * ELI5 (Explain Like I'm 5) content for Material UI Academy lessons.
 * Each key is a lesson `id`. Value is plain-language HTML with real-world analogies.
 */

const eli5MuiData = {
  // ─── Module 1: Introduction & Buttons ───
  'ib-1': `
    <p><strong>Material UI</strong> is like a <strong>box of pre-built LEGO pieces</strong> for building websites.</p>
    <p>Instead of making every button, card, and menu from scratch, MUI gives you ready-made pieces that look professional. You just snap them together like LEGO.</p>
    <p>Think of it like this: building a website without MUI is like cooking from scratch — you measure every ingredient. With MUI, it's like having a meal kit delivered — the ingredients are pre-portioned and ready to use!</p>
  `,
  'ib-2': `
    <p>Buttons in MUI come in three flavors, like <strong>different sizes of signs</strong>:</p>
    <ul>
      <li><strong>Text</strong> = a small sticky note (subtle, unmissable)</li>
      <li><strong>Contained</strong> = a big neon sign (stands out, grabs attention)</li>
      <li><strong>Outlined</strong> = a framed poster (visible but not too loud)</li>
    </ul>
    <p>The <strong>color</strong> prop is like choosing the paint color. "Primary" is blue (the main color), "error" is red (danger!), and "success" is green (all good!).</p>
  `,
  'ib-3': `
    <p>Button <strong>sizes</strong> are like choosing the right sign for the job — a small sign for a closet door, a big sign for a building.</p>
    <p><strong>Icons</strong> on buttons are like putting a picture on a sign. <code>startIcon</code> puts the picture on the left, <code>endIcon</code> on the right. "Save" with a floppy disk icon is clearer than just "Save".</p>
    <p>A <strong>disabled</strong> button is like a grayed-out button on a vending machine — you can see it, but pressing it does nothing. A <strong>loading</strong> button shows "Please wait..." while it's busy doing something.</p>
  `,
  'ib-4': `
    <p>An <strong>IconButton</strong> is like a <strong>doorbell</strong> — just a button with a symbol, no words needed. Everyone knows what the bell icon means!</p>
    <p>A <strong>FAB</strong> (Floating Action Button) is like the big red button in movies that says "DO NOT PRESS." It floats in the corner and represents the most important action on the screen — like "compose a new email" or "add a new item."</p>
  `,

  // ─── Module 2: Surfaces (Cards & Paper) ───
  'surf-1': `
    <p><strong>Paper</strong> is like a <strong>sheet of paper on a desk</strong>. The <code>elevation</code> prop is how high you lift that paper off the desk.</p>
    <p>Elevation 0 = paper lying flat on the desk (no shadow). Elevation 24 = paper floating way above the desk (big shadow underneath).</p>
    <p>It's like a stack of papers — the top paper has the biggest shadow because it's highest up!</p>
  `,
  'surf-2': `
    <p>A <strong>Card</strong> is like a <strong>playing card</strong> — it has different sections:</p>
    <ul>
      <li><strong>CardContent</strong> = the main face of the card (the text and numbers)</li>
      <li><strong>CardMedia</strong> = the picture on the card (like the heart or spade symbol)</li>
      <li><strong>CardActions</strong> = the buttons at the bottom (like "Play" or "Discard")</li>
    </ul>
    <p>Cards are great for grouping related info together — like a recipe card with the photo, description, and "Save" button.</p>
  `,
  'surf-3': `
    <p>Composing cards is like <strong>building with blocks</strong> — you can stack different pieces together to make whatever you need.</p>
    <p>A <strong>profile card</strong> has an avatar, name, and "Follow" button. A <strong>stats card</strong> just shows a big number. A <strong>product card</strong> has an image, title, price, and "Add to Cart" button.</p>
    <p>The key rule: keep each card focused on <strong>one topic</strong>. If a card is trying to do too much, split it into two cards!</p>
  `,

  // ─── Module 3: Layouts & Typography ───
  'lay-1': `
    <p><strong>Stack</strong> is like a <strong>to-do list</strong> — it puts items one after another, either top-to-bottom (column) or left-to-right (row).</p>
    <p>The <code>spacing</code> prop is like the line spacing in your notebook. spacing={2} means "leave 2 lines between items" (which equals 16 pixels of space).</p>
    <p>No more writing "margin-right: 12px" on every element. Stack handles the spacing for you!</p>
  `,
  'lay-2': `
    <p>The <strong>Grid</strong> is like a <strong>chess board</strong> — it has 12 columns across. You decide how many columns each piece of content should take up.</p>
    <p>On a phone (xs), you might want each item to take all 12 columns (full width). On a desktop (md), you might split them into groups of 4 (three items per row).</p>
    <p>It's like organizing a bookshelf — on a narrow shelf, books go one at a time. On a wide shelf, you can fit three side by side!</p>
  `,
  'lay-3': `
    <p><strong>Typography</strong> is like a <strong>wardrobe for your text</strong>. Different outfits for different occasions:</p>
    <ul>
      <li><strong>h1–h6</strong> = formal suits (headlines, important text)</li>
      <li><strong>body1</strong> = everyday clothes (regular paragraphs)</li>
      <li><strong>caption</strong> = casual wear (small labels, timestamps)</li>
      <li><strong>overline</strong> = a hat (category labels above headings)</li>
    </ul>
    <p>You wouldn't wear a suit to bed, right? Pick the right "outfit" for each piece of text!</p>
  `,
  'lay-4': `
    <p><strong>Box</strong> is like a <strong>Swiss Army knife</strong> — it's a div that can do everything. The <code>sx</code> prop is its secret weapon, letting you style it with theme values.</p>
    <p><strong>Container</strong> is like a <strong>picture frame</strong> — it limits how wide your content can go and centers it in the middle of the screen. Without it, text stretches edge-to-edge on wide monitors and becomes hard to read.</p>
  `,

  // ─── Module 4: Theming ───
  'them-1': `
    <p>A <strong>theme</strong> is like a <strong>color palette and style guide</strong> rolled into one. It tells every component: "Use this blue, this font, this much spacing."</p>
    <p>MUI's default theme is like a pre-decorated apartment — it looks good out of the box. The <code>sx</code> prop lets you tap into theme values: <code>sx={{ color: 'primary.main' }}</code> is like asking "what's the main brand color?"</p>
  `,
  'them-2': `
    <p>Creating a custom theme is like <strong>painting your apartment</strong> — you pick the wall colors (palette), the furniture style (typography), and the room layout (spacing).</p>
    <p><code>createTheme()</code> is your paint store. <code>ThemeProvider</code> is the painter — it applies your choices to the entire app.</p>
    <p>The best part? Change the theme once, and every component updates instantly — like flipping a light switch for the whole house!</p>
  `,
  'them-3': `
    <p><strong>Dark mode</strong> is like putting on <strong>sunglasses</strong> — everything gets darker and easier on the eyes at night.</p>
    <p>MUI makes it easy: just set <code>palette.mode: 'dark'</code> and all components automatically switch to dark backgrounds with light text. It's like having a magic pair of sunglasses that works on every object!</p>
    <p>The trick is to use React state to track which mode you're in, and create a new theme when the user toggles.</p>
  `,
  'them-4': `
    <p><strong>Typography customization</strong> is like choosing the <strong>font for your school notebook</strong>. Some fonts are fancy (cursive), some are plain (Arial), some are bold (Impact).</p>
    <p>The <strong>spacing</strong> function is like a <strong>ruler</strong> — <code>spacing(1)</code> measures 8mm, <code>spacing(2)</code> measures 16mm. No need to remember pixel values!</p>
  `,

  // ─── Module 5: Forms & Inputs ───
  'form-1': `
    <p>A <strong>TextField</strong> is like a <strong>sticky note where you write information</strong>. The label is the instruction at the top ("Write your name here"), and the helper text is a hint below ("Make sure it's your real name").</p>
    <p>The three variants are like different styles of sticky notes: <strong>outlined</strong> has a border around it, <strong>filled</strong> has a shaded background, and <strong>standard</strong> just has an underline.</p>
  `,
  'form-2': `
    <p>A <strong>validated</strong> input is like a <strong>teacher checking your homework</strong>. If you write your name but it's too short, the teacher puts a red mark (error state) and says "That's not enough" (helper text).</p>
    <p><strong>Disabled</strong> inputs are like a pencil that's run out of lead — you can see it, but you can't write with it. <strong>Read-only</strong> inputs are like looking at someone else's homework — you can read it, but you can't change it.</p>
  `,
  'form-3': `
    <p><strong>Checkboxes</strong> are like a <strong>multiple-choice test</strong> where you can pick more than one answer.</p>
    <p><strong>Radios</strong> are like a <strong>multiple-choice test where you can only pick one</strong> — selecting "Option B" automatically deselects "Option A".</p>
    <p><strong>Switches</strong> are like a <strong>light switch</strong> — they're either ON or OFF. Perfect for settings like "Enable notifications" or "Dark mode".</p>
  `,
  'form-4': `
    <p>A <strong>Select</strong> is like a <strong>vending machine</strong> — you press a button and get a list of options to choose from.</p>
    <p>An <strong>Autocomplete</strong> is like <strong>searching on Google</strong> — you start typing and it shows matching suggestions. You can even pick multiple items, like adding tags to a blog post.</p>
  `,

  // ─── Module 6: Navigation ───
  'nav-1': `
    <p>An <strong>AppBar</strong> is like the <strong>sign above a store</strong> — it always stays at the top so you always know where you are. The <strong>Toolbar</strong> is the shelf behind the sign that holds the buttons.</p>
    <p><code>position="fixed"</code> means the sign stays visible even when you scroll down — like a sticky note stuck to your monitor.</p>
  `,
  'nav-2': `
    <p>A <strong>Drawer</strong> is like a <strong>desk drawer</strong> — it slides out from the side to show you extra options, then slides back when you're done.</p>
    <p>A <strong>temporary</strong> drawer is like a drawer that covers your whole desk when open (mobile menu). A <strong>permanent</strong> drawer is like a filing cabinet next to your desk — always there, always visible.</p>
  `,
  'nav-3': `
    <p><strong>Tabs</strong> are like the <strong>tabs on a file folder</strong> — you click one to see that section's content. Only one tab is active at a time.</p>
    <p><strong>Breadcrumbs</strong> are like the <strong>trail of crumbs Hansel and Gretel left</strong> — they show you where you've been and how to get back. "Home > Products > Shoes" tells you exactly where you are.</p>
  `,
  'nav-4': `
    <p>A <strong>Menu</strong> is like a <strong>right-click menu</strong> on your computer — a list of actions that pops up when you click something.</p>
    <p>A <strong>SpeedDial</strong> is like the <strong>buttons on a phone's camera app</strong> — one main button that expands into more options when you tap it. Great for quick actions like "edit", "share", or "delete".</p>
  `,

  // ─── Module 7: Feedback & Overlays ───
  'fb-1': `
    <p>An <strong>Alert</strong> is like a <strong>note on your fridge</strong> — it stays visible and tells you something important. Green = "Good job!", Yellow = "Watch out!", Red = "Problem!".</p>
    <p>A <strong>Snackbar</strong> is like a <strong>text message notification</strong> — it pops up at the bottom, says something quick ("Message sent!"), and disappears after a few seconds.</p>
  `,
  'fb-2': `
    <p>A <strong>Dialog</strong> is like a <strong>pop-up window on your computer</strong> — it blocks everything else until you deal with it. "Are you sure you want to delete?" Click "Yes" or "No" and it goes away.</p>
    <p>The <strong>DialogTitle</strong> is the header ("Confirm Delete"), the <strong>DialogContent</strong> is the message ("This cannot be undone"), and <strong>DialogActions</strong> are the buttons ("Cancel" / "Delete").</p>
  `,
  'fb-3': `
    <p>A <strong>LinearProgress</strong> bar is like a <strong>loading bar on a download</strong> — it fills up from left to right as something completes.</p>
    <p>A <strong>CircularProgress</strong> spinner is like a <strong>loading wheel</strong> — it spins in a circle when you don't know how long something will take.</p>
    <p>Use the spinning one when you don't know the percentage, and the bar when you do (like "67% complete").</p>
  `,

  // ─── Module 8: Data Display ───
  'dd-1': `
    <p>An <strong>Avatar</strong> is like a <strong>profile picture in a yearbook</strong> — it shows a person's face (or initials if you don't have a photo).</p>
    <p>A <strong>Badge</strong> is like the <strong>notification dot on your phone apps</strong> — it sits on top of an avatar or icon and shows a number ("3 new messages") or just a dot ("you have something new").</p>
  `,
  'dd-2': `
    <p>A <strong>List</strong> is like a <strong>grocery list</strong> — items stacked vertically, one after another. Each item can have text, an icon, or an avatar.</p>
    <p><strong>ListItemButton</strong> makes items clickable — like checking off items on your grocery list. The selected item gets highlighted so you know which one you're on.</p>
  `,
  'dd-3': `
    <p>A <strong>Chip</strong> is like a <strong>sticker on a water bottle</strong> — a small label that says something about you. "React developer", "Available for hire", or "Urgent".</p>
    <p>Chips can be deletable (like peeling off a sticker) or clickable (like pressing a button).</p>
    <p>A <strong>Tooltip</strong> is like a <strong>sticky note on a Post-it</strong> — when you hover over something, a little message pops up to explain what it does. "Click here to save" appears when you hover over the save button.</p>
  `,

  // ─── Module 9: Data Grid ───
  'dg-1': `
    <p>A <strong>DataGrid</strong> is like a <strong>spreadsheet in Excel</strong> — rows and columns of data, neatly organized.</p>
    <p>You tell it two things: what the <strong>columns</strong> are (like "Name", "Email", "Role") and what the <strong>rows</strong> are (the actual data). MUI handles the rest — headers, borders, and scrolling.</p>
    <p>Every row needs an <code>id</code> — like a student ID number. Without it, MUI can't tell rows apart!</p>
  `,
  'dg-2': `
    <p><strong>Sorting</strong> is like organizing your bookshelf — click the "Title" column and books go A-Z. Click again and they go Z-A.</p>
    <p><strong>Filtering</strong> is like using a search function — "Show me only engineers" hides everyone who isn't an engineer. You can filter by text, numbers, or categories.</p>
  `,
  'dg-3': `
    <p><strong>Selection</strong> is like highlighting text in a document — you click rows to pick them, and a checkbox appears so you can select many at once.</p>
    <p><strong>Editing</strong> is like editing cells in Excel — click a cell, change the value, and press Enter. The table updates instantly.</p>
  `,

  // ─── Module 10: Styling Deep-Dive ───
  'style-1': `
    <p>The <strong>sx prop</strong> is like a <strong>styling cheat code</strong> — instead of writing a separate CSS file, you write styles right next to your component.</p>
    <p><code>sx={{ p: 3 }}</code> means "add 24 pixels of padding" (3 × 8). <code>sx={{ bgcolor: 'primary.main' }}</code> means "use the main brand color for the background."</p>
    <p>It's like having a universal remote control for styling — one prop does everything!</p>
  `,
  'style-2': `
    <p><strong>Component overrides</strong> are like <strong>changing the default settings on your phone</strong>. Instead of changing every app's theme individually, you change the system-wide default.</p>
    <p>Put your overrides in <code>createTheme({ components: { MuiButton: { styleOverrides: ... } } })</code> and every Button in your app automatically uses your new styles.</p>
  `,
  'style-3': `
    <p><strong>CssBaseline</strong> is like a <strong>standardized desk setup</strong> — it makes sure every browser starts from the same clean state. No weird margins or fonts from one browser vs another.</p>
    <p><strong>GlobalStyles</strong> is like the <strong>office dress code</strong> — it sets rules that apply to everything in the building, like "all body text uses the Roboto font" or "all links are blue."</p>
  `,

  // ─── Module 11: Capstone Project ───
  'cap-1': `
    <p>Planning a dashboard is like <strong>designing a house</strong> — you need a blueprint before you start building.</p>
    <p>Think of it as rooms: the <strong>AppBar</strong> is the roof (always on top), the <strong>Drawer</strong> is the hallway (navigation), and the <strong>Cards</strong> are the rooms (content areas).</p>
    <p>Sketch your layout on paper first! Identify which MUI components go where before writing any code.</p>
  `,
  'cap-2': `
    <p>Building the layout is like <strong>assembling furniture from IKEA</strong> — you have the pieces (components), now you need to put them together in the right order.</p>
    <p>Start with the frame (AppBar + Drawer), then add the shelves (Grid), then put stuff on the shelves (Cards, Typography, Buttons).</p>
  `,
  'cap-3': `
    <p>Polishing is like <strong>putting the final coat of paint on a room</strong> — the structure is done, now you make it look beautiful.</p>
    <p>Hover effects are like the satisfying "click" of a light switch. Transitions are like a smooth fade between scenes in a movie. Dark mode is like adding dimmer switches.</p>
    <p>Congratulations — you've gone from knowing nothing about MUI to building a complete dashboard!</p>
  `,
};

window.eli5MuiData = eli5MuiData;
