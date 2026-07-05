document.addEventListener("DOMContentLoaded", () => {
  initLoadingScreen();
  initPlayground();
  initNavbar();
  initScrollTop();
});

/* ─────────────────────────────────────────────
   Loading Screen
   ───────────────────────────────────────────── */
function initLoadingScreen() {
  setTimeout(() => {
    const screen = document.getElementById("loading-screen");
    if (screen) screen.classList.add("hidden");
  }, 1500);
}

/* ─────────────────────────────────────────────
   Scroll Top
   ───────────────────────────────────────────── */
function initScrollTop() {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;
  window.addEventListener("scroll", () => {
    btn.classList.toggle("visible", window.scrollY > 400);
  });
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

/* ─────────────────────────────────────────────
   Dark Mode
   ───────────────────────────────────────────── */

/* ─────────────────────────────────────────────
   Navbar (matches existing pattern)
   ───────────────────────────────────────────── */
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
    if (icon) {
      icon.classList.toggle("fa-bars", !isOpen);
      icon.classList.toggle("fa-times", isOpen);
    }
  };

  menuToggle.addEventListener("click", (e) => { e.stopPropagation(); toggleMenu(); });
  overlay.addEventListener("click", () => toggleMenu(false));
  navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

  const isMobile = () => window.matchMedia("(max-width: 1024px)").matches;
  document.querySelectorAll(".dropdown-toggle").forEach((toggle) => {
    const parent = toggle.closest(".has-dropdown");
    const menu = parent?.querySelector(".dropdown-menu");
    if (!parent || !menu) return;
    let hoverTimeout;
    parent.addEventListener("mouseenter", () => { if (!isMobile()) { clearTimeout(hoverTimeout); parent.classList.add("open"); toggle.setAttribute("aria-expanded", "true"); } });
    parent.addEventListener("mouseleave", () => { if (!isMobile()) { hoverTimeout = setTimeout(() => { parent.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }, 250); } });
    const toggleDropdown = () => {
      const isOpen = parent.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    };

    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (isMobile() || e.detail === 0) toggleDropdown(); // include keyboard activation on desktop
    });

    toggle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleDropdown();
      }
    });
  });

  window.addEventListener("scroll", () => {
    const navbar = document.querySelector(".navbar");
    if (navbar) navbar.style.background = window.scrollY > 100 ? "rgba(10, 10, 26, 0.95)" : "rgba(10, 10, 26, 0.85)";
  });
}

/* ─────────────────────────────────────────────
   Examples
   ───────────────────────────────────────────── */
const EXAMPLES = {
  hello: `function App() {
  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ color: '#61dafb' }}>Hello, React! ⚛️</h1>
      <p>This is your first React component rendered live in the browser.</p>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,

  counter: `function Counter() {
  const [count, setCount] = React.useState(0);

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ color: '#7c3aed' }}>useState Counter</h2>
      <p style={{ fontSize: '3rem', margin: '1rem 0' }}>{count}</p>
      <button
        onClick={() => setCount(count + 1)}
        style={{ marginRight: '0.5rem', padding: '0.5rem 1.5rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' }}
      >
        + Increment
      </button>
      <button
        onClick={() => setCount(count - 1)}
        style={{ marginRight: '0.5rem', padding: '0.5rem 1.5rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' }}
      >
        − Decrement
      </button>
      <button
        onClick={() => setCount(0)}
        style={{ padding: '0.5rem 1.5rem', background: '#374151', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' }}
      >
        Reset
      </button>
    </div>
  );
}

