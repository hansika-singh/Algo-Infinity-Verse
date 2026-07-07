// ==========================================================================
// ALGORITHM FAMILY TREE - ENGINE & DATABASE
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  initFamilyTree();
});

// App State
let activeNodeId = null;
let activeFamilyFilter = "all";
let searchTimeout = null;

// ──────────────────────────────────────────────────────────────────────────
// 🌳 ALGORITHM NODES DATABASE
// ──────────────────────────────────────────────────────────────────────────
const ALGO_NODES = {
  // === SEARCH FAMILY ===
  linear_search: {
    id: "linear_search",
    name: "Linear Search",
    family: "search",
    parent: null,
    x: 80,
    y: 80,
    complexity: { worst: "O(N)", avg: "O(N)", space: "O(1)" },
    history: "One of the oldest search algorithms. Its mathematical principles date back to ancient records of sequential searching in inventories, though it was formalized in computing in the late 1940s.",
    evolution: "The ultimate ancestor of search. Simply loops through each element sequentially until it finds a match.",
    codeLang: "JavaScript",
    code: [
      "function linearSearch(arr, target) {",
      "  for (let i = 0; i < arr.length; i++) {",
      "    if (arr[i] === target) return i;",
      "  }",
      "  return -1;",
      "}"
    ]
  },
  binary_search: {
    id: "binary_search",
    name: "Binary Search",
    family: "search",
    parent: "linear_search",
    x: 280,
    y: 80,
    complexity: { worst: "O(log N)", avg: "O(log N)", space: "O(1)" },
    history: "John Mauchly published the first computer description of Binary Search in 1946. However, it took until 1962 for a fully bug-free implementation covering arbitrary bounds to be published by D.H. Lehmer.",
    evolution: "Evolved by requiring data to be sorted, enabling the search space to be halved at each iteration, optimizing sequential scans into logarithmic speed.",
    codeLang: "Python",
    code: [
      "def binary_search(arr, target):",
      "    low, high = 0, len(arr) - 1",
      "    while low <= high:",
      "        mid = (low + high) // 2",
      "        if arr[mid] == target: return mid",
      "        elif arr[mid] < target: low = mid + 1",
      "        else: high = mid - 1",
      "    return -1"
    ]
  },
  answer_search: {
    id: "answer_search",
    name: "Answer Space Search",
    family: "search",
    parent: "binary_search",
    x: 480,
    y: 40,
    complexity: { worst: "O(log K * N)", avg: "O(log K * N)", space: "O(1)" },
    history: "Emerging from competitive programming and operations research, this technique adapts binary search to solve boundary optimization questions without reading from static arrays.",
    evolution: "Evolved by mapping the search space onto a virtual monotonic 'answer range' instead of a physical array, querying a boolean feasibility check function `f(x)` at each midpoint.",
    codeLang: "JavaScript",
    code: [
      "function minEatingSpeed(piles, h) {",
      "  let lo = 1, hi = Math.max(...piles);",
      "  while (lo < hi) {",
      "    let mid = Math.floor((lo + hi) / 2);",
      "    if (canFinish(piles, mid, h)) hi = mid;",
      "    else lo = mid + 1;",
      "  }",
      "  return lo;",
      "}"
    ]
  },
  parametric_search: {
    id: "parametric_search",
    name: "Parametric Search",
    family: "search",
    parent: "binary_search",
    x: 480,
    y: 100,
    complexity: { worst: "O(log N * T)", avg: "O(log N * T)", space: "O(N)" },
    history: "Introduced by Nimrod Megiddo in 1983. It is widely used in computational geometry for optimizing complex ratio equations.",
    evolution: "A sophisticated extension of search. It embeds a parallel sorting network to solve optimization parameters where checking feasibility directly is too expensive.",
    codeLang: "Python",
    code: [
      "# Megiddo's Parametric Search Schema",
      "def parametric_search(low, high, decision_test):",
      "    while (high - low) > epsilon:",
      "        mid = (low + high) / 2.0",
      "        if decision_test(mid):",
      "            high = mid",
      "        else:",
      "            low = mid",
      "    return low"
    ]
  },
  ternary_search: {
    id: "ternary_search",
    name: "Ternary Search",
    family: "search",
    parent: "binary_search",
    x: 480,
    y: 160,
    complexity: { worst: "O(log N)", avg: "O(log N)", space: "O(1)" },
    history: "Ternary search is a classic numerical optimization trick dating back to mid-20th-century optimization theory to find local maxima/minima.",
    evolution: "Evolved by splitting the search space into three parts (using two midpoints, `m1` and `m2`) to find the peak (extrema) of a unimodal function.",
    codeLang: "JavaScript",
    code: [
      "function ternarySearch(f, low, high) {",
      "  while (high - low > 1e-9) {",
      "    let m1 = low + (high - low) / 3;",
      "    let m2 = high - (high - low) / 3;",
      "    if (f(m1) < f(m2)) low = m1;",
      "    else high = m2;",
      "  }",
      "  return (low + high) / 2;",
      "}"
    ]
  },
  interpolation_search: {
    id: "interpolation_search",
    name: "Interpolation Search",
    family: "search",
    parent: "binary_search",
    x: 480,
    y: 220,
    complexity: { worst: "O(N)", avg: "O(log(log N))", space: "O(1)" },
    history: "First described by W. W. Peterson in 1957. It mirrors how humans look up names in phone directories.",
    evolution: "Evolved by calculating a slope prediction to guess where the target resides. If values are uniformly distributed, it yields a super-fast O(log(log N)) average search time.",
    codeLang: "JavaScript",
    code: [
      "function interpolationSearch(arr, target) {",
      "  let low = 0, high = arr.length - 1;",
      "  while (low <= high && target >= arr[low] && target <= arr[high]) {",
      "    let pos = low + Math.floor(((target - arr[low]) * (high - low)) / (arr[high] - arr[low]));",
      "    if (arr[pos] === target) return pos;",
      "    if (arr[pos] < target) low = pos + 1;",
      "    else high = pos - 1;",
      "  }",
      "  return -1;",
      "}"
    ]
  },

  // === SORT FAMILY ===
  sort_base: {
    id: "sort_base",
    name: "Unsorted Pile",
    family: "sort",
    parent: null,
    x: 80,
    y: 340,
    complexity: { worst: "O(N^2)", avg: "O(N^2)", space: "O(1)" },
    history: "Before formalized algorithms, sorting relied on primitive heuristics (e.g., physical shuffling, manual heap building).",
    evolution: "The base ancestor representing unsorted structures awaiting order.",
    codeLang: "JavaScript",
    code: [
      "// Chaotic collections awaiting order"
    ]
  },
  comparison_sort: {
    id: "comparison_sort",
    name: "Comparison Sorts",
    family: "sort",
    parent: "sort_base",
    x: 260,
    y: 310,
    complexity: { worst: "O(N^2)", avg: "O(N log N)", space: "O(1)" },
    history: "Formalized in early mainframes during the 1940s. John von Neumann designed Merge Sort in 1945.",
    evolution: "Evolved by organizing items by comparing pairs. Inherent theoretical sorting bound is O(N log N).",
    codeLang: "JavaScript",
    code: [
      "// Algorithms comparing items via '<' or '>'"
    ]
  },
  non_comparison_sort: {
    id: "non_comparison_sort",
    name: "Non-Comparison",
    family: "sort",
    parent: "sort_base",
    x: 260,
    y: 390,
    complexity: { worst: "O(N + K)", avg: "O(N + K)", space: "O(N + K)" },
    history: "Pioneered in punch-card machine sorters by Herman Hollerith in the late 19th century.",
    evolution: "Evolved by bypassing comparisons entirely and sorting elements based on integer keys or digit buckets, achieving linear O(N) times.",
    codeLang: "JavaScript",
    code: [
      "// Sorting via indexing/buckets, not comparisons"
    ]
  },
  bubble_sort: {
    id: "bubble_sort",
    name: "Bubble / Insertion",
    family: "sort",
    parent: "comparison_sort",
    x: 440,
    y: 260,
    complexity: { worst: "O(N^2)", avg: "O(N^2)", space: "O(1)" },
    history: "Pioneered in the 1950s. Extremely popular for teaching, but inefficient for production.",
    evolution: "Evolved by bubble-swapping adjacent elements iteratively until sorted.",
    codeLang: "JavaScript",
    code: [
      "function bubbleSort(arr) {",
      "  for(let i=0; i<arr.length; i++) {",
      "    for(let j=0; j<arr.length-i-1; j++) {",
      "      if(arr[j] > arr[j+1]) [arr[j], arr[j+1]] = [arr[j+1], arr[j]];",
      "    }",
      "  }",
      "}"
    ]
  },
  divide_conquer: {
    id: "divide_conquer",
    name: "Divide & Conquer",
    family: "sort",
    parent: "comparison_sort",
    x: 440,
    y: 310,
    complexity: { worst: "O(N log N)", avg: "O(N log N)", space: "O(N)" },
    history: "John von Neumann created Merge Sort in 1945. Tony Hoare developed Quick Sort in 1959.",
    evolution: "Evolved by splitting arrays into halves recursively, solving base cases, and merging them back.",
    codeLang: "JavaScript",
    code: [
      "// Splitting and merging arrays recursively"
    ]
  },
  merge_sort: {
    id: "merge_sort",
    name: "Merge Sort",
    family: "sort",
    parent: "divide_conquer",
    x: 620,
    y: 290,
    complexity: { worst: "O(N log N)", avg: "O(N log N)", space: "O(N)" },
    history: "Invented by John von Neumann in 1945 to run on the EDVAC computer, proving the utility of recursive memory stacks.",
    evolution: "Guarantees O(N log N) by splitting elements down to single arrays and performing linear merges.",
    codeLang: "JavaScript",
    code: [
      "function mergeSort(arr) {",
      "  if (arr.length <= 1) return arr;",
      "  let mid = Math.floor(arr.length / 2);",
      "  let left = mergeSort(arr.slice(0, mid));",
      "  let right = mergeSort(arr.slice(mid));",
      "  return merge(left, right);",
      "}"
    ]
  },
  quick_sort: {
    id: "quick_sort",
    name: "Quick Sort",
    family: "sort",
    parent: "divide_conquer",
    x: 620,
    y: 330,
    complexity: { worst: "O(N^2)", avg: "O(N log N)", space: "O(log N)" },
    history: "Developed by Tony Hoare in 1959 while working on machine translation of languages at Moscow State University.",
    evolution: "Evolved by partitioning arrays around a 'pivot' element, sorting in-place without the extra O(N) space Merge Sort requires.",
    codeLang: "Python",
    code: [
      "def quickSort(arr):",
      "    if len(arr) <= 1: return arr",
      "    pivot = arr[len(arr) // 2]",
      "    left = [x for x in arr if x < pivot]",
      "    middle = [x for x in arr if x == pivot]",
      "    right = [x for x in arr if x > pivot]",
      "    return quickSort(left) + middle + quickSort(right)"
    ]
  },
  tim_sort: {
    id: "tim_sort",
    name: "Tim Sort",
    family: "sort",
    parent: "merge_sort",
    x: 800,
    y: 290,
    complexity: { worst: "O(N log N)", avg: "O(N log N)", space: "O(N)" },
    history: "Created by Tim Peters in 2002 for use in the Python programming language. It is now the default sorting algorithm in Java, Python, and Chrome V8.",
    evolution: "Evolved by combining Merge Sort and Insertion Sort. It identifies pre-sorted runs and uses binary insertion sort on short sub-runs to minimize merge overhead in real-world data.",
    codeLang: "Python",
    code: [
      "# Hybrid Sorting (Merge + Insertion)",
      "def tim_sort(arr):",
      "    # Runs insertion sort on small chunks,",
      "    # then merges sorted runs."
    ]
  },
  counting_sort: {
    id: "counting_sort",
    name: "Counting Sort",
    family: "sort",
    parent: "non_comparison_sort",
    x: 440,
    y: 390,
    complexity: { worst: "O(N + K)", avg: "O(N + K)", space: "O(N + K)" },
    history: "Invented by Harold H. Seward in 1954 as part of his master's thesis at MIT on computer sorting methods.",
    evolution: "Creates an auxiliary array of size K (key range) to count value frequencies directly.",
    codeLang: "JavaScript",
    code: [
      "function countingSort(arr, maxVal) {",
      "  let counts = Array(maxVal + 1).fill(0);",
      "  arr.forEach(x => counts[x]++);",
      "  let idx = 0;",
      "  counts.forEach((c, val) => {",
      "    while(c-- > 0) arr[idx++] = val;",
      "  });",
      "}"
    ]
  },
  radix_sort: {
    id: "radix_sort",
    name: "Radix Sort",
    family: "sort",
    parent: "counting_sort",
    x: 620,
    y: 375,
    complexity: { worst: "O(D * (N + B))", avg: "O(D * (N + B))", space: "O(N + B)" },
    history: "Evolved directly from mechanical tabulating cards. Seward formalized computer radix sorting in 1954.",
    evolution: "Evolved by applying Counting Sort digit-by-digit, sorting numbers from least significant digit to most.",
    codeLang: "Python",
    code: [
      "def radixSort(arr):",
      "    # Sorts digit by digit using counting sort",
      "    # as the stable sorting subroutine."
    ]
  },
  bucket_sort: {
    id: "bucket_sort",
    name: "Bucket Sort",
    family: "sort",
    parent: "counting_sort",
    x: 620,
    y: 415,
    complexity: { worst: "O(N^2)", avg: "O(N + K)", space: "O(N + K)" },
    history: "Bucket sort has been used since the early days of punch-card sorting. Described in papers in the mid 1950s.",
    evolution: "Evolved by dividing elements into K intervals ('buckets') and sorting buckets individually using Insertion Sort.",
    codeLang: "JavaScript",
    code: [
      "function bucketSort(arr, bucketSize) {",
      "  # Distribute elements into buckets,",
      "  # sort each bucket, and concatenate."
    ]
  },

  // === GRAPH FAMILY ===
  graph_base: {
    id: "graph_base",
    name: "Network Graphs",
    family: "graph",
    parent: null,
    x: 80,
    y: 530,
    complexity: { worst: "O(V + E)", avg: "O(V + E)", space: "O(V)" },
    history: "Graph theory was initiated by Leonhard Euler's 1736 paper on Seven Bridges of Königsberg.",
    evolution: "The base representation of connected vertices (V) and edges (E).",
    codeLang: "JavaScript",
    code: [
      "// Vertex networks and adjacency matrices"
    ]
  },
  traversal: {
    id: "traversal",
    name: "Graph Traversals",
    family: "graph",
    parent: "graph_base",
    x: 260,
    y: 500,
    complexity: { worst: "O(V + E)", avg: "O(V + E)", space: "O(V)" },
    history: "DFS was explored by Tremaux in the 19th century. BFS was formalized by Edward F. Moore in 1959.",
    evolution: "Evolved by visiting every reachable vertex systematically in a queue or stack structure.",
    codeLang: "JavaScript",
    code: [
      "// BFS queueing or DFS recursion frames"
    ]
  },
  shortest_path: {
    id: "shortest_path",
    name: "Shortest Paths",
    family: "graph",
    parent: "graph_base",
    x: 260,
    y: 580,
    complexity: { worst: "O(V^3)", avg: "O(VE)", space: "O(V)" },
    history: "Spurred by telecommunication route design and GPS mapping projects in the 1950s.",
    evolution: "Evolved from pure traversals by relaxing edge weights iteratively to find path minimums.",
    codeLang: "JavaScript",
    code: [
      "// Finding minimum path cost routes"
    ]
  },
  dfs: {
    id: "dfs",
    name: "DFS Traversal",
    family: "graph",
    parent: "traversal",
    x: 440,
    y: 470,
    complexity: { worst: "O(V + E)", avg: "O(V + E)", space: "O(V)" },
    history: "Labyrinths were solved using depth-first techniques in the 1800s. Hopcroft and Tarjan published computer versions in 1972.",
    evolution: "Explores paths as deep as possible recursively before backtracking.",
    codeLang: "JavaScript",
    code: [
      "function dfs(node, visited) {",
      "  visited.add(node);",
      "  node.neighbors.forEach(n => {",
      "    if (!visited.has(n)) dfs(n, visited);",
      "  });",
      "}"
    ]
  },
  bfs: {
    id: "bfs",
    name: "BFS Traversal",
    family: "graph",
    parent: "traversal",
    x: 440,
    y: 510,
    complexity: { worst: "O(V + E)", avg: "O(V + E)", space: "O(V)" },
    history: "Formalized by Edward F. Moore in 1959 to solve maze navigation paths. E. Moore also developed the Moore's algorithm.",
    evolution: "Explores vertices level-by-level using a Queue. Guarantees shortest path in unweighted graphs.",
    codeLang: "JavaScript",
    code: [
      "function bfs(start) {",
      "  let q = [start], visited = new Set([start]);",
      "  while(q.length) {",
      "    let u = q.shift();",
      "    u.neighbors.forEach(v => {",
      "      if(!visited.has(v)) { visited.add(v); q.push(v); }",
      "    });",
      "  }",
      "}"
    ]
  },
  dijkstra: {
    id: "dijkstra",
    name: "Dijkstra's Algorithm",
    family: "graph",
    parent: "shortest_path",
    x: 440,
    y: 560,
    complexity: { worst: "O((V + E) log V)", avg: "O((V + E) log V)", space: "O(V)" },
    history: "Edsger Dijkstra designed it in 1956 in 20 minutes to demonstrate the computing capacity of the new ARMAC processor.",
    evolution: "Evolved from BFS by adding a Min-Priority Queue, allowing edge weights to differ (positive weighted graphs).",
    codeLang: "JavaScript",
    code: [
      "function dijkstra(graph, start) {",
      "  let dist = {}, pq = new MinPriorityQueue();",
      "  dist[start] = 0; pq.insert(start, 0);",
      "  while (!pq.isEmpty()) {",
      "    let u = pq.extractMin();",
      "    for(let v in graph[u]) {",
      "      let alt = dist[u] + graph[u][v];",
      "      if(alt < dist[v]) { dist[v] = alt; pq.insert(v, alt); }",
      "    }",
      "  }",
      "}"
    ]
  },
  bellman_ford: {
    id: "bellman_ford",
    name: "Bellman-Ford",
    family: "graph",
    parent: "shortest_path",
    x: 440,
    y: 610,
    complexity: { worst: "O(VE)", avg: "O(VE)", space: "O(V)" },
    history: "Published independently by Alfonso Shimbel (1955), Richard Bellman (1958), and Lester Ford (1956).",
    evolution: "Evolved to handle negative edge weights. It loops V-1 times, relaxing all edges. It detects negative cycles.",
    codeLang: "Python",
    code: [
      "def bellmanFord(edges, V, start):",
      "    dist = [float('inf')] * V; dist[start] = 0",
      "    for _ in range(V - 1):",
      "        for u, v, w in edges:",
      "            if dist[u] + w < dist[v]: dist[v] = dist[u] + w",
      "    # Checks for negative weight cycles",
      "    for u, v, w in edges:",
      "        if dist[u] + w < dist[v]: print('Negative cycle!')"
    ]
  },
  a_star: {
    id: "a_star",
    name: "A* Pathfinding",
    family: "graph",
    parent: "dijkstra",
    x: 620,
    y: 535,
    complexity: { worst: "O(E)", avg: "O(bd) heuristic", space: "O(V)" },
    history: "Designed in 1968 by Peter Hart, Nils Nilsson, and Bertram Raphael at Stanford Research Institute to optimize robot navigation (Shakey).",
    evolution: "Evolved from Dijkstra by adding an optimistic heuristic estimate $h(n)$ (e.g. Euclidean distance to goal) to guide path relaxation.",
    codeLang: "JavaScript",
    code: [
      "function aStar(start, goal, h) {",
      "  let openSet = new MinPriorityQueue();",
      "  let gScore = { [start]: 0 }, fScore = { [start]: h(start) };",
      "  openSet.insert(start, fScore[start]);",
      "  // Traverses neighbors using f = g + h",
      "}"
    ]
  },
  prim_mst: {
    id: "prim_mst",
    name: "Prim's MST",
    family: "graph",
    parent: "dijkstra",
    x: 620,
    y: 575,
    complexity: { worst: "O((V + E) log V)", avg: "O((V + E) log V)", space: "O(V)" },
    history: "Designed by Vojtěch Jarník (1930), rediscovered by Robert Prim (1957), and Edsger Dijkstra (1959).",
    evolution: "An evolutionary sibling of Dijkstra. Instead of calculating cumulative distance from one start node, it calculates shortest distance to the expanding tree.",
    codeLang: "JavaScript",
    code: [
      "function primsMST(graph) {",
      "  let mst = [], pq = new MinPriorityQueue();",
      "  // Sibling to Dijkstra's structure,",
      "  // but relaxes edges directly to active MST.",
      "}"
    ]
  },
  floyd_warshall: {
    id: "floyd_warshall",
    name: "Floyd-Warshall",
    family: "graph",
    parent: "bellman_ford",
    x: 620,
    y: 615,
    complexity: { worst: "O(V^3)", avg: "O(V^3)", space: "O(V^2)" },
    history: "Published by Robert Floyd in 1962. It is a classic showcase of Dynamic Programming.",
    evolution: "Evolved to find shortest paths between ALL pairs of vertices. Uses three nested loops, comparing path `i -> j` with path `i -> k -> j`.",
    codeLang: "JavaScript",
    code: [
      "function floydWarshall(dist, V) {",
      "  for(let k=0; k<V; k++) {",
      "    for(let i=0; i<V; i++) {",
      "      for(let j=0; j<V; j++) {",
      "        dist[i][j] = Math.min(dist[i][j], dist[i][k] + dist[k][j]);",
      "      }",
      "    }",
      "  }",
      "}"
    ]
  },

  // === DYNAMIC PROGRAMMING FAMILY ===
  recursion_base: {
    id: "recursion_base",
    name: "Recursion Stack",
    family: "dp",
    parent: null,
    x: 820,
    y: 70,
    complexity: { worst: "O(2^N)", avg: "O(2^N)", space: "O(N)" },
    history: "Recursion is a mathematical concept formalized in lambda calculus and logic in the early 20th century.",
    evolution: "The ancestor of DP. Calls itself on subproblems, creating exponential redundant branches.",
    codeLang: "JavaScript",
    code: [
      "function solve(n) {",
      "  if (n <= 1) return n;",
      "  return solve(n-1) + solve(n-2);",
      "}"
    ]
  },
  memoization: {
    id: "memoization",
    name: "Memoization",
    family: "dp",
    parent: "recursion_base",
    x: 1000,
    y: 70,
    complexity: { worst: "O(N)", avg: "O(N)", space: "O(N)" },
    history: "Coined by Donald Michie in 1968, deriving from the Latin 'memorandum' ('to be remembered').",
    evolution: "Evolved by adding a memory cache to standard recursive functions, stopping execution of overlapping subproblems.",
    codeLang: "JavaScript",
    code: [
      "let memo = {};",
      "function solve(n) {",
      "  if (n in memo) return memo[n];",
      "  if (n <= 1) return n;",
      "  memo[n] = solve(n-1) + solve(n-2);",
      "  return memo[n];",
      "}"
    ]
  },
  tabulation: {
    id: "tabulation",
    name: "Tabulation (DP)",
    family: "dp",
    parent: "memoization",
    x: 1180,
    y: 70,
    complexity: { worst: "O(N)", avg: "O(N)", space: "O(N)" },
    history: "Richard Bellman coined 'Dynamic Programming' in 1953 to hide mathematical research from a hostile Secretary of Defense.",
    evolution: "Evolved from Memoization by transforming the recursive call stack into a bottom-up table loop, eliminating call frame overhead.",
    codeLang: "Python",
    code: [
      "def solve(n):",
      "    dp = [0] * (n + 1)",
      "    dp[1] = 1",
      "    for i in range(2, n + 1):",
      "        dp[i] = dp[i-1] + dp[i-2]",
      "    return dp[n]"
    ]
  },
  knapsack: {
    id: "knapsack",
    name: "Knapsack DP",
    family: "dp",
    parent: "tabulation",
    x: 1360,
    y: 30,
    complexity: { worst: "O(NW)", avg: "O(NW)", space: "O(NW)" },
    history: "First formulated by George Dantzig in 1957. The knapsack optimization remains a cryptography benchmark.",
    evolution: "Applies tabulation loops to optimization: builds rows of item subsets and columns of capacity configurations.",
    codeLang: "JavaScript",
    code: [
      "function knapsack(wts, vals, cap) {",
      "  // Compare including item vs excluding item",
      "  // in a 2D capacity table.",
      "}"
    ]
  },
  lcs: {
    id: "lcs",
    name: "LCS Sequence",
    family: "dp",
    parent: "tabulation",
    x: 1360,
    y: 80,
    complexity: { worst: "O(NM)", avg: "O(NM)", space: "O(NM)" },
    history: "Longest Common Subsequence was formalized in bioinformatics and string research in the 1970s.",
    evolution: "Applies tabulation grid optimization to strings: checks alignment, updating index `(i, j)` based on characters match.",
    codeLang: "JavaScript",
    code: [
      "// Grid traversal checking character matching"
    ]
  },
  mcm: {
    id: "mcm",
    name: "Matrix Chain",
    family: "dp",
    parent: "tabulation",
    x: 1360,
    y: 130,
    complexity: { worst: "O(N^3)", avg: "O(N^3)", space: "O(N^2)" },
    history: "Introduced by Godbole in 1973 to optimize linear algebra computations in computer systems.",
    evolution: "Pioneered Interval DP. It solves optimal partitions of brackets inside dynamic sub-intervals.",
    codeLang: "Python",
    code: [
      "# Interval DP: MCM Schema",
      "def mcm(p):",
      "    # Solves cost bounds for length L from 2 to N."
    ]
  },
  edit_distance: {
    id: "edit_distance",
    name: "Edit Distance",
    family: "dp",
    parent: "lcs",
    x: 1540,
    y: 80,
    complexity: { worst: "O(NM)", avg: "O(NM)", space: "O(NM)" },
    history: "First described by Vladimir Levenshtein in 1965 to quantify string mutations in binary codes.",
    evolution: "Evolved directly from LCS. When characters mismatch, it adds insertions, deletions, and replacements costs.",
    codeLang: "JavaScript",
    code: [
      "function editDistance(s1, s2) {",
      "  // Matches LCS structure but counts costs: min(insert, delete, replace)",
      "}"
    ]
  }
};

