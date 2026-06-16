document.addEventListener("DOMContentLoaded", () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  initDarkMode();
  initRubyEditor();
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

/* ─── Piston API ─── */
const PISTON_URL = "https://emkc.org/api/v2/piston/execute";

async function executeRuby(code) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  let response;
  try {
    response = await fetch(PISTON_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: "ruby",
        version: "3.0.0",
        files: [{ name: "main.rb", content: code }]
      }),
      signal: controller.signal
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Execution timed out while waiting for Piston API.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new Error(`Piston API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return {
    stdout: data.run?.stdout || "",
    stderr: data.run?.stderr || "",
    code:   data.run?.code ?? 0
  };
}

/* ─── Examples ─── */
const RUBY_EXAMPLES = {
  hello: `# Hello World in Ruby
puts "Hello, World!"
puts "Welcome to Ruby Editor!"
puts "Ruby version: #{RUBY_VERSION rescue '3.0.0'}"`,

  variables: `# Variables & Types
name    = "Lakshay"
age     = 21
score   = 98.5
is_ready = true

puts "Name: #{name}"
puts "Age: #{age}"
puts "Score: #{score}"
puts "Ready: #{is_ready}"
puts "Type of score: #{score.class}"
puts "Type of name: #{name.class}"`,

  loops: `# Loops & Iterators
puts "--- times loop ---"
5.times { |i| puts "Iteration #{i}" }

puts "\\n--- upto loop ---"
1.upto(5) { |n| puts "Count: #{n}" }

puts "\\n--- each on array ---"
fruits = ["apple", "banana", "cherry"]
fruits.each_with_index do |fruit, i|
  puts "#{i}: #{fruit}"
end

puts "\\n--- map ---"
squares = (1..5).map { |n| n ** 2 }
puts "Squares: #{squares.inspect}"`,

  methods: `# Methods in Ruby
def greet(name, greeting = "Hello")
  "#{greeting}, #{name}!"
end

def factorial(n)
  return 1 if n <= 1
  n * factorial(n - 1)
end

def fibonacci(n)
  return n if n <= 1
  fibonacci(n - 1) + fibonacci(n - 2)
end

puts greet("Lakshay")
puts greet("World", "Hey")
puts "\\nfactorial(5)  = #{factorial(5)}"
puts "factorial(10) = #{factorial(10)}"
puts "\\nfib(0..7): #{(0..7).map { |n| fibonacci(n) }.inspect}"`,

  class: `# Classes & OOP
class Animal
  attr_reader :name, :sound

  def initialize(name, sound)
    @name  = name
    @sound = sound
  end

  def speak
    "#{@name} says #{@sound}!"
  end
end

class Dog < Animal
  def initialize(name)
    super(name, "Woof")
  end

  def fetch(item)
    "#{@name} fetches the #{item}!"
  end
end

cat = Animal.new("Cat", "Meow")
dog = Dog.new("Rex")

puts cat.speak
puts dog.speak
puts dog.fetch("ball")
puts "\\nDog is an Animal? #{dog.is_a?(Animal)}"
puts "Dog class: #{dog.class}"`,

  strings: `# String Manipulation
str = "Hello, Ruby World!"

puts str.upcase
puts str.downcase
puts str.reverse
puts str.length
puts str.include?("Ruby")
puts str.gsub("Ruby", "Algo Infinity")
puts str.split(", ").inspect
puts str[0..4]

words = ["one", "two", "three"]
puts words.join(" - ")
puts "  spaces  ".strip
puts "ha" * 3`
};

/* ─── Init Editor ─── */
function initRubyEditor() {
  const editor      = document.getElementById("reEditor");
  if (!editor) return;

  const outputBody    = document.getElementById("reOutputBody");
  const consoleBody   = document.getElementById("reConsoleBody");
  const runBtn        = document.getElementById("reRunBtn");
  const resetBtn      = document.getElementById("reResetBtn");
  const copyBtn       = document.getElementById("reCopyBtn");
  const saveBtn       = document.getElementById("reSaveBtn");
  const exampleSelect = document.getElementById("reExampleSelect");
  const lineNumbers   = document.getElementById("reLineNumbers");
  const statusBadge   = document.getElementById("reStatusBadge");
  const consoleClear  = document.getElementById("reConsoleClear");
  const autoRunToggle = document.getElementById("reAutoRun");

  const SAVE_KEY = "ruby-editor-draft";
  let autoRunTimer = null;
  let isRunning = false;

  // Load saved draft or default
  const saved = localStorage.getItem(SAVE_KEY);
  editor.value = (saved && saved.trim().length > 0) ? saved : RUBY_EXAMPLES.hello;
  updateLines();

  // Example select
  exampleSelect.addEventListener("change", () => {
    editor.value = RUBY_EXAMPLES[exampleSelect.value];
    updateLines();
  });

  // Run button
  runBtn.addEventListener("click", runCode);

  // Reset
  resetBtn.addEventListener("click", () => {
    editor.value = RUBY_EXAMPLES[exampleSelect.value];
    updateLines();
  });

  // Copy
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(editor.value);
      copyBtn.innerHTML = '<i class="fas fa-check"></i>';
      setTimeout(() => { copyBtn.innerHTML = '<i class="fas fa-copy"></i>'; }, 2000);
    } catch {
      logError("Could not copy to clipboard.");
    }
  });

  // Save
  saveBtn.addEventListener("click", () => {
    localStorage.setItem(SAVE_KEY, editor.value);
    saveBtn.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => { saveBtn.innerHTML = '<i class="fas fa-save"></i>'; }, 2000);
  });

  // Editor input
  editor.addEventListener("input", () => {
    updateLines();
    localStorage.setItem(SAVE_KEY, editor.value);
    if (autoRunToggle.checked) {
      clearTimeout(autoRunTimer);
      autoRunTimer = setTimeout(runCode, 1000);
    }
  });

  editor.addEventListener("scroll", () => { lineNumbers.scrollTop = editor.scrollTop; });

  // Keyboard shortcuts
  editor.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const s = editor.selectionStart;
      editor.value = editor.value.substring(0, s) + "  " + editor.value.substring(editor.selectionEnd);
      editor.selectionStart = editor.selectionEnd = s + 2;
      updateLines();
    }
    if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); runCode(); }
    if (e.ctrlKey && e.key === "s") { e.preventDefault(); localStorage.setItem(SAVE_KEY, editor.value); }
  });

  // Console clear
  consoleClear.addEventListener("click", () => {
    consoleBody.innerHTML = '<span class="re-console-placeholder">No errors detected.</span>';
  });

  /* ── Run Code ── */
  async function runCode() {
    if (isRunning) return;
    const code = editor.value;
    if (!code.trim()) return;

    isRunning = true;
    runBtn.disabled = true;
    setStatus("running");

    outputBody.innerHTML = '<span class="re-output-running"><i class="fas fa-spinner fa-spin"></i> Executing via Piston API...</span>';
    consoleBody.innerHTML = '<span class="re-console-placeholder">No errors detected.</span>';

    try {
      const { stdout, stderr, code: exitCode } = await executeRuby(code);

      // Show stdout
      if (stdout.trim()) {
        outputBody.textContent = stdout;
      } else {
        outputBody.innerHTML = '<span class="re-output-placeholder">No output produced.</span>';
      }

      // Show stderr / exit status
      const hasStderr = stderr.trim().length > 0;
      if (hasStderr) {
        consoleBody.innerHTML = "";
        stderr.trim().split("\n").forEach((line) => logError(line));
      }
      if (exitCode !== 0 && !hasStderr) {
        logError(`Process exited with code ${exitCode}.`);
      }
      setStatus(exitCode === 0 && !hasStderr ? "ready" : "error");

    } catch (err) {
      outputBody.innerHTML = '<span class="re-output-placeholder">Could not reach Piston API. Check your connection.</span>';
      logError(`API Error: ${err.message}`);
      setStatus("api");
    } finally {
      isRunning = false;
      runBtn.disabled = false;
    }
  }

  function logError(msg) {
    const placeholder = consoleBody.querySelector(".re-console-placeholder");
    if (placeholder) placeholder.remove();
    const el = document.createElement("span");
    el.className = "re-console-line";
    el.textContent = msg;
    consoleBody.appendChild(el);
  }

  function setStatus(state) {
    const map = {
      ready:   ["Ready",   "re-status-ready"],
      running: ["Running", "re-status-running"],
      error:   ["Error",   "re-status-error"],
      api:     ["API Error", "re-status-api"]
    };
    const [text, cls] = map[state] || map.ready;
    statusBadge.textContent = text;
    statusBadge.className = `re-status-badge ${cls}`;
  }

  function updateLines() {
    const count = editor.value.split("\n").length;
    lineNumbers.textContent = Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1).join("\n");
  }
}