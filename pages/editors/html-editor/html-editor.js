document.addEventListener("DOMContentLoaded", () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  try { initHtmlEditor(); } catch (e) { console.error("HtmlEditor:", e); }
});

function initLoadingScreen() {
  setTimeout(() => {
    const s = document.getElementById("loading-screen");
    if (s) s.classList.add("hidden");
  }, 1500);
}

function initScrollTop() {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;
  window.addEventListener("scroll", () => btn.classList.toggle("visible", window.scrollY > 400));
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function initNavbar() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");
  if (!menuToggle || !navLinks) return;
  let overlay = document.querySelector(".nav-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "nav-overlay";
    document.body.appendChild(overlay);
  }
  const toggleMenu = (open) => {
    const isOpen = open !== undefined ? open : !navLinks.classList.contains("active");
    navLinks.classList.toggle("active", isOpen);
    menuToggle.setAttribute("aria-expanded", isOpen);
    overlay.classList.toggle("active", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
    const icon = menuToggle.querySelector("i");
    if (icon) { icon.classList.toggle("fa-bars", !isOpen); icon.classList.toggle("fa-times", isOpen); }
  };
  menuToggle.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(); });
  overlay.addEventListener("click", () => toggleMenu(false));
  navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => toggleMenu(false)));
  const isMobile = () => window.matchMedia("(max-width: 1024px)").matches;
  document.querySelectorAll(".dropdown-toggle").forEach((toggle) => {
    const parent = toggle.closest(".has-dropdown");
    const menu = parent?.querySelector(".dropdown-menu");
    if (!parent || !menu) return;
    let t;
    parent.addEventListener("mouseenter", () => { if (!isMobile()) { clearTimeout(t); parent.classList.add("open"); toggle.setAttribute("aria-expanded", "true"); } });
    parent.addEventListener("mouseleave", () => { if (!isMobile()) { t = setTimeout(() => { parent.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }, 250); } });
    toggle.addEventListener("click", (e) => { if (isMobile()) { e.preventDefault(); e.stopPropagation(); const o = parent.classList.toggle("open"); toggle.setAttribute("aria-expanded", o); } });
  });
  window.addEventListener("scroll", () => {
    const nav = document.querySelector(".navbar");
    if (nav) nav.style.background = window.scrollY > 100 ? "rgba(10,10,26,0.95)" : "rgba(10,10,26,0.85)";
  });
}

