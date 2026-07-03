document.addEventListener("DOMContentLoaded", () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  initDarkMode();
  initDetectiveMode();
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

function initDarkMode() {
  const toggle = document.getElementById("darkModeToggle");
  if (!toggle) return;
  const icon = toggle.querySelector("i");
  if (localStorage.getItem("darkMode") === "light") { document.documentElement.classList.add("light-mode"); icon.classList.replace("fa-moon", "fa-sun"); }
  toggle.addEventListener("click", () => {
    document.documentElement.classList.toggle("light-mode");
    const isLight = document.documentElement.classList.contains("light-mode");
    icon.classList.toggle("fa-moon", !isLight);
    icon.classList.toggle("fa-sun", isLight);
    localStorage.setItem("darkMode", isLight ? "light" : "dark");
  });
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

/* ─── Clue Categories ─── */
const CLUE_CATEGORIES = [
  { key: "data-structure",  name: "Data Structure",     icon: "📦", level: "easy"   },
  { key: "operation",       name: "Core Operation",     icon: "⚙️",  level: "easy"   },
  { key: "complexity",      name: "Time Complexity",    icon: "⏱️",  level: "medium" },
  { key: "input-property",  name: "Input Property",     icon: "📋", level: "medium" },
  { key: "technique",       name: "Key Technique",      icon: "🔧", level: "medium" },
  { key: "edge-case",       name: "Edge Case / Tip",    icon: "⚠️", level: "hard"   },
];

/* ─── Case Data ─── */
const CASES = [
  {
    id: 1,
    title: "Find a target value in a sorted collection",
    difficulty: "easy",
    answer: "Binary Search",
    answerIcon: "🔍",
    clues: [
      { category: "data-structure", text: "Input is a sorted array or list" },
      { category: "operation",      text: "Search for a specific target value" },
      { category: "complexity",     text: "Goal: O(log n) time complexity" },
      { category: "input-property", text: "Array has no duplicates" },
      { category: "technique",      text: "Eliminate half the search space each step" },
      { category: "edge-case",      text: "Handle target not present in array" },
    ],
    explanation: "Binary search works on sorted data by repeatedly dividing the search interval in half. Each comparison eliminates half the remaining elements, achieving O(log n)."
  },
  {
    id: 2,
    title: "Find the maximum sum of a contiguous subarray of size k",
    difficulty: "easy",
    answer: "Sliding Window",
    answerIcon: "🪟",
    clues: [
      { category: "data-structure", text: "Array of integers with fixed window size k" },
      { category: "operation",      text: "Compute sum for each contiguous window" },
      { category: "complexity",     text: "Goal: O(n) time, O(1) space" },
      { category: "input-property", text: "Window size k is given and constant" },
      { category: "technique",      text: "Add new element entering, remove old leaving" },
      { category: "edge-case",      text: "k equals array length — single window" },
    ],
    explanation: "Fixed-size sliding window: maintain a running sum by adding the incoming element and subtracting the outgoing one, avoiding redundant recalculation."
  },
  {
    id: 3,
    title: "Find two numbers that add up to a target in a sorted array",
    difficulty: "easy",
    answer: "Two Pointers",
    answerIcon: "👉",
    clues: [
      { category: "data-structure", text: "Sorted array of integers" },
      { category: "operation",      text: "Find a pair summing to a target" },
      { category: "complexity",     text: "Goal: O(n) time, O(1) space" },
      { category: "input-property", text: "Exactly one valid solution exists" },
      { category: "technique",      text: "Start pointers at both ends, move inward" },
      { category: "edge-case",      text: "Same element cannot be used twice" },
    ],
    explanation: "Two pointers on a sorted array: if sum is too small, move left pointer right; if too large, move right pointer left. Sorted order guarantees correctness."
  },
  {
    id: 4,
    title: "Count all subarrays whose sum equals k",
    difficulty: "medium",
    answer: "Prefix Sum + HashMap",
    answerIcon: "∑",
    clues: [
      { category: "data-structure", text: "Array of integers (may contain negatives)" },
      { category: "operation",      text: "Count contiguous subarrays with sum = k" },
      { category: "complexity",     text: "Goal: O(n) time complexity" },
      { category: "input-property", text: "Negative numbers allowed in array" },
      { category: "technique",      text: "Store prefix sums in a HashMap for O(1) lookup" },
      { category: "edge-case",      text: "Prefix sum itself equals k (subarray starts at index 0)" },
    ],
    explanation: "If prefix[j] - prefix[i] = k, then the subarray from i+1 to j sums to k. Store each prefix sum count in a HashMap and check complement."
  },
  {
    id: 5,
    title: "Find the minimum number of coins to make a target amount",
    difficulty: "medium",
    answer: "Dynamic Programming",
    answerIcon: "🧩",
    clues: [
      { category: "data-structure", text: "Array of coin denominations and a target amount" },
      { category: "operation",      text: "Minimize the number of coins used" },
      { category: "complexity",     text: "Goal: O(amount × coins) time" },
      { category: "input-property", text: "Infinite supply of each coin denomination" },
      { category: "technique",      text: "dp[i] = min coins to make amount i" },
      { category: "edge-case",      text: "Return -1 if amount cannot be made" },
    ],
    explanation: "Unbounded knapsack pattern: for each amount, try every coin and take the minimum. dp[i] = min(dp[i], dp[i - coin] + 1) for each coin."
  },
  {
    id: 6,
    title: "Find the longest substring without repeating characters",
    difficulty: "medium",
    answer: "Sliding Window",
    answerIcon: "🪟",
    clues: [
      { category: "data-structure", text: "String of characters" },
      { category: "operation",      text: "Find length of longest unique substring" },
      { category: "complexity",     text: "Goal: O(n) time complexity" },
      { category: "input-property", text: "Variable window size — expand and contract" },
      { category: "technique",      text: "Use a HashSet to track characters in window" },
      { category: "edge-case",      text: "Empty string returns 0; all same chars returns 1" },
    ],
    explanation: "Variable-size sliding window: expand right to include new chars; when a duplicate is found, shrink left until valid. Track max length throughout."
  },
  {
    id: 7,
    title: "Determine if you can reach the last index of an array",
    difficulty: "medium",
    answer: "Greedy",
    answerIcon: "💰",
    clues: [
      { category: "data-structure", text: "Array where each element is max jump length" },
      { category: "operation",      text: "Check reachability to last index" },
      { category: "complexity",     text: "Goal: O(n) time, O(1) space" },
      { category: "input-property", text: "Non-negative integers, starting at index 0" },
      { category: "technique",      text: "Track the farthest reachable index" },
      { category: "edge-case",      text: "If current index exceeds farthest, return false" },
    ],
    explanation: "Greedy: at each index, update the farthest reachable position. If current index > farthest, you're stuck. Otherwise, you can always reach the end."
  },
  {
    id: 8,
    title: "Find the maximum profit from a single buy-sell transaction",
    difficulty: "easy",
    answer: "Greedy",
    answerIcon: "💰",
    clues: [
      { category: "data-structure", text: "Array of daily stock prices" },
      { category: "operation",      text: "Maximize profit from one buy then one sell" },
      { category: "complexity",     text: "Goal: O(n) time, O(1) space" },
      { category: "input-property", text: "Must buy before you can sell" },
      { category: "technique",      text: "Track minimum price seen so far" },
      { category: "edge-case",      text: "No profit possible return 0 (prices decreasing)" },
    ],
    explanation: "Greedily track the minimum price. At each day, profit = price - minSeen. Update max profit if this is better. One pass, O(n)."
  },
  {
    id: 9,
    title: "Climb n stairs taking 1 or 2 steps at a time",
    difficulty: "easy",
    answer: "Dynamic Programming",
    answerIcon: "🧩",
    clues: [
      { category: "data-structure", text: "Integer n (number of stairs)" },
      { category: "operation",      text: "Count distinct ways to reach the top" },
      { category: "complexity",     text: "Goal: O(n) time, O(1) space" },
      { category: "input-property", text: "Fibonacci-like recurrence: f(n) = f(n-1) + f(n-2)" },
      { category: "technique",      text: "Overlapping subproblems — use DP" },
      { category: "edge-case",      text: "n=1 → 1 way, n=2 → 2 ways" },
    ],
    explanation: "ways(n) = ways(n-1) + ways(n-2). Identical to Fibonacci sequence. Only need previous two values, so O(1) space with two variables."
  },
  {
    id: 10,
    title: "Find the minimum element in a rotated sorted array",
    difficulty: "medium",
    answer: "Binary Search",
    answerIcon: "🔍",
    clues: [
      { category: "data-structure", text: "Rotated sorted array with unique elements" },
      { category: "operation",      text: "Find the minimum (pivot) element" },
      { category: "complexity",     text: "Goal: O(log n) time complexity" },
      { category: "input-property", text: "Array was sorted then rotated at unknown pivot" },
      { category: "technique",      text: "Compare mid with right to decide which half" },
      { category: "edge-case",      text: "Not rotated (first element is minimum)" },
    ],
    explanation: "Modified binary search: if mid > right, min is in right half; otherwise in left half. The rotation breaks sorted order exactly once."
  },
  {
    id: 11,
    title: "Find all unique triplets that sum to zero",
    difficulty: "medium",
    answer: "Two Pointers",
    answerIcon: "👉",
    clues: [
      { category: "data-structure", text: "Array of integers" },
      { category: "operation",      text: "Find all unique triplets with sum = 0" },
      { category: "complexity",     text: "Goal: O(n²) time complexity" },
      { category: "input-property", text: "Sort first, then fix one element" },
      { category: "technique",      text: "Two pointers on remaining array for each fixed element" },
      { category: "edge-case",      text: "Skip duplicate elements to avoid duplicate triplets" },
    ],
    explanation: "Sort the array. Fix one element, use two pointers on the rest. Skip duplicates at every level to ensure unique triplets."
  },
  {
    id: 12,
    title: "Find the maximum amount you can rob without robbing adjacent houses",
    difficulty: "medium",
    answer: "Dynamic Programming",
    answerIcon: "🧩",
    clues: [
      { category: "data-structure", text: "Array of non-negative integers (house values)" },
      { category: "operation",      text: "Maximize sum without selecting adjacent elements" },
      { category: "complexity",     text: "Goal: O(n) time, O(1) space" },
      { category: "input-property", text: "Cannot rob two neighboring houses" },
      { category: "technique",      text: "dp[i] = max(dp[i-1], dp[i-2] + nums[i])" },
      { category: "edge-case",      text: "Single house → rob it; two houses → max of both" },
    ],
    explanation: "At each house, either skip it (take prev best) or rob it (add to best from two houses back). Classic 1D DP, reducible to two variables."
  },
  {
    id: 13,
    title: "Find the smallest substring containing all characters of another string",
    difficulty: "hard",
    answer: "Sliding Window",
    answerIcon: "🪟",
    clues: [
      { category: "data-structure", text: "Two strings: source s and target t" },
      { category: "operation",      text: "Find minimum window in s covering all of t" },
      { category: "complexity",     text: "Goal: O(n + m) time complexity" },
      { category: "input-property", text: "Target may have duplicate characters" },
      { category: "technique",      text: "Expand right to satisfy, shrink left to minimize" },
      { category: "edge-case",      text: "No valid window exists → return empty string" },
    ],
    explanation: "Variable sliding window with character frequency maps. Expand until window is valid, then shrink from left to find minimum. Track required vs. formed counts."
  },
  {
    id: 14,
    title: "Find the minimum k so Koko finishes all banana piles within h hours",
    difficulty: "medium",
    answer: "Binary Search",
    answerIcon: "🔍",
    clues: [
      { category: "data-structure", text: "Array of pile sizes and integer h (hours)" },
      { category: "operation",      text: "Find minimum eating speed k" },
      { category: "complexity",     text: "Goal: O(n log m) where m = max pile" },
      { category: "input-property", text: "Binary search on answer space [1, max(piles)]" },
      { category: "technique",      text: "Check feasibility of a given k in O(n)" },
      { category: "edge-case",      text: "h equals piles.length → must eat max pile per hour" },
    ],
    explanation: "Binary search on the answer: for a candidate k, check if sum(ceil(pile/k)) <= h. Narrow search space based on feasibility."
  },
  {
    id: 15,
    title: "Return product of all elements except self at each index",
    difficulty: "medium",
    answer: "Prefix Sum",
    answerIcon: "∑",
    clues: [
      { category: "data-structure", text: "Array of integers, no zeros guaranteed" },
      { category: "operation",      text: "Output[i] = product of all except nums[i]" },
      { category: "complexity",     text: "Goal: O(n) time, O(1) extra space" },
      { category: "input-property", text: "Division is not allowed" },
      { category: "technique",      text: "Left prefix products × right suffix products" },
      { category: "edge-case",      text: "Single element array → return [1]" },
    ],
    explanation: "Two passes: first builds left prefix products, second multiplies right suffix products. Essentially prefix/suffix product arrays combined."
  },
  {
    id: 16,
    title: "Find the maximum number of CPU intervals to finish tasks with cooldown",
    difficulty: "hard",
    answer: "Greedy",
    answerIcon: "💰",
    clues: [
      { category: "data-structure", text: "Array of task types and cooldown integer n" },
      { category: "operation",      text: "Schedule all tasks with minimum intervals" },
      { category: "complexity",     text: "Goal: O(n) time (where n = number of tasks)" },
      { category: "input-property", text: "Same task type needs at least n gap between" },
      { category: "technique",      text: "Schedule most frequent task first" },
      { category: "edge-case",      text: "If enough idle tasks exist, result = tasks.length" },
    ],
    explanation: "Greedy formula: max(totalTasks, (maxFreq-1)*(n+1) + countOfMaxFreq). The most frequent task creates the framework, others fill gaps."
  },
  {
    id: 17,
    title: "Find the maximum value in each sliding window of size k",
    difficulty: "hard",
    answer: "Sliding Window + Monotonic Deque",
    answerIcon: "🪟",
    clues: [
      { category: "data-structure", text: "Array of integers and window size k" },
      { category: "operation",      text: "Return maximum for each window position" },
      { category: "complexity",     text: "Goal: O(n) time complexity" },
      { category: "input-property", text: "Each element enters and leaves deque at most once" },
      { category: "technique",      text: "Monotonic deque: front always holds current max" },
      { category: "edge-case",      text: "Remove indices outside window from deque front" },
    ],
    explanation: "Maintain a deque of indices in decreasing order of values. Remove from back if new element is larger. Pop front if it's outside the window."
  },
  {
    id: 18,
    title: "Find minimum operations to convert one string to another",
    difficulty: "hard",
    answer: "Dynamic Programming",
    answerIcon: "🧩",
    clues: [
      { category: "data-structure", text: "Two strings of potentially different lengths" },
      { category: "operation",      text: "Min insert, delete, or replace operations" },
      { category: "complexity",     text: "Goal: O(m × n) time and space" },
      { category: "input-property", text: "2D DP table: dp[i][j] for prefixes" },
      { category: "technique",      text: "dp[i][j] = min of three choices at each cell" },
      { category: "edge-case",      text: "Empty string → operations = other string's length" },
    ],
    explanation: "2D edit distance DP: dp[i][j] = min cost to convert word1[0..i] to word2[0..j]. Match: dp[i-1][j-1]. Insert/delete/replace:相应的 dp transitions."
  },
  {
    id: 19,
    title: "Find the longest increasing subsequence in an array",
    difficulty: "hard",
    answer: "Dynamic Programming / Binary Search",
    answerIcon: "🧩",
    clues: [
      { category: "data-structure", text: "Array of integers" },
      { category: "operation",      text: "Find length of longest strictly increasing subsequence" },
      { category: "complexity",     text: "Goal: O(n log n) with patience sorting" },
      { category: "input-property", text: "Subsequence need not be contiguous" },
      { category: "technique",      text: "Maintain tails array, binary search for placement" },
      { category: "edge-case",      text: "All decreasing → length 1; already sorted → length n" },
    ],
    explanation: "tails[i] = smallest tail element for LIS of length i+1. For each num, binary search to find or extend. O(n log n) patience sorting approach."
  },
  {
    id: 20,
    title: "Find all subsets of a set that sum to a target",
    difficulty: "hard",
    answer: "Backtracking",
    answerIcon: "🔙",
    clues: [
      { category: "data-structure", text: "Array of integers and a target sum" },
      { category: "operation",      text: "Find all unique subsets summing to target" },
      { category: "complexity",     text: "Goal: O(2^n) — exponential is unavoidable" },
      { category: "input-property", text: "May contain duplicate elements" },
      { category: "technique",      text: "Choose or skip each element, backtrack on path" },
      { category: "edge-case",      text: "Sort first, skip duplicates at same level" },
    ],
    explanation: "Backtracking: at each element, either include it (subtract from target) or skip it. When target = 0, record the subset. Sort and skip duplicates."
  },
  {
    id: 21,
    title: "Detect a cycle in an linked structure",
    difficulty: "easy",
    answer: "Fast & Slow Pointers",
    answerIcon: "🏃",
    clues: [
      { category: "data-structure", text: "Singly linked list or equivalent sequence" },
      { category: "operation",      text: "Detect whether a cycle exists" },
      { category: "complexity",     text: "Goal: O(n) time, O(1) space" },
      { category: "input-property", text: "No extra memory for a HashSet allowed" },
      { category: "technique",      text: "Two pointers move at different speeds" },
      { category: "edge-case",      text: "Single node pointing to itself is a cycle" },
    ],
    explanation: "Floyd's cycle detection: slow moves 1 step, fast moves 2. If they meet, a cycle exists. O(1) space — no hash set needed."
  },
  {
    id: 22,
    title: "Find the median of two sorted arrays in O(log(min(m,n)))",
    difficulty: "hard",
    answer: "Binary Search",
    answerIcon: "🔍",
    clues: [
      { category: "data-structure", text: "Two sorted arrays of different sizes" },
      { category: "operation",      text: "Find median of combined sorted array" },
      { category: "complexity",     text: "Goal: O(log(min(m,n))) time" },
      { category: "input-property", text: "Partition arrays so left half = right half" },
      { category: "technique",      text: "Binary search on partition of smaller array" },
      { category: "edge-case",      text: "One array entirely in left or right half" },
    ],
    explanation: "Binary search on the partition of the smaller array. Ensure maxLeft <= minRight on both sides. The trick is partitioning, not merging."
  },
  {
    id: 23,
    title: "Serialize and deserialize a binary tree",
    difficulty: "hard",
    answer: "BFS / DFS + String",
    answerIcon: "🌳",
    clues: [
      { category: "data-structure", text: "Binary tree with integer values" },
      { category: "operation",      text: "Convert tree to string and back" },
      { category: "complexity",     text: "Goal: O(n) time for both operations" },
      { category: "input-property", text: "Must handle null nodes to preserve structure" },
      { category: "technique",      text: "Pre-order traversal with null markers" },
      { category: "edge-case",      text: "Empty tree serializes to empty string or '#'" },
    ],
    explanation: "Pre-order DFS: write value, then recursively left and right. Use a marker (like '#') for nulls. Deserialize by reading tokens in the same order."
  },
  {
    id: 24,
    title: "Find the smallest range covering elements from k sorted lists",
    difficulty: "hard",
    answer: "Sliding Window + Min Heap",
    answerIcon: "🪟",
    clues: [
      { category: "data-structure", text: "k sorted arrays or lists" },
      { category: "operation",      text: "Find smallest range [a,b] with element from each list" },
      { category: "complexity",     text: "Goal: O(N log k) where N = total elements" },
      { category: "input-property", text: "Must include at least one element from every list" },
      { category: "technique",      text: "Min heap tracks current min, slide window to include all" },
      { category: "edge-case",      text: "All lists have same element → range of 0" },
    ],
    explanation: "Merge k sorted lists with a min heap. Track which list each element comes from. Expand range to cover all k lists, shrink from left when possible."
  },
];

/* ─── Answer Options (pool for guess buttons) ─── */
const ALL_ANSWERS = [
  "Binary Search",
  "Sliding Window",
  "Two Pointers",
  "Prefix Sum",
  "Dynamic Programming",
  "Greedy",
  "Backtracking",
  "Fast & Slow Pointers",
  "Sliding Window + Monotonic Deque",
  "Sliding Window + Min Heap",
  "Binary Search / Dynamic Programming",
  "BFS / DFS + String",
];

/* ─── State ─── */
let state = {};

function resetState(count) {
  const caseCount = count || 15;
  const shuffled = shuffle([...CASES]);
  state = {
    queue:         shuffled.slice(0, Math.min(caseCount, shuffled.length)),
    index:         0,
    score:         0,
    correct:       0,
    attempted:     0,
    streak:        0,
    maxStreak:     0,
    cluesRevealed: 0,
    totalClues:    0,
    answered:      false,
    caseResults:   [],
    caseCount:     Math.min(caseCount, shuffled.length),
    breakdown:     { easy: { correct: 0, total: 0 }, medium: { correct: 0, total: 0 }, hard: { correct: 0, total: 0 } },
  };
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ─── Rendering ─── */
function renderCategoryList() {
  document.getElementById("ddCategoryList").innerHTML = CLUE_CATEGORIES.map(c => `
    <div class="dd-category-item">
      <span class="dd-c-icon">${c.icon}</span>
      <span class="dd-c-name">${c.name}</span>
      <span class="dd-c-level ${c.level}">${c.level}</span>
    </div>`).join("");
}

function renderBreakdown() {
  const el = document.getElementById("ddBreakdown");
  el.innerHTML = ["easy", "medium", "hard"].map(diff => {
    const bd  = state.breakdown[diff];
    const pct = bd.total > 0 ? Math.round((bd.correct / bd.total) * 100) : 0;
    const label = diff.charAt(0).toUpperCase() + diff.slice(1);
    return `<div class="dd-bd-row">
      <div class="dd-bd-label"><span>${label}</span><span>${bd.correct}/${bd.total}</span></div>
      <div class="dd-bd-bar"><div class="dd-bd-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join("");
}

function renderStats() {
  document.getElementById("ddScore").textContent    = state.score;
  document.getElementById("ddCorrect").textContent  = state.correct;
  document.getElementById("ddTotal").textContent    = state.attempted;
  document.getElementById("ddStreak").textContent   = state.streak;
  const acc = state.attempted > 0 ? Math.round((state.correct / state.attempted) * 100) : 0;
  document.getElementById("ddAccuracy").textContent = acc + "%";
  document.getElementById("ddClueLevel").textContent = state.cluesRevealed;
}

function getShuffledGuessOptions(correctAnswer) {
  const others = ALL_ANSWERS.filter(a => a !== correctAnswer);
  const picked = shuffle(others).slice(0, 5);
  return shuffle([correctAnswer, ...picked]);
}

function renderCase() {
  if (state.index >= state.queue.length) { showResult(); return; }

  const c = state.queue[state.index];
  state.answered = false;
  state.cluesRevealed = 0;

  document.getElementById("ddCaseNum").textContent = `Case ${state.index + 1} / ${state.queue.length}`;
  document.getElementById("ddCaseTitle").textContent = c.title;

  const diffEl = document.getElementById("ddDiffBadge");
  diffEl.textContent = c.difficulty.charAt(0).toUpperCase() + c.difficulty.slice(1);
  diffEl.className   = `dd-diff-badge ${c.difficulty}`;

  // Build clue list (all locked initially)
  const clueListEl = document.getElementById("ddClueList");
  clueListEl.innerHTML = c.clues.map((clue, i) => {
    const cat = CLUE_CATEGORIES.find(cc => cc.key === clue.category);
    return `<div class="dd-clue-item locked" data-index="${i}" id="ddClue-${i}">
      <span class="dd-clue-icon">${cat ? cat.icon : "❓"}</span>
      <span class="dd-clue-text">${clue.text}</span>
    </div>`;
  }).join("");

  // Update total clues counter
  state.totalClues = c.clues.length;

  // Reveal first clue immediately
  revealNextClue(c);

  // Build guess options
  const guessOptions = getShuffledGuessOptions(c.answer);
  document.getElementById("ddGuessOptions").innerHTML = guessOptions.map(ans => {
    const caseObj = CASES.find(cc => cc.answer === ans);
    const icon = caseObj ? caseObj.answerIcon : "❓";
    return `<button class="dd-guess-btn" data-answer="${ans}" aria-label="Guess: ${ans}">
      <span class="dd-guess-icon">${icon}</span>
      <span>${ans}</span>
    </button>`;
  }).join("");

  document.querySelectorAll(".dd-guess-btn").forEach(btn => {
    btn.addEventListener("click", () => handleGuess(btn.dataset.answer, c));
  });

  document.getElementById("ddFeedback").classList.add("hidden");
  document.getElementById("ddNextBtn").classList.add("hidden");

  // Update reveal button state
  const revealBtn = document.getElementById("ddRevealBtn");
  revealBtn.disabled = state.cluesRevealed >= c.clues.length;

  renderStats();
}

function revealNextClue(caseData) {
  if (state.cluesRevealed >= caseData.clues.length) return;

  const idx = state.cluesRevealed;
  const clueEl = document.getElementById(`ddClue-${idx}`);
  if (clueEl) {
    clueEl.classList.remove("locked");
    clueEl.style.animation = "dd-clue-in 0.35s ease";
  }
  state.cluesRevealed++;

  // Update reveal button
  const revealBtn = document.getElementById("ddRevealBtn");
  revealBtn.disabled = state.cluesRevealed >= caseData.clues.length;
}

function handleGuess(selected, caseData) {
  if (state.answered) return;
  state.answered = true;
  state.attempted++;

  const isCorrect = selected === caseData.answer;
  const cluesUsed = state.cluesRevealed;

  // Scoring: fewer clues = more points, plus difficulty and streak bonuses
  let points = 0;
  if (isCorrect) {
    const basePoints = { easy: 50, medium: 100, hard: 150 }[caseData.difficulty];
    const clueBonus = Math.max(0, (caseData.clues.length - cluesUsed) * 10);
    const streakBonus = Math.min(state.streak * 5, 50);
    points = basePoints + clueBonus + streakBonus;
    state.score += points;
    state.correct++;
    state.streak++;
    if (state.streak > state.maxStreak) state.maxStreak = state.streak;
  } else {
    const penalty = { easy: 15, medium: 25, hard: 35 }[caseData.difficulty] || 20;
    state.score = Math.max(0, state.score - penalty);
    points = -penalty;
    state.streak = 0;
  }

  state.breakdown[caseData.difficulty].total++;
  if (isCorrect) state.breakdown[caseData.difficulty].correct++;

  // Reveal all remaining clues
  while (state.cluesRevealed < caseData.clues.length) {
    revealNextClue(caseData);
  }

  // Style guess buttons
  document.querySelectorAll(".dd-guess-btn").forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.answer === caseData.answer && isCorrect)  btn.classList.add("correct");
    if (btn.dataset.answer === selected  && !isCorrect) btn.classList.add("wrong");
    if (btn.dataset.answer === caseData.answer && !isCorrect) btn.classList.add("reveal");
  });

  // Feedback
  const feedbackEl = document.getElementById("ddFeedback");
  feedbackEl.className = `dd-feedback ${isCorrect ? "correct" : "wrong"}`;
  feedbackEl.classList.remove("hidden");

  document.getElementById("ddFeedbackIcon").textContent = isCorrect ? "✅" : "❌";
  document.getElementById("ddFeedbackTitle").textContent = isCorrect
    ? `Solved! The answer is ${caseData.answer} ${caseData.answerIcon}`
    : `Not quite. The answer is ${caseData.answer} ${caseData.answerIcon}`;
  document.getElementById("ddFeedbackText").innerHTML = isCorrect
    ? `<strong>+${points} pts</strong> (${cluesUsed} clue${cluesUsed !== 1 ? "s" : ""} used) — ${caseData.explanation}`
    : `<strong>${points} pts</strong> — ${caseData.explanation}`;

  // Record result
  state.caseResults.push({
    title: caseData.title,
    answer: caseData.answer,
    correct: isCorrect,
    points,
    difficulty: caseData.difficulty,
    cluesUsed,
  });

  document.getElementById("ddNextBtn").classList.remove("hidden");
  document.getElementById("ddRevealBtn").disabled = true;
  renderStats();
  renderBreakdown();
}

function showResult() {
  const acc = state.attempted > 0 ? Math.round((state.correct / state.attempted) * 100) : 0;
  let grade = "🔍 Master Detective";
  let gradeIcon = "🕵️";
  if (acc < 50) { grade = "📓 Rookie Investigator"; gradeIcon = "📓"; }
  else if (acc < 70) { grade = "🔎 Sharp Eye"; gradeIcon = "🔎"; }
  else if (acc < 90) { grade = "🕵️ Seasoned Detective"; gradeIcon = "🕵️"; }

  const resultsHtml = state.caseResults.map(r => `
    <div class="dd-result-case">
      <span class="dd-rc-icon">${r.correct ? "✅" : "❌"}</span>
      <span class="dd-rc-name" title="${r.title}">${r.title}</span>
      <span class="dd-rc-diff ${r.difficulty}">${r.difficulty.charAt(0).toUpperCase()}</span>
      <span class="dd-rc-pts">${r.points > 0 ? "+" + r.points : r.points}</span>
    </div>`).join("");

  document.getElementById("ddResultBody").innerHTML = `
    <div class="dd-result-score-wrap">
      <div class="dd-result-score">${state.score}</div>
      <div class="dd-result-score-label">Total Score</div>
    </div>
    <div class="dd-result-grade">${gradeIcon} ${grade.replace(/^.{2}/, "")}</div>
    <div class="dd-result-grid">
      <div class="dd-result-stat">
        <div class="dd-result-stat-icon">✅</div>
        <span>${state.correct}</span>
        <label>Correct</label>
      </div>
      <div class="dd-result-stat">
        <div class="dd-result-stat-icon">🎯</div>
        <span>${acc}%</span>
        <label>Accuracy</label>
      </div>
      <div class="dd-result-stat">
        <div class="dd-result-stat-icon">🔥</div>
        <span>${state.maxStreak}</span>
        <label>Best Streak</label>
      </div>
    </div>
    <div class="dd-result-breakdown-wrap">
      <div class="dd-result-breakdown">
        <h4>Case Log <span>${state.correct}/${state.attempted}</span></h4>
        ${resultsHtml}
      </div>
    </div>`;

  document.getElementById("ddResultModal").classList.add("active");
  document.body.style.overflow = "hidden";
}

/* ─── Count Selector ─── */
function initCountSelector() {
  const options = document.getElementById("ddCountOptions");
  if (!options) return;
  options.addEventListener("click", (e) => {
    const btn = e.target.closest(".dd-count-btn");
    if (!btn || btn.classList.contains("active")) return;
    options.querySelectorAll(".dd-count-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const count = parseInt(btn.dataset.count, 10);
    closeResultModal();
    resetState(count);
    renderStats();
    renderBreakdown();
    renderCase();
  });
}

/* ─── Init ─── */
function initDetectiveMode() {
  if (!document.getElementById("ddGuessOptions")) return;

  renderCategoryList();
  initCountSelector();
  resetState(15);
  renderStats();
  renderBreakdown();
  renderCase();

  document.getElementById("ddRevealBtn").addEventListener("click", () => {
    const c = state.queue[state.index];
    revealNextClue(c);
  });

  document.getElementById("ddNextBtn").addEventListener("click", () => {
    state.index++;
    renderCase();
  });

  document.getElementById("ddRestartBtn").addEventListener("click", () => {
    const count = state.caseCount || 15;
    closeResultModal();
    resetState(count);
    renderStats();
    renderBreakdown();
    renderCase();
  });

  document.getElementById("ddPlayAgainBtn").addEventListener("click", () => {
    const count = state.caseCount || 15;
    closeResultModal();
    resetState(count);
    renderStats();
    renderBreakdown();
    renderCase();
  });

  document.getElementById("ddResultCloseBtn").addEventListener("click", closeResultModal);

  document.getElementById("ddResultModal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeResultModal();
  });
}

function closeResultModal() {
  document.getElementById("ddResultModal").classList.remove("active");
  document.body.style.overflow = "";
}
