document.addEventListener("DOMContentLoaded", () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  try {
    initThinkAloudJudge();
  } catch (e) {
    console.error("ThinkAloudJudge:", e);
  }
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
}

/* ─── Coding Templates ─── */
const PROBLEM_DATA = {
  twosum: {
    title: "Two Sum",
    desc: `<h4>Two Sum</h4>
           <p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.</p>
           <ul>
             <li>Assume exactly one solution exists.</li>
             <li>You may not use the same element twice.</li>
             <li>Optimize for O(N) time complexity using extra space rather than a brute-force O(N²).</li>
           </ul>`,
    templates: {
      python: `# Problem: Two Sum
# Step 1: Clarify assumptions (e.g. negative inputs? duplicates?)
# Step 2: Select optimal approach (hashing vs double loop)

def twoSum(nums, target):
    # TODO: Add validations and lookup map here
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []

# Test execution:
print(twoSum([2, 7, 11, 15], 9))`,

      javascript: `// Problem: Two Sum
// Step 1: Clarify assumptions (e.g. negative inputs? duplicates?)
// Step 2: Select optimal approach (hashing vs double loop)

function twoSum(nums, target) {
    // TODO: Add validations and lookup map here
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (seen.has(diff)) {
            return [seen.get(diff), i];
        }
        seen.set(nums[i], i);
    }
    return [];
}

// Test execution:
console.log(twoSum([3, 2, 4], 6));`,

      cpp: `// Problem: Two Sum
// Step 1: Clarify assumptions (e.g. negative inputs? duplicates?)
// Step 2: Select optimal approach (hashing vs double loop)
#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); ++i) {
            int diff = target - nums[i];
            if (seen.count(diff)) {
                return {seen[diff], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};

int main() {
    Solution s;
    vector<int> nums = {2, 7, 11, 15};
    vector<int> res = s.twoSum(nums, 9);
    if (res.size() == 2) {
        cout << "[" << res[0] << ", " << res[1] << "]" << endl;
    }
    return 0;
}`,

      java: `// Problem: Two Sum
// Step 1: Clarify assumptions (e.g. negative inputs? duplicates?)
// Step 2: Select optimal approach (hashing vs double loop)
import java.util.HashMap;
import java.util.Arrays;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        HashMap<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int diff = target - nums[i];
            if (seen.containsKey(diff)) {
                return new int[] { seen.get(diff), i };
            }
            seen.put(nums[i], i);
        }
        return new int[0];
    }
}

public class Main {
    public static void main(String[] args) {
        Solution s = new Solution();
        int[] res = s.twoSum(new int[]{3, 3}, 6);
        System.out.println(Arrays.toString(res));
    }
}`
    }
  },

  reverselist: {
    title: "Reverse a Linked List",
    desc: `<h4>Reverse a Linked List</h4>
           <p>Given the head of a singly linked list, reverse the list, and return the reversed list.</p>
           <ul>
             <li>Solve the problem in-place using O(1) extra space.</li>
             <li>Handle edge cases where list is empty (null head) or has only one node.</li>
           </ul>`,
    templates: {
      python: `# Problem: Reverse a Linked List
# Step 1: Check edge cases (null root, single element)
# Step 2: Set up sliding pointers (prev, curr, next)

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverseList(head):
    if not head:
        return None
    prev = None
    curr = head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev

# Create a small list 1 -> 2 -> 3
h = ListNode(1, ListNode(2, ListNode(3)))
rev = reverseList(h)
while rev:
    print(rev.val, end=" -> ")
    rev = rev.next
print("None")`,

      javascript: `// Problem: Reverse a Linked List
// Step 1: Check edge cases (null root, single element)
// Step 2: Set up sliding pointers (prev, curr, next)

class ListNode {
    constructor(val = 0, next = null) {
        this.val = val;
        this.next = next;
    }
}

function reverseList(head) {
    if (!head) return null;
    let prev = null;
    let curr = head;
    while (curr) {
        let nxt = curr.next;
        curr.next = prev;
        prev = curr;
        curr = nxt;
    }
    return prev;
}

const h = new ListNode(1, new ListNode(2, new ListNode(3)));
let rev = reverseList(h);
let out = "";
while (rev) {
    out += rev.val + " -> ";
    rev = rev.next;
}
console.log(out + "null");`,

      cpp: `// Problem: Reverse a Linked List
// Step 1: Check edge cases (null root, single element)
// Step 2: Set up sliding pointers (prev, curr, next)
#include <iostream>
using namespace std;

struct ListNode {
    int val;
    ListNode* next;
    ListNode(int x) : val(x), next(NULL) {}
};

class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        if (!head) return NULL;
        ListNode* prev = NULL;
        ListNode* curr = head;
        while (curr) {
            ListNode* nxt = curr->next;
            curr->next = prev;
            prev = curr;
            curr = nxt;
        }
        return prev;
    }
};

int main() {
    ListNode* h = new ListNode(1);
    h->next = new ListNode(2);
    Solution s;
    ListNode* rev = s.reverseList(h);
    while (rev) {
        cout << rev->val << " -> ";
        rev = rev->next;
    }
    cout << "NULL" << endl;
    return 0;
}`,

      java: `// Problem: Reverse a Linked List
// Step 1: Check edge cases (null root, single element)
// Step 2: Set up sliding pointers (prev, curr, next)
class ListNode {
    int val;
    ListNode next;
    ListNode(int x) { val = x; }
}

class Solution {
    public ListNode reverseList(ListNode head) {
        if (head == null) return null;
        ListNode prev = null;
        ListNode curr = head;
        while (curr != null) {
            ListNode nxt = curr.next;
            curr.next = prev;
            prev = curr;
            curr = nxt;
        }
        return prev;
    }
}

public class Main {
    public static void main(String[] args) {
        ListNode h = new ListNode(10);
        Solution s = new Solution();
        ListNode rev = s.reverseList(h);
        if (rev != null) {
            System.out.println(rev.val + " -> null");
        }
    }
}`
    }
  },

  fibonacci: {
    title: "Fibonacci Recursion",
    desc: `<h4>Fibonacci Recursion</h4>
           <p>Compute the N-th Fibonacci number using a recursive algorithm. Analyze stack overflow limits and optimal caching (memoization).</p>
           <ul>
             <li>Define correct base cases (N = 0 and N = 1).</li>
             <li>Analyze recursion tree depth and consider caching to improve from O(2^N) to O(N).</li>
           </ul>`,
    templates: {
      python: `# Problem: Fibonacci Recursion
# Step 1: Define base case bounds (guard against stack overflow)
# Step 2: Think about overlapping subproblems (memoization)

def fib(n, memo={}):
    if n < 0:
        return 0
    if n <= 1:
        return n
    if n in memo:
        return memo[n]
    memo[n] = fib(n - 1, memo) + fib(n - 2, memo)
    return memo[n]

# Test execution:
print(fib(10))`,

      javascript: `// Problem: Fibonacci Recursion
// Step 1: Define base case bounds (guard against stack overflow)
// Step 2: Think about overlapping subproblems (memoization)

function fib(n, memo = {}) {
    if (n < 0) return 0;
    if (n <= 1) return n;
    if (memo[n] !== undefined) return memo[n];
    memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
    return memo[n];
}

// Test execution:
console.log(fib(10));`,

      cpp: `// Problem: Fibonacci Recursion
// Step 1: Define base case bounds (guard against stack overflow)
// Step 2: Think about overlapping subproblems (memoization)
#include <iostream>
#include <unordered_map>
using namespace std;

class Solution {
public:
    int fib(int n, unordered_map<int, int>& memo) {
        if (n < 0) return 0;
        if (n <= 1) return n;
        if (memo.count(n)) return memo[n];
        memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
        return memo[n];
    }
};

int main() {
    Solution s;
    unordered_map<int, int> memo;
    cout << s.fib(10, memo) << endl;
    return 0;
}`,

      java: `// Problem: Fibonacci Recursion
// Step 1: Define base case bounds (guard against stack overflow)
// Step 2: Think about overlapping subproblems (memoization)
import java.util.HashMap;

class Solution {
    private HashMap<Integer, Integer> memo = new HashMap<>();

    public int fib(int n) {
        if (n < 0) return 0;
        if (n <= 1) return n;
        if (memo.containsKey(n)) return memo.get(n);
        int res = fib(n - 1) + fib(n - 2);
        memo.put(n, res);
        return res;
    }
}

public class Main {
    public static void main(String[] args) {
        Solution s = new Solution();
        System.out.println(s.fib(10));
    }
}`
    }
  }
};

