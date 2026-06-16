document.addEventListener("DOMContentLoaded", () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  initDarkMode();
  initPHPEditor();
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
const PHP_EXAMPLES = {
  hello: `<?php
echo "Hello, World!\\n";
echo "Welcome to PHP Editor!\\n";
echo "PHP version: 8.2 (simulated)\\n";
?>`,

  variables: `<?php
$name    = "Lakshay";
$age     = 21;
$score   = 98.5;
$isReady = true;

echo "Name: " . $name . "\\n";
echo "Age: " . $age . "\\n";
echo "Score: " . $score . "\\n";
echo "Ready: " . ($isReady ? "Yes" : "No") . "\\n";
echo gettype($score) . "\\n";
?>`,

  array: `<?php
$fruits = ["apple", "banana", "cherry", "mango"];

echo "All fruits:\\n";
foreach ($fruits as $index => $fruit) {
    echo $index . " => " . $fruit . "\\n";
}

echo "\\nCount: " . count($fruits) . "\\n";

$squares = array_map(fn($n) => $n * $n, [1, 2, 3, 4, 5]);
echo "\\nSquares:\\n";
print_r($squares);
?>`,

    function: `<?php
// Functions (output is pre-computed for browser simulation)
echo "greet('Lakshay') => Hello, Lakshay!\\n";
echo "greet('World', 'Hey') => Hey, World!\\n";
echo "\\nfactorial(5)  => 120\\n";
echo "factorial(10) => 3628800\\n";
?>`,

    class: `<?php
// OOP simulation (browser-side, execution is approximated)
echo "=== OOP in PHP ===\\n";
echo "class Animal { protected \\$name, \\$sound; }\\n";
echo "class Dog extends Animal { ... }\\n\\n";
echo "\\$cat = new Animal('Cat', 'Meow');\\n";
echo "\\$dog = new Dog('Dog', 'Woof');\\n\\n";
echo "--- Output ---\\n";
echo "Cat says Meow!\\n";
echo "Dog says Woof!\\n";
echo "Dog fetches the ball!\\n";
?>`
};

/* ─── Simulator ─── */
function simulatePHP(code) {
  const output = [];
  const errors = [];

  if (!code.trim()) {
    errors.push("No code to execute.");
    return { output, errors };
  }

  if (!code.includes("<?php") && !code.includes("<?")) {
    errors.push("Parse error: PHP opening tag <?php missing.");
    return { output, errors };
  }

  const clean = code.replace(/<\?php/gi, "").replace(/\?>/g, "").trim();
  const lines = clean.split("\n");

  const vars = {};

  const resolveValue = (raw) => {
    raw = raw.trim().replace(/;$/, "");
    if (/^".*"$/.test(raw) || /^'.*'$/.test(raw)) {
      return raw.slice(1, -1)
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\$(\w+)/g, (_, k) => vars[k] !== undefined ? vars[k] : "$" + k);
    }
    if (!isNaN(raw)) return Number(raw);
    if (raw === "true") return true;
    if (raw === "false") return false;
    if (raw.startsWith("$")) {
      const k = raw.slice(1);
      return vars[k] !== undefined ? vars[k] : raw;
    }
    return raw;
  };

  const evalConcat = (expr) => {
    expr = expr.trim().replace(/;$/, "");
    return expr.split(/\s*\.\s*/).map((part) => {
      part = part.trim();
      if (/^".*"$/.test(part) || /^'.*'$/.test(part)) {
        return part.slice(1, -1)
          .replace(/\\n/g, "\n")
          .replace(/\\t/g, "\t")
          .replace(/\$(\w+)/g, (_, k) => vars[k] !== undefined ? vars[k] : "$" + k);
      }
      if (part.startsWith("$")) {
        const k = part.slice(1);
        return vars[k] !== undefined ? vars[k] : part;
      }
      if (!isNaN(part)) return part;
      if (/count\(\$(\w+)\)/.test(part)) {
        const m = part.match(/count\(\$(\w+)\)/);
        const arr = vars[m[1]];
        return Array.isArray(arr) ? arr.length : 0;
      }
      if (/gettype\(/.test(part)) {
        const m = part.match(/gettype\(\$(\w+)\)/);
        if (m) { const v = vars[m[1]]; return v === null ? "NULL" : typeof v === "number" ? (Number.isInteger(v) ? "integer" : "double") : typeof v; }
      }
      return part;
    }).join("");
  };

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith("//") || line.startsWith("#") || line.startsWith("class ") || line.startsWith("function ") || line.startsWith("}") || line.startsWith("public ") || line.startsWith("protected ") || line.startsWith("return ") || line.startsWith("if ") || line.startsWith("foreach ") || line.startsWith("$this->")) continue;

    // Variable assignment
    const assignMatch = line.match(/^\$(\w+)\s*=\s*(.+);$/);
    if (assignMatch) {
      const [, key, val] = assignMatch;
      const trimVal = val.trim();
      if (trimVal.startsWith("[") && trimVal.endsWith("]")) {
        try {
          const arr = trimVal.slice(1, -1).split(",").map((s) => {
            s = s.trim();
            return /^".*"$/.test(s) || /^'.*'$/.test(s) ? s.slice(1, -1) : !isNaN(s) ? Number(s) : s;
          });
          vars[key] = arr;
        } catch { vars[key] = trimVal; }
      } else {
        vars[key] = resolveValue(trimVal);
      }
      continue;
    }

    // echo
    const echoMatch = line.match(/^echo\s+(.+);$/);
    if (echoMatch) {
      output.push(evalConcat(echoMatch[1]));
      continue;
    }

    // print_r
    const printRMatch = line.match(/^print_r\(\$(\w+)\);$/);
    if (printRMatch) {
      const arr = vars[printRMatch[1]];
      if (Array.isArray(arr)) {
        output.push("Array");
        output.push("(");
        arr.forEach((v, i) => output.push(`    [${i}] => ${v}`));
        output.push(")");
      } else {
        output.push(String(arr));
      }
      continue;
    }
  }

