/* ===================================================
   Reverse Interview Mode — Code-to-Question Generator
   Issue #368 | Algo Infinity Verse
   =================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initRILoadingScreen();
  initRINavbar();
  initRIScrollTop();
  initRIDarkMode();
  try {
    initReverseInterview();
  } catch (e) {
    console.error("ReverseInterview init error:", e);
  }
});

/* ─── Bootstrap helpers (mirror think-aloud-judge.js) ─── */
function initRILoadingScreen() {
  setTimeout(() => {
    const s = document.getElementById("loading-screen");
    if (s) s.classList.add("hidden");
  }, 1200);
}

function initRIScrollTop() {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;
  window.addEventListener("scroll", () => btn.classList.toggle("visible", window.scrollY > 400));
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function initRIDarkMode() {
  const toggle = document.getElementById("darkModeToggle");
  if (!toggle) return;
  const icon = toggle.querySelector("i");
  if (localStorage.getItem("darkMode") === "light") {
    document.body.classList.add("light-mode");
    if (icon) icon.classList.replace("fa-moon", "fa-sun");
  }
  toggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    const isLight = document.body.classList.contains("light-mode");
    if (icon) { icon.classList.toggle("fa-moon", !isLight); icon.classList.toggle("fa-sun", isLight); }
    localStorage.setItem("darkMode", isLight ? "light" : "dark");
  });
}

function initRINavbar() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks   = document.getElementById("navLinks");
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
  navLinks.querySelectorAll("a").forEach(a => a.addEventListener("click", () => toggleMenu(false)));
  const isMobile = () => window.matchMedia("(max-width: 1024px)").matches;
  document.querySelectorAll(".dropdown-toggle").forEach(toggle => {
    const parent = toggle.closest(".has-dropdown");
    const menu   = parent?.querySelector(".dropdown-menu");
    if (!parent || !menu) return;
    let t;
    parent.addEventListener("mouseenter", () => { if (!isMobile()) { clearTimeout(t); parent.classList.add("open"); toggle.setAttribute("aria-expanded", "true"); } });
    parent.addEventListener("mouseleave", () => { if (!isMobile()) { t = setTimeout(() => { parent.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }, 250); } });
    toggle.addEventListener("click", (e) => { if (isMobile()) { e.preventDefault(); e.stopPropagation(); const o = parent.classList.toggle("open"); toggle.setAttribute("aria-expanded", o); } });
  });
}

