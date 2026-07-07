document.addEventListener("DOMContentLoaded", () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  initPatternTrainer();
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

/* ─── Patterns ─── */
const PATTERNS = [
  { key: "sliding-window", name: "Sliding Window",  icon: "🪟", hint: "Contiguous subarray/substring of variable or fixed size." },
  { key: "two-pointers",   name: "Two Pointers",    icon: "👉", hint: "Sorted array or linked list. Find pairs, remove duplicates." },
  { key: "prefix-sum",     name: "Prefix Sum",      icon: "∑",  hint: "Range sum queries. Pre-compute cumulative sums." },
  { key: "binary-search",  name: "Binary Search",   icon: "🔍", hint: "Sorted input or monotonic answer space." },
  { key: "greedy",         name: "Greedy",           icon: "💰", hint: "Local optimal choices lead to global optimum." },
  { key: "dp",             name: "Dynamic Programming", icon: "🧩", hint: "Overlapping subproblems + optimal substructure." },
];

/* ─── Questions ─── */
const QUESTIONS = [
  { id:1,  pattern:"sliding-window", diff:"easy",   company:"Amazon",    title:"Maximum Sum Subarray of Size K", text:"Given an array of integers and a number k, find the maximum sum of a contiguous subarray of size k.", constraints:"1 ≤ k ≤ n ≤ 10⁵", explanation:"The window size is fixed at k. Slide it across the array, adding the new element and removing the old one in O(1) per step." },
  { id:2,  pattern:"two-pointers",   diff:"easy",   company:"Google",    title:"Two Sum II (Sorted Input)", text:"Given a sorted array, find two numbers that add up to a target. Return their 1-indexed positions.", constraints:"2 ≤ n ≤ 3×10⁴, array is sorted", explanation:"Start one pointer at the left and one at the right. If sum < target, move left right. If sum > target, move right left." },
  { id:3,  pattern:"prefix-sum",     diff:"easy",   company:"Microsoft", title:"Range Sum Query", text:"Given an array, answer multiple queries: what is the sum of elements between index i and j (inclusive)?", constraints:"1 ≤ n, queries ≤ 10⁴", explanation:"Pre-compute a prefix sum array. Each range query becomes O(1): prefix[j+1] - prefix[i]." },
  { id:4,  pattern:"binary-search",  diff:"easy",   company:"Meta",      title:"Search in Sorted Array", text:"Given a sorted array of integers, return the index of the target. If not found, return -1.", constraints:"1 ≤ n ≤ 10⁴, array is sorted", explanation:"Classic binary search. The sorted property lets you eliminate half the search space each step." },
  { id:5,  pattern:"greedy",         diff:"easy",   company:"Amazon",    title:"Best Time to Buy and Sell Stock", text:"Given prices of a stock on each day, find the maximum profit from a single buy-sell transaction.", constraints:"1 ≤ n ≤ 10⁵", explanation:"Greedily track the minimum price seen so far. At each day, profit = price - minSeen. Track the maximum." },
  { id:6,  pattern:"dp",             diff:"easy",   company:"Google",    title:"Climbing Stairs", text:"You can climb 1 or 2 steps at a time. How many distinct ways can you reach the top of n stairs?", constraints:"1 ≤ n ≤ 45", explanation:"ways(n) = ways(n-1) + ways(n-2). Identical to Fibonacci. Overlapping subproblems make DP optimal." },
  { id:7,  pattern:"sliding-window", diff:"medium", company:"Flipkart",  title:"Longest Substring Without Repeating Characters", text:"Given a string, find the length of the longest substring that contains no repeating characters.", constraints:"0 ≤ s.length ≤ 5×10⁴", explanation:"Expand the right pointer. When a duplicate is found, shrink the left pointer until the duplicate is removed." },
  { id:8,  pattern:"two-pointers",   diff:"medium", company:"Adobe",     title:"Container With Most Water", text:"Given n vertical lines of height[i], find two lines that together with the x-axis form a container holding the most water.", constraints:"2 ≤ n ≤ 10⁵", explanation:"Place pointers at both ends. The area is limited by the shorter line, so move the shorter pointer inward." },
  { id:9,  pattern:"prefix-sum",     diff:"medium", company:"Microsoft", title:"Subarray Sum Equals K", text:"Given an array and integer k, return the number of contiguous subarrays whose sum equals k.", constraints:"1 ≤ n ≤ 2×10⁴, -1000 ≤ nums[i] ≤ 1000", explanation:"Track prefix sums in a HashMap. For each prefix[i], check if prefix[i] - k exists. That means a subarray summing to k ends here." },
  { id:10, pattern:"binary-search",  diff:"medium", company:"Google",    title:"Find Minimum in Rotated Sorted Array", text:"A sorted array was rotated at some pivot. Find the minimum element without knowing the pivot.", constraints:"1 ≤ n ≤ 5000, all unique", explanation:"Binary search on the rotation. If mid > right, minimum is in the right half. Otherwise it's in the left half." },
  { id:11, pattern:"greedy",         diff:"medium", company:"Amazon",    title:"Jump Game", text:"Given an array where each element is the max jump length, determine if you can reach the last index.", constraints:"1 ≤ n ≤ 3×10⁴, 0 ≤ nums[i] ≤ 10⁵", explanation:"Track the farthest reachable index. If current index exceeds it, return false. Greedy — always extend max reach." },
  { id:12, pattern:"dp",             diff:"medium", company:"Meta",      title:"House Robber", text:"You cannot rob two adjacent houses. Given an array of values, find the maximum amount you can rob.", constraints:"1 ≤ n ≤ 100, 0 ≤ nums[i] ≤ 400", explanation:"dp[i] = max(dp[i-1], dp[i-2] + nums[i]). Each house either skipped or robbed. Classic 1D DP." },
  { id:13, pattern:"sliding-window", diff:"medium", company:"Walmart",   title:"Minimum Window Substring", text:"Find the smallest substring of s that contains all characters of string t.", constraints:"1 ≤ s, t length ≤ 10⁵", explanation:"Expand right until window is valid. Shrink left to minimize. Track char frequencies with two maps." },
  { id:14, pattern:"two-pointers",   diff:"medium", company:"Flipkart",  title:"3Sum", text:"Find all unique triplets in an array that sum to zero.", constraints:"-10⁵ ≤ nums[i] ≤ 10⁵, 3 ≤ n ≤ 3000", explanation:"Sort first. Fix one element, use two pointers on the rest. Skip duplicates carefully." },
  { id:15, pattern:"binary-search",  diff:"medium", company:"Walmart",   title:"Koko Eating Bananas", text:"Koko can eat at most k bananas per hour. Find the minimum k so she finishes all piles within h hours.", constraints:"1 ≤ piles[i] ≤ 10⁹, piles.length ≤ h", explanation:"Binary search on the answer space [1, max(piles)]. Check if a given k is feasible in O(n)." },
  { id:16, pattern:"prefix-sum",     diff:"medium", company:"Adobe",     title:"Product of Array Except Self", text:"Return an array where output[i] is the product of all elements except nums[i]. No division allowed.", constraints:"2 ≤ n ≤ 10⁵, no zeros guaranteed", explanation:"Left prefix products × right suffix products. Two passes, no division — essentially a prefix product array." },
  { id:17, pattern:"greedy",         diff:"hard",   company:"Google",    title:"Task Scheduler", text:"Given tasks with a cooldown n, find the minimum number of CPU intervals to finish all tasks.", constraints:"1 ≤ tasks.length ≤ 10⁴, 0 ≤ n ≤ 100", explanation:"Greedily schedule the most frequent task first. Formula: max(tasks, (maxCount-1)*(n+1) + countOfMaxTasks)." },
  { id:18, pattern:"dp",             diff:"hard",   company:"Amazon",    title:"Coin Change", text:"Given coin denominations and a target amount, find the minimum number of coins to make the amount.", constraints:"1 ≤ coins.length ≤ 12, 0 ≤ amount ≤ 10⁴", explanation:"dp[i] = min coins to make amount i. Try every coin: dp[i] = min(dp[i], dp[i-coin] + 1)." },
  { id:19, pattern:"sliding-window", diff:"hard",   company:"Meta",      title:"Sliding Window Maximum", text:"Given an array and window size k, return the maximum value in each sliding window of size k.", constraints:"1 ≤ k ≤ n ≤ 10⁵", explanation:"Use a monotonic deque. Remove elements outside the window. Front of deque is always the current max." },
  { id:20, pattern:"dp",             diff:"hard",   company:"Microsoft", title:"Edit Distance", text:"Given two strings, find the minimum number of operations (insert, delete, replace) to convert one to the other.", constraints:"0 ≤ word1, word2 length ≤ 500", explanation:"2D DP. dp[i][j] = min ops to convert word1[0..i] to word2[0..j]. Three choices at each cell." },
];

/* ─── State ─── */
let state = {};

function resetState() {
  state = {
    queue:      shuffle([...QUESTIONS]),
    index:      0,
    score:      0,
    correct:    0,
    attempted:  0,
    streak:     0,
    answered:   false,
    breakdown:  Object.fromEntries(PATTERNS.map(p => [p.key, { correct: 0, total: 0 }])),
  };
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ─── Render ─── */
function renderPatternList() {
  document.getElementById("ptPatternList").innerHTML = PATTERNS.map(p => `
    <div class="pt-pattern-item">
      <span class="pt-p-icon">${p.icon}</span>
      <div>
        <div class="pt-p-name">${p.name}</div>
        <div style="font-size:0.72rem; color:var(--text-secondary); margin-top:0.1rem;">${p.hint}</div>
      </div>
    </div>`).join("");
}

function renderBreakdown() {
  const el = document.getElementById("ptBreakdown");
  el.innerHTML = PATTERNS.map(p => {
    const bd  = state.breakdown[p.key];
    const pct = bd.total > 0 ? Math.round((bd.correct / bd.total) * 100) : 0;
    return `<div class="pt-bd-row">
      <div class="pt-bd-label"><span>${p.icon} ${p.name}</span><span>${bd.correct}/${bd.total}</span></div>
      <div class="pt-bd-bar"><div class="pt-bd-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join("");
}

function renderStats() {
  document.getElementById("ptScore").textContent    = state.score;
  document.getElementById("ptCorrect").textContent  = state.correct;
  document.getElementById("ptTotal").textContent    = state.attempted;
  document.getElementById("ptStreak").textContent   = state.streak;
  const acc = state.attempted > 0 ? Math.round((state.correct / state.attempted) * 100) : 0;
  document.getElementById("ptAccuracy").textContent = acc + "%";
}

function renderQuestion() {
  if (state.index >= state.queue.length) { showResult(); return; }

  const q = state.queue[state.index];
  state.answered = false;

  document.getElementById("ptQNum").textContent     = `Question ${state.index + 1} / ${state.queue.length}`;
  document.getElementById("ptQText").textContent    = q.text;
  document.getElementById("ptConstraints").textContent = `Constraints: ${q.constraints}`;
  document.getElementById("ptQCompany").innerHTML   = `<i class="fas fa-building"></i> ${q.company}`;

  const diffEl = document.getElementById("ptDiffBadge");
  diffEl.textContent = q.diff.charAt(0).toUpperCase() + q.diff.slice(1);
  diffEl.className   = `pt-diff-badge ${q.diff}`;

  // Options — shuffled each time
  const shuffledPatterns = shuffle([...PATTERNS]);
  document.getElementById("ptOptions").innerHTML = shuffledPatterns.map(p => `
    <button class="pt-option-btn" data-key="${p.key}" aria-label="Select pattern: ${p.name}">
      <span class="pt-option-icon">${p.icon}</span>
      <span>${p.name}</span>
    </button>`).join("");

  document.querySelectorAll(".pt-option-btn").forEach(btn => {
    btn.addEventListener("click", () => handleAnswer(btn.dataset.key, q));
  });

  document.getElementById("ptFeedback").classList.add("hidden");
  document.getElementById("ptNextBtn").classList.add("hidden");
}

function handleAnswer(selected, q) {
  if (state.answered) return;
  state.answered = true;
  state.attempted++;

  const isCorrect = selected === q.pattern;
  if (isCorrect) { state.score += { easy: 10, medium: 20, hard: 30 }[q.diff]; state.correct++; state.streak++; }
  else           { state.streak = 0; }

  state.breakdown[q.pattern].total++;
  if (isCorrect) state.breakdown[q.pattern].correct++;

  // Style buttons
  document.querySelectorAll(".pt-option-btn").forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.key === q.pattern && isCorrect)  btn.classList.add("correct");
    if (btn.dataset.key === selected  && !isCorrect) btn.classList.add("wrong");
    if (btn.dataset.key === q.pattern && !isCorrect) btn.classList.add("reveal");
  });

  // Feedback
  const feedbackEl = document.getElementById("ptFeedback");
  feedbackEl.className = `pt-feedback ${isCorrect ? "correct" : "wrong"}`;
  feedbackEl.classList.remove("hidden");

  const pattern = PATTERNS.find(p => p.key === q.pattern);
  document.getElementById("ptFeedbackIcon").textContent = isCorrect ? "✅" : "❌";
  document.getElementById("ptFeedbackTitle").textContent = isCorrect
    ? `Correct! This is a ${pattern.name} problem.`
    : `Not quite. The correct pattern is ${pattern.name} ${pattern.icon}`;
  document.getElementById("ptFeedbackText").textContent = q.explanation;

  document.getElementById("ptNextBtn").classList.remove("hidden");
  renderStats();
  renderBreakdown();
}

function showResult() {
  const acc = state.attempted > 0 ? Math.round((state.correct / state.attempted) * 100) : 0;
  let grade = "🌟 Expert";
  if (acc < 50) grade = "📚 Keep Practicing";
  else if (acc < 70) grade = "👍 Good Effort";
  else if (acc < 90) grade = "🔥 Great Job";

  document.getElementById("ptResultBody").innerHTML = `
    <div class="pt-result-score">${state.score}</div>
    <div class="pt-result-label">Total Score — ${grade}</div>
    <div class="pt-result-grid">
      <div class="pt-result-stat"><span>${state.correct}</span><label>Correct</label></div>
      <div class="pt-result-stat"><span>${acc}%</span><label>Accuracy</label></div>
      <div class="pt-result-stat"><span>${state.streak}</span><label>Final Streak</label></div>
    </div>`;

  document.getElementById("ptResultModal").classList.add("active");
}

/* ─── Init ─── */
function initPatternTrainer() {
  if (!document.getElementById("ptOptions")) return;

  renderPatternList();
  resetState();
  renderStats();
  renderBreakdown();
  renderQuestion();

  document.getElementById("ptNextBtn").addEventListener("click", () => {
    state.index++;
    renderQuestion();
  });

  document.getElementById("ptSkipBtn").addEventListener("click", () => {
    if (state.answered) return;
    state.index++;
    renderQuestion();
  });

  document.getElementById("ptRestartBtn").addEventListener("click", () => {
    resetState();
    renderStats();
    renderBreakdown();
    renderQuestion();
    document.getElementById("ptResultModal").classList.remove("active");
  });

  document.getElementById("ptPlayAgainBtn").addEventListener("click", () => {
    document.getElementById("ptResultModal").classList.remove("active");
    resetState();
    renderStats();
    renderBreakdown();
    renderQuestion();
  });
}