// Colors mapping for category filters & badges
const CATEGORY_COLORS = {
  search: "#f59e0b", // Gold
  sort: "#10b981",   // Emerald green
  graph: "#06b6d4",  // Cyan
  dp: "#a855f7"      // Purple
};

// ──────────────────────────────────────────────────────────────────────────
// 🎨 FAMILY TREE CONTROLLER
// ──────────────────────────────────────────────────────────────────────────
function initFamilyTree() {
  // SVG Canvas
  const svg = document.getElementById("svg-tree-canvas");
  
  // HTML controls
  const searchInput = document.getElementById("search-node");
  const btnClearSearch = document.getElementById("btn-clear-search");
  const btnReset = document.getElementById("btn-reset-tree");
  const filterBtns = document.querySelectorAll(".filter-btn");
  const btnOpenCompare = document.getElementById("btn-open-compare");
  const btnCloseCompare = document.getElementById("btn-close-compare");
  const compareModal = document.getElementById("compare-modal");

  // Initial draw
  drawTree();

  // Drag and Scroll scrollbar navigation for SVG canvas
  initCanvasDrag();

  // Search input handler
  searchInput.addEventListener("input", () => {
    const val = searchInput.value.trim().toLowerCase();
    btnClearSearch.classList.toggle("hidden", val === "");
    
    // Debounce search
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchAndHighlightNode(val);
    }, 250);
  });

  btnClearSearch.addEventListener("click", () => {
    searchInput.value = "";
    btnClearSearch.classList.add("hidden");
    resetHighlights();
  });

  btnReset.addEventListener("click", () => {
    resetHighlights();
    searchInput.value = "";
    btnClearSearch.classList.add("hidden");
    centerTreeContainer();
  });

  // Filter Buttons
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeFamilyFilter = btn.getAttribute("data-family");
      applyFamilyFilter();
    });
  });

  // Modal Compare controls
  btnOpenCompare.addEventListener("click", () => {
    openCompareRoom();
  });

  btnCloseCompare.addEventListener("click", () => {
    compareModal.classList.add("hidden");
  });

  compareModal.addEventListener("click", (e) => {
    if (e.target === compareModal) compareModal.classList.add("hidden");
  });

  // Shortcut inside Inspector
  document.getElementById("btn-insp-compare-shortcut").addEventListener("click", () => {
    if (activeNodeId) {
      openCompareRoom(activeNodeId);
    }
  });

  // Populate comparison dropdowns initially
  populateCompareDropdowns();

  // Hide platform loading screen
  setTimeout(() => {
    const s = document.getElementById("loading-screen");
    if (s) s.classList.add("hidden");
  }, 1000);
}

