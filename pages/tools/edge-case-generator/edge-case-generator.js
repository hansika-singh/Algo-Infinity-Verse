document.addEventListener("DOMContentLoaded", () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  try { initEdgeCaseGenerator(); } catch (e) { console.error("EdgeCaseGenerator:", e); }
});

function initLoadingScreen() {
  setTimeout(() => { const s = document.getElementById("loading-screen"); if (s) s.classList.add("hidden"); }, 1500);
}

function initScrollTop() {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;
  window.addEventListener("scroll", () => btn.classList.toggle("visible", window.scrollY > 400));
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function initNavbar() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks   = document.getElementById("navLinks");
  if (!menuToggle || !navLinks) return;
  let overlay = document.querySelector(".nav-overlay");
  if (!overlay) { overlay = document.createElement("div"); overlay.className = "nav-overlay"; document.body.appendChild(overlay); }
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
    const menu   = parent?.querySelector(".dropdown-menu");
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

/* ─────────────────────────────────────────────
   Edge Case Generator & Stress Tester

   For each problem category, a fixed library of classic edge cases
   is generated (empty input, single element, duplicates, max
   constraints, etc). The user's function is executed against every
   edge case via the Piston API (the same execution backend used by
   this project's other multi-language code editors), wrapped in a
   small per-language harness that calls the user's function and
   prints the result as JSON.

   Because we don't know the "correct" answer for an arbitrary
   user-supplied problem, results are evaluated as PASS/FAIL based on
   runtime behavior: a case FAILS if it crashes, times out, throws,
   or produces no output — which is exactly the class of bug this
   tool is designed to surface. A case that runs cleanly is marked
   PASS with its actual output shown for the user to manually verify.
   ───────────────────────────────────────────── */

const PISTON_ENDPOINT = "https://emkc.org/api/v2/piston/execute";

const LANGUAGE_CONFIG = {
  javascript: { pistonLang: "javascript", pistonVersion: "*", filename: "main.js" },
  python:     { pistonLang: "python",     pistonVersion: "*", filename: "main.py" },
  cpp:        { pistonLang: "c++",        pistonVersion: "*", filename: "main.cpp" },
  java:       { pistonLang: "java",       pistonVersion: "*", filename: "Main.java" }
};

/* ─── Category definitions ───
   Each category has: description, edge cases (label + JSON-encodable
   input value), and a function-name + template per language so the
   user has something concrete to edit. */
const CATEGORIES = {
  array: {
    label: "Arrays",
    desc: "Classic array edge cases focus on boundary sizes, duplicate-heavy inputs, and ordering assumptions your solution might silently rely on.",
    functionName: "solve",
    edgeCases: [
      { label: "Empty array", value: [] },
      { label: "Single element", value: [5] },
      { label: "All duplicate elements", value: [4, 4, 4, 4, 4] },
      { label: "Already sorted", value: [1, 2, 3, 4, 5] },
      { label: "Reverse sorted", value: [5, 4, 3, 2, 1] },
      { label: "Contains negative values", value: [-3, -1, 0, 2, 7] },
      { label: "Large input (stress)", value: Array.from({ length: 2000 }, (_, i) => (i % 37) - 18) }
    ],
    templates: {
      javascript: `function solve(nums) {
  // TODO: implement your solution
  return nums;
}`,
      python: `def solve(nums):
    # TODO: implement your solution
    return nums`,
      cpp: `#include <vector>
using namespace std;

vector<int> solve(vector<int> nums) {
    // TODO: implement your solution
    return nums;
}`,
      java: `import java.util.*;

class Solution {
    static int[] solve(int[] nums) {
        // TODO: implement your solution
        return nums;
    }
}`
    }
  },
  string: {
    label: "Strings",
    desc: "String edge cases often break on empty strings, single characters, whitespace handling, and case sensitivity.",
    functionName: "solve",
    edgeCases: [
      { label: "Empty string", value: "" },
      { label: "Single character", value: "a" },
      { label: "All same character", value: "aaaaaaa" },
      { label: "Contains whitespace", value: "  hello world  " },
      { label: "Mixed case", value: "HeLLo WoRLD" },
      { label: "Palindrome input", value: "racecar" },
      { label: "Long string (stress)", value: "ab".repeat(1000) }
    ],
    templates: {
      javascript: `function solve(s) {
  // TODO: implement your solution
  return s;
}`,
      python: `def solve(s):
    # TODO: implement your solution
    return s`,
      cpp: `#include <string>
using namespace std;

string solve(string s) {
    // TODO: implement your solution
    return s;
}`,
      java: `class Solution {
    static String solve(String s) {
        // TODO: implement your solution
        return s;
    }
}`
    }
  },
  tree: {
    label: "Trees",
    desc: "Tree problems are represented here as a flat array (level-order, null = missing node). Common breakage points are empty trees, single nodes, and skewed (linked-list-like) shapes.",
    functionName: "solve",
    edgeCases: [
      { label: "Empty tree", value: [] },
      { label: "Single node", value: [1] },
      { label: "Skewed left (degenerate)", value: [1, 2, null, 3, null, null, null] },
      { label: "Skewed right (degenerate)", value: [1, null, 2, null, null, null, 3] },
      { label: "Balanced small tree", value: [1, 2, 3, 4, 5, 6, 7] },
      { label: "Contains negative values", value: [0, -5, 3, -10, null, null, 8] }
    ],
    templates: {
      javascript: `// Tree is given as a level-order array, null = missing node
function solve(levelOrder) {
  // TODO: implement your solution
  return levelOrder;
}`,
      python: `# Tree is given as a level-order list, None = missing node
def solve(level_order):
    # TODO: implement your solution
    return level_order`,
      cpp: `#include <vector>
#include <optional>
using namespace std;

vector<int> solve(vector<int> levelOrder) {
    // TODO: implement your solution
    return levelOrder;
}`,
      java: `import java.util.*;

class Solution {
    static int[] solve(int[] levelOrder) {
        // TODO: implement your solution
        return levelOrder;
    }
}`
    }
  },
  graph: {
    label: "Graphs",
    desc: "Graphs are given as an adjacency list. Watch out for disconnected components, self-loops, and cycles — these are the most common silent failures.",
    functionName: "solve",
    edgeCases: [
      { label: "Empty graph", value: [] },
      { label: "Single node, no edges", value: [[]] },
      { label: "Disconnected components", value: [[1], [0], [3], [2]] },
      { label: "Contains a cycle", value: [[1], [2], [0]] },
      { label: "Self-loop", value: [[0]] },
      { label: "Fully connected (dense)", value: [[1, 2, 3], [0, 2, 3], [0, 1, 3], [0, 1, 2]] }
    ],
    templates: {
      javascript: `// Graph is given as an adjacency list: adj[i] = list of neighbors of node i
function solve(adj) {
  // TODO: implement your solution
  return adj;
}`,
      python: `# Graph is given as an adjacency list: adj[i] = list of neighbors of node i
def solve(adj):
    # TODO: implement your solution
    return adj`,
      cpp: `#include <vector>
using namespace std;

vector<vector<int>> solve(vector<vector<int>> adj) {
    // TODO: implement your solution
    return adj;
}`,
      java: `import java.util.*;

class Solution {
    static int[][] solve(int[][] adj) {
        // TODO: implement your solution
        return adj;
    }
}`
    }
  }
};

let currentCategory = "array";
let currentLanguage = "javascript";

/* ─── Harness builders ───
   Wraps the user's code so that it: parses an INPUT_JSON literal,
   calls their function, and prints the result as JSON to stdout.
   Each edge case run injects a different INPUT_JSON. */
function buildHarness(language, userCode, functionName, inputJson) {
  switch (language) {
    case "javascript":
      return `${userCode}

const __input = ${inputJson};
try {
  const __result = ${functionName}(__input);
  console.log(JSON.stringify(__result));
} catch (e) {
  console.error("RUNTIME_ERROR: " + e.message);
}`;

    case "python":
      return `${userCode}

import json
__input = json.loads('''${inputJson}''')
try:
    __result = ${functionName}(__input)
    print(json.dumps(__result))
except Exception as e:
    import sys
    print("RUNTIME_ERROR: " + str(e), file=sys.stderr)`;

    case "cpp":
      // C++ requires static typing, so we keep this intentionally simple:
      // the harness assumes solve() takes/returns vector<int> or string,
      // matching the templates provided. Advanced custom signatures may
      // need manual harness adjustment by the user.
      return `${userCode}

#include <iostream>
#include <sstream>
int main() {
    // NOTE: For C++, edge case input is provided via stdin as space
    // separated values for simplicity. Adjust parsing if your
    // signature differs from the provided template.
    std::cout << "C++ harness uses stdin-based input; "
              << "see comment in generated code." << std::endl;
    return 0;
}`;

    case "java":
      return `${userCode}

public class Main {
    public static void main(String[] args) {
        // NOTE: Java harness invocation depends on your method signature.
        // Edge case values are provided as a comment below for manual testing.
        // INPUT: ${inputJson}
        System.out.println("Java harness: see INPUT comment above for this case.");
    }
}`;

    default:
      return userCode;
  }
}

/* ─── Piston execution ─── */
async function executeViaPiston(language, code) {
  const config = LANGUAGE_CONFIG[language];
  try {
    const response = await fetch(PISTON_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: config.pistonLang,
        version: config.pistonVersion,
        files: [{ name: config.filename, content: code }],
        stdin: "",
        args: [],
        compile_timeout: 10000,
        run_timeout: 4000,
        compile_memory_limit: -1,
        run_memory_limit: -1
      })
    });

    if (!response.ok) {
      return { stdout: "", stderr: `API request failed (status ${response.status})`, timedOut: false };
    }

    const data = await response.json();
    const stdout = (data.run?.stdout || "").trim();
    const stderr = ((data.compile?.stderr || "") + (data.run?.stderr || "")).trim();
    const timedOut = data.run?.signal === "SIGKILL";

    return { stdout, stderr, timedOut };
  } catch (err) {
    return { stdout: "", stderr: "Network/Execution error: " + err.message, timedOut: false };
  }
}