if (output.length === 0 && errors.length === 0) {
    errors.push("Notice: Script produced no output.");
  }

  return { output, errors };
}

/* ─── Init Editor ─── */
function initPHPEditor() {
  const editor    = document.getElementById("peEditor");
  const outputBody = document.getElementById("peOutputBody");
  const consoleBody = document.getElementById("peConsoleBody");
  const runBtn    = document.getElementById("peRunBtn");
  const resetBtn  = document.getElementById("peResetBtn");
  const copyBtn   = document.getElementById("peCopyBtn");
  const saveBtn   = document.getElementById("peSaveBtn");
  const exampleSelect = document.getElementById("peExampleSelect");
  const lineNumbers   = document.getElementById("peLineNumbers");
  const statusBadge   = document.getElementById("peStatusBadge");
  const consoleClear  = document.getElementById("peConsoleClear");

  const SAVE_KEY = "php-editor-draft";

  // Load saved draft or default example
  editor.value = localStorage.getItem(SAVE_KEY) || PHP_EXAMPLES.hello;
  updateLines();

  exampleSelect.addEventListener("change", () => {
    editor.value = PHP_EXAMPLES[exampleSelect.value];
    updateLines();
    runCode();
  });

  runBtn.addEventListener("click", runCode);

  resetBtn.addEventListener("click", () => {
    editor.value = PHP_EXAMPLES[exampleSelect.value];
    updateLines();
    runCode();
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

  editor.addEventListener("input", updateLines);
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
    consoleBody.innerHTML = '<span class="pe-console-placeholder">No errors detected.</span>';
  });

function runCode() {
    setStatus("running");
    clearOutput();
    consoleBody.innerHTML = '<span class="pe-console-placeholder">No errors detected.</span>';

    setTimeout(() => {
      const { output, errors } = simulatePHP(editor.value);

      if (output.length > 0) {
        const placeholder = outputBody.querySelector(".pe-output-placeholder");
        if (placeholder) placeholder.remove();
        output.forEach((line) => {
          const el = document.createElement("span");
          el.className = "pe-output-line";
          el.textContent = line;
          outputBody.appendChild(el);
        });
      } else {
        outputBody.innerHTML = '<span class="pe-output-placeholder">No output produced.</span>';
      }

      if (errors.length > 0) {
        errors.forEach(logError);
        setStatus("error");
      } else {
        setStatus("ready");
      }
    }, 300);
  }

  function clearOutput() {
    outputBody.innerHTML = '<span class="pe-output-placeholder">Running...</span>';
  }

  function logError(msg) {
    const placeholder = consoleBody.querySelector(".pe-console-placeholder");
    if (placeholder) placeholder.remove();
    const el = document.createElement("span");
    el.className = "pe-console-line";
    el.textContent = msg;
    consoleBody.appendChild(el);
  }

  function setStatus(state) {
    const map = { ready: ["Ready", "pe-status-ready"], running: ["Running", "pe-status-running"], error: ["Error", "pe-status-error"] };
    const [text, cls] = map[state] || map.ready;
    statusBadge.textContent = text;
    statusBadge.className = `pe-status-badge ${cls}`;
  }

  function updateLines() {
    const count = editor.value.split("\n").length;
    lineNumbers.textContent = Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1).join("\n");
  }
}