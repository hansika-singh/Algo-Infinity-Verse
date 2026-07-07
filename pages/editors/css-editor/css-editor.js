/*  Fixed HTML template used by the preview pane.
    The user only ever edits CSS — this markup never changes,
    so every example below targets the same set of selectors.  */
const CSS_PREVIEW_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Live Preview</title></head>
<body>
  <header class="preview-header">
    <div class="logo">∞ AIV</div>
    <nav class="preview-nav">
      <a href="#">Home</a>
      <a href="#">Learn</a>
      <a href="#">Practice</a>
      <a href="#">Contact</a>
    </nav>
  </header>

  <section class="preview-hero">
    <h1>Style This Page</h1>
    <p>Edit the CSS on the left to transform this layout in real time.</p>
    <div class="button-group">
      <button class="btn btn-one">Primary</button>
      <button class="btn btn-two">Secondary</button>
      <button class="btn btn-three">Ghost</button>
    </div>
  </section>

  <section class="preview-cards">
    <div class="card">
      <div class="card-icon">🧮</div>
      <h3>Arrays</h3>
      <p>Foundation of every algorithm.</p>
    </div>
    <div class="card">
      <div class="card-icon">🪟</div>
      <h3>Sliding Window</h3>
      <p>Efficient subarray techniques.</p>
    </div>
    <div class="card">
      <div class="card-icon">🌲</div>
      <h3>Trees &amp; Graphs</h3>
      <p>BFS, DFS and traversals.</p>
    </div>
    <div class="card">
      <div class="card-icon">⚡</div>
      <h3>Dynamic Programming</h3>
      <p>Memoisation and tabulation.</p>
    </div>
  </section>

  <section class="preview-list">
    <h2>Checklist</h2>
    <ul>
      <li>Write CSS</li>
      <li>Watch it apply live</li>
      <li>Experiment freely</li>
    </ul>
  </section>

  <div class="preview-box">
    <h2>Box Model Demo</h2>
    <p>This box has margin, border &amp; padding you can edit.</p>
  </div>

  <footer class="preview-footer">
    <p>Algo Infinity Verse — CSS Playground</p>
  </footer>
</body>
</html>`;

/*  Example CSS — all target CSS_PREVIEW_TEMPLATE above  */
const CSS_EXAMPLES = {
  basic: `body {
  font-family: sans-serif;
  margin: 0;
  background: #f8fafc;
  color: #1e293b;
}

.preview-header {
  background: #1e293b;
  color: #fff;
  padding: 1rem 1.5rem;
}