// ──────────────────────────────────────────────────────────────────────────
// 🛠️ TREE DRAWING (NODE GRAPH BUILDER)
// ──────────────────────────────────────────────────────────────────────────
function drawTree() {
  const svg = document.getElementById("svg-tree-canvas");
  svg.innerHTML = "";

  // 1. Draw Connection Paths First
  Object.values(ALGO_NODES).forEach(node => {
    if (node.parent) {
      const parentNode = ALGO_NODES[node.parent];
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      
      const x1 = parentNode.x + 130; // parent right side
      const y1 = parentNode.y + 20;  // parent vertical center
      const x2 = node.x;             // child left side
      const y2 = node.y + 20;        // child vertical center

      const dx = Math.abs(x2 - x1);
      const cx1 = x1 + dx * 0.45;
      const cy1 = y1;
      const cx2 = x2 - dx * 0.45;
      const cy2 = y2;
      const d = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;

      path.setAttribute("d", d);
      path.setAttribute("class", "tree-edge-path");
      path.setAttribute("id", `edge-${parentNode.id}-${node.id}`);
      svg.appendChild(path);
    }
  });

  // 2. Draw Nodes (Rounded Rectangles)
  Object.values(ALGO_NODES).forEach(node => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "node-g");
    g.setAttribute("id", `node-${node.id}`);
    g.setAttribute("data-id", node.id);
    g.setAttribute("data-family", node.family);

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", node.x);
    rect.setAttribute("y", node.y);
    rect.setAttribute("width", "130");
    rect.setAttribute("height", "40");
    rect.setAttribute("class", "node-rect");
    g.appendChild(rect);

    // Indicator Badge (colored circle by family)
    const badgeColor = CATEGORY_COLORS[node.family] || "#fff";
    const badge = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    badge.setAttribute("cx", node.x + 15);
    badge.setAttribute("cy", node.y + 20);
    badge.setAttribute("r", "5");
    badge.setAttribute("class", "node-badge-circle");
    badge.style.setProperty("--badge-color", badgeColor);
    g.appendChild(badge);

    // Title text
    const textTitle = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textTitle.setAttribute("x", node.x + 28);
    textTitle.setAttribute("y", node.y + 19);
    textTitle.setAttribute("class", "node-text-title");
    textTitle.textContent = node.name;
    g.appendChild(textTitle);

    // Subtitle (Worst complexity)
    const textSub = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textSub.setAttribute("x", node.x + 28);
    textSub.setAttribute("y", node.y + 31);
    textSub.setAttribute("class", "node-text-subtitle");
    textSub.textContent = `Worst: ${node.complexity.worst}`;
    g.appendChild(textSub);

    // Click handler
    g.addEventListener("click", () => {
      selectAndTraceNode(node.id);
    });

    svg.appendChild(g);
  });
}