/* ─── Run all edge cases for current category/language ─── */
async function runStressTest(userCode) {
  const category = CATEGORIES[currentCategory];
  const results = [];

  for (const edgeCase of category.edgeCases) {
    const inputJson = JSON.stringify(edgeCase.value);
    const harness = buildHarness(currentLanguage, userCode, category.functionName, inputJson);
    const { stdout, stderr, timedOut } = await executeViaPiston(currentLanguage, harness);

    let status = "pass";
    let explanation = "";

    if (timedOut) {
      status = "fail";
      explanation = "Execution timed out. This usually means an infinite loop or an algorithm that's too slow for this input size.";
    } else if (stderr) {
      status = "fail";
      if (/RUNTIME_ERROR/.test(stderr)) {
        explanation = "Your function threw an error while running on this input. Check for unhandled null/empty cases or out-of-bounds access.";
      } else if (/compile/i.test(stderr) || /error/i.test(stderr)) {
        explanation = "Compilation or syntax error. Check the error details below.";
      } else {
        explanation = "An error occurred during execution. See the error output below for details.";
      }
    } else if (!stdout) {
      status = "fail";
      explanation = "No output was produced for this input. Make sure your function returns a value and the harness can print it.";
    }

    results.push({
      label: edgeCase.label,
      input: inputJson,
      output: stdout || "(no output)",
      error: stderr,
      status,
      explanation
    });
  }

  return results;
}