/* ─── Piston Compiler Sandbox ─── */
const PISTON_LANG_MAP = {
  python: { language: "python", version: "3.10.0", file: "main.py" },
  javascript: { language: "javascript", version: "18.15.0", file: "main.js" },
  cpp: { language: "c++", version: "10.2.0", file: "main.cpp" },
  java: { language: "java", version: "15.0.2", file: "Main.java" }
};

async function executeCode(langKey, code) {
  const langConfig = PISTON_LANG_MAP[langKey];
  if (!langConfig) return { output: [], errors: ["Unsupported language."] };

  try {
    const response = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: langConfig.language,
        version: langConfig.version,
        files: [{ name: langConfig.file, content: code }],
        stdin: "",
        args: [],
        compile_timeout: 10000,
        run_timeout: 3000
      })
    });

    if (!response.ok) throw new Error("API server responded with error: " + response.status);
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
      output.push(...data.run.stdout.split("\n").filter(l => l.trim()));
    }

    return { output, errors };
  } catch (err) {
    return { output: [], errors: ["Execution Failed: " + err.message] };
  }
}

/* ─── Logic Analysis Engine ─── */
function analyzeReasoning(code, thoughts, problemKey, langKey) {
  const matches = (str, keywords) => keywords.some(k => str.toLowerCase().includes(k));

  // Extract comments
  const commentRegex = langKey === 'python' ? /#.*$/gm : /\/\/.*$/gm;
  const commentMatches = code.match(commentRegex) || [];
  const commentText = commentMatches.join(" ");

  const combinedTexts = (thoughts + " " + commentText).toLowerCase();
  const codeLower = code.toLowerCase();

  const findings = {
    score: 50,
    misconceptions: [],
    patterns: []
  };

  // 1. Evaluate design phases & comment logging
  const hasThoughts = thoughts.trim().length > 20;
  const hasComments = commentMatches.length >= 2;

  if (hasThoughts || hasComments) {
    findings.score += 15;
    findings.patterns.push("Structured Decomposition");
  } else {
    findings.misconceptions.push({
      title: "Brute-Force Jump (Impulsive Coder)",
      desc: "You started typing code without documenting constraints, bounds, or logical steps. Design your code structure using comments first to reduce logic bugs.",
      level: "medium"
    });
  }

  // 2. Evaluate complexity awareness
  const mentionsComplexity = matches(combinedTexts, ["o(n)", "o(1)", "o(log", "o(n²)", "complexity", "time complexity", "space complexity", "linear", "quadratic"]);
  if (mentionsComplexity) {
    findings.score += 15;
    findings.patterns.push("Complexity Awareness");
  } else {
    findings.misconceptions.push({
      title: "Unchecked Growth Rates",
      desc: "You haven't evaluated how this solution scales. Explicitly mention time and space complexities (e.g., O(N), O(1)) in your comments/thoughts.",
      level: "low"
    });
  }

  // 3. Problem-specific checks
  if (problemKey === 'twosum') {
    // Check for hashing vs brute force nested loop
    const isDoubleLoop = (codeLower.includes("for") && (codeLower.match(/for/g) || []).length >= 2) || 
                         (codeLower.includes("while") && (codeLower.match(/while/g) || []).length >= 2);
    const usesMap = matches(codeLower, ["map", "hashmap", "unordered_map", "dict", "seen", "{}"]);

    if (isDoubleLoop && !usesMap) {
      findings.misconceptions.push({
        title: "Quadratic Lookup Overkill",
        desc: "Using nested loops creates an O(N²) quadratic time complexity. Use a hash map/dictionary to record seen values, reducing the search phase to O(N) linear time.",
        level: "medium"
      });
    } else if (usesMap) {
      findings.score += 10;
      findings.patterns.push("Hash Mapping");
    }

    // Check for empty array verification
    const hasArrayChecks = matches(codeLower, ["null", "none", "length == 0", "length === 0", "size() == 0", "nums.length", "len(nums) == 0", "empty()"]);
    if (hasArrayChecks) {
      findings.score += 10;
      findings.patterns.push("Boundary Guarding");
    } else {
      findings.misconceptions.push({
        title: "Missing Empty Array Validation",
        desc: "Your code doesn't guard against empty list inputs. If the input array is null or empty, access errors might trigger. Always check bounds first.",
        level: "high"
      });
    }

  } else if (problemKey === 'reverselist') {
    // Check pointer mutations (prev, curr, next)
    const managesPointers = matches(codeLower, ["prev", "curr", "nxt", "next", "tmp", "temp", "null", "none"]);
    if (managesPointers) {
      findings.patterns.push("Pointer Sliding");
    }

    // Check head validation
    const hasNullChecks = matches(codeLower, ["null", "none", "!head", "head ===", "head ==", "head.next", "head->next"]);
    if (hasNullChecks) {
      findings.score += 10;
      findings.patterns.push("Boundary Guarding");
    } else {
      findings.misconceptions.push({
        title: "Null Pointer De-reference Risk",
        desc: "You have not checked if the list has a null head or is a single-node list. Dereferencing `head.next` on an empty head will throw a runtime exception.",
        level: "high"
      });
    }

  } else if (problemKey === 'fibonacci') {
    // Check base cases in recursive fibonacci
    const hasBaseCase = matches(codeLower, ["n <= 1", "n < 2", "n == 0", "n == 1", "n === 0", "n === 1", "n < 1"]);
    if (hasBaseCase) {
      findings.score += 10;
      findings.patterns.push("Base Case Protection");
    } else {
      findings.misconceptions.push({
        title: "Unbounded Call Stack (Infinite Recursion)",
        desc: "No base case bounds (N <= 1 or N < 2) were found. Without correct base cases, recursion executes indefinitely, causing a stack overflow crash.",
        level: "high"
      });
    }

    // Check memoization / caching
    const usesMemo = matches(codeLower, ["memo", "cache", "hashmap", "unordered_map", "dict", "{}"]);
    if (usesMemo) {
      findings.score += 10;
      findings.patterns.push("Memoization Cache");
    } else {
      findings.misconceptions.push({
        title: "Exponential Tree Recursion",
        desc: "Without memoization/caching, recursive fibonacci repeats calculations for identical subproblems, leading to O(2^N) exponential time. Add a cache table.",
        level: "medium"
      });
    }
  }

  // Deduct for misconceptions
  findings.misconceptions.forEach(m => {
    if (m.level === 'high') findings.score -= 15;
    else if (m.level === 'medium') findings.score -= 10;
    else if (m.level === 'low') findings.score -= 5;
  });

  findings.score = Math.max(30, Math.min(100, findings.score));
  return findings;
}