// ──────────────────────────────────────────────────────────────────────────
// 🎯 LINEAGE TRACING & HIGHLIGHTING
// ──────────────────────────────────────────────────────────────────────────
function selectAndTraceNode(nodeId) {
  activeNodeId = nodeId;
  const activeNode = ALGO_NODES[nodeId];

  // 1. Reset all visual states
  resetHighlights();

  // 2. Mark selected node active
  const selectedEl = document.getElementById(`node-${nodeId}`);
  if (selectedEl) selectedEl.classList.add("active-node");

  // 3. Trace Ancestors Upwards
  const ancestors = [];
  let currentParentId = activeNode.parent;
  while (currentParentId) {
    ancestors.push(currentParentId);
    currentParentId = ALGO_NODES[currentParentId].parent;
  }

  // 4. Trace Descendants Downwards
  const descendants = [];
  function collectDescendants(parentId) {
    Object.values(ALGO_NODES).forEach(node => {
      if (node.parent === parentId) {
        descendants.push(node.id);
        collectDescendants(node.id);
      }
    });
  }
  collectDescendants(nodeId);

  // 5. Apply Ancestor Highlights
  ancestors.forEach(aId => {
    const el = document.getElementById(`node-${aId}`);
    if (el) el.classList.add("ancestor-node");
  });

  // 6. Apply Descendant Highlights
  descendants.forEach(dId => {
    const el = document.getElementById(`node-${dId}`);
    if (el) el.classList.add("descendant-node");
  });

  // 7. Highlight connection lines (edges)
  // An edge from parent to child highlights as ancestor or descendant path
  Object.values(ALGO_NODES).forEach(node => {
    if (node.parent) {
      const edgeEl = document.getElementById(`edge-${node.parent}-${node.id}`);
      if (edgeEl) {
        // If target node is the active node OR ancestor, highlight as ancestor path
        if ((node.id === nodeId && ancestors.includes(node.parent)) || 
            (ancestors.includes(node.id) && ancestors.includes(node.parent))) {
          edgeEl.classList.add("ancestor-path");
        }
        // If target node is descendant AND parent is descendant or active node, highlight as descendant path
        else if ((descendants.includes(node.id) && node.parent === nodeId) ||
                 (descendants.includes(node.id) && descendants.includes(node.parent))) {
          edgeEl.classList.add("descendant-path");
        }
      }
    }
  });

  // 8. Display details in sidebar inspector
  displayNodeInspector(activeNode);
}