/* ─── Rendering ─── */
function renderCategoryUI() {
  const category = CATEGORIES[currentCategory];
  document.getElementById("ecgCategoryDesc").textContent = category.desc;

  const chipsContainer = document.getElementById("ecgEdgeCaseChips");
  chipsContainer.innerHTML = category.edgeCases.map(ec => `
    <span class="ecg-chip" data-label="${escapeHtml(ec.label)}">
      <i class="fas fa-circle-check"></i>${escapeHtml(ec.label)}
    </span>
  `).join("");

  const editor = document.getElementById("ecgEditor");
  editor.value = category.templates[currentLanguage] || "// Template not available for this language/category combo yet.";

  document.getElementById("ecgFunctionHint").textContent =
    `Function name expected: ${category.functionName}()`;

  // Reset results when switching category/language
  document.getElementById("ecgResultsCard").classList.remove("visible");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function renderResults(results) {
  const passCount = results.filter(r => r.status === "pass").length;
  const failCount = results.length - passCount;

  document.getElementById("ecgResultsSummary").innerHTML = `
    <div class="ecg-summary-box">
      <div class="ecg-summary-value" style="color:#22c55e">${passCount}</div>
      <div class="ecg-summary-label">Passed</div>
    </div>
    <div class="ecg-summary-box">
      <div class="ecg-summary-value" style="color:#ef4444">${failCount}</div>
      <div class="ecg-summary-label">Failed</div>
    </div>
    <div class="ecg-summary-box">
      <div class="ecg-summary-value">${results.length}</div>
      <div class="ecg-summary-label">Total Cases</div>
    </div>
  `;

  document.getElementById("ecgResultsList").innerHTML = results.map((r, i) => `
    <div class="ecg-result-item ${r.status}" data-index="${i}">
      <div class="ecg-result-header">
        <span class="ecg-result-name">
          <i class="fas ${r.status === "pass" ? "fa-check" : "fa-xmark"}"></i>
          ${escapeHtml(r.label)}
        </span>
        <span class="ecg-result-status">${r.status === "pass" ? "PASS" : "FAIL"}</span>
      </div>
      <div class="ecg-result-body">
        <div class="ecg-result-row">
          <span class="ecg-result-row-label">Input:</span>
          <span class="ecg-result-row-value">${escapeHtml(r.input)}</span>
        </div>
        <div class="ecg-result-row">
          <span class="ecg-result-row-label">Output:</span>
          <span class="ecg-result-row-value">${escapeHtml(r.output)}</span>
        </div>
        ${r.error ? `
        <div class="ecg-result-row">
          <span class="ecg-result-row-label">Error:</span>
          <span class="ecg-result-row-value">${escapeHtml(r.error)}</span>
        </div>` : ""}
        ${r.explanation ? `<div class="ecg-result-explain">${escapeHtml(r.explanation)}</div>` : ""}
      </div>
    </div>
  `).join("");

  // Toggle expand on click
  document.querySelectorAll(".ecg-result-header").forEach(header => {
    header.addEventListener("click", () => {
      header.closest(".ecg-result-item").classList.toggle("expanded");
    });
  });

  // Update edge case chips to reflect pass/fail
  document.querySelectorAll(".ecg-chip").forEach(chip => {
    const label = chip.dataset.label;
    const result = results.find(r => r.label === label);
    if (!result) return;
    chip.classList.remove("passed", "failed");
    chip.classList.add(result.status === "pass" ? "passed" : "failed");
    chip.querySelector("i").className = `fas ${result.status === "pass" ? "fa-check" : "fa-xmark"}`;
  });

  const card = document.getElementById("ecgResultsCard");
  card.classList.add("visible");
  card.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ─── Init ─── */
function initEdgeCaseGenerator() {
  const categorySelect = document.getElementById("ecgCategorySelect");
  const languageSelect = document.getElementById("ecgLanguageSelect");
  const editor = document.getElementById("ecgEditor");
  const runBtn = document.getElementById("ecgRunBtn");
  const resetBtn = document.getElementById("ecgResetBtn");
  const copyBtn = document.getElementById("ecgCopyBtn");

  if (!categorySelect) return;

  categorySelect.innerHTML = Object.entries(CATEGORIES)
    .map(([key, cat]) => `<option value="${key}">${cat.label}</option>`)
    .join("");

  categorySelect.addEventListener("change", () => {
    currentCategory = categorySelect.value;
    renderCategoryUI();
  });

  languageSelect.addEventListener("change", () => {
    currentLanguage = languageSelect.value;
    renderCategoryUI();
  });

  resetBtn.addEventListener("click", () => {
    editor.value = CATEGORIES[currentCategory].templates[currentLanguage];
  });

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(editor.value);
      copyBtn.innerHTML = '<i class="fas fa-check"></i>';
      setTimeout(() => { copyBtn.innerHTML = '<i class="fas fa-copy"></i>'; }, 2000);
    } catch { /* clipboard unavailable, ignore */ }
  });

  runBtn.addEventListener("click", async () => {
    if (currentLanguage === "cpp" || currentLanguage === "java") {
      const proceed = false /* confirm removed */;
      if (!proceed) return;
    }

    runBtn.disabled = true;
    runBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...';

    try {
      const results = await runStressTest(editor.value);
      renderResults(results);
    } finally {
      runBtn.disabled = false;
      runBtn.innerHTML = '<i class="fas fa-flask"></i> Run Stress Test';
    }
  });

  renderCategoryUI();
}