/* ─── Problem Data ─── */
const RI_PROBLEMS = {
  twosum: {
    title: "Two Sum",
    banner: `<h4>Two Sum</h4><p>Given an integer array <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.</p><ul><li>Exactly one solution exists.</li><li>You may not use the same element twice.</li><li>Optimal: O(N) time using a hash map.</li></ul>`,
    faangContext: "Asked frequently at Google, Amazon, Meta first-round screens.",
    templates: {
      python: `# Two Sum — write your full solution here
def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []

print(twoSum([2, 7, 11, 15], 9))`,
      javascript: `// Two Sum — write your full solution here
function twoSum(nums, target) {
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (seen.has(diff)) return [seen.get(diff), i];
        seen.set(nums[i], i);
    }
    return [];
}
console.log(twoSum([2, 7, 11, 15], 9));`,
      cpp: `// Two Sum — write your full solution here
#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;
vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int,int> seen;
    for (int i = 0; i < (int)nums.size(); ++i) {
        int diff = target - nums[i];
        if (seen.count(diff)) return {seen[diff], i};
        seen[nums[i]] = i;
    }
    return {};
}
int main() {
    vector<int> n = {2,7,11,15};
    auto r = twoSum(n, 9);
    cout << "[" << r[0] << "," << r[1] << "]" << endl;
}`,
      java: `// Two Sum — write your full solution here
import java.util.HashMap;
import java.util.Arrays;
class Solution {
    public int[] twoSum(int[] nums, int target) {
        HashMap<Integer,Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int diff = target - nums[i];
            if (seen.containsKey(diff)) return new int[]{seen.get(diff), i};
            seen.put(nums[i], i);
        }
        return new int[0];
    }
}
public class Main {
    public static void main(String[] args) {
        System.out.println(Arrays.toString(new Solution().twoSum(new int[]{2,7,11,15}, 9)));
    }
}`
    }
  },
  reverselist: {
    title: "Reverse Linked List",
    banner: `<h4>Reverse a Linked List</h4><p>Given the head of a singly linked list, reverse the list in-place and return the new head.</p><ul><li>O(1) extra space required.</li><li>Handle null head and single-node cases.</li></ul>`,
    faangContext: "Classic pointer manipulation — common at Facebook/Meta phone screens.",
    templates: {
      python: `# Reverse Linked List — write your full solution here
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverseList(head):
    prev = None
    curr = head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev`,
      javascript: `// Reverse Linked List — write your full solution here
function reverseList(head) {
    let prev = null, curr = head;
    while (curr) {
        let nxt = curr.next;
        curr.next = prev;
        prev = curr;
        curr = nxt;
    }
    return prev;
}`,
      cpp: `// Reverse Linked List — write your full solution here
struct ListNode { int val; ListNode* next; ListNode(int x): val(x), next(NULL){} };
class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        ListNode* curr = head;
        while (curr) {
            ListNode* nxt = curr->next;
            curr->next = prev;
            prev = curr;
            curr = nxt;
        }
        return prev;
    }
};`,
      java: `// Reverse Linked List — write your full solution here
class ListNode { int val; ListNode next; ListNode(int x){ val=x; } }
class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null, curr = head;
        while (curr != null) {
            ListNode nxt = curr.next;
            curr.next = prev;
            prev = curr;
            curr = nxt;
        }
        return prev;
    }
}`
    }
  },
  fibonacci: {
    title: "Fibonacci Recursion",
    banner: `<h4>Fibonacci Recursion</h4><p>Compute the N-th Fibonacci number recursively. Analyze stack depth, memoization, and O(2^N) vs O(N) tradeoffs.</p><ul><li>Define correct base cases (N ≤ 1).</li><li>Consider memoization to avoid exponential recursion.</li></ul>`,
    faangContext: "Used to test recursion understanding and optimization instincts at Apple, Microsoft.",
    templates: {
      python: `# Fibonacci — write your full solution here
def fib(n, memo={}):
    if n <= 1: return n
    if n in memo: return memo[n]
    memo[n] = fib(n-1, memo) + fib(n-2, memo)
    return memo[n]
print(fib(10))`,
      javascript: `// Fibonacci — write your full solution here
function fib(n, memo = {}) {
    if (n <= 1) return n;
    if (memo[n] !== undefined) return memo[n];
    memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
    return memo[n];
}
console.log(fib(10));`,
      cpp: `// Fibonacci — write your full solution here
#include <iostream>
#include <unordered_map>
using namespace std;
int fib(int n, unordered_map<int,int>& m) {
    if (n <= 1) return n;
    if (m.count(n)) return m[n];
    return m[n] = fib(n-1,m) + fib(n-2,m);
}
int main() { unordered_map<int,int> m; cout << fib(10,m) << endl; }`,
      java: `// Fibonacci — write your full solution here
import java.util.HashMap;
class Solution {
    HashMap<Integer,Integer> memo = new HashMap<>();
    public int fib(int n) {
        if (n <= 1) return n;
        if (memo.containsKey(n)) return memo.get(n);
        int r = fib(n-1) + fib(n-2);
        memo.put(n, r);
        return r;
    }
}
public class Main { public static void main(String[] a){ System.out.println(new Solution().fib(10)); } }`
    }
  },
  binarysearch: {
    title: "Binary Search",
    banner: `<h4>Binary Search</h4><p>Search for a target in a sorted array and return its index. Return -1 if not found.</p><ul><li>O(log N) time required.</li><li>Handle integer overflow in mid calculation.</li><li>Clarify: ascending or descending array?</li></ul>`,
    faangContext: "Fundamental — tested at every FAANG company. Often asked as a warm-up.",
    templates: {
      python: `# Binary Search — write your full solution here
def binarySearch(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if nums[mid] == target: return mid
        elif nums[mid] < target: lo = mid + 1
        else: hi = mid - 1
    return -1
print(binarySearch([1,3,5,7,9,11], 7))`,
      javascript: `// Binary Search — write your full solution here
function binarySearch(nums, target) {
    let lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        const mid = lo + Math.floor((hi - lo) / 2);
        if (nums[mid] === target) return mid;
        else if (nums[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}
console.log(binarySearch([1,3,5,7,9,11], 7));`,
      cpp: `// Binary Search — write your full solution here
#include <iostream>
#include <vector>
using namespace std;
int binarySearch(vector<int>& nums, int target) {
    int lo = 0, hi = (int)nums.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (nums[mid] == target) return mid;
        else if (nums[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}
int main() { vector<int> n = {1,3,5,7,9,11}; cout << binarySearch(n, 7) << endl; }`,
      java: `// Binary Search — write your full solution here
class Solution {
    public int binarySearch(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;
        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (nums[mid] == target) return mid;
            else if (nums[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return -1;
    }
}
public class Main { public static void main(String[] a){ System.out.println(new Solution().binarySearch(new int[]{1,3,5,7,9,11}, 7)); } }`
    }
  },
  maxsubarray: {
    title: "Max Subarray (Kadane's)",
    banner: `<h4>Maximum Subarray — Kadane's Algorithm</h4><p>Find the contiguous subarray with the largest sum within an integer array.</p><ul><li>O(N) time using Kadane's algorithm.</li><li>Handles all-negative arrays.</li></ul>`,
    faangContext: "Classic DP gateway problem — asked at Google, Amazon for SWE-2 and above.",
    templates: {
      python: `# Max Subarray — write your full solution here
def maxSubArray(nums):
    max_sum = curr_sum = nums[0]
    for num in nums[1:]:
        curr_sum = max(num, curr_sum + num)
        max_sum = max(max_sum, curr_sum)
    return max_sum
print(maxSubArray([-2,1,-3,4,-1,2,1,-5,4]))`,
      javascript: `// Max Subarray — write your full solution here
function maxSubArray(nums) {
    let maxSum = nums[0], currSum = nums[0];
    for (let i = 1; i < nums.length; i++) {
        currSum = Math.max(nums[i], currSum + nums[i]);
        maxSum = Math.max(maxSum, currSum);
    }
    return maxSum;
}
console.log(maxSubArray([-2,1,-3,4,-1,2,1,-5,4]));`,
      cpp: `// Max Subarray — write your full solution here
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
int maxSubArray(vector<int>& nums) {
    int maxSum = nums[0], curr = nums[0];
    for (int i = 1; i < (int)nums.size(); i++) {
        curr = max(nums[i], curr + nums[i]);
        maxSum = max(maxSum, curr);
    }
    return maxSum;
}
int main() { vector<int> n = {-2,1,-3,4,-1,2,1,-5,4}; cout << maxSubArray(n) << endl; }`,
      java: `// Max Subarray — write your full solution here
class Solution {
    public int maxSubArray(int[] nums) {
        int maxSum = nums[0], curr = nums[0];
        for (int i = 1; i < nums.length; i++) {
            curr = Math.max(nums[i], curr + nums[i]);
            maxSum = Math.max(maxSum, curr);
        }
        return maxSum;
    }
}
public class Main { public static void main(String[] a){ System.out.println(new Solution().maxSubArray(new int[]{-2,1,-3,4,-1,2,1,-5,4})); } }`
    }
  },
  mergesort: {
    title: "Merge Sort",
    banner: `<h4>Merge Sort</h4><p>Implement merge sort — a divide-and-conquer sorting algorithm with O(N log N) guaranteed time complexity.</p><ul><li>Recursively split into halves, then merge.</li><li>O(N) additional space for merge step.</li></ul>`,
    faangContext: "Tests divide-and-conquer mastery — common at Jane Street, Two Sigma, and Microsoft.",
    templates: {
      python: `# Merge Sort — write your full solution here
def mergeSort(arr):
    if len(arr) <= 1: return arr
    mid = len(arr) // 2
    left = mergeSort(arr[:mid])
    right = mergeSort(arr[mid:])
    return merge(left, right)

def merge(l, r):
    result, i, j = [], 0, 0
    while i < len(l) and j < len(r):
        if l[i] <= r[j]: result.append(l[i]); i += 1
        else: result.append(r[j]); j += 1
    return result + l[i:] + r[j:]

print(mergeSort([38,27,43,3,9,82,10]))`,
      javascript: `// Merge Sort — write your full solution here
function mergeSort(arr) {
    if (arr.length <= 1) return arr;
    const mid = Math.floor(arr.length / 2);
    const left = mergeSort(arr.slice(0, mid));
    const right = mergeSort(arr.slice(mid));
    return merge(left, right);
}
function merge(l, r) {
    const res = []; let i = 0, j = 0;
    while (i < l.length && j < r.length) {
        if (l[i] <= r[j]) res.push(l[i++]); else res.push(r[j++]);
    }
    return [...res, ...l.slice(i), ...r.slice(j)];
}
console.log(mergeSort([38,27,43,3,9,82,10]));`,
      cpp: `// Merge Sort — write your full solution here
#include <iostream>
#include <vector>
using namespace std;
vector<int> merge(vector<int> l, vector<int> r) {
    vector<int> res; int i=0,j=0;
    while(i<l.size()&&j<r.size()){ if(l[i]<=r[j]) res.push_back(l[i++]); else res.push_back(r[j++]); }
    while(i<l.size()) res.push_back(l[i++]);
    while(j<r.size()) res.push_back(r[j++]);
    return res;
}
vector<int> mergeSort(vector<int> arr) {
    if(arr.size()<=1) return arr;
    int mid=arr.size()/2;
    return merge(mergeSort(vector<int>(arr.begin(),arr.begin()+mid)), mergeSort(vector<int>(arr.begin()+mid,arr.end())));
}
int main() { auto r=mergeSort({38,27,43,3,9,82,10}); for(auto x:r) cout<<x<<" "; cout<<endl; }`,
      java: `// Merge Sort — write your full solution here
import java.util.Arrays;
class Solution {
    public int[] mergeSort(int[] arr) {
        if (arr.length <= 1) return arr;
        int mid = arr.length / 2;
        int[] left = mergeSort(Arrays.copyOfRange(arr, 0, mid));
        int[] right = mergeSort(Arrays.copyOfRange(arr, mid, arr.length));
        return merge(left, right);
    }
    int[] merge(int[] l, int[] r) {
        int[] res = new int[l.length + r.length]; int i=0,j=0,k=0;
        while(i<l.length&&j<r.length) res[k++]=(l[i]<=r[j])?l[i++]:r[j++];
        while(i<l.length) res[k++]=l[i++];
        while(j<r.length) res[k++]=r[j++];
        return res;
    }
}
public class Main { public static void main(String[] a){ System.out.println(Arrays.toString(new Solution().mergeSort(new int[]{38,27,43,3,9,82,10}))); } }`
    }
  },
  custom: {
    title: "Custom Problem",
    banner: `<h4>Custom Problem</h4><p>Paste or write any solution. The engine will analyze your code structure, patterns, and data structures to generate targeted interview questions.</p><ul><li>Works with any algorithmic solution.</li><li>Questions are inferred from your code patterns.</li></ul>`,
    faangContext: "Simulates an open-ended FAANG code review session.",
    templates: {
      python: `# Custom solution — paste your code here\n`,
      javascript: `// Custom solution — paste your code here\n`,
      cpp: `// Custom solution — paste your code here\n#include <iostream>\nusing namespace std;\nint main() {\n    return 0;\n}`,
      java: `// Custom solution — paste your code here\npublic class Main {\n    public static void main(String[] args) {\n    }\n}`
    }
  }
};

