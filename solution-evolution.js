document.addEventListener("DOMContentLoaded", () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  initDarkMode();
  initEvolution();
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
  if (localStorage.getItem("darkMode") === "light") { document.body.classList.add("light-mode"); icon?.classList.replace("fa-moon", "fa-sun"); }
  toggle.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");
    const isLight = document.body.classList.contains("light-mode");
    icon?.classList.toggle("fa-moon", !isLight);
    icon?.classList.toggle("fa-sun", isLight);
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

/* ─── Problem Data ─── */
const PROBLEMS = [
  {
    id: "two-sum",
    title: "Two Sum",
    diff: "easy",
    tags: ["Array", "HashMap"],
    desc: "Given an array of integers nums and a target, return indices of the two numbers that add up to target. Exactly one solution exists.",
    example: "Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]  →  nums[0] + nums[1] = 9",
    steps: [
      {
        tier: "brute",
        label: "🔴 Brute Force",
        timeComp: "O(n²)",
        spaceComp: "O(1)",
        insight: "Check every pair of elements. For each element, scan all remaining elements for the complement.",
        improvement: { type: "warn", text: "Two nested loops — too slow for large inputs. Times out on n = 10⁵." },
        code: `function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
}`
      },
      {
        tier: "optimized",
        label: "🟡 Optimized",
        timeComp: "O(n log n)",
        spaceComp: "O(n)",
        insight: "Sort the array, then use two pointers. But sorting destroys original indices — track them separately.",
        improvement: { type: "warn", text: "Better than O(n²), but sorting adds overhead and index tracking is messy." },
        code: `function twoSum(nums, target) {
  const indexed = nums.map((val, i) => [val, i]);
  indexed.sort((a, b) => a[0] - b[0]);
  let lo = 0, hi = indexed.length - 1;
  while (lo < hi) {
    const sum = indexed[lo][0] + indexed[hi][0];
    if (sum === target) return [indexed[lo][1], indexed[hi][1]];
    else if (sum < target) lo++;
    else hi--;
  }
}`
      },
      {
        tier: "best",
        label: "🟢 Optimal",
        timeComp: "O(n)",
        spaceComp: "O(n)",
        insight: "HashMap stores each value and its index. For each element, check if its complement already exists in the map — one pass.",
        improvement: { type: "good", text: "Single pass. O(1) lookup per element via HashMap. This is the interview gold standard." },
        code: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
}`
      }
    ],
    chart: [
      { label: "Brute Force",  complexity: "O(n²)",      pct: 95, tier: "brute"     },
      { label: "Two Pointers", complexity: "O(n log n)", pct: 55, tier: "optimized" },
      { label: "HashMap",      complexity: "O(n)",       pct: 15, tier: "best"      },
    ]
  },
  {
    id: "max-subarray",
    title: "Maximum Subarray",
    diff: "medium",
    tags: ["Array", "DP", "Divide & Conquer"],
    desc: "Given an integer array, find the contiguous subarray with the largest sum and return its sum.",
    example: "Input: nums = [-2,1,-3,4,-1,2,1,-5,4]\nOutput: 6  →  [4,-1,2,1]",
    steps: [
      {
        tier: "brute",
        label: "🔴 Brute Force",
        timeComp: "O(n³)",
        spaceComp: "O(1)",
        insight: "Generate all subarrays, compute each sum, track the maximum. Three nested loops.",
        improvement: { type: "warn", text: "O(n³) — extremely slow. Times out even on n = 1000." },
        code: `function maxSubArray(nums) {
  let maxSum = -Infinity;
  for (let i = 0; i < nums.length; i++) {
    for (let j = i; j < nums.length; j++) {
      let sum = 0;
      for (let k = i; k <= j; k++) sum += nums[k];
      maxSum = Math.max(maxSum, sum);
    }
  }
  return maxSum;
}`
      },
      {
        tier: "optimized",
        label: "🟡 Optimized",
        timeComp: "O(n²)",
        spaceComp: "O(1)",
        insight: "Eliminate the inner sum loop by extending the running sum as j increases. Still O(n²) but with a smaller constant.",
        improvement: { type: "warn", text: "Removes one loop but still quadratic. Acceptable for n ≤ 10⁴, not for n = 10⁵." },
        code: `function maxSubArray(nums) {
  let maxSum = -Infinity;
  for (let i = 0; i < nums.length; i++) {
    let sum = 0;
    for (let j = i; j < nums.length; j++) {
      sum += nums[j];
      maxSum = Math.max(maxSum, sum);
    }
  }
  return maxSum;
}`
      },
      {
        tier: "best",
        label: "🟢 Optimal — Kadane's Algorithm",
        timeComp: "O(n)",
        spaceComp: "O(1)",
        insight: "Track the running sum. If it goes negative, reset to 0 — a negative prefix only hurts the sum. Track the global max throughout.",
        improvement: { type: "good", text: "Single pass, constant space. Kadane's is the classic O(n) solution — must know for interviews." },
        code: `function maxSubArray(nums) {
  let maxSum = nums[0];
  let currentSum = nums[0];
  for (let i = 1; i < nums.length; i++) {
    currentSum = Math.max(nums[i], currentSum + nums[i]);
    maxSum = Math.max(maxSum, currentSum);
  }
  return maxSum;
}`
      }
    ],
    chart: [
      { label: "Brute Force",  complexity: "O(n³)", pct: 100, tier: "brute"     },
      { label: "Two Loops",    complexity: "O(n²)", pct: 60,  tier: "optimized" },
      { label: "Kadane's",     complexity: "O(n)",  pct: 12,  tier: "best"      },
    ]
  },
  {
    id: "contains-duplicate",
    title: "Contains Duplicate",
    diff: "easy",
    tags: ["Array", "HashSet", "Sorting"],
    desc: "Given an integer array, return true if any value appears at least twice, and false if every element is distinct.",
    example: "Input: nums = [1,2,3,1]\nOutput: true\n\nInput: nums = [1,2,3,4]\nOutput: false",
    steps: [
      {
        tier: "brute",
        label: "🔴 Brute Force",
        timeComp: "O(n²)",
        spaceComp: "O(1)",
        insight: "Compare every element with every other element. If any two match, return true.",
        improvement: { type: "warn", text: "O(n²) — redundant comparisons. Each pair is checked once but there are n²/2 pairs." },
        code: `function containsDuplicate(nums) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] === nums[j]) return true;
    }
  }
  return false;
}`
      },
      {
        tier: "optimized",
        label: "🟡 Sort First",
        timeComp: "O(n log n)",
        spaceComp: "O(1)",
        insight: "Sort the array. Duplicates will be adjacent. One pass to check neighbors after sorting.",
        improvement: { type: "warn", text: "Better asymptotically than O(n²) but mutates the input and pays the sort cost." },
        code: `function containsDuplicate(nums) {
  nums.sort((a, b) => a - b);
  for (let i = 0; i < nums.length - 1; i++) {
    if (nums[i] === nums[i + 1]) return true;
  }
  return false;
}`
      },
      {
        tier: "best",
        label: "🟢 Optimal — HashSet",
        timeComp: "O(n)",
        spaceComp: "O(n)",
        insight: "Add each element to a Set. If it's already there — duplicate found. Early exit on first match.",
        improvement: { type: "good", text: "O(n) time with O(1) lookup per element. Cleanest and fastest — early exit makes average case even better." },
        code: `function containsDuplicate(nums) {
  const seen = new Set();
  for (const num of nums) {
    if (seen.has(num)) return true;
    seen.add(num);
  }
  return false;
}`
      }
    ],
    chart: [
      { label: "Brute Force", complexity: "O(n²)",      pct: 90, tier: "brute"     },
      { label: "Sort",        complexity: "O(n log n)", pct: 50, tier: "optimized" },
      { label: "HashSet",     complexity: "O(n)",       pct: 12, tier: "best"      },
    ]
  },
  {
    id: "longest-substring",
    title: "Longest Substring",
    diff: "medium",
    tags: ["String", "Sliding Window", "HashMap"],
    desc: "Find the length of the longest substring without repeating characters.",
    example: "Input: s = 'abcabcbb'\nOutput: 3  →  'abc'\n\nInput: s = 'pwwkew'\nOutput: 3  →  'wke'",
    steps: [
      {
        tier: "brute",
        label: "🔴 Brute Force",
        timeComp: "O(n³)",
        spaceComp: "O(min(n,m))",
        insight: "Generate all substrings, check each one for uniqueness using a Set, track the longest.",
        improvement: { type: "warn", text: "O(n³) — three nested operations. Checking uniqueness per substring is the bottleneck." },
        code: `function lengthOfLongestSubstring(s) {
  function allUnique(sub) {
    return new Set(sub).size === sub.length;
  }
  let max = 0;
  for (let i = 0; i < s.length; i++) {
    for (let j = i + 1; j <= s.length; j++) {
      if (allUnique(s.slice(i, j)))
        max = Math.max(max, j - i);
    }
  }
  return max;
}`
      },
      {
        tier: "optimized",
        label: "🟡 Sliding Window + Set",
        timeComp: "O(2n) = O(n)",
        spaceComp: "O(min(n,m))",
        insight: "Use two pointers. Expand right. When duplicate found, shrink left one step at a time until duplicate is removed.",
        improvement: { type: "warn", text: "Linear but the left pointer can move up to n times per right step in worst case — still O(n) but slower in practice." },
        code: `function lengthOfLongestSubstring(s) {
  const set = new Set();
  let left = 0, max = 0;
  for (let right = 0; right < s.length; right++) {
    while (set.has(s[right])) {
      set.delete(s[left]);
      left++;
    }
    set.add(s[right]);
    max = Math.max(max, right - left + 1);
  }
  return max;
}`
      },
      {
        tier: "best",
        label: "🟢 Optimal — HashMap Jump",
        timeComp: "O(n)",
        spaceComp: "O(min(n,m))",
        insight: "Store last seen index of each character. When duplicate found, jump left directly to last_seen + 1 — skip the while loop entirely.",
        improvement: { type: "good", text: "True O(n) — left pointer jumps directly, never iterates. Each character visited exactly once." },
        code: `function lengthOfLongestSubstring(s) {
  const map = new Map();
  let left = 0, max = 0;
  for (let right = 0; right < s.length; right++) {
    if (map.has(s[right]) && map.get(s[right]) >= left) {
      left = map.get(s[right]) + 1; // jump directly
    }
    map.set(s[right], right);
    max = Math.max(max, right - left + 1);
  }
  return max;
}`
      }
    ],
    chart: [
      { label: "Brute Force",    complexity: "O(n³)", pct: 100, tier: "brute"     },
      { label: "Window + Set",   complexity: "O(2n)", pct: 40,  tier: "optimized" },
      { label: "Window + Map",   complexity: "O(n)",  pct: 15,  tier: "best"      },
    ]
  },
  {
    id: "median-sorted",
    title: "Median of Two Arrays",
    diff: "hard",
    tags: ["Array", "Binary Search", "Divide & Conquer"],
    desc: "Given two sorted arrays nums1 and nums2, return the median of the two sorted arrays. The overall run time complexity should be O(log(m+n)).",
    example: "Input: nums1 = [1,3], nums2 = [2]\nOutput: 2.0\n\nInput: nums1 = [1,2], nums2 = [3,4]\nOutput: 2.5",
    steps: [
      {
        tier: "brute",
        label: "🔴 Brute Force",
        timeComp: "O((m+n) log(m+n))",
        spaceComp: "O(m+n)",
        insight: "Merge both arrays into one, sort it, find the middle element. Simple but ignores the sorted property.",
        improvement: { type: "warn", text: "Wastes the sorted property of both arrays. Sorting a merged array throws away information." },
        code: `function findMedianSortedArrays(nums1, nums2) {
  const merged = [...nums1, ...nums2].sort((a, b) => a - b);
  const mid = Math.floor(merged.length / 2);
  if (merged.length % 2 === 1) return merged[mid];
  return (merged[mid - 1] + merged[mid]) / 2;
}`
      },
      {
        tier: "optimized",
        label: "🟡 Two Pointer Merge",
        timeComp: "O(m+n)",
        spaceComp: "O(m+n)",
        insight: "Use the merge step from merge sort. Both arrays are already sorted — merge them in O(m+n) without sorting.",
        improvement: { type: "warn", text: "Correct and linear, but uses O(m+n) extra space. The problem asks for O(log(m+n)) time." },
        code: `function findMedianSortedArrays(nums1, nums2) {
  const merged = [];
  let i = 0, j = 0;
  while (i < nums1.length && j < nums2.length) {
    if (nums1[i] <= nums2[j]) merged.push(nums1[i++]);
    else merged.push(nums2[j++]);
  }
  while (i < nums1.length) merged.push(nums1[i++]);
  while (j < nums2.length) merged.push(nums2[j++]);
  const mid = Math.floor(merged.length / 2);
  return merged.length % 2 === 1
    ? merged[mid]
    : (merged[mid - 1] + merged[mid]) / 2;
}`
      },
      {
        tier: "best",
        label: "🟢 Optimal — Binary Search on Partition",
        timeComp: "O(log(min(m,n)))",
        spaceComp: "O(1)",
        insight: "Binary search on the smaller array to find the correct partition point. The partition divides both arrays such that left half ≤ right half globally.",
        improvement: { type: "good", text: "Optimal solution — O(log(min(m,n))) time, O(1) space. Required for top-tier interviews." },
        code: `function findMedianSortedArrays(nums1, nums2) {
  if (nums1.length > nums2.length) return findMedianSortedArrays(nums2, nums1);
  const m = nums1.length, n = nums2.length;
  let lo = 0, hi = m;
  while (lo <= hi) {
    const i = Math.floor((lo + hi) / 2);
    const j = Math.floor((m + n + 1) / 2) - i;
    const maxL1 = i === 0 ? -Infinity : nums1[i - 1];
    const minR1 = i === m ?  Infinity : nums1[i];
    const maxL2 = j === 0 ? -Infinity : nums2[j - 1];
    const minR2 = j === n ?  Infinity : nums2[j];
    if (maxL1 <= minR2 && maxL2 <= minR1) {
      if ((m + n) % 2 === 1) return Math.max(maxL1, maxL2);
      return (Math.max(maxL1, maxL2) + Math.min(minR1, minR2)) / 2;
    } else if (maxL1 > minR2) hi = i - 1;
    else lo = i + 1;
  }
}`
      }
    ],
    chart: [
      { label: "Sort Merge",       complexity: "O((m+n)log)", pct: 85, tier: "brute"     },
      { label: "Two Ptr Merge",    complexity: "O(m+n)",      pct: 50, tier: "optimized" },
      { label: "Binary Search",    complexity: "O(log min)",  pct: 10, tier: "best"      },
    ]
  },
];

/* ─── Render ─── */
function renderProblem(problem) {
  // Problem card
  document.getElementById("seProblemTitle").textContent = problem.title;

  document.getElementById("seProblemMeta").innerHTML =
    `<span class="se-diff ${problem.diff}">${problem.diff}</span>`;

  document.getElementById("seProblemTags").innerHTML =
    problem.tags.map(t => `<span class="se-tag">${t}</span>`).join("");

  document.getElementById("seProblemDesc").textContent = problem.desc;
  document.getElementById("seProblemExample").textContent = problem.example;

  // Evolution track
  const track = document.getElementById("seEvolutionTrack");
  const ARROWS = ["", "⬇ Optimization 1: Reduce redundant operations", "⬇ Optimization 2: Eliminate extra loops"];

  track.innerHTML = problem.steps.map((step, i) => `
    ${i > 0 ? `<div class="se-arrow"><i class="fas fa-arrow-down"></i><span class="se-arrow-label">${ARROWS[i]}</span></div>` : ""}
    <div class="se-step ${step.tier}">
      <div class="se-step-header">
        <span class="se-step-badge"><i class="fas fa-code"></i>${step.label}</span>
        <div class="se-complexity-chips">
          <span class="se-chip">⏱ ${step.timeComp}</span>
          <span class="se-chip">💾 ${step.spaceComp}</span>
        </div>
      </div>
      <div class="se-step-insight">${step.insight}</div>
      <div class="se-code-block">
        <div class="se-code-header">
          <span class="se-code-lang">JavaScript</span>
          <button class="se-copy-btn" data-code="${encodeURIComponent(step.code)}" aria-label="Copy code">Copy</button>
        </div>
        <pre>${escapeHtml(step.code)}</pre>
      </div>
      <div class="se-improvement ${step.improvement.type}">
        <span class="se-improvement-icon">${step.improvement.type === "good" ? "✅" : "⚠️"}</span>
        <span>${step.improvement.text}</span>
      </div>
    </div>`).join("");

  // Copy buttons
  track.querySelectorAll(".se-copy-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const code = decodeURIComponent(btn.dataset.code);
      try {
        await navigator.clipboard.writeText(code);
        btn.textContent = "Copied!";
        btn.classList.add("copied");
        setTimeout(() => { btn.textContent = "Copy"; btn.classList.remove("copied"); }, 2000);
      } catch {
        btn.textContent = "Failed";
        btn.classList.add("error");
        setTimeout(() => { btn.textContent = "Copy"; btn.classList.remove("error"); }, 2000);
      }
    });
  });

  // Chart
  renderChart(problem.chart);
}

function renderChart(bars) {
  const chart = document.getElementById("seChart");
  chart.innerHTML = bars.map(b => `
    <div class="se-bar-row">
      <div class="se-bar-label">${b.label}</div>
      <div class="se-bar-track">
        <div class="se-bar-fill ${b.tier}" style="width:0" data-pct="${b.pct}">${b.complexity}</div>
      </div>
    </div>`).join("");

  // Animate bars after a tick
  requestAnimationFrame(() => {
    setTimeout(() => {
      chart.querySelectorAll(".se-bar-fill").forEach(bar => {
        bar.style.width = bar.dataset.pct + "%";
      });
    }, 100);
  });
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

/* ─── Init ─── */
function initEvolution() {
  const tabsEl = document.getElementById("seProblemTabs");
  if (!tabsEl) return;

  let active = PROBLEMS[0].id;

  tabsEl.innerHTML = PROBLEMS.map(p => `
<button
   class="se-problem-tab${p.id === active ? " active" : ""}"
   data-id="${p.id}"
   role="tab"
   aria-selected="${p.id === active ? "true" : "false"}"
   aria-controls="seProblemCard"
   aria-label="View ${p.title}">
      ${p.title}
    </button>`).join("");

  tabsEl.querySelectorAll(".se-problem-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      tabsEl.querySelectorAll(".se-problem-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      active = tab.dataset.id;
      const problem = PROBLEMS.find(p => p.id === active);
      renderProblem(problem);
    });
  });

  renderProblem(PROBLEMS[0]);
}