/* ─── Init Editor Workspace ─── */
function initThinkAloudJudge() {
  const problemSelect       = document.getElementById("problemSelect");
  const languageSelect      = document.getElementById("languageSelect");
  const problemDescription  = document.getElementById("problemDescription");
  const codeEditor          = document.getElementById("codeEditor");
  const thoughtsLog         = document.getElementById("thoughtsLog");
  const extractCommentsBtn  = document.getElementById("extractCommentsBtn");
  const runCodeBtn          = document.getElementById("runCodeBtn");
  const analyzeReasoningBtn = document.getElementById("analyzeReasoningBtn");
  const terminalOutput      = document.getElementById("terminalOutput");
  const runStatusBadge      = document.getElementById("runStatusBadge");
  const editorLineNumbers   = document.getElementById("editorLineNumbers");
  const scoreNum            = document.getElementById("scoreNum");
  const scoreCircle         = document.getElementById("scoreCircle");
  const methodologyLabel    = document.getElementById("methodologyLabel");
  const patternBadges       = document.getElementById("patternBadges");
  const misconceptionList   = document.getElementById("misconceptionList");
  const socraticFeedback    = document.getElementById("socraticFeedback");

  if (!problemSelect || !languageSelect || !codeEditor) return;

  // Track running compiler sessions
  let currentRunSeq = 0;

  function loadTemplate() {
    const pVal = problemSelect.value;
    const lVal = languageSelect.value;
    const prob = PROBLEM_DATA[pVal];
    if (!prob) return;

    problemDescription.innerHTML = prob.desc;
    codeEditor.value = prob.templates[lVal] || "";
    updateLineNumbers();
  }

  function updateLineNumbers() {
    const count = codeEditor.value.split("\n").length;
    editorLineNumbers.textContent = Array.from({ length: Math.max(count, 1) }, (_, i) => i + 1).join("\n");
  }

  // Auto-update line numbers on scrolling / input
  codeEditor.addEventListener("input", updateLineNumbers);
  codeEditor.addEventListener("scroll", () => {
    editorLineNumbers.scrollTop = codeEditor.scrollTop;
  });

  // Handle tab key indentations
  codeEditor.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = codeEditor.selectionStart;
      const end = codeEditor.selectionEnd;
      codeEditor.value = codeEditor.value.substring(0, start) + "    " + codeEditor.value.substring(end);
      codeEditor.selectionStart = codeEditor.selectionEnd = start + 4;
      updateLineNumbers();
    }
  });

  problemSelect.addEventListener("change", loadTemplate);
  languageSelect.addEventListener("change", loadTemplate);

  // Initialize workspace templates
  loadTemplate();

  // Extract comments to thinking log
  extractCommentsBtn.addEventListener("click", () => {
    const code = codeEditor.value;
    const lVal = languageSelect.value;
    const commentRegex = lVal === 'python' ? /#\s*(.*)$/gm : /\/\/\s*(.*)$/gm;
    
    let comments = [];
    let match;
    while ((match = commentRegex.exec(code)) !== null) {
      if (match[1] && match[1].trim()) {
        comments.push(match[1].trim());
      }
    }

    if (comments.length > 0) {
      thoughtsLog.value = comments.map((c, i) => `Step ${i + 1}: ${c}`).join("\n");
      showNotification("Comments extracted to Thinking Log! 🧠", "success");
    } else {
      showNotification("No comments found in code to extract.", "info");
    }
  });

  // Run Code via Piston
  runCodeBtn.addEventListener("click", async () => {
    const seq = ++currentRunSeq;
    runStatusBadge.textContent = "Running";
    runStatusBadge.className = "status-badge status-running";
    terminalOutput.innerHTML = '<span class="terminal-placeholder">Compiling & executing code...</span>';

    const { output, errors } = await executeCode(languageSelect.value, codeEditor.value);
    if (seq !== currentRunSeq) return;

    if (errors.length > 0) {
      terminalOutput.innerHTML = "";
      errors.forEach(err => {
        const el = document.createElement("span");
        el.style.color = "#f87171";
        el.textContent = err;
        terminalOutput.appendChild(el);
      });
      runStatusBadge.textContent = "Error";
      runStatusBadge.className = "status-badge status-error";

      if (typeof logMistake === "function") {
        const errText = errors.join("\n").toLowerCase();
        let category = "logic";
        let message = "Compilation/Syntax Error: " + errors[0];
        
        if (errText.includes("indexerror") || errText.includes("outofbounds") || errText.includes("out of bounds") || errText.includes("index out of range") || errText.includes("cannot read properties of undefined") || errText.includes("cannot read property") || errText.includes("nullpointerexception") || errText.includes("nullpointer")) {
          category = "off-by-one";
          message = "Index/Boundary Exception: " + errors[0];
        } else if (errText.includes("recursionerror") || errText.includes("stackoverflow") || errText.includes("stack overflow") || errText.includes("maximum call stack size exceeded")) {
          category = "recursion";
          message = "Recursion/Stack Overflow: " + errors[0];
        }

        let activeProblemTitle = "Workspace Practice";
        const problemSelect = document.getElementById("problemSelect");
        if (problemSelect) {
          const activeOption = problemSelect.options[problemSelect.selectedIndex];
          if (activeOption) {
            activeProblemTitle = activeOption.text;
          }
        }
        logMistake(category, message, activeProblemTitle);
      }
    } else {
      terminalOutput.innerHTML = "";
      if (output.length > 0) {
        output.forEach(line => {
          const el = document.createElement("span");
          el.textContent = line;
          terminalOutput.appendChild(el);
        });
      } else {
        terminalOutput.innerHTML = '<span class="terminal-placeholder">Executed successfully with no standard output.</span>';
      }
      runStatusBadge.textContent = "Ready";
      runStatusBadge.className = "status-badge status-ready";
    }
  });

  // Analyze Reasoning
  analyzeReasoningBtn.addEventListener("click", () => {
    const codeText = codeEditor.value;
    const thoughtsText = thoughtsLog.value;
    const pVal = problemSelect.value;
    const lVal = languageSelect.value;

    const analysis = analyzeReasoning(codeText, thoughtsText, pVal, lVal);

    // Render score
    scoreNum.textContent = analysis.score;
    const circleCircumference = 314.16; // 2 * pi * 50
    const dashOffset = circleCircumference * (1 - analysis.score / 100);
    scoreCircle.style.strokeDashoffset = dashOffset;

    // Rating titles
    let rating = "";
    if (analysis.score >= 90) rating = "Analytical Architect (Exemplary)";
    else if (analysis.score >= 75) rating = "Structured Logical Solver (Good)";
    else if (analysis.score >= 60) rating = "Brute-Force Coder (Average)";
    else rating = "Impulsive Guess-and-Checker (Needs Improvement)";
    methodologyLabel.textContent = rating;

    // Render pattern badges
    patternBadges.innerHTML = "";
    if (analysis.patterns.length > 0) {
      analysis.patterns.forEach(p => {
        const b = document.createElement("span");
        b.className = "pattern-badge";
        b.textContent = p;
        patternBadges.appendChild(b);
      });
    } else {
      patternBadges.innerHTML = '<span class="text-muted" style="font-size: 0.8rem;">No patterns classified</span>';
    }

    // Render misconceptions warnings
    misconceptionList.innerHTML = "";
    if (analysis.misconceptions.length > 0) {
      analysis.misconceptions.forEach(m => {
        const card = document.createElement("div");
        card.className = `alert-card alert-${m.level}`;
        card.innerHTML = `
          <h5>
            <i class="fas ${m.level === 'high' ? 'fa-ban' : m.level === 'medium' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i> 
            ${m.title}
          </h5>
          <p>${m.desc}</p>
        `;
        misconceptionList.appendChild(card);
      });
    } else {
      misconceptionList.innerHTML = `
        <div style="text-align: center; color: #10b981; font-size: 0.9rem; padding: 1rem 0; border: 1px dashed rgba(16, 185, 129, 0.3); border-radius: 8px; background: rgba(16, 185, 129, 0.05);">
          🎉 <strong style="font-weight: 700;">Flawless Reasoning!</strong> No misconceptions or bounds crashes detected.
        </div>
      `;
    }

    // Render Socratic review feedback
    let coachHTML = "";
    if (analysis.score >= 90) {
      coachHTML = `
        <p>Excellent work! You designed your data structures with boundary constraints, noted complexity tradeoffs, and deconstructed logic prior to implementation.</p>
        <div class="question-box">
          <h6>🧠 Socratic Question:</h6>
          <p>"How would your design scale if the elements in the dataset had duplicate instances? Can you explain the space-time tradeoffs of mutating in-place?"</p>
        </div>
      `;
    } else {
      const topMisconception = analysis.misconceptions[0];
      const question = getSocraticQuestionForMisconception(topMisconception ? topMisconception.title : "");
      coachHTML = `
        <p>Your solution runs, but the AI Judge detected cognitive leaps or bounds vulnerabilities. Consider the questions below to strengthen your approach.</p>
        <div class="question-box">
          <h6>🧠 Socratic Question:</h6>
          <p>"${question}"</p>
        </div>
      `;
    }
    socraticFeedback.innerHTML = coachHTML;

    // Update Coding Personality metrics
    updateCodingPersonalityFromJudge(analysis, thoughtsText, codeText);

    showNotification("Reasoning Analysis Complete! Coding Personality metrics updated 🧠", "success");
  });
}

