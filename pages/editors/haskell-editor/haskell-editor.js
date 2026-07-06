document.addEventListener("DOMContentLoaded", () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  try { initHaskellEditor(); } catch(e) { console.error("HaskellEditor:", e); }
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

/* ─── Haskell Examples ─── */
const HASKELL_EXAMPLES = {
  hello: [
    {
      name: "Main.hs",
      content: `main :: IO ()
main = do
    putStrLn "Hello, World!"
    putStrLn "Welcome to the Haskell Editor!"`
    }
  ],

  variables: [
    {
      name: "Main.hs",
      content: `-- In Haskell, variables are immutable bindings.
-- Let's declare variables and a simple function.

greet :: String -> String
greet name = "Hello, " ++ name ++ "!"

main :: IO ()
main = do
    let name = "Lakshay"
        age = 21 :: Int
        score = 98.5 :: Double
        isReady = True
    
    putStrLn (greet name)
    putStrLn ("Age: " ++ show age)
    putStrLn ("Score: " ++ show score)
    putStrLn ("Ready: " ++ show isReady)`
    }
  ],

  recursion: [
    {
      name: "Main.hs",
      content: `-- Functional programming excels at recursion and list operations.

factorial :: Int -> Int
factorial n = if n <= 1 then 1 else n * factorial (n - 1)

fibonacci :: Int -> Int
fibonacci 0 = 0
fibonacci 1 = 1
fibonacci n = fibonacci (n - 1) + fibonacci (n - 2)

main :: IO ()
main = do
    putStrLn ("factorial 5  = " ++ show (factorial 5))
    putStrLn ("factorial 10 = " ++ show (factorial 10))
    
    putStrLn "\\nFirst 10 Fibonacci numbers:"
    let fibs = [fibonacci x | x <- [0..9]]
    putStrLn (show fibs)`
    }
  ],

  modules: [
    {
      name: "Main.hs",
      content: `module Main where

import Helper (greet, square)

main :: IO ()
main = do
    putStrLn (greet "Lakshay")
    putStrLn ("square 7 = " ++ show (square 7))`
    },
    {
      name: "Helper.hs",
      content: `module Helper (greet, square) where

greet :: String -> String
greet name = "Hello, " ++ name ++ "!"

square :: Int -> Int
square x = x * x`
    }
  ],

  datatypes: [
    {
      name: "Main.hs",
      content: `-- Algebraic Data Types (ADTs) are core to Haskell.

data Shape = Circle Double | Rectangle Double Double
    deriving (Show)

area :: Shape -> Double
area (Circle r) = pi * r * r
area (Rectangle w h) = w * h

main :: IO ()
main = do
    let c = Circle 5.0
        r = Rectangle 4.0 6.0
    
    putStrLn ("Area of circle " ++ show c ++ " is " ++ show (area c))
    putStrLn ("Area of rectangle " ++ show r ++ " is " ++ show (area r))`
    }
  ]
};

/* ─── Piston API Executor ─── */
async function executeHaskell(files) {
  if (files.length === 0 || !files.some(f => f.content.trim())) {
    return { output: [], errors: ["No code to execute."] };
  }

  const pistonFiles = files.map(f => ({
    name: f.name,
    content: f.content
  }));

  try {
    const response = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: "haskell",
        version: "*",
        files: pistonFiles,
        stdin: "",
        args: [],
        compile_timeout: 15000,
        run_timeout: 4000,
        compile_memory_limit: -1,
        run_memory_limit: -1
      })
    });

    if (!response.ok) {
      throw new Error("Piston API request failed: " + response.statusText);
    }

    const data = await response.json();
    const output = [];
    const errors = [];

    if (data.compile && data.compile.stderr) {
      errors.push(...data.compile.stderr.split("\n").filter(l => l.trim()));
    }

    if (data.run && data.run.stderr) {
      errors.push(...data.run.stderr.split("\n").filter(l => l.trim()));
    }

    if (data.run && data.run.stdout) {
      output.push(...data.run.stdout.split("\n"));
    }

    if (output.length === 0 && errors.length === 0) {
      output.push("Process finished with no output.");
    }

    return { output, errors };

  } catch (error) {
    return { output: [], errors: ["Execution Error: " + error.message] };
  }
}