ReactDOM.render(<Counter />, document.getElementById('root'));`,

  props: `function Greeting({ name, role, color }) {
  return (
    <div style={{ padding: '1rem', margin: '0.5rem', background: '#1a1a3e', borderRadius: '8px', borderLeft: \`4px solid \${color}\` }}>
      <h3 style={{ color: color, margin: 0 }}>{name}</h3>
      <p style={{ color: '#a1a1aa', margin: '0.25rem 0 0' }}>{role}</p>
    </div>
  );
}

function App() {
  const team = [
    { name: 'Alice', role: 'Frontend Dev', color: '#61dafb' },
    { name: 'Bob',   role: 'Backend Dev',  color: '#7c3aed' },
    { name: 'Carol', role: 'Full Stack',    color: '#22c55e' },
  ];

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', background: '#0a0a1a', minHeight: '100vh' }}>
      <h2 style={{ color: '#fff', marginBottom: '1rem' }}>Props Example</h2>
      {team.map((member) => (
        <Greeting key={member.name} {...member} />
      ))}
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));`,

  todo: `function TodoApp() {
  const [todos, setTodos] = React.useState(['Learn React', 'Build something cool']);
  const [input, setInput] = React.useState('');

  const addTodo = () => {
    if (!input.trim()) return;
    setTodos([...todos, input.trim()]);
    setInput('');
  };

  const removeTodo = (index) => {
    setTodos(todos.filter((_, i) => i !== index));
  };

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
      <h2 style={{ color: '#61dafb' }}>Simple Todo ✅</h2>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add a task..."
          style={{ flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #374151', background: '#1a1a3e', color: '#fff' }}
        />
        <button onClick={addTodo} style={{ padding: '0.5rem 1rem', background: '#61dafb', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}>
          Add
        </button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {todos.map((todo, i) => (
          <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', marginBottom: '0.4rem', background: '#1a1a3e', borderRadius: '6px' }}>
            <span style={{ color: '#e6edf3' }}>{todo}</span>
            <button onClick={() => removeTodo(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

ReactDOM.render(<TodoApp />, document.getElementById('root'));`
};

/* ─────────────────────────────────────────────
   Core Playground Logic
   ───────────────────────────────────────────── */
function initPlayground() {
  const editor = document.getElementById("rpEditor");
  const preview = document.getElementById("rpPreview");
  const runBtn = document.getElementById("rpRunBtn");
  const resetBtn = document.getElementById("rpResetBtn");
  const copyBtn = document.getElementById("rpCopyBtn");
  const exampleSelect = document.getElementById("rpExampleSelect");
  const autoRenderToggle = document.getElementById("rpAutoRender");
  const consoleBody = document.getElementById("rpConsoleBody");
  const consoleClear = document.getElementById("rpConsoleClear");
  const statusBadge = document.getElementById("rpStatusBadge");
  const lineNumbers = document.getElementById("rpLineNumbers");

  let autoRenderTimer = null;

  // Load initial example
  editor.value = EXAMPLES.hello;
  updateLineNumbers();
  runCode();

  // Example selector
  exampleSelect.addEventListener("change", () => {
    editor.value = EXAMPLES[exampleSelect.value] || EXAMPLES.hello;
    updateLineNumbers();
    runCode();
  });

  // Run button
  runBtn.addEventListener("click", runCode);

  // Reset button
  resetBtn.addEventListener("click", () => {
    editor.value = EXAMPLES[exampleSelect.value] || EXAMPLES.hello;
    updateLineNumbers();
    runCode();
  });

  // Copy button
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(editor.value);
      copyBtn.innerHTML = '<i class="fas fa-check"></i>';
      copyBtn.style.color = "#22c55e";
      setTimeout(() => {
        copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
        copyBtn.style.color = "";
      }, 2000);
    } catch {
      logToConsole("Could not copy to clipboard", "error");
    }
  });

  // Auto-render toggle
  autoRenderToggle.addEventListener("change", () => {
    if (autoRenderToggle.checked) {
      logToConsole("Auto-run enabled — runs 800ms after you stop typing", "info");
    }
  });

  // Editor input
  editor.addEventListener("input", () => {
    updateLineNumbers();
    if (autoRenderToggle.checked) {
      clearTimeout(autoRenderTimer);
      autoRenderTimer = setTimeout(runCode, 800);
    }
  });

  // Editor scroll → sync line numbers
  editor.addEventListener("scroll", () => {
    lineNumbers.scrollTop = editor.scrollTop;
  });

  // Tab key support
  editor.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = editor.selectionStart;
      const end = editor.selectionEnd;
      editor.value = editor.value.substring(0, start) + "  " + editor.value.substring(end);
      editor.selectionStart = editor.selectionEnd = start + 2;
      updateLineNumbers();
    }
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      runCode();
    }
  });

  // Console clear
  consoleClear.addEventListener("click", () => {
    consoleBody.innerHTML = '<span class="rp-console-placeholder">Console output will appear here...</span>';
  });

  // Draggable divider
  initDivider();

  /* ── Run Code ── */
  function runCode() {
    const code = editor.value.trim();
    if (!code) return;

    setStatus("running");

    const html = buildIframeHTML(code);

    try {
      preview.srcdoc = html;
      setStatus("ready");
      logToConsole("Rendered successfully", "success");
    } catch (err) {
      setStatus("error");
      logToConsole(err.message, "error");
    }
  }

  /* ── Build iframe HTML ── */
  function buildIframeHTML(userCode) {
   const escapedUserCode = userCode.replace(/<\/script/gi, "<\\/script");
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: sans-serif; background: #fff; }
  </style>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.development.js"><\/script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.development.js"><\/script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.2/babel.min.js"><\/script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    (function() {
      const _origError = console.error;
      const _origWarn = console.warn;
      const _origLog = console.log;
      console.error = (...args) => { window.parent.postMessage({ type: 'rp-console', level: 'error', msg: args.join(' ') }, '*'); _origError(...args); };
      console.warn  = (...args) => { window.parent.postMessage({ type: 'rp-console', level: 'warn',  msg: args.join(' ') }, '*'); _origWarn(...args); };
      console.log   = (...args) => { window.parent.postMessage({ type: 'rp-console', level: 'log',   msg: args.join(' ') }, '*'); _origLog(...args); };
    })();

    try {
      ${escapedUserCode}
    } catch(e) {
      window.parent.postMessage({ type: 'rp-console', level: 'error', msg: e.message }, '*');
      document.getElementById('root').innerHTML = '<div style="color:#ef4444;padding:1rem;font-family:monospace;"><strong>Error:</strong> ' + e.message + '</div>';
    }
  <\/script>
