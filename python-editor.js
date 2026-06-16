document.addEventListener("DOMContentLoaded", () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  initDarkMode();
  try { initPythonEditor(); } catch(e) { console.error("PythonEditor:", e); }
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

function initDarkMode() {
  const toggle = document.getElementById("darkModeToggle");
  if (!toggle) return;
  const icon = toggle.querySelector("i");
  if (localStorage.getItem("darkMode") === "light") {
    document.body.classList.add("light-mode");
    icon.classList.replace("fa-moon", "fa-sun");
  }
  toggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    const isLight = document.body.classList.contains("light-mode");
    icon.classList.toggle("fa-moon", !isLight);
    icon.classList.toggle("fa-sun", isLight);
    localStorage.setItem("darkMode", isLight ? "light" : "dark");
  });
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

/* ─── Examples ─── */
const PYTHON_EXAMPLES = {
  hello: `print("Hello, World!")
print("Welcome to the Python Editor!")`,

  variables: `name = "Lakshay"
age = 21
score = 98.5
is_ready = True

print(f"Name: {name}")
print(f"Age: {age}")
print(f"Score: {score}")
print(f"Ready: {is_ready}")`,

  loops: `numbers = [1, 2, 3, 4, 5]

print("List contents:")
for i, num in enumerate(numbers):
    print(f"[{i}] => {num}")

print("\\nSquares:")
squares = [x*x for x in numbers]
print(squares)`,

  functions: `def greet(name):
    return f"Hello, {name}!"

def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(greet("Lakshay"))
print(f"\\nfactorial(5)  = {factorial(5)}")
print(f"factorial(10) = {factorial(10)}")`,

  lists: `person = {
    "name": "Lakshay",
    "role": "Developer",
    "skills": ["Python", "JavaScript", "C++"]
}

print(f"Person: {person['name']}")
print(f"Role: {person['role']}")

print("\\nSkills:")
for skill in person['skills']:
    print(f"- {skill}")`
};

/* ─── Piston API Executor ─── */
async function executePython(code) {
  if (!code.trim()) {
    return { output: [], errors: ["No code to execute."] };
  }

  try {
    const response = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: "python",
        version: "3.10.0",
        files: [{ name: "main.py", content: code }],
        stdin: "",
        args: [],
        compile_timeout: 10000,
        run_timeout: 3000,
        compile_memory_limit: -1,
        run_memory_limit: -1
      })
    });

    if (!response.ok) {
      throw new Error("API request failed with status " + response.status);
    }

    const data = await response.json();
    const output = [];
    const errors = [];

    if (data.run && data.run.stderr) {
      errors.push(...data.run.stderr.split("\n").filter(l => l.trim()));
    }

    if (data.run && data.run.stdout) {
      output.push(...data.run.stdout.split("\n").filter(l => l.trim()));
    }

    if (output.length === 0 && errors.length === 0) {
      output.push("Process finished with no output.");
    }

    return { output, errors };

  } catch (error) {
    return { output: [], errors: ["Execution Error: " + error.message] };
  }
}

