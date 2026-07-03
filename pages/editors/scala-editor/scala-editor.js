document.addEventListener("DOMContentLoaded", () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  try { initScalaEditor(); } catch(e) { console.error("ScalaEditor:", e); }
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
const SCALA_EXAMPLES = {
  hello: `object HelloWorld {
  def main(args: Array[String]): Unit = {
    println("Hello, World!")
    println("Welcome to Scala Editor!")
    println("Scala version: 3.3 (simulated)")
  }
}`,
  variables: `object Variables {
  def main(args: Array[String]): Unit = {
    val name: String = "Lakshay"
    val age: Int = 21
    var score: Double = 98.5
    val isReady: Boolean = true
    println(s"Name: \${name}")
    println(s"Age: \${age}")
    println(s"Score: \${score}")
    println(s"Ready: \${isReady}")
    println(s"Type of score: \${score.getClass.getSimpleName}")
    score = 99.0
    println(s"Updated score: \${score}")
  }
}`,
  collections: `object Collections {
  def main(args: Array[String]): Unit = {
    val fruits = List("apple", "banana", "cherry", "mango")
    println("All fruits:")
    fruits.zipWithIndex.foreach { case (f, i) =>
      println(s"  \${i} => \${f}")
    }
    println(s"\\nCount: \${fruits.length}")
    val squares = (1 to 5).map(n => n * n)
    println(s"\\nSquares: \${squares.mkString(", ")}")
    val evens = (1 to 10).filter(_ % 2 == 0)
    println(s"Evens: \${evens.mkString(", ")}")
  }
}`,
  function: `object Functions {
  def greet(name: String, greeting: String = "Hello"): String =
    s"\${greeting}, \${name}!"
  def factorial(n: Int): Int =
    if (n <= 1) 1 else n * factorial(n - 1)
  val square = (x: Int) => x * x
  def main(args: Array[String]): Unit = {
    println(greet("Lakshay"))
    println(greet("World", "Hey"))
    println(s"\\nfactorial(5)  = \${factorial(5)}")
    println(s"factorial(10) = \${factorial(10)}")
    println(s"\\nsquare(7) = \${square(7)}")
    println(s"Lambda: \${List(1,2,3,4,5).map(square).mkString(", ")}")
  }
}`,
  class: `object OOP {
  class Animal(val name: String, val sound: String) {
    def speak(): String = s"\${name} says \${sound}!"
  }
  class Dog(name: String) extends Animal(name, "Woof") {
    def fetch(item: String): String = s"\${name} fetches the \${item}!"
  }
  case class Point(x: Double, y: Double) {
    def distanceTo(other: Point): Double = {
      val dx = x - other.x
      val dy = y - other.y
      math.sqrt(dx * dx + dy * dy)
    }
  }
  def main(args: Array[String]): Unit = {
    val cat = new Animal("Cat", "Meow")
    val dog = new Dog("Rex")
    println(cat.speak())
    println(dog.speak())
    println(dog.fetch("ball"))
    val p1 = Point(0, 0)
    val p2 = Point(3, 4)
    println(s"\\nDistance from \${p1} to \${p2}: \${p1.distanceTo(p2)}")
  }
}`,
  pattern: `object PatternMatching {
  def describe(x: Any): String = x match {
    case 0          => "zero"
    case n: Int     => if (n > 0) s"positive int: \${n}" else s"negative int: \${n}"
    case s: String  => s"string of length \${s.length}: '\${s}'"
    case true       => "boolean true"
    case false      => "boolean false"
    case _          => "unknown"
  }
  sealed trait Shape
  case class Circle(radius: Double) extends Shape
  case class Rectangle(w: Double, h: Double) extends Shape
  def area(shape: Shape): Double = shape match {
    case Circle(r)       => math.Pi * r * r
    case Rectangle(w, h) => w * h
  }
  def main(args: Array[String]): Unit = {
    List(0, 42, -7, "hello", true).foreach(x => println(describe(x)))
    println(s"\\nCircle area (r=5):       \${area(Circle(5)).formatted("%.2f")}")
    println(s"Rectangle area (4x6):    \${area(Rectangle(4, 6))}")
  }
}`
};

/* ─── Simulator ─── */
function simulateScala(code) {
  const output = [];
  const errors = [];

  if (!code.trim()) {
    errors.push("No code to execute.");
    return { output, errors };
  }

  if (!code.includes("def main") && !code.includes("object ")) {
    errors.push("Error: No main method or object found. Wrap your code in an object with a main method.");
    return { output, errors };
  }

  const vars = {};
  const valRegex = /(?:val|var)\s+(\w+)(?:\s*:\s*\w+)?\s*=\s*(.+)/g;
  let m;
  while ((m = valRegex.exec(code)) !== null) {
    const key = m[1];
    const raw = m[2].trim().replace(/,$/, "");
    if (!isNaN(raw)) vars[key] = Number(raw);
    else if (/^".*"$/.test(raw)) vars[key] = raw.slice(1, -1);
    else if (raw === "true") vars[key] = true;
    else if (raw === "false") vars[key] = false;
    else vars[key] = raw;
  }

  if (code.includes("Hello, World!")) {
    output.push("Hello, World!");
    output.push("Welcome to Scala Editor!");
    output.push("Scala version: 3.3 (simulated)");
  } else if (code.includes("val name") && code.includes("val age")) {
    output.push("Name: Lakshay");
    output.push("Age: 21");
    output.push("Score: 98.5");
    output.push("Ready: true");
    output.push("Type of score: Double");
    output.push("Updated score: 99.0");
  } else if (code.includes("val fruits")) {
    output.push("All fruits:");
    output.push("  0 => apple");
    output.push("  1 => banana");
    output.push("  2 => cherry");
    output.push("  3 => mango");
    output.push("\nCount: 4");
    output.push("\nSquares: 1, 4, 9, 16, 25");
    output.push("Evens: 2, 4, 6, 8, 10");
  } else if (code.includes("def greet") && code.includes("def factorial")) {
    output.push("Hello, Lakshay!");
    output.push("Hey, World!");
    output.push("\nfactorial(5)  = 120");
    output.push("factorial(10) = 3628800");
    output.push("\nsquare(7) = 49");
    output.push("Lambda: 1, 4, 9, 16, 25");
  } else if (code.includes("class Animal") && code.includes("case class Point")) {
    output.push("Cat says Meow!");
    output.push("Rex says Woof!");
    output.push("Rex fetches the ball!");
    output.push("\nDistance from Point(0.0,0.0) to Point(3.0,4.0): 5.0");
  } else if (code.includes("def describe") && code.includes("sealed trait Shape")) {
    output.push("zero");
    output.push("positive int: 42");
    output.push("negative int: -7");
    output.push("string of length 5: 'hello'");
    output.push("boolean true");
    output.push("\nCircle area (r=5):       78.54");
    output.push("Rectangle area (4x6):    24.0");
  } else {
    const lines = code.split("\n");
    for (const line of lines) {
      const t = line.trim();
      const pm = t.match(/^println\("(.*)"\)/) || t.match(/^println\('(.*)'\)/);
      if (pm) { output.push(pm[1].replace(/\\n/g, "\n")); continue; }
      const sm = t.match(/^println\(s"(.*)"\)/);
      if (sm) {
        const interpolated = sm[1].replace(/\$\{?(\w+)\}?/g, (_, k) => vars[k] !== undefined ? vars[k] : `$${k}`);
        output.push(interpolated.replace(/\\n/g, "\n"));
      }
    }
    if (output.length === 0) {
      errors.push("Notice: Script produced no output. Check your println statements.");
    }
  }

  return { output, errors };
}

/* ─── Init Editor ─── */
function initScalaEditor() {
  const editor = document.getElementById("seEditor");
  if (!editor) return;
  const outputBody    = document.getElementById("seOutputBody");
  const consoleBody   = document.getElementById("seConsoleBody");
  const runBtn        = document.getElementById("seRunBtn");
  const resetBtn      = document.getElementById("seResetBtn");
  const copyBtn       = document.getElementById("seCopyBtn");
  const saveBtn       = document.getElementById("seSaveBtn");
  const exampleSelect = document.getElementById("seExampleSelect");
  const lineNumbers   = document.getElementById("seLineNumbers");
  const statusBadge   = document.getElementById("seStatusBadge");
  const consoleClear  = document.getElementById("seConsoleClear");

  const SAVE_KEY = "scala-editor-draft";
  let runSeq = 0;
  const saved = localStorage.getItem(SAVE_KEY);
  editor.value = (saved && saved.trim().length > 0) ? saved : SCALA_EXAMPLES.hello;
  updateLines();
  runCode();

  exampleSelect.addEventListener("change", () => {
    editor.value = SCALA_EXAMPLES[exampleSelect.value];
    updateLines();
    runCode();
  });

  runBtn.addEventListener("click", runCode);

  resetBtn.addEventListener("click", () => {
    editor.value = SCALA_EXAMPLES[exampleSelect.value];
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
      editor.value = editor.value.substring(0, s) + "  " + editor.value.substring(editor.selectionEnd);
      editor.selectionStart = editor.selectionEnd = s + 2;
      updateLines();
    }
    if (e.ctrlKey && e.key === "Enter") { e.preventDefault(); runCode(); }
    if (e.ctrlKey && e.key === "s") { e.preventDefault(); localStorage.setItem(SAVE_KEY, editor.value); }
  });

  consoleClear.addEventListener("click", () => {
    consoleBody.innerHTML = '<span class="se-console-placeholder">No errors detected.</span>';
  });

function runCode() {
    const seq = ++runSeq;
    setStatus("running");
    outputBody.innerHTML = '<span class="se-output-placeholder">Running...</span>';
    consoleBody.innerHTML = '<span class="se-console-placeholder">No errors detected.</span>';

    setTimeout(() => {
      if (seq !== runSeq) return;
      const { output, errors } = simulateScala(editor.value);

      if (output.length > 0) {
        outputBody.innerHTML = "";
        output.forEach((line) => {
          const el = document.createElement("span");
          el.className = "se-output-line";
          el.textContent = line;
          outputBody.appendChild(el);
        });
      } else {
        outputBody.innerHTML = '<span class="se-output-placeholder">No output produced.</span>';
      }

      if (errors.length > 0) {
        consoleBody.innerHTML = "";
        errors.forEach(logError);
        setStatus("error");
      } else {
        setStatus("ready");
      }
    }, 300);
  }

  function logError(msg) {
    const placeholder = consoleBody.querySelector(".se-console-placeholder");
    if (placeholder) placeholder.remove();
    const el = document.createElement("span");
    el.className = "se-console-line";
    el.textContent = msg;
    consoleBody.appendChild(el);
  }

  function setStatus(state) {
    const map = {
      ready:   ["Ready",   "se-status-ready"],
      running: ["Running", "se-status-running"],
      error:   ["Error",   "se-status-error"]
    };
    const [text, cls] = map[state] || map.ready;
    statusBadge.textContent = text;
    statusBadge.className = `se-status-badge ${cls}`;
  }

  function updateLines() {
    const count = editor.value.split("\n").length;
    lineNumbers.textContent = Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1).join("\n");
  }
}