function resetHighlights() {
  document.querySelectorAll(".node-g").forEach(el => {
    el.classList.remove("active-node", "ancestor-node", "descendant-node");
  });
  document.querySelectorAll(".tree-edge-path").forEach(el => {
    el.classList.remove("ancestor-path", "descendant-path");
  });
}

// ──────────────────────────────────────────────────────────────────────────
// 🔍 SEARCH & FOCUS BEHAVIOR
// ──────────────────────────────────────────────────────────────────────────
function searchAndHighlightNode(query) {
  if (query === "") {
    resetHighlights();
    return;
  }

  // Find exact or partial match
  const matched = Object.values(ALGO_NODES).find(node => 
    node.name.toLowerCase().includes(query) || node.id.toLowerCase().includes(query)
  );

  if (matched) {
    selectAndTraceNode(matched.id);
    focusCanvasOnCoordinates(matched.x, matched.y);
  }
}

function focusCanvasOnCoordinates(x, y) {
  const container = document.getElementById("tree-canvas-container");
  if (!container) return;

  // Center scroll container on target coordinates
  const containerW = container.clientWidth;
  const containerH = container.clientHeight;

  // Offset node dimensions (130w, 40h)
  const targetX = x - (containerW / 2) + 65;
  const targetY = y - (containerH / 2) + 20;

  container.scrollTo({
    left: Math.max(0, targetX),
    top: Math.max(0, targetY),
    behavior: "smooth"
  });
}

