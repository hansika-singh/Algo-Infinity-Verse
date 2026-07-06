document.addEventListener("DOMContentLoaded", () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  try { initCEditor(); } catch(e) { console.error("CEditor:", e); }
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

/* ─── Examples ─── */
const C_EXAMPLES = {
  hello: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    printf("Welcome to the C Editor!\\n");
    return 0;
}`,

  variables: `#include <stdio.h>

int main() {
    int age = 21;
    float score = 98.5;
    char grade = 'A';
    char name[] = "Lakshay";

    printf("Name: %s\\n", name);
    printf("Age: %d\\n", age);
    printf("Score: %.2f\\n", score);
    printf("Grade: %c\\n", grade);

    return 0;
}`,

  loops: `#include <stdio.h>

int main() {
    printf("For loop sequence:\\n");
    for (int i = 1; i <= 5; i++) {
        printf("%d ", i);
    }
    
    printf("\\n\\nWhile loop countdown:\\n");
    int count = 5;
    while (count > 0) {
        printf("%d... ", count);
        count--;
    }
    printf("Liftoff!\\n");

    return 0;
}`,

  functions: `#include <stdio.h>

int add(int a, int b) {
    return a + b;
}

int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

int main() {
    int sum = add(10, 20);
    printf("Sum of 10 and 20: %d\\n", sum);
    
    printf("Factorial of 5: %d\\n", factorial(5));
    
    return 0;
}`,

  pointers: `#include <stdio.h>

int main() {
    int num = 10;
    int *ptr = &num;

    printf("Value of num: %d\\n", num);
    printf("Address of num: %p\\n", &num);
    printf("Value stored in ptr: %p\\n", ptr);
    printf("Value pointed to by ptr: %d\\n", *ptr);

    *ptr = 20;
    printf("\\nAfter modification through pointer:\\n");
    printf("Value of num: %d\\n", num);

    return 0;
}`,

  structs: `#include <stdio.h>
#include <string.h>

struct Student {
    char name[50];
    int roll;
    float marks;
};

int main() {
    struct Student s1;
    
    strcpy(s1.name, "Alice");
    s1.roll = 101;
    s1.marks = 88.5;

    printf("Student Details:\\n");
    printf("Name: %s\\n", s1.name);
    printf("Roll: %d\\n", s1.roll);
    printf("Marks: %.1f\\n", s1.marks);

    return 0;
}`
};

/* ─── Piston API Executor ─── */
async function executeC(code) {
  if (!code.trim()) {
    return { output: [], errors: ["No code to execute."] };
  }

  try {
    const response = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: "c",
        version: "*",
        files: [{ name: "main.c", content: code }],
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

    if (data.compile && data.compile.stderr) {
      errors.push(...data.compile.stderr.split("\\n").filter(l => l.trim()));
    }

    if (data.run && data.run.stderr) {
      errors.push(...data.run.stderr.split("\\n").filter(l => l.trim()));
    }

    if (data.run && data.run.stdout) {
      output.push(...data.run.stdout.split("\\n").filter(l => l.trim()));
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
function initCEditor() {
  const editor = document.getElementById("ceEditor");
  if (!editor) return;
  const outputBody    = document.getElementById("ceOutputBody");
  const consoleBody   = document.getElementById("ceConsoleBody");
  const runBtn        = document.getElementById("ceRunBtn");
  const resetBtn      = document.getElementById("ceResetBtn");
  const copyBtn       = document.getElementById("ceCopyBtn");
  const saveBtn       = document.getElementById("ceSaveBtn");
  const exampleSelect = document.getElementById("ceExampleSelect");
  const lineNumbers   = document.getElementById("ceLineNumbers");
  const statusBadge   = document.getElementById("ceStatusBadge");
  const consoleClear  = document.getElementById("ceConsoleClear");

  const SAVE_KEY = "c-editor-draft";
  let runSeq = 0;
  const saved = localStorage.getItem(SAVE_KEY);
  editor.value = (saved && saved.trim().length > 0) ? saved : C_EXAMPLES.hello;
  updateLines();

  exampleSelect.addEventListener("change", () => {
    editor.value = C_EXAMPLES[exampleSelect.value];
    updateLines();
  });

  runBtn.addEventListener("click", runCode);

  resetBtn.addEventListener("click", () => {
    editor.value = C_EXAMPLES[exampleSelect.value];
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
    consoleBody.innerHTML = '<span class="ce-console-placeholder">No errors detected.</span>';
  });

  async function runCode() {
    const seq = ++runSeq;
    setStatus("running");
    outputBody.innerHTML = '<span class="ce-output-placeholder">Compiling and running...</span>';
    consoleBody.innerHTML = '<span class="ce-console-placeholder">No errors detected.</span>';

    const { output, errors } = await executeC(editor.value);
    if (seq !== runSeq) return; // Prevent race conditions

    if (output.length > 0) {
      outputBody.innerHTML = "";
      output.forEach((line) => {
        const el = document.createElement("span");
        el.className = "ce-output-line";
        el.textContent = line;
        outputBody.appendChild(el);
      });
    } else {
      outputBody.innerHTML = '<span class="ce-output-placeholder">No standard output produced.</span>';
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
    const placeholder = consoleBody.querySelector(".ce-console-placeholder");
    if (placeholder) placeholder.remove();
    const el = document.createElement("span");
    el.className = "ce-console-line";
    el.textContent = msg;
    consoleBody.appendChild(el);
  }

  function setStatus(state) {
    const map = {
      ready:   ["Ready",   "ce-status-ready"],
      running: ["Running", "ce-status-running"],
      error:   ["Error",   "ce-status-error"]
    };
    const [text, cls] = map[state] || map.ready;
    statusBadge.textContent = text;
    statusBadge.className = `ce-status-badge ${cls}`;
  }

  function updateLines() {
    const count = editor.value.split("\n").length;
    lineNumbers.textContent = Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1).join("\n");
  }
}