// MUI Academy — Curriculum Data (11 modules, 47 lessons)
// eslint-disable-next-line no-unused-vars
const curriculum = [
  // ══════════════════════════════════════════════════════════════
  // MODULE 1: Introduction & Buttons
  // ══════════════════════════════════════════════════════════════
  {
    id: 'intro-buttons',
    title: 'Introduction & Buttons',
    lessons: [
      {
        id: 'ib-1',
        title: 'What is Material UI?',
        objectives: [
          'Understand what MUI is and why it exists',
          'Know the difference between MUI Core and MUI Joy',
          'Set up a basic MUI project with npm install',
        ],
        takeaways: [
          'MUI is a React component library implementing Google\'s Material Design',
          'It provides pre-built, accessible, customizable components',
          'Install with: npm install @mui/material @emotion/react @emotion/styled',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Welcome to Material UI</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Material UI (MUI) is one of the most popular React component libraries. It implements Google's Material Design system, giving you a massive set of pre-built, accessible, and customizable UI components.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">Instead of building buttons, cards, and dialogs from scratch, MUI provides them out of the box. You focus on your app's logic while MUI handles the visual consistency.</p>
          <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800 font-medium">MUI requires React. If you're new to React, check out the React Mastery academy first!</p>
          </div>
          <h4 class="text-lg font-semibold mt-6 mb-2 text-gray-900">Installation</h4>
          <p class="mb-4 text-gray-700">MUI needs two Emotion packages for its styling engine:</p>
          <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm"><code>npm install @mui/material @emotion/react @emotion/styled</code></pre>
        `,
        defaultCode: `function App() {
  return (
    <div style={{ padding: '20px' }}>
      <Typography variant="h4" gutterBottom>
        Hello, Material UI!
      </Typography>
      <Typography variant="body1">
        Welcome to your first MUI component.
      </Typography>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
      {
        id: 'ib-2',
        title: 'Button Variants & Colors',
        objectives: [
          'Use text, contained, and outlined button variants',
          'Apply color props (primary, secondary, error, etc.)',
          'Understand when to use each variant',
        ],
        takeaways: [
          'Three variants: text (subtle), contained (bold), outlined (bordered)',
          'Use the color prop to change button appearance',
          'text buttons for low-emphasis, contained for high-emphasis actions',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Button Variants</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">MUI provides three button variants, each suited for different levels of visual emphasis:</p>
          <ul class="mb-4 text-gray-700 space-y-2">
            <li><strong>text</strong> — Low emphasis. Used for secondary actions like "Cancel" or "Learn More".</li>
            <li><strong>contained</strong> — High emphasis. The primary call-to-action on a page, like "Submit" or "Save".</li>
            <li><strong>outlined</strong> — Medium emphasis. When you want a button that stands out but isn't as heavy as contained.</li>
          </ul>
          <h4 class="text-lg font-semibold mt-6 mb-2 text-gray-900">Color Prop</h4>
          <p class="mb-4 text-gray-700">The <code>color</code> prop changes the button's palette. Common values: <code>primary</code> (blue), <code>secondary</code> (purple), <code>error</code> (red), <code>warning</code> (amber), <code>info</code> (light blue), <code>success</code> (green).</p>
          <div class="bg-amber-50 border-l-4 border-amber-500 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800"><strong>Tip:</strong> Use "error" color for destructive actions like "Delete" to signal danger visually.</p>
          </div>
        `,
        defaultCode: `function App() {
  return (
    <div style={{ padding: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
      <Button variant="text">Text</Button>
      <Button variant="contained" color="primary">Contained</Button>
      <Button variant="outlined" color="secondary">Outlined</Button>
      <Button variant="contained" color="error">Delete</Button>
      <Button variant="outlined" color="success">Approve</Button>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
      {
        id: 'ib-3',
        title: 'Button Sizes, Icons & States',
        objectives: [
          'Control button size with the size prop',
          'Add icons to buttons using startIcon and endIcon',
          'Handle loading and disabled states',
        ],
        takeaways: [
          'Three sizes: small, medium (default), large',
          'startIcon/endIcon place icons before or after the label',
          'Use disabled to prevent interaction and loading for async actions',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Sizes & Icons</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Buttons support three sizes via the <code>size</code> prop: <code>small</code>, <code>medium</code> (default), and <code>large</code>. Choose based on the button's importance in the layout.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">You can add icons to buttons using <code>startIcon</code> and <code>endIcon</code> props. Pass a Material Icon component and it will be placed before or after the button text.</p>
          <h4 class="text-lg font-semibold mt-6 mb-2 text-gray-900">Disabled & Loading States</h4>
          <p class="mb-4 text-gray-700">Set <code>disabled</code> to prevent user interaction. For async operations, combine <code>disabled</code> with a loading indicator to show the button is processing.</p>
          <div class="bg-green-50 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>Accessibility:</strong> MUI automatically handles aria-disabled and pointer-events when you set the disabled prop.</p>
          </div>
        `,
        defaultCode: `function App() {
  const [loading, setLoading] = React.useState(false);

  const handleClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div style={{ padding: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
      <Button size="small" variant="contained">Small</Button>
      <Button size="medium" variant="contained">Medium</Button>
      <Button size="large" variant="contained">Large</Button>
      <Button variant="outlined" disabled>Disabled</Button>
      <Button variant="contained" onClick={handleClick} disabled={loading}>
        {loading ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
      {
        id: 'ib-4',
        title: 'Icon Buttons & FABs',
        objectives: [
          'Create compact icon-only buttons with IconButton',
          'Build Floating Action Buttons (FABs)',
          'Choose between regular, extended, and circular FABs',
        ],
        takeaways: [
          'IconButton renders a button with only an icon (no text)',
          'FABs are for primary actions that float above content',
          'Extended FABs include a label alongside the icon',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Icon Buttons & FABs</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Sometimes you need a button with just an icon and no text — like a close button, a settings gear, or a search icon. The <code>IconButton</code> component handles this, providing the same styling and accessibility as regular buttons.</p>
          <h4 class="text-lg font-semibold mt-6 mb-2 text-gray-900">Floating Action Buttons</h4>
          <p class="mb-4 text-gray-700 leading-relaxed">FABs are circular buttons that float above the UI, typically in the bottom-right corner. They represent the primary action on a screen. MUI offers three FAB variants: regular (circular), extended (with text), and small/large sizes.</p>
          <div class="bg-purple-50 border-l-4 border-purple-500 p-4 my-6 rounded-r-lg">
            <p class="text-purple-800"><strong>Best practice:</strong> Use at most one FAB per screen. Use extended FABs when the action needs a label for clarity.</p>
          </div>
        `,
        defaultCode: `function App() {
  return (
    <div style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
      <IconButton aria-label="delete">
        <span className="material-icons">delete</span>
      </IconButton>
      <IconButton aria-label="settings" color="primary">
        <span className="material-icons">settings</span>
      </IconButton>
      <IconButton aria-label="favorite" color="error">
        <span className="material-icons">favorite</span>
      </IconButton>
      <Fab variant="extended" color="primary">
        <span className="material-icons" style={{ marginRight: 8 }}>add</span>
        Create Post
      </Fab>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
    ],
    quiz: [
      {
        id: 'q-ib-1',
        question: 'Which Button variant provides the HIGHEST visual emphasis?',
        options: ['text', 'contained', 'outlined', 'flat'],
        correct: 1,
      },
      {
        id: 'q-ib-2',
        question: 'Which prop adds an icon BEFORE the button text?',
        options: ['icon', 'startIcon', 'leadingIcon', 'prefixIcon'],
        correct: 1,
      },
      {
        id: 'q-ib-3',
        question: 'What is the default size of an MUI Button?',
        options: ['small', 'medium', 'large', 'auto'],
        correct: 1,
      },
      {
        id: 'q-ib-4',
        question: 'Which component renders a button with only an icon and no text?',
        options: ['Button', 'IconButton', 'Fab', 'ToggleButton'],
        correct: 1,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // MODULE 2: Surfaces (Cards & Paper)
  // ══════════════════════════════════════════════════════════════
  {
    id: 'surfaces',
    title: 'Surfaces (Cards & Paper)',
    lessons: [
      {
        id: 'surf-1',
        title: 'Paper & Elevation',
        objectives: [
          'Use the Paper component to create elevated surfaces',
          'Understand the elevation prop (0–24)',
          'Apply variant prop for filled vs outlined surfaces',
        ],
        takeaways: [
          'Paper is the base surface component in MUI',
          'Elevation (0–24) controls shadow depth',
          'Use variant="outlined" for flat, bordered surfaces',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Paper: The Building Block</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">The <code>Paper</code> component is MUI's fundamental surface. It represents a piece of paper in the physical world, with a white background and optional shadow. Think of it as a container that lifts content off the page.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">The <code>elevation</code> prop accepts values from 0 to 24. Higher values create larger, softer shadows — making the element appear to float higher above the page. Elevation 0 has no shadow; elevation 24 is the maximum lift.</p>
          <h4 class="text-lg font-semibold mt-6 mb-2 text-gray-900">Variant Prop</h4>
          <p class="mb-4 text-gray-700">Paper also supports <code>variant="outlined"</code> which replaces the shadow with a thin border, creating a flatter appearance.</p>
          <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800"><strong>Design tip:</strong> Use elevation strategically — dialogs typically use 24, cards use 1–4, and buttons use 0–2.</p>
          </div>
        `,
        defaultCode: `function App() {
  return (
    <div style={{ padding: '20px', display: 'flex', gap: '20px', backgroundColor: '#f5f5f5', flexWrap: 'wrap' }}>
      <Paper elevation={0} style={{ padding: '20px', width: 160 }}>
        <Typography>Elevation 0</Typography>
      </Paper>
      <Paper elevation={1} style={{ padding: '20px', width: 160 }}>
        <Typography>Elevation 1</Typography>
      </Paper>
      <Paper elevation={4} style={{ padding: '20px', width: 160 }}>
        <Typography>Elevation 4</Typography>
      </Paper>
      <Paper elevation={8} style={{ padding: '20px', width: 160 }}>
        <Typography>Elevation 8</Typography>
      </Paper>
      <Paper variant="outlined" style={{ padding: '20px', width: 160 }}>
        <Typography>Outlined</Typography>
      </Paper>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
      {
        id: 'surf-2',
        title: 'Card Components',
        objectives: [
          'Build cards using Card, CardContent, CardActions',
          'Add media sections with CardMedia',
          'Combine cards with buttons for interactive layouts',
        ],
        takeaways: [
          'Card = Paper + content areas (CardContent, CardMedia, CardActions)',
          'CardMedia handles images, videos, and backgrounds',
          'CardActions provides a footer area for buttons',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Cards in MUI</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">A Card is a surface that displays content and actions about a single topic. Cards are built on top of Paper, so they inherit elevation and styling. MUI provides sub-components to structure card content:</p>
          <ul class="mb-4 text-gray-700 space-y-2">
            <li><code>CardContent</code> — The main content area with default padding</li>
            <li><code>CardMedia</code> — Displays images, videos, or background media</li>
            <li><code>CardActions</code> — Footer area for action buttons, with built-in padding and spacing</li>
          </ul>
          <h4 class="text-lg font-semibold mt-6 mb-2 text-gray-900">CardMedia</h4>
          <p class="mb-4 text-gray-700">CardMedia accepts a <code>component</code> prop (default "div") and an <code>image</code> prop for the media URL. You can also set a fixed <code>height</code> to maintain consistent card sizes.</p>
        `,
        defaultCode: `function App() {
  return (
    <div style={{ padding: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      <Card sx={{ maxWidth: 345 }}>
        <CardMedia
          component="div"
          sx={{ height: 140, backgroundColor: '#e3f2fd' }}
          image=""
          title="Blue background"
        />
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            Lizard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Lizards are a widespread group of squamate reptiles.
          </Typography>
        </CardContent>
        <CardActions>
          <Button size="small">Share</Button>
          <Button size="small">Learn More</Button>
        </CardActions>
      </Card>

      <Card sx={{ maxWidth: 345 }} variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Outlined Card
          </Typography>
          <Typography variant="body2">
            This card uses variant="outlined" for a flat look with a border instead of shadow.
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
      {
        id: 'surf-3',
        title: 'Card Variants & Composition',
        objectives: [
          'Build complex cards by composing sub-components',
          'Use the CardActions spacing prop',
          'Create recipe cards, profile cards, and product cards',
        ],
        takeaways: [
          'Cards can contain any combination of sub-components',
          'Use sx prop for inline styling within cards',
          'Keep card content focused on a single topic',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Composing Cards</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Cards are incredibly flexible. You can combine CardContent, CardMedia, and CardActions in any order to create recipe cards, profile cards, product listings, or dashboard widgets.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">The <code>CardActions</code> component has a <code>disableSpacing</code> prop that removes the default spacing between child buttons. You can also control the spacing with the <code>spacing</code> prop.</p>
          <div class="bg-green-50 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>Tip:</strong> Keep cards focused. If a card has too much content, it may be better to split it into multiple cards or use a different layout.</p>
          </div>
          <h4 class="text-lg font-semibold mt-6 mb-2 text-gray-900">Card with Avatar</h4>
          <p class="mb-4 text-gray-700">A common pattern is placing an avatar or icon in the card header alongside a title and subtitle.</p>
        `,
        defaultCode: `function App() {
  return (
    <div style={{ padding: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      {/* Profile Card */}
      <Card sx={{ maxWidth: 300 }}>
        <CardContent>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-icons" style={{ color: '#1976d2' }}>person</span>
            </div>
            <div>
              <Typography variant="h6">Jane Doe</Typography>
              <Typography variant="body2" color="text.secondary">Software Engineer</Typography>
            </div>
          </div>
          <Typography variant="body2">
            Passionate about building great user interfaces with React and Material UI.
          </Typography>
        </CardContent>
        <CardActions>
          <Button size="small" variant="contained">Follow</Button>
          <Button size="small" variant="outlined">Message</Button>
        </CardActions>
      </Card>

      {/* Stats Card */}
      <Card sx={{ minWidth: 200, textAlign: 'center' }}>
        <CardContent>
          <Typography variant="h3" color="primary">1,234</Typography>
          <Typography variant="body2" color="text.secondary">Active Users</Typography>
        </CardContent>
      </Card>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
    ],
    quiz: [
      {
        id: 'q-surf-1',
        question: 'What prop on Paper controls the shadow depth?',
        options: ['depth', 'z-index', 'elevation', 'shadow'],
        correct: 2,
      },
      {
        id: 'q-surf-2',
        question: 'Which Paper variant replaces the shadow with a border?',
        options: ['variant="flat"', 'variant="outlined"', 'variant="bordered"', 'variant="minimal"'],
        correct: 1,
      },
      {
        id: 'q-surf-3',
        question: 'Which sub-component handles images in a Card?',
        options: ['CardContent', 'CardHeader', 'CardMedia', 'CardImage'],
        correct: 2,
      },
      {
        id: 'q-surf-4',
        question: 'What is the maximum elevation value in MUI?',
        options: ['10', '16', '24', '32'],
        correct: 2,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // MODULE 3: Layouts & Typography
  // ══════════════════════════════════════════════════════════════
  {
    id: 'layouts',
    title: 'Layouts & Typography',
    lessons: [
      {
        id: 'lay-1',
        title: 'Stack: Simple Layouts',
        objectives: [
          'Use Stack for vertical and horizontal layouts',
          'Apply spacing between stacked items',
          'Combine Stack with divider for visual separation',
        ],
        takeaways: [
          'Stack arranges children in a single axis (row or column)',
          'The spacing prop adds consistent gaps between items',
          'Use the divider prop to add separators between items',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">The Stack Component</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Stack is a one-dimensional layout component that arranges its children in a row or column with consistent spacing. It's the MUI equivalent of flexbox with automatic gaps — no more writing <code>margin-right</code> on every element.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">The <code>direction</code> prop sets the axis: <code>"row"</code> for horizontal, <code>"column"</code> for vertical (default). The <code>spacing</code> prop adds consistent gaps between children in multiples of 8px.</p>
          <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800"><strong>Tip:</strong> Stack spacing values multiply by 8 — so spacing={2} = 16px, spacing={3} = 24px, etc.</p>
          </div>
        `,
        defaultCode: `function App() {
  const [last, setLast] = React.useState('');
  return (
    <div style={{ padding: '20px' }}>
      <Stack spacing={2}>
        <Typography variant="h4">Vertical Stack</Typography>
        <Typography variant="body1">Items are stacked top to bottom.</Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={() => setLast('One')}>One</Button>
          <Button variant="outlined" onClick={() => setLast('Two')}>Two</Button>
          <Button variant="text" onClick={() => setLast('Three')}>Three</Button>
        </Stack>
        {last && <Typography variant="body2">Clicked: {last}</Typography>}
        {!last && <Typography variant="body2" style={{ color: '#999' }}>Click a button above — it will show here</Typography>}
      </Stack>

      <Divider sx={{ my: 3 }} />

      <Stack direction="row" spacing={3} divider={<Divider orientation="vertical" flexItem />}>
        <Typography>Left</Typography>
        <Typography>Middle</Typography>
        <Typography>Right</Typography>
      </Stack>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
      {
        id: 'lay-2',
        title: 'Grid System',
        objectives: [
          'Use the 12-column Grid for responsive layouts',
          'Apply breakpoints (xs, sm, md, lg, xl)',
          'Understand the difference between Grid item and Grid container',
        ],
        takeaways: [
          'Grid uses a 12-column system — items must sum to 12 per row',
          'Breakpoint props (xs, sm, md, lg, xl) control column width at each screen size',
          'Container holds items; item fills the columns specified',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">The Grid System</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">MUI's Grid component implements a responsive 12-column layout system. You wrap items in a <code>Grid container</code> and each child becomes a <code>Grid item</code> that spans a number of columns.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">Breakpoint props like <code>xs</code>, <code>sm</code>, <code>md</code>, <code>lg</code>, and <code>xl</code> define how many columns an item takes at each screen width. For example, <code>xs={12} md={6}</code> means full-width on mobile, half-width on tablets and up.</p>
          <div class="bg-amber-50 border-l-4 border-amber-500 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800"><strong>Note:</strong> Grid items in a row must not exceed 12 columns total. If they do, the last item wraps to a new line.</p>
          </div>
        `,
        defaultCode: `function App() {
  return (
    <div style={{ padding: '20px' }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper style={{ padding: '20px', textAlign: 'center' }}>
            <Typography>xs=12 md=4</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper style={{ padding: '20px', textAlign: 'center' }}>
            <Typography>xs=12 md=4</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper style={{ padding: '20px', textAlign: 'center' }}>
            <Typography>xs=12 md=4</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper style={{ padding: '20px', textAlign: 'center' }}>
            <Typography>xs=6 md=3</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper style={{ padding: '20px', textAlign: 'center' }}>
            <Typography>xs=6 md=3</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper style={{ padding: '20px', textAlign: 'center' }}>
            <Typography>xs=6 md=3</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} md={3}>
          <Paper style={{ padding: '20px', textAlign: 'center' }}>
            <Typography>xs=6 md=3</Typography>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
      {
        id: 'lay-3',
        title: 'Typography Deep Dive',
        objectives: [
          'Use the variant prop for heading and body styles',
          'Apply color and alignment props',
          'Render different HTML elements with the component prop',
        ],
        takeaways: [
          'Variants: h1–h6, subtitle1–2, body1–2, caption, overline, button',
          'Use component prop to change the rendered HTML element',
          'The gutterBottom prop adds bottom margin automatically',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Typography in MUI</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">The Typography component applies consistent text styles across your app. Instead of writing custom CSS for headings, body text, and captions, MUI provides pre-defined variants that follow Material Design's type scale.</p>
          <h4 class="text-lg font-semibold mt-6 mb-2 text-gray-900">Variants</h4>
          <p class="mb-4 text-gray-700">The <code>variant</code> prop selects the text style: <code>h1</code> through <code>h6</code> for headings, <code>subtitle1</code>/<code>subtitle2</code> for secondary headings, <code>body1</code>/<code>body2</code> for paragraphs, <code>caption</code> for small text, and <code>overline</code> for labels.</p>
          <h4 class="text-lg font-semibold mt-6 mb-2 text-gray-900">Component Prop</h4>
          <p class="mb-4 text-gray-700">The <code>component</code> prop changes which HTML element is rendered. For example, <code>&lt;Typography variant="h6" component="h1"&gt;</code> renders an h1 tag with h6 styling — useful for SEO and accessibility.</p>
        `,
        defaultCode: `function App() {
  return (
    <Box style={{ padding: '20px' }}>
      <Typography variant="h1" gutterBottom>Heading 1</Typography>
      <Typography variant="h3" gutterBottom>Heading 3</Typography>
      <Typography variant="h5" gutterBottom>Heading 5</Typography>
      <Typography variant="subtitle1" gutterBottom>Subtitle 1 — Secondary heading</Typography>
      <Typography variant="body1" gutterBottom>
        Body 1 — This is the default paragraph style. It works well for long-form content and articles.
      </Typography>
      <Typography variant="body2" gutterBottom>
        Body 2 — Slightly smaller. Use for secondary text or less important content.
      </Typography>
      <Typography variant="caption" display="block">
        Caption — Small text for timestamps, footnotes, or labels
      </Typography>
      <Typography variant="overline" display="block" sx={{ mt: 2 }}>
        Overline — Used for category labels
      </Typography>
    </Box>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
      {
        id: 'lay-4',
        title: 'Box & Container',
        objectives: [
          'Use Box as a flexible wrapper with the sx prop',
          'Apply theme-aware spacing and styling',
          'Use Container to center content with max-width',
        ],
        takeaways: [
          'Box is a div replacement that supports the sx prop',
          'Container constrains content width and centers it',
          'Use Container maxWidth prop (xs, sm, md, lg, xl) to control breakpoints',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Box & Container</h3>
          <p class="mb-4 text-gray-700 leading-relaxed"><code>Box</code> is a lightweight wrapper component that replaces plain divs. Its superpower is the <code>sx</code> prop, which lets you access your theme's values directly in your styles — like <code>sx={{ p: 3 }}</code> for padding (3 × 8px = 24px).</p>
          <h4 class="text-lg font-semibold mt-6 mb-2 text-gray-900">Container</h4>
          <p class="mb-4 text-gray-700 leading-relaxed"><code>Container</code> limits the maximum width of its content and centers it horizontally. Use <code>maxWidth="md"</code> for a 900px max-width, or <code>maxWidth="lg"</code> for 1200px. It handles padding automatically.</p>
          <div class="bg-green-50 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>Tip:</strong> Box is the most common wrapper in MUI apps. Its sx prop accepts spacing values, colors, responsive breakpoints, and more.</p>
          </div>
        `,
        defaultCode: `function App() {
  return (
    <Container maxWidth="md" style={{ padding: '20px' }}>
      <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 1 }}>
        <Typography variant="h5">This box has padding and a blue background</Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 3, flex: 1, minWidth: 200 }}>
          <Typography variant="h6">Card 1</Typography>
          <Typography variant="body2">Inside a centered container.</Typography>
        </Paper>
        <Paper sx={{ p: 3, flex: 1, minWidth: 200 }}>
          <Typography variant="h6">Card 2</Typography>
          <Typography variant="body2">Max-width is controlled by Container.</Typography>
        </Paper>
      </Box>
    </Container>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
    ],
    quiz: [
      {
        id: 'q-lay-1',
        question: 'Which component arranges children with automatic spacing in a single axis?',
        options: ['Grid', 'Box', 'Stack', 'Container'],
        correct: 2,
      },
      {
        id: 'q-lay-2',
        question: 'In MUI Grid, how many columns does the system use?',
        options: ['8', '10', '12', '16'],
        correct: 2,
      },
      {
        id: 'q-lay-3',
        question: 'What does the Typography variant "overline" render?',
        options: ['A large heading', 'A small label text', 'A paragraph', 'A button style'],
        correct: 1,
      },
      {
        id: 'q-lay-4',
        question: 'What does the Container component do?',
        options: [
          'Adds a background color',
          'Limits max-width and centers content',
          'Creates a grid layout',
          'Adds shadow elevation',
        ],
        correct: 1,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // MODULE 4: Theming
  // ══════════════════════════════════════════════════════════════
  {
    id: 'theming',
    title: 'Theming',
    lessons: [
      {
        id: 'them-1',
        title: 'MUI\'s Default Theme',
        objectives: [
          'Understand the structure of MUI\'s theme object',
          'Access theme values via the sx prop',
          'Use palette, typography, and spacing from theme',
        ],
        takeaways: [
          'Every MUI app has a default theme with palette, typography, spacing, etc.',
          'The sx prop gives you direct access to theme values',
          'spacing values are multiples of 8px by default',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Understanding Themes</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">MUI uses a theme object to control colors, typography, spacing, and more across your entire app. Every MUI component reads from this theme by default, ensuring visual consistency without repeating style values.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">The default theme includes a palette (primary blue, secondary purple, error red, etc.), a type scale for typography, spacing in 8px increments, breakpoints for responsive design, and border-radius values.</p>
          <h4 class="text-lg font-semibold mt-6 mb-2 text-gray-900">Accessing Theme Values</h4>
          <p class="mb-4 text-gray-700">Use the <code>sx</code> prop to reference theme values directly: <code>sx={{ color: 'primary.main' }}</code> or <code>sx={{ p: 3 }}</code> (padding = 3 × 8px = 24px).</p>
          <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800"><strong>Tip:</strong> Console.log <code>theme</code> in any ThemeProvider to explore the full theme object structure.</p>
          </div>
        `,
        defaultCode: `function App() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>Default Theme Values</Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
          primary.main
        </Paper>
        <Paper sx={{ p: 2, bgcolor: 'secondary.main', color: 'white' }}>
          secondary.main
        </Paper>
        <Paper sx={{ p: 2, bgcolor: 'error.main', color: 'white' }}>
          error.main
        </Paper>
        <Paper sx={{ p: 2, bgcolor: 'warning.main' }}>
          warning.main
        </Paper>
        <Paper sx={{ p: 2, bgcolor: 'success.main', color: 'white' }}>
          success.main
        </Paper>
      </Box>
    </Box>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
      {
        id: 'them-2',
        title: 'Creating a Custom Theme',
        objectives: [
          'Use createTheme to build a custom theme',
          'Customize palette colors and typography',
          'Wrap your app with ThemeProvider',
        ],
        takeaways: [
          'createTheme() generates a theme object with your customizations',
          'ThemeProvider wraps your app and makes the theme available everywhere',
          'You can override palette, typography, spacing, breakpoints, and more',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Custom Themes</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">To match your brand, create a custom theme with <code>createTheme()</code>. Pass an object with your customizations — MUI merges it with the defaults. Then wrap your app in <code>ThemeProvider</code> to apply it everywhere.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">Common customizations include brand colors in the palette, custom font families in typography, and adjusted spacing scales. You can also add entirely new color keys like "neutral" or "accent".</p>
          <div class="bg-purple-50 border-l-4 border-purple-500 p-4 my-6 rounded-r-lg">
            <p class="text-purple-800"><strong>Best practice:</strong> Define your theme in a separate file (theme.js) so it can be imported by both ThemeProvider and any sx prop references.</p>
          </div>
        `,
        defaultCode: `const theme = createTheme({
  palette: {
    primary: { main: '#ff5722' },
    secondary: { main: '#4caf50' },
    background: { default: '#fafafa' },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h4: { fontWeight: 700 },
    body1: { fontSize: 16 },
  },
  shape: { borderRadius: 12 },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Custom Theme</Typography>
        <Button variant="contained" sx={{ mr: 1 }}>Primary (Orange)</Button>
        <Button variant="outlined" color="secondary">Secondary (Green)</Button>
      </Box>
    </ThemeProvider>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
      {
        id: 'them-3',
        title: 'Dark Mode & Theme Switching',
        objectives: [
          'Implement dark mode with createTheme and PaletteMode',
          'Toggle between light and dark themes',
          'Use the useMediaQuery hook for system preference',
        ],
        takeaways: [
          'Set mode: "dark" or "light" in createTheme palette',
          'Toggle mode by creating a new theme with the opposite mode',
          'useMediaQuery("(prefers-color-scheme: dark)") detects system preference',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Dark Mode</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">MUI supports dark mode natively. Set <code>palette.mode</code> to "dark" in your theme, and all components automatically adapt their colors — backgrounds become dark, text becomes light, and borders/shadows adjust.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">To toggle between modes, use React state to track the current mode, then create a new theme with the opposite mode. The entire UI updates instantly when the theme changes.</p>
          <div class="bg-amber-50 border-l-4 border-amber-500 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800"><strong>Tip:</strong> Store the user's mode preference in localStorage so it persists across sessions.</p>
          </div>
        `,
        defaultCode: `function App() {
  const [mode, setMode] = React.useState('light');

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: { mode },
      }),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <Paper sx={{ p: 3, minHeight: '100vh' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Typography variant="h5">{mode === 'light' ? 'Light' : 'Dark'} Mode</Typography>
          <Button
            variant="contained"
            onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
          >
            Toggle Theme
          </Button>
        </Box>
        <Typography variant="body1">
          All components adapt automatically when you switch themes.
        </Typography>
      </Paper>
    </ThemeProvider>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
      {
        id: 'them-4',
        title: 'Typography & Spacing Customization',
        objectives: [
          'Define custom font sizes and weights',
          'Override spacing scale values',
          'Use theme.typography for consistent text styles',
        ],
        takeaways: [
          'theme.typography defines font sizes, weights, and line heights',
          'theme.spacing is a function: spacing(2) = 16px',
          'You can add custom variants to the type scale',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Typography & Spacing</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">MUI's typography system defines a complete type scale with font sizes, weights, line heights, and letter spacing. You can override individual variants or the entire font family.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">The spacing function converts numbers to pixel values based on your theme's spacing unit (default 8px). So <code>theme.spacing(2)</code> returns "16px", <code>theme.spacing(3)</code> returns "24px", and so on.</p>
          <div class="bg-green-50 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>Tip:</strong> You can also use arrays for responsive values: <code>sx={{ p: [1, 2, 3] }}</code> gives 8px on mobile, 16px on tablet, 24px on desktop.</p>
          </div>
        `,
        defaultCode: `const theme = createTheme({
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 800 },
    h2: { fontSize: '2rem', fontWeight: 700 },
    body1: { fontSize: '1rem', lineHeight: 1.7 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  spacing: 8,
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h1" gutterBottom>Custom Fonts</Typography>
        <Typography variant="body1">
          The spacing function: theme.spacing(1) = 8px, theme.spacing(2) = 16px, theme.spacing(3) = 24px
        </Typography>
        <Button variant="contained" sx={{ mt: 2 }}>
          Button with no uppercase transform
        </Button>
      </Box>
    </ThemeProvider>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
    ],
    quiz: [
      {
        id: 'q-them-1',
        question: 'Which function creates a custom MUI theme?',
        options: ['makeTheme()', 'createTheme()', 'buildTheme()', 'newTheme()'],
        correct: 1,
      },
      {
        id: 'q-them-2',
        question: 'Which prop on ThemeProvider applies the theme to all child components?',
        options: ['theme', 'value', 'provider', 'config'],
        correct: 0,
      },
      {
        id: 'q-them-3',
        question: 'How do you set dark mode in a theme?',
        options: [
          'palette.dark = true',
          'palette.mode = "dark"',
          'darkMode: true',
          'mode: dark',
        ],
        correct: 1,
      },
      {
        id: 'q-them-4',
        question: 'What does theme.spacing(3) return by default?',
        options: ['8px', '16px', '24px', '32px'],
        correct: 2,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // MODULE 5: Forms & Inputs
  // ══════════════════════════════════════════════════════════════
  {
    id: 'forms',
    title: 'Forms & Inputs',
    lessons: [
      {
        id: 'form-1',
        title: 'TextField Basics',
        objectives: [
          'Create text inputs with the TextField component',
          'Use variant prop (outlined, filled, standard)',
          'Handle controlled inputs with React state',
        ],
        takeaways: [
          'TextField wraps InputBase with label, helper text, and validation',
          'Three variants: outlined (default), filled, and standard',
          'Use controlled components: value + onChange with useState',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">TextField: Your Input Workhorse</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">The <code>TextField</code> component is MUI's primary input element. It wraps a native input with a label, helper text, and validation states. The three variants control the visual style: <code>outlined</code> (border around), <code>filled</code> (filled background), and <code>standard</code> (underline only).</p>
          <p class="mb-4 text-gray-700 leading-relaxed">Like all form elements in React, use controlled components: store the value in state with <code>useState</code>, pass it as the <code>value</code> prop, and update state in the <code>onChange</code> handler.</p>
          <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800"><strong>Tip:</strong> Outlined is the most commonly used variant in modern MUI apps. It provides the clearest visual boundary for inputs.</p>
          </div>
        `,
        defaultCode: `function App() {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 400 }}>
      <TextField
        label="Outlined (Default)"
        variant="outlined"
        value={name}
        onChange={(e) => setName(e.target.value)}
        helperText="Enter your full name"
      />
      <TextField
        label="Filled"
        variant="filled"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        helperText="you@example.com"
      />
      <TextField label="Standard" variant="standard" />
      <Typography variant="body2">
        Name: {name || '(empty)'} | Email: {email || '(empty)'}
      </Typography>
    </Box>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
      {
        id: 'form-2',
        title: 'Validation & States',
        objectives: [
          'Show error states with the error prop',
          'Use required, disabled, and readOnly props',
          'Display helper text for guidance and errors',
        ],
        takeaways: [
          'Set error={true} to show the red error state',
          'Helper text appears below the input for guidance',
          'Combine error with helperText for inline error messages',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Validation States</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">MUI TextFields provide visual states for different situations. The <code>error</code> prop turns the border and label red to indicate a problem. The <code>disabled</code> prop grays out the input and prevents interaction. The <code>required</code> prop adds an asterisk to the label.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">The <code>helperText</code> prop shows text below the input — use it for guidance ("Enter a valid email") or error messages ("This field is required"). When <code>error</code> is true, helper text also turns red.</p>
          <div class="bg-amber-50 border-l-4 border-amber-500 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800"><strong>Tip:</strong> MUI does not validate inputs for you. Use a form library like Formik or react-hook-form for validation logic.</p>
          </div>
        `,
        defaultCode: `function App() {
  const [value, setValue] = React.useState('');
  const hasError = value.length > 0 && value.length < 3;

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 400 }}>
      <TextField
        label="Username"
        required
        value={value}
        onChange={(e) => setValue(e.target.value)}
        error={hasError}
        helperText={hasError ? 'Must be at least 3 characters' : 'Enter a username'}
      />
      <TextField label="Disabled Field" disabled value="Cannot edit this" />
      <TextField label="Read Only" InputProps={{ readOnly: true }} value="Read only value" />
      <TextField
        label="With Character Count"
        inputProps={{ maxLength: 20 }}
        helperText={'\${value.length}/20 characters'}
      />
    </Box>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
      {
        id: 'form-3',
        title: 'Checkbox, Radio & Switch',
        objectives: [
          'Use FormControlLabel with Checkbox, Radio, and Switch',
          'Build radio groups and switch groups',
          'Handle checked state with React state',
        ],
        takeaways: [
          'FormControlLabel wraps a label around form controls',
          'RadioGroup groups radio buttons for single selection',
          'Switch is a toggle — use for on/off settings',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Selection Controls</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">MUI provides three selection controls: <code>Checkbox</code> (multiple selections), <code>Radio</code> (single selection), and <code>Switch</code> (on/off toggle). Wrap each with <code>FormControlLabel</code> to add a clickable label.</p>
          <h4 class="text-lg font-semibold mt-6 mb-2 text-gray-900">RadioGroup</h4>
          <p class="mb-4 text-gray-700">Use <code>RadioGroup</code> to group radio buttons and manage their shared value. It handles the exclusive selection logic automatically.</p>
          <div class="bg-purple-50 border-l-4 border-purple-500 p-4 my-6 rounded-r-lg">
            <p class="text-purple-800"><strong>Tip:</strong> Use Checkbox for "select all that apply", Radio for "pick one", and Switch for "enable/disable".</p>
          </div>
        `,
        defaultCode: `function App() {
  const [agreed, setAgreed] = React.useState(false);
  const [plan, setPlan] = React.useState('free');
  const [notifications, setNotifications] = React.useState(true);

  return (
    <Box sx={{ p: 3, maxWidth: 400 }}>
      <Typography variant="h6" gutterBottom>Choose Your Plan</Typography>
      <RadioGroup value={plan} onChange={(e) => setPlan(e.target.value)}>
        <FormControlLabel value="free" control={<Radio />} label="Free — $0/mo" />
        <FormControlLabel value="pro" control={<Radio />} label="Pro — $9/mo" />
        <FormControlLabel value="enterprise" control={<Radio />} label="Enterprise — $29/mo" />
      </RadioGroup>

      <Divider sx={{ my: 2 }} />

      <FormControlLabel
        control={<Switch checked={notifications} onChange={(e) => setNotifications(e.target.checked)} />}
        label="Enable Notifications"
      />
      <FormControlLabel
        control={<Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />}
        label="I agree to the Terms of Service"
      />
      <Typography variant="body2" sx={{ mt: 1 }}>
        Plan: {plan} | Notifications: {notifications ? 'On' : 'Off'} | Agreed: {agreed ? 'Yes' : 'No'}
      </Typography>
    </Box>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
      {
        id: 'form-4',
        title: 'Select & Autocomplete',
        objectives: [
          'Build dropdowns with Select and MenuItem',
          'Create searchable comboboxes with Autocomplete',
          'Handle single and multiple selection',
        ],
        takeaways: [
          'Select + MenuItem for simple dropdown menus',
          'Autocomplete adds search filtering and multi-select',
          'Use getOptionLabel to control what text is displayed',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Select & Autocomplete</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">The <code>Select</code> component creates a dropdown menu. Wrap <code>MenuItem</code> components inside to define options. It's a controlled component — pass the value and onChange handler.</p>
          <h4 class="text-lg font-semibold mt-6 mb-2 text-gray-900">Autocomplete</h4>
          <p class="mb-4 text-gray-700 leading-relaxed">The <code>Autocomplete</code> component adds search filtering, free-text entry, and multi-select capabilities. Pass an <code>options</code> array and it renders a searchable dropdown. Use <code>getOptionLabel</code> to tell it which property to display.</p>
          <div class="bg-green-50 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>Note:</strong> Autocomplete requires a separate install: <code>npm install @mui/lab</code> (included in recent MUI versions).</p>
          </div>
        `,
        defaultCode: `function App() {
  const [country, setCountry] = React.useState('');
  const [tags, setTags] = React.useState([]);

  const countries = ['United States', 'Canada', 'United Kingdom', 'Germany', 'Japan', 'Australia'];
  const allTags = ['React', 'MUI', 'JavaScript', 'TypeScript', 'Node.js', 'Python'];

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 400 }}>
      <FormControl fullWidth>
        <InputLabel>Country</InputLabel>
        <Select
          value={country}
          label="Country"
          onChange={(e) => setCountry(e.target.value)}
        >
          {countries.map((c) => (
            <MenuItem key={c} value={c}>{c}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Autocomplete
        multiple
        options={allTags}
        value={tags}
        onChange={(e, newValue) => setTags(newValue)}
        renderInput={(params) => <TextField {...params} label="Select Technologies" />}
      />

      <Typography variant="body2">
        Country: {country || 'None'} | Tags: {tags.join(', ') || 'None'}
      </Typography>
    </Box>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
    ],
    quiz: [
      {
        id: 'q-form-1',
        question: 'Which TextField variant is the most commonly used in modern MUI apps?',
        options: ['standard', 'filled', 'outlined', 'minimal'],
        correct: 2,
      },
      {
        id: 'q-form-2',
        question: 'Which prop puts a TextField into an error state?',
        options: ['invalid', 'error', 'hasError', 'required'],
        correct: 1,
      },
      {
        id: 'q-form-3',
        question: 'Which component groups Radio buttons for single selection?',
        options: ['RadioGroup', 'RadioSet', 'RadioList', 'RadioForm'],
        correct: 0,
      },
      {
        id: 'q-form-4',
        question: 'Which MUI component provides a searchable dropdown with multi-select?',
        options: ['Select', 'ComboBox', 'Autocomplete', 'FilterSelect'],
        correct: 2,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // MODULE 6: Navigation
  // ══════════════════════════════════════════════════════════════
  {
    id: 'navigation',
    title: 'Navigation',
    lessons: [
      {
        id: 'nav-1',
        title: 'App Bar & Toolbar',
        objectives: [
          'Build navigation bars with AppBar and Toolbar',
          'Use position prop (fixed, absolute, sticky, static, relative)',
          'Add menus and icons to the toolbar',
        ],
        takeaways: [
          'AppBar is a wrapper around Toolbar with Paper styling',
          'position="fixed" makes it stick to the top of the viewport',
          'Toolbar handles the height and padding for consistent layout',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">AppBar & Toolbar</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">The <code>AppBar</code> component displays the navigation bar at the top of your app. It's a Paper component with elevation that wraps a <code>Toolbar</code> for consistent height and padding.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">The <code>position</code> prop controls how the AppBar scrolls: <code>fixed</code> stays on screen, <code>sticky</code> sticks after scrolling past it, <code>absolute</code> positions relative to the document, and <code>static</code> scrolls with the page.</p>
          <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800"><strong>Tip:</strong> Use <code>position="fixed"</code> with a <code>Toolbar</code> spacer below to prevent content from hiding behind the bar.</p>
          </div>
        `,
        defaultCode: `function App() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu">
            <span className="material-icons">menu</span>
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            My App
          </Typography>
          <Button color="inherit">Login</Button>
        </Toolbar>
      </AppBar>
      <Box sx={{ p: 3 }}>
        <Typography variant="body1">
          Page content goes here. The AppBar stays at the top.
        </Typography>
      </Box>
    </Box>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
      {
        id: 'nav-2',
        title: 'Drawers',
        objectives: [
          'Create permanent, persistent, and temporary drawers',
          'Use Drawer with PaperProps for custom styling',
          'Build navigation drawers with list items',
        ],
        takeaways: [
          'Temporary drawers open as overlays (mobile menus)',
          'Persistent drawers stay visible but can be collapsed',
          'Permanent drawers are always visible (sidebars)',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Drawer: Side Navigation</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">The <code>Drawer</code> component slides in from the side to show navigation links, filters, or settings. MUI supports three modes:</p>
          <ul class="mb-4 text-gray-700 space-y-2">
            <li><strong>Temporary</strong> — Opens as an overlay. Used for mobile navigation menus.</li>
            <li><strong>Persistent</strong> — Stays visible alongside content but can be collapsed.</li>
            <li><strong>Permanent</strong> — Always visible. Used for desktop sidebars.</li>
          </ul>
          <p class="mb-4 text-gray-700 leading-relaxed">Use <code>variant</code> to choose the mode. For responsive layouts, use a temporary drawer on mobile and a permanent drawer on desktop.</p>
          <div class="bg-amber-50 border-l-4 border-amber-500 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800"><strong>Pattern:</strong> Combine with <code>useMediaQuery</code> to automatically switch drawer modes at a breakpoint.</p>
          </div>
        `,
        defaultCode: `function App() {
  const [open, setOpen] = React.useState(false);

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer variant="permanent" sx={{ width: 240, flexShrink: 0, '& .MuiDrawer-paper': { width: 240, boxSizing: 'border-box' } }}>
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {['Dashboard', 'Analytics', 'Settings', 'Profile'].map((text) => (
              <ListItemButton key={text}>
                <ListItemIcon>
                  <span className="material-icons">
                    {text === 'Dashboard' ? 'dashboard' : text === 'Analytics' ? 'analytics' : text === 'Settings' ? 'settings' : 'person'}
                  </span>
                </ListItemIcon>
                <ListItemText primary={text} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Typography variant="h4">Dashboard</Typography>
        <Typography variant="body1">Content area next to the permanent drawer.</Typography>
      </Box>
    </Box>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
      {
        id: 'nav-3',
        title: 'Tabs & Breadcrumbs',
        objectives: [
          'Build tab navigation with Tabs and Tab components',
          'Create breadcrumb trails for page hierarchy',
          'Handle tab switching with controlled state',
        ],
        takeaways: [
          'Tabs + Tab create a tabbed navigation interface',
          'Use Tabs value prop with onChange for controlled switching',
          'Breadcrumb displays the current page location in a hierarchy',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Tabs & Breadcrumbs</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Tabs let users switch between different views within the same page. Use <code>Tabs</code> as the container and <code>Tab</code> for each tab. The <code>value</code> prop controls which tab is active, and <code>onChange</code> handles switching.</p>
          <h4 class="text-lg font-semibold mt-6 mb-2 text-gray-900">Breadcrumbs</h4>
          <p class="mb-4 text-gray-700 leading-relaxed">Breadcrumbs show the user's current location in a hierarchy. Each item is a link that takes the user back to a parent page. MUI's <code>Breadcrumb</code> component renders them with separators automatically.</p>
          <div class="bg-green-50 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>Tip:</strong> Use Tabs for content switching within a page, and Breadcrumbs for showing navigation hierarchy.</p>
          </div>
        `,
        defaultCode: `function App() {
  const [tab, setTab] = React.useState(0);

  return (
    <Box sx={{ p: 3 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 3 }}>
        <Link underline="hover" color="inherit" href="#">Home</Link>
        <Link underline="hover" color="inherit" href="#">Products</Link>
        <Typography color="text.primary">Details</Typography>
      </Breadcrumbs>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)}>
          <Tab label="Overview" />
          <Tab label="Features" />
          <Tab label="Pricing" />
          <Tab label="Reviews" />
        </Tabs>
        <Box sx={{ p: 3 }}>
          {tab === 0 && <Typography>Overview content goes here.</Typography>}
          {tab === 1 && <Typography>Features list goes here.</Typography>}
          {tab === 2 && <Typography>Pricing table goes here.</Typography>}
          {tab === 3 && <Typography>User reviews go here.</Typography>}
        </Box>
      </Paper>
    </Box>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
      {
        id: 'nav-4',
        title: 'Menus & Speed Dial',
        objectives: [
          'Create dropdown menus with Menu and MenuItem',
          'Build action menus with SpeedDial',
          'Handle menu open/close with anchor state',
        ],
        takeaways: [
          'Menu is anchored to an element and opens on click',
          'MenuItem provides clickable list items inside a Menu',
          'SpeedDial shows a floating button that expands into actions',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Menus & Speed Dial</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">The <code>Menu</code> component renders a dropdown list anchored to a trigger element. You control the open state and position using an anchor element reference. Each <code>MenuItem</code> inside becomes a clickable option.</p>
          <h4 class="text-lg font-semibold mt-6 mb-2 text-gray-900">SpeedDial</h4>
          <p class="mb-4 text-gray-700 leading-relaxed">SpeedDial is a floating action button that expands to show multiple actions on hover or click. It's perfect for quick-access actions like "create", "edit", or "share" that float above your content.</p>
          <div class="bg-purple-50 border-l-4 border-purple-500 p-4 my-6 rounded-r-lg">
            <p class="text-purple-800"><strong>Tip:</strong> Close menus by handling the onClose event. MUI menus close automatically when clicking outside or pressing Escape.</p>
          </div>
        `,
        defaultCode: `function App() {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  return (
    <Box sx={{ p: 3, position: 'relative', height: 300 }}>
      <Button
        variant="contained"
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        Open Menu
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>
          <span className="material-icons" style={{ marginRight: 8, fontSize: 18 }}>edit</span> Edit
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <span className="material-icons" style={{ marginRight: 8, fontSize: 18 }}>content_copy</span> Duplicate
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <span className="material-icons" style={{ marginRight: 8, fontSize: 18 }}>delete</span> Delete
        </MenuItem>
      </Menu>

      <SpeedDial
        ariaLabel="Quick Actions"
        sx={{ position: 'absolute', bottom: 16, right: 16 }}
        icon={<span className="material-icons">add</span>}
        direction="up"
      >
        <SpeedDialAction icon={<span className="material-icons">edit</span>} tooltipTitle="Edit" />
        <SpeedDialAction icon={<span className="material-icons">content_copy</span>} tooltipTitle="Copy" />
        <SpeedDialAction icon={<span className="material-icons">share</span>} tooltipTitle="Share" />
      </SpeedDial>
    </Box>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
    ],
    quiz: [
      {
        id: 'q-nav-1',
        question: 'Which AppBar position prop makes it stay fixed at the top while scrolling?',
        options: ['static', 'absolute', 'fixed', 'sticky'],
        correct: 2,
      },
      {
        id: 'q-nav-2',
        question: 'Which Drawer variant opens as an overlay on mobile?',
        options: ['permanent', 'persistent', 'temporary', 'modal'],
        correct: 2,
      },
      {
        id: 'q-nav-3',
        question: 'Which components work together to create tabbed navigation?',
        options: ['Tabs + TabPanel', 'Tabs + Tab', 'TabBar + Tab', 'NavTabs + Tab'],
        correct: 1,
      },
      {
        id: 'q-nav-4',
        question: 'What does a SpeedDial component do?',
        options: [
          'Renders a sidebar',
          'Creates a floating button that expands into actions',
          'Shows a dropdown menu',
          'Displays a navigation bar',
        ],
        correct: 1,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // MODULE 7: Feedback & Overlays
  // ══════════════════════════════════════════════════════════════
  {
    id: 'feedback',
    title: 'Feedback & Overlays',
    lessons: [
      {
        id: 'fb-1',
        title: 'Alerts & Snackbar',
        objectives: [
          'Display inline messages with the Alert component',
          'Show temporary notifications with Snackbar',
          'Control severity levels (error, warning, info, success)',
        ],
        takeaways: [
          'Alert renders inline messages with severity-based coloring',
          'Snackbar is a toast notification that auto-dismisses',
          'Combine Snackbar with Alert for styled toast messages',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Alerts & Snackbar</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">The <code>Alert</code> component displays inline messages with built-in styling for four severity levels: <code>error</code>, <code>warning</code>, <code>info</code>, and <code>success</code>. Each gets an appropriate icon and color.</p>
          <h4 class="text-lg font-semibold mt-6 mb-2 text-gray-900">Snackbar</h4>
          <p class="mb-4 text-gray-700 leading-relaxed">Snackbar is a toast notification that appears at the bottom of the screen and auto-dismisses after a timeout. It's perfect for non-blocking messages like "Saved successfully" or "Connection lost".</p>
          <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800"><strong>Tip:</strong> For richer snackbars, nest an Alert inside the Snackbar component.</p>
          </div>
        `,
        defaultCode: `function App() {
  const [snackOpen, setSnackOpen] = React.useState(false);

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Alert severity="success">Operation completed successfully!</Alert>
      <Alert severity="info">Here is some useful information.</Alert>
      <Alert severity="warning">Please review before continuing.</Alert>
      <Alert severity="error">Something went wrong. Try again.</Alert>

      <Button variant="contained" onClick={() => setSnackOpen(true)} sx={{ mt: 2 }}>
        Show Snackbar
      </Button>
      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={() => setSnackOpen(false)}
        message="Changes saved!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
      {
        id: 'fb-2',
        title: 'Dialogs & Modals',
        objectives: [
          'Open modal dialogs with the Dialog component',
          'Use DialogTitle, DialogContent, DialogActions',
          'Handle dialog open/close state',
        ],
        takeaways: [
          'Dialog creates a modal overlay that blocks interaction with the page',
          'Use DialogTitle, DialogContent, DialogActions for structured dialogs',
          'Control open state with a boolean and onClose handler',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Dialogs</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Dialogs are modal windows that require user interaction before they can continue. They're used for confirmations, forms, and detailed information. MUI provides sub-components to structure dialogs:</p>
          <ul class="mb-4 text-gray-700 space-y-2">
            <li><code>DialogTitle</code> — The header with a title</li>
            <li><code>DialogContent</code> — The main content area</li>
            <li><code>DialogContentText</code> — Body text with proper spacing</li>
            <li><code>DialogActions</code> — Footer with action buttons</li>
          </ul>
          <div class="bg-amber-50 border-l-4 border-amber-500 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800"><strong>UX tip:</strong> Use dialogs sparingly. For simple confirmations, consider a simpler approach. Save dialogs for actions that genuinely need a focused interruption.</p>
          </div>
        `,
        defaultCode: `function App() {
  const [open, setOpen] = React.useState(false);

  return (
    <Box sx={{ p: 3 }}>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Open Dialog
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this item? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => setOpen(false)} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
      {
        id: 'fb-3',
        title: 'Progress Indicators',
        objectives: [
          'Show determinate progress with LinearProgress',
          'Display indeterminate loading with CircularProgress',
          'Use progress values and color props',
        ],
        takeaways: [
          'LinearProgress shows a horizontal progress bar',
          'CircularProgress shows a spinning loader',
          'Use value prop for determinate (known %) progress',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Progress Indicators</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Progress indicators show how much of an operation has completed. MUI provides two types:</p>
          <ul class="mb-4 text-gray-700 space-y-2">
            <li><code>LinearProgress</code> — A horizontal bar. Use <code>value</code> for determinate progress (e.g., 70%).</li>
            <li><code>CircularProgress</code> — A spinning circle. Use <code>size</code> and <code>thickness</code> for customization.</li>
          </ul>
          <p class="mb-4 text-gray-700 leading-relaxed">When <code>value</code> is not provided, both components show an indeterminate animation — useful when you don't know how long an operation will take.</p>
          <div class="bg-green-50 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>Tip:</strong> Use determinate progress when you know the percentage, and indeterminate when the duration is unknown (like loading a page).</p>
          </div>
        `,
        defaultCode: `function App() {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 10));
    }, 800);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 400 }}>
      <Typography variant="h6">Determinate Progress</Typography>
      <LinearProgress variant="determinate" value={progress} />
      <Typography variant="body2">{progress}%</Typography>

      <Typography variant="h6" sx={{ mt: 2 }}>Indeterminate Progress</Typography>
      <LinearProgress />

      <Typography variant="h6" sx={{ mt: 2 }}>Circular Progress</Typography>
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        <CircularProgress size={30} />
        <CircularProgress size={50} color="secondary" />
        <CircularProgress variant="determinate" value={progress} size={60} />
      </Box>
    </Box>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
    ],
    quiz: [
      {
        id: 'q-fb-1',
        question: 'Which Alert severity displays a red background?',
        options: ['warning', 'error', 'info', 'danger'],
        correct: 1,
      },
      {
        id: 'q-fb-2',
        question: 'What sub-component holds the action buttons in a Dialog?',
        options: ['DialogContent', 'DialogActions', 'DialogFooter', 'DialogButtons'],
        correct: 1,
      },
      {
        id: 'q-fb-3',
        question: 'Which progress component shows a spinning loader?',
        options: ['LinearProgress', 'SpinnerProgress', 'CircularProgress', 'LoadingBar'],
        correct: 2,
      },
      {
        id: 'q-fb-4',
        question: 'What prop on LinearProgress shows a known percentage?',
        options: ['percent', 'value', 'progress', 'amount'],
        correct: 1,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // MODULE 8: Data Display
  // ══════════════════════════════════════════════════════════════
  {
    id: 'data-display',
    title: 'Data Display',
    lessons: [
      {
        id: 'dd-1',
        title: 'Avatar & Badge',
        objectives: [
          'Display user avatars with image, text, or icon',
          'Use Badge to show counts and status indicators',
          'Apply badgeColor and badgeContent props',
        ],
        takeaways: [
          'Avatar displays circular profile images or initials',
          'Badge adds a count, dot, or custom indicator to any element',
          'Use badgeContent for numbers and dot for simple indicators',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Avatar & Badge</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">The <code>Avatar</code> component renders circular profile pictures, initials, or icons. It automatically centers text and crops images. Use the <code>src</code> prop for images, or pass text as children for initials.</p>
          <h4 class="text-lg font-semibold mt-6 mb-2 text-gray-900">Badge</h4>
          <p class="mb-4 text-gray-700 leading-relaxed">Badge wraps any element to add a notification indicator — a count number, a dot, or custom content. It's commonly used on Avatars to show unread messages or on Icons to show alerts.</p>
          <div class="bg-purple-50 border-l-4 border-purple-500 p-4 my-6 rounded-r-lg">
            <p class="text-purple-800"><strong>Tip:</strong> Use <code>badgeContent</code> for numbers and <code>variant="dot"</code> for a simple presence indicator.</p>
          </div>
        `,
        defaultCode: `function App() {
  return (
    <Box sx={{ p: 3, display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
      <Avatar sx={{ bgcolor: 'primary.main' }}>AB</Avatar>
      <Avatar sx={{ bgcolor: 'secondary.main' }}>JD</Avatar>
      <Avatar>
        <span className="material-icons">person</span>
      </Avatar>

      <Badge badgeContent={4} color="primary">
        <span className="material-icons" style={{ fontSize: 32 }}>mail</span>
      </Badge>

      <Badge badgeContent={99} color="error">
        <span className="material-icons" style={{ fontSize: 32 }}>notifications</span>
      </Badge>

      <Badge variant="dot" color="success">
        <span className="material-icons" style={{ fontSize: 32 }}>circle</span>
      </Badge>

      <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} badgeContent="">
        <Avatar sx={{ bgcolor: '#ff5722' }}>ON</Avatar>
      </Badge>
    </Box>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
      {
        id: 'dd-2',
        title: 'Lists',
        objectives: [
          'Build lists with List, ListItem, and ListItemText',
          'Add avatars and icons to list items',
          'Create interactive lists with ListItemButton',
        ],
        takeaways: [
          'List renders vertical lists of items',
          'ListItemButton makes list items clickable',
          'ListItemAvatar and ListItemIcon add visual elements',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Lists</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">The <code>List</code> component renders a vertical list of items. Each <code>ListItem</code> contains content, and <code>ListItemButton</code> makes items interactive. MUI provides sub-components for adding visual elements:</p>
          <ul class="mb-4 text-gray-700 space-y-2">
            <li><code>ListItemText</code> — Primary and secondary text</li>
            <li><code>ListItemAvatar</code> — An avatar at the start of the item</li>
            <li><code>ListItemIcon</code> — An icon at the start of the item</li>
            <li><code>ListItemSecondaryAction</code> — Actions at the end (like buttons)</li>
          </ul>
          <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800"><strong>Tip:</strong> Lists are great for menus, settings pages, inboxes, and any vertical collection of similar items.</p>
          </div>
        `,
        defaultCode: `function App() {
  const [selected, setSelected] = React.useState(0);

  const items = [
    { icon: 'inbox', text: 'Inbox', secondary: '3 new messages' },
    { icon: 'star', text: 'Starred', secondary: '12 items' },
    { icon: 'send', text: 'Sent', secondary: 'No new items' },
    { icon: 'drafts', text: 'Drafts', secondary: '2 unfinished' },
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 400 }}>
      <Paper>
        <List>
          {items.map((item, i) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={selected === i}
                onClick={() => setSelected(i)}
              >
                <ListItemIcon>
                  <span className="material-icons">{item.icon}</span>
                </ListItemIcon>
                <ListItemText primary={item.text} secondary={item.secondary} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
      {
        id: 'dd-3',
        title: 'Chip & Tooltip',
        objectives: [
          'Display compact elements with Chip',
          'Show helpful hints on hover with Tooltip',
          'Use deletable and clickable chips',
        ],
        takeaways: [
          'Chip displays a small label, tag, or action element',
          'Chip supports onDelete for removable tags and onClick for clickable chips',
          'Tooltip shows text on hover — position it with the placement prop',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Chip & Tooltip</h3>
          <p class="mb-4 text-gray-700 leading-relaxed"><code>Chip</code> is a compact element for displaying tags, statuses, or actions. Chips can be clickable, deletable, or both. They're commonly used for filter tags, user skills, or status labels.</p>
          <h4 class="text-lg font-semibold mt-6 mb-2 text-gray-900">Tooltip</h4>
          <p class="mb-4 text-gray-700 leading-relaxed"><code>Tooltip</code> wraps any element and shows descriptive text on hover. Use the <code>title</code> prop for the text and <code>placement</code> to control where it appears (top, bottom, left, right).</p>
          <div class="bg-green-50 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>Tip:</strong> Keep tooltip text short — one sentence is ideal. For longer content, use a popover or dialog instead.</p>
          </div>
        `,
        defaultCode: `function App() {
  const [chips, setChips] = React.useState(['React', 'MUI', 'TypeScript', 'Node.js']);

  const handleDelete = (chipToDelete) => {
    setChips(chips.filter((c) => c !== chipToDelete));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Deletable Chips</Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        {chips.map((chip) => (
          <Chip key={chip} label={chip} onDelete={() => handleDelete(chip)} color="primary" variant="outlined" />
        ))}
      </Box>

      <Typography variant="h6" gutterBottom>Chip Variants</Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        <Chip label="Default" />
        <Chip label="Primary" color="primary" />
        <Chip label="Success" color="success" />
        <Chip label="Clickable" onClick={() => alert('Clicked!')} />
      </Box>

      <Typography variant="h6" gutterBottom>Tooltips</Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Tooltip title="Delete this item">
          <IconButton color="error">
            <span className="material-icons">delete</span>
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit" placement="top">
          <IconButton color="primary">
            <span className="material-icons">edit</span>
          </IconButton>
        </Tooltip>
        <Tooltip title="Share with others" placement="right">
          <IconButton color="secondary">
            <span className="material-icons">share</span>
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
    ],
    quiz: [
      {
        id: 'q-dd-1',
        question: 'Which component displays circular profile images or initials?',
        options: ['Image', 'Avatar', 'Icon', 'Badge'],
        correct: 1,
      },
      {
        id: 'q-dd-2',
        question: 'What sub-component makes a list item clickable?',
        options: ['ListItem', 'ListItemButton', 'ListItemAction', 'ListButton'],
        correct: 1,
      },
      {
        id: 'q-dd-3',
        question: 'Which prop on Chip enables the X delete icon?',
        options: ['deletable', 'onDelete', 'removable', 'closeable'],
        correct: 1,
      },
      {
        id: 'q-dd-4',
        question: 'What prop controls where a Tooltip appears?',
        options: ['position', 'placement', 'direction', 'anchor'],
        correct: 1,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // MODULE 9: Data Grid
  // ══════════════════════════════════════════════════════════════
  {
    id: 'data-grid',
    title: 'Data Grid',
    lessons: [
      {
        id: 'dg-1',
        title: 'Basic Data Grid',
        objectives: [
          'Create a table with DataGrid component',
          'Define columns with field, headerName, and width',
          'Provide rows with unique id fields',
        ],
        takeaways: [
          'DataGrid renders a full-featured data table',
          'Columns define what data to show and how to format it',
          'Each row MUST have a unique `id` field',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">DataGrid Basics</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">The DataGrid component renders a feature-rich data table with sorting, filtering, pagination, and selection built in. It's part of MUI X, a separate package from core MUI.</p>
          <p class="mb-4 text-gray-700 leading-relaxed">Define your data with two arrays: <code>columns</code> (what to show) and <code>rows</code> (the data). Each column has a <code>field</code> that maps to a key in your row objects.</p>
          <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800"><strong>Note:</strong> DataGrid requires: <code>npm install @mui/x-data-grid</code></p>
          </div>
        `,
        defaultCode: `const columns = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'firstName', headerName: 'First Name', width: 130 },
  { field: 'lastName', headerName: 'Last Name', width: 130 },
  { field: 'age', headerName: 'Age', type: 'number', width: 90 },
];

const rows = [
  { id: 1, firstName: 'Jon', lastName: 'Snow', age: 35 },
  { id: 2, firstName: 'Cersei', lastName: 'Lannister', age: 42 },
  { id: 3, firstName: 'Jaime', lastName: 'Lannister', age: 45 },
  { id: 4, firstName: 'Arya', lastName: 'Stark', age: 16 },
  { id: 5, firstName: 'Daenerys', lastName: 'Targaryen', age: null },
];

function App() {
  return (
    <Box sx={{ p: 3, height: 400, width: '100%' }}>
      <Typography variant="h5" gutterBottom>Employee Directory</Typography>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5]}
        checkboxSelection
      />
    </Box>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
      {
        id: 'dg-2',
        title: 'Sorting & Filtering',
        objectives: [
          'Enable column sorting by clicking headers',
          'Add filter models for text and number filters',
          'Customize sortable columns',
        ],
        takeaways: [
          'Click column headers to sort ascending/descending',
          'FilterModel defines active filters programmatically',
          'Set sortable: false on a column to disable sorting',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Sorting & Filtering</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">DataGrid includes sorting by default — click any column header to sort ascending, click again for descending, and a third time to clear. You can disable sorting on individual columns with <code>sortable: false</code>.</p>
          <h4 class="text-lg font-semibold mt-6 mb-2 text-gray-900">Filtering</h4>
          <p class="mb-4 text-gray-700 leading-relaxed">The built-in filter panel lets users filter by text, number, date, and select types. You can also set filters programmatically using the <code>filterModel</code> prop. The filtering is built-in and doesn't require additional packages.</p>
          <div class="bg-amber-50 border-l-4 border-amber-500 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800"><strong>Tip:</strong> Use <code>filterable: false</code> on columns that shouldn't be filterable (like action columns).</p>
          </div>
        `,
        defaultCode: `const columns = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'name', headerName: 'Name', width: 150, sortable: true },
  { field: 'role', headerName: 'Role', width: 150 },
  { field: 'salary', headerName: 'Salary', type: 'number', width: 120 },
];

const rows = [
  { id: 1, name: 'Alice', role: 'Engineer', salary: 95000 },
  { id: 2, name: 'Bob', role: 'Designer', salary: 85000 },
  { id: 3, name: 'Charlie', role: 'Engineer', salary: 102000 },
  { id: 4, name: 'Diana', role: 'Manager', salary: 115000 },
  { id: 5, name: 'Eve', role: 'Designer', salary: 90000 },
];

function App() {
  const [filterModel, setFilterModel] = React.useState({
    items: [{ columnField: 'role', operatorValue: 'equals', value: '' }],
  });

  return (
    <Box sx={{ p: 3, height: 400, width: '100%' }}>
      <Typography variant="h5" gutterBottom>Sorted & Filtered Table</Typography>
      <DataGrid
        rows={rows}
        columns={columns}
        filterModel={filterModel}
        onFilterModelChange={(model) => setFilterModel(model)}
        pageSize={5}
        rowsPerPageOptions={[5]}
      />
    </Box>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
      {
        id: 'dg-3',
        title: 'Selection & Editing',
        objectives: [
          'Enable row and cell selection with checkboxSelection',
          'Handle selection changes with onSelectionModelChange',
          'Use editable columns for inline editing',
        ],
        takeaways: [
          'checkboxSelection enables row selection checkboxes',
          'onSelectionModelChange fires when selection changes',
          'Editable columns let users edit cells directly in the table',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Selection & Editing</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">DataGrid supports both single and multiple row selection. Add <code>checkboxSelection</code> to enable checkboxes, or use click-to-select. The <code>onSelectionModelChange</code> callback receives the selected row IDs.</p>
          <h4 class="text-lg font-semibold mt-6 mb-2 text-gray-900">Editable Columns</h4>
          <p class="mb-4 text-gray-700 leading-relaxed">Set <code>editable: true</code> on a column definition and add the <code>EditCell</code> renderer to enable inline editing. Users can click a cell to edit it directly in the table.</p>
          <div class="bg-green-50 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>Note:</strong> For full CRUD editing, look into the DataGrid Pro or Premium packages which provide more editing features.</p>
          </div>
        `,
        defaultCode: `const columns = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'task', headerName: 'Task', width: 200 },
  { field: 'status', headerName: 'Status', width: 130 },
  { field: 'priority', headerName: 'Priority', width: 130 },
];

const rows = [
  { id: 1, task: 'Design homepage', status: 'Done', priority: 'High' },
  { id: 2, task: 'Build API', status: 'In Progress', priority: 'High' },
  { id: 3, task: 'Write tests', status: 'Todo', priority: 'Medium' },
  { id: 4, task: 'Deploy to prod', status: 'Todo', priority: 'Low' },
];

function App() {
  const [selected, setSelected] = React.useState([]);

  return (
    <Box sx={{ p: 3, height: 400, width: '100%' }}>
      <Typography variant="h5" gutterBottom>
        Selected: {selected.length} rows
      </Typography>
      <DataGrid
        rows={rows}
        columns={columns}
        checkboxSelection
        onSelectionModelChange={(newSelection) => setSelected(newSelection)}
        selectionModel={selected}
        pageSize={5}
        rowsPerPageOptions={[5]}
      />
    </Box>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
    ],
    quiz: [
      {
        id: 'q-dg-1',
        question: 'What field must every row in a DataGrid have?',
        options: ['key', 'index', 'id', 'uuid'],
        correct: 2,
      },
      {
        id: 'q-dg-2',
        question: 'Which prop disables sorting on a specific column?',
        options: ['noSort', 'sortable: false', 'sortDisabled', 'unsorted'],
        correct: 1,
      },
      {
        id: 'q-dg-3',
        question: 'What npm package provides the DataGrid component?',
        options: ['@mui/material', '@mui/x-data-grid', '@mui/core', '@mui/table'],
        correct: 1,
      },
      {
        id: 'q-dg-4',
        question: 'Which prop enables checkboxes for row selection?',
        options: ['selectable', 'checkboxSelection', 'multiSelect', 'rowSelection'],
        correct: 1,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // MODULE 10: Styling Deep-Dive
  // ══════════════════════════════════════════════════════════════
  {
    id: 'styling',
    title: 'Styling Deep-Dive',
    lessons: [
      {
        id: 'style-1',
        title: 'The sx Prop',
        objectives: [
          'Use the sx prop for inline styling with theme access',
          'Apply responsive breakpoints in sx',
          'Use shorthand properties (p, m, bgcolor, etc.)',
        ],
        takeaways: [
          'sx is the primary styling tool in MUI — replaces most CSS files',
          'Shorthand: p=padding, m=margin, bgcolor=backgroundColor',
          'Responsive values: sx={{ p: [1, 2, 3] }} for mobile/tablet/desktop',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">The sx Prop</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">The <code>sx</code> prop is MUI's superpower for styling. It accepts any CSS property plus theme-aware values. Instead of writing CSS files, you style components directly using the sx prop with theme shortcuts.</p>
          <h4 class="text-lg font-semibold mt-6 mb-2 text-gray-900">Shorthand Properties</h4>
          <p class="mb-4 text-gray-700">MUI provides shorthands: <code>p</code> for padding, <code>m</code> for margin, <code>bgcolor</code> for backgroundColor, <code>display</code> for display. Values are multiplied by the spacing unit (8px). So <code>sx={{ p: 3 }}</code> = 24px padding.</p>
          <h4 class="text-lg font-semibold mt-6 mb-2 text-gray-900">Responsive Breakpoints</h4>
          <p class="mb-4 text-gray-700">Pass an array to sx properties for responsive values: <code>sx={{ p: [1, 2, 3] }}</code> gives 8px on mobile, 16px on tablet, 24px on desktop.</p>
          <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800"><strong>Tip:</strong> The sx prop works on every MUI component. It's the recommended way to style MUI apps.</p>
          </div>
        `,
        defaultCode: `function App() {
  return (
    <Box sx={{ p: [2, 4], maxWidth: 600 }}>
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
          sx Prop Demo
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          This Paper has p:3 (24px padding), mb:3 (24px margin-bottom),
          and bgcolor: grey.50 (light gray background).
        </Typography>
      </Paper>

      <Box sx={{
        display: 'flex',
        gap: 2,
        flexWrap: 'wrap',
        '& > *': { minWidth: 120 }
      }}>
        <Paper sx={{ p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 2 }}>
          Primary
        </Paper>
        <Paper sx={{ p: 2, bgcolor: 'secondary.main', color: 'white', borderRadius: 2 }}>
          Secondary
        </Paper>
        <Paper sx={{ p: 2, bgcolor: 'error.main', color: 'white', borderRadius: 2 }}>
          Error
        </Paper>
      </Box>
    </Box>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
      {
        id: 'style-2',
        title: 'Component-Level Overrides',
        objectives: [
          'Override MUI component styles globally',
          'Use the styleOverrides key in createTheme',
          'Target specific component variants and states',
        ],
        takeaways: [
          'styleOverrides in createTheme changes component defaults globally',
          'Target variants: variants: [{ props: { variant: "contained" }, style: {...} }]',
          'Use MUI\'s className and sx overrides for one-off customizations',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Component Overrides</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">When you want every Button in your app to have rounded corners, or every Card to have a specific shadow, use component overrides in your theme. This is more efficient than styling each instance individually.</p>
          <h4 class="text-lg font-semibold mt-6 mb-2 text-gray-900">styleOverrides</h4>
          <p class="mb-4 text-gray-700">Inside <code>createTheme</code>, use <code>components.MuiButton.styleOverrides</code> to change the default styles. You can target variants, states (hover, focus), and specific props.</p>
          <div class="bg-purple-50 border-l-4 border-purple-500 p-4 my-6 rounded-r-lg">
            <p class="text-purple-800"><strong>Tip:</strong> Use the MUI documentation's "Theming > Customization > Components" section to explore all overrideable components.</p>
          </div>
        `,
        defaultCode: `const theme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
        containedPrimary: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 2px 8px rgba(25, 118, 210, 0.4)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Themed Components</Typography>
        <Button variant="contained" sx={{ mr: 1 }}>Rounded & Bold</Button>
        <Button variant="outlined" sx={{ mr: 1 }}>Also Rounded</Button>
        <Card sx={{ maxWidth: 300, mt: 2 }}>
          <CardContent>
            <Typography variant="h6">Custom Card</Typography>
            <Typography variant="body2">This card has 16px border-radius from theme overrides.</Typography>
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
      {
        id: 'style-3',
        title: 'Global Styles & CSS Baseline',
        objectives: [
          'Reset browser styles with CssBaseline',
          'Apply global styles with GlobalStyles',
          'Use createGlobalStyle for app-wide CSS',
        ],
        takeaways: [
          'CssBaseline normalizes browser defaults for consistent rendering',
          'GlobalStyles applies CSS rules across the entire app',
          'Use GlobalStyles for body font, scroll behavior, and resets',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Global Styles</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">MUI's <code>CssBaseline</code> component normalizes browser defaults — it sets box-sizing, removes margins, applies the theme's font, and resets other inconsistencies. It's like normalize.css but theme-aware.</p>
          <h4 class="text-lg font-semibold mt-6 mb-2 text-gray-900">GlobalStyles</h4>
          <p class="mb-4 text-gray-700">For app-wide styles beyond what CssBaseline provides, use <code>GlobalStyles</code>. It accepts a styles object that gets injected as a global stylesheet. Great for setting body background, scroll behavior, and custom CSS variables.</p>
          <div class="bg-green-50 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>Tip:</strong> Always include CssBaseline in your ThemeProvider to ensure consistent rendering across browsers.</p>
          </div>
        `,
        defaultCode: `const globalStyles = {
  body: {
    backgroundColor: '#f8f9fa',
    scrollBehavior: 'smooth',
  },
  '::-webkit-scrollbar': {
    width: 8,
  },
  '::-webkit-scrollbar-thumb': {
    backgroundColor: '#ccc',
    borderRadius: 4,
  },
};

function App() {
  return (
    <ThemeProvider theme={createTheme()}>
      <CssBaseline />
      <GlobalStyles styles={globalStyles} />
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Global Styles Demo</Typography>
        <Typography variant="body1">
          CssBaseline has been applied. The body has a light gray background
          and custom scrollbar styles from GlobalStyles.
        </Typography>
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="body2">
            Notice how the page renders consistently across browsers with CssBaseline.
          </Typography>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
    ],
    quiz: [
      {
        id: 'q-style-1',
        question: 'What does sx={{ p: 3 }} translate to in pixels?',
        options: ['3px', '24px', '32px', '48px'],
        correct: 1,
      },
      {
        id: 'q-style-2',
        question: 'Where do you put global component style overrides?',
        options: [
          'In a CSS file',
          'In createTheme components.styleOverrides',
          'In sx prop on each component',
          'In the HTML head',
        ],
        correct: 1,
      },
      {
        id: 'q-style-3',
        question: 'What does CssBaseline do?',
        options: [
          'Adds animations',
          'Normalizes browser default styles',
          'Adds a CSS reset only',
          'Removes all styles',
        ],
        correct: 1,
      },
      {
        id: 'q-style-4',
        question: 'How do you add responsive values with the sx prop?',
        options: [
          'sx={{ p: "responsive(1, 2, 3)" }}',
          'sx={{ p: [1, 2, 3] }}',
          'sx={{ p: { mobile: 1, tablet: 2 } }}',
          'sx={{ responsive: { p: [1, 2, 3] } }}',
        ],
        correct: 1,
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // MODULE 11: Capstone Project
  // ══════════════════════════════════════════════════════════════
  {
    id: 'capstone',
    title: 'Capstone Project',
    lessons: [
      {
        id: 'cap-1',
        title: 'Planning Your Dashboard',
        objectives: [
          'Plan a dashboard layout using MUI components',
          'Choose appropriate components for each section',
          'Set up a theme and global styles',
        ],
        takeaways: [
          'Sketch your layout before coding — identify which MUI components to use',
          'Start with a theme, CssBaseline, and the overall layout structure',
          'Use Grid or Stack for the main layout, AppBar for navigation, and Cards for content',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Capstone: Dashboard App</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">It's time to put everything together! In this capstone, you'll build a dashboard application using the MUI components you've learned. A dashboard is a perfect project because it uses almost every MUI component category.</p>
          <h4 class="text-lg font-semibold mt-6 mb-2 text-gray-900">Component Checklist</h4>
          <ul class="mb-4 text-gray-700 space-y-1">
            <li>AppBar + Toolbar for the header</li>
            <li>Drawer for sidebar navigation</li>
            <li>Grid for responsive content layout</li>
            <li>Card + CardContent for data widgets</li>
            <li>Typography for headings and text</li>
            <li>Button + IconButton for actions</li>
            <li>Theme with custom colors</li>
          </ul>
          <div class="bg-amber-50 border-l-4 border-amber-500 p-4 my-6 rounded-r-lg">
            <p class="text-amber-800"><strong>Strategy:</strong> Build the layout shell first (AppBar + Drawer + Grid), then fill in each section one by one.</p>
          </div>
        `,
        defaultCode: `const theme = createTheme({
  palette: { primary: { main: '#1976d2' }, background: { default: '#f4f6f8' } },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <AppBar position="fixed">
          <Toolbar>
            <IconButton color="inherit" edge="start" sx={{ mr: 2 }}>
              <span className="material-icons">menu</span>
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>Dashboard</Typography>
            <IconButton color="inherit">
              <span className="material-icons">notifications</span>
            </IconButton>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="primary">1,234</Typography>
                  <Typography color="text.secondary">Total Users</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="secondary">$5,678</Typography>
                  <Typography color="text.secondary">Revenue</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="success.main">89%</Typography>
                  <Typography color="text.secondary">Uptime</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
      {
        id: 'cap-2',
        title: 'Building the Layout',
        objectives: [
          'Implement a responsive AppBar and sidebar',
          'Create a grid-based content area',
          'Add navigation and user profile section',
        ],
        takeaways: [
          'Use flexbox with display: flex for the main layout structure',
          'Responsive Grid adapts content to different screen sizes',
          'Add user profile with Avatar and Dropdown in the AppBar',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Building the Layout</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">Now let's build the full layout. We'll use a fixed AppBar at the top, a permanent sidebar drawer on the left, and a grid-based content area in the center. The content area uses Grid to create responsive stat cards and charts.</p>
          <h4 class="text-lg font-semibold mt-6 mb-2 text-gray-900">Key Patterns</h4>
          <p class="mb-4 text-gray-700">Use <code>display: 'flex'</code> on the root container to create a horizontal layout with the drawer and main content. The <code>flexGrow: 1</code> on the content area makes it fill the remaining space.</p>
          <div class="bg-blue-50 border-l-4 border-blue-500 p-4 my-6 rounded-r-lg">
            <p class="text-blue-800"><strong>Tip:</strong> Use <code>mt: 8</code> (32px top margin) on the main content to prevent it from hiding behind the fixed AppBar.</p>
          </div>
        `,
        defaultCode: `const theme = createTheme({ palette: { background: { default: '#f4f6f8' } } });
const navItems = ['Dashboard', 'Analytics', 'Users', 'Settings'];

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <AppBar position="fixed">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>My Dashboard</Typography>
            <Button color="inherit">Profile</Button>
          </Toolbar>
        </AppBar>

        <Drawer variant="permanent" sx={{
          width: 240, flexShrink: 0,
          '& .MuiDrawer-paper': { width: 240, boxSizing: 'border-box' }
        }}>
          <Toolbar />
          <Box sx={{ overflow: 'auto' }}>
            <List>
              {navItems.map((item) => (
                <ListItemButton key={item} selected={item === 'Dashboard'}>
                  <ListItemText primary={item} />
                </ListItemButton>
              ))}
            </List>
          </Box>
        </Drawer>

        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
          <Typography variant="h4" gutterBottom>Dashboard</Typography>
          <Grid container spacing={3}>
            {[{ title: 'Users', value: '2.4K', color: 'primary' },
              { title: 'Revenue', value: '$12K', color: 'secondary' },
              { title: 'Orders', value: '356', color: 'success' }].map((stat) => (
              <Grid item xs={12} sm={6} md={4} key={stat.title}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary">{stat.title}</Typography>
                    <Typography variant="h4">{stat.value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
      {
        id: 'cap-3',
        title: 'Polish & Final Touches',
        objectives: [
          'Add hover effects and transitions',
          'Implement dark mode toggle',
          'Finalize responsive behavior and edge cases',
        ],
        takeaways: [
          'Small details (hover effects, transitions) make the app feel professional',
          'Dark mode toggle shows mastery of theming concepts',
          'Test on different screen sizes to catch responsive issues',
        ],
        content: `
          <h3 class="text-2xl font-bold mb-4 text-gray-900">Polish & Final Touches</h3>
          <p class="mb-4 text-gray-700 leading-relaxed">The final step is adding polish. Hover effects, smooth transitions, and a dark mode toggle elevate your dashboard from functional to professional. These small details make a big difference in user experience.</p>
          <h4 class="text-lg font-semibold mt-6 mb-2 text-gray-900">Checklist</h4>
          <ul class="mb-4 text-gray-700 space-y-1">
            <li>Add hover effects to cards and buttons</li>
            <li>Implement a dark mode toggle in the AppBar</li>
            <li>Test responsive behavior at different breakpoints</li>
            <li>Add loading states for async operations</li>
            <li>Ensure accessibility (keyboard navigation, aria labels)</li>
          </ul>
          <div class="bg-green-50 border-l-4 border-green-500 p-4 my-6 rounded-r-lg">
            <p class="text-green-800"><strong>Congratulations!</strong> You've completed the MUI Academy. You now have the skills to build professional React applications with Material UI.</p>
          </div>
        `,
        defaultCode: `const getTheme = (mode) => createTheme({
  palette: {
    mode,
    ...(mode === 'dark' ? {
      background: { default: '#121212', paper: '#1e1e1e' },
    } : {
      background: { default: '#f4f6f8', paper: '#ffffff' },
    }),
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: { transition: 'transform 0.2s, box-shadow 0.2s' },
      },
    },
  },
});

function App() {
  const [mode, setMode] = React.useState('light');
  const theme = React.useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Dashboard</Typography>
          <Button color="inherit" onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
            {mode === 'light' ? '🌙 Dark' : '☀️ Light'}
          </Button>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          {['Users', 'Revenue', 'Orders'].map((title) => (
            <Grid item xs={12} sm={6} md={4} key={title}>
              <Card sx={{
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 },
              }}>
                <CardContent>
                  <Typography color="text.secondary">{title}</Typography>
                  <Typography variant="h4">{title === 'Users' ? '2.4K' : title === 'Revenue' ? '$12K' : '356'}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </ThemeProvider>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,
      },
    ],
    quiz: [
      {
        id: 'q-cap-1',
        question: 'What is the recommended approach to build a dashboard layout?',
        options: [
          'Use only Stack for everything',
          'Start with AppBar + Drawer shell, then fill Grid content',
          'Use only Grid and skip the AppBar',
          'Build the footer first',
        ],
        correct: 1,
      },
      {
        id: 'q-cap-2',
        question: 'Why add mt: 8 (top margin) to the main content area?',
        options: [
          'To make the text larger',
          'To prevent content from hiding behind a fixed AppBar',
          'To add a background color',
          'For no particular reason',
        ],
        correct: 1,
      },
      {
        id: 'q-cap-3',
        question: 'What makes an MUI app feel professional?',
        options: [
          'Using only default styles',
          'Adding hover effects, transitions, and responsive testing',
          'Avoiding themes entirely',
          'Using as few components as possible',
        ],
        correct: 1,
      },
    ],
  },
];