function centerTreeContainer() {
  const container = document.getElementById("tree-canvas-container");
  if (container) {
    container.scrollTo({ left: 0, top: 0, behavior: "smooth" });
  }
}

// ──────────────────────────────────────────────────────────────────────────
// 🏷️ FAMILY CATEGORY FILTERS
// ──────────────────────────────────────────────────────────────────────────
function applyFamilyFilter() {
  const nodes = document.querySelectorAll(".node-g");
  const edges = document.querySelectorAll(".tree-edge-path");

  if (activeFamilyFilter === "all") {
    // Show everything
    nodes.forEach(n => n.style.opacity = "1");
    edges.forEach(e => e.style.opacity = "1");
  } else {
    // Fade out elements not belonging to filtered family
    nodes.forEach(n => {
      const family = n.getAttribute("data-family");
      n.style.opacity = (family === activeFamilyFilter) ? "1" : "0.15";
    });

    edges.forEach(e => {
      // Extract nodes from id: edge-[parent]-[child]
      const idParts = e.id.replace("edge-", "").split("-");
      if (idParts.length === 2) {
        const childNode = ALGO_NODES[idParts[1]];
        if (childNode) {
          e.style.opacity = (childNode.family === activeFamilyFilter) ? "0.6" : "0.08";
        }
      }
    });
  }
}