function updateCodingPersonalityFromJudge(analysis, thoughts, code) {
  if (typeof userProgress === "undefined") return;
  if (!userProgress.codingPersonality) {
    userProgress.codingPersonality = {
      type: "brute-force first",
      bruteForceCount: 1,
      slowAccurateCount: 0,
      greedyCount: 0,
      overOptimizerCount: 0
    };
  }

  const cp = userProgress.codingPersonality;
  const thoughtsLower = thoughts.toLowerCase();
  const codeLower = code.toLowerCase();

  let isBruteForce = false;
  let isOverOptimizer = false;
  let isSlowAccurate = false;
  let isGreedy = false;

  // 1. Brute-force first indicators
  if (analysis.misconceptions.some(m => m.title.includes("Brute-Force Jump") || m.title.includes("Quadratic Lookup"))) {
    isBruteForce = true;
  }
  if (thoughts.trim().length < 15 && (code.match(/\/\/|#/g) || []).length < 2) {
    isBruteForce = true;
  }

  // 2. Over-optimizer indicators
  if (analysis.patterns.includes("Complexity Awareness") || analysis.patterns.includes("Memoization Cache")) {
    if (codeLower.includes("map") || codeLower.includes("dict") || codeLower.includes("memo") || codeLower.includes("cache") || codeLower.includes("seen")) {
      isOverOptimizer = true;
    }
  }
  if (thoughtsLower.includes("optimize") || thoughtsLower.includes("complexity") || thoughtsLower.includes("tradeoff") || thoughtsLower.includes("optimal")) {
    isOverOptimizer = true;
  }

  // 3. Slow but accurate indicators
  if (analysis.score >= 80 && analysis.patterns.includes("Boundary Guarding") && analysis.misconceptions.length === 0) {
    isSlowAccurate = true;
  }
  if (thoughtsLower.includes("boundary") || thoughtsLower.includes("edge case") || thoughtsLower.includes("validate") || thoughtsLower.includes("null check")) {
    isSlowAccurate = true;
  }

  // 4. Greedy thinker indicators
  const greedyKeywords = ["greedy", "heuristic", "local", "immediate", "sort", "greedy thinker", "min", "max"];
  if (greedyKeywords.some(kw => thoughtsLower.includes(kw) || codeLower.includes(kw))) {
    isGreedy = true;
  }

  // Increment counters based on detected behaviors
  if (isBruteForce) {
    cp.bruteForceCount = (cp.bruteForceCount || 0) + 1;
  }
  if (isOverOptimizer) {
    cp.overOptimizerCount = (cp.overOptimizerCount || 0) + 1;
  }
  if (isSlowAccurate) {
    cp.slowAccurateCount = (cp.slowAccurateCount || 0) + 1;
  }
  if (isGreedy) {
    cp.greedyCount = (cp.greedyCount || 0) + 1;
  }

  // Recalculate dominant type
  const counts = {
    "brute-force first": cp.bruteForceCount || 0,
    "over-optimizer": cp.overOptimizerCount || 0,
    "slow but accurate": cp.slowAccurateCount || 0,
    "greedy thinker": cp.greedyCount || 0
  };

  let dominantType = cp.type || "brute-force first";
  let maxCount = -1;
  for (const type in counts) {
    if (counts[type] > maxCount) {
      maxCount = counts[type];
      dominantType = type;
    }
  }

  cp.type = dominantType;

  // Loop through misconceptions and log them into the Mistake DNA Tracker
  if (typeof logMistake === "function" && analysis && Array.isArray(analysis.misconceptions)) {
    analysis.misconceptions.forEach(m => {
      let category = "logic";
      if (m.title.includes("Empty Array") || m.title.includes("Null Pointer")) {
        category = "off-by-one";
      } else if (m.title.includes("Infinite Recursion") || m.title.includes("Exponential")) {
        category = "recursion";
      } else if (m.title.includes("Brute-Force") || m.title.includes("Lookup") || m.title.includes("Unchecked Growth")) {
        category = "logic";
      }
      
      let activeProblemTitle = "Workspace Practice";
      const problemSelect = document.getElementById("problemSelect");
      if (problemSelect) {
        const activeOption = problemSelect.options[problemSelect.selectedIndex];
        if (activeOption) {
          activeProblemTitle = activeOption.text;
        }
      }
      
      logMistake(category, m.title + ": " + m.desc.split(".")[0] + ".", activeProblemTitle);
    });
  }

  // Persist the changes
  if (typeof saveUserData === "function") {
    saveUserData();
  }
  
  // Re-render personality card if elements exist
  if (typeof renderPersonalityCard === "function") {
    renderPersonalityCard();
  }
}

function getSocraticQuestionForMisconception(title) {
  if (title.includes("Brute-Force")) {
    return "What is the very first step you take when faced with a problem? How does translating constraints into comments first help minimize index errors?";
  } else if (title.includes("Empty Array")) {
    return "What happens to your array loops if the input size is exactly 0? Will your pointers crash or yield an incorrect index?";
  } else if (title.includes("Null Pointer")) {
    return "If a user passes a linked list head that is null, what will your loop conditions attempt to access? Can we guard this at the entry point?";
  } else if (title.includes("Infinite Recursion")) {
    return "Under what input conditions will your recursive calls terminate? How do base cases act as recursion anchors?";
  } else if (title.includes("Exponential")) {
    return "If we calculate fib(40) recursively, how many times will we recalculate fib(5)? How does memory space trade off with recursive speeds?";
  } else if (title.includes("Lookup")) {
    return "How do nested loops affect search efficiency? Can you name a data structure that provides constant time O(1) searches?";
  }
  return "If you dry-run this logic step-by-step on paper with a negative bound, does it execute correctly?";
}



window.addEventListener("resize", () => {
  if (typeof updateLineNumbers === 'function') updateLineNumbers();
});