/* ─── Init Editor ─── */
function initPythonEditor() {
  const editor = document.getElementById("pyEditor");
  if (!editor) return;

  const intentBanner = document.getElementById("intentHintBanner");
  const intentBannerText = intentBanner?.querySelector(".intent-hint-text");
  const intentBannerDismiss = intentBanner?.querySelector(".intent-hint-dismiss");

  const INTENT_HINTS = {
    stuck: '<i class="fas fa-life-ring"></i> Stuck on the same error? Try re-reading the error message line by line, or check the example dropdown for a working reference.',
    guessing: '<i class="fas fa-lightbulb"></i> Running the same code repeatedly without changes? Take a moment to plan your next edit before running again.',
    overthinking: '<i class="fas fa-feather"></i> You\'ve been editing for a while without running. Try running your current code to check progress.',
    confident: '<i class="fas fa-check-circle"></i> Nice, that ran successfully! Try the next example or extend your code further.',
  };

  let intentDismissed = false;

  const intentDetector = (typeof createIntentDetector === "function")
    ? createIntentDetector({
        onStateChange: (state) => {
          if (!intentBanner || !intentBannerText) return;
          if (state === "neutral" || !INTENT_HINTS[state]) {
            intentBanner.classList.add("hidden");
            return;
          }
          if (intentDismissed) return; // Respect user's dismiss action
          intentBannerText.innerHTML = INTENT_HINTS[state];
          intentBanner.className = `intent-hint-banner intent-${state}`;
        },
      })
    : null;

  if (intentBannerDismiss) {
    intentBannerDismiss.addEventListener("click", () => {
      intentDismissed = true;
      intentBanner.classList.add("hidden");
    });
  }  const outputBody    = document.getElementById("pyOutputBody");
  const consoleBody   = document.getElementById("pyConsoleBody");
  const runBtn        = document.getElementById("pyRunBtn");
  const resetBtn      = document.getElementById("pyResetBtn");
  const copyBtn       = document.getElementById("pyCopyBtn");
  const saveBtn       = document.getElementById("pySaveBtn");
  const exampleSelect = document.getElementById("pyExampleSelect");
  const lineNumbers   = document.getElementById("pyLineNumbers");
  const statusBadge   = document.getElementById("pyStatusBadge");
  const consoleClear  = document.getElementById("pyConsoleClear");

  const SAVE_KEY = "python-editor-draft";
  let runSeq = 0;
  const saved = localStorage.getItem(SAVE_KEY);
  editor.value = (saved && saved.trim().length > 0) ? saved : PYTHON_EXAMPLES.hello;
  updateLines();

  exampleSelect.addEventListener("change", () => {
    editor.value = PYTHON_EXAMPLES[exampleSelect.value];
    updateLines();
  });

  runBtn.addEventListener("click", runCode);

  resetBtn.addEventListener("click", () => {
    editor.value = PYTHON_EXAMPLES[exampleSelect.value];
    updateLines();
  });

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(editor.value);
      copyBtn.innerHTML = '<i class="fas fa-check"></i>';
      setTimeout(() => { copyBtn.innerHTML = '<i class="fas fa-copy"></i>'; }, 2000);
    } catch { logError("Could not copy to clipboard."); }
  });

  saveBtn.addEventListener("click", () => {
    localStorage.setItem(SAVE_KEY, editor.value);
    saveBtn.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => { saveBtn.innerHTML = '<i class="fas fa-save"></i>'; }, 2000);
  });

  editor.addEventListener("input", () => {
    updateLines();
    if (intentDetector) intentDetector.recordEdit(editor.value);
  });
  editor.addEventListener("scroll", () => { lineNumbers.scrollTop = editor.scrollTop; });

  editor.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const s = editor.selectionStart;
      editor.value = editor.value.substring(0, s) + "    " + editor.value.substring(editor.selectionEnd);
      editor.selectionStart = editor.selectionEnd = s + 4;
      updateLines();
    }
    if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); runCode(); }
    if (e.ctrlKey && e.key === "s") { e.preventDefault(); localStorage.setItem(SAVE_KEY, editor.value); }
  });

  consoleClear.addEventListener("click", () => {
    consoleBody.innerHTML = '<span class="py-console-placeholder">No errors detected.</span>';
  });

  async function runCode() {
    const seq = ++runSeq;
    setStatus("running");
    outputBody.innerHTML = '<span class="py-output-placeholder">Running...</span>';
    consoleBody.innerHTML = '<span class="py-console-placeholder">No errors detected.</span>';

    const { output, errors } = await executePython(editor.value);
    if (seq !== runSeq) return; // Prevent race conditions

    if (output.length > 0) {
      outputBody.innerHTML = "";
      output.forEach((line) => {
        const el = document.createElement("span");
        el.className = "py-output-line";
        el.textContent = line;
        outputBody.appendChild(el);
      });
    } else {
      outputBody.innerHTML = '<span class="py-output-placeholder">No standard output produced.</span>';
    }

    if (errors.length > 0) {
      consoleBody.innerHTML = "";
      errors.forEach(logError);
      setStatus("error");
    } else {
      setStatus("ready");
    }

    if (intentDetector) {
      intentDetector.recordRun({ hasError: errors.length > 0, code: editor.value });
    }
  }

  function logError(msg) {
    const placeholder = consoleBody.querySelector(".py-console-placeholder");
    if (placeholder) placeholder.remove();
    const el = document.createElement("span");
    el.className = "py-console-line";
    el.textContent = msg;
    consoleBody.appendChild(el);
  }

  function setStatus(state) {
    const map = {
      ready:   ["Ready",   "py-status-ready"],
      running: ["Running", "py-status-running"],
      error:   ["Error",   "py-status-error"]
    };
    const [text, cls] = map[state] || map.ready;
    statusBadge.textContent = text;
    statusBadge.className = `py-status-badge ${cls}`;
  }

  function updateLines() {
    const count = editor.value.split("\n").length;
    lineNumbers.textContent = Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1).join("\\n");
  }
}