/* ─── Piston API ─── */
const RI_PISTON_MAP = {
  python:     { language: "python",     version: "3.10.0",  file: "main.py"   },
  javascript: { language: "javascript", version: "18.15.0", file: "main.js"   },
  cpp:        { language: "c++",        version: "10.2.0",  file: "main.cpp"  },
  java:       { language: "java",       version: "15.0.2",  file: "Main.java" }
};

async function riExecuteCode(langKey, code) {
  const cfg = RI_PISTON_MAP[langKey];
  if (!cfg) return { output: [], errors: ["Unsupported language."] };
  try {
    const res = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: cfg.language, version: cfg.version, files: [{ name: cfg.file, content: code }], stdin: "", args: [], compile_timeout: 10000, run_timeout: 3000 })
    });
    if (!res.ok) throw new Error("API error " + res.status);
    const data = await res.json();
    const output = [], errors = [];
    if (data.compile?.stderr) errors.push(...data.compile.stderr.split("\n").filter(l => l.trim()));
    if (data.run?.stderr)     errors.push(...data.run.stderr.split("\n").filter(l => l.trim()));
    if (data.run?.stdout)     output.push(...data.run.stdout.split("\n").filter(l => l.trim()));
    return { output, errors };
  } catch (err) {
    return { output: [], errors: ["Execution failed: " + err.message] };
  }
}