// Adjacency scroll/drag mechanic
function initCanvasDrag() {
  const container = document.getElementById("tree-canvas-container");
  let isDown = false;
  let startX;
  let startY;
  let scrollLeft;
  let scrollTop;

  container.addEventListener("mousedown", (e) => {
    // Only drag if left click and not clicking on a node
    if (e.button !== 0 || e.target.closest(".node-g")) return;
    isDown = true;
    container.style.cursor = "grabbing";
    startX = e.pageX - container.offsetLeft;
    startY = e.pageY - container.offsetTop;
    scrollLeft = container.scrollLeft;
    scrollTop = container.scrollTop;
  });

  container.addEventListener("mouseleave", () => {
    isDown = false;
    container.style.cursor = "grab";
  });

  container.addEventListener("mouseup", () => {
    isDown = false;
    container.style.cursor = "grab";
  });

  container.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const y = e.pageY - container.offsetTop;
    const walkX = (x - startX) * 1.5;
    const walkY = (y - startY) * 1.5;
    container.scrollLeft = scrollLeft - walkX;
    container.scrollTop = scrollTop - walkY;
  });
}

// ──────────────────────────────────────────────────────────────────────────
// 🗃️ SIDEBAR INSPECTOR RENDER
// ──────────────────────────────────────────────────────────────────────────
function displayNodeInspector(node) {
  document.getElementById("inspector-placeholder").classList.add("hidden");
  
  const content = document.getElementById("inspector-content");
  content.classList.remove("hidden");

  // Set family badge
  const badge = document.getElementById("insp-badge-family");
  badge.textContent = node.family;
  badge.style.borderColor = CATEGORY_COLORS[node.family];
  badge.style.color = CATEGORY_COLORS[node.family];
  badge.style.backgroundColor = `${CATEGORY_COLORS[node.family]}1A`; // 10% opacity

  // Name, History, Evolution
  document.getElementById("insp-node-name").textContent = node.name;
  document.getElementById("insp-evolution-desc").innerHTML = node.evolution;
  document.getElementById("insp-history-text").textContent = node.history;

  // Complexities
  document.getElementById("insp-val-time-worst").textContent = node.complexity.worst;
  document.getElementById("insp-val-time-avg").textContent = node.complexity.avg;
  document.getElementById("insp-val-space").textContent = node.complexity.space;

  // Code Block
  document.getElementById("insp-code-lang").textContent = node.codeLang;
  const codeBody = document.getElementById("insp-code-body");
  codeBody.textContent = node.code.join("\n");
}