/* ─── Syntax Highlighting ─── */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function highlightHaskell(code) {
  const lines = code.split("\n");
  const highlighted = lines.map((line) => {
    let result = escapeHtml(line);
    const regex = /(<[^>]+>)|(--.*$)|(\{-[\s\S]*?-\})|("[^"]*"|'[^']')|(\b(module|import|where|let|in|data|type|newtype|class|instance|deriving|do|if|then|else|case|of|infix|infixl|infixr|foreign|as|forall|hiding|qualified)\b)|(\b[A-Z]\w*\b)|((?<!\.[a-zA-Z])\b(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?\b(?!\.[a-zA-Z]))/g;
    
    return result.replace(regex, (m, tag, comment, blockComment, str, kw, typeToken, num) => {
      if (tag) return tag;
      if (comment) return '<span class="token comment">' + comment + '</span>';
      if (blockComment) return '<span class="token comment">' + blockComment + '</span>';
      if (str) return '<span class="token string">' + str + '</span>';
      if (kw) return '<span class="token keyword">' + kw + '</span>';
      if (typeToken) return '<span class="token function">' + typeToken + '</span>';
      if (num) return '<span class="token number">' + num + '</span>';
      return m;
    });
  }).join("\n");
  
  return highlighted;
}

/* ─── Init Editor ─── */
function initHaskellEditor() {
  const editor = document.getElementById("hsEditor");
  const highlight = document.getElementById("hsHighlight");
  if (!editor || !highlight) return;

  const outputBody    = document.getElementById("hsOutputBody");
  const consoleBody   = document.getElementById("hsConsoleBody");
  const runBtn        = document.getElementById("hsRunBtn");
  const resetBtn      = document.getElementById("hsResetBtn");
  const copyBtn       = document.getElementById("hsCopyBtn");
  const saveBtn       = document.getElementById("hsSaveBtn");
  const exampleSelect = document.getElementById("hsExampleSelect");
  const lineNumbers   = document.getElementById("hsLineNumbers");
  const statusBadge   = document.getElementById("hsStatusBadge");
  const consoleClear  = document.getElementById("hsConsoleClear");
  const fileList      = document.getElementById("hsFileList");
  const newFileBtn    = document.getElementById("hsNewFileBtn");
  const activeFileNameEl = document.getElementById("hsActiveFileName");

  const SAVE_KEY = "haskell-editor-project";
  let runSeq = 0;

  // Project state
  let files = [];
  let activeIndex = 0;

  // Load project from localStorage or default
  const savedProject = localStorage.getItem(SAVE_KEY);
  if (savedProject) {
    try {
      const parsed = JSON.parse(savedProject);
      files = parsed.files || HASKELL_EXAMPLES.hello;
      activeIndex = parsed.activeIndex !== undefined ? parsed.activeIndex : 0;
      if (activeIndex >= files.length) activeIndex = 0;
    } catch (e) {
      files = JSON.parse(JSON.stringify(HASKELL_EXAMPLES.hello));
      activeIndex = 0;
    }
  } else {
    files = JSON.parse(JSON.stringify(HASKELL_EXAMPLES.hello));
    activeIndex = 0;
  }

  // Initial Sync
  syncEditorState();
  renderFileList();

  // Scroll Sync
  editor.addEventListener("scroll", () => {
    lineNumbers.scrollTop = editor.scrollTop;
    highlight.scrollTop = editor.scrollTop;
    highlight.scrollLeft = editor.scrollLeft;
  });

  // Input & Hotkeys
  editor.addEventListener("input", () => {
    files[activeIndex].content = editor.value;
    updateSyntaxHighlight();
    updateLineNumbers();
  });

  editor.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const s = editor.selectionStart;
      editor.value = editor.value.substring(0, s) + "    " + editor.value.substring(editor.selectionEnd);
      editor.selectionStart = editor.selectionEnd = s + 4;
      files[activeIndex].content = editor.value;
      updateSyntaxHighlight();
      updateLineNumbers();
    }
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      runCode();
    }
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      saveProject();
    }
  });

  // Actions
  runBtn.addEventListener("click", runCode);
  resetBtn.addEventListener("click", resetProject);
  copyBtn.addEventListener("click", copyCurrentFileCode);
  saveBtn.addEventListener("click", saveProject);
  consoleClear.addEventListener("click", clearConsole);

  exampleSelect.addEventListener("change", () => {
    const val = exampleSelect.value;
    if (HASKELL_EXAMPLES[val]) {
      files = JSON.parse(JSON.stringify(HASKELL_EXAMPLES[val]));
      activeIndex = 0;
      syncEditorState();
      renderFileList();
    }
  });

  newFileBtn.addEventListener("click", showNewFileInput);

  /* ── Core Editor Functions ── */

  function syncEditorState() {
    const activeFile = files[activeIndex];
    activeFileNameEl.textContent = activeFile.name;
    editor.value = activeFile.content;
    updateSyntaxHighlight();
    updateLineNumbers();
    
    // Clear scroll position sync on active file switch
    editor.scrollTop = 0;
    editor.scrollLeft = 0;
    lineNumbers.scrollTop = 0;
    highlight.scrollTop = 0;
    highlight.scrollLeft = 0;
  }

  function updateSyntaxHighlight() {
    highlight.innerHTML = highlightHaskell(editor.value) + "\n";
  }

  function updateLineNumbers() {
    const count = editor.value.split("\n").length;
    lineNumbers.textContent = Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1).join("\n");
  }

  function renderFileList() {
    fileList.innerHTML = "";
    files.forEach((file, index) => {
      const el = document.createElement("div");
      el.className = `file-item ${index === activeIndex ? "active" : ""}`;
      el.dataset.index = index;

      const nameContainer = document.createElement("div");
      nameContainer.className = "file-name-container";
      nameContainer.innerHTML = `<i class="fas fa-lambda"></i> <span>${escapeHtml(file.name)}</span>`;
      el.appendChild(nameContainer);

      const actionContainer = document.createElement("div");
      actionContainer.className = "file-item-actions";

      // Edit Button
      const editBtn = document.createElement("button");
      editBtn.className = "file-action-btn edit";
      editBtn.title = "Rename File";
      editBtn.innerHTML = '<i class="fas fa-edit"></i>';
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        showRenameInput(index);
      });
      actionContainer.appendChild(editBtn);

      // Delete Button
      const delBtn = document.createElement("button");
      delBtn.className = "file-action-btn delete";
      delBtn.title = "Delete File";
      delBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteFile(index);
      });
      actionContainer.appendChild(delBtn);

      el.appendChild(actionContainer);

      el.addEventListener("click", () => {
        activeIndex = index;
        syncEditorState();
        renderFileList();
      });

      fileList.appendChild(el);
    });
  }

  function showNewFileInput() {
    // Check if new file input is already showing
    if (document.getElementById("newFileInput")) {
      document.getElementById("newFileInput").focus();
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "file-item-input-wrapper";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "file-item-input";
    input.id = "newFileInput";
    input.placeholder = "Filename.hs";

    wrapper.appendChild(input);
    fileList.appendChild(wrapper);
    input.focus();

    const finishNewFile = () => {
      const name = input.value.trim();
      if (!name) {
        wrapper.remove();
        return;
      }
      
      // Validations
      if (!name.endsWith(".hs")) {
        console.warn("Alert:", "File name must end with '.hs'");
        input.focus();
        return;
      }

      if (files.some(f => f.name.toLowerCase() === name.toLowerCase())) {
        console.warn("Alert:", "A file with this name already exists.");
        input.focus();
        return;
      }

      const newFile = {
        name: name,
        content: `-- Haskell module: ${name.slice(0, -3)}\n\n`
      };

      files.push(newFile);
      activeIndex = files.length - 1;
      wrapper.remove();
      saveProject();
      syncEditorState();
      renderFileList();
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        finishNewFile();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        wrapper.remove();
      }
    });

    input.addEventListener("blur", () => {
      setTimeout(() => {
        if (wrapper.parentNode) {
          finishNewFile();
        }
      }, 200);
    });
  }

  function showRenameInput(index) {
    const file = files[index];
    const itemEl = fileList.children[index];
    if (!itemEl) return;

    const originalHTML = itemEl.innerHTML;
    itemEl.innerHTML = "";

    const input = document.createElement("input");
    input.type = "text";
    input.className = "file-item-input";
    input.value = file.name;
    itemEl.appendChild(input);
    input.focus();
    input.select();

    const finishRename = () => {
      const newName = input.value.trim();
      if (!newName || newName === file.name) {
        renderFileList();
        return;
      }

      if (!newName.endsWith(".hs")) {
        console.warn("Alert:", "File name must end with '.hs'");
        input.focus();
        return;
      }

      if (files.some((f, idx) => idx !== index && f.name.toLowerCase() === newName.toLowerCase())) {
        console.warn("Alert:", "A file with this name already exists.");
        input.focus();
        return;
      }

      file.name = newName;
      saveProject();
      renderFileList();
      if (index === activeIndex) {
        activeFileNameEl.textContent = newName;
      }
    };

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        finishRename();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        renderFileList();
      }
    });

    input.addEventListener("blur", () => {
      setTimeout(() => {
        if (input.parentNode) {
          finishRename();
        }
      }, 200);
    });
  }

  function deleteFile(index) {
    const file = files[index];
    if (files.length <= 1) {
      console.warn("Alert:", "Cannot delete the only file in the project.");
      return;
    }

    if (false /* confirm removed */) {
      files.splice(index, 1);
      if (activeIndex >= files.length) {
        activeIndex = files.length - 1;
      }
      saveProject();
      syncEditorState();
      renderFileList();
    }
  }

  function saveProject() {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      files,
      activeIndex
    }));
    showActionIndicator(saveBtn, '<i class="fas fa-check"></i>');
  }

  function resetProject() {
    if (false /* confirm removed */) {
      const val = exampleSelect.value;
      files = JSON.parse(JSON.stringify(HASKELL_EXAMPLES[val] || HASKELL_EXAMPLES.hello));
      activeIndex = 0;
      saveProject();
      syncEditorState();
      renderFileList();
      showActionIndicator(resetBtn, '<i class="fas fa-check"></i>');
    }
  }

  function copyCurrentFileCode() {
    navigator.clipboard.writeText(editor.value)
      .then(() => {
        showActionIndicator(copyBtn, '<i class="fas fa-check"></i>');
      })
      .catch(() => {
        logError("Failed to copy code to clipboard.");
      });
  }

  function showActionIndicator(btn, successHTML) {
    const originalHTML = btn.innerHTML;
    btn.innerHTML = successHTML;
    btn.style.color = "#22c55e";
    btn.style.borderColor = "#22c55e";
    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.style.color = "";
      btn.style.borderColor = "";
    }, 2000);
  }

  function clearConsole() {
    consoleBody.innerHTML = '<span class="hs-console-placeholder">No compilation errors.</span>';
  }

  async function runCode() {
    const seq = ++runSeq;
    setStatus("running");
    outputBody.innerHTML = '<span class="hs-output-placeholder">Compiling and running...</span>';
    consoleBody.innerHTML = '<span class="hs-console-placeholder">No compilation errors.</span>';

    const { output, errors } = await executeHaskell(files);
    if (seq !== runSeq) return; // Prevent race conditions

    if (output.length > 0) {
      outputBody.innerHTML = "";
      output.forEach((line) => {
        const el = document.createElement("span");
        el.className = "hs-output-line";
        el.textContent = line;
        outputBody.appendChild(el);
      });
    } else {
      outputBody.innerHTML = '<span class="hs-output-placeholder">No standard output produced.</span>';
    }

    if (errors.length > 0) {
      consoleBody.innerHTML = "";
      errors.forEach(logError);
      setStatus("error");
    } else {
      setStatus("ready");
    }
  }

  function logError(msg) {
    const placeholder = consoleBody.querySelector(".hs-console-placeholder");
    if (placeholder) placeholder.remove();
    const el = document.createElement("span");
    el.className = "hs-console-line";
    el.textContent = msg;
    consoleBody.appendChild(el);
  }

  function setStatus(state) {
    const map = {
      ready:   ["Ready",   "hs-status-ready"],
      running: ["Running", "hs-status-running"],
      error:   ["Error",   "hs-status-error"]
    };
    const [text, cls] = map[state] || map.ready;
    statusBadge.textContent = text;
    statusBadge.className = `hs-status-badge ${cls}`;
  }
}


window.addEventListener("resize", () => {
  if (typeof updateLineNumbers === 'function') updateLineNumbers();
});