</body>
</html>`;
  }

  /* ── Listen for console messages from iframe ── */
  window.addEventListener("message", (e) => {
    if (e.source !== preview.contentWindow) return;
    if (!e.data || e.data.type !== "rp-console") return;

    const level = ["log", "warn", "error", "success", "info"].includes(e.data.level)
      ? e.data.level
      : "log";
    const msg = typeof e.data.msg === "string" ? e.data.msg : String(e.data.msg);

    logToConsole(msg, level);
    if (level === "error") setStatus("error");
  });

  /* ── Console logger ── */
  function logToConsole(msg, level = "log") {
    const placeholder = consoleBody.querySelector(".rp-console-placeholder");
    if (placeholder) placeholder.remove();

    const line = document.createElement("span");
    line.className = `rp-console-line rp-log-${level}`;
    line.textContent = msg;
    consoleBody.appendChild(line);
    consoleBody.scrollTop = consoleBody.scrollHeight;
  }

  /* ── Status badge ── */
  function setStatus(state) {
    const map = {
      ready:   { text: "Ready",   cls: "rp-status-ready"   },
      running: { text: "Running", cls: "rp-status-running" },
      error:   { text: "Error",   cls: "rp-status-error"   },
    };
    const s = map[state] || map.ready;
    statusBadge.textContent = s.text;
    statusBadge.className = `rp-status-badge ${s.cls}`;
  }

  /* ── Line numbers ── */
  function updateLineNumbers() {
    const count = editor.value.split("\n").length;
    lineNumbers.textContent = Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1).join("\n");
  }
}

/* ─────────────────────────────────────────────
   Draggable Divider
   ───────────────────────────────────────────── */
function initDivider() {
  const divider = document.getElementById("rpDivider");
  const split = divider?.parentElement;
  if (!divider || !split) return;

  let dragging = false;
  let startX = 0;
  let startLeftW = 0;

  divider.addEventListener("mousedown", (e) => {
    dragging = true;
    startX = e.clientX;
    const editorPane = split.querySelector(".rp-editor-pane");
    startLeftW = editorPane.getBoundingClientRect().width;
    divider.classList.add("dragging");
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
  });

  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const delta = e.clientX - startX;
    const totalW = split.getBoundingClientRect().width - 4;
    const newLeftPct = Math.min(Math.max(((startLeftW + delta) / totalW) * 100, 20), 80);
    const editorPane = split.querySelector(".rp-editor-pane");
    const previewPane = split.querySelector(".rp-preview-pane");
    editorPane.style.flex = "none";
    editorPane.style.width = `${newLeftPct}%`;
    previewPane.style.flex = "1";
    previewPane.style.width = "";
  });

  document.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    divider.classList.remove("dragging");
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  });
}


window.addEventListener("resize", () => {
  if (typeof updateLineNumbers === 'function') updateLineNumbers();
});