// ──────────────────────────────────────────────────────────────────────────
// 👥 THE COMPARATIVE REUNION ROOM
// ──────────────────────────────────────────────────────────────────────────
function populateCompareDropdowns() {
  const sel1 = document.getElementById("select-compare-1");
  const sel2 = document.getElementById("select-compare-2");
  
  sel1.innerHTML = "";
  sel2.innerHTML = "";

  // Sort nodes alphabetically for easy dropdown navigation
  const sortedNodes = Object.values(ALGO_NODES).sort((a, b) => a.name.localeCompare(b.name));

  sortedNodes.forEach(node => {
    // Skip empty base helper nodes
    if (node.id.includes("_base") || node.id === "divide_conquer" || node.id === "comparison_sort" || node.id === "non_comparison_sort") return;

    const opt1 = document.createElement("option");
    opt1.value = node.id;
    opt1.textContent = node.name;
    sel1.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = node.id;
    opt2.textContent = node.name;
    sel2.appendChild(opt2);
  });

  // Attach change listeners
  sel1.addEventListener("change", updateComparisonTable);
  sel2.addEventListener("change", updateComparisonTable);
}

function openCompareRoom(defaultNodeId = null) {
  const compareModal = document.getElementById("compare-modal");
  compareModal.classList.remove("hidden");

  const sel1 = document.getElementById("select-compare-1");
  const sel2 = document.getElementById("select-compare-2");

  if (defaultNodeId) {
    sel1.value = defaultNodeId;
    
    // Choose a smart default comparison node (e.g. parent or child)
    const activeNode = ALGO_NODES[defaultNodeId];
    if (activeNode.parent) {
      sel2.value = activeNode.parent;
    } else {
      // Find first child
      const child = Object.values(ALGO_NODES).find(n => n.parent === defaultNodeId);
      if (child) sel2.value = child.id;
    }
  } else {
    // Default selection
    sel1.value = "binary_search";
    sel2.value = "linear_search";
  }

  updateComparisonTable();
}

function updateComparisonTable() {
  const id1 = document.getElementById("select-compare-1").value;
  const id2 = document.getElementById("select-compare-2").value;

  const node1 = ALGO_NODES[id1];
  const node2 = ALGO_NODES[id2];

  if (!node1 || !node2) return;

  // Header titles
  document.getElementById("compare-col-header-1").textContent = node1.name;
  document.getElementById("compare-col-header-2").textContent = node2.name;

  // Family Line
  document.getElementById("comp-family-1").innerHTML = `<span class="badge" style="color: ${CATEGORY_COLORS[node1.family]}; border-color: ${CATEGORY_COLORS[node1.family]}; background-color: ${CATEGORY_COLORS[node1.family]}1A">${node1.family}</span>`;
  document.getElementById("comp-family-2").innerHTML = `<span class="badge" style="color: ${CATEGORY_COLORS[node2.family]}; border-color: ${CATEGORY_COLORS[node2.family]}; background-color: ${CATEGORY_COLORS[node2.family]}1A">${node2.family}</span>`;

  // Complexities
  document.getElementById("comp-time-worst-1").textContent = node1.complexity.worst;
  document.getElementById("comp-time-worst-2").textContent = node2.complexity.worst;
  
  document.getElementById("comp-time-avg-1").textContent = node1.complexity.avg;
  document.getElementById("comp-time-avg-2").textContent = node2.complexity.avg;

  document.getElementById("comp-space-1").textContent = node1.complexity.space;
  document.getElementById("comp-space-2").textContent = node2.complexity.space;

  // Mutation description
  document.getElementById("comp-mutation-1").innerHTML = node1.evolution;
  document.getElementById("comp-mutation-2").innerHTML = node2.evolution;

  // Histories
  document.getElementById("comp-desc-1").textContent = node1.history;
  document.getElementById("comp-desc-2").textContent = node2.history;

  // Code signature snippets
  const codeBody1 = document.getElementById("comp-code-1");
  const codeBody2 = document.getElementById("comp-code-2");
  
  codeBody1.textContent = node1.code.join("\n");
  codeBody2.textContent = node2.code.join("\n");
}
