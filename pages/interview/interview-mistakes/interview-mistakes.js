document.addEventListener("DOMContentLoaded", () => {
  initLoadingScreen();
  initNavbar();
  initScrollTop();
  initMistakes();
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

/* ─── Data ─── */
const MISTAKES = [
  // ARRAYS
  {
    id: 1, cat: "arrays", severity: "high",
    title: "Ignoring Empty Array Input",
    desc: "Accessing arr[0] or arr.length-1 without checking if array is empty causes runtime errors.",
    wrongCode: `function findMax(arr) {\n  let max = arr[0]; // ❌ crashes if arr = []\n  for (let i = 1; i < arr.length; i++)\n    if (arr[i] > max) max = arr[i];\n  return max;\n}`,
    rightCode: `function findMax(arr) {\n  if (!arr || arr.length === 0) return null; // ✅\n  let max = arr[0];\n  for (let i = 1; i < arr.length; i++)\n    if (arr[i] > max) max = arr[i];\n  return max;\n}`,
    why: "An empty array is a valid input in most problems. Always guard against it before accessing indices.",
    wrongTime: "O(n) but crashes", rightTime: "O(n)",
    wrongSpace: "O(1) but unsafe",  rightSpace: "O(1)",
  },
  {
    id: 2, cat: "arrays", severity: "high",
    title: "Off-by-One in Loop Bounds",
    desc: "Using < vs <= incorrectly in loop conditions causes missing the last element or out-of-bounds access.",
    wrongCode: `// ❌ Misses last element\nfor (let i = 0; i < arr.length - 1; i++) {\n  console.log(arr[i]);\n}`,
    rightCode: `// ✅ Iterates all elements\nfor (let i = 0; i < arr.length; i++) {\n  console.log(arr[i]);\n}`,
    why: "Off-by-one errors are the most common source of bugs. Always verify your loop start and end explicitly.",
    wrongTime: "O(n-1) — wrong", rightTime: "O(n)",
    wrongSpace: "O(1)", rightSpace: "O(1)",
  },
  {
    id: 3, cat: "arrays", severity: "medium",
    title: "Nested Loop When HashMap Works",
    desc: "Using O(n²) nested loops for pair/lookup problems when a HashMap gives O(n).",
    wrongCode: `// ❌ Two Sum — O(n²)\nfunction twoSum(nums, target) {\n  for (let i = 0; i < nums.length; i++)\n    for (let j = i+1; j < nums.length; j++)\n      if (nums[i] + nums[j] === target)\n        return [i, j];\n}`,
    rightCode: `// ✅ Two Sum — O(n)\nfunction twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) return [map.get(complement), i];\n    map.set(nums[i], i);\n  }\n}`,
    why: "Nested loops are the interviewer's first red flag. HashMap trades O(n) space for O(n) time — almost always the right call.",
    wrongTime: "O(n²)", rightTime: "O(n)",
    wrongSpace: "O(1)", rightSpace: "O(n)",
  },
  {
    id: 4, cat: "arrays", severity: "medium",
    title: "Mutating Input Array",
    desc: "Sorting or modifying the input array when the original order must be preserved.",
    wrongCode: `// ❌ Sorts the original array\nfunction findKthLargest(nums, k) {\n  nums.sort((a, b) => b - a); // mutates input!\n  return nums[k - 1];\n}`,
    rightCode: `// ✅ Work on a copy\nfunction findKthLargest(nums, k) {\n  const sorted = [...nums].sort((a, b) => b - a);\n  return sorted[k - 1];\n}`,
    why: "Always clarify if input can be modified. When in doubt, spread/clone before sorting.",
    wrongTime: "O(n log n)", rightTime: "O(n log n)",
    wrongSpace: "O(1) but destructive", rightSpace: "O(n)",
  },
  {
    id: 5, cat: "arrays", severity: "low",
    title: "Not Handling Negative Numbers in Sliding Window",
    desc: "Assuming all values are positive when using sliding window — breaks when negatives are present.",
    wrongCode: `// ❌ Assumes positive values only\nfunction maxSubarrayLength(nums, k) {\n  let sum = 0, left = 0, maxLen = 0;\n  for (let right = 0; right < nums.length; right++) {\n    sum += nums[right];\n    while (sum > k) sum -= nums[left++]; // wrong with negatives\n    maxLen = Math.max(maxLen, right - left + 1);\n  }\n  return maxLen;\n}`,
    rightCode: `// ✅ Use prefix sum + HashMap for negative values\nfunction maxSubarrayLength(nums, k) {\n  const map = new Map([[0, -1]]);\n  let sum = 0, maxLen = 0;\n  for (let i = 0; i < nums.length; i++) {\n    sum += nums[i];\n    if (map.has(sum - k)) maxLen = Math.max(maxLen, i - map.get(sum - k));\n    if (!map.has(sum)) map.set(sum, i);\n  }\n  return maxLen;\n}`,
    why: "Sliding window shrink logic relies on monotonically increasing sums — violated by negatives. Switch to prefix sum.",
    wrongTime: "O(n) but incorrect", rightTime: "O(n)",
    wrongSpace: "O(1)", rightSpace: "O(n)",
  },

  // STRINGS
  {
    id: 6, cat: "strings", severity: "high",
    title: "Case Sensitivity Not Handled",
    desc: "Comparing strings without normalizing case — 'Hello' !== 'hello' causes wrong answers.",
    wrongCode: `// ❌ Case sensitive comparison\nfunction isPalindrome(s) {\n  return s === s.split('').reverse().join('');\n}`,
    rightCode: `// ✅ Normalize before comparing\nfunction isPalindrome(s) {\n  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');\n  return clean === clean.split('').reverse().join('');\n}`,
    why: "Most string problems are case-insensitive unless stated otherwise. Always lowercase and strip non-alphanumeric chars first.",
    wrongTime: "O(n)", rightTime: "O(n)",
    wrongSpace: "O(n)", rightSpace: "O(n)",
  },
  {
    id: 7, cat: "strings", severity: "medium",
    title: "String Concatenation in Loop",
    desc: "Using += inside a loop creates O(n²) due to string immutability — use an array and join instead.",
    wrongCode: `// ❌ O(n²) — new string created each iteration\nfunction repeat(str, n) {\n  let result = '';\n  for (let i = 0; i < n; i++) result += str;\n  return result;\n}`,
    rightCode: `// ✅ O(n) — join at the end\nfunction repeat(str, n) {\n  const parts = [];\n  for (let i = 0; i < n; i++) parts.push(str);\n  return parts.join('');\n}`,
    why: "Strings are immutable in JS. Each += allocates a new string. Array.join() builds the result once.",
    wrongTime: "O(n²)", rightTime: "O(n)",
    wrongSpace: "O(n²)", rightSpace: "O(n)",
  },
  {
    id: 8, cat: "strings", severity: "medium",
    title: "Incorrect Substring Handling",
    desc: "Using indexOf for substring existence check instead of includes, or wrong slice indices.",
    wrongCode: `// ❌ Brittle — indexOf returns -1 not false\nif (str.indexOf('abc')) {\n  // Bug: indexOf returns 0 when found at start!\n  // 0 is falsy in JS\n}`,
    rightCode: `// ✅ Use includes() for boolean check\nif (str.includes('abc')) {\n  // correct\n}`,
    why: "indexOf returns 0 when the substring is at position 0, which is falsy in JavaScript. Always use includes() for boolean checks.",
    wrongTime: "O(n)", rightTime: "O(n)",
    wrongSpace: "O(1)", rightSpace: "O(1)",
  },
  {
    id: 9, cat: "strings", severity: "low",
    title: "Unicode / Multi-byte Character Issues",
    desc: "Using str.length or str[i] breaks on emoji and multi-byte Unicode characters.",
    wrongCode: `const s = '😀abc';\nconsole.log(s.length);   // ❌ Returns 5, not 4\nconsole.log(s[0]);        // ❌ Returns half of emoji`,
    rightCode: `const s = '😀abc';\nconsole.log([...s].length); // ✅ Returns 4\nconsole.log([...s][0]);     // ✅ Returns '😀'`,
    why: "JavaScript strings use UTF-16 encoding. Emoji and some characters are represented as surrogate pairs. Spread with [...s] to get real characters.",
    wrongTime: "O(n)", rightTime: "O(n)",
    wrongSpace: "O(1)", rightSpace: "O(n) for spread",
  },
  {
    id: 10, cat: "strings", severity: "medium",
    title: "Wrong Anagram Check",
    desc: "Sorting both strings to check anagram is correct but O(n log n). HashMap is O(n).",
    wrongCode: `// ❌ O(n log n)\nfunction isAnagram(s, t) {\n  return s.split('').sort().join('') ===\n         t.split('').sort().join('');\n}`,
    rightCode: `// ✅ O(n)\nfunction isAnagram(s, t) {\n  if (s.length !== t.length) return false;\n  const map = {};\n  for (const c of s) map[c] = (map[c] || 0) + 1;\n  for (const c of t) {\n    if (!map[c]) return false;\n    map[c]--;\n  }\n  return true;\n}`,
    why: "Sorting works but is suboptimal. Character frequency counting is O(n) with O(1) space (only 26 lowercase letters).",
    wrongTime: "O(n log n)", rightTime: "O(n)",
    wrongSpace: "O(n)", rightSpace: "O(1)",
  },

  // LINKED LISTS
  {
    id: 11, cat: "linked-lists", severity: "high",
    title: "Losing Head Reference",
    desc: "Moving the head pointer directly loses access to the start of the list.",
    wrongCode: `// ❌ head is now lost\nfunction printList(head) {\n  while (head !== null) {\n    console.log(head.val);\n    head = head.next; // original head is gone!\n  }\n}`,
    rightCode: `// ✅ Use a separate pointer\nfunction printList(head) {\n  let curr = head; // preserve head\n  while (curr !== null) {\n    console.log(curr.val);\n    curr = curr.next;\n  }\n}`,
    why: "The head pointer is your only reference to the list. Never move it — always create a traversal pointer.",
    wrongTime: "O(n)", rightTime: "O(n)",
    wrongSpace: "O(1) but destructive", rightSpace: "O(1)",
  },
  {
    id: 12, cat: "linked-lists", severity: "high",
    title: "Null Pointer Exception in Traversal",
    desc: "Accessing node.next.val without checking if node.next is null causes crash.",
    wrongCode: `// ❌ Crashes when curr is the last node\nwhile (curr.next.val !== target) {\n  curr = curr.next;\n}`,
    rightCode: `// ✅ Check curr and curr.next\nwhile (curr !== null && curr.next !== null) {\n  if (curr.next.val === target) break;\n  curr = curr.next;\n}`,
    why: "Always guard both the current node and the next node before accessing properties.",
    wrongTime: "O(n) but crashes", rightTime: "O(n)",
    wrongSpace: "O(1)", rightSpace: "O(1)",
  },
  {
    id: 13, cat: "linked-lists", severity: "medium",
    title: "Incorrect Pointer Update Order in Reversal",
    desc: "Updating next before saving it causes the rest of the list to be lost.",
    wrongCode: `// ❌ Loses the rest of the list\nlet prev = null, curr = head;\nwhile (curr) {\n  curr.next = prev;  // next is overwritten before saving!\n  prev = curr;\n  curr = curr.next;  // curr.next is now prev — infinite loop\n}`,
    rightCode: `// ✅ Save next before overwriting\nlet prev = null, curr = head;\nwhile (curr) {\n  const next = curr.next; // save first\n  curr.next = prev;\n  prev = curr;\n  curr = next;\n}`,
    why: "Pointer operations must be done in the correct order. Save next before reassigning curr.next.",
    wrongTime: "O(n) but broken", rightTime: "O(n)",
    wrongSpace: "O(1)", rightSpace: "O(1)",
  },
  {
    id: 14, cat: "linked-lists", severity: "medium",
    title: "Not Using Dummy Node for Edge Cases",
    desc: "Handling head deletion separately makes code complex. Dummy node simplifies it.",
    wrongCode: `// ❌ Special case for head removal\nfunction removeVal(head, val) {\n  if (head.val === val) return head.next;\n  let curr = head;\n  while (curr.next && curr.next.val !== val)\n    curr = curr.next;\n  if (curr.next) curr.next = curr.next.next;\n  return head;\n}`,
    rightCode: `// ✅ Dummy node eliminates head special case\nfunction removeVal(head, val) {\n  const dummy = { val: 0, next: head };\n  let curr = dummy;\n  while (curr.next) {\n    if (curr.next.val === val) curr.next = curr.next.next;\n    else curr = curr.next;\n  }\n  return dummy.next;\n}`,
    why: "Dummy nodes make head removal identical to any other node removal — no special casing needed.",
    wrongTime: "O(n)", rightTime: "O(n)",
    wrongSpace: "O(1)", rightSpace: "O(1)",
  },
  {
    id: 15, cat: "linked-lists", severity: "low",
    title: "Forgetting to Check Cycle Before Traversal",
    desc: "Traversing a cyclic linked list causes an infinite loop.",
    wrongCode: `// ❌ Infinite loop if list has cycle\nfunction getLength(head) {\n  let len = 0;\n  while (head) { len++; head = head.next; }\n  return len;\n}`,
    rightCode: `// ✅ Detect cycle first with Floyd's algorithm\nfunction hasCycle(head) {\n  let slow = head, fast = head;\n  while (fast && fast.next) {\n    slow = slow.next;\n    fast = fast.next.next;\n    if (slow === fast) return true;\n  }\n  return false;\n}`,
    why: "Always clarify if the input could contain cycles. Use Floyd's tortoise and hare for O(1) space detection.",
    wrongTime: "∞ if cycle", rightTime: "O(n)",
    wrongSpace: "O(1)", rightSpace: "O(1)",
  },

  // TREES
  {
    id: 16, cat: "trees", severity: "high",
    title: "Missing Base Case in Recursion",
    desc: "Not returning when node is null causes NullPointerException in tree recursion.",
    wrongCode: `// ❌ Crashes on null node\nfunction height(node) {\n  return 1 + Math.max(height(node.left), height(node.right));\n}`,
    rightCode: `// ✅ Base case first\nfunction height(node) {\n  if (node === null) return 0;\n  return 1 + Math.max(height(node.left), height(node.right));\n}`,
    why: "Every recursive tree function needs a null check as the base case. This is the #1 tree interview mistake.",
    wrongTime: "Crashes", rightTime: "O(n)",
    wrongSpace: "O(h) but crashes", rightSpace: "O(h)",
  },
  {
    id: 17, cat: "trees", severity: "high",
    title: "Confusing DFS and BFS for Shortest Path",
    desc: "Using DFS to find the shortest path in an unweighted tree/graph — DFS does not guarantee shortest path.",
    wrongCode: `// ❌ DFS — finds A path, not shortest\nfunction dfsShortestPath(root, target) {\n  if (!root) return -1;\n  if (root.val === target) return 0;\n  const left = dfsShortestPath(root.left, target);\n  if (left !== -1) return left + 1;\n  const right = dfsShortestPath(root.right, target);\n  return right !== -1 ? right + 1 : -1;\n}`,
    rightCode: `// ✅ BFS — guarantees shortest path\nfunction bfsShortestPath(root, target) {\n  const queue = [[root, 0]];\n  while (queue.length) {\n    const [node, depth] = queue.shift();\n    if (!node) continue;\n    if (node.val === target) return depth;\n    queue.push([node.left, depth+1], [node.right, depth+1]);\n  }\n  return -1;\n}`,
    why: "BFS explores level by level — the first time it reaches a target, it's the shortest path. DFS has no such guarantee.",
    wrongTime: "O(n) but wrong", rightTime: "O(n)",
    wrongSpace: "O(h)", rightSpace: "O(w) — width of tree",
  },
  {
    id: 18, cat: "trees", severity: "medium",
    title: "Incorrect BST Validation",
    desc: "Only comparing node with immediate children — doesn't validate full BST invariant.",
    wrongCode: `// ❌ Only checks direct children\nfunction isValidBST(node) {\n  if (!node) return true;\n  if (node.left && node.left.val >= node.val) return false;\n  if (node.right && node.right.val <= node.val) return false;\n  return isValidBST(node.left) && isValidBST(node.right);\n}`,
    rightCode: `// ✅ Pass min/max bounds down\nfunction isValidBST(node, min=-Infinity, max=Infinity) {\n  if (!node) return true;\n  if (node.val <= min || node.val >= max) return false;\n  return isValidBST(node.left, min, node.val) &&\n         isValidBST(node.right, node.val, max);\n}`,
    why: "A node's value must satisfy all ancestor constraints, not just its parent. Pass min/max bounds recursively.",
    wrongTime: "O(n) but wrong", rightTime: "O(n)",
    wrongSpace: "O(h)", rightSpace: "O(h)",
  },
  {
    id: 19, cat: "trees", severity: "medium",
    title: "Incorrect Recursion Return in Tree Search",
    desc: "Not returning the recursive call result causes the function to always return undefined.",
    wrongCode: `// ❌ Missing return — always returns undefined\nfunction search(root, val) {\n  if (!root) return null;\n  if (root.val === val) return root;\n  search(root.left, val);  // result discarded!\n  search(root.right, val);\n}`,
    rightCode: `// ✅ Return the recursive result\nfunction search(root, val) {\n  if (!root) return null;\n  if (root.val === val) return root;\n  return search(root.left, val) || search(root.right, val);\n}`,
    why: "JavaScript functions return undefined unless you explicitly return. Always return recursive calls in tree search.",
    wrongTime: "O(n) but wrong", rightTime: "O(n)",
    wrongSpace: "O(h)", rightSpace: "O(h)",
  },
  {
    id: 20, cat: "trees", severity: "low",
    title: "Using Wrong Traversal Order",
    desc: "Using preorder instead of inorder for BST sorted output, or postorder for tree deletion.",
    wrongCode: `// ❌ Preorder doesn't give sorted BST output\nfunction printSorted(node) {\n  if (!node) return;\n  console.log(node.val); // prints root first\n  printSorted(node.left);\n  printSorted(node.right);\n}`,
    rightCode: `// ✅ Inorder gives sorted output from BST\nfunction printSorted(node) {\n  if (!node) return;\n  printSorted(node.left);\n  console.log(node.val); // left → root → right\n  printSorted(node.right);\n}`,
    why: "Inorder (L→Root→R) on a BST yields values in sorted ascending order. Memorize all three traversal orders.",
    wrongTime: "O(n)", rightTime: "O(n)",
    wrongSpace: "O(h)", rightSpace: "O(h)",
  },

  // GRAPHS
  {
    id: 21, cat: "graphs", severity: "high",
    title: "Not Marking Visited Nodes",
    desc: "Forgetting to mark nodes as visited in graph traversal causes infinite loops or repeated processing.",
    wrongCode: `// ❌ No visited set — infinite loop on cycles\nfunction dfs(graph, node) {\n  console.log(node);\n  for (const neighbor of graph[node]) {\n    dfs(graph, neighbor); // revisits nodes!\n  }\n}`,
    rightCode: `// ✅ Track visited set\nfunction dfs(graph, node, visited = new Set()) {\n  if (visited.has(node)) return;\n  visited.add(node);\n  console.log(node);\n  for (const neighbor of graph[node]) {\n    dfs(graph, neighbor, visited);\n  }\n}`,
    why: "Graphs can have cycles unlike trees. A visited set is mandatory to avoid infinite recursion.",
    wrongTime: "∞ if cycle", rightTime: "O(V+E)",
    wrongSpace: "O(V) stack", rightSpace: "O(V)",
  },
  {
    id: 22, cat: "graphs", severity: "high",
    title: "Using DFS for Shortest Path in Unweighted Graph",
    desc: "DFS explores depth-first — it finds a path but not necessarily the shortest one.",
    wrongCode: `// ❌ DFS — not guaranteed shortest\nfunction shortestPath(graph, start, end) {\n  const visited = new Set();\n  function dfs(node, path) {\n    if (node === end) return path;\n    visited.add(node);\n    for (const n of graph[node])\n      if (!visited.has(n)) return dfs(n, [...path, n]);\n    return null;\n  }\n  return dfs(start, [start]);\n}`,
    rightCode: `// ✅ BFS — guaranteed shortest\nfunction shortestPath(graph, start, end) {\n  const queue = [[start, [start]]];\n  const visited = new Set([start]);\n  while (queue.length) {\n    const [node, path] = queue.shift();\n    if (node === end) return path;\n    for (const n of graph[node])\n      if (!visited.has(n)) {\n        visited.add(n);\n        queue.push([n, [...path, n]]);\n      }\n  }\n  return null;\n}`,
    why: "BFS is the correct algorithm for unweighted shortest path. Use Dijkstra for weighted graphs.",
    wrongTime: "O(V+E) but wrong", rightTime: "O(V+E)",
    wrongSpace: "O(V)", rightSpace: "O(V)",
  },
  {
    id: 23, cat: "graphs", severity: "medium",
    title: "Infinite Loop in Grid Traversal",
    desc: "Not tracking visited cells in grid BFS/DFS — revisiting cells causes infinite loops.",
    wrongCode: `// ❌ Revisits cells endlessly\nfunction countIslands(grid) {\n  let count = 0;\n  for (let r = 0; r < grid.length; r++)\n    for (let c = 0; c < grid[0].length; c++)\n      if (grid[r][c] === '1') { dfs(grid, r, c); count++; }\n  return count;\n}\nfunction dfs(grid, r, c) {\n  if (r<0||r>=grid.length||c<0||c>=grid[0].length) return;\n  if (grid[r][c] !== '1') return;\n  dfs(grid, r+1, c); dfs(grid, r-1, c); // infinite!\n}`,
    rightCode: `// ✅ Mark visited by setting to '0'\nfunction dfs(grid, r, c) {\n  if (r<0||r>=grid.length||c<0||c>=grid[0].length) return;\n  if (grid[r][c] !== '1') return;\n  grid[r][c] = '0'; // mark visited\n  dfs(grid, r+1, c); dfs(grid, r-1, c);\n  dfs(grid, r, c+1); dfs(grid, r, c-1);\n}`,
    why: "In grid problems, mark cells as visited (set to '0' or use a visited set) before recursing into them.",
    wrongTime: "∞", rightTime: "O(R×C)",
    wrongSpace: "∞", rightSpace: "O(R×C)",
  },
  {
    id: 24, cat: "graphs", severity: "medium",
    title: "Wrong Traversal Choice for Problem Type",
    desc: "Choosing DFS for level-order or BFS for path-finding with backtracking.",
    wrongCode: `// ❌ Using DFS for level-order traversal\nfunction levelOrder(root) {\n  const result = [];\n  function dfs(node, level) {\n    // This works but is unnatural and error-prone\n    if (!node) return;\n    if (!result[level]) result[level] = [];\n    dfs(node.left, level+1);\n    dfs(node.right, level+1);\n    result[level].push(node.val); // wrong order!\n  }\n  dfs(root, 0);\n  return result;\n}`,
    rightCode: `// ✅ BFS naturally groups by level\nfunction levelOrder(root) {\n  if (!root) return [];\n  const result = [], queue = [root];\n  while (queue.length) {\n    const level = [];\n    const size = queue.length;\n    for (let i = 0; i < size; i++) {\n      const node = queue.shift();\n      level.push(node.val);\n      if (node.left)  queue.push(node.left);\n      if (node.right) queue.push(node.right);\n    }\n    result.push(level);\n  }\n  return result;\n}`,
    why: "BFS naturally processes nodes level by level. Use BFS for level-order, shortest path. Use DFS for paths, cycles, topological sort.",
    wrongTime: "O(n) but error-prone", rightTime: "O(n)",
    wrongSpace: "O(h)", rightSpace: "O(w)",
  },
  {
    id: 25, cat: "graphs", severity: "low",
    title: "Not Handling Disconnected Graph Components",
    desc: "Running BFS/DFS from a single node misses disconnected components.",
    wrongCode: `// ❌ Only visits one component\nfunction countComponents(n, edges) {\n  const graph = buildGraph(n, edges);\n  const visited = new Set();\n  dfs(graph, 0, visited); // starts from 0 only!\n  return 1; // wrong!\n}`,
    rightCode: `// ✅ Start DFS from every unvisited node\nfunction countComponents(n, edges) {\n  const graph = buildGraph(n, edges);\n  const visited = new Set();\n  let count = 0;\n  for (let i = 0; i < n; i++) {\n    if (!visited.has(i)) {\n      dfs(graph, i, visited);\n      count++;\n    }\n  }\n  return count;\n}`,
    why: "Graphs may be disconnected. Always iterate over all nodes and start traversal from each unvisited one.",
    wrongTime: "O(V+E) but wrong", rightTime: "O(V+E)",
    wrongSpace: "O(V)", rightSpace: "O(V)",
  },
];

const EDGE_CASES = [
  { icon: "📭", title: "Empty Input",       desc: "arr = [], str = '', root = null, n = 0. Always guard against empty inputs first." },
  { icon: "1️⃣",  title: "Single Element",   desc: "Array of 1 element, tree with 1 node. Many algorithms have edge behavior here." },
  { icon: "🔢", title: "Duplicate Values",  desc: "Multiple identical elements — affects sorting, sets, maps, and unique-element logic." },
  { icon: "➖", title: "Negative Numbers",  desc: "Negative values break assumptions in sliding window, sum problems, and index calculations." },
  { icon: "✅", title: "Already Sorted",   desc: "Sorted input is a special case for quicksort (worst case) and binary search." },
  { icon: "📏", title: "Max Constraints",   desc: "n = 10⁵ or 10⁶ — O(n²) will TLE. Test your complexity before submitting." },
  { icon: "🔁", title: "All Same Values",   desc: "arr = [5,5,5,5] — edge case for partition, uniqueness, and frequency logic." },
  { icon: "📉", title: "Reverse Sorted",    desc: "Descending order is worst case for many sort and search algorithms." },
  { icon: "🌊", title: "All Zeros",         desc: "Can break sum-based sliding windows and division operations." },
  { icon: "🌳", title: "Skewed Tree",        desc: "All nodes on one side — height = n. O(h) becomes O(n), may cause stack overflow." },
  { icon: "🔗", title: "Cyclic Input",       desc: "Linked lists or graphs with cycles — always check before traversal." },
  { icon: "2️⃣",  title: "Two Elements",     desc: "Boundary between 'single' and 'multiple' — swap logic, head/tail cases." },
];

const OPT_TIPS = [
  { icon: "🗺️", title: "Use HashMap for O(1) Lookup",    desc: "Replace O(n) linear search with O(1) hash lookup. Most pair/frequency problems benefit from this." },
  { icon: "🪟", title: "Sliding Window over Nested Loops", desc: "O(n²) brute force on subarrays? Try a sliding window — often reduces to O(n)." },
  { icon: "∑",  title: "Prefix Sum for Range Queries",    desc: "Pre-compute cumulative sums to answer range queries in O(1) after O(n) preprocessing." },
  { icon: "🔍", title: "Binary Search the Answer Space",  desc: "If the answer is monotonic, binary search on it — common for 'minimum/maximum K' problems." },
  { icon: "💾", title: "Memoize Recursive Functions",      desc: "If you're computing the same subproblem twice, add a memo cache — turns O(2^n) to O(n)." },
  { icon: "🏃", title: "Two Pointers on Sorted Arrays",   desc: "Sorted array with pair/triplet problems? Two pointers from both ends beats nested loops." },
  { icon: "📚", title: "Stack for Matching/History",       desc: "Parentheses, next-greater-element, undo — stacks model LIFO history naturally." },
  { icon: "🌐", title: "BFS for Shortest Path",            desc: "Unweighted graph? BFS guarantees shortest path. Don't use DFS for this." },
];

/* ─── Render ─── */
function renderEdgeCases() {
  document.getElementById("imEdgeCases").innerHTML = EDGE_CASES.map(e => `
    <div class="tip-card">
      <h3>${e.icon} ${e.title}</h3>
      <p>${e.desc}</p>
    </div>`).join("");
}

function renderOptTips() {
  document.getElementById("imOptTips").innerHTML = OPT_TIPS.map(t => `
    <div class="tip-card">
      <h3>${t.icon} ${t.title}</h3>
      <p>${t.desc}</p>
    </div>`).join("");
}

function renderGrid(items) {
  const grid  = document.getElementById("imGrid");
  const empty = document.getElementById("imEmpty");
  const vis   = document.getElementById("imVisible");

  if (items.length === 0) {
    grid.innerHTML = "";
    empty.classList.remove("hidden");
    vis.textContent = 0;
    return;
  }

  empty.classList.add("hidden");
  vis.textContent = items.length;

  grid.innerHTML = items.map(m => `
    <div class="im-card" data-id="${m.id}" tabindex="0" role="button" aria-label="View mistake: ${m.title}">
      <div>
        <div class="im-card-top">
          <span class="im-cat-badge">${m.cat.replace("-", " ")}</span>
          <span class="im-severity ${m.severity}">${m.severity}</span>
        </div>
        <h3>${m.title}</h3>
        <p class="im-card-desc">${m.desc}</p>
      </div>
      <div class="im-card-footer">
        <span class="im-wrong-label">❌ ${m.wrongTime}</span>
        <span class="im-fix-label">✅ ${m.rightTime}</span>
      </div>
    </div>`).join("");

  grid.querySelectorAll(".im-card").forEach(card => {
    const open = () => openModal(parseInt(card.dataset.id));
    card.addEventListener("click", open);
    card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") open(); });
  });
}

function openModal(id) {
  const m = MISTAKES.find(x => x.id === id);
  if (!m) return;

  document.getElementById("imModalTitle").textContent = m.title;

  const catEl = document.getElementById("imModalCat");
  catEl.textContent = m.cat.replace("-", " ");

  const sevEl = document.getElementById("imModalSeverity");
  sevEl.textContent = m.severity;
  sevEl.className = `im-severity ${m.severity}`;

  document.getElementById("imModalBody").innerHTML = `
    <div class="im-modal-section">
      <div class="im-modal-section-title wrong"><i class="fas fa-times-circle"></i> Wrong Approach</div>
      <pre class="im-code wrong-code">${m.wrongCode}</pre>
    </div>
    <div class="im-modal-section">
      <div class="im-modal-section-title right"><i class="fas fa-check-circle"></i> Correct Approach</div>
      <pre class="im-code right-code">${m.rightCode}</pre>
    </div>
    <div class="im-modal-section">
      <div class="im-modal-section-title why"><i class="fas fa-lightbulb"></i> Why It Fails</div>
      <div class="im-why-text">${m.why}</div>
    </div>
    <div class="im-modal-section">
      <div class="im-modal-section-title complexity"><i class="fas fa-clock"></i> Complexity Comparison</div>
      <div class="im-complexity-row">
        <div class="im-complexity-box wrong-box">
          <label>Wrong — Time</label><span>${m.wrongTime}</span>
          <label style="margin-top:0.4rem">Wrong — Space</label><span>${m.wrongSpace}</span>
        </div>
        <div class="im-complexity-box right-box">
          <label>Correct — Time</label><span>${m.rightTime}</span>
          <label style="margin-top:0.4rem">Correct — Space</label><span>${m.rightSpace}</span>
        </div>
      </div>
    </div>`;

  document.getElementById("imModal").classList.add("active");
}

/* ─── Init ─── */
function initMistakes() {
  if (!document.getElementById("imGrid")) return;

  document.getElementById("imTotal").textContent = MISTAKES.length;
  renderEdgeCases();
  renderOptTips();
  renderGrid(MISTAKES);

  let activeCat = "all";
  let searchQ   = "";

  function filter() {
    const results = MISTAKES.filter(m => {
      const matchCat    = activeCat === "all" || m.cat === activeCat;
      const matchSearch = !searchQ || m.title.toLowerCase().includes(searchQ) || m.desc.toLowerCase().includes(searchQ) || m.cat.includes(searchQ);
      return matchCat && matchSearch;
    });
    renderGrid(results);
  }

  document.querySelectorAll("#imFilters .filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#imFilters .filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeCat = btn.dataset.cat;
      filter();
    });
  });

  document.getElementById("imSearch").addEventListener("input", (e) => {
    searchQ = e.target.value.toLowerCase().trim();
    filter();
  });

  const modal     = document.getElementById("imModal");
  const closeBtn  = document.getElementById("imModalClose");
  closeBtn.addEventListener("click", () => modal.classList.remove("active"));
  modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("active"); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") modal.classList.remove("active"); });
}