/*  Examples  */
const HTML_EXAMPLES = {
  basic: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>My First Webpage</title>
  <style>
    body {
      font-family: sans-serif;
      max-width: 600px;
      margin: 2rem auto;
      padding: 0 1rem;
      color: #1e293b;
    }
    h1 { color: #f97316; }
    p  { line-height: 1.7; }
  </style>
</head>
<body>
  <h1>Hello, World!</h1>
  <p>Welcome to the <strong>HTML Editor</strong> on Algo Infinity Verse.</p>
  <p>Edit this code on the left and watch the preview update instantly!</p>
</body>
</html>`,

  headings: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Headings & Text</title>
  <style>
    body { font-family: sans-serif; padding: 1.5rem; color: #1e293b; }
    h1 { color: #f97316; }
    h2 { color: #ea580c; }
    h3 { color: #9a3412; }
    blockquote {
      border-left: 4px solid #f97316;
      margin: 1rem 0;
      padding: 0.5rem 1rem;
      background: #fff7ed;
      border-radius: 0 8px 8px 0;
      font-style: italic;
    }
    mark { background: #fed7aa; padding: 0.1rem 0.25rem; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>Heading Level 1</h1>
  <h2>Heading Level 2</h2>
  <h3>Heading Level 3</h3>
  <h4>Heading Level 4</h4>

  <p>This is a <strong>bold</strong> word, an <em>italic</em> word, and a <mark>highlighted</mark> word.</p>
  <p>You can also use <code>inline code</code> for technical terms.</p>

  <blockquote>
    "Learning HTML is the gateway to building things on the web."
  </blockquote>

  <p><a href="#">This is a link</a> — links use the <code>&lt;a&gt;</code> tag.</p>
</body>
</html>`,

  lists: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Lists in HTML</title>
  <style>
    body { font-family: sans-serif; padding: 1.5rem; color: #1e293b; }
    h2   { color: #f97316; margin-top: 1.5rem; }
    ul, ol { line-height: 2; }
    li::marker { color: #f97316; }
    dl dt { font-weight: bold; margin-top: 0.75rem; }
    dl dd { margin-left: 1.5rem; color: #475569; }
  </style>
</head>
<body>
  <h2>Unordered List</h2>
  <ul>
    <li>HTML – Structure</li>
    <li>CSS – Styling</li>
    <li>JavaScript – Behaviour</li>
  </ul>

  <h2>Ordered List</h2>
  <ol>
    <li>Open your editor</li>
    <li>Write your HTML</li>
    <li>Save and preview</li>
  </ol>

  <h2>Nested List</h2>
  <ul>
    <li>Frontend
      <ul>
        <li>HTML</li>
        <li>CSS</li>
      </ul>
    </li>
    <li>Backend
      <ul>
        <li>Node.js</li>
        <li>Python</li>
      </ul>
    </li>
  </ul>

  <h2>Description List</h2>
  <dl>
    <dt>HTML</dt>
    <dd>HyperText Markup Language – defines page structure.</dd>
    <dt>CSS</dt>
    <dd>Cascading Style Sheets – controls appearance.</dd>
  </dl>
</body>
</html>`,

  table: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>HTML Table</title>
  <style>
    body   { font-family: sans-serif; padding: 1.5rem; color: #1e293b; }
    h2     { color: #f97316; }
    table  { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    thead  { background: #f97316; color: #fff; }
    th, td { padding: 0.7rem 1rem; text-align: left; border: 1px solid #e2e8f0; }
    tbody tr:nth-child(even) { background: #fff7ed; }
    tbody tr:hover           { background: #fed7aa; }
    .badge {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .easy   { background: #dcfce7; color: #166534; }
    .medium { background: #fef9c3; color: #854d0e; }
    .hard   { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <h2>DSA Practice Problems</h2>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Problem</th>
        <th>Topic</th>
        <th>Difficulty</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>Two Sum</td>
        <td>Arrays</td>
        <td><span class="badge easy">Easy</span></td>
      </tr>
      <tr>
        <td>2</td>
        <td>Longest Substring Without Repeating Characters</td>
        <td>Sliding Window</td>
        <td><span class="badge medium">Medium</span></td>
      </tr>
      <tr>
        <td>3</td>
        <td>Merge k Sorted Lists</td>
        <td>Heap</td>
        <td><span class="badge hard">Hard</span></td>
      </tr>
      <tr>
        <td>4</td>
        <td>Valid Parentheses</td>
        <td>Stack</td>
        <td><span class="badge easy">Easy</span></td>
      </tr>
      <tr>
        <td>5</td>
        <td>Binary Tree Level Order Traversal</td>
        <td>BFS / Trees</td>
        <td><span class="badge medium">Medium</span></td>
      </tr>
    </tbody>
  </table>
</body>
</html>`,

  form: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>HTML Form</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body   { font-family: sans-serif; padding: 1.5rem; color: #1e293b; background: #f8fafc; }
    h2     { color: #f97316; }
    form   { background: #fff; padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); max-width: 480px; }
    label  { display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.3rem; margin-top: 1rem; }
    input, select, textarea {
      width: 100%;
      padding: 0.55rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.9rem;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus, select:focus, textarea:focus { border-color: #f97316; }
    textarea { resize: vertical; min-height: 90px; }
    .radio-group { display: flex; gap: 1.5rem; margin-top: 0.3rem; }
    .radio-group label { font-weight: 400; display: flex; align-items: center; gap: 0.4rem; margin: 0; }
    button {
      margin-top: 1.25rem;
      width: 100%;
      padding: 0.65rem;
      background: linear-gradient(135deg, #f97316, #fbbf24);
      color: #fff;
      font-weight: 700;
      font-size: 0.95rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }
    button:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <h2>Sign Up Form</h2>
  <form id="demo-signup-form">
    <label for="name">Full Name</label>
    <input type="text" id="name" placeholder="Alice Johnson" required />

    <label for="email">Email Address</label>
    <input type="email" id="email" placeholder="alice@example.com" required />

    <label for="skill">Skill Level</label>
    <select id="skill">
      <option value="">Select level…</option>
      <option>Beginner</option>
      <option>Intermediate</option>
      <option>Advanced</option>
    </select>

    <label>Preferred Language</label>
    <div class="radio-group">
      <label><input type="radio" name="lang" value="python" /> Python</label>
      <label><input type="radio" name="lang" value="js" />     JavaScript</label>
      <label><input type="radio" name="lang" value="c" />      C / C++</label>
    </div>

    <label for="bio">Short Bio</label>
    <textarea id="bio" placeholder="Tell us about yourself…"></textarea>

    <button type="submit">Create Account</button>
  </form>
</body>
</html>`,

  flexbox: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Flexbox Layout</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body   { font-family: sans-serif; padding: 1.5rem; color: #1e293b; background: #f8fafc; margin: 0; }
    h2     { color: #f97316; margin-bottom: 1rem; }

    /* Nav bar */
    .flex-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #1e293b;
      color: #fff;
      padding: 0.75rem 1.25rem;
      border-radius: 10px;
      margin-bottom: 1.5rem;
    }
    .flex-nav .logo { font-weight: 800; font-size: 1.1rem; color: #f97316; }
    .flex-nav ul    { list-style: none; display: flex; gap: 1.25rem; margin: 0; padding: 0; }
    .flex-nav a     { color: #94a3b8; text-decoration: none; font-size: 0.9rem; }
    .flex-nav a:hover { color: #fff; }

    /* Card grid */
    .card-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .card {
      flex: 1 1 160px;
      background: #fff;
      border-radius: 10px;
      padding: 1.25rem;
      box-shadow: 0 2px 6px rgba(0,0,0,0.06);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .card-icon { font-size: 1.75rem; }
    .card h3   { margin: 0; font-size: 0.95rem; color: #1e293b; }
    .card p    { margin: 0; font-size: 0.8rem; color: #64748b; }
    .card-tag  {
      margin-top: auto;
      align-self: flex-start;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      background: #fff7ed;
      color: #f97316;
    }

    /* Footer row */
    .flex-footer {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
      font-size: 0.8rem;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <h2>Flexbox Layout Demo</h2>

  <nav class="flex-nav">
    <span class="logo">∞ AIV</span>
    <ul>
      <li><a href="#">Home</a></li>
      <li><a href="#">Learn</a></li>
      <li><a href="#">Practice</a></li>
    </ul>
  </nav>

  <div class="card-grid">
    <div class="card">
      <div class="card-icon">🧮</div>
      <h3>Arrays & Hashing</h3>
      <p>Foundation of every algorithm.</p>
      <span class="card-tag">Beginner</span>
    </div>
    <div class="card">
      <div class="card-icon">🪟</div>
      <h3>Sliding Window</h3>
      <p>Efficient subarray techniques.</p>
      <span class="card-tag">Easy</span>
    </div>
    <div class="card">
      <div class="card-icon">🔗</div>
      <h3>Linked Lists</h3>
      <p>Pointers, reversal, and cycles.</p>
      <span class="card-tag">Medium</span>
    </div>
    <div class="card">
      <div class="card-icon">🌲</div>
      <h3>Trees & Graphs</h3>
      <p>BFS, DFS, and traversals.</p>
      <span class="card-tag">Medium</span>
    </div>
    <div class="card">
      <div class="card-icon">⚡</div>
      <h3>Dynamic Programming</h3>
      <p>Memoisation and tabulation.</p>
      <span class="card-tag">Hard</span>
    </div>
  </div>

  <div class="flex-footer">
    <span>justify-content: space-between / center</span>
    <span>flex-wrap: wrap</span>
    <span>flex: 1 1 160px</span>
  </div>
</body>
</html>`
};

/*  Init Editor  */
function initHtmlEditor() {
  const editor = CodeMirror.fromTextArea(
    document.getElementById("heEditor"),
    {
        mode: "htmlmixed",
        theme: "material-darker",
        lineNumbers: true,
        lineWrapping: true,
        tabSize: 2,
        indentUnit: 2,
        autoCloseTags: true,
        matchTags: { bothTags: true }
    }
  );
  if (!editor) return;

  const consoleBody   = document.getElementById("heConsoleBody");
  const runBtn        = document.getElementById("heRunBtn");
  const resetBtn      = document.getElementById("heResetBtn");
  const copyBtn       = document.getElementById("heCopyBtn");
  const saveBtn       = document.getElementById("heSaveBtn");
  const exampleSelect = document.getElementById("heExampleSelect");
  const statusBadge   = document.getElementById("heStatusBadge");
  const consoleClear  = document.getElementById("heConsoleClear");
  const liveToggle    = document.getElementById("heLiveToggle");
  const iframe        = document.getElementById("hePreviewFrame");

  const SAVE_KEY = "html-editor-draft";

  /* Restore or seed */
  const saved = localStorage.getItem(SAVE_KEY);
  editor.setValue((saved && saved.trim().length > 0) ? saved : HTML_EXAMPLES.basic);
  editor.refresh();
  renderPreview();

  /* Example select */
  exampleSelect.addEventListener("change", () => {
    editor.setValue(HTML_EXAMPLES[exampleSelect.value]);
    renderPreview();
    logInfo("Loaded example: " + exampleSelect.options[exampleSelect.selectedIndex].text);
  });

  /* Run button */
  runBtn.addEventListener("click", () => renderPreview(true));

  /* Reset */
  resetBtn.addEventListener("click", () => {
    editor.setValue(HTML_EXAMPLES[exampleSelect.value]);
    renderPreview();
  });

  /* Copy */
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(editor.getValue());
      copyBtn.innerHTML = '<i class="fas fa-check"></i>';
      setTimeout(() => { copyBtn.innerHTML = '<i class="fas fa-copy"></i>'; }, 2000);
    } catch { logMsg("Could not copy to clipboard.", "warn"); }
  });

  /* Save */
  saveBtn.addEventListener("click", () => {
    localStorage.setItem(SAVE_KEY, editor.getValue());
    saveBtn.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => { saveBtn.innerHTML = '<i class="fas fa-save"></i>'; }, 2000);
    logInfo("Code saved to browser storage.");
  });

    const demoForm = document.getElementById("demo-signup-form");

    if (demoForm) {
        demoForm.addEventListener("submit", (e) => {
            e.preventDefault();
            alert("Form submitted! (Demo only)");
        });
    }

  /* Editor events — only re-render automatically when live preview is on */
  editor.on("change", () => {
    if (liveToggle.checked) renderPreview();
  });

  /* Live toggle */
  liveToggle.addEventListener("change", () => {
    if (liveToggle.checked) {
      renderPreview();
      logInfo("Live preview enabled.");
    } else {
      logInfo("Live preview paused. Click Run to refresh.");
    }
  });

  /* Console clear */
  consoleClear.addEventListener("click", () => {
    consoleBody.innerHTML = '<span class="he-console-placeholder">No issues detected.</span>';
  });

  /*  Core render function  */
  function renderPreview(manual = false) {
    setStatus("running");

    const html = editor.getValue().trim();

    if (!html) {
      setStatus("error");
      logMsg("Editor is empty — nothing to preview.", "warn");
      iframe.srcdoc = "";
      return;
    }

    /* Basic sanity checks */
    const warnings = [];
    if (!html.includes("<!DOCTYPE") && !html.includes("<!doctype"))
      warnings.push("No <!DOCTYPE html> declaration found.");
    if (!html.includes("<html") && !html.includes("<body"))
      warnings.push("Rendering a fragment (no <html> or <body> tag).");

    try {
      iframe.srcdoc = html;
      setStatus("ready");
      if (manual) logInfo("Preview refreshed.");
      warnings.forEach(w => logMsg(w, "warn"));
    } catch (err) {
      setStatus("error");
      logMsg("Preview error: " + err.message, "error");
    }
  }

  /*  Helpers  */
  function logInfo(msg) { logMsg(msg, "info"); }

  function logMsg(msg, type = "info") {
    const placeholder = consoleBody.querySelector(".he-console-placeholder");
    if (placeholder) placeholder.remove();
    const el = document.createElement("span");
    el.className = `he-console-line${type !== "info" ? " " + type : ""}`;
    el.textContent = msg;
    consoleBody.appendChild(el);
    /* Auto-scroll */
    consoleBody.scrollTop = consoleBody.scrollHeight;
  }

  function setStatus(state) {
    const map = {
      ready:   ["Ready",      "he-status-ready"],
      running: ["Rendering",  "he-status-running"],
      error:   ["Error",      "he-status-error"]
    };
    const [text, cls] = map[state] || map.ready;
    statusBadge.textContent = text;
    statusBadge.className = `he-status-badge ${cls}`;
  }
}