/* ─── Question Bank ─── */

/* Helper: check if code contains any of given keywords */
function codeHas(code, ...keywords) {
  const lc = code.toLowerCase();
  return keywords.some(k => lc.includes(k.toLowerCase()));
}

function codeMatchCount(code, regex) {
  return (code.match(regex) || []).length;
}

/* Classify approximate complexity from code */
function detectComplexity(code) {
  const lc = code.toLowerCase();
  const forLoops = codeMatchCount(code, /\bfor\b/g);
  const whileLoops = codeMatchCount(code, /\bwhile\b/g);
  const totalLoops = forLoops + whileLoops;
  const hasRecursion = /def\s+\w+\(.*\)[\s\S]*?\1|function\s+\w+\([\s\S]*?\1/.test(code) || codeHas(code, "return fib", "return mergesort", "return mergeSort", "return reverseList");
  const hasMap = codeHas(code, "map", "dict", "hashmap", "unordered_map", "hashset", "set");
  const hasNested = totalLoops >= 2 && !hasMap;

  if (hasNested && !hasMap) return { time: "O(N²)", space: "O(1)", isSubOptimal: true };
  if (hasRecursion && !codeHas(code, "memo", "cache", "dp")) return { time: "O(2^N)", space: "O(N)", isSubOptimal: true };
  if (hasRecursion && codeHas(code, "memo", "cache")) return { time: "O(N)", space: "O(N)", isSubOptimal: false };
  if (totalLoops === 1 && hasMap) return { time: "O(N)", space: "O(N)", isSubOptimal: false };
  if (totalLoops === 1 && !hasMap) return { time: "O(N)", space: "O(1)", isSubOptimal: false };
  if (codeHas(code, "lo", "hi", "mid", "binary")) return { time: "O(log N)", space: "O(1)", isSubOptimal: false };
  return { time: "O(N)", space: "O(N)", isSubOptimal: false };
}

/* Generate Code-Specific questions by analyzing patterns */
function generateCodeQuestions(code, language, problemKey) {
  const questions = [];
  const lc = code.toLowerCase();
  const { time, space } = detectComplexity(code);

  /* 1. Data structure choice */
  if (codeHas(code, "map", "dict", "hashmap", "unordered_map", "seen", "HashMap")) {
    questions.push({
      text: "You chose a hash map / dictionary as your primary lookup structure. Can you walk me through the exact key-value pairing you stored, and why you chose that mapping rather than a two-pointer or brute-force approach?",
      followup: "Follow-up: What happens if the input contains duplicate values? Does your hash map implementation handle that correctly?",
      difficulty: "medium"
    });
  }

  if (codeHas(code, "set", "hashset", "unordered_set")) {
    questions.push({
      text: "You used a Set/HashSet in your solution. Why a Set instead of a Map here? Are there any lookup guarantees you rely on from the Set's O(1) average-case operations?",
      followup: "Follow-up: Could this Set become a bottleneck in worst-case scenarios with hash collisions? How would you defend against that?",
      difficulty: "medium"
    });
  }

  /* 2. Loop structure */
  const forCount = codeMatchCount(code, /\bfor\b/g);
  if (forCount >= 2) {
    questions.push({
      text: `I see ${forCount} for-loop constructs in your solution. Walk me through what each loop iterates over. Is the outer loop independent of the inner loop, or do they share any state?`,
      followup: "Follow-up: If both loops run to N, this is O(N²). Can you eliminate the inner loop? What data structure would allow you to do that?",
      difficulty: forCount >= 3 ? "hard" : "medium"
    });
  } else if (forCount === 1) {
    questions.push({
      text: "Your solution uses a single loop. What is the loop invariant — that is, what property is guaranteed to be true at the start of each iteration? How does the loop termination condition ensure correctness?",
      followup: "Follow-up: What happens on the last iteration when the pointer reaches the boundary?",
      difficulty: "easy"
    });
  }

  /* 3. Recursion analysis */
  if (codeHas(code, "def ", "function ", "void ", "int ") && codeHas(code, "return fib", "return merge", "reverseList(", "fib(n-1", "fib(n - 1")) {
    questions.push({
      text: "Your solution uses recursion. What is the maximum call stack depth for an input of size N? At what input size would you risk a stack overflow in a production system?",
      followup: "Follow-up: Can you re-write this iteratively using an explicit stack? What would the space complexity be then, and is that better or worse?",
      difficulty: "hard"
    });
  }

  /* 4. Memoization / caching */
  if (codeHas(code, "memo", "cache", "dp", "dp[")) {
    questions.push({
      text: "You implemented memoization / caching. Explain the exact subproblem you're caching — what is the cache key, and what does the cached value represent? Could the cache grow unboundedly?",
      followup: "Follow-up: If memory is severely constrained (e.g., embedded system), how would you convert this top-down memoization to bottom-up dynamic programming to control allocation?",
      difficulty: "hard"
    });
  }

  /* 5. Pointer patterns */
  if (codeHas(code, "prev", "curr", "nxt", "next", "ptr")) {
    questions.push({
      text: "You used sliding/trailing pointer variables (prev, curr, next). Walk me through the exact state of each pointer at iteration 1, 2, and 3 for a sample input of [1 → 2 → 3 → 4]. What guarantees that prev always points to a fully processed node?",
      followup: "Follow-up: What happens to your pointer updates if the list is circular? Would your while-loop terminate?",
      difficulty: "medium"
    });
  }

  /* 6. Variable naming / clarity */
  if (codeHas(code, "diff", "complement", "remainder")) {
    questions.push({
      text: `You named your lookup variable '${lc.includes("diff") ? "diff" : lc.includes("complement") ? "complement" : "remainder"}'. In a code review, I'd ask: does this variable name accurately convey intent to a reader who hasn't seen the problem statement? How would you rename it to be self-documenting?`,
      followup: "Follow-up: If a junior engineer were debugging this in production at 3am, would they immediately understand what `diff` represents without reading surrounding context?",
      difficulty: "easy"
    });
  }

  /* 7. Return value & type safety */
  if (codeHas(code, "return []", "return {}", "return new int[0]", "return -1")) {
    questions.push({
      text: "Your solution returns an empty array / -1 for the 'not found' case. In a real system, how would the caller distinguish between 'answer is empty array' and 'an unexpected error occurred'? Should you throw an exception instead?",
      followup: "Follow-up: If this function is part of a service API consumed by 10 other teams, what return contract would you define in the interface specification?",
      difficulty: "medium"
    });
  }

  /* 8. Complexity comment */
  questions.push({
    text: `Based on my reading, your solution appears to run in approximately ${time} time and ${space} space. Can you confirm or correct that assessment, and explain which lines of code drive each factor?`,
    followup: `Follow-up: If the input N doubled from 10,000 to 20,000 elements, how does your runtime scale? Would this be acceptable in a latency-sensitive production API with a 100ms SLA?`,
    difficulty: time === "O(N²)" || time === "O(2^N)" ? "hard" : "medium"
  });

  /* 9. Language-specific */
  if (language === "python" && codeHas(code, "def ", "enumerate")) {
    questions.push({
      text: "You used Python's `enumerate()` built-in. If this code were ported to a language without built-in enumeration (like C), how would you rewrite that pattern while maintaining the same O(N) complexity?",
      followup: "Follow-up: Is there a performance cost to `enumerate()` versus a manual index counter in Python's CPython implementation?",
      difficulty: "easy"
    });
  }

  if (language === "cpp" && codeHas(code, "unordered_map")) {
    questions.push({
      text: "You chose `std::unordered_map` over `std::map`. Explain the time complexity difference between the two, and under what circumstances would `std::map` actually be preferable despite its O(log N) lookup?",
      followup: "Follow-up: What is the worst-case time complexity of `std::unordered_map::find()` and how would an adversary craft inputs to trigger it?",
      difficulty: "hard"
    });
  }

  return questions.slice(0, 6);
}

/* Generate Edge Case questions */
function generateEdgeCaseQuestions(code, language, problemKey) {
  const questions = [];
  const lc = code.toLowerCase();

  const hasNullCheck   = codeHas(code, "null", "none", "!head", "if not head", "if (!head)", "length == 0", "len(nums) == 0", "nums.length === 0");
  const hasEmptyCheck  = codeHas(code, "length", "size()", "len(", "empty()");
  const hasNegative    = codeHas(code, "< 0", "<= 0", "negative");
  const hasSingleElem  = codeHas(code, "<= 1", "== 1", "length == 1", "size() == 1");

  /* Empty input */
  if (!hasNullCheck && !hasEmptyCheck) {
    questions.push({
      text: "What happens when your function receives an empty array `[]` or a null pointer as input? Walk through your code line by line with that input — does it crash, return wrong output, or behave correctly?",
      followup: "Follow-up: At FAANG scale, missing an empty-array guard can cause production outages. Where in your code would you add this check, and why there specifically?",
      difficulty: "medium"
    });
  } else {
    questions.push({
      text: "You added a null/empty check. Good — but where exactly did you place it, and why at that position? What would happen if that check were placed five lines later in the function body instead?",
      followup: "Follow-up: If you receive `nums = [0]` (a single-element array of zero), does your empty-check incorrectly reject it?",
      difficulty: "easy"
    });
  }

  /* Single element */
  if (!hasSingleElem) {
    questions.push({
      text: "What is the output of your function when given a single-element input (e.g., `nums = [5]`, or a linked list with one node)? Does your loop body execute once, zero times, or does it skip entirely?",
      followup: "Follow-up: Some solutions have an off-by-one error specifically with single-element inputs. Can you write a unit test for this edge case right now?",
      difficulty: "easy"
    });
  }

  /* Negative numbers */
  if (!hasNegative) {
    questions.push({
      text: "Does your solution handle negative numbers correctly? For example, if `nums = [-3, -1, -4, -1, -5]` and `target = -4`, does your hash map / comparison logic still work?",
      followup: "Follow-up: Some languages have integer underflow when subtracting large negative numbers. Does `target - nums[i]` have any overflow risk in your implementation?",
      difficulty: "medium"
    });
  }

  /* Duplicates */
  if (problemKey === "twosum") {
    questions.push({
      text: "What if `nums = [3, 3]` and `target = 6`? This is the 'duplicate element' edge case. Does your hash map store the index before or after the lookup? Can both indices be returned correctly?",
      followup: "Follow-up: The problem says 'may not use the same element twice.' Does your solution guarantee index i ≠ index j in all cases?",
      difficulty: "medium"
    });
  }

  /* Large input */
  questions.push({
    text: "Imagine the input has 10 million elements (N = 10⁷). Does your solution's memory allocation cause any issues? Would the hash map's load factor and resizing trigger GC pauses in a garbage-collected language?",
    followup: "Follow-up: If this function is called 1,000 times per second in a web API, what would the heap pressure look like? How would you mitigate it?",
    difficulty: "hard"
  });

  /* Already sorted / pre-conditions */
  if (problemKey === "binarysearch") {
    questions.push({
      text: "Binary search assumes a sorted input. What happens if `nums` is unsorted? Does your algorithm silently return wrong results, or does it throw an error? Should you add a guard or sort the input first?",
      followup: "Follow-up: If you sort before searching, what is the combined time complexity? Is that still better than a linear scan?",
      difficulty: "medium"
    });
  }

  /* Integer overflow */
  if (codeHas(code, "mid", "lo + hi", "l + r")) {
    questions.push({
      text: "In your mid-point calculation, if `lo = INT_MAX / 2` and `hi = INT_MAX`, does `(lo + hi) / 2` overflow a 32-bit integer? How would you write the overflow-safe version?",
      followup: "Follow-up: This integer overflow bug caused a famous bug in Java's standard library `Arrays.binarySearch()` that went undetected for nearly a decade. Can you recall or guess what the fix was?",
      difficulty: "hard"
    });
  }

  /* All same elements */
  questions.push({
    text: "What is the output of your function when all elements are identical (e.g., `[7, 7, 7, 7, 7]`)? Does your solution terminate, loop infinitely, or return a wrong result?",
    followup: "Follow-up: In a sorting context, worst-case inputs often consist of identical elements. How does your approach handle that scenario in terms of comparisons?",
    difficulty: "medium"
  });

  return questions.slice(0, 6);
}

/* Generate Optimization questions */
function generateOptimizationQuestions(code, language, problemKey) {
  const questions = [];
  const { time, space, isSubOptimal } = detectComplexity(code);

  /* General complexity upgrade */
  if (isSubOptimal) {
    questions.push({
      text: `Your current solution runs in ${time} time. A senior engineer would push back here — can you describe a path to bring this down to O(N) or O(N log N)? What algorithmic insight enables that jump?`,
      followup: "Follow-up: What is the minimum possible time complexity for this problem (its lower bound), and how do you know you cannot do better?",
      difficulty: "hard"
    });
  }

  /* Space optimization */
  if (codeHas(code, "map", "dict", "hashmap", "memo", "cache", "array", "list", "vector")) {
    questions.push({
      text: `You're allocating O(N) extra space for your ${codeHas(code, "memo") ? "memoization cache" : "hash map / auxiliary structure"}. Can this problem be solved in O(1) space? If yes, what's the tradeoff? If no, why is the extra space provably necessary?`,
      followup: "Follow-up: At a company storing 50TB of user data, reducing an algorithm's space from O(N) to O(1) can mean the difference between fitting in RAM and needing a distributed system. How do you weigh that?",
      difficulty: "hard"
    });
  }

  /* Recursive → iterative */
  if (codeHas(code, "def ", "function ") && codeHas(code, "return fib", "fib(n-1", "fib(n - 1", "mergeSort(", "reverseList(")) {
    questions.push({
      text: "Can you convert your recursive solution to an iterative one? Walk me through the explicit stack-based implementation. Does that change the time complexity, space complexity, or both?",
      followup: "Follow-up: In languages without tail-call optimization (Java, Python), deep recursion causes stack overflow. At what input size does your recursive version fail, and does iterative version fix that?",
      difficulty: "hard"
    });
  }

  /* Two-pointer opportunity */
  if (problemKey === "twosum") {
    questions.push({
      text: "If the input array were guaranteed to be sorted, could you solve Two Sum in O(N) time and O(1) space using a two-pointer technique instead of a hash map? Walk me through that algorithm.",
      followup: "Follow-up: If sorting costs O(N log N), is the combined two-pointer approach (sort + scan) still better than your current solution overall? What if you had to run this function 1,000 times on the same array?",
      difficulty: "medium"
    });
  }

  /* Bit manipulation */
  if (codeHas(code, "+ 1", "- 1", "/ 2", "// 2", "* 2")) {
    questions.push({
      text: "Some of your arithmetic operations (dividing by 2, checking even/odd) can be replaced with bitwise operators for micro-optimizations. Can you identify which lines those are, and rewrite them using bit shifts or bitwise AND?",
      followup: "Follow-up: Modern compilers often optimize these automatically. When would you explicitly write `n >> 1` instead of `n / 2` in production code?",
      difficulty: "medium"
    });
  }

  /* Early termination */
  if (!codeHas(code, "break", "return", "early")) {
    questions.push({
      text: "Does your loop have an early exit condition once the answer is found? If not, your algorithm always runs to N even when the answer is at index 0. How would you add early termination, and what is the best-case complexity after that change?",
      followup: "Follow-up: What is the average-case time complexity of your algorithm assuming uniform random input distribution, with early exit?",
      difficulty: "medium"
    });
  }

  /* Parallelization */
  questions.push({
    text: "If this problem needed to process N = 1 billion elements, could your algorithm be parallelized across multiple CPU cores or machines? Which part is inherently sequential, and which part is embarrassingly parallel?",
    followup: "Follow-up: How would you redesign this as a MapReduce job or a distributed streaming pipeline (e.g., Apache Kafka + Flink)?",
    difficulty: "hard"
  });

  /* Caching / memoization when missing */
  if (!codeHas(code, "memo", "cache", "dp") && (problemKey === "fibonacci" || codeHas(code, "recursion", "recursive"))) {
    questions.push({
      text: "Your recursive solution recomputes overlapping subproblems. Adding memoization would reduce time from O(2^N) to O(N). Can you add it right now — what data structure would you use and what is the cache key?",
      followup: "Follow-up: If N is very large and the memo dictionary itself uses too much memory, what iterative bottom-up DP approach would compute fib(N) in O(1) space?",
      difficulty: "medium"
    });
  }

  /* Streaming / online variant */
  questions.push({
    text: "Can your algorithm work in a streaming / online setting where elements arrive one at a time and you must answer queries without seeing the full array upfront? What would need to change?",
    followup: "Follow-up: This is exactly the constraint in stock price analysis, network packet processing, and real-time fraud detection. How would you architect your solution for a 10GB/s data stream?",
    difficulty: "hard"
  });

  return questions.slice(0, 6);
}

/* ─── Render question card ─── */
function renderQuestionCard(q, type, index) {
  const typeLabel = { code: "Code-Specific", edge: "Edge Case", opt: "Optimization" }[type];
  const typeClass = { code: "ri-type-code", edge: "ri-type-edge", opt: "ri-type-opt" }[type];
  const diffClass = { easy: "diff-easy", medium: "diff-medium", hard: "diff-hard" }[q.difficulty] || "diff-medium";

  const card = document.createElement("div");
  card.className = "ri-question-card";
  card.style.animationDelay = `${index * 0.07}s`;
  card.innerHTML = `
    <div class="ri-question-meta">
      <span class="ri-question-type ${typeClass}">${typeLabel}</span>
      <span class="ri-difficulty-badge ${diffClass}">${q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)}</span>
    </div>
    <p class="ri-question-text">${escapeRIHtml(q.text)}</p>
    ${q.followup ? `<div class="ri-followup"><strong>🎯 Interviewer Follow-Up</strong>${escapeRIHtml(q.followup)}</div>` : ""}
    <textarea class="ri-note-area" placeholder="Your answer notes... (saved locally)" rows="2" data-qid="${type}-${index}"></textarea>
  `;

  /* Auto-save notes to localStorage */
  const noteArea = card.querySelector(".ri-note-area");
  const noteKey  = `ri_note_${type}_${index}`;
  noteArea.value = localStorage.getItem(noteKey) || "";
  noteArea.addEventListener("input", () => {
    localStorage.setItem(noteKey, noteArea.value);
  });

  return card;
}

function escapeRIHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ─── Main Init ─── */
function initReverseInterview() {
  const problemSelect  = document.getElementById("riProblemSelect");
  const langSelect     = document.getElementById("riLanguageSelect");
  const codeEditor     = document.getElementById("riCodeEditor");
  const lineNumbers    = document.getElementById("riLineNumbers");
  const lineCount      = document.getElementById("riLineCount");
  const problemBanner  = document.getElementById("riProblemBanner");
  const generateBtn    = document.getElementById("riGenerateBtn");
  const runBtn         = document.getElementById("riRunBtn");
  const terminalOutput = document.getElementById("riTerminalOutput");
  const runStatus      = document.getElementById("riRunStatus");
  const copyBtn        = document.getElementById("riCopyBtn");

  const generatingOverlay = document.getElementById("riGeneratingOverlay");
  const summaryBar        = document.getElementById("riSummaryBar");
  const faangRow          = document.getElementById("riFaangRow");

  const tabBtns   = document.querySelectorAll(".ri-tab-btn");
  const tabPanels = { code: document.getElementById("tabPanelCode"), edge: document.getElementById("tabPanelEdge"), opt: document.getElementById("tabPanelOpt") };
  const tabCounts = { code: document.getElementById("tabCountCode"), edge: document.getElementById("tabCountEdge"), opt: document.getElementById("tabCountOpt") };
  const chipCounts = { code: document.getElementById("chipCodeCount"), edge: document.getElementById("chipEdgeCount"), opt: document.getElementById("chipOptCount") };

  const heroTotal = document.getElementById("heroTotalQuestions");
  const sessionTimer = document.getElementById("riSessionTimer");

  let sessionSeconds = 0;
  let sessionInterval = null;
  let currentRunSeq = 0;
  let allQuestions = { code: [], edge: [], opt: [] };

  /* ── Load problem banner + template ── */
  function loadProblem() {
    const key  = problemSelect.value;
    const lang = langSelect.value;
    const pd   = RI_PROBLEMS[key];
    if (!pd) return;
    problemBanner.innerHTML = pd.banner;
    if (pd.templates[lang]) {
      codeEditor.value = pd.templates[lang];
    }
    syncLineNumbers();
  }

  /* ── Line numbers ── */
  function syncLineNumbers() {
    const lines = codeEditor.value.split("\n").length;
    lineNumbers.textContent = Array.from({ length: lines }, (_, i) => i + 1).join("\n");
    lineCount.textContent = `${lines} line${lines !== 1 ? "s" : ""}`;
  }

  codeEditor.addEventListener("input", syncLineNumbers);
  codeEditor.addEventListener("scroll", () => { lineNumbers.scrollTop = codeEditor.scrollTop; });
  codeEditor.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const s = codeEditor.selectionStart;
      const v = codeEditor.value;
      codeEditor.value = v.slice(0, s) + "  " + v.slice(codeEditor.selectionEnd);
      codeEditor.selectionStart = codeEditor.selectionEnd = s + 2;
      syncLineNumbers();
    }
  });

  /* ── Tab switching ── */
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const t = btn.dataset.tab;
      Object.entries(tabPanels).forEach(([key, panel]) => {
        panel.classList.toggle("active", key === t);
      });
    });
  });

  /* ── Session Timer ── */
  function startTimer() {
    if (sessionInterval) return;
    sessionInterval = setInterval(() => {
      sessionSeconds++;
      const m = String(Math.floor(sessionSeconds / 60)).padStart(2, "0");
      const s = String(sessionSeconds % 60).padStart(2, "0");
      sessionTimer.textContent = `${m}:${s}`;
    }, 1000);
  }

  /* ── Run Code ── */
  runBtn.addEventListener("click", async () => {
    const seq = ++currentRunSeq;
    runStatus.textContent = "Running";
    runStatus.className = "ri-status-badge ri-status-running";
    terminalOutput.innerHTML = `<span class="ri-terminal-placeholder">Compiling & executing...</span>`;

    const { output, errors } = await riExecuteCode(langSelect.value, codeEditor.value);
    if (seq !== currentRunSeq) return;

    terminalOutput.innerHTML = "";
    if (errors.length > 0) {
      errors.forEach(err => {
        const el = document.createElement("span");
        el.style.color = "#f87171";
        el.textContent = err;
        terminalOutput.appendChild(el);
      });
      runStatus.textContent = "Error";
      runStatus.className = "ri-status-badge ri-status-error";
    } else if (output.length > 0) {
      output.forEach(line => {
        const el = document.createElement("span");
        el.textContent = line;
        terminalOutput.appendChild(el);
      });
      runStatus.textContent = "Done";
      runStatus.className = "ri-status-badge ri-status-done";
    } else {
      terminalOutput.innerHTML = `<span class="ri-terminal-placeholder">Executed with no stdout output.</span>`;
      runStatus.textContent = "Done";
      runStatus.className = "ri-status-badge ri-status-done";
    }
  });

  /* ── Generate Questions ── */
  generateBtn.addEventListener("click", () => {
    const code = codeEditor.value.trim();
    if (code.length < 20) {
      showRINotification("Please write at least 20 characters of code before generating questions.", "warning");
      return;
    }

    const key  = problemSelect.value;
    const lang = langSelect.value;

    /* Show spinner */
    Object.values(tabPanels).forEach(p => p.style.display = "none");
    generatingOverlay.classList.add("active");
    generateBtn.disabled = true;
    startTimer();

    /* Simulate analysis delay for realism */
    setTimeout(() => {
      const codeQs = generateCodeQuestions(code, lang, key);
      const edgeQs = generateEdgeCaseQuestions(code, lang, key);
      const optQs  = generateOptimizationQuestions(code, lang, key);

      allQuestions = { code: codeQs, edge: edgeQs, opt: optQs };

      /* Clear panels */
      generatingOverlay.classList.remove("active");
      Object.values(tabPanels).forEach(p => { p.style.display = ""; p.innerHTML = ""; });
      tabPanels.code.classList.add("active");

      /* Render each tab */
      [
        { key: "code", qs: codeQs },
        { key: "edge", qs: edgeQs },
        { key: "opt",  qs: optQs  }
      ].forEach(({ key, qs }) => {
        if (qs.length === 0) {
          tabPanels[key].innerHTML = `<div class="ri-empty-state"><div class="ri-empty-icon">🔍</div><p>No questions generated for this category. Try a more complex solution.</p></div>`;
        } else {
          qs.forEach((q, i) => tabPanels[key].appendChild(renderQuestionCard(q, key, i)));
        }
        tabCounts[key].textContent = qs.length;
        if (chipCounts[key]) chipCounts[key].textContent = qs.length;
      });

      /* Update tab active state */
      tabBtns.forEach(b => b.classList.toggle("active", b.dataset.tab === "code"));
      Object.entries(tabPanels).forEach(([k, p]) => p.classList.toggle("active", k === "code"));

      /* Update hero & summary */
      const total = codeQs.length + edgeQs.length + optQs.length;
      if (heroTotal) heroTotal.textContent = total;
      summaryBar.style.display = "flex";
      faangRow.style.display   = "flex";

      generateBtn.disabled = false;
      showRINotification(`🎤 ${total} FAANG interview questions generated! Good luck.`, "success");

      /* Log to Mistake DNA if available */
      if (typeof logMistake === "function" && edgeQs.length > 0) {
        // passive hint: edge case questions imply areas to watch
      }

      /* Scroll to questions panel on mobile */
      if (window.innerWidth <= 1100) {
        document.getElementById("tabPanelCode")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 1400);
  });

  /* ── Copy Questions ── */
  copyBtn.addEventListener("click", () => {
    if (allQuestions.code.length === 0 && allQuestions.edge.length === 0 && allQuestions.opt.length === 0) {
      showRINotification("Generate questions first!", "warning");
      return;
    }
    let text = `=== FAANG Reverse Interview — ${RI_PROBLEMS[problemSelect.value]?.title || "Custom Problem"} ===\n\n`;
    const sections = [
      { label: "CODE-SPECIFIC QUESTIONS", qs: allQuestions.code },
      { label: "EDGE CASE QUESTIONS",     qs: allQuestions.edge },
      { label: "OPTIMIZATION QUESTIONS",  qs: allQuestions.opt  }
    ];
    sections.forEach(({ label, qs }) => {
      text += `── ${label} ──\n`;
      qs.forEach((q, i) => {
        text += `Q${i + 1} [${q.difficulty.toUpperCase()}]: ${q.text}\n`;
        if (q.followup) text += `  ↪ ${q.followup}\n`;
        text += "\n";
      });
    });
    navigator.clipboard.writeText(text)
      .then(() => showRINotification("Questions copied to clipboard!", "success"))
      .catch(() => showRINotification("Copy failed — please select and copy manually.", "error"));
  });

  /* ── Notification helper ── */
  function showRINotification(msg, type = "info") {
    if (typeof showNotification === "function") {
      showNotification(msg, type);
      return;
    }
    const n = document.createElement("div");
    n.style.cssText = `position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;background:${type === "success" ? "#10b981" : type === "warning" ? "#f59e0b" : "#ef4444"};color:#000;font-weight:700;padding:0.75rem 1.25rem;border-radius:10px;font-size:0.88rem;box-shadow:0 4px 20px rgba(0,0,0,0.4);animation:riSlideIn 0.3s ease;`;
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3500);
  }

  /* ── Problem / Language change handlers ── */
  problemSelect.addEventListener("change", loadProblem);
  langSelect.addEventListener("change", () => {
    const key  = problemSelect.value;
    const lang = langSelect.value;
    const pd   = RI_PROBLEMS[key];
    if (pd?.templates?.[lang]) {
      codeEditor.value = pd.templates[lang];
      syncLineNumbers();
    }
  });

  /* ── Initial load ── */
  loadProblem();
  syncLineNumbers();
}