.logo { font-weight: 800; color: #6366f1; }

.preview-nav a {
  color: #cbd5e1;
  text-decoration: none;
  margin-left: 1rem;
}

.preview-hero {
  padding: 2.5rem 1.5rem;
  text-align: center;
}

.preview-hero h1 { color: #6366f1; }

.btn {
  padding: 0.6rem 1.4rem;
  margin: 0.4rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn-one { background: #6366f1; color: #fff; }
.btn-two { background: #e2e8f0; color: #1e293b; }
.btn-three { background: transparent; border: 1px solid #6366f1; color: #6366f1; }

.preview-cards { padding: 1.5rem; }

.card {
  background: #fff;
  border-radius: 10px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
}

.preview-list { padding: 0 1.5rem 1.5rem; }

.preview-box {
  margin: 1.5rem;
  padding: 1.5rem;
  border: 2px dashed #6366f1;
}

.preview-footer {
  text-align: center;
  padding: 1rem;
  color: #94a3b8;
  font-size: 0.85rem;
}`,

  flexbox: `body { font-family: sans-serif; margin: 0; background: #f8fafc; color: #1e293b; }

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #1e293b;
  color: #fff;
  padding: 1rem 1.5rem;
}
.logo { font-weight: 800; color: #6366f1; }

.preview-nav {
  display: flex;
  gap: 1.25rem;
}
.preview-nav a { color: #cbd5e1; text-decoration: none; }
.preview-nav a:hover { color: #fff; }

.preview-hero { padding: 2.5rem 1.5rem; text-align: center; }
.preview-hero h1 { color: #6366f1; }

.button-group {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.btn { padding: 0.6rem 1.4rem; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
.btn-one { background: #6366f1; color: #fff; }
.btn-two { background: #e2e8f0; color: #1e293b; }
.btn-three { background: transparent; border: 1px solid #6366f1; color: #6366f1; }

.preview-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1.5rem;
}
.card {
  flex: 1 1 160px;
  background: #fff;
  border-radius: 10px;
  padding: 1rem;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
}

.preview-footer { text-align: center; padding: 1rem; color: #94a3b8; font-size: 0.85rem; }`,

  grid: `body { font-family: sans-serif; margin: 0; background: #f8fafc; color: #1e293b; }

.preview-header {
  display: flex;
  justify-content: space-between;
  background: #1e293b;
  color: #fff;
  padding: 1rem 1.5rem;
}
.logo { color: #8b5cf6; font-weight: 800; }
.preview-nav a { color: #cbd5e1; text-decoration: none; margin-left: 1rem; }

.preview-hero { text-align: center; padding: 2rem 1.5rem; }
.preview-hero h1 { color: #8b5cf6; }

.button-group { display: flex; justify-content: center; gap: 0.75rem; }
.btn { padding: 0.6rem 1.2rem; border: none; border-radius: 8px; cursor: pointer; }
.btn-one { background: #8b5cf6; color: #fff; }
.btn-two { background: #ede9fe; color: #5b21b6; }
.btn-three { background: transparent; border: 1px solid #8b5cf6; color: #8b5cf6; }

.preview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
}
.card {
  background: #fff;
  border-radius: 10px;
  padding: 1rem;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
}

.preview-footer { text-align: center; padding: 1rem; color: #94a3b8; font-size: 0.85rem; }`,

  buttons: `body { font-family: sans-serif; margin: 0; background: #0f172a; color: #e2e8f0; }

.preview-header { padding: 1rem 1.5rem; background: #1e293b; }
.preview-nav a { color: #e2e8f0; text-decoration: none; margin-left: 1rem; }

.preview-hero { text-align: center; padding: 2.5rem 1.5rem; }
.preview-hero h1 { color: #fbbf24; }

.button-group {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.7rem 1.6rem;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.btn:hover { transform: translateY(-2px); }

.btn-one {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  box-shadow: 0 4px 14px rgba(99,102,241,0.4);
}

.btn-two {
  background: #1e293b;
  color: #e2e8f0;
  border: 1px solid #475569;
}
.btn-two:hover { border-color: #8b5cf6; color: #8b5cf6; }

.btn-three {
  background: transparent;
  color: #8b5cf6;
  border: 2px solid #8b5cf6;
}
.btn-three:hover { background: #8b5cf6; color: #fff; }

.preview-cards { display: flex; flex-wrap: wrap; gap: 1rem; padding: 1.5rem; justify-content: center; }
.card { background: #1e293b; border-radius: 10px; padding: 1rem; flex: 1 1 150px; }

.preview-footer { text-align: center; padding: 1rem; color: #64748b; font-size: 0.85rem; }`,

  animations: `body { font-family: sans-serif; margin: 0; background: #f8fafc; color: #1e293b; }

.preview-header { background: #1e293b; color: #fff; padding: 1rem 1.5rem; }
.preview-nav a { color: #cbd5e1; text-decoration: none; margin-left: 1rem; }

@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.preview-hero { text-align: center; padding: 2.5rem 1.5rem; }
.preview-hero h1 {
  color: #6366f1;
  animation: fadeSlideIn 0.6s ease-out;
}
.preview-hero p {
  animation: fadeSlideIn 0.6s ease-out 0.15s backwards;
}

.button-group { display: flex; justify-content: center; gap: 0.75rem; }
.btn {
  padding: 0.6rem 1.4rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
}
.btn:hover { transform: scale(1.08); }
.btn-one { background: #6366f1; color: #fff; }
.btn-two { background: #e2e8f0; color: #1e293b; }
.btn-three { background: transparent; border: 1px solid #6366f1; color: #6366f1; }

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.15); }
}

.preview-cards { display: flex; flex-wrap: wrap; gap: 1rem; padding: 1.5rem; justify-content: center; }
.card {
  flex: 1 1 150px;
  background: #fff;
  border-radius: 10px;
  padding: 1rem;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
}
.card-icon {
  font-size: 1.75rem;
  display: inline-block;
  animation: pulse 1.8s ease-in-out infinite;
}

.preview-footer { text-align: center; padding: 1rem; color: #94a3b8; font-size: 0.85rem; }`
};

/*  Init Editor  */
function initCssEditor() {
  const editor = CodeMirror.fromTextArea(
    document.getElementById("cseEditor"),
    {
      mode: "css",
      theme: "material-darker",
      lineNumbers: true,
      lineWrapping: true,
      tabSize: 2,
      indentUnit: 2,
      autoCloseBrackets: true,
      matchBrackets: true
    }
  );
  if (!editor) return;

  /* CodeMirror creates its own off-screen <textarea> (or contenteditable
     element, depending on inputStyle) to capture native keystrokes/IME
     input — separate from the original #cseEditor textarea it replaced.
     That internal field ships with no id, name, or label, which trips
     axe's "form elements must have labels" rule. Label it directly. */
  const cmInput = editor.getInputField();
  if (cmInput) {
    cmInput.id = "cseEditorInput";
    cmInput.name = "cseEditorInput";
    cmInput.setAttribute("aria-label", "CSS code editor input");
    cmInput.setAttribute("title", "CSS code editor input");
  }

  const consoleBody   = document.getElementById("cseConsoleBody");
  const runBtn        = document.getElementById("cseRunBtn");
  const resetBtn      = document.getElementById("cseResetBtn");
  const clearBtn      = document.getElementById("cseClearBtn");
  const copyBtn       = document.getElementById("cseCopyBtn");
  const saveBtn       = document.getElementById("cseSaveBtn");
  const exampleSelect = document.getElementById("cseExampleSelect");
  const statusBadge   = document.getElementById("cseStatusBadge");
  const consoleClear  = document.getElementById("cseConsoleClear");
  const liveToggle    = document.getElementById("cseLiveToggle");
  const iframe        = document.getElementById("csePreviewFrame");

  const SAVE_KEY = "css-editor-draft";

  /* Restore or seed */
  const saved = localStorage.getItem(SAVE_KEY);
  editor.setValue((saved && saved.trim().length > 0) ? saved : CSS_EXAMPLES.basic);
  editor.refresh();
  renderPreview();

  /* Example select */
  exampleSelect.addEventListener("change", () => {
    editor.setValue(CSS_EXAMPLES[exampleSelect.value]);
    renderPreview();
    logInfo("Loaded example: " + exampleSelect.options[exampleSelect.selectedIndex].text);
  });

  /* Apply Styles (manual run) */
  runBtn.addEventListener("click", () => renderPreview(true));

  /* Reset to currently selected example */
  resetBtn.addEventListener("click", () => {
    editor.setValue(CSS_EXAMPLES[exampleSelect.value]);
    renderPreview();
  });

  /* Clear CSS entirely */
  clearBtn.addEventListener("click", () => {
    editor.setValue("");
    renderPreview();
    logInfo("CSS cleared.");
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
    try {
      localStorage.setItem(SAVE_KEY, editor.getValue());
      saveBtn.innerHTML = '<i class="fas fa-check"></i>';
      setTimeout(() => { saveBtn.innerHTML = '<i class="fas fa-save"></i>'; }, 2000);
      logInfo("CSS saved to browser storage.");
    } catch {
      logMsg("Could not save to browser storage.", "warn");
    }
  });

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
      logInfo("Live preview paused. Click Apply Styles to refresh.");
    }
  });

  /* Console clear */
  consoleClear.addEventListener("click", () => {
    consoleBody.innerHTML = '<span class="cse-console-placeholder">No issues detected.</span>';
  });

  /*  Core render function — injects the user's CSS into a fixed HTML
      template and writes the result into the sandboxed iframe.  */
  function renderPreview(manual = false) {
    setStatus("running");

    const css = editor.getValue();

    /* Basic sanity checks (lightweight linting, not a full CSS parser) */
    const warnings = [];
    const openBraces  = (css.match(/{/g) || []).length;
    const closeBraces = (css.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      warnings.push(`Mismatched braces: ${openBraces} "{" vs ${closeBraces} "}".`);
    }
    if (css.trim().length === 0) {
      warnings.push("Editor is empty — previewing the unstyled template.");
    }

    try {
      const doc = CSS_PREVIEW_TEMPLATE.replace(
        "</head>",
        `<style>\n${css}\n</style>\n</head>`
      );
      iframe.srcdoc = doc;
      setStatus("ready");
      if (manual) logInfo("Styles applied.");
      warnings.forEach(w => logMsg(w, "warn"));
    } catch (err) {
      setStatus("error");
      logMsg("Preview error: " + err.message, "error");
    }
  }

  /*  Helpers  */
  function logInfo(msg) { logMsg(msg, "info"); }

  function logMsg(msg, type = "info") {
    const placeholder = consoleBody.querySelector(".cse-console-placeholder");
    if (placeholder) placeholder.remove();
    const el = document.createElement("span");
    el.className = `cse-console-line${type !== "info" ? " " + type : ""}`;
    el.textContent = msg;
    consoleBody.appendChild(el);
    /* Auto-scroll */
    consoleBody.scrollTop = consoleBody.scrollHeight;
  }

  function setStatus(state) {
    const map = {
      ready:   ["Ready",      "cse-status-ready"],
      running: ["Rendering",  "cse-status-running"],
      error:   ["Error",      "cse-status-error"]
    };
    const [text, cls] = map[state] || map.ready;
    statusBadge.textContent = text;
    statusBadge.className = `cse-status-badge ${cls}`;
  }
}

/* This page boots its own editor independently of script.js's
   DOMContentLoaded handler (which currently only knows about
   initHtmlEditor). If you later add
   `try { initCssEditor(); } catch (e) { console.error("CssEditor:", e); }`
   inside script.js to match the html-editor pattern, you can remove
   the listener below to avoid initializing twice. */
document.addEventListener("DOMContentLoaded", () => {
  try { initCssEditor(); } catch (e) { console.error("CssEditor:", e); }
});